// CỔ VŨ BẠN LÊN BẢNG — TINH THỂ LỬA THEO MÀU ĐỘI bay vào THẺ TÊN (thầy 13/11: «bấm nút cổ vũ trên máy em thì tinh thể lửa theo màu đội siêu đẹp bay
// luôn lên màn hình bay vào thẻ tên của bạn gọi lên bảng, màn thầy và màn học sinh thấy tổng hợp những tinh thể bay của tất cả mọi người»; «thẻ tên gọi
// lên bảng của học sinh dùng bản có sẵn luôn»). Bản vẽ đã duyệt: docs/ban-ve-live-moi-1211/co-vu-tinh-the.html (ảnh 73–74).
//   · NGUỒN SỐ: `luot.goi.tiepDoi` (lượt cổ vũ theo đội NGƯỜI BẤM, phòng đếm — `tiepTheoDoi` trong lib/bpu/phong.ts). Mỗi lần số của một đội tăng ⇒ ngần ấy
//     tinh thể màu đội ấy bay lên. Lớp vừa dựng / lời gọi mới (`khoa` đổi) ⇒ chỉ đặt mốc, KHÔNG phát bù (em vào muộn không thấy mưa tinh thể cũ).
//   · ĐÍCH: thẻ tên CÓ SẴN — máy em `.lv-lb-the` trên khung bảng, máy thầy thẻ tên trong tờ chiếu. Máy chủ lớp tự đo (`dich`), tệp này không dựng thẻ nào.
//   · TINH THỂ CỦA CHÍNH EM (`cuaEm` tăng) xuất phát từ nút «Tiếp sức / Cổ vũ» (`nguon`); của các bạn khác bay lên từ mép dưới.
//   · NHẸ MÁY: chỉ transform + opacity (Web Animations API), phần tử tự gỡ khi bay xong; tối đa TRAN tinh thể cùng lúc, mỗi lượt số mới tối đa MOI_LUOT một
//     đội (lớp đông bấm dồn ⇒ vẫn mượt, phần dư chỉ làm thẻ tên nháy). Máy yếu: ít hơn, không vệt sáng, không quầng. Giảm chuyển động: không bay, chỉ nháy.
//   · KHÔNG tệp CSS riêng (kiểu đặt thẳng vào phần tử) ⇒ không thêm tệp tải. Màu chỉ lấy biến chuẩn (`DOI_BPU[..].mau`, --p-trang, --p-muc).
// AN TOÀN: chỉ dùng số lượt cổ vũ theo đội — không tên người bấm, không đáp án, không kết quả chấm.
import { useEffect, useRef } from 'react'
import { DOI_BPU } from '../../lib/bpu/phong'

import { TRAN, TRAN_YEU, tinhPhat, type DiemTinhThe, type DichTinhThe, type PropsTinhThe } from './tinh-the-tinh'

const HINH = '<svg viewBox="0 0 40 48" width="100%" height="100%" style="display:block;overflow:visible" aria-hidden="true">'
  + '<path d="M20 1 34 15 29 38 20 47 11 38 6 15Z" fill="currentColor"/>'
  + '<path d="M20 1 34 15 20 20Z" style="fill:var(--p-trang);opacity:.55"/><path d="M20 1 6 15 20 20Z" style="fill:var(--p-trang);opacity:.28"/>'
  + '<path d="M34 15 29 38 20 20Z" style="fill:var(--p-muc);opacity:.14"/><path d="M6 15 11 38 20 20Z" style="fill:var(--p-muc);opacity:.3"/>'
  + '<path d="M11 38 20 47 29 38 20 20Z" style="fill:var(--p-muc);opacity:.42"/>'
  + '<path d="M20 12c1 5 6 7 6 13a6 6 0 0 1-12 0c0-3 1.5-4 2.5-6 .8 2 2 2.5 2 2.5 .2-3.5-.2-6 1.500-9.500Z" style="fill:var(--p-trang);opacity:.92"/>'
  + '<path d="M20 22c.6 2 2.600 3 2.600 5.200a2.600 2.600 0 0 1-5.200 0c0-1.600 1-2.300 1.500-3.300.5 1 1.100 1.200 1.100 1.200Z" fill="currentColor"/></svg>'

const bez = (a: DiemTinhThe, b: DiemTinhThe, c: DiemTinhThe, t: number): DiemTinhThe => ({ x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * b.x + t * t * c.x, y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * b.y + t * t * c.y })
const MOC = [0, 0.18, 0.36, 0.54, 0.72, 0.88, 1]
const giamChuyenDong = (): boolean => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

interface May { song: number; lucNhay: number }

/** Thẻ tên nháy + một vòng sáng màu đội nở ra tại đích. Không quá một lần mỗi 160 ms (lớp đông bấm dồn). */
function nhay(lop: HTMLDivElement, may: May, den: DichTinhThe, mau: string): void {
  const nay = Date.now()
  if (nay - may.lucNhay < 160) return
  may.lucNhay = nay
  try { den.the?.animate?.([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)' }) } catch { /* tờ đã gỡ */ }
  const v = document.createElement('i')
  v.style.cssText = `position:absolute;left:0;top:0;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:50%;pointer-events:none;border:2px solid ${mau};will-change:transform,opacity`
  lop.appendChild(v)
  const a = v.animate([{ transform: `translate3d(${den.x}px,${den.y}px,0) scale(.3)`, opacity: 0.85 }, { transform: `translate3d(${den.x}px,${den.y}px,0) scale(1.5)`, opacity: 0 }], { duration: 420, easing: 'cubic-bezier(.2,.7,.3,1)' })
  a.onfinish = a.oncancel = () => v.remove()
}

/** Một tinh thể bay từ `tu` tới `den` theo đường cong; `tre` = ms chờ trước khi xuất phát. */
function bay(lop: HTMLDivElement, may: May, tu: DiemTinhThe, den: DichTinhThe, mau: string, tre: number, yeu: boolean, to: boolean): void {
  const W = lop.offsetWidth, H = lop.offsetHeight
  const giua: DiemTinhThe = { x: tu.x + (den.x - tu.x) * 0.35 + (Math.random() - 0.5) * W * 0.3, y: den.y + (tu.y - den.y) * (0.3 + Math.random() * 0.3) }
  const co = Math.max(20, Math.min(40, Math.min(W, H) * 0.075)) * (to ? 1.25 : 0.8 + Math.random() * 0.45)
  const g0 = (Math.random() - 0.5) * 50, g1 = g0 + (Math.random() - 0.5) * 70, ms = 950 + Math.random() * 450
  const diem = MOC.map((t) => bez(tu, giua, den, t))
  const khung = (xoay: boolean, k: number, mo: number): Keyframe[] => MOC.map((t, i) => ({
    offset: t,
    transform: `translate3d(${diem[i]!.x.toFixed(1)}px,${diem[i]!.y.toFixed(1)}px,0)${xoay ? ` rotate(${(g0 + (g1 - g0) * t).toFixed(1)}deg)` : ''} scale(${(k * (t === 0 ? 0.5 : 1.05 - 0.5 * t)).toFixed(3)})`,
    opacity: t === 0 || t === 1 ? 0 : mo,
  }))
  const tt = document.createElement('div')
  tt.style.cssText = `position:absolute;left:0;top:0;width:${co.toFixed(1)}px;height:${(co * 1.2).toFixed(1)}px;margin:${(-co * 0.6).toFixed(1)}px 0 0 ${(-co / 2).toFixed(1)}px;pointer-events:none;opacity:0;will-change:transform,opacity;color:${mau}`
    + (yeu ? '' : `;filter:drop-shadow(0 0 ${(co * 0.2).toFixed(1)}px ${mau}) drop-shadow(0 0 ${(co * 0.55).toFixed(1)}px color-mix(in srgb, ${mau} 70%, transparent))`)
  tt.innerHTML = HINH
  const lua = { duration: ms, delay: tre, easing: 'cubic-bezier(.4,.05,.5,1)', fill: 'backwards' as const }
  // vệt sáng: ba hạt nhỏ dần đuổi theo cùng đường bay
  if (!yeu) for (let j = 1; j <= 3; j++) {
    const h = document.createElement('i'), c = co * (0.46 - j * 0.09)
    h.style.cssText = `position:absolute;left:0;top:0;width:${c.toFixed(1)}px;height:${c.toFixed(1)}px;margin:${(-c / 2).toFixed(1)}px 0 0 ${(-c / 2).toFixed(1)}px;border-radius:50%;pointer-events:none;opacity:0;will-change:transform,opacity;background:radial-gradient(circle, var(--p-trang), ${mau} 45%, transparent 70%)`
    lop.appendChild(h)
    const ah = h.animate(khung(false, 1, 0.8 - j * 0.18), { ...lua, delay: tre + j * 55 })
    ah.onfinish = ah.oncancel = () => h.remove()
  }
  lop.appendChild(tt)
  may.song++
  const a = tt.animate(khung(true, 1, 1), lua)
  a.onfinish = () => { tt.remove(); may.song--; nhay(lop, may, den, mau) }
  a.oncancel = () => { tt.remove(); may.song-- }
}

export default function TinhTheCoVu({ khoa, dem, dich, nguon, cuaEm = 0, doiEm = -1, coDinh = false, yeu = false }: PropsTinhThe) {
  const lop = useRef<HTMLDivElement>(null)
  const may = useRef<May>({ song: 0, lucNhay: 0 })
  const moc = useRef<{ khoa: string; dem: readonly number[]; cuaEm: number } | null>(null)
  useEffect(() => {
    const cu = moc.current, l = lop.current
    moc.current = { khoa, dem, cuaEm }
    if (!l || !cu || cu.khoa !== khoa || typeof l.animate !== 'function') return
    const phat = tinhPhat(cu.dem, dem)
    if (!phat.some((n) => n > 0)) return
    const W = l.offsetWidth, H = l.offsetHeight
    if (W < 40 || H < 40) return
    const den = dich(l)
    if (!den) return // không có thẻ tên trên màn này (thầy đang ở màn khác) ⇒ không bay
    const mauCua = (d: number): string => `var(${DOI_BPU[d]?.mau ?? '--p-cam'})`
    if (giamChuyenDong()) { const d = phat.findIndex((n) => n > 0); nhay(l, may.current, den, mauCua(d)); return }
    const tran = yeu ? TRAN_YEU : TRAN
    let conCuaEm = doiEm >= 0 ? Math.max(0, cuaEm - cu.cuaEm) : 0
    const nut = conCuaEm > 0 ? nguon?.(l) ?? null : null
    let thu = 0
    for (let d = 0; d < 4; d++) for (let n = 0; n < phat[d]!; n++) {
      if (may.current.song >= tran) { nhay(l, may.current, den, mauCua(d)); continue }
      const cua = d === doiEm && conCuaEm > 0 && !!nut
      if (cua) conCuaEm--
      const tu = cua ? nut! : { x: W * (0.06 + Math.random() * 0.88), y: H + 24 }
      bay(l, may.current, tu, den, mauCua(d), thu * 70, yeu, cua)
      thu++
    }
  }) // chạy sau MỖI lần vẽ: số không đổi ⇒ `tinhPhat` toàn 0, thoát ngay (rẻ hơn giữ mảng phụ thuộc cho `dem` — mảng mới mỗi bản xem)
  return <div ref={lop} data-tinh-the="" aria-hidden="true" style={{ position: coDinh ? 'fixed' : 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: coDinh ? 1 : 6, contain: 'strict' }} />
}
