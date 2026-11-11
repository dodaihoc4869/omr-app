// XEM LẠI LIVE — ĐIỂM NỐI «Mở» từ Lịch sử Live của thầy sang màn xem lại (màn của em do đợt X2 làm ở src/screens/live-xem-lai/hs/).
// Nhập lười bằng `import.meta.glob`: tệp CHƯA có ⇒ danh sách rỗng ⇒ nút «Mở» ẩn, bản build không vỡ. Khi X2 thêm tệp
// `src/screens/live-xem-lai/hs/MoTuThay.tsx` (xuất mặc định một thành phần nhận `PropsMoTuThay`) thì nút tự hiện, không phải sửa gì ở đây.
import type { ComponentType } from 'react'
import type { BuoiLiveDs } from '../../../lib/live/xem-lai-kieu'

export interface PropsMoTuThay {
  /** Buổi thầy bấm «Mở» (đã xong). */
  buoi: BuoiLiveDs
  /** Vé tệp của thầy cho `/live-tep/<id>/<tệp>?ve=`. */
  ve: string
  /** Gốc máy chủ, vd. `https://omr.ttadodaihoc.workers.dev`. */
  goc: string
  onDong(): void
}
const ung = import.meta.glob<{ default: ComponentType<PropsMoTuThay> }>('../hs/MoTuThay.tsx')
const nap = Object.values(ung)[0]
export const coManXemLai = !!nap
export const napManXemLai = (): Promise<{ default: ComponentType<PropsMoTuThay> }> => (nap ? nap() : Promise.reject(new Error('chưa có màn xem lại')))
