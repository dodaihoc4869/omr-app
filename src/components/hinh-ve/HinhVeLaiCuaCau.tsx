// Các thẻ «hình của đề · vẽ lại» DƯỚI đề của một câu (thầy 03/11: «hình vẽ mới là một thẻ riêng ở phía dưới»). Mảnh nạp lười; chưa có cảnh ⇒ không vẽ gì (ảnh gốc vẫn ở chỗ cũ).
import { useHinhVe } from '../../lib/hinh-ve/tai'
import TheHinhVeLai from './TheHinhVeLai'

/** `hinh` = ảnh của câu (đếm ảnh CỦA ĐỀ). Đủ cảnh vẽ lại cho MỌI ảnh ⇒ đặt dấu `.hv-thay` (CSS ẩn ảnh gốc cùng khối, thầy 03/11: «ko hình nào được dùng hình cũ»); chưa đủ ⇒ giữ ảnh gốc để em không mất hình. */
export default function HinhVeLaiCuaCau({ qid, hinh }: { qid: string; hinh: ReadonlyArray<{ viTri?: string }> }) {
  const soAnh = hinh.filter((h) => h.viTri === 'sau_de' || h.viTri === 'cuoi_cau').length
  const hs = useHinhVe(qid)
  if (!hs?.length) return null
  return <>{hs.length >= soAnh && <i className="hv-thay" hidden />}{hs.map((h, i) => <TheHinhVeLai key={`${qid}-${i}`} hinh={h} />)}</>
}
