import { useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import ThanhBenTrai from './components/ThanhBenTrai'
import Toast from './components/Toast'
import MessagesFab from './components/MessagesFab'
import { useAppStore } from './store/appStore'
import { loadClassList } from './lib/classlist-db'
import { datMaBiMatPhien, loadKhoaApp, loadTeacherSecret } from './lib/exam-db'
import { datDangMoKhoa } from './lib/cap-nhat-app'
import { phaiHoiLai, type BanGhiKhoa } from './lib/khoa-app'
import { docDuongVao, laLinkAppCu, laManThayQuanLy } from './lib/vai-tro'
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
import KhoaAppScreen from './screens/KhoaAppScreen'
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
  // MẬT KHẨU MỞ APP (MATKHAUMOAPP.md). CHỈ hỏi ở app quản lý của thầy — vào
  // thi, báo cáo phụ huynh, link riêng cũ đều không bao giờ bị hỏi.
  const [canHoi] = useState(() => laManThayQuanLy(location.search, location.pathname))
  // 'dang_doc' = chưa biết máy này có mật khẩu chưa. KHÔNG dựng app trong lúc
  // đó: mục 5 đòi màn khoá hiện TRƯỚC khi bất kỳ dữ liệu học sinh nào được vẽ.
  const [khoa, setKhoa] = useState<'dang_doc' | 'can_dat' | 'can_mo' | 'da_mo'>(() => (canHoi ? 'dang_doc' : 'da_mo'))
  const [banGhiKhoa, setBanGhiKhoa] = useState<BanGhiKhoa | null>(null)
  const screen = useAppStore((s) => s.screen)
  const setClassList = useAppStore((s) => s.setClassList)
  const setScreen = useAppStore((s) => s.setScreen)

  // Máy này đã đặt mật khẩu chưa. Đọc một lần lúc nạp.
  useEffect(() => {
    if (!canHoi) return
    let con = true
    void (async () => {
      try {
        const b = await loadKhoaApp()
        if (!con) return
        if (b) {
          setBanGhiKhoa(b)
          setKhoa('can_mo')
          return
        }
        // Chưa có mật khẩu. Máy đã có mã bí mật ⇒ mời thầy đặt (mục 4A). Máy
        // trắng chưa nhập mã bí mật bao giờ ⇒ vào thẳng, vì chưa có gì để khoá.
        const ma = await loadTeacherSecret()
        if (!con) return
        setKhoa(ma ? 'can_dat' : 'da_mo')
      } catch {
        // IndexedDB hỏng thì thà cho vào còn hơn khoá cứng app của thầy.
        if (con) setKhoa('da_mo')
      }
    })()
    return () => {
      con = false
    }
  }, [canHoi])

  // QUAY LẠI SAU KHI ẨN (mục 4D). Nấc mặc định `moi_lan_mo` trả false ở đây,
  // nghĩa là chuyển sang app khác vài phút rồi quay lại thì KHÔNG hỏi — chỉ
  // đóng hẳn app mở lại mới hỏi, vì lúc đó bộ nhớ phiên đã mất theo.
  useEffect(() => {
    if (khoa !== 'da_mo' || !banGhiKhoa) return
    let mocAn = 0
    const doi = () => {
      if (document.visibilityState === 'hidden') {
        mocAn = Date.now()
        return
      }
      if (!mocAn) return
      const daAn = Date.now() - mocAn
      mocAn = 0
      if (!phaiHoiLai(banGhiKhoa.hoiLai, daAn)) return
      datMaBiMatPhien(null)
      datDangMoKhoa(false)
      setKhoa('can_mo')
    }
    document.addEventListener('visibilitychange', doi)
    return () => document.removeEventListener('visibilitychange', doi)
  }, [khoa, banGhiKhoa])

  // Máy em / phụ huynh cầm link cũ thì KHÔNG đọc gì của thầy — không mở
  // IndexedDB danh sách lớp, không dựng màn nào của app quản lý. Chưa mở khoá
  // cũng vậy: không đọc danh sách lớp trước khi thầy nhập đúng mật khẩu.
  useEffect(() => {
    if (linkCu || laPhieu || khoa !== 'da_mo') return
    loadClassList().then((list) => {
      if (list.length > 0) setClassList(list)
    })
  }, [linkCu, laPhieu, khoa, setClassList])

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

  // Chưa biết có mật khẩu hay chưa: dựng một màn trống, KHÔNG dựng app. Vài
  // chục mili giây, nhưng đây là chỗ mục 5 đòi — không được thấy loáng thoáng
  // danh sách lớp rồi mới bị che.
  if (khoa === 'dang_doc') return <div className="min-h-screen" style={{ background: 'var(--nen)' }} />
  if (khoa === 'can_dat' || khoa === 'can_mo') {
    return (
      <ChanLoi o="Mở app">
        <KhoaAppScreen
          pha={khoa === 'can_dat' ? 'dat' : 'mo'}
          banGhi={banGhiKhoa}
          onMoDuoc={(ma) => {
            datMaBiMatPhien(ma)
            // Bản mới của app phải chờ tới lần mở sau: tải lại giữa chừng là
            // mất mã bí mật trong bộ nhớ và thầy bị hỏi lại giữa buổi dạy.
            datDangMoKhoa(true)
            setKhoa('da_mo')
          }}
        />
      </ChanLoi>
    )
  }

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
