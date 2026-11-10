import { goiLenh } from './goi-lenh-thay'
import type { NhanLichSuCau } from './lich-su-cau-len-bang'
import { useAppStore } from '../store/appStore'
import type { NapBpu, LuotBpu } from './bpu/chon-em-bpu'
import { bacCuaMucDo, docCheDo, phanBoGoi, xepCapChua, xepEmPhanTang, type CheDoChonEm, type KetQuaGoi, type PhanBoGoi, type Tang } from './chon-em-phan-tang'
/** loai 'chua_co' = em có mặt nhưng chưa có số đo câu này. tang/lyDo/giangLai chỉ ở em được chọn — KHÔNG đưa lên bản chiếu. */
export interface EmChieu {sbd:string;ten:string;loai:'da_dung'|'du_bao'|'chua_co';p:number|null;luc:string|null;soSai?:number;soLan14?:number;lanCuoiLenBang?:string|null;tang?:Tang;lyDo?:string;lyDoBpu?:string[];giangLai?:{sbd:string;ten:string;tang:Tang;lyDo:string}}
/** Nhãn lịch sử câu dưới tên em (màn thầy + tờ chiếu). Em chưa làm đúng mà ĐÃ SAI câu này (kênh chữa câu gọi đúng em ấy) ⇒ nói thật "Đã sai câu này N lần", không ghi "Dự kiến làm được". */
export function nhanEmChieu(e:EmChieu):NhanLichSuCau{return e.loai!=='da_dung'&&(e.soSai??0)>0?{kieu:'sai',chu:`Đã sai câu này ${e.soSai} lần`}:e.loai==='da_dung'?{kieu:'dung',chu:'Đã tự làm đúng câu này'}:e.loai==='du_bao'?{kieu:'chua_ket_qua',chu:'Dự kiến làm được câu này',phu:'Ước lượng từ kỹ năng, chưa phải kết quả làm câu này'}:{kieu:'chua_ket_qua',chu:'Chưa có số đo câu này'}}
export interface TuyChonEmChieu {
 /** Kênh gọi (nhớ chế độ thầy chọn theo kênh): 'day-hoc' | 'chua-cau' | 'tu-chua' | 'to-chieu' | 'goi-len-bang'. */
 kenh?:string
 cheDo?:CheDoChonEm
 /** Mặc định: kênh + ngày (giờ VN) ⇒ mở lại cùng tờ trong ngày ra cùng em. */
 hatGiong?:string
 daLenTrongBuoi?:ReadonlyMap<string,number>
 /** Chữa câu: em được chọn là em ĐÃ SAI câu ấy, kèm `giangLai` = em đã đúng giảng lại (chỉ hiện cho thầy). */
 capChua?:boolean
 /** Câu → em đang giữ (đổi em một câu không xáo câu khác; tờ chiếu giữ đúng em đã hiện ở xem trước). */
 coDinh?:ReadonlyMap<string,string>
 /** Mức độ câu máy thầy đã biết (máy chủ thiếu thì dùng). */
 mucDo?:ReadonlyMap<string,string|undefined>
 /** Kênh 'bpu': view bảng Bình Phản Ứng (đội, số lần đã lên trong buổi, đúng/giây lượt này) ⇒ bộ chọn theo toàn bộ lịch sử (src/lib/bpu/chon-em-bpu.ts). */
 bpu?:LuotBpu
}
/** Ứng viên đã tải (MỘT lần) — chọn em lại bao nhiêu lần cũng không gọi mạng. */
export interface NapEmChieu {ds:ReadonlyMap<string,readonly EmChieu[]>;mucDo:ReadonlyMap<string,string>;bpu?:NapBpu}
const ngayVN=()=>new Date(Date.now()+7*3600_000).toISOString().slice(0,10)
/** Phân bố tầng của em được chọn (ô "Phân bố" cho thầy). */
export function phanBoEmChieu(m:ReadonlyMap<string,readonly EmChieu[]>,qids:readonly string[]):PhanBoGoi{return phanBoGoi(qids.flatMap(q=>{const e=m.get(q)?.[0];return e?.tang?[{sbd:e.sbd,tang:e.tang}]:[]}))}
type EmBang=Record<string,{ten?:unknown;soLan14?:unknown;lanCuoiLenBang?:unknown}>
/** Tải ứng viên từng câu. Lỗi ⇒ null (nơi gọi báo). Em không có số đo: máy chủ gửi một lần trong `em`, máy thầy tự thêm vào mỗi câu với loai 'chua_co'. */
/** ĐỆM KÊNH BPU (10/11, tác tử tốc độ): bấm «Lên bảng» (L) / «Em khác» (N) từng chờ cả chuyến máy chủ (11 câu D1 theo lịch sử cả lớp, giờ cao điểm hàng trăm ms) mới
 *  hiện em được chọn. Nay bảng nạp TRƯỚC ngay khi có em nộp đầu tiên (`napTruocBpu`), L / N dùng lại (cùng câu + lớp, trong 3 phút, cùng hoặc rộng hơn danh sách em)
 *  ⇒ không chờ mạng, và N không gọi máy chủ lần nữa. Số liệu lịch sử không đổi trong lượt; phần theo lượt (đúng/sai, đã lên bảng) lấy từ view, không từ đệm. */
const NHO_BPU_MS = 180_000
const nhoBpu = new Map<string, {luc:number;sbd:Set<string>;p:Promise<NapEmChieu|null>}>()
const khoaBpu=(qids:readonly string[],lop?:string)=>`${[...new Set(qids)].join(',')}|${lop??''}`
/** Cắt kết quả đệm theo danh sách em đang gọi (em ngoài danh sách không được chọn). */
function locEm(n:NapEmChieu,em:ReadonlySet<string>):NapEmChieu{
 const ds=new Map<string,readonly EmChieu[]>();for(const [q,l] of n.ds)ds.set(q,l.filter(e=>em.has(e.sbd)))
 return {...n,ds}
}
/** Nạp trước ứng viên BPU cho lượt đang chạy (gọi một lần khi có em nộp đầu tiên; gọi lại trong 3 phút cùng câu + lớp thì bỏ qua). Không báo lỗi — lỗi thì L tự gọi như cũ. */
export function napTruocBpu(qids:readonly string[],sbd:readonly string[],lop?:string):void{
 const k=khoaBpu(qids,lop),cu=nhoBpu.get(k),em=[...new Set(sbd)]
 if(!em.length||(cu&&Date.now()-cu.luc<NHO_BPU_MS&&em.every(s=>cu.sbd.has(s))))return
 const p=napEmChieuMang(qids,em,null,lop,'bpu');nhoBpu.set(k,{luc:Date.now(),sbd:new Set(em),p})
 void p.then(r=>{if(!r&&nhoBpu.get(k)?.p===p)nhoBpu.delete(k)},()=>{nhoBpu.delete(k)})
 if(nhoBpu.size>8)for(const [x,v] of nhoBpu)if(Date.now()-v.luc>=NHO_BPU_MS)nhoBpu.delete(x)
}
export async function napEmChieu(qids:readonly string[],sbd:readonly string[],coMat?:ReadonlySet<string>|null,lop?:string,kenh?:string):Promise<NapEmChieu|null>{
 if(kenh==='bpu'){
  const cu=nhoBpu.get(khoaBpu(qids,lop)),em=new Set(sbd.filter(s=>!coMat||coMat.has(s)))
  if(em.size&&cu&&Date.now()-cu.luc<NHO_BPU_MS&&[...em].every(s=>cu.sbd.has(s))){const r=await cu.p;if(r)return locEm(r,em)}
 }
 return napEmChieuMang(qids,sbd,coMat,lop,kenh)
}
async function napEmChieuMang(qids:readonly string[],sbd:readonly string[],coMat?:ReadonlySet<string>|null,lop?:string,kenh?:string):Promise<NapEmChieu|null>{
 const em=[...new Set(sbd)].filter(s=>!coMat||coMat.has(s)),ds=new Map<string,EmChieu[]>(),mucDo=new Map<string,string>();let bpu:NapBpu|undefined
 if(!em.length&&(!lop||coMat))return {ds,mucDo}
 const ids=[...new Set(qids)]
 try{
  // Các lô 120 câu gọi SONG SONG (không nối tiếp từng lô).
  const lo:string[][]=[];for(let i=0;i<ids.length;i+=120)lo.push(ids.slice(i,i+120))
  const kq=await Promise.all(lo.map(q=>goiLenh('/gv/ung-vien-chieu',{qids:q,sbd:em,lop,...(kenh==='bpu'?{kenh}:{})},'Máy chủ chưa có bộ chọn em lên bảng.')))
  for(const r of kq){
   if(!r.ok)throw new Error(r.chu)
   const c=r.du.cau as Record<string,unknown>;if(!c||typeof c!=='object')throw new Error('Chưa có dữ liệu chọn em lên bảng.')
   const bang=(r.du.em&&typeof r.du.em==='object'?r.du.em:{}) as EmBang,sai=(r.du.soSai&&typeof r.du.soSai==='object'?r.du.soSai:{}) as Record<string,Record<string,unknown>>
   const lb=(s:string)=>{const b=bang[s];return {soLan14:Number(b?.soLan14)||0,lanCuoiLenBang:typeof b?.lanCuoiLenBang==='string'?b.lanCuoiLenBang:null}}
   for(const [id,v] of Object.entries(c)){
    if(!Array.isArray(v))continue
    const co=v.filter((e):e is EmChieu=>!!e&&typeof e==='object'&&(!em.length||em.includes(String(e.sbd)))&&typeof e.ten==='string'&&['da_dung','du_bao'].includes(e.loai))
    const daCo=new Set(co.map(e=>e.sbd)),them:EmChieu[]=Object.entries(bang).filter(([s])=>!daCo.has(s)&&(!em.length||em.includes(s))).map(([s,b])=>({sbd:s,ten:typeof b.ten==='string'?b.ten:s,loai:'chua_co',p:null,luc:null}))
    ds.set(id,[...co,...them].map(e=>({...e,...lb(e.sbd),soSai:Number(sai[id]?.[e.sbd])||0})))
   }
   const b=r.du.bpu;if(b&&typeof b==='object'&&(b as NapBpu).em&&typeof (b as NapBpu).em==='object')bpu=b as NapBpu
   const md=r.du.mucDo;if(md&&typeof md==='object')for(const [q,v] of Object.entries(md as Record<string,unknown>))if(typeof v==='string')mucDo.set(q,v)
  }
 }catch{return null}
 return {ds,mucDo,...(bpu?{bpu}:{})}
}
/** Chọn em (thuần, không gọi mạng) theo ĐÚNG thứ tự câu sẽ chiếu; phần tử [0] là em được chọn, còn lại là em thay khi thầy bấm đổi. */
export function chonEmChieu(nap:NapEmChieu,qids:readonly string[],boQua?:ReadonlyMap<string,ReadonlySet<string>>,tuy:TuyChonEmChieu={}):Map<string,EmChieu[]>{
 const ids=[...new Set(qids)],ra=new Map<string,EmChieu[]>()
 for(const id of ids)ra.set(id,(nap.ds.get(id)??[]).filter(e=>!boQua?.get(id)?.has(e.sbd)))
 const kenh=tuy.kenh??'chung',cheDo=tuy.cheDo??docCheDo(kenh)
 const cau=ids.map(q=>({qid:q,bac:bacCuaMucDo(nap.mucDo.get(q)??tuy.mucDo?.get(q)),ungVien:(ra.get(q)??[]).map(e=>({sbd:e.sbd,ten:e.ten,p:e.p,daDung:e.loai==='da_dung',soSai:e.soSai,soLan14:e.soLan14,lanCuoiLenBang:e.lanCuoiLenBang??null}))}))
 const tc={cheDo,hatGiong:tuy.hatGiong??`${kenh}|${ngayVN()}`,daLenTrongBuoi:tuy.daLenTrongBuoi,coDinh:tuy.coDinh,nowMs:Date.now()}
 const cap=tuy.capChua?xepCapChua(cau,tc):null,chon=cap?new Map([...cap].flatMap(([q,c])=>c.lenBang?[[q,c.lenBang] as const]:[])):xepEmPhanTang(cau,tc)
 // Em được chọn lên đầu; em thay giữ thứ tự máy chủ (đã đúng → dự kiến → chưa có số đo).
 for(const id of ids){const k:KetQuaGoi|undefined=chon.get(id),list=ra.get(id)??[];if(!k)continue;const e=list.find(x=>x.sbd===k.sbd),g=cap?.get(id)?.giangLai;if(e)ra.set(id,[{...e,tang:k.tang,lyDo:k.lyDo,...(g?{giangLai:{sbd:g.sbd,ten:g.ten,tang:g.tang,lyDo:g.lyDo}}:{})},...list.filter(x=>x!==e)])}
 return ra
}
/** Tải + chọn một lần (nơi gọi chỉ cần kết quả). Lỗi ⇒ báo thầy, trả rỗng (tờ vẫn chiếu đủ câu cho cả lớp). */
export async function layEmChieu(qids:readonly string[],sbd:readonly string[],coMat?:ReadonlySet<string>|null,lop?:string,boQua?:ReadonlyMap<string,ReadonlySet<string>>,tuy:TuyChonEmChieu={}){
 // Bình Phản Ứng: bộ chọn riêng tải SONG SONG với dữ liệu (import động — không vào gói mở /gv).
 const bpu=tuy.kenh==='bpu'&&tuy.bpu?import('./bpu/chon-em-bpu'):null
 const nap=await napEmChieu(qids,sbd,coMat,lop,bpu?'bpu':undefined)
 if(!nap){useAppStore.getState().showToast('Chưa đọc được em phù hợp. Tờ vẫn chiếu đủ câu để thầy chữa chung.','warn');return new Map<string,EmChieu[]>()}
 const ra=chonEmChieu(nap,qids,boQua,tuy)
 return bpu&&tuy.bpu?(await bpu).xepTheoBpu(ra,nap.bpu,tuy.bpu,Date.now()):ra
}
