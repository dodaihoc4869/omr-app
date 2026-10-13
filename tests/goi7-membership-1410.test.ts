// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { writeFileSync } from 'node:fs'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, gvBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { damBaoGoi7, dongBoGoi7, docGoiCuaEm7, lapGoi7, startGoi7, gapHuongDan7, chotMucNgay7 } from '../server/src/goi-bai-7'
import { gvGoi7 } from '../server/src/goi-bai-7-thay'
import { kiemGoi7 } from '../server/src/goi-bai-7-kiem'
import { gameV2 } from '../server/src/game-v2'
import worker from '../server/src/index'
import { docChanCauMoiGoi7 } from '../server/src/goi-bai-7-chan-moi'
import { gameToken } from '../server/src/game-v2-auth'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { emCoGhi, keHoachCoDem, xoaDemKeHoach } from '../server/src/dem-ke-hoach'
import type { Env, D1PreparedStatement } from '../server/src/kieu'
type Row=Record<string,unknown>
const NOW=Date.parse('2026-10-14T02:00:00Z'),ID='g7:tick'
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW)})
afterEach(()=>{vi.useRealTimers();xoaDemPhamVi();xoaDemChienDich();xoaDemCaBaoVe();xoaDemKeHoach()})
async function kho(chon?:string[],n=18) {
  const k=taoKhoOmni({'DH-B1':n},5)
  await Promise.all([damBaoBangBaiDaDay(k.env),damBaoGoi7(k.env)])
  k.d.sql.exec(`UPDATE hoc_sinh SET mat_khau='gia';
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-14"}','x');
    INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài mới',18,0,'v1');
    INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('tick','12A1','B1','Bài mới',1,'["DH-B1"]','2026-10-14T00:00:00Z');`)
  if(chon)k.d.sql.prepare('INSERT INTO goi_bai_7_tick_em(tick_id,sbd_json,luc) VALUES(?,?,?)').run('tick',JSON.stringify(chon),'x')
  themChienDich(k.d,{id:'hanh-trinh-v3-khoi-12',qids:k.qids('DH-B1'),maDe:['DH-B1'],sbd:['S1','S2','S3','S4','S5'],hanNop:'9999-12-31',taoLuc:'2026-10-01T00:00:00Z',theLuc:24,huyetChien:false})
  await dongBoGoi7(k.env,NOW,10,'',true)
  return k
}
const docEm=(env:Env)=>gvGoi7(env,{action:'doc_em',goiId:ID})
async function sua(env:Env,them:string[]=[],bot:string[]=[],rid=crypto.randomUUID(),revision?:unknown) {
  return gvGoi7(env,{action:'sua_em',goiId:ID,revision:revision??(await docEm(env)).revision,requestId:rid,them,bot})
}
const snap=(k:Awaited<ReturnType<typeof kho>>,sql:string)=>JSON.stringify(k.d.sql.prepare(sql).all())
function chenCa(k:Awaited<ReturnType<typeof kho>>) {
  k.d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('ca','Ca thi','mo','x')")
}

it('đọc một truy vấn nhỏ đúng lớp; nhan chỉ em hợp lệ, em khóa và chuyển lớp được ghi rõ',async()=>{
  const k=await kho();k.d.sql.exec("UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S4';UPDATE hoc_sinh SET ten_lop='12B' WHERE sbd='S5'")
  const n=k.d.soLenh.prepare,r=await docEm(k.env)
  expect(k.d.soLenh.prepare-n).toBe(1)
  expect(r).toMatchObject({ok:true,goiId:ID,tickId:'tick',lop:'12A1',ten:'Bài mới',serverNow:NOW,nhan:['S1','S2','S3'],emChuyenLop:[{sbd:'S5',hoTen:'Em 5',tenLop:'12B'}]})
  expect(r.revision).toMatch(/^[a-f0-9]{64}$/)
  expect(r.em).toEqual(expect.arrayContaining([{sbd:'S4',hoTen:'Em 4',khoi:'12A1',tenLop:'12A1',duocThem:false}]))
  for(const key of ['cau','questions','correct','events','diem','json'])expect(r).not.toHaveProperty(key)
})

it('bớt bền vững qua 3 lần đồng bộ; thêm lại có chủ đích giữ đúng gói, nguồn, ngày/hạn và lịch sử',async()=>{
  const k=await kho(),g=snap(k,"SELECT * FROM goi_bai_7"),cs=snap(k,"SELECT * FROM goi_bai_7_cau"),e=snap(k,"SELECT * FROM goi_bai_7_em WHERE sbd='S2'")
  await lam(k.env,'S2',k.qids('DH-B1')[0]!,NOW-5000,true,{cauVersion:'v1'})
  const hist=snap(k,"SELECT * FROM su_kien_hoc WHERE sbd='S2'")
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true,bot:['S2'],nhan:['S1','S3','S4','S5']})
  for(let i=1;i<=3;i++) {await dongBoGoi7(k.env,NOW+i*60000,10,'',true);expect(await docGoiCuaEm7(k.env,'S2',NOW+i*60000)).toEqual([])}
  expect(snap(k,"SELECT * FROM goi_bai_7_em WHERE sbd='S2'")).toBe(e)
  expect(snap(k,"SELECT * FROM su_kien_hoc WHERE sbd='S2'")).toBe(hist)
  expect(await sua(k.env,['S2'],[])).toMatchObject({ok:true,them:['S2'],nhan:['S1','S2','S3','S4','S5']})
  const re=await docGoiCuaEm7(k.env,'S2',NOW+240000)
  expect(re[0]).toMatchObject({id:ID,batDau:'2026-10-14',han:'2026-10-20'})
  expect(re[0]?.daGap).toContain(k.qids('DH-B1')[0])
  expect(snap(k,"SELECT * FROM goi_bai_7")).toBe(g);expect(snap(k,"SELECT * FROM goi_bai_7_cau")).toBe(cs)
})

it('tick có lựa chọn giữ danh sách đóng; tick cũ không suy chiến dịch và vẫn tự nhận em mới',async()=>{
  const k=await kho(['S1','S3']);expect((await docEm(k.env)).nhan).toEqual(['S1','S3'])
  k.d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S6','Mới','12A1','x')")
  await dongBoGoi7(k.env,NOW+60000,10,'',true)
  expect((await docEm(k.env)).nhan).toEqual(['S1','S3'])
  expect(await sua(k.env,['S6'],[])).toMatchObject({ok:true,nhan:['S1','S3','S6']})
  const old=await kho();old.d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S6','Mới','12A1','x')")
  await dongBoGoi7(old.env,NOW+60000,10,'',true)
  expect((await docEm(old.env)).nhan).toEqual(['S1','S2','S3','S4','S5','S6'])
})

it('em không thay giữ nguyên QID/thứ tự/quota/kế hoạch và cache; chỉ đổi đúng SBD, không xóa lịch sử/phiên/đề công bố',async()=>{
  const k=await kho(),p=await lapGoi7(k.env,'S1',NOW)
  expect(p).toBeTruthy()
  await docGoiCuaEm7(k.env,'S2',NOW)
  k.d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)').run('gap',ID,'S2',k.qids('DH-B1')[0],'v1','cho_thay','2026-10-13T01:00:00Z')
  k.d.sql.prepare('INSERT INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES(?,?,?,?,?,?,?)').run('S2','2026-10-13',1,24,4,24,'x')
  const session=await startGoi7(k.env,'S2',NOW),before={g:snap(k,'SELECT * FROM goi_bai_7'),cs:snap(k,'SELECT * FROM goi_bai_7_cau'),gap:snap(k,'SELECT * FROM goi_bai_7_gap'),session:snap(k,'SELECT * FROM game_v2_session'),q1:snap(k,"SELECT * FROM goi_bai_7_ngay WHERE sbd='S1'"),m1:snap(k,"SELECT * FROM goi_bai_7_muc_ngay WHERE sbd='S1'")}
  k.d.sql.prepare(`INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,nop_luc,diem,cap_nhat_luc)
    VALUES('da-cong-bo','S2','12A1','2026-10-13',?,?,'da_nop','{"cau":[]}',?,7,?)`).run(NOW-86400000,NOW,NOW-1000,NOW)
  const deCu=snap(k,"SELECT * FROM kiem_tra_ca_nhan WHERE sbd='S2'")
  expect(session?.id).toBeTruthy()
  emCoGhi('S1');emCoGhi('S2')
  let a=0,b=0;const ca=()=>keHoachCoDem('S1',async()=>({ok:true,id:++a}),NOW),cb=()=>keHoachCoDem('S2',async()=>({ok:true,id:++b}),NOW)
  await ca();await cb();expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  await ca();await cb();expect(a).toBe(1);expect(b).toBe(2)
  const after=await lapGoi7(k.env,'S1',NOW)
  expect(after?.plan).toEqual(p?.plan);expect(after?.goi.map(g=>g.quota)).toEqual(p?.goi.map(g=>g.quota))
  for(const [key,sql] of Object.entries({g:'SELECT * FROM goi_bai_7',cs:'SELECT * FROM goi_bai_7_cau',gap:'SELECT * FROM goi_bai_7_gap',session:'SELECT * FROM game_v2_session',q1:"SELECT * FROM goi_bai_7_ngay WHERE sbd='S1'",m1:"SELECT * FROM goi_bai_7_muc_ngay WHERE sbd='S1'"}))expect(snap(k,sql)).toBe(before[key as keyof typeof before])
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_muc_ngay WHERE sbd='S2' AND ngay='2026-10-13'").get()).toMatchObject({n:1})
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_ngay WHERE sbd='S2' AND ngay>='2026-10-14'").get()).toMatchObject({n:0})
  expect(snap(k,"SELECT * FROM kiem_tra_ca_nhan WHERE sbd='S2'")).toBe(deCu)
})

it('ACK sorted đầy đủ, retry cùng payload giữ nguyên ACK dù cờ tắt sau ghi',async()=>{
  const k=await kho(),r=await docEm(k.env),rid='retry',start=k.d.soLenh.batch
  const body={action:'sua_em',goiId:ID,revision:r.revision,requestId:rid,them:[],bot:['S3','S2']}
  const ack=await gvGoi7(k.env,body)
  expect(k.d.soLenh.batch-start).toBe(2) // đọc trạng thái+receipt song song, rồi một batch ghi 6 lệnh.
  expect(ack).toMatchObject({ok:true,them:[],bot:['S2','S3'],nhan:['S1','S4','S5'],requestId:rid,serverNow:NOW})
  expect(ack.revision).not.toBe(r.revision);expect((await docEm(k.env)).revision).toBe(ack.revision)
  const committed=snap(k,'SELECT * FROM goi_bai_7_revision')
  k.d.sql.exec("UPDATE cau_hinh SET gia_tri='{\"bat\":false}' WHERE khoa='goi_bai_7_v1'")
  vi.setSystemTime(NOW+5000)
  expect(await gvGoi7(k.env,{...body,bot:['S2','S3']})).toEqual(ack)
  expect(snap(k,'SELECT * FROM goi_bai_7_revision')).toBe(committed)
  expect(await gvGoi7(k.env,{...body,bot:['S1']})).toMatchObject({ok:false,code:'khong_hop_le'})
})

it('hai CAS khác mã cùng revision: đúng một người thắng, không lưu nửa danh sách; hai retry cùng mã chỉ một ghi',async()=>{
  const k=await kho(),revision=(await docEm(k.env)).revision
  const r=await Promise.all([sua(k.env,[],['S2'],'a',revision),sua(k.env,[],['S3'],'b',revision)])
  expect(r.filter(x=>x.ok)).toHaveLength(1);expect(r.filter(x=>!x.ok)[0]).toMatchObject({code:'xung_dot'})
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_em').get()).toMatchObject({n:1})
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_chon_em').get()).toMatchObject({n:1})
  const next=(await docEm(k.env)).revision,bot=((await docEm(k.env)).nhan as string[])[0]!
  const rs=await Promise.all([sua(k.env,[],[bot],'same',next),sua(k.env,[],[bot],'same',next)])
  expect(rs[0]).toEqual(rs[1]);expect(rs[0]).toMatchObject({ok:true})
  expect(k.d.sql.prepare('SELECT revision FROM goi_bai_7_revision').get()).toMatchObject({revision:2})
})

it.each(['lop','khoa','tick','co','ca'] as const)('guard %s thay ngay giữa đọc và batch ghi: không receipt/override/cache một phần',async(mode)=>{
  const k=await kho(),revision=(await docEm(k.env)).revision,goc=k.env.DB,batch=goc.batch.bind(goc)
  let changed=false
  k.env.DB={...goc,batch(ds:D1PreparedStatement[]) {
    if(ds.some(st=>(st as unknown as {_q:string})._q.includes('INSERT OR IGNORE INTO goi_bai_7_sua_em'))&&!changed) {
      changed=true
      if(mode==='lop')k.d.sql.exec("UPDATE hoc_sinh SET ten_lop='12B' WHERE sbd='S2'")
      if(mode==='khoa')k.d.sql.exec("UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S2'")
      if(mode==='tick')k.d.sql.exec("UPDATE bai_da_day SET bo_tick_luc='x' WHERE id='tick'")
      if(mode==='co')k.d.sql.exec("UPDATE cau_hinh SET gia_tri='{\"bat\":false}' WHERE khoa='goi_bai_7_v1'")
      if(mode==='ca')chenCa(k)
    }
    return batch(ds)
  }}
  expect(await sua(k.env,[],['S2','S3'],'guard',revision)).toMatchObject({ok:false,code:'xung_dot'})
  expect(changed).toBe(true)
  for(const table of ['goi_bai_7_chon_em','goi_bai_7_sua_em','goi_bai_7_revision'])expect(k.d.sql.prepare(`SELECT COUNT(*) n FROM ${table}`).get()).toMatchObject({n:0})
})

it('một SBD sai/khóa/ngoài lớp hoặc delta trùng không được ghi; bài bớt hết giữ tick và quyền em khác',async()=>{
  const k=await kho();k.d.sql.exec("UPDATE hoc_sinh SET ten_lop='12B' WHERE sbd='S5';UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S4'")
  for(const bot of [['S1','ngoai'],['S1','S4'],['S1','S5'],['S1','S1']])expect(await sua(k.env,[],bot)).toMatchObject({ok:false,code:'khong_hop_le'})
  expect(await sua(k.env,['S1'],['S1'])).toMatchObject({ok:false,code:'khong_hop_le'})
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_chon_em').get()).toMatchObject({n:0})
  expect(await sua(k.env,[],['S1','S2','S3'])).toMatchObject({ok:true,nhan:[]})
  expect(k.d.sql.prepare("SELECT bo_tick_luc FROM bai_da_day WHERE id='tick'").get()).toMatchObject({bo_tick_luc:null})
})

it('ca đang mở hoặc cờ tắt chặn thay đổi với mã lỗi đúng; revision cũ sau đổi lớp/khóa bị từ chối',async()=>{
  const k=await kho(),revision=(await docEm(k.env)).revision
  chenCa(k);expect(await sua(k.env,[],['S2'])).toMatchObject({ok:false,code:'ca_mo'})
  k.d.sql.exec("UPDATE ca SET trang_thai='dong';UPDATE cau_hinh SET gia_tri='{\"bat\":false}' WHERE khoa='goi_bai_7_v1'")
  expect(await sua(k.env,[],['S2'],'off',revision)).toMatchObject({ok:false,code:'tam_dung'})
  k.d.sql.exec("UPDATE cau_hinh SET gia_tri='{\"bat\":true,\"batDau\":\"2026-10-14\"}' WHERE khoa='goi_bai_7_v1';UPDATE hoc_sinh SET trang_thai='khoa' WHERE sbd='S2'")
  expect(await sua(k.env,[],['S3'],'stale',revision)).toMatchObject({ok:false,code:'xung_dot'})
})

it('bớt em giữ resume phiên/chữa ref/nộp câu đã cấp; không cấp phiên học mới từ Gói7',async()=>{
  const k=await kho(),start=await startGoi7(k.env,'S2',NOW),session=snap(k,"SELECT * FROM game_v2_session WHERE sbd='S2'")
  expect(start?.id).toBeTruthy();const qs=start!.questions as Row[],q=qs.find(q=>q.phan==='I')!
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  expect(await docGoiCuaEm7(k.env,'S2',NOW)).toEqual([])
  const resumed=await startGoi7(k.env,'S2',NOW+1000)
  expect(resumed?.id).toBe(start!.id);expect((resumed?.questions as Row[]).map(q=>q.qid)).toEqual(qs.map(q=>q.qid))
  expect(snap(k,"SELECT * FROM game_v2_session WHERE sbd='S2'")).toBe(session)
  const support=await gapHuongDan7(k.env,'S2',{session:start!.id,qid:q.qid,chuaTuLam:true},NOW+2000)
  expect(support).toMatchObject({ok:true,hocCoHoTro:true})
  const result=await gameV2(k.env,'answer',{token:await gameToken(k.env,'S2'),session:start!.id,qid:q.qid,answer:'A',msLam:1000})
  expect(result.ok).toBe(true)
  expect(await startGoi7(k.env,'S2',NOW+3*3600000)).toBeNull()
})

it('tự kiểm đã cấp vẫn resume/nộp sau bớt; không mở lượt mới/giả id, đáp án vẫn chỉ sau nộp và nguồn sửa vẫn chặn',async()=>{
  const k=await kho(),start=await kiemGoi7(k.env,'S2','hoc-tap-kiem-start',{goiId:ID,maDe:'DH-B1'},NOW),qs=start.questions as Row[]
  expect(qs.length).toBeGreaterThan(0);expect(qs.some(q=>'correct'in q)).toBe(false)
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  expect(await kiemGoi7(k.env,'S2','hoc-tap-kiem-start',{goiId:ID,maDe:'DH-B1'},NOW+1000)).toEqual(start)
  await expect(kiemGoi7(k.env,'S3','hoc-tap-kiem-nop',{goiId:ID,id:start.id,tra:{}},NOW+2000)).rejects.toThrow('Không tìm thấy')
  const tra=Object.fromEntries(qs.map(q=>[String(q.qid),q.phan==='I'?'B':q.phan==='II'?'DSDS':'4']))
  const result=await kiemGoi7(k.env,'S2','hoc-tap-kiem-nop',{goiId:ID,id:start.id,tra},NOW+2000)
  expect(result).toMatchObject({ok:true,daNop:true,daGhiSo:true})
  expect(result.ketQua).toHaveLength(qs.length)
  await expect(kiemGoi7(k.env,'S2','hoc-tap-kiem-start',{goiId:ID,maDe:'DH-B1'},NOW+3000)).rejects.toThrow('ngừng nhận')
})

it('tick mới đã chọn em nối membership Gói7 ngay; không nhận em ngoài lớp',async()=>{
  const k=await kho()
  const r=await gvBaiDaDay(k.env,{action:'tick',lop:'12A1',khoaBai:'B2',tenBai:'Bài 2',viTri:2,maDe:['DH-B1'],sbd:['S1','S3'],hanNop:'2026-10-20'},NOW)
  expect(r.ok).toBe(true)
  const tick=k.d.sql.prepare("SELECT id FROM bai_da_day WHERE khoa_bai='B2'").get() as {id:string}
  expect(JSON.parse((k.d.sql.prepare('SELECT sbd_json FROM goi_bai_7_tick_em WHERE tick_id=?').get(tick.id) as {sbd_json:string}).sbd_json)).toEqual(['S1','S3'])
  await dongBoGoi7(k.env,NOW+60000,10,'',true)
  expect((await gvGoi7(k.env,{action:'doc_em',goiId:`g7:${tick.id}`})).nhan).toEqual(['S1','S3'])
})

it('100 em thay đổi vẫn 8 câu SQL/2 batch như 1 em, không có query mỗi em',async()=>{
  const k=await kho()
  const add=k.d.sql.prepare("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES(?,?,'12A1','x')")
  for(let i=6;i<=100;i++)add.run(`S${i}`,`Em ${i}`)
  await dongBoGoi7(k.env,NOW+60000,10,'',true)
  const doc=await docEm(k.env),bot=doc.nhan as string[],before={q:k.d.soLenh.prepare,b:k.d.soLenh.batch}
  const r=await sua(k.env,[],bot,'100em',doc.revision)
  expect(r).toMatchObject({ok:true,nhan:[],bot:[...bot].sort()})
  expect(bot).toHaveLength(100)
  expect(k.d.soLenh.prepare-before.q).toBe(8);expect(k.d.soLenh.batch-before.b).toBe(2)
})

it('SQLite lỗi ở giữa batch rollback cả receipt/override/revision và kế hoạch',async()=>{
  const k=await kho();await docGoiCuaEm7(k.env,'S2',NOW)
  const quota=snap(k,"SELECT * FROM goi_bai_7_ngay WHERE sbd='S2'")
  k.d.sql.exec("CREATE TRIGGER chan_ghi BEFORE INSERT ON goi_bai_7_chon_em WHEN NEW.sbd='S2' BEGIN SELECT RAISE(ABORT,'loi giua batch');END")
  expect(await sua(k.env,[],['S1','S2'])).toMatchObject({ok:false})
  for(const table of ['goi_bai_7_chon_em','goi_bai_7_sua_em','goi_bai_7_revision'])expect(k.d.sql.prepare(`SELECT COUNT(*) n FROM ${table}`).get()).toMatchObject({n:0})
  expect((await docEm(k.env)).nhan).toEqual(['S1','S2','S3','S4','S5'])
  expect(snap(k,"SELECT * FROM goi_bai_7_ngay WHERE sbd='S2'")).toBe(quota)
})

it.each(['quota','muc','phien','tu_kiem'] as const)('ảnh đọc cũ trước khi bớt không được ghi/cấp %s sau ACK',async(mode)=>{
  const k=await kho(),goc=k.env.DB;let doi=false
  const match=mode==='quota'?'INSERT OR IGNORE INTO goi_bai_7_ngay':mode==='muc'?'INSERT OR IGNORE INTO goi_bai_7_muc_ngay':mode==='phien'?'INSERT INTO game_v2_session':'INSERT INTO goi_bai_7_kiem'
  k.env.DB={...goc,prepare(sql:string) {
    const st=goc.prepare(sql)
    if(!sql.includes(match))return st
    const run=st.run.bind(st)
    st.run=async()=>{if(!doi){doi=true;expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})}return run()}
    return st
  }}
  if(mode==='quota')await docGoiCuaEm7(k.env,'S2',NOW)
  if(mode==='muc')await chotMucNgay7(k.env,'S2','2026-10-14',1,3,NOW,false,undefined,0,false,[ID])
  if(mode==='phien')await expect(startGoi7(k.env,'S2',NOW)).rejects.toThrow('Danh sách bài vừa thay đổi')
  if(mode==='tu_kiem')await expect(kiemGoi7(k.env,'S2','hoc-tap-kiem-start',{goiId:ID,maDe:'DH-B1'},NOW)).rejects.toThrow('Danh sách bài vừa thay đổi')
  expect(doi).toBe(true)
  for(const table of ['goi_bai_7_ngay','goi_bai_7_muc_ngay','game_v2_session','goi_bai_7_kiem'])expect(k.d.sql.prepare(`SELECT COUNT(*) n FROM ${table} WHERE sbd='S2'`).get()).toMatchObject({n:0})
})

it('bớt em không bỏ cổng phiên tự kiểm: nguồn câu đổi hoặc bị giữ tiếp tục chặn nộp',async()=>{
  const k=await kho(),start=await kiemGoi7(k.env,'S2','hoc-tap-kiem-start',{goiId:ID,maDe:'DH-B1'},NOW)
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  const qs=start.questions as Row[],tra=Object.fromEntries(qs.map(q=>[String(q.qid),q.phan==='I'?'B':q.phan==='II'?'DSDS':'4']))
  const first=k.qids('DH-B1')[0]!
  k.d.sql.prepare('UPDATE game_v2_question SET version=? WHERE qid=?').run('v2',first)
  await expect(kiemGoi7(k.env,'S2','hoc-tap-kiem-nop',{goiId:ID,id:start.id,tra},NOW+1000)).rejects.toThrow()
  expect(k.d.sql.prepare('SELECT nop_luc FROM goi_bai_7_kiem WHERE id=?').get(String(start.id))).toMatchObject({nop_luc:null})
})

it('thống kê nhẹ và chi tiết cùng loại em bị bớt; giữ nguyên sổ sai cũ',async()=>{
  const k=await kho(),qid=k.qids('DH-B1')[0]!
  await lam(k.env,'S2',qid,NOW-1000,false,{cauVersion:'v1'})
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  const [a,b]=await Promise.all([gvGoi7(k.env,{action:'tong_hop'}),gvGoi7(k.env,{action:'danh_sach',goiId:ID})])
  expect(a.thongKe).toMatchObject({[ID]:{soEm:4,pGap:0,pTuLam:0}})
  expect((b.em as Row[]).map(e=>e.sbd)).toEqual(['S1','S3','S4','S5'])
  expect((b.cau as Row[]).find(c=>c.qid===qid)?.sai).toBe(0)
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE sbd='S2' AND ket_qua=0").get()).toMatchObject({n:1})
})

it('sửa hạn gói đã bớt không làm mất mức chốt của em đang nhận gói khác',async()=>{
  const k=await kho();expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  k.d.sql.exec(`INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('tick2','12A1','B2','Bài 2',2,'["DH-B1"]','2026-10-14T00:00:00Z');
    INSERT INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) VALUES('g2','tick2','12A1','B2','Bài 2','2026-10-14','2026-10-20','x');
    INSERT INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) VALUES('g2','S2','2026-10-14','2026-10-20');
    INSERT INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES('S2','2026-10-14',1,24,29,29,'x');
    INSERT INTO goi_bai_7_muc_ngay(sbd,ngay,tang,toi_thieu_tang,quota,muc,luc) VALUES('S1','2026-10-14',1,24,24,24,'x');`)
  const cu=snap(k,"SELECT * FROM goi_bai_7_muc_ngay WHERE sbd='S2'")
  expect(await gvGoi7(k.env,{action:'sua_han',goiId:ID,hanCu:'2026-10-20',han:'2026-10-25'})).toMatchObject({ok:true,daDoi:true})
  expect(snap(k,"SELECT * FROM goi_bai_7_muc_ngay WHERE sbd='S2'")).toBe(cu)
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7_muc_ngay WHERE sbd='S1'").get()).toMatchObject({n:0})
  expect(k.d.sql.prepare("SELECT han FROM goi_bai_7_em WHERE sbd='S2' AND goi_id=?").get(ID)).toMatchObject({han:'2026-10-25'})
})

it('router học tập không fallback phát lại câu chưa gặp của gói đã bớt; Sảnh không hứa số câu không được nhận',async()=>{
  const k=await kho();expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  const token=await gameToken(k.env,'S2'),start=await gameV2(k.env,'hoc-tap-start',{token}),sanh=await gameV2(k.env,'hoc-tap-sanh',{token})
  expect(start.ok).toBe(true);expect(start.questions).toEqual([])
  expect(sanh.theLuc).toMatchObject({con:0})
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM game_v2_session WHERE sbd='S2'").get()).toMatchObject({n:0})
})

it('ônhọc đã gặp vẫn mở qua router sau bớt; helper không cấm QID dùng chung với gói còn nhận',async()=>{
  const k=await kho(),qid=k.qids('DH-B1')[0]!
  await lam(k.env,'S2',qid,NOW-86400000,false,{cauVersion:'v1'})
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  const chan=await docChanCauMoiGoi7(k.env,'S2')
  expect(chan.has(qid)).toBe(false);expect(chan.has(k.qids('DH-B1')[1]!)).toBe(true)
  const start=await gameV2(k.env,'hoc-tap-start',{token:await gameToken(k.env,'S2')})
  expect(start.ok).toBe(true)
  expect((start.questions as Row[]).map(q=>q.qid)).toEqual([qid])
  k.d.sql.exec(`INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('tick2','12A1','B2','Bài 2',2,'["DH-B1"]','2026-10-14T00:00:00Z');
    INSERT INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) VALUES('g2','tick2','12A1','B2','Bài 2','2026-10-14','2026-10-20','x');
    INSERT INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) VALUES('g2','S2','2026-10-14','2026-10-20');
    INSERT INTO goi_bai_7_cau SELECT 'g2',qid,version,ma_de,meta_json FROM goi_bai_7_cau WHERE goi_id='g7:tick';`)
  expect(await docChanCauMoiGoi7(k.env,'S2')).toEqual(new Set())
})

it('attempt bản cũ không mở lại bản mới chưa gặp của bài đã ngừng nhận',async()=>{
  const k=await kho(),start=await startGoi7(k.env,'S2',NOW),q=(start?.questions as Row[]).find(q=>q.phan==='I')!
  expect((await gameV2(k.env,'answer',{token:await gameToken(k.env,'S2'),session:start!.id,qid:q.qid,answer:'A',msLam:1000})).ok).toBe(true)
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  expect((await docChanCauMoiGoi7(k.env,'S2')).has(String(q.qid))).toBe(false)
  k.d.sql.prepare("UPDATE goi_bai_7_cau SET version='v2',meta_json=json_set(meta_json,'$.version','v2') WHERE qid=?").run(String(q.qid))
  expect((await docChanCauMoiGoi7(k.env,'S2')).has(String(q.qid))).toBe(true)
})

it('endpoint giáo viên giữ cổng mật khẩu; retry thật qua Worker giữ nguyên serverNow của ACK đã chốt',async()=>{
  const k=await kho()
  const post=async(body:Row)=>{
    const r=await worker.fetch(new Request('https://test/gv/goi-bai-7',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}),k.env)
    return {status:r.status,body:await r.json() as Row}
  }
  const revision=(await docEm(k.env)).revision,body={action:'sua_em',goiId:ID,requestId:'http',revision,them:[],bot:['S2']}
  const no=await post(body);expect(no.status).toBe(403)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_sua_em').get()).toMatchObject({n:0})
  const authorized={...body,secret:k.env.MA_BI_MAT}
  const a=await post(authorized);expect(a.body).toMatchObject({ok:true,serverNow:NOW})
  vi.setSystemTime(NOW+30000)
  const b=await post(authorized)
  for(const key of ['goiId','requestId','revision','them','bot','nhan','serverNow'])expect(b.body[key]).toEqual(a.body[key])
})

it('cổng câu mới dùng chỉ mục theo em/QID/bản thay vì quét lại sổ cho từng câu',async()=>{
  const k=await kho(undefined,500)
  expect(await sua(k.env,[],['S2'])).toMatchObject({ok:true})
  const phien=k.d.sql.prepare('INSERT INTO game_v2_session(id,sbd,json,created_at) VALUES(?,?,?,?)'),at=k.d.sql.prepare('INSERT INTO game_v2_attempt(id,sbd,session,qid,content_group,json,created_at) VALUES(?,?,?,?,?,?,?)')
  const gap=k.d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)')
  k.d.sql.exec('BEGIN')
  for(let i=0;i<5000;i++) {
    const qid=`cu-${i}`,session=`s-${Math.floor(i/6)}`
    if(i%6===0)phien.run(session,'S2',JSON.stringify({questions:Array.from({length:6},(_,j)=>({qid:`cu-${i+j}`,version:'v1'}))}),'x')
    at.run(`a-${i}`,'S2',session,qid,qid,'{}','x');gap.run(`g-${i}`,'g-cu','S2',qid,'v1','co_ho_tro','x')
  }
  k.d.sql.exec('COMMIT')
  let query='';const db=k.env.DB
  k.env.DB={...db,prepare(sql:string){if(sql.startsWith('SELECT qid FROM (WITH em AS MATERIALIZED'))query=sql;return db.prepare(sql)}}
  expect((await docChanCauMoiGoi7(k.env,'S2')).size).toBe(500)
  const measure=()=>{const t=performance.now(),rows=k.d.sql.prepare(query).all('S2');return {ms:performance.now()-t,rows:rows.length}}
  const plan=k.d.sql.prepare(`EXPLAIN QUERY PLAN ${query}`).all('S2').map(r=>String(r.detail))
  for(const index of ['goi_bai_7_cau_qid','goi_bai_7_gap_sbd_qid','game_v2_attempt_sbd_qid'])expect(plan.join('\n')).toContain(index)
  const coChiMuc=Array.from({length:5},measure)
  k.d.sql.exec('DROP INDEX goi_bai_7_cau_qid;DROP INDEX goi_bai_7_gap_sbd_qid;DROP INDEX game_v2_attempt_sbd_qid')
  const truoc=Array.from({length:5},measure),t=performance.now()
  k.d.sql.exec('CREATE INDEX goi_bai_7_cau_qid ON goi_bai_7_cau(qid,version,goi_id);CREATE INDEX goi_bai_7_gap_sbd_qid ON goi_bai_7_gap(sbd,qid,version);CREATE INDEX game_v2_attempt_sbd_qid ON game_v2_attempt(sbd,qid,session)')
  const taoChiMucMs=performance.now()-t
  for(const r of [...coChiMuc,...truoc])expect(r.rows).toBe(500)
  if(process.env.GHI_PERF_C3)writeFileSync(process.env.GHI_PERF_C3,JSON.stringify({mau:'SQLite cục bộ, 500 câu chưa gặp, 5000 attempts owned/6ref và 5000 gap câu cũ khác',coChiMuc,truoc,taoChiMucMs,plan},null,2))
})

it('cây Tick bài đọc số em/hạn của Gói7 hiện hành, kể cả 0 em; không suy từ chiến dịch cũ',async()=>{
  const k=await kho()
  const tree=async()=>((await gvBaiDaDay(k.env,{action:'danh-sach',lop:'12A1'},NOW)).bai as Row[])[0]!
  expect(await tree()).toMatchObject({hanNop:'2026-10-20',conNgay:7,trangThai:'dang_luyen',goi7:{goiId:ID,soEm:5,han:'2026-10-20'}})
  expect(await sua(k.env,[],['S1','S2','S3','S4','S5'])).toMatchObject({ok:true,nhan:[]})
  expect(await gvGoi7(k.env,{action:'sua_han',goiId:ID,hanCu:'2026-10-20',han:'2026-10-25'})).toMatchObject({ok:true})
  expect(await tree()).toMatchObject({hanNop:'2026-10-25',conNgay:12,goi7:{goiId:ID,soEm:0,han:'2026-10-25'}})
})

it('gói đang nhận cấp QID bản mới không bị bản cũ của gói đã bỏ tick làm mất readiness',async()=>{
  const k=await kho()
  k.d.sql.exec(`UPDATE bai_da_day SET bo_tick_luc='x' WHERE id='tick';
    INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('tick2','12A1','B2','Bài 2',2,'["DH-B1"]','2026-10-14T00:00:00Z');
    INSERT INTO goi_bai_7(id,tick_id,lop,khoa_bai,ten,bat_dau,han,tao_luc) VALUES('g2','tick2','12A1','B2','Bài 2','2026-10-14','2026-10-20','x');
    INSERT INTO goi_bai_7_em(goi_id,sbd,bat_dau,han) VALUES('g2','S2','2026-10-14','2026-10-20');
    INSERT INTO goi_bai_7_cau SELECT 'g2',qid,'v2',ma_de,json_set(meta_json,'$.version','v2') FROM goi_bai_7_cau WHERE goi_id='g7:tick';
    UPDATE game_v2_question SET version='v2',json=json_set(json,'$.version','v2') WHERE ma_de='DH-B1';`)
  expect(await docChanCauMoiGoi7(k.env,'S2')).toEqual(new Set())
  const p=await lapGoi7(k.env,'S2',NOW)
  expect(p?.hs.cau.filter(c=>k.qids('DH-B1').includes(c.qid)).length).toBe(18)
})
