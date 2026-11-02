#!/usr/bin/env node
// CHỤP APP THẬT · HỆ KÍNH (thầy 02/11 «Build xong hết chụp ảnh app thật ở mọi lớp cho tôi xem»): component THẬT + máy chủ GIẢ (trang.tsx), Chromium thật.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <dist>
//   node scripts/chup-v2/chup-kinh.mjs <dist> <thư mục ảnh> [lọc tên,…]   (KHO=doc,ngang,fold,fold-gap,may-tinh · NEN=sang,toi)
// Mỗi ảnh: JPG ≤ 150 KB. In mỗi ảnh: lỗi trang · tràn ngang · đích chạm < 44 px · chữ kém tương phản (≥ 4,5 chữ thường, ≥ 3 chữ to/đậm trên nút) — đo trên nền đặc.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup'), RA = resolve(process.argv[3] ?? 'anh-kinh')
const LOC = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html`
const KHO = [['doc', 390, 844], ['ngang', 844, 390], ['fold', 904, 690], ['fold-gap', 360, 800], ['may-tinh', 1440, 900]]
const chonKho = (process.env.KHO ?? '').split(',').filter(Boolean), chonNen = (process.env.NEN ?? 'sang,toi').split(',')
// [tên, tham số trang, việc trước khi chụp: 'bam:<css>' | 'cho:<ms>' (nối bằng |), dài (chụp cả trang)]
export const CANH = [
  ['hom-nay', 'man=hs-mot&dd=khong', '', true],
  ['hom-nay-diem-danh', 'man=hs-mot&dd=mo', '', true],
  ['hom-nay-du', 'man=hs-mot&tt=du&dd=khong', '', true],
  ['hom-nay-ca', 'man=hs-mot&tt=ca&dd=khong', '', true],
  ['hom-nay-kiem-tra', 'man=hs-mot&kt=khoa&dd=khong', '', true],
  ['them', 'man=hs-mot&dd=mo', 'bam:.kb-thanh .tr-menu-cham|cho:400', false],
]
const exe = existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined
const trinh = await chromium.launch({ executablePath: exe })
const tong = { loi: 0, tran: 0, nho: 0, kem: 0, anh: 0 }
for (const [ten, ts, viec, dai] of CANH) {
  if (LOC.length && !LOC.some((l) => ten.startsWith(l))) continue
  for (const [k, w, h] of KHO) {
    if (chonKho.length && !chonKho.includes(k)) continue
    for (const nen of ['sang', 'toi']) {
      if (!chonNen.includes(nen)) continue
      const p = await trinh.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: w > 1000 ? 1 : 2, colorScheme: nen === 'toi' ? 'dark' : 'light' })
      const loi = []
      p.on('pageerror', (e) => loi.push(String(e).slice(0, 120)))
      await p.route(/^https?:\/\/(?!127\.0\.0\.1)/, (r) => r.abort())
      await p.goto(`${goc}?${ts}`)
      await p.waitForTimeout(1600)
      for (const b of viec.split('|').filter(Boolean)) {
        const [lenh, ...x] = b.split(':'), v = x.join(':')
        if (lenh === 'bam') await p.locator(v).first().click({ timeout: 3000 }).catch((e) => loi.push('bấm hỏng ' + v + ' ' + String(e).slice(0, 60)))
        if (lenh === 'cho') await p.waitForTimeout(Number(v))
      }
      await p.waitForTimeout(500)
      const kq = await p.evaluate(() => {
        const hien = (e) => { const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05 }
        const tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
        const nho = [...document.querySelectorAll('button, a[href], [role=button], [role=switch], input:not([type=hidden])')]
          .filter((e) => hien(e) && !e.closest('[aria-hidden=true],[inert]') && (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5))
          .map((e) => (e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 28))
        const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
        const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
        const tron = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
        const nen = (e) => { const ds = []; for (let x = e; x; x = x.parentElement) { const c = rgba(getComputedStyle(x).backgroundColor); if (c[3] > 0) ds.push(c); if (c[3] >= 0.99) break }
          let n = ds.length && ds[ds.length - 1][3] >= 0.99 ? ds.pop() : rgba(getComputedStyle(document.body).backgroundColor); for (let i = ds.length - 1; i >= 0; i--) n = tron(ds[i], n); return n }
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }, L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
        const tp = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
        const mo = (e) => { let o = 1; for (let x = e; x; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o }
        const kem = []
        for (const e of document.querySelectorAll('body *')) {
          if (!hien(e) || e.closest('svg, [aria-hidden=true], [disabled], .sr-only, [inert]') || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
          const r = e.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight * 3) continue
          const cs = getComputedStyle(e), b = nen(e), c = rgba(cs.color); c[3] *= mo(e)
          const px = parseFloat(cs.fontSize), dam = +cs.fontWeight >= 700, to = px >= 24 || (px >= 18.66 && dam) || (!!e.closest('button, [role=button], .chip, [class*=dem], [class*=cham]') && dam)
          const t = tp(tron(c, b), b)
          if (t < (to ? 3 : 4.5) - 0.01) kem.push(`${e.textContent.trim().slice(0, 22)}=${t.toFixed(2)}`)
        }
        return { tran, nho, kem, cao: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) }
      })
      // chụp cả trang trên khổ dọc: thanh nổi (fixed) chuyển xuống ĐÁY trang để không nằm giữa ảnh; khổ rộng chụp đúng khung nhìn (ray trái cố định)
      const dai2 = dai && w < 700
      if (dai2) await p.addStyleTag({ content: 'body{position:relative} html[data-trong] .tr-menu-ray.kb-thanh{position:absolute!important;bottom:14px!important;top:auto!important}' })
      const ra = join(RA, `${ten}-${k}-${nen}.jpg`)
      let q = 72
      const chup = () => p.screenshot({ path: ra, type: 'jpeg', quality: q, fullPage: dai2 })
      await chup()
      while (statSync(ra).size > 150 * 1024 && q > 34) { q -= 8; await chup() }
      tong.anh++; tong.loi += loi.length; tong.tran += kq.tran > 1 ? 1 : 0; tong.nho += kq.nho.length; tong.kem += kq.kem.length
      const ok = !loi.length && kq.tran <= 1 && !kq.nho.length && !kq.kem.length
      console.log(`${ok ? '✓' : '✗'} ${ten}-${k}-${nen} · lỗi ${loi.length}${loi.length ? ' ' + loi[0] : ''} · tràn ${kq.tran} · nhỏ ${kq.nho.length}${kq.nho.length ? ' ' + JSON.stringify(kq.nho.slice(0, 3)) : ''} · kém ${kq.kem.length}${kq.kem.length ? ' ' + JSON.stringify(kq.kem.slice(0, 3)) : ''} · ${Math.round(statSync(ra).size / 1024)} KB`)
      await p.close()
    }
  }
}
console.log('TỔNG', JSON.stringify(tong))
await trinh.close(); may.close()
