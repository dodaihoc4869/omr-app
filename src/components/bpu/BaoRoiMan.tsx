// CẢNH BÁO «RỜI MÀN HÌNH» trên màn thầy — bản TINH TẾ, GỌN (thầy 12/11 tối, lần 2: «bỏ luôn cảnh báo to đùng đó, hiện cảnh báo tinh tế gọn gàng»):
// KHÔNG còn thẻ đỏ phủ giữa màn, KHÔNG viền đỏ nháy quanh màn. Chỉ một viên kính nhỏ ở mép dưới: chấm đỏ đập nhẹ + «Rời màn hình» + tên các em đang
// ở ngoài; có em MỚI rời ⇒ viên nảy nhẹ một lần. Em quay lại hết ⇒ mất. Không che bảng thầy đang viết, không bắt chạm.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'

export function BaoRoiMan({ sbd, ten }: { /** số báo danh các em đang ở ngoài */ sbd: string[]; /** tên hiện tương ứng (đã ẩn danh nếu thầy bật che tên) */ ten: string[] }) {
  const khoa = sbd.join('|')
  // `lan` tăng mỗi khi có em MỚI rời ⇒ đổi `key` ⇒ hiệu ứng nảy chạy lại đúng một lần (em quay lại bớt thì không nảy)
  const [tt, setTt] = useState({ khoa, lan: 0 })
  if (tt.khoa !== khoa) { const cu = tt.khoa.split('|'); setTt({ khoa, lan: tt.lan + (sbd.some((s) => !cu.includes(s)) ? 1 : 0) }) }
  if (!sbd.length) return null
  return createPortal(
    <div className="bpu-bao-chay nhe" role="alert" style={MAU_CHIEU}>
      <div key={tt.lan} className="bpu-roi-gon"><i aria-hidden="true" /><b>Rời màn hình</b><span>{ten.join(' · ')}</span></div>
    </div>,
    document.body,
  )
}
