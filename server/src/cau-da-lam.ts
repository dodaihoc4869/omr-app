// MỘT ĐỊNH NGHĨA "CÂU ĐÃ LÀM HÔM NAY" cho HIỂN THỊ ở cả ba app (Boss 21/09 — thầy thấy cùng một em "Đã làm 93 câu" ở thẻ Hôm nay, "78 câu" ở ô Thi đua; đề bài prompt-mot-dinh-nghia-cau-da-lam-2109.md).
//
//   "Câu đã làm hôm nay" = số câu KHÁC NHAU (DISTINCT qid) em ĐÃ TRẢ LỜI (`ket_qua IS NOT NULL`), MỌI nguồn, có `luc >= MAX(mốc hiển thị, 00:00 hôm nay giờ VN)` và `ngay_vn = hôm nay`.
//   "Câu đúng" cùng khuôn = số qid khác nhau có ÍT NHẤT MỘT lần đúng (đúng cột `dung` của `TIEN_BO_NGAY`, nên `soCauDung ≤ soCau`).
//
// Chuẩn là định nghĩa ô Thi đua đang dùng (`thi-dua-hom-nay.ts`); mọi nơi có chữ "câu" ở màn HỌC SINH / PHỤ HUYNH / THẦY đọc số từ đây, KHÔNG chép SQL. Con số của LỚP = TỔNG các con số của từng em
// (KHÔNG cộng theo dạng: đo D1 thật 21/09 — có bộ (em, ngày, qid) mang ≥ 2 mã dạng ⇒ cộng theo dạng sẽ phồng). Nơi thầy cần số LƯỢT làm thì phải ghi nhãn "lượt làm", không gọi là "câu".
//
// KHÔNG ĐỔI (luật, không phải hiển thị): `TIEN_BO_NGAY` (ke-hoach-ngay-d1.ts) vẫn nuôi đạt nhiệm vụ ngày / EXP / khiên / `laDatNgay`; cổng "có học ≥ 4 câu" của thú ăn; trần 60 câu game.
// Chi phí: một truy vấn theo danh sách em (đi chỉ mục idx_skh_em_ngay_qid) hoặc cả lớp (đi chỉ mục idx_skh_luc nhờ bọc `LIMIT -1`, xem ghi chú ở `SQL_CAU_DA_LAM_CA_LOP`); chỉ ĐỌC.
// import type { Env } from './kieu'
// import { docMocHienThi, type MocHienThi } from './moc-no'
// import { ngayVn } from './su-kien-hoc'

export interface CauDaLam { soCau: number; soCauDung: number }

/**
 * Cận dưới `luc >= ?` của "hôm nay": MAX(mốc hiển thị, 00:00 giờ VN của `ngay`). Mốc đứng yên nhiều ngày; bind thẳng mốc thì truy vấn đọc mọi sự kiện từ mốc rồi mới lọc `ngay_vn` (số dòng đọc lớn dần theo ngày).
 * Cùng tập với `ngay_vn = ngay` (`luc ≥ 00:00 ngày` là điều kiện cần của `ngay_vn = ngày`). ISO cùng định dạng `.000Z` ⇒ so chuỗi = so thời điểm.
 */
export function tuLucTuNgay(mocIso: string, ngay: string): string {
  const dau = new Date(Date.parse(`${ngay}T00:00:00+07:00`)).toISOString()
  return mocIso > dau ? mocIso : dau
}

/** `tuLucTuNgay` cho "hôm nay" theo đồng hồ `nowMs`. */
// export const tuLucHomNay = (moc: Pick<MocHienThi, 'iso'>, nowMs: number): string => tuLucTuNgay(moc.iso, ngayVn(nowMs))

/** Theo DANH SÁCH em: `bind(JSON.stringify(sbd[]), ngay VN, tuLuc)`. */
export const SQL_CAU_DA_LAM_THEO_EM =
  'SELECT sbd, COUNT(DISTINCT qid) AS so_cau, COUNT(DISTINCT CASE WHEN ket_qua = 1 THEN qid END) AS so_dung FROM su_kien_hoc WHERE sbd IN (SELECT value FROM json_each(?)) AND ngay_vn = ? AND luc >= ? AND ket_qua IS NOT NULL GROUP BY sbd'

/**
 * CẢ LỚP (mọi em có câu hôm nay): `bind(tuLuc, ngay VN)` — THỨ TỰ THAM SỐ (luc trước, ngày sau). Bọc truy vấn con `LIMIT -1` để SQLite đi chỉ mục idx_skh_luc(luc, …) chỉ trên sự kiện hôm nay
 * (không có bọc thì DISTINCT / GROUP BY khiến nó quét cả sổ theo chỉ mục đứng đầu bằng sbd — cùng tật đã vá ở `SQL_EM_DA_HOC_HOM_NAY`).
 */
export const SQL_CAU_DA_LAM_CA_LOP =
  'SELECT sbd, COUNT(DISTINCT qid) AS so_cau, COUNT(DISTINCT CASE WHEN ket_qua = 1 THEN qid END) AS so_dung FROM (SELECT sbd, qid, ket_qua, ngay_vn FROM su_kien_hoc WHERE luc >= ? AND ket_qua IS NOT NULL LIMIT -1) WHERE ngay_vn = ? GROUP BY sbd'

// const so = (v: unknown): number => Number(v) || 0

/**
 * Bản THUẦN cho nơi đã có sẵn danh sách sự kiện hôm nay trong bộ nhớ (Bảng tin sống): số câu khác nhau + số câu có ít nhất một lần đúng theo em. Sự kiện chưa chấm (`ketQua === null`) bị bỏ.
 * `ds` KHÔNG cần đã lọc ngày/mốc — người gọi lọc trước.
 */
export function demCauKhacNhau(ds: readonly { sbd: string; qid: string; ketQua: 0 | 1 | null }[]): Map<string, CauDaLam> {
  const lam = new Map<string, Map<string, boolean>>() // em → qid → có lần đúng
  for (const e of ds) {
    if (e.ketQua === null) continue
    const m = lam.get(e.sbd) ?? new Map<string, boolean>()
    m.set(e.qid, (m.get(e.qid) ?? false) || e.ketQua === 1)
    lam.set(e.sbd, m)
  }
  const ra = new Map<string, CauDaLam>()
  for (const [sbd, m] of lam) ra.set(sbd, { soCau: m.size, soCauDung: [...m.values()].filter(Boolean).length })
  return ra
}

/** Số câu đã làm hôm nay (định nghĩa chuẩn) của một danh sách em. Em chưa làm câu nào KHÔNG có mặt trong kết quả. Lỗi đọc ⇒ `null` (nơi gọi bỏ khoá hiển thị, không bịa 0). */
// export async function docCauDaLamHomNay(env: Env, dsSbd: readonly string[], nowMs: number, moc?: MocHienThi): Promise<Map<string, CauDaLam> | null> {
//   const em = [...new Set(dsSbd)]
//   const ra = new Map<string, CauDaLam>()
//   if (em.length === 0) return ra
  try {
//     const m = moc ?? (await docMocHienThi(env))
//     const r = await env.DB.prepare(SQL_CAU_DA_LAM_THEO_EM).bind(JSON.stringify(em), ngayVn(nowMs), tuLucHomNay(m, nowMs)).all<Record<string, unknown>>()
//     for (const x of r.results ?? []) ra.set(String(x.sbd), { soCau: so(x.so_cau), soCauDung: so(x.so_dung) })
//     return ra
  } catch (e) {
    console.error('[cau-da-lam] không đọc được số câu đã làm hôm nay (bỏ khoá hiển thị):', e instanceof Error ? e.message : e)
//     return null
  }
// }
