// THANH ĐIỀU HƯỚNG BÊN TRÁI — chỉ hiện trên màn hình rộng (≥ 1024px).
//
// Điện thoại giữ nguyên thanh dưới đáy: ngón cái với tới được, và màn hẹp thì
// một cột là đúng. Màn rộng mà vẫn một cột thì thầy phải quay về màn Kiểm tra
// mỗi lần đổi việc, trong khi hai phần ba màn hình bỏ trống.
//
// Danh sách mục ở đây PHẢI khớp với các thẻ trong màn Kiểm tra; thêm màn mới
// thì thêm cả hai chỗ, lệch nhau là thầy tìm không ra chức năng.
import { GraduationCap, Timer, Library, ClipboardList, Presentation, FilePlus2, Users } from 'lucide-react'
import { useAppStore, type ScreenId } from '../store/appStore'

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
    </nav>
  )
}
