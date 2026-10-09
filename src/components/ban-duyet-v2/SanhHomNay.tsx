// Cửa vào màn "Hôm nay" BẢN DUYỆT V2 của học sinh (thầy 09/10/2026). Tệp nhỏ, nằm trong mảnh cổng học sinh:
//   · màn V2 (SanhV2) nạp LƯỜI — mảnh riêng ngoài precache (vite.config.ts), nên lượt cài app không nặng thêm;
//   · nạp hỏng (mất mạng lần đầu) hoặc màn V2 gặp lỗi khi vẽ ⇒ rơi về Sảnh cũ (SanhBanDo) với đúng các props — em không bao giờ kẹt màn trắng.
import { Component, lazy, Suspense, type ReactNode } from 'react'
import SanhBanDo, { type SanhBanDoProps } from '../hoa2/SanhBanDo'

const napSanhV2 = () => import('./SanhV2')
const SanhV2 = lazy(napSanhV2)
// Bắt đầu tải ngay khi mảnh cổng học sinh chạy: thường xong trước lượt hỏi `hoa2-sanh` của máy chủ ⇒ không thấy khung chờ.
if (typeof window !== 'undefined') void napSanhV2().catch(() => {})

class RaoSanhV2 extends Component<{ duPhong: ReactNode; children: ReactNode }, { loi: boolean }> {
  state = { loi: false }
  static getDerivedStateFromError() {
    return { loi: true }
  }
  render() {
    return this.state.loi ? this.props.duPhong : this.props.children
  }
}

function KhungCho() {
  return (
    <div role="status" aria-busy="true" style={{ minHeight: '100dvh', background: 'var(--bl-ground, var(--nen))' }}>
      <span className="sr-only">Đang mở màn Hôm nay…</span>
    </div>
  )
}

export default function SanhHomNay(p: SanhBanDoProps & { tenEm: string; lop: string }) {
  return (
    <RaoSanhV2 duPhong={<SanhBanDo {...p} />}>
      <Suspense fallback={<KhungCho />}>
        <SanhV2 {...p} />
      </Suspense>
    </RaoSanhV2>
  )
}
