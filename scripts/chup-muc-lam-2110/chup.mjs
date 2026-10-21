#!/usr/bin/env node
// CHỤP ẢNH TẤM "HỒ SƠ LÀM BÀI" THẬT có Mức làm 1–4 bằng Chromium THẬT (Playwright; /opt/pw-browsers/chromium; không tải trình duyệt), dữ liệu GIẢ, mọi yêu cầu ra ngoài bị chặn.
//   npx vite build --config scripts/chup-muc-lam-2110/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-muc-lam-2110/chup.mjs <thư mục tạm> [thư mục ảnh = docs/anh-muc-lam-ho-so-2110] [tiền tố tên ảnh]
// Ba chế độ (thầy · học sinh · phụ huynh) × ba khổ (390×844 dọc · 844×390 ngang · 1440×900 máy tính) × sáng / tối × hai cảnh: `cl` = khối "Cách làm bài", `ls` = Toàn bộ lịch sử.
// Thêm: thầy "những ngày đầu" (chưa lượt nào có số đo) và "lớp chưa đủ mẫu" ở khổ máy tính + điện thoại.
// Soát mỗi ảnh: lỗi trang · tràn ngang · đích chạm < 44 px (nút) · chữ trong khối mức nhỏ hơn 12 px · tương phản chữ của chip / thanh (≥ 4,5:1). JPG tự hạ chất lượng tới ≤ 150 KB.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-muc-lam')
const RA = resolve(process.argv[3] ?? 'docs/anh-muc-lam-ho-so-2110')
const CHON = process.argv[4] ?? ''
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml' }
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/chup-muc-lam-2110/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
const KHO = [['dien-thoai-doc', 390, 844], ['dien-thoai-ngang', 844, 390], ['may-tinh', 1440, 900]]
const CHE = [['thay', 'thay'], ['hoc-sinh', 'hs'], ['phu-huynh', 'ph']]

/** Cảnh: [tên, tham số URL, kiểu cuộn]. `cl` cuộn tới "Cách làm bài"; `ls` mở tab Toàn bộ lịch sử rồi cuộn tới danh sách. */
async function chup(ten, query, canh, w, h, toi) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN', hasTouch: w < 900, isMobile: w < 500 })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(8000)
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  t.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) soat.push(`${ten}: console ${m.text().slice(0, 160)}`) })
  await t.goto(`${goc}/scripts/chup-muc-lam-2110/trang.html?${query}`)
  try { await t.locator('.hslc-cl').first().waitFor({ timeout: 15000 }) } catch { soat.push(`${ten}: không thấy khối Cách làm bài`) }
  await t.evaluate(() => document.fonts.ready)
  if (canh === 'ls') {
    await t.getByRole('tab', { name: /^Toàn bộ lịch sử/ }).click()
    await t.waitForTimeout(150)
  }
  await t.evaluate((c) => {
    const el = document.querySelector(c === 'ls' ? '.gvv2-hs-ls' : '.hslc-cl')
    const than = el?.closest('.gvv2-hs-than')
    if (el && than) than.scrollTop += el.getBoundingClientRect().top - than.getBoundingClientRect().top - 12
  }, canh)
  await t.waitForTimeout(250)
  const kq = await t.evaluate(() => {
    // Tràn ngang = phần tử NHÌN THẤY (bỏ chữ ẩn dành cho trình đọc `.gvv2-an-chu` — nằm ngoài khung nhưng bị cắt) vượt mép phải khung nhìn.
    const tran = document.documentElement.scrollWidth > innerWidth + 1 && [...document.querySelectorAll('body *')].some((e) => !e.closest('.gvv2-an-chu') && getComputedStyle(e).visibility !== 'hidden' && e.getBoundingClientRect().width > 1 && e.getBoundingClientRect().right > innerWidth + 1)
    const tranTam = [...document.querySelectorAll('.gvv2-hs *')].some((e) => !e.closest('.gvv2-an-chu') && e.getBoundingClientRect().width > 1 && e.getBoundingClientRect().right > innerWidth + 1)
    const nho = [...document.querySelectorAll('button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && (r.height < 44 || r.width < 44) && getComputedStyle(e).visibility !== 'hidden' }).map((e) => (e.getAttribute('aria-label') || e.textContent.trim()).slice(0, 24))
    const nhoChu = [...document.querySelectorAll('.hslc-cl *, .hslc-muc-luot *, .hslc-chip-m, .hslc-o-muc *')].filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12).length
    // tương phản chữ của chip / số trên thanh: màu chữ so với nền hiệu lực (đi ngược cây tới nền không trong suốt)
    // Màu tính ra có thể là rgb(…) hoặc color(srgb r g b / a) (kết quả color-mix) — đưa về 0–255.
    const rgb = (s) => { const so = (s.match(/-?[\d.]+(?:e-?\d+)?/g) ?? []).map(Number); return s.startsWith('color(') ? [so[0] * 255, so[1] * 255, so[2] * 255, so[3] ?? 1] : so }
    const nenHieuLuc = (el) => { let x = el; while (x) { const c = rgb(getComputedStyle(x).backgroundColor); if (c.length >= 3 && (c[3] ?? 1) > 0.5) return c; x = x.parentElement } return [255, 255, 255] }
    const lum = (c) => { const [r, g, b] = c.slice(0, 3).map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }
    const tuongPhan = (el) => { const a = lum(rgb(getComputedStyle(el).color)), b = lum(nenHieuLuc(el)); return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) }
    const thap = [...document.querySelectorAll('.hslc-tm b, .hslc-chip-m b, .hslc-chip-m-ten, .hslc-muc-luot-so, .hslc-cl-do, .hslc-cl-hai b, .hslc-cl-hai span')].map((e) => [e.textContent.trim().slice(0, 20), tuongPhan(e)]).filter(([, t]) => t < 4.5)
    return { tran, tranTam, nho, nhoChu, thap }
  })
  if (kq.tran || kq.tranTam) soat.push(`${ten}: TRÀN NGANG`)
  if (kq.nho.length) soat.push(`${ten}: đích chạm nhỏ ${[...new Set(kq.nho)].join(' | ')}`)
  if (kq.nhoChu) soat.push(`${ten}: ${kq.nhoChu} chữ < 12 px`)
  if (kq.thap.length) soat.push(`${ten}: tương phản < 4,5:1 — ${kq.thap.slice(0, 4).map(([c, t]) => `${c} ${t.toFixed(2)}`).join(' | ')}`)
  let q = 82, buf
  for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
  await ctx.close()
}

for (const [che, k] of CHE) {
  for (const [kho, w, h] of KHO) {
    for (const toi of [false, true]) {
      const t = toi ? '-toi' : ''
      for (const canh of ['cl', 'ls']) {
        const ten = `${k}-${canh}-${kho}${t}`
        if (CHON && !ten.startsWith(CHON)) continue
        await chup(ten, `che=${che}`, canh, w, h, toi)
      }
    }
  }
}
// Trạng thái đặc biệt (thầy): những ngày đầu · lớp chưa đủ mẫu; học sinh những ngày đầu.
for (const [kho, w, h] of [KHO[0], KHO[2]]) {
  for (const toi of [false, true]) {
    const t = toi ? '-toi' : ''
    for (const [ten, q] of [[`thay-cl-chua-do-${kho}${t}`, 'che=thay&chuaDo=1'], [`thay-cl-khong-beta-${kho}${t}`, 'che=thay&khongBeta=1'], [`hs-cl-chua-do-${kho}${t}`, 'che=hoc-sinh&chuaDo=1']]) {
      if (CHON && !ten.startsWith(CHON)) continue
      await chup(ten, q, 'cl', w, h, toi)
    }
  }
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · 0 chữ < 12 px · 0 tương phản thấp')
process.exit(soat.length ? 1 : 0)
