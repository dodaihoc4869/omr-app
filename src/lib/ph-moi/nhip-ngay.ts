// Nhịp học 14 ngày của con (thuần, dùng chung màn chính "Học đều" và bảng "Mọi thứ về con"): đủ 14 ngày kết thúc HÔM NAY theo giờ VN của máy chủ; ngày máy chủ không có dòng ⇒ soCau null (không học).
import { tachVn } from './dinh-dang'
import type { PhMoi } from './du-lieu'

const hai = (n: number) => String(n).padStart(2, '0')

export function ChuoiMuoiBonNgay(pm: Pick<PhMoi, 'nhipHoc' | 'serverNow'>): { ngay: string; soCau: number | null; soDung: number }[] {
  const nh = pm.nhipHoc
  if (!nh) return []
  const homNay = tachVn(pm.serverNow ?? Date.now())
  if (!homNay) return []
  const map = new Map(nh.ngay.map((n) => [n.ngay, n]))
  const ra: { ngay: string; soCau: number | null; soDung: number }[] = []
  for (let i = 13; i >= 0; i--) {
    const t = new Date(Date.UTC(homNay.y, homNay.m - 1, homNay.d) - i * 86_400_000)
    const k = `${t.getUTCFullYear()}-${hai(t.getUTCMonth() + 1)}-${hai(t.getUTCDate())}`
    const e = map.get(k)
    ra.push({ ngay: k, soCau: e ? e.soCau : null, soDung: e ? e.soCauDung : 0 })
  }
  return ra
}
