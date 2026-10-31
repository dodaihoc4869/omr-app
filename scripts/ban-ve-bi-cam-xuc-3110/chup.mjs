#!/usr/bin/env node
// BẢN VẼ «LỬA ĐỔI CẢM XÚC» 31/10 (thầy: «chuyển biến giống duolingo từ vui vẻ tới siêu cáu mặt đỏ lừ… đề xuất rồi vẽ tôi duyệt mới build») — quy trình 4 bước, bước 2.
//   (1) Bảng 6 cấp + «nơi hiện»: trang bang.html, Lửa THẬT nạp từ src qua Vite, chồng lớp giận (lua-gian.js/.css).
//   (2) Lộ trình THẬT (bản build dist + máy chủ giả scripts/do-app-hs/may-chu-gia.ts, đổi số thành 0/40 câu, chuỗi 12 ngày chưa giữ): Lửa cạnh đường đổi
//       sang cấp 5 + bong bóng lời cấp 5. Không một byte tới máy chủ thật. Không sửa src/, server/.
//   node scripts/ban-ve-bi-cam-xuc-3110/chup.mjs --dist=dist --ra=docs/ban-ve-bi-cam-xuc-3110
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { createSecureServer } from 'node:http2'
import { createServer } from 'node:http'
import { execSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { dirname, extname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const DAY = dirname(fileURLToPath(import.meta.url))
const GOC_REPO = resolve(DAY, '../..')
const arg = (ten, mac) => process.argv.find((a) => a.startsWith(`--${ten}=`))?.slice(ten.length + 3) ?? mac
const DIST = resolve(GOC_REPO, arg('dist', 'dist'))
const RA = resolve(GOC_REPO, arg('ra', 'docs/ban-ve-bi-cam-xuc-3110'))
mkdirSync(RA, { recursive: true })
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json', '.jpg': 'image/jpeg' }
const LOI_CAP5 = 'Lửa cáu lắm rồi! 23:05 mà chưa làm câu nào. Còn 54 phút (tới 23:59) để giữ chuỗi 12 ngày.'

// ── dữ liệu giả: 0/40 câu, chuỗi 12 ngày, hôm nay chưa giữ, không còn bình giữ chuỗi
const ngayVn = (ms) => new Date(ms + 7 * 3600e3).toISOString().slice(0, 10)
const lich7 = Array.from({ length: 7 }, (_, i) => ({ ngay: ngayVn(Date.now() - (6 - i) * 86400e3), kieu: i === 6 ? 'cho' : 'hoc' }))
const TONG_QUAN = {
  ok: true, bat: { giai: true, thangHoa: true, banBe: true, kimCuong: true }, nguyenTuHomNay: 0, tinhThe: 245, mucTieu: { daXong: 0, can: 7, cau: 40, cauDaLam: 0, dat: false },
  chuoiNgay: { so: 12, giuChuoi: 0, sucChua: 2, lich7 }, nhiemVu: [], ruong: { mo: false, thuong: 15 },
  giai: { hang: 'bac', thuHang: 9, soNguoi: 20, hetHanGiay: 2 * 86400 }, thongBao: [], cuoc: null, binh: { gia: 150, daMuaTuan: false },
}
const veKhong = (s) => ({ ...s, hanhTrinh: { ...s.hanhTrinh, daLam: 0, changHienTai: 1, cauTrongChang: 0 }, ruong: { ...s.ruong, daLam: 0 }, theLuc: { con: 40, tong: 40 } })

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
  let tl = u.pathname === '/hs/thuong' ? TONG_QUAN : await GIA.traLoi(u.pathname, body)
  if (Array.isArray(tl.__ndjson)) tl = { __ndjson: tl.__ndjson.map((x) => (x && x.sanh ? { ...x, sanh: veKhong(x.sanh) } : x)) }
  else if (tl && tl.hanhTrinh) tl = veKhong(tl)
  else if (/hoc-tap-dem$/.test(u.pathname)) tl = { ...tl, daLamHomNay: 0 }
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
const vite = await taoVite({ root: GOC_REPO, configFile: false, logLevel: 'error', server: { host: '127.0.0.1', port: 41731, strictPort: false, hmr: false, watch: null }, optimizeDeps: { noDiscovery: true, include: [] }, appType: 'mpa' })
await vite.listen()
const goVite = `http://127.0.0.1:${vite.httpServer.address().port}`
GIA = await vite.ssrLoadModule('/scripts/do-app-hs/may-chu-gia.ts')
const CHUNK = '/assets/' + readdirSync(join(DIST, 'assets')).find((f) => /^lua-dong-.*\.js$/.test(f))

const timChromium = () => process.env.PW_CHROMIUM || ['/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find((p) => existsSync(p))
const trinh = await chromium.launch({ headless: true, executablePath: timChromium(), args: ['--ignore-certificate-errors', '--no-proxy-server', `--host-resolver-rules=MAP * 127.0.0.1:${CONG}, EXCLUDE 127.0.0.1`] })
const loi = [], soAnh = []
const chup = async (dich, ten, tuyChon = {}) => { const anh = join(RA, ten); await dich.screenshot({ path: anh, type: 'jpeg', quality: tuyChon.q ?? 72 }); soAnh.push([ten, statSync(anh).size]); console.log('chụp', ten, Math.round(statSync(anh).size / 1024) + ' KB') }
try {
  // (1) BẢNG 6 CẤP + NƠI HIỆN
  for (const sac of ['sang', 'toi']) {
    const ctx = await trinh.newContext({ viewport: { width: 1320, height: 900 }, deviceScaleFactor: 1, colorScheme: sac === 'toi' ? 'dark' : 'light' })
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loi.push(`bảng-${sac}: ${e.message.slice(0, 160)}`))
    await p.goto(goVite + '/scripts/ban-ve-bi-cam-xuc-3110/bang.html')
    await p.waitForSelector('html[data-xong]', { timeout: 30000 })
    await p.evaluate(() => document.fonts.ready)
    await p.waitForTimeout(400)
    await chup(p.locator('#cac-cap'), `cac-cap-${sac}.jpg`, { q: 62 })
    await chup(p.locator('#noi-hien'), `noi-hien-${sac}.jpg`, { q: 72 })
    await ctx.close()
  }
  // (2) LỘ TRÌNH THẬT, Lửa cấp 5
  const KHO = [['dt', 390, 844, 2], ['ngang', 844, 390, 2], ['mt', 1440, 900, 1]]
  for (const [kho, w, h, dsf] of KHO) for (const sac of ['sang', 'toi']) {
    GIA.datLai()
    const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, colorScheme: sac === 'toi' ? 'dark' : 'light', reducedMotion: 'reduce', serviceWorkers: 'block' })
    const p = await ctx.newPage()
    p.on('pageerror', (e) => loi.push(`lo-trinh-${kho}-${sac}: ${e.message.slice(0, 160)}`))
    await p.goto(goc + '/hs')
    await p.locator('input').first().fill('99001')
    await p.locator('input[type="password"]').fill('matkhau-gia').catch(() => {})
    await p.getByRole('button', { name: /^Đăng nhập$/ }).click()
    await p.locator('.da-duong .da-linh-vat[data-lv="bi"] .lua-svg').first().waitFor({ timeout: 30000 })
    await p.waitForTimeout(900)
    await p.addStyleTag({ path: join(DAY, 'lua-gian.css') })
    // Đề xuất: cấp 4–5 Lửa cạnh đường to hơn (83 → 104 px) và luôn có màu; viền bong bóng đổi sang màu «sai» (token có sẵn)
    await p.addStyleTag({ content: "[data-trong] .da-linh-vat[data-cap-lv] { width: 124px; } [data-trong] .da-linh-vat[data-cap-lv] .bi { width: 104px; } [data-trong='hs'] .bi-loi-bong[data-cap='5'], [data-trong='hs'] .bi-loi-bong[data-cap='5']::before { border-color: var(--tr-sai); }" })
    await p.addScriptTag({ path: join(DAY, 'lua-gian.js') })
    await p.evaluate(async ({ chunk, loiCap5 }) => {
      const m = await import(chunk)
      for (const l of m.LUA_DANG_SONG) {
        const lv = l.svg.closest('.da-linh-vat'), vong = l.svg.closest('.tp-tr-vong')
        if ((lv && lv.dataset.lv === 'bi') || vong) {
          l.datTrangThai('gian')
          window.apCapGian(l.svg, 5)
          if (lv) { lv.removeAttribute('data-toi'); lv.dataset.capLv = '5' }
        }
      }
      const main = document.querySelector('main.da-vo')
      const cu = main.querySelector('.bi-loi-boc')
      if (cu) cu.style.display = 'none'
      const boc = document.createElement('div')
      boc.className = 'bi-loi-boc'
      boc.innerHTML = `<div class="bi-loi" data-khong-bi=""><p class="bi-loi-bong" data-cap="5"></p></div>`
      boc.querySelector('p').textContent = loiCap5
      ;(main.querySelector('.da-dai-dinh') || main.querySelector('.da-bai-moc')).after(boc)
    }, { chunk: CHUNK, loiCap5: LOI_CAP5 })
    await p.waitForTimeout(300)
    // Màn ngang thấp: Lộ trình tự cuộn tới chặng hiện tại ⇒ bong bóng đầu trang bị cuộn khuất. Đo vị trí để báo trong đặc tả.
    const doNgang = await p.evaluate(() => {
      const boc = [...document.querySelectorAll('.bi-loi-boc')].find((x) => x.style.display !== 'none'), lua = document.querySelector('.da-linh-vat[data-lv="bi"]')
      const b = boc.getBoundingClientRect(), l = lua.getBoundingClientRect()
      return { bTop: Math.round(b.top), bBot: Math.round(b.bottom), lTop: Math.round(l.top), lBot: Math.round(l.bottom), cao: innerHeight, cuon: Math.round(scrollY || document.scrollingElement.scrollTop) }
    })
    console.log(`lo-trinh-${kho}-${sac}: bong bóng ${doNgang.bTop}–${doNgang.bBot} · Lửa ${doNgang.lTop}–${doNgang.lBot} · cao ${doNgang.cao} · đã cuộn ${doNgang.cuon}`)
    // Đề xuất cho màn thấp (cao < 600): bong bóng NÓI CẠNH LỬA (đuôi chỉ xuống Lửa), không đặt đầu trang.
    if (doNgang.bTop < 60 && doNgang.cao < 600) await p.evaluate(() => {
      const top = [...document.querySelectorAll('.bi-loi-boc')].find((x) => x.style.display !== 'none')
      const lua = document.querySelector('.da-linh-vat[data-lv="bi"]'), nut = document.querySelector('.da-duong .da-nut'), duong = document.querySelector('.da-duong')
      const l = lua.getBoundingClientRect(), n = nut.getBoundingClientRect(), d = duong.getBoundingClientRect()
      const bong = top.querySelector('.bi-loi-bong')
      top.style.display = 'none'
      const left = Math.max(n.right + 12, l.left - 10), w = Math.min(230, d.right - 8 - left)
      bong.dataset.ben = ''
      Object.assign(bong.style, { position: 'absolute', zIndex: '2', margin: '0', width: `${w}px`, left: `${left + scrollX}px`, fontSize: '15px', padding: '10px 12px' })
      document.body.appendChild(bong)
      bong.style.top = `${l.top + scrollY - bong.offsetHeight - 16}px`
      bong.style.setProperty('--duoi', `${Math.round(l.left + l.width / 2 - left - 7)}px`)
    })
    await p.addStyleTag({ content: "[data-trong='hs'] .bi-loi-bong[data-ben]::before { left: var(--duoi); bottom: -9px; transform: rotate(-45deg); }" })
    const kiem = await p.evaluate(() => {
      const se = document.scrollingElement
      const nho = [...document.querySelectorAll('button, a[href]')].filter((b) => { const r = b.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(b).visibility !== 'hidden' && (r.width < 44 || r.height < 44) }).map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 30))
      return { tran: se.scrollWidth > innerWidth + 1 ? `${se.scrollWidth}>${innerWidth}` : '', nho }
    })
    if (kiem.tran) loi.push(`lo-trinh-${kho}-${sac}: tràn ngang ${kiem.tran}`)
    if (kiem.nho.length) console.log(`lo-trinh-${kho}-${sac}: đích chạm < 44 px (có sẵn của app):`, kiem.nho.join(' | '))
    await chup(p, `lo-trinh-cap5-${kho}-${sac}.jpg`, { q: dsf > 1 ? 62 : 72 })
    await ctx.close()
  }
} finally {
  console.log(loi.length ? 'LỖI: ' + [...new Set(loi)].join(' | ') : 'Lỗi trang: 0 · tràn ngang: 0')
  const qua = soAnh.filter(([, n]) => n > 150 * 1024)
  if (qua.length) console.log('ẢNH > 150 KB:', qua.map(([t, n]) => `${t} ${Math.round(n / 1024)} KB`).join(', '))
  await trinh.close(); may.close(); mayTinh.close(); await vite.close()
}
