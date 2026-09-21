import { createPortal } from 'react-dom'
import { HelpCircle, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'

export interface ModalXacNhanNopProps {
  isOpen: boolean
  tieuDe?: string
  moTa?: string
  tongSoCau: number
  soCauDaLam: number
  onClose: () => void
  onConfirm: () => void
  dangNop?: boolean
  primaryColor?: 'amber' | 'blue'
}

export default function ModalXacNhanNop({
  isOpen,
  tieuDe = 'Xác nhận nộp bài',
  moTa = 'Bài luyện tập của em',
  tongSoCau,
  soCauDaLam,
  onClose,
  onConfirm,
  dangNop = false,
  primaryColor = 'amber',
}: ModalXacNhanNopProps) {
  if (!isOpen) return null

  const soChuaLam = Math.max(0, tongSoCau - soCauDaLam)
  const daXongHet = soChuaLam === 0

  const btnBg =
    primaryColor === 'blue'
      ? 'bg-blue-600 hover:bg-blue-700 text-white'
      : 'bg-amber-500 hover:bg-amber-600 text-white'

  const iconBg =
    primaryColor === 'blue'
      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-nop-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !dangNop) onClose()
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4"
        style={{
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25)',
        }}
      >
        {/* Header với Icon Google Style */}
        <div className="flex items-center gap-3.5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${iconBg}`}>
            <HelpCircle size={26} />
          </div>
          <div className="min-w-0">
            <h3 id="modal-nop-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
              {tieuDe}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {moTa}
            </p>
          </div>
        </div>

        {/* Thông tin tiến độ câu hỏi */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium">Tiến độ bài làm:</span>
            <strong className="text-slate-900 dark:text-white font-bold tabular-nums">
              {soCauDaLam} / {tongSoCau} câu
            </strong>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full rounded-full transition-[width,background-color] duration-300 ${
                daXongHet
                  ? 'bg-emerald-500'
                  : primaryColor === 'blue'
                  ? 'bg-blue-600'
                  : 'bg-amber-500'
              }`}
              style={{ width: `${tongSoCau > 0 ? (soCauDaLam / tongSoCau) * 100 : 0}%` }}
            />
          </div>

          {daXongHet ? (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 size={15} className="shrink-0" />
              <span>Tuyệt vời! Em đã trả lời tất cả các câu.</span>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/30 p-2.5 rounded-xl border border-amber-200/60 dark:border-amber-800/40 font-medium">
              <AlertCircle size={15} className="shrink-0 mt-0.5 text-amber-500" />
              <span>
                Còn <strong>{soChuaLam} câu</strong> chưa làm. Các câu này sẽ không có điểm nếu nộp ngay.
              </span>
            </div>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Sau khi nộp bài, hệ thống sẽ tự động chấm điểm và hiển thị chi tiết lời giải từng câu. Em có chắc chắn muốn nộp không?
        </p>

        {/* Nút hành động chuẩn Google Material Design */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            disabled={dangNop}
            onClick={onClose}
            className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer disabled:opacity-50"
          >
            Làm tiếp
          </button>
          <button
            type="button"
            disabled={dangNop}
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-full text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50 ${btnBg}`}
          >
            {dangNop ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Đang nộp…</span>
              </>
            ) : (
              <span>Nộp bài ngay</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
