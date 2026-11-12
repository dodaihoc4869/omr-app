// LIVE THEO KHỐI — LỚP NỔI MÁY THẦY (mặt; kho + nối phòng + tự bật tiếng ở thay-khoi.ts).
// Luồng (thầy 12/11): PHÒNG CHỜ → «Bắt đầu live» ⇒ SẢNH danh sách bốn đội (tiếng thầy tự bật, không cần tờ, không phải bấm nút Live nào) → thầy chọn
// «Học» (bảng chọn bài của live ⇒ tờ giảng) hoặc «Bảng» (tờ bảng trắng xanh than) ⇒ phòng báo máy em chuyển theo. Bảng Bình Phản Ứng ẩn suốt buổi.
import { Suspense, lazy, useEffect, useMemo, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { DOI_BPU, type ViewBang } from '../../lib/bpu/phong'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { batDauLiveKhoi } from '../../lib/live-khoi/api'
import { chieuBangTrang, chieuCau, coToChieu, datEscLive, ketThucBuoiHoc, moHoatDong } from '../bpu/gan-gv'
import { batTiengLai, dangKy, datKhoi, datToBang, kenh, laToBang, layDangMo, layView, phienCua } from './thay-khoi'
import './thay-khoi.css'
import './em-khoi.css'

const TroGiuLua = lazy(() => import('./TroGiuLua'))
const ChonCauBpu = lazy(() => import('../bpu/ChonCauBpu'))
const CotChatThay = lazy(() => import('./ChatThay').then((m) => ({ default: m.CotChatThay })))
const KIEU = { ...MAU_CHIEU, ...MAU_XANH_THAN } as CSSProperties

export default function LopNoiThay() {
  const v = useSyncExternalStore(dangKy, layView)
  const k = v?.live?.khoi ?? null
  const dangMo = useSyncExternalStore(dangKy, layDangMo)
  const [chat, setChat] = useState(false)
  /** Bảng chọn bài của live đang mở (nằm TRÊN sảnh). */
  const [chon, setChon] = useState(false)
  /** Thầy tự mở lại sảnh bằng nút «Lớp» khi đang dạy. */
  const [sanhTay, setSanh] = useState(false)
  const [loi, setLoi] = useState('')
  const dang = k?.gd === 'dang'
  // Bảng Bình Phản Ứng đang HIỆN (màn đua của «Học») ⇒ cụm nút dời lên khoảng trống thanh trên của bảng; đang ở tờ ⇒ nằm trên thanh đáy của tờ.
  const [bangHien, setBangHien] = useState(false)
  useEffect(() => { const f = (e: Event) => setBangHien((e as CustomEvent<boolean>).detail !== true); window.addEventListener('bpu-an-hien', f); return () => window.removeEventListener('bpu-an-hien', f) }, [])
  const sanh = dang && (sanhTay || k.che === 'sanh')
  const [k1, setK1] = useState(() => Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
  useEffect(() => { const f = () => setK1(Math.min(window.innerWidth / 1920, window.innerHeight / 1080)); window.addEventListener('resize', f); return () => window.removeEventListener('resize', f) }, [])
  const dungBangTrang = (): void => { datToBang(true); void chieuBangTrang().then((l) => { if (l) { datToBang(false); setLoi(l); setSanh(true) } }) }
  // Vào lại giữa buổi (tải lại trang, Esc rồi quay lại) mà chưa có tờ: Học ⇒ mở chọn bài, Bảng ⇒ dựng lại bảng trắng. Không để lộ màn trống.
  const che = dang ? k.che : null
  useEffect(() => {
    if (!che || che === 'sanh' || coToChieu()) return
    if (che === 'hoc') setChon(true); else dungBangTrang()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [che])
  /** Bài đã chiếu / hoạt động đã mở ⇒ BÂY GIỜ mới báo phòng sang «Học» (máy em ở nguyên màn đang xem tới lúc có bài). */
  const sangHoc = (): void => { datToBang(false); setChon(false); setSanh(false); if (k) datKhoi({ ...k, che: 'hoc' }) }
  const doiChe = (c: 'hoc' | 'bang'): void => {
    if (!k) return
    setLoi('')
    if (c === 'hoc') {
      // Chưa có bài (chưa có tờ, hoặc mới có tờ bảng trắng) ⇒ mở chọn bài trước.
      if (!coToChieu() || laToBang()) { setChon(true); return }
      setSanh(false); setChon(false); datKhoi({ ...k, che: 'hoc' })
    } else {
      setSanh(false); setChon(false); datKhoi({ ...k, che: 'bang' })
      if (!coToChieu()) dungBangTrang()
    }
  }
  const [moi, setMoi] = useState(0)
  // Đếm tin mới chỉ khi cột đang đóng (nghe lại mỗi lần đóng / mở); mở cột ⇒ về 0 ngay trong thao tác bấm.
  useEffect(() => (chat ? undefined : kenh.nghe('chat', (t) => { if ((t.x as { c?: string } | null)?.c && t.s !== 'gv') setMoi((n) => n + 1) })), [chat])
  const doiChat = (): void => { setMoi(0); setChat((c) => !c) }
  // Phím M đóng / mở cột tin nhắn (không khi thầy đang gõ chữ).
  useEffect(() => {
    if (!dang) return
    const f = (e: KeyboardEvent) => {
      const d = e.target as HTMLElement | null
      if (e.key.toLowerCase() !== 'm' || e.ctrlKey || e.metaKey || e.altKey || (d && (d.tagName === 'INPUT' || d.tagName === 'TEXTAREA' || d.isContentEditable))) return
      e.preventDefault(); e.stopPropagation(); setMoi(0); setChat((c) => !c)
    }
    window.addEventListener('keydown', f, true)
    return () => window.removeEventListener('keydown', f, true)
  }, [dang])
  // ESC LÙI MỘT MÀN (thầy 12/11): tin nhắn → chọn bài → bài / bảng → danh sách lớp → (hết) ra Hôm nay. Phòng chờ: Esc ra Hôm nay.
  const esc = useRef<() => boolean>(() => false)
  esc.current = () => {
    if (!dang) return false
    if (chat) { setChat(false); return true }
    if (chon) { setChon(false); return true }
    if (sanh) return false
    setSanh(true)
    return true
  }
  useEffect(() => { datEscLive(() => esc.current()); return () => datEscLive(null) }, [])
  if (!k && dangMo != null) return <div className="lkt" style={KIEU}><div className="lkt-dang-mo" role="status">Đang mở phòng chờ Khối {dangMo}…</div></div>
  if (!v || !k || v.ketThuc) return null
  if (k.gd === 'cho') return <div className="lkt" style={KIEU}><PhongChoThay v={v} khoi={k.k} /></div>
  return (
    <div className="lkt" style={KIEU}>
      <div className="lkt-vien" data-tren={bangHien && k.che === 'hoc' ? '' : undefined} role="group" aria-label="Chế độ live">
        <div className="lkt-che" role="radiogroup" aria-label="Chế độ">
          {(['hoc', 'bang'] as const).map((c) => (
            <button key={c} type="button" role="radio" aria-checked={k.che === c} className={k.che === c ? 'chon' : ''} onClick={() => doiChe(c)}
              title={c === 'hoc' ? 'Học: đề, chấm, gọi lên bảng như cũ' : 'Bảng: bảng xanh than kín màn để giảng lý thuyết'}>{c === 'hoc' ? 'Học' : 'Bảng'}</button>
          ))}
        </div>
        {v.live?.bat ? null : <button type="button" className="lkt-nut-chat canh" onClick={batTiengLai} title="Các em chưa nghe được thầy — bấm để bật tiếng"><span>Bật tiếng</span></button>}
        <button type="button" className="lkt-nut-chat" onClick={() => { setChon(false); setSanh(true) }} title="Danh sách các em trong phòng live"><span>Lớp</span></button>
        {k.che === 'hoc' ? <button type="button" className="lkt-nut-chat" onClick={() => setChon(true)} title="Chọn bài, chọn hoạt động"><span>Chọn bài</span></button> : null}
        <button type="button" className={`lkt-nut-chat${chat ? ' chon' : ''}`} aria-pressed={chat} onClick={doiChat} title="Tin nhắn lớp (phím M)">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4V15A2.5 2.5 0 0 1 5 12.5z" /></svg>
          <span>Tin nhắn</span>{moi > 0 && !chat ? <em aria-label={`${moi} tin mới`}>{moi > 99 ? '99+' : moi}</em> : null}
        </button>
      </div>
      {sanh ? <SanhLive v={v} khoi={k.k} che={k.che} loi={loi} onChe={doiChe} onDong={() => setSanh(false)} /> : null}
      {chon ? (
        <div className="lkt-chon"><div className="lkt-san-khau" style={{ ['--k' as string]: k1 }}>
          <div className="lkt-chon-dau"><i aria-hidden="true" />Live Khối {k.k}<small>{v.ds.filter((e) => e.vao).length} em trong phòng</small></div>
          <Suspense fallback={null}>
            <ChonCauBpu live buoiId={v.buoiId} lop={v.lop} buocDau="hd" onDong={() => setChon(false)}
              onChieu={async (ds) => { const l = await chieuCau(ds); if (!l) sangHoc(); return l }}
              onHoatDong={(hd) => { sangHoc(); void moHoatDong(hd) }}
              onKetThuc={() => ketThucBuoiHoc(v.buoiId)} />
          </Suspense>
        </div></div>
      ) : null}
      {chat ? <div className="lkt-chat"><Suspense fallback={null}><CotChatThay kenh={kenh} /></Suspense></div> : null}
    </div>
  )
}

/** SẢNH LIVE: danh sách các em đã vào theo bốn đội + hai nút chọn chế độ. */
function SanhLive({ v, khoi, che, loi, onChe, onDong }: { v: ViewBang; khoi: number; che: 'hoc' | 'bang' | 'sanh'; loi: string; onChe: (c: 'hoc' | 'bang') => void; onDong: () => void }) {
  const coBai = che !== 'sanh'
  // Tiếng tự bật lúc «Bắt đầu live» (thay-khoi.ts). Quá 6 giây chưa bật (mic bị chặn / chưa cắm) ⇒ nút «Bật tiếng lại».
  const dangNghe = !!v.live?.bat
  const [cham, setCham] = useState(false)
  useEffect(() => { if (dangNghe) return; const h = setTimeout(() => setCham(true), 6000); return () => clearTimeout(h) }, [dangNghe])
  const vao = useMemo(() => v.ds.filter((e) => e.vao), [v.ds])
  const [dangKt, setDangKt] = useState(false)
  const ketThuc = async () => { if (dangKt) return; setDangKt(true); if (await ketThucBuoiHoc(v.buoiId)) setDangKt(false) }
  return (
    <div className="lkt-cho sanh" role="dialog" aria-modal="true" aria-label={`Live Khối ${khoi}`}>
      <header>
        <span className="lkt-the live"><i aria-hidden="true" />Đang live · Khối {khoi}</span>
        <span className="lkt-the">{vao.length} em trong phòng</span>
        <span className="lkt-the" data-tieng={dangNghe ? 'bat' : 'cho'}>{dangNghe ? 'Các em đang nghe thầy' : cham ? 'Chưa bật được tiếng' : 'Đang bật tiếng…'}</span>
        {!dangNghe && cham ? <button type="button" className="lkt-ve" onClick={() => { setCham(false); batTiengLai() }}>Bật tiếng lại</button> : null}
        <span className="gian" />
        {coBai ? <button type="button" className="lkt-ve" onClick={onDong}>Quay lại bài</button> : null}
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
        <p>Các em đang ở bảng danh sách này. Thầy chọn chế độ, máy các em chuyển theo ngay.{loi ? <strong role="alert"> {loi}</strong> : null}</p>
        <button type="button" className="lkt-che-to" data-chon={che === 'hoc' || undefined} onClick={() => onChe('hoc')}><b>Học</b><span>Chọn bài, chiếu câu, cả lớp làm trên máy</span></button>
        <button type="button" className="lkt-che-to" data-chon={che === 'bang' || undefined} onClick={() => onChe('bang')}><b>Bảng</b><span>Bảng xanh than kín màn để giảng lý thuyết</span></button>
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
    // Bắt đầu ⇒ cả lớp (máy thầy lẫn máy em) vào bảng danh sách; tiếng thầy tự bật ngay (thay-khoi.ts theo dõi `gd = dang`), không cần tờ.
    datKhoi({ k: khoi, gd: 'dang', che: 'sanh' })
    const p = phienCua(v.buoiId)
    const r = p ? await batDauLiveKhoi(p.id) : null
    if (r && !r.ok) setLoi(r.chu)
    setDang(false)
  }
  const dong = async () => {
    if (dang) return
    setDang(true)
    const chu = await ketThucBuoiHoc(v.buoiId)
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
