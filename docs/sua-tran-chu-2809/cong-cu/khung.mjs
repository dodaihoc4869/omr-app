// Khung chạy dò tràn chữ: node khung.mjs <tệp-cảnh.mjs> [lọc-tên-cảnh] [cỡ,...] [--anh]
import { chromium } from '/home/user/omr-app/node_modules/playwright/index.mjs'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { traLoi } from './tra-loi.mjs'
const base = 'http://127.0.0.1:5199'
const DO = readFileSync(new URL('./do-tran.js', import.meta.url), 'utf8')
const [tepCanh, loc = '', coArg = '', ...co] = process.argv.slice(2)
const anh = co.includes('--anh') || coArg === '--anh'
const tag = (co.find(x => x.startsWith('--tag=')) || '--tag=').slice(6)
const { CANH, APP } = await import('./' + tepCanh)
const CO_MAC_DINH = APP === 'hs' ? ['360x740', '390x844', '768x1024', '1440x900', '844x390'] : ['360x740', '390x844', '768x1024', '1440x900']
const cos = coArg && coArg !== '--anh' ? coArg.split(',') : CO_MAC_DINH
const DIR = '/tmp/claude-0/-home-user-omr-app/372d898c-b8fd-5f51-b347-5c27b972161c/scratchpad/do/kq'
mkdirSync(DIR + '/anh', { recursive: true })
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' })
const ketQua = []
const lanhLog = new Set()
for (const c of cos) {
  const [w, h] = c.split('x').map(Number)
  const ctx = await b.newContext({ viewport: { width: w, height: h }, serviceWorkers: 'block', reducedMotion: 'reduce', locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', hasTouch: w < 900, isMobile: false })
  await ctx.routeWebSocket('**/*', ws => ws.close())
  await ctx.route('**/*', async r => {
    const u = new URL(r.request().url())
    if (u.origin === base) {
      if (u.pathname === '/src/App.tsx') {
        const res = await r.fetch(); let t = await res.text()
        t = t.replace('canHoi ? "dang_doc" : "da_mo"', '"da_mo"').replace(/setKhoa\((ma \? "can_dat" : )?"(chua_cap_quyen|can_mo)"\)/g, 'setKhoa("da_mo")')
        return r.fulfill({ response: res, body: t })
      }
      if (!u.pathname.startsWith('/api')) return r.continue()
    }
    if (u.protocol === 'data:' || u.protocol === 'blob:') return r.continue()
    if (/fonts\.(googleapis|gstatic)/.test(u.host)) return r.abort()
    let body = {}
    try { body = JSON.parse(r.request().postData() || '{}') } catch { }
    const kq = traLoi(u, body, r.request().method())
    if (kq === undefined) { lanhLog.add(r.request().method() + ' ' + u.host + u.pathname + ' ' + JSON.stringify(body).slice(0, 100)); return r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}', headers: { 'access-control-allow-origin': '*' } }) }
    if (kq && kq.__status) return r.fulfill({ status: kq.__status, contentType: 'application/json', body: '{}', headers: { 'access-control-allow-origin': '*' } })
    return r.fulfill({ status: 200, contentType: typeof kq === 'string' ? 'text/html' : 'application/json', body: typeof kq === 'string' ? kq : JSON.stringify(kq), headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } })
  })
  for (const canh of CANH) {
    if (loc && !canh.ten.includes(loc)) continue
    if (canh.chiCo && !canh.chiCo.includes(c)) continue
    const p = await ctx.newPage()
    const loi = []
    p.on('pageerror', e => loi.push(e.message.slice(0, 160)))
    try {
      await canh.chay(p, { base, w, h })
      await p.waitForTimeout(canh.cho ?? 700)
      await p.evaluate(() => document.fonts.ready)
      const ds = await p.evaluate(DO)
      for (const d of ds) ketQua.push({ man: canh.ten, co: c, ...d })
      if (anh) await p.screenshot({ path: `${DIR}/anh/${canh.ten.replace(/[^a-z0-9-]/gi, '_')}-${c}${tag ? '-' + tag : ''}.jpg`, type: 'jpeg', quality: 45, fullPage: canh.full !== false })
      console.log(`${canh.ten} ${c}: ${ds.length} lỗi${loi.length ? ' · JSERR ' + loi[0] : ''}`)
    } catch (e) {
      console.log(`${canh.ten} ${c}: HỎNG ${String(e.message).split('\n')[0].slice(0, 200)}`)
    }
    await p.close()
  }
  await ctx.close()
}
await b.close()
const ten = `${DIR}/${tepCanh.replace('.mjs', '')}${loc ? '-' + loc.replace(/[^a-z0-9-]/gi, '_') : ''}${tag ? '-' + tag : ''}.json`
writeFileSync(ten, JSON.stringify(ketQua, null, 1))
writeFileSync(ten.replace('.json', '.api.txt'), [...lanhLog].join('\n'))
console.log('TỔNG', ketQua.length, '→', ten, lanhLog.size ? `· ${lanhLog.size} lệnh chưa có mẫu` : '')
