// PHẦN DÙNG CHUNG các màn thưởng phạt (bản vẽ tp-* thầy chốt 26/10) — nằm trong mảnh NẠP LƯỜI ManThuong (không vào nhóm mở app).
//  - ManToan: màn phủ toàn khung (cuối tuần, thăng hoa, cứu chuỗi, bình đã đỡ, Kim cương, mời bạn…): nút Đóng, bộ đếm tinh thể, thân 2 cột (ngang / máy tính),
//    thanh nút đáy dính. Esc đóng; mở ra thì con trỏ về nút chính. Bấm nút giữa hiệu ứng ⇒ xongHieuUng() nhảy tới trạng thái cuối (không chặn bấm).
//  - Cho (khung xương, chữ chờ trễ 800 ms) · Loi (lý do thật + «Thử lại») · useToast (báo kết quả lệnh ghi) · TuanBay (lịch 7 ngày chuỗi) · DemTT.
//  - Hàm thuần ngày giờ giờ Việt Nam (24 giờ, «Thứ Bảy 31/10»), chữ cái ảnh đại diện, lịch hẹn hiệu ứng (giảm chuyển động ⇒ chạy ngay, hiệu ứng tự bỏ).
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { Check, FlaskConical, RefreshCw, X } from 'lucide-react'
import { coChuyenDong, xongHieuUng } from '../../lib/hieu-ung-thuong'
import { ngayVn, type NgayChuoi } from '../../lib/thuong-api'
import { IcTinhThe } from './hinh'
import { SoDem } from './SoDem'
import '../../styles/trong-thuong-gon.css'
import '../../styles/trong-thuong.css'

// ───────────────────────────── ngày giờ (giờ Việt Nam)
const pad = (n: number) => String(n).padStart(2, '0')
const THU_NGAN = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const THU_DAI = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
const vn = (ms: number) => new Date(ms + 7 * 3600e3)
/** yyyy-mm-dd ⇒ «30/10». */
export const ngayNgan = (iso: string): string => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? `${m[3]}/${m[2]}` : '' }
export const thuNgan = (iso: string): string => THU_NGAN[new Date(iso.slice(0, 10) + 'T00:00:00Z').getUTCDay()] ?? ''
/** «21:30» giờ Việt Nam. */
export const gioVn = (ms: number): string => { const d = vn(ms); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}` }
/** «Thứ Bảy 31/10». */
export const thuNgayVn = (ms: number): string => { const d = vn(ms); return `${THU_DAI[d.getUTCDay()]} ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}` }
/** «23:16:05» từ số mili giây còn lại. */
export const dongHo = (ms: number): string => { const g = Math.max(0, Math.floor(ms / 1000)); return `${pad(Math.floor(g / 3600))}:${pad(Math.floor(g / 60) % 60)}:${pad(g % 60)}` }
/** yyyy-mm-dd cộng n ngày. */
export const congNgay = (iso: string, n: number): string => new Date(Date.parse(iso.slice(0, 10) + 'T00:00:00Z') + n * 864e5).toISOString().slice(0, 10)
/** Số phút tới 00:00 giờ Việt Nam hôm sau. */
export const phutToiNuaDem = (ms: number = Date.now()): number => { const d = vn(ms); return (24 - d.getUTCHours()) * 60 - d.getUTCMinutes() }
export const chuGioPhut = (phut: number): string => { const g = Math.floor(phut / 60), p = phut % 60; return g > 0 ? `${g} giờ ${pad(p)} phút` : `${Math.max(1, p)} phút` }
/** «Lê Minh Khôi» ⇒ «MK» (hai chữ cuối) — một nguồn ở ban-gon.ts (thẻ Lộ trình dùng chung, không kéo mảnh này). */
export { chuCai } from './ban-gon'

// ───────────────────────────── lịch hẹn hiệu ứng (gỡ sạch khi rời màn)
export function henGio() {
  const ds: number[] = []
  return {
    sau: (ms: number, f: () => void) => { ds.push(window.setTimeout(f, coChuyenDong() ? ms : 0)) },
    huy: () => { ds.forEach((i) => clearTimeout(i)); ds.length = 0 },
  }
}
/** Chạy hiệu ứng một lần khi màn vừa hiện (sau khung vẽ đầu ⇒ đo được vị trí). */
export function useHieuUng(chay: (h: ReturnType<typeof henGio>) => void, dk: unknown[] = []) {
  useEffect(() => {
    const h = henGio()
    let song = true
    const chayMot = () => { if (song) chay(h) }
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(chayMot); else setTimeout(chayMot, 0)
    return () => { song = false; h.huy() }
  }, dk) // eslint-disable-line react-hooks/exhaustive-deps
}
/** Bộ đếm tinh thể đang hiện trên màn (thanh trên của Lộ trình hoặc góc màn phủ) — đích bay của tinh thể (D1). */
export const oTinhThe = (): Element | null =>
  [...document.querySelectorAll('.tp-dem-tt, .tp-tr-o[data-k="tt"]')].find((e) => e.getBoundingClientRect().width > 0) ?? null

// ───────────────────────────── khối dùng chung
export function DemTT({ gt, tu, id }: { gt: number; tu?: number; id?: string }) {
  return <span className="tp-dem-tt" id={id} role="img" aria-label={`Tinh thể: ${gt}`}><IcTinhThe /><SoDem gt={gt} tu={tu} /></span>
}

export interface PropsManToan { nhan: string; onDong?: () => void; demTT?: ReactNode; children: ReactNode; day?: ReactNode; kieu?: string; tren?: ReactNode }
export function ManToan({ nhan, onDong, demTT, children, day, kieu, tren }: PropsManToan) {
  const ref = useRef<HTMLDivElement>(null)
  const dong = useRef(onDong)
  dong.current = onDong
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape' && dong.current) { xongHieuUng(); dong.current() } }
    window.addEventListener('keydown', k)
    ref.current?.querySelector<HTMLElement>('.tp-day .tp-nut-lon:not(:disabled)')?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', k)
  }, [])
  return <div ref={ref} className="tp-goc tp-toan" role="dialog" aria-modal="true" aria-label={nhan} data-kieu={kieu}>
    <div className="tp-toan-tren">
      {onDong && <button type="button" className="tp-dong-x" aria-label="Đóng" onClick={() => { xongHieuUng(); onDong() }}><X size={26} aria-hidden="true" /></button>}
      {tren}
      {demTT}
    </div>
    {children}
    {day && <div className="tp-day"><div className="tp-day-giua">{day}</div></div>}
  </div>
}
/** Nút của thanh đáy: bấm giữa hiệu ứng ⇒ nhảy tới trạng thái cuối rồi làm việc. */
export function NutDay({ chu, onClick, sac, phu, tat }: { chu: string; onClick?: () => void; sac?: 'tt' | 'cam' | 'kc'; phu?: boolean; tat?: boolean }) {
  return <button type="button" className={phu ? 'tp-nut-chu' : 'tp-nut-lon'} data-sac={sac} disabled={tat || !onClick} onClick={() => { xongHieuUng(); onClick?.() }}>{chu}</button>
}

/** Khung xương (đặc tả mục 3): chữ «Đang tải…» hiện sau 800 ms. */
export function Cho({ so = 3 }: { so?: number }) {
  const [chu, setChu] = useState(false)
  useEffect(() => { const t = setTimeout(() => setChu(true), 800); return () => clearTimeout(t) }, [])
  return <div className="tp-cho" aria-busy="true" aria-label="Đang tải">{Array.from({ length: so }, (_, i) => <i key={i} />)}{chu && <p className="tp-mo" role="status">Đang tải…</p>}</div>
}
export function Loi({ chu, onThuLai }: { chu: string; onThuLai?: () => void }) {
  return <div className="tp-loi" role="alert"><span>{chu}</span>{onThuLai && <button type="button" className="tp-nut" onClick={onThuLai}><RefreshCw size={16} aria-hidden="true" />Thử lại</button>}</div>
}
/** Báo ngắn (kết quả mở rương, mua bình, gõ cửa…). Tự tắt sau 4 giây. */
export function useToast(): [ReactNode, (chu: string) => void] {
  const [chu, setChu] = useState('')
  useEffect(() => { if (!chu) return; const t = setTimeout(() => setChu(''), 4000); return () => clearTimeout(t) }, [chu])
  const bao = useCallback((c: string) => setChu(c), [])
  return [chu ? <div className="tp-toast" role="status"><span>{chu}</span><button type="button" className="tp-nut-chu" onClick={() => setChu('')}>Đóng</button></div> : null, bao]
}

/** Kiểu ngày máy chủ ⇒ kiểu vẽ: 'cuu' (đã cứu bằng bài bù — chuỗi giữ) vẽ như ngày được đỡ; 'cho' (hôm nay chưa xong) = chưa có gì. */
const kieuHien = (k: NgayChuoi['kieu']): 'hoc' | 'binh' | 'phep' | 'tat' | undefined => (k === 'cuu' ? 'binh' : k === 'cho' ? undefined : k)
const NHAN_NGAY = { hoc: 'đã học', binh: 'được đỡ, chuỗi vẫn giữ', phep: 'vắng có phép, chuỗi vẫn giữ', tat: 'chuỗi tắt' } as const

/** Lịch 30 ngày gần nhất (lich30, chỉ /hs/thuong gửi) — lưới 7 cột từ Thứ Hai, ô trống trước ngày đầu; hôm nay viền cam. Bản vẽ tp-5 «lịch tháng». */
export function ThangLich({ lich30, homNay = ngayVn() }: { lich30: NgayChuoi[]; homNay?: string }) {
  const theo = new Map(lich30.map((x) => [x.ngay.slice(0, 10), kieuHien(x.kieu)]))
  const dau = lich30[0]?.ngay.slice(0, 10) ?? homNay
  const lech = (new Date(dau + 'T00:00:00Z').getUTCDay() + 6) % 7 // số ô trống trước (Thứ Hai = 0)
  const ngay = lich30.map((x) => x.ngay.slice(0, 10))
  return <div className="tp-lich30" role="list" aria-label="30 ngày gần nhất">
    {['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((t) => <span key={t} className="t" aria-hidden="true">{t}</span>)}
    {Array.from({ length: lech }, (_, i) => <span key={`r${i}`} aria-hidden="true" />)}
    {ngay.map((d) => {
      const nay = d === homNay
      let k = theo.get(d)
      if (nay && k === 'tat') k = undefined
      return <span key={d} role="listitem" className="n" data-k={k} data-nay={nay || undefined}
        aria-label={`${nay ? 'Hôm nay' : `${thuNgan(d)} ${ngayNgan(d)}`}: ${k ? NHAN_NGAY[k] : nay ? 'chưa học' : 'chưa có'}`}>
        {(k === 'binh' || (nay && k === 'hoc')) && <i className="lan" aria-hidden="true" />}
        {k === 'phep' ? <b>P</b> : <span>{Number(d.slice(8, 10))}</span>}
      </span>
    })}
  </div>
}

/** Lịch 7 ngày chuỗi (lich7 của hợp đồng 4.3): học · bình đỡ · P vắng có phép · chuỗi tắt; hôm nay viền cam. */
export function TuanBay({ lich7, homNay = ngayVn(), idO }: { lich7: NgayChuoi[]; homNay?: string; idO?: (ngay: string) => string | undefined }) {
  // đủ 7 ô kết thúc ở hôm nay (ngày máy chủ chưa gửi ⇒ ô trống, không đoán)
  const theo = new Map(lich7.map((x) => [x.ngay.slice(0, 10), kieuHien(x.kieu)]))
  const cuoi = lich7.length && lich7[lich7.length - 1]!.ngay.slice(0, 10) > homNay ? lich7[lich7.length - 1]!.ngay.slice(0, 10) : homNay
  const ngay = Array.from({ length: 7 }, (_, i) => congNgay(cuoi, i - 6))
  const NHAN = { hoc: 'đã học', binh: 'bình giữ chuỗi đỡ', phep: 'vắng có phép, chuỗi vẫn giữ', tat: 'chuỗi tắt' } as const
  return <div className="tp-tuan7" role="list" aria-label="7 ngày gần nhất">
    {ngay.map((d) => {
      const nay = d === homNay
      let k = theo.get(d)
      if (nay && k === 'tat') k = undefined // hôm nay chưa hết ngày
      const tl = d > homNay
      return <div key={d} role="listitem" aria-label={`${nay ? 'Hôm nay' : `${thuNgan(d)} ${ngayNgan(d)}`}: ${k ? NHAN[k] : tl ? 'chưa tới' : nay ? 'chưa học' : 'chưa có'}`}>
        <span className="n" data-k={k} data-nay={nay || undefined} id={idO?.(d)}>
          {(k === 'binh' || (nay && k === 'hoc')) && <i className="lan" aria-hidden="true" />}
          {k === 'hoc' ? <Check size={18} strokeWidth={3} aria-hidden="true" /> : k === 'binh' ? <FlaskConical size={18} aria-hidden="true" /> : k === 'phep' ? <b>P</b> : null}
        </span>
        <span aria-hidden="true">{nay ? 'Nay' : thuNgan(d)}</span>
      </div>
    })}
  </div>
}
export function ChuGiaiTuan() {
  return <div className="tp-chu-giai" aria-hidden="true"><span><i />Ngày học</span><span><i data-k="binh" />Bình đỡ</span><span><i data-k="phep" />P · Vắng có phép</span><span><i data-k="tat" />Chuỗi tắt</span></div>
}
