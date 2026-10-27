// «Chạm để hiểu đề» — thẻ giải nghĩa khi chạm (khớp chữ bản vẽ docs/ban-ve-doc-de-2610, thầy chốt build 26/10).
import { describe, expect, it } from 'vitest'
import { phatHien } from '../src/lib/goi-y-cham/phat-hien'
import { theCho } from '../src/lib/goi-y-cham/the-cham'
import { docNguyenTuKhoiTrongDe } from '../src/lib/goi-y-cham/tu-dien-chat'
import type { TheGiaiNghia, VungCham } from '../src/lib/goi-y-cham/kieu'

const DE_ESTER =
  'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là'
const cham = (de: string, chu: string) => { const v = phatHien(de).find((x) => x.chu === chu); expect(v, chu).toBeDefined(); return theCho(v!, undefined, de) }
/** Lời khuyên chung chung thầy chê 27/10 («Soát kĩ quá vô nghĩa», «giải thích ngu»): không thẻ nào được có. */
const CHUNG_CHUNG = /tự hỏi|đọc kĩ|đọc kỹ|gạch phương án|đó là (điều|thứ)|đúng ý đề không|Đọc từng|Bắt đầu từ cuối|Đọc ngược lên|Chưa có tên chất/

describe('thẻ trên đề ester', () => {
  it('chạm «1,5 M»', () => {
    expect(cham(DE_ESTER, '1,5 M')).toEqual({
      ten: 'M · nồng độ mol', nhan: 'Đơn vị',
      doan: ['1,5 M: cứ 1 lít dung dịch có 1,5 mol chất tan', 'n = C_M × V (V tính bằng lít) · 1000 mL = 1 L'],
      congThuc: 'n = C_M × V (V tính bằng lít)', nhoDoi: '1000 mL = 1 L',
    })
  })
  it('chạm «ethyl acetate»: tên IUPAC · công thức · M · loại · tên cũ', () => {
    expect(cham(DE_ESTER, 'ethyl acetate')).toMatchObject({
      ten: 'ethyl acetate', nhan: 'Chất', loai: 'Ester', tenCu: 'etyl axetat', tenPhu: 'tên cũ: etyl axetat', M: 88, congThucChat: 'CH₃COOC₂H₅',
      doan: ['CH₃COOC₂H₅ · M = 88 g/mol', 'Ester'],
    })
  })
  it('chạm «NaOH»: dòng đầu là TÊN chất, công thức + M ở dòng dưới', () => {
    expect(cham(DE_ESTER, 'NaOH')).toMatchObject({
      ten: 'sodium hydroxide', nhan: 'Công thức', loai: 'Base mạnh', tenIupac: 'sodium hydroxide', tenCu: 'natri hiđroxit (xút ăn da)', M: 40,
      cachTinhM: 'Na = 23, O = 16, H = 1 (23 + 16 + 1 = 40)', doan: ['NaOH · M = 40 g/mol', 'Base mạnh'],
    })
  })
  it('chạm «Cô cạn»: nghĩa + kiến thức cụ thể, không «tự hỏi»', () => {
    const t = cham(DE_ESTER, 'Cô cạn')!
    expect(t).toMatchObject({ ten: 'Cô cạn', nhan: 'Từ then chốt' })
    expect(t.doan).toEqual(['Làm bay hơi hết nước (và chất dễ bay hơi), còn lại chất rắn khan.', 'Chất rắn gồm muối tạo thành và chất không bay hơi còn dư (như NaOH dư).'])
  })
  it('chạm «Giá trị của m là»: m là gì, gắn với chất nào, công thức ra nó', () => {
    expect(cham(DE_ESTER, 'Giá trị của m là')).toMatchObject({ ten: 'm: khối lượng chất rắn khan', nhan: 'Đề hỏi', doan: ['Tính bằng gam: m = n × M'] })
  })
  it('từ thường ai cũng hiểu (đun nóng, thu được) ⇒ KHÔNG có thẻ', () => {
    expect(cham(DE_ESTER, 'đun nóng')).toBeNull()
    expect(cham(DE_ESTER, 'thu được')).toBeNull()
  })
  it('thẻ còn lại: 1–2 dòng, không lời khuyên chung, không lộ đáp án (10,2 / 8,2)', () => {
    for (const v of phatHien(DE_ESTER)) {
      const t = theCho(v, undefined, DE_ESTER)
      if (!t) continue
      const chu = JSON.stringify(t)
      expect(chu).not.toMatch(/10,2|8,2|12,2|14,2/)
      expect(chu, v.chu).not.toMatch(CHUNG_CHUNG)
      expect(t.doan.length).toBeGreaterThanOrEqual(1)
      expect(t.doan.length).toBeLessThanOrEqual(2)
    }
  })
  it('thẻ gán được vào TheGiaiNghia', () => {
    const t: TheGiaiNghia | null = cham(DE_ESTER, 'NaOH')
    expect(t?.nhan).toBe('Công thức')
  })
})

describe('thẻ Đề hỏi', () => {
  it('bẫy «không đúng»', () => {
    expect(cham('Phát biểu nào sau đây không đúng?', 'không đúng')).toEqual({
      ten: 'Chọn phương án SAI', nhan: 'Đề hỏi', doan: ['Ba phương án còn lại đều đúng.', 'Bẫy: đọc nhanh, chọn luôn phương án đúng đầu tiên.'],
    })
  })
  it('bẫy «không phải»', () => {
    expect(cham('Chất nào sau đây không phải là base?', 'không phải')?.ten).toBe('Tìm phương án KHÔNG phải')
  })
  it('bẫy trong câu đếm và câu hỏi chung không nói «ba phương án còn lại»', () => {
    const dem = cham('Cho các phát biểu sau về ester. Số phát biểu sai là', 'sai')!
    expect(dem.ten).toBe('Đếm số ý SAI')
    expect(JSON.stringify(dem)).not.toMatch(/ba phương án/i)
    const chung = cham('Phát biểu nào đúng, phát biểu nào sai?', 'sai')!
    expect(chung.ten).toBe('Đề hỏi điều SAI')
    expect(JSON.stringify(chung)).not.toMatch(/ba phương án/i)
  })
  it('thầy 27/10: «chất nào sau đây», «Phát biểu nào sau đây đúng» ⇒ KHÔNG thẻ (chỉ nhắc lại đề)', () => {
    expect(cham('Chất nào sau đây là chất điện li mạnh?', 'Chất nào sau đây')).toBeNull()
    expect(cham('Phát biểu nào sau đây đúng?', 'Phát biểu nào sau đây')).toBeNull()
  })
  it('đếm: phát biểu đúng / đồng phân', () => {
    expect(cham('Cho các phát biểu sau về ester. Số phát biểu đúng là', 'Số phát biểu đúng là')?.ten).toBe('Đếm số phát biểu đúng')
    expect(cham('Số đồng phân amine có công thức phân tử C4H11N là', 'Số đồng phân amine có công thức phân tử')?.ten).toBe('Đếm số đồng phân')
  })
  it('đại lượng cần tính ⇒ công thức ra nó', () => {
    expect(cham('Cho 0,1 mol glucose lên men. Tính khối lượng ethanol thu được.', 'Tính khối lượng')).toMatchObject({ ten: 'Cần tính: khối lượng', doan: ['m = n × M'] })
    expect(cham('Thể tích dung dịch NaOH 1M cần dùng để trung hoà 100 mL dung dịch HCl 0,5M là', 'Thể tích dung dịch')).toMatchObject({ ten: 'Cần tính: thể tích', doan: ['Dung dịch: V = n : C_M (V tính bằng lít)'] })
  })
  it('biến V gắn với khí đo ở đkc', () => {
    const de = 'Đốt cháy hoàn toàn 0,1 mol ethylamine (C2H5NH2) thu được V lít khí N2 (đkc). Giá trị của V là bao nhiêu?'
    expect(cham(de, 'Giá trị của V là bao nhiêu')).toMatchObject({ ten: 'V: thể tích khí N2', doan: ['Khí ở đkc: V = n × 24,79'] })
  })
  it('biến không gắn được với số liệu nào và không rõ đại lượng ⇒ không thẻ', () => {
    expect(theCho({ loai: 'hoi', tu: 0, den: 16, chu: 'Giá trị của a là', khoa: 'gia-tri' }, undefined, 'Giá trị của a là')).toBeNull()
  })
})

describe('bộ đề mẫu: thẻ nào còn lại cũng cụ thể', () => {
  const DE = [
    DE_ESTER,
    'Không khí là hỗn hợp khí không màu, không mùi. Phát biểu nào sau đây không đúng?',
    'Nung 1 tấn quặng pirit chứa 80% FeS₂ để sản xuất H₂SO₄ với hiệu suất 90%. Khối lượng H2SO4 thu được là bao nhiêu kg?',
    'Hấp thụ hoàn toàn 2,479 lít CO2 (đkc) vào 200 ml dung dịch Ba(OH)2 0,1 M thu được m gam kết tủa. Giá trị gần nhất của m là',
    'Thể tích dung dịch NaOH 1M cần dùng để trung hoà 100 mL dung dịch HCl 0,5M là',
    'Cho 3,2 gam kim loại R tác dụng với dung dịch HNO3 đặc, nóng dư thu được 2,2311 lít NO2 (đkc). Xác định kim loại R.',
    'Điện phân 200 mL dung dịch CuSO4 0,5M với dòng điện 9,65 A trong 2h. Tính khối lượng Cu thu được ở cathode.',
    'Một loại phân bón chứa 35% K2O. Khối lượng phân cần dùng để cung cấp 47 kg K2O là bao nhiêu (làm tròn đến hàng phần mười)?',
    'Cho các phát biểu sau về ester. Số phát biểu sai là',
    'Phát biểu nào đúng, phát biểu nào sau đây sai?',
    'Cho 200 gam dung dịch H2SO4 9,8% vào 0,2 mol Fe(OH)3, nung đến khối lượng không đổi. Ion SO4^2- và Fe3+ còn lại bao nhiêu mol?',
    'Ethylamine thể hiện tính khử khi tác dụng với dung dịch chất nào sau đây ở nhiệt độ thường?',
  ]
  it.each(DE)('%s', (de) => {
    for (const v of phatHien(de)) {
      const t = theCho(v, undefined, de)
      if (!t) continue
      expect(JSON.stringify(t), `${v.loai}:${v.chu}`).not.toMatch(CHUNG_CHUNG)
      expect(t.doan.length, `${v.loai}:${v.chu}`).toBeLessThanOrEqual(2)
      expect(t.doan.every((d) => d.trim().length > 0)).toBe(true)
    }
  })
})

describe('thẻ chất và công thức', () => {
  it('công thức nhiều chất cùng công thức phân tử ⇒ liệt kê, không chọn bừa', () => {
    const t = cham('Lên men 18 gam C6H12O6.', 'C6H12O6')!
    expect(t).toMatchObject({ ten: 'C₆H₁₂O₆', ungVien: ['glucose', 'fructose'], loai: 'Carbohydrate', M: 180 })
    expect(t.doan).toEqual(['M = 180 g/mol', 'Có thể là glucose hoặc fructose (Carbohydrate)'])
  })
  it('tên cũ ⇒ thẻ tên IUPAC to, tên cũ nhỏ', () => {
    expect(cham('Cho natri hiđroxit vào nước.', 'natri hiđroxit')).toMatchObject({ ten: 'sodium hydroxide', tenCu: 'natri hiđroxit (xút ăn da)', M: 40, loai: 'Base mạnh' })
  })
  it('ion', () => {
    expect(cham('Dung dịch có ion SO4^2- và Fe3+.', 'SO4^2-')).toMatchObject({ congThucChat: 'SO₄²⁻', loai: 'Ion', M: 96 })
    expect(cham('Dung dịch có ion SO4^2- và Fe3+.', 'Fe3+')).toMatchObject({ congThucChat: 'Fe³⁺', loai: 'Ion', M: 56 })
  })
  it('polymer không công thức, tinh bột có M mắt xích', () => {
    expect(cham('Trùng hợp vinyl chloride thu được poly(vinyl chloride).', 'poly(vinyl chloride)')).toMatchObject({ ten: 'poly(vinyl chloride)', loai: 'Polymer' })
    expect(cham('Thuỷ phân tinh bột.', 'tinh bột')).toMatchObject({ ten: 'starch', M: 162, doan: ['(C₆H₁₀O₅)ₙ · M một mắt xích = 162 g/mol', 'Carbohydrate'] })
  })
  it('công thức hợp lệ nhưng chưa có trong từ điển ⇒ vẫn có M', () => {
    const v: VungCham = { loai: 'chat', tu: 0, den: 6, chu: 'C5H10O', khoa: 'C5H10O' }
    expect(theCho(v)).toMatchObject({ ten: 'C₅H₁₀O', nhan: 'Công thức', M: 86, doan: ['M = 86 g/mol', 'C = 12, H = 1, O = 16 (5·12 + 10·1 + 16 = 86)'] })
  })
  it('amine: bậc + tính chất; đề hỏi chính điều đó thì ẩn (không lộ đáp án)', () => {
    const de = 'Cho 4,65 gam aniline tác dụng vừa đủ với dung dịch HCl. Khối lượng muối thu được là bao nhiêu gam?'
    expect(cham(de, 'aniline')).toMatchObject({ ten: 'aniline', M: 93, doan: ['C₆H₅NH₂ · M = 93 g/mol', 'Amine bậc I · tính base rất yếu, không làm quỳ tím đổi màu'] })
    const de2 = 'Đốt cháy 0,1 mol ethylamine thu được V lít khí N2 (đkc). Giá trị của V là'
    expect(cham(de2, 'ethylamine')).toMatchObject({ doan: ['C₂H₅NH₂ · M = 45 g/mol', 'Amine bậc I · dung dịch làm quỳ tím hoá xanh'], tenPhu: 'tên khác: ethanamine · tên cũ: etylamin' })
    const hoiBac = 'Cho 0,1 mol ethylamine. Ethylamine là amine bậc mấy và làm quỳ tím đổi màu gì?'
    expect(theCho(phatHien(hoiBac).find((v) => v.chu === 'ethylamine')!, undefined, hoiBac)?.doan).toEqual(['C₂H₅NH₂ · M = 45 g/mol', 'Amine'])
  })
  it('M theo nguyên tử khối đề cho', () => {
    const de = 'Cho 5,85 gam NaCl vào nước. Cho nguyên tử khối: Na = 23; Cl = 35.'
    const v = phatHien(de).find((x) => x.chu === 'NaCl')!
    expect(theCho(v, docNguyenTuKhoiTrongDe(de).bang)).toMatchObject({ M: 58, cachTinhM: 'Na = 23, Cl = 35 (23 + 35 = 58)' })
    expect(theCho(v)?.M).toBe(58.5)
  })
})

describe('thẻ đơn vị theo ngữ cảnh', () => {
  it('đkc / đktc', () => {
    expect(cham('thu được 2,479 lít khí H2 (đkc).', 'đkc')?.congThuc).toBe('V = n × 24,79 · n = V : 24,79')
    expect(cham('thu được 2,24 lít khí H2 (đktc).', 'đktc')?.congThuc).toBe('V = n × 22,4 · n = V : 22,4')
  })
  it('% hiệu suất và % nồng độ', () => {
    expect(cham('Lên men với hiệu suất 80%.', '80%')?.ten).toBe('% · hiệu suất (H)')
    expect(cham('Dung dịch NaCl nồng độ 10%.', '10%')?.doan[0]).toBe('Cứ 100 g dung dịch có 10 g chất tan')
    expect(cham('Hỗn hợp chứa 10% tạp chất.', '10%')).toBeNull() // «%» không rõ phần trăm của gì ⇒ không thẻ
  })
  it('vùng lạ ⇒ null', () => {
    expect(theCho({ loai: 'cho', tu: 0, den: 1, chu: 'x', khoa: 'khong-co' })).toBeNull()
    expect(theCho({ loai: 'khoa', tu: 0, den: 1, chu: 'x' })).toBeNull()
    expect(theCho({ loai: 'chat', tu: 0, den: 2, chu: 'Xy', khoa: 'Xy' })).toBeNull()
  })
})
