// SOÁT APP GIÁO VIÊN Ở TRẠNG THÁI DỮ LIỆU TRỐNG (tạm, KHÔNG commit): dựng vỏ app thầy + MỘT màn, nói chuyện với máy chủ cục bộ trống (:8787).
import { lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import '/src/index.css'
import '/src/styles/tokens.css'
import '/src/styles/teacher-layout.css'
import '/src/styles/vo-thay.css'
import '/src/components/m3'
import { apDungGiaoDien, docGiaoDien } from '/src/lib/giao-dien-thay'
import BottomNav from '/src/components/BottomNav'
import ThanhBenTrai from '/src/components/ThanhBenTrai'
import Toast from '/src/components/Toast'
import ChanLoi from '/src/components/ChanLoi'
import { useAppStore } from '/src/store/appStore'
import { luuSoCauCa, saveTeacherSecret, saveScriptUrl, saveCauHinhMayChu, datMaBiMatPhien } from '/src/lib/exam-db'
import { datDangMoKhoa } from '/src/lib/cap-nhat-app'
import { saveClassList } from '/src/lib/classlist-db'

const q = new URLSearchParams(location.search)
const man = (q.get('man') || 'examhub') as any
const coLop = q.get('lop') !== '0'
history.replaceState(null, '', '/gv')

const MAY_CHU = 'https://omr.ttadodaihoc.workers.dev' // Playwright chuyển hướng sang :8787
await saveTeacherSecret('bi-mat-thu')
datMaBiMatPhien('bi-mat-thu')
datDangMoKhoa(true)
await saveScriptUrl(MAY_CHU)
await saveCauHinhMayChu({ BAT: true, URL: MAY_CHU })
const HANG = [['12001', 'Nguyễn Văn Minh', '12A1'], ['12002', 'Trần Thị Lan', '12A1'], ['12003', 'Lê Hoàng Nam', '12A2']].map(([sbd, hoTen, lop]) => ({ sbd, hoTen, sdt: '', lop, namSinh: '2008', raw: {} }))
await saveClassList(coLop ? HANG : [], { sheetUrl: 'https://may.test/lop', mapping: { sbd: 'SBD', hoTen: 'Họ tên' }, syncedAt: new Date().toISOString(), mode: 'tsv' } as any)
useAppStore.getState().setClassList(coLop ? HANG : [])
if (q.get('socau') && q.get('ma')) await luuSoCauCa(q.get('ma')!, { I: 18, II: 4, III: 6 })
if (q.get('em')) useAppStore.getState().moHoSoEm(q.get('em')!)
if (q.get('ma')) useAppStore.getState().moChiTietCa(q.get('ma')!)
apDungGiaoDien(docGiaoDien())
useAppStore.setState({ sbdToanCanh: q.get('sbd') || '12121007' } as any)
useAppStore.getState().setScreen(man)

const M: Record<string, any> = {
  classlist: lazy(() => import('/src/screens/ClassListScreen')),
  examhub: lazy(() => import('/src/screens/ExamHubScreen')),
  examsetup: lazy(() => import('/src/screens/ExamSetupScreen')),
  nganhangde: lazy(() => import('/src/screens/NganHangDeScreen')),
  exammonitor: lazy(() => import('/src/screens/ExamMonitorScreen')),
  lichsuca: lazy(() => import('/src/screens/LichSuCaScreen')),
  hocsinh: lazy(() => import('/src/screens/HocSinhScreen')),
  toancanh: lazy(() => import('/src/screens/ToanCanhEmScreen')),
  goilenbang: lazy(() => import('/src/screens/GoiLenBangScreen')),
  giaobtvn: lazy(() => import('/src/screens/PhanCongScreen')),
  cauhoi: lazy(() => import('/src/screens/CauHoiScreen')),
  caidat: lazy(() => import('/src/screens/CaiDatScreen')),
}
const Man = M[man]
function Vo() {
  const screen = useAppStore((s) => s.screen)
  const Mh = M[screen]
  return (
    <div className="min-h-screen m3 m3-thay vo-thay">
      <Toast />
      <ThanhBenTrai />
      <div className="khung-noi-dung">
        <div className="giua-noi-dung" data-teacher-screen={screen}>
          <ChanLoi key={screen} o={screen} veManChinh={() => useAppStore.getState().setScreen('examhub')}>
            <Suspense fallback={<div style={{ padding: 24, fontFamily: 'var(--sans)', color: 'var(--nhat)' }}>Đang mở…</div>}>{Mh ? <Mh /> : null}</Suspense>
          </ChanLoi>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
void Man
createRoot(document.getElementById('root')!).render(<Vo />)
