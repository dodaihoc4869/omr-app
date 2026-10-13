// HUY HIỆU 12 BẬC — vẽ riêng bằng SVG nội tuyến, thay emoji ở MỌI chỗ hiện bậc (thầy 13/10: "thiết kế lại biểu tượng từng bậc cho phù hợp nổi bật siêu
// đẹp, mịn để học sinh phải wow"). Mịn từ 16 tới 96 px, giống nhau trên mọi máy (không phụ thuộc phông emoji của máy).
// PHONG CÁCH CHUNG (đồng bộ với biểu tượng Tự sửa lỗi của làn N): viewBox 64 · mảng màu phẳng gradient dịu sáng trên đậm dưới · một vệt bóng mờ nửa
// trên · nét viền tròn đầu dày 2,5 · không bóng đổ gắt · góc bo mềm.
// KHUNG tăng dần theo nhóm để thấy "lên hạng": Lười 1–5 khiên tròn đơn màu trầm · Chưa đều 6–7 lục giác có vành · Chăm 8–12 tròn viền kép; 10–12 thêm
// tia sáng, 11 thêm sao, 12 thêm nhành nguyệt quế + ánh kim lấp lánh. Bậc 10–12 có bóng sáng lướt (chỉ transform/opacity, tắt khi giảm chuyển động
// hoặc máy yếu — bac-cham-chi.css). HÌNH TRONG mỗi bậc: 1 con lười treo cành · 2 giường gối chăn · 3 trăng khuyết + Z · 4 ốc sên · 5 rùa · 6 mặt gấu
// trúc · 7 cân hai đĩa · 8 người đang bước · 9 chồng sách · 10 ngọn lửa · 11 tia sét · 12 vương miện.
// MÀU: CHỈ lớp CSS (bac-cham-chi.css) đọc --bac của `.bcc[data-bac]` + biến chuẩn — không màu thô. Mỗi huy hiệu một bộ id gradient riêng (useId) vì
// màu gradient lấy theo bậc của chính nó. Chỉ để nhìn: aria-hidden — chữ "Bậc N/12 · Tên" luôn đi kèm ở nơi dùng.
import { useId, type ReactNode } from 'react'

/** Đường kẻ đôi: nét mực dày bên dưới + nét kem bên trên ⇒ nét có viền (cành cây, tay chân, chữ Z). */
const Doi = ({ d }: { d: string }) => (
  <>
    <path className="hh-o1" d={d} />
    <path className="hh-o2" d={d} />
  </>
)

/** Hình trong từng bậc — vẽ trong nhóm `.hh-net` (nét mực 2,5, tròn đầu). */
const HINH: readonly ReactNode[] = [
  // 1 · con lười treo cành
  <>
    <Doi d="M11 21Q32 15 53 21" />
    <path className="hh-la" d="M45 18.6q3.6-7 10.4-5.6q-1.6 6.6-10.4 5.6z" />
    <Doi d="M24.5 18.5Q20.5 27 25.5 33.5M39.5 18.5Q43.5 27 38.5 33.5" />
    <circle className="hh-n" cx="32" cy="39" r="12" />
    <ellipse className="hh-k hh-x" cx="32" cy="40.2" rx="8.4" ry="6.8" />
    <ellipse className="hh-d hh-x" cx="27.4" cy="39.4" rx="4" ry="2.2" transform="rotate(-24 27.4 39.4)" />
    <ellipse className="hh-d hh-x" cx="36.6" cy="39.4" rx="4" ry="2.2" transform="rotate(24 36.6 39.4)" />
    <path className="hh-m hh-mat" d="M26.4 38.9q1.3 1 2.6 0M35 38.9q1.3 1 2.6 0" />
    <ellipse className="hh-d hh-x" cx="32" cy="42.4" rx="1.7" ry="1.2" />
    <path className="hh-m" d="M29.6 45.2q2.4 1.8 4.8 0" />
  </>,
  // 2 · giường có gối + chăn
  <>
    <rect className="hh-n" x="11" y="20" width="7.5" height="29" rx="3.5" />
    <rect className="hh-n" x="46.5" y="31" width="7" height="18" rx="3.5" />
    <rect className="hh-k" x="14" y="38" width="36" height="7.5" rx="3" />
    <rect className="hh-k" x="17.5" y="30.5" width="12" height="8" rx="4" />
    <circle className="hh-k" cx="24.5" cy="28.5" r="5.2" />
    <path className="hh-m" d="M22 28.6q1.6 1.3 3.2 0" />
    <path className="hh-v" d="M28 39.5C28 33 31 30.5 36 30.5H44C47.5 30.5 49.5 32.5 49.5 36V39.5Z" />
    <path className="hh-m" d="M35.5 31v8.5M42.5 31v8.5" />
  </>,
  // 3 · trăng khuyết + chữ Z
  <>
    <path className="hh-v" d="M27.44 21.08A15 15 0 1 0 43.61 39.41A12.5 12.5 0 0 1 27.44 21.08Z" />
    <path className="hh-m" d="M19.5 36.5q2.6 2.2 5.2 0" />
    <circle className="hh-n hh-x" cx="24" cy="44.5" r="2" />
    <Doi d="M35.5 11.5h10l-10 11h10" />
    <Doi d="M48.5 26h6l-6 7h6" />
  </>,
  // 4 · ốc sên
  <>
    <path className="hh-n" d="M51 48.5H20C15.4 48.5 13 45.6 13.6 41.4L15.2 33.4C15.7 30.6 17.6 29.4 19.7 29.8C22.3 30.3 23.4 32.4 23.4 35.4V41H46.5C50.6 41 53.6 44.6 51 48.5Z" />
    <path d="M17.4 30.6L14.4 22.4M21.6 30.4L22.6 21.6" />
    <circle className="hh-k" cx="14" cy="21.4" r="2.6" />
    <circle className="hh-k" cx="22.8" cy="20.6" r="2.6" />
    <circle className="hh-v" cx="36" cy="32" r="11.5" />
    <path className="hh-m" d="M36.6 32.4a2 2 0 1 0-2.6-2.4a4.6 4.6 0 1 0 7.2-1.2a7.6 7.6 0 1 0-11.6 9.6" />
  </>,
  // 5 · rùa
  <>
    <rect className="hh-n" x="17" y="38" width="7.5" height="10" rx="3.75" />
    <rect className="hh-n" x="38" y="38" width="7.5" height="10" rx="3.75" />
    <path className="hh-n" d="M12.5 41.5L8 44.5l6 1z" />
    <path className="hh-n" d="M44 36.5C46 30.5 52 28.5 55.4 31.6C58 34 56.6 39 52.4 39.6L45 40.5Z" />
    <circle className="hh-d hh-x" cx="52.6" cy="33.8" r="1.6" />
    <path className="hh-v" d="M12 41.5C12 28.5 20.5 20.5 31 20.5S50 28.5 50 41.5Z" />
    <path className="hh-m" d="M26.5 27h9l3 7l-3 7.5h-9l-3-7.5zM23.5 34h-10M38.5 34h10M31 20.5V27" />
    <rect className="hh-k" x="10" y="40" width="42" height="5" rx="2.5" />
  </>,
  // 6 · mặt gấu trúc
  <>
    <circle className="hh-d" cx="19.5" cy="20" r="6.4" />
    <circle className="hh-d" cx="44.5" cy="20" r="6.4" />
    <ellipse className="hh-k" cx="32" cy="35.5" rx="17.5" ry="15.5" />
    <ellipse className="hh-d hh-x" cx="25" cy="34.5" rx="4.6" ry="6.4" transform="rotate(38 25 34.5)" />
    <ellipse className="hh-d hh-x" cx="39" cy="34.5" rx="4.6" ry="6.4" transform="rotate(-38 39 34.5)" />
    <circle className="hh-k hh-x" cx="25.8" cy="33.6" r="2" />
    <circle className="hh-k hh-x" cx="38.2" cy="33.6" r="2" />
    <path className="hh-d" d="M29.6 41.4h4.8L32 44z" />
    <path className="hh-m" d="M29 46.6q1.5 1.4 3 0q1.5 1.4 3 0" />
  </>,
  // 7 · cân hai đĩa
  <>
    <path className="hh-n" d="M22.5 50.5Q22.5 45 27 45H37Q41.5 45 41.5 50.5Z" />
    <rect className="hh-k" x="30" y="17" width="4" height="29" rx="2" />
    <path className="hh-m" d="M18 23.5L12.5 36M18 23.5L23.5 36M46 23.5L40.5 36M46 23.5L51.5 36" />
    <rect className="hh-k" x="13" y="19.5" width="38" height="4.5" rx="2.25" />
    <circle className="hh-v" cx="32" cy="15.6" r="3.6" />
    <path className="hh-v" d="M11 36H25C25 41 22 43.5 18 43.5S11 41 11 36Z" />
    <path className="hh-v" d="M39 36H53C53 41 50 43.5 46 43.5S39 41 39 36Z" />
  </>,
  // 8 · người đang bước (đeo cặp sách)
  <>
    <path className="hh-m" d="M10.5 27h6M9.5 33.5h6" />
    <Doi d="M32.6 25.4L27 30.6L24.6 36.6" />
    <rect className="hh-v" x="21.5" y="21" width="8.5" height="12.5" rx="3.5" transform="rotate(14 25.75 27.25)" />
    <Doi d="M30.4 35.6L26.2 42.6L20.4 46.8" />
    <path className="hh-o1 hh-than" d="M33.8 22.8L30.4 35.6" />
    <path className="hh-o2 hh-than" d="M33.8 22.8L30.4 35.6" />
    <Doi d="M30.4 35.6L35.8 42L37 50" />
    <Doi d="M33.4 25.6L39 30.4L44 28" />
    <circle className="hh-k" cx="36.6" cy="15.4" r="5.4" />
  </>,
  // 9 · chồng sách
  <>
    <rect className="hh-v" x="14" y="39.5" width="36" height="8.5" rx="2.5" />
    <path className="hh-m" d="M21 39.5v8.5M26 39.5v8.5" />
    <rect className="hh-n" x="17.5" y="31" width="31" height="8.5" rx="2.5" />
    <path className="hh-m" d="M40 31v8.5" />
    <g transform="rotate(-8 31 27)">
      <rect className="hh-k" x="15.5" y="22.5" width="31" height="8.5" rx="2.5" />
      <path className="hh-m" d="M23 22.5v8.5M27.5 22.5v8.5" />
    </g>
  </>,
  // 10 · ngọn lửa
  <>
    <path className="hh-v" d="M32 10.5C35 17.5 46.5 23 46.5 36.5C46.5 45.5 40 51.5 32 51.5S17.5 45.5 17.5 37C17.5 31 20.4 27 23.8 23.6C24.4 28.4 26.6 31.2 29 32.2C28.2 25 29.6 17 32 10.5Z" />
    <path className="hh-lua" d="M32 29.5C35 34.2 39.6 36.8 39.6 42.4C39.6 47 36.2 50 32 50S24.4 47 24.4 42.8C24.4 39.4 26.2 37.2 28.2 35.6C28.6 38 30 39.4 32 39.8C31 36.2 31 32.6 32 29.5Z" />
  </>,
  // 11 · tia sét
  <>
    <path className="hh-v" d="M37 9.5L18.5 36H30.5L26.5 54.5L46 27.5H34L37 9.5Z" />
    <path className="hh-x hh-sang" d="M33.6 15L23.6 31.2H28.6Z" />
  </>,
  // 12 · vương miện
  <>
    <path className="hh-v" d="M15 44L12.5 23L23.5 32.5L32 17L40.5 32.5L51.5 23L49 44Z" />
    <rect className="hh-n" x="13.5" y="42" width="37" height="8" rx="3" />
    <circle className="hh-v" cx="12.5" cy="22" r="3" />
    <circle className="hh-v" cx="32" cy="15.6" r="3.3" />
    <circle className="hh-v" cx="51.5" cy="22" r="3" />
    <circle className="hh-ngoc-do" cx="32" cy="46" r="2.6" />
    <path className="hh-ngoc-xanh" d="M22 43.4l2.6 2.6-2.6 2.6-2.6-2.6zM42 43.4l2.6 2.6-2.6 2.6-2.6-2.6z" />
  </>,
]

/** Khung theo nhóm: 1 Lười (tròn đơn) · 2 Chưa đều (lục giác có vành) · 3 Chăm (tròn viền kép). */
const khungCua = (bac: number): 1 | 2 | 3 => (bac <= 5 ? 1 : bac <= 7 ? 2 : 3)

const LUC_GIAC_NGOAI =
  'M26.8 5.5Q32 2.5 37.2 5.5L52.35 14.25Q57.55 17.25 57.55 23.25L57.55 40.75Q57.55 46.75 52.35 49.75L37.2 58.5Q32 61.5 26.8 58.5L11.65 49.75Q6.45 46.75 6.45 40.75L6.45 23.25Q6.45 17.25 11.65 14.25Z'
const LUC_GIAC_TRONG =
  'M27.67 10Q32 7.5 36.33 10L48.89 17.25Q53.22 19.75 53.22 24.75L53.22 39.25Q53.22 44.25 48.89 46.75L36.33 54Q32 56.5 27.67 54L15.11 46.75Q10.78 44.25 10.78 39.25L10.78 24.75Q10.78 19.75 15.11 17.25Z'
const TIA = 'M46.8 53.9L61.3 61.3L53.9 46.8ZM10.1 46.8L2.7 61.3L17.2 53.9ZM17.2 10.1L2.7 2.7L10.1 17.2ZM53.9 17.2L61.3 2.7L46.8 10.1Z'
const SAO =
  'M32 1L33.35 4.14L36.76 4.45L34.19 6.71L34.94 10.05L32 8.3L29.06 10.05L29.81 6.71L27.24 4.45L30.65 4.14ZM16 6.9L17 9.12L19.42 9.39L17.62 11.03L18.12 13.41L16 12.2L13.88 13.41L14.38 11.03L12.58 9.39L15 9.12ZM48 6.9L49 9.12L51.42 9.39L49.62 11.03L50.12 13.41L48 12.2L45.88 13.41L46.38 11.03L44.58 9.39L47 9.12Z'
const LA =
  'M28.4 57.5Q26.7 53.1 22 53.8Q23.7 58.2 28.4 57.5ZM28.4 57.5Q24.1 55.5 21.2 59.3Q25.6 61.3 28.4 57.5ZM20.3 54.9Q20.1 50.2 15.5 49.4Q15.6 54.1 20.3 54.9ZM20.3 54.9Q16.9 51.6 12.9 54.3Q16.4 57.6 20.3 54.9ZM13.5 49.9Q14.9 45.3 10.7 43Q9.3 47.6 13.5 49.9ZM13.5 49.9Q11.3 45.6 6.7 46.9Q8.9 51.1 13.5 49.9ZM8.7 42.9Q11.5 39 8.3 35.5Q5.5 39.3 8.7 42.9ZM8.7 42.9Q8 38.2 3.3 37.8Q3.9 42.6 8.7 42.9ZM35.6 57.5Q40.3 58.2 42 53.8Q37.3 53.1 35.6 57.5ZM35.6 57.5Q38.4 61.3 42.8 59.3Q39.9 55.5 35.6 57.5ZM43.7 54.9Q48.4 54.1 48.5 49.4Q43.9 50.2 43.7 54.9ZM43.7 54.9Q47.6 57.6 51.1 54.3Q47.1 51.6 43.7 54.9ZM50.5 49.9Q54.7 47.6 53.3 43Q49.1 45.3 50.5 49.9ZM50.5 49.9Q55.1 51.1 57.3 46.9Q52.7 45.6 50.5 49.9ZM55.3 42.9Q58.5 39.3 55.7 35.5Q52.5 39 55.3 42.9ZM55.3 42.9Q60.1 42.6 60.7 37.8Q56 38.2 55.3 42.9Z'
const LAP_LANH = 'M53 3.5Q54 9 59.5 10Q54 11 53 16.5Q52 11 46.5 10Q52 9 53 3.5ZM10 44.5Q10.7 48.3 14.5 49Q10.7 49.7 10 53.5Q9.3 49.7 5.5 49Q9.3 48.3 10 44.5Z'

/** Bóng mờ nửa trên của mặt huy hiệu (theo khung). */
const BONG: Record<1 | 2 | 3, string> = {
  1: 'M10.5 29A21.5 21.5 0 0 1 53.5 29C46 23 18 23 10.5 29Z',
  2: 'M14 29.5A18 18 0 0 1 50 29.5C43.5 24.5 20.5 24.5 14 29.5Z',
  3: 'M13.5 29.5A18.5 18.5 0 0 1 50.5 29.5C44 24 20 24 13.5 29.5Z',
}

/** Cỡ (px) từ đó huy hiệu bậc 10–12 mới có hiệu ứng (chip nhỏ dòng em, dải ô chật: đứng yên — đỡ việc cho máy). */
const CO_DONG = 24

export default function HuyHieuBac({ bac, co = 24, className }: { bac: number; co?: number; className?: string }) {
  const id = 'hh' + useId().replace(/[^\w-]/g, '')
  if (!Number.isInteger(bac) || bac < 1 || bac > HINH.length) return null
  const k = khungCua(bac)
  const u = (s: string) => `url(#${id}${s})`
  const kim = bac === 12
  return (
    <svg
      className={`bcc bcc-hh${className ? ` ${className}` : ''}`}
      data-bac={bac}
      data-khung={k}
      data-dong={bac >= 10 && co >= CO_DONG ? '' : undefined}
      width={co}
      height={co}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}t`} x1="0" y1="0" x2="0" y2="1">
          <stop className="hh-t0" offset="0" />
          {kim && <stop className="hh-t1" offset="0.55" />}
          {kim && <stop className="hh-t0" offset="0.7" />}
          <stop className="hh-t1" offset="1" />
        </linearGradient>
        {k > 1 && (
          <linearGradient id={`${id}v`} x1="0" y1="0" x2="0" y2="1">
            <stop className="hh-v0" offset="0" />
            <stop className="hh-v1" offset="1" />
          </linearGradient>
        )}
        <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
          <stop className="hh-b0" offset="0" />
          <stop className="hh-b1" offset="1" />
        </linearGradient>
        {bac >= 10 && (
          <clipPath id={`${id}c`}>
            <circle cx="32" cy="32" r="28.5" />
          </clipPath>
        )}
      </defs>
      {bac >= 10 && <path className="hh-tia hh-vien" d={TIA} />}
      {k === 1 && <circle className="hh-vien" cx="32" cy="32" r="27.5" fill={u('t')} />}
      {k === 2 && (
        <>
          <path className="hh-vien" d={LUC_GIAC_NGOAI} fill={u('v')} />
          <path className="hh-ke" d={LUC_GIAC_TRONG} fill={u('t')} />
        </>
      )}
      {k === 3 && (
        <>
          <circle className="hh-vien" cx="32" cy="32" r="28.5" fill={u('v')} />
          <circle className="hh-vien" cx="32" cy="32" r="23" fill={u('t')} />
        </>
      )}
      <path d={BONG[k]} fill={u('b')} />
      {kim && <path className="hh-nq hh-vien hh-mong" d={LA} />}
      {bac === 11 && <path className="hh-v hh-vien hh-mong" d={SAO} />}
      <g className="hh-net">{HINH[bac - 1]}</g>
      {bac >= 10 && (
        <g clipPath={u('c')}>
          <g transform="rotate(24 32 32)">
            <rect className="hh-luot" x="-16" y="-12" width="9" height="88" />
          </g>
        </g>
      )}
      {kim && <path className="hh-lap" d={LAP_LANH} />}
    </svg>
  )
}
