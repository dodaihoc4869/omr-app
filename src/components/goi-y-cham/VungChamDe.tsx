// «CHẠM ĐỂ HIỂU ĐỀ» — VỎ NHẸ bọc thân đề của màn làm chặng (thầy chốt build 26/10; bản vẽ docs/ban-ve-doc-de-2610; dữ liệu src/lib/goi-y-cham/kieu.ts).
// Hợp đồng với màn Duo (Boss, khe trên nhánh claude/duo-app-2610): `<VungChamDe q children onHoTro nutBatDau />`.
//   - `children` = thân đề của màn: vẽ NGUYÊN như màn đưa; ruột chỉ bọc các NÚT CHỮ bên trong (sub/sup, ảnh, công thức giữ nguyên).
//   - `onHoTro`  = gọi khi em mở «Bắt đầu từ đâu?» lần đầu ở câu này (màn tự ghi assisted). Chạm tra nghĩa một chữ KHÔNG gọi.
//   - `nutBatDau(nut)` = màn đặt nút «Bắt đầu từ đâu?» vào hàng nút đáy (không truyền ⇒ nút nằm ngay trên đề).
//   - Mở gợi ý ở khổ ≥ 640px ⇒ gợi ý thành CỘT PHẢI cố định; <html> mang `data-gyc-cot-phai` và biến `--gyc-cot-phai` (320/400px):
//     khung màn thêm `padding-right: var(--gyc-cot-phai, 0px)` để đề + phương án nằm gọn cột trái.
//   - Tắt hẳn (ca thi, KTCN, BTVN chấm điểm): màn KHÔNG bọc, hoặc truyền `tat` ⇒ trả nguyên `children`.
// Vỏ này chỉ có khung + nút (vài trăm byte). Phần nặng (bọc chữ, từ điển của làn A, thẻ giải nghĩa, gợi ý 3 tầng, CSS) nạp LƯỜI
// (ruot-cham.tsx, mảnh `goi-y-cham` ngoài precache); nạp hỏng (mất mạng lần đầu) ⇒ đề trơn như cũ, nút gợi ý vẫn dùng được khi có mạng lại.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Lightbulb } from 'lucide-react'
import type { GoiYTraVe } from '../../lib/goi-y-cham/kieu'
import type { TuDien } from './tu-dien'
import type { CauCham } from './ruot-cham'
import './vung-cham-de.css'

type RuotMod = typeof import('./ruot-cham')

export type VungChamDeProps = {
  q: CauCham & { text?: string }
  children: ReactNode
  onHoTro?: () => void
  nutBatDau?: (nut: ReactNode) => ReactNode
  /** Tải bản gợi ý soạn sẵn qua `/hs/goi-y-so-do` (token của em; kèm phiên chặng thì máy chủ tự ghi «có trợ giúp»). Thiếu token ⇒ chỉ có gợi ý tự sinh từ đề. */
  token?: string
  phien?: string
  /** Thay cách tải bản gợi ý (trang thử / test). */
  taiGoiY?: (qid: string) => Promise<GoiYTraVe | null>
  /** Thay từ điển của làn A (trang thử / test). */
  tuDien?: TuDien
  /** true ⇒ tắt hết (đề trơn như cũ). */
  tat?: boolean
}

export function VungChamDe({ q, children, onHoTro, nutBatDau, token, phien, taiGoiY, tuDien, tat }: VungChamDeProps) {
  const [ruot, setRuot] = useState<RuotMod | null>(null)
  const [mo, setMo] = useState(false)
  const daBao = useRef('')
  const goc = useRef<HTMLDivElement>(null), tren = useRef<HTMLDivElement>(null), duoi = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    if (tat) return
    let huy = false
    import('./ruot-cham').then((m) => { if (!huy) setRuot(m) }, () => { /* mất mạng ⇒ đề trơn */ })
    return () => { huy = true }
  }, [tat])
  const [qidMo, setQidMo] = useState(q.qid)
  if (qidMo !== q.qid) { setQidMo(q.qid); setMo(false) } // sang câu mới ⇒ gợi ý đóng
  if (tat) return <>{children}</>
  const bam = () => {
    if (!mo && daBao.current !== q.qid) { daBao.current = q.qid; onHoTro?.() }
    setMo((v) => !v)
  }
  const nut = (
    <button type="button" className="gyc-nut-bat-dau" aria-expanded={mo} aria-controls={`${id}-gy`} onClick={bam} data-mo={mo || undefined}>
      <Lightbulb size={18} aria-hidden="true" />{mo ? 'Đang xem gợi ý' : 'Bắt đầu từ đâu?'}
    </button>
  )
  return (
    <div className="gyc">
      <div ref={tren} className="gyc-khe" />
      {!nutBatDau && <div className="gyc-hang-nut">{nut}</div>}
      {/* key = qid: câu mới ⇒ thân đề dựng lại từ đầu (ruột bọc lại), không bao giờ vá lên DOM đã bọc của câu cũ */}
      <div key={`de:${q.qid}`} ref={goc} className="gyc-de">{children}</div>
      <div ref={duoi} className="gyc-khe" />
      {nutBatDau?.(nut)}
      {ruot && (
        <ruot.RuotCham key={`ruot:${q.qid}`} q={q} goc={goc} tren={tren} duoi={duoi} mo={mo} dong={() => setMo(false)} idGoiY={`${id}-gy`} tuDien={tuDien} taiGoiY={taiGoiY} token={token} phien={phien} />
      )}
    </div>
  )
}

export default VungChamDe
