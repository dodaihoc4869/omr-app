// LIVE BẢNG — ĐỆM PHÁT + NỘI SUY NÉT PHÍA MÁY EM (đặc tả mục 4.4). Thuần: không DOM, không đồng hồ (nơi gọi truyền giờ vào).
// Vấn đề: gói điểm tới thưa và không đều (16–50 ms, có dao động, có mất) trong khi màn vẽ 60 khung/giây ⇒ vẽ ngay khi gói tới thì nét giật từng khúc.
// Cách làm (11/11 làm lại sau khi thầy thử máy thật: «đang bị giật khựng ở máy hs, phải đồng bộ nét bút tức thì mượt mà cực mượt mà»):
//   · mỗi điểm mang giờ theo ĐỒNG HỒ THẦY; độ lệch đồng hồ = giá trị NHỎ NHẤT của (giờ nhận − tGui) trong ~10 giây gần nhất;
//   · ĐỘ ĐỆM D = số lớn hơn trong hai số, + 3 ms, kẹp 14–450 ms (trần 150 → 450 từ 12/11, xem cuối; sàn 30 → 22 từ 11/11 lần 2, 22 → 14 từ 12/11: đồng hồ phát đã biết đứng chờ khi hết điểm nên sàn thấp
//     không còn gây nhảy cục; mô phỏng đường DataChannel sạch: trễ 63 → 55 ms, 0 khung đứng), mỗi khung đổi tối đa 2 ms:
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
// MẠNG YẾU (12/11, thầy: «thử iphone mạng wifi 1 vạch nét chữ ko mượt») — thà chậm thêm một chút còn hơn giật cục:
//   · TRẦN D 150 → 450 ms. D lấy số lớn hơn của cửa sổ NHANH (2 giây, p95) và cửa sổ CHẬM (10 giây, p90): mạng vừa xấu thì nới ngay, mạng tốt lại thì
//     ~10 giây sau mới rút. Nới tối đa 12 % tốc độ phát, rút 6 % (tính theo THỜI GIAN, không theo số khung: máy 30 khung/giây đổi cùng tốc độ);
//   · SẮP HẾT ĐIỂM mà lô kế đã quá hẹn ⇒ đồng hồ phát CHẬM DẦN (tới 0,3 lần) trước khi phải đứng, không chạy hết tốc lực rồi khựng;
//   · TỒN ĐỌNG sau khi đứt (gói về dồn cục): ≥ 150 ms thì phát bù nhanh dần tới ×2,5; quá 1,2 giây thì HIỆN NGAY phần cũ, chỉ phát động 0,5 giây mới nhất
//     (bản trước: tồn > 0,4 giây là hiện vụt cả đoạn);
//   · `canTro(nay)`: vừa có điểm bị thủng (mất nhiều gói liền, dư thừa trong gói không vá nổi) hoặc vừa có lô tới muộn hơn độ đệm quá 100 ms ⇒ máy em xin THÊM điểm qua đường
//     WebSocket của phòng (tin cậy) trong 20 giây; gói của đường phụ đó nạp với `phu = true` (không tính vào dao động của đường chính).
import type { DiemBut } from '../but-bang-loi'
import type { DauNet, GoiDiem } from './ma-net'

export interface TuyChonDem {
  /** Kẹp dưới / trên của D (ms). Mặc định 14 … 450. */
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
/** `lz` (13/11) = con trỏ lơ lửng của thầy đang ở chế độ CHẤM LAZE (phím P) ⇒ lớp vẽ vẽ chấm đỏ thay cây bút. */
export interface ButThay { x: number; y: number; cham: boolean; mau: string; net: string; lz?: boolean }
export interface KhungPhat {
  net: NetDangViet[]; tro: { x: number; y: number; lz?: boolean } | null; but: ButThay | null; d: number
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
  /** (12/11) Số lần phải HIỆN NGAY một đoạn cũ vì tồn đọng quá 1,2 giây · đang cần đường phụ WebSocket không · MỨC MẠNG cho giao diện:
   *  0 = tốt · 1 = đang nới đệm (D > 120 ms hoặc đang cần đường phụ) · 2 = kém (D > 280 ms hoặc vừa có lô tới muộn hơn độ đệm > 300 ms). */
  vut: number
  tro: boolean
  muc: 0 | 1 | 2
}

/** `diem[i]` = điểm thứ i của nét (lỗ = gói chưa tới / đã mất); `gio[i]` = giờ live của thầy (ms) của điểm đó; `cao` = chỉ số cao nhất đã nhận + 1;
 *  `daVe` = chỉ số kế tiếp sẽ phát; `cuoi` = chỉ số điểm vừa phát gần nhất (−1 = chưa phát điểm nào); `soPhat` = số điểm đã phát ra lớp vẽ;
 *  `lucNhan` = đồng hồ máy em lúc nhận gói gần nhất của nét. */
interface NetDem { dau: DauNet; tGoc: number; diem: (DiemBut | undefined)[]; gio: number[]; cao: number; daVe: number; cuoi: number; soPhat: number; nhac: boolean; roi: boolean; nhacLuc: number; tong: number | null; lucNhan: number; lucLo: number | null }
const kep = (v: number, a: number, b: number): number => (v < a ? a : v > b ? b : v)
const XO = 5000
/** Đồng hồ phát bám đích: hằng số thời gian (ms) + nhịp chậm nhất / nhanh nhất. */
const BAM_MS = 120, NHIP_MIN = 0.65, NHIP_MAX = 1.6
/** Mốc phát chạy TRƯỚC đích quá ngần này (đồng hồ lệch vừa đổi) ⇒ đứng chờ đích, không bám dần. */
const NHAY_MS = 400
/** PHÁT BÙ sau khi đứt: tồn đọng từ 150 ms thì nhịp = 1 + tồn / 400, trần ×2,5; tồn quá 1,2 giây ⇒ hiện ngay phần cũ, chỉ phát động 0,5 giây mới nhất. */
const BU_TU_MS = 150, BU_NHIP = 2.5, BU_TRAN_MS = 1200, BU_GIU_MS = 500
/** Sắp hết điểm + lô kế quá hẹn: nhịp = đệm còn lại / 80 ms, không dưới 0,3. */
const CAN_MS = 80, NHIP_CAN = 0.3
/** Cửa sổ chậm của dao động (ms) · tính lại các phân vị mỗi ngần này ms (không sắp xếp ở mọi khung hình). */
const CUA_CHAM = 10_000, TINH_LAI_MS = 100
/** Trần của phần D theo trễ tiếng (ms) — không đổi khi trần D theo dao động lên 450. */
const TRAN_TIENG = 150
/** VỀ SÀN NHANH (12/11, thầy: «nét bút bị chậm hơn»): mẫu rung quá `RUNG_MS` = mạng đang rung; hai mẫu như vậy cách nhau > 1,5 giây = hai ĐỢT rung.
 *  30 giây qua chỉ có một đợt (rung lẻ) và đã yên `YEN_MS` ⇒ độ đệm chỉ tính trên các mẫu SAU đợt rung và rút nhanh gấp đôi (12 % tốc độ phát) —
 *  về sàn trong ~2 giây. Rung lặp lại (≥ 2 đợt) hoặc đợt NẶNG (có gói muộn từ `RUNG_NANG_MS`: TCP chặn đầu hàng, vừa đứt) ⇒ giữ cửa sổ chậm 10 giây
 *  như cũ, không rút vội rồi lại khựng. */
const RUNG_MS = 25, YEN_MS = 300, DOT_CACH_MS = 1500, DOT_NHO_MS = 30_000, RUNG_NANG_MS = 250
/** Xin đường phụ WebSocket trong ngần này ms kể từ lần thủng / lô tới quá muộn gần nhất · lô tới muộn hơn độ đệm quá ngần này ms mới tính là «đứng lâu». */
const TRO_MS = 20_000, DUNG_LAU_MS = 100
/** Nét dở im lặng quá ngần này TRONG KHI gói khác vẫn tới (gói cuối + tin nhấc của nó đều mất) ⇒ thôi giữ đồng hồ, bản chốt từ sổ nét sẽ thay.
 *  Cả đường truyền cùng im (mạng đứt, hoặc thầy dừng tay giữa nét) ⇒ giữ tới `GIU_DUT_MS`: mạng có lại thì phát tiếp từ đúng chỗ dừng. */
const BO_GIU_MS = 350, GIU_DUT_MS = 2500
/** Giữa nét có LỖ (mất nhiều gói liền) mà điểm sau lỗ đã tới, đường phụ đang chảy: chờ nó vá tối đa ngần này ms (lỗ càng ngắn chờ càng ít) rồi mới nối thẳng qua lỗ. */
const CHO_VA_MS = 400
/** Dư an toàn cộng vào D (ms). */
const DU_MS = 3

/** D nét theo trễ tiếng ước lượng (đặc tả 4.4): kẹp(trễ tiếng − 60, D theo dao động, trần). Chưa có số tiếng ⇒ D theo dao động. */
export function dNetTheoTieng(treTieng: number | null, dJitter: number, tran = 150): number {
  if (treTieng == null || !Number.isFinite(treTieng)) return Math.min(dJitter, tran)
  return kep(treTieng - 60, Math.min(dJitter, tran), tran)
}

export function taoDemPhat(tuy: TuyChonDem = {}) {
  const dMin = tuy.dMin ?? 14, dMax = tuy.dMax ?? 450, buoc = tuy.buoc ?? 2, cuaSo = tuy.cuaSo ?? 2000, them = tuy.mayYeu ? 16 : 0
  const net = new Map<string, NetDem>()
  // Nét vừa phát XONG / vừa có bản chốt: gói điểm của nó còn tới muộn (gói lặp, mạng rung, đường phụ chậm) thì bỏ — không dựng lại thành một nét «ma».
  const daXong = new Map<string, number>()
  const ghiXong = (id: string, luc: number): void => { daXong.set(id, luc); if (daXong.size > 80) for (const [k, t] of daXong) { if (luc - t > 15_000 || daXong.size > 60) daXong.delete(k); else break } }
  let troHang: { t: number; x: number; y: number; lz?: boolean }[] = []
  // Độ cuộn bảng đen của thầy (gói `tro` có x > 1,5): hàng chờ theo giờ gửi + giá trị đã tới mốc phát.
  let cuonHang: { t: number; v: number }[] = [], cuonNay: number | null = null
  // Lệch đồng hồ: min theo hai xô 5 giây (xô hiện tại + xô trước) ⇒ bám được trôi đồng hồ mà không giữ mẫu.
  let xoMoc = -1, xoNay = Infinity, xoTruoc = Infinity
  let mau: { luc: number; j: number }[] = [], can: { luc: number; v: number }[] = []
  // Khoảng cách giữa hai lần gửi liền nhau của thầy (ms, 8–120; dài hơn = thầy nghỉ tay, không tính): giữ ~40 số gần nhất, lấy p90.
  let cachLo: number[] = [], lo = 16, tGuiTruoc = -1
  let d = dMin + them, tp = -Infinity, nayTruoc = 0, treTieng: number | null = null
  let muon = 0, muonToiDa = 0, mat = 0, goi = 0, dung = 0, dungToiDa = 0, dungNay = 0, vut = 0
  // phân vị đã tính (làm mới mỗi 100 ms) · lúc nhận gói gần nhất của đường chính · lúc thủng / lô tới quá muộn gần nhất · mức muộn lớn nhất 5 giây qua
  let dJ = 0, lucTinh = -1e9, lucGoi = -1e9, lucXau = -1e9, lucDungLau = -1e9, dungLau = 0, lucPhu = -1e9
  // lúc có mẫu rung gần nhất · lúc bắt đầu của các đợt rung trong 30 giây qua · đang ở chế độ về sàn nhanh
  let lucRung = -1e9, dotRung: number[] = [], veNhanh = false, rungLon = 0
  const ghiRung = (nhan: number, muc: number): void => { if (nhan - lucRung > DOT_CACH_MS) { rungLon = 0; dotRung.push(nhan); while (dotRung.length && nhan - dotRung[0]! > DOT_NHO_MS) dotRung.shift() } if (muc > rungLon) rungLon = muc; lucRung = nhan }
  /** Chờ vá một lỗ dài `rong` ms bao lâu: chỉ chờ khi đường phụ ĐANG chảy (vừa nhận gói của nó trong 3 giây) — không có ai vá thì nối thẳng ngay. */
  const hanVa = (nay: number, rong: number): number => (nay - lucPhu < 3000 ? Math.min(CHO_VA_MS, Math.max(40, rong)) : 0)
  // Màu nét gần nhất (cho ngòi của cây bút).
  let mauBut = ''
  const lech = (): number => Math.min(xoNay, xoTruoc)

  /** Nạp một gói vừa nhận (`nhan` = đồng hồ máy em lúc nhận, ms). `phu` = gói của ĐƯỜNG PHỤ (WebSocket xin thêm khi DataChannel thủng): chỉ lấy điểm,
   *  không tính vào lệch đồng hồ / dao động / khoảng cách lô của đường chính. */
  function nap(g: GoiDiem, nhan: number, phu = false): void {
    goi += 1
    if (phu) { lucPhu = nhan; napDiem(g, nhan, true); return }
    lucGoi = nhan
    const xo = Math.floor(nhan / XO)
    if (xo !== xoMoc) { xoTruoc = xo === xoMoc + 1 ? xoNay : Infinity; xoNay = Infinity; xoMoc = xo }
    const lechGoi = nhan - g.tGui
    if (lechGoi < xoNay) xoNay = lechGoi
    const j = Math.max(0, lechGoi - lech())
    if (j > RUNG_MS) ghiRung(nhan, j)
    mau.push({ luc: nhan, j })
    if (mau.length > 1400) mau = mau.slice(-1000)
    if (tGuiTruoc >= 0 && g.tGui > tGuiTruoc && g.tGui - tGuiTruoc <= 120) {
      cachLo.push(Math.max(8, g.tGui - tGuiTruoc))
      if (cachLo.length > 40) cachLo.shift()
      const s = cachLo.slice().sort((a, b) => a - b)
      lo = s[Math.min(s.length - 1, Math.floor(s.length * 0.9))]!
    }
    tGuiTruoc = Math.max(tGuiTruoc, g.tGui)
    napDiem(g, nhan, false)
  }
  /** Thầy chỉ có MỘT cây bút: đã thấy con trỏ lơ lửng / một nét MỚI ở giờ `t` thì mọi nét dở có điểm mới nhất trước đó đều đã nhấc bút — tin nhấc của
   *  chúng mất cũng thôi GIỮ đồng hồ phát (trước: giữ thêm 350 ms, nét kế phải đứng chờ). Việc chốt nét vẫn theo tin nhấc / bản chốt. */
  function butDaRoi(t: number): void { for (const n of net.values()) if (!n.nhac && !n.roi && n.cao > 0 && n.gio[n.cao - 1]! < t) n.roi = true }
  function napDiem(g: GoiDiem, nhan: number, phu: boolean): void {
    // Con trỏ / độ cuộn: đường phụ không lấy (đường chính đã có, tới sớm hơn). Gói tới LỆCH THỨ TỰ (DataChannel không thứ tự, mạng rung) ⇒ chèn đúng chỗ theo
    // giờ gửi; gói cũ hơn mốc đã phát thì bỏ — không để con trỏ giật lùi.
    if (g.k === 'tro') {
      if (phu) return
      if (g.x <= 1.5) butDaRoi(g.tGui - 30)
      if (g.tGui <= tp) return
      const h: { t: number }[] = g.x > 1.5 ? cuonHang : troHang, m = g.x > 1.5 ? { t: g.tGui, v: g.y } : g.lz ? { t: g.tGui, x: g.x, y: g.y, lz: true } : { t: g.tGui, x: g.x, y: g.y }
      let i = h.length
      while (i > 0 && h[i - 1]!.t > g.tGui) i--
      h.splice(i, 0, m)
      if (cuonHang.length > 60) cuonHang = cuonHang.slice(-40)
      if (troHang.length > 90) troHang = troHang.slice(-60)
      return
    }
    if (g.k === 'nhac') { const n = net.get(g.id); if (n && !n.nhac) { n.nhac = true; n.nhacLuc = g.tGui; n.tong = g.tong } return }
    let n = net.get(g.dau.id)
    if (!n && daXong.has(g.dau.id)) return
    if (!n && !phu) butDaRoi(g.tGoc + (g.diem[0]?.[3] ?? 0) - 30)
    if (!n) { n = { dau: g.dau, tGoc: g.tGoc, diem: [], gio: [], cao: 0, daVe: 0, cuoi: -1, soPhat: 0, nhac: false, roi: false, nhacLuc: 0, tong: null, lucNhan: nhan, lucLo: null }; net.set(g.dau.id, n) }
    if (!phu) n.lucNhan = nhan
    // Ghi theo CHỈ SỐ trong nét: gói tới lệch thứ tự / gói lặp lấp đúng chỗ; điểm mà mốc phát đã đi qua (tới quá muộn) thì bỏ.
    let dauMoi = true
    for (let i = 0; i < g.diem.length; i++) {
      const k = g.tu + i
      if (k < n.daVe || n.diem[k]) continue
      n.diem[k] = g.diem[i]!; n.gio[k] = g.tGoc + g.diem[i]![3]
      // «độ cần» của lô = tuổi của điểm mới đầu tiên lúc lô tới (đo trên đồng hồ thầy đã trừ lệch); bỏ số vô lí (thầy ngừng tay giữa nét)
      if (dauMoi && !phu) {
        dauMoi = false
        const v = nhan - lech() - n.gio[k]!
        if (v >= 0 && v < dMax + 150) { can.push({ luc: nhan, v }); if (can.length > 1400) can = can.slice(-1000) }
        // lô tới MUỘN hơn độ đệm đang dùng quá 100 ms = đầu nét vừa phải đứng vì mạng (khác với thầy dừng tay giữa nét: lúc đó điểm kế tới vẫn «tươi»)
        const tre = v - d
        if (tre > DUNG_LAU_MS) { ghiRung(nhan, v); lucXau = nhan; if (tre > dungLau || nhan - lucDungLau > 5000) { dungLau = tre; lucDungLau = nhan } }
      }
      const tre = tp - n.gio[k]!
      if (tre > 0 && n.soPhat > 0) { muon += 1; if (tre > muonToiDa) muonToiDa = tre }
    }
    n.cao = Math.max(n.cao, g.tu + g.diem.length)
  }

  /** Phân vị `p` của các mẫu trong `ms` gần nhất. */
  const phanVi = (ds: readonly { luc: number }[], lay: (i: number) => number, nay: number, ms: number, p: number): number => {
    const s: number[] = []
    for (let i = ds.length - 1; i >= 0 && nay - ds[i]!.luc <= ms; i--) s.push(lay(i))
    if (!s.length) return 0
    s.sort((a, b) => a - b)
    return s[Math.min(s.length - 1, Math.floor(s.length * p))]!
  }
  function p95(nay: number): number {
    while (mau.length && nay - mau[0]!.luc > CUA_CHAM) mau.shift()
    return phanVi(mau, (i) => mau[i]!.j, nay, cuaSo, 0.95)
  }
  /** D theo dao động (chưa kẹp theo tiếng): số lớn hơn của cửa sổ nhanh (p95) và cửa sổ chậm 10 giây (p90). Tính lại mỗi 100 ms. */
  function dDaoDong(nay: number): number {
    if (nay - lucTinh < TINH_LAI_MS && nay >= lucTinh) return dJ
    lucTinh = nay
    while (can.length && nay - can[0]!.luc > CUA_CHAM) can.shift()
    while (dotRung.length && nay - dotRung[0]! > DOT_NHO_MS) dotRung.shift()
    // rung lẻ đã yên ⇒ chỉ nhìn các mẫu sau đợt rung; còn lại: cửa sổ nhanh 2 giây + cửa sổ chậm 10 giây
    const yen = nay - lucRung
    veNhanh = dotRung.length <= 1 && rungLon < RUNG_NANG_MS && yen > YEN_MS
    const ngan = veNhanh ? Math.min(cuaSo, yen - 1) : cuaSo, dai = veNhanh ? ngan : CUA_CHAM
    const j = Math.max(phanVi(mau, (i) => mau[i]!.j, nay, ngan, 0.95), phanVi(mau, (i) => mau[i]!.j, nay, dai, 0.9))
    const c = Math.max(phanVi(can, (i) => can[i]!.v, nay, ngan, 0.95), phanVi(can, (i) => can[i]!.v, nay, dai, 0.9))
    return (dJ = kep(Math.max(j + lo, c) + DU_MS + them, dMin + them, dMax))
  }

  /** Gọi MỖI KHUNG HÌNH (`nay` = đồng hồ máy em, cùng gốc với `nhan`). */
  function khung(nay: number): KhungPhat {
    const dJitter = dDaoDong(nay)
    const dich = Math.max(dJitter, dNetTheoTieng(treTieng, dJitter, Math.min(TRAN_TIENG, dMax)))
    const dt = nay - nayTruoc, dtc = dt > 0 ? Math.min(dt, 100) : 0
    nayTruoc = nay
    // nới ≤ `buoc` ms mỗi 16,7 ms = 12 % tốc độ phát; rút bằng nửa — riêng rung LẺ đã yên thì rút cũng 12 % (đã thử rút 12 % mọi lúc: mất gói theo chùm
    // đứng nhiều hơn); theo thời gian thật
    d += kep(dich - d, -buoc * (veNhanh ? 1 : 0.5) * (dtc || 16.7) / 16.7, buoc * (dtc || 16.7) / 16.7)
    if (!Number.isFinite(lech())) return { net: [], tro: null, but: null, d, cuon: cuonNay }
    // ── đồng hồ phát ──
    const muc = nay - lech() - d
    // điểm mới nhất của các nét đang viết (chưa nhấc): đồng hồ không chạy vượt nó
    let giu = Infinity
    for (const n of net.values()) {
      // LỖ ngay trước điểm kế tiếp (đã phát tới `cuoi`, điểm `daVe` chưa có mà điểm sau nó đã tới): giữ đồng hồ ở điểm vừa phát, chờ vá có hạn
      if (n.cuoi >= 0 && n.daVe < n.cao && !n.diem[n.daVe]) {
        let ke = n.daVe
        while (ke < n.cao && !n.diem[ke]) ke++
        if (ke < n.cao) {
          if (n.lucLo == null) { n.lucLo = nay; lucXau = nay }
          if (nay - n.lucLo < hanVa(nay, n.gio[ke]! - n.gio[n.cuoi]!)) { if (n.gio[n.cuoi]! < giu) giu = n.gio[n.cuoi]!; continue }
        }
      } else n.lucLo = null
      if (n.nhac || n.roi || n.cao <= 0) continue
      const im = nay - n.lucNhan
      if (im > BO_GIU_MS && (lucGoi - n.lucNhan > 100 || im > GIU_DUT_MS)) continue
      const t = n.gio[n.cao - 1]
      if (t != null && t < giu) giu = t
    }
    let moc: number
    if (!Number.isFinite(tp) || !(dt > 0)) moc = Math.max(Number.isFinite(tp) ? tp : -Infinity, muc)
    else {
      let tu = tp
      const hetDiem = Math.min(muc, giu)
      // tồn đọng quá nhiều (đứt lâu rồi gói về dồn cục, máy em vừa quay lại): hiện ngay phần cũ, chỉ phát động đoạn mới nhất
      if (hetDiem - tu > BU_TRAN_MS) { tu = hetDiem - BU_GIU_MS; vut += 1 }
      const ton = muc - tu
      let nhip: number
      if (ton < -NHAY_MS) nhip = 0
      else if (ton <= 0) nhip = kep(1 + ton / BAM_MS, NHIP_MIN, 1)
      else nhip = kep(Math.max(Math.min(1 + ton / BAM_MS, NHIP_MAX), ton >= BU_TU_MS ? 1 + ton / 400 : 0), 1, BU_NHIP)
      // sắp hết điểm mà lô kế đã quá hẹn ⇒ chậm dần chứ không chạy hết rồi đứng
      if (giu < Infinity && nay - lucGoi > lo + 24) nhip = Math.min(nhip, Math.max(NHIP_CAN, (giu - tu) / CAN_MS))
      const ung = tu + dtc * nhip
      // bám đích nhưng không vượt qua đích (khung hình thưa, dt lớn, thì phép nhân nhịp có thể vọt quá)
      moc = tu <= muc ? Math.min(ung, muc) : Math.max(ung, muc)
    }
    // Nét đang viết (chưa nhấc) mà sắp hết điểm ⇒ đồng hồ chỉ chạy tới điểm mới nhất của nét đó (đứng chờ lô sau, không vượt).
    if (moc > giu) {
      moc = Math.max(Number.isFinite(tp) ? tp : giu, giu)
      dung += 1; dungNay += dtc; if (dungNay > dungToiDa) dungToiDa = dungNay
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
        // có lỗ trước điểm này: còn trong hạn chờ vá thì chưa đi qua (đầu nét đứng ở điểm vừa phát); hết hạn ⇒ nối thẳng qua lỗ, bản chốt sẽ sửa hình
        if (ke > n.daVe) {
          if (n.cuoi >= 0 && n.lucLo != null && nay - n.lucLo < hanVa(nay, n.gio[ke]! - n.gio[n.cuoi]!)) { ke = -1; break }
          mat += ke - n.daVe; lucXau = nay
        }
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
      if (xong) { net.delete(id); ghiXong(id, nay) }
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
      else if (moc - a.t < 1500) tro = { x: a.x, y: a.y } // con trỏ đứng yên quá 1,5 giây không có gói mới ⇒ ẩn (laze: tờ nhắc lại vị trí 0,7 giây một lần)
      if (tro && a.lz) tro.lz = true
    }
    const but: ButThay | null = dauBut ? { x: dauBut.x, y: dauBut.y, cham: true, mau: mauBut, net: netBut } : tro ? { x: tro.x, y: tro.y, cham: false, mau: mauBut, net: '', ...(tro.lz ? { lz: true } : {}) } : null
    // độ cuộn của thầy: áp đúng lúc mốc phát đi qua (cùng nhịp với nét)
    while (cuonHang.length && cuonHang[0]!.t <= moc) cuonNay = cuonHang.shift()!.v
    return { net: ra, tro, but, d, cuon: cuonNay }
  }

  return {
    nap, khung,
    /** Trễ tiếng ước lượng (ms) từ số đo WebRTC; null = chưa có tiếng. */
    datDTheoTieng(ms: number | null): void { treTieng = ms },
    /** Bản chốt từ sổ nét đã tới ⇒ bỏ nét dở cùng id (nếu còn). Trả true nếu nét đang được phát dở. */
    boNet(id: string): boolean { ghiXong(id, nayTruoc); return net.delete(id) },
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
    /** (12/11) Vừa có điểm thủng hoặc vừa đứng lâu trong 20 giây qua ⇒ nên xin thêm điểm qua đường phụ WebSocket của phòng. */
    canTro(nay: number): boolean { return nay - lucXau < TRO_MS },
    /** Bỏ hết nét dở (tắt live, sang phiên mới, bảng mới). */
    xoa(): void { net.clear(); daXong.clear(); troHang = []; cuonHang = []; cuonNay = null },
    /** Đọc số đo và đặt lại các bộ đếm. */
    soDo(nay: number): SoDoDem {
      const tro = nay - lucXau < TRO_MS, dungGan = nay - lucDungLau < 5000 ? dungLau : 0
      const r: SoDoDem = { d, jitter: p95(nay), muon, muonToiDa, mat, goi, dung, dungToiDa, cham: Number.isFinite(tp) && Number.isFinite(lech()) ? Math.max(0, nay - lech() - d - tp) : 0, vut, tro, muc: d > 280 || dungGan > 300 ? 2 : d > 120 || tro ? 1 : 0 }
      muon = 0; muonToiDa = 0; mat = 0; goi = 0; dung = 0; dungToiDa = 0; vut = 0
      return r
    },
  }
}
export type DemPhat = ReturnType<typeof taoDemPhat>
