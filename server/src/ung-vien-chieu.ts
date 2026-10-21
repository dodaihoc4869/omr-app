// Chỉ đọc: ứng viên lên bảng cho từng câu (chỉ em CÓ số đo: đã đúng / dự kiến — đúng hợp đồng cũ) + `em` = MỌI em hợp lệ một lần
// {ten, soLan14, lanCuoiLenBang} (máy thầy tự thêm em chưa có số đo vào từng câu) + `mucDo` từng câu + `soSai` {qid:{sbd:n}} — để chia tầng
// (src/lib/chon-em-phan-tang.ts). Trường theo em để ở bảng `em`, không lặp theo câu × em (gói nhỏ hơn).
// Ba truy vấn thêm đi chung một đợt Promise.all — không thêm vòng chờ nối tiếp.
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
const J=(v:unknown)=>JSON.stringify(v)
 const [em,cau,kn,p,luot,lb,md]=await Promise.all([
  env.DB.prepare(`SELECT sbd,ho_ten FROM hoc_sinh h WHERE sbd IN(SELECT value FROM json_each(?)) AND COALESCE(trang_thai,'')<>'khoa' AND (?='' OR ${sqlTenLopHs('h')}=?)`).bind(JSON.stringify(sbds),typeof b.lop==='string'?b.lop:'',typeof b.lop==='string'?b.lop:'').all<Row>(),
  env.DB.prepare('SELECT qid,version FROM game_v2_question WHERE qid IN(SELECT value FROM json_each(?))').bind(JSON.stringify(qids)).all<Row>(),
  env.DB.prepare('SELECT qid,vkn_json FROM omni_q WHERE qid IN(SELECT value FROM json_each(?))').bind(JSON.stringify(qids)).all<Row>(),
  env.DB.prepare('SELECT sbd,vkn_id,p FROM omni_p_vkn WHERE sbd IN(SELECT value FROM json_each(?))').bind(JSON.stringify(sbds)).all<Row>(),
  env.DB.prepare(`SELECT s.sbd,s.qid,s.ket_qua,s.luc,json_extract(CASE WHEN json_valid(s.raw_json) THEN s.raw_json ELSE '{}' END,'$.ht_cau_version') version FROM su_kien_hoc s WHERE s.sbd IN(SELECT value FROM json_each(?)) AND s.qid IN(SELECT value FROM json_each(?)) AND ${SQL_LA_LAN_LAM} AND COALESCE(s.assistance,'none')='none' AND COALESCE(s.visibility,'')<>'embargoed' AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND ${SQL_DA_CONG_BO('c')})) AND NOT EXISTS(SELECT 1 FROM loi_giai_hoi h WHERE h.sbd=s.sbd AND h.qid=s.qid AND julianday(h.luc)<=julianday(s.luc) AND julianday(h.luc)>julianday(s.luc)-0.5) ORDER BY s.luc DESC LIMIT 20000`).bind(JSON.stringify(sbds),JSON.stringify(qids)).all<Row>(),
  env.DB.prepare(`SELECT sbd,SUM(luc>=?) n,MAX(luc) cuoi FROM len_bang WHERE sbd IN(SELECT value FROM json_each(?)) AND luc>=? GROUP BY sbd`).bind(new Date(Date.now()-14*864e5).toISOString(),J(sbds),new Date(Date.now()-60*864e5).toISOString()).all<Row>(),
  env.DB.prepare('SELECT qid,MAX(muc_do) md FROM cau_meta WHERE qid IN(SELECT value FROM json_each(?)) GROUP BY qid').bind(J(qids)).all<Row>(),
 ])
 const versions=new Map(cau.results.map(q=>[String(q.qid),String(q.version)])),skills=new Map<string,Set<string>>()
 for(const r of kn.results){const a=skills.get(String(r.qid))??new Set<string>();const values=JSON.parse(String(r.vkn_json)) as unknown;if(!Array.isArray(values))throw new Error('Ma trận kỹ năng của câu chưa hợp lệ.');for(const k of values)if(typeof k==='string'&&k)a.add(k);skills.set(String(r.qid),a)}
 const pv=new Map(p.results.filter(r=>Number.isFinite(Number(r.p))&&Number(r.p)>=0&&Number(r.p)<=1).map(r=>[`${r.sbd}|${r.vkn_id}`,Number(r.p)])),last=new Map<string,Row>()
 const sai=new Map<string,number>()
 for(const r of luot.results){if(String(r.version??'')!==versions.get(String(r.qid)))continue;const key=`${r.sbd}|${r.qid}`;if(!last.has(key))last.set(key,r);if(Number(r.ket_qua)===0)sai.set(key,(sai.get(key)??0)+1)}
 const lenBang=new Map(lb.results.map(r=>[String(r.sbd),{soLan14:Number(r.n)||0,lanCuoiLenBang:r.cuoi==null?null:String(r.cuoi)}]))
 type Em={sbd:string;ten:string;loai:'da_dung'|'du_bao';p:number|null;luc:string|null}
 const result:Record<string,Em[]>={}
 // Không em nào có số đo ở kỹ năng nào của câu ⇒ p=null ("chưa có số đo"), KHÔNG lấp 0,3 cho cả câu.
 for(const qid of qids){const ks=[...(skills.get(qid)??[])];result[qid]=em.results.flatMap((e):Em[]=>{const s=String(e.sbd),l=last.get(`${s}|${qid}`),daDung=!!l&&Number(l.ket_qua)===1,du=ks.some(k=>pv.has(`${s}|${k}`))?Math.min(...ks.map(k=>pv.get(`${s}|${k}`)??0.3)):null;if(!daDung&&du===null)return [];return [{sbd:s,ten:String(e.ho_ten??s),loai:daDung?'da_dung':'du_bao',p:du,luc:daDung&&l?String(l.luc):null}]}).sort((a,c)=>Number(c.loai==='da_dung')-Number(a.loai==='da_dung')||(c.p??0)-(a.p??0)||(c.luc??'').localeCompare(a.luc??'')||a.ten.localeCompare(c.ten,'vi'))}
 // Số lần SAI từng câu (vai lên bảng ở chữa câu) — bảng riêng {qid:{sbd:n}}, có cả em chưa có số đo kỹ năng.
 const soSai:Record<string,Record<string,number>>={}
 for(const [k,n] of sai){const [s,q]=k.split('|') as [string,string];(soSai[q]??={})[s]=n}
 const emRa:Record<string,{ten:string;soLan14:number;lanCuoiLenBang:string|null}>={}
 for(const e of em.results){const s=String(e.sbd);emRa[s]={ten:String(e.ho_ten??s),...(lenBang.get(s)??{soLan14:0,lanCuoiLenBang:null})}}
 const mucDo:Record<string,string>={}
 for(const r of md.results)if(r.md!=null)mucDo[String(r.qid)]=String(r.md)
 return {ok:true,cau:result,mucDo,em:emRa,soSai}
}
