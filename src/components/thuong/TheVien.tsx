// THẺ BẬT khi chạm một viên đếm (thầy chốt P2 27/10): nhãn ĐẦY ĐỦ (số không rút gọn) + một nút mở màn tương ứng. Cùng khuôn `.da-pop` của Lộ trình.
// Viên nổi mép trái ⇒ thẻ bật sang PHẢI viên, mũi nhọn chỉ tâm viên (`data-ben`, --oy). Viên nằm trong thanh menu trái (máy tính) ⇒ thẻ bật XUỐNG dưới viên (--ox).
// Vẽ vào <body> (position: fixed) ⇒ không khung nào cắt. Chạm ra ngoài / cuộn / đổi khổ / Esc ⇒ đóng; Esc trả focus về viên.
import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

export interface NoiDungTheVien { sac: string; tieu: string; phu: string; nut: string; onNut: () => void }

export function TheVien({ id, el, nd, onDong }: { id: string; el: HTMLElement; nd: NoiDungTheVien; onDong: (traFocus: boolean) => void }) {
  const the = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const t = the.current
    if (!t) return
    const r = el.getBoundingClientRect(), vw = document.documentElement.clientWidth || window.innerWidth, vh = window.innerHeight
    if (el.closest('#tr-menu')) {
      // trong thanh menu trái: thẻ dưới viên
      const w = Math.min(280, vw - 32), cx = r.left + r.width / 2, left = Math.max(16, Math.min(vw - 16 - w, cx - w / 2))
      t.style.width = `${w}px`; t.style.left = `${left}px`; t.style.top = `${r.bottom + 12}px`
      t.style.setProperty('--ox', `${Math.max(24, Math.min(w - 24, cx - left))}px`)
    } else {
      t.setAttribute('data-ben', '')
      const left = r.right + 12, w = Math.min(280, vw - left - 12)
      t.style.width = `${w}px`; t.style.left = `${left}px`
      const h = t.offsetHeight, cy = r.top + r.height / 2
      const top = Math.max(8, Math.min(vh - 8 - h, cy - 36))
      t.style.top = `${top}px`
      t.style.setProperty('--oy', `${Math.max(20, Math.min(h - 20, cy - top))}px`)
    }
    t.querySelector<HTMLElement>('.da-pop-nut')?.focus({ preventScroll: true })
  }, [el])
  useEffect(() => {
    const ngoai = (e: Event) => { const x = e.target as Node; if (!the.current?.contains(x) && !el.contains(x)) onDong(false) }
    const dong = () => onDong(false)
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onDong(true) } }
    document.addEventListener('pointerdown', ngoai, true)
    window.addEventListener('scroll', dong, { passive: true })
    window.addEventListener('resize', dong)
    document.addEventListener('keydown', phim)
    return () => { document.removeEventListener('pointerdown', ngoai, true); window.removeEventListener('scroll', dong); window.removeEventListener('resize', dong); document.removeEventListener('keydown', phim) }
  }, [el, onDong])
  return createPortal(<div ref={the} id={id} className="da-pop tp-vien-the" data-sac={nd.sac} role="dialog" aria-label={nd.tieu} tabIndex={-1}>
    <b className="da-pop-tieu">{nd.tieu}</b><span className="da-pop-phu">{nd.phu}</span>
    <button type="button" className="da-pop-nut" onClick={() => { onDong(false); nd.onNut() }}>{nd.nut}</button>
  </div>, document.body)
}

export default TheVien
