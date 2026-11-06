// BÌNH PHẢN ỨNG — GẮN MÀN MÁY EM (nạp lười từ kênh đẩy / điểm danh; không nằm trong mảnh cổng học sinh ⇒ byte mở app không tăng).
// Đang thi / phòng chờ thi / kiểm tra cá nhân (thấy thanh thi, sảnh phòng chờ, thanh câu kiểm tra) ⇒ KHÔNG cướp màn. Màn chặng đang làm nằm nguyên bên dưới.
import { createRoot, type Root } from 'react-dom/client'
import ManBinhPhanUng from './ManBinhPhanUng'

/** Dấu hiệu em đang thi / ở phòng chờ thi / làm kiểm tra cá nhân. */
export const CHAN_BPU = '.thi-tren, .pc-room, .ktcn-nav'
let goc: Root | null = null
let khung: HTMLDivElement | null = null
let dang: { token: string; buoiId: string | null } | null = null

export function moBpuHs(token: string, buoiId: string | null): boolean {
  if (!token || typeof document === 'undefined' || document.querySelector(CHAN_BPU)) return false
  if (dang && dang.token === token && (dang.buoiId || !buoiId)) return true
  dang = { token, buoiId: buoiId ?? dang?.buoiId ?? null }
  if (!khung) { khung = document.createElement('div'); khung.setAttribute('data-bpu', ''); document.body.appendChild(khung); goc = createRoot(khung) }
  goc!.render(<ManBinhPhanUng token={token} buoiId={dang.buoiId} onDong={dongBpuHs} />)
  return true
}
export function dongBpuHs(): void { goc?.unmount(); goc = null; khung?.remove(); khung = null; dang = null }
