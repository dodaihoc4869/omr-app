// BI-A PHẢN ỨNG · BI NGUYÊN TỐ (đặc tả mục 3.1, 7.3). Phe Kim loại: 7 bi trơn ánh kim. Phe Phi kim: 7 bi sọc. Bi chốt: carbon.
// Màu theo bảng màu nguyên tử Jmol (quy ước màu nguyên tử trong mô hình phân tử) — viết số rgb, KHÔNG mã hex (check:mau).
// Riêng C của Bi chốt màu đen (truyền thống bi số 8), không xám như Jmol. Tên nguyên tố theo IUPAC như chương trình 2018.

export type KiHieu = 'Na' | 'Mg' | 'Al' | 'Fe' | 'Cu' | 'Ag' | 'Au' | 'N' | 'O' | 'F' | 'P' | 'S' | 'Cl' | 'I' | 'C'
export type Nhom = 'kl' | 'pk' | 'chot'
export interface NguyenTo { z: number; ten: string; nhom: Nhom; rgb: readonly [number, number, number] }

export const NT: Readonly<Record<KiHieu, NguyenTo>> = {
  Na: { z: 11, ten: 'sodium', nhom: 'kl', rgb: [171, 92, 242] },
  Mg: { z: 12, ten: 'magnesium', nhom: 'kl', rgb: [138, 255, 0] },
  Al: { z: 13, ten: 'aluminium', nhom: 'kl', rgb: [191, 166, 166] },
  Fe: { z: 26, ten: 'iron', nhom: 'kl', rgb: [224, 102, 51] },
  Cu: { z: 29, ten: 'copper', nhom: 'kl', rgb: [200, 128, 51] },
  Ag: { z: 47, ten: 'silver', nhom: 'kl', rgb: [192, 192, 192] },
  Au: { z: 79, ten: 'gold', nhom: 'kl', rgb: [255, 209, 35] },
  N: { z: 7, ten: 'nitrogen', nhom: 'pk', rgb: [48, 80, 248] },
  O: { z: 8, ten: 'oxygen', nhom: 'pk', rgb: [255, 13, 13] },
  F: { z: 9, ten: 'fluorine', nhom: 'pk', rgb: [144, 224, 80] },
  P: { z: 15, ten: 'phosphorus', nhom: 'pk', rgb: [255, 128, 0] },
  S: { z: 16, ten: 'sulfur', nhom: 'pk', rgb: [255, 255, 48] },
  Cl: { z: 17, ten: 'chlorine', nhom: 'pk', rgb: [31, 240, 31] },
  I: { z: 53, ten: 'iodine', nhom: 'pk', rgb: [148, 0, 148] },
  C: { z: 6, ten: 'carbon', nhom: 'chot', rgb: [28, 28, 30] },
}
export const KL: readonly KiHieu[] = ['Na', 'Mg', 'Al', 'Fe', 'Cu', 'Ag', 'Au']
export const PK: readonly KiHieu[] = ['N', 'O', 'F', 'P', 'S', 'Cl', 'I']
export const CHOT: KiHieu = 'C'
/** Bi của phe `doi` (0 Kim loại, 1 Phi kim). */
export const NHOM: readonly (readonly KiHieu[])[] = [KL, PK]
export const TEN_PHE = ['Phe Kim loại', 'Phe Phi kim'] as const
export const TEN_PHE_NGAN = ['Kim loại', 'Phi kim'] as const
/** Xếp chuẩn 8 bi từ đỉnh: Bi chốt giữa hàng 3, hai góc cuối khác phe (Ag Kim loại, I Phi kim). */
export const XEP: readonly (readonly KiHieu[])[] = [['Na'], ['O', 'Mg'], ['Al', 'C', 'N'], ['S', 'Fe', 'Cl', 'Cu'], ['Ag', 'F', 'Au', 'P', 'I']]
export const doiCuaBi = (id: KiHieu): 0 | 1 | -1 => (id === CHOT ? -1 : NT[id].nhom === 'kl' ? 0 : 1)
export const mauCss = (id: KiHieu): string => `rgb(${NT[id].rgb.join(',')})`
export const laKiHieu = (x: unknown): x is KiHieu => typeof x === 'string' && Object.prototype.hasOwnProperty.call(NT, x)
/** Màu nhãn chỉ bi theo quan hệ với em (đặc tả 3.11). */
export type QuanHe = 'em' | 'dong-doi' | 'doi-thu' | 'chot'
export const MAU_QH: Readonly<Record<QuanHe, string>> = { em: 'rgb(91,240,165)', 'dong-doi': 'rgb(127,200,255)', 'doi-thu': 'rgb(255,138,138)', chot: 'rgb(255,214,107)' }
