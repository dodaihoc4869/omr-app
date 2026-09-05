// @vitest-environment node
//
// LỖI CÔNG THỨC THẦY BÁO 06/09 — hai lỗi khác nhau, cùng một hậu quả: phiếu in
// ra sai công thức, mà em đọc phiếu rồi học theo đúng cái sai đó.
//
//   1. `\ce{CnH2n+3N}` → mhchem đọc `n+3` là ĐIỆN TÍCH, in ra `CnH₂n³⁺N`.
//   2. `-CO-NH-` → luật đoán điện tích biến hai dấu nối thành hai ion âm.
//
// Chạy ở môi trường `node` để gọi được KaTeX thật: kiểm bằng chính bộ dựng sẽ
// chạy trên máy thầy, không kiểm bằng một bản chép lại.
import { describe, expect, it } from 'vitest'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { chuanHoaCongThucTongQuat, parseChemText } from '../src/lib/chem-format'

/** Chuỗi hiển thị, đánh dấu rõ chỉ số dưới `_( )` và số mũ `^( )`. */
const hien = (s: string) =>
  parseChemText(s)
    .map((p) => (p.t === 'sub' ? `_(${p.v})` : p.t === 'sup' ? `^(${p.v})` : p.v))
    .join('')

/** Chữ KaTeX dựng ra, đã bỏ thẻ. mhchem chèn `X` làm mốc chỉ số. */
const veKatex = (ce: string) =>
  katex
    .renderToString(`\\ce{${chuanHoaCongThucTongQuat(ce)}}`, { throwOnError: true, strict: false, displayMode: false })
    .replace(/<annotation[\s\S]*?<\/annotation>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, '')

describe('Công thức tổng quát CnH2n+3N', () => {
  it('viết lại đúng dạng mhchem hiểu được', () => {
    expect(chuanHoaCongThucTongQuat('CnH2n+3N')).toBe('C_{n}H_{2n+3}N')
    expect(chuanHoaCongThucTongQuat('CnH2n+2N')).toBe('C_{n}H_{2n+2}N')
    expect(chuanHoaCongThucTongQuat('CnH2n+1N')).toBe('C_{n}H_{2n+1}N')
    expect(chuanHoaCongThucTongQuat('CnH2nN')).toBe('C_{n}H_{2n}N')
    expect(chuanHoaCongThucTongQuat('CnH2n+2')).toBe('C_{n}H_{2n+2}')
    expect(chuanHoaCongThucTongQuat('CmH2m-2')).toBe('C_{m}H_{2m-2}')
    expect(chuanHoaCongThucTongQuat('CxHyOz')).toBe('C_{x}H_{y}O_{z}')
  })

  it('KaTeX dựng ra ĐÚNG: chỉ số 2n+3, KHÔNG phải điện tích 3+', () => {
    const ra = veKatex('CnH2n+3N')
    // mhchem đánh dấu chỉ số bằng `X` ngay trước phần chỉ số.
    expect(ra).toContain('X2n+3')
    // Bản hỏng ra `X2nX3+` — hai khối chỉ số/điện tích rời nhau.
    expect(ra).not.toContain('X2nX3+')
  })

  it('KHÔNG đụng vào nguyên tố có thật kết thúc bằng n, m, k, y', () => {
    for (const ct of ['Zn', 'Mn', 'Sn', 'In', 'Rn', 'Am', 'Sm', 'Tm', 'Bk', 'Dy']) {
      expect(chuanHoaCongThucTongQuat(ct), ct).toBe(ct)
    }
    expect(chuanHoaCongThucTongQuat('KMnO4')).toBe('KMnO4')
    expect(chuanHoaCongThucTongQuat('ZnCl2 + 2NaOH')).toBe('ZnCl2 + 2NaOH')
    // Chỗ SUÝT hỏng: `Zn + 2HCl` — cho phép khoảng trắng quanh dấu cộng là
    // thành `Z_{n+2}HCl`, mất hẳn kẽm khỏi phương trình.
    expect(chuanHoaCongThucTongQuat('Zn + 2HCl -> ZnCl2 + H2')).toBe('Zn + 2HCl -> ZnCl2 + H2')
    // `Cn` và `Cm` CỐ Ý không nằm trong danh sách chừa: copernicium và curium
    // không có trong đề phổ thông, còn CnH2n+2 / CmH2m+2 thì có ở mọi bài.
    expect(chuanHoaCongThucTongQuat('CmH2m+2')).toBe('C_{m}H_{2m+2}')
  })

  it('KHÔNG đụng vào công thức thường và cú pháp LaTeX', () => {
    for (const ct of ['CH3COOH', 'H2SO4', 'Fe2O3', 'C6H12O6', 'NaOH', 'CaCO3', '\\Delta_f H^\\circ', 'E^\\circ_{Ni^{2+}/Ni}']) {
      expect(chuanHoaCongThucTongQuat(ct), ct).toBe(ct)
    }
  })

  it('phương trình có công thức tổng quát vẫn dựng được, không ném lỗi', () => {
    expect(() => veKatex('CnH2n+2 + O2 -> CO2 + H2O')).not.toThrow()
  })
})

describe('Dấu nối trong công thức cấu tạo', () => {
  it('-CO-NH- là LIÊN KẾT peptide, không phải hai ion âm', () => {
    expect(hien('Liên kết peptide -CO-NH- chỉ có trong peptide')).toBe('Liên kết peptide -CO-NH- chỉ có trong peptide')
  })

  it('công thức cấu tạo dài giữ nguyên mọi dấu nối, chỉ số vẫn xuống dưới', () => {
    expect(hien('H2N-[CH2]4-CH(NH2)-COOH')).toBe('H_(2)N-[CH_(2)]_(4)-CH(NH_(2))-COOH')
    expect(hien('CH3-CH2-OH')).toBe('CH_(3)-CH_(2)-OH')
    expect(hien('H2N-CH2-COOH')).toBe('H_(2)N-CH_(2)-COOH')
  })

  it('ĐIỆN TÍCH thật vẫn lên số mũ như cũ', () => {
    expect(hien('ion OH- và Na+ trong dung dịch')).toBe('ion OH^(-) và Na^(+) trong dung dịch')
    expect(hien('Cl-')).toBe('Cl^(-)')
    expect(hien('NH4+')).toBe('NH4+')
  })

  it('nhóm thế -NH2, -COOH, -CHO đứng đầu từ vẫn là nhóm, không phải ion', () => {
    expect(hien('thay 1 H bằng -NH2')).toBe('thay 1 H bằng -NH_(2)')
    expect(hien('nhóm -CHO của glucose')).toBe('nhóm -CHO của glucose')
  })
})

describe('Bìa phiếu chọn công thức theo chuyên đề', () => {
  it('mỗi chuyên đề một bộ công thức riêng, không phải ester cho tất cả', async () => {
    const { congThucBia } = await import('../src/lib/html-phieu')
    expect(congThucBia('Ester – lipid').chinh).toBe("RCOOR'")
    expect(congThucBia('Hợp chất chứa nitrogen').chinh).toContain('COOH')
    expect(congThucBia('Carbohydrate').chinh).toContain('C<sub>6</sub>')
    expect(congThucBia('Polymer').chinh).toContain('CH<sub>2</sub>')
    // KHÔNG khớp chuyên đề nào thì dùng bộ TRUNG TÍNH, KHÔNG rơi về ester —
    // thà bìa chung chung còn hơn bìa nói sai nội dung bên trong.
    const la = congThucBia('Chuyên đề chưa có trong bảng')
    expect(la.chinh).not.toBe("RCOOR'")
    expect(la.troi).not.toContain('RCOOR&#39;')
  })

  it('bìa dựng ra dùng đúng bộ công thức của chuyên đề', async () => {
    const { biaHtml } = await import('../src/lib/html-phieu')
    const t = { hoTen: 'A', sbd: '1', ngay: new Date('2026-09-06'), tenChuyenDe: 'Hợp chất chứa nitrogen', ketQua: '', hienDapAn: false }
    const h = biaHtml(t, 10)
    expect(h).not.toContain("RCOOR'")
    expect(h).toContain('CH<sub>3</sub>NH<sub>2</sub>')
  })
})
