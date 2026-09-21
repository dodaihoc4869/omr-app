// ĐƯỜNG CHẶNG CÓ NGÀY: chặng hôm nay tô đậm, chặng đã qua tô nhạt (đề §1.C). Bài không chia chặng ⇒ không dựng.
import { duongChang, type ChangBai } from '../../lib/btvn-da-giao'
import './btg.css'

export default function DuongChang({ chang, nowMs }: { chang: readonly ChangBai[]; nowMs: number }) {
  if (chang.length === 0) return null
  const d = duongChang(chang, nowMs)
  return (
    <ol className="btg-chang" aria-label="Đường chặng của bài">
      {d.map((c) => (
        <li key={c.so} className={`btg-chang-o btg-chang-o--${c.trangThai}`} aria-current={c.trangThai === 'nay' ? 'step' : undefined}>
          <span className="btg-chang-thanh" aria-hidden="true" />
          <span className="btg-chang-chu">{c.nhan}</span>
        </li>
      ))}
    </ol>
  )
}
