// THANH CHỌN BÚT GỌN + NAM CHÂM HÚT MÉP + TỰ MỜ (thầy 12/11: «thanh chọn bút làm cho nhỏ gọn lại tinh tế đẹp hơn và có nam châm hút vào mép các cạnh
// của màn hình tự động mờ di vào mới sáng»). Kiểm phần THUẦN (chọn mép gần nhất · kẹp chỗ đứng · đọc / ghi nhớ) ở cả bản TS lẫn chuỗi JS chạy trên tờ
// (`JS_LOI_HUT`, phải ra cùng số), và phần gắn vào tờ thật do `taoHtmlMayChieu` sinh (JSDOM: không có bố cục ⇒ chỉ kiểm lớp, thuộc tính, bộ nhớ).
// Dáng thật + kéo thả thật: scripts/thu-live-1011/thu-thanh-but-1211.mjs (Chromium).
import { describe, it, expect } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { CSS_THANH_HUT, JS_LOI_HUT, JS_THANH_HUT, LE_HUT, chonMepHut, docNhoThanhHut, ghiNhoThanhHut, kepHut, viTriThanhHut, type MepHut, type NhoHut } from '../src/lib/but-thanh-hut-to-chieu'
import { CSS_BUT_BANG, JS_BUT_BANG } from '../src/lib/but-bang-to-chieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

type LoiTo = {
  mep(cx: number, cy: number, W: number, H: number, day: number): MepHut
  viTri(m: MepHut, t: number, w: number, h: number, W: number, H: number, day: number): { x: number; y: number }
  doc(s: unknown): NhoHut | null
  ghi(m: MepHut, t: number): string
}
const HUT = new Function(JS_LOI_HUT + '; return HUT;')() as LoiTo
const W = 1366, H = 768, DAY = 50
const MEP: MepHut[] = ['tren', 'duoi', 'trai', 'phai']

describe('thanh bút hút mép · công thức thuần', () => {
  it('chọn mép gần tâm thanh nhất trong 4 cạnh; mép dưới tính từ đỉnh thanh đáy', () => {
    expect(chonMepHut(683, 20, W, H, DAY)).toBe('tren')
    expect(chonMepHut(683, 700, W, H, DAY)).toBe('duoi')
    expect(chonMepHut(30, 384, W, H, DAY)).toBe('trai')
    expect(chonMepHut(1340, 384, W, H, DAY)).toBe('phai')
    // cách mép phải 120, cách đỉnh thanh đáy 100 ⇒ dưới; không có thanh đáy thì cách đáy 150 ⇒ phải
    expect(chonMepHut(W - 120, H - 150, W, H, DAY)).toBe('duoi')
    expect(chonMepHut(W - 120, H - 150, W, H, 0)).toBe('phai')
  })
  it('hoà thì theo thứ tự trên, dưới, trái, phải (thả đúng tâm màn ⇒ về mép trên như mặc định)', () => {
    expect(chonMepHut(400, 400, 800, 800, 0)).toBe('tren')
    expect(chonMepHut(600, 400, 800, 800, 0)).toBe('phai')
    expect(chonMepHut(400, 600, 800, 800, 0)).toBe('duoi')
  })
  it('kẹp: trong khoảng giữ nguyên, ngoài khoảng về biên, khoảng rỗng (thanh dài hơn màn) về biên đầu', () => {
    expect(kepHut(5, 0, 10)).toBe(5); expect(kepHut(-3, 0, 10)).toBe(0); expect(kepHut(30, 0, 10)).toBe(10); expect(kepHut(5, 6, 2)).toBe(6)
  })
  it('mép trên / dưới: giữ chỗ ngang theo tỉ lệ, cách mép đúng khe; mép dưới nằm ngay trên thanh đáy', () => {
    expect(viTriThanhHut('tren', 0.5, 480, 30, W, H, DAY)).toEqual({ x: 443, y: LE_HUT })
    expect(viTriThanhHut('duoi', 0.5, 480, 30, W, H, DAY)).toEqual({ x: 443, y: H - DAY - 30 - LE_HUT })
    expect(viTriThanhHut('tren', 0, 480, 30, W, H, DAY).x).toBe(LE_HUT)
    expect(viTriThanhHut('tren', 1, 480, 30, W, H, DAY).x).toBe(W - 480 - LE_HUT)
  })
  it('mép trái / phải: thanh dọc, giữ chỗ dọc theo tỉ lệ, không bao giờ đè lên thanh đáy', () => {
    expect(viTriThanhHut('trai', 0.5, 30, 480, W, H, DAY)).toEqual({ x: LE_HUT, y: 144 })
    expect(viTriThanhHut('phai', 0.5, 30, 480, W, H, DAY)).toEqual({ x: W - 30 - LE_HUT, y: 144 })
    expect(viTriThanhHut('phai', 1, 30, 480, W, H, DAY).y).toBe(H - DAY - 480 - LE_HUT)
    expect(viTriThanhHut('trai', 0, 30, 480, W, H, DAY).y).toBe(LE_HUT)
  })
  it('đổi cỡ cửa sổ ⇒ thanh luôn nằm trọn trong màn ở mọi mép, mọi tỉ lệ', () => {
    for (const [w2, h2] of [[1920, 1080], [1366, 768], [1024, 600], [800, 620]]) for (const m of MEP) for (let t = 0; t <= 1; t += 0.125) {
      const ngang = m === 'tren' || m === 'duoi', rong = ngang ? 480 : 30, cao = ngang ? 30 : 480
      const p = viTriThanhHut(m, t, rong, cao, w2, h2, DAY)
      expect(p.x, `${m} ${t} ${w2}`).toBeGreaterThanOrEqual(LE_HUT); expect(p.x + rong).toBeLessThanOrEqual(w2 - LE_HUT)
      expect(p.y, `${m} ${t} ${h2}`).toBeGreaterThanOrEqual(LE_HUT); expect(p.y + cao).toBeLessThanOrEqual(h2 - DAY - LE_HUT)
    }
  })
  it('thanh dài hơn chỗ trống (cửa sổ rất thấp) ⇒ bám đầu mép, không ra số âm', () => {
    expect(viTriThanhHut('phai', 0.9, 30, 480, 900, 400, DAY).y).toBe(LE_HUT)
    expect(viTriThanhHut('tren', 0.9, 480, 30, 300, 400, DAY).x).toBe(LE_HUT)
  })
  it('ghi rồi đọc lại ra đúng mép + tỉ lệ (3 chữ số); tỉ lệ ngoài 0..1 bị kẹp khi ghi', () => {
    expect(ghiNhoThanhHut('phai', 0.41666)).toBe('phai:0.417')
    expect(docNhoThanhHut('phai:0.417')).toEqual({ mep: 'phai', t: 0.417 })
    expect(docNhoThanhHut(ghiNhoThanhHut('duoi', 7))).toEqual({ mep: 'duoi', t: 1 })
    expect(docNhoThanhHut(ghiNhoThanhHut('trai', -2))).toEqual({ mep: 'trai', t: 0 })
  })
  it('bộ nhớ hỏng / thiếu ⇒ null (thanh về mặc định giữa mép trên)', () => {
    for (const s of [null, undefined, '', 'phai', 'phai:', 'giua:0.5', 'tren:abc', 'tren:1.2', 'tren:-0.1', 'tren:0.5:3', '{"mep":"tren"}', 42]) expect(docNhoThanhHut(s), String(s)).toBeNull()
  })
  it('chuỗi JS chạy trên tờ ra ĐÚNG số của bản TS trên cả lưới điểm (một công thức)', () => {
    for (let cx = 0; cx <= W; cx += 97) for (let cy = 0; cy <= H; cy += 61) for (const day of [0, DAY]) expect(HUT.mep(cx, cy, W, H, day), `${cx},${cy}`).toBe(chonMepHut(cx, cy, W, H, day))
    for (const m of MEP) for (let t = 0; t <= 1; t += 0.0625) for (const [w2, h2] of [[1366, 768], [640, 300]]) {
      expect(HUT.viTri(m, t, 480, 30, w2, h2, DAY)).toEqual(viTriThanhHut(m, t, 480, 30, w2, h2, DAY))
      expect(HUT.viTri(m, t, 30, 480, w2, h2, 0)).toEqual(viTriThanhHut(m, t, 30, 480, w2, h2, 0))
      expect(HUT.ghi(m, t * 1.3 - 0.1)).toBe(ghiNhoThanhHut(m, t * 1.3 - 0.1))
    }
    for (const s of ['phai:0.417', 'tren:0', 'duoi:1', 'x:0.5', 'tren:', 'tren:2', '', null]) expect(HUT.doc(s)).toEqual(docNhoThanhHut(s))
  })
})

// ───────────────────────── gắn vào tờ chiếu (JSDOM) ─────────────────────────
const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [], buoc: [] }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 3, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 1 } as OBang)

describe('thanh bút hút mép · chuỗi chèn vào tờ', () => {
  it('ES5, không backtick, không ${ — cùng luật với các đoạn JS khác của tờ', () => {
    for (const js of [JS_LOI_HUT, JS_THANH_HUT]) {
      expect(js).not.toMatch(/`|\$\{/)
      expect(js).not.toMatch(/=>|\b(?:let|const|class)\s/)
    }
  })
  it('nối đúng chỗ: CSS nằm trong CSS bút, JS nằm trong JS bút, và cả hai có trong HTML tờ do taoHtmlMayChieu sinh', () => {
    expect(CSS_BUT_BANG).toContain(CSS_THANH_HUT)
    expect(JS_BUT_BANG).toContain(JS_THANH_HUT)
    const html = taoHtmlMayChieu([o('A', 'An')])
    expect(html).toContain("localStorage.getItem('ddh.but.thanh')")
    expect(html).toContain('function hutDat(co)')
    expect(html).toContain('.mc-but-cu.mc-sang{opacity:1')
  })
  it('dáng: đích bấm ≥ 32 px, nghỉ mờ 0,32, sáng 120 ms, trượt 180 ms, đang viết mờ 0,18 + không bắt chuột (luật cũ thắng), tôn trọng giảm chuyển động', () => {
    expect(CSS_THANH_HUT).toContain('--o:max(32px,')
    expect(CSS_THANH_HUT).toMatch(/\.mc-but-cu\{[^}]*opacity:\.32;transition:opacity \.12s,transform \.18s/)
    expect(CSS_THANH_HUT).toContain('.mc-but-cu.mc-viet{opacity:.18;pointer-events:none}')
    expect(CSS_THANH_HUT.indexOf('.mc-but-cu.mc-viet{')).toBeGreaterThan(CSS_THANH_HUT.indexOf('.mc-but-cu.mc-sang{'))
    expect(CSS_THANH_HUT).toMatch(/@media \(prefers-reduced-motion:reduce\)\{\.mc-but-cu\{transition:none\}\}/)
    expect(CSS_THANH_HUT).toMatch(/\[data-mep=trai\],\.mc-but-cu\[data-mep=phai\]\{flex-direction:column/)
  })
  it('chỉ dùng biến màu sẵn có của tờ (--mc-*); không màu thô (hex / rgb) nào', () => {
    expect(CSS_THANH_HUT).not.toMatch(/#[0-9a-f]{3,8}\b/i)
    expect(CSS_THANH_HUT).not.toMatch(/rgba?\(/)
    for (const b of CSS_THANH_HUT.match(/var\(--[a-z0-9-]+/g) ?? []) expect(['var(--o', 'var(--u', 'var(--mc-b', 'var(--mc-thanh2', 'var(--mc-den', 'var(--mc-vang-noi']).toContain(b)
  })
})

function moTo(nho?: string) {
  const hen: (() => void)[] = []
  const dom = new JSDOM(taoHtmlMayChieu([o('A', 'An'), o('B', 'Bình')]), {
    runScripts: 'dangerously', virtualConsole: new VirtualConsole(), url: 'https://to-chieu.thu/',
    beforeParse(w) {
      if (nho !== undefined) w.localStorage.setItem('ddh.but.thanh', nho)
      w.setTimeout = ((f: () => void, ms?: number) => { if (ms === 1200) hen.push(f); return hen.length || 1 }) as never; w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true })
    },
  })
  const doc = dom.window.document
  const phim = (key: string) => doc.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
  /** Một sự kiện con trỏ giả (JSDOM không có PointerEvent đủ trường). */
  const tro = (dich: EventTarget, loai: string, x: number, y: number, buttons = 1) => {
    const e = new dom.window.MouseEvent(loai, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons })
    for (const [k, v] of Object.entries({ pointerId: 1, pointerType: 'mouse' })) Object.defineProperty(e, k, { value: v })
    dich.dispatchEvent(e)
  }
  const thanh = () => doc.querySelector<HTMLElement>('.mc-but-cu')!
  /** Chạy các hẹn «mờ lại sau 1,2 giây» đang chờ. */
  const quaHenMo = () => { for (const f of hen.splice(0)) f() }
  return { dom, doc, phim, tro, thanh, quaHenMo, nho: () => dom.window.localStorage.getItem('ddh.but.thanh') }
}

describe('thanh bút hút mép · trên tờ thật (JSDOM)', () => {
  it('bộ nhớ trống / hỏng ⇒ bật bút thanh ở mép TRÊN, có toạ độ px; nút Tẩy / Tắt chỉ còn biểu tượng nhưng vẫn có nhãn', () => {
    for (const nho of [undefined, 'hong:9']) {
      const t = moTo(nho)
      t.phim('b')
      expect(t.thanh().getAttribute('data-mep')).toBe('tren')
      expect(t.thanh().style.top).toBe(`${LE_HUT}px`)
      expect(t.thanh().style.left).toMatch(/^\d+px$/)
    }
    const t = moTo(); t.phim('b')
    for (const s of ['[data-tay]', '[data-tat]']) {
      const n = t.thanh().querySelector(s)!
      expect(n.textContent, s).toBe(''); expect(n.querySelector('svg'), s).not.toBeNull(); expect(n.getAttribute('aria-label'), s).toBeTruthy(); expect(n.getAttribute('title'), s).toBe(n.getAttribute('aria-label'))
    }
    expect(t.thanh().querySelectorAll('button')).toHaveLength(14) // 5 màu + 4 cỡ + tẩy, hoàn tác, làm lại, xoá hết, tắt — bút giữ nguyên
  })
  it('đã nhớ mép phải ⇒ tờ dựng lại (đổi câu) thanh vẫn ở mép phải, xếp dọc', () => {
    const t = moTo('phai:0.4'); t.phim('b')
    expect(t.thanh().getAttribute('data-mep')).toBe('phai')
    expect(t.nho()).toBe('phai:0.4')
  })
  it('vừa bật bút ⇒ sáng một nhịp rồi mờ; con trỏ (không đè nút) vào gần ⇒ sáng, rời 1,2 giây ⇒ mờ; đang đè nút viết ngang qua ⇒ không sáng', () => {
    const t = moTo(); t.phim('b')
    expect(t.thanh().classList.contains('mc-sang')).toBe(true)
    t.quaHenMo(); expect(t.thanh().classList.contains('mc-sang')).toBe(false)
    // JSDOM không bố cục ⇒ ô của thanh là 0 × 0 tại (0, 0); vùng nhận = 24 px quanh đó
    t.tro(t.doc, 'pointermove', 10, 10, 0); expect(t.thanh().classList.contains('mc-sang')).toBe(true)
    t.quaHenMo(); expect(t.thanh().classList.contains('mc-sang'), 'còn ở gần thì không mờ').toBe(true)
    t.tro(t.doc, 'pointermove', 300, 300, 0); expect(t.thanh().classList.contains('mc-sang'), 'chưa hết 1,2 giây').toBe(true)
    t.quaHenMo(); expect(t.thanh().classList.contains('mc-sang')).toBe(false)
    t.tro(t.doc, 'pointermove', 10, 10, 1); t.quaHenMo(); expect(t.thanh().classList.contains('mc-sang'), 'đang đè nút').toBe(false)
  })
  it('nhích dưới 4 px không phải kéo (bấm nút vẫn ăn); kéo quá ngưỡng rồi thả gần mép phải ⇒ dính mép phải + nhớ vào ddh.but.thanh', () => {
    const t = moTo(); t.phim('b')
    t.tro(t.thanh(), 'pointerdown', 100, 10); t.tro(t.doc, 'pointermove', 102, 12); t.tro(t.doc, 'pointerup', 102, 12, 0)
    expect(t.thanh().classList.contains('mc-keo')).toBe(false); expect(t.nho()).toBeNull(); expect(t.thanh().getAttribute('data-mep')).toBe('tren')
    t.thanh().querySelector<HTMLButtonElement>('.mc-m[aria-label="Phấn vàng"]')!.click()
    expect(t.thanh().querySelector('.mc-m.mc-chon')!.getAttribute('aria-label')).toBe('Phấn vàng')
    // JSDOM: cửa sổ 1024 × 768, thanh 0 × 0 tại (0, 0) ⇒ tâm sau khi kéo = quãng kéo (980, 300); con trỏ thả ở (990, 310): gần mép phải nhất
    t.tro(t.thanh(), 'pointerdown', 10, 10); t.tro(t.doc, 'pointermove', 500, 200)
    expect(t.thanh().classList.contains('mc-keo')).toBe(true); expect(t.thanh().style.transform).toBe('translate(490px,190px)')
    t.tro(t.doc, 'pointermove', 990, 310); t.tro(t.doc, 'pointerup', 990, 310, 0)
    expect(t.thanh().classList.contains('mc-keo')).toBe(false); expect(t.thanh().style.transform).toBe('')
    expect(t.thanh().getAttribute('data-mep')).toBe('phai')
    expect(t.nho()).toBe(ghiNhoThanhHut('phai', 310 / 768))
    expect(t.thanh().querySelector('.mc-m.mc-chon')!.getAttribute('aria-label'), 'kéo thanh không đổi bút').toBe('Phấn vàng')
  })
  it('cú bấm sinh ra ngay sau khi thả thanh không bấm nhầm vào nút; cú bấm sau đó vẫn bình thường', () => {
    const t = moTo(); t.phim('b')
    const tat = t.thanh().querySelector<HTMLButtonElement>('[data-tat]')!
    t.tro(tat, 'pointerdown', 10, 10); t.tro(t.doc, 'pointermove', 60, 300); t.tro(t.doc, 'pointerup', 60, 300, 0)
    t.thanh().querySelector<HTMLButtonElement>('[data-tat]')!.dispatchEvent(new t.dom.window.MouseEvent('click', { bubbles: true, cancelable: true }))
    expect(t.doc.body.classList.contains('mc-co-but'), 'bút vẫn bật').toBe(true)
    expect(t.thanh().getAttribute('data-mep')).toBe('trai')
    t.thanh().querySelector<HTMLButtonElement>('[data-tat]')!.click()
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(false)
  })
})
