// DA-05 · Trên đầu (Hiếm) — vòng nguyệt quế bằng lá đồng đỏ cam, vài lá đã lên gỉ xanh (patina). Vòng vắt qua đỉnh đầu, chừa mặt. Tĩnh.
import type { HinhProps } from '../nap-hinh'

const LA: [number, number, number, boolean][] = [
  [16, 64, -62, false], [22, 54, -48, true], [31, 46, -30, false], [41, 42, -14, false], [50, 40, 0, true],
  [59, 42, 14, false], [69, 46, 30, true], [78, 54, 48, false], [84, 64, 62, false],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M12 72C24 44 76 44 88 72" fill="none" className="pk-s2" strokeWidth="2.6" strokeLinecap="round" opacity=".9" />
      {LA.map(([x, y, a, xanh]) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${a})`}>
          <path d="M0 4C-7 -2 -5 -12 0 -16C5 -12 7 -2 0 4Z" className={xanh ? 'pk-f3' : 'pk-f1'} />
          <path d="M0 3V-13" fill="none" className="pk-s2" strokeWidth="1.1" opacity=".7" />
        </g>
      ))}
      <circle cx="50" cy="33" r="4.4" className="pk-f3" />
      <circle cx="50" cy="33" r="1.8" className="pk-f1" />
    </svg>
  )
}
