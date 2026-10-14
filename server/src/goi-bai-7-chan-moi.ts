import type { Env } from './kieu'
import { coGoi7, damBaoGoi7, SQL_LUOT_GOI7, sqlTenLopHs } from './goi-bai-7'
import { sqlQuyetDinhNhan7, sqlEmDangNhan7 } from './goi-bai-7-quyen'

/** Quyền gói cũng áp ở pool ôn/đường Hành trình cũ: không biến câu CHƯA GẶP của bài bị bớt thành câu mới qua cửa khác.
 * Câu đã gặp vẫn ôn/sửa; một QID dùng chung với gói còn nhận vẫn mở. Chỉ đọc mã, không tải câu/đáp án hay sổ em. */
export async function docChanCauMoiGoi7(env: Env, sbd: string): Promise<Set<string>> {
  await damBaoGoi7(env)
  const r=await env.DB.prepare(`SELECT qid FROM (WITH em AS MATERIALIZED(SELECT sbd,lop,ten_lop,trang_thai FROM hoc_sinh WHERE sbd=?1),
    goi AS MATERIALIZED(
      SELECT g.id,g.tick_id,g.lop,b.bo_tick_luc FROM em h JOIN goi_bai_7 g ON g.lop=${sqlTenLopHs('h')} JOIN bai_da_day b ON b.id=g.tick_id
      WHERE b.bo_tick_luc IS NOT NULL OR COALESCE(h.trang_thai,'')='khoa' OR NOT (${sqlQuyetDinhNhan7('g','h.sbd')})
      UNION SELECT g.id,g.tick_id,g.lop,b.bo_tick_luc FROM em h JOIN goi_bai_7_em e ON e.sbd=h.sbd JOIN goi_bai_7 g ON g.id=e.goi_id JOIN bai_da_day b ON b.id=g.tick_id
      WHERE b.bo_tick_luc IS NOT NULL OR g.lop<>${sqlTenLopHs('h')} OR COALESCE(h.trang_thai,'')='khoa' OR NOT (${sqlQuyetDinhNhan7('g','h.sbd')})
    ) SELECT DISTINCT c.qid FROM em h CROSS JOIN goi g CROSS JOIN goi_bai_7_cau c
    WHERE c.goi_id=g.id
    AND NOT EXISTS(SELECT 1 FROM goi_bai_7_cau c2 JOIN goi_bai_7 g2 ON g2.id=c2.goi_id JOIN bai_da_day b2 ON b2.id=g2.tick_id AND b2.bo_tick_luc IS NULL
      JOIN goi_bai_7_em e2 ON e2.goi_id=g2.id AND e2.sbd=h.sbd
      WHERE c2.qid=c.qid AND g2.lop=${sqlTenLopHs('h')} AND ${sqlEmDangNhan7('e2','g2','h')})
    AND NOT EXISTS(SELECT 1 FROM goi_bai_7_gap a WHERE a.sbd=h.sbd AND a.qid=c.qid AND a.version=c.version)
    AND NOT EXISTS(SELECT 1 FROM game_v2_attempt a JOIN game_v2_session ps ON ps.id=a.session AND ps.sbd=a.sbd,json_each(ps.json,'$.questions') ref
      WHERE a.sbd=h.sbd AND a.qid=c.qid AND json_extract(ref.value,'$.qid')=a.qid AND json_extract(ref.value,'$.version')=c.version)
    AND NOT EXISTS(SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd=h.sbd AND su_kien_hoc.qid=c.qid AND ket_qua IS NOT NULL
      AND json_extract(raw_json,'$.ht_cau_version')=c.version AND ${SQL_LUOT_GOI7}))`).bind(sbd).all<{qid:string}>()
  return new Set(r.results.map(r=>r.qid))
}

/** Đường Hành trình/ kế hoạch cũ cũng giữ cổng Gói7; cờ tắt không đọc bảng membership. */
export async function docChanCauMoiNeuBat7(env:Env,sbd:string):Promise<Set<string>> {
  return (await coGoi7(env)).bat?docChanCauMoiGoi7(env,sbd):new Set<string>()
}
