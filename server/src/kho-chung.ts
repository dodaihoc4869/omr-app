// KHO CÂU CHUNG (thử tải 270 em, 28/10 — D1 sao): siêu dữ liệu câu (`cau_meta`, khi khớp chỉ mục) + nhãn kỹ năng (`omni_q`) dùng cho
//   · omni-d1.ts `docCauKho` / `docDongQ` (dựng hồ sơ OMNI, Q của câu),
//   · hanh-trinh-v5-d1.ts `dungDanhMuc` (danh mục Hành trình).
// Trước: mỗi lần dựng đọc theo lô qid (cau_meta 13.782 lần × ~4.800 dòng, omni_q 7.564 × ~5.300, danh mục 3.080 × ~24.700). Đệm theo isolate KHÔNG cứu được:
// giờ cao điểm Worker chạy trên rất nhiều isolate ngắn hạn (lượt đo lại: 1.020 lần nạp toàn kho / 13 phút ⇒ mỗi isolate chỉ phục vụ ~20 yêu cầu).
// Nay: BẢN CHỤP DÙNG CHUNG trong D1 (`kho_chup`, chỉ-thêm): cả kho nén thành vài dòng JSON (~≤ 900 KB/dòng), khoá theo DẤU KHO (`dauKhoCau`) + tuổi ≤ 10 phút.
// Isolate mới: MỘT lô đọc (dấu + các dòng chụp) ⇒ vài dòng thay ~30 nghìn. Chụp cũ / chưa có ⇒ đọc toàn bảng như cũ một lần rồi cất NỀN bản chụp mới.
// Trong isolate: giữ 5 phút. Kho chưa khớp chỉ mục ⇒ không có dòng cau_meta ⇒ nơi dùng đi đường cũ theo lô (không đổi kết quả).
// Công tắc: tắt dưới vitest (test cũ giữ đường theo lô); test riêng bật bằng `batKhoChung`.
import type { Env } from './kieu'
import { KHOP } from './cau-meta'
import { dauKhoCau } from './dau-kho-cau'
import { envGhiRieng } from './doc-d1-theo-luot'
import { chayDdlMotLan } from './ddl-mot-lan'
import { dbGoc } from './cau-hinh-dem'

type Row = Record<string, unknown>
/** Cột của một dòng cau_meta trong bản chụp (thứ tự cố định). */
export const COT_CAU = ['ma_de', 'qid', 'content_group', 'dang', 'phan', 'muc_do', 'ten_dang', 'chuyen_de', 'kien_thuc', 'kien_thuc_y', 'tu_luan', 'reviewed', 'sao', 'nhan_ht'] as const
export type DongCau = Record<(typeof COT_CAU)[number], unknown>
export interface DongQ { qid: string; y: unknown; vkn_json: unknown; nguon: unknown; duyet: 0 | 1 }
export interface KhoChung {
  /** Dòng cau_meta (KHOP), sắp (qid, ma_de) — rỗng ⇒ kho chưa khớp chỉ mục (nơi dùng đi đường cũ). */
  cau: DongCau[]
  /** Các dòng cau_meta theo qid (đúng thứ tự ma_de). */
  theoQid: Map<string, DongCau[]>
  q: DongQ[]
  qTheoQid: Map<string, DongQ[]>
}

const HAN_ISOLATE_MS = 5 * 60_000
const HAN_CHUP_MS = 10 * 60_000
const CO_PHAN = 900_000
const KHOA_CHUP = 'kho_omni_v1'
const LENH_BANG_CHUP = ['CREATE TABLE IF NOT EXISTS kho_chup (khoa TEXT NOT NULL, phan INTEGER NOT NULL, dau TEXT NOT NULL, luc INTEGER NOT NULL, json TEXT NOT NULL, PRIMARY KEY (khoa, phan))']
const SQL_CAU = `SELECT ${COT_CAU.join(', ')} FROM cau_meta WHERE ${KHOP} ORDER BY qid, ma_de`
const SQL_Q = 'SELECT qid, y, vkn_json, nguon, CASE WHEN duyet_luc IS NOT NULL THEN 1 ELSE 0 END AS duyet FROM omni_q ORDER BY qid, y'

let bat = !(globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env?.VITEST
// Đệm trong isolate theo D1 GỐC (mỗi lượt gọi bọc D1 riêng — khoá theo đối tượng gốc như các đệm khác).
let dem = new WeakMap<object, { k: KhoChung; luc: number }>()
let dang = new WeakMap<object, Promise<KhoChung | null>>()
export function batKhoChung(b: boolean): void { bat = b; xoaKhoChung() }
export function xoaKhoChung(): void { dem = new WeakMap(); dang = new WeakMap() }
/** Bỏ bản chụp dùng chung (sau khi ghi `omni_q` — thầy duyệt Q / A.I gợi / kiểm định tuần): isolate nào nạp sau cũng đọc toàn bảng mới. Không ném. */
export async function boKhoChup(env: Env): Promise<void> {
  xoaKhoChung()
  try { await chayDdlMotLan(env, 'kho_chup_2810', LENH_BANG_CHUP); await env.DB.prepare('DELETE FROM kho_chup').run() } catch (e) { console.error('[kho-chung] bỏ bản chụp lỗi:', e instanceof Error ? e.message : e) }
}

function dung(cauTho: unknown[][], qTho: unknown[][]): KhoChung {
  const cau = cauTho.map((a) => Object.fromEntries(COT_CAU.map((c, i) => [c, a[i] ?? null])) as DongCau)
  const theoQid = new Map<string, DongCau[]>()
  for (const x of cau) { const q = String(x.qid); const a = theoQid.get(q); if (a) a.push(x); else theoQid.set(q, [x]) }
  const q = qTho.map((a) => ({ qid: String(a[0]), y: a[1], vkn_json: a[2], nguon: a[3], duyet: (a[4] === 1 ? 1 : 0) as 0 | 1 }))
  const qTheoQid = new Map<string, DongQ[]>()
  for (const x of q) { const a = qTheoQid.get(x.qid); if (a) a.push(x); else qTheoQid.set(x.qid, [x]) }
  return { cau, theoQid, q, qTheoQid }
}

async function nap(env: Env, now: number): Promise<KhoChung | null> {
  // MỘT lô: dấu kho hiện tại + mọi dòng của bản chụp. Bảng chụp chưa có ⇒ lô lỗi ⇒ đọc dấu riêng.
  let dau = ''
  let dong: Row[] = []
  try {
    const [d, c] = await env.DB.batch<Row>([
      env.DB.prepare("SELECT COUNT(*)||'|'||COALESCE(MAX(indexed_at),'') AS d FROM game_v2_index"),
      env.DB.prepare('SELECT phan, dau, luc, json FROM kho_chup WHERE khoa = ? ORDER BY phan').bind(KHOA_CHUP),
    ])
    dau = String(d?.results?.[0]?.d ?? '')
    dong = c?.results ?? []
  } catch { dau = await dauKhoCau(env) }
  if (dau && dong.length && dong.every((x) => String(x.dau) === dau && Number(x.luc) === Number(dong[0]!.luc)) && now - Number(dong[0]!.luc) < HAN_CHUP_MS && now >= Number(dong[0]!.luc)) {
    try {
      const o = JSON.parse(dong.map((x) => String(x.json)).join('')) as { cau: unknown[][]; q: unknown[][] }
      if (Array.isArray(o.cau) && Array.isArray(o.q)) return dung(o.cau, o.q)
    } catch { /* bản chụp hỏng ⇒ đọc lại */ }
  }
  // Chưa có / cũ ⇒ đọc toàn bảng (như cũ) rồi cất NỀN bản chụp mới.
  const [rc, rq] = await env.DB.batch<Row>([env.DB.prepare(SQL_CAU), env.DB.prepare(SQL_Q)])
  const cauTho = (rc?.results ?? []).map((x) => COT_CAU.map((c) => x[c] ?? null))
  const qTho = (rq?.results ?? []).map((x) => [x.qid, x.y, x.vkn_json, x.nguon, Number(x.duyet) === 1 ? 1 : 0])
  if (dau) void catChup(envGhiRieng(env), dau, now, JSON.stringify({ cau: cauTho, q: qTho })).catch((e) => console.error('[kho-chung] cất bản chụp lỗi:', e instanceof Error ? e.message : e))
  return dung(cauTho, qTho)
}

async function catChup(env: Env, dau: string, luc: number, json: string): Promise<void> {
  await chayDdlMotLan(env, 'kho_chup_2810', LENH_BANG_CHUP)
  const lenh = [env.DB.prepare('DELETE FROM kho_chup WHERE khoa = ?').bind(KHOA_CHUP)]
  for (let i = 0, phan = 0; i < json.length; i += CO_PHAN, phan++) lenh.push(env.DB.prepare('INSERT INTO kho_chup (khoa, phan, dau, luc, json) VALUES (?,?,?,?,?)').bind(KHOA_CHUP, phan, dau, luc, json.slice(i, i + CO_PHAN)))
  await env.DB.batch(lenh)
}

/** Kho chung (null ⇒ công tắc tắt / đọc lỗi ⇒ nơi dùng đi đường cũ). Lượt đồng thời trong isolate dùng chung một lượt nạp. */
export async function layKhoChung(env: Env): Promise<KhoChung | null> {
  if (!bat) return null
  const now = Date.now(), goc = dbGoc(env.DB as unknown as object)
  const co = dem.get(goc)
  if (co && now - co.luc < HAN_ISOLATE_MS && now >= co.luc) return co.k
  let p = dang.get(goc)
  if (!p) {
    const bang = dang
    const moi: Promise<KhoChung | null> = nap(env, now).then((k) => { if (k) dem.set(goc, { k, luc: now }); return k }, () => null).finally(() => { if (bang.get(goc) === moi) bang.delete(goc) })
    p = moi
    dang.set(goc, p)
  }
  return p
}
