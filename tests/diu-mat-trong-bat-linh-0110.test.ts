// @vitest-environment node
// DỊU MẮT TRONG KHUNG BÁT LINH (thầy 01/10: "chế độ làm dịu mắt trong làm bài không hoạt động, bấm lên không thay đổi gì").
// Nguyên nhân: màn thi của em nằm trong BatLinhShell (body[data-bat-linh]); luật `:is(.bl-app, body[data-bat-linh]) :is(.m3, .bnv)` (0,2,1) đè
// biến --m3-* của diu-mat.css (0,2,0) ⇒ chỉ nút đổi màu. Test cũ (nut-diu-mat-trinh-duyet-2809) dựng màn NGOÀI khung Bát Linh nên không bắt được.
// Ở đây nạp CẢ bat-linh.css, đảo cả hai thứ tự nạp CSS, đo trong Chromium thật: bật ⇒ nền màn và nền thẻ đổi hẳn sang giấy ngà, chữ ≥ 7:1.
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromium, type Browser } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8').replace(/@import[^;]*;/g, '')
const CHUNG = [
  doc('src/styles/tokens.css'),
  doc('src/components/bang-nhiem-vu/m3-theme.css').replace(/@theme[\s\S]*$/, ''),
  doc('src/components/m3/m3.css'),
  doc('src/screens/man-thi-m3.css'),
]
const BL = doc('src/components/bat-linh/bat-linh.css')
const DM = doc('src/screens/diu-mat.css')

const HTML = (css: string, bat: boolean) => `<!doctype html><html><head><style>${css}</style></head>
<body data-bat-linh="hs"><div class="bl-app">
  <div id="trang" class="min-h-screen m3 man-lam-bai" ${bat ? 'data-diu-mat="bat"' : ''} style="background: var(--nen); color: var(--muc)">
    <div id="the" style="background: var(--m3-surface-container-lowest); color: var(--m3-on-surface); padding: 20px">Câu 9. Bảng dưới đây…</div>
    <span id="phu" style="color: var(--m3-on-surface-variant); background: var(--m3-surface-container-high)">Mỗi câu đúng 0,5 điểm</span>
  </div>
</div></body></html>`

const lum = (rgb: string) => {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? []).slice(0, 3).map((x) => Number(x) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const tuongPhan = (a: string, b: string) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }

let browser: Browser | null = null
beforeAll(async () => {
  const goc = process.env.PLAYWRIGHT_BROWSERS_PATH || ''
  const du = goc && fs.existsSync(goc) ? fs.readdirSync(goc).filter((d) => /^chromium-\d+$/.test(d)).map((d) => path.join(goc, d, 'chrome-linux', 'chrome')).filter((f) => fs.existsSync(f)) : []
  for (const executablePath of [undefined, ...du]) {
    try { browser = await chromium.launch({ headless: true, executablePath }); break } catch { browser = null }
  }
}, 60000)
afterAll(async () => { await browser?.close() })

async function do_(css: string, bat: boolean) {
  const p = await browser!.newPage()
  await p.setContent(HTML(css, bat))
  const kq = await p.evaluate(() => {
    const cs = (id: string) => getComputedStyle(document.getElementById(id)!)
    return { nen: cs('trang').backgroundColor, the: cs('the').backgroundColor, chu: cs('the').color, phu: cs('phu').color, phuNen: cs('phu').backgroundColor }
  })
  await p.close()
  return kq
}

describe('Dịu mắt trong khung Bát Linh', () => {
  for (const [ten, css] of [['Bát Linh nạp trước', [...CHUNG, BL, DM].join('\n')], ['Bát Linh nạp SAU (mảnh lười)', [...CHUNG, DM, BL].join('\n')]] as const) {
    it(`${ten}: bật ⇒ nền màn + nền thẻ đổi sang giấy ngà, chữ ≥ 7:1`, async () => {
      if (!browser) return
      const tat = await do_(css, false)
      const bat = await do_(css, true)
      expect(bat.nen).toBe('rgb(236, 224, 199)')
      expect(bat.the).toBe('rgb(246, 238, 220)')
      expect(bat.nen).not.toBe(tat.nen)
      expect(bat.the).not.toBe(tat.the)
      // khác biệt thấy được bằng mắt: độ sáng nền giảm ≥ 10 %
      expect(lum(tat.nen) - lum(bat.nen)).toBeGreaterThan(0.1)
      expect(tuongPhan(bat.chu, bat.the)).toBeGreaterThanOrEqual(7)
      expect(tuongPhan(bat.phu, bat.phuNen)).toBeGreaterThanOrEqual(7)
    })
  }
})
