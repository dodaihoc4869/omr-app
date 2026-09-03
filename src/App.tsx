import { useEffect } from 'react'
import BottomNav from './components/BottomNav'
import Toast from './components/Toast'
import MessagesFab from './components/MessagesFab'
import { useAppStore } from './store/appStore'
import { loadClassList } from './lib/classlist-db'
import { docDuongVao, manDauCua, nhoVai, vaiDaNho, xoaDauVetToken, type VaiTro } from './lib/vai-tro'
import { datManifestTheoVai } from './lib/pwa-install'
import DaiCaiApp from './components/DaiCaiApp'
import { loadTeacherSecret, saveTokenHocSinh, saveTokenPhuHuynh } from './lib/exam-db'
import ClassListScreen from './screens/ClassListScreen'
import ExamHubScreen from './screens/ExamHubScreen'
import ExamSetupScreen from './screens/ExamSetupScreen'
import NganHangDeScreen from './screens/NganHangDeScreen'
import ExamTakeScreen from './screens/ExamTakeScreen'
import ExamMonitorScreen from './screens/ExamMonitorScreen'
import LichSuCaScreen from './screens/LichSuCaScreen'
import ParentScreen from './screens/ParentScreen'
import StudentProfileScreen from './screens/StudentProfileScreen'
import RegistrationManagerScreen from './screens/RegistrationManagerScreen'
import HocSinhScreen from './screens/HocSinhScreen'

// Icon tin nhắn nổi chỉ dành cho THẦY — ẩn ở các màn phụ huynh/học sinh tự
// dùng trên máy riêng của họ (họ không cần thấy hộp thư của thầy).
const HIDE_FAB_ON: string[] = ['parent', 'studentprofile', 'examtake', 'nganhangde']
// Thanh menu dưới (Lớp/Kiểm tra/Phụ huynh...) chỉ dành cho THẦY điều hướng
// giữa các màn quản lý — ẩn hẳn khi học sinh vào bằng link mời làm bài, để
// không còn lối bấm ra khỏi màn thi (tránh xao nhãng, tránh lộ menu quản lý
// không liên quan tới học sinh).
const HIDE_BOTTOMNAV_ON: string[] = ['examtake']

// Màn nào vai nào được mở. Máy học sinh / phụ huynh KHÔNG có lối nào bấm sang
// màn quản lý của thầy — kể cả khi state bị đặt nhầm.
const MAN_CUA_VAI: Record<'hs' | 'ph', string[]> = {
  hs: ['studentprofile', 'examtake'],
  ph: ['parent'],
}

function App() {
  const screen = useAppStore((s) => s.screen)
  const setClassList = useAppStore((s) => s.setClassList)
  const setScreen = useAppStore((s) => s.setScreen)
  const vai = useAppStore((s) => s.vai)
  const setVai = useAppStore((s) => s.setVai)

  useEffect(() => {
    loadClassList().then((list) => {
      if (list.length > 0) setClassList(list)
    })
  }, [setClassList])

  // ĐƯỜNG LINK QUYẾT ĐỊNH VAI (BA-APP.md đợt 1). Thứ tự: link mời làm bài
  // (?examCode=) thắng — em đang được gọi vào thi thì mở thẳng màn thi; sau đó
  // mới tới link riêng /hs/<token>, /ph/<token>, /gv. Token lưu vào máy rồi
  // xoá khỏi thanh địa chỉ ngay.
  useEffect(() => {
    const { vai: vaiLink, token, maCa } = docDuongVao(location.search)
    const dungVai = async (): Promise<VaiTro | null> => {
      if (vaiLink === 'hs' && token) await saveTokenHocSinh(token)
      if (vaiLink === 'ph' && token) await saveTokenPhuHuynh(token)
      if (vaiLink) {
        nhoVai(vaiLink)
        return vaiLink
      }
      // Đường trống (bookmark, trình duyệt khôi phục tab, app đã cài mở lại sau
      // khi thanh địa chỉ đã bị dọn): lấy vai đã nhớ, trừ máy thầy.
      return vaiDaNho(!!(await loadTeacherSecret()))
    }
    dungVai()
      .catch(() => null)
      .then((vai) => {
        if (vai) {
          setVai(vai)
          // Manifest theo vai: học sinh và phụ huynh cài ra HAI app khác nhau
          // (khác tên, khác biểu tượng) để không cài nhầm app của nhau.
          datManifestTheoVai(vai)
          if (!maCa) setScreen(manDauCua(vai))
        }
        xoaDauVetToken()
      })
    if (maCa) setScreen('examtake')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Vai hs/ph: ép về đúng màn của vai nếu state trỏ đi chỗ khác.
  const manHopLe = vai === 'hs' || vai === 'ph' ? MAN_CUA_VAI[vai].includes(screen) : true
  const manHienThi = manHopLe ? screen : manDauCua(vai as 'hs' | 'ph')
  const laKhach = vai === 'hs' || vai === 'ph'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Toast />
      {/* Dải cài app: chỉ vai học sinh/phụ huynh, và không chen vào màn đang làm bài. */}
      {laKhach && manHienThi !== 'examtake' && <DaiCaiApp vai={vai as 'hs' | 'ph'} />}
      {manHienThi === 'classlist' && <ClassListScreen />}
      {manHienThi === 'examhub' && <ExamHubScreen />}
      {manHienThi === 'examsetup' && <ExamSetupScreen />}
      {manHienThi === 'nganhangde' && <NganHangDeScreen />}
      {manHienThi === 'examtake' && <ExamTakeScreen />}
      {manHienThi === 'exammonitor' && <ExamMonitorScreen />}
      {manHienThi === 'lichsuca' && <LichSuCaScreen />}
      {manHienThi === 'parent' && <ParentScreen />}
      {manHienThi === 'studentprofile' && <StudentProfileScreen />}
      {manHienThi === 'registrationmanager' && <RegistrationManagerScreen />}
      {manHienThi === 'hocsinh' && <HocSinhScreen />}
      {!laKhach && !HIDE_FAB_ON.includes(manHienThi) && <MessagesFab />}
      {!laKhach && !HIDE_BOTTOMNAV_ON.includes(manHienThi) && <BottomNav />}
    </div>
  )
}

export default App
