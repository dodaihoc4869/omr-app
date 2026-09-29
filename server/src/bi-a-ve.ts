// BI-A PHẢN ỨNG GĐ2 · VÉ KÝ (HMAC-SHA256 bằng `MA_BI_MAT`, tiền tố riêng 'bi-a|' nên không lẫn với token game/phụ huynh).
// Lệnh HTTP cấp vé; phòng đấu (Durable Object) chỉ KIỂM CHỮ KÝ — không đọc D1 lúc em vào bàn (đặc tả: D1 mỗi ván ≤ số câu đã trả lời + 2).
//   · 'sanh' — được vào bàn `van` (chủ bàn tạo bàn / nhận lời mời / nhập mã bàn).
//   · 'ghe'  — phòng cấp khi Bắt đầu: em ngồi ghế `ghe` của bàn ⇒ lệnh `bia-xep-ban` xếp câu cho đúng các bi ghế đó.
//   · 'tran' — `bia-xep-ban` cấp: câu của từng bi + Câu chốt + phiên (phòng đối chiếu `game_v2_attempt` khi em báo trả lời).
//   · 'cau'  — `bia-doi-cau` cấp: câu thay cho một bi sau câu sai.
import type { Env } from './kieu'
import type { CheDo } from '../../src/game/bi-a/luat'
import type { CauBi, LoaiBan } from '../../src/game/bi-a/tran'

export interface VeSanh { k: 'sanh'; van: string; sbd: string; ten: string; cheDo: CheDo; loai: LoaiBan; chu: boolean; ma: string | null; het: number }
export interface VeGhe { k: 'ghe'; van: string; ghe: number; sbd: string; cheDo: CheDo; loai: LoaiBan; het: number }
export interface VeTran { k: 'tran'; van: string; ghe: number; sbd: string; session: string | null; bi: Record<string, CauBi>; chot: CauBi | null; het: number }
export interface VeCau { k: 'cau'; van: string; sbd: string; ki: string; cau: CauBi | null; het: number }
export type Ve = VeSanh | VeGhe | VeTran | VeCau

const enc = new TextEncoder()
const b64 = (u: Uint8Array) => { let s = ''; for (const x of u) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const tuB64 = (s: string) => { const t = atob(s.replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(t, (c) => c.charCodeAt(0)) }
const khoaCache = new Map<string, Promise<CryptoKey>>()
function khoa(env: Env): Promise<CryptoKey> {
  const bm = String(env.MA_BI_MAT ?? '')
  if (!bm) return Promise.reject(new Error('Máy chủ chưa đặt mã bí mật.'))
  let k = khoaCache.get(bm)
  if (!k) { k = crypto.subtle.importKey('raw', enc.encode(`bi-a|${bm}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']); khoaCache.set(bm, k) }
  return k
}
export async function kyVe(env: Env, ve: Ve): Promise<string> {
  const than = b64(enc.encode(JSON.stringify(ve)))
  const ky = new Uint8Array(await crypto.subtle.sign('HMAC', await khoa(env), enc.encode(than)))
  return `${than}.${b64(ky)}`
}
/** Đọc vé: sai chữ ký / sai loại / hết hạn ⇒ ném lỗi (chữ cho em). */
export async function docVe<K extends Ve['k']>(env: Env, chu: unknown, loai: K, nowMs = Date.now()): Promise<Extract<Ve, { k: K }>> {
  const s = typeof chu === 'string' ? chu : ''
  const [than, ky] = s.split('.')
  if (!than || !ky) throw new Error('Vé vào bàn không hợp lệ.')
  let hop = false
  try { hop = await crypto.subtle.verify('HMAC', await khoa(env), tuB64(ky), enc.encode(than)) } catch { hop = false }
  if (!hop) throw new Error('Vé vào bàn không hợp lệ.')
  let o: Ve
  try { o = JSON.parse(new TextDecoder().decode(tuB64(than))) as Ve } catch { throw new Error('Vé vào bàn không hợp lệ.') }
  if (o.k !== loai) throw new Error('Vé vào bàn không hợp lệ.')
  if (!(o.het > nowMs)) throw new Error('Vé vào bàn đã hết hạn. Em vào lại Sảnh Bi-a.')
  return o as Extract<Ve, { k: K }>
}
