// BIỂU TƯỢNG TAB THEO CẢM XÚC MOL (thầy 09/11 «biểu tượng này thay đổi theo cảm xúc của mol trong màn chính nhé»): khi em ở Lộ trình, biểu tượng tab trình duyệt
// = MẶT MOL ĐANG HIỆN, đổi khi Mol đổi mặt (data-mat / data-cap-ve trên svg.mol-svg, hoặc Lửa vẽ lại cấp) — mọi cảm xúc. Rời Lộ trình ⇒ về logo.
// Biểu tượng CÀI MÁY ở màn hình chính điện thoại do hệ điều hành giữ cố định từ lúc cài.
// TỐC ĐỘ (tác tử toc-do 09/11: «tới chạm được» CPU ×6 nghi chậm lại vì chụp mặt Mol lúc mở app): CHỈ chạy nơi có THANH TAB THẬT — trình duyệt máy tính
// (con trỏ chuột, không phải app đã cài / chế độ đứng riêng), không bật chế độ máy yếu; và chỉ bắt đầu SAU khi app đã mở xong (chờ 3 s rồi lúc rảnh).
// Điện thoại / app đã cài (không có tab để thấy) ⇒ không làm gì, 0 công việc lúc mở. Nhịp chụp ≥ 250 ms, một khung hình.
import { datIconTabMol } from './mol-dong'
import { dangCheDoMayYeu } from '../../lib/may-yeu'

/** Có thanh tab trình duyệt để thấy biểu tượng (máy tính, không phải app đứng riêng) và không phải máy yếu. */
export function coThanhTab(w: Window = window): boolean {
  try {
    if (typeof w.matchMedia !== 'function' || dangCheDoMayYeu()) return false
    return w.matchMedia('(pointer: fine)').matches && !w.matchMedia('(display-mode: standalone)').matches && !w.matchMedia('(display-mode: window-controls-overlay)').matches
  } catch { return false }
}

export function theoDoiIconTabMol(anh: Parameters<typeof datIconTabMol>[1], tre = 3000): () => void {
  if (!coThanhTab()) return () => {}
  let h = 0, cuoi = 0, het = false, bat = false, ob: MutationObserver | null = null
  const chup = (): void => {
    if (het) return
    cancelAnimationFrame(h)
    h = requestAnimationFrame(() => {
      const t = Date.now()
      if (t - cuoi < 250) { window.setTimeout(chup, 260 - (t - cuoi)); return }
      cuoi = t
      void datIconTabMol(-1, anh)
    })
  }
  const batDau = (): void => {
    if (het) return
    bat = true
    ob = new MutationObserver(chup)
    ob.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-mat', 'data-cap-ve'] })
    window.addEventListener('ddh-lua-cap', chup) // SU_KIEN_LUA_CAP (Bi.tsx)
    chup()
  }
  const ri = (window as { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }).requestIdleCallback
  const hen = window.setTimeout(() => { if (ri) ri(batDau, { timeout: 2000 }); else batDau() }, tre)
  return () => {
    het = true
    window.clearTimeout(hen)
    cancelAnimationFrame(h)
    if (!bat) return
    ob?.disconnect()
    window.removeEventListener('ddh-lua-cap', chup)
    void datIconTabMol(0, anh)
  }
}
