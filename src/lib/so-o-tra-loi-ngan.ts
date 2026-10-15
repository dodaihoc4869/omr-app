// SỐ Ô TRẢ LỜI NGẮN THEO TỪNG CÂU (sửa lỗi 15/10, em Lê Công báo: câu DH-10-C1-B1-III-18 đáp án "10000" mà màn làm bài chỉ cho 4 ô ⇒ em chỉ
// nhập được "1000" và bị chấm sai; từ bản dot13 12/10 mọi lượt ở 42 câu đáp số dài hơn 4 kí tự đều bị cắt như vậy).
// Phiếu Phần III mặc định 4 ô. Câu nào đáp số chuẩn dài hơn 4 kí tự thì máy chủ gửi kèm SỐ Ô (chỉ con số `TRAN_O`, KHÔNG gửi đáp án, không lộ độ
// dài) để bàn phím số nhận đủ. Mọi phép ở đây THUẦN để test kỹ và dùng chung cho máy chủ (phát câu, nhập kho) lẫn máy học sinh.
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
 * Số ô cho câu Phần III: đáp số gõ ≤ 4 kí tự ⇒ 4 như phiếu; dài hơn ⇒ `TRAN_O` ô — MỘT MỨC CỐ ĐỊNH chứ không đúng bằng độ dài, để số ô không lộ đáp số
 * có mấy kí tự (em gõ "1000" mà thấy đúng 5 ô là đoán ra mình sai). Không gõ được hoặc cần hơn `TRAN_O` ô ⇒ null (câu KHÔNG vào kênh nhập số).
 */
export function soOPhanIII(correct: unknown): number | null {
  const x = dapSoGoPhim(correct)
  return x === null || x.length > TRAN_O ? null : x.length > SO_O_PHIEU ? TRAN_O : SO_O_PHIEU
}

/** Số ô máy học sinh dùng: số máy chủ gửi kèm câu (4 < n ≤ TRAN_O) hoặc 4 như phiếu. Giá trị lạ ⇒ 4. */
export function soOCuaCau(q: { soO?: unknown } | null | undefined): number {
  const n = Number(q?.soO)
  return Number.isInteger(n) && n > SO_O_PHIEU && n <= TRAN_O ? n : SO_O_PHIEU
}
