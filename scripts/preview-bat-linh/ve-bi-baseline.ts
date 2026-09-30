// Bản tham chiếu 36ee817f để so điểm ảnh và đo CPU.
// BI-A PHẢN ỨNG · VẼ BI (thầy chốt bản vẽ "Bàn Bi-a mới" 30/09). Mỗi KIỂU bi (theo góc nhìn: của em / đối thủ / chốt / bi cái) + kí hiệu
// + trạng thái viền vàng (đã giải trước) vẽ MỘT lần vào canvas đệm; mỗi khung chỉ drawImage — không dựng gradient/chữ mỗi khung (máy yếu).
// Bi của em: lam đặc. Bi đối thủ: nền trắng, dải đỏ cam giữa 60 % chiều cao (bi sọc). Bi chốt: đen, vòng trắng giữa, chữ tối.
// Kí hiệu nguyên tố: chữ trắng đậm viền tối, cỡ 1,08 R (một chữ) / 0,92 R (hai chữ). Viền vàng mảnh ngoài thân bi, thân bi giữ nguyên.
import { MAU_BI, rgbCss, type KieuBi } from '../../src/game/bi-a/nguyen-to'
import { qMul, qTruc, type Bi } from '../../src/game/bi-a/vat-ly'

const C = { ta: rgbCss(MAU_BI.ta), dich: rgbCss(MAU_BI.dich), trang: rgbCss(MAU_BI.trang), den: rgbCss(MAU_BI.den), vang: rgbCss(MAU_BI.vang) }
export const MAU_BI_VANG = C.vang
/** Tỉ lệ cạnh ảnh đệm / bán kính bi: chừa chỗ cho viền vàng (r × 1,12 + nét). */
export const KHUNG_ANH = 2.6

/** Vẽ một bi tâm (0, 0) bán kính `r` lên `g` (đơn vị điểm ảnh của `g`). */
export function veMotBi(g: CanvasRenderingContext2D, kieu: KieuBi, kiHieu: string, r: number, vang: boolean): void {
  g.save()
  g.beginPath(); g.arc(0, 0, r, 0, 7); g.clip()
  if (kieu === 'ta') { g.fillStyle = C.ta; g.fillRect(-r, -r, 2 * r, 2 * r) }
  else if (kieu === 'dich') { g.fillStyle = C.trang; g.fillRect(-r, -r, 2 * r, 2 * r); g.fillStyle = C.dich; g.fillRect(-r, -r * 0.6, 2 * r, r * 1.2) }
  else if (kieu === 'chot') { g.fillStyle = C.den; g.fillRect(-r, -r, 2 * r, 2 * r); g.fillStyle = C.trang; g.beginPath(); g.arc(0, 0, r * 0.55, 0, 7); g.fill() }
  else { g.fillStyle = C.trang; g.fillRect(-r, -r, 2 * r, 2 * r) }
  const hl = g.createRadialGradient(-r * 0.38, -r * 0.42, 1, -r * 0.2, -r * 0.2, r * 1.25)
  hl.addColorStop(0, 'rgba(255,255,255,.75)'); hl.addColorStop(0.28, 'rgba(255,255,255,.12)'); hl.addColorStop(1, 'rgba(0,0,0,.32)')
  g.fillStyle = hl; g.fillRect(-r, -r, 2 * r, 2 * r)
  g.restore()
  if (kieu !== 'cai' && kiHieu) {
    g.font = `800 ${Math.round(r * (kiHieu.length > 1 ? 0.92 : 1.08))}px 'Be Vietnam Pro',system-ui,sans-serif`
    g.textAlign = 'center'; g.textBaseline = 'middle'
    if (kieu === 'chot') { g.fillStyle = C.den; g.fillText(kiHieu, 0, r * 0.05) }
    else { g.lineJoin = 'round'; g.lineWidth = r * 0.16; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(kiHieu, 0, r * 0.05); g.fillStyle = 'rgb(255,255,255)'; g.fillText(kiHieu, 0, r * 0.05) }
  }
  if (vang) { g.strokeStyle = C.vang; g.lineWidth = r * 0.16; g.beginPath(); g.arc(0, 0, r * 1.12, 0, 7); g.stroke() }
}

/** Ảnh đệm một bi, bán kính `r` điểm ảnh; cạnh = ⌈r × KHUNG_ANH⌉. Không có canvas (test) ⇒ null. */
export function taoAnhBi(doc: Document, kieu: KieuBi, kiHieu: string, r: number, vang: boolean): HTMLCanvasElement | null {
  const n = Math.max(8, Math.ceil(r * KHUNG_ANH)), cv = doc.createElement('canvas')
  cv.width = cv.height = n
  let g: CanvasRenderingContext2D | null = null
  try { g = cv.getContext('2d') } catch { g = null }
  if (!g) return null
  g.translate(n / 2, n / 2)
  veMotBi(g, kieu, kiHieu, r, vang)
  return cv
}

// ───────────── BI ĐANG LĂN (thầy hỏi 30/09 "hiệu ứng lăn bi mượt mà vẫn giữ nguyên chứ") ─────────────
// Bi ĐANG CHẠY vẽ lăn như bản cũ: từng điểm ảnh = pháp tuyến mặt cầu × ma trận quay (quaternion trong vật lý, chỉ để vẽ) ⇒ kí hiệu và dải sọc
// chạy theo hướng lăn; màu theo góc nhìn (em lam đặc, đối thủ nền trắng dải đỏ cam, chốt đen có ô trắng). Bi đã lăn thì dừng vẫn giữ hướng (lăn thật).
// Bảng chiếu sáng tính một lần mỗi cỡ; chữ là mặt nạ (tô + viền) vẽ một lần. Bàn nằm ngang: pháp tuyến màn quay (nx, ny) → (ny, −nx).
export interface Bong { N: number; nx: Float32Array; ny: Float32Array; nz: Float32Array; sh: Float32Array; sp: Float32Array; al: Float32Array }
export function taoBong(N: number): Bong {
  const rp = (N - 2) / 2, n = N * N
  const B: Bong = { N, nx: new Float32Array(n), ny: new Float32Array(n), nz: new Float32Array(n), sh: new Float32Array(n), sp: new Float32Array(n), al: new Float32Array(n) }
  let Lx = -0.42, Ly = -0.55, Lz = -0.72
  const lL = Math.sqrt(Lx * Lx + Ly * Ly + Lz * Lz); Lx /= lL; Ly /= lL; Lz /= lL
  let Hx = Lx, Hy = Ly, Hz = Lz - 1
  const lH = Math.sqrt(Hx * Hx + Hy * Hy + Hz * Hz); Hx /= lH; Hy /= lH; Hz /= lH
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const k = j * N + i, cx = (i + 0.5 - N / 2) / rp, cy = (j + 0.5 - N / 2) / rp, d = Math.sqrt(cx * cx + cy * cy)
    const al = Math.max(0, Math.min(1, (1 - d) * rp + 0.5))
    B.al[k] = al
    if (al <= 0) continue
    let nx = cx, ny = cy, nz = -Math.sqrt(Math.max(0, 1 - d * d))
    if (d > 1) { nx = cx / d; ny = cy / d; nz = 0 }
    B.nx[k] = nx; B.ny[k] = ny; B.nz[k] = nz
    const dif = Math.max(0, nx * Lx + ny * Ly + nz * Lz), h = Math.max(0, nx * Hx + ny * Hy + nz * Hz), mat = -nz
    B.sh[k] = (0.3 + 0.78 * dif) * (0.7 + 0.3 * mat)
    B.sp[k] = Math.pow(h, 60) * 0.95 + Math.pow(h, 8) * 0.1
  }
  return B
}
/** Góc nghiêng tối đa của ô kí hiệu so với hướng nhìn lúc xếp bàn (thầy 30/09: bi đầu ván trông như bi thật nhưng em vẫn nhận ra kí hiệu). */
export const NGHIENG_TOI_DA = 55 * Math.PI / 180
/**
 * HƯỚNG QUAY KHỞI TẠO của một bi lúc xếp bàn (thầy 30/09 "màn xếp bi cho hiển thị bi thật luôn"): ngẫu nhiên tự nhiên nhưng ỔN ĐỊNH theo hạt giống
 * (mã ván + kí hiệu bi) — vẽ lại bao nhiêu lần cũng vậy. Ô kí hiệu (+x cục bộ) quay về phía người xem rồi xoay trong mặt phẳng màn một góc bất kỳ
 * và nghiêng khỏi hướng nhìn ≤ NGHIENG_TOI_DA ⇒ kí hiệu có thể lệch / nghiêng / khuất một phần nhưng luôn thấy được; dải sọc nghiêng theo.
 * Chỉ là hình ảnh cục bộ (không vào băm, không gửi mạng).
 */
export function huongKhoiTao(hatGiong: string): [number, number, number, number] {
  let h = 2166136261 >>> 0
  for (let i = 0; i < hatGiong.length; i++) { h ^= hatGiong.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0 }
  const rand = () => { h = (h + 0x6d2b79f5) >>> 0; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const xoayMan = (rand() * 2 - 1) * Math.PI, phi = rand() * 2 * Math.PI, nghieng = Math.sqrt(rand()) * NGHIENG_TOI_DA
  const goc: [number, number, number, number] = [Math.SQRT1_2, 0, Math.SQRT1_2, 0] // ô kí hiệu nhìn thẳng người xem
  const z = qTruc(0, 0, 1, xoayMan), t = qTruc(Math.cos(phi), Math.sin(phi), 0, nghieng)
  return qMul(t, qMul(z, goc))
}
/** Đặt hướng khởi tạo cho mọi bi của bàn theo mã ván (gọi một lần lúc tạo ván). */
export function datHuongKhoiTao(balls: readonly Bi[], maVan: string): void {
  for (const b of balls) { const q = huongKhoiTao(`${maVan}|${b.id}`); b.q[0] = q[0]; b.q[1] = q[1]; b.q[2] = q[2]; b.q[3] = q[3]; b.ver++ }
}
export const CHU_T = 64
/** Mặt nạ kí hiệu (tô + viền) CHU_T × CHU_T. Không có canvas (test) ⇒ rỗng (bi trơn). */
export interface MatNa { to: Uint8Array; vien: Uint8Array }
export function taoMatNa(doc: Document | undefined, kiHieu: string): MatNa {
  const to = new Uint8Array(CHU_T * CHU_T), vien = new Uint8Array(CHU_T * CHU_T)
  try {
    const c = doc?.createElement('canvas'), x = c?.getContext('2d')
    if (c && x) {
      c.width = c.height = CHU_T
      x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round'
      x.font = `800 ${Math.round(CHU_T * (kiHieu.length > 1 ? 0.6 : 0.74))}px 'Be Vietnam Pro',system-ui,sans-serif`
      x.lineWidth = CHU_T * 0.12; x.strokeStyle = 'rgb(0,0,0)'; x.strokeText(kiHieu, CHU_T / 2, CHU_T * 0.54)
      const a = x.getImageData(0, 0, CHU_T, CHU_T).data
      for (let k = 0; k < CHU_T * CHU_T; k++) vien[k] = a[k * 4 + 3]!
      x.clearRect(0, 0, CHU_T, CHU_T); x.fillStyle = 'rgb(0,0,0)'; x.fillText(kiHieu, CHU_T / 2, CHU_T * 0.54)
      const b = x.getImageData(0, 0, CHU_T, CHU_T).data
      for (let k = 0; k < CHU_T * CHU_T; k++) to[k] = b[k * 4 + 3]!
    }
  } catch { /* máy không vẽ chữ được: bi trơn */ }
  return { to, vien }
}
const DO_CHAM = [206, 32, 44] as const
/** Tô ảnh một bi ĐANG LĂN vào `d` (RGBA, N × N). `q`: hướng quay (quaternion); `chu`: mặt nạ kí hiệu (bi cái: null). */
export function toBiLan(B: Bong, kieu: KieuBi, chu: MatNa | null, q: readonly [number, number, number, number], xoay: boolean, d: Uint8ClampedArray): void {
  const w = q[0], qx = q[1], qy = q[2], qz = q[3], TR = MAU_BI.trang
  const m00 = 1 - 2 * (qy * qy + qz * qz), m01 = 2 * (qx * qy - w * qz), m02 = 2 * (qx * qz + w * qy), m10 = 2 * (qx * qy + w * qz), m11 = 1 - 2 * (qx * qx + qz * qz), m12 = 2 * (qy * qz - w * qx), m20 = 2 * (qx * qz - w * qy), m21 = 2 * (qy * qz + w * qx), m22 = 1 - 2 * (qx * qx + qy * qy)
  const la = kieu === 'cai', base = kieu === 'ta' ? MAU_BI.ta : kieu === 'dich' ? MAU_BI.dich : kieu === 'chot' ? MAU_BI.den : TR
  const Tt = CHU_T, SD = 0.5103, N = B.N
  for (let k = 0; k < N * N; k++) {
    const al = B.al[k]!, o = k * 4
    if (al <= 0) { d[o + 3] = 0; continue }
    let nx = B.nx[k]!, ny = B.ny[k]!
    const nz = B.nz[k]!
    if (xoay) { const t = nx; nx = ny; ny = -t }
    const lx = m00 * nx + m10 * ny + m20 * nz, ly = m01 * nx + m11 * ny + m21 * nz, lz = m02 * nx + m12 * ny + m22 * nz
    let r: number = base[0], g: number = base[1], bl: number = base[2]
    if (la) { if (lx > 0.972 || lx < -0.972 || ly > 0.972 || ly < -0.972 || lz > 0.972 || lz < -0.972) { r = DO_CHAM[0]; g = DO_CHAM[1]; bl = DO_CHAM[2] } }
    else {
      const ax = lx < 0 ? -lx : lx
      if (kieu === 'dich' && (ly > 0.6 || ly < -0.6)) { r = TR[0]; g = TR[1]; bl = TR[2] } // dải đỏ cam quanh xích đạo chứa hai ô kí hiệu (±x) — lúc nằm yên ở dáng gốc là dải NGANG như ảnh vẽ sẵn
      if (ax > 0.874 && chu) {
        if (kieu === 'chot') { r = TR[0]; g = TR[1]; bl = TR[2] }
        let u = lz / SD
        const v = ly / SD
        if (lx < 0) u = -u
        const tu = ((u * 0.5 + 0.5) * (Tt - 1)) | 0, tv = ((v * 0.5 + 0.5) * (Tt - 1)) | 0
        if (tu >= 0 && tv >= 0 && tu < Tt && tv < Tt) {
          const vi = chu.vien[tv * Tt + tu]! / 255 * 0.7, to = chu.to[tv * Tt + tu]! / 255
          if (kieu === 'chot') { r += (23 - r) * to; g += (23 - g) * to; bl += (26 - bl) * to }
          else { r -= r * vi; g -= g * vi; bl -= bl * vi; r += (255 - r) * to; g += (255 - g) * to; bl += (255 - bl) * to }
        }
      }
    }
    const sh = B.sh[k]!, sp = B.sp[k]! * 255
    d[o] = r * sh + sp; d[o + 1] = g * sh + sp; d[o + 2] = bl * sh + sp
    d[o + 3] = al * 255
  }
}
