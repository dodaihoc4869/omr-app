// Mảnh dùng chung của app phụ huynh mới: thẻ, chip, vòng tiến độ, số thay đổi, ba trạng thái tải · trống · lỗi. Không màu thô (token --ph3-* trong CSS).
import type { ReactNode } from 'react'
import { soVn } from '../../lib/ph-moi/dinh-dang'
import { BtLen, BtXuong } from './BieuTuong'

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

/** Vòng tiến độ đồng tâm (tối đa 3). `ti` 0–1 (vượt 1 ⇒ vẽ đầy); `null` ⇒ chỉ vẽ ray (không có mục tiêu). */
export function VongDongTam({ vong, co = 140, nhan }: { vong: { ti: number | null; mau: 'vong-hp' | 'vong-xl' | 'vong-tim' }[]; co?: number; nhan: string }) {
  const R = [64, 46, 28]
  return (
    <svg width={co} height={co} viewBox="0 0 148 148" role="img" aria-label={nhan}>
      {vong.slice(0, 3).map((v, i) => {
        const r = R[i]!
        const chuVi = 2 * Math.PI * r
        const ti = v.ti === null ? 0 : Math.max(0, Math.min(1, v.ti))
        return (
          <g key={i} data-mau={v.mau}>
            <circle cx="74" cy="74" r={r} fill="none" stroke="currentColor" strokeOpacity={0.22} strokeWidth="14" />
            {ti > 0 && (
              <circle
                cx="74" cy="74" r={r} fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap={ti >= 1 ? 'butt' : 'round'}
                strokeDasharray={`${(ti * chuVi).toFixed(2)} ${chuVi.toFixed(2)}`} transform="rotate(-90 74 74)"
              />
            )}
          </g>
        )
      })}
    </svg>
  )
}

/** "▲ 0,5" · "▼ 0,25" · "= 0" — mũi tên + dấu bằng CHỮ (màu không là kênh duy nhất). */
export function DoiDiem({ doi, duoi = '' }: { doi: number; duoi?: string }) {
  const huong = doi > 0.004 ? 'len' : doi < -0.004 ? 'xuong' : 'giu'
  return (
    <span className="ph3-doi" data-huong={huong}>
      {huong === 'len' ? 'Tăng ' : huong === 'xuong' ? 'Giảm ' : 'Giữ nguyên'}
      {huong !== 'giu' && soVn(Math.abs(doi))}
      {duoi}
    </span>
  )
}
export function ChipDoi({ doi, duoi }: { doi: number; duoi: string }) {
  const len = doi > 0.004
  const xuong = doi < -0.004
  return (
    <Chip mau={len ? 'xl' : xuong ? 'ho' : 'xd'}>
      {len ? <BtLen co={14} day={3} /> : xuong ? <BtXuong co={14} day={3} /> : null}
      {len ? 'Tăng ' : xuong ? 'Giảm ' : 'Giữ nguyên '}
      {len || xuong ? `${soVn(Math.abs(doi))} ` : ''}
      {duoi}
    </Chip>
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
