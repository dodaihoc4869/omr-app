// Thẻ nhắc Samsung Internet (27/10): nhận diện trình duyệt + hiện MỘT lần (localStorage; bị chặn ⇒ một lần trong phiên) + chỗ gắn trên Lộ trình.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { KHOA_NHAC_SAMSUNG, _quenPhienNhacSamsung, canNhacSamsung, ghiDaNhacSamsung, laSamsungInternet } from '../src/lib/nhac-samsung'
import NhacSamsung from '../src/components/hoc-tap/NhacSamsung'

const UA_SAMSUNG = 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0.0.0 Mobile Safari/537.36'
const UA_CHROME = 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
const UA_IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

const khoNho = () => { const m = new Map<string, string>(); return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v) } } }
const khoHong = { getItem: () => { throw new Error('SecurityError') }, setItem: () => { throw new Error('QuotaExceededError') } }

beforeEach(() => { _quenPhienNhacSamsung(); try { localStorage.clear() } catch { /* bỏ qua */ } })
afterEach(() => cleanup())

describe('laSamsungInternet', () => {
  it('nhận Samsung Internet, không nhận Chrome trên máy Samsung hay Safari', () => {
    expect(laSamsungInternet(UA_SAMSUNG)).toBe(true)
    expect(laSamsungInternet(UA_CHROME)).toBe(false)
    expect(laSamsungInternet(UA_IPHONE)).toBe(false)
    expect(laSamsungInternet('')).toBe(false)
  })
  it('không truyền chuỗi ⇒ đọc navigator.userAgent', () => {
    expect(laSamsungInternet()).toBe(/SamsungBrowser/.test(navigator.userAgent))
  })
})

describe('hiện một lần', () => {
  it('nhớ trên máy: đã ghi ⇒ không nhắc nữa, kể cả phiên sau', () => {
    const kho = khoNho()
    expect(canNhacSamsung(kho)).toBe(true)
    ghiDaNhacSamsung(kho)
    expect(kho.getItem(KHOA_NHAC_SAMSUNG)).toBe('1')
    _quenPhienNhacSamsung() // mở app lần sau
    expect(canNhacSamsung(kho)).toBe(false)
  })
  it('localStorage bị chặn ⇒ vẫn nhắc lần đầu, rồi chỉ một lần trong phiên', () => {
    expect(canNhacSamsung(khoHong)).toBe(true)
    expect(() => ghiDaNhacSamsung(khoHong)).not.toThrow()
    expect(canNhacSamsung(khoHong)).toBe(false)
  })
  it('không có kho (null) ⇒ một lần trong phiên', () => {
    expect(canNhacSamsung(null)).toBe(true)
    ghiDaNhacSamsung(null)
    expect(canNhacSamsung(null)).toBe(false)
  })
})

describe('thẻ NhacSamsung', () => {
  it('hiện chữ đúng chuẩn + nút «Đã hiểu»; bấm ⇒ ẩn; gắn lại ⇒ không hiện', () => {
    const { unmount } = render(<NhacSamsung />)
    expect(screen.getByText('Màu app trên Samsung Internet')).toBeTruthy()
    expect(screen.getByText(/Cài đặt › Labs › bật «Sử dụng chủ đề tối của trang web»/)).toBeTruthy()
    expect(screen.getByText(/hoặc mở app bằng Chrome/)).toBeTruthy()
    expect(localStorage.getItem(KHOA_NHAC_SAMSUNG)).toBe('1') // jsdom không có IntersectionObserver ⇒ ghi ngay khi hiện
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Đã hiểu' })) })
    expect(screen.queryByText('Màu app trên Samsung Internet')).toBeNull()
    unmount()
    render(<NhacSamsung />)
    expect(screen.queryByText('Màu app trên Samsung Internet')).toBeNull()
  })
  it('rời Lộ trình mà chưa bấm ⇒ quay lại cũng không hiện nữa', () => {
    const r = render(<NhacSamsung />)
    expect(screen.getByRole('button', { name: 'Đã hiểu' })).toBeTruthy()
    r.unmount()
    render(<NhacSamsung />)
    expect(screen.queryByRole('button', { name: 'Đã hiểu' })).toBeNull()
  })
})

describe('chỉ tính «đã nhắc» khi thẻ vào khung nhìn', () => {
  it('chưa thấy (Lộ trình cuộn tới chặng, thẻ khuất) ⇒ chưa ghi; thấy ⇒ ghi', () => {
    let goi: ((e: { isIntersecting: boolean }[]) => void) | null = null
    const goc = globalThis.IntersectionObserver
    globalThis.IntersectionObserver = class { constructor(cb: typeof goi) { goi = cb } observe() {} disconnect() {} } as never
    try {
      const r = render(<NhacSamsung />)
      expect(localStorage.getItem(KHOA_NHAC_SAMSUNG)).toBeNull()
      act(() => goi!([{ isIntersecting: false }]))
      expect(localStorage.getItem(KHOA_NHAC_SAMSUNG)).toBeNull()
      r.unmount()
      render(<NhacSamsung />) // chưa thấy ⇒ lần sau vẫn hiện
      expect(screen.getByRole('button', { name: 'Đã hiểu' })).toBeTruthy()
      act(() => goi!([{ isIntersecting: true }]))
      expect(localStorage.getItem(KHOA_NHAC_SAMSUNG)).toBe('1')
    } finally { globalThis.IntersectionObserver = goc }
  })
})

describe('chỗ gắn (khoá nguồn)', () => {
  const trong = readFileSync('src/components/hoc-tap/TrongHs.tsx', 'utf8')
  const css = readFileSync('src/styles/nhac-samsung.css', 'utf8')
  it('chỉ trên Lộ trình, đã đăng nhập, không khi ca kiểm tra đang mở; mảnh nạp lười, tải hỏng ⇒ null', () => {
    expect(trong).toMatch(/lazy\(\(\) => import\('\.\/NhacSamsung'\)\.catch\(/)
    const dong = trong.split('\n').find((l) => l.includes('<NhacSamsung'))!
    expect(dong).toMatch(/p\.token && chinh !== 'ca' && laSamsungInternet\(\)/)
    // nằm SAU nhánh Luyện tập / Thành tích (return sớm) ⇒ chỉ Lộ trình
    expect(trong.indexOf('<NhacSamsung')).toBeGreaterThan(trong.indexOf('// ───── LỘ TRÌNH'))
  })
  it('màu chỉ biến --tr-*, nút ≥ 44px, ngoài precache', () => {
    expect(css).not.toMatch(/#[0-9a-f]{3,8}\b|rgb\(|hsl\(/i)
    for (const m of css.matchAll(/var\((--[a-z0-9-]+)\)/g)) expect(m[1]).toMatch(/^--tr-/)
    expect(css).toMatch(/min-height: 44px/)
    expect(readFileSync('vite.config.ts', 'utf8')).toContain("'**/NhacSamsung-*.{js,css}'")
  })
})
