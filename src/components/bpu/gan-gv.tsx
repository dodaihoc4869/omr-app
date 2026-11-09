// BÌNH PHẢN ỨNG — GẮN BẢNG CHIẾU TỪ TỜ CHIẾU (nạp lười từ src/lib/bpu/nghe-to-chieu.ts — không nằm trong khung app thầy).
// Tờ vào đợt mới (TỰ ĐỘNG, thầy 07/11) hoặc thầy bấm P ⇒ lấy buổi điểm danh đang mở ⇒ mở bảng đè lên tờ và mở lượt cho câu đang chiếu (giây ước tính của câu).
// Bảng bấm «Câu tiếp» / ← → ⇒ nhắn ngược tờ đổi đợt ⇒ tờ báo câu mới ⇒ lượt mới trên cùng bảng.
// Tin tự động mà không có buổi đang mở / phòng không mở được / câu không gửi được ⇒ KHÔNG che tờ: đóng bảng, báo một lần, thầy chữa trên tờ như thường.
// 09/11 (thầy «trùng tu lại toàn bộ màn này»): MỘT gốc bảng cho cả điểm danh lẫn các lượt (`moBangDiemDanh` → «Xong điểm danh» → chọn câu ngay trên bảng
// `chieuCau` ⇒ tờ chiếu dựng sẵn nằm dưới bảng); gọi lên bảng ⇒ bảng THU NHỎ vào tờ cũ, chấm Đạt / Chưa đạt ⇒ bảng PHÓNG LẠI.
import { createRoot, type Root } from 'react-dom/client'
import { buoiDangMo, type BuoiHoc } from '../../lib/buoi-hoc-api'
import { useAppStore } from '../../store/appStore'
import type { CauDayHoc } from '../../lib/day-hoc-len-bang'
import BangBinhPhanUng from './BangBinhPhanUng'

let goc: Root | null = null
let khung: HTMLDivElement | null = null
let dem = 0
let nguonTo: Window | null = null
/** Buổi đang mở đọc gần nhất (tin tự động mỗi lần chuyển câu ⇒ không hỏi máy chủ mỗi đợt). */
let buoiNho: { ds: BuoiHoc[]; luc: number } | null = null
/** Phòng không mở được / máy chủ tắt ⇒ tạm không tự mở lại tới mốc này (thầy vẫn bấm P được). Thầy đóng bảng (Esc) thì không nghỉ: tờ chỉ báo khi ĐỔI câu. */
let nghiDen = 0
/** Nơi bảng nhận «Đạt / Chưa đạt» thầy bấm trên tờ cũ (bảng tự đăng kí khi dựng). */
let nhanCham: ((dat: boolean) => void) | null = null
/** MỘT GỐC BẢNG (09/11): điểm danh → chọn câu → các lượt dùng CHUNG một bảng (một nối phòng, không dựng lại, không chớp «Đang mở…»).
 *  Props hiện tại của bảng; lần vẽ sau GỘP vào (mã điểm danh đổi mỗi phút không đè câu đang chiếu). */
let hien: { buoiId: string; ma?: string | null; linkQr?: string | null; qid?: string | null; luot?: number; giay?: number; tuDong?: boolean; diemDanh?: boolean } | null = null
/** Gốc + khung của tấm buổi dạy (TamHoatDong) và của tờ chiếu dựng từ câu chọn trên bảng. */
/** Esc ra Hôm nay: phiên đang tạm ẩn (xem `tamAnTatCa`). */
let tamAn = false
let hdGoc: Root | null = null
let hdKhung: HTMLDivElement | null = null
let toGoc: Root | null = null
let toKhung: HTMLDivElement | null = null
/** Bảng đang lui sau tấm buổi dạy (moHoatDong) — tờ của khối báo câu ⇒ bảng hiện lại. */
let anViHd = false
/** Bước Điểm danh (app thầy) muốn biết khi bảng đóng. */
let dongNgoai: (() => void) | null = null
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
// Hàm gắn vào bảng ĐỨNG YÊN (module): bảng có hiệu ứng phụ thuộc chúng (nối phòng) ⇒ hàm mới mỗi lần vẽ sẽ làm rớt nối mỗi lần chuyển câu.
const khongMo = (chu: string, caPhong: boolean) => { dongBang(); if (caPhong) nghiDen = Date.now() + 5 * 60_000; useAppStore.getState().showToast(chu, 'warn') }
const tatBpu = () => { dongBang(); nghiDen = Date.now() + 60 * 60_000; useAppStore.getState().showToast('Bình Phản Ứng đang tắt trên máy chủ.', 'warn') }
const dangKyCham = (f: ((dat: boolean) => void) | null) => { nhanCham = f }
const toiQuaTo = (d: 1 | -1) => toiCau(d)
function veBang(): void {
  if (!hien) return
  if (!khung) { khung = document.createElement('div'); khung.setAttribute('data-bpu-bang', ''); document.body.appendChild(khung); goc = createRoot(khung) }
  goc!.render(
    <BangBinhPhanUng
      key={hien.buoiId}
      {...hien}
      onDong={tamAnTatCa}
      onToi={nguonTo ? toiQuaTo : undefined}
      onGiai={giaiTrenTo}
      layGiai={layGiai}
      lenBangTo={lenBangTo}
      dangKyChamTo={dangKyCham}
      onKhongMo={khongMo}
      onTat={tatBpu}
      onChieuCau={chieuCau}
      onHoatDong={moHoatDongTuBang}
      onKetThuc={ketThucBuoiHoc}
      gocPortal={khung}
    />,
  )
}
async function moThat(qid: string, o: TuyChonMo): Promise<void> {
  const tuDong = o.tuDong === true
  if (tuDong && Date.now() < nghiDen) return
  const buoiId = await layBuoi(tuDong)
  if (!buoiId) return
  if (o.nguon) nguonTo = o.nguon
  dem += 1
  // Bảng đang lui sau tấm buổi dạy (Kiểm tra đầu giờ / Chữa câu…) mà tờ của khối ấy vừa báo câu ⇒ bảng hiện lại với câu đó.
  if (anViHd) { anViHd = false; hienBang() }
  const cung = hien?.buoiId === buoiId
  hien = { ...(cung ? { ma: hien!.ma, linkQr: hien!.linkQr } : {}), buoiId, qid, luot: dem, giay: o.giay, tuDong }
  veBang()
  // Màn Hành trình (bước «Chọn câu & chiếu») nghe để sang bước «Đang chiếu».
  try { window.dispatchEvent(new CustomEvent('bpu-dang-chieu', { detail: { buoiId } })) } catch { /* trình duyệt cũ */ }
}
/** CHIẾU ĐIỂM DANH = MỞ MÀN Bình Phản Ứng (bước Điểm danh của app thầy). Bảng đang mở cho đúng buổi ⇒ chỉ cập nhật mã, giữ câu đang chiếu. */
export function moBangDiemDanh(o: { buoiId: string; ma?: string | null; linkQr?: string | null; onDong?: () => void }): void {
  dongNgoai = o.onDong ?? dongNgoai
  if (hien?.buoiId === o.buoiId && khung) {
    // Đang tạm ẩn (Esc ra Hôm nay) ⇒ hiện lại ĐÚNG chỗ dở (bảng / tờ / tấm như lúc ra). Đang hiện ⇒ chỉ cập nhật mã (em có thể đang trên bảng).
    if (tamAn) hienLaiTatCa()
    if (o.ma !== undefined) capNhatMa(o.buoiId, o.ma, o.linkQr)
    return
  }
  if (khung) { dongBang(); dongTo() } // buổi khác ⇒ đóng phiên cũ
  // Mở mới ⇒ LUÔN màn điểm danh (thầy 09/11 «thoát ra hẳn thì không có chỗ vào lại màn điểm danh»), kể cả phòng còn lượt cũ; chọn câu ⇒ hết cờ.
  hien = { buoiId: o.buoiId, ma: o.ma, linkQr: o.linkQr, diemDanh: true }
  veBang()
  phatPhien()
}
// ESC = RA HÔM NAY, GIỮ NGUYÊN CHỖ DỞ (thầy 09/11 «khi tôi bấm esc thì out hẳn ra màn hôm nay, bấm vào điểm danh thì vào đúng chỗ đang dở»): ẩn bảng + tờ +
// tấm (không gỡ — nối phòng, câu, em đang lên bảng giữ nguyên), thoát toàn màn hình, trả cuộn cho Hôm nay. Nút Điểm danh ⇒ `moBangDiemDanh` cùng buổi ⇒ hiện lại.
/** Phiên Bình Phản Ứng đang có trên máy này (hiện hoặc tạm ẩn) — nút Điểm danh / Kết thúc ở Hôm nay đọc. */
export function phienDangCo(): { buoiId: string; tamAn: boolean } | null { return hien && khung ? { buoiId: hien.buoiId, tamAn } : null }
function phatPhien(): void { try { window.dispatchEvent(new CustomEvent('bpu-phien', { detail: phienDangCo() })) } catch { /* trình duyệt cũ */ } }
const caKhung = () => [khung, toKhung, hdKhung].filter((x): x is HTMLDivElement => !!x)
function tamAnTatCa(): void {
  if (!khung || tamAn) return
  tamAn = true
  for (const el of caKhung()) { el.style.visibility = 'hidden'; el.style.pointerEvents = 'none' }
  document.documentElement.setAttribute('data-bpu-an', '')
  document.body.style.overflow = '' // khung tờ khoá cuộn trang khi mở ⇒ trả lại cho Hôm nay
  window.removeEventListener('keydown', phimKhiAn, true)
  baoAnHien(true)
  try { if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ }
  // Esc / nút «Đóng» ⇒ ra HẲN màn Hôm nay (thầy 09/11 «bấm nút đóng cũng thoát hẳn ra màn hình hôm nay»).
  try { useAppStore.getState().setScreen('tongquan') } catch { /* app học sinh / test */ }
  phatPhien()
}
function hienLaiTatCa(): void {
  tamAn = false
  document.documentElement.removeAttribute('data-bpu-an')
  for (const el of [toKhung, hdKhung]) if (el) { el.style.visibility = ''; el.style.pointerEvents = '' }
  if (toKhung) document.body.style.overflow = 'hidden'
  const dangLenBang = !!khung?.hasAttribute('data-an')
  if (khung && !dangLenBang) { khung.style.visibility = ''; khung.style.pointerEvents = ''; baoAnHien(false); khung.querySelector<HTMLElement>('.bpu-bang')?.focus() }
  if (dangLenBang) window.addEventListener('keydown', phimKhiAn, true)
  try { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ }
  phatPhien()
}
/** Mã điểm danh đổi mỗi phút ⇒ chỉ gộp mã + QR (không đụng câu / lượt đang chiếu). */
export function capNhatMa(buoiId: string, ma?: string | null, linkQr?: string | null): void {
  if (!hien || hien.buoiId !== buoiId || (hien.ma === ma && hien.linkQr === linkQr)) return
  hien = { ...hien, ma, linkQr }
  veBang()
}

// TẤM BUỔI DẠY (09/11 «cho nguyên hành trình dạy học vào chỗ chọn sau khi điểm danh xong … bỏ hẳn hành trình cũ»): Kiểm tra đầu giờ · Chữa câu khó
// & tính toán · Kiểm tra ôn tập mở trên tấm riêng (dưới tờ chiếu, dưới bảng). Mở từ bảng ⇒ bảng lui (ẩn, giữ nối); khối chiếu câu ⇒ bảng hiện lại.
export async function moHoatDong(hd: 'dau-gio' | 'chua-cau' | 'on-tap'): Promise<void> {
  const { default: Tam } = await import('./TamHoatDong')
  if (!hdKhung) { hdKhung = document.createElement('div'); hdKhung.setAttribute('data-bpu-hd', ''); document.body.appendChild(hdKhung); hdGoc = createRoot(hdKhung) }
  hdGoc!.render(<Tam key={hd} hd={hd} coBang={!!khung} onDong={dongHoatDong} />)
  if (khung && !bangAn()) { anViHd = true; anBang() }
}
function moHoatDongTuBang(hd: 'dau-gio' | 'chua-cau' | 'on-tap'): void { void moHoatDong(hd) }
/** KẾT THÚC BUỔI HỌC từ bảng (thầy 09/11 «thiết kế nút đẹp mắt kết thúc buổi học»; nút ở «Hôm nay làm gì?»): đóng buổi trên máy chủ (phòng kết thúc ⇒ máy em
 *  mới thoát được màn Bình Phản Ứng), đóng bảng + tấm buổi dạy. Trả câu báo lỗi (rỗng = đã kết thúc). */
export async function ketThucBuoiHoc(buoiId: string): Promise<string> {
  const { dongBuoiHoc } = await import('../../lib/buoi-hoc-api')
  const r = await dongBuoiHoc(buoiId)
  if (!r.ok) return r.chu
  dongBang(); dongHoatDong(); dongTo()
  useAppStore.getState().showToast('Đã kết thúc buổi học', 'success')
  return ''
}
export function dongHoatDong(): void {
  hdGoc?.unmount(); hdGoc = null; hdKhung?.remove(); hdKhung = null
  if (anViHd) { anViHd = false; hienBang() }
}

// TỜ CHIẾU CỦA CÂU THẦY CHỌN TRÊN BẢNG: khung xem tờ (KhungXemPhieu, cùng khung bảng Dạy học dùng) nằm DƯỚI bảng. Tờ vào đợt ⇒ tự báo câu ⇒ bảng mở lượt.
function dongTo(): void { toGoc?.unmount(); toGoc = null; toKhung?.remove(); toKhung = null; nguonTo = null; if (hien) veBang() }
/** Dựng tờ từ câu đã chọn (câu bấm đứng đầu) rồi chiếu. Trả lời báo lỗi (rỗng = đã chiếu). */
export async function chieuCau(ds: CauDayHoc[]): Promise<string> {
  if (!ds.length) return 'Chưa chọn câu nào.'
  let html = ''
  try {
    const { dungToChieuBpu } = await import('../../lib/bpu/to-chieu-bpu')
    html = await dungToChieuBpu(ds, `Bình Phản Ứng · ${ds[0]!.tenDe}`)
  } catch (e) { return e instanceof Error ? e.message : 'Chưa dựng được tờ chiếu.' }
  const { default: KhungXemPhieu } = await import('../KhungXemPhieu')
  nghiDen = 0
  tiepNgay = true // thầy vừa chọn câu = ý muốn rõ ⇒ gửi NGAY (cùng khung tờ cũ thì không coi là «tờ mới»)
  if (!toKhung) { toKhung = document.createElement('div'); toKhung.setAttribute('data-bpu-to', ''); document.body.appendChild(toKhung); toGoc = createRoot(toKhung) }
  toGoc!.render(<KhungXemPhieu html={html} ten="Tờ chiếu Bình Phản Ứng" dong={() => (khung ? tamAnTatCa() : dongTo())} />)
  return ''
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
export function dongBang(): void {
  goc?.unmount(); goc = null; khung?.remove(); khung = null; nhanCham = null; hien = null; tamAn = false
  document.documentElement.removeAttribute('data-bpu-an')
  try { if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ }
  phatPhien()
  window.removeEventListener('keydown', phimKhiAn, true)
  const f = dongNgoai; dongNgoai = null; f?.()
}

// CHUYỂN CẢNH LÊN BẢNG (thầy 09/11 «khi gọi lên bảng hiệu ứng đẳng cấp thu nhỏ luôn vào màn chiếu chuẩn trước đó»): bảng THU NHỎ + mờ dần để lộ tờ
// chiếu cũ nằm ngay dưới; chấm xong bảng PHÓNG LẠI từ giữa. Chỉ transform + opacity (máy chiếu yếu vẫn mượt); máy yếu / giảm chuyển động ⇒ ẩn hiện tức thì.
// Tờ ở cửa sổ riêng (không nằm trong trang) ⇒ ẩn tức thì như cũ.
const giamChuyenDong = () => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('may-yeu')
const toTrongTrang = () => !!nguonTo && [...document.querySelectorAll('iframe')].some((f) => f.contentWindow === nguonTo)
function bangAn(): boolean { return !!khung && khung.hasAttribute('data-an') }
function baoAnHien(an: boolean): void { try { window.dispatchEvent(new CustomEvent('bpu-an-hien', { detail: an })) } catch { /* trình duyệt cũ */ } }
// 09/11 (lần 4) thầy «hiệu ứng gọi lên bảng chuyển màn vẫn chưa cực mượt»: (1) chỉ transform + opacity (bỏ hoạt cảnh bo góc — vẽ lại mỗi khung);
// (2) nâng lớp vẽ trước MỘT khung (`bpu-san`) rồi mới chạy, tờ cũ kịp dựng thẻ tên bên dưới; (3) ẩn bằng visibility (không display:none) ⇒ phóng lại
// không phải dựng lại cả bảng; (4) bảng hoãn gửi tin phòng tới khi thu xong (BangBinhPhanUng) ⇒ không vẽ lại React giữa hoạt cảnh.
function anHan(el: HTMLDivElement): void { el.style.visibility = 'hidden'; el.style.pointerEvents = 'none' }
function hienHan(el: HTMLDivElement): void { el.style.visibility = ''; el.style.pointerEvents = ''; el.style.display = '' }
function anBang(): void {
  const el = khung
  if (!el) return
  el.setAttribute('data-an', '')
  window.addEventListener('keydown', phimKhiAn, true)
  if (!toTrongTrang() || giamChuyenDong()) { baoAnHien(true); anHan(el); return }
  el.classList.remove('bpu-no')
  el.classList.add('bpu-san')
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!el.hasAttribute('data-an')) return
    baoAnHien(true) // dừng canvas đúng lúc bắt đầu thu
    el.classList.add('bpu-thu')
    const xong = () => { if (el.classList.contains('bpu-thu')) { anHan(el); el.classList.remove('bpu-thu', 'bpu-san') } }
    el.addEventListener('animationend', xong, { once: true })
    setTimeout(xong, 700)
  }))
}
function hienBang(): void {
  const el = khung
  if (!el || !el.hasAttribute('data-an')) return
  el.removeAttribute('data-an')
  window.removeEventListener('keydown', phimKhiAn, true)
  el.classList.remove('bpu-thu')
  baoAnHien(false)
  if (!giamChuyenDong()) { el.classList.add('bpu-san', 'bpu-no'); const bo = () => el.classList.remove('bpu-no', 'bpu-san'); el.addEventListener('animationend', bo, { once: true }); setTimeout(bo, 700) }
  hienHan(el)
  el.querySelector<HTMLElement>('.bpu-bang')?.focus()
}
/** Bảng đang ẩn mà tiêu điểm còn ở app (không ở tờ): D = Đạt, K / F = Chưa đạt vẫn chấm được; Esc / P đưa bảng về. */
function phimKhiAn(e: KeyboardEvent): void {
  if (!bangAn() || (e.target as HTMLElement | null)?.closest?.('input,textarea')) return
  const k = e.key.toLowerCase()
  if (k === 'd' || k === 'k' || k === 'f') { e.preventDefault(); e.stopImmediatePropagation(); chamTuTo(k === 'd'); return }
  if (k === 'escape' || k === 'p') { e.preventDefault(); e.stopImmediatePropagation(); hienBang() }
}
/** LÊN BẢNG BẰNG TỜ CŨ (thầy 08/11 «gọi hs lên bảng thì chuyển về màn chiếu cũ … bấm đạt hoặc ko đạt thì tự động chuyển sang bình phản ứng»):
 *  bảng thu nhỏ rồi ẨN (giữ nối phòng + trạng thái), tờ chạy màn lên bảng nguyên bản cho em bảng vừa chọn. Không có tờ ⇒ false (bảng tự lo như cũ). */
export function lenBangTo(em: { sbd: string; ten: string; goiNgay?: boolean; mau?: string; doi?: string }): boolean {
  if (!nguonTo || !khung) return false
  try { nguonTo.postMessage({ nguon: 'bpu-bang', lenh: 'len-bang', em: { sbd: em.sbd, ten: em.ten, goiNgay: em.goiNgay !== false, mau: em.mau ?? '', doi: em.doi ?? '' } }, '*') } catch { return false }
  anBang()
  try { nguonTo.focus() } catch { /* tờ chặn */ }
  return true
}
/** Tờ báo thầy đã chấm em lên bảng ⇒ bảng phóng lại, ghi kết quả + mở đáp án. Bảng không ẩn ⇒ bỏ qua (không ghi hai lần). */
export function chamTuTo(dat: boolean): void {
  if (!bangAn()) return
  hienBang()
  nhanCham?.(dat)
}
