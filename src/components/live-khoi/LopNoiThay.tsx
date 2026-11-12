// LIVE THEO KHỐI — LỚP NỔI MÁY THẦY (mặt; kho + nối phòng ở thay-khoi.ts): phòng chờ (sân xem trận, bốn đội, «Bắt đầu live»), công tắc Học | Bảng, cột tin nhắn.
import { Suspense, lazy, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { DOI_BPU, type ViewBang } from '../../lib/bpu/phong'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { batDauLiveKhoi } from '../../lib/live-khoi/api'
import { dangKy, datKhoi, kenh, layView, phienCua } from './thay-khoi'
import './thay-khoi.css'
import './em-khoi.css'

const TroGiuLua = lazy(() => import('./TroGiuLua'))
const CotChatThay = lazy(() => import('./ChatThay').then((m) => ({ default: m.CotChatThay })))

export default function LopNoiThay() {
  const v = useSyncExternalStore(dangKy, layView)
  const k = v?.live?.khoi ?? null
  const [chat, setChat] = useState(false)
  const [moi, setMoi] = useState(0)
  // Đếm tin mới chỉ khi cột đang đóng (nghe lại mỗi lần đóng / mở); mở cột ⇒ về 0 ngay trong thao tác bấm.
  useEffect(() => (chat ? undefined : kenh.nghe('chat', (t) => { if ((t.x as { c?: string } | null)?.c && t.s !== 'gv') setMoi((n) => n + 1) })), [chat])
  const doiChat = (): void => { setMoi(0); setChat((c) => !c) }
  // Phím M đóng / mở cột tin nhắn (không khi thầy đang gõ chữ).
  useEffect(() => {
    if (k?.gd !== 'dang') return
    const f = (e: KeyboardEvent) => {
      const d = e.target as HTMLElement | null
      if (e.key.toLowerCase() !== 'm' || e.ctrlKey || e.metaKey || e.altKey || (d && (d.tagName === 'INPUT' || d.tagName === 'TEXTAREA' || d.isContentEditable))) return
      e.preventDefault(); e.stopPropagation(); setMoi(0); setChat((c) => !c)
    }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [k?.gd])
  if (!v || !k || v.ketThuc) return null
  return (
    <div className="lkt" style={{ ...MAU_CHIEU, ...MAU_XANH_THAN } as CSSProperties}>
      {k.gd === 'cho' ? <PhongChoThay v={v} khoi={k.k} /> : (
        <>
          <div className="lkt-vien" role="group" aria-label="Chế độ live">
            <div className="lkt-che" role="radiogroup" aria-label="Chế độ">
              {(['hoc', 'bang'] as const).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={k.che === c} className={k.che === c ? 'chon' : ''} onClick={() => datKhoi({ ...k, che: c })}
                  title={c === 'hoc' ? 'Học: đề, chấm, gọi lên bảng như cũ' : 'Bảng: bảng kín màn máy em để giảng lý thuyết'}>{c === 'hoc' ? 'Học' : 'Bảng'}</button>
              ))}
            </div>
            <button type="button" className={`lkt-nut-chat${chat ? ' chon' : ''}`} aria-pressed={chat} onClick={doiChat} title="Tin nhắn lớp (phím M)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4V15A2.5 2.5 0 0 1 5 12.5z" /></svg>
              <span>Tin nhắn</span>{moi > 0 && !chat ? <em aria-label={`${moi} tin mới`}>{moi > 99 ? '99+' : moi}</em> : null}
            </button>
          </div>
          {chat ? <div className="lkt-chat"><Suspense fallback={null}><CotChatThay kenh={kenh} onDong={() => setChat(false)} /></Suspense></div> : null}
        </>
      )}
    </div>
  )
}

function PhongChoThay({ v, khoi }: { v: ViewBang; khoi: number }) {
  const [dang, setDang] = useState(false)
  const [loi, setLoi] = useState('')
  const vao = useMemo(() => v.ds.filter((e) => e.vao), [v.ds])
  const dsLop = useMemo(() => vao.map((e) => ({ sbd: e.sbd, ten: e.ten, doi: e.doi })), [vao])
  const batDau = async () => {
    if (dang) return
    setDang(true); setLoi('')
    datKhoi({ k: khoi, gd: 'dang', che: 'hoc' })
    const p = phienCua(v.buoiId)
    const r = p ? await batDauLiveKhoi(p.id) : null
    if (r && !r.ok) setLoi(r.chu)
    setDang(false)
  }
  const dong = async () => {
    if (dang) return
    setDang(true)
    const m = await import('../bpu/gan-gv')
    const chu = await m.ketThucBuoiHoc(v.buoiId)
    if (chu) { setLoi(chu); setDang(false) }
  }
  return (
    <div className="lkt-cho" role="dialog" aria-modal="true" aria-label={`Phòng chờ Khối ${khoi}`}>
      <header>
        <span className="lkt-the cho"><i aria-hidden="true" />Phòng chờ · Khối {khoi}</span>
        <span className="lkt-the">Đã vào {vao.length} em</span>
        <span className="gian" />
        <button type="button" className="lkt-dong" onClick={() => void dong()} disabled={dang}>Đóng phòng</button>
      </header>
      <div className="lkt-san"><Suspense fallback={null}><TroGiuLua toi={null} ds={dsLop} kenh={kenh} soEm={vao.length} xemThoi /></Suspense></div>
      <div className="lkt-doi">
        {DOI_BPU.map((d, i) => {
          const em = vao.filter((e) => e.doi === i)
          return (
            <section key={d.ky} style={{ ['--doi' as string]: `var(${d.mau})` }}>
              <h3><b>{d.ky}</b>{d.ten}<small>{em.length} em</small></h3>
              <ul>{em.map((e) => <li key={e.sbd}>{e.ten}</li>)}{em.length ? null : <li className="rong">Chưa có em nào</li>}</ul>
            </section>
          )
        })}
      </div>
      <footer>
        <p>Các em đang chơi Giữ Lửa trong lúc chờ. Em vào sau tự được xếp vào đội.{loi ? <strong role="alert"> {loi}</strong> : null}</p>
        <button type="button" className="lkt-bat-dau" onClick={() => void batDau()} disabled={dang}>{dang ? 'Đang bắt đầu…' : 'Bắt đầu live'}</button>
      </footer>
    </div>
  )
}
