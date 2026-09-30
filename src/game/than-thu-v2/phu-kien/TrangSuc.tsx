// Chất liệu trang sức dùng chung; màu từng món và các điểm neo giữ riêng.
// Dải màu SVG tĩnh: không blur/filter và không thêm vòng lặp hay chuyển động.
import type { CSSProperties, ReactNode } from 'react'

export function TrangSuc({ id, ma, viewBox, children }: { id: string; ma: string; viewBox: string; children: ReactNode }) {
  const key = `${id}trang-suc`
  const style = { '--pk-fill1': `url(#${key}-kim)`, '--pk-fill2': `url(#${key}-ngoc)`, '--pk-fill3': `url(#${key}-pha-le)` } as CSSProperties
  return <svg viewBox={viewBox} className="pk-trang-suc" style={style} aria-hidden="true" focusable="false" data-chat-lieu={ma}>
    <defs>
      <linearGradient id={`${key}-kim`} x1="0" y1="0" x2=".8" y2="1" gradientUnits="objectBoundingBox">
        <stop offset="0" stopColor="rgb(255 249 213)" /><stop offset=".22" style={{ stopColor: 'var(--pk-1)' }} />
        <stop offset=".46" stopColor="rgb(255 253 239)" /><stop offset=".52" style={{ stopColor: 'var(--pk-1)' }} />
        <stop offset="1" style={{ stopColor: 'var(--pk-2)' }} />
      </linearGradient>
      <linearGradient id={`${key}-ngoc`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" style={{ stopColor: 'var(--pk-3)' }} /><stop offset=".4" style={{ stopColor: 'var(--pk-2)' }} />
        <stop offset=".55" style={{ stopColor: 'var(--pk-1)' }} /><stop offset="1" style={{ stopColor: 'var(--pk-2)' }} />
      </linearGradient>
      <radialGradient id={`${key}-pha-le`} cx=".32" cy=".22" r=".85">
        <stop offset="0" stopColor="rgb(255 255 246)" /><stop offset=".25" style={{ stopColor: 'var(--pk-3)' }} />
        <stop offset=".8" style={{ stopColor: 'var(--pk-1)' }} /><stop offset="1" style={{ stopColor: 'var(--pk-2)' }} />
      </radialGradient>
    </defs>
    {children}
  </svg>
}

/** Mặt đá cắt giác; hình bé dưới tên thú, không chen vào khuôn mặt. */
export function DaTrangSuc({ kieu }: { kieu: string }) {
  const tron = ['ong-nghiem', 'nhan-lo', 'o-nguyen-to'].includes(kieu)
  return <svg className="pk-da-trang-suc" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
    <path d={tron ? 'M16 2 27 8 30 19 22 29 10 29 2 19 5 8Z' : 'M7 4H25L31 13 16 30 1 13Z'} fill="var(--pk-2)" stroke="rgb(251 218 142)" strokeWidth="1.5" />
    <path d="M7 4 11 13 16 30 21 13 25 4M1 13H31M11 13 16 4 21 13" fill="none" stroke="rgb(255 252 227)" strokeWidth="1" opacity=".85" />
    <path d="M7 4 11 13 1 13Z" fill="rgb(255 255 242)" opacity=".65" />
  </svg>
}
