import type { Env } from '../server/src/kieu'
import { execFileSync } from 'node:child_process'
import { dongBoGoi7, SQL_LUOT_GOI7, duNguonGoi7, mang7 } from '../server/src/goi-bai-7'
import { ngayVn7 } from '../server/src/goi-bai-7-loi'
// Giữ cùng cổng ca thi/lượt đang làm; không in tên/mã/đáp án học sinh.
import { query } from './kiem-phat-hanh-chua.mjs'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account)throw new Error('Thiếu cấu hình Cloudflare.')
const db={prepare(sql:string){
  const st={sql,params:[] as unknown[],bind(...params:unknown[]){st.params=params;return st},async all<T>(){
    const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(30000)})
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
// Chốt quota cho cả những em chưa mở app, dựa trên câu gốc/bản đã thực sự gặp.
await db.prepare(`INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota)
  SELECT e.goi_id,e.sbd,?,CAST((COUNT(c.qid)+MAX(1,CAST(julianday(e.han)-julianday(?)+1 AS INT))-1)/MAX(1,CAST(julianday(e.han)-julianday(?)+1 AS INT)) AS INT)
  FROM goi_bai_7_em e JOIN goi_bai_7_cau c ON c.goi_id=e.goi_id
  WHERE NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')
    AND NOT EXISTS(SELECT 1 FROM su_kien_hoc WHERE su_kien_hoc.sbd=e.sbd AND su_kien_hoc.qid=c.qid AND json_extract(su_kien_hoc.raw_json,'$.ht_cau_version')=c.version AND su_kien_hoc.ket_qua IS NOT NULL
      AND ngay_vn<? AND ${SQL_LUOT_GOI7})
    AND NOT EXISTS(SELECT 1 FROM goi_bai_7_gap x WHERE x.goi_id=e.goi_id AND x.sbd=e.sbd AND x.qid=c.qid AND x.version=c.version AND date(x.luc,'+7 hours')<?)
  GROUP BY e.goi_id,e.sbd,e.han`).bind(ngay,ngay,ngay,ngay,ngay).run()
await db.prepare(`INSERT OR IGNORE INTO goi_bai_7_ngay(goi_id,sbd,ngay,quota) SELECT goi_id,sbd,?,0 FROM goi_bai_7_em WHERE NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`).bind(ngay).run()
const stats=(await query(`SELECT (SELECT COUNT(*) FROM goi_bai_7) soGoi,(SELECT COUNT(DISTINCT sbd) FROM goi_bai_7_em) soEm,(SELECT COUNT(*) FROM goi_bai_7_cau) soCau,(SELECT COUNT(*) FROM goi_bai_7_em e WHERE NOT EXISTS(SELECT 1 FROM goi_bai_7_ngay n WHERE n.goi_id=e.goi_id AND n.sbd=e.sbd AND n.ngay='${ngay}') AND EXISTS(SELECT 1 FROM goi_bai_7_cau c WHERE c.goi_id=e.goi_id)) emChuaCoQuota,(SELECT COUNT(*) FROM goi_bai_7 g WHERE NOT EXISTS(SELECT 1 FROM goi_bai_7_cau c WHERE c.goi_id=g.id)) goiThieuNguon`))[0]
if(stats.emChuaCoQuota)throw new Error('Còn học sinh chưa có lịch phủ câu hôm nay.')
const sources=await db.prepare('SELECT b.ma_to_json FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL').all<{ma_to_json:string}>()
let goiNguonChuaDu=0;for(const s of sources.results)if(!await duNguonGoi7(env,mang7(s.ma_to_json)))goiNguonChuaDu++
const chuaDuyet=await db.prepare("SELECT COUNT(*) n FROM goi_bai_7_cau WHERE json_extract(meta_json,'$.hopLe')=0").first<{n:number}>()
const chuaNhan=await db.prepare(`SELECT COUNT(*) n FROM hoc_sinh h WHERE COALESCE(h.trang_thai,'')<>'khoa' AND EXISTS(SELECT 1 FROM bai_da_day b WHERE b.lop=h.lop AND b.bo_tick_luc IS NULL) AND NOT EXISTS(SELECT 1 FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE e.sbd=h.sbd AND g.lop=h.lop)`).first<{n:number}>()
if(chuaNhan?.n)throw new Error('Còn học sinh của lớp đã chọn bài chưa nhận gói.')
console.log(JSON.stringify({apGoi7:true,ngay,...stats,goiNguonChuaDu,cauChuaDuyet:chuaDuyet?.n??0,hocSinhDaChonChuaNhanGoi:chuaNhan?.n??0,giuKetQuaDaNop:true}))
