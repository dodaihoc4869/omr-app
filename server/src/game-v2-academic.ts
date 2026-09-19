import type {Env} from './kieu'
import type {Profile} from './game-v2'
import {dapAnTheoMaDe} from './goi-cu'
import {hash,readScope,normalizeBank,readJson} from './game-v2-bank'
import {grade} from '../../src/game/than-thu-v2/core'
import {nhanExp} from '../../src/game/than-thu-hoa-hoc/kinh-nghiem'
import {docCauHinhExp,mocExpCuaEm} from './exp-d1'
type Row=Record<string,unknown>
export interface Academic {since?:string;seen:string[];sources:Record<string,string>;days:Record<string,number>;total:number;lastGain:number;at:string}
export const academicDay=(date:string)=>new Date(Date.parse(date)+7*3600000).toISOString().slice(0,10)
const obj=(s:unknown):Row=>{try{return JSON.parse(String(s??'{}'))}catch{return {}}}
const answer=(v:unknown)=>Array.isArray(v)?v.join(''):String(v??'').trim().toUpperCase()
export function creditAcademic(p:Profile,events:{key:string;at:string;amount:number}[],now=new Date().toISOString()){
 const a=p.academic??{seen:[],sources:{},days:{},total:0,lastGain:0,at:now},seen=new Set(a.seen);let gain=0
 for(const e of events){if(seen.has(e.key)||!Number.isFinite(Date.parse(e.at))||Date.parse(e.at)<Date.parse(a.since??p.cutover))continue
  const day=academicDay(e.at),amount=Math.min(Math.max(0,e.amount),Math.max(0,100-(a.days[day]??0)))
  seen.add(e.key);a.days[day]=(a.days[day]??0)+amount;gain+=amount
 }
 a.seen=[...seen];a.total+=gain;a.lastGain=gain;a.at=now;p.academic=a
 if(gain){const next=nhanExp({capDo:p.cap,exp:p.exp},gain);p.cap=next.capDo;p.exp=next.exp;p.earned+=gain}
 return gain
}
/** Read academic records only. The profile and its receipt ledger are committed together with CAS by the caller. */
export async function syncAcademic(env:Env,sbd:string,p:Profile,mom:unknown){
 creditAcademic(p,[]);const a=p.academic!
 const setting=await env.DB.prepare("SELECT json FROM game_v2_settings WHERE key='season'").first<{json:string}>()
 const started=setting?obj(setting.json).startedAt:null;if(typeof started==='string'&&Number.isFinite(Date.parse(started)))a.since=started
 const since=a.since??p.cutover
 const events:{key:string;at:string;amount:number}[]=[];let pending=0,processed=0
 const add=(key:string,at:string,amount=2)=>events.push({key,at,amount})
 const exams=await env.DB.prepare(`SELECT l.*,c.bo_theo_em_json FROM luot l JOIN ca c ON c.ma_ca=l.ma_ca WHERE l.sbd=? AND l.nop_luc>=? AND l.trang_thai IN ('da_nop','khoa') AND c.trang_thai<>'da_xoa' AND (c.cong_bo='ngay' OR (c.cong_bo='ca_lop_xong' AND (c.trang_thai='dong' OR NOT EXISTS(SELECT 1 FROM luot x WHERE x.ma_ca=c.ma_ca AND x.trang_thai<>'da_nop')))) ORDER BY l.nop_luc`).bind(sbd,since).all<Row>()
 const details=await env.DB.prepare('SELECT c.qid,c.dung_sai,c.ma_ca,c.lan_thu FROM chi_tiet_cau c JOIN luot l ON l.sbd=c.sbd AND l.ma_ca=c.ma_ca AND l.lan_thu=c.lan_thu WHERE c.sbd=? AND l.nop_luc>=? AND c.dung_sai IN (0,1) ORDER BY c.qid').bind(sbd,since).all<{qid:string;dung_sai:number;ma_ca:string;lan_thu:number}>()
 for(const l of exams.results){
  const rows:{results:{qid:string;dung_sai:number}[]}={results:details.results.filter(r=>r.ma_ca===l.ma_ca&&r.lan_thu===l.lan_thu)}
  if(!rows.results.length){
   if(processed++>=8){pending++;continue}
   try{
    const bank=await normalizeBank(await readJson(env,`key/${l.ma_ca}.json`),'exam'),responses=obj(l.dap_an_json)
    const paper=obj(l.bo_theo_em_json),assigned=(paper.bo as Row|undefined)?.[sbd]??paper[sbd]
    for(const q of bank){const submitted=(responses[`phan${q.phan}`]??{}) as Row;if(!Object.prototype.hasOwnProperty.call(submitted,q.qid)||Array.isArray(assigned)&&!assigned.includes(q.qid))continue;rows.results.push({qid:q.qid,dung_sai:grade(q,answer(submitted[q.qid]))?1:0})}
   }catch{/* Missing keys remain pending; no invented score. */}
   if(!rows.results.length){pending++;continue}
  }
  const correct=rows.results.filter(r=>r.qid&&r.dung_sai===1),at=String(l.nop_luc)
  const paid=new Set([...a.seen,...events.map(e=>e.key)].filter(k=>k.startsWith(`exam:${l.ma_ca}:`)))
  for(const r of correct){const key=`exam:${l.ma_ca}:${r.qid}`;if(paid.has(key)||paid.size>=25)continue;paid.add(key);add(key,at)}
  const score=Number(l.diem_i)+Number(l.diem_ii)+Number(l.diem_iii)
  const bonus=Number.isFinite(score)?Math.round(Math.max(0,Math.min(10,score))):0
  // One token per score point permits genuine improvements without paying old points twice.
  for(let i=0;i<bonus;i++)add(`score:${l.ma_ca}:${i}`,at,1)
 }
 const homework=await env.DB.prepare(`SELECT e.*,b.ma_de FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE e.sbd=? AND e.nop_luc>=? AND b.da_xoa=0 ORDER BY e.nop_luc`).bind(sbd,since).all<Row>()
 const repairs=await env.DB.prepare('SELECT * FROM nop_khac_phuc WHERE sbd=? AND nop_luc>=? ORDER BY nop_luc').bind(sbd,since).all<Row>()
 const cache=new Map<string,Row[]>()
 for(const row of [...homework.results.map(r=>({...r,kind:'home'})),...repairs.results.map(r=>({...r,kind:'repair'}))] as (Row&{kind:string})[]){
  const source=`${row.kind}:${row.khoa}`,fingerprint=await hash(row.dap_an_json);if(a.sources[source]===fingerprint)continue
  if(processed++>=8){pending++;continue}
  try{
   let keys:Map<string,string>
   if(row.kind==='home')keys=await dapAnTheoMaDe(env,String(row.ma_de),cache)
   else{const stored=await env.DE.get(`phieu/${row.ma_phieu}.json`);if(!stored){pending++;continue}const data=await new Response(stored.body).json() as {phieu?:{cau?:{id:string;dapAn:string}[]}};keys=new Map((data.phieu?.cau??[]).map(q=>[q.id,q.dapAn]))}
   if(!keys.size){pending++;continue}
   const responses=obj(row.dap_an_json);let n=0
   for(const [qid,expected] of keys){if(n>=20)break;if(expected&&answer(responses[qid])===answer(expected)){add(`practice:${qid}`,String(row.nop_luc));n++}}
   a.sources[source]=fingerprint
  }catch{pending++}
 }
 // Mom assignments are local: accept answers only for questions already in this learner's published scope.
 if(Array.isArray(mom)&&mom.length){
  const scope=await readScope(env,sbd),known=new Map(scope.pool.filter(q=>scope.evidence.some(e=>e.qid===q.qid)).map(q=>[q.qid,q]))
  for(const raw of mom.slice(0,8)){
   const m=raw as Row,source=`mom:${String(m.id).slice(0,100)}`,fingerprint=await hash(m.answers)
   if(a.sources[source]===fingerprint)continue
   const at=String(m.at??'');if(!Number.isFinite(Date.parse(at))||Date.parse(at)<Date.parse(since)||Date.parse(at)>Date.now()+60000)continue
   if(!m.answers||typeof m.answers!=='object'){pending++;continue}
   let found=0,n=0
   for(const [qid,value] of Object.entries(m.answers as Row).slice(0,200)){const q=known.get(qid);if(!q)continue;found++;if(n<20&&grade(q,answer(value))){add(`practice:${qid}`,new Date().toISOString());n++}}
   if(!found){pending++;continue}a.sources[source]=fingerprint
  }
 }
 // EXP HỌC TẬP MỚI (exp-d1.ts): với em đã bật, khoản có giờ SAU mốc do sổ `exp_so` trả — luật cũ ngừng sinh khoản mới. Khoản trước mốc vẫn trả như cũ.
 const moc=mocExpCuaEm(await docCauHinhExp(env),sbd,Date.now()),mocMs=moc?Date.parse(moc):Infinity
 const gain=creditAcademic(p,events.filter(e=>Date.parse(e.at)<mocMs));return {gain,pending}
}
