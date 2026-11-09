#!/usr/bin/env node
// Chụp bản vẽ ngày Mới / Kiểm tra ôn tập / Sửa (09/11) bằng Chromium thật. Chạy: node docs/ban-ve-moi-on-sua-0911/chup.mjs <thư mục phông Be Vietnam Pro>
// Mỗi khung in: lỗi trang · tràn ngang · đích bấm < 44 px · phông. JPG ≤ 150 KB. Điện thoại chụp cả trang (thấy đủ dải đáy).
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const GOC = resolve(import.meta.dirname, '../..'), DIR = import.meta.dirname, PHONG = resolve(process.argv[2] ?? '.')
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2' }
const may = createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = u.startsWith('/phong/') ? join(PHONG, u.slice(7)) : join(GOC, u)
  if (!existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise(r => may.once('listening', r))
const URL0 = `http://127.0.0.1:${may.address().port}/docs/ban-ve-moi-on-sua-0911/moi-on-sua.html#`
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const KHUNG = [
  ['dt-sang-1-ngay-moi', 'man=moi', 390, 844], ['dt-sang-2-sai-co-goi-y', 'man=sai', 390, 844], ['dt-sang-2b-sai-chua-goi-y', 'man=sai2', 390, 844],
  ['dt-sang-3-ngay-sua', 'man=sua', 390, 844], ['dt-sang-4-vi-du-mau', 'man=mau', 390, 844], ['dt-sang-5-cau-cung-dang', 'man=lam', 390, 844],
  ['dt-sang-6-kiem-tra-dang-lam', 'man=kt', 390, 844], ['dt-sang-7-kiem-tra-ket-qua', 'man=kq', 390, 844], ['dt-sang-8-trang-thai', 'man=tt', 390, 844],
  ['dt-toi-1-ngay-moi', 'man=moi&toi=1', 390, 844], ['dt-toi-2-sai-co-goi-y', 'man=sai&toi=1', 390, 844], ['dt-toi-4-vi-du-mau', 'man=mau&toi=1', 390, 844],
  ['mb-sang-3-ngay-sua', 'man=sua', 820, 1180],
  ['mt-sang-1-ngay-moi', 'man=moi', 1366, 900], ['mt-toi-1-ngay-moi', 'man=moi&toi=1', 1366, 900], ['mt-sang-4-vi-du-mau', 'man=mau', 1366, 900],
]
for (const [ten, hash, w, h] of KHUNG) {
  let dpr = w > 1000 ? 1.5 : 2, q = 82, buf
  const loi = []
  for (;;) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, locale: 'vi-VN', reducedMotion: 'reduce' })
    const t = await ctx.newPage(); t.on('pageerror', e => loi.push(String(e)))
    await t.goto(URL0 + hash); await t.evaluate(() => document.fonts.ready)
    const kq = await t.evaluate(() => {
      const tran = document.documentElement.scrollWidth > innerWidth
      const nho = [...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height && (r.width < 44 || r.height < 44) }).map(b => b.textContent.trim().slice(0, 20))
      const phong = document.fonts.check('700 16px "Be Vietnam Pro"')
      return { tran, nho, phong }
    })
    buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: w < 1000 }); await ctx.close()
    if (buf.length <= 150 * 1024 || (q <= 40 && dpr <= 1)) { console.log(`${ten}: ${Math.round(buf.length / 1024)} KB · tràn ${kq.tran} · nút < 44: ${kq.nho.length ? kq.nho.join('|') : 0} · phông ${kq.phong} · lỗi ${loi.length}`); break }
    if (q > 50) q -= 8; else dpr = Math.max(1, dpr - 0.5)
  }
  writeFileSync(join(DIR, ten + '.jpg'), buf)
}
await trinh.close(); may.close()
