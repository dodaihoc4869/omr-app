// NHẬT KÝ BÀI DẠY — TÁCH TRANG BẢNG TỪ `net.bin` (thầy 13/11 «nhật kí sau khi live xong gửi cho văn phòng soạn»). Văn phòng cần NHÌN được thầy viết gì, lúc
// nào ⇒ dựng lại các trang bảng của buổi từ nhật ký nét đã chốt (đúng bộ áp sổ nét của máy em: `apMuc`), mỗi trang kèm khoảng giờ trên trục tiếng, rồi vẽ
// thành SVG (vectơ, nhẹ, không cần canvas trên máy chủ). Thuần, không DOM.
// TRANG: một khoá trang của bộ máy bút (Học: giấy của từng câu · Bảng: bảng đen cuộn) giữa hai lần «xoá hết». Thầy đổi Học ⇄ Bảng (Tab) thì phòng gửi lại
// «bảng mới» + mọi nét của trang kia ⇒ cùng khoá ⇒ GỘP vào trang cũ (không đẻ trang trùng), khoảng giờ nối thêm. Trang không có nét bị bỏ.
// GIỜ CỦA NÉT: lần ĐẦU nét xuất hiện trong `net.bin` (nét gửi lại theo ảnh trạng thái giữ giờ cũ): [t, t + ms điểm cuối] — mili-giây trên trục tiếng.
import type { NetBut } from '../but-bang-loi'
import { giaiSo } from '../live/ma-net'
import { apMuc, taoBang } from '../live/so-net'
import { docNetBin } from '../live/xem-lai-kieu'

export interface NetCoGio { net: NetBut; t0: number; t1: number }
export interface TrangBang {
  /** Số trang 1, 2, … theo lúc trang xuất hiện lần đầu. */
  stt: number
  /** Khoá trang của bộ máy bút — NỘI BỘ, không gửi ra ngoài (có thể mang mã câu). */
  khoa: string
  /** `bang` = bảng đen cuộn (nét «b_…») · `giay` = viết trên giấy đề của câu. */
  loai: 'bang' | 'giay'
  tiLe: number
  /** Các khoảng (ms trên trục tiếng) trang này đang được chiếu / viết. */
  doan: [number, number][]
  net: NetCoGio[]
}

/** Dựng các trang bảng của buổi. `cuoiMs` = độ dài trục tiếng (đóng khoảng của trang cuối). */
export function tachTrang(bin: Uint8Array, cuoiMs: number): TrangBang[] {
  const b = taoBang(), gio = new Map<string, [number, number]>(), ds: TrangBang[] = [], mo = new Map<string, TrangBang>()
  let dang: TrangBang | null = null, tuLuc = 0
  const chup = (t: number): void => {
    if (!dang) return
    dang.net = b.net.map((n) => { const g = gio.get(n.id) ?? [t, t]; return { net: n, t0: g[0], t1: g[1] } })
    if (t > tuLuc) dang.doan.push([tuLuc, t])
  }
  const moi = (khoa: string): TrangBang => {
    const tr: TrangBang = { stt: 0, khoa, loai: 'giay', tiLe: b.tiLe, doan: [], net: [] }
    ds.push(tr); mo.set(khoa, tr); return tr
  }
  for (const r of docNetBin(bin).muc) {
    const m = giaiSo(r.khung)
    if (!m) continue
    if (m.k === 'bang' || m.k === 'xoa-het') {
      chup(r.t)
      const cu = dang
      apMuc(b, m)
      if (m.k === 'xoa-het' && cu) mo.delete(cu.khoa)
      dang = mo.get(b.trang) ?? moi(b.trang)
      dang.tiLe = b.tiLe; tuLuc = r.t
      continue
    }
    if (!dang) { dang = moi(b.trang); tuLuc = r.t }
    apMuc(b, m)
    if (m.k === 'net' && m.het) {
      const n = b.net.find((x) => x.id === m.net.id)
      if (n && !gio.has(n.id)) { const ms = n.diem.length ? Math.max(0, n.diem[n.diem.length - 1]![3]) : 0; gio.set(n.id, [r.t, r.t + ms]) }
    }
  }
  chup(Math.max(cuoiMs, tuLuc))
  const ra = ds.filter((t) => t.net.some((n) => n.net.cong !== 'tay' && n.net.diem.length > 0))
  ra.forEach((t, i) => { t.stt = i + 1; t.loai = t.net.some((n) => n.net.id.startsWith('b_')) ? 'bang' : 'giay' })
  return ra
}

/** Bề ngang khung vẽ SVG (đơn vị = px của màn 1920, cùng đơn vị bề dày nét `co`). Toạ độ `vung` của kịch bản tính theo đơn vị này. */
export const W_SVG = 1920
const caoTrang = (tr: TrangBang): number => {
  let yMax = 1
  for (const n of tr.net) for (const d of n.net.diem) if (d[1] > yMax) yMax = d[1]
  return Math.ceil((W_SVG / (tr.tiLe > 0 ? tr.tiLe : 16 / 9)) * (yMax + 0.03))
}
/** Bảng màu của ảnh trang (máy chủ truyền vào — ảnh SVG rời không đọc được biến CSS của app): nền bảng · màu thay cho mực xanh viết lên giấy đề (sáng lên cho
 *  đọc được trên nền tối) · màu khi nét mang màu lạ. */
export interface MauAnhTrang { nen: string; mucXanh: string; macDinh: string }
const MUC_XANH = /^rgb\(36,\s*86,\s*201\)$/, LA_RGB = /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/
const mauVe = (m: string, mau: MauAnhTrang): string => (MUC_XANH.test(m.trim()) ? mau.mucXanh : LA_RGB.test(m.trim()) ? m.trim() : mau.macDinh)

/** Một trang bảng thành SVG: nền bảng tối, mỗi nét một đường (điểm sát nhau dưới 1,5 px bỏ bớt). `den` (ms) ⇒ chỉ vẽ nét bắt đầu trước mốc ấy. */
export function svgTrang(tr: TrangBang, mau: MauAnhTrang, den = Infinity): string {
  const H = caoTrang(tr), k = W_SVG / (tr.tiLe > 0 ? tr.tiLe : 16 / 9)
  const duong: string[] = []
  for (const n of tr.net) {
    if (n.net.cong === 'tay' || !n.net.diem.length || n.t0 > den) continue
    let d = '', x0 = NaN, y0 = NaN
    for (const p of n.net.diem) {
      const x = p[0] * W_SVG, y = p[1] * k
      if (d && Math.hypot(x - x0, y - y0) < 1.5) continue
      d += `${d ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`; x0 = x; y0 = y
    }
    if (n.net.diem.length === 1) d += 'l0.1 0'
    duong.push(`<path d="${d}" stroke="${mauVe(n.net.mau, mau)}" stroke-width="${Math.max(1, n.net.co).toFixed(1)}"/>`)
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W_SVG} ${H}" width="${W_SVG}" height="${H}"><rect width="100%" height="100%" fill="${mau.nen}"/>`
    + `<g fill="none" stroke-linecap="round" stroke-linejoin="round">${duong.join('')}</g></svg>`
}

/** Bề ngang bảng của KHUÔN hoạt hoạ (máy em, public/nhat-ky/khuon.js — BangPhan): toạ độ nét và `vung` của cảnh tính trên bảng rộng 1600. */
export const RONG_KHUON = 1600
const heSo = (tr: TrangBang): number => RONG_KHUON / (tr.tiLe > 0 ? tr.tiLe : 16 / 9)

/** Vùng nét của cảnh trên trang: [x0, y0, x1, y1] theo bảng rộng `RONG_KHUON` (đúng dạng `nguon.vung` khuôn đọc), bao các nét có giờ chạm khoảng
 *  [tuMs, denMs], chừa lề 20. Không có nét nào ⇒ null. */
export function vungTrong(tr: TrangBang, tuMs: number, denMs: number): [number, number, number, number] | null {
  const k = heSo(tr)
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const n of tr.net) {
    if (n.net.cong === 'tay' || n.t1 < tuMs || n.t0 > denMs) continue
    for (const p of n.net.diem) { const x = p[0] * RONG_KHUON, y = p[1] * k; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y }
  }
  if (!Number.isFinite(x0)) return null
  const le = 20
  return [Math.max(0, Math.round(x0 - le)), Math.max(0, Math.round(y0 - le)), Math.round(x1 + le), Math.round(y1 + le)]
}

/** Nét phấn của MỘT trang theo đúng dạng khuôn đọc (BangPhan): { rong, cao, mau: [[màu, tên]], net: [{ m, c, t, p }] } — `m` = chỉ số màu, `c` = bề dày
 *  (đơn vị bảng 1600), `t` = ms trên trục tiếng lúc nét bắt đầu, `p` = [x×4, y×4, ms kể từ đầu nét, …]. Điểm sát nhau dưới 1,5 đơn vị bỏ bớt. */
export function netKhuon(tr: TrangBang, mau: MauAnhTrang): { rong: number; cao: number; mau: [string, string][]; net: { m: number; c: number; t: number; p: number[] }[] } {
  const k = heSo(tr), bang: [string, string][] = [], chiSo = new Map<string, number>(), net: { m: number; c: number; t: number; p: number[] }[] = []
  let yMax = 0
  for (const n of tr.net) {
    if (n.net.cong === 'tay' || !n.net.diem.length) continue
    const mv = mauVe(n.net.mau, mau)
    let m = chiSo.get(mv)
    if (m == null) { m = bang.length; bang.push([mv, '']); chiSo.set(mv, m) }
    const p: number[] = []
    let x0 = NaN, y0 = NaN
    n.net.diem.forEach((d, i) => {
      const x = d[0] * RONG_KHUON, y = d[1] * k
      if (i > 0 && i < n.net.diem.length - 1 && Math.hypot(x - x0, y - y0) < 1.5) return
      p.push(Math.round(x * 4), Math.round(y * 4), Math.max(0, Math.round(d[3]))); x0 = x; y0 = y
      if (y > yMax) yMax = y
    })
    net.push({ m, c: Math.round((Math.max(1, n.net.co) * RONG_KHUON / W_SVG) * 10) / 10, t: Math.round(n.t0), p })
  }
  return { rong: RONG_KHUON, cao: Math.max(Math.round(k), Math.ceil(yMax + 40)), mau: bang, net }
}
