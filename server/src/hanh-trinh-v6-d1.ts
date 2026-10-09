import type { Env } from './kieu'
import type { QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
import { SQL_HT6 } from './hanh-trinh-v6-schema'
import { KHONG_CA_HT5 } from './hanh-trinh-v5-schema'
import { chayDdlMotLan } from './ddl-mot-lan'
import { fitV6,type MauV6,type MoHinhV6 } from './hanh-trinh-v6-mo-hinh'
import { SQL_DA_CONG_BO } from './cong-bo-diem'
type Row=Record<string,unknown>
export async function docMoHinhV6(env:Env):Promise<MoHinhV6|null>{
  await chayDdlMotLan(env,'hanh_trinh_v6',SQL_HT6)
  const r=await env.DB.prepare("SELECT mo_hinh_json FROM hanh_trinh_v6_fit WHERE khoa='ht6'").first<{mo_hinh_json:string}>()
  try{return r?JSON.parse(r.mo_hinh_json) as MoHinhV6:null}catch{return null}
}
export interface ChonV6 { qid:string;version:string;nhom:string;lop:string;tang:number;phan:string;kn:string[];p:number;x:number[];prop:number;diagnostic?:boolean }
export function lenhChonV6(env:Env,sbd:string,ngay:string,moc:number,now:number,ds:readonly ChonV6[]){
  return env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v6_chon SELECT ?1,?2,?3,json_extract(value,'$.qid'),json_extract(value,'$.version'),json_extract(value,'$.nhom'),json_extract(value,'$.lop'),json_extract(value,'$.tang'),json_extract(value,'$.phan'),json_extract(value,'$.kn'),json_extract(value,'$.p'),json_extract(value,'$.x'),json_extract(value,'$.prop'),?4,COALESCE(json_extract(value,'$.diagnostic'),0) FROM json_each(?5) a WHERE ${KHONG_CA_HT5} AND EXISTS(SELECT 1 FROM hanh_trinh_v5_quyet_dinh z WHERE z.sbd=?1 AND z.ngay=?2 AND z.moc=?3 AND z.tao_luc=?4 AND z.phien_ban='ht6-0910-v1' AND EXISTS(SELECT 1 FROM json_each(z.qids_json) j WHERE j.value=json_extract(a.value,'$.qid')))`).bind(sbd,ngay,moc,now,JSON.stringify(ds))
}
/** Chỉ học từ câu thực sự đã làm độc lập; receipt chưa làm không có phần thưởng. */
export async function ghiDoV6(env:Env,sbd:string,now:number,qs:readonly QuanSatHanhTrinh[]){
  const r=await env.DB.prepare('SELECT * FROM hanh_trinh_v6_chon WHERE sbd=? AND tao_luc>=? ORDER BY tao_luc DESC,moc DESC').bind(sbd,now-17*86400000).all<Row>()
  const groups=new Map<string,QuanSatHanhTrinh[]>()
  for(const o of qs){const key=`${o.nhom}|${o.luc}`,a=groups.get(key)??[];a.push(o);groups.set(key,a)}
  const obs=[...groups.entries()].map(([receipt,a])=>({receipt,a,o:a[0]!,y:a.filter(o=>o.dung).length/a.length,dung:a.every(o=>o.dung),kn:[...new Set(a.flatMap(o=>o.kn))]}))
  const used=new Set<string>(),out:Row[]=[],claimed=new Set<string>()
  for(const c of r.results){
    const o=obs.find(o=>o.o.qid===c.qid&&o.o.version===c.version&&o.o.nhom===c.nhom&&o.o.moi===true&&o.o.luc>=Number(c.tao_luc)&&o.o.luc<=Number(c.tao_luc)+86400000)
    if(!o||used.has(o.receipt))continue;used.add(o.receipt)
    const later=Number(c.prop)>0?obs.find(x=>x.o.moi===true&&x.o.luc>=o.o.luc+7*86400000&&x.o.luc<=o.o.luc+14*86400000&&x.o.nhom!==o.o.nhom&&x.kn.some(k=>o.kn.includes(k))&&!claimed.has(x.receipt)):undefined
    if(later)claimed.add(later.receipt)
    const repeat=obs.find(x=>x.o.nhom===o.o.nhom&&x.o.luc>=o.o.luc+7*86400000&&x.o.luc<=o.o.luc+14*86400000)
    const keys=(a:QuanSatHanhTrinh[])=>JSON.stringify([...new Set(a.map(x=>x.laY?x.id.slice(0,-2):x.id))])
    out.push({receipt:o.receipt,qid:c.qid,version:c.version,lop:c.lop,tang:c.tang,phan:c.phan,p:c.p_truoc,y:o.y,x:c.features_json,prop:c.prop,luc:o.o.luc,ms:o.o.ms,transfer:Number(c.prop)>0&&later?Number(later.dung):null,transferReceipt:Number(c.prop)>0?later?.receipt??null:null,source:keys(o.a),transferSource:later?keys(later.a):'[]',repeat:repeat?Number(repeat.dung):null,repeatReceipt:repeat?.receipt??null,repeatSource:repeat?keys(repeat.a):'[]'})
  }
  if(!out.length)return
  await env.DB.prepare(`INSERT OR IGNORE INTO hanh_trinh_v6_do SELECT ?1,json_extract(value,'$.receipt'),json_extract(value,'$.qid'),json_extract(value,'$.version'),json_extract(value,'$.lop'),json_extract(value,'$.tang'),json_extract(value,'$.phan'),json_extract(value,'$.p'),json_extract(value,'$.y'),json_extract(value,'$.x'),json_extract(value,'$.prop'),json_extract(value,'$.luc'),json_extract(value,'$.ms'),json_extract(value,'$.transfer'),json_extract(value,'$.transferReceipt'),json_extract(value,'$.source'),json_extract(value,'$.transferSource'),json_extract(value,'$.repeat'),json_extract(value,'$.repeatReceipt'),json_extract(value,'$.repeatSource') FROM json_each(?2) WHERE ${KHONG_CA_HT5} ON CONFLICT(sbd,receipt) DO UPDATE SET y=excluded.y,ms=excluded.ms,source_json=excluded.source_json,transfer=excluded.transfer,transfer_receipt=excluded.transfer_receipt,transfer_source_json=excluded.transfer_source_json,nhac_lai=excluded.nhac_lai,nhac_receipt=excluded.nhac_receipt,nhac_source_json=excluded.nhac_source_json WHERE NOT EXISTS(SELECT 1 FROM hanh_trinh_v6_do z WHERE z.sbd=excluded.sbd AND z.transfer_receipt=excluded.transfer_receipt AND z.receipt<>excluded.receipt)`).bind(sbd,JSON.stringify(out)).run()
}
/** Huấn luyện ngoài giờ học; mẫu giới hạn 90 ngày và 50.000 receipt mới nhất, công khai số mẫu thực dùng. */
export async function hocV6Dem(env:Env,now:number){
  await chayDdlMotLan(env,'hanh_trinh_v6',SQL_HT6)
  if(await env.DB.prepare("SELECT 1 FROM ca WHERE trang_thai='mo' LIMIT 1").first())return {soMau:0,hoan:true}

  const r=await env.DB.prepare(`SELECT d.*,${sqlKetQuaV6('d.source_json',true)} y_now,CASE WHEN d.transfer IS NOT NULL AND ${sqlNguonV6('d.transfer_source_json')} THEN ${sqlKetQuaV6('d.transfer_source_json')} ELSE NULL END transfer_ok FROM hanh_trinh_v6_do d WHERE d.luc>=? AND EXISTS(SELECT 1 FROM game_v2_question g WHERE g.qid=d.qid AND g.version=d.version AND json_valid(g.json) AND json_extract(g.json,'$.reviewed')=1) AND ${sqlNguonV6('d.source_json',true)} ORDER BY d.luc DESC,d.sbd,d.receipt LIMIT 50000`).bind(now-90*86400000).all<Row>()
  const ds:MauV6[]=r.results.map(r=>({sbd:String(r.sbd),qid:String(r.qid),version:String(r.version),lop:String(r.lop),tang:Number(r.tang),phan:String(r.phan),p:Number(r.p_truoc),y:Number(r.y_now),luc:Number(r.luc),features:JSON.parse(String(r.features_json)),transfer:r.transfer_ok===null?null:Number(r.transfer_ok),prop:Number(r.prop)}))
  const m=fitV6(ds)
  await env.DB.prepare(`INSERT INTO hanh_trinh_v6_fit SELECT 'ht6',?,?,? WHERE ${KHONG_CA_HT5} ON CONFLICT(khoa) DO UPDATE SET mo_hinh_json=excluded.mo_hinh_json,so_mau=excluded.so_mau,luc=excluded.luc WHERE excluded.luc>=hanh_trinh_v6_fit.luc`).bind(JSON.stringify(m),ds.length,now).run()
  return {soMau:ds.length,soCau:Object.keys(m.cau).length,soCauDaHieuChuan:Object.values(m.cau).filter(x=>x.tot).length,hocDaVuotCong:m.hocTot}
}

export const sqlNguonV6=(field:string,version=false)=>`json_array_length(${field})>0 AND (SELECT COUNT(*) FROM su_kien_hoc s WHERE s.sbd=d.sbd AND s.khoa IN(SELECT value FROM json_each(${field})) AND COALESCE(s.visibility,'')<>'embargoed' AND COALESCE(s.assistance,'none')='none' AND s.ket_qua IS NOT NULL AND (NOT ${version?1:0} OR (s.qid=d.qid AND CASE WHEN json_valid(s.raw_json) THEN json_extract(s.raw_json,'$.ht_cau_version') END=d.version)) AND COALESCE(s.purpose,'') NOT IN('luot','shadow','xem_loi_giai','chua_buoc','luyen_nen') AND (s.nguon<>'thi' OR EXISTS(SELECT 1 FROM ca c WHERE c.ma_ca=s.ma_nguon AND c.trang_thai<>'da_xoa' AND ${SQL_DA_CONG_BO('c')})) AND (s.nguon<>'luyen' OR EXISTS(SELECT 1 FROM luyen_de_2026 l WHERE l.id=s.ma_nguon AND l.sbd=s.sbd AND l.status='submitted') OR EXISTS(SELECT 1 FROM omni_de_thu t WHERE t.id=substr(s.ma_nguon,8) AND s.ma_nguon LIKE 'de_thu:%' AND t.sbd=s.sbd AND t.nop_luc IS NOT NULL)))=json_array_length(${field})`

/** Đọc lại kết quả nguồn hiện tại: chấm lại muộn không để nhãn đúng cũ vào fit/report. */
export function sqlKetQuaV6(field:string,fraction=false):string{
  const sub="CASE WHEN json_valid(s.subitem_json) THEN CASE WHEN json_type(s.subitem_json)='array' THEN s.subitem_json ELSE json_extract(s.subitem_json,'$.y') END END"
  const value=fraction?`CASE WHEN json_array_length(${sub})=4 THEN (SELECT AVG(CASE WHEN value IN(0,1) THEN CAST(value AS REAL) END) FROM json_each(${sub})) ELSE s.ket_qua END`:'s.ket_qua'
  return `(SELECT ${fraction?'AVG':'MIN'}(${value}) FROM su_kien_hoc s WHERE s.sbd=d.sbd AND s.khoa IN(SELECT value FROM json_each(${field})))`
}
