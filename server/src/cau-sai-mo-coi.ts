// KIỂM "CÂU SAI MỒ CÔI" (thầy 02/10: "đảm bảo tất cả các câu sai phải được xử lý triệt để" + "chỉ tính từ 29/09 thôi nhé").
// Chỉ ĐỌC. Một (em, câu) là câu sai khi LẦN TỰ LÀM CUỐI (bỏ sự kiện đọc lời giải) từ ngày VN `tuNgay` là sai hoặc bỏ trống.
// Câu sai "mồ côi" = không thuộc chiến dịch nào của em ⇒ lịch ôn hiện nay (srs2 chỉ đọc câu chiến dịch) không bao giờ kéo câu đó lại.
// Đây là phép đo nền cho hàng chữa lỗi GĐ3 (Vòng học khép kín v2); khi hàng chữa lỗi chạy, số mồ côi phải về 0.
import type { Env } from './kieu'

type Obj = Record<string, unknown>
const NGAY = /^\d{4}-\d{2}-\d{2}$/

const sqlCauSai = (coMucDich: boolean) => `
WITH ev AS (
  SELECT sbd, CASE WHEN instr(qid, '#') > 0 THEN substr(qid, 1, instr(qid, '#') - 1) ELSE qid END AS q, nguon, ket_qua, luc
    FROM su_kien_hoc WHERE ngay_vn >= ?${coMucDich ? " AND COALESCE(purpose, '') <> 'xem_loi_giai'" : ''}
),
cuoi AS (
  SELECT ev.sbd, ev.q, ev.nguon, ev.ket_qua FROM ev
    JOIN (SELECT sbd, q, MAX(luc) AS luc FROM ev GROUP BY sbd, q) m ON m.sbd = ev.sbd AND m.q = ev.q AND m.luc = ev.luc
),
sai AS (SELECT sbd, q, MIN(nguon) AS nguon, MAX(CASE WHEN ket_qua IS NULL THEN 1 ELSE 0 END) AS bo_trong FROM cuoi
  WHERE ket_qua IS NULL OR ket_qua = 0 GROUP BY sbd, q),
cd AS (SELECT DISTINCT s.value AS sbd, j.value AS q FROM chien_dich c, json_each(c.sbd_json) s, json_each(c.qid_json) j WHERE c.trang_thai <> 'da_huy')
SELECT sai.sbd, sai.nguon, sai.bo_trong, CASE WHEN cd.q IS NULL THEN 1 ELSE 0 END AS mo_coi
  FROM sai LEFT JOIN cd ON cd.sbd = sai.sbd AND cd.q = sai.q`

/** Gộp các dòng (em, câu sai) thành số theo kênh + danh sách em có nhiều câu mồ côi nhất. Tách riêng để test. */
export function tongHopMoCoi(rows: { sbd: string; nguon: string; bo_trong: number; mo_coi: number }[]) {
  const kenh = new Map<string, { kenh: string; cauSai: number; boTrong: number; moCoi: number; em: Set<string> }>()
  const theoEm = new Map<string, number>()
  for (const r of rows) {
    const k = kenh.get(r.nguon) ?? { kenh: r.nguon, cauSai: 0, boTrong: 0, moCoi: 0, em: new Set<string>() }
    k.cauSai++
    if (Number(r.bo_trong) === 1) k.boTrong++
    if (Number(r.mo_coi) === 1) { k.moCoi++; theoEm.set(r.sbd, (theoEm.get(r.sbd) ?? 0) + 1) }
    k.em.add(r.sbd)
    kenh.set(r.nguon, k)
  }
  const dsKenh = [...kenh.values()].map(({ em, ...x }) => ({ ...x, soEm: em.size })).sort((a, b) => b.cauSai - a.cauSai)
  return {
    tong: { cauSai: rows.length, moCoi: rows.filter((r) => Number(r.mo_coi) === 1).length, soEm: new Set(rows.map((r) => r.sbd)).size },
    kenh: dsKenh,
    emNhieuNhat: [...theoEm.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([sbd, moCoi]) => ({ sbd, moCoi })),
  }
}

/** `/gv/cau-sai-mo-coi {tuNgay?}` (thầy) — mặc định từ 29/09/2026 theo lệnh thầy. */
export async function gvCauSaiMoCoi(env: Env, b: Obj) {
  const tuNgay = NGAY.test(String(b.tuNgay ?? '')) ? String(b.tuNgay) : '2026-09-29'
  type Dong = { sbd: string; nguon: string; bo_trong: number; mo_coi: number }
  const doc = (coMucDich: boolean) => env.DB.prepare(sqlCauSai(coMucDich)).bind(tuNgay).all<Dong>()
  const r = await doc(true).catch(() => doc(false)) // sổ cũ chưa có cột purpose
  return { ok: true, tuNgay, ...tongHopMoCoi(r.results ?? []) }
}
