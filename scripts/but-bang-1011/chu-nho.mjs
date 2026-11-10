// CHỮ NHỎ VIẾT NHANH (11/11, thầy viết thử bằng Wacom: «Viết bị nhằng nhằng chưa mượt như goodnote») — QUỸ ĐẠO THẬT + mẫu thiết bị, để đo độ trung thực của bút.
// Khác `chu-tay-mau.mjs` (chữ to 42 px, 200 Hz, chỉ để chụp ảnh): ở đây giữ riêng QUỸ ĐẠO THẬT của đầu bút (đường liên tục, bước 0,1 px, có giờ) rồi mới lấy mẫu
// theo từng loại thiết bị ⇒ so được nét vẽ ra với đường tay thật đã đi.
//   chữ cao 12–20 px · bướu «m n u» · nét ngắn, nhấc bút 40–80 ms · tốc độ theo luật 2/3 (chỗ cong gắt đi chậm, chỗ thẳng đi nhanh)
//   thiết bị:  'but'    bút có lực (toạ độ lẻ, lực dốc lên ở đầu nét, về gần 0 lúc nhấc; pointerdown / pointerup đủ)
//              'chuot'  chuột không lực (toạ độ nguyên px, pressure 0,5)
//              'luot'   bút có lực nhưng KHÔNG có pointerup giữa các nét: chỉ có các mẫu lướt `pressure 0 · buttons 0` chen giữa (kiểu trình điều khiển Wacom)
//              'don'    bút có lực, giờ của các mẫu trong cùng một khung hình bị DỒN về một mốc (trình điều khiển đưa giờ thô)
import { CHU, taoNgauNhien } from './chu-tay-mau.mjs'

const E = [[0.12, 0.74], [0.46, 0.7], [0.48, 0.56], [0.32, 0.46], [0.14, 0.58], [0.1, 0.8], [0.26, 0.97], [0.5, 0.88]]
/** Chữ mẫu thêm cho ba dòng thầy viết. Ô chữ như `CHU`: y = 0 đỉnh chữ hoa, y = 1 chân chữ; điểm lặp hai lần = góc nhọn. */
export const CHU_NHO = {
  ...CHU,
  A: [0.8, [[0.06, 0.98], [0.36, 0.02], [0.36, 0.02], [0.68, 0.98]], [[0.2, 0.62], [0.56, 0.6]]],
  h: [0.62, [[0.1, 0], [0.1, 0.98], [0.1, 0.98], [0.1, 0.66], [0.3, 0.47], [0.48, 0.58], [0.5, 0.98]]],
  y: [0.6, [[0.08, 0.48], [0.14, 0.86], [0.3, 0.92], [0.46, 0.5]], [[0.47, 0.48], [0.44, 1.1], [0.3, 1.36], [0.1, 1.28]]],
  u: [0.66, [[0.1, 0.48], [0.1, 0.82], [0.26, 0.98], [0.46, 0.8], [0.48, 0.48], [0.48, 0.48], [0.5, 0.9], [0.6, 0.98]]],
  e: [0.6, E],
  'ê': [0.6, E, [[0.16, 0.36], [0.3, 0.24], [0.3, 0.24], [0.44, 0.36]]],
  K: [0.74, [[0.1, 0.02], [0.11, 0.98]], [[0.58, 0.04], [0.12, 0.56], [0.12, 0.56], [0.62, 0.98]]],
  M: [0.96, [[0.08, 0.98], [0.1, 0.02], [0.1, 0.02], [0.42, 0.8], [0.42, 0.8], [0.74, 0.02], [0.74, 0.02], [0.78, 0.98]]],
  S: [0.66, [[0.54, 0.14], [0.36, 0.02], [0.14, 0.12], [0.14, 0.36], [0.34, 0.5], [0.52, 0.66], [0.5, 0.88], [0.3, 0.98], [0.08, 0.86]]],
  4: [0.68, [[0.42, 0.02], [0.06, 0.66], [0.06, 0.66], [0.6, 0.66]], [[0.44, 0.3], [0.45, 0.98]]],
  '.': [0.3, [[0.12, 0.95]]],
}

/** Đường cong Catmull-Rom (đều) qua các điểm mốc, lấy mẫu dày bước ~0,1 px. */
function cong(ds) {
  if (ds.length === 1) return [ds[0].slice()]
  const ra = []
  for (let i = 0; i < ds.length - 1; i++) {
    const p0 = ds[Math.max(0, i - 1)], p1 = ds[i], p2 = ds[i + 1], p3 = ds[Math.min(ds.length - 1, i + 2)]
    const dai = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), n = Math.max(1, Math.ceil(dai / 0.1))
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t
      ra.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (p2[c] - p0[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * t3)))
    }
  }
  ra.push(ds[ds.length - 1].slice())
  return ra
}

/**
 * Một nét hình học (điểm mốc px) ⇒ QUỸ ĐẠO THẬT { d: [x, y][] bước ~0,1 px, t: ms[] } — tay đi theo luật 2/3: v = min(vMax, K · độ cong^(−1/3)), có giới hạn gia tốc.
 * Chấm một cái (một điểm mốc): đứng yên 45 ms.
 */
export function quyDao(moc, { vMax = 420, K = 105 } = {}) {
  const d = cong(moc), n = d.length
  if (n === 1) return { d: [d[0], d[0]], t: [0, 45], cham: true }
  const s = [0]
  for (let i = 1; i < n; i++) s.push(s[i - 1] + Math.hypot(d[i][0] - d[i - 1][0], d[i][1] - d[i - 1][1]))
  const W = 12
  const v = d.map((_, i) => {
    const a = d[Math.max(0, i - W)], b = d[i], c = d[Math.min(n - 1, i + W)]
    const g1 = Math.atan2(b[1] - a[1], b[0] - a[0]), g2 = Math.atan2(c[1] - b[1], c[0] - b[0])
    let dg = Math.abs(g2 - g1); if (dg > Math.PI) dg = 2 * Math.PI - dg
    const kappa = i < W || i > n - 1 - W ? 0 : dg / Math.max(0.5, (s[Math.min(n - 1, i + W)] - s[Math.max(0, i - W)]) / 2)
    return Math.max(28, Math.min(vMax, kappa > 1e-4 ? K * Math.pow(kappa, -1 / 3) : vMax))
  })
  const GT = vMax * 22
  v[0] = vMax * 0.14; v[n - 1] = vMax * 0.2
  for (let i = 1; i < n; i++) v[i] = Math.min(v[i], Math.sqrt(v[i - 1] ** 2 + 2 * GT * (s[i] - s[i - 1])))
  for (let i = n - 2; i >= 0; i--) v[i] = Math.min(v[i], Math.sqrt(v[i + 1] ** 2 + 2 * GT * (s[i + 1] - s[i])))
  const t = [0]
  for (let i = 1; i < n; i++) t.push(t[i - 1] + (s[i] - s[i - 1]) / ((v[i] + v[i - 1]) / 2) * 1000)
  return { d, t }
}

/** Viết một dòng chữ nhỏ ⇒ mảng quỹ đạo thật (mỗi nét một quỹ đạo). `_x` = chỉ số dưới. */
export function vietDongThat(chuoi, x, y, co, { rnd, vMax = 420, K = 105 } = {}) {
  const net = []
  let bx = x
  for (let i = 0; i < chuoi.length; i++) {
    let c = chuoi[i], kc = 1, dy = 0
    if (c === '_') { c = chuoi[++i]; kc = 0.62; dy = 0.5 }
    const g = CHU_NHO[c]
    if (!g) throw new Error('chưa có chữ mẫu: ' + c)
    const k = co * kc * (1 + (rnd() - 0.5) * 0.06), ly = y + dy * co + (rnd() - 0.5) * 0.04 * co
    for (const moc of g.slice(1)) net.push(quyDao(moc.map(([gx, gy]) => [bx + (gx + (1 - gy) * 0.13 + (rnd() - 0.5) * 0.03) * k, ly + (gy + (rnd() - 0.5) * 0.03) * k]), { vMax, K }))
    bx += g[0] * k * 1.04
  }
  return net
}

/** Bài đo: đúng ba dòng thầy viết trong video, chữ cao 18 / 15 / 16 px (và chỉ số dưới ~10 px), trên phần bảng đen của tờ 1920 × 1080. `nhanh` = hệ số tốc độ tay (1 = viết nhanh vừa; 2 = rất nhanh, cỡ «Mn» trong 0,33 giây như video). */
export function baiChuNho({ hat = 1111, x0 = 1330, y0 = 300, nhanh = 1 } = {}) {
  const rnd = taoNgauNhien(hat), tuy = { rnd, vMax: 420 * nhanh, K: 105 * nhanh }
  return [
    ...vietDongThat('Anh yêu em', x0, y0, 18, tuy),
    ...vietDongThat('mm mm', x0, y0 + 50, 15, tuy),
    ...vietDongThat('KMnO_4 + H_2SO_4.', x0, y0 + 100, 16, tuy),
  ]
}

const noiSuy = (q, tm) => {
  // vị trí thật tại giờ tm (ms) trên một quỹ đạo
  const { d, t } = q
  if (tm <= 0) return d[0]
  if (tm >= t[t.length - 1]) return d[d.length - 1]
  let a = 0, b = t.length - 1
  while (b - a > 1) { const m = (a + b) >> 1; if (t[m] <= tm) a = m; else b = m }
  const f = (tm - t[a]) / Math.max(1e-9, t[b] - t[a])
  return [d[a][0] + (d[b][0] - d[a][0]) * f, d[a][1] + (d[b][1] - d[a][1]) * f]
}

/**
 * Quỹ đạo thật ⇒ CHUỖI SỰ KIỆN của một thiết bị ở `hz` mẫu mỗi giây.
 * Trả về [{ k: 'd' | 'm' | 'u', x, y, p (pressure), b (buttons), t (ms), loai ('pen' | 'mouse'), net (chỉ số nét thật; −1 = đang lướt trên không) }], xếp theo giờ.
 * Đồng hồ lấy mẫu chạy đều suốt bài (không bắt đầu lại ở mỗi nét) như bảng vẽ thật ⇒ điểm chạm / điểm nhấc rơi giữa hai nhịp mẫu.
 */
export function layMau(net, hz, thietBi, { rnd = taoNgauNhien(7), nghi = [40, 80] } = {}) {
  const buoc = 1000 / hz, sk = [], but = thietBi !== 'chuot', loai = but ? 'pen' : 'mouse'
  const nhieu = but ? 0.04 : 0
  const vt = (p) => (but ? [p[0] + (rnd() - 0.5) * 2 * nhieu, p[1] + (rnd() - 0.5) * 2 * nhieu] : [Math.round(p[0]), Math.round(p[1])])
  let T = 0 // giờ bắt đầu nét đang xét
  const moc = [] // [bắt đầu, kết thúc] theo giờ chung của từng nét
  for (const q of net) { const dai = q.t[q.t.length - 1]; moc.push([T, T + dai]); T += dai + nghi[0] + rnd() * (nghi[1] - nghi[0]) }
  let nhip = 0.37 * buoc // lệch pha so với lúc chạm nét đầu
  for (let i = 0; i < net.length; i++) {
    const q = net[i], [t0, t1] = moc[i], dai = t1 - t0
    // lực: dốc lên trong ~18 ms đầu, giữ 0,35–0,6 (mạnh hơn ở nét xuống), về gần 0 trong ~14 ms cuối
    const luc = (tm) => {
      if (!but) return 0.5
      const g = Math.min(1, 0.12 + (tm - t0) / 18) * Math.min(1, 0.08 + (t1 - tm) / 14)
      const a = noiSuy(q, tm - t0), b = noiSuy(q, tm - t0 + 4), xuong = Math.max(-1, Math.min(1, (b[1] - a[1]) / 1.2))
      return Math.max(0.02, Math.min(1, (0.44 + 0.14 * xuong) * g))
    }
    const dau = vt(q.d[0])
    const coDown = thietBi !== 'luot' || i === 0, coUp = thietBi !== 'luot' || i === net.length - 1
    if (coDown) sk.push({ k: 'd', x: dau[0], y: dau[1], p: but ? luc(t0) : 0.5, b: 1, t: t0, loai, net: i })
    while (nhip <= t0) nhip += buoc
    for (; nhip < t1; nhip += buoc) { const p = vt(noiSuy(q, nhip - t0)); sk.push({ k: 'm', x: p[0], y: p[1], p: luc(nhip), b: 1, t: nhip, loai, net: i }) }
    const cuoi = vt(q.d[q.d.length - 1])
    if (coUp) sk.push({ k: 'u', x: cuoi[0], y: cuoi[1], p: 0, b: 0, t: t1, loai, net: i })
    else {
      // không có pointerup: bút nhấc lên rồi LƯỚT trên không sang chỗ đặt nét kế — các mẫu pressure 0 · buttons 0 (nhô lên ~2 px như tay thật), không có pointerdown ở nét kế
      const ke = net[i + 1].d[0], t2 = moc[i + 1][0], a = q.d[q.d.length - 1]
      for (; nhip < t2; nhip += buoc) { const f = (nhip - t1) / (t2 - t1), p = vt([a[0] + (ke[0] - a[0]) * f, a[1] + (ke[1] - a[1]) * f - 2 * Math.sin(Math.PI * f)]); sk.push({ k: 'm', x: p[0], y: p[1], p: 0, b: 0, t: nhip, loai, net: -1 }) }
    }
    void dai
  }
  if (thietBi === 'don') {
    // giờ thô: mọi mẫu trong cùng một khung hình (16,7 ms) mang CÙNG một giờ (giờ của mẫu đầu khung)
    let khung = -1, gio = 0
    for (const e of sk) { const kh = Math.floor(e.t / (1000 / 60)); if (kh !== khung) { khung = kh; gio = e.t } e.tThat = e.t; e.tGhi = gio }
  }
  return sk
}

/** Điểm thật (bước ~0,1 px) của mọi nét, mảng phẳng theo từng nét: [[x0, y0, x1, y1…], …] — làm chuẩn để đo. */
export function duongThat(net) { return net.map((q) => q.d.flat()) }
