// BỀ RỘNG THANH TRÁI, THẦY TỰ KÉO CHỈNH.
//
// Không phải ai cũng muốn một bề rộng. Màn 13 inch thì 232px đã chiếm gần một
// phần tư; màn 27 inch thì kéo rộng ra cho tên mục khỏi cụt. Nên bề rộng là
// thứ thầy chỉnh, app chỉ nhớ hộ.
//
// Nhớ trong localStorage chứ không trong IndexedDB: đây là thiết lập giao diện
// của RIÊNG máy này, không phải dữ liệu học sinh, và phải đọc được ĐỒNG BỘ
// ngay lúc dựng trang — chậm một nhịp là thanh trái nhảy bề rộng trước mắt.

const KHOA = 'rongBenTrai'
export const RONG_MAC_DINH = 232
/** Hẹp hơn nữa thì tên mục cụt mất chữ, rộng hơn nữa thì lấn hết vùng nội dung. */
export const RONG_MIN = 176
export const RONG_MAX = 420

export function chan(px: number): number {
  if (!Number.isFinite(px)) return RONG_MAC_DINH
  return Math.min(RONG_MAX, Math.max(RONG_MIN, Math.round(px)))
}

export function docRong(): number {
  try {
    const v = localStorage.getItem(KHOA)
    return v ? chan(Number(v)) : RONG_MAC_DINH
  } catch {
    // Trình duyệt chặn lưu trữ — vẫn chạy, chỉ là không nhớ được.
    return RONG_MAC_DINH
  }
}

export function luuRong(px: number): void {
  try {
    localStorage.setItem(KHOA, String(chan(px)))
  } catch {
    /* chặn lưu trữ thì thôi, không làm hỏng thao tác kéo */
  }
}

/** Đặt bề rộng cho CSS đọc. Dùng biến CSS chứ không style thẳng vào thẻ: lưới
 * `.khung-app` và tay kéo cùng đọc một nguồn, không lệch nhau. */
export function datRong(px: number, goc: HTMLElement | null = typeof document === 'undefined' ? null : document.documentElement): void {
  goc?.style.setProperty('--rong-ben-trai', `${chan(px)}px`)
}
