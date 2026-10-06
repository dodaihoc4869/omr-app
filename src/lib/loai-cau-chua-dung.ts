// PHÂN LOẠI MỘT CÂU CHƯA ĐÚNG TRỌN từ dòng chi tiết (thầy 06/10: "hiển thị những câu học sinh sai phải chính xác tuyệt đối"). Lá — không import gì, ai cũng dùng được.
//
// Ba thứ khác hẳn nhau mà bản cũ gộp thành "sai": SAI (em có trả lời mà sai) · BỎ TRỐNG (em không trả lời gì — thường là hết giờ, không phải quên kiến thức) ·
// ĐÚNG MỘT PHẦN (chỉ Phần II: có ý đúng, chưa đủ bốn). Cả ba đều là câu CHƯA ĐÚNG TRỌN: bảng chấm ghi `dung_sai = 0` và hệ thống đưa vào hàng ôn lại.

export type LoaiChuaDung = 'sai' | 'trong' | 'mot_phan'

/**
 * `dapAnChon` / `dapAnDung` như bảng chấm ghi: Phần I "A"; Phần III "0,54"; Phần II "DS-D" (dấu "-" = ý bỏ trống) và "DSDS".
 * Phần II bỏ trống cả bốn ý được ghi "----" (KHÔNG phải chuỗi rỗng) nên không thể chỉ kiểm rỗng.
 */
export function loaiCauChuaDung(r: { phan: string; dapAnChon: string; dapAnDung: string }): LoaiChuaDung {
  const chon = String(r.dapAnChon ?? '')
  if (r.phan === 'II') {
    const ky = [...chon]
    if (ky.every((c) => c === '-' || c.trim() === '')) return 'trong'
    const dung = String(r.dapAnDung ?? '')
    return ky.some((c, i) => c !== '-' && c === dung[i]) ? 'mot_phan' : 'sai'
  }
  return chon.trim() === '' ? 'trong' : 'sai'
}

const CHU: Record<LoaiChuaDung, string> = { sai: 'sai', trong: 'bỏ trống', mot_phan: 'đúng một phần' }

/** Chữ của một loại: "sai" · "bỏ trống" · "đúng một phần". */
export const chuLoaiChuaDung = (l: LoaiChuaDung): string => CHU[l]

/** "1 sai · 2 bỏ trống · 1 đúng một phần" — chỉ nêu loại có mặt, theo thứ tự sai · bỏ trống · đúng một phần. `noi` = dấu nối (mặc định " · "; câu văn dùng ", "). */
export function chuDemLoai(ds: readonly { loai?: LoaiChuaDung }[], noi = ' · '): string {
  const dem = (l: LoaiChuaDung) => ds.filter((c) => c.loai === l).length
  return (['sai', 'trong', 'mot_phan'] as const)
    .filter((l) => dem(l) > 0)
    .map((l) => `${dem(l)} ${CHU[l]}`)
    .join(noi)
}

/** Một dòng "câu em CÒN chưa đúng" cho báo cáo ca rút câu SAI (màn Theo dõi). */
export interface DongCauSaiLai {
  phan: 'I' | 'II' | 'III'
  soCau: number
  qid: string
  chuyenDe: string
  /** Số lần sai gồm cả lần này; 0 = máy này không giữ số lần sai cũ (KHÔNG in 1 — em có thể đã sai câu này ba lần rồi). */
  soLanSai: number
  dapAnDung: string
  /** Rỗng khi em bỏ trống (kể cả Phần II "----") để dòng hiện "bỏ trống" thay vì in chuỗi gạch. */
  dapAnChon: string
  /** Phần II có ý đúng mà chưa đủ bốn: chưa đúng trọn nhưng KHÔNG phải sai hẳn. */
  motPhan: boolean
}

/** Dựng dòng câu còn chưa đúng từ dòng chi tiết chấm + số lần sai TRƯỚC ca (0 = không biết). */
export function dongCauSaiLai(
  r: { phan: 'I' | 'II' | 'III'; soCau: number; qid: string; chuyenDe?: string; dapAnChon?: string; dapAnDung?: string },
  soLanSaiTruoc: number,
): DongCauSaiLai {
  const loai = loaiCauChuaDung({ phan: r.phan, dapAnChon: r.dapAnChon ?? '', dapAnDung: r.dapAnDung ?? '' })
  return {
    phan: r.phan,
    soCau: r.soCau,
    qid: r.qid,
    chuyenDe: r.chuyenDe || '',
    soLanSai: soLanSaiTruoc > 0 ? soLanSaiTruoc + 1 : 0,
    dapAnDung: r.dapAnDung || '',
    dapAnChon: loai === 'trong' ? '' : r.dapAnChon || '',
    motPhan: loai === 'mot_phan',
  }
}
