import { countUnreviewed, useAppStore, type ScreenId } from '../store/appStore'

const TABS: { id: ScreenId; label: string; icon: string }[] = [
  { id: 'scan', label: 'Quét', icon: '📷' },
  { id: 'review', label: 'Duyệt', icon: '🚩' },
  { id: 'answerkey', label: 'Đáp án', icon: '📝' },
  { id: 'results', label: 'Kết quả', icon: '📊' },
  { id: 'print', label: 'In phiếu', icon: '🖨️' },
  { id: 'classlist', label: 'Lớp', icon: '👥' },
  { id: 'examhub', label: 'Kiểm tra', icon: '⏱️' },
]

export default function BottomNav() {
  const screen = useAppStore((s) => s.screen)
  const setScreen = useAppStore((s) => s.setScreen)
  const sheets = useAppStore((s) => s.sheets)
  const unreviewed = countUnreviewed(sheets)

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setScreen(tab.id)}
          className={`tap-target relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors duration-150 ${
            screen === tab.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <span className="text-lg leading-none">{tab.icon}</span>
          <span className="text-[11px] leading-none">{tab.label}</span>
          {tab.id === 'review' && unreviewed > 0 && (
            <span className="absolute top-1 right-1/4 min-w-[16px] h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] flex items-center justify-center font-bold">
              {unreviewed}
            </span>
          )}
        </button>
      ))}
    </nav>
  )
}
