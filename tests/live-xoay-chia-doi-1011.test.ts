// LIVE BẢNG (10/11, đặc tả docs/dac-ta-live-bang-1011.md mục 4.7 — YÊU CẦU CỨNG): máy em xoay ngang / hình xoay bằng CSS KHÔNG được báo nhầm «chia đôi màn hình».
// Bảng tình huống cho `dangChiaDoi()` (src/components/bpu/tat-man.ts) + «khoá xoay» 600 ms + cờ chờ hộp hỏi quyền (mic) + bố cục máy em (bo-cuc.ts).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { KHOA_XOAY_MS, _datLaiTatMan, choHopQuyen, conKhoaXoay, dangChiaDoi, dangXinQuyen, khoaXoay } from '../src/components/bpu/tat-man'
import { KHE_GIUA, LE_NGOAI, VUNG_MAC_DINH, anToanHinh, boCucEm, boCucPhong, canXoayCss, giaiTrang, khungChieu, maTrang, type VungChieu } from '../src/components/live/bo-cuc'

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
  // 11/11 LẦN 3 (thầy, kèm ảnh máy em: «tối ưu không gian hiển thị đề và bảng đen phải full để hs đọc rõ, thiết kế ẩn hết vào thanh ẩn») — THAY các phép kiểm
  // «chừa dải 18 px ở mép trên cho tay nắm» của lần 2: không còn dải nào; tay nắm đè mép phải bảng đen.
  const KHONG = { trai: 0, phai: 0, duoi: 0 }
  /** Tờ của thầy gần 4:3 (ước từ ảnh thầy gửi 11/11: giấy lệch trái, bảng thấp hơn giấy). */
  const VUNG_43: VungChieu = { giay: [0.072, 0.012, 0.673, 0.953], bang: [0.681, 0.097, 0.981, 0.951], giayToi: false }
  const KHO: [number, number][] = [[844, 390], [667, 375], [1180, 820], [1971, 1247]]
  it('GIẤY + BẢNG PHỦ KÍN: điện thoại ngang 844 × 390, 667 × 375, máy bảng 1180 × 820, cửa sổ máy tính 1971 × 1247 — diện tích (giấy + bảng) ≥ 92 % khung nhìn; lề ngoài đúng 4 px, khe giữa ≤ 5 px', () => {
    for (const [vung, tiLe] of [[VUNG_MAC_DINH, 16 / 9], [VUNG_43, 1.36]] as [VungChieu, number][]) for (const [w, h] of KHO) {
      const k = khungChieu(vung, tiLe), b = boCucEm(w, h, KHONG, k)
      expect(b.phu, `${w}×${h} tỉ lệ tờ ${tiLe.toFixed(2)}`).toBeGreaterThanOrEqual(0.92)
      // hai ô chạm đúng lề ngoài ở cả bốn phía, không tràn khung nhìn
      expect(b.giay.x).toBeCloseTo(LE_NGOAI, 5); expect(b.bang.x + b.bang.w).toBeCloseTo(w - LE_NGOAI, 5)
      for (const o of [b.giay, b.bang]) { expect(o.y).toBeCloseTo(LE_NGOAI, 5); expect(o.y + o.h).toBeCloseTo(h - LE_NGOAI, 5) }
      expect(b.bang.x - (b.giay.x + b.giay.w)).toBeLessThanOrEqual(KHE_GIUA + 0.01)
      expect(b.bang.x - (b.giay.x + b.giay.w)).toBeGreaterThanOrEqual(0)
    }
  })
  it('co theo CẠNH GIỚI HẠN, một phép co đều: ô của THẦY (chỗ nét + chữ giấy soi) nằm trọn trong ô vẽ, chạm lề ở cạnh giới hạn; tỉ lệ giấy : bảng của tờ giữ nguyên', () => {
    for (const [vung, tiLe] of [[VUNG_MAC_DINH, 16 / 9], [VUNG_43, 1.36]] as [VungChieu, number][]) for (const [w, h] of KHO) {
      const k = khungChieu(vung, tiLe), b = boCucEm(w, h, KHONG, k)
      const px = (o: { x: number; y: number; w: number; h: number }) => ({ x0: b.x + o.x * b.s, y0: b.y + o.y * b.s, x1: b.x + (o.x + o.w) * b.s, y1: b.y + (o.y + o.h) * b.s })
      const g = px(k.giay), bg = px(k.bang)
      // ô của thầy nằm trong ô vẽ tương ứng (ô vẽ chỉ NỚI ra, không cắt)
      expect(g.x0).toBeGreaterThanOrEqual(b.giay.x - 0.01); expect(g.x1).toBeLessThanOrEqual(b.giay.x + b.giay.w + 0.01)
      expect(g.y0).toBeGreaterThanOrEqual(b.giay.y - 0.01); expect(g.y1).toBeLessThanOrEqual(b.giay.y + b.giay.h + 0.01)
      expect(bg.x0).toBeGreaterThanOrEqual(b.bang.x - 0.01); expect(bg.x1).toBeLessThanOrEqual(b.bang.x + b.bang.w + 0.01)
      expect(bg.y0).toBeGreaterThanOrEqual(b.bang.y - 0.01); expect(bg.y1).toBeLessThanOrEqual(b.bang.y + b.bang.h + 0.01)
      // hộp bao hai ô của thầy chạm lề ở ít nhất một chiều (đã phóng hết cỡ), dính trái + dính trên
      const rong = Math.max(g.x1, bg.x1) - Math.min(g.x0, bg.x0), cao = Math.max(g.y1, bg.y1) - Math.min(g.y0, bg.y0)
      expect(Math.min(w - 2 * LE_NGOAI - rong, h - 2 * LE_NGOAI - cao)).toBeCloseTo(0, 3)
      expect(Math.min(g.x0, bg.x0)).toBeCloseTo(LE_NGOAI, 5); expect(Math.min(g.y0, bg.y0)).toBeCloseTo(LE_NGOAI, 5)
      expect(b.cw).toBeCloseTo(rong, 5); expect(b.ch).toBeCloseTo(cao, 5)
      // một phép co đều ⇒ tỉ lệ rộng giấy : rộng bảng và rộng : cao của từng ô của thầy y như trên tờ
      expect((g.x1 - g.x0) / (bg.x1 - bg.x0)).toBeCloseTo(k.giay.w / k.bang.w, 6)
      expect((g.x1 - g.x0) / (g.y1 - g.y0)).toBeCloseTo(k.giay.w / k.giay.h, 6)
    }
  })
  it('bỏ lề của tờ chiếu ⇒ chữ + nét KHÔNG nhỏ hơn bản trước (tờ 4:3 có lề: to hơn ≥ 7 %); phần dư bề ngang của điện thoại dài thành bảng đen nới sang phải — chỗ tay nắm đứng, không đè ô bảng của thầy', () => {
    /** Phép co của bản trước (11/11 lần 2): cả vùng chiếu kể cả lề tờ, chừa dải 18 px mép trên khi hình nhỏ đi dưới 6 %. */
    const coCu = (w: number, h: number, LW: number, LH: number) => { const day = Math.min(w / LW, h / LH), nam = Math.min(w / LW, (h - 18) / LH); return nam < day * 0.94 ? day : nam }
    for (const [w, h] of KHO) {
      const k = khungChieu(VUNG_MAC_DINH, 16 / 9), b = boCucEm(w, h, KHONG, k)
      expect(b.s).toBeGreaterThan(coCu(w, h, k.LW, k.LH) * 0.995)
      const k2 = khungChieu(VUNG_43, 1.36), b2 = boCucEm(w, h, KHONG, k2)
      expect(b2.s).toBeGreaterThan(coCu(w, h, k2.LW, k2.LH) * 1.07)
    }
    // 844 × 390, tờ 16:9: ô bảng của thầy kết thúc trước mép phải ≥ 60 px ⇒ tay nắm (vùng chạm 44 px sát mép phải) không đè ô thầy viết
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9), b = boCucEm(844, 390, KHONG, k)
    expect(844 - (b.x + (k.bang.x + k.bang.w) * b.s)).toBeGreaterThan(60)
    expect(b.bang.x + b.bang.w).toBeCloseTo(844 - LE_NGOAI, 5)
  })
  it('giấy và bảng KHÔNG xếp cạnh nhau (bố cục lạ) ⇒ giữ nguyên ô của thầy, không nới (không vẽ đè lên nhau)', () => {
    const k = khungChieu({ giay: [0.05, 0.05, 0.95, 0.5], bang: [0.05, 0.52, 0.95, 0.95], giayToi: false }, 16 / 9), b = boCucEm(844, 390, KHONG, k)
    expect(b.giay.w).toBeCloseTo(k.giay.w * b.s, 5); expect(b.giay.h).toBeCloseTo(k.giay.h * b.s, 5)
    expect(b.bang.y).toBeCloseTo(b.y + k.bang.y * b.s, 5)
  })
  it('iPhone: máy dọc không khoá ngang được ⇒ xoay CSS, tai thỏ thành mép trái hình, thanh home thành mép phải hình', () => {
    expect(canXoayCss(390, 844, false)).toBe(true)
    expect(canXoayCss(844, 390, false)).toBe(false) // em tự xoay máy ngang ⇒ bỏ xoay CSS
    expect(canXoayCss(390, 844, true)).toBe(false) // Android đã khoá ngang (cỡ trang chưa kịp đổi) ⇒ không xoay chồng
    expect(anToanHinh({ tren: 47, phai: 0, duoi: 34, trai: 0 }, true)).toEqual({ trai: 47, phai: 34, duoi: 0, tren: 0 }) // mép phải máy thành mép TRÊN hình
    expect(anToanHinh({ tren: 0, phai: 47, duoi: 21, trai: 47 }, false)).toEqual({ trai: 47, phai: 47, duoi: 21, tren: 0 })
    // 11/11 lần 3: «mép phải» là mép phải của HÌNH đã xoay = phía thanh home; giấy + bảng chừa tai thỏ (trái) và thanh home (phải), tay nắm đứng sát vùng an toàn phải
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9), at = anToanHinh({ tren: 47, phai: 0, duoi: 34, trai: 0 }, true)
    const b = boCucEm(844, 390, at, k)
    expect(b.giay.x).toBeCloseTo(47 + LE_NGOAI, 5)
    expect(b.bang.x + b.bang.w).toBeCloseTo(844 - 34 - LE_NGOAI, 5)
    expect(b.phu).toBeGreaterThanOrEqual(0.92) // tính trên khung nhìn đã trừ vùng an toàn
  })
  it('phóng bảng (chạm hai lần): ô bảng đen của thầy phủ kín chiều cao (không còn chừa dải tay nắm), nằm giữa; ô bảng vẽ nới tới mép phải, phần bên trái vẫn là giấy', () => {
    const k = khungChieu(VUNG_MAC_DINH, 16 / 9), p = boCucPhong(844, 390, { trai: 0, phai: 0, duoi: 0 }, k), thuong = boCucEm(844, 390, { trai: 0, phai: 0, duoi: 0 }, k)
    expect(k.bang.h * p.s).toBeCloseTo(390 - 2 * LE_NGOAI, 0)
    expect(p.y + k.bang.y * p.s).toBeCloseTo(LE_NGOAI, 3)
    expect(p.x + k.bang.x * p.s).toBeGreaterThanOrEqual(0)
    expect(p.x + (k.bang.x + k.bang.w) * p.s).toBeLessThanOrEqual(844 + 0.5)
    expect(p.s).toBeGreaterThanOrEqual(thuong.s) // điện thoại dài: giấy đã chạm trần chiều cao nên bảng chỉ to thêm chút ít; máy bảng / cửa sổ rộng mới to rõ
    expect(p.bang.w).toBeGreaterThan(thuong.bang.w * 1.02) // bộ thử Chromium đo đúng điều này
    expect(p.bang.x + p.bang.w).toBeCloseTo(844 - LE_NGOAI, 5)
    expect(p.giay.x + p.giay.w).toBeLessThanOrEqual(p.bang.x)
  })
})
