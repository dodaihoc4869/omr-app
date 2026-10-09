// ĐIỀU HƯỚNG TRÁI CỦA APP GIÁO VIÊN (Material 3, thầy chốt 21/09 — bản vẽ docs/ban-ve-app-giao-vien-2109).
//
// Một danh sách mục (`MUC_DIEU_HUONG`) cho CẢ BA dạng, nên ba dạng luôn khớp nhau:
//   ≥ 1100 px  ngăn kéo 264 px (logo + chữ, nút "Mở ca kiểm tra", mục có nhãn, Cài đặt ở đáy);
//   880–1100   thanh rail 88 px (chỉ biểu tượng + nhãn ngắn dưới biểu tượng);
//   < 880      không hiện thanh này — `BottomNav` (thanh đáy) dùng chính danh sách ấy.
// GAME HÓA 2.0 (cờ `co.bat`) — BẢN VẼ TỐI GIẢN THẦY CHỐT 09/10 (GV-HomNay/GV-HanhTrinh/BoGop): 5 mục
//   Hôm nay · Hành trình · Ca kiểm tra · Học sinh · Kho đề; ĐÁY: Cài đặt. KHÔNG còn nút riêng "Mở ca kiểm tra" (mở ca nằm trong màn
//   Ca kiểm tra — App.tsx đặt nút ở đầu màn ấy). Chiến dịch luyện · Chữa trên lớp · Gỡ nút thắt rời thanh bên nhưng GIỮ mã màn
//   (`chiendich` = Hành trình; `goilenbang`, `bangonutthat` vẫn mở được bằng `setScreen` và vào qua các thẻ của Hành trình — mục
//   Hành trình sáng khi đứng ở hai màn ấy). Mã màn `tongquan` nay dựng màn Hôm nay (`GvHomNayScreen`).
//   Logo = "Đỗ Đại Học · Giáo viên". Số đếm cạnh mục lấy từ `useSoDemGv` (màn đã tải ghi vào) — chưa biết thì không vẽ. Cờ tắt ⇒ đúng danh sách cũ.
//   (Lịch sử: 28/09 docs/ban-ve-gv-2809/GV-ThanhBen — "Mở ca kiểm tra" + Tổng quan · Ca kiểm tra · Chiến dịch luyện · Chữa trên lớp · Học sinh.)
// Cùng một phần tử `.ben-trai`: hai dạng đầu chỉ khác nhau ở CSS (vo-thay.css). `KhungXemPhieu` đo mép của `.ben-trai` để chừa lề.
import { CalendarDays, ClipboardCheck, FileText, Home, Library, LifeBuoy, MessageCircleQuestion, Plus, Presentation, Route, Settings, Users, type LucideIcon } from 'lucide-react'
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

/** BÀN GỠ NÚT THẮT (Vòng học v2, 02/10): thầy gỡ bước cuối cho câu em đã nỗ lực thật mà vẫn vướng. Cờ Hóa 2 TẮT: một mục thanh bên.
 *  Cờ BẬT (09/10, bản vẽ tối giản): vào qua Hành trình › Cần thầy chữa › Gỡ nút thắt (màn `bangonutthat` giữ nguyên). */
export const MUC_GO_NUT_THAT: MucDieuHuong = { id: 'bangonutthat', ten: 'Gỡ nút thắt', ngan: 'Gỡ nút', icon: LifeBuoy }

export const MUC_DIEU_HUONG: MucDieuHuong[] = [
  { id: 'examhub', ten: 'Hôm nay', ngan: 'Hôm nay', icon: Home, con: ['toancanh'] },
  // "Danh sách lớp" không có mục riêng (thầy chốt 04-09): danh sách đã nạp lên máy chủ; màn ấy thuộc mục Học sinh.
  { id: 'hocsinh', ten: 'Học sinh', ngan: 'Học sinh', icon: Users, con: ['classlist'] },
  { id: 'lichsuca', ten: 'Ca kiểm tra', ngan: 'Ca kiểm tra', icon: CalendarDays, con: ['exammonitor', 'examsetup'] },
  { id: 'nganhangde', ten: 'Ngân hàng đề', ngan: 'Ngân hàng', icon: Library },
  { id: 'giaobtvn', ten: 'Giao bài tập về nhà', ngan: 'Bài tập', icon: ClipboardCheck },
  { id: 'goilenbang', ten: 'Gọi lên bảng', ngan: 'Lên bảng', icon: Presentation },
  { id: 'cauhoi', ten: 'Học sinh hỏi', ngan: 'Hỏi', icon: MessageCircleQuestion },
  MUC_GO_NUT_THAT,
  { id: 'khodegiao', ten: 'Giao đề theo tuần', ngan: 'Giao đề', icon: FileText },
  { id: 'caidat', ten: 'Cài đặt', ngan: 'Cài đặt', icon: Settings, cuoi: true },
]

/** GAME HÓA 2.0 — năm mục (bản vẽ tối giản thầy chốt 09/10). Thanh đáy điện thoại dùng CHÍNH danh sách này (nhãn `ngan`, ≤ 5 mục — luật C6). */
export const MUC_HOA2_CHINH: MucDieuHuong[] = [
  { id: 'tongquan', ten: 'Hôm nay', ngan: 'Hôm nay', icon: Home },
  { id: 'chiendich', ten: 'Hành trình', ngan: 'Hành trình', icon: Route, con: ['goilenbang', 'bangonutthat'] },
  { id: 'lichsuca', ten: 'Ca kiểm tra', ngan: 'Ca kiểm tra', icon: CalendarDays, con: ['exammonitor', 'examsetup'] },
  { id: 'hocsinh', ten: 'Học sinh', ngan: 'Học sinh', icon: Users, con: ['classlist', 'toancanh'] },
  { id: 'nganhangde', ten: 'Kho đề', ngan: 'Kho đề', icon: Library },
]
/** GAME HÓA 2.0 — mục ở ĐÁY thanh bên (điện thoại: nút bánh răng trên thanh trên). */
export const MUC_HOA2_DAY: MucDieuHuong[] = [{ id: 'caidat', ten: 'Cài đặt', ngan: 'Cài đặt', icon: Settings, cuoi: true }]

/** Màn KHÔNG còn khi Game Hóa 2.0 bật — App chuyển về `MAN_DAU_HOA2`. */
export const MAN_AN_KHI_HOA2: readonly ScreenId[] = ['examhub', 'giaobtvn', 'cauhoi', 'khodegiao']
/** Màn CHỈ có khi Game Hóa 2.0 bật — cờ tắt thì App chuyển về Hôm nay. */
export const MAN_CHI_HOA2: readonly ScreenId[] = ['tongquan', 'chiendich']
/** Màn đầu của app thầy khi Game Hóa 2.0 bật — mã `tongquan`, từ 09/10 dựng màn "Hôm nay" (GvHomNayScreen). */
export const MAN_DAU_HOA2: ScreenId = 'tongquan'

/** Mục nào đang sáng ở màn `screen` (mục có màn con tô sáng cả khi đứng ở màn con). `hoa2` = dùng danh sách Game Hóa 2.0. */
export function mucDangSang(screen: ScreenId, hoa2 = false): ScreenId | null {
  const ds = hoa2 ? [...MUC_HOA2_CHINH, ...MUC_HOA2_DAY] : MUC_DIEU_HUONG
  return ds.find((m) => m.id === screen || (m.con ?? []).includes(screen))?.id ?? null
}

/** Số đếm cạnh mục (2.0): chữ ngắn + nhãn đầy đủ cho trình đọc màn hình. `null` / 0 ⇒ không vẽ.
 *  09/10: cạnh Hành trình là số "Cần thầy chữa" (một khái niệm một tên — bỏ số chiến dịch đang chạy / câu cần dạy lại ở thanh bên). */
export function soDemMuc(id: ScreenId, so: { caMo: number | null; canThayChua: number | null }): { chu: string; nhan: string; tone: 'la' | 'xam' | 'do' } | null {
  if (id === 'lichsuca' && so.caMo) return { chu: `${so.caMo} mở`, nhan: `${so.caMo} ca đang mở`, tone: 'la' }
  if (id === 'chiendich' && so.canThayChua) return { chu: String(so.canThayChua), nhan: `Cần thầy chữa: ${so.canThayChua} chỗ`, tone: 'do' }
  return null
}

export default function ThanhBenTrai() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const hoa2 = useHoa2Bat()
  const sang = mucDangSang(screen, hoa2)
  const caMo = useSoDemGv((s) => s.caMo)
  const canThayChua = useSoDemGv((s) => s.canThayChua)

  const nut = (m: MucDieuHuong, phu = false) => {
    const Icon = m.icon
    const dang = sang === m.id
    const dem = hoa2 ? soDemMuc(m.id, { caMo, canThayChua }) : null
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
        <button type="button" onClick={() => setScreen(MAN_DAU_HOA2)} className="ben-trai-logo ben-trai-logo--gv2" title="Về Hôm nay">
          <AnhLogo vai="gv" size={40} />
          <span className="ben-trai-logo-chu">
            <span className="ben-trai-logo-ten">Đỗ Đại Học</span>
            <span className="ben-trai-logo-vai">Giáo viên</span>
          </span>
        </button>
        {/* 09/10: KHÔNG còn nút riêng "Mở ca kiểm tra" — mở ca nằm trong màn Ca kiểm tra (bản vẽ tối giản thầy chốt). */}
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
