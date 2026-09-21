import { gioHanVietNam, mocThoiGian } from '../lib/han-bai-tap'
import { gioDayDu } from '../lib/ngay-gio-24'

/** `dayDu` (app giáo viên): "HH:mm · Thứ Sáu 25/09/2026"; không có ⇒ chữ cũ của app học sinh/phụ huynh (KHÔNG đổi). */
export default function NhanHanBaiTap({ han, now, daNop = false, dayDu = false }: { han?: string; now: number; daNop?: boolean; dayDu?: boolean }) {
  const ms = mocThoiGian(han)
  const overdue = ms !== undefined && ms <= now
  const soon = ms !== undefined && ms > now && ms - now <= 86400_000
  const label = daNop ? 'Đã nộp' : overdue ? 'Quá hạn' : soon ? 'Hạn trong 24 giờ' : 'Hạn nộp'
  return <span className={`inline-block rounded-lg px-2 py-1 text-xs ${daNop ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : overdue || soon ? 'bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
    {label}: {dayDu ? gioDayDu(han) : gioHanVietNam(han)} (giờ Việt Nam)
  </span>
}
