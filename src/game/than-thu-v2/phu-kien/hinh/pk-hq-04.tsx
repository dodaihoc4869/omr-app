// HQ-04 · Hào quang (Đẹp) — cụm tinh thể lam hình thoi mọc quanh bệ (CuSO₄·5H₂O). Tĩnh.
import type { HinhProps } from '../nap-hinh'

// [x, y, chiều cao, góc nghiêng] — mọc trên cung sau chân thú
const TT: [number, number, number, number][] = [
  [30, 190, 48, -22],
  [62, 214, 34, -10],
  [96, 228, 24, 6],
  [160, 228, 26, -6],
  [196, 214, 36, 12],
  [226, 190, 50, 24],
  [128, 236, 16, 0],
  [46, 226, 18, -30],
  [212, 228, 18, 30],
]
export default function Hinh({ id: _id }: HinhProps) {
  return (
    <svg viewBox="0 0 256 256" aria-hidden="true" focusable="false">
      <ellipse cx="128" cy="222" rx="104" ry="18" className="pk-f1" opacity=".14" />
      {TT.map(([x, y, h, g]) => {
        const w = h * 0.52
        return (
          <g key={x} transform={`translate(${x} ${y}) rotate(${g})`}>
            <path className="pk-f1" d={`M0 ${-h}L${w} ${-h * 0.35}L0 0L${-w} ${-h * 0.35}Z`} />
            <path className="pk-f2" d={`M0 ${-h}L${w} ${-h * 0.35}L0 ${-h * 0.32}Z`} opacity=".9" />
            <path className="pk-f3" d={`M0 ${-h}L${-w} ${-h * 0.35}L0 ${-h * 0.32}Z`} opacity=".55" />
          </g>
        )
      })}
    </svg>
  )
}
