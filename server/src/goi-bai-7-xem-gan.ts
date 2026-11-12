// Câu em XEM LỜI GIẢI trong 12 giờ qua (Gói 7 — `batDauSom7` trong goi-bai-7.ts). Tách riêng (H1 12/11) để goi-bai-7.ts không to thêm.
import type { Env } from './kieu'

/** Câu em xem lời giải trong 12 giờ qua. H1 (12/11, hoá đơn D1): thêm mốc chữ `luc>=?` (ngày, lùi 2 ngày — rộng hơn mọi `luc` dạng ISO thoả điều kiện
 *  julianday, giữ nguyên điều kiện ấy) ⇒ dò khoảng chỉ mục (sbd, luc) thay vì đọc mọi dòng của em (không thống kê, SQLite chọn chỉ mục phủ (sbd, qid, luc) ⇒
 *  chỉ định thẳng; thiếu chỉ mục ⇒ câu cũ); ORDER BY qid = thứ tự cũ. */
export const SQL_XEM_GAN_7_CU='SELECT DISTINCT qid FROM loi_giai_hoi WHERE sbd=? AND julianday(luc)>=julianday(?)-0.5'
export const SQL_XEM_GAN_7='SELECT DISTINCT qid FROM loi_giai_hoi INDEXED BY idx_lg_hoi_em_luc WHERE sbd=? AND luc>=? AND julianday(luc)>=julianday(?)-0.5 ORDER BY qid'
export const mocXemGan7=(now:number)=>new Date(now-2*86_400_000).toISOString().slice(0,10)
export const docXemGan7=(env:Env,sbd:string,now:number)=>{const iso=new Date(now).toISOString()
  return env.DB.prepare(SQL_XEM_GAN_7).bind(sbd,mocXemGan7(now),iso).all<{qid:string}>().catch(()=>env.DB.prepare(SQL_XEM_GAN_7_CU).bind(sbd,iso).all<{qid:string}>())}
