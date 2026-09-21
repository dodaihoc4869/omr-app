// @vitest-environment node
import {describe,it,expect} from 'vitest'
import {DatabaseSync} from 'node:sqlite'
import {readFileSync} from 'node:fs'
import {allowed,advance,THUONG_NAC,chooseSession,grade,newArena,arenaAction,PETS,DAY,targetLevel,publicQuestion} from '../src/game/than-thu-v2/core'
import type {PrivateQuestion,Attempt,Evidence} from '../src/game/than-thu-v2/core'
import type {Env,D1PreparedStatement} from '../server/src/kieu'
import {gameV2,loadProfile} from '../server/src/game-v2'
import {gameToken,gameIdentity,parentPass,parentIdentity} from '../server/src/game-v2-auth'
import {normalizeBank,readScope,syncIndex,protectedQuestions} from '../server/src/game-v2-bank'
import {roomAction} from '../server/src/game-v2-room'
import {thanhExp} from '../src/game/than-thu-hoa-hoc/kinh-nghiem'
import {adminGame,parentGame} from '../server/src/game-v2-reports'
const question=(i=0):PrivateQuestion=>({qid:`D-I-${i}`,maDe:'D',version:'v1',group:`g${i}`,phan:'I',text:`Đề ${i}`,choices:['A','B','C','D'],ideas:[],hinhAnh:[],dang:'AA.BB.CC',tenDang:'Dạng đã học',mucDo:'biet',sao:1,kienThuc:['K1'],correct:'B',solution:{chot:'Giải từ kho'},reviewed:true})
const evidence=(q=question()):Evidence=>({qid:q.qid,group:q.group,dang:q.dang,mucDo:q.mucDo,kienThuc:q.kienThuc,wrong:true,date:'2026-09-01',ca:'CA'})
const attempt=(at=1,group='g0'):Attempt=>({id:group,session:group,qid:group,group,dang:'AA.BB.CC',mucDo:'biet',correct:true,assisted:false,at,novel:true})
function fixture(){
 const sql=new DatabaseSync(':memory:');sql.exec("CREATE TABLE game_v2_settings (key TEXT PRIMARY KEY,json TEXT NOT NULL)");sql.exec(`CREATE TABLE hoc_sinh(sbd TEXT PRIMARY KEY,mat_khau TEXT);INSERT INTO hoc_sinh VALUES('1','password'),('2','password'),('3','password'),('4','password'),('5','password'),('6','password'),('7','password');CREATE TABLE than_thu(sbd TEXT PRIMARY KEY,du_lieu_json TEXT);CREATE TABLE ca(ma_ca TEXT PRIMARY KEY,trang_thai TEXT,cong_bo TEXT,bank_r2 TEXT,cap_nhat_luc TEXT,bo_theo_em_json TEXT,het_han_vao TEXT,thoi_gian_phut INTEGER,loai TEXT,han_nop TEXT,bat_dau TEXT);CREATE TABLE luot(ma_ca TEXT,sbd TEXT,lan_thu INTEGER,nop_luc TEXT,trang_thai TEXT,dap_an_json TEXT,het_gio_luc TEXT);CREATE TABLE chi_tiet_cau(ma_ca TEXT,sbd TEXT,lan_thu INTEGER,qid TEXT,dung_sai INTEGER);CREATE TABLE de_kho(ma_de TEXT PRIMARY KEY,r2_khoa TEXT,cap_nhat_luc TEXT,da_xoa INTEGER);`)
 sql.exec(readFileSync('server/migration-1609-than-thu-v2.sql','utf8'))
 const objects=new Map<string,unknown>()
 function prepare(query:string):D1PreparedStatement{let values:unknown[]=[];const statement={bind(...args:unknown[]){values=args;return statement},async first<T>(){return (sql.prepare(query).get(...values as never[])??null) as T|null},async all<T>(){return {results:sql.prepare(query).all(...values as never[]) as T[],success:true,meta:{changes:0,last_row_id:0,rows_read:0,rows_written:0}}},async run<T>(){const r=sql.prepare(query).run(...values as never[]);return {results:[] as T[],success:true,meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid),rows_read:0,rows_written:Number(r.changes)}}}};return statement}
 const env:Env={MA_BI_MAT:'test-secret-never-live',DB:{prepare,async batch(statements){sql.exec('BEGIN');try{const r=[];for(const s of statements)r.push(await s.run());sql.exec('COMMIT');return r}catch(e){sql.exec('ROLLBACK');throw e}}},DE:{async get(key){const v=objects.get(key);return v?{body:new Response(JSON.stringify(v)).body!,httpEtag:'x'}:null},async put(key,value){objects.set(key,value);return {}},async delete(key){for(const k of Array.isArray(key)?key:[key])objects.delete(k)}}}
 const bank=(id:string)=>({phanI:[{id:`${id}-I-0`,text:`Đề ${id}`,choices:['A','B','C','D'],correct:'B',dang:{ma:'AA.BB.CC',ten:'Dạng'},mucDo:'biet',kienThuc:['K1'],loiGiai:{chot:'Giải'}}],phanII:[],phanIII:[]})
 function seed(){sql.exec(`INSERT INTO ca(ma_ca,trang_thai,cong_bo,bank_r2,cap_nhat_luc,bo_theo_em_json) VALUES('CA','dong','ngay',NULL,'1',NULL);INSERT INTO luot(ma_ca,sbd,lan_thu,nop_luc,trang_thai,dap_an_json) VALUES('CA','1',1,'2026-09-01','da_nop','{}');INSERT INTO chi_tiet_cau VALUES('CA','1',1,'D-I-0',0);INSERT INTO de_kho VALUES('D','kho/D.json','1',0);`);objects.set('kho/D.json',bank('D'))}
 return {sql,env,objects,seed,bank}
}
describe('Phạm vi và tiến bộ thật',()=>{
 it('đúng tám loài, không trùng hình',()=>{expect(PETS).toHaveLength(8);expect(new Set(PETS.map(p=>p.shape)).size).toBe(8)})
 it('câu chưa học/chưa biết điều kiện không được mở theo tên chương',()=>{const q=question(1);expect(allowed(q,[],new Set())).toBe(false);expect(allowed({...q,kienThuc:[]},[evidence()],new Set())).toBe(false);expect(allowed({...q,kienThuc:['K2']},[evidence()],new Set())).toBe(false);expect(allowed(q,[evidence()],new Set())).toBe(true)})
 it('bảo vệ qid và bản sao có ưu tiên cao nhất',()=>{expect(allowed(question(),[evidence()],new Set(['g0']))).toBe(false);expect(allowed(question(),[evidence()],new Set(['D-I-0']))).toBe(false)})
 it('thiếu nhãn chỉ ôn câu đã làm',()=>{expect(allowed({...question(),dang:null,mucDo:null},[evidence()],new Set())).toBe(true);expect(allowed({...question(1),dang:null,mucDo:null},[evidence()],new Set())).toBe(false)})
 it('không trả đáp án/lời giải/hình lời giải trước khi nộp',()=>{const q={...question(),hinhAnh:[{src:'secret',viTri:'sau_loi_giai'},{src:'image',viTri:'sau_de'}]};const pub=publicQuestion(q);expect(pub).not.toHaveProperty('correct');expect(pub).not.toHaveProperty('solution');expect(pub.hinhAnh).toEqual([{src:'image',viTri:'sau_de'}])})
 it('chấm đủ I II III bằng luật số của app',()=>{expect(grade(question(),'B')).toBe(true);expect(grade({...question(),phan:'II',correct:'DSDS'},'DSD-')).toBe(false);expect(grade({...question(),phan:'II',correct:'DSDS'},'DSDS')).toBe(true);expect(grade({...question(),phan:'III',correct:'-0.80'},'− 0,80')).toBe(true);expect(grade({...question(),phan:'III',correct:'0.80'},'0,8')).toBe(false)})
 it('10/20/30 (sửa có chủ ý 21/09: cũ 20/40/40) chỉ qua câu khác nhau và thời gian, không farm',()=>{const first=advance(undefined,attempt());expect(first.reward).toBe(10);expect(THUONG_NAC).toEqual([10,20,30]);expect(advance(first.mastery,attempt(DAY+1)).reward).toBe(0);expect(advance(first.mastery,attempt(2,'g1')).reward).toBe(0);const second=advance(first.mastery,attempt(DAY+1,'g1'));expect(second.reward).toBe(20);expect(advance(second.mastery,attempt(6*DAY,'g2')).reward).toBe(0);const third=advance(second.mastery,attempt(7*DAY+1,'g2'));expect(third.reward).toBe(30);expect(third.mastery.repaired).toBe(true);expect(advance(third.mastery,attempt(14*DAY,'g3')).reward).toBe(0)})
 it('trợ giúp không tạo bằng chứng tự làm',()=>{expect(advance(undefined,{...attempt(),assisted:true}).reward).toBe(0)})
 it('4/5 câu khác nhau qua hai lượt mới nâng mức',()=>{const ds=Array.from({length:5},(_,i)=>({...attempt(i,`g${i}`),session:i<3?'a':'b',correct:i!==4}));expect(targetLevel('AA.BB.CC',[evidence()],ds)).toBe(1);expect(targetLevel('AA.BB.CC',[evidence()],ds.map(a=>({...a,session:'one'})))).toBe(0)})
 it('không thay kho thiếu bằng câu chung; loại bản sao và câu cần duyệt',()=>{expect(chooseSession([],[],[],[],'adventure',1)).toEqual([]);const q=question();const ds=chooseSession([q,{...q,qid:'copy'},{...question(2),reviewed:false}],[evidence()],[],[],'repair',1);expect(ds).toHaveLength(1)})
})
describe('Võ đài máy chủ',()=>{
 it('không thể tiêu âm vàng và ô không hợp lệ',()=>{const a=newArena(1);a.gold=0;expect(()=>arenaAction(a,{type:'buy',slot:0})).toThrow();a.units=[{id:'x',pet:0,star:1,pos:null}];expect(()=>arenaAction(a,{type:'place',id:'x',pos:9})).toThrow()})
 it('ba quân ghép lên sao, giữ vị trí và giới hạn đội',()=>{const a=newArena(1);a.units=[{id:'a',pet:0,star:1,pos:0},{id:'b',pet:0,star:1,pos:null}];a.shop[0]=0;const b=arenaAction(a,{type:'buy',slot:0});expect(b.units).toHaveLength(1);expect(b.units[0]).toMatchObject({star:2,pos:0});expect(a.units).toHaveLength(2)})
 it('trận tất định, không vượt vòng 10',()=>{let a=newArena(1);a.units=[{id:'x',pet:0,star:3,pos:0}];expect(arenaAction(a,{type:'fight'})).toEqual(arenaAction(a,{type:'fight'}));for(let i=0;i<10;i++){a.studied=1;a=arenaAction(a,{type:'fight'})}expect(a.finished).toBe(true);expect(()=>arenaAction(a,{type:'fight'})).toThrow()})
})
describe('D1 thực: tách dữ liệu, phân quyền, giao dịch',()=>{
 it('token giả / đổi SBD / đổi mật khẩu không được truy cập',async()=>{const {env,sql}=fixture();const token=await gameToken(env,'1');expect(await gameIdentity(env,{token,sbd:'2'})).toBe('1');await expect(gameIdentity(env,{sbd:'1'})).rejects.toThrow();await expect(gameIdentity(env,{token:token+'a'})).rejects.toThrow();sql.exec("UPDATE hoc_sinh SET mat_khau='changed' WHERE sbd='1'");await expect(gameIdentity(env,{token})).rejects.toThrow()})
 it('mã phụ huynh không có quyền chấm bài',async()=>{const {env}=fixture();const pass=await parentPass(env,'1');expect(await parentIdentity(env,pass)).toBe('1');await expect(gameIdentity(env,{token:pass})).rejects.toThrow();const token=await gameToken(env,'1');await expect(parentIdentity(env,token)).rejects.toThrow()})
 it('chuyển hồ sơ bảo toàn dữ liệu cũ và chỉ chọn lại một lần',async()=>{const {env,sql}=fixture();const old={idThanhThuChon:'loi_dieu',capDo:51,exp:88,khoExp:50000,tangThapCaoNhat:999,unknownAsset:'keep'};sql.prepare('INSERT INTO than_thu VALUES(?,?)').run('1',JSON.stringify(old));const token=await gameToken(env,'1');const r=await loadProfile(env,'1');expect(r.profile).toMatchObject({pet:'khi_lang',cap:51,exp:88,wallet:50000,tower:999,choice:true});expect(JSON.parse(String(r.profile.legacy))).toEqual(old);await gameV2(env,'choose',{token,pet:'sangy_cu'});await expect(gameV2(env,'choose',{token,pet:'dat_quy'})).rejects.toThrow();expect(sql.prepare('SELECT du_lieu_json AS json FROM than_thu').get()?.json).toBe(JSON.stringify(old))})
 it('chấm lặp cùng lượt chỉ thưởng một lần, không chạm bảng học tập',async()=>{const f=fixture();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');const tables=['ca','luot','chi_tiet_cau','de_kho'];const before=tables.map(t=>JSON.stringify(f.sql.prepare(`SELECT * FROM ${t}`).all()));const start=await gameV2(f.env,'start',{token,mode:'repair'});expect(JSON.stringify(start)).not.toContain('correct');const id=start.id;const a=await gameV2(f.env,'answer',{token,session:id,qid:'D-I-0',answer:'B'});expect(a.reward).toBe(10);const b=await gameV2(f.env,'answer',{token,session:id,qid:'D-I-0',answer:'A'});expect(b.replayed).toBe(true);expect((await loadProfile(f.env,'1')).profile.wallet).toBe(10);expect(f.sql.prepare('SELECT COUNT(*) n FROM game_v2_reward').get()?.n).toBe(1);expect(tables.map(t=>JSON.stringify(f.sql.prepare(`SELECT * FROM ${t}`).all()))).toEqual(before)})
 it('câu rút khỏi kho trong lúc chơi không tính sai và không lộ lời giải',async()=>{const f=fixture();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');const start=await gameV2(f.env,'start',{token});f.sql.exec("UPDATE de_kho SET da_xoa=1");await expect(gameV2(f.env,'answer',{token,session:start.id,qid:'D-I-0',answer:'A'})).rejects.toThrow('rút');expect(f.sql.prepare('SELECT COUNT(*) n FROM game_v2_attempt').get()?.n).toBe(0)})
 it('trả lời ca khác / học sinh khác bị từ chối',async()=>{const f=fixture();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');const start=await gameV2(f.env,'start',{token});await expect(gameV2(f.env,'answer',{token:await gameToken(f.env,'2'),session:start.id,qid:'D-I-0',answer:'B'})).rejects.toThrow();await expect(gameV2(f.env,'answer',{token,session:start.id,qid:'unknown',answer:'B'})).rejects.toThrow()})
 it('chỉ mục đi hết hơn 8 tờ, không bỏ dòng thứ 501',async()=>{const f=fixture();for(let i=0;i<12;i++){const id=`BANK${i}`;f.sql.prepare('INSERT INTO de_kho VALUES(?,?,?,0)').run(id,`kho/${id}.json`,'1');const bank=f.bank(id);bank.phanI=Array.from({length:51},(_,j)=>({...bank.phanI[0]!,id:`${id}-I-${j}`,text:`${id} câu ${j}`}));f.objects.set(`kho/${id}.json`,bank)}let r;do{r=await syncIndex(f.env)}while(r.remaining);expect(f.sql.prepare('SELECT COUNT(*) n FROM game_v2_question').get()?.n).toBe(612)})
 it('khôi phục dòng thiếu từ đúng qid đã nộp, không tự thêm phần của lớp',async()=>{const f=fixture();f.seed();f.objects.set('key/CA.json',f.bank('D'));f.sql.exec(`DELETE FROM chi_tiet_cau;UPDATE luot SET dap_an_json='{"phanI":{"D-I-0":"B"}}'`);await syncIndex(f.env);const s=await readScope(f.env,'1');expect(s.evidence).toHaveLength(1);expect(s.evidence[0]?.wrong).toBe(false);expect(f.sql.prepare('SELECT COUNT(*) n FROM chi_tiet_cau').get()?.n).toBe(0)})
 it('đề chưa công bố và bản sao đang thi bị bảo vệ',async()=>{const f=fixture();f.seed();f.sql.exec("INSERT INTO ca(ma_ca,trang_thai,cong_bo,bank_r2,cap_nhat_luc,bo_theo_em_json) VALUES('LIVE','mo','ngay','de/LIVE','v1',NULL)");f.objects.set('de/LIVE',f.bank('D'));const blocked=await protectedQuestions(f.env);expect(blocked.has('D-I-0')).toBe(true);await syncIndex(f.env);const start=await gameV2(f.env,'start',{token:await gameToken(f.env,'1')});expect(start.questions).toEqual([])})
 it('ca vẫn mang cờ mở nhưng đã hết hạn và công bố được phép ôn',async()=>{const f=fixture();f.seed();f.sql.exec("UPDATE ca SET trang_thai='mo',het_han_vao='2026-01-01T00:00:00Z',thoi_gian_phut=30,loai='thi',bank_r2='de/CA'");f.objects.set('de/CA',f.bank('D'));expect((await protectedQuestions(f.env)).has('D-I-0')).toBe(false);f.sql.exec("UPDATE ca SET cong_bo='khong'");expect((await protectedQuestions(f.env)).has('D-I-0')).toBe(true)})
 it('phụ huynh chỉ nhắc dạng có bằng chứng, giáo viên khoá game riêng em',async()=>{const f=fixture();const pass=await parentPass(f.env,'1');await expect(parentGame(f.env,{pass,action:'task',dang:'AA.BB.CC'})).rejects.toThrow();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');await adminGame(f.env,{action:'scope',sbd:'1',enabled:false});await expect(gameV2(f.env,'start',{token})).rejects.toThrow('tạm dừng')})
 it('phòng tối đa sáu người, không lộ SBD; người ngoài không sửa được',async()=>{const f=fixture();const create=await roomAction(f.env,'1','dat_quy','room-create',{});const room=create.room as {id:string};for(let i=2;i<=6;i++)await roomAction(f.env,String(i),'khi_lang','room-join',{room:room.id});await expect(roomAction(f.env,'7','khi_lang','room-join',{room:room.id})).rejects.toThrow();await expect(roomAction(f.env,'7','khi_lang','room-action',{room:room.id})).rejects.toThrow();const view=await roomAction(f.env,'1','dat_quy','room-view',{room:room.id});expect(JSON.stringify(view)).not.toContain('sbd')})
 it('ống đầy và cấp 120 giữ phần EXP còn dư',async()=>{const f=fixture();/* Đợt 1 thần thú (21/09): hồ sơ ĐÃ ở luật cấp mới (luatCap 2), hôm nay em đạt nhiệm vụ ngày ⇒ trần 200; nạp qua cổng hấp thụ. Sửa CÓ CHỦ Ý. */const homNay=new Date(Date.now()+7*3600000).toISOString().slice(0,10);f.sql.prepare('INSERT INTO game_v2_profile(sbd,revision,json,created_at) VALUES(?,0,?,?)').run('1',JSON.stringify({pet:'dat_quy',choice:false,legacy:null,cap:119,exp:thanhExp(119)-5,wallet:50000,earned:0,tower:1,mastery:[],arena:null,cutover:'2026-09-21T00:00:00Z',luatCap:2}),'x');f.sql.exec('CREATE TABLE IF NOT EXISTS exp_so(khoa TEXT PRIMARY KEY,sbd TEXT,ngay_vn TEXT,loai TEXT,qid TEXT,ma_nguon TEXT,exp INTEGER,luc TEXT,ghi_chu TEXT)');f.sql.prepare("INSERT INTO exp_so(khoa,sbd,ngay_vn,loai,qid,ma_nguon,exp,luc,ghi_chu) VALUES(?,?,?,'dat_ngay',NULL,NULL,80,?,'x')").run(`1|dat|${homNay}`,'1',homNay,new Date().toISOString());const token=await gameToken(f.env,'1');const r=await gameV2(f.env,'invest',{token});const p=(await loadProfile(f.env,'1')).profile;expect(p.cap).toBe(120);expect(p.wallet).toBe(49995);expect(r.daNap).toBe(5)})
 it('hoàn thành tầng gọi lại không nhảy thêm tầng',async()=>{const f=fixture();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');const r=await gameV2(f.env,'start',{token,mode:'tower'});await gameV2(f.env,'answer',{token,session:r.id,qid:'D-I-0',answer:'B'});await gameV2(f.env,'complete',{token,session:r.id});await gameV2(f.env,'complete',{token,session:r.id});expect((await loadProfile(f.env,'1')).profile.tower).toBe(2)})
 it('bỏ trống và nộp thiếu ý không được dùng để lấy lượt học',async()=>{const f=fixture();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');const r=await gameV2(f.env,'start',{token});await expect(gameV2(f.env,'answer',{token,session:r.id,qid:'D-I-0',answer:''})).rejects.toThrow('điền đủ');expect(f.sql.prepare('SELECT COUNT(*) n FROM game_v2_attempt').get()?.n).toBe(0)})
 it('hai người chốt thì xử đúng một vòng, không nhận trạng thái vàng tự khai',async()=>{const f=fixture();const created=await roomAction(f.env,'1','dat_quy','room-create',{});const id=(created.room as {id:string}).id;await roomAction(f.env,'2','khi_lang','room-join',{room:id});let rev=1;const act=async(sbd:string,action:string,extra:Record<string,unknown>={})=>{const r=await roomAction(f.env,sbd,'dat_quy',action,{room:id,revision:rev,...extra});rev=(r.room as {revision:number}).revision;return r.room as {round:number;board:{units:{id:string}[];gold:number}}};await act('1','room-start');const one=await act('1','room-action',{action:{type:'buy',slot:0},gold:999});expect(one.board.gold).toBe(6);await act('1','room-action',{action:{type:'place',id:one.board.units[0]!.id,pos:0}});const two=await act('2','room-action',{action:{type:'buy',slot:0}});await act('2','room-action',{action:{type:'place',id:two.board.units[0]!.id,pos:0}});expect((await act('1','room-action',{action:{type:'fight'}})).round).toBe(1);expect((await act('2','room-action',{action:{type:'fight'}})).round).toBe(2);await expect(act('1','room-action',{action:{type:'fight'}})).rejects.toThrow('câu Hoá')})
 it('giữ nguyên ảnh đúng vị trí trong nguồn thô',async()=>{const raw={ma_de:'D',cau:[{phan:'I',so:1,de:'Câu có ảnh',pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A',hinh:[{tep:'i.png',vi_tri:'sau_pa_B',du_lieu:'data:image/png;base64,YQ=='}]}]};const qs=await normalizeBank(raw,'D');expect(qs[0]?.hinhAnh[0]?.viTri).toBe('sau_pa_B')})
})

describe('teacher-authorized new game season',()=>{
 it('resets existing and not-yet-migrated accounts while preserving academic evidence and passwords',async()=>{
  const {env,sql,seed}=fixture();seed();const before=sql.prepare('SELECT * FROM hoc_sinh').all();const scores=sql.prepare('SELECT * FROM chi_tiet_cau').all()
  const old={idThanhThuChon:'loi_dieu',capDo:80,exp:120,khoExp:90000,tangThapCaoNhat:50}
  sql.prepare('INSERT INTO than_thu VALUES(?,?)').run('1',JSON.stringify(old));sql.prepare('INSERT INTO than_thu VALUES(?,?)').run('2',JSON.stringify(old))
  const original=await loadProfile(env,'1');expect(original.profile.cap).toBe(80)
  sql.prepare('INSERT INTO game_v2_settings VALUES(?,?)').run('season',JSON.stringify({id:'new-season'}))
  for(const id of ['1','2']){const p=await loadProfile(env,id);expect(p.profile).toMatchObject({cap:1,exp:0,wallet:0,earned:0,tower:1,choice:true,mastery:[],arena:null,season:'new-season'});expect(JSON.parse(String(p.profile.legacy))).toEqual(old)}
  const p=await loadProfile(env,'1');expect((await loadProfile(env,'1')).revision).toBe(p.revision)
  expect(sql.prepare('SELECT * FROM hoc_sinh').all()).toEqual(before);expect(sql.prepare('SELECT * FROM chi_tiet_cau').all()).toEqual(scores)
 })
})

it('classroom reads only chosen current-season V2 spirit without importing legacy or mutating progress',async()=>{
 const {env,sql}=fixture()
 sql.prepare('INSERT INTO than_thu VALUES(?,?)').run('1',JSON.stringify({capDo:100,idThanhThuChon:'hoa_long'}))
 expect((await adminGame(env,{action:'spirit',sbd:'1'})).spirit).toBeNull()
 expect(sql.prepare('SELECT count(*) n FROM game_v2_profile').get()?.n).toBe(0)
 await loadProfile(env,'1')
 sql.prepare("UPDATE game_v2_profile SET json=json_set(json,'$.choice',json('false'),'$.pet','tinhyeu_ho','$.cap',10,'$.tower',2,'$.earned',120,'$.season','current') WHERE sbd='1'").run()
 sql.prepare('INSERT INTO game_v2_settings VALUES(?,?)').run('season',JSON.stringify({id:'current'}))
 const before=sql.prepare('SELECT * FROM game_v2_profile').get()
 expect((await adminGame(env,{action:'spirit',sbd:'1'})).spirit).toEqual({pet:'tinhyeu_ho',cap:10,tower:2,earned:120})
 expect(sql.prepare('SELECT * FROM game_v2_profile').get()).toEqual(before)
 sql.prepare("UPDATE game_v2_settings SET json=? WHERE key='season'").run(JSON.stringify({id:'next'}))
 expect((await adminGame(env,{action:'spirit',sbd:'1'})).spirit).toBeNull()
 expect(sql.prepare('SELECT * FROM game_v2_profile').get()).toEqual(before)
})

describe('Khiên (thầy lệnh 21/09: khiên quà tiến hoá đầu chỉ mở khi đủ 36 ngày đạt nhiệm vụ ngày)',()=>{
 it('thưởng theo mốc, tiêu một lần, chặn dùng trùng và giữ qua thiết bị',async()=>{
  const {env,sql}=fixture(),token=await gameToken(env,'1');await loadProfile(env,'1')
  const put=(cap:number,extra={})=>sql.prepare('UPDATE game_v2_profile SET json=? WHERE sbd=?').run(JSON.stringify({pet:'dat_quy',choice:false,cap,exp:0,wallet:0,earned:0,tower:1,mastery:[],arena:null,cutover:'now',...extra}),'1')
  put(9);await expect(gameV2(env,'shield-use',{token,useId:'test-shield-00001'})).rejects.toThrow('chưa có')
  const du36={expMoi:{daCong:0,manhDaTinh:0,ngayDat:36}} // đủ 36 ngày đạt từ mốc ⇒ khiên quà đầu (cấp 10) mở
  put(10);await expect(gameV2(env,'shield-use',{token,useId:'test-shield-00009'})).rejects.toThrow('Em chưa có khiên. Khiên đầu tiên mở khi em đạt nhiệm vụ ngày đủ 36 ngày (em đã có 0 ngày).')
  put(10,{expMoi:{daCong:0,manhDaTinh:0,ngayDat:35}});await expect(gameV2(env,'shield-use',{token,useId:'test-shield-00009'})).rejects.toThrow('(em đã có 35 ngày)')
  put(10,du36);const first=await gameV2(env,'shield-use',{token,useId:'test-shield-00001'});expect(first.profile).toMatchObject({shields:{used:1}})
  expect((first.profile as any).shields.activeUntil-Date.now()).toBeGreaterThan(9000)
  await gameV2(env,'shield-use',{token,useId:'test-shield-00001'});await gameV2(env,'shield-use',{token,useId:'test-shield-00002'})
  expect((await loadProfile(env,'1')).profile.shields?.used).toBe(1)
  put(10,{...du36,shields:{used:1,activeUntil:0,lastUse:'test-shield-00001'}})
  await expect(gameV2(env,'shield-use',{token,useId:'test-shield-00002'})).rejects.toThrow('chưa có')
  put(30,{...du36,shields:{used:1,activeUntil:0}})
  expect((await gameV2(env,'shield-use',{token,useId:'test-shield-00003'})).profile).toMatchObject({cap:30,shields:{used:2}})
  put(30,{expMoi:{daCong:0,manhDaTinh:0,ngayDat:35},shields:{used:2,activeUntil:0}}) // cấp 30 nhưng chưa đủ 36 ngày: quà 3 − 1 (khoá) = 2, đã dùng 2 ⇒ hết
  await expect(gameV2(env,'shield-use',{token,useId:'test-shield-00004'})).rejects.toThrow('Khiên đầu tiên mở khi em đạt nhiệm vụ ngày đủ 36 ngày (em đã có 35 ngày)')
  put(5,{khienRen:{manh:0,daRen:0}}) // cấp thường, không có gì: nói đúng luật mảnh
  await expect(gameV2(env,'shield-use',{token,useId:'test-shield-00005'})).rejects.toThrow('đủ 36 mảnh rèn một khiên')
  put(5,{khienRen:{manh:0,daRen:1}}) // có 1 khiên rèn ⇒ dùng được
  expect((await gameV2(env,'shield-use',{token,useId:'test-shield-00006'})).profile).toMatchObject({cap:5,shields:{used:1}})
 })
 it('tổng quà các mốc 1,3,6,9,12, không phát quà ở cấp thường',async()=>{
  const {shieldEntitlement,shieldRemaining}=await import('../src/game/than-thu-v2/shields')
  expect([1,9,10,29,30,49,50,70,100,120].map(shieldEntitlement)).toEqual([0,0,1,1,3,3,6,9,12,12])
  expect(shieldRemaining(100,{used:7,activeUntil:0})).toBe(5)
 })
})

describe('EXP học tập đồng bộ',()=>{
 it('chặn cộng trùng, trần ngày VN, không kéo điểm trước reset, tự nạp cấp',async()=>{
  const {creditAcademic}=await import('../server/src/game-v2-academic')
  const p=(await loadProfile(fixture().env,'1')).profile;p.cutover='2026-09-16T00:00:00Z'
  const events=Array.from({length:80},(_,i)=>({key:`q${i}`,at:'2026-09-16T02:00:00Z',amount:2}))
  expect(creditAcademic(p,events)).toBe(100);expect(p.earned).toBe(100);expect(creditAcademic(p,events)).toBe(0)
  expect(creditAcademic(p,[{key:'old',at:'2026-09-15T10:00:00Z',amount:50}])).toBe(0)
  expect(creditAcademic(p,[{key:'tomorrow',at:'2026-09-16T18:00:00Z',amount:60}])).toBe(60);expect(p.cap).toBe(1);expect(p.wallet).toBe(160) // sửa có chủ ý 21/09 (Đợt 1 thần thú): EXP học tập vào ỐNG NGHIỆM (100 + 60 = 160), không nạp thẳng vào cấp
 })
 it('đọc bài thi, chấm lại bài tập/khắc phục từ kho; không tin so_dung; chống trùng xuyên mục',async()=>{
  const {env,sql,objects}=fixture(),token=await gameToken(env,'1');const {profile}=await loadProfile(env,'1');profile.cutover='2026-09-16T00:00:00Z'
  sql.prepare('UPDATE game_v2_profile SET json=? WHERE sbd=?').run(JSON.stringify(profile),'1')
  sql.exec(`CREATE TABLE btvn(ma_btvn TEXT,ma_de TEXT,da_xoa INTEGER);CREATE TABLE btvn_em(khoa TEXT,ma_btvn TEXT,sbd TEXT,nop_luc TEXT,dap_an_json TEXT,so_dung INTEGER);CREATE TABLE nop_khac_phuc(khoa TEXT,ma_phieu TEXT,sbd TEXT,nop_luc TEXT,dap_an_json TEXT);INSERT INTO ca(ma_ca,trang_thai,cong_bo) VALUES('T','dong','ngay');INSERT INTO luot(ma_ca,sbd,lan_thu,nop_luc,trang_thai) VALUES('T','1',1,'2026-09-16T03:00:00Z','da_nop');INSERT INTO chi_tiet_cau VALUES('T','1',1,'exam-q',1);INSERT INTO btvn VALUES('H','D',0);INSERT INTO btvn_em VALUES('H|1','H','1','2026-09-16T04:00:00Z','{"D-I-1":"B","D-I-2":"A"}',999);INSERT INTO nop_khac_phuc VALUES('R|1','R','1','2026-09-16T05:00:00Z','{"D-I-1":"B"}');`)
  objects.set('kho/D.json',{cau:[{id:'D-I-1',phan:'I',dap_an:'B'},{id:'D-I-2',phan:'I',dap_an:'C'}]})
  objects.set('phieu/R.json',{phieu:{cau:[{id:'D-I-1',dapAn:'B'}]}})
  const first=await gameV2(env,'academic-sync',{token});expect(first.gain).toBe(4)
  expect((first.profile as any).academic.total).toBe(4);expect((first.profile as any).academic).not.toHaveProperty('seen')
  expect((await gameV2(env,'academic-sync',{token})).gain).toBe(0)
  expect(sql.prepare('SELECT so_dung FROM btvn_em').get()).toMatchObject({so_dung:999})
 })
})
it('Mom: không nhận điểm tự khai, chỉ chấm đáp án thuộc bài đã học; gửi lại không cộng trùng',async()=>{
 const {env,sql,seed}=fixture();seed();await syncIndex(env)
 sql.exec('CREATE TABLE btvn(ma_btvn TEXT,ma_de TEXT,da_xoa INTEGER);CREATE TABLE btvn_em(khoa TEXT,ma_btvn TEXT,sbd TEXT,nop_luc TEXT,dap_an_json TEXT);CREATE TABLE nop_khac_phuc(khoa TEXT,ma_phieu TEXT,sbd TEXT,nop_luc TEXT,dap_an_json TEXT)')
 const token=await gameToken(env,'1');await loadProfile(env,'1');const at=new Date().toISOString()
 expect((await gameV2(env,'academic-sync',{token,mom:[{id:'m1',at,score:10,correct:100,answers:{'fake-id':'B','D-I-0':'A'}}]})).gain).toBe(0)
 expect((await gameV2(env,'academic-sync',{token,mom:[{id:'m1',at,answers:{'D-I-0':'B'}}]})).gain).toBe(2)
 expect((await gameV2(env,'academic-sync',{token,mom:[{id:'m2',at,answers:{'D-I-0':'B'}}]})).gain).toBe(0)
})
it('Linh Tâm: phòng 4 người, xác thực lượt học, không dùng lại câu vòng trước, không lộ SBD',async()=>{
 const {env,sql}=fixture();const {escortAction}=await import('../server/src/game-v2-escort')
 let v:any=await escortAction(env,'1','dat_quy',1,'escort-create',{});const id=v.escort.id
 for(const sbd of ['2','3','4'])v=await escortAction(env,sbd,'lua_phuong',100,'escort-join',{room:id})
 await expect(escortAction(env,'5','dat_quy',1,'escort-join',{room:id})).rejects.toThrow('đủ bốn')
 v=await escortAction(env,'1','dat_quy',1,'escort-start',{room:id,revision:v.escort.revision})
 expect(v.escort.players.map((p:any)=>p.id)).toEqual(['p0','p1','p2','p3'])
 await expect(escortAction(env,'1','dat_quy',1,'escort-act',{room:id,revision:v.escort.revision,command:{type:'guard'}})).rejects.toThrow('câu Hoá')
 for(const sbd of ['1','2','3','4']){sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)').run('s'+sbd,sbd,JSON.stringify({mode:'arena',guardian:id,guardianRound:1}),new Date().toISOString());sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)').run('a'+sbd,sbd,'s'+sbd,'q','g',JSON.stringify({attempt:{correct:sbd!=='2',assisted:false}}),new Date().toISOString());v=await escortAction(env,sbd,'dat_quy',1,'escort-act',{room:id,revision:v.escort.revision,command:{type:'guard'}})}
 expect(v.escort.round).toBe(2)
 await expect(escortAction(env,'1','dat_quy',1,'escort-act',{room:id,revision:v.escort.revision,command:{type:'guard'}})).rejects.toThrow('câu Hoá')
 await expect(escortAction(env,'7','dat_quy',1,'escort-view',{room:id})).rejects.toThrow('chưa ở')
})

describe('adaptive variety',()=>{
 it('cycles through 60 fresh groups before reusing answered questions',()=>{
  const pool=Array.from({length:60},(_,i)=>question(i)),history:Attempt[]=[];const seen=new Set<string>()
  for(let n=0;n<10;n++){const qs=chooseSession(pool,[evidence()],history,[],'adventure',DAY+n*1000);expect(qs).toHaveLength(6);for(const q of qs){expect(seen.has(q.group)).toBe(false);seen.add(q.group);history.push({...attempt(DAY+n*1000,q.group),session:String(n)})}}
  expect(seen.size).toBe(60)
 })
 it('does not let old wrong evidence force an immediate repeat',()=>{
  const qs=chooseSession(Array.from({length:20},(_,i)=>question(i)),[evidence()],[attempt(DAY,'g0')],[],'adventure',DAY+1000)
  expect(qs.some(q=>q.group==='g0')).toBe(false)
 })
 it('small banks remain playable with no duplicate content in a session',()=>{
  const pool=[question(),{...question(),qid:'copy'},question(1)]
  const qs=chooseSession(pool,[evidence()],[attempt(DAY)],[],'repair',DAY+1000)
  expect(new Set(qs.map(q=>q.group)).size).toBe(qs.length)
 })
 it('keeps scope, review status and difficulty bounds',()=>{
  const pool=[question(),{...question(1),reviewed:false},{...question(2),mucDo:'van_dung'}]
  expect(chooseSession(pool,[evidence()],[],[],'adventure',DAY).map(q=>q.qid)).toEqual([question().qid])
 })
})

it('tên riêng lưu đúng hồ sơ, đồng bộ máy chiếu, không đổi điểm hay cấp',async()=>{
 const f=fixture(),token=await gameToken(f.env,'1');await gameV2(f.env,'choose',{token,pet:'nuoc_long'});const before=(await loadProfile(f.env,'1')).profile
 await gameV2(f.env,'rename',{token,name:'  Rồng   Lam  ',sbd:'2'});const after=(await loadProfile(f.env,'1')).profile
 expect(after.nickname).toBe('Rồng Lam');expect(after.cap).toBe(before.cap);expect(after.earned).toBe(before.earned)
 expect((await loadProfile(f.env,'2')).profile.nickname).toBeUndefined()
 expect((await adminGame(f.env,{sbd:'1',action:'spirit'})).spirit).toMatchObject({nickname:'Rồng Lam'})
 await expect(gameV2(f.env,'rename',{token,name:'<script>alert(1)</script>'})).rejects.toThrow()
})

it('Linh Tâm tải lại đúng câu cùng lượt và từ chối câu của lượt cũ',async()=>{
 const f=fixture();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');await gameV2(f.env,'choose',{token,pet:'nuoc_long'})
 const created=await gameV2(f.env,'escort-create',{token,mode:'solo'});const room=(created as any).escort
 const a=await gameV2(f.env,'start',{token,mode:'arena',guardian:room.id,guardianRound:1})
 const b=await gameV2(f.env,'start',{token,mode:'arena',guardian:room.id,guardianRound:1});expect(a.id).toBe(b.id)
 expect(f.sql.prepare('SELECT COUNT(*) n FROM game_v2_session').get()?.n).toBe(1)
 await gameV2(f.env,'rename',{token,name:'Rồng Lam'})
 const view=await gameV2(f.env,'escort-view',{token,room:room.id});expect((view as any).escort.players[0].alias).toBe('Rồng Lam')
 const raw=JSON.parse(String(f.sql.prepare('SELECT json FROM game_v2_room WHERE id=?').get(room.id)?.json));raw.round=2
 f.sql.prepare('UPDATE game_v2_room SET json=? WHERE id=?').run(JSON.stringify(raw),room.id)
 await expect(gameV2(f.env,'answer',{token,session:a.id,qid:'D-I-0',answer:'B'})).rejects.toThrow('Lượt vừa kết thúc')
 expect(f.sql.prepare('SELECT COUNT(*) n FROM game_v2_attempt').get()?.n).toBe(0)
})

it('nhiệm vụ cá nhân không lộ đáp án, giới hạn 36 câu ĐẢO theo ngày Việt Nam (sửa CÓ CHỦ Ý 21/09: 200 ⇒ 60 ⇒ Đảo 36 riêng, Đoàn 60 riêng — thầy lệnh 19:30), không ảnh hưởng hồ sơ khác',async()=>{
 const f=fixture();f.seed();await syncIndex(f.env);const token=await gameToken(f.env,'1');await gameV2(f.env,'choose',{token,pet:'nuoc_long'})
 const suggestion:any=await gameV2(f.env,'recommendations',{token})
 expect(suggestion.dailyUsed).toBe(0);expect(suggestion.remaining).toBe(36);expect(suggestion.suggestions.length).toBeGreaterThan(0)
 expect(JSON.stringify(suggestion)).not.toContain('correct');expect(suggestion.suggestions[0]).toHaveProperty('source')
 const session:any=await gameV2(f.env,'start',{token});const at=new Date().toISOString()
 const insert=f.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
 for(let i=0;i<35;i++)insert.run('limit'+i,'1','old','q'+i,'g'+i,JSON.stringify({attempt:{at:Date.now(),group:'g'+i,correct:true}}),at)
 const last:any=await gameV2(f.env,'start',{token});expect(last.questions).toHaveLength(1)
 await gameV2(f.env,'answer',{token,session:session.id,qid:session.questions[0].qid,answer:'B'})
 expect((await gameV2(f.env,'recommendations',{token})).remaining).toBe(0)
 await expect(gameV2(f.env,'start',{token})).rejects.toThrow('36 câu')
 /* Đợt 2 (21/09): `start` lần hai khi lượt cũ CHƯA trả lời câu nào trả lại CHÍNH lượt ấy (không bốc lại câu, không tốn lượt). Trần 60 vẫn chặn trả lời ở MỘT lượt khác. */
 expect(last.id).toBe(session.id)
 f.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) SELECT ?,sbd,json,created_at FROM game_v2_session WHERE id=?').run('khac',session.id)
 await expect(gameV2(f.env,'answer',{token,session:'khac',qid:session.questions[0].qid,answer:'B'})).rejects.toThrow('36 câu')
 const replay:any=await gameV2(f.env,'answer',{token,session:session.id,qid:session.questions[0].qid,answer:'B'});expect(replay.replayed).toBe(true)
 const other=await gameToken(f.env,'2');expect((await gameV2(f.env,'recommendations',{token:other})).remaining).toBe(36)
})

it('PvP 1 đấu 1: đủ hai người mới bắt đầu, chặn người thứ ba, không tạo Boss',async()=>{
 const {env}=fixture();const {escortAction}=await import('../server/src/game-v2-escort')
 let v:any=await escortAction(env,'1','dat_quy',1,'escort-create',{mode:'duel'});const id=v.escort.id
 expect(v.escort.mode).toBe('duel');expect(v.escort.players).toHaveLength(1)
 await expect(escortAction(env,'1','dat_quy',1,'escort-start',{room:id,revision:v.escort.revision})).rejects.toThrow('đủ 2')
 v=await escortAction(env,'2','nuoc_long',1,'escort-join',{room:id})
 await expect(escortAction(env,'3','dat_quy',1,'escort-join',{room:id})).rejects.toThrow('đủ hai')
 await expect(escortAction(env,'2','nuoc_long',1,'escort-start',{room:id,revision:v.escort.revision})).rejects.toThrow('chủ phòng')
 v=await escortAction(env,'1','dat_quy',1,'escort-start',{room:id,revision:v.escort.revision})
 expect(v.escort.started).toBe(true);expect(v.escort.players.map((p:any)=>p.team)).toEqual([0,1]);expect(v.escort.players).toHaveLength(2)
 v=await escortAction(env,'2','nuoc_long',1,'escort-leave',{room:id,revision:v.escort.revision});expect(v.escort.finished).toBe(true);expect(v.escort.winner).toBe(0)
})
