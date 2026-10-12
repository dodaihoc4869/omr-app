// MẪU ĐẦU VÀO cho `tinhThaiDo` (hồ sơ thái độ) — dùng chung cho tests/thai-do-tin-cay-dot16-1210i.test.ts và cho bước chụp nhãn từ bản GỐC (trước
// đợt 16) để khoá "nhãn không đổi". Thuần, tất định (bộ sinh số giả mulberry32 theo `seed`). Không mã câu thật, không tên em.
import type { NgayBaiEm } from '../server/src/bai-hang-ngay-kieu'
import type { LuotThaiDo } from '../server/src/bai-hang-ngay'

export interface MauThaiDo {
  ngay: NgayBaiEm[]
  luot: LuotThaiDo[]
  cauDaLam: Set<string>
  cauHoTro: Set<string>
  den: string
}

/** mulberry32 — tất định theo `seed`. */
export function sinhSo(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const ngayThu = (i: number): string => `2026-10-${String(i + 1).padStart(2, '0')}`
export const lucVn = (ngay: string, gio: number, phut: number): string =>
  new Date(Date.parse(`${ngay}T00:00:00+07:00`) + (gio * 60 + phut) * 60_000).toISOString()

/** Một ngày kế hoạch: mức `muc`, đã làm `lam`. */
export function motNgay(i: number, muc: number, lam: number, homNay = false): NgayBaiEm {
  return {
    ngay: ngayThu(i), mucToiThieu: muc, daLam: lam, thieu: Math.max(0, muc - lam), datMuc: lam >= muc, mucUocTinh: false, nguonMuc: 'da-chot',
    tang: 1, cheDo: 'goi7', homNay,
  }
}

/**
 * Dãy ngày theo mã: 'd' đủ mức · 'k' không làm câu nào · 't' làm thiếu (1 câu). Mức 4 câu/ngày. `homNayCuoi` ⇒ ngày cuối là hôm nay.
 * Lượt: mỗi câu đã làm một lượt 10:00 + i phút, 40 giây, đúng xen kẽ, chọn xoay A–D (không chuỗi lặp) — mọi tín hiệu khác trong ngưỡng.
 */
export function mauTheoMa(ma: string, homNayCuoi = false): MauThaiDo {
  const ky = ma.replace(/\s+/g, '').split('')
  const ngay = ky.map((c, i) => motNgay(i, 4, c === 'd' ? 4 : c === 't' ? 1 : 0, homNayCuoi && i === ky.length - 1))
  const luot: LuotThaiDo[] = []
  ngay.forEach((n, i) => {
    for (let j = 0; j < n.daLam; j++) {
      luot.push({ luc: lucVn(n.ngay, 10, j), ngay: n.ngay, goc: `Q${i}-${j}`, dung: (i + j) % 2 === 0, giay: 40, loai: 'trac-nghiem', chon: 'ABCD'[(i + j) % 4]! })
    }
  })
  return { ngay, luot, cauDaLam: new Set(luot.map((l) => l.goc)), cauHoTro: new Set(), den: ngay[ngay.length - 1]!.ngay }
}

/** Mẫu ngẫu nhiên phủ mọi nhánh luật (đủ mức, bỏ ngày, quá nhanh, dồn khuya, gợi ý, chọn lặp, độ đúng giảm). */
export function mauNgauNhien(seed: number): MauThaiDo {
  const r = sinhSo(seed)
  const soNgay = 2 + Math.floor(r() * 19) // 2–20 ngày
  const pDu = r(), pBo = r() * 0.6
  const coHomNay = r() < 0.5
  const pNhanh = r() * 0.6, pDungNhanh = r(), pDung = 0.3 + 0.6 * r(), pKhuya = r() * 0.8, pGoiY = r() * 0.7
  const cheDoLap = r() < 0.25, giamCuoi = r() < 0.4 ? r() * 0.5 : 0
  const ngay: NgayBaiEm[] = []
  const luot: LuotThaiDo[] = []
  const cauHoTro = new Set<string>()
  for (let i = 0; i < soNgay; i++) {
    const muc = 2 + Math.floor(r() * 6)
    const u = r()
    const lam = u < pDu ? muc + Math.floor(r() * 3) : u < pDu + pBo * (1 - pDu) ? 0 : 1 + Math.floor(r() * (muc - 1))
    const n = motNgay(i, muc, lam, coHomNay && i === soNgay - 1)
    ngay.push(n)
    const muon = i >= soNgay - 7 // 7 ngày cuối: độ đúng có thể giảm
    let chuLap = 'ABCD'[Math.floor(r() * 4)]!
    for (let j = 0; j < lam; j++) {
      const tuTinh = r() < 0.2
      const nhanh = r() < pNhanh
      const giay = r() < 0.05 ? null : nhanh ? 2 + Math.floor(r() * (tuTinh ? 12 : 6)) : 15 + Math.floor(r() * 120)
      const khuya = r() < pKhuya
      const gio = khuya ? (r() < 0.5 ? 23 : Math.floor(r() * 5)) : 8 + Math.floor(r() * 14)
      const pD = (nhanh ? pDungNhanh : pDung) - (muon ? giamCuoi : 0)
      const dung = r() < 0.05 ? null : r() < pD
      if (cheDoLap && r() < 0.15) chuLap = 'ABCD'[Math.floor(r() * 4)]!
      const chon = tuTinh ? null : cheDoLap ? chuLap : 'ABCD'[Math.floor(r() * 4)]!
      const goc = `Q${i}-${j}`
      luot.push({ luc: lucVn(n.ngay, gio, j), ngay: n.ngay, goc, dung, giay, loai: tuTinh ? 'tu-tinh' : 'trac-nghiem', chon })
      if (r() < pGoiY) cauHoTro.add(goc)
    }
  }
  return { ngay, luot, cauDaLam: new Set(luot.map((l) => l.goc)), cauHoTro, den: ngay[ngay.length - 1]!.ngay }
}

/** Số mẫu ngẫu nhiên khoá nhãn (seed 1 … SO_MAU). */
export const SO_MAU = 400
