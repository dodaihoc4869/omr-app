import {useEffect,useId,useState} from 'react'
import './progress-chart.css'
import {batNhipBenVung} from '../../lib/nhip-ben-vung'
type Day={day:string;total:number;correct:number}
export default function ProgressChart({request}:{request:(action:string)=>Promise<{history?:Day[]}>}){
 const [days,setDays]=useState<Day[]>([]),[selected,setSelected]=useState<string>(''),[error,setError]=useState(''),[loaded,setLoaded]=useState(false)
 const id=useId().replace(/:/g,'')
 useEffect(()=>{let active=true;const load=async()=>{try{const r=await request('progress-history');if(active){setDays(r.history??[]);setLoaded(true);setError('')}return true}catch{if(active)setError('Chưa tải được lịch sử. Đang thử kết nối lại.');return false}};const nhip=batNhipBenVung(load);const kich=()=>nhip.kich();window.addEventListener('focus',kich);return()=>{active=false;nhip.dung();window.removeEventListener('focus',kich)}},[request]) // nhịp bền vững 180 s ± 30 s, lùi dần khi lỗi (sự cố D1 21/09)
 const points=days.map((d,i)=>({...d,x:48+(days.length===1?.5:i/(days.length-1))*604,y:202-176*d.correct/Math.max(1,d.total)}))
 const current=points.find(p=>p.day===selected)??points[points.length-1]
 const path=points.map((p,i)=>`${i?'L':'M'}${p.x},${p.y}`).join(' ')
 const date=(s:string)=>s.split('-').reverse().slice(0,2).join('/')
 return <div className="learning-trend"><header><div><h3>Tiến bộ của em</h3><p>Tỷ lệ câu tự làm đúng theo ngày · 30 ngày gần nhất</p></div>{current&&<strong className="trend-value">{Math.round(current.correct/current.total*100)}<small>%</small></strong>}</header>
 {error&&<p role="status">{error}</p>}
 {!days.length?<p>{loaded?'Chưa có lượt làm bài trong 30 ngày gần nhất. Biểu đồ sẽ xuất hiện sau khi em trả lời câu hỏi.':'Đang tải lịch sử học…'}</p>:<><svg viewBox="0 0 700 238" role="img" aria-label="Biểu đồ tỷ lệ câu tự làm đúng theo ngày"><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor="#60a5fa" stopOpacity=".28"/><stop offset="1" stopColor="#60a5fa" stopOpacity="0"/></linearGradient></defs>{[0,25,50,75,100].map(v=><g key={v}><line x1="48" x2="652" y1={202-v*1.76} y2={202-v*1.76} className="trend-grid"/><text x="38" y={207-v*1.76} textAnchor="end">{v}%</text></g>)}{points.length>1&&<path d={`${path} L652,202 L48,202 Z`} fill={`url(#${id})`}/>}<path d={path} className="trend-line" pathLength="1"/>{points.map(p=><circle key={p.day} cx={p.x} cy={p.y} r={p.day===current?.day?6:4} className="trend-dot" tabIndex={0} role="button" aria-label={`${date(p.day)}: ${p.correct}/${p.total} câu tự làm đúng`} onClick={()=>setSelected(p.day)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setSelected(p.day)}}}><title>{date(p.day)}: {p.correct}/{p.total} câu tự làm đúng</title></circle>)}<text x="48" y="229">{date(points[0].day)}</text>{points.length>1&&<text x="652" y="229" textAnchor="end">{date(points[points.length-1].day)}</text>}</svg></>}

 </div>
}
