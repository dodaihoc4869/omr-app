// THANH ĐIỀU HƯỚNG BÊN TRÁI — chỉ hiện trên màn hình rộng (≥ 1024px).
//
// Điện thoại giữ nguyên thanh dưới đáy: ngón cái với tới được, và màn hẹp thì
// một cột là đúng. Màn rộng mà vẫn một cột thì thầy phải quay về màn Kiểm tra
// mỗi lần đổi việc, trong khi hai phần ba màn hình bỏ trống.
//
// Danh sách mục ở đây PHẢI khớp với các thẻ trong màn Kiểm tra; thêm màn mới
// thì thêm cả hai chỗ, lệch nhau là thầy tìm không ra chức năng.
import { useCallback, useEffect, useRef, useState } from 'react'
import { GraduationCap, Timer, Library, ClipboardList, Presentation, FilePlus2, Users, MessageCircleQuestion } from 'lucide-react'
import { useAppStore, type ScreenId } from '../store/appStore'
import { chan, datRong, docRong, luuRong, RONG_MAC_DINH, RONG_MAX, RONG_MIN } from '../lib/rong-cot'
import LogoGiaoVien from './LogoGiaoVien'

interface Muc {
  id: ScreenId
  ten: string
  icon: typeof Timer
  /** Màn con cũng tô sáng mục cha này. */
  con?: ScreenId[]
}

const NHOM: { ten: string; icon: typeof Timer; muc: Muc[] }[] = [
  {
    ten: 'Học sinh',
    icon: GraduationCap,
    muc: [
      // "Danh sách lớp" bỏ khỏi thanh (thầy chốt 04-09 tối): danh sách đã nạp
      // lên máy chủ và app tự đọc, không còn việc gì để thầy vào màn đó làm.
      { id: 'hocsinh', ten: 'Hồ sơ học sinh', icon: Users },
    ],
  },
  {
    ten: 'Kiểm tra',
    icon: Timer,
    muc: [
      { id: 'examsetup', ten: 'Mở ca kiểm tra', icon: FilePlus2 },
      { id: 'nganhangde', ten: 'Ngân hàng câu hỏi', icon: Library },
      { id: 'lichsuca', ten: 'Ca thi', icon: ClipboardList, con: ['exammonitor'] },
      { id: 'goilenbang', ten: 'Phân công', icon: Presentation },
      { id: 'cauhoi', ten: 'Học sinh hỏi', icon: MessageCircleQuestion },
    ],
  },
]

/** TAY KÉO CHỈNH BỀ RỘNG. Nằm đè lên đường viền phải của thanh trái.
 *
 * Kéo bằng Pointer Events chứ không phải mouse: một mã chạy cho cả chuột,
 * bút cảm ứng và ngón tay trên màn cảm ứng. `setPointerCapture` giữ sự kiện
 * dính vào tay kéo, nên kéo nhanh ra ngoài mép cũng không tuột.
 *
 * Bấm đúp để về mặc định; mũi tên trái phải chỉnh từng 16px cho thầy dùng bàn
 * phím. */
function TayKeo() {
  const [rong, setRong] = useState(RONG_MAC_DINH)
  const dangKeo = useRef(false)

  // Đọc bề rộng đã nhớ NGAY lúc dựng, trước khi trình duyệt vẽ khung — chậm
  // một nhịp là thầy thấy thanh trái nhảy bề rộng.
  useEffect(() => {
    const r = docRong()
    setRong(r)
    datRong(r)
  }, [])

  const dat = useCallback((px: number) => {
    const r = chan(px)
    setRong(r)
    datRong(r)
    return r
  }, [])

  const batDau = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    dangKeo.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    document.body.style.cursor = 'col-resize'
    // Cấm bôi đen chữ trong lúc kéo, không thì cả trang bị quét xanh.
    document.body.style.userSelect = 'none'
  }

  const keo = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dangKeo.current) return
    dat(e.clientX)
  }

  const ketThuc = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dangKeo.current) return
    dangKeo.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    luuRong(rong)
  }

  const phim = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const b = e.key === 'ArrowLeft' ? -16 : e.key === 'ArrowRight' ? 16 : 0
    if (!b) return
    e.preventDefault()
    luuRong(dat(rong + b))
  }

  return (
    <div
      className="tay-keo"
      role="separator"
      aria-orientation="vertical"
      aria-label="Kéo để chỉnh bề rộng thanh bên trái"
      aria-valuenow={rong}
      aria-valuemin={RONG_MIN}
      aria-valuemax={RONG_MAX}
      tabIndex={0}
      onPointerDown={batDau}
      onPointerMove={keo}
      onPointerUp={ketThuc}
      onPointerCancel={ketThuc}
      onKeyDown={phim}
      onDoubleClick={() => luuRong(dat(RONG_MAC_DINH))}
      title="Kéo để chỉnh bề rộng · bấm đúp để về mặc định"
    />
  )
}

export default function ThanhBenTrai() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)

  return (
    <nav className="ben-trai" aria-label="Điều hướng chính">
      {/* Brand Header với Logo Giáo viên phong cách Google */}
      <div className="pb-4 mb-3 border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setScreen('examhub')}
          className="tap-target text-left w-full rounded-2xl hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition p-2 -m-2 flex items-center"
          title="Trang chủ kiểm tra tại lớp"
        >
          <LogoGiaoVien size={38} hienChu={true} />
        </button>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto pr-1">
        {NHOM.map((n) => (
          <div key={n.ten} className="space-y-1">
            <div
              className="font-bold px-3 py-1 text-[11px] tracking-wider uppercase text-slate-400 dark:text-slate-500 select-none"
              style={{ fontFamily: 'var(--sans)' }}
            >
              {n.ten}
            </div>
            <div className="flex flex-col gap-0.5">
              {n.muc.map((m) => {
                const Icon = m.icon
                const dang = screen === m.id || (m.con ?? []).includes(screen)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setScreen(m.id)}
                    aria-current={dang ? 'page' : undefined}
                    className={`tap-target flex items-center gap-3 px-3.5 py-2.5 rounded-full font-medium text-left transition-all duration-150 ${
                      dang
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    style={{
                      fontFamily: 'var(--sans)',
                      fontSize: 'var(--cx-2)',
                    }}
                  >
                    <Icon
                      size={19}
                      strokeWidth={dang ? 2.3 : 1.8}
                      className={`shrink-0 transition-colors ${
                        dang ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    />
                    <span className="truncate">{m.ten}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer nhỏ phiên làm việc Google style */}
      <div className="pt-3 mt-auto border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 px-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span>Sẵn sàng giảng dạy</span>
        </span>
      </div>

      <TayKeo />
    </nav>
  )
}
