// BÌNH PHẢN ỨNG — HÌNH NHỎ CỦA BẢNG CHIẾU (tách khỏi BangBinhPhanUng.tsx 10/11 vì cổng cỡ tệp): ngọc vinh danh, ngọn lửa logo, sao lấp lánh, mã QR điểm danh.
import { useMemo } from 'react'
import { taoQr } from '../../lib/ma-qr'

export function Ngoc({ mau, chu }: { mau: string; chu?: string }) {
  return (
    <svg viewBox="0 0 100 120" aria-hidden="true" style={{ ['--g' as string]: mau }}>
      <polygon className="bpu-ngoc-than" points="50,2 96,30 96,90 50,118 4,90 4,30" />
      <polygon className="bpu-ngoc-sang" points="50,2 96,30 74,40 50,26 26,40 4,30" />
      <polygon className="bpu-ngoc-sang mo" points="96,30 96,90 74,80 74,40" />
      <polygon className="bpu-ngoc-sang vua" points="4,30 26,40 26,80 4,90" />
      <polygon className="bpu-ngoc-toi" points="4,90 26,80 50,94 74,80 96,90 50,118" />
      <polygon className="bpu-ngoc-sang mo" points="26,40 50,26 50,58" />
      <polygon className="bpu-ngoc-vien" points="50,2 96,30 96,90 50,118 4,90 4,30" />
      {chu ? <text x="50" y="72" textAnchor="middle" fontSize={chu.length > 1 ? 32 : 40} fontWeight={900} className="bpu-ngoc-chu">{chu}</text> : null}
    </svg>
  )
}
export const Lua = () => <svg className="bpu-lua" viewBox="0 0 40 56" aria-hidden="true"><path className="ngoai" d="M20 2C27 14 37 22 37 36A17 17 0 0 1 3 36C3 24 12 17 20 2Z" /><path className="trong" d="M20 22C24 30 28 33 28 41A8 8 0 0 1 12 41C12 34 16 30 20 22Z" /></svg>
export const Sao = ({ x, y, d }: { x: number; y: number; d: number }) => <svg className="bpu-sao" viewBox="-10 -10 20 20" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} aria-hidden="true"><path d="M0-10C1.2-1.2 1.2-1.2 10 0C1.2 1.2 1.2 1.2 0 10C-1.2 1.2-1.2 1.2-10 0C-1.2-1.2-1.2-1.2 0-10Z" /></svg>

export function MaQr({ text }: { text: string }) {
  const q = useMemo(() => taoQr(text), [text])
  if (!q) return null
  const n = q.length
  return <svg className="bpu-qr" viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label="Mã QR điểm danh"><rect x={-2} y={-2} width={n + 4} height={n + 4} className="nen" />{q.flatMap((hang, y) => hang.map((o, x) => (o ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} /> : null)))}</svg>
}
