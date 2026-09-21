// VD-04 · Vệt di chuyển (Đẹp) — đuôi lửa tím hoa cà mảnh, tàn lửa li ti. viewBox 256×96: bên PHẢI là chỗ thú (đuôi kéo về TRÁI), đường đi dọc y ≈ 68. Không <filter>.
import type { HinhProps } from '../nap-hinh'

const TAN: [number, number, number][] = [
  [232, 66, 2.1],
  [186, 70, 1.6],
  [142, 73, 1.25],
  [102, 75, 0.95],
  [68, 77, 0.7],
  [38, 78, 0.5],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      <g className="pk-nhap">
        {TAN.map(([x, y, t]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${t}) rotate(-72)`}>
            <circle r="15" className="pk-f1" opacity=".16" />
            <path className="pk-f1" d="M0-20C9-9 11 0 0 10-11 0-9-9 0-20Z" />
            <path className="pk-f3" d="M0-9C4-4 5 1 0 6-5 1-4-4 0-9Z" />
          </g>
        ))}
      </g>
    </svg>
  )
}
