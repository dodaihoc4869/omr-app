// Kiểm component thật với dữ liệu mô phỏng của bộ chụp sẵn có; không truy cập tài khoản thật.
import { chromium } from 'playwright'
import { mkdir, writeFile } from 'node:fs/promises'
const out = process.env.V2_OUTPUT || '/workspace/anh-v2-hoan-thien'
await mkdir(out, { recursive: true })
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/usr/bin/chromium', args: ['--no-sandbox'] })
const results = []
const modes = process.env.V2_MODES?.split(',') || ['sanh', 'sanh-cho', 'ph', 'gv-chien-dich', 'gv-tong-quan', 'gv-len-bang', 'gv-bai', 'gv-bang-omni', 'gv-cai-dat', 'dao-chip', 'doan-tram', 'chua']
const sizes = [{ name: 'doc', width: 390, height: 844 }, { name: 'ngang', width: 844, height: 390 }, { name: 'desktop', width: 1440, height: 960 }]
try {
  for (const mode of modes) {
    for (const size of sizes) {
      const page = await browser.newPage({ viewport: size, colorScheme: 'dark', reducedMotion: 'reduce' })
      const errors = []
      page.on('pageerror', e => errors.push(e.message))
      await page.route('**/*', route => {
        const url = new URL(route.request().url())
        return ['127.0.0.1', 'localhost'].includes(url.hostname) || !url.protocol.startsWith('http') ? route.continue() : route.abort()
      })
      await page.goto(`http://127.0.0.1:4178/scripts/chup-omni-3/trang.html?man=${mode}`, { waitUntil: 'networkidle' })
      await page.waitForTimeout(600)
      const metrics = await page.evaluate(() => ({
        overflow: Math.max(0, document.documentElement.scrollWidth - innerWidth),
        scheme: getComputedStyle(document.documentElement).colorScheme,
        theme: document.documentElement.dataset.phongCach,
        textLength: document.body.innerText.length,
        heading: [...document.querySelectorAll('h1,h2')].slice(0,5).map(e => e.textContent),
        overflowElements: [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right > innerWidth + 2 && getComputedStyle(e).position !== 'fixed' }).slice(0,8).map(e=>e.className),
      }))
      const name = `${mode}-${size.name}`
      await page.screenshot({ path: `${out}/${name}.png`, fullPage: false })
      results.push({ name, ...metrics, errors })
      console.log(JSON.stringify(results.at(-1)))
      if (mode === 'ph' && size.name === 'desktop') {
        for (const label of ['Điểm số','Tiến bộ','Lời thầy']) {
          const tab = page.getByRole('link', { name: label, exact: true })
          if (await tab.count()) {
            await tab.click(); await page.waitForTimeout(400)
            await page.screenshot({ path: `${out}/ph-${label}.png` })
          }
        }
      }
      if (mode === 'gv-bai') {
        await page.getByRole('button', { name: 'Chọn bài trong kho Dạy học', exact: true }).click()
        await page.getByRole('dialog').waitFor()
        await page.screenshot({ path: `${out}/gv-chon-bai-${size.name}.png` })
        const bounds = await page.locator('.dh-hop').boundingBox()
        if (!bounds || bounds.width > size.width || bounds.height > size.height) errors.push('Hộp chọn bài vượt viewport')
      }
      await page.close()
    }
  }
} finally {
  await writeFile(`${out}/kiem-tra.json`, JSON.stringify(results, null, 2))
  await browser.close()
}
if (results.some(r => r.errors.length || r.overflow > 1 || r.textLength < 20 || r.scheme !== 'light')) process.exitCode = 1
