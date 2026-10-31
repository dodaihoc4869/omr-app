#!/usr/bin/env node
// ẢNH BẰNG CHỨNG «LỬA ĐỔI CẢM XÚC» (thầy «Chốt duyệt tất» 31/10 — docs/DE-XUAT-BI-CAM-XUC-3110.md): Lộ trình THẬT (bản build dist + máy chủ giả
// scripts/do-app-hs/may-chu-gia.ts, giờ trình duyệt + giờ máy chủ giả cố định) ở 390 × 844, sáng / tối, ba cấp:
//   cấp 0 · 22:30, 12/40 câu, vừa xong một chặng làm thật 5 phút trước (sổ ddh.lua-that) ⇒ «Em làm thật, Lửa vui lắm!…»
//   cấp 3 · 21:30, 10/40 câu ⇒ «Lửa bực rồi đấy!…»
//   cấp 5 · 23:05, 0/40 câu, chuỗi 12 ngày chưa giữ, hết bình ⇒ «Lửa cáu lắm rồi!…» (+ kiểm biểu tượng tab đổi sang đầu Lửa)
//   + cấp 5 điện thoại ngang 844 × 390 (sáng): bong bóng nói CẠNH Lửa.
// Không một byte tới máy chủ thật. Chạy: npm run build && node scripts/chup-lua-cam-xuc-3110.mjs [--dist=dist] [--ra=docs/anh-lua-cam-xuc-3110]
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const GOC_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { chromium } = createRequire(import.meta.url)('playwright')
const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(GOC_REPO, arg('dist', 'dist'))
const RA = resolve(GOC_REPO, arg('ra', 'docs/anh-lua-cam-xuc-3110'))
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg' }

const SBD = '99001'
const luc = (h, m) => Date.UTC(2026, 9, 31, h - 7, m) // giờ Việt Nam 31/10/2026
const ngayVn = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10)
const CAP = [
  { cap: 0, now: luc(22, 30), daLam: 12, xongThat: luc(22, 25) },
  { cap: 3, now: luc(21, 30), daLam: 10 },
  { cap: 5, now: luc(23, 5), daLam: 0 },
]
let canh = CAP[0]
const tongQuan = () => ({
  ok: true, bat: { giai: true, thangHoa: true, banBe: true, kimCuong: true }, nguyenTuHomNay: canh.daLam * 2, tinhThe: 245,
  mucTieu: { daXong: 0, can: 7, cau: 40, cauDaLam: canh.daLam, dat: false },
  chuoiNgay: { so: 12, giuChuoi: 0, sucChua: 2, lich7: Array.from({ length: 7 }, (_, i) => ({ ngay: ngayVn(canh.now - (6 - i) * 86400e3), kieu: i === 6 ? 'cho' : 'hoc' })) },
  nhiemVu: [], ruong: { mo: false, thuong: 15 }, giai: { hang: 'bac', thuHang: 9, soNguoi: 20, hetHanGiay: 2 * 86400 }, thongBao: [], cuoc: null, binh: { gia: 150, daMuaTuan: false },
})
const veSo = (s) => ({ ...s, hanhTrinh: { ...s.hanhTrinh, daLam: canh.daLam, changHienTai: Math.floor(canh.daLam / 6) + 1, cauTrongChang: canh.daLam % 6 }, ruong: { ...s.ruong, daLam: canh.daLam }, theLuc: { con: 40 - canh.daLam, tong: 40 } })

let GIA = null
function chungChi() {
  const k = join(tmpdir(), 'do-muot-khoa.pem'), c = join(tmpdir(), 'do-muot-cert.pem')
  if (!existsSync(k) || !existsSync(c)) execSync(`openssl req -x509 -newkey rsa:2048 -nodes -keyout ${k} -out ${c} -days 30 -subj /CN=127.0.0.1`, { stdio: 'ignore' })
  return { key: readFileSync(k), cert: readFileSync(c) }
}
const may = createSecureServer({ ...chungChi(), allowHTTP1: true }, async (req, res) => {
  const u = new URL(req.url, 'http://x')
  const host = String(req.headers.host || req.headers[':authority'] || '')
  if (host && !host.startsWith('127.0.0.1') && !/workers\.dev/.test(host)) { res.writeHead(404); return res.end() }
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*' }
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end() }
  if (u.pathname.startsWith('/api/')) u.pathname = u.pathname.slice(4)
  let raw = ''
  for await (const c of req) raw += c
  let body = {}
  try { body = JSON.parse(raw || '{}') } catch { /* thân rỗng */ }
  let tl = u.pathname === '/hs/thuong' ? tongQuan() : await GIA.traLoi(u.pathname, body)
  if (Array.isArray(tl.__ndjson)) tl = { __ndjson: tl.__ndjson.map((x) => (x && x.sanh ? { ...x, sanh: veSo(x.sanh) } : x)) }
  else if (tl && tl.hanhTrinh) tl = veSo(tl)
  else if (/hoc-tap-dem$/.test(u.pathname)) tl = { ...tl, daLamHomNay: canh.daLam }
  else if (tl && tl.goi7) tl = { ...tl, goi7: { ...tl.goi7, daLamHomNay: canh.daLam } }
  const than = Array.isArray(tl.__ndjson) ? tl.__ndjson.map((x) => JSON.stringify(x)).join('\n') + '\n' : JSON.stringify(tl)
  res.writeHead(200, { ...cors, 'content-type': Array.isArray(tl.__ndjson) ? 'application/x-ndjson' : 'application/json' })
  res.end(than)
}).listen(0, '127.0.0.1')
const mayTinh = createServer((req, res) => {
  const u = new URL(req.url, 'http://x')
  let p = join(DIST, decodeURIComponent(u.pathname))
  if (!p.startsWith(DIST) || !existsSync(p) || statSync(p).isDirectory()) p = join(DIST, 'index.html')
  res.writeHead(200, { 'content-type': LOAI[extname(p)] || 'application/octet-stream' })
  res.end(readFileSync(p))
}).listen(0, '127.0.0.1')
await new Promise((ok) => may.once('listening', ok))
if (!mayTinh.listening) await new Promise((ok) => mayTinh.once('listening', ok))
const CONG = may.address().port
const goc = `http://127.0.0.1:${mayTinh.address().port}`
const { createServer: taoVite } = await import('vite')
const vite = await taoVite({ root: GOC_REPO, configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 41733, strictPort: false, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
GIA = await vite.ssrLoadModule('/scripts/do-app-hs/may-chu-gia.ts')

const trinh = await chromium.launch({ headless: true, executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', args: ['--ignore-certificate-errors', '--no-proxy-server', `--host-resolver-rules=MAP * 127.0.0.1:${CONG}, EXCLUDE 127.0.0.1`] })
const loi = [], bao = []
try {
  const LUOT = [...CAP.flatMap((c) => ['sang', 'toi'].map((sac) => ({ c, sac, kho: '', w: 390, h: 844 }))), { c: CAP[2], sac: 'sang', kho: '-ngang', w: 844, h: 390 }]
  for (const { c, sac, kho, w, h } of LUOT) {
    canh = c
    GIA.datLai()
    GIA.kichBan.gio = c.now
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2, colorScheme: sac === 'toi' ? 'dark' : 'light', reducedMotion: 'reduce', serviceWorkers: 'block' })
    // sổ «làm thật» trên máy (cấp 0: vừa xong một chặng 6/6 câu được tính)
    if (c.xongThat) await ctx.addInitScript(({ s, n, x }) => { try { localStorage.setItem('ddh.lua-that', JSON.stringify({ s, n, k: [0, 1, 2, 3, 4, 5].map((i) => [x - (5 - i) * 60000, 1]), x })) } catch { /* */ } }, { s: SBD, n: ngayVn(c.now), x: c.xongThat })
    const p = await ctx.newPage()
    await p.clock.setFixedTime(c.now)
    p.on('pageerror', (e) => loi.push(`cap${c.cap}-${sac}: ${e.message.slice(0, 160)}`))
    await p.goto(goc + '/hs')
    await p.locator('input').first().fill(SBD)
    await p.locator('input[type="password"]').fill('matkhau-gia').catch(() => {})
    await p.getByRole('button', { name: /^Đăng nhập$/ }).click()
    const chon = c.cap >= 2 ? `.da-linh-vat[data-lv="bi"] svg.lua-svg[data-cap-ve="${c.cap}"]` : '.da-linh-vat[data-lv="bi"] svg.lua-svg'
    await p.locator(chon).first().waitFor({ timeout: 30000 })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(500)
    if (!kho) await p.evaluate(() => document.scrollingElement?.scrollTo(0, 0))
    await p.waitForTimeout(250)
    const xem = await p.evaluate(() => ({
      loi: document.querySelector('.bi-loi-bong .ht2-an')?.textContent ?? '',
      capLv: document.querySelector('.da-linh-vat[data-lv="bi"] .bi.lua')?.getAttribute('data-cap') ?? '0',
      vong: document.querySelector('.tp-tr-vong .bi.lua')?.getAttribute('data-cap') ?? '0',
      icon: [...document.querySelectorAll('link[rel="icon"]')].map((l) => l.getAttribute('href').slice(0, 22)),
      tran: document.scrollingElement.scrollWidth > innerWidth + 1,
    }))
    bao.push(`cấp ${c.cap}${kho} ${sac}: Lửa cạnh đường data-cap=${xem.capLv} · vòng mục tiêu data-cap=${xem.vong} · tab ${xem.icon.join(' | ')} · lời «${xem.loi}»`)
    if (xem.tran) loi.push(`cap${c.cap}-${sac}: tràn ngang`)
    const anh = join(RA, `lo-trinh-cap${c.cap}${kho}-${sac}.jpg`)
    await p.screenshot({ path: anh, type: 'jpeg', quality: 58 })
    bao.push(`  ${anh.slice(GOC_REPO.length + 1)} ${Math.round(statSync(anh).size / 1024)} KB`)
    await ctx.close()
  }
} finally {
  console.log(bao.join('\n'))
  console.log(loi.length ? 'LỖI: ' + [...new Set(loi)].join(' | ') : 'Lỗi trang: 0 · tràn ngang: 0')
  await trinh.close(); may.close(); mayTinh.close(); await vite.close()
}
