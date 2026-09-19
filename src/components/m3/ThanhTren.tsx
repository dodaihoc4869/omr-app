import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import NutTron from './NutTron'

/** Thanh trên dính của màn/tấm phủ: nút quay lại tròn 48 px + tên màn (+ phần phải). */
export default function ThanhTren({
  tieuDe,
  onQuayLai,
  nhanQuayLai = 'Quay lại',
  phai,
}: {
  tieuDe: string
  onQuayLai?: () => void
  nhanQuayLai?: string
  phai?: ReactNode
}) {
  return (
    <div className="m3-thanh-tren">
      {onQuayLai && (
        <NutTron nhan={nhanQuayLai} onClick={onQuayLai}>
          <ArrowLeft size={24} aria-hidden="true" />
        </NutTron>
      )}
      <p className="m3-thanh-tren-ten">{tieuDe}</p>
      {phai && <div className="m3-thanh-tren-phai">{phai}</div>}
    </div>
  )
}
