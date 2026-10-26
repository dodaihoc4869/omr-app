#!/usr/bin/env node
// CHỤP + ĐO «Chạm để hiểu đề» / «Gợi ý 3 tầng» / lời giải sơ đồ (26/10) ở 3 khổ (390×844 dọc · 844×390 xoay ngang · 1440×900 máy tính) × sáng/tối.
//   npx vite build --config scripts/chup-goi-y-cham/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/chup-goi-y-cham/chup.mjs <thư mục tạm> docs/anh-goi-y-cham-2610 [cảnh,cảnh…]
// Mỗi ảnh kèm số đo: cuộn ngang, đích chạm < 44 px trong khung nhìn (nút, ô bấm thừa số…), lỗi trang. Ảnh JPG ≤ 150 KB.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-gyc')
const ANH = resolve(process.argv[3] ?? 'docs/anh-goi-y-cham-2610')
const CHON = (process.argv[4] ?? '').split(',').filter(Boolean)
mkdirSync(ANH, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml' }
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/chup-goi-y-cham/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })

const KHUNG = [
  { ten: 'doc', w: 390, h: 844, cham: true },
  { ten: 'ngang', w: 844, h: 390, cham: true },
  { ten: 'may-tinh', w: 1440, h: 900, cham: false },
]
const choTo = (t) => t.locator('.gyc-v').first().waitFor()
const moGoiY = async (t, tang) => {
  await t.getByRole('button', { name: /Bắt đầu từ đâu/ }).click()
  await t.locator('.gyc-tang').first().waitFor()
  for (let i = 1; i < tang; i++) await t.getByRole('button', { name: /Gợi ý tiếp/ }).click()
}
const CANH = [
  { ten: '1-de-to-mau', bai: 'este', lam: null },
  { ten: '2-cham-don-vi', bai: 'este', lam: async (t) => { await t.locator('.gyc-cho', { hasText: '1,5 M' }).click(); await t.locator('.gyc-bong').waitFor() } },
  { ten: '3-cham-chat', bai: 'este', lam: async (t) => { await t.locator('.gyc-chat', { hasText: 'NaOH' }).click(); await t.locator('.gyc-bong').waitFor() } },
  { ten: '3c-cham-tu-then-chot', bai: 'este', lam: async (t) => { await t.locator('.gyc-dam', { hasText: 'Cô cạn' }).click(); await t.locator('.gyc-bong').waitFor() } },
  { ten: '4-goi-y-1', bai: 'este', lam: (t) => moGoiY(t, 1) },
  { ten: '5-goi-y-3', bai: 'este', lam: (t) => moGoiY(t, 3) },
  { ten: '5b-ly-thuyet', bai: 'lythuyet', lam: async (t) => { await t.locator('.gyc-hoi').first().click(); await t.locator('.gyc-bong').waitFor() } },
  { ten: '6-goi-y-ly-thuyet', bai: 'lythuyet', lam: (t) => moGoiY(t, 3) },
  { ten: '7-so-do-xuoi', bai: 'pyrite', lam: async (t) => { await moGoiY(t, 3); await t.getByRole('button', { name: 'Thừa số 4: 2' }).click() } },
  { ten: '7b-tom-tat-can-canh', bai: 'pyrite', lam: async (t) => { await moGoiY(t, 2); await t.locator('.gyc-sd').scrollIntoViewIfNeeded() }, chiPhan: '.gyc-tang:nth-of-type(2), .gyc-goi-y .gyc-tang + .gyc-tang' },
  { ten: '8-so-do-nguoc', bai: 'nguoc', lam: async (t) => { await moGoiY(t, 3); await t.getByRole('button', { name: 'Thừa số 7: 100/80' }).click() } },
  { ten: '9-hien-tuong', bai: 'hcl', lam: async (t) => { await moGoiY(t, 3); await t.getByRole('button', { name: 'Thừa số 2: 0,1' }).click() } },
  { ten: '10-loi-giai-so-do', bai: 'loigiai', cho: (t) => t.getByText('Tóm tắt của thầy Đỗ Đại Học').waitFor(), lam: async (t) => { await t.getByRole('button', { name: 'Thừa số 6: 90/100' }).click() } },
]

const bao = []
for (const c of CANH) {
  if (CHON.length && !CHON.includes(c.ten)) continue
  for (const k of KHUNG) {
    for (const toi of [false, true]) {
      const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: 1, hasTouch: k.cham, isMobile: k.cham, colorScheme: toi ? 'dark' : 'light', reducedMotion: 'reduce' })
      await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
      const t = await ctx.newPage()
      t.setDefaultTimeout(12000)
      const loi = []
      t.on('pageerror', (e) => loi.push(e.message))
      const ten = `${c.ten}-${k.ten}-${toi ? 'toi' : 'sang'}`
      try {
        await t.goto(`${goc}/scripts/chup-goi-y-cham/trang.html?bai=${c.bai}`)
        await (c.cho ?? choTo)(t)
        if (c.lam) await c.lam(t)
        await t.waitForTimeout(350)
        const so = await t.evaluate(() => {
          const W = innerWidth, H = innerHeight
          const ngang = []
          if (document.documentElement.scrollWidth > W + 1) ngang.push(`trang ${document.documentElement.scrollWidth}`)
          for (const el of document.querySelectorAll('.gyc-goi-y, .gyc-bong, .gyc-sd, .gyc-chuoi, .gyc-lgsd')) {
            const r = el.getBoundingClientRect()
            if (r.right > W + 1 || r.left < -1) ngang.push(`${el.className.toString().slice(0, 24)} ${Math.round(r.left)}..${Math.round(r.right)}`)
            if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflowX !== 'hidden') ngang.push(`${el.className.toString().slice(0, 24)} cuộn ${el.scrollWidth}>${el.clientWidth}`)
          }
          const nho = []
          for (const el of document.querySelectorAll('button, a[href], [role=button]')) {
            if (el.classList.contains('gyc-v')) continue // chữ trong đề: vùng chạm nới 10px bằng ::after (bản vẽ), không đo như nút
            const r = el.getBoundingClientRect()
            if (!r.width || !r.height || r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue
            if (getComputedStyle(el).visibility === 'hidden') continue
            if (r.height < 43.5 || r.width < 43.5) nho.push(`${(el.getAttribute('aria-label') || el.textContent || el.tagName).trim().slice(0, 24)} ${Math.round(r.width)}×${Math.round(r.height)}`)
          }
          return { ngang, nho: [...new Set(nho)] }
        })
        const duong = join(ANH, `${ten}.jpg`)
        if (c.chiPhan && k.ten !== 'ngang') {
          const el = t.locator('.gyc-goi-y .gyc-tang').nth(1)
          await el.screenshot({ path: duong, type: 'jpeg', quality: 70 })
        } else await t.screenshot({ path: duong, type: 'jpeg', quality: 60 })
        const kb = Math.round(statSync(duong).size / 1024)
        bao.push(`${ten}: cuộn ngang ${so.ngang.length ? so.ngang.join(' | ') : '0'} · đích nhỏ ${so.nho.length}${so.nho.length ? ' [' + so.nho.slice(0, 6).join('; ') + ']' : ''} · ${kb} KB${loi.length ? ' · LỖI TRANG ' + loi.join(' / ').slice(0, 160) : ''}`)
      } catch (e) {
        await t.screenshot({ path: join(ANH, `${ten}-HONG.jpg`), type: 'jpeg', quality: 50 }).catch(() => {})
        bao.push(`${ten}: HỎNG ${String(e.message).split('\n')[0].slice(0, 200)}${loi.length ? ' · LỖI TRANG ' + loi.join(' / ').slice(0, 200) : ''}`)
      }
      await ctx.close()
    }
  }
}
writeFileSync(join(ANH, 'bao-cao.txt'), bao.join('\n') + '\n')
console.log(bao.join('\n'))
await trinh.close()
may.close()
