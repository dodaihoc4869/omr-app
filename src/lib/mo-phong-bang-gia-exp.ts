// MÔ PHỎNG KINH TẾ EXP v5 (THẦY ĐÃ CHỐT 29/09/2026, `docs/DE-XUAT-EXP-V5-2909.md` mục 7) — THUẦN, chỉ dùng cho test/khoá lý do. Không app nào gọi.
//
// Bản TS của `mo-phong.mjs` (đề xuất), chạy bằng CHÍNH hằng số và hàm sản phẩm: giá câu/việc (`server/src/exp-cau-hinh.ts`, `expMotCau`, `expCauGameMot`),
// KHÔNG trần ngày, nhận EXP qua cổng ngày đạt + EXP tràn (`nhanV5`), bảng D/T (`BANG_NGAY_CAP`, `tongExpToiCap`), vàng (`vangDangDuc`: 1/5 EXP vào thú + vàng tràn),
// mảnh tràn (`manhTranNgay` bên trong `nhanV5`), khiên 36 mảnh + 2 600 vàng + ngày đạt ≥ `ngayDatKhien(k)`.
// Bất biến thầy chốt (test khoá): em chăm và em cày vô hạn đều lên cấp 10 ngày 21, cấp 120 ngày 1 200, khiên đầu ngày 36; em chăm lên cấp 2 ngày 1, cấp 3 ngày 2.
import {
  BANG_GIA_MOI, EXP_CHUOI_HE_SO, EXP_CHUOI_TOI_DA, EXP_DIEM_CA_HE_SO, EXP_KHAC_PHUC, EXP_LEN_BAC, EXP_LEN_BANG_CHUA_DAT, EXP_LEN_BANG_DAT, EXP_MOM_XONG,
} from '../../server/src/exp-cau-hinh'
import { expCauGameMot, expMotCau } from '../../server/src/exp-hoc-tap'
import { KHIEN_REN_GIU_TOI_DA, MANH_REN_KHIEN, VANG_REN_KHIEN, ngayDatKhien, vangDangDuc } from './kinh-te-game'
import { nhanV5, type HoSoV5 } from './hap-thu-ngay'

type Phan = 'I' | 'II' | 'III'
/** Hồ sơ một kiểu em (mọi số là GIẢ ĐỊNH của đề xuất mục 7). `thu` 1 = Thứ Hai … 7 = Chủ nhật; ngày 1 là Thứ Hai. */
export interface HoSoMoPhong {
  ten: string
  mucTieu: number
  cauDung: number
  phan: Record<Phan, number>
  sao: readonly [number, number, number]
  lenBac: number
  khacPhuc: number
  /** Ngày em có học (vắng = mọi ngày). Ngày không học: không EXP, không cắt chuỗi. */
  hoc?: (thu: number, n: number) => boolean
  dat: (thu: number, n: number) => boolean
  lo: (thu: number, n: number) => boolean
  loDung: (thu: number, n: number) => boolean
  btvn: (thu: number, n: number) => boolean
  mom: (thu: number, n: number) => boolean
  lenBang: (thu: number, n: number) => 'dat' | 'chua' | null
  ca: (thu: number, n: number) => number | null
  /** Số câu game thường đúng mỗi ngày và EXP game khác (nấc dạng, chặng Đoàn…). */
  cauGame: number
  gameKhac: number
  /** Tỉ lệ EXP trong ngày kiếm TRƯỚC lúc đạt nhiệm vụ ngày. */
  truocDat: number
}

const chamGoc: HoSoMoPhong = {
  ten: 'Chăm', mucTieu: 16, cauDung: 48, phan: { I: 0.6, II: 0.15, III: 0.25 }, sao: [0.3, 0.4, 0.3], lenBac: 10, khacPhuc: 3,
  dat: () => true, lo: (t) => t <= 5, loDung: () => true, btvn: (t) => t === 3 || t === 6, mom: () => true,
  lenBang: (t) => (t === 4 ? 'dat' : null), ca: (t) => (t === 7 ? 10 : null), cauGame: 30, gameKhac: 50, truocDat: 1 / 3,
}

export const HO_SO_MO_PHONG: Readonly<Record<'cay' | 'cham' | 'tb' | 'yeu' | 'quang', HoSoMoPhong>> = {
  cay: {
    ...chamGoc, ten: 'Cày vô hạn', cauDung: 500, cauGame: 200, gameKhac: 150, lenBac: 30, khacPhuc: 10,
    lenBang: (t) => (t === 4 || t === 2 ? 'dat' : null), ca: (t) => (t === 7 || t === 3 ? 10 : null), truocDat: 0.9,
  },
  cham: chamGoc,
  tb: {
    ten: 'Trung bình', mucTieu: 12, cauDung: 22, phan: { I: 0.7, II: 0.12, III: 0.18 }, sao: [0.5, 0.35, 0.15], lenBac: 4, khacPhuc: 1,
    dat: (t) => t !== 7, lo: (t) => t <= 5, loDung: (t) => t !== 5, btvn: (t) => t === 3, mom: (t) => t <= 5,
    lenBang: (t, n) => (t === 4 && n % 14 < 7 ? 'chua' : null), ca: (t) => (t === 7 ? 7 : null), cauGame: 20, gameKhac: 30, truocDat: 1 / 2,
  },
  yeu: {
    ten: 'Yếu', mucTieu: 8, cauDung: 10, phan: { I: 0.8, II: 0.1, III: 0.1 }, sao: [0.7, 0.25, 0.05], lenBac: 2, khacPhuc: 0.5,
    dat: (t) => t === 1 || t === 3 || t === 5 || t === 6, lo: (t) => t === 2 || t === 4, loDung: () => false, btvn: (t, n) => t === 3 && n % 14 < 7, mom: (t) => t === 1 || t === 4,
    lenBang: () => null, ca: (t) => (t === 7 ? 5 : null), cauGame: 10, gameKhac: 15, truocDat: 2 / 3,
  },
  quang: {
    ...chamGoc, ten: 'Cách quãng 4/7', hoc: (t) => t === 1 || t === 2 || t === 4 || t === 6,
    dat: (t) => t === 1 || t === 2 || t === 4 || t === 6, lo: (t) => t === 1 || t === 2 || t === 4, btvn: (t) => t === 6, mom: (t) => t === 1 || t === 4,
    lenBang: (t) => (t === 4 ? 'dat' : null), ca: (t) => (t === 6 ? 10 : null),
  },
}

/** EXP kỳ vọng của MỘT câu (trộn phần/sao) theo một bảng giá. */
const tbCau = (h: Pick<HoSoMoPhong, 'phan' | 'sao'>, gia: (ph: Phan, s: number) => number): number => {
  let t = 0
  for (const ph of ['I', 'II', 'III'] as const) for (let s = 0; s < 3; s++) t += h.phan[ph] * h.sao[s]! * gia(ph, s)
  return t
}

/** EXP câu học tập đúng một ngày (v5: KHÔNG trần — mọi câu đủ giá). */
export const expCauNgay = (h: Pick<HoSoMoPhong, 'cauDung' | 'phan' | 'sao'>): number => h.cauDung * tbCau(h, expMotCau)

/** EXP kiếm của ngày `n` (chuỗi = số ngày đạt liên tiếp gồm hôm nay). Ngày không học ⇒ 0. */
export function expNgayMoPhong(h: HoSoMoPhong, n: number, chuoi: number): number {
  const t = ((n - 1) % 7) + 1
  if (h.hoc && !h.hoc(t, n)) return 0
  const dat = h.dat(t, n)
  const lb = h.lenBang(t, n), ca = h.ca(t, n)
  const k = expCauNgay(h) + BANG_GIA_MOI.dauNgay + h.lenBac * EXP_LEN_BAC + h.khacPhuc * EXP_KHAC_PHUC
    + (dat ? BANG_GIA_MOI.datNgay + EXP_CHUOI_HE_SO * Math.min(Math.max(1, chuoi), EXP_CHUOI_TOI_DA) : 0)
    + (h.lo(t, n) ? (h.loDung(t, n) ? BANG_GIA_MOI.loDungNhip : BANG_GIA_MOI.loTreNhip) : 0)
    + (h.btvn(t, n) ? BANG_GIA_MOI.btvnDungHan : 0) + (h.mom(t, n) ? EXP_MOM_XONG : 0)
    + (lb === 'dat' ? EXP_LEN_BANG_DAT : lb === 'chua' ? EXP_LEN_BANG_CHUA_DAT : 0)
    + (ca == null ? 0 : Math.round(ca) * EXP_DIEM_CA_HE_SO)
    + h.cauGame * tbCau(h, expCauGameMot) + h.gameKhac
  return Math.round(k)
}

export interface KetQuaMoPhong {
  /** Ngày đầu tiên thú đạt cấp m (m = 2, 3, 5, 10, 20, 30, 50, 80, 100, 120); vắng = chưa tới. */
  cap: Record<number, number>
  /** Cấp cuối mỗi ngày. */
  capNgay: Record<number, number>
  /** Ngày rèn khiên thứ k (k = 1, 2, 3…). */
  khien: Record<number, number>
  /** Vàng tích luỹ cuối ngày n (đã cộng lại phần dùng rèn khiên). */
  vangTichLuy: Record<number, number>
  tbNgay: number
  /** Tổng EXP tràn cả đợt. */
  tongTran: number
  soNgayDat: number
}

const ngayVn = (n: number): string => new Date(Date.UTC(2026, 8, 20 + n)).toISOString().slice(0, 10)

/** Chạy `soNgay` ngày bằng các hàm sản phẩm. Không mua đồ. */
export function chayMoPhong(h: HoSoMoPhong, soNgay = 1300): KetQuaMoPhong {
  let ho: HoSoV5 & { earned: number; mocVang: number } = { cap: 1, exp: 0, wallet: 0, choMoc: 0, earned: 0, mocVang: 0 }
  let chuoi = 0, N = 0, manhDat = 0, tongKiem = 0, soRen = 0
  const r: KetQuaMoPhong = { cap: {}, capNgay: {}, khien: {}, vangTichLuy: {}, tbNgay: 0, tongTran: 0, soNgayDat: 0 }
  const nap = (x: number, ngay: string) => {
    const k = nhanV5(ho, x, N, ngay)
    ho = { ...k.hoSo, earned: ho.earned + x, mocVang: 0 }
  }
  for (let n = 1; n <= soNgay; n++) {
    const t = ((n - 1) % 7) + 1
    const hoc = !h.hoc || h.hoc(t, n)
    const datHomNay = hoc && h.dat(t, n)
    chuoi = datHomNay ? chuoi + 1 : hoc ? 0 : chuoi // nghỉ theo lịch không cắt chuỗi (giả định)
    const kiem = expNgayMoPhong(h, n, chuoi)
    tongKiem += kiem
    const ngay = ngayVn(n)
    // Thứ tự trong ngày: phần kiếm trước lúc đạt ⇒ đạt (ngày đạt +1, mảnh +1) ⇒ phần còn lại.
    const truoc = Math.round(kiem * (datHomNay ? h.truocDat : 1))
    nap(truoc, ngay)
    if (datHomNay) { N++; manhDat++; nap(kiem - truoc, ngay) }
    const manh = manhDat + (ho.tranV5?.tongManh ?? 0) - soRen * MANH_REN_KHIEN
    const vangCo = () => vangDangDuc(ho) - soRen * VANG_REN_KHIEN
    const cap = ho.cap
    for (const m of [2, 3, 5, 10, 20, 30, 50, 80, 100, 120]) if (cap >= m && r.cap[m] === undefined) r.cap[m] = n
    r.capNgay[n] = cap
    let manhCon = manh
    while (soRen < KHIEN_REN_GIU_TOI_DA && manhCon >= MANH_REN_KHIEN && vangCo() >= VANG_REN_KHIEN && N >= ngayDatKhien(soRen + 1)) {
      soRen++; manhCon -= MANH_REN_KHIEN; r.khien[soRen] = n
    }
    r.vangTichLuy[n] = vangDangDuc(ho)
  }
  r.tbNgay = tongKiem / soNgay
  r.tongTran = ho.tranV5?.tongExp ?? 0
  r.soNgayDat = N
  return r
}
