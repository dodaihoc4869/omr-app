#!/usr/bin/env node
// BỘ THỬ «EM LÊN BẢNG» (thầy 11/11: «khi bấm lên bảng hs đang ở màn live, tôi muốn bạn hiện một thông báo lên bảng ở giữa màn hình máy học sinh trong 3 giây
// cho tất cả máy học sinh trong live rồi tự thu nhỏ vào góc thẻ tên của học sinh đó, không chèn thẻ tên để học sinh biết»). Chromium THẬT: trang thầy (tờ
// chiếu thật) + sáu máy em qua phòng THẬT chạy trong Node (may-chu.mjs). Dữ liệu giả, không chạm máy chủ thật.
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-len-bang-1111.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-1011]
// Máy em: S1 844 × 390 (đã gửi, đang ở bảng live) · S2 iPhone dọc 390 × 844 xoay CSS (CHƯA gửi ⇒ bị ép vào live) · S3 667 × 375 · S4 máy tính 1971 × 1247 ·
// S5 844 × 390 = máy của CHÍNH em được gọi · S7 1180 × 820 · S6 vào MUỘN (sau khi tấm đã tan).
// Kiểm bằng HỘP BAO THẬT (đã đổi về trục của hình khi hình xoay): tấm giữa màn ≤ 40 % bề ngang, ở giữa, không chặn chạm, không dịch khung giấy; đứng 3 giây,
// thu ≤ 450 ms; sau đó dấu nhỏ đứng CẠNH thẻ tên (không giao nhau), cả hai NGOÀI khung bảng đen, không đè tay nắm / dải lượt; gọi em khác ⇒ thay tấm;
// em vào muộn ⇒ không phát lại; thầy chấm ⇒ dấu mất; lượt mới ⇒ thẻ mất. Ảnh: that-5-em-len-bang-*.jpg (JPG ≤ 150 KB).
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = []
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
async function chup(t, ten) {
  let q = 86, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 6 } while (buf.length > 150 * 1000 && q > 30)
  writeFileSync(join(ANH, `that-5-em-len-bang-${ten}.jpg`), buf)
  console.log(`  ảnh that-5-em-len-bang-${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}
const CAU = [
  { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] },
  { qid: 'Q2', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Phenol (C₆H₅OH) tác dụng được với dung dịch nào sau đây?', choices: ['NaCl', 'NaOH', 'HCl', 'NaHCO₃'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Phenol', mucDo: 'hieu', sao: 2, kienThuc: [] },
]
async function trangEm(sbd, w, h, dpr, them = '') {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: w < 1200 })
  await chanNgoai(ctx)
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`em ${sbd}: ${e.message}`))
  // Mốc giờ của tấm giữa màn: lúc hiện, lúc bắt đầu thu (data-thu / data-pha="thu"), lúc gỡ; số tấm nhiều nhất cùng lúc; tên trên từng tấm đã hiện.
  await t.addInitScript(() => {
    const M = (window.__lb = { hien: 0, thu: 0, mat: 0, nhieu: 0, ten: [], thu0: null, giuaThu: null, dap: null })
    // tâm hộp bao (px màn): khoảng cách hai tâm không đổi khi hình xoay 90° bằng CSS ⇒ so thẳng được, khỏi đổi trục
    const tamHop = (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height] }
    const xem = () => {
      const ds = document.querySelectorAll('.lv-lb-tam'), e = ds[0]
      M.nhieu = Math.max(M.nhieu, ds.length)
      if ((e && !M._co) || (e && M._e && e !== M._e)) { M.hien = performance.now(); M.thu = 0; M.mat = 0; M.ten.push(e.textContent); M._daThu = false; M.thu0 = null; M.giuaThu = null; M.dap = null }
      if (e && e.getAttribute('data-pha') === 'thu' && !M.thu) M.thu = performance.now()
      // vừa bắt đầu bay: ghi hộp lúc đầu + hộp sau 140 ms (giữa chừng) — đo ngay trong trang, không phụ thuộc tốc độ chụp ảnh
      if (e && e.hasAttribute('data-thu') && !M._daThu) {
        M._daThu = true; M.thu0 = tamHop(e)
        setTimeout(() => { const t = document.querySelector('.lv-lb-tam[data-thu]'), d = document.querySelector('.lv-lb-dau'); if (t) M.giuaThu = { tam: tamHop(t), dau: d ? tamHop(d) : null, mo: Number(getComputedStyle(t).opacity) } }, 140)
        // mẫu theo từng khung hình suốt lúc bay (dự phòng khi trình duyệt gỡ tấm trước khi kịp báo transitionend)
        const bd = performance.now(), d0 = document.querySelector('.lv-lb-dau')
        M.mau = []
        const lay = () => { const t = document.querySelector('.lv-lb-tam[data-thu]'); if (!t) return; M.mau.push([Math.round(performance.now() - bd), ...tamHop(t).map((v) => Math.round(v * 10) / 10)]); M.cuoi = { tam: tamHop(t), dau: d0 ? tamHop(d0) : null, ms: performance.now() - bd }; requestAnimationFrame(lay) }
        lay()
      }
      if (!e && M._co) M.mat = performance.now()
      M._co = !!e; M._e = e || null
    }
    new MutationObserver(xem).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-pha', 'data-thu'] })
    // CHỖ HẠ CÁNH: lúc phép dời của tấm chạy xong, tâm tấm phải trùng tâm dấu nhỏ cạnh thẻ tên
    document.addEventListener('transitionend', (ev) => {
      const t = ev.target
      if (!(t instanceof Element) || !t.classList.contains('lv-lb-tam') || ev.propertyName !== 'transform') return
      const d = document.querySelector('.lv-lb-dau')
      M.dap = { tam: tamHop(t), dau: d ? tamHop(d) : null }
    }, true)
  })
  await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}${them}`)
  await t.locator('.bpu-hs').waitFor({ timeout: 20000 })
  return { t, ctx, sbd, w, h }
}
async function emGui(t) {
  await t.getByRole('radio', { name: /^B/ }).first().click({ timeout: 8000 }).catch(async () => { await t.locator('.ht2-lam-pa button, .ht2-lam-lc button').nth(1).click() })
  await t.locator('.bpu-gui-noi[data-hien="true"]').click({ timeout: 8000 })
  await t.locator('.lv').waitFor({ timeout: 6000 })
}
/** Hộp bao theo TRỤC CỦA HÌNH (hình xoay 90° thuận kim: x hình = y máy, y hình = bề ngang máy − x máy) + vài thứ về tấm giữa màn. */
const hop = (t) => t.evaluate(() => {
  const lv = document.querySelector('.lv'), xoay = !!lv && lv.hasAttribute('data-xoay'), W = innerWidth
  const h = (k) => { const e = document.querySelector(k); if (!e) return null; const r = e.getBoundingClientRect(); if (!r.width && !r.height) return null; return (xoay ? [r.top, W - r.right, r.bottom, W - r.left] : [r.left, r.top, r.right, r.bottom]).map((v) => Math.round(v * 10) / 10) }
  const tam = document.querySelector('.lv-lb-tam'), dau = document.querySelector('.lv-lb-dau'), cs = tam ? getComputedStyle(tam) : null
  // điểm giữa tấm: phần tử nhận chạm ở đó KHÔNG được là tấm (pointer-events: none)
  let cham = null
  if (tam) { const r = tam.getBoundingClientRect(), o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); cham = !!o && (o === tam || tam.contains(o)) }
  return {
    xoay, w: xoay ? innerHeight : innerWidth, h: xoay ? innerWidth : innerHeight,
    tam: h('.lv-lb-tam'), the: h('.lv-lb-the'), dau: h('.lv-lb-dau'), dai: h('.lv-dau-bang'), bang: h('.lv-bang'), giay: h('.lv-giay'), nam: h('.lv-nam i'), luot: h('.lv-luot'),
    chuTam: tam ? [...tam.children].map((e) => e.textContent).join(' | ') : '', chuThe: document.querySelector('.lv-lb-the')?.textContent ?? '', chuDau: dau ? dau.textContent : '', nhanDau: dau?.getAttribute('aria-label') ?? '',
    dauMo: dau ? Number(getComputedStyle(dau).opacity) : -1, hep: !!document.querySelector('.lv-dau-bang[data-hep]'),
    cham, con: cs ? cs.pointerEvents : '', nenTam: cs ? cs.backgroundColor : '', vienTam: tam ? tam.style.getPropertyValue('--doi') : '', coChu: cs ? parseFloat(getComputedStyle(tam.querySelector('b')).fontSize) : 0,
    soTam: document.querySelectorAll('.lv-lb-tam').length, soThe: document.querySelectorAll('.lv-lb-the').length,
  }
})
const giao = (a, b) => !!a && !!b && a[0] < b[2] - 0.5 && a[2] > b[0] + 0.5 && a[1] < b[3] - 0.5 && a[3] > b[1] + 0.5
const lb = (t) => t.evaluate(() => ({ ...window.__lb, nay: performance.now() }))

// ───────────── THẦY ─────────────
const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
await may.moLuot(CAU[0], 'B')

// ───────────── MÁY EM ─────────────
const e1 = await trangEm('S1', 844, 390, 2), e2 = await trangEm('S2', 390, 844, 3), e3 = await trangEm('S3', 667, 375, 2)
const e4 = await trangEm('S4', 1971, 1247, 1), e5 = await trangEm('S5', 844, 390, 2), e7 = await trangEm('S7', 1180, 820, 2)
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await ngu(500)
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
await thay.mouse.click(600, 300); await ngu(400)
for (const e of [e1, e3, e4, e5, e7]) await emGui(e.t)
await ngu(900)
kiem('trước khi gọi: máy đã gửi ở bảng live, KHÔNG có thẻ tên / dải / tấm nào; máy S2 (chưa gửi) còn ở màn làm bài', (await hop(e1.t)).dai === null && (await hop(e1.t)).soTam === 0 && await e2.t.locator('.lv').count() === 0)

// thầy viết vài nét trên bảng đen (để ảnh có nét thật sát mép trên khung bảng — chỗ thẻ tên KHÔNG được đè)
const cot = await to.locator('.mc-cot-lam-bai').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
async function viet(x0, y0, dai, lech = 6) {
  await thay.mouse.move(x0, y0); await thay.mouse.down()
  for (let i = 1; i <= 16; i++) { await thay.mouse.move(x0 + dai * i / 16, y0 + Math.sin(i / 2) * lech); await ngu(8) }
  await thay.mouse.up(); await ngu(60)
}
await viet(cot.x + 14, cot.y + 8, cot.w * 0.5, 3) // nét sát mép TRÊN - TRÁI của bảng: đúng chỗ một thẻ đè lên bảng sẽ che
await viet(cot.x + cot.w * 0.55, cot.y + 10, cot.w * 0.38, 3) // sát mép trên - phải
await viet(cot.x + 30, cot.y + 70, cot.w * 0.6); await viet(cot.x + 30, cot.y + 120, cot.w * 0.45)
await ngu(2600) // quá 2 giây ⇒ khung bảng được ưu tiên (nở)
// hộp «trước khi gọi» đo SAU khi khung bảng đã nở (ưu tiên chỉ đổi khi thầy viết sang vùng kia ⇒ từ đây tới lúc gọi bố cục đứng yên)
const truoc = { e1: await hop(e1.t), e3: await hop(e3.t), e4: await hop(e4.t) }
/** Điểm ảnh MỰC trên lớp nét đã chốt của bảng trong dải 30 px sát mép trên khung bảng (px CSS) — phải còn nguyên sau khi thẻ tên hiện. */
const mucDauBang = (t) => t.evaluate(() => {
  const b = document.querySelector('.lv-bang'), c = b && b.querySelector('canvas')
  if (!c || !c.width) return -1
  const k = c.width / (parseFloat(c.style.width) || c.clientWidth || c.width), d = c.getContext('2d').getImageData(0, 0, c.width, Math.min(c.height, Math.round(30 * k))).data
  let n = 0
  for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++
  return n
})
const mucTruoc = await mucDauBang(e1.t)

// ───────────── GỌI S5 (Trần Minh Anh) LÊN BẢNG ─────────────
const tenDoi = (sbd) => { const e = may.trangThai().ds.find((x) => x.sbd === sbd); return ['Đội Natri', 'Đội Kali', 'Đội Đồng', 'Đội Canxi'][e.doi] }
const mauDoi = (sbd) => { const e = may.trangThai().ds.find((x) => x.sbd === sbd); return ['--p-cam', '--p-tim-2', '--p-xanh', '--p-do'][e.doi] }
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S5', lyDo: ['Chưa lên bảng buổi này'] })))
await e1.t.locator('.lv-lb-tam').waitFor({ timeout: 4000 })
await e2.t.locator('.lv .lv-lb-tam').waitFor({ timeout: 4000 })
await ngu(450) // hết chuyển động vào (0,24 giây)
const g = { e1: await hop(e1.t), e2: await hop(e2.t), e3: await hop(e3.t), e4: await hop(e4.t), e5: await hop(e5.t), e7: await hop(e7.t) }
const doi5 = tenDoi('S5')
kiem('TẤM GIỮA MÀN · mọi máy trong live (đã gửi, chưa gửi bị ép vào, máy tính, máy của em được gọi) đều có ĐÚNG MỘT tấm', Object.values(g).every((k) => k.soTam === 1))
kiem(`TẤM · máy bạn: tên đội + tên gọi hai chữ + «lên bảng» («${g.e1.chuTam}»), viền màu đội của em ĐƯỢC GỌI`, g.e1.chuTam === `${doi5} | Minh Anh | lên bảng` && g.e1.vienTam === `var(${mauDoi('S5')})`, `${g.e1.vienTam}`)
kiem(`TẤM · máy của CHÍNH em được gọi: chữ riêng («${g.e5.chuTam}»)`, g.e5.chuTam === `Em lên bảng | Minh Anh · ${doi5}`)
for (const [ten, k] of Object.entries(g)) {
  const rong = k.tam[2] - k.tam[0], giuaX = (k.tam[0] + k.tam[2]) / 2, giuaY = (k.tam[1] + k.tam[3]) / 2
  kiem(`TẤM · ${ten} ${k.w} × ${k.h}${k.xoay ? ' (xoay CSS)' : ''}: ở GIỮA hình, rộng ${Math.round(rong)} px = ${Math.round(rong / k.w * 100)} % ≤ 40 %, không chặn chạm, chữ tên ${k.coChu} px`,
    rong <= k.w * 0.4 + 0.5 && Math.abs(giuaX - k.w / 2) <= 1.5 && Math.abs(giuaY - k.h / 2) <= 1.5 && k.cham === false && k.con === 'none' && k.coChu >= 22 && k.tam[0] >= 0 && k.tam[3] <= k.h)
  kiem(`TẤM · ${ten}: không đè tay nắm mép phải, không đè dải lượt đáy; thẻ tên đã ở chỗ, dấu còn ẩn (chờ tấm bay về)`, !giao(k.tam, k.nam) && !giao(k.tam, k.luot) && !!k.the && k.dauMo === 0)
}
kiem('TẤM · không dịch khung GIẤY (hộp giấy trước / sau khi gọi y nguyên); khung bảng chỉ nhường 26 px phía trên cho dải thẻ tên', ['e1', 'e3', 'e4'].every((n) => JSON.stringify(truoc[n].giay) === JSON.stringify(g[n].giay) && Math.abs(g[n].bang[1] - truoc[n].bang[1] - 26) <= 0.6 && Math.abs(g[n].bang[3] - truoc[n].bang[3]) <= 0.6 && g[n].bang[0] === truoc[n].bang[0]),
  `844: giấy ${JSON.stringify(g.e1.giay)} · bảng ${JSON.stringify(truoc.e1.bang)} → ${JSON.stringify(g.e1.bang)}`)
// Tấm chỉ đứng 3 giây ⇒ lúc tấm còn giữa màn chỉ chụp ba máy (844, 1971, máy của em được gọi); ảnh 667 + iPhone xoay chụp ở pha «gọi em khác».
await chup(e1.t, 'tam-giua-man-844'); await chup(e4.t, 'tam-giua-man-1971'); await chup(e5.t, 'tam-giua-man-may-cua-em-844')

// giữa chừng lúc thu nhỏ: máy 844 báo NGAY lúc phép dời bắt đầu (bộ quan sát trong trang) rồi chụp liền — chụp mất một hai khung hình nên ảnh rơi vào
// giữa đường bay. Số đo kiểm lấy trong trang (không phụ thuộc tốc độ chụp); ảnh chỉ để nhìn.
const treChup = await e1.t.evaluate(() => new Promise((r) => {
  const xong = () => setTimeout(() => r(Math.round(performance.now() - window.__lb.thu)), 130)
  if (document.querySelector('.lv-lb-tam[data-thu]')) { xong(); return }
  const ob = new MutationObserver(() => { if (document.querySelector('.lv-lb-tam[data-thu]')) { ob.disconnect(); xong() } })
  ob.observe(document, { subtree: true, attributes: true, attributeFilter: ['data-thu'] })
}))
writeFileSync(join(ANH, 'that-5-em-len-bang-dang-thu-nho-844.jpg'), await e1.t.screenshot({ type: 'jpeg', quality: 80 }))
console.log(`  ảnh that-5-em-len-bang-dang-thu-nho-844.jpg (bắt đầu chụp ~${treChup} ms sau khi bắt đầu thu)`)
await ngu(900)
const kc = (a, b) => (a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : Infinity)
// số đo giữa chừng lấy ở máy 1180 + iPhone dọc xoay (máy 844 đang bị chụp ảnh — lúc chụp, trang ít khung hình, số đo lệch)
for (const e of [e7, e2]) {
  const m = await lb(e.t), t0 = m.thu0, t1 = m.giuaThu?.tam, d = m.giuaThu?.dau
  kiem(`THU NHỎ · ${e.sbd} giữa chừng (140 ms): tấm CÒN RÕ (độ mờ ${m.giuaThu?.mo}), nhỏ lại (${t0 && t1 ? Math.round(Math.max(t1[2], t1[3])) + ' / ' + Math.round(Math.max(t0[2], t0[3])) : '?'} px) và đang bay về phía dấu cạnh thẻ tên (cách ${Math.round(kc(t1, d))} px, lúc đầu ${Math.round(kc(t0, d))} px)`,
    !!t0 && !!t1 && !!d && m.giuaThu.mo >= 0.99 && Math.max(t1[2], t1[3]) < Math.max(t0[2], t0[3]) * 0.97 && kc(t1, d) < kc(t0, d) - 2)
}
kiem(`THU NHỎ · ảnh máy 844 chụp giữa đường bay (bắt đầu chụp ${treChup} ms sau khi bắt đầu thu)`, treChup >= 100 && treChup < 260)
for (const e of [e1, e2, e3, e4, e5, e7]) {
  const m = await lb(e.t)
  kiem(`THỜI GIAN · ${e.sbd}: tấm đứng ${Math.round(m.thu - m.hien)} ms (3 giây ± 0,25), thu trong ${Math.round(m.mat - m.thu)} ms (≤ 450 + một khung), chưa lúc nào có hai tấm`, m.hien > 0 && Math.abs(m.thu - m.hien - 3000) <= 250 && m.mat - m.thu > 0 && m.mat - m.thu <= 480 && m.nhieu === 1, JSON.stringify(m.ten))
  // hạ cánh: lúc phép dời chạy xong, tâm tấm trùng tâm dấu nhỏ (kể cả iPhone dọc xoay CSS — phép đo chuỗi offset theo trục của hình)
  const dap = m.dap ?? (m.cuoi && m.cuoi.ms >= 370 ? m.cuoi : null)
  kiem(`HẠ CÁNH · ${e.sbd}${e.w < e.h ? ' (iPhone dọc, hình xoay CSS)' : ''}: tấm bay về ĐÚNG chỗ dấu cạnh thẻ tên (lệch ${dap ? kc(dap.tam, dap.dau).toFixed(1) : '?'} px${m.dap ? '' : ', mẫu khung cuối'})`, !!dap && kc(dap.tam, dap.dau) <= 3, dap ? JSON.stringify(dap) : 'không bắt được lúc dời xong')
}

// ───────────── SAU KHI THU: thẻ tên + dấu nhỏ ─────────────
const s = { e1: await hop(e1.t), e2: await hop(e2.t), e3: await hop(e3.t), e4: await hop(e4.t), e5: await hop(e5.t), e7: await hop(e7.t) }
for (const [ten, k] of Object.entries(s)) {
  kiem(`SAU THU · ${ten} ${k.w} × ${k.h}${k.xoay ? ' (xoay CSS)' : ''}: tấm đã mất; thẻ «${k.chuThe}» + dấu «${k.hep ? '(hình) ' + k.nhanDau : k.chuDau}» hiện rõ`, k.soTam === 0 && k.soThe === 1 && k.chuThe === 'Minh Anh' && k.dauMo === 1 && k.nhanDau === (ten === 'e5' ? 'Em đang lên bảng' : 'đang lên bảng'))
  kiem(`SAU THU · ${ten}: dấu đứng CẠNH thẻ tên, KHÔNG đè thẻ (cách ${k.dau && k.the ? Math.round(k.dau[0] - k.the[2]) : '?'} px bên phải, cùng hàng)`, !giao(k.dau, k.the) && k.dau[0] >= k.the[2] + 3 && k.dau[0] - k.the[2] <= 10 && Math.abs((k.dau[1] + k.dau[3]) / 2 - (k.the[1] + k.the[3]) / 2) <= 1, `thẻ ${JSON.stringify(k.the)} · dấu ${JSON.stringify(k.dau)}`)
  kiem(`SAU THU · ${ten}: thẻ + dấu nằm NGOÀI khung bảng đen (ngay trên mép trên), không đè khung giấy, tay nắm, dải lượt; gọn trong dải và trong hình`,
    !giao(k.the, k.bang) && !giao(k.dau, k.bang) && k.the[3] <= k.bang[1] + 0.5 && k.dau[3] <= k.bang[1] + 0.5 && !giao(k.the, k.giay) && !giao(k.dau, k.giay) && !giao(k.dau, k.nam) && !giao(k.the, k.luot) && !giao(k.dau, k.luot)
    && k.the[0] >= k.dai[0] && k.dau[2] <= k.dai[2] + 0.5 && k.the[1] >= 0 && k.dau[2] <= k.w, `dải ${JSON.stringify(k.dai)} · bảng ${JSON.stringify(k.bang)}`)
  kiem(`SAU THU · ${ten}: dấu RẤT NHỎ (cao ${k.dau ? Math.round(k.dau[3] - k.dau[1]) : '?'} px, rộng ${k.dau ? Math.round(k.dau[2] - k.dau[0]) : '?'} px), thẻ cao ${k.the ? Math.round(k.the[3] - k.the[1]) : '?'} px`, k.dau[3] - k.dau[1] <= 24 && k.dau[2] - k.dau[0] <= 130 && k.the[3] - k.the[1] <= 24)
}
kiem('KHÔNG CHE NÉT · mực của thầy sát mép trên khung bảng còn nguyên sau khi thẻ tên hiện (đếm điểm ảnh mực trong 30 px đầu của lớp nét bảng)', mucTruoc > 0 && Math.abs(await mucDauBang(e1.t) - mucTruoc) <= mucTruoc * 0.02, `${mucTruoc} → ${await mucDauBang(e1.t)} điểm ảnh`)
await chup(e1.t, 'sau-thu-dau-canh-the-844'); await chup(e3.t, 'sau-thu-dau-canh-the-667'); await chup(e2.t, 'sau-thu-dau-canh-the-iphone-doc-xoay-390'); await chup(e5.t, 'sau-thu-may-cua-em-844'); await chup(e4.t, 'sau-thu-dau-canh-the-1971'); await chup(e7.t, 'sau-thu-dau-canh-the-1180')
{ // chạm hai lần phóng kín bảng ⇒ thẻ + dấu vẫn ngoài khung bảng; khay mở không vỡ
  const ob = await e1.t.locator('.lv-bang').evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  await e1.t.touchscreen.tap(ob.x, ob.y); await ngu(90); await e1.t.touchscreen.tap(ob.x, ob.y); await ngu(700)
  const p = await hop(e1.t)
  kiem('PHÓNG KÍN BẢNG (chạm hai lần) · thẻ + dấu đi theo khung bảng, vẫn ngoài mép trên, không đè nhau', !giao(p.the, p.bang) && !giao(p.dau, p.bang) && !giao(p.the, p.dau) && p.bang[2] - p.bang[0] > s.e1.bang[2] - s.e1.bang[0] + 50 && Math.abs(p.the[0] - p.bang[0]) <= 12, `bảng ${JSON.stringify(p.bang)} · thẻ ${JSON.stringify(p.the)}`)
  await chup(e1.t, 'phong-kin-bang-844')
  const ob2 = await e1.t.locator('.lv-bang').evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 } })
  await e1.t.touchscreen.tap(ob2.x, ob2.y); await ngu(90); await e1.t.touchscreen.tap(ob2.x, ob2.y); await ngu(700)
  await e1.t.locator('.lv .lv-nam').tap(); await e1.t.locator('.lv .lv-khay[data-mo]').waitFor({ timeout: 4000 }); await ngu(350)
  await chup(e1.t, 'khay-mo-844')
  await e1.t.touchscreen.tap(200, 200); await ngu(350)
}

// ───────────── EM VÀO MUỘN ─────────────
const e6 = await trangEm('S6', 844, 390, 2)
await e6.t.locator('.lv .lv-lb-the').waitFor({ timeout: 8000 })
await ngu(700)
const muon = await hop(e6.t), mMuon = await lb(e6.t)
kiem('VÀO MUỘN · máy vào sau khi đã có bạn đang lên bảng: KHÔNG phát lại tấm giữa màn, chỉ thẻ tên + dấu nhỏ', muon.soTam === 0 && mMuon.hien === 0 && mMuon.nhieu === 0 && muon.chuThe === 'Minh Anh' && muon.dauMo === 1 && !giao(muon.dau, muon.the))
await chup(e6.t, 'vao-muon-chi-the-va-dau-844')

// ───────────── GỌI EM KHÁC: tấm mới THAY, kể cả lúc tấm cũ chưa tan ─────────────
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S3', lyDo: [] })))
await e1.t.locator('.lv-lb-tam').waitFor({ timeout: 4000 })
const lucS3 = Date.now()
await e2.t.locator('.lv .lv-lb-tam').waitFor({ timeout: 4000 })
await chup(e2.t, 'tam-giua-man-iphone-doc-xoay-390') // máy S2 (CHƯA gửi, bị ép vào bảng live) thấy tấm của bạn
await ngu(Math.max(0, 1200 - (Date.now() - lucS3)))
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S2', lyDo: [] }))) // tấm của S3 mới đứng ~1,2 giây
await ngu(600)
const thayTam = await hop(e1.t), mThay = await lb(e1.t)
kiem('GỌI EM KHÁC · lúc tấm cũ chưa tan ⇒ tấm mới thay ngay: vẫn MỘT tấm, tên mới «Gia Huy»; thẻ tên đổi theo; chưa lúc nào có hai tấm', thayTam.soTam === 1 && thayTam.chuTam === `${tenDoi('S2')} | Gia Huy | lên bảng` && thayTam.chuThe === 'Gia Huy' && thayTam.soThe === 1 && mThay.nhieu === 1 && mThay.ten.length === 3, JSON.stringify(mThay.ten))
const cuaS2 = await hop(e2.t), cuaS5 = await hop(e5.t)
kiem('GỌI EM KHÁC · máy của em vừa được gọi (S2, iPhone xoay) ghi «Em lên bảng»; máy của em cũ (S5) ghi tên bạn', cuaS2.chuTam === `Em lên bảng | Gia Huy · ${tenDoi('S2')}` && cuaS5.chuTam === `${tenDoi('S2')} | Gia Huy | lên bảng`)
await chup(e1.t, 'goi-em-khac-thay-tam-844'); await chup(e2.t, 'tam-giua-man-may-cua-em-iphone-doc-xoay-390'); await chup(e3.t, 'tam-giua-man-667')
await ngu(3300)
const sauThay = await hop(e1.t)
kiem('GỌI EM KHÁC · 3 giây tính lại từ lời gọi mới rồi thu về dấu cạnh thẻ «Gia Huy»', sauThay.soTam === 0 && sauThay.chuThe === 'Gia Huy' && sauThay.dauMo === 1)

// ───────────── HẾT LƯỢT GỌI ─────────────
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'dat', v: true })))
await ngu(700)
const cham = await hop(e1.t)
kiem('THẦY CHẤM · dấu «đang lên bảng» mất, thẻ tên còn; dải lượt (kết quả) giữ nguyên chỗ, không đè thẻ', cham.dau === null && cham.chuThe === 'Gia Huy' && cham.soTam === 0 && !giao(cham.the, cham.luot), `dải lượt ${JSON.stringify(cham.luot)}`)
await chup(e1.t, 'thay-cham-con-the-844')
kiem('AN TOÀN · thẻ / dấu / tấm không mang đáp án, không mang kết quả chấm', !/Đạt|đạt|kJ|đúng|sai|\bB\b/.test(`${cham.chuThe} ${s.e1.chuDau} ${g.e1.chuTam} ${g.e5.chuTam}`))
await may.moLuot(CAU[1], 'B')
await ngu(900)
await emGui(e1.t); await ngu(700)
const moi = await hop(e1.t)
kiem('LƯỢT MỚI · thẻ tên + dải mất; khung bảng cao lại như trước khi gọi', moi.the === null && moi.dai === null && moi.soTam === 0 && Math.abs((moi.bang[3] - moi.bang[1]) - (truoc.e1.bang[3] - truoc.e1.bang[1])) <= 0.6, `bảng ${JSON.stringify(moi.bang)}`)

// ───────────── MÁY YẾU: không bay ─────────────
const e8 = await trangEm('S8', 844, 390, 2, '&yeu=1')
await emGui(e8.t); await ngu(600)
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S1', lyDo: [] })))
await e8.t.locator('.lv-lb-tam').waitFor({ timeout: 4000 })
await ngu(500)
const yeu = await e8.t.evaluate(() => { const t = document.querySelector('.lv-lb-tam'), c = getComputedStyle(t); return { hoat: c.animationName, mo: c.backdropFilter || 'none', bong: c.boxShadow.split('rgb').length - 1 } })
await ngu(3100)
const yeuSau = await e8.t.evaluate(() => ({ thu: !!document.querySelector('.lv-lb-tam[data-thu]') }))
await ngu(600)
const yeuXong = await hop(e8.t)
kiem('MÁY YẾU · tấm không hoạt cảnh vào, không kính mờ, chỉ còn viền (một bóng); hết 3 giây tắt thẳng (không bay), dấu hiện', yeu.hoat === 'none' && yeu.mo === 'none' && yeu.bong === 1 && !yeuSau.thu && yeuXong.soTam === 0 && yeuXong.dauMo === 1, JSON.stringify(yeu))

kiem('không trang nào ném lỗi', loiTrang.length === 0, loiTrang.join(' | ').slice(0, 300))
await trinh.close(); await may.dong()
const hong = ket.filter((k) => !k.dat)
console.log(`\n${ket.length - hong.length}/${ket.length} mục đạt`)
if (hong.length) { console.log('HỎNG:\n' + hong.map((k) => ` · ${k.ten}${k.them ? ' — ' + k.them : ''}`).join('\n')); process.exit(1) }
