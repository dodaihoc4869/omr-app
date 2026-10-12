// Chỉ đọc bằng hàm hiện hành của app. Không gọi đồng bộ, không tạo bảng/quota, không in tên/SBD/đáp án.
import type { Env } from '../server/src/kieu'
import { coGoi7, docGoiCuaEm7, SQL_LUOT_GOI7 } from '../server/src/goi-bai-7'
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
  const noiGoi=await db.prepare(`SELECT
    (SELECT COUNT(*) FROM goi_bai_7_em WHERE sbd=h.sbd) soGoiDaDangKy,
    (SELECT COUNT(*) FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id WHERE e.sbd=h.sbd AND g.lop=h.lop) soGoiDungLop,
    (SELECT COUNT(*) FROM bai_da_day b WHERE b.lop=h.lop AND b.bo_tick_luc IS NULL) soBaiDaChonCuaLop,
    (SELECT COUNT(*) FROM bai_da_day b WHERE lower(trim(b.lop))=lower(trim(h.lop)) AND b.bo_tick_luc IS NULL) soBaiSauChuanHoaLop,
    (SELECT COUNT(*) FROM goi_bai_7 g JOIN bai_da_day b ON b.id=g.tick_id AND b.bo_tick_luc IS NULL WHERE g.lop=h.lop) soGoiLopConHieuLuc,
    (SELECT MAX(tick_luc) FROM bai_da_day b WHERE b.lop=h.lop AND b.bo_tick_luc IS NULL) chonBaiGanNhat,
    (SELECT COUNT(*) FROM pham_vi_lop p WHERE p.lop=h.lop) soBaiTrongPhamVi
    FROM hoc_sinh h WHERE h.sbd=?`).bind(sbd).first<Record<string,unknown>>()
  const hanhTrinh=await db.prepare(`WITH ds AS (
    SELECT c.id,c.han_nop,c.tao_luc,c.qid_json FROM chien_dich c WHERE c.trang_thai='dang_chay'
      AND EXISTS(SELECT 1 FROM json_each(c.sbd_json) x WHERE x.value=?)
  ), q AS (
    SELECT ds.id,ds.han_nop,ds.tao_luc,j.value qid,MIN(g.version) version
    FROM ds,json_each(ds.qid_json) j JOIN game_v2_question g ON g.qid=j.value
    WHERE json_extract(g.json,'$.reviewed')=1 AND json_extract(g.json,'$.phan') IN('I','II','III')
    GROUP BY ds.id,j.value
  ) SELECT id LIKE 'hanh-trinh-v3-khoi-%' laHanhTrinh,han_nop han,COUNT(*) cauGocTrongNguon,
    SUM(CASE WHEN NOT EXISTS(SELECT 1 FROM su_kien_hoc WHERE sbd=? AND qid=q.qid AND ket_qua IS NOT NULL AND received_at<=? AND ${SQL_LUOT_GOI7}) THEN 1 ELSE 0 END) chuaCoLuotGapGoc,
    SUM(CASE WHEN NOT EXISTS(SELECT 1 FROM su_kien_hoc WHERE sbd=? AND qid=q.qid AND ket_qua IS NOT NULL AND received_at<=? AND json_extract(raw_json,'$.ht_cau_version')=q.version AND ${SQL_LUOT_GOI7}) THEN 1 ELSE 0 END) chuaGapDungPhienBan
    FROM q GROUP BY id ORDER BY han_nop`).bind(sbd,sbd,now,sbd,now).all<Record<string,unknown>>()
  const goiLuu=await db.prepare(`WITH cs AS (
    SELECT g.id,g.bat_dau,e.han,CASE WHEN g.lop=h.lop THEN 1 ELSE 0 END lopConKhop,
      CASE WHEN b.bo_tick_luc IS NULL THEN 1 ELSE 0 END baiConDuocChon,c.qid,c.version,json_extract(c.meta_json,'$.phan') phan,
      CASE WHEN EXISTS(SELECT 1 FROM su_kien_hoc WHERE sbd=e.sbd AND qid=c.qid AND received_at<=? AND ket_qua IS NOT NULL AND json_extract(raw_json,'$.ht_cau_version')=c.version AND ${SQL_LUOT_GOI7})
        OR EXISTS(SELECT 1 FROM goi_bai_7_gap x WHERE x.sbd=e.sbd AND x.goi_id=e.goi_id AND x.qid=c.qid AND x.version=c.version) THEN 1 ELSE 0 END daGap
    FROM goi_bai_7_em e JOIN goi_bai_7 g ON g.id=e.goi_id JOIN hoc_sinh h ON h.sbd=e.sbd
      JOIN bai_da_day b ON b.id=g.tick_id JOIN goi_bai_7_cau c ON c.goi_id=e.goi_id WHERE e.sbd=?
  ) SELECT bat_dau batDau,han,lopConKhop,baiConDuocChon,COUNT(*) tong,SUM(daGap) daGap,SUM(1-daGap) con,
    SUM(CASE WHEN phan='I' AND daGap=0 THEN 1 ELSE 0 END) tracNghiemCon,
    SUM(CASE WHEN phan='II' AND daGap=0 THEN 1 ELSE 0 END) dungSaiCon,
    SUM(CASE WHEN phan='III' AND daGap=0 THEN 1 ELSE 0 END) traLoiNganCon
    FROM cs GROUP BY id ORDER BY bat_dau DESC`).bind(now,sbd).all<Record<string,unknown>>()
  const moi=[...new Set(goi.flatMap(g=>g.cau.filter(c=>!g.daGap.has(c.qid)).map(c=>c.qid)))],gap=[...new Set(goi.flatMap(g=>[...g.daGap]))]
  const ds=goi.map((g,i)=>{
    const con=g.cau.filter(c=>!g.daGap.has(c.qid))
    return {bai:i+1,batDau:g.batDau,han:g.han,nguonDayDu:g.nguonDayDu,tong:g.cau.length,daGap:g.daGap.size,con:con.length,
      conTheoPhan:{tracNghiem:con.filter(c=>c.phan==='I').length,dungSai:con.filter(c=>c.phan==='II').length,traLoiNgan:con.filter(c=>c.phan==='III').length},
      ngayCon:soNgayCon7(ngay,g.han),quotaHomNay:g.quota,gapMoiHomNay:g.gapNgay.size,conPhuHomNay:Math.max(0,g.quota-g.gapNgay.size),
      quaHan:ngay>g.han,quotaSauHanNeuConNguyen:quotaGoi7(con.length,'9999-12-31',g.han),
      cauConChuaHopLe:con.filter(c=>c.hopLe===false).length}
  })
  console.log(JSON.stringify({docGoi7:true,docLuc:new Date(now).toISOString(),ngayVn:ngay,coHocSinh:!!em,taiKhoanKhoa:em?.trang_thai==='khoa',bat:co.bat,soGoi:ds.length,cauMoiChuaGapKhongTrung:moi.length,cauDaGapKhongTrung:gap.length,goi:ds,noiGoi,goiDaLuu:goiLuu.results,hanhTrinh:hanhTrinh.results,soLenhDoc:soDoc}))
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Không hoàn tất đọc.');process.exitCode=1})
