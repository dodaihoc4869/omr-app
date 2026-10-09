// HÀNH TRÌNH (mã màn `chiendich`) — màn của Game Hóa 2.0. Lịch sử: 28/09 "Chiến dịch luyện" (docs/ban-ve-gv-2809/RA-SOAT.md mục 1 + 4) ·
// 09/10 bản duyệt V2 "Hành trình giỏi Hóa" · 09/10 bản vẽ tối giản (bốn thẻ) · 09/10 TỐI thầy lệnh "chỉ cần giữ lại phần dạy học" + "kiểm tra đầu
// giờ giữ lại nữa nhé" ⇒ màn Hành trình còn BA thẻ Dạy học · Kiểm tra đầu giờ · Cần thầy chữa (`HanhTrinhV2`).
// "Chiến dịch đã giao" (giao chiến dịch mới · lọc · Xem bảng / Mở buổi chữa · Rải đều câu mới · Chỉnh sửa · Kết thúc · Huỷ) KHÔNG còn là thẻ của
// Hành trình nhưng KHÔNG mất: là TRANG RIÊNG của cùng màn này, có nút "Hành trình" quay lại. Lối vào: chữ nhỏ "Chiến dịch đã giao" ở Cài đặt
// (`useSoDemGv.moHanhTrinh = { the: 'chien-dich' }`) và Tổng quan › "Ca … chưa có chiến dịch · Giao" (`useSoDemGv.giaoTuCa` — khung giao mở sẵn
// cho đúng ca ấy). Cả hai đọc một lần rồi xoá. Màn chỉ ghép thành phần của làn chiến dịch — không tự gọi máy chủ.
import { useEffect, useState } from 'react'
import { ArrowLeft, Plus } from 'lucide-react'
import GiaoChienDich from '../components/chien-dich/GiaoChienDich'
import DsChienDichDaGiao from '../components/chien-dich/DsChienDichDaGiao'
import HanhTrinhV2 from '../components/chien-dich/HanhTrinhV2'
import { useSoDemGv, type GiaoTuCa, type MoHanhTrinh } from '../lib/so-dem-gv'
import './gv-hoa2.css'

export default function ChienDichScreen() {
  const [tuCa] = useState<GiaoTuCa | null>(() => useSoDemGv.getState().giaoTuCa)
  const [mo] = useState<MoHanhTrinh | null>(() => useSoDemGv.getState().moHanhTrinh)
  const [daGiao, setDaGiao] = useState(() => tuCa !== null || mo?.the === 'chien-dich')

  useEffect(() => {
    if (tuCa) useSoDemGv.getState().datGiaoTuCa(null)
    if (mo) useSoDemGv.getState().datMoHanhTrinh(null)
  }, [tuCa, mo])

  return (
    <div className="gv2-trang">
      {daGiao ? (
        <TrangChienDichDaGiao tuCa={tuCa} onVe={() => setDaGiao(false)} />
      ) : (
        <HanhTrinhV2 theDau={mo && mo.the !== 'chien-dich' ? mo.the : 'day-hoc'} boSungBai={mo?.boSungBai === true} />
      )}
    </div>
  )
}

/** Trang "Chiến dịch đã giao" (thẻ "Tổng quan" cũ → thẻ thứ tư của Hành trình → nay trang riêng, 09/10 tối): giao chiến dịch mới + danh sách đã
 *  giao. Danh sách tự có tiêu đề (h2). Nút "Giao chiến dịch mới" là nút VIỀN (trang không có nút chính nào khác — luật C2). */
function TrangChienDichDaGiao({ tuCa, onVe }: { tuCa: GiaoTuCa | null; onVe: () => void }) {
  const [moGiao, setMoGiao] = useState(() => tuCa !== null)
  const [lanTai, setLanTai] = useState(0)
  return (
    <div className="gvv2">
      <header className="gvv2-dau">
        <div className="gvv2-dau-chu">
          <button type="button" className="gvv2-nut-chu gvv2-ve tt-nhan" onClick={onVe}>
            <ArrowLeft size={18} aria-hidden="true" />
            Hành trình
          </button>
          <h1 className="gvv2-h1">Chiến dịch đã giao</h1>
          <p className="gvv2-phu">Xem bảng, kết thúc hoặc huỷ chiến dịch; giao chiến dịch luyện mới cho một ca</p>
        </div>
      </header>
      <div className="gvv2-chien-dich">
        {!moGiao && (
          <div className="gvv2-dong-nut">
            <button type="button" className="gvv2-nut-vien" onClick={() => setMoGiao(true)}>
              <Plus size={18} aria-hidden="true" />
              Giao chiến dịch mới
            </button>
          </div>
        )}

        {moGiao && (
          <GiaoChienDich
            maCa={tuCa?.maCa}
            lop={tuCa?.lop}
            tenGoiY={tuCa?.ten ? `Luyện sau ${tuCa.ten}` : ''}
            onDeSau={() => setMoGiao(false)}
            onXong={() => setLanTai((x) => x + 1)}
          />
        )}

        <DsChienDichDaGiao lanTai={lanTai} />
      </div>
    </div>
  )
}
