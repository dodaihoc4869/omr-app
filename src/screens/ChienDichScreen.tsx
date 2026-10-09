// HÀNH TRÌNH (mã màn `chiendich`) — màn của Game Hóa 2.0. Lịch sử: 28/09 "Chiến dịch luyện" (docs/ban-ve-gv-2809/RA-SOAT.md mục 1 + 4) ·
// 09/10 bản duyệt V2 "Hành trình giỏi Hóa" · 09/10 BẢN VẼ TỐI GIẢN THẦY CHỐT: mục Hành trình thay Chiến dịch luyện · Chữa trên lớp · Gỡ nút thắt,
// bốn thẻ Nhịp hôm nay · Cần thầy chữa · Bài đã dạy · Chiến dịch đã giao (`HanhTrinhV2`).
// Màn chỉ ghép thành phần của làn chiến dịch (`HanhTrinhV2`, `GiaoChienDich`, `DsChienDichDaGiao`) — không tự gọi máy chủ.
// Mở từ Tổng quan › "Ca … chưa có chiến dịch · Giao" ⇒ thẻ Chiến dịch đã giao, khung giao mở sẵn cho đúng ca ấy (`useSoDemGv.giaoTuCa`).
// Mở từ Hôm nay › một việc ⇒ đúng thẻ ấy (`useSoDemGv.moHanhTrinh`). Cả hai đọc một lần rồi xoá.
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import GiaoChienDich from '../components/chien-dich/GiaoChienDich'
import DsChienDichDaGiao from '../components/chien-dich/DsChienDichDaGiao'
import HanhTrinhV2 from '../components/chien-dich/HanhTrinhV2'
import { useSoDemGv, type GiaoTuCa, type MoHanhTrinh } from '../lib/so-dem-gv'
import './gv-hoa2.css'

export default function ChienDichScreen() {
  const [tuCa] = useState<GiaoTuCa | null>(() => useSoDemGv.getState().giaoTuCa)
  const [mo] = useState<MoHanhTrinh | null>(() => useSoDemGv.getState().moHanhTrinh)
  const [moGiao, setMoGiao] = useState(() => tuCa !== null)
  const [lanTai, setLanTai] = useState(0)

  useEffect(() => {
    if (tuCa) useSoDemGv.getState().datGiaoTuCa(null)
    if (mo) useSoDemGv.getState().datMoHanhTrinh(null)
  }, [tuCa, mo])
  const daGiao = <ChienDichDaGiao tuCa={tuCa} moGiao={moGiao} setMoGiao={setMoGiao} lanTai={lanTai} setLanTai={setLanTai} />

  return (
    <div className="gv2-trang">
      <HanhTrinhV2 chienDichDaGiao={daGiao} theDau={tuCa ? 'chien-dich' : mo?.the ?? 'nhip'} chonDau={mo?.chienDichId ?? null} boSungBai={!tuCa && mo?.boSungBai === true} />
    </div>
  )
}

/** Thẻ "Chiến dịch đã giao" (thẻ "Tổng quan" cũ, đổi tên 09/10): giao chiến dịch mới + danh sách đã giao. Danh sách tự có tiêu đề (h2).
 *  Nút "Giao chiến dịch mới" là nút VIỀN — màn chỉ có MỘT nút chính ("Bổ sung bài" ở đầu màn, luật C2); nút trùng "Giao theo bài" đã bỏ
 *  (cùng luồng với "Bổ sung bài" — BoGop 09/10; thành phần `NutGiaoTheoBai` giữ mã). */
function ChienDichDaGiao({ tuCa, moGiao, setMoGiao, lanTai, setLanTai }: { tuCa: GiaoTuCa | null; moGiao: boolean; setMoGiao: (v: boolean) => void; lanTai: number; setLanTai: (f: (x: number) => number) => void }) {
  return (
    <>
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
    </>
  )
}
