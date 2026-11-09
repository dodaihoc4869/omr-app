// BIỂU TƯỢNG TAB THEO CẢM XÚC MOL (thầy 09/11 «biểu tượng này thay đổi theo cảm xúc của mol trong màn chính nhé») — src/components/linh-vat/icon-tab-mol.ts.
// Khoá: máy có thanh tab (trình duyệt máy tính) ⇒ SAU khi mở xong mới chụp mặt Mol đang hiện (datIconTabMol(-1)); Mol đổi mặt (data-mat) ⇒ chụp lại; Lửa vẽ lại
// cấp (sự kiện) ⇒ chụp lại; rời Lộ trình ⇒ về logo (0). SỬA CÓ CHỦ ĐÍCH 09/11 (tác tử toc-do: «tới chạm được» ×6 nghi chậm): điện thoại / app đã cài / máy
// yếu (không có tab để thấy) ⇒ KHÔNG chụp gì; máy tính chờ `tre` ms rồi mới bắt đầu.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const goi = vi.fn(async (_cap: number) => {})
vi.mock('../src/components/linh-vat/mol-dong', () => ({ datIconTabMol: (cap: number) => goi(cap) }))

const media = (q: Record<string, boolean>) => vi.stubGlobal('matchMedia', (s: string) => ({ matches: q[s] ?? false }))
beforeEach(() => { goi.mockClear(); vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => window.setTimeout(() => f(0), 0)); vi.stubGlobal('cancelAnimationFrame', (h: number) => window.clearTimeout(h)) })
afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = ''; localStorage.clear(); document.documentElement.classList.remove('may-yeu') })
const cho = (ms: number) => new Promise((r) => setTimeout(r, ms))

it('máy tính: chờ `tre` rồi chụp, chụp lại khi Mol đổi mặt / Lửa vẽ lại cấp (nhịp ≥ 250 ms), rời màn ⇒ về logo', async () => {
  media({ '(pointer: fine)': true })
  const { theoDoiIconTabMol } = await import('../src/components/linh-vat/icon-tab-mol')
  document.body.innerHTML = '<div class="bi lua"><svg class="mol-svg" data-mat="chao"></svg></div>'
  const don = theoDoiIconTabMol(() => null, 40)
  await cho(20)
  expect(goi).not.toHaveBeenCalled() // chưa tới lúc: không làm gì trong lúc app đang mở
  await cho(60)
  expect(goi.mock.calls.map((c) => c[0])).toEqual([-1])
  await cho(260)
  document.querySelector('svg')!.setAttribute('data-mat', 'vui')
  await cho(20)
  expect(goi.mock.calls.map((c) => c[0])).toEqual([-1, -1])
  await cho(260)
  window.dispatchEvent(new Event('ddh-lua-cap'))
  await cho(20)
  expect(goi).toHaveBeenCalledTimes(3)
  don()
  expect(goi.mock.calls.at(-1)![0]).toBe(0)
  document.querySelector('svg')!.setAttribute('data-mat', 'nghi')
  await cho(300)
  expect(goi).toHaveBeenCalledTimes(4)
})

it('điện thoại (cảm ứng) / app đã cài / máy yếu ⇒ không chụp gì; rời màn trước lúc bắt đầu ⇒ không đụng logo', async () => {
  const { theoDoiIconTabMol, coThanhTab } = await import('../src/components/linh-vat/icon-tab-mol')
  document.body.innerHTML = '<div class="bi lua"><svg class="mol-svg" data-mat="chao"></svg></div>'
  media({ '(pointer: coarse)': true })
  expect(coThanhTab()).toBe(false)
  media({ '(pointer: fine)': true, '(display-mode: standalone)': true })
  expect(coThanhTab()).toBe(false)
  media({ '(pointer: fine)': true })
  document.documentElement.classList.add('may-yeu')
  expect(coThanhTab()).toBe(false)
  const don = theoDoiIconTabMol(() => null, 0)
  await cho(50)
  don()
  expect(goi).not.toHaveBeenCalled()
  document.documentElement.classList.remove('may-yeu')
  const don2 = theoDoiIconTabMol(() => null, 100)
  don2()
  await cho(150)
  expect(goi).not.toHaveBeenCalled()
})
