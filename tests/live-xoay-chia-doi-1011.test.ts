// LIVE BẢNG (10/11, đặc tả docs/dac-ta-live-bang-1011.md mục 4.7 — YÊU CẦU CỨNG): máy em xoay ngang / hình xoay bằng CSS KHÔNG được báo nhầm «chia đôi màn hình».
// Bảng tình huống cho `dangChiaDoi()` (src/components/bpu/tat-man.ts) + «khoá xoay» 600 ms + cờ chờ hộp hỏi quyền (mic) + bố cục máy em (bo-cuc.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KHOA_XOAY_MS, _datLaiTatMan, choHopQuyen, conKhoaXoay, dangChiaDoi, dangXinQuyen, khoaXoay } from '../src/components/bpu/tat-man'
import { VUNG_MAC_DINH, anToanHinh, boCucEm, boCucPhong, canXoayCss, giaiTrang, khungChieu, maTrang } from '../src/components/live/bo-cuc'

/** Dựng máy giả: cỡ màn (px CSS, theo hướng máy đang cầm), hướng màn, khung trang. */
function may(o: { man: [number, number]; huong: 'portrait-primary' | 'landscape-primary' | null; trang: [number, number]; goc?: number; thoRo?: boolean }) {
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('coarse') ? o.thoRo !== false : false, addEventListener() {}, removeEventListener() {} }))
  Object.defineProperty(window, 'screen', { configurable: true, value: { width: o.man[0], height: o.man[1], ...(o.huong ? { orientation: { type: o.huong } } : {}) } })
  if (o.goc != null) Object.defineProperty(window, 'orientation', { configurable: true, value: o.goc })
  Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: o.trang[0] })
  Object.defineProperty(document.documentElement, 'clientHeight', { configurable: true, value: o.trang[1] })
}

beforeEach(() => { vi.useFakeTimers(); _datLaiTatMan() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); delete (window as unknown as Record<string, unknown>).orientation; _datLaiTatMan() })

describe('dangChiaDoi khi live xoay ngang', () => {
  const CA: [string, Parameters<typeof may>[0], boolean][] = [
    ['iPhone cầm DỌC, hình xoay 90° bằng CSS: máy vẫn dọc, khung trang vẫn đầy', { man: [390, 844], huong: 'portrait-primary', trang: [390, 844] }, false],
    ['iPhone cầm dọc trong Safari (thanh địa chỉ + thanh công cụ ăn ~17 % chiều cao)', { man: [390, 844], huong: 'portrait-primary', trang: [390, 700] }, false],
    ['Android khoá ngang, toàn màn hình', { man: [844, 390], huong: 'landscape-primary', trang: [844, 390] }, false],
    ['Android ngang, CÒN thanh trình duyệt (cao còn 78 %)', { man: [844, 390], huong: 'landscape-primary', trang: [844, 305] }, false],
    ['Android ngang, màn báo cỡ theo dáng DỌC (một số máy không đổi screen.width/height khi xoay)', { man: [390, 844], huong: 'landscape-primary', trang: [844, 390] }, false],
    ['iPhone đời cũ (không có screen.orientation) em tự xoay máy ngang: window.orientation = 90', { man: [390, 844], huong: null, trang: [844, 340], goc: 90 }, false],
    ['iPhone ngang có tai thỏ: vùng an toàn KHÔNG làm khung trang hẹp đi', { man: [390, 844], huong: 'landscape-primary', trang: [844, 390] }, false],
    ['CHIA ĐÔI THẬT 50 % khi máy dọc (hai app trên dưới)', { man: [390, 844], huong: 'portrait-primary', trang: [390, 400] }, true],
    ['CHIA ĐÔI THẬT 50 % khi máy ngang (hai app trái phải)', { man: [844, 390], huong: 'landscape-primary', trang: [420, 390] }, true],
    ['iPad Split View 1/3 khi đang live ngang', { man: [1180, 820], huong: 'landscape-primary', trang: [380, 820] }, true],
    ['Cửa sổ nổi thu nhỏ (rộng 60 %)', { man: [390, 844], huong: 'portrait-primary', trang: [234, 500] }, true],
    ['Máy tính (con trỏ chuột) để cửa sổ nhỏ: không tính', { man: [1920, 1080], huong: 'landscape-primary', trang: [800, 500], thoRo: false }, false],
  ]
  for (const [ten, o, mong] of CA) it(ten, () => { may(o); expect(dangChiaDoi()).toBe(mong) })

  it('KHOẢNH KHẮC ĐANG XOAY: hướng máy đã ngang mà khung trang còn dọc ⇒ so cỡ ra «chia đôi» giả; khoá xoay 600 ms chặn, hết khoá xét lại theo cỡ thật', () => {
    // lệch hướng: screen.orientation đã «landscape» nhưng trình duyệt chưa đổi cỡ trang (còn 390 × 844)
    may({ man: [844, 390], huong: 'landscape-primary', trang: [390, 844] })
    expect(dangChiaDoi()).toBe(true) // không khoá ⇒ báo nhầm (đây là lỗi phải chặn)
    khoaXoay()
    expect(conKhoaXoay()).toBe(KHOA_XOAY_MS)
    expect(dangChiaDoi()).toBe(false)
    vi.advanceTimersByTime(KHOA_XOAY_MS - 1)
    expect(dangChiaDoi()).toBe(false)
    // xoay xong: khung trang đã theo kịp
    may({ man: [844, 390], huong: 'landscape-primary', trang: [844, 390] })
    vi.advanceTimersByTime(2)
    expect(conKhoaXoay()).toBe(0)
    expect(dangChiaDoi()).toBe(false)
  })
  it('hết khoá xoay mà cửa sổ VẪN nhỏ ⇒ đúng là chia đôi (khoá không che được chia đôi thật)', () => {
    may({ man: [844, 390], huong: 'landscape-primary', trang: [420, 390] })
    khoaXoay()
    expect(dangChiaDoi()).toBe(false)
    vi.advanceTimersByTime(KHOA_XOAY_MS + 1)
    expect(dangChiaDoi()).toBe(true)
  })
  it('gọi khoá lặp (lock rồi orientationchange rồi fullscreenchange) ⇒ kéo dài từ lần cuối, không cộng dồn vô hạn', () => {
    khoaXoay(); vi.advanceTimersByTime(400); khoaXoay()
    expect(conKhoaXoay()).toBe(KHOA_XOAY_MS)
    vi.advanceTimersByTime(KHOA_XOAY_MS)
    expect(conKhoaXoay()).toBe(0)
  })
})

describe('hộp hỏi quyền (mic khi em được mời nói) không bị coi là cửa sổ nổi', () => {
  it('đang chờ lời hứa xin quyền ⇒ dangXinQuyen() = true; xong (cho / từ chối) ⇒ false', async () => {
    vi.useRealTimers()
    let cho!: (v: string) => void, tuChoi!: (e: Error) => void
    expect(dangXinQuyen()).toBe(false)
    const p = choHopQuyen(new Promise<string>((r) => { cho = r }))
    const q = choHopQuyen(new Promise<string>((_, r) => { tuChoi = r }))
    expect(dangXinQuyen()).toBe(true)
    cho('granted'); await p
    await Promise.resolve()
    expect(dangXinQuyen()).toBe(true) // còn hộp thứ hai
    tuChoi(new Error('NotAllowedError')); await q.catch(() => {})
    await Promise.resolve()
    expect(dangXinQuyen()).toBe(false)
  })
})

describe('bố cục máy em (bo-cuc.ts)', () => {
  it('khoá trang mang ô giấy / ô bảng: ghép rồi tách ra đúng (sai số ≤ 1 ‰), vừa 60 ký tự của sổ nét', () => {
    const vung = { giay: [0.0052, 0.0093, 0.6615, 0.9194], bang: [0.6667, 0.0185, 0.9948, 0.9194] }
    const ma = maTrang('12', vung, true)
    expect(ma.length).toBeLessThanOrEqual(60)
    const { khoa, vung: v } = giaiTrang(ma)
    expect(khoa).toBe('12')
    expect(v.giayToi).toBe(true)
    v.giay.forEach((x, i) => expect(Math.abs(x - vung.giay[i]!)).toBeLessThanOrEqual(0.001))
    v.bang.forEach((x, i) => expect(Math.abs(x - vung.bang[i]!)).toBeLessThanOrEqual(0.001))
  })
  it('khoá trang trơn / hỏng / thiếu ô ⇒ ô mặc định của tờ 16:9, không ném', () => {
    for (const t of ['3', '', '3~1,2,3~s', '3~a,b,c,d,e,f,g,h~t', '3~990,10,5,900,667,19,995,919']) expect(giaiTrang(t).vung.giay).toEqual(VUNG_MAC_DINH.giay)
    expect(maTrang('7', null, false)).toBe('7')
    expect(maTrang('7', { giay: [0, 0, 2, 1], bang: [0.5, 0, 1, 1] }, false)).toBe('7')
    expect(giaiTrang('7').khoa).toBe('7')
  })
  it('vùng chiếu = giấy + bảng, bỏ thanh phím đáy; cao lôgic 820, tỉ lệ gần 1600 × 820 của bản vẽ', () => {
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9)
    expect(k.LH).toBe(820)
    expect(k.LW).toBeGreaterThan(1500); expect(k.LW).toBeLessThan(1700)
    expect(k.giay.x).toBeGreaterThanOrEqual(0); expect(k.bang.x).toBeGreaterThan(k.giay.x + k.giay.w)
    expect(k.bang.x + k.bang.w).toBeLessThanOrEqual(k.LW + 0.01)
    expect(k.giay.y + k.giay.h).toBeLessThanOrEqual(k.LH + 0.01)
    // điểm (x, y) của nét trong cửa sổ thầy ⇒ điểm trong vùng chiếu: góc trái-trên của ô bảng
    expect(VUNG_MAC_DINH.bang[0] * k.Wv - k.ox).toBeCloseTo(k.bang.x, 5)
    expect(VUNG_MAC_DINH.bang[1] * k.Hv - k.oy).toBeCloseTo(k.bang.y, 5)
  })
  it('điện thoại dài 19,5:9: vùng chiếu dính trái, dải dư bên phải cho tay nắm (không che nét)', () => {
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9), b = boCucEm(844, 390, { trai: 0, phai: 0, duoi: 0 }, k.LW)
    expect(b.namDe).toBe(false)
    expect(b.x + b.cw).toBeLessThanOrEqual(844 - 52 + 0.5)
    expect(b.ch).toBeCloseTo(390, 0)
  })
  it('điện thoại 16:9: chừa dải thì hình nhỏ đi quá 6 % ⇒ hình phủ hết bề ngang, tay nắm đè mép (mờ, kéo dọc được); máy bảng: chừa dải (hình nhỏ đi < 6 %)', () => {
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9)
    const dt = boCucEm(667, 375, { trai: 0, phai: 0, duoi: 0 }, k.LW)
    expect(dt.namDe).toBe(true)
    expect(dt.cw).toBeCloseTo(667, 0)
    expect(dt.x).toBeCloseTo(0, 1)
    const bang = boCucEm(1180, 820, { trai: 0, phai: 0, duoi: 0 }, k.LW)
    expect(bang.namDe).toBe(false)
    expect(bang.x + bang.cw).toBeLessThanOrEqual(1180 - 52 + 0.5)
    expect(bang.y).toBeGreaterThan(0) // vùng chiếu nằm giữa chiều cao
  })
  it('iPhone: máy dọc không khoá ngang được ⇒ xoay CSS, tai thỏ thành mép trái hình, thanh home thành mép phải hình', () => {
    expect(canXoayCss(390, 844, false)).toBe(true)
    expect(canXoayCss(844, 390, false)).toBe(false) // em tự xoay máy ngang ⇒ bỏ xoay CSS
    expect(canXoayCss(390, 844, true)).toBe(false) // Android đã khoá ngang (cỡ trang chưa kịp đổi) ⇒ không xoay chồng
    expect(anToanHinh({ tren: 47, phai: 0, duoi: 34, trai: 0 }, true)).toEqual({ trai: 47, phai: 34, duoi: 0 })
    expect(anToanHinh({ tren: 0, phai: 47, duoi: 21, trai: 47 }, false)).toEqual({ trai: 47, phai: 47, duoi: 21 })
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9), at = anToanHinh({ tren: 47, phai: 0, duoi: 34, trai: 0 }, true)
    const b = boCucEm(844, 390, at, k.LW)
    expect(b.x).toBeGreaterThanOrEqual(47)
    expect(b.x + b.cw).toBeLessThanOrEqual(844 - 34 + 0.5)
  })
  it('phóng bảng (chạm hai lần): ô bảng đen phủ kín chiều cao, nằm giữa phần còn lại', () => {
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9), p = boCucPhong(844, 390, { trai: 0, phai: 0, duoi: 0 }, k)
    expect(k.bang.h * p.s).toBeCloseTo(390, 0)
    expect(p.x + k.bang.x * p.s).toBeGreaterThanOrEqual(0)
    expect(p.x + (k.bang.x + k.bang.w) * p.s).toBeLessThanOrEqual(844 - 52 + 0.5)
  })
})
