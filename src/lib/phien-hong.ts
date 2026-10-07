// PHIÊN ĐĂNG NHẬP CỦA EM KHÔNG CÒN DÙNG ĐƯỢC ⇒ TỰ ĐƯA VỀ MÀN ĐĂNG NHẬP (07/10).
// SỰ CỐ: 16:05 hôm ấy mã bí mật của máy chủ đổi. Token phiên game của em (HMAC ký bằng chính mã ấy, cất 30 ngày trong máy) bị máy chủ từ chối:
// "Phiên game không hợp lệ." Sảnh chỉ hiện dòng đó kèm nút "Thử lại" — nút gửi lại ĐÚNG token hỏng nên mãi mãi lỗi; em không biết phải đăng xuất rồi đăng nhập lại.
// Game (Đảo) đã tự dọn token khi gặp lời này (Game.tsx `call`); Sảnh thì chưa. Nay: Sảnh gặp lời máy chủ nói token hỏng / hết hạn / mật khẩu đã đổi
// ⇒ đăng xuất và hiện một dòng nói thật vì sao ở màn đăng nhập. Chỉ đăng nhập lại mới sửa được — không có đường nào khác.
import { useEffect, useRef } from 'react'

export const KHOA_GHI_CHU_PHIEN_HONG = 'omr_phien_hong_ghi_chu'

export const CHU_PHIEN_HONG = 'Phiên đăng nhập cũ không còn dùng được. Em đăng nhập lại bằng số báo danh và mật khẩu nhé.'

/** Lời máy chủ nói token em đang giữ không dùng được nữa: chữ ký sai, hết hạn 30 ngày, mật khẩu đã đổi, hoặc máy chưa có phiên. Lỗi mạng / chậm KHÔNG tính. */
export function laLoiPhienHong(loi: unknown): boolean {
  if (typeof loi !== 'string') return false
  return /Phiên game không hợp lệ|Phiên game đã hết hạn|Mật khẩu đã đổi|Em nhập lại mật khẩu để mở hồ sơ game|Em đăng nhập lại/i.test(loi)
}

/** Ghi một dòng cho màn đăng nhập hiện MỘT lần (sessionStorage; máy chặn lưu thì bỏ qua — vẫn đăng xuất được, chỉ thiếu dòng giải thích). */
export function ghiChuPhienHong(): void {
  try {
    sessionStorage.setItem(KHOA_GHI_CHU_PHIEN_HONG, '1')
  } catch {
    /* máy chặn lưu: bỏ qua */
  }
}

/** Màn đăng nhập gọi lúc dựng: có ghi chú ⇒ trả câu giải thích và XOÁ (chỉ hiện một lần); không ⇒ chuỗi rỗng. */
export function layGhiChuPhienHong(): string {
  try {
    if (sessionStorage.getItem(KHOA_GHI_CHU_PHIEN_HONG)) {
      sessionStorage.removeItem(KHOA_GHI_CHU_PHIEN_HONG)
      return CHU_PHIEN_HONG
    }
  } catch {
    /* máy chặn lưu: bỏ qua */
  }
  return ''
}

/**
 * Cổng học sinh dùng: đang có phiên (`coPhien`) mà lỗi của Sảnh là "phiên hỏng" ⇒ ghi chú + `dangXuat` (đúng hàm đăng xuất của cổng).
 * Mỗi lần lỗi đổi mới chạy lại; sau đăng xuất `coPhien` về false nên không lặp.
 */
export function useTuDangXuatKhiPhienHong(coPhien: boolean, loi: unknown, dangXuat: () => void | Promise<void>): void {
  const dx = useRef(dangXuat)
  dx.current = dangXuat
  useEffect(() => {
    if (!coPhien || !laLoiPhienHong(loi)) return
    ghiChuPhienHong()
    void dx.current()
  }, [coPhien, loi])
}
