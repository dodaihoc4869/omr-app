// HQ-05 · Hào quang (Hiếm) — vòng ống sáng đỏ cam kiểu đèn neon, sáng dịu rất chậm. KHÔNG dùng <filter>: quầng toả vẽ bằng bốn vòng nét dày mờ dần (rẻ hơn với máy yếu).
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <g className="pk-nhap-cham" fill="none">
        <circle cx="128" cy="128" r="100" className="pk-s1" strokeWidth="34" opacity=".1" />
        <circle cx="128" cy="128" r="100" className="pk-s1" strokeWidth="22" opacity=".18" />
        <circle cx="128" cy="128" r="100" className="pk-s1" strokeWidth="13" opacity=".32" />
        <circle cx="128" cy="128" r="100" className="pk-s1" strokeWidth="7.6" />
        <circle cx="128" cy="128" r="100" className="pk-s3" strokeWidth="2" />
      </g>
      <g className="pk-f2" opacity=".85">
        <circle cx="128" cy="28" r="2.6" />
        <circle cx="228" cy="128" r="2.6" />
        <circle cx="128" cy="228" r="2.6" />
        <circle cx="28" cy="128" r="2.6" />
      </g>
    </svg>
  )
}
