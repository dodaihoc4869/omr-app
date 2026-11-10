// Chụp bản vẽ «Hôm nay chỉ một nút» (thầy 10/11) — app THẬT (trang chụp scripts/chup-v2, dữ liệu giả) + lớp mẫu proto-mot-nut.css.
//   npx vite build --config scripts/chup-v2/vite.config.mjs --outDir <tạm> && node docs/ban-ve-mot-nut-1011/chup.mjs <tạm> docs/ban-ve-mot-nut-1011
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync, readdirSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { createRequire } from 'node:module'
const { chromium } = createRequire(resolve('package.json'))('playwright')
const DIST = resolve(process.argv[2]), RA = resolve(process.argv[3]), PUB = resolve('public')
const PROTO = readFileSync(resolve(RA, 'proto-mot-nut.css'), 'utf8')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json', '.webp': 'image/webp' }
const may = createServer((req, res) => { const d = decodeURIComponent(new URL(req.url, 'http://x').pathname), p = join(DIST, d), pub = join(PUB, d)
  const t = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(DIST, 'scripts/chup-v2/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(t)] ?? 'application/octet-stream' }); res.end(readFileSync(t)) }).listen(0)
await new Promise(r => may.once('listening', r))
const css = readdirSync(join(DIST, 'assets')).filter(f => /^TrongHs-.*\.css$/.test(f))
const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-v2/trang.html`
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const CANH = [
  ['1-hom-nay-dt-sang', 'man=hs-mot&ns=1&dd=khong', 390, 844, 'light'], ['1-hom-nay-dt-toi', 'man=hs-mot&ns=1&dd=khong', 390, 844, 'dark'],
  ['2-hom-nay-ngang', 'man=hs-mot&ns=1&dd=khong', 844, 390, 'light'], ['3-hom-nay-gap', 'man=hs-mot&ns=1&dd=khong', 884, 1104, 'light'],
  ['4-hom-nay-may-tinh-sang', 'man=hs-mot&ns=1&dd=khong', 1366, 900, 'light'], ['4-hom-nay-may-tinh-toi', 'man=hs-mot&ns=1&dd=khong', 1366, 900, 'dark'],
  ['5-ket-chang-dt', 'man=tp&v=ket', 390, 844, 'light'], ['5-ket-chang-may-tinh', 'man=tp&v=ket', 1366, 900, 'light'],
  ['6-xong-het-dt', 'man=hs-mot&tt=xong&dd=khong', 390, 844, 'light'],
]
for (const [ten, tham, w, h, nen] of CANH) {
  const ctx = await trinh.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, colorScheme: nen, reducedMotion: 'reduce' })
  const t = await ctx.newPage(); const loi = []; t.on('pageerror', e => loi.push(String(e)))
  await t.goto(`${goc}?${tham}`); await t.waitForTimeout(2500)
  for (const c of css) await t.addStyleTag({ url: '/assets/' + c })
  await t.addStyleTag({ content: PROTO }); await t.waitForTimeout(3200)
  if (tham.includes('man=tp')) await t.evaluate(() => {
    const n = document.querySelector('.tp-nut-lon'); if (!n) return
    n.textContent = 'Làm tiếp: Sửa nhóm 2'
    const p = document.createElement('p'); p.className = 'bv-tu-vao'; p.innerHTML = 'Tự vào sau <b>3</b> giây · chạm màn để ở lại'
    const v = document.createElement('button'); v.type = 'button'; v.className = 'tp-nut-chu'; v.textContent = 'Về Hôm nay'
    n.after(p, v)
  })
  await t.waitForTimeout(300)
  const tran = await t.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  const nho = await t.evaluate(() => [...document.querySelectorAll('button, a')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top < innerHeight && (r.height < 44 || r.width < 44) && getComputedStyle(e).visibility !== 'hidden' }).map(e => (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 24)))
  let q = 80, buf
  do { buf = await t.screenshot({ type: 'jpeg', quality: q }); q -= 8 } while (buf.length > 150_000 && q > 30)
  writeFileSync(join(RA, ten + '.jpg'), buf)
  console.log(ten, 'loi', loi.length, 'tran', tran, 'nho<44', JSON.stringify(nho))
  await ctx.close()
}
await trinh.close(); may.close()
