// CHỐNG GIAN LẬN THEO MỨC (QUANLYCATHI.md mục 6) — thuần logic, dùng trong
// ExamTakeScreen. Web KHÔNG phát hiện được chụp màn hình / app nổi đè; chỉ đo
// được rời tab, mất tiêu điểm, thoát toàn màn hình. Khoá ngay lần đầu là SAI
// (cuộc gọi đến, pin yếu cũng gây blur) → xử lý theo mức:
//   lần 1: ghi log + dải cảnh báo nhẹ · lần 2: cảnh báo đậm + rung ·
//   lần thứ `lan` (mặc định 3): khoá, tự nộp · rời quá `giay` (mặc định 30 s)
//   một lần: khoá ngay bất kể lần thứ mấy.
// Ngưỡng do thầy đặt khi mở ca (máy chủ trả về trong vaoThi). Sau khi thầy
// MỞ KHOÁ, đếm lại từ mốc `mocMoKhoa` (số lần rời màn lúc mở khoá) — lịch sử
// vẫn giữ nguyên để ghi lên Sheet.

export interface NguongGianLan {
  /** Số lần rời màn (kể từ lần mở khoá gần nhất) thì khoá bài. */
  lan: number
  /** Một lần rời quá số giây này thì khoá ngay. */
  giay: number
}

export const NGUONG_MAC_DINH: NguongGianLan = { lan: 3, giay: 10 }

/** Ngưỡng giây NHỎ NHẤT chấp nhận. Thầy chọn được 2 giây (BA-APP đợt 5) nên
 * không được loại giá trị dưới 5 — loại là ca đặt 2 giây sẽ âm thầm chạy 10. */
export const GIAY_TOI_THIEU = 1

export type MucCanhBao = 'nhe' | 'dam' | 'khoa'

// ---------------------------------------------------------------------------
// TÍN HIỆU NÀO MỚI THẬT SỰ LÀ "RỜI MÀN" — thầy báo 06/09
//
// Em làm bài trên iPhone bị khoá bài dù không thoát app lần nào.
//
// NGUYÊN NHÂN: `window` bắn `blur` ở RẤT NHIỀU tình huống không phải rời app.
// Trên iOS, chạm vào ô nhập đáp án làm BÀN PHÍM ẢO bật lên — và iOS bắn `blur`
// ngay lúc đó. Ba lần chạm ô trả lời ngắn là đủ ba "lần rời màn" và bài khoá.
// Kéo trung tâm điều khiển xuống một chút rồi thả, thanh địa chỉ Safari ẩn
// hiện, menu chọn chữ, cuộc gọi đến — cũng bắn `blur`.
//
// `document.hidden` thì ĐÁNG TIN: chỉ bật khi app thật sự vào nền. Bàn phím ảo
// KHÔNG làm nó bật.
//
// LUẬT TỪ NAY:
//   · `an` (visibilitychange → hidden) · `thoat_toan_man` → LUÔN tính.
//   · `mat_tieu_diem` (window blur):
//       - máy CẢM ỨNG (điện thoại, máy tính bảng) → KHÔNG tính. Em thoát app
//         trên máy cảm ứng thì `document.hidden` bật, đã bắt được rồi.
//       - máy có chuột → tính, NHƯNG phải chờ `MS_XAC_NHAN_BLUR` rồi kiểm lại
//         `document.hasFocus()`: bật bàn phím hay hộp thoại nhỏ thì tiêu điểm
//         quay lại ngay, còn chuyển hẳn sang cửa sổ khác thì không.
//
// Đánh đổi nói thẳng: máy cảm ứng nay KHÔNG bắt được trường hợp em mở cửa sổ
// nổi đè lên bài mà không đưa app vào nền. Web vốn không phát hiện được việc
// đó (đã ghi ở đầu file); đổi lại là không khoá oan em nào. Khoá oan một em
// đang làm bài tốn nhiều hơn bỏ sót một mẹo mà app vốn không thấy.

export type NguonRoiMan = 'an' | 'mat_tieu_diem' | 'thoat_toan_man'

/** Chờ bao lâu rồi mới xác nhận một `blur` là rời màn thật (máy có chuột). */
export const MS_XAC_NHAN_BLUR = 600

/** Máy này có phải máy cảm ứng không. iPad chạy iPadOS khai `Macintosh` nhưng
 * có `maxTouchPoints > 0`, nên đo bằng số điểm chạm chứ không đọc tên máy. */
export function laMayCamUng(nav: { maxTouchPoints?: number } | null | undefined = typeof navigator === 'undefined' ? null : navigator): boolean {
  return Number(nav?.maxTouchPoints ?? 0) > 0
}

/** Tín hiệu này có được tính là RỜI MÀN không.
 *
 * `conTieuDiem` chỉ dùng cho `mat_tieu_diem` trên máy có chuột: đó là giá trị
 * `document.hasFocus()` ĐỌC LẠI sau `MS_XAC_NHAN_BLUR`, không phải lúc bắn. */
export function tinhLaRoiMan(nguon: NguonRoiMan, camUng: boolean, conTieuDiem: boolean): boolean {
  if (nguon === 'an' || nguon === 'thoat_toan_man') return true
  if (camUng) return false
  return !conTieuDiem
}

export function chuanHoaNguong(n?: Partial<NguongGianLan> | null): NguongGianLan {
  const lan = Number(n?.lan)
  const giay = Number(n?.giay)
  return {
    lan: Number.isFinite(lan) && lan >= 1 ? Math.floor(lan) : NGUONG_MAC_DINH.lan,
    giay: Number.isFinite(giay) && giay >= GIAY_TOI_THIEU ? Math.floor(giay) : NGUONG_MAC_DINH.giay,
  }
}

/** Số lần rời màn TÍNH TỪ lần mở khoá gần nhất. */
export function soLanTinhTu(leaveCount: number, mocMoKhoa = 0): number {
  return Math.max(0, leaveCount - Math.max(0, mocMoKhoa))
}

/** Em vừa RỜI màn (hidden/blur/thoát toàn màn hình) lần thứ `leaveCountMoi`
 * (đã cộng 1). Trả về mức xử lý cho lần này. */
export function mucKhiRoiMan(leaveCountMoi: number, mocMoKhoa: number, nguong: NguongGianLan): MucCanhBao {
  const n = soLanTinhTu(leaveCountMoi, mocMoKhoa)
  if (n >= nguong.lan) return 'khoa'
  return n >= 2 ? 'dam' : 'nhe'
}

/** Em QUAY LẠI sau `giayRoi` giây (hoặc đồng hồ chờ khi còn ẩn tới ngưỡng): khoá nếu rời quá lâu. */
export function khoaViRoiLau(giayRoi: number, nguong: NguongGianLan): boolean {
  return giayRoi > nguong.giay
}

// ---------------------------------------------------------------------------
// BẰNG CHỨNG RỜI MÀN — dựng từ nhật ký thô để báo cáo nói được TỪNG LẦN, chứ
// không chỉ một con số tổng.
//
// Máy ghi bốn loại sự kiện: `hidden`/`visible` (tab bị ẩn) và `blur`/`focus`
// (cửa sổ mất tiêu điểm). Chuyển tab bắn CẢ HAI cặp gần như cùng lúc, nên đếm
// thẳng là ra gấp đôi. Luật ở đây: đang ở trong bài mà gặp `hidden` hoặc `blur`
// thì tính MỘT lần rời và ghi mốc; đang ở ngoài thì mọi sự kiện rời tiếp theo
// bị bỏ qua cho tới khi có `visible`/`focus` kéo về.
//
// Lần rời còn dở (em không quay lại, bài tự nộp) vẫn được ghi, `giay = null` —
// thà nói "không rõ bao lâu" còn hơn bịa một con số.

export interface MocRoiMan {
  /** ISO lúc rời khỏi màn làm bài. */
  luc: string
  /** Số giây rời. `null` = chưa thấy quay lại trong nhật ký. */
  giay: number | null
}

export function mocRoiMan(events: { type: string; at: string }[] | null | undefined): MocRoiMan[] {
  const ra: MocRoiMan[] = []
  let dangNgoai: number | null = null
  for (const e of events ?? []) {
    const t = new Date(e.at).getTime()
    if (!Number.isFinite(t)) continue
    const roi = e.type === 'hidden' || e.type === 'blur'
    const ve = e.type === 'visible' || e.type === 'focus'
    if (roi && dangNgoai === null) {
      dangNgoai = t
      ra.push({ luc: e.at, giay: null })
    } else if (ve && dangNgoai !== null) {
      ra[ra.length - 1].giay = Math.max(0, Math.round((t - dangNgoai) / 1000))
      dangNgoai = null
    }
  }
  return ra
}

/** Câu chữ trên dải cảnh báo — thẳng, không doạ quá mức (người dùng vị thành niên). */
export function loiCanhBao(muc: Exclude<MucCanhBao, 'khoa'>, soLan: number, nguong: NguongGianLan): string {
  if (muc === 'nhe') return `Em vừa rời khỏi bài làm (lần ${soLan}). Thầy sẽ thấy điều này.`
  const conLai = Math.max(0, nguong.lan - soLan)
  return conLai > 0
    ? `Rời khỏi bài làm lần ${soLan}. Còn ${conLai} lần nữa là bài bị khoá — rời quá ${nguong.giay} giây cũng khoá.`
    : `Rời khỏi bài làm lần ${soLan}. Lần sau bài bị khoá.`
}
