// SỐ ĐẾM: React KHÔNG quản chữ bên trong (span rỗng, chữ ghi qua ref) ⇒ hiệu ứng đếm / lật ghi thẳng mà không đụng nút chữ React đang giữ.
// Lần vẽ đầu: có `tu` ⇒ đếm tu → gt; không ⇒ hiện gt ngay. gt đổi ⇒ đếm từ số cũ sang số mới (không chớp). Giảm chuyển động ⇒ ghi số cuối ngay.
import { useLayoutEffect, useRef } from 'react'
import { demSo, latSo } from '../../lib/hieu-ung-thuong'

const vn = (v: number) => v.toLocaleString('vi-VN')

export function SoDem({ gt, tu, ms = 700, dinh = vn, lat, className, id }: { gt: number; tu?: number; ms?: number; dinh?: (v: number) => string; lat?: boolean; className?: string; id?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const cu = useRef<number | null>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const truoc = cu.current ?? tu
    cu.current = gt
    if (truoc === undefined || truoc === gt) { el.textContent = dinh(gt); return }
    if (lat) latSo(el, dinh(truoc), dinh(gt))
    else void demSo(el, truoc, gt, ms, dinh)
  }, [gt]) // eslint-disable-line react-hooks/exhaustive-deps
  return <span ref={ref} className={`tp-so${lat ? ' tp-lat' : ''}${className ? ` ${className}` : ''}`} id={id} />
}
