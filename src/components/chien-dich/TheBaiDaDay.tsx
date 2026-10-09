// HÀNH TRÌNH › THẺ "BÀI ĐÃ DẠY" (bản vẽ tối giản thầy chốt 09/10 · GV-HanhTrinh). Ghép thành phần SẴN CÓ, không đổi luồng:
//   · Dạy học — `DayHocLenBang` (điểm danh · chọn câu kho DẠY HỌC · chiếu; bước 4 "Bài hôm nay" tick bài vừa dạy khi OMNI bật).
//   · Kiểm tra đầu giờ — `KiemTraDauGio` (cùng bước điểm danh, app gọi ≤ 6 em làm lại câu từng đúng).
// "Bổ sung bài" (đầu màn Hành trình / việc ở Hôm nay) ⇒ mở phần Dạy học và CUỘN tới bước Bài hôm nay (`[data-khoi="bai-hom-nay"]`) khi bước ấy
// đã dựng xong (OMNI tắt ⇒ không có bước ấy, màn đứng ở đầu như cũ). Nạp LƯỜI từng phần (mảnh riêng, ngoài precache — vite.config.ts).
import { lazy, Suspense, useEffect, useRef, useState } from 'react'

const DayHocLenBang = lazy(() => import('../day-hoc/DayHocLenBang'))
const KiemTraDauGio = lazy(() => import('../day-hoc/KiemTraDauGio'))

type PhanDay = 'day-hoc' | 'dau-gio'
export const PHAN_BAI_DA_DAY: readonly (readonly [PhanDay, string])[] = [
  ['day-hoc', 'Dạy học'],
  ['dau-gio', 'Kiểm tra đầu giờ'],
]
/** Chờ bước Bài hôm nay dựng xong tối đa ngần này (đọc kho + danh sách bài đã tick chạy nền). */
const CHO_CUON_MS = 8000

/** `lanBoSung` > 0 ⇒ thầy vừa bấm "Bổ sung bài": về phần Dạy học, cuộn tới bước Bài hôm nay. */
export default function TheBaiDaDay({ lanBoSung = 0 }: { lanBoSung?: number }) {
  const [phan, setPhan] = useState<PhanDay>('day-hoc')
  const khung = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lanBoSung <= 0) return
    setPhan('day-hoc')
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
    <div className="gvv2-the-con">
      <div className="gvv2-con" role="tablist" aria-label="Bài đã dạy">
        {PHAN_BAI_DA_DAY.map(([k, nhan]) => (
          <button key={k} type="button" role="tab" id={`gvv2-day-${k}`} aria-controls="gvv2-day-o" aria-selected={phan === k} className="gvv2-con-nut" onClick={() => setPhan(k)}>
            {nhan}
          </button>
        ))}
      </div>
      <div ref={khung} role="tabpanel" id="gvv2-day-o" aria-labelledby={`gvv2-day-${phan}`} className="gvv2-nhung">
        <Suspense
          fallback={
            <p className="gvv2-trong" role="status">
              Đang mở…
            </p>
          }
        >
          {phan === 'day-hoc' ? <DayHocLenBang /> : <KiemTraDauGio />}
        </Suspense>
      </div>
    </div>
  )
}
