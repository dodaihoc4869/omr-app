// CHIẾU CHỮA BÀI SAU CA (thầy chốt bản vẽ 01/11, docs/ban-ve-chieu-chua-ca-0111): ca kiểm tra kết thúc ⇒ nút «Chiếu chữa bài» ⇒ tờ chiếu CHUẨN, mỗi trang một
// câu có em chưa đúng; góc phải là thẻ tên các em chưa đúng (thu gọn được để lấy chỗ chữa). PHẦN THUẦN — không gọi mạng, không chấm lại: chỉ gom bảng chấm
// từng câu ĐÃ CÓ ở máy thầy (`taoChiTietCau` → `ChiTietCauRow`, cùng nguồn khối «Câu cả lớp sai nhiều nhất»).
//   · LUẬT XẾP: mức độ khó → dễ (Vận dụng → Hiểu → Biết; không rõ mức đứng sau cùng), cùng mức ⇒ số em chưa đúng nhiều → ít, bằng nhau ⇒ phần rồi số câu.
//   · CHƯA ĐÚNG = `dungSai === false` (bỏ trống cũng là false; Phần II sai ≥ 1 ý). `dungSai == null` (không chấm được) ⇒ không tính, không đếm làm.
//   · ĐỀ RIÊNG TỪNG EM: mỗi câu chỉ đếm em được giao câu ấy (`lam`).
//   · TÊN TRÊN THẺ: hai chữ cuối của họ tên; hai em trùng ⇒ in đủ họ tên; quá TOI_DA_TEN em ⇒ TOI_DA_TEN − 1 tên + «+n em».
import type { ChiTietCauRow } from './exam-api'

export const TOI_DA_TEN = 30
const BAC_MUC: Record<string, number> = { van_dung_cao: 4, van_dung: 3, hieu: 2, biet: 1 }
const THU_PHAN: Record<string, number> = { I: 1, II: 2, III: 3 }

export interface EmBaiCa {
  sbd: string
  hoTen: string
  rows: readonly ChiTietCauRow[] | null
}

export interface CauChuaCa {
  qid: string
  phan: 'I' | 'II' | 'III'
  soCau: number
  mucDo: string
  /** Em chưa đúng, theo thứ tự danh sách ca. */
  sai: { sbd: string; hoTen: string }[]
  /** Số em làm câu này (có bảng chấm). */
  lam: number
  /** Bài làm của mọi em làm câu này — cho dải thống kê lớp (phím T). */
  bai: { dung: boolean; chon: string; dapAnDung: string }[]
}

/** Gom bảng chấm của cả ca thành danh sách câu cần chữa, ĐÃ XẾP. Câu không em nào chưa đúng ⇒ không vào. */
export function xepCauChuaCa(ds: readonly EmBaiCa[]): CauChuaCa[] {
  const theoCau = new Map<string, CauChuaCa>()
  for (const e of ds) {
    for (const r of e.rows ?? []) {
      if (r.dungSai == null || !r.qid) continue
      let c = theoCau.get(r.qid)
      if (!c) {
        c = { qid: r.qid, phan: r.phan, soCau: r.soCau, mucDo: String(r.mucDo || '').trim(), sai: [], lam: 0, bai: [] }
        theoCau.set(r.qid, c)
      }
      c.lam += 1
      const chon = String(r.dapAnChon ?? '').trim()
      c.bai.push({ dung: r.dungSai, chon: chon === '-' ? '' : chon, dapAnDung: r.dapAnDung })
      if (!r.dungSai && !c.sai.some((x) => x.sbd === e.sbd)) c.sai.push({ sbd: e.sbd, hoTen: e.hoTen })
    }
  }
  return [...theoCau.values()]
    .filter((c) => c.sai.length > 0)
    .sort((a, b) => (BAC_MUC[b.mucDo] ?? 0) - (BAC_MUC[a.mucDo] ?? 0) || b.sai.length - a.sai.length || (THU_PHAN[a.phan] ?? 9) - (THU_PHAN[b.phan] ?? 9) || a.soCau - b.soCau)
}

/** Tên in trên thẻ: hai chữ cuối; tên ngắn trùng nhau ⇒ cả hai in đủ họ tên. */
export function tenGon(dsHoTen: readonly string[]): string[] {
  const ngan = dsHoTen.map((t) => {
    const chu = String(t ?? '').trim().split(/\s+/).filter(Boolean)
    return chu.slice(-2).join(' ')
  })
  const dem = new Map<string, number>()
  for (const n of ngan) dem.set(n.toLocaleLowerCase('vi'), (dem.get(n.toLocaleLowerCase('vi')) ?? 0) + 1)
  return ngan.map((n, i) => ((dem.get(n.toLocaleLowerCase('vi')) ?? 0) > 1 ? String(dsHoTen[i] ?? '').trim().replace(/\s+/g, ' ') : n))
}

/** Thẻ tên của một câu: tên đã rút gọn (tối đa TOI_DA_TEN mục kể cả «+n em»), tổng số em chưa đúng, số em làm. */
export interface TheChuaDung {
  ten: string[]
  them: number
  tong: number
  lam: number
}

export function theChuaDung(c: Pick<CauChuaCa, 'sai' | 'lam'>): TheChuaDung {
  const ten = tenGon(c.sai.map((e) => e.hoTen || 'Em chưa có tên'))
  const hien = ten.length > TOI_DA_TEN ? ten.slice(0, TOI_DA_TEN - 1) : ten
  return { ten: hien, them: ten.length - hien.length, tong: c.sai.length, lam: c.lam }
}
