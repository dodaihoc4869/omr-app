// BÌNH PHẢN ỨNG — BẢNG CHIẾU (máy thầy, toàn màn qua portal). Bản vẽ thầy duyệt: docs/ban-ve-binh-phan-ung-0611 (ảnh b01–b12), nguyên mẫu nguyen-mau.html.
// Mở từ (1) bước Điểm danh (thay bản chiếu điểm danh cũ — điểm danh là MỞ MÀN trò chơi) hoặc (2) phím / nút P «Bình Phản Ứng» trên mọi tờ chiếu (câu đang chiếu).
// Nối phòng `PhongBinhPhanUng` bằng vé thầy (`/gv/bpu/mo`), nhận `viewBang` mỗi khi có thay đổi. Gọi lên bảng: lõi chọn em đã chốt (`layEmChieu`), lý do 3 dòng
// từ dữ liệu thật (src/lib/bpu/ly-do.ts). TỰ ĐỘNG (07/11): tờ chuyển câu ⇒ lượt mới, giờ theo câu (máy chủ kẹp 60–180 s); bảng → / «Câu tiếp» ⇒ tờ sang câu sau.
// Phím: → ← · Space · Enter · D · F · N · M · K · V · H · ? · Esc. Mảnh chỉ máy thầy ⇒ nằm ngoài precache (vite.config globIgnores).
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { goiLenh } from '../../lib/goi-lenh-thay'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { taoQr } from '../../lib/ma-qr'
import { MAU_CHIEU } from '../../lib/bpu/mau-chieu'
import { DOI_BPU, KJ, kyHieu, tenNgan, type ViewBang } from '../../lib/bpu/phong'
import { Chu, HinhDe, VungVietBang } from './bang-phu'
import { HANG_DS, dungOng, mauDoi, nhanOng } from './ong-ket-qua'
import { lyDoLenBang } from '../../lib/bpu/ly-do'
import { DAY_LUOI, DAY_LUOI_TOAN_MAN, KHE, TRAI_LUOI, boLuoi, tenGoiLop, type Luoi } from '../../lib/bpu/luoi'
import { layEmChieu } from '../../lib/ung-vien-chieu'
import type { Question } from '../../game/than-thu-v2/core'
import { BINH, VeBang, type CanhBang } from './bang-ve'
import type { CauDayHoc } from '../../lib/day-hoc-len-bang'
import './bpu-bang.css'
// Phông chiếu (09/11): Be Vietnam Pro 500 (đề — nét đủ dày cho máy chiếu, không chói) + 800 (số, tên) — chỉ tải khi bảng mở.
import '@fontsource/be-vietnam-pro/vietnamese-500.css'
import '@fontsource/be-vietnam-pro/latin-500.css'
import '@fontsource/be-vietnam-pro/vietnamese-800.css'
import '@fontsource/be-vietnam-pro/latin-800.css'

/** Chọn câu ngay trên bảng (09/11) — mảnh riêng, tải khi thầy bấm «Xong điểm danh» / «Chọn câu». */
const ChonCauBpu = lazy(() => import('./ChonCauBpu'))

type Man = 'diem-danh' | 'tra-loi' | 'goi' | 'lam-bang' | 'mo' | 'dua' | 'vinh-danh'
type Em = ViewBang['ds'][number]
const X_LUA_DD4 = [1290, 1430, 1570, 1710], X_LUA_DD2 = [1390, 1610]
const X_LUA_DUA4 = [210, 465, 720, 975], X_LUA_DUA2 = [400, 785]
/** Các đội đang chơi (2 khi lớp dưới 12 em, không thì 4). */
const dsDoi = (v: ViewBang | null) => (v?.soDoi === 2 ? [0, 1] : [0, 1, 2, 3])
const coMayYeu = () => (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches) || document.documentElement.classList.contains('may-yeu')
const gio = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const gioPhut = (ms: number | null) => { if (!ms) return ''; const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const diemDoi = (v: ViewBang, d: number) => v.ds.reduce((s, e) => s + (e.doi === d ? e.kj : 0), 0) + (v.doiThuong[d] ?? 0)
const xepDoi = (v: ViewBang) => dsDoi(v).map((d) => { const coMat = v.ds.filter((e) => e.doi === d && e.vao).length, tong = diemDoi(v, d); return { d, tong, tb: coMat ? tong / coMat : tong } }).sort((a, b) => b.tong - a.tong || b.tb - a.tb)

function viTriO(i: number, L: Luoi) { return { x: TRAI_LUOI + (i % L.cot) * (L.w + KHE) + L.w / 2, y: L.top + Math.floor(i / L.cot) * (L.h + KHE) + L.h / 2 } }

function Ngoc({ mau, chu }: { mau: string; chu?: string }) {
  return (
    <svg viewBox="0 0 100 120" aria-hidden="true" style={{ ['--g' as string]: mau }}>
      <polygon className="bpu-ngoc-than" points="50,2 96,30 96,90 50,118 4,90 4,30" />
      <polygon className="bpu-ngoc-sang" points="50,2 96,30 74,40 50,26 26,40 4,30" />
      <polygon className="bpu-ngoc-sang mo" points="96,30 96,90 74,80 74,40" />
      <polygon className="bpu-ngoc-sang vua" points="4,30 26,40 26,80 4,90" />
      <polygon className="bpu-ngoc-toi" points="4,90 26,80 50,94 74,80 96,90 50,118" />
      <polygon className="bpu-ngoc-sang mo" points="26,40 50,26 50,58" />
      <polygon className="bpu-ngoc-vien" points="50,2 96,30 96,90 50,118 4,90 4,30" />
      {chu ? <text x="50" y="72" textAnchor="middle" fontSize={chu.length > 1 ? 32 : 40} fontWeight={900} className="bpu-ngoc-chu">{chu}</text> : null}
    </svg>
  )
}
const Lua = () => <svg className="bpu-lua" viewBox="0 0 40 56" aria-hidden="true"><path className="ngoai" d="M20 2C27 14 37 22 37 36A17 17 0 0 1 3 36C3 24 12 17 20 2Z" /><path className="trong" d="M20 22C24 30 28 33 28 41A8 8 0 0 1 12 41C12 34 16 30 20 22Z" /></svg>
const Sao = ({ x, y, d }: { x: number; y: number; d: number }) => <svg className="bpu-sao" viewBox="-10 -10 20 20" style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${d}s` }} aria-hidden="true"><path d="M0-10C1.2-1.2 1.2-1.2 10 0C1.2 1.2 1.2 1.2 0 10C-1.2 1.2-1.2 1.2-10 0C-1.2-1.2-1.2-1.2 0-10Z" /></svg>

function MaQr({ text }: { text: string }) {
  const q = useMemo(() => taoQr(text), [text])
  if (!q) return null
  const n = q.length
  return <svg className="bpu-qr" viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label="Mã QR điểm danh"><rect x={-2} y={-2} width={n + 4} height={n + 4} className="nen" />{q.flatMap((hang, y) => hang.map((o, x) => (o ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} /> : null)))}</svg>
}

export interface PropsBang {
  buoiId: string
  ma?: string | null
  linkQr?: string | null
  /** Câu đang chiếu (tờ chuyển câu / phím P) ⇒ mở lượt ngay. Đổi `luot` (số tăng) ⇒ mở lượt mới cho cùng câu / câu khác. */
  qid?: string | null
  luot?: number
  /** Giây ước tính của câu (tờ chiếu tính; máy chủ kẹp 60–180). */
  giay?: number
  /** Tin tự động (tờ vừa chuyển câu): phòng / câu không gửi được ⇒ `onKhongMo` thay vì che tờ bằng màn lỗi. */
  tuDong?: boolean
  onDong: () => void
  /** Máy chủ tắt Bình Phản Ứng ⇒ nơi gọi lùi về màn cũ. */
  onTat?: () => void
  /** Bảng ⇒ tờ: câu sau (1) / câu trước (-1). Không có (mở từ Điểm danh) ⇒ không hiện «Câu tiếp». */
  onToi?: (d: 1 | -1) => void
  /** Phím G: đóng bảng, tờ hiện lời giải thu gọn. */
  onGiai?: () => void
  /** Xin tờ HTML lời giải thu gọn của câu đang chiếu ⇒ hiện NGAY TRÊN BẢNG (rỗng ⇒ lùi `onGiai`: về tờ). */
  layGiai?: () => Promise<string>
  /** `caPhong` = cả phòng không mở được (ca mở, mất mạng); không = chỉ câu này không gửi được. */
  onKhongMo?: (chu: string, caPhong: boolean) => void
  /** (08/11) Gọi em xong ⇒ giao em cho TỜ CHIẾU CŨ (màn lên bảng nguyên bản); trả false ⇒ không có tờ, bảng tự lo như cũ. */
  lenBangTo?: (em: { sbd: string; ten: string; goiNgay?: boolean; mau?: string; doi?: string }) => boolean
  /** (08/11) Đăng kí nơi nhận «Đạt / Chưa đạt» thầy bấm trên tờ ⇒ bảng ghi kết quả + mở đáp án. */
  dangKyChamTo?: (f: ((dat: boolean) => void) | null) => void
  /** (09/11) Chọn câu ngay trên bảng ⇒ dựng tờ + chiếu (trả lời báo lỗi, rỗng = đã chiếu). Không có ⇒ không hiện «Chọn câu». */
  onChieuCau?: (ds: CauDayHoc[]) => Promise<string>
  /** (09/11) Mở từ nút Điểm danh ⇒ LUÔN hiện màn điểm danh (kể cả phòng đang có lượt) tới khi thầy chọn câu. */
  diemDanh?: boolean
  /** (09/11) Nơi gắn bảng (khung của gốc chung gan-gv) ⇒ thu nhỏ / ẩn khung là ẩn đúng bảng. Không có ⇒ body. */
  gocPortal?: HTMLElement | null
  /** (09/11) «Hôm nay làm gì?» sau điểm danh: Kiểm tra đầu giờ / Chữa câu khó / Kiểm tra ôn tập ⇒ tấm buổi dạy (gan-gv). */
  onHoatDong?: (hd: 'dau-gio' | 'chua-cau' | 'on-tap') => void
  /** (09/11) «Kết thúc buổi học» ở «Hôm nay làm gì?» — trả câu báo lỗi (rỗng = xong). */
  onKetThuc?: (buoiId: string) => Promise<string>
}

export default function BangBinhPhanUng({ buoiId, ma, linkQr, qid, luot = 0, tuDong = false, onDong, onTat, onToi, onGiai, layGiai, onKhongMo, lenBangTo, dangKyChamTo, onChieuCau, gocPortal, diemDanh = false, onHoatDong, onKetThuc }: PropsBang) {
  // Điểm danh (không có câu): mã + QR hiện NGAY từ props, không chờ phòng; phòng lỗi ⇒ lùi bản chiếu cũ (onTat).
  const [v, setV] = useState<ViewBang | null>(() => (qid ? null : { t: 'bang', buoiId, lop: '', soLuot: 0, ketThuc: false, doiThuong: [0, 0, 0, 0], doiDu: null, soDoi: 4, vuaVao: [], lichSu: [], ds: [], luot: null }))
  const laDiemDanh = useRef(!qid)
  laDiemDanh.current = !qid // một bảng đi suốt điểm danh → các lượt (09/11): theo câu HIỆN TẠI, không theo lúc dựng
  /** Bảng chọn câu đang mở (09/11). Câu mới về (qid đổi) ⇒ tự đóng. */
  const [chon, setChon] = useState<false | 'hd' | 'cau'>(false)
  useEffect(() => { setChon(false) }, [qid, luot])
  /** Bảng đang thu vào tờ cũ (em lên bảng): phím không xử lý ở bảng, vẽ canvas tạm dừng. */
  const anRef = useRef(false)
  /** Đã giao em cho tờ cũ (bảng đang thu / đã ẩn) ⇒ không vẽ màn gọi tên / vùng em viết của bảng (tờ lo phần ấy). */
  const [giaoTo, setGiaoTo] = useState(false)
  const tuDongRef = useRef(tuDong)
  tuDongRef.current = tuDong
  const khongMoRef = useRef(onKhongMo)
  khongMoRef.current = onKhongMo
  // Điều khiển từ xa (bước «Đang chiếu» trên máy thầy khác): phòng chuyển lệnh tới bảng ⇒ bảng nào nối tờ chiếu thì làm.
  /** Vừa bấm sang câu (→ ← / «Câu tiếp» / máy điều khiển) ⇒ đề cũ mờ NGAY tới khi lượt mới về (thầy 07/11 «chuyển câu tiếp chậm»). */
  const [dangSang, setDangSang] = useState(false)
  /** THẺ PHƯƠNG ÁN (thầy 07/11 «4 đáp án ẩn đi, bấm M thì hiện»): mặc định ẩn để đề chiếm nhiều chỗ nhất; mở đáp án cũng KHÔNG tự hiện — kết quả nằm cột phải, bên trái chỉ đề (thầy 07/11). */
  const [hienPa, setHienPa] = useState(false)
  /** TẮT VÙNG EM VIẾT (thầy 07/11 «tắt máy chiếu ở phần học sinh viết lên bảng» · «chỉ tắt phần hs lên bảng làm thôi»): pha «làm bảng» ⇒ nửa phải
   *  (cột kết quả) đen — máy chiếu không rọi lên chỗ em viết, đề bên trái vẫn sáng; phím D / F / N / Space vẫn chạy; B (hoặc chạm) bật lại, B lần nữa tắt. */
  const [batLai, setBatLai] = useState(false)
  const batLaiRef = useRef(false)
  batLaiRef.current = batLai
  const sangCau = useCallback((d: 1 | -1) => { setDangSang(true); onToi?.(d) }, [onToi])
  /** LỜI GIẢI TRÊN BẢNG (thầy 07/11 «bấm lời giải lại hiện bảng chiếu cũ»): G / nút / máy điều khiển ⇒ hộp lời giải thu gọn đè chỗ đề; G lần nữa ẩn. */
  const [giai, setGiai] = useState<string | null>(null)
  const giaiRef = useRef<HTMLDivElement>(null)
  const coGiai = !!(layGiai || onGiai)
  const batGiai = useCallback(async () => {
    if (giai != null) { setGiai(null); return }
    const html = layGiai ? await layGiai() : ''
    if (html.trim()) setGiai(html); else onGiai?.()
  }, [giai, layGiai, onGiai])
  const dkRef = useRef({ onToi: sangCau, onGiai: batGiai as () => void })
  dkRef.current = { onToi: sangCau, onGiai: () => void batGiai() }
  const [loi, setLoi] = useState<{ chu: string; chan?: boolean } | null>(null)
  const [manPhu, setManPhu] = useState<'dua' | 'vinh-danh' | null>(null)
  const [an, setAn] = useState(false)
  const [moPhim, setMoPhim] = useState(false)
  // TOÀN MÀN HÌNH (thầy 07/11, ảnh máy chiếu: thanh tác vụ Windows che đáy bảng) — nút / phím F; trình duyệt chỉ cho khi thầy bấm.
  const [toanMan, setToanMan] = useState(() => typeof document !== 'undefined' && !!document.fullscreenElement)
  useEffect(() => { const doi = () => setToanMan(!!document.fullscreenElement); document.addEventListener('fullscreenchange', doi); return () => document.removeEventListener('fullscreenchange', doi) }, [])
  const doiToanMan = useCallback(() => { try { if (document.fullscreenElement) void document.exitFullscreen?.(); else void document.documentElement.requestFullscreen?.().catch(() => {}) } catch { /* trình duyệt không hỗ trợ */ } }, [])
  // TỰ TOÀN MÀN HÌNH (thầy 07/11 «màn này full màn hình luôn, full cả lúc gọi hs lên bảng»): xin ngay khi bảng mở (vừa có thao tác bấm Chiếu / chuyển câu —
  // trình duyệt chỉ cho trong vài giây sau thao tác); bị từ chối ⇒ lần chạm / bấm phím đầu tiên trên bảng sẽ bật. Mọi màn (trả lời, gọi, làm bảng…) chung một bảng.
  const xinToanMan = useCallback(() => { try { if (!document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {}) } catch { /* không hỗ trợ */ } }, [])
  useEffect(() => {
    xinToanMan()
    const lai = (e: Event) => { if (e instanceof KeyboardEvent && (e.key === 'Escape' || e.key.toLowerCase() === 'f')) return; if (!document.fullscreenElement) xinToanMan() }
    window.addEventListener('pointerdown', lai, true)
    window.addEventListener('keydown', lai, true)
    return () => { window.removeEventListener('pointerdown', lai, true); window.removeEventListener('keydown', lai, true) }
  }, [xinToanMan])
  const [nay, setNay] = useState(() => Date.now())
  const [toast, setToast] = useState<string | null>(null)
  const [ung, setUng] = useState<{ ds: string[]; soi: string | null } | null>(null)
  const [dangGoi, setDangGoi] = useState(false)
  const [k, setK] = useState(1)
  const goc = useRef<HTMLDivElement>(null)
  const san = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const cvTren = useRef<HTMLCanvasElement>(null)
  const ve = useRef<VeBang | null>(null)
  const ws = useRef<WebSocket | null>(null)
  const truoc = useRef<ViewBang | null>(null)
  const daMoLuot = useRef('')
  const yeu = useMemo(coMayYeu, [])
  const hai = v?.soDoi === 2
  const X_LUA_DD = hai ? X_LUA_DD2 : X_LUA_DD4, X_LUA_DUA = hai ? X_LUA_DUA2 : X_LUA_DUA4
  const deRef = useRef<HTMLDivElement>(null)
  const khungDe = useRef<HTMLDivElement>(null)
  // CHỮ ĐỀ CHUẨN (thầy 07/11 «hiển thị đề chuẩn xác kí tự»): dùng ĐÚNG hàm chữ của tờ chiếu (`chuDeChieu`: chỉ số dưới, điện tích Fe³⁺ SO₄²⁻, mũi tên
  // phản ứng, số mũ). Mảnh tờ chiếu đã nạp khi thầy chiếu ⇒ nạp lười, không thêm byte mở app; chưa nạp xong ⇒ `ChuHoa` tạm.
  const [chuDe, setChuDe] = useState<((s: string) => string) | null>(null)

  const gui = useCallback((t: Record<string, unknown>) => { const w = ws.current; if (w && w.readyState === 1) { try { w.send(JSON.stringify(t)) } catch { /* rớt */ } } }, [])

  // Mở phòng (vé thầy) + nối WebSocket; rớt ⇒ nối lại.
  useEffect(() => {
    let dung = false, hen: ReturnType<typeof setTimeout> | undefined, ping: ReturnType<typeof setInterval> | undefined, lan = 0, daCoTin = false
    async function noi() {
      const r = await goiLenh('/gv/bpu/mo', { buoiId }, 'Máy chủ chưa có Bình Phản Ứng.')
      if (dung) return
      // Mở từ bước Điểm danh mà phòng chưa mở được (mất mạng, lớp có ca mở, máy chủ tắt): KHÔNG lùi bản chiếu cũ nữa (thầy 07/11 «bỏ hẳn đi») —
      // bảng vẫn chiếu mã + QR (mã do app thầy truyền vào), báo một dòng và tự thử lại.
      // Tin tự động mà chưa có bảng nào trên màn ⇒ không che tờ bằng màn lỗi: báo một dòng, đóng bảng.
      if (!r.ok && tuDongRef.current && !daCoTin) { khongMoRef.current?.(`Chưa gửi được câu xuống máy em: ${r.chu}`, true); return }
      if (!r.ok) { setLoi({ chu: r.chu }); hen = setTimeout(() => void noi(), 8000); return }
      if (r.du.ok === false) {
        if (r.du.lyDo === 'tat' && !laDiemDanh.current) { onTat?.(); return }
        if (tuDongRef.current) { khongMoRef.current?.(String(r.du.error ?? 'Chưa mở được Bình Phản Ứng.'), true); return }
        setLoi({ chu: String(r.du.error ?? 'Chưa mở được Bình Phản Ứng.'), chan: r.du.lyDo === 'ca-mo' }); if (laDiemDanh.current) hen = setTimeout(() => void noi(), 15000); return
      }
      setLoi(null)
      const goc0 = (await layDiaChiMayChu('')) || 'https://omr.ttadodaihoc.workers.dev'
      const w = new WebSocket(`${goc0.replace(/^http/, 'ws')}/bpu/phong?ve=${encodeURIComponent(String(r.du.ve))}`)
      ws.current = w
      w.onopen = () => { lan = 0; w.send('{"t":"chao"}'); clearInterval(ping); ping = setInterval(() => { try { w.send('{"t":"ping"}') } catch { /* rớt */ } }, 45_000) }
      w.onmessage = (e) => { if (typeof e.data !== 'string') return; try { const m = JSON.parse(e.data) as { t?: string }; if (m.t === 'bang') { daCoTin = true; setV(m as unknown as ViewBang) } else if (m.t === 'dk') { const l = (m as { lenh?: string }).lenh, d = dkRef.current; if (l === 'toi') d.onToi?.(1); else if (l === 'lui') d.onToi?.(-1); else if (l === 'giai') d.onGiai?.() } } catch { /* bỏ qua */ } }
      w.onclose = () => { if (ws.current !== w) return; ws.current = null; clearInterval(ping); if (dung) return; hen = setTimeout(() => void noi(), [1500, 3000, 6000, 12000][Math.min(lan++, 3)]) }
      w.onerror = () => { try { w.close() } catch { /* đã đóng */ } }
    }
    void noi()
    return () => { dung = true; clearTimeout(hen); clearInterval(ping); try { ws.current?.close() } catch { /* đã đóng */ } ws.current = null }
  }, [buoiId, onTat])

  // Phím / nút P trên tờ chiếu ⇒ mở lượt cho câu đang chiếu (một lần mỗi lần bấm).
  useEffect(() => {
    if (!qid || !v) return
    const khoa = `${qid}|${luot}`
    if (daMoLuot.current === khoa) return
    daMoLuot.current = khoa
    // Mở lại tờ / bấm P trên ĐÚNG câu đang chạy (Esc rồi mở lại, thầy 07/11) ⇒ nối lại lượt đang có, không chốt-mở lượt mới (giữ giờ, giữ bài các em đã gửi).
    // Câu đã mở đáp án: tin tự động chỉ nối lại; thầy bấm P thì hỏi lại cả lớp (lượt mới).
    const dang = v.luot
    if (dang && dang.qid === qid && (dang.pha !== 'mo' || tuDongRef.current)) return
    setManPhu(null); setUng(null)
    void goiLenh('/gv/bpu/luot', { buoiId, qid, hanGiay: 0 /* 08/11 thầy «bỏ đếm thời gian»: lượt không giới hạn giờ */ }, 'Máy chủ chưa có Bình Phản Ứng.').then((r) => {
      const chu = !r.ok ? r.chu : r.du.ok === false ? String(r.du.error ?? 'Chưa gửi được câu xuống máy em.') : ''
      if (!chu) { setLoi(null); return }
      // Câu không gửi được (ngoài kho, câu giữ cho ca kiểm tra, ca mở): đóng bảng, thầy chữa trên tờ như thường; câu sau vẫn tự gửi.
      if (onKhongMo && (tuDongRef.current || (r.ok && r.du.ok === false))) { onKhongMo(chu, r.ok && r.du.lyDo === 'ca-mo'); return }
      setLoi({ chu })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qid, luot, buoiId, v])

  const l = v?.luot ?? null
  const man: Man = manPhu ?? (diemDanh || !l ? 'diem-danh' : l.pha)
  /** Em đang viết bảng và thầy chưa bật lại vùng phải ⇒ vùng phải tối, chỉ còn thẻ góc + hiệu ứng tiếp sức. */
  const vietBang = man === 'lam-bang' && !batLai && !moPhim && !giaoTo
  const ds = v?.ds ?? []
  // Dải tên: CHỈ các em có mặt (thầy 07/11), tối đa hai hàng; thứ tự giữ theo danh sách lớp.
  const hien = useMemo(() => (v?.ds ?? []).filter((e) => e.vao), [v?.ds])
  const L = useMemo(() => boLuoi(hien.length, toanMan ? DAY_LUOI_TOAN_MAN : DAY_LUOI), [hien.length, toanMan])
  const tenGoi = useMemo(() => tenGoiLop(v?.ds ?? []), [v?.ds])
  // CỠ CHỮ: một cỡ chung theo tên thường gặp (85% số tên nằm trọn một dòng — đo bằng canvas theo phông thật; không đo được ⇒ ước 0,62 em/kí tự);
  // tên dài hơn (Nguyên, Trường…) thì riêng ô đó thu chữ cho vừa. Ô hai chữ («Minh Anh») xuống hai dòng, không bẻ giữa chữ.
  const coChu = useMemo(() => {
    let ctx: CanvasRenderingContext2D | null = null
    try { ctx = document.createElement('canvas').getContext('2d') } catch { /* jsdom */ }
    if (ctx) ctx.font = `800 100px 'Be Vietnam Pro', ${getComputedStyle(document.body).fontFamily || 'sans-serif'}`
    const rong = new Map<string, number>()
    for (const e of hien) { const t = tenGoi.get(e.sbd) ?? ''; rong.set(e.sbd, Math.max(1.4, ...t.split(' ').map((w) => (ctx ? ctx.measureText(w).width / 100 : w.length * 0.62) * 0.97))) }
    const xep = [...rong.values()].sort((a, b) => a - b), p85 = xep[Math.min(xep.length - 1, Math.floor(xep.length * 0.85))] ?? 2
    const cho = L.w - 14, chung = Math.floor(Math.max(13, Math.min(36, L.h * 0.47, cho / p85))) // 08/11 «chữ quá nhỏ»: tới 36 px (cũ 30)
    const rieng = new Map<string, number>()
    for (const [sbd, r] of rong) if (r * chung > cho) rieng.set(sbd, Math.max(11, Math.floor(cho / r)))
    return { chung, rieng }
  }, [tenGoi, hien, L])
  // ĐO THẬT TỪNG Ô (thầy 07/11 «tên học sinh vẫn bị cắt»): ước lượng bằng canvas có thể lệch (phông app chưa tải xong, máy chiếu khác cỡ) ⇒ sau khi vẽ,
  // ô nào chữ còn tràn (rộng / cao) thì hạ cỡ chữ RIÊNG ô đó từng px tới khi vừa (tối thiểu 10 px). Chạy lại khi danh sách / lưới đổi và khi phông tải xong.
  const vuaTen = useCallback(() => {
    const ds = goc.current?.querySelectorAll<HTMLElement>('.bb-bth .bb-o .ten')
    ds?.forEach((el) => {
      const toi = (el.parentElement?.clientWidth ?? 0) - 16 // bề ngang KHUNG ô trừ vạch màu đội + lề
      let co = parseFloat(getComputedStyle(el).fontSize) || 24
      // Cao: chỉ tính là tràn khi dư hơn ⅓ dòng (dấu tiếng Việt của Be Vietnam Pro nhô 1–2 px trên dòng — cũ +1 px ⇒ co mọi tên về 20 px, ảnh 08/11).
      while ((el.scrollWidth > toi || el.scrollHeight > el.clientHeight + co * 0.35) && co > 10) { co -= 1; el.style.fontSize = `${co}px` }
    })
  }, [])
  useLayoutEffect(vuaTen, [vuaTen, hien, tenGoi, L, coChu, v?.luot?.pha])
  useEffect(() => { let tat = false; void document.fonts?.ready.then(() => { if (!tat) vuaTen() }); return () => { tat = true } }, [vuaTen, hien.length])
  const coMat = ds.filter((e) => e.vao)
  /** Em đang ở ngoài app (hợp đồng phòng 09/11 `roiNay`; phòng cũ chưa có ⇒ rỗng). */
  const roiNay = ((v as { roiNay?: string[] } | null)?.roiNay ?? []).filter((s) => ds.some((e) => e.sbd === s))
  const daGui = new Set(l?.daGui ?? [])
  const chuaBietS = new Set(l?.chuaBiet ?? [])

  // Sân khấu co theo màn + canvas.
  useLayoutEffect(() => {
    const doi = () => { const s = Math.min(window.innerWidth / 1920, window.innerHeight / 1080); setK(s); ve.current?.datCo(s) }
    if (cv.current && cvTren.current && goc.current && !ve.current) { ve.current = new VeBang(cv.current, cvTren.current, goc.current, yeu); ve.current.chay() }
    doi(); window.addEventListener('resize', doi)
    return () => { window.removeEventListener('resize', doi) }
  }, [yeu])
  useEffect(() => () => { ve.current?.dung(); ve.current = null }, [])
  // Bảng thu vào tờ cũ (em lên bảng) ⇒ dừng vẽ canvas (máy chiếu yếu không phải vẽ thứ không ai thấy); phóng lại ⇒ vẽ tiếp.
  useEffect(() => {
    const nghe = (e: Event) => { const an = (e as CustomEvent<boolean>).detail === true; anRef.current = an; setGiaoTo(an); if (an) ve.current?.dung(); else { ve.current?.chay(); goc.current?.focus() } }
    window.addEventListener('bpu-an-hien', nghe)
    return () => window.removeEventListener('bpu-an-hien', nghe)
  }, [])
  // Bàn phím về bảng (tờ chiếu trong khung đang giữ tiêu điểm thì phím không tới cửa sổ app).
  useEffect(() => { goc.current?.focus() }, [])

  // Cảnh canvas theo màn.
  useEffect(() => {
    const vb = ve.current
    if (!vb || !v) return
    vb.phaoRoi = man === 'vinh-danh'
    let c: CanhBang = { loai: 'trong' }
    if (man === 'diem-danh') c = { loai: 'lua', x: X_LUA_DD, day: 520, cao: 250, nen: 30, giaTri: dsDoi(v).map((d) => { const t = ds.filter((e) => e.doi === d).length; return t ? ds.filter((e) => e.doi === d && e.vao).length / t : 0 }) }
    else if (man === 'tra-loi' && l) c = { loai: 'binh', muc: coMat.length ? (daGui.size / coMat.length) * 0.85 : 0, con: l.han ? Math.max(0, (l.han - nay) / Math.max(1, l.han - l.batDau)) : null }
    else if (man === 'mo' && l && !l.tuLuan) c = { loai: 'ong', mo0: vb.canh.loai === 'ong' ? (vb.canh as Extract<CanhBang, { loai: 'ong' }>).mo0 : performance.now(), ong: dungOng(l, vb) }
    else if (man === 'mo' && l?.tuLuan) c = { loai: 'binh', muc: coMat.length ? (daGui.size / coMat.length) * 0.85 : 0, con: null }
    else if (man === 'dua') c = { loai: 'lua', x: X_LUA_DUA, day: 640, cao: 400, nen: 70, giaTri: dsDoi(v).map((d) => Math.max(0, diemDoi(v, d))) }
    vb.canh = c
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v, man, nay])

  // Hạt sáng + cảnh báo rời màn + pháo khi mở đáp án: so view mới với view trước.
  useEffect(() => {
    const vb = ve.current, cu = truoc.current
    truoc.current = v
    if (!vb || !v || !cu) return
    const idx = new Map(v.ds.filter((e) => e.vao).map((e, i) => [e.sbd, i]))
    for (const e of v.ds) {
      const c = cu.ds.find((x) => x.sbd === e.sbd)
      if (e.vao && !c?.vao && !v.luot) { const i = idx.get(e.sbd)!; if (i != null) vb.bayHat(viTriO(i, L), { x: X_LUA_DD[e.doi]!, y: 470 }, vb.mau.doi[e.doi]!, 900) }
    }
    const l2 = v.luot, l1 = cu.luot
    if (l2 && l2.pha === 'tra-loi') {
      const cuGui = new Set(l1 && l1.so === l2.so ? l1.daGui : [])
      for (const s of l2.daGui) if (!cuGui.has(s)) { const i = idx.get(s), d = v.ds.find((e) => e.sbd === s)?.doi; if (i != null) vb.bayHat(viTriO(i, L), { x: BINH.x, y: vb.mucBinh() }, d != null ? vb.mau.doi[d] ?? vb.mau.tin : vb.mau.tin, 1100) } // 09/11: sao chổi MÀU ĐỘI của em
    }
    if (l2?.goi && l1?.goi && l1.so === l2.so && l2.goi.tiep > l1.goi.tiep) {
      const ban = v.ds.filter((e) => e.doi === v.ds.find((x) => x.sbd === l2.goi!.sbd)?.doi && e.sbd !== l2.goi!.sbd && e.vao)
      // Em đang viết bảng (vùng phải tắt) ⇒ tia lửa bay vào THẺ GÓC trên phải; bật lại màn ⇒ thẻ cột phải như cũ.
      const den = l2.pha === 'lam-bang' ? (batLaiRef.current ? { x: 1266, y: 222 } : { x: 1612, y: 112 }) : { x: 496, y: 427 }
      for (let n = 0; n < Math.min(6, l2.goi.tiep - l1.goi.tiep); n++) { const b = ban[Math.floor(Math.random() * ban.length)]; if (b) vb.bayHat(viTriO(idx.get(b.sbd)!, L), den, vb.mau.doi[b.doi]!, 800) }
    }
    if (l2?.pha === 'mo' && l1?.pha !== 'mo' && !l2.tuLuan) {
      setTimeout(() => { const v2 = truoc.current; if (!v2?.luot?.dung) return; for (const o of dungOng(v2.luot, vb)) if (o.dung) vb.bungManh(o.x, 300, 44, vb.mau.dung); if (v2.luot.kich) for (let q = 0; q < 6; q++) vb.bungManh(200 + q * 300, 820, 18, [vb.mau.sao, vb.mau.dung, vb.mau.tin][q % 3]!, 1.1) }, 1850)
    }
    if (!l2 || l1?.so !== l2.so) { setManPhu(null); setUng(null) }
  }, [v, L, X_LUA_DD])
  useEffect(() => { if (!toast) return; const h = setTimeout(() => setToast(null), 6000); return () => clearTimeout(h) }, [toast])

  useEffect(() => { if (!v?.luot || chuDe) return; let con = true; void import('../../lib/html-may-chieu').then((m) => { if (con) setChuDe(() => m.chuDeChieu) }).catch(() => {}); return () => { con = false } }, [v?.luot, chuDe])
  // Đề dài: cuộn về đầu mỗi lượt mới.
  useEffect(() => { deRef.current?.scrollTo?.({ top: 0 }) }, [l?.so])
  useEffect(() => { setDangSang(false); setHienPa(false); setGiai(null) }, [l?.so])
  useEffect(() => { setBatLai(false) }, [man])
  useEffect(() => { if (!dangSang) return; const h = setTimeout(() => setDangSang(false), 6000); return () => clearTimeout(h) }, [dangSang])
  // CO CHỮ CHO VỪA KHUNG (ảnh máy chiếu 07/11: phương án dài tràn xuống đè dải tên ⇒ «thẻ dính chữ»): hạ --k từng nấc tới khi đề + phương án nằm trọn
  // khung (tối thiểu 0,6; còn dài nữa thì riêng đề cuộn). Đo lại khi đổi câu / pha / cỡ khung và khi phông nạp xong.
  const coVua = useCallback(() => {
    const el = khungDe.current, de = deRef.current
    if (!el) return
    let k = 1
    el.style.setProperty('--k', '1')
    while (k > 0.6 && (el.scrollHeight > el.clientHeight + 1 || (de && de.scrollHeight > de.clientHeight + 1))) { k = Math.round((k - 0.05) * 100) / 100; el.style.setProperty('--k', String(k)) }
  }, [])
  useLayoutEffect(coVua, [coVua, l?.so, l?.qid, l?.pha, man, chuDe, L.top, hienPa])
  useEffect(() => { let tat = false; void document.fonts?.ready.then(() => { if (!tat) coVua() }); return () => { tat = true } }, [coVua, l?.so])
  // Đồng hồ êm.
  useEffect(() => { if (man !== 'tra-loi' || !l?.han) return; const h = setInterval(() => setNay(Date.now()), 500); return () => clearInterval(h) }, [man, l?.han])

  // GỌI LÊN BẢNG: lõi chọn em đã chốt ⇒ electron nhảy qua ứng viên ⇒ gửi phòng. Lỗi đọc ⇒ rút đều trong các em đã gửi.
  // Thầy bấm Đạt / Chưa đạt trên tờ cũ ⇒ ghi như phím D / F của bảng rồi mở đáp án (bảng đã hiện lại).
  useEffect(() => {
    if (!dangKyChamTo) return
    dangKyChamTo((dat) => { gui({ t: 'dat', v: dat }); setTimeout(() => gui({ t: 'mo' }), 150) })
    return () => dangKyChamTo(null)
  }, [dangKyChamTo, gui])
  const goiLen = useCallback(async (boQua: string[] = []) => {
    if (!v?.luot || dangGoi) return
    const lc = v.luot
    setDangGoi(true)
    // Em báo «chưa biết làm» KHÔNG bị gọi (thầy 07/11: khuyến khích thành thật); cả lớp đều chưa biết ⇒ gọi trong cả lớp như cũ.
    const kbSet = new Set(lc.chuaBiet ?? [])
    const tatCa = v.ds.filter((e) => e.vao && !lc.roiMe.includes(e.sbd) && !boQua.includes(e.sbd))
    const ungVien = tatCa.some((e) => !kbSet.has(e.sbd)) ? tatCa.filter((e) => !kbSet.has(e.sbd)) : tatCa
    const m = await layEmChieu([lc.qid], ungVien.map((e) => e.sbd), new Set(ungVien.map((e) => e.sbd)), v.lop, boQua.length ? new Map([[lc.qid, new Set(boQua)]]) : undefined, { kenh: 'bpu' } as never).catch(() => new Map())
    const list = (m.get(lc.qid) ?? []) as { sbd: string; loai: 'da_dung' | 'du_bao' | 'chua_co'; soSai?: number; soLan14?: number; lanCuoiLenBang?: string | null }[]
    const chon = list[0] ?? (ungVien.length ? { sbd: ungVien[Math.floor(Math.random() * ungVien.length)]!.sbd, loai: 'chua_co' as const } : null)
    if (!chon) { setDangGoi(false); setLoi({ chu: 'Chưa có em nào có mặt để gọi lên bảng.' }); return }
    const cauMuc = (lc.cau as { mucDo?: string | null }).mucDo
    const ly = lyDoLenBang(chon, { mucDo: cauMuc, giayGui: null, nowMs: Date.now() })
    const dsUng = [...new Set([...list.slice(0, 6).map((x) => x.sbd), chon.sbd])]
    const xong = () => {
      setUng(null); setDangGoi(false); gui({ t: 'goi', sbd: chon.sbd, lyDo: ly })
      // 08/11: có tờ chiếu ⇒ màn lên bảng là màn CŨ của tờ (thầy «bỏ màn chiếu mới»); máy em vẫn sang pha làm bảng như cũ.
      const dEm = v.ds.find((e) => e.sbd === chon.sbd)?.doi ?? 0, mauEm = goc.current ? getComputedStyle(goc.current).getPropertyValue(DOI_BPU[dEm]?.mau ?? '--tr-tin').trim() : ''
      // 09/11: ngọn lửa ĐỘI của em cháy to ở góc đề trên tờ cũ (tờ không có biến màu của app ⇒ gửi mã màu đã đọc).
      if (lenBangTo?.({ sbd: chon.sbd, ten: v.ds.find((e) => e.sbd === chon.sbd)?.ten ?? chon.sbd, goiNgay: false, mau: mauEm, doi: DOI_BPU[dEm]?.ten ?? '' })) setTimeout(() => gui({ t: 'lam-bang' }), 300)
    }
    if (yeu || dsUng.length < 2) { xong(); return }
    // 09/11 «gọi lên bảng thì lập tức chuyển về màn chiếu chuẩn cũ»: có tờ ⇒ ô em được chọn bừng sáng một nhịp rồi bảng thu vào tờ (không nhảy tên nữa).
    // 09/11 (lần 2) thầy «bấm L lên bảng thì đổi mượt mà sang tờ chiếu cũ chứ không tự động gọi lên bảng»: có tờ ⇒ chuyển NGAY sang tờ (thẻ tên em đã đặt,
    // tờ ở «chờ gọi»); thầy bấm L trên tờ để mời em như tờ cũ.
    if (lenBangTo) { xong(); return }
    const buoc = dsUng.length * 3 + dsUng.indexOf(chon.sbd)
    let t = 0
    for (let q = 0; q <= buoc; q++) {
      t += 70 + Math.pow(q / buoc, 2.6) * 430
      const s = dsUng[q % dsUng.length]!, la = q === buoc
      setTimeout(() => { setUng({ ds: dsUng, soi: s }); if (la) { const vb = ve.current, i = hien.findIndex((e) => e.sbd === s); if (vb && i >= 0) vb.bungManh(viTriO(i, L).x, viTriO(i, L).y - 30, 44, vb.mau.doi[v.ds[i]!.doi]!, 0.8); setTimeout(xong, 800) } }, t)
    }
    setUng({ ds: dsUng, soi: null })
  }, [v, dangGoi, gui, yeu, L, hien, lenBangTo])

  // 09/11 thầy «không tự động gọi lên bảng»: cả lớp gửi xong KHÔNG tự gọi em nữa — thầy bấm L (hoặc Space) khi sẵn sàng.
  // Thẻ «Mời em lên bảng» hiện ~4 giây ⇒ thu về góc, chiếu đề cho em làm.
  useEffect(() => { if (man !== 'goi') return; const h = setTimeout(() => gui({ t: 'lam-bang' }), 4200); return () => clearTimeout(h) }, [man, gui])

  // PHÍM.
  useEffect(() => {
    const phim = (e: KeyboardEvent) => {
      if (anRef.current || (e.target as HTMLElement | null)?.closest?.('input,textarea')) return
      const kk = e.key.toLowerCase()
      // Bảng chọn câu mở: chỉ Esc (đóng bảng chọn); phím khác để bảng chọn dùng (không lỡ tay gọi em / chuyển câu).
      if (chon) { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); setChon(false) } return }
      if (onChieuCau && (kk === 'c' || (e.key === 'Enter' && man === 'diem-danh'))) { e.preventDefault(); setChon(man === 'diem-danh' ? 'hd' : 'cau'); return }
      // Esc chỉ đóng BẢNG (thầy 07/11 «bấm esc xong không có chỗ mở lại tờ chiếu»): chặn lan ⇒ khung tờ chiếu bên dưới không đóng theo.
      if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); if (moPhim) setMoPhim(false); else if (manPhu) setManPhu(null); else onDong(); return }
      if (e.key === '?') { setMoPhim((m) => !m); return }
      if (kk === 'g' && coGiai) { e.preventDefault(); void batGiai(); return }
      if (kk === 'f' && man !== 'goi' && man !== 'lam-bang') { e.preventDefault(); doiToanMan(); return } // gọi / làm bảng: F = Chưa đạt
      // CHUYỂN CÂU (thầy 07/11 «tôi chỉ việc chiếu lên bảng rồi bấm chuyển câu»): tờ sang câu ⇒ tự gửi câu mới; lượt cũ chưa mở đáp án ⇒ máy chủ tự chốt.
      if ((e.key === 'ArrowRight' || e.key === 'PageDown') && onToi) { e.preventDefault(); sangCau(1); return }
      if ((e.key === 'ArrowLeft' || e.key === 'PageUp') && onToi) { e.preventDefault(); sangCau(-1); return }
      // ↓ ↑ cuộn đề dài.
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && (giaiRef.current || deRef.current)) { e.preventDefault(); const d = (giaiRef.current ?? deRef.current)!; d.scrollBy?.({ top: (e.key === 'ArrowDown' ? 0.6 : -0.6) * d.clientHeight, behavior: yeu ? 'auto' : 'smooth' }); return }
      if (kk === 'l' && man === 'tra-loi') { e.preventDefault(); void goiLen(); return }
      if (e.key === ' ') { e.preventDefault(); if (man === 'tra-loi') void goiLen(); else if (man === 'goi' || man === 'lam-bang') gui({ t: 'mo' }); return }
      if (e.key === 'Enter' && man === 'goi') { gui({ t: 'lam-bang' }); return }
      if ((kk === 'd' || kk === 'f') && (man === 'goi' || man === 'lam-bang')) { gui({ t: 'dat', v: kk === 'd' }); setTimeout(() => gui({ t: 'mo' }), 150); return }
      if (kk === 'b' && man === 'lam-bang') { setBatLai((x) => !x); return }
      if (kk === 'n' && (man === 'goi' || man === 'lam-bang') && l?.goi) { void goiLen([l.goi.sbd]); return }
      if (kk === 'm' && l && !l.tuLuan && l.phan !== 'III') { setHienPa((h) => !h); return }
      if (kk === 'o' && (man === 'tra-loi' || man === 'goi' || man === 'lam-bang')) { gui({ t: 'mo' }); return } // «Mở đáp án ngay» (trước là M — M nay hiện / ẩn phương án)
      if (kk === 'k' && (man === 'mo' || man === 'dua')) { setManPhu((c) => (c === 'dua' ? null : 'dua')); return }
      if (kk === 'v') { setManPhu((c) => (c === 'vinh-danh' ? null : 'vinh-danh')); return }
      // Không còn phím X «Kết thúc buổi chơi» (thầy 07/11: một chỗ kết thúc duy nhất là «Kết thúc buổi học» ⇒ máy chủ đóng phòng).
      if (kk === 'h') setAn((a) => !a)
    }
    window.addEventListener('keydown', phim, true)
    return () => window.removeEventListener('keydown', phim, true)
  }, [man, manPhu, moPhim, gui, goiLen, onDong, onToi, sangCau, coGiai, batGiai, l?.goi, yeu, doiToanMan, chon, onChieuCau])

  const q = (l?.cau ?? null) as unknown as Question | null
  const ten = (e: Em | undefined) => (!e ? '' : an ? `Em số ${ds.indexOf(e) + 1}` : tenNgan(e.ten))
  const goiEm = l?.goi ? ds.find((e) => e.sbd === l.goi!.sbd) : undefined
  // Thanh trên: «Câu tiếp →» (bấm chuột hoặc phím →) + «? Phím»; bảng phím đầy đủ chỉ hiện khi bấm ? (không chiếm dải lưới tên).
  // THANH TRÊN (09/11 «các nút bấm thuận tiện cho việc gọi học sinh lên bảng»): MỘT nút chính theo màn — Xong điểm danh · Gọi lên bảng · Câu tiếp;
  // «Chọn câu» luôn sẵn; mã vào lớp nằm cạnh tên lớp (em đến muộn vẫn vào được). Câu đang chiếu: logo thu còn ngọn lửa cho rộng chỗ.
  const chinh = chon || giaoTo ? null
    : man === 'diem-danh' ? (onChieuCau ? <button type="button" className="bb-chinh" onClick={() => setChon('hd')}>Xong điểm danh<kbd>Enter</kbd></button> : null)
    : man === 'tra-loi' ? <button type="button" className="bb-chinh" disabled={dangGoi} onClick={() => void goiLen()}>{dangGoi ? 'Đang chọn em…' : 'Lên bảng'}<kbd>L</kbd></button>
    : (man === 'goi' || man === 'lam-bang') ? <button type="button" className="bb-hoi" onClick={() => gui({ t: 'mo' })}><kbd>Space</kbd>Mở đáp án</button>
    : (man === 'mo' || man === 'dua') && onToi ? <button type="button" className="bb-chinh" onClick={() => sangCau(1)}>Câu tiếp<kbd>→</kbd></button> : null
  // 09/11 thầy «thu hết các nút lại, chỉ để nút gọi lên bảng thôi»: thanh trên chỉ còn MỘT nút chính; các việc khác dùng phím (bấm ? xem bảng phím).
  const tren = (giua: React.ReactNode, phai?: React.ReactNode) => (
    <div className="bb-tren"><div className={`bb-logo${man === 'diem-danh' ? '' : ' gon'}`}><Lua /><span>Bình Phản Ứng</span></div>{giua}<div className="bb-lop">{v?.lop ?? ''}{ma && man !== 'diem-danh' ? <span className="bb-ma" title="Mã vào lớp">Mã <b>{ma}</b></span> : null}</div><div className="bb-gian" />{phai}{chinh}</div>
  )
  // Nút đã thu (09/11) ⇒ bảng phím luôn kèm: Enter / C chọn câu, F toàn màn hình (trừ lúc chấm em: F = Chưa đạt).
  const phimThem = (): [string, string, boolean?][] => [...(onChieuCau ? [man === 'diem-danh' ? ['Enter', 'Xong điểm danh · chọn câu', true] as [string, string, boolean] : ['C', 'Chọn câu khác'] as [string, string]] : []), ...(man === 'goi' || man === 'lam-bang' ? [] : [['F', 'Toàn màn hình'] as [string, string]])]
  const phim = (dsP0: [string, string, boolean?][], ghi?: string) => { const dsP = [...dsP0, ...phimThem()]; return moPhim ? <div className="bb-phim" role="note">{dsP.map(([a, b, noi]) => <span key={a} className={noi ? 'noi' : ''}><kbd>{a}</kbd>{b}</span>)}{ghi ? <p>{ghi}</p> : null}</div> : null }
  const TIEP: [string, string, boolean?][] = onToi ? [['→', 'Câu tiếp · câu mới tự gửi xuống máy em']] : []
  const luoi = (con: React.ReactNode) => <div className="bb-bth" style={{ top: L.top, left: TRAI_LUOI, width: 1920 - 2 * TRAI_LUOI, gap: KHE, gridTemplateColumns: `repeat(${L.cot}, minmax(0, 1fr))`, gridAutoRows: `${L.h}px`, ['--co' as string]: `${coChu.chung}px` }}>{con}</div>

  // Em lên bảng ⇒ CẢ ĐỘI của em sáng lên trên dải tên (thầy 07/11).
  const doiLen = l?.goi && (man === 'goi' || man === 'lam-bang' || man === 'mo') ? ds.find((e) => e.sbd === l.goi!.sbd)?.doi ?? null : null
  const o = hien.map((e) => {
    const lop = ['bb-o']
    if (!e.vao) lop.push('chua-vao')
    // TẾ NHỊ TRƯỚC LỚP (luật cứng của thầy): ô em «chưa biết làm» trông như «đã gửi»; bảng chỉ hiện CON SỐ.
    if (man === 'tra-loi' && daGui.has(e.sbd)) lop.push('da-tra')
    if (man !== 'diem-danh' && man !== 'vinh-danh' && e.chuoi >= 2) lop.push('chay')
    if ((man === 'tra-loi' || man === 'goi' || man === 'lam-bang') && l?.roiMe.includes(e.sbd)) lop.push('roi')
    if (ung?.ds.includes(e.sbd)) lop.push(ung.soi === e.sbd ? 'soi' : 'ung')
    if ((man === 'goi' || man === 'lam-bang') && l?.goi?.sbd === e.sbd) lop.push('duoc-goi')
    else if (doiLen != null && e.doi === doiLen) lop.push('cung-doi')
    const kq = man === 'mo' || man === 'dua' ? l?.ketQua?.[e.sbd] : undefined
    if ((man === 'mo' || man === 'dua') && l && !l.tuLuan) lop.push(kq?.dung ? 'ket' : 'lang')
    return (
      <div key={e.sbd} className={lop.join(' ')} style={{ ['--doi' as string]: mauDoi(e.doi), ['--tre' as string]: kq?.nhanh ? `${1900 + kq.nhanh * 70}ms` : '0ms' }} aria-label={`${e.ten}${e.vao ? '' : ' (chưa vào)'}`}>
        <span className="ten" style={coChu.rieng.has(e.sbd) && !an ? { fontSize: coChu.rieng.get(e.sbd) } : undefined}>{an ? ds.indexOf(e) + 1 : tenGoi.get(e.sbd)}</span>
        {kq?.nhanh && kq.nhanh <= 3 ? <span className="hc" aria-label={`Nhanh thứ ${kq.nhanh}`}>{kq.nhanh}</span> : null}
        {lop.includes('roi') ? <span className="nhan-roi">Rời màn</span> : null}
      </div>
    )
  })

  let noi: React.ReactNode = null
  if (!v) noi = <div className="bb-cho">{loi ? <><h2>{loi.chan ? 'Chưa mở được Bình Phản Ứng' : 'Đang nối máy chủ…'}</h2><p>{loi.chu}</p></> : <h2>Đang mở Bình Phản Ứng…</h2>}</div>
  else if (man === 'diem-danh') {
    const vua = v.vuaVao.slice(-2).reverse().map((s) => ds.find((e) => e.sbd === s)).filter(Boolean) as Em[]
    noi = (
      <>
        {tren(<div className="bb-pill">{chon === 'hd' ? 'Hôm nay làm gì?' : chon ? 'Chọn câu' : 'Điểm danh'}</div>)}
        <div className="bb-dd">
          <h2>Vào lớp: mở app, nhập mã</h2>
          <p className="phu">Một mã cho cả điểm danh lẫn Bình Phản Ứng. Mỗi bạn vào lớp: +{KJ.vaoLop} kJ cho đội.</p>
          {linkQr ? <MaQr text={linkQr} /> : <div className="bpu-qr trong" />}
          <div className="bb-dd-ma"><span className="nhan">Mã điểm danh (đổi mỗi phút)</span><div className="bb-dd-so">{(ma ?? '······').split('').map((c, i) => <span key={i}>{c}</span>)}</div><span className="nhan thuong">Hoặc quét mã QR bằng app học sinh.</span></div>
          <div className="bb-vua"><span className="nhan">Vừa vào lớp</span>{vua.map((e) => <div key={e.sbd} className="bb-vua-hang" style={{ ['--doi' as string]: mauDoi(e.doi) }}><b>{an ? '' : e.ten}</b><span className="chip">{DOI_BPU[e.doi]?.ten}</span><span className="cong">+{KJ.vaoLop}</span><span className="gio">{gioPhut(e.luc)}</span></div>)}</div>
        </div>
        <div className="bb-dd-phai"><h3>Đội nào đủ quân trước?</h3>{v.doiDu != null ? <p className="du-quan" style={{ ['--doi' as string]: mauDoi(v.doiDu) }}>{DOI_BPU[v.doiDu]?.ten} đủ quân đầu tiên · +{KJ.duQuanDau} kJ</p> : <p>Mỗi bạn vào lớp, lửa đội ấy cao thêm. Đội đủ quân đầu tiên +{KJ.duQuanDau} kJ.</p>}</div>
        {DOI_BPU.slice(0, dsDoi(v).length).map((d, i) => { const so = ds.filter((e) => e.doi === i && e.vao).length, tong = ds.filter((e) => e.doi === i).length; return <div key={d.ten} className={`bb-dd-doi${so === tong && tong ? ' du' : ''}`} style={{ left: X_LUA_DD[i], ['--doi' as string]: mauDoi(i) }}><b>{d.ten.replace('Đội ', '')}</b><span>{so}/{tong}</span><small>{v.doiThuong[i]} kJ</small></div> })}
        <div className="bb-dd-dem"><b>{coMat.length}</b>/{ds.length} em có mặt</div>
        {luoi(o)}
        {loi ? <div className="bb-toast loi" role="alert">{loi.chu} · mã điểm danh vẫn dùng được</div> : null}
        {phim([['V', 'Vinh danh'], ['H', 'Ẩn tên'], ['Esc', 'Đóng bảng']], 'Chiếu đề lên bảng: mỗi lần chuyển câu, câu tự gửi xuống máy các em có mặt, giờ tự tính theo câu (tối đa 3 phút).')}
      </>
    )
  } else if (man === 'dua') {
    const thu = xepDoi(v), xep = [...coMat].sort((a, b) => b.kj - a.kj)
    noi = (
      <>
        {tren(<div className="bb-pill">Sau lượt {v.soLuot}</div>)}
        <div className="bb-dua"><h2>Đua ngọn lửa</h2><p>Thử màu ngọn lửa: mỗi đội một màu, đội càng nhiều kJ lửa càng cao.</p></div>
        {DOI_BPU.slice(0, dsDoi(v).length).map((d, i) => <div key={d.ten} className="bb-dua-nhan" style={{ left: X_LUA_DUA[i], ['--doi' as string]: mauDoi(i) }}><b>{d.ten}</b><span>{diemDoi(v, i)} kJ</span><small>hạng {thu.findIndex((x) => x.d === i) + 1}</small></div>)}
        <div className="bb-top"><h3>Nhiều kJ nhất</h3>{xep.slice(0, 6).map((e, i) => <div key={e.sbd} className="bb-top-hang" style={{ ['--doi' as string]: mauDoi(e.doi) }}><span className="h">{i + 1}</span><span className="t">{ten(e)}</span><span className="d">{e.kj}</span></div>)}</div>
        {luoi(o)}
        {phim([...TIEP, ['K', 'Về kết quả câu'], ['V', 'Vinh danh'], ['H', 'Ẩn tên'], ['Esc', 'Về tờ chiếu']])}
      </>
    )
  } else if (man === 'vinh-danh') {
    const thu = xepDoi(v), vo = thu[0]!.d, xep = [...coMat].sort((a, b) => b.kj - a.kj), top = [xep[1], xep[0], xep[2]]
    const tyLe = v.lichSu.length && coMat.length ? Math.round((v.lichSu.reduce((s, x) => s + x.soDung, 0) / (v.lichSu.filter((x) => !x.tuLuan).length * coMat.length || 1)) * 100) : 0
    const kho = v.lichSu.filter((x) => !x.tuLuan).sort((a, b) => a.soDung - b.soDung)[0]
    noi = (
      <>
        {tren(<div className="bb-pill">Tổng kết · {v.soLuot} lượt</div>)}
        <div className="bb-vd" style={{ ['--doi' as string]: mauDoi(vo) }}>
          <svg className="bb-vd-tia" viewBox="-100 -100 200 200" aria-hidden="true"><g>{Array.from({ length: 24 }, (_, i) => { const a0 = (i * 15 * Math.PI) / 180, a1 = a0 + (7 * Math.PI) / 180; return <path key={i} d={`M0 0L${(Math.cos(a0) * 100).toFixed(2)} ${(Math.sin(a0) * 100).toFixed(2)}L${(Math.cos(a1) * 100).toFixed(2)} ${(Math.sin(a1) * 100).toFixed(2)}Z`} /> })}</g></svg>
          <div className="bb-vd-dau"><div className="bb-vd-huy"><Ngoc mau={mauDoi(vo)} chu={DOI_BPU[vo]?.ky} /></div><div><div className="mat">Vô địch buổi hôm nay</div><h2>{DOI_BPU[vo]?.ten}</h2><span className="diem">{diemDoi(v, vo)} kJ</span></div></div>
          <div className="bb-vd-ben trai"><h3>Đua ngọn lửa</h3>{thu.map((x) => <div key={x.d} className="bb-vd-doi" style={{ ['--doi' as string]: mauDoi(x.d) }}><Lua /><b>{DOI_BPU[x.d]?.ten}</b><span>{x.tong}</span></div>)}</div>
          <div className="bb-vd-buc">{top.map((e, i) => e ? <div key={e.sbd} className="bb-vd-cot" style={{ ['--m' as string]: ['var(--tr-tin)', 'var(--tr-sao)', 'var(--tr-chu-y)'][i] }}><div className="ngoc" style={{ width: [150, 196, 128][i] }}><Ngoc mau="var(--m)" /><Sao x={8} y={18} d={i * 0.4} /><Sao x={80} y={6} d={0.7 + i * 0.4} /><Sao x={92} y={62} d={1.3 + i * 0.4} /></div><div className="ten">{ten(e)}</div><div className="phu">{e.kj} kJ · đúng {e.dungSo}/{v.lichSu.filter((x) => !x.tuLuan).length} lượt</div><div className="bac" style={{ height: [190, 250, 140][i] }}><span>{[2, 1, 3][i]}</span></div></div> : <div key={i} className="bb-vd-cot" />)}</div>
          <div className="bb-vd-ben phai"><h3>Cả lớp hôm nay</h3><div className="bb-vd-so"><b>{tyLe}%</b><span>câu trả lời đúng</span></div>{kho ? <div className="bb-vd-so"><b>Lượt {kho.so}</b><span>khó nhất · {kho.soDung}/{kho.soGui} em đúng</span></div> : null}<div className="bb-vd-so"><b>{v.soLuot}</b><span>lượt đã chơi</span></div></div>
        </div>
        {phim([['V', 'Đóng vinh danh', true], ...TIEP, ['Esc', 'Về tờ chiếu']])}
      </>
    )
  } else if (l && q) {
    const daGuiN = daGui.size
    const loaiChu = l.tuLuan ? 'Tự luận · làm ra giấy' : l.phan === 'I' ? 'Trắc nghiệm' : l.phan === 'II' ? 'Đúng–sai' : 'Trả lời ngắn'
    const g = l.goi
    const chip = man === 'mo' && g && goiEm ? <div className="bb-pill" style={{ boxShadow: `inset 0 0 0 3px ${mauDoi(goiEm.doi)}` }}>Lên bảng: {ten(goiEm)}{g.dat === true ? ` · Đạt · ${DOI_BPU[goiEm.doi]?.ten} +${KJ.lenBangDat}` : g.dat === false ? ' · Chưa đạt' : ''}</div> : null
    const dem = new Map<string, number>()
    if (l.chon) for (const c of Object.values(l.chon)) dem.set(c, (dem.get(c) ?? 0) + 1)
    const ongNhan = man === 'mo' && !l.tuLuan && l.dung ? nhanOng(l, ve.current) : []
    noi = (
      <>
        {tren(<><div className="bb-pill">Lượt {l.so}</div><span className="bb-chip">{loaiChu}</span>{chip}</>, <>{man === 'tra-loi' && l.han ? <div className="bb-gio">{gio(l.han - nay)}</div> : null}</>)}
        {giai != null ? <div className="bb-giai" ref={giaiRef} tabIndex={-1} role="region" aria-label="Lời giải thu gọn" style={{ height: L.top - 20 - 112 }} dangerouslySetInnerHTML={{ __html: giai }} /> : null}
        <div className={`bb-de${dangSang ? ' doi' : ''}`} ref={khungDe} style={{ height: L.top - 20 - 112, visibility: giai != null ? 'hidden' : undefined }}>
          <div className="bb-de-chu" ref={deRef} tabIndex={-1}><Chu t={q.text} f={chuDe} /><HinhDe q={q} so={l.so} f={chuDe} onTai={coVua} /></div>
          {hienPa && l.phan === 'I' && !l.tuLuan ? <div className="bb-pa">{(q.choices ?? []).slice(0, 4).map((c, i) => { const chu = 'ABCD'[i]!; return <div key={chu} className={man === 'mo' && l.dung ? (l.dung.toUpperCase() === chu ? 'dung' : 'mo') : ''} style={{ ['--mau' as string]: ['var(--tr-tin)', 'var(--tr-sao)', 'var(--tr-chu-y)', 'var(--tr-hs)'][i] }}><i>{chu}</i><span><Chu t={c} f={chuDe} mot /></span></div> })}</div> : null}
          {hienPa && l.phan === 'II' && !l.tuLuan ? <div className="bb-ds">{(q.ideas ?? []).slice(0, 4).map((y, i) => <div key={i}><i>{'abcd'[i]})</i><span><Chu t={y} f={chuDe} mot /></span></div>)}</div> : null}
          {l.phan === 'III' && !l.tuLuan ? <div className="bb-tln">Em nhập đáp số trên máy{man === 'mo' && l.dung ? <b>{l.dung}</b> : null}</div> : null}
          {l.tuLuan ? <div className="bb-tln">Câu tự luận: em làm ra giấy, xong bấm «Em làm xong» trên máy. Máy không chấm câu này.</div> : null}
        </div>
        <div className="bb-phai">
          {man === 'lam-bang' && g && goiEm && !giaoTo ? (
            <div className="bb-lb" style={{ ['--doi' as string]: mauDoi(goiEm.doi) }}>
              <div className="the"><div className="ng">{kyHieu(goiEm.ten)}</div><div className="chu"><div className="mat">Đang làm trên bảng</div><b>{an ? ten(goiEm) : goiEm.ten}</b><span>{DOI_BPU[goiEm.doi]?.ten}</span></div></div>
              <div className="viet">Em giải trên bảng lớp<br />Thầy chấm: <b>D</b> Đạt · <b>F</b> Chưa đạt</div>
              <div className="dai"><span><b>{g.doanDung}</b> đoán đúng · <b>{g.doanSai}</b> chưa</span><span className="vach"><i style={{ width: `${(g.doanDung / Math.max(1, g.doanDung + g.doanSai)) * 100}%` }} /></span><span className="ts">Tiếp sức {g.tiep}</span></div>
            </div>
          ) : man === 'mo' && !l.tuLuan ? <>{l.phan === 'II' ? <><span className="bb-hang-ds" style={{ top: HANG_DS[0].top + 100 - 128 }}>Đúng</span><span className="bb-hang-ds" style={{ top: HANG_DS[1].top + 100 - 128 }}>Sai</span></> : null}{ongNhan.map((x, k) => x.gon
              ? <div key={k} className={`bb-ong gon${x.dung ? ' dung' : ''}`} style={{ left: x.x - 1200, top: x.y }}><b>{x.nhan}</b> {x.dem} em</div>
              : <div key={k} className="bb-ong" style={{ left: x.x - 1200, top: x.y }}><div className="nhan">{x.nhan}</div><div className="dem">{x.dem} em</div>{x.dung ? <div className="the">Đáp án</div> : null}</div>)}</>
            : <div className="bb-dem"><b>{daGuiN}</b>/{coMat.length} em {l.tuLuan ? 'làm xong' : 'đã gửi'}{chuaBietS.size ? <span className="kb">trong đó {chuaBietS.size} em chưa biết làm</span> : null}</div>}
          {man === 'mo' && !l.tuLuan && chuaBietS.size ? <div className="bb-kb-mo">{chuaBietS.size} em chưa biết làm · thầy chữa kĩ câu này</div> : null}
        </div>
        {luoi(o)}
        {man === 'mo' && l.kich ? <div className="bb-kich">Vượt năng lượng hoạt hoá! {Object.values(l.ketQua ?? {}).filter((x) => x.dung).length}/{coMat.length} em đúng · cả lớp +{KJ.kichHoat} kJ</div> : null}
        {man === 'goi' && g && goiEm && !giaoTo ? (
          <>
            <div className="bb-mo-den" />
            <div className="bb-goi" style={{ ['--doi' as string]: mauDoi(goiEm.doi) }}>
              <div className="trai"><div className="ng"><span className="quy" /><span className="quy hai" /><b>{kyHieu(goiEm.ten)}</b></div><div className="doi">{DOI_BPU[goiEm.doi]?.ten}</div></div>
              <div className="phai"><div className="mat">Mời em lên bảng</div><div className="ten">{an ? ten(goiEm) : goiEm.ten}</div><div className="vi">Vì sao chọn em</div><ul>{g.lyDo.map((x, i) => <li key={i}>{x}</li>)}</ul>
                <div className="duoi"><div className="dd"><span>Cả lớp đoán trên máy</span><div className="thanh"><i style={{ width: `${(g.doanDung / Math.max(1, g.doanDung + g.doanSai)) * 100}%` }} /></div><span><b>{g.doanDung}</b> bạn đoán làm đúng · <b>{g.doanSai}</b> chưa đúng</span></div><div className="ts"><span>Tiếp sức {DOI_BPU[goiEm.doi]?.ten}</span><b>{g.tiep}</b></div></div></div>
            </div>
          </>
        ) : null}
        {toast ? <div className="bb-toast" role="status">{toast}</div> : null}
        {loi && v ? <div className="bb-toast loi" role="alert">{loi.chu}</div> : null}
        {phim(man === 'mo' ? [...(coGiai ? [['G', giai != null ? 'Ẩn lời giải' : 'Lời giải thu gọn', true] as [string, string, boolean]] : []), ...TIEP, ['K', 'Đua ngọn lửa'], ['V', 'Vinh danh'], ['H', 'Ẩn tên'], ['Esc', 'Về tờ chiếu']]
          : man === 'goi' ? [['Enter', 'Chiếu đề cho em làm', true], ['N', 'Chọn em khác'], ['Space', 'Mở đáp án'], ...TIEP, ['Esc', 'Về tờ chiếu']]
          : man === 'lam-bang' ? [['D', `Đạt · đội +${KJ.lenBangDat}`, true], ['F', 'Chưa đạt'], ['N', 'Chọn em khác'], ['B', batLai ? 'Tắt vùng em viết' : 'Bật lại vùng em viết'], ['Space', 'Mở đáp án'], ...TIEP, ['Esc', 'Về tờ chiếu']]
          : [['L', 'Lên bảng · sang tờ chiếu cũ', true], ...(!l.tuLuan && l.phan !== 'III' ? [['M', hienPa ? 'Ẩn phương án' : 'Hiện phương án'] as [string, string]] : []), ['O', l.tuLuan ? 'Xong lượt (thầy chữa)' : 'Mở đáp án ngay'], ...(coGiai ? [['G', 'Lời giải thu gọn'] as [string, string]] : []), ...TIEP, ['H', 'Ẩn tên'], ['Esc', 'Về tờ chiếu']],
        'Tự động: hết giờ hoặc cả lớp gửi xong ⇒ gọi một em lên bảng. Chuyển câu khi chưa mở đáp án ⇒ máy tự chấm câu cũ.')}
      </>
    )
  }

  return createPortal(
    <div ref={goc} className={`bpu-bang${vietBang ? ' viet-bang' : ''}`} style={vietBang ? { ...MAU_CHIEU, ['--mep' as string]: `calc(50% + ${(1180 - 960) * k}px)` } : MAU_CHIEU} role="dialog" aria-modal="true" aria-label="Bình Phản Ứng" tabIndex={-1}>
      <div ref={san} className="bb-san" style={{ transform: `translate(-50%, -50%) scale(${k})` }}>
        <canvas ref={cv} className="bb-ve" aria-hidden="true" />
        {/* CHUYỂN CẢNH (09/11 «mượt mà trơn chu»): đổi màn lớn (điểm danh ⇄ câu ⇄ câu khác ⇄ đua / vinh danh) ⇒ cảnh mới rõ dần + trồi nhẹ; đổi pha trong một câu giữ nguyên đề. */}
        <div key={man === 'diem-danh' || man === 'dua' || man === 'vinh-danh' ? man : `cau-${l?.so ?? 0}`} className="bb-canh">{noi}</div>
        {chon && onChieuCau ? <Suspense fallback={<div className="bb-cho-chon">Đang mở bảng chọn câu…</div>}><ChonCauBpu buoiId={buoiId} lop={v?.lop ?? ''} buocDau={chon} onChieu={onChieuCau} onHoatDong={onHoatDong ? (hd) => { setChon(false); onHoatDong(hd) } : undefined} onKetThuc={onKetThuc ? () => onKetThuc(buoiId) : undefined} onDong={() => setChon(false)} /></Suspense> : null}
        {vietBang && l?.goi && goiEm ? <VungVietBang g={l.goi} em={goiEm} tenHien={(e: Em) => (an ? ten(e) : e.ten)} onBat={() => setBatLai(true)} /> : null}
        <canvas ref={cvTren} className="bb-ve tren" aria-hidden="true" />
      </div>
      <button type="button" className="bb-dong" onClick={onDong} aria-label="Đóng bảng Bình Phản Ứng">Đóng</button>
      {/* RỜI MÀN — BÁO CHÁY (thầy 09/11 «viền đỏ nhấp nháy xung quanh màn chiếu hiện tên ở giữa bảng to như báo cháy để hs không dám tái phạm»): em đang ở
          ngoài app (phòng giữ `roiNay` tới khi em quay lại) ⇒ lớp phủ NGOÀI khung bảng (nổi cả khi bảng đang thu vào tờ cũ lúc em lên bảng). */}
      {roiNay.length ? createPortal(<div className="bpu-bao-chay" role="alert" style={MAU_CHIEU}><div className="bpu-bao-chay-the"><span className="coi" aria-hidden="true" /><b>Rời màn hình</b><strong>{roiNay.map((s) => { const e = ds.find((x) => x.sbd === s); return e ? (an ? `Em số ${ds.indexOf(e) + 1}` : e.ten) : s }).join(' · ')}</strong><span>Quay lại Bình Phản Ứng ngay</span></div></div>, document.body) : null}
    </div>,
    gocPortal ?? document.body,
  )
}

