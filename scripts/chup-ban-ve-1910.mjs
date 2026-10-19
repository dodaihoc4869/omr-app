#!/usr/bin/env node
// CHỤP BẢN VẼ 19/10 (F1 "Chữa tất cả" app thầy · F2 "Thang xoá lỗi" Tự sửa lỗi) bằng Chromium THẬT (/opt/pw-browsers/chromium, không tải trình duyệt).
//   node scripts/chup-ban-ve-1910.mjs [thư mục ra = docs/ban-ve-1910/anh]
// Ảnh JPG bắt đầu chất lượng 80, tự hạ tới khi ≤ 150 KB (hết đường thì hạ mật độ điểm ảnh). Mỗi khung in: lỗi trang · tràn ngang · đích bấm < 44 px.
//   tràn ngang = trang cuộn ngang (scrollWidth > clientWidth) + mỗi phần tử có nội dung tràn khỏi hộp (scrollWidth > clientWidth, overflow-x hiện) hoặc lòi ra ngoài màn;
//   đích bấm = button, a, [role=button] đang hiện có rộng hoặc cao < 44 px.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const GOC_REPO = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? join(GOC_REPO, 'docs/ban-ve-1910/anh'))
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.css': 'text/css' }
const may = createServer((req, res) => {
  const p = join(GOC_REPO, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  if (!p.startsWith(GOC_REPO) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const GOC = `http://127.0.0.1:${may.address().port}/docs/ban-ve-1910/`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })

const F1 = 'chua-tat-ca.html', F2 = 'thang-xoa-loi.html'
// [tên ảnh, tệp, hash, rộng, cao, chụp cả trang]
const KHUNG = [
  ['01-chua-tat-ca-may-tinh', F1, 'tt=co&xem=1', 1440, 900, false],
  ['02-chua-tat-ca-may-tinh-toi', F1, 'tt=co&xem=1&toi=1', 1440, 900, false],
  ['03-chua-tat-ca-doc', F1, 'tt=co&xem=1', 390, 844, true],
  ['04-chua-tat-ca-ngang', F1, 'tt=co&cuon=1', 844, 390, false],
  ['05-chua-tat-ca-chua-diem-danh-doc', F1, 'tt=chua-dd', 390, 844, false],
  ['06-chua-tat-ca-rong-doc-toi', F1, 'tt=rong&toi=1', 390, 844, false],
  ['07-thang-xoa-loi-doc', F2, 'tt=co', 390, 844, true],
  ['08-thang-xoa-loi-doc-toi', F2, 'tt=co&toi=1', 390, 844, true],
  ['09-thang-xoa-loi-ngang', F2, 'tt=co', 844, 390, false],
  ['10-thang-xoa-loi-may-tinh', F2, 'tt=co&xoa=1', 1440, 900, true],
  ['11-thang-xoa-loi-rong-doc', F2, 'tt=rong', 390, 844, false],
  ['12-thang-xoa-loi-mat-mang-doc-toi', F2, 'tt=co&mang=0&toi=1', 390, 844, false],
]

let tongLoi = 0, tongTran = 0, tongNho = 0
const chiTiet = []
for (const [ten, tep, hash, w, h, caTrang] of KHUNG) {
  let dpr = w > 1000 ? 1 : caTrang ? 1.5 : 2
  let buf, q, loiTrang = [], kq
  for (;;) {
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: hash.includes('toi=1') ? 'dark' : 'light', reducedMotion: 'reduce', locale: 'vi-VN' })
    const t = await ctx.newPage()
    loiTrang = []
    t.on('pageerror', (e) => loiTrang.push(e.message))
    t.on('console', (m) => { if (m.type() === 'error') loiTrang.push(`console: ${m.text()}`) })
    await t.goto(`${GOC}${tep}#${hash}`)
    await t.evaluate(() => document.fonts.ready)
    await t.waitForTimeout(250)
    kq = await t.evaluate(() => {
      const hien = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' }
      const tran = []
      const de = document.documentElement
      if (de.scrollWidth > de.clientWidth) tran.push(`trang cuộn ngang ${de.scrollWidth}>${de.clientWidth}`)
      for (const e of document.querySelectorAll('body *')) {
        if (!(e instanceof HTMLElement) || !hien(e) || e.closest('.sr')) continue
        const s = getComputedStyle(e), r = e.getBoundingClientRect()
        const ten = `${e.tagName.toLowerCase()}.${[...e.classList].join('.')}`
        if (e.clientWidth > 0 && e.scrollWidth > e.clientWidth + 1 && s.overflowX === 'visible') tran.push(`${ten} ${e.scrollWidth}>${e.clientWidth}`)
        else if (r.right > innerWidth + 1 || r.left < -1) tran.push(`${ten} lòi ra ngoài màn (${Math.round(r.left)}…${Math.round(r.right)})`)
      }
      const nho = [...document.querySelectorAll('button, a, [role=button]')].filter((e) => hien(e)).map((e) => [e, e.getBoundingClientRect()])
        .filter(([, r]) => r.width < 44 || r.height < 44).map(([e, r]) => `"${e.textContent.trim().slice(0, 24)}" ${Math.round(r.width)}×${Math.round(r.height)}`)
      const chinh = document.querySelectorAll('.gvv2-nut-chinh, .ht-nut-chinh').length
      return { tran, nho, chinh, cao: de.scrollHeight }
    })
    // Cả trang: soát ở khổ thật trước, rồi kéo khung nhìn bằng chiều cao trang để thanh đáy cố định nằm đúng đáy ảnh (fullPage để nó lơ lửng giữa trang).
    if (caTrang) { await t.setViewportSize({ width: w, height: kq.cao }); await t.waitForTimeout(150) }
    q = 80
    for (;;) { buf = await t.screenshot({ type: 'jpeg', quality: q }); if (buf.length <= 150_000 || q <= 50) break; q -= 5 }
    await ctx.close()
    if (buf.length <= 150_000 || dpr <= 1) break
    dpr = Math.max(1, Math.round((dpr - 0.25) * 100) / 100)
  }
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  tongLoi += loiTrang.length; tongTran += kq.tran.length; tongNho += kq.nho.length
  console.log(`${ten}.jpg · ${loiTrang.length} lỗi trang · ${kq.tran.length} tràn · ${kq.nho.length} đích < 44 px · ${kq.chinh} nút chính · ${Math.round(buf.length / 1024)} KB (q${q}, ×${dpr}${caTrang ? `, cả trang cao ${kq.cao}px` : ''})`)
  for (const x of loiTrang) chiTiet.push(`${ten}: lỗi trang ${x}`)
  for (const x of kq.tran) chiTiet.push(`${ten}: tràn ${x}`)
  for (const x of kq.nho) chiTiet.push(`${ten}: đích nhỏ ${x}`)
}
await trinh.close(); may.close()
if (chiTiet.length) console.log(`CHI TIẾT:\n- ${chiTiet.join('\n- ')}`)
console.log(`TỔNG ${KHUNG.length} khung: ${tongLoi} lỗi trang · ${tongTran} tràn · ${tongNho} đích < 44 px`)
