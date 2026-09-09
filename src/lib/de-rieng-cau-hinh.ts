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
  /** CẮT VÒNG LẶP THEO ĐỒNG HỒ — MẶC ĐỊNH TẮT.
   *
   * Bản đầu của tôi luôn cắt theo `Date.now()`. Nó chạy đúng trên máy tôi và
   * ĐỎ trên máy CI: hai lần gọi cùng tham số ra hai bộ câu khác nhau, vì máy
   * chậm thì vòng lặp dừng ở chỗ khác. Với hệ thống chấm thi, TẤT ĐỊNH thắng
   * tốc độ — chấm lại phải ra đúng bộ cũ, không phụ thuộc máy nào chạy.
   *
   * Nay ngân sách là SỐ VÒNG (`VONG_DOI_CHO`), một hàm thuần của bài toán. Cờ
   * này chỉ để phanh khẩn cấp trong phép kiểm; bật là mất tất định. */
  CAT_THEO_GIO?: boolean
  /** TRẦN TỔNG SỐ VÒNG cho CẢ lượt sinh, chia đều cho các ô blueprint.
   *
   * Vì sao cần: `VONG_DOI_CHO` là trần của MỘT ô. Ca 60 em × 40 câu chẻ ra 18 ô
   * ⇒ 18 × 20 000 vòng = 2 079 ms, gấp bốn trần 500 ms. Trước đây đồng hồ cắt
   * bớt nên không ai thấy — và chính cái cắt đó làm mất tất định.
   *
   * Nay chia ngân sách theo SỐ Ô, một hàm thuần của bài toán: ô nào cũng được
   * `min(VONG_DOI_CHO, TONG_VONG_TOI_DA / số ô)` vòng. Ca một ô vẫn đủ 20 000
   * vòng nên ngưỡng "kho 200 liền ⇒ đỉnh ≤ 2" không đổi. */
  TONG_VONG_TOI_DA: number
}

export const CAU_HINH_TRAN_TRUNG_MAC_DINH: CauHinhDeRiengTranTrung = {
  VONG_DOI_CHO: 20000,
  NGAN_SACH_MS: 500,
  LECH_TAN_SUAT_TOI_DA: 1,
  TONG_VONG_TOI_DA: 45000,
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
