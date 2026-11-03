// BONG BÓNG VỪA CHỮ — Mol góc thẻ đầu (thầy 03/11 «khung bong bóng vừa với chữ»): chữ xuống 2 dòng thì hộp vẫn rộng hết hàng ⇒ đo DÒNG DÀI NHẤT (cả phần
// chữ chưa gõ — visibility: hidden vẫn chiếm chỗ) rồi đặt bề rộng ôm sát. Đo sau bố cục (ResizeObserver của hàng Mol), lại khi hàng đổi bề rộng và khi phông
// web nạp xong (`loadingdone` — phông có thể CHƯA bắt đầu tải lúc gắn: đo bằng phông thay thế ⇒ phông thật về làm chữ tràn xuống dòng 3).
// Viền trái + phải = offsetWidth − clientWidth (bong bóng không có thanh cuộn).
import { useLayoutEffect, useRef } from 'react'
import { rongOmChu } from './bong-bong-mol'

export function useBongVuaChu(bat: boolean, chuKhoa: string) {
  const ref = useRef<HTMLParagraphElement>(null)
  useLayoutEffect(() => {
    const bb = ref.current, hang = bb?.parentElement, chu = bb?.lastElementChild, f = document.fonts
    if (!bat || !bb || !hang || !chu || typeof ResizeObserver !== 'function') return
    let rong = -1
    const doLai = (ep?: unknown) => {
      const r = hang.clientWidth
      if (ep !== 1 && r === rong) return
      rong = r
      bb.style.width = ''
      const rg = document.createRange(); rg.selectNodeContents(chu)
      const cs = getComputedStyle(bb), w = rongOmChu([...rg.getClientRects()], bb.offsetWidth - bb.clientWidth + parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight))
      if (w && w + 1 < bb.offsetWidth) bb.style.width = `${w + 1}px`
    }
    const ro = new ResizeObserver(() => doLai()), phong = () => doLai(1)
    ro.observe(hang)
    f?.addEventListener('loadingdone', phong)
    return () => { ro.disconnect(); f?.removeEventListener('loadingdone', phong) }
  }, [bat, chuKhoa])
  return ref
}
