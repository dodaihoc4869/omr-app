// GIẢI TUẦN kiểu Duolingo (thầy chốt 26/10; đặc tả DAC-TA-THUONG-PHAT-2610.md §4.4–4.6, LUAT «Giải tuần»). Phần B.
//
//   · Nhóm ~20 em CÙNG HẠNG, trộn lớp (`chonNhom`: ưu tiên nhóm ít bạn cùng lớp nhất). 6 hạng sat → kimcuong.
//   · Nguyên tử tính hạng = CHỈ lượt Học thật: tổng tuần CỘNG SẴN bởi trigger trên exp_so (migration-2610-giai-ban.sql) trừ khoản «có hỗ trợ» (assistance);
//     em đang mang nhãn Đối phó (`danh_gia_em_tuan.bac` ≥ 3 của bản xếp `tuan` = thứ Hai mở tuần giải — bản xếp chạy T2 01:00–06:00 cho 14 ngày trước đó,
//     tức nhãn em mang suốt tuần giải) ⇒ 0 (bị loại hết). Bảng sống trong tuần và lúc chốt (T2 00:05, trước lượt xếp mới) dùng CÙNG một bản ⇒ không lệch.
//     Em không biết lý do; thầy/phụ huynh thấy.
//   · Tuần T2 00:00 → CN 22:00 VN. Cron từ thứ Hai 00:05 VN chốt tuần trước: top 5 lên, 4 cuối rơi, Sắt không rơi, Kim cương top 3 «Quán quân»,
//     tinh thể lên hạng 20/30/40/50/60, thông báo `cuoi_tuan`.
//   · ĐỌC (`/hs/giai`, `tomTatGiaiEm`): MỘT batch, mọi câu theo chỉ mục (PK/idx_giai_tuan_nhom), không quét sổ.
//   · KHÔNG trả số báo danh, KHÔNG nhãn, tên bạn = họ tên đủ (thầy 27/10) + lớp.
import type { D1PreparedStatement, Env } from './kieu'
import { gameIdentityHaiBuoc } from './game-v2-auth'
import { CAN_DANG_NHAP } from './on-lai-nop'
import { SBD_THU_NGHIEM } from './thi-dua-hom-nay'
import { tenDayDu } from './thuong-b-chung'
import { themNgay } from './ho-so-nam-kt'
import {
  CO_NHOM, HANG, SO_LEN, SO_QUAN_QUAN, SO_ROI, TINH_THE_LEN_HANG, SQL_TEN_LOP,
  cauHuyHieu, cauThongBao, cauTinhThe, chuanHang, docCongTacTuDong, ghiBangPhanA, hangDuoi, hangTren, hetHanGiayCua, num, sqlCongTac, str, tuanCua,
  batDauTuanMs, type Hang, type Row,
} from './thuong-b-chung'

export const KHOA_DA_CHOT = 'giai_tuan_chot'
/** Khoản exp_so «đúng có hỗ trợ» (KHÔNG vào bảng giải). Khớp ĐÚNG điều kiện CASE trong trigger của migration-2610-giai-ban.sql. */
export const laKhoanHoTro = (loai: unknown, ghiChu: unknown): boolean => str(loai) === 'cau_ho_tro' || (str(loai) === 'cau' && str(ghiChu).startsWith('Câu đúng có hỗ trợ'))

// ═════════════════════════════════ HÀM THUẦN ═════════════════════════════════

/** Nguyên tử Học thật của một dòng tuần. `bac` = bậc xếp học sinh của tuần (null = chưa xếp ⇒ coi là Học thật). */
export function nguyenTuThat(nguyenTu: number, hoTro: number, bac: number | null): number {
  if (bac !== null && bac >= 3) return 0
  return Math.max(0, nguyenTu - Math.max(0, hoTro))
}

export interface ThanhVienGiai {
  em: string
  nguyenTu: number
  vaoLuc: string
}
/** Thứ tự trong nhóm: nguyên tử Học thật giảm dần, hoà ⇒ ai vào tuần sớm hơn, rồi sbd (ổn định). thuHang = vị trí 1..n. */
export function xepNhom<T extends ThanhVienGiai>(ds: readonly T[]): (T & { thuHang: number })[] {
  return [...ds]
    .sort((a, b) => b.nguyenTu - a.nguyenTu || a.vaoLuc.localeCompare(b.vaoLuc) || (a.em < b.em ? -1 : a.em > b.em ? 1 : 0))
    .map((x, i) => ({ ...x, thuHang: i + 1 }))
}

export type KetTuan = 'len' | 'giu' | 'roi'
export interface KetQuaChot {
  em: string
  thuHang: number
  nguyenTu: number
  hangCu: Hang
  hangSau: Hang
  ket: KetTuan
  tinhThe: number
  quanQuan: boolean
}
/**
 * Chốt một nhóm (thuần). n = sĩ số nhóm.
 *   · LÊN: vị trí ≤ 5, có nguyên tử Học thật > 0, chưa ở Kim cương.
 *   · RƠI: không lên, không phải Sắt, vị trí > n − 4 và > 5 (nhóm nhỏ: vùng lên thắng vùng rơi); Kim cương: top 3 không bao giờ rơi.
 *   · Quán quân: Kim cương, vị trí ≤ 3, nguyên tử > 0.
 */
export function chotNhom(hang: Hang, ds: readonly ThanhVienGiai[]): KetQuaChot[] {
  const xep = xepNhom(ds)
  const n = xep.length
  return xep.map((x) => {
    const i = x.thuHang
    const len = hang !== 'kimcuong' && i <= SO_LEN && x.nguyenTu > 0
    const roi = !len && hang !== 'sat' && i > n - SO_ROI && i > SO_LEN
    const hangSau = len ? hangTren(hang) : roi ? hangDuoi(hang) : hang
    return {
      em: x.em, thuHang: i, nguyenTu: x.nguyenTu, hangCu: hang, hangSau,
      ket: len ? 'len' : roi ? 'roi' : 'giu',
      tinhThe: len ? TINH_THE_LEN_HANG[hangSau] : 0,
      quanQuan: hang === 'kimcuong' && i <= SO_QUAN_QUAN && x.nguyenTu > 0,
    }
  })
}

export interface ChoXep { em: string; hang: Hang; lop: string }
export interface NhomCo { nhom: string; hang: Hang; lop: string; n: number }
/**
 * Gán nhóm (thuần) cho các em chờ. Nhóm cùng hạng còn chỗ (< 20): ít bạn CÙNG LỚP nhất (trộn lớp) → đông hơn (lấp đầy) → tên nhóm.
 * Hết chỗ ⇒ mở nhóm mới `<hạng>-<k>`. Trả em → nhóm.
 */
export function chonNhom(cho: readonly ChoXep[], co: readonly NhomCo[]): Map<string, string> {
  const nhom = new Map<string, { hang: Hang; n: number; lop: Map<string, number> }>()
  for (const x of co) {
    const g = nhom.get(x.nhom) ?? { hang: x.hang, n: 0, lop: new Map() }
    g.n += x.n
    g.lop.set(x.lop, (g.lop.get(x.lop) ?? 0) + x.n)
    nhom.set(x.nhom, g)
  }
  const soMoi = (h: Hang): number => {
    let k = 0
    for (const ten of nhom.keys()) {
      const m = new RegExp(`^${h}-(\\d+)$`).exec(ten)
      if (m) k = Math.max(k, Number(m[1]))
    }
    return k + 1
  }
  const ra = new Map<string, string>()
  for (const e of [...cho].sort((a, b) => (a.em < b.em ? -1 : 1))) {
    let tot: string | null = null
    let totG: { n: number; lop: Map<string, number> } | null = null
    for (const [ten, g] of nhom) {
      if (g.hang !== e.hang || g.n >= CO_NHOM) continue
      const cl = g.lop.get(e.lop) ?? 0
      const tl = totG ? totG.lop.get(e.lop) ?? 0 : Infinity
      if (!totG || cl < tl || (cl === tl && (g.n > totG.n || (g.n === totG.n && ten < tot!)))) { tot = ten; totG = g }
    }
    if (!tot) {
      tot = `${e.hang}-${soMoi(e.hang)}`
      totG = { n: 0, lop: new Map() }
      nhom.set(tot, { hang: e.hang, ...totG })
      totG = nhom.get(tot)!
    }
    const g = nhom.get(tot)!
    g.n++
    g.lop.set(e.lop, (g.lop.get(e.lop) ?? 0) + 1)
    ra.set(e.em, tot)
  }
  return ra
}

// ═════════════════════════════════ ĐỌC D1 ═════════════════════════════════

const SQL_EM_TUAN = 'SELECT hang, nhom, nguyen_tu, nguyen_tu_ho_tro FROM giai_tuan WHERE tuan = ?1 AND em = ?2'
const SQL_HANG_TRUOC = 'SELECT COALESCE(hang_sau, hang) AS hang FROM giai_tuan WHERE em = ?1 AND tuan < ?2 ORDER BY tuan DESC LIMIT 1'
const SQL_NHOM_CUA_EM = `SELECT g.em AS em, g.nguyen_tu AS nguyen_tu, g.nguyen_tu_ho_tro AS ho_tro, g.vao_luc AS vao_luc, d.bac AS bac, h.ho_ten AS ho_ten, ${SQL_TEN_LOP('h')} AS lop
  FROM giai_tuan g LEFT JOIN danh_gia_em_tuan d ON d.sbd = g.em AND d.tuan = g.tuan LEFT JOIN hoc_sinh h ON h.sbd = g.em
 WHERE g.tuan = ?1 AND g.nhom NOT IN ('', '-') AND g.nhom = (SELECT nhom FROM giai_tuan WHERE tuan = ?1 AND em = ?2)`
const SQL_CHOT = `SELECT khoa, gia_tri FROM cau_hinh WHERE khoa = '${KHOA_DA_CHOT}'`

/** Câu đọc của bảng giải một em (đưa vào MỘT batch). Thứ tự kết quả: [em tuần, hạng trước, nhóm]. */
export function cauGiaiEm(env: Env, em: string, tuan: string): D1PreparedStatement[] {
  return [env.DB.prepare(SQL_EM_TUAN).bind(tuan, em), env.DB.prepare(SQL_HANG_TRUOC).bind(em, tuan), env.DB.prepare(SQL_NHOM_CUA_EM).bind(tuan, em)]
}

export interface DongGiai { thuHang: number; ten: string; lop: string; nguyenTu: number; laEm: boolean; chuaTinh?: ChuaTinhHang }
/**
 * CHỈ dòng của CHÍNH em (thầy 27/10: «giữ luật Đối phó tuần ⇒ 0, nhưng nói rõ lý do cho chính em»): tuần này bản xếp ghi em bậc ≥ 3 ⇒ bảng tính 0.
 * `nguyenTu` = nguyên tử em kiếm trong tuần (đã trừ câu có hỗ trợ) mà chưa được tính hạng · `lyDo` = các mục phạt của bản xếp tuần (mã + chữ máy ghi), nặng
 * trước, tối đa 3. Dòng bạn khác KHÔNG BAO GIỜ có trường này (máy chủ không gửi nhãn của em khác xuống máy).
 */
export interface ChuaTinhHang { nguyenTu: number; lyDo: { ma: string; chu: string }[] }
/** Mục phạt của bản xếp tuần (`danh_gia_em_tuan.phat_json`) ⇒ lý do hiện cho chính em: nặng trước, chỉ mục có điểm hoặc cờ xấu, tối đa 3. */
export function lyDoChuaTinh(phatJson: unknown): { ma: string; chu: string }[] {
  let ds: unknown
  try { ds = JSON.parse(str(phatJson) || '[]') } catch { return [] }
  if (!Array.isArray(ds)) return []
  return ds.filter((x): x is Row => !!x && typeof x === 'object' && !!str((x as Row).ma) && !!str((x as Row).chu) && (num((x as Row).diem) > 0 || (x as Row).xau === true))
    .sort((a, b) => num(b.diem) - num(a.diem)).slice(0, 3).map((x) => ({ ma: str(x.ma), chu: str(x.chu) }))
}
export interface GiaiCuaEm {
  hang: Hang
  /** '' = chưa vào bảng tuần này (chưa có nguyên tử) · 'cho' = đang xếp nhóm · 'co' = có nhóm. */
  trangThai: '' | 'cho' | 'co'
  nhom: DongGiai[]
  thuHang: number | null
}
/** Đọc kết quả `cauGiaiEm` (thuần). `kq[3]` (tuỳ chọn, chỉ /hs/giai) = phat_json bản xếp tuần của CHÍNH em ⇒ lý do chưa tính hạng. */
export function docGiaiEm(em: string, kq: (Row[] | undefined)[]): GiaiCuaEm {
  const [rEm, rTruoc, rNhom, rPhat] = kq
  const dongEm = rEm?.[0]
  const hang = chuanHang(dongEm ? dongEm.hang : rTruoc?.[0]?.hang)
  const nhomEm = str(dongEm?.nhom)
  if (!dongEm || nhomEm === '-') return { hang, trangThai: '', nhom: [], thuHang: null }
  if (!nhomEm) return { hang, trangThai: 'cho', nhom: [], thuHang: null }
  let chuaTinh: ChuaTinhHang | undefined
  const xep = xepNhom((rNhom ?? []).map((x) => {
    const bac = x.bac === null || x.bac === undefined ? null : num(x.bac)
    const nt = nguyenTuThat(num(x.nguyen_tu), num(x.ho_tro), bac)
    if (str(x.em) === em && bac !== null && bac >= 3) chuaTinh = { nguyenTu: nguyenTuThat(num(x.nguyen_tu), num(x.ho_tro), null), lyDo: lyDoChuaTinh(rPhat?.[0]?.phat_json) }
    return { em: str(x.em), nguyenTu: nt, vaoLuc: str(x.vao_luc), hoTen: str(x.ho_ten), lop: str(x.lop) }
  }))
  const nhom: DongGiai[] = xep.map((x) => ({ thuHang: x.thuHang, ten: tenDayDu(x.hoTen), lop: x.lop, nguyenTu: x.nguyenTu, laEm: x.em === em, ...(x.em === em && chuaTinh ? { chuaTinh } : {}) }))
  return { hang, trangThai: 'co', nhom, thuHang: nhom.find((x) => x.laEm)?.thuHang ?? null }
}

export interface TomTatGiai { hang: Hang; thuHang: number; soNguoi: number; hetHanGiay: number }

/** Cho phần A gộp vào batch của `/hs/thuong`: câu đọc + hàm đọc kết quả (công tắc là câu đầu). */
export function cauTomTatGiai(env: Env, em: string, nowMs: number = Date.now()): D1PreparedStatement[] {
  return [sqlCongTac(env), ...cauGiaiEm(env, em, tuanCua(nowMs))]
}
export function docTomTatGiai(em: string, kq: (Row[] | undefined)[], nowMs: number = Date.now()): TomTatGiai | null {
  if (!docCongTacTuDong(kq[0]).giai) return null
  const g = docGiaiEm(em, kq.slice(1))
  if (g.trangThai !== 'co' || g.thuHang === null) return null
  return { hang: g.hang, thuHang: g.thuHang, soNguoi: g.nhom.length, hetHanGiay: hetHanGiayCua(tuanCua(nowMs), nowMs) }
}
/**
 * Khối `giai` của `/hs/thuong` (phần A gọi): `{hang, thuHang, soNguoi, hetHanGiay}` hoặc null (công tắc tắt / em chưa vào bảng tuần này / lỗi).
 * MỘT batch đọc; A nên chạy song song với các đọc khác (`Promise.all`) hoặc gộp `cauTomTatGiai` vào batch của mình.
 */
export async function tomTatGiaiEm(env: Env, em: string, nowMs: number = Date.now()): Promise<TomTatGiai | null> {
  try {
    const kq = await env.DB.batch(cauTomTatGiai(env, em, nowMs))
    return docTomTatGiai(em, kq.map((r) => r.results as Row[]), nowMs)
  } catch (e) {
    console.error('[giai] tóm tắt lỗi (bỏ khối):', e instanceof Error ? e.message : e)
    return null
  }
}

// ═════════════════════════════════ GHI: XẾP NHÓM ═════════════════════════════════

const SQL_CHO_XEP = `SELECT g.em AS em, g.hang AS hang, h.sbd AS co, COALESCE(h.trang_thai, '') AS tt, ${SQL_TEN_LOP('h')} AS lop
  FROM giai_tuan g LEFT JOIN hoc_sinh h ON h.sbd = g.em
 WHERE g.tuan = ?1 AND g.nhom = '' AND (?2 = '' OR g.em = ?2) LIMIT ?3`
const SQL_NHOM_CO = `SELECT g.nhom AS nhom, g.hang AS hang, ${SQL_TEN_LOP('h')} AS lop, COUNT(*) AS n
  FROM giai_tuan g LEFT JOIN hoc_sinh h ON h.sbd = g.em
 WHERE g.tuan = ?1 AND g.nhom NOT IN ('', '-') AND g.hang IN (SELECT hang FROM giai_tuan WHERE tuan = ?1 AND nhom = '' AND (?2 = '' OR em = ?2))
 GROUP BY g.nhom, g.hang, lop`

/** Xếp nhóm cho em đang chờ của tuần `tuan` (một em: `chiEm`; cả lô: ≤ `toiDa`). 2 vòng chờ (1 batch đọc + 1 batch ghi CAS nhom = ''). Trả số em đã xếp. */
export async function xepNhomCho(env: Env, tuan: string, chiEm = '', toiDa = 200): Promise<number> {
  const [rCho, rCo] = await env.DB.batch([env.DB.prepare(SQL_CHO_XEP).bind(tuan, chiEm, toiDa), env.DB.prepare(SQL_NHOM_CO).bind(tuan, chiEm)])
  const cho = (rCho?.results ?? []) as Row[]
  if (cho.length === 0) return 0
  const loai: string[] = []
  const xep: ChoXep[] = []
  for (const x of cho) {
    const em = str(x.em)
    if (!x.co || str(x.tt) === 'khoa' || em === SBD_THU_NGHIEM) loai.push(em)
    else xep.push({ em, hang: chuanHang(x.hang), lop: str(x.lop) })
  }
  const gan = chonNhom(xep, ((rCo?.results ?? []) as Row[]).map((x) => ({ nhom: str(x.nhom), hang: chuanHang(x.hang), lop: str(x.lop), n: num(x.n) })))
  const cau = [
    ...[...gan].map(([em, nhom]) => env.DB.prepare("UPDATE giai_tuan SET nhom = ? WHERE tuan = ? AND em = ? AND nhom = ''").bind(nhom, tuan, em)),
    ...loai.map((em) => env.DB.prepare("UPDATE giai_tuan SET nhom = '-' WHERE tuan = ? AND em = ? AND nhom = ''").bind(tuan, em)),
  ]
  for (let i = 0; i < cau.length; i += 100) await env.DB.batch(cau.slice(i, i + 100))
  return gan.size
}

// ═════════════════════════════════ LỆNH /hs/giai ═════════════════════════════════

/**
 * `POST /hs/giai {token}` (hợp đồng «GET /hs/giai»: lệnh đọc; router chỉ nhận POST) →
 * `{ok, bat, hang, hetHanGiay, nhom: {thuHang, ten, lop, nguyenTu, laEm}[], len, roi}`. Công tắc tắt ⇒ `{ok:true, bat:false}`.
 * MỘT batch đọc chạy SONG SONG với bước kiểm mật khẩu. Riêng lần đầu trong tuần mà em còn «chờ xếp» (và tuần trước đã chốt) ⇒ xếp ngay (ghi một lần) rồi đọc lại.
 */
export async function hsGiai(env: Env, b: Row, nowMs: number = Date.now(), envDoc: Env = env): Promise<Row> {
  let sbd: string
  let xong: Promise<string>
  try {
    ;({ sbd, xong } = await gameIdentityHaiBuoc(env, b))
  } catch {
    return { ok: false, error: CAN_DANG_NHAP }
  }
  const tuan = tuanCua(nowMs)
  // Câu cuối: phat_json bản xếp tuần của CHÍNH em (cùng batch, theo PK) ⇒ lý do «chưa tính hạng» chỉ cho em ấy.
  const doc = () => envDoc.DB.batch([sqlCongTac(envDoc), envDoc.DB.prepare(SQL_CHOT), ...cauGiaiEm(envDoc, sbd, tuan),
    envDoc.DB.prepare('SELECT phat_json FROM danh_gia_em_tuan WHERE sbd = ? AND tuan = ?').bind(sbd, tuan)])
  const pDoc = doc()
  pDoc.catch(() => {})
  try {
    await xong
  } catch {
    return { ok: false, error: CAN_DANG_NHAP }
  }
  try {
    let kq = (await pDoc).map((r) => (r.results ?? []) as Row[])
    if (!docCongTacTuDong(kq[0]).giai) return { ok: true, bat: false }
    let g = docGiaiEm(sbd, kq.slice(2))
    const daChotTruoc = str(kq[1]?.[0]?.gia_tri) >= themNgay(tuan, -7)
    if (g.trangThai === 'cho' && daChotTruoc) {
      await xepNhomCho(env, tuan, sbd)
      kq = (await doc()).map((r) => (r.results ?? []) as Row[])
      g = docGiaiEm(sbd, kq.slice(2))
    }
    return {
      ok: true, bat: true, hang: g.hang, hetHanGiay: hetHanGiayCua(tuan, nowMs), nhom: g.nhom,
      len: g.hang === 'kimcuong' ? 0 : SO_LEN, roi: g.hang === 'sat' ? 0 : SO_ROI,
    }
  } catch (e) {
    console.error('[giai] /hs/giai lỗi:', e instanceof Error ? e.message : e)
    return { ok: false, error: 'Chưa xem được giải tuần. Em thử lại sau nhé.' }
  }
}

// ═════════════════════════════════ CRON: XẾP + CHỐT ═════════════════════════════════

let daChotTrongIsolate = ''
export const xoaNhoGiai = (): void => { daChotTrongIsolate = '' }
const NHOM_MOI_LUOT = 10

const SQL_NHOM_CHUA_CHOT = "SELECT DISTINCT nhom FROM giai_tuan WHERE tuan = ?1 AND chot_luc IS NULL AND nhom NOT IN ('', '-') ORDER BY nhom LIMIT ?2"
const SQL_THANH_VIEN_CHOT = `SELECT g.em AS em, g.hang AS hang, g.nhom AS nhom, g.nguyen_tu AS nguyen_tu, g.nguyen_tu_ho_tro AS ho_tro, g.vao_luc AS vao_luc, d.bac AS bac
  FROM giai_tuan g LEFT JOIN danh_gia_em_tuan d ON d.sbd = g.em AND d.tuan = g.tuan
 WHERE g.tuan = ?1 AND g.chot_luc IS NULL AND g.nhom IN (SELECT value FROM json_each(?2))`

/** Chốt một lượt (≤ 10 nhóm) của tuần `tuanChot`. Hết nhóm ⇒ đóng dòng không xếp + ghi `giai_tuan_chot`. */
export async function chotTuan(env: Env, tuanChot: string, tuanMoi: string, nowMs: number): Promise<Row> {
  const luc = new Date(nowMs).toISOString()
  // Em còn chờ xếp của tuần cần chốt (chưa ai mở app, cron chưa kịp) ⇒ xếp trước khi xếp hạng.
  const daXep = await xepNhomCho(env, tuanChot)
  if (daXep > 0) return { xepTruoc: daXep }
  const dsNhom = (((await env.DB.prepare(SQL_NHOM_CHUA_CHOT).bind(tuanChot, NHOM_MOI_LUOT).all<Row>()).results ?? []) as Row[]).map((x) => str(x.nhom))
  if (dsNhom.length === 0) {
    await env.DB.batch([
      env.DB.prepare("UPDATE giai_tuan SET chot_luc = ? WHERE tuan = ? AND chot_luc IS NULL").bind(luc, tuanChot),
      env.DB.prepare('INSERT INTO cau_hinh (khoa, gia_tri, cap_nhat_luc) VALUES (?, ?, ?) ON CONFLICT(khoa) DO UPDATE SET gia_tri = excluded.gia_tri, cap_nhat_luc = excluded.cap_nhat_luc').bind(KHOA_DA_CHOT, tuanChot, luc),
    ])
    daChotTrongIsolate = tuanChot
    return { xong: true }
  }
  const rTv = ((await env.DB.prepare(SQL_THANH_VIEN_CHOT).bind(tuanChot, JSON.stringify(dsNhom)).all<Row>()).results ?? []) as Row[]
  const theoNhom = new Map<string, Row[]>()
  for (const x of rTv) theoNhom.set(str(x.nhom), [...(theoNhom.get(str(x.nhom)) ?? []), x])
  const phanA: D1PreparedStatement[] = []
  let soLen = 0, soRoi = 0
  for (const [, ds] of theoNhom) {
    // MỘT batch mỗi nhóm (≤ ~80 câu): chốt hạng + tinh thể cùng một giao dịch ⇒ không bao giờ «đã chốt mà mất thưởng».
    const ghi: D1PreparedStatement[] = []
    const hang = chuanHang(ds[0]!.hang)
    const kq = chotNhom(hang, ds.map((x) => ({ em: str(x.em), vaoLuc: str(x.vao_luc), nguyenTu: nguyenTuThat(num(x.nguyen_tu), num(x.ho_tro), x.bac === null || x.bac === undefined ? null : num(x.bac)) })))
    for (const k of kq) {
      ghi.push(env.DB.prepare('UPDATE giai_tuan SET nguyen_tu_that = ?, thu_hang_chot = ?, hang_sau = ?, chot_luc = ? WHERE tuan = ? AND em = ? AND chot_luc IS NULL')
        .bind(k.nguyenTu, k.thuHang, k.hangSau, luc, tuanChot, k.em))
      // Em đã có nguyên tử tuần mới TRƯỚC lúc chốt (dòng sinh với hạng cũ, còn chờ xếp) ⇒ sửa hạng tuần mới.
      ghi.push(env.DB.prepare("UPDATE giai_tuan SET hang = ? WHERE tuan = ? AND em = ? AND nhom = ''").bind(k.hangSau, tuanMoi, k.em))
      if (k.tinhThe > 0) ghi.push(cauTinhThe(env, k.em, 'len_hang', k.tinhThe, `${tuanChot}|${k.em}`, luc))
      if (k.ket === 'len') { soLen++; phanA.push(cauHuyHieu(env, k.em, `hang_${k.hangSau}`, tuanChot, luc)) }
      if (k.ket === 'roi') soRoi++
      if (k.quanQuan) phanA.push(cauHuyHieu(env, k.em, 'quan_quan', tuanChot, luc))
      phanA.push(cauThongBao(env, `cuoi_tuan|${tuanChot}|${k.em}`, k.em, 'cuoi_tuan', {
        tuan: tuanChot, ket: k.ket, hangCu: k.hangCu, hangMoi: k.hangSau, thuHang: k.thuHang, soNguoi: kq.length, tinhThe: k.tinhThe, ...(k.quanQuan ? { quanQuan: true } : {}),
      }, luc))
    }
    await env.DB.batch(ghi)
  }
  await ghiBangPhanA(env, phanA, 'cuoi_tuan')
  return { soNhom: theoNhom.size, soLen, soRoi }
}

/**
 * Cron mỗi phút (nhánh không phải 00:01): (1) chốt tuần trước khi đã qua thứ Hai 00:05 VN và chưa chốt (theo lô 10 nhóm/lượt, idempotent);
 * (2) tuần trước đã chốt ⇒ xếp nhóm cho em đang chờ của tuần này (≤ 200 em/lượt). Công tắc tắt ⇒ một câu đọc rồi về.
 * Trả mô tả để ghi log.
 */
export async function cronGiaiTuan(env: Env, nowMs: number = Date.now(), caoDiem = false): Promise<Row> {
  const tuan = tuanCua(nowMs)
  const tuanTruoc = themNgay(tuan, -7)
  if (daChotTrongIsolate === tuanTruoc) {
    if (caoDiem && new Date(nowMs).getUTCMinutes() % 5 !== 0) return { chay: false, lyDo: 'cao_diem' }
    const [rCt] = await env.DB.batch([sqlCongTac(env)])
    if (!docCongTacTuDong(rCt?.results as Row[]).giai) return { chay: false, lyDo: 'tat' }
    return { chay: true, xep: await xepNhomCho(env, tuan) }
  }
  const [rCt, rChot] = await env.DB.batch([sqlCongTac(env), env.DB.prepare(SQL_CHOT)])
  if (!docCongTacTuDong(rCt?.results as Row[]).giai) return { chay: false, lyDo: 'tat' }
  if (str((rChot?.results as Row[])?.[0]?.gia_tri) >= tuanTruoc) {
    daChotTrongIsolate = tuanTruoc
    return { chay: true, xep: await xepNhomCho(env, tuan) }
  }
  if (nowMs < batDauTuanMs(tuan) + 5 * 60_000) return { chay: false, lyDo: 'chua_toi_gio' }
  return { chay: true, chot: await chotTuan(env, tuanTruoc, tuan, nowMs) }
}

export { HANG }
