// Chỉ đọc: gọi em có bằng chứng tự làm đúng; không có thì xếp theo kỹ năng của câu.
import type { Env } from './kieu'
import { SQL_LA_LAN_LAM } from './omni-kieu'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
import { sqlTenLopHs } from './goi-bai-7'
type Row=Record<string,unknown>
const ds=(v:unknown,n:number)=>Array.isArray(v)?[...new Set(v.filter((x):x is string=>typeof x==='string'&&!!x&&x.length<=180))].slice(0,n):[]
export async function ungVienChieu(env:Env,b:Row){
 let sbds=ds(b.sbd,200);const qids=ds(b.qids,120)
 if(!sbds.length&&typeof b.lop==='string'&&b.lop){const r=await env.DB.prepare(`SELECT h.sbd FROM hoc_sinh h WHERE ${sqlTenLopHs('h')}=? AND COALESCE(h.trang_thai,'')<>'khoa' LIMIT 200`).bind(b.lop).all<{sbd:string}>();sbds=r.results.map(e=>e.sbd)}
 if(!sbds.length||!qids.length)return {ok:true,cau:{}}
 const [em,cau,kn,p,luot]=await Promise.all([
  env.DB.prepare(`SELECT sbd,ho_ten FROM hoc_sinh h WHERE sbd IN(SELECT value FROM json_each(?)) AND COALESCE(trang_thai,'')<>'khoa' AND (?='' OR ${sqlTenLopHs('h')}=?)`).bind(JSON.stringify(sbds),typeof b.lop==='string'?b.lop:'',typeof b.lop==='string'?b.lop:'').all<Row>(),
  env.DB.prepare('SELECT qid,version FROM game_v2_question WHERE qid IN(SELECT value FROM json_each(?))').bind(JSON.stringify(qids)).all<Row>(),
  env.DB.prepare('SELECT qid,vkn_json FROM omni_q WHERE qid IN(SELECT value FROM json_each(?))').bind(JSON.stringify(qids)).all<Row>(),
  env.DB.prepare('SELECT sbd,vkn_id,p FROM omni_p_vkn WHERE sbd IN(SELECT value FROM json_each(?))').bind(JSON.stringify(sbds)).all<Row>(),
  env.DB.prepare(`SELECT s.sbd,s.qid,s.ket_qua,s.luc,json_extract(CASE WHEN json_valid(s.raw_json) THEN s.raw_json ELSE '{}' END,'$.ht_cau_version') version FROM su_kien_hoc s WHERE s.sbd IN(SELECT value FROM json_each(?)) AND s.qid IN(SELECT value FROM json_each(?)) AND ${SQL_LA_LAN_LAM} AND COALESCE(s.assistance,'none')='none' AND COALESCE(s.visibility,'')<>'embargoed' AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND ${SQL_DA_CONG_BO('c')})) AND NOT EXISTS(SELECT 1 FROM loi_giai_hoi h WHERE h.sbd=s.sbd AND h.qid=s.qid AND julianday(h.luc)<=julianday(s.luc) AND julianday(h.luc)>julianday(s.luc)-0.5) ORDER BY s.luc DESC LIMIT 20000`).bind(JSON.stringify(sbds),JSON.stringify(qids)).all<Row>(),
 ])
 const versions=new Map(cau.results.map(q=>[String(q.qid),String(q.version)])),skills=new Map<string,Set<string>>()
 for(const r of kn.results){const a=skills.get(String(r.qid))??new Set<string>();const values=JSON.parse(String(r.vkn_json)) as unknown;if(!Array.isArray(values))throw new Error('Ma trận kỹ năng của câu chưa hợp lệ.');for(const k of values)if(typeof k==='string'&&k)a.add(k);skills.set(String(r.qid),a)}
 const pv=new Map(p.results.filter(r=>Number.isFinite(Number(r.p))&&Number(r.p)>=0&&Number(r.p)<=1).map(r=>[`${r.sbd}|${r.vkn_id}`,Number(r.p)])),last=new Map<string,Row>()
 for(const r of luot.results){if(String(r.version??'')!==versions.get(String(r.qid)))continue;const key=`${r.sbd}|${r.qid}`;if(!last.has(key))last.set(key,r)}
 const result:Record<string,{sbd:string;ten:string;loai:'da_dung'|'du_bao';p:number|null;luc:string|null}[]>={}
 for(const qid of qids){const ks=[...(skills.get(qid)??[])];result[qid]=em.results.flatMap(e=>{const l=last.get(`${e.sbd}|${qid}`),daDung=l&&Number(l.ket_qua)===1,du=ks.length?Math.min(...ks.map(k=>pv.get(`${e.sbd}|${k}`)??0.3)):null;if(!daDung&&du===null)return [];return [{sbd:String(e.sbd),ten:String(e.ho_ten??e.sbd),loai:daDung?'da_dung' as const:'du_bao' as const,p:du,luc:daDung?String(l.luc):null}]}).sort((a,c)=>Number(c.loai==='da_dung')-Number(a.loai==='da_dung')||(c.p??0)-(a.p??0)||(c.luc??'').localeCompare(a.luc??'')||a.ten.localeCompare(c.ten,'vi'))}
 return {ok:true,cau:result}
}
