/**
 * RENDER ĐỒ HỌA THẦN THÚ BẰNG CANVAS 2D VECTƠ NÉT GOOGLE
 * Vẽ Chibi động: mắt chớp, cánh vỗ, hạt năng lượng xoay quanh theo cấp tiến hóa (1, 2, 3)
 * Tuân thủ tuyệt đối quy tắc check:mau (chỉ dùng rgb / rgba, không dùng hex code).
 */

import type { ThanThuInfo, CapTienHoa } from './he-thong-pet'

export interface ThongSoHieuUng {
  thoiGian: number // giây
  dangDanh: boolean
  dangBiDanh: boolean
  dangTungNo: boolean
}

export function veThanThuCanvas(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  banKinh: number,
  info: ThanThuInfo,
  capTienHoa: CapTienHoa,
  fx: ThongSoHieuUng
) {
  ctx.save()
  const t = fx.thoiGian

  // Nhấp nháy khi bị đánh
  if (fx.dangBiDanh && Math.sin(t * 30) > 0) {
    ctx.globalAlpha = 0.4
  }

  // Chuyển động nhấp nhô thở (idle breath)
  const nhapNho = Math.sin(t * 3.5) * 4
  const tamY = cy + nhapNho

  // 1. VÒNG HÀO QUANG NGUYÊN TỐ (Aura Glow)
  ctx.save()
  const auraGlow = ctx.createRadialGradient(cx, tamY, banKinh * 0.4, cx, tamY, banKinh * 1.5)
  auraGlow.addColorStop(0, info.mauHaoQuang)
  auraGlow.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)')
  auraGlow.addColorStop(1, 'rgba(0, 0, 0, 0)')
  ctx.fillStyle = auraGlow
  ctx.beginPath()
  ctx.arc(cx, tamY, banKinh * 1.5, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // Hạt năng lượng xoay quanh đối với Cấp 2 và Cấp 3
  if (capTienHoa >= 2) {
    const soHat = capTienHoa === 3 ? 8 : 4
    for (let i = 0; i < soHat; i++) {
      const goc = t * 2.5 + (i * Math.PI * 2) / soHat
      const rOrb = banKinh * 1.15 + Math.sin(t * 4 + i) * 6
      const ox = cx + Math.cos(goc) * rOrb
      const oy = tamY + Math.sin(goc) * (rOrb * 0.45) // Elip quỹ đạo 3D

      ctx.save()
      ctx.fillStyle = info.mauPhu
      ctx.shadowColor = info.mauChinh
      ctx.shadowBlur = 10
      ctx.beginPath()
      ctx.arc(ox, oy, capTienHoa === 3 ? 5 : 3.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }

  // 2. BÓNG ĐỔ NỀN
  ctx.save()
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)'
  ctx.beginPath()
  ctx.ellipse(cx, cy + banKinh * 0.95, banKinh * 0.7, banKinh * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 3. VẼ CÁNH NĂNG LƯỢNG (Dành cho cấp 2 & cấp 3)
  if (capTienHoa >= 2) {
    const gocCanh = Math.sin(t * 6) * 0.25
    ctx.save()
    ctx.fillStyle = info.mauPhu
    ctx.strokeStyle = info.mauChinh
    ctx.lineWidth = 2.5

    // Cánh trái
    ctx.save()
    ctx.translate(cx - banKinh * 0.45, tamY - banKinh * 0.2)
    ctx.rotate(-0.35 + gocCanh)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-banKinh * 0.9, -banKinh * 0.8, -banKinh * 0.85, 0)
    ctx.quadraticCurveTo(-banKinh * 0.4, banKinh * 0.4, 0, 0)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    // Cánh phải
    ctx.save()
    ctx.translate(cx + banKinh * 0.45, tamY - banKinh * 0.2)
    ctx.rotate(0.35 - gocCanh)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(banKinh * 0.9, -banKinh * 0.8, banKinh * 0.85, 0)
    ctx.quadraticCurveTo(banKinh * 0.4, banKinh * 0.4, 0, 0)
    ctx.fill()
    ctx.stroke()
    ctx.restore()

    ctx.restore()
  }

  // 4. THÂN CHÍNH (Cơ thể Chibi tròn đáng yêu)
  ctx.save()
  const thanGrad = ctx.createLinearGradient(cx - banKinh * 0.5, tamY - banKinh * 0.6, cx + banKinh * 0.5, tamY + banKinh * 0.6)
  thanGrad.addColorStop(0, info.mauChinh)
  thanGrad.addColorStop(1, info.mauPhu)
  ctx.fillStyle = thanGrad
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.arc(cx, tamY, banKinh * 0.58, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Bụng sáng màu
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.beginPath()
  ctx.ellipse(cx, tamY + banKinh * 0.18, banKinh * 0.32, banKinh * 0.24, 0, 0, Math.PI * 2)
  ctx.fill()

  // 5. ĐẶC ĐIỂM RIÊNG CỦA CÁC HỆ
  if (info.he === 'hoa') {
    // Ngọn lửa nhỏ trên trán
    ctx.fillStyle = 'rgb(251, 146, 60)'
    ctx.beginPath()
    ctx.moveTo(cx - 8, tamY - banKinh * 0.55)
    ctx.quadraticCurveTo(cx, tamY - banKinh * 0.9 - Math.sin(t * 8) * 5, cx + 8, tamY - banKinh * 0.55)
    ctx.fill()
  } else if (info.he === 'axit') {
    // Giọt axit sủi bọt
    ctx.fillStyle = 'rgb(192, 132, 252)'
    ctx.beginPath()
    ctx.arc(cx - 12, tamY - banKinh * 0.5 - Math.sin(t * 5) * 4, 5, 0, Math.PI * 2)
    ctx.arc(cx + 10, tamY - banKinh * 0.55 - Math.cos(t * 5) * 4, 3.5, 0, Math.PI * 2)
    ctx.fill()
  } else if (info.he === 'kiem') {
    // Tinh thể BaSO4 trên đầu
    ctx.fillStyle = 'rgb(56, 189, 248)'
    ctx.beginPath()
    ctx.moveTo(cx, tamY - banKinh * 0.85)
    ctx.lineTo(cx + 9, tamY - banKinh * 0.55)
    ctx.lineTo(cx, tamY - banKinh * 0.45)
    ctx.lineTo(cx - 9, tamY - banKinh * 0.55)
    ctx.closePath()
    ctx.fill()
  } else if (info.he === 'khi') {
    // Vòng mây khí lân tinh
    ctx.strokeStyle = 'rgb(134, 239, 172)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, tamY - banKinh * 0.6, 12, 0, Math.PI * 2)
    ctx.stroke()
  }

  // 6. MẮT CHIBI TO TRÒN LONG LANH
  const chopMat = Math.sin(t * 1.5) > 0.96
  const matX1 = cx - banKinh * 0.22
  const matX2 = cx + banKinh * 0.22
  const matY = tamY - banKinh * 0.08

  if (chopMat) {
    // Mắt nhắm cười híp
    ctx.strokeStyle = 'rgb(15, 23, 42)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(matX1, matY, 7, 0.2, Math.PI - 0.2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(matX2, matY, 7, 0.2, Math.PI - 0.2)
    ctx.stroke()
  } else {
    // Mắt mở tròn long lanh
    ctx.fillStyle = 'rgb(15, 23, 42)'
    ctx.beginPath()
    ctx.ellipse(matX1, matY, 9, 12, 0, 0, Math.PI * 2)
    ctx.ellipse(matX2, matY, 9, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    // Điểm sáng trong mắt (Sparkle)
    ctx.fillStyle = 'rgb(255, 255, 255)'
    ctx.beginPath()
    ctx.arc(matX1 - 3, matY - 4, 3.5, 0, Math.PI * 2)
    ctx.arc(matX2 - 3, matY - 4, 3.5, 0, Math.PI * 2)
    ctx.arc(matX1 + 3, matY + 3, 1.8, 0, Math.PI * 2)
    ctx.arc(matX2 + 3, matY + 3, 1.8, 0, Math.PI * 2)
    ctx.fill()
  }

  // Má hồng Chibi
  ctx.fillStyle = 'rgba(244, 63, 94, 0.45)'
  ctx.beginPath()
  ctx.arc(cx - banKinh * 0.35, tamY + banKinh * 0.05, 6, 0, Math.PI * 2)
  ctx.arc(cx + banKinh * 0.35, tamY + banKinh * 0.05, 6, 0, Math.PI * 2)
  ctx.fill()

  // Miệng cười nhỏ xinh
  ctx.strokeStyle = 'rgb(15, 23, 42)'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(cx, tamY + banKinh * 0.06, 5, 0.2, Math.PI - 0.2)
  ctx.stroke()

  // 7. CẤP 1 CÓ THÊM VỎ TRỨNG MẦM
  if (capTienHoa === 1) {
    ctx.fillStyle = 'rgb(248, 250, 252)'
    ctx.strokeStyle = 'rgb(203, 213, 225)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(cx, tamY + banKinh * 0.25, banKinh * 0.38, 0, Math.PI)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }

  // 8. VƯƠNG MIỆN / GIÁP PHÂN TỬ CẤP 3 TỐI THƯỢNG
  if (capTienHoa === 3) {
    ctx.save()
    ctx.fillStyle = 'rgb(250, 204, 21)'
    ctx.strokeStyle = 'rgb(217, 119, 6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(cx - 16, tamY - banKinh * 0.6)
    ctx.lineTo(cx - 20, tamY - banKinh * 0.85)
    ctx.lineTo(cx - 8, tamY - banKinh * 0.7)
    ctx.lineTo(cx, tamY - banKinh * 0.95)
    ctx.lineTo(cx + 8, tamY - banKinh * 0.7)
    ctx.lineTo(cx + 20, tamY - banKinh * 0.85)
    ctx.lineTo(cx + 16, tamY - banKinh * 0.6)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  ctx.restore()
}
