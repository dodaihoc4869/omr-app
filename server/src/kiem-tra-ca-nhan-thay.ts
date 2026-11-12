import type { Env } from './kieu'
import { coKtCn, tomTatKt, COT_META_KT, sqlKhongBaoTriBo } from './kiem-tra-ca-nhan'
import { ngayKt } from './kiem-tra-ca-nhan-loi'
import { sqlTenLopHs } from './goi-bai-7'
const XEP_KT = `ROW_NUMBER() OVER(PARTITION BY k.sbd ORDER BY CASE WHEN k.ngay>=? THEN 0 ELSE 1 END,(k.trang_thai='cho_nguon'),CASE WHEN k.ngay>=? THEN k.ngay END,CASE WHEN k.ngay<? THEN k.ngay END DESC) stt`
const TU_KT = (now: number) => `FROM kiem_tra_ca_nhan k JOIN hoc_sinh h ON h.sbd=k.sbd AND k.lop=${sqlTenLopHs('h')} WHERE k.ngay>=? AND ${sqlKhongBaoTriBo('k',now)} AND (?='' OR k.lop=?) AND (?='' OR k.sbd=?) AND COALESCE(h.trang_thai,'')<>'khoa'`
/** Câu CŨ (trước 12/11) — chỉ để test so cũ↔mới: tính cột nặng (COT_META_KT) cho MỌI lịch 14 ngày + tương lai rồi mới lọc stt=1. */
export const sqlGvKtCnCu = (now: number): string => `WITH bang AS(SELECT ${COT_META_KT},h.ho_ten,${XEP_KT} ${TU_KT(now)}) SELECT * FROM bang WHERE stt=1 ORDER BY ngay,lop,sbd LIMIT 501`
/** 12/11 (H3, đo 24h: 64 lượt × ~208.889 hàng): xếp hạng trên cột nhẹ trước (id, tên), CHỈ dòng stt=1 (một lịch mỗi em) mới tính cột nặng.
 *  Cùng tham số, cùng cột theo đúng thứ tự (COT_META_KT…, ho_ten, stt), cùng thứ tự dòng (ngay, lop, sbd — một dòng mỗi em nên không hoà). */
export const sqlGvKtCn = (now: number): string => `WITH chon AS(SELECT k.id,h.ho_ten,${XEP_KT} ${TU_KT(now)}),bang AS(SELECT ${COT_META_KT},c.ho_ten,c.stt FROM chon c CROSS JOIN kiem_tra_ca_nhan k WHERE c.stt=1 AND k.id=c.id) SELECT * FROM bang ORDER BY ngay,lop,sbd LIMIT 501`
/** Sau cổng giáo viên của index.ts; chỉ đọc, không DDL/không lập lịch thay em. */
export async function gvKtCn(env: Env, b: Record<string, unknown>, now: number) {
  if (!await coKtCn(env)) return {ok:true,bat:false,em:[]}
  // Một lịch gần nhất mỗi em; lịch cũ không chiếm hết giới hạn rồi che lịch tuần tới.
  const r=await env.DB.prepare(sqlGvKtCn(now)).bind(ngayKt(now),ngayKt(now),ngayKt(now),new Date(now-14*86400000+7*3600000).toISOString().slice(0,10),String(b.lop??''),String(b.lop??''),String(b.sbd??''),String(b.sbd??'')).all<Record<string,unknown>>()
  return {ok:true,bat:true,serverNow:now,catBot:r.results.length>500,em:r.results.slice(0,500).map(k=>({sbd:String(k.sbd),ten:String(k.ho_ten??''),lop:String(k.lop),kiemTra:tomTatKt(k,now)}))}
}
