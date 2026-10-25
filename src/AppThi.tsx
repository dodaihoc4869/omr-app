// VỎ MÀN THI (/t/<mã ca>, /d/<mã ca>, ?examCode=, ?vai=diem) — gốc React RIÊNG của màn làm bài / xem điểm (25/10, thầy: "tiếp tục tối ưu tốc độ app tức thì hơn nữa").
//
// Đo trước khi tách (scripts/kiem-toc-do-tai.mjs, đường `thi /t`): 296 KB nén — trong đó nhóm `app` (vỏ app THẦY: App.tsx, DesignSystem, bộ chấm `exam-grade`,
// biểu tượng thêm, PDF bài tập, khung xem phiếu…) ~173 KB mà máy em không dùng lúc vào thi. Nay `main.tsx` chọn gốc theo đường vào: đường màn thi dựng vỏ
// này, KHÔNG nạp App.tsx (như AppHocSinh 05/10, AppPhuHuynh 25/10).
// Cây phần tử, chữ, lớp CSS y như nhánh màn thi của App.tsx: ChanLoi (mời TẢI LẠI chính link) → Suspense (nền app) → BatLinhShell vai="hs" → ExamTakeScreen.
// App.tsx VẪN giữ nhánh ấy (link thi trên máy thầy đang khoá app, phép kiểm dựng thẳng <App/>) — hai nhánh cùng một cây. CSS chung đã nạp ở main.tsx.
import { lazy, Suspense } from 'react'
import BatLinhShell from './components/bat-linh/BatLinhShell'
import './styles/khoi-dam.css' // Giao diện «Khối đậm» thầy duyệt 25/10
import ChanLoi from './components/ChanLoi'

/** Tải mảnh màn thi; hỏng (mạng chập) thì chờ 0,8 giây thử lại một lần (như App.tsx). Thiếu mảnh vì đang mở bản cũ ⇒ batLoiThieuManh() lo. */
const napManThi = () => import('./screens/ExamTakeScreen').catch(() => new Promise<void>((r) => setTimeout(r, 800)).then(() => import('./screens/ExamTakeScreen')))
// Màn đầu LUÔN là màn thi ⇒ tải ngay lúc vỏ vừa chạy (index.html đã nạp trước), không chờ React dựng.
const huaManThi = napManThi()
huaManThi.catch(() => {}) // hỏng thì `lazy` nhận đúng lỗi ấy và ChanLoi báo như cũ
const ExamTakeScreen = lazy(() => huaManThi)

/** Khuôn gốc của main.tsx: lượt tải mảnh màn thi — main.tsx tải KaTeX NỐI SAU nó (máy yếu 29/09, như App.tsx). */
export function huaManEmSom(): Promise<unknown> | null {
  return huaManThi
}

export default function AppThi() {
  return (
    <ChanLoi o="Làm bài" veManChinh={() => location.reload()}>
      <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--nen)' }} />}>
        <BatLinhShell vai="hs"><ExamTakeScreen /></BatLinhShell>
      </Suspense>
    </ChanLoi>
  )
}
