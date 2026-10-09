// CHIẾN DỊCH LUYỆN — màn riêng của Game Hóa 2.0 (thầy chốt 28/09 · docs/ban-ve-gv-2809/RA-SOAT.md mục 1 + 4).
// Trước đây "Giao chiến dịch mới" + danh sách chiến dịch nằm lẫn trong màn Ca kiểm tra; nay một việc một đường vào.
// Màn chỉ ghép hai thành phần của làn chiến dịch (`GiaoChienDich`, `DsChienDichDaGiao`) — không tự gọi máy chủ.
// Mở từ Tổng quan › "Ca … chưa có chiến dịch · Giao" ⇒ khung giao mở sẵn cho đúng ca ấy (`useSoDemGv.giaoTuCa`, đọc một lần rồi xoá).
import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import GiaoChienDich from '../components/chien-dich/GiaoChienDich'
import DsChienDichDaGiao from '../components/chien-dich/DsChienDichDaGiao'
import NutGiaoTheoBai from '../components/chien-dich/NutGiaoTheoBai'
import HanhTrinhV2 from '../components/chien-dich/HanhTrinhV2'
import { useSoDemGv, type GiaoTuCa } from '../lib/so-dem-gv'
import './gv-hoa2.css'

export default function ChienDichScreen() {
  const [tuCa] = useState<GiaoTuCa | null>(() => useSoDemGv.getState().giaoTuCa)
  const [moGiao, setMoGiao] = useState(() => tuCa !== null)
  const [lanTai, setLanTai] = useState(0)

  useEffect(() => {
    if (tuCa) useSoDemGv.getState().datGiaoTuCa(null)
  }, [tuCa])
  const tongQuan = <TongQuanChienDich tuCa={tuCa} moGiao={moGiao} setMoGiao={setMoGiao} lanTai={lanTai} setLanTai={setLanTai} />

  // BẢN DUYỆT V2 (thầy 09/10): màn mở bằng "Hành trình giỏi Hóa" (Nhịp hôm nay theo khối); phần cũ (giao + danh sách chiến dịch) nằm nguyên ở thẻ Tổng quan.
  return (
    <div className="gv2-trang">
      <HanhTrinhV2 tongQuan={tongQuan} theDau={tuCa ? 'tong-quan' : 'nhip'} />
    </div>
  )
}

function TongQuanChienDich({ tuCa, moGiao, setMoGiao, lanTai, setLanTai }: { tuCa: GiaoTuCa | null; moGiao: boolean; setMoGiao: (v: boolean) => void; lanTai: number; setLanTai: (f: (x: number) => number) => void }) {
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
