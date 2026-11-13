// MÁY TRÒ «SINH TỒN» DÙNG CHUNG (13/11 — tách nguyên văn khỏi kenh-lop-may.ts để phòng chờ CA KIỂM TRA chơi cùng một trò với phòng chờ Live theo khối).
// Thuần bộ nhớ: 0 D1, 0 storage, không hẹn giờ, không gửi mạng — nơi dùng (KenhLopMay của live · PhongSinhTonCa của ca) lo nhịp 250 ms và phát ảnh chụp.
// Việc của lớp này: gom gói từng em (kẹp toạ độ / máu / cấp, mục tiêu + kẻ hạ phải có thật và khác đội), tính MÁY BÙ CHỖ, lượt hạ theo ván, hộp tiếp tế,
// cỡ bản đồ theo sĩ số, rồi trả MỘT ảnh chụp mỗi nhịp. Hợp đồng gói / ảnh: src/lib/live-khoi/kieu.ts (SinhTonGui · SinhTonAnh).
import type { SinhTonAnh, SinhTonDong } from '../../src/lib/live-khoi/kieu'
import { CAP_TOI_DA, MAU_DAY, capBanDo, dangNghi, hopSo, laMay, taoBanDo, vanSo, type BanDo, type NhanVat } from '../../src/lib/live-khoi/sinh-ton-loi'
import { buocMay, khopMay, mayLenCap, mayThanh, type May } from '../../src/lib/live-khoi/sinh-ton-may'

/** Phòng phát một ảnh chụp mỗi 250 ms. */
export const TRO_NHIP_MS = 250
/** Gói của một em đến nhanh hơn 180 ms so với gói trước ⇒ bỏ. */
const TRO_GUI_MS = 180
/** Em im quá 5 giây ⇒ gỡ khỏi sân (máy bù vào thay). */
const TRO_IM_MS = 5000
/** Một em chỉ được báo «bị hạ» mỗi 2,5 giây (hồi sinh mất 3 giây) — chặn báo lặp. */
const TRO_HA_MS = 2500
const kep = (v: unknown, tu: number, den: number): number | null => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(den, Math.max(tu, n)) : null }

export class MaySinhTon {
  private tro = new Map<string, { p: SinhTonDong; luc: number; gui: number; ha: number }>()
  private an: [string, string][] = []
  private may: May[] = []
  private diem: [number, number, number, number] = [0, 0, 0, 0]
  private van = -1
  /** Số thứ tự ván kể từ lúc trò bắt đầu ở phòng này (hiện trên màn: «Ván 2»). */
  private soVan = 0
  private bd: BanDo = taoBanDo(0)
  private hop: [number, string] = [-1, '']
  private lucNhip = 0
  /** `tenTranh` = tên em thật mà máy bù phải tránh (máy mang tên như học sinh — src/lib/live-khoi/ten-may.ts); chỉ gọi lúc phải thêm máy. */
  constructor(private rng: () => number = Math.random, private tenTranh?: () => Iterable<string>) {}

  /** Số em THẬT đang có trên sân (đã gửi gói trong 5 giây gần nhất, tính tới nhịp vừa rồi). */
  get soEm(): number { return this.tro.size }

  /** Gói `SinhTonGui` của em `id` (đội `doi` do PHÒNG đóng dấu, không tin máy em). Gói sai dạng / quá nhanh ⇒ bỏ. */
  nhan(id: string, doi: number, x: Record<string, unknown>, nay: number): void {
    if (doi !== 0 && doi !== 1 && doi !== 2 && doi !== 3) return
    const cu = this.tro.get(id)
    if (cu && nay - cu.gui < TRO_GUI_MS) return
    const p = Array.isArray(x.p) ? x.p : [], px = kep(p[0], 0, this.bd.rong), py = kep(p[1], 0, this.bd.cao), mau = kep(p[2], 0, MAU_DAY), cap = kep(p[3], 1, CAP_TOI_DA)
    if (px == null || py == null || mau == null || cap == null) return
    // Mục tiêu khai phải có thật và khác đội; kẻ hạ cũng vậy.
    const doiCua = (ma: unknown): number => (typeof ma !== 'string' || ma === id ? -1 : this.tro.get(ma)?.p[3] ?? this.may.find((m) => m.id === ma)?.doi ?? -1)
    const dt = doiCua(x.t)
    const moi = { p: [px, py, mau, doi, cap, dt >= 0 && dt !== doi ? (x.t as string) : ''] as SinhTonDong, luc: nay, gui: nay, ha: cu?.ha ?? 0 }
    // Em đầu tiên của sân: mốc cho bước máy bù ở nhịp kế.
    if (!this.tro.size) this.lucNhip = nay
    this.tro.set(id, moi)
    const da = doiCua(x.a)
    if (da >= 0 && da !== doi && nay - moi.ha >= TRO_HA_MS && !dangNghi(nay) && this.an.length < 60) {
      moi.ha = nay
      this.ghiHa(x.a as string, id, da)
    }
    // Hộp tiếp tế: em chạm đầu tiên của mỗi hộp được nhận.
    if (typeof x.h === 'number' && x.h === hopSo(nay) && this.hop[0] !== x.h && mau > 0 && !dangNghi(nay)) this.hop = [x.h, id]
  }

  private ghiHa(ai: string, bi: string, doiAi: number): void {
    this.an.push([ai, bi])
    this.diem[doiAi]++
    if (laMay(ai)) { const m = this.may.find((v) => v.id === ai); if (m) mayLenCap(m) }
  }

  /** Em rời phòng ⇒ gỡ ngay (không đợi 5 giây im); nhịp kế máy bù vào thay. */
  xoa(id: string): void { this.tro.delete(id) }

  /** Trò dừng hẳn (thầy bấm Bắt đầu, phòng đóng, hết em thật): xoá mọi trạng thái, máy bù rời sân. */
  dung(): void { this.tro.clear(); this.an = []; this.may = []; this.van = -1; this.soVan = 0; this.diem = [0, 0, 0, 0]; this.hop = [-1, ''] }

  /** Một nhịp 250 ms: gỡ em im, ván mới, khớp + bước máy bù. Trả ảnh chụp để phát; không còn em thật ⇒ tự xoá trạng thái và trả null. */
  nhip(nay: number): SinhTonAnh | null {
    for (const [s, v] of this.tro) if (nay - v.luc > TRO_IM_MS) this.tro.delete(s)
    if (!this.tro.size) { this.dung(); return null }
    // Ván mới: xoá điểm, chọn cỡ bản đồ theo sĩ số, máy về trại.
    const van = vanSo(nay)
    const soEm = [0, 0, 0, 0]
    for (const v of this.tro.values()) soEm[v.p[3]]++
    if (van !== this.van) {
      // Ván ĐẦU (trò vừa bắt đầu) giữ lượt hạ đã ghi trước nhịp đầu; các ván sau xoá điểm.
      if (this.van !== -1) { this.diem = [0, 0, 0, 0]; this.an = [] }
      this.van = van; this.soVan++; this.may = []
      this.bd = taoBanDo(capBanDo(soEm.reduce((t, n) => t + Math.max(4, n), 0)))
    }
    this.may = khopMay(this.bd, this.may, soEm, nay, this.rng, this.tenTranh)
    const that: NhanVat[] = []
    for (const [s, v] of this.tro) that.push({ id: s, x: v.p[0], y: v.p[1], mau: v.p[2], doi: v.p[3], cap: v.p[4], t: v.p[5] })
    const dt = Math.min(1000, Math.max(0, nay - this.lucNhip))
    this.lucNhip = nay
    const anhMay = this.may.map(mayThanh)
    for (let i = 0; i < this.may.length; i++) {
      const m = this.may[i], khac = that.concat(anhMay.filter((_, k) => k !== i))
      const ai = buocMay(this.bd, m, khac, nay, dt, this.rng)
      if (ai) { const k = khac.find((n) => n.id === ai); if (k) this.ghiHa(ai, m.id, k.doi) }
    }
    const ds: Record<string, SinhTonDong> = {}
    for (const [s, v] of this.tro) ds[s] = v.p
    for (const m of this.may) ds[m.id] = [Math.round(m.x), Math.round(m.y), Math.round(m.mau), m.doi, m.cap, m.t]
    const anh: SinhTonAnh = { ds, an: this.an, d: [...this.diem], v: this.soVan, c: this.bd.cap, h: this.hop }
    this.an = []
    return anh
  }
}
