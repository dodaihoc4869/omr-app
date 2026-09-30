// BI-A · ĐIỆN THOẠI XOAY NGANG, BÀN TOÀN MÀN (thầy lệnh 29/09: "khi xoay ngang màn hình cả bàn bi a full ngang giống điện thoại để hs bắn cho dễ").
// Hàm thuần `hopBanNgang`: bàn nằm ngang, đúng tỉ lệ, to nhất, KHÔNG tràn lề an toàn (tai thỏ / thanh home) và chừa đúng một cột nút mỗi bên;
// vùng bắt bi cái đủ to cho ngón tay theo cỡ bàn MỚI; CSS dùng đúng hai số COT_NGANG / LE_NGANG; màn chơi ở khung ngang có
// nút Mắt thần, Toàn màn hình trong "Tuỳ chỉnh" (gợi ý "Thêm vào màn hình chính" khi trình duyệt không cho).
// Sửa 30/09 (thầy chốt "Bàn Bi-a mới"): bỏ vùng bắt THÂN GẬY (kéo đâu trên bàn cũng xoay gậy), bỏ ngăn kéo "Bi của em" (thay bằng hàng chấm),
// nút Toàn màn hình chuyển vào "Tuỳ chỉnh" (cột trái theo bản vẽ: Sảnh · Mắt thần · Âm thanh · Tuỳ chỉnh · bánh xe).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react'
import { COT_NGANG, LE_NGANG, hopBanNgang, raMan, toaDoBan, chonBoCuc } from '../src/game/bi-a/bo-cuc'
import { banKinhBatBiCai } from '../src/game/bi-a/gay'
import { H, R, T, W } from '../src/game/bi-a/vat-ly'
import ManChoi from '../src/game/bi-a/ManChoi'
import { datBoGoiBia } from '../src/game/bi-a/api'
import type { CauBia, VanBia } from '../src/game/bi-a/dieu-khien'

const IPHONE = { tren: 0, phai: 47, duoi: 21, trai: 47 } // iPhone tai thỏ xoay ngang
const CO: Array<[number, number, Partial<typeof IPHONE>]> = [
  [844, 390, {}], [844, 390, IPHONE], [932, 430, IPHONE], [667, 375, {}], [740, 360, {}], [1000, 700, {}], [1180, 820, { duoi: 20 }],
]

describe('hopBanNgang: bàn nằm ngang, to nhất, không tràn lề an toàn', () => {
  for (const [vw, vh, an] of CO) {
    it(`${vw}×${vh}${an.trai ? ' (tai thỏ)' : ''}`, () => {
      const k = hopBanNgang(vw, vh, an)
      expect(k.xoay).toBe(true)
      // đúng tỉ lệ bàn
      expect(k.cw / k.ch).toBeCloseTo((H + 2 * T) / (W + 2 * T), 5)
      // hộp bàn chừa lề an toàn (≥ LE_NGANG) + một cột nút mỗi bên
      expect(k.hop.x).toBe(Math.max(LE_NGANG, an.trai ?? 0) + COT_NGANG)
      expect(vw - (k.hop.x + k.hop.w)).toBe(Math.max(LE_NGANG, an.phai ?? 0) + COT_NGANG)
      expect(k.hop.y).toBe(Math.max(LE_NGANG, an.tren ?? 0))
      expect(vh - (k.hop.y + k.hop.h)).toBe(Math.max(LE_NGANG, an.duoi ?? 0))
      // canvas nằm TRONG hộp, canh giữa
      expect(k.x).toBeGreaterThanOrEqual(k.hop.x - 1e-6); expect(k.y).toBeGreaterThanOrEqual(k.hop.y - 1e-6)
      expect(k.x + k.cw).toBeLessThanOrEqual(k.hop.x + k.hop.w + 1e-6); expect(k.y + k.ch).toBeLessThanOrEqual(k.hop.y + k.hop.h + 1e-6)
      expect(k.x - k.hop.x).toBeCloseTo(k.hop.x + k.hop.w - (k.x + k.cw), 6)
      // to nhất: chạm kín một chiều của hộp
      expect(Math.max(k.cw / k.hop.w, k.ch / k.hop.h)).toBeCloseTo(1, 6)
    })
  }
  it('điện thoại ngang: bàn chiếm gần hết chiều cao (≥ 93%) hoặc gần hết chiều ngang (≥ 84%); to hơn hẳn bố cục ngang cũ (cột 172 + 110 px)', () => {
    for (const [vw, vh] of [[844, 390], [932, 430], [667, 375], [740, 360]] as const) {
      const k = hopBanNgang(vw, vh)
      expect(k.ch / vh >= 0.93 || k.cw / vw >= 0.84).toBe(true)
      const cu = Math.min((vw - 172 - 110 - 16 - 20) / (H + 2 * T), (vh - 16) / (W + 2 * T)) // bố cục cũ: bề ngang còn lại sau hai cột
      expect(k.S).toBeGreaterThan(cu)
    }
  })
  it('khung ngang điện thoại chọn bố cục "ngang"; máy tính và máy dọc giữ nguyên', () => {
    for (const [vw, vh] of [[844, 390], [932, 430], [667, 375], [740, 360], [1000, 700]] as const) expect(chonBoCuc(vw, vh)).toBe('ngang')
    expect(chonBoCuc(1280, 800)).toBe('pc')
    expect(chonBoCuc(390, 844)).toBe('doc')
  })
})

describe('vùng bắt bi cái theo cỡ bàn mới', () => {
  for (const [vw, vh, an] of CO) {
    it(`${vw}×${vh}: bán kính bắt bi cái ≥ 30 px`, () => {
      const k = hopBanNgang(vw, vh, an)
      expect(banKinhBatBiCai(k.S) * k.S).toBeGreaterThanOrEqual(30 - 1e-9)
      expect(banKinhBatBiCai(k.S)).toBeGreaterThanOrEqual(R * 2.4)
    })
  }
  it('đổi toạ độ màn ⇄ bàn khớp nhau ở khung ngang', () => {
    const k = hopBanNgang(844, 390, IPHONE)
    for (const [x, y] of [[0, 0], [W, H], [123, 456], [W / 2, H / 2]]) {
      const [sx, sy] = raMan(k, 1, x, y)
      const b = toaDoBan(k, sx, sy)
      expect(b.x).toBeCloseTo(x, 6); expect(b.y).toBeCloseTo(y, 6)
      expect(sx).toBeGreaterThanOrEqual(0); expect(sx).toBeLessThanOrEqual(k.cw + 1e-6)
      expect(sy).toBeGreaterThanOrEqual(0); expect(sy).toBeLessThanOrEqual(k.ch + 1e-6)
    }
  })
})

describe('CSS xoay ngang dùng đúng số của bo-cuc.ts', () => {
  const css = readFileSync('src/game/bi-a/bi-a.css', 'utf8')
  const khoi = css.slice(css.indexOf('điện thoại xoay ngang · BÀN TOÀN MÀN'))
  it('cột nút = COT_NGANG, lề an toàn = max(LE_NGANG, env(safe-area-inset-*)) cả 4 phía; bàn chừa đúng lề + cột', () => {
    expect(COT_NGANG).toBe(48); expect(LE_NGANG).toBe(4)
    expect(khoi).toContain(`--cot:${COT_NGANG}px`)
    for (const phia of ['top', 'right', 'bottom', 'left']) expect(khoi).toContain(`max(${LE_NGANG}px,env(safe-area-inset-${phia},0px))`)
    expect(khoi).toContain(".bia[data-bo-cuc='ngang'] .bia-ban{position:absolute;inset:0;padding:var(--an-t) calc(var(--an-p) + var(--cot)) var(--an-d) calc(var(--an-tr) + var(--cot));touch-action:none}")
  })
  it('tấm Tuỳ chỉnh cuộn được và không kéo cả trang; hướng dẫn tôn trọng giảm chuyển động', () => {
    expect(css).toMatch(/\.bia-pop-tuy\{[^}]*overscroll-behavior:contain/)
    expect(css).toMatch(/prefers-reduced-motion:reduce\)\{\.bia-huong-dan \.ngon\{animation:none/)
  })
})

// ───── màn chơi ở khung ngang ─────
const cau = (i: number): CauBia => ({ qid: `q${i}`, maDe: 'DE', version: '1', group: `g${i}`, phan: 'I', text: `Câu hỏi số ${i}`, choices: ['A1', 'B1', 'C1', 'D1'], ideas: [], hinhAnh: [], dang: 'D', tenDang: `Dạng ${i}`, mucDo: 'biet', sao: 1, kienThuc: [], vai: 'moi' } as unknown as CauBia)
const van = () => (window as unknown as { __biaVan: VanBia }).__biaVan
const hop = (w: number, h: number) => ({ x: 0, y: 0, left: 0, top: 0, right: w, bottom: h, width: w, height: h, toJSON: () => ({}) }) as DOMRect

describe('Màn chơi khi điện thoại xoay ngang', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => hop(844, 390))
    datBoGoiBia((async () => ({ ok: true })) as never)
  })
  afterEach(() => { cleanup(); datBoGoiBia(null); vi.restoreAllMocks(); vi.unstubAllGlobals() })
  const ve = () => render(<ManChoi token="tk" tenEm="Khánh Linh" van="v1" session="s1" cheDo="don" loai="ai" cauEm={Array.from({ length: 7 }, (_, i) => cau(i + 1))} chot={cau(9)} onVeSanh={() => {}} onChoiLai={() => {}} />)

  it('bố cục "ngang", thanh lực dọc (cột phải), không bật chế độ "chỉ còn bàn" cũ', () => {
    const { container } = ve()
    const goc = container.querySelector('.bia')!
    expect(goc.getAttribute('data-bo-cuc')).toBe('ngang')
    expect(goc.getAttribute('data-dk')).toBe('phai')
    expect(goc.hasAttribute('data-toan')).toBe(false)
    expect(screen.getByRole('slider', { name: /Lực đánh/ })).toBeTruthy()
  })
  it('không còn nút/ngăn kéo "Bi của em": thay bằng hàng chấm (bi em trái, đối thủ phải)', () => {
    const { container } = ve()
    expect(screen.queryByRole('button', { name: 'Bi của em' })).toBeNull()
    expect(container.querySelector('#bia-ngan')).toBeNull()
    const hai = screen.getByRole('region', { name: 'Hai phe' })
    expect(hai.querySelectorAll('i[data-kieu="ta"]')).toHaveLength(7)
    expect(hai.querySelectorAll('i[data-kieu="dich"]')).toHaveLength(7)
  })
  it('nút Mắt thần bật/tắt "Luôn bật Mắt thần"', () => {
    ve()
    const nut = screen.getByRole('button', { name: /Luôn bật Mắt thần: đang tắt/ })
    expect(nut.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(nut)
    expect(screen.getByRole('button', { name: /Luôn bật Mắt thần: đang bật/ }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: /Luôn bật Mắt thần: đang bật/ }))
  })
  it('Toàn màn hình: trình duyệt không có Fullscreen API (iPhone Safari) ⇒ gợi ý một dòng "Thêm vào màn hình chính"', () => {
    const { container } = ve()
    const goc = container.querySelector('.bia') as HTMLElement & { requestFullscreen?: unknown }
    Object.defineProperty(goc, 'requestFullscreen', { value: undefined, configurable: true })
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chỉnh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Toàn màn hình' }))
    expect(van().thongBao?.phu).toBe('Thêm vào màn hình chính để chơi toàn màn hình')
    expect(container.querySelector('.bia')!.hasAttribute('data-toan')).toBe(false)
  })
  it('Toàn màn hình: có Fullscreen API ⇒ xin toàn màn hình rồi khoá màn NGANG', async () => {
    const { container } = ve()
    const goc = container.querySelector('.bia') as HTMLElement
    const xin = vi.fn(() => Promise.resolve())
    Object.defineProperty(goc, 'requestFullscreen', { value: xin, configurable: true })
    const khoa = vi.fn(() => Promise.resolve())
    Object.defineProperty(screen0(), 'orientation', { value: { lock: khoa }, configurable: true })
    fireEvent.click(screen.getByRole('button', { name: 'Tuỳ chỉnh' }))
    fireEvent.click(screen.getByRole('button', { name: 'Toàn màn hình' }))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(xin).toHaveBeenCalledWith({ navigationUI: 'hide' })
    expect(khoa).toHaveBeenCalledWith('landscape')
  })
})
const screen0 = () => globalThis.screen as unknown as object
