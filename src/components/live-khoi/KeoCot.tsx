// TAY KÉO ĐỔI CỠ dải «Chỉ thầy thấy» + cột «Tin nhắn lớp» trên máy thầy (thầy 13/11: «cho tôi điều chỉnh kích thước được của thẻ đen chỉ thầy thấy ở dưới»).
// Hai tay kéo, một phép tính (cot-chat-hinh.ts): mép TRÊN của dải (kéo lên / xuống) và mép TRÁI của cột (kéo trái / phải). Phần chiếu thu đều nên hai cỡ đi
// cùng nhau; tỉ lệ bảng không đổi ⇒ máy em không bị ảnh hưởng. Bấm hai lần ⇒ về cỡ mặc định. Kiểu: thay-khoi.css (`.lkt-keo`).
import { useRef, type PointerEvent } from 'react'
import { cotTheoDai } from './cot-chat-hinh'

type Loai = 'ngang' | 'doc'
/** `dat(c, xong)`: c = bề ngang cột thầy muốn (px; null = mặc định) · xong = thầy đã nhả tay (lúc đó mới ghi nhớ). */
export default function KeoCot({ xTo, dat }: { xTo: number; dat: (c: number | null, xong: boolean) => void }) {
  const dang = useRef<Loai | null>(null), cuoi = useRef<number | null>(null)
  const xuong = (loai: Loai) => (e: PointerEvent<HTMLDivElement>): void => { dang.current = loai; cuoi.current = null; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* máy không giữ được con trỏ */ } e.preventDefault() }
  const di = (e: PointerEvent<HTMLDivElement>): void => {
    const l = dang.current
    if (!l) return
    const w = window.innerWidth, h = window.innerHeight, c = l === 'doc' ? Math.round(w - e.clientX) : cotTheoDai(w, h, xTo, h - e.clientY)
    cuoi.current = c; dat(c, false)
  }
  const nha = (): void => { if (!dang.current) return; dang.current = null; if (cuoi.current != null) dat(cuoi.current, true) }
  const tay = (loai: Loai, nhan: string) => (
    <div className={`lkt-keo ${loai}`} role="separator" aria-orientation={loai === 'ngang' ? 'horizontal' : 'vertical'} aria-label={nhan} title={`${nhan}. Bấm hai lần để về cỡ mặc định.`}
      onPointerDown={xuong(loai)} onPointerMove={di} onPointerUp={nha} onPointerCancel={nha} onDoubleClick={() => dat(null, true)}><i aria-hidden="true" /></div>
  )
  return <>{tay('ngang', 'Kéo để đổi cỡ dải chỉ thầy thấy')}{tay('doc', 'Kéo để đổi cỡ cột tin nhắn')}</>
}
