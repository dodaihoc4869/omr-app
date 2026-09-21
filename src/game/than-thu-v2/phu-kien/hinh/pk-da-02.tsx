// DA-02 · Trên đầu (Thường) — phễu thuỷ tinh úp ngược làm mũ chóp, giấy lọc trắng thò ra ở đỉnh. Tĩnh.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M40 30L60 30 82 72 18 72Z" className="pk-f1" opacity=".5" />
      <path d="M40 30L60 30 82 72 18 72Z" fill="none" className="pk-s2" strokeWidth="3.4" strokeLinejoin="round" />
      <path d="M44 30v-9h12v9" className="pk-f1" opacity=".7" />
      <path d="M30 60L45 34" fill="none" className="pk-s3" strokeWidth="3" strokeLinecap="round" opacity=".9" />
      <path d="M50 28L36 8 50 14 64 6Z" className="pk-f3" />
      <path d="M50 28L50 14M50 28L36 8M50 28L64 6" fill="none" className="pk-s2" strokeWidth="1.2" opacity=".7" />
    </svg>
  )
}
