// HQ-08 · Hào quang (Huyền thoại) — ba quỹ đạo electron vàng kim xoay chậm, hạt nhân sáng sau lưng. MỘT chuyển động: cả bộ quỹ đạo xoay 40 giây/vòng (transform). Không <filter>.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}h`}>
          <stop offset="0" style={{ stopColor: 'var(--pk-3)', stopOpacity: 0.9 }} />
          <stop offset=".22" style={{ stopColor: 'var(--pk-1)', stopOpacity: 0.55 }} />
          <stop offset=".62" style={{ stopColor: 'var(--pk-2)', stopOpacity: 0.16 }} />
          <stop offset="1" style={{ stopColor: 'var(--pk-2)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <circle cx="128" cy="128" r="122" fill={`url(#${id}h)`} />
      <g className="pk-quay" fill="none">
        {[0, 60, 120].map((g, i) => (
          <g key={g} transform={`rotate(${g} 128 128)`}>
            <ellipse cx="128" cy="128" rx="118" ry="42" className="pk-s1" strokeWidth="5" opacity=".18" />
            <ellipse cx="128" cy="128" rx="118" ry="42" className="pk-s1" strokeWidth="2.2" />
            <circle cx={i === 1 ? 10 : 246} cy="128" r="9" className="pk-f1" opacity=".3" />
            <circle cx={i === 1 ? 10 : 246} cy="128" r="5.5" className="pk-f3" />
          </g>
        ))}
      </g>
    </svg>
  )
}
