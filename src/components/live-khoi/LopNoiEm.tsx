// LIVE THEO KHỐI — LỚP NỔI MÁY EM (mặt; kho + nối phòng ở em-khoi.ts): phòng chờ có trò Giữ Lửa, màn bốn đội, nút chat mép phải, bong bóng tin mới.
import { Suspense, lazy, useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { useChatLop } from './ChatEm'
import { dangKy, dongKhoi, guiTho, kenh, layKho } from './em-khoi'
import './em-khoi.css'

const TroGiuLua = lazy(() => import('./TroGiuLua'))
const ManBonDoi = lazy(() => import('./ManBonDoi'))
const ManVinhDanh = lazy(() => import('./ManVinhDanh'))
const NutChatEm = lazy(() => import('./ChatEm').then((m) => ({ default: m.NutChatEm })))
const BongTinMoi = lazy(() => import('./ChatEm').then((m) => ({ default: m.BongTinMoi })))
const CuaChatEm = lazy(() => import('./ChatEm').then((m) => ({ default: m.CuaChatEm })))

/** ÉP NGANG suốt buổi live (thầy 12/11): trang đang dọc (máy không khoá ngang được) ⇒ xoay hình 90° như `.bpu-hs[data-xoay]`; trang đã ngang ⇒ thôi. */
function useXoay(): { xoay: boolean; style: CSSProperties } {
  const [k, setK] = useState<readonly [number, number]>(() => [window.innerWidth, window.innerHeight])
  useEffect(() => {
    const doi = () => setK((c) => (c[0] === window.innerWidth && c[1] === window.innerHeight ? c : [window.innerWidth, window.innerHeight]))
    doi()
    window.addEventListener('resize', doi)
    window.addEventListener('orientationchange', doi)
    return () => { window.removeEventListener('resize', doi); window.removeEventListener('orientationchange', doi) }
  }, [])
  const xoay = k[1] > k[0]
  return { xoay, style: xoay ? { width: k[1], height: k[0] } : {} }
}
const mayYeu = (): boolean => { try { return localStorage.getItem('ddh.mayYeu') === '1' } catch { return false } }

export default function LopNoiEm() {
  const s = useSyncExternalStore(dangKy, layKho)
  const gd = s.khoi?.gd ?? null
  const dangVao = !s.khoi && !!s.dangVao && !s.xong
  const cho = gd === 'cho' || dangVao
  const { xoay, style } = useXoay()
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
  const [sanhCu, setSanhCu] = useState(sanh)
  if (sanhCu !== sanh) { setSanhCu(sanh); if (!sanh) setBonDoi(null) }
  // Phòng chờ: xin toàn màn hình + khoá ngang ở lần chạm đầu (trình duyệt chỉ cho sau thao tác của em); không được thì xoay hình.
  useEffect(() => {
    if (!cho) return
    const f = () => {
      try { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape-primary')).catch(() => {}) } catch { /* không hỗ trợ */ }
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
  useEffect(() => { if (chatMo) chat.danhDauDoc() }, [chatMo, chat.ds.length]) // eslint-disable-line react-hooks/exhaustive-deps
  if (s.xong && s.toi) return <div className="lke xong" data-xoay={xoay ? '' : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }}><Suspense fallback={null}><ManVinhDanh ds={s.ds} kj={s.kj} toi={s.toi} onDong={dongKhoi} /></Suspense></div>
  if (dangVao) return <div className="lke cho dang-vao" data-xoay={xoay ? '' : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }} role="status"><p><i aria-hidden="true" />Đang vào phòng live…</p></div>
  if (!s.khoi || !s.toi || (cho && roiCho)) return null
  return (
    <div className={`lke${cho ? ' cho' : ''}`} data-xoay={xoay ? '' : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }}>
      <Suspense fallback={null}>
        {cho ? <TroGiuLua toi={s.toi} ds={s.ds} kenh={kenh} soEm={Math.max(1, s.ds.length)} mayYeu={mayYeu()} xoay={xoay} /> : null}
        {cho ? <button type="button" className="lke-roi" onClick={() => { setRoiCho(true); try { if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ } }}>Rời phòng chờ</button> : null}
        {!cho && (sanh || bonDoi) ? <ManBonDoi ds={s.ds} toi={s.toi} kj={s.kj} onDong={() => setBonDoi(null)} /> : null}
        {!cho && (sanh || !bonDoi) ? (
          <>
            {chatMo ? <CuaChatEm chat={chat} toiSbd={s.toi.sbd} onDong={() => setChatMo(false)} /> : <div className="lke-bong"><BongTinMoi tin={chat.tinMoi} /></div>}
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
