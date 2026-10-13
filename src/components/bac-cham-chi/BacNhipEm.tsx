// KHỐI NẠP KHI CẦN cho bảng Nhịp học của em (app học sinh) và của con (app phụ huynh): chip bậc cạnh tên nhóm + thang 12 bậc. Tách khỏi tải đầu app
// (luật thầy "sửa xong phải nhanh hơn") — nạp qua `nap.ts`. Bậc = `bacTheoSanh` (đúng phép máy chủ trên dãy ngày đã theo số Sảnh) ⇒ luôn khớp nhóm đang hiện.
import type { KetQuaNhipHocEm } from '../../lib/nhip-hoc-em'
// 13/10 đợt 19: chip bậc là NÚT (NutBac, ChipBac.tsx) mở tấm đủ 12 bậc (nạp khi bấm); `xung` 'con' ở app phụ huynh ("Con đang ở đây").
import { bacTheoSanh } from './bac'
import { NutBac } from './ChipBac'
import type { XungBac } from './bac'
import ThangBac from './ThangBac'

export function ChipBacNhip({ k, xung }: { k: KetQuaNhipHocEm; xung?: XungBac }) {
  const b = bacTheoSanh(k)
  return b ? <NutBac kq={b} xung={xung} /> : null
}

export function ThangBacNhip({ k }: { k: KetQuaNhipHocEm }) {
  const b = bacTheoSanh(k)
  return b ? <ThangBac kq={b} /> : null
}
