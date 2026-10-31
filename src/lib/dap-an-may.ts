// ĐÁP ÁN CÂU LUYỆN TẬP TRÊN MÁY EM (thầy 31/10: «Sửa cho đáp án xuống máy trước khi nộp an toàn») — mã DÙNG CHUNG máy em / máy chủ (server/src/dap-an-may.ts).
// Máy chủ gắn vào câu luyện tập (chỉ câu có tem niêm phong: không tự luận, trong kênh số, đã qua lọc ca thi) trường `dm` = «khoá.gói»: gói AES-GCM của phần chấm
// (đáp án, lời giải, ảnh lời giải, cờ OMNI), dữ liệu kèm = mã câu. Máy em mở gói lúc em bấm «Kiểm tra» và chấm bằng ĐÚNG luật chấm của máy chủ (dòng so của `grade`,
// `khopPhanIII`) ⇒ đúng / sai hiện ngay, không chờ mạng; lệnh `answer` vẫn gửi đi và bản máy chủ (dòng 2) luôn là chuẩn (EXP, thưởng, báo cáo thầy).
// Không mở được (gói hỏng, trình duyệt cũ không có WebCrypto) / câu sai làm quá nhanh mà OMNI có thể xét «lướt» ⇒ null ⇒ chờ máy chủ như cũ.
import { khopPhanIII } from './cham-so'

/** Phần chấm một câu (đúng như tem niêm phong `NoiDungNiem`, bỏ phần đo kích thước đề). */
export interface DapAnMay { p: 'I' | 'II' | 'III'; c: string; l: unknown; m: unknown[]; o: 0 | 1; y?: number; u?: number }

const enc = new TextEncoder(), dec = new TextDecoder()
export const b64u = (b: Uint8Array): string => {
  let s = ''
  for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000))
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
export const tuB64u = (s: string): Uint8Array<ArrayBuffer> => {
  const t = s.replace(/-/g, '+').replace(/_/g, '/')
  const r = atob(t + '='.repeat((4 - (t.length % 4)) % 4))
  const b = new Uint8Array(new ArrayBuffer(r.length))
  for (let i = 0; i < r.length; i++) b[i] = r.charCodeAt(i)
  return b
}
const khoaAes = (khoa: string, dung: KeyUsage[]) => crypto.subtle.importKey('raw', tuB64u(khoa), { name: 'AES-GCM' }, false, dung)

/** Mã hoá CHUỖI `chu` bằng `khoa` (base64url 32 byte), dữ liệu kèm `kem`: base64url(iv 12 byte ‖ bản mã). */
export async function maHoaChuoi(khoa: string, kem: string, chu: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(new ArrayBuffer(12)))
  const ma = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(kem) }, await khoaAes(khoa, ['encrypt']), enc.encode(chu)))
  const ra = new Uint8Array(12 + ma.length)
  ra.set(iv); ra.set(ma, 12)
  return b64u(ra)
}
/** Mở gói chuỗi. Sai khoá / sai dữ liệu kèm / gói hỏng ⇒ null. */
export async function giaiChuoi(khoa: string, kem: string, goi: string): Promise<string | null> {
  try {
    const b = tuB64u(goi)
    return dec.decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: b.slice(0, 12), additionalData: enc.encode(kem) }, await khoaAes(khoa, ['decrypt']), b.slice(12)))
  } catch { return null }
}
/** Mã hoá phần chấm của câu `qid` bằng `khoa` (base64url 32 byte): base64url(iv 12 byte ‖ bản mã), dữ liệu kèm = qid. */
export const maHoaDapAn = (khoa: string, qid: string, da: unknown): Promise<string> => maHoaChuoi(khoa, qid, JSON.stringify(da))
/** Mở gói bằng `khoa`. Sai khoá / sai câu / gói hỏng ⇒ null. */
export async function giaiDapAn(khoa: string, qid: string, goi: string): Promise<unknown> {
  const chu = await giaiChuoi(khoa, qid, goi)
  if (chu === null) return null
  try { return JSON.parse(chu) } catch { return null }
}
/** Mở trường `dm` («khoá.gói») của câu `qid`. Không hợp lệ ⇒ null. */
export async function moDm(qid: string, dm: unknown): Promise<DapAnMay | null> {
  if (typeof dm !== 'string' || !qid) return null
  const i = dm.indexOf('.')
  if (i <= 0) return null
  const o = await giaiDapAn(dm.slice(0, i), qid, dm.slice(i + 1)) as DapAnMay | null
  return o && (o.p === 'I' || o.p === 'II' || o.p === 'III') && typeof o.c === 'string' && o.c ? o : null
}

/** Đúng luật «có thể là lướt» của máy chủ (cham-nhanh.ts `coTheLaLuot`, niem-phong.ts `msCoTheLaLuot`): số đo hữu hạn ≥ 0, làm tròn < 8 giây
 *  (`THAM_SO_OMNI.LUOT_MS_MAX`); vắng / âm / không phải số ⇒ không đo ⇒ không bao giờ lướt. */
const LUOT_MS_MAX = 8_000
const coTheLaLuot = (v: unknown): boolean => {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() ? Number(v) : NaN
  return Number.isFinite(n) && n >= 0 && Math.round(n) < LUOT_MS_MAX
}

/** Kết quả TẠM chấm trên máy (cùng khuôn dòng 1 của máy chủ). */
export interface KetTamMay { ok: true; tam: true; correct: boolean; answer: string; traLoi: string; solution: unknown; solutionImages: unknown[]; may: true }
/**
 * Chấm tại máy — đúng phần thuần của `chamTuNiem` (server/src/cham-nhanh.ts): khuôn đáp án theo phần; Phần III ⇒ `khopPhanIII`, còn lại `grade`.
 * Câu SAI ở phiên OMNI có thể xét lướt (`o = 1`) mà làm dưới 8 giây ⇒ null (máy chủ quyết lướt, như dòng 1 của máy chủ).
 * Không tính «làm vội» (thưởng) — bản đầy đủ của máy chủ lo phần thưởng như cũ.
 */
export function chamTaiMay(da: DapAnMay, traLoiGoc: string, msLam: unknown): KetTamMay | null {
  const tra = String(traLoiGoc ?? '').trim()
  if (da.p === 'I' && !/^[ABCD]$/.test(tra) || da.p === 'II' && !/^[DS]{4}$/.test(tra) || da.p === 'III' && (!tra || tra.length > 40)) return null
  const goc = String(traLoiGoc ?? '')
  // Phần I / II: đúng dòng so của `grade` (game/than-thu-v2/core.ts — không nạp cả mô-đun game vào mảnh này); Phần III: `khopPhanIII` như chamTuNiem.
  const correct = da.p === 'III' ? khopPhanIII(goc, da.c) : !!goc.trim() && goc.trim().toUpperCase() === da.c
  if (!correct && da.o === 1 && coTheLaLuot(msLam)) return null
  return { ok: true, tam: true, correct, answer: da.c, traLoi: tra, solution: da.l, solutionImages: Array.isArray(da.m) ? da.m : [], may: true }
}
