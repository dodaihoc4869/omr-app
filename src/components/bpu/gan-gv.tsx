// BÌNH PHẢN ỨNG — GẮN BẢNG CHIẾU TỪ TỜ CHIẾU (nạp lười từ src/lib/bpu/nghe-to-chieu.ts — không nằm trong khung app thầy).
// Tờ vào đợt mới (TỰ ĐỘNG, thầy 07/11) hoặc thầy bấm P ⇒ lấy buổi điểm danh đang mở ⇒ mở bảng đè lên tờ và mở lượt cho câu đang chiếu (giây ước tính của câu).
// Bảng bấm «Câu tiếp» / ← → ⇒ nhắn ngược tờ đổi đợt ⇒ tờ báo câu mới ⇒ lượt mới trên cùng bảng.
// Tin tự động mà không có buổi đang mở / phòng không mở được / câu không gửi được ⇒ KHÔNG che tờ: đóng bảng, báo một lần, thầy chữa trên tờ như thường.
import { createRoot, type Root } from 'react-dom/client'
import { buoiDangMo, type BuoiHoc } from '../../lib/buoi-hoc-api'
import { useAppStore } from '../../store/appStore'
import BangBinhPhanUng from './BangBinhPhanUng'

let goc: Root | null = null
let khung: HTMLDivElement | null = null
let dem = 0
let nguonTo: Window | null = null
/** Buổi đang mở đọc gần nhất (tin tự động mỗi lần chuyển câu ⇒ không hỏi máy chủ mỗi đợt). */
let buoiNho: { ds: BuoiHoc[]; luc: number } | null = null
/** Phòng không mở được / máy chủ tắt ⇒ tạm không tự mở lại tới mốc này (thầy vẫn bấm P được). Thầy đóng bảng (Esc) thì không nghỉ: tờ chỉ báo khi ĐỔI câu. */
let nghiDen = 0
const NHO_BUOI_MS = 60_000
const GAN_DAY_MS = 4 * 3_600_000
/** Buổi bước Điểm danh của máy này đang xem hôm nay (giờ VN) — cùng khoá `DiemDanhBuoi.tsx`. */
function buoiDangXem(): string {
  try {
    const v = JSON.parse(localStorage.getItem('ddh.gv.buoi-xem') || 'null') as { id?: unknown; n?: unknown } | null
    return v && v.n === new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10) && typeof v.id === 'string' ? v.id : ''
  } catch { return '' }
}

async function layBuoi(tuDong: boolean): Promise<string | null> {
  let ds = tuDong && buoiNho && Date.now() - buoiNho.luc < NHO_BUOI_MS ? buoiNho.ds : null
  if (!ds) {
    const r = await buoiDangMo()
    if (!r.ok) { if (!tuDong) useAppStore.getState().showToast(r.chu, 'warn'); return null }
    ds = r.du
    buoiNho = { ds, luc: Date.now() }
  }
  // Tin TỰ ĐỘNG chỉ theo buổi mở trong 4 giờ gần nhất HOẶC buổi máy này đang xem hôm nay (bước Điểm danh nhớ `ddh.gv.buoi-xem`): thầy quên kết thúc
  // buổi sáng thì tối chiếu lớp khác KHÔNG đẩy câu xuống máy các em lớp sáng (đang ở nhà); buổi dài hơn 4 giờ mà thầy vẫn đang dạy thì vẫn chạy.
  const nho = buoiDangXem()
  const id = (tuDong ? ds.find((b) => b.id === nho || Date.now() - Date.parse(b.moLuc) < GAN_DAY_MS)?.id : ds[0]?.id) ?? null
  if (!id && !tuDong) useAppStore.getState().showToast('Chưa có buổi điểm danh đang mở. Thầy mở Điểm danh trước, các em vào lớp bằng mã.', 'warn')
  return id
}

/** Tin TỰ ĐỘNG chờ ngần này rồi mới mở lượt; tin mới hơn huỷ tin đang chờ ⇒ mở lại tờ / lật nhanh qua nhiều câu KHÔNG đẻ lượt rỗng (cố vấn 07/11). */
let choTuDongMs = 1500
let henTu: ReturnType<typeof setTimeout> | null = null
/** Thầy vừa bấm «Câu tiếp» / ← → trên bảng (hay máy điều khiển) ⇒ tin tự động KẾ TIẾP là câu thầy chủ động chọn: gửi NGAY, không chờ (thầy 07/11 «gửi câu tức thì»). */
let tiepNgay = false
/** Cho test: đổi thời gian chờ. */
export function datChoTuDong(ms: number): void { choTuDongMs = ms }
type TuyChonMo = { giay?: number; tuDong?: boolean; nguon?: Window | null }
export function moBangTuToChieu(qid: string, o: TuyChonMo = {}): Promise<void> {
  if (o.tuDong !== true) return moThat(qid, o)
  // Tờ VỪA MỞ (cửa sổ tờ mới) ⇒ vào thẳng Bình Phản Ứng gần như ngay (thầy 07/11 «bấm mở tờ chiếu load luôn vào bình phản ứng»);
  // mở lại đúng câu đang chạy thì bảng nối lại lượt cũ (BangBinhPhanUng), không đẻ lượt mới.
  const toMoi = !!o.nguon && o.nguon !== nguonTo
  if (toMoi) nghiDen = 0 // thầy vừa mở tờ = ý muốn rõ ⇒ bỏ khoảng tạm nghỉ tự mở (như «Câu tiếp»)
  if (o.nguon) nguonTo = o.nguon
  if (henTu) clearTimeout(henTu)
  const nhanh = toMoi || tiepNgay
  tiepNgay = false
  return new Promise((xong) => { henTu = setTimeout(() => { henTu = null; void moThat(qid, o).then(xong, xong) }, nhanh ? 0 : choTuDongMs) })
}
async function moThat(qid: string, o: TuyChonMo): Promise<void> {
  const tuDong = o.tuDong === true
  if (tuDong && Date.now() < nghiDen) return
  const buoiId = await layBuoi(tuDong)
  if (!buoiId) return
  if (o.nguon) nguonTo = o.nguon
  dem += 1
  if (!khung) { khung = document.createElement('div'); khung.setAttribute('data-bpu-bang', ''); document.body.appendChild(khung); goc = createRoot(khung) }
  // Phòng không mở được (ca mở, mất mạng) ⇒ tạm nghỉ tự mở 5 phút; chỉ CÂU này không gửi được ⇒ không nghỉ (câu sau vẫn tự gửi).
  const khongMo = (chu: string, caPhong: boolean) => { dongBang(); if (caPhong) nghiDen = Date.now() + 5 * 60_000; useAppStore.getState().showToast(chu, 'warn') }
  goc!.render(
    <BangBinhPhanUng
      buoiId={buoiId} qid={qid} luot={dem} giay={o.giay} tuDong={tuDong}
      onDong={dongBang}
      onToi={toiCau}
      onGiai={giaiTrenTo}
      layGiai={layGiai}
      onKhongMo={khongMo}
      onTat={() => { dongBang(); nghiDen = Date.now() + 60 * 60_000; useAppStore.getState().showToast('Bình Phản Ứng đang tắt trên máy chủ.', 'warn') }}
    />,
  )
  // Màn Hành trình (bước «Chọn câu & chiếu») nghe để sang bước «Đang chiếu».
  try { window.dispatchEvent(new CustomEvent('bpu-dang-chieu', { detail: { buoiId } })) } catch { /* trình duyệt cũ */ }
}
/** Phím G trên bảng: đóng bảng, tờ mở lời giải thu gọn của câu đang chiếu (bảng che tờ nên phím không tới được tờ). */
export function giaiTrenTo(): void {
  dongBang()
  try { nguonTo?.postMessage({ nguon: 'bpu-bang', lenh: 'giai' }, '*'); nguonTo?.focus() } catch { /* tờ đã đóng */ }
}
/** LỜI GIẢI TRÊN BẢNG (thầy 07/11 «bấm lời giải lại hiện bảng chiếu cũ»): xin tờ HTML lời giải thu gọn của đợt đang chiếu (tờ dựng sẵn — cùng nội dung,
 *  không thêm lệnh máy chủ); tờ không trả lời trong 1,5 s / đã đóng ⇒ chuỗi rỗng. */
let choGiai: ((html: string) => void) | null = null
export function layGiai(): Promise<string> {
  choGiai?.('')
  return new Promise((xong) => {
    let h: ReturnType<typeof setTimeout> | undefined
    const tra = (html: string) => { clearTimeout(h); xong(html) }
    h = setTimeout(() => { if (choGiai === tra) choGiai = null; xong('') }, 1500)
    choGiai = tra
    try { nguonTo?.postMessage({ nguon: 'bpu-bang', lenh: 'lay-giai' }, '*') } catch { tra('') }
  })
}
export function nhanGiai(html: string): void { const f = choGiai; choGiai = null; f?.(html) }
/** Bảng ⇒ tờ: sang câu sau (d = 1) / câu trước (d = -1). */
export function toiCau(d: 1 | -1): void {
  nghiDen = 0
  tiepNgay = true
  try { nguonTo?.postMessage({ nguon: 'bpu-bang', lenh: 'toi', d }, '*') } catch { /* tờ đã đóng */ }
}
/** Tờ báo đã hết câu theo hướng d. */
export function baoHetCau(d: 1 | -1): void {
  useAppStore.getState().showToast(d > 0 ? 'Đã tới câu cuối của tờ chiếu.' : 'Đang ở câu đầu.', 'warn')
}
export function dongBang(): void { goc?.unmount(); goc = null; khung?.remove(); khung = null }
