#!/usr/bin/env node
// CHỤP BẢN VẼ TỜ CHIẾU "MỨC LÀM" (21/10) bằng Chromium THẬT (/opt/pw-browsers/chromium, không tải trình duyệt).
//   node scripts/dung-ban-ve-chieu-muc-lam-2110.mjs && node scripts/chup-ban-ve-chieu-muc-lam-2110.mjs [thư mục ra = docs/ban-ve-chieu-muc-lam-2110/anh]
// Bản chiếu luôn nền tối: 1920×1080 và 1280×720. Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
// Soát mỗi khung: lỗi trang · tràn ngang · đích chạm < 44 px · NỘI DUNG BỊ CẮT (thẻ cuộn được tới hết hay không: chữ nằm ngoài khung nhìn).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? 'docs/ban-ve-chieu-muc-lam-2110/anh')
mkdirSync(RA, { recursive: true })
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': extname(p) === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-chieu-muc-lam-2110/chieu.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []
const KHUNG = [['ai-sai', '12a-ai-sai'], ['ai-sai-dong', '12b-ai-sai-dong-em'], ['ai-sai-dau', '12c-ai-sai-ngay-dau'], ['ai-sai-chua-dd', '12d-ai-sai-chua-diem-danh'], ['em', '13a-chi-tiet-em'], ['em-chua-do', '13b-chi-tiet-em-chua-do']]
const KHO = [['1920', 1920, 1080], ['1280', 1280, 720]]
for (const [k, ten] of KHUNG) {
  for (const [tk, w, h] of KHO) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: 'dark', reducedMotion: 'reduce', locale: 'vi-VN' })
    const t = await ctx.newPage()
    t.on('pageerror', (e) => soat.push(`${ten}-${tk}: lỗi trang ${e.message}`))
    await t.goto(`${URL_VE}#k=${k}`)
    await t.evaluate(() => document.fonts.ready)
    await t.waitForTimeout(200)
    const kq = await t.evaluate(() => {
      const tran = document.documentElement.scrollWidth > innerWidth + 1
      const nho = [...document.querySelectorAll('.kh:not([hidden]) button')].filter((e) => { const r = e.getBoundingClientRect(); return r.height < 44 || r.width < 44 }).length
      // Cuộn được = có phần bị che. Mỗi thẻ có thể cuộn (overflow) phải KHÔNG tràn (scrollHeight ≤ clientHeight) trong các khung thường.
      const cuon = [...document.querySelectorAll('.kh:not([hidden]) .the-ai, .kh:not([hidden]) .ct-the, .kh:not([hidden]) .lan-ds, .kh:not([hidden]) .ai, .kh:not([hidden]) .ct')]
        .filter((e) => e.scrollHeight > e.clientHeight + 1).map((e) => `${e.className.split(' ')[0]} ${e.scrollHeight}>${e.clientHeight}`)
      const ngoai = [...document.querySelectorAll('.kh:not([hidden]) *')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.right > innerWidth + 1) }).length
      return { tran, nho, cuon, ngoai }
    })
    if (kq.tran) soat.push(`${ten}-${tk}: TRÀN NGANG`)
    if (kq.nho) soat.push(`${ten}-${tk}: ${kq.nho} đích chạm nhỏ`)
    if (kq.cuon.length) soat.push(`${ten}-${tk}: BỊ CẮT/CUỘN ${kq.cuon.join(' | ')}`)
    if (kq.ngoai) soat.push(`${ten}-${tk}: ${kq.ngoai} phần tử lọt ngoài mép phải`)
    let q = 82, buf
    for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 40) break; q -= 6 }
    writeFileSync(join(RA, `${ten}-${tk}.jpg`), buf)
    console.log(`${ten}-${tk}.jpg ${Math.round(buf.length / 1024)} KB (q${q})`)
    await ctx.close()
  }
}
await trinh.close(); may.close()
console.log(soat.length ? `SOÁT: ${soat.length} vấn đề\n- ${soat.join('\n- ')}` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích chạm nhỏ · 0 khung bị cắt')
