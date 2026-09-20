// THANH ĐÁY (< 880 px) CỦA APP GIÁO VIÊN — cùng danh sách mục với `ThanhBenTrai` (MUC_DIEU_HUONG), nên ngăn kéo, rail và thanh đáy luôn khớp.
// Bốn mục chính nằm trên thanh; các mục còn lại (Ngân hàng đề, Gọi lên bảng, Học sinh hỏi, Cài đặt) ở tờ "Thêm" — ĐỦ mục, không mục nào mất.
// Nút nổi "Mở ca kiểm tra" nằm trên thanh, góc phải. Ẩn ở màn làm bài (App.tsx: HIDE_BOTTOMNAV_ON).
import { useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { MUC_DIEU_HUONG, mucDangSang } from './ThanhBenTrai'

const CHINH = ['examhub', 'hocsinh', 'lichsuca', 'giaobtvn']

export default function BottomNav({ soCauHoi = 0 }: { soCauHoi?: number }) {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const [mo, setMo] = useState(false)
  const sang = mucDangSang(screen)
  const chinh = MUC_DIEU_HUONG.filter((m) => CHINH.includes(m.id))
  const them = MUC_DIEU_HUONG.filter((m) => !CHINH.includes(m.id))
  const themDangSang = them.some((m) => m.id === sang)
  const di = (id: (typeof MUC_DIEU_HUONG)[number]['id']) => {
    setMo(false)
    setScreen(id)
  }

  return (
    <nav className="day-thay" aria-label="Điều hướng chính">
      <button type="button" className="day-thay-nut-ca" aria-label="Mở ca kiểm tra" onClick={() => di('examsetup')}>
        <Plus size={22} aria-hidden="true" />
        <span>Mở ca</span>
      </button>

      {mo && (
        <div className="day-thay-them" role="menu" aria-label="Thêm chức năng">
          {them.map((m) => {
            const Icon = m.icon
            return (
              <button key={m.id} type="button" role="menuitem" className={`day-thay-them-muc${sang === m.id ? ' dang' : ''}`} onClick={() => di(m.id)}>
                <Icon size={22} aria-hidden="true" />
                <span>{m.ten}</span>
                {m.id === 'cauhoi' && soCauHoi > 0 && <span className="ben-trai-huy-hieu">{soCauHoi}</span>}
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
        <button type="button" className={`day-thay-muc${mo || themDangSang ? ' dang' : ''}`} aria-expanded={mo} aria-haspopup="menu" onClick={() => setMo((v) => !v)}>
          <span className="day-thay-bieu-tuong">
            <MoreHorizontal size={22} aria-hidden="true" />
          </span>
          <span>Thêm</span>
        </button>
      </div>
    </nav>
  )
}
