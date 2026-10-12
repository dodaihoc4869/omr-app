#!/usr/bin/env node
// KIỂM VUỐT THẬT — màn làm bài của học sinh (LÀN MÀN LÀM BÀI 12/10D; thầy 12/10 duyệt bản vẽ dot13). Chứng minh bằng Chromium THẬT, màn chạm:
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <thư mục tạm>
//   node scripts/kiem-vuot-lam-bai.mjs <thư mục tạm> [thư mục ảnh]
// Cảnh `?man=lam13&lam=ds-dau` (scripts/chup-v2/trang.tsx + gia/lam-bai-1210d.ts): component THẬT ManLamBaiTap trong ĐÚNG lớp bọc cuộn của cổng học sinh
// (`fixed inset-0 z-50 overflow-y-auto`), máy chủ giả. Điện thoại 390×844 (hasTouch, isMobile) + điện thoại xoay ngang 844×390.
// VUỐT = CDP `Input.synthesizeScrollGesture` nguồn `touch` (không gọi scrollTo / scrollIntoView). ĐỐI CHỨNG trước: Chromium headless ở máy này có thể
// KHÔNG cuộn bằng cử chỉ chạm tổng hợp, kể cả trên trang tối giản (đo 12/10: trang tối giản cuộn 0 px) ⇒ khi đó kéo ngón tay bằng CDP
// `Input.dispatchTouchEvent` (touchStart → 12 touchMove → touchEnd — đi đúng đường sự kiện chạm thật: bộ nghe touch, touch-action, cuộn của trình duyệt).
// CHẠM = touchscreen.tap tại toạ độ (không tự cuộn). Đạt khi: một khung cuộn dọc duy nhất · vuốt tới ý d, nút của ý d nằm trọn giữa thanh trên và thanh đáy, không bị che (elementFromPoint)
// · chạm đủ 4 ý ⇒ "Nộp câu" bật, thấy được · sau khi nộp vuốt tới nút cuối "Xem lời giải đầy đủ cả 4 ý", mở lời giải, vuốt tới đáy: phần tử cuối nằm TRÊN
// thanh đáy · vuốt ngược về đầu (scrollTop 0) · câu trả lời ngắn: bàn phím số ở thanh đáy, 4 ô không bị che. Thoát mã 1 nếu hỏng một điều.
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const DIST = resolve(process.argv[2] ?? 'dist-chup-v2')
const ANH = process.argv[3] ? resolve(process.argv[3]) : ''
if (ANH) mkdirSync(ANH, { recursive: true })
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const PUB = resolve(import.meta.dirname, '../public')
const may = createServer((req, res) => {
  const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  const p = join(DIST, duong), pub = join(PUB, duong)
  const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  if (duong === '/doi-chung-vuot.html') { res.writeHead(200, { 'content-type': 'text/html' }); res.end('<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><body style="margin:0"><div id=k style="position:fixed;inset:0;overflow-y:auto"><div style="height:3000px">x</div></div>'); return }
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })

const hong = []
const ghi = []
const dat = (dk, chu) => { (dk ? ghi : hong).push(`${dk ? 'ĐẠT ' : 'HỎNG'} · ${chu}`) }
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

/** Một lần vuốt từ (x, y) dịch dy px (dy < 0 = ngón kéo lên ⇒ xem phần dưới). */
async function vuotCdp(cdp, cachVuot, x, y, dy) {
  if (cachVuot === 'cu-chi') {
    await cdp.send('Input.synthesizeScrollGesture', { x, y, xDistance: 0, yDistance: dy, speed: 1600, gestureSourceType: 'touch', preventFling: true })
    return
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.round(y + (dy * i) / 12) }] }); await cho(16) }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}

/** ĐỐI CHỨNG: cử chỉ chạm tổng hợp có cuộn nổi một trang tối giản ở Chromium này không. */
async function chonCachVuot() {
  const ctx = await trinh.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const t = await ctx.newPage()
  await t.goto(`${goc}/doi-chung-vuot.html`)
  const cdp = await ctx.newCDPSession(t)
  await vuotCdp(cdp, 'cu-chi', 130, 600, -300)
  await t.waitForTimeout(400)
  const cuChi = await t.evaluate(() => document.getElementById('k').scrollTop)
  await vuotCdp(cdp, 'keo', 130, 600, -300)
  await t.waitForTimeout(400)
  const keo = (await t.evaluate(() => document.getElementById('k').scrollTop)) - cuChi
  await ctx.close()
  const cach = cuChi > 0 ? 'cu-chi' : 'keo'
  ghi.push(`ĐỐI CHỨNG · trang tối giản: synthesizeScrollGesture(touch) cuộn ${cuChi}px · kéo ngón Input.dispatchTouchEvent cuộn ${keo}px ⇒ dùng ${cach === 'cu-chi' ? 'synthesizeScrollGesture' : 'Input.dispatchTouchEvent (cử chỉ tổng hợp không chạy ở Chromium headless này)'}`)
  if (cuChi <= 0 && keo <= 0) hong.push('HỎNG · đối chứng: Chromium này không cuộn được trang tối giản bằng cách nào — kịch bản không kết luận được')
  return cach
}
const CACH_VUOT = await chonCachVuot()

async function kiemKho(w, h, ten) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, colorScheme: 'light' })
  await ctx.route((u) => !u.href.startsWith(goc), (r) => r.abort())
  const t = await ctx.newPage()
  t.setDefaultTimeout(15000)
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  const cdp = await ctx.newCDPSession(t)
  await t.goto(`${goc}/scripts/chup-v2/trang.html?man=lam13&lam=ds-dau`)
  await t.getByRole('heading', { name: 'Chặng 2 · Câu 1/3' }).waitFor()
  await t.waitForTimeout(300)

  /** Khung cuộn (lớp bọc của cổng) + số đo. */
  const khung = () => t.evaluate(() => { const k = document.querySelector('.ht2-lam').parentElement; return { top: k.scrollTop, cao: k.scrollHeight, nhin: k.clientHeight } })
  /** Đỉnh vùng nội dung (đáy thanh trên) và đáy vùng nội dung (đỉnh thanh đáy khi thanh đáy nằm dưới; màn hai cột ⇒ đáy màn). */
  const vung = () => t.evaluate(() => {
    const tren = document.querySelector('.ht2-lam-tren').getBoundingClientRect()
    const day = document.querySelector('.ht2-lam-day')?.getBoundingClientRect()
    const duoi = day && day.top > innerHeight / 2 && day.left < 10 ? day.top : innerHeight
    return { tren: tren.bottom, duoi }
  })
  /** Phần tử nằm TRỌN trong vùng nội dung (nút của thanh đáy: trọn trong màn) và điểm giữa không bị gì che (thanh đáy, thanh trên). */
  const thayRo = async (loc, laNutThanh = false) => {
    const b = await loc.boundingBox()
    if (!b) return false
    const v = laNutThanh ? { tren: 0, duoi: h } : await vung()
    const giuaKhongChe = await loc.evaluate((el) => { const r = el.getBoundingClientRect(); const o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!o && (o === el || el.contains(o)) })
    return b.y >= v.tren - 0.5 && b.y + b.height <= v.duoi + 0.5 && giuaKhongChe
  }
  /** Vuốt bằng ngón tay: dy < 0 = kéo lên (xem phần dưới), dy > 0 = kéo xuống (về đầu). Điểm đặt tay ở giữa vùng nội dung, cột trái. */
  const vuot = async (dy) => {
    const v = await vung()
    const x = Math.round(Math.min(w, 520) * 0.35), y = Math.round(dy < 0 ? v.duoi - 24 : v.tren + 24)
    await vuotCdp(cdp, CACH_VUOT, x, y, dy)
    await t.waitForTimeout(450)
  }
  const vuotToi = async (loc, huong = -1) => {
    for (let i = 0; i < 12; i++) { if (await thayRo(loc)) return i; await vuot(huong * Math.round(h * 0.4)) }
    return (await thayRo(loc)) ? 12 : -1
  }
  const cham = async (loc) => { const b = await loc.boundingBox(); await t.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); await t.waitForTimeout(200) }

  // 1 · một khung cuộn dọc duy nhất, nội dung dài hơn màn
  const soKhung = await t.evaluate(() => [...document.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return /(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1 }).length + (document.scrollingElement.scrollHeight > document.scrollingElement.clientHeight + 1 ? 1 : 0))
  const k0 = await khung()
  dat(soKhung === 1, `${ten}: số khung cuộn dọc = ${soKhung}; nội dung ${k0.cao}px trong khung ${k0.nhin}px`)
  dat(k0.cao > k0.nhin, `${ten}: nội dung dài hơn màn (cần vuốt mới tới ý d)`)
  const touchChan = await t.evaluate(() => [...document.querySelectorAll('.ht2-lam, .ht2-lam *')].filter((e) => /none|pan-x|pinch-zoom/.test(getComputedStyle(e).touchAction)).length)
  dat(touchChan === 0, `${ten}: không phần tử nào đặt touch-action chặn vuốt dọc (${touchChan})`)

  // 2 · vuốt tới ý d
  const yD = t.getByRole('group', { name: 'Chọn cho ý d' })
  const truoc = await thayRo(yD)
  const lan = await vuotToi(yD)
  const k1 = await khung()
  dat(lan >= 0 && k1.top > 0, `${ten}: vuốt ${lan} lần tới ý d (trước khi vuốt: ${truoc ? 'đã thấy' : 'chưa thấy'}; khung cuộn ${k1.top}px) — Đúng/Sai của ý d không bị thanh đáy che`)
  if (ANH && w < 500) await t.screenshot({ path: join(ANH, 'vuot-1-toi-y-d.jpg'), type: 'jpeg', quality: 60 })

  // 3 · chạm đủ 4 ý (vuốt về ý nào chưa thấy) ⇒ nút "Nộp câu" bật và thấy được
  for (const y of ['d', 'c', 'b', 'a']) {
    const nut = t.getByRole('group', { name: `Chọn cho ý ${y}` }).getByRole('button', { name: 'Đúng', exact: true }) // ý d đáp án Sai ⇒ phản hồi "sai ý d"
    if (!(await thayRo(nut))) await vuotToi(nut, 1)
    await cham(nut)
  }
  const nop = t.locator('.ht2-lam-day .ht2-lam-nut-chinh')
  const chuNop = (await nop.textContent())?.trim()
  dat(chuNop === 'Nộp câu' && await nop.isEnabled() && await thayRo(nop, true), `${ten}: chạm đủ 4 ý ⇒ nút chính "${chuNop}" bật và thấy được`)
  await cham(nop)
  await t.getByText('Đúng 3/4 ý · sai ý d').waitFor()

  // 4 · sau khi nộp: vuốt tới nút cuối, mở lời giải, vuốt tới đáy — phần tử cuối nằm trên thanh đáy
  const nutCuoi = t.getByRole('button', { name: 'Xem lời giải đầy đủ cả 4 ý' })
  const lan2 = await vuotToi(nutCuoi)
  dat(lan2 >= 0, `${ten}: vuốt ${lan2} lần tới nút cuối "Xem lời giải đầy đủ cả 4 ý" — không bị che`)
  await cham(nutCuoi)
  await t.getByText(/Trong một chu kì, theo chiều tăng/).waitFor()
  for (let i = 0; i < 12; i++) { const k = await khung(); if (k.top + k.nhin >= k.cao - 1) break; await vuot(-Math.round(h * 0.45)) }
  const k2 = await khung()
  const cuoi = await t.evaluate(() => { const c = document.querySelector('.ht2-lam-than').lastElementChild.getBoundingClientRect(); return Math.round(c.bottom) })
  const v2 = await vung()
  dat(k2.top + k2.nhin >= k2.cao - 1 && cuoi <= v2.duoi + 0.5, `${ten}: vuốt tới đáy (cuộn ${k2.top}/${k2.cao - k2.nhin}px) — đáy phần tử cuối ${cuoi}px ≤ đỉnh thanh đáy ${Math.round(v2.duoi)}px`)
  const tiep = t.getByRole('button', { name: /Câu tiếp theo/ })
  dat(await thayRo(tiep, true), `${ten}: nút chính "Câu tiếp theo" luôn thấy ở thanh đáy`)
  if (ANH && w < 500) await t.screenshot({ path: join(ANH, 'vuot-2-day-loi-giai.jpg'), type: 'jpeg', quality: 60 })

  // 5 · vuốt ngược về đầu
  for (let i = 0; i < 16; i++) { if ((await khung()).top <= 0) break; await vuot(Math.round(h * 0.45)) }
  const k3 = await khung()
  dat(k3.top === 0 && await thayRo(t.getByText('Đúng 3/4 ý · sai ý d')), `${ten}: vuốt ngược về đầu được (cuộn ${k3.top}px), thấy lại dải kết quả`)

  // 6 · câu 3 = trả lời ngắn: bàn phím số trong thanh đáy, 4 ô không bị che
  await cham(tiep)
  await t.getByRole('heading', { name: 'Chặng 2 · Câu 2/3' }).waitFor()
  const b = t.getByRole('radio', { name: /^B/ })
  if (!(await thayRo(b))) await vuotToi(b)
  await cham(b)
  await cham(t.getByRole('button', { name: 'Nộp câu · đã chọn B' }))
  await cham(await t.getByRole('button', { name: /Kết thúc chặng|Câu tiếp theo/ }))
  await t.getByRole('heading', { name: 'Chặng 2 · Câu 3/3' }).waitFor()
  const phim = t.getByRole('group', { name: 'Bàn phím số' })
  for (const p of ['1', 'Dấu phẩy', '2']) await cham(phim.getByRole('button', { name: p, exact: true }))
  const o = t.locator('.ht2-lam-tln')
  if (!(await thayRo(o))) await vuotToi(o)
  const coInput = await t.locator('.ht2-lam input, .ht2-lam textarea').count()
  dat(await thayRo(o) && await thayRo(t.getByRole('button', { name: 'Nộp câu · 1,2' }), true) && coInput === 0, `${ten}: trả lời ngắn — 4 ô thấy rõ trên bàn phím số, "Nộp câu · 1,2" thấy được, không có ô nhập (không bật bàn phím điện thoại)`)
  if (ANH && w < 500) await t.screenshot({ path: join(ANH, 'vuot-3-tra-loi-ngan.jpg'), type: 'jpeg', quality: 60 })
  dat(loi.length === 0, `${ten}: không lỗi trang${loi.length ? ` (${loi.join(' | ').slice(0, 200)})` : ''}`)
  await ctx.close()
}

try {
  await kiemKho(390, 844, 'điện thoại dọc 390×844')
  await kiemKho(844, 390, 'điện thoại ngang 844×390')
} catch (e) {
  hong.push(`HỎNG · lỗi kịch bản: ${String(e).slice(0, 400)}`)
}
await trinh.close()
may.close()
for (const d of [...ghi, ...hong]) console.log(d)
console.log(`\nKIỂM VUỐT: ${ghi.length} đạt · ${hong.length} hỏng`)
process.exit(hong.length ? 1 : 0)
