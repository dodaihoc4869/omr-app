// NẠP LƯỜI hình SVG theo MÓN ĐANG MẶC: mỗi món một tệp nhỏ (`hinh/pk-*.tsx`, ≤ 4 KB) thành một chunk riêng — thú không mặc gì thì không tải gì, thú mặc món nào thì chỉ tải món ấy.
// Khung tên (KT-*) làm bằng CSS + token nên không có tệp hình ở đây.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface HinhProps {
  /** Mã định danh duy nhất cho mỗi lần vẽ (dải màu, mặt nạ trong SVG không được trùng khi nhiều thú cùng mặc một món). */
  id: string
}
type Nap = () => Promise<{ default: ComponentType<HinhProps> }>

const NAP: Record<string, Nap> = {
  'HQ-01': () => import('./hinh/pk-hq-01'),
  'HQ-02': () => import('./hinh/pk-hq-02'),
  'HQ-03': () => import('./hinh/pk-hq-03'),
  'HQ-04': () => import('./hinh/pk-hq-04'),
  'HQ-05': () => import('./hinh/pk-hq-05'),
  'HQ-06': () => import('./hinh/pk-hq-06'),
  'HQ-07': () => import('./hinh/pk-hq-07'),
  'HQ-08': () => import('./hinh/pk-hq-08'),
  'VD-01': () => import('./hinh/pk-vd-01'),
  'VD-02': () => import('./hinh/pk-vd-02'),
  'VD-03': () => import('./hinh/pk-vd-03'),
  'VD-04': () => import('./hinh/pk-vd-04'),
  'VD-05': () => import('./hinh/pk-vd-05'),
  'VD-06': () => import('./hinh/pk-vd-06'),
  'VD-07': () => import('./hinh/pk-vd-07'),
  'VD-08': () => import('./hinh/pk-vd-08'),
}

/** Món này đã có tệp hình SVG chưa (khung tên KT-* không cần). */
export const coHinhSvg = (ma: string): boolean => ma in NAP

const NHO = new Map<string, LazyExoticComponent<ComponentType<HinhProps>>>()
/** Thành phần nạp lười của món (một thành phần cho một mã — định danh ổn định giữa các lần vẽ); chưa có hình ⇒ null. */
export function hinhCuaMon(ma: string): LazyExoticComponent<ComponentType<HinhProps>> | null {
  const nap = NAP[ma]
  if (!nap) return null
  let c = NHO.get(ma)
  if (!c) {
    c = lazy(nap)
    NHO.set(ma, c)
  }
  return c
}
