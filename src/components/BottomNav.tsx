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
    <nav className="fixed bottom-0 inset-x-0 z-40 flex justify-center pb-[calc(env(safe-area-inset-bottom)+14px)] pt-2 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-900/10 transition-all">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setScreen(tab.id)}
              className={`tap-target flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-sm transition-all duration-150 ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/80 dark:text-blue-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.3 : 1.9} className={active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
