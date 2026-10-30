#!/usr/bin/env node
// BẢN VẼ «TẤM HƯỚNG DẪN BIỂU TƯỢNG» (thầy 30/10: «hs khi bấm vào các biểu tượng tinh thể nguyên tử lửa đều có hướng dẫn dễ hiểu») — quy trình 4 bước, bước 2.
// Chạy BẢN BUILD THẬT trên Chromium, máy chủ app GIẢ (scripts/do-app-hs/may-chu-gia.ts + /hs/thuong giả) — không một byte tới máy chủ thật.
// Mỗi khổ (điện thoại 360×740 · máy tính bảng 768×1024 · máy tính 1280×800) × sáng / tối: đăng nhập → mở menu → chạm lửa / nguyên tử / tinh thể → chụp tấm.
//   node scripts/chup-ban-ve-huong-dan-3010.mjs --dist=dist --ra=docs/ban-ve-huong-dan-3010
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(arg('dist', 'dist'))
const RA = resolve(arg('ra', 'docs/ban-ve-huong-dan-3010'))
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg' }
const BAT = { giai: true, thangHoa: true, banBe: true, kimCuong: true }
const TONG_QUAN = {
  ok: true, bat: BAT, nguyenTuHomNay: 147, tinhThe: 245, mucTieu: { daXong: 2, can: 7, cau: 40, cauDaLam: 12, dat: false },
  chuoiNgay: { so: 12, giuChuoi: 1, sucChua: 2, lich7: [] }, nhiemVu: [], ruong: { mo: false, thuong: 15 },
  giai: { hang: 'bac', thuHang: 4, soNguoi: 20, hetHanGiay: 2 * 86400 }, thongBao: [], cuoc: null, binh: { gia: 150, daMuaTuan: false },
}

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
  try { body = JSON.parse(raw || '{}') } catch {}
  const tl = u.pathname === '/hs/thuong' ? TONG_QUAN : await GIA.traLoi(u.pathname, body)
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
const vite = await (await import('vite')).createServer({ configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'custom' })
GIA = await vite.ssrLoadModule('/scripts/do-app-hs/may-chu-gia.ts')

const timChromium = () => process.env.PW_CHROMIUM || ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find((p) => existsSync(p))
const trinh = await chromium.launch({ headless: true, executablePath: timChromium(), args: ['--ignore-certificate-errors', '--no-proxy-server', `--host-resolver-rules=MAP * 127.0.0.1:${CONG}, EXCLUDE 127.0.0.1`] })
const KHO = [['hep', 320, 640], ['dt', 360, 740], ['ngang', 740, 360], ['mtb', 768, 1024], ['mt', 1280, 800]]
const SAC = ['sang', 'toi']
const BIEU = [['lua', 'lua'], ['nt', 'nguyen-tu'], ['tt', 'tinh-the']]
const loi = []
try {
  for (const [kho, w, h] of KHO) for (const sac of SAC) {
    GIA.datLai()
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: kho === 'mt' ? 1 : 2, colorScheme: sac === 'toi' ? 'dark' : 'light', serviceWorkers: 'block' })
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loi.push(e.message.slice(0, 160)))
    await p.goto(goc + '/hs')
    await p.locator('input').first().fill('99001')
    await p.locator('input[type="password"]').fill('matkhau-gia').catch(() => {})
    await p.getByRole('button', { name: /^Đăng nhập$/ }).click()
    await p.getByRole('button', { name: /^Học tiếp/ }).first().waitFor({ timeout: 30000 })
    await p.waitForTimeout(800)
    for (const [k, ten] of BIEU) {
      const o = p.locator(`.tp-tr-o[data-k="${k}"]`)
      if (!(await o.isVisible().catch(() => false))) { await p.locator('.tr-menu-cham').click(); await p.waitForTimeout(450) }
      await o.click()
      await p.locator('.tp-hd-tam').waitFor({ timeout: 10000 })
      await p.waitForTimeout(500)
      // TRÀN CHỮ (thầy 30/10 «Chú ý tràn chữ trên app hs»): thẻ không vượt khung nhìn, không phần tử con nào bị cắt ngang.
      const tran = await p.evaluate(() => {
        const t = document.querySelector('.tp-hd-tam'), r = t.getBoundingClientRect(), loi = []
        if (r.right > innerWidth + 0.5 || r.left < -0.5) loi.push(`thẻ ${Math.round(r.left)}–${Math.round(r.right)} / ${innerWidth}`)
        if (t.scrollWidth > t.clientWidth + 1) loi.push(`thẻ cuộn ngang ${t.scrollWidth}>${t.clientWidth}`)
        for (const e of t.querySelectorAll('h2,h3,p,li,span,b,button')) {
          if (e.closest('svg')) continue
          const c = e.getBoundingClientRect()
          if (e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible') loi.push(`cắt: ${e.tagName} «${e.textContent.slice(0, 30)}»`)
          if (c.right > r.right + 0.5) loi.push(`lòi phải: ${e.tagName} «${e.textContent.slice(0, 30)}»`)
        }
        return loi
      })
      if (tran.length) loi.push(`${ten}-${kho}-${sac}: ${tran.join(' · ')}`)
      const anh = join(RA, `${ten}-${kho}-${sac}.jpg`)
      await p.screenshot({ path: anh, type: 'jpeg', quality: 72 })
      console.log('chụp', anh)
      await p.getByRole('button', { name: 'Đã hiểu' }).click()
      await p.locator('.tp-hd-tam').waitFor({ state: 'detached', timeout: 5000 })
    }
    await ctx.close()
  }
} finally {
  if (loi.length) console.log('LỖI TRANG:', [...new Set(loi)].join(' | '))
  await trinh.close(); may.close(); mayTinh.close(); await vite.close()
}
