// LIVE BẢNG — ĐỆM PHÁT + NỘI SUY NÉT PHÍA MÁY EM (đặc tả mục 4.4). Thuần: không DOM, không đồng hồ (nơi gọi truyền giờ vào).
// Vấn đề: gói điểm tới thưa và không đều (16–50 ms, có dao động, có mất) trong khi màn vẽ 60 khung/giây ⇒ vẽ ngay khi gói tới thì nét giật từng khúc.
// Cách làm (11/11 làm lại sau khi thầy thử máy thật: «đang bị giật khựng ở máy hs, phải đồng bộ nét bút tức thì mượt mà cực mượt mà»):
//   · mỗi điểm mang giờ theo ĐỒNG HỒ THẦY; độ lệch đồng hồ = giá trị NHỎ NHẤT của (giờ nhận − tGui) trong ~10 giây gần nhất;
//   · ĐỘ ĐỆM D = số lớn hơn trong hai số, + 4 ms, kẹp 30–150 ms, mỗi khung đổi tối đa 2 ms:
//       (a) p95 dao động giờ tới trong 2 giây + KHOẢNG CÁCH LÔ lớn (p90 của ~40 lô gần nhất, không phải trung bình);
//       (b) p95 của «ĐỘ CẦN» từng lô = (giờ tới − lệch) − giờ của điểm MỚI đầu tiên trong lô: đúng bằng độ đệm ít nhất để điểm đó không tới muộn. Số này gồm
//           cả phần máy thầy gom lô chậm / bận (điểm sinh ra lâu rồi mới được gửi) — dao động mạng ở (a) không thấy được phần đó;
//   · MỐC PHÁT là một ĐỒNG HỒ CHẠY (không còn là «bây giờ − lệch − D» cứng): mỗi khung tiến dt × nhịp, nhịp tự chỉnh 0,65 … 1,6 để bám đích
//     «bây giờ − lệch − D». Nét đang viết mà hết điểm (lô về muộn, mất gói) ⇒ đồng hồ ĐỨNG ở điểm mới nhất chứ không chạy vượt; lô tới thì chạy nhanh hơn
//     một chút cho tới khi bắt kịp ⇒ nét CHẢY TIẾP, không dồn cả cục điểm vào một khung (bản trước: mốc phát cứ chạy, lô muộn tới là nhảy cục);
//   · mốc phát KHÔNG BAO GIỜ đi lùi;
//   · mỗi khung trả các điểm vừa tới hạn + ĐẦU NÉT nội suy giữa hai điểm kẹp mốc phát ⇒ đầu nét tiến ở mọi khung;
//   · hết điểm mà nét chưa nhấc ⇒ giữ đầu nét tại điểm cuối, không đoán xa (đoán sai phải rút mực lại = nháy);
//   · CÂY BÚT (`but`): một vị trí duy nhất cho con trỏ — đang có nét thì ở đúng đầu nét, không thì theo con trỏ lơ lửng; không lấy điểm lơ lửng CŨ khi
//     nét đang chạy (bản trước: con trỏ đứng im ở chỗ lơ lửng cuối suốt nét rồi nhảy);
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
/** Cây bút của thầy trên máy em: `cham` = đang chạm bảng (đang viết) · false = lơ lửng. `mau` = màu nét gần nhất ('' = chưa biết);
 *  `net` = mã nét đang viết ('' khi lơ lửng) — lớp vẽ dùng để biết điểm này tính theo bảng cuộn hay theo giấy. */
export interface ButThay { x: number; y: number; cham: boolean; mau: string; net: string }
export interface KhungPhat {
  net: NetDangViet[]; tro: { x: number; y: number } | null; but: ButThay | null; d: number
  /** (11/11) ĐỘ CUỘN bảng đen của thầy tại mốc phát (số lần bề dọc cửa sổ thầy); null = chưa nhận được (lớp vẽ tự trôi theo bút). */
  cuon: number | null
}
export interface SoDoDem {
  /** D hiện tại (ms). */
  d: number
  /** p95 dao động giờ tới trong cửa sổ (ms). */
  jitter: number
  /** Điểm tới MUỘN hơn mốc phát: số lần + mức muộn lớn nhất (ms) kể từ lần đọc trước. */
  muon: number
  muonToiDa: number
  /** Điểm bị thủng (mất ≥ 2 gói liền) kể từ lần đọc trước. */
  mat: number
  goi: number
  /** Số khung đầu nét phải ĐỨNG vì hết điểm + quãng đứng dài nhất (ms) kể từ lần đọc trước. */
  dung: number
  dungToiDa: number
  /** Mốc phát đang chậm hơn đích bao nhiêu (ms): > 0 = đang bắt kịp sau một lần hết điểm. */
  cham: number
}

/** `diem[i]` = điểm thứ i của nét (lỗ = gói chưa tới / đã mất); `gio[i]` = giờ live của thầy (ms) của điểm đó; `cao` = chỉ số cao nhất đã nhận + 1;
 *  `daVe` = chỉ số kế tiếp sẽ phát; `cuoi` = chỉ số điểm vừa phát gần nhất (−1 = chưa phát điểm nào); `soPhat` = số điểm đã phát ra lớp vẽ;
 *  `lucNhan` = đồng hồ máy em lúc nhận gói gần nhất của nét. */
interface NetDem { dau: DauNet; tGoc: number; diem: (DiemBut | undefined)[]; gio: number[]; cao: number; daVe: number; cuoi: number; soPhat: number; nhac: boolean; nhacLuc: number; tong: number | null; lucNhan: number }
const kep = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)
const XO = 5000
/** Đồng hồ phát bám đích: hằng số thời gian (ms) + nhịp chậm nhất / nhanh nhất. */
const BAM_MS = 120, NHIP_MIN = 0.65, NHIP_MAX = 1.6
/** Lệch đích quá ngần này (máy em vừa quay lại, đồng hồ nhảy) ⇒ đặt thẳng, không bám dần. */
const NHAY_MS = 400
/** Nét dở im lặng quá ngần này (gói cuối + tin nhấc đều mất) ⇒ thôi giữ đồng hồ, bản chốt từ sổ nét sẽ thay. */
const BO_GIU_MS = 350
/** Dư an toàn cộng vào D (ms). */
const DU_MS = 4

/** D nét theo trễ tiếng ước lượng (đặc tả 4.4): kẹp(trễ tiếng − 60, D theo dao động, trần). Chưa có số tiếng ⇒ D theo dao động. */
export function dNetTheoTieng(treTieng: number | null, dJitter: number, tran = 150): number {
  if (treTieng == null || !Number.isFinite(treTieng)) return Math.min(dJitter, tran)
  return kep(treTieng - 60, Math.min(dJitter, tran), tran)
}

export function taoDemPhat(tuy: TuyChonDem = {}) {
  const dMin = tuy.dMin ?? 30, dMax = tuy.dMax ?? 150, buoc = tuy.buoc ?? 2, cuaSo = tuy.cuaSo ?? 2000, them = tuy.mayYeu ? 16 : 0
  const net = new Map<string, NetDem>()
  let troHang: { t: number; x: number; y: number }[] = []
  // Độ cuộn bảng đen của thầy (gói `tro` có x > 1,5): hàng chờ theo giờ gửi + giá trị đã tới mốc phát.
  let cuonHang: { t: number; v: number }[] = [], cuonNay: number | null = null
  // Lệch đồng hồ: min theo hai xô 5 giây (xô hiện tại + xô trước) ⇒ bám được trôi đồng hồ mà không giữ mẫu.
  let xoMoc = -1, xoNay = Infinity, xoTruoc = Infinity
  let mau: { luc: number; j: number }[] = [], can: { luc: number; v: number }[] = []
  // Khoảng cách giữa hai lần gửi liền nhau của thầy (ms, 8–120; dài hơn = thầy nghỉ tay, không tính): giữ ~40 số gần nhất, lấy p90.
  let cachLo: number[] = [], lo = 16, tGuiTruoc = -1
  let d = dMin + them, tp = -Infinity, nayTruoc = 0, treTieng: number | null = null
  let muon = 0, muonToiDa = 0, mat = 0, goi = 0, dung = 0, dungToiDa = 0, dungNay = 0
  // Màu nét gần nhất (cho ngòi của cây bút).
  let mauBut = ''
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
    if (tGuiTruoc >= 0 && g.tGui > tGuiTruoc && g.tGui - tGuiTruoc <= 120) {
      cachLo.push(Math.max(8, g.tGui - tGuiTruoc))
      if (cachLo.length > 40) cachLo.shift()
      const s = cachLo.slice().sort((a, b) => a - b)
      lo = s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]!
    }
    tGuiTruoc = Math.max(tGuiTruoc, g.tGui)
    if (g.k === 'tro' && g.x > 1.5) { cuonHang.push({ t: g.tGui, v: g.y }); if (cuonHang.length > 60) cuonHang = cuonHang.slice(-40); return }
    if (g.k === 'tro') { troHang.push({ t: g.tGui, x: g.x, y: g.y }); if (troHang.length > 90) troHang = troHang.slice(-60); return }
    if (g.k === 'nhac') { const n = net.get(g.id); if (n && !n.nhac) { n.nhac = true; n.nhacLuc = g.tGui; n.tong = g.tong } return }
    let n = net.get(g.dau.id)
    if (!n) { n = { dau: g.dau, tGoc: g.tGoc, diem: [], gio: [], cao: 0, daVe: 0, cuoi: -1, soPhat: 0, nhac: false, nhacLuc: 0, tong: null, lucNhan: nhan }; net.set(g.dau.id, n) }
    n.lucNhan = nhan
    // Ghi theo CHỈ SỐ trong nét: gói tới lệch thứ tự / gói lặp lấp đúng chỗ; điểm mà mốc phát đã đi qua (tới quá muộn) thì bỏ.
    let dauMoi = true
    for (let i = 0; i < g.diem.length; i++) {
      const k = g.tu + i
      if (k < n.daVe || n.diem[k]) continue
      n.diem[k] = g.diem[i]!; n.gio[k] = g.tGoc + g.diem[i]![3]
      // «độ cần» của lô = tuổi của điểm mới đầu tiên lúc lô tới (đo trên đồng hồ thầy đã trừ lệch); bỏ số vô lí (thầy ngừng tay giữa nét)
      if (dauMoi) { dauMoi = false; const v = nhan - lech() - n.gio[k]!; if (v >= 0 && v < 400) { can.push({ luc: nhan, v }); if (can.length > 400) can = can.slice(-300) } }
      const tre = tp - n.gio[k]!
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

  function canP95(nay: number): number {
    while (can.length && nay - can[0]!.luc > cuaSo) can.shift()
    if (!can.length) return 0
    const s = can.map((x) => x.v).sort((a, b) => a - b)
    return s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]!
  }

  /** Gọi MỖI KHUNG HÌNH (`nay` = đồng hồ máy em, cùng gốc với `nhan`). */
  function khung(nay: number): KhungPhat {
    const dJitter = kep(Math.max(p95(nay) + lo, canP95(nay)) + DU_MS + them, dMin + them, dMax)
    const dich = Math.max(dJitter, dNetTheoTieng(treTieng, dJitter, dMax))
    d += kep(dich - d, -buoc, buoc)
    if (!Number.isFinite(lech())) return { net: [], tro: null, but: null, d, cuon: cuonNay }
    // ── đồng hồ phát ──
    const muc = nay - lech() - d, dt = nay - nayTruoc
    nayTruoc = nay
    let moc: number
    if (!Number.isFinite(tp) || Math.abs(muc - tp) > NHAY_MS || !(dt > 0) || dt > 250) moc = Math.max(Number.isFinite(tp) ? tp : -Infinity, muc)
    else {
      // bám đích nhưng không vượt qua đích (khung hình thưa, dt lớn, thì phép nhân nhịp có thể vọt quá)
      const ung = tp + dt * kep(1 + (muc - tp) / BAM_MS, NHIP_MIN, NHIP_MAX)
      moc = tp <= muc ? Math.min(ung, muc) : Math.max(ung, muc)
    }
    // Nét đang viết (chưa nhấc) mà sắp hết điểm ⇒ đồng hồ chỉ chạy tới điểm mới nhất của nét đó (đứng chờ lô sau, không vượt).
    let giu = Infinity
    for (const n of net.values()) {
      if (n.nhac || n.cao <= 0 || nay - n.lucNhan > BO_GIU_MS) continue
      const t = n.gio[n.cao - 1]
      if (t != null && t < giu) giu = t
    }
    if (moc > giu) {
      moc = Math.max(Number.isFinite(tp) ? tp : giu, giu)
      dung += 1; dungNay += dt > 0 && dt < 250 ? dt : 0; if (dungNay > dungToiDa) dungToiDa = dungNay
    } else dungNay = 0
    tp = moc
    const ra: NetDangViet[] = []
    let dauBut: { x: number; y: number } | null = null, dauCuoi: { x: number; y: number } | null = null, netBut = ''
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
      if (head) { dauCuoi = head; mauBut = n.dau.mau; if (!xong) { dauBut = head; netBut = id } }
      if (moi.length || head || xong) ra.push({ dau: n.dau, moi, daCo, head, xong })
    }
    // Đang có đầu nét ⇒ nó là mốc lơ lửng mới nhất, các mốc lơ lửng cũ hơn bỏ: nhấc bút xong con trỏ trượt TỪ CUỐI NÉT tới mốc lơ lửng kế tiếp
    // (không quay về chỗ lơ lửng trước khi viết).
    if (dauCuoi) {
      let i = 0
      while (i < troHang.length && troHang[i]!.t <= moc) i++
      troHang = [{ t: moc, x: dauCuoi.x, y: dauCuoi.y }, ...troHang.slice(i)]
    }
    // Con trỏ lơ lửng: cùng mốc phát với nét.
    let tro: KhungPhat['tro'] = null
    while (troHang.length > 1 && troHang[1]!.t <= moc) troHang.shift()
    const a = troHang[0], b = troHang[1]
    if (a && a.t <= moc) {
      if (b && b.t > a.t) { const k = kep((moc - a.t) / (b.t - a.t), 0, 1); tro = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k } }
      else if (moc - a.t < 1500) tro = { x: a.x, y: a.y } // con trỏ đứng yên quá 1,5 giây không có gói mới ⇒ ẩn
    }
    const but: ButThay | null = dauBut ? { x: dauBut.x, y: dauBut.y, cham: true, mau: mauBut, net: netBut } : tro ? { x: tro.x, y: tro.y, cham: false, mau: mauBut, net: '' } : null
    // độ cuộn của thầy: áp đúng lúc mốc phát đi qua (cùng nhịp với nét)
    while (cuonHang.length && cuonHang[0]!.t <= moc) cuonNay = cuonHang.shift()!.v
    return { net: ra, tro, but, d, cuon: cuonNay }
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
    /** Bản chốt của nét (từ sổ nét, đường tin cậy) tới trong lúc nét dở còn đang phát ⇒ VÁ các điểm còn thiếu (gói cuối mất) bằng điểm của bản chốt,
     *  nét phát nốt cho hết rồi chốt tại chỗ — không phải xoá nét dở vẽ lại. Điểm đã phát / đã có thì giữ nguyên. Trả số điểm vừa vá. */
    va(id: string, diem: readonly DiemBut[]): number {
      const n = net.get(id)
      if (!n) return 0
      let so = 0
      for (let k = n.daVe; k < diem.length; k++) if (!n.diem[k]) { n.diem[k] = diem[k]!; n.gio[k] = n.tGoc + diem[k]![3]; so++ }
      if (diem.length > n.cao) n.cao = diem.length
      if (!n.nhac) { n.nhac = true; n.nhacLuc = n.gio[n.cao - 1] ?? 0 }
      n.tong = diem.length
      return so
    },
    /** Bỏ hết nét dở (tắt live, sang phiên mới, bảng mới). */
    xoa(): void { net.clear(); troHang = []; cuonHang = []; cuonNay = null },
    /** Đọc số đo và đặt lại các bộ đếm. */
    soDo(nay: number): SoDoDem {
      const r: SoDoDem = { d, jitter: p95(nay), muon, muonToiDa, mat, goi, dung, dungToiDa, cham: Number.isFinite(tp) && Number.isFinite(lech()) ? Math.max(0, nay - lech() - d - tp) : 0 }
      muon = 0; muonToiDa = 0; mat = 0; goi = 0; dung = 0; dungToiDa = 0
      return r
    },
  }
}
export type DemPhat = ReturnType<typeof taoDemPhat>
