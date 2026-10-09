// Kỹ năng đích tách tiên quyết; các tầng cao đã đo có thể chứng minh tầng thấp, không suy ngược từ hồ sơ gộp.
import type { QCau,HoSoOmniEm } from './omni-kieu'
import { vknCaCau } from './omni-p-vkn'
import { trangThaiSprt } from './omni-sprt'
import { tangViKyNang,type DoThiHanhTrinh } from './do-thi-tien-quyet'
import type { QuanSatHanhTrinh } from './hanh-trinh-quan-sat'
import { chuyenDeTuDang,TIEN_QUYET_CHUYEN_DE } from './hanh-trinh-chuyen-de'
export const PHIEN_BAN_HT5='ht5-0910-v1'
export type LoaiL4='chuyen_giao'|'tong_hop'|'lap_luan'
export type VaiTroCau='on_sua'|'chan_doan'|'hoc_moi'|LoaiL4|'kiem_doc_lap'
export interface TienQuyetCau { vkn:string; tang:1|2|3 }
export interface NhanHanhTrinh { dich:string[]; tienQuyet:TienQuyetCau[]; loaiL4?:LoaiL4 }
export interface MucKyNang { vkn:string;tang:number;trangThai:'vung'|'chua_vung'|'chua_du';soNhom:number;soDung:number;soChuyenGiao:number;msTrungVi:number|null;lucCuoi:number;lucSai:number }
const node=(k:string,t:number)=>`${k}@L${t}`
/** Chỉ nhận cấu trúc chuyên gia trên câu đã duyệt; không cho nhãn tự bỏ kỹ năng khỏi Q. */
export function docNhanHanhTrinh(v:unknown,q:QCau,duyet:boolean):NhanHanhTrinh|null {
  if(!duyet||!v||typeof v!=='object'||Array.isArray(v))return null
  const o=v as Record<string,unknown>,ks=new Set(vknCaCau(q))
  if(!Array.isArray(o.kyNangDich)||!o.kyNangDich.length||!o.kyNangDich.every(k=>typeof k==='string'&&ks.has(k)))return null
  if(!Array.isArray(o.tienQuyet)||!o.tienQuyet.every(p=>p&&typeof p==='object'&&typeof p.vkn==='string'&&/^(nen:|dang:|cd:|.+#\d)/.test(p.vkn)&&[1,2,3].includes(p.tang)))return null
  const ps=o.tienQuyet as TienQuyetCau[],dich=[...new Set(o.kyNangDich as string[])]
  const tang=tangViKyNang(q.mucDo);if(ps.some(p=>p.tang>=tang&&!p.vkn.startsWith('nen:')))return null
  if([...ks].some(k=>!dich.includes(k)&&!ps.some(p=>p.vkn===k)))return null
  const loai=['chuyen_giao','tong_hop','lap_luan'].includes(String(o.loaiL4))?o.loaiL4 as LoaiL4:undefined
  return {dich,tienQuyet:ps.map(p=>({vkn:p.vkn,tang:p.tang})),...(loai?{loaiL4:loai}:{})}
}
export function mucKyNang(qs:readonly QuanSatHanhTrinh[],g:DoThiHanhTrinh):Map<string,MucKyNang> {
  const ra=new Map<string,MucKyNang>(),nhom=new Map<string,{o:QuanSatHanhTrinh;k:string;dung:boolean}>(),times=new Map<string,number[]>(),groups=new Map<string,Set<string>>()
  for(const o of qs)for(const k of o.kn){const t=k.startsWith('nen:')?1:tangViKyNang(o.mucDo);if(!t)continue;const key=`${node(k,t)}|${o.nhom}|${o.ngay}`,cu=nhom.get(key);nhom.set(key,{o,k,dung:(cu?.dung??true)&&o.dung})}
  for(const {o,k,dung} of nhom.values()){
    const t=k.startsWith('nen:')?1:tangViKyNang(o.mucDo),key=node(k,t),m=ra.get(key)??{vkn:k,tang:t,trangThai:trangThaiSprt(g.diem.get(key)??0),soNhom:0,soDung:0,soChuyenGiao:0,msTrungVi:null,lucCuoi:0,lucSai:0}
    const seen=groups.get(key)??new Set<string>();seen.add(o.nhom);groups.set(key,seen);m.soNhom=seen.size;m.soDung+=Number(dung);m.soChuyenGiao+=Number(dung&&o.moi===true&&o.purpose==='de_thu');m.lucCuoi=Math.max(m.lucCuoi,o.luc);if(!dung)m.lucSai=Math.max(m.lucSai,o.luc)
    if(dung&&o.ms!==null&&o.ms>=1000){const ds=times.get(key)??[];ds.push(o.ms);times.set(key,ds)}ra.set(key,m)
  }
  for(const [key,m] of ra){const ds=times.get(key)?.sort((a,b)=>a-b);m.msTrungVi=ds?.length?ds[Math.floor(ds.length/2)]!:null}
  return ra
}
export function daDatMuc(k:string,t:number,m:ReadonlyMap<string,MucKyNang>):boolean {
  const exact=m.get(node(k,t));if(exact?.trangThai==='vung')return true
  // Bằng chứng bậc cao chỉ thay bậc thấp khi chưa có kết luận yếu và không sai bậc thấp sau lần đo cao.
  if(exact?.trangThai==='chua_vung')return false
  for(let u=t+1;u<=4;u++){const h=m.get(node(k,u));if(h?.trangThai==='vung'&&h.soNhom>=9&&h.lucCuoi>(exact?.lucSai??0))return true}return false
}
export function thieuTheoCau(q:QCau,t:number,m:ReadonlyMap<string,MucKyNang>,hs:HoSoOmniEm,nhan:NhanHanhTrinh|null):TienQuyetCau[] {
  if(t<=1)return []
  const ps=nhan?.tienQuyet??vknCaCau(q).flatMap(k=>k.startsWith('nen:')?[{vkn:k,tang:1 as const}]:Array.from({length:t-1},(_,i)=>({vkn:k,tang:(i+1) as 1|2|3})))
  return ps.filter(p=>p.vkn.startsWith('nen:')?hs.vkn[p.vkn]?.trangThai!=='vung'||hs.vkn[p.vkn]?.dayLai===true:!daDatMuc(p.vkn,p.tang,m))
}
export function tienDoMuc(danhMuc:readonly {vkn:string;tang:number}[],m:ReadonlyMap<string,MucKyNang>,t=3){
  const ks=[...new Set(danhMuc.filter(x=>x.tang===t&&!x.vkn.startsWith('nen:')).map(x=>x.vkn))]
  const dat=ks.filter(k=>m.get(node(k,t))?.trangThai==='vung').length
  const yeu=ks.filter(k=>m.get(node(k,t))?.trangThai==='chua_vung').length
  const daDo=ks.filter(k=>m.has(node(k,t))).length
  return {tang:t,tong:ks.length,dat,chuaVung:yeu,chuaDu:ks.length-dat-yeu,daDo,tyLeDat:ks.length?Math.round(1000*dat/ks.length)/10:null,baoPhu:ks.length?Math.round(1000*daDo/ks.length)/10:null}
}
/** Đây là lợi ích ước lượng để chọn câu; chưa phải hiệu ứng nhân quả đã chứng minh. */
export function giaTriHoc(a:{p:number;yeu:number;phut:number;moi:boolean;moKhoa:number;quen:number;chuaRo:boolean;hoTro:number}):number {
  const p=Math.max(0.01,Math.min(0.99,a.p)),zone=Math.exp(-(((p-0.8)/0.22)**2))
  const gain=zone*(0.25+0.75*a.yeu)*(a.moi?1:0.55)
  return (gain+Math.min(0.25,a.moKhoa*0.04)+0.3*a.quen+(a.chuaRo?0.2:0)-Math.min(0.2,a.hoTro*0.04))/Math.max(0.25,a.phut)
}
export function hoTroChuyenDe(q:QCau,hs:HoSoOmniEm):number {
  const cd=chuyenDeTuDang(q.maDang);if(!cd)return 0
  return TIEN_QUYET_CHUYEN_DE[cd]!.filter(p=>!Object.values(hs.vkn).some(k=>chuyenDeTuDang(k.vkn)===p&&k.trangThai==='vung')).length
}
