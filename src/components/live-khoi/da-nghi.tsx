// Đồng hồ «đã nghỉ m:ss» của nút «Nghỉ» (13/11) — dùng chung máy thầy (màn nghỉ) và máy em (băng «Nghỉ giải lao»). Đếm theo giây bằng setTimeout nối chuỗi.
import { useEffect, useState } from 'react'

export function DaNghi({ tu }: { /** giờ bắt đầu nghỉ (ms) */ tu: number }) {
  const [nay, setNay] = useState(() => Date.now())
  useEffect(() => { const h = setTimeout(() => setNay(Date.now()), 1000); return () => clearTimeout(h) }, [nay])
  const s = Math.max(0, Math.floor((nay - tu) / 1000))
  return <>{String(Math.floor(s / 60)).padStart(2, '0')}:{String(s % 60).padStart(2, '0')}</>
}
