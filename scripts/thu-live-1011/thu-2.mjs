#!/usr/bin/env node
// BỘ THỬ LIVE — SỬA KHẨN 11/11 (thầy test máy thật) + ba chỗ lệch 1B. Chromium THẬT, BA TRANG (thầy + hai máy em) qua phòng THẬT chạy trong Node
// (may-chu.mjs). Dữ liệu giả, không chạm máy chủ thật. Thay cho kịch bản «em gửi xong vẫn ở màn câu hỏi» của thu.mjs (luật màn đã đổi 11/11).
//   npx vite build --config scripts/thu-live-1011/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/thu-live-1011/thu-2.mjs <thư mục tạm> [thư mục ảnh = docs/ban-ve-live-1011] [tệp số đo = docs/ban-ve-live-1011/so-do-that-2.json]
// Kịch bản: bật live ⇒ thanh màn chiếu gom vào một nút (K5) ⇒ máy em đang làm: tay nắm MÉP TRÊN, trên đầu thẻ đội / tên (K4 + M3 — thầy 11/11 lần 2) ⇒ em GỬI ⇒ tự về bảng live (K1), giấy đề soi đúng
// giấy thầy (B1) ⇒ thầy gạch chân trên giấy ⇒ nét khớp chữ ⇒ thầy gọi lên bảng ⇒ em CHƯA gửi bị ép vào bảng live, có dải đoán / tiếp sức (K2, B3) ⇒
// tạm dừng / tiếp tục / kết thúc trong cửa sổ nút Live (K3) ⇒ em rời màn ⇒ thẻ ghi kiểu rời (B2) ⇒ chạm hai lần phóng bảng.
// KHÔNG kiểm được ở đây: TIẾNG (cửa /bpu/live của máy chủ thử trả «chưa cấu hình» — cần Cloudflare Realtime SFU thật + mic thật), khoá xoay Android, iPhone thật.
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { moMayChu } from './may-chu.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const DIST = resolve(process.argv[2] ?? 'dist-thu-live')
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-live-1011'))
const SO_DO = resolve(process.argv[4] ?? join(ANH, 'so-do-that-2.json'))
mkdirSync(ANH, { recursive: true })
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const ket = [], loiTrang = [], soDo = {}
const kiem = (ten, dat, them = '') => { ket.push({ ten, dat: !!dat, them }); console.log(`${dat ? '✓' : '✗'} ${ten}${them ? ' — ' + them : ''}`) }

const may = await moMayChu({ dist: DIST })
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined, args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const chanNgoai = (ctx) => ctx.route((u) => !u.href.startsWith(may.goc), (r) => r.abort())
async function chup(t, ten, tuy = {}) {
  let q = 86, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q, ...tuy }); q -= 6 } while (buf.length > 150 * 1024 && q > 30)
  writeFileSync(join(ANH, `that-2-${ten}.jpg`), buf)
  console.log(`  ảnh that-2-${ten}.jpg ${Math.round(buf.length / 1024)} KB`)
}
// Chữ của câu TRÙNG với câu trên tờ chiếu của trang thử (scripts/thu-live-1011/trang.tsx) — như thật: tờ và lượt cùng lấy một câu của kho.
const CAU = [
  { qid: 'Q1', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Alcohol nào sau đây là alcohol bậc II?', choices: ['CH₃–CH₂–OH', 'CH₃–CH(OH)–CH₃', '(CH₃)₃C–OH', 'CH₃–OH'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Bậc alcohol', mucDo: 'hieu', sao: 2, kienThuc: [] },
  { qid: 'Q2', maDe: 'm', version: '1', group: 'g', phan: 'I', text: 'Phenol (C₆H₅OH) tác dụng được với dung dịch nào sau đây?', choices: ['NaCl', 'NaOH', 'HCl', 'NaHCO₃'], ideas: [], hinhAnh: [], dang: null, tenDang: 'Phenol', mucDo: 'hieu', sao: 2, kienThuc: [] },
]
async function trangEm(sbd, w, h, dpr) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: true })
  await chanNgoai(ctx)
  const t = await ctx.newPage()
  t.on('pageerror', (e) => loiTrang.push(`em ${sbd}: ${e.message}`))
  // Mốc giờ: lúc lớp bảng live (`.lv`) gắn vào trang, lúc dải «Thầy tạm dừng live» hiện / mất, lúc em bấm Gửi, lúc tin phòng tới.
  await t.addInitScript(() => {
    const M = (window.__moc = { lv: 0, lvMat: 0, nghi: 0, nghiMat: 0, gui: 0, tin: 0 })
    const xem = () => {
      const co = !!document.querySelector('.lv'), nghi = [...document.querySelectorAll('.lv-bao')].some((e) => (e.textContent || '').includes('Thầy tạm dừng live'))
      if (co && !M._lv) M.lv = performance.now(); if (!co && M._lv) M.lvMat = performance.now(); M._lv = co
      if (nghi && !M._ng) M.nghi = performance.now(); if (!nghi && M._ng) M.nghiMat = performance.now(); M._ng = nghi
    }
    new MutationObserver(xem).observe(document, { subtree: true, childList: true, characterData: true })
    document.addEventListener('click', (e) => { if (e.target && e.target.closest && e.target.closest('.bpu-gui-noi')) M.gui = performance.now() }, true)
    const Ws = window.WebSocket
    window.WebSocket = class extends Ws { constructor(u, p) { super(u, p); this.addEventListener('message', () => { M.tin = performance.now() }) } }
  })
  await t.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=em&sbd=${sbd}`)
  return { t, ctx }
}
async function emGui(t) {
  await t.getByRole('radio', { name: /^B/ }).first().click({ timeout: 8000 }).catch(async () => { await t.locator('.ht2-lam-pa button, .ht2-lam-lc button').nth(1).click() })
  await t.locator('.bpu-gui-noi[data-hien="true"]').click({ timeout: 8000 })
}
const moc = (t) => t.evaluate(() => ({ ...window.__moc, nay: performance.now() }))

// ───────────── THẦY ─────────────
const ctxThay = await trinh.newContext({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1, permissions: ['microphone'] })
await chanNgoai(ctxThay)
const thay = await ctxThay.newPage()
thay.on('pageerror', (e) => loiTrang.push(`thầy: ${e.message}`))
await thay.goto(`${may.goc}/scripts/thu-live-1011/trang.html?vai=thay`)
const to = thay.frameLocator('iframe')
await to.locator('body[data-bo-cuc="xong"]').waitFor({ timeout: 20000 })
await to.locator('.mc-lv-nut').waitFor({ state: 'visible', timeout: 15000 })
const viTri = await to.locator('.mc-lv-nut').evaluate((e) => ({ trai: Math.round(e.getBoundingClientRect().left), dau: e.parentElement.firstElementChild === e }))
kiem('K4 · nút «Live» đứng ĐẦU thanh, sát mép trái màn chiếu', viTri.dau && viTri.trai < 60, `mép trái nút ${viTri.trai} px`)
await ngu(500)
await chup(thay, 'thay-chua-live-nut-live-trai-1366')

// ───────────── HAI MÁY EM (lượt đang mở, chưa gửi) ─────────────
await may.moLuot(CAU[0], 'B')
const em = await trangEm('S1', 844, 390, 2)
await em.t.locator('.bpu-hs').waitFor({ timeout: 20000 })
const em2 = await trangEm('S2', 390, 844, 3)
await em2.t.locator('.bpu-hs').waitFor({ timeout: 20000 })

// ───────────── BẬT LIVE ─────────────
await to.locator('.mc-lv-nut').click()
await to.locator('.mc-lv-the').waitFor({ state: 'visible', timeout: 8000 })
await ngu(600)
const theTrai = await to.locator('.mc-lv-the').evaluate((e) => Math.round(e.getBoundingClientRect().left))
kiem('K4 · cửa sổ của nút Live neo MÉP TRÁI', theTrai < 40, `mép trái cửa sổ ${theTrai} px`)
await chup(thay, 'thay-cua-so-bat-live-trai-1366')
await to.locator('.mc-lv-the [data-lv="bat-dau"]').click().catch(() => to.locator('.mc-lv-the [data-lv="khong-tieng"]').click())
await to.locator('.mc-lv-cum b#mc-lv-dh').waitFor({ timeout: 10000 })
await ngu(500)
// K5: thanh gom vào một nút
const an = async () => to.locator('#mc-phim-nhom, #mc-len-bang, #mc-cai-btn').evaluateAll((ds) => ds.filter((e) => e.getClientRects().length > 0).length)
kiem('K5 · đang live: thanh dưới gom — nhóm phím / «Lên bảng» / «Cài đặt» ẩn sau MỘT nút lưới', await an() === 0 && await to.locator('.mc-lv-gon').isVisible())
await chup(thay, 'thay-thanh-gom-1366')
await to.locator('.mc-lv-gon').click()
await ngu(350)
kiem('K5 · bấm nút lưới ⇒ các nút xoè ra, không tràn màn 1366', await an() >= 2 && await to.locator('#mc-cai-btn').evaluate((e) => e.getBoundingClientRect().right <= 1366))
await chup(thay, 'thay-thanh-xoe-1366')
await thay.mouse.click(600, 300)
await ngu(250)
kiem('K5 · bấm ra ngoài thanh ⇒ thu lại', await an() === 0)
await thay.keyboard.press('g'); await ngu(500)
kiem('K5 · phím tắt vẫn chạy khi thanh gom (G mở lời giải)', await to.locator('.mc-giai:not([hidden])').count() > 0)
await thay.keyboard.press('g'); await ngu(500)

// ───────────── K4 + M3: máy em đang làm bài — chỉ còn tay nắm giữa MÉP TRÊN, ngay trên đầu thẻ đội / tên ─────────────
/** Hộp của viên tay nắm + các thứ nó không được đè (thẻ đội / tên ở đầu màn, nút «Gửi», giấy đề). */
const hopNam = (t) => t.evaluate(() => {
  const h = (k) => { const e = document.querySelector(k); if (!e) return null; const r = e.getBoundingClientRect(); return r.width ? [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)] : null }
  return { vien: h('.lv-nam i'), nam: h('.lv-nam'), tieu: h('.bpu-hs-tieu'), kj: h('.bpu-hs-kj'), lua: h('.bpu-hs-tren .bpu-lua'), gui: h('.bpu-gui-noi'), giay: h('.lv-giay'), bang: h('.lv-bang'), w: innerWidth, h: innerHeight }
})
const de = (a, b) => !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
await em2.t.locator('.lv-phu.lv-dau .lv-nam').waitFor({ timeout: 8000 })
const n2 = await hopNam(em2.t)
kiem('M3 · máy em đang làm bài: tay nắm nằm giữa MÉP TRÊN (không viên nổi đáy màn, không còn ở mép trái), chưa vào bảng', n2.vien[1] <= 8 && Math.abs((n2.vien[0] + n2.vien[2]) / 2 - n2.w / 2) <= 2 && await em2.t.locator('.lv').count() === 0 && await em2.t.locator('.lv-dau-cu, .lv-bat-tieng').count() === 0, `viên ${JSON.stringify(n2.vien)}`)
kiem('M3 · tay nắm ở trên đầu thẻ đội / tên: không đè chữ thẻ, không đè ô kJ, không đè ngọn lửa đội, không đè nút «Gửi»', !de(n2.vien, n2.tieu) && !de(n2.vien, n2.kj) && !de(n2.vien, n2.lua) && !de(n2.nam, n2.gui), JSON.stringify({ tieu: n2.tieu, kj: n2.kj, gui: n2.gui }))
await chup(em2.t, 'em-cau-hoi-tay-nam-tren-390')
await em2.t.locator('.lv-phu .lv-nam').tap()
await em2.t.locator('.lv-phu .lv-khay[data-mo]').waitFor({ timeout: 4000 })
await ngu(450)
kiem('M3 · chạm tay nắm ⇒ khay xổ từ mép trên xuống, có «Thầy đang live»', (await em2.t.locator('.lv-phu .lv-khay').innerText()).includes('Thầy đang live') && await em2.t.locator('.lv-phu .lv-khay').evaluate((e) => { const r = e.getBoundingClientRect(); return r.top >= 0 && r.top < 30 && Math.abs((r.left + r.right) / 2 - innerWidth / 2) <= 2 }))
await chup(em2.t, 'em-cau-hoi-khay-tren-mo-390')
await ngu(3300)
kiem('K4 · khay tự ẩn sau 3 giây', await em2.t.locator('.lv-phu .lv-khay[data-mo]').count() === 0)

// ───────────── K1: em gửi ⇒ tự về bảng live ─────────────
await ngu(1200) // thầy bật live đã quá 1,5 giây ⇒ lần vào bảng này phải «tức thì», không viên chào
await emGui(em.t)
await em.t.locator('.lv').waitFor({ timeout: 4000 })
const m1 = await moc(em.t)
soDo.k1_gui_toi_bang_ms = Math.round((m1.lv - m1.gui) * 10) / 10
kiem('K1 · em bấm Gửi ⇒ máy em TỰ về bảng live (≤ 200 ms từ cú bấm)', m1.lv > 0 && m1.gui > 0 && m1.lv - m1.gui <= 200, `${soDo.k1_gui_toi_bang_ms} ms`)
kiem('K6 · vào bảng sau khi gửi: không có viên «Thầy đang live» chớp giữa màn', await em.t.locator('.lv-vao').count() === 0)
await ngu(700)
kiem('B3 · dải lượt trên bảng live ghi «Đã gửi · n/8 bạn đã gửi»', /Đã gửi · \d+\/\d+ bạn đã gửi/.test(await em.t.locator('.lv-luot').innerText()))
// B1: giấy đề máy em soi đúng giấy thầy
await em.t.locator('.lv[data-soi]').waitFor({ timeout: 6000 }).catch(() => {})
const soi = await em.t.evaluate(() => ({ soi: !!document.querySelector('.lv[data-soi]'), khop: !!document.querySelector('.lv-gt[data-khop]'), giay: document.querySelector('.lv')?.getAttribute('data-giay') }))
kiem('B1 · giấy đề máy em dựng theo số đo giấy thầy và TỰ KIỂM khớp (nét trên giấy được giữ)', soi.soi && soi.khop, JSON.stringify(soi))
// So từng dòng chữ: vị trí tương đối (‰ bề rộng giấy) của đề + 4 phương án trên tờ thầy và trên máy em
const doThay = await to.locator('body').evaluate(() => {
  const g = document.querySelector('.mc-dot:not([hidden]) .mc-vung-de') || document.querySelector('.mc-vung-de'), G = g.getBoundingClientRect()
  return [...g.querySelectorAll('.mc-than .mc-de, .mc-than .mc-pa-chu')].map((e) => { const r = e.getBoundingClientRect(); return [(r.left - G.left) / G.width, (r.top - G.top) / G.width, r.width / G.width, r.height / G.width].map((v) => Math.round(v * 1000)) })
})
const doEm = await em.t.evaluate(() => {
  const g = document.querySelector('.lv-giay'), G = g.getBoundingClientRect()
  return [...g.querySelectorAll('.lv-gt-chu:not(.ngan)')].map((e) => { const r = e.getBoundingClientRect(); return [(r.left - G.left) / G.width, (r.top - G.top) / G.width, r.width / G.width, r.height / G.width].map((v) => Math.round(v * 1000)) })
})
const lech = doThay.length === doEm.length && doThay.length > 0 ? Math.max(...doThay.flatMap((a, i) => a.map((v, j) => Math.abs(v - doEm[i][j])))) : -1
soDo.b1_so_khoi_chu = doThay.length; soDo.b1_lech_lon_nhat_phan_nghin_be_rong_giay = lech
kiem('B1 · mọi khối chữ (đề + phương án) trên máy em nằm đúng chỗ như giấy thầy (lệch ≤ 4 ‰ bề rộng giấy)', lech >= 0 && lech <= 4, `${doThay.length} khối, lệch lớn nhất ${lech} ‰`)
// Thầy gạch chân chữ «alcohol bậc II» trên GIẤY bằng bút (chuột = bút), mực xanh cho dễ thấy trên giấy sáng ⇒ nét tới máy em, nằm trên giấy
await to.locator('.mc-m').nth(4).click().catch(() => {})
const hop = await to.locator('.mc-than .mc-de').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.bottom, w: r.width } })
await thay.mouse.move(hop.x + hop.w * 0.42, hop.y + 3); await thay.mouse.down()
for (let i = 1; i <= 24; i++) { await thay.mouse.move(hop.x + hop.w * (0.42 + 0.3 * i / 24), hop.y + 3 + Math.sin(i / 3) * 1.2); await ngu(8) }
await thay.mouse.up()
await ngu(900)
const mucGiay = await em.t.evaluate(() => {
  const c = document.querySelector('.lv-cv'), g = document.querySelector('.lv-giay').getBoundingClientRect(), k = c.width / c.getBoundingClientRect().width
  const d = c.getContext('2d').getImageData(Math.round(g.left * k), Math.round(g.top * k), Math.round(g.width * k), Math.round(g.height * k)).data
  let n = 0; for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 40) n++
  return n
})
kiem('B1 · thầy gạch chân trên giấy ⇒ nét hiện TRÊN GIẤY của máy em (giấy khớp nên không bị ẩn)', mucGiay > 10, `${mucGiay} mẫu điểm ảnh có mực trong ô giấy`)
await chup(thay, 'giay-thay-gach-chan-1366')
await chup(em.t, 'giay-em-khop-giay-thay-844')
await chup(em.t, 'em-khay-tren-dong-844')
const nb = await hopNam(em.t)
kiem('M3 · bảng live: tay nắm giữa MÉP TRÊN, không đè giấy đề, không đè bảng đen; không còn nút nổi nào trên bảng', nb.vien[1] <= 8 && Math.abs((nb.vien[0] + nb.vien[2]) / 2 - nb.w / 2) <= 2 && !de(nb.vien, nb.giay) && !de(nb.vien, nb.bang) && await em.t.locator('.lv > .lv-bat-tieng, .lv > .lv-noi').count() === 0, `viên ${JSON.stringify(nb.vien)} · giấy ${JSON.stringify(nb.giay)}`)
await em.t.locator('.lv .lv-nam').tap()
await em.t.locator('.lv .lv-khay[data-mo]').waitFor({ timeout: 4000 })
await ngu(450)
const khay = await em.t.locator('.lv .lv-khay').evaluate((e) => { const r = e.getBoundingClientRect(); return { tren: Math.round(r.top), duoi: Math.round(r.bottom), giua: Math.round((r.left + r.right) / 2), chu: e.innerText } })
kiem('M3 · khay xổ từ mép trên, nằm gọn trong màn: mạng · tiếng · đội + kJ', khay.tren >= 0 && khay.tren < 30 && khay.duoi <= 390 && Math.abs(khay.giua - 422) <= 2 && /kJ/.test(khay.chu), `${khay.tren}–${khay.duoi} px · ${khay.chu.replace(/\s+/g, ' ').slice(0, 80)}`)
await chup(em.t, 'em-khay-tren-mo-844')
await ngu(3300)
// các khổ máy khác: 667 × 375 (điện thoại 16:9) và 1180 × 820 (máy bảng) — tay nắm vẫn không đè giấy / bảng
for (const [w, h] of [[667, 375], [1180, 820]]) {
  await em.t.setViewportSize({ width: w, height: h }); await ngu(500)
  const k = await hopNam(em.t)
  kiem(`M3 · khổ ${w} × ${h}: tay nắm giữa mép trên, không đè giấy đề / bảng đen`, k.vien[1] <= 8 && !de(k.vien, k.giay) && !de(k.vien, k.bang), `viên ${JSON.stringify(k.vien)} · giấy ${JSON.stringify(k.giay)}`)
  if (w === 667) await chup(em.t, 'em-tay-nam-tren-667')
  else await chup(em.t, 'em-tay-nam-tren-1180')
}
await em.t.setViewportSize({ width: 844, height: 390 }); await ngu(500)

// ───────────── K2: thầy gọi lên bảng ⇒ em CHƯA gửi bị ép vào bảng live ─────────────
kiem('K2 · trước khi gọi: máy em S2 chưa gửi, còn ở màn làm bài', await em2.t.locator('.lv').count() === 0)
await em2.t.getByRole('radio', { name: /^A/ }).first().click({ timeout: 5000 }).catch(() => {}) // chọn dở, KHÔNG gửi
await thay.evaluate(() => window.__ws.send(JSON.stringify({ t: 'goi', sbd: 'S1', lyDo: ['Chưa lên bảng buổi này'] })))
await em2.t.locator('.lv').waitFor({ timeout: 4000 })
const m2 = await moc(em2.t)
soDo.k2_tin_phong_toi_bang_ms = Math.round((m2.lv - m2.tin) * 10) / 10
kiem('K2 · thầy gọi lên bảng ⇒ máy em chưa gửi vào bảng live NGAY (≤ 200 ms từ tin phòng)', Math.abs(m2.lv - m2.tin) <= 200, `${soDo.k2_tin_phong_toi_bang_ms} ms`)
const st = may.trangThai()
kiem('K2 · không ai gửi hộ đáp án em chọn dở (phòng không có bài của S2)', !st.luot.tra.S2 && !!st.luot.tra.S1)
await ngu(600)
kiem('B3 · bảng live không nuốt trò đoán / tiếp sức: dải «Em đoán … làm đúng không?» + «Làm đúng» · «Chưa đúng» · tiếp sức', /Em đoán .* làm đúng không\?/.test(await em2.t.locator('.lv-luot').innerText()) && await em2.t.locator('.lv-luot button').count() === 3)
await chup(em2.t, 'em-bi-ep-vao-live-dai-doan-390')
await em2.t.locator('.lv-luot button', { hasText: 'Làm đúng' }).tap()
await em2.t.locator('.lv-luot button.tiep').tap()
await ngu(500)
const g = may.trangThai().luot.goi
kiem('B3 · bấm trên dải ⇒ phòng nhận đoán + tiếp sức của S2', g.duDoan.S2 === 1 && (g.tiep.S2 ?? 0) >= 1, JSON.stringify({ doan: g.duDoan.S2, tiep: g.tiep.S2 }))
await chup(em2.t, 'em-da-doan-390')

// ───────────── K3: tạm dừng / tiếp tục / kết thúc trong cửa sổ nút Live ─────────────
await to.locator('.mc-lv-cum').click()
await to.locator('.mc-lv-the [data-lv="tam-dung"]').waitFor({ state: 'visible', timeout: 6000 })
await ngu(400)
kiem('K3 · bấm viên Live ⇒ cửa sổ có «Tạm dừng», «Kết thúc live», công tắc «Bảng → máy em»', /Tạm dừng/.test(await to.locator('.mc-lv-the').innerText()) && /Kết thúc live/.test(await to.locator('.mc-lv-the').innerText()))
await chup(thay, 'thay-cua-so-live-tam-dung-ket-thuc-1366')
const tBam = await em.t.evaluate(() => performance.now())
await to.locator('.mc-lv-the [data-lv="tam-dung"]').click()
await em.t.locator('.lv-bao', { hasText: 'Thầy tạm dừng live' }).waitFor({ timeout: 4000 })
const m3 = await moc(em.t)
soDo.k3_tam_dung_toi_may_em_ms = Math.round(m3.nghi - tBam)
kiem('K3 · «Tạm dừng» ⇒ máy em hiện «Thầy tạm dừng live» (≤ 500 ms kể từ lúc bấm)', m3.nghi - tBam <= 500, `${soDo.k3_tam_dung_toi_may_em_ms} ms`)
await ngu(400)
kiem('K3 · viên Live ghi «TẠM DỪNG», cửa sổ đổi thành «Tiếp tục»; phiên live giữ nguyên', /TẠM DỪNG/.test(await to.locator('.mc-lv-cum').innerText()) && /Tiếp tục/.test(await to.locator('.mc-lv-the').innerText()) && may.trangThai().live.bat === true)
await chup(thay, 'thay-dang-tam-dung-1366')
await chup(em.t, 'em-thay-tam-dung-844')
// Thầy viết lúc tạm dừng ⇒ máy em KHÔNG nhận; tiếp tục ⇒ nhận đủ
/** Số mẫu điểm ảnh có mực trong ô BẢNG ĐEN của máy em (lớp «đã chốt»). */
const mucBang = (t) => t.evaluate(() => {
  const c = document.querySelector('.lv-cv'), g = document.querySelector('.lv-bang').getBoundingClientRect(), k = c.width / c.getBoundingClientRect().width
  const d = c.getContext('2d').getImageData(Math.round(g.left * k), Math.round(g.top * k), Math.round(g.width * k), Math.round(g.height * k)).data
  let n = 0; for (let i = 3; i < d.length; i += 4 * 7) if (d[i] > 40) n++
  return n
})
const mucTruoc = await mucBang(em.t)
const bang = await to.locator('.mc-cot-lam-bai').first().evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height } })
await thay.mouse.move(bang.x + 40, bang.y + 120); await thay.mouse.down()
for (let i = 1; i <= 20; i++) { await thay.mouse.move(bang.x + 40 + i * 9, bang.y + 120 + Math.sin(i / 2) * 14); await ngu(8) }
await thay.mouse.up(); await ngu(500)
const mucLucDung = await mucBang(em.t)
kiem('K3 · đang tạm dừng: nét thầy viết lên bảng KHÔNG tới máy em', mucLucDung === mucTruoc, `mực trong ô bảng máy em ${mucTruoc} → ${mucLucDung}`)
const tBam2 = await em.t.evaluate(() => performance.now())
await to.locator('.mc-lv-the [data-lv="tam-dung"]').click()
await em.t.locator('.lv-bao', { hasText: 'Thầy tạm dừng live' }).waitFor({ state: 'detached', timeout: 4000 })
const m4 = await moc(em.t)
soDo.k3_tiep_tuc_toi_may_em_ms = Math.round(m4.nghiMat - tBam2)
await ngu(600)
const mucSau = await mucBang(em.t)
kiem('K3 · «Tiếp tục» ⇒ máy em hết dải dừng (≤ 500 ms), nét viết lúc dừng tới máy em một lượt', m4.nghiMat - tBam2 <= 500 && mucSau > mucLucDung + 5, `${soDo.k3_tiep_tuc_toi_may_em_ms} ms · mực trong ô bảng ${mucLucDung} → ${mucSau}`)
await to.locator('.mc-lv-the [data-lv="the-dong"]').click().catch(() => {})

// ───────────── B2: em rời màn ⇒ thẻ ghi kiểu rời ─────────────
const roi = (t, anDi) => t.evaluate((anDi) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => anDi }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (anDi ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); if (!anDi) window.dispatchEvent(new Event('focus')) }, anDi)
await roi(em2.t, true)
await to.locator('.mc-lv-roi-mo').waitFor({ timeout: 6000 })
const chuRoi = await to.locator('.mc-lv-roi-mo').innerText()
kiem('B2 · thẻ «em rời màn» ghi KIỂU rời (Chromium máy tính không phân biệt được khoá màn ⇒ «thoát app hoặc khoá màn»)', chuRoi.includes('Lê Gia Huy') && chuRoi.includes('thoát app hoặc khoá màn'), chuRoi.replace(/\s+/g, ' ').slice(0, 110))
await ngu(300)
await chup(thay, 'thay-roi-man-ghi-kieu-1366')
await roi(em2.t, false)
await em2.t.locator('.bpu-hs').tap({ position: { x: 200, y: 500 } }).catch(() => {})
await ngu(900)

// ───────────── Phóng bảng: chạm hai lần ─────────────
const oBang = await em.t.locator('.lv-bang').evaluate((e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width } })
await em.t.touchscreen.tap(oBang.x, oBang.y); await ngu(90); await em.t.touchscreen.tap(oBang.x, oBang.y)
await ngu(500)
const oBang2 = await em.t.locator('.lv-bang').evaluate((e) => e.getBoundingClientRect().width)
kiem('Chạm hai lần vào bảng đen ⇒ phóng bảng (ô bảng rộng hơn), có dòng «Chạm hai lần để về toàn cảnh»', oBang2 > oBang.w * 1.02 && (await em.t.locator('.lv-bao').allInnerTexts()).join(' ').includes('Chạm hai lần để về toàn cảnh'), `${Math.round(oBang.w)} → ${Math.round(oBang2)} px`)
await chup(em.t, 'em-phong-bang-844')
await em.t.touchscreen.tap(oBang.x, oBang.y); await ngu(90); await em.t.touchscreen.tap(oBang.x, oBang.y)
await ngu(400)

// ───────────── K1 (tiếp): câu mới ⇒ về màn câu hỏi; K3: kết thúc live ─────────────
await may.moLuot(CAU[1], 'B')
await em.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
kiem('Thầy chuyển câu ⇒ máy em về màn câu hỏi để làm (live còn, tay nắm mép trái)', await em.t.locator('.lv-phu.lv-dau').count() === 1 && await em.t.locator('.bpu-gui-noi').count() === 1)
await emGui(em.t)
await em.t.locator('.lv').waitFor({ timeout: 4000 })
const m5 = await moc(em.t)
soDo.k1_gui_toi_bang_lan_2_ms = Math.round((m5.lv - m5.gui) * 10) / 10
kiem('K1 · câu thứ hai: gửi xong lại tự về bảng live', m5.lv - m5.gui <= 200, `${soDo.k1_gui_toi_bang_lan_2_ms} ms`)
await to.locator('.mc-lv-cum').click()
await to.locator('.mc-lv-the [data-lv="tat"]').waitFor({ state: 'visible', timeout: 6000 })
await to.locator('.mc-lv-the [data-lv="tat"]').click()
await em.t.locator('.lv').waitFor({ state: 'detached', timeout: 6000 })
await ngu(400)
kiem('K3 · «Kết thúc live» bấm MỘT lần ⇒ hết live: máy em về màn Bình Phản Ứng, màn chiếu về nút «Live», thanh hết gom', may.trangThai().live.bat === false && await to.locator('.mc-lv-nut').isVisible() && await to.locator('.mc-lv-gon').isHidden() && await em.t.locator('.lv-phu').count() === 0)
await chup(thay, 'thay-sau-ket-thuc-1366')

// AN TOÀN: suốt kịch bản, trước khi thầy mở đáp án, không tin nào tới máy em mang đáp án
kiem('AN TOÀN · lượt đang mở: view máy em không có khoá đáp án / lời giải', await em2.t.evaluate(() => true) && !JSON.stringify(may.trangThai().luot.ketQua ?? null).includes('dung'))
kiem('Không lỗi JavaScript trên ba trang', loiTrang.length === 0, loiTrang.slice(0, 3).join(' | '))

const hong = ket.filter((k) => !k.dat)
writeFileSync(SO_DO, JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'Chromium thật, phòng thật trong Node, dữ liệu giả; KHÔNG có tiếng (SFU chưa cấu hình ở máy chủ thử).', soDo, kiem: ket }, null, 2) + '\n')
console.log(`\n${ket.length - hong.length}/${ket.length} phép kiểm đạt · số đo: ${JSON.stringify(soDo)}`)
await trinh.close(); await may.dong()
process.exit(hong.length ? 1 : 0)
