// @vitest-environment node
import { afterEach,expect,it } from 'vitest'
import { taoKhoOmni,themChienDich,lam,T_SANG,HOM_NAY } from './omni-3-ke-hoach-chung'
import { dongBoBaHanhTrinh } from '../server/src/hanh-trinh-hop-nhat'
import { layKeHoachHomNay,xoaDemChienDich,tamHoanCauKhoa,docKeHoachDaChot } from '../server/src/srs2-d1'
import { damBaoBangBoTro } from '../server/src/cau-bo-tro'
import { damBaoBangLoiGiai } from '../server/src/loi-giai'
import { napLuot } from '../server/src/srs2-game'
import { laBanBu,gocNguonCau,chuanBiNguonCau,idDaLam,ganBanBu,taoNguonBanBu } from '../server/src/hanh-trinh-nguon-cau'
import { quanSatDocLap } from '../server/src/hanh-trinh-quan-sat'
import { docSuKienOmni,qCuaCau,xoaDemOmni } from '../server/src/omni-d1'
import {dongCoHanhTrinh} from '../server/src/hanh-trinh-dong-co'
import {phHoc2} from '../server/src/ph-bao-cao-moi'
const dong:ReturnType<typeof taoKhoOmni>[]=[]
afterEach(()=>{for(const k of dong.splice(0))k.d.sql.close();xoaDemChienDich();xoaDemOmni()})
async function kho(n:number,ban=true){
 const k=taoKhoOmni({'DH-B0':0,'DH-B1':n,'DH-B2':0,'DH-B3':0,'KHO-A':0});dong.push(k)
 for(const id of k.qids('DH-B1')){
  const row=k.d.sql.prepare('SELECT json FROM game_v2_question WHERE qid=?').get(id) as {json:string}
  k.d.sql.prepare('UPDATE game_v2_question SET json=? WHERE qid=?').run(JSON.stringify({...JSON.parse(row.json),phan:'I',mucDo:'NB',sao:0,choices:['a','b','c','d'],correct:'B'}),id)
 }
 themChienDich(k.d,{id:'nguon',maDe:['DH-B1'],qids:k.qids('DH-B1'),sbd:['S1','S2'],taoLuc:'2026-10-01T02:00:00Z',hanNop:HOM_NAY})
 await damBaoBangBoTro(k.env);await damBaoBangLoiGiai(k.env)
 if(ban)for(const id of k.qids('DH-B1')){
  const bam='bam-'+id
  k.d.sql.prepare('INSERT INTO loi_giai_cau(qid,bam,ma_de,dang,cap_nhat_luc) VALUES(?,?,?,?,?)').run(id,bam,'DH-B1','d','x')
  const ss=[0,1,2,3].map(i=>({de:`Bài riêng ${id} lần ${i}: tính khối lượng khi số mol bằng ${i+2}.`,pa:{A:'1',B:'2',C:'3',D:'4'},dap_an:'C',buoc:['Tính theo số mol.']}))
  k.d.sql.prepare("INSERT INTO cau_bo_tro(bam,qid_mau,song_sinh_json,cau_kiem_json,nhan_nen_json,buoc_json,cap_nhat_luc) VALUES(?,?,?,'[]','[]','[]','x')").run(bam,id,JSON.stringify(ss))
 }
 await dongBoBaHanhTrinh(k.env,T_SANG);return k
}
it('12 câu gốc có bản kiểm chứng tạo đủ24, nạp/chấm được và không khử nhầm như bản sao',async()=>{
 const k=await kho(12),{kh,hs}=await layKeHoachHomNay(k.env,'S1',T_SANG)
 expect(kh.tong).toBe(24);expect(kh.hanhTrinh?.conThieu).toBe(0)
 expect((await phHoc2(k.env,{sbd:'S1'},T_SANG)).homNay).toEqual({tong:24,daLam:0})
 const ids=[...kh.dao,...kh.doan],ao=ids.filter(laBanBu);expect(ao).toHaveLength(12)
 const sach=await tamHoanCauKhoa(k.env,kh,hs,Promise.resolve(new Set()),Promise.resolve(new Set()),'S1');expect(sach.tong).toBe(24)
 const day=await napLuot(k.env,hs,ao,new Set(),'tb',6);expect(day).toHaveLength(6)
 expect(day.every(x=>x.q.qid.includes('~ss')&&x.q.correct==='C'&&x.lamLai?.tc===gocNguonCau(x.q.qid))).toBe(true)
 for(const [i,id] of ids.entries())await lam(k.env,'S1',id,T_SANG+1000+i,true,{cauVersion:'v1',raw:{tc:gocNguonCau(id)}})
 const next=await layKeHoachHomNay(k.env,'S1',T_SANG+5000);expect(next.kh.hanhTrinh?.daLam).toBe(24)
 expect(next.kh.conDao.length+next.kh.conDoan.length).toBe(0)
 const doc=await docKeHoachDaChot(k.env,'S1',T_SANG+6000);expect(doc!.conDao.length+doc!.conDoan.length).toBe(0)
 expect((await phHoc2(k.env,{sbd:'S1'},T_SANG+6000)).homNay).toEqual({tong:24,daLam:24})
 const events=(await docSuKienOmni(k.env,['S1'])).get('S1')??[],q=await qCuaCau(k.env,ids)
 expect(quanSatDocLap('S1',events,q,T_SANG+6000)).toHaveLength(12)
})
it('24 câu gốc chuẩn bị thêm24 câu dự phòng nhưng không bắt học sinh làm48',async()=>{
 const k=await kho(24),{kh}=await layKeHoachHomNay(k.env,'S1',T_SANG)
 expect(kh.tong).toBe(24)
 const row=k.d.sql.prepare('SELECT du_phong_json FROM hanh_trinh_nguon_cau WHERE sbd=? AND ngay=?').get('S1',HOM_NAY) as {du_phong_json:string}
 expect(JSON.parse(row.du_phong_json)).toHaveLength(24)
})
it('không có mẫu/nguồn thật thì ghi thiếu, không tạo câu hoặc báo đủ giả',async()=>{
 const k=await kho(5,false),{kh}=await layKeHoachHomNay(k.env,'S1',T_SANG)
 expect(kh.tong).toBe(5);expect(kh.hanhTrinh?.conThieu).toBe(19)
 const row=k.d.sql.prepare('SELECT thieu_json FROM hanh_trinh_nguon_cau WHERE sbd=?').get('S1') as {thieu_json:string}
 expect(JSON.parse(row.thieu_json).length).toBeGreaterThan(0)
})
it('chuẩn bị nền không chạy khi ca mở; định danh nhiệm vụ tách khỏi bằng chứng gốc',async()=>{
 const k=await kho(12);k.d.sql.prepare("INSERT INTO ca(ma_ca,ten_ca,trang_thai,cap_nhat_luc) VALUES('gia','gia','mo','x')").run()
 expect(await chuanBiNguonCau(k.env,T_SANG)).toEqual({daQuet:0,hoan:true})
 expect(idDaLam({qid:'q~ss0',tc:'q'},new Set(['q','q~ss0']))).toBe('q~ss0')
 expect(idDaLam({qid:'q~ss0',tc:'q'},new Set(['q']))).toBe('q')
})

it('loại bản trùng nội dung, bản sai cấu trúc và bảo vệ cả gốc của bản đã giao',async()=>{
 const k=await kho(12),{kh,hs}=await layKeHoachHomNay(k.env,'S1',T_SANG)
 const root=gocNguonCau([...kh.dao,...kh.doan].find(laBanBu)!)
 const row=k.d.sql.prepare('SELECT song_sinh_json FROM cau_bo_tro WHERE qid_mau=?').get(root) as {song_sinh_json:string}
 const ss=JSON.parse(row.song_sinh_json);ss[1]=ss[0];ss[2]={de:'Sai',dap_an:'Z'}
 k.d.sql.prepare('UPDATE cau_bo_tro SET song_sinh_json=? WHERE qid_mau=?').run(JSON.stringify(ss),root)
 const ids=await ganBanBu(k.env,'S1',hs,[root+'~ss0',root+'~ss1',root+'~ss2',root+'~ss99'])
 expect(ids).toEqual([root+'~ss0'])
 const clean=await tamHoanCauKhoa(k.env,kh,hs,Promise.resolve(new Set([root])),Promise.resolve(new Set()),'S1')
 expect([...clean.dao,...clean.doan].some(id=>gocNguonCau(id)===root)).toBe(false)
})
it('chuẩn bị nền cho học sinh chưa mở app và không giao lại cho em đã có nguồn hôm nay',async()=>{
 const k=await kho(12)
 expect(await chuanBiNguonCau(k.env,T_SANG)).toEqual({daQuet:2,hoan:false})
 expect(await chuanBiNguonCau(k.env,T_SANG+60000)).toEqual({daQuet:1,hoan:false})
 expect(await chuanBiNguonCau(k.env,T_SANG+120000)).toEqual({daQuet:0,hoan:false})
 expect(k.d.sql.prepare('SELECT COUNT(*) n FROM hanh_trinh_nguon_cau').get()).toEqual({n:3})
})
it('bổ sung kho lần đầu giữa chặng giữ nhiệm vụ còn hợp lệ và phần đã làm',async()=>{
 const k=await kho(24),first=await layKeHoachHomNay(k.env,'S1',T_SANG)
 const ids=[...first.kh.dao,...first.kh.doan]
 await lam(k.env,'S1',ids[0]!,T_SANG+1000,true)
 k.d.sql.prepare('DELETE FROM hanh_trinh_nguon_cau WHERE sbd=?').run('S1') // Chỉ fixture: mô phỏng kế hoạch cũ trước khi có bảng nguồn.
 const next=await layKeHoachHomNay(k.env,'S1',T_SANG+2000)
 expect(new Set([...next.kh.dao,...next.kh.doan])).toEqual(new Set(ids))
 expect(next.kh.hanhTrinh?.daLam).toBe(1)
})

it('không bù bằng bản khác của câu đã thạo nhưng chưa đến lịch ôn',async()=>{
 const k=await kho(12),{hs}=await layKeHoachHomNay(k.env,'S1',T_SANG)
 const engine=await dongCoHanhTrinh(k.env,'S1',T_SANG,hs,new Set(),false)
 for(const [id,t] of hs.tt)hs.tt.set(id,{...t,thanhThao:true,henOn:'2026-10-10'})
 expect(await taoNguonBanBu(k.env,'S1',HOM_NAY,hs,engine.v5!,new Set(),[],24)).toEqual([])
})
