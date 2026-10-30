// ĐẾM EM ĐƯỢC NỐI LẠI CHUỖI 27–29/10 (CHỈ ĐỌC, thầy 30/10 «khôi phục chuỗi cho học sinh bị mất hôm qua và hôm kia» · «cả ngày 27/10»). Chỉ in số gộp, không SBD.
import { CAU_MOT_BAI, SQL_CAU_TINH_MUC, SQL_CO_KET_QUA_HOAC_LUOT } from '../server/src/chuoi-ngay-bai'
const token = process.env.CLOUDFLARE_API_TOKEN, account = process.env.CLOUDFLARE_ACCOUNT_ID
if (!token || !account) throw new Error('Thiếu cấu hình Cloudflare.')
async function q(sql: string): Promise<Record<string, unknown>[]> {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`, {
    method: 'POST', headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' }, body: JSON.stringify({ sql }), signal: AbortSignal.timeout(60000) })
  const j = await r.json() as { success?: boolean; result?: { results?: Record<string, unknown>[] }[]; errors?: unknown }
  if (!r.ok || !j.success) throw new Error(`D1 lỗi ${r.status} ${JSON.stringify(j.errors).slice(0, 300)}`)
  return j.result?.flatMap((x) => x.results ?? []) ?? []
}
// đạt ngày d: trước 28/10 ≥ 6 câu có kết quả; từ 28/10 đủ mức đã chốt (goi_bai_7_muc_ngay), thiếu mức ⇒ 6
const r = await q(`WITH d AS (
  SELECT sbd, ngay_vn n, COUNT(DISTINCT CASE WHEN ket_qua IS NOT NULL THEN qid END) c, COUNT(DISTINCT CASE WHEN ${SQL_CAU_TINH_MUC} THEN qid END) c7
  FROM su_kien_hoc WHERE ngay_vn BETWEEN '2026-10-25' AND '2026-10-29' AND ${SQL_CO_KET_QUA_HOAC_LUOT} GROUP BY sbd, ngay_vn),
 dat AS (SELECT d.sbd, d.n, CASE WHEN d.n < '2026-10-28' THEN d.c >= ${CAU_MOT_BAI} ELSE d.c7 >= COALESCE((SELECT g.muc FROM goi_bai_7_muc_ngay g WHERE g.sbd = d.sbd AND g.ngay = d.n AND g.muc > 0), ${CAU_MOT_BAI}) END ok, d.c, d.c7 FROM d),
 em AS (SELECT sbd,
   MAX(CASE WHEN n='2026-10-26' THEN ok END) d26, MAX(CASE WHEN n='2026-10-27' THEN ok END) d27, MAX(CASE WHEN n='2026-10-28' THEN ok END) d28, MAX(CASE WHEN n='2026-10-29' THEN ok END) d29,
   MAX(CASE WHEN n IN ('2026-10-27','2026-10-28','2026-10-29') THEN c END) coLam FROM dat GROUP BY sbd)
 SELECT COUNT(*) em_co_hoc_25_29,
   SUM(COALESCE(d26,0)=1) dat_26,
   SUM(COALESCE(d26,0)=1 AND (COALESCE(d27,0)=0 OR COALESCE(d28,0)=0 OR COALESCE(d29,0)=0)) dat26_lo_27_29,
   SUM(COALESCE(d26,0)=1 AND COALESCE(d27,0)=0) lo27, SUM(COALESCE(d26,0)=1 AND COALESCE(d28,0)=0) lo28, SUM(COALESCE(d26,0)=1 AND COALESCE(d29,0)=0) lo29,
   SUM(COALESCE(d26,0)=1 AND (COALESCE(d27,0)=0 OR COALESCE(d28,0)=0 OR COALESCE(d29,0)=0) AND COALESCE(coLam,0)>0) co_vao_lam_nhung_thieu
 FROM em`)
console.log('Đếm (chỉ đọc) — em đang có chuỗi (đạt 26/10) mà lỡ ≥ 1 ngày 27–29/10 ⇒ được nối lại:', JSON.stringify(r[0]))
const binh = await q(`SELECT COUNT(DISTINCT sbd) em, COALESCE(SUM(so),0) binh FROM chuoi_binh_mua WHERE luc >= '2026-10-26T17:00:00Z' AND luc < '2026-10-29T17:00:00Z'`).catch((e) => [{ loi: String(e).slice(0, 120) }])
console.log('Bình mua / tặng ghi 27–29/10 (tham khảo):', JSON.stringify(binh[0]))
