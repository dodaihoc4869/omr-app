import { useEffect } from 'react'

/** Thuộc tính trên <html> mà index.css dựa vào để khoá trang phía sau (`html[data-khoa-cuon] body { overflow: hidden }`). */
export const THUOC_TINH_KHOA_CUON = 'data-khoa-cuon'

/**
 * KHOÁ TRANG PHÍA SAU khi cổng học sinh mở một màn con toàn màn (sửa lỗi "không vuốt lên được" 12/10).
 *
 * Màn con (làm câu, Tự chữa, Câu đã làm, sheet cũ, phòng thi…) là lớp `fixed inset-0 overflow-y-auto` phủ lên trang Hôm nay vẫn cuộn được.
 * Cú vuốt trên lớp phủ CHƯA tràn (câu ngắn) hoặc đã cuộn hết trôi xuống cuộn trang ẩn phía sau — em thấy màn đứng im (đo 390×844: câu trắc
 * nghiệm vừa màn, vuốt 0 px trên màn, 511 px ở trang ẩn). `bat` ⇒ gắn thuộc tính lên <html>; tắt / gỡ màn ⇒ bỏ thuộc tính, trang cuộn lại đúng
 * chỗ cũ. Dùng thuộc tính RIÊNG, không lưu/khôi phục `body.style.overflow` ⇒ không giẫm khoá của các lớp phủ khác (PhongVaoThi, KhungChua,
 * KhungXemPhieu) dù chúng đóng/mở theo thứ tự nào.
 */
export function useKhoaCuonTrang(bat: boolean): void {
  useEffect(() => {
    if (!bat) return
    const goc = document.documentElement
    goc.setAttribute(THUOC_TINH_KHOA_CUON, '')
    return () => goc.removeAttribute(THUOC_TINH_KHOA_CUON)
  }, [bat])
}
