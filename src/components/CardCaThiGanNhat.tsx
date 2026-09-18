import { Award, Clock, ChevronRight, CheckCircle2, BarChart2 } from 'lucide-react'
import DongDemCau from './DongDemCau'

export interface CardCaThiGanNhatProps {
  ca: {
    maCa: string
    tenCa?: string
    tong?: number | null
    nopLuc?: string
    tongCau?: number
    soCauDung?: number
    soCauSai?: number
    soCauBo?: number
    diemI?: number | null
    diemII?: number | null
    diemIII?: number | null
  }
  onXemBaoCao: () => void
}

function dinhDangNgayGio(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const gio = String(d.getHours()).padStart(2, '0')
  const phut = String(d.getMinutes()).padStart(2, '0')
  const ngay = String(d.getDate()).padStart(2, '0')
  const thang = String(d.getMonth() + 1).padStart(2, '0')
  const nam = d.getFullYear()
  return `${gio}:${phut} · ${ngay}/${thang}/${nam}`
}

function mauDiem(diem: number | null | undefined): string {
  if (diem === null || diem === undefined) return 'text-slate-500 bg-slate-100 border-slate-200 dark:bg-slate-800 dark:border-slate-700'
  if (diem >= 8.0) return 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950/50 dark:border-emerald-800'
  if (diem >= 6.5) return 'text-blue-700 bg-blue-50 border-blue-300 dark:text-blue-400 dark:bg-blue-950/50 dark:border-blue-800'
  if (diem >= 5.0) return 'text-amber-700 bg-amber-50 border-amber-300 dark:text-amber-400 dark:bg-amber-950/50 dark:border-amber-800'
  return 'text-rose-700 bg-rose-50 border-rose-300 dark:text-rose-400 dark:bg-rose-950/50 dark:border-rose-800'
}

export default function CardCaThiGanNhat({ ca, onXemBaoCao }: CardCaThiGanNhatProps) {
  return (
    <section
      aria-label="Kết quả ca thi gần nhất"
      className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 p-4 sm:p-5 shadow-xs hover:shadow-md transition space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/60 dark:border-blue-900/60">
              <Award className="w-3.5 h-3.5 text-amber-500" />
              <span>Kết quả ca thi gần nhất</span>
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              #{ca.maCa}
            </span>
            {ca.nopLuc && (
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dinhDangNgayGio(ca.nopLuc)}
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg mt-1.5">
            {ca.tenCa || `Ca thi ${ca.maCa}`}
          </h3>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            className={`text-2xl sm:text-3xl font-extrabold px-3.5 py-1 rounded-2xl border ${mauDiem(
              ca.tong,
            )} flex items-baseline gap-1 shadow-2xs`}
          >
            <span>{ca.tong !== null && ca.tong !== undefined ? ca.tong.toFixed(2) : '--'}</span>
            <span className="text-xs font-normal opacity-70">/10</span>
          </div>
        </div>
      </div>

      {/* Thống kê câu làm & điểm từng phần */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Số câu đúng / sai / bỏ */}
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-300">
            {typeof ca.tongCau === 'number' && ca.tongCau > 0 ? (
              <DongDemCau so={ca} />
            ) : (
              <span>Bài thi đang được hệ thống xử lý bảng điểm</span>
            )}
          </div>
        </div>

        {/* Điểm 3 phần */}
        <div className="grid grid-cols-3 gap-1 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-center">
          <div>
            <div className="text-slate-400 text-[10px]">Phần I (TN)</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {ca.diemI !== null && ca.diemI !== undefined ? ca.diemI.toFixed(2) : '--'}
            </div>
          </div>
          <div className="border-x border-slate-200 dark:border-slate-700">
            <div className="text-slate-400 text-[10px]">Phần II (Đ/S)</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {ca.diemII !== null && ca.diemII !== undefined ? ca.diemII.toFixed(2) : '--'}
            </div>
          </div>
          <div>
            <div className="text-slate-400 text-[10px]">Phần III (Số)</div>
            <div className="font-bold text-slate-800 dark:text-slate-200">
              {ca.diemIII !== null && ca.diemIII !== undefined ? ca.diemIII.toFixed(2) : '--'}
            </div>
          </div>
        </div>
      </div>

      {/* Nút xem chi tiết */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <BarChart2 className="w-3.5 h-3.5 text-blue-500" />
          <span>Bấm để xem từng câu đúng sai, đáp án và lời giải chi tiết của ca này</span>
        </span>

        <button
          type="button"
          onClick={onXemBaoCao}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline cursor-pointer"
        >
          <span>Xem báo cáo chi tiết & Lời giải</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  )
}
