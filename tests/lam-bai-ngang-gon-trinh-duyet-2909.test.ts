// @vitest-environment node
// ĐIỆN THOẠI XOAY NGANG trong CHROMIUM THẬT (thầy 29/09: bỏ phiếu điền ô, câu dài tự chia 2 màn — đề | đáp án — em tự kéo chỉnh;
// đồng hồ / cỡ chữ / dịu mắt nhỏ, tinh tế). Đo bằng getBoundingClientRect ở 844×390 và 740×360:
//   · thanh trên ≤ 32 px, mọi nút trong khung nhìn, vùng chạm ≥ 40 px (kể cả phần ::after vô hình), trang không cuộn ngang;
//   · câu ngắn một cột; câu dài chia đôi, hai cột cạnh nhau, cột đề cuộn riêng còn cột đáp án đứng yên (dính);
//   · kéo thanh chia bằng con trỏ tới 35 % / 65 % ⇒ cột đề đúng tỉ lệ, nhớ sau khi tải lại; ngoài 30–70 % bị kẹp;
//   · bàn phím ảo (khung nhìn thấp lại) ⇒ ô đáp số Phần III nằm trọn trong vùng nhìn thấy;
//   · ≤ 5 phút: đồng hồ đỏ + chữ "Sắp hết giờ", vẫn không che nút Nộp;
//   · 1280×800 (máy tính) vẫn là bố cục cũ có phiếu đáp án.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { rolldown } from 'rolldown'
import fs from 'node:fs'
import path from 'node:path'
import { KHOA_CHIA } from '../src/lib/lam-bai-ngang'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8').replace(/@import[^;]*;/g, '')
const CSS = [
  doc('src/styles/tokens.css'),
  doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme[\s\S]*$/, ''),
  doc('src/components/m3/m3.css'),
  doc('src/screens/man-thi-m3.css'),
  doc('src/screens/lam-bai-ngang.css'),
  doc('src/screens/diu-mat.css'),
].join('\n')

let browser: Browser | null = null
let bundle = ''
beforeAll(async () => {
  const b = await rolldown({
    input: path.join(process.cwd(), 'tests/_trinh-duyet-lbn/entry-gon.tsx'),
    platform: 'browser',
    plugins: [
      {
        name: 'css-rong',
        resolveId(id) {
          if (id.endsWith('.css')) return { id: '\0css-rong', external: false }
        },
        load(id) {
          if (id === '\0css-rong') return { code: 'export default ""', moduleType: 'js' }
        },
      },
    ],
    transform: { define: { 'process.env.NODE_ENV': '"production"' }, jsx: { runtime: 'automatic' } },
  })
  bundle = (await b.generate({ format: 'iife' })).output[0].code
  const goc = process.env.PLAYWRIGHT_BROWSERS_PATH || ''
  const du = goc && fs.existsSync(goc) ? fs.readdirSync(goc).filter((d) => /^chromium-\d+$/.test(d)).map((d) => path.join(goc, d, 'chrome-linux', 'chrome')).filter((f) => fs.existsSync(f)) : []
  for (const executablePath of [undefined, ...du]) {
    try {
      browser = await chromium.launch({ headless: true, executablePath })
      break
    } catch {
      browser = null
    }
  }
}, 90000)
afterAll(async () => {
  await browser?.close()
})

async function mo(w: number, h: number, cau = 1, con = 38 * 60 + 12, chia?: number): Promise<Page> {
  const ctx = await browser!.newContext({ viewport: { width: w, height: h } })
  const page = await ctx.newPage()
  const html =
    `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}*{box-sizing:border-box}button{font:inherit}${CSS}</style></head>` +
    `<body><div id="root"></div></body></html>`
  await page.route('http://thu.local/**', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }))
  await page.goto('http://thu.local/')
  await page.evaluate(([k, v, c, n]) => {
    if (v !== null) localStorage.setItem(k as string, String(v))
    ;(window as unknown as { __thu: unknown }).__thu = { con: n, cau: c }
  }, [KHOA_CHIA, chia ?? null, cau, con] as const)
  await page.addScriptTag({ content: bundle })
  await page.waitForSelector('#cau-1', { state: 'attached' })
  await page.waitForTimeout(150)
  return page
}
const dongLai = (p: Page) => p.context().close()

interface DoThanh {
  caoThanh: number
  ngoai: string[]
  chamNho: string[]
  tranNgang: number
  chong: string[]
}
const doThanh = (p: Page) =>
  p.evaluate((): DoThanh => {
    const thanh = document.querySelector('.lb-gon-thanh')!.getBoundingClientRect()
    const nut = Array.from(document.querySelectorAll<HTMLElement>('.lb-gon-thanh button'))
    const ngoai: string[] = []
    const chamNho: string[] = []
    for (const b of nut) {
      const r = b.getBoundingClientRect()
      const ten = b.getAttribute('aria-label') || b.textContent || b.className
      if (r.left < 0 || r.right > innerWidth || r.top < 0 || r.bottom > thanh.bottom + 0.5) ngoai.push(ten)
      if (r.width < 40) chamNho.push(`${ten} rộng ${r.width}`)
      // vùng chạm DỌC ≥ 40 px: điểm cách tâm 19 px xuống dưới (vùng ::after vô hình) vẫn trúng chính nút này
      const trung = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2 + 19)
      if (!trung || !(trung === b || b.contains(trung))) chamNho.push(`${ten} cao ${r.height}`)
    }
    const chong: string[] = []
    for (let i = 0; i < nut.length; i++)
      for (let j = i + 1; j < nut.length; j++) {
        const a = nut[i].getBoundingClientRect()
        const c = nut[j].getBoundingClientRect()
        if (!(a.right <= c.left + 0.5 || c.right <= a.left + 0.5)) chong.push(`${nut[i].className}|${nut[j].className}`)
      }
    return { caoThanh: thanh.height, ngoai, chamNho, tranNgang: document.documentElement.scrollWidth - innerWidth, chong }
  })

const doCot = (p: Page) =>
  p.evaluate(() => {
    const de = document.querySelector('.lb-gon-de')!
    const pa = document.querySelector<HTMLElement>('[data-lb-pa]')
    const tc = pa?.parentElement
    const cauDe = tc?.querySelector<HTMLElement>('.cau-de')
    const r = (e?: Element | null) => (e ? e.getBoundingClientRect() : null)
    const cs = tc ? getComputedStyle(tc) : null
    const rong = tc ? tc.getBoundingClientRect().width - parseFloat(cs!.paddingLeft) - parseFloat(cs!.paddingRight) - parseFloat(cs!.columnGap) : 0
    return {
      chia: de.hasAttribute('data-chia'),
      thanh: document.querySelector('[role="separator"]')?.getAttribute('aria-valuenow') ?? null,
      de: r(cauDe),
      pa: r(pa),
      tiLeDe: cauDe && rong ? cauDe.getBoundingClientRect().width / rong : 0,
      cuonDe: tc ? tc.scrollHeight - tc.clientHeight : 0,
    }
  })

async function keo(p: Page, muc: number) {
  const k = (await p.locator('.lb-gon-keo').boundingBox())!
  const tc = await p.evaluate(() => {
    const t = document.querySelector('[data-lb-pa]')!.parentElement!
    const r = t.getBoundingClientRect()
    const cs = getComputedStyle(t)
    return { l: r.left + parseFloat(cs.paddingLeft), w: r.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), g: parseFloat(cs.columnGap) }
  })
  const x0 = k.x + k.width / 2
  const y0 = k.y + k.height / 2
  const x1 = tc.l + tc.g / 2 + muc * (tc.w - tc.g)
  await p.mouse.move(x0, y0)
  await p.mouse.down()
  for (let i = 1; i <= 6; i++) await p.mouse.move(x0 + ((x1 - x0) * i) / 6, y0)
  await p.mouse.up()
  await p.waitForTimeout(80)
}

describe('Chromium thật — điện thoại xoay ngang', () => {
  it('có Chromium để đo (không có thì ghi rõ là BỎ QUA)', () => {
    if (!browser) console.warn('[lam-bai-ngang-gon] KHÔNG có Chromium — các phép đo dưới bị bỏ qua')
  })
  for (const [w, h] of [
    [844, 390],
    [740, 360],
  ] as const) {
    it(`${w}×${h}: thanh trên ≤ 32 px, nút trong khung, chạm ≥ 40 px, không chồng, không cuộn ngang; không còn phiếu đáp án`, async () => {
      if (!browser) return
      const p = await mo(w, h)
      const d = await doThanh(p)
      expect(d.caoThanh).toBeLessThanOrEqual(32)
      expect(d.ngoai).toEqual([])
      expect(d.chamNho).toEqual([])
      expect(d.chong).toEqual([])
      expect(d.tranNgang).toBeLessThanOrEqual(0)
      expect(await p.locator('.lb-phieu, .lb-bong, .lb-hang').count()).toBe(0)
      expect(await p.locator('.lb-gon-de > [data-gon-hien]').count()).toBe(1)
      await dongLai(p)
    }, 60000)

    it(`${w}×${h}: câu dài chia đôi (đề trái, đáp án phải, cột đề cuộn riêng, cột đáp án đứng yên); kéo 35 % / 65 %; nhớ sau tải lại`, async () => {
      if (!browser) return
      const p = await mo(w, h, 2)
      const a = await doCot(p)
      expect(a.chia).toBe(true)
      expect(a.thanh).toBe('55')
      expect(a.de!.right).toBeLessThanOrEqual(a.pa!.left)
      expect(a.pa!.right).toBeLessThanOrEqual(w)
      expect(a.cuonDe).toBeGreaterThan(0)
      // cuộn cột đề: phương án đứng yên
      const truoc = a.pa!.top
      await p.evaluate(() => {
        document.querySelector('[data-lb-pa]')!.parentElement!.scrollTop = 150
      })
      const sau = await doCot(p)
      expect(sau.de!.top).toBeLessThan(a.de!.top - 100)
      expect(Math.abs(sau.pa!.top - truoc)).toBeLessThanOrEqual(1)
      for (const muc of [0.35, 0.65]) {
        await keo(p, muc)
        const d = await doCot(p)
        expect(d.thanh).toBe(String(Math.round(muc * 100)))
        expect(Math.abs(d.tiLeDe - muc)).toBeLessThan(0.03)
        expect(d.de!.right).toBeLessThanOrEqual(d.pa!.left)
        if (process.env.CHUP_DIR) await p.screenshot({ path: path.join(process.env.CHUP_DIR, `gon-${w}-keo-${Math.round(muc * 100)}.jpg`), type: 'jpeg', quality: 60 })
      }
      await keo(p, 0.05)
      expect((await doCot(p)).thanh).toBe('30')
      await keo(p, 0.62)
      expect(await p.evaluate((k) => localStorage.getItem(k), KHOA_CHIA)).toBe('0.62')
      await p.reload()
      await p.evaluate(() => ((window as unknown as { __thu: unknown }).__thu = { con: 2292, cau: 2 }))
      await p.addScriptTag({ content: bundle })
      await p.waitForSelector('[role="separator"]')
      expect((await doCot(p)).thanh).toBe('62')
      await dongLai(p)
    }, 60000)

    it(`${w}×${h}: câu ngắn một cột; chọn đáp án trên thẻ vẫn ghi; Phần II dài cũng chia`, async () => {
      if (!browser) return
      const p = await mo(w, h, 1)
      const a = await doCot(p)
      if (h >= 390) expect(a.chia).toBe(false)
      await p.click('.pa-hang >> nth=2')
      expect(await p.locator('.lb-gon-tien').textContent()).toContain('1/4')
      await p.click('.lb-gon-di button[aria-label="Câu sau"]')
      await p.click('.lb-gon-di button[aria-label="Câu sau"]')
      const b = await doCot(p)
      expect(b.chia).toBe(true)
      expect(b.de!.right).toBeLessThanOrEqual(b.pa!.left)
      await dongLai(p)
    }, 60000)

    it(`${w}×${h}: Phần III — bàn phím ảo mở (khung thấp lại) ⇒ ô đáp số nằm trọn trong vùng nhìn thấy`, async () => {
      if (!browser) return
      const p = await mo(w, h, 4)
      await p.locator('.osl input').focus()
      await p.setViewportSize({ width: w, height: Math.round(h * 0.45) })
      await p.waitForTimeout(500)
      const r = await p.evaluate(() => {
        const i = document.querySelector('.osl input')!.getBoundingClientRect()
        return { top: i.top, bottom: i.bottom, cao: innerHeight, dangGo: document.activeElement?.tagName }
      })
      expect(r.dangGo).toBe('INPUT')
      expect(r.top).toBeGreaterThanOrEqual(32)
      expect(r.bottom).toBeLessThanOrEqual(r.cao)
      await dongLai(p)
    }, 60000)
  }

  it('≤ 5 phút: đồng hồ đỏ + chữ "Sắp hết giờ", một dòng, không chồng nút Nộp; ≤ 10 phút vàng', async () => {
    if (!browser) return
    for (const [con, muc, chu] of [
      [240, 'do', 'Sắp hết giờ'],
      [500, 'vang', 'Dưới 10 phút'],
    ] as const) {
      const p = await mo(740, 360, 1, con)
      const r = await p.evaluate(() => {
        const g = document.querySelector('.lb-gio')!
        const a = g.getBoundingClientRect()
        const n = document.querySelector('.lb-nop')!.getBoundingClientRect()
        return { muc: g.getAttribute('data-muc'), chu: g.textContent, cao: a.height, chong: !(a.right <= n.left || n.right <= a.left) }
      })
      expect(r.muc).toBe(muc)
      expect(r.chu).toContain(chu)
      expect(r.cao).toBeLessThanOrEqual(26)
      expect(r.chong).toBe(false)
      expect((await doThanh(p)).tranNgang).toBeLessThanOrEqual(0)
      await dongLai(p)
    }
  }, 60000)

  it('1280×800 (máy tính xoay ngang) vẫn là bố cục cũ có phiếu đáp án', async () => {
    if (!browser) return
    const p = await mo(1280, 800)
    expect(await p.locator('.lb-gon').count()).toBe(0)
    expect(await p.locator('.lb-khung[data-bo-cuc="ngang"] .lb-phieu').count()).toBe(1)
    await dongLai(p)
  }, 60000)
})
