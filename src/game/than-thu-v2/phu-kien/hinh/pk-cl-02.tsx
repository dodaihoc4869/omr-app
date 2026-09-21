// CL-02 · Trên lưng (Thường) — chuỗi hạt tròn trắng ngà như ngọc trai (cùng chất với đá vôi), hạt giữa to nhất. Cổ ở (50,50). Tĩnh.
import type { HinhProps } from '../nap-hinh'

const N = 9
const HAT = Array.from({ length: N }, (_, i) => {
  const t = i / (N - 1)
  return { x: 18 + 64 * t, y: 46 + 28 * Math.sin(Math.PI * t), r: 4.6 + 3.4 * Math.sin(Math.PI * t) }
})
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d={`M14 44C24 86 76 86 86 44`} fill="none" className="pk-s2" strokeWidth="1.4" />
      {HAT.map(({ x, y, r }) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} className="pk-f1" />
          <circle cx={x} cy={y} r={r} fill="none" className="pk-s2" strokeWidth="1" opacity=".7" />
          <circle cx={x - r * 0.32} cy={y - r * 0.34} r={r * 0.3} className="pk-f3" />
        </g>
      ))}
    </svg>
  )
}
