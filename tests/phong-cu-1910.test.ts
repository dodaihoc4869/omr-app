// THẦY 19/10 (ảnh câu quang hợp, Chặng 5 câu 6): nhãn trên mũi tên hiện "chÊtdiÖp¸lªôhc¸sc¸hªlgorophyll" thay vì "ánh sáng / chất diệp lục (chlorophyll)".
// Nguyên nhân gốc ở KHO: nhãn hai hàng xếp chồng gõ bằng phông TCVN3, bộ nhập đọc theo CỘT ⇒ xen kẽ từng chữ (chữ "n" hàng trên thành "ⁿ",
// ngoặc hàng dưới thành "₍ ₎"). Sửa ở tầng hiển thị (goKyTuLa — đường chung của ChemText, chuHtml, cửa nạp đề), không ghi kho.
import { describe, expect, it } from 'vitest'
import { giaiMaTcvn3, suaNhanXenKe, timPhongCu } from '../src/lib/phong-cu'
import { chuHtml } from '../src/lib/html-phieu'
import { parseChemText } from '../src/lib/chem-format'

const DE_THAT = 'Quá trình quang hợp của cây xanh diễn ra theo phương trình hóa học tổng quát sau:\nCO₂ + H₂O chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎→(C₆H₁₀O₅)ₙ + O₂ Biết rằng để tổng hợp được 1 mol mắt xích tinh bột'

describe('phát hiện chữ phông cũ / xen kẽ', () => {
  it('bắt chuỗi thật trong ảnh và dạng "H⁼⁹⁶%"; không bắt ký hiệu hợp lệ', () => {
    expect(timPhongCu(DE_THAT).map((x) => x.token)).toEqual(['chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎'])
    expect(timPhongCu('S → SH⁼⁹⁶%→SO₂')[0]).toMatchObject({ loai: 'xen-ke', token: 'SH⁼⁹⁶%' })
    const HOP_LE = ['Brønsted', 'CuSO₄·5H₂O', '1,98·10¹⁰', 'cm⁻¹', '½O₂(g)', '3×10⁻³', '5 µm', '(C₆H₁₀O₅)ₙ', 'Fe²⁺ + 2OH⁻', 'Êm đềm, Đồng và Ôn tập', 'ÀÁẢ ĐẠI HỌC',
      'Hợp chất hữu cơ chứa nitơ: amine, amino acid, peptide; thủy phân hoàn toàn thu được muối của ánh sáng và chất diệp lục.']
    for (const s of HOP_LE) expect(timPhongCu(s), s).toEqual([])
  })
})

describe('giải mã TCVN3', () => {
  it('chuỗi thật: "chÊt diÖp lôc" và "¸nh s¸ng"', () => {
    expect(giaiMaTcvn3('chÊt diÖp lôc')).toBe('chất diệp lục')
    expect(giaiMaTcvn3('¸nh s¸ng')).toBe('ánh sáng')
  })
})

describe('sửa nhãn xen kẽ đã biết (tầng hiển thị)', () => {
  it('đứng trước mũi tên ⇒ →(trên)(dưới), chất sau mũi tên giữ nguyên', () => {
    expect(suaNhanXenKe(DE_THAT)).toContain('CO₂ + H₂O →(ánh sáng)(chất diệp lục (chlorophyll)) (C₆H₁₀O₅)ₙ + O₂ Biết rằng')
    expect(suaNhanXenKe(DE_THAT)).not.toMatch(/chÊt|¸|ⁿ|₍/)
  })
  it('đứng riêng (không có mũi tên theo sau) ⇒ "trên, dưới"; dạng chỉ nằm ở ghi chú nội bộ không đụng tới', () => {
    expect(suaNhanXenKe('x chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎ y')).toBe('x ánh sáng, chất diệp lục (chlorophyll) y')
    expect(suaNhanXenKe("ghi chú ('ch¸ÊⁿthdisÖ¸pⁿlgôc')")).toBe("ghi chú ('ch¸ÊⁿthdisÖ¸pⁿlgôc')")
  })
  it('chuỗi lạ / chữ thường giữ nguyên; chạy hai lần không đổi thêm', () => {
    const lanh = 'Hợp chất amine: CH₃NH₂ + HCl → CH₃NH₃Cl; chÊt lạ chưa đối chiếu'
    expect(suaNhanXenKe(lanh)).toBe(lanh)
    const mot = suaNhanXenKe(DE_THAT)
    expect(suaNhanXenKe(mot)).toBe(mot)
  })
  it('chuHtml (phiếu, tờ chiếu, PDF) đã sửa: nhãn đúng, không còn chữ rác', () => {
    const h = chuHtml(DE_THAT)
    expect(h).toContain('ánh sáng')
    expect(h).toContain('chất diệp lục (chlorophyll)')
    expect(h).not.toMatch(/chÊt|¸|ⁿ|gorophyll₎/)
  })
  it('bộ hiển thị dựng mũi tên có nhãn TRÊN "ánh sáng" và nhãn DƯỚI "chất diệp lục (chlorophyll)"', () => {
    const phan = parseChemText(suaNhanXenKe('CO₂ + H₂O chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎→(C₆H₁₀O₅)ₙ + O₂'))
    const mui = phan.find((p) => p.t === 'mui')
    expect(mui).toMatchObject({ t: 'mui', mui: '→', tren: 'ánh sáng', duoi: 'chất diệp lục (chlorophyll)' })
    const chu = phan.map((p) => ('v' in p ? p.v : '')).join('')
    expect(chu).not.toMatch(/Ê|¸|ⁿ|gorophyll/)
  })
})
