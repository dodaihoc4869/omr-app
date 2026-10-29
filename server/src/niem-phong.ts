// TEM NIÊM PHONG ĐÁP ÁN (thầy 29/10 «giờ cao điểm cũng phải tức thì 100%»): dòng 1 «Kiểm tra» (đúng / sai) KHÔNG phụ thuộc isolate nào đón yêu cầu.
// Vấn đề: giờ cao điểm nhiều isolate ⇒ câu / phiên em đang làm thường KHÔNG nằm trong đệm isolate đón lệnh `answer` ⇒ dòng 1 phải chờ ít nhất một đợt D1 (~180 ms).
// Cách làm: lúc PHÁT câu (mở chặng), máy chủ niêm phong phần chấm của câu — đáp án, lời giải, kích thước đề — bằng AES-GCM với khoá dẫn xuất từ MA_BI_MAT (chỉ máy chủ có),
// gắn vào câu dưới tên `sk`. Máy em chỉ giữ chuỗi mờ, gửi lại cùng lệnh `answer`; isolate nào cũng mở được (cùng bí mật) ⇒ dòng 1 đi NGAY, 0 đợt D1.
// An toàn:
//  · Đáp án vẫn chỉ nhìn thấy SAU khi em nộp: tem là bản mã AES-GCM 256 bit, máy em không có khoá. Tem gắn với (SBD, mã câu) qua AAD ⇒ tem của em này / câu này
//    không mở được cho em khác / câu khác. Sửa một bit ⇒ giải mã hỏng ⇒ coi như không có tem (đường thường lo).
//  · Tem có hạn HAN_NIEM_MS (45 phút từ lúc phát) và số phiên bản: hết hạn / sai khuôn ⇒ không dùng. Câu ngoài phạm vi chấm nhanh (tự luận, ngoài kênh số) không được niêm phong.
//  · Dòng 1 từ tem chỉ là tin NHANH: lệnh `answer` đầy đủ vẫn chạy trong cùng yêu cầu và dòng 2 (bản lưu) luôn là chuẩn — cùng ý nghĩa với chấm nhanh bằng đệm (cham-nhanh.ts).
//  · Hệ quả đã chấp nhận: câu vừa được đưa vào đề của một ca thi SAU khi em đã được phát câu ấy: trong ≤ 45 phút, dòng 1 vẫn có thể báo đúng / sai cho câu em ĐÃ NHẬN
//    (đường đầy đủ sẽ từ chối ghi); isolate đã có tập câu bảo vệ ca thi còn mới thì vẫn chặn (đọc ở nơi dùng tem). Em không nhận thêm câu nào ngoài bộ đã phát.
import { THAM_SO_OMNI } from './omni-kieu'
import type { Env } from './kieu'

/** Tuổi tối đa của tem (ms). */
export const HAN_NIEM_MS = 45 * 60_000
/** Tem của chặng LẬP SẴN (cron đêm — san-sang.ts) nằm trong D1 tới khi em mở chặng: hạn dài (chỉ để làm MỚI lúc mở, `lamMoiNiem`); tem hạn này KHÔNG bao giờ tới máy em và `moNiem` thường từ chối nó. */
export const HAN_NIEM_CHUAN_BI_MS = 30 * 3_600_000
const PHIEN_BAN = 1
const mh = new TextEncoder(), gm = new TextDecoder()

/** Phần chấm của một câu — viết gọn (khoá một chữ cái) để tem ngắn. */
export interface NoiDungNiem {
  /** Phiên bản khuôn tem. */ v: number
  /** Hết hạn (ms epoch). */ e: number
  /** Mã câu. */ q: string
  /** Phiên bản câu lúc phát (để dò lỗi). */ r: string
  /** Mã nhóm câu. */ g: string
  /** Phần I / II / III. */ p: 'I' | 'II' | 'III'
  /** Đáp án đúng ĐÚNG như câu đã phát (đã xáo theo phiên). */ c: string
  /** Lời giải. */ l: unknown
  /** Ảnh lời giải. */ m: unknown[]
  /** Số từ của đề (đo kích thước đề cho luật «làm vội»). */ t: number
  /** Đề có hình (0 / 1). */ h: 0 | 1
  /** Phiên Hoá 2.0 (OMNI có thể xét lướt) 0 / 1. */ o: 0 | 1
}

const b64 = (u: Uint8Array): string => { let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode(...u.subarray(i, i + 0x8000)); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') }
const ub64 = (s: string): Uint8Array => { const t = s.replace(/-/g, '+').replace(/_/g, '/'); const r = atob(t + '='.repeat((4 - t.length % 4) % 4)); const u = new Uint8Array(new ArrayBuffer(r.length)); for (let i = 0; i < r.length; i++) u[i] = r.charCodeAt(i); return u }

async function nen(u: Uint8Array, cheDo: 'deflate-raw', huong: 'nen' | 'giai'): Promise<Uint8Array> {
  const luong = new Blob([u as BlobPart]).stream().pipeThrough(huong === 'nen' ? new CompressionStream(cheDo) : new DecompressionStream(cheDo))
  return new Uint8Array(await new Response(luong).arrayBuffer())
}

let khoaNho: { bi: string; k: Promise<CryptoKey> } | null = null
/** Khoá AES-GCM dẫn xuất (HKDF-SHA256) từ MA_BI_MAT — nhớ trong isolate (đổi bí mật ⇒ dẫn lại). Thiếu bí mật ⇒ ném (nơi gọi bỏ tem). */
function khoaNiem(env: Env): Promise<CryptoKey> {
  const bi = String(env.MA_BI_MAT ?? '')
  if (!bi) return Promise.reject(new Error('thiếu bí mật'))
  if (khoaNho && khoaNho.bi === bi) return khoaNho.k
  const k = crypto.subtle.importKey('raw', mh.encode(bi), 'HKDF', false, ['deriveKey'])
    .then((g) => crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: mh.encode('omr-niem-dap-an-v1'), info: mh.encode('aes-gcm-256') }, g, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']))
  khoaNho = { bi, k }
  k.catch(() => { if (khoaNho?.k === k) khoaNho = null })
  return k
}
/** Xoá khoá đã nhớ (test). */
export function xoaKhoaNiem(): void { khoaNho = null }

/**
 * LÕI niêm phong dùng chung: `aad` = chuỗi gắn tem vào đúng chủ thể (em + câu / em + đợt…); `nd` = nội dung (JSON); tem tự mang hạn `e`.
 * Không bao giờ ném: lỗi ⇒ `undefined`.
 */
export async function niemMa(env: Env, aad: string, nd: object, nayMs = Date.now(), hanMs = HAN_NIEM_MS): Promise<string | undefined> {
  try {
    const k = await khoaNiem(env)
    const goc = mh.encode(JSON.stringify({ v: PHIEN_BAN, e: nayMs + hanMs, ...nd }))
    const nenRoi = await nen(goc, 'deflate-raw', 'nen')
    const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
    const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: mh.encode(aad) }, k, nenRoi as BufferSource))
    const ra = new Uint8Array(new ArrayBuffer(iv.length + ct.length)); ra.set(iv, 0); ra.set(ct, iv.length)
    return b64(ra)
  } catch { return undefined }
}
/** Mở tem bằng lõi chung: đúng `aad`, còn hạn (≤ HAN_NIEM_MS), đúng phiên bản ⇒ nội dung; còn lại null. Không bao giờ ném. */
export async function moMa<T extends { v: number; e: number }>(env: Env, aad: string, tem: unknown, nayMs = Date.now(), hanToiDaMs = HAN_NIEM_MS): Promise<T | null> {
  try {
    if (typeof tem !== 'string' || tem.length < 40 || tem.length > 60_000 || !aad) return null
    const u = ub64(tem)
    if (u.length < 12 + 16) return null
    const k = await khoaNiem(env)
    const pt = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u.subarray(0, 12) as BufferSource, additionalData: mh.encode(aad) }, k, u.subarray(12) as BufferSource))
    const nd = JSON.parse(gm.decode(await nen(pt, 'deflate-raw', 'giai'))) as T
    if (!nd || nd.v !== PHIEN_BAN || !(nd.e > nayMs) || !(nd.e - nayMs <= hanToiDaMs)) return null
    return nd
  } catch { return null }
}

/**
 * Niêm phong phần chấm của câu cho em `sbd` (học tập). Không bao giờ ném: lỗi ⇒ `undefined` (câu đi không tem, máy em dùng đường thường).
 */
export async function niemPhong(env: Env, sbd: string, nd: Omit<NoiDungNiem, 'v' | 'e'>, nayMs = Date.now(), hanMs = HAN_NIEM_MS): Promise<string | undefined> {
  if (!sbd) return undefined
  return niemMa(env, `${sbd}|${nd.q}`, nd, nayMs, hanMs)
}

/**
 * LÀM MỚI tem của chặng lập sẵn lúc em MỞ chặng: mở tem hạn dài (≤ HAN_NIEM_CHUAN_BI_MS còn lại) rồi niêm phong lại với hạn thường (45 phút từ bây giờ). Tem hỏng / hết hạn dài / khác em ⇒ `undefined`
 * (câu đi không tem). Không đọc D1. An toàn: nơi gọi chỉ làm mới khi bản lập sẵn còn DÙNG ĐƯỢC (dấu khớp — kể cả dấu ca thi ⇒ câu chưa vào đề thi nào từ lúc lập).
 */
export async function lamMoiNiem(env: Env, sbd: string, qid: string, tem: unknown, nayMs = Date.now()): Promise<string | undefined> {
  if (!sbd || !qid) return undefined
  const nd = await moMa<NoiDungNiem>(env, `${sbd}|${qid}`, tem, nayMs, HAN_NIEM_CHUAN_BI_MS)
  if (!nd || nd.q !== qid) return undefined
  const { v: _v, e: _e, ...con } = nd
  return niemMa(env, `${sbd}|${qid}`, con, nayMs)
}

/** Mở tem của em `sbd` cho câu `qid`. Không bao giờ ném: sai / hỏng / hết hạn / khác em / khác câu ⇒ null. */
export async function moNiem(env: Env, sbd: string, qid: string, tem: unknown, nayMs = Date.now()): Promise<NoiDungNiem | null> {
  if (!sbd || !qid) return null
  const nd = await moMa<NoiDungNiem>(env, `${sbd}|${qid}`, tem, nayMs)
  if (!nd || nd.q !== qid) return null
  if (nd.p !== 'I' && nd.p !== 'II' && nd.p !== 'III') return null
  if (typeof nd.c !== 'string' || !nd.c || typeof nd.g !== 'string') return null
  return nd
}

/** Thời lượng em làm có thể rơi vào vùng «lướt» OMNI không? (cùng luật `coTheLaLuot` của cham-nhanh.ts; để ở đây cho khỏi vòng nhập) */
export const msCoTheLaLuot = (v: unknown): boolean => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  return Number.isFinite(n) && n >= 0 && Math.round(n) < THAM_SO_OMNI.LUOT_MS_MAX
}
