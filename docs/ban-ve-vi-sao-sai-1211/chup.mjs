#!/usr/bin/env node
// Chụp bản vẽ «Vì sao em sai?» dừng hẳn (12/11) bằng Chromium thật. Chạy: node docs/ban-ve-vi-sao-sai-1211/chup.mjs
// Mỗi khung in: lỗi trang · tràn ngang · đích bấm < 44 px · phông. JPG ≤ 150 KB.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)('playwright')
const GOC = resolve(import.meta.dirname, '../..'), DIR = import.meta.dirname
const LOAI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' }
const may = createServer((req, res) => {
  const p = join(GOC, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise(r => may.once('listening', r))
const URL0 = `http://127.0.0.1:${may.address().port}/docs/ban-ve-vi-sao-sai-1211/vi-sao-sai.html#`
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const KHUNG = [
  ['dt-sang-0-hien-tai', 'man=truoc', 390, 844], ['dt-sang-1-chua-chon', 'man=chua', 390, 844], ['dt-sang-2-ai-doan', 'man=ai', 390, 844],
  ['dt-sang-3-da-chon', 'man=da', 390, 844], ['dt-toi-1-chua-chon', 'man=chua&toi=1', 390, 844], ['dt-toi-3-da-chon', 'man=da&toi=1', 390, 844],
  ['dt-nho-sang-1-chua-chon', 'man=ai', 360, 640], ['mb-sang-3-da-chon', 'man=da', 820, 1180], ['fold-sang-1-chua-chon', 'man=ai', 884, 1104], ['ngang-sang-1-chua-chon', 'man=ai', 844, 390], ['ngang-sang-3-da-chon', 'man=da', 844, 390], ['mt-sang-1-chua-chon', 'man=ai', 1366, 900], ['mt-toi-3-da-chon', 'man=da&toi=1', 1366, 900],
]
for (const [ten, hash, w, h] of KHUNG) {
  let dpr = w > 1000 ? 1.5 : 2, q = 82, buf
  const loi = []
  for (;;) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, locale: 'vi-VN', reducedMotion: 'reduce' })
    const t = await ctx.newPage(); t.on('pageerror', e => loi.push(String(e)))
    await t.goto(URL0 + hash); await t.evaluate(() => document.fonts.ready)
    const kq = await t.evaluate(() => ({
      tran: document.documentElement.scrollWidth > innerWidth,
      nho: [...document.querySelectorAll('button')].filter(b => { const r = b.getBoundingClientRect(); return r.width && r.height && (r.width < 44 || r.height < 44) }).map(b => b.textContent.trim().slice(0, 20)),
      phong: document.fonts.check('800 16px "Be Vietnam Pro"'),
    }))
    buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: w < 700 })
    await ctx.close()
    if (buf.length <= 150_000 || q <= 40) { console.log(ten, JSON.stringify(kq), loi.length ? loi : '', Math.round(buf.length / 1024) + 'KB'); break }
    q -= 8; if (q < 60) dpr = 1.5
  }
  writeFileSync(join(DIR, ten + '.jpg'), buf)
}
await trinh.close(); may.close()
