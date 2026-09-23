import type {Env} from './kieu'
import {gameIdentity} from './game-v2-auth'
import {buildPushPayload} from '@block65/webcrypto-web-push'
export function validPushEndpoint(value:string){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(u.hostname==='fcm.googleapis.com'||u.hostname==='web.push.apple.com'||u.hostname.endsWith('.push.apple.com')||u.hostname==='updates.push.services.mozilla.com'||u.hostname.endsWith('.notify.windows.com'))}catch{return false}}
export async function syncNotices(env:Env,sbd?:string){
 // Stable IDs make polling and scheduled execution idempotent.
 // HẠ TẢI D1 (Boss 22/09, mốc 5): lọc `sbd` đẩy vào TỪNG vế UNION ALL (dùng idx_btvn_em(sbd) và mom_bai_student_date(sbd,...)) thay vì
 // lọc Ở NGOÀI sau khi đã gộp — trước đây mỗi lượt em mở thông báo quét CẢ HAI bảng của TOÀN TRƯỜNG rồi mới lọc. `sbd = ?` TRỰC TIẾP
 // (không phải `? IS NULL OR sbd = ?`): SQLite/D1 không dùng chỉ mục khi có OR với tham số — đo bằng EXPLAIN QUERY PLAN, xem test.
 // `deliverNotices` (cron cả trường) gọi KHÔNG `sbd` ⇒ đường KHÔNG lọc, hành vi y hệt cũ.
 const tasks=sbd
  ? `SELECT e.sbd,'btvn:'||e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL AND b.han_nop>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND e.sbd=?
    UNION ALL SELECT sbd,'mom:'||sbd||':'||id,'Bài luyện mới',title,'mom',created_at,NULL FROM mom_bai WHERE submitted_at IS NULL AND sbd=?`
  : `SELECT e.sbd,'btvn:'||e.khoa id,'Bài tập mới từ Thầy' title,b.ma_de body,'btvn' target,b.giao_luc created_at,b.han_nop deadline FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE b.da_xoa=0 AND e.thu_hoi=0 AND e.nop_luc IS NULL AND b.han_nop>strftime('%Y-%m-%dT%H:%M:%fZ','now')
    UNION ALL SELECT sbd,'mom:'||sbd||':'||id,'Bài luyện mới',title,'mom',created_at,NULL FROM mom_bai WHERE submitted_at IS NULL`
 // Một lệnh ghi thay cho SELECT + một INSERT OR IGNORE cho mỗi bài.
 // CTE chỉ chứa bài của đúng em khi có sbd; cron không sbd vẫn quét cả trường.
 // INSERT OR IGNORE giữ read_at và thời điểm của thông báo đã có khi thăm dò lại.
 await env.DB.prepare(`WITH tasks AS (${tasks})
   INSERT OR IGNORE INTO student_notice(id,sbd,title,body,target,created_at)
   SELECT id,sbd,title,body,target,created_at FROM tasks
   UNION ALL
   SELECT 'due:'||id||':'||deadline,sbd,'Bài tập sắp hết hạn',
     'Còn dưới 1 giờ. Em mở bài để kiểm tra hạn nộp.',target,
     strftime('%Y-%m-%dT%H:%M:%fZ','now')
   FROM tasks WHERE julianday(deadline)>julianday('now') AND julianday(deadline)<=julianday('now','+1 hour')`
 ).bind(...(sbd?[sbd,sbd]:[])).run()
}
export async function notifications(env:Env,action:string,b:Record<string,unknown>){
 const sbd=await gameIdentity(env,b)
 if(action==='list'){await syncNotices(env,sbd);const rows=await env.DB.prepare('SELECT id,title,body,target,created_at,read_at FROM student_notice WHERE sbd=? ORDER BY created_at DESC LIMIT 60').bind(sbd).all();return {ok:true,items:rows.results,publicKey:env.PUSH_PUBLIC_KEY||''}}
 if(action==='status'){const row=await env.DB.prepare('SELECT endpoint FROM student_push WHERE endpoint=? AND sbd=?').bind(String(b.endpoint||''),sbd).first();return {ok:true,enabled:!!row}}
 if(action==='read'){await env.DB.prepare('UPDATE student_notice SET read_at=? WHERE sbd=? AND id=?').bind(new Date().toISOString(),sbd,String(b.id||'')).run();return {ok:true}}
 if(action==='unsubscribe'){await env.DB.prepare('DELETE FROM student_push WHERE endpoint=? AND sbd=?').bind(String(b.endpoint||''),sbd).run();return {ok:true}}
 if(action==='subscribe'){
  const sub=b.subscription as {endpoint:string;keys:{p256dh:string;auth:string}}
  if(!sub||!validPushEndpoint(sub.endpoint)||!sub.keys||!/^[\w-]{80,100}$/.test(sub.keys.p256dh)||!/^[\w-]{20,30}$/.test(sub.keys.auth))throw new Error('Đăng ký thông báo không hợp lệ.')
  if(!env.PUSH_PUBLIC_KEY||!env.PUSH_PRIVATE_KEY)throw new Error('Thông báo đẩy chưa sẵn sàng.')
  await env.DB.prepare('INSERT INTO student_push(endpoint,sbd,subscription,created_at) VALUES(?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET sbd=excluded.sbd,subscription=excluded.subscription,created_at=excluded.created_at').bind(sub.endpoint,sbd,JSON.stringify(sub),new Date().toISOString()).run();return {ok:true}
 }
 throw new Error('Thao tác không hợp lệ.')
}
export async function deliverNotices(env:Env){
 await syncNotices(env)
 if(!env.PUSH_PUBLIC_KEY||!env.PUSH_PRIVATE_KEY)return
 const rowsCu=(await env.DB.prepare(`SELECT n.id,p.endpoint,p.subscription FROM student_notice n JOIN student_push p ON p.sbd=n.sbd LEFT JOIN student_push_delivery d ON d.notice_id=n.id AND d.endpoint=p.endpoint WHERE n.created_at>=p.created_at AND n.created_at>strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 day') AND d.sent_at IS NULL AND COALESCE(d.attempts,0)<3 AND COALESCE(d.lease_until,0)<? AND (
 EXISTS(SELECT 1 FROM btvn_em e JOIN btvn b ON b.ma_btvn=e.ma_btvn WHERE e.sbd=n.sbd AND e.thu_hoi=0 AND b.da_xoa=0 AND e.nop_luc IS NULL AND b.han_nop>strftime('%Y-%m-%dT%H:%M:%fZ','now') AND (n.id='btvn:'||e.khoa OR n.id='due:btvn:'||e.khoa||':'||b.han_nop))
 OR EXISTS(SELECT 1 FROM mom_bai m WHERE m.sbd=n.sbd AND m.submitted_at IS NULL AND n.id='mom:'||m.sbd||':'||m.id)) LIMIT 40`).bind(Date.now()).all<{id:string;endpoint:string;subscription:string}>()).results.map(r=>({...r,target:''}))
 // CẢNH BÁO CỦA THẦY / NHẮC TỰ ĐỘNG (target `canh_bao_btvn`): truy vấn RIÊNG bọc try/catch — Worker có thể lên trước migration `canh_bao_thay`; chưa có bảng thì bỏ qua, các thông báo cũ KHÔNG bị ảnh hưởng.
 // Chỉ đẩy khi em chưa mở tin và chưa nộp bài.
 let rowsCb:{id:string;target:string;endpoint:string;subscription:string}[]=[]
 try{rowsCb=(await env.DB.prepare(`SELECT n.id,n.target,p.endpoint,p.subscription FROM student_notice n JOIN student_push p ON p.sbd=n.sbd LEFT JOIN student_push_delivery d ON d.notice_id=n.id AND d.endpoint=p.endpoint WHERE n.target='canh_bao_btvn' AND n.created_at>=p.created_at AND n.created_at>strftime('%Y-%m-%dT%H:%M:%fZ','now','-1 day') AND d.sent_at IS NULL AND COALESCE(d.attempts,0)<3 AND COALESCE(d.lease_until,0)<? AND EXISTS(SELECT 1 FROM canh_bao_thay c JOIN btvn_em e ON e.ma_btvn=c.ma_btvn AND e.sbd=c.sbd WHERE c.id=n.id AND c.em_xem_luc IS NULL AND e.nop_luc IS NULL AND e.thu_hoi=0) LIMIT 40`).bind(Date.now()).all<{id:string;target:string;endpoint:string;subscription:string}>()).results}catch{rowsCb=[]}
 const rows=[...rowsCu,...rowsCb]
 const send=async(r:typeof rows[number])=>{
  if(!validPushEndpoint(r.endpoint))return
  const claim=await env.DB.prepare('INSERT INTO student_push_delivery(notice_id,endpoint,attempts,lease_until) VALUES(?,?,1,?) ON CONFLICT(notice_id,endpoint) DO UPDATE SET attempts=attempts+1,lease_until=excluded.lease_until WHERE sent_at IS NULL AND attempts<3 AND lease_until<?').bind(r.id,r.endpoint,Date.now()+90000,Date.now()).run()
  if(!claim.meta.changes)return
  try{const payload=await buildPushPayload({data:JSON.stringify({title:'Đỗ Đại Học · Bài tập',body:r.target==='canh_bao_btvn'?'Thầy nhắc em về bài tập. Mở app để xem.':'Em có cập nhật bài tập. Mở app để xem.',url:'/hs?thongbao=1'}),options:{ttl:3600}},JSON.parse(r.subscription),{subject:'https://omr-app-b3u.pages.dev',publicKey:env.PUSH_PUBLIC_KEY,privateKey:env.PUSH_PRIVATE_KEY});const res=await fetch(r.endpoint,{...payload,redirect:'error',signal:AbortSignal.timeout(8000)});if(res.ok)await env.DB.prepare('UPDATE student_push_delivery SET sent_at=? WHERE notice_id=? AND endpoint=?').bind(new Date().toISOString(),r.id,r.endpoint).run();else if(res.status===404||res.status===410)await env.DB.prepare('DELETE FROM student_push WHERE endpoint=?').bind(r.endpoint).run()}catch{/* Bounded retries on the next scheduled run. */}
 }
 for(let i=0;i<rows.length;i+=4)await Promise.all(rows.slice(i,i+4).map(send))
}
