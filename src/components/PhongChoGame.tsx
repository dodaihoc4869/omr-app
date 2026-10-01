import { lazy, Suspense } from 'react'
import LogoHocSinh from './LogoHocSinh'
import { laManThi } from './m3'
const ChuyenBay = lazy(() => import('./phong-cho/ChuyenBay'))
import './phong-cho/phong-cho.css'

interface PhongChoGameProps {
  cho?: { thoiGianPhut?: number; tenCa?: string; lop?: string } | null
  loiCho?: string | null
}

/** Màn chờ chỉ trình bày ca thật và mini-game cục bộ. ExamTakeScreen vẫn quyết định lúc vào bài. */
export default function PhongChoGame({ cho, loiCho }: PhongChoGameProps) {
  const phong = <section className="pc-room" aria-label="Phòng chờ thi trực tuyến">
    <header className="pc-brand"><div><LogoHocSinh size={44} hienChu={false} /><span>AVOGADRO<small>Học một chút, tiến một bước.</small></span></div><span className="pc-room-label">Phòng chờ</span></header>
    <div className="pc-main">
      <div className="pc-wait">
        <span className="pc-status"><i /> Em đã vào phòng chờ</span>
        <h1>Đang chờ Thầy bấm bắt đầu</h1>
        <p>Em giữ nguyên màn hình này. Đề hiện ra ngay khi Thầy bắt đầu.</p>
        {(cho?.tenCa || cho?.lop || cho?.thoiGianPhut) && <div className="pc-session">
          {cho.tenCa && <span>Ca thi: {cho.tenCa}</span>}
          {cho.lop && <span>Lớp {cho.lop}</span>}
          {cho.thoiGianPhut && <span>Bài làm trong {cho.thoiGianPhut} phút, đồng hồ chạy từ lúc đó.</span>}
        </div>}
        {loiCho && <div className="pc-error" role="status">{loiCho}</div>}
      </div>
      <Suspense fallback={<div className="pc-loading" role="status">Đang chuẩn bị chuyến bay…</div>}><ChuyenBay /></Suspense>
      <p className="pc-assurance">Điểm chơi chỉ để vui trong lúc chờ.</p>
    </div>
  </section>
  return laManThi() ? <div className="m3 w-full">{phong}</div> : phong
}
