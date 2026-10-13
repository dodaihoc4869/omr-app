// @vitest-environment node
import {afterEach,expect,it} from 'vitest'
import {taoKhoOmni} from './omni-3-ke-hoach-chung'
import {damBaoBangBaiDaDay,xoaDemPhamVi} from '../server/src/bai-da-day'
import {damBaoKtCn} from '../server/src/kiem-tra-ca-nhan-schema'
import {lapKtCn,docKtCn,tomTatKt,ktCnAction,dongBoKtCn} from '../server/src/kiem-tra-ca-nhan'
import {KHUNG_KT_2026} from '../server/src/kiem-tra-ca-nhan-ma-tran'
import {xoaMoiDem} from '../server/src/dem-chung'
import {congNgayKt} from '../server/src/kiem-tra-ca-nhan-loi'
import {docLanLam} from '../server/src/srs2-d1'
import {nguonTuongDuongKt} from '../server/src/kiem-tra-ca-nhan-nguon'
const NOW=Date.parse('2026-10-13T05:00:00Z'),MA='DH-12-C1-B1'
afterEach(()=>{xoaMoiDem();xoaDemPhamVi()})
async function kho(nKn=1,soBan=2){
 const k=taoKhoOmni({[MA]:28*soBan},1);await damBaoBangBaiDaDay(k.env);await damBaoKtCn(k.env)
 k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
 INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b','12A1','B1','Bài đã dạy',0,'["${MA}"]','2026-10-12');
 INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES('${MA}','Bài đã dạy',${28*soBan},0,'v1');
 INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES('${MA}','v1','x');`)
 let i=0
 for(const phan of ['I','II','III']as const)for(const mucDo of ['biet','hieu','van_dung']as const)for(let j=0;j<KHUNG_KT_2026[phan][mucDo]*soBan;j++){
  const qid=k.qids(MA)[i]!,old=JSON.parse(String(k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(qid)!.json))
  const q={...old,phan,mucDo:({biet:'NB',hieu:'TH',van_dung:'VD'}as const)[mucDo],dang:'ESTER.CAU_TAO.NHAN_DANG',choices:phan==='I'?['a','b','c','d']:[],ideas:phan==='II'?['a','b','c','d']:[],correct:phan==='I'?'B':phan==='II'?'DSDS':'4'}
  k.d.sql.prepare('UPDATE game_v2_question SET dang=?,json=? WHERE qid=?').run(q.dang,JSON.stringify(q),qid)
  k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid,JSON.stringify(nKn===1?['nen:mol']:[`muc:${2*i%nKn}`,`muc:${(2*i+1)%nKn}`]));i++
 }return k
}
it('mặc định lập đúng 18/4/6, 50 phút, năm chặng; metadata nhẹ và đề riêng khớp số phủ thật',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW)
 const r=(await docKtCn(k.env,'S1',NOW))!,d=JSON.parse(String(r.json)),tt=tomTatKt(r,NOW),meta=(await docKtCn(k.env,'S1',NOW,true))!
 expect(d).toMatchObject({phienBan:3,phut:50,soLanTuan:1});expect(d.cau).toHaveLength(28)
 expect(['I','II','III'].map(p=>d.cau.filter((c:{q:{phan:string}})=>c.q.phan===p).length)).toEqual([18,4,6])
 expect(d.chang.map((c:{qids:string[]})=>c.qids.length)).toEqual([6,6,6,4,6]);expect(d.chang.reduce((n:number,c:{giay:number})=>n+c.giay,0)).toBe(3000)
 expect(tt).toMatchObject({tong:28,phut:50,tongKienThuc:1,phuDe:1,nguonDayDu:true});expect(tomTatKt(meta,NOW)).toEqual(tt)
})
it('hai đề phủ đủ kiến thức, cách nhau ba ngày; không tạo đề thứ ba khi đề đầu đã mở, chu kỳ kế tiếp cách đúng một tuần',async()=>{
 const k=await kho(60);await lapKtCn(k.env,'S1',NOW)
 const rows=k.d.sql.prepare('SELECT * FROM kiem_tra_ca_nhan ORDER BY ngay').all();expect(rows).toHaveLength(2)
 const a=rows[0]!,b=rows[1]!,d=JSON.parse(String(a.json))
 expect(d.soLanTuan).toBe(2);expect(String(b.ngay)).toBe(congNgayKt(String(a.ngay),3))
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id:a.id,chang:0},Number(a.mo_luc)+1000)
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-chot-chang',{id:a.id,chang:0,tra:{},revision:0},Number(a.mo_luc)+1500)
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id:a.id},Number(a.mo_luc)+2000)
 const giua=Number(a.han_luc)+1000;await lapKtCn(k.env,'S1',giua,true);await dongBoKtCn(k.env,giua)
 expect(k.d.sql.prepare('SELECT COUNT(*) n FROM kiem_tra_ca_nhan').get()).toMatchObject({n:2})
 expect(k.d.sql.prepare('SELECT json FROM kiem_tra_ca_nhan WHERE id=?').get(String(b.id))!.json).toBe(b.json)
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id:b.id},Number(b.mo_luc)+1000)
 await lapKtCn(k.env,'S1',Number(b.han_luc)+1000)
 const next=k.d.sql.prepare('SELECT ngay FROM kiem_tra_ca_nhan WHERE ngay>? ORDER BY ngay').all(String(b.ngay))
 expect(next[0]!.ngay).toBe(congNgayKt(String(a.ngay),7));expect(next).toHaveLength(2)
})
it('đề 333 câu chưa mở được thay bằng 28 câu cùng ngày; bản đã bắt đầu không bị sửa',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,d=JSON.parse(String(r.json))
 const old={...d,phienBan:1,cau:Array.from({length:333},()=>d.cau[0]),phut:475}
 k.d.sql.prepare('UPDATE kiem_tra_ca_nhan SET json=? WHERE id=?').run(JSON.stringify(old),String(r.id))
 await lapKtCn(k.env,'S1',NOW+1000,true);const moi=(await docKtCn(k.env,'S1',NOW))!
 expect(moi.ngay).toBe(r.ngay);expect(tomTatKt(moi,NOW)).toMatchObject({tong:28,phut:50})
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id:r.id,chang:0},Number(r.mo_luc)+1000)
 await lapKtCn(k.env,'S1',Number(r.mo_luc)+2000,true)
 expect(k.d.sql.prepare('SELECT json FROM kiem_tra_ca_nhan WHERE id=?').get(String(r.id))!.json).toBe(moi.json)
})
it('nguồn tương đương chỉ nhận câu đã duyệt, đúng khối và mọi kiến thức nằm trong phạm vi',async()=>{
 const k=await kho(),mas=['DH-12-C1-B9','DH-12-C7-B9','DH-10-C1-B9']
 for(const [i,ma]of mas.entries()){
  const q={qid:ma+'-Q',maDe:ma,version:'v1',group:ma,phan:'III',text:'Câu nguồn',choices:[],ideas:[],hinhAnh:[],dang:i===1?'POLYMER.PHAN_LOAI.NHAN_DANG':'ESTER.CAU_TAO.NHAN_DANG',mucDo:'NB',sao:0,kienThuc:[],correct:'4',reviewed:true,solution:{chot:'4'}}
  k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,1,0,?)').run(ma,ma,'v1')
  k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma,'v1','x')
  k.d.sql.prepare('INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) VALUES(?,?,?,?,?,?)').run(ma,q.qid,'v1',ma,q.dang,JSON.stringify(q))
  k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(q.qid,JSON.stringify(['nen:gia_tri_trung_binh',`dang:${q.dang}`]))
 }
 const muc=[{id:'kn:nen:gia_tri_trung_binh',kyNang:'nen:gia_tri_trung_binh',bai:'B1',tenBai:'B1',mucDo:''},{id:'kien_thuc:ESTER.CAU_TAO',kyNang:'ESTER.CAU_TAO',bai:'B1',tenBai:'B1',mucDo:''}]
 const r=await nguonTuongDuongKt(k.env,{sbd:'S1',khoi:12,muc,can:['nen:gia_tri_trung_binh'],baoVe:new Set(),btvn:new Set(),blocked:[],types:[]})
 expect(r.map(c=>c.q.qid)).toEqual(['DH-12-C1-B9-Q'])
 k.d.sql.prepare("UPDATE game_v2_question SET json=json_set(json,'$.reviewed',json('false')) WHERE qid=?").run('DH-12-C1-B9-Q')
 expect(await nguonTuongDuongKt(k.env,{sbd:'S1',khoi:12,muc,can:['nen:gia_tri_trung_binh'],baoVe:new Set(),btvn:new Set(),blocked:[],types:[]})).toHaveLength(0)
})

it('câu sai vào sổ ôn đúng một lần; bỏ trống không tạo lượt làm hay năng lực giả',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,d=JSON.parse(String(r.json)),now=Number(r.mo_luc)+1000
 const ch=await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id:r.id,chang:0},now),qs=ch.questions as {qid:string}[],qid=qs[0]!.qid
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-chot-chang',{id:r.id,chang:0,tra:{[qid]:'A'},revision:0},now+1000)
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id:r.id},now+2000);await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id:r.id},now+3000)
 const ls=await docLanLam(k.env,'S1',d.cau.map((c:{q:{qid:string}})=>c.q.qid));expect(ls).toHaveLength(1);expect(ls[0]).toMatchObject({qid,dung:false,coGoiY:false})
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE ma_nguon=?").get(String(r.id))).toMatchObject({n:1})
})

it('ba đề giãn ngày, và cổng ghi không cho quá ba bài trong bất kỳ bảy ngày liên tiếp',async()=>{
 const k=await kho(150,3);await lapKtCn(k.env,'S1',NOW)
 const rows=k.d.sql.prepare('SELECT * FROM kiem_tra_ca_nhan ORDER BY ngay').all();expect(rows).toHaveLength(3)
 expect(rows.map(r=>r.ngay)).toEqual([0,2,4].map(i=>congNgayKt(String(rows[0]!.ngay),i)))
 for(const r of rows)expect(tomTatKt(r,NOW)).toMatchObject({tong:28,phut:50,baiNgayToiThieu:12})
 // Lịch đã có đủ ba bài: ép hẹn thêm sớm qua hồ sơ thử không được sinh bài thứ tư.
 k.d.sql.prepare("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,nop_luc,cap_nhat_luc) VALUES('moc','S1','12A1','2026-10-11',?,?,'da_nop',?,?,?)").run(NOW-100000,NOW-1,JSON.stringify({...JSON.parse(String(rows[0]!.json)),chuKyNgay:'2026-10-11'}),NOW-1000,NOW)
 await lapKtCn(k.env,'S1',NOW,true)
 const so=k.d.sql.prepare("SELECT COUNT(*) n FROM kiem_tra_ca_nhan WHERE ngay BETWEEN ? AND ?").get(String(rows[0]!.ngay),congNgayKt(String(rows[0]!.ngay),6))!
 expect(Number(so.n)).toBeLessThanOrEqual(3)
})
