// HUY HIỆU 12 BẬC — vẽ riêng bằng SVG nội tuyến, thay emoji ở MỌI chỗ hiện bậc (thầy 13/10). Mịn từ 16 tới 190 px, giống nhau trên mọi máy.
// BẢN «KHỐI ĐẬM» (thầy 26/10: "thiết kế lại luôn logo 12 cấp … siêu đẹp với giao diện mới" · "thay đổi luôn 12 hình cho đẹp hơn sáng sủa hơn" ·
// "đẹp và đơn giản hơn nữa"): kiểu tem dán — MỖI BẬC MỘT HÌNH KHỐI TO, 2–3 màu phẳng sáng, viền mực dày 3, không nét phụ; BÓNG ĐỔ CỨNG lệch 3
// xuống phải (cùng hình khung, tô mực) + một vệt sáng ngắn góc trên trái (cỡ ≥ 28 px).
// KHUNG tăng dần theo nhóm để thấy "lên hạng": Lười 1–5 ô vuông bo góc · Chưa đều 6–7 lục giác · Chăm 8–9 tròn · 10–12 TEM LƯỢN 12 múi (lớp
// `.hh-tia`) ôm đĩa tròn; 12 đĩa mực + lấp lánh. Bậc 10–12 có bóng sáng lướt (chỉ transform/opacity, tắt khi giảm chuyển động / máy yếu).
// HÌNH: 1 mặt con lười ngủ · 2 giường (gối, chăn) · 3 trăng khuyết + Z · 4 ốc sên · 5 rùa · 6 mặt gấu trúc · 7 cân hai đĩa · 8 cặp sách ·
// 9 chồng sách · 10 ngọn lửa · 11 tia sét · 12 vương miện.
// MÀU: CHỈ lớp CSS (bac-cham-chi.css) — mặt huy hiệu đọc --bac của `.bcc[data-bac]`, hình dùng 6 màu tô (--hh-trang/kem/vang/lam/hong/luc) dựng từ
// biến chuẩn; không màu thô. id clipPath riêng mỗi huy hiệu (useId). Chỉ để nhìn: aria-hidden — chữ "Bậc N/12 · Tên" luôn đi kèm ở nơi dùng.
import { useId, type ReactNode } from 'react'

/** Hình trong từng bậc — vẽ trong nhóm `.hh-net` (nét mực 3, tròn đầu); `.hh-x` = không viền. */
const HINH: readonly ReactNode[] = [
  // 1 · mặt con lười ngủ
  <>
    <circle className="hh-be" cx="32" cy="33" r="19" />
    <ellipse className="hh-trang hh-x" cx="32" cy="35.5" rx="13" ry="10.5" />
    <ellipse className="hh-muc hh-x" cx="25.6" cy="33.6" rx="5.6" ry="3.2" transform="rotate(-18 25.6 33.6)" />
    <ellipse className="hh-muc hh-x" cx="38.4" cy="33.6" rx="5.6" ry="3.2" transform="rotate(18 38.4 33.6)" />
    <path className="hh-mi" d="M23.6 33.4q2.2 1.6 4.4 0M36 33.4q2.2 1.6 4.4 0" />
    <ellipse className="hh-muc hh-x" cx="32" cy="38.6" rx="2.4" ry="1.7" />
    <path className="hh-m" d="M29 42.4q3 2.2 6 0" />
  </>,
  // 2 · giường: đầu giường, đệm, đầu gối gối, chăn
  <>
    <rect className="hh-vang" x="11" y="20" width="8" height="27" rx="4" />
    <rect className="hh-trang" x="14" y="38.5" width="39" height="8.5" rx="4.25" />
    <circle className="hh-be" cx="25" cy="32" r="5.6" />
    <path className="hh-lam" d="M29 39V35Q29 30 34 30H48Q53 30 53 35V39Z" />
  </>,
  // 3 · trăng khuyết + chữ Z
  <>
    <path className="hh-vang" d="M26.4 20.6A15.5 15.5 0 1 0 44 39.4A13 13 0 0 1 26.4 20.6Z" />
    <path className="hh-o1" d="M37.5 14h9.5l-9.5 10.5h9.5" />
    <path className="hh-o2" d="M37.5 14h9.5l-9.5 10.5h9.5" />
  </>,
  // 4 · ốc sên: thân + râu + vỏ tròn có vòng xoắn
  <>
    <path className="hh-be" d="M13 46.5V35Q13 29.5 18 29.5T23 35V40H46Q52.5 40 53 46.5Z" />
    <path d="M16 30L14.2 23.5M20 30L21.8 23.5" />
    <circle className="hh-muc" cx="14" cy="22.6" r="2" />
    <circle className="hh-muc" cx="22" cy="22.6" r="2" />
    <circle className="hh-lam" cx="37.5" cy="30.5" r="11.5" />
    <path className="hh-xoan" d="M37.5 30.5m-4.6 0a4.6 4.6 0 1 1 4.6 4.6" />
  </>,
  // 5 · rùa: chân, đầu, mai vòm, vành mai
  <>
    <rect className="hh-be" x="16.5" y="39" width="7.5" height="9" rx="3.75" />
    <rect className="hh-be" x="38" y="39" width="7.5" height="9" rx="3.75" />
    <circle className="hh-be" cx="50" cy="35" r="5.8" />
    <circle className="hh-muc hh-x" cx="51.6" cy="34" r="1.4" />
    <path className="hh-luc" d="M11 41.5C11 29 20 21 31 21S51 29 51 41.5Z" />
    <rect className="hh-vang" x="9" y="39.5" width="44" height="5.5" rx="2.75" />
  </>,
  // 6 · mặt gấu trúc
  <>
    <circle className="hh-muc" cx="18.5" cy="19.5" r="6" />
    <circle className="hh-muc" cx="45.5" cy="19.5" r="6" />
    <ellipse className="hh-trang" cx="32" cy="34" rx="17.5" ry="15.5" />
    <ellipse className="hh-muc hh-x" cx="25" cy="33" rx="4.4" ry="6" transform="rotate(38 25 33)" />
    <ellipse className="hh-muc hh-x" cx="39" cy="33" rx="4.4" ry="6" transform="rotate(-38 39 33)" />
    <circle className="hh-trang hh-x" cx="25.8" cy="32" r="1.8" />
    <circle className="hh-trang hh-x" cx="38.2" cy="32" r="1.8" />
    <circle className="hh-hong hh-x" cx="21" cy="40.5" r="2.6" />
    <circle className="hh-hong hh-x" cx="43" cy="40.5" r="2.6" />
    <path className="hh-muc" d="M29.8 39.4h4.4L32 42z" />
  </>,
  // 7 · cân hai đĩa
  <>
    <path className="hh-m" d="M17 23.5L12 34M17 23.5L22 34M47 23.5L42 34M47 23.5L52 34" />
    <rect className="hh-trang" x="30" y="18" width="4" height="26" rx="2" />
    <rect className="hh-vang" x="22" y="43" width="20" height="6.5" rx="3.25" />
    <rect className="hh-trang" x="12" y="19.5" width="40" height="4.5" rx="2.25" />
    <circle className="hh-vang" cx="32" cy="16" r="3.4" />
    <path className="hh-vang" d="M10 34H24Q24 41.5 17 41.5T10 34Z" />
    <path className="hh-vang" d="M40 34H54Q54 41.5 47 41.5T40 34Z" />
  </>,
  // 8 · cặp sách
  <>
    <path d="M26 18.5V16Q26 11.5 32 11.5T38 16V18.5" />
    <rect className="hh-lam" x="17.5" y="17.5" width="29" height="33" rx="9" />
    <path d="M18 28.5H46" />
    <rect className="hh-vang" x="24" y="34.5" width="16" height="11" rx="3.5" />
  </>,
  // 9 · chồng sách
  <>
    <rect className="hh-hong" x="13" y="40" width="38" height="8.5" rx="2.5" />
    <rect className="hh-lam" x="16.5" y="31.5" width="32" height="8.5" rx="2.5" />
    <rect className="hh-vang" x="14.5" y="22.5" width="32" height="8.5" rx="2.5" transform="rotate(-7 30.5 26.75)" />
  </>,
  // 10 · ngọn lửa
  <>
    <path className="hh-hong" d="M32 10.5C35 17.5 46.5 23 46.5 36.5C46.5 45.5 40 51.5 32 51.5S17.5 45.5 17.5 37C17.5 31 20.4 27 23.8 23.6C24.4 28.4 26.6 31.2 29 32.2C28.2 25 29.6 17 32 10.5Z" />
    <path className="hh-vang" d="M32 29.5C35 34.2 39.6 36.8 39.6 42.4C39.6 47 36.2 50 32 50S24.4 47 24.4 42.8C24.4 39.4 26.2 37.2 28.2 35.6C28.6 38 30 39.4 32 39.8C31 36.2 31 32.6 32 29.5Z" />
  </>,
  // 11 · tia sét
  <>
    <path className="hh-vang" d="M37 9.5L18.5 36H30.5L26.5 54.5L46 27.5H34L37 9.5Z" />
    <path className="hh-trang hh-x hh-sang" d="M33.6 15L23.6 31.2H28.6Z" />
  </>,
  // 12 · vương miện
  <>
    <path className="hh-vang" d="M15 45L12.5 24L23.5 33L32 18L40.5 33L51.5 24L49 45Z" />
    <circle className="hh-vang" cx="12.5" cy="22.5" r="3" />
    <circle className="hh-vang" cx="32" cy="16" r="3.3" />
    <circle className="hh-vang" cx="51.5" cy="22.5" r="3" />
    <circle className="hh-hong" cx="32" cy="37" r="3.2" />
  </>,
]

/** Khung theo nhóm: 1 Lười (ô vuông bo góc) · 2 Chưa đều (lục giác) · 3 Chăm (tròn; 10–12 tem lượn). */
const khungCua = (bac: number): 1 | 2 | 3 => (bac <= 5 ? 1 : bac <= 7 ? 2 : 3)

const LUC_GIAC =
  'M26.8 5.5Q32 2.5 37.2 5.5L52.35 14.25Q57.55 17.25 57.55 23.25L57.55 40.75Q57.55 46.75 52.35 49.75L37.2 58.5Q32 61.5 26.8 58.5L11.65 49.75Q6.45 46.75 6.45 40.75L6.45 23.25Q6.45 17.25 11.65 14.25Z'
/** Tem lượn 12 múi — khung bậc 10–12. */
const TEM =
  'M25.5 7.9Q32 1.8 38.5 7.9Q47.1 5.8 49.7 14.3Q58.2 16.9 56.1 25.5Q62.2 32 56.1 38.5Q58.2 47.1 49.7 49.7Q47.1 58.2 38.5 56.1Q32 62.2 25.5 56.1Q16.9 58.2 14.3 49.7Q5.8 47.1 7.9 38.5Q1.8 32 7.9 25.5Q5.8 16.9 14.3 14.3Q16.9 5.8 25.5 7.9Z'
const LAP_LANH = 'M53 3.5Q54 9 59.5 10Q54 11 53 16.5Q52 11 46.5 10Q52 9 53 3.5Z'

/** Vệt sáng ngắn góc trên trái (theo khung) — kiểu tem in, không gradient. */
const VET_SANG: Record<1 | 2 | 3, string> = {
  1: 'M11 23V19Q11 11 19 11H24',
  2: 'M14 25V23.2Q14 20.6 16.3 19.3L21.6 16.2',
  3: 'M12.6 25.4A21 21 0 0 1 25.4 12.6',
}

/** Cỡ (px) từ đó huy hiệu bậc 10–12 mới có hiệu ứng (chip nhỏ dòng em, dải ô chật: đứng yên — đỡ việc cho máy). */
const CO_DONG = 24
/** Cỡ (px) từ đó mới vẽ vệt sáng (dưới cỡ này vệt sáng chỉ làm nhoè). */
const CO_SANG = 28

/** Hình khung (dùng 2 lần: bóng đổ cứng + mặt). */
function Khung({ k, tem, className, transform }: { k: 1 | 2 | 3; tem: boolean; className: string; transform?: string }) {
  if (k === 1) return <rect className={className} x="4.5" y="4.5" width="55" height="55" rx="16" transform={transform} />
  if (k === 2) return <path className={className} d={LUC_GIAC} transform={transform} />
  return tem ? <path className={className} d={TEM} transform={transform} /> : <circle className={className} cx="32" cy="32" r="28" transform={transform} />
}

export default function HuyHieuBac({ bac, co = 24, className }: { bac: number; co?: number; className?: string }) {
  const id = 'hh' + useId().replace(/[^\w-]/g, '')
  if (!Number.isInteger(bac) || bac < 1 || bac > HINH.length) return null
  const k = khungCua(bac)
  const tem = bac >= 10
  return (
    <svg
      className={`bcc bcc-hh${className ? ` ${className}` : ''}`}
      data-bac={bac}
      data-khung={k}
      data-dong={tem && co >= CO_DONG ? '' : undefined}
      width={co}
      height={co}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      {tem && (
        <defs>
          <clipPath id={`${id}c`}>
            <circle cx="32" cy="32" r="21.5" />
          </clipPath>
        </defs>
      )}
      <Khung k={k} tem={tem} className="hh-bong-cung" transform="translate(1.5 1.5)" />
      <g transform="translate(-1.5 -1.5)">
        <Khung k={k} tem={tem} className={tem ? 'hh-khung hh-tia hh-vien' : 'hh-khung hh-vien'} />
        {tem && <circle className="hh-dia hh-vien" cx="32" cy="32" r="21.5" />}
        {co >= CO_SANG && !tem && <path className="hh-vet" d={VET_SANG[k]} />}
        <g className="hh-net" transform={tem ? 'translate(32 32) scale(0.86) translate(-32 -32)' : undefined}>
          {HINH[bac - 1]}
        </g>
        {tem && (
          <g clipPath={`url(#${id}c)`}>
            <g transform="rotate(24 32 32)">
              <rect className="hh-luot" x="-16" y="-12" width="9" height="88" />
            </g>
          </g>
        )}
        {bac === 12 && <path className="hh-lap" d={LAP_LANH} />}
      </g>
    </svg>
  )
}
