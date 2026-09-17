import {useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {layCauHinhMayChu} from '../lib/may-chu-moi'
import {loadTeacherSecret} from '../lib/exam-db'
import {parseKhoDeJson,buildTeacherSourceFromKhoDe} from '../lib/exam-kho-de-import'
import type {TeacherExamSource} from '../data/examContent'
import TheCau from './TheCau'
export default function BaiNopBtvn({maBtvn,sbd,onClose}:{maBtvn:string;sbd:string;onClose:()=>void}){
 const ref=useRef<HTMLDialogElement>(null)
 const [data,setData]=useState<{hoTen:string;nopLuc:string;soDung:number;soCau:number;answers:Record<string,string>;source:TeacherExamSource}|null>(null)
 const [error,setError]=useState('')
 useEffect(()=>{ref.current?.showModal();let alive=true;const abort=new AbortController();const timer=setTimeout(()=>abort.abort(),30000)
 void(async()=>{try{
 const [ch,mat]=await Promise.all([layCauHinhMayChu(),loadTeacherSecret()])
 const r=await fetch(`${ch.URL}/btvn/bai-lam`,{method:'POST',headers:{'content-type':'application/json','x-ma-bi-mat':mat||''},body:JSON.stringify({maBtvn,sbd}),signal:abort.signal})
 const j=await r.json();if(!j.ok)throw new Error(j.error||'Chưa tải được bài.')
 const parsed=parseKhoDeJson(j.de);if(!parsed.ok||!parsed.json)throw new Error('Nội dung đề chưa đầy đủ: '+parsed.errors.join('; '))
 const built=buildTeacherSourceFromKhoDe(parsed.json);if(built.errors.length)throw new Error(built.errors.join('; '))
 if(alive)setData({...j,source:built.source})
 }catch(e){if(alive)setError(e instanceof Error?e.message:'Chưa tải được bài.')}finally{clearTimeout(timer)}})()
 return()=>{alive=false;clearTimeout(timer);abort.abort()}
 },[maBtvn,sbd])
 return createPortal(<dialog ref={ref} onCancel={onClose} style={{width:'min(960px,96vw)',maxHeight:'92dvh',padding:0,border:'1px solid var(--vien)',borderRadius:20,background:'var(--nen)',color:'var(--muc)'}}>
 <header style={{position:'sticky',top:0,zIndex:2,background:'var(--the)',padding:18,display:'flex',gap:16,justifyContent:'space-between',borderBottom:'1px solid var(--vien)'}}><div><b>{data?.hoTen||'Bài đã nộp'} · SBD {sbd}</b>{data&&<p>{data.soDung}/{data.soCau} câu đúng · {new Date(data.nopLuc).toLocaleString('vi-VN')}</p>}</div><button autoFocus className="btn-google-outlined" onClick={onClose}>Đóng</button></header>
 <div style={{padding:18,display:'grid',gap:16}}>{error?<p role="alert">{error}</p>:!data?<p role="status">Đang tải bài đã nộp…</p>:<>
 <p>Đáp án học sinh đã chọn, đáp án đúng và lời giải của từng câu.</p>
 {(['I','II','III'] as const).map(phan=><section key={phan} style={{display:'grid',gap:14}}><h3>Phần {phan}</h3>{data.source[`phan${phan}`].map((q,i)=>{
 const v=data.answers[q.id]||'',common={...q,cheDo:'xem_lai' as const,stt:i+1}
 if('choices'in q)return <TheCau key={q.id} {...common} phan="I" choices={q.choices} correct={q.correct} choicePerm={[0,1,2,3]} selected={(['A','B','C','D'].includes(v)?v:null) as 'A'|'B'|'C'|'D'|null}/>
 if('ideas'in q)return <TheCau key={q.id} {...common} phan="II" ideas={q.ideas} correct={q.correct} selected={Array.from({length:4},(_,i)=>v[i]==='D'?'D':v[i]==='S'?'S':null)}/>
 return <TheCau key={q.id} {...common} phan="III" correct={q.correct} selected={v}/>
 })}</section>)}</>}</div></dialog>,document.body)
}
