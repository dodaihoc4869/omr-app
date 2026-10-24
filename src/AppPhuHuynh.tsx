// VỎ APP PHỤ HUYNH (/ph, /phu-huynh, ?vai=phuhuynh) — gốc React RIÊNG của cổng phụ huynh (25/10, thầy: "tối ưu tốc độ app tức thì hơn nữa").
//
// Đo trước khi tách (scripts/kiem-toc-do-tai.mjs, đường `phu-huynh /ph`): 274 KB nén — trong đó ~45 KB là vỏ app THẦY (App.tsx kéo màn khoá, thanh bên,
// bộ chấm `exam-grade`, phiếu hàng loạt, cầu nối…) mà phụ huynh không bao giờ dùng. Nay `main.tsx` chọn gốc theo đường vào: đường phụ huynh dựng vỏ
// này, KHÔNG nạp App.tsx (như AppHocSinh của cổng học sinh, 05/10).
// Cây phần tử, chữ, lớp CSS y như khi App.tsx dựng cổng: ChanLoi → Suspense (nền app) → BatLinhShell vai="ph" → ParentPortalScreen. App.tsx VẪN giữ
// nhánh cổng phụ huynh (phép kiểm dựng thẳng <App/>) — hai nhánh cùng một cây. CSS chung đã nạp ở main.tsx (không thiếu tờ nào so với App.tsx).
import { lazy, Suspense } from 'react'
import BatLinhShell from './components/bat-linh/BatLinhShell'
import ChanLoi from './components/ChanLoi'

/** Tải mảnh cổng; hỏng (mạng chập) thì chờ 0,8 giây thử lại một lần (như App.tsx). Thiếu mảnh vì đang mở bản cũ ⇒ batLoiThieuManh() lo. */
const napCong = () => import('./screens/ParentPortalScreen').catch(() => new Promise<void>((r) => setTimeout(r, 800)).then(() => import('./screens/ParentPortalScreen')))
// Màn đầu LUÔN là cổng ⇒ tải ngay lúc vỏ vừa chạy (index.html đã nạp trước), không chờ React dựng.
const huaCong = napCong()
huaCong.catch(() => {}) // hỏng thì `lazy` nhận đúng lỗi ấy và ChanLoi báo như cũ
const ParentPortalScreen = lazy(() => huaCong)

/** Khuôn gốc của main.tsx: cổng phụ huynh không nối KaTeX sau mảnh màn (chỉ màn Chi tiết ca tự tải lúc mở) ⇒ null như App.tsx. */
export function huaManEmSom(): Promise<unknown> | null {
  return null
}

export default function AppPhuHuynh() {
  return (
    <ChanLoi o="Cổng phụ huynh">
      <Suspense fallback={<div className="min-h-screen" style={{ background: 'var(--nen)' }} />}>
        <BatLinhShell vai="ph"><ParentPortalScreen /></BatLinhShell>
      </Suspense>
    </ChanLoi>
  )
}
