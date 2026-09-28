// CÔNG TẮC BI-A PHẢN ỨNG ở màn Cài đặt (đặc tả Bi-a mục 9.2) → `/gv/chien-dich` `bia-co-doc` / `bia-co-luu` (khoá riêng `cau_hinh.bi_a`).
// Ba lựa chọn như Game Hóa 2.0: Tắt · Bật cả trung tâm · Bật theo lớp. Bi-a chỉ hiện với em đang ở Game Hóa 2.0 (cửa thứ ba trên Sảnh Bát Linh).
import { useEffect, useState } from 'react'
import { TheNoiDung } from '../DesignSystem'
import { useAppStore } from '../../store/appStore'
import { goiChienDich, type CoHoa2 } from './api'
import './chien-dich.css'

type CheDo = 'tat' | 'ca' | 'lop'
const cheDoCua = (co: CoHoa2 | null): CheDo => (!co?.bat ? 'tat' : co.lop.length ? 'lop' : 'ca')
const tachLop = (s: string): string[] => [...new Set(s.split(/[,;\s]+/).map((x) => x.trim()).filter(Boolean))]
const docCoTu = (x: unknown): CoHoa2 => {
  const co = (x && typeof x === 'object' ? x : {}) as Partial<CoHoa2>
  return { bat: co.bat === true, lop: Array.isArray(co.lop) ? co.lop.map(String) : [], sbd: Array.isArray(co.sbd) ? co.sbd.map(String) : [] }
}

export default function CongTacBia() {
  const showToast = useAppStore((s) => s.showToast)
  const [co, setCo] = useState<CoHoa2 | null>(null)
  const [cheDo, setCheDo] = useState<CheDo>('tat')
  const [lop, setLop] = useState('')
  const [dangLuu, setDangLuu] = useState(false)
  const [loi, setLoi] = useState('')
  useEffect(() => {
    let song = true
    void goiChienDich<{ co?: unknown }>('bia-co-doc').then((r) => {
      if (!song) return
      if (!r.ok) { setLoi(r.chu); return }
      const c = docCoTu(r.du.co); setCo(c); setCheDo(cheDoCua(c)); setLop(c.lop.join(', '))
    })
    return () => { song = false }
  }, [])
  const moi: CoHoa2 = cheDo === 'tat' ? { bat: false, lop: [], sbd: [] } : cheDo === 'ca' ? { bat: true, lop: [], sbd: [] } : { bat: true, lop: tachLop(lop), sbd: [] }
  const thieuLop = cheDo === 'lop' && moi.lop.length === 0
  const hienTai: CoHoa2 = co?.bat ? { bat: true, lop: co.lop, sbd: co.sbd } : { bat: false, lop: [], sbd: [] }
  const khongDoi = JSON.stringify(moi) === JSON.stringify(hienTai)
  const luu = async () => {
    setDangLuu(true)
    const r = await goiChienDich<{ co?: unknown }>('bia-co-luu', { bat: moi.bat, lop: moi.lop, sbd: moi.sbd })
    setDangLuu(false)
    if (!r.ok) { setLoi(r.chu); return }
    setLoi(''); setCo(docCoTu(r.du.co ?? moi))
    showToast(moi.bat ? 'Đã bật Bi-a Phản Ứng' : 'Đã tắt Bi-a Phản Ứng', 'success')
  }
  return (
    <TheNoiDung>
      <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k2)' }}>Bi-a Phản Ứng</h2>
      <p style={{ marginBottom: 'var(--k3)', fontSize: 'var(--cx-1)', color: 'var(--nhat)' }}>
        Cửa thứ ba trên Sảnh Bát Linh: mỗi viên bi là một câu trong kế hoạch hôm nay của em, tối đa 40% phần Đoàn và 40% phần Đảo. Đang:{' '}
        <b data-trang-thai-bia>{!co ? 'đang đọc…' : !co.bat ? 'tắt' : co.lop.length ? `bật cho lớp ${co.lop.join(', ')}` : co.sbd.length ? `bật cho ${co.sbd.length} em` : 'bật cả trung tâm'}</b>.
      </p>
      <div role="radiogroup" aria-label="Bi-a Phản Ứng" className="cd-cong-tac">
        {([['tat', 'Tắt'], ['ca', 'Bật cả trung tâm'], ['lop', 'Bật theo lớp']] as const).map(([v, ten]) => (
          <button key={v} type="button" role="radio" aria-checked={cheDo === v} onClick={() => setCheDo(v)} className={`m3-nut-chu${cheDo === v ? ' m3-nut-tonal' : ' m3-nut-vien'}`}>{ten}</button>
        ))}
      </div>
      {cheDo === 'lop' && (
        <label className="cd-truong" style={{ marginTop: 'var(--k3)' }}>
          Các lớp bật (cách nhau bằng dấu phẩy)
          <input type="text" value={lop} placeholder="12A1, 12A2" onChange={(e) => setLop(e.target.value)} />
          {thieuLop && <small>Nhập ít nhất một lớp.</small>}
        </label>
      )}
      {loi && <p className="cd-loi" role="alert" style={{ marginTop: 'var(--k2)' }}>{loi}</p>}
      <div className="cd-hang-nut" style={{ marginTop: 'var(--k3)' }}>
        <button type="button" className="m3-nut-chinh" disabled={dangLuu || khongDoi || thieuLop || !co} onClick={() => void luu()}>{dangLuu ? 'Đang lưu…' : moi.bat ? 'Lưu và bật Bi-a Phản Ứng' : 'Lưu và tắt Bi-a Phản Ứng'}</button>
      </div>
    </TheNoiDung>
  )
}
