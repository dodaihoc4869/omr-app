// Thầy 03/11: «tất cả công thức kiểu này phải hiển thị đẹp vừa vặn» (ảnh: «CH₃CH₂CH(NH₂)C | OOH.», «CH₃CH(NH₂)COOH | .»). Xem src/lib/vua-phuong-an.ts.
import { afterEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CO_LUOI, CO_MIN, heSoCo, vuaPhuongAn } from '../src/lib/vua-phuong-an'

afterEach(() => { document.body.innerHTML = ''; vi.restoreAllMocks() })

describe('hệ số cỡ chữ', () => {
  it('vừa sẵn ⇒ 1; tràn ít ⇒ thu chung theo phương án tràn nhất; quá sàn ⇒ null', () => {
    expect(heSoCo([1, 1, 1, 1], CO_LUOI)).toBe(1)
    expect(heSoCo([1, 0.92, 1, 0.95], CO_LUOI)).toBe(0.91)
    expect(heSoCo([1, 0.8, 1, 1], CO_LUOI)).toBeNull()
    expect(heSoCo([1, 0.8, 1, 1], CO_MIN)).toBe(0.79)
    expect(heSoCo([0.5], CO_MIN)).toBeNull()
  })
})

/** jsdom không dàn trang ⇒ giả bề rộng: mỗi ô rộng `o` px ở 2 cột, `2o` ở 1 cột; chữ cần `can` px × (cỡ / 19). */
function dung(can: number[], o: number) {
  document.body.innerHTML = `<div class="duo-tra" data-luoi><div class="ht2-lam-tn">${can.map(() => '<button class="ht2-lam-pa"><span class="ht2-lam-pa-chu">CH3CH2CH(NH2)COOH.</span></button>').join('')}</div></div>`
  const khung = document.querySelector<HTMLElement>('.ht2-lam-tn')!
  const goc = window.getComputedStyle.bind(window)
  vi.spyOn(window, 'getComputedStyle').mockImplementation((e: Element) => {
    const cs = goc(e)
    return e === khung ? ({ ...cs, gridTemplateColumns: khung.style.gridTemplateColumns ? '320px' : '160px 160px' } as CSSStyleDeclaration) : cs
  })
  const chu = [...document.querySelectorAll<HTMLElement>('.ht2-lam-pa-chu')]
  chu.forEach((e, i) => {
    const co = () => parseFloat(e.style.fontSize) || 19
    Object.defineProperty(e, 'clientWidth', { get: () => (khung.style.gridTemplateColumns ? 2 * o : o) })
    Object.defineProperty(e, 'scrollWidth', { get: () => (e.style.overflowWrap === 'normal' ? Math.max(can[i]! * (co() / 19), e.clientWidth) : e.clientWidth) })
  })
  return { khung, chu }
}

describe('bỏ qua nhóm đáp án ngắn (không đo bố cục)', () => {
  it('mọi đáp án < 7 ký tự liền / có dấu cách ⇒ không ghi kiểu nào, không đọc scrollWidth', () => {
    document.body.innerHTML = '<div class="ht2-lam-tn"><span class="ht2-lam-pa-chu">6,8 gam.</span><span class="ht2-lam-pa-chu">12</span></div>'
    const khung = document.querySelector<HTMLElement>('.ht2-lam-tn')!
    const doc = vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get')
    vuaPhuongAn(khung)
    expect(doc).not.toHaveBeenCalled()
    expect(khung.style.gridTemplateColumns).toBe('')
    expect(khung.querySelector<HTMLElement>('.ht2-lam-pa-chu')!.style.overflowWrap).toBe('')
  })
})

describe('vuaPhuongAn', () => {
  it('công thức vừa ô ⇒ không đổi gì', () => {
    const { khung, chu } = dung([120, 150, 140, 130], 160)
    vuaPhuongAn(khung)
    expect(chu.every((e) => !e.style.fontSize)).toBe(true)
    expect(!!khung.style.gridTemplateColumns).toBe(false)
    expect(chu.every((e) => !e.style.overflowWrap)).toBe(true)
  })
  it('tràn ít ⇒ thu cỡ chữ CẢ NHÓM cùng hệ số, giữ 2 cột', () => {
    const { khung, chu } = dung([120, 150, 172, 168], 160)
    vuaPhuongAn(khung)
    expect(!!khung.style.gridTemplateColumns).toBe(false)
    const co = chu.map((e) => e.style.fontSize)
    expect(new Set(co).size).toBe(1)
    expect(parseFloat(co[0]!)).toBeLessThan(19)
    expect(172 * (parseFloat(co[0]!) / 19)).toBeLessThanOrEqual(160)
  })
  it('tràn nhiều ở 2 cột ⇒ chuyển 1 cột, chữ giữ cỡ gốc', () => {
    const { khung, chu } = dung([120, 150, 240, 130], 160)
    vuaPhuongAn(khung)
    expect(!!khung.style.gridTemplateColumns).toBe(true)
    expect(chu.every((e) => !e.style.fontSize)).toBe(true)
  })
  it('đo lại (nội dung đổi): gỡ cỡ cũ + 1 cột cũ rồi tính lại', () => {
    const can = [120, 150, 240, 130]
    const { khung, chu } = dung(can, 160)
    vuaPhuongAn(khung)
    expect(!!khung.style.gridTemplateColumns).toBe(true)
    can.splice(0, 4, 100, 100, 170, 100)
    vuaPhuongAn(khung)
    expect(!!khung.style.gridTemplateColumns).toBe(false)
    expect(chu.every((e) => parseFloat(e.style.fontSize) < 19)).toBe(true)
  })
})

describe('nối vào app (mảnh nạp lười, không cộng byte lượt mở)', () => {
  const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
  it('cổng học sinh + màn thi gắn bộ tự dò; thẻ câu / màn làm không phải nhập gì', () => {
    for (const t of ['src/components/cong-hs-nap-luoi.ts', 'src/lib/do-treo-may-thi.ts']) expect(doc(t)).toMatch(/ganToanTrang\(\)/)
    expect(doc('src/components/TheCau.tsx')).not.toMatch(/vua-phuong-an/)
    expect(doc('src/components/hoc-tap/LamCau.tsx')).not.toMatch(/vua-phuong-an/)
    expect(doc('src/index.css')).not.toMatch(/data-pa-do/)
  })
  it('tự dò: nhóm phương án vẽ thêm về sau cũng được căn', async () => {
    const { ganToanTrang } = await import('../src/lib/vua-phuong-an')
    const ro = vi.fn()
    vi.stubGlobal('ResizeObserver', class { observe = ro; disconnect() {} })
    ganToanTrang()
    document.body.innerHTML = '<div class="duo-tra"><div class="ht2-lam-tn"><button class="ht2-lam-pa"><span class="ht2-lam-pa-chu">x</span></button></div></div><div><div class="pa-hang"></div></div>'
    await new Promise((r) => setTimeout(r, 0))
    expect(ro).toHaveBeenCalledTimes(2)
    vi.unstubAllGlobals()
  })
})
