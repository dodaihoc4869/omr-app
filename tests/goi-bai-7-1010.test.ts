// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { taoKhoOmni, themChienDich, lam } from './omni-3-ke-hoach-chung'
import { dongBoGoi7, docGoiCuaEm7, startGoi7, gapHuongDan7, lapGoi7, homNayGoi7 } from '../server/src/goi-bai-7'
import { chonGoi7, quotaGoi7, diemGoi7, diemTo7, lyDoChua7, diemConDungNguon7, type CauGoi7 } from '../server/src/goi-bai-7-loi'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { xoaDemChienDich } from '../server/src/srs2-d1'
import { xoaDemCaBaoVe } from '../server/src/game-v2-bank'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { kiemGoi7 } from '../server/src/goi-bai-7-kiem'
import { gvGoi7 } from '../server/src/goi-bai-7-thay'
import { type PrivateQuestion } from '../src/game/than-thu-v2/core'
import { khopPhanIII } from '../src/lib/cham-so'
import { SQL_GOI7 } from '../server/src/goi-bai-7-schema'
import { BANG_GIU } from '../server/src/reset-toan-app'
import { BANG_GIU_HOA2 } from '../server/src/reset-hoa2'

const NOW=Date.parse('2026-10-10T02:00:00Z')
beforeEach(()=>{vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(NOW)})
afterEach(()=>{vi.useRealTimers();xoaDemPhamVi();xoaDemChienDich();xoaDemCaBaoVe()})
async function kho(n=127){
  const k=taoKhoOmni({'DH-B1':n})
  await damBaoBangBaiDaDay(k.env)
  k.d.sql.exec(`INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('DH-B1','Bài mới',${n},0,'v1');INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x');
    INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('goi_bai_7_v1','{"bat":true,"batDau":"2026-10-10"}','x')`)
  const tick=k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  tick.run('old','12A1','B0','Bài trước',0,'["DH-B0"]','2026-10-01T00:00:00Z')
  tick.run('latest','12A1','B1','Bài mới',1,'["DH-B1-TN","DH-B1-DS","DH-B1-TLN"]','2026-10-09T18:30:00Z')
  k.d.sql.prepare("UPDATE hoc_sinh SET mat_khau='gia' WHERE sbd='S1'").run()
  themChienDich(k.d,{id:'hanh-trinh-v3-khoi-12',qids:k.qids('DH-B1'),maDe:['DH-B1'],sbd:['S1','S2','S3'],hanNop:'9999-12-31',taoLuc:'2026-10-01T00:00:00Z',theLuc:24,huyetChien:false})
  await dongBoGoi7(k.env,NOW)
  return {...k,token:await gameToken(k.env,'S1')}
}
it('127 câu được phủ trong 7 ngày, kể cả ngày nghỉ; hết hạn vẫn giữ nợ câu',()=>{
  let con=127,total=0
  for(let d=0;d<7;d++){const quota=quotaGoi7(con,`2026-10-${10+d}`,'2026-10-16');con-=quota;total+=quota}
  expect(total).toBe(127);expect(con).toBe(0)
  expect(quotaGoi7(127,'2026-10-11','2026-10-16')).toBe(22)
  expect(quotaGoi7(40,'2026-10-17','2026-10-16')).toBe(40)
})
it('học sinh yếu gặp câu khó có hỗ trợ; giữ quota phủ câu dù dành chỗ ôn/sửa',()=>{
  const cau=Array.from({length:30},(_,i)=>({qid:`q${i}`,group:`g${i}`,maDe:'x',version:'v1',phan:'I',kho:i>=10,tinhToan:false,kyNang:['a']} as CauGoi7))
  const plan=chonGoi7({cau,daGap:new Set(),daLamNgay:new Set(),quotaCon:19,sanSang:new Set(cau.slice(0,10).map(c=>c.qid).concat(['sai','cu'])),chan:new Set(),sua:['sai'],on:['cu'],mucTieuNgay:24})
  expect(plan.viec.filter(v=>['moi','tiep_can'].includes(v.vai))).toHaveLength(22)
  expect(plan.tiepCan).toBe(12);expect(plan.viec.some(v=>v.qid==='sai')).toBe(true)
  const blocked=chonGoi7({cau,daGap:new Set(),daLamNgay:new Set(),quotaCon:30,sanSang:new Set(),chan:new Set(['g0']),sua:[],on:[]})
  expect(blocked.thieuPhu).toBe(1);expect(blocked.viec).not.toContainEqual(expect.objectContaining({qid:'q0'}))
})
it('chỉ bài gần nhất mỗi lớp chuyển chu kỳ, đủ 3 dạng; giữ học sinh khác lớp ngoài gói',async()=>{
  const k=await kho()
  const gs=await docGoiCuaEm7(k.env,'S1',NOW)
  expect(gs).toHaveLength(1);expect(gs[0]).toMatchObject({id:'g7:latest',batDau:'2026-10-10',han:'2026-10-16',quota:19})
  expect(gs[0]!.cau).toHaveLength(127);expect(new Set(gs[0]!.cau.map(q=>q.phan))).toEqual(new Set(['I','II','III']))
  k.d.sql.prepare("UPDATE hoc_sinh SET lop='11A1' WHERE sbd='S3'").run()
  expect(await docGoiCuaEm7(k.env,'S3',NOW)).toEqual([])
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:0})
})
it('giữ câu đã nộp và lịch sử; ôn lại câu cũ hôm nay không ăn quota gặp câu mới',async()=>{
  const k=await kho(35),qid=k.qids('DH-B1')[0]!
  await lam(k.env,'S1',qid,NOW-86400000,true,{cauVersion:'v1'})
  await lam(k.env,'S1',qid,NOW,true,{cauVersion:'v1'})
  const g=(await docGoiCuaEm7(k.env,'S1',NOW))[0]!
  expect(g.daGap.size).toBe(1);expect(g.gapNgay.size).toBe(0);expect(g.quota).toBe(5)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:2})
})
it('phiên đang làm dở giữ nháp tham chiếu, chỉ trả câu chưa nộp; không lộ đáp án',async()=>{
  const k=await kho(28),r=await startGoi7(k.env,'S1',NOW),qs=r!.questions as PrivateQuestion[]
  expect(qs.length).toBeGreaterThan(0);expect(qs.length).toBeLessThanOrEqual(6)
  expect(qs[0]).not.toHaveProperty('correct');expect(qs[0]).not.toHaveProperty('solution')
  const q=qs[0]!,answer=q.phan==='I'?'B':q.phan==='II'?'DSDS':'4'
  await gameV2(k.env,'answer',{token:k.token,session:r!.id,qid:q.qid,answer,msLam:20000})
  const next=await startGoi7(k.env,'S1',NOW)
  expect(next!.id).toBe(r!.id);expect((next!.questions as PrivateQuestion[]).map(q=>q.qid)).not.toContain(q.qid)
  expect(k.d.sql.prepare('SELECT qid FROM loi_giai_hoi WHERE sbd=? AND qid=?').get('S1',q.qid)).toMatchObject({qid:q.qid})
})
it('xem chữa ghi đã gặp có hỗ trợ, không ghi đúng/sai; chống truy cập chéo và nộp giả tự làm',async()=>{
  const k=await kho(25),r=await startGoi7(k.env,'S1',NOW),q=(r!.questions as PrivateQuestion[])[0]!
  await expect(gapHuongDan7(k.env,'S2',{session:r!.id,qid:q.qid,chuaTuLam:true},NOW)).rejects.toThrow()
  const g=await gapHuongDan7(k.env,'S1',{session:r!.id,qid:q.qid,chuaTuLam:true},NOW)
  expect(g.hocCoHoTro).toBe(true)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:0})
  expect((await docGoiCuaEm7(k.env,'S1',NOW))[0]!.daGap.has(q.qid)).toBe(true)
  await gameV2(k.env,'answer',{token:k.token,session:r!.id,qid:q.qid,answer:g.answer,assisted:false,msLam:20000})
  expect(k.d.sql.prepare('SELECT assistance FROM su_kien_hoc WHERE qid=?').get(q.qid)).toMatchObject({assistance:'assisted'})
})
it('chưa có lời giải vẫn được gặp câu; thầy chữa xong tự giao lại và sau 12 giờ mới tự kiểm',async()=>{
  const k=await kho(25),r=await startGoi7(k.env,'S1',NOW),q=(r!.questions as PrivateQuestion[])[0]!
  const row=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(q.qid) as {json:string},src=JSON.parse(row.json)
  src.solution=null;k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify(src),q.qid)
  const pending=await gapHuongDan7(k.env,'S1',{session:r!.id,qid:q.qid,chuaTuLam:true},NOW)
  expect(pending).toMatchObject({choThay:true});expect(pending).not.toHaveProperty('answer')
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:0})
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM loi_giai_hoi').get()).toMatchObject({n:0})
  expect((await docGoiCuaEm7(k.env,'S1',NOW))[0]!.choThay.has(q.qid)).toBe(true)
  await gvGoi7(k.env,{action:'chua',goiId:'g7:latest',qid:q.qid,version:q.version,loiGo:'Thầy giải thích từng bước để em hiểu cách làm.'})
  const tomorrow=NOW+86400000;vi.setSystemTime(tomorrow)
  const lap=await lapGoi7(k.env,'S1',tomorrow)
  expect(lap!.plan.viec).toContainEqual({qid:q.qid,vai:'chua',huongDan:true})
  const next=await startGoi7(k.env,'S1',tomorrow)
  expect((next!.questions as PrivateQuestion[]).map(q=>q.qid)).toContain(q.qid)
  const guide=await gapHuongDan7(k.env,'S1',{session:next!.id,qid:q.qid,chuaTuLam:true},tomorrow)
  expect(guide).toMatchObject({hocCoHoTro:true});expect((await docGoiCuaEm7(k.env,'S1',tomorrow))[0]!.choThay.has(q.qid)).toBe(false)
  expect((await lapGoi7(k.env,'S1',tomorrow+60000))!.plan.viec.map(v=>v.qid)).not.toContain(q.qid)
  const later=await lapGoi7(k.env,'S1',tomorrow+86400000)
  expect(later!.plan.viec).toContainEqual({qid:q.qid,vai:'on',huongDan:false})
})
it('nguồn R2 mới tự dựng chỉ mục và nhận đúng câu gốc, không cần mở game cũ',async()=>{
  const k=await kho(12),qid=k.qids('DH-B1')[0]!
  k.d.objects.set('kho/DH-B1.json',{phanI:[{id:qid,text:'Nguồn mới của thầy',choices:['a','b','c','d'],correct:'B',explanation:'Chữa rõ cách làm.'}],phanII:[],phanIII:[]})
  k.d.sql.exec("DELETE FROM game_v2_index WHERE ma_de='DH-B1';DELETE FROM goi_bai_7_cau WHERE goi_id='g7:latest'")
  await dongBoGoi7(k.env,NOW+21000,100,'',true)
  const gs=await docGoiCuaEm7(k.env,'S1',NOW+21000)
  expect(gs[0]!.cau).toHaveLength(1);expect(gs[0]!.cau[0]!.qid).toBe(qid);expect(gs[0]!.cau[0]!.version).toMatch(/^[a-f0-9]{32}$/)
  expect(k.d.sql.prepare("SELECT source_version FROM game_v2_index WHERE ma_de='DH-B1'").get()).toMatchObject({source_version:'v1'})
})
it('thiếu một tờ không nhận phần còn lại là cả bài; hồi phục đủ nguồn rồi giữ lịch sử cũ',async()=>{
  const k=await kho(12),qid=k.qids('DH-B1')[0]!
  await lam(k.env,'S1',qid,NOW,true,{cauVersion:'v1'})
  k.d.sql.prepare("UPDATE bai_da_day SET ma_to_json=? WHERE id='latest'").run('["DH-B1-TN","DH-B1-DS","DH-B1-TLN","DH-B2-TN"]')
  k.d.sql.exec("INSERT INTO de_kho(ma_de,ten_de,da_xoa,cap_nhat_luc) VALUES('DH-B2','Tờ thêm',0,'v1')")
  await dongBoGoi7(k.env,NOW+21000,100,'',true)
  const gs=await docGoiCuaEm7(k.env,'S1',NOW+21000)
  expect(gs[0]!.nguonDayDu).toBe(false);expect(gs[0]!.cau.every(q=>q.hopLe===false)).toBe(true)
  expect((await lapGoi7(k.env,'S1',NOW+21000))!.plan.viec.some(v=>k.qids('DH-B1').includes(v.qid))).toBe(false)
  await expect(kiemGoi7(k.env,'S1','hoc-tap-kiem-start',{goiId:'g7:latest',maDe:'DH-B1-TN'},NOW+21000)).rejects.toThrow(/chưa đủ nguồn/)
  k.d.objects.set('kho/DH-B2.json',{phanI:[{id:'DH-B2-0',text:'Tờ vừa bổ sung',choices:['a','b','c','d'],correct:'B',explanation:'Chữa rõ cách làm.'}],phanII:[],phanIII:[]})
  await dongBoGoi7(k.env,NOW+42000,100,'',true)
  const healed=(await docGoiCuaEm7(k.env,'S1',NOW+42000))[0]!
  expect(healed.nguonDayDu).toBe(true);expect(healed.cau).toHaveLength(13);expect(healed.daGap.has(qid)).toBe(true)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:1})
})
it('làm lại lỗi dùng bản khác thật, giữ hoán vị máy chủ qua lần mở lại và chấm đúng',async()=>{
  const k=await kho(1),qid=k.qids('DH-B1')[0]!
  await lam(k.env,'S1',qid,NOW-2*86400000,false,{cauVersion:'v1'})
  const r=await startGoi7(k.env,'S1',NOW),qs=r!.questions as PrivateQuestion[]
  const saved=k.d.sql.prepare('SELECT json FROM game_v2_session WHERE id=?').get(r!.id as string) as {json:string}
  const ref=JSON.parse(saved.json).questions.find((r:{qid:string})=>r.qid===qid)
  expect(ref.vai).toBe('sua');expect(ref.xt).toEqual(expect.any(Array))
  const again=await startGoi7(k.env,'S1',NOW+1000)
  expect((again!.questions as PrivateQuestion[]).find(q=>q.qid===qid)!.choices).toEqual(qs.find(q=>q.qid===qid)!.choices)
  const answer='ABCD'[ref.xt.indexOf(1)]
  const graded=await gameV2(k.env,'answer',{token:k.token,session:r!.id,qid,answer,msLam:20000})
  expect(graded.correct).toBe(true)
  expect(JSON.parse((k.d.sql.prepare('SELECT raw_json FROM su_kien_hoc WHERE qid=? ORDER BY received_at DESC LIMIT 1').get(qid) as {raw_json:string}).raw_json)).toMatchObject({chon:'B',xt:1})
})
it('bổ sung/sửa nguồn hồi phục gói rỗng và phiên bản mới không nhận nhầm bằng chứng cũ',async()=>{
  const k=await kho(12),qid=k.qids('DH-B1')[0]!
  await lam(k.env,'S1',qid,NOW,true,{cauVersion:'v1'})
  const row=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(qid) as {json:string}
  const q=JSON.parse(row.json);q.version='v2';k.d.sql.prepare('UPDATE game_v2_question SET version=?,json=? WHERE qid=?').run('v2',JSON.stringify(q),qid)
  await dongBoGoi7(k.env,NOW+21000)
  expect((await docGoiCuaEm7(k.env,'S1',NOW+21000))[0]!.daGap.has(qid)).toBe(false)
  k.d.sql.prepare("UPDATE bai_da_day SET bo_tick_luc='x' WHERE id='latest'").run()
  expect(await docGoiCuaEm7(k.env,'S1',NOW)).toEqual([])
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:1})
})
it('ca đang mở không tạo mới hoặc phân lại gói',async()=>{
  const k=await kho(10)
  k.d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,bat_dau,het_han_vao,thoi_gian_phut,loai,cong_bo,bank_r2,cap_nhat_luc) VALUES('MO','Ca','mo','x','x',45,'thi','khong','de/x','x')").run()
  const r=await dongBoGoi7(k.env,NOW+30000)
  expect(r.hoan).toBe(true);expect(r.soGoi).toBe(0)
})
it('tự kiểm đủ cả tờ, không lộ đáp án, chấm số/đúng sai đúng luật và gửi lại không đổi điểm',async()=>{
  const k=await kho(15)
  let total=0
  for(const maDe of ['DH-B1-TN','DH-B1-DS','DH-B1-TLN']){
    const r=await kiemGoi7(k.env,'S1','hoc-tap-kiem-start',{goiId:'g7:latest',maDe},NOW)
    expect((r.questions as PrivateQuestion[])[0]).not.toHaveProperty('correct')
    const saved=k.d.sql.prepare('SELECT json FROM goi_bai_7_kiem WHERE id=?').get(r.id as string) as {json:string}
    const qs=JSON.parse(saved.json).cau as {q:PrivateQuestion}[]
    const tra=Object.fromEntries(qs.map(({q})=>[q.qid,q.phan==='III'?`${q.correct}.0`:q.correct]))
    const result=await kiemGoi7(k.env,'S1','hoc-tap-kiem-nop',{goiId:'g7:latest',id:r.id,tra},NOW+20000)
    expect(result.diem).toBe(10);expect(result.cauMoi).toBe(0);total+=Number(result.tong)
    const resend=await kiemGoi7(k.env,'S1','hoc-tap-kiem-nop',{goiId:'g7:latest',id:r.id,tra:{}},NOW+30000)
    expect(resend.diem).toBe(10)
    await expect(kiemGoi7(k.env,'S2','hoc-tap-kiem-nop',{goiId:'g7:latest',id:r.id,tra},NOW)).rejects.toThrow()
  }
  expect(total).toBe(15);expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:15})
})
it('xem lời giải trước hoặc trong bài tự kiểm bị chặn; không đóng giả mốc 7 điểm',async()=>{
  const k=await kho(8),r=await kiemGoi7(k.env,'S1','hoc-tap-kiem-start',{goiId:'g7:latest',maDe:'DH-B1-TN'},NOW)
  k.d.sql.prepare('INSERT INTO loi_giai_hoi(sbd,qid,luc) VALUES(?,?,?)').run('S1',k.qids('DH-B1')[0]!,new Date(NOW+1000).toISOString())
  await expect(kiemGoi7(k.env,'S1','hoc-tap-kiem-nop',{goiId:'g7:latest',id:r.id,tra:{}},NOW+2000)).rejects.toThrow(/12 giờ/)
  expect(k.d.sql.prepare('SELECT nop_luc FROM goi_bai_7_kiem WHERE id=?').get(r.id as string)).toMatchObject({nop_luc:null})
  k.d.sql.prepare('UPDATE loi_giai_hoi SET luc=?').run('2026-10-10 01:00:00')
  await expect(kiemGoi7(k.env,'S1','hoc-tap-kiem-start',{goiId:'g7:latest',maDe:'DH-B1-TN'},NOW)).rejects.toThrow(/12 giờ/)
})
it('bảng giáo viên đưa mọi câu khó/tính toán lên trước, tỷ lệ sai dùng lần tự làm đầu',async()=>{
  const k=await kho(28),qid=k.qids('DH-B1')[0]!
  for(let i=0;i<8;i++)await lam(k.env,'S1',qid,NOW+i,false,{cauVersion:'v1'})
  const r=await gvGoi7(k.env,{goiId:'g7:latest'})
  const cs=r.cau as (CauGoi7&{lyDo:string[];daDo:number;sai:number})[]
  expect(cs).toHaveLength(28);expect(cs.find(c=>c.qid===qid)).toMatchObject({daDo:1,sai:1})
  expect(cs.filter(c=>c.tinhToan).every(c=>c.lyDo.includes('Có tính toán'))).toBe(true)
  expect(lyDoChua7(cs[0]!,1,1)).not.toContain('Nhiều học sinh sai')
})
it('kiến thức cũ chưa gắn ma trận vẫn tính chưa đạt, không thu hẹp mẫu số để đủ 80%',async()=>{
  const k=await kho(12),lap=await lapGoi7(k.env,'S1',NOW)
  expect(lap!.kienThucCu).toMatchObject({tong:3,dat:0,tyLe:0})
})
it('nhiều đợt học có hỗ trợ vẫn dừng ở mức ngày, không giao thêm vô hạn sau khi đã học',async()=>{
  const k=await kho(127)
  // Chứng từ đọc chữa là học có hỗ trợ; không cần tạo kết quả đúng giả.
  for(const qid of k.qids('DH-B1').slice(0,24))k.d.sql.prepare('INSERT INTO goi_bai_7_gap(receipt,goi_id,sbd,qid,version,kieu,luc) VALUES(?,?,?,?,?,?,?)').run(`g-${qid}`,'g7:latest','S1',qid,'v1','co_ho_tro',new Date(NOW).toISOString())
  const lap=await lapGoi7(k.env,'S1',NOW)
  expect(lap!.daLamNgay).toBe(24);expect(lap!.plan.viec).toHaveLength(0)
  expect((await docGoiCuaEm7(k.env,'S1',NOW))[0]!.gapNgay.size).toBe(24)
  const goi=await docGoiCuaEm7(k.env,'S1',NOW)
  expect(homNayGoi7(goi)).toEqual({tong:24,daLam:24})
  expect(homNayGoi7([...goi,...goi])).toEqual({tong:24,daLam:24})
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc').get()).toMatchObject({n:0})
})
it('chuyển trong cùng ngày chỉ lấy bài mới nhất; tick sau giờ chuyển vẫn tự nhận gói riêng',async()=>{
  const k=await kho(12)
  k.d.sql.prepare("UPDATE cau_hinh SET gia_tri=? WHERE khoa='goi_bai_7_v1'").run(JSON.stringify({bat:true,batDau:'2026-10-10',batLuc:new Date(NOW).toISOString()}))
  const st=k.d.sql.prepare('INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES(?,?,?,?,?,?,?)')
  st.run('same-day','12A1','before','Bài sáng sớm',0,'["DH-B0"]','2026-10-09T17:10:00Z')
  await dongBoGoi7(k.env,NOW+21000,10,'12A1')
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7 WHERE tick_id='same-day'").get()).toMatchObject({n:0})
  st.run('new','12A1','after','Bài mới thêm',3,'["DH-B1"]',new Date(NOW+30000).toISOString())
  await dongBoGoi7(k.env,NOW+45000,10,'12A1')
  expect(k.d.sql.prepare("SELECT COUNT(*) n FROM goi_bai_7 WHERE tick_id='new'").get()).toMatchObject({n:1})
})
it('gói rỗng tự hồi phục khi chỉ mục có lại; đọc báo cáo không ghi quota thay học sinh',async()=>{
  const k=await kho(12)
  k.d.sql.exec("DELETE FROM goi_bai_7_cau;DELETE FROM goi_bai_7_ngay;DELETE FROM game_v2_index")
  await dongBoGoi7(k.env,NOW+21000)
  expect((await docGoiCuaEm7(k.env,'S1',NOW,true))[0]!.cau).toHaveLength(0)
  expect(k.d.sql.prepare('SELECT COUNT(*) n FROM goi_bai_7_ngay').get()).toMatchObject({n:0})
  k.d.sql.exec("INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('DH-B1','v1','x')")
  await dongBoGoi7(k.env,NOW+45000)
  expect((await docGoiCuaEm7(k.env,'S1',NOW,true))[0]!.cau).toHaveLength(12)
})
it('thang điểm đúng-sai phi tuyến và trả lời ngắn dùng chấm số chung; schema chỉ thêm được giữ khi reset',()=>{
  expect(diemGoi7('II','DDSS','DSDS',false)).toBe(.25)
  expect(diemGoi7('III','4.0','4',khopPhanIII('4.0','4'))).toBe(.25)
  expect(diemTo7(.5,1)).toBe(5)
  for(const sql of SQL_GOI7)expect(sql).toMatch(/^CREATE (TABLE|INDEX) IF NOT EXISTS /)
  for(const sql of SQL_GOI7.filter(s=>s.startsWith('CREATE TABLE'))){const name=/EXISTS (\w+)/.exec(sql)![1]!;expect(BANG_GIU).toContain(name);expect(BANG_GIU_HOA2).toContain(name)}
})
it('mỗi gói giữ quota riêng khi nhiều bài cùng chạy; câu chung không tạo thiếu hụt giả',()=>{
  const cau=Array.from({length:8},(_,i)=>({qid:`q${i}`,maDe:'x',version:'v1',group:`g${i}`,phan:'I',kho:false,tinhToan:false,kyNang:['x']} as CauGoi7))
  const a={cau,daGap:new Set<string>(),daLamNgay:new Set<string>(),quotaCon:6,sanSang:new Set(cau.map(q=>q.qid)),chan:new Set<string>(),sua:[],on:[],mucTieuNgay:0,trongSo:{q0:100,q1:99,q2:98,q3:97}}
  const ds=chonGoi7({...a,nhomPhu:[{qids:['q0','q1','q2','q3'],quota:3},{qids:['q4','q5','q6','q7'],quota:3}]})
  expect(ds.viec.filter(q=>['q4','q5','q6','q7'].includes(q.qid))).toHaveLength(3)
  const chung=chonGoi7({...a,nhomPhu:[{qids:['q0','q1','q2'],quota:3},{qids:['q0','q1','q2'],quota:3}]})
  expect(chung.viec).toHaveLength(3);expect(chung.thieuPhu).toBe(0)
})
it('điểm bản cũ không xác nhận tờ vừa thêm/sửa câu và không nhận bản đo lặp một câu',()=>{
  const q={qid:'q',maDe:'d',version:'v1',group:'g',phan:'I',kho:false,tinhToan:false,kyNang:[]} as CauGoi7
  const snapshot=[{goc:{qid:'q',maDe:'d',version:'v1'}}]
  expect(diemConDungNguon7(snapshot,[q])).toBe(true)
  expect(diemConDungNguon7(snapshot,[{...q,version:'v2'}])).toBe(false)
  expect(diemConDungNguon7(snapshot,[q,{...q,qid:'q2'}])).toBe(false)
  expect(diemConDungNguon7([...snapshot,...snapshot],[q,{...q,qid:'q2'}])).toBe(false)
})
