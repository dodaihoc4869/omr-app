// KHỐI NẠP KHI CẦN cho bảng Nhịp học của em (app học sinh) và của con (app phụ huynh): chip bậc cạnh tên nhóm + thang 12 bậc. Tách khỏi tải đầu app
// (luật thầy "sửa xong phải nhanh hơn") — nạp qua `nap.ts`. Bậc = `bacTheoSanh` (đúng phép máy chủ trên dãy ngày đã theo số Sảnh) ⇒ luôn khớp nhóm đang hiện.
import type { KetQuaNhipHocEm } from '../../lib/nhip-hoc-em'
import { bacTheoSanh } from './bac'
import ChipBac from './ChipBac'
import ThangBac from './ThangBac'

export function ChipBacNhip({ k }: { k: KetQuaNhipHocEm }) {
  const b = bacTheoSanh(k)
  return b ? <ChipBac bac={b.bac} /> : null
}

export function ThangBacNhip({ k }: { k: KetQuaNhipHocEm }) {
  const b = bacTheoSanh(k)
  return b ? <ThangBac kq={b} /> : null
}
