// BÌNH PHẢN ỨNG — CHỌN EM LÊN BẢNG THEO TOÀN BỘ LỊCH SỬ, CÓ LÝ DO (thầy 09/11: «Tối ưu việc chọn học sinh lên bảng theo toàn bộ lịch sử làm bài
// của học sinh thật thông minh và có lý do»). Hàm THUẦN (không mạng, không Math.random): nạp bằng import động từ `layEmChieu` kênh 'bpu'.
//
// Xếp theo TẦNG (tầng trước quyết, tầng sau chỉ phá hoà):
//  1. Số lần đã lên bảng TRONG BUỔI (ít trước) — em đã gọi xuống cuối, không gọi một em nhiều lần.
//  2. Số lần đội của em đã lên bảng trong buổi (ít trước) — chia đều giữa các đội.
//  3. Đúng/sai ở CHÍNH lượt này (`kiem` của bảng): thường ưu tiên em ĐÚNG trên máy để kiểm thật; cứ khoảng 1/3 lượt (hạt giống buổi|lượt) ưu tiên em SAI để chữa.
//  4. Điểm lịch sử: đúng/tổng lượt làm câu cùng dạng (thiếu ⇒ cùng chuyên đề) trên app, số ngày chưa lên bảng (len_bang ∪ bpu_luot), số ngày học trong 14 ngày,
//     kết quả câu này trên app, lần lên bảng gần nhất chưa đạt ⇒ cơ hội gỡ.
// Lý do 2–3 dòng CHỈ từ số thật; KHÔNG nêu đúng/sai lượt này (lý do ra máy cả lớp trước khi mở — lộ ra là hỏng trò đoán), không nêu số kém, không «Chưa đạt».
// Thiếu dữ liệu (máy chủ cũ) ⇒ `lyDoBpu` rỗng ⇒ `lyDoLenBang` dùng ba dòng chung như cũ.
import type { EmChieu } from '../ung-vien-chieu'
import { DOI_BPU } from './phong'

export interface LichSuEmBpu { dang?: [number, number]; cd?: [number, number]; ngay14?: number; lb?: [number, number]; lbCuoi?: string | null; datCuoi?: boolean | null }
/** Phần `bpu` của `/gv/ung-vien-chieu` (kênh 'bpu'). `lbDu` = đọc đủ cả hai sổ lên bảng. */
export interface NapBpu { tenDang?: string; chuyenDe?: string; lbDu?: boolean; em: Record<string, LichSuEmBpu> }
/** Phần view bảng bộ chọn cần (`ViewBang` thoả kiểu này). `kiem` = {sbd: [đúng 1/0, giây]} chỉ có khi máy chủ mới gửi. */
export interface LuotBpu {
  buoiId?: string
  ds: readonly { sbd: string; doi: number; daLenBang?: number }[]
  luot: { so: number; qid: string; kiem?: Record<string, readonly [number, number]> } | null
}

const NGAY_MS = 86_400_000
const bam = (s: string): number => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 }
/** Tỉ lệ đúng đã làm mịn theo số lượt (ít lượt ⇒ gần 0,5): 8 lượt trở lên mới tin hẳn. */
const tiLe = (x?: readonly [number, number]): number => { if (!x || x[1] <= 0) return 0.5; const tin = Math.min(x[1], 8) / 8; return tin * ((x[0] + 1) / (x[1] + 2)) + (1 - tin) * 0.5 }
const ngaySau = (iso: string | null | undefined, nowMs: number): number | null => { const t = iso ? Date.parse(iso) : NaN; return Number.isFinite(t) ? Math.max(0, Math.floor((nowMs - t) / NGAY_MS)) : null }
const moiHon = (a?: string | null, b?: string | null): string | null => (a && b ? (a > b ? a : b) : a || b || null)
const gon = (s: string | undefined, n = 60): string => { const t = (s ?? '').trim(); return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t }

interface BoiCanh { nap?: NapBpu; kiem: Record<string, readonly [number, number]>; doiCua: Map<string, number>; lenTrongBuoi: Map<string, number>; goiDoi: Map<number, number>; nowMs: number }

/** Số ngày chưa lên bảng (null = không biết) — gộp sổ máy chủ (mọi lần) với `lanCuoiLenBang` 60 ngày của lệnh cũ. */
function ngayChuaLen(e: EmChieu, h: LichSuEmBpu | undefined, nowMs: number): number | null {
  return ngaySau(moiHon(h?.lbCuoi, e.lanCuoiLenBang), nowMs)
}

export function diemLichSu(e: EmChieu, c: BoiCanh): number {
  const h = c.nap?.em[e.sbd]
  const dang = h?.dang && h.dang[1] > 0 ? h.dang : h?.cd
  const ngay = ngayChuaLen(e, h, c.nowMs)
  const chuaLen = ngay ?? (c.nap?.lbDu && h?.lb == null ? 21 : (e.soLan14 ?? 0) === 0 ? 14 : 7)
  const cauNay = e.loai === 'da_dung' ? 1 : e.loai === 'du_bao' ? (e.p ?? 0.4) : 0.3
  const go = h?.datCuoi === false && (ngay ?? 0) >= 3 ? 0.15 : 0
  return 3 * tiLe(dang) + 2 * (Math.min(chuaLen, 21) / 21) + Math.min(h?.ngay14 ?? 0, 14) / 14 + cauNay + go
}

/** 2–3 dòng «Vì sao chọn em» bằng số thật; ít hơn 2 dòng có số ⇒ [] (nơi gọi dùng lý do chung). */
export function lyDoBpu(e: EmChieu, c: BoiCanh): string[] {
  const h = c.nap?.em[e.sbd], dau: string[] = [], them: string[] = []
  // 1) Dạng / chuyên đề — chỉ khi đúng từ một nửa trở lên (không nêu số kém trước lớp).
  const nguon = h?.dang && h.dang[1] >= 2 ? { x: h.dang, ten: c.nap?.tenDang ? `dạng ${gon(c.nap.tenDang)}` : 'cùng dạng' } : h?.cd && h.cd[1] >= 2 ? { x: h.cd, ten: c.nap?.chuyenDe ? `chuyên đề ${gon(c.nap.chuyenDe)}` : 'cùng chuyên đề' } : null
  if (nguon && nguon.x[0] * 2 >= nguon.x[1]) dau.push(`Đúng ${nguon.x[0]}/${nguon.x[1]} lượt làm câu ${nguon.ten} trên app.`)
  else if (e.loai === 'da_dung') dau.push('Em đã tự làm đúng câu này trên app.')
  // 2) Lên bảng.
  const trongBuoi = c.lenTrongBuoi.get(e.sbd) ?? 0, ngay = ngayChuaLen(e, h, c.nowMs)
  if (trongBuoi > 0) dau.push('Các bạn đang chờ gọi đều đã lên bảng trong buổi này.')
  else if (ngay !== null && ngay >= 1) dau.push(`Chưa lên bảng ${ngay} ngày.`)
  else if (ngay === null && c.nap?.lbDu && h?.lb == null) dau.push('Chưa lên bảng lần nào trên app.')
  // 3) Dòng thêm: đội chưa ai lên, độ chăm, lần lên bảng đã đạt, thời gian gửi lượt này (KHÔNG nói đúng/sai).
  const doi = c.doiCua.get(e.sbd)
  if (doi != null && trongBuoi === 0 && (c.goiDoi.get(doi) ?? 0) === 0 && [...c.goiDoi.values()].some((n) => n > 0)) them.push(`${DOI_BPU[doi]?.ten ?? `Đội ${doi + 1}`} chưa có bạn lên bảng trong buổi này.`)
  if ((h?.ngay14 ?? 0) >= 7) them.push(`Học trên app ${h!.ngay14}/14 ngày qua.`)
  if (h?.lb && h.lb[1] >= 2 && h.lb[0] * 3 >= h.lb[1] * 2) them.push(`Lên bảng ${h.lb[1]} lần, đạt ${h.lb[0]} lần.`)
  const k = c.kiem[e.sbd]
  if (k) them.push(`Lượt này em gửi đáp án sau ${Math.max(1, Math.round(k[1]))} giây.`)
  const ra = [...dau, ...them].slice(0, 3)
  return ra.length >= 2 ? ra : []
}

/** Xếp lại danh sách ứng viên từng câu (phần tử [0] = em được gọi) + gắn `lyDoBpu`. Không bỏ em nào (thầy bấm đổi em vẫn đủ người). */
export function xepTheoBpu(ra: Map<string, EmChieu[]>, nap: NapBpu | undefined, v: LuotBpu, nowMs: number): Map<string, EmChieu[]> {
  const doiCua = new Map(v.ds.map((e) => [e.sbd, e.doi])), lenTrongBuoi = new Map(v.ds.map((e) => [e.sbd, e.daLenBang ?? 0])), goiDoi = new Map<number, number>()
  for (const e of v.ds) goiDoi.set(e.doi, (goiDoi.get(e.doi) ?? 0) + (e.daLenBang ?? 0))
  const hat = `${v.buoiId ?? ''}|${v.luot?.so ?? 0}`
  for (const [qid, list] of ra) {
    const kiem = v.luot?.qid === qid ? (v.luot.kiem ?? {}) : {}
    const c: BoiCanh = { nap, kiem, doiCua, lenTrongBuoi, goiDoi, nowMs }
    const coDung = list.some((e) => kiem[e.sbd]?.[0] === 1), coSai = list.some((e) => kiem[e.sbd]?.[0] === 0)
    // Khoảng 1/3 lượt (khi lớp có cả em đúng lẫn em sai): ưu tiên em sai để chữa.
    const uuTien = coDung && coSai && bam(hat) % 3 === 0 ? 0 : 1
    const nhom = (s: string): number => { const k = kiem[s]; return !k ? 2 : k[0] === uuTien ? 0 : 1 }
    const doiN = (s: string): number => { const d = doiCua.get(s); return d == null ? 0 : (goiDoi.get(d) ?? 0) }
    const diem = new Map(list.map((e) => [e.sbd, diemLichSu(e, c)]))
    const xep = [...list].sort((a, b) => (lenTrongBuoi.get(a.sbd) ?? 0) - (lenTrongBuoi.get(b.sbd) ?? 0) || doiN(a.sbd) - doiN(b.sbd) || nhom(a.sbd) - nhom(b.sbd)
      || diem.get(b.sbd)! - diem.get(a.sbd)! || bam(`${hat}|${a.sbd}`) - bam(`${hat}|${b.sbd}`))
    ra.set(qid, xep.map((e) => ({ ...e, lyDoBpu: lyDoBpu(e, c) })))
  }
  return ra
}
