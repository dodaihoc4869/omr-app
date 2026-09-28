// THANH ĐÁY (< 880 px) CỦA APP GIÁO VIÊN — cùng danh sách mục với `ThanhBenTrai` (MUC_DIEU_HUONG), nên ngăn kéo, rail và thanh đáy luôn khớp.
// Bốn mục chính nằm trên thanh; các mục còn lại (Ngân hàng đề, Gọi lên bảng, Học sinh hỏi, Cài đặt) ở tờ "Thêm" — ĐỦ mục, không mục nào mất.
// GAME HÓA 2.0 (cờ bật · bản vẽ docs/ban-ve-gv-2809/GV-ThanhBen): thanh đáy = CHÍNH `MUC_HOA2_CHINH` của ThanhBenTrai (5 mục:
// Tổng quan · Ca kiểm tra · Chiến dịch · Chữa bài · Học sinh), KHÔNG còn tờ "Thêm"; Kho đề + Cài đặt (`MUC_HOA2_DAY`) vào nút
// bánh răng trên THANH TRÊN (logo + tên màn). Không chép tay lần hai. Cờ tắt ⇒ đúng như cũ.
// Nút nổi "Mở ca kiểm tra" nằm trên thanh, góc phải. Ẩn ở màn làm bài (App.tsx: HIDE_BOTTOMNAV_ON), ở màn theo dõi ca và ở chính màn Mở ca.
import { useState } from 'react'
import { MoreHorizontal, Plus, Settings } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { MAN_DAU_HOA2, MUC_DIEU_HUONG, MUC_HOA2_CHINH, MUC_HOA2_DAY, mucDangSang, type MucDieuHuong } from './ThanhBenTrai'
import { AnhLogo } from './LogoVai'
import { useHoa2Bat } from './chien-dich/co-hoa2'

const CHINH = ['examhub', 'hocsinh', 'lichsuca', 'giaobtvn']

export default function BottomNav() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const [mo, setMo] = useState(false)
  const hoa2 = useHoa2Bat()
  const sang = mucDangSang(screen, hoa2)
  const chinh: MucDieuHuong[] = hoa2 ? MUC_HOA2_CHINH : MUC_DIEU_HUONG.filter((m) => CHINH.includes(m.id))
  const them: MucDieuHuong[] = hoa2 ? MUC_HOA2_DAY : MUC_DIEU_HUONG.filter((m) => !CHINH.includes(m.id))
  const tenMan = [...MUC_HOA2_CHINH, ...MUC_HOA2_DAY].find((m) => m.id === sang)?.ten ?? 'Đỗ Đại Học'
  const themDangSang = them.some((m) => m.id === sang)
  const di = (id: MucDieuHuong['id']) => {
    setMo(false)
    setScreen(id)
  }

  return (
    <nav className="day-thay" aria-label="Điều hướng chính" data-hoa2={hoa2 ? '' : undefined}>
      {/* Không đè lên màn THEO DÕI CA (giữa giờ thi, góc phải dưới là chỗ nút Khoá ca / Mở khoá — bấm nhầm "Mở ca" là văng khỏi ca) và không lặp ở chính màn Mở ca. */}
      {screen !== 'exammonitor' && screen !== 'examsetup' && (
        <button type="button" className="day-thay-nut-ca" aria-label="Mở ca kiểm tra" onClick={() => di('examsetup')}>
          <Plus size={22} aria-hidden="true" />
          <span>Mở ca</span>
        </button>
      )}

      {hoa2 && (
        <div className="tren-thay">
          <button type="button" className="tren-thay-logo" onClick={() => di(MAN_DAU_HOA2)} aria-label="Về Tổng quan">
            <AnhLogo vai="gv" size={32} />
          </button>
          <span className="tren-thay-ten">{tenMan}</span>
          <button type="button" className={`tren-thay-banh-rang${mo || themDangSang ? ' dang' : ''}`} aria-label="Kho đề và Cài đặt" aria-expanded={mo} aria-haspopup="menu" onClick={() => setMo((v) => !v)}>
            <Settings size={22} aria-hidden="true" />
          </button>
        </div>
      )}

      {mo && (
        <div className={`day-thay-them${hoa2 ? ' day-thay-them--tren' : ''}`} role="menu" aria-label={hoa2 ? 'Kho đề và Cài đặt' : 'Thêm chức năng'}>
          {them.map((m) => {
            const Icon = m.icon
            return (
              <button key={m.id} type="button" role="menuitem" className={`day-thay-them-muc${sang === m.id ? ' dang' : ''}`} onClick={() => di(m.id)}>
                <Icon size={22} aria-hidden="true" />
                <span>{m.ten}</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="day-thay-thanh">
        {chinh.map((m) => {
          const Icon = m.icon
          const dang = sang === m.id
          return (
            <button key={m.id} type="button" className={`day-thay-muc${dang ? ' dang' : ''}`} aria-current={dang ? 'page' : undefined} onClick={() => di(m.id)}>
              <span className="day-thay-bieu-tuong">
                <Icon size={22} strokeWidth={dang ? 2.3 : 1.9} aria-hidden="true" />
              </span>
              <span>{m.ngan}</span>
            </button>
          )
        })}
        {!hoa2 && (
          <button type="button" className={`day-thay-muc${mo || themDangSang ? ' dang' : ''}`} aria-expanded={mo} aria-haspopup="menu" onClick={() => setMo((v) => !v)}>
            <span className="day-thay-bieu-tuong">
              <MoreHorizontal size={22} aria-hidden="true" />
            </span>
            <span>Thêm</span>
          </button>
        )}
      </div>
    </nav>
  )
}
