// CHUẨN HOÁ ĐÁP ÁN SỐ (Phần III) DÙNG CHUNG cho các kênh LUYỆN TẬP (Boss 21/09, P0 "0,54 chấm sai"; thầy: "quét hết mọi chỗ mọi app").
// Chỉ dọn NHIỄU HÌNH THỨC mà em không cố ý: dấu phẩy/chấm thập phân các kiểu ("," "，" "٫"), dấu trừ các kiểu, MỌI khoảng trắng kể cả ký tự rộng 0 và no-break space, dấu câu thừa ở cuối ("0,54."), dấu "≈" "=" "+" ở đầu,
// đơn vị viết theo ("mol/L", "M", "g/mol", "%", "°C"), kí hiệu khoa học ("2,5x10^-3", "1.5e0"). KHÔNG nới luật: Phần I/II không đi qua đây; đáp án vẫn phải đúng số.
// Hai CHÍNH SÁCH so sánh:
//   'chat'   — chữ số có nghĩa phân biệt ("0,80" ≠ "0,8"); dùng cho game Đảo/Đoàn.
//   'so_hoc' — bằng nhau theo giá trị, sai số tuyệt đối < 1e-4 ("0,540" = "0,54"; "5 mol" = "5").
//
// THẦY CHỐT 23/09/2026 — CA THI DÙNG CHUNG CHÍNH SÁCH 'so_hoc'.
// Trước đây ca thi giữ luật riêng trong `src/engine/score.ts` (`normalizeNumericAnswer`) và luật ấy CHẤM SAI nhiều câu đúng:
//   "0,540" ≠ "0,54" (chữ số 0 thừa ở cuối) · "2,5×10^-3" (kí hiệu khoa học) · "12 g/mol" (đơn vị) · "0,54." (dấu chấm cuối)
//   · chữ số toàn phần "１２" (NFKC) · dấu "≈/=" ở đầu.
// Từ nay MỌI kênh (ca thi · bài về nhà · ôn lại · phiếu khắc phục · phiếu HTML · chi tiết câu · thẻ câu) đi qua ĐÚNG MỘT hàm
// `khopPhanIII` bên dưới. `normalizeNumericAnswer` của engine chỉ còn là lớp mỏng gọi lại `chuanHoaSoNhap`.
//
// P01 (CNH-1.0, 23/09/2026): luật chuẩn hoá + bốn policy CÓ VERSION đã chuyển sang `cham-so-policy.ts`
// để có kiểm tra kiểu lúc chạy và chặn ba lỗi đã đo (hậu tố chữ bất kỳ, biên 1e-4 dấu phẩy động, bỏ qua
// đơn vị khác nhau). Tệp này giữ nguyên TÊN HÀM CŨ cho mọi nơi gọi.
import { chamTheoPolicy, chuanHoaSoNhap, tachSoVaDonVi, POLICY_MAC_DINH_PHAN_III } from './cham-so-policy'

export { POLICY_VERSION, POLICY_MAC_DINH_PHAN_III, chamTheoPolicy, chuanHoaSoNhap, tachSoVaDonVi } from './cham-so-policy'

// `chuanHoaSoNhap` đã chuyển sang `cham-so-policy.ts` (P01) và được nhập lại bên dưới —
// một định nghĩa duy nhất, không còn hai bản sao luật chuẩn hoá.
/** Đáp án của em `v` có khớp đáp án `d` không? Rỗng ⇒ sai. Chỉ dùng cho câu Phần III (đáp án dạng số).
 *  'chat': số phải giống nhau TỪNG CHỮ SỐ sau chuẩn hoá; đơn vị viết theo được bỏ khi chỉ một bên ghi;
 *  CẢ HAI bên ghi đơn vị thì đơn vị phải giống nhau ("12 g" ≠ "12 kg").
 *  'so_hoc': đi qua policy CÓ VERSION `numeric-value-v1` của `cham-so-policy.ts` (CNH-1.0).
 *  Hậu tố KHÔNG phải đơn vị đã biết (ví dụ "12abc") từ P01 là unsupported-format ⇒ KHÔNG tính đúng —
 *  đây là bản vá lỗi đã đo: trước đó `parseFloat('12abc') → 12` làm câu SAI thành ĐÚNG. */
export function soKhopSo(v: unknown, d: unknown, cheDo: 'chat' | 'so_hoc'): boolean {
  const a = chuanHoaSoNhap(v), b = chuanHoaSoNhap(d)
  if (!a || !b) return false
  if (a === b) return true
  if (cheDo === 'so_hoc') {
    return chamTheoPolicy({ policy: POLICY_MAC_DINH_PHAN_III, key: String(d ?? ''), answer: String(v ?? '') }).correct
  }
  const pa = tachSoVaDonVi(a, false), pb = tachSoVaDonVi(b, false)
  if (!pa.ok || !pb.ok) return false
  if (pa.so.unit && pb.so.unit && pa.so.unit !== pb.so.unit) return false
  return pa.so.numText === pb.so.numText
}

/**
 * MỘT LUẬT CHẤM PHẦN III CHO MỌI KÊNH (thầy chốt 23/09/2026).
 *
 * Gọi `soKhopSo` với chính sách `'so_hoc'` — đây là chỗ DUY NHẤT được phép quyết định "câu trả lời ngắn này đúng hay sai".
 * Mọi kênh (ca thi `src/engine/score.ts`, bài về nhà `btvn-grading.ts`, phiếu khắc phục, phiếu HTML, chi tiết câu, thẻ câu)
 * PHẢI gọi hàm này thay vì tự so chuỗi — sáu bản sao rời nhau là sáu chỗ để lệch, và lệch ở đây nghĩa là chấm sai.
 * Rỗng một trong hai bên ⇒ sai (em bỏ trống không tính là đúng).
 */
export const khopPhanIII = (cuaEm: unknown, dapAn: unknown): boolean => soKhopSo(cuaEm, dapAn, 'so_hoc')
