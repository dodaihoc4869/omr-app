// Run while the local preview Vite server is running. No production network permitted.
// node scripts/preview-bat-linh/check.mjs [http://127.0.0.1:5173] [output directory]
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const origin = process.argv[2] ?? 'http://127.0.0.1:5173'
const out = resolve(process.argv[3] ?? '/workspace/bat-linh-preview')
mkdirSync(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? '/usr/bin/chromium', args: ['--no-sandbox'] })
const checks = []
const scenarios = [
  ['sanh', 'trang.html?man=sanh', '.bl-dong-hanh'],
  ['xong', 'trang.html?man=xong', '.h2-xong, .h2-ng-xong'],
  ['ph', 'trang.html?man=ph', '.ph3-ah'],
  ['tl', 'trang.html?man=tl', '.tlu-the-che-do'],
  ['hs-login', 'trang.html?man=hs-login', '#hs-dn-sbd'],
  ['ph-login', 'trang.html?man=ph-login', '#ph3-sbd'],
  ['dao', 'games.html?game=dao&thu=1&cap=50', '.dao2'],
  ['shop', 'games.html?game=shop&pet=1&cap=50', '.ps-the'],
  ['doan', 'games.html?game=doan&man=tran', '.dh2'],
  ['bia', 'games.html?game=bia', '.bia'],
]
const base = `${origin}/scripts/preview-bat-linh/`
async function pageFor(width, height, dark = false) {
  const page = await browser.newPage({ viewport: { width, height }, colorScheme: dark ? 'dark' : 'light', reducedMotion: 'reduce' })
  // Extra guard independent of the fixture fetch mock.
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  return page
}
async function capture(page, name, fullPage = true) {
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${out}/${name}.png`, fullPage })
}
try {
  for (const [width, height, dark] of [[360, 740, false], [390, 844, false], [844, 390, false], [1440, 900, false], [390, 844, true]]) {
    for (const [name, route, ready] of scenarios) {
      const page = await pageFor(width, height, dark)
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      try {
        await page.goto(base + route)
        await page.waitForSelector(ready)
        const skip = page.getByRole('button', { name: 'Bỏ qua', exact: true })
        if (await skip.isVisible()) await skip.click()
        await page.waitForTimeout(300)
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
        const brokenImages = await page.locator('img').evaluateAll(imgs => imgs.filter(i => i.complete && !i.naturalWidth).map(i => i.getAttribute('src')))
        const record = { name, width, height, dark, overflow, brokenImages, errors }
        checks.push(record)
        if (width === 390 || width === 1440 || errors.length || overflow > 1) await capture(page, `${name}-${width}${dark ? '-dark' : ''}`, name !== 'shop')
        assert.equal(errors.length, 0, `${name}: JavaScript errors`)
        assert.equal(brokenImages.length, 0, `${name}: broken images`)
        assert.ok(overflow <= 1, `${name} ${width}×${height}: ${overflow}px overflow`)
      } finally { await page.close() }
    }
  }
  // Exercise real controls, not just screenshots.
  const p = await pageFor(390, 844)
  await p.goto(base + 'trang.html?man=sanh')
  await p.locator('.bl-ban-do summary').click()
  assert.ok(await p.locator('.bl-ban-do .h2-ban-do').isVisible())
  await p.locator('.bl-ban-do summary').click()
  assert.ok(!(await p.locator('.bl-ban-do .h2-ban-do').isVisible()))
  await p.getByRole('button', { name: /Tu luyện/ }).click()
  await p.locator('.tlu-the-che-do[data-che-do="3"]').click()
  await p.locator('.tlu-nut-rong').click()
  await p.waitForSelector('.tlu-the-cau')
  await capture(p, 'luyen-cau-hoi-390')
  await p.locator('.tlu-thanh-nop .tlu-nut-chinh').click()
  await p.getByRole('button', { name: 'Nộp bài', exact: true }).last().click()
  await p.waitForSelector('.tlu-diem')
  await capture(p, 'luyen-ket-qua-390')
  await p.getByRole('button', { name: 'Xem tổng hợp' }).click()
  await p.waitForSelector('.tlu-hero')
  await capture(p, 'luyen-tong-hop-390')
  checks.push({ flow: 'Home map toggle → practice → submit → feedback → progress', passed: true })

  await p.goto(base + 'trang.html?man=ph')
  for (const [hash, name] of [['diem', 'ph-diem'], ['tien-bo', 'ph-tien-bo'], ['loi-thay', 'ph-loi-thay']]) {
    await p.locator(`.ph3-muc[href="#${hash}"]`).click()
    await p.locator(`.ph3-muc[href="#${hash}"][aria-current="page"]`).waitFor()
    assert.equal(await p.locator(`.ph3-muc[href="#${hash}"]`).getAttribute('aria-current'), 'page')
    await capture(p, `${name}-390`)
  }
  await p.locator('.ph3-muc[href="#diem"]').click()
  await p.locator('a[href="#ca/CA-2"]').first().click()
  await p.waitForSelector('[data-vung="diem-ca"]')
  await capture(p, 'ph-chi-tiet-390')
  checks.push({ flow: 'Parent all tabs → published exam report', passed: true })
  await p.close()
} finally {
  writeFileSync(`${out}/verification.json`, JSON.stringify(checks, null, 2))
  await browser.close()
}
console.log(`PASS: ${checks.length} viewport/interaction checks. Screenshots: ${out}`)
