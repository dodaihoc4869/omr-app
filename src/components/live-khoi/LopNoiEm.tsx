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

/** Trang đang dọc ⇒ xoay hình 90° (như `.bpu-hs[data-xoay]`); `theoMan` = chỉ xoay khi màn Bình Phản Ứng / bảng live bên dưới đang xoay. */
function useXoay(theoMan: boolean): { xoay: boolean; style: CSSProperties } {
  const [k, setK] = useState<readonly [number, number, boolean]>(() => [window.innerWidth, window.innerHeight, false])
  useEffect(() => {
    const doi = () => { const x = !!document.querySelector('.bpu-hs[data-xoay], .lv[data-xoay]'); setK((c) => (c[0] === window.innerWidth && c[1] === window.innerHeight && c[2] === x ? c : [window.innerWidth, window.innerHeight, x])) }
    doi()
    window.addEventListener('resize', doi)
    window.addEventListener('orientationchange', doi)
    const mo = theoMan ? new MutationObserver(doi) : null
    mo?.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['data-xoay'] })
    return () => { window.removeEventListener('resize', doi); window.removeEventListener('orientationchange', doi); mo?.disconnect() }
  }, [theoMan])
  const xoay = theoMan ? k[2] : k[1] > k[0]
  return { xoay, style: xoay ? { width: k[1], height: k[0] } : {} }
}
const mayYeu = (): boolean => { try { return localStorage.getItem('ddh.mayYeu') === '1' } catch { return false } }

export default function LopNoiEm() {
  const s = useSyncExternalStore(dangKy, layKho)
  const gd = s.khoi?.gd ?? null
  const dangVao = !s.khoi && !!s.dangVao && !s.xong
  const cho = gd === 'cho' || dangVao
  const { xoay, style } = useXoay(!cho)
  const [bonDoi, setBonDoi] = useState<'chao' | 'xem' | null>(null)
  const [chatMo, setChatMo] = useState(false)
  /** Em tự rời phòng chờ (về màn Bình Phản Ứng bên dưới, đóng được như thường); thầy bấm Bắt đầu thì vẫn vào live. */
  const [roiCho, setRoiCho] = useState(false)
  const gdCu = useRef<typeof gd>(null)
  // Thầy vừa bấm Bắt đầu (cho → dang), hoặc em vào khi thầy đã bắt đầu ⇒ màn «Bốn đội» một lần.
  useEffect(() => { if (gd === 'dang' && gdCu.current !== 'dang') { guiTho({ t: 'lop-xin' }); setBonDoi('chao') } gdCu.current = gd }, [gd])
  // Phòng chờ: xin toàn màn hình + khoá ngang ở lần chạm đầu (trình duyệt chỉ cho sau thao tác của em); không được thì xoay hình.
  useEffect(() => {
    if (!cho) return
    const f = () => {
      try { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().then(() => (screen.orientation as unknown as { lock?: (o: string) => Promise<void> }).lock?.('landscape')).catch(() => {}) } catch { /* không hỗ trợ */ }
    }
    window.addEventListener('pointerdown', f, { once: true })
    return () => window.removeEventListener('pointerdown', f)
  }, [cho])
  const chat = useChatLop(gd === 'dang' ? kenh : null)
  useEffect(() => { if (chatMo) chat.danhDauDoc() }, [chatMo, chat.ds.length]) // eslint-disable-line react-hooks/exhaustive-deps
  if (s.xong && s.toi) return <div className="lke xong" data-xoay={xoay ? '' : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }}><Suspense fallback={null}><ManVinhDanh ds={s.ds} kj={s.kj} toi={s.toi} onDong={dongKhoi} /></Suspense></div>
  if (dangVao) return <div className="lke cho dang-vao" data-xoay={xoay ? '' : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }} role="status"><p><i aria-hidden="true" />Đang vào phòng live…</p></div>
  if (!s.khoi || !s.toi || (cho && roiCho)) return null
  return (
    <div className={`lke${cho ? ' cho' : ''}`} data-xoay={xoay ? '' : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }}>
      <Suspense fallback={null}>
        {cho ? <TroGiuLua toi={s.toi} ds={s.ds} kenh={kenh} soEm={Math.max(1, s.ds.length)} mayYeu={mayYeu()} xoay={xoay} /> : null}
        {cho ? <button type="button" className="lke-roi" onClick={() => { setRoiCho(true); try { if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ } }}>Rời phòng chờ</button> : null}
        {!cho && bonDoi ? <ManBonDoi ds={s.ds} toi={s.toi} kj={s.kj} onDong={() => setBonDoi(null)} tuDong={bonDoi === 'chao' ? 3000 : undefined} /> : null}
        {!cho && !bonDoi ? (
          <>
            {chatMo ? <CuaChatEm chat={chat} toiSbd={s.toi.sbd} onDong={() => setChatMo(false)} /> : <div className="lke-bong"><BongTinMoi tin={chat.tinMoi} /></div>}
            <div className="lke-mep" role="group" aria-label="Live theo khối">
              <NutChatEm moi={chat.moi} onMo={() => setChatMo((c) => !c)} />
              <button type="button" className="lke-doi" aria-label="Bốn đội" title="Bốn đội" onClick={() => { guiTho({ t: 'lop-xin' }); setBonDoi('xem') }}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3c1 4 5 6 5 11a5 5 0 0 1-10 0c0-2 1-3 2-5 1 2 2 2 2 2 0-3 0-5 1-8z" /></svg>
              </button>
            </div>
          </>
        ) : null}
      </Suspense>
    </div>
  )
}
