// LIVE BẢNG — ĐỆM PHÁT + NỘI SUY NÉT PHÍA MÁY EM (đặc tả mục 4.4). Thuần: không DOM, không đồng hồ (nơi gọi truyền giờ vào).
// Vấn đề: gói điểm tới thưa và không đều (16–50 ms, có dao động, có mất) trong khi màn vẽ 60 khung/giây ⇒ vẽ ngay khi gói tới thì nét giật từng khúc.
// Cách làm:
//   · mỗi điểm mang giờ theo ĐỒNG HỒ THẦY; độ lệch đồng hồ = giá trị NHỎ NHẤT của (giờ nhận − tGui) trong ~10 giây gần nhất;
//   · phát tại «bây giờ − lệch − D»: D = p95 dao động giờ tới trong 2 giây + một lô, kẹp 30–150 ms, mỗi khung đổi tối đa 2 ms;
//   · mốc phát KHÔNG BAO GIỜ đi lùi;
//   · mỗi khung trả các điểm vừa tới hạn + ĐẦU NÉT nội suy giữa hai điểm kẹp mốc phát ⇒ đầu nét tiến ở mọi khung;
//   · hết điểm mà nét chưa nhấc ⇒ giữ đầu nét tại điểm cuối, không đoán xa;
//   · đồng bộ tiếng–nét: `datDTheoTieng(trễ tiếng)` ⇒ D = kẹp(trễ tiếng − 60, D theo dao động, 150) — nét đi trước tiếng ≤ 80 ms.
import type { DiemBut } from '../but-bang-loi'
import type { DauNet, GoiDiem } from './ma-net'

export interface TuyChonDem {
  /** Kẹp dưới / trên của D (ms). */
  dMin?: number
  dMax?: number
  /** D đổi tối đa mỗi khung (ms). */
  buoc?: number
  /** Cửa sổ lấy p95 dao động (ms). */
  cuaSo?: number
  /** Máy yếu: D + 16 ms (đặc tả 4.4). */
  mayYeu?: boolean
}
export interface NetDangViet {
  dau: DauNet
  /** Các điểm vừa tới hạn phát kể từ khung trước — đúng dạng điểm của bộ máy bút (t = ms từ đầu nét) ⇒ đưa thẳng vào sự kiện `net-moi` / `them-diem`. */
  moi: DiemBut[]
  /** Số điểm của nét đã phát TRƯỚC khung này (0 ⇒ `moi` là những điểm đầu tiên của nét). */
  daCo: number
  /** Đầu nét ngay lúc này (nội suy giữa hai điểm kẹp mốc phát) — vẽ làm «đuôi» của nét dở; null = nét chưa tới mốc phát. */
  head: { x: number; y: number; apLuc: number } | null
  /** Nét đã nhấc và đã phát hết ⇒ bản chốt từ sổ nét thay vào. */
  xong: boolean
}
export interface KhungPhat { net: NetDangViet[]; tro: { x: number; y: number } | null; d: number }
export interface SoDoDem {
  /** D hiện tại (ms). */
  d: number
  /** p95 dao động giờ tới trong cửa sổ (ms). */
  jitter: number
  /** Điểm tới MUỘN hơn mốc phát: số lần + mức muộn lớn nhất (ms) kể từ lần đọc trước — «khoảng đứng» của đầu nét. */
  muon: number
  muonToiDa: number
  /** Điểm bị thủng (mất ≥ 2 gói liền) kể từ lần đọc trước. */
  mat: number
  goi: number
}

/** `diem[i]` = điểm thứ i của nét (lỗ = gói chưa tới / đã mất); `gio[i]` = giờ live của thầy (ms) của điểm đó; `cao` = chỉ số cao nhất đã nhận + 1;
 *  `daVe` = chỉ số kế tiếp sẽ phát; `cuoi` = chỉ số điểm vừa phát gần nhất (−1 = chưa phát điểm nào); `soPhat` = số điểm đã phát ra lớp vẽ. */
interface NetDem { dau: DauNet; diem: (DiemBut | undefined)[]; gio: number[]; cao: number; daVe: number; cuoi: number; soPhat: number; nhac: boolean; nhacLuc: number; tong: number | null }
const kep = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)
const XO = 5000

/** D nét theo trễ tiếng ước lượng (đặc tả 4.4): kẹp(trễ tiếng − 60, D theo dao động, trần). Chưa có số tiếng ⇒ D theo dao động. */
export function dNetTheoTieng(treTieng: number | null, dJitter: number, tran = 150): number {
  if (treTieng == null || !Number.isFinite(treTieng)) return Math.min(dJitter, tran)
  return kep(treTieng - 60, Math.min(dJitter, tran), tran)
}

export function taoDemPhat(tuy: TuyChonDem = {}) {
  const dMin = tuy.dMin ?? 30, dMax = tuy.dMax ?? 150, buoc = tuy.buoc ?? 2, cuaSo = tuy.cuaSo ?? 2000, them = tuy.mayYeu ? 16 : 0
  const net = new Map<string, NetDem>()
  let troHang: { t: number; x: number; y: number }[] = []
  // Lệch đồng hồ: min theo hai xô 5 giây (xô hiện tại + xô trước) ⇒ bám được trôi đồng hồ mà không giữ mẫu.
  let xoMoc = -1, xoNay = Infinity, xoTruoc = Infinity
  let mau: { luc: number; j: number }[] = []
  let lo = 16, tGuiTruoc = -1
  let d = dMin + them, mocTruoc = -Infinity, treTieng: number | null = null
  let muon = 0, muonToiDa = 0, mat = 0, goi = 0
  const lech = (): number => Math.min(xoNay, xoTruoc)

  /** Nạp một gói vừa nhận (`nhan` = đồng hồ máy em lúc nhận, ms). */
  function nap(g: GoiDiem, nhan: number): void {
    goi += 1
    const xo = Math.floor(nhan / XO)
    if (xo !== xoMoc) { xoTruoc = xo === xoMoc + 1 ? xoNay : Infinity; xoNay = Infinity; xoMoc = xo }
    const lechGoi = nhan - g.tGui
    if (lechGoi < xoNay) xoNay = lechGoi
    mau.push({ luc: nhan, j: Math.max(0, lechGoi - lech()) })
    if (mau.length > 400) mau = mau.slice(-300)
    if (tGuiTruoc >= 0 && g.tGui > tGuiTruoc) lo = lo * 0.8 + kep(g.tGui - tGuiTruoc, 8, 50) * 0.2
    tGuiTruoc = Math.max(tGuiTruoc, g.tGui)
    if (g.k === 'tro') { troHang.push({ t: g.tGui, x: g.x, y: g.y }); if (troHang.length > 60) troHang = troHang.slice(-40); return }
    if (g.k === 'nhac') { const n = net.get(g.id); if (n && !n.nhac) { n.nhac = true; n.nhacLuc = g.tGui; n.tong = g.tong } return }
    let n = net.get(g.dau.id)
    if (!n) { n = { dau: g.dau, diem: [], gio: [], cao: 0, daVe: 0, cuoi: -1, soPhat: 0, nhac: false, nhacLuc: 0, tong: null }; net.set(g.dau.id, n) }
    const mocNay = nhan - lech() - d
    // Ghi theo CHỈ SỐ trong nét: gói tới lệch thứ tự / gói lặp lấp đúng chỗ; điểm mà mốc phát đã đi qua (tới quá muộn) thì bỏ.
    for (let i = 0; i < g.diem.length; i++) {
      const k = g.tu + i
      if (k < n.daVe || n.diem[k]) continue
      n.diem[k] = g.diem[i]!; n.gio[k] = g.tGoc + g.diem[i]![3]
      const tre = mocNay - n.gio[k]!
      if (tre > 0 && n.soPhat > 0) { muon += 1; if (tre > muonToiDa) muonToiDa = tre }
    }
    n.cao = Math.max(n.cao, g.tu + g.diem.length)
  }

  function p95(nay: number): number {
    while (mau.length && nay - mau[0]!.luc > cuaSo) mau.shift()
    if (!mau.length) return 0
    const s = mau.map((x) => x.j).sort((a, b) => a - b)
    return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]!
  }

  /** Gọi MỖI KHUNG HÌNH (`nay` = đồng hồ máy em, cùng gốc với `nhan`). */
  function khung(nay: number): KhungPhat {
    const dJitter = kep(p95(nay) + lo + them, dMin + them, dMax)
    const dich = Math.max(dJitter, dNetTheoTieng(treTieng, dJitter, dMax))
    d += kep(dich - d, -buoc, buoc)
    if (!Number.isFinite(lech())) return { net: [], tro: null, d }
    let moc = nay - lech() - d
    if (moc < mocTruoc) moc = mocTruoc // không bao giờ đi lùi
    mocTruoc = moc
    const ra: NetDangViet[] = []
    for (const [id, n] of net) {
      const moi: DiemBut[] = [], daCo = n.soPhat
      let ke = -1
      for (;;) {
        // Điểm kế tiếp ĐÃ CÓ (bỏ qua lỗ). Tới hạn ⇒ phát; lỗ nằm trước nó coi như mất (bản chốt từ sổ nét sẽ thay).
        ke = n.daVe
        while (ke < n.cao && !n.diem[ke]) ke++
        if (ke >= n.cao) { ke = -1; break }
        if (n.gio[ke]! > moc) break
        mat += ke - n.daVe
        moi.push(n.diem[ke]!); n.cuoi = ke; n.daVe = ke + 1; n.soPhat += 1
      }
      let head: NetDangViet['head'] = null
      if (n.cuoi >= 0) {
        const a = n.diem[n.cuoi]!, ta = n.gio[n.cuoi]!, b = ke >= 0 ? n.diem[ke] : undefined, tb = ke >= 0 ? n.gio[ke]! : 0
        if (b && tb > ta) { const k = kep((moc - ta) / (tb - ta), 0, 1); head = { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, apLuc: a[2] + (b[2] - a[2]) * k } }
        else head = { x: a[0], y: a[1], apLuc: a[2] } // hết điểm: giữ đầu nét
      }
      // Đã nhấc + phát hết ⇒ xong. Gói cuối mất hẳn ⇒ sau 0,5 giây cũng coi là xong (bản chốt từ sổ nét mang đủ điểm).
      const xong = n.nhac && (n.daVe >= Math.max(n.cao, n.tong ?? 0) || moc - n.nhacLuc > 500)
      if (xong) net.delete(id)
      if (moi.length || head || xong) ra.push({ dau: n.dau, moi, daCo, head, xong })
    }
    // Con trỏ lơ lửng: cùng mốc phát với nét.
    let tro: KhungPhat['tro'] = null
    while (troHang.length > 1 && troHang[1]!.t <= moc) troHang.shift()
    const a = troHang[0], b = troHang[1]
    if (a && a.t <= moc) {
      if (b && b.t > a.t) { const k = kep((moc - a.t) / (b.t - a.t), 0, 1); tro = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k } }
      else if (moc - a.t < 1500) tro = { x: a.x, y: a.y } // con trỏ đứng yên quá 1,5 giây không có gói mới ⇒ ẩn
    }
    return { net: ra, tro, d }
  }

  return {
    nap, khung,
    /** Trễ tiếng ước lượng (ms) từ số đo WebRTC; null = chưa có tiếng. */
    datDTheoTieng(ms: number | null): void { treTieng = ms },
    /** Bản chốt từ sổ nét đã tới ⇒ bỏ nét dở cùng id (nếu còn). Trả true nếu nét đang được phát dở. */
    boNet(id: string): boolean { return net.delete(id) },
    /** Nét dở có đang phát không (để lớp trên hoãn bản chốt tới khi phát xong). */
    dangPhat(id: string): boolean { return net.has(id) },
    /** Số điểm của nét dở đã PHÁT ra lớp vẽ (−1 = không có nét này). */
    daPhat(id: string): number { return net.get(id)?.soPhat ?? -1 },
    /** Bỏ hết nét dở (tắt live, sang phiên mới, bảng mới). */
    xoa(): void { net.clear(); troHang = [] },
    /** Đọc số đo và đặt lại các bộ đếm. */
    soDo(nay: number): SoDoDem { const r: SoDoDem = { d, jitter: p95(nay), muon, muonToiDa, mat, goi }; muon = 0; muonToiDa = 0; mat = 0; goi = 0; return r },
  }
}
export type DemPhat = ReturnType<typeof taoDemPhat>
