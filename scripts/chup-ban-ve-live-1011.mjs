#!/usr/bin/env node
// CHỤP BẢN VẼ CHẾ ĐỘ LIVE (10/11 — bước 2 quy trình 4 bước) bằng Chromium THẬT từ trang mô phỏng docs/ban-ve-live-1011/mo-phong.html.
//   node scripts/chup-ban-ve-live-1011.mjs [thư mục ra = docs/ban-ve-live-1011]
// Màn chiếu thầy: 1366 × 768 và 1920 × 1080, giấy sáng + giấy tối. Máy em: ngang 844 × 390 · ngang nhỏ 667 × 375 · máy bảng 1180 × 820 ·
// iPhone dọc 390 × 844 (hình xoay bằng CSS) · iPhone ngang có tai thỏ. Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB.
// Soát mỗi khung: lỗi trang · tràn ngang · nút bấm < 44 px (máy em < 48 px).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const GOC = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-live-1011'))
mkdirSync(RA, { recursive: true })
// node_modules: của worktree nếu có, không thì của thư mục kho chính (worktree nằm trong .claude/worktrees/<tên>).
const NM = [join(GOC, 'node_modules'), resolve(GOC, '../../../node_modules')].find((p) => existsSync(join(p, 'playwright')))
if (!NM) throw new Error('Không thấy node_modules có playwright')
const { chromium } = createRequire(join(NM, 'x.js'))('playwright')
const PHONG = join(NM, '@fontsource/be-vietnam-pro/files')
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2' }
const may = createServer((req, res) => {
  const d = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = d.startsWith('/phong/') ? join(PHONG, d.slice(7)) : join(GOC, d)
  if (!(p.startsWith(GOC) || p.startsWith(PHONG)) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-live-1011/mo-phong.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []

// [tên ảnh, khung, rộng, cao, dpr, tham số thêm]
const DS = []
let n = 0
const them = (ten, k, w, h, dpr = 1, ts = '') => DS.push([`${String(++n).padStart(2, '0')}-${ten}`, k, w, h, dpr, ts])
// ── Màn chiếu thầy
for (const [k, ten] of [['gv-chua-live', 'thay-chua-live'], ['gv-mo-live', 'thay-bat-live-chon-mic'], ['gv-dang-live', 'thay-dang-live'], ['gv-roi-gon', 'thay-em-roi-man-the-gon'], ['gv-roi-man', 'thay-em-roi-man-the-mo'], ['gv-tay-gon', 'thay-gio-tay-the-gon'], ['gv-gio-tay', 'thay-hang-gio-tay'], ['gv-em-noi', 'thay-em-dang-noi']]) {
  them(`${ten}-1366`, k, 1366, 768)
  if (k === 'gv-chua-live' || k === 'gv-dang-live') { them(`${ten}-1920`, k, 1920, 1080); them(`${ten}-1366-giay-toi`, k, 1366, 768, 1, '&giay=toi') }
}
// ── Máy em: ẩn hết (chỉ tay nắm) — ba khổ, giấy sáng + tối
for (const [kho, w, h, dpr] of [['844', 844, 390, 2], ['667', 667, 375, 2], ['1180', 1180, 820, 1.25]]) for (const g of ['sang', 'toi']) them(`em-an-het-${kho}-giay-${g}`, 'em-an', w, h, dpr, `&giay=${g}`)
// ── Khay mở: đủ bốn màu đội
for (const [i, ten] of [[0, 'natri'], [1, 'kali'], [2, 'dong'], [3, 'canxi']]) them(`em-khay-mo-doi-${ten}-844`, 'em-khay-mo', 844, 390, 2, `&doi=${i}`)
them('em-khay-mo-667-giay-toi', 'em-khay-mo', 667, 375, 2, '&doi=1&giay=toi')
them('em-khay-mo-1180', 'em-khay-mo', 1180, 820, 1.25, '&doi=2')
// ── Các trạng thái riêng
them('em-vao-live-844', 'em-vao-live', 844, 390, 2)
them('em-bat-tieng-844', 'em-bat-tieng', 844, 390, 2, '&doi=2')
them('em-tat-tieng-844', 'em-tat-tieng', 844, 390, 2, '&doi=1')
them('em-dang-gio-tay-844', 'em-gio-tay', 844, 390, 2, '&doi=3')
them('em-dang-gio-tay-khay-dong-844', 'em-gio-tay-an', 844, 390, 2, '&doi=3')
them('em-duoc-moi-noi-844', 'em-duoc-moi', 844, 390, 2, '&doi=3')
them('em-dang-noi-844', 'em-dang-noi', 844, 390, 2, '&doi=3')
them('em-ban-dang-noi-844', 'em-ban-noi', 844, 390, 2, '&doi=0')
them('em-mat-mang-noi-lai-844', 'em-mat-mang', 844, 390, 2, '&doi=0')
them('em-mat-mang-noi-lai-667-giay-toi', 'em-mat-mang', 667, 375, 2, '&doi=2&giay=toi')
them('em-phong-bang-den-844', 'em-phong-bang', 844, 390, 2, '&doi=1')
// ── iPhone: máy dọc, hình xoay bằng CSS (tai thỏ thành mép trái hình) + iPhone ngang có tai thỏ
them('em-iphone-doc-xoay-css-an-het-390', 'em-an', 390, 844, 2, '&xoay=1&doi=0')
them('em-iphone-doc-xoay-css-khay-mo-390', 'em-khay-mo', 390, 844, 2, '&xoay=1&doi=3')
them('em-iphone-doc-xoay-css-dang-noi-390', 'em-dang-noi', 390, 844, 2, '&xoay=1&doi=2')
them('em-iphone-ngang-tai-tho-an-het-844', 'em-an', 844, 390, 2, '&tai=1&doi=1')
them('em-iphone-ngang-tai-tho-khay-mo-844', 'em-khay-mo', 844, 390, 2, '&tai=1&doi=1')

for (const [ten, k, w, h, dpr, ts] of DS) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  t.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.location()?.url ?? '')) soat.push(`${ten}: console ${m.text()}`) })
  await t.goto(`${URL_VE}#k=${k}${ts}`)
  await t.waitForSelector('body[data-xong]')
  await t.waitForTimeout(120)
  // Soát: tràn ngang + nút nhỏ (đo theo điểm ảnh CSS thật sau khi co / xoay).
  const kq = await t.evaluate((toiThieu) => {
    const tran = document.documentElement.scrollWidth > innerWidth + 1
    const nho = [...document.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return { chu: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 24), w: Math.round(r.width), h: Math.round(r.height) } }).filter((x) => Math.min(x.w, x.h) < toiThieu)
    return { tran, nho }
  }, k.startsWith('em') ? 48 : 0)
  if (kq.tran) soat.push(`${ten}: tràn ngang`)
  for (const x of kq.nho) soat.push(`${ten}: nút «${x.chu}» ${x.w}×${x.h} < 48`)
  let q = 86, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg  ${w}×${h}@${dpr}  ${(buf.length / 1024).toFixed(0)} KB  q${q + 6}`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `\nSOÁT: ${soat.length} điểm\n` + soat.join('\n') : `\nSOÁT: 0 lỗi trang · 0 tràn · 0 nút máy em < 48 px (${DS.length} ảnh)`)
if (soat.length) process.exitCode = 1
