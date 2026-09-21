// CL-01 · Trên lưng (Thường) — khăn quàng trắng gấp nếp, mép loang nhiều màu (kiểu sắc ký trên giấy lọc). Hình quay MẶT PHẢI; cổ ở (50,50), cổ rộng 45; đuôi khăn rủ về phía lưng (trái). Tĩnh.
import type { HinhProps } from '../nap-hinh'

const LOANG: [number, number, number, string][] = [
  [30, 89, 4.4, 'pk-f2'], [37, 91, 3.6, 'pk-f3'], [44, 87, 3.2, 'pk-f4'], [25, 84, 2.6, 'pk-f3'],
  [30, 66, 3.2, 'pk-f3'], [46, 68, 3, 'pk-f2'], [64, 69, 3.4, 'pk-f4'],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M26 58L20 92 44 86 50 62Z" className="pk-f1" />
      <path d="M26 58L20 92 44 86 50 62Z" fill="none" className="pk-s2" strokeWidth="1.4" strokeLinejoin="round" opacity=".8" />
      <path d="M32 64L28 88M39 62L37 84" fill="none" className="pk-s2" strokeWidth="1.2" opacity=".55" />
      <path d="M22 46C36 60 64 60 78 44L84 56C68 72 34 72 18 58Z" className="pk-f1" />
      <path d="M22 46C36 60 64 60 78 44L84 56C68 72 34 72 18 58Z" fill="none" className="pk-s2" strokeWidth="1.4" strokeLinejoin="round" opacity=".8" />
      <path d="M30 56C42 64 58 64 72 54" fill="none" className="pk-s2" strokeWidth="1.2" opacity=".5" />
      {LOANG.map(([x, y, r, c]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r={r} className={c} opacity=".85" />
      ))}
    </svg>
  )
}
