// BÌNH PHẢN ỨNG — GẮN BẢNG CHIẾU TỪ TỜ CHIẾU (nạp lười từ src/lib/bpu/nghe-to-chieu.ts — không nằm trong khung app thầy).
// Tờ vào đợt mới (TỰ ĐỘNG, thầy 07/11) hoặc thầy bấm P ⇒ lấy buổi điểm danh đang mở ⇒ mở bảng đè lên tờ và mở lượt cho câu đang chiếu (giây ước tính của câu).
// Bảng bấm «Câu tiếp» / ← → ⇒ nhắn ngược tờ đổi đợt ⇒ tờ báo câu mới ⇒ lượt mới trên cùng bảng.
// Tin tự động mà không có buổi đang mở / phòng không mở được / câu không gửi được ⇒ KHÔNG che tờ: đóng bảng, báo một lần, thầy chữa trên tờ như thường.
// 09/11 (thầy «trùng tu lại toàn bộ màn này»): MỘT gốc bảng cho cả điểm danh lẫn các lượt (`moBangDiemDanh` → «Xong điểm danh» → chọn câu ngay trên bảng
// `chieuCau` ⇒ tờ chiếu dựng sẵn nằm dưới bảng); gọi lên bảng ⇒ bảng THU NHỎ vào tờ cũ, chấm Đạt / Chưa đạt ⇒ bảng PHÓNG LẠI.
import { createRoot, type Root } from 'react-dom/client'
import { buoiDangMo, laBuoiLive, type BuoiHoc } from '../../lib/buoi-hoc-api'
import { useAppStore } from '../../store/appStore'
import type { CauDayHoc } from '../../lib/day-hoc-len-bang'
import BangBinhPhanUng from './BangBinhPhanUng'
import { hienKetQua, tatTheKq } from './TheKetQuaLenBang'
import { layPhong } from './cau-live'
import type { LichLive } from '../../lib/live-khoi/kieu'

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
let hien: { buoiId: string; ma?: string | null; linkQr?: string | null; qid?: string | null; luot?: number; giay?: number; tuDong?: boolean; diemDanh?: boolean; bo?: boolean } | null = null
/** (10/11) Câu thầy vừa chọn ở bảng chọn câu khi đang có lượt ⇒ lượt mới của ĐÚNG câu ấy bỏ lượt dở cũ (không chấm, không cộng / trừ kJ). */
let boQid = ''
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
  ds = ds.filter((b) => !laBuoiLive(b)) // buổi live theo khối có bảng riêng (mở từ nút Live), không nhận tin của tờ chiếu buổi trên lớp
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
const QID_BANG = '@bang'
type TuyChonMo = { giay?: number; tuDong?: boolean; nguon?: Window | null }
export function moBangTuToChieu(qid: string, o: TuyChonMo = {}): Promise<void> {
  // Tờ bảng trắng của live: chỉ ghi nhận cửa sổ tờ (để bật Live), không mở lượt.
  if (qid === QID_BANG) { if (o.nguon) nguonTo = o.nguon; return Promise.resolve() }
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
// ESC MỘT LẦN Ở BẤT KỲ ĐÂU ⇒ RA HÔM NAY (thầy 09/11 «khi bấm esc thoát hẳn ra màn hôm nay ở bất kì chỗ nào, hiện tại phải bấm rất nhiều lượt»):
// nghe ở pha BẮT (trước mọi bảng / bảng chọn / tấm) — bỏ qua các lớp con; tờ chiếu trong khung (iframe) báo Esc qua tin `bpu-esc` (nghe-to-chieu.ts).
let daNgheEsc = false
function ngheEsc(): void {
  if (daNgheEsc || typeof window === 'undefined') return
  daNgheEsc = true
  // 10/11: thẻ kết quả lên bảng đang hiện ⇒ phím bất kì (cả Esc) chỉ chuyển ngay về màn đua, không lọt xuống bảng / không ra Hôm nay.
  window.addEventListener('keydown', (e) => { if (tatTheKq() || (e.key === 'Escape' && escRaHomNay())) { e.preventDefault(); e.stopImmediatePropagation() } }, true)
}
/** Esc: có phiên đang hiện ⇒ tạm ẩn cả phiên (giữ chỗ dở) + về Hôm nay; chỉ có tấm buổi dạy mở từ Hôm nay ⇒ đóng tấm. Trả true nếu đã xử lý. */
export function escRaHomNay(): boolean {
  if (khung && !tamAn) { tamAnTatCa(); return true }
  if (!khung && hdKhung) { dongHoatDong(); return true }
  return false
}
// LIVE BẢNG (10/11, docs/dac-ta-live-bang-1011.md mục 2.1): phần live của máy thầy (src/components/live/thay-noi.ts, nạp lười) báo có / đang live ⇒ nút «Live»
// trên thanh trên của bảng — giữ trạng thái «Đang live» qua mọi màn (tờ chiếu, bảng đua, chọn câu) vì live nằm ở cửa sổ app, không ở tờ.
// Thầy chốt tối 10/11: live = TIẾNG chạy suốt buổi ⇒ bấm Live trên bảng thì live NGAY TẠI CHỖ (mic đã nhớ), bảng không lui. Chỉ lui về tờ khi cần thẻ chọn mic
// (lần đầu) hoặc khi đang live mà thầy bấm «Đang live» (cụm điều khiển — mic, «Bảng → máy em», «Tắt live» — nằm trên tờ). Esc / P đưa bảng về, live vẫn chạy.
// Đang live mà bảng đang lui (thầy giảng trên tờ) ⇒ ẩn viền đỏ toàn màn «Rời màn hình» (bpu-bang.css) — tờ có thẻ gọn «N em rời màn» không che bảng.
let liveTt = { co: false, bat: false }
let phienLive = false
let daTuBat = false
/** LIVE THEO KHỐI (12/11): nút Live ở Hôm nay mở phòng chờ của khối — lớp nổi máy thầy nạp lười (src/components/live-khoi/thay-khoi.tsx). */
export const moBangLiveKhoi = (o: { lich: LichLive; buoiId: string; ma: string }): Promise<void> => import('../live-khoi/thay-khoi').then((m) => m.moBangLiveKhoi(o))
/** Bảng đang lui vì live (không phải vì em lên bảng) ⇒ D / K / F ở app không chấm ai. */
let anViLive = false
export function datLive(tt: { co: boolean; bat: boolean }): void {
  if (tt.co === liveTt.co && tt.bat === liveTt.bat) return
  liveTt = tt
  // LIVE THEO KHỐI (12/11): `co` chỉ bật ở buổi live của khối (thay-noi.ts) ⇒ tờ vừa sẵn sàng là tự bật live một lần, thầy không phải tìm nút.
  if (!tt.co) daTuBat = false
  else if (!tt.bat && !daTuBat) { daTuBat = true; bamLive() }
  capLiveGon()
  if (hien && khung) veBang()
}
function capLiveGon(): void { document.documentElement.toggleAttribute('data-bpu-live-gon', liveTt.bat && (bangAn() || tamAn)) }
function bamLive(): void {
  if (!nguonTo || !khung) { useAppStore.getState().showToast('Thầy chọn câu để có tờ chiếu rồi bật Live.', 'warn'); return }
  void import('../live/thay-noi').then((m) => {
    if (!m.bamTuBang() || !nguonTo || !khung || bangAn()) return
    anViLive = true
    anBang()
    try { nguonTo.focus() } catch { /* tờ chặn */ }
  }).catch(() => {})
}
function veBang(): void {
  if (!hien) return
  ngheEsc()
  if (!khung) { khung = document.createElement('div'); khung.setAttribute('data-bpu-bang', ''); document.body.appendChild(khung); goc = createRoot(khung) }
  if (phienLive && !khung.hasAttribute('data-an')) { khung.setAttribute('data-an', ''); anHan(khung); baoAnHien(true) }
  cheTo(!tamAn && !bangAn()) // bảng ở trên (kể cả đang phóng lại — kín màn từ khung đầu) ⇒ tờ ẩn
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
      them={liveTt.co ? <button type="button" className={`bb-hoi bb-live${liveTt.bat ? ' bat' : ''}`} onClick={bamLive} title="Live: cả lớp xem bảng thầy viết và nghe thầy trên máy"><i aria-hidden="true" />{liveTt.bat ? 'Đang live' : 'Live'}</button> : undefined}
    />,
  )
}
async function moThat(qid: string, o: TuyChonMo): Promise<void> {
  const tuDong = o.tuDong === true
  if (tuDong && Date.now() < nghiDen) return
  // 10/11 (lần 3) «vẫn chưa load hẳn vào đua top»: bảng đang mở ⇒ lượt thuộc ĐÚNG buổi của bảng, không hỏi lại máy chủ. Trước đây tin tự động lấy buổi ĐẦU danh
  // sách «đang mở trong 4 giờ» ⇒ thầy còn buổi khác mở thì bảng dựng lại cho buổi kia («Đang mở…» → lượt cũ của phòng kia → mới tới màn đua), lại chờ một
  // lượt hỏi máy chủ (300–1500 ms) mỗi khi hết 60 giây nhớ.
  const buoiId = khung && hien ? hien.buoiId : await layBuoi(tuDong)
  if (!buoiId) return
  if (o.nguon) nguonTo = o.nguon
  dem += 1
  // Bảng đang lui sau tấm buổi dạy (Kiểm tra đầu giờ / Chữa câu…) mà tờ của khối ấy vừa báo câu ⇒ bảng hiện lại với câu đó.
  if (anViHd) { anViHd = false; hienBang() }
  const cung = hien?.buoiId === buoiId
  const bo = !!boQid && boQid === qid
  if (bo) boQid = ''
  hien = { ...(cung ? { ma: hien!.ma, linkQr: hien!.linkQr } : {}), buoiId, qid, luot: dem, giay: o.giay, tuDong, bo }
  veBang()
  // Màn Hành trình (bước «Chọn câu & chiếu») nghe để sang bước «Đang chiếu».
  try { window.dispatchEvent(new CustomEvent('bpu-dang-chieu', { detail: { buoiId } })) } catch { /* trình duyệt cũ */ }
}
/** CHIẾU ĐIỂM DANH = MỞ MÀN Bình Phản Ứng (bước Điểm danh của app thầy). Bảng đang mở cho đúng buổi ⇒ chỉ cập nhật mã, giữ câu đang chiếu. */
export function moBangDiemDanh(o: { buoiId: string; ma?: string | null; linkQr?: string | null; onDong?: () => void; live?: boolean }): void {
  dongNgoai = o.onDong ?? dongNgoai
  if (hien?.buoiId === o.buoiId && khung) {
    // Đang tạm ẩn (Esc ra Hôm nay) ⇒ hiện lại ĐÚNG chỗ dở (bảng / tờ / tấm như lúc ra). Đang hiện ⇒ chỉ cập nhật mã (em có thể đang trên bảng).
    if (tamAn) hienLaiTatCa()
    if (o.ma !== undefined) capNhatMa(o.buoiId, o.ma, o.linkQr)
    return
  }
  if (khung) { dongBang(); dongTo() } // buổi khác ⇒ đóng phiên cũ
  phienLive = !!o.live
  // Mở mới ⇒ LUÔN màn điểm danh (thầy 09/11 «thoát ra hẳn thì không có chỗ vào lại màn điểm danh»), kể cả phòng còn lượt cũ; chọn câu ⇒ hết cờ.
  hien = { buoiId: o.buoiId, ma: o.ma, linkQr: o.linkQr, diemDanh: true }
  veBang()
  void import('../live-khoi/thay-khoi').then((m) => m.ngheBangKhoi()).catch(() => {})
  phatPhien()
}
// ESC = RA HÔM NAY, GIỮ NGUYÊN CHỖ DỞ (thầy 09/11 «khi tôi bấm esc thì out hẳn ra màn hôm nay, bấm vào điểm danh thì vào đúng chỗ đang dở»): ẩn bảng + tờ +
// tấm (không gỡ — nối phòng, câu, em đang lên bảng giữ nguyên), thoát toàn màn hình, trả cuộn cho Hôm nay. Nút Điểm danh ⇒ `moBangDiemDanh` cùng buổi ⇒ hiện lại.
/** Phiên Bình Phản Ứng đang có trên máy này (hiện hoặc tạm ẩn) — nút Điểm danh / Kết thúc ở Hôm nay đọc. */
export function phienDangCo(): { buoiId: string; tamAn: boolean } | null { return hien && khung ? { buoiId: hien.buoiId, tamAn } : null }
/** Phiên đang có là buổi LIVE THEO KHỐI (thầy 12/11 «tách hẳn hai cái ra»): bảng Bình Phản Ứng vẫn gắn để giữ nối phòng + mở lượt cho câu tờ chiếu, nhưng
 *  ẨN SUỐT BUỔI (không điểm danh, không màn đua) — mặt của buổi live là lớp nổi src/components/live-khoi (phòng chờ → chọn bài → tờ giảng). Nút «Lên bảng»
 *  ở Hôm nay không sáng, không hiện «Kết thúc buổi». */
function phatPhien(): void { try { window.dispatchEvent(new CustomEvent('bpu-phien', { detail: phienLive ? null : phienDangCo() })) } catch { /* trình duyệt cũ */ } }
const caKhung = () => [khung, toKhung, hdKhung].filter((x): x is HTMLDivElement => !!x)
const TEN_TO = 'Tờ chiếu Bình Phản Ứng'
/** Mọi lớp phủ tờ chiếu đang có (KhungXemPhieu cổng thẳng vào body): tờ dựng từ bảng chọn câu + tờ của màn khác đang nối bảng. */
const lopTo = () => [...document.querySelectorAll<HTMLElement>('.lop-xem-phieu')]
/** Lớp phủ tờ đã ẩn lúc Esc / Đóng ra Hôm nay ⇒ hiện lại khi vào lại đúng chỗ dở. */
let anTam: HTMLElement[] = []
function traAnTam(): void { for (const el of anTam) if (el.isConnected) { el.style.visibility = ''; el.style.pointerEvents = '' } anTam = [] }
/** CHE TỜ KHI BẢNG Ở TRÊN (thầy 10/11): tờ chiếu cũ nằm dưới bảng chỉ lộ ra lúc em lên bảng (bảng thu) — chọn câu / chuyển câu / Esc không lộ tờ
 *  một nhịp nào. CSS ở bpu-bang.css (nạp cùng bảng); tờ vẫn chạy ngầm (báo câu, dựng thẻ tên) vì visibility không dừng trang trong khung. */
function cheTo(che: boolean): void { document.documentElement.toggleAttribute('data-bpu-che-to', che) }
function tamAnTatCa(): void {
  if (!khung || tamAn) return
  tamAn = true
  // 10/11 thầy «bấm Đóng lộ tờ chiếu cũ một nhịp rồi mới tới Hôm nay»: tờ (KhungXemPhieu) cổng THẲNG vào body, không nằm trong `toKhung` ⇒ ẩn cả lớp phủ
  // tờ ngay trong nhịp này (bảng, tờ, tấm cùng lúc; không hoạt ảnh thu bảng). Nhớ để hiện lại đúng chỗ dở.
  for (const el of [...caKhung(), ...lopTo()]) if (el.style.visibility !== 'hidden') { el.style.visibility = 'hidden'; el.style.pointerEvents = 'none'; if (!(caKhung() as HTMLElement[]).includes(el)) anTam.push(el) }
  cheTo(false)
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
  traAnTam()
  cheTo(!bangAn())
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
  ngheEsc()
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
  void import('../live-khoi/thay-khoi').then((m) => m.khiKetThucBuoi(buoiId)).catch(() => {})
  dongBang(); dongHoatDong(); dongTo()
  try { useAppStore.getState().setScreen('tongquan') } catch { /* app học sinh / test */ } // 10/11: một lần bấm ⇒ bảng đóng, về Hôm nay
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
/** Gắn tờ chiếu (khung trong app) dưới bảng. */
function ganTo(html: string, KhungXemPhieu: typeof import('../KhungXemPhieu').default): string {
  if (!toKhung) { toKhung = document.createElement('div'); toKhung.setAttribute('data-bpu-to', ''); document.body.appendChild(toKhung); toGoc = createRoot(toKhung) }
  // Tờ nạp NGẦM dưới bảng, ẩn hẳn (html[data-bpu-che-to]) ⇒ chọn câu xong hiện ngay màn đua, không lộ tờ (thầy 10/11). Tiêu điểm giữ ở bảng (phím C L →).
  // Che TRƯỚC khi khung tờ gắn vào trang ⇒ khung đầu tiên của tờ (cả dải xám 48 px trên cùng) đã ẩn.
  if (khung && !bangAn() && !tamAn) cheTo(true)
  toGoc!.render(<KhungXemPhieu html={html} ten={TEN_TO} dong={() => (khung ? tamAnTatCa() : dongTo())} />)
  requestAnimationFrame(() => { if (khung && !bangAn()) khung.querySelector<HTMLElement>('.bpu-bang')?.focus() })
  return ''
}
/** LIVE THEO KHỐI — chế độ «Bảng» khi chưa chọn bài (thầy 12/11): tờ BẢNG TRẮNG (không câu, mã `@bang` ⇒ không mở lượt, không gửi gì xuống máy em) để thầy
 *  có bút + bảng + nút Live ngay. Trả câu báo lỗi (rỗng = đã có tờ). */
export async function chieuBangTrang(): Promise<string> {
  try {
    const [{ taoHtmlMayChieu }, { default: KhungXemPhieu }] = await Promise.all([import('../../lib/html-may-chieu'), import('../KhungXemPhieu')])
    const cau = { phan: 'I', id: QID_BANG, maDe: '', chuyenDe: '', dang: '', sao: 1, mucDo: '', text: '', luaChon: [], dapAn: '', chot: '', lyDo: [] }
    return ganTo(taoHtmlMayChieu([{ sbd: '', hoTen: 'Cả lớp', qid: QID_BANG, soCau: 1, sao: 1, bacUoc: 1, cau }] as never, { tenBuoi: 'Live · Bảng', nutAiSai: false } as never), KhungXemPhieu)
  } catch (e) { return e instanceof Error ? e.message : 'Chưa dựng được bảng.' }
}
export async function chieuCau(ds: CauDayHoc[], moi = false): Promise<string> {
  if (!ds.length) return 'Chưa chọn câu nào.'
  let html = ''
  try {
    const { dungToChieuBpu } = await import('../../lib/bpu/to-chieu-bpu')
    html = await dungToChieuBpu(ds, `Bình Phản Ứng · ${ds[0]!.tenDe}`)
  } catch (e) { return e instanceof Error ? e.message : 'Chưa dựng được tờ chiếu.' }
  const { default: KhungXemPhieu } = await import('../KhungXemPhieu')
  nghiDen = 0
  tiepNgay = true // thầy vừa chọn câu = ý muốn rõ ⇒ gửi NGAY (cùng khung tờ cũ thì không coi là «tờ mới»)
  // 10/11 thầy «chọn câu khác ⇒ bắt đầu lượt mới và xoá lượt câu cũ»: đang có lượt ⇒ lượt mới của câu này bỏ lượt dở (máy chủ giữ lượt đã mở đáp án).
  // `moi` (bảng báo): phòng có lượt câu này đã mở đáp án ⇒ hỏi lại cả lớp (lượt mới), không nối lại màn mở đáp án cũ.
  boQid = hien?.qid || moi ? ds[0]!.qid : ''
  return ganTo(html, KhungXemPhieu)
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
  boQid = ''
  tiepNgay = true
  try { nguonTo?.postMessage({ nguon: 'bpu-bang', lenh: 'toi', d }, '*') } catch { /* tờ đã đóng */ }
}
/** Tờ báo đã hết câu theo hướng d. */
export function baoHetCau(d: 1 | -1): void {
  try { window.dispatchEvent(new CustomEvent('bpu-het-cau')) } catch { /* trình duyệt cũ */ } // bảng thôi chờ câu kế (cho-luot.ts)
  useAppStore.getState().showToast(d > 0 ? 'Đã tới câu cuối của tờ chiếu.' : 'Đang ở câu đầu.', 'warn')
}
export function dongBang(): void {
  if (liveTt.bat) layPhong()?.gui({ t: 'live-tat' }) // bảng đóng hẳn (nối phòng sắp rớt) ⇒ tắt live trước, máy em không kẹt ở bảng live
  anViLive = false
  goc?.unmount(); goc = null; khung?.remove(); khung = null; nhanCham = null; hien = null; tamAn = false; boQid = ''
  document.documentElement.removeAttribute('data-bpu-an')
  traAnTam(); cheTo(false); capLiveGon() // bảng đóng (lùi về tờ: G, câu không gửi được…) ⇒ tờ hiện như thường
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
  capLiveGon()
  cheTo(false) // tờ lộ ra ngay dưới bảng đang thu
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
  if (!el || !el.hasAttribute('data-an') || phienLive) return
  el.removeAttribute('data-an')
  anViLive = false
  capLiveGon()
  window.removeEventListener('keydown', phimKhiAn, true)
  el.classList.remove('bpu-thu')
  baoAnHien(false)
  // 10/11 (lần 3): che tờ NGAY và bảng kín màn từ khung đầu (trước đây bảng mờ dần 0 → 1 trên tờ ~0,5 s ⇒ tờ cũ lẫn dưới thẻ kết quả); chỉ còn nhịp
  // «đáp xuống» nhẹ bằng transform (bpu-no), thẻ kết quả nảy lên trên.
  if (!tamAn) cheTo(true)
  if (!giamChuyenDong()) { el.classList.add('bpu-san', 'bpu-no'); const bo = () => el.classList.remove('bpu-no', 'bpu-san'); el.addEventListener('animationend', bo, { once: true }); setTimeout(bo, 700) }
  hienHan(el)
  el.querySelector<HTMLElement>('.bpu-bang')?.focus()
}
/** Bảng đang ẩn mà tiêu điểm còn ở app (không ở tờ): D = Đạt, K / F = Chưa đạt vẫn chấm được; Esc / P đưa bảng về. */
function phimKhiAn(e: KeyboardEvent): void {
  if (!bangAn() || (e.target as HTMLElement | null)?.closest?.('input,textarea')) return
  const k = e.key.toLowerCase()
  if (!anViLive && (k === 'd' || k === 'k' || k === 'f')) { e.preventDefault(); e.stopImmediatePropagation(); chamTuTo(k === 'd'); return }
  if (k === 'escape' || k === 'p') { e.preventDefault(); e.stopImmediatePropagation(); hienBang() }
}
/** LÊN BẢNG BẰNG TỜ CŨ (thầy 08/11 «gọi hs lên bảng thì chuyển về màn chiếu cũ … bấm đạt hoặc ko đạt thì tự động chuyển sang bình phản ứng»):
 *  bảng thu nhỏ rồi ẨN (giữ nối phòng + trạng thái), tờ chạy màn lên bảng nguyên bản cho em bảng vừa chọn. Không có tờ ⇒ false (bảng tự lo như cũ). */
export function lenBangTo(em: { sbd: string; ten: string; goiNgay?: boolean; mau?: string; doi?: string }): boolean {
  if (!nguonTo || !khung) return false
  anViLive = false
  try { nguonTo.postMessage({ nguon: 'bpu-bang', lenh: 'len-bang', em: { sbd: em.sbd, ten: em.ten, goiNgay: em.goiNgay !== false, mau: em.mau ?? '', doi: em.doi ?? '' } }, '*') } catch { return false }
  anBang()
  try { nguonTo.focus() } catch { /* tờ chặn */ }
  return true
}
/** Tờ báo thầy đã chấm em lên bảng ⇒ bảng phóng lại, ghi kết quả + mở đáp án. Bảng không ẩn ⇒ bỏ qua (không ghi hai lần).
 *  10/11 (thầy «hiện KẾT QUẢ khoảng 3 giây rồi mới chuyển mượt về màn đua top»): thẻ kết quả nổi trên bảng đang phóng (TheKetQuaLenBang). */
export function chamTuTo(dat: boolean): void {
  if (!bangAn() || anViLive) return
  hienKetQua(dat)
  hienBang()
  nhanCham?.(dat)
}
