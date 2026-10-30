// GIÁM THỊ Ở MÀN KIỂM TRA kiểu Duo (thầy 30/10: «có cả giám thị hiển thị như ở chặng» · «giám thị soi đèn pha vào đáp án học sinh bấm»; đặc tả
// docs/dac-ta-kiem-tra-duo-3010.md). Dùng lại hình người v3 của màn làm chặng (giam-thi-nguoi.ts) + đèn pha đội đầu (`den`). CHỈ TRÌNH BÀY:
//   · không đọc / không biết đáp án — đèn chỉ soi ô em VỪA CHẠM trên máy em; không có dáng đúng / sai / «chưa tính», không lời bàn về câu;
//   · không nhận chạm (lớp phủ `pointer-events: none`) — mọi chạm vẫn tới thẻ câu như cũ (chọn đáp án, lưu, chống rời màn, giữ để đọc không đổi).
// Người theo PHẦN (gói đề của em không có mức câu): Phần I · Tí · Phần II · Cô Cốc · Phần III · Chú Tam; tấm nộp bài: Giáo sư Kíp (GiamThiNop).
// Bố cục kiểu chặng: giám thị bên trái, đề trong bong bóng bên phải; đề dài tràn xuống dưới chân giám thị thì bong bóng thành chữ L (khuyết góc ôm giám thị).
// Thẻ câu (TheCau) do ExamTakeScreen dựng ⇒ KHÔNG sửa thẻ: mảnh này ĐO đề của câu đang xem (ResizeObserver — báo sau khi trình duyệt tự tính bố cục) rồi
// đặt giám thị bằng transform + gắn thuộc tính trình bày (`data-kt-l`, biến `--kt-du`) lên khối đề; CSS ở styles/trong-kiem-tra.css mục 5.
// MƯỢT: dựng giám thị SAU khung đầu (rAF → setTimeout) — câu hiện trước; phản ứng chạm cũng sau khung đầu (ô được chọn vẽ trước, đèn bật khung sau).
import { useEffect, useRef } from 'react'
import { taoGiamThi, type GiamThi } from '../giam-thi/giam-thi-nguoi'
import type { MucGT } from '../giam-thi/giam-thi-ve'
import { taoDenSoi, type DenSoi } from './den-soi'
import '../giam-thi/giam-thi.css'

export type PhanThiGT = 'I' | 'II' | 'III'
/** Người coi theo phần. */
export const GT_THEO_PHAN: Record<PhanThiGT, MucGT> = { I: 'nb', II: 'th', III: 'vd' }
/** Lời nhắc DUY NHẤT của giám thị trong ca (lúc đồng hồ chuyển gấp) — không bàn về câu, không gợi ý. */
export const LOI_SAP_HET_GIO = 'Sắp hết giờ, soát lại bài nhé.'
const MS_CHO = 25_000
/** Ô em chạm được: phương án Phần I, nút Đúng / Sai Phần II, phím số Phần III. */
const O_CHAM = '.pa-hang, .y-nut button, .bns-phim button'

const sauKhungDau = (f: () => void): (() => void) => {
  let h = 0
  const r = requestAnimationFrame(() => { h = window.setTimeout(f, 0) })
  return () => { cancelAnimationFrame(r); clearTimeout(h) }
}

/** Ô cần soi khi em chạm `el`: phím số ⇒ hàng ô số (đáp án đang gõ); còn lại ⇒ chính ô. */
function oSoi(el: Element): Element | null {
  if (el.closest('.bns-phim')) return el.closest('.bns')?.querySelector('.bns-o-hang') ?? el.closest('.bns')
  return el
}

export default function GiamThiThi({ phan, cauHien, gap, goc }: {
  phan: PhanThiGT; cauHien: number; gap: boolean
  /** Gốc khung ThiDuo (nghe chạm, tìm thẻ câu `#cau-N`). */
  goc: React.RefObject<HTMLElement | null>
}) {
  const host = useRef<HTMLDivElement>(null), nvRef = useRef<HTMLDivElement>(null), lopRef = useRef<HTMLDivElement>(null)
  const gt = useRef<GiamThi | null>(null), den = useRef<DenSoi | null>(null), deRef = useRef<HTMLElement | null>(null)
  const muc = GT_THEO_PHAN[phan]
  const henCho = useRef(0)

  /** 25 giây không thao tác ⇒ dáng chờ. */
  const datCho = () => {
    clearTimeout(henCho.current)
    henCho.current = window.setTimeout(() => { if (!document.hidden) gt.current?.datTrangThai('cho') }, MS_CHO)
  }
  /** Câu mới: đọc đề rồi liếc xuống ô em đã chọn (nếu có). */
  const chao = (g: GiamThi | null) => {
    if (!g) return
    g.datTrangThai('doc', { xong: () => { const chon = deRef.current?.closest('.the-cau')?.querySelector('[data-trang-thai="chon"]'); chon ? g.nhinVao(chon) : g.nhin(0.55, 0.6) } })
    datCho()
  }

  // Đèn: một lớp phủ cho cả ca. Khối câu mang `data-gt` suốt khung (một lần — không bật / tắt theo câu ⇒ không tính lại kiểu cả khối mỗi câu).
  useEffect(() => {
    const lop = lopRef.current, main = host.current?.parentElement
    if (!lop) return
    main?.setAttribute('data-gt', '')
    den.current = taoDenSoi(lop, { onTat: () => gt.current?.svg.querySelector('.gt-den')?.removeAttribute('data-bat') })
    return () => { den.current?.huy(); den.current = null; main?.removeAttribute('data-gt') }
  }, [])

  // Dựng giám thị theo người (đổi phần ⇒ người khác). Sau khung đầu: câu hiện trước.
  useEffect(() => {
    const el = nvRef.current
    if (!el) return
    let g: GiamThi | null = null
    const huyHen = sauKhungDau(() => { g = taoGiamThi(el, { muc, den: true }); gt.current = g; chao(g) })
    return () => { huyHen(); den.current?.tat(true); g?.huy(); if (gt.current === g) gt.current = null }
  }, [muc]) // eslint-disable-line react-hooks/exhaustive-deps

  // ĐẶT GIÁM THỊ CẠNH ĐỀ của câu đang xem (đo bằng ResizeObserver — đọc bố cục đã sạch, không ép tính lại).
  useEffect(() => {
    const g0 = goc.current, h = host.current
    if (!g0 || !h) return
    den.current?.tat(true)
    const the = g0.querySelector<HTMLElement>(`#cau-${cauHien}`)
    const de = the?.querySelector<HTMLElement>('.cau-de') ?? null
    deRef.current = de
    const main = h.parentElement
    if (!de || !main || typeof ResizeObserver === 'undefined') { h.hidden = true; return }
    h.hidden = false
    if (gt.current) chao(gt.current)
    let lan = 0
    const dat = () => {
      const w = h.offsetWidth || 1, cao = Math.round(w * 1.155) // khung SVG 220 × 254
      const rm = main.getBoundingClientRect(), r = de.getBoundingClientRect()
      const L = de.hasAttribute('data-kt-l')
      // Chữ L khi đề (dáng thường, bên phải giám thị) tràn quá chân giám thị ≥ 24 px; dáng L chỉ làm khối chữ THẤP đi ⇒ không lật qua lại.
      const mt = L ? 0 : parseFloat(getComputedStyle(de).marginTop) || 0
      const dinh = r.top - mt
      if (!L && r.bottom - dinh > cao + 24 && lan < 2) { lan++; de.setAttribute('data-kt-l', ''); h.setAttribute('data-l', ''); return }
      h.style.transform = `translate3d(0, ${Math.round(dinh - rm.top)}px, 0)`
      // đề ngắn: đẩy phần sau xuống dưới chân giám thị (không đè hình, bảng, phương án)
      const du = L ? 0 : Math.max(0, Math.round(cao + 8 - (r.bottom - dinh)))
      de.style.setProperty('--kt-du', `${du}px`)
    }
    const ro = new ResizeObserver(() => dat())
    ro.observe(de); ro.observe(main)
    return () => { ro.disconnect(); de.removeAttribute('data-kt-l'); h.removeAttribute('data-l'); de.style.removeProperty('--kt-du') }
  }, [cauHien]) // eslint-disable-line react-hooks/exhaustive-deps

  // CHẠM / RÊ: mắt dõi theo; chạm ô ⇒ bật đèn soi ô ấy (sau khung đầu — ô được chọn vẽ trước).
  useEffect(() => {
    const g0 = goc.current
    if (!g0) return
    let huySoi: (() => void) | null = null
    const oCuaSuKien = (e: Event) => (e.target as Element | null)?.closest?.(O_CHAM) ?? null
    const re = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; const o = oCuaSuKien(e); if (o) gt.current?.nhinVao(o) }
    const soi = (o: Element) => {
      const g = gt.current, lop = lopRef.current, kinh = g?.svg.querySelector('.gt-den-kinh')
      const dich = oSoi(o)
      if (!g || !lop || !kinh || !dich || host.current?.hidden) return
      g.nhinVao(dich)
      g.svg.querySelector('.gt-den')?.setAttribute('data-bat', '')
      const rl = lop.getBoundingClientRect(), rk = kinh.getBoundingClientRect(), rd = dich.getBoundingClientRect()
      den.current?.soi({ x: rk.left + rk.width / 2 - rl.left, y: rk.top + rk.height / 2 - rl.top }, { x: rd.left - rl.left, y: rd.top - rl.top, w: rd.width, h: rd.height })
    }
    const henSoi = (o: Element) => { huySoi?.(); huySoi = sauKhungDau(() => soi(o)) }
    const thucDay = () => {
      const t = gt.current?.trangThai()
      if (t === 'cho' || t === 'dong-ho') gt.current?.datTrangThai('yen')
      datCho()
    }
    const cham = (e: Event) => {
      thucDay()
      const o = oCuaSuKien(e)
      if (o && !(o as HTMLButtonElement).disabled) henSoi(o)
    }
    // Phần III gõ bằng bàn phím máy tính (bảng nhập số nghe phím) / ô nhập tự do: soi ô đáp án đang gõ.
    const go = (e: Event) => {
      const t = e.target as Element | null
      const bns = t?.closest?.('.bns'), oNhap = t instanceof HTMLInputElement && t.closest('.the-cau') ? t : null
      if (!bns && !oNhap) return
      if (e.type === 'keydown' && !/^([0-9]|,|\.|-|Backspace|Delete)$/.test((e as KeyboardEvent).key)) return
      thucDay()
      henSoi(bns?.querySelector('.bns-o-hang') ?? bns ?? oNhap!)
    }
    g0.addEventListener('pointerover', re)
    g0.addEventListener('click', cham)
    g0.addEventListener('keydown', go)
    g0.addEventListener('input', go)
    const doiKho = () => den.current?.tat(true)
    window.addEventListener('resize', doiKho)
    const an = () => { gt.current?.tamDung(document.hidden); if (document.hidden) { den.current?.tat(true); clearTimeout(henCho.current) } else datCho() }
    document.addEventListener('visibilitychange', an)
    return () => {
      huySoi?.(); clearTimeout(henCho.current)
      g0.removeEventListener('pointerover', re); g0.removeEventListener('click', cham); g0.removeEventListener('keydown', go); g0.removeEventListener('input', go)
      window.removeEventListener('resize', doiKho); document.removeEventListener('visibilitychange', an)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Đồng hồ chuyển gấp: xem đồng hồ + MỘT lời nhắc (một lần mỗi ca).
  const daNhac = useRef(false)
  useEffect(() => {
    if (!gap || daNhac.current) return
    daNhac.current = true
    const huy = sauKhungDau(() => { const g = gt.current; if (!g || document.hidden) return; g.datTrangThai('dong-ho'); g.noi(LOI_SAP_HET_GIO, { giu: 3200 }); window.setTimeout(() => { if (gt.current === g && g.trangThai() === 'dong-ho') g.datTrangThai('yen') }, 4200) })
    return huy
  }, [gap])

  return (
    <>
      <div ref={host} className="kt-gt" aria-hidden="true" hidden><div ref={nvRef} className="kt-gt-nv gt-o" /></div>
      <div ref={lopRef} className="kt-den" aria-hidden="true" />
    </>
  )
}

/** Giám thị tĩnh ở tấm «Nộp bài?» — Giáo sư Kíp, đèn bật. Không hoạt ảnh (một lần dựng). */
export function GiamThiNop({ muc = 'vdc' }: { muc?: MucGT }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const g = taoGiamThi(el, { muc, tinh: true, den: true, trangThai: 'yen' })
    g.svg.querySelector('.gt-den')?.setAttribute('data-bat', '')
    return () => g.huy()
  }, [muc])
  return <div ref={ref} className="gt-o kt-gt-nop" aria-hidden="true" />
}
