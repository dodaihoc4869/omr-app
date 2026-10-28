// TÁI HIỆN LỖI 28/10 BẰNG HAI BẢN DỰNG THẬT: máy mở bản A, thầy phát hành bản B, máy (vẫn chạy mã A) mở màn tải lười.
//
//   node scripts/kiem-manh-cu-hai-ban.mjs <distA> <distB>
//
// Máy chủ giả làm đúng như Pages: tệp có thì trả, không có thì `/* /index.html 200` (nên mảnh mất ⇒ HTML ⇒ lỗi MIME).
// Ba cảnh:
//   1. ĐỐI CHỨNG — đẩy B trần (như trước 28/10): trang A nạp mảnh riêng của A ⇒ PHẢI hỏng (tái hiện được lỗi thầy chụp).
//   2. GIỮ MẢNH — đẩy B sau khi chạy scripts/giu-manh-cu.mjs lấy từ bản sống A: mọi mảnh riêng của A nạp được (0 lỗi);
//      rồi service worker B tiếp quản ⇒ trang tự lên B, không chữ lỗi.
//   3. PHÍA MÁY — trang B mà mảnh StudentPortalScreen bị mất: không lúc nào hiện chữ lỗi tiếng Anh, tự tải lại (`_moi=`) ngay.
// Thoát 1 nếu cảnh nào sai.
import { createServer } from 'node:http'
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'
import { giuManhCu } from './giu-manh-cu.mjs'

const [A, B] = process.argv.slice(2).map((p) => resolve(p))
if (!A || !B || !existsSync(join(A, 'index.html')) || !existsSync(join(B, 'index.html'))) {
  console.error('Dùng: node scripts/kiem-manh-cu-hai-ban.mjs <distA> <distB>')
  process.exit(2)
}
const LOAI = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm' }

let goc = A
const may = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname)
  let f = join(goc, p)
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html')
  if (!existsSync(f) || !f.startsWith(goc)) f = join(goc, 'index.html') // `/* /index.html 200` của _redirects
  const dau = { 'content-type': LOAI[extname(f)] || 'application/octet-stream' }
  dau['cache-control'] = p.startsWith('/assets/') && f !== join(goc, 'index.html') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate'
  if (p === '/sw-version.json') dau['cache-control'] = 'no-store'
  res.writeHead(200, dau)
  res.end(readFileSync(f))
})
await new Promise((r) => may.listen(0, '127.0.0.1', r))
const DIA_CHI = `http://127.0.0.1:${may.address().port}`

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })
const sai = []
const LOI_ANH = /Failed to fetch|dynamically imported|Importing a module script|error loading/i
const rieng = readdirSync(join(A, 'assets')).filter((t) => t.endsWith('.js') && !existsSync(join(B, 'assets', t)))

/** Mở A (có service worker điều khiển), đổi bản sống sang `banMoi`, rồi để chính trang A nạp mọi mảnh riêng của A. */
async function moABoiB(banMoi) {
  goc = A
  const ctx = await trinh.newContext()
  const trang = await ctx.newPage()
  await trang.goto(`${DIA_CHI}/`, { waitUntil: 'load' })
  await trang.evaluate(() => navigator.serviceWorker.ready.then(() => undefined))
  await trang.reload({ waitUntil: 'load' }) // lượt này do SW A điều khiển, như máy em mở lại app
  await trang.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 })
  goc = banMoi
  const kq = await trang.evaluate(async (ds) => {
    const hong = []
    for (const t of ds) {
      try { await import(`/assets/${t}`) } catch (e) { hong.push(`${t}: ${String(e?.message || e).slice(0, 120)}`) }
    }
    return hong
  }, rieng)
  return { ctx, trang, hong: kq.filter((h) => LOI_ANH.test(h)) }
}

// 1. ĐỐI CHỨNG
{
  const { ctx, hong } = await moABoiB(B)
  console.log(`1. ĐỐI CHỨNG (đẩy B trần): ${hong.length}/${rieng.length} mảnh riêng của A hỏng — ${hong[0] || ''}`)
  if (!hong.length) sai.push('đối chứng không tái hiện được lỗi')
  await ctx.close()
}

// 2. GIỮ MẢNH
{
  const B2 = mkdtempSync(join(tmpdir(), 'ban-b-'))
  cpSync(B, B2, { recursive: true })
  goc = A
  const kq = await giuManhCu({ dist: B2, goc: DIA_CHI, id: 'B', ghi: () => {} })
  console.log(`   giu-manh-cu: ${JSON.stringify(kq)}`)
  const { ctx, trang, hong } = await moABoiB(B2)
  console.log(`2. GIỮ MẢNH: ${hong.length}/${rieng.length} mảnh riêng của A hỏng`)
  if (hong.length) sai.push(`giữ mảnh vẫn hỏng: ${hong.slice(0, 3).join(' | ')}`)
  // SW B tiếp quản ⇒ trang tự tải lại lên B (tuTaiLaiKhiDoiBan), không chữ lỗi.
  const indexB = readFileSync(join(B, 'index.html'), 'utf8').match(/assets\/(index-[^"]+\.js)/)?.[1]
  const doi = trang.waitForEvent('framenavigated', { timeout: 30_000 }).catch(() => null)
  await trang.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r?.update()))
  await doi
  await trang.waitForLoadState('load')
  await trang.waitForTimeout(1500)
  const html = await trang.content()
  const lenB = indexB && html.includes(indexB)
  const chu = await trang.evaluate(() => document.body.innerText)
  console.log(`   SW B tiếp quản: trang lên B = ${lenB}; chữ lỗi = ${LOI_ANH.test(chu)}`)
  if (!lenB) sai.push('SW B tiếp quản nhưng trang không lên B')
  if (LOI_ANH.test(chu)) sai.push('hiện chữ lỗi sau khi SW B tiếp quản')
  await ctx.close()
}

// 3. PHÍA MÁY: mảnh cổng học sinh mất ⇒ tự tải lại ngay, không chữ tiếng Anh
{
  goc = B
  const ctx = await trinh.newContext()
  const trang = await ctx.newPage()
  let chan = true
  await trang.route(/\/assets\/StudentPortalScreen-[^/]+\.js$/, (r) => (chan ? r.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><html></html>' }) : r.continue()))
  const thay = []
  trang.on('framenavigated', (f) => { if (f === trang.mainFrame()) thay.push({ url: f.url(), t: Date.now() }) })
  const t0 = Date.now()
  await trang.goto(`${DIA_CHI}/hs`, { waitUntil: 'load' })
  let tiengAnh = false
  let moi = null
  for (let i = 0; i < 80 && !moi; i++) {
    const chu = await trang.evaluate(() => document.body?.innerText || '').catch(() => '')
    if (LOI_ANH.test(chu)) tiengAnh = true
    moi = thay.find((x) => x.url.includes('_moi='))
    if (moi) chan = false
    await trang.waitForTimeout(100)
  }
  console.log(`3. PHÍA MÁY: tự tải lại sau ${moi ? moi.t - t0 : '∞'} ms; chữ lỗi tiếng Anh = ${tiengAnh}`)
  if (!moi) sai.push('mất mảnh mà không tự tải lại trong 8 giây')
  if (tiengAnh) sai.push('hiện chữ lỗi tiếng Anh cho em')
  await ctx.close()
}

await trinh.close()
may.close()
if (sai.length) {
  console.error(`KẾT LUẬN: SAI — ${sai.join('; ')}`)
  process.exit(1)
}
console.log('KẾT LUẬN: ĐẠT — đối chứng tái hiện lỗi; giữ mảnh thì bản cũ chạy tiếp; mất mảnh thì tự tải lại, không chữ tiếng Anh.')
