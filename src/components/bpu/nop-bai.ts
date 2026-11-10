// BÌNH PHẢN ỨNG — HIỆU ỨNG EM NỘP BÀI TRÊN BẢNG (thầy 10/11 «hiệu ứng nộp bài trên bảng chưa đẹp»; thay thẻ tên bay của 09/11).
// Em gửi ⇒ (1) ô tên em trong dải đội sáng lên + dấu tích bật nảy; (2) một TIA LỬA mảnh màu đội (vệt sáng quay theo hướng bay + một đốm than) bay theo đường cong từ ô tên vào
// ống nghiệm của đội, rơi xuống đúng mặt chất lỏng; (3) chạm ⇒ mặt chất lỏng gợn một vòng loang theo lòng ống + ngọn lửa bùng nhẹ; (4) số «x/N em đã gửi» nảy, ô tiến độ vừa
// sáng loé một nhịp. Nhiều em cùng gửi ⇒ tối đa 3 tia bay cùng lúc, cách nhau 110 ms; hàng chờ dài (> 6) ⇒ em sau chỉ sáng ô + tích (không bay), mỗi ống
// gợn tối đa một nhịp / 260 ms, số nảy tối đa một nhịp / 260 ms. TẾ NHỊ: em nào cũng y hệt (kể cả em báo «chưa biết làm») — không lộ đúng / sai.
// Chỉ transform / opacity (WAAPI, chạy trên luồng hợp thành); máy yếu (html.may-yeu) / giảm chuyển động ⇒ bản gọn: ô sáng + tích tĩnh, không bay, không nảy.
import { useLayoutEffect, useRef, type RefObject } from 'react'
import type { ViewBang } from '../../lib/bpu/phong'
import './bpu-nop.css'

type Em = ViewBang['ds'][number]
/** Em VỪA gửi giữa hai view liền nhau của cùng một lượt đang làm (so `daGui` — không dựa thứ tự mảng); chỉ em có mặt. */
export function emVuaGui(cu: ViewBang | null, moi: ViewBang | null): Em[] {
  const l1 = cu?.luot, l2 = moi?.luot
  if (!moi || !l1 || !l2 || l2.pha !== 'tra-loi' || l1.so !== l2.so || l1.batDau !== l2.batDau) return []
  const da = new Set(l1.daGui)
  return l2.daGui.filter((s) => !da.has(s)).map((s) => moi.ds.find((e) => e.sbd === s)).filter((e): e is Em => !!e?.vao)
}

const BAY_TOI_DA = 3, CACH_MS = 110, HANG_DAI = 6, NHIP_MS = 260, BAY_MS = 780
const DUOI = [[70, 1, 0.65]] as const // [trễ ms, cỡ, độ sáng] đốm than theo sau
const thoat = (s: string): string => (typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'))
const coAnimate = (el: Element | null | undefined): el is HTMLElement => !!el && typeof (el as HTMLElement).animate === 'function'
type Diem = { x: number; y: number }
/** a: ô tên · c: điểm uốn trên miệng ống · b: giữa mặt chất lỏng · w: bề ngang lòng ống ngay mặt chất lỏng (đáy tròn ⇒ hẹp dần). */
type Tia = { doi: number; mau: string; a: Diem; b: Diem; c: Diem; w: number }
/** Hình đã đo của lượt đang chạy: tâm ô tên theo em, miệng / mặt chất lỏng / bề ngang lòng ống theo đội (trong một lượt đang làm, ống và dải tên đứng yên). */
type Hinh = { khoa: string; o: Map<string, Diem>; ong: Map<number, { mau: string; m: Diem; b: Diem; w: number }> }
type Hang = { cho: Tia[]; dang: number; lucOng: Map<number, number>; lucSo: number; doi: Em[]; hen: number; khoa: string; hinh: Hinh | null }
const hangCua = new WeakMap<HTMLElement, Hang>()

/** Hình chữ nhật trên sân 1920×1080 (sân co bằng transform ⇒ chia tỉ lệ). */
function khung(r0: DOMRect, el: Element): { x: number; y: number; w: number; t: number; d: number } {
  const k = r0.width / 1920 || 1, r = el.getBoundingClientRect()
  return { x: (r.left + r.width / 2 - r0.left) / k, y: (r.top + r.height / 2 - r0.top) / k, w: r.width / k, t: (r.top - r0.top) / k, d: (r.bottom - r0.top) / k }
}
/** ĐO MỘT LẦN cho cả lượt (mọi ô tên + mọi ống, một lần tính bố cục); các lần em gửi sau dùng lại ⇒ gửi dồn không ép trình duyệt tính bố cục mỗi khung. */
function doHinh(san: HTMLElement, khoa: string): Hinh {
  const r0 = san.getBoundingClientRect(), hinh: Hinh = { khoa, o: new Map(), ong: new Map() }
  san.querySelectorAll<HTMLElement>('.bb-tl-o[data-sbd]').forEach((el) => hinh.o.set(el.dataset.sbd!, khung(r0, el)))
  san.querySelectorAll<HTMLElement>('.bb-tl-cot[data-doi]').forEach((cot) => {
    const ong = cot.querySelector('.bb-tl-ong'), day = cot.querySelector('.bb-tl-day'), mieng = cot.querySelector('.bb-tl-mieng')
    if (!ong || !day || !mieng) return
    // Đích: giữa mặt chất lỏng (ống rỗng ⇒ không thấp hơn miệng + 30); bề ngang lòng ống tại đó (đáy tròn ⇒ hẹp dần).
    const m = khung(r0, mieng), g = khung(r0, ong), y = Math.min(g.d - 14, Math.max(m.y + 30, khung(r0, day).t + 4))
    const r = g.w / 2, tam = g.d - r, nua = y > tam ? Math.sqrt(Math.max(0, r * r - (y - tam) ** 2)) : r
    hinh.ong.set(Number(cot.dataset.doi), { mau: cot.style.getPropertyValue('--doi'), m, b: { x: m.x, y }, w: Math.max(40, nua * 1.7) })
  })
  return hinh
}
/** Đường bay của một em: ô tên → vồng trên miệng ống → rơi thẳng xuống giữa mặt chất lỏng. */
function duongTia(hinh: Hinh, e: Em): Tia | null {
  const a = hinh.o.get(e.sbd), t = hinh.ong.get(e.doi)
  return a && t ? { doi: e.doi, mau: t.mau, a, b: t.b, c: { x: t.m.x + (a.x - t.m.x) * 0.12, y: Math.max(40, Math.min(a.y, t.m.y) - 200) }, w: t.w } : null
}
/** Khung hình WAAPI dọc đường cong bậc hai a → c → b; thời gian dãn hai đầu (vào êm, ra êm); mờ vào 10 %, mờ ra 16 % cuối. `xoay` ⇒ vệt quay theo hướng bay. */
export function khungCong(a: Diem, c: Diem, b: Diem, co = 1, sang = 1, xoay = false, n = 10): Keyframe[] {
  const ra: Keyframe[] = []
  let goc0 = 0
  for (let i = 0; i <= n; i++) {
    const s = i / n, t = s < 0.5 ? 2 * s * s : 1 - 2 * (1 - s) * (1 - s), u = 1 - t
    const x = u * u * a.x + 2 * u * t * c.x + t * t * b.x, y = u * u * a.y + 2 * u * t * c.y + t * t * b.y
    // Góc tiếp tuyến, nối liền (không nhảy 360°) ⇒ nội suy giữa hai khung luôn quay đường ngắn.
    let goc = (Math.atan2(2 * u * (c.y - a.y) + 2 * t * (b.y - c.y), 2 * u * (c.x - a.x) + 2 * t * (b.x - c.x)) * 180) / Math.PI
    if (i) while (goc - goc0 > 180) goc -= 360
    if (i) while (goc - goc0 < -180) goc += 360
    goc0 = goc
    ra.push({ offset: s, transform: `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)${xoay ? ` rotate(${goc.toFixed(1)}deg)` : ''} scale(${(co * (1 - 0.3 * s)).toFixed(3)})`, opacity: (sang * Math.min(1, s / 0.1, (1 - s) / 0.16)).toFixed(3) })
  }
  return ra
}

function lop(san: HTMLElement): HTMLElement {
  let el = san.querySelector<HTMLElement>('.bb-tl-bay-lop')
  if (!el) { el = document.createElement('div'); el.className = 'bb-tl-bay-lop'; el.setAttribute('aria-hidden', 'true'); san.appendChild(el) }
  return el
}
function hat(l: HTMLElement, lopCss: string, mau: string): HTMLElement { const el = document.createElement('i'); el.className = lopCss; el.style.setProperty('--doi', mau); l.appendChild(el); return el }

/** Tia chạm mặt chất lỏng ⇒ vòng gợn loang theo lòng ống + quầng sáng ở chân ngọn lửa + ngọn lửa bùng nhẹ (mỗi ống tối đa một nhịp / 260 ms). */
function chamMat(san: HTMLElement, h: Hang, t: Tia): void {
  const nay = performance.now()
  if (nay - (h.lucOng.get(t.doi) ?? -1e9) < NHIP_MS) return
  h.lucOng.set(t.doi, nay)
  const l = lop(san), o = `translate(${t.b.x.toFixed(1)}px, ${t.b.y.toFixed(1)}px)`
  const vong = hat(l, 'bb-tl-gon-tia', t.mau), bung = hat(l, 'bb-tl-bung', t.mau)
  vong.style.width = `${Math.round(t.w)}px`; vong.style.marginLeft = `${-Math.round(t.w / 2)}px`
  vong.animate([{ transform: `${o} scale(0.3)`, opacity: 0.95 }, { transform: `${o} scale(1)`, opacity: 0 }], { duration: 720, easing: 'cubic-bezier(.2, .7, .3, 1)' }).onfinish = () => vong.remove()
  bung.animate([{ transform: `${o} scale(0.5)`, opacity: 0 }, { transform: `${o} scale(1)`, opacity: 0.9, offset: 0.25 }, { transform: `${o} scale(1.3)`, opacity: 0 }], { duration: 620, easing: 'ease-out' }).onfinish = () => bung.remove()
  const cot = san.querySelector(`.bb-tl-cot[data-doi="${t.doi}"]`)
  const sang = cot?.querySelector('.bb-tl-sang'), lua = cot?.querySelector('.bb-tl-nhun')
  if (coAnimate(sang)) sang.animate([{ opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }], { duration: 600, easing: 'ease-out' })
  if (coAnimate(lua)) lua.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08, 1.16)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 480, easing: 'cubic-bezier(.3, .8, .4, 1)' })
}

/** Phóng tia kế trong hàng (toạ độ đã đọc sẵn lúc xếp ⇒ không ép trình duyệt tính bố cục giữa các khung). */
function bay(san: HTMLElement, h: Hang): void {
  if (h.dang >= BAY_TOI_DA || !h.cho.length) return
  const t = h.cho.shift()!, { a, b, c, mau } = t
  h.dang++
  const l = lop(san), dau = hat(l, 'bb-tl-tia', mau)
  const an = dau.animate(khungCong(a, c, b, 1, 1, true), { duration: BAY_MS, easing: 'linear', fill: 'forwards' })
  const duoi = DUOI.map(([tre, co, sang]) => { const el = hat(l, 'bb-tl-than', mau); el.animate(khungCong(a, c, b, co, sang), { duration: BAY_MS, delay: tre, easing: 'linear', fill: 'both' }).onfinish = () => el.remove(); return el })
  const xong = () => { h.dang = Math.max(0, h.dang - 1); setTimeout(() => bay(san, h), 0) }
  an.onfinish = () => { dau.remove(); chamMat(san, h, t); xong() }
  an.oncancel = () => { dau.remove(); duoi.forEach((el) => el.remove()); xong() }
  setTimeout(() => bay(san, h), CACH_MS)
}

/** Các em vừa gửi ⇒ ô sáng + tích nảy NGAY (chỉ ghi lớp, trước khi vẽ); số nảy + ô tiến độ loé + tia lửa gom vào MỘT khung kế (rAF): bao nhiêu tin phòng về
 *  trong một khung cũng chỉ một lần đọc bố cục (lúc bố cục đang sạch, sau khi vẽ) và một nhịp số nảy. */
export function nopBai(san: HTMLElement, ds: Em[], yeu: boolean, khoa = ''): void {
  for (const e of ds) {
    const o = san.querySelector(`.bb-tl-o[data-sbd="${thoat(e.sbd)}"]`)
    if (!o) continue
    o.classList.add('vua', 'nay')
    setTimeout(() => o.classList.remove('vua', 'nay'), 1200)
  }
  if (yeu || !coAnimate(san)) return
  let h = hangCua.get(san)
  if (!h) { h = { cho: [], dang: 0, lucOng: new Map(), lucSo: -1e9, doi: [], hen: 0, khoa: '', hinh: null }; hangCua.set(san, h) }
  h.doi.push(...ds); h.khoa = `${khoa}|${innerWidth}x${innerHeight}`
  if (!h.hen) h.hen = requestAnimationFrame(() => phat(san, h!))
}
function phat(san: HTMLElement, h: Hang): void {
  const ds = h.doi
  h.doi = []; h.hen = 0
  if (!san.isConnected) return
  const can = ds.slice(0, Math.max(0, HANG_DAI - h.cho.length))
  if (can.length && (h.hinh?.khoa !== h.khoa || can.some((e) => !h.hinh!.o.has(e.sbd)))) h.hinh = doHinh(san, h.khoa)
  const tia = can.map((e) => duongTia(h.hinh!, e)).filter((x): x is Tia => !!x)
  const nay = performance.now()
  if (nay - h.lucSo >= NHIP_MS) {
    h.lucSo = nay
    const so = san.querySelector('.bb-tl-dem .so b')
    if (coAnimate(so)) so.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.3, .8, .4, 1)' })
    const sang = [...san.querySelectorAll('.bb-tl-dem .o i.c')].slice(-Math.min(ds.length, 4))
    sang.forEach((el, i) => { if (coAnimate(el)) el.animate([{ opacity: 0.35, transform: 'scaleY(1.7)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 40, easing: 'cubic-bezier(.2, .8, .3, 1)', fill: 'backwards' }) })
  }
  h.cho.push(...tia)
  bay(san, h)
}

/** Gắn vào bảng: so view THẬT liền nhau (không theo lượt chờ). `dung` = đang chờ lượt mới (màn đua vẽ lượt chờ) / bảng thu vào tờ ⇒ không chạy. */
export function useNopBai(san: RefObject<HTMLElement | null>, v: ViewBang | null, an: RefObject<boolean>, dung: boolean, yeu: boolean): void {
  const truoc = useRef<ViewBang | null>(null)
  // Trước khi vẽ (useLayoutEffect): tích nảy từ cỡ 0 ngay khung đầu, không lóe một khung tích đứng yên.
  useLayoutEffect(() => {
    const cu = truoc.current
    truoc.current = v
    const el = san.current
    if (!el || an.current || dung) return
    const ds = emVuaGui(cu, v)
    if (ds.length) nopBai(el, ds, yeu, `${v?.luot?.so}:${v?.luot?.batDau}:${v?.ds.filter((e) => e.vao).length}`)
  }, [v, san, an, dung, yeu])
}
