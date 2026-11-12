// Kiểm CHỈ ĐỌC trên em có lịch sử lớn nhất; chỉ ghi aggregate, không mã/tên/đáp án.
import { execFileSync } from 'node:child_process'
import type { Env } from '../server/src/kieu'
import { docHoSo2 } from '../server/src/srs2-d1'
import { dongCoHanhTrinh } from '../server/src/hanh-trinh-dong-co'
import { SO_SU_KIEN_GAN_KIEM, SQL_CHON_EM_KIEM, SQL_LICH_SU_EM } from './kiem-dong-co-chon-em'
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
  // Cùng cổng giờ vào ca/lượt đang làm với phát hành; không bỏ qua kiểm đọc sâu.
  await import('./kiem-phat-hanh-chua.mjs')
  // 12/11: không đếm cả sổ mỗi lượt — chọn em nặng nhất trong SO_SU_KIEN_GAN_KIEM sự kiện mới nhất (kiem-dong-co-chon-em.ts); không ai ⇒ đếm cả sổ như cũ.
  const chon=await db.prepare(SQL_CHON_EM_KIEM).bind(SO_SU_KIEN_GAN_KIEM).first<{sbd:string;n:number}>()
  const em0=chon&&Number(chon.n)>0?chon:await db.prepare(SQL_CHON_EM_KIEM).bind(-1).first<{sbd:string;n:number}>()
  const em=em0?{sbd:em0.sbd,n:Number((await db.prepare(SQL_LICH_SU_EM).bind(em0.sbd).first<{n:number}>())?.n??0)}:null
  if(!em) throw new Error('Chưa có học sinh thuộc ba hành trình.')
  const now=Date.now(),ngay=new Date(now+7*3600000).toISOString().slice(0,10)
  const hs=await docHoSo2(env,em.sbd,ngay)
  if(!hs.chienDich?.id.startsWith('hanh-trinh-v3-khoi-')) throw new Error('Bộ đọc chưa chọn đúng Hành trình.')
  const d=await dongCoHanhTrinh(env,em.sbd,now,hs,new Set(),false)
  console.log(JSON.stringify({kiemDongCoSong:true,lichSuLonNhat:em.n,soUngVien:hs.cau.length,soQuanSatDocLap:d.soQuanSat,soCauChanTienQuyet:d.chan.size,soCauHalfLife:d.soHalfLife,soCanhHoc:d.soCanhHoc,soL4SanSang:d.v5?.soL4??0,phienBanDongCo:'ht6-0910-v1',soCauChanDoanCoGioiHan:d.v5?.chanDoan.size??0,soUngVienBoSungToanKho:d.v5?.ungNgoai.length??0,soKyNangL3MucTieu:d.v5?.tienDo.tong??0,baoPhuL3:d.v5?.tienDo.baoPhu??null,soLenhDoc:soDoc}))
}
// 10/11: lỗi lặp ở #1566/#1567 mà không biết vì sao ⇒ in TÊN + CÂU BÁO lỗi (cắt 300 ký tự; không in dữ liệu em / ngăn xếp) để tìm gốc.
main().catch((e)=>{const m=e instanceof Error?`${e.name}: ${e.message}`:String(e);console.error('Không hoàn tất kiểm động cơ chỉ đọc. Lỗi: '+m.replace(/\s+/g,' ').slice(0,300));process.exitCode=1})
