import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import ThanhBenTrai from './components/ThanhBenTrai'
import Toast from './components/Toast'
import MessagesFab from './components/MessagesFab'
import { useAppStore } from './store/appStore'
import { loadClassList } from './lib/classlist-db'
import { docDuongVao, laLinkAppCu } from './lib/vai-tro'
import ClassListScreen from './screens/ClassListScreen'
import ExamHubScreen from './screens/ExamHubScreen'
import ExamSetupScreen from './screens/ExamSetupScreen'
import NganHangDeScreen from './screens/NganHangDeScreen'
import ExamTakeScreen from './screens/ExamTakeScreen'
import ExamMonitorScreen from './screens/ExamMonitorScreen'
import LichSuCaScreen from './screens/LichSuCaScreen'
import HocSinhScreen from './screens/HocSinhScreen'
import AppDaChuyenScreen from './screens/AppDaChuyenScreen'
import GoiLenBangScreen from './screens/GoiLenBangScreen'
import PhieuScreen from './screens/PhieuScreen'
import ChanLoi from './components/ChanLoi'

// APP GIÁO VIÊN. Màn đăng ký, hồ sơ, lịch sử, bài tập và nhắn tin PHÍA HỌC SINH
// và PHÍA PHỤ HUYNH đã gỡ khỏi repo này — hai app đó tách sang repo riêng
// (TACHAPPHSPH.md phần 1).
//
// Còn giữ MÀN LÀM BÀI: link mời `/t/<mã ca>` vẫn phải chạy để lớp thi và làm
// bài tập được trong lúc app học sinh mới chưa xong. Nó không có mục nào trên
// menu — chỉ mở được bằng đúng link mời.
/** Tên màn để câu báo lỗi nói đúng chỗ ("Màn Mở ca kiểm tra gặp lỗi"). */
const TEN_MAN: Record<string, string> = {
  classlist: 'Danh sách lớp',
  examhub: 'Kiểm tra tại lớp',
  examsetup: 'Mở ca kiểm tra',
  nganhangde: 'Ngân hàng câu hỏi',
  examtake: 'Làm bài',
  exammonitor: 'Theo dõi ca',
  lichsuca: 'Ca thi',
  hocsinh: 'Học sinh',
  goilenbang: 'Gọi lên bảng',
}

const HIDE_FAB_ON: string[] = ['examtake', 'nganhangde']
const HIDE_BOTTOMNAV_ON: string[] = ['examtake']

function App() {
  // LINK CŨ CỦA EM / PHỤ HUYNH: chặn ngay trước khi dựng app thầy. Tính một
  // lần lúc nạp — sau đó app không đổi đường nữa.
  const [linkCu] = useState(() => laLinkAppCu(location.search, location.pathname))
  // LINK PHIẾU của phụ huynh (`/p#…`): trả về đúng một trang phiếu, KHÔNG dựng
  // app quản lý. Tính một lần lúc nạp, trước mọi hiệu ứng — máy phụ huynh
  // không được chạm vào IndexedDB, danh sách lớp hay hộp thư của thầy.
  const [laPhieu] = useState(() => docDuongVao(location.search, location.pathname).vai === 'phieu')
  const screen = useAppStore((s) => s.screen)
  const setClassList = useAppStore((s) => s.setClassList)
  const setScreen = useAppStore((s) => s.setScreen)

  // Máy em / phụ huynh cầm link cũ thì KHÔNG đọc gì của thầy — không mở
  // IndexedDB danh sách lớp, không dựng màn nào của app quản lý.
  useEffect(() => {
    if (linkCu || laPhieu) return
    loadClassList().then((list) => {
      if (list.length > 0) setClassList(list)
    })
  }, [linkCu, laPhieu, setClassList])

  // Link mời làm bài (?examCode=) mở thẳng màn thi. Không có thì vào app thầy.
  useEffect(() => {
    if (linkCu || laPhieu) return
    const { maCa } = docDuongVao(location.search, location.pathname)
    if (maCa) setScreen('examtake')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (laPhieu) {
    return (
      <ChanLoi o="Phiếu kết quả">
        <PhieuScreen />
      </ChanLoi>
    )
  }
  if (linkCu) return <AppDaChuyenScreen />

  // MÀN LÀM BÀI của học sinh không phải app quản lý: không thanh bên, không
  // thanh đáy, để em tập trung vào bài.
  const laManThi = screen === 'examtake'

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100${laManThi ? '' : ' khung-app'}`}>
      <Toast />
      {!laManThi && <ThanhBenTrai />}
      <div className="khung-noi-dung">
        <div className="giua-noi-dung">
      {/* Một màn ném lỗi thì chỉ màn đó hiện báo lỗi, app KHÔNG trắng. key theo
          `screen` để lỗi cũ không dính lại khi thầy sang màn khác. */}
      <ChanLoi key={screen} o={TEN_MAN[screen]} veManChinh={() => setScreen('examhub')}>
        {screen === 'classlist' && <ClassListScreen />}
        {screen === 'examhub' && <ExamHubScreen />}
        {screen === 'examsetup' && <ExamSetupScreen />}
        {screen === 'nganhangde' && <NganHangDeScreen />}
        {screen === 'examtake' && <ExamTakeScreen />}
        {screen === 'exammonitor' && <ExamMonitorScreen />}
        {screen === 'lichsuca' && <LichSuCaScreen />}
        {screen === 'hocsinh' && <HocSinhScreen />}
        {screen === 'goilenbang' && <GoiLenBangScreen />}
      </ChanLoi>
        </div>
      </div>
      {!HIDE_FAB_ON.includes(screen) && <MessagesFab />}
      {!HIDE_BOTTOMNAV_ON.includes(screen) && <BottomNav />}
    </div>
  )
}

export default App
