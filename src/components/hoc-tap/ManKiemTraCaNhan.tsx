import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, Check, Clock3, RefreshCw } from 'lucide-react'
import { goiHoa2 } from '../hoa2/api'
import { docKiemTra, type TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import type { Question } from '../../game/than-thu-v2/core'
import TheCau from '../TheCau'
import { propsCauHoc } from './ManLamBaiTap'
import TheKiemTraCaNhan from './TheKiemTraCaNhan'
import { hoiXacNhan } from '../hop-thoai'
import './hoc-tap.css'
import './kiem-tra-ca-nhan.css'
type Chang={stt:number;soCau:number;giay:number;han:number|null;daChot:boolean}
type Ket={bai:{ten:string;tong:number;daKiem:number;dungLanNay:number}[];cau:{de:Question;tra:string;dung:boolean;dapAn:string;loiGiai:unknown}[];chu:string}
export default function ManKiemTraCaNhan({token,sbd,id,onVe,onCapNhat}:{token:string;sbd:string;id:string;onVe:()=>void;onCapNhat:()=>void}) {
 const [tt,setTt]=useState<TomTatKiemTra>(),[chang,setChang]=useState<Chang[]>([]),[cs,setCs]=useState<Question[]>([]),[stt,setStt]=useState<number|null>(null),[viTri,setViTri]=useState(0),[tra,setTra]=useState<Record<string,string>>({}),[han,setHan]=useState(0),[offset,setOffset]=useState(0),[now,setNow]=useState(Date.now()),[busy,setBusy]=useState(false),[loi,setLoi]=useState(''),[luu,setLuu]=useState(''),[ket,setKet]=useState<Ket>()
 const traRef=useRef(tra),revision=useRef(0),day=useRef<Promise<unknown>>(Promise.resolve()),tuNop=useRef(false),timer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined),mounted=useRef(true)
 const key=`ktcn:nhap:${sbd}:${id}:${stt}`
 const [nhapCuu,setNhapCuu]=useState<Record<string,string>>()
 const khung=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(stt!==null)khung.current?.scrollIntoView?.({block:'start'})},[stt])
 const nhan=(r:Record<string,unknown>)=>{const t=docKiemTra(r.kiemTra);if(!t)throw new Error('Số liệu bài kiểm tra chưa đầy đủ. Em tải lại nhé.');setTt(t);setOffset(t.serverNow-Date.now());if(typeof r.revision==='number')revision.current=r.revision;return t}
 const tai=async()=>{setBusy(true);setLoi('');try{const r=await goiHoa2('hoc-tap-ktcn-trang-thai',token,{id});const t=nhan(r);setChang(r.chang as Chang[]);if(t.nopLuc!==null){const k=await goiHoa2('hoc-tap-ktcn-ket-qua',token,{id});nhan(k);setKet(k.ketQua as Ket)}}catch(e){setLoi(e instanceof Error?e.message:'Chưa tải được bài kiểm tra.')}finally{setBusy(false)}}
 useEffect(()=>{mounted.current=true;void tai();return()=>{mounted.current=false;if(timer.current)clearTimeout(timer.current)}},[token,id])
 // Đồng hồ cục bộ 1 giây: chỉ vẽ giờ; hết hạn chốt một lần qua tuNop, không hỏi máy chủ định kỳ.
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),1000);return()=>clearInterval(t)},[])
 const save=(submit=false)=>{
  if(stt===null)return Promise.resolve()
  if(timer.current)clearTimeout(timer.current)
  const patch={...traRef.current},part=stt
  const p=day.current.catch(()=>{}).then(async()=>{
   const r=await goiHoa2(submit?'hoc-tap-ktcn-chot-chang':'hoc-tap-ktcn-luu',token,{id,chang:part,tra:patch,revision:revision.current})
   if(mounted.current){nhan(r);setLuu(r.daLuu?'Đã lưu trên máy chủ':'Chặng đã chốt; chỉ dùng bản nháp đã lưu đúng giờ');if(r.daLuu&&JSON.stringify(patch)===JSON.stringify(traRef.current)){try{localStorage.removeItem(`ktcn:nhap:${sbd}:${id}:${part}`)}catch{/* Không làm hỏng lưu máy chủ */}}}
   return r
  });day.current=p
  return p
 }
 const mo=async(i:number)=>{setBusy(true);setLoi('');setNhapCuu(undefined);try{const r=await goiHoa2('hoc-tap-ktcn-start',token,{id,chang:i});const t=nhan(r);if(r.daChot){setCs([]);setStt(null);await tai();return}const questions=r.questions as Question[];setCs(questions);setStt(i);setViTri(0);setHan(Number(r.hanChang));const a=r.tra as Record<string,string>;traRef.current=a;setTra(a);setLuu('Đã tải câu trả lời đã lưu');tuNop.current=false
  try{const raw=localStorage.getItem(`ktcn:nhap:${sbd}:${id}:${i}`),saved=raw?JSON.parse(raw):null;if(saved&&saved.han===Number(r.hanChang)&&t.serverNow<Number(r.hanChang)&&saved.tra&&typeof saved.tra==='object'){const ids=new Set(questions.map(q=>q.qid));const v=Object.fromEntries(Object.entries(saved.tra).filter(([qid,v])=>ids.has(qid)&&typeof v==='string'&&v.length<=100)) as Record<string,string>;if(Object.entries(v).some(([qid,v])=>a[qid]!==v))setNhapCuu(v)}}catch{/* Bản nháp máy hỏng: vẫn dùng bản chính đã lưu */}
 }catch(e){setLoi(e instanceof Error?e.message:'Chưa mở được chặng.')}finally{setBusy(false)}}
 const chot=async(auto=false)=>{if(stt===null||tuNop.current)return;tuNop.current=true;setBusy(true);setLoi('');try{await save(true);setCs([]);setStt(null);await tai();onCapNhat()}catch(e){tuNop.current=false;setLoi(e instanceof Error?e.message:'Chưa chốt được chặng.');if(auto)setLuu('Hết giờ; đang giữ bản nháp trên máy để đối chiếu.')}finally{setBusy(false)}}
 useEffect(()=>{if(stt!==null&&han&&now+offset>=han&&!busy)void chot(true)},[now,han,offset,stt,busy])
 const doi=(qid:string,a:string)=>{const v={...traRef.current,[qid]:a};traRef.current=v;setTra(v);setLuu('Đang lưu…');setNhapCuu(undefined);try{localStorage.setItem(key,JSON.stringify({han,tra:v}))}catch{/* bản nháp máy chủ vẫn là nguồn chính */}if(timer.current)clearTimeout(timer.current);timer.current=setTimeout(()=>{void save().catch(e=>{setLoi(e instanceof Error?e.message:'Chưa lưu được bài.');setLuu('Chưa đồng bộ; bản nháp đang ở trên máy')})},400)}
 const phucHoi=()=>{if(!nhapCuu||sec===0)return;traRef.current={...traRef.current,...nhapCuu};setTra(traRef.current);setNhapCuu(undefined);void save().catch(e=>setLoi(e instanceof Error?e.message:'Chưa đồng bộ được bản nháp.'))}
 const ve=async()=>{if(stt!==null){setBusy(true);try{await save();onVe();onCapNhat()}catch(e){setLoi(e instanceof Error?e.message:'Chưa lưu được bài.')}finally{setBusy(false)}}else{onVe();onCapNhat()}}
 const nop=async()=>{if(tt&&tt.daTra<tt.tong&&!await hoiXacNhan({tieuDe:'Nộp bài kiểm tra?',noiDung:`Còn ${tt.con} câu chưa trả lời. Nộp bài sẽ chốt kết quả hiện tại.`,nhanDongY:'Nộp bài',nhanKhong:'Làm tiếp',vo:'m3'}))return;setBusy(true);setLoi('');try{const r=await goiHoa2('hoc-tap-ktcn-nop',token,{id});nhan(r);setKet(r.ketQua as Ket);onCapNhat()}catch(e){setLoi(e instanceof Error?e.message:'Chưa nộp được bài.')}finally{setBusy(false)}}
 const sec=Math.max(0,Math.ceil((han-now-offset)/1000)),q=cs[viTri]
 return <div className="ht-app ktcn-man" ref={khung}>
  <header className="ktcn-thanh"><button type="button" className="ht-nut-phu" onClick={()=>void ve()} disabled={busy}><ArrowLeft size={18} aria-hidden="true"/>Lưu và về</button><strong>{stt!==null?`Chặng ${stt+1} · Câu ${viTri+1}/${cs.length}`:'Kiểm tra ôn tập'}</strong>{stt!==null&&<time aria-label="Thời gian chặng còn lại">{Math.floor(sec/60)}:{String(sec%60).padStart(2,'0')}</time>}</header>
  <main className="ktcn-khung">
   {loi&&<div className="ht-thong-bao" role="alert">{loi}<button className="ht-nut-phu" onClick={()=>void(stt!==null?mo(stt):tai())} disabled={busy}><RefreshCw size={16}/>Tải lại</button></div>}
   {!tt&&busy&&<p role="status">Đang tải lịch kiểm tra của em…</p>}
   {tt&&stt===null&&<TheKiemTraCaNhan du={tt}/>}
   {q&&stt!==null&&<>
    {nhapCuu&&<div className="ht-thong-bao" role="status">Có bản nháp trên máy chưa đồng bộ. Đồng hồ vẫn theo giờ đã mở.<button type="button" className="ht-nut-phu" onClick={phucHoi} disabled={busy||sec===0}>Khôi phục bản nháp trên máy</button></div>}
    <nav className="ktcn-nav" aria-label="Các câu trong chặng">{cs.map((c,i)=><button className="ht-nut-phu" type="button" key={c.qid} aria-current={viTri===i} onClick={()=>setViTri(i)}>{i+1}{tra[c.qid]&&<Check size={14} aria-label="Có câu trả lời"/>}</button>)}</nav>
    <TheCau {...propsCauHoc(q,viTri+1,tra[q.qid]??'',v=>doi(q.qid,v),undefined,busy||sec===0)}/>
    <p className="ktcn-luu" role="status">{luu}</p>
    <div className="ktcn-cuoi"><button className="ht-nut-phu" type="button" onClick={()=>setViTri(Math.max(0,viTri-1))} disabled={viTri===0||busy}>Câu trước</button>{viTri<cs.length-1?<button className="ht-nut-chinh" type="button" onClick={()=>setViTri(viTri+1)}>Câu tiếp theo</button>:<button className="ht-nut-chinh" type="button" onClick={()=>void chot()} disabled={busy}>Nộp chặng</button>}</div>
   </>}
   {tt&&stt===null&&!ket&&tt.homNay&&tt.nopLuc===null&&<><div className="ktcn-chang">{chang.map(c=><button type="button" className="ht-nut-phu" key={c.stt} onClick={()=>void mo(c.stt)} disabled={busy||c.daChot}><strong>{c.daChot?'Đã chốt':'Làm'} chặng {c.stt+1}</strong><small><Clock3 size={14} aria-hidden="true"/> {c.soCau} câu · {Math.ceil(c.giay/60)} phút</small></button>)}</div><div className="ktcn-cuoi"><button type="button" className="ht-nut-chinh" onClick={()=>void nop()} disabled={busy}>Nộp toàn bài</button></div></>}
   {ket&&<><section className="ktcn-the"><h2>Kiến thức trong lần kiểm tra này</h2><table className="ktcn-bang"><thead><tr><th>Bài đã học</th><th>Đã kiểm tra</th><th>Đúng lần này</th></tr></thead><tbody>{ket.bai.map(b=><tr key={b.ten}><td>{b.ten}</td><td>{b.daKiem}/{b.tong} mục</td><td>{b.dungLanNay}/{b.tong} mục</td></tr>)}</tbody></table><p className="ktcn-chu-phu">{ket.chu}</p><p>Các phần cần luyện thêm sẽ vào lịch học tiếp theo của em.</p></section>{ket.cau.map((c,i)=><details className="ktcn-the" key={c.de.qid}><summary>Câu {i+1} · {c.tra?c.dung?'Đúng':'Cần ôn lại':'Chưa trả lời'}</summary><TheCau {...propsCauHoc(c.de,i+1,c.tra,()=>{},{correct:c.dung,answer:c.dapAn,solution:c.loiGiai},true)}/></details>)}</>}
  </main>
 </div>
}
