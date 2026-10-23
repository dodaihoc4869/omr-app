#!/usr/bin/env node
// CHỤP BẢN VẼ «MÀN CHIẾU ĐIỂM DANH» 23/10 bằng Chromium THẬT (dữ liệu giả, component thật).
//   npx vite build --config scripts/ban-ve-chieu-dd-2310/vite.config.mjs --outDir <tạm> && node scripts/ban-ve-chieu-dd-2310/chup.mjs <tạm> [ra]
// Khổ máy chiếu: 1920×1080 · 1280×720 · 1024×768 (4:3), luôn nền tối. JPG ≤ 150 KB.
// SOÁT mỗi khung: lỗi trang · tràn ngang · phần tử lọt ngoài khung · TÊN EM bị cắt/che (nằm ngoài khung cha có overflow) · nút < 44 px. Có lỗi ⇒ mã thoát 1.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-ban-ve-chieu-dd')
const RA = resolve(process.argv[3] ?? 'docs/ban-ve-chieu-diem-danh-2310/anh')
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const d = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = [join(DIST, d), join(PUB, d)].find((x) => existsSync(x) && statSync(x).isFile()) ?? join(DIST, 'scripts/ban-ve-chieu-dd-2310/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const GOC = `http://127.0.0.1:${may.address().port}/scripts/ban-ve-chieu-dd-2310/trang.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })

const CANH = [
  ['A1', 'diem-danh'], ['A2', 'diem-danh-vua-mo'], ['A3', 'diem-danh-lop-dong-mat-mang'], ['A4', 'diem-danh-chao-em'], ['A5', 'diem-danh-may-chu-cu'],
  ['B1', 'nhip-lop'], ['B2', 'nhip-lop-an-ten-luoi'], ['B3', 'nhip-lop-cach-lam-tung-em'], ['B4', 'nhip-lop-ngay-dau'], ['B5', 'nhip-lop-loi'],
]
const KHO = [['1920', 1920, 1080], ['1280', 1280, 720], ['1024', 1024, 768]]
const soat = []
for (const [k, ten] of CANH) for (const [tk, w, h] of KHO) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, colorScheme: 'dark', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh' })
  const t = await ctx.newPage()
  const nhan = `${k}-${ten}-${tk}`
  t.on('pageerror', (e) => soat.push(`${nhan}: lỗi trang ${e.message}`))
  await t.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
  await t.goto(`${GOC}?k=${k}`)
  await t.evaluate(() => document.fonts.ready)
  await t.waitForTimeout(400)
  const kq = await t.evaluate(() => {
    const W = innerWidth, H = innerHeight
    const tran = document.documentElement.scrollWidth > W + 1
    const ngoai = [...document.querySelectorAll('.ddv *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.right > W + 1 || r.bottom > H + 1) }).length
    // tên bị che: phần tử tên nằm (một phần) ngoài khung cha gần nhất có overflow hidden
    const biChe = []
    for (const e of document.querySelectorAll('.ddv-the-ten, .ddv-dong-ten, .ddv-moi-chu b, .ddv-chao-ten')) {
      const r = e.getBoundingClientRect(); if (!r.width) continue
      let p = e.parentElement
      while (p && getComputedStyle(p).overflow === 'visible') p = p.parentElement
      const c = p?.getBoundingClientRect()
      if (e.scrollWidth > e.clientWidth + 1 || (c && (r.bottom > c.bottom + 1 || r.right > c.right + 1))) biChe.push(e.textContent?.slice(0, 30))
    }
    // nhãn «Vừa vào»/«Dẫn đầu» không được đè lên tên trong cùng thẻ
    for (const n of document.querySelectorAll('.ddv-the-vua, .ddv-the-dau')) {
      const a = n.getBoundingClientRect(), tn = n.closest('.ddv-the')?.querySelector('.ddv-the-ten')?.getBoundingClientRect()
      if (a.width && tn && a.bottom > tn.top + 1 && a.top < tn.bottom - 1 && a.right > tn.left + 1 && a.left < tn.right - 1) biChe.push(`nhãn đè tên ${n.closest('.ddv-the')?.querySelector('.ddv-the-ten')?.textContent?.slice(0, 20)}`)
    }
    const nho = [...document.querySelectorAll('.ddv button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.height < 44 || r.width < 44) }).map((e) => e.textContent?.trim().slice(0, 24))
    const coChu = (s) => document.body.innerText.includes(s)
    return { tran, ngoai, biChe, nho, coTinhLenChieu: coChu('Cố tình') && !!document.querySelector('[data-che-do="nhip"]') }
  })
  if (kq.tran) soat.push(`${nhan}: TRÀN NGANG`)
  if (kq.ngoai) soat.push(`${nhan}: ${kq.ngoai} phần tử lọt ngoài khung`)
  if (kq.biChe.length) soat.push(`${nhan}: ${kq.biChe.length} tên bị cắt/che (vd ${kq.biChe.slice(0, 3).join(' | ')})`)
  if (kq.nho.length) soat.push(`${nhan}: nút < 44 px ${kq.nho.join(' | ')}`)
  if (kq.coTinhLenChieu) soat.push(`${nhan}: chữ «Cố tình» trên bản chiếu Nhịp học`)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 36) break; q -= 6 }
  writeFileSync(join(RA, `${nhan}.jpg`), buf)
  console.log(`${nhan}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 phần tử lọt khung · 0 tên bị cắt/che · 0 nút nhỏ')
if (soat.length) process.exitCode = 1
