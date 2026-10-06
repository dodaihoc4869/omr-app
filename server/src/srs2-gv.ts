// THUẬT TOÁN 2.0 — LỆNH CỦA THẦY `/gv/chien-dich` (nằm SAU cổng `laThay`).
//   action: co-doc | co-luu | bia-co-doc | bia-co-luu | danh-sach | suc-chua | tao | dong | huy | bang | buoi-chua | noi-dung-cau | chua-xong
// Vòng khép kín: Kết thúc ca kiểm tra → Giao chiến dịch (có đồng hồ sức chứa) → Bảng chiến dịch khi đang chạy →
// Buổi chữa khi hết hạn nộp → "Chữa xong" (câu cần dạy lại quay về Đoàn Hộ Tống hôm sau).
import type { Env } from './kieu'
import { chanKhacKhoiLop } from './chan-khac-khoi'
import { noiDungCauChienDich } from './noi-dung-cau-chien-dich'
import { dbGoc, xoaDemCauHinh } from './cau-hinh-dem'
import { gvLop } from './ten-lop'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { laCauTuLuan } from './cam-tu-luan'
import { khoaCau } from '../../src/lib/khu-trung-cau'
import { hangTuTiLe, khoiLuongCan, NGAY_DEM, NGUONG_BAO_NO_NGAY, soNgayTraNo, phatLaiCau, soNgayConLai, soNgayGiua, sucChua, congNgay, TRAN_NGAY, type HangEm, type LanLam, type TrangThaiCau } from './srs2-loi'
import { KHOA_CO_BIA } from './bi-a'
import { xoaDemChienDich, chanDoanEm, chuaBatDau, dauNgayVn, docChienDichKemBatDau, ghiBatDau, ghiRaiDeu, docCoHoa2Tu, docHoSoDangCaLop, docLoaiCau, docMetaCau, docMocThemCaLop, hangTuHoSo, KHOA_CO_HOA2, lanLamTuDong, mocTinhCua, ngayVnCua, noCuCaLop, type ChienDich, type NoCuEm } from './srs2-d1'
import { cacQidSongSinh } from './loi-hoc-luat'
import { chayDdlMotLan } from './ddl-mot-lan'
import { lanLamTuDongTc, sqlQidHoacTc } from './lam-lai-so'

type Row = Record<string, unknown>
const str = (v: unknown): string => (v == null ? '' : String(v))
const mangChuoi = (v: unknown): string[] => (Array.isArray(v) ? v.map(str).map((x) => x.trim()).filter(Boolean) : [])
const NGAY = /^\d{4}-\d{2}-\d{2}$/

export async function gvChienDich(env: Env, b: Row, nowMs = Date.now()): Promise<Record<string, unknown>> {
  const action = str(b.action) || 'danh-sach'
  try {
    if (action === 'co-doc') return coDoc(env)
    if (action === 'co-luu') return coLuu(env, b, nowMs)
    if (action === 'bia-co-doc') return coDoc(env, KHOA_CO_BIA)
    if (action === 'bia-co-luu') return coLuu(env, b, nowMs, KHOA_CO_BIA)
    if (action === 'danh-sach') return danhSach(env, nowMs, b.thongKe === true)
    if (action === 'suc-chua') return tinhSucChua(env, b, nowMs)
    if (action === 'ds-em') return dsEm(env)
    if (action === 'chan-doan-em') return chanDoanEm(env, str(b.sbd).trim(), nowMs)
    if (action === 'tao') return tao(env, b, nowMs)
    if (action === 'dong' || action === 'huy') return doiTrangThai(env, str(b.id), action === 'dong' ? 'da_dong' : 'da_huy', nowMs)
    if (action === 'rai-deu') return await doiRaiDeu(env, str(b.id), b.bat !== false, nowMs, str(b.nguoi)) // await để lỗi "không tìm thấy" về { ok:false }
    if (action === 'bang') return bang(env, str(b.id), nowMs)
    if (action === 'buoi-chua') return buoiChua(env, str(b.id), nowMs, mangChuoi(b.coMat))
    if (action === 'noi-dung-cau') return noiDungCauChienDich(env, await docMot(env, str(b.id)), mangChuoi(b.qids)) // nội dung ĐÚNG mã câu cho tờ chiếu, qua cổng khối (06/10)
    if (action === 'chua-xong') return chuaXong(env, str(b.id), mangChuoi(b.qids), nowMs, mangChuoi(b.coMat))
    return { ok: false, error: 'Hành động không hợp lệ.' }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

// ---------------------------------------------------------------- công tắc
// Công tắc Bi-a Phản Ứng (khoá riêng `bi_a`, cùng hình `{bat, lop, sbd}`): cùng hai hàm, khác khoá.
async function coDoc(env: Env, khoa = KHOA_CO_HOA2) {
  const r = await env.DB.prepare('SELECT gia_tri FROM cau_hinh WHERE khoa = ?').bind(khoa).first<{ gia_tri: string }>().catch(() => null)
  return { ok: true, co: docCoHoa2Tu(r?.gia_tri) }
}
async function coLuu(env: Env, b: Row, nowMs: number, khoa = KHOA_CO_HOA2) {
  const co = { bat: b.bat === true, lop: mangChuoi(b.lop), sbd: mangChuoi(b.sbd) }
  await env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?,?,?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc')
    .bind(khoa, JSON.stringify(co), new Date(nowMs).toISOString()).run()
  xoaDemCauHinh(env, khoa) // isolate này thấy cờ mới ngay; isolate khác ≤ 15 s
  return { ok: true, co }
}

// ---------------------------------------------------------------- đọc chung
async function docMot(env: Env, id: string): Promise<ChienDich> {
  const r = await env.DB.prepare('SELECT * FROM chien_dich WHERE id = ?').bind(id).first<Row>()
  if (!r) throw new Error('Không tìm thấy chiến dịch.')
  return (await docChienDichKemBatDau(env, [r]))[0]!
}
/** Danh sách học sinh (đang học) cho bộ chọn khối → lớp → em ở màn giao — CÙNG bảng `emCuaLop` dùng, không phụ thuộc bộ nhớ máy thầy. */
async function dsEm(env: Env) {
  // Thầy 28/09: "lọc theo lớp ở đây nhé" ⇒ DÙNG ĐÚNG nguồn của bộ lọc lớp app thầy (`/gv/lop`, ten-lop.ts): hoc_sinh (không khoá, kể cả em
  // chưa ghi khối — vd tài khoản test) + em chỉ có trong danh_sach; khối của em = khối của lớp em thuộc. Tên em: hoc_sinh, thiếu thì danh_sach.
  const g = await gvLop(env)
  if (!g.ok) return g
  const ten = new Map<string, string>()
  for (const bang of ['danh_sach', 'hoc_sinh']) {
    const r = await env.DB.prepare(`SELECT sbd, ho_ten FROM ${bang}`).all<Row>().catch(() => ({ results: [] as Row[] }))
    for (const x of r.results ?? []) if (str(x.ho_ten)) ten.set(str(x.sbd), str(x.ho_ten))
  }
  const em = (g.lop as { tenLop: string; khoi: string; sbd: string[] }[]).flatMap((l) => l.sbd.map((sbd) => ({ sbd, hoTen: ten.get(sbd) ?? sbd, lop: l.khoi, khoi: l.khoi, tenLop: l.tenLop })))
  return { ok: true, em }
}
async function emCuaLop(env: Env, lop: string): Promise<string[]> {
  const r = await env.DB.prepare("SELECT sbd FROM hoc_sinh WHERE COALESCE(lop,'') = ? AND COALESCE(trang_thai,'') <> 'khoa' ORDER BY sbd").bind(lop).all<Row>()
  return (r.results ?? []).map((x) => str(x.sbd))
}
async function tenEm(env: Env, ds: readonly string[]): Promise<Map<string, string>> {
  if (!ds.length) return new Map()
  const r = await env.DB.prepare('SELECT sbd, ho_ten FROM hoc_sinh WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(ds)).all<Row>()
  return new Map((r.results ?? []).map((x) => [str(x.sbd), str(x.ho_ten) || str(x.sbd)]))
}
/** Mã tờ thầy chọn có thể là tờ ĐÃ TÁCH theo phần (`<gốc>-TN|-DS|-TLN`, như màn Mở ca): tách ra mã gốc (khoá `game_v2_question.ma_de`) + phần. */
const PHAN_THEO_HAU_TO: Record<string, 'I' | 'II' | 'III'> = { TN: 'I', DS: 'II', TLN: 'III' }
export function tachMaTo(maDe: string): { goc: string; phan: 'I' | 'II' | 'III' | null } {
  const m = maDe.trim().match(/^(.*)-(TN|DS|TLN)$/)
  return m ? { goc: m[1]!, phan: PHAN_THEO_HAU_TO[m[2]!]! } : { goc: maDe.trim(), phan: null }
}
export const maGocCuaTo = (maDe: readonly string[]): string[] => [...new Set(maDe.map((m) => tachMaTo(m).goc))]
/**
 * Câu hợp lệ của các tờ đề (đã duyệt, bỏ tự luận), theo thứ tự tờ rồi thứ tự câu trong tờ; câu trùng giữa các tờ chỉ tính MỘT lần (tờ đứng trước giữ).
 * `theoTo`: số câu dùng được mà MỖI tờ góp vào (sau khi bỏ trùng) — cộng lại đúng bằng `qids.length`, để màn giao hiện số từng tờ khớp tổng.
 */
export async function cauCuaToChiTiet(env: Env, maDe: readonly string[]): Promise<{ qids: string[]; theoTo: Record<string, number>; theoMucDo: Record<string, number> }> {
  const r = await env.DB.prepare('SELECT ma_de, qid, json FROM game_v2_question WHERE ma_de IN (SELECT value FROM json_each(?)) ORDER BY rowid').bind(JSON.stringify(maGocCuaTo(maDe))).all<Row>()
  const theoGoc = new Map<string, { qid: string; phan: string; mucDo: string }[]>()
  for (const x of r.results ?? []) {
    let q: PrivateQuestion
    try { q = JSON.parse(str(x.json)) as PrivateQuestion } catch { continue }
    if (!q.reviewed || laCauTuLuan(q)) continue
    const k = str(x.ma_de)
    theoGoc.set(k, [...(theoGoc.get(k) ?? []), { qid: str(x.qid), phan: str(q.phan), mucDo: str((q as { mucDo?: unknown }).mucDo).trim() }])
  }
  const qids: string[] = [], da = new Set<string>(), theoTo: Record<string, number> = {}, theoMucDo: Record<string, number> = {}
  for (const m of maDe) {
    const { goc, phan } = tachMaTo(m)
    let n = 0
    for (const c of theoGoc.get(goc) ?? []) if ((!phan || c.phan === phan) && !da.has(c.qid)) { da.add(c.qid); qids.push(c.qid); n++; const md = c.mucDo || 'Chưa gắn mức độ'; theoMucDo[md] = (theoMucDo[md] ?? 0) + 1 }
    theoTo[m] = (theoTo[m] ?? 0) + n
  }
  return { qids, theoTo, theoMucDo }
}
async function cauCuaTo(env: Env, maDe: readonly string[]): Promise<string[]> {
  return (await cauCuaToChiTiet(env, maDe)).qids
}
/** Lần làm của CẢ LỚP với các câu (một truy vấn), nhóm theo em. */
export async function lanLamCaLop(env: Env, sbd: readonly string[], qids: readonly string[]): Promise<Map<string, LanLam[]>> {
  const ra = new Map<string, LanLam[]>()
  if (!sbd.length || !qids.length) return ra
  let rows: Row[]
  try {
    // 05/10: đọc kèm câu SONG SINH ("<gốc>~ss0..3") và CÂU ANH EM làm thay câu gốc (`raw_json.tc`, lam-lai-so.ts) — như `docLanLam` của em,
    // để Bảng chiến dịch thấy câu đã sửa bằng bản khác. CSDL cũ (thiếu cột) ⇒ truy vấn lùi như trước.
    // 06/10: đọc kèm `purpose` ⇒ dòng câu CHẨN ĐOÁN (purpose 'chan_doan', tc = câu lỗi) không thành lượt của câu lỗi (`lanLamTuDongTc` bỏ).
    rows = (await env.DB.prepare(sqlQidHoacTc('sbd, qid, ngay_vn, luc, ket_qua, assistance, visibility, nguon, purpose', 'sbd IN (SELECT value FROM json_each(?1))'))
      .bind(JSON.stringify(sbd), JSON.stringify(qids.flatMap(cacQidSongSinh)), JSON.stringify(qids)).all<Row>()).results ?? []
  } catch {
    rows = (await env.DB.prepare(`SELECT sbd, qid, ngay_vn, luc, ket_qua, nguon FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND qid IN (SELECT value FROM json_each(?))`)
      .bind(JSON.stringify(sbd), JSON.stringify(qids)).all<Row>()).results ?? []
  }
  const tap = new Set(qids)
  for (const x of rows) {
    if (str(x.visibility) === 'embargoed') continue
    const k = str(x.sbd)
    ra.set(k, [...(ra.get(k) ?? []), ...lanLamTuDongTc(x, lanLamTuDong, tap)])
  }
  return ra
}
async function mocDayLaiCaLop(env: Env, sbd: readonly string[]): Promise<Map<string, string[]>> {
  const ra = new Map<string, string[]>()
  if (!sbd.length) return ra
  const r = await env.DB.prepare('SELECT sbd, qid, luc FROM srs2_day_lai WHERE sbd IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sbd)).all<Row>().catch(() => ({ results: [] as Row[] }))
  for (const x of r.results ?? []) {
    const k = `${str(x.sbd)}|${str(x.qid)}`
    ra.set(k, [...(ra.get(k) ?? []), str(x.luc)])
  }
  return ra
}
/** Trạng thái từng (em, câu) của một chiến dịch. */
/** Thầy chốt 28/09 "Thành thạo lần đầu": loại câu (phần, mức độ, sao) đưa vào `phatLaiCau` ⇒ câu thành thạo lần đầu tính 0 lượt ở mọi ô ước khối lượng.
 *  `tuLuc` (thầy 28/09): chỉ tính lần làm TỪ LÚC GIAO chiến dịch — lịch sử trước đó KHÔNG sinh câu ôn; mọi câu của chiến dịch bắt đầu là câu mới.
 *  `themLuc` (Sửa chiến dịch 28/09): em được THÊM sau ⇒ mốc của em là lúc được thêm. */
export async function trangThaiLop(env: Env, sbd: readonly string[], qids: readonly string[], hanNop: string | null, tuLuc: string, lanDaDoc?: Map<string, LanLam[]>, themLucVao?: ReadonlyMap<string, string> | Promise<ReadonlyMap<string, string>>): Promise<Map<string, Map<string, TrangThaiCau>>> {
  // `themLucVao` (chỉ-thêm, tối ưu 05/10) có thể là Promise (mốc thêm em đang đọc) ⇒ ba lượt đọc dưới đây không chờ nó (trước: chờ thêm một đợt).
  const [lanTho, moc, loai, themLuc] = await Promise.all([lanDaDoc ?? lanLamCaLop(env, sbd, qids), mocDayLaiCaLop(env, sbd), docLoaiCau(env, qids), themLucVao])
  const lan = new Map([...lanTho].map(([em, ds]) => {
    const tu = mocTinhCua(tuLuc, themLuc?.get(em))
    return [em, ds.filter((x) => x.luc >= tu)] as const
  }))
  const ra = new Map<string, Map<string, TrangThaiCau>>()
  for (const em of sbd) {
    const cua = lan.get(em) ?? []
    const theoQid = new Map<string, LanLam[]>()
    for (const x of cua) theoQid.set(x.qid, [...(theoQid.get(x.qid) ?? []), x])
    ra.set(em, new Map(qids.map((q) => [q, phatLaiCau(q, theoQid.get(q) ?? [], hanNop, moc.get(`${em}|${q}`) ?? [], loai.get(q))])))
  }
  return ra
}
const trungVi = (ds: number[]): number => {
  if (!ds.length) return 0
  const s = [...ds].sort((a, b) => a - b)
  const g = Math.floor(s.length / 2)
  return s.length % 2 ? s[g]! : Math.round((s[g - 1]! + s[g]!) / 2)
}

// ---------------------------------------------------------------- danh sách, sức chứa, tạo
async function danhSach(env: Env, nowMs: number, coThongKe = false) {
  const r = await env.DB.prepare("SELECT * FROM chien_dich WHERE trang_thai <> 'da_huy' ORDER BY tao_luc DESC LIMIT 100").all<Row>()
  const homNay = ngayVnCua(nowMs)
  const ds = await docChienDichKemBatDau(env, r.results ?? [])
  // Chỉ-thêm (bản vẽ GV-ChienDichDaGiao 28/09): `thongKe: true` ⇒ số liệu lớp của TỐI ĐA 20 chiến dịch mới nhất (đã làm qua, thành thạo,
  // đúng nhịp, quá tải hôm nay, cần dạy lại). Lỗi đọc một chiến dịch ⇒ `thongKe: null` cho riêng chiến dịch đó. Màn Chữa trên lớp không xin ⇒ nhẹ như cũ.
  const tk = coThongKe ? await Promise.all(ds.slice(0, SO_CD_THONG_KE).map((cd) => thongKeLop(env, cd, homNay, nowMs).catch(() => null))) : []
  return {
    ok: true, homNay,
    chienDich: ds.map(({ qids, sbd, ...c }, i) => ({ ...c, soCau: qids.length, soEm: sbd.length, hetHan: c.hanNop < homNay, sapBatDau: chuaBatDau({ ...c, qids, sbd }, homNay), ...(coThongKe ? { thongKe: tk[i] ?? null } : {}) })),
  }
}
/** Số chiến dịch (mới nhất) được tính số liệu lớp trong `danh-sach` có `thongKe`. */
export const SO_CD_THONG_KE = 20

// ---------------------------------------------------------------- nhịp của em (bản vẽ GV-BangChienDich 28/09)
export type NhipEm = 'vuot' | 'dung' | 'tre12' | 'tre3'
/**
 * Nhịp của một em: trễ = số ngày liền KHÔNG làm câu nào (chưa làm câu nào ⇒ tính từ ngày giao).
 * Trễ ≥ 3 ngày ⇒ `tre3`; 1–2 ngày ⇒ `tre12`; không trễ ⇒ `vuot` khi đã làm qua ≥ mức cần hôm nay + 10 điểm %, còn lại `dung`.
 */
export function nhipEm(tre: number, tiLeLamQua: number, mucCanHomNay: number): NhipEm {
  if (tre >= 3) return 'tre3'
  if (tre >= 1) return 'tre12'
  return tiLeLamQua >= Math.min(1, mucCanHomNay + 0.1) && tiLeLamQua > 0 ? 'vuot' : 'dung'
}
/** Ngày thứ mấy của chiến dịch (tính cả ngày giao) / tổng số ngày tới hạn nộp; mức "đã làm qua" cần đạt hết hôm nay = ngàyThứ / tổngNgày. */
export function mocNhip(taoLuc: string, hanNop: string, homNay: string): { ngayGiao: string; ngayThu: number; tongNgay: number; mucCanHomNay: number } {
  const ms = Date.parse(taoLuc)
  const ngayGiao = Number.isFinite(ms) ? ngayVnCua(ms) : homNay
  const tongNgay = Math.max(1, soNgayGiua(ngayGiao, hanNop) + 1)
  const ngayThu = Math.max(1, Math.min(tongNgay, soNgayGiua(ngayGiao, homNay) + 1))
  return { ngayGiao, ngayThu, tongNgay, mucCanHomNay: ngayThu / tongNgay }
}
/** Số ngày liền em không làm câu nào: `ngayCuoi` = ngày làm gần nhất (null ⇒ tính từ ngày giao). */
const soNgayTre = (ngayCuoi: string | null, ngayGiao: string, homNay: string): number =>
  Math.max(0, soNgayGiua(ngayCuoi ?? ngayGiao, homNay) - 1)

/**
 * ĐỆM số liệu lớp (tối ưu 28/09): `danh-sach` + thongKe = 20 chiến dịch × ~5 truy vấn (đo 2,3–3,7 s). Đệm trong isolate DEM_THONG_KE_MS = 60 s,
 * khoá theo D1 + ngày VN + CHỮ KÝ chiến dịch (em, câu, hạn, mốc bắt đầu, trạng thái) ⇒ chiến dịch vừa sửa/đóng/giao lại là khoá đổi, không đọc bản cũ.
 * Số em vừa làm (sổ) có thể trễ ≤ 60 s trên màn danh sách — màn Bảng chiến dịch (`bang`) vẫn đọc tươi.
 */
export const DEM_THONG_KE_MS = 60_000
type ThongKeLop = Awaited<ReturnType<typeof thongKeLopTho>>
const demThongKe = new WeakMap<object, Map<string, { het: number; p: Promise<ThongKeLop> }>>()
export function xoaDemThongKe(env: Env): void { if (env.DB) demThongKe.delete(dbGoc(env.DB as unknown as object)) }
function thongKeLop(env: Env, cd: ChienDich, homNay: string, nowMs: number): Promise<ThongKeLop> {
  const db = dbGoc(env.DB as unknown as object)
  let m = demThongKe.get(db)
  if (!m) { m = new Map(); demThongKe.set(db, m) }
  const khoa = JSON.stringify([cd.id, homNay, cd.trangThai, cd.hanNop, cd.mocBatDau, cd.sbd, cd.qids])
  const o = m.get(khoa)
  if (o && o.het > nowMs) return o.p
  if (m.size >= 200) m.clear() // chặn cỡ bộ nhớ isolate
  const p = thongKeLopTho(env, cd, homNay)
  p.catch(() => { if (m!.get(khoa)?.p === p) m!.delete(khoa) }) // lỗi ⇒ không đệm
  m.set(khoa, { het: nowMs + DEM_THONG_KE_MS, p })
  return p
}
/** Số liệu LỚP gọn của một chiến dịch (dùng cho danh sách chiến dịch đã giao). */
async function thongKeLopTho(env: Env, cd: ChienDich, homNay: string) {
  const [tt, kh] = await Promise.all([
    trangThaiLop(env, cd.sbd, cd.qids, cd.hanNop, cd.mocBatDau, undefined, docMocThemCaLop(env, cd.id)),
    env.DB.prepare('SELECT sbd, huyet_chien FROM srs2_ke_hoach WHERE ngay = ? AND sbd IN (SELECT value FROM json_each(?))').bind(homNay, JSON.stringify(cd.sbd)).all<Row>().catch(() => ({ results: [] as Row[] })),
  ])
  const moc = mocNhip(cd.mocBatDau, cd.hanNop, homNay)
  const soCau = Math.max(1, cd.qids.length)
  let coXat = 0, thanhThao = 0, dungNhip = 0, emLamQuaDu = 0
  const canDayLai = new Map<string, number>()
  for (const s of cd.sbd) {
    const ds = [...tt.get(s)!.values()]
    const cx = ds.filter((t) => !t.laMoi).length
    coXat += cx
    thanhThao += ds.filter((t) => t.thanhThao).length
    if (cx >= cd.qids.length && cd.qids.length > 0) emLamQuaDu++
    for (const t of ds) if (t.catTia) canDayLai.set(t.qid, (canDayLai.get(t.qid) ?? 0) + 1)
    const ngayCuoi = ds.flatMap((t) => t.lichSu.map((l) => l.ngay)).sort().pop() ?? null
    const n = nhipEm(soNgayTre(ngayCuoi, moc.ngayGiao, homNay), cx / soCau, moc.mucCanHomNay)
    if (n === 'vuot' || n === 'dung') dungNhip++
  }
  const tong = soCau * Math.max(1, cd.sbd.length)
  return {
    coXat: coXat / tong, thanhThao: thanhThao / tong, dungNhip, emLamQuaDu,
    quaTai: (kh.results ?? []).filter((x) => Number(x.huyet_chien) === 1).length,
    canDayLaiCau: canDayLai.size, canDayLaiLuot: [...canDayLai.values()].reduce((a, b) => a + b, 0), mucCanHomNay: moc.mucCanHomNay,
    ngayThu: moc.ngayThu, tongNgay: moc.tongNgay, // chỉ-thêm 29/09: luật Chậm nhịp chung (src/lib/nhip-chien-dich.ts)
  }
}

export const THE_LUC_TOI_DA = 500
/**
 * THỂ LỰC TỰ ĐỘNG (nút gạt "Tự động" ở màn giao): số lượt/ngày NHỎ NHẤT bảo đảm mục tiêu tới hạn nộp —
 * em ở giữa lớp ở vùng vừa sức (≤ 70% sức chứa) VÀ không em nào quá tải (em nặng nhất ≤ 100%). Tối thiểu 10.
 */
export function theLucDeXuat(klGiua: number, klNangNhat: number, D: number): number {
  if (D <= 0) return THE_LUC_TOI_DA
  return Math.min(THE_LUC_TOI_DA, Math.max(10, Math.ceil(klGiua / (0.7 * D)), Math.ceil(klNangNhat / D)))
}

interface DauVaoGiao { ten: string; lop: string | null; sbd: string[]; maDe: string[]; hanNop: string; theLucNgay: number; huyetChien: boolean; maCa: string | null; batDau: string | null; /** Rải đều câu mới theo ngày (thầy 30/09): vắng ⇒ BẬT. */ raiDeu: boolean }
/**
 * NGÀY BẮT ĐẦU (thầy 28/09): vắng / trống ⇒ `null` (bắt đầu ngay lúc giao, như cũ). Không trước hôm nay, không sau hạn nộp.
 * Trả `null` khi đúng hôm nay (không cần lưu dòng phụ).
 */
export function kiemBatDau(batDau: unknown, homNay: string, hanNop: string): string | null {
  const bd = str(batDau).trim()
  if (!bd) return null
  if (!NGAY.test(bd)) throw new Error('Ngày bắt đầu phải là ngày dạng YYYY-MM-DD.')
  if (bd < homNay) throw new Error('Ngày bắt đầu phải từ hôm nay trở đi.')
  if (bd > hanNop) throw new Error('Ngày bắt đầu không được sau hạn nộp.')
  return bd === homNay ? null : bd
}
/** Số ngày làm bài D (tính từ ngày bắt đầu — hoặc hôm nay nếu đã bắt đầu — tới hạn nộp, tính cả hai đầu). */
export const soNgayTuBatDau = (homNay: string, batDau: string | null, hanNop: string): number => soNgayConLai(batDau && batDau > homNay ? batDau : homNay, hanNop)
async function docDauVao(env: Env, b: Row, nowMs: number): Promise<DauVaoGiao> {
  const lop = str(b.lop).trim() || null
  const sbd = mangChuoi(b.sbd).length ? mangChuoi(b.sbd) : lop ? await emCuaLop(env, lop) : []
  const maDe = mangChuoi(b.maDe)
  const hanNop = str(b.hanNop)
  if (!sbd.length) throw new Error('Chưa chọn em nào.')
  if (!maDe.length) throw new Error('Chưa chọn tờ đề nào.')
  if (!NGAY.test(hanNop)) throw new Error('Hạn nộp phải là ngày dạng YYYY-MM-DD.')
  // Thầy 28/09: "thể lực một ngày cho tôi điền con số bất kì" ⇒ chỉ chặn số vô nghĩa (≥ 1, ≤ 500 lượt/ngày).
  const theLucNgay = Math.max(1, Math.min(THE_LUC_TOI_DA, Math.floor(Number(b.theLucNgay) || TRAN_NGAY)))
  const homNay = ngayVnCua(nowMs)
  const batDau = hanNop < homNay ? null : kiemBatDau(b.batDau, homNay, hanNop)
  return { ten: str(b.ten).trim() || 'Chiến dịch luyện', lop, sbd, maDe, hanNop, theLucNgay, huyetChien: b.huyetChien !== false, maCa: str(b.maCa).trim() || null, batDau, raiDeu: b.raiDeu !== false }
}

/** Đồng hồ sức chứa: khối lượng lượt cần của em ở giữa lớp so với D × thể lực/ngày; kèm hai gợi ý đưa về ≤ 70%. */
async function tinhSucChua(env: Env, b: Row, nowMs: number) {
  const dv = await docDauVao(env, b, nowMs)
  const { qids, theoTo, theoMucDo } = await cauCuaToChiTiet(env, dv.maDe)
  const homNay = ngayVnCua(nowMs)
  if (dv.hanNop < homNay) throw new Error('Hạn nộp đã qua.')
  // Có ngày bắt đầu (thầy 28/09) ⇒ D, sức chứa, đề xuất lượt/ngày, trần Quá tải tính TỪ NGÀY BẮT ĐẦU tới hạn.
  const D = soNgayTuBatDau(homNay, dv.batDau, dv.hanNop)
  const tuLuc = dv.batDau ? dauNgayVn(dv.batDau) : new Date(nowMs).toISOString()
  const [tt, noCu] = await Promise.all([trangThaiLop(env, dv.sbd, qids, dv.hanNop, tuLuc), noCuCaLop(env, dv.sbd, homNay, qids)])
  // SỔ NỢ (thầy chốt 29/09): khối lượng của em = lượt câu chiến dịch mới + lượt NỢ CŨ (≈ 2 − cc lượt/câu nợ) ⇒ Tự tính, trần Quá tải kịp hạn.
  const khoiLuong = dv.sbd.map((em) => khoiLuongCan([...tt.get(em)!.values()]) + (noCu.get(em)?.luot ?? 0))
  const kl = trungVi(khoiLuong)
  // Tách lượt của EM Ở GIỮA LỚP thành "câu mới × 2" + "lượt ôn" để thầy đọc được vì sao ra số lượt (chỉ khi có em đúng bằng trung vị).
  const emGiua = dv.sbd.find((_, i) => khoiLuong[i] === kl)
  const tachGiua = emGiua === undefined ? null : (() => {
    const ds = [...tt.get(emGiua)!.values()].filter((t) => !t.catTia && !t.thanhThao)
    const cauMoi = ds.filter((t) => t.laMoi).length
    const luotNoCu = noCu.get(emGiua)?.luot ?? 0
    return { cauMoi, luotOn: kl - 2 * cauMoi - luotNoCu, luotNoCu }
  })()
  const sc = sucChua(kl, D, dv.theLucNgay)
  const tran = D * dv.theLucNgay
  const soBo = Math.max(0, Math.ceil((kl - 0.7 * tran) / 2))
  const Dmoi = Math.ceil(kl / (0.7 * dv.theLucNgay))
  return {
    ok: true, batDau: dv.batDau ?? homNay, soCau: qids.length, theLucDeXuat: theLucDeXuat(kl, Math.max(0, ...khoiLuong), D), soCauTheoTo: theoTo, soCauTheoMucDo: theoMucDo, soEm: dv.sbd.length, D, sucChua: tran, khoiLuongTrungVi: kl, tachGiua, tiLe: sc.tiLe, muc: sc.muc,
    // Rải đều (thầy 30/09, chỉ-thêm): tổng lượt so với D × thể lực KHÔNG đổi; chỉ báo thêm ≈ số câu mới/ngày của em giữa lớp khi bật (3 ngày cuối để ôn).
    // Đúng luật `lapKeHoachNgay`: D ≤ NGAY_DEM ⇒ giao hết câu mới ngay ngày đầu. Có thể VƯỢT lượt/ngày — màn thầy tự so và cảnh báo.
    raiDeu: dv.raiDeu, cauMoiMoiNgay: tachGiua ? (D > NGAY_DEM ? Math.ceil(tachGiua.cauMoi / (D - NGAY_DEM)) : tachGiua.cauMoi) : null,
    soEmQuaTai: khoiLuong.filter((x) => x > tran).length,
    noCu: await dongNoCu(env, noCu, dv.theLucNgay),
    goiY: sc.muc === 'xanh' ? null : {
      rutCon: soBo > 0 && soBo < qids.length ? { soCau: qids.length - soBo, tiLe: (kl - 2 * soBo) / tran } : null,
      luiHan: Dmoi > D ? { hanNop: congNgay(dv.batDau ?? homNay, Dmoi - 1), tiLe: kl / (Dmoi * dv.theLucNgay) } : null,
    },
  }
}

async function tao(env: Env, b: Row, nowMs: number) {
  const dv = await docDauVao(env, b, nowMs)
  let qids = await cauCuaTo(env, dv.maDe)
  const rutCon = Math.floor(Number(b.rutCon) || 0)
  if (rutCon > 0 && rutCon < qids.length) {
    // "Rút còn N câu, giữ câu cả lớp sai nhiều": ưu tiên câu nhiều em chưa thành thạo; hoà thì giữ thứ tự tờ đề.
    const tt = await trangThaiLop(env, dv.sbd, qids, dv.hanNop, new Date(nowMs).toISOString())
    const diem = new Map(qids.map((q) => [q, dv.sbd.filter((em) => !tt.get(em)!.get(q)!.thanhThao).length]))
    const giu = new Set([...qids].sort((a, c) => diem.get(c)! - diem.get(a)! || qids.indexOf(a) - qids.indexOf(c)).slice(0, rutCon))
    qids = qids.filter((q) => giu.has(q))
  }
  if (!qids.length) throw new Error('Các tờ đề đã chọn không có câu dùng được (câu chưa duyệt hoặc tự luận đã được bỏ).')
  const id = crypto.randomUUID()
  await env.DB.prepare(`INSERT INTO chien_dich (id, ten, lop, sbd_json, ma_de_json, qid_json, han_nop, the_luc_ngay, huyet_chien, ma_ca, tao_luc, trang_thai)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,'dang_chay')`)
    .bind(id, dv.ten, dv.lop, JSON.stringify(dv.sbd), JSON.stringify(maGocCuaTo(dv.maDe)), JSON.stringify(qids), dv.hanNop, dv.theLucNgay, dv.huyetChien ? 1 : 0, dv.maCa, new Date(nowMs).toISOString()).run()
  xoaDemChienDich() // danh sách chiến dịch đệm 15 s (srs2-d1.ts) ⇒ em thấy chiến dịch mới ngay
  if (dv.batDau) await ghiBatDau(env, id, dv.batDau)
  // Luôn ghi dòng (phản biện vòng 2 #110): "không có dòng" chỉ còn nghĩa là chiến dịch giao TRƯỚC khi có công tắc ⇒ màn thầy hiện "Bật (mặc định)".
  // Ghi dòng BẬT lỗi thì thôi (không dòng vẫn là bật — chỉ mang nhãn "mặc định"); dòng TẮT phải ghi được.
  if (dv.raiDeu) await ghiRaiDeu(env, id, true, nowMs).catch(() => undefined)
  else await ghiRaiDeu(env, id, false, nowMs)
  return { ok: true, id, soCau: qids.length, soEm: dv.sbd.length, batDau: dv.batDau ?? ngayVnCua(nowMs), raiDeu: dv.raiDeu }
}

/**
 * CÔNG TẮC RẢI ĐỀU trên chiến dịch đang chạy (thầy 30/09): chỉ ghi cờ + xoá đệm. KHÔNG đụng `srs2_ke_hoach` (kế hoạch đã chốt hôm nay giữ nguyên) ⇒ có hiệu lực
 * từ kế hoạch ngày kế tiếp (hoặc lần lập lại kế hoạch hôm nay nếu có — sửa chiến dịch / câu không phục vụ được). Ghi một dòng nhật ký máy để thầy tra.
 */
async function doiRaiDeu(env: Env, id: string, bat: boolean, nowMs: number, nguoi = '') {
  const cd = await docMot(env, id)
  if (cd.trangThai === 'da_huy') throw new Error('Chiến dịch đã huỷ.')
  await ghiRaiDeu(env, id, bat, nowMs)
  const ai = nguoi.trim().slice(0, 60) || 'thầy'
  await env.DB.prepare("INSERT INTO nhat_ky_may (luc, nguon, muc, chu) VALUES (?, 'sua_chien_dich', 'tin', ?)")
    .bind(new Date(nowMs).toISOString(), `${ai} ${bat ? 'bật' : 'tắt'} rải đều câu mới cho chiến dịch "${cd.ten}" (${cd.id}) — em đã mở app hôm nay: áp dụng từ ngày mai; em chưa mở: áp dụng ngay hôm nay`).run().catch(() => null)
  return { ok: true, id, raiDeu: bat }
}

async function doiTrangThai(env: Env, id: string, trangThai: 'da_dong' | 'da_huy', nowMs: number) {
  const r = await env.DB.prepare('UPDATE chien_dich SET trang_thai = ?, dong_luc = ? WHERE id = ?').bind(trangThai, new Date(nowMs).toISOString(), id).run()
  xoaDemChienDich()
  if (!r.meta.changes) throw new Error('Không tìm thấy chiến dịch.')
  return { ok: true }
}

// ---------------------------------------------------------------- bảng chiến dịch
async function bang(env: Env, id: string, nowMs: number) {
  const cd = await docMot(env, id)
  const homNay = ngayVnCua(nowMs)
  const [lanTho, ten, meta, hoSoDang, them] = await Promise.all([lanLamCaLop(env, cd.sbd, cd.qids), tenEm(env, cd.sbd), docMetaCau(env, cd.qids, cd.maDe), docHoSoDangCaLop(env, cd.sbd), docMocThemCaLop(env, cd.id)])
  const tt = await trangThaiLop(env, cd.sbd, cd.qids, cd.hanNop, cd.mocBatDau, lanTho, them)
  // Tên hiển thị của mã dạng (khoá `hangTheoDang` trùng khoá `theoDang`/`dang[]` của bảng).
  const tenCuaMa = new Map<string, string>()
  for (const q of cd.qids) {
    const m = meta.get(q)
    if (m?.dang) tenCuaMa.set(m.dang, m.tenDang ?? m.dang)
  }
  const dangTheoQid = new Map(cd.qids.map((q) => [q, meta.get(q)?.tenDang ?? meta.get(q)?.dang ?? 'Chưa gắn dạng']))
  const dang = [...new Set(dangTheoQid.values())]
  const kh = await env.DB.prepare('SELECT sbd, huyet_chien FROM srs2_ke_hoach WHERE ngay = ? AND sbd IN (SELECT value FROM json_each(?))').bind(homNay, JSON.stringify(cd.sbd)).all<Row>().catch(() => ({ results: [] as Row[] }))
  const huyet = new Set((kh.results ?? []).filter((x) => Number(x.huyet_chien) === 1).map((x) => str(x.sbd)))
  const moc = mocNhip(cd.mocBatDau, cd.hanNop, homNay)
  const soCau = Math.max(1, cd.qids.length)
  const qidTheoDang = new Map(dang.map((d) => [d, cd.qids.filter((q) => dangTheoQid.get(q) === d)]))
  const em = cd.sbd.map((s) => {
    const m = tt.get(s)!
    const ds = [...m.values()]
    const ngayCuoi = ds.flatMap((t) => t.lichSu.map((l) => l.ngay)).sort().pop() ?? null
    const theoDang = Object.fromEntries(dang.map((d) => {
      const cua = qidTheoDang.get(d)!.map((q) => m.get(q)!)
      return [d, cua.length ? cua.filter((t) => t.thanhThao).length / cua.length : null]
    }))
    // Chỉ-thêm 28/09: % câu ĐÃ LÀM QUA theo dạng (0 ⇒ ô heatmap "Chưa làm") và nhịp của em.
    const daLamTheoDang = Object.fromEntries(dang.map((d) => {
      const cua = qidTheoDang.get(d)!.map((q) => m.get(q)!)
      return [d, cua.length ? cua.filter((t) => !t.laMoi).length / cua.length : null]
    }))
    const coXat = ds.filter((t) => !t.laMoi).length
    const tre = soNgayTre(ngayCuoi, moc.ngayGiao, homNay)
    const soNgayTruoc = cd.hanNop < homNay ? moc.tongNgay : Math.max(0, moc.ngayThu - 1)
    const soCauCanTruoc = Math.round(soCau * (soNgayTruoc / moc.tongNgay))
    const soCauTon = coXat === 0 ? 0 : Math.max(0, soCauCanTruoc - coXat)
    return {
      sbd: s, ten: ten.get(s) ?? s, coXat, thanhThao: ds.filter((t) => t.thanhThao).length, canDayLai: ds.filter((t) => t.catTia).length,
      treNhip: ngayCuoi ? Math.max(0, Math.round((Date.parse(homNay) - Date.parse(ngayCuoi)) / 86_400_000) - 1) : null, huyetChien: huyet.has(s), theoDang,
      // Thầy 28/09 (chỉ-thêm): hạng của em theo từng dạng — cùng cách máy dùng để bốc câu mới (L1 Yếu · L2 Trung bình · L3 Khá · L4 Giỏi).
      hangTheoDang: Object.fromEntries(Object.entries(hangTuHoSo(hoSoDang.get(s) ?? [], lanTho.get(s) ?? [], meta, cd.qids, mocTinhCua(cd.mocBatDau, them.get(s))).hangTheoDang)
        .filter(([ma]) => tenCuaMa.has(ma)).map(([ma, h]) => [tenCuaMa.get(ma)!, h])),
      daLamTheoDang, nhip: nhipEm(tre, coXat / soCau, moc.mucCanHomNay), soNgayTre: tre,
      soCauTon, soCauCanTruoc,
    }
  })
  let canDayLai: { qid: string; stt: number; dang: string | undefined; mucDo: string | null; soEm: number; phan: string; qidCung?: string[] }[] = cd.qids.map((q) => ({ qid: q, stt: cd.qids.indexOf(q) + 1, dang: dangTheoQid.get(q), mucDo: meta.get(q)?.mucDo ?? null, soEm: cd.sbd.filter((s) => tt.get(s)!.get(q)!.catTia).length, phan: meta.get(q)?.phan ?? 'I' }))
    .filter((x) => x.soEm > 0).sort((a, b) => b.soEm - a.soEm)
  canDayLai = await chanKhacKhoiLop(env, 'can_day_lai', { lop: cd.lop, sbd: cd.sbd }, canDayLai, { cauCua: (x) => x.qid }) // LUẬT THẦY 05/10: "Cần thầy dạy lại" / "Chiếu cả N câu lên bảng" chỉ câu ĐÚNG khối lớp
  if (canDayLai.length) {
    // Dòng KHÔNG mang nội dung câu (06/10): đoạn đính nội dung cũ chọn cột `phan` mà `game_v2_question` không có nên chưa bao giờ chạy được (lỗi bị nuốt) và máy thầy phải đoán
    // nội dung từ Ngân hàng đề ⇒ lẫn câu lớp 10 vào tờ chữa lớp 11. Nội dung do lệnh `noi-dung-cau` trả khi thầy mở tờ chiếu (đúng mã câu, qua cổng khối); `phan` lấy từ `meta` ở trên.
    // Câu trùng nội dung (chép ở nhiều đề) ⇒ một dòng; số em = em cần dạy lại ở BẤT KỲ bản nào (không đếm đôi một em).
    const nhom = await nhomCauTrung(env, cd.qids)
    canDayLai = gopCauTrung(canDayLai, nhom).map((x) => ({ ...x, soEm: cd.sbd.filter((s) => x.qidCung.some((q) => tt.get(s)!.get(q)!.catTia)).length }))
      .sort((a, b) => b.soEm - a.soEm)
  }
  const tong = cd.qids.length * Math.max(1, cd.sbd.length)
  // SỔ NỢ (29/09): em có nợ cũ (ngoài chiến dịch này) vượt trần 50% nhiều ngày ⇒ dòng báo thầy. Lỗi đọc ⇒ không báo.
  const noCu = await noCuCaLop(env, cd.sbd, homNay, cd.qids, cd.id).then((m) => dongNoCu(env, m, cd.theLucNgay, ten)).catch(() => [])
  // So với hôm qua (chỉ-thêm): phát lại trạng thái chỉ với lần làm TRƯỚC hôm nay.
  const lanHomQua = new Map([...lanTho].map(([k, v]) => [k, v.filter((x) => x.ngay < homNay)] as const))
  const ttHomQua = await trangThaiLop(env, cd.sbd, cd.qids, cd.hanNop, cd.mocBatDau, lanHomQua, them)
  let cxHq = 0, ttHq = 0
  for (const s of cd.sbd) for (const t of ttHomQua.get(s)!.values()) { if (!t.laMoi) cxHq++; if (t.thanhThao) ttHq++ }
  const nhip = { vuot: 0, dung: 0, tre12: 0, tre3: 0 }
  for (const e of em) nhip[e.nhip]++
  // % thành thạo trung bình lớp theo dạng + hạng lớp theo dạng (cùng ngưỡng thuật toán: Yếu < 40 · TB 40–65 · Khá 65–85 · Giỏi > 85).
  const theoDangLop: Record<string, number | null> = {}
  const hangLopTheoDang: Record<string, HangEm> = {}
  for (const d of dang) {
    const n = qidTheoDang.get(d)!.length * cd.sbd.length
    const dat = cd.sbd.reduce((sum, s) => sum + qidTheoDang.get(d)!.filter((q) => tt.get(s)!.get(q)!.thanhThao).length, 0)
    theoDangLop[d] = n ? dat / n : null
    if (n) hangLopTheoDang[d] = hangTuTiLe(dat / n)
  }
  return {
    ok: true, chienDich: { ...cd, qids: undefined, sbd: undefined, soCau: cd.qids.length, soEm: cd.sbd.length }, homNay, hetHan: cd.hanNop < homNay,
    lop: {
      coXat: em.reduce((s, x) => s + x.coXat, 0) / tong, thanhThao: em.reduce((s, x) => s + x.thanhThao, 0) / tong, huyetChien: huyet.size, canDayLaiCau: canDayLai.length, canDayLaiLuot: canDayLai.reduce((s, x) => s + x.soEm, 0),
      homQua: { coXat: cxHq / tong, thanhThao: ttHq / tong },
      nhip, dungNhip: nhip.vuot + nhip.dung, mucCanHomNay: moc.mucCanHomNay, ngayThu: moc.ngayThu, tongNgay: moc.tongNgay,
      theoDang: theoDangLop, hangTheoDang: hangLopTheoDang,
    },
    dang, em, canDayLai, noCu,
  }
}

/**
 * Dòng báo "Em X còn N câu nợ cũ — cần ≈ K ngày" (thầy chốt 29/09): em có nợ cũ cần ≥ NGUONG_BAO_NO_NGAY ngày để trả hết trong trần 50%
 * thể lực/ngày. Xếp em cần nhiều ngày nhất trước.
 */
/** KHOÁ NỘI DUNG (cùng `khoaCau` của app: thân đề + phương án/ý). Thân đề rỗng ⇒ không gộp (khoá theo qid). */
function khoaNoiDungJson(qid: string, q: Record<string, unknown> | null): string {
  if (!q || !String(q.text ?? '').trim()) return `qid:${qid}`
  const mang = (v: unknown) => (Array.isArray(v) ? v.map((t) => String(t ?? '')) : undefined)
  return khoaCau({ text: String(q.text), choices: mang(q.choices), ideas: mang(q.ideas) })
}

/** CÂU TRÙNG NỘI DUNG trong một chiến dịch (thầy 05/10: "những câu trùng nội dung khi gọi lên bảng thì chỉ hiện 1 lần"): qid ⇒ MỌI qid cùng
 * nội dung (giữ thứ tự của chiến dịch; bản đầu là bản đại diện). Một truy vấn; lỗi đọc ⇒ mỗi câu một nhóm (không gộp gì). */
export async function nhomCauTrung(env: Env, qids: readonly string[]): Promise<Map<string, string[]>> {
  const khoa = new Map<string, string>()
  const rows = (await env.DB.prepare('SELECT qid, json FROM game_v2_question WHERE qid IN (SELECT value FROM json_each(?))').bind(JSON.stringify([...new Set(qids)])).all<Row>().catch(() => ({ results: [] as Row[] }))).results ?? []
  for (const r of rows) {
    const q = str(r.qid)
    if (khoa.has(q)) continue
    let j: Record<string, unknown> | null = null
    try { j = JSON.parse(str(r.json)) as Record<string, unknown> } catch { j = null }
    khoa.set(q, khoaNoiDungJson(q, j))
  }
  const nhom = new Map<string, string[]>()
  for (const q of qids) {
    const k = khoa.get(q) ?? `qid:${q}`
    nhom.set(k, [...(nhom.get(k) ?? []), q])
  }
  const ra = new Map<string, string[]>()
  for (const ds of nhom.values()) for (const q of ds) ra.set(q, ds)
  return ra
}

/** Gộp các dòng cùng nhóm nội dung (giữ dòng đứng trước) — mỗi dòng mang `qidCung` = cả nhóm để "Chữa xong" / "Thầy chữa" mở khoá đủ các bản. */
export function gopCauTrung<T extends { qid: string }>(ds: readonly T[], nhom: ReadonlyMap<string, string[]>): (T & { qidCung: string[] })[] {
  const theoDaiDien = new Map<string, T & { qidCung: string[] }>()
  for (const x of ds) {
    const cung = nhom.get(x.qid) ?? [x.qid]
    if (!theoDaiDien.has(cung[0]!)) theoDaiDien.set(cung[0]!, { ...x, qidCung: [...cung] })
  }
  return [...theoDaiDien.values()]
}

export async function dongNoCu(env: Env, noCu: ReadonlyMap<string, NoCuEm>, theLucNgay: number, tenSan?: ReadonlyMap<string, string>): Promise<{ sbd: string; ten: string; soCau: number; luot: number; soNgay: number; cau: string }[]> {
  const ds = [...noCu].map(([sbd, n]) => ({ sbd, ...n, soNgay: soNgayTraNo(n.luot, theLucNgay) })).filter((x) => x.soNgay >= NGUONG_BAO_NO_NGAY)
  if (!ds.length) return []
  const ten = tenSan ?? (await tenEm(env, ds.map((x) => x.sbd)).catch(() => new Map<string, string>()))
  return ds
    .sort((a, b) => b.soNgay - a.soNgay || b.soCau - a.soCau || (a.sbd < b.sbd ? -1 : 1))
    .map((x) => {
      const t = ten.get(x.sbd) ?? x.sbd
      return { ...x, ten: t, cau: `Em ${t} còn ${x.soCau} câu nợ cũ — cần ≈ ${x.soNgay} ngày để trả hết` }
    })
}

// ---------------------------------------------------------------- buổi chữa
/** DẠNG ĐÃ CHỮA THEO TỪNG EM (thầy 06/10: "sau khi chữa xong 11 câu thì những câu còn lại chữa thế nào" + "chữa nhiều lớp thì không thể chữa lớp này xong
 *  lại chữa câu tiếp theo cho lớp kia"). Chỉ-thêm, tạo tại chỗ. Một chiến dịch gộp NHIỀU lớp; thầy chữa từng lớp (chọn "em có mặt"):
 *  "Chữa xong" ghi (em có mặt × câu vừa chữa); lần xếp sau chỉ BỎ dạng mà MỌI em đang có mặt đã được chữa ⇒ lớp kia chưa chữa vẫn thấy đủ câu,
 *  còn lớp vừa chữa tự tới các dạng còn lại. (Bản 06/10 đầu ghi theo cả chiến dịch ⇒ chữa xong lớp A làm lớp B mất câu — đã sửa.)
 *  Trước đây câu chỉ có em "chưa thành thạo" (không ai cần dạy lại) không để lại dấu gì ⇒ vẫn đứng đầu mãi, các câu bị bỏ bớt không bao giờ tới lượt. */
const LENH_BANG_DA_CHUA = [
  'CREATE TABLE IF NOT EXISTS buoi_chua_em_da_chua (chien_dich_id TEXT NOT NULL, sbd TEXT NOT NULL, qid TEXT NOT NULL, dang TEXT NOT NULL, luc TEXT NOT NULL, PRIMARY KEY (chien_dich_id, sbd, qid))',
]
const tenDangCau = (m: { tenDang?: unknown; dang?: unknown } | undefined): string => String(m?.tenDang ?? m?.dang ?? 'Chưa gắn dạng')
/** Dạng mà MỌI em trong `em` đã được chữa (em rỗng ⇒ không dạng nào). */
async function docDangDaChua(env: Env, id: string, em: readonly string[]): Promise<Set<string>> {
  await chayDdlMotLan(env, 'buoi_chua_em_da_chua', LENH_BANG_DA_CHUA)
  if (!em.length) return new Set()
  const r = await env.DB.prepare('SELECT dang, sbd FROM buoi_chua_em_da_chua WHERE chien_dich_id = ?').bind(id).all<Row>()
  const theoDang = new Map<string, Set<string>>()
  for (const x of r.results ?? []) {
    const d = str(x.dang)
    let t = theoDang.get(d)
    if (!t) { t = new Set(); theoDang.set(d, t) }
    t.add(str(x.sbd))
  }
  const xong = new Set<string>()
  for (const [d, t] of theoDang) if (em.every((s) => t.has(s))) xong.add(d)
  return xong
}
/** Điểm chữa của câu = số em chưa thành thạo + 2 × số em cần thầy dạy lại. Mỗi dạng một câu đại diện (điểm cao nhất). */
async function buoiChua(env: Env, id: string, nowMs: number, coMat: string[]) {
  const cd = await docMot(env, id)
  const em = coMat.length ? cd.sbd.filter((s) => coMat.includes(s)) : cd.sbd
  const them = await docMocThemCaLop(env, cd.id)
  const [tt, ten, meta] = await Promise.all([trangThaiLop(env, em, cd.qids, cd.hanNop, cd.mocBatDau, undefined, them), tenEm(env, em), docMetaCau(env, cd.qids, cd.maDe)])
  const cau = cd.qids.map((q) => {
    const chua = em.filter((s) => !tt.get(s)!.get(q)!.thanhThao)
    const dayLai = em.filter((s) => tt.get(s)!.get(q)!.catTia)
    const m = meta.get(q)
    return { qid: q, stt: cd.qids.indexOf(q) + 1, dang: m?.tenDang ?? m?.dang ?? 'Chưa gắn dạng', phan: m?.phan ?? 'I', mucDo: m?.mucDo ?? null, soChuaThanhThao: chua.length, soCanDayLai: dayLai.length, diemChua: chua.length + 2 * dayLai.length, emSua: [...dayLai, ...chua.filter((s) => !dayLai.includes(s))] }
  })
  // Câu trùng nội dung ⇒ xét MỘT bản (bản đứng trước), mang `qidCung` cả nhóm; số em gộp theo em (không đếm đôi).
  const nhom = await nhomCauTrung(env, cd.qids)
  const cauGop = gopCauTrung(await chanKhacKhoiLop(env, 'buoi_chua', { lop: cd.lop, sbd: cd.sbd }, cau, { cauCua: (x) => x.qid }), nhom).map((c) => { // LUẬT THẦY 05/10: buổi chữa chỉ câu ĐÚNG khối lớp
    if (c.qidCung.length < 2) return c
    const chua = em.filter((s) => c.qidCung.some((q) => !tt.get(s)!.get(q)!.thanhThao))
    const dayLai = em.filter((s) => c.qidCung.some((q) => tt.get(s)!.get(q)!.catTia))
    return { ...c, soChuaThanhThao: chua.length, soCanDayLai: dayLai.length, diemChua: chua.length + 2 * dayLai.length, emSua: [...dayLai, ...chua.filter((s) => !dayLai.includes(s))] }
  })
  const theoDang = new Map<string, (typeof cauGop)[number]>()
  const dangDaChua = await docDangDaChua(env, cd.id, em).catch(() => new Set<string>())
  for (const c of cauGop) {
    if (c.diemChua <= 0) continue
    if (dangDaChua.has(c.dang)) continue // dạng đã chữa ở buổi trước: để buổi này tới dạng khác
    const cu = theoDang.get(c.dang)
    if (!cu || c.diemChua > cu.diemChua) theoDang.set(c.dang, c)
  }
  const chon = [...theoDang.values()].sort((a, b) => b.diemChua - a.diemChua)
  // Người giải mẫu: em thành thạo nhiều câu nhất trong dạng đó (không trùng một em cho mọi câu nếu còn em khác).
  const daGiaiMau = new Map<string, number>()
  const deXuat = chon.map((c) => {
    const cungDang = cd.qids.filter((q) => (meta.get(q)?.tenDang ?? meta.get(q)?.dang ?? 'Chưa gắn dạng') === c.dang)
    const giaiMau = [...em].filter((s) => tt.get(s)!.get(c.qid)!.thanhThao)
      .sort((a, b) => (daGiaiMau.get(a) ?? 0) - (daGiaiMau.get(b) ?? 0) || cungDang.filter((q) => tt.get(b)!.get(q)!.thanhThao).length - cungDang.filter((q) => tt.get(a)!.get(q)!.thanhThao).length)[0] ?? null
    if (giaiMau) daGiaiMau.set(giaiMau, (daGiaiMau.get(giaiMau) ?? 0) + 1)
    return { ...c, giaiMau: giaiMau ? { sbd: giaiMau, ten: ten.get(giaiMau) ?? giaiMau } : null, emSua: c.emSua.map((s) => ({ sbd: s, ten: ten.get(s) ?? s })) }
  })
  // Dòng buổi chữa KHÔNG mang nội dung câu (06/10): đoạn đính nội dung cũ ở đây chọn cột `phan` không có trong `game_v2_question` nên chưa bao giờ chạy được; nội dung do lệnh `noi-dung-cau` trả
  // khi thầy mở tờ chiếu (đúng mã câu, qua cổng khối) — không làm nặng lệnh này, và máy thầy không còn phải đoán nội dung câu.
  const tong = cd.qids.length * Math.max(1, em.length)
  let coXat = 0, thanhThao = 0
  for (const s of em) for (const t of tt.get(s)!.values()) { if (!t.laMoi) coXat++; if (t.thanhThao) thanhThao++ }
  return { ok: true, chienDich: { id: cd.id, ten: cd.ten, hanNop: cd.hanNop, lop: cd.lop }, hetHan: cd.hanNop < ngayVnCua(nowMs), soEm: em.length, lop: { coXat: coXat / tong, thanhThao: thanhThao / tong }, daChuaTruoc: dangDaChua.size, cau: deXuat }
}

/** "Chữa xong": câu đã chữa trên lớp ⇒ đếm sai về 0 cho em đang cần dạy lại câu đó; câu vào Đoàn Hộ Tống từ hôm sau.
 *  `coMat` (buổi chữa, 06/10): CHỈ các em có mặt buổi này được mở khoá + ghi "đã chữa"; vắng ⇒ cả chiến dịch (nút ở Bảng chiến dịch như cũ). */
async function chuaXong(env: Env, id: string, qids: string[], nowMs: number, coMat: string[] = []) {
  const cd = await docMot(env, id)
  const emChua = coMat.length ? cd.sbd.filter((s) => coMat.includes(s)) : cd.sbd
  const ds = qids.length ? qids.filter((q) => cd.qids.includes(q)) : cd.qids
  const tt = await trangThaiLop(env, cd.sbd, ds, cd.hanNop, cd.mocBatDau, undefined, await docMocThemCaLop(env, cd.id))
  const luc = new Date(nowMs).toISOString()
  const lenh: ReturnType<Env['DB']['prepare']>[] = []
  for (const s of emChua) for (const q of ds) if (tt.get(s)!.get(q)!.catTia) lenh.push(env.DB.prepare('INSERT OR IGNORE INTO srs2_day_lai (sbd, qid, luc, chien_dich_id) VALUES (?,?,?,?)').bind(s, q, luc, cd.id))
  for (let i = 0; i < lenh.length; i += 50) await env.DB.batch(lenh.slice(i, i + 50))
  // Ghi dạng đã chữa cho lần xếp sau (lỗi ghi không chặn "Chữa xong").
  try {
    await chayDdlMotLan(env, 'buoi_chua_em_da_chua', LENH_BANG_DA_CHUA)
    const meta = await docMetaCau(env, ds, cd.maDe)
    const dsEm = JSON.stringify(emChua)
    for (let i = 0; i < ds.length; i += 50) {
      await env.DB.batch(ds.slice(i, i + 50).map((q) => env.DB.prepare('INSERT OR IGNORE INTO buoi_chua_em_da_chua (chien_dich_id, sbd, qid, dang, luc) SELECT ?, value, ?, ?, ? FROM json_each(?)').bind(cd.id, q, tenDangCau(meta.get(q)), luc, dsEm)))
    }
  } catch (e) {
    console.error('[chua-xong] không ghi được dạng đã chữa:', e instanceof Error ? e.message : e)
  }
  return { ok: true, soLuot: lenh.length, ngayOnLai: congNgay(ngayVnCua(nowMs), 1) }
}

