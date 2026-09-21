// HQ-02 · Hào quang (Thường) — đĩa tròn dưới chân, nửa đỏ nửa xanh, ranh giới loang mềm (giấy quỳ). Tĩnh.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}q`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: 'var(--pk-1)' }} />
          <stop offset=".4" style={{ stopColor: 'var(--pk-1)' }} />
          <stop offset=".6" style={{ stopColor: 'var(--pk-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--pk-2)' }} />
        </linearGradient>
        <radialGradient id={`${id}s`} cx=".5" cy=".38" r=".7">
          <stop offset="0" style={{ stopColor: 'var(--pk-3)', stopOpacity: 0.55 }} />
          <stop offset="1" style={{ stopColor: 'var(--pk-3)', stopOpacity: 0 }} />
        </radialGradient>
      </defs>
      <ellipse cx="128" cy="210" rx="100" ry="27" fill={`url(#${id}q)`} opacity=".95" />
      <ellipse cx="128" cy="210" rx="100" ry="27" fill={`url(#${id}s)`} />
      <ellipse cx="128" cy="210" rx="100" ry="27" fill="none" className="pk-s3" strokeWidth="2" opacity=".55" />
      <ellipse cx="128" cy="205" rx="86" ry="21" fill="none" className="pk-s3" strokeWidth="1.2" opacity=".3" />
    </svg>
  )
}
