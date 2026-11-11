#!/usr/bin/env node
// ĐO «CHỮ BỊ NHÁY» CỦA BÚT VIẾT BẢNG (thầy 11/11: «nét bút trên máy gv … chữ đang bị nháy chưa mượt như goodnote»).
// Phát lại chữ viết tay mẫu (bút 200 Hz, có lực) vào TỜ CHIẾU THẬT bằng sự kiện con trỏ THẬT của Chromium, và ở MỖI KHUNG HÌNH chụp lại
// đúng thứ đang hiện trên màn (mọi lớp canvas.mc-but chồng theo thứ tự DOM) rồi so với khung trước:
//   · MỰC LÙI = điểm ảnh đang có mực mà khung sau NHẠT ĐI (độ phủ alpha giảm) — mắt thấy là «nháy»;
//   · NHẤC BÚT = ảnh nét «ướt» (bút còn chạm, đã đứng yên 150 ms) so với ảnh nét «khô» (sau khi nhấc 8 khung) — mục tiêu 0 điểm ảnh khác;
//   · VẼ LẠI   = ảnh sau khi viết xong so với ảnh dựng lại cả trang từ vectơ (hoàn tác / đổi cỡ / sang câu rồi quay lại).
//   node scripts/but-bang-1011/do-nhay.mjs [tệp ra = docs/ban-ve-but-1011/so-do-nhay.json]
//   GOC_CU=<thư mục giải nén `git archive <commit cũ> src`>  ⇒ đo thêm bản cũ để có cột «trước».
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { taoTo } from './chup.mjs'
import { taoNgauNhien, vietDong, camBut } from './chu-tay-mau.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-but-1011/so-do-nhay.json'))
// vùng soi (px CSS ở khổ 1920 × 1080): một ô trên bảng đen
const VUNG = [1290, 150, 600, 420]

/** Bài viết: 3 dòng chữ nhỏ (nét ngắn — cả nét nằm ở đoạn «đang viết» tới lúc nhấc) + một nét lượn dài (có in dần xuống lớp đã chốt). */
function baiViet() {
  const rnd = taoNgauNhien(1111), net = []
  for (const [chuoi, y] of [['CH_3COOH + NaOH', 200], ['n = 0,1 mol', 300], ['C_6H_5OH', 400]]) net.push(...vietDong(chuoi, 1312, y, 42, { rnd, vMax: 700 }))
  const moc = []
  for (let k = 0; k < 60; k++) moc.push([1320 + k * 9, 500 + 34 * Math.sin(k * 0.55)])
  net.push(camBut(moc, { rnd, vMax: 1000 }))
  return net
}

const ngu = (ms) => new Promise((r) => setTimeout(r, ms))

async function do1(trinh, tep, ten, cpu, dung) {
  const ctx = await trinh.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.addInitScript((V) => {
    const D = (window.__nh = { bat: false, cham: false, khung: [], anh: {}, danh: '', nhac: -1 })
    const raf = window.requestAnimationFrame.bind(window)
    let tam = null, g = null, truoc = null
    const chup = () => {
      const cs = document.querySelectorAll('canvas.mc-but')
      if (!cs.length) return null
      if (!tam) { tam = document.createElement('canvas'); tam.width = V[2]; tam.height = V[3]; g = tam.getContext('2d', { willReadFrequently: true }) }
      g.clearRect(0, 0, V[2], V[3])
      for (const c of cs) if (c.width > 8) g.drawImage(c, V[0], V[1], V[2], V[3], 0, 0, V[2], V[3])
      return g.getImageData(0, 0, V[2], V[3]).data
    }
    // vòng này đăng ký TRƯỚC các lượt vẽ của tờ ⇒ chạy đầu mỗi khung: thứ chụp được = đúng hình vừa hiện ở khung trước
    const vong = () => {
      raf(vong)
      if (!D.bat) { truoc = null; return }
      const a = chup(); if (!a) return
      if (D.danh) { D.anh[D.danh] = a.slice(); D.danh = '' }
      if (truoc) {
        let tang = 0, lui1 = 0, lui16 = 0, luiLon = 0
        for (let i = 3; i < a.length; i += 4) { const d = a[i] - truoc[i]; if (d > 0) tang++; else if (d < 0) { lui1++; if (d <= -16) lui16++; if (-d > luiLon) luiLon = -d } }
        if (tang || lui1) D.khung.push([D.cham ? 1 : 0, tang, lui1, lui16, luiLon, D.nhac >= 0 ? D.nhac++ : -1])
      }
      truoc = a
    }
    raf(vong)
    addEventListener('pointerdown', () => { D.cham = true; D.nhac = -1 }, true)
    addEventListener('pointerup', () => { D.cham = false; D.nhac = 0 }, true)
    // so hai ảnh theo MÀU ĐÃ NHÂN ĐỘ PHỦ (thứ mắt thấy trên nền): điểm ảnh gần trong suốt mà khác màu thì không tính là khác
    D.so = (a, b) => { const x = D.anh[a], y = D.anh[b]; let khac = 0, khac16 = 0, lon = 0; if (!x || !y) return null; for (let i = 0; i < x.length; i += 4) { const p = x[i + 3] / 255, q = y[i + 3] / 255, d = Math.round(Math.max(Math.abs(x[i] * p - y[i] * q), Math.abs(x[i + 1] * p - y[i + 1] * q), Math.abs(x[i + 2] * p - y[i + 2] * q), Math.abs(x[i + 3] - y[i + 3]))); if (d) { khac++; if (d >= 16) khac16++; if (d > lon) lon = d } } return [khac, khac16, lon] }
  }, VUNG)
  await t.goto(pathToFileURL(tep).href)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  const cdp = await ctx.newCDPSession(t)
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu })
  await t.keyboard.press('b'); await t.waitForTimeout(400)
  const may = await t.evaluate(() => { const d = window.__mcBut.doBut ? window.__mcBut.doBut() : {}; return { duocNgay: !!d.duocNgay, coRaw: !!d.coRaw } })
  await t.evaluate(() => { window.__nh.bat = true })
  const cho = []
  const gui = (type, x, y, ap, buttons) => cho.push(cdp.send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons, clickCount: type === 'mouseMoved' ? 0 : 1, pointerType: 'pen', force: ap }).catch((e) => loi.push(e.message)))
  const danh = async (ten2) => { await t.evaluate((n) => { window.__nh.danh = n }, ten2); await t.waitForFunction(() => !window.__nh.danh) }
  const nhac = []
  const bai = baiViet()
  for (let k = 0; k < bai.length; k++) {
    const m = bai[k], dau = performance.now()
    gui('mousePressed', m[0][0], m[0][1], m[0][2], 1)
    for (let i = 1; i < m.length; i++) {
      for (let con = dau + m[i][3] - performance.now(); con > 0; con = dau + m[i][3] - performance.now()) await (con > 2.5 ? ngu(1) : new Promise((r) => setImmediate(r)))
      gui('mouseMoved', m[i][0], m[i][1], m[i][2], 1)
    }
    const c = m[m.length - 1]
    if (dung) {
      // bút ĐỨNG YÊN 150 ms rồi mới nhấc: ảnh «ướt» không còn đoạn dự đoán / mẫu chờ ⇒ khác biệt còn lại là do chính việc chốt nét
      await Promise.all(cho); await ngu(150 * cpu); await danh('uot')
      gui('mouseReleased', c[0], c[1], 0, 0)
      await Promise.all(cho); await ngu(160 * cpu); await danh('kho')
      nhac.push(await t.evaluate(() => window.__nh.so('uot', 'kho')))
    } else { gui('mouseReleased', c[0], c[1], 0, 0); await ngu(70) }
  }
  await Promise.all(cho); await ngu(300)
  // dựng lại cả trang từ vectơ (như hoàn tác / đổi cỡ / quay lại câu này) — không tính vào «sau nhấc»
  await t.evaluate(() => { window.__nh.nhac = -1 })
  await danh('xong')
  await t.evaluate(() => { window.__mcBut.nhap(window.__mcBut.xuat()) })
  await ngu(200); await danh('veLai')
  const D = await t.evaluate(() => ({ khung: window.__nh.khung, veLai: window.__nh.so('xong', 'veLai'), net: window.__mcBut.xuat().net.length }))
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 })
  await ctx.close()
  // khung = [bút đang chạm, số điểm ảnh thêm mực, lùi ≥ 1, lùi ≥ 16 / 255, mức lùi lớn nhất, thứ tự khung kể từ lúc nhấc]
  const viet = D.khung.filter((k) => k[0]), sauNhac = D.khung.filter((k) => !k[0] && k[5] >= 0 && k[5] < 10)
  const tong = (ds, i) => ds.reduce((s, k) => s + k[i], 0), lon = (ds, i) => ds.reduce((s, k) => Math.max(s, k[i]), 0)
  const r = {
    ban: ten, cpu: '×' + cpu, kieuNhac: dung ? 'đứng yên 150 ms rồi nhấc' : 'nhấc ngay khi đang đi', net: D.net, may,
    dangViet: { khungCoDoi: viet.length, khungCoLui: viet.filter((k) => k[3] > 0).length, diemAnhLui1: tong(viet, 2), diemAnhLui16: tong(viet, 3), mucLuiLon: lon(viet, 4) },
    sauNhac: { khungCoLui: sauNhac.filter((k) => k[3] > 0).length, diemAnhLui1: tong(sauNhac, 2), diemAnhLui16: tong(sauNhac, 3), mucLuiLon: lon(sauNhac, 4) },
    veLaiTuVecto: D.veLai ? { diemAnhKhac: D.veLai[0], khac16: D.veLai[1], mucLon: D.veLai[2] } : null, loi,
  }
  if (dung && process.env.SOI) console.log('  ướt so khô từng nét [khác, ≥16, lớn nhất]:', nhac.map((x, i) => x && x[0] ? i + ':' + x.join('/') + '(' + bai[i].length + ' mẫu)' : '').filter(Boolean).join(' '))
  if (dung) { const ds = nhac.filter(Boolean); r.uotSoKho = { soNet: ds.length, netCoKhac: ds.filter((x) => x[0] > 0).length, diemAnhKhac: ds.reduce((s, x) => s + x[0], 0), khac16: ds.reduce((s, x) => s + x[1], 0), mucLon: ds.reduce((s, x) => Math.max(s, x[2]), 0) } }
  return r
}

const ban = [['moi', await taoTo()]]
if (process.env.GOC_CU) ban.push(['cu', await taoTo(resolve(process.env.GOC_CU), 'to-cu')])
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const kq = []
for (const [ten, tep] of ban) for (const cpu of (process.env.CPU || '1,4').split(',').map(Number)) for (const dung of [true, false]) {
  const r = await do1(trinh, tep, ten, cpu, dung)
  kq.push(r)
  console.log(`[${r.ban}] ${r.cpu} · ${r.kieuNhac} · ${r.net} nét` + (r.uotSoKho ? ` · ƯỚT so KHÔ: ${r.uotSoKho.diemAnhKhac} điểm ảnh khác (${r.uotSoKho.khac16} khác ≥ 16/255, lớn nhất ${r.uotSoKho.mucLon}) ở ${r.uotSoKho.netCoKhac}/${r.uotSoKho.soNet} nét` : '') +
    ` · đang viết: ${r.dangViet.khungCoLui}/${r.dangViet.khungCoDoi} khung có mực lùi, ${r.dangViet.diemAnhLui16} điểm ảnh lùi ≥ 16 (lùi ≥ 1: ${r.dangViet.diemAnhLui1}, lớn nhất ${r.dangViet.mucLuiLon})` +
    ` · 10 khung sau nhấc: ${r.sauNhac.diemAnhLui16} điểm ảnh lùi ≥ 16 (≥ 1: ${r.sauNhac.diemAnhLui1}, lớn nhất ${r.sauNhac.mucLuiLon})` +
    ` · vẽ lại từ vectơ: ${r.veLaiTuVecto ? r.veLaiTuVecto.diemAnhKhac + ' khác (≥ 16: ' + r.veLaiTuVecto.khac16 + ', lớn nhất ' + r.veLaiTuVecto.mucLon + ')' : '—'}${r.loi.length ? ' · LỖI ' + r.loi.join(' | ') : ''}`)
}
await trinh.close()
mkdirSync(dirname(RA), { recursive: true })
writeFileSync(RA, JSON.stringify({ luc: new Date().toISOString(), may: 'Chromium headless /opt/pw-browsers, 1920×1080, điểm ảnh ×1, bút 200 Hz qua CDP (pointerType pen)', vungSoi: VUNG, ketQua: kq }, null, 2) + '\n')
if (kq.some((r) => r.loi.length)) process.exit(1)
