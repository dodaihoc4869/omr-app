import BaiNopBtvn from './BaiNopBtvn'
import {useState} from 'react'
import type {DongTheoDoiBtvn} from '../lib/btvn-may-chu-moi'
export default function HocSinhNhanBai({bai,busy,onAction,maTheoSbd}:{maTheoSbd?:Record<string,string>;bai:DongTheoDoiBtvn;busy:boolean;onAction:(sbd:string,action:'reset'|'thu-hoi')=>void}){
 const [xem,setXem]=useState<string|null>(null)
 const [query,setQuery]=useState('')
 const norm=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase()
 const all=bai.hocSinh||bai.chuaNop.map(e=>({...e,nopLuc:null,soDung:null,soCau:null,thuHoi:false}))
 const found=[...all].sort((a,b)=>Number(Boolean(b.nopLuc))-Number(Boolean(a.nopLuc))||((Date.parse(b.nopLuc||'')||0)-(Date.parse(a.nopLuc||'')||0))||a.sbd.localeCompare(b.sbd,'vi',{numeric:true})).filter(e=>norm(`${e.sbd} ${e.hoTen}`).includes(norm(query.trim())))
 return <div style={{marginTop:16}}>
  {xem&&<BaiNopBtvn maBtvn={maTheoSbd?.[xem]||bai.maBtvn} sbd={xem} onClose={()=>setXem(null)}/>}
  <input aria-label={`Tìm học sinh ${bai.maBtvn}`} placeholder="Tìm tên hoặc số báo danh…" value={query} onChange={e=>setQuery(e.target.value)} style={{width:'100%',padding:'12px 14px',border:'1px solid var(--vien-dam)',borderRadius:12,background:'var(--the)',color:'var(--muc)'}}/>
  <p style={{color:'var(--nhat)',fontSize:13,margin:'8px 0'}}>Hiển thị {found.length}/{all.length} học sinh</p>
  <div role="region" aria-label="Học sinh nhận bài" tabIndex={0} style={{maxHeight:430,overflowY:'auto',overscrollBehavior:'contain',display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(min(100%,260px),1fr))',gap:10,padding:3}}>
   {found.map(e=><article key={e.sbd} style={{padding:16,border:'1px solid var(--vien)',borderRadius:16,background:'var(--the)',minWidth:0}}>
    {e.nopLuc?<button onClick={()=>setXem(e.sbd)} aria-label={`Xem bài đã nộp của ${e.hoTen||e.sbd}`} style={{display:'block',overflowWrap:'anywhere',background:'none',border:0,padding:0,textAlign:'left',font:'inherit',fontWeight:700,color:'var(--xanh)',textDecoration:'underline',cursor:'pointer'}}>{e.hoTen||e.sbd}</button>:<strong>{e.hoTen||e.sbd}</strong>}
    <p style={{fontSize:13,color:'var(--nhat)',margin:'4px 0 10px'}}>SBD {e.sbd}</p>
    <span style={{display:'inline-block',padding:'4px 9px',borderRadius:8,fontSize:13,fontWeight:600,background:e.thuHoi?'var(--the-2)':e.nopLuc?'var(--xanh-nen)':'var(--vang-diu-nen)',color:e.thuHoi?'var(--nhat)':e.nopLuc?'var(--xanh)':'var(--vang-diu)'}}>{e.thuHoi?'Đã thu hồi':e.nopLuc?'Đã nộp':'Chưa nộp'}</span>
    {e.nopLuc&&<p style={{fontSize:12,color:'var(--nhat)',marginTop:8}}>{e.soDung}/{e.soCau} câu đúng · {new Date(e.nopLuc).toLocaleString('vi-VN')}</p>}
    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:12}}>
     <button disabled={busy} onClick={()=>onAction(e.sbd,'reset')} className="btn-google-outlined" style={{padding:'8px 12px',fontSize:13}}>Cho làm lại</button>
     <button disabled={busy||e.thuHoi} onClick={()=>onAction(e.sbd,'thu-hoi')} className="btn-google-outlined" style={{padding:'8px 12px',fontSize:13,color:'var(--do)'}}>Thu hồi</button>
    </div>
   </article>)}
   {!found.length&&<p style={{color:'var(--nhat)',padding:16}}>Không tìm thấy học sinh.</p>}
  </div>
 </div>
}
