// Mảnh dùng chung của app phụ huynh mới: thẻ, chip, ba trạng thái tải · trống · lỗi. Không màu thô (token --ph3-* trong CSS).
import type { ReactNode } from 'react'

export type Mau = 'xd' | 'xl' | 'hp' | 'ho' | 'tim'

export function The({ id, tieuDe, phu, bieuTuong, mau = 'xd', chip, className = '', sat = false, children, vung }: {
  id: string
  tieuDe: ReactNode
  phu?: ReactNode
  bieuTuong?: ReactNode
  mau?: Mau | 'thay'
  chip?: ReactNode
  className?: string
  sat?: boolean
  children?: ReactNode
  vung?: string
}) {
  return (
    <section className={`ph3-the${sat ? ' ph3-the--sat' : ''} ${className}`.trim()} aria-labelledby={id} data-vung={vung}>
      <div className="ph3-the__dau">
        {bieuTuong && (
          <span className="ph3-o-bt" data-mau={mau} aria-hidden="true">
            {bieuTuong}
          </span>
        )}
        <div>
          <h2 id={id}>{tieuDe}</h2>
          {phu && <span>{phu}</span>}
        </div>
        {chip}
      </div>
      {children}
    </section>
  )
}

export function Chip({ mau, nho = false, children }: { mau: Mau; nho?: boolean; children: ReactNode }) {
  return (
    <span className={`ph3-chip${nho ? ' ph3-chip--nho' : ''}`} data-mau={mau}>
      {children}
    </span>
  )
}

export function Xuong({ cao }: { cao: number }) {
  return <div className="ph3-xuong" style={{ height: cao }} aria-hidden="true" />
}
export function DangTai({ chu = 'Đang tải dữ liệu của con…' }: { chu?: string }) {
  return (
    <div className="ph3-luoi" role="status" aria-live="polite">
      <span className="ph3-an">{chu}</span>
      <Xuong cao={320} />
      <Xuong cao={180} />
      <Xuong cao={220} />
    </div>
  )
}
export function TheLoi({ chu, thuLai }: { chu: string; thuLai: () => void }) {
  return (
    <section className="ph3-the ph3-trong" role="alert">
      <p>{chu}</p>
      <button type="button" className="ph3-nut-vien" onClick={thuLai}>
        Thử lại
      </button>
    </section>
  )
}
export function TheTrong({ id, tieuDe, chu, children }: { id: string; tieuDe: string; chu: string; children?: ReactNode }) {
  return (
    <The id={id} tieuDe={tieuDe}>
      <div className="ph3-trong">
        <p>{chu}</p>
        {children}
      </div>
    </The>
  )
}
