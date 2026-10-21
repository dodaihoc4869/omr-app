import { goiLenh } from './goi-lenh-thay'
import type { NhanLichSuCau } from './lich-su-cau-len-bang'
import { useAppStore } from '../store/appStore'
import { bacCuaMucDo, docCheDo, phanBoGoi, xepCapChua, xepEmPhanTang, type CheDoChonEm, type KetQuaGoi, type PhanBoGoi, type Tang } from './chon-em-phan-tang'
/** loai 'chua_co' = em có mặt nhưng chưa có số đo câu này (máy chủ 21/10). tang/lyDo chỉ ở em được chọn — KHÔNG đưa lên bản chiếu. */
export interface EmChieu {sbd:string;ten:string;loai:'da_dung'|'du_bao'|'chua_co';p:number|null;luc:string|null;soSai?:number;soLan14?:number;lanCuoiLenBang?:string|null;tang?:Tang;lyDo?:string;giangLai?:{sbd:string;ten:string;tang:Tang;lyDo:string}}
export function nhanEmChieu(e:EmChieu):NhanLichSuCau{return e.loai==='da_dung'?{kieu:'dung',chu:'Đã tự làm đúng câu này'}:e.loai==='du_bao'?{kieu:'chua_ket_qua',chu:'Dự kiến làm được câu này',phu:'Ước lượng từ kỹ năng, chưa phải kết quả làm câu này'}:{kieu:'chua_ket_qua',chu:'Chưa có số đo câu này'}}
export interface TuyChonEmChieu {
 /** Kênh gọi (nhớ chế độ thầy chọn theo kênh): 'day-hoc' | 'dau-gio' | 'chua-cau' | 'tu-chua' | 'to-chieu' | 'goi-len-bang'. */
 kenh?:string
 cheDo?:CheDoChonEm
 /** Mặc định: kênh + ngày (giờ VN) ⇒ mở lại cùng tờ trong buổi ra cùng em. */
 hatGiong?:string
 daLenTrongBuoi?:ReadonlyMap<string,number>
 /** Chữa câu: em được chọn là em ĐÃ SAI câu ấy, kèm `giangLai` = em đã đúng giảng lại (chỉ hiện cho thầy). */
 capChua?:boolean
 /** Câu → em đang giữ (đổi em một câu không xáo câu khác). */
 coDinh?:ReadonlyMap<string,string>
 /** Mức độ câu máy thầy đã biết (máy chủ thiếu thì dùng). */
 mucDo?:ReadonlyMap<string,string|undefined>
}
const ngayVN=()=>new Date(Date.now()+7*3600_000).toISOString().slice(0,10)
/** Phân bố tầng của em được chọn (ô "Phân bố" cho thầy). */
export function phanBoEmChieu(m:ReadonlyMap<string,readonly EmChieu[]>,qids:readonly string[]):PhanBoGoi{return phanBoGoi(qids.flatMap(q=>{const e=m.get(q)?.[0];return e?.tang?[{sbd:e.sbd,tang:e.tang}]:[]}))}
/** Ứng viên lên bảng từng câu; phần tử [0] là em được chọn theo phân tầng (src/lib/chon-em-phan-tang.ts), phần còn lại là em thay khi thầy bấm đổi. */
export async function layEmChieu(qids:readonly string[],sbd:readonly string[],coMat?:ReadonlySet<string>|null,lop?:string,boQua?:ReadonlyMap<string,ReadonlySet<string>>,tuy:TuyChonEmChieu={}){
 const em=[...new Set(sbd)].filter(s=>!coMat||coMat.has(s)),ra=new Map<string,EmChieu[]>(),mucDo=new Map<string,string>()
 if(!em.length&&(!lop||coMat))return ra
 const ids=[...new Set(qids)]
 try{
 for(let i=0;i<ids.length;i+=120){const r=await goiLenh('/gv/ung-vien-chieu',{qids:ids.slice(i,i+120),sbd:em,lop},'Máy chủ chưa có bộ chọn em lên bảng.');if(!r.ok)throw new Error(r.chu);const c=r.du.cau as Record<string,unknown>;if(!c||typeof c!=='object')throw new Error('Chưa có dữ liệu chọn em lên bảng.');for(const [id,v] of Object.entries(c)){if(!Array.isArray(v))continue;ra.set(id,v.filter((e):e is EmChieu=>!!e&&typeof e==='object'&&(!em.length||em.includes(String(e.sbd)))&&typeof e.ten==='string'&&['da_dung','du_bao','chua_co'].includes(e.loai)))};const md=r.du.mucDo;if(md&&typeof md==='object')for(const [q,v] of Object.entries(md as Record<string,unknown>))if(typeof v==='string')mucDo.set(q,v)}
 }catch{useAppStore.getState().showToast('Chưa đọc được em phù hợp. Tờ vẫn chiếu đủ câu để thầy chữa chung.','warn');return new Map<string,EmChieu[]>()}
 for(const id of ids)ra.set(id,(ra.get(id)??[]).filter(e=>!boQua?.get(id)?.has(e.sbd)))
 const kenh=tuy.kenh??'chung',cheDo=tuy.cheDo??docCheDo(kenh)
 const cau=ids.map(q=>({qid:q,bac:bacCuaMucDo(mucDo.get(q)??tuy.mucDo?.get(q)),ungVien:(ra.get(q)??[]).map(e=>({sbd:e.sbd,ten:e.ten,p:e.p,daDung:e.loai==='da_dung',soSai:e.soSai,soLan14:e.soLan14,lanCuoiLenBang:e.lanCuoiLenBang??null}))}))
 const tc={cheDo,hatGiong:tuy.hatGiong??`${kenh}|${ngayVN()}`,daLenTrongBuoi:tuy.daLenTrongBuoi,coDinh:tuy.coDinh,nowMs:Date.now()}
 const cap=tuy.capChua?xepCapChua(cau,tc):null,chon=cap?new Map([...cap].flatMap(([q,c])=>c.lenBang?[[q,c.lenBang] as const]:[])):xepEmPhanTang(cau,tc)
 // Em được chọn lên đầu; em thay giữ thứ tự máy chủ (đã đúng → dự kiến → chưa có số đo).
 for(const id of ids){const k:KetQuaGoi|undefined=chon.get(id),list=ra.get(id)??[];if(!k)continue;const e=list.find(x=>x.sbd===k.sbd),g=cap?.get(id)?.giangLai;if(e)ra.set(id,[{...e,tang:k.tang,lyDo:k.lyDo,...(g?{giangLai:{sbd:g.sbd,ten:g.ten,tang:g.tang,lyDo:g.lyDo}}:{})},...list.filter(x=>x!==e)])}
 return ra
}
