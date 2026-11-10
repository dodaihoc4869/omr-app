#!/usr/bin/env node
// CHỤP BẢN VẼ «XEM LẠI LIVE» (10/11 — bước 2 quy trình 4 bước) bằng Chromium THẬT từ trang mô phỏng docs/ban-ve-live-xem-lai-1011/mo-phong.html.
//   node scripts/chup-ban-ve-live-xem-lai-1011.mjs [thư mục ra = docs/ban-ve-live-xem-lai-1011]      (CHI=<biểu thức> để chụp riêng vài ảnh)
// Trang mô phỏng NẠP THẲNG biến màu thật (src/styles/tokens.css, trong.css, trong-hs-mau.css). Sáng / tối = prefers-color-scheme như app thật.
// Khổ: điện thoại dọc 390 × 844 · ngang 844 × 390 và 667 × 375 · máy bảng 1180 × 820 · máy tính 1440 × 900 · màn chiếu 1366 × 768.
// Ảnh JPG tự hạ chất lượng tới khi ≤ 150 KB. Soát mỗi khung: lỗi trang · tràn ngang · nút bấm < 44 px (máy em < 48 px).
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const GOC = resolve(import.meta.dirname, '..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-live-xem-lai-1011'))
mkdirSync(RA, { recursive: true })
// node_modules: của worktree nếu có, không thì của thư mục kho chính (worktree nằm trong .claude/worktrees/<tên>).
const NM = [join(GOC, 'node_modules'), resolve(GOC, '../../../node_modules')].find((p) => existsSync(join(p, 'playwright')))
if (!NM) throw new Error('Không thấy node_modules có playwright')
const { chromium } = createRequire(join(NM, 'x.js'))('playwright')
const PHONG = join(NM, '@fontsource/be-vietnam-pro/files')
const LOAI = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.woff2': 'font/woff2' }
const may = createServer((req, res) => {
  const d = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = d.startsWith('/phong/') ? join(PHONG, d.slice(7)) : join(GOC, d)
  if (!(p.startsWith(GOC) || p.startsWith(PHONG)) || !existsSync(p) || !statSync(p).isFile()) { res.writeHead(404); res.end(); return }
  res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' }); res.end(readFileSync(p))
}).listen(0)
await new Promise((r) => may.once('listening', r))
const URL_VE = `http://127.0.0.1:${may.address().port}/docs/ban-ve-live-xem-lai-1011/mo-phong.html`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const soat = []

// [tên ảnh, khung, rộng, cao, dpr, 'sang' | 'toi', tham số thêm]
const DS = []
let n = 0
const them = (ten, k, w, h, dpr, mau, ts = '') => DS.push([`${String(++n).padStart(2, '0')}-${ten}`, k, w, h, dpr, mau, ts])
const DOC = [390, 844, 2], NGANG = [844, 390, 2], MT = [1440, 900, 1]
// ── Máy em: phần «Thêm» có nút «Live»
them('em-them-nut-live-390-sang', 'hs-them', ...DOC, 'sang')
them('em-them-nut-live-390-toi', 'hs-them', ...DOC, 'toi')
them('em-them-nut-live-844-ngang-sang', 'hs-them', ...NGANG, 'sang')
them('em-them-nut-live-1440-toi', 'hs-them', ...MT, 'toi')
// ── Máy em: danh sách buổi live
them('em-danh-sach-390-sang', 'hs-ds', ...DOC, 'sang')
them('em-danh-sach-390-toi', 'hs-ds', ...DOC, 'toi')
them('em-danh-sach-844-ngang-sang', 'hs-ds', ...NGANG, 'sang')
them('em-danh-sach-1440-sang', 'hs-ds', ...MT, 'sang')
them('em-danh-sach-rong-390-sang', 'hs-ds', ...DOC, 'sang', '&tt=rong')
them('em-danh-sach-dang-xu-ly-390-toi', 'hs-ds', ...DOC, 'toi', '&tt=xuly')
them('em-danh-sach-mat-mang-390-sang', 'hs-ds', ...DOC, 'sang', '&tt=mat')
// ── Máy em: trang buổi live sống động (dọc, ba chỗ cuộn) + ngang
them('em-buoi-390-sang-1-dau', 'hs-buoi', ...DOC, 'sang')
them('em-buoi-390-sang-2-bang-vang', 'hs-buoi', ...DOC, 'sang', '&cuon=CUON2')
them('em-buoi-390-sang-3-cau', 'hs-buoi', ...DOC, 'sang', '&cuon=CUON3')
them('em-buoi-390-toi-1-dau', 'hs-buoi', ...DOC, 'toi')
them('em-buoi-390-toi-2-bang-vang', 'hs-buoi', ...DOC, 'toi', '&cuon=CUON2')
them('em-buoi-390-toi-3-cau', 'hs-buoi', ...DOC, 'toi', '&cuon=CUON3')
them('em-buoi-844-ngang-sang', 'hs-buoi', ...NGANG, 'sang')
// ── Máy em: trình phát một đoạn (ngang, phủ kín) — giấy sáng / tối theo THẦY như lúc live
them('em-phat-844-giay-sang', 'hs-phat', ...NGANG, 'toi', '&giay=sang')
them('em-phat-844-giay-toi', 'hs-phat', ...NGANG, 'toi', '&giay=toi')
them('em-phat-844-tam-dung', 'hs-phat', ...NGANG, 'toi', '&giay=sang&dung=1')
them('em-phat-844-an-dieu-khien-luoc-lang', 'hs-phat', ...NGANG, 'toi', '&giay=sang&an=1&luoc=1')
them('em-phat-667-giay-toi', 'hs-phat', 667, 375, 2, 'toi', '&giay=toi')
them('em-phat-1180-may-bang', 'hs-phat', 1180, 820, 1.25, 'toi', '&giay=sang')
them('em-phat-iphone-doc-xoay-css-390', 'hs-phat', ...DOC, 'toi', '&giay=sang&xoay=1')
// ── Trang buổi live khổ máy tính
them('buoi-may-tinh-1440-sang', 'buoi-mt', ...MT, 'sang')
them('buoi-may-tinh-1440-toi', 'buoi-mt', ...MT, 'toi')
// ── App thầy
them('thay-hom-nay-nut-live-1440-sang', 'gv-homnay', ...MT, 'sang')
them('thay-hom-nay-nut-live-1440-toi', 'gv-homnay', ...MT, 'toi', '&tt=xuly')
them('thay-hom-nay-nut-live-390-sang', 'gv-homnay', ...DOC, 'sang')
them('thay-lich-su-1440-sang', 'gv-ls', ...MT, 'sang')
them('thay-lich-su-1440-toi', 'gv-ls', ...MT, 'toi')
them('thay-lich-su-390-sang', 'gv-ls', ...DOC, 'sang')
them('thay-dang-xu-ly-buoi-vua-xong-1440-sang', 'gv-ls', ...MT, 'sang', '&tt=xuly')
them('thay-dang-xu-ly-buoi-vua-xong-390-toi', 'gv-ls', ...DOC, 'toi', '&tt=xuly')
them('thay-chon-nhieu-1440-sang', 'gv-ls', ...MT, 'sang', '&tt=chon')
them('thay-chon-nhieu-390-toi', 'gv-ls', ...DOC, 'toi', '&tt=chon')
them('thay-xac-nhan-xoa-1440-sang', 'gv-ls', ...MT, 'sang', '&tt=xoa')
them('thay-xac-nhan-xoa-390-toi', 'gv-ls', ...DOC, 'toi', '&tt=xoa')
them('thay-doi-ten-1440-sang', 'gv-ls', ...MT, 'sang', '&tt=ten')
them('thay-doi-ten-390-sang', 'gv-ls', ...DOC, 'sang', '&tt=ten')
them('thay-lich-su-rong-1440-sang', 'gv-ls', ...MT, 'sang', '&tt=rong')
them('thay-man-chieu-tu-ghi-1366', 'gv-chieu', 1366, 768, 1, 'toi')

const chi = process.env.CHI ? new RegExp(process.env.CHI) : null
for (const [ten, k, w, h, dpr, mau, ts] of DS) {
  if (chi && !chi.test(ten)) continue
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, reducedMotion: 'reduce', locale: 'vi-VN', colorScheme: mau === 'toi' ? 'dark' : 'light' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => soat.push(`${ten}: lỗi trang ${e.message}`))
  t.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.location()?.url ?? '')) soat.push(`${ten}: console ${m.text()}`) })
  await t.goto(`${URL_VE}#k=${k}${ts.replace(/&cuon=CUON\d/, '')}`)
  await t.waitForSelector('body[data-xong]', { state: 'attached' })
  // Cuộn tới khối cần chụp: CUON2 = thẻ «Bảng vàng», CUON3 = thẻ câu 3 (đoạn đáng xem).
  const cuon = /CUON(\d)/.exec(ts)?.[1]
  if (cuon) await t.evaluate((c) => { const the = [...document.querySelectorAll('.lv-the')]; const d = c === '2' ? the[0] : the.find((x) => x.querySelector('.lv-hay')); if (d) scrollTo(0, d.getBoundingClientRect().top + scrollY - 12) }, cuon)
  await t.waitForTimeout(150)
  // Soát: tràn ngang + nút nhỏ (đo theo điểm ảnh CSS thật sau khi co / xoay).
  const kq = await t.evaluate((toiThieu) => {
    const tran = document.documentElement.scrollWidth > innerWidth + 1
    const nho = [...document.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return { chu: (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 28), w: Math.round(r.width), h: Math.round(r.height) } }).filter((x) => x.w + x.h > 0 && Math.min(x.w, x.h) < toiThieu) // 0 × 0 = nút đang ẩn theo khổ (thanh bên / thanh đáy)
    return { tran, nho }
  }, k.startsWith('gv') ? 44 : 48)
  if (kq.tran) soat.push(`${ten}: tràn ngang`)
  for (const x of kq.nho) soat.push(`${ten}: nút «${x.chu}» ${x.w}×${x.h} nhỏ hơn mức`)
  let q = 88, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  if (buf.length > 150 * 1024) soat.push(`${ten}: ảnh ${(buf.length / 1024).toFixed(0)} KB > 150 KB`)
  writeFileSync(join(RA, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg  ${w}×${h}@${dpr}  ${(buf.length / 1024).toFixed(0)} KB  q${q + 6}`)
  await ctx.close()
}
await trinh.close(); may.close()
console.log(soat.length ? `\nSOÁT: ${soat.length} điểm\n` + soat.join('\n') : `\nSOÁT: 0 lỗi trang · 0 tràn · 0 nút nhỏ hơn mức (thầy 44 px, máy em 48 px)`)
if (soat.length) process.exitCode = 1
