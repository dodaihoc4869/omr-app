// BẢN DUYỆT V2 · MÀN 14 — "HÀNH TRÌNH GIỎI HÓA" của thầy (chế độ Game Hóa 2.0).
// LỊCH SỬ: 09/10 bản vẽ tối giản thầy chốt (bốn thẻ Nhịp hôm nay · Cần thầy chữa · Bài đã dạy · Chiến dịch đã giao + ba thẻ lớn chọn khối).
// 09/10 TỐI — THẦY RA LỆNH: "phần này phải tối ưu lại, tôi chỉ cần giữ lại phần dạy học. Phần câu cần chữa trùng tu lại bỏ hết những thứ không
// cần thiết, thiết kế trực quan khoa học phù hợp với các chức năng hiện tại" + "kiểm tra đầu giờ giữ lại nữa nhé". Màn NAY CHỈ CÒN BA THẺ:
//   · Dạy học (mặc định) — `TheBaiDaDay` (điểm danh · chọn câu · bước Bài hôm nay). Nút chính "Bổ sung bài" thuộc thẻ này: chỉ hiện khi đứng ở
//     thẻ Dạy học, bấm ⇒ cuộn tới bước Bài hôm nay (tick bài vừa dạy — máy chủ chưa có lệnh thêm bài thẳng vào hành trình theo khối).
//   · Kiểm tra đầu giờ — `KiemTraDauGio` (cùng bước điểm danh, app gọi ≤ 6 em làm lại câu từng đúng).
//   · Cần thầy chữa — `TheCanThayChua` (trung tu: MỘT danh sách câu/dạng cần chữa xếp theo số em, mỗi dòng một nút đúng việc; thanh phân đoạn
//     Khối 10 · 11 · 12 chỉ hiện ở thẻ này vì chỉ thẻ này lọc theo khối). Số cạnh tên thẻ = số "Cần thầy chữa" màn Hôm nay đã đếm.
// ĐÃ BỎ khỏi màn (thông tin/hành động ấy nằm ở chỗ khác — không mất chức năng nào):
//   · thẻ Nhịp hôm nay (bốn ô số + bảng từng em + thẻ chương) — Hôm nay của thầy có "Đủ mức tối thiểu a/b em" theo khối + việc "N em chưa làm câu
//     nào"; từng em "Hôm nay a/b câu" ở màn Học sinh (Hôm nay bấm khối ⇒ Học sinh lọc sẵn khối); bảng tầng/chặng/dự phòng của từng Hành trình ở
//     Chiến dịch đã giao › "Xem bảng"; chương/bài của khối ở cây Dạy học › Bài hôm nay và Kho đề.
//   · thẻ Chiến dịch đã giao (giao mới · lọc · xem bảng · rải đều · sửa · kết thúc · huỷ) — trang riêng của cùng màn `chiendich`
//     (`ChienDichScreen`), lối vào chữ nhỏ ở Cài đặt và Tổng quan › "Giao" cho một ca.
//   · ba thẻ lớn chọn khối (cao 124 px).
import { lazy, Suspense, useCallback, useState } from 'react'
import { Plus } from 'lucide-react'
import type { BaiCay } from '../../lib/bai-hom-nay'
import { useSoDemGv, type TheHanhTrinh } from '../../lib/so-dem-gv'
import './gv-v2.css'

// Phép tính nhịp (khối, bốn chỉ số) ở `nhip-hanh-trinh.ts` (màn Hôm nay dùng) — xuất lại ở đây cho mọi lối nhập cũ.
export { chiSoNhip, khoiCuaHanhTrinh, type EmNhip } from './nhip-hanh-trinh'

// Ba thẻ ghép màn sẵn có — mảnh riêng, chỉ tải khi thầy mở thẻ (ngoài precache, vite.config.ts).
const TheBaiDaDay = lazy(() => import('./TheBaiDaDay'))
const KiemTraDauGio = lazy(() => import('../day-hoc/KiemTraDauGio'))
const TheCanThayChua = lazy(() => import('./TheCanThayChua'))

type TheMan = Exclude<TheHanhTrinh, 'chien-dich'>
/** Ba thẻ, đúng thứ tự thầy dùng trên lớp: dạy → kiểm tra đầu giờ → chữa. */
export const THE_HANH_TRINH: readonly (readonly [TheMan, string])[] = [
  ['day-hoc', 'Dạy học'],
  ['dau-gio', 'Kiểm tra đầu giờ'],
  ['can-chua', 'Cần thầy chữa'],
]

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

/** Chờ mảnh thẻ: khung xương đúng hình hai khối bước (thang chung `.tt-xuong`), không chữ "Đang mở…". */
function XuongThe() {
  return (
    <div className="gvv2-cc-xuong" role="status" aria-label="Đang mở thẻ">
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 96, borderRadius: 16 }} />
      <span className="gvv2-cc-xuong-khoi tt-xuong" style={{ width: '100%', height: 160, borderRadius: 16 }} />
    </div>
  )
}

/** Màn Hành trình.
 *  `theDau` = thẻ mở đầu (Hôm nay › một việc ⇒ đúng thẻ ấy). `boSungBai` = vào thẳng thẻ Dạy học và cuộn tới bước Bài hôm nay. */
export default function HanhTrinhV2({ theDau = 'day-hoc', boSungBai = false }: { theDau?: TheMan; boSungBai?: boolean }) {
  const [the, setThe] = useState<TheMan>(boSungBai ? 'day-hoc' : theDau)
  // Mỗi lần bấm "Bổ sung bài" tăng một nhịp ⇒ thẻ Dạy học cuộn lại tới bước Bài hôm nay.
  const [lanBoSung, setLanBoSung] = useState(boSungBai ? 1 : 0)
  const canThayChua = useSoDemGv((s) => s.canThayChua)
  // Số cạnh tên thẻ: số màn Hôm nay đếm; thẻ Cần thầy chữa đọc xong danh sách (gồm cả bước cuối, thẻ nút thắt) ⇒ dùng đúng số của danh sách.
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

  return (
    <div className="gvv2">
      <header className="gvv2-dau">
        <div className="gvv2-dau-chu">
          <h1 className="gvv2-h1">Hành trình giỏi Hóa</h1>
          <p className="gvv2-phu">Thầy tick bài đã dạy — app tự lập kế hoạch riêng cho từng em mỗi ngày</p>
        </div>
        {the === 'day-hoc' && (
          <button type="button" className="gvv2-nut-chinh tt-nhan" onClick={() => setLanBoSung((n) => n + 1)} title="Tick bài vừa dạy ở bước Bài hôm nay — hành trình tự nhận bài mới">
            <Plus size={18} aria-hidden="true" />
            Bổ sung bài
          </button>
        )}
      </header>

      <nav className="gvv2-tab" data-so={THE_HANH_TRINH.length} role="tablist" aria-label="Hành trình">
        {THE_HANH_TRINH.map(([k, nhan]) => (
          <button key={k} type="button" role="tab" id={`gvv2-the-${k}`} aria-controls={`gvv2-o-${k}`} aria-selected={the === k} className="gvv2-tab-nut" onClick={() => setThe(k)}>
            {nhan}
            {k === 'can-chua' && soCanChua ? <span className="gvv2-so"> · {soCanChua}</span> : null}
          </button>
        ))}
      </nav>

      {/* Đổi thẻ: mờ dần + trượt 8px 200ms (thang chung .tt-vao-muc); key theo thẻ để mỗi lần đổi chạy lại. */}
      <div key={the} role="tabpanel" id={`gvv2-o-${the}`} aria-labelledby={`gvv2-the-${the}`} className="gvv2-o-the tt-vao-muc">
        <Suspense fallback={<XuongThe />}>
          {the === 'day-hoc' ? (
            <TheBaiDaDay lanBoSung={lanBoSung} />
          ) : the === 'dau-gio' ? (
            <div className="gvv2-nhung">
              <KiemTraDauGio />
            </div>
          ) : (
            <TheCanThayChua onDem={nhanDem} />
          )}
        </Suspense>
      </div>
    </div>
  )
}
