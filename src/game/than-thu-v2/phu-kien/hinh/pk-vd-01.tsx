// VD-01 · Vệt di chuyển (Thường) — chuỗi bong bóng tròn nhỏ dần phía sau (CO₂). viewBox 256×96: bên PHẢI = chỗ thú, đuôi kéo về TRÁI. Tĩnh.
import type { HinhProps } from '../nap-hinh'

const B: [number, number, number][] = [
  [226, 62, 15],
  [180, 48, 11.5],
  [142, 66, 9],
  [110, 52, 7],
  [82, 68, 5.2],
  [58, 56, 3.8],
  [38, 66, 2.6],
  [22, 60, 1.8],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      {B.map(([x, y, r]) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} className="pk-f2" opacity=".34" />
          <circle cx={x} cy={y} r={r} fill="none" className="pk-s1" strokeWidth={Math.max(1.8, r * 0.17)} opacity="1" />
          <circle cx={x - r * 0.36} cy={y - r * 0.36} r={r * 0.22} className="pk-f3" />
        </g>
      ))}
    </svg>
  )
}
