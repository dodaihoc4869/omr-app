// Các thẻ «hình của đề · vẽ lại» DƯỚI đề của một câu (thầy 03/11: «hình vẽ mới là một thẻ riêng ở phía dưới»). Mảnh nạp lười; chưa có cảnh ⇒ không vẽ gì (ảnh gốc vẫn ở chỗ cũ).
import { useHinhVe } from '../../lib/hinh-ve/tai'
import TheHinhVeLai from './TheHinhVeLai'

export default function HinhVeLaiCuaCau({ qid }: { qid: string }) {
  const hs = useHinhVe(qid)
  if (!hs?.length) return null
  return <>{hs.map((h, i) => <TheHinhVeLai key={`${qid}-${i}`} hinh={h} />)}</>
}
