// DA-06 · Trên đầu (Hiếm) — cặp sừng tinh thể bismuth: bậc thang vuông nghiêng ra ngoài, mỗi bậc một sắc cầu vồng (mạ ánh kim). Ánh lướt chậm bằng độ sáng (MỘT chuyển động).
import type { HinhProps } from '../nap-hinh'

const MAU = ['pk-f1', 'pk-f2', 'pk-f3', 'pk-f4']
/** Một sừng: 4 bậc vuông thu nhỏ dần đi lên và nghiêng ra ngoài (`ra` = +4 sừng phải, −4 sừng trái). */
const Sung = ({ x, ra }: { x: number; ra: 4 | -4 }) => (
  <g transform={`translate(${x} 72)`}>
    {MAU.map((m, i) => (
      <g key={m}>
        <rect x={-12 + i * 3 + ra * i} y={-14 - i * 14} width={24 - i * 6} height="14.5" rx="1.6" className={m} />
        <path d={`M${-12 + i * 3 + ra * i} ${-14 - i * 14}h${24 - i * 6}`} fill="none" className="pk-st" strokeWidth="1.4" opacity=".75" />
      </g>
    ))}
  </g>
)
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g className="pk-nhap-cham">
        <Sung x={30} ra={-4} />
        <Sung x={70} ra={4} />
      </g>
    </svg>
  )
}
