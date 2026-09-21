// CỬA HÀNG PHỤ KIỆN — vỏ NỐI THẬT cho Đảo (B4 + B5 phía máy em): ManShop + năm lệnh máy chủ thật + thú mặc đồ thật (`ThuMacDo` của Code 4).
// Nằm NGOÀI thư mục shop/ có chủ ý: màn cửa hàng KHÔNG import lớp mặc đồ (chỉ có điểm cắm `veThu`, test khoá) — vỏ này là chỗ duy nhất nối hai bên.
// Nạp LƯỜI từ DaoThanThu (chỉ tải khi em bấm Cửa hàng, và chỉ có nút khi máy chủ báo `shopBat`). Cờ tắt ⇒ không có cửa vào nên tệp này không bao giờ chạy.
import { useMemo } from 'react'
import { ThuMacDo } from '../phu-kien/ThuMacDo'
import { layDiaChiMayChu } from '../../../lib/dia-chi-may-chu'
import ManShop from '../shop/ManShop'
import { taoShopApiThat } from '../shop/may-chu-that'
import type { VeThu } from '../shop/kieu'

export interface ManShopThatProps {
  token: string
  /** Chỉ số loài của thú CỦA EM + cấp (đúng thứ tự PETS của game). */
  pet: number
  cap: number
  tenThu?: string
  onDong: () => void
}

const veThuThat: VeThu = (o) => <ThuMacDo pet={o.pet} cap={o.cap} size={o.size} dangMac={o.dangMac} ten={o.ten} nhan={o.nhan} tinh={o.tinh} />

export default function ManShopThat({ token, pet, cap, tenThu, onDong }: ManShopThatProps) {
  const api = useMemo(() => taoShopApiThat({ token, layDiaChi: () => layDiaChiMayChu('') }), [token])
  return <ManShop api={api} pet={pet} cap={cap} tenThu={tenThu} onDong={onDong} veThu={veThuThat} />
}
