// HÀNH TRÌNH › THẺ "CẦN THẦY CHỮA" (bản vẽ tối giản thầy chốt 09/10 · GV-HanhTrinh, BoGop: "Chỗ cần chữa ở 9 chỗ, 6 tên khác nhau → 1 tên, 1 chỗ").
// MỘT chỗ cho mọi việc chữa của thầy — trước đây rải ở hai mục thanh bên (Chữa trên lớp, Gỡ nút thắt). Thẻ chỉ GHÉP thành phần SẴN CÓ, không tự
// gọi máy chủ, không đổi luồng hay lệnh nào:
//   · Buổi chữa — `LenBangChienDich` (chọn chiến dịch · danh sách Cần thầy chữa · điểm danh bằng mã · xếp buổi chữa cho em có mặt · tờ chiếu).
//   · Bước cuối trên lớp — `CauCanChuaTrenLop` (câu em đã tự gỡ mà vẫn sai: điểm danh + chiếu bước cuối).
//   · Gỡ nút thắt — `BanGoNutThatScreen` (thẻ nút thắt gom theo câu + bước).
// Mỗi phần nạp LƯỜI (mảnh riêng, ngoài precache — vite.config.ts). Màn `goilenbang` / `bangonutthat` giữ nguyên cho mọi lối `setScreen` cũ.
import { lazy, Suspense, useState } from 'react'

const LenBangChienDich = lazy(() => import('./LenBangChienDich'))
const CauCanChuaTrenLop = lazy(() => import('../chua-cau-sai/CauCanChuaTrenLop'))
const BanGoNutThatScreen = lazy(() => import('../../screens/BanGoNutThatScreen'))

type PhanChua = 'buoi-chua' | 'buoc-cuoi' | 'go-nut'
export const PHAN_CAN_THAY_CHUA: readonly (readonly [PhanChua, string])[] = [
  ['buoi-chua', 'Buổi chữa'],
  ['buoc-cuoi', 'Bước cuối trên lớp'],
  ['go-nut', 'Gỡ nút thắt'],
]

export default function TheCanThayChua() {
  const [phan, setPhan] = useState<PhanChua>('buoi-chua')
  return (
    <div className="gvv2-the-con">
      <div className="gvv2-con" role="tablist" aria-label="Cần thầy chữa">
        {PHAN_CAN_THAY_CHUA.map(([k, nhan]) => (
          <button key={k} type="button" role="tab" id={`gvv2-chua-${k}`} aria-controls="gvv2-chua-o" aria-selected={phan === k} className="gvv2-con-nut" onClick={() => setPhan(k)}>
            {nhan}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="gvv2-chua-o" aria-labelledby={`gvv2-chua-${phan}`} className="gvv2-nhung">
        <Suspense
          fallback={
            <p className="gvv2-trong" role="status">
              Đang mở…
            </p>
          }
        >
          {phan === 'buoi-chua' ? <LenBangChienDich /> : phan === 'buoc-cuoi' ? <CauCanChuaTrenLop /> : <BanGoNutThatScreen />}
        </Suspense>
      </div>
    </div>
  )
}
