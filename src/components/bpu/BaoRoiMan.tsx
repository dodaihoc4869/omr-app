// CẢNH BÁO «RỜI MÀN HÌNH» trên màn thầy. Thầy 12/11 tối: «cảnh báo này chỉ hiện 2 giây rồi ẩn xuống dưới nhấp nháy, khi ẩn xuống bỏ hiệu ứng nhấp nháy
// xung quanh màn hình» — thẻ đỏ to + viền đỏ quanh màn chỉ còn 2 GIÂY mỗi khi có em MỚI rời; sau đó thu thành viên nhỏ nhấp nháy ở mép dưới (không che
// bảng thầy đang viết, không viền). Em quay lại hết ⇒ mất. (Bản 09/11 phủ to suốt lúc em còn ở ngoài.)
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'

/** Thẻ to hiện bao lâu rồi thu xuống đáy. */
export const BAO_TO_MS = 2000
export function BaoRoiMan({ sbd, ten }: { /** số báo danh các em đang ở ngoài */ sbd: string[]; /** tên hiện tương ứng (đã ẩn danh nếu thầy bật che tên) */ ten: string[] }) {
  const khoa = sbd.join('|')
  const [tt, setTt] = useState({ khoa, to: true })
  if (tt.khoa !== khoa) { const cu = tt.khoa.split('|'); setTt({ khoa, to: tt.to || sbd.some((s) => !cu.includes(s)) }) }
  useEffect(() => {
    if (!tt.to) return
    const h = setTimeout(() => setTt((c) => ({ ...c, to: false })), BAO_TO_MS)
    return () => clearTimeout(h)
  }, [tt.to, khoa])
  if (!sbd.length) return null
  const chu = ten.join(' · ')
  return createPortal(
    <div className={`bpu-bao-chay${tt.to ? '' : ' gon'}`} role="alert" style={MAU_CHIEU}>
      {tt.to ? <div className="bpu-bao-chay-the"><span className="coi" aria-hidden="true" /><b>Rời màn hình</b><strong>{chu}</strong><span>Quay lại Bình Phản Ứng ngay</span></div>
        : <div className="bpu-bao-chay-gon"><i aria-hidden="true" /><b>Rời màn hình</b><span>{chu}</span></div>}
    </div>,
    document.body,
  )
}
