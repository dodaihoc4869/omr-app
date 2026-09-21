// CL-03 · Trên lưng (Đẹp) — áo trắng phòng thí nghiệm dáng ngắn choàng lên lưng thú: cổ áo ve nhọn ở phía trước (phải), túi ngực cài ống nhỏ giọt. Lưng ở (50,50), thân dài 80; áo chỉ phủ ~55% thân để thấy thú. Tĩnh.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g transform="translate(50 50) scale(.62) translate(-50 -40)">
      <path d="M20 54C22 44 36 40 52 40S76 44 80 52L84 84C60 92 36 92 16 84Z" className="pk-f1" />
      <path d="M20 54C22 44 36 40 52 40S76 44 80 52L84 84C60 92 36 92 16 84Z" fill="none" className="pk-s2" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M66 41L82 50 70 62Z" className="pk-f1" />
      <path d="M66 41L82 50 70 62Z" fill="none" className="pk-s2" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M52 40L70 62" fill="none" className="pk-s2" strokeWidth="1.4" />
      <path d="M22 84C36 88 60 88 80 84" fill="none" className="pk-s2" strokeWidth="1.2" opacity=".5" />
      <rect x="44" y="64" width="17" height="15" rx="2" fill="none" className="pk-s2" strokeWidth="1.6" />
      <path d="M56 66V54" fill="none" className="pk-s3" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="56" cy="52" r="3.2" className="pk-f3" />
      <path d="M36 50v28" fill="none" className="pk-s2" strokeWidth="1" opacity=".4" />
      </g>
    </svg>
  )
}
