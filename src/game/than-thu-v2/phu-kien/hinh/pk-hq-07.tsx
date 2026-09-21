// HQ-07 · Hào quang (Sử thi) — dải cực quang lục – tím uốn sau lưng thú. Quầng mờ dựng bằng nhiều nét dày mờ dần (không <filter>). MỘT chuyển động: nhịp thở 4 giây.
import type { HinhProps } from '../nap-hinh'

const DAI = ['M14 118C66 46 118 150 168 78S244 54 250 104', 'M20 168C78 100 130 196 184 130S240 118 246 158']
export default function Hinh({ id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}c`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--pk-1)', stopOpacity: 0 }} />
          <stop offset=".3" style={{ stopColor: 'var(--pk-1)' }} />
          <stop offset=".7" style={{ stopColor: 'var(--pk-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pk-2)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <g className="pk-tho" fill="none" strokeLinecap="round" stroke={`url(#${id}c)`}>
        {DAI.map((d, i) => (
          <g key={d}>
            <path d={d} strokeWidth={i ? 40 : 52} opacity=".1" />
            <path d={d} strokeWidth={i ? 26 : 34} opacity=".2" />
            <path d={d} strokeWidth={i ? 14 : 20} opacity=".42" />
            <path d={d} strokeWidth={i ? 5 : 7} opacity=".9" />
          </g>
        ))}
      </g>
    </svg>
  )
}
