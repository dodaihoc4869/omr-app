// MÁY TÍNH FX4869 — MÁY EM: chỉ XEM. Vẽ lại đúng thứ thầy đang bấm (màn, phím vừa bấm nháy viền), cùng vị trí tương đối trên màn; không bắt chạm
// nên em vẫn kéo đề / chọn đáp án bình thường. Thầy ẩn hoặc im quá 13 giây ⇒ tự cất.
// `MayTinhXem` = phần VẼ (nhận sẵn gói `TinMayTinh`): dùng chung cho lúc live (`MayTinhEm`, nghe kênh lớp) và trình phát «Xem lại Live» (13/11 — gói lấy
// từ `buoi.mayTinh` theo giờ đang phát) ⇒ xem lại thấy máy tính y như máy em lúc live.
import { useEffect, useRef, useState } from 'react'
import type { KenhLop } from '../../lib/live-khoi/kieu'
import { MT_CAO, MT_RONG, MatMay } from './MatMay'
import { HET_HAN_MS, docTin, type TinMayTinh } from './dong-bo'

export function MayTinhXem({ tin }: { tin: TinMayTinh | null }) {
  const [co, setCo] = useState({ w: 0, h: 0 })
  const [sang, setSang] = useState('')
  const [caoU, setCaoU] = useState(MT_CAO) // bề cao thật của máy (đơn vị --u): màn tinh thể cao thêm khi biểu thức xuống dòng
  const khung = useRef<HTMLDivElement>(null), soCu = useRef(-1)
  const mo = !!tin?.mo, p = tin?.p ?? '', n = tin?.n ?? 0
  // thầy vừa bấm một phím (số thứ tự lần bấm đổi) ⇒ nháy viền phím đó đúng một lần
  useEffect(() => { if (mo && p && n !== soCu.current) { soCu.current = n; setSang(p) } }, [mo, p, n])
  useEffect(() => { if (!sang) return; const h = setTimeout(() => setSang(''), 320); return () => clearTimeout(h) }, [sang, n])
  useEffect(() => {
    const e = khung.current
    if (!e) return
    const do_ = () => setCo({ w: e.clientWidth, h: e.clientHeight })
    do_()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(do_) : null
    ro?.observe(e)
    return () => ro?.disconnect()
  }, [])
  const mh = mo ? tin?.mh : undefined
  // Cùng tỉ lệ bề ngang với màn thầy, nhưng không cao quá 94 % màn em và không bé tới mức không đọc nổi
  const u = Math.max(0.42, Math.min(((tin?.w ?? 0.25) * co.w) / MT_RONG, (co.h * 0.96) / caoU)), rong = MT_RONG * u, cao = caoU * u
  const kep = (v: number, nua: number, ca: number): number => (ca <= nua * 2 ? ca / 2 : Math.min(Math.max(v, nua), ca - nua))
  return (
    <div ref={khung} className="mtx-lop-em" data-may-tinh="em" aria-live="off">
      {mh && co.w > 0 ? <MatMay mh={mh} u={u} trai={kep((tin?.x ?? 0.8) * co.w, rong / 2, co.w) - rong / 2} tren={kep((tin?.y ?? 0.5) * co.h, cao / 2, co.h) - cao / 2} sang={sang} goc={(e) => { const c = e ? Math.round(e.offsetHeight / u) : 0; if (c && Math.abs(c - caoU) > 1) setCaoU(c) }} /> : null}
    </div>
  )
}

export default function MayTinhEm({ kenh }: { kenh: KenhLop }) {
  const [tin, setTin] = useState<TinMayTinh | null>(null)
  const luc = useRef(0)
  useEffect(() => kenh.nghe('mt', (t) => {
    const d = docTin(t.x)
    if (!d || t.s !== 'gv') return
    luc.current = Date.now()
    setTin(d.mo ? d : null)
  }), [kenh])
  useEffect(() => { const h = setInterval(() => { if (luc.current && Date.now() - luc.current > HET_HAN_MS) { luc.current = 0; setTin(null) } }, 3000); return () => clearInterval(h) }, [])
  return <MayTinhXem tin={tin} />
}
