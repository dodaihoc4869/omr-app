// Local fixture verification; all network requests stay on the preview origin.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
const origin = process.argv[2] ?? 'http://127.0.0.1:5173'
const out = process.argv[3] ?? '/workspace/bat-linh-preview'
mkdirSync(out, { recursive: true })
const base = `${origin}/scripts/preview-bat-linh/games.html?`
const cases = [
  ['tung-chuong', 'game=chuong', '.dh-chuong'],
  ['tung-chuong-trum', 'game=chuong&boss', '.dh-chuong'],
  ...['sanh', 'sanh-het', 'tran', 'trum', 'cot-loi', 'ket-qua', 'tiep-suc', 'thang', 'thua'].map(man => [`ho-tong-${man}`, `game=doan&man=${man}`, '.dh2']),
  ...['chon', 'dao', 'so-tay', 'tui'].map(man => [`than-thu-${man}`, `game=thu&man=${man}&thu=1&cap=50`, '.dao']),
  ...['thu-do', 'tu-do'].map(man => [man, `game=shop&man=${man}&pet=1&cap=50`, '.ps']),
]
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] })
const results = []
async function ready(p) {
  await p.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode().catch(() => {}))) })
  // SVG image resources are not in document.images.
  await p.waitForLoadState('networkidle')
}
try {
  for (const [width, height] of [[390, 844], [844, 390], [1440, 900]]) {
    for (const [name, query, selector] of cases) {
      const p = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' })
      const errors = []
      p.on('pageerror', e => errors.push(e.message))
      await p.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort())
      await p.goto(base + query)
      await p.waitForSelector(selector)
      const skip = p.getByRole('button', { name: 'Bỏ qua', exact: true })
      if (await skip.isVisible()) await skip.click()
      await ready(p)
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)
      const broken = await p.locator('img').evaluateAll(es => es.filter(i => i.complete && !i.naturalWidth).map(i => i.src))
      await p.locator(selector).first().screenshot({ path: `${out}/${name}-${width}.png` })
      results.push({ name, width, height, overflow, broken, errors })
      assert.equal(errors.length, 0, name)
      assert.equal(broken.length, 0, name)
      assert.ok(overflow <= 1, `${name}: overflow ${overflow}`)
      await p.close()
    }
  }
  const p = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' })
  await p.route('**/*', r => new URL(r.request().url()).origin === origin ? r.continue() : r.abort())
  await p.goto(base + 'game=dao&thu=1&cap=50')
  await p.getByRole('button', { name: /LÊN ĐƯỜNG/ }).click()
  await p.getByRole('button', { name: /B.*43,2 gam/ }).click()
  await p.getByRole('button', { name: 'CHỐT ĐÁP ÁN · TUNG CHIÊU', exact: true }).click()
  const giai = p.getByRole('button', { name: 'XEM LỜI GIẢI', exact: true })
  await giai.waitFor()
  await giai.click()
  await p.locator('.dao2-ai[data-pha="giai"]').waitFor()
  await ready(p)
  await p.screenshot({ path: `${out}/dao-loi-giai-390.png`, fullPage: true })
  await p.getByRole('button', { name: /ĐÃ ĐỌC LỜI GIẢI · SANG ẢI 2/ }).click()
  await p.locator('.dao2-ai[data-pha="lam"]').waitFor()
  results.push({ flow: 'Island → answer → spell → explanation → next question', passed: true })
  await p.close()
} finally {
  writeFileSync(`${out}/game-states.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
console.log(`PASS: ${results.length} game viewport/interaction checks`)
