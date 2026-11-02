#!/usr/bin/env node
// CHỤP BẢN VẼ GIAO DIỆN v2 (02/11) — Chromium thật, JPG ≤ 150 KB, video webm (Playwright recordVideo 390×844).
//   node docs/ban-ve-giao-dien-v2-0211/dung.mjs <@phosphor-icons/core/assets>      # (một lần) Mol + biểu tượng ⇒ tai-san.js
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist-chup>   # (cho ảnh «trước») bản app hiện tại, dữ liệu giả
//   TRUOC=<dist-chup> node docs/ban-ve-giao-dien-v2-0211/chup.mjs                  # CHI=cau-chon,video… để chụp riêng vài ảnh
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright'
import sharp from 'sharp'

const DAY = import.meta.dirname
const ANH = join(DAY, 'anh')
const GOC = resolve(DAY, '../..')
const TAM = join(process.env.TAM_DIR || tmpdir(), 'ban-ve-v2-tam')
mkdirSync(ANH, { recursive: true }); mkdirSync(TAM, { recursive: true })
const CHI = process.env.CHI ? process.env.CHI.split(',') : null
const lam = (ten) => !CHI || CHI.includes(ten)
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.json': 'application/json', '.webp': 'image/webp' }
function phucVu(thuMuc, duPhong) {
  return createServer((req, res) => {
    const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    let p = duong.startsWith('/tam/') ? join(TAM, duong.slice(5)) : join(thuMuc, duong)
    if (!(existsSync(p) && statSync(p).isFile())) {
      const pub = join(GOC, 'public', duong)
      p = duPhong && existsSync(pub) && statSync(pub).isFile() ? pub : duPhong ? join(thuMuc, duPhong) : ''
    }
    if (!p || !existsSync(p)) { res.writeHead(404); res.end(); return }
    res.writeHead(200, { 'content-type': LOAI[extname(p)] ?? 'application/octet-stream' })
    res.end(readFileSync(p))
  }).listen(0)
}
const may = phucVu(DAY)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

/** Lưu JPG ≤ 150 KB: ưu tiên GIỮ CỠ (chữ đọc được) — hạ chất lượng tới 52 (màu đủ 4:4:4 rồi 4:2:0) rồi mới thu nhỏ 8 %. */
async function luuJpg(png, ten, rongToiDa, qSan = 52) {
  if (process.env.GIU_PNG) writeFileSync(join(TAM, `${ten}.png`), png)
  const meta = await sharp(png).metadata()
  let rong = Math.min(meta.width, rongToiDa ?? meta.width), q = 82, buf
  for (;;) {
    buf = await sharp(png).resize({ width: rong }).jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer()
    if (buf.length <= 150_000) break
    buf = await sharp(png).resize({ width: rong }).jpeg({ quality: q, mozjpeg: true }).toBuffer() // 4:2:0 trước khi hạ chất lượng
    if (buf.length <= 150_000) break
    if (q - 4 >= qSan) q -= 4; else { rong = Math.round(rong * 0.92); q = 70 }
  }
  writeFileSync(join(ANH, `${ten}.jpg`), buf)
  console.log(`${ten}.jpg`.padEnd(32), `${(buf.length / 1024).toFixed(0)} KB · ${rong}px · q${q}`)
}
async function moTrang(w, h, toi = false, dpr = 2) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, colorScheme: toi ? 'dark' : 'light', hasTouch: w < 1000, isMobile: w < 1000 })
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message)); t.on('console', (m) => m.type() === 'error' && loi.push(m.text()))
  return { ctx, t, loi }
}
/** Soát bố cục: tràn ngang, cuộn dọc, đích chạm < 44 px, chữ < 12 px (B5, B3, C9). */
async function soat(t, ten) {
  const s = await t.evaluate(() => {
    const vw = innerWidth
    const nhin = [...document.querySelectorAll('body *')].filter((e) => e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden')
    const tran = nhin.filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && (b.right > vw + 0.5 || b.left < -0.5) && !e.closest('.v2-kq:not([data-mo])') && !e.closest('.v2-hat') }).length
    const cham = [...document.querySelectorAll('button')].filter((b) => b.offsetParent && !b.closest('.v2-kq:not([data-mo])')).filter((b) => { const r = b.getBoundingClientRect(); return r.width < 44 || r.height < 44 }).map((b) => b.textContent.trim().slice(0, 12) || b.getAttribute('aria-label'))
    const nho = nhin.filter((e) => e.childNodes.length && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(e).fontSize) < 12 && !e.closest('svg, sub, sup')).length
    const than = document.querySelector('.man-than')
    const cuon = than ? than.scrollHeight - than.clientHeight : 0
    return { tran, cham, nho, cuon }
  })
  console.log('  soát', ten, `tràn ${s.tran} · cuộn ${s.cuon}px · đích < 44: ${s.cham.length ? s.cham.join('|') : 0} · chữ < 12 px: ${s.nho}`)
}
async function chupMan(ten, q, w, h, { toi = false, dpr = 2, rong } = {}) {
  const { ctx, t, loi } = await moTrang(w, h, toi, dpr)
  await t.goto(`${goc}/man.html?${q}`); await t.evaluate(() => document.fonts.ready); await cho(900)
  await soat(t, ten)
  await luuJpg(await t.screenshot({ type: 'png' }), ten, rong)
  if (loi.length) console.log('  LỖI TRANG', loi.slice(0, 3).join(' | '))
  await ctx.close()
}

if (lam('cau-chon')) await chupMan('cau-chon-390-sang', 'cau=ester&chon=1&p=33', 390, 844)
if (lam('cau-dung')) await chupMan('cau-dung-390-sang', 'cau=ester&chon=1&tt=dung&p=50&nt=14&lien=2', 390, 844)
if (lam('cau-sai')) await chupMan('cau-sai-390-sang', 'cau=amine&chon=2&tt=sai&p=67&nt=15', 390, 844)
if (lam('tra-loi-ngan')) await chupMan('tra-loi-ngan-390-sang', 'cau=tln&so=8,2&p=67&nt=16', 390, 844)
if (lam('cau-chon-toi')) await chupMan('cau-chon-390-toi', 'cau=ester&chon=1&p=33', 390, 844, { toi: true })
if (lam('de-dai')) await chupMan('de-dai-zfold-904-sang', 'cau=dai&chon=0&p=83&nt=18&bo=hai-cot', 904, 690, { dpr: 1.6 })
if (lam('may-tinh')) await chupMan('may-tinh-1440-sang', 'cau=ester&chon=1&tt=dung&p=50&nt=14&lien=2&bo=rong', 1440, 900, { dpr: 1.25, rong: 1800 })

if (lam('bo-thanh-phan')) {
  const { ctx, t, loi } = await moTrang(1200, 900, false, 1)
  await t.goto(`${goc}/bo-thanh-phan.html`); await t.evaluate(() => document.fonts.ready); await cho(900)
  await luuJpg(await t.screenshot({ type: 'png', fullPage: true }), 'bo-thanh-phan', 1200)
  if (loi.length) console.log('  LỖI TRANG', loi.slice(0, 3).join(' | '))
  await ctx.close()
}

if (lam('truoc-sau')) {
  // «TRƯỚC»: app hiện tại (bản build chụp scripts/chup-v2, dữ liệu giả) — câu amine, đã chọn phương án C. «SAU»: cùng câu, cùng trạng thái, giao diện v2.
  const DIST = process.env.TRUOC ? resolve(process.env.TRUOC) : ''
  if (!DIST || !existsSync(DIST)) console.log('BỎ truoc-sau: cần TRUOC=<dist-chup> (npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist-chup>)')
  else {
    const mayTruoc = phucVu(DIST, 'scripts/chup-v2/trang.html')
    const gocTruoc = `http://127.0.0.1:${mayTruoc.address().port}`
    const a = await moTrang(390, 844)
    await a.ctx.route((u) => !u.href.startsWith(gocTruoc), (r) => r.abort())
    await a.t.goto(`${gocTruoc}/scripts/chup-v2/trang.html?man=lam13&lam=chang-ngang&tp=1`)
    await a.t.locator('.duo .ht2-lam-de').first().waitFor(); await cho(1400)
    await a.t.locator('.ht2-lam-tn [role=radio]').nth(2).click(); await cho(700)
    writeFileSync(join(TAM, 'truoc.png'), await a.t.screenshot({ type: 'png' }))
    await a.ctx.close(); mayTruoc.close()
    const b = await moTrang(390, 844)
    await b.t.goto(`${goc}/man.html?cau=amine&chon=2&p=0&nt=0`); await b.t.evaluate(() => document.fonts.ready); await cho(900)
    writeFileSync(join(TAM, 'sau.png'), await b.t.screenshot({ type: 'png' }))
    await b.ctx.close()
    const c = await moTrang(860, 1000, false, 1.5)
    await c.t.goto(`${goc}/truoc-sau.html`); await c.t.evaluate(() => document.fonts.ready); await cho(600)
    await luuJpg(await c.t.screenshot({ type: 'png', fullPage: true }), 'truoc-sau-390', 1290)
    await c.ctx.close()
  }
}

if (lam('video')) {
  // ≤ 15 giây: chọn (nút lún) → Kiểm tra → ĐÚNG (nảy + Mol khen, thanh tiến độ chạy) → Tiếp tục → câu sau → chọn SAI (rung + Mol buồn).
  const thu = join(TAM, 'video'); rmSync(thu, { recursive: true, force: true }); mkdirSync(thu, { recursive: true })
  const ctx = await trinh.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: false, recordVideo: { dir: thu, size: { width: 390, height: 844 } } })
  const t = await ctx.newPage()
  await t.goto(`${goc}/man.html?cau=ester&tiep=amine&p=17&nt=12&lien=2`); await t.evaluate(() => document.fonts.ready); await cho(1300)
  const bam = async (sel, giu = 170) => { const b = t.locator(sel).first().boundingBox(); const r = await b; await t.mouse.move(r.x + r.width / 2, r.y + r.height / 2, { steps: 6 }); await t.mouse.down(); await cho(giu); await t.mouse.up() }
  await bam('.v2-pa[data-i="0"]'); await cho(550)
  await bam('.v2-pa[data-i="1"]'); await cho(800)
  await bam('#kiem'); await cho(2300)
  await bam('#tiep'); await cho(1300)
  await bam('.v2-pa[data-i="2"]'); await cho(800)
  await bam('#kiem'); await cho(2600)
  const v = t.video(); await ctx.close()
  const p = await v.path(); const dich = join(ANH, 'hieu-ung.webm'); renameSync(p, dich)
  console.log('hieu-ung.webm'.padEnd(32), `${(statSync(dich).size / 1024).toFixed(0)} KB`)
}
await trinh.close(); may.close()
