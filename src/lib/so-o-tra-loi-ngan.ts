// SỐ Ô TRẢ LỜI NGẮN THEO TỪNG CÂU (sửa lỗi 15/10, em Lê Công báo: câu DH-10-C1-B1-III-18 đáp án "10000" mà màn làm bài chỉ cho 4 ô ⇒ em chỉ
// nhập được "1000" và bị chấm sai; từ bản dot13 12/10 mọi lượt ở 42 câu đáp số dài hơn 4 kí tự đều bị cắt như vậy).
// Thầy 15/10 ~10:25 (ảnh câu amine đáp án "24" mà màn hiện 4 ô): "tuỳ vào đáp án mà hiển thị đúng số ô cần điền nhé" ⇒ SỐ Ô = ĐÚNG số kí tự của đáp số
// gõ chuẩn (`dapSoGoPhim`): "24" ⇒ 2 ô, "7,5" ⇒ 3, "10000" ⇒ 5 (thay mức cố định 4 / 8 ô của bản sáng 15/10). Máy chủ gửi kèm mọi câu Phần III gõ được CHỈ con
// số ô, KHÔNG gửi đáp án. Câu thiếu số ô (gói cũ) ⇒ 4 ô như phiếu. Mọi phép ở đây THUẦN để test kỹ và dùng chung cho máy chủ (phát câu, nhập kho) lẫn máy học sinh.
import { khopPhanIII, soKhopSo } from './cham-so'
import { chuanHoaSoNhap, dinhTriKhoa, tachSoVaDonVi } from './cham-so-policy'

/** Phiếu Phần III có 4 ô: mỗi chữ số, dấu phẩy, dấu trừ chiếm một ô. */
export const SO_O_PHIEU = 4
/** Nhiều nhất bao nhiêu ô còn vừa màn điện thoại 340 px (ô co lại khi nhiều hơn 4). Đáp số gõ dài hơn ⇒ câu không vào kênh nhập số. */
export const TRAN_O = 8

/** Dạng bàn phím số gõ ra được: dấu trừ ở đầu (tuỳ), chữ số, nhiều nhất một dấu phẩy thập phân. */
const DANG_PHIM = /^-?\d+(?:,\d+)?$/

/** Một chuỗi số (đã chuẩn hoá hoặc chưa) ⇒ dạng bàn phím: "2116.4" ⇒ "2116,4"; đơn vị viết theo bị bỏ (máy chấm bỏ đơn vị khi chỉ một bên ghi). */
function veDangPhim(s: string): string | null {
  const t = tachSoVaDonVi(chuanHoaSoNhap(s), false)
  if (!t.ok) return null
  const so = t.so.numText.replace('.', ',')
  return DANG_PHIM.test(so) ? so : null
}

/**
 * Chuỗi NGẮN NHẤT em gõ được trên bàn phím số mà máy chủ chấm ĐÚNG cho đáp án `correct` (cả luật chấm luyện `khopPhanIII` lẫn luật chặt của game
 * `soKhopSo(…,'chat')`). Đáp án có số mũ ("1,2375×10⁹ kJ") ⇒ định trị ("1,2375") như luật chấm đã cho. Không gõ được (chữ, công thức, nhiều số) ⇒ null.
 */
export function dapSoGoPhim(correct: unknown): string | null {
  const s = String(correct ?? '').trim()
  if (!s) return null
  const dinhTri = dinhTriKhoa(s)
  const ung = [dinhTri === null ? null : veDangPhim(dinhTri), veDangPhim(s)]
  for (const x of ung) if (x && khopPhanIII(x, s) && soKhopSo(x, s, 'chat')) return x
  return null
}

/**
 * Số ô cho câu Phần III = ĐÚNG số kí tự đáp số gõ chuẩn (1..`TRAN_O`; thầy 15/10: "tuỳ vào đáp án mà hiển thị đúng số ô cần điền"). Không gõ được hoặc
 * cần hơn `TRAN_O` ô ⇒ null (câu KHÔNG vào kênh nhập số).
 */
export function soOPhanIII(correct: unknown): number | null {
  const x = dapSoGoPhim(correct)
  return x === null || x.length > TRAN_O ? null : x.length
}

/** Số ô HỢP LỆ máy chủ / gói đề gửi kèm (số nguyên 1..TRAN_O) — thiếu hoặc lạ ⇒ null. Khác `soOCuaCau`: KHÔNG tự về 4, vì ở màn kiểm tra
 *  (gói ca mở trước bản có trường này, hoặc câu bàn phím số không gõ được) phải giữ ô nhập tự do — về 4 là lặp lỗi "10000 ⇒ 1000" (15/10). */
export function soOHopLe(v: unknown): number | null {
  const n = typeof v === 'number' || typeof v === 'string' ? Number(v) : NaN
  return Number.isInteger(n) && n >= 1 && n <= TRAN_O ? n : null
}

/** Số ô máy học sinh dùng: số máy chủ gửi kèm câu (số nguyên 1..TRAN_O) hoặc 4 như phiếu khi thiếu. Giá trị lạ ⇒ 4. */
export function soOCuaCau(q: { soO?: unknown } | null | undefined): number {
  const v = q?.soO
  const n = typeof v === 'number' || typeof v === 'string' ? Number(v) : NaN
  return Number.isInteger(n) && n >= 1 && n <= TRAN_O ? n : SO_O_PHIEU
}

/**
 * CHỐT CHẶN KÊNH NHẬP SỐ (15/10): câu Phần III mà bàn phím số KHÔNG gõ được đủ đáp số trong `TRAN_O` ô ⇒ không vào kênh học/game (màn làm bài
 * của em). Chỉ dùng cho kho game (`normalizeBank` lúc nhập kho, `currentQuestion` lúc phát/chấm) — KHÔNG đổi luật tự luận dùng chung `laCauTuLuan`
 * (luật 30/09 của thầy: số như "1.237.500.000" vẫn là trả lời ngắn ở các kênh khác). Kho thật 15/10: 0 câu bị chặn.
 */
export function ngoaiKenhSo(q: { phan?: unknown; correct?: unknown }): boolean {
  return q.phan === 'III' && soOPhanIII(q.correct) === null
}
