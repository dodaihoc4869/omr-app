// @vitest-environment node
// NÚT "DỊU MẮT" của màn làm bài trong CHROMIUM THẬT (thầy 28/09: "vào màn làm bài không thấy nút dịu mắt ở chế độ toàn màn hình").
// Nguyên nhân: nền dịu mắt chỉ có trong bản vẽ LamBai-Ngang.html, app chưa từng có. Nay nút ở thanh trên (dọc) và cạnh A−/A+ (ngang).
// Đo ở dọc 360/390, ngang điện thoại 844×390, máy tính bảng 1024×768, máy tính 1440×900 — sáng + tối:
//   · nút thấy, trong khung nhìn, không chồng đồng hồ / nút Nộp / A−A+ / nút danh sách câu, chữ không tràn;
//   · bấm ⇒ data-diu-mat="bat" trên khung màn, aria-pressed=true, nền ấm, chữ đề ≥ 7:1, ô đã chọn giữ nguyên màu (so nền sáng);
//   · tải lại ⇒ vẫn bật (localStorage).
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser, type Page } from 'playwright'
import { rolldown } from 'rolldown'
import fs from 'node:fs'
import path from 'node:path'
import { chonBoCuc } from '../src/lib/lam-bai-ngang'
import { docDiuMat, ghiDiuMat, KHOA_DIU_MAT } from '../src/lib/diu-mat'

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
    input: path.join(process.cwd(), 'tests/_trinh-duyet-lbn/entry-diu-mat.tsx'),
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

async function mo(w: number, h: number, mau: 'light' | 'dark'): Promise<Page> {
  const ctx = await browser!.newContext({ viewport: { width: w, height: h }, colorScheme: mau })
  const page = await ctx.newPage()
  const boCuc = chonBoCuc(w, h, w > h)
  const html =
    `<!doctype html><html lang="vi"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0}*{box-sizing:border-box}button{font:inherit}${CSS}</style></head>` +
    `<body><div id="root"></div><script>window.__thu=${JSON.stringify({ boCuc })}</script></body></html>`
  await page.route('http://thu.local/**', (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: html }))
  await page.goto('http://thu.local/')
  await page.addScriptTag({ content: bundle })
  await page.waitForSelector('.nut-diu-mat')
  return page
}
const taiLai = async (p: Page) => {
  await p.reload()
  await p.addScriptTag({ content: bundle })
  await p.waitForSelector('.nut-diu-mat')
}

interface Do {
  thay: boolean
  trongKhung: boolean
  chong: string[]
  tran: string[]
  bat: string | null
  pressed: string | null
  nen: number[]
  tuongPhanDe: number
  mauChon: string
}
const doMan = (p: Page) =>
  p.evaluate((): Do => {
    const nut = document.querySelector<HTMLElement>('.nut-diu-mat')!
    const r = nut.getBoundingClientRect()
    const cs = getComputedStyle(nut)
    const thay = cs.visibility !== 'hidden' && cs.display !== 'none' && r.width >= 32 && r.height >= 32 && Number(cs.opacity) > 0.5
    const trongKhung = r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight
    const chong: string[] = []
    for (const sel of ['.thi-vien-thuoc', '.thi-nut-luoi', '.thi-tren-chu', '.thi-luu', '.lb-gio', '.lb-nop', '.lb-co-chu', '.lb-ten-ca']) {
      const el = document.querySelector(sel)
      if (!el) continue
      const o = el.getBoundingClientRect()
      if (!(r.right <= o.left + 0.5 || o.right <= r.left + 0.5 || r.bottom <= o.top + 0.5 || o.bottom <= r.top + 0.5)) chong.push(sel)
    }
    const tran: string[] = []
    for (const el of [nut, ...Array.from(nut.querySelectorAll<HTMLElement>('*'))]) if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth) tran.push(el.className.toString())
    if (document.documentElement.scrollWidth > innerWidth + 1) tran.push('trang-tran-ngang')
    // chữ thanh trên / đầu cột đề: một dòng, không tràn
    for (const el of Array.from(document.querySelectorAll<HTMLElement>('.thi-tren-ten, .thi-tren-da-lam, .lb-ten-ca b, .nut-diu-mat-chu, .lb-co-so'))) {
      const s = getComputedStyle(el)
      const lh = parseFloat(s.lineHeight) || parseFloat(s.fontSize) * 1.3
      if (el.getBoundingClientRect().height > lh * 1.6) tran.push(`gay-dong ${el.className} "${el.textContent}"`)
      if (el.scrollWidth > el.clientWidth + 1 && s.textOverflow !== 'ellipsis') tran.push(`tran ${el.className}`)
    }
    const kenh = (s: string) => (s.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number)
    const sang = ([a, b, c]: number[]) => {
      const f = (x: number) => ((x /= 255) <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)
      return 0.2126 * f(a) + 0.7152 * f(b) + 0.0722 * f(c)
    }
    const khung = document.querySelector<HTMLElement>('.man-lam-bai')!
    const chuDe = document.querySelector<HTMLElement>('.chu-de')!
    const the = chuDe.closest<HTMLElement>('.the-cau-thu')!
    const l1 = sang(kenh(getComputedStyle(chuDe).color))
    const l2 = sang(kenh(getComputedStyle(the).backgroundColor))
    return {
      thay,
      trongKhung,
      chong,
      tran,
      bat: khung.getAttribute('data-diu-mat'),
      pressed: nut.getAttribute('aria-pressed'),
      nen: kenh(getComputedStyle(khung).backgroundColor),
      tuongPhanDe: (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05),
      mauChon: getComputedStyle(document.querySelector('.o-chon')!).backgroundColor,
    }
  })

const CO: [number, number, string][] = [
  [360, 780, 'doc'],
  [390, 844, 'doc'],
  [844, 390, 'ngang-gon'],
  [1024, 768, 'ngang'],
  [1440, 900, 'ngang'],
]

describe('lưu lựa chọn dịu mắt', () => {
  it('đọc/ghi localStorage, kho hỏng thì mặc định tắt', () => {
    const m = new Map<string, string>()
    const kho = { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v) }
    expect(docDiuMat(kho)).toBe(false)
    ghiDiuMat(true, kho)
    expect(m.get(KHOA_DIU_MAT)).toBe('1')
    expect(docDiuMat(kho)).toBe(true)
    ghiDiuMat(false, kho)
    expect(docDiuMat(kho)).toBe(false)
    const hong = { getItem: () => { throw new Error('chặn') }, setItem: () => { throw new Error('chặn') } }
    expect(docDiuMat(hong)).toBe(false)
    expect(() => ghiDiuMat(true, hong)).not.toThrow()
  })
})

describe('Chromium thật — nút "Dịu mắt" luôn thấy ở cả ba bố cục', () => {
  it('có Chromium để đo (không có thì ghi rõ là BỎ QUA)', () => {
    if (!browser) console.warn('[nut-diu-mat] KHÔNG có Chromium — các phép đo dưới bị bỏ qua')
  })
  for (const [w, h, bc] of CO) {
    it(`${w}×${h} (${bc}): thấy nút, không chồng/tràn; bấm ⇒ dịu mắt áp lên màn, chữ đề ≥ 7:1, ô đã chọn giữ màu; tải lại vẫn nhớ`, async () => {
      if (!browser) return
      expect(chonBoCuc(w, h, w > h)).toBe(bc)
      let mauChonSang = ''
      for (const mau of ['light', 'dark'] as const) {
        const p = await mo(w, h, mau)
        const nhan = `${w}×${h} ${mau}`
        const tat = await doMan(p)
        expect(tat.thay, nhan).toBe(true)
        expect(tat.trongKhung, nhan).toBe(true)
        expect(tat.chong, nhan).toEqual([])
        expect(tat.tran, nhan).toEqual([])
        expect(tat.bat, nhan).toBeNull()
        expect(tat.pressed, nhan).toBe('false')
        if (mau === 'light') mauChonSang = tat.mauChon
        const chup = async (ten: string) => {
          if (process.env.CHUP_DIR && mau === 'light') await p.screenshot({ path: path.join(process.env.CHUP_DIR, `diu-${w}x${h}-${ten}.jpg`), type: 'jpeg', quality: 62 })
        }
        await chup('tat')

        await p.click('.nut-diu-mat')
        const bat = await doMan(p)
        expect(bat.bat, nhan).toBe('bat')
        expect(bat.pressed, nhan).toBe('true')
        const [r, , b] = bat.nen
        expect(r, `${nhan} nền ấm`).toBeGreaterThan(b + 10)
        expect(bat.tuongPhanDe, nhan).toBeGreaterThanOrEqual(7)
        expect(bat.mauChon, `${nhan} ô đã chọn giữ màu nền sáng`).toBe(mauChonSang)
        expect(bat.thay && bat.trongKhung, nhan).toBe(true)
        expect(bat.chong, nhan).toEqual([])
        expect(bat.tran, nhan).toEqual([])
        await chup('bat')

        await taiLai(p)
        const sau = await doMan(p)
        expect(sau.bat, `${nhan} sau tải lại`).toBe('bat')
        expect(sau.pressed, nhan).toBe('true')
        await p.click('.nut-diu-mat')
        expect((await doMan(p)).bat, nhan).toBeNull()
        expect(await p.evaluate((k) => localStorage.getItem(k), KHOA_DIU_MAT)).toBe('0')
        await p.context().close()
      }
    }, 120000)
  }
})
