// SỔ «LỬA HỌC THẬT» (thầy chốt duyệt 31/10 — docs/DE-XUAT-BI-CAM-XUC-3110.md mục 4.3): sổ NHỎ trên máy em, KHÔNG gọi máy chủ, KHÔNG đọc D1.
// Ghi 10 kết quả «được tính / chưa được tính» gần nhất HÔM NAY (đúng cờ `thuong.tinh` của lệnh answer mà màn làm chặng đã nhận) + giờ xong chặng làm thật
// gần nhất. Tách theo SBD + ngày Việt Nam: đổi em / qua 00:00 ⇒ sổ trống. Em đổi máy giữa ngày ⇒ sổ trống ⇒ chỉ mất phần «câu chưa được tính» (Lửa không
// giận oan). Máy chặn localStorage ⇒ đọc ra sổ trống, ghi thì bỏ qua — không bao giờ ném lỗi.
// Nằm trong mảnh `thuong-gon` (vite.config.ts) — mảnh «Trong» (đọc) và màn làm chặng (ghi) vốn cùng nạp ⇒ không thêm tệp, không thêm byte lượt mở app.
import { ngayVn } from './thuong-api'

export const KHOA_LUA_THAT = 'ddh.lua-that'
/** Số câu nộp gần nhất hôm nay mà Lửa xét (bước 2 của luật). */
export const SO_CAU_XET = 10
/** Một câu đã nộp: giờ nhận kết quả (ms) + có được tính không. */
export interface CauLuaThat { t: number; tinh: boolean }
export interface SoLuaThat {
  /** ≤ 10 câu nộp gần nhất hôm nay, cũ trước mới sau. */
  kq: CauLuaThat[]
  /** Giờ xong chặng LÀM THẬT gần nhất (≥ 2/3 số câu của chặng được tính, vd 4/6) — vắng ⇒ hôm nay chưa có. */
  xongThat?: number
}
type Luu = { s: string; n: string; k: [number, 0 | 1][]; x?: number }

const sach = (sbd: string | null | undefined): string => String(sbd ?? '').trim()
// Lộ trình vẽ lại nhiều lần ⇒ chỉ giải mã khi bản lưu đổi (cùng cách nangSoTuChangDangDo, máy yếu 30/10)
let nho: { raw: string | null; o: unknown } = { raw: null, o: null }
function doc(sbd: string, now: number): Luu {
  const trong: Luu = { s: sbd, n: ngayVn(now), k: [] }
  try {
    const raw = localStorage.getItem(KHOA_LUA_THAT)
    if (raw !== nho.raw) nho = { raw, o: JSON.parse(raw || 'null') }
    const o = nho.o as Luu | null
    if (!o || o.s !== sbd || o.n !== trong.n || !Array.isArray(o.k)) return trong
    const k = o.k.filter((x): x is [number, 0 | 1] => Array.isArray(x) && Number.isFinite(x[0]) && (x[1] === 0 || x[1] === 1)).slice(-SO_CAU_XET)
    return { s: sbd, n: trong.n, k, ...(Number.isFinite(o.x) ? { x: o.x } : {}) }
  } catch { return trong }
}
function ghi(o: Luu): void {
  try { localStorage.setItem(KHOA_LUA_THAT, JSON.stringify(o)) } catch { /* máy chặn lưu: Lửa chỉ theo giờ + số câu */ }
}

/** Đọc sổ của em hôm nay (giờ Việt Nam). Không có SBD / khác em / khác ngày / máy chặn ⇒ sổ trống. */
export function docLuaThat(sbd: string | null | undefined, now: number = Date.now()): SoLuaThat {
  const em = sach(sbd)
  if (!em) return { kq: [] }
  const o = doc(em, now)
  return { kq: o.k.map(([t, k]) => ({ t, tinh: k === 1 })), ...(o.x !== undefined ? { xongThat: o.x } : {}) }
}

/** Ghi MỘT câu vừa nộp (bản đầy đủ của máy chủ): `tinh` = `thuong.tinh`. Giữ đúng 10 câu gần nhất. */
export function ghiCauLua(sbd: string | null | undefined, tinh: boolean, now: number = Date.now()): void {
  const em = sach(sbd)
  if (!em) return
  const o = doc(em, now)
  o.k = [...o.k, [now, tinh ? 1 : 0] as [number, 0 | 1]].slice(-SO_CAU_XET)
  ghi(o)
}

/** Xong một chặng: được tính ≥ 2/3 số câu (4/6) ⇒ ghi giờ «xong chặng làm thật» (Lửa vui lại 30 phút). Trả true nếu đã ghi. */
export function ghiXongChangLua(sbd: string | null | undefined, soTinh: number, soCau: number, now: number = Date.now()): boolean {
  const em = sach(sbd)
  if (!em || !(soCau > 0) || soTinh * 3 < soCau * 2) return false
  const o = doc(em, now)
  o.x = now
  ghi(o)
  return true
}
