// LIVE THEO KHỐI — TẢI SẴN (thầy 12/11: «mở phòng live chưa tức thì, chờ lâu quá, tải được gì sẵn tải luôn để tức thì mọi chỗ cho học sinh»).
// Mọi mảnh của live nằm ngoài precache (chỉ dùng khi có mạng) ⇒ lần đầu bấm phải tải nối tiếp 5–7 mảnh. Tệp này tải TRƯỚC, lúc máy rảnh, ngay khi biết sắp
// cần: máy em khi thẻ Live có buổi (hẹn / phòng chờ / đang live); máy thầy khi mở bảng «Live». Mỗi phía một lần; lỗi mạng ⇒ lần bấm thật tự tải lại.
const ranh = (f: () => void): void => {
  const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(f, { timeout: 1500 }); else setTimeout(f, 200)
}
const im = (p: Promise<unknown>): void => { void p.catch(() => {}) }
let daEm = false, daThay = false
/** Máy em: màn phòng (Bình Phản Ứng), lớp nổi, trò Giữ Lửa, chat, màn bốn đội, bảng live, màn vinh danh. */
export function taiSanEm(): void {
  if (daEm) return
  daEm = true
  ranh(() => {
    im(import('../bpu/gan-hs')); im(import('./LopNoiEm')); im(import('./TroGiuLua')); im(import('./ChatEm')); im(import('./ManBonDoi'))
    ranh(() => { im(import('../live/LopLive')); im(import('./ManVinhDanh')) })
  })
}
/** Máy thầy: bảng của buổi, lớp nổi phòng chờ, sân xem trận, cột tin nhắn, màn vinh danh. */
export function taiSanThay(): void {
  if (daThay) return
  daThay = true
  ranh(() => {
    im(import('../bpu/gan-gv')); im(import('./thay-khoi')); im(import('./LopNoiThay')); im(import('./TroGiuLua'))
    ranh(() => { im(import('./ChatThay')); im(import('./ManVinhDanh')); im(import('../bpu/ChonCauBpu')) })
  })
}
