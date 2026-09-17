import { useEffect, useRef, useState } from 'react'
import TheCau from './TheCau'
import { createPortal } from 'react-dom'
import { ArrowUpRight, Clock3, FileText } from 'lucide-react'
import { layCauHinhMayChu, xongNapDiaChi } from '../lib/may-chu-moi'
import type { PublicExamBank, TeacherExamSource } from '../data/examContent'

type Paper = {id:string;deadline:number;serverNow:number;status:string;answers:Record<string,string>;bank:PublicExamBank;result?:{score:number};solutions?:TeacherExamSource[]}
type History = {id:string;createdAt:number;status:string;score:number|null}
export default function LuyenDeChuan({sbd,token}:{sbd:string;token?:string}) {
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const [paper,setPaper]=useState<Paper|null>(null),[answers,setAnswers]=useState<Record<string,string>>({})
  const [history,setHistory]=useState<History[]>([]),[seconds,setSeconds]=useState(0),[saved,setSaved]=useState('')
  const saveQueue=useRef(Promise.resolve())
  const answerRef=useRef(answers), paperRef=useRef(paper), offset=useRef(0), submitting=useRef(false), alive=useRef(true)
  answerRef.current=answers;paperRef.current=paper
  async function api(action:string,data:Record<string,unknown>={}) {
    if(!token)throw new Error('Em đăng xuất rồi đăng nhập lại để mở luyện đề.')
    await xongNapDiaChi()
    const url=String((await layCauHinhMayChu()).URL||'').replace(/\/+$/,'')
    const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),60000)
    try {
      const r=await fetch(`${url}/luyen-de/${action}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...data,token}),signal:controller.signal})
      const json=await r.json();if(!r.ok||!json.ok)throw new Error(json.error||'Không kết nối được máy chủ luyện đề.');return json
    }finally{clearTimeout(timeout)}
  }
  async function refresh(){try{const r=await api('history');if(alive.current)setHistory(r.items)}catch(e){if(alive.current)setError(e instanceof Error?e.message:'Không tải được lịch sử.')}}
  useEffect(()=>{alive.current=true;void refresh();return()=>{alive.current=false}},[sbd,token])
  function accept(p:Paper){
    offset.current=p.serverNow-Date.now();setPaper(p)
    let local:Record<string,string>={}
    try{local=JSON.parse(localStorage.getItem(`ddh.luyen2026.${sbd}.${p.id}`)||'{}')}catch{}
    setAnswers(p.status==='active'?{...p.answers,...local}:p.answers)
    setSeconds(Math.max(0,Math.ceil((p.deadline-p.serverNow)/1000)))
  }
  async function open(id?:string){setBusy(true);setError('');try{accept(await api(id?'open':'start',id?{id}:{daHocXong:ready}));await refresh()}catch(e){setError(e instanceof Error?e.message:'Không mở được đề.')}finally{setBusy(false)}}
  async function submit(auto=false){
    const p=paperRef.current;if(!p||p.status!=='active'||submitting.current)return
    if(!auto&&!confirm('Nộp bài luyện và xem kết quả?'))return
    submitting.current=true;setBusy(true);setError('')
    try{accept(await api('submit',{id:p.id,answers:answerRef.current}));setSaved('Đã nộp bài');await refresh()}catch(e){setError(e instanceof Error?e.message:'Chưa nộp được bài. Em thử lại.')}finally{submitting.current=false;setBusy(false)}
  }
  useEffect(()=>{
    if(!paper||paper.status!=='active')return
    const tick=()=>{const n=Math.max(0,Math.ceil((paper.deadline-Date.now()-offset.current)/1000));setSeconds(n);if(n===0&&!submitting.current)void submit(true)}
    const clock=setInterval(tick,1000)
    return()=>clearInterval(clock)
  },[paper?.id,paper?.status])
  useEffect(()=>{
    if(!paper||paper.status!=='active')return
    try{localStorage.setItem(`ddh.luyen2026.${sbd}.${paper.id}`,JSON.stringify(answers))}catch{}
    setSaved('Đang lưu…')
    const timer=setTimeout(()=>{saveQueue.current=saveQueue.current.then(async()=>{
      if(answerRef.current!==answers||paperRef.current?.status!=='active')return
      try {const r=await api('save',{id:paper.id,answers});if(r.status)accept(r);else setSaved('Đã lưu trên máy chủ')}
      catch {setSaved('Chưa lưu lên máy chủ. Đáp án đang giữ trên máy này.')}
    })},600)
    return()=>clearTimeout(timer)
  },[answers,paper?.id,paper?.status])
  const panel='p-4 sm:p-6 rounded-2xl border border-blue-200 bg-white dark:bg-slate-900 space-y-4'
  if(!paper)return <section className={panel}>
    <h2 className="font-bold text-lg text-blue-700">LUYỆN ĐỀ CHUẨN CẤU TRÚC</h2>
    <p className="font-semibold">Chỉ dành cho học sinh đã học xong toàn bộ chương trình Hóa THPT.</p>
    <p>Rút từ BỘ ĐỀ lớp 12 · 50 phút · 18 câu chọn đáp án, 4 câu đúng/sai, 6 câu trả lời ngắn.</p>
    <label className="flex gap-2 items-center"><input type="checkbox" checked={ready} onChange={e=>setReady(e.target.checked)}/>Em đã học xong toàn bộ chương trình.</label>
    <button className="px-5 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50" disabled={!ready||busy} onClick={()=>void open()}>{busy?'Đang chuẩn bị đề…':'Bắt đầu / Tiếp tục bài luyện'}</button>
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-3">
        <h3 className="font-bold text-slate-800 dark:text-slate-100">Bài luyện của em</h3>
        <span className="text-xs text-slate-500">{history.length} bài</span>
      </div>
      <div role="region" aria-label="Bài luyện của em" tabIndex={0} className="max-h-80 overflow-y-auto overscroll-contain divide-y divide-slate-100 dark:divide-slate-800">
        {history.length===0?<p className="p-4 text-sm text-slate-500">Chưa có bài luyện.</p>:history.map(h=><button key={h.id} disabled={busy} className="flex w-full items-center gap-3 p-4 text-left hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50" onClick={()=>void open(h.id)}>
          <span className="rounded-xl bg-blue-50 dark:bg-blue-950 p-2.5 text-blue-600"><FileText size={20}/></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">{h.status==='active'?'Tiếp tục bài luyện':'Xem lại bài luyện'}</span><span className="block mt-1 text-xs text-slate-500">{new Date(h.createdAt).toLocaleString('vi-VN',{hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric'})}</span></span>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${h.status==='active'?'bg-amber-50 text-amber-700':'bg-blue-50 text-blue-700'}`}>{h.status==='active'?'Đang làm':h.score==null?'Đã nộp':`${h.score.toFixed(2)} điểm`}</span>
          <ArrowUpRight size={16} className="shrink-0 text-slate-400"/>
        </button>)}
      </div>
    </div>
  </section>
  const done=paper.status==='submitted'
  const getSolution=(id:string)=>paper.solutions?.flatMap(s=>[...s.phanI,...s.phanII,...s.phanIII]).find(q=>q.id===id)
  const change=(id:string,v:string)=>{if(!done&&seconds>0)setAnswers(a=>({...a,[id]:v}))}
  return <section className={`${panel} ${done?'':'pb-32 sm:pb-32'}`}>
    {done?<div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
      <b>Kết quả: {paper.result?.score.toFixed(2)} / 10</b>
      <button className="text-sm font-semibold text-blue-600" onClick={()=>setPaper(null)}>← Danh sách bài luyện</button>
    </div>:<>
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300"><FileText size={18}/> Bài luyện chuẩn cấu trúc · 50 phút</div>
      {createPortal(<div data-practice-toolbar className="fixed inset-x-0 bottom-0 z-40 px-3 pt-2" style={{paddingBottom:'max(12px, env(safe-area-inset-bottom))',pointerEvents:'none'}}>
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-900" style={{pointerEvents:'auto'}}>
          <div className="min-w-0"><div className={`flex items-center gap-2 font-bold tabular-nums ${seconds<=300?'text-red-600':'text-slate-900 dark:text-white'}`}><Clock3 size={20}/><span aria-label="Thời gian còn lại">{Math.floor(seconds/60)}:{String(seconds%60).padStart(2,'0')}</span></div><p className="mt-1 text-xs text-slate-500" role="status">{saved}</p></div>
          <button disabled={busy} className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white disabled:opacity-50" onClick={()=>void submit()}>{busy?'Đang nộp…':'Nộp bài'}</button>
        </div>
      </div>,document.body)}
    </>}
    {error&&<p role="alert" className="text-red-600">{error}</p>}
    {(['I','II','III'] as const).map(phan=><div key={phan} className="space-y-4"><h3 className="font-bold">PHẦN {phan}</h3>{paper.bank[`phan${phan}`].map((q,i)=>{
      const sol=getSolution(q.id)
      const common={...q,cheDo:done?'xem_lai' as const:'thi' as const,stt:i+1,explanation:sol?.explanation,loiGiai:sol?.loiGiai}
      if('choices' in q)return <TheCau key={q.id} {...common} phan="I" choices={q.choices} choiceImgs={q.choiceImgs} choicePerm={[0,1,2,3]} selected={(answers[q.id]||null) as 'A'|'B'|'C'|'D'|null} correct={sol?.correct as 'A'|'B'|'C'|'D'|undefined} onSelect={v=>change(q.id,v)}/>
      if('ideas' in q)return <TheCau key={q.id} {...common} phan="II" ideas={q.ideas} ideaImgs={q.ideaImgs} selected={Array.from({length:4},(_,j)=>{const v=(answers[q.id]||'')[j];return v==='D'||v==='S'?v:null})} correct={sol?.correct as ['D'|'S','D'|'S','D'|'S','D'|'S']|undefined} onSelect={(j,v)=>{const a=(answers[q.id]||'----').split('');a[j]=v;change(q.id,a.join(''))}}/>
      return <TheCau key={q.id} {...common} phan="III" selected={answers[q.id]||''} correct={sol?.correct as string|undefined} onChange={v=>change(q.id,v)}/>
    })}</div>)}
  </section>
}
