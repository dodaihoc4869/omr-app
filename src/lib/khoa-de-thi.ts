// GÓI TỜ ĐÁP ÁN CA KIỂM TRA ĐÃ KHOÁ (thầy 31/10: «Làm luôn đi» — server/src/khoa-de-thi.ts). Vào thi xong máy em tải ở NỀN tờ đáp án của ca đã MÃ HOÁ bằng
// chìa riêng của em (máy em không có chìa — trong giờ thi gói chỉ là chuỗi vô nghĩa). Nộp xong, ca được phép công bố ⇒ máy chủ chỉ trao CHÌA (43 ký tự) thay cho
// ~100 KB tờ đáp án ⇒ máy em mở gói, chấm như cũ ⇒ điểm hiện tức thì cả khi mạng yếu. Không có gói / sai phiên bản / mở hỏng ⇒ đường cũ (máy chủ trả nguyên tờ).
// Mảnh này NẠP LƯỜI từ exam-api (kho chạy-lúc, không cất sẵn — precache ≤ 170) và KHÔNG kéo dap-an-may (mảnh luyện tập) ⇒ tự mở AES-GCM, cùng định dạng
// `maHoaChuoi` (base64url(iv 12 byte ‖ bản mã)); tests/khoa-de-thi-3110.test.ts mở gói máy chủ bằng chính hàm dưới đây.
import { goiWorker, layCauHinhMayChu, nhipNong } from './may-chu-moi'
import { layDiaChiMayChu } from './dia-chi-may-chu'
import type { CauHinhMayChu } from './cau-hinh-may-chu'

export interface GoiDe { maCa: string; phien: string; goi: string }
/** Dữ liệu kèm của gói (đúng chuỗi máy chủ dùng). */
export const kemGoiDe = (maCa: string, sbd: string, phien: string): string => `goi-de|${maCa}|${sbd}|${phien}`
const nho = new Map<string, GoiDe>()
const khoaLuu = (sbd: string) => `omr_goi_de_${sbd}`

/** Gói đang giữ của em cho ca `maCa` (bộ nhớ, rồi máy — mở lại app giữa giờ vẫn còn). */
export function docGoiDe(maCa: string, sbd: string): GoiDe | null {
  const m = nho.get(sbd)
  if (m && m.maCa === maCa) return m
  try {
    const o = JSON.parse(localStorage.getItem(khoaLuu(sbd)) ?? 'null') as GoiDe | null
    if (o && o.maCa === maCa && typeof o.goi === 'string' && typeof o.phien === 'string') { nho.set(sbd, o); return o }
  } catch { /* máy không cho đọc ⇒ không có gói, nộp đi đường cũ */ }
  return null
}
function luuGoiDe(sbd: string, g: GoiDe): void {
  nho.set(sbd, g)
  try { localStorage.setItem(khoaLuu(sbd), JSON.stringify(g)) } catch { /* đầy / bị chặn ⇒ chỉ giữ trong bộ nhớ */ }
}

/** Tải gói của em (nếu chưa có). Lỗi / máy chủ chưa có tờ đáp án ⇒ thôi (nộp đi đường cũ). */
export async function taiGoiDe(ch: CauHinhMayChu, maCa: string, sbd: string): Promise<void> {
  if (!maCa || !sbd || docGoiDe(maCa, sbd)) return
  const r = await goiWorker<{ ok?: boolean; goi?: unknown; phien?: unknown }>(ch, '/khoa-de', { maCa, sbd }, nhipNong(ch))
  if (r?.ok === true && typeof r.goi === 'string' && typeof r.phien === 'string' && r.goi && r.phien) luuGoiDe(sbd, { maCa, phien: r.phien, goi: r.goi })
}

/** Phần thân lệnh nộp / `ketQua` báo máy chủ em đang giữ gói phiên bản nào (vắng gói ⇒ rỗng: đường cũ). */
export function thanGoiDe(maCa: string, sbd: string): Record<string, unknown> {
  const g = docGoiDe(maCa, sbd)
  return g ? { coGoiDe: true, phienGoi: g.phien } : {}
}

const tuB64u = (s: string): Uint8Array<ArrayBuffer> => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/')
  const r = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
  const b = new Uint8Array(new ArrayBuffer(r.length))
  for (let i = 0; i < r.length; i++) b[i] = r.charCodeAt(i)
  return b
}

/** Mở gói bằng chìa máy chủ vừa trao. Sai phiên bản / sai chìa / hỏng ⇒ null (nơi gọi xin lại tờ đáp án theo đường cũ). */
export async function moGoiDe(g: GoiDe, sbd: string, khoaKq: unknown, phienGoi: unknown): Promise<unknown | null> {
  if (typeof khoaKq !== 'string' || !khoaKq || phienGoi !== g.phien) return null
  try {
    const b = tuB64u(g.goi)
    const k = await crypto.subtle.importKey('raw', tuB64u(khoaKq), { name: 'AES-GCM' }, false, ['decrypt'])
    const ro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: new TextEncoder().encode(kemGoiDe(g.maCa, sbd, g.phien)) }, k, b.slice(12))
    return JSON.parse(new TextDecoder().decode(ro))
  } catch { return null }
}

// ── ĐỀ TẢI SẴN Ở PHÒNG CHỜ (thầy 31/10 «bấm bắt đầu là phải tức thì», «tải luôn đề và đáp án về máy như dolingo») — server/src/de-truoc.ts ──
// Em ở phòng chờ ⇒ tải gói đề công khai của ca ĐÃ KHOÁ (chìa của ca, máy em không có) + gói tờ đáp án đã khoá (chìa riêng, như trên). Thầy bấm Bắt đầu ⇒
// `/vao-thi` trao chìa đề ⇒ mở gói có sẵn, không tải đề nữa. Chỉ giữ trong bộ nhớ (mở lại app ở phòng chờ thì tải lại).
export interface GoiDeTruoc { maCa: string; phien: string; goi: string }
export const kemDeTruoc = (maCa: string, phien: string): string => `de-truoc|${maCa}|${phien}`
const deTruocNho = new Map<string, GoiDeTruoc>()
export const docDeTruoc = (maCa: string): GoiDeTruoc | null => deTruocNho.get(maCa) ?? null

/** Tải gói đề đã khoá (nếu chưa có). Máy chủ từ chối / lỗi ⇒ thôi (vào thi tải đề như cũ). */
export async function taiDeTruoc(ch: CauHinhMayChu, maCa: string, sbd: string): Promise<boolean> {
  if (!maCa || !sbd) return false
  if (deTruocNho.has(maCa)) return true
  const r = await goiWorker<{ ok?: boolean; goi?: unknown; phien?: unknown }>(ch, '/de-truoc', { maCa, sbd }, nhipNong(ch))
  if (r?.ok !== true || typeof r.goi !== 'string' || typeof r.phien !== 'string' || !r.goi || !r.phien) return false
  deTruocNho.set(maCa, { maCa, phien: r.phien, goi: r.goi })
  return true
}

/** Phòng chờ: tải sẵn CẢ gói đề lẫn gói tờ đáp án (song song). Lỗi ⇒ im lặng (đường cũ lúc vào thi). */
export async function taiSanChoCa(ch: CauHinhMayChu, maCa: string, sbd: string): Promise<void> {
  await Promise.all([taiDeTruoc(ch, maCa, sbd).catch(() => false), taiGoiDe(ch, maCa, sbd).catch(() => undefined)])
}

/** Màn thi gọi khi em vào phòng chờ (đã rải 0–4 giây): đọc địa chỉ + cấu hình máy chủ rồi tải sẵn cả hai gói. Lỗi ⇒ im lặng (vào thi đi đường cũ). */
export async function taiSanPhongCho(url: string, maCa: string, sbd: string): Promise<void> {
  try {
    const u = await layDiaChiMayChu(url)
    if (u) await taiSanChoCa({ ...(await layCauHinhMayChu()), BAT: true, URL: u }, maCa, sbd)
  } catch { /* mạng / máy chủ cũ: vào thi đi đường cũ */ }
}

/** Mở gói đề tải sẵn bằng chìa `/vao-thi` trao. Sai chìa / hỏng ⇒ null (nơi gọi tải đề như cũ). */
export async function moDeTruoc(g: GoiDeTruoc, khoa: unknown): Promise<unknown | null> {
  if (typeof khoa !== 'string' || !khoa) return null
  try {
    const b = tuB64u(g.goi)
    const k = await crypto.subtle.importKey('raw', tuB64u(khoa), { name: 'AES-GCM' }, false, ['decrypt'])
    const ro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: new TextEncoder().encode(kemDeTruoc(g.maCa, g.phien)) }, k, b.slice(12))
    return JSON.parse(new TextDecoder().decode(ro))
  } catch { return null }
}
/**
 * Lượt vào thi (exam-api `vaoThiQuaMayChuMoi`): có gói tải sẵn ⇒ NGAY LÚC NÀY hỏi song song gói còn đúng phiên bản không (`/de?phien=`: đúng ⇒ máy chủ đáp
 * một dòng `khongDoi`; lệch ⇒ trả luôn gói mới) và trả hàm lấy gói đề khi đã có chìa: đúng phiên bản ⇒ mở bằng chìa `/vao-thi` trao; có gói mới ⇒ dùng
 * luôn; chờ quá 6 giây / hỏng ⇒ undefined (nơi gọi tải đề như cũ). Không có gói ⇒ undefined (đường cũ, không hỏi gì).
 */
export function truocVao(goc: string, maCa: string): ((khoa: unknown) => Promise<unknown>) | undefined {
  const g = docDeTruoc(maCa)
  if (!g) return undefined
  const kiem = fetch(`${goc}/de/${encodeURIComponent(maCa)}?phien=${encodeURIComponent(g.phien)}`)
    .then(async (res) => (res.ok ? ((await res.json()) as Record<string, unknown>) : null))
    .catch(() => null)
  return async (khoa) => {
    const j = await Promise.race([kiem, new Promise<null>((xong) => setTimeout(() => xong(null), 6000))])
    if (j && j.khongDoi === true && j.phien === g.phien) return (await moDeTruoc(g, khoa)) ?? undefined
    if (j && j.khongDoi !== true && (Array.isArray(j.phanI) || Array.isArray(j.phanII) || Array.isArray(j.phanIII))) return j
    return undefined
  }
}
/** Cho test. */
export const xoaDeTruoc = (): void => deTruocNho.clear()

/** Mở tờ đáp án bằng chìa trong lời máy chủ `r` (`khoaKq`, `phienGoi`). Không gói / không chìa / hỏng ⇒ null. */
export async function moTuTraLoi(maCa: string, sbd: string, r: { khoaKq?: unknown; phienGoi?: unknown }): Promise<unknown | null> {
  const g = docGoiDe(maCa, sbd)
  return g ? moGoiDe(g, sbd, r.khoaKq, r.phienGoi) : null
}
