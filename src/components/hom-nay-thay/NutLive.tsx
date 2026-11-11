// NÚT «LIVE» Ở ĐẦU MÀN HÔM NAY, ngay trước «Điểm danh» (thầy chốt build 11/11; đặc tả docs/dac-ta-live-xem-lai-1011.md mục 2.2, điểm quyết 5 — không thêm mục
// thanh bên). Bấm ⇒ màn «Lịch sử Live» (mảnh nạp lười src/screens/live-xem-lai/gv/) vẽ đè lên vùng nội dung Hôm nay. Buổi vừa xong đang dựng ⇒ chip «1 đang xử lý»
// (hỏi lúc Hôm nay rảnh, cũng bằng mảnh lười ⇒ nút này chỉ thêm vài chục byte vào mảnh Hôm nay).
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './nut-live.css'

const LichSuLive = lazy(() => import('../../screens/live-xem-lai/gv/LichSuLive'))

export default function NutLive({ className }: { className: string }) {
  const nut = useRef<HTMLButtonElement>(null)
  const [cho, setCho] = useState<Element | null>(null)
  const [dang, setDang] = useState(0)
  // Việc theo dõi (hỏi lúc rảnh, hỏi lại khi thầy vừa đóng màn chiếu / quay lại tab, 15 giây một lần khi đang xử lý) nằm cả trong mảnh lười.
  useEffect(() => {
    if (cho) return
    let song = true, dung: (() => void) | undefined
    const nap = () => { void import('../../screens/live-xem-lai/gv/lich-su-live-api').then((m) => { if (song) dung = m.theoDoiDangXuLy(setDang) }).catch(() => {}) }
    const w = window as Window & { requestIdleCallback?: (f: () => void, o?: { timeout: number }) => number }
    const h = w.requestIdleCallback ? (w.requestIdleCallback(nap, { timeout: 5000 }), 0) : window.setTimeout(nap, 3000)
    return () => { song = false; if (h) clearTimeout(h); dung?.() }
  }, [cho])
  return (
    <>
      <button ref={nut} type="button" className={className} onClick={() => setCho(nut.current?.closest('.gv2-trang') ?? document.body)} aria-label={dang ? `Live · ${dang} đang xử lý` : 'Live · lịch sử các buổi live'}>
        {/* Biểu tượng «phát» vẽ tại chỗ: không thêm biểu tượng mới vào mảnh biểu tượng dùng chung của app thầy (đường mở /gv không thêm byte). */}
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="m10 8 6 4-6 4z" /></svg>
        Live
        {dang > 0 && <span className="gvv2-chip" data-tang="1">{dang} đang xử lý</span>}
      </button>
      {cho && createPortal(<Suspense fallback={null}><LichSuLive onDong={() => setCho(null)} /></Suspense>, cho)}
    </>
  )
}
