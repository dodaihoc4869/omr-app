// Đường "tia" 60 phút của một ô số (canvas): đường + vùng mờ + chấm hiện tại. Màu đọc từ token (`mau`), vẽ lại khi đổi màu / kích thước / dữ liệu.
import { useEffect, useRef } from 'react'
import { chuanBiCanvas, phaMau, useKichThuoc, type MauSan } from './hooks'

export function TiaCanvas({ gia, mau, phienBanMau, tenMau, nhan }: { gia: readonly number[]; mau: MauSan; phienBanMau: number; tenMau: 'duong' | 'la' | 'do' | 'tuDong'; nhan: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const kt = useKichThuoc(ref)
  useEffect(() => {
    const cv = ref.current
    if (!cv || gia.length < 2) return
    const k = chuanBiCanvas(cv)
    if (!k) return
    const { ctx, w, h } = k
    const n = gia.length
    const cuoi = gia[n - 1]!
    const xu = tenMau === 'tuDong' ? (cuoi - gia[Math.max(0, n - 11)]! >= -0.04 ? 'la' : 'do') : tenMau
    const m = mau[xu]
    let lo = Math.min(...gia)
    let hi = Math.max(...gia)
    if (hi - lo < 1e-6) {
      hi += 1
      lo -= 1
    }
    const pT = 14
    const pB = 5
    const pR = 6
    const X = (i: number) => (i / (n - 1)) * (w - pR)
    const Y = (v: number) => pT + (1 - (v - lo) / (hi - lo)) * (h - pT - pB)
    ctx.strokeStyle = mau.luoi
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, Math.round(h - pB) + 0.5)
    ctx.lineTo(w, Math.round(h - pB) + 0.5)
    ctx.stroke()
    ctx.beginPath()
    gia.forEach((v, i) => (i ? ctx.lineTo(X(i), Y(v)) : ctx.moveTo(X(i), Y(v))))
    ctx.strokeStyle = m
    ctx.lineWidth = 1.75
    ctx.lineJoin = 'round'
    ctx.stroke()
    ctx.lineTo(X(n - 1), h - pB)
    ctx.lineTo(0, h - pB)
    ctx.closePath()
    const g = ctx.createLinearGradient(0, pT, 0, h - pB)
    g.addColorStop(0, phaMau(m, 0.2))
    g.addColorStop(1, phaMau(m, 0.02))
    ctx.fillStyle = g
    ctx.fill()
    ctx.beginPath()
    ctx.arc(X(n - 1), Y(cuoi), 4.5, 0, 7)
    ctx.fillStyle = mau.mat
    ctx.fill()
    ctx.beginPath()
    ctx.arc(X(n - 1), Y(cuoi), 3, 0, 7)
    ctx.fillStyle = m
    ctx.fill()
  }, [gia, mau, phienBanMau, tenMau, kt.w, kt.h])
  return <canvas ref={ref} role="img" aria-label={nhan} />
}
