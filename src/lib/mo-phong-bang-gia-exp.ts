// MÔ PHỎNG KINH TẾ EXP v4 (thầy chốt 29/09/2026, `docs/DE-XUAT-EXP-2909.md` mục 4) — THUẦN, chỉ dùng cho test/khoá lý do. Không app nào gọi.
//
// Chạy bằng CHÍNH hằng số và hàm sản phẩm: giá câu/việc (`server/src/exp-cau-hinh.ts`), trần mềm/cứng (`expMotCau`, `expSauTran`), game ≤ 120/ngày,
// nạp tự do + khoá mốc (`nhanTuDo`), đường cấp v4 (`tongExpToiCap`), vàng 1/5 (`EXP_MOI_VANG`), khiên 21 mảnh + 21 ngày đạt + 1 400 vàng.
// Bất biến thầy chốt (test khoá): em CHĂM NHẤT ngày 20 còn cấp 9, ngày 21 lên cấp 10; khiên đầu ngày 21. Không có khoá mốc thì đường cấp một mình vẫn cho ngày 21.
import {
  BANG_GIA_MOI, EXP_CHUOI_HE_SO, EXP_CHUOI_TOI_DA, EXP_DIEM_CA_HE_SO, EXP_KHAC_PHUC, EXP_LEN_BAC, EXP_LEN_BANG_CHUA_DAT, EXP_LEN_BANG_DAT, EXP_MOM_XONG,
  KHAC_PHUC_TOI_DA_NGAY, LEN_BAC_TOI_DA_NGAY, TRAN_CUNG_HE_SO, TRAN_MEM_HE_SO,
} from '../../server/src/exp-cau-hinh'
import { expMotCau, expSauTran } from '../../server/src/exp-hoc-tap'
import { EXP_MOI_VANG, KHIEN_REN_GIU_TOI_DA, MANH_REN_KHIEN, NGAY_DAT_MO_CAP_10, VANG_REN_KHIEN } from './kinh-te-game'
import { TRAN_EXP_GAME_NGAY, nhanTuDo } from './hap-thu-ngay'

type Phan = 'I' | 'II' | 'III'
/** Hồ sơ một kiểu em (mọi số là GIẢ ĐỊNH của đề xuất mục 1 và 4). `thu` 1 = Thứ Hai … 7 = Chủ nhật; ngày 1 là Thứ Hai. */
export interface HoSoMoPhong {
  ten: string
  mucTieu: number
  cauDung: number
  phan: Record<Phan, number>
  sao: readonly [number, number, number]
  lenBac: number
  khacPhuc: number
  dat: (thu: number, n: number) => boolean
  lo: (thu: number, n: number) => boolean
  loDung: (thu: number, n: number) => boolean
  btvn: (thu: number, n: number) => boolean
  mom: (thu: number, n: number) => boolean
  lenBang: (thu: number, n: number) => 'dat' | 'chua' | null
  ca: (thu: number, n: number) => number | null
  game: number
}

export const HO_SO_MO_PHONG: Readonly<Record<'cham' | 'tb' | 'yeu', HoSoMoPhong>> = {
  cham: {
    ten: 'Chăm nhất', mucTieu: 16, cauDung: 48, phan: { I: 0.6, II: 0.15, III: 0.25 }, sao: [0.3, 0.4, 0.3], lenBac: 10, khacPhuc: 3,
    dat: () => true, lo: (t) => t <= 5, loDung: () => true, btvn: (t) => t === 3 || t === 6, mom: () => true,
    lenBang: (t) => (t === 4 ? 'dat' : null), ca: (t) => (t === 7 ? 10 : null), game: 120,
  },
  tb: {
    ten: 'Trung bình', mucTieu: 12, cauDung: 22, phan: { I: 0.7, II: 0.12, III: 0.18 }, sao: [0.5, 0.35, 0.15], lenBac: 4, khacPhuc: 1,
    dat: (t) => t !== 7, lo: (t) => t <= 5, loDung: (t) => t !== 5, btvn: (t) => t === 3, mom: (t) => t <= 5,
    lenBang: (t, n) => (t === 4 && n % 14 < 7 ? 'chua' : null), ca: (t) => (t === 7 ? 7 : null), game: 70,
  },
  yeu: {
    ten: 'Yếu', mucTieu: 8, cauDung: 10, phan: { I: 0.8, II: 0.1, III: 0.1 }, sao: [0.7, 0.25, 0.05], lenBac: 2, khacPhuc: 0.5,
    dat: (t) => t === 1 || t === 3 || t === 5 || t === 6, lo: (t) => t === 2 || t === 4, loDung: () => false, btvn: (t, n) => t === 3 && n % 14 < 7, mom: (t) => t === 1 || t === 4,
    lenBang: () => null, ca: (t) => (t === 7 ? 5 : null), game: 35,
  },
}

/** EXP câu đúng một ngày (kỳ vọng theo tỉ lệ phần/sao): câu 1…2M đủ, 2M+1…3M 25 %, > 3M = 0 (trần cứng). */
export function expCauNgay(h: Pick<HoSoMoPhong, 'mucTieu' | 'cauDung' | 'phan' | 'sao'>): number {
  const nguong = TRAN_MEM_HE_SO * h.mucTieu, cung = TRAN_CUNG_HE_SO * h.mucTieu
  let tb = 0, tbSau = 0
  for (const ph of ['I', 'II', 'III'] as const) for (let s = 0; s < 3; s++) {
    const w = h.phan[ph] * h.sao[s]!
    tb += w * expMotCau(ph, s)
    tbSau += w * expSauTran(expMotCau(ph, s))
  }
  const du = Math.min(h.cauDung, nguong), sau = Math.max(0, Math.min(h.cauDung, cung) - nguong)
  return du * tb + sau * tbSau
}

/** EXP kiếm của ngày `n` (chuỗi = số ngày đạt liên tiếp gồm hôm nay). */
export function expNgayMoPhong(h: HoSoMoPhong, n: number, chuoi: number): number {
  const t = ((n - 1) % 7) + 1
  const dat = h.dat(t, n)
  const lb = h.lenBang(t, n), ca = h.ca(t, n)
  const k = expCauNgay(h) + BANG_GIA_MOI.dauNgay
    + Math.min(h.lenBac, LEN_BAC_TOI_DA_NGAY) * EXP_LEN_BAC + Math.min(h.khacPhuc, KHAC_PHUC_TOI_DA_NGAY) * EXP_KHAC_PHUC
    + (dat ? BANG_GIA_MOI.datNgay + EXP_CHUOI_HE_SO * Math.min(Math.max(1, chuoi), EXP_CHUOI_TOI_DA) : 0)
    + (h.lo(t, n) ? (h.loDung(t, n) ? BANG_GIA_MOI.loDungNhip : BANG_GIA_MOI.loTreNhip) : 0)
    + (h.btvn(t, n) ? BANG_GIA_MOI.btvnDungHan : 0) + (h.mom(t, n) ? EXP_MOM_XONG : 0)
    + (lb === 'dat' ? EXP_LEN_BANG_DAT : lb === 'chua' ? EXP_LEN_BANG_CHUA_DAT : 0)
    + (ca == null ? 0 : Math.round(ca) * EXP_DIEM_CA_HE_SO) + Math.min(h.game, TRAN_EXP_GAME_NGAY)
  return Math.round(k)
}

export interface KetQuaMoPhong {
  /** Ngày đầu tiên thú đạt cấp m (m = 2, 3, 5, 10, 20, 30); vắng = chưa tới. */
  cap: Record<number, number>
  /** Cấp cuối mỗi ngày. */
  capNgay: Record<number, number>
  khienDau: number | null
  khien2: number | null
  /** Vàng đúc luỹ kế cuối ngày n. */
  vangTichLuy: Record<number, number>
  tbNgay: number
}

/** Chạy `soNgay` ngày bằng các hàm sản phẩm. `coKhoaMoc = false` ⇒ bỏ khoá mốc (để chứng minh đường cấp một mình). Không mua đồ. */
export function chayMoPhong(h: HoSoMoPhong, soNgay = 60, coKhoaMoc = true): KetQuaMoPhong {
  let ho = { cap: 1, exp: 0, wallet: 0, choMoc: 0 }
  let chuoi = 0, ngayDat = 0, manh = 0, tongKiem = 0, vang = 0, daDuc = 0, khien = 0
  const r: KetQuaMoPhong = { cap: {}, capNgay: {}, khienDau: null, khien2: null, vangTichLuy: {}, tbNgay: 0 }
  for (let n = 1; n <= soNgay; n++) {
    const t = ((n - 1) % 7) + 1
    const datHomNay = h.dat(t, n)
    chuoi = datHomNay ? chuoi + 1 : 0
    const kiem = expNgayMoPhong(h, n, chuoi)
    tongKiem += kiem
    if (datHomNay) { ngayDat++; manh++ }
    ho = nhanTuDo(ho, kiem, coKhoaMoc ? ngayDat : NGAY_DAT_MO_CAP_10).hoSo as typeof ho
    const duc = Math.floor(tongKiem / EXP_MOI_VANG) - daDuc
    daDuc += duc
    vang += duc
    for (const m of [2, 3, 5, 10, 20, 30]) if (ho.cap >= m && r.cap[m] === undefined) r.cap[m] = n
    r.capNgay[n] = ho.cap
    if (manh >= MANH_REN_KHIEN && ngayDat >= MANH_REN_KHIEN && vang >= VANG_REN_KHIEN && khien < KHIEN_REN_GIU_TOI_DA) {
      manh -= MANH_REN_KHIEN
      vang -= VANG_REN_KHIEN
      khien++
      if (khien === 1) r.khienDau = n
      else if (khien === 2) r.khien2 = n
    }
    r.vangTichLuy[n] = daDuc
  }
  r.tbNgay = tongKiem / soNgay
  return r
}
