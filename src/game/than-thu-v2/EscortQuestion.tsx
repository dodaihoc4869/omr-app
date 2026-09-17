import {unlockBattleAudio,playBattleSound} from './battle-audio'
import {useEffect,useRef,useState} from 'react'
import TheCau from '../../components/TheCau'
import type {TheCauProps} from '../../components/TheCau'
import {LoiGiaiCauSai} from '../../components/KhoiCauSai'
import {HinhTaiViTri,ManHinhAnh} from '../../components/QuestionMedia'
import type {HinhAnh} from '../../data/examContent'
import type {Question} from './core'
type Feedback={correct:boolean;answer:string;solution:unknown;solutionImages:HinhAnh[];reward:number;attempt?:{assisted:boolean}}
type Reply={id?:string;questions?:Question[];answered?:Feedback[];message?:string;remaining?:number}&Partial<Feedback>
export default function EscortQuestion({room,round,call,onAnswered}:{room:string;round:number;onAnswered?:(energy:number)=>void;call:(action:string,data:Record<string,unknown>)=>Promise<unknown>}){
 const [q,setQ]=useState<Question>(),[session,setSession]=useState(''),[answer,setAnswer]=useState(''),[assisted,setAssisted]=useState(false),[feedback,setFeedback]=useState<Feedback>(),[busy,setBusy]=useState(true),[error,setError]=useState(''),[failedImage,setFailedImage]=useState(false),[zoom,setZoom]=useState(''),[retry,setRetry]=useState(0)
 const live=useRef(true),lock=useRef(false)
 useEffect(()=>{live.current=true;return()=>{live.current=false}},[])
 useEffect(()=>{let active=true;setBusy(true);setError('');const load=async()=>{try{const r=await call('start',{mode:'arena',guardian:room,guardianRound:round}) as Reply;if(!active)return;setSession(r.id??'');setQ(r.questions?.[0]);setFeedback(r.answered?.[0]);if(!r.questions?.length)setError(r.message||'Chưa có câu phù hợp. Em thử tải lại.')}catch(e){if(active)setError(e instanceof Error?e.message:'Chưa tải được câu Hoá.')}finally{if(active)setBusy(false)}};void load();return()=>{active=false}},[room,round,call,retry])
 const submit=async()=>{if(lock.current||!q||feedback)return;unlockBattleAudio();lock.current=true;setBusy(true);setError('');try{const r=await call('answer',{session,qid:q.qid,answer,assisted}) as Feedback;if(live.current){setFeedback(r);playBattleSound(1,0,r.correct,false)}}catch(e){if(live.current)setError(e instanceof Error?e.message:'Chưa chấm được câu. Em thử lại.')}finally{lock.current=false;if(live.current)setBusy(false)}}
 useEffect(()=>{if(feedback)onAnswered?.(feedback.correct&&!feedback.attempt?.assisted&&!assisted?2:0)},[feedback,assisted,onAnswered])
 const select=(value:string)=>{if(!busy&&!feedback)setAnswer(value)}
 const base=q?{stt:1,onZoom:setZoom,text:q.text,table:q.table,thanCauImg:q.thanCauImg,imageDataUrl:q.imageDataUrl,hinhAnh:q.hinhAnh as HinhAnh[],tieuDe:q.tenDang||`Câu Hoá · lượt ${round}`,cheDo:'thi' as const}:null
 const props:TheCauProps|null=!q||!base?null:q.phan==='I'?{...base,phan:'I',choices:q.choices as [string,string,string,string],choiceImgs:q.choiceImgs as [string?,string?,string?,string?],choicePerm:[0,1,2,3],selected:(answer||null) as 'A'|'B'|'C'|'D'|null,onSelect:select}:q.phan==='II'?{...base,phan:'II',ideas:q.ideas as [string,string,string,string],ideaImgs:q.ideaImgs as [string?,string?,string?,string?],selected:Array.from({length:4},(_,i)=>(answer[i]==='D'||answer[i]==='S'?answer[i]:null) as 'D'|'S'|null),onSelect:(i,v)=>{const values=(answer||'----').split('');values[i]=v;select(values.join(''))}}:{...base,phan:'III',selected:answer,onChange:select}
 return <section className="escort-question" aria-label={`Câu Hoá của lượt ${round}`}>
 <h3>Câu Hoá · lượt {round}</h3>
 {zoom&&<ManHinhAnh src={zoom} alt="Ảnh câu Hoá" onClose={()=>setZoom('')}/>}
 {busy&&!q&&<p role="status">Đang tải câu Hoá của em…</p>}
 {error&&<p role="alert">{error} {!q&&<button disabled={busy} onClick={()=>setRetry(v=>v+1)}>Tải lại câu</button>}</p>}
 {props&&<div onErrorCapture={e=>{if((e.target as HTMLElement).tagName==='IMG')setFailedImage(true)}}><TheCau {...props}/></div>}
 {failedImage&&<p role="alert">Hình chưa tải được. Em kiểm tra kết nối trước khi trả lời.</p>}
 {q&&!feedback&&<><label className="spirit-help"><input type="checkbox" checked={assisted} disabled={busy} onChange={e=>setAssisted(e.target.checked)}/> Em có dùng tài liệu hoặc được trợ giúp</label><button className="spirit-primary" disabled={busy||failedImage||!answer.trim()||q.phan==='II'&&answer.includes('-')} onClick={()=>void submit()}>{busy?'Đang chấm…':'Trả lời câu Hoá'}</button></>}
 {feedback&&<div className="spirit-feedback" role="status"><strong>{feedback.correct?'Em đã trả lời đúng':'Em xem lời giải để sửa câu này'}</strong><p>{feedback.correct&&!feedback.attempt?.assisted&&!assisted?'Chính xác! +2 năng lượng. Em chọn ô để di chuyển hoặc dùng chiêu.':'Lượt này em đứng yên, chỉ được dựng khiên yếu (+5 giáp).'}</p><details open><summary>Lời giải</summary><LoiGiaiCauSai hoaHoc c={{text:q?.text,phan:q?.phan,dapAnDung:feedback.answer,loiGiai:feedback.solution}}/><HinhTaiViTri hinhAnh={feedback.solutionImages??[]} viTri="sau_loi_giai" nhan="lời giải" onZoom={setZoom}/></details></div>}
 </section>
}
