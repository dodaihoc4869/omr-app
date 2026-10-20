#!/usr/bin/env node
// CHỤP BẢN VẼ MỨC LÀM BÀI (20/10) bằng Chromium THẬT (/opt/pw-browsers/chromium, không tải trình duyệt).
//   node scripts/dung-ban-ve-muc-lam-2010.mjs && node scripts/chup-ban-ve-muc-lam-2010.mjs [thư mục ra = docs/ban-ve-muc-lam-2010/anh]
// Khung app thầy / học sinh / phụ huynh: 390 dọc · 844 ngang · 1440 máy tính × sáng + tối. Khung bản chiếu: 1920×1080 và 1280×720 (luôn tối).
// Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB. Soát mỗi khung: lỗi trang · tràn ngang · đích chạm < 44 px · nội dung bản chiếu bị cắt.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-muc-lam-2010/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-muc-lam-2010/muc-lam.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []

const THUONG = ['thang', 'do', 'diem-danh', 'ho-so', 'ai-sai', 'len-bang', 'hs', 'ph']
const CHIEU = ['chieu-tat', 'chieu-bat', 'chieu-x']
const KHO = [['doc', 390, 844, 1.25], ['ngang', 844, 390, 1.25], ['may-tinh', 1440, 900, 1]]
const KHO_CHIEU = [['1920', 1920, 1080, 1], ['1280', 1280, 720, 1]]
const lamMot = async (k, ten, w, h, dpr, toi, chieu) => {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${URL_VE}#k=${k}${toi ? '&toi=1' : ''}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(250)
  const kq = await t.evaluate((chieuMot) => {
    const tran = document.documentElement.scrollWidth > innerWidth + 1
    const nho = [...document.querySelectorAll('button, a')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) && getComputedStyle(e).visibility !== 'hidden' }).map((e) => e.getAttribute('aria-label') || e.textContent.trim().slice(0, 20))
    const cat = chieuMot ? (() => { const c = document.querySelector('.kh:not([hidden]) .cd'); return c ? c.scrollHeight > c.clientHeight + 1 : false })() : false
    const catChu = chieuMot ? [...document.querySelectorAll('.kh:not([hidden]) .cd *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.bottom > innerHeight + 1 || r.right > innerWidth + 1) }).length : 0
    return { tran, nho, cat, catChu }
  }, chieu)
  if (kq.tran) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${kq.nho.join(' | ')}`)
  if (kq.cat || kq.catChu) soat.push(`${ten}: BẢN CHIẾU BỊ CẮT (${kq.catChu} phần tử lọt ngoài khung)`)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q, fullPage: !chieu }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
let stt = 0
for (const k of THUONG) {
  stt++
  for (const [tenKho, w, h, dpr] of KHO) for (const toi of [false, true]) await lamMot(k, `${String(stt).padStart(2, '0')}-${k}-${tenKho}-${toi ? 'toi' : 'sang'}`, w, h, dpr, toi, false)
}
for (const k of CHIEU) {
  stt++
  for (const [tenKho, w, h, dpr] of KHO_CHIEU) await lamMot(k, `${String(stt).padStart(2, '0')}-${k}-${tenKho}`, w, h, dpr, true, true)
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · 0 bản chiếu bị cắt')
