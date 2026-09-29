// LỖI THẦY BÁO 29/09/2026 (ảnh màn Câu đã làm/Đang ôn): đáp án kho "1,2375×10⁹ kJ", em nhập "1237500000" → bị chấm SAI.
// Gốc: NFKC gộp "10⁹" thành "109" trước khi hiểu số mũ ⇒ đáp án không đọc được là số ⇒ câu nào cũng sai.
// Test khoá: MỘT hàm đọc số `docSoPhanIII` + MỘT luật so `khopPhanIII` cho mọi kênh (ca thi, BTVN/ôn lại máy chủ,
// thẻ Câu đã làm, PDF lịch sử, game), và phiếu HTML nhúng nguyên văn cùng hàm đọc số.
import { describe, expect, it } from 'vitest'
import { docSoPhanIII } from '../src/lib/doc-so-phan-iii'
import { khopPhanIII, soKhopSo } from '../src/lib/cham-so'
import { chamTheoPolicy } from '../src/lib/cham-so-policy'
import { traLoiNganDung } from '../src/components/hoa2/cau-chuyen'
import { isAnswerCorrect } from '../server/src/btvn-grading'

const DAP_AN_ANH = '1,2375×10⁹ kJ'

describe('ca trong ảnh thầy gửi 29/09', () => {
  it('"1237500000" khớp "1,2375×10⁹ kJ" ở mọi kênh', () => {
    expect(khopPhanIII('1237500000', DAP_AN_ANH)).toBe(true)
    expect(traLoiNganDung('1237500000', DAP_AN_ANH)).toBe(true)
    expect(isAnswerCorrect('1237500000', DAP_AN_ANH, 'III')).toBe(true)
    expect(chamTheoPolicy({ policy: 'numeric-value-v1', key: DAP_AN_ANH, answer: '1237500000' })).toEqual({ correct: true })
    expect(soKhopSo('1237500000', DAP_AN_ANH, 'chat')).toBe(true) // game Đảo/Đoàn
  })
  it('đọc đáp án thành số chính xác + đơn vị', () => {
    expect(docSoPhanIII(DAP_AN_ANH)).toEqual({ so: '1237500000', donVi: 'kj' })
  })
})

describe('docSoPhanIII — các cách viết', () => {
  const CA: Array<[string, string, string]> = [
    ['1237500000', '1237500000', ''],
    ['1,2375e9', '1237500000', ''],
    ['1,2375E+9', '1237500000', ''],
    ['1,2375x10^9', '1237500000', ''],
    ['1,2375*10^9', '1237500000', ''],
    ['1,2375·10^9', '1237500000', ''],
    ['1,2375 × 10^(9)', '1237500000', ''],
    ['1,2375\\times10^{9}', '1237500000', ''],
    ['2,5.10^-3', '0.0025', ''],
    ['2,5×10⁻³', '0.0025', ''],
    ['10⁻³', '0.001', ''],
    ['−2,5×10^(−3) mol', '-0.0025', 'mol'],
    ['1,6.10⁻¹⁹', '0.00000000000000000016', ''],
    ['6,02×10²³', '602000000000000000000000', ''],
    ['1.237.500.000', '1237500000', ''],
    ['1 237 500 000', '1237500000', ''],
    ['1,237,500', '1237500', ''],
    ['1.237,5', '1237.5', ''],
    ['1,237.5', '1237.5', ''],
    ['0,80', '0.80', ''],
    ['≈ 0,54.', '0.54', ''],
    ['12 cm³', '12', 'cm3'],
    ['25 %', '25', '%'],
  ]
  for (const [vao, so, donVi] of CA) {
    it(`${vao} → ${so} ${donVi}`, () => expect(docSoPhanIII(vao)).toEqual({ so, donVi }))
  }
  it('không phải số rõ ràng ⇒ null', () => {
    expect(docSoPhanIII('Đ')).toBeNull()
    expect(docSoPhanIII('')).toBeNull()
    expect(docSoPhanIII('1,2.3')).toBeNull() // hai dấu lẫn lộn, nhóm không đúng 3 chữ số
    expect(docSoPhanIII('1.23.4')).toBeNull() // nhóm nghìn sai
  })
})

describe('khopPhanIII — biên', () => {
  const DUNG: Array<[string, string]> = [
    ['1,2375.10^9', DAP_AN_ANH],
    ['1.237.500.000', DAP_AN_ANH],
    ['1 237 500 000 kJ', DAP_AN_ANH],
    ['1,2375e9', DAP_AN_ANH],
    ['0,0025', '2,5.10^-3'],
    ['2,5×10⁻³', '0,0025'],
    ['-0,001', '−10⁻³'],
    ['1,6×10^-19', '1,6.10⁻¹⁹'],
    ['0,540', '0,54'],
  ]
  for (const [em, dap] of DUNG) it(`ĐÚNG: ${em} = ${dap}`, () => expect(khopPhanIII(em, dap)).toBe(true))

  const SAI: Array<[string, string]> = [
    ['1237500001', DAP_AN_ANH], // lệch 1 đơn vị trên 1,2 tỉ: vẫn SAI (biên tuyệt đối 1e-4 giữ nguyên)
    ['1,2375×10⁸', DAP_AN_ANH],
    ['123750000', DAP_AN_ANH],
    ['1237500000 J', DAP_AN_ANH], // khác đơn vị
    ['1,2375', DAP_AN_ANH],
    ['2×10⁻¹⁹', '1,6.10⁻¹⁹'], // khoá rất nhỏ: không được coi mọi số tí hon là bằng nhau
    ['0,0026', '2,5.10^-3'],
    ['1.237', '1237'], // MỘT dấu chấm ⇒ luôn là thập phân (mơ hồ ⇒ không đoán là nghìn)
    ['1,237', '1237'],
    ['12abc', '12'], // hậu tố lạ vẫn không phải đơn vị
    ['', DAP_AN_ANH],
  ]
  for (const [em, dap] of SAI) it(`SAI: "${em}" ≠ ${dap}`, () => expect(khopPhanIII(em, dap)).toBe(false))

  it('biên cũ với khoá ≥ 0,01 không đổi (không nới, không siết)', () => {
    expect(khopPhanIII('0,54009', '0,54')).toBe(true)
    expect(khopPhanIII('0,5401', '0,54')).toBe(false)
    expect(khopPhanIII('0,00009', '0')).toBe(true)
  })
})

describe('phiếu HTML nhúng NGUYÊN VĂN docSoPhanIII', () => {
  it('bản toString() chạy độc lập cho kết quả y hệt', () => {
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const docSo = new Function(`return (${docSoPhanIII.toString()})`)() as typeof docSoPhanIII
    for (const v of [DAP_AN_ANH, '1 237 500 000', '2,5.10^-3', '10⁻³', '1.237,5', 'Đ', '12 cm³']) {
      expect(docSo(v)).toEqual(docSoPhanIII(v))
    }
  })
  it('không dùng lookbehind (Safari cũ)', async () => {
    const fs = await import('node:fs')
    const ma = fs.readFileSync('src/lib/doc-so-phan-iii.ts', 'utf8')
    expect(ma).not.toMatch(/\(\?<[=!]/)
  })
})
