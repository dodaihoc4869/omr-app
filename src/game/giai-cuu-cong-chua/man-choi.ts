/**
 * SINH ĐẢO TỪ HẠT GIỐNG — 12 máy phải thấy ĐÚNG một hòn đảo.
 *
 * Cấm `Math.random` ở đây. Địa hình là hàm thuần của hạt giống; cùng hạt giống
 * thì cùng đảo, chạy lại bao nhiêu lần cũng vậy. Đó cũng là điều kiện để phép
 * kiểm bot chạy lại được.
 */
import { CAU_HINH } from './cau-hinh'

/** Bộ sinh số có hạt giống (mulberry32) — thuần, lặp lại được. */
export function boSinh(hat: number): () => number {
  let a = hat >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface Bac {
  x: number
  /** Mặt trên của bậc. */
  y: number
  rong: number
}

export interface Vuc {
  x1: number
  x2: number
}

export interface Dao {
  hat: number
  dai: number
  /** Mặt đất nền, y = 0. Các đoạn có vực thì không có nền. */
  vuc: Vuc[]
  bac: Bac[]
  /** x của cửa hang rồng. */
  xHang: number
  /** 12 chỗ thả người lúc bắt đầu. */
  choTha: number[]
}

const CAO_BAC = [120, 190, 260]

/**
 * Sinh đảo. Luật bố cục, cố ý đơn giản để đọc được:
 *  - 40 ô, mỗi ô 180 đơn vị
 *  - ô có vực thì vực rộng 90–150, và LUÔN có ít nhất một bậc bắc qua
 *  - không bao giờ hai vực liền nhau — nhảy đúp vẫn qua được mọi chỗ
 */
export function sinhDao(hat: number): Dao {
  const r = boSinh(hat)
  const dai = CAU_HINH.DAI_DAO
  const soO = 40
  const rongO = dai / soO
  const vuc: Vuc[] = []
  const bac: Bac[] = []
  let vucTruoc = false

  for (let i = 4; i < soO - 3; i++) {
    const x0 = i * rongO
    const coVuc = !vucTruoc && r() < 0.3
    if (coVuc) {
      const rongVuc = 90 + r() * 60
      const xv = x0 + (rongO - rongVuc) / 2
      vuc.push({ x1: xv, x2: xv + rongVuc })
      // bậc bắc qua vực — luôn có, nếu không thì vực thành bức tường
      bac.push({ x: xv + rongVuc / 2 - 60, y: CAO_BAC[0]!, rong: 120 })
      vucTruoc = true
    } else {
      vucTruoc = false
      const soBac = r() < 0.45 ? 1 : r() < 0.8 ? 2 : 0
      for (let k = 0; k < soBac; k++) {
        const cao = CAO_BAC[Math.floor(r() * CAO_BAC.length)]!
        const rong = 100 + r() * 110
        bac.push({ x: x0 + r() * (rongO - rong), y: cao, rong })
      }
    }
  }

  const choTha: number[] = []
  for (let i = 0; i < CAU_HINH.SO_NGUOI_TOI_DA; i++) {
    choTha.push(120 + i * 52)
  }

  return { hat, dai, vuc, bac, xHang: dai - 260, choTha }
}

/** Có đất ở toạ độ x không (không rơi vào vực). */
export function coDat(dao: Dao, x: number): boolean {
  if (x < 0 || x > dao.dai) return false
  for (const v of dao.vuc) if (x > v.x1 && x < v.x2) return false
  return true
}

/**
 * Mặt sàn ngay DƯỚI một điểm: trả về y của mặt đứng được, hoặc null nếu rơi xuống vực.
 * `yChan` là chân hiện tại; chỉ nhận sàn nằm không cao hơn chân.
 */
export function sanDuoi(dao: Dao, x: number, yChan: number): number | null {
  let tot: number | null = coDat(dao, x) ? 0 : null
  for (const b of dao.bac) {
    if (x < b.x || x > b.x + b.rong) continue
    if (b.y <= yChan + 1 && (tot === null || b.y > tot)) tot = b.y
  }
  return tot
}
