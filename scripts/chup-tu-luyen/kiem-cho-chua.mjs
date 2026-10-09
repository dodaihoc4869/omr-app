#!/usr/bin/env node
// Kiểm tra khối “Câu cần gỡ tiếp” bằng Chromium thật ở điện thoại ngang và máy tính.
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const dist = resolve(process.argv[2] ?? 'dist-chup')
const out = resolve(process.argv[3] ?? 'anh-cho-chua')
mkdirSync(out, { recursive: true })
const loai = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.svg': 'image/svg+xml' }
const may = createServer((req, res) => {
  const tepYeuCau = join(dist, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const tep = existsSync(tepYeuCau) && statSync(tepYeuCau).isFile() ? tepYeuCau : join(dist, 'scripts/chup-tu-luyen/trang.html')
  res.writeHead(200, { 'content-type': loai[extname(tep)] ?? 'application/octet-stream' })
  res.end(readFileSync(tep))
}).listen(0)

const goc = `http://127.0.0.1:${may.address().port}/scripts/chup-tu-luyen/trang.html?man=tl`
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const trinh = await chromium.launch({ executablePath: existsSync(exe) ? exe : undefined })
const ketQua = []

for (const [ten, width, height, cotToiThieu] of [['ngang-844x390', 844, 390, 4], ['may-tinh-1440x900', 1440, 900, 4]]) {
  const trang = await trinh.newPage({ viewport: { width, height }, colorScheme: 'dark', locale: 'vi-VN', reducedMotion: 'reduce' })
  const loi = []
  trang.on('pageerror', (e) => loi.push(e.message))
  await trang.goto(goc)
  await trang.waitForSelector('.tlu-cho-chua-the')
  await trang.evaluate(() => document.fonts.ready)
  const doDuoc = await trang.evaluate(() => {
    const luoi = document.querySelector('.tlu-cho-chua-luoi')
    const the = [...document.querySelectorAll('.tlu-cho-chua-the')]
    const dong = new Set(the.map((e) => Math.round(e.getBoundingClientRect().top)))
    return {
      tran: document.documentElement.scrollWidth - innerWidth,
      soThe: the.length,
      soCot: Math.ceil(the.length / dong.size),
      theNhoNhat: Math.min(...the.map((e) => e.getBoundingClientRect().height)),
      luoiRong: luoi?.getBoundingClientRect().width ?? 0,
    }
  })
  assert.equal(loi.length, 0, loi.join('\n'))
  assert.ok(doDuoc.tran <= 1, `${ten}: tràn ngang ${doDuoc.tran}px`)
  assert.equal(doDuoc.soThe, 12, `${ten}: thiếu thẻ`)
  assert.ok(doDuoc.soCot >= cotToiThieu, `${ten}: chỉ có ${doDuoc.soCot} cột`)
  assert.ok(doDuoc.theNhoNhat >= 48, `${ten}: đích chạm thấp hơn 48px`)
  await trang.screenshot({ path: join(out, `${ten}.png`), fullPage: false })
  ketQua.push({ ten, ...doDuoc, loi: loi.length })
  await trang.close()
}

await trinh.close()
may.close()
console.log(JSON.stringify(ketQua, null, 2))
