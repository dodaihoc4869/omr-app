// BÌNH PHẢN ỨNG — HIỆU ỨNG EM NỘP BÀI TRÊN BẢNG ĐUA TOP (thầy 10/11 «tia lửa chạy xoắn ốc từ dưới lên trên của ống nghiệm rồi thả từ trên rơi xuống ống nghiệm,
// khi chạm nước trong ống nghiệm phản ứng đẹp mắt»; thay tia bay cong cùng ngày). Mỗi em gửi:
//   (1) ô tên em trong dải đội sáng + dấu tích nảy (lớp CSS, ngay khung đầu); số «x/N em đã gửi» nảy, ô tiến độ vừa sáng loé một nhịp;
//   (2) một tia lửa màu đội hiện ở CHÓP ĐÁY ống của đội, chạy XOẮN ỐC quanh thân ống (theo đúng đáy tròn) lên tới miệng: vòng phía trước sáng, to;
//       vòng phía sau mờ, nhỏ, và khuất hẳn sau chất lỏng; đuôi mảnh tính theo đường (không theo lịch sử khung ⇒ CPU chậm vẫn mượt);
//   (3) tới miệng: nhích lên, loé sáng + ánh viền miệng ống, rồi RƠI thẳng xuống lòng ống có gia tốc;
//   (4) chạm mặt chất lỏng: giọt bắn tung nhẹ · gợn sóng lan theo lòng ống · bọt khí sủi lên ba nhịp · loé màu đội trong lòng chất lỏng · ngọn lửa bùng rồi dịu.
// Nhiều em cùng gửi ⇒ mỗi ống một hàng, hai tia cùng ống cách nhau 320 ms, các ống chạy song song; tia nào sẽ chạm nước trễ quá 4 s so với lúc em gửi ⇒
// GỘP vào tia đang chờ của ống đó (phản ứng đậm hơn một chút, có trần). TẾ NHỊ: em nào cũng y hệt (kể cả em báo «chưa biết làm») — không lộ đúng / sai.
// HIỆU NĂNG: MỘT canvas phủ vùng ống (bộ đệm theo tỉ lệ sân × dpr), MỘT vòng requestAnimationFrame chung cho mọi tia, chỉ chạy khi còn tia rồi tự tắt + ẩn canvas;
// không re-render React; đo bố cục một lần mỗi lượt (đổi khổ / số em mới đo lại); quầng sáng là ảnh vẽ sẵn (drawImage), không shadowBlur.
// Máy yếu (html.may-yeu) / giảm chuyển động ⇒ bản gọn: chấm sáng rơi thẳng từ miệng ống + gợn một nhịp (không xoắn, không bọt, không bùng lửa).
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

// ── Nhịp (ms) và hình (px sân 1920×1080) ──
export const XOAN_MS = 1250, DUNG_MS = 170, CACH_MS = 320, TRE_MS = 4000
const VONG = 2.25, NGHIENG = 0.14, G = 2800, PHAN_UNG_MS = 1500, GON_PU_MS = 650, NHIP_MS = 260, LUA_MS = 450, DUOI = 14, BUOC_DUOI = 0.026
const kep = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x))
const de = (u: number) => 0.5 - 0.5 * Math.cos(Math.PI * kep(u)) // vào êm, ra êm
const coAnimate = (el: Element | null | undefined): el is HTMLElement => !!el && typeof (el as HTMLElement).animate === 'function'
const thoat = (s: string): string => (typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'))

/** Ống đã đo: tâm ngang, mép trên, đáy (chóp đáy tròn), nửa bề ngang (= bán kính đáy tròn, CSS --ong-r), mặt chất lỏng. */
export type Ong = { x: number; tren: number; day: number; r: number; mat: number }
/** Nửa bề ngang lòng ống ở độ cao y: thân thẳng ⇒ r; đáy tròn ⇒ hẹp dần về chóp. */
export const nuaRong = (o: Ong, y: number): number => { const tam = o.day - o.r; return y <= tam ? o.r : Math.sqrt(Math.max(0, o.r * o.r - (y - tam) ** 2)) }
/** Điểm trên đường xoắn ở tiến độ p ∈ [0, 1]: p = 0 ở chóp đáy, p = 1 ở giữa PHÍA TRƯỚC ngay dưới miệng. z = +1 phía trước, −1 phía sau;
 *  quỹ đạo ôm sát thân ống (bán kính = lòng ống tại y + 10), nghiêng nhẹ như nhìn từ trên xuống (phía trước thấp hơn phía sau). */
export function diemXoan(o: Ong, p: number): { x: number; y: number; z: number } {
  const y = o.day - p * (o.day - o.tren - 14), R = nuaRong(o, y) + 10 * Math.min(1, (o.day - y) / 24), g = 2 * Math.PI * VONG * (p - 1), z = Math.cos(g)
  return { x: o.x + R * Math.sin(g), y: y + z * R * NGHIENG, z }
}
/** Thời gian rơi (ms) từ ngay trên miệng xuống mặt chất lỏng. */
export const roiMs = (o: Ong): number => Math.sqrt((2 * Math.max(0, o.mat - (o.tren - 12))) / G) * 1000
/** Xếp một tia vào hàng của ống: bắt đầu sau tia trước ít nhất CACH_MS; nếu như thế thì chạm nước trễ quá TRE_MS so với lúc em gửi ⇒ null (gộp). */
export function xepHang(cuoi: number, nay: number, cham: number): number | null {
  const bd = Math.max(nay, cuoi + CACH_MS)
  return bd + cham - nay <= TRE_MS ? bd : null
}

type Rgb = readonly [number, number, number]
type OngDo = Ong & { doi: number; mau: Rgb; nhat: Rgb; giay: Rgb; quang: HTMLCanvasElement | null; long: HTMLCanvasElement | null }
type Tia = { o: OngDo; t0: number; cham: number; gon: boolean; gop: number; lua: boolean; sc: number; giot: number[][]; bot: number[][] }
type Hinh = { khoa: string; tl: Element; ong: Map<number, OngDo>; x: number; y: number; w: number; h: number; k: number }
type Hang = { tia: Tia[]; cuoi: Map<number, number>; lucLua: Map<number, number>; lucSo: number; doi: Em[]; hen: number; raf: number; khoa: string; luot: string; yeu: boolean
  hinh: Hinh | null; cv: HTMLCanvasElement | null; c: CanvasRenderingContext2D | null; ti: number; ban: Set<OngDo> }
const hangCua = new WeakMap<HTMLElement, Hang>()
const tron = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
const rgba = (m: Rgb, a: number) => `rgba(${Math.round(m[0])},${Math.round(m[1])},${Math.round(m[2])},${kep(a).toFixed(3)})`

/** Màu CSS bất kỳ (kể cả var(), color-mix, oklch) → rgb: tô 1 điểm ảnh rồi đọc lại. */
function docMau(cot: Element, bien: string, c1: CanvasRenderingContext2D | null): Rgb {
  const i = document.createElement('i')
  i.style.color = `var(${bien})`; cot.appendChild(i)
  const css = getComputedStyle(i).color
  i.remove()
  if (!c1) return [200, 200, 200]
  c1.clearRect(0, 0, 1, 1); c1.fillStyle = css; c1.fillRect(0, 0, 1, 1)
  const d = c1.getImageData(0, 0, 1, 1).data
  return [d[0]!, d[1]!, d[2]!]
}
/** Quầng sáng vẽ sẵn một lần mỗi ống (drawImage rẻ hơn gradient / shadowBlur mỗi khung). */
function anhQuang(dung: [number, string][]): HTMLCanvasElement | null {
  const cv = document.createElement('canvas'), c = cv.getContext('2d')
  if (!c) return null
  cv.width = cv.height = 64
  const g = c.createRadialGradient(32, 32, 0, 32, 32, 32)
  dung.forEach(([o, m]) => g.addColorStop(o, m))
  c.fillStyle = g; c.fillRect(0, 0, 64, 64)
  return cv
}

/** ĐO MỘT LẦN cho cả lượt: mọi ống (khung, mặt chất lỏng, màu đội đã giải) + khung canvas phủ vùng ống. */
function doHinh(san: HTMLElement, tl: Element, khoa: string): Hinh {
  const r0 = san.getBoundingClientRect(), k = r0.width / 1920 || 1, ong = new Map<number, OngDo>()
  const nhap = document.createElement('canvas'); nhap.width = nhap.height = 1
  const c1 = nhap.getContext('2d', { willReadFrequently: true })
  let x0 = 1920, x1 = 0, y0 = 1080, y1 = 0
  tl.querySelectorAll<HTMLElement>('.bb-tl-cot[data-doi]').forEach((cot) => {
    const og = cot.querySelector('.bb-tl-ong'), day = cot.querySelector('.bb-tl-day')
    if (!og || !day) return
    const r = og.getBoundingClientRect(), rd = day.getBoundingClientRect()
    const o: Ong = { x: (r.left + r.width / 2 - r0.left) / k, tren: (r.top - r0.top) / k, day: (r.bottom - r0.top) / k, r: r.width / 2 / k, mat: 0 }
    // Mặt chất lỏng = giữa dải sáng trên cùng của khối chất lỏng; ống rỗng ⇒ sát đáy nhưng chừa chỗ cho gợn.
    o.mat = kep((rd.top - r0.top) / k + 6, o.tren + 40, o.day - 18)
    const mau = docMau(cot, '--doi', c1), giay = docMau(cot, '--giay', c1), nhat = tron(mau, giay, 0.45)
    ong.set(Number(cot.dataset.doi), { ...o, doi: Number(cot.dataset.doi), mau, nhat, giay,
      quang: anhQuang([[0, rgba(giay, 1)], [0.16, rgba(nhat, 0.9)], [0.42, rgba(mau, 0.32)], [1, rgba(mau, 0)]]),
      long: anhQuang([[0, rgba(nhat, 0.85)], [0.5, rgba(mau, 0.3)], [1, rgba(mau, 0)]]) })
    x0 = Math.min(x0, o.x - o.r - 60); x1 = Math.max(x1, o.x + o.r + 60); y0 = Math.min(y0, o.tren - 70); y1 = Math.max(y1, o.day + 24)
  })
  x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0))
  return { khoa, tl, ong, x: x0, y: y0, w: Math.max(1, Math.ceil(Math.min(1920, x1) - x0)), h: Math.max(1, Math.ceil(Math.min(1080, y1) - y0)), k }
}
function datCanvas(san: HTMLElement, h: Hang, hinh: Hinh): void {
  if (!h.cv || !h.cv.isConnected) {
    let lop = san.querySelector<HTMLElement>('.bb-tl-bay-lop')
    if (!lop) { lop = document.createElement('div'); lop.className = 'bb-tl-bay-lop'; lop.setAttribute('aria-hidden', 'true'); san.appendChild(lop) }
    h.cv = document.createElement('canvas'); h.cv.className = 'bb-tl-xoan'; h.cv.style.display = 'none'; lop.appendChild(h.cv)
    h.c = h.cv.getContext('2d')
  }
  const cv = h.cv, s = hinh.k * Math.min(2, window.devicePixelRatio || 1), bw = Math.round(hinh.w * s), bh = Math.round(hinh.h * s)
  Object.assign(cv.style, { left: `${hinh.x}px`, top: `${hinh.y}px`, width: `${hinh.w}px`, height: `${hinh.h}px` })
  if (cv.width !== bw || cv.height !== bh) { cv.width = bw; cv.height = bh }
  h.ti = s
}

function taoTia(o: OngDo, t0: number, gon: boolean): Tia {
  const sc = kep(o.r / 90, 1, 1.35), sau = o.day - o.mat, ng = Math.random
  const giot = Array.from({ length: 12 }, () => { const g = (ng() - 0.5) * 1.6, v = 170 + ng() * 170; return [Math.sin(g) * v, Math.cos(g) * v, (2.4 + ng() * 2.2) * sc] })
  const bot = sau < 20 ? [] : Array.from({ length: 9 }, (_, i) => [120 + Math.floor(i / 3) * 260 + ng() * 80, (ng() - 0.5) * 1.1, 12 + ng() * Math.min(110, sau - 14), 70 + ng() * 60, (2.6 + ng() * 3.2) * sc, ng() * 6])
  return { o, t0, cham: gon ? 140 + roiMs(o) : XOAN_MS + DUNG_MS + roiMs(o), gon, gop: 0, lua: false, sc, giot, bot }
}

/** Đầu tia: quầng màu đội + lõi giấy (lõi sáng ⇒ rơi qua ngọn lửa cùng màu vẫn rõ). */
function dau(c: CanvasRenderingContext2D, o: OngDo, x: number, y: number, s: number, a: number): void {
  if (a <= 0.01) return
  c.globalAlpha = kep(a)
  const g = 60 * s
  if (o.quang) c.drawImage(o.quang, x - g / 2, y - g / 2, g, g)
  c.fillStyle = rgba(o.giay, 1); c.beginPath(); c.arc(x, y, 3.6 * s, 0, 2 * Math.PI); c.fill()
}
/** Độ sáng theo chiều sâu: phía trước 1, phía sau ~0,18; khuất hẳn khi ở phía sau, trong bóng ống và dưới mặt chất lỏng (chuyển mượt, không nhảy). */
function sangSau(o: Ong, p: { x: number; y: number; z: number }): number {
  const d = (p.z + 1) / 2, kin = kep((nuaRong(o, p.y) - Math.abs(p.x - o.x)) / 10) * kep((p.y - o.mat) / 8) * kep(-p.z / 0.35)
  return (0.18 + 0.82 * d * d) * (1 - 0.96 * kin)
}
/** Đuôi xoắn: lấy mẫu ngược trên chính đường xoắn; vẽ đoạn phía sau trước, đoạn phía trước sau (đè lên). */
function veDuoi(c: CanvasRenderingContext2D, t: Tia, u: number, mo: number): void {
  const o = t.o, ds = Array.from({ length: DUOI + 1 }, (_, k) => diemXoan(o, de(u - k * BUOC_DUOI)))
  c.lineCap = 'round'; c.globalAlpha = 1
  for (const truoc of [false, true]) {
    for (let k = 0; k < DUOI; k++) {
      const a = ds[k]!, b = ds[k + 1]!, z = (a.z + b.z) / 2
      if (z >= 0 !== truoc || (a.x === b.x && a.y === b.y)) continue
      const d = (z + 1) / 2, f = 1 - k / DUOI, al = sangSau(o, a) * f ** 1.4 * mo * kep(u / 0.08)
      if (al < 0.01) continue
      // Hai lớp: viền màu đội rộng, mờ (nổi trên nền tối) + lõi sáng mảnh (nổi trên chất lỏng cùng màu đội).
      const w = (0.7 + 3.6 * f) * t.sc * (0.55 + 0.45 * d)
      c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y)
      if (truoc) { c.strokeStyle = rgba(o.mau, al * 0.45); c.lineWidth = w * 2.6; c.stroke() }
      c.strokeStyle = rgba(tron(o.nhat, o.giay, 0.3 + 0.5 * d), al); c.lineWidth = w; c.stroke()
    }
  }
}
/** Lòng ống (thân thẳng + đáy tròn) — vùng cắt cho mọi thứ của phản ứng. */
function longOng(c: CanvasRenderingContext2D, o: Ong): void {
  const r = o.r - 3, tam = o.day - o.r
  c.beginPath(); c.moveTo(o.x - r, o.tren + 3); c.lineTo(o.x - r, tam); c.arc(o.x, tam, r, Math.PI, 0, true); c.lineTo(o.x + r, o.tren + 3); c.closePath()
}
function gon(c: CanvasRenderingContext2D, o: OngDo, q: number, nua: number, manh: number): void {
  if (q < 0 || q >= 1) return
  const rx = nua * (0.12 + 0.86 * (1 - (1 - q) ** 3))
  c.globalAlpha = manh * (1 - q) ** 1.4; c.strokeStyle = rgba(o.nhat, 1); c.lineWidth = 1.2 + 3 * (1 - q)
  c.beginPath(); c.ellipse(o.x, o.mat, rx, Math.max(2.5, rx * 0.2), 0, 0, 2 * Math.PI); c.stroke()
}
/** Chạm mặt chất lỏng (e = ms sau khi chạm): loé trong lòng chất lỏng · gợn sóng · bọt khí · giọt bắn — tất cả cắt trong lòng ống. */
function phanUng(c: CanvasRenderingContext2D, t: Tia, e: number): void {
  const o = t.o, nua = nuaRong(o, o.mat), sau = o.day - o.mat
  c.save(); longOng(c, o); c.clip()
  if (t.gon) { gon(c, o, e / GON_PU_MS, nua, 0.7); c.restore(); return }
  // Loé màu đội trong lòng chất lỏng: quầng nhỏ ngay dưới điểm chạm (vùng lớn đã có lớp .bb-tl-sang của ống — bungLua, chạy trên luồng hợp thành).
  const qg = e / 600
  if (qg < 1 && o.long) {
    const s = Math.min(nua * 1.5, 150) * (0.7 + 0.3 * qg)
    c.globalAlpha = (e < 80 ? e / 80 : (1 - qg) ** 2) * Math.min(0.95, 0.75 + 0.07 * t.gop)
    c.drawImage(o.long, o.x - s / 2, o.mat + Math.min(24, sau * 0.4) - s / 2, s, s)
  }
  if (e < 280 && o.quang) { const q = e / 280, s = 64 * t.sc * (1 + 0.8 * q); c.globalAlpha = (1 - q) ** 1.5; c.drawImage(o.quang, o.x - s / 2, o.mat - s / 2, s, s) } // loé ngay điểm chạm
  for (let j = 0; j < (t.gop ? 3 : 2); j++) gon(c, o, (e - j * 170) / 820, nua, 0.95)
  c.lineWidth = 1.8; c.strokeStyle = rgba(o.giay, 1)
  for (const [tre, dx, sauB, v, r, pha] of t.bot) {
    const tb = (e - tre!) / 1000, y = o.mat + sauB! - v! * tb
    if (tb < 0 || y < o.mat + r!) continue
    c.globalAlpha = kep(tb / 0.15) * 0.85
    c.beginPath(); c.arc(o.x + dx! * nuaRong(o, o.mat + sauB!) + Math.sin(tb * 8 + pha!) * 2.5, y, r!, 0, 2 * Math.PI); c.stroke()
  }
  const tg = e / 1000
  if (tg < 0.75) {
    c.fillStyle = rgba(o.nhat, 1)
    t.giot.slice(0, 6 + 2 * Math.min(3, t.gop)).forEach(([vx, vy, s], i) => {
      const g2 = i < 6 ? 1 : 1.25, y = o.mat - (vy! * g2 * tg - 750 * tg * tg)
      if (tg > 0.05 && y > o.mat + 1) return
      c.globalAlpha = (1 - tg / 0.75) * 0.9
      c.beginPath(); c.arc(o.x + vx! * g2 * tg, y, s!, 0, 2 * Math.PI); c.fill()
    })
  }
  c.restore()
}
/** Tia đang bay (e = ms từ lúc phóng, trước khi chạm). */
function veBay(c: CanvasRenderingContext2D, t: Tia, e: number): void {
  const o = t.o
  if (t.gon) { const tf = Math.max(0, e - 140) / 1000; dau(c, o, o.x, Math.min(o.mat, o.tren - 12 + 0.5 * G * tf * tf), 0.8, kep(e / 140)); return }
  if (e < XOAN_MS) {
    const u = e / XOAN_MS, p = diemXoan(o, de(u)), d = (p.z + 1) / 2
    veDuoi(c, t, u, 1)
    dau(c, o, p.x, p.y, (0.55 + 0.45 * d) * t.sc, kep(u / 0.08) * sangSau(o, p))
  } else if (e < XOAN_MS + DUNG_MS) {
    // Miệng ống: đuôi thu vào đầu, đầu nhích lên giữa miệng + loé; ánh viền miệng ống.
    const q = (e - XOAN_MS) / DUNG_MS, p1 = diemXoan(o, 1), nh = Math.sin(Math.PI * q), y = p1.y + (o.tren - 12 - p1.y) * (1 - (1 - q) ** 3)
    veDuoi(c, t, 1 + (e - XOAN_MS) / XOAN_MS, kep(1 - q * 1.25))
    c.globalAlpha = 0.65 * nh; c.strokeStyle = rgba(o.nhat, 1); c.lineWidth = 3
    c.beginPath(); c.ellipse(o.x, o.tren + 3, o.r * 0.92, Math.max(3, o.r * 0.1), 0, 0, 2 * Math.PI); c.stroke()
    dau(c, o, o.x, y, t.sc * (1 + 1.1 * nh), 1)
  } else {
    // Rơi tự do: vệt dọc dài theo vận tốc, đầu lõi sáng.
    const tf = (e - XOAN_MS - DUNG_MS) / 1000, y = Math.min(o.mat, o.tren - 12 + 0.5 * G * tf * tf), L = Math.min(110, 14 + G * tf * 0.07)
    c.lineCap = 'round'
    for (let k = 0; k < 5; k++) {
      c.globalAlpha = 0.9 * (1 - k / 5); c.strokeStyle = rgba(o.nhat, 1); c.lineWidth = 5 * t.sc * (1 - k / 6)
      c.beginPath(); c.moveTo(o.x, y - (L * k) / 5); c.lineTo(o.x, y - (L * (k + 1)) / 5); c.stroke()
    }
    dau(c, o, o.x, y, t.sc, 1)
  }
}
/** Ngọn lửa trên ống bùng rồi dịu + lòng ống sáng một nhịp (WAAPI transform / opacity; mỗi ống tối đa một nhịp / 450 ms, không giật nhau). */
function bungLua(san: HTMLElement, h: Hang, doi: number, nay: number): void {
  if (nay - (h.lucLua.get(doi) ?? -1e9) < LUA_MS) return
  h.lucLua.set(doi, nay)
  const cot = san.querySelector(`.bb-tl-cot[data-doi="${doi}"]`), sang = cot?.querySelector('.bb-tl-sang'), lua = cot?.querySelector('.bb-tl-nhun')
  if (coAnimate(sang)) sang.animate([{ opacity: 0 }, { opacity: 0.55, offset: 0.2 }, { opacity: 0 }], { duration: 950, easing: 'ease-out' })
  if (coAnimate(lua)) lua.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1, 1.22)', offset: 0.3 }, { transform: 'scale(0.98, 0.96)', offset: 0.65 }, { transform: 'scale(1)' }], { duration: 760, easing: 'cubic-bezier(.3, .8, .4, 1)' })
}

/** MỘT vòng rAF chung: xoá canvas, vẽ mọi tia, bỏ tia đã xong; hết tia ⇒ dừng + ẩn canvas. Bảng / tháp đã gỡ ⇒ huỷ hết. */
function khung(san: HTMLElement, h: Hang, nay: number): void {
  h.raf = 0
  const c = h.c, cv = h.cv, hinh = h.hinh
  if (!c || !cv || !hinh || !san.isConnected || !hinh.tl.isConnected) {
    h.tia = []; h.cuoi.clear(); h.ban.clear()
    if (c && cv) { c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height); cv.style.display = 'none' }
    return
  }
  // Chỉ xoá vùng các ống vừa vẽ ở khung trước (trình duyệt chỉ vẽ lại phần bẩn của canvas, không cả vùng tháp).
  c.setTransform(h.ti, 0, 0, h.ti, -hinh.x * h.ti, -hinh.y * h.ti)
  h.ban.forEach((o) => c.clearRect(o.x - o.r - 60, o.tren - 70, 2 * o.r + 120, o.day - o.tren + 94))
  h.ban.clear()
  h.tia = h.tia.filter((t) => {
    const e = nay - t.t0
    if (e < 0) return true
    h.ban.add(t.o)
    if (e < t.cham) veBay(c, t, e)
    else {
      if (!t.lua) { t.lua = true; if (!t.gon) bungLua(san, h, t.o.doi, nay) }
      phanUng(c, t, e - t.cham)
    }
    return e < t.cham + (t.gon ? GON_PU_MS : PHAN_UNG_MS)
  })
  c.globalAlpha = 1
  if (h.tia.length) h.raf = requestAnimationFrame((n) => khung(san, h, n))
  else { h.ban.forEach((o) => c.clearRect(o.x - o.r - 60, o.tren - 70, 2 * o.r + 120, o.day - o.tren + 94)); h.ban.clear(); h.cuoi.clear(); cv.style.display = 'none' }
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
  if (!coAnimate(san)) return // không có hoạt cảnh (môi trường test) ⇒ chỉ ô sáng + tích
  let h = hangCua.get(san)
  if (!h) { h = { tia: [], cuoi: new Map(), lucLua: new Map(), lucSo: -1e9, doi: [], hen: 0, raf: 0, khoa: '', luot: '', yeu, hinh: null, cv: null, c: null, ti: 1, ban: new Set() }; hangCua.set(san, h) }
  h.doi.push(...ds); h.yeu = yeu; h.khoa = `${khoa}|${innerWidth}x${innerHeight}`
  if (!h.hen) h.hen = requestAnimationFrame(() => phat(san, h!))
}
function phat(san: HTMLElement, h: Hang): void {
  const ds = h.doi
  h.doi = []; h.hen = 0
  if (!san.isConnected || !ds.length) return
  const nay = performance.now()
  if (!h.yeu && nay - h.lucSo >= NHIP_MS) {
    h.lucSo = nay
    const so = san.querySelector('.bb-tl-dem .so b')
    if (coAnimate(so)) so.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.16)', offset: 0.35 }, { transform: 'scale(1)' }], { duration: 360, easing: 'cubic-bezier(.3, .8, .4, 1)' })
    const sang = [...san.querySelectorAll('.bb-tl-dem .o i.c')].slice(-Math.min(ds.length, 4))
    sang.forEach((el, i) => { if (coAnimate(el)) el.animate([{ opacity: 0.35, transform: 'scaleY(1.7)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: i * 40, easing: 'cubic-bezier(.2, .8, .3, 1)', fill: 'backwards' }) })
  }
  // Tia lửa chỉ khi màn đua đang hiện (tấm giấy G / M đè vùng ống ⇒ không vẽ thứ không ai thấy).
  const tl = san.querySelector('.bb-tl'), dai = tl?.querySelector<HTMLElement>('.bb-tl-dai')
  if (!tl || !dai || dai.style.visibility === 'hidden') return
  const luot = h.khoa.split(':').slice(0, 2).join(':')
  if (luot !== h.luot) { h.luot = luot; h.tia = h.tia.filter((t) => t.t0 <= nay); h.cuoi.clear() } // lượt mới: bỏ tia còn chờ
  if (h.hinh?.khoa !== h.khoa || h.hinh.tl !== tl) { h.hinh = doHinh(san, tl, h.khoa); datCanvas(san, h, h.hinh) }
  if (!h.c || !h.cv) return
  for (const e of ds) {
    const o = h.hinh.ong.get(e.doi)
    if (!o) continue
    const t = taoTia(o, 0, h.yeu), bd = xepHang(h.cuoi.get(e.doi) ?? -1e9, nay, t.cham)
    if (bd === null) {
      // Hàng ống này đã dài (chạm nước sẽ trễ quá 4 s) ⇒ gộp vào tia CHƯA chạm gần nhất: phản ứng đậm hơn một chút (trần 3).
      const cu = h.tia.filter((x) => x.o.doi === e.doi && x.t0 + x.cham > nay).pop()
      if (cu) cu.gop = Math.min(3, cu.gop + 1)
      continue
    }
    t.t0 = bd; h.cuoi.set(e.doi, bd); h.tia.push(t)
  }
  if (h.tia.length && !h.raf) { h.cv.style.display = ''; h.raf = requestAnimationFrame((n) => khung(san, h, n)) }
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
