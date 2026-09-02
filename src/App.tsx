import { useEffect } from 'react'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import { useAppStore } from './store/appStore'
import { loadClassList } from './lib/classlist-db'
import ClassListScreen from './screens/ClassListScreen'
import ExamHubScreen from './screens/ExamHubScreen'
import ExamSetupScreen from './screens/ExamSetupScreen'
import ExamTakeScreen from './screens/ExamTakeScreen'
import ExamMonitorScreen from './screens/ExamMonitorScreen'
import ParentScreen from './screens/ParentScreen'
import ParentMessagesScreen from './screens/ParentMessagesScreen'

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
      {screen === 'classlist' && <ClassListScreen />}
      {screen === 'examhub' && <ExamHubScreen />}
      {screen === 'examsetup' && <ExamSetupScreen />}
      {screen === 'examtake' && <ExamTakeScreen />}
      {screen === 'exammonitor' && <ExamMonitorScreen />}
      {screen === 'parent' && <ParentScreen />}
      {screen === 'parentmessages' && <ParentMessagesScreen />}
      <BottomNav />
    </div>
  )
}

export default App
