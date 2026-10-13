// Máy phục vụ tĩnh + trình duyệt dùng chung cho chup.mjs (đợt 19 làn M). Không mạng ngoài.
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' }

export async function moMay(dist) {
  const PUB = resolve(import.meta.dirname, '../../public')
  const may = createServer((req, res) => {
    const duong = decodeURIComponent(new URL(req.url, 'http://x').pathname)
    const p = join(dist, duong)
    const pub = join(PUB, duong)
    const tep = existsSync(p) && statSync(p).isFile() ? p : existsSync(pub) && statSync(pub).isFile() ? pub : join(dist, 'scripts/chup-lan-m/trang.html')
    res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' })
    res.end(readFileSync(tep))
  }).listen(0)
  await new Promise((r) => may.once('listening', r))
  const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-lan-m/trang.html`
  const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
  const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
  return { goc, trinh, dong: async () => { await trinh.close(); may.close() } }
}

/** Ghép nhiều ảnh PNG (Buffer) thành MỘT ảnh — xếp dọc — chụp lại bằng chính trình duyệt. */
export async function ghepDoc(trinh, ds, nen = 'rgb(128 128 128)') {
  const ctx = await trinh.newContext({ viewport: { width: 400, height: 300 }, deviceScaleFactor: 1 })
  const t = await ctx.newPage()
  const anh = ds.map((b) => `<img style="display:block" src="data:image/png;base64,${b.toString('base64')}">`).join('')
  await t.setContent(`<body style="margin:0;background:${nen}"><div id="g" style="display:inline-flex;flex-direction:column;gap:0">${anh}</div></body>`)
  await t.waitForFunction(() => [...document.images].every((i) => i.complete))
  const png = await t.locator('#g').screenshot({ type: 'png' })
  await ctx.close()
  return png
}
