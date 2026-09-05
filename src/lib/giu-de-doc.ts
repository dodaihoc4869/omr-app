// GIỮ ĐỂ ĐỌC — GIUDEDOC.md, thầy duyệt 05/09.
//
// VÌ SAO CÓ FILE NÀY. Video thầy quay ngày 05/09 chứng minh cửa sổ nổi Gemini
// KHÔNG cướp tiêu điểm của Chrome: `document.hasFocus()` vẫn true,
// `visibilityState` vẫn 'visible', kích thước cửa sổ không đổi. Không phải cài
// sai — là không có gì để cài. Web không nhận được một bit nào về cái cửa sổ
// vẽ ở tầng hệ điều hành.
//
// Nên bỏ hẳn hướng "phát hiện cái gì đè lên", đổi sang hướng ngược lại: LÀM
// CHO VIỆC ĐÈ CỬA SỔ LÊN TRỞ NÊN VÔ ÍCH. Đề chỉ hiện khi ngón tay em còn trên
// màn thi. Muốn chạm vào cửa sổ nổi thì phải nhả tay, nhả tay thì đề tắt.
//
// `touchstart`/`touchmove`/`touchend` là sự kiện CỦA CHÍNH TRANG. Không hệ
// điều hành nào giấu được, không phụ thuộc trình duyệt có coi cửa sổ nổi là
// mất tiêu điểm hay không — khác hẳn `blur` và `hidden`, hai thứ vừa làm hỏng
// việc trong video.
//
// File này THUẦN LOGIC, không đụng DOM. Mọi luật ở đây và có test. Màn hình chỉ
// bơm sự kiện vào rồi hỏi `coMat()`.
//
// CẤM: khoá bài vì không chạm màn. Đây là cơ chế HIỂN THỊ, không phải xử phạt
// (GIUDEDOC mục 9). Bốn tín hiệu khoá của BAOMATCATHI giữ nguyên, không đụng.

// ---------------------------------------------------------------------------
// MỘT NGUỒN SỰ THẬT CẤU HÌNH (GIUDEDOC mục 3). Cấm rải số vào màn hình.

/** Nhả hết tay rồi, đề còn hiện thêm ngần này mới tắt.
 *
 * 3 giây: đủ để em nhấc tay đổi tư thế, gãi đầu, cầm bút; chưa đủ để mở một
 * cửa sổ nổi rồi đọc được gì trong đó. */
export const MS_AN_HAN_NHA_TAY = 3000

/** NGƯỠNG CỨNG: màn hình bất động quá ngần này thì CHE, không ngoại lệ nào.
 *
 * SỬA 05/09 sau khi thầy quay video: em chạm vào ô nhập Phần III một cái, con
 * trỏ nhấp nháy ở đó, và bản trước coi "đang gõ ô nhập" là miễn trừ vô điều
 * kiện — nên đề KHÔNG BAO GIỜ ẩn nữa. Một cú chạm là vô hiệu hoá cả cơ chế.
 *
 * Nay không còn miễn trừ nào vượt được ngưỡng này: caret đang nhấp nháy cũng
 * che, ngón kê im ở góc màn cũng che. Ngưỡng này thay luôn lớp "ngón chết" 20
 * giây của bản trước — 6 giây siết chặt hơn hẳn, nên lỗ hổng kê một ngón rồi
 * thao tác tay kia bị bịt kín hơn chứ không hở ra.
 *
 * "Bất động" = không chạm, không cuộn, không gõ phím, không di ngón. */
export const MS_BAT_DONG_CHE = 6000

/** Dưới ngần này pixel là rung tay, không phải di chuyển thật. So với ĐIỂM NEO
 * (chỗ ghi nhận di chuyển lần cuối) chứ không so với khung trước — nếu so
 * khung trước thì rê ngón thật chậm sẽ lách được ngưỡng bất động. */
export const PX_COI_LA_DI_CHUYEN = 8

/** Chạm là hiện NGAY trong cùng nhịp xử lý sự kiện. Không timer, không chờ. */
export const MS_HIEN_LAI = 0

/** Nhịp soi. Phải ≤ 100 ms để "tắt đúng ân hạn ± 100 ms" (mục 5) là thật. Việc
 * làm mỗi nhịp chỉ là so vài con số — không đụng DOM, không render. */
export const MS_NHIP_SOI_GIU = 50

/** Ca thi bật mặc định. Bài tập về nhà tắt: không có lý do làm phiền em ngồi
 * học ở nhà. */
export const BAT_MAC_DINH_CA_THI = true
export const BAT_MAC_DINH_BAI_TAP = false

/** Ba mức ân hạn thầy chọn ở màn Mở ca.
 *
 * Trần là `MS_BAT_DONG_CHE` (6 giây): chọn cao hơn cũng vô nghĩa vì ngưỡng cứng
 * che trước. Mức 10 giây của bản đầu đã bỏ vì lý do đó. */
export const AN_HAN_CHON_GIAY: readonly number[] = [2, 3, 5]

/** Chữ trên tấm phủ. Không có chữ "gian lận", "quay cóp", "vi phạm" — em nhả
 * tay để suy nghĩ là chuyện bình thường. */
export const CHU_TAM_PHU = 'Chạm để đọc tiếp'

/** Dòng dặn trước khi vào bài. Em biết trước thì không hoảng. */
export function chuDanTruoc(anHanGiay = MS_AN_HAN_NHA_TAY / 1000): string {
  return `Giữ ngón tay trên màn hình để đọc đề. Nhấc tay quá ${anHanGiay} giây, hoặc để màn hình im quá ${MS_BAT_DONG_CHE / 1000} giây, đề sẽ tạm ẩn; chạm lại là hiện.`
}

// ---------------------------------------------------------------------------
// MÁY TRẠNG THÁI

export interface NgonDangCham {
  id: number
  /** Điểm neo: chỗ ghi nhận di chuyển lần gần nhất. */
  x: number
  y: number
  /** Lúc ngón này động lần cuối (đặt xuống, hoặc rời neo quá `PX_COI_LA_DI_CHUYEN`). */
  mocDong: number
}

export interface TrangThaiGiu {
  ngon: NgonDangCham[]
  /** Hoạt động không phải chạm: nhả tay, cuộn quán tính, gõ phím. */
  mocHoatDong: number
}

export interface BoiCanhGiu {
  /** `navigator.maxTouchPoints > 0`. Máy không cảm ứng thì cơ chế KHÔNG bật. */
  coCamUng: boolean
  /** `document.activeElement` là ô nhập Phần III.
   *
   * KHÔNG còn là miễn trừ vô điều kiện (xem `MS_BAT_DONG_CHE`). Nó chỉ nới ân
   * hạn từ 3 giây lên đúng ngưỡng cứng 6 giây, để em đang tính toán rồi gõ đáp
   * án không bị nhấp nháy giữa chừng. */
  dangGoO: boolean
  anHanMs: number
}

export function moTrangThaiGiu(nay: number): TrangThaiGiu {
  return { ngon: [], mocHoatDong: nay }
}

export function chamXuong(tt: TrangThaiGiu, id: number, x: number, y: number, nay: number): void {
  const co = tt.ngon.find((n) => n.id === id)
  if (co) {
    co.x = x
    co.y = y
    co.mocDong = nay
    return
  }
  tt.ngon.push({ id, x, y, mocDong: nay })
  tt.mocHoatDong = nay
}

/** Chỉ dời neo khi ngón đã rời neo đủ xa. Rung tay dưới ngưỡng thì mốc bất
 * động KHÔNG được đếm lại — đó là chỗ bịt lỗ kê một ngón rồi rung nhẹ. */
export function chamDiChuyen(tt: TrangThaiGiu, id: number, x: number, y: number, nay: number): void {
  const n = tt.ngon.find((v) => v.id === id)
  if (!n) return chamXuong(tt, id, x, y, nay)
  if (Math.hypot(x - n.x, y - n.y) < PX_COI_LA_DI_CHUYEN) return
  n.x = x
  n.y = y
  n.mocDong = nay
  tt.mocHoatDong = nay
}

export function chamLen(tt: TrangThaiGiu, id: number, nay: number): void {
  tt.ngon = tt.ngon.filter((n) => n.id !== id)
  tt.mocHoatDong = nay
}

/** Cuộn quán tính và gõ phím: ân hạn đếm lại từ đây. */
export function ghiHoatDong(tt: TrangThaiGiu, nay: number): void {
  tt.mocHoatDong = nay
}

/** BỐN DÒNG, ĐỌC TỪ TRÊN XUỐNG.
 *
 * 0. Máy không có cảm ứng ⇒ cơ chế KHÔNG bật. Màn thi vốn dựng cho điện thoại;
 *    bật ở máy tính là khoá cứng bài của một em không làm gì sai.
 * 1. NGƯỠNG CỨNG: bất động quá `MS_BAT_DONG_CHE` ⇒ che, KHÔNG ngoại lệ. Đây là
 *    dòng thầy yêu cầu thêm 05/09, và nó đứng TRƯỚC mọi miễn trừ — kể cả con
 *    trỏ đang nhấp nháy trong ô nhập, kể cả ngón kê im ở góc màn.
 * 2. Caret trong ô nhập Phần III ⇒ hiện. Em đang tính toán rồi gõ đáp án thì
 *    không được nhấp nháy giữa chừng; nhưng chỉ được nới tới ngưỡng cứng.
 * 3. Tay còn trên màn ⇒ hiện.
 * 4. Nhả hết tay ⇒ còn ân hạn (mặc định 3 giây).
 *
 * Cuộn quán tính đi qua `mocHoatDong` nên không lọt vào ca nào ở trên: nhả tay
 * cho trang trôi thì mỗi sự kiện cuộn đẩy mốc lên, đề không tắt giữa lúc trôi. */
export function coMat(tt: TrangThaiGiu, nay: number, bc: BoiCanhGiu): boolean {
  if (!bc.coCamUng) return true
  const imLang = nay - mocGanNhat(tt)
  if (imLang >= MS_BAT_DONG_CHE) return false
  if (bc.dangGoO) return true
  if (tt.ngon.length > 0) return true
  return imLang < bc.anHanMs
}

/** Mốc hoạt động gần nhất, tính cả ngón đang chạm. */
export function mocGanNhat(tt: TrangThaiGiu): number {
  let m = tt.mocHoatDong
  for (const n of tt.ngon) if (n.mocDong > m) m = n.mocDong
  return m
}

// ---------------------------------------------------------------------------
// CẤU HÌNH CA

/** Ca mở trước bản này không có trường ⇒ TẮT, đúng hành vi cũ, không đổi điểm
 * ca đã gửi phụ huynh. */
export function batCuaCa(ca: { giuDeDoc?: boolean }): boolean {
  return ca.giuDeDoc === true
}

/** Mặc định gợi ý ở màn Mở ca, theo loại ca. */
export function batMacDinh(loai?: 'thi' | 'baitap'): boolean {
  return loai === 'baitap' ? BAT_MAC_DINH_BAI_TAP : BAT_MAC_DINH_CA_THI
}

/** Ân hạn thật, đã chặn trần ở ngưỡng cứng — ca cũ ghi 10 giây vẫn chạy đúng. */
export function anHanMsCua(giay?: number): number {
  const g = Number(giay)
  if (!Number.isFinite(g) || g <= 0) return MS_AN_HAN_NHA_TAY
  return Math.min(Math.round(g * 1000), MS_BAT_DONG_CHE)
}

// ---------------------------------------------------------------------------
// TRỢ GIÚP CHO MÀN HÌNH

export function dangGoOnhap(el: Element | null | undefined): boolean {
  if (!el) return false
  const t = el.tagName
  if (t === 'INPUT' || t === 'TEXTAREA') return true
  return (el as HTMLElement).isContentEditable === true
}

/** Màn thi vốn dựng cho điện thoại. Bật cơ chế ở máy tính là khoá cứng bài của
 * một em không làm gì sai. */
export function coCamUng(nav: { maxTouchPoints?: number } = navigator): boolean {
  return (nav.maxTouchPoints ?? 0) > 0
}

/** Hai con số thầy đọc ở Chi tiết ca. KHÔNG kết luận gì — nhả tay là chuyện
 * bình thường. Nhưng một em đề tắt 20 phút trong ca 50 phút là điều nên nhìn. */
export interface DemTatDe {
  soLanTatDe: number
  giayTatDe: number
}

export function chuTatDe(d: Partial<DemTatDe> | null | undefined): string {
  const lan = Number(d?.soLanTatDe) || 0
  const giay = Math.round(Number(d?.giayTatDe) || 0)
  if (lan <= 0) return ''
  const phut = Math.floor(giay / 60)
  return `đề tắt ${lan} lần / ${phut > 0 ? `${phut}p${String(giay % 60).padStart(2, '0')}` : `${giay}s`}`
}
