import type { Env } from './kieu'
import { SQL_LUOT_GOI7, sqlTenLopHs } from './goi-bai-7'

type Row = Record<string, unknown>

/** Một lượt đọc cho cả bảng: D1 gộp theo câu gốc/bản hiện tại, không gửi đề, sổ từng em hay lời giải về máy thầy. */
export async function tongHopGoi7(env: Env, lop: string): Promise<Row> {
  const r = await env.DB.prepare(`WITH
    goi AS (SELECT g.*,b.ma_to_json FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE (?='' OR g.lop=?)),
    cau AS (SELECT c.goi_id,c.qid,c.version FROM goi_bai_7_cau c JOIN goi g ON g.id=c.goi_id),
    em AS (SELECT e.goi_id,e.sbd FROM goi_bai_7_em e JOIN goi g ON g.id=e.goi_id JOIN hoc_sinh h ON h.sbd=e.sbd AND g.lop=${sqlTenLopHs('h')}),
    lan AS (SELECT e.goi_id,e.sbd,c.qid,
      CASE WHEN COALESCE(su_kien_hoc.assistance,'none') IN ('','none') AND NOT EXISTS(
        SELECT 1 FROM loi_giai_hoi l WHERE l.sbd=su_kien_hoc.sbd AND l.qid=su_kien_hoc.qid
        AND julianday(l.luc)<julianday(su_kien_hoc.luc) AND julianday(l.luc)>=julianday(su_kien_hoc.luc)-0.5
      ) THEN 1 ELSE 0 END tu_lam
      FROM em e JOIN cau c ON c.goi_id=e.goi_id JOIN su_kien_hoc ON su_kien_hoc.sbd=e.sbd AND su_kien_hoc.qid=c.qid
      AND json_extract(su_kien_hoc.raw_json,'$.ht_cau_version')=c.version
      WHERE su_kien_hoc.ket_qua IS NOT NULL AND ${SQL_LUOT_GOI7}),
    nhan AS (SELECT goi_id,sbd,qid,MAX(tu_lam) tu_lam FROM (
      SELECT goi_id,sbd,qid,tu_lam FROM lan UNION ALL
      SELECT e.goi_id,e.sbd,c.qid,0 FROM em e JOIN cau c ON c.goi_id=e.goi_id JOIN goi_bai_7_gap a
      ON a.goi_id=e.goi_id AND a.sbd=e.sbd AND a.qid=c.qid AND a.version=c.version
    ) GROUP BY goi_id,sbd,qid),
    so_cau AS (SELECT goi_id,COUNT(*) tong FROM cau GROUP BY goi_id),
    so_em AS (SELECT goi_id,COUNT(*) n FROM em GROUP BY goi_id),
    tien_do AS (SELECT goi_id,COUNT(*) gap,SUM(tu_lam) tu_lam FROM nhan GROUP BY goi_id)
    SELECT g.*,COALESCE(c.tong,0) so_cau,COALESCE(e.n,0) so_em,COALESCE(t.gap,0) da_gap,COALESCE(t.tu_lam,0) tu_lam
    FROM goi g LEFT JOIN so_cau c ON c.goi_id=g.id LEFT JOIN so_em e ON e.goi_id=g.id LEFT JOIN tien_do t ON t.goi_id=g.id
    ORDER BY g.bat_dau DESC,g.ten`).bind(lop, lop).all<Row>()
  const thongKe: Record<string, { soEm: number; pGap: number | null; pTuLam: number | null }> = {}
  const goi = r.results.map(({ so_cau, so_em, da_gap, tu_lam, ...g }) => {
    const soEm = Number(so_em), tong = Number(so_cau) * soEm
    thongKe[String(g.id)] = { soEm, pGap: tong ? Math.round(100 * Number(da_gap) / tong) : null, pTuLam: tong ? Math.round(100 * Number(tu_lam) / tong) : null }
    return g
  })
  return { ok: true, bat: true, goi, thongKe }
}
