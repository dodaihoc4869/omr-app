// LIVE BẢNG — CHỌN HỆ SỐ PHÓNG CHO TẤM GIẤY ĐỀ DỰNG THƯỜNG (GiayDe ở LopLive.tsx / TrinhPhat.tsx). Thuần.
// LỖI 11/11 (thầy, bản sống số 1618: «khi chuyển câu bấm L lên bảng thì máy học sinh vào màn hình live, đề nhấp nháy lên xuống»): bản trước tính
// k = (cao giấy − 28) / (cao khối đề) rồi đặt bề ngang khối = (rộng − 36) / k — mà cao khối đề lại phụ thuộc bề ngang ấy (chữ xuống dòng khác đi).
// Mỗi lần khối đổi cao, ResizeObserver gọi tính lại ⇒ k₁ → bề ngang hẹp hơn → thêm một dòng → cao hơn → k₂ nhỏ hơn → bề ngang rộng hơn → bớt một dòng
// → lại k₁ … KHÔNG có điểm dừng khi số dòng nhảy bậc: khối đề đổi cỡ MỖI KHUNG HÌNH, mãi mãi (đo Chromium 1971 × 1247, câu Đúng / Sai, em chưa gửi bị
// gọi lên bảng: 123 lần đổi style / giây, 26 / 33 cặp khung liền nhau khác nhau — docs/do-live-1011.md).
// SỬA: chọn k MỘT lần cho mỗi (câu, khổ ô giấy) bằng cách DÒ từ lớn xuống nhỏ — hàm thuần của nội dung, không có vòng phản hồi. Chỉ dò lại khi chiều
// cao khối đề đổi vì lý do KHÁC phép đặt của chính mình (ảnh tải xong, phông tải xong).

/** Số nấc dò giữa `kMax` và `kMin`. */
export const NAC_DO = 8
/** Dò hệ số phóng lớn nhất mà khối đề (cao `doCao(k)` px ở bề ngang ứng với k) còn vừa chiều cao `cao` của ô giấy (chừa 28 px lề). Không nấc nào vừa ⇒
 *  `kMin` (đề dài: cỡ nhỏ nhất + cuộn). Trả cả chiều cao khối ở k đã chọn để nơi gọi biết lần đổi cao nào là do mình. */
export function chonHeSoGiay(doCao: (k: number) => number, cao: number, kMin: number, kMax: number): { k: number; h: number } {
  let k = kMin, h = 1
  for (let i = 0; i <= NAC_DO; i++) {
    k = kMax - ((kMax - kMin) * i) / NAC_DO
    h = doCao(k) || 1
    if (h * k <= cao - 28) break
  }
  return { k, h }
}
