// HQ-06 · Hào quang (Hiếm) — lưới tứ diện carbon (mạng kim cương), nút mạng loé sáng. Không <filter>. MỘT chuyển động: nhóm nút nhấp nháy.
import type { HinhProps } from '../nap-hinh'

const N: [number, number][] = [
  [128, 56], [70, 88], [186, 88], [46, 150], [128, 128], [210, 150], [86, 196], [170, 196], [128, 222],
]
const CANH: [number, number][] = [
  [0, 1], [0, 2], [0, 4], [1, 3], [1, 4], [2, 4], [2, 5], [3, 6], [4, 6], [4, 7], [5, 7], [6, 8], [7, 8], [4, 8],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <g fill="none" strokeLinecap="round">
        {CANH.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={N[a]![0]} y1={N[a]![1]} x2={N[b]![0]} y2={N[b]![1]} className="pk-s1" strokeWidth="2.2" opacity=".55" />
        ))}
      </g>
      {N.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="5.5" className="pk-f2" opacity=".85" />
      ))}
      <g className="pk-nhap">
        {N.map(([x, y], i) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={i % 3 === 0 ? 3.4 : 2.2} className="pk-f3" />
        ))}
        <path className="pk-s3" d="M128 44V68M116 56H140" fill="none" strokeWidth="2" strokeLinecap="round" />
      </g>
    </svg>
  )
}
