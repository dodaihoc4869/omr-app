// PHÒNG «SINH TỒN» CỦA CA KIỂM TRA (thầy 13/11: «Chuyển luôn game này sang cả phòng chờ của ca kiểm tra») — luật thuần, test được không cần Cloudflare.
// Chạy trong Durable Object của ca (phong-dau-ion.ts), vào bằng vé (dau-ion-ve.ts); trò do MaySinhTon tính (sinh-ton-may-chu.ts — đúng
// máy trò của phòng chờ Live theo khối). 0 D1, 0 storage, không có đáp án / điểm nào đi qua đây.
//  · Em vào bằng vé đã kiểm ⇒ xếp vào ĐỘI ÍT EM THẬT NHẤT (bằng nhau ⇒ đội số nhỏ). Cùng số báo danh mở ở máy khác ⇒ kết nối cũ đóng 4002.
//  · Đủ 78 em ⇒ đóng 4009 «sang:k+1» (máy em tự nối phòng kế, tối đa 8 phòng một ca).
//  · Máy em gửi chuỗi JSON `{ t: 'st', x: SinhTonGui }`; phòng phát mỗi 250 ms MỘT ảnh `{ t: 'lop', k: 'tro', … }` (đúng dạng TinLop ⇒ màn TroSinhTon dùng chung),
//    lọc riêng từng em («chỉ gửi gần», bản 2 đợt 2).
//  · Thầy bấm Bắt đầu ⇒ `dongTatCa('bat-dau')`: báo `{ t: 'dong' }` rồi đóng mọi kết nối mã 4000 — trò không được cản việc vào bài.
//  · Bước ghép đợt 4: Durable Object đọc đồ + danh hiệu + ĐỘI CẢ HỌC KỲ lúc nhận vé (gom lô, có hạn chờ) rồi mới gọi `vao(kn, ve, doEm)` ⇒ em vào đội cả kỳ
//    (thiếu dữ liệu ⇒ đội ít em nhất như cũ; lệch người ⇒ máy bù bù đủ 4 mỗi đội — `soMayCan`). Danh sách: [sbd, tên, đội, mã đồ gọn?, danh hiệu?].
//    Thống kê ghi theo LÔ qua `du.ghi` (mã phòng `ca:<mã ca>:<k>`): mỗi GHI_MOI_VAN ván, hết em trên sân, em cuối rời, thầy bắt đầu ca — kèm ván thắng / ván
//    chơi theo đội (14/11, chỉ phòng ca: `demDoi`), cùng lô.
import type { SinhTonGui } from '../../src/lib/live-khoi/kieu'
import type { DoEm } from '../../src/lib/live-khoi/tu-do'
import type { NoiDuLieuSt } from './sinh-ton-du-lieu'
import { GHI_MOI_VAN, MaySinhTon } from './sinh-ton-may-chu'

/** Một kết nối của phòng (bọc WebSocket để luật test được không cần Cloudflare). */
export interface KetNoi {
  gui(d: string | Uint8Array): void
  dong(ma: number, lyDo: string): void
  /** Ghi dữ liệu nhỏ lên kết nối (sống qua lúc phòng ngủ). */
  ghiKem(v: unknown): void
}
/** Nội dung vé đã kiểm: mã ca, số báo danh, tên gọi, hạn (ms). */
export interface VeDau { c: string; s: string; t: string; h: number }
/** Tối đa em mỗi phòng. Quá ⇒ sang phòng kế. */
export const TRAN_KET_NOI = 78
/** Tối đa phòng mỗi ca (8 × 78 = 624 em). */
export const SO_PHONG_TOI_DA = 8
/** Mã đóng kết nối — máy em (mang-sanh / MangDau) không nối lại với các mã này. */
export const MA_DONG = { veSai: 4003, thayMay: 4002, day: 4009, batDau: 4000, tat: 4010 } as const

/** Dữ liệu gắn trên kết nối (sống qua lúc phòng ngủ): `st: 1` = kết nối của trò Sinh Tồn, số báo danh, tên gọi, đội 0..3, mã đồ gọn `c`, danh hiệu `dh`. */
export interface KemSinhTon { st: 1; s: string; t: string; doi: number; c?: string; dh?: number }
/** Một dòng danh sách phòng: [số báo danh, tên gọi, đội, mã đồ gọn?, danh hiệu?] (hai phần cuối chỉ có khi em có đồ / danh hiệu). */
type DongDs = [string, string, number] | [string, string, number, string] | [string, string, number, string, number]
interface NguoiSt { sbd: string; ten: string; doi: number; kn: KetNoi; c: string; dh: number }
const dongCua = (n: NguoiSt): DongDs => (n.dh >= 0 ? [n.sbd, n.ten, n.doi, n.c, n.dh] : n.c ? [n.sbd, n.ten, n.doi, n.c] : [n.sbd, n.ten, n.doi])
const gonHop = (c: unknown): string => (typeof c === 'string' && /^[0-8]{4}$/.test(c) ? c : '')
const dhHop = (d: unknown): number => (d === 0 || d === 1 || d === 2 ? d : -1)
/** Gói của máy em dài nhất chừng 90 ký tự; quá 400 ⇒ bỏ. */
const GOI_DAI = 400
export const CHU_BAN_CU_ST = 'Trò Sinh Tồn đã có bản mới. Em tải lại trang để chơi nhé.'
/** Máy còn mảnh trò cũ (đã xoá 13/11) trong bộ nhớ đệm gửi gói vào kiểu cũ ⇒ đóng 4010 kèm dòng này. */
export const CHU_TRO_CU = 'Trò ở phòng chờ đã đổi sang Sinh Tồn. Em tải lại trang để chơi nhé.'

export class PhongSinhTonCa {
  private nguoi = new Map<string, NguoiSt>()
  private theoKn = new Map<KetNoi, NguoiSt>()
  private may: MaySinhTon
  /** Mã ca (đặt từ vé đầu tiên / kết nối khi phòng thức dậy) — mã phòng ghi thống kê `ca:<mã ca>:<k>`. */
  ma = ''
  // Máy bù mang tên như học sinh: tránh tên em đang trong phòng (phòng ca không có danh sách lớp).
  constructor(private bayGio: () => number = Date.now, rng: () => number = Math.random, readonly soPhong = 0, private du?: Pick<NoiDuLieuSt, 'ghi'>) {
    this.may = new MaySinhTon(rng, () => [...this.nguoi.values()].map((n) => n.ten))
    this.may.demDoi = true // phòng ca: đội = đội cả kỳ ⇒ đếm ván thắng / ván chơi theo đội
  }
  /** Ghi thống kê theo LÔ (không chờ; lỗi D1 không chạm phòng). */
  private ghiTk(): void {
    const ds = this.may.layThongKe(), vd = this.may.layVanDoi()
    if (ds.length && this.du && this.ma) this.du.ghi(`ca:${this.ma}:${this.soPhong}`, ds, vd)
  }

  get soNguoi(): number { return this.nguoi.size }
  /** Còn em thật vừa gửi gói ⇒ giữ nhịp 250 ms; hết ⇒ Durable Object được ngủ (kết nối vẫn giữ). */
  canThuc(): boolean { return this.may.soEm > 0 }

  private ds(): DongDs[] { return [...this.nguoi.values()].map(dongCua) }
  private baoDs(): void { const d = JSON.stringify({ t: 'st-ds', ds: this.ds() }); for (const n of this.nguoi.values()) n.kn.gui(d) }
  private doiItNhat(): number {
    const so = [0, 0, 0, 0]
    for (const n of this.nguoi.values()) so[n.doi]++
    let d = 0
    for (let i = 1; i < 4; i++) if (so[i] < so[d]) d = i
    return d
  }

  /** Em vào bằng vé đã kiểm (+ đồ / danh hiệu / đội cả kỳ đã đọc — null = không có dữ liệu). Trả false khi phòng đầy (đã đóng kết nối, chỉ sang phòng kế). */
  vao(kn: KetNoi, ve: VeDau, doEm: DoEm | null = null): boolean {
    this.ma ||= ve.c
    let n = this.nguoi.get(ve.s)
    if (n) {
      // Cùng số báo danh mở ở máy / tab khác (hoặc chính máy đó nối lại): kết nối cũ bị thay, em giữ nguyên đội.
      if (n.kn !== kn) { this.theoKn.delete(n.kn); n.kn.dong(MA_DONG.thayMay, 'Em vừa mở trò Sinh Tồn ở máy hoặc tab khác.') }
      n.kn = kn
    } else {
      if (this.nguoi.size >= TRAN_KET_NOI) { kn.dong(MA_DONG.day, this.soPhong + 1 < SO_PHONG_TOI_DA ? `sang:${this.soPhong + 1}` : 'day'); return false }
      // Đội cả học kỳ (đọc lúc nhận vé) — thiếu ⇒ đội ít em nhất như cũ.
      const dk = doEm?.doi
      n = { sbd: ve.s, ten: String(ve.t || '').slice(0, 16), doi: dk === 0 || dk === 1 || dk === 2 || dk === 3 ? dk : this.doiItNhat(), kn, c: gonHop(doEm?.c), dh: dhHop(doEm?.dh) }
      this.nguoi.set(n.sbd, n)
    }
    this.theoKn.set(kn, n)
    kn.ghiKem({ st: 1, s: n.sbd, t: n.ten, doi: n.doi, ...(n.c ? { c: n.c } : {}), ...(n.dh >= 0 ? { dh: n.dh } : {}) } satisfies KemSinhTon)
    kn.gui(JSON.stringify({ t: 'st-vao', toi: dongCua(n), ds: this.ds() }))
    this.baoDs()
    return true
  }

  /** Phòng vừa thức dậy: dựng lại em từ dữ liệu gắn trên kết nối (đúng đội cũ). */
  khoiPhuc(kn: KetNoi, k: KemSinhTon): void {
    if (!k || k.st !== 1 || typeof k.s !== 'string' || !k.s || ![0, 1, 2, 3].includes(k.doi) || this.nguoi.has(k.s)) return
    const n: NguoiSt = { sbd: k.s, ten: String(k.t || '').slice(0, 16), doi: k.doi, kn, c: gonHop(k.c), dh: dhHop(k.dh) }
    this.nguoi.set(n.sbd, n); this.theoKn.set(kn, n)
  }

  /** Gói của máy em: chỉ nhận chuỗi JSON `{ t: 'st', x }`; gói dài / hỏng / của kết nối lạ ⇒ bỏ. */
  nhan(kn: KetNoi, goi: string | ArrayBuffer): void {
    const n = this.theoKn.get(kn)
    if (!n || typeof goi !== 'string' || goi.length > GOI_DAI) return
    let j: { t?: unknown; x?: SinhTonGui | null }
    try { j = JSON.parse(goi) } catch { return }
    if (!j || j.t !== 'st' || !j.x || typeof j.x !== 'object') return
    this.may.nhan(n.sbd, n.doi, j.x as unknown as Record<string, unknown>, this.bayGio())
  }

  /** Nhịp 250 ms: có ảnh chụp ⇒ phát cho MỖI máy trong phòng — «chỉ gửi gần»: mỗi em chỉ nhận phần quanh mình (sinh-ton-may-chu.ts `GoiSinhTon`). */
  nhip(): void {
    const nay = this.bayGio()
    const anh = this.may.nhip(nay)
    if (!anh) { this.ghiTk(); return } // hết em trên sân ⇒ trò dừng (Durable Object sắp được ngủ) ⇒ ghi
    if (this.may.vanChoGhi >= GHI_MOI_VAN) this.ghiTk()
    const goi = this.may.goi(anh, nay)
    for (const n of this.nguoi.values()) n.kn.gui(goi.cho(n.sbd))
  }

  roi(kn: KetNoi): void {
    const n = this.theoKn.get(kn)
    this.theoKn.delete(kn)
    if (!n || n.kn !== kn) return
    this.nguoi.delete(n.sbd)
    this.may.xoa(n.sbd)
    if (!this.nguoi.size) this.ghiTk()
    this.baoDs()
  }

  /** Thầy bấm Bắt đầu thi (hoặc công tắc tắt): báo mọi máy rồi đóng hết, trò dừng hẳn. */
  dongTatCa(ly: 'bat-dau' | 'tat'): void {
    const s = JSON.stringify({ t: 'dong', ly })
    for (const n of this.nguoi.values()) { n.kn.gui(s); n.kn.dong(ly === 'tat' ? MA_DONG.tat : MA_DONG.batDau, ly) }
    this.nguoi.clear(); this.theoKn.clear(); this.may.dung(); this.ghiTk()
  }
}
