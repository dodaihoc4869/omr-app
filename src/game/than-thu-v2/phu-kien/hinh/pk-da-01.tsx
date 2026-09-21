// DA-01 · Trên đầu (Thường) — kính bảo hộ trong suốt viền xanh, đẩy lên trán (chừa mặt và mắt). Hình quay MẶT PHẢI; đỉnh đầu ở (50,70), đầu rộng 80. Tĩnh.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M14 68C20 58 30 54 40 54" fill="none" className="pk-s2" strokeWidth="6" strokeLinecap="round" />
      <rect x="22" y="50" width="56" height="22" rx="10" className="pk-f3" opacity=".42" />
      <rect x="22" y="50" width="56" height="22" rx="10" fill="none" className="pk-s1" strokeWidth="5" />
      <path d="M50 52v18" className="pk-s1" strokeWidth="4" />
      <path d="M29 60C31 56 35 55 39 55M56 60C58 56 62 55 66 55" fill="none" className="pk-s3" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="67" r="1.8" className="pk-f2" />
      <circle cx="70" cy="67" r="1.8" className="pk-f2" />
    </svg>
  )
}
