import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

/** TẤM BÊN của Bảng tin: nơi DUY NHẤT được cuộn (trang chính không cuộn). Desktop trượt từ phải; điện thoại là tấm kéo từ đáy.
 *  Esc / bấm nền / nút Đóng đều đóng; tiêu điểm vào nút Đóng lúc mở và trả về nút đã mở tấm lúc đóng. */
export default function TamBen({ tieuDe, phu, onDong, children }: { tieuDe: string; phu?: string; onDong: () => void; children: ReactNode }) {
  const id = useId()
  const nutDong = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const truoc = document.activeElement as HTMLElement | null
    nutDong.current?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onDong()
    }
    document.addEventListener('keydown', phim)
    return () => {
      document.removeEventListener('keydown', phim)
      truoc?.focus?.()
    }
  }, [onDong])
  return (
    <div className="bt3-tam-nen" data-khoi="tam-ben">
      {/* Bấm nền = đóng; là nút thật (không phải div bấm được) nhưng ngoài vòng Tab — đã có nút Đóng và phím Esc */}
      <button type="button" className="bt3-tam-man" aria-label="Đóng tấm bên" tabIndex={-1} onClick={onDong} />
      <div className="bt3-tam" role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
        <div className="bt3-tam-dau">
          <div>
            <h2 id={`${id}-t`} className="bt3-tam-tieu-de">
              {tieuDe}
            </h2>
            {phu && <p className="bt3-tam-phu">{phu}</p>}
          </div>
          <button ref={nutDong} type="button" className="bt3-tam-dong" onClick={onDong} aria-label="Đóng">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="bt3-tam-than">{children}</div>
      </div>
    </div>
  )
}
