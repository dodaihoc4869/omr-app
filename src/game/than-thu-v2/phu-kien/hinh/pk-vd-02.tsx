// VD-02 · Vệt di chuyển (Thường) — dấu chân rắc hạt muối tinh thể lập phương trắng. Ba dấu chân nhỏ dần, hạt muối vương xung quanh. Tĩnh.
import type { HinhProps } from '../nap-hinh'

const CHAN: [number, number, number][] = [
  [212, 66, 1],
  [138, 62, 0.78],
  [72, 66, 0.56],
]
const HAT: [number, number, number][] = [
  [186, 44, 5], [166, 78, 4], [110, 44, 4.4], [98, 80, 3.6], [44, 48, 3], [28, 74, 2.6], [236, 30, 4],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      {CHAN.map(([x, y, t]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${t})`} opacity={0.5 + t * 0.5}>
          <ellipse cx="0" cy="6" rx="13" ry="10" className="pk-f2" opacity=".55" />
          {[-14, -5, 5, 14].map((dx, i) => (
            <ellipse key={dx} cx={dx} cy={i % 3 === 0 ? -8 : -12} rx="4.6" ry="5.6" className="pk-f2" opacity=".55" />
          ))}
        </g>
      ))}
      {HAT.map(([x, y, s]) => (
        <g key={x} transform={`translate(${x} ${y}) rotate(${(x * 7) % 40})`}>
          <rect x={-s} y={-s} width={s * 2} height={s * 2} rx="0.8" className="pk-f1" />
          <path className="pk-f3" d={`M${-s} ${-s}H${s}L${s * 0.5} ${-s * 0.4}H${-s * 0.5}Z`} opacity=".9" />
        </g>
      ))}
    </svg>
  )
}
