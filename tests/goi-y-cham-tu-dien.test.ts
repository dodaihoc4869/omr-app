// «Chạm để hiểu đề» — từ điển chất (M do máy tính), đơn vị, từ then chốt (thầy chốt build 26/10).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import {
  cachTinhM, congThucPhanTu, danhSachChat, dangDep, docNguyenTuKhoiTrongDe, NGUYEN_TU_KHOI, phanTichCongThuc, sinhHopChat,
  tachDienTich, tinhM, traCongThuc, traTen,
} from '../src/lib/goi-y-cham/tu-dien-chat'
import { MA_DON_VI, theDonVi } from '../src/lib/goi-y-cham/tu-dien-don-vi'
import { danhSachThenChot, theThenChot } from '../src/lib/goi-y-cham/tu-then-chot'

describe('tinhM: máy tính từ bảng nguyên tử khối SGK', () => {
  it.each([
    ['NaOH', 40], ['CH3COOC2H5', 88], ['FeS2', 120], ['NaCl', 58.5], ['CuSO4·5H2O', 250], ['CuSO4.5H2O', 250], ['Ca3(PO4)2', 310],
    ['Al2(SO4)3', 342], ['Fe3O4', 232], ['KAl(SO4)2·12H2O', 474], ['(C17H35COO)3C3H5', 890], ['H₂SO₄', 98], ['C6H12O6', 180],
    ['(C6H10O5)n', 162], ['(NH4)2SO4', 132], ['HOOC[CH2]4COOH', 146], ['CH2=CH2', 28], ['SO4^2-', 96], ['Fe3+', 56], ['NH4+', 18],
    ['Cr2O72-', 216], ['SiO32-', 76], ['Sn2+', 119],
  ])('M(%s) = %d', (ct, M) => { expect(tinhM(ct)).toBe(M) })
  it('sai công thức ⇒ null', () => {
    for (const ct of ['Xy', 'NaO)H', '(OH', 'Cho', '', 'mol', 'M']) expect(tinhM(ct)).toBeNull()
  })
  it('dùng nguyên tử khối đề cho khi có', () => {
    expect(tinhM('NaCl', { Cl: 35 })).toBe(58)
    expect(cachTinhM('NaCl', { Cl: 35 })).toBe('Na = 23, Cl = 35 (23 + 35 = 58)')
    expect(tinhM('NaCl')).toBe(58.5)
  })
  it('cách tính theo thứ tự xuất hiện; số nguyên tử 1 thì ghi trần', () => {
    expect(cachTinhM('NaOH')).toBe('Na = 23, O = 16, H = 1 (23 + 16 + 1 = 40)')
    expect(cachTinhM('CH3COOC2H5')).toBe('C = 12, H = 1, O = 16 (4·12 + 8·1 + 2·16 = 88)')
    expect(cachTinhM('NaCl')).toBe('Na = 23, Cl = 35,5 (23 + 35,5 = 58,5)')
    expect(cachTinhM('Fe')).toBe('Fe = 56')
  })
  it('phân tích, Hill, tách điện tích, chữ đẹp', () => {
    expect(phanTichCongThuc('Ca(OH)2')?.dem).toEqual([['Ca', 1], ['O', 2], ['H', 2]])
    expect(congThucPhanTu('CH3COOC2H5')).toBe('C4H8O2')
    expect(congThucPhanTu('(C6H10O5)n')).toBe('C6H10O5n')
    expect(tachDienTich('SO42-')).toEqual({ goc: 'SO4', dienTich: '2-' })
    expect(tachDienTich('Fe3+')).toEqual({ goc: 'Fe', dienTich: '3+' })
    expect(tachDienTich('ClO4-')).toEqual({ goc: 'ClO4', dienTich: '-' })
    expect(dangDep('CH3COOC2H5')).toBe('CH₃COOC₂H₅')
    expect(dangDep('CuSO4·5H2O')).toBe('CuSO₄·5H₂O')
    expect(dangDep('SO4 2-')).toBe('SO₄²⁻')
    expect(dangDep('(C6H10O5)n')).toBe('(C₆H₁₀O₅)ₙ')
  })
  it('bảng nguyên tử khối không có V, W, U, Y (chữ hay gặp trong đề)', () => {
    for (const k of ['V', 'W', 'U', 'Y', 'X', 'M', 'R', 'A', 'D', 'E', 'G', 'T']) expect(NGUYEN_TU_KHOI[k]).toBeUndefined()
  })
})

describe('dữ liệu chất', () => {
  const ds = danhSachChat()
  it('khoảng 400 chất', () => { expect(ds.length).toBeGreaterThanOrEqual(380) })
  it('mọi công thức trong dữ liệu đều phân tích được, mọi chất có tên và loại', () => {
    for (const c of ds) {
      expect(c.ten, c.congThuc).toBeTruthy()
      expect(c.loai, c.congThuc).toBeTruthy()
      for (const v of c.cachViet) expect(phanTichCongThuc(tachDienTich(v).goc), v).not.toBeNull()
      if (c.congThuc) expect(tinhM(c.congThuc.replace(' ', '')), c.congThuc).not.toBeNull()
    }
  })
  it('muối sinh tự động cân bằng điện tích và không trùng nhau', () => {
    const sinh = sinhHopChat()
    expect(sinh.length).toBeGreaterThan(150)
    for (const h of sinh) expect(h.dienTich[0] * h.dienTich[1]).toBe(h.dienTich[2] * h.dienTich[3])
    expect(new Set(sinh.map((h) => h.congThuc)).size).toBe(sinh.length)
    expect(sinh.map((h) => h.congThuc)).toEqual(expect.arrayContaining(['Al2(SO4)3', 'Ca3(PO4)2', '(NH4)2SO4', 'Fe2O3', 'Ca(H2PO4)2', 'K2Cr2O7', 'KMnO4']))
  })
  it('không có cách viết bị che: một cách viết ⇒ một chất, trừ đồng phân có chủ ý', () => {
    const CHU_Y = new Set(['C6H12O6', 'C12H22O11', '(C6H10O5)n'])
    for (const c of ds) for (const v of c.cachViet) if (!CHU_Y.has(v)) expect(traCongThuc(v), v).toEqual([c])
  })
  it('không có tên bị che: mỗi tên tra ra đúng chất của nó', () => {
    for (const c of ds) for (const t of [c.ten, ...c.tenKhac, ...c.tenCu]) expect(traTen(t)?.ten, t).toBe(c.ten)
  })
  it('KHÔNG gõ tay khối lượng mol trong dữ liệu', () => {
    const src = readFileSync('src/lib/goi-y-cham/tu-dien-chat.ts', 'utf8')
    const duLieu = src.slice(src.indexOf('// ───────────────────────── DỮ LIỆU'), src.indexOf('const ucln'))
    expect(duLieu).not.toMatch(/g\/mol|M\s*=\s*\d/)
    for (const dong of duLieu.split('\n').filter((d) => d.includes('|') && !d.includes('//'))) {
      for (const truong of dong.split('|')) expect(/^\s*\d+([.,]\d+)?\s*$/.test(truong) && Number(truong) > 3, dong).toBe(false)
    }
  })
})

describe('tra hai chiều', () => {
  it('công thức → tên', () => {
    const [c] = traCongThuc('NaOH')
    expect(c).toMatchObject({ ten: 'sodium hydroxide', loai: 'Base mạnh' })
    expect(c.tenCu).toEqual(['natri hiđroxit', 'xút ăn da', 'xút'])
    expect(traCongThuc('H₂SO₄')[0].ten).toBe('sulfuric acid')
    expect(traCongThuc('FeCl3')[0]).toMatchObject({ ten: 'iron(III) chloride', loai: 'Muối' })
    expect(traCongThuc('Al(OH)3')[0].loai).toBe('Hydroxide lưỡng tính')
    expect(traCongThuc('Fe(OH)2')[0].loai).toBe('Base không tan')
    expect(traCongThuc('ZnO')[0].loai).toBe('Oxide lưỡng tính')
    expect(traCongThuc('SO42-')[0].loai).toBe('Ion')
  })
  it('cùng công thức phân tử ⇒ trả mọi chất', () => {
    expect(traCongThuc('C6H12O6').map((c) => c.ten)).toEqual(['glucose', 'fructose'])
    expect(traCongThuc('C2H5COOCH3').map((c) => c.ten)).toEqual(['methyl propionate'])
    expect(traCongThuc('C4H8O2').map((c) => c.ten).sort()).toEqual(['ethyl acetate', 'methyl propionate'])
  })
  it('tên → công thức (IUPAC, tên cũ, không phân biệt hoa thường, đ = d, hoà = hòa)', () => {
    expect(traTen('Ethyl acetate')?.congThuc).toBe('CH3COOC2H5')
    expect(traTen('etyl axetat')?.congThuc).toBe('CH3COOC2H5')
    expect(traTen('natri hidroxit')?.congThuc).toBe('NaOH')
    expect(traTen('sắt(III) oxit')?.congThuc).toBe('Fe2O3')
    expect(traTen('nước')?.congThuc).toBe('H2O')
    expect(traTen('không có chất này')).toBeNull()
  })
})

describe('nguyên tử khối đề cho', () => {
  it('đọc bảng và khoảng chữ', () => {
    const de = 'Tính m. Cho nguyên tử khối: H = 1; C = 12; O = 16; Cl = 35,5.'
    const { bang, khoang } = docNguyenTuKhoiTrongDe(de)
    expect(bang).toEqual({ H: 1, C: 12, O: 16, Cl: 35.5 })
    expect(de.slice(...khoang[0])).toBe('Cho nguyên tử khối: H = 1; C = 12; O = 16; Cl = 35,5')
  })
  it('không nhầm một phép gán lẻ', () => {
    expect(docNguyenTuKhoiTrongDe('Biết M = 56.').khoang).toEqual([])
  })
})

describe('thẻ đơn vị', () => {
  it('«1,5 M» đúng chữ bản vẽ', () => {
    const t = theDonVi('M', '1,5 M')!
    expect(t.ten).toBe('M · nồng độ mol')
    expect(t.nhan).toBe('Đơn vị')
    expect(t.doan[0]).toBe('1,5 M: cứ 1 lít dung dịch có 1,5 mol chất tan')
    expect(t.congThuc).toBe('n = C_M × V (V tính bằng lít)')
    expect(t.nhoDoi).toBe('1000 mL = 1 L')
  })
  it('đkc 24,79 và đktc 22,4 không lẫn', () => {
    const dkc = JSON.stringify(theDonVi('dkc', 'đkc')); const dktc = JSON.stringify(theDonVi('dktc', 'đktc'))
    expect(dkc).toContain('24,79'); expect(dkc).not.toContain('22,4')
    expect(dktc).toContain('22,4'); expect(dktc).not.toContain('24,79')
  })
  it('thẻ L không gắn cứng thể tích mol: theo đúng điều kiện đề ghi, lít khí thì bỏ dòng dung dịch', () => {
    const l = JSON.stringify(theDonVi('L', '2,479 lít'))
    expect(l).not.toContain('24,79'); expect(l).not.toContain('22,4')
    expect(theDonVi('L', '2,479 lít', 'Hấp thụ 2,479 lít CO2 (đkc) vào nước')!.doan).toEqual(['Khí ở đkc: n = V : 24,79'])
    expect(theDonVi('L', '2,24 lít', 'Dẫn 2,24 lít khí CO2 (đktc) vào nước')!.doan).toEqual(['Khí ở đktc: n = V : 22,4'])
    expect(theDonVi('L', '0,5 lít', 'Cho 0,5 lít dung dịch NaOH 1M (đkc)')!.doan).toEqual(['Dung dịch: n = C_M × V', '1 L = 1 dm³ = 1000 mL'])
  })
  it('thầy 27/10: thẻ đơn vị không nhắc lại đề («8,8 g là khối lượng chất»), «%» chung chung thì không thẻ', () => {
    expect(theDonVi('g', '8,8 gam')!.doan).toEqual(['Ra số mol: n = m : M'])
    expect(theDonVi('%', '10%')).toBeNull()
    for (const ma of MA_DON_VI) expect(JSON.stringify(theDonVi(ma, '7,3 x'))).not.toMatch(/7,3 (g|kg|mL|L|mol) là|Đọc kỹ|Đọc kĩ|tự hỏi/)
  })
  it('mọi mã có thẻ ngắn (1–3 câu), không tính hộ', () => {
    expect(MA_DON_VI.length).toBeGreaterThanOrEqual(25)
    for (const ma of MA_DON_VI) {
      const t = theDonVi(ma, '7,3 x')!
      expect(t.doan.length).toBeGreaterThanOrEqual(1)
      expect(t.doan.length).toBeLessThanOrEqual(3)
      for (const d of t.doan) expect(d).not.toMatch(/<[a-z/]|\{so\}/)
    }
    expect(theDonVi('khong-co')).toBeNull()
  })
  // Thầy 26/10: «Tạm thời bỏ tư duy tiền nhà» ⇒ nói thẳng bằng thuật ngữ, không ẩn dụ tiền / nhà / thuế.
  it('câu dính tới mol nói thẳng bằng thuật ngữ (tạm bỏ ẩn dụ tiền nhà)', () => {
    for (const ma of ['mol', 'g', 'M', 'dkc', 'g/mol', '%H', 'L', 'kg', 'A']) expect(JSON.stringify(theDonVi(ma, '1 x'))).not.toMatch(/tiền|nhà |giàu|thuế|\bmua\b/)
    expect(JSON.stringify(theDonVi('%H', '80%'))).toMatch(/xuôi.*H\/100.*ngược.*100\/H/)
  })
})

describe('từ then chốt', () => {
  it('khoảng 40 từ, mã không trùng; từ có thẻ thì nghĩa + một dòng kiến thức, KHÔNG câu «tự hỏi» (thầy 27/10)', () => {
    const ds = danhSachThenChot()
    expect(ds.length).toBeGreaterThanOrEqual(38)
    expect(new Set(ds.map((t) => t.ma)).size).toBe(ds.length)
    for (const t of ds) {
      if (!t.nghia) { expect(theThenChot(t.ma)).toBeNull(); continue }
      expect(t.them, t.ma).toBeTruthy()
      expect(`${t.nghia} ${t.them}`, t.ma).not.toMatch(/\?|tự hỏi/)
    }
  })
  it('từ thường ai cũng hiểu ⇒ không có thẻ', () => {
    for (const ma of ['dun-nong', 'thu-duoc', 'toi-da', 'toi-thieu', 'loc', 'nhiet-do-thuong']) expect(theThenChot(ma), ma).toBeNull()
  })
  it('thẻ «Cô cạn»', () => {
    const t = theThenChot('co-can', 'Cô cạn')!
    expect(t).toMatchObject({ ten: 'Cô cạn', nhan: 'Từ then chốt' })
    expect(t.doan[0]).toMatch(/bay hơi hết nước.*chất rắn khan/)
    expect(t.doan[1]).toBe('Chất rắn gồm muối tạo thành và chất không bay hơi còn dư (như NaOH dư).')
    expect(theThenChot('khong-co')).toBeNull()
  })
  it('hiệu suất nói thẳng xuôi / ngược (tạm bỏ «đánh thuế», thầy 26/10)', () => {
    const t = theThenChot('hieu-suat')!.doan.join(' ')
    expect(t).not.toMatch(/thuế|tiền/)
    expect(t).toMatch(/xuôi.*H\/100.*ngược.*100\/H/)
  })
})
