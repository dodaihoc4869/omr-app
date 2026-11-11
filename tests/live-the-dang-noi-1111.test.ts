// THẺ «ĐANG NÓI» VÀO KHAY CỦA NÚT «THÊM» — thầy 11/11 tối, kèm ảnh thẻ «Đang nói» ở góc phải dưới màn chiếu: «bảng này ẩn thì không biết mở ở đâu,
// cho nó ẩn luôn vào cái biểu tượng các nút để tôi bật chủ động nhé».
// Mã: src/lib/live-to-chieu.ts (lvVeRoi · lvVeDai · lvMoNoi, phím N) + src/lib/thanh-day-to-chieu.ts (dấu đỏ trên nút «thêm», CSS dải «Đang nói»).
//   A · đoạn mã mặt live + thanh đáy chạy chung trong DOM giả: có em nói ⇒ thẻ KHÔNG tự hiện, nút «thêm» có dấu, khay có mục «Đang nói · <tên ngắn>» + phím N
//       + nút «Thu mic» nhanh (mở khay ⇒ «Thu mic»: hai chạm); bấm mục / phím N ⇒ thẻ mở đầy đủ; bấm lại / Esc / chạm ra ngoài ⇒ thu; hết em ⇒ tự thu.
//   B · tờ chiếu THẬT trong JSDOM: Esc thu thẻ mà KHÔNG tắt bút (live bật bút sẵn); phím N không đụng lệnh nào của tờ; bảng «Phím tắt» có N và V.
//   C · CSS: dấu khác chấm vàng «đang bật» (góc trái, đỏ; vòng khi chỉ có em giơ tay), dải không làm khay nở, ô chạm ≥ 40 px, chỉ biến màu của tờ.
// Ảnh Chromium thật: scripts/thu-live-1011/thu-dang-noi-1111.mjs ⇒ docs/ban-ve-live-1011/that-6-dang-noi-*.jpg.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { JS_LIVE_TO_CHIEU } from '../src/lib/live-to-chieu'
import { CSS_THANH_DAY, JS_THANH_DAY } from '../src/lib/thanh-day-to-chieu'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'

type Tin = Record<string, unknown>
const NEN = { co: true, pha: 'live', tu: Date.now() - 65_000, xem: 28, tong: 30, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: false, noi: [], ngheEm: false, chuaGui: 0, the: null, roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: false }
const MINH_ANH = { sbd: 'S1', ten: 'Nguyễn Minh Anh', ky: 'MA', doi: 'Đội Natri', mau: '' }
const GIA_HUY = { sbd: 'S2', ten: 'Lê Gia Huy', ky: 'LH', doi: 'Đội Kali', mau: '' }
const TAY = [{ ...GIA_HUY, luc: 1 }, { sbd: 'S3', ten: 'Trần Thu Hà', ky: 'TH', doi: 'Đội Natri', mau: '', luc: 2 }]

// ── A · DOM giả: thanh đáy + nhóm phím như tờ thật, chạy CẢ mặt live lẫn thanh đáy (cùng thứ tự chèn trong tờ) ──
const THANH = '<div class="mc-thanh" id="mc-thanh"><div class="mc-buoc"></div><span class="mc-pha" id="mc-pha"></span><button id="mc-len-bang">Lên bảng</button><div class="mc-phim-nhom" id="mc-phim-nhom">'
  + '<button class="mc-nut-phim" data-k="G"><kbd>G</kbd><span class="mc-nut-chu">Giải</span></button><button class="mc-nut-phim" data-k="B"><kbd>B</kbd><span class="mc-nut-chu">Bút</span></button>'
  + '<button class="mc-nut-phim" data-k="?"><kbd>?</kbd><span class="mc-nut-chu">Phím</span></button></div><div id="mc-tiep"></div><button id="mc-cai-btn">Cài đặt</button></div><div id="ngoai">bảng đen</div>'
const daGan: [EventTarget, string, EventListener, (boolean | AddEventListenerOptions)?][] = []
function dung(coKhay = true) {
  document.body.innerHTML = coKhay ? THANH : '<div class="mc-thanh" id="mc-thanh"></div><div id="ngoai">bảng đen</div>'
  const body = document.body, thanh = document.getElementById('mc-thanh')!, nhom = document.getElementById('mc-phim-nhom')
  const tao = (the: string, lop: string, cha: HTMLElement) => { const e = document.createElement(the); e.className = lop; cha.appendChild(e); return e }
  const gui: Tin[] = [], bao: string[] = []
  vi.spyOn(window, 'postMessage').mockImplementation(((m: Tin) => { gui.push(m) }) as never)
  for (const dich of [document, window] as EventTarget[]) {
    const goc = dich.addEventListener.bind(dich)
    vi.spyOn(dich, 'addEventListener').mockImplementation(((loai: string, f: EventListener, tuy?: boolean | AddEventListenerOptions) => { daGan.push([dich, loai, f, tuy]); goc(loai, f, tuy) }) as never)
  }
  new Function('body', 'tao', 'thanh', 'nhom', 'dichApp', 'baoNhanh', 'dot', JS_LIVE_TO_CHIEU + (coKhay ? JS_THANH_DAY : ''))(body, tao, thanh, nhom, () => window, (c: string) => { bao.push(c) }, () => null)
  vi.mocked(document.addEventListener).mockRestore(); vi.mocked(window.addEventListener).mockRestore()
  const bom = (tt: Tin | null) => { window.dispatchEvent(new MessageEvent('message', { data: { nguon: 'bpu-bang', lenh: 'live-tt', tt }, source: window })) }
  const phim = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  const cham = (dich: Element) => dich.dispatchEvent(new Event(window.PointerEvent ? 'pointerdown' : 'mousedown', { bubbles: true }))
  const the = () => document.querySelector<HTMLElement>('.mc-lv-roi .mc-lv-noi:not(.mc-lv-ghi-nhac)')
  const dai = () => document.querySelector<HTMLElement>('#mc-khay > .mc-khay-noi')
  const muc = () => dai()!.querySelector<HTMLElement>('.mc-khay-noi-mo')!
  return { body, gui, bao, bom, phim, cham, the, dai, muc, viec: (v: string) => gui.filter((m) => m.loai === 'live' && m.viec === v),
    nut: () => document.getElementById('mc-them')!, khayMo: () => body.classList.contains('mc-khay-mo'), cot: () => document.querySelector<HTMLElement>('.mc-lv-roi')! }
}
afterEach(() => { for (const [dich, loai, f, tuy] of daGan.splice(0)) dich.removeEventListener(loai, f, tuy); vi.restoreAllMocks(); document.body.innerHTML = ''; document.body.className = ''; delete (window as unknown as { __mcKhay?: unknown }).__mcKhay })

describe('A · thẻ «Đang nói» nằm sau nút «thêm», thầy chủ động mở', () => {
  it('có em nói ⇒ thẻ KHÔNG tự hiện; nút «thêm» có dấu «noi» + nhãn đọc tên em; khay có mục «Đang nói · Minh Anh» kèm ô phím N + nút «Thu mic» nhanh', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    expect(t.the()).toBeNull()
    expect(t.cot().hidden).toBe(true) // không còn gì tự bung ở góc phải dưới
    expect(t.nut().getAttribute('data-noi')).toBe('noi')
    expect(t.nut().getAttribute('aria-label')).toBe('Thêm nút điều khiển, Minh Anh đang nói')
    expect(t.dai()!.hidden).toBe(false)
    expect(t.dai()!.classList.contains('mc-khay-nhom')).toBe(false) // dải không phải nhóm: ba nhóm cũ giữ nguyên
    expect(t.muc().querySelector('b')!.textContent).toBe('Đang nói · Minh Anh')
    expect(t.muc().querySelector('kbd')!.textContent).toBe('N')
    expect(t.muc().getAttribute('aria-expanded')).toBe('false')
    expect(t.muc().hasAttribute('data-k')).toBe(false) // không lọt vào bộ nghe bấm của nhóm phím
    const thu = t.dai()!.querySelector<HTMLElement>('[data-thu]')!
    expect([thu.textContent, thu.getAttribute('data-thu'), thu.className]).toEqual(['Thu mic', 'S1', 'mc-lv-n do'])
  })

  it('«Thu mic» khẩn: HAI chạm — mở khay ⇒ «Thu mic»; khay tự thu, thẻ vẫn đóng', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    t.nut().click()
    expect(t.khayMo()).toBe(true)
    t.dai()!.querySelector<HTMLElement>('[data-thu]')!.click()
    expect(t.viec('thu-mic')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'thu-mic', sbd: 'S1' }])
    expect(t.khayMo()).toBe(false)
    expect(t.the()).toBeNull()
  })

  it('bấm mục ⇒ thẻ mở ĐẦY ĐỦ như cũ (sóng âm, Thu mic, Phát tiếng em ra loa lớp, Tắt mic tất cả), dấu tắt; bấm lại ⇒ thu, dấu trở lại', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    t.nut().click(); t.muc().click()
    expect(t.khayMo()).toBe(false) // chọn xong ⇒ khay thu
    const the = t.the()!
    expect(the.querySelector('h3')!.textContent).toBe('Đang nói')
    expect(the.querySelector('#mc-lv-me')!.children.length).toBe(5)
    for (const chu of ['Thu mic', 'Phát tiếng em ra loa lớp', 'Tắt mic tất cả']) expect(the.textContent).toContain(chu)
    expect(t.nut().hasAttribute('data-noi')).toBe(false)
    expect(t.nut().getAttribute('aria-label')).toBe('Thêm nút điều khiển')
    expect(t.muc().getAttribute('aria-expanded')).toBe('true')
    // nút trong thẻ vẫn gửi đúng lệnh như trước
    ;[...the.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === 'Tắt mic tất cả')!.click()
    expect(t.viec('thu-mic')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'thu-mic' }])
    t.nut().click(); t.muc().click()
    expect(t.the()).toBeNull()
    expect(t.nut().getAttribute('data-noi')).toBe('noi')
  })

  it('phím N mở / đóng; Esc thu (khay đang mở thì khay thu trước); chạm ra ngoài thu, chạm trong thẻ / nút «thêm» thì giữ', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    t.phim('n')
    expect(t.the()).not.toBeNull()
    t.phim('N')
    expect(t.the()).toBeNull()
    t.phim('n')
    t.phim('Escape')
    expect(t.the()).toBeNull()
    // khay đang mở + thẻ đang mở: Esc thứ nhất thu khay, Esc thứ hai thu thẻ
    t.phim('n'); t.nut().click()
    expect(t.khayMo()).toBe(true)
    t.phim('Escape')
    expect([t.khayMo(), !!t.the()]).toEqual([false, true])
    t.phim('Escape')
    expect(t.the()).toBeNull()
    // chạm
    t.phim('n')
    t.cham(t.the()!)
    expect(t.the()).not.toBeNull()
    t.cham(t.nut())
    expect(t.the()).not.toBeNull()
    t.cham(document.getElementById('ngoai')!)
    expect(t.the()).toBeNull()
    // phím N lúc khay đang mở ⇒ khay thu, thẻ mở
    t.nut().click(); t.phim('n')
    expect([t.khayMo(), !!t.the()]).toEqual([false, true])
  })

  it('không có em nào ⇒ N chỉ báo nhanh, không mở; hết em nói ⇒ thẻ tự thu, dải + dấu mất; em mới nói ⇒ thẻ vẫn KHÔNG tự bung', () => {
    const t = dung()
    t.bom(NEN)
    t.phim('n')
    expect(t.bao).toEqual(['Chưa em nào đang nói hay giơ tay'])
    expect(t.the()).toBeNull()
    expect(t.dai()).toBeNull() // chưa từng có em: khay y như cũ
    t.bom({ ...NEN, noi: [MINH_ANH] }); t.phim('n')
    expect(t.the()).not.toBeNull()
    t.bom(NEN)
    expect(t.the()).toBeNull()
    expect(t.dai()!.hidden).toBe(true)
    expect(t.dai()!.querySelectorAll('button').length).toBe(0) // dải rỗng ⇒ không nút nào lọt vào vòng Tab của khay
    expect(t.nut().hasAttribute('data-noi')).toBe(false)
    t.bom({ ...NEN, noi: [GIA_HUY] })
    expect(t.the()).toBeNull()
    expect(t.muc().querySelector('b')!.textContent).toBe('Đang nói · Gia Huy')
    t.bom({ ...NEN, pha: 'tat', tu: null, noi: [GIA_HUY] }) // hết live
    expect(t.dai()!.hidden).toBe(true)
    expect(t.nut().hasAttribute('data-noi')).toBe(false)
  })

  it('chỉ có em giơ tay ⇒ dấu VÒNG («tay»), mục «2 em giơ tay» không có «Thu mic»; mở ⇒ hàng chờ hiện thẳng với «Mời nói»', () => {
    const t = dung()
    t.bom({ ...NEN, tay: TAY })
    expect(t.cot().hidden).toBe(true)
    expect(t.nut().getAttribute('data-noi')).toBe('tay')
    expect(t.nut().getAttribute('aria-label')).toBe('Thêm nút điều khiển, 2 em giơ tay')
    expect(t.muc().querySelector('b')!.textContent).toBe('2 em giơ tay')
    expect(t.dai()!.querySelector('[data-thu]')).toBeNull()
    t.phim('n')
    const hang = t.cot().querySelector('.mc-lv-tay')!
    expect([...hang.querySelectorAll('.mc-lv-em span')].map((e) => e.firstChild!.textContent)).toEqual(['Lê Gia Huy', 'Trần Thu Hà'])
    ;[...hang.querySelectorAll<HTMLElement>('button')].find((b) => b.textContent === 'Mời nói')!.click()
    expect(t.viec('moi')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'moi', sbd: 'S2' }])
    // em được mời: thẻ thầy đã mở thì vẫn mở; mục đổi «Đã mời nói · Gia Huy» + «Thu mic» (không đỏ — em chưa nói)
    t.bom({ ...NEN, tay: [TAY[1]], moi: GIA_HUY })
    expect(t.the()!.textContent).toContain('đã mời · chờ em bật mic')
    expect(t.muc().querySelector('b')!.textContent).toBe('Đã mời nói · Gia Huy')
    expect(t.muc().querySelector('small')!.textContent).toBe('1 em giơ tay')
    const thu = t.dai()!.querySelector<HTMLElement>('[data-thu]')!
    expect([thu.textContent, thu.getAttribute('data-thu'), thu.className]).toEqual(['Thu mic', 'S2', 'mc-lv-n'])
  })

  it('em nói + em giơ tay ⇒ dấu đặc, dòng phụ «2 em giơ tay»; hai em cùng nói ⇒ nút nhanh là «Tắt mic tất cả»', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH], tay: TAY })
    expect(t.nut().getAttribute('data-noi')).toBe('noi')
    expect(t.nut().getAttribute('aria-label')).toBe('Thêm nút điều khiển, Minh Anh đang nói, 2 em giơ tay')
    expect(t.muc().querySelector('small')!.textContent).toBe('2 em giơ tay')
    t.bom({ ...NEN, noi: [MINH_ANH, GIA_HUY] })
    expect(t.muc().querySelector('b')!.textContent).toBe('Đang nói · Minh Anh +1')
    const thu = t.dai()!.querySelector<HTMLElement>('[data-thu]')!
    expect([thu.textContent, thu.getAttribute('data-thu')]).toEqual(['Tắt mic tất cả', ''])
    thu.click()
    expect(t.viec('thu-mic')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'thu-mic' }])
  })

  it('chấm vàng «đang bật» và dấu «có em nói» song song: nhãn đọc kể cả hai', async () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    document.querySelector<HTMLElement>('#mc-khay [data-k="G"]')!.classList.add('mc-bat')
    await new Promise((r) => setTimeout(r, 0))
    expect(t.nut().getAttribute('data-bat')).toBe('1')
    expect(t.nut().getAttribute('data-noi')).toBe('noi')
    expect(t.nut().getAttribute('aria-label')).toBe('Thêm nút điều khiển, đang bật: Lời giải, Minh Anh đang nói')
  })

  it('tờ KHÔNG có khay (không nhóm phím) ⇒ thẻ hiện như cũ — không bao giờ mất lối «Thu mic»', () => {
    const t = dung(false)
    t.bom({ ...NEN, noi: [MINH_ANH] })
    expect(t.the()!.querySelector('h3')!.textContent).toBe('Đang nói')
    expect(document.querySelector('.mc-khay-noi')).toBeNull()
  })
})

// ── B · tờ chiếu THẬT trong JSDOM (cùng cách dựng với tests/thanh-day-1111.test.ts) ──
const MA = 'phien1111'
const GOC = 'https://app.test'
const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [{ khoa: 'A', ly: 'Vì a.' }, { khoa: 'B', ly: 'Vì b.' }], buoc: ['Bước 1.', 'Bước 2.'], ketQua: 'B' }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 36, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 3 })
function moTo() {
  const cha = new JSDOM('<!doctype html><body></body>', { url: `${GOC}/` }).window as unknown as Window
  ;(cha as unknown as { postMessage: () => void }).postMessage = () => {}
  const dom = new JSDOM(taoHtmlMayChieu([o('A', 'Nguyễn Minh Anh'), o('B', 'Trần Gia Bảo')], { cauNoi: { maPhien: MA } }), {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      Object.defineProperty(w, 'parent', { get: () => cha, configurable: true })
      w.setTimeout = (() => 0) as never
      w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true })
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis & { __mcTrangThai: () => { lgMo: boolean; pha: string } }
  const doc = dom.window.document
  const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  const tuCha = (data: Record<string, unknown>) => w.dispatchEvent(new dom.window.MessageEvent('message', { data: { maPhien: MA, ...data }, origin: GOC, source: cha as unknown as MessageEventSource }))
  return { doc, w, phim, tuCha, the: () => doc.querySelector('.mc-lv-roi .mc-lv-noi'), but: () => doc.body.classList.contains('mc-co-but') }
}

describe('B · tờ thật', () => {
  it('đang live (bút bật sẵn), có em nói: thẻ không tự hiện; N mở; Esc thu thẻ mà KHÔNG tắt bút; Esc lần nữa mới tắt bút như cũ', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
    t.tuCha({ nguon: 'bpu-bang', lenh: 'live-tt', tt: { ...NEN, noi: [MINH_ANH] } })
    expect(t.but()).toBe(true)
    expect(t.the()).toBeNull()
    expect(t.doc.getElementById('mc-them')!.getAttribute('data-noi')).toBe('noi')
    expect(t.doc.querySelector('#mc-khay > .mc-khay-noi .mc-khay-noi-mo b')!.textContent).toBe('Đang nói · Minh Anh')
    t.phim('n')
    expect(t.the()).not.toBeNull()
    t.phim('Escape')
    expect(t.the()).toBeNull()
    expect(t.but()).toBe(true)
    t.phim('Escape')
    expect(t.but()).toBe(false)
  })

  it('phím N không trùng lệnh nào của tờ (chưa live: không mở lời giải / thống kê / bút / lưới / bảng phím); bảng «Phím tắt» có dòng N và V', () => {
    const t = moTo()
    t.phim('n'); t.phim('N')
    expect(t.w.__mcTrangThai().lgMo).toBe(false)
    expect(['mc-co-tk', 'mc-co-but', 'mc-khay-mo'].map((c) => t.doc.body.classList.contains(c))).toEqual([false, false, false])
    expect(t.doc.querySelectorAll('.mc-phu-lop.mc-mo').length).toBe(0)
    t.phim('?')
    const dong = [...t.doc.querySelectorAll('.mc-phim dt')].map((d) => d.textContent)
    expect(dong).toContain('N')
    expect(dong).toContain('V')
    expect(t.doc.querySelector('.mc-phim')!.textContent).toContain('mở / đóng thẻ «Đang nói»')
  })
})

describe('C · CSS', () => {
  it('dấu «có em nói» ở góc TRÁI, màu đỏ của tờ (chấm vàng «đang bật» ở góc phải giữ nguyên); vòng khi chỉ có em giơ tay', () => {
    expect(CSS_THANH_DAY).toMatch(/\.mc-td-them::before\{[^}]*left:4%[^}]*background:var\(--mc-do\)/)
    expect(CSS_THANH_DAY).toContain('.mc-td-them[data-noi]::before{display:block}')
    expect(CSS_THANH_DAY).toMatch(/\.mc-td-them\[data-noi="tay"\]::before\{[^}]*inset 0 0 0 2\.5px var\(--mc-do\)/)
    expect(CSS_THANH_DAY).toContain('.mc-td-them::after{content:"";position:absolute;top:6%;right:6%') // chấm vàng cũ không đổi
  })
  it('dải «Đang nói» định vị tuyệt đối trên khay (không làm khay nở ra); màn hẹp thì nằm trong luồng; ô chạm ≥ 40 px; không chuyển động riêng', () => {
    expect(CSS_THANH_DAY).toMatch(/\.mc-khay-noi\{position:absolute;right:0;bottom:calc\(100% \+ var\(--u\)\*\.6\)[^}]*min-width:100%/)
    expect(CSS_THANH_DAY).toMatch(/@media \(max-width:900px\)\{\.mc-khay-noi\{position:static/)
    expect(CSS_THANH_DAY).toMatch(/\.mc-khay-noi-mo\{[^}]*min-height:max\(40px,calc\(var\(--u\)\*2\.9\)\)/)
    expect(CSS_THANH_DAY).toMatch(/\.mc-khay-noi \.mc-lv-n\{[^}]*min-height:max\(40px,calc\(var\(--u\)\*2\.9\)\)/)
    expect(CSS_THANH_DAY.split('\n').filter((d) => d.includes('mc-khay-noi') || d.includes('data-noi')).join('\n')).not.toMatch(/transition|animation/)
  })
  it('mã chèn vào tờ không dùng cú pháp máy cũ không hiểu; tách tên bằng \\s+ còn nguyên dấu gạch chéo ngược', () => {
    expect(JS_LIVE_TO_CHIEU).not.toMatch(/`|=>|\.at\(|\blet\b|\bconst\b|\?\.|\?\?/)
    expect(JS_LIVE_TO_CHIEU).toContain(".split(/\\s+/).slice(-2)")
  })
})
