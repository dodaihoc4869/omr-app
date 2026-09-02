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

function App() {
  const screen = useAppStore((s) => s.screen)
  const setClassList = useAppStore((s) => s.setClassList)

  useEffect(() => {
    loadClassList().then((list) => {
      if (list.length > 0) setClassList(list)
    })
  }, [setClassList])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Toast />
      {screen === 'scan' && <ScanScreen />}
      {screen === 'review' && <ReviewScreen />}
      {screen === 'answerkey' && <AnswerKeyScreen />}
      {screen === 'results' && <ResultsScreen />}
      {screen === 'print' && <PrintSheetScreen />}
      {screen === 'classlist' && <ClassListScreen />}
      <BottomNav />
    </div>
  )
}

export default App
