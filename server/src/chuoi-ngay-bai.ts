// CHUỖI NGÀY THEO BÀI + BÌNH GIỮ CHUỖI (B3 kiểu Duolingo; thầy chốt 26/10 — hợp đồng docs/hop-dong-duolingo-2610.md mục 4–5). HÀM THUẦN, tính lại từ
// nhật ký mỗi lần (không lưu số chuỗi ⇒ không lệch, không cần chốt đêm). Một định nghĩa cho cả học sinh (/hs) và phụ huynh (/ph).
//   · NGÀY ĐẠT: em xong ≥ 1 bài (≥ CAU_MOT_BAI câu có kết quả trong ngày VN, mọi nguồn) HOẶC tự sửa xong ≥ 1 câu.
//   · NGÀY VẮNG CÓ PHÉP (thầy ghi ở điểm danh): TRƯỚC 27/10 giữ chuỗi, không tốn bình; từ 27/10 tính như ngày thường.
//   · BÌNH GIỮ CHUỖI: mang tối đa 2 (đạt mốc 100 ngày ⇒ 3); (trước 27/10: mỗi thứ Hai tặng 1); chuỗi chạm mốc 30 ngày tặng 1; bình mua (ví của đặc tả điểm
//     thưởng) cộng vào ngày mua. Lỡ ngày (không đạt, không phép, không phải hôm nay) ⇒ tự dùng 1 bình: chuỗi giữ, không cộng ngày.
//   · CỨU CHUỖI: lỡ ngày khi hết bình ⇒ chuỗi tắt; ngay NGÀY HÔM SAU (≈ 24 giờ) em xong 1 + 2 bài bù (≥ 3 × CAU_MOT_BAI câu) ⇒ chuỗi sống lại đúng số cũ
//     (ngày lỡ không cộng). Tối đa 1 lần mỗi tuần (tuần tính từ thứ Hai của ngày lỡ). Hôm sau chính là hôm nay mà chưa đủ ⇒ trả `cuu` để giao diện nhắc.
//   · HÔM NAY chưa đạt ⇒ chuỗi giữ tới hôm qua (không về 0 lúc sáng sớm), lịch ghi 'cho'.
// Chừa sẵn cho chuỗi đôi («Học cùng bạn», chưa build): gọi `chuoiNgayCuaEm` cho từng em rồi so lịch.
// LUẬT MỚI 27/10 (thầy: «1 tuần kiếm được 1 bình thôi», «Bỏ phần thầy duyệt đi») — áp TỪ ngày NGAY_LUAT_BINH_MOI, ngày đã qua tính như cũ (không sửa chuỗi cũ):
//   · BỎ tặng bình thứ Hai (thứ Hai trước mốc vẫn tặng như cũ, để số bình / ngày bình đỡ trong quá khứ không đổi);
//   · BỎ «vắng có phép giữ chuỗi»: từ mốc, ngày vắng có phép tính như ngày thường (không học ⇒ dùng bình / tắt / cứu). Dữ liệu điểm danh giữ nguyên.
//   · ĐẶT LẠI BÌNH (thầy duyệt 27/10, lặp lại 28/10 00:01): dòng `chuoi_binh_mua` nguồn bắt đầu TIEN_TO_DAT_LAI_BINH ⇒ ngày đó số bình về 0 (bình mua SAU
//     lúc đặt lại vẫn cộng — nơi đọc lọc). Nhiều lần đặt lại ⇒ vòng lặp ngày gặp từng lần theo thứ tự, lần sau cùng (luc lớn nhất) quyết định.

import { laNgayBaoTri } from './ngay-bao-tri'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'

/** (28/10) Điều kiện một dòng `su_kien_hoc` (KHÔNG bí danh) được tính vào MỨC HÔM NAY — đúng tập «đã làm hôm nay» của Gói 7 (`docDaLamNgay7`): bỏ KTCN,
 *  lướt / chẩn đoán / xem lời giải, câu đang giấu, câu ca thi chưa công bố. Viết lại ở đây (không nhập goi-bai-7 ⇒ không vòng nhập). */
export const SQL_CAU_TINH_MUC = `ma_nguon NOT LIKE 'ktcn:%' AND ${SQL_LA_LAN_LAM} AND COALESCE(visibility,'')<>'embargoed' AND (nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=su_kien_hoc.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))`

export const CAU_MOT_BAI = 6
export const BAI_CUU = 2
export const SUC_CHUA_GOC = 2
export const SUC_CHUA_100 = 3
export const MOC_TANG_BINH = 30
export const MOC_SUC_CHUA = 100
/** Số ngày đọc lùi (đủ cho mọi chuỗi thực tế, chặn truy vấn). */
export const SO_NGAY_DOC = 400
/** Ngày VN bắt đầu luật bình mới 27/10 (bỏ tặng thứ Hai + bỏ giữ chuỗi vì vắng có phép). Ngày TRƯỚC mốc giữ luật cũ. */
export const NGAY_LUAT_BINH_MOI = '2026-10-27'
/** Nguồn của dòng đặt lại bình (bảng `chuoi_binh_mua`, `so` = −số bình em có lúc đặt lại, chỉ để truy vết) — lần 27/10. */
export const NGUON_DAT_LAI_BINH = 'tt-binh-reset-2710'
/** Tiền tố MỌI lần đặt lại bình (thầy 27/10: «00h01 đêm nay reset bình về 0 hết» ⇒ `tt-binh-reset-2810`, …). Mỗi lần một nguồn có hậu tố ngày ⇒ id
 *  `<sbd>|<nguồn>` không trùng lần trước. Nhiều lần: mỗi ngày có dòng đặt lại bình về 0 (lần SAU cùng thắng — luc lớn nhất), bình mua sau mốc vẫn cộng. */
export const TIEN_TO_DAT_LAI_BINH = 'tt-binh-reset'
/** Nguồn đặt lại theo ngày VN (`2026-10-28` ⇒ `tt-binh-reset-2810`). */
export const nguonDatLaiBinh = (ngayVn: string): string => `${TIEN_TO_DAT_LAI_BINH}-${ngayVn.slice(8, 10)}${ngayVn.slice(5, 7)}`
/**
 * Hai cột đọc bình theo ngày VN từ `chuoi_binh_mua` bí danh `m` (nơi gọi thêm FROM/WHERE/GROUP BY theo `n`): `s` = số bình mua (ngày có đặt lại: chỉ bình mua
 * SAU lúc đặt lại), `r` = 1 khi ngày đó có dòng đặt lại. Một nguồn cho cả đọc một em (B3) lẫn đọc nhiều em (phần B).
 */
export const SQL_COT_BINH_MUA = `date(m.luc, '+7 hours') AS n,
    SUM(CASE WHEN m.nguon LIKE '${TIEN_TO_DAT_LAI_BINH}%' THEN 0
      WHEN EXISTS (SELECT 1 FROM chuoi_binh_mua r WHERE r.sbd = m.sbd AND r.nguon LIKE '${TIEN_TO_DAT_LAI_BINH}%' AND r.luc >= m.luc AND date(r.luc, '+7 hours') = date(m.luc, '+7 hours')) THEN 0
      ELSE m.so END) AS s,
    MAX(m.nguon LIKE '${TIEN_TO_DAT_LAI_BINH}%') AS r`
/**
 * LUẬT CHUỖI 28/10 (thầy 27/10: «Chuỗi phải làm xong chặng mới tính chuỗi. Hiện tại đang làm xong chặng 1 là được tính chuỗi»): từ ngày này một ngày giữ
 * chuỗi khi em LÀM ĐỦ MỨC HÔM NAY — số câu Gói 7 đã làm (`soCau7`, cùng thước đo vòng «Đủ mức» / thẻ «Đủ x/y câu») ≥ mức câu đã chốt của ngày
 * (`goi_bai_7_muc_ngay.muc`). Ngày chưa chốt mức ⇒ đủ 1 chặng (CAU_MOT_BAI câu). Tự sửa riêng KHÔNG còn giữ chuỗi. Ngày trước mốc giữ luật cũ.
 * Cứu chuỗi: hôm sau đủ mức + 2 chặng bù (BAI_CUU × CAU_MOT_BAI câu).
 */
export const NGAY_CHUOI_DU_MUC = '2026-10-28'
/** TRẦN BÌNH 28/10 (thầy: «mỗi tuần học sinh chăm nhất cũng chỉ có 1 bình»): mọi đường (mua, quà mốc 30 ngày) chung trần 1 bình / tuần VN. */
export const BINH_TOI_DA_TUAN = 1
/** Ngày `ngay` còn được tặng bình thứ Hai? (chỉ thứ Hai TRƯỚC mốc luật mới) */
export const conTangThuHai = (ngay: string): boolean => ngay < NGAY_LUAT_BINH_MOI && new Date(Date.parse(`${ngay}T00:00:00Z`)).getUTCDay() === 1
/** Vắng có phép ngày `ngay` còn giữ chuỗi? (chỉ ngày TRƯỚC mốc luật mới) */
export const phepConGiuChuoi = (ngay: string): boolean => ngay < NGAY_LUAT_BINH_MOI

export type KieuNgay = 'hoc' | 'binh' | 'phep' | 'cuu' | 'tat' | 'cho'
export interface NhatKyChuoi {
  /** ngày VN → số câu (khác nhau) có kết quả trong ngày, mọi nguồn */
  soCau: ReadonlyMap<string, number>
  /** ngày VN em tự sửa xong ít nhất một câu */
  tuSua: ReadonlySet<string>
  /** ngày VN em vắng có phép */
  phep: ReadonlySet<string>
  /** bình mua theo ngày VN (ngày có đặt lại: chỉ bình mua SAU lúc đặt lại) */
  mua?: ReadonlyMap<string, number>
  /** ngày VN bình được đặt lại về 0 (dòng nguồn NGUON_DAT_LAI_BINH) */
  datLai?: ReadonlySet<string>
  /** (28/10) ngày VN → số câu khác nhau tính MỨC (đúng tập «đã làm hôm nay» của Gói 7: bỏ KTCN, lướt, câu chưa công bố). Vắng ⇒ dùng `soCau`. */
  soCau7?: ReadonlyMap<string, number>
  /** (28/10) ngày VN → mức câu đã chốt (`goi_bai_7_muc_ngay.muc`). */
  muc?: ReadonlyMap<string, number>
}
export interface ChuoiNgay {
  so: number
  giuChuoi: number
  sucChua: number
  lich7: { ngay: string; kieu: KieuNgay }[]
  cuu?: { hetHan: string; daLam: number; can: number; soCu: number }
  binhVuaDo?: string
  /** (CHỈ-THÊM 26/10, chỉ khi nơi gọi xin `thang`) lịch 30 ngày gần nhất + chuỗi dài nhất trong cửa sổ đọc — cùng vòng lặp, không đọc thêm. */
  lich30?: { ngay: string; kieu: KieuNgay }[]
  daiNhat?: number
  /** (28/10) số bình em ĐÃ NHẬN trong tuần VN hiện tại (mua + quà), tính từ lần đặt lại gần nhất — trần BINH_TOI_DA_TUAN. */
  binhTuanNay: number
  /** (28/10) mức câu hôm nay để giữ chuỗi + số câu đã làm (thước đo vòng «Đủ mức»). */
  homNay?: { can: number; da: number }
}

const NGAY = 86_400_000
const ms = (ngay: string) => Date.parse(`${ngay}T00:00:00Z`)
const congNgay = (ngay: string, n: number) => new Date(ms(ngay) + n * NGAY).toISOString().slice(0, 10)
export const ngayVn = (luc: number) => new Date(luc + 7 * 3_600_000).toISOString().slice(0, 10)
/** Thứ Hai đầu tuần của ngày (VN). */
export const thuHaiCua = (ngay: string) => { const d = new Date(ms(ngay)).getUTCDay(); return congNgay(ngay, -((d + 6) % 7)) }

/** Câu tính mức / mức cần của ngày `d` (luật 28/10). */
export const cauMucNgay = (nk: NhatKyChuoi, d: string): number => (nk.soCau7 ?? nk.soCau).get(d) ?? 0
export const canMucNgay = (nk: NhatKyChuoi, d: string): number => Math.max(1, nk.muc?.get(d) ?? CAU_MOT_BAI)
/** Ngày `d` giữ chuỗi? Trước 28/10: ≥ 1 chặng hoặc tự sửa xong · từ 28/10: ĐỦ MỨC HÔM NAY. Một định nghĩa cho chuỗi em, lửa đôi, cược. */
export const ngayDatChuoi = (nk: NhatKyChuoi, d: string): boolean =>
  d < NGAY_CHUOI_DU_MUC ? (nk.soCau.get(d) ?? 0) >= CAU_MOT_BAI || nk.tuSua.has(d) : cauMucNgay(nk, d) >= canMucNgay(nk, d)

/** Chuỗi của MỘT em tại ngày `homNay` (VN) từ nhật ký. */
export function chuoiNgayCuaEm(nk: NhatKyChuoi, homNay: string, thang = false): ChuoiNgay {
  const cau7 = (d: string) => cauMucNgay(nk, d)
  const canMuc = (d: string) => canMucNgay(nk, d)
  const dat = (d: string) => ngayDatChuoi(nk, d)
  const tuanNhan = new Map<string, number>() // tuần VN → số bình đã nhận (mua + quà), xoá khi đặt lại
  const nhan = (d: string, n: number) => { const t = thuHaiCua(d); tuanNhan.set(t, (tuanNhan.get(t) ?? 0) + n) }
  const coHoatDong = [...nk.soCau.keys(), ...nk.tuSua, ...nk.phep].filter(d => d <= homNay).sort()
  const batDau = coHoatDong.length ? (coHoatDong[0]! > congNgay(homNay, -SO_NGAY_DOC) ? coHoatDong[0]! : congNgay(homNay, -SO_NGAY_DOC)) : homNay
  let so = 0, binh = 0, sucChua = SUC_CHUA_GOC, binhVuaDo: string | undefined, daiNhat = 0
  let cuu: ChuoiNgay['cuu']
  const tuanDaCuu = new Set<string>(), lich = new Map<string, KieuNgay>()
  for (let d = batDau; d <= homNay; d = congNgay(d, 1)) {
    if (conTangThuHai(d)) binh = Math.min(sucChua, binh + 1)
    if (nk.datLai?.has(d)) { binh = 0; tuanNhan.set(thuHaiCua(d), 0) }
    const mua = nk.mua?.get(d) ?? 0
    if (mua > 0) { binh = Math.min(sucChua, binh + mua); nhan(d, mua) }
    if (dat(d)) {
      so++
      if (so > daiNhat) daiNhat = so
      lich.set(d, 'hoc')
      // Quà mốc 30 ngày: từ 28/10 chung trần 1 bình/tuần với bình mua (tuần đã nhận bình ⇒ không tặng thêm).
      if (so === MOC_TANG_BINH && (d < NGAY_CHUOI_DU_MUC || (tuanNhan.get(thuHaiCua(d)) ?? 0) < BINH_TOI_DA_TUAN)) { binh = Math.min(sucChua, binh + 1); nhan(d, 1) }
      if (so >= MOC_SUC_CHUA) sucChua = SUC_CHUA_100
      continue
    }
    if (d === homNay) { lich.set(d, 'cho'); continue } // hôm nay chưa xong ⇒ chuỗi giữ tới hôm qua
    if (nk.phep.has(d) && phepConGiuChuoi(d)) { lich.set(d, 'phep'); continue }
    // Ngày bảo trì (ngay-bao-tri.ts): không làm vẫn giữ chuỗi, không tốn bình (vẽ như ngày được đỡ). Đã làm đủ thì đã tính ở trên (lửa +1).
    if (laNgayBaoTri(d)) { lich.set(d, 'phep'); continue }
    if (so === 0) { lich.set(d, 'tat'); continue }
    if (binh > 0) { binh--; binhVuaDo = d; lich.set(d, 'binh'); continue }
    // Hết bình: cứu bằng 2 bài bù ngay hôm sau (một lần mỗi tuần).
    const sau = congNgay(d, 1), tuan = thuHaiCua(d)
    const soSau = sau < NGAY_CHUOI_DU_MUC ? nk.soCau.get(sau) ?? 0 : cau7(sau)
    const nenSau = sau < NGAY_CHUOI_DU_MUC ? CAU_MOT_BAI : canMuc(sau) // phần «đủ mức của hôm đó»; bù = BAI_CUU chặng NGOÀI phần này
    if (!tuanDaCuu.has(tuan) && soSau >= nenSau + BAI_CUU * CAU_MOT_BAI) { tuanDaCuu.add(tuan); lich.set(d, 'cuu'); continue }
    if (sau === homNay && !tuanDaCuu.has(tuan)) {
      // Còn trong hạn cứu: chuỗi tạm tắt, giao diện nhắc học bù. Bài của hôm nay tính bài đầu; phần dư mới là bài bù.
      cuu = { hetHan: new Date(ms(homNay) + NGAY - 7 * 3_600_000).toISOString(), daLam: Math.max(0, Math.floor((soSau - nenSau) / CAU_MOT_BAI)), can: BAI_CUU, soCu: so }
    }
    so = 0
    lich.set(d, 'tat')
  }
  const lichN = (n: number) => Array.from({ length: n }, (_, i) => congNgay(homNay, i - n + 1)).map(ngay => ({ ngay, kieu: lich.get(ngay) ?? 'tat' as KieuNgay }))
  const lich7 = lichN(7)
  const homNayMuc = homNay >= NGAY_CHUOI_DU_MUC ? { can: canMuc(homNay), da: cau7(homNay) } : undefined
  return { so, giuChuoi: binh, sucChua, lich7, ...(cuu ? { cuu } : {}), ...(binhVuaDo ? { binhVuaDo } : {}), ...(thang ? { lich30: lichN(30), daiNhat } : {}),
    binhTuanNay: tuanNhan.get(thuHaiCua(homNay)) ?? 0, ...(homNayMuc ? { homNay: homNayMuc } : {}) }
}
