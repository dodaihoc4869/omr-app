// TỜ ĐÁP ÁN CA KIỂM TRA TẢI SẴN ĐÃ KHOÁ — CHÌA TRAO KHI NỘP (thầy 31/10: «Làm luôn đi»). Trước: ca «công bố ngay» trả nguyên tờ đáp án (~100 KB) ngay
// trong phản hồi nộp bài ⇒ mạng 3G yếu chờ 1–3 giây mới thấy điểm, cuối ca cả lớp nộp dồn ⇒ mỗi em kéo ~100 KB từ R2 qua máy chủ.
// Nay: vào thi xong máy em tải SẴN tờ đáp án (lệnh `/khoa-de`) MÃ HOÁ AES-GCM bằng khoá RIÊNG của em trong ca này (HMAC từ mã bí mật máy chủ — máy em không
// tự có khoá), dữ liệu kèm gắn mã ca + SBD + phiên bản tờ đáp án (etag R2). Nộp xong, ca đủ điều kiện công bố (luật `laSanSangCongBo`, như cũ) và gói của em
// đúng phiên bản tờ mới nhất ⇒ máy chủ chỉ trả CHÌA (43 ký tự) ⇒ máy em mở gói, chấm như cũ ⇒ điểm hiện tức thì. Lệch phiên bản (thầy vừa sửa đáp án) /
// thiếu gói ⇒ đường cũ (trả nguyên tờ đáp án) — luôn đúng tờ mới nhất.
// AN TOÀN NHƯ HIỆN NAY: chìa chỉ trao SAU khi máy chủ đã nhận bài và ca được phép công bố — đúng lúc tờ đáp án vốn được trả; trong giờ thi gói chỉ là chuỗi
// mã hoá vô nghĩa. Chìa của em này không mở được gói của em khác.
import type { Env } from './kieu'
import { b64u, maHoaChuoi } from '../../src/lib/dap-an-may'

const enc = new TextEncoder()
/** Dữ liệu kèm của gói đề (máy em dùng đúng chuỗi này — src/lib/khoa-de-thi.ts). */
export const kemGoiDe = (maCa: string, sbd: string, phien: string): string => `goi-de|${maCa}|${sbd}|${phien}`

/** Chìa (khoá AES 32 byte, base64url) của em `sbd` ở ca `maCa` — HMAC-SHA256(mã bí mật máy chủ, «goi-de|ca|sbd»). */
export async function chiaGoiDe(env: Pick<Env, 'MA_BI_MAT'>, maCa: string, sbd: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(env.MA_BI_MAT), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64u(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(`goi-de|${maCa}|${sbd}`))))
}

/** Gói tờ đáp án (nguyên văn JSON `tho`, phiên bản `phien`) cho em `sbd` ở ca `maCa`. */
export async function dongGoiDe(env: Pick<Env, 'MA_BI_MAT'>, maCa: string, sbd: string, tho: string, phien: string): Promise<string> {
  return maHoaChuoi(await chiaGoiDe(env, maCa, sbd), kemGoiDe(maCa, sbd, phien), tho)
}

/** Máy em báo đang giữ gói đề đúng phiên bản `phien` hiện hành ⇒ chỉ cần trao chìa. */
export const dungGoiDe = (b: Record<string, unknown>, phien: string | null | undefined): boolean =>
  b.coGoiDe === true && typeof b.phienGoi === 'string' && !!phien && b.phienGoi === phien
