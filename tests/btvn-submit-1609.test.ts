import {it,expect} from 'vitest'
import worker from '../server/src/index'
import {nopKhacPhuc} from '../server/src/goi-cu'
import type {Env} from '../server/src/kieu'
function setup(){
 const bt={ma_btvn:'BT',ma_de:'D-DS,D-TLN',han_nop:'2099-01-01'},row:Record<string,unknown>={nop_luc:null,so_lan_lam:1,dap_an_json:null};let writes=0
 const env={DB:{prepare:(sql:string)=>({bind:(...a:unknown[])=>({first:async()=>sql.includes('FROM btvn_em')?row:bt,run:async()=>{writes++;row.nop_luc=a[0];row.so_dung=a[1];row.so_cau=a[2];row.dap_an_json=a[3];row.so_lan_lam=a[4];return {meta:{changes:1}}}})})},DE:{get:async()=>({body:JSON.stringify({cau:[{phan:'II',so:1,dap_an:'DSDD'},{phan:'III',so:1,dap_an:'0.39'}]})})}} as unknown as Env
 return {env,row,writes:()=>writes}
}
const answers={'D-DS,D-TLN-II-1':'DSDD','D-DS,D-TLN-III-1':'0,39'}
it('phiếu cũ nộp đúng mã ghép, lưu mã chuẩn; gửi lại không mất lượt',async()=>{
 const {env,row,writes}=setup()
 expect(await nopKhacPhuc(env,{ma:'BT',sbd:'1',dapAn:answers})).toMatchObject({ok:true,soDung:2,soCau:2,lanThu:1})
 expect(JSON.parse(String(row.dap_an_json))).toEqual({'D-II-1':'DSDD','D-III-1':'0,39'})
 expect(await nopKhacPhuc(env,{ma:'BT',sbd:'1',dapAn:answers})).toMatchObject({ok:true,daNhan:true,lanThu:1})
 expect(writes()).toBe(1)
})
it('đường nộp trực tiếp chấm ở máy chủ, bỏ điểm 0 hoặc điểm giả máy em gửi',async()=>{
 const {env,row}=setup()
 const res=await worker.fetch(new Request('https://test/btvn/nop',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({maBtvn:'BT',sbd:'1',dapAn:answers,soDung:0,soCau:999})}),env)
 expect(await res.json()).toMatchObject({ok:true,soDung:2,soCau:2});expect(row.so_dung).toBe(2)
})
it('mất kho đáp án không ghi điểm 0 đè bài',async()=>{
 const {env,writes}=setup();env.DE={get:async()=>null} as never
 await expect(nopKhacPhuc(env,{ma:'BT',sbd:'1',dapAn:answers})).rejects.toMatchObject({ma:'BTVN_GRADING_MATERIAL_INVALID'});expect(writes()).toBe(0)
})
it('chi tiết bài nộp yêu cầu xác thực giáo viên trước khi đọc',async()=>{
 const res=await worker.fetch(new Request('https://test/btvn/bai-lam',{method:'POST',headers:{'content-type':'application/json'},body:'{"maBtvn":"BT","sbd":"1"}'}),{MA_BI_MAT:'secret'} as Env)
 expect(res.status).toBe(403)
})
