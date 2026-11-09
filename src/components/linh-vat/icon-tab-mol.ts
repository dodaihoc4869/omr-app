// BIỂU TƯỢNG TAB THEO CẢM XÚC MOL (thầy 09/11 «biểu tượng này thay đổi theo cảm xúc của mol trong màn chính nhé»): khi em ở Lộ trình, biểu tượng tab trình duyệt
// (và biểu tượng cửa sổ app trên máy tính) = MẶT MOL ĐANG HIỆN, đổi ngay khi Mol đổi mặt (data-mat / data-cap-ve trên svg.mol-svg, hoặc Lửa vẽ lại cấp) —
// mọi cảm xúc, không chỉ cấp 4–5 như trước. Rời Lộ trình ⇒ về logo. Biểu tượng CÀI MÁY ở màn hình chính điện thoại do hệ điều hành giữ cố định từ lúc cài.
// Mảnh nạp sau (cùng mol-dong) ⇒ đường mở app không thêm byte. Nhịp chụp ≥ 250 ms, một khung hình (không chụp dồn khi Mol chớp / đổi mặt liên tục).
import { datIconTabMol } from './mol-dong'

export function theoDoiIconTabMol(anh: Parameters<typeof datIconTabMol>[1]): () => void {
  let h = 0, cuoi = 0, het = false
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
  const ob = new MutationObserver(chup)
  ob.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-mat', 'data-cap-ve'] })
  window.addEventListener('ddh-lua-cap', chup) // SU_KIEN_LUA_CAP (Bi.tsx)
  chup()
  return () => { het = true; cancelAnimationFrame(h); ob.disconnect(); window.removeEventListener('ddh-lua-cap', chup); void datIconTabMol(0, anh) }
}
