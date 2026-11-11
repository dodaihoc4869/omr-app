// XEM LẠI LIVE — biểu tượng nét vẽ nội tuyến (kiểu lucide, như bản vẽ) ⇒ mảnh này không kéo mảnh biểu tượng chung.
import type { ReactNode } from 'react'

const net = (d: ReactNode, s = 22, w = 2) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
const dac = (d: ReactNode, s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">{d}</svg>
type P = { s?: number }
export const BtLui = ({ s = 24 }: P) => net(<path d="m15 18-6-6 6-6" />, s)
export const BtMui = ({ s = 20 }: P) => net(<path d="m9 18 6-6-6-6" />, s)
export const BtXuong = ({ s = 20 }: P) => net(<path d="m6 9 6 6 6-6" />, s)
export const BtPhat = ({ s = 22 }: P) => dac(<path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z" />, s)
export const BtDung = ({ s = 22 }: P) => dac(<><rect x="6" y="5" width="4.4" height="14" rx="1.2" /><rect x="13.6" y="5" width="4.4" height="14" rx="1.2" /></>, s)
export const BtLive = ({ s = 22 }: P) => net(<><circle cx="12" cy="12" r="9.2" /><path d="M10 8.6v6.8l5.6-3.4z" fill="currentColor" /></>, s)
const so10 = (x: number) => <text x={x} y="15.6" fontSize="7.4" fontWeight="800" textAnchor="middle" fill="currentColor" stroke="none">10</text>
export const BtLui10 = ({ s = 26 }: P) => net(<><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.4" /><path d="M3.5 3.6v4.8h4.8" />{so10(12.2)}</>, s, 1.9)
export const BtToi10 = ({ s = 26 }: P) => net(<><path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1l2.6 2.5" /><path d="M20.5 3.6v4.8h-4.8" />{so10(11.8)}</>, s, 1.9)
export const BtDong = ({ s = 22 }: P) => net(<path d="M6 6l12 12M18 6 6 18" />, s)
export const BtTich = ({ s = 18 }: P) => net(<path d="m5 12.5 4.5 4.5L19 7.5" />, s, 2.6)
export const BtSao = ({ s = 18 }: P) => dac(<path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z" />, s)
export const BtCup = ({ s = 26 }: P) => net(<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8.5 20h7M10 17h4v3h-4z" />, s)
export const BtLua = ({ s = 20 }: P) => net(<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-2 1-3.5 2-4.5.3 1.5 1 2.3 2 2.5-.5-3 .5-6 2-9z" />, s)
export const BtLenBang = ({ s = 18 }: P) => net(<path d="M3 4h18M5 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4M12 15v5M8 20h8" />, s, 1.9)
export const BtMatMang = ({ s = 20 }: P) => net(<path d="M3 9a14 14 0 0 1 18 0M6.5 12.5a9 9 0 0 1 11 0M12 17.5v.5M4 4l16 16" />, s)
