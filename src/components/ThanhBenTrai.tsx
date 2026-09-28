// ĐIỀU HƯỚNG TRÁI CỦA APP GIÁO VIÊN (Material 3, thầy chốt 21/09 — bản vẽ docs/ban-ve-app-giao-vien-2109).
//
// Một danh sách mục (`MUC_DIEU_HUONG`) cho CẢ BA dạng, nên ba dạng luôn khớp nhau:
//   ≥ 1100 px  ngăn kéo 264 px (logo + chữ, nút "Mở ca kiểm tra", mục có nhãn, Cài đặt ở đáy);
//   880–1100   thanh rail 88 px (chỉ biểu tượng + nhãn ngắn dưới biểu tượng);
//   < 880      không hiện thanh này — `BottomNav` (thanh đáy) dùng chính danh sách ấy.
// GAME HÓA 2.0 (cờ `co.bat`, bản vẽ thầy chốt 28/09 docs/ban-ve-gv-2809/GV-ThanhBen + RA-SOAT.md mục 1):
//   "Mở ca kiểm tra" (nút chính) · Tổng quan · Ca kiểm tra · Chiến dịch luyện · Chữa trên lớp · Học sinh; ĐÁY: Kho đề · Cài đặt.
//   Bỏ nhãn "Thêm…" và dòng "6,022 · 10²³" (logo = "Đỗ Đại Học · Giáo viên"). Ẩn Hôm nay, Giao BTVN, Học sinh hỏi, Giao đề theo
//   tuần. Số đếm cạnh mục lấy từ `useSoDemGv` (màn đã tải ghi vào) — chưa biết thì không vẽ. Cờ tắt ⇒ đúng danh sách cũ.
// Cùng một phần tử `.ben-trai`: hai dạng đầu chỉ khác nhau ở CSS (vo-thay.css). `KhungXemPhieu` đo mép của `.ben-trai` để chừa lề.
import { CalendarDays, ClipboardCheck, FileText, Flag, Home, Library, MessageCircleQuestion, Plus, Presentation, Settings, Users, type LucideIcon } from 'lucide-react'
import { useAppStore, type ScreenId } from '../store/appStore'
import LogoGiaoVien from './LogoGiaoVien'
import { AnhLogo } from './LogoVai'
import { useSoDemGv } from '../lib/so-dem-gv'
import { useHoa2Bat } from './chien-dich/co-hoa2'
import './chien-dich/thanh-ben-hoa2.css'
import './thanh-ben-gv2.css'

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

/** GAME HÓA 2.0 — bốn việc + Học sinh (bản vẽ GV-ThanhBen). Thanh đáy điện thoại dùng CHÍNH danh sách này (nhãn `ngan`). */
export const MUC_HOA2_CHINH: MucDieuHuong[] = [
  { id: 'tongquan', ten: 'Tổng quan', ngan: 'Tổng quan', icon: Home },
  { id: 'lichsuca', ten: 'Ca kiểm tra', ngan: 'Ca kiểm tra', icon: CalendarDays, con: ['exammonitor', 'examsetup'] },
  { id: 'chiendich', ten: 'Chiến dịch luyện', ngan: 'Chiến dịch', icon: Flag },
  { id: 'goilenbang', ten: 'Chữa trên lớp', ngan: 'Chữa bài', icon: Presentation },
  { id: 'hocsinh', ten: 'Học sinh', ngan: 'Học sinh', icon: Users, con: ['classlist', 'toancanh'] },
]
/** GAME HÓA 2.0 — hai mục ở ĐÁY thanh bên (điện thoại: nút bánh răng trên thanh trên). */
export const MUC_HOA2_DAY: MucDieuHuong[] = [
  { id: 'nganhangde', ten: 'Kho đề', ngan: 'Kho đề', icon: Library, cuoi: true },
  { id: 'caidat', ten: 'Cài đặt', ngan: 'Cài đặt', icon: Settings, cuoi: true },
]
/** Màn KHÔNG còn khi Game Hóa 2.0 bật — App chuyển về `MAN_DAU_HOA2`. */
export const MAN_AN_KHI_HOA2: readonly ScreenId[] = ['examhub', 'giaobtvn', 'cauhoi', 'khodegiao']
/** Màn CHỈ có khi Game Hóa 2.0 bật — cờ tắt thì App chuyển về Hôm nay. */
export const MAN_CHI_HOA2: readonly ScreenId[] = ['tongquan', 'chiendich']
/** Màn đầu của app thầy khi Game Hóa 2.0 bật. */
export const MAN_DAU_HOA2: ScreenId = 'tongquan'

/** Mục nào đang sáng ở màn `screen` (mục có màn con tô sáng cả khi đứng ở màn con). `hoa2` = dùng danh sách Game Hóa 2.0. */
export function mucDangSang(screen: ScreenId, hoa2 = false): ScreenId | null {
  const ds = hoa2 ? [...MUC_HOA2_CHINH, ...MUC_HOA2_DAY] : MUC_DIEU_HUONG
  return ds.find((m) => m.id === screen || (m.con ?? []).includes(screen))?.id ?? null
}

/** Số đếm cạnh mục (2.0): chữ ngắn + nhãn đầy đủ cho trình đọc màn hình. `null` ⇒ không vẽ. */
export function soDemMuc(id: ScreenId, so: { caMo: number | null; chienDichChay: number | null; canDayLai: number | null }): { chu: string; nhan: string; tone: 'la' | 'xam' | 'do' } | null {
  if (id === 'lichsuca' && so.caMo) return { chu: `${so.caMo} mở`, nhan: `${so.caMo} ca đang mở`, tone: 'la' }
  if (id === 'chiendich' && so.chienDichChay) return { chu: String(so.chienDichChay), nhan: `${so.chienDichChay} chiến dịch đang chạy`, tone: 'xam' }
  if (id === 'goilenbang' && so.canDayLai) return { chu: String(so.canDayLai), nhan: `${so.canDayLai} câu cần dạy lại`, tone: 'do' }
  return null
}

export default function ThanhBenTrai() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const hoa2 = useHoa2Bat()
  const sang = mucDangSang(screen, hoa2)
  const caMo = useSoDemGv((s) => s.caMo)
  const chienDichChay = useSoDemGv((s) => s.chienDichChay)
  const canDayLai = useSoDemGv((s) => s.canDayLai)

  const nut = (m: MucDieuHuong, phu = false) => {
    const Icon = m.icon
    const dang = sang === m.id
    const dem = hoa2 ? soDemMuc(m.id, { caMo, chienDichChay, canDayLai }) : null
    return (
      <button key={m.id} type="button" onClick={() => setScreen(m.id)} aria-current={dang ? 'page' : undefined} className={`ben-trai-muc${phu ? ' ben-trai-muc--phu' : ''}${dang ? ' dang' : ''}`} aria-label={m.ten} title={dem ? `${m.ten} · ${dem.nhan}` : m.ten}>
        <span className="ben-trai-bieu-tuong">
          <Icon size={22} strokeWidth={dang ? 2.3 : 1.9} aria-hidden="true" />
        </span>
        <span className="ben-trai-ten">{m.ten}</span>
        <span className="ben-trai-ngan" aria-hidden="true">
          {m.ngan}
        </span>
        {dem && (
          <span className="ben-trai-dem" data-tone={dem.tone} aria-hidden="true">
            {dem.chu}
          </span>
        )}
      </button>
    )
  }

  if (hoa2) {
    return (
      <nav className="ben-trai" aria-label="Điều hướng chính" data-hoa2="">
        <button type="button" onClick={() => setScreen(MAN_DAU_HOA2)} className="ben-trai-logo ben-trai-logo--gv2" title="Về Tổng quan">
          <AnhLogo vai="gv" size={40} />
          <span className="ben-trai-logo-chu">
            <span className="ben-trai-logo-ten">Đỗ Đại Học</span>
            <span className="ben-trai-logo-vai">Giáo viên</span>
          </span>
        </button>
        <button type="button" onClick={() => setScreen('examsetup')} className="ben-trai-nut-ca" aria-label="Mở ca kiểm tra">
          <Plus size={22} aria-hidden="true" />
          <span className="ben-trai-nut-ca-chu">Mở ca kiểm tra</span>
        </button>
        <div className="ben-trai-danh-sach">{MUC_HOA2_CHINH.map((m) => nut(m))}</div>
        <div className="ben-trai-cuoi ben-trai-cuoi--gv2">
          <div className="ben-trai-vach" role="separator" />
          {MUC_HOA2_DAY.map((m) => nut(m, true))}
        </div>
      </nav>
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

      <div className="ben-trai-danh-sach">{MUC_DIEU_HUONG.filter((m) => !m.cuoi).map((m) => nut(m))}</div>
      <div className="ben-trai-cuoi">{MUC_DIEU_HUONG.filter((m) => m.cuoi).map((m) => nut(m))}</div>
    </nav>
  )
}
