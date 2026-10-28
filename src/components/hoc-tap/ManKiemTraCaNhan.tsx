import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { ArrowLeft, ArrowRight, CalendarDays, Check, CloudCheck, Lock, RefreshCw, Route, Timer } from 'lucide-react'
import { goiHoa2 } from '../hoa2/api'
import { docKiemTra, type TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import type { Question } from '../../game/than-thu-v2/core'
import TheCau from '../TheCau'
import { duTraLoi, propsCauHoc } from './ManLamBaiTap'
import TheKiemTraCaNhan from './TheKiemTraCaNhan'
import BieuTuongKiemTra from './BieuTuongKiemTra'
import { conLai, diemChu, dongHo, gioHan, gioVn, thuNgay } from './kiem-tra-chu'
import { hoiXacNhan } from '../hop-thoai'
import { taoKhoGio, useGiayConLai, type KhoGio } from '../../lib/dong-ho-thi'
import { docKtcnDangLam, ghiKtcnDangLam, xoaKtcnDangLam } from '../../lib/ktcn-dang-lam'
import './hoc-tap.css'
import './kiem-tra-ca-nhan.css'
import { phanHoi } from '../../lib/phan-hoi'
import { CHU_MAY_CHU_BAN_EM, choLuiDanMs, chuCuaLoi, laLoiMayChuBan, laLoiTamThoi } from '../../lib/loi-may-chu'
import { batCheDoThi } from '../../lib/am-thanh'
import { ChonDungSai, ChonTracNghiem, DeCau, HinhCuoiCau, OTraLoiNgan, BanPhimSo } from './LamCau'
import { nhanPhim, phimTuBanPhim, type PhimSo } from './lam-bai'
import { soOCuaCau } from '../../lib/so-o-tra-loi-ngan'
import { BiKetQua, camTheoDiem, DayKt, laKiemTraDuo, NhanCauKt, OGioKt, TamLuoiKt, TamNopKt, ThanhTrenKt } from '../kiem-tra-duo/KhungKiemTra'
// «Trong» 26/10 (nhóm 2): tờ trình bày styles/trong-lam-bai.css nạp RIÊNG, chỉ khi <html data-trong> (main.tsx gắn trước khi nạp màn) — không cộng byte lượt mở app.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong) void import('../../styles/trong-lam-bai.css').catch(() => {})
// Tên trang chính trên nút «về» (Boss 27/10): giao diện Trong ⇒ «Lộ trình»; giao diện cũ ⇒ «Hôm nay». Viết tại chỗ: nhập mô-đun dùng chung sẽ đẻ mảnh tải riêng (+1 tệp mở app).
const tenTrangChinh = (): string => (typeof document !== 'undefined' && document.documentElement.dataset.trong ? 'Lộ trình' : 'Hôm nay')

// ĐỢT 20 · MÀN KIỂM TRA ÔN TẬP theo bản vẽ docs/ban-ve-dot20 (thầy duyệt 13/10). Logic lưu/đồng hồ/chốt/khôi phục nháp GIỮ NGUYÊN (hợp đồng Codex
// docs/hop-dong-kiem-tra-ca-nhan-1310.md); chỉ đổi trình bày: trang bài = lộ trình chặng + tách "hạn nộp cả bài" với "giờ riêng từng chặng";
// làm chặng = đồng hồ vòng (đỏ --gap khi còn dưới 1 phút), dấu câu đã trả lời, thanh đáy cố định; máy tính có cột phải; kết quả có lọc câu.
// `daTra` của từng chặng: trường CHỈ-THÊM của hoc-tap-ktcn-trang-thai (máy chủ cũ không gửi ⇒ không hiện dòng ấy).
type Chang={stt:number;soCau:number;giay:number;han:number|null;daChot:boolean;daTra?:number}
type Ket={bai:{ten:string;tong:number;daKiem:number;dungLanNay:number}[];cau:{de:Question;tra:string;dung:boolean;dapAn:string;loiGiai:unknown}[];chu:string}
type Loc='tat-ca'|'on'|'trong'|'dung'
function VongDem({phan,nhan,lop,an=false,children}:{phan:number;nhan?:string;lop?:string;an?:boolean;children?:ReactNode}){
 const c=2*Math.PI*42
 return <div className={lop?`ktcn-vong ${lop}`:'ktcn-vong'} role={an?undefined:'img'} aria-label={an?undefined:nhan} aria-hidden={an||undefined}>
  <svg viewBox="0 0 100 100" aria-hidden="true"><circle className="ktcn-vong-nen" cx="50" cy="50" r="42"/><circle className="ktcn-vong-cung" cx="50" cy="50" r="42" strokeDasharray={`${Math.max(0,Math.min(1,phan))*c} ${c}`}/></svg>
  <span>{children}</span>
 </div>
}
/** "Đã trả lời" đúng luật đếm của máy chủ (`duTraKt`): Phần II phải đủ 4 ý — chuỗi thiếu ý như "D-SD" CHƯA tính (22/10, em 12086: màn đếm 28/28 mà thẻ bài hiện 27/28). */
const daTraDu=(c:Pick<Question,'phan'>,v:string|undefined)=>duTraLoi(c.phan,v??'')
/** Chỉ các nút lá nghe từng giây; cây câu hỏi và công thức không dựng lại theo nhịp giờ. */
function DongHoChang({kho,giay,vong=false}:{kho:KhoGio|null;giay:number;vong?:boolean}){
 const sec=Math.max(0,Math.ceil(useGiayConLai(kho)??0)),gap=sec<=60
 if(vong)return <VongDem phan={giay?sec/giay:0} lop={gap?'ktcn-vong-gap':undefined} an><b>{dongHo(sec)}</b><small>còn lại</small></VongDem>
 return <span className="ktcn-dh" data-gap={gap||undefined}><svg viewBox="0 0 36 36" aria-hidden="true"><circle className="ktcn-dh-nen" cx="18" cy="18" r="14"/><circle className="ktcn-dh-cung" cx="18" cy="18" r="14" strokeDasharray={`${giay?Math.min(1,sec/giay)*88:88} 88`}/></svg><time aria-label="Thời gian chặng còn lại">{dongHo(sec)}</time></span>
}
/** Ô đồng hồ chặng của màn Duo — nút lá (đỏ khi còn ≤ 1 phút), cây câu không vẽ lại theo giây. */
function GioChangDuo({kho,nhan}:{kho:KhoGio|null;nhan:string}){
 const sec=Math.max(0,Math.ceil(useGiayConLai(kho)??0))
 return <OGioKt nhan={nhan} gap={sec<=60}>{dongHo(sec)}</OGioKt>
}
function GioConLai({kho,bai=false}:{kho:KhoGio|null;bai?:boolean}){
 const giay=useGiayConLai(kho)??0
 return <>{bai?conLai(giay*1000):dongHo(Math.max(0,Math.ceil(giay)))}</>
}
/** Dòng phụ của chặng ĐÃ CHỐT (thầy 26/10: «Đã chốt · đã trả lời 0/6» dễ hiểu nhầm): nói rõ bỏ trống bao nhiêu câu — cùng số daTra, chỉ đổi lời. */
const chuChot=(so:number,da:number)=>da>=so?`${so} câu · trả lời đủ ${so}/${so}`:da<=0?`${so} câu · bỏ trống cả ${so} câu`:`${so} câu · trả lời ${da}/${so} · bỏ trống ${so-da}`
const khongDangKy=()=>()=>{}
/** Cửa máy chủ nhận bản nháp gửi muộn (khớp GUI_TRE_MS của server/src/kiem-tra-ca-nhan.ts): 10 phút sau hạn, chỉ phần em trả lời trước hạn. */
const GUI_TRE_MS=10*60_000
function useHetGio(kho:KhoGio|null){
 const lay=()=>!!kho&&kho.conLai()<=0
 return useSyncExternalStore(kho?.dangKy??khongDangKy,lay,lay)
}
export default function ManKiemTraCaNhan({token,sbd,id,onVe,onCapNhat,ban}:{token:string;sbd:string;id:string;onVe:()=>void;onCapNhat:()=>void;/** Tóm tắt bài từ Sảnh (27/10 tốc độ): vẽ ngay thẻ tổng quan khi bấm, số mới về thì thay. */ban?:TomTatKiemTra}) {
 // KIỂU DUOLINGO (thầy 27/10): <html data-trong="hs"> ⇒ màn làm chặng một câu một màn (KhungKiemTra.tsx) — cùng state, cùng lệnh lưu/chốt/đồng hồ.
 // Cả màn kiểm tra: TẮT ÂM THANH, chỉ rung (cờ batCheDoThi của am-thanh.ts, gỡ khi đóng).
 const [duo]=useState(laKiemTraDuo),[moLuoi,setMoLuoi]=useState(false),[hoiNop,setHoiNop]=useState<((ok:boolean)=>void)|null>(null)
 useEffect(()=>batCheDoThi(),[])
 const banDau=ban?.id===id?ban:undefined
 const [tt,setTt]=useState<TomTatKiemTra|undefined>(banDau),[chang,setChang]=useState<Chang[]>([]),[cs,setCs]=useState<Question[]>([]),[stt,setStt]=useState<number|null>(null),[viTri,setViTri]=useState(0),[tra,setTra]=useState<Record<string,string>>({}),[han,setHan]=useState(0),[offset,setOffset]=useState(0),[busy,setBusy]=useState(false),[loi,setLoi]=useState(''),[luu,setLuu]=useState(''),[ket,setKet]=useState<Ket>()
 const hanChay=stt!==null?han:!ket&&tt?.homNay&&tt.nopLuc===null?chang.find(c=>!c.daChot&&c.han!==null)?.han:undefined
 const khoChang=useMemo(()=>hanChay?taoKhoGio(hanChay,()=>Date.now()+offset):null,[hanChay,offset])
 const khoBai=useMemo(()=>tt?taoKhoGio(tt.hanLuc,()=>Date.now()+offset):null,[tt?.hanLuc,offset])
 const hetGio=useHetGio(khoChang)
 const traRef=useRef(tra),revision=useRef(0),day=useRef<Promise<unknown>>(Promise.resolve()),tuNop=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),mounted=useRef(true)
 const tuTiep=useRef(true),lanPhien=useRef(0),henThuLai=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),choThuLai=useRef(false),lanThuLai=useRef(0)
 const [nhipThuLai,setNhipThuLai]=useState(0)
 // TỰ ĐỒNG BỘ BẢN NHÁP (thầy 28/10 «Tự động khôi phục bản nháp trên máy đi nhé»): còn câu chưa lên máy chủ (`chuaGui`) ⇒ tự gửi lại lùi dần 1→30 giây,
 // khi có mạng lại, khi quay lại tab, khi mở lại chặng — em không phải bấm. Mỗi câu nhớ MỐC em trả lời (`lucRef`, giờ máy chủ đã hiệu chỉnh) để máy chủ
 // nhận phần trả lời trước hạn kể cả khi gửi muộn vì máy chủ bận. `ban`: máy chủ báo bận ⇒ câu nhẹ, không hộp lỗi.
 const lucRef=useRef<Record<string,number>>({}),chuaGui=useRef(false),lanDongBo=useRef(0),henDongBo=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),dongBoRef=useRef<()=>void>(()=>{})
 const [mayBan,setBan]=useState(false),[nhipDongBo,setNhipDongBo]=useState(0)
 const huyDongBo=()=>{if(henDongBo.current)clearTimeout(henDongBo.current);henDongBo.current=undefined}
 const conPhien=(lan:number)=>mounted.current&&lanPhien.current===lan
 const huyHenThuLai=()=>{if(henThuLai.current)clearTimeout(henThuLai.current);henThuLai.current=undefined;choThuLai.current=false}
 const key=`ktcn:nhap:${sbd}:${id}:${stt}`
 const khung=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(stt!==null)khung.current?.scrollIntoView?.({block:'start'})},[stt])
 const nhan=(r:Record<string,unknown>)=>{const t=docKiemTra(r.kiemTra);if(!t)throw new Error('Số liệu bài kiểm tra chưa đầy đủ. Em tải lại nhé.');setTt(t);setOffset(t.serverNow-Date.now());if(typeof r.revision==='number')revision.current=r.revision;return t}
 /** Bản nháp trên máy của chặng i: câu trả lời + mốc trả lời từng câu + câu đang làm. Hỏng / không có ⇒ null. */
 const docNhap=(i:number):{han:number;tra:Record<string,unknown>;luc:Record<string,number>;viTri?:number}|null=>{try{const o=JSON.parse(localStorage.getItem(`ktcn:nhap:${sbd}:${id}:${i}`)||'null');if(!o||typeof o!=='object'||!o.tra||typeof o.tra!=='object')return null;return {han:Number(o.han),tra:o.tra,luc:o.luc&&typeof o.luc==='object'?o.luc:{},viTri:typeof o.viTri==='number'?o.viTri:undefined}}catch{return null}}
 /** Chặng đã chốt (hết giờ lúc máy chủ bận / máy tắt) mà máy còn nháp chưa lên: gửi phần em trả lời TRƯỚC hạn (máy chủ nhận trong 10 phút sau hạn). */
 const guiNhapTre=async(i:number,hanC:number,bayGio:number):Promise<boolean>=>{
  const n=docNhap(i);if(!n||n.han!==hanC||bayGio>hanC+GUI_TRE_MS)return false
  const tra=Object.fromEntries(Object.entries(n.tra).filter(([q,v])=>typeof v==='string'&&Number(n.luc[q])<=hanC)),lucTra=Object.fromEntries(Object.keys(tra).map(q=>[q,n.luc[q]]))
  if(!Object.keys(tra).length)return false
  try{const r=await goiHoa2('hoc-tap-ktcn-luu',token,{id,chang:i,tra,lucTra,revision:revision.current});if(typeof r.revision==='number')revision.current=r.revision;try{localStorage.removeItem(`ktcn:nhap:${sbd}:${id}:${i}`)}catch{/* không cản */}return r.daLuu===true}catch{return false}
 }
 const guiNhapTreCacChang=async(ds:Chang[],bayGio:number)=>{let co=false;for(const c of ds)if(c.daChot&&c.han&&await guiNhapTre(c.stt,c.han,bayGio))co=true;return co}
 const tai=async()=>{const lan=lanPhien.current;setBusy(true);setLoi('');try{const r=await goiHoa2('hoc-tap-ktcn-trang-thai',token,{id,kemKetQua:true});if(!conPhien(lan))return;const t=nhan(r);setChang(r.chang as Chang[]);if(r.ketQua&&t.nopLuc!==null){setKet(r.ketQua as Ket);return}if(t.nopLuc===null&&await guiNhapTreCacChang(r.chang as Chang[],t.serverNow)&&conPhien(lan)){const r2=await goiHoa2('hoc-tap-ktcn-trang-thai',token,{id,kemKetQua:true});if(!conPhien(lan))return;nhan(r2);setChang(r2.chang as Chang[])}if(t.nopLuc!==null||t.trangThai==='het_han'){const k=await goiHoa2('hoc-tap-ktcn-ket-qua',token,{id});if(!conPhien(lan))return;nhan(k);setKet(k.ketQua as Ket)}}catch(e){if(conPhien(lan))setLoi(chuCuaLoi(e,'Chưa tải được bài kiểm tra.'))}finally{if(conPhien(lan))setBusy(false)}}
 useEffect(()=>{
  mounted.current=true;tuTiep.current=true;lanPhien.current++;huyHenThuLai();lanThuLai.current=0;tuNop.current=false;revision.current=0;day.current=Promise.resolve();traRef.current={}
  lucRef.current={};chuaGui.current=false;lanDongBo.current=0;huyDongBo();setBan(false)
  setTt(banDau);setChang([]);setCs([]);setStt(null);setHan(0);setOffset(0);setTra({});setKet(undefined);setLuu('')
  void tai()
  return()=>{mounted.current=false;lanPhien.current++;huyHenThuLai();huyDongBo();if(timer.current)clearTimeout(timer.current)}
 },[token,id])
 const save=(submit=false)=>{
  if(stt===null)return Promise.resolve()
  if(timer.current)clearTimeout(timer.current)
  const patch={...traRef.current},part=stt,lan=lanPhien.current
  const p=day.current.catch(()=>{}).then(async()=>{
   if(!conPhien(lan))return
   const lucTra=Object.fromEntries(Object.keys(patch).flatMap(k=>lucRef.current[k]?[[k,lucRef.current[k]]]:[]))
   const r=await goiHoa2(submit?'hoc-tap-ktcn-chot-chang':'hoc-tap-ktcn-luu',token,{id,chang:part,tra:patch,revision:revision.current,...(Object.keys(lucTra).length?{lucTra}:{})})
   if(conPhien(lan)){nhan(r);setBan(false);const khop=JSON.stringify(patch)===JSON.stringify(traRef.current);if(khop||!r.daLuu)chuaGui.current=false;setLuu(r.daLuu?(khop?'Đã lưu trên máy chủ':'Đang lưu…'):'Chặng đã chốt; chỉ dùng bản nháp đã lưu đúng giờ');if(r.daLuu&&khop){try{localStorage.removeItem(`ktcn:nhap:${sbd}:${id}:${part}`)}catch{/* Không làm hỏng lưu máy chủ */}}}
   return r
  });day.current=p
  return p
 }
 const mo=async(i:number)=>{const lan=lanPhien.current;huyHenThuLai();setBusy(true);setLoi('');try{const r=await goiHoa2('hoc-tap-ktcn-start',token,{id,chang:i});if(!conPhien(lan))return;const t=nhan(r);if(r.daChot){xoaKtcnDangLam(sbd);setCs([]);setStt(null);await guiNhapTre(i,Number(r.hanChang),t.serverNow);await tai();return}const questions=r.questions as Question[];setCs(questions);setStt(i);setViTri(0);setHan(Number(r.hanChang));ghiKtcnDangLam(sbd,id,i,Number(r.hanChang));const a=r.tra as Record<string,string>;traRef.current=a;setTra(a);setLuu('Đã tải câu trả lời đã lưu');tuNop.current=false;lanThuLai.current=0
  // Mở lại chặng (kể cả sau khi tắt app): TỰ nạp bản nháp trên máy vào đúng câu em đang làm rồi tự gửi — không còn nút «Khôi phục» (thầy 28/10).
  try{const saved=docNhap(i);if(saved&&saved.han===Number(r.hanChang)){const ids=new Set(questions.map(q=>q.qid));const v=Object.fromEntries(Object.entries(saved.tra).filter(([qid,v])=>ids.has(qid)&&typeof v==='string'&&v.length<=100)) as Record<string,string>
   lucRef.current=Object.fromEntries(Object.entries(saved.luc).filter(([qid,l])=>ids.has(qid)&&Number.isFinite(l))) as Record<string,number>
   if(typeof saved.viTri==='number'&&saved.viTri>=0&&saved.viTri<questions.length)setViTri(saved.viTri)
   if(t.serverNow<Number(r.hanChang)+GUI_TRE_MS&&Object.entries(v).some(([qid,v])=>a[qid]!==v)){traRef.current={...a,...v};setTra(traRef.current);chuaGui.current=true;setLuu('Đang lưu…');setNhipDongBo(n=>n+1)}}}catch{/* Bản nháp máy hỏng: vẫn dùng bản chính đã lưu */}
 }catch(e){if(conPhien(lan))setLoi(chuCuaLoi(e,'Chưa mở được chặng.'))}finally{if(conPhien(lan))setBusy(false)}}
 const chot=async(auto=false)=>{if(stt===null||tuNop.current)return
  const lan=lanPhien.current
  // Nộp tay khi còn câu trống ⇒ hỏi lại bằng hộp app (đợt 20). Hết giờ tự chốt thì không hỏi; hộp đang mở mà hết giờ ⇒ lượt tự chốt đi trước.
  if(!auto&&duo){if(!await new Promise<boolean>(r=>setHoiNop(()=>r)))return;if(tuNop.current)return}
  else if(!auto){const trong=cs.flatMap((c,i)=>daTraDu(c,traRef.current[c.qid])?[]:[i+1]);if(trong.length&&!await hoiXacNhan({tieuDe:`Nộp chặng ${stt+1}?`,noiDung:`Chặng này còn ${trong.length} câu chưa trả lời (câu ${trong.join(', ')}). Nộp chặng sẽ chốt các câu đã lưu, không sửa lại được.`,nhanDongY:`Nộp chặng ${stt+1}`,nhanKhong:'Làm tiếp',vo:'m3'}))return;if(tuNop.current)return}
  if(!conPhien(lan))return
  huyHenThuLai();tuNop.current=true;setBusy(true);setLoi('')
  try{await save(true);if(!conPhien(lan))return;xoaKtcnDangLam(sbd);setCs([]);setStt(null);await tai();if(conPhien(lan))onCapNhat()}
  catch(e){
   if(!conPhien(lan))return
   tuNop.current=false
   // Máy chủ bận / mất mạng: không hộp lỗi; bài giữ trên máy và tự gửi lại (lùi dần bên dưới). Lỗi khác: câu Việt an toàn.
   if(laLoiTamThoi(e)){setBan(laLoiMayChuBan(e));setLuu('Đang lưu…')}else setLoi(chuCuaLoi(e,'Chưa chốt được chặng.'))
   if(auto&&!laLoiTamThoi(e))setLuu('Hết giờ; đang giữ bản nháp trên máy để đối chiếu.')
   if(auto||(khoChang&&khoChang.conLaiNgay()<=0)){
    // Lỗi mạng nhanh không gọi dồn: đợi 2/4/8/16 giây, tối đa 30 giây; bấm thử lại vẫn đi ngay.
    choThuLai.current=true;const doi=Math.min(30_000,2000*2**lanThuLai.current);lanThuLai.current=Math.min(4,lanThuLai.current+1)
    henThuLai.current=setTimeout(()=>{henThuLai.current=undefined;if(!conPhien(lan))return;choThuLai.current=false;setNhipThuLai(v=>v+1)},doi)
   }
  }finally{if(conPhien(lan))setBusy(false)}
 }
 // Tải lại / Pages đổi bản giữa chặng (26/10, em 12095 + 12092 «load lại thế là mất chặng 1»): màn này là lớp phủ do `tab` giữ trong bộ nhớ nên tải lại về trang chủ,
 // đồng hồ chặng vẫn chạy ở máy chủ. Máy nhớ chặng em mở dở (`ktcn-dang-lam`) ⇒ danh sách chặng vừa tải xong thì mở lại ĐÚNG chặng đó (giờ vẫn là giờ đã mở, không đặt lại).
 useEffect(()=>{
  if(!tuTiep.current||busy||!tt||stt!==null)return
  if(tt.nopLuc!==null||tt.trangThai==='het_han'||ket){tuTiep.current=false;xoaKtcnDangLam(sbd);return}
  if(!chang.length)return
  tuTiep.current=false
  const nho=docKtcnDangLam(sbd,id,Date.now()+offset)
  // Chỉ vào lại chặng MÁY CHỦ ĐANG CHẠY (có hạn, chưa chốt): không tự bấm Làm chặng thay em.
  if(nho&&chang.some(c=>c.stt===nho.stt&&c.han!==null&&!c.daChot))void mo(nho.stt)
 },[chang,busy,tt,ket,stt])
 // Gốc màn chỉ nghe mốc giờ; hết hạn vẫn chốt một lần, đợi đúng hàng lưu/revision hiện hành.
 useEffect(()=>{if(stt!==null&&han&&hetGio&&!busy&&!choThuLai.current)void chot(true)},[hetGio,han,offset,stt,busy,nhipThuLai])
 const ghiNhap=()=>{try{localStorage.setItem(key,JSON.stringify({han,tra:traRef.current,luc:lucRef.current,viTri}))}catch{/* bản nháp máy chủ vẫn là nguồn chính */}}
 const doi=(qid:string,a:string)=>{phanHoi('chon');const v={...traRef.current,[qid]:a};traRef.current=v;setTra(v);lucRef.current={...lucRef.current,[qid]:Date.now()+offset};chuaGui.current=true;setLuu('Đang lưu…');ghiNhap();if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{lanDongBo.current=0;dongBoRef.current()},400)}
 // Một lượt đồng bộ: lỗi tạm thời (máy chủ bận / mất mạng / hết giờ chờ) ⇒ hẹn lại lùi dần 1, 2, 4, 8, 15, 30 giây, giữ «Đang lưu…»; lỗi khác ⇒ hộp lỗi tiếng Việt.
 dongBoRef.current=()=>{
  huyDongBo()
  if(stt===null||!chuaGui.current||tuNop.current)return
  const lan=lanPhien.current
  void save().then(()=>{if(conPhien(lan))lanDongBo.current=0}).catch(e=>{
   if(!conPhien(lan))return
   setLuu('Đang lưu…')
   if(laLoiTamThoi(e)){setBan(laLoiMayChuBan(e));henDongBo.current=setTimeout(()=>dongBoRef.current(),choLuiDanMs(lanDongBo.current++))}
   else setLoi(chuCuaLoi(e,'Chưa lưu được bài.'))
  })
 }
 useEffect(()=>{if(nhipDongBo){lanDongBo.current=0;dongBoRef.current()}},[nhipDongBo])
 // Có mạng lại / quay lại tab / mở lại app ⇒ gửi ngay phần còn trên máy.
 useEffect(()=>{const f=()=>{if(document.visibilityState!=='hidden'&&chuaGui.current){lanDongBo.current=0;dongBoRef.current()}};window.addEventListener('online',f);document.addEventListener('visibilitychange',f);return()=>{window.removeEventListener('online',f);document.removeEventListener('visibilitychange',f)}},[])
 // Câu đang làm cũng nhớ trên máy: mở lại chặng về đúng câu ấy.
 useEffect(()=>{if(stt!==null&&han)try{const raw=localStorage.getItem(key);if(raw){const o=JSON.parse(raw);if(o&&o.han===han&&o.viTri!==viTri)localStorage.setItem(key,JSON.stringify({...o,viTri}))}}catch{/* không cản làm bài */}},[viTri,stt,han])
 const ve=async()=>{xoaKtcnDangLam(sbd);if(stt!==null){setBusy(true);try{await save();onVe();onCapNhat()}catch(e){if(laLoiTamThoi(e)){onVe();onCapNhat()}else setLoi(chuCuaLoi(e,'Chưa lưu được bài.'))}finally{setBusy(false)}}else{onVe();onCapNhat()}}
 const nop=async()=>{if(tt&&tt.daTra<tt.tong&&!await hoiXacNhan({tieuDe:'Nộp bài kiểm tra?',noiDung:`Còn ${tt.con} câu chưa trả lời. Nộp bài sẽ chốt kết quả hiện tại.`,nhanDongY:'Nộp bài',nhanKhong:'Làm tiếp',vo:'m3'}))return;setBusy(true);setLoi('');try{const r=await goiHoa2('hoc-tap-ktcn-nop',token,{id});nhan(r);setKet(r.ketQua as Ket);onCapNhat()}catch(e){setLoi(chuCuaLoi(e,'Chưa nộp được bài.'))}finally{setBusy(false)}}
 const [loc,setLoc]=useState<Loc>('tat-ca')
 // Tấm hỏi nộp đang mở mà chặng đã đóng / hết giờ (lượt tự chốt đi trước) ⇒ trả «không» và đóng tấm.
 useEffect(()=>{if(hoiNop&&(stt===null||hetGio)){hoiNop(false);setHoiNop(null)}},[stt,hetGio,hoiNop])
 const traLoiNop=(ok:boolean)=>{const r=hoiNop;setHoiNop(null);r?.(ok)}
 const qDuo=duo&&stt!==null?cs[viTri]:undefined
 const soODuo=soOCuaCau(qDuo)
 // Máy tính: gõ phím số cho câu trả lời ngắn (màn duo không có ô nhập — bàn phím số trên màn).
 const phimDuo=useRef<(e:KeyboardEvent)=>void>(()=>{})
 phimDuo.current=(e)=>{
  if(!qDuo||qDuo.phan!=='III'||busy||hetGio||moLuoi||hoiNop||e.ctrlKey||e.metaKey||e.altKey)return
  const t=e.target instanceof HTMLElement?e.target:null
  if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.closest('[role=dialog]')))return
  const p=phimTuBanPhim(e.key);if(!p)return
  e.preventDefault();doi(qDuo.qid,nhanPhim(traRef.current[qDuo.qid]??'',p,soODuo))
 }
 useEffect(()=>{if(!duo)return;const f=(e:KeyboardEvent)=>phimDuo.current(e);window.addEventListener('keydown',f);return()=>window.removeEventListener('keydown',f)},[duo])
 const q=cs[viTri]
 const nowMay=Date.now()+offset,changNay=stt!==null?chang.find(c=>c.stt===stt):undefined,giayChang=changNay?.giay||0
 const dangChay=chang.find(c=>!c.daChot&&c.han!==null&&c.han>nowMay)
 const soChot=chang.filter(c=>c.daChot).length,xongHet=chang.length>0&&soChot===chang.length
 const dau=chang.find(c=>!c.daChot)
 const daTraChang=cs.filter(c=>daTraDu(c,tra[c.qid])).length
 const dsCau=(nho:boolean)=><div className={nho?'ktcn-nav ktcn-nav-dt':'ktcn-nav'} role="group" aria-label="Các câu trong chặng">{cs.map((c,i)=><button type="button" key={c.qid} aria-current={viTri===i||undefined} data-co={daTraDu(c,tra[c.qid])?'':undefined} aria-label={`Câu ${i+1}${daTraDu(c,tra[c.qid])?' · đã trả lời':''}`} onClick={()=>setViTri(i)}>{i+1}</button>)}</div>
 const tieuDe=stt!==null?<><b>Chặng {stt+1}/{chang.length||stt+1}</b><small>Câu {viTri+1}/{cs.length}</small></>:<><b>Kiểm tra ôn tập</b>{tt&&<small>{thuNgay(tt.ngay)}</small>}</>
 const kq=ket?{dung:ket.cau.filter(c=>c.dung).length,trong:ket.cau.filter(c=>!c.tra).length,on:ket.cau.filter(c=>c.tra&&!c.dung).length}:null
 const cauLoc=ket?ket.cau.map((c,i)=>({c,i})).filter(({c})=>loc==='tat-ca'||(loc==='dung'?c.dung:loc==='trong'?!c.tra:!!c.tra&&!c.dung)):[]
 const baoLoi=loi&&<div className="ktcn-bao" role="alert"><span>{loi}</span><button type="button" className="ktcn-nut-phu" onClick={()=>void(stt!==null?(hetGio?chot(true):mo(stt)):tai())} disabled={busy}><RefreshCw size={16} aria-hidden="true"/>Tải lại</button></div>
 if(qDuo&&stt!==null){
  // ═══ LÀM CHẶNG KIỂU DUOLINGO: một câu một màn. Đề chữ to (DeCau) · phương án ô 3D (LamCau, chỉ «đang chọn», KHÔNG đúng/sai — đáp án chỉ về sau khi
  // nộp toàn bài) · đáy dính «Câu tiếp» / «Nộp chặng N» · lưới câu dạng tấm trượt · tấm xác nhận nộp có Bi. Khung thấp xoay ngang: đề trái | trả lời phải.
  const q=qDuo,v=tra[q.qid]??'',khoa=busy||hetGio,cuoi=viTri===cs.length-1
  const pa=q.phan==='I'?(q.choices as string[]):[]
  const luoiPa=q.phan==='I'&&!q.choiceImgs?.some(Boolean)&&!q.hinhAnh.some(h=>h.viTri.startsWith('sau_pa_'))&&pa.every(c=>(c??'').length<=22)
  const paDai=Math.max(0,...pa.map(c=>(c??'').length)),doDaiPa=!luoiPa?undefined:paDai>15?'dai':paDai>8?'vua':undefined
  const deDai=q.text.length>160||!!q.thanCauImg||!!q.table||q.hinhAnh.some(h=>h.viTri==='sau_de')
  const toi=(i:number)=>{phanHoi('chon');setMoLuoi(false);setViTri(Math.max(0,Math.min(cs.length-1,i)))}
  const chuaLam=cs.flatMap((c,i)=>daTraDu(c,tra[c.qid])?[]:[i+1])
  const nhanLuu=luu==='Đã lưu trên máy chủ'?<><CloudCheck size={16} aria-hidden="true"/>Đã lưu</>:luu
  return <div className="ht-app ht2-lam duo duo-kt" ref={khung} data-duo="" data-hai-cot={deDai||undefined}>
   <ThanhTrenKt onDong={()=>void ve()} nhanDong={`Lưu và về ${tenTrangChinh()}`} khoaDong={busy} daLam={daTraChang} tong={cs.length}
    gio={<GioChangDuo kho={khoChang} nhan={`Thời gian chặng ${stt+1} còn lại`}/>} nhanGio="" onMoLuoi={()=>{phanHoi('chon');setMoLuoi(true)}}/>
   <main className="duo-than" data-de-dai={deDai||undefined}>
    {baoLoi}
    {mayBan&&!loi&&<p className="ktcn-ban" role="status">{CHU_MAY_CHU_BAN_EM}</p>}
    <div key={`d${q.qid}`} className="duo-cot-de">
     <NhanCauKt so={viTri+1} tong={cs.length} phu={`Chặng ${stt+1}/${chang.length||stt+1}`}/>
     <DeCau q={q} stt={viTri+1}/>
    </div>
    <div key={`t${q.qid}`} className="duo-cot-tra">
     <div className="duo-tra" data-luoi={luoiPa||undefined} data-pa={doDaiPa}>
      {q.phan==='II'?<ChonDungSai q={q} value={v} khoa={khoa} onChon={(i,x)=>{const a=v.padEnd(4,'-').split('');a[i]=x;doi(q.qid,a.join(''))}}/>
      :q.phan==='I'?<ChonTracNghiem q={q} value={v} khoa={khoa} onChon={(x)=>doi(q.qid,x)}/>
      :<OTraLoiNgan value={v} soO={soODuo}/>}
     </div>
     {q.phan==='III'&&<BanPhimSo value={v} khoa={khoa} soO={soODuo} onPhim={(p:PhimSo)=>doi(q.qid,nhanPhim(v,p,soODuo))}/>}
     <HinhCuoiCau q={q} stt={viTri+1}/>
    </div>
   </main>
   <DayKt coTruoc={viTri>0} onTruoc={()=>toi(viTri-1)} ghi={nhanLuu||undefined}>
    {cuoi?<button type="button" className="duo-nut" onClick={()=>{phanHoi('chon');void chot()}} disabled={busy}>Nộp chặng {stt+1}</button>
    :<button type="button" className="duo-nut" onClick={()=>toi(viTri+1)}>Câu tiếp</button>}
   </DayKt>
   {moLuoi&&<TamLuoiKt cau={cs.map((c,i)=>({so:i+1,daLam:daTraDu(c,tra[c.qid])}))} hien={viTri+1} onChon={(so)=>toi(so-1)} onDong={()=>setMoLuoi(false)}
    tieuDe={`Chặng ${stt+1} · đã làm ${daTraChang}/${cs.length}`} phu="Hết giờ, chặng tự chốt với các câu đã lưu."
    nutNop={<button type="button" className="duo-nut" onClick={()=>{phanHoi('chon');setMoLuoi(false);void chot()}} disabled={busy}>Nộp chặng {stt+1}</button>}/>}
   {hoiNop&&<TamNopKt tieuDe={`Nộp chặng ${stt+1}?`} daLam={daTraChang} tong={cs.length} chuaLam={chuaLam}
    onToiCau={(so)=>{traLoiNop(false);toi(so-1)}} onLamTiep={()=>{phanHoi('chon');traLoiNop(false)}} nhanLamTiep="Làm tiếp"
    onNop={()=>{phanHoi('chon');traLoiNop(true)}} nhanNop={`Nộp chặng ${stt+1}`} khoaNop={busy}
    hauQua="Nộp chặng sẽ chốt các câu đã lưu, không sửa lại được."/>}
  </div>
 }
 return <div className="ht-app ktcn-man" ref={khung} data-dang-lam={stt!==null||undefined}>
  <header className="ktcn-thanh">
   <button type="button" className="ktcn-ve" onClick={()=>void ve()} disabled={busy&&stt!==null}><ArrowLeft size={20} aria-hidden="true"/>{stt!==null?'Lưu và về':tenTrangChinh()}</button>
   <p className="ktcn-thanh-giua">{tieuDe}</p>
   {stt!==null?<DongHoChang kho={khoChang} giay={giayChang}/>:<span className="ktcn-thanh-trong" aria-hidden="true"/>}
  </header>
  {baoLoi}

  {!tt&&busy&&<main className="ktcn-khung"><p className="an-chu" role="status">Đang tải lịch kiểm tra của em…</p><div className="ktcn-xuong" aria-hidden="true"><span/><span/><span/></div></main>}

  {tt&&stt===null&&!ket&&(tt.homNay&&tt.nopLuc===null?<main className="ktcn-khung">
   <section className="ktcn-the" data-chinh="" data-trang="tong-quan" aria-label="Bài kiểm tra ôn tập của em">
    <div className="ktcn-dau"><span className="ktcn-hinh"><BieuTuongKiemTra hinh="lam"/></span><div className="ktcn-chu"><p className="ktcn-nhan">Bài dành riêng cho em</p><h2>Kiểm tra ôn tập</h2>{tt.lyDo&&<p className="ktcn-ly-do">{tt.lyDo}</p>}</div></div>
    <div className="ktcn-than">
     <VongDem phan={tt.tong?tt.daTra/tt.tong:0} nhan={`Đã trả lời ${tt.daTra} trên ${tt.tong} câu`}><b>{tt.daTra}/{tt.tong}</b><small>đã trả lời</small></VongDem>
     <ul className="ktcn-dong-so"><li><Route size={20} aria-hidden="true"/><span><b>{busy&&!chang.length?'…':soChot}/{chang.length||tt.soChang} chặng</b> đã chốt</span></li><li><Check size={20} aria-hidden="true"/><span>Từ <b>{tt.soBai} bài</b> em đã học</span></li></ul>
    </div>
    <div className="ktcn-hai-gio">
     <div><CalendarDays size={22} aria-hidden="true"/><b>Hạn nộp {gioHan(tt.hanLuc,tt.ngay)}</b><small>Cả bài · còn <GioConLai kho={khoBai} bai/></small></div>
     <div><Timer size={22} aria-hidden="true"/><b>Giờ riêng từng chặng</b><small>Chỉ chạy khi em bấm Làm chặng</small></div>
    </div>
   </section>
   {/* Thẻ tổng quan vẽ ngay từ số Sảnh; chặng chưa về ⇒ khung chờ ngay dưới thẻ (27/10 tốc độ). */}
   {busy&&!chang.length&&<div className="ktcn-xuong" aria-hidden="true"><span/><span/><span/></div>}
   <ol className="ktcn-chang" aria-label="Các chặng">{chang.map(c=>{
    const chay=dangChay?.stt===c.stt,khoa=!c.daChot&&!!dangChay&&!chay,chinh=chay||(!dangChay&&dau?.stt===c.stt)
    return <li key={c.stt} data-xong={c.daChot||undefined} data-dang={chay||undefined}>
     <span className="ktcn-ch-dau" aria-hidden="true">{c.daChot?<Check size={20}/>:c.stt+1}</span>
     <div className="ktcn-ch-o">
      <div className="ktcn-ch-h"><b>Chặng {c.stt+1}</b>{c.daChot?<span className="ktcn-chip" data-sac="xanh">Đã chốt</span>:chay?<span className="ktcn-chip">Còn <GioConLai kho={khoChang}/></span>:khoa?<span className="ktcn-chip" data-sac="xam"><Lock size={13} aria-hidden="true"/>Chờ chặng {dangChay!.stt+1}</span>:null}</div>
      <small>{c.daChot&&typeof c.daTra==='number'?chuChot(c.soCau,c.daTra):`${c.soCau} câu · ${Math.ceil(c.giay/60)} phút${typeof c.daTra==='number'?` · đã trả lời ${c.daTra}/${c.soCau}`:''}`}</small>
      {!c.daChot&&<button type="button" className={chinh?'ktcn-nut-chinh':'ktcn-nut-phu'} onClick={()=>void mo(c.stt)} disabled={busy||khoa}>{chay?`Làm tiếp chặng ${c.stt+1}`:`Làm chặng ${c.stt+1}`}<ArrowRight size={18} aria-hidden="true"/></button>}
      {khoa&&<p className="ktcn-ch-ghi">Nộp chặng {dangChay!.stt+1} rồi mới mở chặng này.</p>}
     </div>
    </li>})}</ol>
   <div className="ktcn-nop" data-xong={xongHet||undefined}>
    <p>{xongHet?`Em đã xong cả ${chang.length} chặng. Nộp toàn bài để xem kết quả.`:`Xong cả ${chang.length||tt.soChang} chặng thì nộp toàn bài. Nộp sớm vẫn được — câu bỏ trống tính là chưa trả lời.`}</p>
    <button type="button" className={xongHet?'ktcn-nut-chinh':'ktcn-nut-phu'} onClick={()=>void nop()} disabled={busy||!!dangChay}>Nộp toàn bài</button>
    {dangChay&&<p className="ktcn-ch-ghi">Nộp chặng {dangChay.stt+1} trước khi nộp toàn bài.</p>}
   </div>
  </main>:<main className="ktcn-khung"><TheKiemTraCaNhan du={tt}/></main>)}

  {q&&stt!==null&&<div className="ktcn-lam">
   <aside className="ktcn-ben" aria-label={`Chặng ${stt+1}`}>
    <DongHoChang kho={khoChang} giay={giayChang} vong/>
    <h3>Câu trong chặng {stt+1} · đã trả lời {daTraChang}/{cs.length}</h3>
    {dsCau(false)}
    <p className="ktcn-ch-ghi">Hết giờ, chặng tự chốt với các câu đã lưu.</p>
   </aside>
   <main className="ktcn-noi">
    {dsCau(true)}
    {mayBan&&!loi&&<p className="ktcn-ban" role="status">{CHU_MAY_CHU_BAN_EM}</p>}
    <div className="ktcn-luu-dong"><p className="ktcn-luu" role="status">{luu==='Đã lưu trên máy chủ'?<><CloudCheck size={18} aria-hidden="true"/>Đã lưu</>:luu}</p><span>Đã trả lời {daTraChang}/{cs.length}</span></div>
    <TheCau {...propsCauHoc(q,viTri+1,tra[q.qid]??'',v=>doi(q.qid,v),undefined,busy||hetGio)}/>
    <div className="ktcn-day">
     <button className="ktcn-nut-phu" type="button" onClick={()=>setViTri(Math.max(0,viTri-1))} disabled={viTri===0||busy}>Câu trước</button>
     {viTri<cs.length-1?<button className="ktcn-nut-chinh" type="button" onClick={()=>setViTri(viTri+1)}>Câu tiếp theo<ArrowRight size={20} aria-hidden="true"/></button>:<button className="ktcn-nut-chinh" type="button" onClick={()=>void chot()} disabled={busy}>Nộp chặng {stt+1}</button>}
    </div>
   </main>
  </div>}

  {ket&&kq&&<main className="ktcn-khung ktcn-ket">
   <div className="ktcn-ket-trai">
    {duo&&<BiKetQua cam={camTheoDiem(tt?.diem)} tieuDe={tt?.diem!=null&&tt.diem>=8?'Làm tốt lắm!':tt?.diem!=null&&tt.diem<5?'Cùng Lửa ôn lại nhé!':'Em đã nộp bài!'} phu="Bấm từng câu bên dưới để xem đáp án và lời giải."/>}
    <section className="ktcn-ket-dau" aria-label="Kết quả lần kiểm tra này">
     <p className="ktcn-nhan" data-sac="xanh">Đã nộp{tt?.nopLuc?` · ${gioVn(tt.nopLuc)}`:''}</p>
     <div className="ktcn-ket-hang">
      <VongDem phan={(tt?.diem??0)/10} lop="ktcn-vong-xanh" nhan={tt?.diem!=null?`Điểm ${diemChu(tt.diem)} trên 10`:'Đang chấm'}><b>{tt?.diem!=null?diemChu(tt.diem):'—'}</b><small>điểm /10</small></VongDem>
      <div><p className="ktcn-ket-so"><b>{kq.dung}/{ket.cau.length}</b> câu đúng</p><p className="ktcn-ly-do">Các phần cần luyện thêm sẽ vào lịch học tiếp theo của em.</p></div>
     </div>
    </section>
    <h2 className="ktcn-ket-tieu">Kiến thức trong lần kiểm tra này</h2>
    <div className="ktcn-bai">{ket.bai.map(b=><div className="ktcn-bai-o" key={b.ten}><b>{b.ten}</b>
     <div className="ktcn-hai-thanh"><div><span>Đã kiểm tra</span><span className="ktcn-vach" data-sac="tim"><span style={{width:`${b.tong?Math.round(100*b.daKiem/b.tong):0}%`}}/></span><em>{b.daKiem}/{b.tong} mục</em></div>
     <div><span>Đúng lần này</span><span className="ktcn-vach" data-sac="xanh"><span style={{width:`${b.tong?Math.round(100*b.dungLanNay/b.tong):0}%`}}/></span><em>{b.dungLanNay}/{b.tong} mục</em></div></div></div>)}</div>
    {ket.chu&&<p className="ktcn-loi">{ket.chu}</p>}
   </div>
   <div className="ktcn-ket-phai">
    <div className="ktcn-loc" role="group" aria-label="Lọc câu">
     {([['tat-ca',`Tất cả · ${ket.cau.length}`],['on',`Cần ôn lại · ${kq.on}`],['trong',`Chưa trả lời · ${kq.trong}`],['dung',`Đúng · ${kq.dung}`]] as [Loc,string][]).filter(([k])=>k==='tat-ca'||(k==='on'?kq.on:k==='trong'?kq.trong:kq.dung)>0).map(([k,chu])=><button type="button" key={k} aria-pressed={loc===k} onClick={()=>setLoc(k)}>{chu}</button>)}
    </div>
    <div className="ktcn-ds-cau">{cauLoc.map(({c,i})=><details className="ktcn-cau-kq" key={c.de.qid}><summary><span className="ktcn-chip" data-sac={c.dung?'xanh':c.tra?'vang':'xam'}>Câu {i+1}</span><span>{c.tra?c.dung?'Đúng':'Cần ôn lại':'Chưa trả lời'}</span></summary><TheCau {...propsCauHoc(c.de,i+1,c.tra,()=>{},{correct:c.dung,answer:c.dapAn,solution:c.loiGiai},true)} hoiThay={{qid:c.de.qid,nguon:'kiem_tra_ca_nhan'}}/></details>)}</div>
    <p className="ktcn-ch-ghi">Bấm từng câu để xem đáp án và lời giải.</p>
    <button type="button" className="ktcn-nut-chinh" onClick={()=>void ve()}>Về {tenTrangChinh()}</button>
   </div>
  </main>}
 </div>
}
