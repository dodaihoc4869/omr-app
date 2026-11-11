// XEM LẠI LIVE — MÁY EM: lớp gọi máy chủ (hợp đồng src/lib/live/xem-lai-kieu.ts, đặc tả mục 4.7). CHỈ ba lệnh:
//   GET /hs/live-ds            ⇒ `TraLiveDsHs`   (gọi khi em mở «Thêm» lần đầu, nhớ 10 phút)
//   GET /hs/live-buoi?id=      ⇒ `TraLiveBuoiHs` (kết quả RIÊNG của em; 404 = thầy đã gỡ / không có quyền)
//   GET /live-tep/<id>/<tệp>?ve= (buoi.json · net.bin · tieng.mp3; có Range ⇒ 206)
// AN TOÀN: không gọi lệnh nào khác để lấy đề / đáp án — trang chỉ hiện câu có trong `buoi.json` (máy chủ đã lọc câu chưa mở đáp án).
// Token của em đi ở tham số `token` (lệnh GET không có thân). Địa chỉ máy chủ: cùng đường mọi lệnh học sinh (`layDiaChiMayChu`).
import { layDiaChiMayChu } from '../../../lib/dia-chi-may-chu'
import { TEP_LIVE, type BuoiLiveJson, type TepLive, type TraLiveBuoiHs, type TraLiveDsHs } from '../../../lib/live/xem-lai-kieu'
import { docDaMo, docDsLuu, khoaEm, luuDs } from './nho-may'

/** 'mang' = không nối được (mất mạng / máy chủ không trả lời) · 'loi' = máy chủ từ chối / trả sai · 'go' = 404 (thầy đã gỡ buổi). */
export type KetQua<T> = { ok: true; d: T } | { ok: false; loai: 'mang' | 'loi' | 'go' }
const GOC_MAC_DINH = 'https://omr.ttadodaihoc.workers.dev'
const HAN_MS = 15_000
export const NHO_DS_MS = 10 * 60_000

/** Vòng hỏi lại NỐI TIẾP: lượt sau chỉ hẹn khi lượt trước xong (không bao giờ hai lượt bay cùng lúc); `chay()` trả false / ném lỗi ⇒ thưa dần ×2, trần 30 giây.
 *  (Cùng luật `batVongTrucTiep` của src/lib/nhip-ben-vung.ts — viết gọn tại đây để mảnh nạp sẵn của mọi app không phải giữ thêm hàm ấy.) Trả hàm dừng. */
export function batVongHoiLai(chay: () => Promise<unknown> | unknown, ms: number): () => void {
  let dung = false, loi = 0, hen: ReturnType<typeof setTimeout> | undefined
  const buoc = async (): Promise<void> => {
    if (dung) return
    let hong = false
    try { hong = (await chay()) === false } catch { hong = true }
    loi = hong ? loi + 1 : 0
    if (!dung) hen = setTimeout(() => void buoc(), Math.min(30_000, ms * 2 ** Math.min(loi, 3)))
  }
  hen = setTimeout(() => void buoc(), ms)
  return () => { dung = true; clearTimeout(hen) }
}

export async function gocMayChu(): Promise<string> {
  let u = ''
  try { u = await layDiaChiMayChu('') } catch { /* dùng mặc định */ }
  return String(u || GOC_MAC_DINH).replace(/\/+$/, '')
}
async function goi(url: string, khoiTao?: RequestInit): Promise<{ r: Response } | { loai: 'mang' }> {
  const dk = typeof AbortController === 'function' ? new AbortController() : null
  const hen = dk ? setTimeout(() => dk.abort(), HAN_MS) : undefined
  try { return { r: await fetch(url, { ...khoiTao, signal: dk?.signal }) } } catch { return { loai: 'mang' } } finally { clearTimeout(hen) }
}
async function goiJson<T>(duong: string, ts: Record<string, string>, hopLe: (j: Record<string, unknown>) => boolean): Promise<KetQua<T>> {
  const q = Object.keys(ts).map((k) => `${k}=${encodeURIComponent(ts[k]!)}`).join('&')
  const k = await goi(`${await gocMayChu()}${duong}?${q}`)
  if ('loai' in k) return { ok: false, loai: 'mang' }
  if (k.r.status === 404) return { ok: false, loai: 'go' }
  if (!k.r.ok) return { ok: false, loai: 'loi' }
  const j = (await k.r.json().catch(() => null)) as Record<string, unknown> | null
  return j && hopLe(j) ? { ok: true, d: j as unknown as T } : { ok: false, loai: 'loi' }
}

// ── danh sách (nhớ 10 phút trong phiên; lần tải được gần nhất cất trên máy cho lúc mất mạng) ──
let nhoDs: { khoa: string; luc: number; d: TraLiveDsHs } | null = null
/** Token của lượt gọi danh sách gần nhất (dòng «Live» ở «Thêm» gọi trước khi màn mở) — màn không phải nhận token qua tham số. */
let tokenNho = ''
let dangTaiDs: { khoa: string; hua: Promise<KetQua<TraLiveDsHs>> } | null = null
/** Chỉ dùng cho phép kiểm. */
export function _quenDs(): void { nhoDs = null; dangTaiDs = null; tokenNho = '' }
/** `moi` = bỏ bản nhớ 10 phút (nút «Thử lại», buổi đang dựng tự hỏi lại). Hai nơi cùng hỏi một lúc ⇒ chung một lượt gọi. */
export function taiDs(token: string, moi = false): Promise<KetQua<TraLiveDsHs>> {
  const khoa = khoaEm(token)
  tokenNho = token
  if (!moi && nhoDs && nhoDs.khoa === khoa && Date.now() - nhoDs.luc < NHO_DS_MS) return Promise.resolve({ ok: true, d: nhoDs.d })
  if (dangTaiDs && dangTaiDs.khoa === khoa) return dangTaiDs.hua
  const hua = goiJson<TraLiveDsHs>('/hs/live-ds', { token }, (j) => Array.isArray(j.buoi)).then((k) => {
    if (dangTaiDs?.hua === hua) dangTaiDs = null
    // 404 ở lệnh danh sách = máy chủ chưa có lệnh ⇒ là lỗi máy chủ, không phải «thầy đã gỡ».
    if (!k.ok) return k.loai === 'go' ? { ok: false as const, loai: 'loi' as const } : k
    nhoDs = { khoa, luc: Date.now(), d: k.d }
    luuDs(khoa, k.d)
    return k
  })
  dangTaiDs = { khoa, hua }
  return hua
}
/** Danh sách đã cất trên máy (mất mạng). */
export const dsDaLuu = (token: string): TraLiveDsHs | null => docDsLuu(khoaEm(token))
/** Số buổi đã dựng xong mà em CHƯA mở (chip «N buổi mới» ở tấm «Thêm»). Lỗi / mất mạng ⇒ 0 (không hiện chip). */
export async function demBuoiMoi(token: string): Promise<number> {
  const k = await taiDs(token)
  if (!k.ok) return 0
  const mo = docDaMo(khoaEm(token))
  return k.d.buoi.filter((b) => b.trangThai === 'xong' && !mo.includes(b.id)).length
}

// ── một buổi ──
export const taiBuoiRieng = (token: string, id: string): Promise<KetQua<TraLiveBuoiHs>> =>
  goiJson<TraLiveBuoiHs>('/hs/live-buoi', { token, id }, (j) => typeof j.ve === 'string' && !!j.ketQua && typeof j.ketQua === 'object')

export const duongTep = (goc: string, id: string, tep: TepLive, ve: string): string => `${goc}/live-tep/${encodeURIComponent(id)}/${tep}?ve=${encodeURIComponent(ve)}`
const laBuoi = (j: Record<string, unknown>): boolean => j.v === 1 && Array.isArray(j.cau) && Array.isArray(j.doan) && Array.isArray(j.mocBang)
/** `buoi.json` của một buổi. 404 ⇒ 'go'; vé sai / hết hạn (401, 403) ⇒ 'loi' (nơi gọi xin vé mới qua `/hs/live-buoi` rồi thử lại). */
export async function taiBuoiJson(id: string, ve: string, goc?: string): Promise<KetQua<BuoiLiveJson>> {
  const k = await goi(duongTep(goc || (await gocMayChu()), id, TEP_LIVE.buoi, ve))
  if ('loai' in k) return { ok: false, loai: 'mang' }
  if (k.r.status === 404) return { ok: false, loai: 'go' }
  if (!k.r.ok) return { ok: false, loai: 'loi' }
  const j = (await k.r.json().catch(() => null)) as Record<string, unknown> | null
  return j && laBuoi(j) ? { ok: true, d: j as unknown as BuoiLiveJson } : { ok: false, loai: 'loi' }
}
/** Một khúc `net.bin` theo Range `[tu, den)`. `status` 206 = đúng khúc xin; 200 = máy chủ trả CẢ tệp (nơi gọi tự cắt). 404 ⇒ 'go'. */
export async function taiKhucNet(goc: string, id: string, ve: string, tu: number, den: number): Promise<KetQua<{ status: number; b: Uint8Array }>> {
  const k = await goi(duongTep(goc, id, TEP_LIVE.net, ve), { headers: { Range: `bytes=${tu}-${Math.max(tu, den - 1)}` } })
  if ('loai' in k) return { ok: false, loai: 'mang' }
  if (k.r.status === 404) return { ok: false, loai: 'go' }
  if (!k.r.ok) return { ok: false, loai: 'loi' }
  try { return { ok: true, d: { status: k.r.status, b: new Uint8Array(await k.r.arrayBuffer()) } } } catch { return { ok: false, loai: 'mang' } }
}
/** Token phiên của em: lượt gọi danh sách gần nhất, không có thì phiên đăng nhập cất trên máy (điểm vào dùng chung không nhận token qua tham số). */
export function tokenEm(): string {
  if (tokenNho) return tokenNho
  try { const v = JSON.parse(localStorage.getItem('omr_student_portal_auth') || 'null') as { token?: unknown } | null; return typeof v?.token === 'string' ? v.token : '' } catch { return '' }
}
