// APP HỌC SINH LUÔN TRÀN TOÀN MÀN (thầy 28/10, máy Android: «lúc full lúc không, có dải đen ở trên»). Xem src/lib/toan-man-hs.ts.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { biDongHop, boCover, coCover, type SoDoMan } from '../src/lib/toan-man-hs'

const doc = (p: string) => readFileSync(new URL('../' + p, import.meta.url), 'utf8')
const json = (p: string) => JSON.parse(doc(p))
const mauHs = doc('src/styles/trong-hs-mau.css')
const nenSang = /:root\[data-trong='hs'\]\s*\{\s*--tr-nen:\s*(#[0-9a-f]{6})/i.exec(mauHs)?.[1]
const nenToi = /prefers-color-scheme:\s*dark[\s\S]*?--tr-nen:\s*(#[0-9a-f]{6})/i.exec(mauHs)?.[1]

describe('manifest app học sinh: toàn màn, màu nền đúng app', () => {
  const m = json('public/manifest-hs.json')
  it('display fullscreen, display_override ưu tiên fullscreen', () => {
    expect(m.display).toBe('fullscreen')
    expect(m.display_override[0]).toBe('fullscreen')
    expect(m.start_url).toBe('./hs')
  })
  it('theme_color / background_color = nền sáng app học sinh (--tr-nen), không còn trắng lệch nền', () => {
    expect(nenSang).toBe('#f6f6fc')
    expect(m.theme_color).toBe(nenSang)
    expect(m.background_color).toBe(nenSang)
  })
  it('manifest thầy / phụ huynh không đổi', () => {
    for (const f of ['public/manifest.json', 'public/manifest-ph.json']) {
      expect(json(f).theme_color).toBe('#ffffff')
      expect(json(f).display).toBe('fullscreen')
    }
  })
})

describe('index.html: tràn vùng tai thỏ + thanh trạng thái cùng màu nền học sinh', () => {
  const html = doc('index.html')
  it('viewport có viewport-fit=cover', () => {
    expect(html).toMatch(/<meta name="viewport" content="[^"]*viewport-fit=cover/)
  })
  it('vai hs viết theme-color sáng / tối theo --tr-nen, TRƯỚC thẻ chung', () => {
    expect(nenToi).toBe('#1a1a29')
    const sang = html.indexOf(`media="(prefers-color-scheme: light)" content="${nenSang}"`)
    const toi = html.indexOf(`media="(prefers-color-scheme: dark)" content="${nenToi}"`)
    const chung = html.indexOf('<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff"')
    expect(sang).toBeGreaterThan(0)
    expect(toi).toBeGreaterThan(0)
    expect(sang).toBeLessThan(chung)
    expect(html.slice(html.lastIndexOf("if (vai === 'hs')", sang), sang)).toContain("vai === 'hs'")
  })
})

const doDoc = (x: Partial<SoDoMan> = {}): SoDoMan => ({
  toanMan: true, anToanTren: 0, manRong: 412, manCao: 915, trongRong: 412, trongCao: 883, dangGo: false, ...x,
})

describe('biDongHop: nhận ra dải đen tai thỏ', () => {
  it('toàn màn, vùng an toàn 0, cửa sổ ngắn hơn màn 32 px ⇒ đang đóng hộp', () => {
    expect(biDongHop(doDoc())).toBe(true)
  })
  it('đã tràn (vùng an toàn > 0) ⇒ không', () => {
    expect(biDongHop(doDoc({ anToanTren: 32, trongCao: 915 }))).toBe(false)
  })
  it('máy không tai thỏ: cửa sổ = màn ⇒ không', () => {
    expect(biDongHop(doDoc({ trongCao: 915 }))).toBe(false)
  })
  it('mở trong trình duyệt (không toàn màn) ⇒ không đụng', () => {
    expect(biDongHop(doDoc({ toanMan: false }))).toBe(false)
  })
  it('đang gõ (bàn phím ảo) ⇒ không', () => {
    expect(biDongHop(doDoc({ dangGo: true, trongCao: 500 }))).toBe(false)
  })
  it('máy xoay ngang, tai thỏ ở cạnh trái ⇒ có; screen chưa đổi hướng vẫn đúng', () => {
    expect(biDongHop(doDoc({ manRong: 915, manCao: 412, trongRong: 883, trongCao: 412 }))).toBe(true)
    expect(biDongHop(doDoc({ manRong: 412, manCao: 915, trongRong: 883, trongCao: 412 }))).toBe(true)
    expect(biDongHop(doDoc({ manRong: 412, manCao: 915, trongRong: 915, trongCao: 412 }))).toBe(false)
  })
  it('sai số làm tròn < 12 px ⇒ không', () => {
    expect(biDongHop(doDoc({ trongCao: 907 }))).toBe(false)
  })
})

describe('boCover / coCover', () => {
  const goc = 'width=device-width, initial-scale=1.0, viewport-fit=cover'
  it('gỡ rồi gắn lại trả đúng nội dung có cover', () => {
    expect(boCover(goc)).toBe('width=device-width, initial-scale=1.0')
    expect(coCover(boCover(goc))).toBe(goc)
    expect(coCover(goc)).toBe(goc)
  })
})

describe('giuToanManHs trên trang (jsdom)', () => {
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules() })
  it('đang đóng hộp ⇒ gỡ rồi gắn lại viewport-fit=cover; theme-color theo nền body', async () => {
    vi.useFakeTimers()
    document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">' +
      '<meta name="theme-color" media="(prefers-color-scheme: light)" content="#ffffff"><meta name="theme-color" content="#ffffff">'
    document.body.style.background = 'rgb(246, 246, 252)'
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('fullscreen'), addEventListener: () => {} }))
    vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => setTimeout(() => f(0), 16))
    vi.stubGlobal('screen', { width: 412, height: 915 })
    Object.defineProperty(window, 'innerWidth', { value: 412, configurable: true })
    Object.defineProperty(window, 'innerHeight', { value: 883, configurable: true })
    const meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]')!
    const doi: string[] = []
    new MutationObserver((ds) => ds.forEach(() => doi.push(meta.content))).observe(meta, { attributes: true })
    const { giuToanManHs } = await import('../src/lib/toan-man-hs')
    giuToanManHs()
    await vi.advanceTimersByTimeAsync(2000)
    expect(doi[0]).toBe('width=device-width, initial-scale=1.0')
    expect(doi).toContain('width=device-width, initial-scale=1.0, viewport-fit=cover')
    expect(meta.content).toContain('viewport-fit=cover')
    // Không lặp vô hạn: tối đa 2 lượt gỡ/gắn mỗi lần mở / quay lại.
    expect(doi.filter((c) => !c.includes('cover')).length).toBeLessThanOrEqual(2)
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => expect(m.content).toBe('rgb(246, 246, 252)'))
  })
})
