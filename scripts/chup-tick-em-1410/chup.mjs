// Chạy Vite bản vẽ trước, rồi node scripts/chup-tick-em-1410/chup.mjs.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { chromium } from 'playwright'
const ra = resolve('docs/ban-ve-tick-em-1410')
mkdirSync(ra, { recursive: true })
const exe = process.env.PW_CHROMIUM || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome')
const browser = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })
const ketQua = []
for (const [ten, width, height] of [['doc', 360, 800], ['ngang', 800, 390], ['may-tinh', 1280, 800]]) {
  for (const mau of ['sang', 'toi']) {
    const loi = []
    const context = await browser.newContext({ viewport: { width, height }, colorScheme: mau === 'toi' ? 'dark' : 'light', locale: 'vi-VN' })
    const page = await context.newPage()
    page.on('pageerror', e => loi.push(e.message))
    page.on('response', r => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) loi.push(`HTTP ${r.status()}: ${new URL(r.url()).pathname}`) })
    await page.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort())
    await page.goto('http://127.0.0.1:5197/scripts/chup-tick-em-1410/trang.html')
    await page.locator('.cd-nut-mo-chon').waitFor()
    await page.evaluate(m => document.documentElement.setAttribute('data-giao-dien', m), mau)
    await page.locator('.cd-nut-mo-chon').click()
    await page.locator('.cd-tam-chon').waitFor()
    if (height > 500) await page.getByRole('button', { name: 'Mở 12 - Tinh Hoa', exact: true }).click()
    if (width < 1000) await page.getByRole('searchbox', { name: 'Tìm em' }).fill('Trần')
    await page.evaluate(() => document.fonts.ready)
    const doHienThi = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]')
      const visibles = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight }
      const nho = [...dialog.querySelectorAll('button,input')].filter(visibles).flatMap(el => {
        const dich = el instanceof HTMLInputElement && el.type === 'checkbox' ? el.closest('label') ?? el : el
        const r = dich.getBoundingClientRect()
        return r.width < 44 || r.height < 44 ? [`${el.getAttribute('aria-label') ?? el.textContent ?? el.tagName}: ${Math.round(r.width)}×${Math.round(r.height)}`] : []
      })
      const rgb = s => { const x = s.match(/[\d.]+/g)?.map(Number); return x?.length >= 3 ? x : null }
      const sang = c => c.slice(0, 3).map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((t, v, i) => t + v * [.2126, .7152, .0722][i], 0)
      const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT), tuongPhanThap = []
      while (walker.nextNode()) {
        const node = walker.currentNode, el = node.parentElement
        if (!node.textContent.trim() || !visibles(el)) continue
        const r = el.getBoundingClientRect(), cay = el.closest('.cd-cay')?.getBoundingClientRect()
        if (cay && (r.bottom <= cay.top || r.top >= cay.bottom)) continue
        const css = getComputedStyle(el), chu = rgb(css.color)
        let nen = null
        for (let p = el; p && !nen; p = p.parentElement) { const c = rgb(getComputedStyle(p).backgroundColor); if (c && (c[3] ?? 1) >= .99) nen = c }
        if (!chu || !nen) continue
        const a = sang(chu), b = sang(nen), tiLe = (Math.max(a, b) + .05) / (Math.min(a, b) + .05)
        const lon = parseFloat(css.fontSize) >= 24 || parseFloat(css.fontSize) >= 18.66 && Number(css.fontWeight) >= 700
        if (tiLe + .01 < (lon ? 3 : 4.5)) tuongPhanThap.push({ chu: node.textContent.trim().slice(0, 50), tiLe: Number(tiLe.toFixed(2)) })
      }
      const nutLuu = dialog.querySelector('footer .gvv2-nut-chinh'), r = nutLuu.getBoundingClientRect()
      const nutLuuBiChe = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('button') !== nutLuu
      return { tranNgang: document.documentElement.scrollWidth - document.documentElement.clientWidth, nho, tuongPhanThap, nutLuuBiChe }
    })
    let bytes = 0
    for (const quality of [72, 62, 52, 42, 32]) {
      const buf = await page.screenshot({ type: 'jpeg', quality })
      if (buf.length <= 150 * 1024 || quality === 32) { writeFileSync(resolve(ra, `${ten}-${mau}.jpg`), buf); bytes = buf.length; break }
    }
    ketQua.push({ ten: `${ten}-${mau}`, width, height, bytes, loi, ...doHienThi })
    await context.close()
  }
}
await browser.close()
writeFileSync(resolve(ra, 'ket-qua.json'), JSON.stringify({ duLieu: 'Giả; chỉ bản vẽ, không gọi API thật', ketQua }, null, 2) + '\n')
for (const r of ketQua) console.log(`${r.ten}: ${r.bytes} byte, ${r.loi.length} lỗi trang, tràn ${r.tranNgang}px, ${r.nho.length} đích nhỏ, ${r.tuongPhanThap.length} chữ tương phản thấp, nút lưu bị che=${r.nutLuuBiChe}`)
if (ketQua.some(r => r.loi.length || r.tranNgang || r.nho.length || r.tuongPhanThap.length || r.nutLuuBiChe)) process.exitCode = 1
