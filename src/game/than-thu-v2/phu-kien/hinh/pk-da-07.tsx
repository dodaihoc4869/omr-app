// DA-07 · Trên đầu (Sử thi) — vương miện tinh thể thạch anh trong suốt năm mũi, lõi phát sáng lam (nhịp thở 4 giây — MỘT chuyển động). Không <filter>: quầng bằng hai vòng mờ dần.
import type { HinhProps } from '../nap-hinh'

const MUI: [number, number][] = [[14, 46], [30, 26], [50, 12], [70, 26], [86, 46]]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <g className="pk-tho">
        <ellipse cx="50" cy="44" rx="42" ry="30" className="pk-f2" opacity=".1" />
        <ellipse cx="50" cy="44" rx="32" ry="22" className="pk-f2" opacity=".16" />
      </g>
      {MUI.map(([x, y]) => (
        <g key={x}>
          <path d={`M${x - 9} 72L${x} ${y}L${x + 9} 72Z`} className="pk-f1" opacity=".72" />
          <path d={`M${x} ${y}L${x + 9} 72L${x + 1} 72Z`} className="pk-f3" opacity=".55" />
          <path d={`M${x - 9} 72L${x} ${y}L${x + 9} 72Z`} fill="none" className="pk-s3" strokeWidth="1.6" strokeLinejoin="round" />
        </g>
      ))}
      <path d="M14 72H86" className="pk-s3" strokeWidth="5" strokeLinecap="round" />
      <circle cx="50" cy="52" r="6" className="pk-f2" />
      <circle cx="50" cy="52" r="2.6" className="pk-f3" />
    </svg>
  )
}
