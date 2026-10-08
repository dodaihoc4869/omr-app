// CHIẾN DỊCH LUYỆN — màn riêng của Game Hóa 2.0 (thầy chốt 28/09 · docs/ban-ve-gv-2809/RA-SOAT.md mục 1 + 4).
// Trước đây "Giao chiến dịch mới" + danh sách chiến dịch nằm lẫn trong màn Ca kiểm tra; nay một việc một đường vào.
// Màn chỉ ghép hai thành phần của làn chiến dịch (`GiaoChienDich`, `DsChienDichDaGiao`) — không tự gọi máy chủ.
// Mở từ Tổng quan › "Ca … chưa có chiến dịch · Giao" ⇒ khung giao mở sẵn cho đúng ca ấy (`useSoDemGv.giaoTuCa`, đọc một lần rồi xoá).
import { useEffect, useState } from 'react'
import GiaoChienDich from '../components/chien-dich/GiaoChienDich'
import HanhTrinhDashboard from '../components/chien-dich/HanhTrinhDashboard'
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
    <div className="gv2-trang v2-journey-page">
      <header className="gv2-dau">
        <div className="gv2-dau-chu">
          <h1 className="gv2-tieu-de">Hành trình giỏi Hóa</h1>
          <p className="gv2-phu-de">Chọn bài đã dạy · Kế hoạch riêng mỗi ngày</p>
        </div>
        {!moGiao && (
          <div className="gv2-dau-nut">
            <NutGiaoTheoBai className="gv2-nut-chinh" nhan="+ Bổ sung bài" />
          </div>
        )}
      </header>

      {moGiao && tuCa && (
        <GiaoChienDich
          maCa={tuCa?.maCa}
          lop={tuCa?.lop}
          tenGoiY={tuCa?.ten ? `Luyện sau ${tuCa.ten}` : ''}
          onDeSau={() => setMoGiao(false)}
          onXong={() => setLanTai((x) => x + 1)}
        />
      )}

      <HanhTrinhDashboard lanTai={lanTai} />
    </div>
  )
}
