// CHỤP «Đấu Nguyên Tử» bằng Chromium THẬT (/opt/pw-browsers/chromium — không tải trình duyệt).
//   node docs/ban-ve-game-ban-sung-3010/chup.mjs            ⇒ bản vẽ: mau.html, 4 trạng thái × 3 khổ × sáng/tối (24 ảnh) + kiem-mau.json
//   node docs/ban-ve-game-ban-sung-3010/chup.mjs --that     ⇒ BẢN BUILD THẬT (dist/, `npm run build` trước): vào thi → phòng chờ → Sảnh đấu → trận,
//        máy chủ giả qua page.route + phòng đấu thật (server/src/dau-ion-phong.ts) nối bằng page.routeWebSocket; ảnh ở that/ + kiem-that.json
// Mỗi ảnh: JPG ≤ 150 KB. Đếm: lỗi trang, tràn ngang, đích bấm < 44 px (chỉ phần tử đang hiện trong khung nhìn).
import { chromium } from 'playwright'
import { build } from 'esbuild'
import { existsSync, mkdirSync, mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DAY = import.meta.dirname
const GOC = resolve(DAY, '../..')
const THAT = process.argv.includes('--that')
const KHO = [{ ten: '390', w: 390, h: 844, dt: true }, { ten: '844', w: 844, h: 390, dt: true }, { ten: '1440', w: 1440, h: 900, dt: false }]
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

async function chup(p, tep) {
  for (const q of [72, 60, 48, 38, 30]) {
    await p.screenshot({ path: tep, type: 'jpeg', quality: q })
    if (statSync(tep).size <= 150_000) return statSync(tep).size
  }
  return statSync(tep).size
}
/** Tràn ngang + đích bấm nhỏ trong khung nhìn. */
const KIEM = () => {
  const hien = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth }
  const nho = [...document.querySelectorAll('button, input, a[href], [role="radio"]')].filter(hien).filter((e) => { const r = e.getBoundingClientRect(); return (e.type !== 'checkbox' && (r.height < 44 || r.width < 44)) || (e.type === 'checkbox' && e.closest('label').getBoundingClientRect().height < 44) })
  return { tran: document.scrollingElement.scrollWidth > innerWidth + 1, nho: nho.map((e) => `${e.tagName.toLowerCase()} «${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 24)}» ${Math.round(e.getBoundingClientRect().width)}×${Math.round(e.getBoundingClientRect().height)}`) }
}

/** Kịch bản chung: sảnh (có lời thách) → trận → khoảnh khắc hạ → kết quả. */
async function kichBan(p, ra, ten, banGhi, thachEm) {
  const ket = []
  const ghi = async (trangThai) => { const k = await p.evaluate(KIEM); const tep = resolve(ra, `${trangThai}-${ten}.jpg`); const kb = await chup(p, tep); ket.push({ anh: tep.slice(GOC.length + 1), kb: Math.round(kb / 1024), ...k }) }
  await p.getByRole('button', { name: 'Vào sảnh đấu' }).click()
  await p.waitForSelector('.di-ban li', { timeout: 15000 })
  await thachEm()
  await p.waitForSelector('.di-moi', { timeout: 5000 })
  await p.evaluate(() => { const e = document.querySelector('.pc-bn'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 8) })
  await cho(300)
  await ghi('1-sanh')
  await p.getByRole('button', { name: 'Để sau' }).click()
  // Thách Quốc Bảo (bạn mẫu nhận lời sau 0,4 giây) ⇒ trận 1–1.
  await p.locator('.di-ban li', { hasText: 'Quốc Bảo' }).getByRole('button', { name: 'Thách' }).click()
  await p.waitForSelector('.di-man canvas', { timeout: 8000 })
  await p.keyboard.down('KeyW'); await p.keyboard.down('KeyD'); await cho(450); await p.keyboard.up('KeyW'); await p.keyboard.up('KeyD')
  await p.keyboard.down('Space')
  await cho(1700)
  await ghi('2-tran')
  await p.waitForSelector('.di-bang-ha:not(.di-bang-ha-em)', { timeout: 40000 })
  await cho(140)
  await ghi('3-trung')
  await banGhi(false)
  await p.waitForSelector('.di-ket', { timeout: 90000 })
  await p.keyboard.up('Space')
  await cho(400)
  await ghi('4-ket')
  return ket
}

const loi = []
const bang = []
if (!THAT) {
  const url = pathToFileURL(resolve(DAY, 'mau.html')).href
  for (const nen of ['sang', 'toi']) for (const k of KHO) {
    const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dt ? 2 : 1, isMobile: k.dt, hasTouch: k.dt, locale: 'vi-VN', colorScheme: nen === 'toi' ? 'dark' : 'light' })
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loi.push(`${k.ten}-${nen}: ${e.message.slice(0, 160)}`))
    await p.goto(`${url}?giao-dien=${nen}`)
    await p.waitForSelector('.di', { timeout: 15000 })
    await p.evaluate(() => document.fonts.ready)
    const ket = await kichBan(p, DAY, `${k.ten}-${nen}`, (b) => p.evaluate((x) => window.__mau.botBan(x), b), () => p.evaluate(() => window.__mau.thachEm(3)))
    bang.push(...ket)
    await ctx.close()
  }
  writeFileSync(resolve(DAY, 'kiem-mau.json'), JSON.stringify({ luc: new Date().toISOString(), loiTrang: loi, anh: bang }, null, 1))
} else {
  // ── BẢN BUILD THẬT ──
  const ra = resolve(DAY, 'that'); mkdirSync(ra, { recursive: true })
  const tam = mkdtempSync(join(tmpdir(), 'dau-ion-chup-'))
  await build({ entryPoints: [resolve(DAY, 'phong-mau.ts')], bundle: true, format: 'esm', platform: 'node', outfile: resolve(tam, 'phong-mau.mjs'), logLevel: 'warning' })
  const { PhongMau, noiMayEm } = await import(pathToFileURL(resolve(tam, 'phong-mau.mjs')).href)
  const { preview } = await import('vite')
  const sv = await preview({ root: GOC, configFile: false, logLevel: 'error', preview: { port: 0, host: '127.0.0.1' }, build: { outDir: 'dist' } })
  const goc = sv.resolvedUrls.local[0].replace(/\/$/, '')
  for (const k of KHO) {
    const phong = new PhongMau(); phong.themBan(); phong.chay()
    let emId = 0
    const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dt ? 2 : 1, isMobile: k.dt, hasTouch: k.dt, locale: 'vi-VN', serviceWorkers: 'block' })
    const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
    const daGoi = []
    await ctx.route((u) => !u.href.startsWith(goc), async (r) => {
      const u = new URL(r.request().url())
      if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: cors })
      const tra = (o) => r.fulfill({ status: 200, contentType: 'application/json', headers: cors, body: JSON.stringify(o) })
      daGoi.push(u.pathname)
      let b = {}; try { b = r.request().postDataJSON() ?? {} } catch { /* GET */ }
      if (b.action === 'tenTheoSbd') return tra({ ok: true, sbd: '12121', hoTen: 'Nguyễn Khánh Ngọc', lop: '12A1', tenCa: 'Kiểm tra 45 phút · Ester – Lipid' })
      if (u.pathname.endsWith('/vao-thi') || b.action === 'vaoThi') return tra({ ok: true, cach: 'cho', lop: '12A1', thoiGianPhut: 45, congBo: 'khong', tenCa: 'Kiểm tra 45 phút · Ester – Lipid', veDau: 've-mau' })
      if (u.pathname.endsWith('/phong-cho')) return tra({ ok: true, phongCho: true, batDau: false, batDauLuc: '', trangThai: 'cho' })
      if (/\.(woff2?|png|svg|jpg)$/.test(u.pathname)) return r.abort()
      return tra({ ok: true })
    })
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loi.push(`${k.ten}: ${e.message.slice(0, 160)}`))
    await p.routeWebSocket(/\/dau-ion\//, (ws) => {
      const may = noiMayEm(phong, (d) => { if (typeof d === 'string' && d.startsWith('{"t":"chao"')) emId = JSON.parse(d).toi; ws.send(typeof d === 'string' ? d : Buffer.from(d)) }, (ma, ly) => ws.close({ code: ma, reason: ly }))
      ws.onMessage((m) => may.nhan(typeof m === 'string' ? m : new Uint8Array(m)))
      ws.onClose(() => may.dong())
    })
    await p.goto(`${goc}/t/123456`)
    await p.getByLabel('Số báo danh').fill('12121')
    await p.getByLabel('Số báo danh').press('Enter')
    // Màn xác nhận tên ⇒ nút chính của màn (bắt đầu / vào phòng chờ).
    await p.waitForSelector('text=Nguyễn Khánh Ngọc', { timeout: 15000 })
    const nut = p.locator('button', { hasText: /Đúng|Bắt đầu|Vào/ }).last()
    await nut.click()
    await p.waitForSelector('.pc-room .di', { timeout: 30000 })
    await p.evaluate(() => document.fonts.ready)
    bang.push(...await kichBan(p, ra, k.ten, (b) => { phong.botBan = b }, () => phong.thachEm(3, emId)))
    bang.push({ duongMayChu: [...new Set(daGoi)] })
    phong.dung()
    await ctx.close()
  }
  await new Promise((r) => sv.httpServer.close(r))
  writeFileSync(resolve(DAY, 'kiem-that.json'), JSON.stringify({ luc: new Date().toISOString(), loiTrang: loi, anh: bang }, null, 1))
}
await trinh.close()
console.log(`${bang.filter((x) => x.anh).length} ảnh · lỗi trang ${loi.length} · tràn ${bang.filter((x) => x.tran).length} · ảnh có đích < 44 px ${bang.filter((x) => x.nho?.length).length}`)
for (const x of bang.filter((x) => x.nho?.length || x.tran)) console.log(' ', x.anh, x.tran ? 'TRÀN' : '', x.nho?.slice(0, 4).join(' | '))
for (const l of loi) console.log('  lỗi:', l)
process.exit(0)
