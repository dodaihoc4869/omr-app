// HÀNH TRÌNH › MỤC "DẠY HỌC & ĐẦU GIỜ" (tên tệp giữ từ thẻ "Bài đã dạy" cũ — mảnh nạp lười đã có trong vite.config.ts).
// LỊCH SỬ: 09/10 tối thầy "chỉ cần giữ lại phần dạy học" + "kiểm tra đầu giờ giữ lại nữa nhé" ⇒ Dạy học và Kiểm tra đầu giờ là hai thẻ ngang hàng.
// 12/10 — THẦY: "Chỗ này rất khó hiểu, chốt lại trong phần này tôi chỉ cần mục dạy học, gọi lên bảng đầu giờ và chữa câu khó tính toán và câu học sinh
// cần chữa. Bạn hãy thu gọn tối giản hết lại thành 2 mục và làm thật trực quan dễ hiểu khoa học đẹp mắt" (bản vẽ HanhTrinh-DayHoc đã duyệt) ⇒ mục này
// là MỘT BUỔI DẠY 4 BƯỚC trên một trang:
//   · Thanh trên: ô "Buổi dạy" (buổi đang mở; nhiều buổi ⇒ chọn) + 4 bước có trạng thái xong / đang / chờ (bấm ⇒ cuộn tới bước).
//   · 1 Điểm danh — `BuocDiemDanh` (mở buổi, mã/QR, thêm em tay, Kết thúc buổi) + thanh có mặt / sĩ số + tên em vắng.
//   · 2 Gọi lên bảng đầu giờ — `KiemTraDauGio` nhận `dd` (chiếu + Đạt / Chưa đạt + Gọi thêm + Thầy đã chữa + Kết thúc; máy chủ `/gv/dau-gio`).
//   · 3 Dạy và chiếu câu + 4 Tick bài vừa dạy — `DayHocLenBang` nhận `dd` (chọn câu kho Dạy học + chiếu; Bài hôm nay gập sẵn + bảng
//     `BangBaiDangGiao` + lối sang mục Chữa bài).
//   ĐIỂM DANH DÙNG CHUNG: `useDiemDanhBuoi()` gọi MỘT lần ở đây; hai thành phần con nhận `dd` nên không tự tìm/mở buổi, không vẽ lại bước điểm danh.
// "Bổ sung bài" (Hôm nay › việc "Bổ sung bài" ⇒ `lanBoSung`) ⇒ mở bước Bài hôm nay và CUỘN tới bước "Tick bài vừa dạy".
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { BuocDiemDanh, useDiemDanhBuoi, type DiemDanhBuoi } from '../day-hoc/DiemDanhBuoi'
import BangBaiDangGiao from './BangBaiDangGiao'
import { chuBuoi, CHU_TRANG_THAI_BUOC, TEN_BUOC, trangThaiBuoc, type TrangThaiBuoc } from './buoi-day-ui'

const DayHocLenBang = lazy(() => import('../day-hoc/DayHocLenBang'))
const KiemTraDauGio = lazy(() => import('../day-hoc/KiemTraDauGio'))

/** Chờ bước "Tick bài vừa dạy" dựng xong tối đa ngần này (mảnh Dạy học nạp lười, kho + danh sách bài chạy nền). */
const CHO_CUON_MS = 8000
/** Đích cuộn của "Bổ sung bài": bước Tick bài vừa dạy (bảng đầy đủ cũ: bước Bài hôm nay). */
const DICH_BO_SUNG = '[data-khoi="buoc-tick-bai"], [data-khoi="bai-hom-nay"]'

const giamChuyenDong = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/** Khung xương chờ một bước: đúng hình khối bước (thang chung `.tt-xuong`), không chữ "Đang mở…". */
function XuongBuoc({ nhan, cao = 120 }: { nhan: string; cao?: number }) {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label={nhan}>
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: cao, borderRadius: 16 }} />
    </div>
  )
}

/** Thanh trên của buổi dạy: ô "Buổi dạy" + bốn bước (bấm ⇒ cuộn tới bước). */
function ThanhBuoi({ dd, trangThai, onDen }: { dd: DiemDanhBuoi; trangThai: readonly TrangThaiBuoc[]; onDen: (so: number) => void }) {
  return (
    <section className="gvv2-bd-thanh" aria-label="Buổi dạy và bốn bước" data-khoi="thanh-buoi">
      {dd.dsBuoiMo.length > 0 ? (
        <label className="gvv2-bd-chon">
          <span>Buổi dạy</span>
          <select value={dd.idBuoi} onChange={(e) => void dd.chonBuoi(e.target.value)} disabled={dd.dangChonBuoi} aria-busy={dd.dangChonBuoi}>
            {dd.dsBuoiMo.map((b) => (
              <option key={b.id} value={b.id}>
                {chuBuoi(b)}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="gvv2-bd-chon gvv2-bd-chon--trong" aria-busy={dd.dangTaiBuoi}>
          <span>Buổi dạy</span>
          <b>{dd.dangTaiBuoi ? 'Đang tìm buổi đang mở…' : 'Chưa mở buổi — bấm “Điểm danh” ở bước 1'}</b>
        </p>
      )}
      <ol className="gvv2-bd-buoc-ds" aria-label="Bốn bước của buổi dạy">
        {TEN_BUOC.map((ten, i) => {
          const t = trangThai[i] ?? 'cho'
          return (
            <li key={ten}>
              <button type="button" className="gvv2-bd-chip" data-trang-thai={t} aria-current={t === 'dang' ? 'step' : undefined} onClick={() => onDen(i + 1)}>
                {t === 'xong' && <Check size={16} strokeWidth={2.6} aria-hidden="true" />}
                <span>
                  {i + 1} {ten}
                </span>
                <span className="sr-only"> · {CHU_TRANG_THAI_BUOC[t]}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </section>
  )
}

/** `lanBoSung` > 0 ⇒ thầy vừa bấm "Bổ sung bài": mở bước Bài hôm nay và cuộn tới bước Tick bài vừa dạy. `onMoChuaBai` = sang mục Chữa bài. */
export default function TheBaiDaDay({ lanBoSung = 0, onMoChuaBai }: { lanBoSung?: number; onMoChuaBai?: () => void }) {
  const khung = useRef<HTMLDivElement>(null)
  // MỘT điểm danh cho cả buổi dạy — truyền xuống Gọi lên bảng đầu giờ và Dạy học.
  const dd = useDiemDanhBuoi()
  const [xongDauGio, setXongDauGio] = useState(false)
  const [ttDay, setTtDay] = useState({ day: false, tick: false })
  const nhanTtDay = useCallback((t: { day: boolean; tick: boolean }) => setTtDay((cu) => (cu.day === t.day && cu.tick === t.tick ? cu : t)), [])
  const trangThai = trangThaiBuoc([!!dd.tt && dd.coMat.length > 0, xongDauGio, ttDay.day, ttDay.tick])

  const denBuoc = useCallback((so: number) => {
    khung.current?.querySelector<HTMLElement>(`[data-buoc="${so}"]`)?.scrollIntoView?.({ block: 'start', behavior: giamChuyenDong() ? 'auto' : 'smooth' })
  }, [])

  useEffect(() => {
    if (lanBoSung <= 0) return
    const goc = khung.current
    if (!goc) return
    const cuon = () => {
      const buoc = goc.querySelector<HTMLElement>(DICH_BO_SUNG)
      if (!buoc) return false
      buoc.scrollIntoView?.({ block: 'start', behavior: giamChuyenDong() ? 'auto' : 'smooth' })
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
    <div ref={khung} className="gvv2-nhung gvv2-bd" data-khoi="buoi-day" data-b1={trangThai[0]} data-b2={trangThai[1]} data-b3={trangThai[2]} data-b4={trangThai[3]}>
      <ThanhBuoi dd={dd} trangThai={trangThai} onDen={denBuoc} />
      <div className="gvv2-bd-b1" data-buoc="1">
        <BuocDiemDanh dd={dd} soBuoc={1} idTieuDe="bd-b1" thanh />
      </div>
      <Suspense fallback={<XuongBuoc nhan="Đang mở bước Gọi lên bảng đầu giờ" />}>
        <KiemTraDauGio dd={dd} soBuoc={2} onXong={setXongDauGio} />
      </Suspense>
      <Suspense fallback={<XuongBuoc nhan="Đang mở bước Dạy và chiếu câu" cao={200} />}>
        <DayHocLenBang dd={dd} soBuocDau={3} lanBoSung={lanBoSung} onTrangThai={nhanTtDay} sauBaiHomNay={<BangBaiDangGiao onMoChuaBai={onMoChuaBai} />} />
      </Suspense>
    </div>
  )
}
