// CL-07 · Trên lưng (Sử thi, vẽ SAU thú) — cánh lưới lục giác mỏng đen ánh lam (graphene: một lớp carbon dày một nguyên tử), mép phát sáng. MỘT chuyển động: nhịp thở 4 giây của quầng mép. Không <filter>: quầng bằng nét dày mờ dần.
import type { HinhProps } from '../nap-hinh'

const CANH = 'M54 56C44 36 30 16 6 4C0 18 -2 32 4 42C9 38 15 38 19 42C19 50 24 54 31 56C38 56 44 60 50 63Z'
const R = 6
const hex = (cx: number, cy: number) => `M${[0, 1, 2, 3, 4, 5].map((k) => `${(cx + R * Math.cos((k * Math.PI) / 3)).toFixed(1)} ${(cy + R * Math.sin((k * Math.PI) / 3)).toFixed(1)}`).join('L')}Z`
const LUOI = Array.from({ length: 6 }, (_, c) => Array.from({ length: 7 }, (_, r) => hex(4 + c * 1.5 * R, 2 + r * 1.732 * R + (c % 2) * 0.866 * R))).flat()
export default function Hinh({ id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}c`}>
          <path d={CANH} />
        </clipPath>
      </defs>
      <g className="pk-tho" fill="none" strokeLinejoin="round">
        <path d={CANH} className="pk-s3" strokeWidth="9" opacity=".12" />
        <path d={CANH} className="pk-s3" strokeWidth="5" opacity=".25" />
      </g>
      <path d={CANH} className="pk-f1" />
      <path d={LUOI.join('')} clipPath={`url(#${id}c)`} fill="none" className="pk-s2" strokeWidth="1" opacity=".75" />
      <path d={CANH} fill="none" className="pk-s3" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}
