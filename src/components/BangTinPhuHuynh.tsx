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
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
type Report = {
  day: string
  updatedAt: string
  today: { tenCa: string; diem: number | null; nopLuc: string }[]
  weak: { name: string; count: number }[]
  wrong: number
  pending: number
  pendingDetails?: { btvn: number; mom: number; daily: number }
  questionCount: number
  assignmentCount: number
  minutes: number
  mode: string
  reason: string
  duDoanDiem?: {
    diem: number
    khoangDiem: string
    thang: string
    nhanXet: string
    doTinCay: 'cao' | 'trung_binh' | 'khoi_dau'
  }
  keHoach?: {
    tongCau: number
    soCauSuaLoi: number
    soCauOnBaiCu: number
    soCauTienBo: number
    phuongPhap: string
  }
}
export default function BangTinPhuHuynh({
  sbd,
  onSent,
  studentToken,
  activeTab,
  onSelectTab,
  tabStats,
  hoTen,
  lop,
  caGanNhat,
}:{
  sbd:string;
  onSent:(id?:string)=>void;
  studentToken?:string;
  activeTab?:string|null;
  onSelectTab?:(tab:string)=>void;
  tabStats?:{diemCount?:number;btvnCount?:number;momCount?:number;wrongCount?:number};
  hoTen?:string;
  lop?:string;
  caGanNhat?:{maCa:string;tenCa:string;diem:number|null;ngayNop?:string}|null;
}){
 const [daily,setDaily]=useState<{id:string;submitted_at:string|null}|null>(null)
 const api=useCallback((action:'list'|'assign')=>studentToken?studentNewsApi(action,studentToken):parentNewsApi(action,sbd),[sbd,studentToken])
 const [report,setReport]=useState<Report|null>(null),[error,setError]=useState(''),[sending,setSending]=useState(false),[sent,setSent]=useState('')
 const refresh=useCallback(async()=>{try{const r=await api('list');setReport(r.report);setDaily(r.daily||null);setError('');if(typeof navigator!=='undefined'&&'serviceWorker' in navigator){navigator.serviceWorker.ready.then(reg=>reg.update().catch(()=>{})).catch(()=>{})}}catch(e){setError(e instanceof Error?e.message:'Chưa cập nhật được dữ liệu.')}},[api])
 useEffect(()=>{setReport(null);setSent('');void refresh();const poll=()=>{if(!document.hidden)void refresh()};const t=setInterval(poll,15000);window.addEventListener('focus',poll);window.addEventListener('online',poll);return()=>{clearInterval(t);window.removeEventListener('focus',poll);window.removeEventListener('online',poll)}},[refresh])
 async function assign(){setSending(true);setError('');try{const r=await api('assign');setSent(r.alreadySent?'Bài theo đề xuất hôm nay đã được gửi. Không tạo thêm bài trùng.':`Đã gửi 1 bài gồm ${r.questionCount} câu sang app của con.`);onSent(r.id);await refresh()}catch(e){setError(e instanceof Error?e.message:'Chưa gửi được bài.')}finally{setSending(false)}}

 const btvnChuaNop = report?.pendingDetails?.btvn ?? 0
 const momChuaNop = report?.pendingDetails?.mom ?? 0
 const deXuatChuaNop = report?.pendingDetails?.daily ?? 0
 const tongChuaNop = (btvnChuaNop + momChuaNop + deXuatChuaNop) > 0
   ? (btvnChuaNop + momChuaNop + deXuatChuaNop)
   : (report?.pending || 0)

 const latestCa = caGanNhat || (report?.today && report.today.length > 0 ? {
   maCa: '',
   tenCa: report.today[0].tenCa,
   diem: report.today[0].diem,
   ngayNop: report.today[0].nopLuc,
 } : null)

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
  ) : (
    <>
      <div className="flex flex-wrap justify-between gap-2 text-xs news-muted"><span>Ngày {report.day.split('-').reverse().join('/')}</span><span>Cập nhật {new Date(report.updatedAt).toLocaleTimeString('vi-VN')}</span></div>

    {/* ĐIỂM CA GẦN NHẤT — NHẤP NHÁY TO MÀU ĐẸP CHUẨN GOOGLE ĐẦU BẢNG TIN */}
    {latestCa && (
      <button
        type="button"
        onClick={() => onSelectTab?.('diem')}
        className="w-full text-left p-4 sm:p-5 rounded-3xl border-2 border-[#1a73e8] dark:border-[#8ab4f8] bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/40 dark:from-blue-950/80 dark:via-slate-900 dark:to-indigo-950/60 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group relative overflow-hidden active:scale-[0.99]"
      >
        {/* Vầng sáng nhấp nháy chuẩn Google */}
        <div className="absolute -inset-1 bg-gradient-to-r from-[#1a73e8]/20 via-[#34a853]/20 to-[#4285f4]/20 rounded-3xl blur-md animate-pulse pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1a73e8] to-[#1557b0] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <Award size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1a73e8] text-white shadow-2xs">
                  Điểm ca thi gần nhất
                </span>
                {latestCa.maCa && (
                  <span className="font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                    #{latestCa.maCa}
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate mt-1 group-hover:text-[#1a73e8] dark:group-hover:text-[#8ab4f8] transition">
                {latestCa.tenCa || 'Bài kiểm tra hoàn thành'}
              </h3>
              <p className="text-xs text-[#1a73e8] dark:text-[#8ab4f8] font-semibold flex items-center gap-0.5 mt-0.5">
                <span>Xem điểm tất cả ({tabStats?.diemCount ?? 0} ca thi)</span>
                <ChevronRight size={14} />
              </p>
            </div>
          </div>

          {/* Số điểm to nhấp nháy phát sáng chuẩn Google */}
          <div className="shrink-0 text-right pl-3 sm:pl-5 border-l-2 border-blue-200/80 dark:border-blue-800/80">
            <div className="flex items-baseline justify-end gap-1">
              <span className="text-3xl sm:text-4xl font-black text-[#1a73e8] dark:text-[#8ab4f8] tabular-nums tracking-tight animate-pulse drop-shadow-xs">
                {typeof latestCa.diem === 'number' ? latestCa.diem.toFixed(2) : '--'}
              </span>
              <span className="text-sm font-bold text-slate-400">/10</span>
            </div>
            <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
              Điểm số của con
            </div>
          </div>
        </div>
      </button>
    )}

   {/* BẢNG TIN TỔNG QUAN & GỢI Ý: Trên điện thoại 1 cột rộng rãi, trên máy tính/tablet 2 cột */}
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-stretch">
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

      {/* HỌC SINH: 6 NÚT CHỨC NĂNG RÚT GỌN (2 HÀNG x 3 CỘT) */}
      {studentToken && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Chức năng học tập
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              Mở toàn màn hình
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
            {/* 1. Xem điểm */}
            <button
              type="button"
              onClick={() => onSelectTab?.('diem')}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 active:scale-95 group shadow-2xs ${
                activeTab === 'diem'
                  ? 'border-2 border-[#1a73e8] bg-blue-50 dark:bg-blue-950/80 shadow-sm ring-2 ring-blue-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'diem' ? 'bg-[#1a73e8] text-white' : 'bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8]'
                }`}>
                  <Award size={17} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/80 text-blue-800 dark:text-blue-200 tabular-nums">
                  {tabStats?.diemCount ?? 0} ca
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#1a73e8] transition">
                  Xem điểm
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  Lịch sử ca thi
                </div>
              </div>
            </button>

            {/* 2. BTVN */}
            <button
              type="button"
              onClick={() => onSelectTab?.('btvn')}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 active:scale-95 group shadow-2xs ${
                activeTab === 'btvn'
                  ? 'border-2 border-[#1e8e3e] bg-emerald-50 dark:bg-emerald-950/80 shadow-sm ring-2 ring-emerald-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-emerald-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'btvn' ? 'bg-[#1e8e3e] text-white' : 'bg-emerald-50 dark:bg-emerald-950/60 text-[#1e8e3e]'
                }`}>
                  <BookOpen size={17} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-800 dark:text-emerald-200 tabular-nums">
                  {tabStats?.btvnCount ?? 0} bài
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#1e8e3e] transition">
                  BTVN
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  Thầy giáo giao
                </div>
              </div>
            </button>

            {/* 3. Bài Mom */}
            <button
              type="button"
              onClick={() => onSelectTab?.('mom')}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 active:scale-95 group shadow-2xs ${
                activeTab === 'mom'
                  ? 'border-2 border-[#d93025] bg-rose-50 dark:bg-rose-950/80 shadow-sm ring-2 ring-rose-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-rose-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'mom' ? 'bg-[#d93025] text-white' : 'bg-rose-50 dark:bg-rose-950/60 text-[#d93025]'
                }`}>
                  <Heart size={17} fill="currentColor" />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 tabular-nums">
                  {tabStats?.momCount ?? 0} bài
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#d93025] transition">
                  Bài Mom
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  Phụ huynh giao
                </div>
              </div>
            </button>

            {/* 4. Luyện đề */}
            <button
              type="button"
              onClick={() => onSelectTab?.('khacphuc')}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 active:scale-95 group shadow-2xs ${
                activeTab === 'khacphuc'
                  ? 'border-2 border-[#f29900] bg-amber-50 dark:bg-amber-950/80 shadow-sm ring-2 ring-amber-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'khacphuc' ? 'bg-[#f29900] text-white' : 'bg-amber-50 dark:bg-amber-950/60 text-[#f29900]'
                }`}>
                  <Target size={17} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 tabular-nums">
                  {tabStats?.wrongCount ?? 0} câu
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#f29900] transition">
                  Luyện đề
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  4 chế độ luyện
                </div>
              </div>
            </button>

            {/* 5. Vào thi */}
            <button
              type="button"
              onClick={() => onSelectTab?.('vaothi')}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 active:scale-95 group shadow-2xs ${
                activeTab === 'vaothi'
                  ? 'border-2 border-[#9334e6] bg-purple-50 dark:bg-purple-950/80 shadow-sm ring-2 ring-purple-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-purple-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'vaothi' ? 'bg-[#9334e6] text-white' : 'bg-purple-50 dark:bg-purple-950/60 text-[#9334e6]'
                }`}>
                  <LogIn size={17} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/80 text-purple-800 dark:text-purple-200">
                  Online
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#9334e6] transition">
                  Vào thi
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  Phòng trực tuyến
                </div>
              </div>
            </button>

            {/* 6. Thần thú */}
            <button
              type="button"
              onClick={() => onSelectTab?.('thanthu')}
              className={`p-2.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between gap-2 active:scale-95 group shadow-2xs ${
                activeTab === 'thanthu'
                  ? 'border-2 border-[#ea580c] bg-orange-50 dark:bg-orange-950/80 shadow-sm ring-2 ring-orange-400/30'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-300 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  activeTab === 'thanthu' ? 'bg-[#ea580c] text-white' : 'bg-orange-50 dark:bg-orange-950/60 text-[#ea580c]'
                }`}>
                  <Sparkles size={17} />
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/80 text-orange-800 dark:text-orange-200">
                  8 hệ
                </span>
              </div>
              <div>
                <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-tight truncate group-hover:text-[#ea580c] transition">
                  Thần thú
                </div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                  Leo tháp 8 hệ
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* PHỤ HUYNH: 2 THẺ CHỨC NĂNG HOẠT ĐỘNG CỦA CON CHUYỂN LÊN ĐÂY */}
      {!studentToken && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#1a73e8]" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Hoạt động học tập của con
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400">
              Mở toàn màn hình
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
            {/* 1. THẺ XEM ĐIỂM CA THI */}
            <button
              type="button"
              onClick={() => onSelectTab?.('diem')}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.98] group shadow-2xs ${
                activeTab === 'diem'
                  ? 'border-2 border-[#1a73e8] bg-blue-50/90 dark:bg-blue-950/80 shadow-md ring-2 ring-blue-400/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] dark:text-[#8ab4f8] border border-blue-200/60 dark:border-blue-900">
                  <Award size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition whitespace-nowrap">
                      Xem điểm ca thi
                    </span>
                    {latestCa?.maCa && (
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 shrink-0">
                        #{latestCa.maCa}
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {latestCa?.tenCa || 'Lịch sử kết quả ca thi'}
                  </div>
                  <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 flex items-center gap-0.5 whitespace-nowrap">
                    <span>Xem tất cả ({tabStats?.diemCount ?? 0} ca)</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>

              {latestCa && typeof latestCa.diem === 'number' && (
                <div className="shrink-0 text-right pl-2 border-l border-slate-100 dark:border-slate-800">
                  <div className="text-lg sm:text-xl font-black text-[#1a73e8] dark:text-[#8ab4f8] tabular-nums leading-none">
                    {latestCa.diem.toFixed(2)}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase">
                    Điểm
                  </div>
                </div>
              )}
            </button>

            {/* 2. THẺ KHẮC PHỤC LUYỆN ĐỀ (4 LỰA CHỌN) */}
            <button
              type="button"
              onClick={() => onSelectTab?.('khacphuc')}
              className={`p-3 sm:p-3.5 rounded-2xl border text-left transition-all duration-150 cursor-pointer flex items-center justify-between gap-2.5 active:scale-[0.98] group shadow-2xs ${
                activeTab === 'khacphuc'
                  ? 'border-2 border-[#f29900] bg-amber-50/90 dark:bg-amber-950/80 shadow-md ring-2 ring-amber-400/30'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-400 hover:shadow-xs'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-amber-50 dark:bg-amber-950/60 text-[#d97706] dark:text-[#fdd663] border border-amber-200/60 dark:border-amber-900">
                  <Target size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition whitespace-nowrap">
                      Khắc phục luyện đề
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 shrink-0">
                      4 mục
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Rút câu sai · Dạng bài · Tự do
                  </div>
                  <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 flex items-center gap-0.5 whitespace-nowrap">
                    <span>Mở 4 lựa chọn</span>
                    <ChevronRight size={13} />
                  </div>
                </div>
              </div>

              <div className="shrink-0 pl-1">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center shadow-xs transition group-hover:scale-105">
                  <ChevronRight size={16} />
                </div>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>

    {/* CỘT 2: GỢI Ý HÔM NAY (BAO GỒM CẢNH BÁO VÀ KIẾN THỨC CẦN CỦNG CỐ) */}
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
            Ít nhất 12 câu / ngày
          </span>
        </div>

        {/* DỰ ĐOÁN ĐIỂM THI THẬT THEO THÁNG */}
        {report.duDoanDiem && (
          <div className="p-3.5 rounded-2xl border border-indigo-200/90 dark:border-indigo-800/80 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/50 dark:from-indigo-950/70 dark:via-slate-900 dark:to-blue-950/60 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-indigo-600 text-white shadow-2xs">
                  <TrendingUp size={15} />
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200">
                  Dự đoán đề thi tốt nghiệp ({report.duDoanDiem.thang})
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-indigo-700 dark:text-indigo-300 tabular-nums">
                {report.duDoanDiem.khoangDiem} đ
              </div>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300 leading-snug">
              {studentToken
                ? report.duDoanDiem.nhanXet.replace(/Con/g, 'Em').replace(/con/g, 'em')
                : report.duDoanDiem.nhanXet}
            </p>
          </div>
        )}

        {/* CẢNH BÁO BÀI CHỜ LÀM (NẾU CÓ) */}
        {tongChuaNop > 0 && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-950/40 p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-200">
                <AlertTriangle size={16} className="text-[#ea4335] shrink-0" />
                <span>Cảnh báo: {tongChuaNop} bài đang chờ làm</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-200/80 dark:bg-rose-900/80 text-rose-900 dark:text-rose-100">
                Chưa nộp
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 text-[11px]">
              {btvnChuaNop > 0 && (
                <span className="px-2 py-0.5 rounded-lg font-semibold bg-white/80 dark:bg-slate-800/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                  BTVN: <strong>{btvnChuaNop}</strong>
                </span>
              )}
              {momChuaNop > 0 && (
                <span className="px-2 py-0.5 rounded-lg font-semibold bg-white/80 dark:bg-slate-800/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                  Bài Mom: <strong>{momChuaNop}</strong>
                </span>
              )}
              {deXuatChuaNop > 0 && (
                <span className="px-2 py-0.5 rounded-lg font-semibold bg-white/80 dark:bg-slate-800/80 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                  Đề xuất: <strong>{deXuatChuaNop}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Trạng thái đề xuất */}
        {daily?.submitted_at ? (
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-xs sm:text-sm font-bold shadow-2xs">
            <CheckCircle2 size={18} className="text-[#34a853] shrink-0" />
            <span>Đã hoàn thành bài luyện hôm nay</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold">
                <AlertCircle size={16} className="text-[#1a73e8] shrink-0" />
                <span>
                  {studentToken
                    ? 'Chưa hoàn thành bài luyện hôm nay'
                    : 'Con chưa hoàn thành bài luyện hôm nay'}
                </span>
              </div>
              {report.assignmentCount > 0 && (
                <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#1a73e8] text-white">
                  {report.mode}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-slate-600 dark:text-slate-300 px-1">
              {report.assignmentCount
                ? `Đề xuất: 1 bài · tối đa ${report.questionCount} câu · khoảng ${report.minutes} phút`
                : 'Chưa cần giao thêm bài'}
            </div>
          </div>
        )}

        {/* Lý do phân tích */}
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed bg-white/80 dark:bg-slate-800/80 p-3 rounded-xl border border-blue-100 dark:border-slate-700/80 shadow-2xs">
          {studentToken
            ? report.reason.replace(/Con/g, 'Em').replace(/con/g, 'em')
            : report.reason}
        </div>

        {/* PHÂN BỔ 12 CÂU THEO PHƯƠNG PHÁP XỊN NHẤT */}
        {report.keHoach && (
          <div className="flex items-center justify-between gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100/90 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/60 shadow-2xs">
            <span className="flex items-center gap-1">
              <span>🎯</span>
              <span><strong>{report.keHoach.soCauSuaLoi}c</strong> sửa lỗi</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <span>🔄</span>
              <span><strong>{report.keHoach.soCauOnBaiCu}c</strong> chống quên</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <span>🚀</span>
              <span><strong>{report.keHoach.soCauTienBo}c</strong> tiến bộ</span>
            </span>
          </div>
        )}

        {/* KIẾN THỨC CẦN CỦNG CỐ CHUYỂN SANG ĐÂY */}
        {report.weak.length > 0 && (
          <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-300">
              <span className="flex items-center gap-1.5">
                <Target size={15} className="text-[#fbbc04]" />
                Kiến thức cần củng cố ({report.weak.length} chuyên đề)
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {report.weak.map((t) => (
                <span
                  key={t.name}
                  className="inline-flex items-center gap-1.5 border border-amber-200 dark:border-amber-800/60 rounded-lg px-2 py-0.5 text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs"
                >
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{t.name}</span>
                  <span className="shrink-0 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                    {t.count} câu
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}
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
          className={`w-full min-h-[44px] sm:min-h-[48px] py-2.5 sm:py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99] ${
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
  </section>
  </>
}
