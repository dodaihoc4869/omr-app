// BÁO CÁO CẢ LỚP của một ca (Xem điểm bản 2 · GV-1; bản vẽ docs/ban-ve-xem-diem-2109/gv-1-chi-tiet-ca.html).
// THUẦN TÍNH TOÁN — không chấm lại, không gọi mạng: nhận điểm/bảng chấm ĐÃ CÓ ở máy thầy (`graded`, `taoChiTietCau`) và gom thành số cho cả lớp.
// Luật: chỗ nào máy thầy không có dữ liệu (chưa có ngân hàng đáp án ⇒ không có bảng chấm từng câu) thì trường ấy là `null`/rỗng và màn ẨN khối — không bịa số.
// Không xếp hạng em, không nhãn năng lực; lý do "em cần để ý" luôn bằng SỐ.
import type { ChiTietCauRow } from './exam-api'
import type { ScoreResult } from '../engine/score'
import { phanTuDiem, soVn, type PhanKetQua } from './ket-qua-sau-nop'

export interface EmChoBaoCao {
  sbd: string
  hoTen: string
  lop: string
  trangThai: 'dang_lam' | 'da_nop' | 'khoa' | 'duoc_duyet_lai'
  /** Điểm hiện ra (chấm tại máy hoặc điểm đã ghi); null ⇒ chưa có. */
  diem: number | null
  score: ScoreResult | null
  vaoLuc?: unknown
  nopLuc?: unknown
  soLanRoiMan: number
  tongGiayRoiMan: number
  /** Bảng chấm từng câu của em (từ `taoChiTietCau`); null ⇒ máy này không dựng được. */
  rows: ChiTietCauRow[] | null
}

export interface KhoangDiem {
  nhan: string
  soEm: number
}
export interface PhanTrungBinh {
  ma: PhanKetQua['ma']
  ten: string
  diemTB: number
  toiDa: number
  dungTB: number
  tong: number
}
export interface DangCaLop {
  ten: string
  /** % câu ĐÚNG của cả lớp ở dạng này (0–100). */
  tiLeDung: number
  soEmSai: number
  soEmLam: number
}
export interface CauSaiNhieu {
  qid: string
  phan: 'I' | 'II' | 'III'
  soCau: number
  dang: string
  soSai: number
  soLam: number
  tiLeSai: number
  dapAnDung: string
  /** Đáp án SAI được chọn nhiều nhất (chỉ nêu đáp án + số em, KHÔNG suy diễn lý do); null nếu em sai đều bỏ trống. */
  dapAnSaiNhieu: { dapAn: string; soEm: number } | null
}
export interface EmCanYY {
  sbd: string
  hoTen: string
  lop: string
  lyDo: string[]
}
export interface BaoCaoCaLop {
  nop: number
  daVao: number
  chuaNop: number
  tb: number | null
  cao: number | null
  thap: number | null
  /** Thời gian làm trung bình (phút, làm tròn); null nếu thiếu mốc vào/nộp. */
  phutTB: number | null
  pho: KhoangDiem[]
  baPhan: PhanTrungBinh[]
  /** Dạng cả lớp đang vấp (tỉ lệ đúng thấp nhất trước). Rỗng khi máy thầy không có bảng chấm từng câu. */
  dang: DangCaLop[]
  cauSai: CauSaiNhieu[]
  emCanYY: EmCanYY[]
  /** Máy thầy có bảng chấm từng câu cho ít nhất một em không (để màn nói thật vì sao ẩn dạng/câu). */
  coBangCham: boolean
}

/** Khoảng điểm của phổ điểm (điểm 10 thuộc khoảng cuối). */
export const KHOANG_DIEM: readonly [number, number, string][] = [
  [0, 2, '0–2'],
  [2, 4, '2–4'],
  [4, 5, '4–5'],
  [5, 6, '5–6'],
  [6, 7, '6–7'],
  [7, 8, '7–8'],
  [8, 9, '8–9'],
  [9, 10.0001, '9–10'],
]

/** Ngưỡng "em cần để ý": điểm dưới nửa thang; rời màn từ 3 lần. Số cố định, nói rõ trong chữ của màn. */
export const NGUONG_DIEM_THAP = 5
export const NGUONG_ROI_MAN = 3
const TOI_DA_EM_CAN_YY = 5
const TOI_DA_DANG = 5
const TOI_DA_CAU_SAI = 3

const laDaNop = (e: Pick<EmChoBaoCao, 'trangThai' | 'diem'>) => (e.trangThai === 'da_nop' || e.trangThai === 'khoa') && Number.isFinite(e.diem)
const tb = (ds: number[]): number | null => (ds.length ? ds.reduce((s, v) => s + v, 0) / ds.length : null)
const tenDang = (chuyenDe: string): string => chuyenDe.replace(/^CD:/, '').trim()
const ms = (v: unknown): number => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Date.parse(v) : NaN)

/** PHẦN RẺ cho dòng gập của khối (chạy mỗi lần màn làm mới): chỉ đếm bài đã nộp có điểm + điểm trung bình, KHÔNG đụng bảng chấm từng câu. */
export function tomTatCaLop(em: Pick<EmChoBaoCao, 'trangThai' | 'diem'>[]): { nop: number; tb: number | null } {
  const diem = em.filter(laDaNop).map((e) => e.diem as number)
  return { nop: diem.length, tb: tb(diem) }
}

/** "2 phút 10 giây" từ số giây (làm tròn). */
export function chuGiay(giay: number): string {
  const g = Math.max(0, Math.round(giay))
  const p = Math.floor(g / 60)
  const s = g % 60
  if (p === 0) return `${s} giây`
  return s === 0 ? `${p} phút` : `${p} phút ${String(s).padStart(2, '0')} giây`
}

export function tinhBaoCaoCaLop(em: EmChoBaoCao[], daVao: number): BaoCaoCaLop {
  const nop = em.filter(laDaNop)
  const diem = nop.map((e) => e.diem as number)

  // thời gian làm trung bình
  const phut: number[] = []
  for (const e of nop) {
    const v = ms(e.vaoLuc)
    const n = ms(e.nopLuc)
    if (Number.isFinite(v) && Number.isFinite(n) && n >= v) phut.push((n - v) / 60000)
  }
  const phutTB = tb(phut)

  const pho: KhoangDiem[] = KHOANG_DIEM.map(([tu, den, nhan]) => ({ nhan, soEm: diem.filter((d) => d >= tu && d < den).length }))

  // ba phần: trung bình điểm + số câu đúng của những em có bảng điểm chấm tại máy
  const phanTheoEm = nop.map((e) => (e.score ? phanTuDiem(e.score) : null)).filter((p): p is PhanKetQua[] => p != null)
  const baPhan: PhanTrungBinh[] = (['I', 'II', 'III'] as const)
    .map((ma) => {
      const dong = phanTheoEm.map((p) => p.find((x) => x.ma === ma)).filter((x): x is PhanKetQua => x != null)
      if (dong.length === 0) return null
      return { ma, ten: dong[0].ten, diemTB: tb(dong.map((x) => x.diem)) ?? 0, toiDa: dong[0].toiDa, dungTB: tb(dong.map((x) => x.dung)) ?? 0, tong: dong[0].tong }
    })
    .filter((x): x is PhanTrungBinh => x != null)

  // dạng + câu: chỉ khi có bảng chấm từng câu
  const coRows = nop.filter((e) => e.rows && e.rows.length > 0)
  const theoDang = new Map<string, { dung: number; lam: number; emSai: Set<string> }>()
  const theoCau = new Map<string, { phan: 'I' | 'II' | 'III'; soCau: number; dang: string; dapAnDung: string; sai: number; lam: number; chon: Map<string, number> }>()
  for (const e of coRows) {
    for (const r of e.rows ?? []) {
      if (r.dungSai == null) continue
      const d = tenDang(r.chuyenDe || '')
      if (d) {
        const x = theoDang.get(d) ?? { dung: 0, lam: 0, emSai: new Set<string>() }
        x.lam += 1
        if (r.dungSai) x.dung += 1
        else x.emSai.add(e.sbd)
        theoDang.set(d, x)
      }
      const c = theoCau.get(r.qid) ?? { phan: r.phan, soCau: r.soCau, dang: d, dapAnDung: r.dapAnDung, sai: 0, lam: 0, chon: new Map<string, number>() }
      c.lam += 1
      if (!r.dungSai) {
        c.sai += 1
        const chon = (r.dapAnChon || '').trim()
        if (chon && chon !== '-') c.chon.set(chon, (c.chon.get(chon) ?? 0) + 1)
      }
      theoCau.set(r.qid, c)
    }
  }
  // dạng chỉ nêu khi có ít nhất 3 lượt câu (dưới đó là quá ít để nói "cả lớp")
  const dang: DangCaLop[] = [...theoDang.entries()]
    .filter(([, v]) => v.lam >= 3)
    .map(([ten, v]) => ({ ten, tiLeDung: Math.round((v.dung / v.lam) * 100), soEmSai: v.emSai.size, soEmLam: coRows.length }))
    .sort((a, b) => a.tiLeDung - b.tiLeDung || b.soEmSai - a.soEmSai || a.ten.localeCompare(b.ten, 'vi'))
    .slice(0, TOI_DA_DANG)
  const cauSai: CauSaiNhieu[] = [...theoCau.entries()]
    .filter(([, v]) => v.sai > 0 && v.lam >= 2)
    .map(([qid, v]) => {
      const nhieu = [...v.chon.entries()].sort((a, b) => b[1] - a[1])[0]
      return { qid, phan: v.phan, soCau: v.soCau, dang: v.dang, soSai: v.sai, soLam: v.lam, tiLeSai: Math.round((v.sai / v.lam) * 100), dapAnDung: v.dapAnDung, dapAnSaiNhieu: nhieu ? { dapAn: nhieu[0], soEm: nhieu[1] } : null }
    })
    .sort((a, b) => b.tiLeSai - a.tiLeSai || b.soSai - a.soSai || a.soCau - b.soCau)
    .slice(0, TOI_DA_CAU_SAI)

  // em cần để ý: LÝ DO BẰNG SỐ, ngưỡng cố định
  const canYY: EmCanYY[] = []
  const bang = new Map<string, EmCanYY>()
  const them = (e: EmChoBaoCao, ly: string) => {
    const cu = bang.get(e.sbd)
    if (cu) cu.lyDo.push(ly)
    else {
      const m: EmCanYY = { sbd: e.sbd, hoTen: e.hoTen, lop: e.lop, lyDo: [ly] }
      bang.set(e.sbd, m)
      canYY.push(m)
    }
  }
  for (const e of [...nop].sort((a, b) => (a.diem as number) - (b.diem as number))) {
    if ((e.diem as number) < NGUONG_DIEM_THAP) {
      const p = e.score ? phanTuDiem(e.score) : null
      const dung = p ? p.reduce((s, x) => s + x.dung, 0) : null
      const tong = p ? p.reduce((s, x) => s + x.tong, 0) : null
      them(e, dung != null && tong ? `Đúng ${dung}/${tong} câu (${Math.round((dung / tong) * 100)}%) — điểm ${soVn(e.diem as number)}` : `Điểm ${soVn(e.diem as number)}, dưới ${NGUONG_DIEM_THAP}`)
    }
  }
  for (const e of [...em].sort((a, b) => b.soLanRoiMan - a.soLanRoiMan)) {
    if (e.soLanRoiMan >= NGUONG_ROI_MAN) them(e, `Rời màn làm bài ${e.soLanRoiMan} lần, tổng ${chuGiay(e.tongGiayRoiMan)}`)
  }

  return {
    nop: nop.length,
    daVao,
    chuaNop: Math.max(0, daVao - nop.length),
    tb: tb(diem),
    cao: diem.length ? Math.max(...diem) : null,
    thap: diem.length ? Math.min(...diem) : null,
    phutTB: phutTB == null ? null : Math.round(phutTB),
    pho,
    baPhan,
    dang,
    cauSai,
    emCanYY: canYY.slice(0, TOI_DA_EM_CAN_YY),
    coBangCham: coRows.length > 0,
  }
}

