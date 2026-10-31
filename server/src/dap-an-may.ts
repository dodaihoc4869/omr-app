// ĐÁP ÁN CÂU LUYỆN TẬP XUỐNG MÁY EM — AN TOÀN (thầy 31/10: «Sửa cho đáp án xuống máy trước khi nộp an toàn»). Máy em chấm tại chỗ ⇒ đúng / sai hiện ngay,
// không chờ mạng (như Duolingo); MÁY CHỦ VẪN CHẤM LẠI MỌI CÂU — EXP, xếp hạng, báo cáo thầy chỉ theo máy chủ.
// «An toàn» nghĩa là:
//   1. CHỈ câu luyện tập trong chặng / gói của chính em hôm nay. KHÔNG BAO GIỜ: câu thi, kiểm tra cá nhân, bài tập về nhà có điểm, câu đang / sắp bảo vệ cho ca thi,
//      câu tự luận (nơi gọi lọc trước khi gắn).
//   2. Đáp án đi dạng MÃ HOÁ AES-GCM, mỗi câu một gói gắn chặt mã câu (dữ liệu kèm = qid ⇒ không chép gói câu này sang câu khác); khoá riêng của em + ngày VN
//      (HMAC từ mã bí mật máy chủ) — hết ngày là khoá cũ vô dụng. Không có chữ đáp án rõ trong mạng hay bộ nhớ đệm.
//   3. Công tắc `cau_hinh.dap_an_tren_may` (`{"bat":false}` ⇒ tắt ngay; vắng dòng ⇒ bật) — tắt thì máy em quay về chờ máy chủ chấm như cũ.
// Không có cách nào giấu tuyệt đối đáp án đã nằm trên máy em (Duolingo cũng vậy) — bảo vệ thật nằm ở (1) phạm vi và việc máy chủ chấm lại.
import type { Env } from './kieu'
import { b64u, maHoaChuoi, type DapAnMay } from '../../src/lib/dap-an-may'

export { giaiDapAn, maHoaDapAn, type DapAnMay } from '../../src/lib/dap-an-may'

export const KHOA_CH_DAP_AN_MAY = 'dap_an_tren_may'
const enc = new TextEncoder()

/** Khoá đáp án của em trong ngày VN `ngay` (32 byte, base64url) — HMAC-SHA256(mã bí mật máy chủ, «dap-an-may|sbd|ngay»). */
export async function khoaDapAnEm(env: Pick<Env, 'MA_BI_MAT'>, sbd: string, ngay: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(env.MA_BI_MAT), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(`dap-an-may|${sbd}|${ngay}`))))
}

/** Công tắc: vắng dòng / JSON hỏng ⇒ BẬT (thầy yêu cầu 31/10); `{"bat":false}` ⇒ tắt; `{"bat":true,"sbd":[…]}` ⇒ chỉ các em ấy. */
export function dapAnMayBat(giaTri: string | null, sbd: string): boolean {
  if (!giaTri) return true
  let o: { bat?: unknown; sbd?: unknown }
  try { o = JSON.parse(giaTri) as typeof o } catch { return true }
  if (!o || typeof o !== 'object' || o.bat === false) return false
  return Array.isArray(o.sbd) ? o.sbd.map(String).includes(sbd) : true
}

const khoaNho = new Map<string, Promise<string>>()
/** «khoá.gói» của chuỗi `chu` (khoá riêng em + ngày VN của `nayMs`; dữ liệu kèm `kem`). Lỗi ⇒ undefined. */
export async function dmChuoi(env: Pick<Env, 'MA_BI_MAT'>, sbd: string, kem: string, chu: string, nayMs = Date.now()): Promise<string | undefined> {
  try {
    if (!env.MA_BI_MAT || !sbd || !kem) return undefined
    const ngay = new Date(nayMs + 7 * 3_600_000).toISOString().slice(0, 10)
    const k = `${sbd}|${ngay}`
    let p = khoaNho.get(k)
    if (!p) { if (khoaNho.size > 2000) khoaNho.clear(); p = khoaDapAnEm(env, sbd, ngay); khoaNho.set(k, p); p.catch(() => khoaNho.delete(k)) }
    const khoa = await p
    return `${khoa}.${await maHoaChuoi(khoa, kem, chu)}`
  } catch { return undefined }
}
/** Gói đáp án gửi kèm câu: «khoá.gói» (gói gắn chặt mã câu). Lỗi ⇒ undefined (câu đi không `dm`, máy em chờ máy chủ chấm). */
export const dmCau = (env: Pick<Env, 'MA_BI_MAT'>, sbd: string, qid: string, da: DapAnMay, nayMs = Date.now()): Promise<string | undefined> =>
  qid ? dmChuoi(env, sbd, qid, JSON.stringify(da), nayMs) : Promise.resolve(undefined)
