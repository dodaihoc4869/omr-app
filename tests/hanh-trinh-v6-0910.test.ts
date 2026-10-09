// @vitest-environment node
import {afterEach,describe,expect,it} from 'vitest'
import {quyenCau,timUngVienToanKho,phanBoV6} from '../server/src/hanh-trinh-v6-loi'
import {fitV6,pDoKhoV6,featuresV6,vuotCongV6,type MauV6} from '../server/src/hanh-trinh-v6-mo-hinh'
import {xepDeV6} from '../server/src/hanh-trinh-v6-de-thu'
import {ghiDoV6,hocV6Dem,lenhChonV6} from '../server/src/hanh-trinh-v6-d1'
import {chonBandit} from '../server/src/bandit'
import {docHoSo2,layKeHoachHomNay,xoaDemChienDich} from '../server/src/srs2-d1'
import {dongBoBaHanhTrinh,ungVienHanhTrinh} from '../server/src/hanh-trinh-hop-nhat'
import {boSungV6} from '../server/src/hanh-trinh-v6-kho'
import {lapChotHanhTrinh} from '../server/src/hanh-trinh-d1'
import {sqlKetQuaV6,sqlNguonV6} from '../server/src/hanh-trinh-v6-d1'
import {ghiSuKien} from '../server/src/su-kien-hoc'
import {dongCoHanhTrinh} from '../server/src/hanh-trinh-dong-co'
import {phatLaiEm} from '../server/src/omni-p-vkn'
import {xoaDemOmni} from '../server/src/omni-d1'
import {taoKhoOmni,themChienDich,lam,T_SANG,HOM_NAY} from './omni-3-ke-hoach-chung'
import type {QCau} from '../server/src/omni-kieu'
import type {MucKyNang} from '../server/src/hanh-trinh-v5-loi'
import type {QuanSatHanhTrinh} from '../server/src/hanh-trinh-quan-sat'
const DAY=86400000
const q=(qid='q',mucDo='VD'):QCau=>({qid,phan:'I',maDang:'ESTER.a',mucDo,vkn:['dang:ESTER.a'],nguon:'thay',contentGroup:qid})
const empty=()=>phatLaiEm('S',{suKien:[],q:new Map(),beta:new Map(),homNay:HOM_NAY})
afterEach(()=>{xoaDemOmni();xoaDemChienDich()})
function kho(n=120){const k=taoKhoOmni({'DH-B0':0,'DH-B1':n,'DH-B2':0,'DH-B3':0,'KHO-A':0});for(const id of k.qids('DH-B1')){const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(id) as {json:string};k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),lop:'12',mucDo:'NB',sao:0}),id)}themChienDich(k.d,{id:'CD',maDe:['DH-B1'],qids:k.qids('DH-B1'),sbd:['S1','S2','S3'],hanNop:'2026-10-30',taoLuc:new Date(T_SANG-DAY).toISOString()});return k}
describe('Hành trình v6: cổng và ngân sách',()=>{
 it('chưa đo được thử chẩn đoán; đã yếu phải sửa; không mở quyền học bằng chẩn đoán',()=>{
   expect(quyenCau(q(),3,new Map(),empty(),null).quyen).toBe('chan_doan')
   const m=new Map([['dang:ESTER.a@L1',{vkn:'dang:ESTER.a',tang:1,trangThai:'chua_vung'} as MucKyNang]])
   expect(quyenCau(q(),3,m,empty(),null).quyen).toBe('sua_nen')
   expect(quyenCau(q('x','NB'),1,m,empty(),null).quyen).toBe('hoc')
 })
 it('nền cần dạy lại và câu tổng hợp nhiều đích không được mở qua nhánh chưa đo',()=>{
   const hs=empty();hs.vkn['nen:mol']={trangThai:'vung',dayLai:true} as never
   expect(quyenCau({...q(),vkn:['nen:mol','dang:ESTER.a']},3,new Map(),hs,null).quyen).toBe('sua_nen')
   expect(quyenCau({...q(),vkn:['dang:a','dang:b','dang:c']},4,new Map(),empty(),null).quyen).toBe('sua_nen')
 })
 it('quét hết danh mục lớn, lấy nền mở đường ở cuối và giữ câu đang làm',()=>{
   const ds=Array.from({length:15000},(_,i)=>({qid:String(i),q:{...q(String(i),'NB'),vkn:[`dang:k${i}`]},tang:1,nhan:null}))
   ds.push({qid:'hard',q:{...q('hard'),vkn:['dang:k14999']},tang:3,nhan:null})
   const ids=timUngVienToanKho(ds,new Map(),['old'],'2026-10-09','S');expect(ids).toContain('14999');expect(ids).toContain('old');expect(ids.length).toBeLessThanOrEqual(385)
 })
 it('câu mới/ôn/sửa cùng một tổng; nợ nặng đổi phân bổ, không cộng bonus',()=>{
   for(const n of [0,1,6,24,30,36]){const x=phanBoV6(n,3,100,100);expect(x.moi+x.on+x.sua).toBe(n);expect(x.chanDoan).toBeLessThanOrEqual(2)}
   expect(phanBoV6(36,3,30,10).sua).toBeGreaterThan(phanBoV6(36,3,2,10).sua)
 })
})
describe('Hành trình v6: học và kiểm dự đoán',()=>{
 it('không có mẫu/hold-out thì dùng dự đoán cũ; không tự tuyên bố đã học tốt hơn',()=>{
   const m=fitV6([]);expect(pDoKhoV6(m,'q','12',3,'I',0.7)).toBeCloseTo(0.7);expect(m.hocTot).toBe(false)
   expect(vuotCongV6({S:{sum:100,n:1000}})).toBe(false)
 })
 it('độ khó học từ p trước và đáp án về sau; giữ học sinh hold-out riêng',()=>{
   const ds:MauV6[]=Array.from({length:2000},(_,i)=>({sbd:`S${i%100}`,qid:'hard',lop:'12',tang:3,phan:'I',p:0.9,y:0,luc:i,features:featuresV6(0.9,0.1,0,0,false,true,0),transfer:null,prop:0}))
   const m=fitV6(ds);expect(m.cau.hard!.b).toBeGreaterThan(0);expect(m.cau.hard!.tot).toBe(true);expect(pDoKhoV6(m,'hard','12',3,'I',0.9)).toBeLessThan(0.9);expect(m.nHoc).toBe(0)
 })
 it('không có propensity thật thì không dùng nhãn tương lai để fit chọn câu',()=>{
   const ds:MauV6[]=Array.from({length:200},(_,i)=>({sbd:`S${i}`,qid:'q',lop:'12',tang:2,phan:'I',p:0.5,y:1,luc:i,features:featuresV6(0.5,0.5,0,0,true,true,0),transfer:1,prop:0}))
   expect(fitV6(ds).nHoc).toBe(0)
 })
 it('đề kiểm xếp cùng chu kỳ mức độ; không có tham số năng lực hoặc nhóm A/B',()=>{
   const ds=Array.from({length:80},(_,i)=>({qid:`q${i}`,phan:'I',mucDo:['NB','TH','VD','VDC'][i%4]!,sao:0}))
   const a=xepDeV6(ds,'a',null),b=xepDeV6(ds,'b',null)
   expect(a.slice(0,12).map(c=>c.mucDo)).toEqual(b.slice(0,12).map(c=>c.mucDo));expect(new Set(a.map(c=>c.qid)).size).toBe(80)
 })
 it('bandit ghi xác suất đúng với phép lấy mẫu categorical và có xác suất khám phá',()=>{
   const c=chonBandit('x',['on_nen','vi_du_de'],[],()=>0.5);expect(c).not.toBeNull();expect(c!.xacSuat).toBeGreaterThanOrEqual(0.05);expect(c!.xacSuat).toBeLessThanOrEqual(0.95+1e-12)
 })
})
describe('Hành trình v6: D1 thật',()=>{
 it('tìm đúng nền ngoài cửa sổ cũ, vẫn không thêm câu ngoài chiến dịch',async()=>{
   const k=kho(350);await dongBoBaHanhTrinh(k.env,T_SANG)
   const row=k.d.sql.prepare("SELECT * FROM chien_dich WHERE id='hanh-trinh-v3-khoi-12'").get() as {qid_json:string}
   const old=await ungVienHanhTrinh(k.env,'hanh-trinh-v3-khoi-12','S1',HOM_NAY,JSON.parse(row.qid_json))
   const rare=k.qids('DH-B1').find(id=>!old.includes(id))!,hard=k.qids('DH-B1').find(id=>id!==rare)!
   for(const [id,muc] of [[rare,'NB'],[hard,'VD']]){const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(id!) as {json:string};k.d.sql.prepare('UPDATE game_v2_question SET dang=?,json=? WHERE qid=?').run('ESTER.rare',JSON.stringify({...JSON.parse(r.json),dang:'ESTER.rare',mucDo:muc}),id!)}
   const h=await docHoSo2(k.env,'S1',HOM_NAY);expect(h.cau.map(c=>c.qid)).toContain(rare);expect(h.cau.every(c=>JSON.parse(row.qid_json).includes(c.qid))).toBe(true);expect(h.cau.some(c=>c.qid.endsWith('-TL'))).toBe(false)
   k.d.sql.close()
 })
 it('plan ghi receipt sau CAS, chưa làm không sinh mẫu; đọc lại không nhân mẫu',async()=>{
   const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);const plan=await layKeHoachHomNay(k.env,'S1',T_SANG)
   const receipt=k.d.sql.prepare('SELECT * FROM hanh_trinh_v6_chon ORDER BY qid LIMIT 1').get() as {qid:string;nhom:string}
   expect(receipt).toBeTruthy();expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v6_do').get()).toEqual({n:0})
   await lam(k.env,'S1',receipt.qid,T_SANG+1000,true,{assistance:'none',purpose:'maintenance',raw:{ms:30000},cauVersion:'v1'})
   const h=await docHoSo2(k.env,'S1',HOM_NAY);await dongCoHanhTrinh(k.env,'S1',T_SANG+2000,h);await dongCoHanhTrinh(k.env,'S1',T_SANG+3000,h)
   expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v6_do').get()).toEqual({n:1});expect((await layKeHoachHomNay(k.env,'S1',T_SANG+4000)).kh.hanhTrinh?.toiThieu).toBe(plan.kh.hanhTrinh?.toiThieu)
   const fit=await hocV6Dem(k.env,T_SANG+5000);expect(fit.soMau).toBe(1);k.d.sql.close()
 })
 it('nhãn chuyển giao chỉ khi câu mới 7–14 ngày; câu can thiệp và đọc lời giải không làm phần thưởng',async()=>{
   const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);await layKeHoachHomNay(k.env,'S1',T_SANG)
   const c=k.d.sql.prepare('SELECT * FROM hanh_trinh_v6_chon WHERE prop>0 LIMIT 1').get() as {qid:string;nhom:string;kn_json:string}
   const a:QuanSatHanhTrinh={id:'a',qid:c.qid,version:'v1',nhom:c.nhom,luc:T_SANG+1000,ngay:HOM_NAY,dung:true,kn:JSON.parse(c.kn_json),laY:false,mucDo:'NB',ms:30000,moi:true}
   await ghiDoV6(k.env,'S1',T_SANG+8*DAY,[a,{...a,id:'b',qid:'other',nhom:'other',luc:T_SANG+8*DAY,moi:false}]);expect((k.d.sql.prepare('SELECT transfer FROM hanh_trinh_v6_do').get() as {transfer:unknown}).transfer).toBeNull()
   await ghiDoV6(k.env,'S1',T_SANG+8*DAY,[a,{...a,id:'b',qid:'other',nhom:'other',luc:T_SANG+8*DAY,moi:true}]);expect((k.d.sql.prepare('SELECT transfer FROM hanh_trinh_v6_do').get() as {transfer:unknown}).transfer).toBe(1)
   k.d.sql.close()
 })
 it('chỉ nhận đúng qid và phiên bản đã chấm; câu cùng nhóm hoặc thiếu phiên bản không thành mẫu',async()=>{
   const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);await layKeHoachHomNay(k.env,'S1',T_SANG)
   const c=k.d.sql.prepare('SELECT * FROM hanh_trinh_v6_chon LIMIT 1').get() as {qid:string;nhom:string;kn_json:string}
   const a:QuanSatHanhTrinh={id:'a',qid:c.qid,version:'v1',nhom:c.nhom,luc:T_SANG+1000,ngay:HOM_NAY,dung:true,kn:JSON.parse(c.kn_json),laY:false,mucDo:'NB',ms:30000,moi:true}
   for(const bad of [{...a,qid:'other'},{...a,version:'v2'},{...a,version:null}])await ghiDoV6(k.env,'S1',T_SANG+2000,[bad])
   expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v6_do').get()).toEqual({n:0})
   await ghiDoV6(k.env,'S1',T_SANG+2000,[a]);expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v6_do').get()).toEqual({n:1});k.d.sql.close()
 })
 it('CAS cùng thời điểm không ghi câu ngoài danh sách thắng',async()=>{
   const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);await layKeHoachHomNay(k.env,'S1',T_SANG)
   const z=k.d.sql.prepare('SELECT * FROM hanh_trinh_v5_quyet_dinh LIMIT 1').get() as {moc:number;tao_luc:number;qids_json:string}
   const absent=k.qids('DH-B1').find(id=>!JSON.parse(z.qids_json).includes(id))!
   await lenhChonV6(k.env,'S1',HOM_NAY,z.moc,z.tao_luc,[{qid:absent,version:'v1',nhom:'x',lop:'12',tang:1,phan:'I',kn:[],p:0.5,x:[],prop:0}]).run()
   expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v6_chon WHERE qid=?').get(absent)).toEqual({n:0});k.d.sql.close()
 })
 it('mẫu không khám phá không chiếm phần thưởng câu mới của mẫu có propensity',async()=>{
   const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);await layKeHoachHomNay(k.env,'S1',T_SANG)
   const cs=k.d.sql.prepare('SELECT * FROM hanh_trinh_v6_chon ORDER BY prop LIMIT 2').all() as {qid:string;nhom:string;kn_json:string}[]
   k.d.sql.prepare('UPDATE hanh_trinh_v6_chon SET prop=0').run();k.d.sql.prepare('UPDATE hanh_trinh_v6_chon SET prop=0.5,kn_json=? WHERE qid=?').run(cs[0]!.kn_json,cs[1]!.qid)
   const a:QuanSatHanhTrinh={id:'a',qid:cs[0]!.qid,version:'v1',nhom:cs[0]!.nhom,luc:T_SANG+1000,ngay:HOM_NAY,dung:true,kn:JSON.parse(cs[0]!.kn_json),laY:false,mucDo:'NB',ms:30000,moi:true}
   const b={...a,id:'b',qid:cs[1]!.qid,nhom:cs[1]!.nhom,luc:T_SANG+2000}
   await ghiDoV6(k.env,'S1',T_SANG+8*DAY,[a,b,{...a,id:'later',qid:'new',nhom:'new',luc:T_SANG+8*DAY}])
   expect(k.d.sql.prepare('SELECT transfer FROM hanh_trinh_v6_do WHERE qid=?').get(cs[0]!.qid)).toEqual({transfer:null})
   expect(k.d.sql.prepare('SELECT transfer FROM hanh_trinh_v6_do WHERE qid=?').get(cs[1]!.qid)).toEqual({transfer:1});k.d.sql.close()
 })
 it('toàn kho ưu tiên câu chưa gặp và bỏ câu bảo vệ trước giới hạn 96',()=>{
   const ds=Array.from({length:250},(_,i)=>({qid:String(i),q:q(String(i),'NB'),tang:1,nhan:null}))
   const initial=timUngVienToanKho(ds,new Map(),[],'today','S'),seen=new Set(initial),protectedIds=new Set(ds.filter(c=>!seen.has(c.qid)).slice(0,20).map(c=>c.qid))
   const ids=timUngVienToanKho(ds,new Map(),[],'today','S',seen,protectedIds)
   expect(ids.filter(id=>!seen.has(id)).length).toBe(96);expect(ids.some(id=>protectedIds.has(id))).toBe(false)
 })
 it('fallback thật giữ cổng tự luận, lấy câu hợp lệ ngoài shortlist trước báo thiếu',async()=>{
   const k=kho(350);await dongBoBaHanhTrinh(k.env,T_SANG);const before=await docHoSo2(k.env,'S1',HOM_NAY)
   for(const c of before.cau){const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(c.qid) as {json:string};k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),phan:'III',correct:'C6H12O6'}),c.qid)}
   xoaDemOmni();const h=await docHoSo2(k.env,'S1',HOM_NAY);h.cau=[] // Mô phỏng shortlist cũ không còn câu phục vụ; kho còn câu ở ngoài.
   expect(h.cau.length).toBe(0)
   const plan=await lapChotHanhTrinh(k.env,'S1',HOM_NAY,T_SANG,h,null,new Set())
   expect(plan.tong).toBe(24);expect(plan.dao.every(id=>!before.cau.some(c=>c.qid===id))).toBe(true);expect(h.cau.length).toBeGreaterThanOrEqual(24);k.d.sql.close()
 })
 it('bản sao nhóm đã có không chiếm trần 192 câu fallback',async()=>{
   const k=kho(500);await dongBoBaHanhTrinh(k.env,T_SANG);const h=await docHoSo2(k.env,'S1',HOM_NAY),group=h.meta.get(h.cau[0]!.qid)!.group
   const hidden=k.qids('DH-B1').filter(id=>!h.meta.has(id)).slice(0,216)
   const candidates=hidden.map((qid,i)=>({qid,nhom:i<192?group:`new-${qid}`,moi:true,hoc:true}))
   expect(hidden.length).toBe(216)
   const expanded=await boSungV6(k.env,'S1',HOM_NAY,h,candidates,new Set())
   expect(expanded).not.toBeNull();expect(hidden.slice(192).every(id=>expanded!.cau.some(c=>c.qid===id))).toBe(true);k.d.sql.close()
 })
 it('đổi kế hoạch trong cùng chặng giữ reservation chẩn đoán của phiên cũ',async()=>{
   const k=kho(200);for(const id of k.qids('DH-B1').slice(0,30)){const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(id) as {json:string};k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),mucDo:'VD'}),id)}
   await dongBoBaHanhTrinh(k.env,T_SANG);await layKeHoachHomNay(k.env,'S1',T_SANG)
   const diag=k.d.sql.prepare('SELECT COUNT(DISTINCT nhom) n FROM hanh_trinh_v6_chon WHERE moc=0 AND diagnostic=1').get() as {n:number};expect(diag.n).toBeGreaterThan(0)
   const regular=k.d.sql.prepare('SELECT qid FROM hanh_trinh_v6_chon WHERE diagnostic=0 LIMIT 1').get() as {qid:string}
   await lam(k.env,'S1',regular.qid,T_SANG+1000,false,{cauVersion:'v1'});await layKeHoachHomNay(k.env,'S1',T_SANG+2000)
   expect((k.d.sql.prepare('SELECT COUNT(DISTINCT nhom) n FROM hanh_trinh_v6_chon WHERE moc=0 AND diagnostic=1').get() as {n:number}).n).toBeLessThanOrEqual(2);k.d.sql.close()
 })
 it('raw học sinh không tự khai phiên bản; máy chủ cấp và kết quả chấm lại được đọc mới',async()=>{
   const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);await layKeHoachHomNay(k.env,'S1',T_SANG)
   const c=k.d.sql.prepare('SELECT qid FROM hanh_trinh_v6_chon LIMIT 1').get() as {qid:string}
   await lam(k.env,'S1',c.qid,T_SANG+1000,true,{raw:{ht_cau_version:'fake'},cauVersion:'v1'})
   const event=k.d.sql.prepare('SELECT * FROM su_kien_hoc WHERE qid=?').get(c.qid) as {khoa:string;raw_json:string}
   expect(JSON.parse(event.raw_json).ht_cau_version).toBe('v1')
   const h=await docHoSo2(k.env,'S1',HOM_NAY);await dongCoHanhTrinh(k.env,'S1',T_SANG+2000,h)
   k.d.sql.prepare('UPDATE su_kien_hoc SET ket_qua=0 WHERE khoa=?').run(event.khoa)
   expect(k.d.sql.prepare(`SELECT ${sqlKetQuaV6('d.source_json',true)} y FROM hanh_trinh_v6_do d WHERE ${sqlNguonV6('d.source_json',true)}`).get()).toEqual({y:0})
   await ghiSuKien(k.env,[{nguon:'game',maNguon:'fake',sbd:'S2',qid:c.qid,lan:1,ketQua:1,luc:new Date(T_SANG).toISOString(),raw:{ht_cau_version:'fake'}}])
   expect(JSON.parse((k.d.sql.prepare("SELECT raw_json FROM su_kien_hoc WHERE sbd='S2'").get() as {raw_json:string}).raw_json).ht_cau_version).toBeUndefined();k.d.sql.close()
 })
 it('ca mở không ghi mô hình và không huấn luyện',async()=>{
   const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);await layKeHoachHomNay(k.env,'S1',T_SANG)
   k.d.sql.exec("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('open','mo','x')")
   expect(await hocV6Dem(k.env,T_SANG)).toMatchObject({hoan:true});expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v6_fit').get()).toEqual({n:0});k.d.sql.close()
 })
})
