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
export const BtDiem = (p: P) => <Net {...p}><path d="M3 20h18" /><path d="M6 16v-5" /><path d="M11 16V6" /><path d="M16 16v-8" /></Net>
export const BtTienBo = (p: P) => <Net {...p}><path d="M3 17l6-6 4 4 8-8" /><path d="M14 7h7v7" /></Net>
export const BtLoiThay = (p: P) => <Net {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></Net>
export const BtLua = (p: P) => <Net {...p}><path d="M12 3c1 3.5 5 5.5 5 10a5 5 0 0 1-10 0c0-2.2 1-3.6 2.2-4.8.3 1.6 1.1 2.6 2.3 3.1C11 9 11.2 6 12 3z" /></Net>
export const BtTich = (p: P) => <Net {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Net>
export const BtLen = (p: P) => <Net {...p}><path d="M12 19V5" /><path d="M6 11l6-6 6 6" /></Net>
export const BtXuong = (p: P) => <Net {...p}><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></Net>
export const BtPhai = (p: P) => <Net {...p}><path d="M9 6l6 6-6 6" /></Net>
export const BtTrai = (p: P) => <Net {...p}><path d="M15 6l-6 6 6 6" /></Net>
export const BtLenGon = (p: P) => <Net {...p}><path d="M6 15l6-6 6 6" /></Net>
export const BtDongHo = (p: P) => <Net {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Net>
export const BtBia = (p: P) => <Net {...p}><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></Net>
export const BtSao = (p: P) => <Net {...p}><path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.4l-5.2 2.7 1-5.8-4.3-4.1 5.9-.8z" /></Net>
export const BtSach = (p: P) => <Net {...p}><path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z" /><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19" /><path d="M9 8h6" /></Net>
export const BtBang = (p: P) => <Net {...p}><path d="M8 3h8v4H8z" /><path d="M16 5h2a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h2" /><path d="M9 14l2 2 4-4" /></Net>
export const BtCo = (p: P) => <Net {...p}><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></Net>
export const BtChuong = (p: P) => <Net {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" /></Net>
export const BtKhoa = (p: P) => <Net {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Net>
