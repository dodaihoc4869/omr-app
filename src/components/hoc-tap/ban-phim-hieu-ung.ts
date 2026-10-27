// BÀN PHÍM SỐ KIỂU DUOLINGO (thầy 27/10: «Bấm chọn điền đáp án phải có hiệu ứng như dolingo nhé») — các phép THUẦN (không React, không DOM) để test:
// ô nào vừa nhận kí tự (bật chữ số vào ô), kí tự nào vừa bị xoá (thu nhỏ rồi biến mất), cuộn bao nhiêu để trọn bàn phím nằm trên thanh đáy.
// Chỉ phục vụ HIỆU ỨNG: không đổi luật nhập (`nhanPhim`), chấm hay gửi máy chủ.

/** Một lần đổi giá trị ô đáp án: `moi` = chỉ số ô vừa nhận kí tự (−1 nếu không có); `bong` = kí tự vừa xoá ở cuối (để vẽ bóng thu nhỏ). */
export interface DoiO { moi: number; bong: { i: number; ch: string } | null }

/**
 * So giá trị trước / sau một lần bấm phím:
 *  · thêm một kí tự ở cuối (chữ số, dấu phẩy) ⇒ `moi` = ô cuối;
 *  · thêm dấu âm ở đầu (phím «−») ⇒ `moi` = ô đầu;
 *  · xoá một kí tự cuối ⇒ `bong` = kí tự ấy ở đúng ô cũ;
 *  · còn lại (xoá hết, bỏ dấu âm, đổi hẳn giá trị) ⇒ không hiệu ứng riêng.
 */
export function doiO(truoc: string, sau: string): DoiO {
  const a = String(truoc ?? ''), b = String(sau ?? '')
  if (b.length === a.length + 1) {
    if (b.startsWith(a)) return { moi: b.length - 1, bong: null }
    if (b.endsWith(a)) return { moi: 0, bong: null }
  }
  if (b.length === a.length - 1 && a.startsWith(b)) return { moi: -1, bong: { i: b.length, ch: a[b.length]! } }
  return { moi: -1, bong: null }
}

/**
 * LÚC BẮT ĐẦU CÂU (màn nhỏ 360×640, Safari có thanh địa chỉ): bàn phím số nằm dưới thanh đáy dính (nút KIỂM TRA + các viên phụ) ⇒ cuộn khung
 * xuống vừa đủ để ĐÁY bàn phím nằm trên ĐỈNH thanh đáy cách `khoang` px. Không cuộn quá làm ĐỈNH ô đáp án ra khỏi khung (ô và bàn phím luôn thấy
 * cùng lúc). Đơn vị: px theo khung nhìn (`getBoundingClientRect`). Trả 0 khi đã thấy trọn hoặc chưa đo được.
 */
export function cuonThayBanPhim(o: { phimDay: number; thanhTren: number; oTren: number; khungTren: number; khoang?: number }): number {
  const k = o.khoang ?? 8
  if (![o.phimDay, o.thanhTren, o.oTren, o.khungTren].every(Number.isFinite) || o.phimDay <= 0 || o.thanhTren <= 0) return 0
  const can = o.phimDay - o.thanhTren + k
  if (can <= 0) return 0
  const toiDa = Math.max(0, o.oTren - o.khungTren - k)
  return Math.ceil(Math.min(can, toiDa))
}

/** Thời gian tối thiểu một phím «lún» (ms) — chạm thật nhanh vẫn thấy phím lún rồi bật lại như Duolingo. */
export const LUN_TOI_THIEU_MS = 80
