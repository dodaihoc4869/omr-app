// THẦY 19/10 (ảnh câu quang hợp, Chặng 5 câu 6): nhãn trên mũi tên hiện "chÊtdiÖp¸lªôhc¸sc¸hªlgorophyll" thay vì "ánh sáng / chất diệp lục (chlorophyll)".
// Nguyên nhân gốc ở KHO: nhãn hai hàng xếp chồng gõ bằng phông TCVN3, bộ nhập đọc theo CỘT ⇒ xen kẽ từng chữ (chữ "n" hàng trên thành "ⁿ",
// ngoặc hàng dưới thành "₍ ₎"). Sửa ở tầng hiển thị (goKyTuLa — đường chung của ChemText, chuHtml, cửa nạp đề), không ghi kho.
import { describe, expect, it } from 'vitest'
import { giaiMaTcvn3, suaNhanXenKe, timPhongCu } from '../src/lib/phong-cu'
import { chuHtml } from '../src/lib/html-phieu'
import { parseChemText } from '../src/lib/chem-format'
import { dungNoiDung } from '../server/src/hoi-tro-ly'

// Chuỗi trong ảnh thầy chụp 19/10 (câu quang hợp).
const DE_THAT = 'Quá trình quang hợp của cây xanh diễn ra theo phương trình hóa học tổng quát sau:\nCO₂ + H₂O chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎→(C₆H₁₀O₅)ₙ + O₂ Biết rằng để tổng hợp được 1 mol mắt xích tinh bột'

describe('phát hiện chữ phông cũ / xen kẽ', () => {
  it('bắt chuỗi thật trong ảnh và dạng "H⁼⁹⁶%"; không bắt ký hiệu hợp lệ', () => {
    expect(timPhongCu(DE_THAT).map((x) => x.token)).toEqual(['chÊtdiÖp¸lⁿôhc₍sc¸hⁿlgorophyll₎'])
    expect(timPhongCu('Disaccharide eⁿzyme→ Monosaccharide Heⁿ₌z₈y₀m%e→ Ethanol').map((x) => x.token)).toEqual(['eⁿzyme', 'Heⁿ₌z₈y₀m%e'])
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
  it('câu enzim: "n" thành số mũ dính trước mũi tên ⇒ nhãn enzim trên mũi tên; mũi tên có thêm H = 80% (DH-12-C2-B6-DT-III-8, DH-12-C2-B5-DT-III-6)', () => {
    expect(suaNhanXenKe('theo sơ đồ: (C₆H₁₀O₅)ₙeⁿzim→C₆H₁₂O₆eⁿzim→C₂H₅OH Để điều chế 10 L')).toBe('theo sơ đồ: (C₆H₁₀O₅)ₙ →(enzim) C₆H₁₂O₆ →(enzim) C₂H₅OH Để điều chế 10 L')
    expect(suaNhanXenKe('theo sơ đồ: Disaccharide eⁿzyme→ Monosaccharide Heⁿ₌z₈y₀m%e→ Ethanol (D=0,8kg/L).'))
      .toBe('theo sơ đồ: Disaccharide →(enzyme) Monosaccharide →(enzyme)(H = 80%) Ethanol (D=0,8kg/L).')
  })
  it('dạng chỉ nằm ở ghi chú nội bộ của lời giải không đụng tới', () => {
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

describe('Hỏi Thầy gửi Gemini đề đã sửa', () => {
  it('dòng ĐỀ trong dữ liệu câu không còn chữ rác của nhãn mũi tên (máy chủ dùng chung suaNhanXenKe)', () => {
    const nc = { qid: 'DB-12-B6-D3-III-46', cau: { phan: 'III', so: '46', chuong: 'Carbohydrate', mucDo: 'vận dụng', de: DE_THAT, pa: null, y: null, dapAn: '3,45', bang: null, hinh: [] }, hoSo: null, loiGiaiChu: null, kiem: null, boTro: null, hocLieu: null } as unknown as Parameters<typeof dungNoiDung>[0]
    const dl = dungNoiDung(nc, [], 'Câu này làm sao ạ?', { ketQuaGanNhat: 'chua_lam', dapAnEm: '', dangLam: true }).contents[0]!.parts[0]!.text!
    expect(dl).toContain('→(ánh sáng)(chất diệp lục (chlorophyll)) (C₆H₁₀O₅)ₙ')
    expect(dl).not.toMatch(/chÊt|¸l|ⁿôhc/)
  })
})
