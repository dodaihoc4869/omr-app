// BI-A PHẢN ỨNG · LUẬT (đặc tả mục 3 + bảng quyết định mục 15). Thuần: không DOM, không mạng, không hẹn giờ — màn chơi và phòng đấu dùng chung.
// Tối đa 4 người (G10): đấu đơn [em, đối thủ]; đánh đôi [ghế 1 Kim loại, ghế 2 Phi kim, ghế 3 Kim loại, ghế 4 Phi kim], đánh lần lượt 1→2→3→4.
// Người GIỮ bi trả lời câu của bi (G11), ai đánh vào cũng vậy; Câu chốt do người hạ Bi chốt trả lời. Một câu sai ⇒ dừng hàng, lượt sang ngay (G13).
import { CHOT, KL, NHOM, PK, doiCuaBi, type KiHieu, type QuanHe } from './nguyen-to'
import type { SuKienCu } from './vat-ly'

export type CheDo = 'don' | 'doi'
export type Doi = 0 | 1
export interface Ghe { ten: string; ngan: string; tat: string; ai: boolean; doi: Doi }
export interface TrangThaiBi {
  /** Ghế giữ bi (chỉ số trong danh sách ghế); Bi chốt = −1. */
  chu: number
  an: boolean
  /** Đã giải trước đúng: vào lỗ là ăn ngay. */
  vang: boolean
  /** Không có câu (hết trần, Bàn giao hữu, bi của A.I không mang câu thật nhưng vẫn "trả lời" theo tỉ lệ ⇒ KHÔNG trống). */
  trong: boolean
  /** Số lần đổi câu (sau câu sai). */
  doiCau: number
}
export type BangBi = Record<KiHieu, TrangThaiBi>
export const EM = 0
export const TAT_CA_BI: readonly KiHieu[] = [...KL, ...PK, CHOT]

/** Điểm ván theo mức độ (G3): Nhận biết 10, Thông hiểu 20, Vận dụng 30; hạ Bi chốt +50; bi trống 5. */
export const DIEM_MUC = [10, 20, 30] as const
export const DIEM_CHOT = 50, DIEM_TRONG = 5
const HANG: Readonly<Record<string, number>> = { NB: 0, 'Nhận biết': 0, biet: 0, TH: 1, 'Thông hiểu': 1, hieu: 1, VD: 2, 'Vận dụng': 2, van_dung: 2, VDC: 2, 'Vận dụng cao': 2, van_dung_cao: 2 }
export const hangMuc = (m: string | null | undefined): 0 | 1 | 2 => ((m != null && m in HANG ? HANG[m] : 0) as 0 | 1 | 2)
export const diemMuc = (m: string | null | undefined): number => DIEM_MUC[hangMuc(m)]
export const TEN_MUC = ['Nhận biết', 'Thông hiểu', 'Vận dụng'] as const
/** Tỉ lệ đúng của A.I Đỗ Đại Học (G5): theo hạng mức độ; Câu chốt 70%. */
export const AI_DUNG = [0.85, 0.75, 0.6] as const
export const AI_DUNG_CHOT = 0.7
export const MAT_THAN_TOI_DA = 3
export const GIAY_CU = 30
/** Thời gian trả lời: Phần I 90 giây, Phần II và III 180 giây. */
export const giayCau = (phan: string): number => (phan === 'I' ? 90 : 180)

export function taoGhe(cheDo: CheDo, tenEm: string): Ghe[] {
  const ngan = tenEm.trim().split(/\s+/).pop() || 'Em'
  const tat = tenEm.trim().split(/\s+/).filter(Boolean).slice(-2).map((x) => x[0]!.toLocaleUpperCase('vi')).join('') || 'EM'
  if (cheDo === 'don') return [{ ten: tenEm, ngan: tenEm, tat, ai: false, doi: 0 }, { ten: 'A.I Đỗ Đại Học', ngan: 'A.I Đỗ Đại Học', tat: 'A.I', ai: true, doi: 1 }]
  return [
    { ten: tenEm, ngan, tat, ai: false, doi: 0 },
    { ten: 'A.I Đỗ Đại Học 1', ngan: 'A.I 1', tat: 'A1', ai: true, doi: 1 },
    { ten: 'A.I Đỗ Đại Học 2', ngan: 'A.I 2', tat: 'A2', ai: true, doi: 0 },
    { ten: 'A.I Đỗ Đại Học 3', ngan: 'A.I 3', tat: 'A3', ai: true, doi: 1 },
  ]
}
/** Chia bi (G11): đấu đơn — ghế 1 giữ 7 bi Kim loại, ghế 2 giữ 7 bi Phi kim; đánh đôi — người 1 của phe giữ bi thứ 1, 3, 5, 7 (4 bi), người 2 giữ bi 2, 4, 6. */
export function chiaBi(cheDo: CheDo): BangBi {
  const doi = cheDo === 'doi'
  const bi = {} as BangBi
  KL.forEach((id, i) => { bi[id] = { chu: doi ? (i % 2 ? 2 : 0) : 0, an: false, vang: false, trong: false, doiCau: 0 } })
  PK.forEach((id, i) => { bi[id] = { chu: doi ? (i % 2 ? 3 : 1) : 1, an: false, vang: false, trong: false, doiCau: 0 } })
  bi[CHOT] = { chu: -1, an: false, vang: false, trong: false, doiCau: 0 }
  return bi
}
/** Bi em giữ, theo thứ tự trong phe (thứ tự này khớp thứ tự câu máy chủ xếp). */
export const biCuaGhe = (bi: BangBi, ghe: number): KiHieu[] => [...KL, ...PK].filter((id) => bi[id].chu === ghe)
export const tiepTheo = (ghe: number, soGhe: number): number => (ghe + 1) % soGhe
export const conLaiDoi = (bi: BangBi, doi: Doi): number => NHOM[doi]!.filter((id) => !bi[id].an).length

/** Bi `id` có được chạm TRƯỚC bởi người của phe `doi` không (phá bàn: bi nào cũng được). */
export function hopLeDich(id: KiHieu, doi: Doi, bi: BangBi, laPhaBan: boolean): boolean {
  if (laPhaBan) return true
  const con = conLaiDoi(bi, doi)
  if (id === CHOT) return con === 0
  return doiCuaBi(id) === doi && con > 0
}
/** Quan hệ của bi với ghế `toi` (nhãn chỉ bi, đặc tả 3.11). */
export function quanHe(id: KiHieu, toi: number, ghe: readonly Ghe[], bi: BangBi): QuanHe {
  if (id === CHOT) return 'chot'
  const s = bi[id].chu
  if (s === toi) return 'em'
  return ghe[s]?.doi === ghe[toi]?.doi ? 'dong-doi' : 'doi-thu'
}

export type MucHang = { loai: 'bi'; id: KiHieu; nguoiTL: number } | { loai: 'chot'; nguoiTL: number }
export interface KetQuaXet {
  /** Mã và lời phạm luật (P1–P5), null nếu hợp lệ. */
  maLoi: 'P1' | 'P2' | 'P3' | 'P4' | 'P5' | null
  loi: string | null
  /** Bi đặt lại chân bàn (bi rơi khi phạm luật, bi của phe đối thủ). */
  datLai: KiHieu[]
  /** Bi cái rơi ⇒ đặt ở đầu bàn. */
  datBiCai: boolean
  /** Ăn ngay (bi vàng, bi trống của phe người đánh). */
  anNgay: KiHieu[]
  /** Hàng câu phải trả lời, theo thứ tự rơi; Câu chốt cuối. */
  hang: MucHang[]
  /** Bi chốt là bi trống, rơi hợp lệ ⇒ phe thắng ngay. */
  thangNgay: boolean
  /** Bi phe đối thủ rơi (đã nằm trong `datLai`). */
  cuaBan: KiHieu[]
}
/**
 * Bảng quyết định cuối cú đánh (đặc tả 15). `conTruoc` = số bi chưa ăn của phe người đánh TRƯỚC cú này. `chotTrong` = Bi chốt không có câu.
 */
export function xetCu(ev: SuKienCu, ghe: number, dsGhe: readonly Ghe[], bi: BangBi, laPhaBan: boolean, conTruoc: number, chotTrong = false): KetQuaXet {
  const doi = dsGhe[ghe]!.doi
  const roi = ev.potted.filter((id): id is KiHieu => id !== 'cue')
  const kq: KetQuaXet = { maLoi: null, loi: null, datLai: [], datBiCai: ev.cuePotted, anNgay: [], hang: [], thangNgay: false, cuaBan: [] }
  if (ev.cuePotted) { kq.maLoi = 'P1'; kq.loi = 'bi cái rơi lỗ' }
  else if (ev.firstHit === null) { kq.maLoi = 'P2'; kq.loi = 'bi cái chưa chạm bi nào' }
  else if (!laPhaBan) {
    const f = ev.firstHit
    if (f === CHOT) { if (conTruoc > 0) { kq.maLoi = 'P4'; kq.loi = 'chạm Bi chốt khi phe chưa ăn đủ 7 bi' } }
    else if (doiCuaBi(f) !== doi) { kq.maLoi = 'P3'; kq.loi = `chạm bi ${f} của phe đối thủ trước` }
  }
  if (!kq.maLoi && roi.includes(CHOT) && conTruoc > 0) { kq.maLoi = 'P5'; kq.loi = 'Bi chốt rơi khi phe chưa ăn đủ 7 bi' }
  if (kq.maLoi) { kq.datLai = roi; return kq }
  for (const id of roi) {
    if (id === CHOT) continue
    if (doiCuaBi(id) !== doi) { kq.cuaBan.push(id); kq.datLai.push(id); continue }
    const s = bi[id]
    if (s.vang || s.trong) kq.anNgay.push(id)
    else kq.hang.push({ loai: 'bi', id, nguoiTL: s.chu })
  }
  if (roi.includes(CHOT)) {
    if (chotTrong) kq.thangNgay = true
    else kq.hang.push({ loai: 'chot', nguoiTL: ghe })
  }
  return kq
}
/** Đánh tiếp (cùng ghế) ⇔ không phạm luật ∧ không câu nào sai ∧ không bi phe đối thủ rơi ∧ có ít nhất 1 bi được ăn trong cú. */
export function duocDanhTiep(kq: KetQuaXet, ketQuaHang: readonly boolean[]): boolean {
  if (kq.maLoi) return false
  if (ketQuaHang.some((d) => !d)) return false
  if (kq.cuaBan.length) return false
  return kq.anNgay.length + ketQuaHang.filter(Boolean).length > 0
}
/** Mắt thần: +1 mỗi câu đúng của chính em, tối đa 3. */
export const congMatThan = (n: number): number => Math.min(MAT_THAN_TOI_DA, n + 1)
