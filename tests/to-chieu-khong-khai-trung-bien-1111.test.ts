// TỜ CHIẾU: các đoạn mã chèn (bút, live, Bi-a) chạy CHUNG một hàm với mã tờ ⇒ không đoạn nào được khai lại tên biến của đoạn khác.
// 11/11: `JS_BUT_BANG` khai `var ray` (thanh cuộn bảng đen) đè lên `ray` của tờ (đường ray chứa các đợt `#mc-ray`) ⇒ trên bản sống lưới
// «Tổng quan» (Tab) không còn thẻ đợt, bấm thẻ tên không mở bảng chi tiết, bấm hình trong đề không phóng — không lỗi JavaScript nào
// (chỉ là trỏ nhầm phần tử). Khoá: (1) cả tờ thật không tên nào khai hai lần trong cùng một hàm ngoài cùng; (2) bút không khai tên dùng chung
// của tờ; (3) tờ thật chạy trong JSDOM: Tab ⇒ lưới đủ thẻ đợt.
import { describe, it, expect } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { parse } from 'acorn'
import { JS_BUT_BANG } from '../src/lib/but-bang-to-chieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [], buoc: [] }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 3, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 1 } as OBang)
const HTML = taoHtmlMayChieu([o('A', 'An'), o('B', 'Bình'), o('C', 'Chi'), o('D', 'Dũng'), o('E', 'Giang')])
const maTrongTo = (html: string) => [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).filter((s) => s.trim())

type Nut = { type: string; start: number; [k: string]: unknown }
/** Mọi tên khai bằng `var` / `function` thuộc phạm vi của MỘT hàm (kể cả `var` trong khối if / for / try — vẫn nổi lên hàm), không đi vào hàm con. */
function tenKhai(than: unknown): { ten: string; vt: number }[] {
  const ra: { ten: string; vt: number }[] = []
  const di = (n: unknown) => {
    if (!n || typeof n !== 'object') return
    if (Array.isArray(n)) { n.forEach(di); return }
    const x = n as Nut
    if (typeof x.type !== 'string') return
    if (x.type === 'FunctionDeclaration') { ra.push({ ten: (x.id as { name: string }).name, vt: x.start }); return }
    if (x.type === 'FunctionExpression' || x.type === 'ArrowFunctionExpression') return
    if (x.type === 'VariableDeclaration') for (const d of x.declarations as { id: { name: string }; start: number }[]) ra.push({ ten: d.id.name, vt: d.start })
    for (const k of Object.keys(x)) if (k !== 'type') di(x[k])
  }
  di(than)
  return ra
}
/** Tên khai từ hai lần trở lên trong thân mỗi hàm bọc ngoài cùng `(function () { … })()` của một đoạn mã. */
function tenTrung(ma: string): string[] {
  const cay = parse(ma, { ecmaVersion: 2020 }) as unknown as { body: { expression?: { callee?: { type: string; body: { body: unknown[] } } } }[] }
  const ra: string[] = []
  let soHam = 0
  for (const b of cay.body) {
    const ham = b.expression?.callee
    if (!ham || ham.type !== 'FunctionExpression') continue
    soHam++
    const dem = new Map<string, number>()
    for (const k of tenKhai(ham.body.body)) dem.set(k.ten, (dem.get(k.ten) ?? 0) + 1)
    for (const [ten, n] of dem) if (n > 1) ra.push(ten)
  }
  expect(soHam, 'mỗi đoạn mã của tờ phải bọc trong một hàm').toBeGreaterThan(0)
  return ra
}

describe('tờ chiếu: các đoạn mã chèn không khai đè biến của nhau', () => {
  const ma = maTrongTo(HTML)
  const maChinh = ma.find((s) => s.includes(JS_BUT_BANG))!

  it('tờ thật có đoạn mã chính chứa nguyên chuỗi bút (phép kiểm bên dưới soi đúng chỗ)', () => {
    expect(ma.length).toBeGreaterThan(0)
    expect(maChinh, 'không thấy JS_BUT_BANG trong tờ').toBeTruthy()
    expect(maChinh).toContain("ray = document.getElementById('mc-ray')")
  })
  it('không tên nào khai hai lần trong cùng một hàm ngoài cùng — soi mọi đoạn mã của tờ (tờ, bút, live, Bi-a)', () => {
    for (const s of ma) expect(tenTrung(s), 'tên khai trùng (đoạn chèn sau gán đè biến của đoạn trước)').toEqual([])
  })
  it('máy dò bắt được đúng lỗi 11/11: đặt lại `var ray` trong mã bút ⇒ báo tên «ray»', () => {
    expect(maChinh).toContain("butRay = tao('div', 'mc-but-ray', body)")
    expect(tenTrung(maChinh.replace(/\bbutRay\b/g, 'ray'))).toEqual(['ray'])
  })
  it('chuỗi bút không khai tên dùng chung của tờ (ray, body, thanh, nhom, S, luoi, phim, phong …) ở phạm vi của hàm chung', () => {
    const cay = parse(JS_BUT_BANG, { ecmaVersion: 2020, allowReturnOutsideFunction: true }) as unknown as { body: unknown[] }
    const cuaBut = new Set(tenKhai(cay.body).map((k) => k.ten))
    expect(cuaBut.has('butRay')).toBe(true)
    const dungChung = ['ray', 'body', 'thanh', 'nhom', 'S', 'CHAM', 'HOP', 'bao', 'luoi', 'phim', 'phong', 'ct', 'ctMo', 'sai', 'saiMo', 'dot', 'soDot', 'chiSo', 'pha', 'u', 'tao', 'thoat', 'oCham', 'baoNhanh', 'lenh']
    expect(dungChung.filter((t) => cuaBut.has(t))).toEqual([])
    // mọi tên còn lại của tờ (ngoài chuỗi bút) cũng không được trùng
    const dau = maChinh.indexOf(JS_BUT_BANG), cuoi = dau + JS_BUT_BANG.length
    const cayTo = parse(maChinh, { ecmaVersion: 2020 }) as unknown as { body: { expression: { callee: { body: { body: unknown[] } } } }[] }
    const cuaTo = tenKhai(cayTo.body[0].expression.callee.body.body).filter((k) => k.vt < dau || k.vt >= cuoi).map((k) => k.ten)
    expect(cuaTo).toContain('ray')
    expect(cuaTo.filter((t) => cuaBut.has(t))).toEqual([])
  })
})

describe('tờ thật trong JSDOM: đường ray của tờ vẫn là #mc-ray sau khi mã bút chạy', () => {
  function moTo() {
    const dom = new JSDOM(HTML, {
      runScripts: 'dangerously', virtualConsole: new VirtualConsole(),
      beforeParse(w) {
        w.setTimeout = (() => 0) as never; w.setInterval = (() => 0) as never
        w.HTMLElement.prototype.scrollTo = () => {}
        ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true })
      },
    })
    const doc = dom.window.document
    const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
    return { dom, doc, phim }
  }
  it('Tab ⇒ lưới «Tổng quan» có ĐỦ thẻ đợt (mỗi đợt của #mc-ray một thẻ), thẻ đầu «Đang chiếu»; Tab lần nữa đóng', () => {
    const t = moTo()
    const soDot = t.doc.querySelectorAll('#mc-ray > .mc-dot').length
    expect(soDot).toBeGreaterThanOrEqual(2)
    t.phim('Tab')
    const luoi = t.doc.querySelector('.mc-luoi')!
    expect(luoi.classList.contains('mc-mo')).toBe(true)
    const the = [...luoi.querySelectorAll('.mc-the-dot')]
    expect(the).toHaveLength(soDot)
    expect(the.map((b) => b.querySelector('b')!.textContent)).toEqual(the.map((_, i) => `Đợt ${i + 1}`))
    expect(the[0].classList.contains('mc-dang')).toBe(true)
    t.phim('Tab')
    expect(luoi.classList.contains('mc-mo')).toBe(false)
  })
  it('thanh cuộn bảng đen của bút là phần tử RIÊNG (.mc-but-ray), không nằm trong và không thay #mc-ray', () => {
    const t = moTo()
    const rayBut = t.doc.querySelector('.mc-but-ray')!, rayTo = t.doc.getElementById('mc-ray')!
    expect(rayBut).not.toBeNull()
    expect(rayBut).not.toBe(rayTo)
    expect(rayTo.contains(rayBut)).toBe(false)
    expect(rayBut.querySelector('i')).not.toBeNull()
  })
})
