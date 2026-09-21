// VD-05 · Vệt di chuyển (Đẹp) — đuôi lửa xanh lục (ngọn lửa đồng), lõi sáng trắng. MỘT chuyển động: cả đuôi nhấp nháy. Không <filter>.
import type { HinhProps } from '../nap-hinh'

const LUA: [number, number, number][] = [
  [232, 62, 2.1],
  [186, 66, 1.6],
  [142, 69, 1.25],
  [102, 71, 0.95],
  [68, 73, 0.7],
  [38, 74, 0.5],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      <g className="pk-nhap">
        {LUA.map(([x, y, t]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${t}) rotate(-78)`}>
            <ellipse cy="-4" rx="14" ry="20" className="pk-f2" opacity=".18" />
            <path className="pk-f1" d="M0-22C10-10 13 0 0 12-13 0-10-10 0-22Z" />
            <path className="pk-f2" d="M0-13C6-6 8 0 0 8-8 0-6-6 0-13Z" />
            <path className="pk-f3" d="M0-6C3-2 3.6 1 0 4-3.6 1-3-2 0-6Z" />
          </g>
        ))}
        <path className="pk-s1" d="M20 78H222" fill="none" strokeWidth="1.6" opacity=".35" strokeLinecap="round" />
      </g>
    </svg>
  )
}
