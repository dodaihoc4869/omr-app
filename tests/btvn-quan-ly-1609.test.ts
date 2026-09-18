import {it,expect} from 'vitest'
import worker from '../server/src/index'
import type {Env} from '../server/src/kieu'
function setup(){const row={ma_btvn:'BT1',da_xoa:0,han_nop:'2030-01-01T00:00:00Z'},calls:string[]=[];const env={MA_BI_MAT:'teacher',DB:{prepare:(sql:string)=>{calls.push(sql);return {bind:(...a:any[])=>({first:async()=>row.da_xoa===0&&a[0]==='BT1'?row:null,run:async()=>{if(sql.includes('SET da_xoa=1'))row.da_xoa=1;else if(sql.includes('SET han_nop='))row.han_nop=a[0];return {success:true}}})}}}} as unknown as Env;return {env,row,calls}}
const req=(body:any,secret='teacher')=>new Request('https://app/btvn/sua',{method:'POST',headers:{'content-type':'application/json','x-ma-bi-mat':secret},body:JSON.stringify(body)})
it('học sinh không thể thu hồi bài hoặc sửa deadline',async()=>{const {env,row}=setup();const r=await worker.fetch(req({maBtvn:'BT1',thuHoi:true},'wrong'),env);expect(r.status).toBe(403);expect(row.da_xoa).toBe(0)})
it('thu hồi chỉ đánh dấu bài, không xóa đáp án/kết quả của 91 em',async()=>{const {env,row,calls}=setup();const r=await worker.fetch(req({maBtvn:'BT1',thuHoi:true}),env);expect(await r.json()).toMatchObject({ok:true});expect(row.da_xoa).toBe(1);expect(calls.some(s=>/DELETE|UPDATE btvn_em/i.test(s))).toBe(false)})
it('đặt hạn mới có hiệu lực và không nhận hạn quá khứ',async()=>{const {env,row}=setup();const next=new Date(Date.now()+86400000).toISOString();expect((await (await worker.fetch(req({maBtvn:'BT1',hanNop:next}),env)).json() as any).ok).toBe(true);expect(row.han_nop).toBe(next);expect((await (await worker.fetch(req({maBtvn:'BT1',hanNop:'2000-01-01'}),env)).json() as any).ok).toBe(false);expect(row.han_nop).toBe(next)})
it('reset lưu ảnh chụp kết quả rồi mới mở lại, thu hồi chỉ tác động đúng học sinh',async()=>{
 for(const hanhDong of ['reset','thu-hoi']){
  const executed:{sql:string,args:any[]}[]=[]
  const env={MA_BI_MAT:'teacher',DB:{prepare:(sql:string)=>({bind:(...args:any[])=>({sql,args,first:async()=>sql.includes('FROM btvn_em')?{khoa:'BT1|1',sbd:'1',nop_luc:'2026-09-16',so_dung:9,dap_an_json:'{"q":"A"}'}:{ma_btvn:'BT1',han_nop:'2030-01-01T00:00:00Z'}})}),batch:async(st:any[])=>{executed.push(...st);return []}}} as unknown as Env
  const r=await worker.fetch(req({maBtvn:'BT1',sbd:'1',hanhDong}),env)
  expect(await r.json()).toMatchObject({ok:true})
  expect(executed[0].sql).toContain('INSERT INTO btvn_em_lich_su')
  expect(JSON.parse(executed[0].args[4]).so_dung).toBe(9)
  expect(executed[1].args).toEqual(['BT1|1'])
  expect(executed[1].sql).toContain(hanhDong==='reset'?'nop_luc=NULL':'thu_hoi=1')
 if(hanhDong==='reset')expect(executed[1].sql).toContain('xong_vong1_luc=NULL')
 }
})
it('reset riêng học sinh vẫn bắt buộc quyền giáo viên',async()=>{const {env}=setup();expect((await worker.fetch(req({maBtvn:'BT1',sbd:'1',hanhDong:'reset'},'wrong'),env)).status).toBe(403)})
