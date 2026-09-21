// HQ-03 · Hào quang (Đẹp) — quầng vàng cam ấm, năm lưỡi lửa nhỏ lay nhẹ. viewBox 256: thú chiếm ô giữa 53–203; tâm (128,128).
import type { HinhProps } from '../nap-hinh'

const GOC = [-150, -115, -90, -65, -30]
export default function Hinh({ id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id={`${id}q`}>
          <stop offset="0" style={{ stopColor: 'var(--pk-1)', stopOpacity: 0.8 }} />
          <stop offset=".55" style={{ stopColor: 'var(--pk-2)', stopOpacity: 0.3 }} />
          <stop offset="1" style={{ stopColor: 'var(--pk-2)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <circle cx="128" cy="128" r="124" fill={`url(#${id}q)`} />
      <g className="pk-lay">
        {GOC.map((g, i) => {
          const a = (g * Math.PI) / 180
          const t = i % 2 ? 0.85 : 1.15
          return (
            <g key={g} transform={`translate(${(128 + Math.cos(a) * 100).toFixed(1)} ${(128 + Math.sin(a) * 100).toFixed(1)}) scale(${t})`}>
              <path className="pk-f2" d="M0-20C9-9 11 0 0 10-11 0-9-9 0-20Z" />
              <path className="pk-f3" d="M0-9C4-4 5 1 0 6-5 1-4-4 0-9Z" />
            </g>
          )
        })}
      </g>
    </svg>
  )
}
