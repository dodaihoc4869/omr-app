// THẺ BIẾN ĐỘNG kJ của máy em — phần TRẠNG THÁI (khi nào hiện, khi nào gỡ). Tách NGUYÊN VĂN khỏi ManBinhPhanUng.tsx 11/11 (cổng cỡ tệp: màn ấy chạm
// ngưỡng 60 KB khi thêm bố cục ngang «một bên đề một bên chọn đáp án»); phần VẼ (`DsTheBienDong`, `TheBienDong`) vẫn ở màn ấy. Không màu, không vẽ.
import { useEffect, useRef, useState } from 'react'
import type { BienDong } from '../../lib/bpu/phong'

export const THE_BD_MS = 2500
/** Trạng thái thẻ biến động (tách khỏi chỗ vẽ — 10/11: màn em vẽ thẻ ngay DƯỚI thanh đội đang hiện, trong hay ngoài lớp che, không mất thẻ khi đổi chỗ). */
export function useTheBienDong(ds: readonly BienDong[] | undefined): BienDong[] {
  const daThay = useRef<number | null>(null)
  const [the, setThe] = useState<BienDong[]>([])
  const hen = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    if (!ds) return
    const max = ds.reduce((m, x) => Math.max(m, x.id), 0)
    if (daThay.current == null) { daThay.current = max; return }
    const moi = ds.filter((x) => x.id > daThay.current!)
    daThay.current = Math.max(daThay.current, max)
    if (!moi.length) return
    setThe((c) => [...c, ...moi].slice(-3))
    // Mỗi thẻ tự gỡ đúng ~2,5 s sau khi hiện (không xếp hàng chờ thẻ trước).
    const ids = new Set(moi.map((x) => x.id))
    hen.current.push(setTimeout(() => setThe((c) => c.filter((x) => !ids.has(x.id))), THE_BD_MS))
  }, [ds])
  useEffect(() => () => { for (const h of hen.current) clearTimeout(h) }, [])
  return the
}
