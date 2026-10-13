// BẢN DUYỆT V2 · MÀN 14 — "HÀNH TRÌNH GIỎI HÓA" của thầy (chế độ Game Hóa 2.0).
// LỊCH SỬ: 09/10 bản vẽ tối giản thầy chốt (bốn thẻ Nhịp hôm nay · Cần thầy chữa · Bài đã dạy · Chiến dịch đã giao + ba thẻ lớn chọn khối).
// 09/10 TỐI — THẦY RA LỆNH: "phần này phải tối ưu lại, tôi chỉ cần giữ lại phần dạy học. Phần câu cần chữa trùng tu lại bỏ hết những thứ không
// cần thiết, thiết kế trực quan khoa học phù hợp với các chức năng hiện tại" + "kiểm tra đầu giờ giữ lại nữa nhé". 09/10 KHUYA thêm Nhịp học;
// 10/10 thêm Bài mới trong 7 ngày; 12/10 sáng thêm Bài hằng ngày (sáu thẻ).
// 12/10 — THẦY (bản vẽ HanhTrinh-DayHoc + HanhTrinh-ChuaBai đã duyệt): "Chỗ này rất khó hiểu, chốt lại trong phần này tôi chỉ cần mục dạy học, gọi lên
// bảng đầu giờ và chữa câu khó tính toán và câu học sinh cần chữa. Bạn hãy thu gọn tối giản hết lại thành 2 mục và làm thật trực quan dễ hiểu khoa học
// đẹp mắt" ⇒ màn còn ĐÚNG HAI MỤC dạng nút lớn:
//   · "Dạy học & đầu giờ" (`day-hoc`, mặc định) — `TheBaiDaDay`: MỘT buổi dạy 4 bước (Điểm danh · Gọi lên bảng đầu giờ · Dạy và chiếu câu · Tick bài
//     vừa dạy + bảng Bài đang giao). Nút chính "Tick bài hôm nay" / "Bổ sung bài" nằm ở bước 4 (không còn nút ở đầu màn).
//   · "Chữa bài" (`chua-bai`) — `TheCanThayChua` (làn Chữa bài trùng tu bên trong). Số cạnh tên mục = số "Cần thầy chữa" (Hôm nay đếm; danh sách đọc
//     xong thì dùng đúng số của danh sách — một con số ở mọi nơi, kể cả thanh bên).
// ĐÃ BỎ khỏi màn (12/10): Bài mới trong 7 ngày (tiến độ gói nay là bảng Bài đang giao ở bước 4; câu nhiều em sai ở mục Chữa bài), Nhịp học và Bài hằng
// ngày (chuyển sang màn Hôm nay), Kiểm tra đầu giờ (gộp vào mục 1 thành bước "Gọi lên bảng đầu giờ"). KHOÁ CŨ không gãy: `mucHanhTrinh` (so-dem-gv.ts)
// ánh xạ `can-chua` ⇒ Chữa bài; `dau-gio` · `goi-7` · `nhip` · `bai-hang-ngay` ⇒ Dạy học & đầu giờ.
import { lazy, Suspense, useCallback, useState } from 'react'
import { Monitor, PencilLine } from 'lucide-react'
import type { BaiCay } from '../../lib/bai-hom-nay'
import { mucHanhTrinh, useSoDemGv, type MucHanhTrinh, type TheHanhTrinh } from '../../lib/so-dem-gv'
import './gv-v2.css'

// Phép tính nhịp (khối, bốn chỉ số) ở `nhip-hanh-trinh.ts` (màn Hôm nay dùng) — xuất lại ở đây cho mọi lối nhập cũ.
export { chiSoNhip, khoiCuaHanhTrinh, type EmNhip } from './nhip-hanh-trinh'

// Mỗi mục là mảnh riêng, chỉ tải khi thầy mở mục.
const TheBaiDaDay = lazy(() => import('./TheBaiDaDay'))
const TheCanThayChua = lazy(() => import('./TheCanThayChua'))
const BangKiemTraCaNhan = lazy(() => import('./BangKiemTraCaNhan'))

/** Hai mục của màn (thầy 12/10). */
export const THE_HANH_TRINH: readonly (readonly [MucHanhTrinh, string])[] = [
  ['day-hoc', 'Dạy học & đầu giờ'],
  ['chua-bai', 'Chữa bài'],
]
const BIEU_TUONG: Record<MucHanhTrinh, typeof Monitor> = { 'day-hoc': Monitor, 'chua-bai': PencilLine }

/** Chương của khối: số bài + số câu (cộng `soCau` các bài trong cây DẠY HỌC). Màn không còn vẽ thẻ chương — giữ hàm thuần cho lối nhập cũ. */
export function chuongCuaKhoi(bai: readonly BaiCay[]): { chuong: string; soBai: number; soCau: number }[] {
  const ra = new Map<string, { chuong: string; soBai: number; soCau: number }>()
  for (const b of bai) {
    const c = ra.get(b.chuong) ?? { chuong: b.chuong, soBai: 0, soCau: 0 }
    c.soBai += 1
    c.soCau += b.soCau
    ra.set(b.chuong, c)
  }
  return [...ra.values()]
}

/** Chờ mảnh mục: khung xương đúng hình hai khối bước (thang chung `.tt-xuong`), không chữ "Đang mở…". */
function XuongThe() {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label="Đang mở mục">
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 96, borderRadius: 16 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 160, borderRadius: 16 }} />
    </div>
  )
}

/** Màn Hành trình.
 *  `theDau` = mục mở đầu — nhận cả khoá cũ (Hôm nay › một việc ⇒ đúng mục ấy; `mucHanhTrinh`). `boSungBai` = vào thẳng mục Dạy học & đầu giờ, mở
 *  bước Bài hôm nay và cuộn tới bước Tick bài vừa dạy. `khoiDau` giữ cho lối gọi cũ (khối của thẻ Nhịp học — thẻ ấy nay ở màn Hôm nay). */
export default function HanhTrinhV2({ theDau = 'day-hoc', boSungBai = false, khoiDau = null }: { theDau?: TheHanhTrinh; boSungBai?: boolean; khoiDau?: number | null }) {
  void khoiDau
  const [the, setThe] = useState<MucHanhTrinh>(boSungBai ? 'day-hoc' : mucHanhTrinh(theDau))
  // Mỗi lần có yêu cầu "Bổ sung bài" tăng một nhịp ⇒ mục Dạy học mở bước Bài hôm nay và cuộn tới.
  const [lanBoSung] = useState(boSungBai ? 1 : 0)
  const canThayChua = useSoDemGv((s) => s.canThayChua)
  // Số cạnh tên mục: số màn Hôm nay đếm; mục Chữa bài đọc xong danh sách (gồm cả bước cuối, thẻ nút thắt) ⇒ dùng đúng số của danh sách.
  const [demDanhSach, setDemDanhSach] = useState<number | null>(null)
  const datSo = useSoDemGv((s) => s.datSo)
  // Danh sách vừa đọc xong (kể cả sau khi chữa một chỗ) ⇒ số cạnh mục Hành trình ở thanh bên theo luôn — một con số ở mọi nơi.
  const nhanDem = useCallback(
    (n: number) => {
      setDemDanhSach(n)
      datSo({ canThayChua: n })
    },
    [datSo],
  )
  const soCanChua = demDanhSach ?? canThayChua
  const moChuaBai = useCallback(() => {
    setThe('chua-bai')
    if (typeof window !== 'undefined') window.scrollTo?.({ top: 0 })
  }, [])

  return (
    <div className="gvv2">
      <header className="gvv2-dau">
        <div className="gvv2-dau-chu">
          <h1 className="gvv2-h1">Hành trình giỏi Hóa</h1>
          <p className="gvv2-phu">Thầy dạy và tick bài, app tự lập bài cho từng em mỗi ngày</p>
        </div>
      </header>

      <nav className="gvv2-muc" data-so={THE_HANH_TRINH.length} role="tablist" aria-label="Hành trình">
        {THE_HANH_TRINH.map(([k, nhan]) => {
          const BieuTuong = BIEU_TUONG[k]
          return (
            <button key={k} type="button" role="tab" id={`gvv2-the-${k}`} aria-controls={`gvv2-o-${k}`} aria-selected={the === k} className="gvv2-muc-nut" onClick={() => setThe(k)}>
              <BieuTuong size={20} aria-hidden="true" />
              {nhan}
              {k === 'chua-bai' && soCanChua ? (
                <span className="gvv2-muc-dem gvv2-so">
                  <span className="sr-only"> · </span>
                  {soCanChua}
                  <span className="sr-only"> chỗ cần chữa</span>
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>

      {/* Đổi mục: mờ dần + trượt 8px 200ms (thang chung .tt-vao-muc); key theo mục để mỗi lần đổi chạy lại. */}
      <div key={the} role="tabpanel" id={`gvv2-o-${the}`} aria-labelledby={`gvv2-the-${the}`} className="gvv2-o-the tt-vao-muc">
        <Suspense fallback={<XuongThe />}>{the === 'day-hoc' ? <><TheBaiDaDay lanBoSung={lanBoSung} onMoChuaBai={moChuaBai} /><BangKiemTraCaNhan/></> : <TheCanThayChua onDem={nhanDem} />}</Suspense>
      </div>
    </div>
  )
}
