// TẤM BUỔI DẠY (thầy 09/11: «cho nguyên hành trình dạy học vào chỗ chọn sau khi điểm danh xong tinh tế đẹp mắt hiệu quả bỏ hẳn hành trình cũ đi»).
// Thay màn Hành trình: mở từ bảng Bình Phản Ứng («Hôm nay làm gì?») hoặc từ Hôm nay (Cần thầy chữa, hộp Điểm danh). Dùng lại ĐÚNG các khối chức năng
// cũ — Kiểm tra đầu giờ · Chữa câu khó & tính toán · Kiểm tra ôn tập — không đổi luồng ghi. Khối nào bấm «Chiếu lên bảng» ⇒ tờ chiếu mở trên tấm,
// tờ báo câu ⇒ bảng Bình Phản Ứng tự hiện lại (gan-gv). Nạp lười (mảnh riêng), mỗi khối chỉ nạp khi chọn.
import { Suspense, lazy, useState } from 'react'
import { ChevronLeft, ClipboardCheck, Flame, CalendarCheck } from 'lucide-react'
import { useDiemDanhBuoi } from '../day-hoc/DiemDanhBuoi'
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
    <div className="thd" role="dialog" aria-label={muc.ten}>
      <header className="thd-dau">
        <button type="button" className="thd-ve" onClick={onDong}><ChevronLeft size={20} aria-hidden="true" />{coBang ? 'Về bảng Bình Phản Ứng' : 'Về Hôm nay'}</button>
        <nav className="thd-tab" aria-label="Hoạt động">
          {MUC.map(({ id, ten, Icon }) => (
            <button key={id} type="button" aria-current={hd === id || undefined} onClick={() => setHd(id)}><Icon size={18} aria-hidden="true" />{ten}</button>
          ))}
        </nav>
      </header>
      <main className="thd-than">
        <div className="thd-tieu-de"><h1>{muc.ten}</h1><p>{muc.mo}</p></div>
        <Suspense fallback={<div className="thd-cho tt-xuong" role="status" aria-label={`Đang mở ${muc.ten}`} />}>
          {hd === 'dau-gio' ? <DauGio /> : hd === 'chua-cau' ? <TheCanThayChua /> : <BangKiemTraCaNhan />}
        </Suspense>
      </main>
    </div>
  )
}
