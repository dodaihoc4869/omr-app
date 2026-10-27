// GIAO DIỆN «TRONG» · APP HỌC SINH — phần trình bày RIÊNG của bản vẽ thầy chốt 26/10 (ve-moi/hs-mot-trang*.html, hs-menu-phai.html; từ 26/10 tối: ve-moi/dm-*.html —
// hướng Duolingo + chất Hoá), NẠP LƯỜI qua nap-trong-hs.ts (chỉ khi `<html data-trong>`): Lộ trình · Luyện tập · Thành tích + menu dọc mép phải (Điểm danh đầu menu, A.I Đỗ Đại Học dưới 3 mục). Cùng số, cùng
// chữ nút, cùng lệnh với bản cũ — chỉ đổi trình bày. Kiểu ở styles/trong-hs.css (nạp cùng mảnh này ⇒ vẽ là đã có kiểu).
import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Award, Check, CheckCircle2, ChevronRight, ClipboardCheck, FlaskConical, Flame, GraduationCap, History, Layers, LineChart, Lock, PenLine, Play, QrCode, RefreshCw, Route, Sparkles, Target, Trophy, Wrench, type LucideIcon } from 'lucide-react'
import { soChangXong, type SoHomNay } from './lam-bai'
import { chiaChang, chuNutHoc, useNhipHocEm } from './nhip-hom-nay'
import { chuViecTiepHs, nhipTheoSanh } from '../../lib/nhip-hoc-em'
import type { TomTatKiemTra } from '../../lib/kiem-tra-ca-nhan'
import { ngayGon, useDiemDanhHs } from '../diem-danh/TheDiemDanhHs'
import type { BuoiCuaEm } from '../../lib/buoi-hoc-api'
import { Bi, type CamBi } from '../linh-vat/Bi'
import { banHat, yenLang } from '../../lib/hieu-ung'
import '../../styles/trong-hs.css'
// THƯỞNG PHẠT (gộp đợt 3, 26/10 — src/components/thuong/CAM-VAO.md): thanh trên ThanhThuong vẽ NGAY từ bản lưu máy (nhỏ, cùng mảnh «Trong»); mọi màn
// thưởng phạt + thẻ bên là MỘT mảnh nạp lười (ManThuong). Học sinh không thấy nhãn nhịp học / bậc.
import { ThanhThuong } from '../thuong/ThanhThuong'
import { TheBanLoTrinh } from '../thuong/TheBanLoTrinh' // lối vào Học cùng bạn trên Lộ trình (27/10)
import { useTongQuan } from '../thuong/dung-thuong'
import { napSanThanhTich } from '../../lib/thuong-api'
import type { TenManThuong } from '../thuong/ManThuong'
const ManThuong = lazy(() => import('../thuong/ManThuong'))
const GiamThiTinh = lazy(() => import('../giam-thi/GiamThi').then((m) => ({ default: m.GiamThiTinh })))
const MUC_LV = ['nb', 'th', 'vd', 'vdc'] as const
const TheBenThuong = lazy(() => import('../thuong/ManThuong').then((m) => ({ default: m.TheBenThuong })))
/** Sự kiện màn làm chặng phát khi xong bài ĐẦU TIÊN trong ngày ⇒ Lộ trình mở «Chuỗi ngày» với hiệu ứng lửa bùng (C1). */
export const SU_KIEN_MO_CHUOI = 'ddh-thuong-mo-chuoi'
/** Cột bên (thẻ Giải tuần + Nhiệm vụ) chỉ hiện ở máy tính / điện thoại ngang (cùng điều kiện CSS `.dm-ben`) ⇒ điện thoại dọc không nạp mảnh màn thưởng. */
const MQ_BEN = '(min-width: 1000px), (max-height: 520px) and (min-width: 600px)'
function useCoBen(): boolean {
  const [co, setCo] = useState(() => typeof window !== 'undefined' && !!window.matchMedia?.(MQ_BEN).matches)
  useEffect(() => {
    const m = window.matchMedia?.(MQ_BEN)
    if (!m) return
    const doi = () => setCo(m.matches)
    m.addEventListener?.('change', doi)
    return () => m.removeEventListener?.('change', doi)
  }, [])
  return co
}

export interface PropsMotTrang {
  so: SoHomNay | null; dangTai: boolean; tenBai?: string; viec?: string
  onHoc: () => void; khoaHoc: boolean; hetCau: boolean; kho?: { choBoSung?: number; sanSang?: number }
  coCa: boolean; onThi: () => void; token?: string
  soSua: number | null; onChua: () => void; hinhSua?: ReactNode
  kiem?: TomTatKiemTra; ngayKiem: boolean; onKiemTra?: () => void
  soBaiTap?: number; coBaiTap?: boolean; onBaiTap: () => void
  /** Dòng nhắc sẵn có của Hôm nay (thiếu câu phù hợp, câu đang giữ cho ca). */
  ghi: string[]
  /** Mục menu đang mở: 'hom-nay' = Lộ trình · 'on-lai' = Luyện tập · 'ket-qua' = Thành tích (cùng id mục cũ của cổng). */
  muc?: string
  hs?: HsTrong
}
// Chữ ngày giờ Kiểm tra ôn tập — cùng luật với kiem-tra-chu.ts (giờ Việt Nam, hạn đúng 00:00 hôm sau ⇒ "24:00"); viết gọn tại đây để mảnh «Trong» không kéo
// kiem-tra-chu thành một tệp precache riêng (trần 170 tệp — scripts/kiem-sw.mjs).
const VN = 7 * 3600_000, hai = (n: number) => String(n).padStart(2, '0')
const ngayVn = (ms: number) => new Date(ms + VN).toISOString().slice(0, 10)
const gioVn = (ms: number) => { const t = new Date(ms + VN); return `${hai(t.getUTCHours())}:${hai(t.getUTCMinutes())}` }
const gioHan = (han: number, ngay: string) => (gioVn(han) === '00:00' && ngayVn(han - 1) === ngay ? '24:00' : gioVn(han))
const diemChu = (d: number) => String(Math.round(d * 100) / 100).replace('.', ',')
const THU = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const ngayKiemChu = (ngay: string, now: number) => {
  const [y, m, d] = ngay.split('-').map(Number)
  if (!y || !m || !d) return ngay
  const con = Math.round((Date.UTC(y, m - 1, d) - Date.parse(`${ngayVn(now)}T00:00:00Z`)) / 86_400_000)
  return `${THU[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]} ${hai(d)}/${hai(m)}${con > 0 ? ` · còn ${con} ngày` : ''}`
}

/** Chữ phụ của dòng Kiểm tra ôn tập — chỉ số có trong TomTatKiemTra (như thẻ TheKiemTraCaNhan). */
function chuKiem(k: TomTatKiemTra): string {
  if (k.trangThai === 'cho_nguon') return 'Đang chuẩn bị'
  if (k.nopLuc !== null || k.trangThai === 'het_han') return `${k.trangThai === 'het_han' ? 'Đã hết hạn' : 'Đã nộp'} · ${k.diem !== null ? `điểm ${diemChu(k.diem)}/10` : 'đang chấm'}`
  if (!k.homNay) return ngayKiemChu(k.ngay, k.serverNow)
  return `${k.tong} câu · khoảng ${k.phut} phút · hạn nộp ${gioHan(k.hanLuc, k.ngay)}`
}

/** Phần của cổng HocTapHomNay mà Luyện tập / Thành tích cần (truyền nguyên props cổng — không thêm lệnh, không thêm số). */
export interface HsTrong { lop?: string; onXemLai: () => void; onTuLuyen: () => void; onLichSu: () => void; onKetQua?: () => void; onLuyenLai?: () => void }
/** Một nút trên con đường chặng (Lộ trình). `x` = độ lệch ngang (px) để đường uốn như bản vẽ. */
type Nut = { k: string; loai: 'hoc' | 'kiem' | 'sua' | 'bt'; tt: 'xong' | 'dang' | 'khoa' | 'mo'; nhan?: string; bong?: string; vong?: number; ten: string; onClick?: () => void; tat?: boolean }
const LECH = [0, -52, -80, -52, 0, 52, 80, 52]
const HINH_NUT: Record<Nut['loai'], LucideIcon> = { hoc: Play, kiem: FlaskConical, sua: Wrench, bt: PenLine }

/** F2/F3 — nhớ trên máy số chặng đã xong hôm nay (giờ VN): lần mở Lộ trình kế tiếp thấy THÊM đúng một chặng ⇒ chặng đó «vừa xong». Không bao giờ ghi lùi
 *  (bản Sảnh đệm cũ vẽ trước bản mới không làm chạy lại hiệu ứng). Trả chỉ số chặng vừa xong hoặc null. */
const KHOA_LO_TRINH = 'ddh.lo-trinh'
function changVuaXong(xong: number, tong: number): number | null {
  if (!tong) return null
  const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
  let cu: { ngay?: string; tong?: number; xong?: number } | null = null
  try { cu = JSON.parse(localStorage.getItem(KHOA_LO_TRINH) || 'null') } catch { /* bộ nhớ máy không đọc được: bỏ hiệu ứng */ }
  const cung = !!cu && cu.ngay === ngay && cu.tong === tong
  if (cung && typeof cu!.xong === 'number' && xong < cu!.xong) return null
  try { localStorage.setItem(KHOA_LO_TRINH, JSON.stringify({ ngay, tong, xong })) } catch { /* không lưu được: lần sau không có hiệu ứng */ }
  return cung && xong === (cu!.xong ?? -1) + 1 ? xong - 1 : null
}

/** CON ĐƯỜNG CHẶNG (bản vẽ dm-1/2/3, thầy chốt 26/10): nút lục giác nổi khối, nối bằng đường chấm mềm (vẽ theo vị trí thật của nút).
 *  Hiệu ứng (HIEU-UNG.md F): F1 nút hiện tại phồng thở + bong bóng nhún (CSS) · F2 chặng vừa xong: vòng lan + sao bay · F3 chặng mới mở: khoá tinh thể vỡ
 *  · F4 tự cuộn mượt tới nút hiện tại khi nút nằm ngoài khung nhìn. */
/** Rương tinh thể giữa đường (bản vẽ nâng cấp 27/10) — tranh trang trí; sáng màu khi xong hết chặng hôm nay, trước đó mờ. */
function Ruong() {
  return <svg className="da-ruong-hinh" viewBox="0 0 96 84" width="88" height="77" aria-hidden="true">
    <ellipse className="rg-bong" cx="48" cy="80" rx="40" ry="4" />
    <rect className="rg-day" x="8" y="34" width="80" height="44" rx="8" /><rect className="rg-than" x="8" y="34" width="80" height="38" rx="8" />
    <path className="rg-nap" d="M12 34a14 14 0 0 1 14-16h44a14 14 0 0 1 14 16z" /><path className="rg-day" d="M12 34h72v8H12z" />
    <rect className="rg-dai" x="20" y="18" width="10" height="56" rx="3" /><rect className="rg-dai" x="66" y="18" width="10" height="56" rx="3" />
    <path className="rg-ngoc" d="M48 30l12 10-12 18-12-18z" /><path className="rg-ngoc-sang" d="M48 30l12 10H36z" /><path className="rg-ngoc-dam" d="M48 58l-12-18h12z" />
  </svg>
}
/** Vòng tiến độ quanh nút HIỆN TẠI (thầy 27/10, ảnh Duolingo): bốn đoạn có khe, nền xám tối, phần đã làm tô màu chính từ đỉnh theo chiều kim đồng hồ,
 *  tô dần 0 → tỉ lệ thật lúc mở (stroke-dashoffset, 600 ms); vòng thở co 0,94 ↔ 1. Không có số ⇒ vòng xám nguyên. */
const CV = 2 * Math.PI * 54
function VongChang({ pt }: { pt?: number }) {
  const L = Math.max(0, Math.min(100, pt ?? 0)) / 100 * CV
  return <svg className="da-vong" viewBox="0 0 116 116" aria-hidden="true"><circle className="nen" cx="58" cy="58" r="54" />
    {L > 0 && <circle className="chay" cx="58" cy="58" r="54" strokeDasharray={`${L} ${CV}`} style={{ '--L': `${L}` } as CSSProperties} />}</svg>
}

function DuongChang({ ds, moDi, cam }: { ds: Nut[]; moDi: boolean; cam?: CamBi }) {
  const goc = useRef<HTMLDivElement>(null)
  const [duong, setDuong] = useState('')
  const [vua, setVua] = useState<number | null>(null)
  const soChang = ds.filter((n) => n.k.startsWith('c')).length, soXong = ds.filter((n) => n.k.startsWith('c') && n.tt === 'xong').length
  useEffect(() => {
    const v = changVuaXong(soXong, soChang)
    if (v === null || yenLang()) return
    // Chờ màn vào xong (~450 ms) rồi mới chạy để em kịp thấy; không chặn bấm (lớp phủ pointer-events: none).
    const mo = window.setTimeout(() => setVua(v), 450)
    const t = window.setTimeout(() => banHat(goc.current?.querySelectorAll('.da-nut')[v], { hinh: 'sao', so: 10, xa: 80, ms: 700, mau: ['--tr-sao', '--tr-dung', '--tr-tin'] }), 570)
    const het = window.setTimeout(() => setVua(null), 2100)
    return () => { window.clearTimeout(mo); window.clearTimeout(t); window.clearTimeout(het) }
  }, [soXong, soChang])
  const giua = soChang >= 2 ? ds.findIndex((n) => n.k === `c${Math.floor((soChang - 1) / 2)}`) : -1
  const daCuon = useRef(false)
  useEffect(() => {
    const nut = goc.current?.querySelector<HTMLElement>('.da-nut[data-tt="dang"]')
    if (!nut || daCuon.current) return
    daCuon.current = true
    const r = nut.getBoundingClientRect()
    if (r.top >= 0 && r.bottom <= window.innerHeight - 24) return
    nut.scrollIntoView?.({ block: 'center', behavior: yenLang() ? 'auto' : 'smooth' })
  }, [ds.length])
  useLayoutEffect(() => {
    const d = goc.current
    if (!d) return
    const ve = () => {
      const r = d.getBoundingClientRect()
      const p = [...d.querySelectorAll<HTMLElement>('.da-nut')].map((n) => { const q = n.getBoundingClientRect(); return [q.left + q.width / 2 - r.left, q.top + q.height / 2 - r.top] as const })
      setDuong(p.length < 2 ? '' : p.slice(1).reduce((s, b, i) => { const a = p[i]!, m = (a[1] + b[1]) / 2; return `${s} C${a[0]} ${m} ${b[0]} ${m} ${b[0]} ${b[1]}` }, `M${p[0]![0]} ${p[0]![1]}`))
    }
    ve()
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(ve) : null
    ro?.observe(d)
    return () => ro?.disconnect()
  }, [ds.length])
  return <div ref={goc} className="da-duong" data-mo-di={moDi || undefined}>
    {duong && <svg className="da-noi" aria-hidden="true"><path d={duong} /></svg>}
    <ol className="da-ds" aria-label="Lộ trình hôm nay">
    {ds.map((n, i) => {
      const sao = n.tt === 'dang' && n.loai === 'hoc'
      const Icon = n.tt === 'xong' ? Check : n.tt === 'khoa' ? Lock : HINH_NUT[n.loai]
      const x = LECH[i % LECH.length]!
      const than = <>
        {(n.vong !== undefined || n.tt === 'dang') && <VongChang pt={n.vong} />}
        {n.bong && <span className="da-bong" aria-hidden="true">{n.bong}</span>}
        {sao && <i className="da-sao-bong" aria-hidden="true" />}
        {/* ngôi sao đặc tự vẽ (không thêm biểu tượng thư viện vào mảnh dùng chung lúc mở app) */}
        {sao ? <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" aria-hidden="true"><path d="M12 2.8l2.8 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17l-5.7 3.1 1.2-6.3-4.6-4.4 6.3-.8z" /></svg>
          : <Icon size={30} strokeWidth={2.6} aria-hidden="true" />}
        {n.nhan && <span className="da-nhan" data-ben={x > 0 ? 'trai' : undefined} aria-hidden="true">{n.nhan}</span>}
      </>
      const hu = vua === null ? undefined : i === vua ? 'xong' : i === vua + 1 && n.tt === 'dang' ? 'mo' : undefined
      const o = <li key={n.k} className="da-o-nut" data-hu={hu} style={{ '--x': `${x}px` } as CSSProperties}>
        {n.onClick ? <button type="button" className="da-nut" data-loai={n.loai} data-tt={n.tt} onClick={n.onClick} disabled={n.tat} aria-label={n.ten}>{than}</button>
          : <span className="da-nut" data-loai={n.loai} data-tt={n.tt} role="img" aria-label={n.ten}>{than}</span>}
        {hu === 'xong' && <span className="da-lan" aria-hidden="true" />}
        {hu === 'mo' && <span className="da-vo-khoa" aria-hidden="true"><i /><i /><i /><i /><Lock size={22} strokeWidth={2.6} /></span>}
        {/* LINH VẬT MỜ CẠNH ĐƯỜNG (thầy 27/10, như cú Duo xám): cứ 3 nút một con, xen kẽ trái / phải, đứng phía đối diện chỗ đường lượn; chặng chưa tới ⇒
            xám mờ, đã tới ⇒ hiện màu + thở. Xen kẽ Bi rồi 4 giám thị (Tí · Cô Cốc · Chú Tam · Giáo sư Kíp — GiamThiTinh, mảnh giám thị nạp lười);
            Lộ trình chưa biết mức câu của cụm chặng ⇒ xoay vòng nb → th → vd → vdc. */}
        {i % 3 === 1 && cam && (() => {
          const thu = (i / 3) | 0, gt = thu === 0 ? null : MUC_LV[(thu - 1) % MUC_LV.length]!, toi = n.tt === 'khoa'
          return <span className="da-linh-vat" aria-hidden="true" data-lv={gt ?? 'bi'} data-toi={toi || undefined}
            style={{ '--lv': `${(x > 0 || (x === 0 && thu % 2 === 0) ? -1 : 1) * 104 - x}px` } as CSSProperties}>
            {gt ? <Suspense fallback={null}><GiamThiTinh muc={gt} xam={toi} mo={toi} className="da-lv-gt" /></Suspense> : <Bi cam={toi ? 'ngu' : cam} size={104} />}
          </span>
        })()}
      </li>
      // Rương tinh thể + Bi đứng cạnh đường (bản vẽ nâng cấp): sau chặng giữa (đủ ≥ 2 chặng); rương lệch phía đối diện Bi.
      return i === giua ? [o, <li key="ruong" className="da-ruong" aria-hidden="true" data-mo={soXong === soChang || undefined} style={{ '--x': `${LECH[(i + 1) % LECH.length]! <= 0 ? -56 : 56}px` } as CSSProperties}>
        <Ruong /></li>] : o
    })}
  </ol></div>
}

/** G — Bi NÓI: bong bóng lời hiện chữ gõ dần (~28 ms/chữ); giảm chuyển động / máy yếu ⇒ hiện đủ ngay. Trình đọc màn hình đọc cả câu một lần. */
function LoiBi({ cam, loi, coBi = true }: { cam: CamBi; loi: string; coBi?: boolean }) {
  const [n, setN] = useState(loi.length)
  useEffect(() => {
    const yen = document.documentElement.classList.contains('may-yeu') || !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (yen) { setN(loi.length); return }
    setN(0)
    let t = 0, i = 0
    // 27/10 (soát ảnh: bong bóng trông «cụt câu» khi đang gõ): gõ xong câu trong ≤ 0,7 s (câu dài ⇒ mỗi chữ nhanh hơn, tối thiểu 8 ms).
    const nhip = Math.max(8, Math.min(28, Math.floor(700 / Math.max(1, loi.length))))
    const go = () => { i++; setN(i); if (i < loi.length) t = window.setTimeout(go, nhip) }
    t = window.setTimeout(go, nhip)
    return () => window.clearTimeout(t)
  }, [loi])
  return <div className="bi-loi" data-khong-bi={!coBi || undefined}>{coBi && <Bi cam={cam} size={84} noi={loi} />}<p className="bi-loi-bong"><span className="ht2-an">{loi}</span><span aria-hidden="true">{loi.slice(0, n)}<span className="bi-loi-con">{loi.slice(n)}</span></span></p></div>
}

const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const thuNgan = (ngay: string) => THU_NGAN[new Date(`${ngay}T00:00:00Z`).getUTCDay()] ?? ''
const lopSo = (lop?: string) => lop?.match(/^\d{1,2}/)?.[0]

function OTo({ ten, mo, sac, Icon, so, noi, onClick, tat }: { ten: string; mo: string; sac: string; Icon: LucideIcon; so?: ReactNode; noi?: boolean; onClick?: () => void; tat?: boolean }) {
  const than = <><span className="h" data-sac={sac}><Icon size={30} aria-hidden="true" /></span><span className="giua"><b>{ten}</b><span className="mo">{mo.replace(/ · /g, '\u00a0· ')/* SOÁT 26/10: «·» không mở đầu dòng */}</span></span>{so != null && <span className="so">{so}</span>}{onClick && <ChevronRight size={22} aria-hidden="true" className="da-mui" />}</>
  return onClick ? <button type="button" className="da-o" data-noi={noi || undefined} onClick={onClick} disabled={tat}>{than}</button> : <div className="da-o" data-noi={noi || undefined}>{than}</div>
}

/** HÔM NAY kiểu Duolingo + chất Hoá (bản vẽ ve-moi/dm-*.html, thầy chốt 26/10): ba mục của menu dọc — Lộ trình (con đường chặng: học → Kiểm tra ôn tập →
 *  Tự sửa lỗi → Bài tập về nhà, ĐÚNG thứ tự việc của «Một trang») · Luyện tập (mỗi việc một ô to có số) · Thành tích (chuỗi ngày, tuần này, việc tiếp, huy hiệu
 *  từ số sẵn có). Cùng số, cùng lệnh, cùng nút như bản trước; ô nào app chưa có số rẻ thì giữ nhãn, bỏ số. */
export function MotTrangHs(p: PropsMotTrang) {
  const so = p.so, kiem = p.kiem, hs = p.hs
  const nhipGoc = useNhipHocEm(p.ngayKiem ? undefined : p.token, null)
  const nhip = typeof nhipGoc === 'string' ? null : nhipTheoSanh(nhipGoc, so ? { muc: so.muc, daLam: so.daLam } : null)
  // Thưởng phạt: tổng quan /hs/thuong (bản lưu máy trước, máy chủ sau). Có chuỗi ngày theo bài (B3, cờ duolingo_bai) ⇒ MỌI chỗ hiện chuỗi dùng CÙNG số với
  // thanh trên; cờ tắt (chuoiNgay vắng) ⇒ chuỗi «đủ mức» cũ. Máy chủ chưa có lệnh (404) / lỗi mà chưa có bản lưu ⇒ thanh trên cũ.
  const tqTai = useTongQuan(p.token)
  const tq = tqTai.du
  const coThuong = !!p.token && (!!tq || tqTai.tai)
  const chuoi = tq?.chuoiNgay?.so ?? nhip?.chuoiDuGanNhat ?? 0
  const [tp, setTp] = useState<{ man: TenManThuong; hieuUng?: 'chuoi' } | null>(null)
  const coBen = useCoBen()
  useEffect(() => { setTp(null) }, [p.muc])
  useEffect(() => {
    const mo = () => setTp({ man: 'chuoi', hieuUng: 'chuoi' })
    window.addEventListener(SU_KIEN_MO_CHUOI, mo)
    return () => window.removeEventListener(SU_KIEN_MO_CHUOI, mo)
  }, [])
  // Thành tích mở ⇒ gọi sẵn giải + bạn + huy hiệu (song song) để bấm ô là có số.
  useEffect(() => { if (p.muc === 'ket-qua' && p.token) napSanThanhTich(p.token) }, [p.muc, p.token])
  const moTp = (man: TenManThuong) => setTp({ man })
  const con = so ? Math.max(0, so.muc - so.daLam) : null
  const du = con === 0
  const nutHoc = chuNutHoc(so, p.hetCau, p.kho)
  const kiemXong = !!kiem && (kiem.nopLuc !== null || kiem.trangThai === 'het_han')
  const kiemLam = !!kiem && kiem.homNay && !kiemXong && kiem.trangThai === 'can_lam'
  const coSua = !!p.soSua && p.soSua > 0
  const coBt = !!p.soBaiTap || !!p.coBaiTap
  // Thứ tự việc (thầy 26/10, như «Một trang»): ca đang mở → ngày chỉ có kiểm tra → học → đủ mức ⇒ Kiểm tra ôn tập (nếu phải làm) → Tự sửa lỗi → Bài tập về nhà.
  const chinh = p.coCa ? 'ca' : p.ngayKiem ? 'kiem' : du && kiemLam ? 'kiem' : du && coSua ? 'sua' : du && p.soBaiTap ? 'bt' : 'hoc'
  const pct = so && so.muc > 0 ? Math.min(100, Math.round((100 * so.daLam) / so.muc)) : 0
  const chang = so && !p.ngayKiem ? chiaChang(so) : []
  const xongChang = so ? soChangXong(so) : 0

  // Thanh trên: ĐÚNG 3 bộ đếm thưởng phạt (chuỗi · nguyên tử hôm nay · tinh thể) + vòng Mục tiêu ngày (bản vẽ tp-4); thông báo thưởng chưa xem chỉ bật ở Lộ trình.
  const tren = <header className="da-tren" aria-label="Số của em">
    {coThuong ? <ThanhThuong token={p.token} onMo={moTp} onHoc={p.onHoc} thongBao={!tp && (p.muc ?? 'hom-nay') === 'hom-nay'} /> : <>
    {lopSo(hs?.lop) && <span data-sac="tin" aria-label={`Khối ${lopSo(hs?.lop)}`}><GraduationCap size={22} aria-hidden="true" />{lopSo(hs?.lop)}</span>}
    <span data-sac="sao" aria-label={`Chuỗi ${chuoi} ngày đủ mức`}><Flame size={22} aria-hidden="true" />{chuoi}</span>
    {so && <span data-sac="dung" aria-label={`${so.daLam}/${so.muc} câu hôm nay`}>{du ? <CheckCircle2 size={22} aria-hidden="true" /> : <Target size={22} aria-hidden="true" />}{so.daLam}/{so.muc}</span>}
    </>}
  </header>
  // Một màn thưởng phạt đang mở (bấm bộ đếm / thẻ bên / ô Thành tích): thay nội dung mục, thanh trên + menu giữ nguyên; «Quay lại» về mục cũ.
  if (tp && p.token) return <div className="dm-khung" data-muc="thuong">{tren}<main className="tp-cam">
    <Suspense fallback={<div className="tp-cam-cho" role="status" aria-busy="true" aria-label="Đang mở" />}>
      <ManThuong man={tp.man} token={p.token} hieuUng={tp.hieuUng} onVe={() => setTp(null)} onHoc={() => { setTp(null); p.onHoc() }} anPhuKien
        onMo={(m) => { if (m !== 'phu-kien' && m !== 'cuu') moTp(m) }} />
    </Suspense>
  </main></div>
  const dongHomNay = so && <div className="dm-the"><h3>Hôm nay</h3>
    <div className="dm-dong"><span className="h" data-sac="sao"><Flame size={22} aria-hidden="true" /></span><div className="giua"><b>Chuỗi {chuoi} ngày</b><span className="mo">{du ? 'hôm nay đã đủ mức' : `làm ${con} câu nữa để đủ mức`}</span></div></div>
    <div className="dm-thanh" role="progressbar" aria-label="Câu hôm nay" aria-valuemin={0} aria-valuemax={so.muc} aria-valuenow={Math.min(so.daLam, so.muc)}><i style={{ width: `${pct}%` }} /></div>
    <span className="mo">{so.daLam}/{so.muc} câu hôm nay{du ? ' · đủ mức' : ''}</span></div>
  // Thầy 26/10: hệ lười (nhóm, bậc chăm, Học thật / Đối phó, mức làm) CHỈ thầy và phụ huynh xem ⇒ em chỉ thấy chuỗi ngày + việc tiếp trung tính.
  const theViec = nhip && <div className="dm-the da-viec"><h3>Chuỗi {chuoi} ngày</h3><span className="mo">Việc tiếp: {chuViecTiepHs(nhip)}</span></div>

  // ───── LUYỆN TẬP (mục «Ôn & sửa» cũ): mỗi việc một ô to; ô đỏ (Tự sửa lỗi còn câu) là việc nên làm trước.
  if (p.muc === 'on-lai' && hs) return <div className="dm-khung" data-muc="luyen">{tren}<main className="da-vo">
    <h1 className="da-tieu">Luyện tập</h1>
    <OTo ten="Tự sửa lỗi" mo={p.soSua === 0 ? 'Không còn câu cần sửa' : 'Câu em làm sai'} sac="sai" Icon={Wrench} so={coSua ? p.soSua! : undefined} noi={coSua} onClick={p.onChua} />
    {kiem && <OTo ten="Kiểm tra ôn tập" mo={chuKiem(kiem)} sac="tin" Icon={Target} so={`${kiem.daTra}/${kiem.tong}`} onClick={(kiemLam || kiemXong) && p.onKiemTra ? p.onKiemTra : undefined} tat={p.coCa} />}
    <OTo ten="Câu đã làm" mo="Lời giải và lịch ôn từng câu" sac="dung" Icon={History} onClick={hs.onXemLai} />
    {coBt && <OTo ten="Bài tập về nhà" mo={p.soBaiTap ? 'Thầy đang giao' : 'Xem lại bài đã nộp'} sac="chu-y" Icon={PenLine} so={p.soBaiTap || undefined} onClick={p.onBaiTap} />}
    <OTo ten="Tu luyện" mo="Luyện thêm theo chương, dạng, mức" sac="sao" Icon={Layers} onClick={hs.onTuLuyen} />
    {hs.onLuyenLai && <OTo ten="Luyện lại từ bài kiểm tra" mo="Câu sai trong các bài kiểm tra" sac="sai" Icon={RefreshCw} onClick={hs.onLuyenLai} />}
  </main></div>

  // ───── THÀNH TÍCH (mục «Kết quả» cũ + Nhịp học): chuỗi ngày, 7 ngày gần nhất, việc tiếp, huy hiệu từ số sẵn có; lối vào điểm thầy đã công bố giữ nguyên.
  if (p.muc === 'ket-qua' && hs) {
    const tuan = nhip ? nhip.ngay.slice(-7) : []
    const huy: { ten: string; sac: string; Icon: LucideIcon; co: boolean }[] = [
      { ten: du ? 'Đủ mức hôm nay' : 'Chưa đủ mức hôm nay', sac: 'dung', Icon: CheckCircle2, co: du },
      { ten: kiem?.diem != null ? `Kiểm tra ${diemChu(kiem.diem)}` : 'Kiểm tra ôn tập', sac: 'tin', Icon: Target, co: kiem?.diem != null },
      { ten: '7 ngày liền', sac: 'sao', Icon: Flame, co: chuoi >= 7 },
      { ten: '30 ngày liền', sac: 'chu-y', Icon: Trophy, co: chuoi >= 30 },
    ]
    return <div className="dm-khung" data-muc="thanh-tich">{tren}<main className="da-vo">
      <h1 className="da-tieu">Thành tích</h1>
      <div className="da-cot">{/* ngang / máy tính: hai cột (chuỗi · tuần · việc tiếp | huy hiệu · điểm); dọc: display: contents */}
      <div className="da-lua"><Bi cam={chuoi > 0 ? 'lua' : so && so.daLam === 0 ? 'ngu' : 'chao'} size={72} /><div><b>{chuoi} ngày</b><span>{tq?.chuoiNgay ? 'Chuỗi ngày' : 'Chuỗi ngày đủ mức'}{so && !du ? ` · làm ${con} câu nữa để đủ mức hôm nay` : du ? ' · hôm nay đã đủ' : ''}</span></div></div>
      {/* có chuỗi ngày theo bài (thưởng phạt) ⇒ lịch / việc tiếp theo chuỗi «đủ mức» cũ ẩn (hai cách đếm khác nhau không đứng cạnh nhau); lịch ở ô «Chuỗi ngày» */}
      {!tq?.chuoiNgay && tuan.length > 0 && <ol className="da-tuan" aria-label="7 ngày gần nhất">{tuan.map((x) => { const nay = x.ngay === nhip!.homNay, d = x.muc > 0 && x.lam >= x.muc
        return <li key={x.ngay} aria-label={`${nay ? 'Hôm nay' : thuNgan(x.ngay)}: ${d ? 'đủ mức' : `${x.lam}/${x.muc} câu`}`}><i data-d={d || undefined} data-nay={nay || undefined}>{d && <Check size={18} strokeWidth={3} aria-hidden="true" />}</i>{nay ? 'Nay' : thuNgan(x.ngay)}</li> })}</ol>}
      {!tq?.chuoiNgay && theViec}
      </div>
      <div className="da-cot">
      {coThuong ? <>
        <OTo ten="Huy hiệu" mo="Huy hiệu đã có và sắp đạt" sac="sao" Icon={Trophy} onClick={() => moTp('huy-hieu')} />
        {tq?.chuoiNgay && <OTo ten="Chuỗi ngày" mo="Lịch chuỗi, bình giữ chuỗi, mốc" sac="chu-y" Icon={Flame} onClick={() => moTp('chuoi')} />}
        {tq?.bat.giai !== false && <OTo ten="Giải tuần" mo="Bảng nhóm tuần này" sac="tin" Icon={Route} onClick={() => moTp('giai')} />}
        {tq?.bat.banBe !== false && <OTo ten="Học cùng bạn" mo="Chuỗi đôi với bạn học cùng" sac="dung" Icon={GraduationCap} onClick={() => moTp('ban')} />}
        {tq?.bat.kimCuong && <OTo ten="Thử thách Kim cương" mo="10 câu khó của chuyên đề em đã vững" sac="tin" Icon={Award} onClick={() => moTp('kim-cuong')} />}
        <OTo ten="Cửa hàng" mo="Tinh thể và bình giữ chuỗi" sac="sao" Icon={Sparkles} so={tq?.tinhThe} onClick={() => moTp('cua-hang')} />
      </> : <div className="da-huy">{huy.map(({ ten, sac, Icon, co }) => <div key={ten}><i data-sac={co ? sac : undefined}>{co ? <Icon size={28} aria-hidden="true" /> : <Lock size={26} aria-hidden="true" />}</i>{ten}</div>)}</div>}
      <h2 className="da-tieu-nho">Điểm thầy đã công bố</h2>
      <OTo ten="Ca kiểm tra" mo="Điểm và lời giải ca đã công bố" sac="tin" Icon={LineChart} onClick={hs.onLichSu} />
      {hs.onKetQua && <OTo ten="Kết quả bài đã nộp" mo="Điểm và báo cáo đã công bố" sac="chu-y" Icon={ClipboardCheck} onClick={hs.onKetQua} />}
      </div>
    </main></div>
  }

  // ───── LỘ TRÌNH: con đường chặng của hôm nay + nút việc sau (đúng thứ tự «Một trang»).
  const nut: Nut[] = []
  if (!p.ngayKiem) chang.forEach((c, i) => {
    const dang = c.tt === 'dang' && chinh === 'hoc' || c.tt === 'dang' && chinh === 'ca'
    nut.push(c.tt === 'xong' ? { k: `c${i}`, loai: 'hoc', tt: 'xong', ten: `Chặng ${i + 1}: đã xong` }
      : c.tt === 'dang' ? { k: `c${i}`, loai: 'hoc', tt: 'dang', ten: nutHoc, bong: dang && chinh === 'hoc' ? (c.phan > 0 ? 'Học tiếp' : 'Bắt đầu') : undefined, vong: c.phan, onClick: p.onHoc, tat: p.khoaHoc }
      : { k: `c${i}`, loai: 'hoc', tt: 'khoa', ten: `Chặng ${i + 1}: chưa mở` })
  })
  if (kiem) nut.push({ k: 'kiem', loai: 'kiem', tt: chinh === 'kiem' ? 'dang' : 'mo', nhan: 'Kiểm tra ôn tập', bong: chinh === 'kiem' && kiemLam ? (kiem.daTra > 0 ? 'Làm tiếp' : 'Bắt đầu') : undefined,
    ten: `Kiểm tra ôn tập: ${chuKiem(kiem)}`, onClick: (kiemLam || kiemXong) && p.onKiemTra ? p.onKiemTra : undefined, tat: p.coCa })
  if (coSua && !p.ngayKiem) nut.push({ k: 'sua', loai: 'sua', tt: chinh === 'sua' ? 'dang' : 'mo', nhan: `Tự sửa lỗi · ${p.soSua} câu`, bong: chinh === 'sua' ? 'Sửa lỗi' : undefined, ten: `Tự sửa lỗi: ${p.soSua} câu`, onClick: p.onChua })
  if (coBt && !p.ngayKiem) nut.push({ k: 'bt', loai: 'bt', tt: chinh === 'bt' ? 'dang' : 'mo', nhan: p.soBaiTap ? `Bài tập về nhà · ${p.soBaiTap} bài` : 'Bài tập về nhà', bong: chinh === 'bt' ? 'Làm bài' : undefined, ten: 'Bài tập về nhà', onClick: p.onBaiTap })
  const tiepTheo = [kiemLam && 'Kiểm tra ôn tập', coSua && 'Tự sửa lỗi', !!p.soBaiTap && 'Bài tập về nhà'].filter(Boolean) as string[]
  const hocThem = (chinh === 'sua' || chinh === 'bt' || (chinh === 'kiem' && !p.ngayKiem)) && !p.khoaHoc
  // Bi nói việc chính của hôm nay (cùng thứ tự `chinh`); xong hết ⇒ Bi mừng. Chưa có số (đang tải) ⇒ chưa hiện, không đoán.
  const loiBi: [CamBi, string] | null = chinh === 'ca' ? ['chao', 'Có ca kiểm tra đang mở. Em vào ca trước nhé.']
    : p.ngayKiem ? ['chao', 'Hôm nay là ngày Kiểm tra ôn tập. Em làm bài nhé.']
    : !so ? null
    : du ? (tiepTheo.length ? ['vui', `Đủ mức rồi! Giờ đến ${tiepTheo[0]} nhé.`] : ['mung', 'Xong hết việc hôm nay! Em giỏi lắm.'])
    : so.daLam === 0 ? ['chao', 'Chào em! Hôm nay bắt đầu từ chặng Học nhé.'] : ['chao', `Học tiếp nhé! Còn ${con} câu nữa là đủ mức hôm nay.`]

  // Bi đứng cạnh đường (bản vẽ nâng cấp 27/10) khi đường có ≥ 2 chặng ⇒ lời Bi phía trên chỉ còn bong bóng (không hai Bi).
  const coBiBen = chang.length >= 2
  return <div className="dm-khung">{tren}
    <main className="da-vo" aria-busy={!so && p.dangTai}>
      {chinh === 'ca' && <section className="da-bang" data-sac="tin" aria-label="Ca kiểm tra đang mở"><span className="h"><ClipboardCheck size={26} aria-hidden="true" /></span><div className="giua"><b>Ca kiểm tra đang mở</b><span className="mo">Nhập mã ca và mật khẩu thầy cung cấp để vào phòng kiểm tra.</span></div><button type="button" className="nut-to" onClick={p.onThi}>Vào ca kiểm tra</button></section>}
      {du && chinh !== 'ca' && so && <section className="da-bang" data-sac="dung" aria-label="Đủ mức hôm nay"><span className="h"><Check size={26} strokeWidth={3} aria-hidden="true" /></span><div className="giua"><b>Đủ {so.daLam}/{so.muc} câu hôm nay!</b><span className="mo">{tiepTheo.length ? `Tiếp theo: ${tiepTheo.join(', rồi ')}` : 'Em có thể nghỉ, hoặc học thêm câu mới.'}</span></div></section>}
      {!p.ngayKiem && <section className="da-bai" aria-label="Bài học hôm nay"><div className="giua">{p.viec && <small>{p.viec}</small>}<b>{p.tenBai || 'Bài học hôm nay'}</b></div>
        {chang.length > 0 && <div className="da-bai-tien" role="progressbar" aria-label="Chặng hôm nay" aria-valuemin={0} aria-valuemax={chang.length} aria-valuenow={xongChang}><i><s style={{ width: `${Math.round((100 * xongChang) / chang.length)}%` }} /></i>{xongChang}/{chang.length} chặng</div>}
        {!so && p.dangTai && <span className="mot-xuong" aria-hidden="true" />}</section>}
      {loiBi && <LoiBi cam={loiBi[0]} loi={loiBi[1]} coBi={!coBiBen} />}
      {p.ghi.map((g) => <p key={g} className="da-ghi">{g}</p>)}
      {coThuong && <TheBanLoTrinh token={p.token} bat={tq?.bat.banBe} onMo={() => moTp('ban')} />}
      {nut.length > 0 && <DuongChang ds={nut} moDi={chinh === 'ca'} cam={coBiBen ? loiBi?.[0] ?? 'chao' : undefined} />}
      {hocThem && <button type="button" className="mot-lien-ket" onClick={p.onHoc}>Học thêm câu mới<ChevronRight size={18} aria-hidden="true" /></button>}
    </main>
    <aside className="dm-ben" aria-label="Tóm tắt">
      {dongHomNay}
      {/* thưởng phạt (tp-4): Giải tuần + Nhiệm vụ ngày thay thẻ «việc tiếp» cũ */}
      {coThuong && coBen && <Suspense fallback={null}><TheBenThuong token={p.token} onMo={moTp} /></Suspense>}
      <div className="dm-the"><h3>Luyện tập</h3>
        <button type="button" className="dm-dong" onClick={p.onChua}><span className="h" data-sac="sai"><Wrench size={20} aria-hidden="true" /></span><span className="giua"><b>Tự sửa lỗi</b></span>{coSua && <span className="so">{p.soSua}</span>}</button>
        {kiem && <button type="button" className="dm-dong" onClick={(kiemLam || kiemXong) && p.onKiemTra ? p.onKiemTra : undefined} disabled={p.coCa || !((kiemLam || kiemXong) && p.onKiemTra)}><span className="h" data-sac="tin"><Target size={20} aria-hidden="true" /></span><span className="giua"><b>Kiểm tra ôn tập</b></span><span className="so">{kiem.daTra}/{kiem.tong}</span></button>}
        {hs && <button type="button" className="dm-dong" onClick={hs.onXemLai}><span className="h" data-sac="dung"><History size={20} aria-hidden="true" /></span><span className="giua"><b>Câu đã làm</b></span></button>}
      </div>
      {!coThuong && theViec}
    </aside>
  </div>
}

const tenBuoi = (b: BuoiCuaEm) => { const n = ngayGon(b.ten); return `${n === b.ten ? b.ten : `Buổi ${n}`}${b.lop ? ` · ${b.lop}` : ''}` }

/** KHỐI ĐIỂM DANH đầu menu (bản vẽ hs-mot-trang-menu; MENU 6 MỤC thầy 27/10): CÙNG hook với thẻ nổi cũ (useDiemDanhHs — cùng lệnh gửi, cùng luồng QR `?diem-danh=`).
 *  CHỈ hiện khi có buổi học đang mở: em chưa điểm danh ⇒ thẻ nổi chàm (màu điểm danh đang có), 6 ô mã (một ô nhập thật phủ trên) + nút Điểm danh · đã điểm danh ⇒ một dòng
 *  xanh (+ giờ em vừa bấm trên máy này) · không có buổi ⇒ ẨN HẲN (trả null). App chưa có máy quét QR riêng ⇒ em quét QR bằng máy ảnh điện thoại như cũ. */
type DiemDanh = ReturnType<typeof useDiemDanhHs>
const coKhoiDiemDanh = (tt: DiemDanh['tt']) => tt.loai === 'cho' || tt.loai === 'xong' || !!tt.daXong
function KhoiDiemDanh({ tt, ma, setMa, loi, setLoi, dangGui, gui, oNhap }: Pick<DiemDanh, 'tt' | 'ma' | 'setMa' | 'loi' | 'setLoi' | 'dangGui' | 'gui' | 'oNhap'>) {
  if (tt.loai === 'cho') return (
    <form className="tr-dd" aria-label="Điểm danh buổi học" onSubmit={(e) => { e.preventDefault(); void gui(ma) }}>
      <div className="tr-dd-dau"><span className="tr-dd-h" aria-hidden="true"><QrCode size={20} /></span><b>Điểm danh buổi học</b></div>
      <label className="tr-dd-o">
        <span className="sr-only">Mã 6 số trên máy chiếu</span>
        <input ref={oNhap} value={ma} onChange={(e) => { setMa(e.target.value.replace(/\D/g, '').slice(0, 6)); setLoi('') }}
          inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]*" maxLength={6} aria-invalid={!!loi} aria-describedby={loi ? 'tr-dd-loi' : undefined} />
        {Array.from({ length: 6 }, (_, i) => <span key={i} aria-hidden="true" data-dang={i === Math.min(ma.length, 5) || undefined}>{ma[i] ?? ''}</span>)}
      </label>
      <button type="submit" className="tr-dd-nut" disabled={dangGui || ma.length !== 6}>{dangGui ? 'Đang gửi…' : 'Điểm danh'}</button>
      {loi && <p id="tr-dd-loi" className="tr-dd-loi" role="alert">{loi}</p>}
      <p className="tr-dd-phu">{tt.buoi && <><b>{tenBuoi(tt.buoi).split(' · ')[0]}</b> · </>}Gõ mã 6 số trên máy chiếu, hoặc quét mã QR</p>
    </form>
  )
  const xong = tt.loai === 'xong' ? tt : tt.daXong ? { buoi: tt.daXong, luc: 0 } : null
  if (!xong) return null
  return (
    <section className="tr-dd" data-tt="xong" aria-label="Điểm danh buổi học">
      <div className="tr-dd-dau"><CheckCircle2 size={20} aria-hidden="true" /><b>Đã điểm danh</b>{xong.luc > 0 && <span>{hai(new Date(xong.luc).getHours())}:{hai(new Date(xong.luc).getMinutes())}</span>}</div>
      <p className="tr-dd-phu">{tenBuoi(xong.buoi)}</p>
    </section>
  )
}

/** MENU DỌC MÉP PHẢI — MENU 6 MỤC (thầy 27/10: «gọn lại còn tối đa 6 mục, đẹp tinh tế khoa học, học sinh dễ thấy dễ hiểu»; kiểu menu bên Duolingo web).
 *  Đầu menu: logo «Đỗ Đại Học» + CHUÔNG THÔNG BÁO (ĐÚNG phần tử ThongBaoHocSinh — giữ hành vi, số chưa đọc). Dưới: khối Điểm danh (chỉ khi có buổi mở),
 *  rồi đúng 6 mục, mỗi mục một ô biểu tượng màu riêng: Lộ trình · Luyện tập · Thành tích · Ca kiểm tra (= Vào ca kiểm tra; ẩn khi ca đang mở vì Lộ trình đã
 *  có nút vào ca) · Hỏi A.I Đỗ Đại Học (mở ĐÚNG tấm chat của BongBongAiDdh, sự kiện `ddh:mo-ai`; chỉ hiện khi kênh bật — `<html data-ai-ddh>`) · Cài đặt
 *  (trượt sang tấm con: Âm thanh, Rung, Cập nhật bài học, Của em — cùng nút, cùng hành vi cũ).
 *  Thu gọn = MỘT vạch nhỏ giữa mép phải (chấm đỏ khi có tin chưa đọc — CSS :has đọc số của chuông thật); buổi đang mở mà em chưa điểm danh ⇒ vạch thò thẻ
 *  dọc «Điểm danh» (bấm ⇒ menu mở, tiêu điểm vào ô mã); mã QR gửi xong / gửi hỏng ⇒ menu tự mở. Chạm ngoài / chọn mục / Esc / cuộn trang ⇒ thu lại
 *  (Esc ở tấm Cài đặt ⇒ về 6 mục trước). Mở ⇒ tiêu điểm vào mục đầu; đóng ⇒ trả tiêu điểm về vạch. Menu luôn gắn trong DOM (ẩn bằng CSS) để tấm thông
 *  báo mở từ đây không mất. */
// Biểu tượng chỉ màn «Trong» dùng — vẽ nội tuyến (nét như lucide) để không kéo thêm vào mảnh biểu tượng chung của app thầy / màn thi (luật tốc độ).
const IconNet = ({ d, size = 20 }: { d: string[]; size?: number }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d.map((x) => <path key={x} d={x} />)}</svg>
const Volume2 = ({ size }: { size?: number }) => <IconNet size={size} d={['M11 5 6 9H2v6h4l5 4z', 'M15.5 8.5a5 5 0 0 1 0 7', 'M19 5a10 10 0 0 1 0 14']} />
const Vibrate = ({ size }: { size?: number }) => <IconNet size={size} d={['m2 8 2 2-2 2 2 2-2 2', 'm22 8-2 2 2 2-2 2 2 2', 'M9 5h6a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z']} />
const MenuIcon = ({ size }: { size?: number }) => <IconNet size={size} d={['M4 6h16', 'M4 12h16', 'M4 18h16']} />
const BanhRang = ({ size }: { size?: number }) => <IconNet size={size} d={['M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0']} />
const MuiTrai = ({ size }: { size?: number }) => <IconNet size={size} d={['m15 18-6-6 6-6']} />
/** Chạm mục menu ⇒ phanHoi('chon') (rung + tiếng, tự theo công tắc). Nạp LƯỜI: không kéo am-thanh / rung vào nhóm mở app (luật tốc độ). */
const cham = () => { void import('../../lib/phan-hoi').then((m) => m.phanHoi('chon'), () => {}) }

/** Công tắc phản hồi ở menu (thầy 26/10): «Âm thanh» / «Rung» Bật–Tắt — chỉ đọc/ghi localStorage ('ddh.am' / 'ddh.rung' = 'tat' khi tắt); tiếng và rung
 *  ở mảnh màn luyện tự đọc khoá này (không kéo am-thanh / rung vào nhóm mở app). Mặc định bật. */
function CongTac({ khoa, ten, Icon, sac }: { khoa: 'ddh.am' | 'ddh.rung'; ten: string; Icon: (p: { size?: number }) => ReactNode; sac: string }) {
  const [bat, setBat] = useState(() => { try { return localStorage.getItem(khoa) !== 'tat' } catch { return true } })
  return <button type="button" role="switch" aria-checked={bat} className="tr-menu-muc tr-menu-cong" onClick={() => {
    const v = !bat
    setBat(v)
    try { if (v) localStorage.removeItem(khoa); else localStorage.setItem(khoa, 'tat') } catch { /* máy chặn lưu: chỉ đổi trong phiên này */ }
    // 27/10: bật «Rung» ⇒ rung thử ngay một nhịp để em (và thầy) biết máy rung được.
    if (v && khoa === 'ddh.rung') try { (navigator as Navigator & { vibrate?: (m: number) => boolean }).vibrate?.(80) } catch { /* máy không rung được */ }
    // bật «Âm thanh» ⇒ kêu thử tiếng chọn (rung không gọi: phanHoi nạp lười sẽ đè nhịp rung thử ở trên).
    if (v && khoa === 'ddh.am') cham()
  }}><span className="tr-menu-o" data-sac={sac} aria-hidden="true"><Icon size={20} /></span>{ten}<span className="tr-cong" data-bat={bat || undefined} aria-hidden="true">{bat ? 'Bật' : 'Tắt'}</span></button>
}
/** Ba mục menu kiểu Duolingo (bản vẽ dm-4, thầy chốt 26/10) — cùng id mục của cổng: Lộ trình = Hôm nay (+ Hành trình) · Luyện tập = Ôn & sửa · Thành tích = Kết quả.
 *  `sac` = màu ô biểu tượng (menu 6 mục 27/10): chính · chú ý · sao. */
const MENU_DUO = [{ id: 'hom-nay', ten: 'Lộ trình', icon: Route, sac: 'chinh' }, { id: 'on-lai', ten: 'Luyện tập', icon: Wrench, sac: 'chu-y' }, { id: 'ket-qua', ten: 'Thành tích', icon: Trophy, sac: 'sao' }] as const
export function MenuDocTrong(p: {
  muc: string; ds: readonly { id: string; ten: string; icon: LucideIcon }[]; onMuc: (id: string) => void
  coCa: boolean; onThi: () => void; thongBao?: ReactNode; dangTai: boolean; onTaiLai: () => void
  chuDau: string; moCuaEm: boolean; onCuaEm: () => void; nutCuaEm: RefObject<HTMLButtonElement | null>
  token?: string; moDiemDanh: boolean
}) {
  const [mo, setMo] = useState(false)
  const [cai, setCai] = useState(false) // tấm con «Cài đặt» đang mở (thay chỗ 6 mục)
  const caiRef = useRef(false)
  caiRef.current = cai
  const nut = useRef<HTMLButtonElement>(null)
  const the = useRef<HTMLElement>(null)
  const nutCai = useRef<HTMLButtonElement>(null)
  const nutLui = useRef<HTMLButtonElement>(null)
  const { tt, ma, setMa, loi, setLoi, dangGui, gui, oNhap, mo: ddMoLoi, tuQr } = useDiemDanhHs(p.token ?? '', p.moDiemDanh && !!p.token)
  const ddMo = tt.loai === 'cho'
  const coDd = !!p.token && coKhoiDiemDanh(tt)
  const dong = (traVe: boolean) => { setMo(false); if (traVe) nut.current?.focus() }
  useEffect(() => { if (ddMoLoi || (tuQr && tt.loai === 'xong')) setMo(true) }, [ddMoLoi, tuQr, tt.loai])
  // Menu thu lại ⇒ lần mở sau luôn về 6 mục. Đổi qua lại 6 mục ↔ Cài đặt ⇒ tiêu điểm theo (nút Quay lại / mục Cài đặt).
  useEffect(() => { if (!mo) setCai(false) }, [mo])
  // (chạy TRƯỚC hiệu ứng mở menu bên dưới ⇒ lúc mở, tiêu điểm cuối cùng vẫn là mục đầu / ô mã điểm danh)
  useEffect(() => { if (mo) (cai ? nutLui : nutCai).current?.focus() }, [cai, mo])
  useEffect(() => {
    if (!mo) return
    ;(oNhap.current ?? the.current?.querySelector<HTMLElement>('.tr-menu-muc'))?.focus()
    const phim = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (caiRef.current) { setCai(false); return }
      setMo(false); nut.current?.focus()
    }
    const cuon = () => setMo(false)
    window.addEventListener('keydown', phim)
    window.addEventListener('scroll', cuon, { passive: true })
    return () => { window.removeEventListener('keydown', phim); window.removeEventListener('scroll', cuon) }
  }, [mo, oNhap])
  const chon = (fn: () => void) => () => { cham(); fn() }
  return <>
    {/* Khung thấp xoay ngang: menu thu thành DẢI BIỂU TƯỢNG mép phải (3 mục + A.I + nút mở menu đủ); dọc / máy tính: display: contents ⇒ chỉ vạch cũ. */}
    <div className="tr-menu-ray">
      {MENU_DUO.map(({ id, ten, icon: Icon }) => <button key={id} type="button" className="tr-ray-muc" onClick={chon(() => p.onMuc(id))} aria-current={p.muc === id ? 'page' : undefined} aria-label={ten} title={ten}><Icon size={22} aria-hidden="true" /></button>)}
      <button type="button" className="tr-ray-muc tr-ray-ai" onClick={chon(() => window.dispatchEvent(new Event('ddh:mo-ai')))} aria-label="A.I Đỗ Đại Học" title="A.I Đỗ Đại Học"><Sparkles size={20} aria-hidden="true" /></button>
      <button ref={nut} type="button" className="tr-menu-cham" data-dd={ddMo || undefined} aria-label={ddMo ? 'Mở menu · Buổi học đang mở điểm danh' : 'Mở menu'} aria-expanded={mo} aria-controls="tr-menu" onClick={() => setMo(true)}>
        <i /><s />{ddMo && <em aria-hidden="true"><QrCode size={16} />Điểm danh</em>}<b className="tr-ray-them" aria-hidden="true"><MenuIcon size={22} /></b>
      </button>
    </div>
    {mo && <div className="tr-menu-phu" onClick={() => dong(true)} aria-hidden="true" />}
    <nav ref={the} id="tr-menu" className="tr-menu" data-mo={mo || undefined} data-dd={coDd ? '' : undefined} aria-label="Điều hướng học sinh">
      <div className="tr-menu-dau">
        <a className="tr-menu-ten" href="/hs"><img src={`${import.meta.env.BASE_URL}logo-hs-nho-v3.svg`} width={28} height={28} alt="" draggable={false} />Đỗ Đại Học</a>
        {/* Chuông = ĐÚNG phần tử ThongBaoHocSinh (số chưa đọc, tấm thông báo); bấm ⇒ menu thu, tấm thông báo vẫn hiện (CSS giữ tấm hiện). */}
        {p.thongBao && <div className="tr-menu-tb" onClickCapture={(e) => { if ((e.target as Element).closest?.('.m3-tb-chuong')) { cham(); dong(false) } }}>{p.thongBao}</div>}
      </div>
      {coDd && <KhoiDiemDanh tt={tt} ma={ma} setMa={setMa} loi={loi} setLoi={setLoi} dangGui={dangGui} gui={gui} oNhap={oNhap} />}
      <div className="tr-menu-ds" hidden={cai}>
        {MENU_DUO.map(({ id, ten, icon: Icon, sac }) => <button key={id} type="button" className="tr-menu-muc" onClick={chon(() => { p.onMuc(id); dong(true) })} aria-current={p.muc === id ? 'page' : undefined}><span className="tr-menu-o" data-sac={sac} aria-hidden="true"><Icon size={20} /></span>{ten}</button>)}
        {!p.coCa && <button type="button" className="tr-menu-muc" onClick={chon(() => { dong(true); p.onThi() })}><span className="tr-menu-o" data-sac="tin" aria-hidden="true"><ClipboardCheck size={20} /></span>Ca kiểm tra</button>}
        <button type="button" className="tr-menu-muc tr-menu-ai" onClick={chon(() => { dong(false); window.dispatchEvent(new Event('ddh:mo-ai')) })}><span className="tr-menu-o tr-o-ai" aria-hidden="true"><Sparkles size={20} /></span>Hỏi A.I Đỗ Đại Học</button>
        <button ref={nutCai} type="button" className="tr-menu-muc" onClick={chon(() => setCai(true))} aria-expanded={cai} aria-controls="tr-menu-cai"><span className="tr-menu-o" data-sac="xam" aria-hidden="true"><BanhRang size={20} /></span>Cài đặt<ChevronRight size={20} aria-hidden="true" className="tr-menu-mui" /></button>
      </div>
      <div id="tr-menu-cai" className="tr-menu-cai" role="group" aria-labelledby="tr-menu-cai-ten" hidden={!cai}>
        <div className="tr-menu-cai-dau"><button ref={nutLui} type="button" className="tr-menu-lui" onClick={chon(() => setCai(false))} aria-label="Quay lại menu"><MuiTrai size={22} /></button><b id="tr-menu-cai-ten">Cài đặt</b></div>
        <CongTac khoa="ddh.am" ten="Âm thanh" Icon={Volume2} sac="tin" />
        <CongTac khoa="ddh.rung" ten="Rung" Icon={Vibrate} sac="chu-y" />
        <hr className="tr-menu-vach" />
        <button type="button" className="tr-menu-muc" onClick={chon(() => { dong(true); p.onTaiLai() })} disabled={p.dangTai}><span className="tr-menu-o" data-sac="chinh" aria-hidden="true"><RefreshCw size={20} /></span>Cập nhật bài học</button>
        <button ref={p.nutCuaEm} type="button" className="tr-menu-muc" onClick={chon(() => { dong(false); p.onCuaEm() })} aria-haspopup="dialog" aria-expanded={p.moCuaEm}><span className="tr-menu-o tr-menu-anh" aria-hidden="true">{p.chuDau}</span>Của em</button>
      </div>
    </nav>
  </>
}
