// Đồ dùng chung cho tests/omni-3-loi*.test.ts (KHÔNG phải tệp test): PRNG tất định, kho của mô phỏng tham chiếu, dựng hồ sơ/sự kiện.
// Kho chép đúng `taoKho` của docs/omni-0510/mo-phong-chac-8.mjs (9 dạng × 4 vi kỹ năng; 60 câu I + 32 câu III cần 2 vi kỹ năng cùng dạng;
// 20 câu Đúng–sai mỗi ý cần 1 vi kỹ năng) để số của lõi thuần so được với số của mô phỏng.
import type { HoSoOmniEm, HoSoVkn, QCau, SuKienOmni } from '../server/src/omni-kieu'
import { CAC_KHUNG_GIO, PHIEN_BAN_OMNI } from '../server/src/omni-kieu'

export function mulberry32(a: number): () => number {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const SO_DANG = 9
export const KN_MOI_DANG = 4
export const SO_KN = SO_DANG * KN_MOI_DANG
export const tenKn = (k: number): string => `k${k}`
export const TAT_CA_KN: readonly string[] = Array.from({ length: SO_KN }, (_, k) => tenKn(k))

/** Kho của mô phỏng (cùng thứ tự gọi PRNG với `taoKho`): qid I1..I60, III1..III32, II1..II20. */
export function taoKhoMoPhong(rng: () => number): QCau[] {
  const kho: QCau[] = []
  const them = (phan: 'I' | 'III', n: number): void => {
    for (let i = 0; i < n; i++) {
      const d = i % SO_DANG
      const a = d * KN_MOI_DANG + Math.floor(rng() * KN_MOI_DANG)
      let b = d * KN_MOI_DANG + Math.floor(rng() * KN_MOI_DANG)
      if (b === a) b = d * KN_MOI_DANG + ((a - d * KN_MOI_DANG + 1) % KN_MOI_DANG)
      kho.push({ qid: `${phan}${i + 1}`, phan, maDang: `d${d}`, mucDo: null, vkn: [tenKn(a), tenKn(b)], nguon: 'thay' })
    }
  }
  them('I', 60)
  them('III', 32)
  for (let i = 0; i < 20; i++) {
    const d = i % SO_DANG
    const y = [0, 1, 2, 3].map(() => d * KN_MOI_DANG + Math.floor(rng() * KN_MOI_DANG))
    kho.push({ qid: `II${i + 1}`, phan: 'II', maDang: `d${d}`, mucDo: null, vkn: [...new Set(y.map(tenKn))], vknY: y.map((k) => [tenKn(k)]), nguon: 'thay' })
  }
  return kho
}
/** Kho chuẩn của mô phỏng (hạt giống 20261005). */
export const KHO_MO_PHONG: readonly QCau[] = taoKhoMoPhong(mulberry32(20261005))

/** Một dòng hồ sơ vi kỹ năng với P cho trước (các số đếm mặc định 0 — ghi đè bằng `them`). */
export function vknHs(vkn: string, p: number, them: Partial<HoSoVkn> = {}): HoSoVkn {
  return { vkn, p, nTuLam: 0, nCau: 0, nNgay: 0, nTroiChay: 0, nCauLaDung: 0, diemSprt: 0, trangThai: 'chua_du', ngayCuoi: null, dayLai: false, ...them }
}
/** Hồ sơ em dựng tay từ bảng P (để thử dự báo / chứng chỉ / kế hoạch). */
export function hoSoTuP(P: Readonly<Record<string, number>>, sEm = 0.08, them: Partial<HoSoOmniEm> = {}): HoSoOmniEm {
  const vkn: Record<string, HoSoVkn> = {}
  for (const [k, p] of Object.entries(P)) vkn[k] = vknHs(k, p)
  return {
    sbd: 'T1', vkn, sEm, nVung: 0, nSaiVung: 0, tau: 0, nTau: 0,
    khungGio: Object.fromEntries(CAC_KHUNG_GIO.map((k) => [k, { n: 0, soY: 0 }])) as HoSoOmniEm['khungGio'],
    luotHomNay: 0, cursor: '', phienBan: PHIEN_BAN_OMNI, ...them,
  }
}
export const moiKnBang = (p: number): Record<string, number> => Object.fromEntries(TAT_CA_KN.map((k) => [k, p]))

/** Mốc ms của giờ VN `gio` ngày `ngay` (YYYY-MM-DD). */
export const msVn = (ngay: string, gio: number, phut = 0): number => Date.parse(`${ngay}T00:00:00Z`) + (gio - 7) * 3_600_000 + phut * 60_000

let dem = 0
/** Một sự kiện sổ đã chuẩn hoá (mặc định: tự làm, Phần I, đúng, 10 giờ VN ngày 2026-10-05). */
export function sk(qid: string, them: Partial<SuKienOmni> & { gio?: number; phut?: number } = {}): SuKienOmni {
  const { gio = 10, phut = 0, ...r } = them
  const ngayVn = r.ngayVn ?? '2026-10-05'
  const receivedAt = r.receivedAt ?? msVn(ngayVn, gio, phut)
  dem++
  return {
    khoa: r.khoa ?? `k${String(receivedAt).padStart(14, '0')}-${qid}-${dem}`, sbd: 'T1', qid, songSinh: false, nguon: 'luyen', ketQua: 1,
    luc: new Date(receivedAt).toISOString(), ngayVn, receivedAt, assistance: 'none', purpose: null, phan: 'I', maDang: 'D', mucDo: null,
    ...r,
  }
}
