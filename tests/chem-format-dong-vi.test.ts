// KÍ HIỆU ĐỒNG VỊ BỊ XEN KẼ TRÊN/DƯỚI — thầy chụp 11/09.
//
// Chuỗi "HỎNG" dưới đây lấy NGUYÊN VĂN từ kho:
//   kho-de/xong/Dạy học/10/C1 - Nguyên Tử/DH-10-C1-B2.json
// Chuỗi "ĐÚNG" lấy từ bản sạch của CÙNG câu ấy:
//   kho-de/xong/10/C1 - Cấu tạo nguyên tử/10-C1-B2.json
// nên đây là đối chứng thật, không phải tôi tự nghĩ ra đáp án.
import { describe, expect, it } from 'vitest'
import { gomKyHieuDongViBiXen, parseChemText, taRaChuNoiBiDinh } from '../src/lib/chem-format'

describe('gom lại dãy trên/dưới bị xen kẽ', () => {
  it('ghép đúng như bản sạch trong kho', () => {
    expect(gomKyHieuDongViBiXen('²₁⁴₂Mg,₁²₂⁵Mg.')).toBe('²⁴₁₂Mg,²⁵₁₂Mg.')
    expect(gomKyHieuDongViBiXen('₁²₄⁸Si,²₁⁹₄Si.')).toBe('²⁸₁₄Si,²⁹₁₄Si.')
    expect(gomKyHieuDongViBiXen('Cho 3 nguyên tử: ₁²₂⁵X,⁵₂⁵₅Y,²₁⁶₂Z.')).toBe('Cho 3 nguyên tử: ²⁵₁₂X,⁵⁵₂₅Y,²⁶₁₂Z.')
    expect(gomKyHieuDongViBiXen('¹₇⁴A;³₁²₆B;¹²₆C;³₁⁶₆D;²₁³₁I;₁³₆⁴G;²₁⁰₀H'))
      .toBe('¹⁴₇A;³²₁₆B;¹²₆C;³⁶₁₆D;²³₁₁I;³⁴₁₆G;²⁰₁₀H')
  })

  it('đồng vị đồng ghép ra đúng bảng tuần hoàn (Z = 29)', () => {
    expect(gomKyHieuDongViBiXen('₂⁶₉³Cu,₂⁶₉⁵Cu')).toBe('⁶³₂₉Cu,⁶⁵₂₉Cu')
  })

  it('KHÔNG đụng ký hiệu vốn đã viết đúng', () => {
    for (const dung of ['⁴⁰₁₉K và ⁴⁰₁₈Ar.', '¹⁶₈O và ¹⁷₈O.', '²⁵₁₂X, ⁵⁵₂₅Y, ²⁶₁₂Z.', '¹⁹₁₀E', '¹²₆C', '¹₁H và ⁴₂He.', 'Cu₂O', 'H₂SO₄']) {
      expect(gomKyHieuDongViBiXen(dung)).toBe(dung)
    }
  })

  it('dãy xen kẽ mà KHÔNG đứng trước ký hiệu nguyên tố thì để nguyên', () => {
    expect(gomKyHieuDongViBiXen('¹₇⁴ và tiếp')).toBe('¹₇⁴ và tiếp')
    expect(gomKyHieuDongViBiXen('¹₇⁴')).toBe('¹₇⁴')
  })
})

describe('trả lại dấu cách cho chữ nối bị dính', () => {
  it('`¹₁Hvà⁴₂He.` tách đúng như bản sạch', () => {
    expect(taRaChuNoiBiDinh('¹₁Hvà⁴₂He.')).toBe('¹₁H và ⁴₂He.')
    expect(taRaChuNoiBiDinh('³₁Hvà³₂He.')).toBe('³₁H và ³₂He.')
  })

  it('KHÔNG chèn dấu cách vào câu văn bình thường', () => {
    for (const chu of ['vàng bạc và đồng', '¹₁H và ⁴₂He.', 'Hvà He', 'hoặc là', 'Cho vàng vào']) {
      expect(taRaChuNoiBiDinh(chu)).toBe(chu)
    }
  })
})

describe('cả đường hiển thị', () => {
  const chu = (s: string): string => parseChemText(s).map((p) => p.v).join('')

  it('câu "Cho 3 nguyên tử" hiện ra đúng ba ký hiệu', () => {
    expect(chu('Cho 3 nguyên tử: ₁²₂⁵X,⁵₂⁵₅Y,²₁⁶₂Z. Nhận định nào sau đây đúng?'))
      .toBe('Cho 3 nguyên tử: ²⁵₁₂X,⁵⁵₂₅Y,²⁶₁₂Z. Nhận định nào sau đây đúng?')
  })

  it('phương án `¹₁Hvà⁴₂He.` hiện ra có dấu cách', () => {
    expect(chu('¹₁Hvà⁴₂He.')).toBe('¹₁H và ⁴₂He.')
  })
})
