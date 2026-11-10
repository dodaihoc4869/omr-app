// BÌNH PHẢN ỨNG — TỜ CHIẾU CŨ CUỘN NGAY (thầy 10/11: «Khi bấm L lên bảng màn chiếu cũ hiện cuộn nếu đề dài luôn, ko bấm space nữa nhé»).
// Bảng giao em (`len-bang`, goiNgay:false) ⇒ tờ ở «chờ gọi» nhưng vùng đề CUỘN (lớp mc-cuon), không còn «Trang i/n · Space»; sang đợt khác vẫn cuộn.
// Tờ Gọi lên bảng thường (không có Bình Phản Ứng) giữ luật 28/09: chờ gọi lật trang.
import { describe, it, expect } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { JS_LEN_BANG_BPU } from '../src/lib/len-bang-bpu-to-chieu'

const MA = 'phien1011'
const GOC = 'https://app.test'
const cau = (id: string) =>
  ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài dài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [{ khoa: 'A', ly: 'Vì a.' }], buoc: ['Bước 1.', 'Bước 2.'], ketQua: 'B' }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 36, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 3 })

function moTo(dsO: OBang[]) {
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window
  ;(cha as unknown as { postMessage: () => void }).postMessage = () => {}
  const dom = new JSDOM(taoHtmlMayChieu(dsO, { cauNoi: { maPhien: MA } }), {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      w.setTimeout = ((f: () => void) => { void f; return 0 }) as never
      w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true })
      // BỐ CỤC GIẢ: vùng đề cao 500 px; khối có __y/__h trả đúng hình chữ nhật ấy (đề 300 + 4 phương án × 120 ⇒ 2 trang nếu lật).
      Object.defineProperty(w.HTMLElement.prototype, 'clientHeight', { configurable: true, get(this: HTMLElement) { return this.classList.contains('mc-vung-de') ? 500 : 0 } })
      w.Element.prototype.getBoundingClientRect = function (this: Element & { __y?: number; __h?: number }) {
        const y = this.classList.contains('mc-vung-de') ? 0 : this.__y ?? 0
        const h = this.classList.contains('mc-vung-de') ? 500 : this.__h ?? 0
        return { top: y, bottom: y + h, left: 0, right: 100, width: 100, height: h, x: 0, y, toJSON() {} } as DOMRect
      }
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis & { __mcXepTrang: () => void }
  const doc = dom.window.document
  const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true }))
  const vung = () => doc.querySelector<HTMLElement>('#mc-ray > .mc-dot .mc-vung-de') ?? doc.querySelector<HTMLElement>('.mc-dot .mc-vung-de')!
  const datBoCuc = () => {
    const v = vung()
    const dat = (e: Element | null, y: number, h: number) => { if (e) Object.assign(e, { __y: y, __h: h }) }
    dat(v.querySelector('.mc-de-dau'), 0, 40)
    dat(v.querySelector('.mc-de'), 40, 300)
    v.querySelectorAll('.mc-pa').forEach((p, i) => dat(p, 340 + i * 120, 120))
    w.__mcXepTrang()
    return v
  }
  const giaoEm = () => w.dispatchEvent(new dom.window.MessageEvent('message', { data: { nguon: 'bpu-bang', lenh: 'len-bang', em: { sbd: 'X9', ten: 'Lê Thu Hà', goiNgay: false, mau: 'rgb(229,83,75)', doi: 'Đội Lửa' } }, source: cha as unknown as MessageEventSource }))
  return { doc, w, phim, vung, datBoCuc, giaoEm }
}

describe('Bình Phản Ứng bấm L ⇒ tờ cũ cuộn ngay, không lật trang bằng Space', () => {
  it('tờ thường chờ gọi vẫn lật trang (luật 28/09 giữ nguyên)', () => {
    const t = moTo([o('A', 'An'), o('B', 'Bình')])
    const v = t.datBoCuc()
    expect(t.doc.body.getAttribute('data-pha')).toBe('cho')
    expect(v.getAttribute('data-trang')).toBe('1/2')
    expect(v.classList.contains('mc-cuon')).toBe(false)
  })

  it('bảng giao em (chờ gọi) ⇒ vùng đề mc-cuon, hết «Trang i/n», không khối nào bị ẩn; Space không lật trang', () => {
    const t = moTo([o('A', 'An'), o('B', 'Bình')])
    t.datBoCuc()
    t.giaoEm()
    const v = t.vung()
    expect(t.doc.body.getAttribute('data-pha')).toBe('cho') // vẫn chờ thầy bấm L mời em
    expect(t.doc.querySelector<HTMLElement>('.mc-dot .mc-em[id]')!.hidden).toBe(false) // thẻ tên hiện, nằm ngoài vùng cuộn
    expect(v.querySelector(':scope > .bpu-lua-doi')).toBeTruthy() // lửa đội trong vùng đề
    expect(v.classList.contains('mc-cuon')).toBe(true)
    expect(v.hasAttribute('data-trang')).toBe(false)
    expect(v.querySelector('.mc-trang-so.mc-hien')).toBeNull()
    expect(v.querySelector('.mc-che.mc-hien')).toBeNull()
    expect([...v.querySelectorAll('.mc-ngoai')]).toHaveLength(0)
    t.phim(' ')
    expect(v.classList.contains('mc-cuon')).toBe(true)
    expect(v.hasAttribute('data-trang')).toBe(false)
  })

  it('sang đợt khác (→) vẫn cuộn; L mời em vẫn chạy như cũ', () => {
    const t = moTo([o('A', 'An'), o('B', 'Bình')])
    t.datBoCuc()
    t.giaoEm()
    t.phim('ArrowRight')
    const v = t.datBoCuc()
    expect(v.classList.contains('mc-cuon')).toBe(true)
    expect(v.hasAttribute('data-trang')).toBe(false)
    t.phim('ArrowLeft')
    t.phim('l')
    expect(['goi', 'chua']).toContain(t.doc.body.getAttribute('data-pha'))
    expect(t.vung().classList.contains('mc-cuon')).toBe(true)
  })

  it('đề dài có lửa: chừa lề trái, lửa dính góc trên khi cuộn; chấm xong bỏ lề', () => {
    expect(JS_LEN_BANG_BPU).toContain("body.mc-bc .mc-vung-de.bpu-ranh-lua{padding-left:280px}.mc-vung-de.bpu-ranh-lua>.bpu-lua-doi{position:sticky;top:0")
    expect(JS_LEN_BANG_BPU).toMatch(/function xoaLua\(\)[^\n]*bpu-ranh-lua/)
    expect(JS_LEN_BANG_BPU).toContain('S.bpuCuon = true;')
  })
})
