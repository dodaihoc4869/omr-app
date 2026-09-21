// CỬA HÀNG PHỤ KIỆN — biểu tượng vẽ tay (SVG, không thư viện, không emoji, không id nên dùng bao nhiêu lần cũng không trùng).
// Màu đặt bằng CSS trong shop.css (đồng vàng: lớp .ps-xu-*; biểu tượng nét: currentColor). Biểu tượng luôn đi kèm chữ hoặc nằm trong nút có nhãn.
import type { SVGProps } from 'react'

const NET: SVGProps<SVGSVGElement> = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' }

/** Đồng vàng (vàng của em). */
export function DongVang({ c = 20, className = '' }: { c?: number; className?: string }) {
  return (
    <svg className={`ps-xu ${className}`.trim()} width={c} height={c} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <circle className="ps-xu-ngoai" cx="16" cy="16" r="15" />
      <circle className="ps-xu-trong" cx="16" cy="16" r="12.4" />
      <path className="ps-xu-net" d="M16 8.2 22.8 12.1V19.9L16 23.8 9.2 19.9V12.1Z" />
      <circle className="ps-xu-net" cx="16" cy="16" r="3.6" />
      <path className="ps-xu-sang" d="M8.5 9.5c2-2.6 5-4 7.5-4" />
    </svg>
  )
}

export function BtLui({ c = 22 }: { c?: number }) {
  return (
    <svg width={c} height={c} viewBox="0 0 24 24" {...NET}>
      <path d="M14.5 5.5 8 12l6.5 6.5" />
    </svg>
  )
}
export function BtKhoa({ c = 14 }: { c?: number }) {
  return (
    <svg width={c} height={c} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}
export function BtTich({ c = 14 }: { c?: number }) {
  return (
    <svg width={c} height={c} viewBox="0 0 24 24" {...NET} strokeWidth={2.8}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
export function BtTu({ c = 20 }: { c?: number }) {
  return (
    <svg width={c} height={c} viewBox="0 0 24 24" {...NET} strokeWidth={2}>
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" />
      <path d="M12 3.5v17M9.5 11v2.5M14.5 11v2.5" />
    </svg>
  )
}
export function BtMat({ c = 18 }: { c?: number }) {
  return (
    <svg width={c} height={c} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
  )
}
export function BtCanhBao({ c = 20 }: { c?: number }) {
  return (
    <svg width={c} height={c} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7v6.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1.4" fill="currentColor" />
    </svg>
  )
}
