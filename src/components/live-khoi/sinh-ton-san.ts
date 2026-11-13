// SÂN «TRANG VỞ» của trò «Sinh Tồn» bản 2 (thầy duyệt 13/11: docs/ban-ve-sinh-ton-v2-1311/01-tran-844.jpg, 20-san-tu-lon-theo-si-so-1366.jpg).
// Cả sân là các trang vở ô li 1600 × 1000 ghép `ngang × doc` (lõi: BanDo.ngang / doc) trên nền Duolingo tối: lề đỏ đôi, gáy vở khâu chỉ giữa mỗi trang,
// công thức Hoá viết chì mờ ở mép trang, vòng benzen + bình tam giác bên lề, trại bốn đội vòng chì + tên.
// NHẸ (tác tử tốc độ 13/11): nền = MỘT ô mẫu 256 × 256 lặp, vùng ngoài vòng an toàn = ô mẫu gạch chéo 24 × 24 — cả hai NƯỚNG ĐÚNG CỠ ĐIỂM ẢNH THIẾT BỊ
// và tô bằng phép dời nguyên điểm ảnh (trình duyệt không phải co giãn mẫu mỗi khung; co giãn thì chỉ còn 24 khung / giây ở CPU ×4). Muốn vậy tỉ lệ
// sân phải làm tròn để 256 · ti · dpr là số nguyên (`lamTronTi`). Công thức / hình vẽ chơi / tên trại là ẢNH NƯỚNG SẴN (BoHinh.chu…), không vẽ chữ mỗi khung.
import type { BanDo } from '../../lib/live-khoi/sinh-ton-loi'
import { dat, mau, type BangMau, type BoHinh } from './sinh-ton-hinh'

/** Cạnh ô mẫu nền (đơn vị sân). */
export const O_MAU = 256
const O_GACH = 24
/** Tỉ lệ sân làm tròn sao cho ô mẫu 256 đơn vị = SỐ NGUYÊN điểm ảnh thiết bị (ô mẫu không phải co giãn lúc tô). */
export function lamTronTi(ti: number, dpr: number): number {
  const n = Math.max(16, Math.round(O_MAU * ti * dpr))
  return n / (O_MAU * dpr)
}

export interface BoSan { nen: CanvasPattern | null; gach: CanvasPattern | null }
/** Hai ô mẫu theo hệ số `k` = ti · dpr (đã làm tròn bằng `lamTronTi`). */
export function taoBoSan(g: CanvasRenderingContext2D, b: BangMau, k: number): BoSan {
  const oNen = document.createElement('canvas'), n = Math.round(O_MAU * k)
  oNen.width = oNen.height = n
  const gn = oNen.getContext('2d')
  if (gn) {
    gn.scale(n / O_MAU, n / O_MAU)
    gn.fillStyle = mau(b.giay); gn.fillRect(0, 0, O_MAU, O_MAU)
    gn.beginPath(); for (let v = 32; v <= O_MAU; v += 32) { gn.moveTo(0, v - 0.5); gn.lineTo(O_MAU, v - 0.5); gn.moveTo(v - 0.5, 0); gn.lineTo(v - 0.5, O_MAU) }
    gn.strokeStyle = mau(b.ke); gn.lineWidth = 1; gn.stroke()
  }
  const oGach = document.createElement('canvas'), m = Math.max(4, Math.round(O_GACH * k))
  oGach.width = oGach.height = m
  const gg = oGach.getContext('2d')
  if (gg) {
    gg.scale(m / O_GACH, m / O_GACH)
    gg.fillStyle = mau(b.bong, 0.3); gg.fillRect(0, 0, O_GACH, O_GACH)
    gg.beginPath(); gg.moveTo(-2, O_GACH + 2); gg.lineTo(O_GACH + 2, -2); gg.moveTo(-2, 2); gg.lineTo(2, -2); gg.moveTo(O_GACH - 2, O_GACH + 2); gg.lineTo(O_GACH + 2, O_GACH - 2)
    gg.strokeStyle = mau(b.sai, 0.4); gg.lineWidth = 1.6; gg.stroke()
  }
  return { nen: gn ? g.createPattern(oNen, 'repeat') : null, gach: gg ? g.createPattern(oGach, 'repeat') : null }
}

/** Năm công thức đã soát (đặc tả mục «Hướng mỹ thuật»): vị trí theo phần của trang + chữ. Giữ đúng chỉ số dưới. */
export const CONG_THUC: readonly (readonly [number, number, string])[] = [
  [0.085, 0.045, '2Na + 2H₂O → 2NaOH + H₂↑'], [0.6, 0.045, '2K + 2H₂O → 2KOH + H₂↑'], [0.085, 0.975, 'Cu + 2AgNO₃ → Cu(NO₃)₂ + 2Ag'],
  [0.6, 0.975, 'Ca + 2H₂O → Ca(OH)₂ + H₂↑'], [0.32, 0.975, 'CaCO₃ → CaO + CO₂↑ (t°)'],
]
const TEN_TRAI = ['Trại Đội Natri', 'Trại Đội Kali', 'Trại Đội Đồng', 'Trại Đội Canxi']

/** Vẽ phần TRANG (lề, gáy, viền trang, công thức, hình vẽ chơi, trại) trong hệ toạ độ sân; chỉ thứ lọt khung nhìn [x0, x1] × [y0, y1]. */
export function veTrang(g: CanvasRenderingContext2D, b: BangMau, h: BoHinh, bd: BanDo, x0: number, y0: number, x1: number, y1: number): void {
  const khuW = bd.rong / Math.max(1, bd.ngang), khuH = bd.cao / Math.max(1, bd.doc)
  const ya = Math.max(0, y0), yb = Math.min(bd.cao, y1)
  // lề đỏ đôi (mỗi nửa trang một lề)
  g.beginPath()
  for (let kx = 0; kx < bd.rong; kx += khuW) for (const t of [0.06, 0.56]) { const x = kx + khuW * t; if (x > x0 - 10 && x < x1 + 10) { g.moveTo(x, ya); g.lineTo(x, yb); g.moveTo(x + 5, ya); g.lineTo(x + 5, yb) } }
  g.strokeStyle = mau(b.le, 0.85); g.lineWidth = 1.4; g.stroke()
  // gáy vở khâu chỉ giữa mỗi trang
  for (let kx = 0; kx < bd.rong; kx += khuW) {
    const x = kx + khuW / 2
    if (x < x0 - 40 || x > x1 + 40) continue
    g.fillStyle = mau(b.bong, b.bongA * 0.55); g.fillRect(x - 14, ya, 28, yb - ya)
    g.fillStyle = mau(b.bong, b.bongA * 0.7); g.fillRect(x - 4, ya, 8, yb - ya)
    g.beginPath(); for (let ky = 0; ky < bd.cao; ky += khuH) for (let y = ky + 60; y < ky + khuH - 40; y += 90) if (y > y0 - 30 && y < y1 + 20) { g.moveTo(x - 3, y); g.lineTo(x + 3, y + 22) }
    g.strokeStyle = mau(b.muc, 0.45); g.lineWidth = 2; g.stroke()
  }
  g.strokeStyle = mau(b.muc, 0.35); g.lineWidth = 2; g.strokeRect(0, 0, bd.rong, bd.cao)
  // công thức viết chì mờ + hình vẽ chơi (ảnh nướng sẵn)
  for (let kx = 0; kx < bd.rong; kx += khuW) for (let ky = 0; ky < bd.cao; ky += khuH) {
    for (const [fx, fy, s] of CONG_THUC) {
      const x = kx + fx * khuW, y = ky + fy * khuH
      if (x > x0 - 320 && x < x1 + 10 && y > y0 - 10 && y < y1 + 30) dat(g, h.chu(s, 20, b.muc, 0.16, false, false), x, y)
    }
    const bx = kx + khuW * 0.47, by = ky + khuH * 0.13, fx = kx + khuW * 0.53, fy = ky + khuH * 0.86
    if (bx > x0 - 40 && bx < x1 + 40 && by > y0 - 40 && by < y1 + 40) dat(g, h.benzen(), bx, by)
    if (fx > x0 - 40 && fx < x1 + 40 && fy > y0 - 50 && fy < y1 + 40) dat(g, h.binh(), fx, fy)
  }
  // trại bốn đội: vòng chì nét đứt + tên
  for (let i = 0; i < 4; i++) {
    const t = bd.trai[i], c = b.doi[i]
    if (!c || t.x < x0 - 130 || t.x > x1 + 130 || t.y < y0 - 130 || t.y > y1 + 130) continue
    g.beginPath(); g.ellipse(t.x, t.y, 92, 64, 0, 0, Math.PI * 2); g.fillStyle = mau(c, 0.09); g.fill()
    g.setLineDash([3, 5]); g.strokeStyle = mau(c, 0.75); g.lineWidth = 2.2; g.stroke(); g.setLineDash([])
    dat(g, h.chu(TEN_TRAI[i], 19, c, 0.9), t.x, t.y + (t.y < bd.cao / 2 ? 86 : -76))
  }
}
