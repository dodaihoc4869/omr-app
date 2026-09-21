// @vitest-environment node
// "EM ĐÃ LÀM CÂU NÀY CHƯA" trên tờ máy chiếu (thầy lệnh 21/09 16:4x): nhãn nằm TRONG thẻ tên ⇒ ẩn khi thẻ ẩn, hiện cùng thẻ; không dữ liệu ⇒ không in gì.
import { describe, expect, it } from 'vitest'
import { JSDOM } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { nhanLichSuCau, type LichSuCauEm, type NhanLichSuCau } from '../src/lib/lich-su-cau-len-bang'

const em = (hoTen: string, sbd: string, lichSuCau?: NhanLichSuCau | null): OBang => ({ sbd, hoTen, soCau: 1, sao: 0, cau: { phan: 'I', id: `q-${sbd}`, text: 'Câu ngắn', luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [] } as OBang['cau'], ...(lichSuCau ? { lichSuCau } : {}) })
const ls = (o: Partial<LichSuCauEm>): NhanLichSuCau => nhanLichSuCau({ sbd: 'S', qid: 'K-I-1', daLam: true, soLan: 1, soDung: 1, soSai: 0, lanCuoi: { dung: true, ngay: '2026-09-19', nguon: 'on_lai' }, lenBang: null, ...o })!

function dung(dsO: OBang[]) {
  const dom = new JSDOM(taoHtmlMayChieu(dsO, { dayHoc: true }), { runScripts: 'dangerously', beforeParse(w) { w.setInterval = (() => 1) as never; w.clearInterval = () => {}; w.HTMLElement.prototype.scrollTo = () => {} } })
  return { dom, doc: dom.window.document }
}
const chuMoi = (doc: Document) => [...doc.querySelectorAll('.mc-dot:first-child .mc-nua')].map((n) => n.querySelector('.mc-em .mc-ls')?.textContent ?? null)

describe('nhãn "đã làm câu này chưa" trong thẻ tên', () => {
  const CHUA = ls({ daLam: false, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null })
  const DUNG = ls({})
  const SAI = ls({ soDung: 0, soSai: 1, lanCuoi: { dung: false, ngay: '2026-09-19', nguon: 'thi' }, lenBang: { soLan: 1, datLanCuoi: true } })
  const KET_QUA = ls({ soDung: 0, soSai: 0, lanCuoi: { dung: null, ngay: '2026-09-21', nguon: 'btvn' } })

  it('bốn nhãn nằm TRONG `.mc-em` của đúng em, đúng lớp màu; dòng phụ + dòng lên bảng đi cùng', () => {
    const { dom, doc } = dung([em('Nguyễn Văn Huy', 'HS1', DUNG), em('Trần Thị Lan', 'HS2', SAI), em('Lê Minh Tú', 'HS3', CHUA), em('Phạm Quốc Bảo', 'HS4', KET_QUA)])
    const the = [...doc.querySelectorAll('.mc-nua .mc-em')]
    expect(the.map((t) => t.querySelector('.mc-ls')?.className)).toEqual(['mc-ls mc-ls-dung', 'mc-ls mc-ls-sai', 'mc-ls mc-ls-chua_lam', 'mc-ls mc-ls-chua_ket_qua'])
    expect(the[0]!.querySelector('.mc-ls-chu')!.textContent).toBe('Đã làm · lần gần nhất đúng')
    expect(the[1]!.querySelector('.mc-ls')!.textContent).toBe('Đã làm · lần gần nhất saiĐã lên bảng câu này 1 lần · đạt')
    expect(the[2]!.querySelector('.mc-ls-chu')!.textContent).toBe('Chưa làm câu này')
    expect(the[3]!.querySelector('.mc-ls-chu')!.textContent).toBe('Đã làm · chưa có kết quả')
    dom.window.close()
  })
  it('TRƯỚC khi hiện thẻ tên: nhãn không nhìn thấy (nằm trong thẻ đang ẩn); bấm hiện ⇒ thấy nhãn của ĐÚNG em đó, em kia vẫn ẩn', () => {
    const { dom, doc } = dung([em('Nguyễn Văn Huy', 'HS1', DUNG), em('Trần Thị Lan', 'HS2', SAI)])
    const nhinThay = () => [...doc.querySelectorAll('.mc-nua .mc-ls')].filter((e) => !e.closest('[hidden]')).map((e) => e.querySelector('.mc-ls-chu')!.textContent)
    expect(nhinThay()).toEqual([])
    doc.querySelector<HTMLButtonElement>('.mc-dot:first-child .mc-nua.mc-trai .mc-nut-hien-em')!.click()
    expect(nhinThay()).toEqual(['Đã làm · lần gần nhất đúng'])
    dom.window.close()
  })
  it('không có dữ liệu ⇒ KHÔNG in nhãn nào (không bịa "chưa làm"); chữ được thoát HTML', () => {
    const { dom, doc } = dung([em('Nguyễn Văn Huy', 'HS1'), em('Trần Thị Lan', 'HS2', { kieu: 'sai', chu: '<b>x</b> & y' })])
    expect(chuMoi(doc)).toEqual([null, '<b>x</b> & y'])
    expect(doc.querySelectorAll('.mc-ls b').length).toBe(0)
    dom.window.close()
  })
  it('CSS: hàng thứ ba của thẻ tên, đúng = xanh lá, sai = cam (không đỏ), còn lại xám; tờ có mặt luật ẩn theo thẻ', () => {
    const html = taoHtmlMayChieu([em('Nguyễn Văn Huy', 'HS1', DUNG)], { dayHoc: true })
    expect(html).toContain('body.mc .mc-em .mc-ls{grid-column:2 / -1;grid-row:3;')
    expect(html).toContain('body.mc .mc-em .mc-ls-dung .mc-ls-chu{background:var(--mc-lam-nen);color:var(--mc-lam-chu)}')
    expect(html).toContain('body.mc .mc-em .mc-ls-sai .mc-ls-chu{background:var(--mc-qua-nen);color:var(--mc-qua-chu)}')
    expect(html).not.toMatch(/mc-ls[^{]*\{[^}]*(#f00|red|rgb\(2[0-5]\d,\s*0,\s*0\))/i)
  })
})
