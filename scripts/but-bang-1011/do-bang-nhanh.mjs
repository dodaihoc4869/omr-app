#!/usr/bin/env node
// ĐO LỚP BẢNG ĐẶC của bút viết bảng (12/11, thầy: «Nét bút bị chậm hơn, làm cho thật hơn tức thì hơn nữa»; sự cố 11/11: lớp mực trong suốt xin
// vẽ-thẳng-lên-màn làm đen kín giấy đề trên card đồ hoạ thật). Tờ chiếu THẬT + sự kiện bút THẬT của Chromium, chạy HAI lần y hệt nhau:
//   · «thường»: localStorage ddh.but.nhanh = tat  ⇒ đường cũ (một lớp mực trong suốt phủ cả tờ);
//   · «bảng đặc»: ddh.but.nhanh = ep ⇒ ép dùng lớp bảng đặc (Chromium không đầu không cấp `desynchronized` nên phải ép; máy thật có cấp thì tự bật).
// Rồi so:
//   1. ĐỀ KHÔNG BAO GIỜ BỊ CHE + HÌNH KHÔNG ĐỔI: ảnh chụp cả cửa sổ ở 6 mốc (viết bảng + giấy + nét vắt qua mép bảng · cuộn bảng · viết tiếp · hoàn tác ·
//      tẩy · đổi cỡ cửa sổ) của hai lần phải GIỐNG NHAU TỪNG ĐIỂM ẢNH — đếm riêng vùng giấy đề (bên trái ô bảng) và vùng bảng;
//   2. KHÔNG NHÁY: mỗi khung hình đọc lại ô bảng (lớp bảng đặc, hoặc cùng ô đó trên lớp mực cũ), đếm điểm ảnh «mực lùi» (độ đậm giảm ≥ 16 / 255) lúc đang
//      viết — hai lần phải cùng cỡ (phần còn lại là đầu nét thon dần khi nét dài ra, có sẵn từ trước); nét «ướt» (bút còn chạm, đứng yên 150 ms) so nét
//      «khô» (sau khi nhấc) — mục tiêu 0;
//   3. thời gian xử lý mỗi khung hình (ô đo bút của tờ) ở CPU ×1 / ×4, hai lần.
// Chromium KHÔNG ĐẦU vẽ bằng phần mềm: không đo được độ trễ ra màn thật của lớp vẽ-thẳng-lên-màn — chỉ thầy thử trên card đồ hoạ thật mới biết.
//   node scripts/but-bang-1011/do-bang-nhanh.mjs [tệp ra = docs/ban-ve-but-1011/so-do-bang-nhanh.json]     MAT_DO=1.5 ⇒ đo ở mật độ khác (mặc định 1 và 1,5)
import { existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { taoTo } from './chup.mjs'
import { camBut, taoNgauNhien, vietDong } from './chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-but-1011/so-do-bang-nhanh.json'))
const ngu = (ms) => new Promise((r) => setTimeout(r, ms))
const tep = await taoTo()
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })

/** Một lượt. Trả ảnh các mốc + số đo. */
async function chay(che, dpr, cpu, chiKhung) {
  const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: dpr, reducedMotion: 'reduce' })
  const t = await ctx.newPage(), loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.addInitScript((c) => {
    try { localStorage.setItem('ddh.but.nhanh', c) } catch { /* không có kho */ }
    // mỗi khung đọc ô bảng của lớp bảng đặc: độ đậm của mực = lệch lớn nhất so với màu nền (điểm ảnh góc trên-trái của ô soi lúc bảng còn trống)
    const D = (window.__bn = { bat: false, lui16: 0, luiLon: 0, khungViet: 0, cham: false, anh: {}, danh: '' })
    const raf = window.requestAnimationFrame.bind(window)
    let truoc = null, nen = null
    // lớp bảng đặc: độ đậm = lệch so với màu nền · đường cũ (lớp mực trong suốt phủ cả tờ): cùng ô đó, độ đậm = độ phủ × 223 / 255 (phấn trắng trên nền bảng)
    const doc = () => {
      const dac = document.querySelector('canvas.mc-but-bang')
      const cv = dac || document.querySelector('canvas.mc-but'); if (!cv || cv.width < 8 || !window.__mcBut) return null
      const b = window.__mcBut.vung().bang; if (!b) return null
      const d = Math.min(devicePixelRatio, 3), x0 = dac ? 0 : Math.round(b[0] * innerWidth * d), y0 = dac ? 0 : Math.round(b[1] * innerHeight * d)
      const g = cv.getContext('2d'), w = Math.min(cv.width - x0, 620), h = Math.min(cv.height - y0, 520), a = g.getImageData(x0, y0, w, h).data
      const m = new Uint8Array(w * h)
      if (!dac) { for (let i = 3, k = 0; i < a.length; i += 4, k++) m[k] = Math.round(a[i] * 223 / 255); return m }
      if (!nen) nen = [a[0], a[1], a[2]]
      for (let i = 0, k = 0; i < a.length; i += 4, k++) m[k] = Math.max(Math.abs(a[i] - nen[0]), Math.abs(a[i + 1] - nen[1]), Math.abs(a[i + 2] - nen[2]))
      return m
    }
    const vong = () => {
      raf(vong)
      if (!D.bat) { truoc = null; return }
      const a = doc(); if (!a) return
      if (D.danh) { D.anh[D.danh] = a; D.danh = '' }
      if (truoc && D.cham) { D.khungViet++; for (let i = 0; i < a.length; i++) { const d = truoc[i] - a[i]; if (d >= 16) { D.lui16++; if (d > D.luiLon) D.luiLon = d } } }
      truoc = a
    }
    raf(vong)
    addEventListener('pointerdown', () => { D.cham = true }, true)
    addEventListener('pointerup', () => { D.cham = false }, true)
    D.so = (x, y) => { const a = D.anh[x], b = D.anh[y]; if (!a || !b) return null; let khac = 0, lon = 0; for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d >= 16) khac++; if (d > lon) lon = d } return [khac, lon] }
  }, che)
  await t.goto(pathToFileURL(tep).href)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  const cdp = await ctx.newCDPSession(t)
  await t.keyboard.press('b'); await t.waitForTimeout(400)
  // ô đo bút đang bật (lấy thời gian xử lý mỗi khung) nhưng ẩn đi: số trong ô mỗi lần chạy một khác, không được tính vào phép so ảnh
  await t.evaluate(() => { window.__mcBut.doBut(true); const k = document.createElement('style'); k.textContent = '.mc-but-do{visibility:hidden!important}'; document.head.appendChild(k) })
  const may = await t.evaluate(() => { const c = document.querySelector('canvas.mc-but-bang'), d = devicePixelRatio, r = c ? c.getBoundingClientRect() : null; return { nhanh: window.__mcBut.nhanh(), lop: !!c, bang: window.__mcBut.vung().bang, lopBang: r ? { diemAnh: [c.width, c.height], hienTaiDiemAnhThietBi: [+(r.left * d).toFixed(3), +(r.top * d).toFixed(3), +(r.width * d).toFixed(3), +(r.height * d).toFixed(3)] } : null } })
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  const cho = []
  const gui = (type, x, y, ap, buttons) => cho.push(cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'pen', force: ap }).catch(() => {}))
  const viet = async (bai, dung) => {
    const uk = []
    for (const m of bai) {
      const dau = performance.now()
      gui('mousePressed', m[0][0], m[0][1], m[0][2], 1)
      for (let i = 1; i < m.length; i++) {
        for (let con = dau + m[i][3] - performance.now(); con > 0; con = dau + m[i][3] - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
        gui('mouseMoved', m[i][0], m[i][1], m[i][2], 1)
      }
      const c = m[m.length - 1]
      if (dung) {
        await Promise.all(cho); await ngu(150 * cpu)
        await t.evaluate(() => { window.__bn.danh = 'uot' }); await t.waitForFunction(() => !window.__bn.danh)
        gui('mouseReleased', c[0], c[1], 0, 0)
        await Promise.all(cho); await ngu(160 * cpu)
        await t.evaluate(() => { window.__bn.danh = 'kho' }); await t.waitForFunction(() => !window.__bn.danh)
        uk.push(await t.evaluate(() => window.__bn.so('uot', 'kho')))
      } else { gui('mouseReleased', c[0], c[1], 0, 0); await ngu(60) }
    }
    await Promise.all(cho); await ngu(250)
    return uk
  }
  const rnd = taoNgauNhien(1211), anh = {}
  const chup = async (ten) => { await ngu(150); anh[ten] = await t.screenshot({ type: 'png' }) }
  await t.evaluate(() => { window.__bn.bat = true })
  // 1 · viết: hai dòng trên bảng (đo nháy + ướt / khô), một nét trên giấy đề, một nét từ giấy vắt sang bảng, một nét từ bảng vắt sang giấy
  const uotKho = await viet([...vietDong('CH_3COOH', 1312, 200, 42, { rnd, vMax: 700 }), ...vietDong('n = 0,1', 1312, 300, 42, { rnd, vMax: 700 })], !chiKhung)
  const soKhung = await t.evaluate(() => { const d = window.__mcBut.doBut(); return { msMoiKhung: +d.msMoiKhung.toFixed(3), msKhungLon: +d.msKhungLon.toFixed(2), khungMoiGiay: d.khungMoiGiay } })
  if (chiKhung) { await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 }); await ctx.close(); return { soKhung, loi } }
  const nhay = await t.evaluate(() => { const D = window.__bn; D.bat = false; return { khungViet: D.khungViet, mucLui16: D.lui16, luiLon: D.luiLon } })
  await viet([camBut([[300, 520], [520, 560], [860, 530]], { rnd, vMax: 900 }), camBut([[1100, 620], [1300, 640], [1520, 610]], { rnd, vMax: 900 }), camBut([[1450, 720], [1250, 735], [1040, 715]], { rnd, vMax: 900 })], false)
  await chup('1-viet')
  // 2 · cuộn bảng · 3 · viết tiếp · 4 · hoàn tác hai lần · 5 · tẩy một nét · 6 · đổi cỡ cửa sổ
  await t.evaluate(() => { window.__mcBut.cuon(0.3) }); await chup('2-cuon')
  await viet(vietDong('NaOH', 1312, 420, 42, { rnd, vMax: 700 }), false); await chup('3-viet-tiep')
  await t.evaluate(() => { window.__mcBut.hoanTac(); window.__mcBut.hoanTac() }); await chup('4-hoan-tac')
  await t.keyboard.press('e')
  await viet([camBut([[1320, 660], [1400, 680], [1500, 700]], { rnd, vMax: 900 })], false)
  await t.keyboard.press('e'); await chup('5-tay')
  await t.setViewportSize({ width: 1600, height: 900 }); await ngu(900); await chup('6-doi-co')
  const cuoi = await t.evaluate(() => ({ nhanh: window.__mcBut.nhanh(), net: window.__mcBut.xuat().net.length, bang: window.__mcBut.vung().bang }))
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await ctx.close()
  return { may, cuoi, anh, uotKho, nhay, soKhung, loi }
}
/** So hai ảnh PNG: số điểm ảnh khác (lệch kênh nào đó > 2) trong vùng giấy (bên trái x0) và vùng còn lại. */
async function so(a, b, xBang) {
  const [x, y] = await Promise.all([a, b].map((p) => sharp(p).raw().toBuffer({ resolveWithObject: true })))
  const { width: w, height: h, channels: c } = x.info
  if (w !== y.info.width || h !== y.info.height) return { loi: 'khác cỡ ảnh' }
  let giay = 0, bang = 0, lon = 0
  for (let i = 0, k = 0; i < x.data.length; i += c, k++) {
    const d = Math.max(Math.abs(x.data[i] - y.data[i]), Math.abs(x.data[i + 1] - y.data[i + 1]), Math.abs(x.data[i + 2] - y.data[i + 2]))
    if (d > 2) { if (k % w < xBang * w) giay++; else bang++; if (d > lon) lon = d }
  }
  return { diemAnhKhacVungGiay: giay, diemAnhKhacVungBang: bang, lechLonNhat: lon, coAnh: `${w} × ${h}` }
}

const kq = { luc: new Date().toISOString(), may: 'Chromium không đầu /opt/pw-browsers (vẽ bằng phần mềm, KHÔNG cấp desynchronized ⇒ lớp bảng đặc phải ép bật), 1920 × 1080, bút 200 Hz qua CDP', matDo: [] }
for (const dpr of (process.env.MAT_DO ? [Number(process.env.MAT_DO)] : [1, 1.5])) {
  const thuong = await chay('tat', dpr, 1), dac = await chay('ep', dpr, 1)
  const dong = { matDo: dpr, thuong: { nhanh: thuong.may.nhanh, coLopBang: thuong.may.lop }, bangDac: { nhanh: dac.may.nhanh, coLopBang: dac.may.lop, lopBang: dac.may.lopBang, sauDoiCo: dac.cuoi.nhanh }, soNet: [thuong.cuoi.net, dac.cuoi.net], soAnh: {}, khongNhay: null, khung: {} }
  for (const ten of Object.keys(thuong.anh)) dong.soAnh[ten] = await so(thuong.anh[ten], dac.anh[ten], (ten === '6-doi-co' ? dac.cuoi.bang : dac.may.bang)[0])
  const nhay = (r) => { const uk = r.uotKho.filter(Boolean); return { ...r.nhay, netUotKho: uk.length, netUotKhacKho: uk.filter((x) => x[0] > 0).length, diemAnhUotKhacKho: uk.reduce((s, x) => s + x[0], 0) } }
  dong.khongNhay = { thuong: nhay(thuong), bangDac: nhay(dac) }
  dong.khung['×1'] = { thuong: thuong.soKhung, bangDac: dac.soKhung }
  if (dpr === 1) { const a = await chay('tat', dpr, 4, true), b = await chay('ep', dpr, 4, true); dong.khung['×4'] = { thuong: a.soKhung, bangDac: b.soKhung } }
  dong.loiTrang = [...thuong.loi, ...dac.loi]
  kq.matDo.push(dong)
  console.log(`[mật độ ${dpr}] lớp bảng đặc: ${JSON.stringify(dong.bangDac.nhanh)} · ${JSON.stringify(dong.bangDac.lopBang)} · nét ${dong.soNet.join(' / ')}`)
  for (const [ten, r] of Object.entries(dong.soAnh)) console.log(`   ảnh ${ten}: vùng giấy khác ${r.diemAnhKhacVungGiay} · vùng bảng khác ${r.diemAnhKhacVungBang} (lệch lớn nhất ${r.lechLonNhat})`)
  console.log(`   không nháy: ${JSON.stringify(dong.khongNhay)}`)
  console.log(`   khung: ${JSON.stringify(dong.khung)}`)
  if (dong.loiTrang.length) console.log('   LỖI TRANG:', dong.loiTrang.join(' | '))
  if (process.env.ANH) { mkdirSync(process.env.ANH, { recursive: true }); for (const [ten, b] of Object.entries(dac.anh)) writeFileSync(join(process.env.ANH, `dac-${dpr}-${ten}.png`), b); for (const [ten, b] of Object.entries(thuong.anh)) writeFileSync(join(process.env.ANH, `thuong-${dpr}-${ten}.png`), b) }
}
await trinh.close()
mkdirSync(dirname(RA), { recursive: true })
writeFileSync(RA, JSON.stringify(kq, null, 2) + '\n')
