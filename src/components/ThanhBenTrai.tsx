// ĐIỀU HƯỚNG TRÁI CỦA APP GIÁO VIÊN (Material 3, thầy chốt 21/09 — bản vẽ docs/ban-ve-app-giao-vien-2109).
//
// Một danh sách mục (`MUC_DIEU_HUONG`) cho CẢ BA dạng, nên ba dạng luôn khớp nhau:
//   ≥ 1100 px  ngăn kéo 264 px (logo + chữ, nút "Mở ca kiểm tra", mục có nhãn, Cài đặt ở đáy);
//   880–1100   thanh rail 88 px (chỉ biểu tượng + nhãn ngắn dưới biểu tượng);
//   < 880      không hiện thanh này — `BottomNav` (thanh đáy) dùng chính danh sách ấy.
// Cùng một phần tử `.ben-trai`: hai dạng đầu chỉ khác nhau ở CSS (vo-thay.css). `KhungXemPhieu` đo mép của `.ben-trai` để chừa lề.
import { CalendarDays, ClipboardCheck, Home, Library, MessageCircleQuestion, Plus, Presentation, Settings, Users, type LucideIcon } from 'lucide-react'
import { useAppStore, type ScreenId } from '../store/appStore'
import LogoGiaoVien from './LogoGiaoVien'

export interface MucDieuHuong {
  id: ScreenId
  /** Nhãn đầy đủ (ngăn kéo, tiêu đề). */
  ten: string
  /** Nhãn ngắn (rail, thanh đáy). */
  ngan: string
  icon: LucideIcon
  /** Màn con cũng tô sáng mục cha này. */
  con?: ScreenId[]
  /** Đặt ở đáy ngăn kéo (Cài đặt). */
  cuoi?: boolean
}

export const MUC_DIEU_HUONG: MucDieuHuong[] = [
  { id: 'examhub', ten: 'Hôm nay', ngan: 'Hôm nay', icon: Home, con: ['toancanh'] },
  // "Danh sách lớp" không có mục riêng (thầy chốt 04-09): danh sách đã nạp lên máy chủ; màn ấy thuộc mục Học sinh.
  { id: 'hocsinh', ten: 'Học sinh', ngan: 'Học sinh', icon: Users, con: ['classlist'] },
  { id: 'lichsuca', ten: 'Ca thi', ngan: 'Ca thi', icon: CalendarDays, con: ['exammonitor', 'examsetup'] },
  { id: 'nganhangde', ten: 'Ngân hàng đề', ngan: 'Ngân hàng', icon: Library },
  { id: 'giaobtvn', ten: 'Giao bài tập về nhà', ngan: 'Bài tập', icon: ClipboardCheck },
  { id: 'goilenbang', ten: 'Gọi lên bảng', ngan: 'Lên bảng', icon: Presentation },
  { id: 'cauhoi', ten: 'Học sinh hỏi', ngan: 'Hỏi', icon: MessageCircleQuestion },
  { id: 'caidat', ten: 'Cài đặt', ngan: 'Cài đặt', icon: Settings, cuoi: true },
]

/** Mục nào đang sáng ở màn `screen` (mục có màn con tô sáng cả khi đứng ở màn con). */
export function mucDangSang(screen: ScreenId): ScreenId | null {
  return MUC_DIEU_HUONG.find((m) => m.id === screen || (m.con ?? []).includes(screen))?.id ?? null
}

export default function ThanhBenTrai({ soCauHoi = 0 }: { soCauHoi?: number }) {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const sang = mucDangSang(screen)

  const nut = (m: MucDieuHuong) => {
    const Icon = m.icon
    const dang = sang === m.id
    return (
      <button key={m.id} type="button" onClick={() => setScreen(m.id)} aria-current={dang ? 'page' : undefined} className={`ben-trai-muc${dang ? ' dang' : ''}`} aria-label={m.ten} title={m.ten}>
        <span className="ben-trai-bieu-tuong">
          <Icon size={22} strokeWidth={dang ? 2.3 : 1.9} aria-hidden="true" />
        </span>
        <span className="ben-trai-ten">{m.ten}</span>
        <span className="ben-trai-ngan" aria-hidden="true">
          {m.ngan}
        </span>
        {m.id === 'cauhoi' && soCauHoi > 0 && <span className="ben-trai-huy-hieu">{soCauHoi}</span>}
      </button>
    )
  }

  return (
    <nav className="ben-trai" aria-label="Điều hướng chính">
      <button type="button" onClick={() => setScreen('examhub')} className="ben-trai-logo" title="Trang chủ Kiên trì">
        <LogoGiaoVien size={40} hienChu={true} className="ben-trai-logo-goc" />
      </button>

      <button type="button" onClick={() => setScreen('examsetup')} className="ben-trai-nut-ca" aria-label="Mở ca kiểm tra">
        <Plus size={22} aria-hidden="true" />
        <span className="ben-trai-nut-ca-chu">Mở ca kiểm tra</span>
      </button>

      <div className="ben-trai-danh-sach">{MUC_DIEU_HUONG.filter((m) => !m.cuoi).map(nut)}</div>
      <div className="ben-trai-cuoi">{MUC_DIEU_HUONG.filter((m) => m.cuoi).map(nut)}</div>
    </nav>
  )
}
