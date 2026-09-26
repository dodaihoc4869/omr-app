import './styles/teacher-layout.css'
import './styles/vo-thay.css'
import { lazy, Suspense, useEffect, useState } from 'react'
import BottomNav from './components/BottomNav'
import ThanhBenTrai from './components/ThanhBenTrai'
import Toast from './components/Toast'
import { useAppStore } from './store/appStore'
import './components/m3'
import { apDungGiaoDien, docGiaoDien } from './lib/giao-dien-thay'
import { loadClassList } from './lib/classlist-db'
import { datMaBiMatPhien, loadKhoaApp, loadTeacherSecret } from './lib/exam-db'
import { catPhien, donPhien, khoiPhucPhien } from './lib/khoa-phien'
import { datDangMoKhoa } from './lib/cap-nhat-app'
import { phaiHoiLai, type BanGhiKhoa } from './lib/khoa-app'
import { docDuongVao, laLinkAppCu, laManThayQuanLy } from './lib/vai-tro'
import KhoaMayThayScreen from './screens/KhoaMayThayScreen'
import { ganCauNoi, goCauNoi } from './lib/cau-noi-ddh'
import ExamTakeScreen from './screens/ExamTakeScreen'
import AppDaChuyenScreen from './screens/AppDaChuyenScreen'
import StudentPortalScreen from './screens/StudentPortalScreen'


// TÁM MÀN CHỈ THẦY DÙNG — NẠP MUỘN.
//
// Đo trên bản live 11/09: gói mã `index-D2jFOak-.js` nặng **1 527 KB** (465 KB
// qua gzip), và MỌI máy tải trọn gói ấy — kể cả điện thoại phụ huynh chỉ mở một
// trang báo cáo, kể cả máy em chỉ làm bài. Thầy chốt: "phụ huynh mở bị chậm".
//
// Tách ở đây là chỗ rẻ nhất và an toàn nhất: Vite cắt mỗi màn thành một mảnh
// riêng, phụ huynh và học sinh không tải mảnh nào của app quản lý. Thầy tốn
// thêm một lượt tải nhỏ lần đầu vào mỗi màn, và service worker cất lại ngay.
//
// HAI MÀN GIỮ NGUYÊN NẠP SỚM, và chỉ hai:
//   · `PhieuScreen` — trang phụ huynh mở. Nạp muộn thì đúng người cần nhanh
//     nhất lại phải chờ thêm một vòng mạng.
//   · `ExamTakeScreen` — màn em làm bài. Ngày thi không đánh cược vào một mảnh
//     mã tải muộn.
//   · `AppDaChuyenScreen` — tấm biển "link này đã ngừng dùng". Nạp muộn thì em
//     bấm link cũ thấy một khoảnh trắng rồi mới thấy chữ; màn này nhỏ xíu nên
//     tách ra chẳng được bao nhiêu. Phép kiểm `link-cu-hs-ph` bắt đúng chỗ này.
//
// Mảnh nạp muộn hỏng vì thầy đang mở bản cũ đã được `batLoiThieuManh()` trong
// `main.tsx` lo: bắt đúng lỗi thiếu mảnh rồi tự tải lại một lần.
const ExamHubScreen = lazy(() => import('./screens/ExamHubScreen'))
const ClassListScreen = lazy(() => import('./screens/ClassListScreen'))
const ExamSetupScreen = lazy(() => import('./screens/ExamSetupScreen'))
const NganHangDeScreen = lazy(() => import('./screens/NganHangDeScreen'))
const ExamMonitorScreen = lazy(() => import('./screens/ExamMonitorScreen'))
const LichSuCaScreen = lazy(() => import('./screens/LichSuCaScreen'))
const GoiLenBangScreen = lazy(() => import('./screens/GoiLenBangScreen'))
const CauHoiScreen = lazy(() => import('./screens/CauHoiScreen'))
const CaiDatScreen = lazy(() => import('./screens/CaiDatScreen'))
// CỔNG PHỤ HUYNH NẠP MUỘN. Link phụ huynh dùng hằng ngày là `/p#…` (phiếu kết
// quả) — màn ấy vẫn nạp SỚM. Cổng tra cứu `/ph` thì mở thưa hơn nhiều, mà để
// nó nhập thẳng là em học sinh nào cũng phải tải kèm.
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
  examhub: 'Kiên trì',
  examsetup: 'Mở ca kiểm tra',
  nganhangde: 'Ngân hàng câu hỏi',
  examtake: 'Làm bài',
  exammonitor: 'Theo dõi ca',
  lichsuca: 'Ca kiểm tra',
  hocsinh: 'Học sinh',
  toancanh: 'Toàn cảnh một em',
  goilenbang: 'Gọi lên bảng',
  giaobtvn: 'Giao bài tập về nhà',
  cauhoi: 'Học sinh hỏi',
  khodegiao: 'Giao đề theo tuần',
  caidat: 'Cài đặt',
}

const HIDE_BOTTOMNAV_ON: string[] = ['examtake']

function App() {
  // LINK CŨ CỦA EM / PHỤ HUYNH: chặn ngay trước khi dựng app thầy. Tính một
  // lần lúc nạp — sau đó app không đổi đường nữa.
  const [linkCu] = useState(() => laLinkAppCu(location.search, location.pathname))
  // LINK PHIẾU của phụ huynh (`/p#…`): trả về đúng một trang phiếu, KHÔNG dựng
  // app quản lý. Tính một lần lúc nạp, trước mọi hiệu ứng — máy phụ huynh
  // không được chạm vào IndexedDB, danh sách lớp hay hộp thư của thầy.
  const [laPhieu] = useState(() => docDuongVao(location.search, location.pathname).vai === 'phieu')
  // LINK XEM ĐIỂM của em (`/d/<mã ca>`): cũng là máy của EM, không phải máy
  // thầy — không hỏi mật khẩu, không đọc dữ liệu của thầy, không có cầu nối.
  //
  // Đường này mở CHÍNH màn làm bài ở trạng thái "Đã nộp bài", không dựng một
  // màn điểm riêng: thầy chốt 07/09 là em phải thấy đúng cái màn lúc vừa thi
  // xong, đủ bốn nút Xem điểm chi tiết · Xem báo cáo học tập · Xem đề & lời
  // giải · Hỏi bài Thầy.
  const [laXemDiem] = useState(() => docDuongVao(location.search, location.pathname).vai === 'diem')
  // CỔNG HỌC SINH (/hoc-sinh, /hs, ?vai=hocsinh): cổng thông tin riêng của em — đăng nhập,
  // xem điểm, nộp BTVN, khắc phục câu sai, vào thi.
  // Khi mở từ màn hình chính iOS (start_url="./" mở "/" trần), nếu máy đã dùng vai 'hs' thì vào thẳng cổng học sinh.
  // VAI CHỈ ĐẾN TỪ ĐƯỜNG LINK. Không hỏi `vaiDaDung()` nữa (thầy chốt 15/09:
  // "app học sinh và phụ huynh cũng phải tách biệt hoàn toàn không được nhảy
  // lẫn lộn nhau"). Khoá `ddh.vaiDaDung` nằm trong localStorage CHUNG GỐC của
  // cả ba app, nên máy nào mở hai app thì khoá ấy là của app mở sau — đó đúng
  // là cái cửa để hai cổng nhảy sang nhau. Nay `/` trần là ngõ cụt, không suy
  // ra vai nào cả.
  const [laHocSinh] = useState(() => docDuongVao(location.search, location.pathname).vai === 'hocsinh')
  // CỔNG PHỤ HUYNH (/phu-huynh, /ph, ?vai=phuhuynh): cổng thông tin cho phụ huynh — tra cứu điểm của con bằng SBD, giao bài tập.
  const [laPhuHuynh] = useState(() => docDuongVao(location.search, location.pathname).vai === 'phuhuynh')
  // MẬT KHẨU MỞ APP (MATKHAUMOAPP.md). CHỈ hỏi ở app quản lý của thầy — vào
  // thi, báo cáo phụ huynh, link riêng cũ đều không bao giờ bị hỏi.
  const [canHoi] = useState(() => laManThayQuanLy(location.search, location.pathname))
  // 'dang_doc' = chưa biết máy này có mật khẩu chưa. KHÔNG dựng app trong lúc
  // đó: mục 5 đòi màn khoá hiện TRƯỚC khi bất kỳ dữ liệu học sinh nào được vẽ.
  const [khoa, setKhoa] = useState<'dang_doc' | 'chua_cap_quyen' | 'can_dat' | 'can_mo' | 'da_mo'>(() => (canHoi ? 'dang_doc' : 'da_mo'))
  const [banGhiKhoa, setBanGhiKhoa] = useState<BanGhiKhoa | null>(null)
  // Bản ghi vân tay của MÁY NÀY. Đọc cùng lúc với `khoaApp` để màn khoá gọi
  // được vân tay ngay khi dựng, không phải chờ thêm một vòng đọc IndexedDB.
  const screen = useAppStore((s) => s.screen)

  // GIAO DIỆN SÁNG/TỐI của app thầy (Cài đặt → Giao diện): áp dụng thuộc tính `data-giao-dien` ngay khi mở. Chỉ ở vỏ giáo viên.
  useEffect(() => {
    if (canHoi) apDungGiaoDien(docGiaoDien())
  }, [canHoi])
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
          // GIỮ ĐĂNG NHẬP THEO TAB (GIU-DANG-NHAP-THEO-TAB.md mục 4B). Tab này
          // đã mở khoá rồi thì tải lại trang không hỏi lại. Không có phiên —
          // tab mới, tab cũ đã đóng, hoặc thầy tắt ô gạt — thì hỏi như cũ.
          // `khoiPhucPhien` tự dọn khoá phiên rác khi thiếu bản mã.
          const maPhien = await khoiPhucPhien()
          if (!con) return
          if (maPhien) {
            datMaBiMatPhien(maPhien)
            datDangMoKhoa(true)
            setKhoa('da_mo')
            return
          }
          setKhoa('can_mo')
          return
        }
        // MÁY CHƯA CÓ MÃ BÍ MẬT ⇒ KHÔNG PHẢI MÁY CỦA THẦY ⇒ KHÔNG CÓ APP.
        //
        // Bản trước ở đây là `setKhoa(ma ? 'can_dat' : 'da_mo')` — máy trắng
        // VÀO THẲNG, lấy lý do "chưa có gì để khoá". Hậu quả: em gõ `/gv` trên
        // điện thoại của em là mở ra app quản lý, không hỏi câu nào. Thầy chốt
        // 15/09: "app giáo viên khoá cứng lại không thể chạm vào được bằng
        // cách nào." Xem `src/screens/KhoaMayThayScreen.tsx`.
        const ma = await loadTeacherSecret()
        if (!con) return
        setKhoa(ma ? 'can_dat' : 'chua_cap_quyen')
      } catch {
        // IndexedDB hỏng thì KHOÁ, không mở. Thà thầy phải nhập lại mã trên
        // máy của mình còn hơn mở toang app quản lý cho mọi máy hỏng kho.
        if (con) setKhoa('chua_cap_quyen')
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
      // DỌN CẢ PHIÊN, không chỉ đặt màn khoá. Khoá màn hình xong mà tải lại
      // trang vẫn vào được thì cái khoá đó là cửa sau (đặc tả mục 9).
      void donPhien()
      datDangMoKhoa(false)
      setKhoa('can_mo')
    }
    document.addEventListener('visibilitychange', doi)
    return () => document.removeEventListener('visibilitychange', doi)
  }, [khoa, banGhiKhoa])

  // CẦU NỐI `window.__ddh` (APP-CAN-MO-DUONG-CHO-COWORK.md mục 3). Gắn khi app
  // quản lý của thầy ĐANG MỞ KHOÁ, gỡ ngay khi khoá lại hoặc rời trang.
  //
  // Điều kiện `canHoi` là quan trọng: màn vào thi của em, báo cáo phụ huynh và
  // link cũ đều KHÔNG được có cầu nối — những máy đó không phải máy thầy.
  useEffect(() => {
    if (!canHoi || linkCu || laPhieu || laXemDiem || laHocSinh || khoa !== 'da_mo') {
      goCauNoi()
      return
    }
    ganCauNoi()
    return () => goCauNoi()
  }, [canHoi, linkCu, laPhieu, laXemDiem, laHocSinh, khoa])

  // Máy em / phụ huynh cầm link cũ thì KHÔNG đọc gì của thầy — không mở
  // IndexedDB danh sách lớp, không dựng màn nào của app quản lý. Chưa mở khoá
  // cũng vậy: không đọc danh sách lớp trước khi thầy nhập đúng mật khẩu.
  useEffect(() => {
    if (linkCu || laPhieu || laXemDiem || laHocSinh || laPhuHuynh || khoa !== 'da_mo') return
    loadClassList().then((list) => {
      if (list.length > 0) setClassList(list)
    })
  }, [linkCu, laPhieu, laXemDiem, laHocSinh, laPhuHuynh, khoa, setClassList])

  // Link mời làm bài (?examCode=) mở thẳng màn thi. Không có thì vào app thầy.
  useEffect(() => {
    if (linkCu || laPhieu || laHocSinh || laPhuHuynh) return
    const { maCa } = docDuongVao(location.search, location.pathname)
    if (maCa) setScreen('examtake')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkCu, laPhieu, laHocSinh, laPhuHuynh])

    if (linkCu) return <AppDaChuyenScreen />
  if (laHocSinh) {
    return (
      <ChanLoi o="Cổng học sinh">
        <StudentPortalScreen />
      </ChanLoi>
    )
  }
  
  // Chưa biết có mật khẩu hay chưa: dựng một màn trống, KHÔNG dựng app. Vài
  // chục mili giây, nhưng đây là chỗ mục 5 đòi — không được thấy loáng thoáng
  // danh sách lớp rồi mới bị che.
  if (khoa === 'dang_doc') return <div className="min-h-screen" style={{ background: 'var(--nen)' }} />
  // MÁY CHƯA ĐƯỢC CẤP QUYỀN: chỉ có đúng cửa nhập mã bí mật, không gì khác.
  if (khoa === 'chua_cap_quyen') {
    return (
      <ChanLoi o="Mở app">
        <KhoaMayThayScreen onMoDuoc={() => setKhoa('can_dat')} />
      </ChanLoi>
    )
  }
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
            // CẤT PHIÊN cho tab này (mục 4A). Chạy nền, không chặn thầy vào
            // app: cất hỏng thì chỉ mất tiện lợi, không mất tính năng.
            void (async () => {
              // CẤT PHIÊN LUÔN, không hỏi ô gạt nữa (thầy chốt 06/09): app
              // phải giữ mở khoá tới khi đóng tab hay thoát hẳn.
              await catPhien(ma)
            })()
          }}
        />
      </ChanLoi>
    )
  }

  // LINK VÀO THI `/t/<mã ca>` VÀ LINK XEM ĐIỂM `/d/<mã ca>` LÀ MÁY CỦA EM —
  // TRẢ ĐÚNG MÀN LÀM BÀI, KHÔNG DỰNG VỎ APP CỦA THẦY.
  //
  // Thầy chốt 15/09: "không được phép nhảy app kiểu học sinh nhảy sang app
  // giáo viên."
  //
  // LỖ ĐÃ BỊT: hai đường này không có vai `gv` nên `canHoi` là `false`, `khoa`
  // thành `'da_mo'`, rồi CHÍNH VỎ APP QUẢN LÝ được dựng — chỉ ẩn thanh bên khi
  // `screen === 'examtake'`. Em chỉ cách app của thầy đúng MỘT lần đổi `screen`:
  // màn thi ném lỗi là `ChanLoi` mời "về màn chính" → `setScreen('examhub')` →
  // em ngồi giữa app quản lý, đủ thanh bên, trên chính điện thoại của em.
  //
  // Nay hai đường ấy trả về ĐÚNG một màn, không vỏ, không thanh nào, và không
  // có đường nào đi tiếp. Lỗi thì mời TẢI LẠI CHÍNH LINK ẤY.
  if (docDuongVao(location.search, location.pathname).maCa || laXemDiem) {
    return (
      <ChanLoi o="Làm bài" veManChinh={() => location.reload()}>
        <ExamTakeScreen />
      </ChanLoi>
    )
  }

  // MÀN LÀM BÀI của học sinh không phải app quản lý: không thanh bên, không
  // thanh đáy, để em tập trung vào bài.
  const laManThi = screen === 'examtake'

  return (
    <div className={`min-h-screen m3 m3-thay${laManThi ? '' : ' vo-thay'}`}>
      <Toast />
      {!laManThi && <ThanhBenTrai />}
      <div className="khung-noi-dung">
        <div className="giua-noi-dung" data-teacher-screen={laManThi ? undefined : screen}>
      {/* Một màn ném lỗi thì chỉ màn đó hiện báo lỗi, app KHÔNG trắng. key theo
          `screen` để lỗi cũ không dính lại khi thầy sang màn khác. */}
      <ChanLoi key={screen} o={TEN_MAN[screen]} veManChinh={() => setScreen('examhub')}>
        <Suspense fallback={<div style={{ padding: 24, fontFamily: 'var(--sans)', color: 'var(--nhat)' }}>Đang mở…</div>}>
        {screen === 'classlist' && <ClassListScreen />}
        {screen === 'examhub' && <ExamHubScreen />}
        {screen === 'examsetup' && <ExamSetupScreen />}
        {screen === 'nganhangde' && <NganHangDeScreen />}
        {screen === 'examtake' && <ExamTakeScreen />}
        {screen === 'exammonitor' && <ExamMonitorScreen />}
        {screen === 'lichsuca' && <LichSuCaScreen />}
                                {screen === 'goilenbang' && <GoiLenBangScreen />}
        {screen === 'cauhoi' && <CauHoiScreen />}
        {screen === 'caidat' && <CaiDatScreen />}
                </Suspense>
      </ChanLoi>
        </div>
      </div>
      {!HIDE_BOTTOMNAV_ON.includes(screen) && <BottomNav />}
    </div>
  )
}

export default App
