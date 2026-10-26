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
import './hoc-tap.css'
import './kiem-tra-ca-nhan.css'
import { phanHoi } from '../../lib/phan-hoi'
// «Trong» 26/10 (nhóm 2): tờ trình bày styles/trong-lam-bai.css nạp RIÊNG, chỉ khi <html data-trong> (main.tsx gắn trước khi nạp màn) — không cộng byte lượt mở app.
if (typeof document !== 'undefined' && document.documentElement.dataset.trong) void import('../../styles/trong-lam-bai.css').catch(() => {})
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
function GioConLai({kho,bai=false}:{kho:KhoGio|null;bai?:boolean}){
 const giay=useGiayConLai(kho)??0
 return <>{bai?conLai(giay*1000):dongHo(Math.max(0,Math.ceil(giay)))}</>
}
/** Dòng phụ của chặng ĐÃ CHỐT (thầy 26/10: «Đã chốt · đã trả lời 0/6» dễ hiểu nhầm): nói rõ bỏ trống bao nhiêu câu — cùng số daTra, chỉ đổi lời. */
const chuChot=(so:number,da:number)=>da>=so?`${so} câu · trả lời đủ ${so}/${so}`:da<=0?`${so} câu · bỏ trống cả ${so} câu`:`${so} câu · trả lời ${da}/${so} · bỏ trống ${so-da}`
const khongDangKy=()=>()=>{}
function useHetGio(kho:KhoGio|null){
 const lay=()=>!!kho&&kho.conLai()<=0
 return useSyncExternalStore(kho?.dangKy??khongDangKy,lay,lay)
}
export default function ManKiemTraCaNhan({token,sbd,id,onVe,onCapNhat}:{token:string;sbd:string;id:string;onVe:()=>void;onCapNhat:()=>void}) {
 const [tt,setTt]=useState<TomTatKiemTra>(),[chang,setChang]=useState<Chang[]>([]),[cs,setCs]=useState<Question[]>([]),[stt,setStt]=useState<number|null>(null),[viTri,setViTri]=useState(0),[tra,setTra]=useState<Record<string,string>>({}),[han,setHan]=useState(0),[offset,setOffset]=useState(0),[busy,setBusy]=useState(false),[loi,setLoi]=useState(''),[luu,setLuu]=useState(''),[ket,setKet]=useState<Ket>()
 const hanChay=stt!==null?han:!ket&&tt?.homNay&&tt.nopLuc===null?chang.find(c=>!c.daChot&&c.han!==null)?.han:undefined
 const khoChang=useMemo(()=>hanChay?taoKhoGio(hanChay,()=>Date.now()+offset):null,[hanChay,offset])
 const khoBai=useMemo(()=>tt?taoKhoGio(tt.hanLuc,()=>Date.now()+offset):null,[tt?.hanLuc,offset])
 const hetGio=useHetGio(khoChang)
 const traRef=useRef(tra),revision=useRef(0),day=useRef<Promise<unknown>>(Promise.resolve()),tuNop=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),mounted=useRef(true)
 const lanPhien=useRef(0),henThuLai=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),choThuLai=useRef(false),lanThuLai=useRef(0)
 const [nhipThuLai,setNhipThuLai]=useState(0)
 const conPhien=(lan:number)=>mounted.current&&lanPhien.current===lan
 const huyHenThuLai=()=>{if(henThuLai.current)clearTimeout(henThuLai.current);henThuLai.current=undefined;choThuLai.current=false}
 const key=`ktcn:nhap:${sbd}:${id}:${stt}`
 const [nhapCuu,setNhapCuu]=useState<Record<string,string>>()
 const khung=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(stt!==null)khung.current?.scrollIntoView?.({block:'start'})},[stt])
 const nhan=(r:Record<string,unknown>)=>{const t=docKiemTra(r.kiemTra);if(!t)throw new Error('Số liệu bài kiểm tra chưa đầy đủ. Em tải lại nhé.');setTt(t);setOffset(t.serverNow-Date.now());if(typeof r.revision==='number')revision.current=r.revision;return t}
 const tai=async()=>{const lan=lanPhien.current;setBusy(true);setLoi('');try{const r=await goiHoa2('hoc-tap-ktcn-trang-thai',token,{id});if(!conPhien(lan))return;const t=nhan(r);setChang(r.chang as Chang[]);if(t.nopLuc!==null||t.trangThai==='het_han'){const k=await goiHoa2('hoc-tap-ktcn-ket-qua',token,{id});if(!conPhien(lan))return;nhan(k);setKet(k.ketQua as Ket)}}catch(e){if(conPhien(lan))setLoi(e instanceof Error?e.message:'Chưa tải được bài kiểm tra.')}finally{if(conPhien(lan))setBusy(false)}}
 useEffect(()=>{
  mounted.current=true;lanPhien.current++;huyHenThuLai();lanThuLai.current=0;tuNop.current=false;revision.current=0;day.current=Promise.resolve();traRef.current={}
  setTt(undefined);setChang([]);setCs([]);setStt(null);setHan(0);setOffset(0);setTra({});setKet(undefined);setNhapCuu(undefined);setLuu('')
  void tai()
  return()=>{mounted.current=false;lanPhien.current++;huyHenThuLai();if(timer.current)clearTimeout(timer.current)}
 },[token,id])
 const save=(submit=false)=>{
  if(stt===null)return Promise.resolve()
  if(timer.current)clearTimeout(timer.current)
  const patch={...traRef.current},part=stt,lan=lanPhien.current
  const p=day.current.catch(()=>{}).then(async()=>{
   if(!conPhien(lan))return
   const r=await goiHoa2(submit?'hoc-tap-ktcn-chot-chang':'hoc-tap-ktcn-luu',token,{id,chang:part,tra:patch,revision:revision.current})
   if(conPhien(lan)){nhan(r);setLuu(r.daLuu?'Đã lưu trên máy chủ':'Chặng đã chốt; chỉ dùng bản nháp đã lưu đúng giờ');if(r.daLuu&&JSON.stringify(patch)===JSON.stringify(traRef.current)){try{localStorage.removeItem(`ktcn:nhap:${sbd}:${id}:${part}`)}catch{/* Không làm hỏng lưu máy chủ */}}}
   return r
  });day.current=p
  return p
 }
 const mo=async(i:number)=>{const lan=lanPhien.current;huyHenThuLai();setBusy(true);setLoi('');setNhapCuu(undefined);try{const r=await goiHoa2('hoc-tap-ktcn-start',token,{id,chang:i});if(!conPhien(lan))return;const t=nhan(r);if(r.daChot){setCs([]);setStt(null);await tai();return}const questions=r.questions as Question[];setCs(questions);setStt(i);setViTri(0);setHan(Number(r.hanChang));const a=r.tra as Record<string,string>;traRef.current=a;setTra(a);setLuu('Đã tải câu trả lời đã lưu');tuNop.current=false;lanThuLai.current=0
  try{const raw=localStorage.getItem(`ktcn:nhap:${sbd}:${id}:${i}`),saved=raw?JSON.parse(raw):null;if(saved&&saved.han===Number(r.hanChang)&&t.serverNow<Number(r.hanChang)&&saved.tra&&typeof saved.tra==='object'){const ids=new Set(questions.map(q=>q.qid));const v=Object.fromEntries(Object.entries(saved.tra).filter(([qid,v])=>ids.has(qid)&&typeof v==='string'&&v.length<=100)) as Record<string,string>;if(Object.entries(v).some(([qid,v])=>a[qid]!==v))setNhapCuu(v)}}catch{/* Bản nháp máy hỏng: vẫn dùng bản chính đã lưu */}
 }catch(e){if(conPhien(lan))setLoi(e instanceof Error?e.message:'Chưa mở được chặng.')}finally{if(conPhien(lan))setBusy(false)}}
 const chot=async(auto=false)=>{if(stt===null||tuNop.current)return
  const lan=lanPhien.current
  // Nộp tay khi còn câu trống ⇒ hỏi lại bằng hộp app (đợt 20). Hết giờ tự chốt thì không hỏi; hộp đang mở mà hết giờ ⇒ lượt tự chốt đi trước.
  if(!auto){const trong=cs.flatMap((c,i)=>daTraDu(c,traRef.current[c.qid])?[]:[i+1]);if(trong.length&&!await hoiXacNhan({tieuDe:`Nộp chặng ${stt+1}?`,noiDung:`Chặng này còn ${trong.length} câu chưa trả lời (câu ${trong.join(', ')}). Nộp chặng sẽ chốt các câu đã lưu, không sửa lại được.`,nhanDongY:`Nộp chặng ${stt+1}`,nhanKhong:'Làm tiếp',vo:'m3'}))return;if(tuNop.current)return}
  if(!conPhien(lan))return
  huyHenThuLai();tuNop.current=true;setBusy(true);setLoi('')
  try{await save(true);if(!conPhien(lan))return;setCs([]);setStt(null);await tai();if(conPhien(lan))onCapNhat()}
  catch(e){
   if(!conPhien(lan))return
   tuNop.current=false;setLoi(e instanceof Error?e.message:'Chưa chốt được chặng.');if(auto)setLuu('Hết giờ; đang giữ bản nháp trên máy để đối chiếu.')
   if(auto||(khoChang&&khoChang.conLaiNgay()<=0)){
    // Lỗi mạng nhanh không gọi dồn: đợi 2/4/8/16 giây, tối đa 30 giây; bấm thử lại vẫn đi ngay.
    choThuLai.current=true;const doi=Math.min(30_000,2000*2**lanThuLai.current);lanThuLai.current=Math.min(4,lanThuLai.current+1)
    henThuLai.current=setTimeout(()=>{henThuLai.current=undefined;if(!conPhien(lan))return;choThuLai.current=false;setNhipThuLai(v=>v+1)},doi)
   }
  }finally{if(conPhien(lan))setBusy(false)}
 }
 // Gốc màn chỉ nghe mốc giờ; hết hạn vẫn chốt một lần, đợi đúng hàng lưu/revision hiện hành.
 useEffect(()=>{if(stt!==null&&han&&hetGio&&!busy&&!choThuLai.current)void chot(true)},[hetGio,han,offset,stt,busy,nhipThuLai])
 const doi=(qid:string,a:string)=>{phanHoi('chon');const v={...traRef.current,[qid]:a};traRef.current=v;setTra(v);setLuu('Đang lưu…');setNhapCuu(undefined);try{localStorage.setItem(key,JSON.stringify({han,tra:v}))}catch{/* bản nháp máy chủ vẫn là nguồn chính */}if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{void save().catch(e=>{setLoi(e instanceof Error?e.message:'Chưa lưu được bài.');setLuu('Chưa đồng bộ; bản nháp đang ở trên máy')})},400)}
 const phucHoi=()=>{if(!nhapCuu||!khoChang||khoChang.conLaiNgay()<=0)return;traRef.current={...traRef.current,...nhapCuu};setTra(traRef.current);setNhapCuu(undefined);void save().catch(e=>setLoi(e instanceof Error?e.message:'Chưa đồng bộ được bản nháp.'))}
 const ve=async()=>{if(stt!==null){setBusy(true);try{await save();onVe();onCapNhat()}catch(e){setLoi(e instanceof Error?e.message:'Chưa lưu được bài.')}finally{setBusy(false)}}else{onVe();onCapNhat()}}
 const nop=async()=>{if(tt&&tt.daTra<tt.tong&&!await hoiXacNhan({tieuDe:'Nộp bài kiểm tra?',noiDung:`Còn ${tt.con} câu chưa trả lời. Nộp bài sẽ chốt kết quả hiện tại.`,nhanDongY:'Nộp bài',nhanKhong:'Làm tiếp',vo:'m3'}))return;setBusy(true);setLoi('');try{const r=await goiHoa2('hoc-tap-ktcn-nop',token,{id});nhan(r);setKet(r.ketQua as Ket);onCapNhat()}catch(e){setLoi(e instanceof Error?e.message:'Chưa nộp được bài.')}finally{setBusy(false)}}
 const [loc,setLoc]=useState<Loc>('tat-ca')
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
 return <div className="ht-app ktcn-man" ref={khung} data-dang-lam={stt!==null||undefined}>
  <header className="ktcn-thanh">
   <button type="button" className="ktcn-ve" onClick={()=>void ve()} disabled={busy&&stt!==null}><ArrowLeft size={20} aria-hidden="true"/>{stt!==null?'Lưu và về':'Hôm nay'}</button>
   <p className="ktcn-thanh-giua">{tieuDe}</p>
   {stt!==null?<DongHoChang kho={khoChang} giay={giayChang}/>:<span className="ktcn-thanh-trong" aria-hidden="true"/>}
  </header>
  {loi&&<div className="ktcn-bao" role="alert"><span>{loi}</span><button type="button" className="ktcn-nut-phu" onClick={()=>void(stt!==null?(hetGio?chot(true):mo(stt)):tai())} disabled={busy}><RefreshCw size={16} aria-hidden="true"/>Tải lại</button></div>}

  {!tt&&busy&&<main className="ktcn-khung"><p className="an-chu" role="status">Đang tải lịch kiểm tra của em…</p><div className="ktcn-xuong" aria-hidden="true"><span/><span/><span/></div></main>}

  {tt&&stt===null&&!ket&&(tt.homNay&&tt.nopLuc===null?<main className="ktcn-khung">
   <section className="ktcn-the" data-chinh="" data-trang="tong-quan" aria-label="Bài kiểm tra ôn tập của em">
    <div className="ktcn-dau"><span className="ktcn-hinh"><BieuTuongKiemTra hinh="lam"/></span><div className="ktcn-chu"><p className="ktcn-nhan">Bài dành riêng cho em</p><h2>Kiểm tra ôn tập</h2>{tt.lyDo&&<p className="ktcn-ly-do">{tt.lyDo}</p>}</div></div>
    <div className="ktcn-than">
     <VongDem phan={tt.tong?tt.daTra/tt.tong:0} nhan={`Đã trả lời ${tt.daTra} trên ${tt.tong} câu`}><b>{tt.daTra}/{tt.tong}</b><small>đã trả lời</small></VongDem>
     <ul className="ktcn-dong-so"><li><Route size={20} aria-hidden="true"/><span><b>{soChot}/{chang.length||tt.soChang} chặng</b> đã chốt</span></li><li><Check size={20} aria-hidden="true"/><span>Từ <b>{tt.soBai} bài</b> em đã học</span></li></ul>
    </div>
    <div className="ktcn-hai-gio">
     <div><CalendarDays size={22} aria-hidden="true"/><b>Hạn nộp {gioHan(tt.hanLuc,tt.ngay)}</b><small>Cả bài · còn <GioConLai kho={khoBai} bai/></small></div>
     <div><Timer size={22} aria-hidden="true"/><b>Giờ riêng từng chặng</b><small>Chỉ chạy khi em bấm Làm chặng</small></div>
    </div>
   </section>
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
    {nhapCuu&&<div className="ktcn-bao" role="status"><span>Có bản nháp trên máy chưa đồng bộ. Đồng hồ vẫn theo giờ đã mở.</span><button type="button" className="ktcn-nut-phu" onClick={phucHoi} disabled={busy||hetGio}>Khôi phục bản nháp trên máy</button></div>}
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
    <button type="button" className="ktcn-nut-chinh" onClick={()=>void ve()}>Về Hôm nay</button>
   </div>
  </main>}
 </div>
}
