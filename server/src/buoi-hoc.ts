// BUỔI HỌC — ĐIỂM DANH + SỨC HỌC CHO BẢNG "DẠY HỌC" của mục Lên bảng (thầy lệnh 28/09).
//
// Thầy bấm "Điểm danh" ⇒ máy chủ mở MỘT buổi học; máy chiếu hiện mã 6 số + QR; em trên app học sinh nhập/quét mã ⇒ vào danh sách
// "có mặt hôm nay". Danh sách ấy là nguồn duy nhất để app thầy chọn em lên bảng (chỉ em CÓ MẶT).
//
// BẢNG (chỉ-thêm, tạo lúc chạy — CI không tự chạy migration; y hệt `server/migration-2809-buoi-hoc.sql`):
//   buoi_hoc            (id, ten, lop, bi_mat, mo_luc, het_han, dong_luc, cap_nhat_luc)
//   buoi_hoc_diem_danh  (buoi_id, sbd, luc, cach 'ma'|'thay', trang_thai 'co_mat'|'bo', cap_nhat_luc) — "bớt em" chỉ đổi trạng thái, không xoá dòng.
//
// CHỐNG ĐIỂM DANH HỘ (tối thiểu, thầy chốt): (1) em chỉ điểm danh cho CHÍNH MÌNH — SBD lấy từ token (`gameIdentity`), không nhận `sbd` trong thân;
// (2) mã ĐỔI MỖI 60 GIÂY (HMAC của bí mật riêng từng buổi × số phút), nhận mã phút này + phút trước (≤ 2 phút) — chụp mã gửi bạn ở nhà là hết hạn;
// (3) buổi GẮN LỚP: buổi có tên lớp ⇒ em lớp khác bị từ chối; (4) buổi hết hạn sau 24 giờ hoặc khi thầy bấm Kết thúc; (5) nhập sai quá 8 lần/10 phút ⇒ chờ.
// Mã KHÔNG bao giờ đi xuống máy học sinh (lệnh của em chỉ trả tên buổi + đã điểm danh chưa).
//
// SỨC HỌC (`/gv/buoi-hoc/suc-hoc`): số THẬT từ sổ `su_kien_hoc` (60 ngày, theo câu / dạng / chuyên đề / tổng), bậc `nam_kt_dang`, lịch sử `len_bang`.
// CHỈ ĐỌC. App thầy tự ước xác suất và chọn em (`src/lib/chon-em-day-hoc.ts`), máy chủ không quyết thay.
import type { Env } from './kieu'
import { gameIdentity } from './game-v2-auth'
import { ngayVnCua } from './srs2-d1'
import { tenLopCuaEm } from './ten-lop'

type Row = Record<string, unknown>
const str = (x: unknown): string => (x === null || x === undefined ? '' : String(x)).trim()
const num = (x: unknown): number => (Number.isFinite(Number(x)) ? Number(x) : 0)

/** Mã đổi mỗi ngần này (mili-giây). */
export const CHU_KY_MA_MS = 60_000
/** Buổi tự hết hạn sau ngần này kể từ lúc mở (nếu thầy quên bấm Kết thúc). */
export const HAN_BUOI_MS = 24 * 3_600_000
export const TOI_DA_TEN = 80
export const TOI_DA_EM_SUC_HOC = 120
export const TOI_DA_CAU_SUC_HOC = 300
const TOI_DA_SAI = 8
const CUA_SO_SAI_MS = 10 * 60_000

export const SQL_TAO_BANG = [
  'CREATE TABLE IF NOT EXISTS buoi_hoc (id TEXT PRIMARY KEY, ten TEXT NOT NULL, lop TEXT NOT NULL DEFAULT \'\', bi_mat TEXT NOT NULL, mo_luc TEXT NOT NULL, het_han TEXT NOT NULL, dong_luc TEXT, cap_nhat_luc TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS buoi_hoc_diem_danh (buoi_id TEXT NOT NULL, sbd TEXT NOT NULL, luc TEXT NOT NULL, cach TEXT NOT NULL, trang_thai TEXT NOT NULL DEFAULT \'co_mat\', cap_nhat_luc TEXT NOT NULL, PRIMARY KEY (buoi_id, sbd))',
]

async function taoBang(env: Env): Promise<void> {
  for (const s of SQL_TAO_BANG) await env.DB.prepare(s).run()
}

async function hoi(env: Env, sql: string, ...bind: unknown[]): Promise<Row[] | null> {
  try {
    return (await env.DB.prepare(sql).bind(...bind).all<Row>()).results ?? []
  } catch {
    return null
  }
}

// ───────────────────────── MÃ ĐỔI MỖI 60 GIÂY ─────────────────────────

const enc = new TextEncoder()
/** Mã 6 số của một buổi ở phút `cuaSo` (= floor(ms / 60 000)). Thuần theo (bí mật, phút): máy chủ nào tính cũng ra một mã. */
export async function maCuaBuoi(biMat: string, cuaSo: number): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(biMat), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const s = new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(`diem-danh|${cuaSo}`)))
  const n = ((s[0]! << 24) | (s[1]! << 16) | (s[2]! << 8) | s[3]!) >>> 0
  return String(100000 + (n % 900000))
}
export const cuaSoCua = (ms: number): number => Math.floor(ms / CHU_KY_MA_MS)
/** Mã còn nhận: mã của phút này + phút trước (em đang gõ thì mã trên máy chiếu vừa đổi vẫn không hỏng). */
export async function maConNhan(biMat: string, nowMs: number): Promise<string[]> {
  const w = cuaSoCua(nowMs)
  return [await maCuaBuoi(biMat, w), await maCuaBuoi(biMat, w - 1)]
}

function taoBiMat(): string {
  const b = new Uint8Array(18)
  crypto.getRandomValues(b)
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('')
}
function taoId(nowMs: number): string {
  const b = new Uint8Array(4)
  crypto.getRandomValues(b)
  return `BH-${ngayVnCua(nowMs).replace(/-/g, '')}-${[...b].map((x) => x.toString(16).padStart(2, '0')).join('')}`
}

const conMo = (r: Row, nowMs: number): boolean => !str(r.dong_luc) && Date.parse(str(r.het_han)) > nowMs

async function docBuoi(env: Env, id: string): Promise<Row | null> {
  const r = await hoi(env, 'SELECT id, ten, lop, bi_mat, mo_luc, het_han, dong_luc FROM buoi_hoc WHERE id = ?', id)
  return r?.[0] ?? null
}

function buoiRa(r: Row, nowMs: number) {
  return { id: str(r.id), ten: str(r.ten), lop: str(r.lop), moLuc: str(r.mo_luc), hetHan: str(r.het_han), dongLuc: str(r.dong_luc) || null, dangMo: conMo(r, nowMs) }
}

/** Danh sách em của một tên lớp (rỗng = mọi em chưa khoá). Có cột `ten_lop` thì theo tên lớp thật, không thì lớp mặc định theo khối. */
async function emCuaLop(env: Env, lop: string): Promise<{ sbd: string; hoTen: string; tenLop: string }[]> {
  const hs =
    (await hoi(env, "SELECT sbd, ho_ten, lop, ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'")) ??
    (await hoi(env, "SELECT sbd, ho_ten, lop, NULL AS ten_lop FROM hoc_sinh WHERE COALESCE(trang_thai, '') <> 'khoa'")) ??
    []
  return hs
    .map((x) => ({ sbd: str(x.sbd), hoTen: str(x.ho_ten), tenLop: tenLopCuaEm(x.lop, x.ten_lop) }))
    .filter((x) => x.sbd && (!lop || x.tenLop === lop))
    .sort((a, b) => a.hoTen.localeCompare(b.hoTen, 'vi') || a.sbd.localeCompare(b.sbd))
}

async function tenLopCuaMotEm(env: Env, sbd: string): Promise<string> {
  const r = (await hoi(env, 'SELECT lop, ten_lop FROM hoc_sinh WHERE sbd = ?', sbd)) ?? (await hoi(env, 'SELECT lop, NULL AS ten_lop FROM hoc_sinh WHERE sbd = ?', sbd))
  return r?.[0] ? tenLopCuaEm(r[0].lop, r[0].ten_lop) : ''
}

// ───────────────────────── LỆNH CỦA THẦY ─────────────────────────

/** `POST /gv/buoi-hoc {action, ...}` — một cửa cho mọi việc của thầy với buổi học. */
export async function gvBuoiHoc(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const action = str(b.action)
  await taoBang(env)
  const nay = new Date(nowMs).toISOString()

  if (action === 'mo') {
    const lop = str(b.lop).slice(0, 40)
    const ten = (str(b.ten) || `Buổi học ${ngayVnCua(nowMs).split('-').reverse().join('/')}${lop ? ` · ${lop}` : ''}`).slice(0, TOI_DA_TEN)
    const id = taoId(nowMs)
    await env.DB.prepare('INSERT INTO buoi_hoc (id, ten, lop, bi_mat, mo_luc, het_han, dong_luc, cap_nhat_luc) VALUES (?,?,?,?,?,?,NULL,?)')
      .bind(id, ten, lop, taoBiMat(), nay, new Date(nowMs + HAN_BUOI_MS).toISOString(), nay)
      .run()
    return xemBuoi(env, id, nowMs, b.kemLop === true)
  }

  if (action === 'dang-mo') {
    // Buổi CÒN MỞ (mở lại app giữa buổi thì nối tiếp đúng buổi đang điểm danh). Mới nhất trước.
    const r = (await hoi(env, 'SELECT id, ten, lop, bi_mat, mo_luc, het_han, dong_luc FROM buoi_hoc WHERE dong_luc IS NULL AND het_han > ? ORDER BY mo_luc DESC LIMIT 10', nay)) ?? []
    const dem = await hoi(env, "SELECT buoi_id, COUNT(*) AS n FROM buoi_hoc_diem_danh WHERE trang_thai = 'co_mat' AND buoi_id IN (SELECT value FROM json_each(?)) GROUP BY buoi_id", JSON.stringify(r.map((x) => str(x.id))))
    const soEm = new Map((dem ?? []).map((x) => [str(x.buoi_id), num(x.n)]))
    return { ok: true, buoi: r.map((x) => ({ ...buoiRa(x, nowMs), soCoMat: soEm.get(str(x.id)) ?? 0 })) }
  }

  const id = str(b.id)
  if (!id) return { ok: false, error: 'Thiếu mã buổi học.' }
  const buoi = await docBuoi(env, id)
  if (!buoi) return { ok: false, error: 'Không tìm thấy buổi học này.' }

  if (action === 'xem') return xemBuoi(env, id, nowMs, b.kemLop === true)

  if (action === 'them-em') {
    const ds = [...new Set((Array.isArray(b.sbd) ? (b.sbd as unknown[]) : [b.sbd]).map(str).filter((x) => x && x.length <= 40))].slice(0, 300)
    if (!ds.length) return { ok: false, error: 'Chưa chọn em nào.' }
    const co = new Set(((await hoi(env, 'SELECT sbd FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))', JSON.stringify(ds))) ?? []).map((x) => str(x.sbd)))
    const hop = ds.filter((s) => co.has(s))
    if (!hop.length) return { ok: false, error: 'Không tìm thấy học sinh nào trong danh sách vừa chọn.' }
    await env.DB.batch(
      hop.map((s) =>
        env.DB.prepare(
          "INSERT INTO buoi_hoc_diem_danh (buoi_id, sbd, luc, cach, trang_thai, cap_nhat_luc) VALUES (?,?,?,'thay','co_mat',?) ON CONFLICT(buoi_id, sbd) DO UPDATE SET trang_thai = 'co_mat', cap_nhat_luc = excluded.cap_nhat_luc",
        ).bind(id, s, nay, nay),
      ),
    )
    return xemBuoi(env, id, nowMs, false)
  }

  if (action === 'bot-em') {
    const sbd = str(b.sbd)
    if (!sbd) return { ok: false, error: 'Chưa chọn em.' }
    await env.DB.prepare("UPDATE buoi_hoc_diem_danh SET trang_thai = 'bo', cap_nhat_luc = ? WHERE buoi_id = ? AND sbd = ?").bind(nay, id, sbd).run()
    return xemBuoi(env, id, nowMs, false)
  }

  if (action === 'dong') {
    if (!str(buoi.dong_luc)) await env.DB.prepare('UPDATE buoi_hoc SET dong_luc = ?, cap_nhat_luc = ? WHERE id = ?').bind(nay, nay, id).run()
    return xemBuoi(env, id, nowMs, false)
  }

  return { ok: false, error: 'Lệnh buổi học không rõ.' }
}

/** Trạng thái một buổi cho app thầy: mã ĐANG chiếu + lúc đổi mã, danh sách có mặt (tên, lúc, cách), sĩ số lớp; `kemLop` ⇒ kèm cả danh sách lớp để thêm tay. */
async function xemBuoi(env: Env, id: string, nowMs: number, kemLop: boolean): Promise<Row> {
  const r = await docBuoi(env, id)
  if (!r) return { ok: false, error: 'Không tìm thấy buổi học này.' }
  const buoi = buoiRa(r, nowMs)
  const rCo =
    (await hoi(
      env,
      "SELECT d.sbd, d.luc, d.cach, h.ho_ten FROM buoi_hoc_diem_danh d LEFT JOIN hoc_sinh h ON h.sbd = d.sbd WHERE d.buoi_id = ? AND d.trang_thai = 'co_mat' ORDER BY d.luc, d.sbd",
      id,
    )) ?? []
  const lop = await emCuaLop(env, buoi.lop)
  const w = cuaSoCua(nowMs)
  return {
    ok: true,
    buoi,
    ...(buoi.dangMo ? { ma: await maCuaBuoi(str(r.bi_mat), w), doiMaLuc: (w + 1) * CHU_KY_MA_MS } : {}),
    coMat: rCo.map((x) => ({ sbd: str(x.sbd), hoTen: str(x.ho_ten), luc: str(x.luc), cach: str(x.cach) === 'thay' ? 'thay' : 'ma' })),
    siSo: buoi.lop ? lop.length : null,
    ...(kemLop ? { lopEm: lop.slice(0, 400) } : {}),
  }
}

/** `POST /gv/buoi-hoc/suc-hoc {sbd[], cau[{qid, maDang, chuyenDe}]}` — CHỈ ĐỌC. Số thật theo từng em cho thuật toán chọn em (app thầy). */
export async function gvSucHocBuoi(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  const sbd = [...new Set((Array.isArray(b.sbd) ? (b.sbd as unknown[]) : []).map(str).filter((x) => x && x.length <= 40))]
  if (!sbd.length) return { ok: false, error: 'Chưa có em nào có mặt.' }
  if (sbd.length > TOI_DA_EM_SUC_HOC) return { ok: false, error: `Tối đa ${TOI_DA_EM_SUC_HOC} em một lượt.` }
  const cau = (Array.isArray(b.cau) ? (b.cau as unknown[]) : []).slice(0, TOI_DA_CAU_SUC_HOC).map((x) => (x && typeof x === 'object' ? (x as Row) : {}))
  const qid = [...new Set(cau.map((c) => str(c.qid)).filter((x) => x && x.length <= 120))]
  const chuyenDe = [...new Set(cau.map((c) => str(c.chuyenDe)).filter((x) => x && x.length <= 120))]
  const maDang = [...new Set([...cau.map((c) => str(c.maDang)).filter((x) => x && x.length <= 120), ...chuyenDe.map((c) => `CD:${c}`)])]
  const homNay = ngayVnCua(nowMs)
  const tu = new Date(Date.parse(`${homNay}T00:00:00Z`) - 59 * 86_400_000).toISOString().slice(0, 10)
  const dauNgay = new Date(Date.parse(`${homNay}T00:00:00+07:00`)).toISOString()
  const S = JSON.stringify(sbd)
  // Bỏ kết quả còn CHE (ca chưa công bố) nếu sổ có cột `visibility`; sổ cũ chưa có cột ⇒ đọc như cũ.
  const nhom = async (cot: string, ds: string[]) => {
    if (!ds.length) return [] as Row[]
    const sql = (loc: string) =>
      `SELECT sbd, ${cot} AS k, COUNT(*) AS n, SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) AS d FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ${cot} IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ket_qua IS NOT NULL${loc} GROUP BY sbd, ${cot}`
    return (await hoi(env, sql(" AND COALESCE(visibility, '') <> 'embargoed'"), S, JSON.stringify(ds), tu)) ?? (await hoi(env, sql(''), S, JSON.stringify(ds), tu)) ?? []
  }
  const sqlTong = (loc: string) =>
    `SELECT sbd, COUNT(*) AS n, SUM(CASE WHEN ket_qua = 1 THEN 1 ELSE 0 END) AS d FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn >= ? AND ket_qua IS NOT NULL${loc} GROUP BY sbd`
  const [rTong, rQ, rDang, rCd, rBac, rLb] = await Promise.all([
    hoi(env, sqlTong(" AND COALESCE(visibility, '') <> 'embargoed'"), S, tu).then((r) => r ?? hoi(env, sqlTong(''), S, tu)),
    nhom('qid', qid),
    nhom('ma_dang', maDang),
    nhom('chuyen_de', chuyenDe),
    maDang.length ? hoi(env, 'SELECT sbd, ma_dang, bac FROM nam_kt_dang WHERE sbd IN (SELECT value FROM json_each(?)) AND ma_dang IN (SELECT value FROM json_each(?))', S, JSON.stringify(maDang)) : Promise.resolve([] as Row[]),
    hoi(env, 'SELECT sbd, COUNT(*) AS n, SUM(CASE WHEN dat = 1 THEN 1 ELSE 0 END) AS dat, SUM(CASE WHEN luc >= ? THEN 1 ELSE 0 END) AS hom_nay FROM len_bang WHERE sbd IN (SELECT value FROM json_each(?)) GROUP BY sbd', dauNgay, S),
  ])
  type Dem = { n: number; d: number }
  const em: Record<string, { tong: Dem; qid: Record<string, Dem>; dang: Record<string, Dem>; chuyenDe: Record<string, Dem>; bac: Record<string, number>; lenBang: { n: number; dat: number; homNay: number } }> = {}
  for (const s of sbd) em[s] = { tong: { n: 0, d: 0 }, qid: {}, dang: {}, chuyenDe: {}, bac: {}, lenBang: { n: 0, dat: 0, homNay: 0 } }
  for (const x of rTong ?? []) if (em[str(x.sbd)]) em[str(x.sbd)]!.tong = { n: num(x.n), d: num(x.d) }
  for (const x of rQ) if (em[str(x.sbd)]) em[str(x.sbd)]!.qid[str(x.k)] = { n: num(x.n), d: num(x.d) }
  for (const x of rDang) if (em[str(x.sbd)]) em[str(x.sbd)]!.dang[str(x.k)] = { n: num(x.n), d: num(x.d) }
  for (const x of rCd) if (em[str(x.sbd)]) em[str(x.sbd)]!.chuyenDe[str(x.k)] = { n: num(x.n), d: num(x.d) }
  for (const x of rBac ?? []) if (em[str(x.sbd)]) em[str(x.sbd)]!.bac[str(x.ma_dang)] = Math.max(0, Math.min(2, Math.round(num(x.bac))))
  for (const x of rLb ?? []) if (em[str(x.sbd)]) em[str(x.sbd)]!.lenBang = { n: num(x.n), dat: num(x.dat), homNay: num(x.hom_nay) }
  return { ok: true, tuNgay: tu, em }
}

// ───────────────────────── LỆNH CỦA HỌC SINH ─────────────────────────

const saiGanDay = new Map<string, number[]>()
function quaSoLanSai(sbd: string, nowMs: number): boolean {
  const ds = (saiGanDay.get(sbd) ?? []).filter((t) => nowMs - t < CUA_SO_SAI_MS)
  saiGanDay.set(sbd, ds)
  return ds.length >= TOI_DA_SAI
}
function ghiSai(sbd: string, nowMs: number) {
  const ds = (saiGanDay.get(sbd) ?? []).filter((t) => nowMs - t < CUA_SO_SAI_MS)
  ds.push(nowMs)
  saiGanDay.set(sbd, ds)
  if (saiGanDay.size > 5000) saiGanDay.clear()
}
/** Chỉ cho test: xoá bộ đếm nhập sai. */
export function _xoaDemSai() {
  saiGanDay.clear()
}

/** `POST /hs/buoi-hoc {token}` — buổi học ĐANG MỞ của lớp em (để app hiện thẻ "Điểm danh buổi học"). KHÔNG trả mã. */
export async function hsBuoiHocDangMo(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  let sbd: string
  try {
    sbd = await gameIdentity(env, b)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' }
  }
  const r = await hoi(env, 'SELECT id, ten, lop, mo_luc, het_han, dong_luc FROM buoi_hoc WHERE dong_luc IS NULL AND het_han > ? ORDER BY mo_luc DESC LIMIT 20', new Date(nowMs).toISOString())
  if (!r || !r.length) return { ok: true, buoi: null }
  const lopEm = await tenLopCuaMotEm(env, sbd)
  const hop = r.filter((x) => !str(x.lop) || str(x.lop) === lopEm)
  if (!hop.length) return { ok: true, buoi: null }
  const da = new Set(
    ((await hoi(env, "SELECT buoi_id FROM buoi_hoc_diem_danh WHERE sbd = ? AND trang_thai = 'co_mat' AND buoi_id IN (SELECT value FROM json_each(?))", sbd, JSON.stringify(hop.map((x) => str(x.id))))) ?? []).map((x) => str(x.buoi_id)),
  )
  const x = hop.find((y) => !da.has(str(y.id))) ?? hop[0]!
  return { ok: true, buoi: { id: str(x.id), ten: str(x.ten), lop: str(x.lop), daDiemDanh: da.has(str(x.id)) } }
}

/** `POST /hs/diem-danh {token, ma}` — em điểm danh CHO CHÍNH MÌNH bằng mã đang chiếu. */
export async function hsDiemDanh(env: Env, b: Row, nowMs: number = Date.now()): Promise<Row> {
  let sbd: string
  try {
    sbd = await gameIdentity(env, b)
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Em đăng nhập lại.' }
  }
  const ma = str(b.ma).replace(/\D/g, '')
  if (ma.length !== 6) return { ok: false, lyDo: 'ma_sai', error: 'Mã điểm danh gồm 6 chữ số trên máy chiếu.' }
  if (quaSoLanSai(sbd, nowMs)) return { ok: false, lyDo: 'cho', error: 'Em nhập sai nhiều lần. Chờ vài phút rồi nhìn lại mã trên máy chiếu.' }
  await taoBang(env)
  const nay = new Date(nowMs).toISOString()
  const r = (await hoi(env, 'SELECT id, ten, lop, bi_mat, mo_luc, het_han, dong_luc FROM buoi_hoc WHERE dong_luc IS NULL AND het_han > ? ORDER BY mo_luc DESC LIMIT 20', nay)) ?? []
  const khop: Row[] = []
  for (const x of r) if ((await maConNhan(str(x.bi_mat), nowMs)).includes(ma)) khop.push(x)
  if (!khop.length) {
    ghiSai(sbd, nowMs)
    return { ok: false, lyDo: 'ma_sai', error: 'Mã không đúng hoặc đã đổi. Em nhìn mã MỚI trên máy chiếu (mã đổi mỗi phút).' }
  }
  const lopEm = await tenLopCuaMotEm(env, sbd)
  const buoi = khop.find((x) => !str(x.lop) || str(x.lop) === lopEm)
  if (!buoi) return { ok: false, lyDo: 'khac_lop', error: 'Buổi học này dành cho lớp khác. Em hỏi thầy nhé.' }
  const id = str(buoi.id)
  // Thầy đã BỚT tên em khỏi buổi (vd nghi điểm danh hộ) ⇒ mã không tự thêm lại; chỉ thầy thêm lại được.
  const cu = (await hoi(env, 'SELECT trang_thai FROM buoi_hoc_diem_danh WHERE buoi_id = ? AND sbd = ?', id, sbd))?.[0]
  if (cu && str(cu.trang_thai) === 'bo') return { ok: false, lyDo: 'thay_da_bo', error: 'Thầy đã bỏ tên em khỏi buổi này. Em gặp thầy để được thêm lại.' }
  if (!cu)
    await env.DB.prepare("INSERT INTO buoi_hoc_diem_danh (buoi_id, sbd, luc, cach, trang_thai, cap_nhat_luc) VALUES (?,?,?,'ma','co_mat',?) ON CONFLICT(buoi_id, sbd) DO NOTHING")
      .bind(id, sbd, nay, nay)
      .run()
  return { ok: true, buoi: { id, ten: str(buoi.ten), lop: str(buoi.lop), daDiemDanh: true } }
}
