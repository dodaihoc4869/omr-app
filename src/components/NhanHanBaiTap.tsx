import { gioHanVietNam, mocThoiGian } from '../lib/han-bai-tap'

export default function NhanHanBaiTap({ han, now, daNop = false }: { han?: string; now: number; daNop?: boolean }) {
  const ms = mocThoiGian(han)
  const overdue = ms !== undefined && ms <= now
  const soon = ms !== undefined && ms > now && ms - now <= 86400_000
  const label = daNop ? 'Đã nộp' : overdue ? 'Quá hạn' : soon ? 'Hạn trong 24 giờ' : 'Hạn nộp'
  return <span className={`inline-block rounded-lg px-2 py-1 text-xs ${daNop ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : overdue || soon ? 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
    {label}: {gioHanVietNam(han)} (giờ Việt Nam)
  </span>
}
