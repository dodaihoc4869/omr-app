// «Chạm để hiểu đề» — bộ dò vùng chạm (thầy chốt build 26/10, DAC-TA §5 ngoại lệ, §7 bộ bẫy «0 tô sai»).
import { describe, expect, it } from 'vitest'
import { phatHien } from '../src/lib/goi-y-cham/phat-hien'
import type { VungCham } from '../src/lib/goi-y-cham/kieu'

const DE_ESTER =
  'Thuỷ phân hoàn toàn 8,8 gam ethyl acetate bằng 100 mL dung dịch NaOH 1,5 M, đun nóng. Cô cạn dung dịch sau phản ứng, thu được m gam chất rắn khan. Giá trị của m là'
const DE_LY_THUYET = 'Không khí là hỗn hợp khí không màu, không mùi. Phát biểu nào sau đây không đúng?'

/** Bất biến cho MỌI đề: cắt đúng chữ, xếp theo vị trí, không chồng lấn, trong biên. */
function kiemBatBien(de: string, vung: VungCham[]) {
  let truoc = 0
  for (const v of vung) {
    expect(v.tu).toBeGreaterThanOrEqual(truoc)
    expect(v.den).toBeGreaterThan(v.tu)
    expect(v.den).toBeLessThanOrEqual(de.length)
    expect(de.slice(v.tu, v.den)).toBe(v.chu)
    truoc = v.den
  }
}
const tom = (de: string) => { const v = phatHien(de); kiemBatBien(de, v); return v.map((x) => `${x.loai}:${x.chu}`) }
const theoLoai = (de: string, loai: VungCham['loai']) => phatHien(de).filter((v) => v.loai === loai).map((v) => v.chu)

describe('đề ester mẫu của bản vẽ', () => {
  it('đủ và đúng từng vùng', () => {
    expect(tom(DE_ESTER)).toEqual([
      'khoa:Thuỷ phân', 'khoa:hoàn toàn', 'cho:8,8 gam', 'chat:ethyl acetate', 'cho:100 mL', 'chat:NaOH', 'cho:1,5 M',
      'khoa:đun nóng', 'khoa:Cô cạn', 'khoa:thu được', 'khoa:chất rắn khan', 'hoi:Giá trị của m là',
    ])
  })
  it('khoá tra từ điển', () => {
    const k = Object.fromEntries(phatHien(DE_ESTER).map((v) => [v.chu, v.khoa]))
    expect(k).toMatchObject({ '8,8 gam': 'g', '100 mL': 'mL', '1,5 M': 'M', NaOH: 'NaOH', 'ethyl acetate': 'ethyl acetate', 'Cô cạn': 'co-can', 'Giá trị của m là': 'gia-tri' })
  })
  it('«m gam» và chữ «m» không phải số liệu', () => {
    const chu = phatHien(DE_ESTER).map((v) => v.chu)
    expect(chu).not.toContain('m gam')
    expect(chu).not.toContain('m')
  })
})

describe('đề lý thuyết: bẫy phủ định', () => {
  it('chỉ tô «không đúng»; «không khí», «không màu» trong thân đề không tô', () => {
    expect(tom(DE_LY_THUYET)).toEqual(['hoi:không đúng'])
    expect(phatHien(DE_LY_THUYET)[0].khoa).toBe('phu-dinh')
  })
  it('«sai», «không phải» nằm trong vùng Đề hỏi', () => {
    expect(theoLoai('Phát biểu nào sau đây sai?', 'hoi')).toEqual(['sai'])
    expect(theoLoai('Kim loại nào sau đây không phải là kim loại kiềm?', 'hoi')).toEqual(['không phải'])
    expect(theoLoai('Nhận định không chính xác là', 'hoi')).toEqual(['không chính xác'])
  })
  it('«không» ngoài câu hỏi không tô', () => {
    for (const de of ['Nitrogen chiếm khoảng 78% thể tích không khí.', 'Ở điều kiện thường, nitrogen là chất khí không màu, không mùi.', 'Chất này không tan trong nước.', 'Kết quả có sai số nhỏ.'])
      expect(theoLoai(de, 'hoi')).toEqual([])
  })
  it('«sai số» trong câu hỏi không phải bẫy', () => {
    expect(phatHien('Sai số của phép đo là bao nhiêu?').some((v) => v.khoa === 'phu-dinh')).toBe(false)
  })
})

describe('Đề hỏi', () => {
  it.each([
    ['Hoà tan hết 5,6 gam Fe trong HCl dư thu được V lít khí. Giá trị của V là', 'Giá trị của V là', 'gia-tri'],
    ['Hấp thụ hết 0,1 mol CO2 vào nước vôi trong. Giá trị gần nhất của m là', 'Giá trị gần nhất của m là', 'gia-tri'],
    ['Cho 0,1 mol Fe vào HCl. Giá trị của m là bao nhiêu?', 'Giá trị của m là bao nhiêu', 'gia-tri'],
    ['Cho các phát biểu sau: (a) Nitrogen chiếm 78% thể tích không khí. Số phát biểu đúng là', 'Số phát biểu đúng là', 'la'],
    ['Chất nào sau đây là chất điện li mạnh?', 'Chất nào sau đây', 'nao-sau-day'],
    ['Phát biểu nào sau đây đúng?', 'Phát biểu nào sau đây', 'nao-sau-day'],
    ['Cho 0,1 mol glucose lên men. Tính khối lượng ethanol thu được.', 'Tính khối lượng', 'tinh'],
    ['Cho 3,2 gam kim loại R tác dụng với HCl dư. Xác định kim loại R.', 'Xác định kim loại R', 'tinh'],
  ])('%s', (de, hoi, khoa) => {
    const v = phatHien(de).filter((x) => x.loai === 'hoi')
    expect(v.map((x) => x.chu)).toContain(hoi)
    expect(v[0].khoa).toBe(khoa)
  })
  it('chọn câu hỏi cuối, bỏ qua đuôi «(làm tròn …)»', () => {
    const de = 'Đốt cháy 4,6 gam ethanol. Khối lượng CO2 thu được là bao nhiêu gam? (Làm tròn kết quả đến hàng phần mười.)'
    expect(theoLoai(de, 'hoi')).toEqual(['Khối lượng', 'thu được là bao nhiêu gam'])
    expect(theoLoai(de, 'chat')).toEqual(['ethanol', 'CO2'])
  })
  it('vùng Đề hỏi không nuốt số liệu và chất ở giữa câu hỏi', () => {
    const de = 'Thể tích dung dịch NaOH 1M cần dùng để trung hoà 100 mL dung dịch HCl 0,5M là'
    expect(tom(de)).toEqual(['hoi:Thể tích dung dịch', 'chat:NaOH', 'cho:1M', 'khoa:trung hoà', 'cho:100 mL', 'chat:HCl', 'cho:0,5M', 'hoi:là'])
  })
  it('đề không có câu hỏi ⇒ không có vùng Đề hỏi', () => {
    expect(theoLoai('Cho các nhận định sau về nitrogen.', 'hoi')).toEqual([])
  })
})

describe('số + đơn vị (Đề cho)', () => {
  it.each([
    ['Cho 0,5M', '0,5M', 'M'], ['dung dịch HCl 2 M,', '2 M', 'M'], ['lấy 0,1 mol/L', '0,1 mol/L', 'M'],
    ['cần 1 tấn quặng', '1 tấn', 'tan'], ['cần 2,5 kg', '2,5 kg', 'kg'], ['có 150 mg', '150 mg', 'mg'],
    ['thể tích 250 ml', '250 ml', 'mL'], ['thu 2,479 lít khí', '2,479 lít', 'L'], ['bình 5 L', '5 L', 'L'],
    ['thể tích 1000 m³', '1000 m³', 'm3'], ['thể tích 2 dm3', '2 dm3', 'L'], ['còn 50 cm³', '50 cm³', 'mL'],
    ['khối lượng riêng 1,2 g/mL', '1,2 g/mL', 'D'], ['D = 1,84 g/cm³', '1,84 g/cm³', 'D'], ['M = 88 g/mol', '88 g/mol', 'g/mol'],
    ['ở 25°C', '25°C', 'oC'], ['ở 25 oC', '25 oC', 'oC'], ['ở 298 K', '298 K', 'K'], ['áp suất 1 bar', '1 bar', 'bar'], ['áp suất 2 atm', '2 atm', 'atm'],
    ['toả ra 57,3 kJ', '57,3 kJ', 'kJ'], ['nhiệt 200 J', '200 J', 'J'],
    ['điện phân với dòng điện 5 A', '5 A', 'A'], ['điện phân trong 1930 giây', '1930 giây', 's'], ['điện phân trong 2h', '2h', 'gio'],
    ['điện phân 30 phút', '30 phút', 'phut'], ['điện phân 1,5 giờ', '1,5 giờ', 'gio'],
    ['có 1,2.10^-3 mol', '1,2.10^-3 mol', 'mol'], ['có 10⁶ g', '10⁶ g', 'g'], ['có 1.000 gam', '1.000 gam', 'g'],
    ['hiệu suất 80%', '80%', '%H'], ['dung dịch NaCl nồng độ 10%', '10%', '%C'], ['chiếm 20% thể tích', '20%', '%'], ['phần trăm khối lượng là 40 %', '40 %', '%m'],
  ])('«%s» ⇒ %s', (de, chu, khoa) => {
    const v = phatHien(de).find((x) => x.loai === 'cho')
    expect(v?.chu).toBe(chu)
    expect(v?.khoa).toBe(khoa)
  })
  it('đkc / đktc lấy đúng chữ của đề', () => {
    expect(phatHien('thu được 2,479 lít khí (đkc).').find((v) => v.chu === 'đkc')?.khoa).toBe('dkc')
    expect(phatHien('thu được 2,24 lít khí (đktc).').find((v) => v.chu === 'đktc')?.khoa).toBe('dktc')
    expect(phatHien('khí đo ở điều kiện chuẩn').find((v) => v.loai === 'cho')?.khoa).toBe('dkc')
  })
  it.each([
    'Cho kim loại M tác dụng với dung dịch HCl.',
    'Biết M = 56.',
    'Giá trị của m là',
    'Kim loại M có hoá trị II.',
    'Số mol là đại lượng.',
    'Trong 2 A và B thì A là chất rắn.',
    'Có 3 s orbital.',
    'Nguyên tố có Z = 11.',
  ])('không tô Đề cho: «%s»', (de) => {
    expect(theoLoai(de, 'cho')).toEqual([])
  })
})

describe('chất: công thức và tên', () => {
  it.each([
    ['NaOH'], ['FeS2'], ['H2SO4'], ['CO2'], ['CH3COOC2H5'], ['Ca(OH)2'], ['Al2(SO4)3'], ['CuSO4.5H2O'], ['(C17H35COO)3C3H5'],
    ['H₂SO₄'], ['Fe3+'], ['SO4^2-'], ['Fe³⁺'], ['NO3-'], ['CH2=CH2'], ['HCl'], ['CO'], ['NO'], ['Fe'], ['Na'],
  ])('tô công thức %s', (ct) => {
    expect(theoLoai(`Cho ${ct} vào nước.`, 'chat')).toEqual([ct])
  })
  it('ranh chữ chạm cắt đúng ranh công thức', () => {
    expect(theoLoai('dung dịch (NaOH) và HCl)', 'chat')).toEqual(['NaOH', 'HCl'])
    expect(theoLoai('muối Fe(III) clorua', 'chat')).toEqual(['Fe'])
    expect(theoLoai('phương trình 2H2 + O2 → 2H2O', 'chat')).toEqual(['H2', 'O2', 'H2O'])
  })
  it.each([
    'Chất X, Y, Z và M.', 'Giá trị V là', 'Viết PTHH và CTPT.', 'Đây là HCHC.', 'Liên kết C-H và C=O bền.', 'Nhóm IA và IIA.',
    'Đáp án C.', 'Nguyên tố K và I.', 'Ba ống nghiệm đựng dung dịch.', 'Cho biết hoá trị II của R.', 'Sau đó Cho thêm Biết.', 'OK SO PC',
  ])('không tô chất: «%s»', (de) => {
    expect(theoLoai(de, 'chat')).toEqual([])
  })
  it('«Ba» là bari khi đi sau «kim loại» hoặc đứng trước dấu câu', () => {
    expect(theoLoai('Cho kim loại Ba vào nước.', 'chat')).toEqual(['Ba'])
    expect(theoLoai('Hai kim loại là Na và Ba.', 'chat')).toEqual(['Na', 'Ba'])
  })
  it('tên IUPAC, tên cũ, tên thường gọi', () => {
    expect(theoLoai('Cho sodium hydroxide vào ethyl acetate.', 'chat')).toEqual(['sodium hydroxide', 'ethyl acetate'])
    expect(theoLoai('Cho natri hiđroxit vào etyl axetat.', 'chat')).toEqual(['natri hiđroxit', 'etyl axetat'])
    expect(theoLoai('Cho natri hidroxit vào nước vôi trong.', 'chat')).toEqual(['natri hidroxit', 'nước vôi trong'])
    expect(theoLoai('Thuỷ phân saccharose và tinh bột thu được glucose.', 'chat')).toEqual(['saccharose', 'tinh bột', 'glucose'])
    expect(theoLoai('Nung đá vôi thu được vôi sống.', 'chat')).toEqual(['đá vôi', 'vôi sống'])
    expect(phatHien('Cho sắt(III) clorua vào.').find((v) => v.loai === 'chat')?.khoa).toBe('iron(III) chloride')
  })
  it('chữ thường trùng tên chất không tô: «chất oxi hoá», «màu trắng bạc», «đồng thời», «màu vàng», «tin»', () => {
    for (const de of ['Cl2 là chất oxi hoá mạnh.', 'Kim loại có màu trắng bạc.', 'Đồng thời thu được khí.', 'Kết tủa màu vàng.', 'Em tin rằng đúng.'])
      expect(theoLoai(de, 'chat').filter((c) => !/^Cl2$/.test(c))).toEqual([])
  })
})

describe('từ then chốt', () => {
  it('nhận cả hai cách bỏ dấu (hoà/hòa, thuỷ/thủy)', () => {
    expect(theoLoai('trung hòa vừa đủ, thủy phân', 'khoa')).toEqual(['trung hòa', 'vừa đủ', 'thủy phân'])
  })
  it('lấy cụm dài nhất', () => {
    expect(theoLoai('Nung đến khối lượng không đổi', 'khoa')).toEqual(['Nung đến khối lượng không đổi'])
    expect(theoLoai('Đốt cháy hoàn toàn chất X', 'khoa')).toEqual(['Đốt cháy hoàn toàn'])
  })
  it('«đặc» không tô trong «đặc điểm», «đặc trưng»; «dư» không tô trong «dưới»', () => {
    expect(theoLoai('Đặc điểm và đặc trưng của chất phía dưới.', 'khoa')).toEqual([])
    expect(theoLoai('H2SO4 đặc', 'khoa')).toEqual(['đặc'])
  })
})

describe('mệnh đề «Cho nguyên tử khối»', () => {
  it('không tô gì trong mệnh đề, phần còn lại vẫn tô', () => {
    const de = 'Cho 5,85 gam NaCl vào nước. Cho nguyên tử khối: H = 1; Na = 23; Cl = 35,5. Tính khối lượng chất tan.'
    const v = phatHien(de)
    const dau = de.indexOf('Cho nguyên tử khối'); const cuoi = de.indexOf('35,5') + 4
    expect(v.filter((x) => x.tu < cuoi && x.den > dau)).toEqual([])
    expect(v.map((x) => x.chu)).toEqual(['5,85 gam', 'NaCl', 'Tính khối lượng chất tan'])
  })
  it('dạng ngoặc «(H = 1, C = 12, O = 16)»', () => {
    const de = 'Đốt 4,6 gam ethanol (H = 1, C = 12, O = 16).'
    expect(phatHien(de).map((x) => x.chu)).toEqual(['4,6 gam', 'ethanol'])
  })
})

describe('chữ đề NFD và ghi nhớ', () => {
  it('chữ NFD cho cùng vùng, vị trí theo chuỗi NFD', () => {
    const nfd = DE_ESTER.normalize('NFD')
    const v = phatHien(nfd)
    kiemBatBien(nfd, v)
    expect(v.map((x) => `${x.loai}:${x.chu.normalize('NFC')}`)).toEqual(tom(DE_ESTER))
  })
  it('gọi lại cùng đề trả kết quả bằng nhau nhưng là bản sao', () => {
    const a = phatHien(DE_ESTER); const b = phatHien(DE_ESTER)
    expect(a).toEqual(b)
    a[0].chu = 'đổi'
    expect(phatHien(DE_ESTER)[0].chu).toBe('Thuỷ phân')
  })
  it('đề rỗng', () => { expect(phatHien('')).toEqual([]) })
})

describe('bộ đề mẫu dài: bất biến', () => {
  const DE = [
    DE_ESTER, DE_LY_THUYET,
    'Nung 1 tấn quặng pirit chứa 80% FeS₂ để sản xuất H₂SO₄ với hiệu suất 90%. Khối lượng H2SO4 thu được là bao nhiêu kg?',
    'Hấp thụ hoàn toàn 2,479 lít CO2 (đkc) vào 200 ml dung dịch Ba(OH)2 0,1 M thu được m gam kết tủa. Giá trị gần nhất của m là',
    'Cho 3,2 gam kim loại R (hoá trị II) tác dụng với dung dịch HNO3 đặc, nóng dư thu được 2,2311 lít NO2 (đkc, sản phẩm khử duy nhất). Xác định kim loại R.',
    'Điện phân 200 mL dung dịch CuSO4 0,5M với cường độ 9,65A trong 2h. pH = 3; t = 25°C; 1,2.10^-3 mol; 10⁶ g; 2,5 × 10^23 nguyên tử.',
    'Cho 0,1 mol glucozơ lên men với hiệu suất 80%, khí sinh ra hấp thụ vào nước vôi trong dư. Tính khối lượng kết tủa thu được?',
    'Xà phòng hoá hoàn toàn 17,8 gam tristearin bằng dung dịch KOH vừa đủ, cô cạn thu được m gam xà phòng. Giá trị của m là',
    'Cho 13 gam Zn tác dụng với 200 mL dung dịch H₂SO₄ 1M (loãng). Sau khi phản ứng xảy ra hoàn toàn, thể tích khí H₂ (đkc) thu được là',
    'Dẫn 4,48 lít khí SO2 (đktc) vào 300 mL dung dịch NaOH 1M. Biết M = 64. Giá trị của m là bao nhiêu?',
  ]
  it.each(DE)('%s', (de) => { kiemBatBien(de, phatHien(de)) })
  it('đề sản xuất: số liệu, chất và hiệu suất', () => {
    expect(tom(DE[2])).toEqual([
      'khoa:Nung', 'cho:1 tấn', 'chat:quặng pirit', 'cho:80%', 'chat:FeS₂', 'chat:H₂SO₄', 'khoa:hiệu suất', 'cho:90%',
      'hoi:Khối lượng', 'chat:H2SO4', 'hoi:thu được là bao nhiêu kg',
    ])
  })
})
