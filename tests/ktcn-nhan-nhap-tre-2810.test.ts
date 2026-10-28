// @vitest-environment node
// Thầy 28/10: máy chủ bận lúc em làm Kiểm tra ôn tập ⇒ bản nháp gửi muộn vẫn được nhận nếu MỐC EM TRẢ LỜI còn trong hạn.
// Giả định chống gian lận: chỉ trong 10 phút sau hạn (GUI_TRE_MS), mốc ≤ hạn chặng, ≥ lúc mở chặng, ≤ giờ máy chủ nhận + 5 giây; bài đã nộp ⇒ không nhận.
import { afterEach, expect, it } from 'vitest'
import { taoKhoOmni } from './omni-3-ke-hoach-chung'
import { damBaoBangBaiDaDay, xoaDemPhamVi } from '../server/src/bai-da-day'
import { lapKtCn as lapKtCnThat, docKtCn, ktCnAction, GUI_TRE_MS } from '../server/src/kiem-tra-ca-nhan'

const lapKtCn=(env:Parameters<typeof lapKtCnThat>[0],sbd:string,now:number)=>lapKtCnThat(env,sbd,now,false,false,false)
const NOW=Date.parse('2026-10-13T02:00:00Z')
afterEach(()=>{xoaDemPhamVi()})
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
 await lapKtCn(k.env,'S1',NOW)
 const r=(await docKtCn(k.env,'S1',NOW))!,id=String(r.id),now=Number(r.mo_luc)+1000
 const start=await ktCnAction(k.env,'S1','hoc-tap-ktcn-start',{id,chang:0},now)
 const qs=(start.questions as {qid:string}[]).map(q=>q.qid)
 const tra=async()=>JSON.parse(String((await docKtCn(k.env,'S1',now))!.tra_json)) as Record<string,string>
 return {k,r,id,now,han:Number(start.hanChang),q0:qs[0]!,q1:qs[1]!,tra}
}

it('gửi muộn trong 10 phút: nhận câu có mốc trước hạn, bỏ câu mốc sau hạn; gửi lại y hệt không ghi đôi',async()=>{
 const {k,id,now,han,q0,q1,tra}=await kho()
 const payload={id,chang:0,revision:0,tra:{[q0]:'A',[q1]:'B'},lucTra:{[q0]:han-2000,[q1]:han+3000}}
 const kq=await ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',payload,han+60_000)
 expect(kq).toMatchObject({daLuu:true,daChot:true})
 expect(await tra()).toMatchObject({[q0]:'A'})
 expect((await tra())[q1]??'').toBe('')
 const rev=Number(k.d.sql.prepare('SELECT revision FROM kiem_tra_ca_nhan WHERE id=?').get(id)!.revision)
 expect(await ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',payload,han+90_000)).toMatchObject({daLuu:true})
 expect(await tra()).toMatchObject({[q0]:'A'})
 expect(Number(k.d.sql.prepare('SELECT revision FROM kiem_tra_ca_nhan WHERE id=?').get(id)!.revision)).toBe(rev+1)
 expect(now).toBeLessThan(han)
})

it('quá 10 phút sau hạn, mốc trước lúc mở chặng, mốc vượt giờ nhận, hoặc không gửi mốc ⇒ không nhận',async()=>{
 const {k,id,now,han,q0,tra}=await kho()
 const goi=(lucTra:Record<string,number>|undefined,luc:number)=>ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',{id,chang:0,revision:0,tra:{[q0]:'C'},...(lucTra?{lucTra}:{})},luc)
 expect(await goi({[q0]:han-1000},han+GUI_TRE_MS+1)).toMatchObject({daLuu:false})
 expect(await goi({[q0]:now-60_000},han+1000)).toMatchObject({daLuu:false})
 expect(await goi(undefined,han+1000)).toMatchObject({daLuu:false})
 expect((await tra())[q0]??'').toBe('')
})

it('bài đã nộp (lượt nộp THÀNH CÔNG thật) ⇒ nháp muộn, kể cả mốc trước hạn, không được nhận',async()=>{
 const {k,id,han,q0,tra}=await kho()
 const chot=await ktCnAction(k.env,'S1','hoc-tap-ktcn-chot-chang',{id,chang:0,revision:0,tra:{}},han-500)
 expect(chot).toMatchObject({ok:true,daChot:true})
 const nop=await ktCnAction(k.env,'S1','hoc-tap-ktcn-nop',{id},han+1000)
 expect(nop.ok).toBe(true)
 expect(Number((nop.kiemTra as {nopLuc:unknown}).nopLuc)).toBeGreaterThan(0)
 expect((await docKtCn(k.env,'S1',han))!.nop_luc).toBeTruthy()
 const truoc=JSON.stringify(await tra())
 const kq=await ktCnAction(k.env,'S1','hoc-tap-ktcn-luu',{id,chang:0,revision:0,tra:{[q0]:'D'},lucTra:{[q0]:han-1000}},han+2000)
 expect(kq).toMatchObject({ok:true,daNop:true})
 expect(kq.daLuu).toBeUndefined()
 expect(JSON.stringify(await tra())).toBe(truoc)
 expect((await tra())[q0]??'').toBe('')
})
