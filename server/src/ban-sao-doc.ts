// BẢN SAO ĐỌC D1 CHO LỆNH NÓNG CỦA HỌC SINH (28/10, thầy «Tối ưu tức thì giờ cao điểm»).
//
// Vì sao: giờ cao điểm mọi lệnh xếp hàng trên MỘT D1 chính. D1 thật đã bật bản sao đọc (read replication «auto» — hỏi qua API cấu hình 28/10), nhưng Sảnh /
// đếm sau câu / mở chặng vẫn đi `env.DB` (luôn tới D1 chính). Nay ba lệnh ấy chạy trong một PHIÊN D1 (`withSession`): câu ĐỌC tới bản sao gần nhất, câu GHI
// D1 tự chuyển về D1 chính (mở chặng lưu phiên, Sảnh lập kế hoạch) — D1 chính chỉ còn gánh ghi + lệnh nộp.
//
// ĐỌC-SAU-GHI ĐÚNG (bookmark): máy em giữ DẤU MỐC (`x-d1-bookmark`) của lượt đọc gần nhất và gửi lại ⇒ D1 chỉ trả từ bản sao đã ít nhất mới bằng mốc ấy.
// Em vừa GHI (nộp câu, làm lại…, mọi lệnh khác ngoài ba lệnh này) mà chưa có mốc mới hơn lần ghi ⇒ máy em gửi `x-d1-tuoi: 1` ⇒ phiên `first-primary`: lượt
// đầu đọc tại D1 chính (thấy chắc chắn câu vừa nộp), trả về mốc mới ⇒ các lượt sau lại đọc bản sao với mốc ấy.
// Máy chưa cập nhật (không gửi `x-d1-ban: 1`) ⇒ đi `env.DB` như cũ — không đổi hành vi. Mốc lạ / D1 từ chối mốc ⇒ chạy lại đúng lệnh ấy trên `env.DB`.
import type { Env } from './kieu'
import { gan } from './cau-hinh-dem'

/** Lệnh học sinh đọc bản sao (POST /game-v2/<lệnh>). Lệnh khác (kể cả `answer`) ⇒ D1 chính như cũ. */
export const LENH_BAN_SAO: ReadonlySet<string> = new Set(['hoc-tap-sanh', 'hoc-tap-dem', 'hoc-tap-start'])
export const DAU_MOC = 'x-d1-bookmark'
/** Đầu yêu cầu máy em gửi thêm (CORS cho phép) và đầu phản hồi máy em được đọc (CORS lộ ra). */
export const DAU_YEU_CAU = 'x-d1-ban, x-d1-tuoi, x-d1-bookmark'
const RE_MOC = /^[0-9A-Za-z-]{8,200}$/

export interface PhienBanSao { env: Env; moc: () => string | null; dungMoc: boolean }

/** Phiên bản sao cho lệnh này, hoặc null (đi `env.DB` như cũ). Không bao giờ ném. */
export function phienBanSao(env: Env, dau: { get(k: string): string | null }, lenh: string): PhienBanSao | null {
  if (dau.get('x-d1-ban') !== '1' || !LENH_BAN_SAO.has(lenh) || typeof env.DB?.withSession !== 'function') return null
  const moc = dau.get(DAU_MOC)
  const rang = dau.get('x-d1-tuoi') === '1' ? 'first-primary' : moc && RE_MOC.test(moc) ? moc : 'first-unconstrained'
  try {
    const s = env.DB.withSession(rang)
    if (!s || (s as unknown) === env.DB) return null // D1 giả trả chính nó ⇒ không có phiên
    return { env: { ...env, DB: gan(s, env.DB) as unknown as Env['DB'] }, moc: () => { try { return s.getBookmark?.() ?? null } catch { return null } }, dungMoc: rang === moc }
  } catch { return null }
}

/** Lỗi do D1 từ chối mốc (mốc hỏng / quá cũ) ⇒ nơi gọi chạy lại trên `env.DB`. */
export const laLoiMoc = (e: unknown): boolean => /bookmark/i.test(e instanceof Error ? e.message : String(e))

/** Chạy lệnh trong phiên bản sao (nếu có); mốc D1 từ chối ⇒ chạy lại trên `env` gốc. Trả kết quả + mốc mới (null ⇒ không gửi đầu). */
export async function chayBanSao<T>(env: Env, ps: PhienBanSao | null, chay: (e: Env) => Promise<T>): Promise<{ kq: T; moc: string | null }> {
  if (!ps) return { kq: await chay(env), moc: null }
  try { const kq = await chay(ps.env); return { kq, moc: ps.moc() } }
  catch (e) { if (ps.dungMoc && laLoiMoc(e)) return { kq: await chay(env), moc: null }; throw e }
}

/** Gắn mốc vào phản hồi (không có mốc ⇒ trả nguyên). */
export function ganMoc(res: Response, moc: string | null): Response {
  if (!moc || !RE_MOC.test(moc)) return res
  try { res.headers.set(DAU_MOC, moc); return res } catch { const h = new Headers(res.headers); h.set(DAU_MOC, moc); return new Response(res.body, { status: res.status, statusText: res.statusText, headers: h }) }
}
