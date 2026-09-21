// CL-05 · Trên lưng (Hiếm, vẽ SAU thú) — đôi cánh trong ghép từ các phân tử nước hình chữ V (O to + hai H nhỏ, góc ≈ 104,5°). Cánh gần mở lên trên và ra sau (trái), cánh xa nhạt hơn. MỘT chuyển động: các phân tử lấp lánh.
import type { HinhProps } from '../nap-hinh'

const CANH = 'M52 54C42 36 28 18 8 6C4 18 2 30 6 38C10 34 15 34 18 37C18 44 22 48 28 50C34 50 39 54 46 57Z'
const PT: [number, number, number][] = [[14, 16, 30], [24, 24, 20], [12, 30, 40], [26, 38, 10], [36, 34, 0], [40, 46, -10]]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g transform="translate(10 -6) scale(.86)" opacity=".5">
        <path d={CANH} className="pk-f1" opacity=".55" />
        <path d={CANH} fill="none" className="pk-s2" strokeWidth="1.8" strokeLinejoin="round" />
      </g>
      <path d={CANH} className="pk-f1" opacity=".5" />
      <path d={CANH} fill="none" className="pk-s2" strokeWidth="2" strokeLinejoin="round" />
      <path d="M52 54C34 34 20 18 12 10M46 57C32 46 22 40 14 34" fill="none" className="pk-s3" strokeWidth="1" opacity=".6" />
      <g className="pk-nhap">
        {PT.map(([x, y, a]) => (
          <g key={x} transform={`translate(${x} ${y}) rotate(${a})`}>
            <circle r="3.4" className="pk-f2" />
            <circle cx="-3.6" cy="4.6" r="2" className="pk-f3" />
            <circle cx="3.6" cy="4.6" r="2" className="pk-f3" />
          </g>
        ))}
      </g>
    </svg>
  )
}
