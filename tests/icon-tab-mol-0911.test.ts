// BIỂU TƯỢNG TAB THEO CẢM XÚC MOL (thầy 09/11 «biểu tượng này thay đổi theo cảm xúc của mol trong màn chính nhé») — src/components/linh-vat/icon-tab-mol.ts.
// Khoá: mở Lộ trình ⇒ chụp mặt Mol đang hiện (datIconTabMol(-1)); Mol đổi mặt (data-mat) ⇒ chụp lại; Lửa vẽ lại cấp (sự kiện) ⇒ chụp lại; rời Lộ trình ⇒ về logo (0).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

const goi = vi.fn(async (_cap: number) => {})
vi.mock('../src/components/linh-vat/mol-dong', () => ({ datIconTabMol: (cap: number) => goi(cap) }))

beforeEach(() => { goi.mockClear(); vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => window.setTimeout(() => f(0), 0)); vi.stubGlobal('cancelAnimationFrame', (h: number) => window.clearTimeout(h)) })
afterEach(() => { vi.unstubAllGlobals(); document.body.innerHTML = '' })
const cho = (ms: number) => new Promise((r) => setTimeout(r, ms))

it('chụp ngay khi mở, chụp lại khi Mol đổi mặt / Lửa vẽ lại cấp (nhịp ≥ 250 ms), rời màn ⇒ về logo', async () => {
  const { theoDoiIconTabMol } = await import('../src/components/linh-vat/icon-tab-mol')
  document.body.innerHTML = '<div class="bi lua"><svg class="mol-svg" data-mat="chao"></svg></div>'
  const don = theoDoiIconTabMol(() => null)
  await cho(20)
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
  // sau khi dọn: Mol đổi mặt không chụp nữa
  document.querySelector('svg')!.setAttribute('data-mat', 'nghi')
  await cho(300)
  expect(goi).toHaveBeenCalledTimes(4)
})
