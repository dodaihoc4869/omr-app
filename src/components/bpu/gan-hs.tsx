// BÌNH PHẢN ỨNG — GẮN MÀN MÁY EM (nạp lười từ kênh đẩy / điểm danh; không nằm trong mảnh cổng học sinh ⇒ byte mở app không tăng).
// Đang thi / phòng chờ thi / kiểm tra cá nhân (thấy thanh thi, sảnh phòng chờ, thanh câu kiểm tra) ⇒ KHÔNG cướp màn. Màn chặng đang làm nằm nguyên bên dưới.
// GIỮ NỐI SẴN (thầy 07/11 «gửi câu tức thì»): em điểm danh xong ⇒ `nenBpuHs` gắn màn ẨN, nối phòng luôn; thầy mở lượt ⇒ màn tự hiện ngay (không chờ
// kênh đẩy, không nạp mảnh, không xin vé lại). «Rời» chỉ ẩn màn, kết nối giữ tới hết buổi.
import { createRoot, type Root } from 'react-dom/client'
import ManBinhPhanUng from './ManBinhPhanUng'

/** Dấu hiệu em đang thi / ở phòng chờ thi / làm kiểm tra cá nhân. */
export const CHAN_BPU = '.thi-tren, .pc-room, .ktcn-nav'
const dangBan = () => typeof document !== 'undefined' && !!document.querySelector(CHAN_BPU)
let goc: Root | null = null
let khung: HTMLDivElement | null = null
let dang: { token: string; buoiId: string | null } | null = null
/** Số lần «mở» (đổi ⇒ màn hiện ngay); 0 = gắn ẩn chờ lượt. */
let lanMo = 0

function ve(): void {
  if (!dang) return
  if (!khung) { khung = document.createElement('div'); khung.setAttribute('data-bpu', ''); document.body.appendChild(khung); goc = createRoot(khung) }
  goc!.render(<ManBinhPhanUng token={dang.token} buoiId={dang.buoiId} onDong={dongBpuHs} giuNoi mo={lanMo} chan={dangBan} />)
}
/** Mở màn ngay (kênh đẩy / nút «Vào Bình Phản Ứng»). Đang thi ⇒ từ chối. */
export function moBpuHs(token: string, buoiId: string | null): boolean {
  if (!token || typeof document === 'undefined' || dangBan()) return false
  if (!dang || dang.token !== token || (buoiId && dang.buoiId !== buoiId)) dang = { token, buoiId: buoiId ?? dang?.buoiId ?? null }
  lanMo += 1
  ve()
  return true
}
/** Gắn ẨN + nối phòng sẵn (gọi khi em đã điểm danh buổi). Đã gắn ⇒ không làm gì. */
export function nenBpuHs(token: string, buoiId: string): void {
  if (!token || !buoiId || typeof document === 'undefined') return
  if (dang && dang.token === token && dang.buoiId === buoiId) return
  dang = { token, buoiId }
  ve()
}
export function dongBpuHs(): void { goc?.unmount(); goc = null; khung?.remove(); khung = null; dang = null; lanMo = 0 }
