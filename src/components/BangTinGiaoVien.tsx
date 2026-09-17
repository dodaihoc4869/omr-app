import BangVinhDanh from './BangVinhDanh'
import { useCallback, useEffect, useState } from 'react'
import {
  CalendarDays,
  RefreshCw,
  Activity,
  ClipboardList,
  GraduationCap,
  Sparkles,
  ChevronRight,
} from 'lucide-react'
import { layCauHinhMayChu } from '../lib/may-chu-moi'
import { loadTeacherSecret } from '../lib/exam-db'
import { useAppStore } from '../store/appStore'
import { dinhDangDeCayThuMuc } from '../screens/PhanCongScreen'
import './BangTinPhuHuynh.css'

type Report = {
  day: string
  updatedAt: string
  exams: any[]
  homework: any[]
  examSubmitted: number
  homeworkSubmitted: number
  board: { n: number; hoc_sinh: number }
  changes: { hanh_dong: string; n: number }[]
  visits?: { role: string; visits: number; online: number }[]
}

const time = (s: string) =>
  new Date(s).toLocaleTimeString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
  })

export default function BangTinGiaoVien() {
  const [day, setDay] = useState('')
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useAppStore((s) => s.setScreen)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const [ch, secret] = await Promise.all([layCauHinhMayChu(), loadTeacherSecret()])
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 20000)
      const r = await fetch(`${ch.URL}/teacher-news`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-ma-bi-mat': secret || '' },
        body: JSON.stringify({ day: day || undefined }),
        signal: controller.signal,
      })
      clearTimeout(timeout)
      const data = await r.json()
      if (!r.ok || !data.ok) throw new Error(data.error || 'Chưa tải được bảng tin.')
      setReport(data)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Mất kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }, [day])

  useEffect(() => {
    void refresh()
    const poll = () => {
      if (!document.hidden) void refresh()
    }
    const t = setInterval(poll, 15000)
    window.addEventListener('focus', poll)
    window.addEventListener('online', poll)
    return () => {
      clearInterval(t)
      window.removeEventListener('focus', poll)
      window.removeEventListener('online', poll)
    }
  }, [refresh])

  const tongHocSinhNhan = report?.homework.reduce((n, b) => n + Number(b.tong || 0), 0) || 0

  return (
    <>
      <section className="parent-news space-y-3.5 !p-3.5 sm:!p-5 rounded-3xl">
        {/* HEADER: Tinh gọn, nhỏ hơn */}
        <header className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/70 text-[#1a73e8] border border-blue-200 dark:border-blue-800 shadow-2xs">
              <CalendarDays size={19} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Bảng tin của thầy
              </h2>
              <p className="news-muted text-[11px] sm:text-xs">
                Ngày mới từ 00:01 · Giờ Việt Nam
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <input
              aria-label="Ngày xem bảng tin"
              type="date"
              value={day || report?.day || ''}
              onChange={(e) => setDay(e.target.value)}
              className="text-xs sm:text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
            />
            <button
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-50 dark:bg-blue-950/60 text-[#1a73e8] border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
              disabled={loading}
              aria-label="Cập nhật bảng tin giáo viên"
              onClick={() => void refresh()}
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            {day && (
              <button
                onClick={() => setDay('')}
                className="text-xs font-bold text-[#1a73e8] hover:underline px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 cursor-pointer"
              >
                Hôm nay
              </button>
            )}
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-200"
          >
            {error}
          </div>
        )}

        {!report ? (
          <div className="p-6 text-center text-xs news-muted">Đang tổng hợp hoạt động…</div>
        ) : (
          /* HỆ THỐNG CHIA LÀM 2 CỘT CÂN XỨNG & TÔ MÀU NỔI BẬT KIỂU GOOGLE */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {/* CỘT 1: DẠY HỌC & BÀI TẬP (Google Blue & Green) */}
            <div className="space-y-3.5 flex flex-col">
              {/* Thẻ 1: Hoạt động & Số liệu giao bài */}
              <div className="rounded-2xl border-2 border-blue-200/90 dark:border-blue-800/70 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/40 dark:from-slate-900 dark:via-slate-900 dark:to-blue-950/40 p-3.5 sm:p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#1a73e8] text-white shadow-xs">
                      <Sparkles size={15} />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Hoạt động dạy học trong ngày
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    Google Style
                  </span>
                </div>

                {/* 2 Metric con nổi khối */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800/80 bg-white/90 dark:bg-slate-800/90 text-center shadow-2xs">
                    <div className="text-xl sm:text-2xl font-black text-[#1a73e8] leading-tight">
                      {report.homework.length}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      Đợt giao bài
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {tongHocSinhNhan} lượt HS nhận
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white/90 dark:bg-slate-800/90 text-center shadow-2xs">
                    <div className="text-xl sm:text-2xl font-black text-[#1e8e3e] leading-tight">
                      {Number(report.board?.n || 0)}
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                      Lượt chữa trên bảng
                    </div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-500">
                      {report.board?.hoc_sinh || 0} học sinh đã ghi
                    </div>
                  </div>
                </div>

                {/* Tóm tắt chi tiết */}
                <div className="p-2.5 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-1 shadow-2xs">
                  <p>
                    Đã giao <b>{report.homework.length}</b> đợt bài cho <b>{tongHocSinhNhan}</b> lượt
                    học sinh. Có <b>{report.examSubmitted}</b> lượt nộp bài thi và{' '}
                    <b>{report.homeworkSubmitted}</b> bài tập về nhà nộp trong ngày.
                  </p>
                  {report.changes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {report.changes.map((c) => (
                        <span
                          key={c.hanh_dong}
                          className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-200 dark:border-amber-800 text-[10px] font-semibold"
                        >
                          {c.hanh_dong === 'reset' ? 'Cho làm lại' : 'Thu hồi riêng'}: {c.n} lượt HS
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Thẻ 2: Bài đã giao */}
              <div className="flex-1 rounded-2xl border-2 border-emerald-200/90 dark:border-emerald-800/70 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/60">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#1e8e3e] text-white shadow-xs">
                        <ClipboardList size={15} />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Bài đã giao
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                      {report.homework.length} đợt
                    </span>
                  </div>

                  {/* Danh sách cuộn gọn */}
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 mt-2.5">
                    {report.homework.map((b) => (
                      <article
                        key={b.ma_btvn}
                        className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1 shadow-2xs"
                      >
                        <div
                          className="flex items-center justify-between gap-1 font-bold text-slate-900 dark:text-white"
                          style={{ overflowWrap: 'anywhere' }}
                        >
                          <span className="line-clamp-1 font-semibold" title={b.ma_de}>
                            {dinhDangDeCayThuMuc(b.ma_de) || b.ma_de}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                            {b.da_nop || 0}/{b.tong} đã nộp
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {time(b.giao_luc)} · {b.so_cau} câu · {b.tong} lượt nhận{' '}
                          {b.thu_hoi ? `· ${b.thu_hoi} thu hồi riêng` : ''}
                        </p>
                        <p className="text-slate-400 text-[10px]">
                          Hạn: {new Date(b.han_nop).toLocaleString('vi-VN')}
                        </p>
                      </article>
                    ))}
                    {!report.homework.length && (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        Chưa giao bài trong ngày này.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3 pt-2 border-t border-emerald-100 dark:border-emerald-900/60 text-xs font-bold text-[#1a73e8] hover:text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                  onClick={() => navigate('giaobtvn')}
                >
                  <span>Quản lý bài tập</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* CỘT 2: KIỂM TRA & TRUY CẬP HỆ THỐNG (Google Amber & Red) */}
            <div className="space-y-3.5 flex flex-col">
              {/* Thẻ 3: Ca kiểm tra */}
              <div className="rounded-2xl border-2 border-amber-200/90 dark:border-amber-800/70 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/30 p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-amber-100 dark:border-amber-900/60">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-[#f29900] text-white shadow-xs">
                        <GraduationCap size={15} />
                      </div>
                      <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        Ca kiểm tra
                      </h3>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
                      {report.exams.length} ca
                    </span>
                  </div>

                  {/* Danh sách ca cuộn gọn */}
                  <div className="max-h-44 overflow-y-auto space-y-2 pr-1 mt-2.5">
                    {report.exams.map((c) => (
                      <article
                        key={c.ma_ca}
                        className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-1 font-bold text-slate-900 dark:text-white">
                          <span className="line-clamp-1">{c.ten_ca || c.ma_ca}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                              c.trang_thai === 'dong'
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                : c.trang_thai === 'da_xoa'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}
                          >
                            {c.trang_thai === 'dong'
                              ? 'Đã đóng'
                              : c.trang_thai === 'da_xoa'
                              ? 'Đã xóa'
                              : 'Đang mở'}
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                          {time(c.luc)} · Mã <b>{c.ma_ca}</b> · <b>{c.da_nop}/{c.luot}</b> lượt đã
                          nộp
                        </p>
                      </article>
                    ))}
                    {!report.exams.length && (
                      <p className="text-xs text-slate-400 py-4 text-center">
                        Chưa có ca bắt đầu hoặc mở trong ngày này.
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  className="mt-3 pt-2 border-t border-amber-100 dark:border-amber-900/60 text-xs font-bold text-[#d97706] hover:text-amber-800 hover:underline flex items-center gap-1 cursor-pointer"
                  onClick={() => navigate('lichsuca')}
                >
                  <span>Xem ca thi</span>
                  <ChevronRight size={14} />
                </button>
              </div>

              {/* Thẻ 4: Truy cập hệ thống (Google Multi-color Real-time) */}
              <div className="flex-1 rounded-2xl border-2 border-rose-200/90 dark:border-rose-800/70 bg-gradient-to-br from-rose-50/40 via-white to-purple-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/30 p-3.5 sm:p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-[#ea4335] text-white shadow-xs">
                      <Activity size={15} />
                    </div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                      Truy cập hệ thống trực tuyến
                    </h3>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ea4335] animate-ping" />
                    Trực tiếp
                  </span>
                </div>

                {/* 3 Box vai trò nổi khối màu Google */}
                <div className="grid grid-cols-3 gap-2">
                  {/* GIÁO VIÊN: Blue */}
                  {(() => {
                    const v = report.visits?.find((item) => item.role === 'gv')
                    return (
                      <div className="p-2 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/80 text-center shadow-2xs">
                        <div className="text-[11px] font-bold text-[#1a73e8] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1a73e8]" />
                          Giáo viên
                        </div>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {v?.online || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {v?.visits || 0} phiên
                        </div>
                      </div>
                    )
                  })()}

                  {/* HỌC SINH: Green */}
                  {(() => {
                    const v = report.visits?.find((item) => item.role === 'hs')
                    return (
                      <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 text-center shadow-2xs">
                        <div className="text-[11px] font-bold text-[#1e8e3e] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#1e8e3e]" />
                          Học sinh
                        </div>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {v?.online || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {v?.visits || 0} phiên
                        </div>
                      </div>
                    )
                  })()}

                  {/* PHỤ HUYNH: Yellow/Amber */}
                  {(() => {
                    const v = report.visits?.find((item) => item.role === 'ph')
                    return (
                      <div className="p-2 rounded-xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/80 text-center shadow-2xs">
                        <div className="text-[11px] font-bold text-[#d97706] flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#d97706]" />
                          Phụ huynh
                        </div>
                        <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5">
                          {v?.online || 0}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400">
                          {v?.visits || 0} phiên
                        </div>
                      </div>
                    )
                  })()}
                </div>

                <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal pt-1">
                  Đang mở: có tín hiệu trong 90 giây gần nhất. Đếm phiên trình duyệt, không phải số
                  người.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
      <BangVinhDanh />
    </>
  )
}
