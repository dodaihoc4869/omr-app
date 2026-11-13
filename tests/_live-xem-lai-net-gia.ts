// NÉT VIẾT TAY GIẢ để ĐO ĐỘ MƯỢT trình phát «Xem lại Live» (13/11, thầy: «nét bút xem lại vẫn bị giật, chưa mượt như trong live»).
// Dùng chung cho test `live-xem-lai-net-muot-1311` và bộ đo Chromium `scripts/chup-live-xem-lai-hs-1111/do-net.mjs`. KHÔNG có dữ liệu thật.
// Mỗi kịch bản là một dãy nét có giờ bắt đầu trên trục tiếng + điểm mang giờ như bút thật (toạ độ 5 số lẻ, giờ mili-giây nguyên):
//   · `lien`     nét dài viết liền, điểm cách nhau 8–16 ms (bút Wacom qua trình duyệt);
//   · `thua`     cùng dáng nét, điểm thưa 50–150 ms (máy thầy bận, chuột);
//   · `chu`      nhiều nét ngắn nối nhau như viết chữ: nét 90–260 ms, nhấc bút 70–220 ms, cách chữ ~0,4 giây;
//   · `chong`    như `chu` nhưng giờ bắt đầu lệch ±90 ms (giờ nét suy từ giờ máy chủ nhận ⇒ nét sau có thể bắt đầu khi nét trước chưa xong);
//   · `cung-gio` như `lien` nhưng giờ điểm bị dồn LÊN bội 33 ms (cả cụm điểm cùng một giờ — máy thầy gom mẫu theo khung hình); `that` giữ giờ thật để so.
// `nen` = số nét đã có sẵn trên bảng (bảng cuộn dài) trước khi viết — đo khung hình khi bảng đã có 1500–3000 nét.
import type { DiemBut, NetBut } from '../src/lib/but-bang-loi'
import { maBangMoi, maNetXong } from '../src/lib/live/ma-net'
import { ghiNetBin, type BuoiLiveJson, type KhoangMs } from '../src/lib/live/xem-lai-kieu'
import { VUNG_MAC_DINH, maTrang } from '../src/components/live/bo-cuc'
import { taoBuoiGia } from './_live-xem-lai-hs-gia'

export type KichBanNet = 'lien' | 'thua' | 'chu' | 'chong' | 'cung-gio'
export const KICH_BAN_NET: readonly KichBanNet[] = ['lien', 'thua', 'chu', 'chong', 'cung-gio']
/** Một nét có giờ bắt đầu `t` (ms trên trục tiếng). `that` = giờ THẬT từng điểm khi giờ ghi trong nét đã bị dồn cụm (kịch bản `cung-gio`). */
export interface NetCoGio { t: number; net: NetBut; that?: number[] }

function taoRng(hat: number): () => number {
  let a = hat >>> 0
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const PHAN = '#f4efe4'
const B = { x0: VUNG_MAC_DINH.bang[0] + 0.015, x1: VUNG_MAC_DINH.bang[2] - 0.015, y0: VUNG_MAC_DINH.bang[1] + 0.05 }
/** Vận tốc bút thật: nhanh dần rồi chậm dần (đường «ít giật nhất») — `f` 0..1 ⇒ phần quãng đường đã đi. */
const emTay = (f: number): number => f * f * f * (10 - 15 * f + 6 * f * f)

/** Lấy mẫu một đường `duong(s)` (s 0..1) thành điểm bút trong `ms` mili-giây, mẫu cách nhau `dtMin`–`dtMax` ms. `deu` = đi đều (nét dài viết liền). */
function layMau(duong: (s: number) => [number, number], ms: number, dtMin: number, dtMax: number, rng: () => number, deu: boolean): DiemBut[] {
  const ra: DiemBut[] = []
  let t = 0
  for (;;) {
    const f = Math.min(1, t / ms), s = deu ? f * 0.86 + 0.14 * emTay(f) : emTay(f)
    const [x, y] = duong(s)
    ra.push([+x.toFixed(5), +y.toFixed(5), +(0.5 + 0.3 * Math.sin(ra.length / 6) ** 2).toFixed(2), Math.round(t)])
    if (t >= ms) break
    t = Math.min(ms, t + dtMin + rng() * (dtMax - dtMin))
  }
  return ra
}
/** Nét dài viết liền: một dòng chữ thảo (vòng lượn nối nhau) rộng `w` tại dòng `y`. */
const netLien = (x: number, y: number, w: number, cao: number, vong: number) => (s: number): [number, number] =>
  [x + w * s + cao * 0.55 * Math.sin(s * vong * Math.PI * 2), y - cao * (0.5 - 0.5 * Math.cos(s * vong * Math.PI * 2))]
/** Nét ngắn của một chữ: gạch dọc, gạch ngang, móc, vòng. */
function netChu(kieu: number, x: number, y: number, w: number, cao: number): (s: number) => [number, number] {
  if (kieu === 0) return (s) => [x + w * 0.1 * s, y - cao + cao * s] // gạch dọc xuống
  if (kieu === 1) return (s) => [x + w * s, y - cao * 0.5 - cao * 0.08 * Math.sin(s * Math.PI)] // gạch ngang
  if (kieu === 2) return (s) => [x + w * (0.5 - 0.5 * Math.cos(s * Math.PI * 1.7)), y - cao * 0.5 - cao * 0.5 * Math.sin(s * Math.PI * 1.7)] // vòng «o / c»
  return (s) => [x + w * s, y - cao * Math.abs(Math.sin(s * Math.PI * 1.5)) * (1 - 0.3 * s)] // móc «n / h»
}

/** Dãy nét của một kịch bản, bắt đầu tại `t0` (ms), dòng đầu ở `yDau` (toạ độ bảng). Cùng hạt ⇒ cùng dữ liệu. */
export function vietTay(kich: KichBanNet, t0 = 2000, yDau = B.y0 + 0.06, hat = 1311): NetCoGio[] {
  const rng = taoRng(hat), ra: NetCoGio[] = [], rong = B.x1 - B.x0
  let t = t0, dem = 0
  const them = (diem: DiemBut[], lech = 0, that?: number[]): void => { ra.push({ t: Math.max(0, Math.round(t + lech)), net: { id: `b_d${++dem}`, cong: 'but', mau: PHAN, co: 3.2, diem }, ...(that ? { that } : null) }) }
  if (kich === 'lien' || kich === 'thua' || kich === 'cung-gio') {
    for (let dong = 0; dong < 4; dong++) for (let nua = 0; nua < 2; nua++) {
      const ms = 1300 + rng() * 900, w = rong * (0.36 + rng() * 0.08)
      const diem = layMau(netLien(B.x0 + nua * rong * 0.5, yDau + dong * 0.085, w, 0.045, 4 + Math.floor(rng() * 3)), ms, kich === 'thua' ? 50 : 8, kich === 'thua' ? 150 : 16, rng, true)
      if (kich === 'cung-gio') them(diem.map((p) => [p[0], p[1], p[2], Math.ceil(p[3] / 33) * 33] as DiemBut), 0, diem.map((p) => p[3]))
      else them(diem)
      t += ms + 260 + rng() * 160
    }
    return ra
  }
  // viết chữ: 12 chữ một dòng, mỗi chữ 2–4 nét ngắn
  for (let dong = 0; dong < 2; dong++) for (let o = 0; o < 12; o++) {
    const x = B.x0 + o * rong * 0.068, y = yDau + dong * 0.075, w = rong * 0.045, soNet = 2 + Math.floor(rng() * 3)
    for (let i = 0; i < soNet; i++) {
      const ms = 90 + rng() * 170
      them(layMau(netChu(Math.floor(rng() * 4), x + (i % 2) * w * 0.3, y, w * (0.6 + rng() * 0.4), 0.034), ms, 8, 16, rng, false), kich === 'chong' ? (rng() - 0.5) * 180 : 0)
      t += ms + 70 + rng() * 150
    }
    t += 180 + rng() * 260
  }
  if (kich === 'chong') ra.sort((a, b) => a.t - b.t) // (máy dựng xếp theo giờ bắt đầu)
  return ra
}
const dai = (n: NetBut): number => (n.diem.length ? n.diem[n.diem.length - 1]![3] : 0)
/** Giờ viết xong nét cuối (ms). */
export const hetViet = (ds: readonly NetCoGio[]): number => ds.reduce((m, n) => Math.max(m, n.t + dai(n.net)), 0)

/** Chỗ đầu bút LÝ TƯỞNG tại giờ `t` (toạ độ 0..1): đang trong một nét ⇒ nội suy thẳng theo giờ điểm; giữa hai nét ⇒ null. Nét chồng giờ ⇒ nét bắt đầu sau cùng. */
export function dauLyTuong(ds: readonly NetCoGio[], t: number): { x: number; y: number; net: number } | null {
  for (let i = ds.length - 1; i >= 0; i--) {
    const n = ds[i]!, p = n.net.diem, tt = t - n.t
    if (tt < 0 || tt > dai(n.net) || p.length < 2) continue
    let k = 1
    while (!n.that && k < p.length - 1 && p[k]![3] <= tt) k++
    const g = n.that
    while (g && k < p.length - 1 && g[k]! <= tt) k++
    const a = p[k - 1]!, b = p[k]!, ta = g ? g[k - 1]! : a[3], tb = g ? g[k]! : b[3], f = tb > ta ? Math.min(1, Math.max(0, (tt - ta) / (tb - ta))) : 1
    return { x: a[0] + (b[0] - a[0]) * f, y: a[1] + (b[1] - a[1]) * f, net: i }
  }
  return null
}

export interface BuoiNetGia { buoi: BuoiLiveJson; net: Uint8Array<ArrayBuffer>; coTieng: KhoangMs[]; viet: NetCoGio[] }
/** Một buổi giả MỘT đoạn ở chế độ «Bảng»: `nen` nét có sẵn (hiện tức thì lúc 0 ms, rải trên bảng cuộn dài) rồi tới dãy nét của kịch bản. */
export function taoBuoiNet(kich: KichBanNet, tuy: { nen?: number; coTieng?: boolean } = {}): BuoiNetGia {
  const goc = taoBuoiGia({ khoaTrang: 'bl', coTieng: tuy.coTieng }), rng = taoRng(77), rong = B.x1 - B.x0
  const muc: { t: number; khung: Uint8Array }[] = [{ t: 0, khung: maBangMoi(maTrang('bl', VUNG_MAC_DINH, false), 16 / 9) }]
  const nen = Math.max(0, tuy.nen ?? 0), moiDong = 30
  for (let i = 0; i < nen; i++) {
    const x = B.x0 + (i % moiDong) * rong / moiDong, y = B.y0 + 0.05 + Math.floor(i / moiDong) * 0.06
    const net: NetBut = { id: `b_s${i}`, cong: 'but', mau: PHAN, co: 3.2, diem: layMau(netChu(i % 4, x, y, rong / moiDong * 0.7, 0.03), 120 + rng() * 80, 8, 16, rng, false) }
    for (const k of maNetXong(net)) muc.push({ t: 0, khung: k })
  }
  const viet = vietTay(kich, 2000, B.y0 + 0.06 + Math.ceil(nen / moiDong) * 0.06)
  for (const n of viet) for (const k of maNetXong(n.net)) muc.push({ t: n.t, khung: k })
  const net = ghiNetBin(muc), t1 = Math.round(hetViet(viet) + 1500), msLive = t1 + 1000
  const cau = { ...goc.buoi.cau[0]!, t0: 0, t1 }, d0 = goc.buoi.doan[0]!
  const buoi: BuoiLiveJson = {
    ...goc.buoi, id: `buoi-net-${kich}`, msLive, msDoan: t1 - 500, byteTieng: tuy.coTieng === false ? 0 : Math.round((msLive / 1000) * 8000), byteNet: net.length,
    cau: [cau], doan: [{ ...d0, t0: 500, t1, soNet: viet.length, giayCoTieng: Math.round((t1 - 500) / 1000) }], lang: [], emNoi: [], mocBang: [{ t: 0, byte: 0 }],
  }
  return { buoi, net, coTieng: [[0, msLive]], viet }
}
