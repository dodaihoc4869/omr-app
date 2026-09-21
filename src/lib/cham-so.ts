// CHUẨN HOÁ ĐÁP ÁN SỐ (Phần III) DÙNG CHUNG cho các kênh LUYỆN TẬP (Boss 21/09, P0 "0,54 chấm sai"; thầy: "quét hết mọi chỗ mọi app").
// Chỉ dọn NHIỄU HÌNH THỨC mà em không cố ý: dấu phẩy/chấm thập phân các kiểu ("," "，" "٫"), dấu trừ các kiểu, MỌI khoảng trắng kể cả ký tự rộng 0 và no-break space, dấu câu thừa ở cuối ("0,54."), dấu "≈" "=" "+" ở đầu,
// đơn vị viết theo ("mol/L", "M", "g/mol", "%", "°C"), kí hiệu khoa học ("2,5x10^-3", "1.5e0"). KHÔNG nới luật: Phần I/II không đi qua đây; đáp án vẫn phải đúng số.
// Hai CHÍNH SÁCH so sánh (mỗi kênh giữ chính sách vốn có của nó):
//   'chat'   — như bài thi (`normalizeNumericAnswer`): chữ số có nghĩa phân biệt ("0,80" ≠ "0,8"); dùng cho game Đảo/Đoàn.
//   'so_hoc' — như bài về nhà / ôn lại (`isAnswerCorrect`): bằng nhau theo giá trị, sai số tuyệt đối < 1e-4 ("0,540" = "0,54").
// Kênh CA THI (src/engine/score.ts `normalizeNumericAnswer`) CHƯA đổi: xem báo cáo riêng (khác biệt: chưa xử lý phẩy rộng, ký tự rộng 0, dấu chấm cuối, đơn vị).
const KHOANG_TRANG = new RegExp('[\\s\\u00a0\\u1680\\u180e\\u2000-\\u200f\\u2028\\u2029\\u202f\\u205f\\u2060\\u3000\\ufeff]+', 'g')
const DAU_TRU = new RegExp('[\\u2010-\\u2015\\u2212\\ufe63\\uff0d\\u207b]', 'g') // các kiểu gạch ngang / dấu trừ
const SO_THUAN = /^[+-]?(?:\d+\.?\d*|\.\d+)$/
const SO_VA_DON_VI = /^([+-]?(?:\d+\.?\d*|\.\d+))([a-zµμ°%(][a-zµμ°%/·.^()\-\d]{0,11})$/
const KHOA_HOC_X10 = /^([+-]?(?:\d+\.?\d*|\.\d+))[x×*·]10\^?\(?([+-]?\d+)\)?$/
const KHOA_HOC_E = /^([+-]?(?:\d+\.?\d*|\.\d+))e([+-]?\d+)$/

/** Chuỗi đã dọn nhiễu hình thức (chữ thường, dấu thập phân là "."); rỗng nếu không còn gì. Không đổi giá trị số. */
export function chuanHoaSoNhap(raw: unknown): string {
  let s = String(raw ?? '').normalize('NFKC')
    .replace(KHOANG_TRANG, '').replace(DAU_TRU, '-').replace(/[٫‚،]/g, ',').toLowerCase()
  s = s.replace(/^[+≈~=]+/, '').replace(/[.,;:!?]+$/, '').replace(/,/g, '.')
  const x10 = KHOA_HOC_X10.exec(s) ?? KHOA_HOC_E.exec(s)
  if (x10) { const n = Number(`${x10[1]}e${x10[2]}`); if (Number.isFinite(n)) return String(n) }
  return s
}
/** Đáp án của em `v` có khớp đáp án `d` không? Rỗng ⇒ sai. Chỉ dùng cho câu Phần III (đáp án dạng số).
 *  Đơn vị viết theo được bỏ khi so số; nếu CẢ HAI bên đều ghi đơn vị thì đơn vị phải giống nhau ("12 g" ≠ "12 kg"). Đáp án không phải số ⇒ chỉ khớp khi giống hệt sau chuẩn hoá. */
export function soKhopSo(v: unknown, d: unknown, cheDo: 'chat' | 'so_hoc'): boolean {
  const a = chuanHoaSoNhap(v), b = chuanHoaSoNhap(d)
  if (!a || !b) return false
  if (a === b) return true
  const ma = SO_VA_DON_VI.exec(a), mb = SO_VA_DON_VI.exec(b)
  const na = ma ? ma[1]! : a, nb = mb ? mb[1]! : b
  if (!SO_THUAN.test(na) || !SO_THUAN.test(nb)) return false
  if (ma && mb && ma[2] !== mb[2]) return false
  if (na === nb) return true
  return cheDo === 'so_hoc' && Math.abs(Number(na) - Number(nb)) < 1e-4
}
