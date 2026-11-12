// LIVE THEO KHỐI — LỚP NỔI MÁY THẦY (mặt; kho + nối phòng ở thay-khoi.ts): phòng chờ (sân xem trận, bốn đội, «Bắt đầu live»), công tắc Học | Bảng, cột tin nhắn.
import { Suspense, lazy, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { DOI_BPU, type ViewBang } from '../../lib/bpu/phong'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { batDauLiveKhoi } from '../../lib/live-khoi/api'
import { dangKy, datKhoi, dongVinhDanh, kenh, layDangMo, layKetQua, layView, phienCua } from './thay-khoi'
import './thay-khoi.css'
import './em-khoi.css'

const TroGiuLua = lazy(() => import('./TroGiuLua'))
const ChonCauBpu = lazy(() => import('../bpu/ChonCauBpu'))
/** Chưa có tờ giảng / tấm hoạt động nào đang mở ⇒ buổi live đang ở bước chọn bài. */
/** Tờ đang mở là tờ BẢNG TRẮNG (chưa chọn bài) ⇒ sang «Học» thì mở chọn bài. */
let toBangTrang = false
const chuaCoTo = (): boolean => !document.querySelector('.lop-xem-phieu, [data-bpu-hd]')
const ManVinhDanh = lazy(() => import('./ManVinhDanh'))
const CotChatThay = lazy(() => import('./ChatThay').then((m) => ({ default: m.CotChatThay })))

export default function LopNoiThay() {
  const v = useSyncExternalStore(dangKy, layView)
  const k = v?.live?.khoi ?? null
  const kq = useSyncExternalStore(dangKy, layKetQua)
  const dangMo = useSyncExternalStore(dangKy, layDangMo)
  const [chat, setChat] = useState(false)
  // CHỌN BÀI của riêng buổi live (không qua màn điểm danh / màn đua của bảng): mở sẵn khi chưa có tờ giảng; thầy mở lại bằng nút «Chọn bài».
  const [chon, setChon] = useState(false)
  // SẢNH (thầy 12/11: «bấm bắt đầu live thì phải vào bảng danh sách học sinh vào live, sau đó tôi chọn chế độ»): hiện ngay sau «Bắt đầu live» khi chưa có tờ.
  const [sanh, setSanh] = useState(chuaCoTo)
  const [loi, setLoi] = useState('')
  /** Đổi chế độ: báo phòng (máy em đổi theo) + bảo đảm máy thầy có đúng thứ để dạy — Học cần bài (mở chọn bài), Bảng cần tờ bảng (dựng bảng trắng). */
  const doiChe = (c: 'hoc' | 'bang'): void => {
    if (!k) return
    datKhoi({ ...k, che: c }); setSanh(false); setLoi('')
    if (c === 'hoc') { if (chuaCoTo() || toBangTrang) setChon(true) }
    else { setChon(false); if (chuaCoTo()) { toBangTrang = true; void import('../bpu/gan-gv').then((m) => m.chieuBangTrang()).then((l) => { if (l) { toBangTrang = false; setLoi(l); setSanh(true) } }) } }
  }
  const [k1, setK1] = useState(() => Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
  useEffect(() => { const f = () => setK1(Math.min(window.innerWidth / 1920, window.innerHeight / 1080)); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
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
  if (kq) return <div className="lkt" style={{ ...MAU_CHIEU, ...MAU_XANH_THAN } as CSSProperties}><Suspense fallback={null}><ManVinhDanh ds={kq.ds} kj={kq.kj} toi={null} onDong={dongVinhDanh} /></Suspense></div>
  if (!k && dangMo != null) return <div className="lkt" style={{ ...MAU_CHIEU, ...MAU_XANH_THAN } as CSSProperties}><div className="lkt-dang-mo" role="status">Đang mở phòng chờ Khối {dangMo}…</div></div>
  if (!v || !k || v.ketThuc) return null
  return (
    <div className="lkt" style={{ ...MAU_CHIEU, ...MAU_XANH_THAN } as CSSProperties}>
      {k.gd === 'cho' ? <PhongChoThay v={v} khoi={k.k} /> : (
        <>
          <div className="lkt-vien" role="group" aria-label="Chế độ live">
            <div className="lkt-che" role="radiogroup" aria-label="Chế độ">
              {(['hoc', 'bang'] as const).map((c) => (
                <button key={c} type="button" role="radio" aria-checked={k.che === c} className={k.che === c ? 'chon' : ''} onClick={() => doiChe(c)}
                  title={c === 'hoc' ? 'Học: đề, chấm, gọi lên bảng như cũ' : 'Bảng: bảng kín màn máy em để giảng lý thuyết'}>{c === 'hoc' ? 'Học' : 'Bảng'}</button>
              ))}
            </div>
            <button type="button" className="lkt-nut-chat" onClick={() => { setChon(false); setSanh(true) }} title="Danh sách các em trong phòng live"><span>Lớp</span></button>
            {k.che === 'hoc' ? <button type="button" className="lkt-nut-chat" onClick={() => setChon(true)} title="Chọn bài, chọn hoạt động"><span>Chọn bài</span></button> : null}
            <button type="button" className={`lkt-nut-chat${chat ? ' chon' : ''}`} aria-pressed={chat} onClick={doiChat} title="Tin nhắn lớp (phím M)">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4V15A2.5 2.5 0 0 1 5 12.5z" /></svg>
              <span>Tin nhắn</span>{moi > 0 && !chat ? <em aria-label={`${moi} tin mới`}>{moi > 99 ? '99+' : moi}</em> : null}
            </button>
          </div>
          {sanh ? <SanhLive v={v} khoi={k.k} che={k.che} coTo={!chuaCoTo()} loi={loi} onChe={doiChe} onDong={() => setSanh(false)} /> : null}
          {chon && !sanh ? (
            <div className="lkt-chon"><div className="lkt-san-khau" style={{ ['--k' as string]: k1 }}>
              <div className="lkt-chon-dau"><i aria-hidden="true" />Live Khối {k.k}<small>{v.ds.filter((e) => e.vao).length} em trong phòng</small></div>
              <Suspense fallback={null}>
                <ChonCauBpu buoiId={v.buoiId} lop={v.lop} buocDau="hd" onDong={() => setChon(false)}
                  onChieu={async (ds) => { const m = await import('../bpu/gan-gv'), l = await m.chieuCau(ds); if (!l) { toBangTrang = false; setChon(false) } return l }}
                  onHoatDong={(hd) => { toBangTrang = false; setChon(false); void import('../bpu/gan-gv').then((m) => m.moHoatDong(hd)) }}
                  onKetThuc={async () => (await import('../bpu/gan-gv')).ketThucBuoiHoc(v.buoiId)} />
              </Suspense>
            </div></div>
          ) : null}
          {chat ? <div className="lkt-chat"><Suspense fallback={null}><CotChatThay kenh={kenh} onDong={() => setChat(false)} /></Suspense></div> : null}
        </>
      )}
    </div>
  )
}

/** SẢNH LIVE: danh sách các em đã vào theo bốn đội + hai nút chọn chế độ. */
function SanhLive({ v, khoi, che, coTo, loi, onChe, onDong }: { v: ViewBang; khoi: number; che: 'hoc' | 'bang'; coTo: boolean; loi: string; onChe: (c: 'hoc' | 'bang') => void; onDong: () => void }) {
  const vao = useMemo(() => v.ds.filter((e) => e.vao), [v.ds])
  const [dangKt, setDangKt] = useState(false)
  const ketThuc = async () => { if (dangKt) return; setDangKt(true); const m = await import('../bpu/gan-gv'); if (await m.ketThucBuoiHoc(v.buoiId)) setDangKt(false) }
  return (
    <div className="lkt-cho sanh" role="dialog" aria-modal="true" aria-label={`Live Khối ${khoi}`}>
      <header>
        <span className="lkt-the live"><i aria-hidden="true" />Đang live · Khối {khoi}</span>
        <span className="lkt-the">{vao.length} em trong phòng</span>
        <span className="gian" />
        {coTo ? <button type="button" className="lkt-ve" onClick={onDong}>Quay lại bài</button> : null}
        <button type="button" className="lkt-dong" onClick={() => void ketThuc()} disabled={dangKt}>{dangKt ? 'Đang kết thúc…' : 'Kết thúc live'}</button>
      </header>
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
        <p>Thầy chọn chế độ để bắt đầu dạy. Đổi qua lại bất cứ lúc nào bằng công tắc ở góc trên phải.{loi ? <strong role="alert"> {loi}</strong> : null}</p>
        <button type="button" className="lkt-che-to" data-chon={che === 'hoc' && coTo || undefined} onClick={() => onChe('hoc')}><b>Học</b><span>Chọn bài, chiếu câu, cả lớp làm trên máy</span></button>
        <button type="button" className="lkt-che-to" data-chon={che === 'bang' && coTo || undefined} onClick={() => onChe('bang')}><b>Bảng</b><span>Bảng kín màn máy em để giảng lý thuyết</span></button>
      </footer>
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
