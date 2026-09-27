// ĐIỀU HƯỚNG TRÁI CỦA APP GIÁO VIÊN (Material 3, thầy chốt 21/09 — bản vẽ docs/ban-ve-app-giao-vien-2109).
//
// Một danh sách mục (`MUC_DIEU_HUONG`) cho CẢ BA dạng, nên ba dạng luôn khớp nhau:
//   ≥ 1100 px  ngăn kéo 264 px (logo + chữ, nút "Mở ca kiểm tra", mục có nhãn, Cài đặt ở đáy);
//   880–1100   thanh rail 88 px (chỉ biểu tượng + nhãn ngắn dưới biểu tượng);
//   < 880      không hiện thanh này — `BottomNav` (thanh đáy) dùng chính danh sách ấy.
// GAME HÓA 2.0 (cờ `co.bat`, bản vẽ docs/ban-ve-game-hoa-2-2709/GV-*.dc.html): app thầy chỉ còn HAI việc chính —
//   "Mở ca kiểm tra" (giữ) · Ca kiểm tra · Lên bảng · vạch · "Thêm…" (Học sinh, Ngân hàng đề, Cài đặt). Ẩn Hôm nay, Giao BTVN,
//   Học sinh hỏi, Giao đề theo tuần (thầy: "Bỏ hẳn BTVN"). Cờ tắt ⇒ đúng danh sách cũ `MUC_DIEU_HUONG`, không đổi gì.
// Cùng một phần tử `.ben-trai`: hai dạng đầu chỉ khác nhau ở CSS (vo-thay.css). `KhungXemPhieu` đo mép của `.ben-trai` để chừa lề.
import { CalendarDays, ClipboardCheck, FileText, Home, Library, MessageCircleQuestion, Plus, Presentation, Settings, Users, type LucideIcon } from 'lucide-react'
import { useAppStore, type ScreenId } from '../store/appStore'
import LogoGiaoVien from './LogoGiaoVien'
import { useHoa2Bat } from './chien-dich/co-hoa2'
import './chien-dich/thanh-ben-hoa2.css'

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
  { id: 'lichsuca', ten: 'Ca kiểm tra', ngan: 'Ca kiểm tra', icon: CalendarDays, con: ['exammonitor', 'examsetup'] },
  { id: 'nganhangde', ten: 'Ngân hàng đề', ngan: 'Ngân hàng', icon: Library },
  { id: 'giaobtvn', ten: 'Giao bài tập về nhà', ngan: 'Bài tập', icon: ClipboardCheck },
  { id: 'goilenbang', ten: 'Gọi lên bảng', ngan: 'Lên bảng', icon: Presentation },
  { id: 'cauhoi', ten: 'Học sinh hỏi', ngan: 'Hỏi', icon: MessageCircleQuestion },
  { id: 'khodegiao', ten: 'Giao đề theo tuần', ngan: 'Giao đề', icon: FileText },
  { id: 'caidat', ten: 'Cài đặt', ngan: 'Cài đặt', icon: Settings, cuoi: true },
]

/** GAME HÓA 2.0 — hai việc chính của thầy. */
export const MUC_HOA2_CHINH: MucDieuHuong[] = [
  { id: 'lichsuca', ten: 'Ca kiểm tra', ngan: 'Ca kiểm tra', icon: CalendarDays, con: ['exammonitor', 'examsetup'] },
  { id: 'goilenbang', ten: 'Lên bảng', ngan: 'Lên bảng', icon: Presentation },
]
/** GAME HÓA 2.0 — thu vào "Thêm…". */
export const MUC_HOA2_THEM: MucDieuHuong[] = [
  { id: 'hocsinh', ten: 'Học sinh', ngan: 'Học sinh', icon: Users, con: ['classlist', 'toancanh'] },
  { id: 'nganhangde', ten: 'Ngân hàng đề', ngan: 'Ngân hàng', icon: Library },
  { id: 'caidat', ten: 'Cài đặt', ngan: 'Cài đặt', icon: Settings },
]
/** Màn KHÔNG còn khi Game Hóa 2.0 bật — App chuyển về `MAN_DAU_HOA2`. */
export const MAN_AN_KHI_HOA2: readonly ScreenId[] = ['examhub', 'giaobtvn', 'cauhoi', 'khodegiao']
/** Màn đầu của app thầy khi Game Hóa 2.0 bật. */
export const MAN_DAU_HOA2: ScreenId = 'lichsuca'

/** Mục nào đang sáng ở màn `screen` (mục có màn con tô sáng cả khi đứng ở màn con). `hoa2` = dùng danh sách Game Hóa 2.0. */
export function mucDangSang(screen: ScreenId, hoa2 = false): ScreenId | null {
  const ds = hoa2 ? [...MUC_HOA2_CHINH, ...MUC_HOA2_THEM] : MUC_DIEU_HUONG
  return ds.find((m) => m.id === screen || (m.con ?? []).includes(screen))?.id ?? null
}

export default function ThanhBenTrai() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const hoa2 = useHoa2Bat()
  const sang = mucDangSang(screen, hoa2)

  const nut = (m: MucDieuHuong, phu = false) => {
    const Icon = m.icon
    const dang = sang === m.id
    return (
      <button key={m.id} type="button" onClick={() => setScreen(m.id)} aria-current={dang ? 'page' : undefined} className={`ben-trai-muc${phu ? ' ben-trai-muc--phu' : ''}${dang ? ' dang' : ''}`} aria-label={m.ten} title={m.ten}>
        <span className="ben-trai-bieu-tuong">
          <Icon size={22} strokeWidth={dang ? 2.3 : 1.9} aria-hidden="true" />
        </span>
        <span className="ben-trai-ten">{m.ten}</span>
        <span className="ben-trai-ngan" aria-hidden="true">
          {m.ngan}
        </span>
      </button>
    )
  }

  return (
    <nav className="ben-trai" aria-label="Điều hướng chính" data-hoa2={hoa2 ? '' : undefined}>
      <button type="button" onClick={() => setScreen(hoa2 ? MAN_DAU_HOA2 : 'examhub')} className="ben-trai-logo" title={hoa2 ? 'Về Ca kiểm tra' : 'Trang chủ Kiên trì'}>
        <LogoGiaoVien size={40} hienChu={true} className="ben-trai-logo-goc" />
      </button>

      <button type="button" onClick={() => setScreen('examsetup')} className="ben-trai-nut-ca" aria-label="Mở ca kiểm tra">
        <Plus size={22} aria-hidden="true" />
        <span className="ben-trai-nut-ca-chu">Mở ca kiểm tra</span>
      </button>

      {hoa2 ? (
        <>
          <div className="ben-trai-danh-sach">{MUC_HOA2_CHINH.map((m) => nut(m))}</div>
          <div className="ben-trai-vach" role="separator" />
          <div className="ben-trai-danh-sach" role="group" aria-labelledby="ben-trai-them">
            <span id="ben-trai-them" className="ben-trai-them-nhan">
              Thêm…
            </span>
            {MUC_HOA2_THEM.map((m) => nut(m, true))}
          </div>
        </>
      ) : (
        <>
          <div className="ben-trai-danh-sach">{MUC_DIEU_HUONG.filter((m) => !m.cuoi).map((m) => nut(m))}</div>
          <div className="ben-trai-cuoi">{MUC_DIEU_HUONG.filter((m) => m.cuoi).map((m) => nut(m))}</div>
        </>
      )}
    </nav>
  )
}
