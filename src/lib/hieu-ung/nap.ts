// BỘ NẠP hiệu ứng ăn mừng — phần NHỎ nằm cùng mảnh `hieu-ung` (đã có sẵn ở các màn «Trong»). Mã vẽ (hạt, SVG, Web Audio) ở mảnh NẠP LƯỜI riêng
// `hieu-ung-an-mung-*.js`: không cộng một byte nào vào lượt mở app (scripts/kiem-toc-do-tai.mjs), nằm ở kho chạy-lúc của service worker (globIgnores
// `hieu-ung-*`, precache giữ ≤ 170) và được NẠP TRƯỚC khi app rảnh (Lộ trình hiện xong ⇒ requestIdleCallback) hoặc ngay khi vào màn làm câu ⇒ lúc cần là
// chạy tức thì, kể cả máy yếu. Chưa nạp xong mà đã cần ⇒ nạp rồi chạy nếu kịp (≤ 0,7 s), quá thì bỏ (hiệu ứng trễ còn tệ hơn không có).
import type { DatAnMung, LoaiAnMung } from './kieu'
import { cheDoAnMung, type CheDoAnMung } from './dieu-kien'

type Mod = typeof import('./hieu-ung-an-mung')
let mod: Mod | null = null
let hua: Promise<Mod | null> | null = null

/** Nạp mảnh hiệu ứng (một lần; lỗi mạng ⇒ lần sau thử lại). */
export function napAnMung(): Promise<Mod | null> {
  if (mod) return Promise.resolve(mod)
  if (!hua) hua = import('./hieu-ung-an-mung').then((m) => {
    mod = m
    // hâm nóng lúc máy rảnh (dịch sẵn mã, cất sẵn phần tử) ⇒ lần ăn mừng đầu tiên cũng mượt
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
    const lam = () => { try { m.hamNong() } catch { /* bỏ qua */ } }
    if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(lam, { timeout: 3000 }); else window.setTimeout(lam, 300)
    return m
  }, () => { hua = null; return null })
  return hua
}

/** Nạp trước: `ngay` (đã vào màn làm câu) ⇒ nạp luôn; không thì đợi lúc trình duyệt rảnh (Lộ trình vừa hiện). */
export function napTruocAnMung(ngay = false): void {
  if (mod || hua || typeof window === 'undefined') return
  if (ngay) { void napAnMung(); return }
  const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
  if (typeof w.requestIdleCallback === 'function') w.requestIdleCallback(() => void napAnMung(), { timeout: 4000 })
  else window.setTimeout(() => void napAnMung(), 1500)
}

export const anMungSanSang = (): boolean => !!mod

/** Đã thấy khung chậm khi bản đầy đủ chạy (bo-chay.ts canh khung) ⇒ từ giờ tới khi tải lại app, máy này chạy bản GỌN. */
let haGon = false
export function haXuongGon(): void { haGon = true }
export const daHaXuongGon = (): boolean => haGon
/** Bỏ dấu đã hạ (kiểm thử dùng; app thật chỉ bỏ khi tải lại). */
export function boHaGon(): void { haGon = false }

/** Chế độ của máy này: xin giảm chuyển động ⇒ tĩnh; lớp `may-yeu` (máy yếu, kể cả đo khung thật ⇒ `ddh.mayYeu`) ⇒ gọn. Không có matchMedia /
 *  Element.animate (máy kiểm thử, trình duyệt quá cũ) ⇒ tĩnh. */
export function cheDoMayNay(): CheDoAnMung {
  if (typeof window === 'undefined' || typeof document === 'undefined') return 'tinh'
  if (typeof window.matchMedia !== 'function' || typeof Element.prototype.animate !== 'function') return 'tinh'
  let giam = false
  try { giam = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { /* coi như không */ }
  return cheDoAnMung({ mayYeu: haGon || document.documentElement.classList.contains('may-yeu'), giamChuyenDong: giam })
}

const CHO_TOI_DA = 700

/** Chạy một hiệu ứng ăn mừng; trả hàm huỷ. Không bao giờ ném lỗi. `nguyen-tu`: không chạy được ⇒ vẫn gọi `onXong` (nơi gọi cộng số đúng hẹn). */
export function anMung<K extends LoaiAnMung>(loai: K, dat: DatAnMung[K]): () => void {
  const boQua = () => { if (loai === 'nguyen-tu') (dat as DatAnMung['nguyen-tu']).onXong?.() }
  if (typeof window === 'undefined' || typeof document === 'undefined' || document.hidden) { boQua(); return () => {} }
  if (mod) return mod.chay(loai, dat)
  let huy: (() => void) | null = null, dung = false
  const t0 = Date.now()
  void napAnMung().then((m) => {
    if (dung) return
    if (m && Date.now() - t0 <= CHO_TOI_DA) huy = m.chay(loai, dat)
    else boQua()
  })
  return () => { dung = true; huy?.() }
}
