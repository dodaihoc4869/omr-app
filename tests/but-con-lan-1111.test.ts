// BÚT BẬT thì CON LĂN vẫn cuộn đề (thầy 11/11: «Khi bật bút thì con lăn cuộn đề không hoạt động, sửa bật bút con lăn cuộn đề và bảng hoạt động bình thường nhé»).
// GỐC LỖI: bút bật ⇒ lớp bắt con trỏ `canvas.mc-but-song` (cố định, phủ cả cửa sổ) được `pointer-events:auto` nên là ĐÍCH của `wheel`; trình duyệt chỉ tìm khung
// cuộn từ canvas đi lên (body, html) — ô giấy `.mc-vung-de` không nằm trên đường đó — còn trình nghe `wheel` của bút thì bỏ qua mọi chỗ ngoài ô bảng đen.
// Kiểm trên tờ chiếu THẬT trong JSDOM: JSDOM không có bố cục ⇒ giả hộp chữ nhật (đợt = cả cửa sổ, giấy bên trái, cột bảng bên phải) và giả độ cuộn của giấy
// (kẹp đầu / cuối như trình duyệt). Không có canvas thật ⇒ phần vẽ (mực dời theo giấy, từng điểm ảnh) đo bằng Chromium: scripts/but-bang-1011/thu-con-lan-1111.mjs.
import { describe, expect, it } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { taoLoiBut, type NetBut, type SuKienBut } from '../src/lib/but-bang-loi'
import { JS_BUT_BANG } from '../src/lib/but-bang-to-chieu'
import { JS_CUON_GIAY } from '../src/lib/but-cuon-giay-to-chieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

const L = taoLoiBut()
const cau = (id: string) => ({ phan: 'I', id, maDe: '', chuyenDe: 'x', dang: 'x', sao: 1, mucDo: '', text: 'Đề bài.', luaChon: ['Một', 'Hai', 'Ba', 'Bốn'], dapAn: 'B', chot: 'Cốt lõi.', lyDo: [], buoc: [] }) as unknown as OBang['cau']
const o = (sbd: string, hoTen: string): OBang => ({ sbd, hoTen, qid: `DE-I-${sbd}`, soCau: 3, sao: 1, cau: cau(`DE-I-${sbd}`), bacUoc: 2, lop: '12A1', lanLenBang: 1 } as OBang)
type ApiBut = { xuat(): { net: NetBut[] }; nhap(g: { net: NetBut[] }): number; nghe(f: (s: SuKienBut) => void): () => void; cuon(v?: number, em?: boolean): number; trang(): string }

// cửa sổ JSDOM 1024 × 768: giấy đề [20, 60] – [600, 700] (cao 640, nội dung 2000 ⇒ cuộn được 1360) · cột bảng đen [620, 60] – [1004, 700]
const HOP: [string, number[]][] = [['mc-vung-de', [20, 60, 600, 700]], ['mc-cot-lam-bai', [620, 60, 1004, 700]], ['mc-dot', [0, 0, 1024, 768]]]
const CAO_GIAY = 640, TONG_GIAY = 2000, TRAN = TONG_GIAY - CAO_GIAY
const GX = 300, GY = 380, BX = 800, BY = 380

function moTo() {
  const hen: (() => void)[] = []
  const dom = new JSDOM(taoHtmlMayChieu([o('A', 'An'), o('B', 'Bình')]), {
    runScripts: 'dangerously', virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      // hẹn giờ: gom lại, test tự chạy khi cần (giấy ngừng cuộn 0,22 giây ⇒ báo máy em)
      w.setTimeout = ((f: () => void) => { hen.push(f); return hen.length }) as never
      w.clearTimeout = (() => {}) as never
      w.setInterval = (() => 0) as never
      w.HTMLElement.prototype.scrollTo = () => {}
      ;(w as unknown as { matchMedia: unknown }).matchMedia = () => ({ matches: true })
      w.Element.prototype.getBoundingClientRect = function (this: Element) {
        const h = HOP.find(([c]) => this.classList.contains(c)), [l, t, r, b] = h ? h[1] : [0, 0, 0, 0]
        return { left: l, top: t, right: r, bottom: b, width: r - l, height: b - t, x: l, y: t, toJSON() {} } as DOMRect
      }
    },
  })
  const w = dom.window, doc = w.document
  const cv = doc.querySelector<HTMLCanvasElement>('canvas.mc-but-song')!
  const but = (w as unknown as { __mcBut: ApiBut }).__mcBut
  const dot = () => (w as unknown as { __mcDot(): HTMLElement }).__mcDot()
  /** Giấy của đợt đang chiếu: chế độ cuộn + độ cuộn giả (kẹp 0 … TRAN, phát `scroll` như trình duyệt). */
  const giay = () => {
    const v = dot().querySelector<HTMLElement>('.mc-vung-de')!
    if (!(v as unknown as { __gia?: boolean }).__gia) {
      let st = 0
      Object.defineProperty(v, 'scrollTop', { configurable: true, get: () => st, set: (y: number) => { const m = Math.max(0, Math.min(TRAN, Math.round(y))); if (m !== st) { st = m; v.dispatchEvent(new w.Event('scroll')) } } })
      Object.defineProperty(v, 'clientHeight', { configurable: true, get: () => CAO_GIAY })
      Object.defineProperty(v, 'scrollHeight', { configurable: true, get: () => TONG_GIAY })
      ;(v as unknown as { __gia: boolean }).__gia = true
    }
    return v
  }
  const phim = (key: string, them: KeyboardEventInit = {}) => { const e = new w.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...them }); doc.dispatchEvent(e); return e }
  const tro = (loai: string, x: number, y: number, them: Record<string, unknown> = {}) => { const e = new w.MouseEvent(loai, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, buttons: 1 }); for (const [k, v] of Object.entries({ pointerId: 1, pointerType: 'mouse', pressure: 0.5, ...them })) Object.defineProperty(e, k, { value: v }); cv.dispatchEvent(e); return e }
  const lan = (x: number, y: number, dy: number, them: WheelEventInit = {}) => { const e = new w.WheelEvent('wheel', { bubbles: true, cancelable: true, clientX: x, clientY: y, deltaY: dy, deltaMode: 0, ...them }); cv.dispatchEvent(e); return e }
  const chayHen = () => { while (hen.length) hen.shift()!() }
  /** Mở bút, đưa giấy về chế độ cuộn (như khi gọi em lên / mở lời giải). */
  const batBut = () => { const v = giay(); v.classList.add('mc-cuon'); phim('b'); chayHen(); return v }
  return { dom, w, doc, cv, but, giay, phim, tro, lan, chayHen, batBut }
}

describe('con lăn khi BÚT BẬT (thầy 11/11)', () => {
  it('chuỗi JS mới: ES5, không backtick / ${, không trùng tên biến của tờ; trình nghe wheel của bút giao phần giấy cho lanGiay', () => {
    expect(JS_CUON_GIAY).not.toMatch(/`|\$\{/)
    expect(JS_CUON_GIAY).not.toMatch(/=>|\b(?:let|const|class)\s/)
    expect(JS_BUT_BANG).toContain(JS_CUON_GIAY)
    expect(JS_BUT_BANG).toContain('if (!trongBang(e.clientX, e.clientY)) { lanGiay(e); return; }')
  })

  it('bút BẬT · lăn trên GIẤY ⇒ giấy cuộn đúng deltaY (chặn mặc định), kẹp đầu / cuối; bảng đen đứng yên', () => {
    const t = moTo(), v = t.batBut()
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(true)
    const e = t.lan(GX, GY, 300)
    expect(e.defaultPrevented).toBe(true)
    expect(v.scrollTop).toBe(300)
    expect(t.but.cuon()).toBe(0)
    t.lan(GX, GY, 120); expect(v.scrollTop).toBe(420)
    t.lan(GX, GY, 99999); expect(v.scrollTop).toBe(TRAN)
    t.lan(GX, GY, -99999); expect(v.scrollTop).toBe(0)
    // lăn theo dòng (deltaMode 1) cũng cuộn
    t.lan(GX, GY, 3, { deltaMode: 1 }); expect(v.scrollTop).toBeGreaterThan(0)
  })

  it('Ctrl + lăn (thu phóng) để trình duyệt xử lý: không chặn, không cuộn giấy', () => {
    const t = moTo(), v = t.batBut()
    const e = t.lan(GX, GY, 300, { ctrlKey: true })
    expect(e.defaultPrevented).toBe(false)
    expect(v.scrollTop).toBe(0)
  })

  it('giấy đang LẬT TRANG (chờ gọi, chưa ở chế độ cuộn) ⇒ con lăn không đụng (như bút tắt)', () => {
    const t = moTo(), v = t.batBut()
    v.classList.remove('mc-cuon')
    const e = t.lan(GX, GY, 300)
    expect(e.defaultPrevented).toBe(false)
    expect(v.scrollTop).toBe(0)
  })

  it('bút BẬT · lăn trên BẢNG ĐEN ⇒ bảng cuộn như cũ, giấy đứng yên', () => {
    const t = moTo(), v = t.batBut()
    const e = t.lan(BX, BY, 192)
    expect(e.defaultPrevented).toBe(true)
    expect(t.but.cuon()).toBeCloseTo(192 / 768, 5)
    expect(v.scrollTop).toBe(0)
  })

  it('đang ĐÈ BÚT (nét ướt) ⇒ lăn không cuộn giấy, nét không đứt; nhấc bút là cuộn được', () => {
    const t = moTo(), v = t.batBut()
    t.tro('pointerdown', GX - 100, GY, { timeStamp: 1000 }); t.tro('pointermove', GX - 60, GY + 4, { timeStamp: 1010 })
    const e = t.lan(GX, GY, 300)
    expect(e.defaultPrevented).toBe(true) // không để trình duyệt làm gì giữa nét
    expect(v.scrollTop).toBe(0)
    t.tro('pointermove', GX - 20, GY + 2, { timeStamp: 1020 }); t.tro('pointerup', GX - 20, GY + 2, { timeStamp: 1030, buttons: 0 })
    expect(t.but.xuat().net).toHaveLength(1)
    expect(t.but.xuat().net[0].diem).toHaveLength(3) // chạm + 2 mẫu di chuyển (nhấc bút tại chỗ mẫu cuối không thêm điểm)
    t.lan(GX, GY, 300); expect(v.scrollTop).toBe(300)
    // đang đè bút trên bảng: bảng cũng không cuộn
    t.tro('pointerdown', BX - 100, BY, { timeStamp: 2000 }); t.tro('pointermove', BX - 60, BY + 3, { timeStamp: 2010 })
    t.lan(BX, BY, 300); expect(t.but.cuon()).toBe(0)
    t.tro('pointerup', BX - 60, BY + 3, { timeStamp: 2020, buttons: 0 })
  })

  it('bút TẮT: trình nghe của bút không đụng tới con lăn (không chặn, không tự dời giấy) — trình duyệt tự cuộn như xưa', () => {
    const t = moTo(), v = t.giay()
    v.classList.add('mc-cuon')
    expect(t.doc.body.classList.contains('mc-co-but')).toBe(false)
    const e = t.lan(GX, GY, 300)
    expect(e.defaultPrevented).toBe(false)
    expect(v.scrollTop).toBe(0)
  })

  it('NÉT TRÊN GIẤY dính theo giấy: ra ngoài (xuat, máy em) luôn là toạ độ MÀN đang thấy; giấy ngừng cuộn ⇒ báo lại bằng xoa + net-moi có xong (không loại tin mới)', () => {
    const t = moTo(), v = t.batBut(), H = 768
    t.tro('pointerdown', GX - 100, GY, { timeStamp: 1000 }); t.tro('pointermove', GX, GY, { timeStamp: 1010 }); t.tro('pointerup', GX, GY, { timeStamp: 1020, buttons: 0 })
    const y0 = t.but.xuat().net[0].diem[0][1]
    expect(y0).toBeCloseTo(GY / H, 4)
    // máy em: dựng lại mảng nét từ đúng chuỗi sự kiện nó nhận
    const may: NetBut[] = JSON.parse(JSON.stringify(t.but.xuat().net)), sk: SuKienBut[] = []
    t.but.nghe((s) => { if (s.loai !== 'tro') { sk.push(s); L.apSuKien(may, s) } })
    t.lan(GX, GY, 200)
    expect(v.scrollTop).toBe(200)
    expect(t.but.xuat().net[0].diem[0][1]).toBeCloseTo((GY - 200) / H, 4)
    t.chayHen()
    expect(sk.map((s) => s.loai)).toEqual(['xoa', 'net-moi'])
    expect(sk[1]).toMatchObject({ loai: 'net-moi', xong: true, vt: 0 })
    expect(may).toHaveLength(1)
    expect(may[0].diem[0][1]).toBeCloseTo((GY - 200) / H, 4)
    // cuộn tiếp tới khi nét trôi khỏi ô giấy ⇒ không gửi; cuộn về ⇒ gửi lại đúng chỗ cũ
    t.lan(GX, GY, 400); t.chayHen()
    expect(may).toHaveLength(0)
    t.lan(GX, GY, -600); t.chayHen()
    expect(may).toHaveLength(1)
    expect(may[0].diem[0][1]).toBeCloseTo(y0, 4)
    // nét viết khi giấy đang cuộn: máy em thấy ngay đúng chỗ đang viết (them-diem đã trừ độ cuộn)
    t.lan(GX, GY, 300); t.chayHen()
    t.tro('pointerdown', GX - 100, GY + 100, { timeStamp: 3000 }); t.tro('pointermove', GX, GY + 100, { timeStamp: 3010 }); t.tro('pointerup', GX, GY + 100, { timeStamp: 3020, buttons: 0 })
    expect(may).toHaveLength(2)
    expect(may[1].diem.map((d) => d[1])).toEqual(t.but.xuat().net[1].diem.map((d) => d[1]))
    expect(may[1].diem[0][1]).toBeCloseTo((GY + 100) / H, 4)
  })

  it('chờ gọi, giấy đang ở TRANG 2 (chữ dời bằng translateY): nét viết ở đó KHÔNG dính vào giấy ⇒ lúc giấy chuyển sang cuộn, nét không nhảy cả trang', () => {
    const t = moTo(), v = t.batBut(), H = 768
    v.classList.remove('mc-cuon'); (v as unknown as { __trang: number }).__trang = 1
    t.tro('pointerdown', GX - 100, GY, { timeStamp: 1000 }); t.tro('pointermove', GX, GY, { timeStamp: 1010 }); t.tro('pointerup', GX, GY, { timeStamp: 1020, buttons: 0 })
    v.classList.add('mc-cuon'); v.scrollTop = 500; t.chayHen()
    expect(t.but.xuat().net[0].diem[0][1]).toBeCloseTo(GY / H, 4)
  })
})
