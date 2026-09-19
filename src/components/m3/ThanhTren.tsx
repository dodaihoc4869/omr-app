import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import NutTron from './NutTron'

/** Thanh trên dính của màn/tấm phủ: nút quay lại tròn 48 px + tên màn (+ phần phải).
 *  `bieuTuong` đổi mũi tên mặc định — tấm phủ toàn màn kiểu "đóng" (KhungXemPhieu) dùng dấu X. */
export default function ThanhTren({
  tieuDe,
  onQuayLai,
  nhanQuayLai = 'Quay lại',
  bieuTuong,
  phai,
}: {
  tieuDe: string
  onQuayLai?: () => void
  nhanQuayLai?: string
  bieuTuong?: ReactNode
  phai?: ReactNode
}) {
  return (
    <div className="m3-thanh-tren">
      {onQuayLai && (
        <NutTron nhan={nhanQuayLai} onClick={onQuayLai}>
          {bieuTuong ?? <ArrowLeft size={24} aria-hidden="true" />}
        </NutTron>
      )}
      <p className="m3-thanh-tren-ten">{tieuDe}</p>
      {phai && <div className="m3-thanh-tren-phai">{phai}</div>}
    </div>
  )
}
