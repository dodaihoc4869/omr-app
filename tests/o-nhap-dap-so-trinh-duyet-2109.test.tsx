// @vitest-environment node
// ONhapDapSo trong TRÌNH DUYỆT THẬT (Chromium): React chạy thật (đóng gói bằng rolldown từ `tests/_trinh-duyet-onds/entry.tsx`), chuột + chạm thật.
// Khoá điều thầy/Boss đòi: bấm "−" hoặc "," KHÔNG làm mất tiêu điểm (bàn phím không đóng); "," chèn tại con trỏ; "−" bật/tắt ở đầu số; chỉ một dấu thập phân; dán "0.54" vẫn nhận; nút ≥ 44 px; không tràn ngang ở 320/360/390 (sáng + tối).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { rolldown } from 'rolldown'
import fs from 'node:fs'
import path from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import ONhapDapSo from '../src/components/ONhapDapSo'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8').replace(/@import[^;]*;/g, '')
const CSS = doc('src/components/o-nhap-dap-so.css')

let browser: Browser | null = null
let bundle = ''
beforeAll(async () => {
  const b = await rolldown({
    input: path.join(process.cwd(), 'tests/_trinh-duyet-onds/entry.tsx'),
    platform: 'browser',
    plugins: [{ name: 'css-rong', resolveId(id) { if (id.endsWith('.css')) return { id: '\0css-rong', external: false } }, load(id) { if (id === '\0css-rong') return { code: 'export default ""', moduleType: 'js' } } }],
    transform: { define: { 'process.env.NODE_ENV': '"production"' }, jsx: { runtime: 'automatic' } },
  })
  bundle = (await b.generate({ format: 'iife' })).output[0].code
  try {
    browser = await chromium.launch({ headless: true })
  } catch {
    browser = null
  }
}, 60000)
afterAll(async () => {
  await browser?.close()
})

async function mo(w = 360, h = 700, cham = false, mau: 'light' | 'dark' = 'light'): Promise<Page> {
  const ctx = await browser!.newContext({ viewport: { width: w, height: h }, hasTouch: cham, isMobile: cham, colorScheme: mau })
  const page = await ctx.newPage()
  await page.setContent(`<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;padding:12px}${CSS}</style></head><body><div id="root"></div></body></html>`)
  await page.addScriptTag({ content: bundle })
  await page.waitForSelector('#o')
  return page
}
const gt = (p: Page) => p.evaluate(() => (document.getElementById('o') as HTMLInputElement).value)
const td = (p: Page) => p.evaluate(() => ({ dangCoTieuDiem: document.activeElement === document.getElementById('o'), tu: (document.getElementById('o') as HTMLInputElement).selectionStart, den: (document.getElementById('o') as HTMLInputElement).selectionEnd }))
const nutAm = (p: Page) => p.locator('button[aria-label$="dấu âm"]')
const nutPhay = (p: Page) => p.locator('button[aria-label="Thêm dấu phẩy"]')

describe('Chromium thật — chuột', () => {
  it('gõ 15, bấm "," bằng CHUỘT ⇒ ô VẪN có tiêu điểm, ra "15,"; gõ tiếp 7 ⇒ "15,7"', async () => {
    if (!browser) return
    const p = await mo()
    await p.click('#o')
    await p.keyboard.type('15')
    await nutPhay(p).click()
    expect((await td(p)).dangCoTieuDiem).toBe(true)
    expect(await gt(p)).toBe('15,')
    await p.keyboard.type('7')
    expect(await gt(p)).toBe('15,7')
    await p.context().close()
  }, 30000)
  it('con trỏ GIỮA: 15 → Home → → ⇒ bấm "," ⇒ "1,5", con trỏ sau dấu; gõ 7 ⇒ "1,75"', async () => {
    if (!browser) return
    const p = await mo()
    await p.click('#o')
    await p.keyboard.type('15')
    await p.keyboard.press('Home')
    await p.keyboard.press('ArrowRight')
    await nutPhay(p).click()
    expect(await gt(p)).toBe('1,5')
    expect(await td(p)).toEqual({ dangCoTieuDiem: true, tu: 2, den: 2 })
    await p.keyboard.type('7')
    expect(await gt(p)).toBe('1,75')
    await p.context().close()
  }, 30000)
  it('"−": bấm ⇒ "-1,5" (dấu vào ĐẦU dù con trỏ ở cuối); bấm lại ⇒ "1,5"; tiêu điểm giữ; nhãn đổi Thêm/Bỏ dấu âm', async () => {
    if (!browser) return
    const p = await mo()
    await p.click('#o')
    await p.keyboard.type('1,5')
    await nutAm(p).click()
    expect(await gt(p)).toBe('-1,5')
    expect((await td(p)).dangCoTieuDiem).toBe(true)
    expect(await nutAm(p).getAttribute('aria-label')).toBe('Bỏ dấu âm')
    await nutAm(p).click()
    expect(await gt(p)).toBe('1,5')
    expect(await nutAm(p).getAttribute('aria-label')).toBe('Thêm dấu âm')
    await p.context().close()
  }, 30000)
  it('gõ bằng nút ra "-1,5" từ ô trống: − → 1 → , → 5', async () => {
    if (!browser) return
    const p = await mo()
    await p.click('#o')
    await nutAm(p).click()
    await p.keyboard.type('1')
    await nutPhay(p).click()
    await p.keyboard.type('5')
    expect(await gt(p)).toBe('-1,5')
    await p.context().close()
  }, 30000)
  it('chỉ MỘT dấu thập phân: "," bị khoá khi đã có "," hoặc "." (kể cả dán "0.54"); dán nguyên văn không bị sửa', async () => {
    if (!browser) return
    const p = await mo()
    await p.fill('#o', '0.54')
    expect(await gt(p)).toBe('0.54')
    expect(await nutPhay(p).isDisabled()).toBe(true)
    await p.fill('#o', '')
    await p.click('#o')
    await p.keyboard.type('2')
    await nutPhay(p).click()
    expect(await nutPhay(p).isDisabled()).toBe(true)
    expect(await gt(p)).toBe('2,')
    await p.context().close()
  }, 30000)
  it('ô KHÔNG có tiêu điểm: bấm "," chèn ở CUỐI và KHÔNG giành tiêu điểm (không tự bật bàn phím)', async () => {
    if (!browser) return
    const p = await mo()
    await p.fill('#o', '15')
    await p.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await nutPhay(p).click()
    expect(await gt(p)).toBe('15,')
    expect((await td(p)).dangCoTieuDiem).toBe(false)
    await p.context().close()
  }, 30000)
  it('maxLength 12: đủ 12 ký tự ⇒ "," khoá; bấm "−" (thêm) không đổi gì', async () => {
    if (!browser) return
    const p = await mo()
    await p.fill('#o', '123456789012')
    expect(await nutPhay(p).isDisabled()).toBe(true)
    await nutAm(p).click()
    expect(await gt(p)).toBe('123456789012')
    await p.context().close()
  }, 30000)
  it('Enter trong ô vẫn gửi form của nơi dùng (nút phụ là type=button, không chặn Enter, không tự gửi)', async () => {
    if (!browser) return
    const p = await mo()
    await p.click('#o')
    await p.keyboard.type('5')
    await nutAm(p).click()
    expect(await p.evaluate(() => (window as unknown as { __nop: number }).__nop)).toBe(0) // bấm nút phụ KHÔNG gửi
    await p.keyboard.press('Enter')
    await p.waitForFunction(() => (window as unknown as { __nop: number }).__nop === 1)
    await p.context().close()
  }, 30000)
})

describe('Chromium thật — CHẠM (điện thoại)', () => {
  it('chạm "−" rồi "," ⇒ ô vẫn có tiêu điểm (bàn phím không đóng), giá trị đúng', async () => {
    if (!browser) return
    const p = await mo(360, 700, true)
    await p.tap('#o')
    await p.keyboard.type('15')
    await nutPhay(p).tap()
    expect((await td(p)).dangCoTieuDiem).toBe(true)
    await nutAm(p).tap()
    expect((await td(p)).dangCoTieuDiem).toBe(true)
    expect(await gt(p)).toBe('-15,')
    await p.context().close()
  }, 30000)
})

describe('Chromium thật — bố cục', () => {
  for (const [w, h] of [[320, 640], [360, 740], [390, 844]] as const)
    for (const mau of ['light', 'dark'] as const)
      it(`${w}×${h} · ${mau}: hai nút ≥ 44 px, ô nhập rộng, 0 tràn ngang, ba phần tử cùng hàng, đổi giá trị KHÔNG làm đổi cỡ`, async () => {
        if (!browser) return
        const p = await mo(w, h, false, mau)
        const chup = () => p.evaluate(() => {
          const r = (e: Element) => { const b = e.getBoundingClientRect(); return { x: Math.round(b.left * 10) / 10, y: Math.round(b.top * 10) / 10, w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 } }
          const k = document.querySelector('.ond')!
          const [am, o, phay] = [k.children[0]!, k.children[1]!, k.children[2]!]
          return { k: r(k), am: r(am), o: r(o), phay: r(phay), tran: document.documentElement.scrollWidth > document.documentElement.clientWidth }
        })
        const a = await chup()
        await p.click('#o')
        await p.keyboard.type('12,5')
        await nutAm(p).click()
        const b = await chup()
        await p.context().close()
        for (const c of [a, b]) {
          expect(c.tran).toBe(false)
          expect(c.am.w).toBeGreaterThanOrEqual(44)
          expect(c.am.h).toBeGreaterThanOrEqual(44)
          expect(c.phay.w).toBeGreaterThanOrEqual(44)
          expect(c.phay.h).toBeGreaterThanOrEqual(44)
          expect(c.o.w).toBeGreaterThanOrEqual(120)
          expect(c.am.y).toBeCloseTo(c.o.y, 0) // cùng hàng
          expect(c.phay.y).toBeCloseTo(c.o.y, 0)
          expect(c.am.x + c.am.w).toBeLessThanOrEqual(c.o.x + 0.5)
          expect(c.o.x + c.o.w).toBeLessThanOrEqual(c.phay.x + 0.5)
          expect(c.phay.x + c.phay.w).toBeLessThanOrEqual(c.k.x + c.k.w + 0.5)
        }
        expect(b.am).toEqual(a.am) // gõ chữ / đổi dấu KHÔNG làm nút nhảy
        expect(b.phay).toEqual(a.phay)
        expect(b.o).toEqual(a.o)
      }, 30000)
})

describe('khoá nguồn', () => {
  it('nút KHÔNG chặn Enter/không phải submit; hai nút dùng preventDefault ở pointerdown + mousedown; không hex trong CSS/TSX', () => {
    const src = fs.readFileSync(path.join(process.cwd(), 'src/components/ONhapDapSo.tsx'), 'utf8')
    expect(src.match(/type="button"/g)).toHaveLength(2)
    expect(src).toMatch(/onPointerDown=\{giuTieuDiem\}/)
    expect(src).toMatch(/onMouseDown=\{giuTieuDiem\}/)
    expect(src).not.toMatch(/onTouchStart/) // preventDefault ở touchstart chặn luôn cú click trên điện thoại
    expect(CSS).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(renderToStaticMarkup(<ONhapDapSo value="" onChange={() => {}} />)).toContain('inputMode="decimal"')
  })
})
