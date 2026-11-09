// BÌNH PHẢN ỨNG — ĐUA TOP «THÁP LỬA» (thầy chốt 09/11 «chốt bản ống nghiệm», bản vẽ docs/ban-ve-bpu-dua-top-0911, phương án A).
// Phần THUẦN (xếp hạng đội / em, bảng vàng, lên hạng, chuỗi đúng dài nhất, thang ống) + hook nhớ «trước khi mở đáp án» + bộ BAY (tên em vừa gửi,
// nhãn ±kJ «bienDong») vào miệng ống nghiệm đội. Bay chỉ transform / opacity (WAAPI); máy yếu / giảm chuyển động / jsdom ⇒ không bay, hiện tĩnh.
import { useState } from 'react'
import type { ViewBang } from '../../lib/bpu/phong'

export type Em = ViewBang['ds'][number]
/** Biến động kJ (hợp đồng phòng 09/11, nhánh luật kJ): 30 mục mới nhất, id tăng dần. Phòng cũ chưa có ⇒ rỗng. */
export interface BienDong { id: number; sbd: string | null; doi: number; kjEm: number; kjDoi: number; lyDo: string; luc: number }
export const layBienDong = (v: ViewBang | null): BienDong[] => ((v as { bienDong?: BienDong[] } | null)?.bienDong ?? []).filter((b) => b && typeof b.id === 'number')

/** Các đội đang chơi (2 khi lớp dưới 12 em, không thì 4). */
export const doiCua = (v: ViewBang | null): number[] => (v?.soDoi === 2 ? [0, 1] : [0, 1, 2, 3])
/** kJ đội = tổng kJ em trong đội + thưởng đội (vào lớp, đủ quân, lên bảng Đạt). */
export const kjDoi = (v: ViewBang, d: number): number => v.ds.reduce((s, e) => s + (e.doi === d ? e.kj : 0), 0) + (v.doiThuong[d] ?? 0)
/** Thứ tự đội theo TỔNG kJ (hoà ⇒ trung bình mỗi bạn có mặt cao hơn ⇒ số đội nhỏ hơn). */
export function thuTuDoi(v: ViewBang): number[] {
  return doiCua(v).map((d) => { const coMat = v.ds.filter((e) => e.doi === d && e.vao).length, tong = kjDoi(v, d); return { d, tong, tb: coMat ? tong / coMat : tong } })
    .sort((a, b) => b.tong - a.tong || b.tb - a.tb || a.d - b.d).map((x) => x.d)
}
/** Đội dẫn đầu theo một dãy kJ (chỉ số trong `doi`); hoà ⇒ đội số nhỏ. */
export const dauTheo = (kj: number[], doi: number[]): number => doi.reduce((t, d, i) => ((kj[i] ?? 0) > (kj[doi.indexOf(t)] ?? 0) ? d : t), doi[0] ?? 0)
/** BẢNG VÀNG kJ cả buổi: em có mặt, nhiều kJ trước (như `xepEm` của phòng). */
export const xepVang = (v: ViewBang): Em[] => v.ds.filter((e) => e.vao).sort((a, b) => b.kj - a.kj || a.ten.localeCompare(b.ten))
export const hangEm = (v: ViewBang): Map<string, number> => new Map(xepVang(v).map((e, i) => [e.sbd, i]))
/** Lên hạng (chỉ mũi tên LÊN — tế nhị: không ai «tụt hạng» trước lớp). */
export function lenHang(truoc: Map<string, number>, sau: Map<string, number>): Map<string, number> {
  const ra = new Map<string, number>()
  for (const [s, h] of sau) { const h0 = truoc.get(s); if (h0 != null && h0 > h) ra.set(s, h0 - h) }
  return ra
}
/** Chuỗi đúng dài nhất (≥ 3) trong các em có mặt; bằng nhau ⇒ em nhiều kJ hơn. */
export function chuoiDaiNhat(v: ViewBang): Em | null {
  const ds = v.ds.filter((e) => e.vao && e.chuoi >= 3).sort((a, b) => b.chuoi - a.chuoi || b.kj - a.kj)
  return ds[0] ?? null
}
/** Thang ống: đội cao nhất ≤ ~65 % ống (chừa chỗ ngọn lửa trên mặt chất lỏng, không chạm thanh trên); bậc 500 kJ ⇒ ống không nhảy thang mỗi lần cộng. */
export const thangOng = (kj: number[]): number => Math.max(500, Math.ceil((Math.max(0, ...kj) * 1.55) / 500) * 500)
export const soKj = (n: number): string => Math.round(n).toLocaleString('vi-VN')
/** Đáp án gọn: Đúng–sai «Đ · S · Đ · S» (phòng lưu D/S); Trả lời ngắn dấu phẩy thập phân. */
export const dapAnDs = (dung: string): string => dung.toUpperCase().split('').slice(0, 4).map((c) => (c === 'D' ? 'Đ' : c === 'S' ? 'S' : c)).join(' · ')
export const dapSo = (dung: string): string => String(dung ?? '').trim().replace('.', ',')

/** NHỚ «TRƯỚC KHI MỞ ĐÁP ÁN» (đặt ở bảng — sống qua các lượt): chụp kJ đội + thứ hạng em ở MỌI view chưa mở; view `mo` đầu tiên của lượt ⇒
 *  `truoc` (vạch nét đứt, «+kJ lượt này») và mũi tên lên hạng (giữ tới lần mở đáp án sau). Đổi số đội giữa lượt ⇒ bỏ «trước». Tải lại trang ⇒ chờ lượt sau. */
type ChupDua = { so: number; soDoi: number; kj: number[]; hang: Map<string, number> }
type MoDua = { so: number; truoc: number[] | null; len: Map<string, number> }
/** Bước thuần của useDuaTop: view mới ⇒ ảnh chụp «trước» mới + kết quả lần mở đáp án (có test). */
export function buocDuaTop(v: ViewBang | null, chup: ChupDua | null, mo: MoDua): { chup: ChupDua | null; mo: MoDua } {
  const l = v?.luot
  if (!v || !l) return { chup, mo }
  if (l.pha !== 'mo') return { chup: { so: l.so, soDoi: v.soDoi, kj: doiCua(v).map((d) => kjDoi(v, d)), hang: hangEm(v) }, mo }
  if (mo.so === l.so) return { chup, mo }
  const c = chup && chup.so === l.so && chup.soDoi === v.soDoi ? chup : null
  return { chup, mo: { so: l.so, truoc: c ? c.kj : null, len: c ? lenHang(c.hang, hangEm(v)) : new Map() } }
}
export function useDuaTop(v: ViewBang | null): { truoc: number[] | null; len: Map<string, number> } {
  // «Lưu thông tin từ lần vẽ trước» theo mẫu React: view đổi ⇒ tính bước mới ngay trong lúc vẽ rồi ghi vào state (không đọc ref khi vẽ).
  const [nho, setNho] = useState<{ v: ViewBang | null; chup: ChupDua | null; mo: MoDua }>({ v: null, chup: null, mo: { so: -1, truoc: null, len: new Map() } })
  let cur = nho
  if (nho.v !== v) { cur = { v, ...buocDuaTop(v, nho.chup, nho.mo) }; setNho(cur) }
  const l = v?.luot
  return { truoc: l?.pha === 'mo' && cur.mo.so === l.so ? cur.mo.truoc : null, len: cur.mo.len }
}

// ── BAY VÀO ỐNG ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
type Viec = { loai: 'ten' | 'kj'; tu: Element | null; doi: number; chu: string; tru?: boolean; lyDo?: string; mau: string }
const hang: Record<'ten' | 'kj', { cho: Viec[]; dang: number }> = { ten: { cho: [], dang: 0 }, kj: { cho: [], dang: 0 } }
const TOI_DA = { ten: 3, kj: 4 } as const
const thoat = (s: string): string => (typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'))
const coAnimate = (el: Element | null | undefined): el is HTMLElement => !!el && typeof (el as HTMLElement).animate === 'function'

/** Toạ độ tâm một phần tử trên sân khấu 1920×1080 (sân đang co bằng transform ⇒ chia tỉ lệ). */
function viTri(san: HTMLElement, el: Element | null): { x: number; y: number } {
  const r0 = san.getBoundingClientRect(), k = r0.width / 1920 || 1
  if (!el) return { x: 960, y: 520 }
  const r = el.getBoundingClientRect()
  return { x: (r.left + r.width / 2 - r0.left) / k, y: (r.top + r.height / 2 - r0.top) / k }
}
const cotDoi = (san: HTMLElement, d: number) => san.querySelector<HTMLElement>(`.bb-tl-cot[data-doi="${d}"]`)

/** Dòng lý do nhỏ dưới ống (~2,5 s); cũng là cách hiện TĨNH khi không bay (máy yếu). */
function hienLyDo(san: HTMLElement, d: number, chu: string, tru: boolean): void {
  const cot = cotDoi(san, d)
  if (!cot) return
  cot.querySelector('.bb-tl-ly')?.remove()
  const el = document.createElement('div')
  el.className = `bb-tl-ly${tru ? ' tru' : ''}`
  el.textContent = chu
  cot.appendChild(el)
  setTimeout(() => el.remove(), 2600)
}

/** Ống tới nơi: cộng ⇒ lóe sáng + gợn; trừ ⇒ rung nhẹ + tối thoáng. Ngọn lửa nhún một nhịp. */
function chamOng(san: HTMLElement, d: number, tru: boolean): void {
  const cot = cotDoi(san, d)
  const sang = cot?.querySelector('.bb-tl-sang'), gon = cot?.querySelector('.bb-tl-gon'), ong = cot?.querySelector('.bb-tl-ong'), lua = cot?.querySelector('.bb-tl-nhun')
  if (tru) {
    if (coAnimate(ong)) ong.animate([{ transform: 'none' }, { transform: 'translateX(-7px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-in-out' })
    const toi = cot?.querySelector('.bb-tl-toi')
    if (coAnimate(toi)) toi.animate([{ opacity: 0 }, { opacity: 0.55 }, { opacity: 0 }], { duration: 700 })
    return
  }
  if (coAnimate(sang)) sang.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 700, easing: 'ease-out' })
  if (coAnimate(gon)) gon.animate([{ opacity: 0.9, transform: 'scale(0.4)' }, { opacity: 0, transform: 'scale(1.6)' }], { duration: 700, easing: 'ease-out' })
  if (coAnimate(lua)) lua.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'ease-out' })
}

function chay(san: HTMLElement, loai: 'ten' | 'kj'): void {
  const h = hang[loai]
  if (h.dang >= TOI_DA[loai] || !h.cho.length) return
  const vc = h.cho.shift()!
  h.dang++
  const xong = () => { h.dang = Math.max(0, h.dang - 1); setTimeout(() => chay(san, loai), 120) }
  const cot = cotDoi(san, vc.doi), mieng = cot?.querySelector('.bb-tl-mieng') ?? null
  if (!cot || !mieng) { xong(); return }
  const a = viTri(san, vc.tu), b = viTri(san, mieng)
  let lop = san.querySelector<HTMLElement>('.bb-tl-bay-lop')
  if (!lop) { lop = document.createElement('div'); lop.className = 'bb-tl-bay-lop'; lop.setAttribute('aria-hidden', 'true'); san.appendChild(lop) }
  const el = document.createElement('div')
  el.className = `bb-tl-bay ${vc.loai}${vc.tru ? ' tru' : ''}`
  el.style.setProperty('--doi', vc.mau)
  el.textContent = vc.chu
  lop.appendChild(el)
  // Đường cong: vồng lên giữa đường (điểm giữa cao hơn cả hai đầu, không chạm thanh trên), tới miệng ống thu nhỏ 0,6 và mờ hẳn.
  const mx = (a.x + b.x) / 2, my = Math.max(150, Math.min(a.y, b.y) - 70)
  const t = (x: number, y: number, s: number) => `translate(${Math.round(x)}px, ${Math.round(y)}px) translate(-50%, -50%) scale(${s})`
  const an = el.animate([
    { transform: t(a.x, a.y, 1), opacity: 0 },
    { transform: t(a.x, a.y - 16, 1.05), opacity: 1, offset: 0.12 },
    { transform: t(mx, my, 0.9), opacity: 1, offset: 0.55 },
    { transform: t(b.x, b.y, 0.6), opacity: 0 },
  ], { duration: vc.loai === 'kj' ? 900 : 700, easing: 'cubic-bezier(.45, 0, .3, 1)', fill: 'forwards' })
  const den = () => { el.remove(); chamOng(san, vc.doi, !!vc.tru); if (vc.lyDo) hienLyDo(san, vc.doi, vc.lyDo, !!vc.tru); xong() }
  an.onfinish = den
  an.oncancel = () => { el.remove(); xong() }
  setTimeout(() => chay(san, loai), 120) // thẻ sau cách 120 ms (trong giới hạn bay cùng lúc)
}

/** Xếp một việc bay. Tên em: hàng chờ dài (> 6) ⇒ chỉ bừng sáng ở dải đáy, không bay. Nhãn kJ: XẾP HÀNG hết (mở đáp án ⇒ mỗi em một mục,
 *  tối đa 4 nhãn bay cùng lúc); hàng quá dài (> 40, nối lại sau mất mạng) ⇒ hiện tĩnh dưới ống. */
function xep(san: HTMLElement, vc: Viec, yeu: boolean): void {
  if (yeu || !coAnimate(san)) { if (vc.loai === 'kj') hienLyDo(san, vc.doi, vc.lyDo ? `${vc.chu} · ${vc.lyDo}` : vc.chu, !!vc.tru); return }
  const h = hang[vc.loai]
  if (h.cho.length > (vc.loai === 'ten' ? 6 : 40)) { if (vc.loai === 'kj') hienLyDo(san, vc.doi, vc.lyDo ? `${vc.chu} · ${vc.lyDo}` : vc.chu, !!vc.tru); return }
  h.cho.push(vc)
  chay(san, vc.loai)
}

/** Em vừa gửi ⇒ thẻ tên bừng sáng ở dải đáy (~1 s) + thẻ nhỏ bay vào miệng ống đội + bộ đếm nảy số. */
export function bayTen(san: HTMLElement, e: Em, chu: string, mau: string, yeu: boolean): void {
  const o = san.querySelector(`.bb-tl-o[data-sbd="${thoat(e.sbd)}"]`)
  if (o) { o.classList.add('vua'); setTimeout(() => o.classList.remove('vua'), 1100) }
  const dem = san.querySelector('.bb-tl-dem .so b')
  if (!yeu && coAnimate(dem)) dem.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { duration: 280, easing: 'ease-out' })
  xep(san, { loai: 'ten', tu: o, doi: e.doi, chu, mau }, yeu)
}

/** Biến động kJ mới ⇒ nhãn «+100 kJ» / «−50 kJ» bay từ ô tên em (không có em ⇒ giữa bảng) vào miệng ống đội, lý do hiện dưới ống. */
export function bayKj(san: HTMLElement, b: BienDong, mau: string, yeu: boolean): void {
  const tong = Math.round((b.kjEm ?? 0) + (b.kjDoi ?? 0))
  if (!tong) return
  const tru = tong < 0
  // TẾ NHỊ TRƯỚC LỚP: chỉ bay TỪ Ô TÊN em khi là lời khen (đúng / giải đúng / đoán đúng / vào lớp). Mục khác («chưa biết làm», chỉ có năng lượng hoạt hoá
  // — tức em chưa đúng, bị trừ…) bay từ giữa bảng vào ống đội: đội vẫn thấy kJ, cả lớp không suy ra được em nào.
  const tonVinh = tong > 0 && /^(đúng|giải đúng|đoán đúng|vào lớp)/i.test(String(b.lyDo ?? '').trim())
  const tu = b.sbd && tonVinh ? san.querySelector(`.bb-tl-o[data-sbd="${thoat(b.sbd)}"]`) : null
  xep(san, { loai: 'kj', tu, doi: b.doi, chu: `${tru ? '−' : '+'}${soKj(Math.abs(tong))} kJ`, tru, lyDo: b.lyDo, mau }, yeu)
}

/** BỐ CỤC THÁP LỬA (sân 1920×1080): dải tên đáy theo số em mỗi đội (≤ 4 em: 2 cột; lớp đông ~35 em: 3 cột × 3 hàng), vùng tháp + cột phải lấp phần
 *  còn lại. Không toàn màn hình ⇒ đáy dải chừa thanh tác vụ Windows (thầy 07/11). */
export function boCucThap(v: ViewBang, toanMan: boolean) {
  const doi = doiCua(v), hai = doi.length === 2
  const soEm = Math.max(1, ...doi.map((d) => v.ds.filter((e) => e.vao && e.doi === d).length))
  const cot = hai ? (soEm <= 4 ? 2 : soEm <= 6 ? 3 : 4) : soEm <= 4 ? 2 : 3
  const soHang = Math.max(1, Math.ceil(soEm / cot)), caoO = soHang <= 2 ? 60 : soHang === 3 ? 44 : 36
  const caoDai = 26 + 40 + soHang * caoO + (soHang - 1) * 8
  const dayDai = toanMan ? 1052 : 1008, topDai = dayDai - caoDai
  const caoVung = topDai - 18 - 112, caoOng = caoVung - 56 - 184
  return { doi, hai, cot, soHang, caoO, coChu: caoO >= 60 ? 27 : caoO >= 44 ? 24 : 20, topDai, caoDai, caoVung, caoOng, x: hai ? [302, 907] : [151, 453, 756, 1058] }
}
