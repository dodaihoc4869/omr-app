// BIỂU TƯỢNG TAB THEO CẢM XÚC MOL (thầy 09/11 «biểu tượng này thay đổi theo cảm xúc của mol trong màn chính nhé») — src/components/linh-vat/icon-tab-mol.ts.
// SỬA CÓ CHỦ ĐÍCH 09/11 (tác tử toc-do + đo CPU ×6: chụp lúc mở / hoãn 3 s làm chậm «tới chạm được» / «vào chặng»): chỉ chụp mặt Mol đang hiện khi em RỜI
// trang (tab ẩn) hoặc cửa sổ mất tiêu điểm, và khi Lửa đổi cấp trong lúc ấy — đang học trên trang ⇒ không chụp; rời Lộ trình ⇒ về logo (0) nếu đã chụp.
// Điện thoại / app đã cài / máy yếu (không có tab để thấy) ⇒ không làm gì.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const goi = vi.fn(async (_cap: number) => {})
vi.mock('../src/components/linh-vat/mol-dong', () => ({ datIconTabMol: (cap: number) => goi(cap) }))

const media = (q: Record<string, boolean>) => vi.stubGlobal('matchMedia', (s: string) => ({ matches: q[s] ?? false }))
let an = false, focus = true
beforeEach(() => {
  goi.mockClear(); an = false; focus = true
  vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => (an ? 'hidden' : 'visible'))
  vi.spyOn(document, 'hasFocus').mockImplementation(() => focus)
})
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); document.documentElement.classList.remove('may-yeu') })
const roiTab = () => { an = true; focus = false; document.dispatchEvent(new Event('visibilitychange')) }
const veTab = () => { an = false; focus = true; document.dispatchEvent(new Event('visibilitychange')) }

it('máy tính: đang học trên trang ⇒ không chụp; rời tab / cửa sổ mất tiêu điểm ⇒ chụp mặt Mol; Lửa đổi cấp lúc ở tab khác ⇒ chụp lại; rời Lộ trình ⇒ về logo', async () => {
  media({ '(pointer: fine)': true })
  const { theoDoiIconTabMol } = await import('../src/components/linh-vat/icon-tab-mol')
  const don = theoDoiIconTabMol(() => null)
  window.dispatchEvent(new Event('ddh-lua-cap')) // đang ở trang ⇒ không làm gì
  expect(goi).not.toHaveBeenCalled()
  roiTab()
  expect(goi.mock.calls.map((c) => c[0])).toEqual([-1])
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 1000)
  window.dispatchEvent(new Event('ddh-lua-cap'))
  expect(goi).toHaveBeenCalledTimes(2)
  veTab()
  vi.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000)
  focus = false
  window.dispatchEvent(new Event('blur'))
  expect(goi).toHaveBeenCalledTimes(3)
  don()
  expect(goi.mock.calls.at(-1)![0]).toBe(0)
  roiTab()
  expect(goi).toHaveBeenCalledTimes(4) // đã dọn: không chụp nữa
})

it('điện thoại (cảm ứng) / app đã cài / máy yếu ⇒ không có tab ⇒ không làm gì; chưa từng chụp ⇒ rời màn không đụng logo', async () => {
  const { theoDoiIconTabMol, coThanhTab } = await import('../src/components/linh-vat/icon-tab-mol')
  media({ '(pointer: coarse)': true })
  expect(coThanhTab()).toBe(false)
  media({ '(pointer: fine)': true, '(display-mode: standalone)': true })
  expect(coThanhTab()).toBe(false)
  media({ '(pointer: fine)': true })
  document.documentElement.classList.add('may-yeu')
  expect(coThanhTab()).toBe(false)
  const don = theoDoiIconTabMol(() => null)
  roiTab()
  don()
  expect(goi).not.toHaveBeenCalled()
  document.documentElement.classList.remove('may-yeu')
  const don2 = theoDoiIconTabMol(() => null)
  don2()
  expect(goi).not.toHaveBeenCalled()
})
