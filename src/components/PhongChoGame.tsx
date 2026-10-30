import { Component, lazy, Suspense, type ReactNode } from 'react'
import LogoHocSinh from './LogoHocSinh'
import { laManThi } from './m3'
import './phong-cho/phong-cho.css'
// Đấu Nguyên Tử (30/10): game bắn nhau với bạn cùng phòng chờ — mảnh nạp lười, chỉ tải khi em đã ở phòng chờ.
const DauIon = lazy(() => import('./phong-cho/DauIon'))

/** Mảnh game tải lỗi chỉ thay ô chơi; màn chờ và vòng nhận lệnh vào bài vẫn sống. */
class DuPhongGame extends Component<{ children: ReactNode }, { loi: boolean }> {
  state = { loi: false }
  static getDerivedStateFromError() { return { loi: true } }
  render() {
    return this.state.loi
      ? <div className="pc-loading" role="status">Mini-game chưa tải được. Em vẫn sẽ vào bài khi Thầy bắt đầu.</div>
      : this.props.children
  }
}

interface PhongChoGameProps {
  /** `veDau`: vé vào Sảnh đấu (lệnh vào thi phát); `batDau`: màn cha vừa thấy thầy bắt đầu ⇒ game dừng ngay, đóng kết nối. */
  cho?: { thoiGianPhut?: number; tenCa?: string; lop?: string; maCa?: string; veDau?: string; batDau?: boolean } | null
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
          {cho.tenCa && <span>Ca kiểm tra: {cho.tenCa}</span>}
          {cho.lop && <span>Lớp {cho.lop}</span>}
          {cho.thoiGianPhut && <span>Bài làm trong {cho.thoiGianPhut} phút, đồng hồ chạy từ lúc đó.</span>}
        </div>}
        {loiCho && <div className="pc-error" role="status">{loiCho}</div>}
      </div>
      <DuPhongGame><Suspense fallback={<div className="pc-loading" role="status">Đang chuẩn bị trò chơi…</div>}><DauIon maCa={cho?.maCa} veDau={cho?.veDau} batDau={!!cho?.batDau} /></Suspense></DuPhongGame>
      <p className="pc-assurance">Điểm chơi chỉ để vui trong lúc chờ.</p>
    </div>
  </section>
  return laManThi() ? <div className="m3 w-full">{phong}</div> : phong
}
