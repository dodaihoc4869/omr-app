// MỘT HÀNG «Loa» TRONG KHAY LIVE CỦA EM (Z2, thầy 11/11: «làm thêm chọn đầu ra âm thanh để lựa chọn»): chọn tiếng thầy phát ra loa / tai nghe nào.
// Chỉ hiện khi trình duyệt chọn được đầu ra (`setSinkId` — Chrome / Edge máy tính, Chrome Android bản mới) VÀ máy có từ hai đầu ra trở lên;
// iPhone, Safari ⇒ không hiện (hệ điều hành tự chọn). Lựa chọn nhớ ở máy (`ddh.live.loa`).
import { useEffect, useState, type MutableRefObject } from 'react'
import type { LiveEm } from '../../lib/live'
import './chon-loa.css'

export default function ChonLoa({ le }: { le: MutableRefObject<LiveEm | null> }) {
  const [ds, setDs] = useState<{ id: string; ten: string }[]>([])
  const [chon, setChon] = useState('')
  useEffect(() => {
    const l = le.current
    if (!l?.coLoa?.()) return
    let song = true
    const nap = (): void => { void l.dsLoa().then((d) => { if (!song) return; const c = l.loa(); setDs(d); if (c && !d.some((x) => x.id === c)) { setChon(''); void l.datLoa('') } else setChon(c) }).catch(() => undefined) }
    nap()
    try { navigator.mediaDevices?.addEventListener?.('devicechange', nap) } catch { /* trình duyệt cũ */ }
    return () => { song = false; try { navigator.mediaDevices?.removeEventListener?.('devicechange', nap) } catch { /* trình duyệt cũ */ } }
  }, [le])
  if (ds.length < 2) return null
  return (
    <label className="lv-loa">
      <span>Loa</span>
      <select aria-label="Chọn loa phát tiếng thầy" value={chon} onChange={(e) => { const id = e.target.value; setChon(id); void le.current?.datLoa(id) }}>
        {ds.map((d) => <option key={d.id || 'mac-dinh'} value={d.id}>{d.ten}</option>)}
      </select>
    </label>
  )
}
