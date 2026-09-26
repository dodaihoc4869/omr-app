// import type {Env} from './kieu'
// import {newsDay} from './parent-news'
export function teacherDayRange(day:string){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(day)))throw new Error('Ngày không hợp lệ.')
 const start=new Date(`${day}T00:01:00+07:00`)
 if(new Date(start.getTime()+7*3600000).toISOString().slice(0,10)!==day)throw new Error('Ngày không hợp lệ.')
 return {start:start.toISOString(),end:new Date(start.getTime()+86400000).toISOString()}
}
// export async function teacherNews(env:Env,b:Record<string,unknown>){
//  const day=String(b.day||newsDay()),{start,end}=teacherDayRange(day)
//  const query=async(sql:string)=>(await env.DB.prepare(sql).bind(start,end).all<Record<string,any>>()).results
//  const [exams,homework,submissions,board,changes]=await Promise.all([
//  query(`SELECT c.ma_ca,c.ten_ca,c.lop,c.trang_thai,COALESCE(c.bat_dau_thi_luc,c.mo_luc,c.bat_dau) luc,
//  (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=c.ma_ca) luot,
//  (SELECT COUNT(*) FROM luot l WHERE l.ma_ca=c.ma_ca AND l.nop_luc IS NOT NULL) da_nop
//  FROM ca c WHERE COALESCE(c.bat_dau_thi_luc,c.mo_luc,c.bat_dau)>=? AND COALESCE(c.bat_dau_thi_luc,c.mo_luc,c.bat_dau)<? ORDER BY luc DESC`),
//  query(`SELECT b.ma_btvn,b.ma_ca,b.ma_de,b.so_cau,b.giao_luc,b.han_nop,b.da_xoa,
//  COUNT(e.sbd) tong,SUM(CASE WHEN e.nop_luc IS NOT NULL THEN 1 ELSE 0 END) da_nop,SUM(CASE WHEN e.thu_hoi=1 THEN 1 ELSE 0 END) thu_hoi
//  FROM btvn b LEFT JOIN btvn_em e ON e.ma_btvn=b.ma_btvn WHERE b.giao_luc>=? AND b.giao_luc<? GROUP BY b.ma_btvn ORDER BY b.giao_luc DESC`),
//  query(`SELECT 'thi' loai,COUNT(*) n FROM luot WHERE nop_luc>=? AND nop_luc<?`),
//  query(`SELECT COUNT(*) n,COUNT(DISTINCT sbd) hoc_sinh,SUM(dat) dat FROM len_bang WHERE luc>=? AND luc<?`),
//  query(`SELECT hanh_dong,COUNT(*) n FROM btvn_em_lich_su WHERE luu_luc>=? AND luu_luc<? GROUP BY hanh_dong`)
//  ])
//  const submittedHomework=await query(`SELECT COUNT(*) n FROM (SELECT khoa,nop_luc FROM btvn_em UNION SELECT khoa,json_extract(du_lieu,'$.nop_luc') nop_luc FROM btvn_em_lich_su) WHERE nop_luc>=? AND nop_luc<?`)
//  const daily=(await env.DB.prepare('SELECT role,COUNT(*) visits FROM app_presence WHERE day=? GROUP BY role').bind(day).all<Record<string,any>>()).results
//  const online=(await env.DB.prepare('SELECT role,COUNT(DISTINCT session_id) online FROM app_presence WHERE last_seen>=? GROUP BY role').bind(new Date(Date.now()-90000).toISOString()).all<Record<string,any>>()).results
//  const visits=['gv','hs','ph'].map(role=>({role,visits:Number(daily.find(x=>x.role===role)?.visits||0),online:Number(online.find(x=>x.role===role)?.online||0)}))
//  return {ok:true,visits,day,updatedAt:new Date().toISOString(),exams,homework,examSubmitted:Number(submissions[0]?.n||0),homeworkSubmitted:Number(submittedHomework[0]?.n||0),board:board[0],changes}
// }

// export async function recordPresence(env:Env,b:Record<string,unknown>){
//  const session=String(b.session||''),role=String(b.role||'')
//  if(!/^[a-zA-Z0-9-]{12,90}$/.test(session)||!['gv','hs','ph'].includes(role))return {ok:false,error:'Phiên không hợp lệ.'}
//  const now=new Date().toISOString()
//  await env.DB.prepare('INSERT INTO app_presence(day,session_id,role,first_seen,last_seen) VALUES(?,?,?,?,?) ON CONFLICT(day,session_id,role) DO UPDATE SET last_seen=excluded.last_seen').bind(newsDay(),session,role,now,now).run()
//  return {ok:true}
// }
