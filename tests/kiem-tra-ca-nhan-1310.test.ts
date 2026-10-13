// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn, docKtCn, tomTatKt, ktCnAction, dongBoKtCn, chotKtCn, buMetaKt } from '../server/src/kiem-tra-ca-nhan'
import { chonDeKt, henKt, quotaHocKt, phutCauKt, dauNgayKt, type MucKt } from '../server/src/kiem-tra-ca-nhan-loi'
import { gameV2 } from '../server/src/game-v2'
import { gameToken } from '../server/src/game-v2-auth'
import { docNgayCacEm } from '../server/src/bai-hang-ngay'
import { xoaMoiDem } from '../server/src/dem-chung'
import { chotMucNgay7, damBaoGoi7 } from '../server/src/goi-bai-7'
import { chonGoi7 } from '../server/src/goi-bai-7-loi'
import { xoaDemCauHinh } from '../server/src/cau-hinh-dem'
import { ungVienChieu } from '../server/src/ung-vien-chieu'
import { gvKtCn } from '../server/src/kiem-tra-ca-nhan-thay'

const NOW=Date.parse('2026-10-13T02:00:00Z')
afterEach(()=>{vi.useRealTimers();xoaDemPhamVi()})
async function kho(){
 const k=taoKhoOmni({'DH-B0':12,'DH-B1':12});await damBaoBangBaiDaDay(k.env)
 k.d.sql.exec(`INSERT INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) VALUES('kiem_tra_ca_nhan_v1','{"bat":true}','x');
 INSERT INTO bai_da_day(id,lop,khoa_bai,ten_bai,vi_tri,ma_to_json,tick_luc) VALUES('b0','12A1','B0','Bài cũ',0,'["DH-B0"]','2026-10-01'),('b1','12A1','B1','Bài mới',1,'["DH-B1"]','2026-10-12');`)
 for(const ma of ['DH-B0','DH-B1']){
  k.d.sql.prepare('INSERT INTO de_kho(ma_de,ten_de,so_cau,da_xoa,cap_nhat_luc) VALUES(?,?,12,0,?)').run(ma,ma,'v1')
  k.d.sql.prepare('INSERT INTO game_v2_index(ma_de,source_version,indexed_at) VALUES(?,?,?)').run(ma,'v1','x')
  for(const qid of k.qids(ma)){k.d.sql.prepare("INSERT INTO omni_q(qid,y,vkn_json,nguon,duyet_luc) VALUES(?,-1,?,'thay','x')").run(qid,JSON.stringify([ma+'.kn']))}
 }
 k.d.sql.prepare("UPDATE hoc_sinh SET mat_khau='gia' WHERE sbd='S1'").run()
 return k
}
const muc:MucKt[]=[{id:'a',bai:'A',tenBai:'A',kyNang:'a',mucDo:'NB'},{id:'b',bai:'B',tenBai:'B',kyNang:'b',mucDo:'TH'}]
it('bộ phủ không cắt bài; thiếu nguồn được giữ trong mẫu số',()=>{
 const r=chonDeKt(muc,[{qid:'a',group:'a',muc:['a'],phut:1,hopLe:true,daGap:false}],new Map(),'S1')
 expect(r).toMatchObject({tongMuc:2,phu:1,thieu:['b']})
})
it('em chưa vững có thêm câu khác nhóm; em vững không bị giao thêm kiểm chứng giả',()=>{
 const c=Array.from({length:4},(_,i)=>({qid:String(i),group:String(i),muc:[i%2?'b':'a'],phut:1,hopLe:true,daGap:false}))
 const vung=new Map(muc.map(m=>[m.id,{p:0.97,vung:true,n:9,ngayCuoi:'2026-10-10'}]))
 expect(chonDeKt(muc,c,vung,'S1').qids).toHaveLength(2)
 expect(chonDeKt(muc,c,new Map(),'S1').qids).toHaveLength(4)
})
it('ngày kiểm tra riêng theo bằng chứng; không luôn Chủ nhật, luôn có 24h',()=>{
 const yeu=henKt({sbd:'S1',homNay:'2026-10-13',bangChung:[{p:0.3,vung:false,n:0,ngayCuoi:null}]})
 const gioi=henKt({sbd:'S2',homNay:'2026-10-13',bangChung:[{p:0.98,vung:true,n:10,ngayCuoi:'2026-10-10'}]})
 expect(yeu.ngay).toBe('2026-10-16');expect(gioi.ngay).toBe('2026-10-20')
 expect(dauNgayKt('2026-10-17')-dauNgayKt('2026-10-16')).toBe(86400000)
})
it('127 câu chia cho 6 ngày học; ngày kiểm tra không có quota; hết hạn giữ nợ',()=>{
 expect(quotaHocKt(127,'2026-10-13','2026-10-19',new Set(['2026-10-16']))).toBe(22)
 expect(quotaHocKt(127,'2026-10-16','2026-10-19',new Set(['2026-10-16']))).toBe(0)
 expect(quotaHocKt(33,'2026-10-20','2026-10-19',new Set())).toBe(33)
})
it('thời gian theo loại câu và mẫu đúng hợp lệ, không nhận thời gian mở máy cả ngày',()=>{
 expect(phutCauKt('III',[])).toBe(2.5);expect(phutCauKt('I',Array(30).fill(30000))).toBeLessThan(1)
 expect(phutCauKt('I',[86400000])).toBe(1)
})
it('lập đề thật đủ cả hai bài, không trùng khi cron/request chạy lại, không lộ đáp án trong tóm tắt',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);await lapKtCn(k.env,'S1',NOW)
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM kiem_tra_ca_nhan WHERE sbd='S1'").get()).toMatchObject({n:1})
 const r=(await docKtCn(k.env,'S1',NOW))!,tt=tomTatKt(r,NOW)
 expect(tt).toMatchObject({nguonDayDu:true,soBai:2,homNay:false});expect(tt.tong).toBeGreaterThan(0)
 expect(JSON.stringify(tt)).not.toContain('correct');expect(JSON.stringify(tt)).not.toContain('Cốt lõi')
})
it('thiếu ma trận không tuyên bố 100% và không chiếm ngày bài tập',async()=>{
 const k=await kho();k.d.sql.exec("DELETE FROM omni_q WHERE qid='DH-B0-0'")
 await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!
 expect(tomTatKt(r,Number(r.mo_luc)+1000)).toMatchObject({nguonDayDu:false,homNay:false,trangThai:'cho_nguon'})
})
it('đồng hồ không khởi động lại; lưu/nộp chặng rồi nộp toàn bài giữ điểm và sự kiện một lần',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);let r=(await docKtCn(k.env,'S1',NOW))!
 const now=Number(r.mo_luc)+1000,id=String(r.id),d=JSON.parse(String(r.json))
 const first=await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id,chang:0},now)
 const second=await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id,chang:0},now+30000)
 expect(second.hanChang).toBe(first.hanChang);expect(JSON.stringify(first)).not.toContain('correct')
 for(let i=0;i<d.chang.length;i++){
  await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id,chang:i},now+40000+i*1000)
  const tra=Object.fromEntries(d.cau.filter((c:{q:{qid:string}})=>d.chang[i].qids.includes(c.q.qid)).map((c:{q:{qid:string;correct:string}})=>[c.q.qid,c.q.correct]))
  await ktCnAction(k.env,'S1','hoc-tap-ktcn-chot-chang',{id,chang:i,tra,revision:Number(k.d.sql.prepare('SELECT revision FROM kiem_tra_ca_nhan WHERE id=?').get(id)!.revision)},now+41000+i*1000)
 }
 const result=await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id},now+60000)
 const count=k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE ma_nguon=?").get(id)
 expect(result.kiemTra).toMatchObject({diem:10,trangThai:'da_nop'})
 const uv=await ungVienChieu(k.env,{qids:[d.cau[0].q.qid],sbd:['S1']})
 expect(uv.cau[d.cau[0].q.qid]![0]).toMatchObject({loai:'da_dung'})
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id,tra:{fake:'A'}},now+90000)
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM su_kien_hoc WHERE ma_nguon=?").get(id)).toEqual(count)
 r=(await docKtCn(k.env,'S1',now+90000))!;expect(tomTatKt(r,now+90000).homNay).toBe(true)
})
it('hết giờ không nhận nháp muộn, vẫn giữ bỏ trống; hết hạn tự nộp',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,id=String(r.id),now=Number(r.mo_luc)+1000
 const ch=await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id,chang:0},now)
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',{id,chang:0,tra:{'DH-B0-0':'B'}},Number(ch.hanChang)+1)
 const res=await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id},Number(r.han_luc)+1)
 expect(res.kiemTra).toMatchObject({daTra:0,diem:0,trangThai:'het_han'})
})
it('không cho xem chữa trước nộp, không truy cập bài của em khác',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,id=String(r.id),now=Number(r.mo_luc)+1000
 await expect(ktCnAction(k.env,'S1','hoc-tap-ktcn-ket-qua',{id},now)).rejects.toThrow('nộp toàn bài')
 await expect(ktCnAction(k.env,'S2','hoc-tap-ktcn-start',{id,chang:0},now)).rejects.toThrow('không thuộc')
})
it('máy chủ chặn chặng thường và báo đúng số kiểm tra ở Sảnh, không chốt kế hoạch ngày',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,now=Number(r.mo_luc)+1000
 vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(now)
 const token=await gameToken(k.env,'S1'),res=await gameV2(k.env,'hoc-tap-sanh',{token})
 expect(res.kiemTraCaNhan).toMatchObject({homNay:true,tong:JSON.parse(String(r.json)).cau.length})
 await expect(gameV2(k.env,'hoc-tap-start',{token})).rejects.toThrow('chỉ làm bài kiểm tra')
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM srs2_ke_hoach WHERE sbd='S1'").get()).toMatchObject({n:0})
})
it('báo cáo ngày dùng N của bài kiểm tra, không báo thiếu sàn 24/30/36',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,ngay=String(r.ngay)
 const result=await docNgayCacEm(k.env,[{sbd:'S1',hoTen:'Em',lop:'12A1',khoi:'12',goi7Tu:null}],ngay,ngay,ngay,[])
 expect(result.get('S1')![0]).toMatchObject({cheDo:'kiem-tra',mucToiThieu:JSON.parse(String(r.json)).cau.length})
})
it('ca chính thức đang mở không lập đề hoặc ghi lịch mới',async()=>{
 const k=await kho();k.d.sql.exec("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('CA','Ca','mo','x')")
 expect(await dongBoKtCn(k.env,NOW)).toMatchObject({hoan:true})
 expect(k.d.sql.prepare('SELECT COUNT(*) n FROM kiem_tra_ca_nhan').get()).toMatchObject({n:0})
})
it('một em tạm dừng không chặn cả hàng đợi; cron thử các em kế tiếp',async()=>{
 const k=await kho();k.d.sql.exec(`INSERT INTO game_v2_scope(sbd,json,updated_at) VALUES('S1','{"enabled":false,"blocked":[],"types":[]}','x')`)
 await dongBoKtCn(k.env,NOW,1);await dongBoKtCn(k.env,NOW+60000,1)
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM kiem_tra_ca_nhan WHERE sbd='S1'").get()).toMatchObject({n:0})
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM kiem_tra_ca_nhan WHERE sbd='S2'").get()).toMatchObject({n:1})
})
it('chuyển lớp trước khi lịch mở không bị kẹt ở lịch của lớp cũ',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW)
 k.d.sql.exec("UPDATE hoc_sinh SET lop='12A2' WHERE sbd='S1'; UPDATE bai_da_day SET lop='12A2'");xoaDemPhamVi()
 await lapKtCn(k.env,'S1',NOW)
 expect(await docKtCn(k.env,'S1',NOW)).toMatchObject({lop:'12A2'})
 expect(k.d.sql.prepare("SELECT COUNT(*) n FROM kiem_tra_ca_nhan WHERE sbd='S1'").get()).toMatchObject({n:1})
})
it('bản nháp cũ không ghi đè đáp án mới; retry cùng patch không tạo điểm hay reset giờ',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,id=String(r.id),now=Number(r.mo_luc)+1000
 const start=await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id,chang:0},now)
 const qid=(start.questions as {qid:string}[])[0]!.qid
 const payload={id,chang:0,revision:0,tra:{[qid]:'A'}}
 expect(await ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',payload,now+1000)).toMatchObject({daLuu:true,revision:1})
 expect(await ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',payload,now+2000)).toMatchObject({daLuu:true,revision:1})
 await expect(ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',{...payload,tra:{[qid]:'B'}},now+3000)).rejects.toThrow('lượt khác')
 expect(JSON.parse(String((await docKtCn(k.env,'S1',now))!.tra_json))[qid]).toBe('A')
})
it('kết quả kiểm tra đã nộp vẫn là mức ngày thật nếu tạm tắt tính năng',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,id=String(r.id),now=Number(r.mo_luc)+1000
 await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id},now)
 k.d.sql.exec(`UPDATE cau_hinh SET gia_tri='{"bat":false}' WHERE khoa='kiem_tra_ca_nhan_v1'`);xoaMoiDem();xoaDemCauHinh(k.env)
 const ngay=String(r.ngay),ds=await docNgayCacEm(k.env,[{sbd:'S1',hoTen:'Em',lop:'12A1',khoi:'12',goi7Tu:null}],ngay,ngay,ngay,[])
 expect(ds.get('S1')![0]).toMatchObject({cheDo:'kiem-tra',mucToiThieu:JSON.parse(String(r.json)).cau.length})
})
it('ngày học giữ chỗ sửa sai và ôn cũ, nhưng không tăng số đã chốt khi em đang làm',async()=>{
 const k=await kho();await damBaoGoi7(k.env)
 const first=await chotMucNgay7(k.env,'S1','2026-10-13',1,25,NOW,false,undefined,10)
 expect(first.muc).toBe(35)
 const second=await chotMucNgay7(k.env,'S1','2026-10-13',1,50,NOW+1000,false,undefined,10)
 expect(second.muc).toBe(35)
 const all=Array.from({length:35},(_,i)=>`q${i}`),moi=all.slice(0,25),sua=all.slice(25,29),on=all.slice(29)
 const p=chonGoi7({cau:moi.map(qid=>({qid,maDe:'M',version:'v1',phan:'I',kho:false,tinhToan:false})),daGap:new Set(),daLamNgay:new Set(),quotaCon:25,sanSang:new Set(all),chan:new Set(),sua,on,mucTieuNgay:35,giuOn:6,chiTrongMuc:true})
 expect(p.viec.filter(v=>v.vai==='sua')).toHaveLength(4)
 expect(p.viec.filter(v=>v.vai==='on')).toHaveLength(6)
 expect(p.viec.filter(v=>v.vai==='moi')).toHaveLength(25)
})
it('chốt lại theo revision khi một nháp chen vào giữa đọc và nộp; điểm khớp đáp án trong sổ',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,cs=JSON.parse(String(r.json)).cau
 const prepare=k.env.DB.prepare.bind(k.env.DB);let chen=false
 vi.spyOn(k.env.DB,'prepare').mockImplementation(sql=>{
  if(sql.startsWith('UPDATE kiem_tra_ca_nhan SET nop_luc')&&!chen){chen=true;k.d.sql.prepare('UPDATE kiem_tra_ca_nhan SET tra_json=?,revision=revision+1 WHERE id=?').run(JSON.stringify(Object.fromEntries(cs.map((c:{q:{qid:string;correct:string}})=>[c.q.qid,c.q.correct]))),String(r.id))}
  return prepare(sql)
 })
 const sealed=await chotKtCn(k.env,r,Number(r.mo_luc)+60000)
 expect(sealed.diem).toBe(10)
 expect(k.d.sql.prepare('SELECT COUNT(*) n FROM su_kien_hoc WHERE ma_nguon=? AND ket_qua=1').get(String(r.id))).toMatchObject({n:cs.length})
 vi.restoreAllMocks()
})
it('thầy thấy một lịch sắp tới của mỗi em, không để lịch cũ che lịch mới',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW)
 k.d.sql.exec("INSERT INTO kiem_tra_ca_nhan(id,sbd,lop,ngay,mo_luc,han_luc,trang_thai,json,nop_luc,diem,cap_nhat_luc) SELECT 'cu',sbd,lop,'2026-10-10',mo_luc-604800000,han_luc-604800000,'da_nop',json,mo_luc-604700000,8,cap_nhat_luc FROM kiem_tra_ca_nhan WHERE sbd='S1'")
 const r=await gvKtCn(k.env,{},NOW)
 expect(r.em).toHaveLength(1);expect(r.em[0]?.kiemTra.ngay).toBe('2026-10-16')
})
it('đọc lịch nhẹ không mang đề/đáp án; số câu trả lời khớp phép đếm chặt của cả ba loại câu',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!,d=JSON.parse(String(r.json))
 const mau=d.cau[0],cases=[['I','A'],['I','AB'],['II','DSDS'],['II','DSD'],['III','2,4'],['III',' \t\n\u00a0']]
 d.cau=cases.map(([phan,a],i)=>({...mau,q:{...mau.q,qid:'edge'+i,phan},answer:a}))
 k.d.sql.prepare('UPDATE kiem_tra_ca_nhan SET json=?,tra_json=? WHERE id=?').run(JSON.stringify(d),JSON.stringify(Object.fromEntries(d.cau.map((c:{q:{qid:string};answer:string})=>[c.q.qid,c.answer]))),String(r.id))
 // SỬA CÓ CHỦ ĐÍCH 13/10 (khẩn D1 quá tải): số liệu nay TÍNH SẴN lúc lập đề (kiem_tra_ca_nhan_meta). Đề vừa bị sửa thẳng bằng SQL ở trên
 // (ngoài đường lapKtCn) ⇒ bỏ số tính sẵn cũ, kiểm CẢ HAI nhánh: (1) dòng chưa có số ⇒ phép tính cũ; (2) sau khi bù (buMetaKt) ⇒ số tính sẵn.
 k.d.sql.prepare('DELETE FROM kiem_tra_ca_nhan_meta WHERE id=?').run(String(r.id))
 const full=(await docKtCn(k.env,'S1',NOW))!
 for(const nhanh of ['cu','tinh-san']){
  if(nhanh==='tinh-san')expect(await buMetaKt(k.env,10)).toBe(1)
  const meta=(await docKtCn(k.env,'S1',NOW,true))!
  expect(meta).not.toHaveProperty('json');expect(meta).not.toHaveProperty('tra_json')
  expect(JSON.stringify(meta)).not.toContain('correct');expect(String(meta.meta_json)).not.toContain('"phan"')
  expect(tomTatKt(meta,NOW)).toEqual(tomTatKt(full,NOW));expect(tomTatKt(meta,NOW).daTra).toBe(3)
 }
})
it('khẩn 13/10: lập đề ghi luôn số tính sẵn; đọc lịch nhẹ không bóc JSON đề trong SQL',async()=>{
 const k=await kho();await lapKtCn(k.env,'S1',NOW);const r=(await docKtCn(k.env,'S1',NOW))!
 const so=k.d.sql.prepare('SELECT meta_json FROM kiem_tra_ca_nhan_meta WHERE id=?').get(String(r.id)) as {meta_json:string}|undefined
 expect(so).toBeTruthy()
 const d=JSON.parse(String(r.json)),m=JSON.parse(so!.meta_json)
 expect(m.tong).toBe(d.cau.length);expect(Object.keys(m.phan)).toEqual(d.cau.map((c:{q:{qid:string}})=>c.q.qid))
 expect(m).not.toHaveProperty('cau');expect(so!.meta_json).not.toContain('correct')
 // Lượt đọc nhẹ đi nhánh số tính sẵn: không json_each trên k.json (gốc lỗi 0,9 s/dòng).
 const prepare=k.env.DB.prepare.bind(k.env.DB),sqls:string[]=[]
 vi.spyOn(k.env.DB,'prepare').mockImplementation(sql=>{sqls.push(sql);return prepare(sql)})
 const meta=(await docKtCn(k.env,'S1',NOW,true))!
 vi.restoreAllMocks()
 expect(tomTatKt(meta,NOW)).toEqual(tomTatKt(r,NOW))
 const doc=sqls.find(x=>x.includes('kiem_tra_ca_nhan_meta'))!
 const nhanhMoi=doc.slice(doc.indexOf('COALESCE((SELECT'),doc.indexOf("json_object('tong'"))
 expect(nhanhMoi).toContain('kiem_tra_ca_nhan_meta');expect(nhanhMoi).not.toMatch(/k\.json/)
})
