// KHO Ý ĐÚNG–SAI MỚI (05/10) — Phần II không có "bản khác" (song sinh chỉ Phần I/III), làm lại câu Đ/S thì em gặp lại đúng 4 ý đã thuộc.
// Máy soạn (scripts/loi-giai/may-soan.mjs) soạn 8–12 Ý MỚI cùng đề dẫn cho mỗi câu Đúng/Sai (ngoài 4 ý gốc), mỗi ý Đ/S + lí do 1 dòng,
// KIỂM HAI LƯỢT ĐỘC LẬP (lượt soạn ↔ lượt kiểm mù không thấy giá trị đề xuất — server/src/may-soan-kiem.ts). CHỈ LƯU ý hai lượt khớp:
// máy chủ đòi bằng chứng `kiem.d2` khớp `d` của từng ý và kiểm lại ý với câu gốc dựng từ KHO (không tin máy soạn).
// Thang làm lại câu sai (làn khác, dùng sau) đọc bằng `docYDs(env, bams)` để ra câu Đ/S bằng ý MỚI thay vì 4 ý em đã thuộc.
//
// Bảng CHỈ-THÊM `cau_y_ds` (băm câu, ý, giá trị, lí do, nguồn, lúc) — tạo lúc GHI (như cau-bo-tro.ts); bản SQL: server/migration-0510-y-ds.sql
// (chỉ thêm, chưa chạy --remote). Đường đọc KHÔNG tạo bảng (ngân sách vòng D1 của kế hoạch ngày): bảng chưa có ⇒ rỗng.
// KHỐI: mỗi dòng mang `qid_mau`, `ma_de`, `lop` của câu gốc (lấy từ KHO lúc nhận) ⇒ cổng khối đọc được: `docYDs` trả {qid, maDe, lop} đúng khuôn
// `cauHopKhoi`/`locCauHopKhoi` của src/lib/khoi-cau.ts; `{ lop }` ⇒ chỉ ý soạn từ câu đúng khối đó; `{ khoiEm }` ⇒ lọc qua `cauHopKhoi`.
// ĐÁP ÁN (`d`) chỉ ở máy chủ: nơi dùng gửi xuống máy em CHỈ chữ ý, chấm ở máy chủ (như `publicQuestion`).
import type { Env } from './kieu'
import { bamCau, cauTrongGoi, lopCua, type CauKho } from '../../src/lib/loi-giai-kiem'
import { cauHopKhoi, type Khoi } from '../../src/lib/khoi-cau'
import { cauGocTuKho, chuanChu, nhanYMoiNop, Y_DS_TRAN, type BangChung2Luot, type CauGoc, type MucBo, type YMoiSoan } from './may-soan-kiem'

type Obj = Record<string, unknown>
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v)).trim()

export const SQL_BANG_Y_DS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS cau_y_ds (bam TEXT NOT NULL, khoa_y TEXT NOT NULL, stt INTEGER NOT NULL, noi_dung TEXT NOT NULL, gia_tri TEXT NOT NULL,
    ly_do TEXT NOT NULL, nguon TEXT NOT NULL, luc TEXT NOT NULL, qid_mau TEXT NOT NULL, ma_de TEXT NOT NULL, lop TEXT, kiem_json TEXT, PRIMARY KEY (bam, khoa_y))`,
  'CREATE INDEX IF NOT EXISTS cau_y_ds_qid ON cau_y_ds(qid_mau)',
]
const daTao = new WeakMap<object, Promise<void>>()
export function damBaoBangYDs(env: Env): Promise<void> {
  const k = env.DB as unknown as object
  let p = daTao.get(k)
  if (!p) {
    p = env.DB.batch(SQL_BANG_Y_DS.map((s) => env.DB.prepare(s))).then(() => undefined)
    p.catch(() => daTao.delete(k))
    daTao.set(k, p)
  }
  return p
}

/** Khối / mã tờ của câu gốc — luôn lấy từ KHO, không từ máy soạn. */
export interface MetaGoc { qidMau: string; maDe: string; lop: string }
export const metaCua = (c: CauKho): MetaGoc => ({ qidMau: c.qid, maDe: c.maDe, lop: lopCua(c.maDe) })

/**
 * Câu HIỆN TẠI trong kho theo qid + băm tính lại ngay (cùng cách `cauHienTai` của loi-giai.ts; chép gọn ở đây để không vòng phụ thuộc
 * loi-giai ↔ hoc-lieu-may-soan): mã đề từ `loi_giai_cau` (hoặc đoán từ qid), gói R2 `kho/<mã đề>.json`.
 */
export async function docCauKhoHienTai(env: Env, qid: string): Promise<{ c: CauKho; bam: string } | null> {
  const r = await env.DB.prepare('SELECT ma_de FROM loi_giai_cau WHERE qid = ?').bind(qid).first<Obj>().catch(() => null)
  const maDe = str(r?.ma_de) || (/^(.+)-(?:III|II|I)-\d+$/.exec(qid)?.[1] ?? '')
  if (!maDe) return null
  const o = await env.DE.get(`kho/${maDe}.json`)
  if (!o) return null
  const goi = await new Response(o.body).json()
  const c = cauTrongGoi(maDe, goi).find((x) => x.qid === qid)
  return c ? { c, bam: await bamCau(c) } : null
}

/** Chữ các ý ĐÃ có theo băm (không soạn trùng; đếm "đã có kho ý"). Bảng chưa có ⇒ rỗng; không tạo bảng. */
export async function chuYDsTheoBam(env: Env, bams: readonly string[]): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  const ds = [...new Set(bams.map(str).filter(Boolean))]
  for (let i = 0; i < ds.length; i += 90) {
    const r = await env.DB.prepare('SELECT bam, noi_dung FROM cau_y_ds WHERE bam IN (SELECT value FROM json_each(?)) ORDER BY bam, stt')
      .bind(JSON.stringify(ds.slice(i, i + 90))).all<Obj>().catch(() => ({ results: [] as Obj[] }))
    for (const x of r.results ?? []) ra.set(str(x.bam), [...(ra.get(str(x.bam)) ?? []), String(x.noi_dung ?? '')])
  }
  return ra
}

/** GHI các ý đã qua hai lượt + bộ kiểm máy chủ. CHỈ THÊM (`INSERT OR IGNORE` theo (băm, chữ ý chuẩn)); không sửa / xoá ý đã có; trần 24 ý / câu. */
export async function ghiYDs(env: Env, bam: string, meta: MetaGoc, ds: readonly (YMoiSoan & { kiem?: BangChung2Luot })[]): Promise<number> {
  if (!ds.length) return 0
  await damBaoBangYDs(env)
  const r = await env.DB.prepare('SELECT COUNT(*) AS n, COALESCE(MAX(stt), 0) AS m FROM cau_y_ds WHERE bam = ?').bind(bam).first<Obj>()
  const coSan = Number(r?.n ?? 0), stt = Number(r?.m ?? 0)
  const them = ds.slice(0, Math.max(0, Y_DS_TRAN - coSan))
  if (!them.length) return 0
  const luc = new Date().toISOString()
  const kq = await env.DB.batch(them.map((y, j) => env.DB.prepare(
    `INSERT OR IGNORE INTO cau_y_ds (bam, khoa_y, stt, noi_dung, gia_tri, ly_do, nguon, luc, qid_mau, ma_de, lop, kiem_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).bind(bam, chuanChu(y.t).slice(0, 240), stt + j + 1, y.t, y.d, y.lyDo, 'may_soan_2_luot', luc, meta.qidMau, meta.maDe, meta.lop, y.kiem ? JSON.stringify(y.kiem) : null)))
  return kq.reduce((s, x) => s + (x.meta?.changes ?? 0), 0)
}

/** Nhận ý mới máy soạn nộp cho câu gốc (dựng từ KHO): bằng chứng hai lượt + bộ kiểm + không trùng ý gốc / ý đã có ⇒ ghi. */
export async function nhanVaGhiYDs(env: Env, goc: CauGoc, meta: MetaGoc, ds: unknown): Promise<{ giu: number; bo: MucBo[]; tong: number }> {
  const daCo = (await chuYDsTheoBam(env, [goc.bam])).get(goc.bam) ?? []
  const { giu, bo } = nhanYMoiNop(goc, ds, { banKhac: [], yDs: daCo })
  const n = await ghiYDs(env, goc.bam, meta, giu.map((x) => x.y))
  if (n < giu.length) giu.slice(n).forEach((x) => bo.push({ i: x.i, lyDo: `câu đã đủ ${Y_DS_TRAN} ý` }))
  return { giu: n, bo: bo.sort((a, b) => a.i - b.i), tong: daCo.length + n }
}

/**
 * `/kho/may-soan/nop-y-ds {qid, bam, yMoi: [{t, d, lyDo, kiem: {d2, lyDo2}}]}` — đường nộp riêng của kho ý (cổng mã bí mật như /kho/loi-giai/nop;
 * máy soạn thường nộp chung qua /kho/may-soan/nop-bo-tro). Băm lệch đề hiện tại ⇒ từ chối.
 */
export async function nopYDs(env: Env, b: Obj): Promise<Obj> {
  const qid = str(b.qid), bam = str(b.bam)
  if (!qid || !bam) return { ok: false, error: 'Thiếu qid / bam' }
  const ht = await docCauKhoHienTai(env, qid).catch(() => null)
  if (!ht) return { ok: false, error: 'Không thấy câu trong kho' }
  if (ht.bam !== bam) return { ok: false, error: 'Đề đã đổi sau khi nhận việc (băm lệch) — bỏ', loi: ['KHOÁ VÂN TAY'] }
  const goc = cauGocTuKho(ht.c, bam)
  if (!goc || goc.dang !== 'ds') return { ok: false, error: 'Chỉ câu Đúng/Sai (Phần II) có kho ý' }
  return { ok: true, bam, yDs: await nhanVaGhiYDs(env, goc, metaCua(ht.c), b.yMoi) }
}

/** Một ý Đ–S mới. `qid`/`maDe`/`lop` là của câu gốc — đưa thẳng vào `cauHopKhoi(khoiEm, y)`. `d` là ĐÁP ÁN: không gửi xuống máy em trước khi nộp. */
export interface YDs { bam: string; stt: number; t: string; d: 'D' | 'S'; lyDo: string; nguon: string; luc: string; qid: string; maDe: string; lop: string }

const dongYDs = (x: Obj): YDs => ({
  bam: str(x.bam), stt: Number(x.stt), t: String(x.noi_dung ?? ''), d: str(x.gia_tri) === 'S' ? 'S' : 'D', lyDo: String(x.ly_do ?? ''),
  nguon: str(x.nguon), luc: str(x.luc), qid: str(x.qid_mau), maDe: str(x.ma_de), lop: str(x.lop),
})

/**
 * HÀM ĐỌC cho thang làm lại: ý Đ–S mới theo băm câu, đúng thứ tự `stt`. Mặc định BỎ câu đang nằm diện nghi đáp án (`cau_nghi_dap_an` 'nghi'
 * của bất kì bản cùng nội dung) — kênh tự động không dùng câu nghi. `lop` ⇒ chỉ ý soạn từ câu cùng khối (không dùng chéo khối);
 * `khoiEm` ⇒ lọc thêm qua `cauHopKhoi` (luật khối dùng chung). Bảng chưa có / lỗi ⇒ Map rỗng (không ném, không tạo bảng).
 */
export async function docYDs(env: Env, bams: readonly string[], opts: { lop?: string; khoiEm?: Khoi | null; boNghi?: boolean } = {}): Promise<Map<string, YDs[]>> {
  const ra = new Map<string, YDs[]>()
  const ds = [...new Set(bams.map(str).filter(Boolean))]
  const lop = str(opts.lop)
  const sql = (nghi: boolean) => `SELECT y.* FROM cau_y_ds y WHERE y.bam IN (SELECT value FROM json_each(?))${lop ? ' AND y.lop = ?' : ''}
    ${nghi ? "AND NOT EXISTS (SELECT 1 FROM loi_giai_cau q JOIN cau_nghi_dap_an n ON n.qid = q.qid AND n.trang_thai = 'nghi' WHERE q.bam = y.bam)" : ''}
    ORDER BY y.bam, y.stt`
  for (let i = 0; i < ds.length; i += 90) {
    const tham = [JSON.stringify(ds.slice(i, i + 90)), ...(lop ? [lop] : [])]
    let rows: Obj[] = []
    try { rows = (await env.DB.prepare(sql(opts.boNghi !== false)).bind(...tham).all<Obj>()).results ?? [] } catch {
      // Bảng câu nghi chưa có (D1 mới) ⇒ không có câu nghi nào ⇒ đọc không lọc; bảng ý chưa có ⇒ rỗng.
      try { rows = (await env.DB.prepare(sql(false)).bind(...tham).all<Obj>()).results ?? [] } catch { rows = [] }
    }
    for (const x of rows) {
      const y = dongYDs(x)
      if (opts.khoiEm !== undefined && !cauHopKhoi(opts.khoiEm, y)) continue
      ra.set(y.bam, [...(ra.get(y.bam) ?? []), y])
    }
  }
  return ra
}

/**
 * Như `docYDs` nhưng theo qid CÂU GỐC (06/10 — thang làm lại câu sai, bộ ý Đ–S mới `~yd`): MỘT truy vấn nối `loi_giai_cau` (qid → băm) với `cau_y_ds`, không cần biết
 * băm trước. Cùng luật: bỏ câu nghi đáp án, `lop` lọc theo khối câu, `khoiEm` qua `cauHopKhoi`; ý đúng thứ tự `stt`. Bảng chưa có / lỗi ⇒ Map rỗng (không ném, không tạo bảng).
 */
export async function docYDsTheoQid(env: Env, qids: readonly string[], opts: { lop?: string; khoiEm?: Khoi | null; boNghi?: boolean } = {}): Promise<Map<string, YDs[]>> {
  const ra = new Map<string, YDs[]>()
  const ds = [...new Set(qids.map(str).filter(Boolean))]
  const lop = str(opts.lop)
  const sql = (nghi: boolean) => `SELECT lc.qid AS qid_hoi, y.* FROM loi_giai_cau lc JOIN cau_y_ds y ON y.bam = lc.bam WHERE lc.qid IN (SELECT value FROM json_each(?))${lop ? ' AND y.lop = ?' : ''}
    ${nghi ? "AND NOT EXISTS (SELECT 1 FROM loi_giai_cau q JOIN cau_nghi_dap_an n ON n.qid = q.qid AND n.trang_thai = 'nghi' WHERE q.bam = y.bam)" : ''}
    ORDER BY lc.qid, y.stt`
  for (let i = 0; i < ds.length; i += 90) {
    const tham = [JSON.stringify(ds.slice(i, i + 90)), ...(lop ? [lop] : [])]
    let rows: Obj[] = []
    try { rows = (await env.DB.prepare(sql(opts.boNghi !== false)).bind(...tham).all<Obj>()).results ?? [] } catch {
      try { rows = (await env.DB.prepare(sql(false)).bind(...tham).all<Obj>()).results ?? [] } catch { rows = [] }
    }
    for (const x of rows) {
      const y = dongYDs(x)
      if (opts.khoiEm !== undefined && !cauHopKhoi(opts.khoiEm, y)) continue
      const q = str(x.qid_hoi)
      ra.set(q, [...(ra.get(q) ?? []), y])
    }
  }
  return ra
}
