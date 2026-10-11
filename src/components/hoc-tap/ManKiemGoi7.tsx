import { useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { goiHoa2 } from '../hoa2/api'
import { propsCauHoc, duTraLoi } from './ManLamBaiTap'
import TheCau from '../TheCau'
import type { Question } from '../../game/than-thu-v2/core'
import './hoc-tap.css'

export default function ManKiemGoi7({token,sbd,goiId,maDe,onVe,onCapNhat}:{token:string;sbd:string;goiId:string;maDe:string;onVe:()=>void;onCapNhat:()=>void}) {
  const [cau,setCau]=useState<Question[]>([]),[id,setId]=useState(''),[tra,setTra]=useState<Record<string,string>>({}),[viTri,setViTri]=useState(0),[tai,setTai]=useState(true),[nop,setNop]=useState(false),[loi,setLoi]=useState(''),[ket,setKet]=useState<Record<string,unknown>|null>(null),[cauMoi,setCauMoi]=useState(0),[xacNhan,setXacNhan]=useState(false)
  const gui=useRef(false),q=cau[viTri],khoa=`hoc-tap:kiem:${sbd}:${id}`
  useEffect(()=>{
    let huy=false
    void goiHoa2('hoc-tap-kiem-start',token,{goiId,maDe},40).then(r=>{
      if(huy)return
      if(r.ok!==true||typeof r.id!=='string'||!Array.isArray(r.questions)||!r.questions.length)throw new Error(typeof r.error==='string'?r.error:'Chưa mở được bài tự kiểm.')
      setId(r.id);setCau(r.questions as Question[]);setCauMoi(Number(r.cauMoi)||0)
      try{const saved=JSON.parse(localStorage.getItem(`hoc-tap:kiem:${sbd}:${r.id}`)||'{}');if(saved&&typeof saved==='object')setTra(saved)}catch{/* Nháp không làm hỏng bài. */}
    }).catch(e=>{if(!huy)setLoi(e instanceof Error?e.message:'Chưa tải được bài tự kiểm.')}).finally(()=>{if(!huy)setTai(false)})
    return()=>{huy=true}
  },[token,sbd,goiId,maDe])
  const doi=(v:string)=>{const next={...tra,[q!.qid]:v};setTra(next);try{localStorage.setItem(khoa,JSON.stringify(next))}catch{/* Tiếp tục nộp qua máy chủ. */}}
  const nopBai=async()=>{
    if(gui.current||!id)return
    gui.current=true;setNop(true);setLoi('')
    try{
      const r=await goiHoa2('hoc-tap-kiem-nop',token,{goiId,id,tra},40)
      if(r.ok!==true||r.daNop!==true||typeof r.diem!=='number')throw new Error(typeof r.error==='string'?r.error:'Chưa xác nhận được bài nộp. Em thử lại; nháp vẫn được giữ.')
      setKet(r);setXacNhan(false);onCapNhat();try{localStorage.removeItem(khoa)}catch{/* Đã nhận kết quả. */}
    }catch(e){setLoi(e instanceof Error?e.message:'Chưa nộp được bài.')}finally{setNop(false);gui.current=false}
  }
  const daTra=cau.filter(q=>duTraLoi(q.phan,tra[q.qid]||'')).length
  const feedback=ket&&Array.isArray(ket.ketQua)?ket.ketQua.find((r:{qid:string})=>r.qid===q?.qid):undefined
  return <div className="ht-app ht-lam m3"><header className="ht-thanh"><button className="ht-nut-phu" onClick={onVe} disabled={nop}><ArrowLeft size={18} aria-hidden="true"/>Hôm nay</button><strong>Tự kiểm kiến thức</strong><span>{daTra}/{cau.length} câu đã trả lời</span></header><main className="ht-phien">
    {tai?<p role="status">Đang chuẩn bị bài tự kiểm…</p>:q?<>
      {ket?<section className="ht-the"><h1>{Number(ket.diem).toFixed(2)}/10 điểm</h1><p>{Number(ket.diem)>=7?'Đã đạt mốc 7 điểm của lần tự kiểm này.':'Em tiếp tục sửa chỗ chưa vững rồi kiểm lại vào ngày khác.'}</p><p>{cauMoi}/{cau.length} câu là biến thể đã duyệt; các câu còn lại đo khả năng nhớ câu cũ. Điểm này chưa xác nhận em đã thành thạo mọi kỹ năng.</p>{ket.daGhiSo===false&&<p role="status">Điểm đã lưu; sổ học đang chờ đồng bộ.</p>}</section>:<p className="ht-thong-bao">Tự làm, không mở chữa trong lúc kiểm. Đáp án chỉ mở sau khi nộp cả tờ. Nháp được giữ trên máy này.</p>}
      <div className="ht-vung-lam"><section className="ht-de"><TheCau {...propsCauHoc(q,viTri+1,tra[q.qid]||'',doi,feedback,nop)}/></section><aside className="ht-dieu-khien"><section className="ht-the"><h2>Câu {viTri+1}/{cau.length}</h2><button className="ht-nut-phu" disabled={viTri===0||nop} onClick={()=>setViTri(i=>i-1)}>Câu trước</button><button className="ht-nut-phu" disabled={viTri+1===cau.length||nop} onClick={()=>setViTri(i=>i+1)}>Câu tiếp theo<ArrowRight size={18} aria-hidden="true"/></button>{!ket&&<button className="ht-nut-chinh" disabled={daTra<cau.length||nop} onClick={()=>setXacNhan(true)}>Nộp cả tờ</button>}{xacNhan&&<div role="group" aria-label="Xác nhận nộp bài"><p>Nộp {daTra} câu để chấm điểm? Sau khi nộp, em không sửa đáp án của lượt này.</p><button className="ht-nut-phu" onClick={()=>setXacNhan(false)} disabled={nop}>Tiếp tục làm</button><button className="ht-nut-chinh" onClick={()=>void nopBai()} disabled={nop}>{nop?'Đang nộp…':'Xác nhận nộp bài'}</button></div>}</section></aside></div>
    </>:null}{loi&&<p className="ht-thong-bao" role="alert">{loi}</p>}
  </main></div>
}
