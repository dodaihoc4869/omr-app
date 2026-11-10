#!/usr/bin/env node
// CHỤP TRƯỚC / SAU của lượt làm mượt bút (11/11) bằng Chromium THẬT trên TỜ CHIẾU THẬT — cùng một chuỗi chữ nhỏ viết nhanh của thầy
// («Anh yêu em» · «mm mm» · «KMnO4 + H2SO4.»), cùng một dữ liệu mẫu, phát qua đúng đường sự kiện con trỏ của bộ máy (scripts/but-bang-1011/do-trung-thuc.mjs).
//   node scripts/but-bang-1011/chup-muot.mjs --goc=<thư mục chứa src/ + server/src của bản cũ> [--ra=docs/ban-ve-but-1011]
// Ảnh:  6-truoc-sau-60hz.jpg · 6-truoc-sau-200hz.jpg   bút có lực, ba cột: đường tay thật | trước | sau (cận cảnh × 3)
//       7-but-luot-khong-bao-nhac.jpg                  bút lướt giữa các nét mà máy không báo nhấc: trước (dính nét) | sau
//       8-o-do-but.jpg                                 ô đo bút (Alt + B) sau khi viết thật 200 mẫu / giây qua CDP
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { taoTo } from './chup.mjs'
import { baiChuNho, layMau } from './chu-nho.mjs'
import { phatTrongTrang, moTo } from './do-trung-thuc.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const thamSo = Object.fromEntries(process.argv.slice(2).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] ?? true] : [a, true] }))
const RA = resolve(thamSo.ra ?? join(GOC, 'docs/ban-ve-but-1011'))
if (!thamSo.goc) { console.error('thiếu --goc=<thư mục bản cũ>'); process.exit(2) }
mkdirSync(RA, { recursive: true })

const O = { x: 1320, y: 288, width: 176, height: 146 }, PHONG = 3
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const loi = []
const tep = { cu: await taoTo(resolve(thamSo.goc), 'to-cu'), moi: await taoTo(GOC, 'to-moi') }
const bai = baiChuNho()

/** Viết bài vào một bản rồi chụp ô chữ (PNG, × 3). */
async function vietRoiChup(ban, tb, hz) {
  const { ctx, t } = await moTo(trinh, tep[ban], loi, PHONG)
  await t.evaluate(phatTrongTrang, { sk: layMau(bai, hz, tb), hz, doTre: false, veNgay: false, duDoan: false })
  await t.mouse.move(900, 900)
  const anh = await t.screenshot({ type: 'png', clip: O })
  await ctx.close()
  return 'data:image/png;base64,' + anh.toString('base64')
}
/** Ghép các cột (nhãn + ảnh hoặc SVG) thành một ảnh JPG ≤ 150 KB. */
async function ghep(ten, tieuDe, cot) {
  const ctx = await trinh.newContext({ viewport: { width: cot.length * (O.width * PHONG + 16) + 16, height: O.height * PHONG + 96 }, deviceScaleFactor: 1 })
  const t = await ctx.newPage()
  await t.setContent(`<body style="margin:0;background:rgb(15,18,30);color:rgb(244,239,228);font:600 17px system-ui,sans-serif">
<div style="padding:14px 16px 8px;font-size:19px">${tieuDe}</div>
<div style="display:flex;gap:16px;padding:0 16px">${cot.map((c) => `<div><div style="height:30px;color:rgb(255,210,122)">${c.nhan}</div>${c.html}</div>`).join('')}</div></body>`)
  let q = 90, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  writeFileSync(join(RA, ten), buf)
  console.log(`${ten}: ${Math.round(buf.length / 1024)} KB (q${q + 6})`)
  await ctx.close()
}
const anh = (du) => `<img src="${du}" width="${O.width * PHONG}" height="${O.height * PHONG}" style="display:block;border-radius:8px">`
// đường tay thật: nét mảnh 1 px (× 3) trên nền bảng
const that = `<svg width="${O.width * PHONG}" height="${O.height * PHONG}" viewBox="${O.x} ${O.y} ${O.width} ${O.height}" style="display:block;border-radius:8px;background:rgb(22,27,40)">${bai.map((q) => (q.cham ? `<circle cx="${q.d[0][0]}" cy="${q.d[0][1]}" r="0.6" fill="rgb(244,239,228)"/>` : `<polyline fill="none" stroke="rgb(244,239,228)" stroke-width="0.45" stroke-linecap="round" points="${q.d.filter((_, i) => i % 3 === 0).map((p) => p[0].toFixed(2) + ',' + p[1].toFixed(2)).join(' ')}"/>`)).join('')}</svg>`

for (const hz of [60, 200]) {
  await ghep(`6-truoc-sau-${hz}hz.jpg`, `Bút có lực · ${hz} mẫu mỗi giây · chữ cao 15–18 px, viết nhanh · phóng to × 3`, [
    { nhan: 'Đường tay thật đã đi', html: that },
    { nhan: 'TRƯỚC (bản đang sống)', html: anh(await vietRoiChup('cu', 'but', hz)) },
    { nhan: 'SAU', html: anh(await vietRoiChup('moi', 'but', hz)) },
  ])
}
await ghep('7-but-luot-khong-bao-nhac.jpg', 'Bút lướt giữa các nét mà máy không báo nhấc bút (125 mẫu mỗi giây) · phóng to × 3', [
  { nhan: 'Đường tay thật đã đi', html: that },
  { nhan: 'TRƯỚC: các chữ dính nhau', html: anh(await vietRoiChup('cu', 'luot', 125)) },
  { nhan: 'SAU: hết chạm là hết nét', html: anh(await vietRoiChup('moi', 'luot', 125)) },
])

// 8 · ô đo bút: bật Alt + B rồi viết THẬT qua CDP (pointerType pen, 200 mẫu / giây, có lực) ⇒ số trong ô là số máy đo được
{
  const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 2, reducedMotion: 'reduce', locale: 'vi-VN' })
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loi.push(e.message))
  await t.goto('file://' + tep.moi)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  await t.keyboard.press('Alt+b'); await t.waitForTimeout(300)
  const cdp = await ctx.newCDPSession(t)
  const sk = layMau(baiChuNho({ x0: 1330, y0: 300 }), 200, 'but'), cho = []
  const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
  const t0 = performance.now()
  for (const e of sk) {
    for (let con = t0 + e.t - performance.now(); con > 0; con = t0 + e.t - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
    cho.push(cdp.send('Input.dispatchMouseEvent', { type: e.k === 'd' ? 'mousePressed' : e.k === 'u' ? 'mouseReleased' : 'mouseMoved', x: e.x, y: e.y, button: 'left', buttons: e.k === 'u' ? 0 : 1, clickCount: e.k === 'm' ? 0 : 1, pointerType: 'pen', force: e.p }))
  }
  await Promise.all(cho); await t.waitForTimeout(500)
  const o = await t.evaluate(() => { const r = document.querySelector('.mc-but-do').getBoundingClientRect(); return { x: Math.max(0, Math.floor(r.left) - 16), y: Math.floor(r.top) - 16, width: Math.ceil(r.width) + 32, height: Math.ceil(r.height) + 32 } })
  console.log('số đo trong ô:', JSON.stringify(await t.evaluate(() => window.__mcBut.doBut())))
  let q = 90, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q, clip: o }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  writeFileSync(join(RA, '8-o-do-but.jpg'), buf); console.log(`8-o-do-but.jpg: ${Math.round(buf.length / 1024)} KB`)
  // cả tờ có ô đo + chữ vừa viết (để thấy ô nằm ở đâu)
  q = 80
  do { buf = await t.screenshot({ type: 'jpeg', quality: q, scale: 'css' }); q -= 8 } while (buf.length > 150 * 1024 && q > 20)
  writeFileSync(join(RA, '8b-o-do-but-tren-to.jpg'), buf); console.log(`8b-o-do-but-tren-to.jpg: ${Math.round(buf.length / 1024)} KB`)
  await ctx.close()
}
await trinh.close()
if (loi.length) { console.error('LỖI TRANG:', [...new Set(loi)]); process.exit(1) }
