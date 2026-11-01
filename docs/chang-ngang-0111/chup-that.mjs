#!/usr/bin/env node
// CHẶNG NGANG v2 01/11 — chụp ở KHUNG NHÌN THẬT (thầy: «chặng xoay ngang trên điện thoại chưa được»; ảnh thầy: Galaxy Z Fold MỞ, chưa xoay ~900×680
// vẫn một cột). Khung (rộng×cao[@DPR][:tai thỏ trái px]):
//   điện thoại ngang (đã trừ thanh trình duyệt / hệ thống): 740×300 · 780×330 · 800×360 · 915×412 (ứng dụng cài toàn màn, tai thỏ trái 32px) · 640×360 · 740×280
//   máy gập mở: 884×760 · 904×690 (tư thế tự nhiên) · 760×884 (mở rồi xoay dọc) — DPR 2,4 · máy tính bảng: 960×600 · 1024×700
//   dọc giữ nguyên: 390×844 (điện thoại) · 360×800 (Fold gập, màn ngoài)
// Màn: chặng (4 kiểu câu, phản hồi, lời giải, kết thúc chặng) · câu mới (Học cách giải / Tự làm câu này → bàn phím số) · Lộ trình · Tự sửa lỗi · sửa câu.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>
//   node docs/chang-ngang-0111/chup-that.mjs <dist> <thư mục ảnh> <tiền tố> — biến môi trường KHO=…, CANH=chang,cau-moi,lo-trinh,tu-chua,sua-cau, TOI=1 (nền tối)
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
import sharp from 'sharp'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2')
const ANH = resolve(process.argv[3] ?? 'docs/chang-ngang-0111')
const TIEN = process.argv[4] ?? 'that-sau'
const TOI = process.env.TOI === '1'
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
const MAC_DINH = '740x300,780x330,800x360,915x412:32,640x360,740x280,884x760@2.4,904x690@2.4,760x884@2.4,960x600@2,1024x700@2'
const KHO = (process.env.KHO ?? MAC_DINH).split(',').map((s) => { const m = /^(\d+)x(\d+)(?:@([\d.]+))?(?::(\d+))?$/.exec(s); return { w: +m[1], h: +m[2], dpr: m[3] ? +m[3] : 2.75, tai: m[4] ? +m[4] : 0 } })
const CANH = (process.env.CANH ?? 'chang,cau-moi,lo-trinh,tu-chua,sua-cau').split(',')
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const so = {}

async function doBoCuc(t) {
  return t.evaluate(() => {
    const vh = innerHeight, vw = innerWidth
    const khung = [...document.querySelectorAll('.fixed.inset-0')].filter((k) => getComputedStyle(k).overflowY === 'auto').pop()
    const nut = [...document.querySelectorAll('.duo-nut, .tp-nut-lon')].filter((n) => n.offsetParent).pop()
    const r = nut?.getBoundingClientRect()
    const trongKhung = (el) => { // phần tử nằm trọn trong khung nhìn VÀ trong khung cuộn gần nhất (không bị cột cuộn che)
      const b = el.getBoundingClientRect(); if (b.top < -0.5 || b.bottom > vh + 0.5) return false
      for (let e = el.parentElement; e; e = e.parentElement) { const o = getComputedStyle(e).overflowY; if (o === 'auto' || o === 'scroll') { const k = e.getBoundingClientRect(); return b.top >= k.top - 0.5 && b.bottom <= k.bottom + 0.5 } }
      return true
    }
    const phim = [...document.querySelectorAll('.ht2-lam-phim button')]
    const de = document.querySelector('.duo-cot-de')
    return {
      trangCuon: khung ? khung.scrollHeight - khung.clientHeight : document.scrollingElement.scrollHeight - document.scrollingElement.clientHeight,
      nut: r ? { chu: nut.textContent?.trim().slice(0, 22), trong: r.bottom <= vh + 0.5 && r.top >= 0 } : null,
      phimKhuat: phim.length ? phim.filter((b) => !trongKhung(b)).length : null,
      haiCot: de ? getComputedStyle(de).display !== 'contents' : null,
      tranNgang: [...document.querySelectorAll('.duo *, .tp-man *')].filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.right > vw + 1 }).length,
    }
  })
}

async function moTrang(k, q) {
  const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dpr, hasTouch: true, isMobile: true, colorScheme: TOI ? 'dark' : 'light' })
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
  await cho(650)
  // ảnh DPR thật quá nặng ⇒ thu về 1,6× khung CSS khi lưu (đủ nét soát chữ), JPG ≤ 150 KB
  const png = await t.screenshot({ type: 'png' })
  const rong = Math.round(k.w * 1.6)
  let q = 62, buf = await sharp(png).resize({ width: rong }).jpeg({ quality: q, mozjpeg: true }).toBuffer()
  while (buf.length > 150_000 && q > 36) { q -= 6; buf = await sharp(png).resize({ width: rong }).jpeg({ quality: q, mozjpeg: true }).toBuffer() }
  writeFileSync(join(ANH, `${ten}.jpg`), buf)
  so[ten] = await doBoCuc(t)
}

for (const k of KHO) {
  const ten = (canh) => `${TIEN}-${k.w}x${k.h}${TOI ? '-toi' : ''}-${canh}`
  const kiemTra = async (t) => { await t.locator('.duo-day:not(.duo-ket) .duo-nut').click(); await t.locator('.duo-ket:not([data-tt=cho])').waitFor() }
  const tiep = async (t) => { await t.locator('.duo-ket .duo-hang-nut .duo-nut').click(); await cho(900) }
  if (CANH.includes('chang')) {
    const { ctx, t, loi } = await moTrang(k, 'man=lam13&lam=chang-ngang&tp=1')
    await t.locator('.duo .ht2-lam-de').first().waitFor(); await cho(1200)
    await chup(t, k, ten('chang-1-trac-nghiem'))
    await t.locator('.ht2-lam-tn [role=radio]').nth(3).click(); await kiemTra(t); await tiep(t)
    await t.getByText('Thuốc tím', { exact: false }).first().waitFor(); await cho(500)
    await chup(t, k, ten('chang-2-de-dai'))
    await t.locator('.ht2-lam-tn [role=radio]').nth(1).click(); await kiemTra(t); await cho(400)
    await chup(t, k, ten('chang-3-phan-hoi'))
    await t.locator('.duo-ct-lg').click(); await t.locator('.duo-lg').waitFor(); await cho(400)
    await chup(t, k, ten('chang-4-loi-giai'))
    await t.locator('.duo-lg .duo-dong').click(); await cho(300); await tiep(t)
    await t.locator('.ht2-lam-ds').first().waitFor(); await cho(300)
    await chup(t, k, ten('chang-5-dung-sai'))
    for (const [i, v] of [[0, 0], [1, 0], [2, 0], [3, 1]]) await t.locator('.ht2-lam-y-nut').nth(i).locator('button').nth(v).click()
    await kiemTra(t); await tiep(t)
    await t.locator('.ht2-lam-phim').first().waitFor(); await cho(300)
    for (const p of ['8', ',', '2']) await t.locator('.ht2-lam-phim button', { hasText: new RegExp(`^${p}$`) }).first().click()
    await chup(t, k, ten('chang-6-tra-loi-ngan'))
    if (!TOI) { await kiemTra(t); await tiep(t); await cho(1600); await chup(t, k, ten('chang-7-ket-thuc')) }
    if (loi.length) console.log('LỖI TRANG', ten('chang'), loi.slice(0, 2).join(' | '))
    await ctx.close()
  }
  if (CANH.includes('cau-moi')) {
    // Gói 7: câu mới của bài ⇒ «Học cách giải» / «Tự làm câu này» (ảnh thầy) rồi bàn phím số
    const { ctx, t, loi } = await moTrang(k, 'man=lam13&lam=g7')
    await t.locator('.duo .ht2-lam-de').first().waitFor(); await cho(1400)
    await chup(t, k, ten('cau-moi-1-chon-cach'))
    await t.getByRole('button', { name: 'Tự làm câu này' }).click(); await t.locator('.ht2-lam-phim').first().waitFor(); await cho(500)
    await chup(t, k, ten('cau-moi-2-tu-lam'))
    if (loi.length) console.log('LỖI TRANG', ten('cau-moi'), loi.slice(0, 2).join(' | '))
    await ctx.close()
  }
  if (CANH.includes('lo-trinh') && !TOI) {
    const { ctx, t, loi } = await moTrang(k, 'man=hs-mot')
    await cho(2600)
    await chup(t, k, ten('lo-trinh'))
    if (loi.length) console.log('LỖI TRANG', ten('lo-trinh'), loi.slice(0, 2).join(' | '))
    await ctx.close()
  }
  if (CANH.includes('tu-chua') && !TOI) {
    const { ctx, t, loi } = await moTrang(k, 'man=hs12-tu-chua')
    await cho(2000)
    await chup(t, k, ten('tu-sua-danh-sach'))
    if (loi.length) console.log('LỖI TRANG', ten('tu-chua'), loi.slice(0, 2).join(' | '))
    await ctx.close()
  }
  if (CANH.includes('sua-cau') && !TOI) {
    for (const de of ['1', '4']) {
      const { ctx, t, loi } = await moTrang(k, `man=duo-sua&de=${de}`)
      await cho(2200)
      await chup(t, k, ten(`sua-cau-${de === '1' ? 'de-hinh' : 'tra-loi-ngan'}`))
      if (loi.length) console.log('LỖI TRANG', ten('sua-cau'), loi.slice(0, 2).join(' | '))
      await ctx.close()
    }
  }
}
writeFileSync(join(ANH, `so-do-${TIEN}${TOI ? '-toi' : ''}.json`), JSON.stringify(so, null, 1))
for (const [ten, s] of Object.entries(so)) console.log(ten.padEnd(50), `${s.haiCot === null ? '' : s.haiCot ? '2 cột · ' : '1 cột · '}cuộn ${String(s.trangCuon).padStart(4)}px · nút ${s.nut ? `${s.nut.trong ? 'TRONG' : 'NGOÀI'} «${s.nut.chu}»` : '—'}${s.phimKhuat ? ` · PHÍM KHUẤT ${s.phimKhuat}` : ''}${s.tranNgang ? ` · TRÀN ${s.tranNgang}` : ''}`)
await trinh.close(); may.close()
