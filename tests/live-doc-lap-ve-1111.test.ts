// @vitest-environment jsdom
// LIVE BẢNG — GIẤY VÀ BẢNG CO GIÃN ĐỘC LẬP (11/11): LỚP VẼ NÉT nhận HAI phép biến đổi (src/components/live/ve-bang.ts, `KhungVe.dl`). Canvas GIẢ (ghi lệnh vẽ).
// Khoá: nét giấy vào lớp chốt của GIẤY theo phép của giấy, nét bảng «b_…» vào canvas trong khung cuộn theo phép của bảng — điểm biết trước ra đúng điểm ảnh;
// đuôi nét dở trên lớp «đang viết» (toạ độ hình) trừ đúng độ cuộn của vùng và cắt theo ô nhìn của vùng; bảng phóng to (tầm nhìn thấp hơn của thầy) ⇒ trôi theo
// bút TRONG tầm nhìn của thầy; em vuốt bảng xem lại thì bảng đứng yên, thôi vuốt thì về chỗ thầy. Bản một-phép-co (không `dl`): tests/but-dong-bo-1111-ve.test.ts.
import { beforeEach, describe, expect, it } from 'vitest'
import { taoLoiBut, type DiemBut, type NetBut } from '../src/lib/but-bang-loi'
import { VUNG_MAC_DINH, khungChieu, maTrang } from '../src/components/live/bo-cuc'
import { boCucDocLap, diemBang, diemGiay, khungVeDL, type BoCucDL } from '../src/components/live/bo-cuc-doc-lap'
import { taoVeBang } from '../src/components/live/ve-bang'

type Lenh = { loai: 'fill' | 'anh' | 'xoa' | 'cat'; T: number[]; duong: number[]; o: number[] }
interface CtxGia { lenh: Lenh[] }
function ctxGia(): CtxGia & Record<string, unknown> {
  const lenh: Lenh[] = []
  let T = [1, 0, 0, 1, 0, 0], duong: number[] = [], o: number[] = []
  const chong: number[][] = []
  const g: CtxGia & Record<string, unknown> = {
    lenh, globalAlpha: 1, globalCompositeOperation: 'source-over', fillStyle: '', strokeStyle: '', lineWidth: 1,
    setTransform: (...a: number[]) => { T = a }, beginPath: () => { duong = []; o = [] }, closePath: () => {}, translate: () => {},
    save: () => { chong.push(T.slice()) }, restore: () => { T = chong.pop() ?? T },
    rect: (...a: number[]) => { o = a }, clip: () => { lenh.push({ loai: 'cat', T: T.slice(), duong: [], o: o.slice() }) },
    moveTo: (x: number, y: number) => { duong.push(x, y) }, lineTo: (x: number, y: number) => { duong.push(x, y) },
    quadraticCurveTo: (a: number, b: number, x: number, y: number) => { duong.push(a, b, x, y) }, bezierCurveTo: (...a: number[]) => { duong.push(...a) },
    arc: (x: number, y: number, r: number) => { duong.push(x - r, y - r, x + r, y + r) }, ellipse: (x: number, y: number, rx: number, ry: number) => { const r = Math.max(rx, ry); duong.push(x - r, y - r, x + r, y + r) },
    fill: () => { lenh.push({ loai: 'fill', T: T.slice(), duong: duong.slice(), o: [] }) }, stroke: () => {},
    drawImage: () => { lenh.push({ loai: 'anh', T: T.slice(), duong: [], o: [] }) }, clearRect: (...a: number[]) => { lenh.push({ loai: 'xoa', T: T.slice(), duong: [], o: a }) },
  }
  return g
}
const ctx = new WeakMap<HTMLCanvasElement, CtxGia>()
beforeEach(() => {
  ;(HTMLCanvasElement.prototype as unknown as { getContext: (this: HTMLCanvasElement) => unknown }).getContext = function () { let g = ctx.get(this); if (!g) { g = ctxGia(); ctx.set(this, g) } return g }
  document.body.innerHTML = ''
})
const L = taoLoiBut(), MAU = 'rgb(244,239,228)', KHONG = { trai: 0, phai: 0, duoi: 0, tren: 0 }
const [G0, G1, G2, G3] = VUNG_MAC_DINH.giay, [B0, B1, B2, B3] = VUNG_MAC_DINH.bang
const TRANG = maTrang('1', VUNG_MAC_DINH, false), KC = khungChieu(VUNG_MAC_DINH, 16 / 9)
/** Máy em 844 × 390, mật độ 1. `tuy`: phần bề ngang của giấy / khung phóng kín. */
function dung(tuy: { chia?: number; phong?: 'giay' | 'bang' | null } = {}) {
  const bc: BoCucDL = boCucDocLap({ w: 844, h: 390, at: KHONG, kc: KC, chia: tuy.chia ?? 0.5, phong: tuy.phong ?? null })
  const tam = document.createElement('div'), khungBang = document.createElement('div'), net = document.createElement('div'), cvChot = document.createElement('canvas'), cvSong = document.createElement('canvas')
  tam.append(cvChot); net.append(cvSong); document.body.append(tam, khungBang, net)
  const v = taoVeBang(L, cvChot, cvSong, khungBang)
  v.datKhung(khungVeDL(bc, KC, 1))
  v.ap({ loai: 'trang', trang: TRANG, tiLe: 16 / 9, net: [] })
  const cuon = khungBang.querySelector<HTMLDivElement>('.lv-cuon')!, cvBang = cuon.querySelector('canvas')!
  const fill = (c: HTMLCanvasElement) => ctx.get(c)!.lenh.filter((x) => x.loai === 'fill')
  return { bc, v, cvChot, cvSong, cvBang, cuon, khungBang, net, fill, lenh: (c: HTMLCanvasElement) => ctx.get(c)!.lenh }
}
/** Nét ngang ngắn quanh (x, y) — tâm hộp bao của đa giác dựng ra nằm đúng (x, y). */
const net = (id: string, x: number, y: number, n = 21): NetBut => ({ id, cong: 'but', mau: MAU, co: 1.7, diem: Array.from({ length: n }, (_, i) => [x + (i - (n - 1) / 2) * 0.001, y, 0.4, i * 5] as DiemBut) })
/** Tâm hộp bao của lệnh tô, đổi ra px của canvas đích. */
const tam = (l: Lenh): [number, number] => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9
  for (let i = 0; i < l.duong.length; i += 2) { const x = l.duong[i]!, y = l.duong[i + 1]!; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y }
  return [l.T[0]! * (x0 + x1) / 2 + l.T[4]!, l.T[3]! * (y0 + y1) / 2 + l.T[5]!]
}
const dich = (e: HTMLElement): [number, number] => { const m = /translate3d\(([-\d.]+)px,\s*([-\d.]+)px/.exec(e.style.transform); return m ? [Number(m[1]), Number(m[2])] : [0, 0] }
const chay = (v: ReturnType<typeof taoVeBang>, n: number, t = 1000) => { for (let i = 0; i < n; i++) v.veSong(t + i * (1000 / 60)); return t + n * (1000 / 60) }

describe('hai phép biến đổi: nét giấy / nét bảng ra đúng điểm ảnh', () => {
  it('lớp chốt của GIẤY = đúng tấm giấy; khung cuộn của BẢNG nằm trong khung bảng (không cạnh lớp «đang viết»), đặt đúng ô bảng đã co, cao bằng khung nhìn', () => {
    const m = dung()
    expect([m.cvChot.width, m.cvChot.height]).toEqual([Math.round(m.bc.tam.w), Math.round(m.bc.tam.h)])
    expect(m.cuon.parentElement).toBe(m.khungBang); expect(m.net.querySelector('.lv-cuon')).toBeNull()
    const o = m.v.cuon().bang
    expect(Math.abs(o.x - (m.bc.bang.x + m.bc.oBang.x))).toBeLessThan(1.5); expect(Math.abs(o.y - m.bc.bang.y)).toBeLessThan(1.5)
    expect(Math.abs(o.w - m.bc.oBang.w)).toBeLessThan(1.5); expect(o.h).toBe(m.bc.bang.h)
    // trong khung bảng, khung cuộn đứng ở (lề trái của ô bảng, 0)
    const [x, y] = dich(m.cuon)
    expect(Math.abs(x - m.bc.oBang.x)).toBeLessThan(1.5); expect(Math.abs(y)).toBeLessThan(1.5)
  })
  it('nét GIẤY đã chốt: điểm (x, y) của thầy ⇒ đúng px trên tấm giấy theo phép của GIẤY; không chạm canvas bảng', () => {
    const m = dung()
    const x = (G0 + G2) / 2, y = G1 + (G3 - G1) * 0.25
    const truocB = m.fill(m.cvBang).length
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('n1', x, y), xong: true })
    const l = m.fill(m.cvChot)[0]!, [px, py] = tam(l), [mx, my] = diemGiay(m.bc, KC, x, y)
    expect(px).toBeCloseTo(mx - (m.bc.giay.x + m.bc.tam.x), 0); expect(py).toBeCloseTo(my - m.bc.giay.y, 0)
    expect(m.fill(m.cvBang).length).toBe(truocB)
    // phép co của giấy: hệ số của canvas = Wv của giấy / 1920
    expect(l.T[0]).toBeCloseTo((KC.Wv * m.bc.sG) / 1920, 6)
  })
  it('nét BẢNG «b_…» đã chốt: ⇒ đúng px trong ô bảng theo phép của BẢNG (khác phép của giấy); không chạm lớp chốt của giấy', () => {
    const m = dung()
    const x = (B0 + B2) / 2, y = B1 + (B3 - B1) * 0.2
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('b_n1', x, y), xong: true })
    expect(m.fill(m.cvChot).length).toBe(0)
    const l = m.fill(m.cvBang)[0]!, [px, py] = tam(l), [mx, my] = diemBang(m.bc, KC, x, y), o = m.v.cuon().bang
    expect(px).toBeCloseTo(mx - o.x, 0); expect(py).toBeCloseTo(my - o.y, 0)
    expect(l.T[0]).toBeCloseTo((KC.Wv * m.bc.sB) / 1920, 6)
    expect(m.bc.sB).not.toBeCloseTo(m.bc.sG, 2)
  })
  it('nét mã THƯỜNG nhưng bắt đầu trong ô bảng đen (bản ghi / máy thầy trước khi có mã «b_») ⇒ vẫn theo phép của BẢNG, vào canvas bảng; bắt đầu trên giấy ⇒ theo giấy', () => {
    const m = dung()
    const x = (B0 + B2) / 2, y = B1 + (B3 - B1) * 0.2
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('n_cu', x, y), xong: true })
    expect(m.fill(m.cvChot).length).toBe(0)
    const [px, py] = tam(m.fill(m.cvBang)[0]!), [mx, my] = diemBang(m.bc, KC, x, y), o = m.v.cuon().bang
    expect(px).toBeCloseTo(mx - o.x, 0); expect(py).toBeCloseTo(my - o.y, 0)
    // nét dở mã thường trên bảng: đuôi cũng theo phép bảng, cây bút cũng vậy
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('n_do', x, y + 0.1), xong: false })
    expect(m.v.toiPx(x, y + 0.1, 'n_do')[0]).toBeCloseTo(diemBang(m.bc, KC, x, y + 0.1)[0], 6)
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('n_giay', 0.3, 0.4), xong: true })
    expect(m.fill(m.cvChot).length).toBeGreaterThan(0)
  })
  it('`toiPx` (cây bút): điểm trên giấy theo phép giấy trừ độ cuộn của GIẤY; điểm trên bảng theo phép bảng trừ độ cuộn của BẢNG', () => {
    const m = dung()
    const [mx, my] = diemGiay(m.bc, KC, 0.3, 0.5)
    expect(m.v.toiPx(0.3, 0.5)[0]).toBeCloseTo(mx, 6); expect(m.v.toiPx(0.3, 0.5)[1]).toBeCloseTo(my, 6)
    m.v.datCuonGiay(60)
    expect(m.v.toiPx(0.3, 0.5)[1]).toBeCloseTo(my - 60, 6)
    const [bx, by] = diemBang(m.bc, KC, 0.8, 0.5)
    expect(m.v.toiPx(0.8, 0.5)[0]).toBeCloseTo(bx, 6); expect(m.v.toiPx(0.8, 0.5)[1]).toBeCloseTo(by, 6) // độ cuộn của giấy không dời điểm trên bảng
    expect(m.v.toiPx(0.3, 0.5, 'b_x')[0]).toBeCloseTo(diemBang(m.bc, KC, 0.3, 0.5)[0], 6) // biết mã nét thì theo mã
  })
})

describe('lớp «đang viết» (một canvas chạy trong cả hình)', () => {
  it('đuôi nét dở trên GIẤY: vẽ ở px hình theo phép giấy TRỪ độ cuộn của giấy, cắt theo ô nhìn của giấy', () => {
    const m = dung({ chia: 0.8 })
    const x = 0.3, y = 0.6
    m.v.datCuonGiay(40)
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('n2', x, y), xong: false })
    m.v.datDau([{ id: 'n2', x: x + 0.012, y }])
    chay(m.v, 1)
    const ds = m.lenh(m.cvSong), cat = ds.filter((l) => l.loai === 'cat').pop()!, to = ds.filter((l) => l.loai === 'fill').pop()!
    const [sx, sy] = dich(m.cvSong), [px, py] = tam(to), [mx, my] = diemGiay(m.bc, KC, x, y)
    expect(Math.abs(px + sx - mx)).toBeLessThan(6); expect(py + sy).toBeCloseTo(my - 40, 0)
    // ô cắt = ô nhìn của giấy (toạ độ lớp sống)
    expect(cat.o[0]! + sx).toBeCloseTo(m.bc.giay.x + m.bc.tam.x, 6); expect(cat.o[1]! + sy).toBeCloseTo(m.bc.giay.y, 6)
    expect(cat.o[2]).toBeCloseTo(m.bc.tam.w, 6); expect(cat.o[3]).toBeCloseTo(m.bc.giay.h, 6)
  })
  it('đuôi nét dở trên BẢNG: theo phép bảng, cắt theo ô nhìn của bảng', () => {
    const m = dung()
    const x = 0.8, y = 0.3
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('b_n3', x, y), xong: false })
    m.v.datDau([{ id: 'b_n3', x: x + 0.012, y }])
    chay(m.v, 1)
    const ds = m.lenh(m.cvSong), cat = ds.filter((l) => l.loai === 'cat').pop()!, to = ds.filter((l) => l.loai === 'fill').pop()!
    const [sx, sy] = dich(m.cvSong), [px, py] = tam(to), [mx, my] = diemBang(m.bc, KC, x, y), o = m.v.cuon().bang
    expect(Math.abs(px + sx - mx)).toBeLessThan(6); expect(py + sy).toBeCloseTo(my, 0)
    expect(cat.o[0]! + sx).toBeCloseTo(o.x, 6); expect(cat.o[2]).toBeCloseTo(o.w, 6); expect(cat.o[3]).toBeCloseTo(o.h, 6)
    // chốt nét ⇒ vào canvas bảng, lớp chốt của giấy vẫn rỗng
    m.v.ap({ loai: 'net-xong', id: 'b_n3' })
    expect(m.fill(m.cvBang).length).toBeGreaterThan(0); expect(m.fill(m.cvChot).length).toBe(0)
  })
})

describe('bảng phóng to: tầm nhìn của máy em thấp hơn của thầy', () => {
  it('biết độ cuộn của thầy mà tầm nhìn THẤP hơn ⇒ trôi theo bút nhưng không ra ngoài tầm nhìn của thầy', () => {
    const m = dung({ phong: 'bang' })
    const caoThay = B3 - B1, nhin = m.bc.bang.h / (KC.Hv * m.bc.sB)
    expect(nhin).toBeLessThan(caoThay * 0.6)
    // bút của thầy ở gần đáy tầm nhìn của thầy (thầy chưa cuộn)
    m.v.datBut({ x: 0.8, y: B1 + caoThay * 0.9, cham: false }, 0)
    chay(m.v, 90)
    const c = m.v.cuon()
    // 13/11: trôi VỪA ĐỦ để bút nằm ở 85 % khung của em (không nhảy cả khúc), vẫn trong tầm nhìn của thầy
    expect(c.dich).toBeCloseTo(caoThay * 0.9 - nhin * 0.85, 2)
    expect(c.dich).toBeLessThanOrEqual(caoThay - nhin + 1e-6)
    expect(c.y).toBeCloseTo(c.dich, 3)
    // bút lên đầu bảng ⇒ về đầu
    m.v.datBut({ x: 0.8, y: B1 + 0.01, cham: false }, 0)
    chay(m.v, 90, 5000)
    expect(m.v.cuon().y).toBeCloseTo(0, 3)
    // thầy cuộn bảng xuống 0,5 mà không viết ⇒ tầm nhìn của em theo vào trong tầm nhìn của thầy
    m.v.datBut(null, 0.5)
    chay(m.v, 90, 9000)
    expect(m.v.cuon().y).toBeGreaterThanOrEqual(0.5 - 1e-6)
  })
  it('tầm nhìn KHÔNG thấp hơn của thầy (khung bảng hẹp) ⇒ soi đúng độ cuộn thầy báo, như bản một-phép-co', () => {
    const m = dung({ chia: 0.8 })
    expect(m.bc.bang.h / (KC.Hv * m.bc.sB)).toBeGreaterThan(B3 - B1)
    m.v.datBut({ x: 0.8, y: 1.4, cham: false }, 0.7)
    chay(m.v, 90)
    expect(m.v.cuon().y).toBeCloseTo(0.7, 3)
  })
})

describe('em tự vuốt bảng xem lại', () => {
  it('vuốt ⇒ tầm nhìn dời đúng số px, bảng THÔI trôi theo bút; thôi vuốt (`null`) ⇒ về chỗ thầy đang viết', () => {
    const m = dung({ phong: 'bang' })
    const Hb = KC.Hv * m.bc.sB
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('b_a', 0.8, 0.2), xong: true })
    m.v.ap({ loai: 'net-moi', trang: TRANG, net: net('b_b', 0.8, 1.6), xong: true })
    let t = chay(m.v, 90)
    const taiThay = m.v.cuon().y
    expect(taiThay).toBeGreaterThan(0.8) // máy em đã trôi tới nét mới nhất
    m.v.vuotBang(-200) // kéo xem lại phần trên
    expect(m.v.cuon().tay).toBe(true); expect(m.v.cuon().y).toBeCloseTo(taiThay - 200 / Hb, 6)
    // thầy viết tiếp ở dưới: bảng của em đứng yên
    m.v.datBut({ x: 0.8, y: 1.62, cham: true, net: 'b_c' }, null)
    t = chay(m.v, 60, t)
    expect(m.v.cuon().y).toBeCloseTo(taiThay - 200 / Hb, 6)
    // không vuốt quá đầu bảng
    m.v.vuotBang(-99999); expect(m.v.cuon().y).toBe(0)
    // không vuốt xuống quá chỗ có nét
    m.v.vuotBang(99999); expect(m.v.cuon().y).toBeLessThan(1.6)
    m.v.vuotBang(null)
    expect(m.v.cuon().tay).toBe(false)
    chay(m.v, 120, t)
    expect(m.v.cuon().y).toBeCloseTo(m.v.cuon().dich, 3)
    expect(Math.abs(m.v.cuon().y - taiThay)).toBeLessThan(0.2)
  })
})
