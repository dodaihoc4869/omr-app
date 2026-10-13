// Mô phỏng một hồ sơ đại diện mỗi lớp trên nguồn thật, không DDL/lập lịch/ghi sổ, không in danh tính/đáp án.
import type { Env } from '../server/src/kieu'
import { lapKtCn } from '../server/src/kiem-tra-ca-nhan'
import { sqlTenLopHs } from '../server/src/goi-bai-7'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account)throw new Error('Thiếu cấu hình Cloudflare.')
const db={prepare(sql:string){if(!/^\s*(SELECT|WITH)\b/.test(sql))throw new Error('Mô phỏng chỉ đọc.');const st={params:[] as unknown[],bind(...p:unknown[]){st.params=p;return st},async all<T>(){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(30000)});const j=await r.json() as {success?:boolean;result?:{success:boolean;results:T[];meta:{changes:number}}[]};if(!r.ok||!j.success||!j.result?.[0]?.success)throw new Error(`Không mô phỏng được (${r.status}).`);return j.result[0]},async first<T>(){return(await st.all<T>()).results[0]??null},async run(){throw new Error('Mô phỏng không ghi.')}};return st},async batch(ds:{all:()=>Promise<unknown>}[]){return Promise.all(ds.map(s=>s.all()))}}
const env={DB:db} as unknown as Env
const r=await db.prepare(`SELECT MIN(h.sbd) sbd FROM hoc_sinh h WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM bai_da_day b WHERE b.lop=${sqlTenLopHs('h')} AND b.bo_tick_luc IS NULL) GROUP BY ${sqlTenLopHs('h')}`).all<{sbd:string}>()
for(const em of r.results){const d=await lapKtCn(env,em.sbd,Date.now(),true,true);if(d){const {id,...du}=d;if('maTran2026' in du){const mt=du.maTran2026 as {chuaPhu:string[];soChuaPhu?:number};mt.soChuaPhu=mt.chuaPhu.length;mt.chuaPhu=mt.chuaPhu.slice(0,12)}console.log(JSON.stringify({moPhongKtCnV2:true,chiDoc:true,...du}))}}
