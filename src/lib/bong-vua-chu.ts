// BONG BÓNG VỪA CHỮ — Mol góc thẻ đầu (thầy 03/11 «khung bong bóng vừa với chữ»): chữ xuống 2 dòng thì hộp vẫn rộng hết hàng ⇒ đo DÒNG DÀI NHẤT (cả phần
// chữ chưa gõ — visibility: hidden vẫn chiếm chỗ) rồi đặt bề rộng ôm sát. Đo sau bố cục (ResizeObserver của hàng Mol), lại khi hàng đổi bề rộng và khi phông
// web nạp xong (phông có thể CHƯA bắt đầu tải lúc gắn ⇒ fonts.ready xong ngay, đo bằng phông thay thế ⇒ phông thật về làm chữ tràn xuống dòng 3).
import { useLayoutEffect, useRef } from 'react'
import { rongOmChu } from './bong-bong-mol'

export function useBongVuaChu(bat: boolean, chuKhoa: string) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const bb = ref.current, hang = bb?.parentElement, chu = bb?.querySelector('[aria-hidden="true"]')
    if (!bat || !bb || !hang || !chu || typeof document.createRange !== 'function') return
    let rongHang = -1, con = true
    const doLai = (ep?: boolean) => {
      const r = hang.getBoundingClientRect().width
      if (!ep && r === rongHang) return
      rongHang = r
      bb.style.width = ''
      const rg = document.createRange(); rg.selectNodeContents(chu)
      if (typeof rg.getClientRects !== 'function') return
      const cs = getComputedStyle(bb), so = (x: string) => parseFloat(x) || 0
      const w = rongOmChu(Array.from(rg.getClientRects()), so(cs.paddingLeft) + so(cs.paddingRight) + so(cs.borderLeftWidth) + so(cs.borderRightWidth))
      if (w && w + 1 < bb.getBoundingClientRect().width) bb.style.width = `${w + 1}px`
    }
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => doLai()) : null
    if (ro) ro.observe(hang); else doLai()
    const doPhong = () => { if (con) doLai(true) }
    void document.fonts?.ready.then(doPhong)
    document.fonts?.addEventListener?.('loadingdone', doPhong)
    return () => { con = false; ro?.disconnect(); document.fonts?.removeEventListener?.('loadingdone', doPhong) }
  }, [bat, chuKhoa])
  return ref
}
