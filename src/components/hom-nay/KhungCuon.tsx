import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import '../../styles/hom-nay-v2.css'

/** THÂN Ô CUỘN của màn Hôm nay (thầy lệnh 21/09: "cho vào box cuộn cho đẹp và gọn"). Đầu ô (tiêu đề, số, bộ lọc) do ô tự đặt NGOÀI khung này nên luôn dính;
 *  thân cuộn riêng (`overscroll-behavior: contain` — cuộn hết ô không kéo cả trang), mép dưới mờ khi còn nội dung, có vùng focus để cuộn bằng bàn phím. */
export default function KhungCuon({ nhan, children }: { nhan: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [con, setCon] = useState(false)
  const kiem = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCon(el.scrollHeight - el.scrollTop - el.clientHeight > 6)
  }, [])
  useLayoutEffect(kiem)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(kiem)
    ro.observe(el)
    return () => ro.disconnect()
  }, [kiem])
  return (
    <div className="hn2-khung-than" ref={ref} onScroll={kiem} tabIndex={0} role="region" aria-label={nhan} data-con={con ? '1' : '0'}>
      {children}
    </div>
  )
}
