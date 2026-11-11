#!/usr/bin/env node
// ĐO ĐỘ SẮC + ĐỘ MỊN CỦA NÉT BÚT (thầy 11/11, Wacom thật: «làm cho nét bút sắc nét và mịn tuyệt đối»).
// Nạp vào TỜ CHIẾU THẬT ba nét LÝ TƯỞNG trên bảng đen (dữ liệu 200 mẫu / giây, không run tay, lực đã biết) rồi chụp MÀN THẬT của Chromium
// (ảnh chụp = đúng điểm ảnh thiết bị, gồm cả việc trình duyệt co giãn canvas nếu cỡ nền lệch cỡ hiện) ở mật độ điểm ảnh 1 / 1,25 / 1,5 / 2 / 3:
//   · THẲNG  : đoạn thẳng nghiêng 9°, lực đều          — mép lý tưởng là hai đường thẳng song song
//   · SÓNG   : đường hình sin (dốc tới 38°), lực đều   — tâm lý tưởng đã biết ở từng cột
//   · LỰC    : đoạn thẳng, lực lên xuống đều đặn        — bề rộng lý tưởng đổi trơn, soi «hạt» ở chỗ đổi độ dày
// SỐ ĐO (đơn vị: điểm ảnh THẬT của màn):
//   · gồ mép      = độ lệch chuẩn của hai mép nét so với đường lý tưởng (THẲNG: so đường thẳng khớp nhất; SÓNG: so tâm sin đã biết)
//   · gồ bề rộng  = độ lệch chuẩn của bề rộng dọc nét sau khi trừ đường trơn (cửa sổ 15 cột) — «hạt», khớp nối
//   · dốc mép     = bề rộng vùng chuyển từ nền sang mực ở mỗi mép, quy về «độ dài dốc» (1,0 = mép sắc đúng một điểm ảnh; > 1,3 = mờ do canvas bị co giãn)
//   · bậc xám     = số mức độ phủ khác nhau ở điểm ảnh mép (chống răng cưa càng nhiều mức càng trơn)
//   · đứt hạt     = số cột giữa nét mà mực mỏng hơn 55 % bề rộng trung bình (nét mảnh bị đứt quãng)
//   · sáng không đều = độ lệch chuẩn / trung bình (%) của LƯỢNG SÁNG mỗi cột (Σ độ phủ ^ 2,2 — mắt thấy theo ánh sáng thật, không theo số độ phủ):
//                    nét mảnh màu sáng trên nền đen mà chống răng cưa kiểu thường thì chỗ rơi đúng một hàng điểm ảnh sáng rõ, chỗ rơi giữa hai hàng tối đi ⇒ nét «lổn nhổn như hạt»
//   node scripts/but-bang-1011/do-sac-net.mjs [tệp ra = docs/ban-ve-but-1011/so-do-sac-net.json] [thư mục ảnh ×8 = docs/ban-ve-but-1011]
//   GOC_CU=<thư mục chứa src/ của bản cũ>  ⇒ đo thêm bản cũ (cột «trước», ảnh `…-truoc-…`).
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import sharp from 'sharp'
import { taoTo } from './chup.mjs'

const GOC = resolve(import.meta.dirname, '../..')
const RA = resolve(process.argv[2] ?? join(GOC, 'docs/ban-ve-but-1011/so-do-sac-net.json'))
const ANH = resolve(process.argv[3] ?? join(GOC, 'docs/ban-ve-but-1011'))
const MAU = 'rgb(244,239,228)', CO = 1.7
// khổ CSS lẻ ở mật độ lẻ ⇒ cỡ điểm ảnh thật không tròn (như Windows phóng 125 % / 150 %)
const KHO = { 1: [1280, 720], 1.25: [1537, 749], 1.5: [1281, 721], 2: [1280, 720], 3: [1280, 720] }

/** Ba nét lý tưởng, toạ độ px CSS trong cửa sổ W × H; trả nét vectơ chuẩn hoá + mô tả để phân tích. */
function baNet(W, H) {
  const tron = (v, k) => Math.round(v * k) / k
  const net = (id, f, n = 220) => ({ id, cong: 'but', mau: MAU, co: CO, diem: Array.from({ length: n }, (_, i) => { const [x, y, ap] = f(i / (n - 1)); return [tron(x / W, 1e5), tron(y / H, 1e5), tron(ap, 100), i * 5] }) })
  const x0 = W * 0.70, x1 = W * 0.97, dai = x1 - x0
  const thang = { y0: H * 0.22, doc: 0.16 }, song = { y0: H * 0.45, A: H * 0.032, lam: dai / 2.5 }, luc = { y0: H * 0.68, doc: -0.1 }
  return {
    x0, x1,
    net: [
      net('thang', (t) => [x0 + dai * t, thang.y0 + thang.doc * dai * t, 0.5]),
      net('song', (t) => [x0 + dai * t, song.y0 + song.A * Math.sin(2 * Math.PI * dai * t / song.lam), 0.5], 320),
      net('luc', (t) => [x0 + dai * t, luc.y0 + luc.doc * dai * t, 0.5 + 0.35 * Math.sin(2 * Math.PI * 3 * t)]),
    ],
    tam: { thang: (x) => thang.y0 + thang.doc * (x - x0), song: (x) => song.y0 + song.A * Math.sin(2 * Math.PI * (x - x0) / song.lam), luc: (x) => luc.y0 + luc.doc * (x - x0) },
    doc: { thang: () => thang.doc, song: (x) => song.A * 2 * Math.PI / song.lam * Math.cos(2 * Math.PI * (x - x0) / song.lam), luc: () => luc.doc },
  }
}
const lechChuan = (ds) => { const m = ds.reduce((a, b) => a + b, 0) / ds.length; return Math.sqrt(ds.reduce((a, b) => a + (b - m) * (b - m), 0) / ds.length) }
/** Khớp đường thẳng rồi trả phần dư. */
function duThang(xs, ys) {
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n
  let sxy = 0, sxx = 0
  for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2 }
  const b = sxy / sxx
  return ys.map((y, i) => y - (my + b * (xs[i] - mx)))
}
/** Trừ đường trơn (trung bình trượt `cs` cột). */
const duTron = (ds, cs = 15) => ds.map((v, i) => { let s = 0, n = 0; for (let j = Math.max(0, i - (cs >> 1)); j <= Math.min(ds.length - 1, i + (cs >> 1)); j++) { s += ds[j]; n++ } return v - s / n })

/** Phân tích một nét trong ảnh chụp (điểm ảnh thật). `tam(x CSS)` = tâm lý tưởng (px CSS), `doc(x)` = độ dốc. */
function phanTich(anh, rong, cao, d, B, ten) {
  const { x0, x1 } = B, tam = B.tam[ten], doc = B.doc[ten]
  const sang = (x, y) => { const i = (y * rong + x) * 4; return (anh[i] + anh[i + 1] + anh[i + 2]) / 3 }
  // bỏ 12 % hai đầu (chỗ thon đầu / cuối nét)
  const xa = Math.ceil((x0 + (x1 - x0) * 0.12) * d), xb = Math.floor((x0 + (x1 - x0) * 0.88) * d)
  const cot = [], muc = new Set()
  let docMep = 0, nMep = 0, mucSang = 0
  for (let X = xa; X <= xb; X++) {
    const yT = Math.round(tam((X + 0.5) / d) * d), y1 = Math.max(0, yT - 14), y2 = Math.min(cao - 1, yT + 14)
    let nen = 255
    for (let Y = y1; Y <= y2; Y++) nen = Math.min(nen, sang(X, Y))
    let lon = 0
    const a = []
    for (let Y = y1; Y <= y2; Y++) { const v = Math.max(0, sang(X, Y) - nen); a.push(v); if (v > lon) lon = v }
    cot.push({ X, a, y1, lon })
    if (lon > mucSang) mucSang = lon
  }
  // mức mực đặc = sáng nhất gặp được (nét mảnh ở mật độ 1 có thể không điểm ảnh nào phủ kín ⇒ dùng màu mực thật)
  const dac = Math.max(mucSang, 237 - 20)
  const tamDo = [], rongDo = [], mepTren = [], mepDuoi = [], xs = [], sang22 = []
  for (const c of cot) {
    let s = 0, sy = 0, dm = 0, ls = 0
    for (let i = 0; i < c.a.length; i++) { const p = Math.min(1, c.a[i] / dac); s += p; sy += p * (c.y1 + i + 0.5); dm += 4 * p * (1 - p); ls += Math.pow(p, 2.2); if (p > 0.04 && p < 0.96) muc.add(Math.round(p * 64)) }
    if (s < 0.05) { rongDo.push(0); tamDo.push(NaN); continue }
    const k = Math.cos(Math.atan(doc((c.X + 0.5) / d))) // bề rộng đo theo cột ⇒ quy về phương vuông góc với nét
    const yc = sy / s
    sang22.push(ls * k)
    xs.push(c.X); tamDo.push((yc - tam((c.X + 0.5) / d) * d) * k); rongDo.push(s * k)
    mepTren.push((yc - s / 2 - tam((c.X + 0.5) / d) * d) * k); mepDuoi.push((yc + s / 2 - tam((c.X + 0.5) / d) * d) * k)
    docMep += dm * k * 0.75; nMep += 2 // ∫4a(1−a) của một dốc tuyến tính dài L = 2L/3 ⇒ L = 1,5 × tích phân; mỗi cột có hai mép
  }
  const rongCo = rongDo.filter((v) => v > 0), tb = rongCo.reduce((a, b) => a + b, 0) / Math.max(1, rongCo.length)
  // phần dư của mép so với đường lý tưởng, đã trừ xu hướng thẳng (ảnh cắt ở mật độ lẻ lệch gốc / tỉ lệ một phần điểm ảnh)
  const du1 = duThang(xs, mepTren), du2 = duThang(xs, mepDuoi)
  return {
    beRongTrungBinh: +tb.toFixed(3),
    goMep: +(ten === 'luc' ? lechChuan(duTron(tamDo.filter((v) => v === v))) : (lechChuan(du1) + lechChuan(du2)) / 2).toFixed(4),
    goBeRong: +lechChuan(duTron(rongCo)).toFixed(4),
    docMep: +(docMep / Math.max(1, nMep)).toFixed(3),
    bacXam: muc.size,
    dutHat: rongDo.filter((v) => v < tb * 0.55).length,
    sangKhongDeu: ten === 'luc' ? null : +(100 * lechChuan(sang22) / (sang22.reduce((a, b) => a + b, 0) / sang22.length)).toFixed(1),
  }
}

async function do1(trinh, tep, ten, d) {
  const [W, H] = KHO[d]
  const ctx = await trinh.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: d, reducedMotion: 'reduce' })
  const t = await ctx.newPage()
  const loi = []
  t.on('pageerror', (e) => loi.push(e.message))
  await t.goto(pathToFileURL(tep).href)
  await t.waitForFunction(() => document.body.getAttribute('data-bo-cuc') === 'xong')
  await t.keyboard.press('l'); await t.waitForTimeout(2600)
  await t.keyboard.press('b'); await t.waitForTimeout(400)
  const B = baNet(W, H)
  await t.evaluate((net) => { window.__mcBut.nhap(net); const c = document.querySelector('.mc-but-cu'); if (c) c.style.visibility = 'hidden'; const r = document.querySelector('.mc-but-ray'); if (r) r.style.visibility = 'hidden' }, B.net)
  await t.mouse.move(40, H - 60)
  await t.waitForTimeout(300)
  const canvas = await t.evaluate(() => [...document.querySelectorAll('canvas.mc-but')].map((c) => { const r = c.getBoundingClientRect(); return { nen: [c.width, c.height], hien: [+(r.width * devicePixelRatio).toFixed(2), +(r.height * devicePixelRatio).toFixed(2)] } }).filter((c) => c.nen[0] > 8))
  const cat = { x: Math.floor(B.x0 - 12), y: Math.floor(H * 0.12), width: Math.ceil(B.x1 - B.x0 + 24), height: Math.ceil(H * 0.68) }
  const png = await t.screenshot({ type: 'png', clip: cat })
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  // toạ độ trong ảnh cắt: dời gốc
  const Bc = { x0: B.x0 - cat.x, x1: B.x1 - cat.x, tam: Object.fromEntries(Object.entries(B.tam).map(([k, f]) => [k, (x) => f(x + cat.x) - cat.y])), doc: Object.fromEntries(Object.entries(B.doc).map(([k, f]) => [k, (x) => f(x + cat.x)])) }
  const kq = { ban: ten, matDo: d, kho: `${W} × ${H}`, canvas, net: {} }
  for (const n of ['thang', 'song', 'luc']) kq.net[n] = phanTich(data, info.width, info.height, info.width / cat.width, Bc, n)
  // ảnh phóng ×8 (không làm trơn) một khúc sóng + một khúc đổi lực, ở mật độ 1 và 2
  if (d === 1 || d === 2) {
    const o = (xCss, yCss, w, h) => ({ left: Math.round((xCss - cat.x) * d), top: Math.round((yCss - cat.y) * d), width: Math.round(w * d), height: Math.round(h * d) })
    const xg = B.x0 + (B.x1 - B.x0) * 0.42
    const k1 = await sharp(png).extract(o(xg, B.tam.song(xg) - 26 / d * 1, 88 / d, 52 / d)).resize({ width: 88 * 8, kernel: 'nearest' }).png().toBuffer()
    const xl = B.x0 + (B.x1 - B.x0) * 0.2
    const k2 = await sharp(png).extract(o(xl, B.tam.luc(xl) - 16 / d, 88 / d, 26 / d)).resize({ width: 88 * 8, kernel: 'nearest' }).png().toBuffer()
    const ghep = await sharp({ create: { width: 88 * 8, height: 52 * 8 + 26 * 8 + 8, channels: 3, background: { r: 90, g: 90, b: 90 } } }).composite([{ input: k1, left: 0, top: 0 }, { input: k2, left: 0, top: 52 * 8 + 8 }]).jpeg({ quality: 82, mozjpeg: true }).toBuffer()
    mkdirSync(ANH, { recursive: true })
    writeFileSync(join(ANH, `10-net-x8-${ten === 'cu' ? 'truoc' : 'sau'}-dpr${d}.jpg`), ghep)
  }
  await ctx.close()
  if (loi.length) kq.loi = loi
  return kq
}

const ban = [['moi', await taoTo()]]
if (process.env.GOC_CU) ban.unshift(['cu', await taoTo(resolve(process.env.GOC_CU), 'to-cu')])
const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium'
const trinh = await chromium.launch({ executablePath: existsSync(exe) && statSync(exe).isFile() ? exe : undefined })
const kq = []
for (const [ten, tep] of ban) for (const d of (process.env.DPR || '1,1.25,1.5,2,3').split(',').map(Number)) {
  const r = await do1(trinh, tep, ten, d)
  kq.push(r)
  const c = r.canvas[0]
  console.log(`[${ten}] ×${d} (${r.kho}) canvas nền ${c ? c.nen.join('×') : '?'} · hiện ${c ? c.hien.join('×') : '?'}` + ['thang', 'song', 'luc'].map((n) => ` · ${n}: rộng ${r.net[n].beRongTrungBinh} gồ mép ${r.net[n].goMep} gồ rộng ${r.net[n].goBeRong} dốc ${r.net[n].docMep} xám ${r.net[n].bacXam} đứt ${r.net[n].dutHat} sáng lệch ${r.net[n].sangKhongDeu} %`).join('') + (r.loi ? ' · LỖI ' + r.loi.join(' | ') : ''))
}
await trinh.close()
mkdirSync(dirname(RA), { recursive: true })
writeFileSync(RA, JSON.stringify({ luc: new Date().toISOString(), may: 'Chromium không đầu /opt/pw-browsers (vẽ bằng phần mềm); ảnh chụp màn thật theo điểm ảnh thiết bị; nét cỡ 1,7 màu phấn trắng trên bảng đen', donVi: 'điểm ảnh thật', ketQua: kq }, null, 2) + '\n')
if (kq.some((r) => r.loi)) process.exit(1)
