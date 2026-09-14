/**
 * QUÁI và HOA KHỔNG LỒ.
 *
 * Quái: đi tuần qua lại. CHẠM vào người là người đó mất một mạng — trừ khi người
 * đang khổng lồ, lúc đó ngược lại. Dẫm trúng đỉnh đầu quái thì quái chết: đó là
 * đúng động tác em đã dùng suốt ván, không bắt học thêm kỹ năng mới.
 *
 * Hoa: ăn vào thì khổng lồ 10 giây. Khổng lồ thì CHẠM ai người đó mất mạng, chạm
 * quái nào quái đó chết — không cần dẫm, không cần tra bảng hoá chất.
 *
 * Cấm `Math.random` ở đây: chỗ đặt quái và hoa phải suy ra được từ hạt giống,
 * nếu không thì 12 máy thấy 12 hòn đảo khác nhau và phép kiểm không lặp lại được.
 */
import { CAU_HINH } from './cau-hinh'
import { coDat, sanDuoi, type Dao } from './man-choi'
import type { DoKho } from './do-kho'

export interface Quai {
  x: number
  y: number
  /** Mốc đi tuần. */
  x1: number
  x2: number
  huong: 1 | -1
  tocDo: number
  song: boolean
  /** Kiểu vẽ: 0 tròn có sừng · 1 dẹt nhiều chân · 2 nhọn. */
  kieu: number
}

export interface Hoa {
  x: number
  y: number
  conDo: boolean
}

export const CAO_QUAI = 64
export const RONG_QUAI = 58
export const BAN_KINH_HOA = 26

export function sinhQuai(dao: Dao, doKho: DoKho, r: () => number): Quai[] {
  const ds: Quai[] = []
  // rải đều dọc đảo, tránh 700 đơn vị đầu để em kịp đứng dậy
  const dau = 700, cuoi = dao.xHang - 120
  for (let i = 0; i < doKho.soQuai; i++) {
    const giua = dau + ((cuoi - dau) * (i + 0.5)) / doKho.soQuai + (r() - 0.5) * 90
    const nua = 90 + r() * 130
    let x1 = giua - nua, x2 = giua + nua
    // kéo mốc tuần về vùng có đất, để quái không đi thẳng xuống vực
    while (x1 < x2 - 40 && !coDat(dao, x1)) x1 += 20
    while (x2 > x1 + 40 && !coDat(dao, x2)) x2 -= 20
    if (x2 - x1 < 60 || !coDat(dao, giua)) continue
    ds.push({
      x: giua, y: 0, x1, x2,
      huong: r() < 0.5 ? 1 : -1,
      tocDo: doKho.tocDoQuai * (0.85 + r() * 0.3),
      song: true,
      kieu: Math.floor(r() * 3),
    })
  }
  return ds
}

export function sinhHoa(dao: Dao, doKho: DoKho, r: () => number): Hoa[] {
  const ds: Hoa[] = []
  const bac = [...dao.bac]
  for (let i = 0; i < doKho.soHoa; i++) {
    // ưu tiên đặt trên bậc cao: muốn khổng lồ thì phải leo, không nhặt dọc đường
    if (bac.length > 0 && r() < 0.7) {
      const j = Math.floor(r() * bac.length)
      const b = bac.splice(j, 1)[0]!
      ds.push({ x: b.x + b.rong / 2, y: b.y + 34, conDo: true })
    } else {
      const x = 800 + r() * Math.max(1, dao.xHang - 900)
      if (!coDat(dao, x)) continue
      ds.push({ x, y: (sanDuoi(dao, x, 999) ?? 0) + 34, conDo: true })
    }
  }
  return ds
}

/** Quái đi tuần. Chạm mép thì quay đầu. */
export function buocQuai(q: Quai, dao: Dao, dt: number): void {
  if (!q.song) return
  q.x += q.huong * q.tocDo * dt
  if (q.x <= q.x1) { q.x = q.x1; q.huong = 1 }
  if (q.x >= q.x2) { q.x = q.x2; q.huong = -1 }
  const san = sanDuoi(dao, q.x, q.y + 4)
  q.y = san ?? q.y
}

/** Hai khối chữ nhật có chạm nhau không. */
export function chongNhau(
  ax: number, ay: number, aw: number, ah: number,
  bx: number, by: number, bw: number, bh: number,
): boolean {
  return Math.abs(ax - bx) < (aw + bw) / 2 && ay < by + bh && by < ay + ah
}

/** Dẫm trúng đỉnh đầu quái? Cùng ba điều kiện như dẫm người. */
export function damTrungQuai(
  nx: number, ny: number, nvy: number, nRong: number, q: Quai,
): boolean {
  if (!q.song) return false
  if (nvy > -CAU_HINH.TOC_DO_ROI_TOI_THIEU) return false
  if (Math.abs(nx - q.x) >= (nRong + RONG_QUAI) / 2) return false
  const dinh = q.y + CAO_QUAI
  return ny >= dinh - CAU_HINH.CAO_VUNG_DAU && ny <= dinh + CAU_HINH.CAO_VUNG_DAU
}
