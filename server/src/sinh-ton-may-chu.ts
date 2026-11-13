// MÁY TRÒ «SINH TỒN» DÙNG CHUNG (13/11 — tách nguyên văn khỏi kenh-lop-may.ts để phòng chờ CA KIỂM TRA chơi cùng một trò với phòng chờ Live theo khối).
// Thuần bộ nhớ: 0 D1, 0 storage, không hẹn giờ, không gửi mạng — nơi dùng (KenhLopMay của live · PhongSinhTonCa của ca) lo nhịp 250 ms và phát ảnh chụp.
// Việc của lớp này: gom gói từng em (kẹp toạ độ / máu / cấp, mục tiêu + kẻ hạ phải có thật và khác đội), tính MÁY BÙ CHỖ, lượt hạ theo ván, hộp tiếp tế,
// cỡ bản đồ theo sĩ số, rồi trả MỘT ảnh chụp mỗi nhịp. Hợp đồng gói / ảnh: src/lib/live-khoi/kieu.ts (SinhTonGui · SinhTonAnh).
// Bản 2 đợt 2 (13/11, đặc tả docs/dac-ta-sinh-ton-v2-1311.md): chuỗi hạ + TRUY NÃ THỦ KHOA (`tk`) + biểu cảm (`bc`) + bảng vàng (`bv` / `hg`) + hộp 4 loại cho
// máy bù + «CHỈ GỬI GẦN» (`GoiSinhTon`: dựng chuỗi từng dòng MỘT lần, mỗi máy em chỉ nhận phần quanh mình).
import type { SinhTonAnh, SinhTonDong, SinhTonHa } from '../../src/lib/live-khoi/kieu'
import {
  BOT_BK, CAP_TOI_DA, HOP_BK, MAU_DAY, NAY_BK, NO_BK, TAM_XA, apHop, capBanDo, capSung, dangNghi, hopSo, laMay, loaiHop, taoBanDo, vanSo, type BanDo, type NhanVat,
} from '../../src/lib/live-khoi/sinh-ton-loi'
import { buocMay, khopMay, mayLenCap, mayThanh, type May } from '../../src/lib/live-khoi/sinh-ton-may'

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
const kep = (v: unknown, tu: number, den: number): number | null => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(den, Math.max(tu, n)) : null }

export class MaySinhTon {
  private tro = new Map<string, { p: SinhTonDong; luc: number; gui: number; ha: number }>()
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
  /** `tenTranh` = tên em thật mà máy bù phải tránh (máy mang tên như học sinh — src/lib/live-khoi/ten-may.ts); chỉ gọi lúc phải thêm máy. */
  constructor(private rng: () => number = Math.random, private tenTranh?: () => Iterable<string>) {}

  /** Số em THẬT đang có trên sân (đã gửi gói trong 5 giây gần nhất, tính tới nhịp vừa rồi). */
  get soEm(): number { return this.tro.size }

  /** Gói `SinhTonGui` của em `id` (đội `doi` do PHÒNG đóng dấu, không tin máy em). Gói sai dạng / quá nhanh ⇒ bỏ. */
  nhan(id: string, doi: number, x: Record<string, unknown>, nay: number): void {
    if (doi !== 0 && doi !== 1 && doi !== 2 && doi !== 3) return
    const cu = this.tro.get(id)
    // Biểu cảm đi trước phép chặn gói nhanh (gói biểu cảm không được rơi vì vừa gửi vị trí); em phải đang trên sân.
    const e = x.e
    if (cu && typeof e === 'number' && Number.isInteger(e) && e >= 0 && e < SO_BIEU_CAM && nay - (this.lucBc.get(id) ?? -Infinity) >= BIEU_CAM_MS) {
      this.lucBc.set(id, nay); this.bc.set(id, [e, nay])
    }
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
      this.ghiHa(x.a as string, id, da, nay)
    }
    // Máy em báo máu 0 (chết vì vòng / cháy không rõ kẻ hạ) ⇒ hết chuỗi.
    if (mau === 0 && (cu?.p[2] ?? 0) > 0) this.chuoi.delete(id)
    // Hộp tiếp tế: em chạm đầu tiên của mỗi hộp được nhận.
    if (typeof x.h === 'number' && x.h === hopSo(nay) && this.hop[0] !== x.h && mau > 0 && !dangNghi(nay)) this.hop = [x.h, id]
  }

  /** Một lượt hạ: chuỗi (người bị hạ hết chuỗi, kẻ hạ +1), lượt hạ ván, thủ khoa, điểm đội; máy hạ ⇒ lên cấp (hạ thủ khoa ⇒ thêm một cấp nữa). */
  private ghiHa(ai: string, bi: string, doiAi: number, nay: number): void {
    const laTk = bi === this.tk ? 1 : 0
    const chuoiBi = this.chuoi.get(bi) ?? 0
    this.chuoi.delete(bi)
    const chuoiAi = (this.chuoi.get(ai) ?? 0) + 1
    this.chuoi.set(ai, chuoiAi)
    const ha = (this.haVan.get(ai) ?? 0) + 1
    this.haVan.set(ai, ha); this.lucHa.set(ai, nay)
    // Vượt HẲN người đang giữ mới cướp ngôi (bằng ⇒ người đang giữ giữ nguyên). Máy bù được làm thủ khoa (vui hơn; không bao giờ vào bảng vàng).
    if (ha >= TK_TOI_THIEU && ai !== this.tk && (!this.tk || ha > (this.haVan.get(this.tk) ?? 0))) this.tk = ai
    this.an.push([ai, bi, chuoiBi, chuoiAi, laTk])
    this.diem[doiAi]++
    if (laMay(ai)) { const m = this.may.find((v) => v.id === ai); if (m) { mayLenCap(m); if (laTk) mayLenCap(m) } }
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

  /** Trò dừng hẳn (thầy bấm Bắt đầu, phòng đóng, hết em thật): xoá mọi trạng thái, máy bù rời sân. */
  dung(): void {
    this.tro.clear(); this.an = []; this.may = []; this.van = -1; this.soVan = 0; this.diem = [0, 0, 0, 0]; this.hop = [-1, '']
    this.haVan.clear(); this.lucHa.clear(); this.chuoi.clear(); this.tk = ''; this.bc.clear(); this.lucBc.clear(); this.hang.clear()
  }

  /** Một nhịp 250 ms: gỡ em im, ván mới, khớp + bước máy bù. Trả ảnh chụp ĐỦ (máy thầy nhận nguyên; máy em nhận bản lọc qua `goi`); không còn em thật ⇒
   *  tự xoá trạng thái và trả null. */
  nhip(nay: number): SinhTonAnh | null {
    for (const [s, v] of this.tro) if (nay - v.luc > TRO_IM_MS) { this.tro.delete(s); this.chuoi.delete(s) }
    if (!this.tro.size) { this.dung(); return null }
    // Ván mới: xoá điểm, chọn cỡ bản đồ theo sĩ số, máy về trại.
    const van = vanSo(nay)
    const soEm = [0, 0, 0, 0]
    for (const v of this.tro.values()) soEm[v.p[3]]++
    if (van !== this.van) {
      // Ván ĐẦU (trò vừa bắt đầu) giữ lượt hạ đã ghi trước nhịp đầu; các ván sau xoá điểm, lượt hạ ván, chuỗi, thủ khoa.
      if (this.van !== -1) { this.diem = [0, 0, 0, 0]; this.an = []; this.haVan.clear(); this.lucHa.clear(); this.chuoi.clear(); this.tk = '' }
      this.van = van; this.soVan++; this.may = []
      this.bd = taoBanDo(capBanDo(soEm.reduce((t, n) => t + Math.max(4, n), 0)))
    }
    this.may = khopMay(this.bd, this.may, soEm, nay, this.rng, this.tenTranh)
    const that: NhanVat[] = []
    for (const [s, v] of this.tro) that.push({ id: s, x: v.p[0], y: v.p[1], mau: v.p[2], doi: v.p[3], cap: v.p[4], t: v.p[5] })
    const dt = Math.min(1000, Math.max(0, nay - this.lucNhip))
    this.lucNhip = nay
    const anhMay = this.may.map((m) => mayThanh(m, nay))
    for (let i = 0; i < this.may.length; i++) {
      const m = this.may[i], khac = that.concat(anhMay.filter((_, k) => k !== i))
      const ai = buocMay(this.bd, m, khac, nay, dt, this.rng)
      if (ai) { const k = khac.find((n) => n.id === ai); if (k) this.ghiHa(ai, m.id, k.doi, nay) }
      if (m.mau <= 0) this.chuoi.delete(m.id)
    }
    const nghi = dangNghi(nay)
    // Máy bù đi ngang hộp tiếp tế chưa ai nhặt (em thật gửi gói trước nhịp ⇒ em luôn được ưu tiên) ⇒ phòng trao hộp, áp đúng hiệu ứng của loại hộp.
    const soHop = hopSo(nay)
    if (!nghi && this.hop[0] !== soHop) {
      for (const m of this.may) {
        if (m.mau <= 0 || Math.hypot(m.x - this.bd.rong / 2, m.y - this.bd.cao / 2) >= HOP_BK) continue
        this.hop = [soHop, m.id]
        Object.assign(m, apHop(m, loaiHop(soHop), nay))
        break
      }
    }
    if (this.tk && !this.tro.has(this.tk) && !this.may.some((m) => m.id === this.tk)) this.chonLaiTk()
    const ds: Record<string, SinhTonDong> = {}
    for (const [s, v] of this.tro) ds[s] = v.p
    for (const m of this.may) ds[m.id] = [Math.round(m.x), Math.round(m.y), Math.round(m.mau), m.doi, capSung(m, nay), m.t]
    const anh: SinhTonAnh = { ds, an: this.an, d: [...this.diem], v: this.soVan, c: this.bd.cap, h: this.hop }
    if (this.tk) anh.tk = this.tk
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
    }
    this.an = []
    return anh
  }

  /** Gói phát của ảnh vừa dựng (gọi ngay sau `nhip`, cùng `nay`): `du()` cho máy thầy / máy chưa lên sân, `cho(mã em)` cho từng em. */
  goi(anh: SinhTonAnh, nay: number): GoiSinhTon { return new GoiSinhTon(anh, nay, this.hang) }
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
  private dau: string; private duoi: string
  private duSan = ''
  private danh: Uint32Array; private lan = 0
  constructor(private anh: SinhTonAnh, nay: number, private hang: ReadonlyMap<string, number>) {
    // Thứ tự = thứ tự JSON.stringify của ảnh đủ (Object.keys: khoá dạng số nguyên lên trước) ⇒ tập con giữ đúng thứ tự máy em đọc được từ ảnh đủ.
    const ids = (this.ids = Object.keys(anh.ds)), n = ids.length
    this.x = new Float64Array(n); this.y = new Float64Array(n); this.doi = new Int8Array(n); this.ban = new Array(n); this.danh = new Uint32Array(n)
    for (let i = 0; i < n; i++) {
      const r = anh.ds[ids[i]]
      this.chiSo.set(ids[i], i)
      this.x[i] = r[0]; this.y[i] = r[1]; this.doi[i] = r[3]
      this.dong.push(`${JSON.stringify(ids[i])}:${JSON.stringify(r)}`)
    }
    for (let i = 0; i < n; i++) {
      const t = anh.ds[ids[i]][5], j = t ? this.chiSo.get(t) : undefined
      if (j !== undefined) (this.ban[j] ??= []).push(i)
    }
    this.tkI = anh.tk ? this.chiSo.get(anh.tk) ?? -1 : -1
    const { ds: _ds, bc: _bc, hg: _hg, ...chung } = anh
    this.dau = `{"t":"lop","k":"tro","s":"","n":"","d":-1,"l":${JSON.stringify(nay)},"x":{"ds":{`
    this.duoi = JSON.stringify(chung).slice(1, -1)
  }

  /** Ảnh ĐỦ (máy thầy, máy chưa lên sân). */
  du(): string {
    if (!this.duSan) {
      const bc = this.anh.bc && Object.keys(this.anh.bc).length ? `,"bc":${JSON.stringify(this.anh.bc)}` : ''
      this.duSan = `${this.dau}${this.dong.join(',')}},${this.duoi}${bc}}}`
    }
    return this.duSan
  }

  /** Ảnh LỌC cho em `id`; em chưa có trên sân ⇒ ảnh đủ. */
  cho(id: string): string {
    const i0 = this.chiSo.get(id)
    if (i0 === undefined) return this.du()
    const n = this.ids.length, danh = this.danh, x0 = this.x[i0], y0 = this.y[i0], d0 = this.doi[i0], R2 = GUI_GAN_BK * GUI_GAN_BK
    if (++this.lan >= 0xffffffff) { this.lan = 1; danh.fill(0) }
    const lan = this.lan, q: number[] = []
    // (a) vùng tròn quanh X (gồm chính X).
    for (let i = 0; i < n; i++) { const dx = this.x[i] - x0, dy = this.y[i] - y0; if (dx * dx + dy * dy <= R2) { danh[i] = lan; q.push(i) } }
    // (b) kẻ bắn vào người trong tập — lặp tới ổn định (hàng đợi mở rộng dần).
    for (let k = 0; k < q.length; k++) {
      const b = this.ban[q[k]]
      if (b) for (const s of b) if (danh[s] !== lan) { danh[s] = lan; q.push(s) }
    }
    // (c) thủ khoa (không mở rộng); đồng đội còn ngoài tập ⇒ `dd` gọn.
    if (this.tkI >= 0) danh[this.tkI] = lan
    let ds = '', dd = ''
    for (let i = 0; i < n; i++) {
      if (danh[i] === lan) ds += ds ? `,${this.dong[i]}` : this.dong[i]
      else if (this.doi[i] === d0) dd += `${dd ? ',' : ''}${Math.round(this.x[i])},${Math.round(this.y[i])}`
    }
    let bc = ''
    if (this.anh.bc) for (const k in this.anh.bc) { const j = this.chiSo.get(k); if (j !== undefined && danh[j] === lan) bc += `${bc ? ',' : ''}${JSON.stringify(k)}:${this.anh.bc[k]}` }
    const hg = this.hang.get(id)
    return `${this.dau}${ds}},${this.duoi}${dd ? `,"dd":[${dd}]` : ''}${bc ? `,"bc":{${bc}}` : ''}${hg ? `,"hg":${hg}` : ''}}}`
  }
}
