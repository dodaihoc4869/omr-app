// BẢNG "MỌI THỨ VỀ CON" KIỂU APPLE — ĐẾM SỐ LÊN + "hiện lần lượt CHỈ lần đầu trong ngày" (GHI-CHU-BUILD.md mục 2 và 3; phần chưa làm của lượt 1).
// Số cuối LUÔN đúng bằng giá trị thật; không đếm khi giảm chuyển động / không có rAF / không có matchMedia (jsdom); thoát giữa chừng vẫn để số thật. Điều đáng mừng chỉ chạy chuyển động ở lần mở đầu tiên của MỖI con trong ngày VN.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import BangMoiThu from '../src/components/ph-moi/BangMoiThu'
import { SoDem, nenDemSo, tinhSoDem } from '../src/components/ph-moi/bang/so-dem'
import { useLanDauTrongNgay } from '../src/components/ph-moi/bang/dung-chung'
import { docTatCaVeCon } from '../src/lib/ph-moi/du-lieu'
import { PH_APPLE } from './_ph-moi/du-lieu-mau-apple'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8')
const giaoThem = { san: true, dangTai: false, conLai: 2, goiGanNhat: null, the: null, dangGui: false, giao: vi.fn() }
const bang = (sbd: string) => render(<BangMoiThu pm={docTatCaVeCon(PH_APPLE)!} sbd={sbd} lop="12" giaoThem={giaoThem as never} onVe={() => {}} />)

beforeEach(() => {
  localStorage.clear()
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.useRealTimers()
  localStorage.clear()
})

describe('tinhSoDem — hàm thuần', () => {
  it('p = 0 ⇒ 0 (giữ số chữ số lẻ); p giữa ⇒ giá trị theo tỉ lệ; p ≥ 1 ⇒ NGUYÊN chữ số cuối', () => {
    expect(tinhSoDem('38', 0)).toBe('0')
    expect(tinhSoDem('38', 0.5)).toBe('19')
    expect(tinhSoDem('79', 0.25)).toBe('20')
    expect(tinhSoDem('7,5', 0)).toBe('0,0')
    expect(tinhSoDem('7,5', 0.4)).toBe('3,0')
    expect(tinhSoDem('6,75', 0.5)).toBe('3,38')
    for (const c of ['38', '7,5', '6,75', '0', '100']) expect(tinhSoDem(c, 1)).toBe(c)
    expect(tinhSoDem('7,5', 2)).toBe('7,5')
  })
  it('chữ không phải số / rỗng / p hỏng ⇒ không đụng: trả nguyên; đơn điệu không giảm', () => {
    for (const c of ['—', '', '12/16', 'a1', '1,2,3', '-3']) expect(tinhSoDem(c, 0.3), c).toBe(c)
    expect(tinhSoDem('38', Number.NaN)).toBe('38') // tiến độ hỏng ⇒ hiện số thật (an toàn hơn là số 0)
    expect(tinhSoDem('38', -1)).toBe('0')
    let truoc = -1
    for (let i = 0; i <= 20; i++) {
      const v = Number(tinhSoDem('79', i / 20).replace(',', '.'))
      expect(v).toBeGreaterThanOrEqual(truoc)
      truoc = v
    }
  })
})

describe('SoDem — thành phần', () => {
  const rAF = () => {
    let t = 0
    vi.useFakeTimers()
    vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => setTimeout(() => cb((t += 16)), 16) as unknown as number)
    vi.stubGlobal('cancelAnimationFrame', (h: number) => clearTimeout(h))
  }
  const matchMedia = (giam: boolean) => vi.stubGlobal('matchMedia', (q: string) => ({ matches: /reduce/.test(q) ? giam : false, media: q, addEventListener: () => {}, removeEventListener: () => {} }))

  it('không có matchMedia (jsdom) hoặc giảm chuyển động ⇒ KHÔNG đếm: hiện thẳng số thật', () => {
    expect(nenDemSo()).toBe(false)
    expect(render(<SoDem chu="38" />).container.textContent).toBe('38')
    cleanup()
    rAF()
    matchMedia(true)
    expect(nenDemSo()).toBe(false)
    expect(render(<SoDem chu="7,5" />).container.textContent).toBe('7,5')
  })
  it('được đếm: vẽ từ 0, tăng dần, chạm ĐÚNG số cuối sau ~700 ms; trễ `tre` lùi thời điểm bắt đầu; chữ không phải số không đếm', () => {
    rAF()
    matchMedia(false)
    expect(nenDemSo()).toBe(true)
    const { container } = render(<SoDem chu="38" tre={100} />)
    expect(container.textContent).toBe('0') // đặt về 0 ngay lúc dựng (trước khi vẽ)
    act(() => vi.advanceTimersByTime(60))
    expect(container.textContent).toBe('0') // còn trong thời gian trễ
    act(() => vi.advanceTimersByTime(300))
    const giua = Number(container.textContent)
    expect(giua).toBeGreaterThan(0)
    expect(giua).toBeLessThan(38)
    act(() => vi.advanceTimersByTime(1000))
    expect(container.textContent).toBe('38')
    cleanup()
    const le = render(<SoDem chu="7,5" />).container
    expect(le.textContent).toBe('0,0')
    act(() => vi.advanceTimersByTime(1000))
    expect(le.textContent).toBe('7,5')
    cleanup()
    expect(render(<SoDem chu="—" />).container.textContent).toBe('—')
  })
  it('gỡ giữa chừng ⇒ dọn hẹn giờ, không lỗi; đổi số ⇒ đếm lại tới số MỚI', () => {
    rAF()
    matchMedia(false)
    const { container, rerender, unmount } = render(<SoDem chu="38" />)
    act(() => vi.advanceTimersByTime(200))
    rerender(<SoDem chu="52" />)
    act(() => vi.advanceTimersByTime(1000))
    expect(container.textContent).toBe('52')
    unmount()
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow()
  })
  it('màn thật: ba số cạnh vòng và điểm ca đều là SoDem nhưng chữ cuối đúng (38 · 79 · 52 · 7,5) khi không đếm', () => {
    const { container } = bang('12121212')
    expect([...container.querySelectorAll('.phm-chu-giai b')].map((b) => b.firstElementChild!.textContent)).toEqual(['38', '79', '52'])
    expect(container.querySelector('.phm-diem b')!.textContent).toBe('7,5')
  })
})

describe('useLanDauTrongNgay + Điều đáng mừng CHỈ lần đầu trong ngày', () => {
  it('lần mở đầu true rồi ghi nhớ; mở lại false; khoá khác (con khác / ngày khác) lại true; localStorage hỏng ⇒ luôn true', () => {
    expect(renderHook(() => useLanDauTrongNgay('k|1')).result.current).toBe(true)
    expect(renderHook(() => useLanDauTrongNgay('k|1')).result.current).toBe(false)
    expect(renderHook(() => useLanDauTrongNgay('k|2')).result.current).toBe(true)
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('chặn') }, setItem: () => { throw new Error('chặn') } })
    expect(renderHook(() => useLanDauTrongNgay('k|3')).result.current).toBe(true)
    expect(renderHook(() => useLanDauTrongNgay('k|3')).result.current).toBe(true)
  })
  it('bảng: lần mở đầu trong ngày `.phm-mung` có data-hien (chạy chuyển động); mở lại cùng con cùng ngày KHÔNG; con khác CÓ; khoá theo số báo danh + ngày VN', () => {
    expect(bang('111').container.querySelector('.phm-mung')!.hasAttribute('data-hien')).toBe(true)
    cleanup()
    expect(bang('111').container.querySelector('.phm-mung')!.hasAttribute('data-hien')).toBe(false)
    cleanup()
    expect(bang('222').container.querySelector('.phm-mung')!.hasAttribute('data-hien')).toBe(true)
    expect(Object.keys(localStorage).filter((k) => k.startsWith('phm-mung-da-hien|')).sort()).toEqual(['phm-mung-da-hien|111|2026-9-21', 'phm-mung-da-hien|222|2026-9-21'])
  })
  it('khoá nguồn: CSS chỉ chạy hiện lần lượt khi có data-hien và trong no-preference; số đếm không thêm thư viện', () => {
    const css = doc('src/components/ph-moi/bang/TongQuan.css')
    const khoi = /@media \(prefers-reduced-motion: no-preference\) \{([\s\S]*?)\n\}\n/.exec(css)![1]!
    expect(khoi).toMatch(/\.phm-mung\[data-hien\] > li \{[^}]*animation/)
    expect(css.replace(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}\n/, '')).not.toMatch(/\.phm-mung[^{]*\{[^}]*animation/)
    const dem = doc('src/components/ph-moi/bang/so-dem.tsx').replace(/\/\/.*$/gm, '')
    expect((dem.match(/^\s*import\s.*$/gm) ?? []).map((d) => /from\s+['"]([^'"]+)['"]/.exec(d)![1])).toEqual(['react'])
  })
})
