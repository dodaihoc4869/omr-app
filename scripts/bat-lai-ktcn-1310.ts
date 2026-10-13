// KHẨN 13/10 — BẬT LẠI kiểm tra riêng sau bản vá D1 quá tải. Chạy SAU KHI Worker sống đã có bản vá (số tính sẵn).
// 1) kiểm ca mở (import kiem-phat-hanh-chua.mjs dừng nếu có ca) · 2) tạo bảng chỉ-thêm · 3) bù số tính sẵn cho MỌI lịch cũ
// (Worker tự tính từ JSON đề, D1 chỉ đọc/ghi dòng) · 4) còn dòng thiếu ⇒ DỪNG, không bật · 5) bật cờ.
// Không xoá/sửa lịch, bài nộp, điểm.
import type { Env } from '../server/src/kieu'
import { SQL_KT_CN } from '../server/src/kiem-tra-ca-nhan-schema'
import { buMetaKt } from '../server/src/kiem-tra-ca-nhan'
import { query } from './kiem-phat-hanh-chua.mjs'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account)throw new Error('Thiếu cấu hình Cloudflare.')
const db={prepare(sql:string){const st={sql,params:[] as unknown[],bind(...params:unknown[]){st.params=params;return st},async all<T>(){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(30000)});const j=await r.json() as {success?:boolean;result?:{success:boolean;results:T[];meta:{changes:number}}[]};if(!r.ok||!j.success||!j.result?.[0]?.success)throw new Error(`Không bù được số lịch riêng (${r.status}).`);return j.result[0]},async first<T>(){return (await st.all<T>()).results[0]??null},async run(){return st.all()}};return st},async batch(stmts:{all:()=>Promise<unknown>}[]){const out=[];for(const st of stmts)out.push(await st.all());return out}}
const env={DB:db} as unknown as Env
if(SQL_KT_CN.some(s=>!/^CREATE (TABLE|INDEX) IF NOT EXISTS (kiem_tra_ca_nhan|ktcn_)/.test(s)))throw new Error('Schema kiểm tra phải chỉ-thêm.')
for(const sql of SQL_KT_CN)await query(sql)
let daBu=0
for(let i=0;i<400;i++){const n=await buMetaKt(env,5);daBu+=n;if(!n)break}
const con=Number((await query(`SELECT COUNT(*) n FROM kiem_tra_ca_nhan k LEFT JOIN kiem_tra_ca_nhan_meta km ON km.id=k.id WHERE km.id IS NULL`))[0]?.n)
if(con!==0)throw new Error(`Còn ${con} lịch chưa có số tính sẵn: CHƯA bật lại cờ.`)
const quaTai=Number((await query(`SELECT COUNT(*) n FROM kiem_tra_ca_nhan k JOIN kiem_tra_ca_nhan_meta km ON km.id=k.id WHERE k.nop_luc IS NULL AND k.trang_thai<>'cho_nguon' AND k.han_luc>${Date.now()} AND (COALESCE(json_extract(km.meta_json,'$.phienBan'),0)<>3 OR json_extract(km.meta_json,'$.tong')<>28 OR json_extract(km.meta_json,'$.phut')<>50)`))[0]?.n)
if(quaTai)throw new Error(`Còn ${quaTai} đề chưa chuyển về 28 câu/50 phút: CHƯA bật cờ.`)
const luc=new Date().toISOString()
await query(`UPDATE cau_hinh SET gia_tri='{"bat":true,"batLuc":"${luc}"}',cap_nhat_luc='${luc}' WHERE khoa='kiem_tra_ca_nhan_v1' AND NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`)
const co=(await query(`SELECT gia_tri FROM cau_hinh WHERE khoa='kiem_tra_ca_nhan_v1'`))[0]
console.log(JSON.stringify({daBuSoTinhSan:daBu,conThieu:con,co:co?.gia_tri}))
if(!String(co?.gia_tri).includes('"bat":true'))throw new Error('Cờ chưa bật (có thể vừa có ca mở).')
