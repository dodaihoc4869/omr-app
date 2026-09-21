// DA-04 · Trên đầu (Đẹp) — bình cầu đáy tròn đội lệch, dung dịch xanh lam bên trong sủi bọt (bọt nhấp nháy chậm). MỘT chuyển động: bọt.
import type { HinhProps } from '../nap-hinh'

export default function Hinh({ id }: HinhProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}b`}>
          <circle cx="50" cy="46" r="22" />
        </clipPath>
      </defs>
      <g transform="rotate(12 50 68)">
        <path d="M43 26V10h14v16" className="pk-f1" opacity=".5" />
        <path d="M40 10h20" className="pk-s1" strokeWidth="4" strokeLinecap="round" />
        <circle cx="50" cy="46" r="22" className="pk-f1" opacity=".38" />
        <rect x="26" y="46" width="48" height="26" className="pk-f2" clipPath={`url(#${id}b)`} opacity=".95" />
        <circle cx="50" cy="46" r="22" fill="none" className="pk-s1" strokeWidth="3.4" />
        <path d="M36 36C38 30 43 27 47 27" fill="none" className="pk-s3" strokeWidth="3" strokeLinecap="round" />
        <g className="pk-nhap" clipPath={`url(#${id}b)`}>
          <circle cx="44" cy="58" r="3.4" className="pk-f3" opacity=".9" />
          <circle cx="56" cy="52" r="2.6" className="pk-f3" opacity=".9" />
          <circle cx="51" cy="44" r="2" className="pk-f3" opacity=".8" />
        </g>
      </g>
    </svg>
  )
}
