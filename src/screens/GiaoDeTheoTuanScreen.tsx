// MÀN THẦY "GIAO ĐỀ THEO TUẦN" (bước 4, 26/09/2026).
// Chọn khối → lớp → tick em → tick nguồn đề → hạn chót → bật. Lưu qua `/gv/kho-de-giao` vào `cau_hinh.kho_de_giao`.
// Mọi em được tick CHỈ làm câu trong đề đã tick (không rút ngoài kho) — luật đã cắm ở máy chủ.
import { useCallback, useEffect, useMemo, useState } from 'react'
import { TheNoiDung } from '../components/DesignSystem'
import { useAppStore } from '../store/appStore'
import { goiLenh } from '../lib/goi-lenh-thay'

interface Em { sbd: string; hoTen: string; lop: string; tenLop: string }
interface De { maDe: string; ten: string; lop: string; soCau: number }
interface Cfg { bat?: boolean; khoi?: number | null; lop?: string; sbd?: string[]; maDe?: string[]; giaoLuc?: string; deadline?: string }
const KHOI: readonly number[] = [10, 11, 12]
const khoiCua = (lop: string): number | null => { const m = /^(10|11|12)/.exec(lop.trim()); return m ? Number(m[1]) : null }

/** Đảo một phần tử trong tập đã chọn (bất biến). */
const lat = (s: ReadonlySet<string>, id: string): Set<string> => { const m = new Set(s); if (m.has(id)) m.delete(id); else m.add(id); return m }

/** Một ô tick dùng chung cho danh sách em / đề. */
function OTick({ da, nhan, phu, onDoi }: { da: boolean; nhan: string; phu: string; onDoi: () => void }) {
  return (
    <label className="m3-nut-chu m3-nut-vien" style={{ justifyContent: 'flex-start', gap: 'var(--k2)' }}>
      <input type="checkbox" checked={da} onChange={onDoi} />
      <span style={{ fontWeight: 600 }}>{nhan}</span>
      {phu ? <span style={{ color: 'var(--nhat)', fontSize: 'var(--cx-1)' }}>{phu}</span> : null}
    </label>
  )
}

export default function GiaoDeTheoTuanScreen() {
  const showToast = useAppStore((s) => s.showToast)
  const [em, setEm] = useState<Em[]>([])
  const [de, setDe] = useState<De[]>([])
  const [khoi, setKhoi] = useState<number>(12)
  const [lop, setLop] = useState('')
  const [chonEm, setChonEm] = useState<Set<string>>(new Set())
  const [chonDe, setChonDe] = useState<Set<string>>(new Set())
  const [bat, setBat] = useState(true)
  const [han, setHan] = useState('')
  const [giaoLuc, setGiaoLuc] = useState('')
  const [dangLuu, setDangLuu] = useState(false)

  const nap = useCallback(async () => {
    const r = await goiLenh('/gv/kho-de-giao', { action: 'doc' }, 'Máy chủ chưa có lệnh giao đề theo tuần.')
    if (!r.ok) { showToast(r.chu); return }
    setEm(Array.isArray(r.du.em) ? (r.du.em as Em[]) : [])
    setDe(Array.isArray(r.du.de) ? (r.du.de as De[]) : [])
    const cfg = r.du.cfg as Cfg | null
    if (cfg) {
      setBat(cfg.bat !== false)
      if (typeof cfg.khoi === 'number') setKhoi(cfg.khoi)
      if (typeof cfg.lop === 'string' && cfg.lop && !cfg.lop.startsWith('Khối')) setLop(cfg.lop)
      setChonEm(new Set(cfg.sbd ?? []))
      setChonDe(new Set(cfg.maDe ?? []))
      setGiaoLuc(typeof cfg.giaoLuc === 'string' ? cfg.giaoLuc : '')
      setHan(typeof cfg.deadline === 'string' ? cfg.deadline.slice(0, 10) : '')
    }
  }, [showToast])
  useEffect(() => { void nap() }, [nap])
  const emTheoKhoi = useMemo(() => em.filter((e) => khoiCua(e.lop) === khoi), [em, khoi])
  const dsLop = useMemo(() => [...new Set(emTheoKhoi.map((e) => e.tenLop).filter((x) => x !== ''))], [emTheoKhoi])
  const emThay = useMemo(() => (lop ? emTheoKhoi.filter((e) => e.tenLop === lop) : emTheoKhoi), [emTheoKhoi, lop])
  const deThay = useMemo(() => de.filter((d) => khoiCua(d.lop) === khoi), [de, khoi])

  const luu = async () => {
    setDangLuu(true)
    const gl = giaoLuc || new Date().toISOString()
    const cfg = { bat, khoi, lop: lop || `Khối ${khoi}`, sbd: [...chonEm], maDe: [...chonDe], giaoLuc: gl, deadline: han ? `${han}T23:59:59+07:00` : '' }
    const r = await goiLenh('/gv/kho-de-giao', { action: 'luu', cfg }, 'Máy chủ chưa có lệnh giao đề theo tuần.')
    setDangLuu(false)
    if (!r.ok) { showToast(r.chu); return }
    setGiaoLuc(gl)
    showToast('Đã lưu kho đề giao theo tuần')
  }

  return (
    <div className="gv-page min-h-screen pb-28 px-3 sm:px-4 pt-4 flex flex-col" style={{ color: 'var(--muc)', gap: 'var(--k5)', fontFamily: 'var(--sans)' }}>
      <div className="gv-page-header">
        <div>
          <h1>Giao đề theo tuần</h1>
          <p>Chọn khối → lớp → tick em → tick nguồn đề → hạn chót. Em được tick CHỈ làm câu trong đề đã tick.</p>
        </div>
      </div>
      <TheNoiDung>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--k2)', fontWeight: 600 }}>
          <input type="checkbox" checked={bat} onChange={() => setBat(!bat)} /> Bật việc giao đề
        </label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--k2)', marginTop: 'var(--k3)' }}>
          {KHOI.map((k) => (
            <button key={k} type="button" className={`m3-nut-chu${khoi === k ? ' m3-nut-tonal' : ' m3-nut-vien'}`} onClick={() => { setKhoi(k); setLop('') }}>Khối {k}</button>
          ))}
        </div>
      </TheNoiDung>
      <TheNoiDung>
        <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k2)' }}>Lớp (khối {khoi})</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--k2)' }}>
          <button type="button" className={`m3-nut-chu${lop === '' ? ' m3-nut-tonal' : ' m3-nut-vien'}`} onClick={() => setLop('')}>Tất cả</button>
          {dsLop.map((t) => (
            <button key={t} type="button" className={`m3-nut-chu${lop === t ? ' m3-nut-tonal' : ' m3-nut-vien'}`} onClick={() => setLop(t)}>{t}</button>
          ))}
        </div>
      </TheNoiDung>
      <TheNoiDung>
        <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k2)' }}>Em khối {khoi} ({chonEm.size} đã tick)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k1)', maxHeight: 320, overflow: 'auto' }}>
          {emThay.length === 0 ? <p style={{ color: 'var(--nhat)' }}>Không có em nào ở khối này.</p> : emThay.map((e) => (
            <OTick key={e.sbd} da={chonEm.has(e.sbd)} nhan={e.hoTen || e.sbd} phu={e.tenLop || e.lop} onDoi={() => setChonEm(lat(chonEm, e.sbd))} />
          ))}
        </div>
      </TheNoiDung>
      <TheNoiDung>
        <h2 style={{ fontSize: 'var(--cx-3)', fontWeight: 700, marginBottom: 'var(--k2)' }}>Nguồn đề khối {khoi} ({chonDe.size} đã tick)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--k1)', maxHeight: 320, overflow: 'auto' }}>
          {deThay.length === 0 ? <p style={{ color: 'var(--nhat)' }}>Không có tờ đề nào ở khối này.</p> : deThay.map((d) => (
            <OTick key={d.maDe} da={chonDe.has(d.maDe)} nhan={d.ten || d.maDe} phu={`${d.maDe} · ${d.soCau} câu`} onDoi={() => setChonDe(lat(chonDe, d.maDe))} />
          ))}
        </div>
      </TheNoiDung>
      <TheNoiDung>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--k2)', fontWeight: 600 }}>
          Hạn chót (tối thiểu 7 ngày kể từ lúc giao):
          <input type="date" value={han} onChange={(e) => setHan(e.target.value)} />
        </label>
        <button type="button" className="m3-nut-chu m3-nut-tonal" style={{ marginTop: 'var(--k3)' }} disabled={dangLuu || chonEm.size === 0 || chonDe.size === 0 || !han} onClick={() => void luu()}>
          {dangLuu ? 'Đang lưu…' : 'Lưu lại'}
        </button>
        {(!han || chonEm.size === 0 || chonDe.size === 0) ? <p style={{ marginTop: 'var(--k2)', color: 'var(--nhat)' }}>Cần chọn ít nhất một em, một nguồn đề và hạn chót.</p> : null}
      </TheNoiDung>
    </div>
  )
}
