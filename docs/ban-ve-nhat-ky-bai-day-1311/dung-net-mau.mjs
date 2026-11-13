// BẢN VẼ «Nhật ký bài dạy»: máy dựng NÉT MẪU (giả nét viết tay của Thầy) cho hai mockup. Chỉ phục vụ bản vẽ, không vào app.
// Chạy:  PHONG_MOT_NET=<đường tới EMSReadabilityItalic.svg> node docs/ban-ve-nhat-ky-bai-day-1311/dung-net-mau.mjs
// Phông một nét «EMS Readability Italic» (SIL Open Font License, gói npm `hersheytext`, thư mục svg_fonts) chỉ dùng để có đường nét sạch;
// dấu tiếng Việt, số 4, Δ, χ, ≥, ≤, ⇒, khung, gạch chân, thước Δχ là nét tự vẽ ở tệp này. Bản thật KHÔNG dùng phông: vẽ lại đúng nét trong `net.bin` của buổi.
// Đầu ra `net-mau.js` cùng dạng thông tin với nét thật (src/lib/but-bang-loi.ts): màu, cỡ, giờ bắt đầu trên trục tiếng, từng điểm [x, y, ms kể từ đầu nét].
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const DAY = dirname(fileURLToPath(import.meta.url))
const TEP = process.env.PHONG_MOT_NET
if (!TEP) { console.error('Thiếu PHONG_MOT_NET (đường tới EMSReadabilityItalic.svg)'); process.exit(1) }

// ── phông một nét ──
const G = {}
for (const m of readFileSync(TEP, 'utf8').matchAll(/<glyph unicode="([^"]*)"[^>]*?horiz-adv-x="([\d.]+)"(?:[^>]*? d="([^"]*)")?/g)) {
  const u = m[1].replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace('&amp;', '&').replace('&apos;', "'")
  const net = []
  let cur = null
  const s = (m[3] || '').trim().split(/\s+/)
  for (let i = 0; i < s.length;) {
    const c = s[i++]
    if (c === 'M') { cur = [[+s[i++], +s[i++]]]; net.push(cur) }
    else if (c === 'L') cur.push([+s[i++], +s[i++]])
    else if (c === 'C') { const p0 = cur[cur.length - 1], a = [+s[i++], +s[i++]], b = [+s[i++], +s[i++]], d = [+s[i++], +s[i++]]
      for (let k = 1; k <= 6; k++) { const t = k / 6, q = 1 - t; cur.push([q * q * q * p0[0] + 3 * q * q * t * a[0] + 3 * q * t * t * b[0] + t * t * t * d[0], q * q * q * p0[1] + 3 * q * q * t * a[1] + 3 * q * t * t * b[1] + t * t * t * d[1]]) } }
    else if (c) break
  }
  G[u] = { a: +m[2], net }
}
// ký hiệu tự vẽ (đơn vị 1000, y hướng lên, chữ thường cao 488, chữ hoa cao 650)
G['4'] = { a: 504, net: [[[372, 646], [262, 470], [118, 222], [300, 226], [506, 222]], [[398, 452], [372, 226], [346, 4]]] }
G['Δ'] = { a: 640, net: [[[95, 8], [250, 330], [395, 655], [470, 330], [545, 8], [320, 0], [95, 8]]] }
G['χ'] = { a: 500, net: [[[95, 425], [140, 478], [195, 470], [232, 400], [265, 250], [300, 60], [322, -90], [352, -165], [402, -178], [446, -140]], [[470, 480], [360, 280], [215, 40], [85, -175]]] }
G['≥'] = { a: 600, net: [[[150, 560], [330, 480], [520, 410], [330, 335], [130, 255]], [[105, 120], [495, 124]]] }
G['≤'] = { a: 600, net: [[[540, 560], [350, 480], [160, 405], [340, 335], [520, 255]], [[105, 120], [495, 124]]] }
G['⇒'] = { a: 820, net: [[[110, 400], [640, 404]], [[85, 236], [615, 240]], [[545, 520], [650, 420], [745, 322], [630, 225], [505, 120]]] }

// dấu tiếng Việt (mã ghép): toạ độ so với (tâm ngang ở đỉnh chữ, đỉnh chữ)
const SAC = 0x301, HUYEN = 0x300, HOI = 0x309, MU = 0x302, TRANG_ = 0x306, NANG = 0x323, MOC = 0x31b
const DAU = {
  [SAC]: [[[75, 215], [20, 135], [-40, 50]]],
  [HUYEN]: [[[-75, 215], [-25, 135], [30, 50]]],
  [HOI]: [[[-35, 150], [0, 195], [45, 200], [70, 165], [50, 115], [10, 85], [5, 45]]],
  [MU]: [[[-80, 45], [-10, 135], [28, 205], [55, 130], [85, 40]]],
  [TRANG_]: [[[-75, 195], [-58, 110], [-10, 62], [45, 82], [80, 190]]],
}
const DAU_DUOI = [[[0, -118], [6, -130], [-4, -136], [0, -118]]]
const moc = (a) => [[[a - 96, 452], [a - 28, 474], [a - 2, 540], [a - 22, 606]]]
const laDau = (c) => { const m = c.codePointAt(0); return m >= 0x300 && m <= 0x36f }

// ── ngẫu nhiên có hạt giống ──
let hat = 20261113
const rd = () => { hat |= 0; hat = (hat + 0x6d2b79f5) | 0; let t = Math.imul(hat ^ (hat >>> 15), 1 | hat); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const lac = (k) => (rd() * 2 - 1) * k

// ── bảng 1600 × 900, trục tiếng ms ──
const MAU = [['rgb(244,239,228)', 'Phấn trắng'], ['rgb(255,210,122)', 'Phấn vàng'], ['rgb(110,231,183)', 'Phấn xanh ngọc'], ['rgb(253,164,175)', 'Phấn hồng']]
const TR = 0, VA = 1, XA = 2, HO = 3
const net = [], bang = []
let gio = 0
const TOC = 520 // px mỗi giây khi phấn chạm bảng
function them(diem, mau, co) {
  if (diem.length < 2) return
  const p = []
  let t = 0
  for (let i = 0; i < diem.length; i++) {
    if (i) t += Math.max(6, (Math.hypot(diem[i][0] - diem[i - 1][0], diem[i][1] - diem[i - 1][1]) / TOC) * 1000 * (0.85 + rd() * 0.3))
    p.push(Math.round(diem[i][0] * 4), Math.round(diem[i][1] * 4), Math.round(t))
  }
  net.push({ m: mau, c: co, t: Math.round(gio), p })
  gio += t + 70 + rd() * 90
}
const nghi = (ms) => { gio += ms }
const luc = (phut, giay) => { const t = (phut * 60 + giay) * 1000; if (t < gio) throw new Error(`lùi giờ ${phut}:${giay} < ${Math.round(gio / 1000)} giây`); gio = t }

/** Bề ngang một dòng chữ ở cỡ `co` (px, chữ hoa cao `co`). */
function rong(chu, co) {
  const k = co / 650
  let w = 0, duoi = false
  for (const c of chu.normalize('NFD')) {
    if (c === ' ') w += 250 * k
    else if (c === '_') duoi = true
    else if (!laDau(c)) { if (!G[c]) throw new Error(`thiếu chữ «${c}» trong «${chu}»`); w += G[c].a * k * 0.96 * (duoi ? 0.62 : 1); duoi = false }
  }
  return w
}
/** Viết một dòng chữ, tự thu cỡ để không rộng quá `toiDa` px. `_x` = chỉ số dưới. Trả x cuối dòng. */
function viet(chu, x, y, co, mau, netCo = 3.1, toiDa = 0) {
  if (toiDa) co = Math.min(co, (co * toiDa) / rong(chu, co))
  const k = co / 650
  let duoi = false
  const ky = [...chu.normalize('NFD')]
  for (let i = 0; i < ky.length; i++) {
    const c = ky[i]
    if (c === ' ') { x += 250 * k; gio += 160; continue }
    if (c === '_') { duoi = true; continue }
    if (laDau(c)) continue
    const g = G[c]
    const kk = k * (duoi ? 0.62 : 1) * (1 + lac(0.03)), dy = (duoi ? 0.2 * co : 0) + lac(co * 0.02), xoay = lac(0.018)
    const dat = ([px, py]) => { const X = px * kk, Y = -py * kk; return [x + X * Math.cos(xoay) - Y * Math.sin(xoay) + lac(0.4), y + dy + X * Math.sin(xoay) + Y * Math.cos(xoay) + lac(0.4)] }
    for (const s of g.net) them(s.map(dat), mau, netCo * (duoi ? 0.9 : 1))
    // dấu đi theo chữ
    const hoa = c === c.toUpperCase() && c !== c.toLowerCase(), cao = hoa || 'bdfhklt'.includes(c) ? 660 : 500, tam = g.a / 2 + cao * 0.19
    let tang = 0, j = i + 1
    for (; j < ky.length && laDau(ky[j]); j++) {
      const d = ky[j].codePointAt(0)
      if (d === NANG) for (const s of DAU_DUOI) them(s.map(([a, b]) => dat([a + g.a / 2 - 30, b])), mau, netCo * 1.25)
      else if (d === MOC) for (const s of moc(g.a)) them(s.map(dat), mau, netCo)
      else if (DAU[d]) { for (const s of DAU[d]) them(s.map(([a, b]) => dat([a + tam + (tang ? 105 : 0), b + cao + tang])), mau, netCo); if (d === MU || d === TRANG_) tang = 150 }
    }
    i = j - 1
    x += g.a * kk * 0.96
    duoi = false
    gio += 40
  }
  return x
}
function duong(ds, mau, co = 3.2, buoc = 26) {
  const p = []
  for (let i = 0; i < ds.length - 1; i++) { const [x0, y0] = ds[i], [x1, y1] = ds[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / buoc)); for (let j = i ? 1 : 0; j <= n; j++) p.push([x0 + ((x1 - x0) * j) / n + lac(1.1), y0 + ((y1 - y0) * j) / n + lac(1.1)]) }
  them(p, mau, co)
}
/** Khung chữ nhật Thầy vẽ một nét quanh kết luận (góc hơi tròn, hai đầu chờm nhau). */
function khung(x0, y0, x1, y1, mau = HO) {
  const g = 14
  duong([[x0 + g, y0 + lac(3)], [x1 - g, y0 + lac(4)], [x1, y0 + g], [x1 + lac(4), y1 - g], [x1 - g, y1], [x0 + g, y1 + lac(4)], [x0, y1 - g], [x0 + lac(3), y0 + g], [x0 + g + 4, y0 - 3], [x0 + 60, y0 + 2]], mau, 3.6, 30)
}
const cung = (x0, x1, y, cao, mau) => { const p = []; for (let i = 0; i <= 14; i++) { const t = i / 14; p.push([x0 + (x1 - x0) * t + lac(1), y - Math.sin(Math.PI * t) * cao + lac(1)]) } them(p, mau, 3.4) }
/** Viết căn giữa quanh `xGiua`. */
const giua = (chu, xGiua, y, co, mau, netCo, toiDa) => { const c = toiDa ? Math.min(co, (co * toiDa) / rong(chu, co)) : co; return viet(chu, xGiua - rong(chu, c) / 2, y, c, mau, netCo) }

const TRAI = 950 // bề ngang vùng 2/3 trái dùng được (vạch chia bảng ở x = 1067)
// ════════ BẢNG 1 ════════
bang.push(0)
// Trang 1 · hai nguyên tử giống nhau
luc(1, 20)
let x = viet('O_2 , H_2 :', 70, 132, 62, VA, 3.4)
nghi(2600)
viet('2 nguyên tử giống nhau', x + 30, 132, 47, TR, 3.1, 70 + TRAI - x - 30)
nghi(7800)
viet('⇒ liên kết cộng hoá trị', 96, 232, 48, TR, 3.1, 800)
nghi(6200)
x = viet('không phân cực', 214, 332, 56, XA, 3.4, 560)
nghi(5200)
khung(186, 262, x + 30, 362)

// Trang 2 · hiệu độ âm điện từ 1,7
luc(5, 12)
giua('Δχ ≥ 1,7', 1334, 150, 60, VA, 3.4, 380)
nghi(8400)
giua('⇒ thường là', 1334, 238, 44, TR, 3.1, 400)
nghi(1800)
giua('liên kết ion', 1334, 314, 46, TR, 3.1, 380)
nghi(4600)
khung(1104, 72, 1566, 350)

// Trang 3 · thước Δχ
luc(9, 34)
duong([[130, 660], [1440, 660]], TR, 3.4)
duong([[1402, 636], [1444, 660], [1400, 686]], TR, 3.4)
viet('Δχ', 1466, 676, 46, VA, 3.2)
nghi(3000)
for (const [tx, so] of [[190, '0'], [560, '0,4'], [1150, '1,7']]) { duong([[tx, 636], [tx + 1, 686]], TR, 3.4, 12); giua(so, tx + 4, 742, 40, TR); nghi(2400) }
nghi(5200)
cung(200, 550, 646, 34, XA); giua('không phân cực', 376, 590, 34, XA, 2.9, 330)
nghi(6800)
cung(572, 1138, 646, 38, VA); giua('phân cực', 856, 586, 42, VA, 3.1)
nghi(7400)
cung(1162, 1392, 646, 34, HO); giua('ion', 1278, 588, 46, HO, 3.2)
nghi(9000)
duong([[196, 770], [200, 792], [1140, 794], [1146, 770]], TR, 3)
giua('liên kết cộng hoá trị', 670, 852, 40, TR)

// ════════ BẢNG 2 ════════
luc(17, 40); bang.push(Math.round(gio))
// Trang 4 · VD1
luc(18, 5)
x = viet('VD1: CH_4', 70, 118, 58, VA, 3.4)
duong([[66, 142], [x + 6, 139]], VA, 3.2)
nghi(6400)
viet('χ(C) = 2,55 ;  χ(H) = 2,20', 96, 210, 44, TR, 3.1, 700)
nghi(9800)
x = viet('⇒ Δχ = 0,35', 96, 298, 48, TR)
nghi(3200)
viet('(0 ≤ Δχ < 0,4)', x + 44, 298, 36, TR, 2.8)
nghi(8600)
viet('⇒ C – H : cộng hoá trị không phân cực', 96, 388, 43, XA, 3.2, 900)

// Trang 5 · VD2
luc(24, 50)
x = viet('VD2: CO_2', 70, 538, 58, VA, 3.4)
duong([[66, 562], [x + 6, 559]], VA, 3.2)
nghi(5800)
viet('χ(O) = 3,44 ;  χ(C) = 2,55', 96, 630, 44, TR, 3.1, 700)
nghi(9200)
x = viet('⇒ Δχ = 0,89', 96, 718, 48, TR)
nghi(3000)
viet('(0,4 ≤ Δχ < 1,7)', x + 44, 718, 36, TR, 2.8)
nghi(7600)
viet('⇒ C = O : cộng hoá trị phân cực', 96, 808, 43, XA, 3.2, 900)

// Trang 6 · phân tử CO2 thẳng
luc(31, 25)
giua('O = C = O', 1334, 236, 72, TR, 3.6, 400)
nghi(4200)
duong([[1126, 276], [1546, 272]], VA, 3)
giua('phân tử thẳng', 1334, 344, 40, VA, 3, 380)
nghi(9400)
giua('⇒ phân tử CO_2', 1334, 500, 44, XA, 3.2, 390)
nghi(1600)
giua('không phân cực', 1334, 582, 46, XA, 3.2, 390)
nghi(5600)
khung(1104, 430, 1566, 622)

// tự soát: không nét nào ra ngoài bảng, không nét nào của vùng trái chạm vạch chia 2/3
let xLon = 0
for (const n of net) for (let i = 0; i < n.p.length; i += 3) { const px = n.p[i] / 4, py = n.p[i + 1] / 4; if (px < 8 || px > 1592 || py < 8 || py > 892) throw new Error(`nét ra ngoài bảng tại ${px}, ${py}`); if (px > xLon) xLon = px }

const RA = {
  ghiChu: 'Nét MẪU cho bản vẽ, dựng bằng dung-net-mau.mjs. Toạ độ = px × 4 trên bảng 1600 × 900; p = [x, y, ms kể từ đầu nét, …]; t = ms trên trục tiếng.',
  rong: 1600, cao: 900, msLive: 39 * 60000, doan: [50000, 38 * 60000 + 50000], mau: MAU, bang, net,
}
const chuoi = 'window.NET_MAU = ' + JSON.stringify(RA) + '\n'
writeFileSync(join(DAY, 'net-mau.js'), chuoi)
console.log(`${net.length} nét · ${net.reduce((s, n) => s + n.p.length / 3, 0)} điểm · ${Math.round(chuoi.length / 1024)} KB · nét cuối lúc ${Math.round(gio / 1000)} giây · x lớn nhất ${Math.round(xLon)}`)
