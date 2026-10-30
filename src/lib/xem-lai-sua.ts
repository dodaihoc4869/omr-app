// XEM LẠI CÂU SỬA TỨC THÌ (thầy 29/10 «Bấm vào để xem lại chưa tức thì»).
// Câu vừa sửa XONG (đã khép hôm nay: tự sửa / xong phần / đã ra lời giải) ⇒ máy em nhớ NGAY kết quả đầy đủ (đáp án + lời giải) của câu ấy; bấm «Xem lại» trong cùng ngày ⇒ màn dựng thẳng
// ở lần vẽ đầu, KHÔNG gọi máy chủ (mo-dot + gon-mo mất 3–11 đợt D1). Chỉ là bản sao đúng thứ máy chủ vừa trả cho em (`daKhepHomNay`) — đáp án đã về máy sau khi em nộp, không thêm gì.
// Hết ngày VN ⇒ bỏ (sang ngày mới câu có thể quay lại cần sửa). Tối đa TOI_DA câu mỗi em; không đọc / ghi được bộ nhớ ⇒ bỏ qua, màn mở như cũ.
import type { KetQuaGon } from './chua-cau-sai-api'

const TOI_DA = 40
const khoaKho = (sbd: string) => `omr_xem_lai_sua_${sbd}`
const ngayVn = (nayMs: number) => new Date(nayMs + 7 * 3600_000).toISOString().slice(0, 10)
type Kho = { n: string; ds: { q: string; dau: KetQuaGon }[] }

function doc(sbd: string, nayMs: number): Kho {
  try {
    const k = JSON.parse(localStorage.getItem(khoaKho(sbd)) || 'null') as Kho | null
    if (k && k.n === ngayVn(nayMs) && Array.isArray(k.ds)) return k
  } catch { /* hỏng / không đọc được ⇒ kho trống */ }
  return { n: ngayVn(nayMs), ds: [] }
}

/** Nhớ kết quả ĐÃ KHÉP của câu gốc `qid` (cùng dạng máy chủ trả khi mở lại câu đã khép). Chỉ nhận khi có `chiTiet` (đáp án + lời giải) và `ket` khép. */
export function luuXemLai(sbd: string, qid: string, dau: KetQuaGon, nayMs = Date.now()): void {
  if (!sbd || !qid || !dau.ok || !dau.dotId || !dau.chiTiet || !dau.ket || dau.ket === 'goi_y') return
  try {
    const k = doc(sbd, nayMs)
    const ds = [...k.ds.filter((x) => x.q !== qid), { q: qid, dau: { ...dau, daKhepHomNay: true } }].slice(-TOI_DA)
    localStorage.setItem(khoaKho(sbd), JSON.stringify({ n: k.n, ds }))
  } catch { /* đầy bộ nhớ / bị chặn: bỏ qua */ }
}

/** Kết quả đã khép hôm nay của câu gốc `qid` — null nếu không có (màn mở như cũ). */
export function docXemLai(sbd: string, qid: string, nayMs = Date.now()): KetQuaGon | null {
  if (!sbd || !qid) return null
  return doc(sbd, nayMs).ds.find((x) => x.q === qid)?.dau ?? null
}

/** Bản lưu trạng thái câu đang sửa dở (nháp đang chọn, gợi ý lần 1, hoặc đã sang bước làm lại lần 2) — thoát bất thình lình mở lại đúng bước 0ms. */
export interface ChuaGonDang {
  ngay: string
  dotId: string
  ban?: string
  tra: string
  mo: KetQuaGon
  kq: KetQuaGon | null
  sk2: { tem: string; lan: number } | null
  luc: number
}
const HAN_CHUA_DANG_MS = 35 * 60_000
const khoaDang = (sbd: string, qid: string) => `omr_chua_gon_dang_${sbd}_${qid}`
const khoaChon = (sbd: string) => `omr_tu_sua_chon_${sbd}`

export function luuChuaGonDang(sbd: string, qid: string, d: Omit<ChuaGonDang, 'ngay'>, nayMs = Date.now()): void {
  if (!sbd || !qid || !d.dotId || !d.mo?.ok) return
  try {
    localStorage.setItem(khoaDang(sbd, qid), JSON.stringify({ ...d, ngay: ngayVn(nayMs) }))
  } catch { /* bỏ qua */ }
}

export function docChuaGonDang(sbd: string, qid: string, nayMs = Date.now()): ChuaGonDang | null {
  if (!sbd || !qid) return null
  try {
    const d = JSON.parse(localStorage.getItem(khoaDang(sbd, qid)) || 'null') as ChuaGonDang | null
    if (!d || d.ngay !== ngayVn(nayMs) || !d.dotId || !d.mo?.ok || nayMs - (d.luc || 0) > HAN_CHUA_DANG_MS) return null
    return d
  } catch {
    return null
  }
}

export function xoaChuaGonDang(sbd: string, qid: string): void {
  if (!sbd || !qid) return
  try { localStorage.removeItem(khoaDang(sbd, qid)) } catch { /* bỏ qua */ }
}

export function luuTuSuaChon(sbd: string, chon: { qid: string; ten?: string; kiemHoiThay?: boolean } | null, nayMs = Date.now()): void {
  if (!sbd) return
  try {
    if (chon?.qid) localStorage.setItem(khoaChon(sbd), JSON.stringify({ ngay: ngayVn(nayMs), chon, luc: nayMs }))
    else localStorage.removeItem(khoaChon(sbd))
  } catch { /* bỏ qua */ }
}

export function docTuSuaChon(sbd: string, nayMs = Date.now()): { qid: string; ten?: string; kiemHoiThay?: boolean } | null {
  if (!sbd) return null
  try {
    const o = JSON.parse(localStorage.getItem(khoaChon(sbd)) || 'null') as { ngay?: string; chon?: { qid: string; ten?: string; kiemHoiThay?: boolean }; luc?: number } | null
    if (!o || o.ngay !== ngayVn(nayMs) || !o.chon?.qid || nayMs - (o.luc || 0) > 2 * 3600_000) return null
    return o.chon
  } catch {
    return null
  }
}
