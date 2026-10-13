import { useId, type ReactNode } from 'react'
import './bieu-tuong.css'

// ĐỢT 19 · BIỂU TƯỢNG VẼ RIÊNG (thầy 13/10: "mục tự sửa lỗi thiết kế lại biểu tượng làm cho hiển thị đẹp mắt hơn nữa"). PHONG CÁCH CHUNG với huy hiệu
// 12 bậc (làn M): viewBox 64 · ô bo mềm gradient dịu (sáng trên, đậm dưới) theo màu nhấn · MỘT vệt bóng mờ nửa trên · nét tròn đầu 2.5 · không bóng đổ
// gắt. Màu chỉ từ biến chuẩn của app học sinh (lớp `.bt64*` trong bieu-tuong.css — sáng/tối tự đổi theo tokens.css). Hình luôn đi kèm chữ ⇒ `aria-hidden`.
// NẠP LƯỜI (luật tốc độ 13/10): Hôm nay lấy hình qua `lazy` (thẻ mời chỉ hiện sau khi danh sách Tự sửa lỗi về) ⇒ không thêm byte tải mở app.

/** Khung chung: ô nền + vệt bóng; `sac` chọn màu nhấn (`.bt64[data-sac=…]`). Mã gradient riêng mỗi lần vẽ (`useId`) ⇒ hai hình cùng màn không giẫm nhau. */
export function Khung64({ sac, children, lop }: { sac: string; children: ReactNode; lop?: string }) {
  const id = 'bt' + useId().replace(/[^\w-]/g, '')
  return <svg viewBox="0 0 64 64" className={lop ? `bt64 ${lop}` : 'bt64'} data-sac={sac} aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="bt64-s" /><stop offset="1" className="bt64-d" /></linearGradient>
      <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="bt64-b" /><stop offset="1" className="bt64-b bt64-b0" /></linearGradient>
    </defs>
    <rect x="2" y="2" width="60" height="60" rx="18" fill={`url(#${id})`} />
    <path d="M6 31V22C6 11 11 6 22 6h20c11 0 16 5 16 16v9c-12 4-40 4-52 0z" fill={`url(#${id}b)`} />
    {children}
  </svg>
}

/** Lấp lánh bốn cánh tâm (x, y), bán kính r. */
export const lapLanh = (x: number, y: number, r: number) => `M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}z`

/**
 * Tự sửa lỗi: tờ bài có dấu sai, bút đang sửa thành dấu đúng, kèm lấp lánh. MỘT hình cho thẻ mời ở Hôm nay, dòng Tự sửa lỗi và thẻ lớn ở Ôn & sửa.
 * `hien` ⇒ chuyển động nhẹ khi hiện (dấu đúng tự vẽ, bút trượt theo, lấp lánh bật) — tắt khi giảm chuyển động / máy yếu (CSS).
 */
export function BieuTuongTuSua({ hien }: { hien?: boolean }) {
  return <Khung64 sac="sua" lop={hien ? 'bt-hien' : undefined}>
    <g transform="rotate(-6 26 32)">
      <rect className="bt-v" x="12" y="11" width="29" height="42" rx="6" />
      <path className="bt-n bt-mo" d="M28 20h7M17 45h17M17 50h10" />
      <path className="bt-n bt-sai" d="M17 17l6 6m0-6l-6 6" />
      <path className="bt-n bt-dung" d="M16 33l4.5 4.5L29 28" />
    </g>
    <g className="bt-but"><g transform="translate(28.6 27.7) rotate(42)">
      <path className="bt-go" d="M4-1.8 9.5-4.5v9L4 1.8z" />
      <path className="bt-ruot" d="M0 0l4-1.8v3.6z" />
      <rect className="bt-tay" x="29" y="-4.5" width="6" height="9" rx="2.5" />
      <rect className="bt-than" x="9.5" y="-4.5" width="17" height="9" />
      <rect className="bt-v bt-mo" x="9.5" y="-4.5" width="17" height="3" />
      <rect className="bt-dai" x="26.5" y="-4.5" width="3.5" height="9" />
    </g></g>
    <path className="bt-v bt-lap" d={lapLanh(49, 13, 5.5)} />
    <path className="bt-v bt-lap" d={lapLanh(56, 25, 3)} />
  </Khung64>
}
