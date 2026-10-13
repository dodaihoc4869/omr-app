// Soát độc lập SQL C3 trên SQLite thật cục bộ; không truy cập D1/R2 hoặc dữ liệu thầy.
// node scripts/kiem-may-chu-c3-doc-lap-1410.mjs --repo=/workspace/c3-final --out=/tmp/c3-sqlite.json
import { DatabaseSync } from 'node:sqlite'
import { createServer } from 'vite'
import { resolve } from 'node:path'
import { writeFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
const args=Object.fromEntries(process.argv.slice(2).filter(x=>x.startsWith('--')).map(x=>{const i=x.indexOf('=');return [x.slice(2,i),x.slice(i+1)]}))
const repo=resolve(args.repo||import.meta.dirname+'/..'),out=resolve(args.out||'/tmp/c3-sqlite-doc-lap.json')
const loader=await createServer({root:repo,configFile:false,logLevel:'error',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,hmr:false}})
const {SQL_GOI7}=await loader.ssrLoadModule('/server/src/goi-bai-7-schema.ts')
const {gvDanhSachEm7}=await loader.ssrLoadModule('/server/src/goi-bai-7-membership.ts')
const {sqlEmDangNhan7,sqlQuyetDinhNhan7}=await loader.ssrLoadModule('/server/src/goi-bai-7-quyen.ts')
const now=Date.parse('2026-10-14T01:00:00Z'),lop='12 - Tinh Hoa',rows=[],dbs=[]
function assert(x,why){if(!x)throw Error(why)}
function fixture(){
 const db=new DatabaseSync(':memory:');dbs.push(db)
 db.exec(`CREATE TABLE hoc_sinh(sbd TEXT PRIMARY KEY,ho_ten TEXT,lop TEXT,ten_lop TEXT,trang_thai TEXT);
 CREATE TABLE bai_da_day(id TEXT PRIMARY KEY,lop TEXT,bo_tick_luc TEXT);
 CREATE TABLE cau_hinh(khoa TEXT PRIMARY KEY,gia_tri TEXT);
 CREATE TABLE ca(id TEXT PRIMARY KEY,trang_thai TEXT);
 CREATE TABLE lich_su(id TEXT PRIMARY KEY,json TEXT);
 CREATE TABLE game_v2_session(id TEXT PRIMARY KEY,sbd TEXT,json TEXT);
 CREATE TABLE game_v2_attempt(id TEXT PRIMARY KEY,sbd TEXT,qid TEXT,session TEXT);
 CREATE TABLE kiem_tra_ca_nhan(id TEXT PRIMARY KEY,sbd TEXT,json TEXT);`)
 for(const sql of SQL_GOI7)db.exec(sql)
 const insert=(sql,...v)=>db.prepare(sql).run(...v)
 for(const [sbd,name,status]of [['A','Em A',''],['B','Em B',''],['C','Em C',''],['D','Em D','khoa']])insert('INSERT INTO hoc_sinh VALUES(?,?,?,?,?)',sbd,name,'12',lop,status)
 insert('INSERT INTO hoc_sinh VALUES(?,?,?,?,?)','X','Em lớp khác','11','11A1','')
 insert('INSERT INTO bai_da_day VALUES(?,?,NULL)','T',lop);insert('INSERT INTO cau_hinh VALUES(?,?)','goi_bai_7_v1',JSON.stringify({bat:true}))
 insert('INSERT INTO goi_bai_7 VALUES(?,?,?,?,?,?,?,?)','G','T',lop,'12/C3/B8','Bài 8. Amine','2026-10-13','2026-10-19','2026-10-13T01:00:00Z')
 for(const sbd of ['A','B'])insert('INSERT INTO goi_bai_7_em VALUES(?,?,?,?)','G',sbd,'2026-10-13','2026-10-19')
 for(const sbd of ['A','B','C']){
  insert('INSERT INTO goi_bai_7_ngay VALUES(?,?,?,?)','G',sbd,'2026-10-14',24)
  insert('INSERT INTO goi_bai_7_muc_ngay VALUES(?,?,?,?,?,?,?)',sbd,'2026-10-14',1,24,24,24,'2026-10-14T01:00:00Z')
 }
 insert('INSERT INTO goi_bai_7_gap VALUES(?,?,?,?,?,?,?)','SESS|Q|G','G','B','Q','V','co_ho_tro','2026-10-13T01:00:00Z')
 insert('INSERT INTO goi_bai_7_cau VALUES(?,?,?,?,?)','G','Q','V','DE',JSON.stringify({qid:'Q',version:'V',maDe:'DE'}))
 insert('INSERT INTO goi_bai_7_chua VALUES(?,?,?,?,?)','G','Q','V','Lời giải được giữ','2026-10-13T01:00:00Z')
 insert('INSERT INTO goi_bai_7_kiem VALUES(?,?,?,?,?,?,?,?)','K','G','B','DE','{"cau":["Q"],"tra":{"Q":"A"}}','2026-10-13T01:00:00Z','2026-10-13T02:00:00Z',7.5)
 insert('INSERT INTO lich_su VALUES(?,?)','L','{"answers":{"Q":"B"},"score":7.5}')
 insert('INSERT INTO game_v2_session VALUES(?,?,?)','S','B','{"hocTap":1,"goi7":1,"questions":["Q"]}');insert('INSERT INTO game_v2_attempt VALUES(?,?,?,?)','ATT','B','Q','S')
 insert('INSERT INTO kiem_tra_ca_nhan VALUES(?,?,?)','KT','B','{"published":true,"questions":["Q"],"answers":{"Q":"A"}}')
 const control={queries:0,batches:0,beforeWrite:null,failAt:0}
 function execute(sql,values=[]){control.queries++;const stmt=db.prepare(sql)
  if(stmt.columns().length)return {results:stmt.all(...values),meta:{changes:0},success:true}
  const r=stmt.run(...values);return {results:[],meta:{changes:Number(r.changes)},success:true}
 }
 const DB={prepare(sql){let values=[];return {sql,bind(...v){values=v;return this},async first(){return execute(sql,values).results[0]??null},async all(){return execute(sql,values)},async run(){return execute(sql,values)},_run(){return execute(sql,values)}}},async batch(stmts){
  control.batches++
  const write=stmts[0]?.sql?.includes('INSERT OR IGNORE INTO goi_bai_7_sua_em')
  if(write&&control.beforeWrite){const f=control.beforeWrite;control.beforeWrite=null;f()}
  db.exec('BEGIN');try{const result=stmts.map((s,i)=>{if(write&&control.failAt===i+1)throw Error('Fixture lỗi giữa batch');return s._run()});db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}
 }}
 return {db,env:{DB},control,insert}
}
const stableTables=['goi_bai_7','goi_bai_7_cau','goi_bai_7_gap','goi_bai_7_chua','goi_bai_7_kiem','lich_su','game_v2_session','game_v2_attempt','kiem_tra_ca_nhan']
const snapshot=f=>Object.fromEntries(stableTables.map(t=>[t,JSON.stringify(f.db.prepare(`SELECT * FROM ${t} ORDER BY rowid`).all())]))
const changed=f=>Object.fromEntries(['goi_bai_7_chon_em','goi_bai_7_revision','goi_bai_7_sua_em'].map(t=>[t,f.db.prepare(`SELECT COUNT(*) n FROM ${t}`).get().n]))
const doc=f=>gvDanhSachEm7(f.env,{action:'doc_em',goiId:'G'},now)
const save=(f,r,id='REQ',them=['C'],bot=['B'])=>gvDanhSachEm7(f.env,{action:'sua_em',goiId:'G',revision:r.revision,requestId:id,them,bot},now)
async function test(name,fn){try{rows.push({name,ok:true,...await fn()});console.log(JSON.stringify({name,ok:true}))}catch(e){rows.push({name,ok:false,error:e.message});console.log(JSON.stringify({name,ok:false,error:e.message}))}}
try{
 await test('read-minimal-and-no-answer-data',async()=>{const f=fixture(),r=await doc(f);assert(r.ok&&r.em.length===4&&r.nhan.join(',')==='A,B','Đọc sai tập lớp/membership');assert(!JSON.stringify(r).match(/answers|questions|score|solution|dapAn|correct|loiGo/),'Đọc danh sách trả nội dung học/đáp án');const start=f.control.queries;await doc(f);assert(f.control.queries-start===1,'Đọc tấm thêm đợt query sau DDL');return {queries:f.control.queries-start}})
 await test('add-remove-only-changed-plans-and-keep-history',async()=>{const f=fixture(),before=snapshot(f),aPlan=JSON.stringify(f.db.prepare("SELECT * FROM goi_bai_7_ngay WHERE sbd='A'").all()),r=await doc(f),ack=await save(f,r);assert(ack.ok&&ack.nhan.join(',')==='A,C'&&ack.revision!==r.revision,'ACK sai');assert(JSON.stringify(snapshot(f))===JSON.stringify(before),'Sửa membership làm đổi gói/câu/lịch sử/phiên/điểm/đề công bố');assert(JSON.stringify(f.db.prepare("SELECT * FROM goi_bai_7_ngay WHERE sbd='A'").all())===aPlan,'Quota em A còn lại bị đổi');assert(f.db.prepare("SELECT COUNT(*) n FROM goi_bai_7_ngay WHERE sbd IN('B','C')").get().n===0,'Chỉ số kế hoạch em đổi chưa vô hiệu');assert(f.db.prepare("SELECT * FROM goi_bai_7_em WHERE sbd='C'").get().han==='2026-10-19','Em thêm khác hạn hiện tại');return {ackMembers:ack.nhan,unchangedTables:stableTables}})
 await test('durable-remove-auto-enroll-then-intentional-readd',async()=>{const f=fixture(),r=await doc(f);await save(f,r);for(let i=0;i<5;i++)f.db.exec(`INSERT OR IGNORE INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) SELECT g.id,h.sbd,g.bat_dau,g.han FROM goi_bai_7 g JOIN hoc_sinh h ON h.ten_lop=g.lop AND COALESCE(h.trang_thai,'')<>'khoa' WHERE ${sqlQuyetDinhNhan7('g','h.sbd')}`);const read=await doc(f);assert(read.nhan.join(',')==='A,C','Đồng bộ thêm lại em đã bớt');const add=await save(f,read,'REQ2',['B'],[]);assert(add.ok&&add.nhan.join(',')==='A,B,C','Không thêm lại có chủ đích');return {syncRounds:5}})
 await test('idempotency-exact-ack-and-payload-tamper',async()=>{const f=fixture(),r=await doc(f),ack=await save(f,r),again=await save(f,r),tamper=await save(f,r,'REQ',['A'],['C']);assert(JSON.stringify(ack)===JSON.stringify(again),'Retry đổi ACK');assert(!tamper.ok&&tamper.code==='khong_hop_le','Mã request cũ với payload khác được chấp nhận');assert(f.db.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_em').get().n===1,'Retry nhân biên nhận');return {receipts:1}})
 await test('parallel-cas-only-one-winner',async()=>{const f=fixture(),r=await doc(f),acks=await Promise.all([save(f,r,'REQ1'),save(f,r,'REQ2',['C'],['A'])]);assert(acks.filter(a=>a.ok).length===1,'CAS hai lượt cùng revision không có đúng một thắng');assert(f.db.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_em').get().n===1,'CAS tạo hai biên nhận');return {winner:acks.find(a=>a.ok).requestId}})
 for(const [name,mutate]of [
  ['exam-opens-after-read',f=>f.insert('INSERT INTO ca VALUES(?,?)','CA','mo')],
  ['flag-disabled-after-read',f=>f.db.exec("UPDATE cau_hinh SET gia_tri='{\"bat\":false}'")],
  ['tick-removed-after-read',f=>f.db.exec("UPDATE bai_da_day SET bo_tick_luc='2026-10-14'")],
  ['student-moves-after-read',f=>f.db.exec("UPDATE hoc_sinh SET ten_lop='12A2' WHERE sbd='C'")],
  ['student-locked-after-read',f=>f.db.exec("UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='C'")],
 ])await test(name+'-atomic-cas',async()=>{const f=fixture(),r=await doc(f),before=snapshot(f);f.control.beforeWrite=()=>mutate(f);const ack=await save(f,r);assert(!ack.ok,'CAS vẫn ghi khi quyền thay đổi');assert(Object.values(changed(f)).every(n=>n===0),'CAS từ chối vẫn ghi một phần');if(name!=='tick-removed-after-read')assert(JSON.stringify(snapshot(f))===JSON.stringify(before),'CAS từ chối sửa dữ liệu học');return {code:ack.code}})
 for(const [name,them,bot]of [['wrong-class',['X'],[]],['locked',['D'],[]],['duplicate',['C','C'],[]],['add-remove-overlap',['C'],['C']],['mixed-valid-invalid',['C','X'],['B']]])await test('reject-'+name+'-all-or-none',async()=>{const f=fixture(),r=await doc(f),ack=await save(f,r,'REQ',them,bot);assert(!ack.ok&&Object.values(changed(f)).every(n=>n===0),'Đầu vào sai vẫn ghi membership/receipt');return {code:ack.code}})
 await test('batch-error-rolls-back-receipt-and-members',async()=>{const f=fixture(),r=await doc(f),before=snapshot(f);f.control.failAt=4;const ack=await save(f,r);assert(!ack.ok&&Object.values(changed(f)).every(n=>n===0),'Lỗi giữa batch không rollback');assert(JSON.stringify(snapshot(f))===JSON.stringify(before),'Lỗi batch đổi dữ liệu học');return {failureStatement:4}})
 await test('remove-all-keeps-tick-and-history',async()=>{const f=fixture(),r=await doc(f),before=snapshot(f),ack=await save(f,r,'REQ',[],['A','B']);assert(ack.ok&&ack.nhan.length===0,'Không bớt hết được');assert(JSON.stringify(snapshot(f))===JSON.stringify(before),'Bớt hết xóa tick/lịch sử');return {members:0}})
 await test('new-tick-explicit-selection-and-old-default',async()=>{const f=fixture();f.insert('INSERT INTO goi_bai_7_tick_em VALUES(?,?,?)','T','["A"]','2026-10-14');const selected=await doc(f);assert(selected.nhan.join(',')==='A','Nguồn tick explicit không áp vào quyền hiện tại');f.db.exec('DELETE FROM goi_bai_7_tick_em');const defaults=await doc(f);assert(defaults.nhan.join(',')==='A,B','Tick cũ không giữ mặc định');return {selected:['A'],legacyDefault:['A','B']}})
}finally{await loader.close();for(const db of dbs)db.close()}
const hash=execFileSync('git',['rev-parse','HEAD'],{cwd:repo}).toString().trim()
writeFileSync(out,JSON.stringify({duLieu:'SQLite :memory: thật, SQL source được load bằng Vite; không D1/Worker runtime/production',repo,hash,rows},null,2)+'\n')
if(rows.some(r=>!r.ok))process.exitCode=1
