import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { apiCoChua, apiDanhSachChua } from '../../lib/chua-cau-sai-api'
import './hoc-tap.css'
const ManChua = lazy(() => import('../chua-cau-sai/ManChuaCauSai'))
const NHAN: Record<string, string> = { can_thay: 'Cần thầy chữa', thieu_hoc_lieu: 'Chờ bổ sung học liệu', cho_gap_lai_2: 'Chờ kiểm tra lại', da_tu_sua: 'Đã tự sửa', tam_khoa: 'Tạm giữ', cau_thay_doi: 'Nội dung đang cập nhật' }
export default function ManTuChua({ token, qid, onVe }: { token: string; qid?: string; onVe: () => void }) {
  const [chon, setChon] = useState(qid || ''), [ds, setDs] = useState<Awaited<ReturnType<typeof apiDanhSachChua>>>([]), [tai, setTai] = useState(true), [loi, setLoi] = useState(''), [bat, setBat] = useState(false)
  useEffect(() => { let huy = false; void apiCoChua(token).then(async co => { if (!huy) setBat(co); if (co) { const d = await apiDanhSachChua(token); if (!huy) setDs(d) } }).catch(() => { if (!huy) setLoi('Chưa tải được danh sách tự chữa. Em quay lại và thử sau nhé.') }).finally(() => { if (!huy) setTai(false) }); return () => { huy = true } }, [token])
  if (chon && bat) return <Suspense fallback={<div className="ht-the" role="status">Đang mở bước tự chữa…</div>}><ManChua token={token} qid={chon} onVe={() => qid ? onVe() : setChon('')} /></Suspense>
  return <div className="ht-app"><header className="ht-thanh"><button className="ht-nut-phu" onClick={onVe}><ArrowLeft size={18} aria-hidden="true" />Hôm nay</button><strong>Tự chữa lỗi</strong></header><main className="ht-noi-dung"><h1>Hiểu lại đúng bước đang mắc</h1><p>Giữ phần đã hiểu, thử lại bằng câu mới và kiểm tra khả năng tự làm.</p>{tai ? <p role="status">Đang tải…</p> : loi ? <p role="alert">{loi}</p> : !bat ? <div className="ht-the">Vòng tự chữa chưa được mở cho em. Em vẫn có thể xem lời giải trong Câu đã làm và nhận hỗ trợ từ thầy.</div> : !ds.length ? <div className="ht-the">Hiện chưa có câu trong danh sách tự chữa.</div> : <section className="ht-the">{ds.map((c, i) => <button className="ht-dong" key={c.qid} onClick={() => setChon(c.qid)}><span><strong>Câu cần xem lại {i + 1}</strong><small>{NHAN[c.trangThai] || 'Tiếp tục tự chữa'}</small></span><ChevronRight size={20} aria-hidden="true" /></button>)}</section>}</main></div>
}
