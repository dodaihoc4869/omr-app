// Chọn một lần cho job, cùng điều kiện công bố/lần làm của giaoPilot toàn trường.
import type { Env } from '../server/src/kieu'
import { SQL_LA_LAN_LAM } from '../server/src/omni-kieu'
import { SQL_DA_CONG_BO } from '../server/src/cong-bo-diem'
export type CapGiao = { sbd: string; qid: string }
export async function docCacCapGiao(env: Env): Promise<CapGiao[]> {
  const rows = await env.DB.prepare(`SELECT s.sbd,COALESCE(json_extract(s.raw_json,'$.tc'),s.qid) AS qid FROM su_kien_hoc s JOIN hoc_sinh h ON h.sbd=s.sbd
    WHERE s.ngay_vn>='2026-09-29' AND COALESCE(s.ket_qua,0)=0 AND COALESCE(s.assistance,'none') IN ('none','') AND COALESCE(s.visibility,'released')<>'embargoed' AND ${SQL_LA_LAN_LAM}
    AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')}))
    AND (s.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 ld WHERE ld.id=s.ma_nguon AND ld.sbd=s.sbd AND ld.status='submitted'))
    GROUP BY s.sbd,COALESCE(json_extract(s.raw_json,'$.tc'),s.qid) ORDER BY s.sbd,qid`).all<CapGiao>()
  return rows.results ?? []
}
