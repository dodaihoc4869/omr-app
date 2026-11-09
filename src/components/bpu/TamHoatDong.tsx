// TẤM BUỔI DẠY (thầy 09/11: «cho nguyên hành trình dạy học vào chỗ chọn sau khi điểm danh xong tinh tế đẹp mắt hiệu quả bỏ hẳn hành trình cũ đi»).
// Thay màn Hành trình: mở từ bảng Bình Phản Ứng («Hôm nay làm gì?») hoặc từ Hôm nay (Cần thầy chữa, hộp Điểm danh). Dùng lại ĐÚNG các khối chức năng
// cũ — Kiểm tra đầu giờ · Chữa câu khó & tính toán · Kiểm tra ôn tập — không đổi luồng ghi. Khối nào bấm «Chiếu lên bảng» ⇒ tờ chiếu mở trên tấm,
// tờ báo câu ⇒ bảng Bình Phản Ứng tự hiện lại (gan-gv). Nạp lười (mảnh riêng), mỗi khối chỉ nạp khi chọn.
import { Suspense, lazy, useState } from 'react'
import { ChevronLeft, ClipboardCheck, Flame, CalendarCheck } from 'lucide-react'
import { useDiemDanhBuoi } from '../day-hoc/DiemDanhBuoi'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import './tam-hoat-dong.css'

const KiemTraDauGio = lazy(() => import('../day-hoc/KiemTraDauGio'))
const TheCanThayChua = lazy(() => import('../chien-dich/TheCanThayChua'))
const BangKiemTraCaNhan = lazy(() => import('../chien-dich/BangKiemTraCaNhan'))

export type HoatDongTam = 'dau-gio' | 'chua-cau' | 'on-tap'
const MUC: { id: HoatDongTam; ten: string; mo: string; Icon: typeof Flame }[] = [
  { id: 'dau-gio', ten: 'Kiểm tra đầu giờ', mo: 'App chọn tối đa 6 em có mặt, mỗi em một câu em đã làm đúng; thầy chấm Đạt / Chưa đạt.', Icon: ClipboardCheck },
  { id: 'chua-cau', ten: 'Chữa câu khó & tính toán', mo: 'Câu nhiều em sai nhất và câu tính toán thầy chọn; mỗi câu gọi một em làm sai lên chữa.', Icon: Flame },
  { id: 'on-tap', ten: 'Kiểm tra ôn tập', mo: 'Ngoài buổi dạy · lịch và đề dành riêng cho từng em.', Icon: CalendarCheck },
]

/** Kiểm tra đầu giờ cần danh sách có mặt của buổi ⇒ hook điểm danh dùng chung (đọc buổi đang mở). */
function DauGio() {
  const dd = useDiemDanhBuoi()
  return <KiemTraDauGio dd={dd} soBuoc={1} />
}

export default function TamHoatDong({ hd: hd0, coBang, onDong }: { hd: HoatDongTam; coBang: boolean; onDong: () => void }) {
  const [hd, setHd] = useState<HoatDongTam>(hd0) // mở lại với hoạt động khác ⇒ gan-gv đổi key (dựng lại)
  const muc = MUC.find((m) => m.id === hd)!
  return (
    // 09/11 (lần 2) thầy «làm lại màn này đẹp hơn, tinh tế hơn, thân thiện hơn, đồng điệu với màn điểm danh»: khung giống bảng Bình Phản Ứng — nền bảng tối
    // dịu (bảng màu tờ chiếu cũ), thanh trên có ngọn lửa + ba thẻ hoạt động lớn, tiêu đề chữ to; nội dung nằm trên TẤM GIẤY ẤM (như đề trên bảng / tờ cũ).
    <div className="thd" role="dialog" aria-label={muc.ten} style={MAU_CHIEU}>
      <header className="thd-dau">
        <button type="button" className="thd-ve" onClick={onDong}><ChevronLeft size={22} aria-hidden="true" />{coBang ? 'Về bảng' : 'Về Hôm nay'}</button>
        <span className="thd-logo" aria-hidden="true"><svg viewBox="0 0 40 56"><path className="ngoai" d="M20 2C27 14 37 22 37 36A17 17 0 0 1 3 36C3 24 12 17 20 2Z" /><path className="trong" d="M20 22C24 30 28 33 28 41A8 8 0 0 1 12 41C12 34 16 30 20 22Z" /></svg>Bình Phản Ứng</span>
        <nav className="thd-tab" aria-label="Hoạt động">
          {MUC.map(({ id, ten, Icon }) => (
            <button key={id} type="button" aria-current={hd === id || undefined} onClick={() => setHd(id)}><Icon size={20} aria-hidden="true" />{ten}</button>
          ))}
        </nav>
      </header>
      <main className="thd-than">
        <div className="thd-tieu-de"><span className="thd-icon" aria-hidden="true"><muc.Icon size={30} strokeWidth={2.2} /></span><div><h1>{muc.ten}</h1><p>{muc.mo}</p></div></div>
        <div className="thd-giay">
          <Suspense fallback={<div className="thd-cho tt-xuong" role="status" aria-label={`Đang mở ${muc.ten}`} />}>
            {hd === 'dau-gio' ? <DauGio /> : hd === 'chua-cau' ? <TheCanThayChua /> : <BangKiemTraCaNhan />}
          </Suspense>
        </div>
      </main>
    </div>
  )
}
