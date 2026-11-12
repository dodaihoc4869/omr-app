// Chụp + SOÁT BẢN THẬT phòng chờ ca có trò «Sinh Tồn bốn đội» bằng Chromium: trước đó chạy `npx vite --port 5199 --strictPort`.
//   CHROMIUM=/usr/bin/google-chrome node docs/ban-ve-sinh-ton-ca-1311/that/chup-that.mjs
// In ra: lỗi trang, số kết nối trước / sau khi bấm «Chơi», cỡ nút, lớp đè nhau / tràn, và (rào chính) thầy bắt đầu ⇒ trò gỡ + «vào bài» đúng một lần.
import { createRequire } from 'node:module'
const { chromium } = createRequire(import.meta.url)(process.env.PLAYWRIGHT_DUONG || 'playwright')
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const thuMuc = dirname(fileURLToPath(import.meta.url))
const GOC = process.env.GOC || 'http://localhost:5199/docs/ban-ve-sinh-ton-ca-1311/that/'
// [tên ảnh, tham số, rộng, cao, kiểu]: `the` = chỉ thẻ sảnh · `choi` = bấm «Chơi» rồi chơi · `batdau` = đang chơi thì thầy bấm Bắt đầu · `tat` = ca không phát vé
const DS = [
  ['the-390', '', 390, 844, 'the'], ['the-390-toi', '?toi=1', 390, 844, 'the'], ['the-1280', '', 1280, 800, 'the'], ['the-tat-390', '?tat=1', 390, 844, 'tat'],
  ['tro-844', '', 844, 390, 'choi'], ['tro-doc-390', '', 390, 844, 'choi'], ['tro-1280', '', 1280, 800, 'choi'],
  ['bat-dau-844', '?batdau=5', 844, 390, 'batdau'],
]
const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
let loi = 0
const sai = (ten, chu) => { loi++; console.log('SAI', ten, chu) }
for (const [ten, q, w, h, kieu] of DS) {
  const dt = w < 900
  // Nền tối của giao diện «Trong» theo máy (prefers-color-scheme); trang phòng chờ theo `data-giao-dien` (tham số ?toi=1) ⇒ bật cả hai.
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: dt, isMobile: dt, colorScheme: q.includes('toi=1') ? 'dark' : 'light' })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => sai(ten, 'LỖI TRANG ' + e.message))
  p.on('console', (m) => { if (m.type() === 'error') sai(ten, 'LỖI CONSOLE ' + m.text().slice(0, 200)) })
  await p.goto(GOC + q)
  await p.waitForSelector('.sst-the')
  await p.waitForTimeout(400)
  const nut = p.getByRole('button', { name: 'Chơi' })
  const truoc = await p.evaluate(() => ({ mo: window.__stCa.dem.mo, cao: document.querySelector('.sst-nut').getBoundingClientRect().height, tran: document.documentElement.scrollWidth > innerWidth + 1 }))
  if (truoc.mo !== 0) sai(ten, `chưa bấm mà đã có ${truoc.mo} kết nối`)
  if (truoc.cao < 48) sai(ten, `nút «Chơi» cao ${truoc.cao} px (< 48)`)
  if (truoc.tran) sai(ten, 'thẻ sảnh tràn ngang')
  const ghi = [`nút ${Math.round(truoc.cao)} px`, `kết nối trước khi bấm ${truoc.mo}`]
  if (kieu === 'tat') { if (!(await nut.isDisabled())) sai(ten, 'không vé mà nút vẫn bấm được') }
  if (kieu === 'choi' || kieu === 'batdau') {
    await nut.click()
    await p.waitForSelector('.sst-man .gl-san')
    await p.waitForTimeout(1500)
    // Vuốt chéo rồi giữ: bé ma chạy, gặp đối thủ thì súng tự bắn.
    const r = await p.evaluate(() => { const e = document.querySelector('.sst-man').getBoundingClientRect(); return { x: e.left + e.width * 0.45, y: e.top + e.height * 0.6 } })
    await p.mouse.move(r.x, r.y); await p.mouse.down(); await p.mouse.move(r.x + 30, r.y + 30, { steps: 4 })
    await p.waitForTimeout(kieu === 'choi' ? 3500 : 800); await p.mouse.up()
    const soat = await p.evaluate(async () => {
      const kq = []
      const man = document.querySelector('.sst-man'), xoay = man.hasAttribute('data-xoay'), m = man.getBoundingClientRect()
      if (Math.abs(m.width - innerWidth) > 1 || Math.abs(m.height - innerHeight) > 1 || Math.abs(m.left) > 1 || Math.abs(m.top) > 1) kq.push(`SAI màn trò không phủ kín: ${Math.round(m.left)},${Math.round(m.top)} ${Math.round(m.width)}×${Math.round(m.height)}`)
      const thoat = document.querySelector('.sst-thoat').getBoundingClientRect(), loa = document.querySelector('.st-am')?.getBoundingClientRect()
      if (Math.min(thoat.width, thoat.height) < 44) kq.push(`SAI nút «Thoát trò» ${Math.round(thoat.width)}×${Math.round(thoat.height)}`)
      const lop = [...document.querySelectorAll('.sst-thoat, .st-am, .st-bang, .st-tin, .st-bao, .st-sung, .st-cho, .st-bd')].filter((e) => e.getBoundingClientRect().width > 0)
      for (const e of lop) { const c = e.getBoundingClientRect(); if (c.left < -1 || c.top < -1 || c.right > innerWidth + 1 || c.bottom > innerHeight + 1) kq.push('SAI TRÀN ' + e.className) }
      for (let i = 0; i < lop.length; i++) for (let j = i + 1; j < lop.length; j++) {
        const a = lop[i].getBoundingClientRect(), c = lop[j].getBoundingClientRect()
        if (a.left < c.right - 0.5 && c.left < a.right - 0.5 && a.top < c.bottom - 0.5 && c.top < a.bottom - 0.5) kq.push(`SAI ĐÈ ${lop[i].className} × ${lop[j].className}`)
      }
      const kh = await new Promise((xong) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else xong(n) }; requestAnimationFrame(f) })
      kq.push(`${xoay ? 'xoay hình' : 'không xoay'}`, `${kh} khung/giây`, `kết nối ${window.__stCa.dem.mo}`, `em thật trong phòng ${window.__stCa.phong.soNguoi}`, `loa ${loa ? 'có' : 'không'}`)
      return kq
    })
    for (const s of soat) { if (s.startsWith('SAI')) sai(ten, s); else ghi.push(s) }
  }
  if (kieu === 'batdau') {
    // Thầy bấm Bắt đầu ở giây thứ 5 (tham số ?batdau=5): phòng đóng mã 4000 ⇒ trò phải gỡ ngay, «vào bài» đúng một lần, kết nối đóng.
    await p.waitForFunction(() => window.__stCa.dem.dong4000 > 0, null, { timeout: 8000 })
    const t0 = Date.now()
    await p.waitForFunction(() => !document.querySelector('.sst-man') && document.getElementById('vao-bai').textContent === '1', null, { timeout: 2000 }).catch(() => sai(ten, 'thầy bắt đầu mà trò chưa gỡ / chưa gọi vào bài sau 2 giây'))
    ghi.push(`gỡ trò + vào bài sau ${Date.now() - t0} ms kể từ mã 4000`)
    await p.screenshot({ path: join(thuMuc, `that-${ten}.jpg`), type: 'jpeg', quality: 60 })
    await p.waitForTimeout(2500)
    const sau = await p.evaluate(() => ({ vao: document.getElementById('vao-bai').textContent, man: !!document.querySelector('.sst-man'), nguoi: window.__stCa.phong.soNguoi, mo: window.__stCa.dem.mo, chu: document.querySelector('.sst-dong')?.textContent }))
    if (sau.vao !== '1' || sau.man || sau.mo !== 1) sai(ten, 'sau bắt đầu: ' + JSON.stringify(sau))
    ghi.push(`sau 2,5 giây: vào bài ${sau.vao} lần · kết nối đã mở ${sau.mo} (không nối lại) · «${sau.chu}»`)
  } else await p.screenshot({ path: join(thuMuc, `that-${ten}.jpg`), type: 'jpeg', quality: w >= 1280 ? 45 : 60 }) // ảnh bằng chứng ≤ 150 KB
  if (kieu === 'choi') {
    // «Thoát trò» ⇒ về thẻ, kết nối đóng (phòng không còn em S0).
    await p.locator('.sst-thoat').click()
    await p.waitForTimeout(300)
    const sau = await p.evaluate(() => ({ man: !!document.querySelector('.sst-man'), co: [...window.__stCa.phong['nguoi'].keys()].includes('S0') }))
    if (sau.man || sau.co) sai(ten, 'thoát trò mà chưa gỡ: ' + JSON.stringify(sau))
    ghi.push('thoát trò: gỡ màn + rời phòng')
  }
  console.log(ten.padEnd(14), ghi.join(' · '))
  await ctx.close()
}
await b.close()
console.log(loi ? `CÓ ${loi} LỖI` : 'ĐẠT: 0 lỗi trang, 0 lớp đè / tràn, thầy bắt đầu ⇒ trò gỡ + vào bài đúng một lần')
process.exit(loi ? 1 : 0)
