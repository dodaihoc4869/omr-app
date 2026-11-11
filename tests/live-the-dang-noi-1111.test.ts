// THẺ «ĐANG NÓI» TRONG KHAY CỦA NÚT «THÊM» — thầy 11/11 tối:
//   (1) «bảng này ẩn thì không biết mở ở đâu, cho nó ẩn luôn vào cái biểu tượng các nút để tôi bật chủ động nhé» ⇒ thẻ KHÔNG tự bung, nằm sau nút «thêm»;
//   (2) kèm ảnh thẻ cũ + ảnh khay chỉ còn dải gọn: «phải hiện đủ bảng kích thước chức năng như mẫu…» ⇒ mở khay là thấy thẻ ĐẦY ĐỦ (khối đầu khay);
//   (3) ~21:45: «khi học sinh bật mic thì tự động phát tiếng em ra loa lớp luôn nhé, bỏ luôn nút bật tắt đó đi … có thêm tắt mic tất cả nhé»
//       ⇒ KHÔNG còn hàng «Phát tiếng em ra loa lớp»; máy thầy tự phát (src/lib/live/thay.ts, test ở tests/live-mic-thay-1111.test.ts).
// Mã: src/lib/live-to-chieu.ts (lvTheNoi · lvVeKhoi · lvBamThe · phím N) + src/lib/thanh-day-to-chieu.ts (khay giữ khi bấm trong khối, dấu đỏ, CSS khối).
//   A · đoạn mã mặt live + thanh đáy chạy chung trong DOM giả.
//   B · tờ chiếu THẬT trong JSDOM: N mở khay tại thẻ; Esc thu khay mà KHÔNG tắt bút; phím N không đụng lệnh nào của tờ; bảng «Phím tắt» có N và V.
//   C · CSS + cú pháp.
// Ảnh Chromium thật: scripts/thu-live-1011/thu-dang-noi-1111.mjs ⇒ docs/ban-ve-live-1011/that-7-khay-dang-noi-du-*.jpg.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'
import { JS_LIVE_TO_CHIEU } from '../src/lib/live-to-chieu'
import { CSS_THANH_DAY, JS_THANH_DAY } from '../src/lib/thanh-day-to-chieu'
import { TIN_TO_CHIEU } from '../src/lib/to-chieu-cau-noi'

type Tin = Record<string, unknown>
const NEN = { co: true, pha: 'live', tu: Date.now() - 65_000, xem: 28, tong: 30, lop: '12A1', coTieng: true, khongTieng: false, micIm: false, noiLai: false, mayKhac: false, bang: false, noi: [], ngheEm: true, chuaGui: 0, the: null, roi: [], tay: [], moi: null, micLoi: '', nghi: false, dot2: false }
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
  const muc = (v: number, em: number) => { window.dispatchEvent(new MessageEvent('message', { data: { nguon: 'bpu-bang', lenh: 'live-muc', v, em }, source: window })) }
  const phim = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  const cham = (dich: Element) => dich.dispatchEvent(new Event(window.PointerEvent ? 'pointerdown' : 'mousedown', { bubbles: true }))
  const khoi = () => document.querySelector<HTMLElement>('#mc-khay > .mc-khay-noi')
  const nutChu = (goc: ParentNode, chu: string) => [...goc.querySelectorAll<HTMLElement>('button')].find((b) => (b.textContent ?? '').trim() === chu)
  return { body, gui, bao, bom, muc, phim, cham, khoi, nutChu, viec: (v: string) => gui.filter((m) => m.loai === 'live' && m.viec === v),
    nut: () => document.getElementById('mc-them')!, khay: () => document.getElementById('mc-khay')!, khayMo: () => body.classList.contains('mc-khay-mo'),
    cot: () => document.querySelector<HTMLElement>('.mc-lv-roi')! }
}
afterEach(() => { for (const [dich, loai, f, tuy] of daGan.splice(0)) dich.removeEventListener(loai, f, tuy); vi.useRealTimers(); vi.restoreAllMocks(); document.body.innerHTML = ''; document.body.className = ''; delete (window as unknown as { __mcKhay?: unknown }).__mcKhay })

describe('A · khay của nút «thêm» có thẻ «Đang nói» ĐẦY ĐỦ', () => {
  it('có em nói ⇒ góc phải dưới trống; nút «thêm» có dấu đỏ; khối ĐẦU khay là thẻ đầy đủ như mẫu: chữ cái, tên, «Đội Natri · mic đang bật», sóng, «Thu mic», «Tắt mic tất cả»', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    expect(t.cot().hidden).toBe(true) // không còn gì tự bung ở góc phải dưới
    expect(t.nut().getAttribute('data-noi')).toBe('noi')
    expect(t.nut().getAttribute('aria-label')).toBe('Thêm nút điều khiển, Minh Anh đang nói')
    const k = t.khoi()!
    expect(t.khay().firstElementChild).toBe(k) // nằm ngay trên ba nhóm
    expect([k.hidden, k.classList.contains('mc-khay-nhom'), t.khay().querySelectorAll('.mc-khay-nhom').length]).toEqual([false, false, 3])
    const the = k.querySelector('.mc-lv-noi')!
    expect(the.querySelector('h3')!.textContent).toBe('Đang nói')
    const em = the.querySelector('.mc-lv-em')!
    expect(em.querySelector('.mc-lv-ky')!.textContent).toBe('MA')
    expect(em.querySelector('span')!.firstChild!.textContent).toBe('Nguyễn Minh Anh')
    expect(em.querySelector('small')!.textContent).toBe('Đội Natri · mic đang bật')
    expect(em.querySelector('#mc-lv-me')!.children.length).toBe(5)
    const thu = em.querySelector<HTMLElement>('[data-thu]')!
    expect([thu.textContent, thu.getAttribute('data-thu'), thu.className]).toEqual(['Thu mic', 'S1', 'mc-lv-n do'])
    expect(t.nutChu(the, 'Tắt mic tất cả')!.getAttribute('data-thu')).toBe('')
    // thầy bỏ công tắc: không còn hàng «Phát tiếng em ra loa lớp» ở đâu trên màn chiếu
    expect(document.body.textContent).not.toContain('Phát tiếng em ra loa lớp')
    expect(document.querySelector('[data-nghe="0"],[data-nghe="1"]')).toBeNull()
    expect(k.querySelectorAll('[data-k]').length).toBe(0) // không lọt vào bộ nghe bấm của nhóm phím
  })

  it('bấm trong thẻ KHÔNG làm khay thu: «Thu mic», «Tắt mic tất cả» gửi đúng lệnh như thẻ cũ; nút của nhóm vẫn thu khay như cũ', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    t.nut().click()
    expect(t.khayMo()).toBe(true)
    t.khoi()!.querySelector<HTMLElement>('.mc-lv-em [data-thu]')!.click()
    t.nutChu(t.khoi()!, 'Tắt mic tất cả')!.click()
    expect(t.viec('thu-mic')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'thu-mic', sbd: 'S1' }, { nguon: 'to-chieu', loai: 'live', viec: 'thu-mic' }])
    expect(t.khayMo()).toBe(true)
    t.cham(t.khoi()!.querySelector('h3')!) // chạm trong khối ⇒ khay giữ
    expect(t.khayMo()).toBe(true)
    document.querySelector<HTMLElement>('#mc-khay [data-k="G"]')!.click()
    expect(t.khayMo()).toBe(false)
  })

  it('đang live mà CHƯA em nào nói / giơ tay ⇒ khối chỉ một dòng «Chưa có em nào nói» (không nút, không hàng loa); không dấu. Không live ⇒ không có khối', () => {
    const t = dung()
    t.bom({ ...NEN, pha: 'tat', tu: null })
    expect(t.khoi()).toBeNull() // chưa live: khay y như cũ
    t.bom(NEN)
    const k = t.khoi()!
    expect(k.hidden).toBe(false)
    expect(k.textContent).toBe('Chưa có em nào nói')
    expect(k.querySelectorAll('button').length).toBe(0) // vòng Tab của khay không thêm gì
    expect(t.nut().hasAttribute('data-noi')).toBe(false)
    t.bom({ ...NEN, noi: [MINH_ANH] }); t.bom(NEN) // em vừa nói xong ⇒ về một dòng
    expect(k.textContent).toBe('Chưa có em nào nói')
    t.bom({ ...NEN, pha: 'tat', tu: null, noi: [MINH_ANH] }) // hết live
    expect([k.hidden, k.querySelectorAll('button').length, t.nut().hasAttribute('data-noi')]).toEqual([true, 0, false])
  })

  it('giơ tay: dấu VÒNG; khối «Chưa có em nào nói» + thẻ gọn «2 em giơ tay» ⇒ chạm mở hàng chờ mà khay KHÔNG thu; «Mời nói», «Hạ hết tay» gửi đúng lệnh', () => {
    const t = dung()
    t.bom({ ...NEN, tay: TAY })
    expect(t.cot().hidden).toBe(true)
    expect(t.nut().getAttribute('data-noi')).toBe('tay')
    expect(t.nut().getAttribute('aria-label')).toBe('Thêm nút điều khiển, 2 em giơ tay')
    t.nut().click()
    expect(t.khoi()!.querySelector('h3')!.textContent).toBe('Chưa có em nào nói')
    t.khoi()!.querySelector<HTMLElement>('[data-tay]')!.click() // nút bị vẽ lại ngay trong lượt bấm
    expect(t.khayMo()).toBe(true)
    const hang = t.khoi()!.querySelector('.mc-lv-tay')!
    expect([...hang.querySelectorAll('.mc-lv-em span')].map((e) => e.firstChild!.textContent)).toEqual(['Lê Gia Huy', 'Trần Thu Hà'])
    t.nutChu(hang, 'Mời nói')!.click()
    expect(t.viec('moi')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'moi', sbd: 'S2' }])
    expect(t.khayMo()).toBe(true)
    // em được mời: «Đã mời nói» + «chờ em bật mic» + «Thu mic» (không đỏ — em chưa nói); dấu đặc
    t.bom({ ...NEN, tay: [TAY[1]], moi: GIA_HUY })
    expect(t.khoi()!.querySelector('h3')!.textContent).toBe('Đã mời nói')
    expect(t.khoi()!.textContent).toContain('đã mời · chờ em bật mic')
    expect(t.khoi()!.querySelector('[data-thu]')!.className).toBe('mc-lv-n')
    expect(t.nut().getAttribute('data-noi')).toBe('noi')
    t.nutChu(t.khoi()!, 'Hạ hết tay')!.click()
    expect(t.viec('ha-tay')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'ha-tay' }])
    expect(t.khayMo()).toBe(true)
  })

  it('trình duyệt chặn tự phát tiếng em ⇒ dòng «Máy chưa phát được tiếng em» + «Chạm để nghe» (giữ); bấm ⇒ app phát lại, khay giữ', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH], emKet: true })
    t.nut().click()
    expect(t.khoi()!.textContent).toContain('Máy chưa phát được tiếng em')
    t.nutChu(t.khoi()!, 'Chạm để nghe')!.click()
    expect(t.viec('nghe-em-lai').length).toBe(1)
    expect(t.khayMo()).toBe(true)
  })

  it('phím N: đang live ⇒ mở / đóng khay NGAY tại khối (cuộn về đầu); chưa live ⇒ chỉ báo nhanh. Esc / chạm ra ngoài thu khay', () => {
    const t = dung()
    t.phim('n')
    expect([t.khayMo(), t.bao]).toEqual([false, ['Chưa bật live']])
    t.bom({ ...NEN, noi: [MINH_ANH] })
    t.khay().scrollTop = 120
    t.phim('n')
    expect([t.khayMo(), t.khay().scrollTop]).toEqual([true, 0])
    t.phim('N')
    expect(t.khayMo()).toBe(false)
    t.phim('n'); t.phim('Escape')
    expect(t.khayMo()).toBe(false)
    t.phim('n'); t.cham(document.getElementById('ngoai')!)
    expect(t.khayMo()).toBe(false)
  })

  it('có khối «Đang nói» ⇒ khay KHÔNG tự thu sau 8 giây (như thẻ cũ); không live ⇒ 8 giây vẫn thu như cũ', () => {
    vi.useFakeTimers()
    const t = dung()
    t.nut().click()
    vi.advanceTimersByTime(8100)
    expect(t.khayMo()).toBe(false)
    t.bom(NEN)
    t.nut().click()
    vi.advanceTimersByTime(20_000)
    expect(t.khayMo()).toBe(true)
  })

  it('sóng âm của em chỉ vẽ khi khay mở (khay đóng ⇒ không đổi lớp 11 lần / giây)', () => {
    const t = dung()
    t.bom({ ...NEN, noi: [MINH_ANH] })
    const vach = () => [...document.getElementById('mc-lv-me')!.children].filter((i) => i.className === 'b').length
    t.muc(0.2, 0.5)
    expect(vach()).toBe(0)
    t.nut().click(); t.muc(0.2, 0.5)
    expect(vach()).toBe(5)
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

  it('tờ KHÔNG có khay (không nhóm phím) ⇒ thẻ hiện ở góc như cũ khi có em nói (không hàng loa); chưa ai nói ⇒ góc trống', () => {
    const t = dung(false)
    t.bom(NEN)
    expect(t.cot().hidden).toBe(true)
    t.bom({ ...NEN, noi: [MINH_ANH] })
    const the = t.cot().querySelector('.mc-lv-noi')!
    expect(the.querySelector('h3')!.textContent).toBe('Đang nói')
    expect(the.textContent).not.toContain('Phát tiếng em ra loa lớp')
    t.nutChu(the, 'Tắt mic tất cả')!.click()
    expect(t.viec('thu-mic')).toEqual([{ nguon: 'to-chieu', loai: 'live', viec: 'thu-mic' }])
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
  return { doc, w, phim, tuCha, khayMo: () => doc.body.classList.contains('mc-khay-mo'), but: () => doc.body.classList.contains('mc-co-but') }
}

describe('B · tờ thật', () => {
  it('đang live (bút bật sẵn), có em nói: góc trống; N mở khay có thẻ đầy đủ; Esc thu khay mà KHÔNG tắt bút; Esc lần nữa mới tắt bút như cũ', () => {
    const t = moTo()
    t.tuCha({ type: TIN_TO_CHIEU.KET_NOI })
    t.tuCha({ nguon: 'bpu-bang', lenh: 'live-tt', tt: { ...NEN, noi: [MINH_ANH] } })
    expect(t.but()).toBe(true)
    expect(t.doc.querySelector<HTMLElement>('.mc-lv-roi')!.hidden).toBe(true)
    expect(t.doc.getElementById('mc-them')!.getAttribute('data-noi')).toBe('noi')
    const k = t.doc.querySelector('#mc-khay > .mc-khay-noi')!
    expect(k.querySelector('h3')!.textContent).toBe('Đang nói')
    for (const chu of ['Nguyễn Minh Anh', 'Thu mic', 'Tắt mic tất cả']) expect(k.textContent).toContain(chu)
    expect(k.textContent).not.toContain('Phát tiếng em ra loa lớp')
    t.phim('n')
    expect(t.khayMo()).toBe(true)
    t.phim('Escape')
    expect([t.khayMo(), t.but()]).toEqual([false, true])
    t.phim('Escape')
    expect(t.but()).toBe(false)
  })

  it('phím N không trùng lệnh nào của tờ (chưa live: không mở lời giải / thống kê / bút / lưới / bảng phím / khay); bảng «Phím tắt» có dòng N và V', () => {
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

describe('C · CSS + cú pháp', () => {
  it('dấu «có em nói» ở góc TRÁI, màu đỏ của tờ (chấm vàng «đang bật» ở góc phải giữ nguyên); vòng khi chỉ có em giơ tay', () => {
    expect(CSS_THANH_DAY).toMatch(/\.mc-td-them::before\{[^}]*left:4%[^}]*background:var\(--mc-do\)/)
    expect(CSS_THANH_DAY).toContain('.mc-td-them[data-noi]::before{display:block}')
    expect(CSS_THANH_DAY).toMatch(/\.mc-td-them\[data-noi="tay"\]::before\{[^}]*inset 0 0 0 2\.5px var\(--mc-do\)/)
    expect(CSS_THANH_DAY).toContain('.mc-td-them::after{content:"";position:absolute;top:6%;right:6%') // chấm vàng cũ không đổi
  })
  it('khối đầu khay trọn một hàng, không làm khay rộng ra; khay cao quá màn ⇒ cuộn; màn hẹp xếp dọc; nút trong khối ≥ 40 px; không chuyển động riêng', () => {
    expect(CSS_THANH_DAY).toMatch(/\.mc-khay\{flex-wrap:wrap;max-height:calc\(100vh[^}]*overflow-y:auto/)
    expect(CSS_THANH_DAY).toMatch(/\.mc-khay-noi\{position:static;flex:0 0 100%;contain:inline-size;margin-right:calc\(var\(--u\)\*-\.7\);flex-direction:column/) // lề âm bù đúng một gap của khay
    expect(CSS_THANH_DAY).toContain('@media (max-width:900px){.mc-khay{flex-wrap:nowrap}.mc-khay-noi{flex:none;contain:none;margin-right:0}}') // hẹp: một cột cuộn, không dàn cột mới
    expect(CSS_THANH_DAY).toMatch(/\.mc-khay-noi \.mc-lv-n\{[^}]*min-height:max\(40px,calc\(var\(--u\)\*2\.9\)\)/)
    // luật khối mới đứng SAU dải cũ (đè được vị trí tuyệt đối của dải)
    expect(CSS_THANH_DAY.indexOf('.mc-khay-noi{position:static;flex:0 0 100%')).toBeGreaterThan(CSS_THANH_DAY.indexOf('.mc-khay-noi{position:absolute'))
    expect(CSS_THANH_DAY.split('\n').filter((d) => d.includes('mc-khay-noi') || d.includes('data-noi')).join('\n')).not.toMatch(/transition|animation/)
  })
  it('mã chèn vào tờ không dùng cú pháp máy cũ không hiểu; tách tên bằng \\s+ còn nguyên dấu gạch chéo ngược; hết công tắc loa', () => {
    expect(JS_LIVE_TO_CHIEU).not.toMatch(/`|=>|\.at\(|\blet\b|\bconst\b|\?\.|\?\?/)
    expect(JS_THANH_DAY).not.toMatch(/`|=>|\.at\(|\blet\b|\bconst\b|\?\.|\?\?/)
    expect(JS_LIVE_TO_CHIEU).toContain(".split(/\\s+/).slice(-2)")
    expect(JS_LIVE_TO_CHIEU).not.toContain('Phát tiếng em ra loa lớp')
  })
})
