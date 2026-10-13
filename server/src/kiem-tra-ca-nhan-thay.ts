import type { Env } from './kieu'
import { coKtCn, tomTatKt, COT_META_KT } from './kiem-tra-ca-nhan'
import { ngayKt } from './kiem-tra-ca-nhan-loi'
import { sqlTenLopHs } from './goi-bai-7'
/** Sau cổng giáo viên của index.ts; chỉ đọc, không DDL/không lập lịch thay em. */
export async function gvKtCn(env: Env, b: Record<string, unknown>, now: number) {
  if (!await coKtCn(env)) return {ok:true,bat:false,em:[]}
  // Một lịch gần nhất mỗi em; lịch cũ không chiếm hết giới hạn rồi che lịch tuần tới.
  const r=await env.DB.prepare(`WITH bang AS(SELECT ${COT_META_KT},h.ho_ten,ROW_NUMBER() OVER(PARTITION BY k.sbd ORDER BY CASE WHEN k.ngay>=? THEN 0 ELSE 1 END,(k.trang_thai='cho_nguon'),CASE WHEN k.ngay>=? THEN k.ngay END,CASE WHEN k.ngay<? THEN k.ngay END DESC) stt FROM kiem_tra_ca_nhan k JOIN hoc_sinh h ON h.sbd=k.sbd AND k.lop=${sqlTenLopHs('h')} WHERE k.ngay>=? AND (?='' OR k.lop=?) AND (?='' OR k.sbd=?) AND COALESCE(h.trang_thai,'')<>'khoa') SELECT * FROM bang WHERE stt=1 ORDER BY ngay,lop,sbd LIMIT 501`).bind(ngayKt(now),ngayKt(now),ngayKt(now),new Date(now-14*86400000+7*3600000).toISOString().slice(0,10),String(b.lop??''),String(b.lop??''),String(b.sbd??''),String(b.sbd??'')).all<Record<string,unknown>>()
  return {ok:true,bat:true,serverNow:now,catBot:r.results.length>500,em:r.results.slice(0,500).map(k=>({sbd:String(k.sbd),ten:String(k.ho_ten??''),lop:String(k.lop),kiemTra:tomTatKt(k,now)}))}
}
