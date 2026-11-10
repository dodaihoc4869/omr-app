// THỨ TỰ SỰ KIỆN THẬT của Chromium khi luồng chính bận (11/11): pointerrawupdate có mang mẫu của NÉT SAU — sau một pointerup / pointerdown CHƯA được phát — không?
import { chromium } from 'playwright'
import { taoTo } from './chup.mjs'
import { baiChuNho, layMau } from './chu-nho.mjs'
const tep = await taoTo(undefined, 'to-thu')
const trinh = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
for (const [dpr, ban] of [[1, 0], [2, 0], [1, 30]]) {
  const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: dpr })
  const t = await ctx.newPage()
  await t.goto('file://' + tep)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  await t.keyboard.press('b'); await t.waitForTimeout(300)
  await t.evaluate((ban) => {
    const cv = document.querySelector('canvas.mc-but-song'), G = (window.__g = [])
    for (const loai of ['pointerdown', 'pointerup', 'pointerrawupdate', 'pointermove']) cv.addEventListener(loai, (e) => { const c = e.getCoalescedEvents ? e.getCoalescedEvents() : []; G.push([loai.slice(7, 10), +e.timeStamp.toFixed(1), c.length, c.length ? +c[0].timeStamp.toFixed(1) : 0, c.length ? +c[c.length - 1].timeStamp.toFixed(1) : 0, e.buttons]) }, true)
    // luồng chính bận: mỗi khung hình đốt `ban` ms
    if (ban) { const dot = () => { const a = performance.now(); while (performance.now() - a < ban); requestAnimationFrame(dot) }; requestAnimationFrame(dot) }
  }, ban)
  const cdp = await ctx.newCDPSession(t)
  const sk = layMau(baiChuNho(), 200, 'but'), cho = []
  const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
  const t0 = performance.now()
  for (const e of sk) {
    for (let con = t0 + e.t - performance.now(); con > 0; con = t0 + e.t - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
    cho.push(cdp.send('Input.dispatchMouseEvent', { type: e.k === 'd' ? 'mousePressed' : e.k === 'u' ? 'mouseReleased' : 'mouseMoved', x: e.x, y: e.y, button: 'left', buttons: e.k === 'u' ? 0 : 1, clickCount: e.k === 'm' ? 0 : 1, pointerType: 'pen', force: e.p }))
  }
  await Promise.all(cho); await t.waitForTimeout(500)
  const G = await t.evaluate(() => window.__g)
  // tìm: raw có mẫu cuối MUỘN hơn giờ của pointerup / pointerdown được phát SAU nó
  let lechThuTu = 0, rawSauMove = 0, giuaNet = 0, trong = false, lonNhatMuon = 0
  const gioMaxDaThay = { raw: 0, mov: 0 }
  for (let i = 0; i < G.length; i++) {
    const l = G[i][0], b = G[i][4]
    if (l === 'dow') trong = true
    if (l === 'up') trong = false
    if (l === 'raw') { if (!trong) giuaNet++; for (let j = i + 1; j < G.length; j++) if (G[j][0] === 'up' || G[j][0] === 'dow') { if (b > G[j][1] + 0.05) { lechThuTu++; lonNhatMuon = Math.max(lonNhatMuon, b - G[j][1]) } break } }
    if (l === 'raw') gioMaxDaThay.raw = Math.max(gioMaxDaThay.raw, b)
    if (l === 'mov' && trong) { if (b > gioMaxDaThay.raw + 0.05) rawSauMove++ }
  }
  const dem = (x) => G.filter((g) => g[0] === x).length
  console.log(`dpr ${dpr} · đốt ${ban} ms/khung · down ${dem('dow')} up ${dem('up')} raw ${dem('raw')} move ${dem('mov')} · raw mang mẫu MUỘN hơn up/down phát sau nó: ${lechThuTu} lần (muộn nhất ${lonNhatMuon.toFixed(1)} ms) · raw phát ngoài nét: ${giuaNet} · move mang mẫu mà raw chưa đưa: ${rawSauMove} · nét ghi được ${await t.evaluate(() => window.__mcBut.xuat().net.length)}`)
  if (lechThuTu) { const i = G.findIndex((g, k) => g[0] === 'raw' && G.slice(k + 1).find((h) => h[0] === 'up' || h[0] === 'dow')?.[1] + 0.05 < g[4]); console.log(JSON.stringify(G.slice(Math.max(0, i - 3), i + 8))) }
  await ctx.close()
}
await trinh.close()
