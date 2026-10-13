import { goiLenh } from './goi-lenh-thay'
import type { NhanLichSuCau } from './lich-su-cau-len-bang'
import { useAppStore } from '../store/appStore'
export interface EmChieu {sbd:string;ten:string;loai:'da_dung'|'du_bao';p:number|null;luc:string|null}
export function nhanEmChieu(e:EmChieu):NhanLichSuCau{return {kieu:e.loai==='da_dung'?'dung':'chua_ket_qua',chu:e.loai==='da_dung'?'Đã tự làm đúng câu này':'Dự kiến làm được câu này',...(e.loai==='du_bao'?{phu:'Ước lượng từ kỹ năng, chưa phải kết quả làm câu này'}:{})}}
export async function layEmChieu(qids:readonly string[],sbd:readonly string[],coMat?:ReadonlySet<string>|null,lop?:string,boQua?:ReadonlyMap<string,ReadonlySet<string>>){
 const em=[...new Set(sbd)].filter(s=>!coMat||coMat.has(s)),ra=new Map<string,EmChieu[]>()
 if(!em.length&&(!lop||coMat))return ra
 const ids=[...new Set(qids)]
 try{
 for(let i=0;i<ids.length;i+=120){const r=await goiLenh('/gv/ung-vien-chieu',{qids:ids.slice(i,i+120),sbd:em,lop},'Máy chủ chưa có bộ chọn em lên bảng.');if(!r.ok)throw new Error(r.chu);const c=r.du.cau as Record<string,unknown>;if(!c||typeof c!=='object')throw new Error('Chưa có dữ liệu chọn em lên bảng.');for(const [id,v] of Object.entries(c)){if(!Array.isArray(v))continue;ra.set(id,v.filter((e):e is EmChieu=>!!e&&typeof e==='object'&&(!em.length||em.includes(String(e.sbd)))&&typeof e.ten==='string'&&['da_dung','du_bao'].includes(e.loai)))}}
 }catch{useAppStore.getState().showToast('Chưa đọc được em phù hợp. Tờ vẫn chiếu đủ câu để thầy chữa chung.','warn');return new Map<string,EmChieu[]>()}
 // Giữ nhóm có bằng chứng đứng trước dự đoán; rải người đầu để không dồn lên một em.
 const goi=new Map<string,number>()
 for(const id of ids){const list=(ra.get(id)??[]).filter(e=>!boQua?.get(id)?.has(e.sbd));ra.set(id,list);list.sort((a,b)=>Number(b.loai==='da_dung')-Number(a.loai==='da_dung')||(a.loai==='du_bao'?(b.p??0)-(a.p??0):0)||(goi.get(a.sbd)??0)-(goi.get(b.sbd)??0));if(list[0])goi.set(list[0].sbd,(goi.get(list[0].sbd)??0)+1)}
 return ra
}
