// CHỤP APP THẬT «Đấu Nguyên Tử» v4 (tháp · tường · tinh thể) trên BẢN BUILD THẬT (dist/, `npm run build` trước) bằng Chromium có sẵn — KHÔNG tải trình duyệt.
//   node docs/ban-ve-dau-ion-v2-0211/that/chup.mjs
// Máy chủ giả qua page.route (vào thi → phòng chờ); phòng đấu = phong-3v3.ts chạy LÕI THẬT trong Node, nối bằng page.routeWebSocket.
// Ảnh: sanh · tran · bao (tinh thể phe em bị bắn) · vao-thay · het-van · goi-y-dau, sáng / tối, 390 · 844 · 1440. JPG ≤ 150 KB + kiem.json.
// Tên đều GIẢ; ảnh trận không có số báo danh.
import { chromium } from 'playwright'
import { build } from 'esbuild'
import { mkdtempSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DAY = import.meta.dirname
const GOC = resolve(DAY, '../../..')
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
const trinh = await chromium.launch({ executablePath: exe })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))
const tam = mkdtempSync(join(tmpdir(), 'dau-ion-v4-'))
await build({ entryPoints: [resolve(DAY, 'phong-v4.ts')], bundle: true, format: 'esm', platform: 'node', outfile: resolve(tam, 'phong-v4.mjs'), logLevel: 'warning' })
const L = await import(pathToFileURL(resolve(tam, 'phong-v4.mjs')).href)
const { preview } = await import('vite')
const sv = await preview({ root: GOC, configFile: false, logLevel: 'error', preview: { port: 0, host: '127.0.0.1' }, build: { outDir: 'dist' } })
const goc = sv.resolvedUrls.local[0].replace(/\/$/, '')

async function chup(p, tep, clip) {
  for (const q of [78, 68, 58, 48, 40, 32]) {
    await p.screenshot({ path: tep, type: 'jpeg', quality: q, ...(clip ? { clip } : {}) })
    if (statSync(tep).size <= 150_000) break
  }
  return Math.round(statSync(tep).size / 1024)
}
const KIEM = () => {
  const hien = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth && getComputedStyle(e).visibility !== 'hidden' }
  const nho = [...document.querySelectorAll('.dn-the button, .dn-man button, .dn-the input')].filter(hien).filter((e) => { const r = (e.type === 'checkbox' ? e.closest('label') : e).getBoundingClientRect(); return r.height < 44 || (e.type !== 'checkbox' && r.width < 44) })
  const man = document.querySelector('.dn-man'), cv = document.querySelector('.dn-khung canvas')
  const sbd = /12121/.test(document.body.innerText)
  return { tran: document.scrollingElement.scrollWidth > innerWidth + 1, nho: nho.map((e) => `«${(e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 20)}»`), sbdHien: sbd,
    san: cv ? { w: Math.round(cv.getBoundingClientRect().width), h: Math.round(cv.getBoundingClientRect().height), phuManNgang: +(cv.getBoundingClientRect().width / innerWidth).toFixed(2), phuManDoc: +(cv.getBoundingClientRect().height / innerHeight).toFixed(2), doc: man?.dataset.doc } : null }
}

/** Một trang đã vào phòng chờ của ca 123456 (máy chủ giả) + phòng đấu 3 đấu 3 mẫu. */
async function moTrang(k, phong) {
  const ctx = await trinh.newContext({ viewport: { width: k.w, height: k.h }, deviceScaleFactor: k.dt ? 2 : 1, isMobile: k.dt, hasTouch: k.dt, locale: 'vi-VN', colorScheme: k.nen === 'toi' ? 'dark' : 'light', serviceWorkers: 'block' })
  await ctx.addInitScript((daXem) => { try { if (!localStorage.getItem('ddh.dauIon')) localStorage.setItem('ddh.dauIon', JSON.stringify({ nt: 3, an: false, vao: false, daXemGoiY: daXem })) } catch { /* bỏ qua */ } }, !k.goiY)
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
    const may = phong.noi((d) => ws.send(typeof d === 'string' ? d : Buffer.from(d)))
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

const KHO = [
  { ten: '390', w: 390, h: 844, dt: true, nen: 'sang', canh: ['sanh', 'tran', 'het-van'] },
  { ten: '390', w: 390, h: 844, dt: true, nen: 'toi', canh: ['tran', 'bao'] },
  { ten: '844', w: 844, h: 390, dt: true, nen: 'sang', goiY: true, canh: ['sanh', 'goi-y-dau', 'tran', 'bao', 'vao-thay', 'het-van'] },
  { ten: '844', w: 844, h: 390, dt: true, nen: 'toi', canh: ['tran', 'het-van'] },
  { ten: '1440', w: 1440, h: 900, dt: false, nen: 'toi', canh: ['sanh', 'tran', 'het-van'] },
]
const bang = [], loiTrang = []
for (const k of KHO) {
  const phong = new L.PhongV4(3)
  const { ctx, p, loi } = await moTrang(k, phong)
  const ghi = async (canh, clip) => { const tep = resolve(DAY, `${canh}-${k.ten}-${k.nen}.jpg`); bang.push({ anh: tep.slice(GOC.length + 1), kb: await chup(p, tep, clip), ...(await p.evaluate(KIEM)) }) }
  if (k.canh.includes('sanh')) {
    // Thẻ game: cuộn cho đầu thẻ sát mép trên (không lộ đầu trang có số báo danh).
    await p.evaluate(() => { const e = document.querySelector('.dn-the'); window.scrollTo(0, e.getBoundingClientRect().top + scrollY - 8) })
    await cho(500)
    await ghi('sanh')
  }
  if (k.canh.length > 1 || !k.canh.includes('sanh')) {
    await p.getByRole('button', { name: 'Đấu', exact: true }).click()
    await p.waitForSelector('.dn-man canvas', { timeout: 15000 })
    if (k.canh.includes('goi-y-dau')) { await cho(1100); await ghi('goi-y-dau'); await cho(2600) } else await cho(1800)
    if (k.canh.includes('tran')) { await cho(700); await ghi('tran') }
    if (k.canh.includes('bao')) { phong.bao(); await cho(1400); await ghi('bao'); }
    if (k.canh.includes('vao-thay')) { phong.thay(); await cho(380); await ghi('vao-thay') }
    if (k.canh.includes('het-van')) { if (!k.canh.includes('vao-thay')) { phong.thay(); await cho(400) } await cho(600); phong.ket(); await cho(1300); await ghi('het-van') }
  }
  loiTrang.push(...loi.map((x) => `${k.ten}-${k.nen}: ${x}`))
  phong.dung(); await ctx.close()
}

writeFileSync(resolve(DAY, 'kiem.json'), JSON.stringify({ luc: new Date().toISOString(), loiTrang, anh: bang }, null, 1))
console.log(JSON.stringify({ loiTrang, anh: bang.map((b) => `${b.anh.split('/').pop()} ${b.kb}KB tran=${b.tran} nho=${b.nho?.length} sbd=${b.sbdHien} san=${JSON.stringify(b.san)}`) }, null, 1))
await new Promise((r) => sv.httpServer.close(r))
await trinh.close()
process.exit(0)
