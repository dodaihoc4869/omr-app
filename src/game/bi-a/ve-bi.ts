// BI-A PHẢN ỨNG · VẼ BI NGUYÊN TỐ 3D (đặc tả 7.3). Vẽ từng điểm ảnh: pháp tuyến mặt cầu × ma trận quay (quaternion).
// Đèn cố định theo MÀN (góc trên trái). Kim loại: phản chiếu môi trường cố định (đèn trần sáng, vạch chân trời tối, nỉ tối) ⇒ ánh kim.
// Phi kim: nền trắng, sọc màu |lz| < 0,5. Bi chốt: đen. Hai ô nhãn ở ±x cục bộ: Z (nhỏ, trên) + kí hiệu (lớn, dưới), lăn theo bi.
// Bi cái trắng, 6 chấm đỏ để thấy xoáy. Bàn nằm ngang: pháp tuyến màn quay (nx, ny) → (ny, −nx) trước khi nhân ma trận quay.
import { NT, type KiHieu } from './nguyen-to'
import type { MaBi, Quat } from './vat-ly'

const TRANG = [246, 243, 236] as const, MUC_SO = [22, 22, 26] as const, DO_CHAM = [206, 32, 44] as const
export const CHU_T = 64
export interface Bong { N: number; nx: Float32Array; ny: Float32Array; nz: Float32Array; sh: Float32Array; sp: Float32Array; al: Float32Array; km: Float32Array; ks: Float32Array }
/** Bảng chiếu sáng cho ảnh bi cạnh N điểm ảnh (tính một lần mỗi cỡ). */
export function taoBong(N: number): Bong {
  const rp = (N - 2) / 2, n = N * N
  const B: Bong = { N, nx: new Float32Array(n), ny: new Float32Array(n), nz: new Float32Array(n), sh: new Float32Array(n), sp: new Float32Array(n), al: new Float32Array(n), km: new Float32Array(n), ks: new Float32Array(n) }
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
    const tren = -ny, env = tren > 0 ? 0.72 + 0.5 * tren : 0.46 + 0.2 * tren, chan = Math.abs(ny - 0.06) < 0.07 ? 0.55 : 1
    B.km[k] = env * chan * (0.55 + 0.55 * dif) * (0.75 + 0.25 * mat)
    B.ks[k] = Math.pow(h, 120) * 1.25 + Math.pow(h, 16) * 0.32 + Math.pow(1 - mat, 3) * 0.28
  }
  return B
}
export type BangChu = Partial<Record<KiHieu, Uint8Array>>
/** Mặt nạ chữ (Z + kí hiệu) cho ô nhãn, CHU_T × CHU_T. Không có canvas (test) ⇒ mặt nạ rỗng (ô trắng trơn). */
export function taoChu(doc?: Document): BangChu {
  const ra: BangChu = {}
  const d = doc ?? (typeof document !== 'undefined' ? document : undefined)
  for (const id of Object.keys(NT) as KiHieu[]) {
    const a = new Uint8Array(CHU_T * CHU_T)
    try {
      const c = d?.createElement('canvas')
      const x = c?.getContext('2d')
      if (c && x) {
        c.width = c.height = CHU_T
        x.fillStyle = 'rgb(0,0,0)'; x.textAlign = 'center'; x.textBaseline = 'middle'
        x.font = `700 ${Math.round(CHU_T * 0.22)}px 'Be Vietnam Pro',sans-serif`; x.fillText(String(NT[id].z), CHU_T / 2, CHU_T * 0.27)
        x.font = `800 ${Math.round(CHU_T * (id.length > 1 ? 0.43 : 0.5))}px 'Baloo 2','Be Vietnam Pro',sans-serif`; x.fillText(id, CHU_T / 2, CHU_T * 0.65)
        const px = x.getImageData(0, 0, CHU_T, CHU_T).data
        for (let k = 0; k < CHU_T * CHU_T; k++) a[k] = px[k * 4 + 3]!
      }
    } catch { /* máy không vẽ chữ được: ô nhãn trắng trơn */ }
    ra[id] = a
  }
  return ra
}
/** Tô ảnh một bi vào `d` (RGBA, N × N). */
export function toBi(B: Bong, chu: BangChu, id: MaBi, q: Quat, xoay: boolean, d: Uint8ClampedArray): void {
  const w = q[0], qx = q[1], qy = q[2], qz = q[3]
  const m00 = 1 - 2 * (qy * qy + qz * qz), m01 = 2 * (qx * qy - w * qz), m02 = 2 * (qx * qz + w * qy), m10 = 2 * (qx * qy + w * qz), m11 = 1 - 2 * (qx * qx + qz * qz), m12 = 2 * (qy * qz - w * qx), m20 = 2 * (qx * qz - w * qy), m21 = 2 * (qy * qz + w * qx), m22 = 1 - 2 * (qx * qx + qy * qy)
  const la = id === 'cue', n = la ? null : NT[id], kl = !!n && n.nhom === 'kl', soc = !!n && n.nhom === 'pk', base = la ? TRANG : n!.rgb
  const tx = la ? null : chu[id as KiHieu] ?? null, Tt = CHU_T, SD = 0.5103, N = B.N
  for (let k = 0; k < N * N; k++) {
    const al = B.al[k]!, o = k * 4
    if (al <= 0) { d[o + 3] = 0; continue }
    let nx = B.nx[k]!, ny = B.ny[k]!
    const nz = B.nz[k]!
    if (xoay) { const t = nx; nx = ny; ny = -t }
    const lx = m00 * nx + m10 * ny + m20 * nz, ly = m01 * nx + m11 * ny + m21 * nz, lz = m02 * nx + m12 * ny + m22 * nz
    let r: number = base[0], g: number = base[1], bl: number = base[2], kim = kl
    if (la) { if (lx > 0.972 || lx < -0.972 || ly > 0.972 || ly < -0.972 || lz > 0.972 || lz < -0.972) { r = DO_CHAM[0]; g = DO_CHAM[1]; bl = DO_CHAM[2] } }
    else {
      const ax = lx < 0 ? -lx : lx
      if (ax > 0.874) {
        let u = lz / SD
        const v = ly / SD
        if (lx < 0) u = -u
        const tu = ((u * 0.5 + 0.5) * (Tt - 1)) | 0, tv = ((v * 0.5 + 0.5) * (Tt - 1)) | 0
        const a = tx && tu >= 0 && tv >= 0 && tu < Tt && tv < Tt ? tx[tv * Tt + tu]! / 255 : 0
        r = TRANG[0] + (MUC_SO[0] - TRANG[0]) * a; g = TRANG[1] + (MUC_SO[1] - TRANG[1]) * a; bl = TRANG[2] + (MUC_SO[2] - TRANG[2]) * a; kim = false
      } else if (ax > 0.86) { r = g = bl = 60; kim = false }
      else if (soc && (lz > 0.5 || lz < -0.5)) { r = TRANG[0]; g = TRANG[1]; bl = TRANG[2] }
    }
    if (kim) { const km = B.km[k]!, ks = B.ks[k]!; d[o] = r * km + ks * (150 + 0.42 * r); d[o + 1] = g * km + ks * (150 + 0.42 * g); d[o + 2] = bl * km + ks * (150 + 0.42 * bl) }
    else { const sh = B.sh[k]!, sp = B.sp[k]! * 255; d[o] = r * sh + sp; d[o + 1] = g * sh + sp; d[o + 2] = bl * sh + sp }
    d[o + 3] = al * 255
  }
}
