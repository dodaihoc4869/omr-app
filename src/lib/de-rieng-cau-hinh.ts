// MỘT NGUỒN SỰ THẬT CHO THUẬT TOÁN CHẶN TRẦN TRÙNG CÂU.
//
// Đặc tả: DE-RIENG-CHAN-TRAN-TRUNG.md, mục "một nguồn sự thật cấu hình".
// Cấm rải mấy con số này ra chỗ khác — đổi một ngưỡng phải đổi đúng một chỗ.

export interface CauHinhDeRiengTranTrung {
  /** Số vòng đổi chỗ tối đa ở pha 2. */
  VONG_DOI_CHO: number
  /** Trần thời gian cho CẢ lượt sinh, mili giây. Quá thì dừng sớm và trả bộ
   * tốt nhất đang có — không bao giờ để thầy đứng chờ giữa lúc mở ca. */
  NGAN_SACH_MS: number
  /** Tần suất dùng của mọi câu trong CÙNG một ô blueprint được phép chênh nhau
   * tối đa bấy nhiêu. Pha 1 bảo đảm bằng 1; pha 2 không được phá. */
  LECH_TAN_SUAT_TOI_DA: number
}

export const CAU_HINH_TRAN_TRUNG_MAC_DINH: CauHinhDeRiengTranTrung = {
  VONG_DOI_CHO: 20000,
  NGAN_SACH_MS: 500,
  LECH_TAN_SUAT_TOI_DA: 1,
}

/** SÀN LÝ THUYẾT của số câu trùng TRUNG BÌNH giữa hai em bất kỳ.
 *
 * Suy từ bất đẳng thức lồi trên số lần dùng của từng câu: kho N câu, mỗi em k
 * câu, m em thì tổng số lần dùng là m·k, chia đều ra N câu. Không thuật toán
 * nào xuống dưới sàn này được — biết sàn thì biết khi nào nên sửa thuật toán và
 * khi nào phải nạp thêm câu vào kho.
 *
 * `m·k ≤ N` ⇒ sàn bằng 0, tức chia hẳn cho mỗi em một bộ rời nhau được. */
export function sanTrungTrungBinh(N: number, k: number, m: number): number {
  if (m <= 1 || N <= 0 || k <= 0) return 0
  if (m * k <= N) return 0
  return (k / N) * ((m * k - N) / (m - 1))
}

/** ĐỦ KHO ĐỂ TRÙNG BẰNG 0 CHƯA — dùng cho dòng chữ trên màn Ca thi.
 * Trả về số câu CÒN THIẾU; 0 nghĩa là đã đủ. */
export function thieuBaoNhieuCauDeKhongTrung(N: number, k: number, m: number): number {
  const can = m * k
  return can > N ? can - N : 0
}
