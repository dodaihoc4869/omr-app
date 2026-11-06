#!/usr/bin/env node
// CHỤP BẢN VẼ «BÌNH PHẢN ỨNG» (06/11) bằng Chromium THẬT (/opt/pw-browsers/chromium). Không cần build app.
//   node docs/ban-ve-binh-phan-ung-0611/chup.mjs
// Nguyên mẫu `nguyen-mau.html` (cũng là trang Artifact) được bọc khung tài liệu rồi mở theo #mã trạng thái:
//   bảng chiếu  #b-<pha>[-toi|-sang][-yeu]  1920×1080 (nền máy chiếu tối / sáng; -yeu = máy yếu, không hiệu ứng)
//   máy em      #h-<trạng thái>[-toi|-sang]  390×844 dọc · 844×390 ngang · 1440×900 máy tính
//   điện thoại thầy #d-<trạng thái>[-toi|-sang] 390×844
// Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB. Soát: lỗi trang · tràn ngang · đích bấm < 44 px (chỉ màn có nút thật: máy em, điện thoại thầy).
import { createServer } from 'node:http'
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const VE = resolve(import.meta.dirname)
const GOC = resolve(VE, '../..')
const RA = join(VE, 'anh')
mkdirSync(RA, { recursive: true })
for (const f of readdirSync(RA)) if (f.endsWith('.jpg')) rmSync(join(RA, f))
const { chromium } = createRequire(join(GOC, 'package.json'))('playwright')

const than = readFileSync(join(VE, 'nguyen-mau.html'), 'utf8')
const trang = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>${than}</body></html>`
const may = createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(trang) }).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_GOC = `http://127.0.0.1:${may.address().port}/`
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const soat = []

async function chup(ten, ma, { w, h, dpr = 1, toi = false, kiemNut = true }) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  await t.goto(`${URL_GOC}#${ma}`)
  await t.waitForSelector('html[data-san-sang]', { timeout: 8000 }).catch(() => soat.push(`${ten}: không dựng xong`))
  await t.evaluate(() => document.fonts.ready); await t.waitForTimeout(250)
  const kq = await t.evaluate((kiemNut) => ({
    tran: document.documentElement.scrollWidth > innerWidth + 1,
    nho: kiemNut ? [...document.querySelectorAll('.may button, .dk button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) && !e.closest('[hidden]') }).map((e) => e.textContent.trim().slice(0, 24)) : [],
    tranTrong: [...document.querySelectorAll('.m-than, .dk')].some((e) => e.scrollWidth > e.clientWidth + 1),
  }), kiemNut)
  if (kq.tran || kq.tranTrong) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích bấm nhỏ ${kq.nho.join(' | ')}`)
  let q = 84, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 30) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
  await ctx.close()
}

// 1) Bảng chiếu 1920×1080 — nền tối và nền sáng của máy chiếu.
const BANG = [['01', 'bat-dau'], ['02', 'cho'], ['03', 'tra-loi'], ['04', 'goi'], ['04b', 'lam-bang'], ['05', 'mo'], ['06', 'ds-mo'], ['07', 'tln-mo'], ['08', 'tu-luan'], ['09', 'ket-tinh'], ['10', 'tong-ket'], ['11', 'chan']]
for (const [so, pha] of BANG) for (const nen of ['toi', 'sang']) await chup(`b${so}-bang-${pha}-${nen}`, `b-${pha}-${nen}`, { w: 1920, h: 1080, kiemNut: false })
await chup('b12-bang-mo-may-yeu', 'b-mo-toi-yeu', { w: 1920, h: 1080, kiemNut: false })

// 2) Máy em — 390 dọc cả sáng/tối; trạng thái chính thêm 844 ngang và 1440 máy tính.
const HS = [['01', 'nghi'], ['02', 'chon'], ['03', 'da-gui'], ['04', 'dung'], ['05', 'sai'], ['06', 'giai'], ['07', 'cho'], ['08', 'xong'], ['09', 'ds'], ['10', 'tln'], ['11', 'tu-luan'], ['12', 'mat-mang'], ['13', 'duoc-goi'], ['14', 'du-doan'], ['15', 'roi'], ['00', 'nhap-ma']]
for (const [so, tt] of HS) for (const toi of [false, true]) await chup(`h${so}-may-em-${tt}-390-${toi ? 'toi' : 'sang'}`, `h-${tt}-${toi ? 'toi' : 'sang'}`, { w: 390, h: 844, dpr: 1.25, toi })
for (const [so, tt] of [['02', 'chon'], ['04', 'dung']]) for (const [kho, w, h] of [['844-ngang', 844, 390], ['1440-may-tinh', 1440, 900]]) for (const toi of [false, true]) await chup(`h${so}-may-em-${tt}-${kho}-${toi ? 'toi' : 'sang'}`, `h-${tt}-${toi ? 'toi' : 'sang'}`, { w, h, toi })

// 3) Điện thoại thầy (điều khiển máy chiếu).
for (const [so, tt] of [['01', 'tra-loi'], ['02', 'mo']]) for (const toi of [false, true]) await chup(`d${so}-dien-thoai-thay-${tt}-${toi ? 'toi' : 'sang'}`, `d-${tt}-${toi ? 'toi' : 'sang'}`, { w: 390, h: 844, dpr: 1.25, toi })

await trinh.close(); may.close()
writeFileSync(join(VE, 'soat.txt'), soat.length ? soat.join('\n') + '\n' : 'Soát: 0 lỗi trang · 0 tràn ngang · 0 đích bấm < 44 px\n')
console.log(soat.length ? `SOÁT ${soat.length} VẤN ĐỀ:\n${soat.join('\n')}` : 'Soát: 0 lỗi trang · 0 tràn ngang · 0 đích bấm < 44 px')
