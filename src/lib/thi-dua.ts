// Ô "THI ĐUA HÔM NAY" (học sinh; thầy chốt 8A 21/09 13:36; đề DE-XUAT-THAN-THU-MOI-NGAY-2109.md ĐIỀU 8; mẫu docs/ban-ve-thi-dua-2109/). THUẦN: đọc CHẶT thân `POST /hs/thi-dua-hom-nay {token}` (Code 4) + suy "vừa vượt lên".
// Dạng trả: { lop, siSo, daHoc, top[≤3]{ten, soCau, chuoi, thu}, cuaEm{hang, soCau, themDeVuot{soCau, soBan}|null, nhomCuoi}, capNhatLuc }.
// Boss soát mẫu (21/09): `cuaEm.hang = null` khi em chưa làm câu nào (mọi em 0 câu đồng hạng — không in hạng bịa). `thu` = id thú (hoặc {pet|id, cap|level, ten|nickname}); không nhận ra ⇒ biểu tượng trung tính.
// Luật 8A: xếp theo SỰ CHĂM (không điểm); máy chủ KHÔNG trả tên em ngoài top 3; `nhomCuoi` chỉ của CHÍNH em. Thiếu/sai dạng ⇒ null ⇒ KHÔNG dựng ô (im lặng), không số bịa.
import { PETS } from '../game/than-thu-v2/core'

export interface ThuBan {
  /** Chỉ số thú (0..7) trong PETS; null = chưa chọn thú / không nhận ra ⇒ hình trung tính. */
  chiSo: number | null
  cap: number
  ten: string
}
export interface BanTop {
  ten: string
  soCau: number
  chuoi: number
  thu: ThuBan
}
export interface ThiDua {
  lop: string
  siSo: number
  daHoc: number
  top: BanTop[]
  cuaEm: { hang: number | null; soCau: number; themDeVuot: { soCau: number; soBan: number } | null; nhomCuoi: boolean }
  capNhatLuc: string
}
const laDoiTuong = (x: unknown): x is Record<string, unknown> => x !== null && typeof x === 'object' && !Array.isArray(x)
const nguyen = (x: unknown): number | null => (typeof x === 'number' && Number.isInteger(x) && x >= 0 ? x : null)
const chuoi = (x: unknown, tran: number): string => (typeof x === 'string' ? x.replace(/\s+/g, ' ').trim().slice(0, tran) : '')

/** `thu` của bạn trong bục: id thú (chuỗi) hoặc đối tượng {pet|id, cap|level, ten|nickname}. */
export function docThuBan(x: unknown): ThuBan {
  const id = typeof x === 'string' ? x.trim() : laDoiTuong(x) ? chuoi(x.pet ?? x.id, 40) : ''
  const chiSo = id ? PETS.findIndex((p) => p.id === id) : -1
  const cap = laDoiTuong(x) ? Math.max(1, Math.min(120, nguyen(x.cap ?? x.level) ?? 1)) : 1
  const ten = laDoiTuong(x) ? chuoi(x.ten ?? x.nickname, 24) : chiSo < 0 ? chuoi(x, 24) : ''
  return { chiSo: chiSo >= 0 ? chiSo : null, cap, ten: ten || (chiSo >= 0 ? PETS[chiSo]!.name : '') }
}

export function docThiDua(raw: unknown): ThiDua | null {
  if (!laDoiTuong(raw) || raw.ok === false) return null
  const siSo = nguyen(raw.siSo)
  const daHoc = nguyen(raw.daHoc)
  if (siSo === null || siSo < 1 || daHoc === null || daHoc > siSo) return null
  const e = laDoiTuong(raw.cuaEm) ? raw.cuaEm : null
  const soCauEm = e ? nguyen(e.soCau) : null
  if (!e || soCauEm === null) return null
  // Em chưa làm câu nào ⇒ KHÔNG có hạng (máy chủ trả null). Có câu mà hạng hỏng ⇒ sai dạng ⇒ null.
  const hangRaw = nguyen(e.hang)
  const hang = soCauEm === 0 ? null : hangRaw
  if (soCauEm > 0 && (hang === null || hang < 1 || hang > siSo)) return null
  const top: BanTop[] = []
  for (const b of Array.isArray(raw.top) ? raw.top : []) {
    if (!laDoiTuong(b)) continue
    const ten = chuoi(b.ten, 30)
    const soCau = nguyen(b.soCau)
    if (!ten || soCau === null) continue
    top.push({ ten, soCau, chuoi: nguyen(b.chuoi) ?? 0, thu: docThuBan(b.thu) })
    if (top.length >= 3) break
  }
  const v = laDoiTuong(e.themDeVuot) ? e.themDeVuot : null
  const soCauThem = v ? nguyen(v.soCau) : null
  const soBan = v ? nguyen(v.soBan) : null
  return {
    lop: chuoi(raw.lop, 40),
    siSo,
    daHoc,
    top,
    cuaEm: { hang, soCau: soCauEm, themDeVuot: soCauThem !== null && soCauThem > 0 && soBan !== null && soBan > 0 ? { soCau: soCauThem, soBan } : null, nhomCuoi: e.nhomCuoi === true },
    capNhatLuc: chuoi(raw.capNhatLuc, 40),
  }
}

/** Bục 3 vị trí: chính em (hạng ≤ 3) đứng đúng chỗ, tên "Em"; các vị trí thiếu (đầu ngày ít bạn) để trống. */
export interface OBuc {
  hang: 1 | 2 | 3
  ten: string
  soCau: number
  chuoi: number
  thu: ThuBan
  laEm: boolean
}
export function dungBuc(t: ThiDua): (OBuc | null)[] {
  return ([1, 2, 3] as const).map((hang) => {
    const b = t.top[hang - 1]
    if (!b) return null
    return { hang, ten: t.cuaEm.hang === hang ? 'Em' : b.ten, soCau: b.soCau, chuoi: b.chuoi, thu: b.thu, laEm: t.cuaEm.hang === hang }
  })
}

/** Đầu ngày: chưa bạn nào học (không ai có câu). */
export const chuaAiHoc = (t: ThiDua): boolean => t.daHoc === 0 && t.top.every((b) => b.soCau === 0)

/** "Vừa vượt lên": so bục trước và bục nay — một bạn (KHÔNG phải em) đứng cao hơn trước (hoặc mới vào bục). Trả câu nói thật hoặc null. Bạn tăng hạng do em xuống hạng không tính. */
export function vuaVuotLen(truoc: ThiDua | null, nay: ThiDua): string | null {
  if (!truoc) return null
  const hangTruoc = new Map(truoc.top.map((b, i) => [b.ten, i + 1] as const))
  let tot: { ten: string; hang: number } | null = null
  nay.top.forEach((b, i) => {
    const hang = i + 1
    if (nay.cuaEm.hang === hang) return // em: không tự nói "vừa vượt lên" về mình ở đây
    const cu = hangTruoc.get(b.ten)
    if ((cu === undefined || cu > hang) && (!tot || hang < tot.hang)) tot = { ten: b.ten.replace(/\s+\S\.$/, ''), hang }
  })
  return tot ? `${(tot as { ten: string }).ten} vừa vượt lên hạng ${(tot as { hang: number }).hang}` : null
}

/** Dòng vị trí của em. */
export function chuHangEm(t: ThiDua): { tieuDe: string; phu: string; them: string; gon: string } {
  const e = t.cuaEm
  const them = e.themDeVuot ? `Làm thêm ${e.themDeVuot.soCau} câu là vượt ${e.themDeVuot.soBan} bạn` : ''
  if (e.hang === null) {
    // Chưa làm câu nào ⇒ KHÔNG in hạng (mọi em 0 câu đồng hạng).
    const tieuDe = 'Em chưa vào bảng hôm nay'
    return { tieuDe, phu: `${t.daHoc} bạn đã vào`, them, gon: `${tieuDe} · ${t.daHoc} bạn đã vào` }
  }
  const tieuDe = e.hang === 1 && t.daHoc > 0 ? 'Em đang dẫn đầu lớp' : `Em đang hạng ${e.hang} trong ${t.siSo} bạn`
  const phu = e.soCau > 0 ? `Em đã làm ${e.soCau} câu hôm nay` : 'Em chưa có câu nào hôm nay'
  return { tieuDe, phu, them, gon: `${tieuDe} · đã làm ${e.soCau} câu hôm nay` }
}
