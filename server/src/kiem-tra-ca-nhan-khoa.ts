// KIỂM TRA ÔN TẬP — PHẦN CHỮA TẢI SẴN ĐÃ KHOÁ, NỘP XONG CHỈ TRAO CHÌA (thầy 31/10: «làm cả cho … kiểm tra ôn tập xong đẩy luôn»; cùng cách ca kiểm tra, khoa-de-thi.ts).
// Trước: nộp bài / xem kết quả ⇒ máy chủ trả NGUYÊN phần chữa (đề + đáp án + lời giải từng câu, vài chục KB) ⇒ mạng yếu chờ lâu mới thấy kết quả.
// Nay: lúc em làm bài, máy em tải ở nền gói phần chữa (`hoc-tap-ktcn-goi`) MÃ HOÁ AES-GCM bằng chìa riêng của em cho đúng bài này (HMAC từ mã bí mật máy chủ —
// máy em không tự có chìa), dữ liệu kèm gắn mã bài + SBD + phiên bản gói (băm nội dung). Nộp / xem kết quả mà em báo giữ gói đúng phiên bản ⇒ máy chủ trả
// phần chữa GỌN (mỗi câu: mã câu, câu em trả lời, đúng/sai — vẫn do máy chủ chấm) + CHÌA ⇒ máy em mở gói ghép đề / đáp án / lời giải ⇒ hiện tức thì.
// AN TOÀN: chìa chỉ trao ở đúng chỗ phần chữa vốn được trả (SAU khi bài đã nộp — `ketQuaKt`); trước đó gói là chuỗi vô nghĩa. Lệch phiên bản / thiếu gói /
// mở hỏng ⇒ đường cũ (nguyên phần chữa). Điểm, đúng / sai, sổ học vẫn chỉ theo máy chủ.
import type { Env } from './kieu'
import { publicQuestion, type PrivateQuestion } from '../../src/game/than-thu-v2/core'
import { b64u, maHoaChuoi } from '../../src/lib/dap-an-may'
import { chiaTheoNhan } from './khoa-de-thi'

/** Dữ liệu kèm của gói (máy em dùng đúng chuỗi này — src/lib/khoa-ktcn.ts). */
export const kemGoiKt = (id: string, sbd: string, phien: string): string => `ktcn|${id}|${sbd}|${phien}`
const chiaKt = (env: Pick<Env, 'MA_BI_MAT'>, id: string, sbd: string) => chiaTheoNhan(env, `ktcn|${id}|${sbd}`)

/** Nội dung gói: mã câu → đề công khai + đáp án + lời giải (đúng các trường phần chữa cũ trả). Cùng đề ⇒ cùng chuỗi. */
export const thoGoiKt = (cau: readonly { q: PrivateQuestion }[]): string =>
  JSON.stringify(Object.fromEntries(cau.map((c) => [c.q.qid, { de: publicQuestion(c.q), dapAn: c.q.correct, loiGiai: c.q.solution }])))
/** Phiên bản gói = băm SHA-256 nội dung (22 ký tự base64url). */
export const phienGoiKt = async (tho: string): Promise<string> => b64u(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(tho)))).slice(0, 22)

/** Gói của em `sbd` cho bài `id`. */
export async function dongGoiKt(env: Pick<Env, 'MA_BI_MAT'>, id: string, sbd: string, cau: readonly { q: PrivateQuestion }[]): Promise<{ goi: string; phien: string }> {
  const tho = thoGoiKt(cau), phien = await phienGoiKt(tho)
  return { goi: await maHoaChuoi(await chiaKt(env, id, sbd), kemGoiKt(id, sbd, phien), tho), phien }
}

type KetKt = { cau: { de: { qid: string }; tra: string; dung: boolean }[] } & Record<string, unknown>
/** Phần chữa đã dựng (`ketQuaKt`) ⇒ bản GỌN + chìa khi em báo giữ gói đúng phiên bản; không ⇒ nguyên như cũ. */
export async function ketGonKt(env: Pick<Env, 'MA_BI_MAT'>, id: string, sbd: string, cau: readonly { q: PrivateQuestion }[], ket: KetKt, b: Record<string, unknown>):
  Promise<{ ketQua: unknown; khoaKq?: string; phienKq?: string }> {
  if (!env.MA_BI_MAT || !sbd || typeof b.phienKq !== 'string' || !b.phienKq) return { ketQua: ket }
  const phien = await phienGoiKt(thoGoiKt(cau))
  if (b.phienKq !== phien) return { ketQua: ket }
  return { ketQua: { ...ket, gon: true, cau: ket.cau.map((c) => ({ qid: c.de.qid, tra: c.tra, dung: c.dung })) }, khoaKq: await chiaKt(env, id, sbd), phienKq: phien }
}
