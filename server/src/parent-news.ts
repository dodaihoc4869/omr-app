import type {Env} from './kieu'
import {hsCauSai} from './goi-cu'
import {mom} from './mom'
type Row=Record<string,any>
// Ngày học đổi lúc 00:01 Việt Nam, không phụ thuộc đồng hồ điện thoại.
export function newsDay(now=Date.now()){return new Date(now+7*3600000-60000).toISOString().slice(0,10)}
export function analyzeParent(sbd:string,exams:Row[],details:Row[],pending:number,now=Date.now(),pendingDetails?:{btvn:number;mom:number;daily:number}){
 const day=newsDay(now), today=exams.filter(e=>new Date(Date.parse(e.nop_luc)+7*3600000).toISOString().slice(0,10)===day)
 const latest=exams[0], scores=today.filter(e=>e.tong!=null).map(e=>Number(e.tong))
 const relevant=details.filter(d=>d.dung_sai===0)
 const topics=new Map<string,number>();for(const d of relevant){const name=String(d.chuyen_de||'Kiến thức cần ôn');topics.set(name,(topics.get(name)||0)+1)}
 const seconds=details.map(d=>Number(d.giay)).filter(v=>v>=5&&v<=1200).sort((a,b)=>a-b)
 const sec=seconds.length>=5?Math.max(45,seconds[Math.floor(seconds.length/2)]):90
 const score=scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:latest?.tong==null?null:Number(latest.tong)
 const mode=score!==null&&score<5?'Lựa chọn luyện câu (0–1 sao)':'Làm lại các câu sai'
 const minutes=today.length>=2?10:score!==null&&score<5?15:20
 const count=Math.min(relevant.length,Math.max(0,Math.min(20,Math.floor(minutes*60/sec))-pending))
 return {day,sbd,updatedAt:new Date(now).toISOString(),today:today.map(e=>({tenCa:e.ten_ca||e.ma_ca,diem:e.tong,nopLuc:e.nop_luc})),score,weak:[...topics].sort((a,b)=>b[1]-a[1]).slice(0,3).map(([name,count])=>({name,count})),wrong:relevant.length,pending,pendingDetails:pendingDetails||{btvn:0,mom:0,daily:0},questionCount:count,assignmentCount:count>0?1:0,minutes:Math.ceil(count*sec/60),mode,modeKey:score!==null&&score<5?'basic':'retry',speedMeasured:seconds.length>=5,reason:pending>=Math.min(20,Math.floor(minutes*60/sec))?'Con còn bài chưa hoàn thành; ưu tiên làm xong trước khi giao thêm.':!relevant.length?'Chưa có câu sai đã chấm cần ôn. Chưa đề xuất thêm bài.':`Ưu tiên ${Math.min(3,topics.size)} nhóm kiến thức còn sai, với lượng bài vừa sức theo ${seconds.length>=5?'tốc độ làm bài đã ghi nhận':'ước lượng ban đầu vì chưa đủ dữ liệu tốc độ'}.`}
}
async function data(env:Env,sbd?:string){
 const where=sbd?' WHERE sbd=?':''
 const q=async(sql:string)=>{const st=env.DB.prepare(sql);return (await (sbd?st.bind(sbd):st).all<Row>()).results}
 const exams=await q(`SELECT l.sbd,l.ma_ca,l.nop_luc,l.tong,c.ten_ca FROM luot l LEFT JOIN ca c ON c.ma_ca=l.ma_ca WHERE l.nop_luc IS NOT NULL ${sbd?'AND l.sbd=?':''} AND l.lan_thu=(SELECT MAX(z.lan_thu) FROM luot z WHERE z.ma_ca=l.ma_ca AND z.sbd=l.sbd) ORDER BY l.nop_luc DESC`)
 const details=await q(`SELECT t.sbd,t.qid,t.chuyen_de,t.dung_sai,t.giay,t.muc_do,l.nop_luc FROM chi_tiet_cau t JOIN luot l ON l.ma_ca=t.ma_ca AND l.sbd=t.sbd AND l.lan_thu=t.lan_thu WHERE l.nop_luc IS NOT NULL ${sbd?'AND t.sbd=?':''} AND NOT EXISTS(SELECT 1 FROM chi_tiet_cau z JOIN luot n ON n.ma_ca=z.ma_ca AND n.sbd=z.sbd AND n.lan_thu=z.lan_thu WHERE z.sbd=t.sbd AND z.qid=t.qid AND n.nop_luc>l.nop_luc)`)
 const pendingDaily=await q(`SELECT sbd,SUM(question_count) n FROM mom_bai ${where?where+' AND':'WHERE'} submitted_at IS NULL AND id LIKE 'daily_%' GROUP BY sbd`)
 const pendingMom=await q(`SELECT sbd,SUM(question_count) n FROM mom_bai ${where?where+' AND':'WHERE'} submitted_at IS NULL AND id NOT LIKE 'daily_%' GROUP BY sbd`)
 const homework=await q(`SELECT e.sbd,SUM(b.so_cau) n FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL ${sbd?'AND e.sbd=?':''} GROUP BY e.sbd`)
 const practice=await q(`SELECT sbd,submitted_at,result FROM mom_bai WHERE submitted_at IS NOT NULL ${sbd?'AND sbd=?':''} ORDER BY submitted_at ASC`)
 return {exams,details:applyPracticeOutcomes(details,practice),pendingDaily,pendingMom,homework}
}
export async function refreshDailyNews(env:Env,sbd?:string){
 const d=await data(env,sbd)
 const students=sbd?[{sbd}]:(await env.DB.prepare('SELECT sbd FROM hoc_sinh').all<{sbd:string}>()).results
 const reports=students.map(e=>{
  const btvn=Number(d.homework.find(x=>x.sbd===e.sbd)?.n||0)
  const mom=Number(d.pendingMom.find(x=>x.sbd===e.sbd)?.n||0)
  const daily=Number(d.pendingDaily.find(x=>x.sbd===e.sbd)?.n||0)
  const pending=btvn+mom+daily
  return analyzeParent(e.sbd,d.exams.filter(x=>x.sbd===e.sbd),d.details.filter(x=>x.sbd===e.sbd),pending,Date.now(),{btvn,mom,daily})
 })
 const statements=reports.map(r=>env.DB.prepare('INSERT INTO parent_daily_news(sbd,day,updated_at,body) VALUES(?,?,?,?) ON CONFLICT(sbd,day) DO UPDATE SET updated_at=excluded.updated_at,body=excluded.body').bind(r.sbd,r.day,r.updatedAt,JSON.stringify(r)))
 for(let i=0;i<statements.length;i+=50)await env.DB.batch(statements.slice(i,i+50))
 return {reports,details:d.details}
}
export async function parentNews(env:Env,action:string,b:Record<string,unknown>){
 const sbd=String(b.sbd??'').trim()
 if(!sbd||!await env.DB.prepare('SELECT sbd FROM hoc_sinh WHERE sbd=?').bind(sbd).first())throw new Error('Không tìm thấy số báo danh của con.')
 const {reports,details}=await refreshDailyNews(env,sbd), report=reports[0]
 if(action==='list'){
   const history=await env.DB.prepare('SELECT body FROM parent_daily_news WHERE sbd=? ORDER BY day DESC LIMIT 14').bind(sbd).all<{body:string}>()
   const daily=await env.DB.prepare('SELECT id,submitted_at FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,`daily_${report.day}`).first()
   if(!daily?.submitted_at&&report.questionCount>0&&!report.pendingDetails?.daily){
     report.pendingDetails={...report.pendingDetails,daily:report.questionCount}
     report.pending=(report.pendingDetails.btvn||0)+(report.pendingDetails.mom||0)+report.pendingDetails.daily
   }
   return {ok:true,report,history:history.results.map(x=>JSON.parse(x.body)),daily}
 }
 if(action!=='assign')throw new Error('Thao tác không hợp lệ.')
 const id=`daily_${report.day}`
 const existing=await env.DB.prepare('SELECT id FROM mom_bai WHERE sbd=? AND id=?').bind(sbd,id).first()
 if(existing)return {ok:true,alreadySent:true,id}
 if(!report.questionCount)throw new Error(report.reason)
 const result=await hsCauSai(env,{sbd,dsMaCa:[]})
 const weakIds=new Set(details.filter(x=>x.dung_sai===0).map(x=>x.qid))
 const seen=new Set<string>()
 let candidates=((result.items||[]) as Row[]).filter(q=>{if(!q.qid||seen.has(q.qid)||!weakIds.has(q.qid)||!q.text||!q.dapAnDung)return false;seen.add(q.qid);return true})
 if(report.modeKey==='basic')candidates=candidates.filter(q=>Number(q.sao||0)<=1).sort((a,b)=>Number(a.sao||0)-Number(b.sao||0))
 candidates=spreadTopics(candidates,report.weak.map(t=>t.name))
 const dsCau=candidates.slice(0,report.questionCount).map(q=>({...q,id:q.qid,dapAn:q.dapAnDung,choices:q.phan==='II'?[]:q.choices,loiGiai:q.loiGiai}))
 if(!dsCau.length)throw new Error('Chưa tải đủ nội dung câu hỏi để giao. Phụ huynh thử lại sau.')
 await mom(env,'create',{sbd,id,tieuDe:`Ôn tập ngày ${report.day} · ${dsCau.length} câu`,dsCau})
 return {ok:true,id,questionCount:dsCau.length}
}

export function spreadTopics(candidates:Row[],priorities:string[]){
 const groups=new Map<string,Row[]>()
 for(const q of candidates){const k=String(q.chuyenDe||q.chuyen_de||'Kiến thức cần ôn');const g=groups.get(k)||[];g.push(q);groups.set(k,g)}
 const keys=[...priorities.filter(k=>groups.has(k)),...[...groups.keys()].filter(k=>!priorities.includes(k))]
 const out:Row[]=[]
 while(out.length<candidates.length){for(const k of keys){const q=groups.get(k)!.shift();if(q)out.push(q)}}
 return out
}

// Only a later, server-graded practice response supersedes an earlier exam error.
export function applyPracticeOutcomes(details:Row[],practice:Row[]){
 const updated=details.map(d=>({...d}))
 for(const p of practice){
  let outcomes:Row[]=[];try{outcomes=JSON.parse(p.result||'{}').questionOutcomes||[]}catch{continue}
  for(const o of outcomes){for(const d of updated){if(d.sbd===p.sbd&&d.qid===o.qid&&Date.parse(p.submitted_at)>Date.parse(d.nop_luc)){d.dung_sai=o.correct?1:0;d.nop_luc=p.submitted_at}}}
 }
 return updated
}
