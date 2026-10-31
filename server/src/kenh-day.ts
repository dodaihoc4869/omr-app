// KÊNH ĐẨY HAI THIẾT BỊ (thầy 31/10: «Làm luôn kênh đẩy» — «App ở hai thiết bị đã đồng bộ với nhau chưa, tức thì ko»). Em mở app trên 2 máy: máy A làm xong câu /
// chặng / sửa lỗi / EXP đổi ⇒ máy B (đang mở) đọc lại trong ~1–2 giây, không chờ quay lại app hay nhịp nền (vài phút).
// Cách làm: WebSocket NGỦ ĐÔNG trên CHÍNH ngăn riêng của em (`NganHocSinh`, ngan-hoc-sinh.ts) — mọi lệnh làm bài của em đã đi qua ngăn ấy. Lệnh trong `LENH_DOI` có
// câu GHI D1 (bộ gom báo `khiGhi`) ⇒ sau `CHO_PHAT_MS` ngăn gửi `{"t":"doi","k":[…]}` tới mọi máy khác của em (trừ máy vừa làm — nhận diện bằng đuôi chữ ký token,
// mỗi lần đăng nhập một khác). Tin không mang dữ liệu: máy kia tự đọc lại bằng ĐÚNG lệnh có xác thực sẵn có. 0 truy vấn D1 cho việc đẩy; kết nối ngủ đông
// (ping `p` → `o` máy chủ tự trả, không đánh thức ngăn) ⇒ 100.000 em giữ kết nối không tốn gì khi yên.
// Vé vào kênh: `POST /hs/kenh-ve` (token trong thân, kiểm chữ ký + hạn, 0 lệnh D1) ⇒ vé HMAC 2 phút; `GET /hs/kenh?ve=…` (nâng cấp WebSocket) — token không bao giờ
// nằm trên đường dẫn. Công tắc: biến Worker `TAT_KENH_DAY` (hoặc tắt ngăn `TAT_NGAN_HS`) ⇒ không phát vé, cửa trả 410, ngăn thôi phát ⇒ app y như cũ (nhịp nền).
import type { Env } from './kieu'
import { gameSbdDaKy } from './game-v2-auth'

/** Đường nâng cấp WebSocket của kênh (Worker → ngăn của em). */
export const DUONG_KENH = '/hs/kenh'
/** Lệnh xin vé (đi qua ngăn như mọi lệnh `/hs/…`). */
export const DUONG_VE_KENH = '/hs/kenh-ve'
/** Gom tin: các câu ghi trong khoảng này (một lần nộp có thể ghi nhiều đợt, cả việc phụ sau phản hồi) ⇒ MỘT tin; máy kia đọc lúc máy chủ đã ghi xong. */
export const CHO_PHAT_MS = 1200
/** Tối đa kết nối kênh mỗi em (nhiều thẻ / máy) — quá ⇒ đóng kết nối cũ nhất. */
export const TOI_DA_KET_NOI = 8
/** Vé sống 2 phút (máy em dùng ngay khi nhận). */
export const HAN_VE_KENH_MS = 2 * 60_000

/**
 * Lệnh LÀM ĐỔI tiến độ của em (đường → loại tin). Chỉ những lệnh EM CHỦ ĐỘNG làm — KHÔNG có lệnh đọc / làm mới (Sảnh, thưởng, EXP `academic-sync`…): máy kia
 * đọc lại bằng chính các lệnh ấy, nếu chúng cũng phát tin thì hai máy đẩy qua đẩy lại không dứt.
 */
export const LENH_DOI: Readonly<Record<string, string>> = {
  '/game-v2/answer': 'hoc', '/game-v2/complete': 'hoc', '/game-v2/hoc-tap-kiem-nop': 'hoc',
  '/game-v2/hoc-tap-ktcn-nop': 'kt', '/game-v2/hoc-tap-ktcn-chot-chang': 'kt',
  '/hs/chua-cau-sai/gon-nop': 'sua', '/hs/chua-cau-sai/nop-item': 'sua',
  '/hs/on-lai/nop': 'hoc', '/hs/luyen-nen/nop': 'hoc', '/hs/thu-thach-hom-nay/nop': 'hoc', '/hs/hoi-tro-ly/kiem/nop': 'hoc', '/hs/tu-luyen/nop': 'hoc',
  '/hs/thuong/mua-binh': 'thuong', '/hs/thuong/mo-ruong': 'thuong', '/hs/thuong/cuoc': 'thuong', '/hs/diem-danh': 'thuong',
  '/mom/submit': 'mom',
}
export const loaiLenhDoi = (duong: string): string | null => LENH_DOI[duong] ?? null

/** Dấu máy: đuôi chữ ký HMAC của token (hex) — mỗi lần đăng nhập một khác, không dựng lại được token. Không có ⇒ ''. */
export function dauMay(token: unknown): string {
  if (typeof token !== 'string') return ''
  const ky = token.slice(token.indexOf('.') + 1)
  return /^[0-9a-f]{16,}$/.test(ky) ? ky.slice(-16) : ''
}

export const kenhDayBat = (env: Env): boolean => !!env.NGAN_HS && !env.TAT_NGAN_HS && !env.TAT_KENH_DAY && !!env.MA_BI_MAT

// ---------------------------------------------------------------- vé
const TIEN_TO = 'kenh-day|'
const enc = new TextEncoder()
const b64 = (b: Uint8Array) => { let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const tuB64 = (s: string) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b }
const khoa = (biMat: string) => crypto.subtle.importKey('raw', enc.encode(TIEN_TO + biMat), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])

/** Vé: s = SBD, m = dấu máy, h = hạn (ms). */
export interface VeKenh { s: string; m: string; h: number }

export async function kyVeKenh(biMat: string, ve: VeKenh): Promise<string> {
  const than = b64(enc.encode(JSON.stringify({ s: ve.s, m: ve.m, h: ve.h })))
  return `${than}.${b64(new Uint8Array(await crypto.subtle.sign('HMAC', await khoa(biMat), enc.encode(TIEN_TO + than))))}`
}

export async function kiemVeKenh(biMat: string, chuoi: unknown, nay = Date.now()): Promise<VeKenh | null> {
  if (!biMat || typeof chuoi !== 'string' || chuoi.length > 400) return null
  const [than, ky] = chuoi.split('.')
  if (!than || !ky) return null
  try {
    if (!(await crypto.subtle.verify('HMAC', await khoa(biMat), tuB64(ky), enc.encode(TIEN_TO + than)))) return null
    const v = JSON.parse(new TextDecoder().decode(tuB64(than))) as Partial<VeKenh>
    if (typeof v.s !== 'string' || !/^[0-9A-Za-z_-]{1,40}$/.test(v.s) || typeof v.h !== 'number' || v.h < nay) return null
    return { s: v.s, m: typeof v.m === 'string' ? v.m : '', h: v.h }
  } catch { return null }
}

/** `POST /hs/kenh-ve` — token game của em (kiểm chữ ký + hạn như chấm nhanh, 0 lệnh D1). Kênh tắt ⇒ `{ok:false, tat:true}` (máy em thôi hẳn, dùng nhịp nền). */
export async function kenhVe(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (!kenhDayBat(env)) return { ok: false, tat: true }
  let sbd: string
  try { sbd = await gameSbdDaKy(env, b) } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'Phiên game không hợp lệ.' } }
  return { ok: true, ve: await kyVeKenh(env.MA_BI_MAT, { s: sbd, m: dauMay(b.token), h: Date.now() + HAN_VE_KENH_MS }) }
}
