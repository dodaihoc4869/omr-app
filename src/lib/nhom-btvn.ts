import type {DongTheoDoiBtvn} from './btvn-may-chu-moi'
export type NhomBtvn = DongTheoDoiBtvn & { baiGoc: DongTheoDoiBtvn[]; maTheoSbd: Record<string,string> }
/** Một lần giao dùng chung thời điểm chính xác và đề; giữ mã gốc cho từng em. */
export function nhomBtvn(ds: DongTheoDoiBtvn[]): NhomBtvn[] {
 const groups=new Map<string,DongTheoDoiBtvn[]>()
 for(const t of ds){const key=JSON.stringify([t.giaoLuc,t.maDe]);groups.set(key,[...(groups.get(key)||[]),t])}
 return [...groups.values()].map(rows=>{
  const first=rows.find(t=>t.maCa!=='Riêng')||rows[0]
  const maTheoSbd:Record<string,string>={}
  const hocSinh=rows.flatMap(t=>(t.hocSinh||t.chuaNop.map(e=>({...e,nopLuc:null,soDung:null,soCau:null,thuHoi:false}))).filter(e=>{if(maTheoSbd[e.sbd])return false;maTheoSbd[e.sbd]=t.maBtvn;return true}))
  return {...first,baiGoc:rows,maTheoSbd,maCa:rows.filter(t=>t.maCa!=='Riêng').map(t=>t.maCa).join(', ')||'Riêng',hocSinh,tong:rows.reduce((n,t)=>n+t.tong,0),daNop:rows.reduce((n,t)=>n+t.daNop,0),chuaNop:hocSinh.filter(e=>!e.nopLuc&&!e.thuHoi)}
 })
}
