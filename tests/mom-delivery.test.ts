import {it,expect,vi} from 'vitest'
import {mom,gradeMom} from '../server/src/mom'
import type {Env} from '../server/src/kieu'
vi.mock('../server/src/game-v2-auth',()=>({gameIdentity:async(_e:unknown,b:any)=>{if(b.token!=='student')throw Error('login');return 'S1'}}))
function setup(){
 const rows=new Map<string,any>(), bank=new Map<string,string>()
 const env={DE:{put:async(k:string,v:string)=>bank.set(k,v),get:async(k:string)=>bank.has(k)?{body:bank.get(k)}:null},DB:{prepare:(sql:string)=>({bind:(...a:any[])=>({
 first:async()=>sql.includes('hoc_sinh')?(a[0]==='S1'?{sbd:'S1'}:null):rows.get(`${a[0]}:${a[1]}`)||null,
 all:async()=>({results:[...rows.values()].filter(r=>r.sbd===a[0])}),
 run:async()=>{
 if(sql.includes('ph_truy_cap'))return {success:true} // đếm truy cập phụ huynh (ph-truy-cap.ts): ghi thêm một dòng riêng, không phải bài Mom
 if(sql.startsWith('INSERT')){const key=`${a[0]}:${a[1]}`;if(!rows.has(key))rows.set(key,{sbd:a[0],id:a[1],title:a[2],created_at:a[3],question_count:a[4],bank_key:a[5],started_at:null,submitted_at:null,answers:'{}',result:null})}
 else if(sql.includes('started_at=COALESCE')){const r=rows.get(`${a[1]}:${a[2]}`);if(r&&!r.submitted_at)r.started_at ||= a[0]}
 else if(sql.includes('result=?')){const r=rows.get(`${a[3]}:${a[4]}`);if(r&&!r.submitted_at){r.answers=a[0];r.result=a[1];r.submitted_at=a[2]}}
 else {const r=rows.get(`${a[1]}:${a[2]}`);if(r&&!r.submitted_at)r.answers=a[0]}
 return {success:true}
 }})})}} as unknown as Env
 return {env,rows,bank}
}
const assignment={sbd:'S1',id:'mom_1',tieuDe:'Ôn bài',dsCau:[{id:'q1',text:'Câu 1',dapAn:'A'},{id:'q2',text:'Câu 2',dapAn:'B'}]}
it('giao trên thiết bị phụ huynh, học sinh độc lập nhận được; trạng thái chưa làm chính xác',async()=>{const {env}=setup();await mom(env,'create',assignment);const result:any=await mom(env,'list',{token:'student'});expect(result.items).toHaveLength(1);expect(result.items[0].trangThai).toBe('chua_lam');expect(result.items[0].dsCau).toBeUndefined()})
it('retry không tạo trùng, không thay nội dung hay reset thời gian',async()=>{const {env,bank}=setup();await mom(env,'create',assignment);const a:any=await mom(env,'start',{token:'student',id:'mom_1'});await mom(env,'create',{...assignment,dsCau:[{id:'bad'}]});const b:any=await mom(env,'start',{token:'student',id:'mom_1'});expect(b.item.batDauLuc).toBe(a.item.batDauLuc);expect(b.item.dsCau).toHaveLength(2);expect(bank.size).toBe(1)})
it('không dùng SBD gửi lên để giả học sinh khác và không nộp khi thiếu token',async()=>{const {env}=setup();await mom(env,'create',assignment);await expect(mom(env,'submit',{id:'mom_1',sbd:'S1'})).rejects.toThrow('login');await expect(mom(env,'start',{token:'student',id:'other',sbd:'S2'})).rejects.toThrow('chưa được gửi')})
it('lưu đáp án, mở lại không mất bài; nộp chấm máy chủ và phụ huynh thấy điểm',async()=>{const {env}=setup();await mom(env,'create',assignment);await mom(env,'start',{token:'student',id:'mom_1'});await mom(env,'save',{token:'student',id:'mom_1',answers:{q1:'A'}});const resumed:any=await mom(env,'start',{token:'student',id:'mom_1'});expect(resumed.item.dapAnDaNop).toEqual({q1:'A'});await mom(env,'submit',{token:'student',id:'mom_1',answers:{q1:'A',q2:'A'},diem:10});const parent:any=await mom(env,'parent-list',{sbd:'S1'});expect(parent.items[0]).toMatchObject({trangThai:'da_nop',diem:5,soCauDung:1});const again:any=await mom(env,'submit',{token:'student',id:'mom_1',answers:{q1:'A',q2:'B'}});expect(again.item.diem).toBe(5)})
it('quá giờ dùng đáp án đã lưu, không nhận sửa điểm sau giờ',async()=>{const {env,rows}=setup();await mom(env,'create',assignment);await mom(env,'start',{token:'student',id:'mom_1'});rows.get('S1:mom_1').started_at=new Date(Date.now()-8000000).toISOString();rows.get('S1:mom_1').answers='{"q1":"A"}';await expect(mom(env,'save',{token:'student',id:'mom_1',answers:{q1:'B'}})).rejects.toThrow('hết giờ');const r:any=await mom(env,'submit',{token:'student',id:'mom_1',answers:{q1:'A',q2:'B'}});expect(r.item.diem).toBe(5)})
it('quy tắc chấm giữ nguyên trọng số từng câu và bỏ khoảng trắng',()=>{expect(gradeMom([{id:'a',dapAn:'DSDS'},{id:'b',dapAn:'2,5'}],{a:' dsds ',b:'2,5'})).toEqual({diem:10,soCauDung:2})})
it('máy chủ không lưu được nội dung thì không báo thành công',async()=>{const {env,rows}=setup();env.DE.put=async()=>{throw Error('offline')};await expect(mom(env,'create',assignment)).rejects.toThrow('offline');expect(rows.size).toBe(0)})
