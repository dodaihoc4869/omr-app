// CHỤP BẢN VẼ «Đấu Nguyên Tử 2» bằng Chromium THẬT từ bản thử thu.html (không tải trình duyệt, không mạng).
//   node scripts/ban-ve-dau-ion-v2-3110/chup.mjs          ⇒ ảnh vào docs/ban-ve-dau-ion-v2-3110/ + kiem.json (lỗi trang, tràn ngang, đích < 44 px)
//   node scripts/ban-ve-dau-ion-v2-3110/chup.mjs --do     ⇒ chỉ đo khung hình (CPU ×1 / ×4, thường / máy yếu) ⇒ do-khung.json
// Mỗi cảnh dựng TẤT ĐỊNH qua cửa window.__dn của bản thử (hạt giống cố định, A.I lái cả «Em»), rồi vẽ đúng một khung. JPG ≤ 150 KB.
import { chromium } from 'playwright'
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DAY = import.meta.dirname
const GOC = resolve(DAY, '../..')
const RA = resolve(GOC, 'docs/ban-ve-dau-ion-v2-3110')
const NHAP = resolve(process.env.TMPDIR || '/tmp', 'ban-ve-dau-ion-v2-nhap')
mkdirSync(RA, { recursive: true }); mkdirSync(NHAP, { recursive: true })
const URL_ = pathToFileURL(resolve(DAY, 'thu.html')).href
const KHO = { 390: { w: 390, h: 844, dt: true }, 844: { w: 844, h: 390, dt: true }, 1440: { w: 1440, h: 900, dt: false } }
const TEN = ['Quốc Bảo', 'Thu Hà', 'Gia Huy', 'Ngọc Trâm', 'Đức Anh']
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

let trinh
try { trinh = await chromium.launch() } catch { trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome' }) }

async function chup(p, tep, o = {}) {
  for (const q of [80, 72, 64, 56, 48, 40, 32]) {
    await p.screenshot({ path: tep, type: 'jpeg', quality: q, ...o })
    if (statSync(tep).size <= 150_000) return statSync(tep).size
  }
  return statSync(tep).size
}
const KIEM = () => {
  const hien = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && !e.closest('[hidden]') }
  const nho = [...document.querySelectorAll('button, input, a[href], [role="radio"]')].filter(hien).filter((e) => { const r = e.getBoundingClientRect(); return e.type === 'checkbox' ? e.closest('label').getBoundingClientRect().height < 44 : r.height < 44 || r.width < 44 })
  return { tran: document.scrollingElement.scrollWidth > innerWidth + 1, nho: nho.map((e) => `${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)} ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`) }
}

const loi = [], bang = []
async function trang(kho, nen, them = '') {
  const k = KHO[kho]
  const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dt ? 2 : 1, isMobile: k.dt, hasTouch: k.dt, locale: 'vi-VN', colorScheme: nen === 'toi' ? 'dark' : 'light' })
  const p = await ctx.newPage()
  p.on('pageerror', (e) => loi.push(`${kho}-${nen}: ${e.message.slice(0, 200)}`))
  await p.goto(`${URL_}?nen=${nen}${them}`)
  await p.evaluate(() => document.fonts.ready)
  await cho(150)
  return { p, ctx }
}
async function ghi(p, ten, o) {
  const tep = resolve(RA, `${ten}.jpg`)
  const kb = await chup(p, tep, o)
  const k = await p.evaluate(KIEM)
  bang.push({ anh: `docs/ban-ve-dau-ion-v2-3110/${ten}.jpg`, kb: Math.round(kb / 1024), ...k })
  return tep
}

/** Cảnh trận chính: 6 bạn, cấp súng khác nhau, nhiều đạn đang bay, đường ngắm. */
async function canhTran(p, kho, hat = 4242) {
  await p.evaluate(({ TEN, hat }) => {
    const d = window.__dn
    d.vaoTran({ tinh: true, emAI: true, hat, ten: TEN, nt: [3, 1, 2, 4, 5, 6] })
    d.dat((tr) => { const cap = [3, 2, 4, 1, 5, 2], ha = [3, 2, 4, 0, 5, 1]; tr.ghe.forEach((g, i) => { g.cap = cap[i]; g.capMax = cap[i]; g.ha = ha[i]; g.biHa = [1, 2, 2, 3, 1, 3][i] }); tr.ghe[0].e = 3; tr.con = 46 })
    // Chạy từng nhịp ngắn, giữ «Em» ở Cấp 3 cho đến khi sân đủ 6 bạn, em đang ngắm và có nhiều đạn đang bay.
    for (let k = 0; k < 60; k++) {
      d.dat((tr) => { const em = tr.ghe[0]; em.mau = Math.max(em.mau, 7); if (em.cap < 3) { em.cap = 3; em.e = 3 } })
      d.tua(0.2)
      const t = d.tr(), em = t.ghe[0]
      const m = em.muc && t.ghe.find((g) => g.id === em.muc)
      if (k > 20 && t.dan.length >= 14 && em.cho <= 0 && m && Math.hypot(m.x - em.x, m.y - em.y) > 150 && t.ghe.every((g) => g.cho <= 0)) break
    }
  }, { TEN, hat })
  if (kho === 390) await p.evaluate(() => window.__dn.can(286, 770, 24, -30))
  if (kho === 844) await p.evaluate(() => window.__dn.can(120, 318, 30, -16))
  if (kho === 1440) await p.evaluate(() => { const em = window.__dn.ghe(1); window.__dn.diToi({ x: Math.min(560, em.x + 70), y: Math.max(40, em.y - 40) }) })
}

if (!process.argv.includes('--do')) {
  // 0 · Phòng chờ có game nhúng (đầu trang, dòng «Đang chờ Thầy bấm bắt đầu»).
  for (const [kho, nen] of [[390, 'sang'], [390, 'toi'], [1440, 'sang'], [1440, 'toi']]) {
    const { p, ctx } = await trang(kho, nen)
    await ghi(p, `0-phong-cho-${kho}-${nen}`)
    await ctx.close()
  }
  // 1 · Sảnh: thẻ game (ảnh bìa, 5 cấp, nút Vào sân đấu, chọn nguyên tố).
  for (const [kho, nen] of [[390, 'sang'], [390, 'toi'], [844, 'sang']]) {
    const { p, ctx } = await trang(kho, nen)
    await p.evaluate(() => { const e = document.getElementById('the'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 8) })
    await cho(120)
    await ghi(p, `1-sanh-${kho}-${nen}`)
    await ctx.close()
  }
  // 2 · Trận chính: 3 khổ × sáng/tối.
  for (const nen of ['sang', 'toi']) for (const kho of [390, 844, 1440]) {
    const { p, ctx } = await trang(kho, nen)
    await canhTran(p, kho)
    await cho(80)
    await ghi(p, `2-tran-${kho}-${nen}`)
    await ctx.close()
  }
  // 3 · Nhặt Xúc tác ⇒ lên ngay Cấp 4 (phản ứng dây chuyền).
  for (const nen of ['sang', 'toi']) {
    const { p, ctx } = await trang(390, nen)
    await p.evaluate(({ TEN }) => {
      const d = window.__dn
      d.vaoTran({ tinh: true, emAI: true, hat: 77, ten: TEN, nt: [3, 1, 2, 4, 5, 6] })
      d.dat((tr) => { tr.ghe.forEach((g, i) => { g.cap = [3, 2, 1, 2, 3, 1][i] }); tr.ghe[0].e = 4; tr.con = 33 })
      d.tua(4)
      d.dat((tr) => { const em = tr.ghe[0]; tr.vp = tr.vp.filter((v) => v.k !== 'xt'); tr.vp.push({ id: 900, k: 'xt', x: 300, y: 206, t0: tr.t - 1 }); em.x = 252; em.y = 214; em.cho = 0; em.che = 0; em.mau = 8 })
      d.xoaTin(); d.tuaToi((s) => s.t === 'nhat' && s.ai === 1 && s.k === 'xt', 4)
      d.tua(0.16)
    }, { TEN })
    await ghi(p, `3-nhat-xuc-tac-390-${nen}`)
    await ctx.close()
  }
  // 4 · Nhặt electron cuối ⇒ tiến hoá Cấp 5 (toả nhiệt).
  {
    const { p, ctx } = await trang(390, 'toi')
    await p.evaluate(({ TEN }) => {
      const d = window.__dn
      d.vaoTran({ tinh: true, emAI: true, hat: 314, ten: TEN, nt: [3, 1, 2, 4, 5, 6] })
      d.dat((tr) => { tr.ghe.forEach((g, i) => { g.cap = [4, 2, 3, 1, 2, 3][i]; g.ha = [4, 1, 2, 0, 1, 2][i] }); tr.ghe[0].e = 8; tr.con = 21 })
      d.tua(3)
      d.dat((tr) => { const em = tr.ghe[0]; em.cap = 4; em.e = 8; em.cho = 0; em.che = 0; tr.vp.push({ id: 901, k: 'e', x: em.x + 10, y: em.y + 46, t0: tr.t - 1 }) })
      d.xoaTin(); d.tuaToi((s) => s.t === 'len' && s.ai === 1 && s.cap === 5, 6)
      d.tua(0.18)
    }, { TEN })
    await ghi(p, '4-len-cap-5-390-toi')
    await ctx.close()
  }
  // 5 · Trúng + hạ: em (Cấp 4) hạ một bạn còn 1 Máu; tia dây chuyền nảy sang bạn kế.
  for (const nen of ['toi', 'sang']) {
    const { p, ctx } = await trang(390, nen)
    await p.evaluate(({ TEN }) => {
      const d = window.__dn
      d.vaoTran({ tinh: true, emAI: true, hat: 99, ten: TEN, nt: [3, 1, 2, 4, 5, 6] })
      d.dat((tr) => { tr.ghe.forEach((g, i) => { g.cap = [4, 3, 2, 2, 1, 3][i]; g.ha = [2, 3, 1, 1, 0, 2][i] }); tr.con = 27 })
      d.tua(5)
      let s = null
      for (let k = 0; k < 6 && !s; k++) {
        d.dat((tr) => { const em = tr.ghe[0]; if (em.cho > 0) { em.cho = 0; em.che = 0 } em.mau = 10; for (const g of tr.ghe) if (g.id !== 1 && g.cho <= 0) g.mau = Math.min(g.mau, 2) })
        s = d.tuaToi((s) => s.t === 'ha' && s.boi === 1, 3)
      }
      d.tua(0.12)
    }, { TEN })
    await ghi(p, `5-trung-ha-390-${nen}`)
    await ctx.close()
  }
  // 6 · Hết ván: bảng xếp hạng + đếm ván mới.
  for (const [kho, nen] of [[390, 'sang'], [844, 'toi'], [1440, 'sang']]) {
    const { p, ctx } = await trang(kho, nen)
    await p.evaluate(({ TEN }) => {
      const d = window.__dn
      d.vaoTran({ tinh: true, emAI: true, hat: 1234, ten: TEN, nt: [3, 1, 2, 4, 5, 6] })
      d.dat((tr) => { const ha = [7, 5, 4, 3, 2, 1], biHa = [2, 3, 4, 4, 5, 3], cm = [5, 4, 4, 3, 3, 2], ch = [3, 2, 2, 1, 1, 1]; tr.ghe.forEach((g, i) => { g.ha = ha[i]; g.biHa = biHa[i]; g.capMax = cm[i]; g.chuoiMax = ch[i] }); tr.con = 3 })
      d.tua(3.2)
      d.nghi(4)
    }, { TEN })
    await ghi(p, `6-het-van-${kho}-${nen}`)
    await ctx.close()
  }
  // 7 · Thầy bấm bắt đầu ⇒ game dừng ngay, chỉ còn một dòng chữ.
  {
    const { p, ctx } = await trang(390, 'sang')
    await p.evaluate(() => { window.__dn.vaoTran({ emAI: true }); })
    await cho(800)
    await p.evaluate(() => window.__dn.dung())
    await cho(100)
    await ghi(p, '7-thay-bat-dau-390-sang')
    await ctx.close()
  }
  // 9 · Bảng cấp súng / vật phẩm / hiệu ứng.
  for (const nen of ['sang', 'toi']) {
    const { p, ctx } = await trang(1440, nen, '&bang=1')
    await cho(200)
    const h = await p.evaluate(() => document.querySelector('.dn-bang-ve').getBoundingClientRect().height + 40)
    await p.setViewportSize({ width: 1440, height: Math.ceil(h) })
    await p.evaluate(() => document.fonts.ready)
    await p.goto(`${URL_}?nen=${nen}&bang=1`); await p.evaluate(() => document.fonts.ready); await cho(200)
    await ghi(p, `9-bang-cap-vat-pham-hieu-ung-${nen}`)
    await ctx.close()
  }
  // 8 · Kịch bản 6 khung (ghép từ khung nhỏ).
  const khung6 = []
  {
    const lam = async (ten, f, nen = 'sang') => {
      const ctx = await trinh.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, colorScheme: nen === 'toi' ? 'dark' : 'light' })
      const p = await ctx.newPage(); p.on('pageerror', (e) => loi.push(`kb-${ten}: ${e.message.slice(0, 200)}`))
      await p.goto(`${URL_}?nen=${nen}`); await p.evaluate(() => document.fonts.ready); await cho(120)
      await f(p)
      const tep = resolve(NHAP, `${ten}.png`); await p.screenshot({ path: tep }); khung6.push(tep); await ctx.close()
    }
    await lam('k1', async (p) => { await p.evaluate(() => { const e = document.getElementById('the'); scrollTo(0, e.getBoundingClientRect().top + scrollY - 8) }) })
    await lam('k2', async (p) => { await p.evaluate(({ TEN }) => { const d = window.__dn; d.vaoTran({ tinh: true, emAI: true, hat: 21, ten: TEN, nt: [3, 1, 2, 4, 5, 6] }); d.tua(2.2) }, { TEN }); await p.evaluate(() => window.__dn.can(250, 760, 36, -22)) })
    await lam('k3', async (p) => { await p.evaluate(({ TEN }) => { const d = window.__dn; d.vaoTran({ tinh: true, emAI: true, hat: 55, ten: TEN, nt: [3, 1, 2, 4, 5, 6] }); d.dat((tr) => { tr.ghe[0].e = 2 }); d.tuaToi((s) => s.t === 'len' && s.ai === 1, 20); d.tua(0.15) }, { TEN }) })
    await lam('k4', async (p) => { await p.evaluate(({ TEN }) => { const d = window.__dn; d.vaoTran({ tinh: true, emAI: true, hat: 77, ten: TEN, nt: [3, 1, 2, 4, 5, 6] }); d.dat((tr) => { tr.ghe.forEach((g, i) => { g.cap = [3, 2, 1, 2, 3, 1][i] }); tr.con = 33 }); d.tua(4); d.dat((tr) => { const em = tr.ghe[0]; tr.vp = tr.vp.filter((v) => v.k !== 'xt'); tr.vp.push({ id: 900, k: 'xt', x: 300, y: 206, t0: tr.t - 1 }); em.x = 252; em.y = 214; em.cho = 0; em.che = 0 }); d.xoaTin(); d.tuaToi((s) => s.t === 'nhat' && s.ai === 1 && s.k === 'xt', 4); d.tua(0.16) }, { TEN }) }, 'toi')
    await lam('k5', async (p) => { await p.evaluate(({ TEN }) => { const d = window.__dn; d.vaoTran({ tinh: true, emAI: true, hat: 99, ten: TEN, nt: [3, 1, 2, 4, 5, 6] }); d.dat((tr) => { tr.ghe.forEach((g, i) => { g.cap = [4, 3, 2, 2, 1, 3][i] }); tr.con = 27 }); d.tua(5); let s = null; for (let k = 0; k < 6 && !s; k++) { d.dat((tr) => { const em = tr.ghe[0]; if (em.cho > 0) { em.cho = 0; em.che = 0 } em.mau = 10; for (const g of tr.ghe) if (g.id !== 1 && g.cho <= 0) g.mau = Math.min(g.mau, 2) }); s = d.tuaToi((s) => s.t === 'ha' && s.boi === 1, 3) } d.tua(0.12) }, { TEN }) }, 'toi')
    await lam('k6', async (p) => { await p.evaluate(({ TEN }) => { const d = window.__dn; d.vaoTran({ tinh: true, emAI: true, hat: 1234, ten: TEN, nt: [3, 1, 2, 4, 5, 6] }); d.dat((tr) => { const ha = [7, 5, 4, 3, 2, 1]; tr.ghe.forEach((g, i) => { g.ha = ha[i]; g.capMax = [5, 4, 4, 3, 3, 2][i]; g.chuoiMax = [3, 2, 2, 1, 1, 1][i] }); tr.con = 3 }); d.tua(3.2); d.nghi(4) }, { TEN }) })
    const chu = ['1 · Bấm «Vào sân đấu» — vào ngay sân đang chơi', '2 · Kéo ở đâu cũng được để đi; súng tự ngắm, tự bắn', '3 · Nhặt đủ electron ⇒ súng lên cấp', '4 · Nhặt Xúc tác ⇒ lên ngay một cấp', '5 · Hạ bạn: vỡ bong bóng, «Hạ!», rơi electron', '6 · Hết ván 60 giây: xếp hạng, ván mới sau 6 giây']
    const html = `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#f6f6fc;font:700 15px 'DDH Rounded',system-ui,sans-serif;color:#1b1938}.g{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;padding:18px}figure{margin:0}img{width:100%;border-radius:14px;border:2px solid #e2e2f0;display:block}figcaption{margin-top:8px;line-height:1.35}h1{margin:16px 18px 0;font-size:22px}</style><h1>Đấu Nguyên Tử 2 — một ván trong 6 khung</h1><div class="g">${khung6.map((t, i) => `<figure><img src="${pathToFileURL(t).href}"><figcaption>${chu[i]}</figcaption></figure>`).join('')}</div>`
    const tepHtml = resolve(NHAP, 'kb.html'); writeFileSync(tepHtml, html)
    const ctx = await trinh.newContext({ viewport: { width: 1600, height: 760 }, deviceScaleFactor: 1 })
    const p = await ctx.newPage(); await p.goto(pathToFileURL(tepHtml).href); await cho(300)
    const h = await p.evaluate(() => document.body.scrollHeight); await p.setViewportSize({ width: 1600, height: h })
    await ghi(p, '8-kich-ban-6-khung')
    await ctx.close()
  }
  writeFileSync(resolve(RA, 'kiem.json'), JSON.stringify({ luc: new Date().toISOString(), loiTrang: loi, anh: bang }, null, 1))
  console.log(JSON.stringify({ loi, anh: bang.map((b) => `${b.anh.split('/').pop()} ${b.kb}KB tran=${b.tran} nho=${b.nho.length}`) }, null, 1))
}

if (process.argv.includes('--do')) {
  // Đo khung hình thật (vòng requestAnimationFrame của bản thử, trận 6 nguyên tử, A.I lái cả «Em») ở 390 × 844, DPR 2, CPU ×1 và ×4.
  const kq = []
  for (const [cpu, yeu, tuHa] of [[1, false, false], [1, true, false], [4, false, false], [4, false, true], [4, true, false], [6, true, false]]) {
    const ctx = await trinh.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })
    const p = await ctx.newPage()
    const cdp = await ctx.newCDPSession(p)
    await p.goto(`${URL_}?nen=toi${yeu ? '&yeu=1' : ''}${tuHa ? '' : '&tuHa=0'}`); await p.evaluate(() => document.fonts.ready)
    await p.evaluate(() => { window.__dn.vaoTran({ emAI: true, hat: 4242 }) })
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    await cho(2500)
    await p.evaluate(() => window.__dn.xoaDo())
    await cho(8000)
    const d = await p.evaluate(() => window.__dn.doKhung())
    const s = [...d].sort((a, b) => a - b), q = (x) => s[Math.min(s.length - 1, Math.floor(s.length * x))]
    const tb = d.reduce((a, b) => a + b, 0) / d.length
    const daTuHa = await p.evaluate(() => !!window.__dn.daTuHa)
    kq.push({ cpu, cheDo: yeu ? 'máy yếu' : tuHa ? (daTuHa ? 'thường ⇒ tự hạ sang máy yếu' : 'thường (tự hạ bật, không cần hạ)') : 'thường (tắt tự hạ)', soKhung: d.length, khungMoiGiay: Math.round(1000 / tb), trungViMs: +q(0.5).toFixed(1), p95Ms: +q(0.95).toFixed(1), toiDaMs: +s[s.length - 1].toFixed(1) })
    await ctx.close()
  }
  writeFileSync(resolve(RA, 'do-khung.json'), JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'Chromium không giao diện trong máy chủ (vẽ bằng CPU, không GPU) — chậm hơn điện thoại thật; khung nhìn 390×844 DPR 2, sân vẽ DPR 1,5 (máy yếu: DPR 1, trần 30 khung/giây). Đo 8 giây sau 2,5 giây làm nóng, trận 6 nguyên tử, A.I lái cả «Em».', kq }, null, 1))
  console.log(JSON.stringify(kq, null, 1))
}
await trinh.close()
