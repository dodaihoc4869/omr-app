// THANH ĐIỀU HƯỚNG BÊN TRÁI — chỉ hiện trên màn hình rộng (≥ 1024px).
//
// Điện thoại giữ nguyên thanh dưới đáy: ngón cái với tới được, và màn hẹp thì
// một cột là đúng. Màn rộng mà vẫn một cột thì thầy phải quay về màn Kiểm tra
// mỗi lần đổi việc, trong khi hai phần ba màn hình bỏ trống.
//
// Danh sách mục ở đây PHẢI khớp với các thẻ trong màn Kiểm tra; thêm màn mới
// thì thêm cả hai chỗ, lệch nhau là thầy tìm không ra chức năng.
import { useCallback, useEffect, useRef, useState } from 'react'
import { GraduationCap, Timer, Library, ClipboardList, Presentation, FilePlus2, Users } from 'lucide-react'
import { useAppStore, type ScreenId } from '../store/appStore'
import { chan, datRong, docRong, luuRong, RONG_MAC_DINH, RONG_MAX, RONG_MIN } from '../lib/rong-cot'

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
      { id: 'hocsinh', ten: 'Hồ sơ học sinh', icon: Users },
      { id: 'classlist', ten: 'Danh sách lớp', icon: ClipboardList },
    ],
  },
  {
    ten: 'Kiểm tra',
    icon: Timer,
    muc: [
      { id: 'examsetup', ten: 'Mở ca kiểm tra', icon: FilePlus2 },
      { id: 'nganhangde', ten: 'Ngân hàng câu hỏi', icon: Library },
      { id: 'lichsuca', ten: 'Ca thi', icon: ClipboardList, con: ['exammonitor'] },
      { id: 'goilenbang', ten: 'Gọi lên bảng', icon: Presentation },
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
      <button
        type="button"
        onClick={() => setScreen('examhub')}
        className="tap-target text-left"
        style={{ fontFamily: 'var(--serif)', fontSize: 'var(--cx-4)', fontWeight: 700, color: 'var(--muc)', padding: '0 var(--k3)', marginBottom: 'var(--k5)' }}
      >
        Đỗ Đại Học
      </button>

      {NHOM.map((n) => (
        <div key={n.ten} style={{ marginBottom: 'var(--k5)' }}>
          <div
            className="font-bold"
            style={{ fontFamily: 'var(--sans)', fontSize: 'var(--cx-1)', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--mo)', padding: '0 var(--k3)', marginBottom: 'var(--k2)' }}
          >
            {n.ten}
          </div>
          <div className="flex flex-col" style={{ gap: 2 }}>
            {n.muc.map((m) => {
              const Icon = m.icon
              const dang = screen === m.id || (m.con ?? []).includes(screen)
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setScreen(m.id)}
                  aria-current={dang ? 'page' : undefined}
                  className="tap-target flex items-center font-bold text-left"
                  style={{
                    gap: 'var(--k3)',
                    minHeight: 42,
                    padding: '0 var(--k3)',
                    borderRadius: 'var(--bo-1)',
                    background: dang ? 'var(--tim-nen)' : 'transparent',
                    color: dang ? 'var(--tim)' : 'var(--nhat)',
                    fontFamily: 'var(--sans)',
                    fontSize: 'var(--cx-2)',
                    transitionProperty: 'background-color, color',
                    transitionDuration: 'var(--nhanh)',
                  }}
                >
                  <Icon size={18} strokeWidth={dang ? 2.4 : 2} />
                  {m.ten}
                </button>
              )
            })}
          </div>
        </div>
      ))}
      <TayKeo />
    </nav>
  )
}
