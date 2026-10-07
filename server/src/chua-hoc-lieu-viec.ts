// Nguồn riêng cho máy soạn, chỉ gắn sau cổng mã bí mật của giáo viên.
import type { Env } from './kieu'
import { laCauTuLuan } from '../../src/lib/cau-tu-luan'
import type { PrivateQuestion } from '../../src/game/than-thu-v2/core'
export async function viecVongChua(env:Env,b:Record<string,unknown>) {
  const so=Number.isInteger(b.so) ? Math.max(1,Math.min(3,Number(b.so))) : 1
  const daLam=Array.isArray(b.daLam) ? b.daLam.filter(x=>typeof x==='string').slice(0,5000) : []
  const r=await env.DB.prepare(`SELECT q.json,l.bam,bt.song_sinh_json,bt.cau_kiem_json,bt.nhan_nen_json,bt.buoc_json,
    COUNT(*) AS soDot FROM chua_loi_dot e JOIN game_v2_question q ON q.qid=e.qid_chuan
    JOIN de_kho d ON d.ma_de=q.ma_de JOIN game_v2_index g ON g.ma_de=d.ma_de AND g.source_version=d.cap_nhat_luc
    LEFT JOIN loi_giai_cau l ON l.qid=q.qid LEFT JOIN cau_bo_tro bt ON bt.bam=l.bam
    WHERE e.dong_luc IS NULL AND COALESCE(d.da_xoa,0)=0 AND json_extract(q.json,'$.reviewed')=1
      AND q.qid NOT IN (SELECT value FROM json_each(?))
      AND NOT EXISTS(SELECT 1 FROM chua_loi_hoc_lieu h WHERE h.qid_chuan=q.qid AND h.content_version=q.version AND h.trang_thai='du_dung')
    GROUP BY q.qid ORDER BY soDot DESC,q.qid LIMIT ?`).bind(JSON.stringify(daLam),so*4).all<Record<string,unknown>>()
  const parse=(x:unknown, fallback:unknown) => { try{return JSON.parse(String(x))??fallback}catch{return fallback} }
  const viec=(r.results??[]).map(x=>({cau:parse(x.json,null) as PrivateQuestion|null,
    daCo:{songSinh:parse(x.song_sinh_json,[]),cauKiem:parse(x.cau_kiem_json,[]),nhanNen:parse(x.nhan_nen_json,[]),buoc:parse(x.buoc_json,[])}}))
    .filter(x=>x.cau?.reviewed===true && !laCauTuLuan(x.cau)).slice(0,so)
  return {ok:true,viec}
}
