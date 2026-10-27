// @vitest-environment jsdom
// BI CHUYỂN ĐỘNG (thầy 27/10, học cú Duo): mảnh bi-dong nạp LƯỜI (chỉ import() trong Bi.tsx), không màu thô, giảm chuyển động / máy yếu ⇒ Bi tĩnh,
// cảm xúc ánh xạ đúng tình huống, cỗ máy trạng thái chuyển được mọi trạng thái, chạm ⇒ phản ứng, tab ẩn ⇒ dừng hoạt ảnh.
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { Bi, biDungYen, ttTheoCam, TT_THEO_CAM } from '../src/components/linh-vat/Bi'
import { hinhMieng, taoBi, TRANG_THAI_BI } from '../src/components/linh-vat/bi-dong'

type GiaAnim = { pause: ReturnType<typeof vi.fn>; play: ReturnType<typeof vi.fn>; cancel: ReturnType<typeof vi.fn> }
const dsAnim: GiaAnim[] = []
function giaLapWaapi() {
  const proto = Element.prototype as unknown as Record<string, unknown>
  proto.animate = function (this: Element) {
    const a = { pause: vi.fn(), play: vi.fn(), cancel: vi.fn(), updatePlaybackRate: vi.fn(), playState: 'running', effect: { target: this }, onfinish: null, oncancel: null }
    dsAnim.push(a)
    return a
  }
  proto.getAnimations = () => dsAnim
}
afterEach(() => { delete (Element.prototype as unknown as Record<string, unknown>).animate; delete (Element.prototype as unknown as Record<string, unknown>).getAnimations; dsAnim.length = 0; vi.useRealTimers() })

describe('Bi chuyển động', () => {
  it('nạp lười: Bi.tsx chỉ import() mảnh bi-dong, không import tĩnh', () => {
    const tsx = readFileSync('src/components/linh-vat/Bi.tsx', 'utf8')
    expect(tsx).toMatch(/import\('\.\/bi-dong'\)/)
    expect(tsx).not.toMatch(/^import (?!type)[^\n]*from '\.\/bi-dong'/m)
  })
  it('không màu thô; mọi luật CSS dưới app học sinh; giảm chuyển động tắt hết', () => {
    const ts = readFileSync('src/components/linh-vat/bi-dong.ts', 'utf8').replace(/^\s*\/\/.*$/gm, '')
    const css = readFileSync('src/styles/bi-dong.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
    for (const s of [ts, css]) {
      expect(s).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
      expect(s).not.toMatch(/\b(?:rgba?|hsla?)\(/)
      expect(s).not.toMatch(/(?<![\w-])(?:white|black|red|green|blue|orange|yellow|gray|grey)(?![\w-])/)
    }
    expect(css).toMatch(/prefers-reduced-motion: reduce\)\s*\{\s*\[data-trong='hs'\] \.bi-dong/)
    for (const luat of css.split('}').map((x) => x.split('{')[0]!.trim()).filter((x) => x && !x.startsWith('@') && !/^(?:\d|from|to)/.test(x))) expect(luat).toMatch(/\[data-trong='hs'\]/)
  })
  it('ánh xạ cảm xúc theo tình huống', () => {
    expect(TT_THEO_CAM).toMatchObject({ vui: 'dung', sai: 'sai', nghi: 'nghieng', mung: 'nhay-mua', ngu: 'ngu', lua: 'chuoi' })
    expect(ttTheoCam('mung')).toEqual(['nhay-mua', { sau: 3600, ve: 'vui' }])
    expect(ttTheoCam('mung', 'yen')[0]).toBe('vui')
    expect(ttTheoCam('lua')).toEqual(['chuoi', { gon: true }])
    expect(ttTheoCam('chao', 'yen')).toEqual(['yen', { em: true }])
  })
  it('giảm chuyển động / máy yếu / không có Web Animations ⇒ Bi tĩnh', () => {
    expect(biDungYen()).toBe(true) // jsdom không có Element.animate
    giaLapWaapi()
    window.matchMedia = ((q: string) => ({ matches: q.includes('reduce') })) as unknown as typeof window.matchMedia
    expect(biDungYen()).toBe(true)
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia
    expect(biDungYen()).toBe(false)
    document.documentElement.classList.add('may-yeu')
    expect(biDungYen()).toBe(true)
    document.documentElement.classList.remove('may-yeu')
  })
  it('Bi tĩnh vẽ trước rồi đổi sang Bi chuyển động (không lỗi thứ tự hook), đổi cảm xúc ⇒ chuyển trạng thái', async () => {
    giaLapWaapi()
    window.matchMedia = (() => ({ matches: false })) as unknown as typeof window.matchMedia
    const { container, rerender } = render(<Bi cam="vui" size={64} />)
    expect(container.querySelector('svg.bi')).not.toBeNull()
    await waitFor(() => expect(container.querySelector('span.bi.bi-dong svg.bd-svg')).not.toBeNull())
    const span = container.querySelector('span.bi-dong') as HTMLElement
    expect(span.style.width).toBe('64px'); expect(span.style.height).toBe('74px'); expect(span.getAttribute('aria-hidden')).toBe('true')
    expect(span.querySelector('svg')!.getAttribute('data-trang-thai')).toBe('dung')
    rerender(<Bi cam="sai" size={64} />)
    expect(span.querySelector('svg')!.getAttribute('data-trang-thai')).toBe('sai')
  })
  it('miệng khớp chữ tiếng Việt', () => {
    expect(['a', 'ă', 'ấ', 'ê', 'i', 'ô', 'ơ', 'ư', 'm', ' ', '!', 'n'].map(hinhMieng)).toEqual(['a', 'a', 'a', 'e', 'e', 'o', 'o', 'u', 'cuoi', 'cuoi', 'cuoi', 'e'])
  })
  it('cỗ máy trạng thái: mọi trạng thái + biệt danh; chạm ⇒ phản ứng, chạm khi ngủ ⇒ giật mình; tab ẩn ⇒ dừng; huỷ ⇒ gỡ sạch', () => {
    vi.useFakeTimers()
    giaLapWaapi()
    const o = document.createElement('span')
    document.body.appendChild(o)
    const doi: string[] = []
    const bi = taoBi(o, { trangThai: 'yen', khiDoi: (t) => doi.push(t) })
    const svg = o.querySelector('svg')!
    expect(svg.getAttribute('aria-hidden')).toBe('true')
    for (const t of TRANG_THAI_BI) { bi.datTrangThai(t, { chu: 'Chào em', so: 7 }); expect(bi.trangThai).toBe(t); expect(svg.getAttribute('data-trang-thai')).toBe(t) }
    bi.datTrangThai('buon'); expect(bi.trangThai).toBe('sai'); expect(svg.getAttribute('data-mau')).toBe('sai')
    bi.datTrangThai('vui'); expect(bi.trangThai).toBe('vui')
    const cham = svg.querySelector('.bd-cham')!
    cham.dispatchEvent(new Event('pointerdown')); expect(bi.trangThai).toBe('cham')
    vi.advanceTimersByTime(1600); expect(bi.trangThai).toBe('vui') // chọc xong về trạng thái nền
    bi.datTrangThai('ngu'); cham.dispatchEvent(new Event('pointerdown')); expect(bi.trangThai).toBe('giat-minh')
    vi.advanceTimersByTime(1800); expect(bi.trangThai).toBe('ngu')
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(dsAnim.every((a) => a.pause.mock.calls.length > 0)).toBe(true)
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false })
    document.dispatchEvent(new Event('visibilitychange'))
    expect(dsAnim.some((a) => a.play.mock.calls.length > 0)).toBe(true)
    bi.huy()
    expect(o.querySelector('svg')).toBeNull()
    expect(doi[0]).toBe('yen')
  })
})
