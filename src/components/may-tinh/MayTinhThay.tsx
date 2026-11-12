// MÁY TÍNH FX4869 — MÁY THẦY: nổi trên màn chiếu, nắm thanh trên cùng để kéo đi khắp màn, bấm phím được; mọi thay đổi gửi sang máy em.
// Trạng thái (phép tính dở, bộ nhớ, vị trí) giữ ở biến mô-đun ⇒ ẩn đi hiện lại vẫn nguyên.
import { useEffect, useRef, useState, type PointerEvent as SuKienTro } from 'react'
import { createPortal } from 'react-dom'
import type { KenhLop } from '../../lib/live-khoi/kieu'
import { bam, manHinh, taoMay, type TrangThai } from '../../lib/may-tinh/may'
import { MT_CAO, MT_RONG, MatMay } from './MatMay'
import { NHAC_MS, type TinMayTinh } from './dong-bo'

let nho: { tt: TrangThai; x: number; y: number } | null = null
const kep = (v: number, tu: number, den: number): number => Math.min(Math.max(v, tu), Math.max(tu, den))
const coMan = (): { w: number; h: number; u: number } => { const w = window.innerWidth, h = window.innerHeight; return { w, h, u: Math.max(0.5, Math.min(2.2, (h * 0.7) / MT_CAO, (w * 0.26) / MT_RONG)) } }

export default function MayTinhThay({ kenh }: { kenh: KenhLop }) {
  const [man, setMan] = useState(coMan)
  const [tt, setTt] = useState<TrangThai>(() => nho?.tt ?? taoMay())
  const [vt, setVt] = useState(() => ({ x: nho?.x ?? -1, y: nho?.y ?? -1 }))
  const [sang, setSang] = useState<{ p: string; n: number }>({ p: '', n: 0 })
  const [cao, setCao] = useState(MT_CAO)
  const keo = useRef<{ id: number; dx: number; dy: number } | null>(null)
  useEffect(() => { const f = () => setMan(coMan()); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  const rong = MT_RONG * man.u, caoPx = cao * man.u
  // tâm máy (phần của màn); lần đầu: sát mép phải, ngay trên thanh đáy của tờ (không che nút máy tính / ống nghiệm / nút bốn ô)
  const cx = kep(vt.x < 0 ? 1 - (rong / 2 + 26) / man.w : vt.x, rong / 2 / man.w, 1 - rong / 2 / man.w), cy = kep(vt.y < 0 ? 1 - (caoPx / 2 + Math.max(64, man.h * 0.095)) / man.h : vt.y, caoPx / 2 / man.h, 1 - caoPx / 2 / man.h)
  useEffect(() => { nho = { tt, x: cx, y: cy } }, [tt, cx, cy])
  useEffect(() => { if (!sang.p) return; const h = setTimeout(() => setSang((s) => ({ ...s, p: '' })), 260); return () => clearTimeout(h) }, [sang.n]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── đồng bộ sang máy em: gửi khi đổi (dồn 60 ms khi đang kéo), nhắc lại mỗi 4 giây cho em vào muộn; ẩn ⇒ báo đóng ──
  const mh = manHinh(tt)
  const goi = useRef<TinMayTinh>({ mo: true })
  useEffect(() => { goi.current = { mo: true, x: cx, y: cy, w: rong / man.w, mh, p: sang.p, n: sang.n } })
  const hen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    if (hen.current !== undefined) return
    hen.current = setTimeout(() => { hen.current = undefined; kenh.gui('mt', goi.current) }, 60)
  }, [kenh, tt, cx, cy, man.u, sang.n])
  useEffect(() => {
    const nhac = setInterval(() => kenh.gui('mt', goi.current), NHAC_MS)
    return () => { clearInterval(nhac); clearTimeout(hen.current); hen.current = undefined; kenh.gui('mt', { mo: false } satisfies TinMayTinh) }
  }, [kenh])

  const nhan = (ma: string): void => { setTt((t) => bam(t, ma)); setSang((s) => ({ p: ma, n: s.n + 1 })) }
  const thanh = {
    onPointerDown: (e: SuKienTro<HTMLDivElement>) => { keo.current = { id: e.pointerId, dx: e.clientX - cx * man.w, dy: e.clientY - cy * man.h }; try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* trình duyệt cũ */ } e.preventDefault() },
    onPointerMove: (e: SuKienTro<HTMLDivElement>) => { const k = keo.current; if (k && k.id === e.pointerId) setVt({ x: (e.clientX - k.dx) / man.w, y: (e.clientY - k.dy) / man.h }) },
    onPointerUp: (e: SuKienTro<HTMLDivElement>) => { if (keo.current?.id === e.pointerId) keo.current = null },
    onPointerCancel: (e: SuKienTro<HTMLDivElement>) => { if (keo.current?.id === e.pointerId) keo.current = null },
  }
  return createPortal(
    <div className="mtx-lop" data-may-tinh="thay">
      <MatMay mh={mh} u={man.u} trai={cx * man.w - rong / 2} tren={cy * man.h - caoPx / 2} sang={sang.p} onPhim={nhan} keo={thanh} goc={(e) => { const c = e ? Math.round(e.offsetHeight / man.u) : 0; if (c && Math.abs(c - cao) > 1) setCao(c) }} />
    </div>,
    document.body,
  )
}
