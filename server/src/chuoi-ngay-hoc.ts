// CHUỖI NGÀY HỌC — Hoá 2.0 (01/10).
//
// Hoá 2.0 bật cả trung tâm ⇒ cron 00:01 bỏ qua `chayCaLop`, nơi DUY NHẤT gọi `chotNgayCu` ⇒ `ke_hoach_ngay.ket_qua` không bao giờ
// thành 'dat' ⇒ `demChuoiDat`/`docChuoiTruoc` luôn 0. Chuỗi Hoá 2.0 đếm thẳng từ sổ `su_kien_hoc`:
//   chuỗi = số ngày VN LIÊN TIẾP em có làm ÍT NHẤT 1 câu (mọi nguồn: game/Đảo/Đoàn/Bi-a/Tu luyện/BTVN/ca thi…; câu bỏ trống `ket_qua` NULL không tính).
//   Hôm nay đã làm ⇒ tính cả hôm nay; hôm nay CHƯA làm ⇒ giữ chuỗi tới hôm qua (không về 0 lúc sáng sớm).
// Một truy vấn, chạy trên chỉ mục `idx_skh_em_ngay_qid (sbd, ngay_vn, qid, ket_qua)`. Không đổi schema.
import type { Env } from './kieu'

const GIO_VN_MS = 7 * 3_600_000
/** Số ngày tối đa đọc lùi (đủ cho mọi chuỗi thực tế, chặn truy vấn). */
export const SO_NGAY_DOC_CHUOI = 400

const ngayVnCuaMs = (ms: number): string => new Date(ms + GIO_VN_MS).toISOString().slice(0, 10)
const lui = (ngay: string, n: number): string => new Date(Date.parse(`${ngay}T00:00:00Z`) - n * 86_400_000).toISOString().slice(0, 10)

/**
 * Đếm chuỗi từ danh sách ngày VN có học (thứ tự tuỳ ý, trùng được). Hôm nay có ⇒ đếm từ hôm nay; không ⇒ đếm từ hôm qua.
 * Hàm thuần — dùng chung cho mọi nơi đếm.
 */
export function demChuoiNgayHoc(cacNgay: Iterable<string>, homNay: string): number {
  const co = new Set(cacNgay)
  let d = co.has(homNay) ? homNay : lui(homNay, 1)
  let k = 0
  while (co.has(d) && k < SO_NGAY_DOC_CHUOI) { k++; d = lui(d, 1) }
  return k
}

/** Chuỗi ngày học của MỘT em tại `nowMs` (giờ VN). Lỗi đọc ⇒ 0 (không làm hỏng màn). */
export async function docChuoiNgayHoc(env: Env, sbd: string, nowMs: number = Date.now()): Promise<number> {
  const homNay = ngayVnCuaMs(nowMs)
  try {
    const r = await env.DB.prepare(
      'SELECT DISTINCT ngay_vn FROM su_kien_hoc WHERE sbd = ? AND ngay_vn >= ? AND ngay_vn <= ? AND ket_qua IS NOT NULL ORDER BY ngay_vn DESC LIMIT ?',
    ).bind(sbd, lui(homNay, SO_NGAY_DOC_CHUOI), homNay, SO_NGAY_DOC_CHUOI + 1).all<{ ngay_vn: string }>()
    return demChuoiNgayHoc((r.results ?? []).map((x) => String(x.ngay_vn)), homNay)
  } catch {
    return 0
  }
}
