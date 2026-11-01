// @vitest-environment jsdom
// CHIẾU CHỮA BÀI · GỌI LÊN BẢNG · LaTeX TRÊN TỜ (thầy 01/11 tối, kèm ảnh máy chiếu: «Chữ chiếu lên máy chiếu bị lỗi, tràn trang … Gọi lên bảng chọn học sinh
// làm đúng câu đó, nếu ko có ai thì thầy chữa, hiện thị số giây làm câu sai sắp xếp thẻ tên làm ngắn nhất trước»). Khoá:
//   · thẻ tên: số giây mỗi em, NGẮN NHẤT trước, null cuối, bằng nhau giữ thứ tự ca; «+n em» như cũ; danh sách em ĐÚNG (tên gọn + giây), không SBD;
//   · LaTeX trần / `$…$` ⇒ HTML thuần: `\frac {…} {…}` thành phân số có tử/mẫu (chỉ số dưới vẫn đúng), bảng đóng (không nuốt `\<chữ>` lạ), chuỗi không
//     LaTeX ra đúng như cũ; tờ chữa bài của câu Kc trong ảnh thầy không còn chữ `\frac` thô;
//   · chọn em lên bảng: chỉ em đúng, tránh theo thứ tự ưu tiên; tờ: phím L ⇒ điền em vào THẺ TÊN CHUẨN rồi chạy ĐÚNG màn gọi tên của tờ chuẩn
//     (`__mcLenBang`) — góp ý sau PR 730 «Tên lên bảng làm giống hiệu ứng của các màn khác»; đổi em = «Gọi em khác» (E) của tờ chuẩn; không ai đúng ⇒ «Thầy
//     chữa» kiểu tờ chuẩn (không gọi tên); D/K không ghi điểm.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { giayHopLe, theChuaDung, xepCauChuaCa, xepTheoGiay, type EmBaiCa } from '../src/lib/chieu-chua-ca'
import { JS_CHUA_BAI, chonEmGoi, theChuaDungHtml } from '../src/lib/chieu-chua-ca-to'
import { dotGoiEmChuaBai } from '../src/components/ca-thi/dung-to-chua-ca'
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
    expect(dotGoiEmChuaBai(t)).toEqual({ em: [{ sbd: '', ten: 'Thu Hà', khoa: '', nhan: '', giay: 33 }], coGhi: true, chuLop: '1/6 em làm đúng câu này' })
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

describe('tờ chữa bài: phím L chạy màn gọi tên CHUẨN cho em làm đúng / Thầy chữa (chạy JS thật của tờ)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    document.body.innerHTML = ''
    document.body.removeAttribute('data-pha')
    document.body.className = ''
  })
  const goiEm = (ds: [string, number | null][]) => JSON.stringify({ em: ds.map(([ten, giay]) => ({ sbd: '', ten, khoa: '', nhan: '', giay })), coGhi: true, chuLop: '' }).replace(/"/g, '&quot;')
  const dot = (so: number, ds: [string, number | null][]) => `<div class="mc-dot mc-dot-don" data-goi-em="${goiEm(ds)}"><span class="mc-de-so">Câu ${so}</span><header class="mc-em" id="em-${so}" hidden><div class="mc-ten-hang"><span class="mc-ten">Cả lớp</span></div><span class="mc-xem-ct">Chi tiết ›</span></header><section class="mc-cot-lam-bai" data-nhan-em="Phần làm bài của lớp"></section></div>`
  function dungTo() {
    let i = 0
    document.body.innerHTML = `<div id="mc-ray">${dot(7, [['Minh Anh', 42], ['Gia Bảo', null]])}${dot(3, [])}${dot(9, [['Minh Anh', 30], ['Thảo Chi', 51]])}</div><button id="mc-goi-nut"></button><button id="mc-st-nut"><span class="mc-nut-chu"></span></button><div class="mc-bao"></div>`
    document.body.setAttribute('data-pha', 'cho')
    const dots = [...document.querySelectorAll<HTMLElement>('#mc-ray > .mc-dot')]
    const w = window as unknown as Record<string, unknown>
    const lenBang = vi.fn(() => document.body.setAttribute('data-pha', 'chua')) // màn gọi tên chuẩn (JS_MAY_CHIEU) — ở đây chỉ đổi pha
    const dat = vi.fn()
    Object.assign(w, { __mcDot: () => dots[i], __mcChiSo: () => i, __mcLenBang: lenBang, __mcGoiEmDat: dat })
    new Function(JS_CHUA_BAI)()
    const den = (k: number) => { i = k; document.body.setAttribute('data-pha', 'cho'); document.dispatchEvent(new CustomEvent('mc-vao-dot')) }
    return { dots, lenBang, dat, den }
  }
  const phim = (key: string) => { const e = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }); window.dispatchEvent(e); return e }
  const the = (d: HTMLElement) => ({ ten: d.querySelector('.mc-ten')!.textContent, phu: d.querySelector('.mc-em-phu')?.textContent ?? null })

  it('L ⇒ em làm đúng vào thẻ tên chuẩn + «Làm đúng trong n giây», rồi gọi __mcLenBang; tránh em vừa gọi ở câu trước; Gọi em khác đổi dòng giây', () => {
    const { dots, lenBang, dat, den } = dungTo()
    vi.spyOn(Math, 'random').mockReturnValue(0)
    const e = phim('l')
    expect(e.defaultPrevented).toBe(true)
    expect(the(dots[0]!)).toEqual({ ten: 'Minh Anh', phu: 'Làm đúng trong 42 giây' })
    expect(dat).toHaveBeenLastCalledWith(0) // «Gọi em khác» đi tiếp từ em này
    expect(lenBang).toHaveBeenCalledTimes(1)
    expect(dots[0]!.querySelector('.mc-cot-lam-bai')!.getAttribute('data-nhan-em')).toBe('Phần làm bài của Anh')
    expect(document.body.classList.contains('mc-st-gon')).toBe(true) // tự thu gọn thẻ em chưa đúng để có chỗ viết
    expect(phim('l').defaultPrevented).toBe(false) // đã gọi (pha ĐANG CHỮA): L để tờ chuẩn xử lý như mọi màn
    expect(lenBang).toHaveBeenCalledTimes(1)
    expect(phim('d').defaultPrevented).toBe(true) // không ghi Đạt / Chưa đạt
    expect(document.querySelector('.mc-bao')!.textContent).toBe('Tờ chữa bài không ghi Đạt / Chưa đạt')
    den(2)
    expect(document.body.classList.contains('mc-st-gon')).toBe(false) // sang câu khác: mở lại thẻ
    phim('L') // Math.random = 0 lẽ ra «Minh Anh» — em vừa gọi ở câu trước ⇒ tránh
    expect(the(dots[2]!)).toEqual({ ten: 'Thảo Chi', phu: 'Làm đúng trong 51 giây' })
    expect(dat).toHaveBeenLastCalledWith(1)
    dots[2]!.querySelector('.mc-ten')!.textContent = 'Minh Anh' // mảnh «Gọi em khác» chuẩn vừa đổi tên
    document.dispatchEvent(new CustomEvent('mc-doi-em'))
    expect(the(dots[2]!)).toEqual({ ten: 'Minh Anh', phu: 'Làm đúng trong 30 giây' })
    den(0)
    phim('l') // em vừa gọi là «Minh Anh» (câu 9) ⇒ câu 7 gọi «Gia Bảo»; không có số giây ⇒ không dòng giây
    expect(the(dots[0]!)).toEqual({ ten: 'Gia Bảo', phu: null })
  })
  it('câu không em nào làm đúng ⇒ Thầy chữa kiểu tờ chuẩn: không gọi tên, đợt mang data-thay-chua, báo một dòng', () => {
    const { dots, lenBang, den } = dungTo()
    den(1)
    document.getElementById('mc-goi-nut')!.click()
    expect(lenBang).not.toHaveBeenCalled()
    expect(dots[1]!.hasAttribute('data-thay-chua')).toBe(true)
    expect(document.querySelector('.mc-bao')!.textContent).toBe('Chưa em nào làm đúng câu này — Thầy chữa')
    expect(dots[1]!.querySelector('.mc-em')!.hasAttribute('hidden')).toBe(true)
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
    expect(than).toContain('&quot;ten&quot;:&quot;Thảo Chi&quot;,&quot;khoa&quot;:&quot;&quot;,&quot;nhan&quot;:&quot;&quot;,&quot;giay&quot;:64')
    expect(than).not.toContain('mc-goi-the') // không tấm gọi riêng: dùng màn gọi tên chuẩn
  })
})
