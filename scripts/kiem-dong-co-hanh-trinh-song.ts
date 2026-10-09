// Kiểm CHỈ ĐỌC trên em có lịch sử lớn nhất; chỉ ghi aggregate, không mã/tên/đáp án.
import { execFileSync } from 'node:child_process'
import type { Env } from '../server/src/kieu'
import { docHoSo2 } from '../server/src/srs2-d1'
import { dongCoHanhTrinh } from '../server/src/hanh-trinh-dong-co'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account) throw new Error('Thiếu cấu hình Cloudflare.')
let soDoc=0
const db={
  prepare(sql:string) {
    const st={params:[] as unknown[],bind(...params:unknown[]){st.params=params;return st},async all<T>(){
      // CREATE IF NOT EXISTS của đường đọc chỉ kiểm bảng đã có, không thực thi ghi.
      if(/^CREATE (TABLE|INDEX) IF NOT EXISTS /i.test(sql)) return {success:true,results:[],meta:{changes:0}}
      if(!/^\s*(SELECT|WITH)\b/i.test(sql)) throw new Error('Công cụ kiểm không được ghi dữ liệu.')
      soDoc++
      const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(60000)})
      const j=await r.json() as {success?:boolean;result?:{success:boolean;results:T[];meta:Record<string,number>}[]}
      if(!r.ok||!j.success||!j.result?.[0]?.success) throw new Error(`Không kiểm được bộ đọc động cơ (${r.status}).`)
      return j.result[0]
    },async first<T>(){return (await st.all<T>()).results[0]??null},async run(){return st.all()}}
    return st
  },async batch(ds:{all:()=>Promise<unknown>}[]){return Promise.all(ds.map(s=>s.all()))},withSession(){return db},
}
const env={DB:db,DE:{async get(key:string){const body=execFileSync('npx',['wrangler','r2','object','get',`omr-de/${key}`,'--remote','--pipe','--config','server/wrangler.toml'],{maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']});return {body:new Uint8Array(body),async json(){return JSON.parse(body.toString())}}},async put(){throw new Error('Không được ghi kho.')},async delete(){throw new Error('Không được xoá kho.')}}} as unknown as Env
async function main(){
  const ca=await db.prepare("SELECT COUNT(*) n FROM ca WHERE trang_thai='mo'").first<{n:number}>()
  if(!ca || ca.n!==0) throw new Error('Có ca mở: hoãn kiểm động cơ.')
  const em=await db.prepare(`SELECT h.sbd,COUNT(s.khoa) n FROM hoc_sinh h LEFT JOIN su_kien_hoc s ON s.sbd=h.sbd WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM chien_dich c,json_each(c.sbd_json) j WHERE c.id LIKE 'hanh-trinh-v3-khoi-%' AND c.trang_thai='dang_chay' AND j.value=h.sbd) GROUP BY h.sbd ORDER BY n DESC,h.sbd LIMIT 1`).first<{sbd:string;n:number}>()
  if(!em) throw new Error('Chưa có học sinh thuộc ba hành trình.')
  const now=Date.now(),ngay=new Date(now+7*3600000).toISOString().slice(0,10)
  const hs=await docHoSo2(env,em.sbd,ngay)
  if(!hs.chienDich?.id.startsWith('hanh-trinh-v3-khoi-')) throw new Error('Bộ đọc chưa chọn đúng Hành trình.')
  const d=await dongCoHanhTrinh(env,em.sbd,now,hs,new Set(),false)
  console.log(JSON.stringify({kiemDongCoSong:true,lichSuLonNhat:em.n,soUngVien:hs.cau.length,soQuanSatDocLap:d.soQuanSat,soCauChanTienQuyet:d.chan.size,soCauHalfLife:d.soHalfLife,soCanhHoc:d.soCanhHoc,soLenhDoc:soDoc}))
}
main().catch(()=>{console.error('Không hoàn tất kiểm động cơ chỉ đọc.');process.exitCode=1})
