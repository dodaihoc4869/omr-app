// GIAO DIỆN «TRONG» · NẠP LƯỜI phần trình bày riêng của app học sinh (TrongHs.tsx + styles/trong-hs.css). Chỉ khi `<html data-trong>` có (laTrong) —
// giao diện cũ (ddh.trong = 'tat') không tải một byte nào của phần này. Gọi lúc mô-đun cổng chạy (song song lệnh Sảnh) ⇒ thường xong trước khi có số.
// Lời hứa mang sẵn `status/value` (cách React 19 `use` đọc lời hứa đã xong) ⇒ đã nạp thì vẽ ngay, không treo Suspense thêm một nhịp.
// Tải hỏng (mất mạng giữa chừng) ⇒ null ⇒ các màn vẽ bản cũ, không chặn em học.
import { laTrong } from '../../lib/trong-hs'

type ModTrongHs = typeof import('./TrongHs')
export type HuaTrongHs = Promise<ModTrongHs | null>
let hua: HuaTrongHs | null = null
let mod: ModTrongHs | null = null

export function napTrongHs(): HuaTrongHs | null {
  if (!laTrong()) return null
  if (!hua) {
    const h: HuaTrongHs = import('./TrongHs').catch(() => null)
    void h.then((m) => { mod = m; Object.assign(h, { status: 'fulfilled', value: m }) })
    hua = h
  }
  return hua
}

/** Mô-đun «Trong» đã nạp xong (null: chưa nạp / không bật / tải hỏng). */
export const modTrongHs = (): ModTrongHs | null => mod
