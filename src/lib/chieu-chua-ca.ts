// CHIẾU CHỮA BÀI SAU CA (thầy chốt bản vẽ 01/11, docs/ban-ve-chieu-chua-ca-0111): ca kiểm tra kết thúc ⇒ nút «Chiếu chữa bài» ⇒ tờ chiếu CHUẨN, mỗi trang một
// câu có em chưa đúng; góc phải là thẻ tên các em chưa đúng (thu gọn được để lấy chỗ chữa). PHẦN THUẦN — không gọi mạng, không chấm lại: chỉ gom bảng chấm
// từng câu ĐÃ CÓ ở máy thầy (`taoChiTietCau` → `ChiTietCauRow`, cùng nguồn khối «Câu cả lớp sai nhiều nhất»).
//   · LUẬT XẾP: mức độ khó → dễ (Vận dụng → Hiểu → Biết; không rõ mức đứng sau cùng), cùng mức ⇒ số em chưa đúng nhiều → ít, bằng nhau ⇒ phần rồi số câu.
//   · CHƯA ĐÚNG = `dungSai === false` (bỏ trống cũng là false; Phần II sai ≥ 1 ý). `dungSai == null` (không chấm được) ⇒ không tính, không đếm làm.
//   · ĐỀ RIÊNG TỪNG EM: mỗi câu chỉ đếm em được giao câu ấy (`lam`).
//   · TÊN TRÊN THẺ: hai chữ cuối của họ tên; hai em trùng ⇒ in đủ họ tên; quá TOI_DA_TEN em ⇒ TOI_DA_TEN − 1 tên + «+n em».
//   · SỐ GIÂY (thầy 01/11 tối: «hiện thị số giây làm câu sai sắp xếp thẻ tên làm ngắn nhất trước»): mỗi em kèm `giay` của bảng chấm; xếp NGẮN NHẤT
//     trước, em không có số giây (null) đứng cuối, bằng nhau giữ thứ tự ca.
//   · GỌI LÊN BẢNG (cùng lượt): mỗi câu mang danh sách em ĐÃ LÀM ĐÚNG (tên gọn + giây) để tờ chọn ngẫu nhiên một em lên chữa; không em nào ⇒
//     «Thầy chữa». KHÔNG số báo danh trên tờ.
import type { ChiTietCauRow } from './exam-api'

export const TOI_DA_TEN = 30
const BAC_MUC: Record<string, number> = { van_dung_cao: 4, van_dung: 3, hieu: 2, biet: 1 }
const THU_PHAN: Record<string, number> = { I: 1, II: 2, III: 3 }

export interface EmBaiCa {
  sbd: string
  hoTen: string
  rows: readonly ChiTietCauRow[] | null
}

/** Một em ở một câu: `giay` = số giây em làm câu ấy (bảng chấm), không có ⇒ null. */
export interface EmCau {
  sbd: string
  hoTen: string
  giay?: number | null
}

export interface CauChuaCa {
  qid: string
  phan: 'I' | 'II' | 'III'
  soCau: number
  mucDo: string
  /** Em chưa đúng, theo thứ tự danh sách ca. */
  sai: EmCau[]
  /** Em làm ĐÚNG câu này, theo thứ tự danh sách ca — cho «Gọi lên bảng». */
  dung: EmCau[]
  /** Số em làm câu này (có bảng chấm). */
  lam: number
  /** Bài làm của mọi em làm câu này — cho dải thống kê lớp (phím T). */
  bai: { dung: boolean; chon: string; dapAnDung: string }[]
}

/** Số giây hợp lệ (số hữu hạn ≥ 0, làm tròn) hoặc null. */
export function giayHopLe(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : null
}

/** Gom bảng chấm của cả ca thành danh sách câu cần chữa, ĐÃ XẾP. Câu không em nào chưa đúng ⇒ không vào. */
export function xepCauChuaCa(ds: readonly EmBaiCa[]): CauChuaCa[] {
  const theoCau = new Map<string, CauChuaCa>()
  for (const e of ds) {
    for (const r of e.rows ?? []) {
      if (r.dungSai == null || !r.qid) continue
      let c = theoCau.get(r.qid)
      if (!c) {
        c = { qid: r.qid, phan: r.phan, soCau: r.soCau, mucDo: String(r.mucDo || '').trim(), sai: [], dung: [], lam: 0, bai: [] }
        theoCau.set(r.qid, c)
      }
      c.lam += 1
      const chon = String(r.dapAnChon ?? '').trim()
      c.bai.push({ dung: r.dungSai, chon: chon === '-' ? '' : chon, dapAnDung: r.dapAnDung })
      const nhom = r.dungSai ? c.dung : c.sai
      if (!nhom.some((x) => x.sbd === e.sbd)) nhom.push({ sbd: e.sbd, hoTen: e.hoTen, giay: giayHopLe(r.giay) })
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

/** Một em trên tờ: tên gọn + số giây làm câu (null ⇒ «—»). Không số báo danh. */
export interface EmTrenTo {
  ten: string
  giay: number | null
}

/** Thẻ tên của một câu: em chưa đúng đã xếp ngắn nhất trước (tối đa TOI_DA_TEN mục kể cả «+n em»), tổng số em chưa đúng, số em làm,
 *  và em làm đúng (cho «Gọi lên bảng»). */
export interface TheChuaDung {
  em: EmTrenTo[]
  them: number
  tong: number
  lam: number
  dung: EmTrenTo[]
}

/** Xếp em theo số giây NGẮN NHẤT trước; null cuối; bằng nhau giữ thứ tự cũ. */
export function xepTheoGiay<T extends { giay: number | null }>(ds: readonly T[]): T[] {
  return ds
    .map((x, i) => ({ x, i }))
    .sort((a, b) => (a.x.giay ?? Infinity) - (b.x.giay ?? Infinity) || a.i - b.i)
    .map((y) => y.x)
}

export function theChuaDung(c: Pick<CauChuaCa, 'sai' | 'lam'> & { dung?: readonly EmCau[] }): TheChuaDung {
  const dung = c.dung ?? []
  // Tên gọn tính trên CẢ câu (em sai + em đúng): một em một tên ở cả thẻ lẫn tấm gọi, hai em trùng hai chữ cuối thì đều in đủ họ tên.
  const ten = tenGon([...c.sai, ...dung].map((e) => e.hoTen || 'Em chưa có tên'))
  const em = xepTheoGiay(c.sai.map((e, i) => ({ ten: ten[i]!, giay: giayHopLe(e.giay) })))
  const hien = em.length > TOI_DA_TEN ? em.slice(0, TOI_DA_TEN - 1) : em
  return { em: hien, them: em.length - hien.length, tong: c.sai.length, lam: c.lam, dung: dung.map((e, i) => ({ ten: ten[c.sai.length + i]!, giay: giayHopLe(e.giay) })) }
}

/** Số em CÒN TRONG GIỜ làm bài (cảnh báo trước khi chiếu chữa bài sau ca). Chỉ lượt `dang_lam` mà hạn giờ còn tới sau `nowMs`;
 *  «được duyệt thi lại» (chờ thi lại) và lượt bỏ dở đã hết giờ KHÔNG tính (thầy 01/11: «nộp hết rồi nhưng vẫn báo còn 1 em đang làm»). Thuần. */
export function demConTrongGio(luot: readonly { trangThai: string; hetGioLuc?: string | null }[], nowMs: number): number {
  return luot.filter((l) => {
    if (l.trangThai !== 'dang_lam') return false
    const het = Date.parse(l.hetGioLuc || '')
    return Number.isFinite(het) && het > nowMs
  }).length
}
