// SẢNH «SINH TỒN BỐN ĐỘI» — trò của phòng chờ CA KIỂM TRA (thầy 13/11: «Chuyển luôn game này sang cả phòng chờ của ca kiểm tra»; thay Đấu Nguyên Tử).
// Màn trò là ĐÚNG màn của phòng chờ Live theo khối (src/components/live-khoi/TroSinhTon.tsx, nạp lười khi em bấm «Chơi»); tệp này chỉ lo phần của ca:
//  · Thẻ trong phòng chờ, MỘT nút lớn «Chơi». Chưa bấm ⇒ 0 kết nối, chưa tải mảnh trò.
//  · Bấm ⇒ một WebSocket tới phòng của ca (lớp `MangDau` sẵn có: ping 25 giây, nối lại lùi dần, phòng đầy tự sang phòng kế), gói vào mang vé + `tro: 'st'`.
//    Phòng trả `st-vao` (em + đội + danh sách) ⇒ mở màn trò phủ kín (portal vào body; điện thoại xin toàn màn + khoá ngang khi máy cho, cầm dọc thì xoay hình).
//  · KHÔNG cản ca kiểm tra: `batDau` (màn cha thấy thầy bắt đầu) hoặc phòng báo đóng mã 4000 ⇒ NGAY trong lượt đó đóng WebSocket, gỡ trò, thoát toàn màn;
//    phòng báo thì gọi thêm `onBatDau()` để màn thi vào bài ngay. Trình tự giữ đúng như thẻ Đấu Nguyên Tử cũ.
// Kết quả trò chỉ để vui: không gửi điểm, không EXP, không có đáp án nào đi qua kênh này.
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import './sanh-sinh-ton.css'
import { layCauHinhMayChu } from '../../lib/may-chu-moi'
import { KHOA_NHO_MAY_YEU, dangCheDoMayYeu } from '../../lib/may-yeu'
import { PHIEN_BAN_ST, type KenhLop, type NguoiLop, type TinLop } from '../../lib/live-khoi/kieu'
import { MAU_XANH_THAN } from '../../lib/live-khoi/mau'
import { laDienThoai, thuocTinhXoay } from '../live/chieu-xoay'
import { MangDau, duongPhong, type TinMang } from './mang-sanh-ca'

const napTro = () => import('../live-khoi/TroSinhTon')
const TroSinhTon = lazy(napTro)

/** `chua` = chưa nối · `noi` = đang vào · `mo` = đang chơi · `mat` = rớt mạng (đang nối lại / đã thôi) · `tat` = trò tắt ở ca này · `het-ve` · `may-khac` · `day`. */
type Mang = 'chua' | 'noi' | 'mo' | 'mat' | 'tat' | 'het-ve' | 'may-khac' | 'day'
/** Bốn đội của trò: ký hiệu, tên, biến màu — khớp DOI_BPU (src/lib/bpu/phong.ts; test tests/sinh-ton-ca-man-1311.test.tsx khoá), chép ở đây để thẻ sảnh không kéo cả mảnh phòng học. */
const DOI_SANH = [['Na', 'Natri', '--p-cam'], ['K', 'Kali', '--p-tim-2'], ['Cu', 'Đồng', '--p-xanh'], ['Ca', 'Canxi', '--p-do']] as const
/** Số lần `MangDau` tự nối lại trước khi thôi. */
const LAN_NOI_LAI = 5

const laCamUng = () => { try { return matchMedia('(pointer: coarse)').matches } catch { return false } }
const mayYeu = (): boolean => { try { return dangCheDoMayYeu() || localStorage.getItem(KHOA_NHO_MAY_YEU) === '1' } catch { return false } }
/** Điện thoại: xin toàn màn + khoá ngang NGAY trong lượt bấm (cần thao tác của em). Máy tính / iOS không cho ⇒ bỏ qua, không báo lỗi. */
function vaoToanMan(): void {
  if (!laCamUng()) return
  try {
    const d = document.documentElement as HTMLElement & { requestFullscreen?: (o?: FullscreenOptions) => Promise<void> }
    if (document.fullscreenElement || !d.requestFullscreen) return
    void d.requestFullscreen({ navigationUI: 'hide' })
      .then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape'))
      .catch(() => { /* iOS / máy không cho khoá */ })
  } catch { /* không có Fullscreen API */ }
}
function raToanMan(): void {
  try { (screen.orientation as ScreenOrientation & { unlock?: () => void })?.unlock?.() } catch { /* bỏ qua */ }
  try { if (document.fullscreenElement) void document.exitFullscreen().catch(() => {}) } catch { /* bỏ qua */ }
}
/** Dòng `[số báo danh, tên, đội]` của phòng ⇒ người trong trò; sai dạng ⇒ null. */
function docNguoi(d: unknown): NguoiLop | null {
  if (!Array.isArray(d) || typeof d[0] !== 'string' || !d[0]) return null
  const doi = Number(d[2])
  return { sbd: d[0], ten: typeof d[1] === 'string' ? d[1] : '', doi: doi >= 0 && doi <= 3 ? Math.floor(doi) : 0 }
}
const docDs = (ds: unknown): NguoiLop[] => (Array.isArray(ds) ? ds.map(docNguoi).filter((n): n is NguoiLop => !!n) : [])

/** Trang đang dọc trên ĐIỆN THOẠI (máy không khoá ngang được) ⇒ xoay hình 90° như lớp nổi Live theo khối; máy tính / máy tính bảng không bao giờ bị xoay. */
function useXoay(): { xoay: boolean; style: CSSProperties } {
  const [k, setK] = useState<readonly [number, number]>(() => [window.innerWidth, window.innerHeight])
  useEffect(() => {
    const doi = () => setK((c) => (c[0] === window.innerWidth && c[1] === window.innerHeight ? c : [window.innerWidth, window.innerHeight]))
    doi()
    window.addEventListener('resize', doi)
    window.addEventListener('orientationchange', doi)
    return () => { window.removeEventListener('resize', doi); window.removeEventListener('orientationchange', doi) }
  }, [])
  const xoay = k[1] > k[0] && laDienThoai()
  return { xoay, style: xoay ? { width: k[1], height: k[0] } : {} }
}

interface ManTroProps { toi: NguoiLop; ds: NguoiLop[]; kenh: KenhLop; onThoat: () => void }
/** Màn trò phủ kín (ở document.body): khung xanh than cố định + màn Sinh Tồn dùng chung + nút «Thoát trò». Esc cũng thoát. */
function ManTro({ toi, ds, kenh, onThoat }: ManTroProps) {
  const { xoay, style } = useXoay()
  useEffect(() => {
    const phim = (e: KeyboardEvent) => { if (e.key === 'Escape') onThoat() }
    window.addEventListener('keydown', phim)
    return () => window.removeEventListener('keydown', phim)
  }, [onThoat])
  return createPortal(
    <div className="sst-man" role="dialog" aria-modal="true" aria-label="Trò Sinh Tồn bốn đội" data-xoay={xoay ? thuocTinhXoay() : undefined} style={{ ...(MAU_XANH_THAN as CSSProperties), ...style }}>
      <Suspense fallback={<p className="sst-tai" role="status">Đang mở trò…</p>}>
        <TroSinhTon toi={toi} ds={ds} kenh={kenh} soEm={Math.max(1, ds.length)} mayYeu={mayYeu()} xoay={xoay} imLang />
      </Suspense>
      <button type="button" className="sst-thoat" onClick={onThoat}>Thoát trò</button>
    </div>,
    document.body,
  )
}

export interface SanhSinhTonProps { maCa?: string; veDau?: string; batDau?: boolean; /** Phòng báo thầy vừa bấm Bắt đầu ⇒ màn thi vào bài ngay. */ onBatDau?: () => void }

export default function SanhSinhTon({ maCa, veDau, batDau, onBatDau }: SanhSinhTonProps) {
  const onBatDauRef = useRef(onBatDau)
  useLayoutEffect(() => { onBatDauRef.current = onBatDau })
  const [mang, setMang] = useState<Mang>('chua')
  const [lanMat, setLanMat] = useState(0)
  const [tran, setTran] = useState<{ toi: NguoiLop; ds: NguoiLop[] } | null>(null)
  const [dong, setDong] = useState(false)
  const mangRef = useRef<MangDau | null>(null)
  /** Lượt bấm «Chơi» hiện hành: thoát / dừng / bấm lại ⇒ tăng, lượt cũ đang chờ cấu hình máy chủ tự bỏ (không mở kết nối muộn). */
  const luot = useRef(0)
  const ngheTro = useRef(new Set<(tin: TinLop) => void>())
  const ketThuc = !!batDau || dong
  const coVe = !!(veDau && maCa)
  // Thầy bắt đầu ⇒ gỡ màn trò ngay trong lượt vẽ này (nhánh `ketThuc` bên dưới không còn vẽ trò; đây chỉ dọn trạng thái).
  if (ketThuc && tran) setTran(null)

  /** Kênh của màn trò: gói của em ⇒ `{ t: 'st', x }`; ảnh chụp của phòng ⇒ người nghe `tro`. Đối tượng CỐ ĐỊNH suốt đời thẻ (màn trò phụ thuộc theo tham chiếu). */
  const kenh = useMemo<KenhLop>(() => ({
    gui: (k, x) => { if (k === 'tro') mangRef.current?.gui({ t: 'st', x }) },
    nghe: (k, f) => {
      if (k !== 'tro') return () => {}
      ngheTro.current.add(f)
      return () => { ngheTro.current.delete(f) }
    },
  }), [])

  /** Đóng kết nối + thoát toàn màn NGAY (gọi được trong lúc nhận gói của phòng). */
  const dungHet = useCallback(() => { luot.current++; mangRef.current?.dong(); mangRef.current = null; raToanMan() }, [])

  const nhanTin = useCallback((t: TinMang) => {
    if (t.k === 'mo') { setLanMat(0); return }
    if (t.k === 'mat') {
      setMang('mat'); setLanMat(t.lan)
      // Thôi nối lại ⇒ gỡ trò, trả màn hình; em bấm «Chơi» để thử lại.
      if (t.lan >= LAN_NOI_LAI) { dungHet(); setTran(null) }
      return
    }
    if (t.k === 'dong') {
      // Thầy vừa bấm Bắt đầu: dừng trò trong cùng lượt + màn cha vào bài ngay.
      if (t.ma === 4000) { dungHet(); setDong(true); onBatDauRef.current?.(); return }
      dungHet(); setTran(null)
      setMang(t.ma === 4003 ? 'het-ve' : t.ma === 4002 ? 'may-khac' : t.ma === 4009 ? 'day' : 'tat')
      return
    }
    const j = t.j
    switch (j.t) {
      case 'lop': if (j.k === 'tro') for (const f of ngheTro.current) f(j as unknown as TinLop); return
      case 'st-vao': { const toi = docNguoi(j.toi); if (!toi) return; setMang('mo'); setLanMat(0); setTran({ toi, ds: docDs(j.ds) }); return }
      case 'st-ds': { const ds = docDs(j.ds); setTran((x) => (x ? { toi: x.toi, ds } : x)); return }
      // Phòng báo trước khi đóng: thầy bắt đầu ⇒ như mã 4000; công tắc tắt ⇒ trò nghỉ ở ca này.
      case 'dong':
        if (j.ly === 'bat-dau') { dungHet(); setDong(true); onBatDauRef.current?.() }
        else { dungHet(); setTran(null); setMang('tat') }
        return
    }
  }, [dungHet])

  const choi = useCallback(async () => {
    if (!veDau || !maCa || ketThuc) return
    vaoToanMan()
    void napTro().catch(() => { /* mảnh trò tải hỏng ⇒ ô dự phòng của phòng chờ lo */ })
    mangRef.current?.dong(); mangRef.current = null
    const toiLuot = ++luot.current
    setMang('noi'); setLanMat(0)
    let goc = ''
    try { goc = (await layCauHinhMayChu()).URL || '' } catch { /* không đọc được cấu hình */ }
    if (toiLuot !== luot.current) return // em đã thoát / thầy đã bắt đầu trong lúc chờ
    if (!goc) { setMang('mat'); setLanMat(LAN_NOI_LAI); raToanMan(); return }
    const m = new MangDau(duongPhong(goc, maCa), () => ({ t: 'vao', v: PHIEN_BAN_ST, tro: 'st', ve: veDau }), nhanTin)
    mangRef.current = m; m.mo()
  }, [veDau, maCa, ketThuc, nhanTin])

  const thoat = useCallback(() => { dungHet(); setTran(null); setMang('chua') }, [dungHet])

  // Thầy bắt đầu (màn cha báo) ⇒ đóng kết nối + thoát toàn màn trước khi trình duyệt vẽ; rời màn ⇒ đóng hết.
  useLayoutEffect(() => { if (ketThuc) dungHet() }, [ketThuc, dungHet])
  useEffect(() => () => dungHet(), [dungHet])

  if (ketThuc) {
    return <section className="sst-the" aria-label="Trò chơi trong lúc chờ">
      <div className="sst-dong" role="status"><strong>Thầy đã bắt đầu thi</strong><span>Trò Sinh Tồn đã dừng. Em đang được đưa vào bài…</span></div>
      {/* Dải nhẹ 1,5 giây (chỉ CSS, không hẹn giờ): trò đã dừng + màn cha đã vào bài cùng lượt — dải chỉ phủ lúc bài đang tải. */}
      {createPortal(<div className="sst-sap-thi" role="status" aria-label="Sắp vào thi">Sắp vào thi<i aria-hidden="true">·</i><b>3</b><b>2</b><b>1</b></div>, document.body)}
    </section>
  }

  const dangNoi = mang === 'noi' || (mang === 'mat' && lanMat < LAN_NOI_LAI)
  const phu = !coVe || mang === 'tat' ? 'Trò chơi chưa mở ở ca này. Em vẫn vào bài khi thầy bắt đầu.'
    : mang === 'noi' ? 'Đang vào trò…'
    : mang === 'mat' ? (lanMat >= LAN_NOI_LAI ? 'Chưa nối được trò chơi. Em bấm «Chơi» để thử lại.' : `Mất kết nối — đang nối lại (lần ${lanMat + 1})…`)
    : mang === 'het-ve' ? 'Lượt vào trò của ca này đã hết hạn. Em vẫn vào bài khi thầy bắt đầu.'
    : mang === 'may-khac' ? 'Em vừa mở trò ở máy hoặc tab khác. Bấm «Chơi» để chơi ở máy này.'
    : mang === 'day' ? 'Trò chơi đang đủ người. Em bấm «Chơi» để thử lại sau ít phút.'
    : 'Bấm là vào trận ngay · thầy bắt đầu thì trò tự dừng'

  return <section className="sst-the" aria-label="Trò chơi trong lúc chờ">
    <div><div className="sst-mat">CHƠI MỘT CHÚT TRONG LÚC CHỜ</div><h2>Sinh Tồn bốn đội</h2></div>
    <p className="sst-ta">Mỗi em một bé ma đeo súng tự bắn. Vuốt để chạy, hạ đối thủ để súng lên cấp; thiếu bạn thì Máy vào thay.</p>
    <ul className="sst-doi" aria-label="Bốn đội">
      {DOI_SANH.map(([ky, ten, mau]) => <li key={ky} style={{ ['--d' as string]: `var(${mau})` } as CSSProperties}><i aria-hidden="true" />{ky} · Đội {ten}</li>)}
    </ul>
    <button type="button" className="sst-nut" disabled={!coVe || dangNoi || mang === 'mo' || mang === 'tat' || mang === 'het-ve'} onClick={() => void choi()}>Chơi</button>
    <p className="sst-phu" role="status">{dangNoi ? <i className="sst-cham" aria-hidden="true" /> : null}{phu}</p>
    {tran && <ManTro toi={tran.toi} ds={tran.ds} kenh={kenh} onThoat={thoat} />}
  </section>
}
