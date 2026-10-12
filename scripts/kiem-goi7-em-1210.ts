// Chỉ đọc bằng hàm hiện hành của app. Không gọi đồng bộ, không tạo bảng/quota, không in tên/SBD/đáp án.
import type { Env } from '../server/src/kieu'
import { coGoi7, docGoiCuaEm7 } from '../server/src/goi-bai-7'
import { ngayVn7, quotaGoi7, soNgayCon7 } from '../server/src/goi-bai-7-loi'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID,sbd=process.env.SBD_CAN_DOC
if(!token||!account||!sbd)throw new Error('Thiếu cấu hình đọc.')
let soDoc=0
const db={
  prepare(sql:string){
    if(!/^\s*(SELECT|WITH)\b/i.test(sql)||/\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE|DROP|TRUNCATE|PRAGMA|VACUUM)\b/i.test(sql))throw new Error('Chặn câu lệnh không chỉ đọc.')
    const st={params:[] as unknown[],bind(...params:unknown[]){st.params=params;return st},async all<T>(){
      soDoc++
      const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(45000)})
      const j=await r.json() as {success?:boolean;result?:{success:boolean;results:T[];meta:unknown}[]}
      if(!r.ok||!j.success||!j.result?.[0]?.success)throw new Error(`Không đọc được dữ liệu (${r.status}).`)
      return j.result[0]
    },async first<T>(){return (await st.all<T>()).results[0]??null}}
    return st
  },async batch(ds:{all:()=>Promise<unknown>}[]){return Promise.all(ds.map(x=>x.all()))},withSession(){return db},
}
const env={DB:db} as unknown as Env
async function main(){
  const now=Date.now(),ngay=ngayVn7(now)
  const em=await db.prepare('SELECT sbd,trang_thai FROM hoc_sinh WHERE sbd=?').bind(sbd).first<{sbd:string;trang_thai:string}>()
  const co=await coGoi7(env)
  const goi=em?await docGoiCuaEm7(env,sbd!,now,true):[]
  const moi=[...new Set(goi.flatMap(g=>g.cau.filter(c=>!g.daGap.has(c.qid)).map(c=>c.qid)))],gap=[...new Set(goi.flatMap(g=>[...g.daGap]))]
  const ds=goi.map((g,i)=>{
    const con=g.cau.filter(c=>!g.daGap.has(c.qid))
    return {bai:i+1,batDau:g.batDau,han:g.han,nguonDayDu:g.nguonDayDu,tong:g.cau.length,daGap:g.daGap.size,con:con.length,
      conTheoPhan:{tracNghiem:con.filter(c=>c.phan==='I').length,dungSai:con.filter(c=>c.phan==='II').length,traLoiNgan:con.filter(c=>c.phan==='III').length},
      ngayCon:soNgayCon7(ngay,g.han),quotaHomNay:g.quota,gapMoiHomNay:g.gapNgay.size,conPhuHomNay:Math.max(0,g.quota-g.gapNgay.size),
      quaHan:ngay>g.han,quotaSauHanNeuConNguyen:quotaGoi7(con.length,'9999-12-31',g.han),
      cauConChuaHopLe:con.filter(c=>c.hopLe===false).length}
  })
  console.log(JSON.stringify({docGoi7:true,docLuc:new Date(now).toISOString(),ngayVn:ngay,coHocSinh:!!em,taiKhoanKhoa:em?.trang_thai==='khoa',bat:co.bat,soGoi:ds.length,cauMoiChuaGapKhongTrung:moi.length,cauDaGapKhongTrung:gap.length,goi:ds,soLenhDoc:soDoc}))
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Không hoàn tất đọc.');process.exitCode=1})
