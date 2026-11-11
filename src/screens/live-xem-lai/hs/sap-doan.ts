// XEM LẠI LIVE — MÁY EM: luật xếp của trang buổi (đặc tả mục 2.1, 4.5 «riêng từng em»). Thuần, không DOM.
// · CHỈ câu có trong `buoi.json` mới được hiện: đoạn trỏ tới câu vắng mặt bị bỏ; kết quả riêng của lượt không có trong `buoi.json` bị lờ đi.
// · Danh sách đoạn riêng từng em (tính trên máy em từ `/hs/live-buoi`): «Câu em chưa đúng» đứng đầu, rồi «Em lên bảng», rồi các đoạn còn lại theo thứ tự buổi.
// · Dòng thời gian: khúc xám = lớp làm bài, khúc màu đội = đoạn chữa trên bảng, mũi tên = đoạn đáng xem.
import type { BuoiLiveJson, CauBuoiLive, DoanBuoiLive, TraLiveBuoiHs } from '../../../lib/live/xem-lai-kieu'
import { tiLeDung } from './ten-hien'

export type NhanDoan = 'chua-dung' | 'em-len-bang' | 'dang-xem'
export interface DoanHien {
  doan: DoanBuoiLive
  cau: CauBuoiLive
  nhan: NhanDoan[]
}
export type KetQuaEm = 'dung' | 'chua-dung' | null

/** Câu của buổi theo số câu (chỉ câu trong `buoi.json`). */
export const cauTheoSo = (b: BuoiLiveJson): Map<number, CauBuoiLive> => new Map(b.cau.map((c) => [c.so, c]))
/** Em làm đúng / chưa đúng câu này; em không gửi (hoặc câu tự luận, hoặc app thầy xem) ⇒ null (không hiện chip). */
export function ketQuaEm(c: CauBuoiLive, rieng: TraLiveBuoiHs | null): KetQuaEm {
  const k = rieng?.ketQua?.[c.luot]
  return !k || c.tuLuan ? null : k.dung ? 'dung' : 'chua-dung'
}
/** Các đoạn hợp lệ (câu có trong `buoi.json`), theo thứ tự buổi. Đây cũng là HÀNG PHÁT của trình phát («Đoạn 3/5»). */
export function doanHopLe(b: BuoiLiveJson): DoanBuoiLive[] {
  const co = cauTheoSo(b)
  return b.doan.filter((d) => co.has(d.cau) && d.t1 > d.t0).slice().sort((x, y) => x.stt - y.stt)
}
/** Danh sách đoạn RIÊNG của em: câu em chưa đúng ⇒ đoạn em lên bảng ⇒ còn lại; trong mỗi nhóm giữ thứ tự buổi. */
export function sapDoan(b: BuoiLiveJson, rieng: TraLiveBuoiHs | null): DoanHien[] {
  const co = cauTheoSo(b), lenBang = new Set(rieng?.lenBang ?? [])
  const ds = doanHopLe(b).map((doan): DoanHien & { hang: number } => {
    const cau = co.get(doan.cau)!, nhan: NhanDoan[] = []
    if (ketQuaEm(cau, rieng) === 'chua-dung') nhan.push('chua-dung')
    if (doan.loai === 'len_bang' && lenBang.has(doan.luot)) nhan.push('em-len-bang')
    if (doan.dangXem) nhan.push('dang-xem')
    return { doan, cau, nhan, hang: nhan[0] === 'chua-dung' ? 0 : nhan.includes('em-len-bang') ? 1 : 2 }
  })
  return ds.sort((x, y) => x.hang - y.hang || x.doan.stt - y.doan.stt).map(({ doan, cau, nhan }) => ({ doan, cau, nhan }))
}
export const CHU_NHAN: Record<NhanDoan, string> = { 'chua-dung': 'Câu em chưa đúng', 'em-len-bang': 'Em lên bảng', 'dang-xem': 'Đáng xem' }

/** Đoạn «đáng xem nhất» của buổi: trong các đoạn có nhãn, lấy đoạn của câu lớp đúng ÍT nhất; hoà ⇒ đoạn dài hơn. Không đoạn nào có nhãn ⇒ null. */
export function dangXemNhat(b: BuoiLiveJson): { doan: DoanBuoiLive; cau: CauBuoiLive; chu: string } | null {
  const co = cauTheoSo(b)
  let tot: { doan: DoanBuoiLive; cau: CauBuoiLive; tl: number } | null = null
  for (const doan of doanHopLe(b)) {
    if (!doan.dangXem) continue
    const cau = co.get(doan.cau)!, tl = tiLeDung(cau) ?? 101
    if (!tot || tl < tot.tl || (tl === tot.tl && doan.t1 - doan.t0 > tot.doan.t1 - tot.doan.t0)) tot = { doan, cau, tl }
  }
  if (!tot) return null
  const tl = tiLeDung(tot.cau)
  return { doan: tot.doan, cau: tot.cau, chu: `Đáng xem nhất: Câu ${tot.cau.so} · ${tot.doan.dangXem}${tl != null && /sai nhiều/.test(tot.doan.dangXem ?? '') ? ` (${tl} % đúng)` : ''}` }
}

export interface KhucThoiGian {
  /** Phần của cả buổi (0..1) — đặt làm `flex`. */
  phan: number
  /** Đoạn chữa (null = khúc xám «lớp làm bài»). */
  doan: DoanBuoiLive | null
  /** Số câu để nhảy tới khi chạm (khúc xám: câu đang làm ở khoảng đó, null nếu không có). */
  cau: number | null
  /** Chỉ số đội của bạn lên bảng (null = thầy chữa ⇒ màu chính của app). */
  doi: number | null
  hay: boolean
}
/** Dải ngang cả buổi `[0, msLive]`: xen khúc xám và khúc đoạn. Khúc xám ngắn hơn 0,4 % cả buổi thì gộp bỏ (không vẽ sợi chỉ). */
export function dongThoiGian(b: BuoiLiveJson): KhucThoiGian[] {
  const tong = Math.max(1, b.msLive), ra: KhucThoiGian[] = []
  const cauLuc = (t: number): number | null => { for (const c of b.cau) if (t >= c.t0 && t < c.t1) return c.so; return null }
  let o = 0
  const xam = (den: number): void => { if (den - o > tong * 0.004) ra.push({ phan: (den - o) / tong, doan: null, cau: cauLuc((o + den) / 2), doi: null, hay: false }) }
  for (const d of doanHopLe(b).slice().sort((x, y) => x.t0 - y.t0)) {
    const t0 = Math.max(o, Math.min(d.t0, tong)), t1 = Math.max(t0, Math.min(d.t1, tong))
    if (t1 <= t0) continue
    xam(t0)
    ra.push({ phan: (t1 - t0) / tong, doan: d, cau: d.cau, doi: d.lenBang ? d.lenBang.doi : null, hay: !!d.dangXem })
    o = t1
  }
  xam(tong)
  return ra
}
