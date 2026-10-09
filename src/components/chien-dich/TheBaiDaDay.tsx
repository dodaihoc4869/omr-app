// HÀNH TRÌNH › THẺ "DẠY HỌC" (tên tệp giữ từ thẻ "Bài đã dạy" cũ — mảnh nạp lười đã có trong vite.config.ts). Thầy 09/10 tối: Hành trình
// "chỉ cần giữ lại phần dạy học" + "kiểm tra đầu giờ giữ lại nữa nhé" ⇒ Dạy học và Kiểm tra đầu giờ thành HAI THẺ NGANG HÀNG của màn
// (không còn thẻ con lồng trong "Bài đã dạy"). Tệp này chỉ còn phần Dạy học, ghép thành phần SẴN CÓ, không đổi luồng:
//   · `DayHocLenBang` (điểm danh · chọn câu kho DẠY HỌC · chiếu; bước 4 "Bài hôm nay" tick bài vừa dạy khi OMNI bật).
// "Bổ sung bài" (đầu thẻ Dạy học / việc ở Hôm nay) ⇒ CUỘN tới bước Bài hôm nay (`[data-khoi="bai-hom-nay"]`) khi bước ấy đã dựng xong
// (OMNI tắt ⇒ không có bước ấy, màn đứng ở đầu như cũ). Nạp LƯỜI (mảnh riêng, ngoài precache — vite.config.ts).
import { lazy, Suspense, useEffect, useRef } from 'react'

const DayHocLenBang = lazy(() => import('../day-hoc/DayHocLenBang'))

/** Chờ bước Bài hôm nay dựng xong tối đa ngần này (đọc kho + danh sách bài đã tick chạy nền). */
const CHO_CUON_MS = 8000

/** Khung xương chờ mảnh Dạy học: đúng hình hai bước (thang chung `.tt-xuong`), không chữ "Đang mở…". */
function XuongBuoc({ nhan }: { nhan: string }) {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label={nhan}>
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 96, borderRadius: 16 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 160, borderRadius: 16 }} />
    </div>
  )
}

/** `lanBoSung` > 0 ⇒ thầy vừa bấm "Bổ sung bài": cuộn tới bước Bài hôm nay. */
export default function TheBaiDaDay({ lanBoSung = 0 }: { lanBoSung?: number }) {
  const khung = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lanBoSung <= 0) return
    const goc = khung.current
    if (!goc) return
    const cuon = () => {
      const buoc = goc.querySelector<HTMLElement>('[data-khoi="bai-hom-nay"]')
      if (!buoc) return false
      const giamChuyenDong = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      buoc.scrollIntoView?.({ block: 'start', behavior: giamChuyenDong ? 'auto' : 'smooth' })
      return true
    }
    if (cuon()) return
    if (typeof MutationObserver === 'undefined') return
    const theo = new MutationObserver(() => {
      if (cuon()) theo.disconnect()
    })
    theo.observe(goc, { childList: true, subtree: true })
    const hen = setTimeout(() => theo.disconnect(), CHO_CUON_MS)
    return () => {
      theo.disconnect()
      clearTimeout(hen)
    }
  }, [lanBoSung])

  return (
    <div ref={khung} className="gvv2-nhung">
      <Suspense fallback={<XuongBuoc nhan="Đang mở Dạy học" />}>
        <DayHocLenBang />
      </Suspense>
    </div>
  )
}
