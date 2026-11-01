// ĐO ĐỘ MƯỢT «Đấu Nguyên Tử» TRƯỚC / SAU trên BẢN BUILD THẬT (Chromium có sẵn), MẠNG GIẢ 120 ± 40 ms mỗi chiều (giữ thứ tự gói như WebSocket thật)
// + CPU ×4. Phòng đấu = luật phòng thật chạy trong Node (bản cũ: docs/anh-dau-ion-v2-3110/phong-mau.ts của main; bản mới: phong-do.ts), 5 bạn mẫu đi lại.
//   node docs/ban-ve-dau-ion-3v3-0111/do-muot.mjs --goc=<thư mục có dist/> --phong=<phong-*.ts> --nut="Đấu" --nhan=sau [--ra=do-muot.json]
// Đo trong 20 giây (sau 3,5 giây làm nóng ở CPU ×1 rồi bật ×4):
//  · khung: khoảng cách giữa hai khung ĐÃ VẼ của sân (clearRect toàn canvas) ⇒ trung vị, p95;
//  · ĐỨNG HÌNH: một nguyên tử ĐANG CHẠY đứng yên trên hình > 80 ms rồi GIẬT BÙ (khung kế nhích > 2 × trung vị và > 6 px) — dấu hiệu hình đứng
//    trong khi thật ra nó vẫn chạy (bạn mẫu thật sự dừng vì kẹt vật che thì không giật bù ⇒ không tính). Vị trí lấy từ drawImage ảnh nguyên tử
//    vẽ sẵn (cùng cách vẽ ở hai bản). NHẢY: một khung nhích > 3 × trung vị và > 6 px (bù sau khi đứng / giật về).
import { chromium } from 'playwright'
import { build } from 'esbuild'
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d }
const GOC = resolve(arg('goc', resolve(import.meta.dirname, '../..')))
const PHONG = resolve(arg('phong', resolve(import.meta.dirname, 'phong-do.ts')))
const NUT = arg('nut', 'Đấu'), NHAN = arg('nhan', 'sau'), RA = arg('ra', '')
const GIAY = Number(arg('giay', '20')), CPU = Number(arg('cpu', '4'))
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'
const tam = mkdtempSync(join(tmpdir(), 'do-muot-'))
await build({ entryPoints: [PHONG], bundle: true, format: 'esm', platform: 'node', outfile: resolve(tam, 'phong.mjs'), logLevel: 'warning' })
const { PhongMau, noiMayEm } = await import(pathToFileURL(resolve(tam, 'phong.mjs')).href)
const { preview } = await import('vite')
const sv = await preview({ root: GOC, configFile: false, logLevel: 'error', preview: { port: 0, host: '127.0.0.1' }, build: { outDir: 'dist' } })
const goc = sv.resolvedUrls.local[0].replace(/\/$/, '')
const trinh = await chromium.launch({ executablePath: exe })
const cho = (ms) => new Promise((r) => setTimeout(r, ms))

const ctx = await trinh.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'vi-VN', colorScheme: 'light', serviceWorkers: 'block' })
// Ghi vị trí nguyên tử mỗi khung: drawImage(ảnh vuông vẽ sẵn, −d/2, −d/2, d, d) sau translate(x, y) ⇒ vị trí = dịch chuyển của ma trận.
await ctx.addInitScript(() => {
  try { localStorage.setItem('ddh.dauIon', JSON.stringify({ nt: 3, an: false, vao: false, daXemGoiY: true })) } catch { /* bỏ qua */ }
  const K = (window.__k = { f: [] })
  const laSan = (c) => c?.parentElement?.classList?.contains('dn-khung')
  const xoa = CanvasRenderingContext2D.prototype.clearRect
  CanvasRenderingContext2D.prototype.clearRect = function (x, y, w, h) { if (laSan(this.canvas) && w >= this.canvas.width) K.f.push({ t: performance.now(), a: [] }); return xoa.call(this, x, y, w, h) }
  const ve = CanvasRenderingContext2D.prototype.drawImage
  CanvasRenderingContext2D.prototype.drawImage = function (img, ...r) {
    if (r.length === 4 && laSan(this.canvas) && img instanceof HTMLCanvasElement && img.width === img.height && img.width !== 64 && Math.abs(r[0] + r[2] / 2) < 0.6) {
      const m = this.getTransform(), f = K.f[K.f.length - 1]
      if (f) f.a.push([Math.round(m.e * 10) / 10, Math.round(m.f * 10) / 10])
    }
    return ve.call(this, img, ...r)
  }
})
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
const phong = new PhongMau(); phong.chay(); phong.themBan(5)
const p = await ctx.newPage()
// Mạng giả: mỗi gói trễ 120 ± 40 ms, KHÔNG vượt nhau (WebSocket là một dòng có thứ tự) ⇒ rung mạng thành gói dồn cục.
const tre = () => 80 + Math.random() * 80
await p.routeWebSocket(/\/dau-ion\//, (ws) => {
  let denMay = 0, denPhong = 0
  const may = noiMayEm(phong, (d) => { const t = Math.max(Date.now() + tre(), denMay); denMay = t; setTimeout(() => { try { ws.send(typeof d === 'string' ? d : Buffer.from(d)) } catch { /* đóng */ } }, t - Date.now()) }, (ma, ly) => ws.close({ code: ma, reason: ly }))
  ws.onMessage((m) => { const t = Math.max(Date.now() + tre(), denPhong); denPhong = t; setTimeout(() => may.nhan(typeof m === 'string' ? m : new Uint8Array(m)), t - Date.now()) })
  ws.onClose(() => may.dong())
})
await p.goto(`${goc}/t/123456`)
await p.getByLabel('Số báo danh').fill('12121')
await p.getByLabel('Số báo danh').press('Enter')
await p.waitForSelector('text=Nguyễn Khánh Ngọc', { timeout: 20000 })
await p.locator('button', { hasText: /Đúng|Bắt đầu|Vào/ }).last().click()
await p.waitForSelector('.pc-room .dn-the', { timeout: 30000 })
await p.getByRole('button', { name: NUT, exact: true }).click()
await p.waitForSelector('.dn-man canvas', { timeout: 20000 })
const cdp = await ctx.newCDPSession(p)
await cho(3500)
if (CPU > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
await cho(1000)
await p.evaluate(() => { window.__k.f = [] })
await cho(GIAY * 1000)
const F = await p.evaluate(() => window.__k.f)
phong.dung()
await ctx.close(); await trinh.close(); await new Promise((r) => sv.httpServer.close(r))

// ── Tính số ──
const dk = F.slice(1).map((f, i) => f.t - F[i].t).sort((a, b) => a - b)
const q = (s, x) => s[Math.min(s.length - 1, Math.floor(s.length * x))]
// Nối vị trí thành vệt theo láng giềng gần nhất (≤ 40 px mỗi khung).
const vet = []
let truoc = []
for (const f of F) {
  const dung = new Set(), moi = []
  for (const [x, y] of f.a) {
    let tot = -1, gan = 40
    truoc.forEach((v, i) => { if (dung.has(i)) return; const d = Math.hypot(v.x - x, v.y - y); if (d < gan) { gan = d; tot = i } })
    let v
    if (tot >= 0) { dung.add(tot); v = truoc[tot] } else { v = { m: [] }; vet.push(v) }
    v.x = x; v.y = y; v.m.push([f.t, x, y]); moi.push(v)
  }
  truoc = moi
}
let dungHinh = 0, khung2 = 0, nhay = 0, giayChay = 0
const dsDung = []
for (const v of vet) {
  const m = v.m
  if (m.length < 10) continue
  const buoc = m.slice(1).map((s, i) => Math.hypot(s[1] - m[i][1], s[2] - m[i][2]))
  const tv = [...buoc].sort((a, b) => a - b)[Math.floor(buoc.length / 2)] || 0
  // Bỏ vệt gần như đứng yên (em đứng yên, chỉ bị đẩy) — chỉ xét nguyên tử đang chạy.
  if (tv < 1) continue
  // Tốc độ quanh mốc i (px/giây) trong 150 ms.
  const tocQuanh = (i, chieu) => { let j = i; while (j + chieu >= 0 && j + chieu < m.length && Math.abs(m[j + chieu][0] - m[i][0]) < 150) j += chieu; const dt = Math.abs(m[j][0] - m[i][0]) / 1000; return dt > 0.05 ? Math.hypot(m[j][1] - m[i][1], m[j][2] - m[i][2]) / dt : 0 }
  for (let i = 0; i < buoc.length; i++) if (buoc[i] > 0.5) giayChay += (m[i + 1][0] - m[i][0]) / 1000
  for (let i = 0; i < buoc.length;) {
    if (buoc[i] >= 0.5) { if (buoc[i] > 6 && buoc[i] > 3 * Math.max(1, tv)) nhay++; i++; continue }
    let j = i
    while (j < buoc.length && buoc[j] < 0.5) j++
    const dai = m[Math.min(j, m.length - 1)][0] - m[i][0]
    const buDu = j < buoc.length && tocQuanh(i, -1) > 40 && buoc[j] > Math.max(6, 2 * tv)
    if (buDu && j - i >= 2) khung2++
    if (dai > 80 && buDu) { dungHinh++; dsDung.push(Math.round(dai)) }
    i = j
  }
}
const kq = { nhan: NHAN, goc: GOC.split('/').slice(-2).join('/'), giay: GIAY, mang: '120 ± 40 ms mỗi chiều', cpu: CPU, soKhung: F.length, khungTrungViMs: +q(dk, 0.5).toFixed(1), khungP95Ms: +q(dk, 0.95).toFixed(1), khungToiDaMs: +dk[dk.length - 1].toFixed(1),
  giayNguyenTuChay: +giayChay.toFixed(1), dungHinhTren80ms: dungHinh, dungHinhMoiPhutChay: +(dungHinh / Math.max(1e-9, giayChay / 60)).toFixed(1), dungHinhDaiNhatMs: Math.max(0, ...dsDung), khung2RoiGiatBu: khung2, nhayGiat: nhay, vet: vet.filter((v) => v.m.length >= 10).length }
console.log(JSON.stringify(kq))
if (RA) { const cu = existsSync(RA) ? JSON.parse(readFileSync(RA, 'utf8')) : { ghiChu: 'Đo bằng docs/ban-ve-dau-ion-3v3-0111/do-muot.mjs — bản build thật, Chromium không giao diện (CPU, không GPU), 844 × 390 DPR 2, 6 người thật (em đứng yên + 5 bạn mẫu đi lại), mạng giả 120 ± 40 ms mỗi chiều, 20 giây; «cpu» = mức hãm CPU.', lan: [] }; cu.lan.push({ luc: new Date().toISOString(), ...kq }); writeFileSync(RA, JSON.stringify(cu, null, 1)) }
process.exit(0)
