export interface TomTatGoi7 {
  bat:true; ngay:string; toiThieu:number; daLamHomNay:number; tuLamCon:number; tiepCanCon:number; thieuPhu:number; thieuNgay:number; canHoTro:boolean
  kienThucCu:{tong:number;dat:number;tyLe:number|null}
  goi:{id:string;ten:string;batDau:string;han:string;tong:number;daGap:number;con:number;quota:number;gapHomNay:number;quaHan:boolean;canBoSung:number;nguonDayDu?:boolean;to:string[]}[]
  diemDaDo:{goiId:string;maDe:string;diem:number;luc:string;cauMoi:number;tong:number}[]
}
/** Không biến phản hồi thiếu/sai kiểu thành tiến độ hoàn thành. */
export function docTomTatGoi7(x:unknown):TomTatGoi7|undefined {
  if(!x||typeof x!=='object')return
  const r=x as TomTatGoi7
  const n=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0
  const ngay=(v:unknown)=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)
  if(r.bat!==true||!ngay(r.ngay)||![r.toiThieu,r.daLamHomNay,r.tuLamCon,r.tiepCanCon,r.thieuPhu,r.thieuNgay].every(n)||!Array.isArray(r.goi)||!r.goi.length||!Array.isArray(r.diemDaDo)||!r.kienThucCu)return
  if(!r.goi.every(g=>g&&typeof g.id==='string'&&typeof g.ten==='string'&&ngay(g.han)&&(g.nguonDayDu===undefined||typeof g.nguonDayDu==='boolean')&&[g.tong,g.daGap,g.con,g.quota,g.gapHomNay,g.canBoSung].every(n)&&g.daGap<=g.tong&&g.con===g.tong-g.daGap&&Array.isArray(g.to)&&g.to.every(v=>typeof v==='string')))return
  if(![r.kienThucCu.tong,r.kienThucCu.dat].every(n)||r.kienThucCu.dat>r.kienThucCu.tong||r.kienThucCu.tyLe!==null&&!n(r.kienThucCu.tyLe))return
  if(!r.diemDaDo.every(d=>d&&typeof d.goiId==='string'&&typeof d.maDe==='string'&&n(d.diem)&&d.diem<=10&&n(d.cauMoi)&&n(d.tong)&&d.cauMoi<=d.tong&&typeof d.luc==='string'))return
  return r
}
