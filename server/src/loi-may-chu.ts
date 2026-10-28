// LỖI MÁY CHỦ TRẢ CHO MÁY EM (thầy chụp 28/10: màn Kiểm tra ôn tập hiện «D1_ERROR: Currently processing a long-running export.»).
// Luật: chữ lỗi gốc (D1, SQLite, lỗi JS) CHỈ ghi log máy chủ; máy em nhận mã lỗi + câu tiếng Việt chung. THUẦN, không chạm D1.
// - Lỗi D1 TẠM THỜI (đang export, quá tải, hết giờ chờ, vượt hạn lưu trữ, D1_ERROR chung) ⇒ HTTP 503 + `{ maLoi: 'MAY_CHU_BAN', thuLaiSau: 2 }`.
// - Lỗi kỹ thuật khác ⇒ câu chung tiếng Việt, giữ HTTP cũ.
// - Câu tiếng Việt máy chủ CỐ Ý viết cho em (mọi `error: '…'` trong server/src đều có dấu) và mã có tên dạng `het_tran` ⇒ giữ nguyên.

export const MA_MAY_CHU_BAN = 'MAY_CHU_BAN'
export const THU_LAI_SAU_GIAY = 2
export const CHU_MAY_CHU_BAN = 'Máy chủ đang bận. Thử lại sau ít giây.'
export const CHU_LOI_CHUNG = 'Máy chủ gặp trục trặc. Thử lại sau ít phút.'

/** D1 tạm từ chối truy vấn — thử lại là qua. */
const RE_TAM = /long-running export|overloaded|timed? ?out|timeout|storage operation exceeded|D1_ERROR|D1 DB is|Network connection lost|reset because its code was updated|too many requests|SQLITE_BUSY|database is locked|internal error/i
/** Lỗi do mã / schema: thử lại vô ích ⇒ không coi là bận. */
const RE_LOI_MA = /no such (table|column)|has no column|constraint failed|syntax error|SQLITE_ERROR|SQLITE_CONSTRAINT|SQLITE_MISMATCH|too many SQL variables/i
/** Dấu hiệu chữ kỹ thuật (kể cả lẫn trong câu tiếng Việt). */
const RE_KY_THUAT = /D1_|SQLITE|no such (table|column)|constraint failed|TypeError|ReferenceError|RangeError|SyntaxError|Cannot read|Cannot set|is not a function|is not defined|is not iterable|Unexpected (token|end)|fetch failed|long-running|overloaded|Network connection lost|\bat \S+ \(|\[object /
/** Có chữ cái tiếng Việt có dấu. */
const RE_CHU_VIET = /[À-ỹĐđ]/
const RE_MA = /^[a-z0-9_]{1,40}$/

export type KieuLoi = 'ban' | 'chung' | 'giu'

/** Phân loại một chữ lỗi: `ban` (D1 tạm thời ⇒ 503), `chung` (kỹ thuật ⇒ câu chung), `giu` (câu Việt / mã có tên ⇒ giữ). */
export function phanLoaiLoi(chu: string): KieuLoi {
  const s = chu.trim()
  if (!s) return 'giu'
  if (RE_TAM.test(s) && !RE_LOI_MA.test(s)) return 'ban'
  if (RE_MA.test(s)) return 'giu'
  if (RE_CHU_VIET.test(s) && !RE_KY_THUAT.test(s)) return 'giu'
  return 'chung'
}

/**
 * Làm sạch thân `ok:false` TRƯỚC khi gửi: trả thân mới + mã HTTP (503 khi máy chủ bận). Thân không phải lỗi / lỗi đã sạch ⇒ trả nguyên (cùng tham chiếu).
 * Chữ gốc được ghi `console.error` một lần để thầy/Boss tra log.
 */
export function lamSachThanLoi<T>(data: T, status: number): { data: T; status: number } {
  const o = data as Record<string, unknown> | null
  if (!o || typeof o !== 'object' || o.ok !== false) return { data, status }
  let kieu: KieuLoi = 'giu'
  let goc = ''
  for (const k of ['error', 'loi'] as const) {
    const v = o[k]
    if (typeof v !== 'string') continue
    const kk = phanLoaiLoi(v)
    if (kk === 'giu') continue
    goc = v
    if (kk === 'ban' || kieu === 'giu') kieu = kk
  }
  if (kieu === 'giu' && o.maLoi !== MA_MAY_CHU_BAN) return { data, status }
  if (goc) console.error('[loi-may-chu] chữ gốc (không gửi máy em):', goc.slice(0, 500))
  const ban = kieu === 'ban' || o.maLoi === MA_MAY_CHU_BAN
  const chu = ban ? CHU_MAY_CHU_BAN : CHU_LOI_CHUNG
  const moi: Record<string, unknown> = { ...o }
  for (const k of ['error', 'loi'] as const) if (typeof moi[k] === 'string' && phanLoaiLoi(moi[k] as string) !== 'giu') moi[k] = chu
  if (typeof moi.error !== 'string') moi.error = chu
  if (ban) { moi.maLoi = MA_MAY_CHU_BAN; moi.thuLaiSau = THU_LAI_SAU_GIAY }
  return { data: moi as T, status: ban ? 503 : status }
}

/** Lỗi ném ra (chưa bắt) ⇒ thân `ok:false` sạch + mã HTTP. `ma` có tên (vd het_tran) giữ nguyên. */
export function thanTuLoiNem(e: unknown): { data: Record<string, unknown>; status: number } {
  const ma = (e as { ma?: unknown } | null)?.ma
  const chu = e instanceof Error ? e.message : typeof e === 'string' ? e : ''
  const kieu = phanLoaiLoi(chu)
  if (kieu !== 'giu' || !chu) console.error('[loi-may-chu] lỗi chưa bắt (không gửi máy em):', e)
  const base = { ok: false, ...(typeof ma === 'string' ? { ma } : {}) }
  if (kieu === 'ban') return { data: { ...base, error: CHU_MAY_CHU_BAN, maLoi: MA_MAY_CHU_BAN, thuLaiSau: THU_LAI_SAU_GIAY }, status: 503 }
  return { data: { ...base, error: kieu === 'giu' && chu ? chu : CHU_LOI_CHUNG }, status: 500 }
}
