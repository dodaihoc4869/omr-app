import BangVinhDanh from './BangVinhDanh'
import {useCallback,useEffect,useState} from 'react'
import {parentNewsApi,studentNewsApi} from '../lib/mom-api'
import './BangTinPhuHuynh.css'
import {
  Calendar,
  RefreshCw,
  Sparkles,
  Send,
  AlertTriangle,
  FileCheck,
  RotateCcw,
  CheckCircle2,
  Target,
  Info,
  Award,
  BookOpen,
  Heart,
  LogIn,
  AlertCircle,
} from 'lucide-react'
type Report={day:string;updatedAt:string;today:{tenCa:string;diem:number|null;nopLuc:string}[];weak:{name:string;count:number}[];wrong:number;pending:number;pendingDetails?:{btvn:number;mom:number;daily:number};questionCount:number;assignmentCount:number;minutes:number;mode:string;reason:string}
export default function BangTinPhuHuynh({
  sbd,
  onSent,
  studentToken,
  activeTab,
  onSelectTab,
  tabStats,
  hoTen,
  lop,
}:{
  sbd:string;
  onSent:(id?:string)=>void;
  studentToken?:string;
  activeTab?:string|null;
  onSelectTab?:(tab:string)=>void;
  tabStats?:{diemCount?:number;btvnCount?:number;momCount?:number;wrongCount?:number};
  hoTen?:string;
  lop?:string;
}){
 const [daily,setDaily]=useState<{id:string;submitted_at:string|null}|null>(null)
 const api=useCallback((action:'list'|'assign')=>studentToken?studentNewsApi(action,studentToken):parentNewsApi(action,sbd),[sbd,studentToken])
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[sending,setSending]=useState(false),[sent,setSent]=useState('')
 const refresh=useCallback(async()=>{try{const r=await api('list');setReport(r.report);setDaily(r.daily||null);setError('')}catch(e){setError(e instanceof Error?e.message:'Chưa cập nhật được dữ liệu.')}},[api])
 useEffect(()=>{setReport(null);setSent('');void refresh();const poll=()=>{if(!document.hidden)void refresh()};const t=setInterval(poll,15000);window.addEventListener('focus',poll);window.addEventListener('online',poll);return()=>{clearInterval(t);window.removeEventListener('focus',poll);window.removeEventListener('online',poll)}},[refresh])
 async function assign(){setSending(true);setError('');try{const r=await api('assign');setSent(r.alreadySent?'Bài theo đề xuất hôm nay đã được gửi. Không tạo thêm bài trùng.':`Đã gửi 1 bài gồm ${r.questionCount} câu sang app của con.`);onSent(r.id);await refresh()}catch(e){setError(e instanceof Error?e.message:'Chưa gửi được bài.')}finally{setSending(false)}}

 const btvnChuaNop = report?.pendingDetails?.btvn ?? 0
 const momChuaNop = report?.pendingDetails?.mom ?? 0
 const deXuatChuaNop = report?.pendingDetails?.daily ?? 0
 const tongChuaNop = (btvnChuaNop + momChuaNop + deXuatChuaNop) > 0
   ? (btvnChuaNop + momChuaNop + deXuatChuaNop)
   : (report?.pending || 0)

 return <>
  <BangVinhDanh
    vaiTro={studentToken ? 'hocsinh' : 'phuhuynh'}
    hoTen={hoTen}
    sbd={sbd}
    lop={lop}
    tongSoCa={tabStats?.diemCount ?? 0}
  />
  <section className="parent-news space-y-5">
  <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 dark:text-white"><Calendar className="news-accent" size={22}/>{studentToken?'Bảng tin học tập của em':'Bảng tin học tập của con'}</h2><p className="mt-1 text-xs news-muted">Bản tin mới lúc 00:01 mỗi ngày · Giờ Việt Nam</p></div><button type="button" aria-label="Cập nhật bảng tin" onClick={()=>void refresh()} className="news-refresh"><RefreshCw size={18}/></button></div>
  {error&&<p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{error}</p>}
  {!report?(
    <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-5 text-center shadow-xs">
      <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
        <RefreshCw size={16} className="animate-spin text-blue-600 dark:text-blue-400" />
        <span>Đang tổng hợp dữ liệu học tập của con…</span>
      </div>
    </div>
  ):(<>
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
   <div className="grid grid-cols-2 gap-2 sm:gap-5 items-stretch">
    {/* CỘT 1: TỔNG QUAN HỌC TẬP (Metrics, Bài thi, Kiến thức cần củng cố) */}
    <div className="space-y-4 flex flex-col justify-between">
      {/* 3 THẺ CHỈ SỐ THEO PHONG CÁCH GOOGLE */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Ô 1: Bài thi hôm nay - Google Blue */}
        <div className="rounded-2xl p-3 sm:p-4 border border-[#8ab4f8]/60 dark:border-blue-800/60 border-t-4 border-t-[#1a73e8] bg-[#e8f0fe] dark:bg-[#172b4d]/70 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#174ea6] dark:text-[#aecbfa]">
            <span className="truncate">Bài hôm nay</span>
            <FileCheck size={16} className="text-[#1a73e8] dark:text-[#8ab4f8] shrink-0" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#1a73e8] dark:text-[#8ab4f8] tabular-nums">
            {report.today.length}
          </div>
        </div>

        {/* Ô 2: Câu cần ôn - Google Yellow / Amber */}
        <div className="rounded-2xl p-3 sm:p-4 border border-[#fdd663]/60 dark:border-amber-800/60 border-t-4 border-t-[#fbbc04] bg-[#fef7e0] dark:bg-[#3a2e0a]/70 flex flex-col justify-between shadow-xs">
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-[#7c4400] dark:text-[#fde293]">
            <span className="truncate">Câu cần ôn</span>
            <RotateCcw size={16} className="text-[#d97706] dark:text-[#fdd663] shrink-0" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-[#b06000] dark:text-[#fdd663] tabular-nums">
            {report.wrong}
          </div>
        </div>

        {/* Ô 3: Câu đang chờ làm - Google Red / Green */}
        <div
          className={`rounded-2xl p-3 sm:p-4 border flex flex-col justify-between shadow-xs ${
            tongChuaNop > 0
              ? 'border-[#f28b82]/60 dark:border-red-800/60 border-t-4 border-t-[#ea4335] bg-[#fce8e6] dark:bg-[#3c1e1e]/70'
              : 'border-[#81c995]/60 dark:border-emerald-800/60 border-t-4 border-t-[#34a853] bg-[#e6f4ea] dark:bg-[#0f3822]/70'
          }`}
        >
          <div
            className={`flex items-center justify-between text-[11px] sm:text-xs font-bold ${
              tongChuaNop > 0
                ? 'text-[#a50e0e] dark:text-[#f6aea9]'
                : 'text-[#0d652d] dark:text-[#a8dab5]'
            }`}
          >
            <span className="truncate">{tongChuaNop > 0 ? 'Chờ làm' : 'Đang chờ làm'}</span>
            {tongChuaNop > 0 ? (
              <AlertTriangle size={16} className="text-[#ea4335] dark:text-[#f28b82] shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="text-[#34a853] dark:text-[#81c995] shrink-0" />
            )}
          </div>
          <div
            className={`mt-2 text-2xl sm:text-3xl font-black tabular-nums ${
              tongChuaNop > 0
                ? 'text-[#d93025] dark:text-[#f28b82]'
                : 'text-[#188038] dark:text-[#81c995]'
            }`}
          >
            {tongChuaNop}
          </div>
        </div>
      </div>

      {/* BÀI THI HÔM NAY */}
      {report.today.length > 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-3.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <FileCheck size={15} className="text-[#1a73e8]" />
              Bài thi đã nộp hôm nay ({report.today.length})
            </span>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {report.today.map((e, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 px-3 py-2 text-xs"
              >
                <span className="truncate font-semibold text-slate-700 dark:text-slate-200">{e.tenCa}</span>
                <strong className="shrink-0 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold">
                  {e.diem == null ? 'Chờ chấm' : `${Number(e.diem).toFixed(2)}/10`}
                </strong>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/50 p-3.5 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
          <Info size={16} className="text-[#1a73e8] shrink-0" />
          <span>Hôm nay chưa có bài thi đã nộp. Đề xuất dựa trên kết quả gần nhất đang có.</span>
        </div>
      )}

      {/* KIẾN THỨC CẦN CỦNG CỐ */}
      {report.weak.length > 0 && (
        <div className="rounded-2xl border border-amber-200/70 dark:border-amber-900/40 bg-white dark:bg-slate-900/80 p-3.5 space-y-2 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300">
            <Target size={15} className="text-[#fbbc04]" />
            <span>Kiến thức cần củng cố ({report.weak.length} chuyên đề)</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {report.weak.map((t) => (
              <span
                key={t.name}
                className="inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 border-l-4 border-l-[#fbbc04] rounded-xl px-2.5 py-1 text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs"
              >
                <span className="truncate max-w-[180px]">{t.name}</span>
                <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                  {t.count} câu
                </span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>

    {/* CỘT 2: GỢI Ý HÔM NAY & HÀNH ĐỘNG */}
    <div className="rounded-2xl border-2 border-blue-200/90 dark:border-blue-800/70 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/30 p-4 sm:p-5 shadow-sm flex flex-col justify-between h-full space-y-4">
      <div className="space-y-3">
        {/* Header gợi ý */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-[#1a73e8] text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
              Gợi ý hôm nay
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
            Cá nhân hoá
          </span>
        </div>

        {/* Trạng thái đề xuất */}
        {daily?.submitted_at ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-sm sm:text-base font-bold shadow-2xs">
            <CheckCircle2 size={18} className="text-[#34a853] shrink-0" />
            <span>Đã hoàn thành bài luyện hôm nay</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 text-sm sm:text-base font-bold shadow-2xs">
              <AlertCircle size={18} className="text-[#ea4335] shrink-0" />
              <span>
                {studentToken
                  ? 'Chưa hoàn thành bài luyện hôm nay'
                  : 'Con chưa hoàn thành bài luyện hôm nay'}
              </span>
            </div>
            <div className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200">
              {report.assignmentCount
                ? `1 bài · tối đa ${report.questionCount} câu · khoảng ${report.minutes} phút`
                : 'Chưa cần giao thêm bài'}
            </div>
          </div>
        )}

        {/* Chế độ */}
        {report.assignmentCount > 0 && !daily?.submitted_at && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
            <span>Chế độ:</span>
            <strong className="font-bold">{report.mode}</strong>
          </div>
        )}

        {/* Lý do phân tích */}
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-blue-100 dark:border-slate-700/80 shadow-2xs">
          {studentToken
            ? report.reason.replace(/Con/g, 'Em').replace(/con/g, 'em')
            : report.reason}
        </div>
      </div>

      {/* Nút hành động và thông tin */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => void assign()}
          disabled={
            sending ||
            !!daily?.submitted_at ||
            (studentToken ? !daily && !report.assignmentCount : !report.assignmentCount)
          }
          className={`w-full min-h-[48px] py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            daily?.submitted_at
              ? 'bg-[#34a853] text-white hover:bg-[#2e944b]'
              : 'bg-[#ea4335] text-white hover:bg-[#d93025]'
          }`}
        >
          {daily?.submitted_at ? (
            <CheckCircle2 size={18} />
          ) : (
            <Send size={18} />
          )}
          <span>
            {sending
              ? 'Đang tạo và gửi bài…'
              : daily?.submitted_at
              ? 'Đã hoàn thành bài hôm nay'
              : studentToken
              ? daily
                ? 'Tiếp tục bài hôm nay'
                : 'Bắt đầu bài luyện hôm nay'
              : 'Giao bài theo đề xuất'}
          </span>
        </button>

        {sent && (
          <p role="status" className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-800 text-center font-medium">
            {sent}
          </p>
        )}

        <p className="text-[11px] text-slate-400 text-center leading-normal">
          Cập nhật khoảng 15 giây khi đang mở app.{' '}
          {studentToken
            ? 'Bài luyện hôm nay dùng chung với đề xuất bên phụ huynh để tránh trùng bài.'
            : 'Mỗi ngày gửi một bài theo đề xuất; phụ huynh vẫn có thể tự tạo bài bên dưới.'}
        </p>
      </div>
     </div>
    </div>
   </>)}

   {/* DANH MỤC CÁC CHỨC NĂNG CHIA 2 CỘT NỔI KHỐI (GOOGLE STYLE) */}
   <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3">
     <div className="flex flex-wrap items-center justify-between gap-2">
       <div className="flex items-center gap-2">
         <div className="w-2.5 h-2.5 rounded-full bg-[#4285f4]" />
         <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
           {studentToken ? 'Chức năng học tập & Luyện thi' : 'Chức năng đồng hành cùng con (2 ô chọn nhanh)'}
         </h3>
       </div>
       <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
         Bấm ô để mở / đóng chi tiết chức năng ở bên dưới
       </span>
     </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3.5">
       {studentToken ? (
         <>
           {/* 1. Xem điểm */}
           <button
             type="button"
             onClick={() => onSelectTab?.('diem')}
             className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
               activeTab === 'diem'
                 ? 'border-2 border-[#1a73e8] bg-blue-50/90 dark:bg-blue-950/80 shadow-md ring-2 ring-blue-400/30'
                 : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 hover:shadow-xs'
             }`}
           >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                 activeTab === 'diem' ? 'bg-[#1a73e8] text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8]'
               }`}>
                 <Award size={20} />
               </div>
               <div>
                 <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Xem điểm</div>
                 <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Báo cáo các ca thi đã nộp</div>
               </div>
             </div>
             <div className="flex flex-col items-end gap-1 shrink-0">
               <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                 {tabStats?.diemCount ?? 0} ca
               </span>
               {activeTab === 'diem' && (
                 <span className="text-[10px] font-bold text-[#1a73e8]">Đang mở ▼</span>
               )}
             </div>
           </button>

           {/* 2. Bài tập về nhà */}
           <button
             type="button"
             onClick={() => onSelectTab?.('btvn')}
             className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
               activeTab === 'btvn'
                 ? 'border-2 border-[#1e8e3e] bg-emerald-50/90 dark:bg-emerald-950/80 shadow-md ring-2 ring-emerald-400/30'
                 : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 hover:shadow-xs'
             }`}
           >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                 activeTab === 'btvn' ? 'bg-[#1e8e3e] text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1e8e3e]'
               }`}>
                 <BookOpen size={20} />
               </div>
               <div>
                 <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Bài tập về nhà</div>
                 <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Bài tập thầy giáo giao</div>
               </div>
             </div>
             <div className="flex flex-col items-end gap-1 shrink-0">
               <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                 {tabStats?.btvnCount ?? 0} bài
               </span>
               {activeTab === 'btvn' && (
                 <span className="text-[10px] font-bold text-[#1e8e3e]">Đang mở ▼</span>
               )}
             </div>
           </button>

           {/* 3. Bài của Mom giao */}
           <button
             type="button"
             onClick={() => onSelectTab?.('mom')}
             className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
               activeTab === 'mom'
                 ? 'border-2 border-[#d93025] bg-rose-50/90 dark:bg-rose-950/80 shadow-md ring-2 ring-rose-400/30'
                 : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300 hover:shadow-xs'
             }`}
           >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                 activeTab === 'mom' ? 'bg-[#d93025] text-white' : 'bg-rose-50 dark:bg-rose-950/60 text-[#d93025]'
               }`}>
                 <Heart size={20} fill="currentColor" />
               </div>
               <div>
                 <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Bài của Mom giao</div>
                 <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Bài luyện phụ huynh giao</div>
               </div>
             </div>
             <div className="flex flex-col items-end gap-1 shrink-0">
               <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                 {tabStats?.momCount ?? 0} bài
               </span>
               {activeTab === 'mom' && (
                 <span className="text-[10px] font-bold text-[#d93025]">Đang mở ▼</span>
               )}
             </div>
           </button>

           {/* 4. Khắc phục và Luyện đề */}
           <button
             type="button"
             onClick={() => onSelectTab?.('khacphuc')}
             className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
               activeTab === 'khacphuc'
                 ? 'border-2 border-[#f29900] bg-amber-50/90 dark:bg-amber-950/80 shadow-md ring-2 ring-amber-400/30'
                 : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 hover:shadow-xs'
             }`}
           >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                 activeTab === 'khacphuc' ? 'bg-[#f29900] text-white' : 'bg-amber-50 dark:bg-amber-950/60 text-[#f29900]'
               }`}>
                 <Sparkles size={20} />
               </div>
               <div>
                 <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Khắc phục & Luyện đề</div>
                 <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Sửa câu sai & 4 chế độ luyện</div>
               </div>
             </div>
             <div className="flex flex-col items-end gap-1 shrink-0">
               <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                 {tabStats?.wrongCount ?? 0} câu sai
               </span>
               {activeTab === 'khacphuc' && (
                 <span className="text-[10px] font-bold text-[#d97706]">Đang mở ▼</span>
               )}
             </div>
           </button>

           {/* 5. Vào thi */}
           <button
             type="button"
             onClick={() => onSelectTab?.('vaothi')}
             className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
               activeTab === 'vaothi'
                 ? 'border-2 border-[#9334e6] bg-purple-50/90 dark:bg-purple-950/80 shadow-md ring-2 ring-purple-400/30'
                 : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 hover:shadow-xs'
             }`}
           >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                 activeTab === 'vaothi' ? 'bg-[#9334e6] text-white' : 'bg-purple-50 dark:bg-purple-950/60 text-[#9334e6]'
               }`}>
                 <LogIn size={20} />
               </div>
               <div>
                 <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Vào thi</div>
                 <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Nhập mã phòng & ca trực tuyến</div>
               </div>
             </div>
             <div className="flex flex-col items-end gap-1 shrink-0">
               <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                 Trực tuyến
               </span>
               {activeTab === 'vaothi' && (
                 <span className="text-[10px] font-bold text-[#9334e6]">Đang mở ▼</span>
               )}
             </div>
           </button>

           {/* 6. Thần Thú Hóa Học */}
           <button
             type="button"
             onClick={() => onSelectTab?.('thanthu')}
             className={`p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-3 ${
               activeTab === 'thanthu'
                 ? 'border-2 border-[#ea580c] bg-orange-50/90 dark:bg-orange-950/80 shadow-md ring-2 ring-orange-400/30'
                 : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-300 hover:shadow-xs'
             }`}
           >
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                 activeTab === 'thanthu' ? 'bg-[#ea580c] text-white' : 'bg-orange-50 dark:bg-orange-950/60 text-[#ea580c]'
               }`}>
                 <Sparkles size={20} />
               </div>
               <div>
                 <div className="font-bold text-sm text-slate-900 dark:text-white leading-tight">Thần Thú Hóa Học</div>
                 <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Nuôi thú & Leo tháp 8 hệ</div>
               </div>
             </div>
             <div className="flex flex-col items-end gap-1 shrink-0">
               <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                 Mới
               </span>
               {activeTab === 'thanthu' && (
                 <span className="text-[10px] font-bold text-[#ea580c]">Đang mở ▼</span>
               )}
             </div>
           </button>
         </>
       ) : (
         <>
           {/* PHỤ HUYNH THẺ 1: Báo Cáo Điểm Các Ca Thi */}
           <button
             type="button"
             onClick={() => onSelectTab?.('diem')}
             className={`p-4 sm:p-5 rounded-3xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group active:scale-[0.99] ${
               activeTab === 'diem'
                 ? 'border-blue-600 bg-blue-50/90 dark:bg-blue-950/80 shadow-md ring-4 ring-blue-400/20'
                 : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 hover:shadow-sm'
             }`}
           >
             <div className="flex items-start justify-between gap-3 w-full">
               <div className="flex items-center gap-3">
                 <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                   activeTab === 'diem' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                 }`}>
                   <Award size={24} />
                 </div>
                 <div>
                   <h4 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white leading-tight">
                     Báo Cáo Điểm Các Ca Thi
                   </h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                     Kết quả và chi tiết bài làm con đã nộp
                   </p>
                 </div>
               </div>
               <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 shrink-0">
                 {tabStats?.diemCount ?? 0} ca thi
               </span>
             </div>
             <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold w-full">
               <span className="text-slate-400 dark:text-slate-500">
                 {activeTab === 'diem' ? 'Đang mở chi tiết ở bên dưới' : 'Bấm ô để xem danh sách ca thi & điểm số'}
               </span>
               <span className={`font-bold flex items-center gap-1 ${activeTab === 'diem' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 group-hover:text-blue-600'}`}>
                 {activeTab === 'diem' ? 'Đang mở ▼ (Thu gọn)' : 'Mở xem ▼'}
               </span>
             </div>
           </button>

           {/* PHỤ HUYNH THẺ 2: 4 Chế Độ Giao Bài Cho Con */}
           <button
             type="button"
             onClick={() => onSelectTab?.('giaobai')}
             className={`p-4 sm:p-5 rounded-3xl border-2 text-left transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3 relative overflow-hidden group active:scale-[0.99] ${
               activeTab === 'giaobai'
                 ? 'border-amber-500 bg-amber-50/90 dark:bg-amber-950/80 shadow-md ring-4 ring-amber-400/20'
                 : 'border-amber-300/90 dark:border-amber-700/80 bg-white dark:bg-slate-900 hover:border-amber-500 hover:shadow-sm'
             }`}
           >
             <div className="flex items-start justify-between gap-3 w-full">
               <div className="flex items-center gap-3">
                 <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                   activeTab === 'giaobai' ? 'bg-amber-500 text-white shadow-sm' : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                 }`}>
                   <Sparkles size={24} />
                 </div>
                 <div>
                   <h4 className="font-black text-base sm:text-lg text-amber-700 dark:text-amber-400 uppercase tracking-wide leading-tight flex items-center gap-1.5">
                     <Sparkles size={16} className="text-amber-500 shrink-0" />
                     <span>4 CHẾ ĐỘ GIAO BÀI CHO CON</span>
                   </h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                     Hệ thống tự động phân tích và tạo bài luyện khắc phục theo nhu cầu của con
                   </p>
                 </div>
               </div>
               <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0">
                 Hạn 2 tiếng
               </span>
             </div>
             <div className="flex items-center justify-between pt-2.5 border-t border-amber-100 dark:border-amber-900/40 text-[11px] font-semibold w-full">
               <span className="text-slate-400 dark:text-slate-500">
                 {activeTab === 'giaobai' ? 'Đang mở chi tiết ở bên dưới' : 'Bấm ô để mở 4 chế độ giao bài cho con'}
               </span>
               <span className={`font-bold flex items-center gap-1 ${activeTab === 'giaobai' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 group-hover:text-amber-600'}`}>
                 {activeTab === 'giaobai' ? 'Đang mở ▼ (Thu gọn)' : 'Mở giao bài ▼'}
               </span>
             </div>
           </button>
         </>
       )}
     </div>
   </div>
 </section>
 </>
}
