import { useEffect } from 'react'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import { useAppStore } from './store/appStore'
import { loadClassList } from './lib/classlist-db'
import ScanScreen from './screens/ScanScreen'
import ReviewScreen from './screens/ReviewScreen'
import AnswerKeyScreen from './screens/AnswerKeyScreen'
import ResultsScreen from './screens/ResultsScreen'
import PrintSheetScreen from './screens/PrintSheetScreen'
import ClassListScreen from './screens/ClassListScreen'
import ExamHubScreen from './screens/ExamHubScreen'
import ExamSetupScreen from './screens/ExamSetupScreen'
import ExamTakeScreen from './screens/ExamTakeScreen'
import ExamMonitorScreen from './screens/ExamMonitorScreen'

function App() {
  const screen = useAppStore((s) => s.screen)
  const setClassList = useAppStore((s) => s.setClassList)
  const setScreen = useAppStore((s) => s.setScreen)

  useEffect(() => {
    loadClassList().then((list) => {
      if (list.length > 0) setClassList(list)
    })
  }, [setClassList])

  // Học sinh mở link mời (?examCode=...) — vào thẳng màn "Vào thi", không cần chạm menu.
  useEffect(() => {
    if (new URLSearchParams(location.search).get('examCode')) setScreen('examtake')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Toast />
      {screen === 'scan' && <ScanScreen />}
      {screen === 'review' && <ReviewScreen />}
      {screen === 'answerkey' && <AnswerKeyScreen />}
      {screen === 'results' && <ResultsScreen />}
      {screen === 'print' && <PrintSheetScreen />}
      {screen === 'classlist' && <ClassListScreen />}
      {screen === 'examhub' && <ExamHubScreen />}
      {screen === 'examsetup' && <ExamSetupScreen />}
      {screen === 'examtake' && <ExamTakeScreen />}
      {screen === 'exammonitor' && <ExamMonitorScreen />}
      <BottomNav />
    </div>
  )
}

export default App
