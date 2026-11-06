// BÌNH PHẢN ỨNG — GẮN BẢNG CHIẾU KHI THẦY BẤM P «Cả lớp làm» TRÊN TỜ CHIẾU (nạp lười từ src/lib/bpu/nghe-to-chieu.ts — không nằm trong khung app thầy).
// Lấy buổi điểm danh đang mở ⇒ mở bảng đè lên tờ chiếu và mở lượt cho câu đang chiếu; bấm P lần nữa (câu khác) ⇒ lượt mới trên cùng bảng.
import { createRoot, type Root } from 'react-dom/client'
import { buoiDangMo } from '../../lib/buoi-hoc-api'
import { useAppStore } from '../../store/appStore'
import BangBinhPhanUng from './BangBinhPhanUng'

let goc: Root | null = null
let khung: HTMLDivElement | null = null
let dem = 0

export async function moBangTuToChieu(qid: string): Promise<void> {
  const r = await buoiDangMo()
  const buoi = r.ok ? r.du[0] : undefined
  if (!buoi) { useAppStore.getState().showToast(r.ok ? 'Chưa có buổi điểm danh đang mở. Thầy mở Điểm danh trước, các em vào lớp bằng mã rồi bấm P.' : r.chu, 'warn'); return }
  dem += 1
  if (!khung) { khung = document.createElement('div'); khung.setAttribute('data-bpu-bang', ''); document.body.appendChild(khung); goc = createRoot(khung) }
  goc!.render(<BangBinhPhanUng buoiId={buoi.id} qid={qid} luot={dem} onDong={dongBang} onTat={() => { dongBang(); useAppStore.getState().showToast('Bình Phản Ứng đang tắt trên máy chủ.', 'warn') }} />)
}
export function dongBang(): void { goc?.unmount(); goc = null; khung?.remove(); khung = null }
