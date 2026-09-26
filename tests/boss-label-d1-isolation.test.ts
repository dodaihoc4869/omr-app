// @vitest-environment node
import { it, expect } from 'vitest'
import { taoD1That } from './_d1-that'
import { daHocDang } from './_pham-vi-ca-nhan'
import { chonCauBaiHangNgay } from '../server/src/parent-news-nguon-cau'
import { chonCauThuThach } from '../server/src/thu-thach-rieng'

it('actual parent D1 source uses only requested learner history and preserves authorized pool', async()=>{
 const d=taoD1That(),ma='D.A.X',now=Date.parse('2026-09-24T06:00:00Z')
 d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','One','12','x'),('S2','Two','12','x'); INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('D','D','12',5,'kho/D.json',0,'v1'); INSERT INTO game_v2_index VALUES('D','v1','x')")
 const specs=[['00-scope',['A','B'],'van_dung'],['eA',['A'],'van_dung'],['eB',['B'],'van_dung'],['a',['A'],'hieu'],['b',['B'],'hieu'],['forbidden',['NOT-LEARNED'],'hieu']] as const
 for(const [qid,kt,muc] of specs){
  const q={qid,maDe:'D',version:'v',group:'g-'+qid,phan:'I',text:`Nội dung ${qid}.`,choices:['A. a','B. b','C. c','D. d'],ideas:[],hinhAnh:[],dang:ma,mucDo:muc,kienThuc:kt,correct:'B',reviewed:true,solution:'',sao:1}
  d.sql.prepare('INSERT INTO game_v2_question VALUES(?,?,?,?,?,?)').run('D',qid,'v',q.group,ma,JSON.stringify(q))
 }
 for(const sbd of ['S1','S2']){
  daHocDang(d,sbd,ma)
  d.sql.prepare("INSERT INTO nam_kt_dang(khoa,sbd,ma_dang,so_gap,so_sai,so_da_khac_phuc,so_moi_sai,so_chua_thay_sai,bac,cap_nhat_luc) VALUES(?,?,?,8,6,0,6,2,1,'x')").run(sbd,sbd,ma)
  const qid=sbd==='S1'?'eA':'eB'
  d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,luc_cuoi,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,1,1,0,0,0,'btvn','2026-09-01','moi_sai','x')").run(sbd,sbd,qid,ma)
 }
 expect((await chonCauBaiHangNgay(d.env,'S1',1,now)).chon.map(q=>q.qid)).toEqual(['a'])
 expect((await chonCauBaiHangNgay(d.env,'S2',1,now)).chon.map(q=>q.qid)).toEqual(['b'])
 // Neither unknown-label candidate nor above-level historical evidence can be selected.
 const all=await chonCauBaiHangNgay(d.env,'S1',6,now)
 expect(all.chon.map(q=>q.qid).sort()).toEqual(['a','b'])
 d.sql.close()
})
it('challenge applies labels within difficulty and respects exclusions',()=>{
 const ungVien=[{qid:'old',dang:'D',muc:2 as const,kienThuc:['A']},{qid:'a',dang:'D',muc:1 as const,kienThuc:['A']},{qid:'b',dang:'D',muc:1 as const,kienThuc:['B']}]
 const p={sbd:'S1',ngay:'2026-09-24',dang:['D'],soCau:1,mucNhamTheoDang:new Map([['D',1]]),ungVien,loaiTru:new Set(['old']),lichSu:new Map([['old',{sai:true,dung:false,daDungLai:false}]])}
 expect(chonCauThuThach(p).qid).toEqual(['a'])
 expect(chonCauThuThach({...p,loaiTru:new Set(['old','a'])}).qid).toEqual(['b'])
})

import { cauKhacPhucGoi } from '../server/src/goi-cu'
it.each([true,false])('remediation actual D1/R2 labels rank within level, preserve done exclusion (by type=%s)',async(byType)=>{
 const d=taoD1That(),ma='ES.A.X'
 d.sql.exec("INSERT INTO hoc_sinh(sbd,ho_ten,lop,cap_nhat_luc) VALUES('S1','One','12','x'),('S2','Two','12','x'); INSERT INTO de_kho(ma_de,ten_de,lop,so_cau,r2_khoa,da_xoa,cap_nhat_luc) VALUES('D','D','12',4,'kho/D.json',0,'v1'); INSERT INTO game_v2_index VALUES('D','v1','x')")
 const raw=[1,2,3,4].map(so=>({phan:'I',so,de:`Câu ${so}`,pa:{A:'a',B:'b',C:'c',D:'d'},dap_an:'B',dang:{ma},mucDo:'hieu',kienThuc:[so%2?'A':'B']}))
 await d.env.DE.put('kho/D.json',JSON.stringify({ma_de:'D',cau:raw}))
 for(const c of raw){
  const qid=`D-I-${c.so}`
  d.sql.prepare("INSERT INTO cau_hoi(qid,ma_de,chuyen_de,muc_do,phan,lop,co_loi_giai,cap_nhat_luc) VALUES(?,'D','CD1','hieu','I','12',1,'x')").run(qid)
  d.sql.prepare('INSERT INTO game_v2_question VALUES(?,?,?,?,?,?)').run('D',qid,'v','g'+qid,ma,JSON.stringify({qid,dang:ma,kienThuc:c.kienThuc}))
 }
 for(const sbd of ['S1','S2']){
  for(const qid of ['D-I-1','D-I-2'])d.sql.prepare('INSERT INTO qid_da_lam VALUES(?,?,?,?,1)').run(sbd+qid,sbd,qid,'2026-09-01')
  const qid=sbd==='S1'?'D-I-1':'D-I-2'
  d.sql.prepare("INSERT INTO nam_kt_cau(khoa,sbd,qid,ma_dang,lan_gap,lan_sai,lan_trong,dung_lien_tiep,ngay_dung_khac_nhau,nguon_cuoi,luc_cuoi,trang_thai,cap_nhat_luc) VALUES(?,?,?,?,1,1,0,0,0,'btvn','2026-09-01','moi_sai','x')").run(sbd,sbd,qid,ma)
 }
 const request={chuyenDe:['CD1'],soCau:1,...(byType?{dsDang:[ma]}:{})}
 expect((await cauKhacPhucGoi(d.env,{...request,sbd:'S1'})).thuTu).toEqual(['D-I-3'])
 expect((await cauKhacPhucGoi(d.env,{...request,sbd:'S2'})).thuTu).toEqual(['D-I-4'])
 d.sql.close()
})
