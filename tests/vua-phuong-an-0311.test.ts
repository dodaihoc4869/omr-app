// Thầy 03/11: «tất cả công thức kiểu này phải hiển thị đẹp vừa vặn» (ảnh: «CH₃CH₂CH(NH₂)C | OOH.», «CH₃CH(NH₂)COOH | .»). Xem src/lib/vua-phuong-an.ts.
import { afterEach, describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { CO_LUOI, CO_MIN, heSoCo, vuaPhuongAn } from '../src/lib/vua-phuong-an'

afterEach(() => { document.body.innerHTML = '' })

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
  document.body.innerHTML = `<div class="duo-tra" data-luoi><div class="ht2-lam-tn">${can.map(() => '<button class="ht2-lam-pa"><span class="ht2-lam-pa-chu">x</span></button>').join('')}</div></div>`
  const luoi = document.querySelector<HTMLElement>('.duo-tra')!, khung = document.querySelector<HTMLElement>('.ht2-lam-tn')!
  const chu = [...document.querySelectorAll<HTMLElement>('.ht2-lam-pa-chu')]
  chu.forEach((e, i) => {
    const co = () => parseFloat(e.style.fontSize) || 19
    Object.defineProperty(e, 'clientWidth', { get: () => (luoi.hasAttribute('data-pa-mot') ? 2 * o : o) })
    Object.defineProperty(e, 'scrollWidth', { get: () => (khung.hasAttribute('data-pa-do') ? Math.max(can[i]! * (co() / 19), e.clientWidth) : e.clientWidth) })
  })
  return { luoi, khung, chu }
}

describe('vuaPhuongAn', () => {
  it('công thức vừa ô ⇒ không đổi gì', () => {
    const { luoi, khung, chu } = dung([120, 150, 140, 130], 160)
    vuaPhuongAn(khung)
    expect(chu.every((e) => !e.style.fontSize)).toBe(true)
    expect(luoi.hasAttribute('data-pa-mot')).toBe(false)
    expect(khung.hasAttribute('data-pa-do')).toBe(false)
  })
  it('tràn ít ⇒ thu cỡ chữ CẢ NHÓM cùng hệ số, giữ 2 cột', () => {
    const { luoi, khung, chu } = dung([120, 150, 172, 168], 160)
    vuaPhuongAn(khung)
    expect(luoi.hasAttribute('data-pa-mot')).toBe(false)
    const co = chu.map((e) => e.style.fontSize)
    expect(new Set(co).size).toBe(1)
    expect(parseFloat(co[0]!)).toBeLessThan(19)
    expect(172 * (parseFloat(co[0]!) / 19)).toBeLessThanOrEqual(160)
  })
  it('tràn nhiều ở 2 cột ⇒ chuyển 1 cột, chữ giữ cỡ gốc', () => {
    const { luoi, khung, chu } = dung([120, 150, 240, 130], 160)
    vuaPhuongAn(khung)
    expect(luoi.hasAttribute('data-pa-mot')).toBe(true)
    expect(chu.every((e) => !e.style.fontSize)).toBe(true)
  })
  it('đo lại (nội dung đổi): gỡ cỡ cũ + 1 cột cũ rồi tính lại', () => {
    const can = [120, 150, 240, 130]
    const { luoi, khung, chu } = dung(can, 160)
    vuaPhuongAn(khung)
    expect(luoi.hasAttribute('data-pa-mot')).toBe(true)
    can.splice(0, 4, 100, 100, 170, 100)
    vuaPhuongAn(khung)
    expect(luoi.hasAttribute('data-pa-mot')).toBe(false)
    expect(chu.every((e) => parseFloat(e.style.fontSize) < 19)).toBe(true)
  })
})

describe('nối vào màn', () => {
  const doc = (p: string) => fs.readFileSync(path.join(__dirname, '..', p), 'utf8')
  it('LamCau (làm + xem lại) và TheCau (thi / kiểm tra) đều căn phương án; CSS đo + 1 cột có sẵn', () => {
    const lc = doc('src/components/hoc-tap/LamCau.tsx'), tc = doc('src/components/TheCau.tsx')
    expect(lc.match(/useVuaPhuongAn/g)!.length).toBeGreaterThanOrEqual(3)
    expect(tc).toMatch(/useVuaPhuongAn/)
    const css = doc('src/index.css')
    expect(css).toMatch(/\[data-pa-do\] :is\(\.ht2-lam-pa-chu, \.pa-noi-dung\) \{ overflow-wrap: normal !important; \}/)
    expect(css).toMatch(/\.duo-tra\[data-pa-mot\] \.ht2-lam-tn \{ grid-template-columns: minmax\(0, 1fr\) !important; \}/)
  })
})
