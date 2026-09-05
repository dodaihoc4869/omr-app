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

/** Một ngón chạm mà KHÔNG di chuyển quá ngần này thì thôi được tính là bằng
 * chứng có mặt.
 *
 * Lớp này tồn tại vì đúng một lý do, ghi ra để sau này không ai gỡ nhầm: em có
 * thể kê một ngón bất động ở góc màn thi rồi dùng tay kia thao tác cửa sổ nổi.
 * Người đọc bài thật thì tay luôn nhúc nhích — cuộn, đổi chỗ tì, chọn đáp án.
 *
 * 20 giây, đặt rộng hẳn để không phiền em đang tì tay đọc một câu Phần II dài. */
export const MS_NGON_CHET = 20000

/** Dưới ngần này pixel là rung tay, không phải di chuyển thật. So với ĐIỂM NEO
 * (chỗ ghi nhận di chuyển lần cuối) chứ không so với khung trước — nếu so
 * khung trước thì rê ngón thật chậm sẽ lách được cả 20 giây. */
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

/** Bốn mức ân hạn thầy chọn ở màn Mở ca. */
export const AN_HAN_CHON_GIAY: readonly number[] = [2, 3, 5, 10]

/** Chữ trên tấm phủ. Không có chữ "gian lận", "quay cóp", "vi phạm" — em nhả
 * tay để suy nghĩ là chuyện bình thường. */
export const CHU_TAM_PHU = 'Chạm để đọc tiếp'

/** Dòng dặn trước khi vào bài. Em biết trước thì không hoảng. */
export function chuDanTruoc(anHanGiay = MS_AN_HAN_NHA_TAY / 1000): string {
  return `Giữ ngón tay trên màn hình để đọc đề. Nhấc tay quá ${anHanGiay} giây, đề sẽ tạm ẩn; chạm lại là hiện.`
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
  /** `document.activeElement` là ô nhập Phần III. Gõ bàn phím thì tay không
   * chạm màn; tắt đề lúc đó là chặn em làm bài. */
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

/** Chỉ dời neo khi ngón đã rời neo đủ xa. Rung tay dưới ngưỡng thì mốc ngón
 * chết KHÔNG được đếm lại — đó là toàn bộ điểm của lớp 3. */
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

/** Ngón còn được tính là bằng chứng có mặt hay không. */
export function ngonConSong(n: NgonDangCham, nay: number): boolean {
  return nay - n.mocDong < MS_NGON_CHET
}

/** BA LỚP ĐIỀU KIỆN.
 *
 * Lớp 1 — có ít nhất một ngón đang chạm và còn sống ⇒ hiện đề.
 * Lớp 2 — nhả hết tay thì còn ân hạn.
 * Lớp 3 — ngón bất động quá `MS_NGON_CHET` thôi được tính (lỗ hổng kê một ngón).
 *
 * Ba ca KHÔNG BAO GIỜ tắt đề đứng trước cả ba lớp: máy không cảm ứng, đang gõ
 * ô nhập Phần III, và (qua `mocHoatDong`) đang cuộn quán tính. Sai một trong ba
 * ca này là em mất bài oan, nặng hơn hẳn bỏ sót một ca gian lận. */
export function coMat(tt: TrangThaiGiu, nay: number, bc: BoiCanhGiu): boolean {
  if (!bc.coCamUng) return true
  if (bc.dangGoO) return true
  if (tt.ngon.some((n) => ngonConSong(n, nay))) return true
  // Ngón chết KHÔNG được cấp thêm ân hạn: `mocDong` của nó đã cũ hơn 20 giây
  // nên `mocGanNhat` vẫn quá hạn, đề tắt đúng lúc ngón chết.
  return nay - mocGanNhat(tt) < bc.anHanMs
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

export function anHanMsCua(giay?: number): number {
  const g = Number(giay)
  if (!Number.isFinite(g) || g <= 0) return MS_AN_HAN_NHA_TAY
  return Math.round(g * 1000)
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
