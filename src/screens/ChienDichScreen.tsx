// HÀNH TRÌNH (mã màn `chiendich`) — giữ luồng Dạy học & đầu giờ / Chữa bài.
// Khoá điều hướng cũ `chien-dich` trở về mục mặc định sau khi gỡ giao diện chiến dịch cũ (14/10).
import { useEffect, useState } from 'react'
import HanhTrinhV2 from '../components/chien-dich/HanhTrinhV2'
import { useSoDemGv, type MoHanhTrinh } from '../lib/so-dem-gv'
import './gv-hoa2.css'
import '../styles/trong-gv-ngang.css' // NGANG GV 26/10: dải biểu tượng điện thoại ngang + khung 1480 (≥ 1600) — mảnh CSS chung của các màn thầy, ngoài đường /gv

export default function ChienDichScreen() {
  const [mo] = useState<MoHanhTrinh | null>(() => useSoDemGv.getState().moHanhTrinh)

  useEffect(() => {
    const soDem = useSoDemGv.getState()
    if (soDem.giaoTuCa) soDem.datGiaoTuCa(null)
    if (mo) soDem.datMoHanhTrinh(null)
  }, [mo])

  return (
    <div className="gv2-trang">
      <HanhTrinhV2 theDau={mo?.the ?? 'day-hoc'} boSungBai={mo?.boSungBai === true} khoiDau={mo?.the === 'nhip' || mo?.the === 'bai-hang-ngay' ? (mo.khoi ?? null) : null} />
    </div>
  )
}
