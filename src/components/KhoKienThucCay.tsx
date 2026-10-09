// Cây kho kiến thức chỉ lọc các nguồn đã tải; không đổi nội dung hoặc chốt đáp án.
import { useMemo } from 'react'
import type { TeacherExamSource } from '../data/examContent'
import { dungCay, tongCau, type Nut } from '../lib/cay-chon-de'
export default function KhoKienThucCay({ sources, chon, onChon }: { sources: TeacherExamSource[]; chon: readonly string[]; onChon: (ma: string[]) => void }) {
  const cay = useMemo(() => dungCay(sources), [sources])
  const nut = (n: Nut) => n.con.length ? <details key={n.khoa} open={n.tang === 'khoi'}><summary>{n.nhan} <small>{tongCau(n.soCau)} câu</small></summary><button type="button" aria-pressed={chon.length > 0 && n.laMa.length === chon.length && n.laMa.every(m => chon.includes(m))} onClick={() => onChon(n.laMa)}>Xem {n.nhan}</button><div>{n.con.map(nut)}</div></details> : <button type="button" key={n.khoa} aria-pressed={!!n.maDe && chon.includes(n.maDe)} onClick={() => onChon(n.laMa)}>{n.nhan}<small>{tongCau(n.soCau)} câu</small></button>
  return <nav className="gv-kho-cay" aria-label="Khối, bài và dạng trong kho"><button type="button" aria-pressed={chon.length === 0} onClick={() => onChon([])}>Xem toàn bộ kho</button>{cay.map(nut)}</nav>
}
