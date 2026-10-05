// BI-A · BÀN BI-A MỚI (thầy chốt bản vẽ thử 30/09): điều khiển chạm (kéo bàn xoay gậy, khoá góc khi nhấc, thanh lực có Huỷ 8 %, bánh xe,
// vạch "đủ tới bi"), bỏ đồng hồ ván A.I, bi vẽ theo góc nhìn (em lam đặc / đối thủ sọc đỏ cam), bỏ bảng "Bi của em" ⇒ hàng chấm,
// giải trước = chạm bi của em trên bàn trong lượt người khác, hướng dẫn lần đầu, đổi tay, độ nhạy Chậm.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { act, cleanup, configure, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManChoi from '../src/game/bi-a/ManChoi'
import { datBoGoiBia } from '../src/game/bi-a/api'
import { VanBia, type CauBia } from '../src/game/bi-a/dieu-khien'
import { VanMang } from '../src/game/bi-a/dieu-khien-mang'
import { DO_MOI_PX, HE_NHAY, KHOA_NHA_MS, KeoXoay, LUC_HUY, doChamBanhXe, lucChoQuangDuong, lucThat, quangDuongDung, vachDuToi, viTriTrenThanh } from '../src/game/bi-a/dieu-khien-cham'
import { KHO_DO_NHAY, KHO_HUONG_DAN, KHO_TAY, _quenCaiDatBia } from '../src/game/bi-a/cai-dat-bia'
import { MAU_BI, kieuBi } from '../src/game/bi-a/nguyen-to'
import { veMotBi } from '../src/game/bi-a/ve-bi'
import { R, T, danhBi, dangChay, step, suKienMoi, tocDo, type Ban, type Bi } from '../src/game/bi-a/vat-ly'
import { GIAY_CU } from '../src/game/bi-a/luat'
import { taoTran } from '../src/game/bi-a/tran'

configure({ asyncUtilTimeout: 6000 })
vi.setConfig({ testTimeout: 20000 })
const DEG = Math.PI / 180
const goc = (a: { x: number; y: number }) => Math.atan2(a.y, a.x)
const lechDo = (a: number, b: number) => { let d = (a - b) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d <= -Math.PI) d += 2 * Math.PI; return d / DEG }

// ───────────── hàm thuần ─────────────
describe('kéo trên bàn = xoay gậy (KeoXoay)', () => {
  const c = { x: 250, y: 700 }
  const tren = (d: number, r = 200) => ({ x: c.x + r * Math.cos(d * DEG), y: c.y + r * Math.sin(d * DEG) })
  it('kéo ở chỗ bất kỳ (không cần trúng gậy): góc gậy đổi đúng bằng góc quét quanh bi cái; Chậm = × 0,5', () => {
    for (const [he, mong] of [[HE_NHAY.thuong, 40], [HE_NHAY.cham, 20]] as const) {
      const k = new KeoXoay(), g0 = 0.3
      k.bat(0, 0, 0, tren(10), c, g0)
      let g = g0
      for (let i = 1; i <= 8; i++) { const r = k.keo(i * 16, i * 20, 0, tren(10 + i * 5), c, g, he); if (r !== null) g = r }
      expect(lechDo(g, g0)).toBeCloseTo(mong, 6)
    }
  })
  it('ngón sát bi cái (< 2R) ⇒ bỏ cập nhật, ra khỏi vòng thì neo lại, không giật', () => {
    const k = new KeoXoay()
    k.bat(0, 0, 0, tren(0), c, 0)
    expect(k.keo(16, 10, 0, { x: c.x + R, y: c.y }, c, 0, 1)).toBeNull()
    expect(k.keo(32, 20, 0, tren(90), c, 0, 1)).toBeNull() // neo lại ở 90°, KHÔNG quay 90°
    expect(lechDo(k.keo(48, 30, 0, tren(100), c, 0, 1)!, 0)).toBeCloseTo(10, 6)
  })
  it('vùng chết 3 px: rung < 3 px không đổi góc', () => {
    const k = new KeoXoay()
    k.bat(0, 100, 100, tren(0), c, 0)
    expect(k.keo(16, 102, 101, tren(3), c, 0, 1)).toBeNull()
  })
  it('chuỗi con trỏ có RUNG lúc nhấc ⇒ góc khoá lệch 0° so với góc 80 ms trước khi nhấc', () => {
    const k = new KeoXoay()
    k.bat(0, 0, 0, tren(0), c, 0)
    let g = 0, t = 0
    for (let i = 1; i <= 20; i++) { t = i * 16; const r = k.keo(t, i * 10, 0, tren(i * 2), c, g, 1); if (r !== null) g = r }
    const tNha = t + 120, gocTruoc = g // đứng yên rồi…
    // …rung mạnh trong 70 ms cuối trước khi nhấc
    for (const [dt, d] of [[60, 55], [40, 25], [20, 70], [5, 30]] as const) { const r = k.keo(tNha - dt, 400 + d, 50, tren(d), c, g, 1); if (r !== null) g = r }
    expect(Math.abs(lechDo(g, gocTruoc))).toBeGreaterThan(1) // rung có làm lệch trong lúc kéo
    const kq = k.nha(tNha)
    expect(kq.chamNhanh).toBe(false)
    expect(Math.abs(lechDo(kq.goc, gocTruoc))).toBe(0)
    expect(KHOA_NHA_MS).toBe(80)
  })
  it('chạm nhanh (≤ 200 ms, ≤ 6 px) ⇒ chamNhanh, góc về lúc chạm', () => {
    const k = new KeoXoay()
    k.bat(0, 0, 0, tren(0), c, 1)
    k.keo(50, 4, 0, tren(5), c, 1, 1)
    expect(k.nha(120)).toEqual({ goc: 1, chamNhanh: true })
  })
})

describe('thanh lực: vùng Huỷ 8 %, lực thật giữ dải vật lý', () => {
  it('p < 0,08 ⇒ 0 (không đánh); (p − 0,08)/0,92 kẹp [0,02; 1]; ngược lại khớp', () => {
    expect(LUC_HUY).toBe(0.08)
    expect(lucThat(0)).toBe(0); expect(lucThat(0.079)).toBe(0)
    expect(lucThat(0.54)).toBeCloseTo(0.5, 9); expect(lucThat(1)).toBe(1); expect(lucThat(0.08)).toBe(0.02)
    expect(viTriTrenThanh(0.5)).toBeCloseTo(0.54, 9)
  })
})

describe('bánh xe: 1 px = 0,05°; chạm đầu = ± 0,1°', () => {
  it('hằng số và vùng chạm đầu (1/5 mỗi bên)', () => {
    expect(DO_MOI_PX).toBe(0.05)
    expect(doChamBanhXe(0.1)).toBe(-0.1); expect(doChamBanhXe(0.9)).toBe(0.1); expect(doChamBanhXe(0.5)).toBe(0)
  })
})

describe('vạch vàng "đủ tới bi" — đối chiếu lõi vật lý THẬT', () => {
  const biMoi = (id: Bi['id'], x: number, y: number): Bi => ({ id, x, y, vx: 0, vy: 0, wx: 0, wy: 0, wz: 0, on: true, q: [1, 0, 0, 0], ver: 0 })
  const chay = (L: number, dx: number, luc: number) => {
    const st: Ban = { balls: [biMoi('cue', 250, 850), biMoi('Na', 250 + dx, 850 - L - 2 * R)] }
    const aim = { x: 0, y: -1 }
    const ev = suKienMoi()
    danhBi(st.balls[0]!, aim.x, aim.y, luc, 0, 0)
    for (let i = 0; i < 240 * 20 && dangChay(st); i++) step(st, ev, null)
    return ev.firstHit
  }
  it('quãng đường giải tích khớp mô phỏng một bi (sai số < 1 %)', () => {
    for (const p of [0.03, 0.06, 0.085]) { // thầy 05/10 nhân đôi lực tối đa ⇒ lực nhỏ hơn để bi còn dừng trên bàn
      const st: Ban = { balls: [biMoi('cue', 250, 880)] }, c = st.balls[0]!
      danhBi(c, 0, -1, p, 0, 0)
      const ev = suKienMoi()
      for (let i = 0; i < 240 * 30 && dangChay(st); i++) step(st, ev, null)
      const that = 880 - c.y, tinh = quangDuongDung(tocDo(p))
      expect(tinh).toBeLessThan(850); expect(Math.abs(that - tinh) / that).toBeLessThan(0.01)
    }
  })
  for (const L of [260, 420, 600]) {
    it(`bi đích cách ${L}: bắn đúng lực vạch ⇒ chạm; lực vạch − 0,03 ⇒ không chạm`, () => {
      const st: Ban = { balls: [biMoi('cue', 250, 850), biMoi('Na', 250, 850 - L - 2 * R)] }
      const vach = vachDuToi(st, { x: 0, y: -1 }, () => true)!
      expect(vach).toBeGreaterThan(0.05)
      expect(vach).toBeCloseTo(lucChoQuangDuong(L + 3), 9)
      expect(chay(L, 0, vach)).toBe('Na')
      expect(chay(L, 0, vach - 0.03)).toBeNull()
    })
  }
  it('bi trên đường ngắm không hợp lệ, hoặc không có bi ⇒ ẩn vạch (null)', () => {
    const st: Ban = { balls: [biMoi('cue', 250, 850), biMoi('Na', 250, 400)] }
    expect(vachDuToi(st, { x: 0, y: -1 }, () => false)).toBeNull()
    expect(vachDuToi(st, { x: 1, y: 0 }, () => true)).toBeNull()
  })
})

describe('đồng hồ: ván A.I / giao hữu không hết giờ; online vẫn 30 giây', () => {
  const sk = { moCau() {}, am() {}, gomVa() {}, ketThuc() {} }
  for (const loai of ['ai', 'giao_huu'] as const) {
    it(`ván ${loai}: đứng nhắm 120 giây vẫn là lượt em`, () => {
      const v = new VanBia({ cheDo: 'don', loai, tenEm: 'Em', cauEm: [], chot: null }, sk)
      v.datHen(() => () => {})
      expect(v.coDongHo()).toBe(false)
      for (let i = 0; i < 2400; i++) v.buoc(0.05)
      expect(v.cur).toBe(v.em); expect(v.pha).toBe('aim')
    })
  }
  it('online: VanMang có đồng hồ, đếm lùi; phòng đấu vẫn hẹn 30 giây mỗi cú', () => {
    const tr = taoTran({ van: 'v', cheDo: 'don', loai: 'ban', ghe: [{ ten: 'A', ai: false, sbd: 'S1', bi: {}, chot: null }, { ten: 'B', ai: false, sbd: 'S2', bi: {}, chot: null }], now: 1000 })
    expect(tr.hanCu - 1000).toBeGreaterThanOrEqual(GIAY_CU * 1000)
    expect(GIAY_CU).toBe(30)
    expect(VanMang.prototype.coDongHo.call(Object.create(VanMang.prototype))).toBe(true)
  })
})

describe('kiểu bi theo GÓC NHÌN + màu phân biệt được với mắt mù màu đỏ–lục', () => {
  it('em phe Kim loại ⇒ bi Kim loại kiểu "ta"; em phe Phi kim ⇒ ngược lại; đồng đội cùng phe cùng kiểu; chốt, bi cái riêng', () => {
    expect(kieuBi('Na', 0)).toBe('ta'); expect(kieuBi('Cl', 0)).toBe('dich')
    expect(kieuBi('Na', 1)).toBe('dich'); expect(kieuBi('Cl', 1)).toBe('ta')
    expect(kieuBi('Mg', 0)).toBe(kieuBi('Al', 0)) // đánh đôi: bi đồng đội (cùng phe) cùng kiểu với bi em
    expect(kieuBi('C', 0)).toBe('chot'); expect(kieuBi('C', 1)).toBe('chot'); expect(kieuBi('cue', 0)).toBe('cai')
  })
  // Mô phỏng mù màu đỏ–lục (deuteranopia, Machado 2009, mức 1,0) trên RGB tuyến tính, rồi đo ΔE (CIE76) trong CIELAB.
  const tuyenTinh = (c: number) => { const x = c / 255; return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 }
  const M = [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]]
  const deut = (rgb: readonly number[]) => { const l = rgb.map(tuyenTinh); return M.map((h) => Math.max(0, Math.min(1, h[0]! * l[0]! + h[1]! * l[1]! + h[2]! * l[2]!))) }
  const lab = (l: number[]) => {
    const X = (0.4124 * l[0]! + 0.3576 * l[1]! + 0.1805 * l[2]!) / 0.95047, Y = 0.2126 * l[0]! + 0.7152 * l[1]! + 0.0722 * l[2]!, Z = (0.0193 * l[0]! + 0.1192 * l[1]! + 0.9505 * l[2]!) / 1.08883
    const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
    return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))]
  }
  const dE = (a: number[], b: number[]) => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!)
  it('lam (bi em) và đỏ cam (bi đối thủ): ΔE sau mô phỏng deuteranopia > 40; mỗi màu vẫn tách khỏi nỉ xanh (ΔE > 20)', () => {
    const ta = lab(deut(MAU_BI.ta)), dich = lab(deut(MAU_BI.dich)), ni = lab(deut([27, 145, 124]))
    const d = dE(ta, dich)
    expect(d).toBeGreaterThan(40)
    expect(dE(ta, ni)).toBeGreaterThan(20); expect(dE(dich, ni)).toBeGreaterThan(20)
  })
  it('CSS dùng đúng số màu của bảng MAU_BI (một nguồn)', () => {
    const css = readFileSync('src/game/bi-a/bi-a.css', 'utf8')
    expect(css).toContain(`--b-bi-ta:rgb(${MAU_BI.ta.join(',')})`)
    expect(css).toContain(`--b-bi-dich:rgb(${MAU_BI.dich.join(',')})`)
    expect(css).toContain(`--b-bi-vang:rgb(${MAU_BI.vang.join(',')})`)
  })
  it('bi đã giải trước: vẽ viền vàng mảnh NGOÀI thân bi (r × 1,12), thân bi giữ màu', () => {
    const ghi: { k: string; a: unknown[] }[] = [], st: Record<string, unknown> = {}
    const g = new Proxy({}, { get: (_t, k: string) => (k in st ? st[k] : (...a: unknown[]) => { ghi.push({ k, a }); return { addColorStop() {} } }), set: (_t, k: string, v) => { st[k] = v; ghi.push({ k: `=${k}`, a: [v] }); return true } }) as unknown as CanvasRenderingContext2D
    veMotBi(g, 'ta', 'Fe', 10, true)
    const i = ghi.findIndex((x) => x.k === '=strokeStyle' && x.a[0] === `rgb(${MAU_BI.vang.join(',')})`)
    expect(i).toBeGreaterThan(0)
    expect(ghi.slice(i).some((x) => x.k === 'arc' && Math.abs((x.a[2] as number) - 11.2) < 1e-9)).toBe(true)
    expect(ghi.some((x) => x.k === '=fillStyle' && x.a[0] === `rgb(${MAU_BI.ta.join(',')})`)).toBe(true)
  })
})

// ───────────── giao diện (Testing Library) ─────────────
const cau = (i: number): CauBia => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i}`, choices: [`Đáp án đúng ${i}`, `Nhiễu một ${i}`, `Nhiễu hai ${i}`, `Nhiễu ba ${i}`], ideas: [], hinhAnh: [], dang: 'D', tenDang: `Dạng ${i}`, mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi' } as unknown as CauBia)
const van = () => (window as unknown as { __biaVan: VanBia }).__biaVan
const hop = (w: number, h: number) => ({ x: 0, y: 0, left: 0, top: 0, right: w, bottom: h, width: w, height: h, toJSON: () => ({}) }) as DOMRect
let bayGio = 0
const khung = (w: number, h: number) => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => hop(w, h))
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(w)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(h)
}
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  try { localStorage.clear(); localStorage.setItem('bia_da_xem_huong_dan', '1') } catch { /* */ }
  _quenCaiDatBia()
  bayGio = 1000
  vi.spyOn(performance, 'now').mockImplementation(() => bayGio)
  datBoGoiBia((async (lenh: string, _t: string, d: Record<string, unknown> = {}) => ({ ok: true, ...(lenh === 'answer' ? { correct: d.answer === 'A', answer: 'A', traLoi: d.answer, solution: { chot: 'x' }, solutionImages: [] } : {}) })) as never)
})
afterEach(() => { cleanup(); datBoGoiBia(null); vi.restoreAllMocks(); vi.unstubAllGlobals(); _quenCaiDatBia() })
const ve = () => render(<ManChoi token="tk" tenEm="Khánh Linh" van="v1" session="s1" cheDo="don" loai="ai" cauEm={Array.from({ length: 7 }, (_, i) => cau(i + 1))} chot={cau(9)} onVeSanh={() => {}} onChoiLai={() => {}} />)
/** Toạ độ bàn ⇒ toạ độ màn (bàn dọc 360 × 740: S = 360/552, không xoay). */
const S_DOC = Math.min(360 / 552, 740 / 952)
const man = (x: number, y: number) => ({ clientX: (x + T) * S_DOC, clientY: (y + T) * S_DOC })
const cv = () => document.querySelector('.bia-ban canvas') as HTMLCanvasElement
const cham = (el: Element, loai: 'pointerDown' | 'pointerMove' | 'pointerUp', xy: { clientX: number; clientY: number }, t: number) => { bayGio = t; fireEvent[loai](el, { ...xy, pointerId: 1, pointerType: 'touch', buttons: loai === 'pointerUp' ? 0 : 1 }) }
const lanEm = (v: VanBia) => act(() => { v.isBreak = false; v.cur = v.em; v.pha = 'aim'; v.ballInHand = false; (v as unknown as { doi(): void }).doi() })

describe('màn chơi DỌC 360 × 740', () => {
  beforeEach(() => khung(360, 740))
  it('KHÔNG còn bảng "Bi của em"/ô bi; hàng chấm đúng số bi còn lại, bi đã ăn mờ', async () => {
    const { container } = ve()
    expect(container.querySelector('.bia').getAttribute('data-bo-cuc')).toBe('doc')
    expect(screen.queryByText('Bi của em')).toBeNull()
    expect(screen.queryAllByRole('button', { name: /^Bi (Na|Mg|Al|Fe|Cu|Ag|Au) / })).toHaveLength(0)
    const hai = screen.getByRole('region', { name: 'Hai phe' })
    expect(hai.querySelectorAll('i[data-kieu="ta"]')).toHaveLength(7)
    expect(hai.querySelectorAll('i[data-kieu="dich"]')).toHaveLength(7)
    const v = van()
    await act(async () => { v.bi.Na.an = true; v.bi.Cl.an = true; v.bi.Mg.vang = true; (v as unknown as { doi(): void }).doi() })
    expect(hai.querySelectorAll('i[data-an]')).toHaveLength(2)
    expect(screen.getByLabelText('Phe em còn 6 bi')).toBeTruthy()
    expect(hai.querySelectorAll('i[data-vang]')).toHaveLength(1)
  })
  it('kéo ở chỗ bất kỳ trên bàn (không trúng gậy) ⇒ góc gậy đổi đúng góc quét; Chậm ⇒ một nửa', async () => {
    for (const [doNhay, mong] of [['thuong', 30], ['cham', 15]] as const) {
      KHO_DO_NHAY.dat(doNhay)
      ve()
      const v = van(); await lanEm(v)
      const c = v.bi_('cue'), g0 = goc(v.aim)
      // ngón ở phía TRƯỚC bi cái lệch 60° so với trục gậy (không trúng thân gậy), quét 30°
      const d = (a: number) => man(c.x + 240 * Math.cos(a * DEG), c.y + 240 * Math.sin(a * DEG))
      cham(cv(), 'pointerDown', d(-60), 1000)
      cham(cv(), 'pointerMove', d(-45), 1100)
      cham(cv(), 'pointerMove', d(-30), 1200)
      cham(cv(), 'pointerUp', d(-30), 1400)
      expect(lechDo(goc(v.aim), g0)).toBeCloseTo(mong, 1)
      cleanup()
    }
  })
  it('chạm nhanh vào một bi ⇒ gậy chĩa TÂM bi đó; chạm nhanh chỗ trống ⇒ không đổi', async () => {
    ve()
    const v = van(); await lanEm(v)
    const c = v.bi_('cue'), b = v.bi_('Au')
    cham(cv(), 'pointerDown', man(b.x + 5, b.y + 3), 1000)
    cham(cv(), 'pointerUp', man(b.x + 5, b.y + 3), 1080)
    expect(lechDo(goc(v.aim), Math.atan2(b.y - c.y, b.x - c.x))).toBeCloseTo(0, 6)
    const g1 = goc(v.aim)
    cham(cv(), 'pointerDown', man(60, 820), 2000)
    cham(cv(), 'pointerUp', man(60, 820), 2050)
    expect(goc(v.aim)).toBe(g1)
  })
  it('thanh lực: chạm nhẹ (p < 0,08) ⇒ 0 cú đánh; thả trong vùng Huỷ ⇒ không đánh, góc giữ nguyên (≤ 0,001°)', async () => {
    ve()
    const v = van(); await lanEm(v)
    const luc = screen.getByRole('slider', { name: /Lực đánh/ }), g0 = goc(v.aim), cu = v.soCu, ban = vi.spyOn(v, 'ban')
    // cao thanh 740 ⇒ quãng kéo 666 px; 8 % = 53 px
    fireEvent.pointerDown(luc, { clientX: 5, clientY: 100, pointerId: 7 }); fireEvent.pointerUp(luc, { clientX: 5, clientY: 101, pointerId: 7 })
    fireEvent.pointerDown(luc, { clientX: 5, clientY: 100, pointerId: 7 }); fireEvent.pointerMove(luc, { clientX: 5, clientY: 400, pointerId: 7 })
    await act(async () => { await new Promise((r) => setTimeout(r, 40)) })
    fireEvent.pointerMove(luc, { clientX: 5, clientY: 120, pointerId: 7 }); fireEvent.pointerUp(luc, { clientX: 5, clientY: 120, pointerId: 7 })
    expect(ban).not.toHaveBeenCalled(); expect(v.soCu).toBe(cu); expect(v.pha).toBe('aim')
    expect(Math.abs(lechDo(goc(v.aim), g0))).toBeLessThanOrEqual(0.001)
    expect(luc.querySelector('.huy')!.textContent).toBe('Huỷ')
    // kéo quá vùng Huỷ rồi thả ⇒ đánh
    fireEvent.pointerDown(luc, { clientX: 5, clientY: 100, pointerId: 8 }); fireEvent.pointerMove(luc, { clientX: 5, clientY: 433, pointerId: 8 }); fireEvent.pointerUp(luc, { clientX: 5, clientY: 433, pointerId: 8 })
    expect(ban).toHaveBeenCalledTimes(1); expect(v.soCu).toBe(cu + 1)
  })
  it('thanh lực không nhận thao tác khi đang kéo bi cái', async () => {
    ve()
    const v = van(); await lanEm(v)
    await act(async () => { v.ballInHand = true })
    const c = v.bi_('cue'), ban = vi.spyOn(v, 'ban')
    cham(cv(), 'pointerDown', man(c.x, c.y), 1000)
    const luc = screen.getByRole('slider', { name: /Lực đánh/ })
    fireEvent.pointerDown(luc, { clientX: 5, clientY: 100, pointerId: 9 }); fireEvent.pointerMove(luc, { clientX: 5, clientY: 600, pointerId: 9 }); fireEvent.pointerUp(luc, { clientX: 5, clientY: 600, pointerId: 9 })
    expect(ban).not.toHaveBeenCalled()
  })
  it('bánh xe (ngang dưới bàn): kéo 20 px = 1°; chạm nhanh đầu trái = −0,1°, đầu phải = +0,1°; không còn nút ◀ ▶', async () => {
    ve()
    const v = van(); await lanEm(v)
    expect(screen.queryByRole('button', { name: /Xoay hướng nhắm/ })).toBeNull()
    const xe = screen.getByRole('group', { name: /Bánh xe chỉnh nhỏ/ })
    expect(xe.hasAttribute('data-doc')).toBe(true)
    let g0 = goc(v.aim)
    cham(xe, 'pointerDown', { clientX: 100, clientY: 5 }, 1000); cham(xe, 'pointerMove', { clientX: 120, clientY: 5 }, 1100); cham(xe, 'pointerUp', { clientX: 120, clientY: 5 }, 1300)
    expect(lechDo(goc(v.aim), g0)).toBeCloseTo(1, 6)
    g0 = goc(v.aim)
    cham(xe, 'pointerDown', { clientX: 20, clientY: 5 }, 2000); cham(xe, 'pointerUp', { clientX: 20, clientY: 5 }, 2080) // 20/360 < 1/5
    expect(lechDo(goc(v.aim), g0)).toBeCloseTo(-0.1, 6)
    g0 = goc(v.aim)
    cham(xe, 'pointerDown', { clientX: 350, clientY: 5 }, 3000); cham(xe, 'pointerUp', { clientX: 350, clientY: 5 }, 3050)
    expect(lechDo(goc(v.aim), g0)).toBeCloseTo(0.1, 6)
  })
  it('lượt đối thủ: chạm bi CỦA EM trên bàn ⇒ mở câu giải trước (gợi ý một lần); đúng ⇒ bi vàng', async () => {
    ve()
    const v = van()
    await act(async () => { v.isBreak = false; v.cur = 1; v.pha = 'ai'; (v as unknown as { doi(): void }).doi() })
    expect(await screen.findByText('Trong lượt đối thủ, chạm bi của em để giải trước')).toBeTruthy()
    const b = v.bi_('Al')
    cham(cv(), 'pointerDown', man(b.x, b.y), 1000); cham(cv(), 'pointerUp', man(b.x, b.y), 1100)
    const tam = await screen.findByRole('dialog', { name: /em giải trước/ })
    expect(tam.textContent).toContain('Câu hỏi số 3')
    fireEvent.click(screen.getByRole('button', { name: /Đáp án đúng 3/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Chốt đáp án' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Về bàn' }))
    await waitFor(() => expect(v.bi.Al.vang).toBe(true))
    expect(screen.getByRole('region', { name: 'Hai phe' }).querySelectorAll('i[data-vang]')).toHaveLength(1)
    expect(localStorage.getItem('bia_da_biet_giai_truoc')).toBe('1')
  })
  it('chạm bi ĐỐI THỦ trong lượt đối thủ ⇒ không mở câu', async () => {
    ve()
    const v = van()
    await act(async () => { v.isBreak = false; v.cur = 1; v.pha = 'ai'; (v as unknown as { doi(): void }).doi() })
    const b = v.bi_('Cl')
    cham(cv(), 'pointerDown', man(b.x, b.y), 1000); cham(cv(), 'pointerUp', man(b.x, b.y), 1100)
    expect(screen.queryByRole('dialog')).toBeNull()
  })
  it('đổi tay: Tuỳ chỉnh → Tay cầm Trái ⇒ data-tay="trai" (thanh lực sang mép trái), nhớ theo máy', async () => {
    const { container } = ve()
    expect(container.querySelector('.bia')!.getAttribute('data-tay')).toBe('phai')
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chỉnh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Trái' }))
    expect(container.querySelector('.bia')!.getAttribute('data-tay')).toBe('trai')
    expect(localStorage.getItem(KHO_TAY.khoa)).toBe('trai')
    const css = readFileSync('src/game/bi-a/bi-a.css', 'utf8')
    expect(css).toContain(".bia[data-bo-cuc='doc'][data-tay='trai'] .bia-luc{right:auto;left:7px}")
  })
  it('hướng dẫn lần đầu: 3 bước, chạm để qua, xong thì nhớ; lần sau không hiện; xem lại được ở Tuỳ chỉnh', async () => {
    localStorage.removeItem('bia_da_xem_huong_dan'); _quenCaiDatBia()
    ve()
    const v = van(); await lanEm(v)
    const hd = await screen.findByRole('dialog', { name: 'Hướng dẫn điều khiển' })
    expect(hd.textContent).toContain('Kéo trên bàn để xoay gậy')
    fireEvent.click(hd)
    expect(hd.textContent).toContain('Kéo bánh xe để chỉnh nhỏ')
    fireEvent.click(hd)
    expect(hd.textContent).toContain('Kéo thanh lực xuống rồi thả để đánh')
    fireEvent.click(hd)
    expect(screen.queryByRole('dialog', { name: 'Hướng dẫn điều khiển' })).toBeNull()
    expect(localStorage.getItem(KHO_HUONG_DAN.khoa)).toBe('1')
    cleanup(); ve(); await lanEm(van())
    expect(screen.queryByRole('dialog', { name: 'Hướng dẫn điều khiển' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chỉnh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem lại hướng dẫn' }))
    expect(screen.getByRole('dialog', { name: 'Hướng dẫn điều khiển' })).toBeTruthy()
  })
})

describe('màn chơi NGANG 740 × 360', () => {
  beforeEach(() => khung(740, 360))
  it('bố cục ngang: thanh lực dọc cột phải, bánh xe DỌC, không có "Bi của em", hàng chấm có mặt', () => {
    const { container } = ve()
    const goc0 = container.querySelector('.bia')!
    expect(goc0.getAttribute('data-bo-cuc')).toBe('ngang'); expect(goc0.getAttribute('data-dk')).toBe('phai')
    expect(screen.getByRole('slider', { name: /Lực đánh/ })).toBeTruthy()
    expect(screen.getByRole('group', { name: /Bánh xe chỉnh nhỏ/ }).hasAttribute('data-doc')).toBe(false)
    expect(screen.queryByRole('button', { name: 'Bi của em' })).toBeNull()
    expect(container.querySelector('#bia-ngan')).toBeNull()
    expect(screen.getByRole('region', { name: 'Hai phe' }).querySelectorAll('i')).toHaveLength(14)
  })
  it('bánh xe dọc: kéo xuống 20 px = +1°; tay trái ⇒ thanh lực sang trái (data-dk="trai")', async () => {
    const { container } = ve()
    const v = van(); await lanEm(v)
    const xe = screen.getByRole('group', { name: /Bánh xe chỉnh nhỏ/ }), g0 = goc(v.aim)
    cham(xe, 'pointerDown', { clientX: 5, clientY: 100 }, 1000); cham(xe, 'pointerMove', { clientX: 5, clientY: 120 }, 1100); cham(xe, 'pointerUp', { clientX: 5, clientY: 120 }, 1300)
    expect(lechDo(goc(v.aim), g0)).toBeCloseTo(1, 6)
    await act(async () => KHO_TAY.dat('trai'))
    expect(container.querySelector('.bia')!.getAttribute('data-dk')).toBe('trai')
  })
  it('thanh lực ngang màn: thả trong vùng Huỷ ⇒ không đánh', async () => {
    ve()
    const v = van(); await lanEm(v)
    const luc = screen.getByRole('slider', { name: /Lực đánh/ }), ban = vi.spyOn(v, 'ban')
    fireEvent.pointerDown(luc, { clientX: 5, clientY: 50, pointerId: 3 }); fireEvent.pointerMove(luc, { clientX: 5, clientY: 60, pointerId: 3 }); fireEvent.pointerUp(luc, { clientX: 5, clientY: 60, pointerId: 3 })
    expect(ban).not.toHaveBeenCalled()
  })
  it('hướng dẫn lần đầu cũng hiện ở màn ngang', async () => {
    localStorage.removeItem('bia_da_xem_huong_dan'); _quenCaiDatBia()
    ve(); await lanEm(van())
    expect(await screen.findByRole('dialog', { name: 'Hướng dẫn điều khiển' })).toBeTruthy()
  })
})
