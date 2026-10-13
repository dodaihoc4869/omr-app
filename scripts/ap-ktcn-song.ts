import type { Env } from '../server/src/kieu'
import { dongBoKtCn } from '../server/src/kiem-tra-ca-nhan'
import { query } from './kiem-phat-hanh-chua.mjs'
const token=process.env.CLOUDFLARE_API_TOKEN,account=process.env.CLOUDFLARE_ACCOUNT_ID
if(!token||!account)throw new Error('Thiếu cấu hình Cloudflare.')
const db={prepare(sql:string){const st={sql,params:[] as unknown[],bind(...params:unknown[]){st.params=params;return st},async all<T>(){const r=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/d2e6d322-374a-45d7-83a3-9fac486b23f1/query`,{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json'},body:JSON.stringify({sql,params:st.params}),signal:AbortSignal.timeout(30000)});const j=await r.json() as {success?:boolean;result?:{success:boolean;results:T[];meta:{changes:number}}[]};if(!r.ok||!j.success||!j.result?.[0]?.success)throw new Error(`Không áp được lịch riêng (${r.status}).`);return j.result[0]},async first<T>(){return (await st.all<T>()).results[0]??null},async run(){return st.all()}};return st},async batch(stmts:{all:()=>Promise<unknown>}[]){const out=[];for(const st of stmts)out.push(await st.all());return out}}
const now=Date.now()
await db.prepare(`INSERT OR IGNORE INTO cau_hinh(khoa,gia_tri,cap_nhat_luc) SELECT 'kiem_tra_ca_nhan_v1','{"bat":true}',? WHERE NOT EXISTS(SELECT 1 FROM ca WHERE trang_thai='mo')`).bind(new Date(now).toISOString()).run()
const env={DB:db} as unknown as Env
// Chuyển lần đầu ngoài cao điểm: các lô nhỏ tuần tự đến hết hàng đợi hiện tại, không bắt em mở app để có lịch.
// Mỗi vòng đều kiểm ca đang mở; hồ sơ lỗi có cooldown nên không giữ cả hàng đợi.
// Chuẩn bị tối đa một lô; phần còn lại do cron chậm xử lý, tránh quét cả lớp trong bước phát hành.
const r=await dongBoKtCn(env,now,2);if(r.hoan)throw new Error('Ca vừa mở: dừng áp lịch riêng.');console.log(JSON.stringify({chuanBiKtCnTheoLo:true,soEm:r.soEm,soMoi:r.soMoi}));
const stats=(await query(`SELECT COUNT(*) soLich,COUNT(DISTINCT sbd) soEm,SUM(CASE WHEN trang_thai='cho_nguon' THEN 1 ELSE 0 END) choNguon,MIN(ngay) ngaySomNhat,MAX(ngay) ngayMuonNhat,MIN(json_array_length(json_extract(json,'$.cau'))) cauItNhat,MAX(json_array_length(json_extract(json,'$.cau'))) cauNhieuNhat FROM kiem_tra_ca_nhan`))[0]
console.log(JSON.stringify({apKtCn:true,...stats,giuKetQuaDaNop:true,cronTiepTuc:true}))
