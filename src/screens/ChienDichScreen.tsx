// CHIẾN DỊCH LUYỆN — màn riêng của Game Hóa 2.0 (thầy chốt 28/09 · docs/ban-ve-gv-2809/RA-SOAT.md mục 1 + 4).
// Trước đây "Giao chiến dịch mới" + danh sách chiến dịch nằm lẫn trong màn Ca kiểm tra; nay một việc một đường vào.
// Màn chỉ ghép hai thành phần của làn chiến dịch (`GiaoChienDich`, `DsChienDichDaGiao`) — không tự gọi máy chủ.
// Mở từ Tổng quan › "Ca … chưa có chiến dịch · Giao" ⇒ khung giao mở sẵn cho đúng ca ấy (`useSoDemGv.giaoTuCa`, đọc một lần rồi xoá).
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import GiaoChienDich from '../components/chien-dich/GiaoChienDich'
import DsChienDichDaGiao from '../components/chien-dich/DsChienDichDaGiao'
import NutGiaoTheoBai from '../components/chien-dich/NutGiaoTheoBai'
import { useSoDemGv, type GiaoTuCa } from '../lib/so-dem-gv'
import './gv-hoa2.css'

export default function ChienDichScreen() {
  const [tuCa] = useState<GiaoTuCa | null>(() => useSoDemGv.getState().giaoTuCa)
  const [moGiao, setMoGiao] = useState(() => tuCa !== null)
  const [lanTai, setLanTai] = useState(0)

  useEffect(() => {
    if (tuCa) useSoDemGv.getState().datGiaoTuCa(null)
  }, [tuCa])

  return (
    <div className="gv2-trang">
      <header className="gv2-dau">
        <div className="gv2-dau-chu">
          <h1 className="gv2-tieu-de">Chiến dịch luyện</h1>
        </div>
        {!moGiao && (
          <div className="gv2-dau-nut">
            {/* OMNI 3 (05/10): "Giao theo bài" — lối vào thứ hai của bước Bài hôm nay (chỉ khi OMNI bật; tắt ⇒ không vẽ gì). */}
            <NutGiaoTheoBai />
            <button type="button" className="gv2-nut-chinh" onClick={() => setMoGiao(true)}>
              <Plus size={18} aria-hidden="true" />
              Giao chiến dịch mới
            </button>
          </div>
        )}
      </header>

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
  )
}
