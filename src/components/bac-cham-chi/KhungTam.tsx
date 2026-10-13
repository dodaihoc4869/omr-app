// KHUNG TẤM dùng chung của hai tấm bậc (13/10 đợt 19): tấm "12 bậc từ Lười đến Chăm" (học sinh / phụ huynh / hồ sơ) và tấm "Bậc N · K em" (Nhịp học
// của thầy). CHỈ nằm trong khối nạp khi bấm. Điện thoại dọc: tấm trượt từ dưới, cuộn được · xoay ngang / máy tính: hộp thoại giữa màn (tam-bac.css).
//   · role="dialog" + aria-modal + tiêu đề; mở ⇒ tiêu điểm vào nút Đóng; Tab / Shift+Tab vòng trong tấm; Esc / bấm nền / nút Đóng ⇒ đóng; đóng ⇒ tiêu
//     điểm về đúng nút đã mở (`traVe`); khoá cuộn nền khi mở.
//   · Phím bắt ở pha BẮT của window rồi chặn lan ⇒ tấm nằm TRÊN tấm Hồ sơ làm bài (vốn nghe phím ở document) không làm Hồ sơ đóng theo.
//   · `phu` = đang có tấm khác đè lên (Hồ sơ mở từ danh sách theo bậc) ⇒ tấm này nhường phím + `inert`, đóng tấm trên thì dùng tiếp.
//   · Vẽ qua cổng vào <body>; `lopBoc` = lớp bọc giữ bảng màu của nơi mở (vd `m3` — app phụ huynh) để màu bậc trong tấm khớp chip đã bấm.
import { useEffect, useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './tam-bac.css'

const CHON_FOCUS = 'button:not([disabled]),[href],input:not([disabled]),[tabindex]:not([tabindex="-1"])'

export default function KhungTam(p: {
  tieuDe: ReactNode
  phuDe?: ReactNode
  onDong: () => void
  traVe?: HTMLElement | null
  lopBoc?: string
  /** 'tren' (mặc định): trên mọi tấm của app (kể cả Hồ sơ) · 'duoi': dưới tấm Hồ sơ (danh sách em mở Hồ sơ chồng lên). */
  tang?: 'tren' | 'duoi'
  phu?: boolean
  kieu: string
  children: ReactNode
}) {
  const id = useId()
  const tam = useRef<HTMLElement>(null)
  const nutDong = useRef<HTMLButtonElement>(null)
  const dongRef = useRef(p.onDong)
  const phuRef = useRef(!!p.phu)
  useLayoutEffect(() => {
    dongRef.current = p.onDong
    phuRef.current = !!p.phu
  })
  const traVeDau = useRef(p.traVe ?? null)

  useEffect(() => {
    // nút đã mở tấm: nơi mở báo; không báo ⇒ phần tử đang có tiêu điểm lúc mở
    const traVe = traVeDau.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    nutDong.current?.focus({ preventScroll: true })
    const b = document.body
    const cu = b.style.overflow
    b.style.overflow = 'hidden'
    const phim = (ev: KeyboardEvent) => {
      if (phuRef.current) return
      if (ev.key === 'Escape') {
        ev.preventDefault()
        ev.stopPropagation()
        dongRef.current()
        return
      }
      if (ev.key !== 'Tab' || !tam.current) return
      ev.stopPropagation()
      const ds = [...tam.current.querySelectorAll<HTMLElement>(CHON_FOCUS)]
      if (!ds.length) return
      const dau = ds[0]!
      const cuoi = ds[ds.length - 1]!
      const dang = document.activeElement
      if (ev.shiftKey && (dang === dau || !tam.current.contains(dang))) {
        ev.preventDefault()
        cuoi.focus()
      } else if (!ev.shiftKey && (dang === cuoi || !tam.current.contains(dang))) {
        ev.preventDefault()
        dau.focus()
      }
    }
    window.addEventListener('keydown', phim, true)
    return () => {
      window.removeEventListener('keydown', phim, true)
      b.style.overflow = cu
      if (traVe?.isConnected) traVe.focus({ preventScroll: true })
    }
  }, [])

  const khung = (
    <div className="bcc-tam-khung" data-tang={p.tang ?? 'tren'} inert={p.phu || undefined}>
      <div className="bcc-tam-che" aria-hidden="true" onClick={() => dongRef.current()} />
      <section ref={tam} className="bcc-tam" data-kieu={p.kieu} role="dialog" aria-modal="true" aria-labelledby={`${id}-td`}>
        <span className="bcc-tam-keo" aria-hidden="true" />
        <header className="bcc-tam-dau">
          <div className="bcc-tam-dau-chu">
            <h2 id={`${id}-td`}>{p.tieuDe}</h2>
            {p.phuDe && <p>{p.phuDe}</p>}
          </div>
          <button ref={nutDong} type="button" className="bcc-tam-dong tt-nhan" onClick={() => dongRef.current()}>
            <X size={20} strokeWidth={2.4} aria-hidden="true" />
            Đóng
          </button>
        </header>
        <div className="bcc-tam-than">{p.children}</div>
      </section>
    </div>
  )
  return createPortal(p.lopBoc ? <div className={p.lopBoc} style={{ display: 'contents' }}>{khung}</div> : khung, document.body)
}
