// MỘT ô số của hàng bốn ô: nhãn, số lăn, đơn vị, chip chênh 10 phút, đường tia 60 phút. Số nào cũng có nhãn.
import type { ReactNode } from 'react'
import { SoLan } from './SoLan'
import { TiaCanvas } from './TiaCanvas'
import type { MauSan } from './hooks'

export type Huong = 'len' | 'xuong' | 'ngang'

export function MuiTen({ h }: { h: Huong }) {
  return (
    <svg className="bts-mt" viewBox="0 0 10 10" aria-hidden="true">
      {h === 'len' ? <path d="M5 1.2 9.2 8.6H.8z" fill="currentColor" /> : h === 'xuong' ? <path d="M5 8.8.8 1.4h8.4z" fill="currentColor" /> : <circle cx="5" cy="5" r="3.3" fill="currentColor" />}
    </svg>
  )
}

/** Chip chênh lệch: lên (xanh) / xuống (đỏ) / đi ngang theo số đã làm tròn (số nguyên; hoặc 1 chữ số thập phân với `thapPhan`). */
export function ChipLech({ d, don, thapPhan }: { d: number; don: string; thapPhan?: boolean }): ReactNode {
  const lam = thapPhan ? Math.round(d * 10) / 10 : Math.round(d) // hướng theo SỐ ĐANG HIỆN: làm tròn về 0 ⇒ đi ngang, không dấu (không "▲ +0,0")
  const h: Huong = lam > 0 ? 'len' : lam < 0 ? 'xuong' : 'ngang'
  const a = Math.abs(lam)
  const so = thapPhan ? a.toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : Math.round(a).toLocaleString('vi-VN')
  return (
    <span className="bts-lech" data-h={h} title="So với 10 phút trước">
      <MuiTen h={h} />
      <span>
        {lam > 0 ? '+' : lam < 0 ? '−' : ''}
        {so} {don}
      </span>
    </span>
  )
}

export interface OSoProps {
  nhan: string
  chu: string
  donVi?: string
  /** Chênh lệch 10 phút: null ⇒ không có chip (thiếu chuỗi). */
  lech: { d: number; don: string; thapPhan?: boolean } | null
  tia: readonly number[] | null
  tenMauTia: 'duong' | 'la' | 'do' | 'tuDong'
  nhanTia: string
  mau: MauSan
  phienBanMau: number
  khoi: string
}

export function OSo(p: OSoProps) {
  return (
    <article className="bts-the bts-o-so" data-khoi={p.khoi}>
      <div className="bts-o-trai">
        <h2 className="bts-o-nhan">{p.nhan}</h2>
        <div className="bts-o-gia">
          <SoLan chu={p.chu} />
          {p.donVi && <span className="bts-o-duoi">{p.donVi}</span>}
        </div>
        <div className="bts-o-lech">
          {p.lech && <ChipLech d={p.lech.d} don={p.lech.don} thapPhan={p.lech.thapPhan} />}
          {p.lech && <span className="bts-o-lech-chu">10 phút qua</span>}
        </div>
      </div>
      {p.tia && p.tia.length >= 2 && (
        <div className="bts-o-tia">
          <TiaCanvas gia={p.tia} mau={p.mau} phienBanMau={p.phienBanMau} tenMau={p.tenMauTia} nhan={p.nhanTia} />
          <span className="bts-o-tia-ghi">60 phút</span>
        </div>
      )}
    </article>
  )
}
