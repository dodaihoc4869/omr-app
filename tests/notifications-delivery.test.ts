import {DatabaseSync} from 'node:sqlite'
import {readFileSync} from 'node:fs'
import {describe,it,expect,vi,afterEach} from 'vitest'
vi.mock('../server/src/game-v2-auth',()=>({gameIdentity:async(_env:unknown,b:{token:string})=>{if(!['alice','bob'].includes(b.token))throw Error('Unauthorized');return b.token}}))
vi.mock('@block65/webcrypto-web-push',()=>({buildPushPayload:async()=>({method:'POST',body:'encrypted-test-payload'})}))
afterEach(()=>vi.unstubAllGlobals())
import {syncNotices,notifications,deliverNotices} from '../server/src/notifications'
function fixture(){
 const db=new DatabaseSync(':memory:');db.exec(readFileSync('server/migration-1609-notifications.sql','utf8'))
 db.exec(`CREATE TABLE btvn(ma_btvn TEXT,ma_de TEXT,giao_luc TEXT,han_nop TEXT,da_xoa INTEGER);CREATE TABLE btvn_em(khoa TEXT,sbd TEXT,ma_btvn TEXT,thu_hoi INTEGER,nop_luc TEXT);CREATE TABLE mom_bai(id TEXT,sbd TEXT,title TEXT,created_at TEXT,submitted_at TEXT);`)
 const now=new Date().toISOString(),later=new Date(Date.now()+1800000).toISOString()
 db.prepare('INSERT INTO btvn VALUES(?,?,?,?,0)').run('lesson','Hoá học',now,later)
 db.exec("INSERT INTO btvn_em VALUES('one','alice','lesson',0,NULL),('two','bob','lesson',0,NULL)")
 const wrap=(sql:string,args:unknown[]=[])=>({bind:(...v:unknown[])=>wrap(sql,v),all:async()=>({results:db.prepare(sql).all(...args as never[])}),first:async()=>db.prepare(sql).get(...args as never[])??null,run:async()=>({meta:{changes:Number(db.prepare(sql).run(...args as never[]).changes)}})})
 const env={DB:{prepare:wrap,batch:async(q:{run:()=>unknown}[])=>Promise.all(q.map(x=>x.run()))},PUSH_PUBLIC_KEY:'public',PUSH_PRIVATE_KEY:'private'} as any
 return {db,env}
}
describe('Thông báo bài tập: dữ liệu và người nhận',()=>{
 it('quét lặp không tạo trùng, chỉ quét học sinh đang xem',async()=>{const {db,env}=fixture();await syncNotices(env,'alice');await syncNotices(env,'alice');expect(db.prepare('SELECT COUNT(*) n FROM student_notice').get()?.n).toBe(2);expect(db.prepare("SELECT COUNT(*) n FROM student_notice WHERE sbd='bob'").get()?.n).toBe(0)})
 it('đọc và đánh dấu chỉ trong tài khoản được xác thực',async()=>{const {db,env}=fixture();await syncNotices(env);const r=await notifications(env,'list',{token:'bob'}) as any;expect(r.items).toHaveLength(2);expect(r.items.every((n:any)=>n.id.includes('two'))).toBe(true);await notifications(env,'read',{token:'alice',id:'btvn:two'});expect(db.prepare("SELECT read_at FROM student_notice WHERE id='btvn:two'").get()?.read_at).toBeNull();await expect(notifications(env,'list',{token:'invalid'})).rejects.toThrow()})
 it('bài đã nộp hoặc thu hồi không được đưa vào hàng gửi',async()=>{const {db,env}=fixture();await syncNotices(env);db.exec("UPDATE btvn_em SET thu_hoi=1 WHERE sbd='alice';UPDATE btvn_em SET nop_luc='done' WHERE sbd='bob'");for(const sbd of ['alice','bob'])db.prepare('INSERT INTO student_push VALUES(?,?,?,?)').run('https://fcm.googleapis.com/'+sbd,sbd,'{}','2000-01-01');await deliverNotices(env);expect(db.prepare('SELECT COUNT(*) n FROM student_push_delivery').get()?.n).toBe(0)})
 it('gửi thành công được ghi nhận để không gửi lặp',async()=>{const {db,env}=fixture();db.prepare('INSERT INTO student_push VALUES(?,?,?,?)').run('https://fcm.googleapis.com/id','alice','{}','2000-01-01');const send=vi.fn().mockResolvedValue({ok:true});vi.stubGlobal('fetch',send);await deliverNotices(env);await deliverNotices(env);expect(send).toHaveBeenCalledTimes(2);expect(db.prepare('SELECT COUNT(*) n FROM student_push_delivery WHERE sent_at IS NOT NULL').get()?.n).toBe(2)})
 it('trạng thái thông báo trên máy dùng chung không nhận nhầm chủ tài khoản',async()=>{const {db,env}=fixture();db.prepare('INSERT INTO student_push VALUES(?,?,?,?)').run('https://fcm.googleapis.com/id','alice','{}','2000-01-01');expect(await notifications(env,'status',{token:'bob',endpoint:'https://fcm.googleapis.com/id'})).toEqual({ok:true,enabled:false});expect(await notifications(env,'status',{token:'alice',endpoint:'https://fcm.googleapis.com/id'})).toEqual({ok:true,enabled:true})})
})
