// MÁY TRÒ «SINH TỒN» DÙNG CHUNG (13/11 — tách nguyên văn khỏi kenh-lop-may.ts để phòng chờ CA KIỂM TRA chơi cùng một trò với phòng chờ Live theo khối).
// Thuần bộ nhớ: 0 D1, 0 storage, không hẹn giờ, không gửi mạng — nơi dùng (KenhLopMay của live · PhongSinhTonCa của ca) lo nhịp 250 ms và phát ảnh chụp.
// Việc của lớp này: gom gói từng em (kẹp toạ độ / máu / cấp, mục tiêu + kẻ hạ phải có thật và khác đội), tính MÁY BÙ CHỖ, lượt hạ theo ván, hộp tiếp tế,
// cỡ bản đồ theo sĩ số, rồi trả MỘT ảnh chụp mỗi nhịp. Hợp đồng gói / ảnh: src/lib/live-khoi/kieu.ts (SinhTonGui · SinhTonAnh).
// Bản 2 đợt 2 (13/11, đặc tả docs/dac-ta-sinh-ton-v2-1311.md): chuỗi hạ + TRUY NÃ THỦ KHOA (`tk`) + biểu cảm (`bc`) + bảng vàng (`bv` / `hg`) + hộp 4 loại cho
// máy bù + «CHỈ GỬI GẦN» (`GoiSinhTon`: dựng chuỗi từng dòng MỘT lần, mỗi máy em chỉ nhận phần quanh mình).
// Bản 2 đợt 3 (13/11): THẦY VÀO TRẬN (`nhanThay` — chỉ KenhLopMay gọi, theo vai kết nối `gv`; phòng ca không có đường vào) + MA MỰC (thực thể máy chủ: máu
// do phòng trừ theo `t` của người bắn, % sát thương bốn đội, đội đánh nhiều nhất +5) + mỗi trang một hộp (`hn`). Luật số: sinh-ton-loi.ts (THAY · MA_MUC).
import type { SinhTonAnh, SinhTonBoss, SinhTonDong, SinhTonHa } from '../../src/lib/live-khoi/kieu'
import {
  BOT_BK, CAP_THAY, CAP_TOI_DA, DOI_BOSS, DOI_THAY, HOP_BK, MA_MUC, MAU_DAY, MAU_THAY, MM_MAU_GOC, MM_MAU_MOI, MM_TAM, MM_THUONG, MM_TOC_DO, MM_TROI_MS,
  NAY_BK, NO_BK, TAM_XA, THAY, VAN_MS, apHop, capBanDo, capSung, dangNghi, hopSo, laMay, loaiHopO, satThuongCua, taoBanDo, vanSo, viTriHop, type BanDo, type NhanVat,
} from '../../src/lib/live-khoi/sinh-ton-loi'
import { buocMay, khopMay, mayLenCap, mayThanh, type May } from '../../src/lib/live-khoi/sinh-ton-may'
import type { KetQuaVanEm } from './sinh-ton-du-lieu'

/** Phòng phát một ảnh chụp mỗi 250 ms. */
export const TRO_NHIP_MS = 250
/** Gói của một em đến nhanh hơn 180 ms so với gói trước ⇒ bỏ. */
const TRO_GUI_MS = 180
/** Em im quá 5 giây ⇒ gỡ khỏi sân (máy bù vào thay). */
const TRO_IM_MS = 5000
/** Một em chỉ được báo «bị hạ» mỗi 2,5 giây (hồi sinh mất 3 giây) — chặn báo lặp. */
const TRO_HA_MS = 2500
/** Biểu cảm: mỗi em 1 lần / 2 giây, hiện 2 giây rồi bỏ. Chỉ 4 chỉ số 0..3 (nhãn cố định ở màn — không chữ tự do). */
export const BIEU_CAM_MS = 2000
export const SO_BIEU_CAM = 4
/** Thủ khoa: phải có ít nhất chừng này lượt hạ trong ván. */
export const TK_TOI_THIEU = 3
/** «CHỈ GỬI GẦN»: bán kính vùng quanh người nhận (đơn vị sân, đo theo đường chim bay như mọi phép thử tầm của lõi). = TAM_XA 660 (bắn thẳng) + NAY_BK 90
 *  (sấm nảy) + NO_BK 60 (sao nổ) + BOT_BK 40 (bọt vỡ) + TRUOT 250: vị trí phòng biết về người nhận trễ hơn vị trí thật ở máy em tối đa ~1 giây × 257 / giây
 *  (chạy nhanh 190 × 1,35) — gói ≤ 250 ms + mạng hai chiều. Lan (bọt / sấm / sao) chỉ cần mục tiêu trong 90 và người cạnh mục tiêu trong 90 ⇒ 180 < 660, kẻ bắn ở
 *  xa vào tập qua luật (b) ⇒ vùng này dư cho mọi phép tính sát thương / ngắm; khung màn điện thoại ngang (±~700 × ±~450) cũng nằm gọn trong. */
const TRUOT = 250
export const GUI_GAN_BK = TAM_XA + NAY_BK + NO_BK + BOT_BK + TRUOT
/** LÕI vùng gửi gần = TAM_XA + TRUOT (910): mọi nhân vật có thể bị em bắn (cách vị trí THẬT ≤ 660) hoặc tham gia lan lên em (≤ 180) đều trong lõi. Lõi + kẻ bắn
 *  vào tập + thủ khoa gửi MỖI nhịp. Vành ngoài (910, 1100] chỉ để vẽ, và dòng của chính người nhận chỉ để biết đội ⇒ gửi THƯA: nhịp thứ k của ván (k = 0, 1, …)
 *  chỉ khi k % VANH_NHIP === 0; các ảnh khác mang `m: 1` («ảnh mỏng»). Đồng đội xa (`dd`, bản đồ nhỏ) chỉ khi k % DD_NHIP === 0. Nhịp đầu ván luôn đủ. */
export const LOI_GAN_BK = TAM_XA + TRUOT
export const VANH_NHIP = 4
export const DD_NHIP = 8
const kep = (v: unknown, tu: number, den: number): number | null => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(den, Math.max(tu, n)) : null }
type Tro = { p: SinhTonDong; luc: number; gui: number; ha: number }
/** Ma Mực đang trên sân: `dmg` = sát thương bốn đội đã gây (máu thật, số thực). */
interface Boss { x: number; y: number; mau: number; max: number; t: string; dmg: [number, number, number, number] }
const nguoiThat = (id: string): boolean => id !== THAY && id !== MA_MUC
/** Em THẬT (được ghi thống kê): không phải Thầy, Ma Mực, máy bù. */
const laEm = (id: string): boolean => nguoiThat(id) && !laMay(id)
/** Thống kê cộng dồn một em (bước ghép đợt 4) — ghi D1 theo LÔ: phòng rút bằng `layThongKe()`. */
type TkEm = Required<Omit<KetQuaVanEm, 'id' | 'doi'>>
/** Ghi D1 sau mỗi chừng này ván đã chốt (ngoài lúc phòng đóng / trò dừng). */
export const GHI_MOI_VAN = 5

export class MaySinhTon {
  private tro = new Map<string, Tro>()
  /** Bé ma Thầy (chỉ phòng live; null = Thầy không trong trận). Tách khỏi `tro` ⇒ không tính sĩ số đội, máy bù, bảng vàng, thủ khoa. */
  private thay: Tro | null = null
  /** Ma Mực (null = chưa trồi / đã bị diệt / ván đã hết); `bossVan` = ván đã trồi (mỗi ván một lần); `bh` = đội vừa diệt (phát một ảnh). */
  private boss: Boss | null = null
  private bossVan = -1
  private bh = -1
  /** Hộp TRANG (k ≥ 1) đã có người nhặt trong lượt hộp `hopTrangSo`. Hộp tâm (k = 0) vẫn ở `hop`. */
  private hopTrang = new Map<number, string>()
  private hopTrangSo = -1
  private an: SinhTonHa[] = []
  private may: May[] = []
  private diem: [number, number, number, number] = [0, 0, 0, 0]
  private van = -1
  /** Số thứ tự ván kể từ lúc trò bắt đầu ở phòng này (hiện trên màn: «Ván 2»). */
  private soVan = 0
  private bd: BanDo = taoBanDo(0)
  private hop: [number, string] = [-1, '']
  private lucNhip = 0
  /** Lượt hạ trong ván + lúc hạ gần nhất (bằng lượt ⇒ ai đạt trước đứng trước) của MỌI nhân vật (em thật + máy bù). */
  private haVan = new Map<string, number>()
  private lucHa = new Map<string, number>()
  /** Chuỗi hạ hiện tại (hạ liên tiếp, chưa bị hạ / chưa chết ngoài vòng). */
  private chuoi = new Map<string, number>()
  /** Thủ khoa đang bị truy nã ('' = chưa có). */
  private tk = ''
  /** Biểu cảm còn hiệu lực: mã ⇒ [chỉ số, lúc]; `lucBc` = lần nhận gần nhất (giới hạn 1 lần / 2 giây). */
  private bc = new Map<string, [number, number]>()
  private lucBc = new Map<string, number>()
  /** Hạng lượt hạ của từng em thật trên sân — chỉ có trong 5 giây nghỉ cuối ván (gửi riêng từng em: `hg`). */
  private hang = new Map<string, number>()
  /** Số thứ tự nhịp trong ván (0 = nhịp đầu ván) — quyết ảnh mỏng / có `dd`. */
  private nhipVan = 0
  /** THỐNG KÊ (bước ghép đợt 4): KHÔNG bị `dung()` xoá (trò dừng là lúc phải ghi); `layThongKe()` rút sạch. `thamGia` = em thật đã lên sân trong ván đang chạy;
   *  `vanChot` = ván (vanSo) đã chốt (`van` + thủ khoa cuối ván, ở nhịp nghỉ ĐẦU TIÊN — lúc ấy `tk` còn nguyên); `vanXong` = số ván đã chốt chưa rút. */
  private tke = new Map<string, TkEm>()
  private thamGia = new Set<string>()
  private vanChot = -1
  private vanXong = 0
  /** `tenTranh` = tên em thật mà máy bù phải tránh (máy mang tên như học sinh — src/lib/live-khoi/ten-may.ts); chỉ gọi lúc phải thêm máy. */
  constructor(private rng: () => number = Math.random, private tenTranh?: () => Iterable<string>) {}

  /** Số em THẬT đang có trên sân (đã gửi gói trong 5 giây gần nhất, tính tới nhịp vừa rồi). */
  get soEm(): number { return this.tro.size }

  /** Gói `SinhTonGui` của em `id` (đội `doi` do PHÒNG đóng dấu, không tin máy em). Gói sai dạng / quá nhanh ⇒ bỏ. */
  nhan(id: string, doi: number, x: Record<string, unknown>, nay: number): void {
    if ((doi !== 0 && doi !== 1 && doi !== 2 && doi !== 3) || !nguoiThat(id)) return
    const cu = this.tro.get(id)
    // Biểu cảm đi trước phép chặn gói nhanh (gói biểu cảm không được rơi vì vừa gửi vị trí); em phải đang trên sân.
    const e = x.e
    if (cu && typeof e === 'number' && Number.isInteger(e) && e >= 0 && e < SO_BIEU_CAM && nay - (this.lucBc.get(id) ?? -Infinity) >= BIEU_CAM_MS) {
      this.lucBc.set(id, nay); this.bc.set(id, [e, nay])
    }
    // Em đầu tiên của sân: mốc cho bước máy bù ở nhịp kế (đặt trước khi đọc gói như cũ).
    const dau = !this.tro.size
    const moi = this.docGoi(id, doi, x, nay, cu)
    if (!moi) return
    if (dau) this.lucNhip = nay
    this.tro.set(id, moi)
    if (laEm(id)) this.thamGia.add(id)
    const mau = moi.p[2]
    // Hộp tiếp tế: em chạm đầu tiên của mỗi hộp được nhận (`k` = chỉ số trong `viTriHop`: 0 / thiếu = hộp tâm sân, k ≥ 1 = hộp giữa trang).
    if (typeof x.h === 'number' && x.h === hopSo(nay) && mau > 0 && !dangNghi(nay)) {
      const k = typeof x.k === 'number' && Number.isInteger(x.k) ? x.k : 0
      if (!k) { if (this.hop[0] !== x.h) this.hop = [x.h, id] } else if (k > 0 && k < viTriHop(this.bd).length) this.datHopTrang(k, id, x.h)
    }
  }

  /** Gói của MÁY THẦY — KenhLopMay gọi khi kết nối là `gv` (vai kết nối, không phải cờ trong gói) và phòng là phòng chờ live. Phòng ca KHÔNG gọi hàm này.
   *  `roi: 1` ⇒ Thầy rời trận. Máu kẹp 0..2000, cấp súng ÉP cấp 2 (bút đỏ = luật Súng Đôi), không nhặt hộp, không biểu cảm. */
  nhanThay(x: Record<string, unknown>, nay: number): void {
    if (x.roi === 1) { this.xoaThay(); return }
    const moi = this.docGoi(THAY, DOI_THAY, x, nay, this.thay ?? undefined)
    if (moi) this.thay = moi
  }
  /** Thầy bấm «Rời trận» / im quá 5 giây ⇒ bé ma Thầy biến mất, không tính hạ. */
  xoaThay(): void { this.thay = null; this.chuoi.delete(THAY) }
  /** Thầy đang trong trận? */
  get coThay(): boolean { return !!this.thay }

  /** Đội của mã `ma` trên sân (em thật · máy bù · Thầy 4 · Ma Mực 5); không có / là chính `id` ⇒ -1. */
  private doiCua(ma: unknown, id: string): number {
    if (typeof ma !== 'string' || ma === id) return -1
    if (ma === THAY) return this.thay ? DOI_THAY : -1
    if (ma === MA_MUC) return this.boss ? DOI_BOSS : -1
    return this.tro.get(ma)?.p[3] ?? this.may.find((m) => m.id === ma)?.doi ?? -1
  }
  /** Đọc phần chung của gói (em / Thầy): kẹp toạ độ / máu / cấp, mục tiêu khai phải có thật và khác đội, kẻ hạ cũng vậy (ghi lượt hạ). Gói sai / quá nhanh ⇒ null. */
  private docGoi(id: string, doi: number, x: Record<string, unknown>, nay: number, cu: Tro | undefined): Tro | null {
    if (cu && nay - cu.gui < TRO_GUI_MS) return null
    const laThay = doi === DOI_THAY
    const p = Array.isArray(x.p) ? x.p : [], px = kep(p[0], 0, this.bd.rong), py = kep(p[1], 0, this.bd.cao), mau = kep(p[2], 0, laThay ? MAU_THAY : MAU_DAY)
    const cap = laThay ? CAP_THAY : kep(p[3], 1, CAP_TOI_DA)
    if (px == null || py == null || mau == null || cap == null) return null
    const dt = this.doiCua(x.t, id)
    const moi: Tro = { p: [px, py, mau, doi, cap, dt >= 0 && dt !== doi ? (x.t as string) : ''], luc: nay, gui: nay, ha: cu?.ha ?? 0 }
    const da = this.doiCua(x.a, id)
    if (da >= 0 && da !== doi && nay - moi.ha >= TRO_HA_MS && !dangNghi(nay) && this.an.length < 60) {
      moi.ha = nay
      this.ghiHa(x.a as string, id, da, nay)
    }
    // Máy báo máu 0 (chết vì vòng / cháy không rõ kẻ hạ) ⇒ hết chuỗi.
    if (mau === 0 && (cu?.p[2] ?? 0) > 0) this.chuoi.delete(id)
    return moi
  }
  /** Hộp giữa trang `k` của lượt `soHop`: người chạm đầu tiên được nhận. */
  private datHopTrang(k: number, id: string, soHop: number): boolean {
    if (this.hopTrangSo !== soHop) { this.hopTrangSo = soHop; this.hopTrang.clear() }
    if (this.hopTrang.has(k)) return false
    this.hopTrang.set(k, id)
    return true
  }

  /** Một lượt hạ: chuỗi (người bị hạ hết chuỗi, kẻ hạ +1), lượt hạ ván, thủ khoa, điểm đội; máy hạ ⇒ lên cấp (hạ thủ khoa ⇒ thêm một cấp nữa). */
  //  Đợt 3: Thầy / Ma Mực hạ ai ⇒ không cộng điểm đội nào, không vào thủ khoa; HẠ THẦY ⇒ chỉ ghi nhận (lượt hạ trong `an` cho «Hạ gục Thầy»), không cộng
  //  điểm đội, không tính lượt hạ ván / chuỗi; Ma Mực không có chuỗi.
  private ghiHa(ai: string, bi: string, doiAi: number, nay: number): void {
    const laTk = bi === this.tk ? 1 : 0
    const chuoiBi = this.chuoi.get(bi) ?? 0
    this.chuoi.delete(bi)
    let chuoiAi = this.chuoi.get(ai) ?? 0
    if (bi !== THAY && ai !== MA_MUC) { chuoiAi++; this.chuoi.set(ai, chuoiAi) }
    if (bi !== THAY && nguoiThat(ai)) {
      const ha = (this.haVan.get(ai) ?? 0) + 1
      this.haVan.set(ai, ha); this.lucHa.set(ai, nay)
      // Vượt HẲN người đang giữ mới cướp ngôi (bằng ⇒ người đang giữ giữ nguyên). Máy bù được làm thủ khoa (vui hơn; không bao giờ vào bảng vàng).
      if (ha >= TK_TOI_THIEU && ai !== this.tk && (!this.tk || ha > (this.haVan.get(this.tk) ?? 0))) this.tk = ai
    }
    this.an.push([ai, bi, chuoiBi, chuoiAi, laTk])
    // Thống kê em thật: bị hạ (bởi bất kỳ ai); hạ Thầy ⇒ `haThay` (không vào `ha` — «Thợ săn tuần» xếp theo `ha`); hạ người ⇒ `ha` + diệt thủ khoa + hạ liền.
    if (laEm(bi)) this.tkCua(bi).biHa++
    if (laEm(ai)) {
      const t = this.tkCua(ai)
      if (bi === THAY) t.haThay++
      else if (bi !== MA_MUC) { t.ha++; if (laTk) t.dietTk++; if (chuoiAi > t.chuoiMax) t.chuoiMax = chuoiAi }
    }
    if (bi !== THAY && doiAi >= 0 && doiAi < 4) this.diem[doiAi]++
    if (laMay(ai)) { const m = this.may.find((v) => v.id === ai); if (m) { mayLenCap(m); if (laTk) mayLenCap(m) } }
  }

  private tkCua(id: string): TkEm {
    let t = this.tke.get(id)
    if (!t) this.tke.set(id, (t = { ha: 0, biHa: 0, haThay: 0, dietTk: 0, chuoiMax: 0, thuKhoa: 0, van: 0 }))
    return t
  }
  /** Số ván đã chốt chưa ghi — chủ phòng ghi khi ≥ GHI_MOI_VAN. */
  get vanChoGhi(): number { return this.vanXong }
  /** RÚT thống kê (đồng bộ, đổi bản đồ mới ⇒ lần ghi bất đồng bộ sau đó không cộng trùng). `van` luôn truyền rõ (0 cũng truyền — nơi ghi coi thiếu là 1). */
  layThongKe(): KetQuaVanEm[] {
    const ds: KetQuaVanEm[] = []
    for (const [id, t] of this.tke) if (t.ha || t.biHa || t.haThay || t.dietTk || t.thuKhoa || t.van) ds.push({ id, ...t })
    this.tke = new Map(); this.vanXong = 0
    return ds
  }

  /** Thủ khoa rời sân ⇒ chọn lại: nhiều lượt hạ nhất (≥ 3) trong số còn trên sân, bằng nhau ⇒ ai đạt mức đó trước. */
  private chonLaiTk(): void {
    let tk = '', ha = TK_TOI_THIEU - 1, luc = Infinity
    for (const [id, n] of this.haVan) {
      if (!this.tro.has(id) && !this.may.some((m) => m.id === id)) continue
      const l = this.lucHa.get(id) ?? 0
      if (n > ha || (n === ha && tk && l < luc)) { tk = id; ha = n; luc = l }
    }
    this.tk = tk
  }

  /** Em rời phòng ⇒ gỡ ngay (không đợi 5 giây im); nhịp kế máy bù vào thay. */
  xoa(id: string): void { this.tro.delete(id); this.chuoi.delete(id); this.bc.delete(id) }

  /** Trò dừng hẳn (thầy bấm Bắt đầu, phòng đóng, hết em thật): xoá mọi trạng thái, máy bù rời sân — TRỪ thống kê chờ ghi (ván dở không tính ván). */
  dung(): void {
    this.tro.clear(); this.an = []; this.may = []; this.van = -1; this.soVan = 0; this.diem = [0, 0, 0, 0]; this.hop = [-1, '']
    this.thay = null; this.boss = null; this.bossVan = -1; this.bh = -1; this.hopTrang.clear(); this.hopTrangSo = -1
    this.haVan.clear(); this.lucHa.clear(); this.chuoi.clear(); this.tk = ''; this.bc.clear(); this.lucBc.clear(); this.hang.clear(); this.thamGia.clear()
  }

  /** Một nhịp 250 ms: gỡ em im, ván mới, khớp + bước máy bù. Trả ảnh chụp ĐỦ (máy thầy nhận nguyên; máy em nhận bản lọc qua `goi`); không còn em thật ⇒
   *  tự xoá trạng thái và trả null. */
  nhip(nay: number): SinhTonAnh | null {
    for (const [s, v] of this.tro) if (nay - v.luc > TRO_IM_MS) { this.tro.delete(s); this.chuoi.delete(s) }
    if (this.thay && nay - this.thay.luc > TRO_IM_MS) this.xoaThay()
    if (!this.tro.size) { this.dung(); return null }
    // Ván mới: xoá điểm, chọn cỡ bản đồ theo sĩ số, máy về trại.
    const van = vanSo(nay)
    const soEm = [0, 0, 0, 0]
    for (const v of this.tro.values()) soEm[v.p[3]]++
    if (van !== this.van) {
      // Ván ĐẦU (trò vừa bắt đầu) giữ lượt hạ đã ghi trước nhịp đầu; các ván sau xoá điểm, lượt hạ ván, chuỗi, thủ khoa.
      if (this.van !== -1) { this.diem = [0, 0, 0, 0]; this.an = []; this.haVan.clear(); this.lucHa.clear(); this.chuoi.clear(); this.tk = '' }
      this.van = van; this.soVan++; this.may = []; this.nhipVan = -1; this.boss = null
      this.thamGia = new Set([...this.tro.keys()].filter(laEm))
      this.bd = taoBanDo(capBanDo(soEm.reduce((t, n) => t + Math.max(4, n), 0)))
    }
    this.nhipVan++
    this.may = khopMay(this.bd, this.may, soEm, nay, this.rng, this.tenTranh)
    const that: NhanVat[] = []
    for (const [s, v] of this.tro) that.push({ id: s, x: v.p[0], y: v.p[1], mau: v.p[2], doi: v.p[3], cap: v.p[4], t: v.p[5] })
    if (this.thay) { const p = this.thay.p; that.push({ id: THAY, x: p[0], y: p[1], mau: p[2], doi: DOI_THAY, cap: p[4], t: p[5] }) }
    const dt = Math.min(1000, Math.max(0, nay - this.lucNhip))
    this.lucNhip = nay
    const anhMay = this.may.map((m) => mayThanh(m, nay))
    // Ma Mực là một «nhân vật» cuối danh sách của máy bù (máy bị phun mực, máy bắn được boss).
    const nvB: NhanVat[] = this.boss ? [{ id: MA_MUC, x: this.boss.x, y: this.boss.y, mau: this.boss.mau, doi: DOI_BOSS, cap: 1, t: this.boss.t }] : []
    for (let i = 0; i < this.may.length; i++) {
      const m = this.may[i], khac = that.concat(anhMay.filter((_, k) => k !== i), nvB)
      const ai = buocMay(this.bd, m, khac, nay, dt, this.rng)
      if (ai) { const k = khac.find((n) => n.id === ai); if (k) this.ghiHa(ai, m.id, k.doi, nay) }
      if (m.mau <= 0) this.chuoi.delete(m.id)
    }
    const nghi = dangNghi(nay)
    // Máy bù đi ngang hộp tiếp tế chưa ai nhặt (em thật gửi gói trước nhịp ⇒ em luôn được ưu tiên) ⇒ phòng trao hộp, áp đúng hiệu ứng của loại hộp.
    // Đợt 3: mọi hộp của `viTriHop` (tâm sân + giữa mỗi trang), mỗi máy nhặt tối đa một hộp mỗi nhịp.
    const soHop = hopSo(nay), dsHop = viTriHop(this.bd)
    if (this.hopTrangSo !== soHop) { this.hopTrangSo = soHop; this.hopTrang.clear() }
    if (!nghi) {
      for (const m of this.may) {
        if (m.mau <= 0) continue
        for (let k = 0; k < dsHop.length; k++) {
          if (Math.hypot(m.x - dsHop[k].x, m.y - dsHop[k].y) >= HOP_BK) continue
          if (k ? !this.datHopTrang(k, m.id, soHop) : this.hop[0] === soHop) continue
          if (!k) this.hop = [soHop, m.id]
          Object.assign(m, apHop(m, loaiHopO(soHop, k), nay))
          break
        }
      }
    }
    // Ma Mực: trồi ở giây 60 của ván (mỗi ván một lần), hết giờ chơi ⇒ biến mất không thưởng.
    if (nghi) this.boss = null
    else {
      if (!this.boss && this.bossVan !== van && ((nay % VAN_MS) + VAN_MS) % VAN_MS >= MM_TROI_MS) {
        this.bossVan = van
        const mau = MM_MAU_GOC + MM_MAU_MOI * (that.length + this.may.length)
        this.boss = { x: this.bd.rong / 2, y: this.bd.cao / 2, mau, max: mau, t: '', dmg: [0, 0, 0, 0] }
      }
      if (this.boss) this.buocBoss(that.concat(this.may.map((m) => mayThanh(m, nay))), dt)
    }
    if (this.tk && !this.tro.has(this.tk) && !this.may.some((m) => m.id === this.tk)) this.chonLaiTk()
    const ds: Record<string, SinhTonDong> = {}
    for (const [s, v] of this.tro) ds[s] = v.p
    for (const m of this.may) ds[m.id] = [Math.round(m.x), Math.round(m.y), Math.round(m.mau), m.doi, capSung(m, nay), m.t]
    if (this.thay) ds[THAY] = this.thay.p
    const anh: SinhTonAnh = { ds, an: this.an, d: [...this.diem], v: this.soVan, c: this.bd.cap, h: this.hop }
    if (this.tk) anh.tk = this.tk
    if (this.thay) anh.ty = [THAY, this.thay.p[2]]
    if (this.boss) {
      const b = this.boss, bx: SinhTonBoss = [Math.round(b.x), Math.round(b.y), Math.ceil(b.mau)]
      if (b.t) bx.push(b.t)
      const tong = b.dmg[0] + b.dmg[1] + b.dmg[2] + b.dmg[3]
      anh.bx = bx
      anh.bp = [b.max, ...b.dmg.map((v) => (tong > 0 ? Math.round((100 * v) / tong) : 0))] as [number, number, number, number, number]
    }
    if (this.bh >= 0) { anh.bh = this.bh; this.bh = -1 }
    if (this.hopTrang.size) { const hn: Record<string, string> = {}; for (const [k, id] of this.hopTrang) hn[k] = id; anh.hn = hn }
    // Biểu cảm còn trong 2 giây (của nhân vật đang trên sân).
    let bc: Record<string, number> | null = null
    for (const [id, [e, luc]] of this.bc) {
      if (nay - luc >= BIEU_CAM_MS || !ds[id]) { this.bc.delete(id); continue }
      (bc ??= {})[id] = e
    }
    if (bc) anh.bc = bc
    // Bảng vàng (5 giây nghỉ cuối ván): top 3 EM THẬT theo lượt hạ ván (máy bù không bao giờ vào), + hạng riêng từng em.
    this.hang.clear()
    if (nghi) {
      const em: [string, number, number][] = []
      for (const id of this.tro.keys()) em.push([id, this.haVan.get(id) ?? 0, this.lucHa.get(id) ?? 0])
      em.sort((a, b) => b[1] - a[1] || a[2] - b[2])
      anh.bv = em.filter((e) => e[1] > 0).slice(0, 3).map((e) => [e[0], e[1]])
      for (const [id, n] of em) { let h = 1; for (const k of em) if (k[1] > n) h++; this.hang.set(id, h) }
      // Chốt ván cho thống kê (một lần mỗi ván, ở nhịp nghỉ đầu tiên): mọi em đã chơi ván +1 ván; thủ khoa cuối ván (em thật) +1.
      if (this.vanChot !== van) {
        this.vanChot = van; this.vanXong++
        for (const id of this.thamGia) this.tkCua(id).van++
        if (this.tk && laEm(this.tk) && this.thamGia.has(this.tk)) this.tkCua(this.tk).thuKhoa++
      }
    }
    this.an = []
    return anh
  }

  /** Một nhịp của Ma Mực: trừ máu theo người đang nhắm 'MM' trong tầm (máu do PHÒNG trừ), cộng sát thương đội; hết máu ⇒ đội gây nhiều nhất +5 (bằng
   *  nhau ⇒ đội đứng trước trong Na · K · Cu · Ca); còn sống ⇒ bay về tâm đám đông, phun mực vào nhân vật gần nhất trong tầm. */
  private buocBoss(ds: readonly NhanVat[], dtMs: number): void {
    const b = this.boss!, giay = dtMs / 1000
    for (const n of ds) {
      if (n.t !== MA_MUC || n.mau <= 0 || Math.hypot(n.x - b.x, n.y - b.y) > TAM_XA) continue
      const mat = satThuongCua(n) * giay
      b.mau -= mat
      if (n.doi >= 0 && n.doi < 4) b.dmg[n.doi] += mat
    }
    if (b.mau <= 0) {
      let w = -1, nhat = 0
      for (let d = 0; d < 4; d++) if (b.dmg[d] > nhat) { nhat = b.dmg[d]; w = d }
      if (w >= 0) { this.diem[w] += MM_THUONG; this.bh = w }
      this.boss = null
      return
    }
    let sx = 0, sy = 0, n = 0, gan = MM_TAM, t = ''
    for (const v of ds) {
      if (v.mau <= 0) continue
      sx += v.x; sy += v.y; n++
      const d = Math.hypot(v.x - b.x, v.y - b.y)
      if (d < gan) { gan = d; t = v.id }
    }
    b.t = t
    if (n) {
      const dx = sx / n - b.x, dy = sy / n - b.y, kc = Math.hypot(dx, dy), buoc = Math.min(MM_TOC_DO * giay, Math.max(0, kc - 60))
      if (kc > 0 && buoc > 0) { b.x = Math.min(this.bd.rong, Math.max(0, b.x + (dx / kc) * buoc)); b.y = Math.min(this.bd.cao, Math.max(0, b.y + (dy / kc) * buoc)) }
    }
  }

  /** Gói phát của ảnh vừa dựng (gọi ngay sau `nhip`, cùng `nay`): `du()` cho máy thầy / máy chưa lên sân, `cho(mã em)` cho từng em. */
  goi(anh: SinhTonAnh, nay: number): GoiSinhTon { return new GoiSinhTon(anh, nay, this.hang, this.nhipVan % VANH_NHIP !== 0, this.nhipVan % DD_NHIP === 0) }
}

/** «CHỈ GỬI GẦN» (đặc tả bản 2 mục 6: 78 em nhận đủ ảnh ⇒ ~700 KB / giây; đích ≤ 200). Mỗi dòng nhân vật thành chuỗi JSON đúng MỘT lần, mỗi người nhận
 *  chỉ nối các dòng trong TẬP của mình, GIỮ ĐÚNG THỨ TỰ của ảnh đủ (thứ tự quyết định thế hoà của `satThuong` / `chonMucTieu` ⇒ máy em tính y hệt ảnh đủ).
 *  Tập gửi cho X (dòng đủ trong `ds`): (a) mọi nhân vật cách X ≤ GUI_GAN_BK; (b) mọi nhân vật đang bắn (`t`) vào X hoặc vào một người đã trong tập — lặp tới
 *  ổn định, chỉ mở rộng từ X + (a) + chính (b) (bọt vỡ / sấm nảy / sao nổ trúng X qua mục tiêu người khác); (c) thủ khoa `tk` (sao trên bản đồ nhỏ, không
 *  mở rộng). Đồng đội ngoài tập chỉ cần cho BẢN ĐỒ NHỎ ⇒ gửi gọn `dd` = [x, y, x, y, …] (không mã, không máu — 78 em: ~8 đồng đội ở xa, 33 ⇒ 9 byte mỗi người).
 *  Luôn kèm `an`, `d`, `tk`, `v`, `c`, `h`, `bv`; `bc` lọc theo tập; `hg` riêng của X. */
export class GoiSinhTon {
  private dong: string[] = []
  private ids: string[]
  private x: Float64Array; private y: Float64Array; private doi: Int8Array
  /** `ban[j]` = chỉ số những nhân vật đang bắn nhân vật j. */
  private ban: (number[] | undefined)[]
  private chiSo = new Map<string, number>()
  private tkI: number
  /** Ma Mực [x, y, …] + chỉ số những người đang bắn boss · `bp` + `ty` (chỉ ảnh đủ vành và ảnh đủ). Dòng Thầy theo vùng như mọi người. */
  private bx: SinhTonBoss | undefined
  private banBoss: number[] = []
  private bp = ''
  private dau: string; private duoi: string
  private duSan = ''
  private danh: Uint32Array; private lan = 0
  /** `mong` = ảnh mỏng (vành ngoài không gửi, ảnh lọc mang `m: 1`); `coDd` = ảnh lọc mang chấm đồng đội xa `dd`. */
  constructor(private anh: SinhTonAnh, nay: number, private hang: ReadonlyMap<string, number>, private mong = false, private coDd = true) {
    // Thứ tự = thứ tự JSON.stringify của ảnh đủ (Object.keys: khoá dạng số nguyên lên trước) ⇒ tập con giữ đúng thứ tự máy em đọc được từ ảnh đủ.
    const ids = (this.ids = Object.keys(anh.ds)), n = ids.length
    this.x = new Float64Array(n); this.y = new Float64Array(n); this.doi = new Int8Array(n); this.ban = new Array(n); this.danh = new Uint32Array(n)
    for (let i = 0; i < n; i++) {
      const r = anh.ds[ids[i]]
      this.chiSo.set(ids[i], i)
      this.x[i] = r[0]; this.y[i] = r[1]; this.doi[i] = r[3]
      // Dòng gọn trên dây: không bắn ai ⇒ bỏ phần tử thứ 6 ('') — `docDong` đã coi thiếu là ''.
      this.dong.push(`${JSON.stringify(ids[i])}:${JSON.stringify(r[5] ? r : r.slice(0, 5))}`)
    }
    for (let i = 0; i < n; i++) {
      const t = anh.ds[ids[i]][5], j = t ? this.chiSo.get(t) : undefined
      if (j !== undefined) (this.ban[j] ??= []).push(i)
      else if (t === MA_MUC) this.banBoss.push(i)
    }
    this.tkI = anh.tk ? this.chiSo.get(anh.tk) ?? -1 : -1
    this.bx = anh.bx
    if (anh.bp) this.bp = `,"bp":${JSON.stringify(anh.bp)}`
    if (anh.ty) this.bp += `,"ty":${JSON.stringify(anh.ty)}`
    const { ds: _ds, bc: _bc, hg: _hg, bp: _bp, ty: _ty, ...chung } = anh
    // Tin trò không mang `s` / `n` / `d` của TinLop (màn trò chỉ đọc `l` và `x`; bỏ 21 byte mỗi gói × 312 gói / giây ở 78 em).
    this.dau = `{"t":"lop","k":"tro","l":${JSON.stringify(nay)},"x":{"ds":{`
    this.duoi = JSON.stringify(chung).slice(1, -1)
  }

  /** Ảnh ĐỦ (máy thầy, máy chưa lên sân). */
  du(): string {
    if (!this.duSan) {
      const bc = this.anh.bc && Object.keys(this.anh.bc).length ? `,"bc":${JSON.stringify(this.anh.bc)}` : ''
      this.duSan = `${this.dau}${this.dong.join(',')}},${this.duoi}${this.bp}${bc}}}`
    }
    return this.duSan
  }

  /** Ảnh LỌC cho em `id`; em chưa có trên sân ⇒ ảnh đủ. */
  cho(id: string): string {
    const i0 = this.chiSo.get(id)
    if (i0 === undefined) return this.du()
    const n = this.ids.length, danh = this.danh, x0 = this.x[i0], y0 = this.y[i0], d0 = this.doi[i0], R2 = (this.mong ? LOI_GAN_BK : GUI_GAN_BK) ** 2
    if (++this.lan >= 0xffffffff) { this.lan = 1; danh.fill(0) }
    const lan = this.lan, q: number[] = []
    // (a) vùng tròn quanh X (gồm chính X); ảnh mỏng chỉ lấy lõi.
    for (let i = 0; i < n; i++) { const dx = this.x[i] - x0, dy = this.y[i] - y0; if (dx * dx + dy * dy <= R2) { danh[i] = lan; q.push(i) } }
    // Ma Mực trong vùng ⇒ mọi người đang bắn boss vào tập (bọt / sấm / sao lan quanh boss trúng X), rồi mở rộng như (b).
    if (this.bx) { const dx = this.bx[0] - x0, dy = this.bx[1] - y0; if (dx * dx + dy * dy <= R2) for (const s of this.banBoss) if (danh[s] !== lan) { danh[s] = lan; q.push(s) } }
    // (b) kẻ bắn vào người trong tập — lặp tới ổn định (hàng đợi mở rộng dần).
    for (let k = 0; k < q.length; k++) {
      const b = this.ban[q[k]]
      if (b) for (const s of b) if (danh[s] !== lan) { danh[s] = lan; q.push(s) }
    }
    // (c) thủ khoa (không mở rộng); đồng đội còn ngoài tập ⇒ `dd` gọn.
    if (this.tkI >= 0) danh[this.tkI] = lan
    let ds = '', dd = ''
    for (let i = 0; i < n; i++) {
      // Dòng của CHÍNH X chỉ để máy em biết đội mình (đổi đội) ⇒ ảnh mỏng không gửi (vẫn là hạt giống của luật (b) ở trên).
      if (danh[i] === lan) { if (i !== i0 || !this.mong) ds += ds ? `,${this.dong[i]}` : this.dong[i] }
      else if (this.coDd && this.doi[i] === d0) dd += `${dd ? ',' : ''}${Math.round(this.x[i])},${Math.round(this.y[i])}`
    }
    let bc = ''
    if (this.anh.bc) for (const k in this.anh.bc) { const j = this.chiSo.get(k); if (j !== undefined && danh[j] === lan) bc += `${bc ? ',' : ''}${JSON.stringify(k)}:${this.anh.bc[k]}` }
    const hg = this.hang.get(id)
    return `${this.dau}${ds}},${this.duoi}${this.mong ? ',"m":1' : this.bp}${dd ? `,"dd":[${dd}]` : ''}${bc ? `,"bc":{${bc}}` : ''}${hg ? `,"hg":${hg}` : ''}}}`
  }
}
