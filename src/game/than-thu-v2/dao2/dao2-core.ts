/**
 * LÕI THUẦN của Đảo thần thú · GAME HÓA 2.0 (bản vẽ docs/ban-ve-game-hoa-2-2709/Moi-Dao*.dc.html, hợp đồng docs/hop-dong-game-hoa-2.md).
 * Luật chơi GIỮ NGUYÊN (chuyến 6 ải, máu, Cuồng nộ, EXP do máy chủ chấm) — tệp này chỉ ĐỌC CHẶT dữ liệu máy chủ và đổi thành chữ/số để vẽ.
 * Không tự tính thưởng, không bịa số: thiếu dữ liệu ⇒ null ⇒ màn ẩn phần đó.
 */
import type {LoiGiaiCauTruc} from '../../../data/examContent'
import {chuanHoaLoiGiaiCau} from '../../../lib/chuan-hoa-loi-giai'
import type {CauDao} from '../dao/kieu'

/** Số ải tối đa của một chuyến thám hiểm (máy chủ `SO_CAU_CHUYEN`). */
export const SO_AI_CHUYEN=6
/** Lời khoá Đảo của máy chủ (`LOI_KHOA_DAO`). Chỉ dùng khi máy chủ quên gửi `message`/`loiKhoaDao` — chữ phải trùng từng ký tự. */
export const LOI_KHOA_DAO_MAC_DINH='Có xe hàng đang bị phục kích, hãy hoàn thành Hộ Tống trước khi ra Đảo nhé!'
export const THONG_BAO_TRONG_2='Hôm nay chưa có câu nào cho em ở đảo. Em quay lại sau nhé.'

// ───────────── vai ải + gợi ý M3 ─────────────
export type VaiAi2='moi'|'on_lai'|'trum'
/** Gợi ý M3 (Bùa Trợ giảng) máy chủ gửi kèm câu: Phần I gạch 2 phương án SAI (máy chủ chọn, KHÔNG có đáp án); Phần II/III mở trước ô Kiến thức cốt lõi. */
export interface GoiYM3{gach?:('A'|'B'|'C'|'D')[];cotLoi?:string}
/** Câu của chuyến 2.0 = câu công khai + `vai` + (tuỳ) `goiY`. */
export interface CauDao2 extends CauDao{vai?:string;goiY?:unknown;/** Nhãn nợ (Sổ nợ 29/09). */nhanNo?:string}
export const TEN_VAI:Record<VaiAi2,string>={moi:'Câu mới',on_lai:'Ôn lại',trum:'Trùm ải'}
/** Nhãn ngắn trên 6 ô vai của tấm dưới bản đồ. */
export const NHAN_O_VAI:Record<VaiAi2,string>={moi:'Mới',on_lai:'Ôn lại',trum:'Trùm'}
export const docVai=(v:unknown):VaiAi2|null=>v==='moi'||v==='on_lai'||v==='trum'?v:null
/** Đọc chặt `goiY`: gạch = đúng 1–2 chữ A–D khác nhau (chỉ Phần I) · cốt lõi = chuỗi có chữ. Sai dạng ⇒ null (không gợi ý, không đoán). */
export function docGoiY(raw:unknown,phan?:string):GoiYM3|null{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return null
 const o=raw as Record<string,unknown>,ra:GoiYM3={}
 if(phan==='I'&&Array.isArray(o.gach)){const g=[...new Set(o.gach.map(x=>String(x).trim().toUpperCase()))].filter((x):x is 'A'|'B'|'C'|'D'=>/^[ABCD]$/.test(x));if(g.length>=1&&g.length<=2)ra.gach=g.sort()}
 if(typeof o.cotLoi==='string'){const c=o.cotLoi.trim();if(c&&!c.includes('[object Object]'))ra.cotLoi=c}
 return ra.gach||ra.cotLoi?ra:null}
/** "phương án A và D" (đúng thứ tự chữ cái). */
export const chuGach=(g:readonly string[])=>g.length===2?`phương án ${g[0]} và ${g[1]}`:`phương án ${g[0]}`

// ───────────── hoa2-sanh ─────────────
export interface ChienDich2{id:string;ten:string;hanNop:string;D:number|null;tong:number;coXat:number;thanhThao:number;canDayLai:number;thanhThaoTangTu:string|null}
export interface Ruong2{daLam:number;tong:number;moDuoc:boolean;daMo:boolean;vang:number|null}
export interface Sanh2{ngay:string;chienDich:ChienDich2|null;theLuc:{con:number;tong:number}|null;huyetChien:boolean;dao:{con:number}|null;doan:{con:number}|null;khoaDao:boolean;loiKhoaDao:string;ruong:Ruong2|null;canChonThu:boolean}
const so=(x:unknown):number|null=>typeof x==='number'&&Number.isFinite(x)&&x>=0?Math.floor(x):null
const chuoi=(x:unknown)=>typeof x==='string'?x.trim():''
const vat=(x:unknown):Record<string,unknown>|null=>x&&typeof x==='object'&&!Array.isArray(x)?x as Record<string,unknown>:null
/** Đọc CHẶT phản hồi `hoa2-sanh`. `cheDo2 !== true` (cờ tắt / máy chủ cũ) ⇒ null ⇒ Đảo cũ. */
export function docSanh2(raw:unknown):Sanh2|null{
 const r=vat(raw);if(!r||r.cheDo2!==true)return null
 const cd=vat(r.chienDich),tl=vat(r.theLuc),ru=vat(r.ruong),qua=vat(ru?.qua)
 const tong=so(cd?.tong)
 const chienDich:ChienDich2|null=cd&&chuoi(cd.id)&&tong!==null?{id:chuoi(cd.id),ten:chuoi(cd.ten),hanNop:chuoi(cd.hanNop),D:so(cd.D),tong,
  coXat:Math.min(tong,so(cd.coXat)??0),thanhThao:Math.min(tong,so(cd.thanhThao)??0),canDayLai:so(cd.canDayLai)??0,thanhThaoTangTu:chuoi(cd.thanhThaoTangTu)||null}:null
 const con=(x:unknown)=>{const o=vat(x),n=so(o?.con);return n===null?null:{con:n}}
 const theLuc=so(tl?.con)!==null&&so(tl?.tong)!==null?{con:so(tl!.con)!,tong:so(tl!.tong)!}:null
 const ruong:Ruong2|null=ru&&so(ru.daLam)!==null&&so(ru.tong)!==null?{daLam:so(ru.daLam)!,tong:so(ru.tong)!,moDuoc:ru.moDuoc===true,daMo:ru.daMo===true,vang:so(qua?.vang)}:null
 return {ngay:chuoi(r.ngay),chienDich,theLuc,huyetChien:r.huyetChien===true,dao:con(r.dao),doan:con(r.doan),khoaDao:r.khoaDao===true,loiKhoaDao:chuoi(r.loiKhoaDao),ruong,canChonThu:r.canChonThu===true}}
/** Gộp phần tóm tắt mà `start` trả kèm (`theLuc`, `dao`, `doan`) vào sanh đang có — số mới hơn, không gọi thêm. */
export function gopTomTat(s:Sanh2|null,raw:unknown):Sanh2|null{
 const r=vat(raw);if(!s||!r)return s
 const tl=vat(r.theLuc),dao=so(vat(r.dao)?.con),doan=so(vat(r.doan)?.con)
 return {...s,...(so(tl?.con)!==null&&so(tl?.tong)!==null?{theLuc:{con:so(tl!.con)!,tong:so(tl!.tong)!}}:{}),...(dao!==null?{dao:{con:dao}}:{}),...(doan!==null?{doan:{con:doan}}:{})}}

// ───────────── chuyến thứ mấy trong ngày ─────────────
/** "Chuyến thám hiểm k/n": `xong` chuyến đã đi hôm nay (máy này đếm) + số chuyến còn lại = ⌈câu Đảo còn / 6⌉. Không có số Đảo ⇒ null. */
export function soChuyen(daoCon:number|null|undefined,xong:number):{k:number;n:number}|null{
 if(typeof daoCon!=='number'||!Number.isFinite(daoCon)||daoCon<0)return null
 const x=Math.max(0,Math.floor(xong)),n=x+Math.ceil(daoCon/SO_AI_CHUYEN)
 return n>0?{k:Math.min(n,x+1),n}:null}
const khoaChuyen=(sbd:string,ngay:string)=>`dao2:chuyen-xong:${sbd}:${ngay}`
/** Số chuyến đã xong hôm nay trên máy này (tiện ích hiển thị; mất ⇒ 0, không ảnh hưởng điểm). */
export function docSoChuyenXong(sbd:string,ngay:string):number{if(!ngay)return 0;try{const n=Number(localStorage.getItem(khoaChuyen(sbd,ngay)));return Number.isFinite(n)&&n>0?Math.floor(n):0}catch{return 0}}
export function ghiSoChuyenXong(sbd:string,ngay:string,n:number){if(!ngay)return;try{localStorage.setItem(khoaChuyen(sbd,ngay),String(Math.max(0,Math.floor(n))))}catch{/* Không lưu được thì chỉ mất số chuyến trên màn. */}}

// ───────────── nhớ vai + gợi ý theo phiên (lệnh `resume` của máy chủ chỉ trả câu công khai) ─────────────
const khoaPhien=(id:string)=>`dao2:phien:${id}`
export function nhoGoiYPhien(id:string,cau:readonly CauDao2[]){if(!id)return;try{sessionStorage.setItem(khoaPhien(id),JSON.stringify(Object.fromEntries(cau.map(c=>[c.qid,{vai:c.vai??null,goiY:c.goiY??null}]))))}catch{/* Không lưu được: đi tiếp chuyến vẫn chạy, chỉ thiếu nhãn vai. */}}
export function docGoiYPhien(id:string):Record<string,{vai?:unknown;goiY?:unknown}>{try{const o=JSON.parse(sessionStorage.getItem(khoaPhien(id))??'{}');return o&&typeof o==='object'?o:{}}catch{return {}}}
/** Câu `resume` trả về (thiếu vai/gợi ý) + điều máy này đã nhớ lúc `start` ⇒ đủ như lúc đầu. Câu tự có vai thì giữ. */
export function ghepGoiY(cau:readonly CauDao2[],nho:Record<string,{vai?:unknown;goiY?:unknown}>):CauDao2[]{
 return cau.map(c=>{const n=nho[c.qid];if(!n)return c;return {...c,...(c.vai===undefined&&n.vai!=null?{vai:String(n.vai)}:{}),...(c.goiY===undefined&&n.goiY!=null?{goiY:n.goiY}:{})}})}

// ───────────── bản đồ: sương mù + vùng theo dạng ─────────────
/** Số đám sương còn phủ đảo: tỉ lệ câu CHƯA cọ xát × `toiDa` (làm tròn lên — còn câu chưa làm thì còn ít nhất một đám). */
export function soDamSuong(coXat:number,tong:number,toiDa=10):number{if(!(tong>0))return toiDa;const con=Math.max(0,tong-Math.max(0,coXat));return con===0?0:Math.min(toiDa,Math.ceil(toiDa*con/tong))}
export interface Vung{ten:string;daLam:number;dung:number;tiLe:number}
/** Vùng đất theo DẠNG từ `hoa2-cau-da-lam` (chỉ câu em ĐÃ làm của chiến dịch đang chạy): % = số câu em làm đúng ở lần gần nhất / số câu đã làm của dạng.
 *  Nhiều câu nhất lên trước; tối đa `toiDa` vùng. Dữ liệu sai dạng ⇒ []. */
export function vungTheoDang(raw:unknown,chienDichId?:string|null,toiDa=6):Vung[]{
 const r=vat(raw);if(!r||!Array.isArray(r.cau))return []
 const nhom=new Map<string,{daLam:number;dung:number}>()
 for(const x of r.cau){const c=vat(x);if(!c)continue;if(chienDichId&&chuoi(c.chienDichId)!==chienDichId)continue
  const ten=chuoi(c.tenDang);if(!ten)continue;const g=nhom.get(ten)??{daLam:0,dung:0};g.daLam++;if(c.lanCuoiDung===true)g.dung++;nhom.set(ten,g)}
 return [...nhom.entries()].map(([ten,g])=>({ten,...g,tiLe:Math.round(100*g.dung/g.daLam)})).sort((a,b)=>b.daLam-a.daLam||a.ten.localeCompare(b.ten,'vi')).slice(0,toiDa)}
/** Ngày ôn lại (`henOn`) của các câu vừa làm, đọc từ `hoa2-cau-da-lam`. */
export function henOnCua(raw:unknown,qids:readonly string[]):Record<string,string>{
 const r=vat(raw),ra:Record<string,string>={};if(!r||!Array.isArray(r.cau))return ra
 for(const x of r.cau){const c=vat(x);if(c&&qids.includes(chuoi(c.qid))&&/^\d{4}-\d{2}-\d{2}$/.test(chuoi(c.henOn)))ra[chuoi(c.qid)]=chuoi(c.henOn)}
 return ra}

// ───────────── ngày giờ (luật A1.6: "Thứ Năm 01/10") ─────────────
const THU=['Chủ Nhật','Thứ Hai','Thứ Ba','Thứ Tư','Thứ Năm','Thứ Sáu','Thứ Bảy']
/** "YYYY-MM-DD" ⇒ "Thứ Sáu 02/10". Sai dạng ⇒ ''. */
export function chuNgay(iso:string):string{const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);if(!m)return '';const d=new Date(Date.UTC(+m[1]!,+m[2]!-1,+m[3]!));return Number.isNaN(d.getTime())?'':`${THU[d.getUTCDay()]} ${m[3]}/${m[2]}`}

// ───────────── lời giải → khối LỜI GIẢI chuẩn của TheCau ─────────────
/** Lời giải thô của kho (object / chuỗi JSON / chữ) ⇒ `LoiGiaiCauTruc` mà `TheCau` chế độ `xem_lai` vẽ: LỜI GIẢI → KIẾN THỨC CỐT LÕI → từng phương án/ý ✓ ✗ (Phần III: bước + kết quả).
 *  Đọc bằng `chuanHoaLoiGiaiCau` (MỘT bộ đọc cho mọi app). Kho thiếu ⇒ `chot` rỗng ⇒ TheCau tự nói "Thầy chưa nhập lời giải cho câu này." — cấm dựng chữ thay. */
export function loiGiaiChoTheCau(solution:unknown,phan:string,dapAn:string):LoiGiaiCauTruc{
 const lg=chuanHoaLoiGiaiCau(solution,phan||'I',dapAn||'')
 const ra:LoiGiaiCauTruc={chot:lg.chot}
 if(lg.lyDo?.length){
  if(phan==='II'){const m:NonNullable<LoiGiaiCauTruc['tungY']>={};for(const p of lg.lyDo){const k=p.khoa.toLowerCase();if(/^[abcd]$/.test(k))m[k as 'a']={dung:p.dung,viSao:p.ly}}ra.tungY=m}
  else if(phan==='I'){const m:NonNullable<LoiGiaiCauTruc['tungPa']>={};for(const p of lg.lyDo){const k=p.khoa.toUpperCase();if(/^[ABCD]$/.test(k))m[k as 'A']={dung:p.dung,viSao:p.ly}}ra.tungPa=m}}
 if(lg.buoc?.length)ra.buoc=lg.buoc
 const kq=(()=>{const o=vat(typeof solution==='string'?(()=>{try{return JSON.parse(solution)}catch{return null}})():solution);const k=o?.ket_qua??o?.ketQua;return typeof k==='string'&&k.trim()?k.trim():''})()
 if(kq)ra.ketQua=kq
 return ra}
/** Đáp án Phần II ("DSDS") ⇒ 4 ô Đ/S cho TheCau. Sai dạng ⇒ undefined (TheCau không tô). */
export const dapAnDungSai=(s:string):['D'|'S','D'|'S','D'|'S','D'|'S']|undefined=>/^[DS]{4}$/.test(s)?s.split('') as ['D'|'S','D'|'S','D'|'S','D'|'S']:undefined
