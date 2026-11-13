// BẢN VẼ «Nhật ký bài dạy»: dựng NÉT PHẤN MẪU (giả nét viết tay của Thầy, có giờ trên trục tiếng) cho hai kịch bản.
// Chạy:  PHONG_MOT_NET=<đường tới EMSReadabilityItalic.svg> node docs/ban-ve-nhat-ky-bai-day-1311/dung-net-mau.mjs
// Ra: net-mau.js (window.NET_MAU = { 'lien-ket': …, fes2: … }), cùng dạng thông tin với nét thật (src/lib/but-bang-loi.ts):
//   màu, cỡ, giờ bắt đầu trên trục tiếng (ms), từng điểm [x, y, ms kể từ đầu nét]; bảng 1600 × 900, vạch chia 2/3 ở x = 1067.
// Phông một nét «EMS Readability Italic» (SIL OFL, gói npm `hersheytext`) chỉ để có đường nét sạch. Bản thật KHÔNG dùng phông:
// trang bài học vẽ đúng nét trong `net.bin` của buổi. Chữ trên bảng mẫu chép đúng bảng Thầy viết 12/11 (theo ảnh Thầy gửi);
// riêng hai bạn Thầy ví thì bản vẽ không viết tên (bảng thật có tên, hiện y như màn Xem lại).
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
G['⇒'] = { a: 820, net: [[[110, 400], [640, 404]], [[85, 236], [615, 240]], [[545, 520], [650, 420], [745, 322], [630, 225], [505, 120]]] }
G['→'] = { a: 760, net: [[[100, 320], [660, 322]], [[520, 440], [670, 322], [520, 205]]] }
G['↳'] = { a: 700, net: [[[140, 640], [138, 380], [150, 250], [210, 220], [600, 222]], [[470, 330], [610, 222], [470, 115]]] }
G['đ'] = { a: G.d.a, net: G.d.net.concat([[[G.d.a * 0.42, 620], [G.d.a * 1.02, 624]]]) }

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

const MAU = [['rgb(244,239,228)', 'Phấn trắng'], ['rgb(255,210,122)', 'Phấn vàng'], ['rgb(110,231,183)', 'Phấn xanh ngọc'], ['rgb(253,164,175)', 'Phấn hồng']]
const TR = 0, VA = 1, XA = 2, HO = 3
let net = [], gio = 0
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
/** Đặt giờ (giây trên trục tiếng). Không lùi giờ. */
const MOC_GIO = []
const luc = (giay) => { if (MOC_GIO.length) MOC_GIO[MOC_GIO.length - 1].den = Math.round(gio / 100) / 10; gio = Math.max(gio, giay * 1000); MOC_GIO.push({ dat: giay, that: Math.round(gio / 100) / 10 }) }

function rong(chu, co) {
  const k = co / 650
  let w = 0, nho = false
  for (const c of chu.normalize('NFD')) {
    if (c === ' ') w += 250 * k
    else if (c === '_' || c === '^') nho = true
    else if (!laDau(c)) { if (!G[c]) throw new Error(`thiếu chữ «${c}» trong «${chu}»`); w += G[c].a * k * 0.96 * (nho ? 0.62 : 1); nho = false }
  }
  return w
}
/** Viết một dòng chữ; `_x` chỉ số dưới, `^x` số mũ. Tự thu cỡ nếu rộng quá `toiDa`. Trả x cuối dòng. */
function viet(chu, x, y, co, mau, netCo = 3.1, toiDa = 0) {
  if (toiDa) co = Math.min(co, (co * toiDa) / rong(chu, co))
  const k = co / 650
  let nho = 0
  const ky = [...chu.normalize('NFD')]
  for (let i = 0; i < ky.length; i++) {
    const c = ky[i]
    if (c === ' ') { x += 250 * k; gio += 160; continue }
    if (c === '_') { nho = 1; continue }
    if (c === '^') { nho = -1; continue }
    if (laDau(c)) continue
    const g = G[c]
    const kk = k * (nho ? 0.62 : 1) * (1 + lac(0.03)), dy = (nho === 1 ? 0.2 * co : nho === -1 ? -0.5 * co : 0) + lac(co * 0.02), xoay = lac(0.018)
    const dat = ([px, py]) => { const X = px * kk, Y = -py * kk; return [x + X * Math.cos(xoay) - Y * Math.sin(xoay) + lac(0.4), y + dy + X * Math.sin(xoay) + Y * Math.cos(xoay) + lac(0.4)] }
    for (const s of g.net) them(s.map(dat), mau, netCo * (nho ? 0.9 : 1))
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
    nho = 0
    gio += 40
  }
  return x
}
function duong(ds, mau, co = 3.2, buoc = 26) {
  const p = []
  for (let i = 0; i < ds.length - 1; i++) { const [x0, y0] = ds[i], [x1, y1] = ds[i + 1], n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / buoc)); for (let j = i ? 1 : 0; j <= n; j++) p.push([x0 + ((x1 - x0) * j) / n + lac(1.1), y0 + ((y1 - y0) * j) / n + lac(1.1)]) }
  them(p, mau, co)
}
function khung(x0, y0, x1, y1, mau = HO) {
  const g = 14
  duong([[x0 + g, y0 + lac(3)], [x1 - g, y0 + lac(4)], [x1, y0 + g], [x1 + lac(4), y1 - g], [x1 - g, y1], [x0 + g, y1 + lac(4)], [x0, y1 - g], [x0 + lac(3), y0 + g], [x0 + g + 4, y0 - 3], [x0 + 60, y0 + 2]], mau, 3.6, 30)
}
/** Chấm phấn (electron trên bảng). */
const cham = (x, y, mau) => them([[x - 3, y - 2], [x + 3, y + 2], [x - 2, y + 3], [x + 2, y - 3]], mau, 4.2)
/** Bốn chấm «⁘» của Thầy: hai cặp electron dùng chung. Trả x sau cụm chấm. */
function bonCham(x, yGiua, mau) { for (const [dx, dy] of [[0, -12], [18, -12], [0, 12], [18, 12]]) cham(x + dx, yGiua + dy, mau); return x + 40 }
/** Gạch chân. */
const gach = (x0, x1, y, mau) => duong([[x0, y], [x1, y - 2]], mau, 3)

function xuat(ten, msLive) {
  let xLon = 0
  for (const n of net) for (let i = 0; i < n.p.length; i += 3) { const px = n.p[i] / 4, py = n.p[i + 1] / 4; if (px < 8 || px > 1592 || py < 8 || py > 892) throw new Error(`${ten}: nét ra ngoài bảng tại ${px}, ${py}`); if (px > xLon) xLon = px }
  const ra = { rong: 1600, cao: 900, msLive, mau: MAU, net }
  if (MOC_GIO.length) MOC_GIO[MOC_GIO.length - 1].den = Math.round(gio / 100) / 10
  console.log(`${ten}: ${net.length} nét · nét cuối lúc ${Math.round(gio / 1000)} giây · mốc (đặt ⇒ bắt đầu thật – xong): ${MOC_GIO.map((m) => `${m.dat}⇒${m.that}–${m.den}`).join(' ')}`)
  MOC_GIO.length = 0
  return ra
}

const RA = {}
// ════════ BÀI 12/11 · Liên kết cộng hoá trị (đúng chữ trên bảng Thầy) ════════
net = []; gio = 0; hat = 20261112
// cột trái (2/3 bảng)
luc(190); duong([[120, 112], [560, 114]], TR, 3.4); viet('x', 326, 126, 46, VA, 3.6)
luc(197); viet('(Δ1) = (Δ2)', 610, 130, 50, TR)
luc(204); let x = viet('LK CHT ko phân cực', 190, 240, 50, XA, 3.3); khung(162, 182, x + 28, 268)
luc(455); viet('↳ Cách nhận định tính → 2 ntố', 90, 352, 46, TR, 3.1, 900)
luc(462); viet('giống nhau 100 % ⇒ LK CHT kpc', 150, 428, 46, TR, 3.1, 860)
luc(612); x = viet('O_2 ⇒ O', 90, 545, 54, VA, 3.4); x = bonCham(x + 18, 528, VA); viet('O ⇒ LK CHT kpc', x + 10, 545, 54, VA, 3.4, 600)
luc(742); viet('H_2 →', 90, 650, 54, VA, 3.4)
// cột phải (1/3 bảng)
luc(1018); x = viet('LK CHT PC', 1190, 122, 52, TR, 3.3); khung(1160, 62, x + 30, 152)
luc(1105); viet('QT_3 → Δχ > 1,7', 1105, 238, 48, TR, 3.1, 470)
luc(1111); viet('→ lực kéo chênh', 1135, 304, 44, TR, 3.1, 440)
luc(1115); viet('lệch hơn ⇒ LK Ion', 1135, 370, 44, TR, 3.1, 440)
luc(1390); x = viet('VD1: CH_4', 1105, 472, 50, VA, 3.4); gach(1100, x + 6, 490, VA)
luc(1393); viet('C : 2,55 ; H : 2,2', 1105, 540, 44, TR, 3.1, 470)
luc(1398); viet('⇒ Δχ = 0,35 → LK CHT KPC', 1105, 606, 44, XA, 3.2, 475)
luc(1880); x = viet('VD2: CO_2', 1105, 716, 50, VA, 3.4); gach(1100, x + 6, 734, VA)
luc(1886); x = viet('O', 1130, 800, 52, TR, 3.3); x = bonCham(x + 16, 783, VA); x = viet('C', x + 8, 800, 52, TR, 3.3); x = bonCham(x + 16, 783, VA); viet('O →', x + 8, 800, 52, TR, 3.3)
RA['lien-ket'] = xuat('lien-ket', 39 * 60000)

// ════════ BÀI MẪU FeS₂ (tính hiệu suất, sơ đồ cột dọc) ════════
net = []; gio = 0; hat = 20261110
luc(95); viet('FeS_2', 150, 150, 64, VA, 3.5); duong([[420, 128], [700, 130]], TR, 3.4); duong([[668, 108], [702, 130], [666, 152]], TR, 3.4); viet('2SO_2', 760, 150, 64, VA, 3.5)
luc(102); viet('H = 90 %', 455, 96, 40, HO, 3.1)
luc(240); viet('1 tấn = 10^6 g', 110, 240, 40, XA, 3, 300)
luc(246); viet('8 %', 175, 300, 40, XA)
luc(252); viet('M = 120', 140, 360, 40, XA)
luc(258); viet('M = 64', 770, 240, 40, XA)
luc(262); viet('m = ? kg', 760, 300, 40, XA)
luc(268); viet('m = 10^6 · 8/100 · 1/120 · 2 · 64 · 90/100 · 1/1000', 80, 520, 52, TR, 3.2, 980)
luc(286); viet('= 76,8 kg', 640, 610, 56, VA, 3.4)
luc(300); x = viet('Xuôi × H/100', 1120, 160, 46, XA, 3.2, 440); luc(304); viet('Ngược × 100/H', 1120, 240, 46, HO, 3.2, 440); khung(1095, 95, 1560, 275, TR)
RA.fes2 = xuat('fes2', 31 * 60000)

const chuoi = '// TỰ SINH bởi dung-net-mau.mjs. Nét phấn MẪU của bản vẽ (không phải nét thật). Toạ độ = px × 4 trên bảng 1600 × 900; p = [x, y, ms kể từ đầu nét, …]; t = ms trên trục tiếng.\nwindow.NET_MAU = ' + JSON.stringify(RA) + '\n'
writeFileSync(join(DAY, 'net-mau.js'), chuoi)
console.log(`net-mau.js ${Math.round(chuoi.length / 1024)} KB`)
