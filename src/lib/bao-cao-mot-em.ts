// BÁO CÁO MỘT EM TRONG CA (Xem điểm bản 2 · GV-2; bản vẽ docs/ban-ve-xem-diem-2109/gv-2-bao-cao-mot-em.html).
// THUẦN TÍNH TOÁN, cùng khuôn với lib/bao-cao-ca-lop.ts: nhận điểm/bảng chấm ĐÃ CÓ ở máy thầy, không chấm lại, không gọi mạng.
// Luật: thiếu dữ liệu ⇒ trường là null/rỗng và màn ẨN khối — không bịa số. Không nhãn năng lực; hạng CHỈ có ở báo cáo của thầy.
// Đếm câu dùng ĐÚNG luật chung `lib/dem-ket-qua` (một nguồn cho ba app), không đếm lại kiểu khác.
import type { ChiTietCauRow } from './exam-api'
import { demKetQua, soYDungPhanII } from './dem-ket-qua'
import { phanTuDiem, thoiGianLam, type PhanKetQua } from './ket-qua-sau-nop'
import type { EmChoBaoCao } from './bao-cao-ca-lop'

/** Dưới mức này (đúng/tổng của một dạng trong ca) thì gắn "Cần ôn thêm". Cùng mốc 60% với "Cả lớp còn vấp". */
export const NGUONG_CAN_ON = 0.6
/** Câu ĐÚNG nhưng làm lâu: giây ≥ 2 × trung vị các câu của chính em, và tối thiểu 30 giây, cần ≥ 5 câu có số giây. */
export const HE_SO_LAU = 2
export const GIAY_LAU_TOI_THIEU = 30
const TOI_DA_CAU_XEM_LAI = 8
const TOI_DA_DANG_TOT_HON = 3
/** Chênh tỉ lệ đúng của em so với cả lớp (điểm phần trăm) để được kể là "làm tốt hơn cả lớp". */
const CHENH_TOT_HON = 20
/** Số em tối thiểu có bảng chấm để so dạng/thời gian với "cả lớp". */
const TOI_THIEU_SO_SANH = 3

export type KetQuaCau = 'dung' | 'sai' | 'mot_phan' | 'trong'
export interface OCau {
  soCau: number
  kq: KetQuaCau
}
export interface PhanChiTiet extends PhanKetQua {
  /** Từng câu của phần (rỗng khi máy không dựng được bảng chấm). */
  cau: OCau[]
}
export interface DangCuaEm {
  ten: string
  dung: number
  tong: number
  canOn: boolean
}
export interface CauXemLai {
  qid: string
  phan: 'I' | 'II' | 'III'
  soCau: number
  dang: string
  loai: 'sai' | 'dung_lau'
  /** Chữ đề (nguyên văn trong kho; màn tự cắt dòng). null khi máy không có kho. */
  de: string | null
  dapAnChon: string
  dapAnDung: string
  giay: number | null
  /** Trung bình giây của các em đã nộp ở câu này (chỉ khi ≥ 3 em có số). */
  tbGiayLop: number | null
  /** Lời giải gốc trong kho (màn chuẩn hoá bằng chuanHoaLoiGiaiCau); null = kho không có/không có kho. */
  loiGiai: unknown
}
export interface SoVoiLop {
  tbLop: number
  hieu: number
  hang: number
  siSo: number
  dangTotHon: string[]
}
export interface BaoCaoMotEm {
  daNop: boolean
  tong: number | null
  dung: number | null
  tongCau: number | null
  motPhan: number
  /** "32 phút 10 giây" hoặc null. */
  chuThoiGian: string | null
  phan: PhanChiTiet[]
  dang: DangCuaEm[]
  cauXemLai: CauXemLai[]
  soVoiLop: SoVoiLop | null
  /** Em có bảng chấm từng câu ở máy này không (để màn nói thật vì sao ẩn khối). */
  coBangCham: boolean
}

export interface NguonCau {
  de: string
  loiGiai: unknown
}
interface CauKho {
  id: string
  text?: string
  loiGiai?: unknown
  explanation?: unknown
}
/** Đề + lời giải theo qid, lấy từ kho CÓ đáp án đang có ở máy thầy. */
export function nguonCauTuNganHang(bank: { phanI: CauKho[]; phanII: CauKho[]; phanIII: CauKho[] } | null | undefined): Map<string, NguonCau> {
  const ra = new Map<string, NguonCau>()
  if (!bank) return ra
  for (const q of [...bank.phanI, ...bank.phanII, ...bank.phanIII]) ra.set(q.id, { de: String(q.text ?? '').trim(), loiGiai: q.loiGiai ?? q.explanation ?? null })
  return ra
}

const laDaNop = (e: EmChoBaoCao) => (e.trangThai === 'da_nop' || e.trangThai === 'khoa') && Number.isFinite(e.diem)
const tenDang = (chuyenDe: string): string => chuyenDe.replace(/^CD:/, '').trim()
const trungVi = (ds: number[]): number => {
  const s = [...ds].sort((a, b) => a - b)
  const g = Math.floor(s.length / 2)
  return s.length % 2 ? s[g] : (s[g - 1] + s[g]) / 2
}
const trong = (chon: string): boolean => !/[^\s-]/.test(chon || '')

/** Kết quả một câu để tô ô: đúng · sai · đúng một phần (chỉ phần II, theo luật chung) · bỏ trống. */
export function ketQuaCau(r: Pick<ChiTietCauRow, 'phan' | 'dapAnChon' | 'dapAnDung' | 'dungSai'>): KetQuaCau {
  if (r.dungSai === true) return 'dung'
  if (r.dungSai === null || trong(r.dapAnChon)) return 'trong'
  if (r.phan === 'II' && soYDungPhanII(r.dapAnChon, r.dapAnDung) > 0) return 'mot_phan'
  return 'sai'
}

export function tinhBaoCaoMotEm(em: EmChoBaoCao, lop: EmChoBaoCao[], nguon: Map<string, NguonCau>): BaoCaoMotEm {
  const daNop = laDaNop(em)
  const rows = em.rows && em.rows.length > 0 ? em.rows : null
  const phanDiem = em.score ? phanTuDiem(em.score) : []

  // đếm câu: có bảng chấm thì đếm theo luật chung; không thì lấy tổng theo bảng điểm (nếu có)
  const dem = rows ? demKetQua(rows) : null
  const dungTheoDiem = phanDiem.length ? phanDiem.reduce((s, p) => s + p.dung, 0) : null
  const tongTheoDiem = phanDiem.length ? phanDiem.reduce((s, p) => s + p.tong, 0) : null
  const dung = dem ? dem.soDung : dungTheoDiem
  const tongCau = dem ? dem.tongCau : tongTheoDiem

  const phan: PhanChiTiet[] = phanDiem.map((p) => ({
    ...p,
    cau: rows ? rows.filter((r) => r.phan === p.ma).sort((a, b) => a.soCau - b.soCau).map((r) => ({ soCau: r.soCau, kq: ketQuaCau(r) })) : [],
  }))

  // theo dạng: đúng/tổng của CHÍNH em trong ca này; dạng vấp xếp trên
  const theoDang = new Map<string, { dung: number; tong: number }>()
  for (const r of rows ?? []) {
    const d = tenDang(r.chuyenDe || '')
    if (!d) continue
    const x = theoDang.get(d) ?? { dung: 0, tong: 0 }
    x.tong += 1
    if (r.dungSai === true) x.dung += 1
    theoDang.set(d, x)
  }
  const dang: DangCuaEm[] = [...theoDang.entries()]
    .map(([ten, v]) => ({ ten, dung: v.dung, tong: v.tong, canOn: v.dung / v.tong < NGUONG_CAN_ON }))
    .sort((a, b) => a.dung / a.tong - b.dung / b.tong || b.tong - a.tong || a.ten.localeCompare(b.ten, 'vi'))

  // trung bình giây của cả lớp theo câu (chỉ khi đủ số em có số)
  const giayLop = new Map<string, number[]>()
  const lopCoBang = lop.filter((e) => laDaNop(e) && e.rows && e.rows.length > 0)
  for (const e of lopCoBang) for (const r of e.rows ?? []) if (typeof r.giay === 'number' && r.giay > 0) giayLop.set(r.qid, [...(giayLop.get(r.qid) ?? []), r.giay])
  const tbGiayLop = (qid: string): number | null => {
    const ds = giayLop.get(qid) ?? []
    return ds.length >= TOI_THIEU_SO_SANH ? Math.round(ds.reduce((s, v) => s + v, 0) / ds.length) : null
  }

  // câu cần xem lại: SAI/bỏ trống (mọi câu) + ĐÚNG nhưng làm lâu; sai trước
  const giayEm = (rows ?? []).map((r) => r.giay).filter((g): g is number => typeof g === 'number' && g > 0)
  const nguongLau = giayEm.length >= 5 ? Math.max(GIAY_LAU_TOI_THIEU, HE_SO_LAU * trungVi(giayEm)) : Infinity
  const xemLai: CauXemLai[] = []
  for (const r of rows ?? []) {
    const sai = r.dungSai !== true
    const lau = !sai && typeof r.giay === 'number' && r.giay >= nguongLau
    if (!sai && !lau) continue
    const ng = nguon.get(r.qid)
    xemLai.push({
      qid: r.qid,
      phan: r.phan,
      soCau: r.soCau,
      dang: tenDang(r.chuyenDe || ''),
      loai: sai ? 'sai' : 'dung_lau',
      de: ng ? ng.de : null,
      dapAnChon: r.dapAnChon || '',
      dapAnDung: r.dapAnDung || '',
      giay: typeof r.giay === 'number' ? r.giay : null,
      tbGiayLop: tbGiayLop(r.qid),
      loiGiai: ng ? ng.loiGiai : null,
    })
  }
  const thuTuPhan = { I: 0, II: 1, III: 2 } as const
  xemLai.sort((a, b) => (a.loai === b.loai ? (a.loai === 'sai' ? thuTuPhan[a.phan] - thuTuPhan[b.phan] || a.soCau - b.soCau : (b.giay ?? 0) - (a.giay ?? 0)) : a.loai === 'sai' ? -1 : 1))

  // so với cả lớp (chỉ thầy): trung bình, hơn/kém, hạng, dạng làm tốt hơn cả lớp
  let soVoiLop: SoVoiLop | null = null
  const nopCaLop = lop.filter(laDaNop)
  if (daNop && em.diem != null && nopCaLop.length >= 2) {
    const diemLop = nopCaLop.map((e) => e.diem as number)
    const tbLop = diemLop.reduce((s, v) => s + v, 0) / diemLop.length
    const hang = 1 + diemLop.filter((d) => d > (em.diem as number)).length
    const lopTheoDang = new Map<string, { dung: number; tong: number }>()
    if (lopCoBang.length >= TOI_THIEU_SO_SANH) {
      for (const e of lopCoBang) {
        for (const r of e.rows ?? []) {
          const d = tenDang(r.chuyenDe || '')
          if (!d) continue
          const x = lopTheoDang.get(d) ?? { dung: 0, tong: 0 }
          x.tong += 1
          if (r.dungSai === true) x.dung += 1
          lopTheoDang.set(d, x)
        }
      }
    }
    const tot = dang
      .filter((d) => d.tong >= 2 && (lopTheoDang.get(d.ten)?.tong ?? 0) >= TOI_THIEU_SO_SANH)
      .map((d) => {
        const l = lopTheoDang.get(d.ten)!
        // làm tròn 0,1 điểm phần trăm: tránh sai số số thực đẩy đúng mốc 20 xuống 19,99…
        return { ten: d.ten, chenh: Math.round((d.dung / d.tong - l.dung / l.tong) * 1000) / 10 }
      })
      .filter((d) => d.chenh >= CHENH_TOT_HON)
      .sort((a, b) => b.chenh - a.chenh || a.ten.localeCompare(b.ten, 'vi'))
      .slice(0, TOI_DA_DANG_TOT_HON)
      .map((d) => d.ten)
    soVoiLop = { tbLop, hieu: (em.diem as number) - tbLop, hang, siSo: nopCaLop.length, dangTotHon: tot }
  }

  return {
    daNop,
    tong: em.diem != null && Number.isFinite(em.diem) ? em.diem : null,
    dung,
    tongCau,
    motPhan: dem ? dem.soDungMotPhan : 0,
    chuThoiGian: thoiGianLam(em.vaoLuc, em.nopLuc),
    phan,
    dang,
    cauXemLai: xemLai.slice(0, TOI_DA_CAU_XEM_LAI),
    soVoiLop,
    coBangCham: rows != null,
  }
}
