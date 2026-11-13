// LIVE THEO KHỐI — LỚP NỔI MÁY EM (mặt; kho + nối phòng ở em-khoi.ts): phòng chờ có trò Sinh Tồn, màn bốn đội, nút chat mép phải, bong bóng tin mới.
import { laDienThoai, thuocTinhXoay, toaDoXoay } from '../live/chieu-xoay'
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { useChatLop } from './ChatEm'
import { dangKy, dongKhoi, guiTho, kenh, layKho } from './em-khoi'
import './em-khoi.css'

const TroSinhTon = lazy(() => import('./TroSinhTon'))
const ManBonDoi = lazy(() => import('./ManBonDoi'))
const ManVinhDanh = lazy(() => import('./ManVinhDanh'))
const NutChatEm = lazy(() => import('./ChatEm').then((m) => ({ default: m.NutChatEm })))
const BongTinMoi = lazy(() => import('./ChatEm').then((m) => ({ default: m.BongTinMoi })))
const NganChatEm = lazy(() => import('./ChatEm').then((m) => ({ default: m.NganChatEm })))
const MayTinhEm = lazy(() => import('../may-tinh/MayTinhEm'))
const HoiHieuEm = lazy(() => import('./HoiHieuEm'))
const LuatRoiEm = lazy(() => import('./LuatRoiEm'))

/** ÉP NGANG suốt buổi live (thầy 12/11): trang đang dọc (máy không khoá ngang được) ⇒ xoay hình 90° như `.bpu-hs[data-xoay]`; trang đã ngang ⇒ thôi. */
function useXoay(): { xoay: boolean; style: CSSProperties; rong: number } {
  const [k, setK] = useState<readonly [number, number]>(() => [window.innerWidth, window.innerHeight])
  useEffect(() => {
    const doi = () => setK((c) => (c[0] === window.innerWidth && c[1] === window.innerHeight ? c : [window.innerWidth, window.innerHeight]))
    doi()
    window.addEventListener('resize', doi)
    window.addEventListener('orientationchange', doi)
    return () => { window.removeEventListener('resize', doi); window.removeEventListener('orientationchange', doi) }
  }, [])
  const xoay = k[1] > k[0] && laDienThoai() // máy tính / máy tính bảng không bao giờ bị xoay hình
  return { xoay, style: xoay ? { width: k[1], height: k[0] } : {}, rong: k[0] }
}
/** Máy tính: em đã CẤT cột tin nhắn thì nhớ theo máy (mặc định ghim sẵn — thầy 13/11 «trên máy tính bạn tính sao cho tiện nhất»). */
const KHOA_GHIM = 'ddh.lk.chatGhim'
const docGhim = (): boolean => { try { return localStorage.getItem(KHOA_GHIM) !== '0' } catch { return true } }
/** Máy tính màn từ cỡ này mới ghim cột (màn live còn đủ rộng). */
const GHIM_RONG = 1000
const mayYeu = (): boolean => { try { return localStorage.getItem('ddh.mayYeu') === '1' } catch { return false } }

export default function LopNoiEm() {
  const s = useSyncExternalStore(dangKy, layKho)
  const gd = s.khoi?.gd ?? null
  const dangVao = !s.khoi && !!s.dangVao && !s.xong
  const cho = gd === 'cho' || dangVao
  const { xoay, style, rong } = useXoay()
  const [bonDoi, setBonDoi] = useState<'xem' | null>(null)
  const [chatMo, setChatMo] = useState(false)
  /** Em tự rời phòng chờ (về màn Bình Phản Ứng bên dưới, đóng được như thường); thầy bấm Bắt đầu thì vẫn vào live. */
  const [roiCho, setRoiCho] = useState(false)
  const gdCu = useRef<typeof gd>(null)
  // SẢNH (thầy 12/11): thầy đã bấm Bắt đầu mà chưa chọn chế độ ⇒ máy em ở bảng danh sách bốn đội (đã nghe được thầy) tới khi thầy chọn Học / Bảng.
  // + (thầy 12/11 «bấm vào học là máy học sinh đã hiện vào màn chiếu, bên trái là một ô trắng»): phòng báo «hoc» mà CHƯA có lượt câu nào ⇒ em vẫn ở bảng
  // danh sách chờ thầy chiếu câu — không vào màn chiếu rỗng.
  const sanh = gd === 'dang' && (s.khoi?.che === 'sanh' || (s.khoi?.che === 'hoc' && !s.coLuot))
  useEffect(() => { if (gd === 'dang' && gdCu.current !== 'dang') guiTho({ t: 'lop-xin' }); gdCu.current = gd }, [gd])
  // Thầy 12/11: nút nhắn tin + ngọn lửa ẨN lúc em làm bài / thầy chữa bài (chế độ «Học» đang có câu); hiện ở danh sách, ở chế độ «Bảng», và lúc chờ câu.
  // Ngoài sảnh, hai nút này nằm trong khay của thanh vàng (màn live sẵn có — LopLive) và báo sang đây bằng sự kiện `ddh-lk`.
  const hienMep = sanh
  const [mepCu, setMepCu] = useState(hienMep)
  if (mepCu !== hienMep) setMepCu(hienMep)
  // Em vừa vào làm câu ⇒ cửa nhắn tin tự đóng cho khỏi che đề.
  const lamCau = s.khoi?.che === 'hoc' && !!s.coLuot
  const [lamCu, setLamCu] = useState(lamCau)
  if (lamCu !== lamCau) { setLamCu(lamCau); if (lamCau) setChatMo(false) }
  // NGĂN «TIN NHẮN LỚP» (thầy duyệt bản vẽ 60–66 ngày 13/11). Điện thoại: vuốt từ mép phải / kéo vạch vàng ⇒ ngăn trượt theo ngón tay (LopLive báo
  // `ddh-lk-keo` số px đã kéo, `ddh-lk-tha` lúc thả). Máy tính màn rộng: GHIM thành cột bên phải, màn live co sang trái; Enter gõ ngay, Esc về bài.
  const coGhim = !laDienThoai() && rong >= GHIM_RONG
  const [ghimMuon, setGhimMuon] = useState(docGhim)
  const cotGhim = coGhim && ghimMuon && gd === 'dang'
  const [keo, setKeo] = useState<number | null>(null)
  const [tieuDiem, setTieuDiem] = useState(0)
  useEffect(() => {
    const k = (e: Event) => setKeo(Math.max(0, Number((e as CustomEvent<number>).detail) || 0))
    const t = (e: Event) => { setKeo(null); if ((Number((e as CustomEvent<number>).detail) || 0) > 90) setChatMo(true) }
    window.addEventListener('ddh-lk-keo', k); window.addEventListener('ddh-lk-tha', t)
    return () => { window.removeEventListener('ddh-lk-keo', k); window.removeEventListener('ddh-lk-tha', t) }
  }, [])
  const trucX = useCallback((e: { clientX: number; clientY: number }): number => (xoay ? toaDoXoay(e, { left: 0, top: 0, right: window.innerWidth, bottom: window.innerHeight }).x : e.clientX), [xoay])
  const datGhim = useCallback((b: boolean): void => { setGhimMuon(b); if (!b) setChatMo(false); try { localStorage.setItem(KHOA_GHIM, b ? '1' : '0') } catch { /* máy chặn lưu */ } }, [])
  const dongChat = useCallback(() => setChatMo(false), [])
  // cột ghim ⇒ màn live (lớp `.bpu-hs` bên dưới) co sang trái đúng bề ngang cột (em-khoi.css)
  useLayoutEffect(() => {
    if (!cotGhim) return
    const g = document.documentElement
    g.setAttribute('data-lke-cot', '')
    return () => g.removeAttribute('data-lke-cot')
  }, [cotGhim])
  // ngăn trượt đang mở: chạm ra ngoài (vào bảng) ⇒ đóng
  useEffect(() => {
    if (!chatMo || cotGhim) return
    const f = (e: PointerEvent) => { if (!(e.target as Element | null)?.closest?.('.lc-ngan, .lv-nam, .lv-vuot, .lke-mep')) setChatMo(false) }
    window.addEventListener('pointerdown', f, true)
    return () => window.removeEventListener('pointerdown', f, true)
  }, [chatMo, cotGhim])
  // máy tính: Enter (không ở trong ô nhập / nút) ⇒ mở ngăn và gõ ngay
  const enterDuoc = coGhim && gd === 'dang'
  useEffect(() => {
    if (!enterDuoc) return
    const f = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.ctrlKey || e.metaKey || e.altKey || e.repeat || (e.target as HTMLElement | null)?.closest?.('input,textarea,select,button,a,[contenteditable]')) return
      e.preventDefault(); setChatMo(true); setTieuDiem((n) => n + 1)
    }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [enterDuoc])
  const [sanhCu, setSanhCu] = useState(sanh)
  if (sanhCu !== sanh) { setSanhCu(sanh); if (!sanh) setBonDoi(null) }
  // Phòng chờ: xin toàn màn hình ở lần chạm đầu (trình duyệt chỉ cho sau thao tác của em). KHÔNG khoá xoay hệ thống (thầy 12/11 lần 3) — máy dọc thì xoay hình.
  useEffect(() => {
    if (!cho) return
    const f = () => {
      try { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ }
    }
    window.addEventListener('pointerdown', f, { once: true })
    return () => window.removeEventListener('pointerdown', f)
  }, [cho])
  const chat = useChatLop(gd === 'dang' ? kenh : null)
  useEffect(() => {
    const f = (e: Event) => { const d = (e as CustomEvent<string>).detail; if (d === 'chat') setChatMo(true); else if (d === 'doi') { guiTho({ t: 'lop-xin' }); setBonDoi('xem') } }
    window.addEventListener('ddh-lk', f)
    return () => window.removeEventListener('ddh-lk', f)
  }, [])
  useEffect(() => { window.dispatchEvent(new CustomEvent('ddh-lk-tin', { detail: chat.moi })) }, [chat.moi])
  // Mic của em ở bảng danh sách (màn live nằm dưới lớp này): trạng thái do LopLive báo (`ddh-lk-mic`), lệnh gửi lại bằng `ddh-lk`.
  const [mic, setMic] = useState<{ tay: boolean; hang: number | null; moi: boolean; mic: '' | 'xin' | 'mo' }>({ tay: false, hang: null, moi: false, mic: '' })
  useEffect(() => {
    const f = (e: Event) => { const d = (e as CustomEvent<typeof mic>).detail; if (d) setMic(d) }
    window.addEventListener('ddh-lk-mic', f)
    return () => window.removeEventListener('ddh-lk-mic', f)
  }, [])
  const lenhLk = (d: string): void => { window.dispatchEvent(new CustomEvent('ddh-lk', { detail: d })) }
  useEffect(() => { if (chatMo || cotGhim) chat.danhDauDoc() }, [chatMo, cotGhim, chat.ds.length]) // eslint-disable-line react-hooks/exhaustive-deps
  if (s.xong && s.toi) return <div className="lke xong" data-xoay={xoay ? thuocTinhXoay() : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }}><Suspense fallback={null}><ManVinhDanh ds={s.ds} kj={s.kj} toi={s.toi} onDong={dongKhoi} /></Suspense></div>
  if (dangVao) return <div className="lke cho dang-vao" data-xoay={xoay ? thuocTinhXoay() : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }} role="status"><p><i aria-hidden="true" />Đang vào phòng live…</p></div>
  if (!s.khoi || !s.toi || (cho && roiCho)) return null
  return (
    <div className={`lke${cho ? ' cho' : ''}${cotGhim ? ' co-cot' : ''}`} data-xoay={xoay ? thuocTinhXoay() : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }}>
      <Suspense fallback={null}>
        {cho ? <TroSinhTon toi={s.toi} ds={s.ds} kenh={kenh} soEm={Math.max(1, s.ds.length)} mayYeu={mayYeu()} xoay={xoay} /> : null}
        {cho ? <button type="button" className="lke-roi" onClick={() => { setRoiCho(true); try { if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ } }}>Rời phòng chờ</button> : null}
        {!cho && !sanh && !bonDoi ? <MayTinhEm kenh={kenh} /> : null}
        {!cho ? <HoiHieuEm kenh={kenh} /> : null}
        {!cho && s.luat ? <LuatRoiEm luat={s.luat} onXin={() => guiTho({ t: 'live-luat-xin' })} /> : null}
        {!cho && (sanh || bonDoi) ? <ManBonDoi ds={s.ds} toi={s.toi} kj={s.kj} onDong={() => setBonDoi(null)} /> : null}
        {!cho && (sanh || !bonDoi) ? (
          <>
            {chatMo || cotGhim || keo != null ? <NganChatEm chat={chat} toiSbd={s.toi.sbd} soEm={s.ds.length} ghim={cotGhim} coGhim={coGhim} keo={chatMo || cotGhim ? null : keo} tieuDiem={tieuDiem} trucX={trucX} onDong={dongChat} onGhim={datGhim} /> : <div className="lke-bong"><BongTinMoi tin={chat.tinMoi} /></div>}
            {sanh && (mic.moi || mic.mic) ? (
              <div className="lke-moi" role="dialog" aria-label="Mic của em">
                {mic.mic === 'mo' ? <><p><b>Mic của em đang bật</b>Thầy và cả lớp đang nghe em.</p><button type="button" onClick={() => lenhLk('mic-tat')}>Tắt mic</button></>
                  : mic.mic === 'xin' ? <p><b>Đang bật mic…</b>Máy hỏi quyền thì em bấm Cho phép.</p>
                    : <><p><b>Thầy mời em nói</b>Bật mic để thầy và cả lớp nghe em.</p><button type="button" className="chinh" onClick={() => lenhLk('mic-bat')}>Bật mic và nói</button><button type="button" onClick={() => lenhLk('de-sau')}>Để sau</button></>}
              </div>
            ) : null}
            {hienMep ? (
              <div className="lke-mep" role="group" aria-label="Live theo khối">
                <NutChatEm moi={chat.moi} onMo={() => setChatMo((c) => !c)} />
                <button type="button" className={`lke-doi lke-tay${mic.tay ? ' gio' : ''}`} aria-pressed={mic.tay} disabled={mic.moi || mic.mic !== ''} aria-label={mic.tay ? `Đang giơ tay${mic.hang ? `, thứ ${mic.hang} trong hàng` : ''}. Chạm để hạ tay` : 'Giơ tay xin nói'} title={mic.tay ? 'Đang giơ tay — chạm để hạ' : 'Giơ tay xin nói'} onClick={() => lenhLk('tay')}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11m0-6.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a5 5 0 0 1-4.3-2.5L4.5 14a1.4 1.4 0 0 1 2.3-1.6L8 14" /></svg>
                </button>
                <button type="button" className="lke-doi" aria-label="Bốn đội" title="Bốn đội" onClick={() => { guiTho({ t: 'lop-xin' }); setBonDoi('xem') }}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-5 1 2 2 2 2 2 0-3 0-5 1-8z" /></svg>
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </Suspense>
    </div>
  )
}
