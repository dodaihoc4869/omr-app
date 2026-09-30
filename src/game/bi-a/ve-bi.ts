// BI-A PHẢN ỨNG · VẼ BI (thầy chốt bản vẽ "Bàn Bi-a mới" 30/09). Mỗi KIỂU bi (theo góc nhìn: của em / đối thủ / chốt / bi cái) + kí hiệu
// + trạng thái viền vàng (đã giải trước) vẽ MỘT lần vào canvas đệm; mỗi khung chỉ drawImage — không dựng gradient/chữ mỗi khung (máy yếu).
// Bi của em: lam đặc. Bi đối thủ: nền trắng, dải đỏ cam giữa 60 % chiều cao (bi sọc). Bi chốt: đen, vòng trắng giữa, chữ tối.
// Kí hiệu nguyên tố: chữ trắng đậm viền tối, cỡ 1,08 R (một chữ) / 0,92 R (hai chữ). Viền vàng mảnh ngoài thân bi, thân bi giữ nguyên.
import { MAU_BI, rgbCss, type KieuBi } from './nguyen-to'

const C = { ta: rgbCss(MAU_BI.ta), dich: rgbCss(MAU_BI.dich), trang: rgbCss(MAU_BI.trang), den: rgbCss(MAU_BI.den), vang: rgbCss(MAU_BI.vang) }
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
