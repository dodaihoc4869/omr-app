// @vitest-environment jsdom
// MOL SỐNG ĐỘNG (thầy chốt 02/11: «Chốt Mol sống động và hiệu ứng gắn luôn vào app, đảm bảo máy siêu yếu cũng hoạt động được, tải luôn hiệu ứng sẵn cho máy yếu»).
// Khoá: (1) CHẾ ĐỘ — máy yếu gọn (30 khung/giây, ≤ 1/3 hạt, không dõi mắt liên tục, không kéo, nhàn rỗi 0 hoạt ảnh CSS), giảm chuyển động chỉ chuyển mặt,
// cỡ < 64 px không vòng JS; (2) VÒNG KHUNG chỉ chạy khi hiện trên màn + tab mở + còn việc, tự tắt khi lò xo lắng, khuất / ẩn tab ⇒ tắt ngay;
// (3) CHUYỂN TRỘN — đổi mặt là mọi số chạy về bộ số mới qua lò xo (đi qua giữa, không cắt cảnh), lắng đúng đích; (4) trao tay CSS ⇄ JS không giật
// (cùng hàm sóng, đọc lại ma trận); (5) nạp trước mảnh Mol lúc rảnh, mảnh ngoài precache.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  CUOI, GOC, Lo, MAT, SONG_LAMBDA, THONG_SO, TEN_MAT, cheDoMol, chuKySong, daLang, datDich, denLuotVe, docBo, duongSongRong, mucNuoc, nenChay, soHat, tachMaTran,
  taoBoLo, tienLo, tronMat,
} from '../src/components/linh-vat/mol-lo-xo'
import { MOL_DANG_SONG, _demMol, svgMol, taoLua } from '../src/components/linh-vat/mol-dong'

afterEach(() => { for (const l of [...MOL_DANG_SONG]) l.huy(); vi.useRealTimers(); vi.unstubAllGlobals(); document.body.innerHTML = ''; document.documentElement.classList.remove('may-yeu') })

describe('chế độ Mol (máy thường · máy yếu · giảm chuyển động · cỡ nhỏ)', () => {
  it('chọn chế độ: cỡ nhỏ trước, giảm chuyển động / không rAF ⇒ tĩnh, máy yếu ⇒ gọn', () => {
    expect(cheDoMol({ mayYeu: false, giamChuyenDong: false, nho: false })).toBe('day-du')
    expect(cheDoMol({ mayYeu: true, giamChuyenDong: false, nho: false })).toBe('gon')
    expect(cheDoMol({ mayYeu: true, giamChuyenDong: true, nho: false })).toBe('tinh')
    expect(cheDoMol({ mayYeu: false, giamChuyenDong: false, nho: false, coRaf: false })).toBe('tinh')
    expect(cheDoMol({ mayYeu: true, giamChuyenDong: true, nho: true })).toBe('nho')
  })
  it('máy yếu: 30 khung/giây, ≤ 1/3 hạt, mắt chỉ nhìn khi chạm, không kéo, nhàn rỗi không hoạt ảnh CSS (chớp bằng hẹn giờ)', () => {
    const g = THONG_SO.gon, d = THONG_SO['day-du']
    expect(g.khungMs).toBe(33); expect(d.khungMs).toBe(0)
    expect(g.hatToiDa).toBeLessThanOrEqual(d.hatToiDa / 3); expect(soHat(8, 'gon')).toBe(3); expect(soHat(8, 'day-du')).toBe(8); expect(soHat(2, 'gon')).toBe(1)
    expect(g.doiMat).toBe(false); expect(g.keo).toBe(false); expect(g.cssNhanRoi).toBe(false); expect(g.chopHen).toBe(true)
    expect(THONG_SO.tinh.nay).toBe(false); expect(THONG_SO.tinh.hatToiDa).toBe(0); expect(soHat(8, 'tinh')).toBe(0)
    expect(THONG_SO.nho.vong).toBe(false)
    // 30 khung/giây: khung rAF cách khung vẽ trước < ~29 ms thì bỏ
    expect(denLuotVe('gon', 1016, 1000)).toBe(false); expect(denLuotVe('gon', 1033, 1000)).toBe(true); expect(denLuotVe('day-du', 1016, 1000)).toBe(true)
  })
  it('vòng chỉ chạy khi đang hiện + tab mở + chế độ có vòng + còn việc', () => {
    const co = { hien: true, tabMo: true, cheDo: 'day-du' as const, conViec: true }
    expect(nenChay(co)).toBe(true)
    expect(nenChay({ ...co, hien: false })).toBe(false)
    expect(nenChay({ ...co, tabMo: false })).toBe(false)
    expect(nenChay({ ...co, conViec: false })).toBe(false)
    expect(nenChay({ ...co, cheDo: 'nho' })).toBe(false)
    expect(nenChay({ ...co, cheDo: 'gon' })).toBe(true)
  })
})

describe('lò xo + chuyển trộn cảm xúc (hàm thuần)', () => {
  it('lò xo về đích; tắt yếu thì nảy quá đích, giảm chuyển động (độ tắt ≥ 1) thì không nảy', () => {
    const a = new Lo(0, 250, 0.3), b = new Lo(0, 250, 0.3)
    a.t = b.t = 1
    let maxA = 0, maxB = 0
    for (let i = 0; i < 120; i++) { tienLo([a], 1 / 60); tienLo([b], 1 / 60, 1); maxA = Math.max(maxA, a.v); maxB = Math.max(maxB, b.v) }
    expect(maxA).toBeGreaterThan(1.05); expect(maxB).toBeLessThanOrEqual(1.0001)
    expect(daLang([a, b], 0.01)).toBe(true)
  })
  it('đủ 15 mặt; mặt nào cũng đủ bộ số; cười khúc khích = mắt cung + miệng to', () => {
    expect(TEN_MAT).toHaveLength(15)
    for (const m of TEN_MAT) for (const k in GOC) expect(Number.isFinite(MAT[m][k]), `${m}.${k}`).toBe(true)
    expect(CUOI.eoL).toBe(0); expect(CUOI.arcL).toBe(1); expect(CUOI.md).toBeGreaterThan(MAT.vui.md!)
    const a = tronMat('vui', 'cau', 0), b = tronMat('vui', 'cau', 1)
    for (const k in GOC) { expect(a[k], k).toBeCloseTo(MAT.vui[k]!, 9); expect(b[k], k).toBeCloseTo(MAT.cau[k]!, 9) }
    expect(tronMat('vui', 'ratCau', 0.5).gian).toBe(2)
  })
  it('vui → rất cáu: mọi số đi QUA GIỮA (trộn, không cắt cảnh) rồi lắng đúng đích trong ≤ 4 s; màu giận (chậm) theo sau mắt (nhanh)', () => {
    const lo = taoBoLo('vui')
    datDich(lo, 'ratCau')
    tienLo(Object.values(lo), 0.08)
    const giua = docBo(lo)
    for (const k of ['lidL', 'ngL', 'psz', 'gian', 'nut', 'lua']) {
      const a = MAT.vui[k]!, b = MAT.ratCau[k]!
      expect(giua[k], k).not.toBeCloseTo(a, 3); expect(giua[k], k).not.toBeCloseTo(b, 2)
    }
    expect(Math.abs(giua.gian! - MAT.vui.gian!) / 4).toBeLessThan(Math.abs(giua.lidL! - MAT.vui.lidL!) / Math.abs(MAT.ratCau.lidL! - MAT.vui.lidL!)) // màu chậm hơn mắt
    let t = 0
    while (!daLang(Object.values(lo), 0.01) && t < 6) { tienLo(Object.values(lo), 1 / 30); t += 1 / 30 }
    expect(t).toBeLessThan(4)
    const cuoi = docBo(lo)
    for (const k in GOC) expect(cuoi[k], k).toBeCloseTo(MAT.ratCau[k]!, 1)
  })
  it('mực dung dịch theo giận (cáu dâng 14, rất cáu dâng 26); sóng nền cùng hàm cho JS và CSS; giận ⇒ sóng nhanh hơn', () => {
    expect(mucNuoc(MAT.vui.gian!)).toBe(166); expect(mucNuoc(MAT.cau.gian!)).toBe(152); expect(mucNuoc(MAT.ratCau.gian!)).toBe(140)
    const w = duongSongRong(166, 1.3)
    expect(w.mat).toMatch(/^M-30 /); expect(w.khoi).toMatch(/V280H-30Z$/)
    expect(w.mat).toContain(`L${Math.round((232 + SONG_LAMBDA) * 100) / 100} `) // phủ đủ khi CSS trượt −λ
    expect(chuKySong(0)).toBeCloseTo(2.99, 1); expect(chuKySong(4)).toBeLessThan(chuKySong(3)); expect(chuKySong(3)).toBeLessThan(chuKySong(0))
    expect(readFileSync('src/styles/mol.css', 'utf8')).toContain(`to { transform: translateX(-${SONG_LAMBDA.toFixed(3)}px); }`)
  })
  it('đọc lại ma trận CSS (trao tay CSS ⇄ JS): dời, xoay, co giãn', () => {
    expect(tachMaTran('none')).toEqual({ x: 0, y: 0, r: 0, sx: 1, sy: 1 })
    expect(tachMaTran('matrix(1, 0, 0, 1, 5, -3)')).toMatchObject({ x: 5, y: -3, r: 0, sx: 1, sy: 1 })
    const q = tachMaTran(`matrix(${Math.cos(0.1)}, ${Math.sin(0.1)}, ${-Math.sin(0.1)}, ${Math.cos(0.1)}, 0, -14)`)
    expect(q.r).toBeCloseTo((0.1 * 180) / Math.PI, 3); expect(q.y).toBe(-14)
  })
})

// ── bộ máy trong jsdom: rAF giả (bấm từng khung), IntersectionObserver giả ──
function moiRaf() {
  const hang: FrameRequestCallback[] = []
  let ms = performance.now()
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => { hang.push(f); return hang.length })
  return {
    so: () => hang.length,
    chay(n: number, buoc = 1000 / 60) { for (let i = 0; i < n && hang.length; i++) { ms += buoc; const ds = hang.splice(0); for (const f of ds) f(ms) } },
  }
}
function moiIo() {
  const ds: { cb: IntersectionObserverCallback; el: Element[] }[] = []
  class IO { cb: IntersectionObserverCallback; el: Element[] = []; constructor(cb: IntersectionObserverCallback) { this.cb = cb; ds.push(this) } observe(e: Element) { this.el.push(e) } unobserve() {} disconnect() {} }
  vi.stubGlobal('IntersectionObserver', IO)
  return { datHien(el: Element, h: boolean) { for (const o of ds) if (o.el.includes(el)) o.cb([{ target: el, isIntersecting: h } as unknown as IntersectionObserverEntry], o as unknown as IntersectionObserver) } }
}
const moi = (o: Parameters<typeof taoLua>[1] = {}) => { const s = document.createElement('span'); s.className = 'bi lua'; document.body.appendChild(s); return taoLua(s, o) }

describe('vòng khung: chỉ chạy khi cần, tự tắt khi lắng, tắt khi khuất / ẩn tab', () => {
  it('đứng yên ⇒ 0 vòng; đổi mặt ⇒ vòng chạy rồi TỰ TẮT khi lò xo lắng; chạm ⇒ chạy lại rồi tắt', () => {
    const raf = moiRaf()
    const l = moi({ trangThai: 'vui', cheDo: 'day-du' })
    expect(_demMol().thuc).toBe(0); expect(raf.so()).toBe(0)
    l.datTrangThai('gian')
    expect(_demMol().thuc).toBe(1); expect(l.svg.hasAttribute('data-song')).toBe(true) // CSS nhàn rỗi nhường cho JS
    raf.chay(60 * 6)
    expect(_demMol().thuc).toBe(0); expect(raf.so()).toBe(0); expect(l.svg.hasAttribute('data-song')).toBe(false)
    l.cham()
    expect(_demMol().thuc).toBe(1)
    raf.chay(60 * 6)
    expect(_demMol().thuc).toBe(0)
    l.huy()
  })
  it('khuất khỏi màn ⇒ tắt vòng ngay, CSS tạm dừng; đổi mặt lúc khuất ⇒ vẽ thẳng mặt mới, không vòng; hiện lại mới chạy', () => {
    const raf = moiRaf(), io = moiIo()
    const l = moi({ trangThai: 'vui', cheDo: 'day-du' })
    l.cham(); expect(_demMol().thuc).toBe(1)
    io.datHien(l.svg, false)
    expect(_demMol().thuc).toBe(0); expect(l.svg.hasAttribute('data-khuat')).toBe(true)
    l.datTrangThai('buon')
    expect(_demMol().thuc).toBe(0); expect(l.svg.getAttribute('data-mat')).toBe('buon')
    raf.chay(10); expect(_demMol().thuc).toBe(0)
    io.datHien(l.svg, true)
    expect(l.svg.hasAttribute('data-khuat')).toBe(false)
    l.cham(); expect(_demMol().thuc).toBe(1)
    l.huy(); expect(_demMol().thuc).toBe(0)
  })
  it('tab ẩn ⇒ tắt vòng; tab ẩn thì chạm / đổi mặt không bật vòng', () => {
    moiRaf()
    const l = moi({ trangThai: 'vui', cheDo: 'day-du' })
    l.cham(); expect(_demMol().thuc).toBe(1)
    const an = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true)
    document.dispatchEvent(new Event('visibilitychange'))
    expect(_demMol().thuc).toBe(0)
    l.datTrangThai('gian'); l.cham(); expect(_demMol().thuc).toBe(0)
    an.mockReturnValue(false); document.dispatchEvent(new Event('visibilitychange'))
    l.cham(); expect(_demMol().thuc).toBe(1)
    an.mockRestore(); l.huy()
  })
  it('cỡ nhỏ (< 64 px): không vòng JS, không nghe sự kiện — đổi mặt vẽ thẳng', () => {
    const raf = moiRaf(), them = vi.spyOn(window, 'addEventListener')
    const l = moi({ trangThai: 'vui', cheDo: 'nho' })
    l.datTrangThai('gian'); l.cham(); l.datCap(5)
    expect(_demMol().thuc).toBe(0); expect(raf.so()).toBe(0); expect(l.svg.getAttribute('data-mat')).toBe('ratCau')
    expect(them.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(0)
    expect(l.svg.getAttribute('data-che-do')).toBe('nho')
    them.mockRestore(); l.huy()
  })
  it('máy yếu: không nghe di chuột (không dõi mắt liên tục), không kéo; vẽ 30 khung/giây; bung ≤ 1/3 hạt; vòng vẫn tự tắt', () => {
    const raf = moiRaf(), them = vi.spyOn(window, 'addEventListener')
    const l = moi({ trangThai: 'vui', cheDo: 'gon', keo: true })
    expect(them.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(0)
    expect(l.svg.hasAttribute('data-keo')).toBe(false); expect(l.svg.getAttribute('data-che-do')).toBe('gon')
    const ghi = vi.spyOn(Element.prototype, 'setAttribute')
    l.datTrangThai('combo') // khen ⇒ bung sao
    expect(l.svg.querySelectorAll('[data-k="hat"] > *').length).toBe(3) // 8 × 1/3
    // 30 khung/giây: 60 khung rAF (1 giây) ⇒ chỉ ~30 khung có ghi DOM
    let coGhi = 0
    for (let i = 0; i < 60; i++) { ghi.mockClear(); raf.chay(1); if (ghi.mock.calls.length) coGhi++ }
    expect(coGhi).toBeGreaterThanOrEqual(25); expect(coGhi).toBeLessThanOrEqual(32)
    raf.chay(60 * 6)
    expect(_demMol().thuc).toBe(0)
    ghi.mockRestore(); them.mockRestore(); l.huy()
  })
  it('máy thường + Mol to (kéo): nghe di chuột chung một lần cho mọi Mol, gỡ khi Mol cuối huỷ; svg mang data-keo (vuốt dọc vẫn cuộn trang)', () => {
    const them = vi.spyOn(window, 'addEventListener'), go = vi.spyOn(window, 'removeEventListener')
    const a = moi({ trangThai: 'vui', cheDo: 'day-du', keo: true }), b = moi({ trangThai: 'vui', cheDo: 'day-du' })
    expect(them.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1)
    expect(a.svg.hasAttribute('data-keo')).toBe(true); expect(b.svg.hasAttribute('data-keo')).toBe(false)
    a.huy(); expect(go.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(0)
    b.huy(); expect(go.mock.calls.filter(([t]) => t === 'pointermove')).toHaveLength(1)
    them.mockRestore(); go.mockRestore()
    expect(readFileSync('src/styles/mol.css', 'utf8')).toContain('.mol-svg[data-keo] { touch-action: pan-y; }')
  })
  it('giảm chuyển động: chỉ chuyển mặt (không nhảy, không hạt), xong thì tắt', () => {
    const raf = moiRaf()
    const l = moi({ trangThai: 'vui', cheDo: 'tinh' })
    l.datTrangThai('combo')
    expect(l.svg.querySelectorAll('[data-k="hat"] > *').length).toBe(0)
    raf.chay(60 * 5)
    expect(_demMol().thuc).toBe(0); expect(l.svg.getAttribute('data-mat')).toBe('khen')
    l.huy()
  })
})

describe('CSS nhàn rỗi + nạp trước', () => {
  const css = readFileSync('src/styles/mol.css', 'utf8')
  it('nhàn rỗi CSS chỉ ở máy thường; JS đang chạy ([data-song]) thì nhường; khuất thì tạm dừng; máy yếu chớp bằng [data-chop]', () => {
    expect(css).toContain(".mol-svg[data-che-do='day-du']:not([data-song]) .mol-chop { animation: mol-chop")
    expect(css).toContain(".mol-svg[data-che-do='day-du'] .mol-song { animation: mol-song") // sóng nền trượt suốt (JS chỉ đổi hình) ⇒ không trao tay pha
    expect(css).toContain('.mol-svg[data-khuat] * { animation-play-state: paused !important; }')
    expect(css).toContain('.mol-svg[data-chop] .mol-chop { transform: scaleY(0.1); }')
    expect(css).toContain(".mol-svg[data-che-do='nho'] .mol-chop { animation: mol-chop 4.8s infinite; }")
    // không hoạt ảnh vô hạn nào ngoài máy thường / cỡ nhỏ
    for (const dong of css.split('\n').filter((d) => /animation: mol-[\w-]+ [^;]*infinite/.test(d))) expect(dong, dong).toMatch(/data-che-do='(?:day-du|nho)'|\.mol-noi/)
    // máy yếu: tô phẳng thay gradient
    expect(css).toContain(".mol-svg[data-che-do='gon'] :is(.mol-cau, .mol-co) { fill: var(--mol-x); }")
    // màu giận chuyển dần
    expect(css).toMatch(/@property --mol-x \{ syntax: '<color>'/)
  })
  it('mảnh Mol nạp lười + nạp trước lúc rảnh (cổng học sinh), mảnh nằm ngoài precache (kho chạy-lúc)', () => {
    const cong = readFileSync('src/components/cong-hs-nap-luoi.ts', 'utf8')
    expect(cong).toMatch(/requestIdleCallback/); expect(cong).toContain("import('./linh-vat/Bi').then((m) => m.napTruocMol()")
    expect(readFileSync('src/components/linh-vat/Bi.tsx', 'utf8')).toContain("export function napTruocMol(): void { if (!moDong) void import('./mol-dong')") // cửa nạp ở mảnh Bi ⇒ không tách thêm mảnh precache
    expect(readFileSync('vite.config.ts', 'utf8')).toContain("'**/mol-dong-*.{js,css}'")
    expect(readFileSync('src/components/linh-vat/Bi.tsx', 'utf8')).not.toMatch(/^import (?!type)[^\n]*from '\.\/mol-lo-xo'/m) // Bi không kéo mã của mảnh lười
  })
  it('svgMol: mặt đứng yên vẽ thẳng, không bật vòng', () => {
    svgMol('ratCau'); expect(_demMol().thuc).toBe(0)
  })
})
