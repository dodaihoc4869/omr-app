// Nguồn thuộc kho đề; không truy vấn tên, SBD, đáp án/lịch sử của học sinh.
import { writeFileSync } from 'node:fs'
import { query } from './kiem-phat-hanh-chua.mjs'
const roots = await query(`SELECT q.json, l.bam, bt.song_sinh_json, bt.cau_kiem_json, bt.nhan_nen_json, bt.buoc_json,
  COUNT(DISTINCT e.id) AS so_dot,COUNT(DISTINCT e.sbd) AS so_em,
  COUNT(DISTINCT CASE WHEN COALESCE(e.chot_do_luc,0)>0 AND e.chot_do_luc<=CAST((julianday('now')-2440587.5)*86400000 AS INTEGER) THEN e.id END) AS so_qua_han,
  MIN(CASE WHEN COALESCE(e.chot_do_luc,0)>0 THEN e.chot_do_luc END) AS han_gan_nhat
  FROM chua_loi_dot e JOIN game_v2_question q ON q.qid=e.qid_chuan JOIN de_kho d ON d.ma_de=q.ma_de
  JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
  LEFT JOIN loi_giai_cau l ON l.qid=q.qid LEFT JOIN cau_bo_tro bt ON bt.bam=l.bam
  WHERE e.dong_luc IS NULL AND COALESCE(d.da_xoa,0)=0
    AND json_extract(q.json,'$.reviewed')=1 AND COALESCE(json_extract(q.json,'$.tuLuan'),0)<>1
    AND NOT EXISTS(SELECT 1 FROM chua_loi_hoc_lieu h WHERE h.qid_chuan=q.qid AND h.content_version=q.version AND h.trang_thai='du_dung')
  GROUP BY q.qid
  ORDER BY so_em DESC,so_qua_han DESC,CASE WHEN han_gan_nhat IS NULL THEN 1 ELSE 0 END,han_gan_nhat ASC,so_dot DESC,q.qid`)
const parse = (v, fallback) => { try { return JSON.parse(v) ?? fallback } catch { return fallback } }
const source = roots.map(r => ({ cau: parse(r.json,null), bam:r.bam,
  uuTien:{soEm:Number(r.so_em??0),soDot:Number(r.so_dot??0),soQuaHan:Number(r.so_qua_han??0),hanGanNhat:r.han_gan_nhat==null?null:Number(r.han_gan_nhat)},
  songSinh:parse(r.song_sinh_json,[]), cauKiem:parse(r.cau_kiem_json,[]), nhanNen:parse(r.nhan_nen_json,[]), buoc:parse(r.buoc_json,[]) }))
writeFileSync('/tmp/nguon-hoc-lieu-chua.json', JSON.stringify({schemaVersion:1,docLuc:new Date().toISOString(),nguon:source}))
console.log(JSON.stringify({soCau:source.length,soEmCho:source.reduce((n,r)=>n+r.uuTien.soEm,0),soQuaHan:source.reduce((n,r)=>n+r.uuTien.soQuaHan,0),coBonBan:source.filter(r=>r.songSinh.length>=4).length,coBuoc:source.filter(r=>r.buoc.length).length}))
