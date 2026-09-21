// HẰNG SỐ EXP HỌC TẬP + MẢNH KHIÊN — MỘT NGUỒN (DE-XUAT-EXP-MANH-KHIEN-1909.md, thầy chốt 19/09 "Chốt. Quá thông minh").
// Cấm rải các con số này ra chỗ khác. Đổi luật thưởng = đổi ĐÚNG tệp này (và test bảng giá trị `tests/exp-hoc-tap-1909.test.ts`).

/** EXP MỘT câu ĐÚNG (mọi nguồn trừ game): [phần][số sao 0/1/2]. Phần II tính khi đúng đủ 4 ý (sổ đã chấm bằng `isAnswerCorrect`). Thiếu sao → 0 sao. */
export const EXP_CAU: Readonly<Record<'I' | 'II' | 'III', readonly [number, number, number]>> = {
  I: [2, 3, 5],
  II: [3, 5, 8],
  III: [4, 6, 10],
}

/** Thưởng theo việc. */
export const EXP_LO_DUNG_NHIP = 10
export const EXP_LO_TRE_NHIP = 4
export const EXP_BTVN_DUNG_HAN = 15
export const EXP_MOM_XONG = 10
export const EXP_LEN_BAC = 6
export const EXP_KHAC_PHUC = 30
export const EXP_LEN_BANG_DAT = 15
export const EXP_LEN_BANG_CHUA_DAT = 5
/** Ca thi theo điểm: round(điểm 0..10) × hệ số. */
export const EXP_DIEM_CA_HE_SO = 3
export const EXP_DAT_NGAY = 20
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
 * Mốc chuyển tiếp: sự kiện có `luc` TRƯỚC mốc này giữ như đã trả theo luật cũ (KHÔNG tính lại EXP quá khứ). Đặt lúc phát hành EXP mới
 * (ISO). `null` = chưa phát hành (không khoản nào được sinh).
 */
export const EXP_MOI_TU: string | null = null
