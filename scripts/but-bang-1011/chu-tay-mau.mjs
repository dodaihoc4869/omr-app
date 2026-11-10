// CHỮ VIẾT TAY MẪU cho bút viết bảng (10/11): sinh DỮ LIỆU ĐIỂM như một cây bút Wacom 200 Hz thật — toạ độ px, lực 0..1, mili-giây —
// để phát lại vào bộ máy bút (ảnh bản vẽ + đo khung). Không phải phông chữ: mỗi chữ là vài nét (điểm mốc trong ô 1 em), nối bằng đường cong
// Catmull-Rom, rồi «cầm bút» đi theo: chậm ở chỗ cong gắt, nhanh ở chỗ thẳng, lực mạnh ở nét xuống, nhấc bút nhẹ dần; thêm run tay + nhiễu cảm biến.
//   import { vietDong, vongBenzen, thanhNet } from './chu-tay-mau.mjs'

/** Bộ sinh số giả ngẫu nhiên có hạt (ảnh chụp lại lần nào cũng như nhau). */
export function taoNgauNhien(hat = 1011) { let s = hat >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }

// Ô chữ: x sang phải, y xuống; y = 0 đỉnh chữ hoa, y = 1 đường chân chữ. Điểm lặp hai lần = góc nhọn. [bề ngang, ...nét]
const O = [[0.4, 0.03], [0.17, 0.14], [0.06, 0.5], [0.17, 0.87], [0.4, 0.98], [0.63, 0.86], [0.73, 0.5], [0.62, 0.14], [0.4, 0.03], [0.3, 0.07]]
const A_THUONG = [[0.5, 0.54], [0.32, 0.45], [0.13, 0.56], [0.08, 0.8], [0.22, 0.97], [0.42, 0.88], [0.52, 0.62], [0.53, 0.47], [0.53, 0.47], [0.54, 0.84], [0.66, 0.97]]
const nho = (ds, kx, ky, dy) => ds.map(([x, y]) => [x * kx, y * ky + dy])
export const CHU = {
  C: [0.74, [[0.63, 0.2], [0.46, 0.03], [0.2, 0.1], [0.07, 0.45], [0.2, 0.88], [0.45, 0.98], [0.65, 0.82]]],
  G: [0.8, [[0.64, 0.2], [0.45, 0.03], [0.2, 0.1], [0.07, 0.45], [0.2, 0.88], [0.45, 0.98], [0.66, 0.84], [0.66, 0.56], [0.66, 0.56], [0.42, 0.56]]],
  H: [0.78, [[0.1, 0.02], [0.11, 0.98]], [[0.62, 0.02], [0.63, 0.98]], [[0.1, 0.5], [0.63, 0.49]]],
  O: [0.82, O],
  N: [0.78, [[0.1, 0.98], [0.1, 0.02], [0.1, 0.02], [0.62, 0.98], [0.62, 0.98], [0.63, 0.02]]],
  a: [0.72, A_THUONG],
  'ả': [0.72, A_THUONG, [[0.24, 0.3], [0.33, 0.2], [0.43, 0.25], [0.36, 0.34], [0.34, 0.39]]],
  i: [0.38, [[0.12, 0.5], [0.12, 0.88], [0.2, 0.98], [0.3, 0.9]], [[0.13, 0.3]]],
  n: [0.64, [[0.1, 0.48], [0.1, 0.98], [0.1, 0.98], [0.1, 0.66], [0.3, 0.47], [0.48, 0.58], [0.5, 0.98]]],
  m: [0.84, [[0.08, 0.48], [0.08, 0.98], [0.08, 0.98], [0.08, 0.64], [0.24, 0.47], [0.37, 0.6], [0.37, 0.98], [0.37, 0.98], [0.37, 0.64], [0.53, 0.47], [0.66, 0.6], [0.67, 0.98]]],
  o: [0.58, nho(O, 0.68, 0.53, 0.46)],
  l: [0.38, [[0.12, 0], [0.12, 0.84], [0.2, 0.98], [0.3, 0.9]]],
  0: [0.64, nho(O, 0.72, 1, 0)],
  1: [0.5, [[0.08, 0.25], [0.3, 0.02], [0.3, 0.02], [0.31, 0.98]]],
  2: [0.68, [[0.1, 0.2], [0.28, 0.03], [0.5, 0.12], [0.5, 0.35], [0.1, 0.97], [0.1, 0.97], [0.6, 0.96]]],
  3: [0.66, [[0.1, 0.14], [0.3, 0.02], [0.5, 0.12], [0.5, 0.35], [0.26, 0.48], [0.26, 0.48], [0.5, 0.6], [0.54, 0.82], [0.32, 0.98], [0.08, 0.86]]],
  5: [0.66, [[0.52, 0.03], [0.14, 0.04], [0.14, 0.04], [0.1, 0.45], [0.1, 0.45], [0.34, 0.4], [0.54, 0.56], [0.52, 0.84], [0.3, 0.98], [0.08, 0.86]]],
  6: [0.66, [[0.5, 0.06], [0.24, 0.2], [0.09, 0.6], [0.2, 0.92], [0.4, 0.97], [0.55, 0.78], [0.42, 0.56], [0.2, 0.6], [0.11, 0.74]]],
  '+': [0.74, [[0.08, 0.55], [0.6, 0.54]], [[0.34, 0.28], [0.35, 0.82]]],
  '=': [0.72, [[0.08, 0.45], [0.58, 0.44]], [[0.08, 0.68], [0.58, 0.67]]],
  '>': [1.15, [[0.05, 0.56], [0.98, 0.54]], [[0.74, 0.38], [0.99, 0.54], [0.99, 0.54], [0.74, 0.72]]],
  ',': [0.3, [[0.12, 0.92], [0.14, 1.02], [0.06, 1.15]]],
  ':': [0.34, [[0.13, 0.56]], [[0.13, 0.93]]],
  ' ': [0.42],
}

/** Đường cong Catmull-Rom (đều) qua các điểm mốc, lấy mẫu dày (bước ~0,3 px). */
function cong(ds) {
  if (ds.length === 1) return [ds[0].slice()]
  const ra = []
  for (let i = 0; i < ds.length - 1; i++) {
    const p0 = ds[Math.max(0, i - 1)], p1 = ds[i], p2 = ds[i + 1], p3 = ds[Math.min(ds.length - 1, i + 2)]
    const dai = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(1, Math.ceil(dai / 0.3))
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t
      ra.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)))
    }
  }
  ra.push(ds[ds.length - 1].slice())
  return ra
}

/** Một nét hình học (điểm mốc px) ⇒ mẫu bút [x, y, lực, ms] ở `hz` mẫu mỗi giây. `vMax` px/giây ở chỗ thẳng. */
export function camBut(moc, { rnd, vMax = 560, hz = 200, run = 0.22, nhieu = 0.1, luc = 0.42 } = {}) {
  const d = cong(moc)
  if (d.length === 1) return [0, 1, 2, 3, 4, 5].map((i) => [d[0][0] + (rnd() - 0.5) * 0.3, d[0][1] + (rnd() - 0.5) * 0.3, [0.2, 0.5, 0.62, 0.6, 0.4, 0.15][i], i * 1000 / hz])
  // độ cong tại từng điểm (góc đổi trên một cửa sổ ~3 px) ⇒ vận tốc đích; rồi giới hạn gia tốc xuôi + ngược
  const n = d.length, s = [0]
  for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]))
  const W = 10, v = d.map((_, i) => {
    const a = d[Math.max(0, i - W)], b = d[i], c = d[Math.min(n - 1, i + W)]
    const g1 = Math.atan2(b[1] - a[1], b[0] - a[0]), g2 = Math.atan2(c[1] - b[1], c[0] - b[0])
    let dg = Math.abs(g2 - g1); if (dg > Math.PI) dg = 2 * Math.PI - dg
    const kappa = i < W || i > n - 1 - W ? 0 : dg / Math.max(1, s[Math.min(n - 1, i + W)] - s[Math.max(0, i - W)])
    return vMax / (1 + 26 * kappa)
  })
  const GT = vMax * 14
  v[0] = vMax * 0.12; v[n - 1] = vMax * 0.14
  for (let i = 1; i < n; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + 2 * GT * (s[i] - s[i - 1])))
  for (let i = n - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + 2 * GT * (s[i + 1] - s[i])))
  const t = [0]
  for (let i = 1; i < n; i++) t.push(t[i - 1] + (s[i] - s[i - 1]) / ((v[i] + v[i - 1]) / 2) * 1000)
  const tong = t[n - 1], buoc = 1000 / hz, ra = [], pha1 = rnd() * 6.28, pha2 = rnd() * 6.28
  let j = 0, ap = 0.08
  for (let tm = 0; tm <= tong + buoc * 0.999; tm += buoc) {
    const tt = Math.min(tm, tong)
    while (j < n - 2 && t[j + 1] < tt) j++
    const f = (tt - t[j]) / Math.max(1e-6, t[j + 1] - t[j]), x = d[j][0] + (d[j + 1][0] - d[j][0]) * f, y = d[j][1] + (d[j + 1][1] - d[j][1]) * f
    const xuong = (d[j + 1][1] - d[j][1]) / Math.max(1e-6, Math.hypot(d[j + 1][0] - d[j][0], d[j + 1][1] - d[j][1]))
    let dich = luc + 0.2 * xuong - 0.16 * (v[j] / vMax) + (rnd() - 0.5) * 0.03
    dich *= Math.min(1, 0.2 + tm / 30) * Math.min(1, 0.12 + (tong - tt) / 34)
    ap += (dich - ap) * 0.45
    const rx = run * (Math.sin(tm / 1000 * 6.28 * 8.5 + pha1) + 0.5 * Math.sin(tm / 1000 * 6.28 * 13 + pha2))
    ra.push([x + rx * 0.7 + (rnd() - 0.5) * 2 * nhieu, y + rx + (rnd() - 0.5) * 2 * nhieu, Math.max(0.02, Math.min(1, ap)), tm])
  }
  return ra
}

/** Viết một dòng. `_x` = chỉ số dưới (H_2O). Trả về mảng nét, mỗi nét là mảng mẫu [x, y, lực, ms]. */
export function vietDong(chuoi, x, y, co, tuy = {}) {
  const rnd = tuy.rnd, net = []
  let bx = x
  for (let i = 0; i < chuoi.length; i++) {
    let c = chuoi[i], kc = 1, dy = 0
    if (c === '_') { c = chuoi[++i]; kc = 0.58; dy = 0.52 }
    const g = CHU[c]
    if (!g) throw new Error('chưa có chữ mẫu: ' + c)
    const k = co * kc * (1 + (rnd() - 0.5) * 0.06), ly = y + dy * co + (rnd() - 0.5) * 0.04 * co
    for (const moc of g.slice(1)) {
      const px = moc.map(([gx, gy]) => [bx + (gx + (1 - gy) * 0.13 + (rnd() - 0.5) * 0.03) * k, ly + (gy + (rnd() - 0.5) * 0.03) * k])
      net.push(camBut(px, { ...tuy, rnd, vMax: (tuy.vMax ?? 560) * Math.max(0.6, co / 44) }))
    }
    bx += g[0] * k * 1.04
  }
  return net
}

/** Vòng benzen: lục giác một nét (6 góc nhọn) + vòng tròn bên trong + (tuỳ) nối nhóm thế bên phải. */
export function vongBenzen(cx, cy, r, tuy = {}) {
  const rnd = tuy.rnd, dinh = [], lech = () => (rnd() - 0.5) * r * 0.05
  for (let k = 0; k <= 6; k++) { const g = -Math.PI / 2 + k * Math.PI / 3, p = [cx + r * Math.cos(g) + lech(), cy + r * Math.sin(g) + lech()]; dinh.push(p); if (k > 0 && k < 6) dinh.push(p.slice()) }
  dinh[dinh.length - 1] = [dinh[0][0] + r * 0.03, dinh[0][1] + r * 0.02]
  const tron = []
  for (let k = 0; k <= 13; k++) { const g = -Math.PI / 2 + k * 2 * Math.PI / 12; tron.push([cx + r * 0.6 * Math.cos(g) + lech(), cy + r * 0.6 * Math.sin(g) + lech()]) }
  const net = [camBut(dinh, { ...tuy, rnd, vMax: 620 }), camBut(tron, { ...tuy, rnd, vMax: 520 })]
  const phai = [cx + r * Math.cos(-Math.PI / 6), cy + r * Math.sin(-Math.PI / 6)]
  net.push(camBut([[phai[0] + 2, phai[1] - 1], [phai[0] + r * 0.62, phai[1] - r * 0.36]], { ...tuy, rnd, vMax: 500 }))
  return { net, noi: [phai[0] + r * 0.72, phai[1] - r * 0.36] }
}

/** Mẫu px ⇒ nét vectơ chuẩn hoá của bộ máy bút (cùng cách làm tròn với `LoiBut.diem`). */
export function thanhNet(mau, W, H, { mau: mauNet = 'rgb(244,239,228)', co = 2.3, id } = {}) {
  const tron = (v, k) => Math.round(v * k) / k, kep = (v) => Math.max(0, Math.min(1, v))
  return { id, cong: 'but', mau: mauNet, co, diem: mau.map(([x, y, ap, t]) => [tron(kep(x / W), 1e5), tron(kep(y / H), 1e5), tron(kep(ap), 100), Math.round(t)]) }
}
