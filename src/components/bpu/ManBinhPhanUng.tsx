// BÌNH PHẢN ỨNG — MÀN MÁY EM (thầy 06/11; bản vẽ docs/ban-ve-binh-phan-ung-0611 ảnh h00–h15). Nạp lười: chỉ mở khi em vừa điểm danh hoặc kênh đẩy báo `bpu`.
// Câu hiện ĐẦY MÀN HÌNH giống chặng (dùng lại DeCau / ChonTracNghiem / ChonDungSai / OTraLoiNgan). KHÔNG có nút thoát giữa buổi; em ẩn app ⇒ báo phòng NGAY
// «rời màn» (bảng hiện tên em; luật chặt 09/11: em −50 kJ, đội −50 kJ), app hiện lại sau lần báo rời ⇒ gửi `{ t: 've' }` (phòng gỡ em khỏi «đang rời»).
// 10/11: chỉ TẮT MÀN HÌNH (máy phân biệt được — Android có quyền IdleDetector) là không báo; mọi máy khác giữ chặt (xem `tat-man.ts`).
// kJ (thầy 09/11 «app hs cũng được cộng trừ kJ hiệu ứng siêu đẹp mắt và hiển thị tinh tế ở mọi chỗ»): mọi số kJ ĐẾM MƯỢT tới số mới (`SoKj`),
// mỗi biến động của em (`bienDongEm`) ⇒ thẻ nhỏ «+100 kJ · Đúng · nhanh thứ 2» bay lên rồi mờ (`TheBienDong`).
// Mất mạng KHÔNG tính là rời màn: đáp án đã chọn giữ trên máy, nối lại thì gửi.
// THẦY 09/11 (bản vẽ docs/ban-ve-bpu-may-em-0911): đầu màn NGỌN LỬA màu đội + tên đội + kJ; em bấm gửi ⇒ tia lửa màu đội bay lên (như bay lên bảng) rồi
// màn TỰ CHE «Đã gửi · Nhìn lên bảng để chữa bài» — không còn đề, không nút mở; chỉ mở khi thầy đẩy CÂU MỚI (số lượt đổi). Thầy mở đáp án ⇒ vẫn che,
// hiện kết quả trên lớp che: em chọn đúng XANH, sai ĐỎ, đáp án đúng luôn XANH.
// Máy em chỉ nhận `viewEm` từ phòng — không có đáp án tới khi thầy mở. Màn chặng đang làm vẫn nằm nguyên bên dưới (tấm phủ), xong buổi về đúng chỗ.
import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { layDiaChiMayChu } from '../../lib/dia-chi-may-chu'
import { DOI_BPU, KJ, kyHieu, type BienDong, type ViewEm } from '../../lib/bpu/phong'
import { coQuyenTatMan, conKhoaXoay, dangChiaDoi, dangXinQuyen, docQuyenTatMan, khoaXoay, kiemKhoaMan, xinQuyenTatMan } from './tat-man'
import { giuSang } from './giu-sang'
import KetQuaLenBangEm from './KetQuaLenBangEm'
import type { Question } from '../../game/than-thu-v2/core'
// Phần hiện câu của chặng nạp ĐỘNG qua mảnh chặng (đã tải sẵn ở Lộ trình) — nhập tĩnh làm bộ đóng gói chia lại mảnh dùng chung (precache + byte mở tăng).
type MangChang = typeof import('../hoc-tap/ManLamBaiTap')['PHAN_CAU_CHANG']
import './bpu-hs.css'
// LỜI GIẢI SAU KHI MỞ ĐÁP ÁN (thầy 07/11): đúng khối lời giải của màn làm bài — có bản Kính ⇒ Kính + nút «Lời giải thu gọn»; chưa có ⇒ lời giải thu gọn đầy đủ.
const LoiGiaiKinhHs = lazy(() => import('../loi-giai-kinh/LoiGiaiKinhHs'))
/** LIVE BẢNG (10/11, docs/dac-ta-live-bang-1011.md): lớp bảng live của máy em + thư viện nối — nạp lười khi phòng báo `live.san` / `live.bat`. */
const LopLive = lazy(() => import('../live/LopLive'))
type LoiGiaiCauKieu = ComponentType<{ q: Question; solution: unknown; dapAn: string; hinhLoiGiai?: Question['hinhAnh'] }>

const GOC_MAC_DINH = 'https://omr.ttadodaihoc.workers.dev'
const LUI_MS = [1500, 3000, 6000, 12000, 20000]
/** Ẩn app lâu hơn ngần này mới tính là rời màn. 09/11 (lần 4) thầy «cảnh báo … phải tức thì»: ẩn app là báo NGAY (10/11: đồng bộ, không hẹn giờ). */
export const ROI_MAN_MS = 0
/** Đang tắt màn (Android có quyền): trang vẫn ẩn mà màn đã MỞ KHOÁ hai lần hỏi liền nhau cách nhau ngần này ⇒ em mở khoá thẳng vào app khác (bấm thông báo /
 *  lối tắt trên màn khoá) ⇒ báo rời. Mở khoá bình thường: Chrome hiện lại sau vài trăm ms ⇒ kịp trước lần hỏi thứ hai. Trang ẩn, Chrome gom hẹn giờ ~1 s. */
export const KIEM_KHOA_MS = 1000
/** Mất tiêu điểm (cửa sổ nổi / bong bóng / chia đôi màn hình — app vẫn hiện nhưng em đang chạm ứng dụng khác) / cửa sổ co lại lâu hơn ngần này ⇒ báo rời.
 *  10/11 thầy «chia đôi, cửa sổ nổi phải bắt tức thì»: rút 350 → 200 ms. 200 ms ≈ 12 khung hình — đủ nuốt nháy tiêu điểm của giao diện hệ thống chớp qua
 *  (vào/thoát toàn màn hình, đổi bàn phím, xoay máy: đều xong trong 1–2 khung hình ≤ ~100 ms ở máy yếu), nhưng ngắn hơn mọi cử chỉ thật (kéo thanh thông báo
 *  xuống rồi đọc, mở bong bóng chat: ≥ 300 ms hoạt ảnh). Bàn phím bật KHÔNG làm mất tiêu điểm (không qua nhánh này); hộp hỏi quyền IdleDetector được
 *  chặn riêng (`dangXinQuyen`). */
export const NOI_MS = 200

type Tin = { t: string; [k: string]: unknown }
const gio = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` }
const gioPhut = (ms: number | null | undefined) => { if (!ms) return ''; const d = new Date(ms); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` }
const PHIM_SO = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', '−']

function BinhNho() {
  return (
    <svg className="bpu-hs-binh" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M19 5h10M20.5 5v12.6a14 14 0 1 0 7 0V5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.6 30.5a11.6 11.6 0 0 0 22.8 0c-3.6 1.6-7.4 1.6-11.4 0s-7.8-1.6-11.4 0z" className="bpu-hs-binh-long" />
    </svg>
  )
}
/** NGỌN LỬA ĐỘI (thầy 09/11): ba lớp lửa màu đội (`--doi`) lay chập chờn + đốm than bay — chỉ transform/opacity; máy yếu / giảm chuyển động ⇒ tĩnh. */
function NgonLua({ doi, ky, to }: { doi: number; ky?: string; to?: boolean }) {
  return (
    <span className={`bpu-lua${to ? ' to' : ''}`} style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-tin'})` }} aria-hidden="true">
      <i className="hao" />
      <svg viewBox="0 0 64 80">
        <g className="l1"><path className="ngoai" d="M32 4C35 17 50 25 54 40c4 17-7 34-22 34S6 57 10 40c2-8 7-12 9-19 3 7 6 10 9 11-1-10 1-19 4-28z" /></g>
        <g className="l2"><path className="giua" d="M32 28c2 9 12 14 14 24 2 12-5 21-14 21s-16-9-14-21c1-5 4-9 6-13 1 4 3 7 6 8-1-7 0-13 2-19z" /></g>
        <g className="l3"><path className="loi" d="M32 47c2 6 8 9 8 16a8 8 0 0 1-16 0c0-7 6-10 8-16z" /></g>
      </svg>
      <i className="tan" /><i className="tan hai" /><i className="tan ba" />
      {ky ? <b className="ky">{ky}</b> : null}
    </span>
  )
}
/** Tia lửa màu đội bay vụt lên trên màn (như bay lên bảng) khi em bấm gửi — 14 hạt, lệch ngang / trễ cố định (không ngẫu nhiên ⇒ ảnh chụp ổn định). */
const TIA = [[-46, 0, 1], [38, 40, 0.8], [-12, 70, 1.2], [60, 110, 0.7], [-70, 130, 0.9], [16, 160, 1.1], [-30, 200, 0.75], [50, 220, 1], [-58, 260, 0.85], [6, 280, 1.3], [74, 320, 0.7], [-20, 350, 0.95], [28, 380, 0.8], [-40, 420, 1]] as const
function TiaBay() {
  return <div className="bpu-tia" aria-hidden="true"><i className="song" />{TIA.map(([x, d, s], i) => <i key={i} className={i % 3 === 2 ? 'vang' : undefined} style={{ ['--x' as string]: `${x}px`, ['--d' as string]: `${d}ms`, ['--s' as string]: s }} />)}</div>
}
/** KẾT QUẢ ĐÚNG / SAI của em (sau khi thầy mở đáp án): em chọn đúng XANH ✓, sai ĐỎ ✗, đáp án đúng luôn XANH; có chữ «Em chọn» / «Đáp án đúng» (màu không là kênh duy nhất). */
function KetQuaChon({ phan, chon, dung, emDung }: { phan: string; chon: string; dung: string; emDung: boolean }) {
  const c = chon.trim().toUpperCase(), d = dung.trim().toUpperCase()
  if (phan === 'I') return (
    <div className="bpu-kq-pa" role="list" aria-label="Phương án">
      {['A', 'B', 'C', 'D'].map((x) => {
        const la = x === d ? 'dung' : x === c ? 'sai' : undefined
        return <div key={x} role="listitem" className="bpu-kq-cot" data-kq={la} aria-label={`${x}${x === c ? ' · em chọn' : ''}${x === d ? ' · đáp án đúng' : ''}`}><div className="bpu-kq-o" data-kq={la}><b>{x}</b>{la ? <span>{la === 'dung' ? '✓' : '✗'}</span> : null}</div><small>{x === c ? 'Em chọn' : x === d ? 'Đáp án đúng' : ''}</small></div>
      })}
    </div>
  )
  if (phan === 'II') return (
    <div className="bpu-kq-y" role="list" aria-label="Bốn ý">
      {[0, 1, 2, 3].map((i) => {
        const e = c[i] === 'D' || c[i] === 'S' ? c[i] : '', ok = !!e && e === d[i], ten = (x?: string) => (x === 'D' ? 'Đúng' : x === 'S' ? 'Sai' : '—')
        return (
          <div key={i} role="listitem" className="bpu-kq-dong">
            <b>{'abcd'[i]})</b>
            <span className="bpu-kq-chip" data-kq={e ? (ok ? 'dung' : 'sai') : undefined}>Em: {ten(e)} {e ? (ok ? '✓' : '✗') : ''}</span>
            {!ok ? <span className="bpu-kq-chip" data-kq="dung">Đáp án: {ten(d[i])} ✓</span> : null}
          </div>
        )
      })}
    </div>
  )
  return (
    <div className="bpu-kq-y">
      {c ? <div className="bpu-kq-dong"><b>Em ghi</b><span className="bpu-kq-chip so" data-kq={emDung ? 'dung' : 'sai'}>{chon.trim()} {emDung ? '✓' : '✗'}</span></div> : null}
      {!emDung || !c ? <div className="bpu-kq-dong"><b>Đáp án đúng</b><span className="bpu-kq-chip so" data-kq="dung">{dung.trim()} ✓</span></div> : null}
    </div>
  )
}
/** Hiệu ứng gửi rút gọn trên máy yếu / khi em bật giảm chuyển động. */
const tinhLang = () => { try { return document.documentElement.classList.contains('may-yeu') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches } catch { return false } }
const BAY_MS = 1150
/** Số kJ có dấu: +100 · −50 (dấu trừ chuẩn) · 0. */
const dauKj = (n: number): string => (n > 0 ? `+${n.toLocaleString('vi-VN')}` : n < 0 ? `−${Math.abs(n).toLocaleString('vi-VN')}` : '0')
export const DEM_KJ_MS = 750
const chuKj = (n: number) => Math.round(n).toLocaleString('vi-VN')
/** SỐ kJ ĐẾM MƯỢT (thầy 09/11): đổi số ⇒ đếm dần tới số mới trong ~0,75 s (chậm dần cuối); TĂNG ⇒ chữ xanh + nảy nhẹ, GIẢM ⇒ chữ đỏ + rung nhẹ
 *  (`data-huong`, chỉ transform qua Web Animations). Số viết thẳng vào nút chữ mỗi khung — không vẽ lại React 60 lần/giây. Máy yếu / giảm chuyển động ⇒ đổi tức thì. */
export function SoKj({ v, className }: { v: number; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const hien = useRef(v)
  const [huong, setHuong] = useState<'tang' | 'giam' | null>(null)
  useLayoutEffect(() => { if (ref.current && !ref.current.textContent) ref.current.textContent = chuKj(hien.current) }, [])
  useEffect(() => {
    const el = ref.current, tu = hien.current
    if (!el || tu === v) return
    if (tinhLang() || typeof requestAnimationFrame !== 'function') { hien.current = v; el.textContent = chuKj(v); return }
    const len = v > tu
    setHuong(len ? 'tang' : 'giam')
    try {
      el.animate?.(len
        ? [{ transform: 'scale(1)' }, { transform: 'scale(1.22)', offset: 0.35 }, { transform: 'scale(0.96)', offset: 0.7 }, { transform: 'scale(1)' }]
        : [{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)', offset: 0.2 }, { transform: 'translateX(4px)', offset: 0.45 }, { transform: 'translateX(-2px)', offset: 0.7 }, { transform: 'translateX(0)' }],
      { duration: 520, easing: 'ease-out' })
    } catch { /* máy không hỗ trợ */ }
    let raf = 0, t0 = -1
    const buoc = (t: number) => {
      if (t0 < 0) t0 = t
      const p = Math.min(1, (t - t0) / DEM_KJ_MS), x = 1 - (1 - p) ** 3
      hien.current = tu + (v - tu) * x
      el.textContent = chuKj(hien.current)
      if (p < 1) raf = requestAnimationFrame(buoc)
      else { hien.current = v; setHuong(null) }
    }
    raf = requestAnimationFrame(buoc)
    return () => { if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf) }
  }, [v])
  return <b ref={ref} className={`bpu-so${className ? ` ${className}` : ''}`} data-huong={huong ?? undefined} />
}
export const THE_BD_MS = 2500
/** THẺ BIẾN ĐỘNG kJ của em (thầy 09/11): mục `bienDongEm` có `id` mới ⇒ thẻ nhỏ màu đúng (xanh) / sai (đỏ) + ngọn lửa đội + lý do, bay lên rồi mờ (~2,5 s).
 *  Lần đầu nhận view (mở màn / nối lại) chỉ ghi nhớ `id`, không phát lại chuyện cũ. Tối đa 3 thẻ cùng lúc. */
export function TheBienDong({ ds }: { ds: readonly BienDong[] | undefined }) {
  return <DsTheBienDong the={useTheBienDong(ds)} />
}
/** Trạng thái thẻ biến động (tách khỏi chỗ vẽ — 10/11: màn em vẽ thẻ ngay DƯỚI thanh đội đang hiện, trong hay ngoài lớp che, không mất thẻ khi đổi chỗ). */
function useTheBienDong(ds: readonly BienDong[] | undefined): BienDong[] {
  const daThay = useRef<number | null>(null)
  const [the, setThe] = useState<BienDong[]>([])
  const hen = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    if (!ds) return
    const max = ds.reduce((m, x) => Math.max(m, x.id), 0)
    if (daThay.current == null) { daThay.current = max; return }
    const moi = ds.filter((x) => x.id > daThay.current!)
    daThay.current = Math.max(daThay.current, max)
    if (!moi.length) return
    setThe((c) => [...c, ...moi].slice(-3))
    // Mỗi thẻ tự gỡ đúng ~2,5 s sau khi hiện (không xếp hàng chờ thẻ trước).
    const ids = new Set(moi.map((x) => x.id))
    hen.current.push(setTimeout(() => setThe((c) => c.filter((x) => !ids.has(x.id))), THE_BD_MS))
  }, [ds])
  useEffect(() => () => { for (const h of hen.current) clearTimeout(h) }, [])
  return the
}
/** Chồng thẻ biến động: nằm trong `.bpu-bd-neo` (mốc cao 0 đặt ngay dưới thanh đội / dải kết quả) ⇒ thẻ nổi XUỐNG phía dưới, không bao giờ đè thanh đội;
 *  các thẻ xếp cột có khe, không đè nhau. */
function DsTheBienDong({ the }: { the: readonly BienDong[] }) {
  if (!the.length) return null
  return (
    <div className="bpu-bd" role="status" aria-live="polite">
      {the.map((x) => {
        // Màu theo DẤU của số to trên thẻ (kJ em; em không đổi ⇒ kJ đội).
        const chinh = x.kjEm || x.kjDoi
        return (
          <div key={x.id} className="bpu-bd-the" data-kq={chinh > 0 ? 'dung' : chinh < 0 ? 'sai' : undefined}>
            <NgonLua doi={x.doi} />
            <b>{x.kjEm ? '' : 'Đội '}{dauKj(chinh)} kJ</b>
            <span>{x.lyDo}{x.kjEm && x.kjDoi ? ` · đội ${dauKj(x.kjDoi)} kJ` : ''}</span>
          </div>
        )
      })}
    </div>
  )
}
function NguyenTu({ ky, doi, to }: { ky: string; doi: number; to?: boolean }) {
  return (
    <div className={`bpu-ng${to ? ' to' : ''}`} style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-tin'})` }} aria-hidden="true">
      <span className="quy" /><span className="quy hai" /><b>{ky}</b>
    </div>
  )
}

/** GIỮ NỐI SẴN (thầy 07/11 «gửi câu tức thì»): `giuNoi` ⇒ màn nối phòng ngay khi em điểm danh xong rồi nằm ẨN; thầy mở lượt mới ⇒ tự hiện tức thì
 *  (không nạp, không xin vé lại). «Rời» ⇒ ẩn (vẫn nối), lượt sau lại tự hiện. `mo` đổi ⇒ hiện ngay (nút «Vào Bình Phản Ứng» / kênh đẩy).
 *  `chan()` đúng (đang thi / phòng chờ / kiểm tra cá nhân) ⇒ KHÔNG tự hiện. */
export default function ManBinhPhanUng({ token, buoiId, onDong, giuNoi = false, mo = 1, chan }: { token: string; buoiId?: string | null; onDong: () => void; giuNoi?: boolean; mo?: number; chan?: () => boolean }) {
  const [an, setAn] = useState(giuNoi && mo <= 0)
  const boLuot = useRef(-1)
  useEffect(() => { if (mo > 0) setAn(false) }, [mo])

  const [v, setV] = useState<ViewEm | null>(null)
  // 09/11 thầy «khi tôi kết thúc buổi học thì học sinh mới thoát được màn này, còn lại khoá cứng»: KHÔNG còn nút / lệnh rời Bình Phản Ứng.
  const [tt, setTt] = useState<'noi' | 'mat-mang' | 'chua-mo' | 'khong-buoi' | 'tat' | 'ok'>('noi')
  const [chon, setChon] = useState('')
  const [baoTra, setBaoTra] = useState('')
  const [vuaRoi, setVuaRoi] = useState(false)
  /** Lần rời gần nhất là CỬA SỔ NỔI (app vẫn hiện nhưng mất tiêu điểm) ⇒ cảnh báo riêng «không được dùng cửa sổ nổi». */
  const [noi, setNoi] = useState(false)
  /** Khoá lượt (số:giờ mở) em vừa BẤM GỬI trên máy (che ngay, không chờ phòng báo lại — mất mạng vẫn che); lượt mới ⇒ số khác ⇒ tự mở. */
  const [cheSo, setCheSo] = useState('')
  /** Khoá lượt đang chạy hiệu ứng gửi (tia lửa bay lên) — xong ~1,15 s thì đề bên dưới mới gỡ khỏi màn. */
  const [bay, setBay] = useState('')
  /** Đã báo phòng «rời» ⇒ app hiện lại thì gửi `ve`. */
  const daBaoRoi = useRef(false)
  const [nay, setNay] = useState(() => Date.now())
  const ws = useRef<WebSocket | null>(null)
  /** LIVE: lớp live (nạp lười) nhận mọi tin của phòng qua `tin`, được báo khi nối lại qua `noiLai`; `veLive` = vé + gốc máy chủ của kết nối hiện tại. */
  const cauLive = useRef<{ tin: ((d: unknown) => void) | null; noiLai: (() => void) | null }>({ tin: null, noiLai: null })
  const [veLive, setVeLive] = useState<{ ve: string; goc: string } | null>(null)
  const dung = useRef(false)
  const loi = useRef(0)
  const choGui = useRef<Tin[]>([])
  const luotChon = useRef(0)
  const chuaMo = useRef(false)
  const soLuot = v?.luot?.so ?? 0
  const [LC, setLC] = useState<MangChang | null>(null)
  /** Gốc màn — giám thị nghe chạm / rê trong phần trả lời (`.duo-tra`) để mắt dõi theo ô em chọn. */
  const gocRef = useRef<HTMLDivElement>(null)
  const theBd = useTheBienDong(v?.em ? v.bienDongEm : undefined)
  useEffect(() => { let huy = false; void import('../hoc-tap/ManLamBaiTap').then((m) => { if (!huy) setLC(m.PHAN_CAU_CHANG) }).catch(() => {}); return () => { huy = true } }, [])

  const gui = useCallback((t: Tin) => {
    const w = ws.current
    if (w && w.readyState === 1) { try { w.send(JSON.stringify(t)); return true } catch { /* rớt */ } }
    choGui.current.push(t)
    return false
  }, [])
  /** Số lần rời phòng đã ghi cho em (`viewEm.em.roi`) — biên nhận cho `roi`. */
  const emRoi = useRef<number | null>(null)
  /** `roi` đã đẩy vào kết nối nhưng CHƯA thấy biên nhận (em.roi chưa tăng): giữ số cũ. iPhone treo trang ⇒ kết nối có thể chết cùng tin; nối lại mà phòng
   *  vẫn chưa ghi ⇒ GỬI BÙ `roi` (rồi `ve` nếu em đã quay lại). Chưa nối (`gui` trả false) ⇒ tin nằm hàng chờ, nối lại tự gửi — không cần bù. */
  const buRoi = useRef<number | null>(null)
  const kiemBu = useRef(false)
  /** BÁO RỜI: gửi `roi` ngay (đồng bộ). Một lần cho tới khi về lại (phòng cũng chặn trùng). */
  const baoRoi = useCallback((laNoi: boolean) => {
    setNoi(laNoi); setVuaRoi(true)
    if (daBaoRoi.current) return
    daBaoRoi.current = true
    const truoc = emRoi.current
    buRoi.current = gui({ t: 'roi' }) && truoc != null ? truoc : null
  }, [gui])
  /** VỀ LẠI CÓ XÁC NHẬN (10/11 thầy «quay lại Bình Phản Ứng vẫn chưa ẩn cảnh báo»): trước đây `ve` chỉ gửi MỘT lần đúng lúc trang hiện lại — lúc ấy chưa có
   *  tiêu điểm, hoặc tin đi vào kết nối đã chết (máy treo trang khi ra ngoài) ⇒ bảng đỏ mãi. Nay: còn nợ `ve` (đã báo rời / phòng còn ghi `dangRoi` / `ve` chưa
   *  được phòng xác nhận) ⇒ tự thử lại mỗi 0,5 s tới khi phòng xác nhận; em chạm vào màn = chắc chắn đã về (không cần chờ tiêu điểm); gửi `ve` quá 2,5 s
   *  mà phòng im ⇒ kết nối chết ⇒ nối lại ngay (phòng tự gỡ «đang rời» khi em nối lại). Trang ẩn / đang chia đôi / cửa sổ nổi giữ tiêu điểm ⇒ KHÔNG gửi. */
  const phongRoi = useRef(false)
  const choVe = useRef(0)
  const lucVe = useRef(0)
  const henVe = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const noiLai = useRef<(() => void) | null>(null)
  const thuVeRef = useRef<(tuongTac?: boolean) => void>(() => {})
  const thuVe = useCallback((tuongTac = false) => {
    clearTimeout(henVe.current)
    if (dung.current || !(daBaoRoi.current || phongRoi.current || choVe.current)) return
    if (document.hidden) return // trang ẩn: không hẹn giờ nền; trang hiện lại (visibilitychange / pageshow / focus) sẽ gọi lại
    henVe.current = setTimeout(() => thuVeRef.current(), 500)
    if (dangChiaDoi() || !(tuongTac || document.hasFocus())) return
    const nay = Date.now()
    if (daBaoRoi.current || (phongRoi.current && nay - lucVe.current > 1000)) {
      daBaoRoi.current = false; lucVe.current = nay
      if (!choVe.current) choVe.current = nay
      gui({ t: 've' })
    }
    if (choVe.current && nay - choVe.current > 2500) { choVe.current = nay; noiLai.current?.() }
  }, [gui])
  thuVeRef.current = thuVe
  const veLai = useCallback(() => thuVe(), [thuVe])

  // Nối phòng: xin vé (theo buổi em vừa điểm danh, hoặc buổi đang mở hôm nay em có mặt) ⇒ WebSocket; rớt ⇒ nối lại lùi dần; phòng chưa mở ⇒ hỏi lại sau 8 giây.
  useEffect(() => {
    dung.current = false
    let hen: ReturnType<typeof setTimeout> | undefined
    let ping: ReturnType<typeof setInterval> | undefined
    const henLai = (ms?: number) => { if (dung.current) return; clearTimeout(hen); hen = setTimeout(() => void noi(), ms ?? LUI_MS[Math.min(loi.current++, LUI_MS.length - 1)]) }
    async function noi() {
      if (dung.current) return
      try {
        const goc = (await layDiaChiMayChu('')) || GOC_MAC_DINH
        const duong = buoiId ? '/hs/bpu/ve' : '/hs/bpu/cua-em'
        const r = await fetch(`${goc}${duong}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token, buoiId: buoiId ?? undefined }) })
        const j = (await r.json().catch(() => null)) as { ok?: boolean; ve?: string; buoiId?: string | null; lyDo?: string } | null
        if (dung.current) return
        if (j?.lyDo === 'tat') { setTt('tat'); return }
        if (j?.ok && !j.ve) { setTt('khong-buoi'); return }
        if (!j?.ok || !j.ve) { setTt('mat-mang'); henLai(); return }
        const w = new WebSocket(`${goc.replace(/^http/, 'ws')}/bpu/phong?ve=${encodeURIComponent(j.ve)}`)
        ws.current = w
        w.binaryType = 'arraybuffer' // live: khung nét nhị phân
        setVeLive((c) => (c && c.ve === j.ve && c.goc === goc ? c : { ve: String(j.ve), goc }))
        w.onopen = () => {
          loi.current = 0
          cauLive.current.noiLai?.()
          kiemBu.current = buRoi.current != null
          w.send(JSON.stringify({ t: 'vao' })); w.send(JSON.stringify({ t: 'chao' }))
          const cho = choGui.current.splice(0); for (const t of cho) { try { w.send(JSON.stringify(t)) } catch { /* rớt */ } }
          clearInterval(ping); ping = setInterval(() => { try { w.send('{"t":"ping"}') } catch { /* rớt */ } }, 45_000)
        }
        w.onmessage = (e) => {
          cauLive.current.tin?.(e.data)
          if (typeof e.data !== 'string') return
          let m: Tin
          try { m = JSON.parse(e.data) as Tin } catch { return }
          if (m.t === 'em') {
            phongRoi.current = (m as unknown as ViewEm).em?.dangRoi === true
            if (!phongRoi.current) choVe.current = 0 // phòng xác nhận em không còn «đang rời» (phòng đời cũ không có cờ ⇒ tin nào về cũng là kết nối còn sống)
            const so = (m as unknown as ViewEm).em?.roi
            if (typeof so === 'number') {
              emRoi.current = so
              if (buRoi.current != null && so > buRoi.current) buRoi.current = null // phòng đã ghi lần rời
              else if (kiemBu.current && buRoi.current != null) { // nối lại: phòng chưa ghi ⇒ tin `roi` đã mất cùng kết nối cũ ⇒ gửi bù
                buRoi.current = null; gui({ t: 'roi' })
                if (!document.hidden && document.hasFocus() && !dangChiaDoi()) { daBaoRoi.current = false; gui({ t: 've' }) } else daBaoRoi.current = true
              }
            }
            kiemBu.current = false
            chuaMo.current = false; setV(m as unknown as ViewEm); setTt('ok')
            if (phongRoi.current) thuVeRef.current() // phòng còn ghi «đang rời» mà em đang ở đây ⇒ gỡ
          }
          else if (m.t === 'chua-mo') { chuaMo.current = true; setTt('chua-mo'); try { w.close() } catch { /* đã đóng */ } }
          else if (m.t === 'tra-kq' && m.ok === false) setBaoTra(m.ly === 'het-gio' ? 'Hết giờ, đáp án gửi muộn không được tính.' : m.ly === 'da-khoa' ? 'Thầy đã khoá lượt này.' : m.ly === 'la' ? 'Em không thuộc lớp của buổi này.' : '')
        }
        w.onclose = () => { if (ws.current !== w) return; ws.current = null; clearInterval(ping); if (dung.current) return; if (chuaMo.current) henLai(8000); else { setTt('mat-mang'); henLai() } }
        w.onerror = () => { try { w.close() } catch { /* đã đóng */ } }
      } catch { setTt('mat-mang'); henLai() }
    }
    // Kết nối «mở» nhưng đã chết (phòng im sau `ve`): bỏ hẳn, nối mới ngay. Đang nối dở (ws rỗng) ⇒ để luồng nối lại sẵn có lo, không mở hai kết nối.
    noiLai.current = () => { const w = ws.current; if (!w || w.readyState !== 1) return; ws.current = null; clearInterval(ping); try { w.close() } catch { /* đã đóng */ } loi.current = 0; henLai(0) }
    void noi()
    return () => { dung.current = true; noiLai.current = null; clearTimeout(henVe.current); clearTimeout(hen); clearInterval(ping); try { ws.current?.close() } catch { /* đã đóng */ } ws.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, buoiId])

  // Lượt mới ⇒ xoá lựa chọn cũ.
  useEffect(() => { if (soLuot !== luotChon.current) { luotChon.current = soLuot; setChon(''); setBaoTra('') } }, [soLuot])
  // Đang ẩn (giữ nối) mà thầy mở lượt mới ⇒ hiện ngay — trừ khi em đang thi / ở phòng chờ / làm kiểm tra cá nhân.
  const coLuot = !!v?.luot
  useEffect(() => { if (an && coLuot && soLuot > boLuot.current && !v?.ketThuc && !chan?.()) setAn(false) }, [an, coLuot, soLuot, v?.ketThuc, chan])

  useEffect(() => { if (!bay) return; const h = setTimeout(() => setBay(''), BAY_MS); return () => clearTimeout(h) }, [bay])
  // VỀ LẠI MÀN (thầy 09/11 bỏ trừ kJ): đã báo «rời» mà app hiện lại ⇒ báo phòng `ve` (gỡ tên em khỏi «đang rời» trên bảng). Nghe ở mức màn — kể cả khi
  // trong lúc em rời thầy đã mở đáp án (lúc ấy nhánh nghe rời màn đã gỡ). Mất mạng ⇒ `ve` nằm hàng chờ, nối lại là gửi sau `vao`/`chao`.
  useEffect(() => {
    const hien = () => veLai()
    document.addEventListener('visibilitychange', hien)
    window.addEventListener('pageshow', hien)
    window.addEventListener('focus', hien) // tắt cửa sổ nổi / chạm lại vào app ⇒ về lại
    return () => { document.removeEventListener('visibilitychange', hien); window.removeEventListener('pageshow', hien); window.removeEventListener('focus', hien) }
  }, [gui])

  // Đồng hồ êm (không đổi màu, không nháy — luật C14).
  const coHan = !!v?.luot?.han && v.luot.pha === 'tra-loi'
  useEffect(() => { if (!coHan) return; const h = setInterval(() => setNay(Date.now()), 500); return () => clearInterval(h) }, [coHan])

  // RỜI MÀN — LUẬT 10/11 (thầy «ok giữ chặt, làm cảnh báo tức thì cho mọi điện thoại»; «chỉ tắt màn hình mới không báo»). Đo MỌI LÚC màn đang hiện
  // (cả lúc chờ / đã che) tới khi thầy kết thúc buổi. Không có nút rời (09/11); nút Back bị giữ.
  //  • Trang ẩn (thoát app, về màn hình chính, chuyển app, khoá màn): máy KHÔNG phân biệt được tắt màn (iPhone/iPad, Android chưa/không cho quyền
  //    IdleDetector) ⇒ gửi `roi` ĐỒNG BỘ ngay trong visibilitychange — không hẹn giờ (Safari treo JS ngay khi ẩn, hẹn giờ sẽ không kịp chạy). Khoá màn
  //    trên các máy này CŨNG tính là rời (thầy chọn giữ chặt). Android có quyền ⇒ hỏi tươi IdleDetector (một vòng IPC, vài ms — `tat-man.ts`): 'locked' ⇒
  //    tắt màn, KHÔNG báo; còn lại ⇒ báo.
  //  • Trang vẫn hiện nhưng mất tiêu điểm (cửa sổ nổi, bong bóng chat, iPad Slide Over) hoặc cửa sổ co lại (chia đôi màn hình, iPad Split View) quá NOI_MS ⇒
  //    báo «cửa sổ nổi». Hộp hỏi quyền IdleDetector đang hiện ⇒ không báo. Android có quyền + màn đã khoá ⇒ không báo.
  //  • Đóng trang (pagehide) mà chưa báo ⇒ báo, trừ khi lần ẩn này đã biết là tắt màn.
  const dangChoi = !an && !!v && !v.ketThuc
  useEffect(() => {
    if (!dangChoi) return
    docQuyenTatMan()
    let huy = false, lan = 0
    /** Lần ẩn hiện tại là TẮT MÀN (IdleDetector báo 'locked') ⇒ pagehide cũng không báo. */
    let tatMan = false
    let henKhoa: ReturnType<typeof setTimeout> | undefined
    /** Trong lúc tắt màn: hỏi lại mỗi KIEM_KHOA_MS — mở khoá mà trang vẫn ẩn (2 lần liền) ⇒ em đã vào thẳng app khác. */
    const canhKhoa = (lanNay: number, soMo: number) => {
      clearTimeout(henKhoa)
      henKhoa = setTimeout(() => {
        void kiemKhoaMan().then((khoa) => {
          if (huy || lanNay !== lan || !document.hidden) return
          const mo = khoa === true ? 0 : soMo + 1
          if (mo >= 2) { tatMan = false; baoRoi(false); return }
          canhKhoa(lanNay, mo)
        })
      }, KIEM_KHOA_MS)
    }
    const doi = () => {
      lan += 1
      if (!document.hidden) { tatMan = false; clearTimeout(henKhoa); return }
      if (daBaoRoi.current) return
      if (!coQuyenTatMan()) { baoRoi(false); return }
      const lanNay = lan
      void kiemKhoaMan().then((khoa) => {
        if (huy) return
        if (khoa === true) { if (lanNay === lan) { tatMan = true; canhKhoa(lanNay, 0) } return }
        baoRoi(false)
        veLai() // em đã quay lại trong lúc hỏi (chuyển app chớp nhoáng) ⇒ vẫn báo, rồi gỡ ngay để bảng không đỏ mãi
      })
    }
    let henNoi: ReturnType<typeof setTimeout> | undefined
    const kiemNoi = () => {
      clearTimeout(henNoi)
      henNoi = setTimeout(() => {
        if (huy || document.hidden) return
        const chia = dangChiaDoi()
        if (!chia && document.hasFocus()) { veLai(); return } // về lại cỡ đủ / lấy lại tiêu điểm
        if (daBaoRoi.current || dangXinQuyen()) return
        if (chia || !coQuyenTatMan()) { baoRoi(true); return }
        void kiemKhoaMan().then((khoa) => { if (!huy && khoa !== true && !document.hidden && !document.hasFocus()) baoRoi(true) })
      }, Math.max(NOI_MS, conKhoaXoay() + 30)) // live: đang «khoá xoay» ⇒ xét sau khi hết khoá (tat-man.ts)
    }
    // LIVE (đặc tả 4.7): máy xoay / vào-ra toàn màn hình ⇒ cỡ cửa sổ và hướng màn lệch nhau vài chục ms ⇒ khoá 600 ms rồi xét lại.
    const xoay = () => { khoaXoay(); kiemNoi() }
    const anTrang = () => { if (document.hidden && !daBaoRoi.current && !tatMan) baoRoi(false) }
    document.addEventListener('visibilitychange', doi)
    window.addEventListener('blur', kiemNoi)
    window.addEventListener('focus', kiemNoi)
    window.addEventListener('resize', kiemNoi)
    window.addEventListener('orientationchange', xoay)
    document.addEventListener('fullscreenchange', xoay)
    window.addEventListener('pagehide', anTrang)
    const cham = () => thuVe(true) // em chạm vào màn Bình Phản Ứng ⇒ chắc chắn đã về (cửa sổ nổi nhận chạm thì trang này không nhận)
    window.addEventListener('pointerdown', cham, true)
    if (dangChiaDoi()) kiemNoi() // vào BPU khi đang chia đôi
    try { window.history.pushState({ bpu: 1 }, '') } catch { /* trình duyệt cũ */ }
    const giuLai = () => { try { window.history.pushState({ bpu: 1 }, '') } catch { /* bỏ qua */ } }
    window.addEventListener('popstate', giuLai)
    return () => {
      huy = true; clearTimeout(henNoi); clearTimeout(henKhoa)
      document.removeEventListener('visibilitychange', doi); window.removeEventListener('blur', kiemNoi); window.removeEventListener('focus', kiemNoi)
      window.removeEventListener('resize', kiemNoi); window.removeEventListener('pagehide', anTrang); window.removeEventListener('popstate', giuLai)
      window.removeEventListener('orientationchange', xoay); document.removeEventListener('fullscreenchange', xoay)
      window.removeEventListener('pointerdown', cham, true)
    }
  }, [baoRoi, veLai, thuVe, dangChoi])
  // GIỮ MÀN SÁNG (thầy 10/11 «cho mọi điện thoại»): từ lúc phòng nối (có `viewEm`) tới khi thầy kết thúc buổi — kể cả lúc màn BPU đang ẩn chờ lượt.
  // wakeLock; không có / bị từ chối / app cài trên iOS ⇒ video câm dự phòng (`giu-sang.ts`). Kết thúc buổi / gỡ màn ⇒ nhả hết.
  const giuSangBat = !!v && !v.ketThuc
  useEffect(() => (giuSangBat ? giuSang() : undefined), [giuSangBat])
  const dangXinTm = useRef(false)

  // Toàn màn hình ở lần chạm đầu (trình duyệt chỉ cho khi có thao tác của em; không hỗ trợ ⇒ bỏ qua).
  // CHẠM ĐẦU (10/11): bắt ở `click` chứ không ở `pointerdown` — theo chuẩn HTML, `pointerdown` của ngón tay KHÔNG tính là thao tác người dùng (chỉ
  // `pointerup` / `touchend` / `click`) ⇒ trên điện thoại xin toàn màn hình / xin quyền ở `pointerdown` bị từ chối âm thầm. Xin quyền IdleDetector TRƯỚC:
  // `requestFullscreen` tiêu mất lượt thao tác.
  // Đã toàn màn hình ⇒ KHÔNG xin lại (mỗi lần xin Chrome lại hiện dòng hướng dẫn thoát); đang chờ trình duyệt trả lời lần xin trước ⇒ không xin chồng.
  const xinToanMan = () => {
    if (dangXinTm.current) return
    try {
      const d = document.documentElement as HTMLElement & { requestFullscreen?: () => Promise<void> }
      if (document.fullscreenElement || !d.requestFullscreen) return
      dangXinTm.current = true
      void d.requestFullscreen().catch(() => {}).finally(() => { dangXinTm.current = false })
    } catch { dangXinTm.current = false }
  }
  const chamDau = () => { xinQuyenTatMan(); xinToanMan() }

  const l = v?.luot ?? null
  const e = v?.em ?? null
  const doi = e ? e.doi : 0
  const tenDoi = DOI_BPU[doi]?.ten ?? ''
  const q = (l?.cau ?? null) as unknown as Question | null
  // Trả lời ngắn: phải có ít nhất một chữ số (chỉ «−» / «,» vẫn là ô trống ⇒ nút gửi chưa bật ra).
  const duChon = !!l && (l.tuLuan || (l.phan === 'II' ? /^[DS]{4}$/.test(chon) : l.phan === 'I' ? chon.trim().length > 0 : /\d/.test(chon)))
  // Khoá lượt = số lượt + giờ mở: phòng bỏ lượt rỗng rồi mở câu khác cùng số ⇒ khoá khác ⇒ không che nhầm câu em chưa thấy.
  const khoaLuot = l ? `${l.so}:${l.batDau}` : ''
  // 09/11 thầy «che luôn cả em chưa gửi»: thầy mở đáp án ⇒ MỌI máy che (em chưa gửi cũng chỉ thấy kết quả, không đề, không lời giải) — nhìn lên bảng chữa bài.
  const che = !!l && (!!l.emTra || cheSo === khoaLuot || l.pha === 'mo')
  const dangBay = !!l && bay === khoaLuot
  const guiTra = () => {
    if (!l || !duChon || che) return
    gui({ t: 'tra', chon: l.tuLuan ? 'xong' : chon })
    setCheSo(khoaLuot)
    if (!tinhLang()) setBay(khoaLuot)
    try { navigator.vibrate?.([18, 40, 26]) } catch { /* máy không rung */ }
    // toàn màn hình + xin quyền: lớp ngoài (`chamDau`) lo — lần bấm này nổi bọt lên đó.
  }
  // HẾT GIỜ mà em chưa gửi (thầy 07/11): khoá, câu để trống — không gửi muộn, không đoán bừa.
  const hetGio = !!l?.han && l.pha === 'tra-loi' && nay >= l.han && !l.emTra
  const phimSo = (p: string) => setChon((c) => (p === '−' ? (c.startsWith('-') ? c.slice(1) : '-' + c) : (c + p).slice(0, 8)))

  const kjDoiSo = v?.doi.kj ?? 0, kjDoi = kjDoiSo.toLocaleString('vi-VN')
  const tren = (phu: string) => (
    <header className={`bpu-hs-tren${e ? ' co-doi' : ''}`}>
      {e ? <NgonLua doi={doi} /> : <BinhNho />}
      <div className="bpu-hs-tieu"><b>{e ? tenDoi : 'Bình Phản Ứng'}</b><span>{phu}</span></div>
      {e ? <div className="bpu-hs-kj" aria-label={`${tenDoi} đang có ${kjDoi} kJ`}><SoKj v={kjDoiSo} /><span>kJ đội</span></div> : null}
      {coHan && l?.han ? <div className="bpu-hs-gio" aria-label={`Còn ${gio(l.han - nay)}`}>{gio(l.han - nay)}</div> : null}
    </header>
  )
  const nhanDoi = `Bình Phản Ứng${l ? ` · Lượt ${l.so}` : ''}`
  // ĐỀ GIỐNG CHẶNG (thầy 10/11 «Đề hiển thị ko đúng, cho hiển thị đề giống với phần chặng luôn, có giám thị»): dùng lại NGUYÊN khối đề của màn làm chặng
  // (`KhoiDeChang`: giám thị theo mức câu + bong bóng đề chữ L + tranh minh hoạ + thẻ «hình của đề vẽ lại») trong ĐÚNG chuỗi lớp của chặng
  // (`.ht-app.ht2-lam.duo`) ⇒ cùng tờ kiểu, cùng cỡ chữ, cùng cách xử lí ảnh nền trắng trên nền tối. Trước đây `DeCau` đứng ngoài chuỗi lớp ấy nên ra thẻ trơn
  // khác chặng, thiếu hình vẽ lại và ảnh cuối câu. Không bọc «chạm để hiểu đề» (gợi ý) — lượt thi đua không có trợ giúp. Giám thị: em gửi ⇒ `nop`; thầy mở
  // đáp án ⇒ `ket` (đúng / sai / chưa tính). Mảnh giám thị nạp lười (đã nằm trong kho tải ngầm của app học sinh); máy yếu / giảm chuyển động ⇒ tự đứng yên.
  // Giao diện cũ (máy lùi `ddh.trong` = 'tat', <html> không có data-trong): màn chặng cũng không dùng khối này ⇒ giữ `DeCau` trơn như trước.
  const kieuChang = !!document.documentElement.dataset.trong
  const boChang = (con: React.ReactNode) => (kieuChang ? <div className="ht-app ht2-lam duo bpu-de-chang" data-duo="">{con}</div> : con)
  const deChang = (cau: Question, stt: number, muc: ReturnType<MangChang['mucGiamThi']>, nop: boolean, ket: 'dung' | 'sai' | 'trung' | null) => !LC
    ? <p className="bpu-de-tho">{cau.text}</p>
    : !kieuChang ? <LC.DeCau q={cau} stt={stt} />
    : boChang(<LC.KhoiDeChang q={cau} muc={muc} phien={`bpu:${buoiId ?? ''}`} nop={nop} ket={ket} vung={() => gocRef.current}><LC.DeCau q={cau} stt={stt} /></LC.KhoiDeChang>)
  // 10/11 (thầy báo dải kết quả đè thanh đội): dải KẾT QUẢ LÊN BẢNG và mốc THẺ ±kJ nằm TRONG DÒNG CHẢY, ngay dưới thanh đội đang hiện — trong lớp che:
  // dưới «Đội … kJ đội»; ngoài lớp che: dưới đầu màn. Không còn lớp nổi tuyệt đối đè chữ.
  // 10/11 (thầy «bỏ em đạt, chỉ ghi đạt / không đạt nổi bật»): kết quả lên bảng là MỘT NHÃN bên phải thanh đội (trong lớp che) — em được gọi kèm kJ thật
  // của em lượt này: mục biến động mới nhất của em từ lúc mở lượt có lý do «… bảng» (phòng ghi; không tính lại trên máy).
  const laEmGoi = !!e && !!l?.goi && l.goi.sbd === e.sbd
  const bdBang = laEmGoi && l ? (v?.bienDongEm ?? []).filter((x) => x.luc >= l.batDau && /bảng/i.test(x.lyDo)).slice(-1)[0] : undefined
  const ketQuaBang = e && l?.goi && l.pha === 'mo' && !v?.ketThuc ? <KetQuaLenBangEm g={l.goi} laEm={laEmGoi} kjEm={bdBang?.kjEm ?? null} /> : null
  const neoBd = e ? <div className="bpu-bd-neo"><DsTheBienDong the={theBd} /></div> : null
  let lopChe: React.ReactNode = null

  let than: React.ReactNode
  let day: React.ReactNode = null
  /** Nút gửi NỔI ở mép phải (10/11) — chỉ có khi em đang làm câu (chưa che, chưa mở đáp án, chưa hết giờ) hoặc đang chạy hiệu ứng gửi (thu vào mép). */
  let nutGui: React.ReactNode = null
  if (tt === 'tat' || tt === 'khong-buoi') {
    than = <div className="bpu-hs-giua"><h3>{tt === 'tat' ? 'Bình Phản Ứng đang tạm tắt' : 'Lớp chưa mở Bình Phản Ứng'}</h3><p>{tt === 'tat' ? 'Thầy sẽ chiếu câu như thường trên bảng.' : 'Khi thầy mở, câu sẽ tự hiện ở đây.'}</p></div>
    day = <button type="button" className="bpu-nut" onClick={onDong}>Đóng</button>
  } else if (!v || !e) {
    than = <div className="bpu-hs-giua"><div className="bpu-hs-xuong" aria-hidden="true" /><h3>{tt === 'chua-mo' ? 'Chờ thầy mở Bình Phản Ứng' : tt === 'mat-mang' ? 'Đang nối lại…' : 'Đang vào lớp…'}</h3><p>Em giữ màn này, câu sẽ tự hiện.</p></div>
    if (tt === 'chua-mo') day = <button type="button" className="bpu-nut phu" onClick={onDong}>Để sau</button>
  } else if (v.ketThuc) {
    than = (
      <div className="bpu-hs-giua"><NguyenTu ky={kyHieu(e.ten)} doi={doi} to /><h3>Xong Bình Phản Ứng</h3>
        <div className="bpu-luoi"><div><b>{e.dungSo}/{v.soLuot}</b><span>lượt đúng</span></div><div><SoKj v={e.kj} /><span>kJ</span></div><div><b>{e.hang}/{e.soEm}</b><span>hạng</span></div></div>
        <p className="nho">kJ chỉ tính trong buổi này.</p></div>
    )
    day = <button type="button" className="bpu-nut" onClick={onDong}>Về chặng đang làm</button>
  } else if (vuaRoi) {
    // SỬA CÓ CHỦ ĐÍCH 09/11 (lần 2, luật chặt «thoát màn hình cảnh báo bị trừ cả đội và cá nhân»): nhắc rõ mức trừ (em và đội), giọng tế nhị.
    const tru = <p className="bpu-tru">Rời màn hình: em −{KJ.roiMan} kJ · đội −{KJ.roiMan} kJ</p>
    than = noi ? <div className="bpu-hs-giua bpu-noi"><div className="bpu-canh" aria-hidden="true">!</div><h3>Không được dùng cửa sổ nổi</h3><p>Em vừa mở ứng dụng nổi / chia đôi màn hình. Bảng đang báo đỏ tên em trước cả lớp.</p>{tru}<p className="nho">Tắt cửa sổ nổi hoặc chia đôi màn hình, chạm vào đây và nhìn lên bảng.</p></div> : <div className="bpu-hs-giua"><div className="bpu-canh" aria-hidden="true">!</div><h3>Em vừa rời màn hình</h3><p>Bảng đang báo tên em — quay lại tập trung lên bảng.</p>{tru}<p className="nho">{coQuyenTatMan() ? 'Thoát app hay chuyển app đều bị tính là rời. Em ở lại màn này tới khi thầy kết thúc.' : 'Thoát app, chuyển app hay tắt màn hình đều bị tính là rời. Màn hình tự sáng suốt buổi, em ở lại màn này tới khi thầy kết thúc.'}</p></div>
    day = <button type="button" className="bpu-nut" onClick={() => setVuaRoi(false)}>Quay lại lượt đang làm</button>
  } else if (!l) {
    than = (
      <div className="bpu-hs-giua"><NguyenTu ky={kyHieu(e.ten)} doi={doi} to /><h3>{e.luc ? `Em đã vào lớp lúc ${gioPhut(e.luc)}` : 'Em đã vào lớp'}</h3>
        <div className="bpu-doi-the" style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau})` }}><b>{tenDoi} · {v.doi.so}/{v.doi.tong} bạn đã vào</b><div className="vach"><i style={{ width: `${(v.doi.so / Math.max(1, v.doi.tong)) * 100}%` }} /></div><span>Đội đang có <SoKj v={kjDoiSo} /> kJ.</span></div>
        <p>Thầy chiếu câu nào, câu đó tự hiện ở đây. Đang làm câu mà rời màn là thầy thấy trên bảng.</p></div>
    )
    day = null // 09/11 thầy «bỏ chữ rời bình phản ứng … khoá cứng»: không còn nút rời — chỉ «Kết thúc buổi học» của thầy mới cho em thoát.
  } else if ((l.pha === 'goi' || l.pha === 'lam-bang') && l.goi) {
    const g = l.goi, cung = g.doi === doi
    if (g.sbd === e.sbd) {
      than = (
        <div className="bpu-hs-giua"><NguyenTu ky={kyHieu(g.ten)} doi={g.doi} to /><h3>Em được mời lên bảng!</h3><p>Câu đang chiếu trên bảng. Em lên trình bày cho cả lớp nhé.</p>
          <div className="bpu-giai"><b>Vì sao thầy chọn em</b>{g.lyDo.map((x, i) => <span key={i}>{x}</span>)}</div>
          <div className="bpu-the">{DOI_BPU[g.doi]?.ten} đang tiếp sức em: <b>{g.tiep}</b> lượt · đội <SoKj v={kjDoiSo} /> kJ</div>
          <p className="nho">Giải đúng trên bảng: em +{KJ.lenBangDatEm} kJ, đội +{KJ.lenBangDat} kJ.</p></div>
      )
    } else {
      than = (
        <>
          <div className="bpu-ban" style={{ ['--doi' as string]: `var(${DOI_BPU[g.doi]?.mau})` }}><b className="ky">{kyHieu(g.ten)}</b><div><b>{g.ten}</b><span>{DOI_BPU[g.doi]?.ten} · đang lên bảng</span></div></div>
          <p className="bpu-hoi">Em đoán bạn ấy làm đúng không?</p>
          <div className="bpu-hai">
            <button type="button" aria-pressed={g.emDoan === 1} disabled={g.emDoan !== null || g.dat != null} onClick={() => gui({ t: 'doan', v: 1 })}>Làm đúng</button>
            <button type="button" aria-pressed={g.emDoan === 0} disabled={g.emDoan !== null || g.dat != null} onClick={() => gui({ t: 'doan', v: 0 })}>Chưa đúng</button>
          </div>
          <p className="nho">Đoán đúng +{KJ.doanDung} kJ cho em. Mỗi lần chạm nút dưới, một tia lửa bay lên bảng tới bạn ấy.</p>
          {q && !che ? <div className="bpu-de-xem"><span className="m3-chip">Đề trên bảng · chỉ xem</span>{deChang(q, l.so, null, false, null)}</div> : null}
        </>
      )
      day = <button type="button" className="bpu-nut tiep" style={{ ['--doi' as string]: `var(${DOI_BPU[g.doi]?.mau})` }} disabled={g.emTiep >= 10} onClick={() => gui({ t: 'tiep' })}>{cung ? `Tiếp sức ${DOI_BPU[g.doi]?.ten}` : 'Cổ vũ bạn ấy'} · {g.emTiep}/10</button>
    }
  } else if (q) {
    const daGui = !!l.emTra
    const kb = !!l.emTra?.kb
    const daMo = l.pha === 'mo'
    const chonHien = daGui ? l.emTra!.chon : chon
    const k = l.ketQua
    const chuDung = l.tuLuan ? '' : l.phan === 'II' ? (l.dung ?? '').split('').map((x, i) => `${'abcd'[i]}) ${x === 'D' ? 'Đúng' : 'Sai'}`).join(' · ') : String(l.dung ?? '')
    const baoMang = tt === 'mat-mang' ? <div className="bpu-bao" role="status">Mất kết nối, đang nối lại… Đáp án em chọn vẫn giữ trên máy, nối lại là gửi.</div> : null
    if (che) {
      // LỚP CHE SAU KHI GỬI (thầy 09/11): kín màn, không đề, không nút mở — chỉ câu mới (số lượt đổi) mới mở. Mở đáp án ⇒ kết quả xanh / đỏ ngay trên lớp che.
      const kq = !daMo || kb || l.tuLuan ? undefined : k?.dung ? 'dung' : 'sai'
      const tieuDe = daMo
        ? kb ? 'Cảm ơn em đã thành thật' : l.tuLuan ? 'Thầy đang chữa trên bảng' : !daGui && cheSo !== khoaLuot ? 'Em chưa gửi câu này' : !daGui ? 'Đáp án em gửi chưa được tính' : k?.dung ? (l.phan === 'II' ? 'Đúng cả 4 ý!' : 'Chính xác!') : 'Chưa đúng'
        : !daGui ? 'Đang gửi…' : kb ? 'Em đã báo: chưa biết làm' : l.tuLuan ? 'Đã báo thầy em làm xong' : 'Đã gửi'
      const dongPhu = daMo
        ? kb ? (l.tuLuan ? '' : `${dauKj(k?.kj ?? KJ.thanhThat)} kJ thành thật · đáp án đúng: ${chuDung}`)
          : l.tuLuan || !k ? '' : `${l.phan === 'II' ? `Em đúng ${k.soY ?? 0}/4 ý · ` : ''}${dauKj(k.kj)} kJ${k.nhanh ? ` · nhanh thứ ${k.nhanh} cả lớp` : ''} · hạng ${e.hang}/${e.soEm}`
        : daGui ? `${kb || l.tuLuan ? '' : `Đã gửi sau ${Math.round(l.emTra!.t / 1000)} giây · `}${l.daGui}/${l.coMat} bạn đã ${l.tuLuan ? 'xong' : 'gửi'}` : 'Đáp án đã nằm trên máy em, phòng nhận là xong.'
      lopChe = (
        <div className={`bpu-che${dangBay ? ' bay' : ''}`} data-kq={kq} role="status" aria-live="polite" aria-label="Màn đã che sau khi gửi">
          {dangBay ? <TiaBay /> : null}
          <div className="bpu-che-noi">
            <div className={`bpu-che-doi${ketQuaBang ? ' co-kq' : ''}`}><NgonLua doi={doi} /><div className="ten"><b>{tenDoi}</b><span><SoKj v={kjDoiSo} /> kJ đội</span></div>{ketQuaBang}</div>
            {neoBd}
            {kq ? <div className="bpu-che-dau" aria-hidden="true">{kq === 'dung' ? '✓' : '✗'}</div> : <NgonLua doi={doi} ky={DOI_BPU[doi]?.ky} to />}
            <h3>{tieuDe}</h3>
            {dongPhu ? <p className="phu">{dongPhu}</p> : null}
            {daMo && !kb && !l.tuLuan && l.dung ? <KetQuaChon phan={l.phan} chon={l.emTra?.chon ?? ''} dung={l.dung} emDung={!!k?.dung} /> : null}
            <p className="bpu-che-bang">Nhìn lên bảng để chữa bài</p>
            {baoTra ? <div className="bpu-bao" role="status">{baoTra}</div> : null}
            {!daGui ? baoMang : null}
          </div>
        </div>
      )
    }
    // Đang bay: đề còn nằm dưới lớp che vừa hiện (phương án em chọn bừng sáng màu đội); bay xong ⇒ gỡ đề khỏi màn (em không mở lại được).
    if (!che || dangBay) {
      than = (
        <>
          <span className="m3-chip bpu-chip">{l.tuLuan ? 'Tự luận · làm ra giấy' : l.phan === 'I' ? 'Trắc nghiệm' : l.phan === 'II' ? 'Đúng–sai' : 'Trả lời ngắn'}</span>
          {deChang(q, l.so, LC ? LC.mucGiamThi(q) : null, che, !daMo || l.tuLuan ? null : !daGui || kb ? 'trung' : k?.dung ? 'dung' : 'sai')}
          <div className="duo-tra bpu-tra">{l.tuLuan ? <div className="bpu-the">Câu này thầy chữa trên bảng, máy không chấm. Em làm ra giấy, xong thì bấm nút bên dưới.</div>
            : !LC ? <p className="nho">Đang tải phương án…</p> : l.phan === 'I' ? <LC.ChonTracNghiem q={q} value={chonHien} onChon={(x) => setChon(x)} khoa={che || daMo || hetGio} />
            : l.phan === 'II' ? <LC.ChonDungSai q={q} value={chonHien.padEnd(4, ' ')} onChon={(i, x) => setChon((c) => { const a = c.padEnd(4, ' ').split(''); a[i] = x; return a.join('') })} khoa={che || daMo || hetGio} />
            : <div className="bpu-tln"><LC.OTraLoiNgan value={chonHien} soO={q.soO} />{!che && !daMo && !hetGio ? <div className="bpu-phim">{PHIM_SO.map((p) => <button type="button" key={p} onClick={() => phimSo(p)} aria-label={p === '−' ? 'Đổi dấu' : p}>{p}</button>)}<button type="button" className="xoa" onClick={() => setChon((c) => c.slice(0, -1))}>Xoá</button></div> : null}</div>}</div>
          {LC && q.hinhAnh?.some((h) => h.viTri === 'cuoi_cau') ? boChang(<LC.HinhCuoiCau q={q} stt={l.so} />) : null}{/* ảnh cuối câu: trước 10/11 không hiện ở Bình Phản Ứng */}
          {daMo && !che && !l.tuLuan && l.dung && LC ? (
            <div className="bpu-loi-giai"><Suspense fallback={<div aria-busy="true" style={{ minHeight: 120 }} />}>
              <LoiGiaiKinhHs qid={String(l.qid ?? q.qid)} phan={l.phan} choices={q.choices} ideas={q.ideas} dapAn={l.dung} duPhong={<LoiGiaiDuPhong LG={LC.LoiGiaiCau as unknown as LoiGiaiCauKieu} q={q} solution={l.giai?.solution ?? null} dapAn={l.dung} hinhLoiGiai={(l.giai?.anh ?? []) as Question['hinhAnh']} />} />
            </Suspense></div>
          ) : null}
          {!che && baoTra ? <div className="bpu-bao" role="status">{baoTra}</div> : null}
          {!che ? baoMang : null}
        </>
      )
    }
    // SỬA CÓ CHỦ ĐÍCH 10/11 (thầy «chuyển nút gửi đáp án sang mép phải giữa màn hình, chọn hết thì tự bật ra, chưa chọn hết thì ẩn»): bỏ thanh dưới
    // chứa nút gửi (và nút «Đã gửi» lúc bay) — nút nổi `NutGuiNoi` (lớp `.bpu-gui-noi`). Tự luận («Em làm xong») cũng dùng nút nổi, luôn bật (không có gì để chọn): một chỗ
    // gửi duy nhất cho mọi loại câu, em không phải tìm nút ở hai nơi. Thanh dưới chỉ còn khi hết giờ (dòng báo) / thầy mở đáp án mà em chưa gửi.
    if (che) { if (dangBay) nutGui = <NutGuiNoi key={khoaLuot} hien={false} tuLuan={!!l.tuLuan} onGui={guiTra} /> }
    else if (daMo) {
      // Em CHƯA gửi mà thầy mở đáp án: không che (em chưa có gì để giữ); đáp án đúng tô XANH ngay dưới đề + lời giải như cũ.
      if (l.tuLuan) day = <div className="bpu-ket"><h4>Thầy đang chữa trên bảng</h4><p>Em nhìn lên bảng và đối chiếu bài làm của mình.</p></div>
      else day = <div className="bpu-ket sai" role="status"><h4>Em chưa gửi kịp</h4>{l.dung ? <KetQuaChon phan={l.phan} chon="" dung={l.dung} emDung={false} /> : <p>Đáp án đúng: {chuDung}</p>}</div>
    } else if (hetGio) day = <div className="bpu-hai-nut"><p className="bpu-bao" role="status">Hết giờ — câu này để trống. Nhìn lên bảng nhé.</p></div>
    else nutGui = <NutGuiNoi key={khoaLuot} hien={duChon} tuLuan={!!l.tuLuan} onGui={guiTra} />
  } else than = <div className="bpu-hs-giua"><h3>Đang tải câu…</h3></div>

  // LIVE BẢNG (10/11). Thầy chốt tối 10/11: live = TIẾNG chạy suốt buổi, qua mọi lần chuyển câu; máy em vẫn là màn câu hỏi như thường (thêm dấu nhỏ
  // «Thầy đang live» + nút tiếng). Chỉ khi cờ phòng `live.bang` bật (thầy gọi em lên bảng / bật tay) mới sang BẢNG LIVE toàn màn xoay ngang; lượt mới ⇒ cờ tắt
  // ⇒ về màn câu hỏi dọc. Phòng chưa có cờ (bản trước đợt 1C) ⇒ suy ra đúng luật ấy từ lượt: đang có em được gọi. Em được gọi ⇒ mic tự bật.
  const lv = v?.live ?? null
  const liveBat = !!lv?.bat && !v?.ketThuc
  const coBang = (lv as { bang?: boolean } | null)?.bang ?? !!l?.goi
  const cheLive = !liveBat || vuaRoi ? 'an' : coBang ? 'bang' : 'dau'
  const khong = () => {}
  const deLive = cheLive === 'bang' && q && l && LC ? boChang(<>
    <LC.DeCau q={q} stt={l.so} />
    {l.tuLuan ? null : l.phan === 'I' ? <LC.ChonTracNghiem q={q} value="" onChon={khong} khoa /> : l.phan === 'II' ? <LC.ChonDungSai q={q} value="" onChon={khong} khoa /> : null}
  </>) : null
  const lopLive = lv && (lv.san || lv.bat) && veLive && !v?.ketThuc ? (
    <Suspense fallback={null}>
      <LopLive ve={veLive.ve} goc={veLive.goc} guiTho={(d) => { try { ws.current?.send(d as string) } catch { /* rớt */ } }} cau={cauLive} view={lv} che={cheLive} nang={!!day} de={deLive} khoaDe={q?.qid ?? ''}
        mic={liveBat && laEmGoi && (l?.pha === 'goi' || l?.pha === 'lam-bang')} doi={e ? { ten: tenDoi, ky: DOI_BPU[doi]?.ky ?? '', kj: kjDoiSo } : null} matMang={tt === 'mat-mang'} roi={!!e?.dangRoi || vuaRoi} />
    </Suspense>
  ) : null

  if (an) return null
  return createPortal(
    <div ref={gocRef} className={`bpu-hs m3${dangBay ? ' dang-bay' : ''}${nutGui ? ' co-gui' : ''}`} role="dialog" aria-modal="true" aria-label="Bình Phản Ứng" onClick={chamDau} style={{ ['--doi' as string]: `var(${DOI_BPU[doi]?.mau ?? '--tr-tin'})` }}>
      {tren(e ? nhanDoi : 'Cả lớp cùng làm câu thầy chiếu')}
      {coHan && l?.han ? <div className="bpu-hs-vach"><i style={{ width: `${Math.max(0, Math.min(1, (l.han - nay) / Math.max(1, l.han - l.batDau))) * 100}%` }} /></div> : null}
      {/* 10/11: thầy chấm em lên bảng ⇒ cả lớp thấy kết quả — có lớp che thì dải nằm trong lớp che (dưới thanh đội), không thì ngay dưới đầu màn. */}
      {lopChe || !ketQuaBang ? null : <div className="bpu-klb-hang">{ketQuaBang}</div>}
      {lopChe ? null : neoBd}
      {than ? <main className="bpu-hs-than">{than}</main> : null}
      {day ? <footer className="bpu-hs-day">{day}</footer> : null}
      {nutGui}
      {lopChe}
      {lopLive}
    </div>,
    document.body,
  )
}

/** NÚT GỬI NỔI (thầy 10/11 «chuyển nút gửi đáp án sang mép phải giữa màn hình, khi học sinh chọn hết thì tự bật ra, còn chưa chọn hết thì ẩn đi»):
 *  viên thuốc dọc màu đội dính mép phải, giữa chiều cao màn (`position: fixed`). Chọn đủ (trắc nghiệm: một phương án; đúng–sai: đủ 4 ý; trả lời ngắn: có số)
 *  ⇒ trượt từ mép vào + rõ dần + nảy nhẹ; bỏ chọn bớt ⇒ thu lại vào mép. Lần ĐẦU bật ra trong lượt ⇒ quầng sáng nhịp 2 lần (lớp `quang` giữ suốt lượt nên
 *  bật lại không nhấp nháy nữa; lượt mới ⇒ `key` mới ⇒ trạng thái mới). Lúc ẩn: vẫn nằm trong cây (để trượt ra / vào) nhưng `inert` + `aria-hidden` +
 *  `disabled` ⇒ không chạm, không Tab, máy đọc màn hình bỏ qua.
 *  KHÔNG CHE phương án / ý đúng–sai / bàn phím số: thân màn chừa lề phải đủ rộng cho nút (`.bpu-hs.co-gui .bpu-hs-than`, chừa suốt lúc có nút — kể cả lúc
 *  nút ẩn — để bật / ẩn không làm chữ chạy dòng dưới tay em). Nhờ lề ấy bàn phím số cũng nằm gọn bên trái nút ⇒ không cần đặt nút riêng trên bàn phím. */
function NutGuiNoi({ hien, tuLuan, onGui }: { hien: boolean; tuLuan: boolean; onGui: () => void }) {
  // Gắn vào màn ở trạng thái ẨN rồi mới bật (một nhịp sau) ⇒ câu tự luận / câu vừa tới đã đủ chọn vẫn thấy nút trượt vào, không hiện bụp.
  const [vao, setVao] = useState(false)
  useEffect(() => { setVao(true) }, [])
  const mo = hien && vao
  const [quang, setQuang] = useState(false)
  useEffect(() => { if (mo) setQuang(true) }, [mo])
  return (
    <button type="button" className={`bpu-gui-noi${quang ? ' quang' : ''}`} data-hien={mo} aria-label={tuLuan ? 'Em làm xong' : 'Gửi đáp án'}
      aria-hidden={mo ? undefined : true} inert={!mo} tabIndex={mo ? undefined : -1} disabled={!mo} onClick={onGui}>
      {tuLuan
        ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.6 4.6L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3L10.2 13.8M21 3l-6.6 18-4.2-7.2L3 9.6 21 3z" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      <span>{tuLuan ? 'Xong' : 'Gửi'}</span>
    </button>
  )
}

/** Lời giải thu gọn (dự phòng khi câu chưa có bản Kính) — khối `LoiGiaiCau` lấy qua mảnh chặng đã nạp (không tách mảnh mới ⇒ precache không phình). */
function LoiGiaiDuPhong({ LG, ...p }: { LG: LoiGiaiCauKieu; q: Question; solution: unknown; dapAn: string; hinhLoiGiai?: Question['hinhAnh'] }) { return <LG {...p} /> }
