// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { gameToken } from '../server/src/game-v2-auth'
import { hsHoiThay, nguCanhHoiTroLy, damBaoBangLoiGiai } from '../server/src/loi-giai'
import { damBaoBangTuLuyen } from '../server/src/tu-luyen'
import { traLoiHoiThem } from '../server/src/hoi-tro-ly'
import { cauHoiThayTuLuyen } from '../server/src/tu-luyen-hoi-thay'
const GOC='12-SNAP-III-3', LUOT='tl_abcdef18', LOG=GOC+'~2'
async function dung(hien:string, phan='III') {
 const d=taoD1That(); await damBaoBangTuLuyen(d.env)
 d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,mat_khau,cap_nhat_luc) VALUES('E1','Em thử','12','mk','x'),('E2','Em khác','12','mk','x')")
 const rieng=[{qid:LOG,hien,phan,dapAn:phan==='I'?'B':'1315',chot:'Lời giải đúng snapshot',lyDo:phan==='I'?[{khoa:'B',dung:true,ly:'Vì B đã đổi chỗ'}]:null,buoc:['Đếm H của từng nhóm'],ketQua:'1315',dangMa:'',sao:0}]
 const cong=[{qid:LOG,phan,text:'Nội dung snapshot đã thay',luaChon:phan==='I'?['Sai','Đúng','Sai nữa','Sai cuối']:null,bang:[['Chất','H'],['A','13']],hinh:[{src:'data:image/png;base64,YQ==',viTri:'sau_de'}]}]
 d.sql.prepare("INSERT INTO tu_luyen_luot(id,sbd,che_do,de_rieng_json,de_cong_khai_json,tao_luc) VALUES(?,'E1',1,?,?,1)").run(LUOT,JSON.stringify(rieng),JSON.stringify(cong))
 return {d,token:await gameToken(d.env,'E1')}
}
describe('Snapshot câu Tu luyện đã phát',()=>{
 it.each(['~ss0','~bt1','~yd2'])('mở đúng nội dung mã ảo %s, không tìm lại kho gốc',async(suffix)=>{
  const {d,token}=await dung(GOC+suffix)
  const r=await hsHoiThay(d.env,{token,qid:LOG,luotId:LUOT,nguon:'tu_luyen',chiHoi:true})
  expect(r).toMatchObject({ok:true,chiHoi:true,cau:{qid:GOC+suffix,de:expect.stringContaining('Nội dung snapshot đã thay')}})
  expect(JSON.stringify(r)).not.toContain('1315')
  const nc=await nguCanhHoiTroLy(d.env,'E1',GOC+suffix,Date.now(),true,{luotId:LUOT,qidTrongLuot:LOG})
  expect(nc).toMatchObject({ok:true,cau:{dapAn:'1315',de:'Nội dung snapshot đã thay',bang:[['Chất','H'],['A','13']],hinh:[{duLieu:'data:image/png;base64,YQ=='}]}})
 })
 it('bản xáo giữ phương án và đáp án từ snapshot, sau chấm từng câu được giải đầy đủ',async()=>{
  const {d,token}=await dung('12-SNAP-I-3','I')
  d.sql.prepare('INSERT INTO tu_luyen_cham_cau(luot_id,sbd,qid,luc) VALUES(?,?,?,1)').run(LUOT,'E1',LOG)
  const r=await hsHoiThay(d.env,{token,qid:LOG,luotId:LUOT,nguon:'tu_luyen'})
  expect(r).toMatchObject({ok:true,cau:{y:{A:'Sai',B:'Đúng'}},loiGiaiChu:{dapAn:'B'}})
  const nc=await nguCanhHoiTroLy(d.env,'E1','12-SNAP-I-3',Date.now(),false,{luotId:LUOT,qidTrongLuot:LOG})
  expect(nc).toMatchObject({ok:true,dangLam:false,cau:{pa:{B:'Đúng'},dapAn:'B'}})
 })
 it('giữ ảnh thân và từng phương án với đúng nhãn, AI nhận đủ ảnh trong snapshot',async()=>{
  const {d,token}=await dung('12-SNAP-I-3','I')
  const body='data:image/png;base64,Yg==', a='data:image/png;base64,Yw==', b='data:image/png;base64,ZA=='
  d.sql.prepare('UPDATE tu_luyen_luot SET de_cong_khai_json=? WHERE id=?').run(JSON.stringify([{qid:LOG,phan:'I',text:'Nhận ra cấu tạo',luaChon:['A ảnh','B ảnh','C chữ','D chữ'],anhThanCau:body,anhLuaChon:[a,b,undefined,undefined]}]),LUOT)
  const r=await hsHoiThay(d.env,{token,qid:LOG,luotId:LUOT,nguon:'tu_luyen',chiHoi:true})
  expect(r).toMatchObject({ok:true})
  const html=String((r.cau as {de:string}).de)
  expect(html.match(/<img /g)).toHaveLength(3)
  expect(html).toContain(`src="${body}"`)
  expect(html).toContain(`Phương án A: <img alt="Phương án A" src="${a}"`)
  expect(html).toContain(`Phương án B: <img alt="Phương án B" src="${b}"`)
  d.env.GEMINI_API_KEY='gia-lap'
  let prompt=''
  await traLoiHoiThem(d.env,'E1',{qid:'12-SNAP-I-3',luotId:LUOT,qidTrongLuot:LOG,nguon:'tu_luyen',cauHoi:'Phương án A là chất gì?',dangLam:true},{goiAi:async(_key,_cfg,nd)=>{prompt=JSON.stringify(nd);return {ok:true,chu:'{"lienQuan":true,"traLoi":"Em xem nhóm chức."}',vao:1,ra:1}}})
  expect(prompt).toContain('pa_A'); expect(prompt).toContain('pa_B')
  for(const data of ['Yg==','Yw==','ZA==']) expect(prompt).toContain(`"data":"${data}"`)
 })
 it('ý Đúng/Sai mới giữ nguyên ý và chuỗi đáp án đã phát',async()=>{
  const {d,token}=await dung(GOC+'~yd2','II')
  d.sql.prepare('UPDATE tu_luyen_luot SET de_cong_khai_json=?,de_rieng_json=?,trang_thai=\'da_nop\' WHERE id=?').run(
   JSON.stringify([{qid:LOG,phan:'II',text:'Bốn ý snapshot',luaChon:['Ý a mới','Ý b mới','Ý c mới','Ý d mới']}]),
   JSON.stringify([{qid:LOG,hien:GOC+'~yd2',phan:'II',dapAn:'DSSD',chot:'Chốt bốn ý',lyDo:[{khoa:'a',dung:true,ly:'Ý a đúng theo đề mới'}],buoc:[],ketQua:''}]),LUOT)
  const r=await hsHoiThay(d.env,{token,qid:LOG,luotId:LUOT,nguon:'tu_luyen'})
  expect(r).toMatchObject({ok:true,cau:{y:{a:'Ý a mới',d:'Ý d mới'}},loiGiaiChu:{dapAn:'DSSD',tung:[{id:'a',dung:true,viSao:'Ý a đúng theo đề mới'}]}})
 })
 it('băm snapshot trùng câu khác đang bảo vệ cũng khóa, kể cả mã gốc không nằm trong ca',async()=>{
  const {d,token}=await dung(GOC+'~bt1')
  await damBaoBangLoiGiai(d.env)
  const snap=await cauHoiThayTuLuyen(d.env,'E1',LUOT,LOG)
  d.sql.prepare("INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES('12-OTHER-III-4',?,'12-OTHER','tln','x')").run(snap!.bam)
  d.objects.set('ca/BT2.json',JSON.stringify({phanIII:[{id:'12-OTHER-III-4',text:'Bản chép snapshot',correct:'1315'}]}))
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,bat_dau,han_nop,cong_bo,bank_r2,pham_vi,cap_nhat_luc) VALUES('BT2','Bài tập','mo','baitap','12',?,?,'khong','ca/BT2.json','tu_do','x')").run(new Date(Date.now()-3600000).toISOString(),new Date(Date.now()+3600000).toISOString())
  expect(await hsHoiThay(d.env,{token,qid:LOG,luotId:LUOT,nguon:'tu_luyen',chiHoi:true})).toMatchObject({ok:false,khoa:'ca_chua_cong_bo'})
  expect(await nguCanhHoiTroLy(d.env,'E1',GOC+'~bt1',Date.now(),true,{luotId:LUOT,qidTrongLuot:LOG})).toMatchObject({ok:false,khoa:'ca_chua_cong_bo'})
 })
 it('chưa chấm không được tự khai đã làm để lấy đáp án; không nhận lượt người khác/câu giả',async()=>{
  const {d,token}=await dung(GOC+'~bt1')
  const r=await hsHoiThay(d.env,{token,qid:LOG,luotId:LUOT,nguon:'tu_luyen'})
  expect(r).toMatchObject({ok:true,chiHoi:true})
  expect(JSON.stringify(r)).not.toContain('1315')
  expect(await nguCanhHoiTroLy(d.env,'E2',GOC+'~bt1',Date.now(),false,{luotId:LUOT,qidTrongLuot:LOG})).toMatchObject({ok:false})
  expect(await nguCanhHoiTroLy(d.env,'E1','FAKE',Date.now(),false,{luotId:LUOT,qidTrongLuot:LOG})).toMatchObject({ok:false})
  d.env.GEMINI_API_KEY='gia-lap'
  let prompt=''
  const kq=await traLoiHoiThem(d.env,'E1',{qid:GOC+'~bt1',luotId:LUOT,qidTrongLuot:LOG,nguon:'tu_luyen',cauHoi:'Em đếm H thế nào?',dangLam:false},{goiAi:async(_key,_cfg,nd)=>{prompt=JSON.stringify(nd);return {ok:true,chu:'{"lienQuan":true,"traLoi":"Em đếm từng nhóm."}',vao:1,ra:1}}})
  expect(kq).toMatchObject({ok:true,dangLam:true})
  expect(prompt).toContain('Nội dung snapshot đã thay')
 })
 it('câu gốc vừa vào ca chưa công bố vẫn khóa snapshot biến thể',async()=>{
  const {d,token}=await dung(GOC+'~bt1')
  d.objects.set('ca/BT1.json',JSON.stringify({phanIII:[{id:GOC,text:'Nội dung gốc',correct:'1'}]}))
  d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,loai,lop,bat_dau,han_nop,cong_bo,bank_r2,pham_vi,cap_nhat_luc) VALUES('BT1','Bài tập','mo','baitap','12',?,?,'khong','ca/BT1.json','tu_do','x')").run(new Date(Date.now()-3600000).toISOString(),new Date(Date.now()+3600000).toISOString())
  expect(await hsHoiThay(d.env,{token,qid:LOG,luotId:LUOT,nguon:'tu_luyen',chiHoi:true})).toMatchObject({ok:false,khoa:'ca_chua_cong_bo'})
 })
})
