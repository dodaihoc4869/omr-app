// PHÂN BỔ ZPD CHIẾN DỊCH — lõi thuần, tất định, không IO/đồng hồ/ngẫu nhiên.
// Module giữ hợp đồng ma trận 3 mức để xem trước, đồng thời có bộ chọn 4 mức cho luồng chiến dịch thật.
import { BTVN_NANG_DO } from './btvn-nang-do'
import { MA_TRAN_HOA_2026 } from './ma-tran-hoa-2026'
import {
  MUC_MA_TRAN, chiaPhanDuLonNhat, phanBoMaTran2026, type PhanBoMaTran,
} from './rut-de-da-dung'
import { PHAN_V2 } from './rut-de-v2'

export type BacCau = 0 | 1 | 2
export type BacCauChienDich = 0 | 1 | 2 | 3

export const PHAN_BO_BAC = Object.freeze({
  W_LOI: 0.6,
  W_CUNG_CO_GOC: 0.3,
  W_CUNG_CO_TRUOT: 0.3,
  W_THU_THACH_GOC: 0.1,
  W_THU_THACH_TRUOT: 0.3,
  W_THU_THACH_TOI_DA: 0.35,
  TRAN_THU_THACH: BTVN_NANG_DO.TL_THU_THACH_TOI_DA,
  ALPHA_MAC_DINH: 0.35,
  SO_CAU_DU_TIN: BTVN_NANG_DO.SO_CAU_DU_TIN_DANG,
  SO_CAU_TIN_DAY_DU: 8,
})

const kep01 = (x: number): number => Number.isFinite(x) ? Math.max(0, Math.min(1, x)) : 0

/** Ba dải quanh bậc đích. Biên 0/2 (hoặc 3 ở chiến dịch) tự bỏ dải không tồn tại. */
export function trongSoTheoBac(T: BacCau, v: number): { bac: number; w: number }[]
export function trongSoTheoBac(T: BacCauChienDich, v: number, bacToiDa: 3): { bac: number; w: number }[]
export function trongSoTheoBac(T: BacCauChienDich, v: number, bacToiDa: 2 | 3 = 2): { bac: number; w: number }[] {
  const vv = kep01(v)
  return [
    { bac: T - 1, w: Math.max(0, PHAN_BO_BAC.W_CUNG_CO_GOC - PHAN_BO_BAC.W_CUNG_CO_TRUOT * vv) },
    { bac: T, w: PHAN_BO_BAC.W_LOI },
    { bac: T + 1, w: Math.min(PHAN_BO_BAC.W_THU_THACH_TOI_DA, PHAN_BO_BAC.W_THU_THACH_GOC + PHAN_BO_BAC.W_THU_THACH_TRUOT * vv) },
  ].filter((x) => x.bac >= 0 && x.bac <= bacToiDa && x.w > 0)
}

/** Dưới 4 mẫu: chỉ dùng phân bổ nền; từ 4 tới 8 mẫu tăng dần ảnh hưởng hồ sơ. */
export function doTinHoSo(soGap: number): number {
  const n = Math.max(0, Number(soGap) || 0)
  if (n < PHAN_BO_BAC.SO_CAU_DU_TIN) return 0
  return Math.min(1, (n - PHAN_BO_BAC.SO_CAU_DU_TIN + 1) / (PHAN_BO_BAC.SO_CAU_TIN_DAY_DU - PHAN_BO_BAC.SO_CAU_DU_TIN + 1))
}

export interface HoSoBacDich {
  bacDich: BacCau
  tiLeKhacPhuc: number | null
  soGap: number
}

export interface DauVaoPhanBo {
  n: number
  hoSoTheoDang: Record<string, HoSoBacDich>
  dangTheoPhan: Record<string, { phan: 'I' | 'II' | 'III' }>
  alpha?: number
}

const tong = (xs: readonly number[]): number => xs.reduce((s, x) => s + x, 0)
const chuanHoa = (xs: readonly number[]): number[] => {
  const s = tong(xs.map((x) => Math.max(0, x)))
  return s > 0 ? xs.map((x) => Math.max(0, x) / s) : xs.map(() => 0)
}

/**
 * Bản xem trước theo ma trận 2026. Thiếu hồ sơ hoặc alpha=1 trả đúng tuyệt đối phân bổ cũ.
 * Trần thử thách được áp ở bộ chọn thật theo quan hệ T+1 của từng dạng; không đồng nhất nhầm "Vận dụng" với T+1.
 */
export function phanBoTheoBacHocSinh(dv: DauVaoPhanBo): PhanBoMaTran {
  const n = Math.max(0, Math.floor(Number(dv.n) || 0))
  const hs = Object.entries(dv.hoSoTheoDang)
  const alpha = kep01(dv.alpha ?? PHAN_BO_BAC.ALPHA_MAC_DINH)
  if (n === 0 || hs.length === 0 || alpha === 1) return phanBoMaTran2026(n)

  const nen = phanBoMaTran2026(n)
  const ra = {} as PhanBoMaTran
  for (const phan of PHAN_V2) {
    const nP = MUC_MA_TRAN.reduce((s, m) => s + nen[phan][m], 0)
    const dang = hs.filter(([ma]) => dv.dangTheoPhan[ma]?.phan === phan)
    if (!dang.length) { ra[phan] = { ...nen[phan] }; continue }
    const wEm = [0, 0, 0]
    for (const [, h] of dang) {
      const tin = doTinHoSo(h.soGap)
      const aHieuLuc = 1 - tin * (1 - alpha)
      const caNhan = [0, 0, 0]
      for (const x of trongSoTheoBac(h.bacDich, h.tiLeKhacPhuc ?? 0)) caNhan[x.bac] = x.w
      const pEm = chuanHoa(caNhan)
      const pNen = chuanHoa(MUC_MA_TRAN.map((m) => MA_TRAN_HOA_2026[phan][m]))
      for (let i = 0; i < 3; i++) wEm[i]! += (1 - aHieuLuc) * pEm[i]! + aHieuLuc * pNen[i]!
    }
    const so = chiaPhanDuLonNhat(nP, wEm)
    ra[phan] = { biet: so[0]!, hieu: so[1]!, van_dung: so[2]! }
  }
  return ra
}

export interface HoSoZpdDang {
  bacDich: BacCauChienDich
  tiLeKhacPhuc: number | null
  soGap: number
}

export interface CauZpd {
  qid: string
  phan: 'I' | 'II' | 'III'
  dang: string | null
  bac: BacCauChienDich
}

export interface TomTatZpd {
  tong: number
  theoBac: [number, number, number, number]
  thuThach: number
  alpha: number
  coHoSoDuTin: boolean
}

/** Chia nguyên theo trọng số nhưng không vượt sức chứa; phần thiếu được bù tất định vào ô còn chỗ. */
export function chiaTheoTrongSoCoTran(n: number, trongSo: readonly number[], sucChua: readonly number[]): number[] {
  const ra = trongSo.map(() => 0)
  let con = Math.min(Math.max(0, Math.floor(n)), sucChua.reduce((s, x) => s + Math.max(0, Math.floor(x)), 0))
  while (con > 0) {
    const mo = trongSo.map((w, i) => ra[i]! < Math.max(0, Math.floor(sucChua[i]!)) ? Math.max(0, w) : 0)
    const w = mo.some((x) => x > 0) ? mo : mo.map((_, i) => ra[i]! < Math.max(0, Math.floor(sucChua[i]!)) ? 1 : 0)
    const them = chiaPhanDuLonNhat(con, w).map((x, i) => Math.min(x, Math.max(0, Math.floor(sucChua[i]!)) - ra[i]!))
    let da = tong(them)
    if (da === 0) {
      const i = ra.findIndex((x, j) => x < Math.max(0, Math.floor(sucChua[j]!)))
      if (i < 0) break
      them[i] = 1
      da = 1
    }
    them.forEach((x, i) => { ra[i]! += x })
    con -= da
  }
  return ra
}

/**
 * Chọn đúng `soLay` câu mới theo ZPD trên kho thật (4 bậc). Tỷ lệ Phần I/II/III lấy từ chính kho còn lại,
 * dạng/mức thiếu tự bù sang ô còn sức chứa; câu T+1 bị chặn trên toàn lô ở ceil(20%).
 */
export function xepCauMoiTheoZpd<T extends CauZpd>(
  cau: readonly T[],
  soLay: number,
  hoSoTheoDang: Readonly<Record<string, HoSoZpdDang>>,
  alpha = PHAN_BO_BAC.ALPHA_MAC_DINH,
): { thuTu: T[]; tomTat: TomTatZpd } {
  const n = Math.min(cau.length, Math.max(0, Math.floor(soLay)))
  const a = kep01(alpha)
  const coHoSoDuTin = Object.values(hoSoTheoDang).some((h) => doTinHoSo(h.soGap) > 0)
  if (n === 0 || !coHoSoDuTin) {
    const chon = cau.slice(0, n)
    const theoBac = [0, 0, 0, 0] as [number, number, number, number]
    chon.forEach((c) => { theoBac[c.bac]++ })
    return { thuTu: [...cau], tomTat: { tong: n, theoBac, thuThach: 0, alpha: a, coHoSoDuTin } }
  }

  type O = { cau: T[]; w: number; thuThach: boolean; phan: T['phan'] }
  const viTri = new Map(cau.map((c, i) => [c.qid, i]))
  const theoPhan = PHAN_V2.map((p) => cau.filter((c) => c.phan === p))
  const nPhan = chiaTheoTrongSoCoTran(n, theoPhan.map((x) => x.length), theoPhan.map((x) => x.length))
  const daChon = new Set<string>()
  const oDaChon: { o: O; n: number }[] = []

  PHAN_V2.forEach((phan, ip) => {
    const ds = theoPhan[ip]!
    const theoDang = new Map<string, T[]>()
    ds.forEach((c) => { const d = c.dang ?? ''; theoDang.set(d, [...(theoDang.get(d) ?? []), c]) })
    const o: O[] = []
    for (const [dang, cs] of theoDang) {
      const h = hoSoTheoDang[dang]
      const T0 = h?.bacDich ?? 1
      const tin = h ? doTinHoSo(h.soGap) : 0
      const aHieuLuc = 1 - tin * (1 - a)
      const caNhan = [0, 0, 0, 0]
      if (h) for (const x of trongSoTheoBac(T0, h.tiLeKhacPhuc ?? 0, 3)) caNhan[x.bac] = x.w
      const pEm = chuanHoa(caNhan)
      const demBac = [0, 0, 0, 0]
      cs.forEach((c) => { demBac[c.bac]++ })
      const pNen = chuanHoa(demBac)
      for (let bac = 0 as BacCauChienDich; bac <= 3; bac = (bac + 1) as BacCauChienDich) {
        const trongO = cs.filter((c) => c.bac === bac)
        if (!trongO.length || bac > T0 + 1) continue
        const tiLeDang = cs.length / Math.max(1, ds.length)
        o.push({ cau: trongO, w: tiLeDang * ((1 - aHieuLuc) * pEm[bac]! + aHieuLuc * pNen[bac]!), thuThach: bac === T0 + 1, phan })
      }
    }
    const so = chiaTheoTrongSoCoTran(nPhan[ip]!, o.map((x) => x.w), o.map((x) => x.cau.length))
    o.forEach((x, i) => oDaChon.push({ o: x, n: so[i]! }))
  })

  // Trần là số câu THỰC SỰ ở T+1, không phải toàn bộ câu Vận dụng/VDC.
  const tranThuThach = Math.ceil(PHAN_BO_BAC.TRAN_THU_THACH * n)
  let tongThuThach = oDaChon.reduce((s, x) => s + (x.o.thuThach ? x.n : 0), 0)
  if (tongThuThach > tranThuThach) {
    let canDoi = tongThuThach - tranThuThach
    for (const x of [...oDaChon].filter((x) => x.o.thuThach).reverse()) {
      const bot = Math.min(canDoi, x.n)
      x.n -= bot
      canDoi -= bot
      if (canDoi === 0) break
    }
    // Ưu tiên bù cùng phần; sau đó mới sang phần khác. Điểm cao trước, hoà theo vị trí kho.
    let thieu = n - oDaChon.reduce((s, x) => s + x.n, 0)
    const ung = [...oDaChon].filter((x) => !x.o.thuThach && x.n < x.o.cau.length)
      .sort((x, y) => y.o.w - x.o.w || (viTri.get(x.o.cau[0]!.qid)! - viTri.get(y.o.cau[0]!.qid)!))
    while (thieu > 0) {
      let da = false
      for (const x of ung) if (x.n < x.o.cau.length && thieu > 0) { x.n++; thieu--; da = true }
      if (!da) break
    }
    tongThuThach = oDaChon.reduce((s, x) => s + (x.o.thuThach ? x.n : 0), 0)
  }

  oDaChon.forEach(({ o, n: so }) => o.cau.slice(0, so).forEach((c) => daChon.add(c.qid)))
  // Phòng thủ kho cực lệch: vẫn đủ n bằng câu hợp lệ gần nhất trong thứ tự nền.
  for (const c of cau) {
    if (daChon.size >= n) break
    const h = hoSoTheoDang[c.dang ?? '']
    if (!h || c.bac <= h.bacDich + 1) daChon.add(c.qid)
  }
  const chon = cau.filter((c) => daChon.has(c.qid)).slice(0, n)
  const chonSet = new Set(chon.map((c) => c.qid))
  const theoBac = [0, 0, 0, 0] as [number, number, number, number]
  let thuThach = 0
  chon.forEach((c) => {
    theoBac[c.bac]++
    const h = hoSoTheoDang[c.dang ?? '']
    if (h && c.bac === h.bacDich + 1) thuThach++
  })
  return {
    thuTu: [...chon, ...cau.filter((c) => !chonSet.has(c.qid))],
    tomTat: { tong: chon.length, theoBac, thuThach, alpha: a, coHoSoDuTin },
  }
}

