// Phân nhóm ổn định theo em; nhật ký quyết định không được dùng làm mẫu số A/B.
import type { Env } from './kieu'
import { chayDdlMotLan } from './ddl-mot-lan'
import { SQL_HANH_TRINH_V5,KHONG_CA_HT5 } from './hanh-trinh-v5-schema'
export const THU_NGHIEM_HT5='ht5-chon-cau-l4-0910'
export type NhomThu='A'|'B'
export interface PhanNhom { nhom:NhomThu;bat_dau:number;pham_vi:string;diem_dau:number|null;ma_tran_dau?:string|null }
export async function docNhom(env:Env,sbd:string):Promise<PhanNhom|null>{return env.DB.prepare('SELECT nhom,bat_dau,pham_vi,diem_dau,ma_tran_dau FROM hanh_trinh_v5_phan_nhom WHERE thu_nghiem=? AND sbd=?').bind(THU_NGHIEM_HT5,sbd).first<PhanNhom>()}
export async function phanNhom(env:Env,sbd:string,now:number,phamVi:string,ghi=true):Promise<PhanNhom|null>{
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  const cu=await docNhom(env,sbd);if(cu||!ghi)return cu
  // Đầu vào đo: đề đã nộp trước phân nhóm, có ít nhất 14 câu. Không suy điểm từ ket_qua.
  const r=await env.DB.prepare(`SELECT h.ten_lop,h.lop,(SELECT d.diem FROM omni_de_thu d WHERE d.sbd=h.sbd AND d.nop_luc IS NOT NULL AND d.diem IS NOT NULL AND json_array_length(d.qid_json)>=14 AND d.nop_luc<? ORDER BY d.nop_luc DESC LIMIT 1) diem FROM hoc_sinh h WHERE h.sbd=?`).bind(new Date(now).toISOString(),sbd).first<{ten_lop:string;lop:string;diem:number|null}>()
  if(!r)return null
  const tang=`${r.lop}|${r.ten_lop}|${r.diem===null?'chua_do':r.diem<5?'duoi5':r.diem<8?'5den8':'tu8'}`
  // Một INSERT SELECT nguyên tử: cân bằng trong tầng phân, coin crypto khi bằng nhau; đọc lại không đổi nhóm.
  const coin=crypto.getRandomValues(new Uint32Array(1))[0]!%2===0?'A':'B'
  await env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v5_phan_nhom SELECT ?1,?2,CASE WHEN SUM(CASE WHEN nhom='A' THEN 1 ELSE 0 END)<SUM(CASE WHEN nhom='B' THEN 1 ELSE 0 END) THEN 'A' WHEN SUM(CASE WHEN nhom='A' THEN 1 ELSE 0 END)>SUM(CASE WHEN nhom='B' THEN 1 ELSE 0 END) THEN 'B' ELSE ?3 END,?4,?5,NULL,NULL,?6 FROM hanh_trinh_v5_phan_nhom WHERE thu_nghiem=?1 AND tang_phan=?4 HAVING ${KHONG_CA_HT5}`).bind(THU_NGHIEM_HT5,sbd,coin,tang,now,phamVi).run()
  return docNhom(env,sbd)
}
export interface MauDo { sbd:string;nhom:NhomThu;batDau:number;diemDau:number|null;id:string;luc:number;diem:number;docLap:boolean;phamVi:string;phamViDau:string;maTran:string;phut:number|null }
/** Một em một điểm kiểm đầu tiên ngày 7–14, cùng phạm vi/ma trận. Thiếu điểm đầu không tự gán 0. */
export function tomTatAB(ds:readonly MauDo[],maTran:string){
  const one=new Map<string,MauDo>()
  for(const d of ds){const delay=(d.luc-d.batDau)/86400000;if(!d.docLap||delay<7||delay>=15||d.phamVi!==d.phamViDau||d.maTran!==maTran||!Number.isFinite(d.diem)||d.diem<0||d.diem>10)continue;const cu=one.get(d.sbd);if(!cu||d.luc<cu.luc||d.luc===cu.luc&&d.id<cu.id)one.set(d.sbd,d)}
  return (['A','B'] as const).map(nhom=>{const a=[...one.values()].filter(d=>d.nhom===nhom),paired=a.filter(d=>d.diemDau!==null),gain=paired.map(d=>d.diem-d.diemDau!),avg=(x:number[])=>x.length?x.reduce((s,v)=>s+v,0)/x.length:null,mean=avg(gain),variance=gain.length>1?gain.reduce((s,v)=>s+(v-mean!)**2,0)/(gain.length-1):null;return {nhom,n:a.length,nCoDiemDau:paired.length,diemTb:avg(a.map(d=>d.diem)),tangDiemTb:mean,saiSoChuan:variance===null?null:Math.sqrt(variance/gain.length)}})
}
/** Ma trận lưu trước trả đề: số câu mỗi phần × mức nội dung, không dùng kết quả để chọn mẫu. */
export function maTranDo(ds:readonly {phan:string;mucDo:string|null;sao?:number}[]):string {
  const bins=new Map<string,number>();for(const c of ds){const k=`${c.phan}:${(c.sao??0)>=2?'VDC':c.mucDo??'?'}`;bins.set(k,(bins.get(k)??0)+1)}return JSON.stringify([...bins].sort(([a],[b])=>a.localeCompare(b)))
}
export async function ghiDeThuDo(env:Env,id:string,sbd:string,now:number,refs:readonly {qid:string;phan:string}[],matrix:string,docLap:boolean,phamViThuc:string):Promise<void>{
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  const n=await docNhom(env,sbd);if(!n)return
  await env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v5_de_thu SELECT ?,?,?,?,?,?,?,?,? WHERE ${KHONG_CA_HT5}`).bind(id,sbd,THU_NGHIEM_HT5,n.nhom,phamViThuc,matrix,JSON.stringify(refs.map(r=>r.qid)),now,Number(docLap)).run()
}
/** Đọc thầy: một em một đề đầu tiên 7–14 ngày, tách đúng ma trận và phạm vi; không gọi thiếu dữ liệu là thất bại. */
export async function baoCaoAB(env:Env,sbds:readonly string[]){
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  const [nhom,mau]=await Promise.all([
    env.DB.prepare('SELECT nhom,COUNT(*) n FROM hanh_trinh_v5_phan_nhom WHERE thu_nghiem=? AND sbd IN(SELECT value FROM json_each(?)) GROUP BY nhom').bind(THU_NGHIEM_HT5,JSON.stringify(sbds)).all<{nhom:NhomThu;n:number}>(),
    env.DB.prepare(`SELECT p.sbd,p.nhom,p.bat_dau batDau,CASE WHEN p.ma_tran_dau=r.ma_tran THEN p.diem_dau ELSE NULL END diemDau,p.pham_vi phamViDau,r.id,r.pham_vi phamVi,r.ma_tran maTran,r.doc_lap docLap,CAST((julianday(d.nop_luc)-2440587.5)*86400000 AS INTEGER) luc,d.diem FROM hanh_trinh_v5_phan_nhom p JOIN hanh_trinh_v5_de_thu r ON r.sbd=p.sbd AND r.thu_nghiem=p.thu_nghiem JOIN omni_de_thu d ON d.id=r.id AND d.sbd=r.sbd WHERE p.thu_nghiem=? AND p.sbd IN(SELECT value FROM json_each(?)) AND d.diem IS NOT NULL AND d.nop_luc IS NOT NULL AND r.doc_lap=1 AND d.nop_luc>=datetime(p.bat_dau/1000,'unixepoch','+7 days') AND (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.sbd=d.sbd AND s.nguon='luyen' AND s.ma_nguon='de_thu:'||d.id)=json_array_length(d.qid_json)`).bind(THU_NGHIEM_HT5,JSON.stringify(sbds)).all<MauDo>(),
  ])
  const one=new Map<string,MauDo>()
  for(const r of mau.results){const d={...r,docLap:!!r.docLap,phut:null},delay=(d.luc-d.batDau)/86400000;if(!d.docLap||delay<7||delay>=15||d.phamVi!==d.phamViDau)continue;const cu=one.get(d.sbd);if(!cu||d.luc<cu.luc||d.luc===cu.luc&&d.id<cu.id)one.set(d.sbd,d)}
  const ds=[...one.values()],matrices=[...new Set(ds.map(d=>`${d.phamVi}|${d.maTran}`))]
  const rows=matrices.map(key=>{const relevant=ds.filter(d=>`${d.phamVi}|${d.maTran}`===key);return {phamVi:relevant[0]!.phamVi,maTran:relevant[0]!.maTran,nhom:tomTatAB(relevant,relevant[0]!.maTran)}})
  return {thuNghiem:THU_NGHIEM_HT5,phanNhom:nhom.results,soMauHopLe:rows.reduce((s,r)=>s+r.nhom.reduce((a,n)=>a+n.n,0),0),ketQua:rows,trangThai:rows.some(r=>r.nhom.every(n=>n.n>=30))?'dang_do':'chua_du_du_lieu'}
}

/** Đề kiểm đầu trong hai ngày đầu là mốc trước học; chỉ ghi một lần và cùng ma trận khi tính tăng điểm. */
export async function chotDiemDau(env:Env,id:string,sbd:string,now:number,diem:number,soCau:number){
  await chayDdlMotLan(env,'hanh_trinh_v5',SQL_HANH_TRINH_V5)
  await env.DB.prepare(`UPDATE hanh_trinh_v5_phan_nhom SET diem_dau=?,ma_tran_dau=(SELECT ma_tran FROM hanh_trinh_v5_de_thu WHERE id=? AND sbd=?) WHERE thu_nghiem=? AND sbd=? AND diem_dau IS NULL AND ?>=bat_dau AND ?<=bat_dau+172800000 AND EXISTS(SELECT 1 FROM hanh_trinh_v5_de_thu r JOIN omni_de_thu d ON d.id=r.id AND d.sbd=r.sbd WHERE r.id=? AND r.sbd=? AND r.doc_lap=1 AND r.pham_vi=hanh_trinh_v5_phan_nhom.pham_vi AND d.nop_luc IS NOT NULL AND json_array_length(d.qid_json)=? AND ?>=14 AND NOT EXISTS(SELECT 1 FROM su_kien_hoc s WHERE s.sbd=r.sbd AND s.received_at>hanh_trinh_v5_phan_nhom.bat_dau AND s.received_at<r.tao_luc AND s.ket_qua IS NOT NULL AND COALESCE(s.purpose,'') NOT IN('de_thu','luot','xem_loi_giai','shadow'))) AND ${KHONG_CA_HT5}`).bind(diem,id,sbd,THU_NGHIEM_HT5,sbd,now,now,id,sbd,soCau,soCau).run()
}
