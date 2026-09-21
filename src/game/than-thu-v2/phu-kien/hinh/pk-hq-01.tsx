// HQ-01 · Hào quang (Thường) — vòng sương trắng mỏng quanh chân thú, ba giọt nước nhỏ. viewBox 256: thú chiếm 53–203, chân y ≈ 203. Tĩnh.
import type { HinhProps } from '../nap-hinh'

const GIOT: [number, number, number][] = [
  [54, 176, 1],
  [204, 182, 0.85],
  [150, 226, 0.7],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <ellipse cx="128" cy="204" rx="98" ry="26" fill="none" className="pk-s1" strokeWidth="7" opacity=".22" />
      <ellipse cx="128" cy="204" rx="98" ry="26" fill="none" className="pk-s1" strokeWidth="2.6" opacity=".7" />
      <ellipse cx="128" cy="204" rx="78" ry="19" fill="none" className="pk-s1" strokeWidth="1.6" opacity=".4" />
      {GIOT.map(([x, y, t]) => (
        <g key={x} transform={`translate(${x} ${y}) scale(${t})`}>
          <path className="pk-f2" d="M0-13C6-5 9 0 9 5A9 9 0 0 1-9 5C-9 0-6-5 0-13Z" opacity=".92" />
          <path className="pk-s3" d="M-3.5 4A4 4 0 0 0 0 9" fill="none" strokeWidth="2" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}
