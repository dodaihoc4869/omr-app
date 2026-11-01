// Chụp bản vẽ «Hôm nay · 4 bảng» (01/11) — trang vẽ nằm trong bộ khung docs/ban-ve-trong-2610 (dùng chung trong.css / khung.js / phông / logo).
// node docs/ban-ve-hom-nay-4-bang-0111/chup.cjs   ⇒ ảnh vào docs/ban-ve-hom-nay-4-bang-0111/anh. Soát: lỗi trang · tràn ngang · đích bấm < 38 px (luật bộ khung).
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs')
const KHUNG = path.resolve(__dirname, '../ban-ve-trong-2610'), RA = path.join(__dirname, 'anh')
fs.mkdirSync(RA, { recursive: true })
const KHO = [{ ten: 'doc', w: 390, h: 844, dsf: 2, q: 58 }, { ten: 'ngang', w: 844, h: 390, dsf: 2, q: 58 }, { ten: 'may-tinh', w: 1440, h: 900, dsf: 1, q: 76 }]
const TRANG = [['gv-hom-nay-4-bang', ''], ['gv-bang-chung-em', 'dp'], ['gv-bang-chung-em', 'ht'], ['gv-bang-chung-em', 'ch'], ['gv-bang-chung-em', 'lu']]
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  let tong = 0
  for (const [t, h] of TRANG) for (const k of KHO) for (const che of ['sang', 'toi']) {
    if (h && h !== 'dp' && h !== 'ht' && k.ten === 'ngang') continue
    const p = await b.newPage({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dsf, colorScheme: che === 'toi' ? 'dark' : 'light' })
    const loi = []
    p.on('pageerror', (e) => loi.push(String(e)))
    await p.goto('file://' + path.join(KHUNG, t + '.html') + (che === 'toi' ? '?toi' : '') + (h ? '#' + h : ''))
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300)
    const kq = await p.evaluate(() => {
      const tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
      const nho = [...document.querySelectorAll('.nut, .lua-chon, .ben .muc, .duoi span, .lien-ket, .tab > span, .chon4 span, .xh li')].filter((e) => hien(e) && e.getBoundingClientRect().height < 38).map((e) => e.textContent.trim().slice(0, 24))
      return { tran, nho }
    })
    const cao = await p.evaluate(() => document.documentElement.scrollHeight)
    await p.setViewportSize({ width: k.w, height: Math.max(k.h, cao) }); await p.waitForTimeout(150)
    const ten = `${t}${h ? '-' + h : ''}-${k.ten}-${che}.jpg`
    await p.screenshot({ path: path.join(RA, ten), type: 'jpeg', quality: k.q })
    const van = loi.length + (kq.tran > 0 ? 1 : 0) + kq.nho.length
    tong += van
    console.log(`${ten}: lỗi ${loi.length}${loi.length ? ' ' + loi[0].slice(0, 90) : ''} · tràn ${kq.tran}px · đích nhỏ ${kq.nho.length}${kq.nho.length ? ' ' + JSON.stringify(kq.nho.slice(0, 3)) : ''} · ${Math.round(fs.statSync(path.join(RA, ten)).size / 1024)} KB`)
    await p.close()
  }
  await b.close()
  console.log(tong ? `SOÁT: ${tong} vấn đề` : 'SOÁT: 0 lỗi trang · 0 tràn ngang · 0 đích bấm nhỏ')
})()
