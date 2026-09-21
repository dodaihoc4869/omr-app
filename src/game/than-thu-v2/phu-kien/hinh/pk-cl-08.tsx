// CL-08 · Trên lưng (Huyền thoại, vẽ SAU thú) — áo choàng tím than điểm sao, viền vàng kim, treo từ cổ (phải) rủ ra sau lưng (trái). Lưng ở (50,50), thân dài 80. MỘT chuyển động: sao lấp lánh chậm (5 giây).
import type { HinhProps } from '../nap-hinh'

const AO = 'M82 44C66 36 44 38 24 46C12 50 4 58 2 68C10 66 14 72 12 80C22 74 28 82 30 90C42 80 52 80 60 86C70 76 76 60 82 44Z'
const SAO: [number, number, number][] = [[62, 52, 1.8], [40, 56, 1.4], [64, 72, 1.6], [24, 62, 1.2], [46, 74, 1.8], [12, 70, 1.2], [72, 58, 1.2], [34, 48, 1.2]]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={AO} className="pk-f1" />
      <path d="M82 44C70 42 54 46 40 54C28 60 20 70 20 80C30 76 40 84 52 78C64 70 74 58 82 44Z" className="pk-f2" opacity=".5" />
      <path d={AO} fill="none" className="pk-s3" strokeWidth="2.6" strokeLinejoin="round" />
      <path d="M82 44C66 36 44 38 24 46" fill="none" className="pk-s3" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="83" cy="45" r="3.6" className="pk-f3" />
      {SAO.map(([x, y, r], i) => (
        <circle key={x} cx={x} cy={y} r={r} className="pk-f4" opacity={i % 2 ? 0.6 : 0.95} />
      ))}
      <g className="pk-nhap-cham">
        {[[52, 62], [26, 66], [70, 48]].map(([x, y]) => (
          <path key={x} d={`M${x} ${y! - 4.2}L${x! + 1.1} ${y! - 1.1}L${x! + 4.2} ${y}L${x! + 1.1} ${y! + 1.1}L${x} ${y! + 4.2}L${x! - 1.1} ${y! + 1.1}L${x! - 4.2} ${y}L${x! - 1.1} ${y! - 1.1}Z`} className="pk-f4" />
        ))}
      </g>
    </svg>
  )
}
