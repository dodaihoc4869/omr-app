// THANH ĐÁY GỌN CỦA MÀN CHIẾU — thầy 11/11 (kèm ảnh màn chiếu lúc CHƯA live): «Phần nút ở dưới chưa gọn, làm cho gọn lại tinh tế đẹp».
// Mã: src/lib/thanh-day-to-chieu.ts (chèn vào tờ qua len-bang-moi-to-chieu.ts). Bản vẽ thật: docs/ban-ve-live-1011/that-3-thanh-*.jpg.
//   A · TỜ THẬT chạy trong JSDOM: trên thanh chỉ còn nút theo ngữ cảnh; khay của nút «thêm» có ĐỦ mọi nút cũ kèm NHÃN CHỮ + phím tắt, xếp ba nhóm;
//       chọn xong / Esc / chạm ra ngoài ⇒ khay thu; phím tắt chạy y như cũ khi khay đóng; nút đang bật ⇒ chấm trên nút «thêm».
//   B · ĐOẠN MÃ chạy riêng trong DOM giả (đồng hồ giả): 8 giây không chạm ⇒ thu; MỘT cơ chế cho chưa live lẫn đang live; thanh chật ⇒ gọn dần, không tràn.
//   C · CSS: chuyển động ≤ 160 ms chỉ opacity / transform, giảm chuyển động, ô chạm ≥ 40 px, chỉ biến màu của tờ.
//   D · KHÔNG TRÀN đo bằng Chromium thật (scripts/thu-live-1011/thu-thanh-day-1111.mjs) ở 1180 / 1280 / 1366 / 1920: tệp số đo phải xanh hết.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang, type TuyChonMayChieu } from '../src/lib/html-may-chieu'
import { CSS_GIAO_DIEN_TO_CHIEU } from '../src/lib/giao-dien-to-chieu'
import { CSS_LEN_BANG_MOI } from '../src/lib/len-bang-moi-to-chieu'
import { CSS_LIVE_TO_CHIEU, JS_LIVE_TO_CHIEU } from '../src/lib/live-to-chieu'
import { CSS_THANH_DAY, JS_THANH_DAY } from '../src/lib/thanh-day-to-chieu'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'

const MA = 'phien1111'
const GOC = 'https://app.test'
const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [{ khoa: 'A', ly: 'Vì a.' }, { khoa: 'B', ly: 'Vì b.' }], buoc: ['Bước 1.', 'Bước 2.'], ketQua: 'B' }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 36, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 3 })
const cho = () => new Promise((r) => setTimeout(r, 0)) // MutationObserver của tờ chạy ở vi tác vụ

/** Tờ chiếu THẬT trong JSDOM (cùng cách dựng với tests/len-bang-moi-2809.test.ts). */
function moTo(tuy: TuyChonMayChieu & { noi?: boolean } = {}) {
  const { noi, ...tuyChon } = tuy
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window
  ;(cha as unknown as { postMessage: () => void }).postMessage = () => {}
  const html = taoHtmlMayChieu([o('A', 'Nguyễn Minh Anh'), o('B', 'Trần Gia Bảo')], noi ? { ...tuyChon, cauNoi: { maPhien: MA } } : tuyChon)
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      if (noi) Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      w.setTimeout = (() => 0) as never
      w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true })
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis & { __mcTrangThai: () => { lgMo: boolean; pha: string }; __mcKhay: { dangMo: () => boolean } }
  const doc = dom.window.document
  const phim = (key: string, them: KeyboardEventInit = {}) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...them }))
  const tuCha = (data: Record<string, unknown>) => w.dispatchEvent(new dom.window.MessageEvent('message', { data: { maPhien: MA, ...data }, origin: GOC, source: cha as unknown as MessageEventSource }))
  const chamNgoai = (dich: Element) => dich.dispatchEvent(new dom.window.Event(w.PointerEvent ? 'pointerdown' : 'mousedown', { bubbles: true }))
  const $ = <T extends HTMLElement = HTMLElement>(s: string) => doc.querySelector<T>(s)!
  /** Các dòng đang có của khay, theo nhóm: [tên nhóm, [nhãn, phím][]]. */
  const khay = () => [...doc.querySelectorAll<HTMLElement>('#mc-khay > .mc-khay-nhom')].filter((g) => !g.hidden).map((g) => [
    g.querySelector('.mc-khay-ten')!.textContent,
    [...g.querySelectorAll<HTMLElement>('button')].filter((b) => !b.hidden).map((b) => [(b.querySelector('.mc-nut-chu') ?? b).textContent, b.querySelector('kbd')?.textContent ?? '']),
  ])
  return { html, dom, doc, w, phim, tuCha, chamNgoai, $, khay, them: () => $('#mc-them'), mo: () => doc.body.classList.contains('mc-khay-mo') }
}

describe('A · tờ thật: thanh chỉ còn nút theo ngữ cảnh, nút phụ vào khay của nút «thêm»', () => {
  it('KHÔNG MẤT NÚT NÀO: mọi nút của thanh cũ vẫn còn đúng một bản — C / D / K ở lại trên thanh, phần còn lại + «Cài đặt» vào khay; «Lên bảng» giữ chỗ', () => {
    const t = moTo({ noi: true })
    // danh sách nút của thanh GỐC (chuỗi HTML trước khi script chạy)
    const goc = new JSDOM(t.html).window.document
    const cu = [...goc.querySelectorAll('#mc-thanh button')].map((b) => b.getAttribute('data-k') ?? b.id).sort()
    const moi = [...t.doc.querySelectorAll('#mc-thanh button')].map((b) => b.getAttribute('data-k') ?? b.id).filter((k) => k !== 'mc-them' && !/^$/.test(k)).sort()
    expect(cu).toEqual(['?', 'B', 'C', 'D', 'G', 'K', 'P', 'T', 'Tab', 'X', 'mc-cai-btn', 'mc-len-bang', 'mc-sau', 'mc-truoc'])
    expect(moi.filter((k) => cu.includes(k))).toEqual(cu)
    // trên thanh: chỉ nút theo ngữ cảnh là con trực tiếp của nhóm phím (đúng lúc mới hiện); «Cài đặt» không còn nằm rời
    expect([...t.doc.querySelectorAll('#mc-phim-nhom > button')].map((b) => b.getAttribute('data-k'))).toEqual(['C', 'D', 'K'])
    expect([...t.$('#mc-thanh').children].map((e) => e.id || e.className)).toEqual(['mc-lv-nut', 'mc-lv-cum', 'mc-buoc', 'mc-pha', 'mc-len-bang', 'mc-phim-nhom', 'mc-tiep', 'mc-them'])
    expect(t.$('#mc-khay').parentElement!.id).toBe('mc-phim-nhom') // khay nằm TRONG nhóm phím ⇒ bộ nghe bấm + veThanh của nhóm vẫn tới
  })

  it('khay: ba nhóm có tên, mỗi nút có NHÃN CHỮ + phím tắt (không còn chữ cái trơ trọi «T», «B», «Tab»); «Ai sai» chỉ có khi tờ nối app và đã có số', async () => {
    const t = moTo({ noi: true })
    expect(t.khay()).toEqual([
      ['Câu này', [['Giải', 'G'], ['Thống kê', 'T']]],
      ['Lớp và bảng', [['Bình Phản Ứng', 'P'], ['Bút', 'B']]],
      ['Màn chiếu', [['Tổng quan', 'Tab'], ['Phím tắt', '?'], ['Cài đặt', '']]],
    ])
    // «Ai sai» đứng sau «Giải» trong nhóm «Câu này»; tờ chưa nối ⇒ veThanh ẩn nó (luật cũ, không đổi)
    const x = t.$('#mc-khay [data-k="X"]')
    expect(x.hidden).toBe(true)
    expect([x.previousElementSibling!.getAttribute('data-k'), x.nextElementSibling!.getAttribute('data-k')]).toEqual(['G', 'T'])
    expect(x.querySelector('.mc-nut-chu')!.textContent).toBe('Ai sai')
    // CSS: nhãn trong khay luôn hiện (đè các luật cũ từng ẩn nhãn ở màn hẹp / lúc live), nút ẩn thì ẩn hẳn
    expect(CSS_THANH_DAY).toContain('body.mc .mc-phim-nhom .mc-khay .mc-nut-phim .mc-nut-chu{display:inline!important')
    expect(CSS_THANH_DAY).toContain('body.mc .mc-phim-nhom .mc-khay .mc-nut-phim[hidden]{display:none}')
    // tờ không cầu nối ⇒ không có nút «Ai sai» (luật cũ): nhóm «Câu này» còn Giải + Thống kê
    const k = moTo().khay()
    expect(k[0]).toEqual(['Câu này', [['Giải', 'G'], ['Thống kê', 'T']]])
    expect(moTo().doc.querySelector('[data-k="X"]')).toBeNull()
  })

  it('nút «thêm»: cuối thanh, dáng nút lưới của bản K5, có aria-label / aria-expanded / aria-controls; bấm ⇒ xoè, bấm lần nữa ⇒ thu', () => {
    const t = moTo(), nut = t.them()
    expect(nut.tagName).toBe('BUTTON')
    expect(nut.className).toBe('mc-lv-gon mc-td-them')
    expect(nut.getAttribute('aria-label')).toBe('Thêm nút điều khiển')
    expect(nut.getAttribute('aria-controls')).toBe('mc-khay')
    expect(nut.getAttribute('aria-expanded')).toBe('false')
    expect(t.$('#mc-khay').getAttribute('role')).toBe('group')
    nut.click()
    expect(t.mo()).toBe(true)
    expect(nut.getAttribute('aria-expanded')).toBe('true')
    nut.click()
    expect(t.mo()).toBe(false)
    expect(nut.getAttribute('aria-expanded')).toBe('false')
  })

  it('chọn trong khay ⇒ lệnh chạy đúng như bấm nút cũ, khay TỰ THU; nút đang bật ⇒ chấm trên nút «thêm» + aria-label kể tên', async () => {
    const t = moTo(), nut = t.them()
    nut.click()
    t.$('#mc-khay [data-k="G"]').click()
    expect(t.w.__mcTrangThai().lgMo).toBe(true)
    expect(t.mo()).toBe(false)
    await cho()
    expect(nut.getAttribute('data-bat')).toBe('1')
    expect(nut.getAttribute('aria-label')).toBe('Thêm nút điều khiển, đang bật: Lời giải')
    expect(t.$('#mc-khay [data-k="G"]').classList.contains('mc-bat')).toBe(true)
    expect(t.$('#mc-khay [data-k="G"] .mc-nut-chu').textContent).toBe('Ẩn giải') // veThanh vẫn tới nút đã chuyển vào khay
    nut.click()
    t.$('#mc-khay [data-k="T"]').click()
    expect(t.doc.body.classList.contains('mc-co-tk')).toBe(true)
    await cho()
    expect(nut.getAttribute('data-bat')).toBe('2')
    expect(nut.getAttribute('aria-label')).toBe('Thêm nút điều khiển, đang bật: Lời giải, Thống kê')
    // «Cài đặt» trong khay vẫn mở đúng hộp cài đặt cũ, khay thu
    nut.click()
    t.$('#mc-khay #mc-cai-btn').click()
    expect(t.$('#mc-cai-dat').hidden).toBe(false)
    expect(t.mo()).toBe(false)
    expect(CSS_THANH_DAY).toContain('.mc-td-them[data-bat]::after{display:block}')
  })

  it('PHÍM TẮT GIỮ NGUYÊN khi khay đóng: G, T, B, Tab, ?, L chạy đúng lệnh cũ; chấm trên nút «thêm» theo phím', async () => {
    const t = moTo({ noi: true }), nut = t.them()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
    expect(t.mo()).toBe(false)
    t.phim('g')
    expect(t.w.__mcTrangThai().lgMo).toBe(true)
    t.phim('g')
    expect(t.w.__mcTrangThai().lgMo).toBe(false)
    t.phim('t')
    expect(t.doc.body.classList.contains('mc-co-tk')).toBe(true)
    await cho()
    expect(nut.getAttribute('aria-label')).toBe('Thêm nút điều khiển, đang bật: Thống kê')
    t.phim('t')
    await cho()
    expect(nut.hasAttribute('data-bat')).toBe(false)
    t.phim('b')
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(true)
    await cho()
    expect(nut.getAttribute('data-bat')).toBe('1')
    expect(nut.getAttribute('aria-label')).toBe('Thêm nút điều khiển, đang bật: Bút')
    t.phim('b')
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(false)
    t.phim('Tab')
    expect(t.$('.mc-luoi').classList.contains('mc-mo')).toBe(true)
    t.phim('Tab')
    expect(t.$('.mc-luoi').classList.contains('mc-mo')).toBe(false)
    t.phim('?')
    expect(t.$('.mc-phim').classList.contains('mc-mo')).toBe(true)
    t.phim('Escape')
    expect(t.$('.mc-phim').classList.contains('mc-mo')).toBe(false)
    // L gọi em ⇒ đang chữa: «Đạt» / «Không đạt» hiện NGAY TRÊN THANH (nút theo ngữ cảnh, không nằm trong khay)
    expect(t.$('#mc-phim-nhom > [data-k="D"]').hidden).toBe(true)
    t.phim('l')
    expect(t.w.__mcTrangThai().pha).toBe('chua')
    expect(t.$('#mc-phim-nhom > [data-k="D"]').hidden).toBe(false)
    expect(t.$('#mc-phim-nhom > [data-k="K"]').hidden).toBe(false)
    expect(t.mo()).toBe(false) // không phím tắt nào tự mở khay
  })

  it('khay đang mở: Esc CHỈ thu khay (không lọt xuống lệnh khác), Tab / Shift+Tab đi vòng trong khay chứ không mở «Tổng quan», chạm ra ngoài ⇒ thu, chạm trong khay ⇒ giữ', () => {
    const t = moTo(), nut = t.them()
    let lot = 0
    t.doc.addEventListener('keydown', () => { lot++ })
    nut.click() // bấm bằng bàn phím (click không có số lần bấm) ⇒ tiêu điểm vào nút đầu của khay
    const ds = [...t.doc.querySelectorAll<HTMLElement>('#mc-khay button')].filter((b) => !b.hidden)
    expect(ds.map((b) => b.getAttribute('data-k') ?? b.id)).toEqual(['G', 'T', 'P', 'B', 'Tab', '?', 'mc-cai-btn'])
    expect(t.doc.activeElement).toBe(ds[0])
    t.phim('Tab')
    expect(t.doc.activeElement).toBe(ds[1])
    t.phim('Tab', { shiftKey: true }); t.phim('Tab', { shiftKey: true })
    expect(t.doc.activeElement).toBe(ds[ds.length - 1]) // lùi quá nút đầu ⇒ vòng về nút cuối
    t.phim('Tab')
    expect(t.doc.activeElement).toBe(ds[0])
    expect(t.$('.mc-luoi').classList.contains('mc-mo')).toBe(false)
    expect(t.mo()).toBe(true)
    t.phim('Escape')
    expect(t.mo()).toBe(false)
    expect(t.doc.activeElement).toBe(nut) // trả tiêu điểm về nút «thêm»
    expect(lot).toBe(0) // Tab / Esc lúc khay mở không tới bộ nghe phím tắt của tờ
    t.phim('Tab') // khay đóng ⇒ Tab lại là phím tắt «Tổng quan»
    expect(lot).toBe(1)
    expect(t.$('.mc-luoi').classList.contains('mc-mo')).toBe(true)
    t.phim('Tab')
    nut.click()
    t.chamNgoai(t.$('#mc-khay .mc-khay-ten'))
    expect(t.mo()).toBe(true)
    t.chamNgoai(t.$('#mc-ray'))
    expect(t.mo()).toBe(false)
    nut.click()
    t.chamNgoai(t.$('#mc-len-bang')) // chạm nút khác trên thanh cũng là «ra ngoài khay»
    expect(t.mo()).toBe(false)
  })

  it('tờ Chữa bài: «Gọi lên bảng» (nút chính của tờ này) ở lại trên thanh; «Thu gọn tên» vào nhóm «Lớp và bảng» kèm phím H', () => {
    const t = moTo({ chuaBai: true })
    expect(t.$('#mc-goi-nut').parentElement!.id).toBe('mc-phim-nhom')
    expect(t.khay()[1]).toEqual(['Lớp và bảng', [['Bình Phản Ứng', 'P'], ['Bút', 'B'], ['Thu gọn tên', 'H']]])
  })
})

// ── B · đoạn mã chạy riêng (DOM giả + đồng hồ giả) ──
const THANH = '<div class="mc-thanh" id="mc-thanh"><div class="mc-buoc"></div><span class="mc-pha" id="mc-pha"></span><button id="mc-len-bang">Lên bảng</button><div class="mc-phim-nhom" id="mc-phim-nhom">'
  + '<button class="mc-nut-phim" data-k="C" hidden><kbd>C</kbd><span class="mc-nut-chu">Thầy chữa</span></button><button class="mc-nut-phim" data-k="D" hidden><kbd>D</kbd><span class="mc-nut-chu">Đạt</span></button>'
  + '<button class="mc-nut-phim" data-k="G"><kbd>G</kbd><span class="mc-nut-chu">Giải</span></button><button class="mc-nut-phim" data-k="B"><kbd>B</kbd><span class="mc-nut-chu">Bút</span></button>'
  + '<button class="mc-nut-phim" data-k="?"><kbd>?</kbd><span class="mc-nut-chu">Phím</span></button></div><div id="mc-tiep"></div><button id="mc-cai-btn">Cài đặt</button></div>'
const daGan: [EventTarget, string, EventListener, (boolean | AddEventListenerOptions)?][] = []
function dungRieng(coLive = false) {
  document.body.innerHTML = THANH
  const body = document.body, thanh = document.getElementById('mc-thanh')!, nhom = document.getElementById('mc-phim-nhom')!
  const tao = (the: string, lop: string, cha: HTMLElement) => { const e = document.createElement(the); e.className = lop; cha.appendChild(e); return e }
  vi.spyOn(window, 'postMessage').mockImplementation((() => {}) as never)
  for (const dich of [document, window] as EventTarget[]) {
    const goc = dich.addEventListener.bind(dich)
    vi.spyOn(dich, 'addEventListener').mockImplementation(((loai: string, f: EventListener, tuy?: boolean | AddEventListenerOptions) => { daGan.push([dich, loai, f, tuy]); goc(loai, f, tuy) }) as never)
  }
  new Function('body', 'tao', 'thanh', 'nhom', 'dichApp', 'baoNhanh', 'dot', (coLive ? JS_LIVE_TO_CHIEU : '') + JS_THANH_DAY)(body, tao, thanh, nhom, () => window, () => {}, () => null)
  vi.mocked(document.addEventListener).mockRestore(); vi.mocked(window.addEventListener).mockRestore()
  const bom = (tt: Record<string, unknown> | null) => { window.dispatchEvent(new MessageEvent('message', { data: { nguon: 'bpu-bang', lenh: 'live-tt', tt }, source: window })) }
  return { body, thanh, nhom, bom, nut: document.getElementById('mc-them')!, khay: document.getElementById('mc-khay')! }
}
afterEach(() => { for (const [dich, loai, f, tuy] of daGan.splice(0)) dich.removeEventListener(loai, f, tuy); vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = ''; document.body.className = ''; delete (window as unknown as { __mcKhay?: unknown }).__mcKhay })

describe('B · đoạn mã chạy riêng', () => {
  it('8 giây không chạm ⇒ khay tự thu; còn chạm trong khay thì tính lại từ đầu', () => {
    vi.useFakeTimers()
    const t = dungRieng()
    t.nut.click()
    expect(t.body.classList.contains('mc-khay-mo')).toBe(true)
    vi.advanceTimersByTime(7000)
    t.khay.dispatchEvent(new Event(window.PointerEvent ? 'pointerdown' : 'mousedown', { bubbles: true }))
    vi.advanceTimersByTime(7000)
    expect(t.body.classList.contains('mc-khay-mo')).toBe(true)
    vi.advanceTimersByTime(1500)
    expect(t.body.classList.contains('mc-khay-mo')).toBe(false)
    expect(t.nut.getAttribute('aria-expanded')).toBe('false')
  })

  it('MỘT cơ chế, một hình dáng cho mọi trạng thái: chưa live và đang live cùng MỘT nút «thêm» ở cuối thanh, cùng khay; «Lên bảng» không bị ẩn lúc live', () => {
    const t = dungRieng(true)
    const NEN = { co: true, pha: 'live', tu: Date.now() - 65_000, xem: 28, tong: 30, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: false, noi: [], ngheEm: false, chuaGui: 0, the: null, roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: false }
    const hinh = () => ({ dau: [...t.thanh.children].slice(0, 2).map((e) => e.className), cuoi: t.thanh.lastElementChild!.id, luoi: t.thanh.querySelectorAll('.mc-lv-gon').length, an: (t.nut as HTMLButtonElement).hidden, khay: [...t.khay.querySelectorAll('button')].map((b) => b.getAttribute('data-k') ?? b.id) })
    t.bom({ ...NEN, pha: 'tat', tu: null })
    const chua = hinh()
    expect(chua).toEqual({ dau: ['mc-lv-nut', 'mc-lv-cum'], cuoi: 'mc-them', luoi: 1, an: false, khay: ['G', 'B', '?', 'mc-cai-btn'] })
    t.bom(NEN)
    expect(t.body.classList.contains('mc-live')).toBe(true)
    expect(hinh()).toEqual(chua)
    t.nut.click()
    expect(t.body.classList.contains('mc-khay-mo')).toBe(true)
    t.bom({ ...NEN, pha: 'tat', tu: null }) // hết live giữa lúc khay mở: khay là của thanh, không phụ thuộc live
    expect(hinh()).toEqual(chua)
    expect(t.khay.querySelector('[data-k="?"] .mc-nut-chu')!.textContent).toBe('Phím tắt')
    expect(CSS_LIVE_TO_CHIEU + CSS_THANH_DAY).not.toMatch(/mc-live[^{}]*#mc-len-bang[^{}]*\{[^}]*display:none/)
  })

  it('KHÔNG BAO GIỜ TRÀN: nút «thêm» chạm mép phải của thanh ⇒ gọn dần từng mức data-gon tới khi vừa; rộng lại ⇒ bỏ gọn', () => {
    const t = dungRieng()
    let mep = { '': 1200, 1: 1100, 2: 1010, 3: 990, 4: 900 } as Record<string, number> // thanh tới 1000, lề phải 8 ⇒ nút «thêm» phải dừng trước 992,5
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const r = this.id === 'mc-them' ? mep[t.thanh.getAttribute('data-gon') ?? '']! : 1000
      return { left: 0, top: 0, right: r, bottom: 40, width: r, height: 40, x: 0, y: 0, toJSON() {} } as DOMRect
    })
    const K = (window as unknown as { __mcKhay: { vua: () => void } }).__mcKhay
    K.vua()
    expect(t.thanh.getAttribute('data-gon')).toBe('3') // mức 1, 2 vẫn tràn ⇒ lên mức 3 thì vừa, không gọn quá tay
    mep = { '': 1200, 1: 1100, 2: 1100, 3: 1100, 4: 1100 }
    K.vua()
    expect(t.thanh.getAttribute('data-gon')).toBe('4') // hết mức vẫn chật ⇒ dừng ở mức gọn nhất, không lặp vô hạn
    mep = { '': 980 }
    K.vua()
    expect(t.thanh.hasAttribute('data-gon')).toBe(false)
    // bốn mức gọn đều có luật CSS; «Đã gọi lên bảng» (nút đã khoá, lặp lại viên trạng thái) nhường chỗ
    for (const luat of ['.mc-thanh[data-gon] .mc-lv-cum small', ':not([data-gon="1"]) .mc-phim-nhom>.mc-nut-phim kbd{display:none}', '.mc-thanh[data-gon="3"] .mc-lv-cum>span.ghi', 'body.mc .mc-thanh[data-gon="4"] .mc-pha{display:none}', 'body.mc .mc-thanh #mc-len-bang:disabled{display:none}']) expect(CSS_THANH_DAY).toContain(luat)
  })
})

describe('C · CSS + cú pháp', () => {
  it('chuyển động xoè / thu ≤ 160 ms, chỉ opacity / transform (visibility lật tức thì); tắt khi giảm chuyển động và trên máy yếu', () => {
    const tr = [...(CSS_THANH_DAY + CSS_LIVE_TO_CHIEU.split('\n').filter((d) => d.includes('.mc-lv-gon')).join('\n')).matchAll(/transition:([^;}]+)/g)].map((m) => m[1]!).filter((v) => v !== 'none')
    expect(tr.length).toBeGreaterThanOrEqual(2)
    for (const v of tr) for (const phan of v.split(',')) {
      expect(phan.trim()).toMatch(/^(opacity|transform|visibility) /)
      const giay = [...phan.matchAll(/(\d*\.?\d+)s/g)].map((m) => Number(m[1]))
      expect(Math.max(...giay)).toBeLessThanOrEqual(0.16)
    }
    expect(CSS_THANH_DAY).not.toMatch(/transition:[^;}]*\ball\b/)
    expect(CSS_THANH_DAY).toContain('@media (prefers-reduced-motion:reduce){.mc-khay{transition:none;transform:none}}')
    expect(CSS_THANH_DAY).toContain('html.may-yeu .mc-khay{transition:none;transform:none}')
  })

  it('ô chạm ≥ 40 px (nút «thêm», nút trên thanh, mỗi dòng của khay); khay nằm trên mọi thẻ nổi cạnh thanh; viền tiêu điểm nhìn thấy', () => {
    expect(CSS_THANH_DAY).toContain('body.mc .mc-thanh{--td-cao:max(40px,calc(var(--u)*2.6))}')
    expect(CSS_THANH_DAY).toMatch(/\.mc-td-them\{[^}]*width:var\(--td-cao\);height:var\(--td-cao\)/)
    expect(CSS_THANH_DAY).toMatch(/\.mc-khay \.mc-nut-phim,[^{]*#mc-cai-btn\{[^}]*min-height:max\(40px,calc\(var\(--u\)\*2\.9\)\)/)
    expect(CSS_THANH_DAY).toContain('body.mc-khay-mo .mc-thanh{z-index:46}')
    expect(CSS_THANH_DAY).toContain('.mc-khay button:focus-visible{outline:3px solid var(--mc-vang-noi)')
  })

  it('màu: chỉ biến sẵn có của tờ (--mc-*), không mã màu thô; mã chèn vào tờ không dùng cú pháp máy cũ không hiểu', () => {
    expect(CSS_THANH_DAY).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|\bhsla?\(/i)
    const bien = [...new Set([...CSS_THANH_DAY.matchAll(/var\((--mc-[a-z0-9-]+)/g)].map((m) => m[1]!))]
    expect(bien.length).toBeGreaterThanOrEqual(6)
    const khai = moTo().html.replace(CSS_THANH_DAY, '') // toàn bộ CSS của tờ thật, trừ chính đoạn này
    expect(khai).toContain(CSS_GIAO_DIEN_TO_CHIEU)
    for (const b of bien) expect(khai, `biến ${b} phải được khai sẵn trong tờ`).toMatch(new RegExp(`${b}\\s*:`))
    expect(CSS_THANH_DAY).not.toContain(':has(')
    expect(JS_THANH_DAY).not.toMatch(/`|=>|\.at\(|\blet\b|\bconst\b/)
    expect(CSS_LEN_BANG_MOI).toContain(CSS_THANH_DAY) // CSS + JS thật sự được chèn vào tờ
    expect(moTo().html).toContain("khay.id = 'mc-khay'")
  })
})

describe('D · không tràn mép — đo bằng Chromium thật', () => {
  it('tệp số đo của scripts/thu-live-1011/thu-thanh-day-1111.mjs: mọi phép kiểm đạt; đủ khổ 1180 / 1280 / 1366 / 1920, mỗi khổ đủ năm trạng thái của thanh', () => {
    const so = JSON.parse(readFileSync('docs/ban-ve-live-1011/so-do-thanh-day-1111.json', 'utf8')) as { kiem: { ten: string; dat: boolean }[] }
    expect(so.kiem.filter((k) => !k.dat).map((k) => k.ten)).toEqual([])
    for (const kho of ['1180×820', '1280×720', '1366×768', '1920×1080']) {
      const tran = so.kiem.filter((k) => k.ten.startsWith(kho) && k.ten.includes('không nút nào tràn mép thanh'))
      expect(tran.map((k) => k.ten.slice(kho.length + 3).split(':')[0])).toEqual(['chưa live, chờ thầy gọi', 'chưa live, bút đang bật', 'chưa live, đang chữa (Đạt / Không đạt)', 'đang live, chờ thầy gọi', 'đang live, viên Live đủ ngăn + đang chữa (xấu nhất)'])
      expect(so.kiem.some((k) => k.ten.startsWith(kho) && k.ten.includes('khay xoè: nằm trọn trong màn'))).toBe(true)
    }
  })
})
