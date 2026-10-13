// Cửa NẠP KHI CẦN của phần bậc trên bảng Nhịp học em/con (nằm trong tải đầu app — giữ thật nhỏ). Khối thật: BacNhipEm.tsx (+ bảng 12 bậc, phép tính,
// màu). Nạp sẵn song song lệnh nhịp học (`napBacNhip`) ⇒ khi số về thì khối đã sẵn, không chờ thêm một lượt mạng. Nạp lỗi (mất mạng) ⇒ phần bậc ẩn,
// thẻ Hôm nay không bao giờ hỏng.
import { lazy } from 'react'
import type { KetQuaNhipHocEm } from '../../lib/nhip-hoc-em'

type KhoiBac = typeof import('./BacNhipEm')
let hua: Promise<KhoiBac | null> | null = null
const KhongGi = (_: { k: KetQuaNhipHocEm; xung?: 'em' | 'con' }) => null

/** Nạp sẵn khối bậc (một lần mỗi phiên; lỗi ⇒ lần sau thử lại). */
export function napBacNhip(): Promise<KhoiBac | null> {
  return (hua ??= import('./BacNhipEm').catch(() => ((hua = null), null)))
}

export const ChipBacNhipLuoi = lazy(async () => ({ default: (await napBacNhip())?.ChipBacNhip ?? KhongGi }))
export const ThangBacNhipLuoi = lazy(async () => ({ default: (await napBacNhip())?.ThangBacNhip ?? KhongGi }))
