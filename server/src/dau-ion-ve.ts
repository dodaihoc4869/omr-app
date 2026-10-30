// VÉ VÀO SẢNH ĐẤU «Đấu Nguyên Tử» + cửa Worker → phòng đấu. Vé = HMAC-SHA256 bằng MA_BI_MAT (tiền tố riêng `dau-ion|`, không lẫn token game/thi),
// do lệnh vào thi phát ở nhánh phòng chờ (`cach: 'cho'`) từ dữ liệu ĐÃ đọc sẵn ⇒ 0 lệnh D1 thêm. Phòng đấu chỉ kiểm chữ ký, không đọc D1.
// Công tắc: biến Worker `TAT_DAU_ION` có giá trị ⇒ không phát vé, cửa trả 410, phòng đang mở bị đóng ⇒ máy em chỉ còn «Tập với A.I» (chạy cục bộ).
import type { Env } from './kieu'
import type { VeDau } from './dau-ion-phong'

const TIEN_TO = 'dau-ion|'
/** Vé sống 2 giờ (dài hơn mọi phòng chờ). */
export const HAN_VE_MS = 2 * 60 * 60 * 1000
const enc = new TextEncoder()
const b64 = (b: Uint8Array) => { let s = ''; for (const x of b) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const tuB64 = (s: string) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); const b = new Uint8Array(t.length); for (let i = 0; i < t.length; i++) b[i] = t.charCodeAt(i); return b }

async function khoa(biMat: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', enc.encode(TIEN_TO + biMat), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'])
}

export async function kyVeDau(biMat: string, ve: VeDau): Promise<string> {
  const than = b64(enc.encode(JSON.stringify({ c: ve.c, s: ve.s, t: ve.t, h: ve.h })))
  const ky = new Uint8Array(await crypto.subtle.sign('HMAC', await khoa(biMat), enc.encode(TIEN_TO + than)))
  return `${than}.${b64(ky)}`
}

export async function kiemVeDau(biMat: string, chuoi: unknown, nay = Date.now()): Promise<VeDau | null> {
  if (!biMat || typeof chuoi !== 'string' || chuoi.length > 600) return null
  const [than, ky] = chuoi.split('.')
  if (!than || !ky) return null
  try {
    const dung = await crypto.subtle.verify('HMAC', await khoa(biMat), tuB64(ky), enc.encode(TIEN_TO + than))
    if (!dung) return null
    const v = JSON.parse(new TextDecoder().decode(tuB64(than))) as VeDau
    if (typeof v.c !== 'string' || typeof v.s !== 'string' || typeof v.h !== 'number' || v.h < nay) return null
    return { c: v.c, s: v.s, t: typeof v.t === 'string' ? v.t : '', h: v.h }
  } catch { return null }
}

/** Tên gọi = hai chữ cuối của họ tên trong danh sách lớp (đúng kiểu chip trên màn Chiếu mã của thầy), tối đa 16 ký tự. */
export function tenGoi(hoTen: unknown): string {
  const t = String(hoTen ?? '').trim().split(/\s+/).filter(Boolean)
  return (t.length >= 3 ? t.slice(-2) : t).join(' ').slice(0, 16)
}

export const dauIonBat = (env: Env): boolean => !!env.PHONG_DAU_ION && !env.TAT_DAU_ION && !!env.MA_BI_MAT

/** Vé cho em đang ở phòng chờ; công tắc tắt / thiếu binding ⇒ undefined (máy em hiểu là chỉ Tập với A.I). */
export async function veDauChoEm(env: Env, maCa: string, sbd: string, hoTen: unknown): Promise<string | undefined> {
  if (!dauIonBat(env) || !maCa || !sbd) return undefined
  try { return await kyVeDau(env.MA_BI_MAT, { c: maCa, s: sbd, t: tenGoi(hoTen), h: Date.now() + HAN_VE_MS }) } catch { return undefined }
}

const phongCua = (env: Env, maCa: string) => env.PHONG_DAU_ION!.get(env.PHONG_DAU_ION!.idFromName(`dau-ion:${maCa}`), { locationHint: 'apac' })

/** Thầy bấm Bắt đầu thi ⇒ phòng đấu của ca báo mọi máy rồi đóng (lớp chặn thứ hai, cạnh việc máy em tự tháo game khi thấy ca bắt đầu). */
export async function dongPhongDau(env: Env, maCa: string): Promise<void> {
  if (!env.PHONG_DAU_ION || !maCa) return
  try { await phongCua(env, maCa).fetch(new Request('https://phong-dau/dong', { method: 'POST' })) } catch { /* phòng chưa từng mở / lỗi mạng nội bộ: bỏ qua */ }
}

/** `GET /dau-ion/<mã ca>` (nâng cấp WebSocket) ⇒ Durable Object của ca. Vé gửi trong gói đầu `{t:'vao', ve}`, không nằm trên đường dẫn. */
export async function vaoPhongDau(req: Request, env: Env): Promise<Response> {
  const maCa = decodeURIComponent(new URL(req.url).pathname.slice('/dau-ion/'.length)).trim()
  if (!dauIonBat(env)) return new Response('Đấu Nguyên Tử đang tắt', { status: 410 })
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(maCa)) return new Response('Mã ca không hợp lệ', { status: 400 })
  if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('Cần WebSocket', { status: 426 })
  const h = new Headers(req.headers)
  h.set('x-ma-ca', maCa)
  return phongCua(env, maCa).fetch(new Request(req.url, { method: 'GET', headers: h }))
}
