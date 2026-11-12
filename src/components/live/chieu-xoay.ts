// ÉP NGANG LÚC LIVE — AI BỊ XOAY HÌNH và XOAY VỀ PHÍA NÀO (thầy 12/11: «chỉ giữ xoay ngang, đang làm máy hs lại xoay ngang lộn lại», «vẫn bị ép xoay ngang sửa triệt để đi»).
// Hai luật, dùng chung cho màn câu hỏi (luat-man-live.tsx), lớp nổi live theo khối (LopNoiEm.tsx) và bảng live (LopLive.tsx):
//  1) CHỈ ĐIỆN THOẠI mới xoay hình bằng CSS khi trang đang dọc. Máy tính / máy tính bảng (chuột, hoặc cạnh ngắn màn ≥ 600 px) KHÔNG bao giờ bị xoay —
//     cửa sổ trình duyệt kéo hẹp lại trên máy tính trước đây bị xoay ngang cả màn.
//  2) Xoay về ĐÚNG phía em đang cầm. Máy tự xoay của điện thoại có hai chiều ngang; em đang cầm ngang chiều «phụ» mà nghiêng máy làm trang về dọc thì hình
//     xoay 90° cố định sẽ thành LỘN NGƯỢC so với tay cầm. Nay nhớ chiều ngang gần nhất máy báo (primary / secondary) và xoay về phía đó.
// Không trạng thái React: nơi dùng đã vẽ lại theo `resize` / `orientationchange`.
let nguoc = false
function doc(): void {
  try {
    const t = (screen as Screen & { orientation?: { type?: string } }).orientation?.type
    const g = (window as Window & { orientation?: number }).orientation
    if (t === 'landscape-secondary' || (t == null && g === -90)) nguoc = true
    else if (t === 'landscape-primary' || (t == null && g === 90)) nguoc = false
  } catch { /* trình duyệt không cho đọc */ }
}
if (typeof window !== 'undefined') {
  doc()
  try { window.addEventListener('orientationchange', doc); window.addEventListener('resize', doc) } catch { /* test */ }
}
/** Hình xoay bằng CSS phải xoay NGƯỢC (−90°): em đang cầm máy ngang chiều phụ. */
export function xoayNguoc(): boolean { doc(); return nguoc }
/** Máy này là ĐIỆN THOẠI (chạm, cạnh ngắn màn < 600 px) ⇒ được xoay hình khi trang dọc. Không hỏi được (trình duyệt cũ, môi trường test) ⇒ coi như điện thoại. */
export function laDienThoai(): boolean {
  try {
    if (typeof window.matchMedia !== 'function') return true
    const tho = window.matchMedia('(pointer: coarse)').matches
    const ngan = Math.min(screen.width || window.innerWidth, screen.height || window.innerHeight)
    return tho && ngan < 600
  } catch { return true }
}
/** Giá trị thuộc tính `data-xoay` khi hình đang xoay: '' = 90° (mặc định) · 'nguoc' = −90°. */
export const thuocTinhXoay = (): '' | 'nguoc' => (xoayNguoc() ? 'nguoc' : '')
/** Toạ độ con trỏ (clientX / clientY) ⇒ hệ của HÌNH đã xoay, với `r` = hộp bao của hình trên màn. */
export function toaDoXoay(e: { clientX: number; clientY: number }, r: { left: number; top: number; right: number; bottom: number }): { x: number; y: number } {
  return xoayNguoc() ? { x: r.bottom - e.clientY, y: e.clientX - r.left } : { x: e.clientY - r.top, y: r.right - e.clientX }
}
