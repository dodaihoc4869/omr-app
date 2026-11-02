// Chụp bản vẽ «Ô nguyên tố»: mỗi trang × 3 khổ (điện thoại dọc 390×844 · ngang 844×390 · máy tính 1440×900) × sáng / tối.
// Kiểm: lỗi trang, tràn ngang, đích bấm < 44 px, chữ bị cắt. Ảnh JPG ≤ 150 KB vào anh/.
// Dùng: node chup.cjs <trang> … [--chi=doc-sang,may-tinh-toi]
const { chromium } = require('playwright')
const path = require('path'), fs = require('fs')
const D = __dirname
const chi = (process.argv.find((a) => a.startsWith('--chi=')) || '').slice(6).split(',').filter(Boolean)
const trang = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const kho = [
  { ten: 'doc', w: 390, h: 844, dsf: 2, q: 60 },
  { ten: 'ngang', w: 844, h: 390, dsf: 2, q: 60 },
  { ten: 'may-tinh', w: 1440, h: 900, dsf: 1, q: 74 },
]
fs.mkdirSync(path.join(D, 'anh'), { recursive: true })
;(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
  let tong = { loi: 0, tran: 0, nho: 0, cat: 0, tuongPhan: 0 }
  for (const t of trang) for (const k of kho) for (const che of ['sang', 'toi']) {
    if (chi.length && !chi.includes(`${k.ten}-${che}`)) continue
    const p = await b.newPage({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dsf, colorScheme: che === 'toi' ? 'dark' : 'light' })
    const loi = []
    p.on('pageerror', (e) => loi.push(String(e)))
    p.on('requestfailed', (r) => loi.push('tải hỏng ' + r.url().slice(-50)))
    await p.goto('file://' + path.join(D, t + '.html'))
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(350)
    const kq = await p.evaluate(() => {
      const tran = document.documentElement.scrollWidth - document.documentElement.clientWidth
      const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && getComputedStyle(e).display !== 'none' }
      const nho = [...document.querySelectorAll('button, a, [role=switch], .nut, input')].filter((e) => hien(e) && !e.closest('[aria-hidden=true]') && (e.getBoundingClientRect().height < 43.5 || e.getBoundingClientRect().width < 43.5)).map((e) => (e.getAttribute('aria-label') || e.textContent).trim().slice(0, 24))
      const cat = [...document.querySelectorAll('.the, .nut, .chip, .dong b, h1, .bang b, .dem')].filter((e) => hien(e) && e.scrollWidth > e.clientWidth + 2).map((e) => (e.className + ':' + e.textContent.trim()).slice(0, 40))
      // TƯƠNG PHẢN (CHUẨN B4, cùng ngưỡng scripts/do-tuong-phan-hs.mjs): chữ thường ≥ 4,5; chữ to (≥ 24 px, hoặc ≥ 18,66 px đậm) và chữ trên nút / huy hiệu ≥ 3
      const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d', { willReadFrequently: true })
      const rgba = (c) => { cx.clearRect(0, 0, 1, 1); cx.fillStyle = 'rgba(0,0,0,0)'; cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return [d[0], d[1], d[2], d[3] / 255] }
      const tron = (a, b) => [0, 1, 2].map((i) => a[i] * a[3] + b[i] * (1 - a[3])).concat(1)
      const nen = (e) => { const ds = []; for (let x = e; x; x = x.parentElement) { const c = rgba(getComputedStyle(x).backgroundColor); if (c[3] > 0) ds.push(c); if (c[3] >= 0.99) break }
        let n = ds.length && ds[ds.length - 1][3] >= 0.99 ? ds.pop() : rgba(getComputedStyle(document.body).backgroundColor); for (let i = ds.length - 1; i >= 0; i--) n = tron(ds[i], n); return n }
      const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }, L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2])
      const tp = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05) }
      const doMo = (e) => { let o = 1; for (let x = e; x; x = x.parentElement) o *= +getComputedStyle(x).opacity; return o }
      const kem = []
      for (const e of document.querySelectorAll('body *')) {
        if (!hien(e) || e.closest('svg, [aria-hidden=true], [disabled], .sr') || ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
        const cs = getComputedStyle(e), b = nen(e), c = rgba(cs.color); c[3] *= doMo(e)
        const px = parseFloat(cs.fontSize), dam = +cs.fontWeight >= 700, to = px >= 24 || (px >= 18.66 && dam) || !!e.closest('.nut, .chip, .dem-n, .cham-do, .so-o, .ky, .nhan-m, .dem, button.dong b, .duoi a, .ray a, .ai-noi b, .ds button') && dam
        const r = tp(tron(c, b), b)
        if (r < (to ? 3 : 4.5) - 0.01) kem.push(`${e.textContent.trim().slice(0, 18)}=${r.toFixed(2)}`)
      }
      return { tran, nho, cat, kem }
    })
    const cao = await p.evaluate(() => Math.max(document.documentElement.scrollHeight, ...[...document.querySelectorAll('[data-cuon]')].map((e) => e.scrollHeight + e.getBoundingClientRect().top)))
    const motMan = await p.evaluate(() => document.body.hasAttribute('data-mot-man'))
    // ngang: giữ khung 844×390 (luật cao thấp) ⇒ chụp cả trang bằng fullPage; dọc / máy tính: nới khung cho dài hết trang
    if (!motMan && k.ten !== 'ngang') await p.setViewportSize({ width: k.w, height: Math.max(k.h, cao) })
    await p.evaluate(() => window.scrollTo(0, 0))
    await p.waitForTimeout(250)
    const ra = path.join(D, 'anh', `${t}-${k.ten}-${che}.jpg`)
    let q = k.q
    await p.screenshot({ path: ra, type: 'jpeg', quality: q, fullPage: !motMan && k.ten === 'ngang' })
    while (fs.statSync(ra).size > 150 * 1024 && q > 30) { q -= 8; await p.screenshot({ path: ra, type: 'jpeg', quality: q, fullPage: !motMan && k.ten === 'ngang' }) }
    const kb = Math.round(fs.statSync(ra).size / 1024)
    tong.loi += loi.length; tong.tran += kq.tran > 0 ? 1 : 0; tong.nho += kq.nho.length; tong.cat += kq.cat.length; tong.tuongPhan += kq.kem.length
    console.log(`${t}-${k.ten}-${che}: lỗi ${loi.length}${loi.length ? ' ' + loi[0].slice(0, 90) : ''} · tràn ${kq.tran}px · đích nhỏ ${kq.nho.length}${kq.nho.length ? ' ' + JSON.stringify(kq.nho.slice(0, 4)) : ''} · cắt chữ ${kq.cat.length}${kq.cat.length ? ' ' + JSON.stringify(kq.cat.slice(0, 2)) : ''} · tương phản kém ${kq.kem.length}${kq.kem.length ? ' ' + JSON.stringify(kq.kem.slice(0, 4)) : ''} · ${kb} KB q${q}`)
    await p.close()
  }
  console.log('TỔNG', JSON.stringify(tong))
  await b.close()
})()
