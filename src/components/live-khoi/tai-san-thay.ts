// LIVE THEO KHỐI — TẢI SẴN (thầy 12/11: «mở phòng live chưa tức thì, chờ lâu quá, tải được gì sẵn tải luôn để tức thì mọi chỗ cho học sinh»).
// Mọi mảnh của live nằm ngoài precache (chỉ dùng khi có mạng) ⇒ lần đầu bấm phải tải nối tiếp 5–7 mảnh. Tệp này tải TRƯỚC, lúc máy rảnh, ngay khi biết sắp
// cần: bản máy thầy: khi mở bảng «Live» (bản máy em ở tai-san-em.ts — tách tệp để hai app không sinh mảnh dùng chung). Mỗi phía một lần; lỗi mạng ⇒ lần bấm thật tự tải lại.
const ranh = (f: () => void): void => {
  const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
  if (w.requestIdleCallback) w.requestIdleCallback(f, { timeout: 1500 }); else setTimeout(f, 200)
}
const im = (p: Promise<unknown>): void => { void p.catch(() => {}) }
let daThay = false
/** Máy thầy: bảng của buổi, lớp nổi phòng chờ, sân xem trận, cột tin nhắn, màn vinh danh. */
export function taiSanThay(): void {
  if (daThay) return
  daThay = true
  ranh(() => {
    im(import('../bpu/gan-gv')); im(import('./thay-khoi')); im(import('./LopNoiThay')); im(import('./TroSinhTon'))
    ranh(() => { im(import('./ChatThay')); im(import('../bpu/ChonCauBpu')) })
  })
}
