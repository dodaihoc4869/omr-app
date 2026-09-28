// Soi một cảnh: node soi.mjs <tệp-cảnh> <tên-cảnh> <cỡ> '<js biểu thức chạy trong trang>'
import { chromium } from '/home/user/omr-app/node_modules/playwright/index.mjs'
import { traLoi } from './tra-loi.mjs'
const base = 'http://127.0.0.1:5199'
const [tep, ten, co, js] = process.argv.slice(2)
const { CANH } = await import('./' + tep)
const [w, h] = co.split('x').map(Number)
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', hasTouch: w < 900 })
await ctx.routeWebSocket('**/*', ws => ws.close())
await ctx.route('**/*', async r => {
  const u = new URL(r.request().url())
  if (u.origin === base) {
    if (u.pathname === '/src/App.tsx') { const res = await r.fetch(); let t = await res.text(); t = t.replace('canHoi ? "dang_doc" : "da_mo"', '"da_mo"').replace(/setKhoa\((ma \? "can_dat" : )?"(chua_cap_quyen|can_mo)"\)/g, 'setKhoa("da_mo")'); return r.fulfill({ response: res, body: t }) }
    return r.continue()
  }
  if (u.protocol === 'data:' || u.protocol === 'blob:') return r.continue()
  let body = {}; try { body = JSON.parse(r.request().postData() || '{}') } catch { }
  const kq = traLoi(u, body, r.request().method())
  return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(kq ?? { ok: true }), headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
})
const p = await ctx.newPage()
await CANH.find(c => c.ten === ten).chay(p, { base, w, h })
await p.waitForTimeout(800)
console.log(JSON.stringify(await p.evaluate(js), null, 1).slice(0, 4000))
if (process.argv[6]) await p.screenshot({ path: process.argv[6], type: 'jpeg', quality: 50 })
await b.close()
