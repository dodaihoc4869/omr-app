// Mảnh dùng chung của app phụ huynh mới: thẻ, chip, ba trạng thái tải · trống · lỗi. Không màu thô (token --ph3-* trong CSS).
// Trung tu 09/10 (thầy duyệt bản vẽ): thẻ một cỡ tiêu đề (17), khung xương đúng hình từng màn (lớp .tt-xuong của thang chung), nút có lớp nhấn .tt-nhan.
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

/** Hình khung xương của từng màn: mỗi khối giữ đúng chỗ (cỡ, cột trên máy tính) của khối thật để khi số về màn không xô lệch. */
export type HinhCho = 'hom-nay' | 'tien-bo' | 'ca-kiem-tra' | 'chi-tiet' | 'loi-thay'
const KHOI_CHO: Record<HinhCho, { hinh: string; o: string }[]> = {
  'hom-nay': [{ hinh: 'ah', o: 'ph3-o-du' }, { hinh: 'the', o: 'ph3-o-rong' }, { hinh: 'tuan', o: 'ph3-o-hep' }, { hinh: 'ds', o: 'ph3-o-rong' }],
  'tien-bo': [{ hinh: 'ah', o: 'ph3-o-rong' }, { hinh: 'the', o: 'ph3-o-hep' }, { hinh: 'nhip', o: 'ph3-o-du' }],
  'ca-kiem-tra': [{ hinh: 'ca', o: 'ph3-o-rong' }, { hinh: 'ds', o: 'ph3-o-hep' }],
  'chi-tiet': [{ hinh: 'ah', o: 'ph3-o-rong' }, { hinh: 'the', o: 'ph3-o-hep' }, { hinh: 'ds', o: 'ph3-o-du' }],
  'loi-thay': [{ hinh: 'the', o: 'ph3-o-hep' }, { hinh: 'the', o: 'ph3-o-hep' }],
}
export function DangTai({ chu = 'Đang tải dữ liệu của con…', hinh = 'hom-nay' }: { chu?: string; hinh?: HinhCho }) {
  return (
    <div className="ph3-luoi" role="status" aria-live="polite" data-vung="dang-tai">
      <span className="ph3-an">{chu}</span>
      {KHOI_CHO[hinh].map((k, i) => (
        <div key={i} className={`ph3-xuong tt-xuong ${k.o}`} data-hinh={k.hinh} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}
export function TheLoi({ chu, thuLai }: { chu: string; thuLai: () => void }) {
  return (
    <section className="ph3-the ph3-trong ph3-o-du" role="alert">
      <p>{chu}</p>
      <button type="button" className="ph3-nut-vien tt-nhan" onClick={thuLai}>
        Thử lại
      </button>
    </section>
  )
}
export function TheTrong({ id, tieuDe, chu, children }: { id: string; tieuDe: string; chu: string; children?: ReactNode }) {
  return (
    <The id={id} tieuDe={tieuDe} className="ph3-o-du">
      <div className="ph3-trong">
        <p>{chu}</p>
        {children}
      </div>
    </The>
  )
}
