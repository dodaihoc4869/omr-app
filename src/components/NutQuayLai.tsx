import React from 'react'
import { ArrowLeft } from 'lucide-react'

interface NutQuayLaiProps {
  onClick: () => void
  label?: string
  className?: string
  style?: React.CSSProperties
  variant?: 'pill' | 'ghost' | 'tron'
}

/**
 * Nút quay lại đồng bộ cho cả 3 app (Giáo viên, Học sinh, Phụ huynh)
 * Thiết kế tinh gọn chuẩn Google Material Design, hỗ trợ mượt mà cả Light & Dark mode.
 */
export default function NutQuayLai({
  onClick,
  label = 'Quay lại',
  className = '',
  style,
  variant = 'pill',
}: NutQuayLaiProps) {
  if (variant === 'tron') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        style={style}
        className={`tap-target inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 shadow-2xs hover:shadow-xs transition-[transform,background-color,box-shadow,opacity] active:scale-95 cursor-pointer shrink-0 ${className}`}
      >
        <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-0.5" />
      </button>
    )
  }

  if (variant === 'ghost') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        style={style}
        className={`tap-target inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-[transform,background-color,box-shadow,opacity] active:scale-95 cursor-pointer ${className}`}
      >
        <ArrowLeft size={16} />
        <span>{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={style}
      className={`tap-target group inline-flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-100/90 hover:bg-slate-200 dark:bg-slate-800/90 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 text-xs sm:text-sm font-bold shadow-2xs hover:shadow-xs transition-[transform,background-color,box-shadow,opacity] active:scale-95 cursor-pointer shrink-0 ${className}`}
    >
      <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
      <span className="truncate">{label}</span>
    </button>
  )
}
