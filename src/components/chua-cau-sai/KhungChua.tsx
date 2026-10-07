import { useEffect, useRef, type ReactNode, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import './chua-cau-sai.css'
// Dialog native giữ tiêu điểm trong khung và làm nền bất hoạt khi em đang chữa.
export default function KhungChua({
  children,
  onDong,
}: {
  children: ReactNode
  onDong: () => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const giuTieuDiem = (e: KeyboardEvent<HTMLDialogElement>) => {
    if (e.key !== 'Tab') return
    const ds = [
      ...e.currentTarget.querySelectorAll<HTMLElement>(
        'button,input,select,textarea,a[href],summary,[tabindex]',
      ),
    ].filter(
      (x) =>
        !x.matches(':disabled') &&
        x.tabIndex >= 0 &&
        x.getClientRects().length > 0,
    )
    if (!ds.length) {
      e.preventDefault()
      ref.current?.focus()
      return
    }
    const dau = ds[0],
      cuoi = ds[ds.length - 1],
      hien = document.activeElement
    if (e.shiftKey && (hien === dau || !ds.includes(hien as HTMLElement))) {
      e.preventDefault()
      cuoi.focus()
    } else if (
      !e.shiftKey &&
      (hien === cuoi || !ds.includes(hien as HTMLElement))
    ) {
      e.preventDefault()
      dau.focus()
    }
  }
  useEffect(() => {
    const d = ref.current,
      truoc = document.activeElement as HTMLElement | null,
      cu = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    if (d?.showModal) d.showModal()
    else d?.setAttribute('open', '')
    return () => {
      d?.close?.()
      document.body.style.overflow = cu
      truoc?.focus()
    }
  }, [])
  return createPortal(
    <dialog
      ref={ref}
      className="ccs-hop"
      aria-label="Cùng chữa câu sai"
      tabIndex={-1}
      onKeyDown={giuTieuDiem}
      onCancel={(e) => {
        e.preventDefault()
        onDong()
      }}
    >
      {children}
    </dialog>,
    document.body,
  )
}
