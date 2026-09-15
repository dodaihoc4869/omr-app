/**
 * VẼ THẦN THÚ — 12 HÌNH THÁI, CỘNG DỒN.
 *
 * Mỗi hình thái vẽ đủ mọi lớp của hình thái trước rồi thêm lớp mới. Nhờ vậy
 * "cấp sau ngầu hơn cấp trước" không phải là lời hứa mà là hệ quả của cách
 * dựng mã — và phép kiểm `than-thu-hinh-thai` đếm điểm ảnh để chứng minh.
 *
 * Chỉ dùng rgb / rgba, không hex — theo `check:mau` của kho.
 */
import { layHinhThai, type HinhThai } from './hinh-thai'
import type { ThanThuInfo } from './he-thong-pet'

export interface ThongSoHieuUng {
  thoiGian: number
  dangDanh: boolean
  dangBiDanh: boolean
  dangTungNo: boolean
  /**
   * Góc xoay quanh trục đứng, radian. Em vuốt ngang trên canvas thì thú quay.
   *
   * Canvas 2D không có không gian ba chiều, nên xoay được giả bằng cách NÉN
   * ngang theo `cos(góc)`: nhìn thẳng thì cos = 1, nghiêng 90° thì cos = 0 và
   * thú mỏng như tờ giấy, qua 90° thì cos âm và hình tự lật — đúng cảm giác
   * quay tròn 360°. Không truyền thì coi như nhìn thẳng.
   */
  gocXoay?: number
}

function nhat(mau: string, doMo: number): string {
  const m = mau.match(/-?\d+(\.\d+)?/g)
  if (!m || m.length < 3) return mau
  return `rgba(${m[0]}, ${m[1]}, ${m[2]}, ${doMo})`
}

function sang(mau: string, k: number): string {
  const m = mau.match(/-?\d+(\.\d+)?/g)
  if (!m || m.length < 3) return mau
  const f = (i: number) => Math.round(Math.min(255, Number(m[i]) + (255 - Number(m[i])) * k))
  return `rgb(${f(0)}, ${f(1)}, ${f(2)})`
}

/* ─────────── từng lớp ─────────── */

function veHaoQuang(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, h: HinhThai, t: number): void {
  const nhip = 1 + Math.sin(t * 2.2) * 0.06
  const R = r * (1.55 + h.damHaoQuang * 0.5) * nhip
  const g = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, R)
  g.addColorStop(0, nhat(info.mauHaoQuang, 0.34 + h.damHaoQuang * 0.3))
  g.addColorStop(1, nhat(info.mauHaoQuang, 0))
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill()
}

function veQuyDao(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, h: HinhThai, t: number): void {
  for (let i = 0; i < h.soHat; i++) {
    const g = (i / h.soHat) * Math.PI * 2 + t * 1.5
    const rx = r * 1.35, ry = r * 0.5
    const x = Math.cos(g) * rx, y = Math.sin(g) * ry
    const co = r * (0.05 + 0.03 * Math.sin(t * 4 + i))
    ctx.beginPath(); ctx.arc(x, y, Math.max(1, co), 0, Math.PI * 2)
    ctx.fillStyle = i % 2 ? sang(info.mauPhu, 0.3) : sang(info.mauChinh, 0.35)
    ctx.fill()
  }
}

function veVongRune(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, soVong: number, t: number): void {
  const KY_TU = ['Al', 'Cl', 'Ba', 'H⁺', 'OH⁻', 'F', 'Na', 'S']
  for (let v = 0; v < soVong; v++) {
    const R = r * (1.14 + v * 0.16)
    const chieu = v % 2 === 0 ? 1 : -1
    ctx.save()
    ctx.rotate(t * 0.45 * chieu + v)
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2)
    ctx.strokeStyle = nhat(info.mauHaoQuang, 0.5)
    ctx.lineWidth = Math.max(1, r * 0.03)
    ctx.setLineDash([r * 0.14, r * 0.10])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.font = `700 ${Math.max(6, r * 0.14)}px "Baloo 2", system-ui, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillStyle = sang(info.mauPhu, 0.25)
    for (let i = 0; i < 4; i++) {
      const g = (i / 4) * Math.PI * 2
      ctx.save()
      ctx.translate(Math.cos(g) * R, Math.sin(g) * R)
      ctx.rotate(-t * 0.45 * chieu - v)
      ctx.fillText(KY_TU[(v * 4 + i) % KY_TU.length]!, 0, 0)
      ctx.restore()
    }
    ctx.restore()
  }
}

function veCanh(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, lon: boolean, t: number): void {
  // Cánh phải RA DÁNG CÁNH: vuốt chéo lên sau lưng, mép sau khía răng cưa.
  // Bản trước là một khối bầu to hơn cả thân, trông như cái bướu chứ không phải cánh.
  const vo = Math.sin(t * 6) * (lon ? 0.26 : 0.16)
  const d = lon ? 1.0 : 0.66
  const soKhia = lon ? 4 : 3
  for (const ben of [-1, 1]) {
    ctx.save()
    ctx.scale(ben, 1)
    ctx.translate(r * 0.42, -r * 0.28)
    ctx.rotate(-0.35 + vo)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    // mép trước: vuốt thẳng lên chéo ra sau
    ctx.quadraticCurveTo(r * 0.5 * d, -r * 0.95 * d, r * 1.02 * d, -r * 0.88 * d)
    // mép sau: khía răng cưa như cánh dơi/rồng
    for (let i = soKhia; i >= 1; i--) {
      const u = i / soKhia
      const x = r * 1.02 * d * u
      const y = -r * 0.88 * d * u + r * 0.34 * d * (1 - u)
      ctx.quadraticCurveTo(x + r * 0.10 * d, y + r * 0.20 * d, x - r * 0.16 * d, y + r * 0.06 * d)
    }
    ctx.closePath()

    const g = ctx.createLinearGradient(0, -r * d, r * d, r * 0.2)
    g.addColorStop(0, nhat(sang(info.mauPhu, 0.2), 0.96))
    g.addColorStop(1, nhat(info.mauChinh, 0.72))
    ctx.fillStyle = g
    ctx.strokeStyle = nhat(info.mauChinh, 0.95)
    ctx.lineWidth = Math.max(1, r * 0.032)
    ctx.lineJoin = 'round'
    ctx.fill(); ctx.stroke()

    // gân cánh
    ctx.beginPath()
    for (let i = 1; i <= soKhia; i++) {
      const u = i / soKhia
      ctx.moveTo(0, 0)
      ctx.lineTo(r * 1.02 * d * u, -r * 0.88 * d * u + r * 0.30 * d * (1 - u))
    }
    ctx.strokeStyle = nhat(info.mauChinh, 0.45)
    ctx.lineWidth = Math.max(0.8, r * 0.022)
    ctx.stroke()
    ctx.restore()
  }
}

function veThan(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, h: HinhThai, t: number): void {
  const tho = 1 + Math.sin(t * 3.5) * 0.035
  ctx.save()
  ctx.scale(1, tho)
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, sang(info.mauChinh, 0.28))
  g.addColorStop(1, info.mauChinh)
  ctx.fillStyle = g
  ctx.strokeStyle = nhat(info.mauPhu, 0.9)
  ctx.lineWidth = Math.max(1.5, r * 0.055)
  ctx.fill(); ctx.stroke()
  // bụng
  ctx.beginPath()
  ctx.ellipse(0, r * 0.28, r * 0.58, r * 0.46, 0, 0, Math.PI * 2)
  ctx.fillStyle = nhat(sang(info.mauPhu, 0.55), 0.85)
  ctx.fill()
  ctx.restore()

  if (h.vay) {
    // vảy nguyên tố: ba hàng vảy hình giọt trên lưng
    for (let hang = 0; hang < 3; hang++) {
      for (let i = 0; i < 5; i++) {
        const gx = (i - 2) * r * 0.26
        const gy = -r * 0.55 + hang * r * 0.22
        ctx.beginPath()
        ctx.moveTo(gx, gy)
        ctx.quadraticCurveTo(gx + r * 0.1, gy + r * 0.12, gx, gy + r * 0.2)
        ctx.quadraticCurveTo(gx - r * 0.1, gy + r * 0.12, gx, gy)
        ctx.fillStyle = nhat(sang(info.mauPhu, 0.2), 0.55)
        ctx.fill()
      }
    }
  }
}

function veSung(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, to: boolean): void {
  for (const ben of [-1, 1]) {
    ctx.beginPath()
    const d = to ? 1.6 : 1
    ctx.moveTo(ben * r * 0.42, -r * 0.72)
    ctx.lineTo(ben * r * 0.62 * d, -r * (1.05 + 0.25 * (d - 1)))
    ctx.lineTo(ben * r * 0.22, -r * 0.82)
    ctx.closePath()
    ctx.fillStyle = to ? 'rgb(250, 204, 21)' : nhat(info.mauPhu, 0.95)
    ctx.strokeStyle = nhat(info.mauChinh, 0.8)
    ctx.lineWidth = Math.max(1, r * 0.03)
    ctx.fill(); ctx.stroke()
  }
}

function veDuoi(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, t: number): void {
  const lac = Math.sin(t * 3) * 0.25
  ctx.save()
  ctx.translate(-r * 0.85, r * 0.35)
  ctx.rotate(lac)
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.quadraticCurveTo(-r * 0.55, r * 0.15, -r * 0.8, -r * 0.25)
  ctx.lineWidth = Math.max(2, r * 0.13)
  ctx.strokeStyle = info.mauChinh
  ctx.lineCap = 'round'
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(-r * 0.8, -r * 0.25, r * 0.15, 0, Math.PI * 2)
  ctx.fillStyle = nhat(info.mauPhu, 0.95)
  ctx.fill()
  ctx.restore()
}

function veMat(ctx: CanvasRenderingContext2D, r: number, ruc: boolean, t: number): void {
  const nhay = Math.sin(t * 1.1) > 0.985
  for (const ben of [-1, 1]) {
    const x = ben * r * 0.3, y = -r * 0.08
    if (nhay) {
      ctx.beginPath()
      ctx.moveTo(x - r * 0.13, y); ctx.quadraticCurveTo(x, y + r * 0.07, x + r * 0.13, y)
      ctx.strokeStyle = 'rgb(30, 41, 59)'; ctx.lineWidth = Math.max(1.5, r * 0.045)
      ctx.stroke()
      continue
    }
    ctx.beginPath(); ctx.ellipse(x, y, r * 0.17, r * 0.21, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgb(255, 255, 255)'; ctx.fill()
    ctx.beginPath(); ctx.arc(x, y + r * 0.02, r * 0.1, 0, Math.PI * 2)
    ctx.fillStyle = ruc ? 'rgb(251, 146, 60)' : 'rgb(30, 41, 59)'; ctx.fill()
    if (ruc) {
      const g = ctx.createRadialGradient(x, y, 1, x, y, r * 0.3)
      g.addColorStop(0, 'rgba(251, 146, 60, 0.75)')
      g.addColorStop(1, 'rgba(251, 146, 60, 0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(x, y, r * 0.3, 0, Math.PI * 2); ctx.fill()
    }
    ctx.beginPath(); ctx.arc(x - r * 0.04, y - r * 0.05, r * 0.04, 0, Math.PI * 2)
    ctx.fillStyle = 'rgb(255, 255, 255)'; ctx.fill()
    ctx.beginPath(); ctx.arc(x + r * 0.05, y + r * 0.06, r * 0.02, 0, Math.PI * 2)
    ctx.fill()
  }
  // má hồng + miệng
  for (const ben of [-1, 1]) {
    ctx.beginPath(); ctx.ellipse(ben * r * 0.52, r * 0.16, r * 0.11, r * 0.07, 0, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(251, 113, 133, 0.5)'; ctx.fill()
  }
  ctx.beginPath()
  ctx.moveTo(-r * 0.12, r * 0.24)
  ctx.quadraticCurveTo(0, r * 0.36, r * 0.12, r * 0.24)
  ctx.strokeStyle = 'rgb(30, 41, 59)'; ctx.lineWidth = Math.max(1.2, r * 0.035)
  ctx.lineCap = 'round'; ctx.stroke()
}

function veVuongMien(ctx: CanvasRenderingContext2D, r: number, toiThuong: boolean): void {
  ctx.beginPath()
  ctx.moveTo(-r * 0.46, -r * 0.9)
  ctx.lineTo(-r * 0.3, -r * 1.16)
  ctx.lineTo(-r * 0.12, -r * 0.94)
  ctx.lineTo(0, -r * 1.26)
  ctx.lineTo(r * 0.12, -r * 0.94)
  ctx.lineTo(r * 0.3, -r * 1.16)
  ctx.lineTo(r * 0.46, -r * 0.9)
  ctx.closePath()
  const g = ctx.createLinearGradient(0, -r * 1.3, 0, -r * 0.85)
  g.addColorStop(0, 'rgb(254, 240, 138)')
  g.addColorStop(1, 'rgb(234, 179, 8)')
  ctx.fillStyle = g
  ctx.strokeStyle = 'rgb(161, 98, 7)'
  ctx.lineWidth = Math.max(1, r * 0.028)
  ctx.fill(); ctx.stroke()
  if (toiThuong) {
    ctx.beginPath(); ctx.arc(0, -r * 1.02, r * 0.07, 0, Math.PI * 2)
    ctx.fillStyle = 'rgb(244, 63, 94)'; ctx.fill()
  }
}

function veVo(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo): void {
  ctx.beginPath()
  ctx.ellipse(0, 0, r * 0.95, r * 1.12, 0, 0, Math.PI * 2)
  const g = ctx.createLinearGradient(0, -r, 0, r)
  g.addColorStop(0, 'rgb(255, 255, 255)')
  g.addColorStop(1, nhat(sang(info.mauPhu, 0.4), 0.95))
  ctx.fillStyle = g
  ctx.strokeStyle = nhat(info.mauChinh, 0.75)
  ctx.lineWidth = Math.max(1.5, r * 0.05)
  ctx.fill(); ctx.stroke()
  // vết nứt
  ctx.beginPath()
  ctx.moveTo(-r * 0.5, -r * 0.1)
  ctx.lineTo(-r * 0.18, r * 0.06)
  ctx.lineTo(-r * 0.3, r * 0.3)
  ctx.lineTo(r * 0.06, r * 0.16)
  ctx.lineTo(r * 0.5, r * 0.34)
  ctx.strokeStyle = nhat(info.mauChinh, 0.55)
  ctx.lineWidth = Math.max(1, r * 0.035)
  ctx.stroke()
  // hai chấm mắt ló qua vết nứt
  for (const ben of [-1, 1]) {
    ctx.beginPath(); ctx.arc(ben * r * 0.2, r * 0.02, r * 0.055, 0, Math.PI * 2)
    ctx.fillStyle = 'rgb(30, 41, 59)'; ctx.fill()
  }
}

function veLuaVien(ctx: CanvasRenderingContext2D, r: number, info: ThanThuInfo, t: number): void {
  for (let i = 0; i < 14; i++) {
    const g = (i / 14) * Math.PI * 2 + t * 0.9
    const cao = r * (0.16 + 0.10 * Math.abs(Math.sin(t * 6 + i)))
    ctx.save()
    ctx.rotate(g)
    ctx.beginPath()
    ctx.moveTo(-r * 0.08, -r * 1.02)
    ctx.quadraticCurveTo(0, -r * 1.02 - cao, r * 0.08, -r * 1.02)
    ctx.closePath()
    ctx.fillStyle = i % 2 ? 'rgba(251, 146, 60, 0.85)' : nhat(sang(info.mauChinh, 0.3), 0.85)
    ctx.fill()
    ctx.restore()
  }
}

/* ─────────── vẽ một thần thú ─────────── */

/**
 * HỘP BAO LỚN NHẤT CỦA HÌNH VẼ, tính theo đơn vị `banKinh`.
 *
 * ĐO THẬT, không ước lượng: dựng 4 thần thú × 12 cấp × 4 cờ hiệu ứng × 12 mốc
 * thời gian trên Chromium, quét điểm ảnh đặc (alpha > 190) rồi lấy biên xa nhất.
 * Ca xấu nhất luôn là cấp 12 `dangTungNo` — vòng lửa viền của hình thái tối
 * thượng là thứ vươn xa nhất.
 *
 * Trước khi có mấy số này, canvas lấy tâm ở giữa khung và bán kính
 * `min(w,h) * 0,32`: ĐUÔI bị cắt cụt ở mép trái từ cấp 4 trở lên, còn cấp 8
 * lúc tung chiêu thì CÁNH bị cắt ở mép trên. Chỉ nhìn ảnh chụp mới thấy.
 *
 * Sửa hình vẽ thì phải ĐO LẠI bộ số này.
 */
export const HOP_BAO_THAN_THU = { trai: 2.43, phai: 2.04, tren: 2.11, duoi: 1.97 } as const

/**
 * Chọn tâm và bán kính để cả hình nằm gọn trong khung, chừa `le` điểm ảnh mép.
 * Bán kính KHÔNG đổi theo cấp — cấp thấp vẽ nhỏ hơn trong khung là đúng ý đồ:
 * cấp sau phải trông ngầu hơn cấp trước.
 */
export function khungVeThanThu(w: number, h: number, le = 4): { cx: number; cy: number; banKinh: number } {
  const B = HOP_BAO_THAN_THU
  const r = Math.max(
    1,
    Math.min((w - le * 2) / (B.trai + B.phai), (h - le * 2) / (B.tren + B.duoi)),
  )
  return {
    cx: (w - (B.trai + B.phai) * r) / 2 + B.trai * r,
    cy: (h - (B.tren + B.duoi) * r) / 2 + B.tren * r,
    banKinh: r,
  }
}

export function veThanThuCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, banKinh: number,
  info: ThanThuInfo,
  cap: number,
  fx: ThongSoHieuUng,
): void {
  const h = layHinhThai(cap)
  const t = fx.thoiGian
  const r = banKinh * h.coCon * (fx.dangTungNo ? 1.12 : 1)

  ctx.save()
  ctx.translate(cx, cy)

  // XOAY 360° quanh trục đứng. Giữ |cos| tối thiểu 0,15: ảnh chụp thử ở 0,06
  // cho ra một vệt mảnh như sợi chỉ ở đúng 90° và 270°, em tưởng thú biến mất.
  const goc = fx.gocXoay ?? 0
  if (goc !== 0) {
    const c = Math.cos(goc)
    const ti = Math.sign(c || 1) * Math.max(0.15, Math.abs(c))
    ctx.scale(ti, 1)
  }

  if (fx.dangBiDanh) {
    ctx.translate(Math.sin(t * 40) * banKinh * 0.06, 0)
    ctx.globalAlpha = 0.72
  }
  if (fx.dangDanh) ctx.translate(banKinh * 0.12, 0)

  if (h.haoQuang) veHaoQuang(ctx, r, info, h, t)
  if (h.vongRune) veVongRune(ctx, r, info, h.toiThuong ? 3 : 1, t)
  if (h.quyDao) veQuyDao(ctx, r, info, h, t)

  // bóng đổ
  ctx.beginPath()
  ctx.ellipse(0, r * 1.15, r * 0.7, r * 0.16, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.16)'
  ctx.fill()

  if (h.vo) { veVo(ctx, r, info); ctx.restore(); return }

  if (h.canhNho || h.canhLon) veCanh(ctx, r, info, h.canhLon, t)
  if (h.duoi) veDuoi(ctx, r, info, t)
  veThan(ctx, r, info, h, t)
  if (h.sung) veSung(ctx, r, info, h.toiThuong)
  veMat(ctx, r, h.toiThuong, t)
  if (h.vuongMien) veVuongMien(ctx, r, h.toiThuong)
  if (h.toiThuong) veLuaVien(ctx, r, info, t)

  ctx.restore()
}
