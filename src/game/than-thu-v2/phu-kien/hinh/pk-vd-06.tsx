// VD-06 · Vệt di chuyển (Hiếm) — tia sáng trắng chói hình sao bắn ra theo bước chân (magnesium cháy). Quầng toả bằng vòng tròn mờ dần, KHÔNG <filter>. MỘT chuyển động: nhấp nháy.
import type { HinhProps } from '../nap-hinh'

const SAO: [number, number, number][] = [
  [218, 60, 1],
  [160, 40, 0.72],
  [124, 70, 0.6],
  [84, 44, 0.44],
  [54, 68, 0.34],
  [26, 50, 0.26],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      <g className="pk-nhap">
        {SAO.map(([x, y, t]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${t})`}>
            <circle r="26" className="pk-f2" opacity=".1" />
            <circle r="17" className="pk-f2" opacity=".2" />
            <circle r="9" className="pk-f1" opacity=".5" />
            <path className="pk-f3" d="M0-24L4-4 24 0 4 4 0 24-4 4-24 0-4-4Z" />
            <path className="pk-f1" d="M0-11L2-2 11 0 2 2 0 11-2 2-11 0-2-2Z" />
          </g>
        ))}
        {[[196, 84], [140, 20], [102, 26], [66, 84], [40, 22]].map(([x, y]) => (
          <circle key={x} cx={x} cy={y} r="1.6" className="pk-f3" />
        ))}
      </g>
    </svg>
  )
}
