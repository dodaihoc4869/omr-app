// Biểu tượng nét của app phụ huynh mới (vẽ tay, 24×24, theo màu chữ). Luôn đi kèm chữ hoặc nằm trong phần tử có aria-label — bản thân biểu tượng aria-hidden.
import type { ReactNode } from 'react'

function Net({ co = 22, day = 2, children }: { co?: number; day?: number; children: ReactNode }) {
  return (
    <svg width={co} height={co} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={day} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}
type P = { co?: number; day?: number }
export const BtHomNay = (p: P) => <Net {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Net>
export const BtTienBo = (p: P) => <Net {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Net>
export const BtTich = (p: P) => <Net {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Net>
export const BtLen = (p: P) => <Net {...p}><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></Net>
export const BtXuong = (p: P) => <Net {...p}><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></Net>
export const BtPhai = (p: P) => <Net {...p}><path d="M9 6l6 6-6 6" /></Net>
export const BtTrai = (p: P) => <Net {...p}><path d="M15 6l-6 6 6 6" /></Net>
export const BtLenGon = (p: P) => <Net {...p}><path d="M6 15l6-6 6 6" /></Net>
/** Ca kiểm tra (bảng kẹp có dấu tích) — biểu tượng riêng của mục "Ca kiểm tra"; ba mục ba biểu tượng khác nhau. */
export const BtBang = (p: P) => <Net {...p}><path d="M8 3h8v4H8z" /><path d="M16 5h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2" /><path d="M9 14l2 2 4-4" /></Net>
/** Bảng kẹp trơn (dòng "Ca kiểm tra gần nhất" ở Hôm nay — khác dấu tích của mục thanh đáy). */
export const BtKep = (p: P) => <Net {...p}><path d="M8 3h8v4H8z" /><path d="M16 5h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2" /></Net>
/** Tam giác chú ý (dòng dạng con đang luyện thêm / dạng cần vững). */
export const BtChuY = (p: P) => <Net {...p}><path d="M12 9v4M12 17h.01" /><path d="M10.3 3.9 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /></Net>
/** Bút (dòng "Cần thầy chữa"). */
export const BtBut = (p: P) => <Net {...p}><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></Net>
export const BtChuong = (p: P) => <Net {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></Net>
export const BtKhoa = (p: P) => <Net {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Net>
