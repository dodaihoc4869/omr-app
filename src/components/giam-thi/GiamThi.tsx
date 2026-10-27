// GIÁM THỊ CẠNH ĐỀ — màn làm chặng kiểu Duolingo (thầy chốt bản vẽ 27/10). Mảnh NẠP LƯỜI (React.lazy ở ManLamBaiTap) + tờ giam-thi.css riêng.
// Bảng ánh xạ sự kiện → trạng thái (bản vẽ ve-moi/giam-thi/demo.html):
//   câu mới ⇒ «đọc đề» rồi liếc xuống phương án · rê / chạm phương án ⇒ mắt dõi theo · giữ một lựa chọn 8 giây chưa Kiểm tra ⇒ soi ·
//   20 giây không thao tác ⇒ chờ (gõ tay / chân) · quá giờ theo mức ⇒ xem đồng hồ · bấm Kiểm tra trong 4 giây đầu ⇒ liếc nghi ngờ, còn lại ⇒ cúi nhìn ·
//   đúng ⇒ mừng theo tính cách (đúng liền ≥ 3 ⇒ combo) · sai ⇒ xị mặt · câu chưa tính ⇒ lắc ngón tay · học có hỗ trợ / chờ thầy ⇒ đứng coi.
// Lời càu nhàu (loi-giam-thi.ts) theo nhịp chung cả phiên, tối đa 1 lần mỗi 2–3 câu. Tab ẩn ⇒ dừng hết (hoạt ảnh + hẹn giờ).
import { useEffect, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { duongL, khuyetL, type MucGT, type TrangThaiGT } from './giam-thi-ve'
import { taoGiamThi, type GiamThi } from './giam-thi-nguoi' // 4 giám thị HÌNH NGƯỜI v3 (thầy chốt 27/10), cùng API bản cũ
import { cauMoi, suLoi, taoNhip, type NguCanhLoi, type NhipLoi } from './loi-giam-thi'
import './giam-thi.css'

export type KetGT = 'dung' | 'sai' | 'chua-tinh' | 'combo' | 'trung'
const NGUONG = { soi: 8000, cho: 20000, voi: 4000 }
/** Quá giờ ⇒ xem đồng hồ: câu khó được nghĩ lâu hơn. */
export const DONG_HO_GT: Record<MucGT, number> = { nb: 60_000, th: 90_000, vd: 150_000, vdc: 240_000 }
let nhip: NhipLoi = taoNhip()
const bay = () => performance.now()
const CHON = '[aria-checked="true"], [aria-pressed="true"]'

export default function GiamThiCau({ muc, qid, phien, nop, ket, vung }: {
  muc: MucGT; qid: string; phien: string; nop: boolean; ket: KetGT | null
  /** Gốc màn làm bài: nghe chạm / rê trong `.duo-tra` để mắt dõi theo. */
  vung: () => HTMLElement | null
}) {
  const host = useRef<HTMLDivElement>(null), gt = useRef<GiamThi | null>(null)
  const hen = useRef<Record<string, number>>({}), batDau = useRef(bay()), daNop = useRef(false), coKet = useRef(!!ket)
  coKet.current = !!ket
  const datHen = (k: string, ms: number, f: () => void) => { clearTimeout(hen.current[k]); hen.current[k] = window.setTimeout(f, ms) }
  const huyHen = (...ks: string[]) => { for (const k of ks.length ? ks : Object.keys(hen.current)) { clearTimeout(hen.current[k]); delete hen.current[k] } }
  const noi = (k: NguCanhLoi) => { const c = suLoi(nhip, muc, k, bay()); if (c) gt.current?.noi(c) }
  const datTT = (t: TrangThaiGT) => gt.current?.datTrangThai(t)
  const henCho = () => datHen('cho', NGUONG.cho, () => { if (!coKet.current && !document.hidden) { datTT('cho'); noi('cho') } })

  // Dựng giám thị + câu mới (màn dựng lại khối đề mỗi câu ⇒ chạy lại khi đổi câu).
  useEffect(() => {
    const el = host.current
    if (!el) return
    const g = taoGiamThi(el, { muc, loiVao: el.closest('.duo-gt-san')?.querySelector<HTMLElement>(':scope > .duo-gt-loi-o') })
    gt.current = g
    if (nhip.phien !== phien) nhip = taoNhip(phien)
    cauMoi(nhip, qid)
    batDau.current = bay(); daNop.current = false
    // Bong bóng càu nhàu không rộng hơn khối giám thị + đề (không tràn sang cột phương án ở khung ngang).
    const doRong = () => { const san = el.closest('.duo-gt-san') ?? el.parentElement; if (san) el.style.setProperty('--gt-loi-max', `${Math.max(140, san.clientWidth - 4)}px`) }
    doRong()
    window.addEventListener('resize', doRong)
    if (!ket) {
      g.datTrangThai('doc', { xong: () => { if (coKet.current) return; const chon = vung()?.querySelector(`.duo-tra ${CHON}`); chon ? g.nhinVao(chon) : g.nhin(0.5, 0.45); datHen('loi', 1200, () => { if (!coKet.current) noi('ngauNhien') }) } })
      henCho()
      datHen('dh', DONG_HO_GT[muc], () => { if (!coKet.current && !document.hidden) { datTT('dong-ho'); noi('dongHo') } })
    }
    return () => { window.removeEventListener('resize', doRong); huyHen(); g.huy(); gt.current = null }
  }, [muc, qid]) // eslint-disable-line react-hooks/exhaustive-deps

  // KHUNG CHỮ L — CHỈ khi chữ thật sự tràn xuống dưới chân giám thị (thầy 27/10: câu 4 dòng bị đáy rỗng). Đo trước khi vẽ (layout effect /
  // ResizeObserver chạy trước khi sơn): bật thử chữ L, xem đáy chữ đề có xuống quá khuyết ≥ 12 px không; không ⇒ trả về bong bóng thường bên phải
  // giám thị, cao vừa nội dung. Đo lại khi khối đổi bề ngang hoặc chữ đề đổi cao (ảnh nạp xong, phông về); bong bóng đổi cỡ (thẻ giải nghĩa) ⇒ vẽ lại viền.
  useLayoutEffect(() => {
    const san = host.current?.closest<HTMLElement>('.duo-gt-san'), bong = san?.querySelector<HTMLElement>('.duo-gt-bong')
    const svg = bong?.querySelector<SVGSVGElement>(':scope > .duo-gt-vien'), path = svg?.querySelector('path')
    const de = bong?.querySelector<HTMLElement>('.ht2-lam-de') ?? bong?.querySelector<HTMLElement>('.gyc-de')
    if (!san || !bong || !svg || !path || !de || typeof ResizeObserver === 'undefined') return
    const khuyet = () => khuyetL(parseFloat(getComputedStyle(san).getPropertyValue('--gt-nvw')) || 120)
    const ve = () => {
      if (!san.hasAttribute('data-l')) return
      const w = bong.offsetWidth, h = bong.offsetHeight, { kw, kh, kd } = khuyet()
      if (!w || !h) return
      svg.setAttribute('width', String(w)); svg.setAttribute('height', String(h))
      path.setAttribute('d', duongL(w, h, kw, kh, kd))
    }
    let rong = -1, cao = -1, bongCao = -1
    const quyet = () => {
      san.setAttribute('data-l', '')
      const day = de.getBoundingClientRect().bottom - bong.getBoundingClientRect().top
      if (!(day > khuyet().kh + 12)) san.removeAttribute('data-l')
      ve()
      rong = san.clientWidth; cao = de.offsetHeight; bongCao = bong.offsetHeight
    }
    quyet()
    const ro = new ResizeObserver(() => {
      if (san.clientWidth !== rong || de.offsetHeight !== cao) quyet()
      else if (bong.offsetHeight !== bongCao) { bongCao = bong.offsetHeight; ve() }
    })
    ro.observe(san); ro.observe(de); ro.observe(bong)
    return () => { ro.disconnect(); san.removeAttribute('data-l') }
  }, [qid])

  // Mắt dõi phương án + nhịp chờ / soi theo thao tác của em.
  useEffect(() => {
    const goc = vung()
    if (!goc) return
    const oTra = (e: Event) => (e.target as Element | null)?.closest?.('.duo-tra button, .duo-tra [role="radio"], .ht2-lam-ban-phim button')
    const nhinChon = () => { const c = goc.querySelector(`.duo-tra ${CHON}`); c ? gt.current?.nhinVao(c) : gt.current?.nhin(0.5, 0.45) }
    const re = (e: Event) => { if (coKet.current) return; const b = oTra(e); if (b) gt.current?.nhinVao(b) }
    const roi = (e: PointerEvent) => { if (coKet.current) return; if (oTra(e) && !(e.relatedTarget as Element | null)?.closest?.('.duo-tra')) nhinChon() }
    const cham = (e: Event) => {
      nhip.lanCham = bay()
      if (coKet.current) return
      huyHen('loi'); henCho()
      const t = gt.current?.trangThai()
      if (t === 'cho' || t === 'soi' || t === 'dong-ho') datTT('yen')
      if (oTra(e) || e.type === 'keydown') requestAnimationFrame(() => {
        if (coKet.current) return
        nhinChon()
        if (goc.querySelector(`.duo-tra ${CHON}`)) datHen('soi', NGUONG.soi, () => { if (!coKet.current && !daNop.current && !document.hidden) datTT('soi') })
      })
    }
    goc.addEventListener('pointerover', re)
    goc.addEventListener('pointerout', roi)
    goc.addEventListener('click', cham)
    goc.addEventListener('keydown', cham)
    return () => { goc.removeEventListener('pointerover', re); goc.removeEventListener('pointerout', roi); goc.removeEventListener('click', cham); goc.removeEventListener('keydown', cham) }
  }, [qid]) // eslint-disable-line react-hooks/exhaustive-deps

  // Bấm Kiểm tra: nhanh quá ⇒ liếc nghi ngờ (+ «Bấm nhanh thế…»), còn lại ⇒ cúi nhìn ô đã chọn.
  useEffect(() => {
    if (!nop || ket || daNop.current) return
    daNop.current = true
    huyHen('soi', 'cho', 'dh', 'loi')
    if (bay() - batDau.current < NGUONG.voi) { datTT('nghi-ngo'); noi('voi') } else datTT('nop')
  }, [nop]) // eslint-disable-line react-hooks/exhaustive-deps

  // Kết quả: phản ứng CÙNG LÚC tấm kết quả trượt lên; câu đúng/sai có thể kèm một câu càu nhàu.
  useEffect(() => {
    if (!ket) return
    huyHen()
    if (ket === 'trung') { datTT('yen'); return }
    datTT(ket)
    if (ket === 'dung' || ket === 'combo') { nhip.saiLien = 0; noi(ket); return }
    nhip.saiLien++
    if (nhip.saiLien >= 2) { nhip.saiLien = 0; noi('sai2') } else if (ket === 'sai') noi('sai')
  }, [ket]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tab ẩn ⇒ không còn hoạt ảnh / hẹn giờ nào chạy; hiện lại ⇒ chạy tiếp, đếm lại nhịp chờ.
  useEffect(() => {
    const doi = () => { gt.current?.tamDung(document.hidden); if (document.hidden) huyHen('cho', 'soi', 'loi'); else if (!coKet.current) henCho() }
    document.addEventListener('visibilitychange', doi)
    return () => document.removeEventListener('visibilitychange', doi)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <div ref={host} className="gt-o" aria-hidden="true" />
}

/** Giám thị TĨNH (không hoạt ảnh) — cho chỗ khác dùng, vd. linh vật mờ cạnh Lộ trình: `xam` = xám, `mo` = mờ. */
export function GiamThiTinh({ muc, trangThai = 'yen', buoc = 0, xam, mo, className, style }: { muc: MucGT; trangThai?: TrangThaiGT; buoc?: number; xam?: boolean; mo?: boolean; className?: string; style?: CSSProperties }) {
  const host = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = host.current
    if (!el) return
    const g = taoGiamThi(el, { muc, tinh: true, xam, mo, trangThai, buoc })
    return () => g.huy()
  }, [muc, trangThai, buoc, xam, mo])
  return <div ref={host} className={['gt-o', className].filter(Boolean).join(' ')} style={style} aria-hidden="true" />
}
