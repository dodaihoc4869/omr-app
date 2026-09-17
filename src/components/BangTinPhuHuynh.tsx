import BangVinhDanh from './BangVinhDanh'
import {useCallback,useEffect,useState} from 'react'
import {parentNewsApi,studentNewsApi} from '../lib/mom-api'
import './BangTinPhuHuynh.css'
import {Calendar,RefreshCw,Sparkles,Send,AlertTriangle} from 'lucide-react'
type Report={day:string;updatedAt:string;today:{tenCa:string;diem:number|null;nopLuc:string}[];weak:{name:string;count:number}[];wrong:number;pending:number;pendingDetails?:{btvn:number;mom:number;daily:number};questionCount:number;assignmentCount:number;minutes:number;mode:string;reason:string}
export default function BangTinPhuHuynh({sbd,onSent,studentToken}:{sbd:string;onSent:(id?:string)=>void;studentToken?:string}){
 const [daily,setDaily]=useState<{id:string;submitted_at:string|null}|null>(null)
 const api=useCallback((action:'list'|'assign')=>studentToken?studentNewsApi(action,studentToken):parentNewsApi(action,sbd),[sbd,studentToken])
 const [report,setReport]=useState<Report|null>(null),[history,setHistory]=useState<Report[]>([]),[error,setError]=useState(''),[sending,setSending]=useState(false),[sent,setSent]=useState('')
 const refresh=useCallback(async()=>{try{const r=await api('list');setReport(r.report);setDaily(r.daily||null);setHistory(r.history);setError('')}catch(e){setError(e instanceof Error?e.message:'Chưa cập nhật được dữ liệu.')}},[api])
 useEffect(()=>{setReport(null);setSent('');void refresh();const poll=()=>{if(!document.hidden)void refresh()};const t=setInterval(poll,15000);window.addEventListener('focus',poll);window.addEventListener('online',poll);return()=>{clearInterval(t);window.removeEventListener('focus',poll);window.removeEventListener('online',poll)}},[refresh])
 async function assign(){setSending(true);setError('');try{const r=await api('assign');setSent(r.alreadySent?'Bài theo đề xuất hôm nay đã được gửi. Không tạo thêm bài trùng.':`Đã gửi 1 bài gồm ${r.questionCount} câu sang app của con.`);onSent(r.id);await refresh()}catch(e){setError(e instanceof Error?e.message:'Chưa gửi được bài.')}finally{setSending(false)}}

 const btvnChuaNop = report?.pendingDetails?.btvn ?? 0
 const momChuaNop = report?.pendingDetails?.mom ?? 0
 const deXuatChuaNop = report?.pendingDetails?.daily ?? 0
 const tongChuaNop = (btvnChuaNop + momChuaNop + deXuatChuaNop) > 0
   ? (btvnChuaNop + momChuaNop + deXuatChuaNop)
   : (report?.pending || 0)

 return <><BangVinhDanh/><section className="parent-news space-y-5">
  <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><Calendar className="news-accent" size={22}/>{studentToken?'Bảng tin học tập của em':'Bảng tin học tập của con'}</h2><p className="mt-1 text-xs news-muted">Bản tin mới lúc 00:01 mỗi ngày · Giờ Việt Nam</p></div><button type="button" aria-label="Cập nhật bảng tin" onClick={()=>void refresh()} className="news-refresh"><RefreshCw size={18}/></button></div>
  {error&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
  {!report?<p className="text-sm news-muted">Đang tổng hợp dữ liệu của con…</p>:<>
   <div className="flex flex-wrap justify-between gap-2 text-xs news-muted"><span>Ngày {report.day.split('-').reverse().join('/')}</span><span>Cập nhật {new Date(report.updatedAt).toLocaleTimeString('vi-VN')}</span></div>
   {tongChuaNop > 0 && (
    <div className="news-alert-red" role="alert">
      <div className="flex items-center gap-2">
        <AlertTriangle className="news-pending-triangle" size={20} />
        <span className="font-bold text-sm text-red-600 dark:text-red-400">
          Cảnh báo: {studentToken ? 'Em còn bài tập chưa hoàn thành' : 'Con còn bài tập chưa hoàn thành'} ({tongChuaNop} câu)
        </span>
      </div>
      <div className="news-alert-lines mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm font-semibold text-red-800 dark:text-red-200">
        {btvnChuaNop > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="news-alert-dot" />
            <span>Bài tập về nhà: <b>chưa nộp {btvnChuaNop} câu</b></span>
          </span>
        )}
        {momChuaNop > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="news-alert-dot" />
            <span>Bài tập mom giao: <b>chưa nộp {momChuaNop} câu</b></span>
          </span>
        )}
        {deXuatChuaNop > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="news-alert-dot" />
            <span>Bài tập đề xuất: <b>chưa nộp {deXuatChuaNop} câu</b></span>
          </span>
        )}
        {btvnChuaNop === 0 && momChuaNop === 0 && deXuatChuaNop === 0 && tongChuaNop > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span className="news-alert-dot" />
            <span>Chưa nộp: <b>{tongChuaNop} câu</b></span>
          </span>
        )}
      </div>
    </div>
   )}
   <div className="news-metrics">
    <Metric value={report.today.length} label="Bài thi hôm nay"/>
    <Metric value={report.wrong} label="Câu cần ôn"/>
    <Metric value={tongChuaNop} label="Câu đang chờ làm"/>
   </div>
   {report.today.length>0?<div className="space-y-2 max-h-48 overflow-y-auto">{report.today.map((e,i)=><div key={i} className="flex justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800"><span>{e.tenCa}</span><strong>{e.diem==null?'Chờ chấm':`${Number(e.diem).toFixed(2)}/10`}</strong></div>)}</div>:<p className="text-sm news-muted">Hôm nay chưa có bài thi đã nộp. Đề xuất dựa trên kết quả gần nhất đang có.</p>}
   {report.weak.length>0&&<div><h3 className="text-sm font-semibold mb-2">Kiến thức cần củng cố</h3><div className="flex flex-wrap gap-2">{report.weak.map(t=><span key={t.name} className="news-topic">{t.name} · {t.count} câu</span>)}</div></div>}
   <div className="news-recommendation space-y-2"><h3 className="font-bold flex gap-2 items-center"><Sparkles size={18} className="news-accent"/>Gợi ý hôm nay</h3><p className="text-lg font-bold">{daily?.submitted_at?'Đã hoàn thành bài luyện hôm nay':report.assignmentCount?`1 bài · tối đa ${report.questionCount} câu · khoảng ${report.minutes} phút`:'Chưa cần giao thêm bài'}</p>{report.assignmentCount>0&&<p className="text-sm">Chế độ: <strong>{report.mode}</strong></p>}<p className="text-sm leading-relaxed">{studentToken?report.reason.replace(/Con/g,'Em').replace(/con/g,'em'):report.reason}</p></div>
   <button type="button" onClick={()=>void assign()} disabled={sending||!!daily?.submitted_at||(studentToken?(!daily&&!report.assignmentCount):!report.assignmentCount)} className="news-send"><Send size={18}/>{sending?'Đang tạo và gửi bài…':studentToken?(daily?.submitted_at?'Đã hoàn thành bài hôm nay':daily?'Tiếp tục bài hôm nay':'Bắt đầu bài luyện hôm nay'):daily?.submitted_at?'Đã hoàn thành bài hôm nay':'Giao bài theo đề xuất'}</button>
   {sent&&<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{sent}</p>}
   <p className="text-xs news-muted">Cập nhật khoảng 15 giây khi đang mở app. {studentToken?'Bài luyện hôm nay dùng chung với đề xuất bên phụ huynh để tránh trùng bài.':'Mỗi ngày gửi một bài theo đề xuất; phụ huynh vẫn có thể tự tạo bài bên dưới.'}</p>
  </>}
  {history.length>1&&<details className="border-t border-slate-100 pt-3"><summary className="cursor-pointer text-sm font-semibold">Bản tin các ngày trước</summary><div className="max-h-64 overflow-y-auto space-y-2 mt-3">{history.slice(1).map(r=><div key={r.day} className="rounded-xl bg-slate-50 p-3 text-sm"><strong>{r.day.split('-').reverse().join('/')}</strong><p>{r.assignmentCount?`${r.questionCount} câu · ${r.mode}`:'Chưa cần giao thêm bài'}</p><p className="text-xs news-muted">{r.reason}</p></div>)}</div></details>}
 </section></>
}
function Metric({value,label}:{value:number;label:string}){return <div className="news-metric"><strong className="news-number">{value}</strong><p className="mt-1 text-xs news-muted">{label}</p></div>}
