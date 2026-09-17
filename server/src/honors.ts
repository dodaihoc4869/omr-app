import type {Env} from './kieu'
import {newsDay} from './parent-news'
type Row=Record<string,any>
export function honorDay(now=Date.now()){return new Date(Date.parse(newsDay(now)+'T00:00:00Z')-86400000).toISOString().slice(0,10)}
export function rankHonors(rows:Row[],withRefs=false){
 const best=new Map<string,Row>()
 const cmp=(a:Row,b:Row)=>b.score-a.score||(a.seconds??Infinity)-(b.seconds??Infinity)||a.submitted.localeCompare(b.submitted)||a.key.localeCompare(b.key)
 for(const r of rows){const score=Number(r.tong),duration=(Date.parse(r.nop_luc)-Date.parse(r.vao_luc))/1000;if(r.tong==null||!Number.isFinite(score)||score<0||score>10)continue
 const row={key:String(r.sbd),name:String(r.ho_ten||'Học sinh'),score,seconds:Number.isFinite(duration)&&duration>0?Math.round(duration):null,submitted:String(r.nop_luc),exam:String(r.ten_ca||'Bài kiểm tra'),pet:r.pet||null,nickname:r.nickname||undefined,level:Math.min(120,Math.max(1,Number(r.level)||1))}
 const old=best.get(row.key);if(!old||cmp(row,old)<0)best.set(row.key,row)
 }
 return [...best.values()].sort(cmp).slice(0,3).map(({key,submitted,...r},i)=>({...r,rank:i+1,...(withRefs?{studentRef:key}:{})}))
}
export async function dailyHonors(env:Env,live=true){
 const day=live?newsDay():honorDay()
 const cached=await env.DB.prepare('SELECT body FROM daily_honors WHERE day=?').bind(day).first<{body:string}>()
 if(!live&&cached&&JSON.parse(cached.body).version===4)return publicHonors(env,JSON.parse(cached.body))
 const start=new Date(`${day}T00:00:00+07:00`).toISOString(),end=new Date(Date.parse(start)+86400000).toISOString()
 const rows=await env.DB.prepare(`SELECT l.sbd,COALESCE(h.ho_ten,l.ho_ten) ho_ten,l.tong,l.nop_luc,l.vao_luc,c.ten_ca,
 json_extract(g.json,'$.nickname') nickname,json_extract(g.json,'$.pet') pet,json_extract(g.json,'$.cap') level
 FROM luot l JOIN ca c ON c.ma_ca=l.ma_ca LEFT JOIN hoc_sinh h ON h.sbd=l.sbd LEFT JOIN game_v2_profile g ON g.sbd=l.sbd
 WHERE l.sbd<>'12121212' AND l.nop_luc>=? AND l.nop_luc<? AND l.tong IS NOT NULL AND l.lan_thu=1
 AND c.loai='thi' AND c.trang_thai<>'da_xoa' AND (c.cong_bo='ngay' OR (c.cong_bo='ca_lop_xong' AND NOT EXISTS(SELECT 1 FROM luot z WHERE z.ma_ca=c.ma_ca AND z.nop_luc IS NULL)))`).bind(start,end).all<Row>()
 if(live&&!rows.results.length)return dailyHonors(env,false)
 const report={version:4,live,day,publishedAt:new Date().toISOString(),winners:rankHonors(rows.results,!live)}
 if(live)return {ok:true,...report}
 await env.DB.prepare('INSERT INTO daily_honors(day,created_at,body) VALUES(?,?,?) ON CONFLICT(day) DO UPDATE SET created_at=excluded.created_at,body=excluded.body').bind(day,report.publishedAt,JSON.stringify(report)).run()
 const saved=await env.DB.prepare('SELECT body FROM daily_honors WHERE day=?').bind(day).first<{body:string}>()
 return publicHonors(env,JSON.parse(saved?.body||JSON.stringify(report)))
}

async function publicHonors(env:Env,report:Row){
 const winners=await Promise.all((report.winners as Row[]).map(async winner=>{const {studentRef,...publicWinner}=winner;if(studentRef){const profile=await env.DB.prepare("SELECT json_extract(json,'$.nickname') nickname FROM game_v2_profile WHERE sbd=?").bind(studentRef).first<{nickname:string|null}>();publicWinner.nickname=profile?.nickname||undefined}return publicWinner}))
 return {ok:true,...report,winners}
}
