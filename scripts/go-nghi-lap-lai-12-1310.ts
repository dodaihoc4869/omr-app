// Claude 13/10 (thầy: "Bạn tự làm hết nhé") — khối 12 "Đang chuẩn bị" vì câu DUY NHẤT cùng khối có kỹ năng "dùng giá trị trung bình"
// (DH-12-C1-B1-P2 Phần II câu 15) đang bị nghi đáp án (6/10 lượt sai, tu-hoan-thien 11/10). Claude đã giải lại đủ 4 ý: đáp án kho ĐÚNG ⇒
// 1) chốt câu nghi = 'dung_dap_an' (đúng như nút /gv/cau-nghi/xu-ly, chỉ một dòng) · 2) lập lại đề Hóa 2026 cho em khối 12 còn lịch "chuẩn bị"
// (tuần tự, kiểm ca mở mỗi 10 em; cổng ghi của lapKtCn chỉ sửa lịch chưa mở, chưa làm) · 3) in số đếm theo lớp. Không in đề/đáp án/danh tính.
import type { Env } from '../server/src/kieu'
import { lapKtCn } from '../server/src/kiem-tra-ca-nhan'
import { query } from './kiem-phat-hanh-chua.mjs'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account)throw new Error('Thiếu cấu hình Cloudflare.')
const db={prepare(sql:string){const st={sql,params:[] as unknown[],bind(...params:unknown[]){st.params=params;return st},async all<T>(){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(30000)});const j=await r.json() as {success?:boolean;result?:{success:boolean;results:T[];meta:{changes:number}}[]};if(!r.ok||!j.success||!j.result?.[0]?.success)throw new Error(`Không đọc/ghi được D1 (${r.status}).`);return j.result[0]},async first<T>(){return (await st.all<T>()).results[0]??null},async run(){return st.all()}};return st},async batch(stmts:{all:()=>Promise<unknown>}[]){const out=[];for(const st of stmts)out.push(await st.all());return out}}
const env={DB:db} as unknown as Env
const QID='DH-12-C1-B1-P2-II-15'
const go=await db.prepare(`UPDATE cau_nghi_dap_an SET trang_thai='dung_dap_an',ghi_chu=? WHERE qid=? AND trang_thai='nghi'`).bind('Claude 13/10 giải lại đủ 4 ý: đáp án kho đúng; tỉ lệ sai cao do câu vận dụng khó.',QID).run() as {meta?:{changes?:number}}
const con=(await query(`SELECT trang_thai FROM cau_nghi_dap_an WHERE qid='${QID}'`))[0]
console.log(JSON.stringify({goNghi:go.meta?.changes??0,trangThaiNay:con?.trang_thai}))
if(con?.trang_thai==='nghi')throw new Error('Câu vẫn đang nghi: dừng.')
const daThu:string[]=[]
let daLap=0,loiLap=0
for(let i=0;i<300;i++){
  if(i%10===0&&Number((await query(`SELECT COUNT(*) n FROM ca WHERE trang_thai='mo'`))[0]?.n))throw new Error('Ca vừa mở: dừng lập lại.')
  const em=await db.prepare(`SELECT k.sbd FROM kiem_tra_ca_nhan k WHERE k.lop LIKE '12%' AND k.trang_thai='cho_nguon' AND k.mo_luc>?1 AND k.nop_luc IS NULL AND k.sbd NOT IN(SELECT value FROM json_each(?2)) AND NOT EXISTS(SELECT 1 FROM kiem_tra_ca_nhan x WHERE x.sbd=k.sbd AND x.trang_thai<>'cho_nguon' AND x.han_luc>?1) GROUP BY k.sbd ORDER BY MIN(k.ngay) LIMIT 1`).bind(Date.now(),JSON.stringify(daThu)).first<{sbd:string}>()
  if(!em)break
  daThu.push(em.sbd)
  try{if(await lapKtCn(env,em.sbd,Date.now(),true,false,true))daLap++}catch{loiLap++}
  if(i%20===19)console.log(JSON.stringify({dangLapLai12:true,daThu:daThu.length,daLap,loiLap}))
}
console.log(JSON.stringify({lapLai12:true,daThu:daThu.length,daLap,loiLap}))
const ketQua=await query(`SELECT k.lop,k.trang_thai tt,COUNT(*) n,COUNT(DISTINCT k.sbd) em FROM kiem_tra_ca_nhan k WHERE k.han_luc>${Date.now()} AND k.lop LIKE '12%' GROUP BY 1,2 ORDER BY 1,2`)
console.log('ketQua12',JSON.stringify(ketQua))
