#!/usr/bin/env node
// BỘ THỬ THANH CHỌN BÚT GỌN + HÚT MÉP + TỰ MỜ (thầy 12/11: «thanh chọn bút làm cho nhỏ gọn lại tinh tế đẹp hơn và có nam châm hút vào mép các cạnh của màn
// hình tự động mờ di vào mới sáng. Tối ưu diện tích hiển thị nhé.»). Chromium THẬT, tờ chiếu THẬT có cầu nối (?vai=thay&noi=1) + phòng THẬT trong Node
// (may-chu.mjs), dữ liệu giả. Mã: src/lib/but-thanh-hut-to-chieu.ts.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-thanh-but-1211.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-moi-1211]
// Đi: bật bút (B) ⇒ thanh ở mép trên, đích bấm ≥ 32 px · để yên ⇒ mờ · rê vào ⇒ sáng · kéo thả gần mép phải ⇒ dính phải, xếp dọc, nhớ ·
// bấm màu + vẽ một nét vẫn ra nét · tải lại trang ⇒ vẫn mép phải · mép dưới nằm trên thanh đáy · mép trái · thu nhỏ cửa sổ ⇒ kẹp trong màn ·
// giảm chuyển động ⇒ không trượt · B tắt bút · 0 lỗi trang. Ảnh that-but-*.jpg (JPG ≤ 150 KB).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-moi-1211'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = []
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + (typeof them === 'string' ? them : JSON.stringify(them)) : ''}`) }
const W = 1366, H = 768
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const may = await moMayChu({ dist: DIST })
const ctx = await trinh.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, permissions: ['microphone'] })
await ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
const thay = await ctx.newPage()
thay.on('pageerror', (e) => loiTrang.push(e.message))
const to = thay.frameLocator('iframe')
let gx = 0, gy = 0 // góc khung tờ trong trang (toạ độ chuột của trang = toạ độ tờ + góc này)

async function moTrang() {
  await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay&noi=1`)
  await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
  const o = await thay.locator('iframe').boundingBox(); gx = o.x; gy = o.y
  await ngu(500)
  // bấm một cái vào tờ để bàn phím vào khung tờ (không thì phím B rơi ở trang ngoài)
  await thay.mouse.click(gx + Math.round(W * 0.3), gy + Math.round(H * 0.4)); await ngu(200)
}
const phim = (k) => to.locator('body').press(k)
/** Số đo thanh bút + các nút (toạ độ tờ). */
const do1 = () => to.locator('body').evaluate(() => {
  const t = document.querySelector('.mc-but-cu'), r = t.getBoundingClientRect(), s = getComputedStyle(t), day = document.getElementById('mc-thanh').getBoundingClientRect()
  const nut = [...t.querySelectorAll('button')].map((b) => { const q = b.getBoundingClientRect(); return [Math.round(q.left * 10) / 10, Math.round(q.top * 10) / 10, Math.round(q.width * 10) / 10, Math.round(q.height * 10) / 10] })
  let nho = null; try { nho = localStorage.getItem('ddh.but.thanh') } catch { /* không có bộ nhớ */ }
  return {
    hien: s.display !== 'none', mep: t.getAttribute('data-mep'), mo: +(+s.opacity).toFixed(2), huong: s.flexDirection, sang: t.classList.contains('mc-sang'), chuyen: s.transitionDuration,
    x: Math.round(r.left * 10) / 10, y: Math.round(r.top * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, phai: Math.round(r.right * 10) / 10, duoi: Math.round(r.bottom * 10) / 10,
    nut, nutNho: Math.min(...nut.map((n) => Math.min(n[2], n[3]))), soNut: nut.length, chu: t.textContent.trim(), nho, dayTren: Math.round(day.top * 10) / 10, W: innerWidth, H: innerHeight,
    chon: (t.querySelector('.mc-m.mc-chon') || { getAttribute: () => '' }).getAttribute('aria-label'), net: window.__mcBut.xuat().net.length,
  }
})
const re = (x, y, buoc = 6) => thay.mouse.move(gx + x, gy + y, { steps: buoc })
/** Nắm vùng chấm ở đầu thanh rồi kéo tới (x, y) của tờ, thả. */
async function keoToi(x, y) {
  const d = await do1(), doc = d.huong === 'column'
  await re(doc ? d.x + d.w / 2 : d.x + 9, doc ? d.y + 9 : d.y + d.h / 2); await ngu(200)
  await thay.mouse.down(); await re(x, y, 14); await ngu(60); await thay.mouse.up(); await ngu(450)
  return do1()
}
async function chup(ten) {
  let q = 88, ra
  do { ra = await thay.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (ra.length > 150 * 1024 && q > 30)
  writeFileSync(join(ANH, ten), ra); console.log(`  ảnh ${ten} ${Math.round(ra.length / 1024)} KB`)
}
/** Số điểm ảnh có mực trên lớp hiện mực của bút. */
const mucTrenLop = () => to.locator('body').evaluate(() => { const c = document.querySelector('canvas.mc-but:not(.mc-but-song)'), g = c.getContext('2d'), a = g.getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i]) n++; return n })

try {
  // 1 · bật bút: mặc định mép trên
  await moTrang()
  await thay.evaluate(() => { try { localStorage.removeItem('ddh.but.thanh') } catch { /* bỏ qua */ } })
  await moTrang()
  let d = await do1()
  kiem('bút tắt ⇒ thanh không hiện', !d.hien)
  await re(W / 2, H / 2); await phim('b'); await ngu(250)
  d = await do1()
  kiem('B bật bút ⇒ thanh hiện ở mép TRÊN, vừa bật thì sáng', d.hien && d.mep === 'tren' && d.huong === 'row' && d.sang && d.mo >= 0.95 && Math.abs(d.y - 6) <= 1, { mep: d.mep, y: d.y, mo: d.mo })
  kiem('bút giữ nguyên: 14 nút (5 màu · 4 cỡ · tẩy · hoàn tác · làm lại · xoá hết · tắt), không còn chữ thừa', d.soNut === 14 && d.chu === '', `chữ «${d.chu}»`)
  kiem('mọi đích bấm ≥ 32 px', d.nutNho >= 32, `nhỏ nhất ${d.nutNho} px`)
  kiem('thanh gọn: dài ≤ 500 px, dày ≤ 34 px (bản cũ đo được 568 × 37, đích bấm 24–27 px)', d.w <= 500 && d.h <= 34, `${d.w} × ${d.h}`)
  kiem('thanh nằm trọn trong màn', d.x >= 0 && d.phai <= W && d.y >= 0)
  const macDinh = d
  await re(d.x + d.w / 2, d.y + d.h / 2); await ngu(300)
  await chup('that-but-mep-tren-1366.jpg')

  // 2 · tự mờ / sáng
  await re(W / 2, H / 2); await ngu(1700)
  d = await do1()
  kiem('để yên 1,5 giây ⇒ mờ (≤ 0,4) và lùi sát mép trên', d.mo <= 0.4 && !d.sang && d.y <= 0.5, { mo: d.mo, y: d.y })
  await chup('that-but-mo-1366.jpg')
  await re(macDinh.x + macDinh.w / 2, macDinh.y + macDinh.h + 18); await ngu(350)
  d = await do1()
  kiem('con trỏ vào vùng 24 px quanh thanh ⇒ sáng (≥ 0,95)', d.mo >= 0.95 && d.sang, { mo: d.mo })
  await re(macDinh.x + macDinh.w / 2, macDinh.y + macDinh.h / 2); await ngu(200)
  d = await do1()
  kiem('con trỏ trên thanh ⇒ sáng (≥ 0,95)', d.mo >= 0.95, { mo: d.mo })

  // 3 · kéo thả gần mép phải ⇒ dính phải, xếp dọc, nhớ
  d = await keoToi(W - 52, 300)
  kiem('kéo thả gần mép phải ⇒ dính mép PHẢI, xếp DỌC, cách mép 6 px', d.mep === 'phai' && d.huong === 'column' && d.h > d.w && Math.abs(W - d.phai - 6) <= 1, { mep: d.mep, x: d.x, y: d.y, w: d.w, h: d.h })
  kiem('giữ chỗ dọc theo mép (tâm thanh quanh chỗ thả) và nằm trên thanh đáy', Math.abs(d.y + d.h / 2 - 300) <= 60 && d.duoi <= d.dayTren - 5, { tam: d.y + d.h / 2, duoi: d.duoi, dayTren: d.dayTren })
  kiem('nhớ vào localStorage ddh.but.thanh', /^phai:0\.\d+$/.test(d.nho || ''), d.nho)
  kiem('xếp dọc: mọi đích bấm vẫn ≥ 32 px, thanh dày ≤ 34 px', d.nutNho >= 32 && d.w <= 34, `${d.w} × ${d.h}, nút nhỏ nhất ${d.nutNho}`)
  const phai = d
  await re(d.x + d.w / 2, d.y + 9); await ngu(300)
  await chup('that-but-mep-phai-1366.jpg')

  // 4 · bút vẫn chạy: bấm màu, vẽ một nét
  await to.locator('.mc-but-cu .mc-m[aria-label="Phấn vàng"]').click(); await ngu(150)
  d = await do1()
  kiem('bấm «Phấn vàng» trên thanh dọc ⇒ đổi màu, thanh đứng yên', d.chon === 'Phấn vàng' && d.x === phai.x && d.y === phai.y, { chon: d.chon })
  const mucTruoc = await mucTrenLop()
  await re(W * 0.72, H * 0.42); await thay.mouse.down(); await re(W * 0.8, H * 0.5, 20); await re(W * 0.74, H * 0.58, 20); await thay.mouse.up(); await ngu(400)
  d = await do1()
  const mucSau = await mucTrenLop()
  kiem('vẽ một nét ⇒ có nét trong sổ + có điểm ảnh mực trên canvas', d.net === 1 && mucSau > mucTruoc + 50, { net: d.net, mucTruoc, mucSau })
  await phim('Control+z'); await ngu(200)
  kiem('Ctrl + Z vẫn hoàn tác', (await do1()).net === 0)
  await phim('Control+y'); await ngu(200)

  // 5 · tải lại trang ⇒ vẫn ở mép phải
  await moTrang(); await phim('b'); await ngu(300)
  d = await do1()
  kiem('tải lại trang ⇒ thanh vẫn ở mép PHẢI, đúng chỗ cũ', d.mep === 'phai' && d.huong === 'column' && Math.abs(d.x - phai.x) <= 1 && Math.abs(d.y - phai.y) <= 2, { x: d.x, y: d.y, cu: [phai.x, phai.y] })

  // 6 · mép dưới (trên thanh đáy), mép trái, kẹp khi thu nhỏ cửa sổ
  d = await keoToi(W * 0.4, H - 90)
  kiem('kéo thả gần đáy ⇒ dính mép DƯỚI, xếp ngang, nằm ngay trên thanh đáy', d.mep === 'duoi' && d.huong === 'row' && d.duoi <= d.dayTren - 5 && d.duoi >= d.dayTren - 8, { duoi: d.duoi, dayTren: d.dayTren })
  d = await keoToi(40, 330)
  kiem('kéo thả gần mép trái ⇒ dính mép TRÁI, xếp dọc, cách mép 6 px', d.mep === 'trai' && d.huong === 'column' && Math.abs(d.x - 6) <= 1, { x: d.x, y: d.y })
  d = await keoToi(W - 40, H - 120)
  await thay.setViewportSize({ width: 1024, height: 620 }); await ngu(900)
  d = await do1()
  kiem('thu nhỏ cửa sổ (1024 × 620) ⇒ thanh (đang nghỉ, sát mép phải) kẹp lại trong màn, trên thanh đáy', d.mep === 'phai' && d.phai <= d.W + 0.5 && d.x >= d.W - 37 && d.y >= 5 && (d.duoi <= d.dayTren - 5 || d.y <= 7), { x: d.x, y: d.y, duoi: d.duoi, dayTren: d.dayTren, W: d.W, H: d.H })
  await thay.setViewportSize({ width: W, height: H }); await ngu(900)
  const o = await thay.locator('iframe').boundingBox(); gx = o.x; gy = o.y

  // 7 · bấm nhẹ (nhích < 4 px) lên nút không bị nuốt; kéo về giữa mép trên
  d = await do1()
  const nutTay = d.nut[9]
  await re(nutTay[0] + nutTay[2] / 2, nutTay[1] + nutTay[3] / 2); await thay.mouse.down(); await re(nutTay[0] + nutTay[2] / 2 + 2, nutTay[1] + nutTay[3] / 2 + 1, 2); await thay.mouse.up(); await ngu(200)
  kiem('bấm nút «Tẩy» có nhích 2 px ⇒ vẫn là bấm (tẩy bật), thanh không dời', await to.locator('.mc-but-cu [data-tay].mc-chon').count() === 1 && (await do1()).mep === 'phai')
  await phim('e'); await ngu(150)
  kiem('phím E đổi lại bút', await to.locator('.mc-but-cu [data-tay].mc-chon').count() === 0)
  d = await keoToi(W / 2, 40)
  kiem('kéo về giữa mép trên ⇒ dính mép TRÊN, xếp ngang, gần giữa màn', d.mep === 'tren' && d.huong === 'row' && Math.abs(d.x + d.w / 2 - W / 2) <= 30 && Math.abs(d.y - 6) <= 1, { x: d.x, y: d.y })

  // 8 · giảm chuyển động + tắt bút
  await thay.emulateMedia({ reducedMotion: 'reduce' }); await ngu(150)
  d = await do1()
  kiem('prefers-reduced-motion ⇒ không trượt (thời gian chuyển 0 giây)', d.chuyen.split(',').every((x) => parseFloat(x) <= 0.001), d.chuyen)
  await thay.emulateMedia({ reducedMotion: 'no-preference' })
  await re(W / 2, H / 2); await phim('b'); await ngu(250)
  kiem('B tắt bút ⇒ thanh ẩn', !(await do1()).hien)
  kiem('0 lỗi trang', loiTrang.length === 0, loiTrang.join(' | '))
} catch (e) {
  kiem('bộ thử chạy hết', false, String(e && e.stack || e))
} finally {
  await thay.evaluate(() => { try { localStorage.removeItem('ddh.but.thanh') } catch { /* bỏ qua */ } }).catch(() => {})
  await trinh.close(); await may.dong?.()
}
const hong = ket.filter((k) => !k.dat)
console.log(`\n${ket.length - hong.length}/${ket.length} kiểm đạt${hong.length ? ' — HỎNG: ' + hong.map((k) => k.ten).join(' · ') : ''}`)
process.exit(hong.length ? 1 : 0)
