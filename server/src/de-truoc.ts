// ĐỀ TẢI SẴN Ở PHÒNG CHỜ (thầy 31/10: «tôi muốn bấm bắt đầu là phải tức thì luôn cho hs thi luôn… Mọi kiểu mở ca khác cũng vậy. Tối ưu triệt để»,
// «Phần mở ca thi phải tải sẵn hết đề đáp án», «Theo hướng tải luôn đề và đáp án về máy như dolingo nhé»).
//
// Em đứng ở phòng chờ (đã qua mọi cổng, có dòng `phong_cho`) ⇒ máy em tải SẴN gói đề công khai của ca (đúng gói `GET /de/:maCa` trả sau giờ bắt đầu —
// KHÔNG có đáp án) nhưng MÃ HOÁ AES-GCM bằng chìa CỦA CA (HMAC mã bí mật máy chủ, nhãn «de-truoc|ca»), dữ liệu kèm gắn mã ca + phiên bản gói (etag R2).
// Trước giờ bắt đầu gói chỉ là chuỗi vô nghĩa trên máy em: đề vẫn «chưa nằm trên máy em một giây nào» ở dạng đọc được.
// Thầy bấm Bắt đầu ⇒ `/vao-thi` cho em vào kèm CHÌA (`khoaDeTruoc`, chỉ ở nhánh đã được vào) ⇒ máy em mở gói có sẵn, không tải đề nữa. Song song lúc ấy máy
// em hỏi `GET /de/:maCa?phien=<etag gói>`: gói không đổi ⇒ máy chủ chỉ đáp `{khongDoi:true}`; đổi (thầy nối câu ngoài kho sau lúc tải sẵn) ⇒ trả nguyên gói
// mới trong CHÍNH lượt hỏi ấy (không thêm vòng chờ nào).
// Cả lớp chung một gói mã hoá ⇒ mã hoá MỘT lần mỗi isolate cho mỗi phiên bản gói (đệm dưới), 100 em không bắt máy chủ mã hoá 100 lần.
import type { Env } from './kieu'
import { chiaTheoNhan } from './khoa-de-thi'
import { docGoiDeDem } from './dem-ca-thi'
import { maHoaChuoi } from '../../src/lib/dap-an-may'

/** Dữ liệu kèm của gói đề tải sẵn (máy em dùng đúng chuỗi này — src/lib/khoa-de-thi.ts `kemDeTruoc`). */
export const kemDeTruoc = (maCa: string, phien: string): string => `de-truoc|${maCa}|${phien}`
/** Chìa gói đề tải sẵn của ca — CHỈ trao ở nhánh `/vao-thi` đã cho em vào (sau giờ bắt đầu). */
export const chiaDeTruoc = (env: Pick<Env, 'MA_BI_MAT'>, maCa: string): Promise<string> => chiaTheoNhan(env, `de-truoc|${maCa}`)

const TRAN_DEM = 40
const dem = new Map<string, { phien: string; goi: string }>()

/**
 * `POST /de-truoc {maCa, sbd}` — gói đề ĐÃ KHOÁ cho em đang ở phòng chờ (hoặc đã có lượt) của ca đang mở. MỘT lượt D1 (dòng ca chỉ về khi em có mặt),
 * gói đề đọc từ đệm isolate. Không có mặt / ca không mở / chưa có đề ⇒ ok:false (máy em tải đề như cũ sau giờ bắt đầu).
 */
export async function deTruoc(env: Env, b: Record<string, unknown>): Promise<Record<string, unknown>> {
  const maCa = String(b.maCa ?? '').trim(), sbd = String(b.sbd ?? '').trim()
  if (!maCa || !sbd || maCa.length > 64 || sbd.length > 40 || !env.DE || !env.MA_BI_MAT) return { ok: false, lyDo: 'thieu' }
  const ca = await env.DB.prepare(
    `SELECT bank_r2, cap_nhat_luc FROM ca WHERE ma_ca = ?1 AND trang_thai = 'mo'
       AND (EXISTS (SELECT 1 FROM phong_cho WHERE khoa = ?2) OR EXISTS (SELECT 1 FROM luot WHERE ma_ca = ?1 AND sbd = ?3))`,
  ).bind(maCa, `${maCa}|${sbd}`, sbd).first<{ bank_r2: string | null; cap_nhat_luc: string | null }>()
  if (!ca?.bank_r2) return { ok: false, lyDo: 'khong_tim_thay' }
  const o = await docGoiDeDem(env, ca.bank_r2, String(ca.cap_nhat_luc ?? ''))
  if (!o || !o.httpEtag) return { ok: false, lyDo: 'chua_co_de' }
  const cu = dem.get(maCa)
  if (cu && cu.phien === o.httpEtag) return { ok: true, goi: cu.goi, phien: cu.phien }
  const goi = await maHoaChuoi(await chiaDeTruoc(env, maCa), kemDeTruoc(maCa, o.httpEtag), new TextDecoder().decode(o.than))
  if (dem.size >= TRAN_DEM) dem.delete(dem.keys().next().value!)
  dem.set(maCa, { phien: o.httpEtag, goi })
  return { ok: true, goi, phien: o.httpEtag }
}

/** Cho test: bỏ đệm gói đã mã hoá. */
export const xoaDemDeTruoc = (): void => dem.clear()
