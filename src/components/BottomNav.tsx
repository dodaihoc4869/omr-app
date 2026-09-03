import { GraduationCap, Timer, type LucideIcon } from 'lucide-react'
import { useAppStore, type ScreenId } from '../store/appStore'

// HAI nhóm chức năng của thầy: Học sinh + Kiểm tra. Tab "Phụ huynh" đã gỡ —
// đó là app riêng của phụ huynh, tách sang repo khác (TACHAPPHSPH.md).
const TABS: { id: ScreenId; label: string; icon: LucideIcon }[] = [
  { id: 'hocsinh', label: 'Học sinh', icon: GraduationCap },
  { id: 'examhub', label: 'Kiểm tra', icon: Timer },
]

export default function BottomNav() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)

  // Màn con thuộc tab nào: danh sách lớp (Google Sheet) nằm trong mục Học sinh;
  // các màn của ca kiểm tra nằm trong mục Kiểm tra.
  const CON_CUA_HOC_SINH: ScreenId[] = ['classlist']
  const CON_CUA_KIEM_TRA: ScreenId[] = ['examhub', 'examsetup', 'examtake', 'exammonitor', 'lichsuca']
  const activeTab: ScreenId = CON_CUA_HOC_SINH.includes(screen) ? 'hocsinh' : CON_CUA_KIEM_TRA.includes(screen) ? 'examhub' : screen

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+12px)] pt-2 pointer-events-none">
      <div className="pointer-events-auto flex gap-1 p-1.5 rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg shadow-slate-900/10">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id)}
              className={`tap-target flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm transition-colors duration-150 ${
                active
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
