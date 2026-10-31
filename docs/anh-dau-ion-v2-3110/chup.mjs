// CHỤP + ĐO «Đấu Nguyên Tử 2» trên BẢN BUILD THẬT (dist/, `npm run build` trước) bằng Chromium có sẵn — KHÔNG tải trình duyệt.
//   node docs/anh-dau-ion-v2-3110/chup.mjs          ⇒ ảnh: vào thi → phòng chờ → thẻ game → «Vào sân đấu» → trận 6 bạn (390×844 sáng + tối, 1440×900),
//                                                     hết ván (390 sáng) ⇒ JPG ≤ 150 KB + kiem.json (lỗi trang, tràn ngang, đích bấm < 44 px)
//   node docs/anh-dau-ion-v2-3110/chup.mjs --do     ⇒ đo khung hình (CPU ×1 / ×4, thường / máy yếu) ⇒ do-khung.json
// Máy chủ giả qua page.route; phòng đấu là LUẬT THẬT (server/src/dau-ion-phong.ts) chạy trong Node, nối bằng page.routeWebSocket; 5 bạn mẫu do máy lái.
import { chromium } from 'playwright'
import { build } from 'esbuild'
import { mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DAY = import.meta.dirname
const GOC = resolve(DAY, '../..')
const DO = process.argv.includes('--do')
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
const trinh = await chromium.launch({ executablePath: exe })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const tam = mkdtempSync(join(tmpdir(), 'dau-ion-v2-'))
await build({ entryPoints: [resolve(DAY, 'phong-mau.ts')], bundle: true, format: 'esm', platform: 'node', outfile: resolve(tam, 'phong-mau.mjs'), logLevel: 'warning' })
const { PhongMau, noiMayEm } = await import(pathToFileURL(resolve(tam, 'phong-mau.mjs')).href)
const { preview } = await import('vite')
const sv = await preview({ root: GOC, configFile: false, logLevel: 'error', preview: { port: 0, host: '127.0.0.1' }, build: { outDir: 'dist' } })
const goc = sv.resolvedUrls.local[0].replace(/\/$/, '')

async function chup(p, tep) {
  for (const q of [74, 62, 50, 40, 32]) {
    await p.screenshot({ path: tep, type: 'jpeg', quality: q })
    if (statSync(tep).size <= 150_000) break
  }
  return Math.round(statSync(tep).size / 1024)
}
const KIEM = () => {
  const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(e).visibility !== 'hidden' }
  const nho = [...document.querySelectorAll('.dn-the button, .dn-man button, .dn-the input')].filter(hien).filter((e) => { const r = (e.type === 'checkbox' ? e.closest('label') : e).getBoundingClientRect(); return r.height < 44 || (e.type !== 'checkbox' && r.width < 44) })
  return { tran: document.scrollingElement.scrollWidth > innerWidth + 1, nho: nho.map((e) => `«${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}»`) }
}

/** Một trang đã vào phòng chờ của ca 123456 (máy chủ giả) + nối phòng đấu mẫu. */
async function moTrang(k, nen, phong, khoiTao) {
  const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dt ? 2 : 1, isMobile: k.dt, hasTouch: k.dt, locale: 'vi-VN', colorScheme: nen === 'toi' ? 'dark' : 'light', serviceWorkers: 'block' })
  if (khoiTao) await ctx.addInitScript(khoiTao)
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  await ctx.route((u) => !u.href.startsWith(goc), async (r) => {
    const u = new URL(r.request().url())
    if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors })
    const tra = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(o) })
    let b = {}; try { b = r.request().postDataJSON() ?? {} } catch { /* GET */ }
    if (b.action === 'tenTheoSbd') return tra({ ok: true, sbd: '12121', hoTen: 'Nguyễn Khánh Ngọc', lop: '12A1', tenCa: 'Kiểm tra 15 phút · Ester' })
    if (u.pathname.endsWith('/vao-thi') || b.action === 'vaoThi') return tra({ ok: true, cach: 'cho', lop: '12A1', thoiGianPhut: 15, congBo: 'khong', tenCa: 'Kiểm tra 15 phút · Ester', veDau: 've-mau' })
    if (u.pathname.endsWith('/phong-cho') || b.action === 'trangThaiPhongCho') return tra({ ok: true, phongCho: true, batDau: false, batDauLuc: '', trangThai: 'cho' })
    if (/\.(woff2?|png|svg|jpg)$/.test(u.pathname)) return r.abort()
    return tra({ ok: true })
  })
  const p = await ctx.newPage()
  const loi = []
  p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
  await p.routeWebSocket(/\/dau-ion\//, (ws) => {
    const may = noiMayEm(phong, (d) => ws.send(typeof d === 'string' ? d : Buffer.from(d)), (ma, ly) => ws.close({ code: ma, reason: ly }))
    ws.onMessage((m) => may.nhan(typeof m === 'string' ? m : new Uint8Array(m)))
    ws.onClose(() => may.dong())
  })
  await p.goto(`${goc}/t/123456`)
  await p.getByLabel('Số báo danh').fill('12121')
  await p.getByLabel('Số báo danh').press('Enter')
  await p.waitForSelector('text=Nguyễn Khánh Ngọc', { timeout: 20000 })
  await p.locator('button', { hasText: /Đúng|Bắt đầu|Vào/ }).last().click()
  await p.waitForSelector('.pc-room .dn-the', { timeout: 30000 })
  await p.evaluate(() => document.fonts.ready)
  return { ctx, p, loi }
}
/** Kéo bằng ngón (sự kiện con trỏ kiểu chạm) ở nửa dưới màn ⇒ cần nổi hiện dưới ngón. */
const keo = (p, x, y, dx, dy) => p.evaluate(([x, y, dx, dy]) => {
  const man = document.querySelector('.dn-man'), o = { pointerId: 7, pointerType: 'touch', bubbles: true, isPrimary: true }
  document.querySelector('.dn-ben').dispatchEvent(new PointerEvent('pointerdown', { ...o, clientX: x, clientY: y }))
  man.dispatchEvent(new PointerEvent('pointermove', { ...o, clientX: x + dx, clientY: y + dy }))
}, [x, y, dx, dy])

const bang = [], loiTrang = []
if (!DO) {
  const KHO = [{ ten: '390', w: 390, h: 844, dt: true, nen: 'sang' }, { ten: '390', w: 390, h: 844, dt: true, nen: 'toi' }, { ten: '1440', w: 1440, h: 900, dt: false, nen: 'sang' }]
  for (const k of KHO) {
    const phong = new PhongMau(); phong.chay(); phong.themBan(5)
    const { ctx, p, loi } = await moTrang(k, k.nen, phong)
    const ghi = async (ten) => { const tep = resolve(DAY, `${ten}-${k.ten}-${k.nen}.jpg`); bang.push({ anh: tep.slice(GOC.length + 1), kb: await chup(p, tep), ...(await p.evaluate(KIEM)) }) }
    await p.evaluate(() => { const e = document.querySelector('.dn-the'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 8) })
    await cho(400)
    await ghi('1-sanh')
    await p.getByRole('button', { name: 'Vào sân đấu' }).click()
    await p.waitForSelector('.dn-man canvas', { timeout: 15000 })
    if (k.dt) { await cho(1200); await keo(p, 120, k.h - 120, 40, -30); await cho(1600) }
    else { const r = await p.locator('.dn-khung canvas').boundingBox(); await p.mouse.move(r.x + r.width * 0.3, r.y + r.height * 0.7); await cho(2800) }
    await ghi('2-tran')
    if (k.ten === '390' && k.nen === 'sang') {
      await p.evaluate(() => { const man = document.querySelector('.dn-man'); man.dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, pointerType: 'touch', bubbles: true })) })
      await p.waitForSelector('.dn-ket', { timeout: 80000 })
      await cho(500)
      await ghi('3-het-van')
    }
    loiTrang.push(...loi.map((x) => `${k.ten}-${k.nen}: ${x}`))
    phong.dung(); await ctx.close()
  }
  writeFileSync(resolve(DAY, 'kiem.json'), JSON.stringify({ luc: new Date().toISOString(), loiTrang, anh: bang }, null, 1))
  console.log(JSON.stringify({ loiTrang, anh: bang.map((b) => `${b.anh.split('/').pop()} ${b.kb}KB tran=${b.tran} nho=${b.nho.length}`) }, null, 1))
} else {
  // Đo khung ĐÃ VẼ của sân (mỗi khung vẽ gọi clearRect đúng một lần trên canvas sân) ở 390 × 844, DPR 2, trận 6 bạn (em đứng yên, 5 bạn mẫu đi lại).
  // «thường»: tự hạ đo 3 giây đầu ở CPU ×1 (không hạ) rồi mới bật CPU ×N ⇒ đo đúng chế độ thường; «tự hạ»: CPU ×N ngay từ đầu (máy chậm thật).
  const doClear = () => {
    window.__khung = []
    const goc = CanvasRenderingContext2D.prototype.clearRect
    CanvasRenderingContext2D.prototype.clearRect = function (...a) { if (this.canvas.parentElement?.classList.contains('dn-khung')) window.__khung.push(performance.now()); return goc.apply(this, a) }
  }
  const kq = []
  for (const [cpu, che] of [[1, 'thuong'], [4, 'thuong'], [4, 'tu-ha'], [4, 'yeu'], [6, 'yeu']]) {
    const phong = new PhongMau(); phong.chay(); phong.themBan(5)
    const k = { w: 390, h: 844, dt: true }
    const { ctx, p } = await moTrang(k, 'toi', phong, `${doClear.toString().replace(/^\(\) => /, '')}; localStorage.setItem('ddh.mayYeu', '${che === 'yeu' ? 1 : 0}')`)
    const cdp = await ctx.newCDPSession(p)
    if (che !== 'thuong') await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    await p.getByRole('button', { name: 'Vào sân đấu' }).click()
    await p.waitForSelector('.dn-man canvas', { timeout: 20000 })
    await cho(3500)
    if (che === 'thuong') await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
    await cho(1000)
    await p.evaluate(() => { window.__khung = [] })
    await cho(8000)
    const t = await p.evaluate(() => window.__khung)
    const d = t.slice(1).map((x, i) => x - t[i]), s = [...d].sort((a, b) => a - b), q = (x) => s[Math.min(s.length - 1, Math.floor(s.length * x))]
    const tb = d.reduce((a, b) => a + b, 0) / d.length
    const dpr = await p.evaluate(() => { const c = document.querySelector('.dn-khung canvas'); return +(c.width / c.getBoundingClientRect().width).toFixed(2) })
    kq.push({ cpu, cheDo: che === 'yeu' ? 'máy yếu' : che === 'tu-ha' ? (dpr <= 1 ? 'thường ⇒ tự hạ sang máy yếu' : 'thường (tự hạ bật, không cần hạ)') : 'thường', dprSan: dpr, soKhung: d.length, khungMoiGiay: Math.round(1000 / tb), trungViMs: +q(0.5).toFixed(1), p95Ms: +q(0.95).toFixed(1), toiDaMs: +s[s.length - 1].toFixed(1) })
    phong.dung(); await ctx.close()
  }
  writeFileSync(resolve(DAY, 'do-khung.json'), JSON.stringify({ luc: new Date().toISOString(), ghiChu: 'BẢN BUILD THẬT (dist/), Chromium không giao diện trong máy chủ (vẽ bằng CPU, không GPU) — chậm hơn điện thoại thật. 390×844 DPR 2, sân vẽ DPR 1,5 (máy yếu: DPR 1, trần 30 khung/giây). Trận mạng 6 bạn qua phòng đấu thật (Node). Đo 8 giây khung ĐÃ VẼ.', kq }, null, 1))
  console.log(JSON.stringify(kq, null, 1))
}
await new Promise((r) => sv.httpServer.close(r))
await trinh.close()
process.exit(0)
