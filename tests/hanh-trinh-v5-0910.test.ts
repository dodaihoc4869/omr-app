import { xoaDemOmni } from '../server/src/omni-d1'
// @vitest-environment node
import { describe,it,expect,afterEach } from 'vitest'
import { CANH_CHUYEN_DE,kiemDoThiChuyenDe } from '../server/src/hanh-trinh-chuyen-de'
import { dungDoThi } from '../server/src/do-thi-tien-quyet'
import { mucKyNang,daDatMuc,thieuTheoCau,docNhanHanhTrinh,tienDoMuc,giaTriHoc } from '../server/src/hanh-trinh-v5-loi'
import { canBangL4,vaiTroL4 } from '../server/src/hanh-trinh-l4'
import { phanNhom,ghiDeThuDo,chotDiemDau,baoCaoAB,tomTatAB,maTranDo } from '../server/src/hanh-trinh-do-luong'
import { dongCoHanhTrinh } from '../server/src/hanh-trinh-dong-co'
import { boChonV5 } from '../server/src/hanh-trinh-v5-d1'
import { quanSatDocLap,type QuanSatHanhTrinh } from '../server/src/hanh-trinh-quan-sat'
import { phatLaiEm } from '../server/src/omni-p-vkn'
import { docHoSo2,layKeHoachHomNay,xoaDemChienDich } from '../server/src/srs2-d1'
import { dongBoBaHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
import type { QCau,SuKienOmni } from '../server/src/omni-kieu'
import { taoKhoOmni,lam,themChienDich,T_SANG,HOM_NAY } from './omni-3-ke-hoach-chung'
const DAY=86400000,q=(id='q',mucDo='VD',vkn=['dang:ESTER.a']):QCau=>({qid:id,phan:'I',maDang:'ESTER.a',mucDo,vkn,nguon:'thay'})
const o=(i:number,extra:Partial<QuanSatHanhTrinh>={}):QuanSatHanhTrinh=>({id:String(i),qid:String(i),nhom:`g${i}`,luc:T_SANG+i*DAY,ngay:String(i),dung:true,kn:['dang:ESTER.a'],laY:false,mucDo:'VD',ms:30000,...extra})
const hs=()=>phatLaiEm('S',{suKien:[],q:new Map(),homNay:HOM_NAY})
const kho=()=>{const k=taoKhoOmni({'DH-B0':0,'DH-B1':120,'DH-B2':0,'DH-B3':0,'KHO-A':0});const rows=k.d.sql.prepare('SELECT qid,json FROM game_v2_question').all() as {qid:string;json:string}[];for(const r of rows)k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),mucDo:'NB'}),r.qid);themChienDich(k.d,{id:'nguon',sbd:['S1','S2'],maDe:['DH-B1'],qids:k.qids('DH-B1'),taoLuc:'2026-10-01T02:00:00Z',hanNop:'2026-10-09'});return k}
afterEach(()=>{xoaDemChienDich();xoaDemOmni()})
describe('Hành trình v5: tiên quyết từng câu, L4 và phép đo độc lập',()=>{
 it('đồ thị 21 chuyên đề không chu trình; quan hệ hỗ trợ không khóa toàn chương',()=>{expect(kiemDoThiChuyenDe()).toBe(true);expect(CANH_CHUYEN_DE.every(c=>c.loai==='ho_tro')).toBe(true);expect(CANH_CHUYEN_DE).toContainEqual({tu:'DIEN_PHAN',den:'PHUC_CHAT',loai:'ho_tro',nguon:'chuong_trinh_thay'})})
 it('9 câu L3 độc lập chứng minh bậc thấp và mở L4 riêng kỹ năng; không mở mảng khác',()=>{const qs=Array.from({length:10},(_,i)=>o(i)),m=mucKyNang(qs,dungDoThi(qs,T_SANG+20*DAY));expect(daDatMuc('dang:ESTER.a',1,m)).toBe(true);expect(thieuTheoCau(q('q','VDC'),4,m,hs(),null)).toEqual([]);expect(thieuTheoCau(q('b','VDC',['dang:DIEN_PHAN.a']),4,m,hs(),null).length).toBeGreaterThan(0)})
 it('sai mới bậc thấp không được chứng cứ cao cũ che lấp',()=>{const qs=[...Array.from({length:10},(_,i)=>o(i)),o(11,{mucDo:'NB',dung:false}),o(12,{mucDo:'NB',dung:false})],m=mucKyNang(qs,dungDoThi(qs,T_SANG+20*DAY));expect(daDatMuc('dang:ESTER.a',1,m)).toBe(false)})
 it('các ý của một câu chung kỹ năng không giúp đạt SPRT sau vài câu',()=>{const qs=Array.from({length:3},(_,i)=>Array.from({length:4},(_,y)=>o(i,{id:`${i}|${y}`,laY:true}))).flat();const m=mucKyNang(qs,dungDoThi(qs,T_SANG+20*DAY));expect(m.get('dang:ESTER.a@L3')?.soNhom).toBe(3);expect(m.get('dang:ESTER.a@L3')?.trangThai).toBe('chua_du')})
 it('nhãn chuyên gia tách đích mới và tiên quyết; nhãn chưa duyệt/thiếu Q không hợp lệ',()=>{const qc=q('x','TH',['dang:ESTER.a','nen:mol']),raw={kyNangDich:['dang:ESTER.a'],tienQuyet:[{vkn:'nen:mol',tang:1}]};expect(docNhanHanhTrinh(raw,qc,false)).toBeNull();const n=docNhanHanhTrinh(raw,qc,true);expect(n?.dich).toEqual(['dang:ESTER.a']);expect(docNhanHanhTrinh({...raw,tienQuyet:[]},qc,true)).toBeNull();expect(thieuTheoCau(qc,2,new Map(),hs(),n)).toEqual([{vkn:'nen:mol',tang:1}])})
 it('mẫu số L3 bao gồm kỹ năng chưa đo; hồ sơ chung/bậc khác không tính đạt',()=>{const qs=Array.from({length:10},(_,i)=>o(i)),m=mucKyNang(qs,dungDoThi(qs,T_SANG+20*DAY));expect(tienDoMuc([{vkn:'dang:ESTER.a',tang:3},{vkn:'dang:b',tang:3},{vkn:'nen:mol',tang:3}],m)).toMatchObject({tong:2,dat:1,chuaDu:1,baoPhu:50,tyLeDat:50});expect(tienDoMuc([{vkn:'dang:ESTER.a',tang:2}],m)).toMatchObject({tong:0,tyLeDat:null})})
 it('nhiều sao không tự biến thành chuyển giao/tổng hợp; nhãn lập luận được giữ',()=>{expect(vaiTroL4(q(),null,true,false)).toBe('hoc_moi');expect(vaiTroL4(q(),null,true,true)).toBe('chuyen_giao');expect(vaiTroL4(q('q','VDC',['dang:a','dang:b']),null,true,false)).toBe('tong_hop');expect(vaiTroL4(q(),{dich:['dang:ESTER.a'],tienQuyet:[],loaiL4:'lap_luan'},true,false)).toBe('lap_luan')})
 it('L4 giữ 36 câu, có ôn/chuyển giao/tổng hợp/kiểm; thiếu loại bù bằng câu hợp lệ',()=>{const ids=Array.from({length:80},(_,i)=>String(i)),vai=Object.fromEntries(ids.map((id,i)=>[id,i<10?'on_sua':i<30?'chuyen_giao':i<60?'tong_hop':'kiem_doc_lap'])) as Record<string,'on_sua'|'chuyen_giao'|'tong_hop'|'kiem_doc_lap'>;const out=canBangL4(ids,vai,36);expect(out).toHaveLength(36);expect(new Set(out).size).toBe(36);expect(out.filter(id=>vai[id]==='on_sua')).toHaveLength(6);expect(out.filter(id=>vai[id]==='kiem_doc_lap')).toHaveLength(6);expect(canBangL4(ids,{},36)).toHaveLength(36)})
 it('bộ chọn tối ưu học khác xác suất làm đúng; giá trị giảm khi tốn thời gian',()=>{const a={p:0.8,yeu:0.5,phut:1,moi:true,moKhoa:2,quen:0,chuaRo:false,hoTro:0};expect(giaTriHoc(a)).toBeGreaterThan(giaTriHoc({...a,p:0.99}));expect(giaTriHoc(a)).toBeGreaterThan(giaTriHoc({...a,phut:3}))})
 it('A/B một học sinh một mẫu đầu; không trộn ma trận/phạm vi hoặc điểm ngoài cửa sổ',()=>{const a={sbd:'S',nhom:'B' as const,batDau:0,diemDau:6,id:'1',luc:8*DAY,diem:8,docLap:true,phamVi:'P',phamViDau:'P',maTran:'M',phut:null};const r=tomTatAB([a,{...a,id:'2',luc:9*DAY,diem:10},{...a,sbd:'X',docLap:false},{...a,sbd:'Y',phamVi:'Z'},{...a,sbd:'Z',luc:16*DAY}], 'M');expect(r[1]).toMatchObject({n:1,diemTb:8,tangDiemTb:2});expect(tomTatAB([a],'other')[1].n).toBe(0)})
 it('D1 thật: phân nhóm cân bằng ổn định, không thay sổ, ca mở không nhận thêm',async()=>{const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);const before=k.d.sql.prepare('SELECT * FROM su_kien_hoc').all();const a=await phanNhom(k.env,'S1',T_SANG,'P'),b=await phanNhom(k.env,'S2',T_SANG,'P');expect(a).not.toBeNull();expect(a!.nhom).not.toBe(b!.nhom);expect(await phanNhom(k.env,'S1',T_SANG+DAY,'P2')).toEqual(a);expect(k.d.sql.prepare('SELECT * FROM su_kien_hoc').all()).toEqual(before);k.d.sql.exec("INSERT INTO ca(ma_ca,trang_thai,cap_nhat_luc) VALUES('open','mo','x')");expect(await phanNhom(k.env,'S3',T_SANG,'P')).toBeNull();k.d.sql.close()})
 it('D1 thật: đề thử có receipt trước chấm, mốc đầu không ghi đè; báo cáo lấy tổng điểm',async()=>{const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);await phanNhom(k.env,'S1',T_SANG,'P');const refs=Array.from({length:14},(_,i)=>({qid:`q${i}`,phan:'I'})),matrix=maTranDo(refs.map(r=>({...r,mucDo:'NB'})));k.d.sql.prepare('INSERT INTO omni_de_thu VALUES(?,?,?,?,?,?,?)').run('test','S1',JSON.stringify(refs),new Date(T_SANG).toISOString(),'x',new Date(T_SANG+1000).toISOString(),8);await ghiDeThuDo(k.env,'test','S1',T_SANG,refs,matrix,true,'P');await chotDiemDau(k.env,'test','S1',T_SANG+1000,8,14);await chotDiemDau(k.env,'test','S1',T_SANG+2000,2,14);expect(k.d.sql.prepare('SELECT diem_dau FROM hanh_trinh_v5_phan_nhom').get()).toEqual({diem_dau:8});expect((await baoCaoAB(k.env,['S1'])).soMauHopLe).toBe(0);k.d.sql.close()})
 it('D1 thật: bộ đọc nhận đề thử đã nộp và bỏ đề chưa nộp; ngày không nhân chỉ tiêu',async()=>{const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);const hs=await docHoSo2(k.env,'S1',HOM_NAY);await lam(k.env,'S1','DH-B1-0',T_SANG-1000,true,{assistance:'none',purpose:'de_thu'});k.d.sql.exec("UPDATE su_kien_hoc SET nguon='luyen',ma_nguon='de_thu:submitted'");k.d.sql.prepare('INSERT INTO omni_de_thu VALUES(?,?,?,?,?,?,?)').run('submitted','S1','[]','x','x',new Date(T_SANG-1000).toISOString(),8);const d=await dongCoHanhTrinh(k.env,'S1',T_SANG,hs);expect(d.soQuanSat).toBe(1);k.d.sql.exec("UPDATE omni_de_thu SET nop_luc=NULL");expect((await dongCoHanhTrinh(k.env,'S1',T_SANG,hs)).soQuanSat).toBe(0);const plan=await layKeHoachHomNay(k.env,'S1',T_SANG);const again=await layKeHoachHomNay(k.env,'S1',T_SANG);expect(plan.kh.tong).toBe(24);expect(again.kh).toEqual(plan.kh);expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v5_quyet_dinh').get()).toEqual({n:1});k.d.sql.close()})
 it('D1 thật: tỷ lệ theo danh mục đầy đủ không đổi theo cửa sổ ứng viên; ghi=false không phân nhóm',async()=>{const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG);const h=await docHoSo2(k.env,'S1',HOM_NAY);const s=h.cau.slice(0,1),qs:QuanSatHanhTrinh[]=[];const qmap=new Map(h.cau.map(c=>[c.qid,q(c.qid,'NB',[`dang:${c.dang}`])])),g=dungDoThi(qs,T_SANG);const a=await boChonV5(k.env,'S1',T_SANG,{...h,cau:s},qmap,qs,g,hs(),new Map(),false);const b=await boChonV5(k.env,'S1',T_SANG,h,qmap,qs,g,hs(),new Map(),false);expect(a.phamVi).toBe(b.phamVi);expect(a.tienDo).toEqual(b.tienDo);expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_v5_phan_nhom').get()).toEqual({n:0});k.d.sql.close()})
 it('đã xem lời giải không phải nội dung mới dù lượt sau tự làm',()=>{const e={khoa:'r',sbd:'S',qid:'q',songSinh:false,nguon:'game',ketQua:null,luc:'x',ngayVn:'1',receivedAt:T_SANG,assistance:'none',purpose:'xem_loi_giai'} as SuKienOmni;const es=[e,{...e,khoa:'e',ketQua:1,purpose:'de_thu',ngayVn:'2',receivedAt:T_SANG+DAY}];expect(quanSatDocLap('S',es,new Map([['q',q()]]),T_SANG+2*DAY)[0]?.moi).toBe(false)})
})

// Kiểm đường kho thật: giữ nhãn qua chuẩn hóa, nhưng không đưa điều kiện nội bộ xuống câu công khai.
import { normalizeBank,lamNhe } from '../server/src/game-v2-bank'
import { publicQuestion } from '../src/game/than-thu-v2/core'
import { parseKhoDeJson,buildTeacherSourceFromKhoDe } from '../src/lib/exam-kho-de-import'
it('nhãn Hành trình đi qua nhập kho → chỉ mục → bản nhẹ; câu học sinh không có nhãn nội bộ',async()=>{
 const label={kyNangDich:['dang:ESTER.a'],tienQuyet:[{vkn:'nen:mol',tang:1}],loaiL4:'lap_luan'}
 const bank={ma_de:'DH-12-C1-B1',cau:[{so:1,phan:'I',de:'Một câu',pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'A',hanhTrinh:label}]}
 const parsed=parseKhoDeJson(bank)
 expect(parsed.ok).toBe(true)
 const built=buildTeacherSourceFromKhoDe(parsed.json!)
 expect(built.source.phanI[0]?.hanhTrinh).toEqual(label)
 const qs=await normalizeBank(bank,'DH-12-C1-B1')
 expect(qs[0]?.hanhTrinh).toEqual(label)
 expect(lamNhe(qs[0]!).hanhTrinh).toEqual(label)
 expect(publicQuestion(qs[0]!)).not.toHaveProperty('hanhTrinh')
 expect(publicQuestion(qs[0]!)).not.toHaveProperty('correct')
})

import { lapChotHanhTrinh } from '../server/src/hanh-trinh-d1'
it('D1 thật: kế hoạch đã phân được kiểm lại ngay, thay phần chưa làm và giữ phần đã làm/sổ',async()=>{
 const k=kho();await dongBoBaHanhTrinh(k.env,T_SANG)
 const old=await layKeHoachHomNay(k.env,'S1',T_SANG),done=old.kh.dao[0]!,bad=old.kh.dao[1]!
 await lam(k.env,'S1',done,T_SANG+1000,true,{assistance:'none',purpose:'maintenance'})
 const h=await docHoSo2(k.env,'S1',HOM_NAY),before=k.d.sql.prepare('SELECT * FROM su_kien_hoc').all()
 h.meta.set(bad,{...h.meta.get(bad)!,sao:2});h.cau=h.cau.map(c=>c.qid===bad?{...c,sao:2,mucDo:'VD'}:c)
 // Mô phỏng dấu phiên bản v4, các câu đã phân vẫn nằm trong cùng kế hoạch.
 k.d.sql.exec('DELETE FROM hanh_trinh_v5_quyet_dinh')
 const row=k.d.sql.prepare('SELECT * FROM srs2_ke_hoach WHERE sbd=? AND ngay=?').get('S1',HOM_NAY) as Record<string,unknown>
 const current=await lapChotHanhTrinh(k.env,'S1',HOM_NAY,T_SANG+2000,h,row,new Set([bad]))
 expect([...current.dao,...current.doan]).toContain(done)
 expect([...current.conDao,...current.conDoan]).not.toContain(bad)
 expect(current.tong).toBe(24)
 expect(k.d.sql.prepare('SELECT * FROM su_kien_hoc').all()).toEqual(before)
 k.d.sql.close()
})
it('D1 thật: học sinh giỏi được L4 cùng sàn 36 dù bài khác còn thiếu bằng chứng',async()=>{
 const k=kho(),ids=k.qids('DH-B1')
 for(let i=0;i<ids.length;i++){const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(ids[i]!) as {json:string};k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),lop:'12',mucDo:i<30?'VD':i%3===0?'VDC':'NB',sao:i>=30&&i%3===0?2:0}),ids[i]!)}
 await dongBoBaHanhTrinh(k.env,T_SANG)
 for(let i=0;i<30;i+=3)await lam(k.env,'S1',ids[i]!,T_SANG-DAY+i*1000,true,{assistance:'none',purpose:'maintenance'})
 const current=await layKeHoachHomNay(k.env,'S1',T_SANG)
 expect(current.kh.hanhTrinh?.tang).toBe(4)
 expect(current.kh.hanhTrinh?.toiThieu).toBe(36)
 const h=await docHoSo2(k.env,'S1',HOM_NAY),d=await dongCoHanhTrinh(k.env,'S1',T_SANG,h)
 expect(d.v5?.soL4).toBeGreaterThan(0)
 expect(d.v5?.chanDoan.size).toBeGreaterThan(0)
 k.d.sql.close()
})

import { hoa2OmniAction,nhomDaGap } from '../server/src/omni-game'
it('D1 thật: chặng kiểm L4 6 câu có hạn, không đáp án trước nộp, được tính trong ngày',async()=>{
 const k=kho(),ids=k.qids('DH-B1')
 for(let i=0;i<ids.length;i++){const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(ids[i]!) as {json:string};k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),lop:'12',mucDo:i<30?'VD':i%3===0?'VDC':'NB',sao:i>=30&&i%3===0?2:0}),ids[i]!)}
 await dongBoBaHanhTrinh(k.env,T_SANG)
 for(let i=0;i<30;i+=3)await lam(k.env,'S1',ids[i]!,T_SANG-DAY+i*1000,true,{assistance:'none',purpose:'maintenance'})
 await layKeHoachHomNay(k.env,'S1',T_SANG)
 const start=await hoa2OmniAction(k.env,'S1','hoa2-omni-de-thu',{l4:true},T_SANG) as {ok:boolean;id:string;hetLuc:string;cau:{qid:string;correct?:string;solution?:unknown}[]}
 expect(start.ok,JSON.stringify(start)).toBe(true);expect(start.cau).toHaveLength(6);expect(Date.parse(start.hetLuc)).toBeGreaterThan(T_SANG)
 expect(start.cau.every(q=>q.correct===undefined&&q.solution===undefined)).toBe(true)
 const answers=Object.fromEntries(start.cau.map(q=>{const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(q.qid) as {json:string};return [q.qid,JSON.parse(r.json).correct]}))
 const end=await hoa2OmniAction(k.env,'S1','hoa2-omni-de-thu-nop',{id:start.id,traLoi:answers},T_SANG+60000)
 expect(end.ok).toBe(true)
 const plan=await layKeHoachHomNay(k.env,'S1',T_SANG+60000)
 expect(plan.kh.hanhTrinh?.toiThieu).toBe(36)
 expect(plan.kh.hanhTrinh?.daLam).toBe(6)
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE ma_nguon=?").get(`de_thu:${start.id}`)).toEqual({n:6})
 k.d.sql.close()
})
it('D1 thật: câu cũ ngoài phạm vi và bản song sinh vẫn chặn nhóm trên đề mới',async()=>{
 const k=kho();await lam(k.env,'S1','DH-B1-0',T_SANG,true,{assistance:'none',purpose:'xem_loi_giai'})
 k.d.sql.exec("UPDATE su_kien_hoc SET qid='DH-B1-0~ss1#1'")
 const r=await nhomDaGap(k.env,'S1',T_SANG+1000)
 expect(r.nhom.has('g-DH-B1-0')).toBe(true)
 k.d.sql.close()
})
it('D1 thật: mẫu số không đổi theo ngày xoay câu và bao gồm kỹ năng L3 chưa vào cửa sổ',async()=>{
 const k=kho(),ids=k.qids('DH-B1')
 for(const id of ids){const r=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(id) as {json:string};k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(r.json),mucDo:'VD',dang:`ESTER.${id}`}),id);k.d.sql.prepare('UPDATE game_v2_question SET dang=? WHERE qid=?').run(`ESTER.${id}`,id)}
 await dongBoBaHanhTrinh(k.env,T_SANG)
 const a=await docHoSo2(k.env,'S1',HOM_NAY),b=await docHoSo2(k.env,'S1','2026-10-06')
 expect(a.cau.length).toBeLessThan(120)
 const ea=await dongCoHanhTrinh(k.env,'S1',T_SANG,a,new Set(),false),eb=await dongCoHanhTrinh(k.env,'S1',T_SANG+DAY,b,new Set(),false)
 expect(ea.v5?.tienDo.tong).toBe(120)
 expect(ea.v5?.tienDo).toEqual(eb.v5?.tienDo)
 expect(ea.v5?.phamVi).toBe(eb.v5?.phamVi)
 k.d.sql.close()
})
