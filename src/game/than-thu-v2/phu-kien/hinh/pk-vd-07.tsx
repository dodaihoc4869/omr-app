// VD-07 · Vệt di chuyển (Sử thi) — dải đỏ tươi dài kiểu sao băng (strontium), đầu vệt có đốm sáng. Quầng bằng nhiều lớp mờ dần, KHÔNG <filter>. MỘT chuyển động: nhịp thở chậm.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}d`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--pk-2)', stopOpacity: 0.95 }} />
          <stop offset=".45" style={{ stopColor: 'var(--pk-1)', stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: 'var(--pk-1)', stopOpacity: 0 }} />
        </linearGradient>
      </defs>
      <g className="pk-nhap-cham">
        <path d="M236 52C170 42 90 60 8 74 90 88 170 86 236 72Z" fill={`url(#${id}d)`} opacity=".4" />
        <path d="M236 54C176 46 96 58 20 68 96 80 176 80 236 70Z" fill={`url(#${id}d)`} />
        <path d="M238 58C190 55 130 60 74 66 130 72 190 72 238 68Z" className="pk-f3" opacity=".8" />
        <circle cx="238" cy="63" r="15" className="pk-f2" opacity=".22" />
        <circle cx="238" cy="63" r="9" className="pk-f2" opacity=".5" />
        <circle cx="238" cy="63" r="4.6" className="pk-f3" />
        {[[188, 44, 2.2], [142, 84, 1.8], [104, 46, 1.6], [66, 82, 1.3], [34, 52, 1.1]].map(([x, y, r]) => (
          <circle key={x} cx={x} cy={y} r={r} className="pk-f2" />
        ))}
      </g>
    </svg>
  )
}
