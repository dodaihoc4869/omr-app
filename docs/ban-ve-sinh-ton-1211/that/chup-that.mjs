// Chụp BẢN THẬT của trò «Sinh Tồn» (TroSinhTon.tsx + lớp máy chủ thật) bằng Chromium: trước đó chạy `npx vite --port 5199 --strictPort`.
//   node docs/ban-ve-sinh-ton-1211/that/chup-that.mjs
// In ra: lỗi trang, lớp phủ đè nhau / tràn, khung hình trung bình. Ảnh JPG đặt cạnh tệp này.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const GOC = process.env.GOC || 'http://localhost:5199/docs/ban-ve-sinh-ton-1211/that/'
const DS = [
  ['em-844', '?ban=5', 844, 390, 'choi'], ['em-667', '?ban=5', 667, 375, 'choi'], ['em-1180', '?ban=5', 1180, 820, 'choi'],
  ['em-cham-844', '?ban=2', 844, 390, 'cham'], ['thay-940', '?xem=1&ban=6', 940, 590, 'xem'], ['em-dong-844', '?ban=39', 844, 390, 'choi'],
]
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
let loi = 0
for (const [ten, q, w, h, kieu] of DS) {
  const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true })
  p.on('pageerror', (e) => { loi++; console.log('LỖI TRANG', ten, e.message) })
  p.on('console', (m) => { if (m.type() === 'error') { loi++; console.log('LỖI CONSOLE', ten, m.text().slice(0, 200)) } })
  await p.goto(GOC + q)
  await p.waitForSelector('.gl-san')
  await p.waitForTimeout(1500)
  if (kieu === 'choi') {
    // Vuốt chéo về phía giữa sân rồi giữ: bé ma chạy, gặp đối thủ thì súng tự bắn.
    await p.mouse.move(w * 0.3, h * 0.6); await p.mouse.down(); await p.mouse.move(w * 0.3 + 40, h * 0.6 + 28, { steps: 4 })
    await p.waitForTimeout(4200); await p.mouse.up()
    await p.waitForTimeout(2500)
  } else if (kieu === 'cham') {
    await p.mouse.click(w * 0.78, h * 0.72)
    await p.waitForTimeout(600)
  } else await p.waitForTimeout(5000)
  const soat = await p.evaluate(async () => {
    const kq = []
    const lop = [...document.querySelectorAll('.st-bang, .st-tin, .st-bao, .st-sung, .st-cho, .st-bd')].filter((e) => e.getBoundingClientRect().width > 0)
    for (const e of lop) { const r = e.getBoundingClientRect(); if (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1) kq.push('TRÀN ' + e.className) }
    for (let i = 0; i < lop.length; i++) for (let j = i + 1; j < lop.length; j++) {
      const a = lop[i].getBoundingClientRect(), c = lop[j].getBoundingClientRect()
      if (a.left < c.right && c.left < a.right && a.top < c.bottom && c.top < a.bottom) kq.push(`ĐÈ ${lop[i].className} × ${lop[j].className}`)
    }
    const kh = await new Promise((xong) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else xong(n) }; requestAnimationFrame(f) })
    kq.push(`${kh} khung/giây`)
    return kq
  })
  await p.screenshot({ path: join(thuMuc, `that-${ten}.jpg`), type: 'jpeg', quality: 62 })
  console.log(`that-${ten}.jpg`, soat.join(' | '))
  await p.close()
}
await b.close()
console.log('lỗi trang:', loi)
