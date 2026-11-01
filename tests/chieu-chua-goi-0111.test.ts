// @vitest-environment jsdom
// CHIẾU CHỮA BÀI · GỌI LÊN BẢNG · LaTeX TRÊN TỜ (thầy 01/11 tối, kèm ảnh máy chiếu: «Chữ chiếu lên máy chiếu bị lỗi, tràn trang … Gọi lên bảng chọn học sinh
// làm đúng câu đó, nếu ko có ai thì thầy chữa, hiện thị số giây làm câu sai sắp xếp thẻ tên làm ngắn nhất trước»). Khoá:
//   · thẻ tên: số giây mỗi em, NGẮN NHẤT trước, null cuối, bằng nhau giữ thứ tự ca; «+n em» như cũ; danh sách em ĐÚNG (tên gọn + giây), không SBD;
//   · LaTeX trần / `$…$` ⇒ HTML thuần: `\frac {…} {…}` thành phân số có tử/mẫu (chỉ số dưới vẫn đúng), bảng đóng (không nuốt `\<chữ>` lạ), chuỗi không
//     LaTeX ra đúng như cũ; tờ chữa bài của câu Kc trong ảnh thầy không còn chữ `\frac` thô;
//   · chọn em lên bảng: chỉ em đúng, tránh theo thứ tự ưu tiên; tờ: phím L ⇒ «Mời <tên> lên bảng», «Gọi bạn khác», Esc đóng; không ai đúng ⇒ «Thầy chữa».
import { afterEach, describe, expect, it, vi } from 'vitest'
import { giayHopLe, theChuaDung, xepCauChuaCa, xepTheoGiay, type EmBaiCa } from '../src/lib/chieu-chua-ca'
import { JS_CHUA_BAI, TAM_GOI, chonEmGoi, theChuaDungHtml } from '../src/lib/chieu-chua-ca-to'
import { chuHtml } from '../src/lib/html-phieu'
import { chuCoLatex, nutLatex, tachKhucLatex } from '../src/lib/latex-html'
import { LENH_LATEX_TOAN } from '../src/lib/chem-format'
import type { ChiTietCauRow } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const r = (qid: string, dungSai: boolean, giay: number | null, soCau = 1): ChiTietCauRow => ({ phan: 'I', soCau, qid, chuyenDe: '', mucDo: 'van_dung', dapAnChon: dungSai ? 'B' : 'A', dapAnDung: 'B', dungSai, giay })

describe('thẻ tên: số giây, ngắn nhất trước', () => {
  it('xếp theo giây tăng dần, null cuối, bằng nhau giữ thứ tự ca', () => {
    const ds: EmBaiCa[] = [
      { sbd: '101', hoTen: 'Nguyễn Văn An', rows: [r('q', false, 95)] },
      { sbd: '102', hoTen: 'Trần Thị Bình', rows: [r('q', false, null)] },
      { sbd: '103', hoTen: 'Lê Minh Châu', rows: [r('q', false, 12)] },
      { sbd: '104', hoTen: 'Phạm Quốc Dũng', rows: [r('q', false, 40)] },
      { sbd: '105', hoTen: 'Hoàng Thu Hà', rows: [r('q', true, 33)] },
      { sbd: '106', hoTen: 'Vũ Đức Huy', rows: [r('q', false, 40)] },
    ]
    const [c] = xepCauChuaCa(ds)
    expect(c!.sai.map((e) => e.giay)).toEqual([95, null, 12, 40, 40]) // CauChuaCa giữ thứ tự ca
    expect(c!.dung).toEqual([{ sbd: '105', hoTen: 'Hoàng Thu Hà', giay: 33 }])
    const t = theChuaDung(c!)
    expect(t.em).toEqual([{ ten: 'Minh Châu', giay: 12 }, { ten: 'Quốc Dũng', giay: 40 }, { ten: 'Đức Huy', giay: 40 }, { ten: 'Văn An', giay: 95 }, { ten: 'Thị Bình', giay: null }])
    expect(t.dung).toEqual([{ ten: 'Thu Hà', giay: 33 }])
    expect(t).toMatchObject({ tong: 5, lam: 6, them: 0 })
    const html = theChuaDungHtml(t)
    expect(html.indexOf('Minh Châu')).toBeLessThan(html.indexOf('Văn An'))
    expect(html.indexOf('Văn An')).toBeLessThan(html.indexOf('Thị Bình'))
    expect(html).toContain('Số giây làm câu · nhanh nhất trước')
    expect(html).toContain('<ul class="mc-st-dung" hidden><li data-giay="33">Thu Hà</li></ul>')
    for (const sbd of ['101', '102', '103', '104', '105', '106']) expect(html).not.toContain(sbd) // KHÔNG số báo danh trên tờ
  })
  it('giây không hợp lệ ⇒ null; không em nào có giây ⇒ không ô giây, không chú thích', () => {
    expect([giayHopLe(12.6), giayHopLe('7'), giayHopLe(-1), giayHopLe(NaN), giayHopLe(null), giayHopLe('')]).toEqual([13, 7, null, null, null, null])
    expect(xepTheoGiay([{ giay: null }, { giay: 3 }, { giay: 0 }])).toEqual([{ giay: 0 }, { giay: 3 }, { giay: null }])
    const html = theChuaDungHtml(theChuaDung({ sai: [{ sbd: '1', hoTen: 'Lê An' }], lam: 3 }))
    expect(html).not.toContain('mc-st-giay')
    expect(html).not.toContain('Số giây làm câu')
  })
  it('tên gọn tính trên cả câu: em sai và em đúng trùng hai chữ cuối ⇒ cả hai in đủ họ tên', () => {
    const t = theChuaDung({ sai: [{ sbd: '1', hoTen: 'Nguyễn Minh Anh', giay: 5 }], dung: [{ sbd: '2', hoTen: 'Trần Minh Anh', giay: 9 }], lam: 2 })
    expect(t.em[0]!.ten).toBe('Nguyễn Minh Anh')
    expect(t.dung[0]!.ten).toBe('Trần Minh Anh')
  })
  it('nhiều em vẫn gọn: tối đa 29 viên + «+n em», hai cột', () => {
    const sai = Array.from({ length: 40 }, (_, i) => ({ sbd: String(i), hoTen: `Họ Tên Em${i}`, giay: 100 - i }))
    const t = theChuaDung({ sai, lam: 45 })
    expect(t.em).toHaveLength(29)
    expect(t.em[0]).toEqual({ ten: 'Tên Em39', giay: 61 }) // nhanh nhất trước
    const html = theChuaDungHtml(t)
    expect(html).toContain('+11 em')
    expect(html).toContain('--cd-cot:2')
  })
})

const CHU = (raw: string) => `«${raw}»`

describe('LaTeX ⇒ HTML thuần (tờ chiếu, phiếu)', () => {
  it('câu Kc trong ảnh thầy: `\\frac {…} {…}` (có/không khoảng trắng) ⇒ phân số có tử/mẫu, chỉ số dưới đúng, không còn \\frac', () => {
    for (const s of ['K_C = \\frac{[CH3COOH][HOC2H5]}{[H2O]}', 'K_C = \\frac {[CH3COOH][HOC2H5]} {[H2O]}', '$K_C = \\dfrac{[CH3COOH][HOC2H5]}{[H2O]}$']) {
      const h = chuHtml(s)
      expect(h).not.toContain('\\')
      expect(h).toContain('K<sub>C</sub> = <span class="lt-ps"><span class="lt-tu">[CH<sub>3</sub>COOH][HOC<sub>2</sub>H<sub>5</sub>]</span><span class="lt-mau">[H<sub>2</sub>O]</span></span>')
    }
  })
  it('căn, ký hiệu, chữ Hy Lạp, \\circ, \\left/\\right, \\text, gạch trên, chỉ số lồng', () => {
    expect(chuHtml('\\Delta_r H^\\circ_{298} = -92 kJ')).toBe('Δ<sub>r</sub> H°<sub>298</sub> = -92 kJ')
    expect(chuHtml('$x \\leq 2 \\times 3 \\neq 5 \\approx \\pm 1$')).toBe('x ≤ 2 × 3 ≠ 5 ≈ ± 1')
    expect(chuHtml('\\sqrt{2}')).toContain('<span class="lt-can-trong">2</span>')
    expect(chuHtml('\\bar{A} = 63,5')).toBe('<span class="lt-gach">A</span> = 63,5')
    expect(chuHtml('$\\left( \\dfrac{a}{b} \\right)^2$')).toContain('<span class="lt-tu">a</span>')
    expect(chuHtml('$[H^+] = \\dfrac{n_{H^+}}{V}$')).toContain('<span class="lt-tu">n<sub>H<sup>+</sup></sub></span>')
    expect(chuHtml('$\\text{mol} \\cdot \\alpha$')).toBe('mol · α')
  })
  it('bảng đóng: `\\<chữ>` lạ giữ nguyên văn, `\\frac` thiếu tham số không nuốt chữ, `\\ce{}` đi đường cũ', () => {
    expect(chuHtml('C:\\temp\\frac lạ \\foo{x}')).toBe('C:\\temp\\frac lạ \\foo{x}')
    expect(tachKhucLatex('a \\ce{H2O} b')).toEqual([{ t: 'chu', v: 'a \\ce{H2O} b' }])
    expect(tachKhucLatex('Xét $K_C$ và \\frac {1} {2} nhé')).toEqual([{ t: 'chu', v: 'Xét $K_C$ và ' }, { t: 'tex', v: '\\frac {1} {2}' }, { t: 'chu', v: ' nhé' }])
    // chữ tiếng Việt giữa hai lệnh ⇒ hai khúc (không nuốt câu văn)
    expect(tachKhucLatex('\\Delta H của phản ứng và \\dfrac{a}{b}').filter((k) => k.t === 'tex').map((k) => k.v)).toEqual(['\\Delta', '\\dfrac{a}{b}'])
  })
  it('mọi lệnh trong bảng đóng của ChemText đều được dựng (không còn dấu \\)', () => {
    for (const ten of LENH_LATEX_TOAN) {
      const ra = nutLatex(`\\${ten}{x}{y}`, CHU).map((n) => n.r ?? n.h).join('')
      expect(ra, ten).not.toContain('\\')
    }
  })
  it('chuỗi không có khúc LaTeX ra đúng như đường cũ', () => {
    for (const s of ['CH3COOH + C2H5OH <=> CH3COOC2H5 + H2O', 'Giá trị $K_C$ là', 'a \\ce{->[t^o]} b', '50\\% khối lượng', '']) expect(chuCoLatex(s, CHU)).toBe(CHU(s))
  })
})

describe('chọn em lên bảng', () => {
  const ten = ['An', 'Bình', 'Châu', 'Dũng']
  it('chỉ chọn trong danh sách; rỗng ⇒ -1', () => {
    expect(chonEmGoi([], [], 0.5)).toBe(-1)
    for (const x of [0, 0.3, 0.6, 0.999]) expect(chonEmGoi(ten, [], x)).toBe(Math.floor(x * 4))
  })
  it('tránh theo thứ tự ưu tiên chừng nào còn lựa chọn', () => {
    expect(ten[chonEmGoi(ten, [['An'], ['Bình', 'Châu']], 0)!]).toBe('Dũng')
    expect(ten[chonEmGoi(ten, [['An', 'Bình', 'Châu'], ['Dũng']], 0.9)!]).toBe('Dũng') // tránh hết thì bỏ qua nhóm sau
    expect(chonEmGoi(['An'], [['An']], 0.4)).toBe(0) // một em ⇒ vẫn em ấy
  })
})

describe('tờ chữa bài: phím L gọi em làm đúng / Thầy chữa (chạy JS thật của tờ)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })
  const dung = (ds: [string, number | null][]) => `<ul class="mc-st-dung" hidden>${ds.map(([t, g]) => `<li${g == null ? '' : ` data-giay="${g}"`}>${t}</li>`).join('')}</ul>`
  function dungTo(): { den: (i: number) => void } {
    let i = 0
    document.body.innerHTML = `<div id="mc-ray"><div class="mc-dot"><span class="mc-de-so">Câu 7</span>${dung([['Minh Anh', 42], ['Gia Bảo', null]])}</div><div class="mc-dot"><span class="mc-de-so">Câu 3</span>${dung([])}</div><div class="mc-dot"><span class="mc-de-so">Câu 9</span>${dung([['Minh Anh', 30], ['Thảo Chi', 51]])}</div></div><button id="mc-goi-nut"></button>${TAM_GOI}`
    ;(window as unknown as { __mcTrangThai: () => { dot: number } }).__mcTrangThai = () => ({ dot: i })
    new Function(JS_CHUA_BAI)()
    return { den: (k) => { i = k; document.dispatchEvent(new CustomEvent('mc-vao-dot')) } }
  }
  const phim = (key: string) => window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  const chu = (id: string) => document.getElementById(id)!.textContent
  const mo = () => !document.getElementById('mc-goi')!.hidden

  it('L ⇒ «Mời <em đúng> lên bảng chữa câu này» + giây; Gọi bạn khác đổi em; Esc đóng; sang câu khác tránh em vừa gọi', () => {
    const to = dungTo()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    phim('l')
    expect(mo()).toBe(true)
    expect([chu('mc-goi-ke'), chu('mc-goi-moi'), chu('mc-goi-ten'), chu('mc-goi-viec'), chu('mc-goi-giay')]).toEqual(['Câu 7 · 2 em làm đúng', 'Mời', 'Minh Anh', 'lên bảng chữa câu này', 'Làm đúng trong 42 giây'])
    phim('l') // khi tấm mở: L = gọi bạn khác
    expect(chu('mc-goi-ten')).toBe('Gia Bảo')
    expect(document.getElementById('mc-goi-giay')!.hidden).toBe(true) // không có số giây ⇒ không dòng giây
    phim('l')
    expect(chu('mc-goi-ten')).toBe('Minh Anh') // hai em đều đã gọi ⇒ vòng lại, nhưng không lặp em đang hiện
    phim('Escape')
    expect(mo()).toBe(false)
    to.den(2)
    phim('l') // Math.random = 0 lẽ ra là «Minh Anh» — em vừa gọi ở câu trước ⇒ tránh, còn «Thảo Chi»
    expect(chu('mc-goi-ten')).toBe('Thảo Chi')
    expect(chu('mc-goi-giay')).toBe('Làm đúng trong 51 giây')
    to.den(0)
    expect(mo()).toBe(false) // đổi câu ⇒ tấm đóng
  })
  it('câu không em nào làm đúng ⇒ «Chưa em nào làm đúng câu này — Thầy chữa», không nút gọi bạn khác', () => {
    const to = dungTo()
    to.den(1)
    document.getElementById('mc-goi-nut')!.click()
    expect([chu('mc-goi-moi'), chu('mc-goi-ten')]).toEqual(['Chưa em nào làm đúng câu này', 'Thầy chữa'])
    expect(document.getElementById('mc-goi-khac')!.hidden).toBe(true)
    expect(document.getElementById('mc-goi')!.classList.contains('mc-goi-thay')).toBe(true)
  })
})

describe('tờ chữa bài dựng từ ca: câu Kc trong ảnh thầy', () => {
  it('không còn chữ \\frac thô, có 4 phân số ở 4 phương án, có nút Gọi lên bảng', async () => {
    const { dungToChuaCa } = await import('../src/components/ca-thi/dung-to-chua-ca')
    const KC = 'K_C = \\frac {[CH3COOH][HOC2H5]} {[H2O]}'
    const nguon = [{ maDe: 'KT', phanI: [{ id: 'KT-Kc', text: 'Biểu thức tính hằng số cân bằng K_C của phản ứng là', choices: [KC, 'K_C = \\frac{[CH3COOC2H5][H2O]}{[CH3COOH][C2H5OH]}', KC, KC], correct: 'B' }], phanII: [], phanIII: [] }] as unknown as TeacherExamSource[]
    const ds = xepCauChuaCa([
      { sbd: '1', hoTen: 'Nguyễn Hải Đăng', rows: [r('KT-Kc', false, 20)] },
      { sbd: '2', hoTen: 'Lê Thảo Chi', rows: [r('KT-Kc', true, 64)] },
    ])
    const { html } = await dungToChuaCa(ds, nguon, 'Chữa bài')
    const than = html.replace(/<script>[\s\S]*?<\/script>/g, '').replace(/<style>[\s\S]*?<\/style>/g, '')
    expect(than).not.toMatch(/\\(?:d|t)?frac/)
    expect((than.match(/class="lt-ps"/g) ?? []).length).toBeGreaterThanOrEqual(4)
    expect(than).toContain('<span class="lt-mau">[H<sub>2</sub>O]</span>')
    expect(than).toContain('id="mc-goi-nut"')
    expect(than).toContain('<li data-giay="64">Thảo Chi</li>')
  })
})
