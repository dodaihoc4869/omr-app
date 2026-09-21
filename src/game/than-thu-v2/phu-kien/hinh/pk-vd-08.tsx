// VD-08 · Vệt di chuyển (Huyền thoại) — tia sét lam – vàng kim dọc đường đi, kí hiệu electron (vòng tròn + gạch âm) mờ dần. KHÔNG chữ, KHÔNG <filter>. MỘT chuyển động: nhấp nháy.
import type { HinhProps } from '../nap-hinh'

const TIA = 'M240 60 206 46 216 64 172 48 184 66 138 50 148 68 100 52 110 70 64 56 72 72 22 62'
const E: [number, number, number][] = [
  [200, 30, 1],
  [140, 30, 0.7],
  [82, 34, 0.45],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 96" aria-hidden="true" focusable="false">
      <g className="pk-nhap">
        <path d={TIA} fill="none" className="pk-s1" strokeWidth="12" opacity=".14" strokeLinejoin="round" strokeLinecap="round" />
        <path d={TIA} fill="none" className="pk-s1" strokeWidth="6" opacity=".4" strokeLinejoin="round" strokeLinecap="round" />
        <path d={TIA} fill="none" className="pk-s1" strokeWidth="3.4" strokeLinejoin="round" strokeLinecap="round" />
        <path d={TIA} fill="none" className="pk-s3" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
        {E.map(([x, y, t]) => (
          <g key={x} transform={`translate(${x} ${y}) scale(${t})`} opacity={0.35 + t * 0.65}>
            <circle r="11" fill="none" className="pk-s2" strokeWidth="2.2" />
            <path d="M-5 0H5" className="pk-s2" strokeWidth="2.6" strokeLinecap="round" />
          </g>
        ))}
      </g>
    </svg>
  )
}
