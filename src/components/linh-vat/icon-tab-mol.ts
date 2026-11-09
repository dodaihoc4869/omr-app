// BIỂU TƯỢNG TAB THEO CẢM XÚC MOL (thầy 09/11 «biểu tượng này thay đổi theo cảm xúc của mol trong màn chính nhé»): khi em ở Lộ trình, biểu tượng tab trình duyệt
// = MẶT MOL ĐANG HIỆN. Rời Lộ trình ⇒ về logo. Biểu tượng CÀI MÁY ở màn hình chính điện thoại do hệ điều hành giữ cố định từ lúc cài.
// TỐC ĐỘ (tác tử toc-do 09/11 + đo scripts/toc-do-sau-gop.mjs CPU ×6): chụp mặt Mol (dựng ảnh SVG + vẽ canvas) lúc mở app làm chậm «tới chạm được»; hoãn 3 s thì
// rơi đúng lúc em bấm vào chặng («vào chặng» 611 → 752 ms). Nên: CHỈ chụp đúng lúc biểu tượng tab LÀ thứ em nhìn — em rời tab (trang ẩn) hoặc chuyển sang cửa sổ
// khác (cửa sổ mất tiêu điểm), và khi Lửa vẽ lại cấp trong lúc ấy. Đang học trên trang ⇒ 0 công việc. Chỉ nơi có THANH TAB THẬT: trình duyệt máy tính (con trỏ
// chuột, không phải app đã cài / đứng riêng), không ở chế độ máy yếu. Điện thoại / app cài ⇒ không làm gì.
import { datIconTabMol } from './mol-dong'
import { dangCheDoMayYeu } from '../../lib/may-yeu'

/** Có thanh tab trình duyệt để thấy biểu tượng (máy tính, không phải app đứng riêng) và không phải máy yếu. */
export function coThanhTab(w: Window = window): boolean {
  try {
    if (typeof w.matchMedia !== 'function' || dangCheDoMayYeu()) return false
    return w.matchMedia('(pointer: fine)').matches && !w.matchMedia('(display-mode: standalone)').matches && !w.matchMedia('(display-mode: window-controls-overlay)').matches
  } catch { return false }
}

export function theoDoiIconTabMol(anh: Parameters<typeof datIconTabMol>[1]): () => void {
  if (!coThanhTab()) return () => {}
  let het = false, daChup = false, cuoi = 0
  const roi = (): boolean => document.visibilityState === 'hidden' || !document.hasFocus()
  const chup = (): void => {
    const t = Date.now()
    if (het || !roi() || t - cuoi < 250) return
    cuoi = t
    daChup = true
    void datIconTabMol(-1, anh)
  }
  const khiDoiTrang = (): void => { if (document.visibilityState === 'hidden') chup() }
  document.addEventListener('visibilitychange', khiDoiTrang)
  window.addEventListener('blur', chup)
  window.addEventListener('ddh-lua-cap', chup) // SU_KIEN_LUA_CAP (Bi.tsx): Lửa đổi cấp khi em đang ở tab khác
  return () => {
    het = true
    document.removeEventListener('visibilitychange', khiDoiTrang)
    window.removeEventListener('blur', chup)
    window.removeEventListener('ddh-lua-cap', chup)
    if (daChup) void datIconTabMol(0, anh)
  }
}
