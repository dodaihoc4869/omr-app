// HẰNG SỐ EXP HỌC TẬP + MẢNH KHIÊN — MỘT NGUỒN (DE-XUAT-EXP-MANH-KHIEN-1909.md, thầy chốt 19/09 "Chốt. Quá thông minh").
// Cấm rải các con số này ra chỗ khác. Đổi luật thưởng = đổi ĐÚNG tệp này (và test bảng giá trị `tests/exp-hoc-tap-1909.test.ts`).

/** EXP MỘT câu ĐÚNG (mọi nguồn trừ game): [phần][số sao 0/1/2]. Phần II tính khi đúng đủ 4 ý (sổ đã chấm bằng `isAnswerCorrect`). Thiếu sao → 0 sao. */
export const EXP_CAU: Readonly<Record<'I' | 'II' | 'III', readonly [number, number, number]>> = {
  I: [2, 3, 5],
  II: [3, 5, 8],
  III: [4, 6, 10],
}

/**
 * BẢNG GIÁ ĐỔI THEO NGÀY VN (Điều 10, thầy lệnh 21/09/2026 13:47: khớp 36 ngày khiên / 21 ngày cấp 10 / 1 200 ngày cấp 120): em ĐẠT nhiệm vụ ngày và chơi 3 lượt thú phải kiếm đủ 200 EXP dù học yếu.
 * Ngày < `NGAY_BANG_GIA_MOI` giữ bảng CŨ (sổ cũ không tính lại); từ ngày đó dùng bảng MỚI. Giá tra bằng `bangGiaExp(ngày của khoản)` — cấm rải số ra chỗ khác.
 * `dauNgay`: câu ĐÚNG đầu tiên trong ngày (mọi nguồn kể cả game; KHÔNG tính vào trần EXP game 120/ngày). `troLai`: ngày đầu em có sự kiện học sau ≥ `TRO_LAI_VANG_TOI_THIEU` ngày VN liền không có sự kiện nào,
 * nhiều nhất 1 lần trong `TRO_LAI_CACH_NHAU` ngày; em chưa từng học thì không có.
 */
export const NGAY_BANG_GIA_MOI = '2026-09-22'
export interface BangGiaExp {
  datNgay: number
  loDungNhip: number
  loTreNhip: number
  btvnDungHan: number
  dauNgay: number
  troLai: number
}
export const BANG_GIA_CU: Readonly<BangGiaExp> = { datNgay: 20, loDungNhip: 10, loTreNhip: 4, btvnDungHan: 15, dauNgay: 0, troLai: 0 }
export const BANG_GIA_MOI: Readonly<BangGiaExp> = { datNgay: 80, loDungNhip: 20, loTreNhip: 8, btvnDungHan: 30, dauNgay: 10, troLai: 30 }
export const bangGiaExp = (ngay: string): Readonly<BangGiaExp> => (ngay >= NGAY_BANG_GIA_MOI ? BANG_GIA_MOI : BANG_GIA_CU)
export const TRO_LAI_VANG_TOI_THIEU = 3
export const TRO_LAI_CACH_NHAU = 14

/** Thưởng theo việc (giữ nguyên qua Điều 10). */
export const EXP_MOM_XONG = 10
export const EXP_LEN_BAC = 6
export const EXP_KHAC_PHUC = 30
export const EXP_LEN_BANG_DAT = 15
export const EXP_LEN_BANG_CHUA_DAT = 5
/** Ca thi theo điểm: round(điểm 0..10) × hệ số. */
export const EXP_DIEM_CA_HE_SO = 3
/** Game "Đoàn Hộ Tống" — tiếp sức đồng đội: EXP mỗi lần, tối đa số lần mỗi ngày VN (game GỌI `ghiTiepSuc` của `exp-d1.ts`, không tự ghi sổ EXP). */
export const EXP_TIEP_SUC = 3
export const TIEP_SUC_TOI_DA_NGAY = 5
/** Chuỗi ngày đạt: HE_SO × min(chuỗi, TOI_DA). */
export const EXP_CHUOI_HE_SO = 2
export const EXP_CHUOI_TOI_DA = 10

/**
 * Trần MỀM (thay trần cứng 100/ngày): EXP CÂU tính đủ cho tới khi số câu-được-thưởng trong ngày đạt HE_SO × mục tiêu ngày;
 * các câu sau nhận TY_LE (làm tròn LÊN, tối thiểu 1). Thưởng theo việc không bị trần.
 */
export const TRAN_MEM_HE_SO = 2
export const TRAN_MEM_TY_LE = 0.25

/**
 * Mảnh khiên (khiên RÈN, thêm vào khiên quà tiến hoá). THẦY LỆNH 21/09/2026: "ít nhất học đều 36 ngày mới lấy được khiên đầu tiên" ⇒ NGUỒN MẢNH DUY NHẤT là "đạt nhiệm vụ ngày" +1/ngày,
 * `MANH_MOI_KHIEN = 36`. Thưởng mảnh ở chuỗi 7 và ở dạng rời danh sách yếu = 0 (giữ khoá sổ + ghi chú, KHÔNG cộng mảnh, KHÔNG đổi EXP). Mảnh em đang có giữ nguyên (7/12 ⇒ 7/36);
 * khiên rèn đã có giữ nguyên. Núm cũ: 8 dễ / 12 vừa / 16 khó.
 */
export const MANH_DAT_NGAY = 1
export const MANH_CHUOI_BOI_SO = 7
export const MANH_CHUOI_BOI_SO_THUONG = 0
export const MANH_DANG_ROI_YEU = 0
export const MANH_MOI_KHIEN = 36
/** Khiên rèn CHƯA dùng tối đa; đang đủ thì mảnh vẫn cộng nhưng kẹp ở MANH_TOI_DA. */
export const KHIEN_REN_TOI_DA = 5
export const MANH_TOI_DA = 2 * MANH_MOI_KHIEN

/**
 * MỐC TÍNH LẠI KHIÊN (thầy lệnh 21/09: "RESET lại hết mảnh khiên và mốc ban đầu cho công bằng"): `cau_hinh.khien_moc` = ngày VN 'YYYY-MM-DD'. Có mốc ⇒ mảnh chỉ tính từ các dòng `manh_khien_so`
 * có `ngay_vn` ≥ mốc (dòng cũ GIỮ NGUYÊN trong sổ, chỉ không được đếm); vắng / sai dạng ⇒ y hệt cũ (chuỗi rỗng ≤ mọi ngày). Dùng chung MỘT đoạn SQL này ở mọi nơi cộng mảnh.
 */
export const KHOA_KHIEN_MOC = 'khien_moc'
export const SQL_KHIEN_MOC = `COALESCE((SELECT CASE WHEN gia_tri GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN gia_tri END FROM cau_hinh WHERE khoa = '${KHOA_KHIEN_MOC}'), '')`
/**
 * SỐ MẢNH được tính của một dòng `manh_khien_so`: có mốc ⇒ CHỈ dòng `loai = 'dat'` (nguồn mảnh duy nhất: đạt nhiệm vụ ngày). Dòng `dang` (+2) / `chuoi7` (+3) sinh TRƯỚC lệnh thầy 21/09 nằm ngay trong ngày mốc
 * (171 dòng = 342 mảnh của 29 em ngày 21/09) — không được cộng lại sau reset. Vắng mốc ⇒ đếm mọi dòng như cũ.
 */
export const SQL_SO_MANH_TINH = `CASE WHEN loai = 'dat' OR ${SQL_KHIEN_MOC} = '' THEN so ELSE 0 END`
/** Khiên QUÀ TIẾN HOÁ ĐẦU TIÊN (mốc cấp 10) chỉ mở khi em có ≥ chừng này NGÀY ĐẠT nhiệm vụ ngày tính từ `khien_moc` (thầy chọn phương án B, 21/09). MÁY CHỦ là nguồn duy nhất tính khiên còn lại. */
export const NGAY_DAT_MO_KHIEN_QUA = 36
/** Cấp thần thú của mốc tiến hoá đầu (`EVOLUTION_LEVELS[1]`): khiên quà ở mốc này là "khiên quà đầu tiên" bị khoá theo ngày đạt. */
export const CAP_KHIEN_QUA_DAU = 10
/** Vắng bao nhiêu NGÀY LIÊN TIẾP không đạt nhiệm vụ ngày thì mất 1 khiên (Boss chốt 7; thầy đổi được ở đây). Ngày nghỉ hợp lệ không tính là vắng. */
export const KHIEN_MAT_KHI_VANG_NGAY = 7
/** Ngày vắng thứ mấy thì báo em MỘT tin (chỉ khi em đang có khiên). */
export const KHIEN_BAO_VANG_NGAY = 5

/**
 * Mốc chuyển tiếp: sự kiện có `luc` TRƯỚC mốc này giữ như đã trả theo luật cũ (KHÔNG tính lại EXP quá khứ). Đặt lúc phát hành EXP mới
 * (ISO). `null` = chưa phát hành (không khoản nào được sinh).
 */
export const EXP_MOI_TU: string | null = null
