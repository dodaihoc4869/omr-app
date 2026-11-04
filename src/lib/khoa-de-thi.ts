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
/** Bỏ gói tờ đáp án đang giữ của em ở ca `maCa` (đề đổi phiên bản ⇒ tải lại gói mới). */
function boGoiDe(maCa: string, sbd: string): void {
  if (nho.get(sbd)?.maCa === maCa) nho.delete(sbd)
  try { const o = JSON.parse(localStorage.getItem(khoaLuu(sbd)) ?? 'null') as GoiDe | null; if (o?.maCa === maCa) localStorage.removeItem(khoaLuu(sbd)) } catch { /* bỏ qua */ }
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
/** Ca đã thôi hỏi lại gói ở phòng chờ (vào thi / ca bắt đầu / đóng) — `hoiLaiPhongCho` bên dưới. */
const dungHoiLai = new Set<string>()

/** Tải gói đề đã khoá. Có gói ⇒ thôi, trừ khi `lamMoi` (hỏi lại phòng chờ): gửi phiên bản đang giữ, máy chủ đáp `khongDoi` hoặc gói mới. Trả `'moi'` khi
 *  vừa nhận gói mới (lần đầu / đề đổi), `true` khi giữ gói cũ còn đúng, `false` khi không có gói. Máy chủ từ chối / lỗi ⇒ giữ nguyên (vào thi tải đề như cũ). */
export async function taiDeTruoc(ch: CauHinhMayChu, maCa: string, sbd: string, lamMoi = false): Promise<boolean | 'moi'> {
  if (!maCa || !sbd) return false
  const cu = deTruocNho.get(maCa)
  if (cu && !lamMoi) return true
  const r = await goiWorker<{ ok?: boolean; goi?: unknown; phien?: unknown; khongDoi?: unknown; lyDo?: unknown }>(ch, '/de-truoc', { maCa, sbd, ...(cu ? { phien: cu.phien } : {}) }, nhipNong(ch))
  if (r?.ok === true && r.khongDoi === true && cu && r.phien === cu.phien) return true
  if (r?.ok !== true || typeof r.goi !== 'string' || typeof r.phien !== 'string' || !r.goi || !r.phien) {
    if (r && r.ok === false && (r.lyDo === 'khong_tim_thay' || r.lyDo === 'da_bat_dau')) dungHoiLai.add(maCa) // ca đã bắt đầu / đóng / em rời phòng chờ ⇒ thôi hỏi lại
    return !!cu
  }
  deTruocNho.set(maCa, { maCa, phien: r.phien, goi: r.goi })
  return 'moi'
}

/** Phòng chờ: tải sẵn CẢ gói đề lẫn gói tờ đáp án (song song). Lỗi ⇒ im lặng (đường cũ lúc vào thi). */
export async function taiSanChoCa(ch: CauHinhMayChu, maCa: string, sbd: string): Promise<void> {
  await Promise.all([taiDeTruoc(ch, maCa, sbd).catch(() => false), taiGoiDe(ch, maCa, sbd).catch(() => undefined)])
}

/** Nhịp hỏi lại gói ở phòng chờ (ms, có rải): ca đề riêng máy thầy nối câu ngoài kho trong lúc chờ ⇒ đề / tờ đáp án đổi phiên bản. */
export const NHIP_HOI_LAI_PHONG_CHO_MS = 20_000
/** Hỏi lại tối đa (ms) — phòng chờ dài hơn nữa thì thôi (vào thi vẫn hỏi `/de?phien=` như cũ). */
const TRAN_HOI_LAI_MS = 3 * 3_600_000
const dangHoiLai = new Set<string>()

/**
 * PHÒNG CHỜ HỎI LẠI GÓI (thầy 04/11: «Tải sẵn đề đáp án tới máy hs khi vào phòng chờ», «tức thì lúc bấm bắt đầu»): trước đây máy em tải gói MỘT lần lúc vào
 * phòng chờ; ca đề riêng thầy nối thêm câu sai cũ / câu song sinh vào kho ca trong lúc chờ (chuẩn bị ngầm, nối sớm) ⇒ gói cũ lệch phiên bản ⇒ lúc Bắt đầu cả
 * lớp (127 máy) cùng tải lại nguyên gói. Nay mỗi ~20 giây máy em gửi phiên bản đang giữ: không đổi ⇒ máy chủ đáp một dòng; đổi ⇒ nhận gói đề mới + tải lại
 * gói tờ đáp án (vẫn ĐÃ KHOÁ — chìa đề trao lúc vào thi, chìa đáp án trao SAU khi nộp). Dừng khi em vào thi (`moDeTruoc`), ca đóng, quá 3 giờ.
 */
async function hoiLaiPhongCho(ch: CauHinhMayChu, maCa: string, sbd: string): Promise<void> {
  if (dangHoiLai.has(maCa)) return
  dangHoiLai.add(maCa)
  const dau = Date.now()
  try {
    while (!dungHoiLai.has(maCa) && Date.now() - dau < TRAN_HOI_LAI_MS) {
      await new Promise((xong) => setTimeout(xong, NHIP_HOI_LAI_PHONG_CHO_MS * (0.75 + Math.random() * 0.5)))
      if (dungHoiLai.has(maCa)) break
      const kq = await taiDeTruoc(ch, maCa, sbd, true).catch(() => true as const)
      if (kq === 'moi') { boGoiDe(maCa, sbd); await taiGoiDe(ch, maCa, sbd).catch(() => undefined) }
    }
  } finally { dangHoiLai.delete(maCa) }
}

/** Màn thi gọi khi em vào phòng chờ (đã rải 0–4 giây): đọc địa chỉ + cấu hình máy chủ rồi tải sẵn cả hai gói, rồi hỏi lại theo nhịp. Lỗi ⇒ im lặng (vào thi đi đường cũ). */
export async function taiSanPhongCho(url: string, maCa: string, sbd: string): Promise<void> {
  try {
    const u = await layDiaChiMayChu(url)
    if (!u) return
    const ch = { ...(await layCauHinhMayChu()), BAT: true, URL: u }
    dungHoiLai.delete(maCa)
    await taiSanChoCa(ch, maCa, sbd)
    void hoiLaiPhongCho(ch, maCa, sbd)
  } catch { /* mạng / máy chủ cũ: vào thi đi đường cũ */ }
}
/** Em đã vào thi / rời phòng chờ ⇒ thôi hỏi lại gói. */
export const thoiHoiLaiPhongCho = (maCa: string): void => void dungHoiLai.add(maCa)

/** Mở gói đề tải sẵn bằng chìa `/vao-thi` trao. Sai chìa / hỏng ⇒ null (nơi gọi tải đề như cũ). */
export async function moDeTruoc(g: GoiDeTruoc, khoa: unknown): Promise<unknown | null> {
  dungHoiLai.add(g.maCa) // đã vào thi ⇒ thôi hỏi lại gói ở phòng chờ
  if (typeof khoa !== 'string' || !khoa) return null
  try {
    const b = tuB64u(g.goi)
    const k = await crypto.subtle.importKey('raw', tuB64u(khoa), { name: 'AES-GCM' }, false, ['decrypt'])
    const ro = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: new TextEncoder().encode(kemDeTruoc(g.maCa, g.phien)) }, k, b.slice(12))
    return JSON.parse(new TextDecoder().decode(ro))
  } catch { return null }
}
// ── TẢI SẴN THEO LỚP LÚC MỞ APP (thầy 31/10 «Khi chọn đề thì tải luôn đề đáp án cho hs khối đó luôn», «Tải sẵn hết mọi thứ về tôi bấm bắt đầu phải tức
// thì ngay»; máy chủ `/hs/ca-tai-truoc`). Lớp em có ca đang mở ⇒ tải ở nền gói đề + gói tờ đáp án ĐÃ KHOÁ, gắn MÃ ẨN (máy em không biết mã ca trước khi
// thầy phát mã), cất Cache Storage (tắt mở app vẫn còn). Vào thi: `/vao-thi` trả mã ẩn ⇒ ghép đúng gói.
interface GoiPhien { goi: string; phien: string }
export interface GoiCaTruoc { id: string; de?: GoiPhien; dapAn?: GoiPhien; luc: number }
const KHO_GOI_CA = 'ddh-goi-ca-v1', KHOA_GOI_CA = '/goi-ca'
let goiCa: GoiCaTruoc[] = []
const sanSang: Promise<void> = (async () => {
  try { const r = await (await caches.open(KHO_GOI_CA)).match(KHOA_GOI_CA); if (r) goiCa = ((await r.json()) as GoiCaTruoc[]).filter((x) => x && typeof x.id === 'string') } catch { /* không Cache Storage ⇒ chỉ bộ nhớ */ }
})()
export const dsGoiCa = (): readonly GoiCaTruoc[] => goiCa
let hoiLuc = 0

/** Tải sẵn gói của các ca đang mở cho lớp em (Lộ trình gọi khi biết có ca). Hỏi lại tối đa 5 phút một lần. Lỗi ⇒ im lặng. */
export async function taiTruocTheoLop(token: string): Promise<void> {
  if (!token || Date.now() - hoiLuc < 5 * 60_000) return
  hoiLuc = Date.now()
  try {
    await sanSang
    const u = await layDiaChiMayChu()
    if (!u) return
    const r = (await (await fetch(`${u}/hs/ca-tai-truoc`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }) })).json()) as { ok?: boolean; goi?: GoiCaTruoc[] }
    if (r?.ok !== true || !Array.isArray(r.goi) || !r.goi.length) return
    const nay = Date.now(), moi = r.goi.filter((x) => x && typeof x.id === 'string').map((x) => ({ ...x, luc: nay }))
    goiCa = [...moi, ...goiCa.filter((x) => !moi.some((m) => m.id === x.id) && nay - x.luc < 2 * 86_400_000)].slice(0, 4)
    await (await caches.open(KHO_GOI_CA)).put(KHOA_GOI_CA, new Response(JSON.stringify(goiCa), { headers: { 'content-type': 'application/json' } }))
  } catch { hoiLuc = 0 }
}
/** Cho test. */
export const datGoiCa = (ds: GoiCaTruoc[]): void => { goiCa = ds; hoiLuc = 0 }

/**
 * Lượt vào thi (exam-api `vaoThiQuaMayChuMoi`): có gói tải sẵn (phòng chờ, hoặc tải theo lớp lúc mở app) ⇒ NGAY LÚC NÀY hỏi song song gói còn đúng phiên
 * bản không (`/de?phien=`: đúng ⇒ máy chủ đáp một dòng `khongDoi`; lệch ⇒ trả luôn gói mới) và trả hàm nhận lời `/vao-thi`: ghép gói theo mã ẩn `idCa`
 * (cất gói tờ đáp án của em như tải ở `/khoa-de`), đúng phiên bản ⇒ mở đề bằng chìa `khoaDeTruoc`; có gói mới ⇒ dùng luôn; quá 6 giây / hỏng ⇒ undefined
 * (nơi gọi tải đề như cũ). Không có gói ⇒ undefined (đường cũ, không hỏi gì).
 */
export async function truocVao(goc: string, maCa: string, sbd: string): Promise<((r: { khoaDeTruoc?: unknown; idCa?: unknown }) => Promise<unknown>) | undefined> {
  dungHoiLai.add(maCa) // đang vào thi ⇒ thôi hỏi lại gói ở phòng chờ
  await sanSang
  const g = docDeTruoc(maCa)
  const coDe = goiCa.filter((x) => x.de)
  const phien = g?.phien ?? coDe[0]?.de?.phien
  if (!phien && !goiCa.length) return undefined
  const kiem = phien
    ? fetch(`${goc}/de/${encodeURIComponent(maCa)}?phien=${encodeURIComponent(phien)}`).then(async (res) => (res.ok ? ((await res.json()) as Record<string, unknown>) : null)).catch(() => null)
    : Promise.resolve(null)
  return async (r) => {
    const p = typeof r.idCa === 'string' ? goiCa.find((x) => x.id === r.idCa) : undefined
    if (p?.dapAn && !docGoiDe(maCa, sbd)) luuGoiDe(sbd, { maCa, phien: p.dapAn.phien, goi: p.dapAn.goi })
    const goiDe = g ?? (p?.de ? { maCa, phien: p.de.phien, goi: p.de.goi } : null)
    const j = await Promise.race([kiem, new Promise<null>((xong) => setTimeout(() => xong(null), 6000))])
    if (j && j.khongDoi === true && goiDe && j.phien === goiDe.phien) return (await moDeTruoc(goiDe, r.khoaDeTruoc)) ?? undefined
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
