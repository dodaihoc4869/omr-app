export interface TomTatKiemTra {
 baiNgayToiThieu?:number; id:string;ngay:string;moLuc:number;hanLuc:number;serverNow:number;trangThai:'cho_nguon'|'sap_den'|'can_lam'|'da_nop'|'het_han';homNay:boolean
 tong:number;daTra:number;con:number;soChang:number;phut:number;soBai:number;tongKienThuc:number;phuDe:number;nguonDayDu:boolean;lyDo:string;thieuNguon:number;diem:number|null;nopLuc:number|null
}
export function docKiemTra(x:unknown):TomTatKiemTra|undefined {
 if(!x||typeof x!=='object'||Array.isArray(x))return
 const o=x as Record<string,unknown>
 if(typeof o.id!=='string'||!o.id||typeof o.ngay!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(o.ngay)||!['cho_nguon','sap_den','can_lam','da_nop','het_han'].includes(String(o.trangThai)))return
 for(const k of ['moLuc','hanLuc','serverNow','tong','daTra','con','soChang','phut','soBai','tongKienThuc','phuDe','thieuNguon'])if(typeof o[k]!=='number'||!Number.isFinite(o[k])||Number(o[k])<0)return
 if(Number(o.daTra)>Number(o.tong)||Number(o.con)!==Number(o.tong)-Number(o.daTra)||Number(o.hanLuc)-Number(o.moLuc)!==86400000)return
 if(typeof o.homNay!=='boolean'||typeof o.nguonDayDu!=='boolean'||typeof o.lyDo!=='string')return
 if(o.diem!==null&&(typeof o.diem!=='number'||o.diem<0||o.diem>10)||o.nopLuc!==null&&typeof o.nopLuc!=='number')return
 if(![undefined,12].includes(o.baiNgayToiThieu as number|undefined))return
 return o as unknown as TomTatKiemTra
}
export const gioKiemTra=(ms:number)=>new Date(ms).toLocaleString('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',hour12:false})
