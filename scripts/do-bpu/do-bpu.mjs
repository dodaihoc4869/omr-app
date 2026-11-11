#!/usr/bin/env node
// ĐO TỐC ĐỘ BÌNH PHẢN ỨNG bằng Chromium thật (Playwright) trên trang đo `scripts/do-bpu/trang.tsx` (phòng GIẢ, không dữ liệu thật).
//   npx vite build --config scripts/do-bpu/vite.config.mjs --outDir <thư mục>
//   node scripts/do-bpu/do-bpu.mjs <thư mục> [--cpu=4] [--lan=3] [--yeu] [--ra=kq.json]
// 1) BẢNG (30 em, 10 em gửi dồn, mỗi tin cách 30 ms): khung hình p50/p95/max, số khung > 25 ms, công việc luồng chính (ms) trong đợt dồn.
// 2) MÁY EM: phản hồi bấm phương án / «Gửi đáp án» (Event Timing, ms), chạm được sau khi nối phòng.
// 3) GỌI LÊN BẢNG: từ lúc bấm L tới lúc có thẻ em được chọn (độ trễ mạng GIẢ 350 ms) và số lần gọi máy chủ.
import { createServer } from 'node:http'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { extname, join, resolve } from 'node:path'
import { chromium } from 'playwright'

const arg = (t, m) => process.argv.find((a) => a.startsWith(`--${t}=`))?.slice(t.length + 3) ?? m
const DIST = resolve(process.argv[2])
const CPU = Number(arg('cpu', '4')), LAN = Number(arg('lan', '3')), NHIP = Number(arg('nhip', '0')), YEU = process.argv.includes('--yeu'), RA = arg('ra', '')
const LOAI = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.json': 'application/json' }
const may = createServer((req, res) => {
  const p = join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname))
  const tep = existsSync(p) && statSync(p).isFile() ? p : join(DIST, 'scripts/do-bpu/trang.html')
  res.writeHead(200, { 'content-type': LOAI[extname(tep)] ?? 'application/octet-stream' }); res.end(readFileSync(tep))
}).listen(0)
const goc = `http://127.0.0.1:${may.address().port}/scripts/do-bpu/trang.html`
const exe = process.env.PW_CHROMIUM || readdirSync('/opt/pw-browsers').filter((x) => /^chromium-\d+$/.test(x)).flatMap((x) => ['chrome-linux', 'chrome-linux64'].map((s) => `/opt/pw-browsers/${x}/${s}/chrome`)).find(existsSync)
const trinh = await chromium.launch({ executablePath: exe, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] })
const giua = (a) => { const s = a.filter(Number.isFinite).sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null }
const pct = (a, p) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(s.length * p))] : null }

async function trang(man, q = '') {
  const ngu = await trinh.newContext({ viewport: man === 'bang' ? { width: 1920, height: 1080 } : { width: 390, height: 844 }, hasTouch: man === 'em', isMobile: man === 'em' })
  const t = await ngu.newPage()
  t.on('pageerror', (e) => console.error('LỖI TRANG', e.message))
  const cdp = await ngu.newCDPSession(t)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU })
  await cdp.send('Performance.enable')
  await t.goto(`${goc}?man=${man}${YEU ? '&yeu=1' : ''}${q}`)
  return { ngu, t, cdp }
}
const tgChinh = async (cdp) => { const m = (await cdp.send('Performance.getMetrics')).metrics; const g = (n) => m.find((x) => x.name === n)?.value ?? 0; return { task: g('TaskDuration') * 1000, script: g('ScriptDuration') * 1000, bo: g('LayoutDuration') * 1000 + g('RecalcStyleDuration') * 1000 } }

async function doBang() {
  const { ngu, t, cdp } = await trang('bang', NHIP ? `&nhip=${NHIP}` : '')
  await t.waitForTimeout(1500); await t.evaluate(() => window.__day()); await t.waitForSelector('.bb-tl', { timeout: 30000 })
  await t.waitForTimeout(1500)
  await t.evaluate(() => {
    const ds = []; let truoc = performance.now(); window.__kh = ds; window.__lt = []
    const buoc = (n) => { ds.push(n - truoc); truoc = n; if (!window.__dung) requestAnimationFrame(buoc) }
    requestAnimationFrame(buoc)
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lt.push(e.duration) }).observe({ entryTypes: ['longtask'] })
  })
  await t.waitForTimeout(500)
  const i0 = await tgChinh(cdp)
  await t.waitForTimeout(1800)
  const i1 = await tgChinh(cdp)
  const a = await tgChinh(cdp)
  await t.evaluate(() => window.__dua(10, 30))
  await t.waitForTimeout(1800)
  const b = await tgChinh(cdp)
  const kq = await t.evaluate(() => { window.__dung = true; return { kh: window.__kh, lt: window.__lt } })
  // chỉ lấy khung từ lúc bắt đầu dồn: ~ 1800+300 ms cuối
  const kh = kq.kh.slice(-Math.ceil(2100 / 16.7))
  await ngu.close()
  return { khungP50: pct(kh, 0.5), khungP95: pct(kh, 0.95), khungMax: Math.max(...kh), khungChay: kh.filter((x) => x > 25).length, tacVuDai: kq.lt.length, tacVuDaiMs: kq.lt.reduce((s, x) => s + x, 0), luongChinhMs: b.task - a.task, scriptMs: b.script - a.script, boCucMs: b.bo - a.bo, nenScriptMs: i1.script - i0.script, nenBoCucMs: i1.bo - i0.bo }
}

async function doEm() {
  const { ngu, t, cdp } = await trang('em')
  await t.evaluate(() => { window.__sk = []; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (e.interactionId) window.__sk.push([e.name, e.duration]) }).observe({ type: 'event', durationThreshold: 16, buffered: true }) })
  await t.waitForTimeout(300)
  await t.evaluate(() => window.__day())
  await t.waitForSelector('button:has-text("Gửi đáp án")', { timeout: 30000 })
  await t.waitForTimeout(800)
  const m0 = await tgChinh(cdp)
  await t.waitForTimeout(2000)
  const m1 = await tgChinh(cdp)
  await t.$$('button, [role="radio"]')
  // các nút phương án = nút không phải «Gửi đáp án», có chữ A./B./...
  const pa = t.locator('button:has-text("CH3N"), button:has-text("C6H5"), [role="radio"]')
  const n = await pa.count()
  for (let i = 0; i < Math.min(n, 4); i++) { await pa.nth(i % n).tap({ timeout: 5000 }).catch(() => {}); await t.waitForTimeout(250) }
  await t.evaluate(() => performance.now())
  await t.locator('button:has-text("Gửi đáp án")').tap({ timeout: 5000 }).catch(() => {})
  await t.waitForTimeout(1500)
  const sk = await t.evaluate(() => window.__sk)
  await ngu.close()
  const phuong = sk.filter(([ten]) => /pointerup|click/.test(ten)).map(([, d]) => d)
  return { bamMax: phuong.length ? Math.max(...phuong) : 0, soSuKien: sk.length, bam: sk, nenTaskMs: m1.task - m0.task, nenScriptMs: m1.script - m0.script }
}

async function doGoiLen() {
  const { ngu, t } = await trang('bang', '&tre=350')
  await t.waitForTimeout(1500); await t.evaluate(() => window.__day()); await t.waitForSelector('.bb-tl', { timeout: 30000 })
  await t.waitForTimeout(2500)
  await t.evaluate(() => performance.now())
  await t.keyboard.press('l')
  await t.waitForFunction(() => !document.querySelector('.bb-chinh:disabled') && document.body.textContent.includes('Mời') || window.__goi, { timeout: 8000 }).catch(() => {})
  await t.waitForTimeout(100)
  const goi = await t.evaluate(() => window.__goi)
  await ngu.close()
  return { goi }
}

const kq = { cpu: CPU, yeu: YEU, bang: [], em: [] }
for (let i = 0; i < LAN; i++) { kq.bang.push(await doBang()); kq.em.push(await doEm()) }
kq.goi = await doGoiLen()
const T = (k) => giua(kq.bang.map((x) => x[k]))
console.log(JSON.stringify({ cpu: CPU, yeu: YEU, bang: { khungP50: T('khungP50'), khungP95: T('khungP95'), khungMax: T('khungMax'), khungQua25: T('khungChay'), tacVuDai: T('tacVuDai'), tacVuDaiMs: Math.round(T('tacVuDaiMs')), luongChinhMs: Math.round(T('luongChinhMs')), scriptMs: Math.round(T('scriptMs')), boCucMs: Math.round(T('boCucMs')), nenScriptMs: Math.round(T('nenScriptMs')), nenBoCucMs: Math.round(T('nenBoCucMs')) }, em: { bamMax: giua(kq.em.map((x) => x.bamMax)), nenTaskMs: Math.round(giua(kq.em.map((x) => x.nenTaskMs))), nenScriptMs: Math.round(giua(kq.em.map((x) => x.nenScriptMs))) }, goi: kq.goi }, null, 1))
if (RA) writeFileSync(RA, JSON.stringify(kq, null, 1))
await trinh.close(); may.close()
