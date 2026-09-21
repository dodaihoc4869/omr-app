/** LÕI THUẦN của Đảo thần thú: chỉ đổi CÁCH KỂ — mọi con số lấy từ hồ sơ máy chủ trả, không tự tính thưởng, không bịa. */
import {PETS} from '../core'
import type {Mastery} from '../core'
import {BATTLE_SKINS} from '../learning-battle'
import {EVOLUTION_LEVELS,evolutionStage} from '../evolution'
import {thanhExp} from '../../than-thu-hoa-hoc/kinh-nghiem'
import {lyDoThuong} from '../ly-do-thuong'
import type {DaoExp,DaoProfile,LyDoThuong,VaiAi} from './kieu'

export const CAP_TOI_DA=120
/** Bốn nhóm ải, theo đúng thứ tự và suất của `chooseSession` (core.ts): 2 yếu · 1 tới hạn · 2 lấp · 1 thử thách. */
export const NHOM_AI:readonly {vai:VaiAi;ten:string;suat:number;ta:string}[]=[
 {vai:'yeu',ten:'Sửa lỗi',suat:2,ta:'dạng em hay sai'},
 {vai:'toi_han',ten:'Ký ức',suat:1,ta:'câu đến lịch ôn lại'},
 {vai:'lap',ten:'Luyện đều',suat:2,ta:'câu vừa sức để giữ nhịp'},
 {vai:'thu_thach',ten:'Trùm ải',suat:1,ta:'câu khó hơn sức em một bậc'},
]
export const tenNhomAi=(vai:VaiAi|undefined)=>NHOM_AI.find(n=>n.vai===vai)?.ten??'Luyện đều'
/** Đếm ải theo vai của một lượt THẬT (máy chủ trả `role`); câu thiếu `role` (Worker cũ, lệnh resume) tính là "lấp". */
export function demNhomAi(cau:readonly {role?:VaiAi}[]){return NHOM_AI.map(n=>({...n,so:cau.filter(c=>(c.role??'lap')===n.vai).length}))}

export function chiSoThu(pet:string){return Math.max(0,PETS.findIndex(p=>p.id===pet))}
export function tenThu(p:Pick<DaoProfile,'pet'|'nickname'>){return p.nickname||BATTLE_SKINS[chiSoThu(p.pet)]!.name}

/** Vòng EXP quanh thú: `profile.exp` là EXP trong ống của cấp hiện tại, `thanhExp(cap)` là sức chứa ống. */
export function vongExp(cap:number,exp:number){const can=thanhExp(cap);if(cap>=CAP_TOI_DA||can<=0)return {toiDa:true,can:0,con:0,tiLe:1}
 const co=Math.max(0,Math.min(can,Math.floor(exp)));return {toiDa:false,can,con:can-co,tiLe:co/can}}

/** Trần hấp thụ tối đa mỗi ngày (khi đạt nhiệm vụ ngày). = `HAP_THU_DAT` của Code 1 (`src/lib/hap-thu-ngay.ts`); đổi sang import khi tệp ấy có. */
export const HAP_THU_TOI_DA_NGAY=200
export interface HapThuView{da:number;toiDa:number;tiLe:number;chu:string;bao:string}
/** THANH "Hôm nay {tên} đã hấp thụ 120 / 200 EXP" + lời báo khi lần nạp bị chặn (giọng trung tính, nói thật). Thiếu/sai dạng ⇒ null (ẩn, KHÔNG bịa số).
 *  `coExpDeNap` = ống nghiệm đang có EXP chờ nạp: chỉ khi đó lời báo mới có nghĩa (không có gì để nạp thì không cần báo bị chặn). */
export function hapThuHienThi(h:DaoProfile['hapThuHomNay'],ten:string,coExpDeNap:boolean):HapThuView|null{
 if(!h||typeof h!=='object'||!Number.isFinite(h.da)||!Number.isFinite(h.tran)||h.da<0||h.tran<0)return null
 const toiDa=HAP_THU_TOI_DA_NGAY,da=Math.min(toiDa,Math.floor(h.da)),tran=Math.min(toiDa,Math.floor(h.tran))
 let bao=''
 if(coExpDeNap){
  if(h.lyDo==='chua_hoc')bao='Thần thú chỉ ăn vào ngày em có học. Em làm vài câu rồi quay lại nạp nhé.'
  else if(h.lyDo==='no')bao=tran>=toiDa?`Hôm nay ${ten} đã ăn no. EXP còn lại nằm trong ống nghiệm, mai em nạp tiếp.`:`Đạt nhiệm vụ ngày hôm nay thì ${ten} ăn được thêm ${toiDa-tran} EXP.`}
 return {da,toiDa,tiLe:da/toiDa,chu:`Hôm nay ${ten} đã hấp thụ ${da} / ${toiDa} EXP`,bao}}

export interface MucTieu{loai:'cap'|'dang'|'khien'|'tien-hoa';tieuDe:string;phu:string;tiLe:number}
/** Dạng gần thành thạo nhất: nhiều sao nhất trong các dạng chưa đủ 3 sao; hoà thì dạng tới hạn sớm hơn. */
export function dangGanThanhThao(mastery:readonly Mastery[]){return [...mastery].filter(m=>m.stage<3).sort((a,b)=>b.stage-a.stage||a.due-b.due||a.key.localeCompare(b.key))[0]}
export function manhKhien(profile:Pick<DaoProfile,'khienRen'>,exp?:DaoExp|null){const m=exp?.manhKhien??profile.khienRen;return m&&Number.isFinite(m.manh)&&m.moiKhien>0?{manh:Math.max(0,Math.floor(m.manh)),moiKhien:Math.floor(m.moiKhien)}:null}
/** 3 mục tiêu gần nhất: lên cấp · thành thạo một dạng · rèn khiên (không có số mảnh ⇒ thay bằng mốc tiến hoá kế, không bịa). */
export function mucTieuGanNhat(profile:DaoProfile,exp?:DaoExp|null,tenDang:Readonly<Record<string,string>>={}):MucTieu[]{
 const ra:MucTieu[]=[],v=vongExp(profile.cap,profile.exp)
 ra.push(v.toiDa?{loai:'cap',tieuDe:`Đã đạt cấp ${CAP_TOI_DA}`,phu:'cấp cao nhất',tiLe:1}:{loai:'cap',tieuDe:`Lên cấp ${profile.cap+1}`,phu:`còn ${v.con.toLocaleString('vi-VN')} EXP`,tiLe:v.tiLe})
 const d=dangGanThanhThao(profile.mastery)
 ra.push(d?{loai:'dang',tieuDe:tenDang[d.key]?`Thành thạo dạng ${tenDang[d.key]}`:'Thành thạo thêm một dạng bài',phu:`${d.stage}/3 sao`,tiLe:d.stage/3}
  :{loai:'dang',tieuDe:profile.mastery.length?'Giữ phong độ các dạng đã thành thạo':'Gặp dạng bài đầu tiên',phu:profile.mastery.length?'đủ 3 sao':'0/3 sao',tiLe:profile.mastery.length?1:0})
 const k=manhKhien(profile,exp),buoc=tienHoaKe(profile.cap)
 if(k)ra.push({loai:'khien',tieuDe:'Rèn khiên',phu:`${k.manh%k.moiKhien}/${k.moiKhien} mảnh`,tiLe:(k.manh%k.moiKhien)/k.moiKhien})
 else if(buoc)ra.push({loai:'tien-hoa',tieuDe:`Tiến hoá dạng ${buoc.dang+1}`,phu:`còn ${buoc.conCap} cấp`,tiLe:buoc.tiLe})
 return ra
}
/** Mốc tiến hoá kế tiếp (null khi đã ở dạng cuối). */
export function tienHoaKe(cap:number){const dang=evolutionStage(cap)+1,moc=EVOLUTION_LEVELS[dang];if(moc===undefined)return null
 const tu=EVOLUTION_LEVELS[dang-1]!;return {dang,moc,conCap:Math.max(0,moc-cap),tiLe:Math.max(0,Math.min(1,(cap-tu)/(moc-tu)))}}
/** Đường tiến hoá 6 dạng: dạng chưa tới là "?" (không lộ hình). */
export function duongTienHoa(cap:number){const hienTai=evolutionStage(cap);return EVOLUTION_LEVELS.map((moc,dang)=>({dang,moc,daToi:dang<=hienTai,hienTai:dang===hienTai}))}

/** Số dạng tới hạn ôn + số dạng đang yếu, đọc thẳng `mastery[]` (yếu = đã gặp mà chưa lần nào tự làm đúng). */
export function tinhHinhDang(mastery:readonly Mastery[],now:number){return {toiHan:mastery.filter(m=>m.stage>0&&m.stage<3&&m.due<=now).length,yeu:mastery.filter(m=>m.stage===0).length,thanhThao:mastery.filter(m=>m.stage>=3).length,daGap:mastery.length}}
/** Một dòng thú "nói" trên đảo — chỉ nói điều hồ sơ có thật. */
export function loiThu(profile:DaoProfile,now:number,chuoiNgay?:number){const ten=tenThu(profile),t=tinhHinhDang(profile.mastery,now)
 if(profile.wallet>0&&profile.cap<CAP_TOI_DA)return `${ten} đang chờ em nạp ${profile.wallet.toLocaleString('vi-VN')} EXP`
 if(chuoiNgay&&chuoiNgay>=2)return `${ten} đang rất vui — em giữ chuỗi ${chuoiNgay} ngày rồi`
 if(t.toiHan>0)return `${ten} nhắc em: ${t.toiHan} dạng đến lịch ôn lại hôm nay`
 if(!t.daGap)return `${ten} háo hức đi chuyến đầu tiên cùng em`
 return `${ten} sẵn sàng lên đường cùng em`}

/** Lý do thưởng khi Worker chưa trả `lyDoThuong`: dùng CHÍNH hàm của máy chủ (`../ly-do-thuong`, Code 5) — mốc = `stage` khi câu có thưởng (20/40/40 = sao 1/2/3). */
export function lyDoThuongTuKetQua(d:{correct:boolean;assisted:boolean;reward:number;stage:number}):LyDoThuong{return lyDoThuong({...d,milestone:d.reward>0?d.stage:0})}

/** SỔ TAY: 3 sao/dạng = `mastery[].stage` (mốc thưởng 20/40/40 = sao 1/2/3). */
export interface ODang{key:string;ten:string;sao:0|1|2|3;daGap:boolean;yeu:boolean;toiHan:boolean}
export interface ChuongSoTay{ma:string;ten:string;dang:ODang[];thanhThao:number}
export interface DuLieuSoTay{chuong:ChuongSoTay[];thanhThao:number;tong:number;yeu:ODang[]}
/**
 * `danhMuc` = lệnh `so-tay` của máy chủ (mọi dạng em ĐƯỢC PHÉP làm, gom theo mã chương); dạng có trong danh mục mà chưa có trong
 * `mastery[]` ⇒ ô "???" (KHÔNG lộ tên). Worker cũ chưa có lệnh ⇒ chỉ liệt kê các dạng em đã gặp, tên lấy từ những câu em từng làm.
 */
export function soTay(mastery:readonly Mastery[],now:number,danhMuc?:readonly {key:string;ten:string;chuong:string}[]|null,tenDang:Readonly<Record<string,string>>={},tenChuong:Readonly<Record<string,string>>={}):DuLieuSoTay{
 const theoKey=new Map(mastery.map(m=>[m.key,m])),nhom=new Map<string,ODang[]>(),daCo=new Set<string>()
 const o=(key:string,ten:string):ODang=>{const m=theoKey.get(key),sao=Math.max(0,Math.min(3,m?.stage??0)) as ODang['sao'];return {key,ten,sao,daGap:!!m,yeu:!!m&&sao===0,toiHan:!!m&&sao>0&&sao<3&&m.due<=now}}
 const them=(ma:string,d:ODang)=>{if(daCo.has(d.key))return;daCo.add(d.key);nhom.set(ma,[...(nhom.get(ma)??[]),d])}
 for(const d of danhMuc??[])them(d.chuong||'',o(d.key,d.ten||tenDang[d.key]||''))
 for(const m of mastery)them(danhMuc?.length?'':'da-gap',o(m.key,tenDang[m.key]||''))
 const chuong=[...nhom.entries()].map(([ma,dang])=>({ma,ten:ma==='da-gap'?'Dạng em đã gặp':ma===''?(danhMuc?.length?'Dạng khác em đã gặp':'Dạng em đã gặp'):tenChuong[ma]||`Nhóm ${ma}`,
  // trong một chương: dạng đã gặp trước (nhiều sao trước), ô "???" dồn cuối
  dang:[...dang].sort((a,b)=>Number(b.daGap)-Number(a.daGap)||b.sao-a.sao||a.ten.localeCompare(b.ten,'vi')||a.key.localeCompare(b.key)),thanhThao:dang.filter(d=>d.sao===3).length}))
  .sort((a,b)=>Number(a.ma==='')-Number(b.ma==='')||a.ma.localeCompare(b.ma))
 const tatCa=chuong.flatMap(c=>c.dang)
 return {chuong,thanhThao:tatCa.filter(d=>d.sao===3).length,tong:tatCa.length,yeu:tatCa.filter(d=>d.yeu)}
}
