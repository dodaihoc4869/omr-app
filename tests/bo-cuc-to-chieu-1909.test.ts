// M2 — BỐ CỤC TỜ MÁY CHIẾU ĐO THẬT, KHÔNG BAO GIỜ CUỘN (19/09/2026, 0.Planer giao, thầy chốt).
//
// Hai lớp kiểm:
//   1. THUẬT TOÁN LEO BẬC (`JS_LEO_BAC`, đúng đoạn mã được chép vào tờ chiếu) chạy với một "thước đo" giả, đối chiếu
//      với duyệt vét cạn: kết quả luôn là bố cục THẤP BẬC NHẤT, CHỮ TO NHẤT còn vừa — không bỏ sót, không dừng non.
//   2. MÃ TRONG TỜ (`jsBoCuc`) chạy thật trong JSDOM với một mô hình bố cục giả (JSDOM không có layout): tách đợt đôi
//      khi không vừa, đánh số lại đợt, ghi chú cho thầy, tắt transition lúc đo, đo lại khi đổi cỡ.
// Kiểm chứng BỐ CỤC THẬT (Chrome, 40 câu mẫu ở 1280×720 và 1920×1080) nằm ở `docs/anh-man-chieu-1909/` và sổ việc.
import { describe, it, expect } from 'vitest'
import { JSDOM, VirtualConsole } from 'jsdom'
import { BO_CUC_TO_CHIEU, CSS_BO_CUC, JS_LEO_BAC, leoBacBoCuc, type CauHinhLeoBac, type KetQuaLeoBac } from '../src/lib/bo-cuc-to-chieu'
import { taoHtmlMayChieu, type OBang } from '../src/lib/html-may-chieu'

type Vua = (bac: number, co: number, hinh: number) => boolean
const leo = leoBacBoCuc as (vua: Vua, cfg: CauHinhLeoBac) => KetQuaLeoBac
// Bản CHỮ nhúng vào tờ phải chạy ĐÚNG như bản TS (cùng một nguồn): dựng lại từ chuỗi rồi so kết quả ở các test dưới.
const leoChu = new Function(`${JS_LEO_BAC}; return leoBacBoCuc`)() as (vua: Vua, cfg: CauHinhLeoBac) => KetQuaLeoBac

const CFG: CauHinhLeoBac = {
  coChuan: 30,
  coSan: 16,
  coDay: 12,
  buocCo: BO_CUC_TO_CHIEU.BUOC_CO_PX,
  hinhToiThieu: BO_CUC_TO_CHIEU.HINH_TOI_THIEU,
  buocHinh: BO_CUC_TO_CHIEU.BUOC_HINH,
  batDauOBac: 1,
  coBac3: true,
  toiDaLanDo: BO_CUC_TO_CHIEU.TOI_DA_LAN_DO,
}

/** Duyệt vét cạn theo ĐÚNG thứ tự ưu tiên (LUẬT THẦY 28/09: KHÔNG co chữ — không còn bậc 4/5): bậc thấp trước, hình to trước. */
function vetCan(vua: Vua, cfg: CauHinhLeoBac): { bac: number; co: number; hinh: number } | null {
  const co0 = Math.max(cfg.coChuan, cfg.coSan)
  const ds: [number, number, number][] = []
  if (cfg.batDauOBac === 1) ds.push([1, co0, 1])
  ds.push([2, co0, 1])
  if (cfg.coBac3) for (let h = 1; h > cfg.hinhToiThieu - 1e-9; h = Math.round((h - cfg.buocHinh) * 100) / 100) ds.push([3, co0, h])
  for (const [b, c, h] of ds) if (vua(b, c, h)) return { bac: b, co: c, hinh: h }
  return null
}

// LUẬT THẦY 28/09 (bản vẽ LenBang-Moi): "KHÔNG BAO GIỜ thu nhỏ chữ" — các test cũ về bậc 4 (co chữ từng px), bậc 5 (toàn bảng, đáy
// tuyệt đối, `duoiSan`) và cảnh báo "quá dài" là LUẬT CŨ đã bị thầy thay; nay: không vừa ⇒ bậc 2 ở cỡ chuẩn, `vua=false`, tờ lật
// trang (chờ gọi) / cuộn (đang chữa).
describe('THUẬT TOÁN LEO BẬC (mã thật của tờ chiếu, thước đo giả)', () => {
  it('bản CHỮ nhúng vào tờ là một biểu thức hàm TỰ CHỨA (không tham chiếu tên nào ngoài `vua`/`cfg`)', () => {
    expect(JS_LEO_BAC).toMatch(/^var leoBacBoCuc = \(/)
    expect(JS_LEO_BAC).not.toMatch(/__name|BO_CUC_TO_CHIEU|import\(/)
    expect(leoChu(() => true, CFG)).toEqual(leo(() => true, CFG))
  })

  it('vừa ngay ở bậc 1 ⇒ giữ bậc 1, cỡ chuẩn, hình nguyên', () => {
    const r = leo(() => true, CFG)
    expect(r).toMatchObject({ bac: 1, co: 30, hinh: 1, vua: true, duoiSan: false, soLanDo: 1 })
  })

  it('đợt đã là ĐƠN (batDauOBac = 2) ⇒ KHÔNG bao giờ thử bậc 1', () => {
    const goi: number[] = []
    leo((b) => (goi.push(b), true), { ...CFG, batDauOBac: 2 })
    expect(goi).toEqual([2])
  })

  it('không vừa bậc 1, vừa bậc 2 ⇒ bậc 2 chữ chuẩn', () => {
    expect(leo((b) => b >= 2, CFG)).toMatchObject({ bac: 2, co: 30, hinh: 1, vua: true })
  })

  it('bậc 3: lấy hình LỚN NHẤT còn vừa (0,9 → 0,4), chữ vẫn cỡ chuẩn', () => {
    for (const hMax of [0.9, 0.7, 0.5, 0.4]) {
      const r = leo((b, _c, h) => b >= 3 && h <= hMax + 1e-9, CFG)
      expect(r).toMatchObject({ bac: 3, co: 30, vua: true })
      expect(r.hinh).toBeCloseTo(hMax, 6)
    }
  })

  it('câu KHÔNG có phương án/ý/hình (coBac3 = false) ⇒ bỏ hẳn bậc 3; không vừa ⇒ bậc 2 CỠ CHUẨN, vua=false', () => {
    const goi: number[] = []
    const r = leo((b) => (goi.push(b), false), { ...CFG, coBac3: false })
    expect(goi.includes(3)).toBe(false)
    expect(r).toMatchObject({ bac: 2, co: 30, hinh: 1, vua: false, duoiSan: false })
  })

  it('LUẬT 28/09 — KHÔNG BAO GIỜ thử cỡ chữ nhỏ hơn cỡ chuẩn, không bậc 4/5', () => {
    const co: number[] = []
    const bac: number[] = []
    leo((b, c) => (co.push(c), bac.push(b), false), CFG)
    expect(new Set(co)).toEqual(new Set([30]))
    expect(Math.max(...bac)).toBeLessThanOrEqual(3)
  })

  it('không thứ gì vừa ⇒ bậc 2 ở CỠ CHUẨN, `vua = false`, `duoiSan = false` (tờ lật trang / cuộn — không cảnh báo)', () => {
    expect(leo(() => false, CFG)).toMatchObject({ bac: 2, co: 30, hinh: 1, vua: false, duoiSan: false })
  })

  it('có trần số lần đo (chống vòng lặp vô hạn) và `soLanDo` khớp số lần gọi', () => {
    let n = 0
    const r = leo(() => (n++, false), { ...CFG, toiDaLanDo: 7 })
    expect(n).toBeLessThanOrEqual(8)
    expect(r.soLanDo).toBe(n)
    let m = 0
    const r2 = leo(() => (m++, m === 5), CFG)
    expect(r2.soLanDo).toBe(5)
  })

  it('cỡ chuẩn thấp hơn sàn (màn nhỏ) ⇒ dùng SÀN (không bao giờ dưới sàn)', () => {
    const co: number[] = []
    leo((_b, c) => (co.push(c), false), { ...CFG, coChuan: 10 })
    expect(Math.min(...co)).toBe(CFG.coSan)
  })

  it('ĐỐI CHIẾU VÉT CẠN trên 3.000 thước đo ngẫu nhiên đơn điệu: luôn ra ĐÚNG bố cục thấp bậc nhất; không vừa ⇒ bậc 2 cỡ chuẩn', () => {
    let a = 20260919
    const rnd = () => {
      a |= 0
      a = (a + 0x6d2b79f5) | 0
      let t = Math.imul(a ^ (a >>> 15), 1 | a)
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296
    }
    for (let k = 0; k < 3000; k++) {
      const nen = 0.5 + rnd() * 30
      const hinhTP = rnd() * 0.5
      const chua: Record<number, number> = { 1: 40 + rnd() * 300, 2: 200 + rnd() * 450, 3: 200 + rnd() * 450 }
      const heSo: Record<number, number> = { 1: 1.6, 2: 1.0, 3: 0.82 }
      const vua: Vua = (b, c, h) => nen * c * heSo[b] * (1 - hinhTP + hinhTP * h) <= chua[b]
      const cfg: CauHinhLeoBac = { ...CFG, batDauOBac: rnd() < 0.5 ? 1 : 2, coBac3: rnd() < 0.7 }
      const goc = vetCan(vua, cfg)
      const r = leo(vua, cfg)
      expect(leoChu(vua, cfg)).toEqual(r)
      if (goc) {
        expect(r.vua).toBe(true)
        expect({ bac: r.bac, co: r.co, hinh: +r.hinh.toFixed(2) }).toEqual({ bac: goc.bac, co: goc.co, hinh: +goc.hinh.toFixed(2) })
      } else {
        expect(r).toMatchObject({ bac: 2, co: 30, hinh: 1, vua: false })
      }
    }
  })
})

// ────────────────────── MÃ TRONG TỜ, CHẠY THẬT TRONG JSDOM ──────────────────────
const CAO_TRANG = 659

const cau = (sbd: string, text: string, opt: Partial<OBang['cau']> = {}): OBang => ({
  sbd,
  hoTen: `Em ${sbd}`,
  soCau: 1,
  sao: 1,
  cau: { phan: 'I', id: `Q-${sbd}`, text, luaChon: ['A', 'B', 'C', 'D'], dapAn: 'A', buoc: [], ...opt } as unknown as OBang['cau'],
})
const ngan = (sbd: string) => cau(sbd, 'Câu ngắn')
const dai = (sbd: string, n = 200) => cau(sbd, 'từ '.repeat(n))

/** Mô hình bố cục giả (JSDOM không có layout): chiều cao vùng đề THEO BẬC và chiều cao NỘI DUNG theo độ dài chữ × cỡ chữ. */
function moTo(dsO: OBang[], opt: { rong?: number; dayHoc?: boolean; dsDapAn?: OBang['cau'][] } = {}) {
  const rong = { v: opt.rong ?? 1280 }
  const nhatKy: { luc: string; doBody: boolean }[] = []
  const hen: { f: () => void; ms: number; id: number; huy: boolean }[] = []
  const html = taoHtmlMayChieu(dsO, { dayHoc: opt.dayHoc, dsDapAn: opt.dsDapAn })
  const dom = new JSDOM(html, {
    runScripts: 'dangerously',
    virtualConsole: new VirtualConsole(),
    beforeParse(w) {
      const el = w.HTMLElement.prototype as unknown as Record<string, unknown>
      const bacCua = (dot: Element | null) => Number(/mc-b(\d)/.exec(dot?.className ?? '')?.[1] ?? 1)
      const coCua = (dot: Element | null) => parseFloat((dot as HTMLElement | null)?.style?.getPropertyValue('--mc-co') || '') || 30
      const hinhCua = (dot: Element | null) => parseFloat((dot as HTMLElement | null)?.style?.getPropertyValue('--mc-hinh') || '') || 1
      const laVung = (e: Element) => e.classList?.contains('mc-vung-de')
      Object.defineProperty(el, 'clientHeight', {
        configurable: true,
        get(this: HTMLElement) {
          if (this.id === 'mc-ray' || this.classList.contains('mc-dot')) return CAO_TRANG
          if (laVung(this)) {
            const dot = this.closest('.mc-dot')
            const b = bacCua(dot)
            const H = CAO_TRANG - 20
            if (b === 1) return H - 90 - 30 - Math.round(0.3 * CAO_TRANG) - 50
            if (b === 5) return H - 90 - 10
            return H
          }
          return 0
        },
      })
      Object.defineProperty(el, 'clientWidth', {
        configurable: true,
        get(this: HTMLElement) {
          if (this.id === 'mc-ray') return rong.v
          if (laVung(this)) {
            const b = bacCua(this.closest('.mc-dot'))
            const kn = b === 1 ? (rong.v - 30) / 2 : b === 5 ? rong.v - 20 : ((rong.v - 30) * 2) / 3
            return Math.round(kn - 44)
          }
          return 0
        },
      })
      Object.defineProperty(el, 'scrollHeight', {
        configurable: true,
        get(this: HTMLElement) {
          if (!laVung(this)) return 0
          const dot = this.closest('.mc-dot')
          const co = coCua(dot)
          nhatKy.push({ luc: 'do', doBody: w.document.body.classList.contains('mc-do') })
          const L = (this.querySelector('.mc-than')?.textContent ?? '').length
          const cw = (this as HTMLElement).clientWidth || 300
          const dong = Math.ceil((L * co * 0.52) / cw)
          const b = bacCua(dot)
          const chia = b >= 3 ? 0.85 : 1
          return Math.round(dong * co * 1.5 * chia * (b >= 3 ? 0.5 + 0.5 * hinhCua(dot) : 1)) + 30
        },
      })
      Object.defineProperty(el, 'scrollWidth', { configurable: true, get(this: HTMLElement) { return this.clientWidth } })
      let id = 0
      w.setTimeout = ((f: () => void, ms: number) => (hen.push({ f, ms, id: ++id, huy: false }), id)) as never
      w.clearTimeout = ((h: number) => {
        const x = hen.find((t) => t.id === h)
        if (x) x.huy = true
      }) as never
      w.setInterval = (() => 0) as never
      w.clearInterval = (() => {}) as never
      w.HTMLElement.prototype.scrollTo = () => {}
    },
  })
  const w = dom.window as unknown as Window & typeof globalThis
  const doc = dom.window.document
  const dot = () => [...doc.querySelectorAll<HTMLElement>('#mc-ray > .mc-dot')].filter((d) => !d.classList.contains('mc-dot-da'))
  const chayHen = () => {
    for (const t of hen.filter((x) => !x.huy)) {
      t.huy = true
      t.f()
    }
  }
  return { dom, doc, w, dot, rong, nhatKy, hen, chayHen, html }
}

// SỬA CÓ CHỦ Ý 28/09 (bản vẽ Lên bảng): BỎ ĐỢT ĐÔI — tờ dựng sẵn mỗi đợt MỘT câu MỘT em (2/3 + 1/3), nên không còn "giữ đợt đôi"
// hay "tách đợt đôi". Khoá: đợt nào cũng đơn, không bao giờ bậc 1 (nửa bảng), không tách, bộ đếm đúng số em.
describe('mã trong tờ — mỗi đợt MỘT em (bỏ đợt đôi)', () => {
  it('hai câu ngắn ⇒ HAI đợt đơn ngay từ đầu, không tách, không bậc 1; bố cục chạy xong', () => {
    const t = moTo([ngan('A'), ngan('B')])
    const d = t.dot()
    expect(d).toHaveLength(2)
    expect(d.every((x) => x.classList.contains('mc-dot-don'))).toBe(true)
    expect(d.every((x) => x.querySelectorAll('.mc-nua').length === 1)).toBe(true)
    expect(d.every((x) => !x.hasAttribute('data-tach'))).toBe(true)
    expect(d.every((x) => Number(x.getAttribute('data-bac')) >= 2)).toBe(true)
    expect(d[0].textContent).toContain('Em A')
    expect(d[1].textContent).toContain('Em B')
    expect(t.doc.body.classList.contains('mc-bc')).toBe(true)
    expect(t.doc.body.getAttribute('data-bo-cuc')).toBe('xong')
  })

  it('bộ đếm "Đợt k/n" và nút Đợt sau: bốn em ⇒ bốn đợt', () => {
    const t = moTo([cau('A', 'từ '.repeat(75)), cau('B', 'từ '.repeat(75)), ngan('C'), ngan('D')])
    const n = t.dot().length
    expect(n).toBe(4)
    expect(t.doc.getElementById('mc-dem')!.textContent).toBe(`Đợt 1/${n}`)
    for (let i = 0; i < 3; i++) t.doc.getElementById('mc-sau')!.click()
    expect(t.doc.getElementById('mc-dem')!.textContent).toBe(`Đợt 4/${n}`)
    expect((t.doc.getElementById('mc-sau') as HTMLButtonElement).disabled).toBe(true)
  })

  it('chế độ dạy học: mỗi đợt mang GIỜ của đúng câu mình (data-giay = data-seconds)', () => {
    const t = moTo([cau('A', 'từ '.repeat(75)), cau('B', 'từ '.repeat(75))], { dayHoc: true })
    const d = t.dot()
    expect(d).toHaveLength(2)
    for (const x of d) {
      const g = x.querySelector('.mc-nua')!.getAttribute('data-giay')!
      expect(Number(g)).toBeGreaterThanOrEqual(60)
      expect(x.getAttribute('data-seconds')).toBe(g)
    }
  })
})

describe('mã trong tờ — đợt ĐƠN leo bậc', () => {
  const bacCua = (sbd: string, n: number, opt: Partial<OBang['cau']> = {}) => {
    const t = moTo([cau(sbd, 'từ '.repeat(n), opt)])
    const d = t.dot()[0]
    return { t, d, bac: Number(d.getAttribute('data-bac')), co: Number(d.getAttribute('data-co')), vua: d.getAttribute('data-vua') }
  }

  it('câu vừa 2/3 ⇒ bậc 2 (cỡ chuẩn 30 px ở 1280)', () => {
    const r = bacCua('A', 130)
    expect(r.bac).toBe(2)
    expect(r.co).toBe(30)
  })

  it('câu dài hơn ⇒ bậc 3 (chia cột) hoặc giữ bậc 2 — cỡ chữ LUÔN là cỡ chuẩn (luật 28/09: không co chữ)', () => {
    const r = bacCua('A', 300)
    expect([2, 3]).toContain(r.bac)
    expect(r.co).toBe(30)
    expect(r.d.style.getPropertyValue('--mc-co')).toBe('30px')
  })

  it('câu RẤT dài ⇒ vẫn 2/3 bảng (bậc 2, không toàn bảng), cỡ chuẩn, KHÔNG ghi chú cảnh báo — tờ lật trang / cuộn', () => {
    const r = bacCua('A', 1500)
    expect(r.bac).toBe(2)
    expect(r.co).toBe(30)
    expect(r.vua).toBe('0')
    expect(r.d.classList.contains('mc-b5')).toBe(false)
    expect(r.d.querySelector('.mc-ghi-chu')).toBeNull()
  })

  it('ghi chú của đợt đang hiện nằm ở Ô CHỮ của thanh dưới (không vẽ đè lên đề); đợt không ghi chú thì để trống', () => {
    // Bỏ đợt đôi (28/09) ⇒ tờ không tự sinh ghi chú "tách" nữa: gắn tay một ghi chú vào đợt đang hiện rồi báo bố cục xong.
    const co = moTo([cau('A', 'từ '.repeat(75)), cau('B', 'từ '.repeat(75))])
    const phu = co.doc.querySelector('.mc-thanh-phu')!
    const gc = co.doc.createElement('div')
    gc.className = 'mc-ghi-chu'
    gc.textContent = 'Ghi chú thử của đợt 1'
    co.dot()[0].appendChild(gc)
    co.doc.dispatchEvent(new co.w.CustomEvent('mc-bo-cuc-xong'))
    const chu = co.dot()[0].querySelector('.mc-ghi-chu')!.textContent
    expect(phu.textContent).toBe(chu)
    expect(phu.getAttribute('data-ghi-chu')).toBe('thong-tin')
    const khong = moTo([ngan('A'), ngan('B')])
    const phuKhong = khong.doc.querySelector('.mc-thanh-phu')!
    expect(khong.dot()[0].querySelector('.mc-ghi-chu')).toBeNull()
    expect(phuKhong.textContent).toBe('')
    expect(phuKhong.hasAttribute('data-ghi-chu')).toBe(false)
    // đo lại (đổi cỡ, đổi cửa sổ…) làm ghi chú BIẾN MẤT ⇒ ô chữ trả về giờ pha kế, không kẹt chữ cũ
    co.dot()[0].querySelector('.mc-ghi-chu')!.remove()
    co.doc.dispatchEvent(new co.w.CustomEvent('mc-bo-cuc-xong'))
    expect(phu.textContent).toBe('')
    expect(phu.hasAttribute('data-ghi-chu')).toBe(false)
  })

  it('ghi chú nguồn trong đợt KHÔNG được vẽ (display: none) — không lấn vùng đề, không đổi bề cao vùng đo', () => {
    expect(CSS_BO_CUC).toMatch(/\n\.mc-ghi-chu \{ display: none; \}/)
    expect(CSS_BO_CUC).not.toMatch(/\.mc-ghi-chu \{[^}]*position: absolute/)
  })

  it('câu dài tới mức KHÔNG vừa nổi ⇒ data-vua = 0 (tờ lật trang), KHÔNG cảnh báo "quá dài" (luật 28/09)', () => {
    const r = bacCua('A', 5000)
    expect(r.vua).toBe('0')
    expect(r.d.querySelector('.mc-ghi-chu')).toBeNull()
    expect(r.t.doc.body.innerHTML).not.toMatch(/quá dài để vừa bảng/)
  })

  it('MỌI đợt: cỡ chữ = cỡ chuẩn; không vừa thì đánh dấu data-vua = 0 cho lớp lật trang', () => {
    for (const n of [5, 40, 80, 130, 200, 300, 400, 500, 800, 1300, 1500, 5000]) {
      const r = bacCua('A', n)
      expect(['1', '0']).toContain(r.vua ?? '1')
      expect(r.co).toBe(30)
    }
  }, 60000)

  it('ảnh/bảng/phương án ⇒ cho phép bậc 3; câu không có gì để chia cột thì bỏ bậc 3', () => {
    const co = bacCua('A', 300).d.querySelector('.mc-vung-de .mc-ds-pa') !== null
    expect(co).toBe(true) // câu Phần I có phương án ⇒ có bậc 3
    const t = moTo([{ ...cau('B', 'từ '.repeat(300)), cau: { ...cau('B', 'từ '.repeat(300)).cau, phan: 'III', luaChon: null } as OBang['cau'] }])
    expect(t.dot()[0].querySelector('.mc-vung-de .mc-ds-pa')).toBeNull()
    expect(Number(t.dot()[0].getAttribute('data-bac'))).toBe(2)
  })
})

describe('mã trong tờ — an toàn khi đo', () => {
  it('TẮT transition/animation trong lúc đo (body.mc-do) và BẬT lại ngay sau đó', () => {
    const t = moTo([dai('A', 130)])
    expect(t.nhatKy.length).toBeGreaterThan(0)
    expect(t.nhatKy.every((x) => x.doBody)).toBe(true)
    expect(t.doc.body.classList.contains('mc-do')).toBe(false)
    expect(CSS_BO_CUC).toMatch(/body\.mc-do \*[^{]*\{[^}]*transition: none !important[^}]*animation: none !important/)
  })

  it('thẻ tên đang ẨN (đếm ngược dạy học) vẫn được đo như HIỆN, rồi trả về ẨN đúng như cũ', () => {
    const t = moTo([ngan('A'), ngan('B')], { dayHoc: true })
    const ems = [...t.doc.querySelectorAll<HTMLElement>('.mc-em')]
    expect(ems.length).toBe(2)
    for (const e of ems) e.hidden = true
    t.w.__mcBoCuc.chay()
    for (const e of ems) expect(e.hidden).toBe(true)
  })

  it('lời giải ĐANG MỞ không làm sai phép đo và vẫn còn mở sau khi đo', () => {
    const t = moTo([dai('A', 130)])
    const giai = t.doc.querySelector<HTMLElement>('.mc-giai')!
    giai.hidden = false
    t.w.__mcBoCuc.chay()
    expect(giai.hidden).toBe(false)
  })

  it('ĐO LẠI khi đổi cỡ cửa sổ (gộp nhiều sự kiện một lần đo): màn nhỏ hơn ⇒ chữ chuẩn nhỏ hơn', () => {
    const t = moTo([dai('A', 130)])
    const co1280 = Number(t.dot()[0].getAttribute('data-co'))
    t.rong.v = 960
    for (let i = 0; i < 5; i++) t.w.dispatchEvent(new t.w.Event('resize'))
    expect(t.hen.filter((h) => !h.huy)).toHaveLength(1) // 5 sự kiện, 1 lần hẹn (đã gộp)
    t.chayHen()
    expect(Number(t.dot()[0].getAttribute('data-co'))).toBeLessThan(co1280)
  })

  it('khung đang ẨN (clientHeight = 0) ⇒ KHÔNG đo, không đổi gì (đợi khi hiện lại)', () => {
    const html = taoHtmlMayChieu([ngan('A'), ngan('B')])
    const dom = new JSDOM(html, { runScripts: 'dangerously', virtualConsole: new VirtualConsole(), beforeParse: (w) => (w.HTMLElement.prototype.scrollTo = () => {}) })
    const d = dom.window.document.querySelector('.mc-dot')!
    expect(d.hasAttribute('data-bac')).toBe(false)
    expect(dom.window.document.body.classList.contains('mc-do')).toBe(false)
  })

  it('trang đáp án KHÔNG bị đụng', () => {
    const dsDapAn = Array.from({ length: 5 }, (_, i) => ({ phan: 'I', id: `D${i}`, text: 'x', luaChon: ['a', 'b', 'c', 'd'], dapAn: 'A', buoc: [], chot: '' })) as unknown as OBang['cau'][]
    const t = moTo([ngan('A')], { dsDapAn })
    const da = t.doc.querySelector('.mc-dot-da')!
    expect(da.hasAttribute('data-bac')).toBe(false)
    expect(da.className).toBe('mc-dot mc-dot-da')
  })
})

// LUẬT 28/09: vùng đề CẮT (overflow hidden) khi CHỜ GỌI — lật trang; chỉ CUỘN khi đang chữa (lớp bản vẽ thêm lớp `.mc-cuon`).
describe('CSS — vùng đề cắt khi chờ gọi (lật trang), chỉ cuộn khi đang chữa', () => {
  const html = taoHtmlMayChieu([ngan('A'), ngan('B')])
  it('`.mc-nua` không còn `overflow-y: auto`', () => {
    expect(html).not.toMatch(/\.mc-nua\s*\{[^}]*overflow-y:\s*auto/)
    expect(html).toMatch(/\.mc-nua \{[^}]*overflow: hidden/)
  })

  it('vùng đề `.mc-vung-de` cắt chứ không cuộn (overflow hidden), và không có `overflow: auto/scroll` nào áp cho nó', () => {
    expect(CSS_BO_CUC).toMatch(/\.mc-vung-de \{[^}]*overflow: hidden/)
    expect(CSS_BO_CUC).not.toMatch(/\.mc-vung-de\s*\{[^}]*overflow(-y)?:\s*(auto|scroll)/)
  })

  it('lời giải (luật 28/09) nằm NGAY DƯỚI ĐỀ trong vùng 2/3, không còn lớp phủ; chỉ cuộn khi đang chữa', () => {
    expect(html).toContain('body.mc-bc .mc-vung-de>.mc-giai{position:static;inset:auto;overflow:visible')
    expect(html).toContain('body.mc-bc .mc-vung-de.mc-cuon{overflow-y:auto!important')
  })

  it('bản in giữ nguyên: vùng đề hiện đủ, ghi chú ẩn', () => {
    expect(CSS_BO_CUC).toMatch(/@media print \{[^}]*\.mc-vung-de \{?[^}]*overflow: visible/)
    expect(CSS_BO_CUC).toMatch(/\.mc-ghi-chu \{ display: none; \}/)
  })

  it('markup: MỖI ô em có `.mc-vung-de` bọc đề và lời giải; `.mc-trang` vẫn còn nguyên', () => {
    const doc = new JSDOM(html).window.document
    for (const nua of doc.querySelectorAll('.mc-nua:not(.mc-trong)')) {
      expect(nua.querySelector('.mc-vung-de > .mc-than')).toBeTruthy()
      expect(nua.querySelector('.mc-vung-de > .mc-giai[hidden]')).toBeTruthy()
      expect(nua.querySelector('.mc-giai-vung > .mc-nut-giai')).toBeTruthy()
      expect(nua.querySelector('.mc-trang')).toBeTruthy()
    }
  })

  it('cỡ chữ chuẩn = 30 px ở 1280, sàn = 24 px ở 1920 (quy đổi theo bề ngang)', () => {
    expect(Math.round(1280 * BO_CUC_TO_CHIEU.CO_CHUAN_TL_RONG)).toBe(30)
    expect(Math.round(1920 * BO_CUC_TO_CHIEU.CO_SAN_TL_RONG)).toBe(24)
    expect(Math.round(1280 * BO_CUC_TO_CHIEU.CO_SAN_TL_RONG)).toBe(16)
  })
})
