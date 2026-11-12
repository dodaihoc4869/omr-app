import type { Env } from '../server/src/kieu'
import { execFileSync } from 'node:child_process'
import { dongBoGoi7, SQL_LUOT_GOI7, duNguonGoi7, mang7, sqlTenLopHs } from '../server/src/goi-bai-7'
import { sqlEmDangNhan7 } from '../server/src/goi-bai-7-quyen'
import { sqlChotQuotaNgay7, SQL_QUOTA0_NGAY7, SQL_CHUA_NHAN7 } from '../server/src/goi-bai-7-em-nhan'
import { ngayVn7 } from '../server/src/goi-bai-7-loi'
import { phanLai0911 } from './phan-lai-0911'
// Giữ cùng cổng ca thi/lượt đang làm; không in tên/mã/đáp án học sinh.
import { query } from './kiem-phat-hanh-chua.mjs'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account)throw new Error('Thiếu cấu hình Cloudflare.')
const db={prepare(sql:string){
  const st={sql,params:[] as unknown[],bind(...params:unknown[]){st.params=params;return st},async all<T>(){
    // 09/11: D1 429 (quá tải) ⇒ thử lại 2–4–8–16 giây; mọi câu ở đây lặp lại an toàn (UPDATE/DELETE/INSERT có id riêng). Lỗi khác ném ngay như cũ.
    let r!:Response
    for(let lan=0;;lan++){
      r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(30000)})
      if(r.status!==429||lan>=4)break
      await new Promise(x=>setTimeout(x,2000*2**lan))
    }
    const j=await r.json() as {success?:boolean;result?:{success:boolean;results:T[];meta:{changes:number}}[]}
    if(!r.ok||!j.success||!j.result?.[0]?.success)throw new Error(`Không áp được lịch bài (${r.status}).`)
    return j.result[0]
  },async first<T>(){return(await st.all<T>()).results[0]??null},async run(){return st.all()}}
  return st
},async batch(ds:{sql?:string;params?:unknown[];all:()=>Promise<unknown>}[]){
  // R2 vừa thay: ghi chỉ mục theo lô JSON, mốc "đã đủ" luôn ghi SAU cùng.
  // Trong thời gian dựng, source_version lệch nguồn nên các kênh không phục vụ bản dở.
  if(ds[0]?.sql?.startsWith('DELETE FROM game_v2_question')&&ds.at(-1)?.sql?.startsWith('INSERT INTO game_v2_index')){
    const result=[await ds[0].all()],rows=ds.slice(1,-1).map(s=>s.params)
    for(let i=0;i<rows.length;i+=40)result.push(await db.prepare(`INSERT INTO game_v2_question(ma_de,qid,version,content_group,dang,json) SELECT json_extract(value,'$[0]'),json_extract(value,'$[1]'),json_extract(value,'$[2]'),json_extract(value,'$[3]'),json_extract(value,'$[4]'),json_extract(value,'$[5]') FROM json_each(?)`).bind(JSON.stringify(rows.slice(i,i+40))).run())
    result.push(await ds.at(-1)!.all());return result
  }
  const result=[];for(const s of ds)result.push(await s.all());return result
}}
const now=Date.now(),ngay=ngayVn7(now)
// Ngày chuyển chỉ chốt MỘT LẦN, không kéo lại chu kỳ 7 ngày ở lần deploy kế tiếp.
await db.prepare(`INSERT OR IGNORE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) SELECT 'goi_bai_7_v1',?,? WHERE NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`).bind(JSON.stringify({bat:true,batDau:ngay,batLuc:new Date(now).toISOString()}),new Date(now).toISOString()).run()
const env={DB:db,DE:{async get(key:string){const body=execFileSync('npx',['wrangler','r2','object','get',`omr-de/${key}`,'--remote','--pipe','--config','server/wrangler.toml'],{maxBuffer:32*1024*1024,stdio:['ignore','pipe','pipe']});return {body:new Uint8Array(body)}},async put(){throw new Error('Công cụ không ghi kho đề.')},async delete(){throw new Error('Công cụ không xoá kho đề.')}}} as unknown as Env
for(let i=0;i<20;i++){const r=await dongBoGoi7(env,now,100,'',true);if(r.hoan)throw new Error('Ca vừa mở: dừng áp lịch.');if(!r.soGoi)break}
// 09/11 thầy «phân luôn lại câu cho toàn bộ học sinh»: áp mức 28 + hạn chung cho gói đang chạy — MỘT lần (scripts/phan-lai-0911.ts).
console.log(JSON.stringify(await phanLai0911(env as unknown as Env,now)))
// Chốt quota cho cả những em chưa mở app, dựa trên câu gốc/bản đã thực sự gặp.
// 12/11 (đo D1 thật: 72 lượt × ~317 nghìn dòng): câu ở goi-bai-7-em-nhan.ts — bỏ cặp (gói, em) đã có dòng hôm nay trước khi đếm câu, danh sách tick bung một lần.
await db.prepare(sqlChotQuotaNgay7(SQL_LUOT_GOI7)).bind(ngay).run()
await db.prepare(SQL_QUOTA0_NGAY7).bind(ngay).run()
const stats=(await query(`WITH goi AS (SELECT g.* FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL),
  em AS (SELECT e.goi_id,e.sbd FROM goi_bai_7_em e JOIN goi g ON g.id=e.goi_id JOIN hoc_sinh h ON h.sbd=e.sbd AND ${sqlTenLopHs('h')}=g.lop WHERE ${sqlEmDangNhan7('e','g','h')})
  SELECT (SELECT COUNT(*) FROM goi) soGoi,(SELECT COUNT(DISTINCT sbd) FROM em) soEm,
    (SELECT COUNT(DISTINCT sbd) FROM goi_bai_7_em) soEmDaTungNhan,
    (SELECT COUNT(*) FROM goi_bai_7_cau c JOIN goi g ON g.id=c.goi_id) soCau,
    (SELECT COUNT(*) FROM em e WHERE NOT EXISTS(SELECT 1 FROM goi_bai_7_ngay n WHERE n.goi_id=e.goi_id AND n.sbd=e.sbd AND n.ngay='${ngay}') AND EXISTS(SELECT 1 FROM goi_bai_7_cau c WHERE c.goi_id=e.goi_id)) emChuaCoQuota,
    (SELECT COUNT(*) FROM goi g WHERE NOT EXISTS(SELECT 1 FROM goi_bai_7_cau c WHERE c.goi_id=g.id)) goiThieuNguon`))[0]
if(stats.emChuaCoQuota)throw new Error('Còn học sinh chưa có lịch phủ câu hôm nay.')
const sources=await db.prepare('SELECT b.ma_to_json FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL').all<{ma_to_json:string}>()
let goiNguonChuaDu=0;for(const s of sources.results)if(!await duNguonGoi7(env,mang7(s.ma_to_json)))goiNguonChuaDu++
const chuaDuyet=await db.prepare("SELECT COUNT(*) n FROM goi_bai_7_cau c JOIN goi_bai_7 g ON g.id=c.goi_id JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE json_extract(c.meta_json,'$.hopLe')=0").first<{n:number}>()
const chuaNhan=await db.prepare(SQL_CHUA_NHAN7).first<{n:number}>()
if(chuaNhan?.n)throw new Error('Còn học sinh của lớp đã chọn bài chưa nhận gói.')
console.log(JSON.stringify({apGoi7:true,ngay,...stats,goiNguonChuaDu,cauChuaDuyet:chuaDuyet?.n??0,hocSinhDaChonChuaNhanGoi:chuaNhan?.n??0,giuKetQuaDaNop:true}))
