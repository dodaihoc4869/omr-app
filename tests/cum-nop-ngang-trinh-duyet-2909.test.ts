// @vitest-environment node
// CỤM ĐỒNG HỒ + NÚT NỘP của bố cục làm bài NGANG trong CHROMIUM THẬT (thầy gửi ảnh 29/09: nút "Nộp bài" đè đồng hồ ở cột phiếu hẹp,
// "Hết giờ lúc 11:08" gãy từng chữ, chữ trên nút tối). Đo bằng getBoundingClientRect ở 5 cỡ màn × 3 tỉ lệ kéo (35/55/75 %) × sáng/tối:
//   · đồng hồ và nút Nộp KHÔNG giao nhau; · không phần tử chữ nào trong cụm tràn khung, "Hết giờ lúc" một dòng;
//   · chữ nút Nộp tương phản ≥ 4,5:1 với nền nút; · đồng hồ đổi màu đúng mốc 10 / 5 phút.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { rolldown } from 'rolldown'
import fs from 'node:fs'
import path from 'node:path'
import { chonBoCuc, KHOA_TI_LE } from '../src/lib/lam-bai-ngang'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8').replace(/@import[^;]*;/g, '')
const CSS = [
  doc('src/styles/tokens.css'),
  doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme[\s\S]*$/, ''),
  doc('src/screens/lam-bai-ngang.css'),
].join('\n')

let browser: Browser | null = null
let bundle = ''
beforeAll(async () => {
  const b = await rolldown({
    input: path.join(process.cwd(), 'tests/_trinh-duyet-lbn/entry.tsx'),
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
  // Bản Chromium đi kèm playwright có thể chưa tải; máy đã có Chromium khác trong PLAYWRIGHT_BROWSERS_PATH thì dùng nó.
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

async function mo(w: number, h: number, ti: number, mau: 'light' | 'dark', con = 38 * 60 + 12): Promise<Page> {
  const ctx = await browser!.newContext({ viewport: { width: w, height: h }, colorScheme: mau })
  const page = await ctx.newPage()
  const boCuc = chonBoCuc(w, h, true)
  // Trang có gốc thật (không phải about:blank) để localStorage — nơi thanh kéo nhớ tỉ lệ — dùng được.
  const html =
    `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}${CSS}</style></head>` +
    `<body><div class="m3"><div id="root"></div></div></body></html>`
  await page.route('http://thu.local/**', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }))
  await page.goto('http://thu.local/')
  await page.evaluate(([k, v, b, c]) => {
    localStorage.setItem(k as string, String(v))
    ;(window as unknown as { __thu: unknown }).__thu = { boCuc: b, con: c }
  }, [KHOA_TI_LE, ti, boCuc, con] as const)
  await page.addScriptTag({ content: bundle })
  await page.waitForSelector('.lb-nop')
  return page
}

interface Do {
  chong: boolean
  tran: string[]
  gay: string[]
  tuongPhan: number
  caoNut: number
}
const doCum = (p: Page) =>
  p.evaluate((): Do => {
    const gio = document.querySelector('.lb-gio')!.getBoundingClientRect()
    const nut = document.querySelector('.lb-nop')!.getBoundingClientRect()
    const chong = !(gio.right <= nut.left || nut.right <= gio.left || gio.bottom <= nut.top || nut.bottom <= gio.top)
    const khung = document.querySelector('.lb-dk')!.getBoundingClientRect()
    const tran: string[] = []
    const gay: string[] = []
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('.lb-dk *'))) {
      if (!el.offsetParent || !el.clientWidth) continue
      const r = el.getBoundingClientRect()
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow === 'visible') tran.push(`${el.className} "${el.textContent?.trim().slice(0, 24)}"`)
      if (r.right > khung.right + 1 || r.left < khung.left - 1) tran.push(`ra-ngoai ${el.className}`)
      // chữ một dòng: cao không quá 1,6 lần line-height
      if (/lb-gio-(nhan|phu|so)/.test(el.className)) {
        const lh = parseFloat(getComputedStyle(el).lineHeight) || parseFloat(getComputedStyle(el).fontSize) * 1.3
        if (r.height > lh * 1.6) gay.push(`${el.className} "${el.textContent?.trim()}"`)
      }
    }
    const kenh = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
    const sang = ([r, g, b]: number[]) => {
      const f = (c: number) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
    }
    const cs = getComputedStyle(document.querySelector('.lb-nop')!)
    const a = sang(kenh(cs.color))
    const b = sang(kenh(cs.backgroundColor))
    const tuongPhan = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    return { chong, tran, gay, tuongPhan, caoNut: Math.round(nut.height) }
  })

const CO: [number, number][] = [
  [844, 390],
  [1024, 768],
  [1180, 820],
  [1366, 768],
  [1440, 900],
]

describe('Chromium thật — cụm đồng hồ + nút Nộp không bao giờ chồng nhau', () => {
  it('có Chromium để đo (máy không có trình duyệt nào thì ghi rõ là BỎ QUA, không coi là đạt)', () => {
    if (!browser) console.warn('[cum-nop-ngang] KHÔNG có Chromium — các phép đo dưới bị bỏ qua')
  })
  for (const [w, h] of CO) {
    it(`${w}×${h}: tỉ lệ đề 35/55/75 %, sáng + tối — không chồng, không tràn, "Hết giờ lúc" một dòng, chữ nút ≥ 4,5:1, nút ≤ 84 px cao`, async () => {
      if (!browser) return
      for (const ti of [0.35, 0.55, 0.75]) {
        for (const mau of ['light', 'dark'] as const) {
          const p = await mo(w, h, ti, mau)
          const d = await doCum(p)
          const nhan = `${w}×${h} ${ti} ${mau}`
          expect(d.chong, nhan).toBe(false)
          expect(d.tran, nhan).toEqual([])
          expect(d.gay, nhan).toEqual([])
          expect(d.tuongPhan, nhan).toBeGreaterThanOrEqual(4.5)
          expect(d.caoNut, nhan).toBeLessThanOrEqual(84)
          await p.context().close()
        }
      }
    }, 120000)
  }

  it('cột phiếu hẹp (1366×768, đề 75 %): xếp dọc — nút Nộp NẰM DƯỚI đồng hồ, gần cả bề ngang, cao 48–56 px', async () => {
    if (!browser) return
    const p = await mo(1366, 768, 0.75, 'light')
    const r = await p.evaluate(() => {
      const g = document.querySelector('.lb-gio')!.getBoundingClientRect()
      const n = document.querySelector('.lb-nop')!.getBoundingClientRect()
      const k = document.querySelector('.lb-dk')!.getBoundingClientRect()
      return { duoi: n.top >= g.bottom, rong: n.width / k.width, cao: n.height, phu: document.querySelector('.lb-gio-phu')?.textContent }
    })
    // Ảnh bằng chứng khi cần (CHUP_DIR=<thư mục> CHUP_TEN=truoc|sau): 1366×768 kéo 75 % và 844×390.
    if (process.env.CHUP_DIR) {
      await p.screenshot({ path: path.join(process.env.CHUP_DIR, `fix-${process.env.CHUP_TEN ?? 'sau'}-app-1366-75.jpg`), type: 'jpeg', quality: 70 })
      const p2 = await mo(844, 390, 0.58, 'light')
      await p2.screenshot({ path: path.join(process.env.CHUP_DIR, `fix-${process.env.CHUP_TEN ?? 'sau'}-app-844.jpg`), type: 'jpeg', quality: 70 })
      await p2.context().close()
    }
    expect(r.duoi).toBe(true)
    expect(r.rong).toBeGreaterThan(0.85)
    expect(r.cao).toBeGreaterThanOrEqual(48)
    expect(r.cao).toBeLessThanOrEqual(56)
    expect(r.phu).toBe('Hết giờ lúc 11:08')
    await p.context().close()
  }, 60000)

  it('đồng hồ đổi màu: bình thường → vàng ≤ 10 phút → đỏ ≤ 5 phút (vẫn không chồng nút)', async () => {
    if (!browser) return
    for (const [con, muc] of [[1200, null], [570, 'vang'], [290, 'do']] as const) {
      const p = await mo(1366, 768, 0.75, 'light', con)
      expect(await p.locator('.lb-gio').getAttribute('data-muc')).toBe(muc)
      expect((await doCum(p)).chong).toBe(false)
      await p.context().close()
    }
  }, 60000)
})
