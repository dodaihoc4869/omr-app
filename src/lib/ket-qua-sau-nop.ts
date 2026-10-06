// KẾT QUẢ NGAY SAU NỘP (HS-1 của "Xem điểm + báo cáo chi tiết" bản 2, thầy chốt 21/09; bản vẽ docs/ban-ve-xem-diem-2109/hs-1*.html).
// THUẦN: nhận số đã chấm sẵn (ScoreResult của luật chấm chính thức) + mốc giờ, trả chữ/số để VẼ. KHÔNG chấm, KHÔNG đổi luật công bố, KHÔNG đụng đáp án.
// Không xếp hạng, không nhãn năng lực (bỏ `classify`), chỉ so với LẦN TRƯỚC CỦA CHÍNH EM. Số nào không có thì trả null — màn cha ẩn khối đó, không bịa.
import { gioDayDu } from './ngay-gio-24'
import type { GradedItem, ScoreResult, StudentAnswers } from '../engine/score'

/** Ba trạng thái công bố (luật `CongBoDiem`): thầy đã công bố · chờ cả lớp nộp · thầy chưa công bố. */
export type TrangThaiCongBo = 'da_cong_bo' | 'ca_lop' | 'khong'

export interface PhanKetQua {
  ma: 'I' | 'II' | 'III'
  ten: string
  /** Phần I, III: số câu đúng. Phần II: số câu đúng TRỌN cả 4 ý. */
  dung: number
  tong: number
  /** Chỉ phần II: số câu đúng MỘT PHẦN (có ý đúng nhưng chưa đủ 4). */
  motPhan: number
  diem: number
  toiDa: number
}

const TEN_PHAN: Record<PhanKetQua['ma'], string> = { I: 'Phần I · Trắc nghiệm', II: 'Phần II · Đúng–sai', III: 'Phần III · Trả lời ngắn' }

/** Số kiểu Việt: 7,5 · 6,75 · 3 (bỏ số 0 thừa, tối đa 2 chữ số thập phân). */
export function soVn(n: number): string {
  return (Math.round(n * 100) / 100).toFixed(2).replace(/\.?0+$/, '').replace('.', ',')
}

/** Ba phần từ điểm đã chấm. Phần không có câu nào bị bỏ. Trần điểm mỗi phần lấy từ `quota` (cents) của chính ca này. */
export function phanTuDiem(score: ScoreResult): PhanKetQua[] {
  const dong = (ma: PhanKetQua['ma'], p: ScoreResult['phanI'], diem: number, quota: number): PhanKetQua | null => {
    const tong = p.items.length
    if (tong === 0) return null
    return {
      ma,
      ten: TEN_PHAN[ma],
      dung: p.items.filter((i) => i.correct).length,
      tong,
      motPhan: ma === 'II' ? p.items.filter((i) => !i.correct && (i.yDung ?? 0) > 0).length : 0,
      diem,
      toiDa: quota / 100,
    }
  }
  return [dong('I', score.phanI, score.phanIScore, score.quota.I), dong('II', score.phanII, score.phanIIScore, score.quota.II), dong('III', score.phanIII, score.phanIIIScore, score.quota.III)].filter((x): x is PhanKetQua => x !== null)
}

/** "Em làm đúng 21/28 câu": tổng câu đúng (Phần II tính câu đúng trọn) trên tổng số câu. */
export function tongDungTong(phan: PhanKetQua[]): { dung: number; tong: number } {
  return { dung: phan.reduce((s, p) => s + p.dung, 0), tong: phan.reduce((s, p) => s + p.tong, 0) }
}

const mocMs = (v: unknown): number => (typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Date.parse(v) : NaN)

/** "32 phút 10 giây" từ hai mốc (ISO hoặc ms); thiếu/sai/âm ⇒ null (không hiện dòng thời gian). */
export function thoiGianLam(batDau: unknown, nop: unknown): string | null {
  const goc = mocMs(batDau)
  const cuoi = mocMs(nop)
  if (!Number.isFinite(goc) || !Number.isFinite(cuoi) || cuoi < goc) return null
  const giay = Math.round((cuoi - goc) / 1000)
  const p = Math.floor(giay / 60)
  const g = giay % 60
  if (p === 0) return `${g} giây`
  return g === 0 ? `${p} phút` : `${p} phút ${String(g).padStart(2, '0')} giây`
}

export interface DiemCaTruoc {
  maCa: string
  ngay: string
  tong: number
}

/**
 * So với LẦN TRƯỚC CỦA CHÍNH EM: ca gần nhất KHÁC ca này và diễn ra trước ca này. Không có ⇒ null (màn nói thẳng "ca đầu tiên" hoặc ẩn).
 * `hieu` làm tròn 2 chữ số; 0 ⇒ "bằng".
 */
export function soSanhLanTruoc(ls: readonly DiemCaTruoc[], maCaNay: string, ngayNay: unknown, tongNay: number): { hieu: number; truoc: number } | null {
  const moc = mocMs(ngayNay)
  const truoc = ls
    .filter((d) => d.maCa !== maCaNay && Number.isFinite(d.tong) && Number.isFinite(Date.parse(d.ngay)) && (!Number.isFinite(moc) || Date.parse(d.ngay) < moc))
    .sort((x, y) => Date.parse(y.ngay) - Date.parse(x.ngay))[0]
  if (!truoc) return null
  return { hieu: Math.round((tongNay - truoc.tong) * 100) / 100, truoc: truoc.tong }
}

/** "09:12 · Thứ Bảy 19/09/2026" giờ Việt Nam; mốc sai ⇒ chuỗi rỗng. */
export const chuGioNop = (nop: unknown): string => gioDayDu(nop, '')

/** Trạng thái MỘT câu trên lưới "Từng câu": đúng · sai · đúng một phần (chỉ Phần II) · bỏ trống (em không trả lời gì ở câu đó). */
export type KqMotCau = 'dung' | 'sai' | 'mot_phan' | 'trong'

export interface OKqCau {
  phan: 'I' | 'II' | 'III'
  so: number
  kq: KqMotCau
}

const traLoiTrong = (v: GradedItem<string> | undefined): boolean => !v || v.value === null || String(v.value).trim() === ''

/**
 * Lưới "Từng câu" từ điểm ĐÃ chấm + bài làm. Phân biệt bỏ trống với sai bằng CHÍNH bài làm (câu em không trả lời gì),
 * không dựa vào cờ chấm — chấm trực tuyến không bao giờ đặt cờ `EMPTY` nên bản cũ gộp cả câu bỏ trống vào "sai"
 * (thầy 06/10: hiển thị câu sai phải chính xác tuyệt đối). Phần II: đúng cả bốn ý = đúng; có ý đúng mà chưa đủ = đúng một phần;
 * bỏ trống cả bốn ý = bỏ trống; còn lại = sai.
 */
export function luoiTungCau(score: ScoreResult, traLoi: Pick<StudentAnswers, 'phanI' | 'phanII' | 'phanIII'>): OKqCau[] {
  const ra: OKqCau[] = []
  score.phanI.items.forEach((it, i) => ra.push({ phan: 'I', so: i + 1, kq: it.correct ? 'dung' : traLoiTrong(traLoi.phanI[i] as GradedItem<string>) ? 'trong' : 'sai' }))
  score.phanII.items.forEach((it, i) => {
    const y = traLoi.phanII[i] ?? []
    const troNg = y.length === 0 || y.every((a) => !a || a.value === null)
    ra.push({ phan: 'II', so: i + 1, kq: it.correct ? 'dung' : troNg ? 'trong' : (it.yDung ?? 0) > 0 ? 'mot_phan' : 'sai' })
  })
  score.phanIII.items.forEach((it, i) => ra.push({ phan: 'III', so: i + 1, kq: it.correct ? 'dung' : traLoiTrong(traLoi.phanIII[i]) ? 'trong' : 'sai' }))
  return ra
}

/** Số câu CHƯA ĐÚNG TRỌN trên lưới (sai + bỏ trống + đúng một phần) — đúng tập câu hệ thống đưa vào hàng ôn lại (`dung_sai = 0`). */
export const demChuaDungTron = (cau: readonly { kq: KqMotCau }[]): number => cau.filter((c) => c.kq !== 'dung').length
