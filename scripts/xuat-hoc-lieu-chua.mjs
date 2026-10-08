// Nguồn thuộc kho đề; không truy vấn tên, SBD, đáp án/lịch sử của học sinh.
import { writeFileSync } from 'node:fs'
import { query } from './kiem-phat-hanh-chua.mjs'
const roots = await query(`SELECT q.json, l.bam, bt.song_sinh_json, bt.cau_kiem_json, bt.nhan_nen_json, bt.buoc_json
  FROM game_v2_question q JOIN de_kho d ON d.ma_de=q.ma_de
  JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
  LEFT JOIN loi_giai_cau l ON l.qid=q.qid LEFT JOIN cau_bo_tro bt ON bt.bam=l.bam
  WHERE COALESCE(d.da_xoa,0)=0 AND EXISTS(SELECT 1 FROM chua_loi_dot e WHERE e.qid_chuan=q.qid AND e.dong_luc IS NULL)
  ORDER BY q.qid`)
const parse = (v, fallback) => { try { return JSON.parse(v) ?? fallback } catch { return fallback } }
const source = roots.map(r => ({ cau: parse(r.json,null), bam:r.bam,
  songSinh:parse(r.song_sinh_json,[]), cauKiem:parse(r.cau_kiem_json,[]), nhanNen:parse(r.nhan_nen_json,[]), buoc:parse(r.buoc_json,[]) }))
writeFileSync('/tmp/nguon-hoc-lieu-chua.json', JSON.stringify({schemaVersion:1,docLuc:new Date().toISOString(),nguon:source}))
console.log(JSON.stringify({soCau:source.length,coBonBan:source.filter(r=>r.songSinh.length>=4).length,coBuoc:source.filter(r=>r.buoc.length).length}))
