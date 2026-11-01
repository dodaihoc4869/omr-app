// NGÀY CÓ HỌC cho phần B (26/10): chuỗi đôi, cột chuỗi ở bảng thầy, khối tuần của phụ huynh.
//
// ĐÃ NỐI B3 (chuoi-ngay-bai.ts của Code app 4, lên main #396): MỘT định nghĩa chuỗi với /hs —
//   · ngày đạt = ≥ CAU_MOT_BAI (6) câu KHÁC NHAU có kết quả trong ngày VN (mọi nguồn) HOẶC tự sửa xong ≥ 1 câu (chua_loi_dot 'da_tu_sua');
//   · vắng có phép (buoi_hoc_diem_danh 'co_phep') giữ chuỗi CHỈ với ngày trước 27/10 (luật mới bỏ); bình giữ chuỗi tặng/mua/tự dùng; cứu chuỗi — đều do hàm thuần `chuoiNgayCuaEm` của B3.
// Khác B3 duy nhất ở CÁCH ĐỌC: B3 đọc từng em (4 lượt song song); ở đây đọc NHIỀU em trong CÙNG một batch của nơi gọi (4 câu, tập em là truy vấn con) rồi
// dựng `NhatKyChuoi` từng em và gọi đúng hàm thuần của B3 ⇒ số giống hệt màn học sinh (cửa sổ đọc ≤ SO_NGAY_DOC của B3).
import type { D1PreparedStatement, Env } from './kieu'
import { themNgay } from './ho-so-nam-kt'
import { CAU_MOT_BAI, chuoiNgayCuaEm, ngayDatChuoi, ngayVn as ngayVnMs, NGAY_CHUOI_DU_MUC, phepConGiuChuoi, SO_NGAY_DOC, SQL_CO_KET_QUA_HOAC_LUOT, SQL_COT_BINH_MUA, SQL_SO_CAU_MUC, type ChuoiNgay, type KieuNgay, type NhatKyChuoi } from './chuoi-ngay-bai'
import { str, num, type Row } from './thuong-b-chung'
import { laNgayBaoTri } from './ngay-bao-tri'

export { CAU_MOT_BAI, type KieuNgay }
/** Cửa sổ đọc khi đọc CẢ LỚP / cron (ngày). Một em (phụ huynh) đọc đủ SO_NGAY_DOC như B3. */
export const SO_NGAY_NHIEU_EM = 120

/** Ngày «được đỡ» (không học mà không đứt chuỗi): phép, bình, cứu. */
export const laNgayDo = (k: KieuNgay): boolean => k === 'phep' || k === 'binh' || k === 'cuu'

/** Tập em mặc định: `?1` = JSON danh sách sbd. Nơi gọi có thể thay bằng truy vấn con khác dùng `?1` (vd. em của một lớp) để đọc trong CÙNG batch. */
export const TAP_EM_JSON = '(SELECT value FROM json_each(?1))'
/** Câu khác nhau có kết quả theo (em, ngày VN) — đúng câu đếm của B3. `?2..?3` = khoảng ngày. Chỉ mục idx_skh_em_ngay_qid(sbd, ngay_vn, qid, ket_qua). */
export const sqlSoCau = (tapEm: string = TAP_EM_JSON): string =>
  // (28/10) + c7 = câu tính MỨC (đúng tập Gói 7; 02/11 + câu học cách giải, SQL_SO_CAU_MUC — một số với B3) · m = mức câu đã chốt của ngày — luật chuỗi «đủ mức hôm nay» (chỉ ngày từ NGAY_CHUOI_DU_MUC).
  `SELECT sbd, ngay_vn AS n, COUNT(DISTINCT CASE WHEN ket_qua IS NOT NULL THEN qid END) AS c,
      CASE WHEN ngay_vn >= '${NGAY_CHUOI_DU_MUC}' THEN ${SQL_SO_CAU_MUC} ELSE 0 END AS c7,
      CASE WHEN ngay_vn >= '${NGAY_CHUOI_DU_MUC}' THEN (SELECT g.muc FROM goi_bai_7_muc_ngay g WHERE g.sbd = su_kien_hoc.sbd AND g.ngay = su_kien_hoc.ngay_vn) END AS m
    FROM su_kien_hoc WHERE sbd IN ${tapEm} AND ngay_vn BETWEEN ?2 AND ?3 AND ${SQL_CO_KET_QUA_HOAC_LUOT} GROUP BY sbd, ngay_vn`
/** Ngày tự sửa xong (B3). `?2` = ngày đầu cửa sổ. Chỉ mục idx_cld_sbd_trang_thai(sbd, trang_thai_day, …). */
export const sqlTuSua = (tapEm: string = TAP_EM_JSON): string =>
  `SELECT DISTINCT sbd, date(dong_luc, '+7 hours') AS n FROM chua_loi_dot WHERE sbd IN ${tapEm} AND trang_thai_day = 'da_tu_sua' AND dong_luc >= ?2`
/** Ngày vắng có phép (ngày VN của buổi). */
export const sqlNgayPhep = (tapEm: string = TAP_EM_JSON): string =>
  `SELECT DISTINCT d.sbd AS sbd, date(b.mo_luc, '+7 hours') AS n FROM buoi_hoc_diem_danh d JOIN buoi_hoc b ON b.id = d.buoi_id
    WHERE d.trang_thai = 'co_phep' AND d.sbd IN ${tapEm} AND date(b.mo_luc, '+7 hours') BETWEEN ?2 AND ?3`
/** Bình mua theo ngày (bảng chỉ-thêm `chuoi_binh_mua` của B3; migration-2610-giai-ban.sql khai cùng DDL để câu này luôn chạy). */
export const sqlBinhMua = (tapEm: string = TAP_EM_JSON): string =>
  `SELECT m.sbd AS sbd, ${SQL_COT_BINH_MUA} FROM chuoi_binh_mua m WHERE m.sbd IN ${tapEm} AND m.luc >= ?2 GROUP BY m.sbd, n`

/** Bốn câu ĐỌC (nơi gọi đưa vào batch của mình — không thêm vòng chờ). `thamSo1` = tham số ?1 (danh sách JSON hoặc khoá của truy vấn con). */
export function cauNhatKy(env: Env, tapEm: string, thamSo1: string, tu: string, den: string): D1PreparedStatement[] {
  const tuIso = `${themNgay(tu, -1)}T00:00:00Z`
  return [
    env.DB.prepare(sqlSoCau(tapEm)).bind(thamSo1, tu, den),
    env.DB.prepare(sqlTuSua(tapEm)).bind(thamSo1, tuIso),
    env.DB.prepare(sqlNgayPhep(tapEm)).bind(thamSo1, tu, den),
    env.DB.prepare(sqlBinhMua(tapEm)).bind(thamSo1, tuIso),
  ]
}
export const cauNhatKyDs = (env: Env, dsSbd: readonly string[], tu: string, den: string): D1PreparedStatement[] =>
  cauNhatKy(env, TAP_EM_JSON, JSON.stringify([...new Set(dsSbd)]), tu, den)

type NhatKyGhi = { soCau: Map<string, number>; tuSua: Set<string>; phep: Set<string>; mua: Map<string, number>; datLai: Set<string>; soCau7: Map<string, number>; muc: Map<string, number> }
/** Gộp kết quả bốn câu ⇒ sbd → NhatKyChuoi (đúng kiểu của B3). */
export function gopNhatKy(rSo: Row[] | undefined, rSua: Row[] | undefined, rPhep: Row[] | undefined, rMua: Row[] | undefined): Map<string, NhatKyChuoi> {
  const ra = new Map<string, NhatKyGhi>()
  const lay = (sbd: string): NhatKyGhi => {
    let m = ra.get(sbd)
    if (!m) ra.set(sbd, (m = { soCau: new Map(), tuSua: new Set(), phep: new Set(), mua: new Map(), datLai: new Set(), soCau7: new Map(), muc: new Map() }))
    return m
  }
  for (const x of rSo ?? []) {
    const m = lay(str(x.sbd)), n = str(x.n)
    m.soCau.set(n, num(x.c))
    if (n >= NGAY_CHUOI_DU_MUC) { m.soCau7.set(n, num(x.c7)); if (num(x.m) > 0) m.muc.set(n, num(x.m)) }
  }
  for (const x of rSua ?? []) if (str(x.n)) lay(str(x.sbd)).tuSua.add(str(x.n))
  for (const x of rPhep ?? []) if (str(x.n)) lay(str(x.sbd)).phep.add(str(x.n))
  for (const x of rMua ?? []) if (str(x.n)) { const m = lay(str(x.sbd)); m.mua.set(str(x.n), num(x.s)); if (num(x.r) === 1) m.datLai.add(str(x.n)) }
  return ra
}
export const NHAT_KY_RONG: NhatKyChuoi = { soCau: new Map(), tuSua: new Set(), phep: new Set(), mua: new Map() }

/** Ngày đạt (xong ≥ 1 bài hoặc tự sửa xong ≥ 1 câu) — đúng luật B3. */
export const datNgay = (nk: NhatKyChuoi | undefined, ngay: string): boolean => !!nk && ngayDatChuoi(nk, ngay)
/** Số bài của một ngày: mỗi CAU_MOT_BAI câu khác nhau một bài; ngày chỉ có tự sửa ⇒ 1. */
export const soBaiNgay = (nk: NhatKyChuoi | undefined, ngay: string): number =>
  !nk ? 0 : Math.max(Math.floor((nk.soCau.get(ngay) ?? 0) / CAU_MOT_BAI), nk.tuSua.has(ngay) ? 1 : 0)

/** Chuỗi của một em tại `homNay` — hàm thuần của B3. */
export const chuoiCuaEm = (nk: NhatKyChuoi | undefined, homNay: string): ChuoiNgay => chuoiNgayCuaEm(nk ?? NHAT_KY_RONG, homNay)

/**
 * Kiểu của ngày `ngay` (≤ hôm nay) theo B3: lấy từ lịch 7 ngày của `chuoiNgayCuaEm` (có bình tự dùng / cứu chuỗi). Ngày cũ hơn 7 ngày (cron đuổi kịp) ⇒
 * học / phép / tắt theo nhật ký (không suy được bình).
 */
export function kieuNgayCua(nk: NhatKyChuoi | undefined, ngay: string, homNay: string, chuoi?: ChuoiNgay): KieuNgay {
  const l = (chuoi ?? chuoiCuaEm(nk, homNay)).lich7.find((x) => x.ngay === ngay)
  if (l) return l.kieu
  if (datNgay(nk, ngay)) return 'hoc'
  return (nk?.phep.has(ngay) && phepConGiuChuoi(ngay)) || laNgayBaoTri(ngay) ? 'phep' : 'tat'
}

/** Bulk: sbd → NhatKyChuoi trong [tu, den]. Một batch. */
export async function docNhatKyNhieuEm(env: Env, dsSbd: readonly string[], tu: string, den: string): Promise<Map<string, NhatKyChuoi>> {
  if (dsSbd.length === 0) return new Map()
  const [a, b, c, d] = (await env.DB.batch(cauNhatKyDs(env, dsSbd, tu, den))).map((r) => (r.results ?? []) as Row[])
  return gopNhatKy(a, b, c, d)
}

/**
 * Hàm đơn theo yêu cầu điều phối: một em, một ngày ⇒ kiểu ngày B3 ('hoc' | 'binh' | 'phep' | 'cuu' | 'tat' | 'cho').
 * Xét tại HÔM NAY (`nowMs`): ngày đã qua ⇒ kiểu đã chốt (bình tự dùng, phép, cứu, tắt); ngày là hôm nay mà chưa xong ⇒ 'cho'.
 * Đọc đủ SO_NGAY_DOC ngày như B3 để bình giữ chuỗi tính đúng. Một batch.
 */
export async function ngayCoHoc(env: Env, em: string, ngay: string, nowMs: number = Date.now()): Promise<KieuNgay> {
  const homNay = ngayVnMs(nowMs) > ngay ? ngayVnMs(nowMs) : ngay
  const nk = (await docNhatKyNhieuEm(env, [em], themNgay(homNay, -SO_NGAY_DOC), homNay)).get(em)
  return kieuNgayCua(nk, ngay, homNay)
}
