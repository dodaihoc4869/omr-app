// RUỘT «Chạm để hiểu đề» + «Bắt đầu từ đâu?» — mảnh NẠP LƯỜI của VungChamDe (không vào gói mở app, không precache: kho chạy-lúc).
// Vỏ (VungChamDe.tsx) giữ khung: khe trên (chú giải) · thân đề (children của màn) · khe dưới (gợi ý) · nút «Bắt đầu từ đâu?».
// Ruột: bọc chữ đề tại chỗ (boc-chu.ts) · thẻ giải nghĩa (TamGiaiThich) · soi sáng · gợi ý 3 tầng (GoiY3Tang) · chú giải màu.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import type { BanSoDo, GoiYTraVe, LoaiCham, TheGiaiNghia, VungCham } from '../../lib/goi-y-cham/kieu'
import { docBanSoDo, taiGoiYSoDo } from '../../lib/goi-y-cham/api'
import { bocVung, type KetQuaBoc } from './boc-chu'
import { napTuDien, type TuDien } from './tu-dien'
import TamGiaiThich, { useKieuTam } from './TamGiaiThich'
import GoiY3Tang, { tangTuBan, tangTuSinh, type TrangThaiGoiY } from './GoiY3Tang'
import './goi-y-cham.css'

export type CauCham = { qid: string; phan?: string; goiY?: { gach?: string[]; cotLoi?: string } }
export type RuotChamProps = {
  q: CauCham
  goc: RefObject<HTMLDivElement | null>
  tren: RefObject<HTMLDivElement | null>
  duoi: RefObject<HTMLDivElement | null>
  /** em đã mở «Bắt đầu từ đâu?» */
  mo: boolean
  dong: () => void
  idGoiY: string
  tuDien?: TuDien
  taiGoiY?: (qid: string) => Promise<GoiYTraVe | null>
  token?: string
  phien?: string
}

const KHOA_CHU_GIAI = 'ddh.gyc.chu-giai'
/** Chú giải đầy đủ chỉ ở 3 câu đầu mỗi phiên (sessionStorage; lỗi lưu trữ ⇒ cứ hiện). */
function hienDuChuGiai(qid: string): boolean {
  try {
    const ds: unknown = JSON.parse(sessionStorage.getItem(KHOA_CHU_GIAI) || '[]')
    const a = Array.isArray(ds) ? ds.filter((x): x is string => typeof x === 'string') : []
    if (a.includes(qid)) return true
    if (a.length >= 3) return false
    sessionStorage.setItem(KHOA_CHU_GIAI, JSON.stringify([...a, qid]))
    return true
  } catch { return true }
}

/** Gợi ý tầng 1 nói về chất + từ then chốt; tầng 2–3 thêm số liệu đề cho. «Đề hỏi» không cần soi (đã nổi sẵn). */
/** Câu lý thuyết (đề không có số liệu nào) chỉ tô «Đề hỏi» + cụm bẫy (bản vẽ màn 5): bỏ tô chất, từ then chốt. */
export const locLyThuyet = (ds: VungCham[]): VungCham[] => (ds.some((v) => v.loai === 'cho') ? ds : ds.filter((v) => v.loai === 'hoi'))

const sangO = (loai: LoaiCham, tang: number) => loai === 'chat' || loai === 'khoa' || (loai === 'cho' && tang >= 2)

export function RuotCham(p: RuotChamProps) {
  const { q, goc } = p
  const kieu = useKieuTam()
  const [td, setTd] = useState<TuDien | null>(p.tuDien ?? null)
  useEffect(() => {
    if (p.tuDien) return
    let huy = false
    void napTuDien().then((t) => { if (!huy) setTd(t) })
    return () => { huy = true }
  }, [p.tuDien])

  // ── bọc chữ đề (một lần cho mỗi câu; vỏ đã gắn key = qid nên thân đề mới ⇒ ruột mới)
  const [boc, setBoc] = useState<KetQuaBoc | null>(null)
  useLayoutEffect(() => {
    const g = goc.current
    if (!g || !td) return
    const kq = bocVung(g, td.phatHien, (v, chu) => { try { return !!td.theCho(v, chu) } catch { return false } }, locLyThuyet)
    setBoc(kq)
    return () => kq.go()
  }, [td, goc])
  const the = useMemo<(TheGiaiNghia | null)[]>(() => (boc && td ? boc.vung.map((v, i) => { try { return td.theCho(v, boc.chuKhoi[i]) } catch { return null } }) : []), [boc, td])

  // ── thẻ giải nghĩa đang mở: {i, ghim}; rê chuột (máy tính) = chưa ghim
  const [mo1, setMo1] = useState<{ i: number; ghim: boolean; phim?: boolean } | null>(null)
  const moRef = useRef(mo1)
  moRef.current = mo1
  const hen = useRef<number | undefined>(undefined)
  const idThe = `${p.idGoiY}-the`
  const dongThe = useCallback((traTieuDiem: boolean) => {
    const cu = moRef.current
    setMo1(null)
    if (traTieuDiem && cu && boc) boc.manh[cu.i]?.[0]?.focus({ preventScroll: true })
  }, [boc])
  useEffect(() => {
    const g = goc.current
    if (!g || !boc) return
    const vungCua = (t: EventTarget | null) => {
      const el = t instanceof Element ? t.closest<HTMLElement>('.gyc-cham') : null
      return el && g.contains(el) ? Number(el.dataset.vung) : -1
    }
    const nay = (i: number) => {
      for (const s of boc.manh[i] ?? []) { s.classList.remove('gyc-nay'); void s.offsetWidth; s.classList.add('gyc-nay') }
    }
    const huyHen = () => window.clearTimeout(hen.current)
    const henTat = () => { huyHen(); hen.current = window.setTimeout(() => { if (moRef.current && !moRef.current.ghim) setMo1(null) }, 220) }
    const onClick = (e: MouseEvent) => {
      const i = vungCua(e.target)
      if (i < 0) return
      huyHen(); nay(i)
      setMo1((c) => (c && c.i === i && c.ghim ? null : { i, ghim: true }))
    }
    const onKey = (e: KeyboardEvent) => {
      const i = vungCua(e.target)
      if (i < 0) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); e.stopPropagation(); huyHen(); nay(i)
        setMo1((c) => (c && c.i === i && c.ghim ? null : { i, ghim: true, phim: true }))
      } else if (e.key === 'Escape' && moRef.current) { e.stopPropagation(); setMo1(null) }
    }
    const onVao = (e: MouseEvent | FocusEvent) => {
      if (kieu !== 'noi') return
      const i = vungCua(e.target)
      if (i < 0) return
      huyHen()
      setMo1((c) => (c?.ghim ? c : { i, ghim: false }))
    }
    const onRa = (e: MouseEvent | FocusEvent) => {
      if (kieu !== 'noi' || vungCua(e.target) < 0) return
      if (vungCua(e.relatedTarget) === vungCua(e.target)) return
      henTat()
    }
    g.addEventListener('click', onClick)
    g.addEventListener('keydown', onKey)
    g.addEventListener('mouseover', onVao)
    g.addEventListener('mouseout', onRa)
    g.addEventListener('focusin', onVao)
    g.addEventListener('focusout', onRa)
    return () => {
      huyHen()
      g.removeEventListener('click', onClick); g.removeEventListener('keydown', onKey)
      g.removeEventListener('mouseover', onVao); g.removeEventListener('mouseout', onRa)
      g.removeEventListener('focusin', onVao); g.removeEventListener('focusout', onRa)
    }
  }, [boc, goc, kieu])
  // chạm ra ngoài (không phải chữ chạm, không phải thẻ) ⇒ đóng; Esc ở bất kỳ đâu ⇒ đóng
  useEffect(() => {
    if (!mo1) return
    const ngoai = (e: PointerEvent) => {
      const t = e.target as Element | null
      if (t?.closest?.('.gyc-bong') || (t?.closest?.('.gyc-cham') && goc.current?.contains(t))) return
      setMo1(null)
    }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') dongThe(true) }
    document.addEventListener('pointerdown', ngoai, true)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', ngoai, true); document.removeEventListener('keydown', esc) }
  }, [mo1, goc, dongThe])
  // trạng thái trên chữ: đang chạm, aria-expanded
  useEffect(() => {
    if (!boc) return
    boc.manh.forEach((ds, i) => {
      const dang = mo1?.i === i
      ds.forEach((s) => s.classList.toggle('gyc-dang', dang))
      if (ds[0]?.tabIndex === 0) { ds[0].setAttribute('aria-expanded', String(dang)); if (dang) ds[0].setAttribute('aria-controls', idThe); else ds[0].removeAttribute('aria-controls') }
    })
  }, [boc, mo1, idThe])
  // mở bằng phím ⇒ đưa con trỏ vào nút «Đã hiểu» của thẻ (Esc / Đã hiểu ⇒ con trỏ về lại chữ)
  useEffect(() => { if (mo1?.phim) document.getElementById(idThe)?.querySelector<HTMLElement>('[data-gyc-da-hieu]')?.focus({ preventScroll: true }) }, [mo1, idThe])

  // ── gợi ý 3 tầng
  const [gy, setGy] = useState<{ tt: TrangThaiGoiY; ban?: BanSoDo } | null>(null)
  const [tang, setTang] = useState(1)
  const tai = useCallback(() => {
    const f = p.taiGoiY ?? (p.token ? (qid: string) => taiGoiYSoDo(p.token!, qid, p.phien) : null)
    if (!f) { setGy({ tt: 'khong' }); return }
    setGy({ tt: 'tai' })
    f(q.qid).then((r) => {
      // Gợi ý luôn ở TRƯỚC khi nộp ⇒ đọc lại chặt và cắt mọi `ketQua` (lớp chắn thứ hai, kể cả khi máy chủ trả `sau`).
      const ban = r && r.co ? docBanSoDo(r.ban, false) : null
      setGy(!r ? { tt: 'loi' } : ban ? { tt: 'co', ban } : { tt: 'khong' })
    }, () => setGy({ tt: 'loi' }))
  }, [p.taiGoiY, p.token, p.phien, q.qid])
  useEffect(() => { if (p.mo && !gy) tai() }, [p.mo, gy, tai])
  // soi sáng: đề mờ, chữ tầng đang nói tới sáng
  useEffect(() => {
    const g = goc.current
    if (!g) return
    g.classList.toggle('gyc-soi', p.mo && !!boc?.vung.length)
    boc?.manh.forEach((ds, i) => { const s = p.mo && sangO(boc.vung[i].loai, tang); ds.forEach((x) => x.classList.toggle('gyc-sang', s)) })
    return () => g.classList.remove('gyc-soi')
  }, [p.mo, tang, boc, goc])
  // ≥ 640px: gợi ý ở cột phải ⇒ báo khung màn chừa chỗ (biến --gyc-cot-phai trên <html>)
  useEffect(() => {
    if (!p.mo) return
    document.documentElement.setAttribute('data-gyc-cot-phai', '')
    return () => document.documentElement.removeAttribute('data-gyc-cot-phai')
  }, [p.mo])

  const chuCua = (loai: LoaiCham) => [...new Set((boc?.vung ?? []).filter((v) => v.loai === loai).map((v) => v.chu.trim()).filter(Boolean))]
  const tangDs = gy?.tt === 'co' && gy.ban ? tangTuBan(gy.ban) : tangTuSinh(chuCua('cho'), chuCua('hoi'), chuCua('chat'), q.goiY)
  const coPhepTinh = gy?.tt === 'co' ? !!gy.ban?.buoc.length : chuCua('cho').length > 0

  // ── chú giải màu
  const [duChuGiai] = useState(() => hienDuChuGiai(q.qid))
  const [moChuGiai, setMoChuGiai] = useState(false)
  const coLoai = (l: LoaiCham) => !!boc?.vung.some((v) => v.loai === l)
  const chuGiai = boc?.vung.length ? (
    <div className="gyc-cg-hang">
      {!duChuGiai && <button type="button" className="gyc-nut-hoi" aria-label={moChuGiai ? 'Ẩn chú giải màu' : 'Xem chú giải màu'} aria-expanded={moChuGiai} onClick={() => setMoChuGiai((v) => !v)}><span aria-hidden="true">?</span></button>}
      {(duChuGiai || moChuGiai) && (
        <div className="gyc-chu-giai">
          <span className="gyc-cg-dau">Chạm chữ tô màu để hiểu đề</span>
          {coLoai('cho') && <span className="gyc-mau"><i className="gyc-m-cho" />Đề cho</span>}
          {coLoai('hoi') && <span className="gyc-mau"><i className="gyc-m-hoi" />Đề hỏi</span>}
          {coLoai('chat') && <span className="gyc-mau"><i className="gyc-m-chat" />Chất</span>}
          {coLoai('khoa') && <span className="gyc-mau"><b>in đậm</b>Từ then chốt</span>}
        </div>
      )}
    </div>
  ) : null

  const theMo = mo1 && the[mo1.i]
  return (
    <>
      {p.tren.current && chuGiai && createPortal(chuGiai, p.tren.current)}
      {p.duoi.current && p.mo && createPortal(
        <GoiY3Tang
          id={p.idGoiY} tangDs={tangDs} trangThai={gy?.tt ?? 'tai'} mo={tang} coPhepTinh={coPhepTinh}
          onTiep={() => setTang((t) => Math.min(t + 1, tangDs.length))} onXong={p.dong} onDong={p.dong} onThuLai={tai}
        />, p.duoi.current)}
      {theMo && boc && (
        <TamGiaiThich
          the={theMo} neo={boc.manh[mo1.i]?.[0] ?? null} kieu={kieu} id={idThe}
          onDong={() => dongThe(true)}
          onVao={() => window.clearTimeout(hen.current)}
          onRoi={() => { if (!moRef.current?.ghim) { window.clearTimeout(hen.current); hen.current = window.setTimeout(() => { if (moRef.current && !moRef.current.ghim) setMo1(null) }, 220) } }}
        />
      )}
    </>
  )
}
