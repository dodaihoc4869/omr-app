import { ScanLine, FlagTriangleRight, SquarePen, ChartColumn, Printer, Users, Timer, type LucideIcon } from 'lucide-react'
import { countUnreviewed, useAppStore, type ScreenId } from '../store/appStore'

const TABS: { id: ScreenId; label: string; icon: LucideIcon }[] = [
  { id: 'scan', label: 'Quét', icon: ScanLine },
  { id: 'review', label: 'Duyệt', icon: FlagTriangleRight },
  { id: 'answerkey', label: 'Đáp án', icon: SquarePen },
  { id: 'results', label: 'Kết quả', icon: ChartColumn },
  { id: 'print', label: 'In phiếu', icon: Printer },
  { id: 'classlist', label: 'Lớp', icon: Users },
  { id: 'examhub', label: 'Kiểm tra', icon: Timer },
]

export default function BottomNav() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const sheets = useAppStore((s) => s.sheets)
  const unreviewed = countUnreviewed(sheets)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex">
      {TABS.map((tab) => {
        const Icon = tab.icon
        const active = screen === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => setScreen(tab.id)}
            className={`tap-target relative flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors duration-150 ${
              active ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'
            }`}
          >
            <span
              className={`flex items-center justify-center w-9 h-7 rounded-full transition-colors duration-150 ${
                active ? 'bg-indigo-100 dark:bg-indigo-950' : ''
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} />
            </span>
            <span className={`text-[11px] leading-none ${active ? 'font-semibold' : ''}`}>{tab.label}</span>
            {tab.id === 'review' && unreviewed > 0 && (
              <span className="absolute top-1 right-1/4 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
                {unreviewed}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
