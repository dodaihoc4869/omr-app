// DA-08 · Trên đầu (Huyền thoại) — vương miện bạch kim trắng bạc bảy chóp, đính kim cương giữa, toả tia (ánh nhấp nháy chậm 5 giây — MỘT chuyển động). Không <filter>.
import type { HinhProps } from '../nap-hinh'

const CHOP: [number, number][] = [[12, 46], [24, 32], [37, 20], [50, 12], [63, 20], [76, 32], [88, 46]]
const TIA = [[50, 6, 50, -8], [37, 14, 30, 2], [63, 14, 70, 2], [24, 26, 14, 16], [76, 26, 86, 16]]
/** Đường viền vương miện: đáy y 72, các chóp nhọn, hõm xuống y 60 giữa hai chóp. */
const VIEN = `M12 72L12 46${CHOP.slice(1).map(([x, y], i) => `L${(CHOP[i]![0] + x) / 2} 60L${x} ${y}`).join('')}L88 72Z`
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g className="pk-nhap-cham" fill="none" strokeLinecap="round">
        {TIA.map(([x1, y1, x2, y2]) => (
          <path key={x1} d={`M${x1} ${y1}L${x2} ${y2}`} className="pk-s3" strokeWidth="2" />
        ))}
      </g>
      <path d={VIEN} className="pk-f1" />
      <path d={VIEN} fill="none" className="pk-s2" strokeWidth="1.8" strokeLinejoin="round" />
      {CHOP.map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3.2" className="pk-f3" />
      ))}
      <rect x="12" y="63" width="76" height="10" rx="3" className="pk-f2" />
      <path d="M50 61L58 69 50 77 42 69Z" className="pk-f3" />
      <path d="M50 61L58 69 50 77 42 69Z" fill="none" className="pk-s2" strokeWidth="1.6" />
      <path d="M42 69H58M50 61V77" fill="none" className="pk-s1" strokeWidth="1" opacity=".7" />
    </svg>
  )
}
