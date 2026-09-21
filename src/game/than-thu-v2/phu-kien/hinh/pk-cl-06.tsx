// CL-06 · Trên lưng (Hiếm) — hai bình khí nhỏ đeo lưng (dây đai chéo) và MỘT quả bóng bay bay lên, buộc bằng sợi chỉ (khí helium nhẹ hơn không khí). Lưng ở (50,50). MỘT chuyển động: bóng đung đưa quanh điểm buộc.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g className="pk-lay" style={{ transformOrigin: '42px 46px' }}>
        <path d="M42 46C46 36 34 30 38 22" fill="none" className="pk-s2" strokeWidth="1.2" />
        <ellipse cx="38" cy="12" rx="10.5" ry="12.5" className="pk-f3" />
        <path d="M38 24.5l-2.4 3.8h4.8Z" className="pk-f3" />
        <ellipse cx="33.5" cy="7.5" rx="2.6" ry="4" className="pk-ft" opacity=".55" transform="rotate(20 33.5 7.5)" />
      </g>
      <rect x="33" y="46" width="13" height="32" rx="5.5" className="pk-f1" />
      <rect x="48" y="46" width="13" height="32" rx="5.5" className="pk-f2" />
      <path d="M36 50v24M51 50v24" fill="none" className="pk-st" strokeWidth="1.6" opacity=".4" strokeLinecap="round" />
      <path d="M36 46h7M51 46h7" className="pk-s3" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 58C42 62 58 62 68 56" fill="none" className="pk-s3" strokeWidth="3.2" strokeLinecap="round" />
      <path d="M32 70C44 74 58 74 66 70" fill="none" className="pk-s3" strokeWidth="2.4" strokeLinecap="round" opacity=".9" />
    </svg>
  )
}
