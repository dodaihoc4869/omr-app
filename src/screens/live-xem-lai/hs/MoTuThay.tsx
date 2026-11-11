// XEM LẠI LIVE — ĐIỂM NỐI với app thầy: nút «Mở» ở Lịch sử Live nhập lười tệp này (src/screens/live-xem-lai/gv/diem-noi-hs.ts, `PropsMoTuThay`).
// Bọc mỏng quanh trang buổi + trình phát của máy em, NGUỒN THẦY: chỉ đọc ba tệp của buổi bằng vé của thầy tại gốc máy chủ thầy đưa —
// không gọi `/hs/live-buoi`, không có «Em làm đúng / Em chưa đúng», không có thứ tự đoạn riêng từng em, không nhớ «Đã xem» trên máy.
import type { BuoiLiveDs } from '../../../lib/live/xem-lai-kieu'
import { XemBuoiLive } from './ManLiveHs'

export default function MoTuThay({ buoi, ve, goc, onDong }: { buoi: BuoiLiveDs; ve: string; goc: string; onDong(): void }) {
  return <XemBuoiLive id={buoi.id} ve={ve} nguon="gv" goc={goc} dong={onDong} />
}
