// PHIÊN ĐĂNG NHẬP CỦA CỔNG HỌC SINH — phần NHẸ dùng được trước khi mảnh cổng (StudentPortalScreen) về (05/10, tối ưu mở app học sinh):
// vỏ `AppHocSinh` cần biết máy đã đăng nhập chưa để chọn màn đầu (Đăng nhập hay cổng), và cất phiên khi em đăng nhập ở màn nhẹ.
// KHOÁ trùng `KHOA_LUU_AUTH` của StudentPortalScreen.tsx (cổng đọc lại đúng phiên này khi dựng) và khoá đoạn mã nội tuyến của index.html
// (vite.config.ts) đọc để biết có hỏi Sảnh sớm không — khoá đặt ở nap-truoc-man-em.ts (tệp vite.config.ts nạp), xuất lại ở đây.
import { KHOA_PHIEN_HS } from './nap-truoc-man-em'
export { KHOA_PHIEN_HS }

export interface ThongTinHs {
  sbd: string
  hoTen: string
  lop: string
  namSinh: string
  token?: string
}

/** Phiên đã cất — đọc ĐÚNG như StudentPortalScreen đọc lúc dựng (vỏ và cổng cùng một kết luận). Máy chặn lưu / hỏng ⇒ null. */
export function docPhienHs(): ThongTinHs | null {
  try {
    const luu = localStorage.getItem(KHOA_PHIEN_HS)
    return luu ? (JSON.parse(luu) as ThongTinHs | null) : null
  } catch {
    return null
  }
}

/** Cất phiên vừa đăng nhập — đúng dạng StudentPortalScreen vẫn cất (JSON của ThongTinHs). Máy chặn lưu ⇒ NÉM lỗi (như cũ: form báo lỗi). */
export function ghiPhienHs(t: ThongTinHs): void {
  localStorage.setItem(KHOA_PHIEN_HS, JSON.stringify(t))
}
