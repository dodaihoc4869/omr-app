// HỘP THOẠI CỦA CỔNG HỌC SINH — thay `confirm`/`alert` của trình duyệt (chữ "OK / Hủy", không nói việc sẽ làm). Bảng từ ngữ H38.
// Mỗi hộp có TIÊU ĐỀ nói việc, DÒNG NÓI KẾT QUẢ, và nút mang ĐỘNG TỪ ("Làm lại bài" / "Để sau", "Đã hiểu"). Bất đồng bộ: `hoi` trả Promise<boolean>,
// `bao` trả Promise<void>; nhiều hộp xin liên tiếp thì xếp hàng, hiện lần lượt. Esc / chạm nền tối = chọn nút an toàn ("Để sau"). Không mạng, không đồng hồ.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import './hop-thoai-cong.css'

export interface YeuCauHoi {
  tieuDe: string
  noiDung: string
  nutDongY: string
  nutHuy: string
}

interface Muc {
  kieu: 'hoi' | 'bao'
  tieuDe: string
  noiDung: string
  nutDongY: string
  nutHuy: string
  xong: (dongY: boolean) => void
}

function Hop({ muc, dong }: { muc: Muc; dong: (dongY: boolean) => void }) {
  const goc = useRef<HTMLDivElement>(null)
  const nutAnToan = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutAnToan.current?.focus()
    return () => truoc?.focus?.()
  }, [])
  const phim = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      dong(false)
      return
    }
    if (e.key !== 'Tab') return
    const nut = Array.from(goc.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
    if (nut.length === 0) return
    const dau = nut[0]!
    const cuoi = nut[nut.length - 1]!
    if (e.shiftKey && document.activeElement === dau) {
      e.preventDefault()
      cuoi.focus()
    } else if (!e.shiftKey && document.activeElement === cuoi) {
      e.preventDefault()
      dau.focus()
    }
  }
  const laHoi = muc.kieu === 'hoi'
  return (
    <div className="htc-nen" onMouseDown={(e) => { if (e.target === e.currentTarget) dong(false) }}>
      <div ref={goc} className="htc-hop" role="alertdialog" aria-modal="true" aria-labelledby="htc-tieu-de" aria-describedby="htc-noi-dung" onKeyDown={phim}>
        <h2 id="htc-tieu-de" className="htc-tieu-de">{muc.tieuDe}</h2>
        <p id="htc-noi-dung" className="htc-noi-dung">{muc.noiDung}</p>
        <div className="htc-nut">
          {laHoi && (
            <button ref={nutAnToan} type="button" className="htc-nut-phu" onClick={() => dong(false)}>{muc.nutHuy}</button>
          )}
          <button ref={laHoi ? undefined : nutAnToan} type="button" className="htc-nut-chinh" onClick={() => dong(true)}>{muc.nutDongY}</button>
        </div>
      </div>
    </div>
  )
}

/** Dùng: `const { hoi, bao, hop } = useHopThoai()` rồi đặt `{hop}` MỘT LẦN trong JSX của màn. */
export function useHopThoai(): { hoi: (y: YeuCauHoi) => Promise<boolean>; bao: (noiDung: string, tieuDe?: string) => Promise<void>; hop: ReactNode } {
  const [hang, setHang] = useState<Muc[]>([])
  const hoi = useCallback(
    (y: YeuCauHoi) => new Promise<boolean>((xong) => setHang((h) => [...h, { kieu: 'hoi', ...y, xong }])),
    [],
  )
  const bao = useCallback(
    (noiDung: string, tieuDe = 'Thông báo') =>
      new Promise<void>((xong) => setHang((h) => [...h, { kieu: 'bao', tieuDe, noiDung, nutDongY: 'Đã hiểu', nutHuy: '', xong: () => xong() }])),
    [],
  )
  const dau = hang[0]
  const dong = (dongY: boolean) => {
    if (!dau) return
    dau.xong(dongY)
    setHang((h) => h.slice(1))
  }
  return { hoi, bao, hop: dau ? <Hop key={hang.length + dau.tieuDe + dau.noiDung} muc={dau} dong={dong} /> : null }
}
