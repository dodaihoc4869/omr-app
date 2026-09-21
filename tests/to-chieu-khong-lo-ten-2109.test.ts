// @vitest-environment node
// P0 (thầy lệnh 21/09 16:4x): tờ máy chiếu LỘ TÊN EM ("Phần làm bài của Huy" ở góc dưới phải bảng đen) trước khi bấm "Hiện học sinh và thần thú".
// Khoá: (1) chế độ dạy học, trước khi hiện thẻ tên, mọi chỗ NHÌN THẤY (chữ ngoài phần tử `hidden` + nhãn CSS `content: attr(data-nhan)` + tiêu đề tab) không có tên gọi, họ tên, số báo danh — ở CẢ HAI kiểu bố cục
// (đợt đôi: `.mc-trang`; đợt đơn: `.mc-trang` + `.mc-cot-lam-bai`); (2) thẻ hiện ⇒ nhãn có tên của ĐÚNG em đó; ẩn lại ⇒ về không tên; (3) chế độ thường không đổi một byte.
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { NHAN_LAM_BAI_KHONG_TEN, taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

const em = (hoTen: string, sbd: string, text = 'Câu ngắn'): OBang => ({ sbd, hoTen, soCau: 1, sao: 0, cau: { phan: 'I', id: `q-${sbd}`, text, luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [] } as OBang['cau'] })
const HUY = em('Nguyễn Văn Huy', 'HS12345')
const LAN = em('Trần Thị Lan', 'HS67890')
const DAI = 'Đề bài rất dài. '.repeat(30) // > 280 ký tự ⇒ đợt ĐƠN (2/3 + 1/3)
const HUY_DAI = em('Nguyễn Văn Huy', 'HS12345', DAI)
const CAC_CHUOI_LO = ['Nguyễn Văn Huy', 'Huy', 'HS12345', 'Trần Thị Lan', 'Lan', 'HS67890']

function dung(dsO: OBang[], tuyChon: Parameters<typeof taoHtmlMayChieu>[1] = { dayHoc: true }) {
  const dom = new JSDOM(taoHtmlMayChieu(dsO, tuyChon), { runScripts: 'dangerously', beforeParse(w) { w.setInterval = (() => 1) as never; w.clearInterval = () => {}; w.HTMLElement.prototype.scrollTo = () => {} } })
  return { dom, doc: dom.window.document }
}

/** Mọi chữ MỘT NGƯỜI NGỒI CUỐI LỚP đọc được: chữ nằm ngoài phần tử `hidden` / script / style + nhãn CSS in bằng attr(data-nhan) + tiêu đề tab. */
function chuNhinThay(dom: JSDOM): string {
  const doc = dom.window.document
  const ra: string[] = [doc.title]
  doc.querySelectorAll('.mc-trang, .mc-cot-lam-bai').forEach((e) => ra.push(e.getAttribute('data-nhan') ?? ''))
  const walker = doc.createTreeWalker(doc.body, dom.window.NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const cha = n.parentElement
    if (!cha || cha.closest('[hidden], script, style, template, noscript')) continue
    // phần tử bị CSS `visibility:hidden` (thẻ tên trước khi sẵn sàng) cũng không thấy
    if (cha.closest('.mc-em') && doc.body.classList.contains('mc-day-hoc') && !doc.body.classList.contains('mc-san-sang')) continue
    ra.push(n.textContent ?? '')
  }
  return ra.join('\n')
}
const nhan = (doc: Document, sel: string) => [...doc.querySelectorAll(sel)].map((e) => e.getAttribute('data-nhan'))

describe('tờ máy chiếu · chế độ dạy học · trước khi hiện thẻ tên', () => {
  it('ĐỢT ĐÔI: không tên gọi / họ tên / số báo danh ở bất kỳ chỗ nhìn thấy nào; nhãn vùng làm bài là "Phần làm bài của học sinh"', () => {
    const { dom, doc } = dung([HUY, LAN])
    expect(doc.querySelectorAll('.mc-dot:not(.mc-dot-don) .mc-trang').length).toBeGreaterThanOrEqual(2)
    const thay = chuNhinThay(dom)
    for (const s of CAC_CHUOI_LO) expect(thay, s).not.toContain(s)
    expect(nhan(doc, '.mc-trang')).toEqual([NHAN_LAM_BAI_KHONG_TEN, NHAN_LAM_BAI_KHONG_TEN])
    expect(NHAN_LAM_BAI_KHONG_TEN).toBe('Phần làm bài của học sinh')
    expect(doc.body.classList.contains('mc-san-sang')).toBe(true)
    dom.window.close()
  })
  it('ĐỢT ĐƠN (câu dài): cả `.mc-trang` lẫn `.mc-cot-lam-bai` không tên', () => {
    const { dom, doc } = dung([HUY_DAI])
    expect(doc.querySelectorAll('.mc-dot-don .mc-cot-lam-bai').length).toBe(1)
    for (const s of CAC_CHUOI_LO) expect(chuNhinThay(dom), s).not.toContain(s)
    expect(nhan(doc, '.mc-dot-don .mc-trang, .mc-dot-don .mc-cot-lam-bai')).toEqual([NHAN_LAM_BAI_KHONG_TEN, NHAN_LAM_BAI_KHONG_TEN])
    dom.window.close()
  })
  it('HTML tĩnh (chưa chạy script): nhãn đã không tên; thẻ tên bị CSS giấu (visibility) tới khi script sẵn sàng — không có khung hình lộ tên', () => {
    for (const ds of [[HUY, LAN], [HUY_DAI]]) {
      const html = taoHtmlMayChieu(ds, { dayHoc: true })
      const dom = new JSDOM(html) // KHÔNG chạy script
      const doc = dom.window.document
      const nhanTinh = [...doc.querySelectorAll('.mc-trang, .mc-cot-lam-bai')].map((e) => e.getAttribute('data-nhan'))
      expect(nhanTinh.length).toBeGreaterThan(0)
      expect(nhanTinh.every((x) => x === NHAN_LAM_BAI_KHONG_TEN)).toBe(true)
      expect(html).toContain('body.mc-day-hoc:not(.mc-san-sang) .mc-em { visibility: hidden; }')
      expect(doc.body.classList.contains('mc-san-sang')).toBe(false)
      for (const s of CAC_CHUOI_LO) expect(chuNhinThay(dom), s).not.toContain(s)
    }
  })
})

describe('tờ máy chiếu · sau khi hiện thẻ tên', () => {
  it('bấm "Hiện học sinh và thần thú" của Huy ⇒ nhãn của Huy có tên Huy, nhãn của Lan vẫn không tên; ẩn lại (sang đợt khác rồi về) ⇒ không tên', () => {
    const { dom, doc } = dung([HUY, LAN, em('Lê Minh Tú', 'HS11111'), em('Phạm Quốc Bảo', 'HS22222')])
    const nut = doc.querySelector<HTMLButtonElement>('.mc-dot:first-child .mc-nua.mc-trai .mc-nut-hien-em')!
    nut.click()
    const dot0 = doc.querySelector('.mc-dot:first-child')!
    expect([...dot0.querySelectorAll('.mc-trang')].map((e) => e.getAttribute('data-nhan'))).toEqual(['Phần làm bài của Huy', NHAN_LAM_BAI_KHONG_TEN])
    expect(chuNhinThay(dom)).toContain('Nguyễn Văn Huy') // thẻ tên đã hiện
    expect(chuNhinThay(dom)).not.toContain('Trần Thị Lan')
    doc.getElementById('mc-sau')!.click()
    doc.getElementById('mc-truoc')!.click() // vào lại đợt 1: thẻ ẩn lại
    expect([...doc.querySelectorAll('.mc-dot:first-child .mc-trang')].map((e) => e.getAttribute('data-nhan'))).toEqual([NHAN_LAM_BAI_KHONG_TEN, NHAN_LAM_BAI_KHONG_TEN])
    for (const s of CAC_CHUOI_LO) expect(chuNhinThay(dom), s).not.toContain(s)
    dom.window.close()
  })
  it('hết giờ làm bài ⇒ hiện cả hai thẻ ⇒ cả hai nhãn có tên đúng em; đợt đơn: cả hai ô nhãn đều đổi', () => {
    let now = 0
    let tick = () => {}
    const dom = new JSDOM(taoHtmlMayChieu([HUY, LAN], { dayHoc: true }), { runScripts: 'dangerously', beforeParse(w) { w.Date.now = () => now; w.setInterval = ((f: () => void) => { tick = f; return 1 }) as never; w.clearInterval = () => {}; w.HTMLElement.prototype.scrollTo = () => {} } })
    const doc = dom.window.document
    now = 61000
    tick()
    expect(nhan(doc, '.mc-dot:first-child .mc-trang')).toEqual(['Phần làm bài của Huy', 'Phần làm bài của Lan'])
    dom.window.close()
    const don = dung([HUY_DAI])
    don.doc.querySelector<HTMLButtonElement>('.mc-dot-don .mc-nut-hien-em')!.click()
    expect(nhan(don.doc, '.mc-dot-don .mc-trang, .mc-dot-don .mc-cot-lam-bai')).toEqual(['Phần làm bài của Huy', 'Phần làm bài của Huy'])
    don.dom.window.close()
  })
  it('lưới an toàn: ô làm bài do bố cục dựng thêm (đã chép nhãn CÓ TÊN) khi thẻ còn ẩn ⇒ tự sửa về không tên; đổi `hidden` bằng đường khác ⇒ nhãn theo', async () => {
    const { dom, doc } = dung([HUY_DAI])
    const dot = doc.querySelector('.mc-dot-don')!
    const cot = doc.createElement('section')
    cot.className = 'mc-cot-lam-bai'
    cot.setAttribute('data-nhan', 'Phần làm bài của Huy')
    dot.appendChild(cot)
    await new Promise((r) => dom.window.setTimeout(r, 0))
    expect(cot.getAttribute('data-nhan')).toBe(NHAN_LAM_BAI_KHONG_TEN)
    ;(doc.querySelector('.mc-dot-don .mc-em') as HTMLElement).hidden = false // đường bất kỳ, không qua nút
    await new Promise((r) => dom.window.setTimeout(r, 0))
    expect(nhan(doc, '.mc-dot-don .mc-trang, .mc-dot-don .mc-cot-lam-bai')).toEqual(['Phần làm bài của Huy', 'Phần làm bài của Huy', 'Phần làm bài của Huy'])
    dom.window.close()
  })
})

describe('tờ máy chiếu · chế độ thường (không dạy học)', () => {
  it('thẻ tên hiện sẵn ⇒ nhãn CÓ tên như trước, không thuộc tính mới, không luật giấu thẻ', () => {
    const html = taoHtmlMayChieu([HUY, LAN], {})
    expect(html).toContain('<div class="mc-trang" aria-hidden="true" data-nhan="Phần làm bài của Huy"></div>')
    expect(html).toContain('<div class="mc-trang" aria-hidden="true" data-nhan="Phần làm bài của Lan"></div>')
    expect(new JSDOM(html).window.document.querySelectorAll('[data-nhan-em]').length).toBe(0) // không phần tử nào mang tên thật ở thuộc tính phụ
    const don = taoHtmlMayChieu([HUY_DAI], {})
    expect(don).toContain('<section class="mc-cot-lam-bai" aria-label="Bảng để học sinh lên làm" data-nhan="Phần làm bài của Huy"></section>')
  })
})
