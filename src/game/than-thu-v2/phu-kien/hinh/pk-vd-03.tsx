// VD-03 · Vệt di chuyển (Thường) — giọt phenolphthalein hồng rơi, loang thành vòng tròn nhạt. Giọt mới ở gần thú (phải), vòng loang cũ lớn dần về trái. Tĩnh.
import type { HinhProps } from '../nap-hinh'

const VONG: [number, number, number][] = [
  [170, 70, 20],
  [112, 72, 30],
  [50, 72, 40],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      {VONG.map(([x, y, r], i) => (
        <g key={x} opacity={1 - i * 0.16}>
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.32} className="pk-f1" opacity=".3" />
          <ellipse cx={x} cy={y} rx={r} ry={r * 0.32} fill="none" className="pk-s1" strokeWidth="2.6" opacity=".95" />
          <ellipse cx={x} cy={y} rx={r * 0.55} ry={r * 0.17} fill="none" className="pk-s2" strokeWidth="1.8" opacity=".85" />
        </g>
      ))}
      <g transform="translate(224 34)">
        <path className="pk-f1" d="M0-15C7-6 10 0 10 5A10 10 0 0 1-10 5C-10 0-7-6 0-15Z" />
        <path className="pk-s3" d="M-4 4A4.6 4.6 0 0 0 0 9.4" fill="none" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(224 70)">
        <ellipse rx="22" ry="7" className="pk-f2" opacity=".5" />
      </g>
    </svg>
  )
}
