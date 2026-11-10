#!/usr/bin/env node
// ĐO KHUNG HÌNH BÚT VIẾT BẢNG (10/11): phát lại 2000 mẫu điểm bút (200 Hz, có lực) vào TỜ CHIẾU THẬT bằng sự kiện con trỏ THẬT của Chromium
// (CDP Input.dispatchMouseEvent, pointerType = pen ⇒ đi đúng đường Pointer Events + getCoalescedEvents của bộ máy), ở CPU ×1 và ×4.
//   node scripts/but-bang-1011/do-khung.mjs [tệp ra = docs/ban-ve-but-1011/so-do-khung.json]
// Hai bài: «chữ» (công thức viết nhanh, nhiều nét ngắn) và «một nét dài» (xoáy 2000 điểm không nhấc bút — đường in dần xuống lớp tĩnh).
// Số đo mỗi lượt: số khung + khoảng cách khung (trung vị / p95 / số khung trễ > 20 ms) · thời gian xử lý của MỖI lượt requestAnimationFrame
// (trung vị / p95 / lớn nhất) · số sự kiện pointermove và số mẫu gộp nhận được.
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { taoTo } from './chup.mjs'
import { taoNgauNhien, vietDong, camBut } from './chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-but-1011/so-do-khung.json'))
const SO_MAU = 2000

/** Bài «chữ»: viết nhanh (vMax 900 px/s) các dòng công thức tới khi đủ SO_MAU mẫu. */
function baiChu() {
  const rnd = taoNgauNhien(2000), net = []
  const dong = ['CH_3COOH + NaOH', '> CH_3COONa + H_2O', 'n = 0,1 mol', 'C_6H_5OH + NaOH', '> C_6H_5ONa + H_2O', 'CH_3COOH + NaOH', 'n = 0,2 mol']
  let tong = 0
  for (let i = 0; tong < SO_MAU; i++) for (const m of vietDong(dong[i % dong.length], 1312, 190 + (i % 9) * 88, 42, { rnd, vMax: 900 })) { if (tong >= SO_MAU) break; const c = m.slice(0, SO_MAU - tong); net.push(c); tong += c.length }
  return net
}
/** Bài «một nét dài»: xoáy ốc trên bảng đen, 2000 mẫu không nhấc bút, ~1100 px/s. */
function baiXoay() {
  const rnd = taoNgauNhien(7), moc = []
  for (let k = 0; k < 150; k++) { const g = k * 0.52, r = 40 + k * 1.45; moc.push([1595 + r * Math.cos(g), 560 + r * 1.25 * Math.sin(g)]) }
  return [camBut(moc, { rnd, vMax: 1100 }).slice(0, SO_MAU)]
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const tk = (ds) => { const s = [...ds].sort((a, b) => a - b), lay = (p) => s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2) : 0; return { n: s.length, trungVi: lay(0.5), p95: lay(0.95), lonNhat: lay(1) } }

async function do1(trinh, tep, ban, ten, bai, cpu) {
  const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.addInitScript(() => {
    const D = (window.__do = { bat: false, xl: [], khung: [], pm: 0, gop: 0 })
    const raf = window.requestAnimationFrame.bind(window)
    window.requestAnimationFrame = (f) => raf((ts) => { const a = performance.now(); f(ts); if (D.bat) D.xl.push(performance.now() - a) })
    let truoc = 0
    const vong = (ts) => { if (D.bat && truoc) D.khung.push(ts - truoc); truoc = ts; raf(vong) }
    raf(vong)
    addEventListener('pointermove', (e) => { if (D.bat) { D.pm++; D.gop += e.getCoalescedEvents ? e.getCoalescedEvents().length || 1 : 1 } }, true)
  })
  await t.goto(pathToFileURL(tep).href)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  // hãm CPU TRƯỚC khi bật bút: phần làm nóng lúc bật bút cũng chạy trên máy chậm như thật
  const cdp = await ctx.newCDPSession(t)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  if (ban !== 'nen') { await t.keyboard.press('b'); await t.waitForTimeout(400) }
  // VE_NGAY=1 ⇒ bật thử chế độ vẽ ngay khi mẫu tới (bản 11/11, mặc định tắt)
  if (ban === 'moi' && process.env.VE_NGAY) await t.evaluate((v) => window.__mcBut.veNgay && window.__mcBut.veNgay(v === '1'), process.env.VE_NGAY)
  await cdp.send('Performance.enable')
  const soDo = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]))
  await ngu(300)
  const truoc = await soDo()
  await t.evaluate(() => { window.__do.bat = true })
  const cho = []
  const gui = (type, x, y, ap, buttons) => cho.push(cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'pen', force: ap }).catch((e) => loi.push(e.message)))
  const t0 = performance.now()
  for (const m of bai) {
    const dau = performance.now()
    gui('mousePressed', m[0][0], m[0][1], m[0][2], 1)
    for (let i = 1; i < m.length; i++) {
      // đúng nhịp 200 Hz của bút: chờ tới giờ của mẫu rồi mới gửi (không dồn)
      for (let con = dau + m[i][3] - performance.now(); con > 0; con = dau + m[i][3] - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
      gui('mouseMoved', m[i][0], m[i][1], m[i][2], 1)
    }
    const c = m[m.length - 1]
    gui('mouseReleased', c[0], c[1], 0, 0)
    await ngu(70)
  }
  await Promise.all(cho)
  await t.waitForTimeout(400)
  const giay = (performance.now() - t0) / 1000, sau = await soDo()
  const luongChinh = Object.fromEntries(['TaskDuration', 'ScriptDuration', 'LayoutDuration', 'RecalcStyleDuration'].map((k) => [k, +(sau[k] - truoc[k]).toFixed(3)]))
  luongChinh.LayoutCount = sau.LayoutCount - truoc.LayoutCount; luongChinh.RecalcStyleCount = sau.RecalcStyleCount - truoc.RecalcStyleCount
  const D = await t.evaluate(() => { window.__do.bat = false; const g = window.__mcBut ? window.__mcBut.xuat() : { net: [] }; return { ...window.__do, net: g.net.length, diem: g.net.reduce((s, n) => s + n.diem.length, 0), luc: g.net[0] ? g.net[0].diem.slice(2, 7).map((d) => d[2]) : [] } })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  if (process.env.ANH) await t.screenshot({ path: join(process.env.ANH, `do-${ban}-${ten}-x${cpu}.png`) })
  await ctx.close()
  if (process.env.SOI) console.log('  lượt rAF > 3 ms:', D.xl.map((v, i) => [i, +v.toFixed(1)]).filter((x) => x[1] > 3).join(' | '), '\n  khung > 20 ms:', D.khung.map((v, i) => [i, +v.toFixed(0)]).filter((x) => x[1] > 20).join(' | '))
  const khung = tk(D.khung), xl = tk(D.xl), tongXl = D.xl.reduce((s, v) => s + v, 0)
  return {
    ban, bai: ten, cpu: '×' + cpu, mauGui: bai.reduce((s, m) => s + m.length, 0), giay: +giay.toFixed(2),
    khung: { so: khung.n, moiGiay: +(khung.n / (D.khung.reduce((s, v) => s + v, 0) / 1000)).toFixed(1), cachTrungViMs: khung.trungVi, cachP95Ms: khung.p95, cachLonNhatMs: khung.lonNhat, treHon20Ms: D.khung.filter((v) => v > 20).length },
    xuLyMoiKhungMs: { luot: xl.n, trungBinh: +(tongXl / Math.max(1, xl.n)).toFixed(3), trungVi: xl.trungVi, p95: xl.p95, lonNhat: xl.lonNhat }, luongChinhGiay: luongChinh,
    vao: { pointermove: D.pm, mauGop: D.gop, netLuu: D.net, diemLuu: D.diem, lucNetDau: D.luc }, loi,
  }
}

// BẢN: «moi» = mã trong repo này (bút bật) · «nen» = cùng tờ, bút TẮT (chỉ có sự kiện con trỏ ⇒ mức nền của máy đo) ·
// «cu» = bút cũ của origin/main (GOC_CU=<thư mục giải nén `git archive origin/main src`>), nếu có.
const ban = [['moi', await taoTo()]]
ban.push(['nen', ban[0][1]])
if (process.env.GOC_CU) ban.push(['cu', await taoTo(resolve(process.env.GOC_CU), 'to-cu')])
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const kq = []
// CHI=moi:chu:4 ⇒ chỉ chạy đúng một cấu hình (soi nhanh). LAP=n ⇒ mỗi cấu hình đo n lượt XEN KẼ, lấy trung vị (máy đo dùng chung, một lượt đơn lẻ rất nhiễu).
const CHI = (process.env.CHI || '').split(':'), LAP = Math.max(1, +(process.env.LAP || 3))
const BAI = [['chu', baiChu()], ['mot-net-dai', baiXoay()]]
for (let lap = 1; lap <= LAP; lap++) for (const [tenBan, tep] of ban) for (const [ten, bai] of BAI) for (const cpu of tenBan === 'moi' ? [1, 4] : [4]) {
  if (CHI[0] && (CHI[0] !== tenBan || (CHI[1] && CHI[1] !== ten) || (CHI[2] && +CHI[2] !== cpu))) continue
  const r = await do1(trinh, tep, tenBan, ten, bai, cpu)
  r.lap = lap
  kq.push(r)
  console.log(`[${r.ban}] ${r.bai} ${r.cpu} lượt ${lap}: ${r.khung.so} khung · ${r.khung.moiGiay} khung/giây · cách khung p95 ${r.khung.cachP95Ms} ms · trễ >20 ms: ${r.khung.treHon20Ms} · xử lý mỗi khung TB ${r.xuLyMoiKhungMs.trungBinh} / p95 ${r.xuLyMoiKhungMs.p95} / max ${r.xuLyMoiKhungMs.lonNhat} ms (${r.xuLyMoiKhungMs.luot} lượt rAF) · ${r.vao.pointermove} pointermove, ${r.vao.mauGop} mẫu gộp, lưu ${r.vao.diemLuu} điểm / ${r.vao.netLuu} nét · luồng chính ${JSON.stringify(r.luongChinhGiay)}${r.loi.length ? ' · LỖI ' + r.loi.join(' | ') : ''}`)
}
await trinh.close()
const giua = (ds) => { const s2 = [...ds].sort((a, b) => a - b); return s2[Math.floor((s2.length - 1) / 2)] }
const tomTat = []
for (const khoa of [...new Set(kq.map((r) => `${r.ban}|${r.bai}|${r.cpu}`))]) {
  const ds = kq.filter((r) => `${r.ban}|${r.bai}|${r.cpu}` === khoa), [b, bai, cpu] = khoa.split('|')
  const t = { ban: b, bai, cpu, luot: ds.length, khungMoiGiay: giua(ds.map((r) => r.khung.moiGiay)), khungMoiGiayTotNhat: Math.max(...ds.map((r) => r.khung.moiGiay)), khungTreHon20Ms: giua(ds.map((r) => r.khung.treHon20Ms)), tongKhung: giua(ds.map((r) => r.khung.so)), xuLyMoiKhungMs: { trungBinh: giua(ds.map((r) => r.xuLyMoiKhungMs.trungBinh)), p95: giua(ds.map((r) => r.xuLyMoiKhungMs.p95)), lonNhat: giua(ds.map((r) => r.xuLyMoiKhungMs.lonNhat)) }, scriptGiay: giua(ds.map((r) => r.luongChinhGiay.ScriptDuration)), boCucLai: giua(ds.map((r) => r.luongChinhGiay.LayoutCount)) }
  tomTat.push(t)
  console.log(`TRUNG VỊ [${t.ban}] ${t.bai} ${t.cpu} (${t.luot} lượt): ${t.khungMoiGiay} khung/giây (tốt nhất ${t.khungMoiGiayTotNhat}) · ${t.khungTreHon20Ms}/${t.tongKhung} khung trễ >20 ms · xử lý mỗi khung TB ${t.xuLyMoiKhungMs.trungBinh} / p95 ${t.xuLyMoiKhungMs.p95} / max ${t.xuLyMoiKhungMs.lonNhat} ms · script ${t.scriptGiay} s · bố cục lại ${t.boCucLai} lần`)
}
mkdirSync(dirname(RA), { recursive: true })
writeFileSync(RA, JSON.stringify({ luc: new Date().toISOString(), may: 'Chromium headless /opt/pw-browsers, 1920×1080, bút 200 Hz qua CDP (pointerType pen); máy đo dùng chung nên lấy trung vị các lượt xen kẽ', soMau: SO_MAU, tomTat, tungLuot: kq }, null, 2) + '\n')
if (kq.some((r) => r.loi.length)) process.exit(1)
