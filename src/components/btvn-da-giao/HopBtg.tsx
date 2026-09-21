// HỘP THOẠI dùng chung của mục Bài tập về nhà đã giao (Đổi hạn nộp, Chi tiết bài, Xem bài làm): role=dialog, Esc / bấm nền = đóng, tiêu điểm vào hộp và trả lại nút đã mở.
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import './btg.css'

export default function HopBtg({ tieuDe, dong, rong = false, children }: { tieuDe: string; dong: () => void; rong?: boolean; children: ReactNode }) {
  const id = useId()
  const goc = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    goc.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        dong()
      }
    }
    document.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('keydown', phim)
      truoc?.focus?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return (
    <div className="btg-nen" onMouseDown={(e) => { if (e.target === e.currentTarget) dong() }}>
      <div ref={goc} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={id} className={`btg-hop${rong ? ' btg-hop--rong' : ''}`}>
        <div className="btg-hop-dau">
          <h2 id={id} className="btg-hop-ten">{tieuDe}</h2>
          <button type="button" className="btg-nut-tron" aria-label="Đóng" onClick={dong}><X size={18} /></button>
        </div>
        <div className="btg-hop-than">{children}</div>
      </div>
    </div>
  )
}
