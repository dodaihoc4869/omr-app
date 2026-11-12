// HỎI NHANH «Hiểu chưa?» — MÁY EM (bản vẽ 38–39): thầy bấm / ⇒ hai phím to 1 «Hiểu» · 2 «Chưa hiểu» hiện ở CHÍNH GIỮA phần bảng 1/3 bên phải.
// Em chạm (hoặc bấm 1 / 2 trên bàn phím) ⇒ gửi thầy, hai phím TỰ ẨN NGAY (thầy: «học sinh chọn xong tự ẩn luôn»), thoáng dấu «Đã gửi thầy».
// Thầy đóng, hoặc máy thầy im quá 13 giây ⇒ tự cất. Câu trả lời chỉ tới máy thầy.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { KenhLop } from '../../lib/live-khoi/kieu'
import { HET_HAN_MS, docHoi, type TinTraLoiHieu } from './hoi-hieu'
import './hoi-hieu.css'

export default function HoiHieuEm({ kenh }: { kenh: KenhLop }) {
  const [hoi, setHoi] = useState<number | null>(null) // số lượt hỏi đang mở mà em CHƯA trả lời
  const [daGui, setDaGui] = useState(0)
  const xong = useRef(-1), han = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    const go = kenh.nghe('hieu', (t) => {
      const d = docHoi(t.x)
      if (!d || t.s !== 'gv') return
      clearTimeout(han.current)
      if (!d.mo || d.n === xong.current) { setHoi(null); return }
      setHoi(d.n)
      han.current = setTimeout(() => setHoi(null), HET_HAN_MS)
    })
    return () => { go(); clearTimeout(han.current) }
  }, [kenh])
  const tra = useCallback((v: 1 | 2) => {
    if (hoi == null) return
    xong.current = hoi
    kenh.gui('hieu', { v, n: hoi } satisfies TinTraLoiHieu)
    clearTimeout(han.current); setHoi(null); setDaGui((c) => c + 1)
  }, [hoi, kenh])
  // máy tính: bấm phím 1 / 2 (không ăn phím khi em đang gõ tin nhắn)
  useEffect(() => {
    if (hoi == null) return
    const f = (e: KeyboardEvent) => {
      if ((e.key !== '1' && e.key !== '2') || e.ctrlKey || e.metaKey || e.altKey || (e.target as HTMLElement | null)?.closest?.('input,textarea,select,[contenteditable]')) return
      e.preventDefault(); tra(e.key === '1' ? 1 : 2)
    }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [hoi, tra])
  useEffect(() => { if (!daGui) return; const h = setTimeout(() => setDaGui(0), 1150); return () => clearTimeout(h) }, [daGui])
  if (hoi == null && !daGui) return null
  return (
    <div className="hh-em" data-hoi-hieu="em">
      {hoi != null ? (
        <div className="hh-the" role="dialog" aria-label="Em hiểu chưa?">
          <h3>Em hiểu chưa?</h3><p>Thầy đang hỏi cả lớp</p>
          <div className="hh-hai">
            <button type="button" className="hh-nut" onClick={() => tra(1)}><b>1</b><span>Hiểu</span></button>
            <button type="button" className="hh-nut k2" onClick={() => tra(2)}><b>2</b><span>Chưa hiểu</span></button>
          </div>
          <small>Chạm một phím · máy tính thì bấm 1 hoặc 2</small>
        </div>
      ) : <div key={daGui} className="hh-da" role="status"><i aria-hidden="true">✓</i>Đã gửi thầy</div>}
    </div>
  )
}
