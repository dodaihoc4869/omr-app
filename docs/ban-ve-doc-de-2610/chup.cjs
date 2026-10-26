// Chụp bản vẽ «Trong»: mỗi trang × 3 khổ (điện thoại dọc 390 / ngang 844 / máy tính 1440) × sáng / tối.
// Kiểm: lỗi trang, tràn ngang, đích bấm < 44 px (nút, lựa chọn, mục menu, tab), chữ tràn khỏi khung.
// Dùng: node chup.cjs <tên-tệp-không-đuôi> … [--chi=doc-sang,may-tinh-sang]
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs')
const D = __dirname
const chi = (process.argv.find((a) => a.startsWith('--chi=')) || '').slice(6).split(',').filter(Boolean)
const trang = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const kho = [
  { ten: 'doc', w: 390, h: 844, dsf: 2, q: 62 },
  { ten: 'ngang', w: 844, h: 390, dsf: 2, q: 62 },
  { ten: 'may-tinh', w: 1440, h: 900, dsf: 1, q: 78 },
]
fs.mkdirSync(path.join(D, 'anh'), { recursive: true })
;(async () => {
  const b = await chromium.launch()
  for (const t of trang) for (const k of kho) for (const che of ['sang', 'toi']) {
    if (chi.length && !chi.includes(`${k.ten}-${che}`)) continue
    const p = await b.newPage({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dsf, colorScheme: che === 'toi' ? 'dark' : 'light' })
    const loi = []
    p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto('file://' + path.join(D, t + '.html') + (che === 'toi' ? '?toi' : ''))
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(300)
    const kq = await p.evaluate(() => {
      const tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
      const nho = [...document.querySelectorAll('.nut, .lua-chon, .ben .muc, .duoi span, .lien-ket, .tab > span, .ds-chon span, .ve-lai')].filter((e) => hien(e) && e.getBoundingClientRect().height < 38).map((e) => e.textContent.trim().slice(0, 24))
      const cat = [...document.querySelectorAll('.the, .nut, .chip')].filter((e) => hien(e) && e.scrollWidth > e.clientWidth + 2).map((e) => (e.className + ':' + e.textContent.trim()).slice(0, 40))
      return { tran, nho, cat }
    })
    const cao = await p.evaluate(() => document.documentElement.scrollHeight)
    await p.setViewportSize({ width: k.w, height: Math.max(k.h, cao) })
    await p.evaluate(() => window.scrollTo(0, 0))
    await p.waitForTimeout(200)
    const ra = path.join(D, 'anh', `${t}-${k.ten}-${che}.jpg`)
    await p.screenshot({ path: ra, type: 'jpeg', quality: k.q })
    const kb = Math.round(fs.statSync(ra).size / 1024)
    console.log(`${t}-${k.ten}-${che}: lỗi ${loi.length}${loi.length ? ' ' + loi[0].slice(0, 80) : ''} · tràn ${kq.tran}px · đích nhỏ ${kq.nho.length}${kq.nho.length ? ' ' + JSON.stringify(kq.nho.slice(0, 3)) : ''} · cắt chữ ${kq.cat.length}${kq.cat.length ? ' ' + JSON.stringify(kq.cat.slice(0, 2)) : ''} · ${kb} KB`)
    await p.close()
  }
  await b.close()
})()
