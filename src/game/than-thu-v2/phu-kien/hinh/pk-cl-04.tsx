// CL-04 · Trên lưng (Đẹp) — khăn choàng trắng sáng, mép là lưỡi lửa trắng xanh (magnesium cháy). Cổ ở (50,50). MỘT chuyển động: lưỡi lửa nhấp nháy.
import type { HinhProps } from '../nap-hinh'

const LUA = ['M24 70C20 62 26 58 24 50C32 56 34 64 30 72Z', 'M34 76C30 68 36 62 34 54C42 60 44 70 40 78Z', 'M46 76C44 68 50 64 48 56C55 62 56 70 52 77Z', 'M58 72C56 64 62 60 60 52C67 58 68 66 64 73Z', 'M22 96C18 88 24 84 22 76C30 82 32 90 28 98Z']
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <path d="M24 58L18 88 42 82 48 62Z" className="pk-f1" />
      <path d="M22 46C36 60 64 60 78 44L84 56C68 72 34 72 18 58Z" className="pk-f1" />
      <path d="M22 46C36 60 64 60 78 44L84 56C68 72 34 72 18 58Z" fill="none" className="pk-s3" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M30 56C42 64 58 64 72 54" fill="none" className="pk-s3" strokeWidth="1.2" opacity=".6" />
      <g className="pk-nhap">
        {LUA.map((d) => (
          <g key={d}>
            <path d={d} className="pk-f2" opacity=".85" />
            <path d={d} fill="none" className="pk-s3" strokeWidth="1.2" opacity=".9" />
          </g>
        ))}
      </g>
    </svg>
  )
}
