// Chụp khung Lời giải Kính (trang xem thử dựng bằng component thật) ở 5 khổ × sáng/tối × 3 câu mẫu; kiểm lỗi trang, tràn ngang, đích bấm < 44 px, tương phản.
// Dùng: node chup.cjs <địa chỉ gốc> <thư mục ảnh>
const { chromium } = require('playwright')
const fs = require('fs'), path = require('path')
const [goc, ra] = process.argv.slice(2)
const KHO = [['doc', 390, 844, 1.5], ['ngang', 844, 390, 1.5], ['may-tinh', 1440, 900, 1], ['fold-gap', 344, 882, 1.5], ['fold-mo', 904, 690, 1.25]]
fs.mkdirSync(ra, { recursive: true })
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  const tong = { loi: 0, tran: 0, nho: 0, kem: 0 }
  for (const cau of [1, 2, 3]) for (const [ten, w, h, dsf] of KHO) for (const che of ['sang', 'toi']) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, colorScheme: che === 'toi' ? 'dark' : 'light' })
    const loi = []
    p.on('pageerror', (e) => loi.push(String(e).slice(0, 120)))
    await p.goto(`${goc}/?cau=${cau}`); await p.waitForTimeout(900)
    const kq = await p.evaluate(() => {
      const tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' }
      const nho = [...document.querySelectorAll('.lgk button')].filter((e) => hien(e) && !e.closest('[aria-hidden=true]') && (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5)).map((e) => (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24))
      const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
      const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
      const tron = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
      const nen = (e) => { const ds = []; for (let x = e; x; x = x.parentElement) { const c = rgba(getComputedStyle(x).backgroundColor); if (c[3] > 0) ds.push(c); if (c[3] >= 0.99) break }
        let n = ds.length && ds[ds.length - 1][3] >= 0.99 ? ds.pop() : rgba(getComputedStyle(document.body).backgroundColor); for (let i = ds.length - 1; i >= 0; i--) n = tron(ds[i], n); return n }
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }, L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
      const tp = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
      const doMo = (e) => { let o = 1; for (let x = e; x; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o }
      const kem = []
      for (const e of document.querySelectorAll('.lgk *')) {
        if (!hien(e) || e.closest('svg, [aria-hidden=true], .lgk-sr') || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
        const dm = doMo(e); if (dm < 0.05) continue
        const cs = getComputedStyle(e), bg = nen(e), c = rgba(cs.color); c[3] *= dm
        const px = parseFloat(cs.fontSize), to = px >= 24 || (px >= 18.66 && +cs.fontWeight >= 700)
        const r = tp(tron(c, bg), bg)
        if (r < (to ? 3 : 4.5) - 0.01) kem.push(`${e.textContent.trim().slice(0, 16)}=${r.toFixed(2)}`)
      }
      return { tran, nho, kem, cao: document.documentElement.scrollHeight }
    })
    await p.setViewportSize({ width: w, height: Math.min(Math.max(h, kq.cao), 9000) })
    await p.waitForTimeout(150)
    const tep = path.join(ra, `cau${cau}-${ten}-${che}.jpg`)
    let q = 70
    await p.screenshot({ path: tep, type: 'jpeg', quality: q, fullPage: true })
    while (fs.statSync(tep).size > 150 * 1024 && q > 20) { q -= 10; await p.screenshot({ path: tep, type: 'jpeg', quality: q, fullPage: true }) }
    tong.loi += loi.length; tong.tran += kq.tran > 0 ? 1 : 0; tong.nho += kq.nho.length; tong.kem += kq.kem.length
    if (loi.length || kq.tran > 0 || kq.nho.length || kq.kem.length) console.log(`câu ${cau} ${ten} ${che}: lỗi ${loi.length} ${loi[0] || ''} · tràn ${kq.tran} · nhỏ ${JSON.stringify(kq.nho.slice(0, 3))} · kém ${JSON.stringify(kq.kem.slice(0, 4))}`)
    await p.close()
  }
  console.log('TỔNG', JSON.stringify(tong))
  await b.close()
})()
