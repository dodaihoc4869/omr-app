// DA-03 · Trên đầu (Đẹp) — nơ hai thanh song song kiểu liên kết đôi (=), bốn đầu là quả cầu (nguyên tử). Tĩnh.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g strokeLinecap="round" fill="none">
        <path d="M24 44L76 40" className="pk-s1" strokeWidth="8" />
        <path d="M24 60L76 56" className="pk-s1" strokeWidth="8" />
        <path d="M28 43L72 40" className="pk-s3" strokeWidth="2" opacity=".85" />
        <path d="M28 59L72 56" className="pk-s3" strokeWidth="2" opacity=".85" />
      </g>
      {[[20, 44], [20, 60], [80, 40], [80, 56]].map(([x, y]) => (
        <g key={`${x}${y}`}>
          <circle cx={x} cy={y} r="9" className="pk-f2" />
          <circle cx={x! - 3} cy={y! - 3} r="3" className="pk-f3" />
        </g>
      ))}
      <rect x="44" y="42" width="12" height="20" rx="4" transform="rotate(-4 50 52)" className="pk-f2" />
    </svg>
  )
}
