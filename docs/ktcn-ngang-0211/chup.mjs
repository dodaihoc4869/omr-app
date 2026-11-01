#!/usr/bin/env node
// KIỂM TRA ÔN TẬP NGANG 02/11 (thầy: «Kiểm tra ôn tập cũng tối ưu xoay ngang, máy tính và Z Fold nhé»). Component THẬT ManKiemTraCaNhan, máy chủ GIẢ
// (scripts/chup-v2/trang.tsx khối «DUO KIỂM TRA 27/10», `&dai=1` câu 3 đề dài). Mọi trạng thái: trang bài · đang làm (trắc nghiệm, đề dài, đúng–sai,
// trả lời ngắn + bàn phím số) · bảng câu · tấm nộp chặng · kết quả · phần chữa một câu. In số đo: 1/2 cột, trang cuộn, nút chính trong khung, phím số khuất, tràn ngang.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>
//   node docs/ktcn-ngang-0211/chup.mjs <dist> <thư mục ảnh> <tiền tố truoc|sau> — KHO=…, TOI=1 (nền tối), PNG=1 (ảnh PNG + giảm chuyển động, so điểm ảnh)
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2')
const ANH = resolve(process.argv[3] ?? 'docs/ktcn-ngang-0211')
const TIEN = process.argv[4] ?? 'sau'
const TOI = process.env.TOI === '1', PNG = process.env.PNG === '1'
mkdirSync(ANH, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const MAC_DINH = '904x690@2.4,884x760@2.4,760x884@2.4,844x390@2.75,740x300@2.75,915x412@2.75:32,1180x820@2,1440x900@1,1920x1080@1,360x800@3'
const KHO = (process.env.KHO ?? MAC_DINH).split(',').map((s) => { const m = /^(\d+)x(\d+)(?:@([\d.]+))?(?::(\d+))?$/.exec(s); return { w: +m[1], h: +m[2], dpr: m[3] ? +m[3] : 2, tai: m[4] ? +m[4] : 0 } })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const so = {}

async function doBoCuc(t) {
  return t.evaluate(() => {
    const vh = innerHeight, vw = innerWidth
    const khung = [...document.querySelectorAll('.fixed.inset-0, body')].find((k) => k.scrollHeight > k.clientHeight + 1 && getComputedStyle(k).overflowY !== 'visible' && getComputedStyle(k).overflowY !== 'hidden')
    const se = document.scrollingElement
    const nut = [...document.querySelectorAll('.duo-kt-tam .duo-nut, .duo-day .duo-nut, .ktcn-nut-chinh')].filter((n) => n.offsetParent).pop()
    const r = nut?.getBoundingClientRect()
    const trongKhung = (el) => {
      const b = el.getBoundingClientRect(); if (b.top < -0.5 || b.bottom > vh + 0.5) return false
      for (let e = el.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if ((o === 'auto' || o === 'scroll') && e.scrollHeight > e.clientHeight) { const k = e.getBoundingClientRect(); return b.top >= k.top - 0.5 && b.bottom <= k.bottom + 0.5 } }
      return true
    }
    const phim = [...document.querySelectorAll('.ht2-lam-phim button')]
    const de = document.querySelector('.duo-cot-de')
    return {
      trangCuon: Math.max(khung ? khung.scrollHeight - khung.clientHeight : 0, se.scrollHeight - se.clientHeight),
      nut: r ? { chu: nut.textContent?.trim().slice(0, 22), trong: r.bottom <= vh + 0.5 && r.top >= 0 } : null,
      phimKhuat: phim.length ? phim.filter((b) => !trongKhung(b)).length : null,
      haiCot: de ? getComputedStyle(de).display !== 'contents' : document.querySelector('.ktcn-khung, .ktcn-ket') ? getComputedStyle(document.querySelector('.ktcn-ket, .ktcn-khung')).display === 'grid' : null,
      tranNgang: [...document.querySelectorAll('.ht-app *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > vw + 1 && !e.closest('.ct-dai, .bang-cuon, [class*="cuon"]') }).length,
    }
  })
}
async function moTrang(k, q) {
  const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dpr, hasTouch: k.w < 1300, isMobile: k.w < 1300, colorScheme: TOI ? 'dark' : 'light', reducedMotion: PNG ? 'reduce' : 'no-preference' })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(15000)
  if (k.tai) { const cdp = await ctx.newCDPSession(t); await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { left: k.tai, right: 0, top: 0, bottom: 0 } }).catch(() => {}) }
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.goto(`${goc}/scripts/chup-v2/trang.html?${q}`)
  return { ctx, t, loi }
}
async function chup(t, k, ten) {
  await cho(700)
  if (PNG) { await t.screenshot({ path: join(ANH, `${ten}.png`), type: 'png' }); so[ten] = await doBoCuc(t); return }
  const png = await t.screenshot({ type: 'png' })
  const rong = Math.round(k.w * Math.min(1.6, k.dpr))
  let q = 62, buf = await sharp(png).resize({ width: rong }).jpeg({ quality: q, mozjpeg: true }).toBuffer()
  while (buf.length > 150_000 && q > 36) { q -= 6; buf = await sharp(png).resize({ width: rong }).jpeg({ quality: q, mozjpeg: true }).toBuffer() }
  writeFileSync(join(ANH, `${ten}.jpg`), buf)
  so[ten] = await doBoCuc(t)
}

for (const k of KHO) {
  const ten = (canh) => `${TIEN}-${k.w}x${k.h}${TOI ? '-toi' : ''}-${canh}`
  {
    const { ctx, t, loi } = await moTrang(k, 'man=duo-kt&v=ktcn&dai=1')
    await t.getByRole('button', { name: /Làm tiếp chặng 2/ }).waitFor(); await cho(900)
    await chup(t, k, ten('1-trang-bai'))
    await t.getByRole('button', { name: /Làm tiếp chặng 2/ }).click()
    await t.locator('.duo-kt .duo-cot-de').first().waitFor(); await cho(900)
    // về câu 1 (máy nhớ câu đang làm theo bài) rồi đi lần lượt
    for (let i = 0; i < 6 && await t.locator('.duo-kt-truoc:not([disabled])').count(); i++) { await t.locator('.duo-kt-truoc').click(); await cho(150) }
    await chup(t, k, ten('2-lam-trac-nghiem'))
    const tiep = async () => { await t.getByRole('button', { name: 'Câu tiếp' }).click(); await cho(500) }
    await tiep(); await tiep()
    await t.getByText('Thuốc tím', { exact: false }).first().waitFor().catch(() => {}); await cho(400)
    await chup(t, k, ten('3-lam-de-dai'))
    await tiep()
    await chup(t, k, ten('4-lam-dung-sai'))
    await tiep(); await tiep()
    await t.locator('.ht2-lam-phim').first().waitFor(); await cho(300)
    await chup(t, k, ten('5-lam-tra-loi-ngan'))
    await t.locator('.duo-kt-nut-luoi').click(); await t.locator('.duo-kt-tam').first().waitFor(); await cho(400)
    await chup(t, k, ten('6-bang-cau'))
    await t.locator('.duo-kt-tam .duo-dong').first().click(); await cho(300)
    await t.getByRole('button', { name: /^Nộp chặng 2$/ }).last().click(); await t.locator('.duo-kt-nop').first().waitFor().catch(() => {}); await cho(500)
    await chup(t, k, ten('7-nop-chang'))
    if (loi.length) console.log('LỖI TRANG', ten('lam'), loi.slice(0, 2).join(' | '))
    await ctx.close()
  }
  {
    const { ctx, t, loi } = await moTrang(k, 'man=duo-kt&v=ket')
    await t.locator('.ktcn-ket').first().waitFor(); await cho(1200)
    await chup(t, k, ten('8-ket-qua'))
    await t.locator('.ktcn-cau-kq > summary').first().click(); await cho(800)
    await chup(t, k, ten('9-chua-cau'))
    if (loi.length) console.log('LỖI TRANG', ten('ket'), loi.slice(0, 2).join(' | '))
    await ctx.close()
  }
}
writeFileSync(join(ANH, `so-do-${TIEN}${TOI ? '-toi' : ''}.json`), JSON.stringify(so, null, 1))
for (const [ten, s] of Object.entries(so)) console.log(ten.padEnd(44), `${s.haiCot === null ? '' : s.haiCot ? '2 cột · ' : '1 cột · '}cuộn ${String(s.trangCuon).padStart(4)}px · nút ${s.nut ? `${s.nut.trong ? 'TRONG' : 'NGOÀI'} «${s.nut.chu}»` : '—'}${s.phimKhuat ? ` · PHÍM KHUẤT ${s.phimKhuat}` : ''}${s.tranNgang ? ` · TRÀN ${s.tranNgang}` : ''}`)
await trinh.close(); may.close()
