// BỘ CHẠY TRẬN «Đấu Nguyên Tử» ở máy em — hai kiểu cùng một giao diện để lớp React / vẽ không cần biết đang chơi mạng hay tại máy:
//  · TranAI: 3 đấu 3 ngay trên máy (em + 2 A.I đồng đội đấu 3 A.I) bằng lõi chung, 0 mạng (sảnh tắt, vé hết hạn, mất mạng hẳn).
//  · TranMang: phòng đấu quyết mọi thứ; sân luôn đủ 6 ghế (thiếu bạn thì A.I ngồi ghế, bạn vào là A.I nhường chỗ — gói `thay {cu, moi}`). Máy em CHỈ
//    gửi hướng đi (~12 lần/giây), đoán trước bước đi của CHÍNH em rồi khớp êm theo ảnh trận.
// MƯỢT HẲN (thầy 01/11: «bắn hiện tại vẫn hơi giật lag làm mượt hẳn»):
//  · Bạn khác vẽ theo DÒNG THỜI GIAN CỦA PHÒNG (bước trận trong ảnh), không theo giờ nhận gói: ước lượng lệch đồng hồ = đáy (min) của (giờ nhận − giờ phòng)
//    trong 2 giây gần nhất; ĐỆM TRỄ tự co giãn 100–200 ms theo độ rung mạng (p90 + 35 ms); thiếu ảnh ⇒ NGOẠI SUY ≤ 120 ms theo vận tốc thay vì đứng hình.
//  · Súng CỦA EM bắn NGAY tại máy theo đúng nhịp cấp súng khi máy em thấy đối thủ lộ (chỉ là hình; phòng vẫn quyết trúng / hạ); đạn của em chạm
//    đối thủ ⇒ nháy ngay (`cham`), «−1» chờ phòng xác nhận. Loạt phòng gửi về cho em mà máy em đã vẽ ⇒ bỏ, không vẽ đôi.
//  · Khớp vị trí em: sai lệch kéo dần theo hàm mũ (không giật theo nhịp gói); lệch quá 80 đơn vị mới nhảy.
// Toạ độ ở đây là toạ độ SÂN (Bazơ trái, Axit phải); xoay về khung vẽ ở dau-ion-xoay.ts.
import { BUOC, CAP, GIAY_NGHI, GIAY_VAN, MAU_MAX, R, R_DAN, SAN_H, SAN_W, TAM_DAN, TAM_X, TAM_Y, TEN_NGUYEN_TO, TOC_DAN, aiDi, buocDi, buocTran, chonMuc, doiTheo, dungVatCan, laySuKien, taoTran, vanMoi, xepBang, type LoaiVp, type SuKien, type Tran } from '../../lib/dau-ion/loi'
import { maYDinh, type Anh, type GheAnh } from '../../lib/dau-ion/goi'
import type { Canh, DanVe, GheVe, VpVe } from './dau-ion-ve'

/** Một dòng bảng hết ván (đủ để chọn huy hiệu — xem `huyHieu` ở lõi). */
export interface DongBang { id: number; phe: number; ai: boolean; nt: number; ha: number; biHa: number; capMax: number; chuoiMax: number; cap: number; nhatE: number; hoTro: number; trung: number; songMax: number }
export interface TrangEm { mau: number; cap: number; e: number; ha: number; nt: number; phe: number; cho: boolean }
export interface BoChay {
  readonly emId: number
  readonly mang: boolean
  /** Một khung: dt (giây), hướng đi của em (TOẠ ĐỘ SÂN), đồng hồ (ms). */
  buoc(dt: number, dx: number, dy: number, nay: number): void
  canh(nay: number): Canh
  laySu(): SuKien[]
  ten(id: number): string
  ntCua(id: number): number
  pheCua(id: number): number
  laAI(id: number): boolean
  em(): TrangEm | null
  con(): number
  /** Tỉ số [Bazơ, Axit] = số lần hạ của mỗi phe trong ván. */
  tiSo(): [number, number]
  /** Ghế đang chơi (id, phe, hạ, cấp) — để vẽ hai cột phe. */
  xep(): { id: number; phe: number; ha: number; cap: number }[]
  /** Kết quả ván vừa hết (đang nghỉ 6 giây), null khi đang chơi. */
  ket(): DongBang[] | null
  conNghi(nay: number): number
  vanMoi(): void
  phu(): string
  /** (Cũ) sân chờ bạn — 3 đấu 3 luôn đủ ghế nên luôn false. */
  cho(): boolean
}

const BUOC_MAY = 1 / 60
const tenAI = (nt: number) => `A.I ${TEN_NGUYEN_TO[nt] ?? ''}`

export class TranAI implements BoChay {
  readonly emId = 1
  readonly mang = false
  tr: Tran
  private du = 0
  private su: SuKien[] = []
  private nghiDen = 0
  private bang: DongBang[] | null = null
  constructor(nt: number, hat = Date.now(), phe = (hat >> 4) & 1) {
    // 6 ghế 6 nguyên tố khác nhau: em + 2 A.I cùng phe, 3 A.I phe kia.
    const con = [1, 2, 4, 5, 6, 0, 3].filter((i) => i !== nt).slice(0, 5)
    this.tr = taoTran([{ id: 1, nt, phe }, ...con.map((k, i) => ({ id: i + 2, nt: k, ai: true, phe: i < 2 ? phe : 1 - phe }))], hat & 0xffff)
    this.tr.su = []
  }
  ntCua(id: number): number { return this.tr.ghe.find((g) => g.id === id)?.nt ?? 0 }
  pheCua(id: number): number { return this.tr.ghe.find((g) => g.id === id)?.phe ?? 0 }
  laAI(id: number): boolean { return id !== 1 }
  ten(id: number): string { return id === 1 ? 'Em' : tenAI(this.ntCua(id)) }
  buoc(dt: number, dx: number, dy: number, nay: number): void {
    if (this.bang) { if (nay >= this.nghiDen) this.vanMoi(); return }
    this.du = Math.min(0.25, this.du + dt)
    while (this.du >= BUOC_MAY && !this.tr.xong) {
      this.du -= BUOC_MAY
      for (const g of this.tr.ghe) g.yd = g.ai ? aiDi(this.tr, g, BUOC_MAY) : { dx, dy }
      buocTran(this.tr, BUOC_MAY)
      for (const s of laySuKien(this.tr)) this.su.push(s)
    }
    if (this.tr.xong) { this.bang = xepBang(this.tr); this.nghiDen = nay + GIAY_NGHI * 1000 }
  }
  canh(): Canh { return this.tr }
  laySu(): SuKien[] { const s = this.su; this.su = []; return s }
  em(): TrangEm | null { const g = this.tr.ghe[0]; return { mau: g.mau, cap: g.cap, e: g.e, ha: g.ha, nt: g.nt, phe: g.phe, cho: g.cho > 0 } }
  con(): number { return this.tr.con }
  tiSo(): [number, number] { return [this.tr.ti[0], this.tr.ti[1]] }
  xep() { return this.tr.ghe.map((g) => ({ id: g.id, phe: g.phe, ha: g.ha, cap: g.cap })) }
  ket(): DongBang[] | null { return this.bang }
  conNghi(nay: number): number { return Math.max(0, (this.nghiDen - nay) / 1000) }
  vanMoi(): void { vanMoi(this.tr); this.tr.su = []; this.bang = null; this.du = 0 }
  phu(): string { return 'Chơi tại máy · em + 2 A.I đấu 3 A.I' }
  cho(): boolean { return false }
}

/** Ảnh trận đặt lên dòng thời gian của phòng: T = bước trận (đã mở vòng) × 50 ms. */
interface AnhCo { T: number; a: Anh }
interface DanMang extends DanVe { chu: number; con: number }
interface ThongTin { ten: string; nt: number; ai: boolean; phe: number; xoaLuc?: number }

const MS_BUOC = BUOC * 1000
/** Đệm trễ vẽ bạn khác (ms): co giãn trong khoảng này theo độ rung mạng. */
export const DEM_MIN = 100
export const DEM_MAX = 200
/** Thiếu ảnh mới: ngoại suy tối đa (ms) rồi mới đứng. */
export const NGOAI_SUY = 120
const CUA_SO = 40
const NHIP_GUI = 1 / 12

export class TranMang implements BoChay {
  readonly mang = true
  readonly emId: number
  private anh: AnhCo[] = []
  /** Bước trận đã mở vòng (uint16 ⇒ số tăng mãi). */
  private kMo = -1
  private kTho = 0
  /** Mẫu (giờ nhận − giờ phòng) để ước lượng lệch đồng hồ và độ rung. */
  private mau: number[] = []
  private lechVe = NaN
  private demVe = DEM_MIN
  private viTri = { x: 0, y: 0, vx: 0, vy: 0, co: false }
  private sai = { x: 0, y: 0 }
  private choGui: { seq: number; dx: number; dy: number; dt: number }[] = []
  private seq = 0
  private tichGui = 0
  private dan: DanMang[] = []
  private vp = new Map<number, VpVe>()
  private suTre: { T: number; s: SuKien }[] = []
  private su: SuKien[] = []
  private ds = new Map<number, ThongTin>()
  private bang: DongBang[] | null = null
  private tiKet: [number, number] = [0, 0]
  private nghiDen = 0
  private conGiay = GIAY_VAN
  private gocCu = new Map<number, number>()
  /** Súng của em bắn tại máy. */
  private napEm = 0.3
  private banEmLuc = -1e9
  private canhNho: { nay: number; c: Canh } | null = null
  so = 0
  private gui: (b: Uint8Array) => void
  constructor(j: Record<string, unknown>, gui: (b: Uint8Array) => void, nay: number) {
    this.gui = gui
    this.emId = Number(j.toi)
    this.so = Number(j.so) || 1
    this.conGiay = Number(j.con) || GIAY_VAN
    this.datGhe(j.ghe, nay)
    this.datVp(j.vp, nay)
  }
  /** Dòng ghế: [id, tên, nguyên tố, là A.I (0/1), phe]. Ghế vừa rời giữ thêm 3 giây (để vẽ bong bóng / tên ở tin). */
  private datGhe(ghe: unknown, nay: number): void {
    const co = new Set<number>()
    for (const d of (ghe as unknown[][]) ?? []) { co.add(Number(d[0])); this.ds.set(Number(d[0]), { ten: String(d[1] ?? ''), nt: Number(d[2]) || 0, ai: !!d[3], phe: Number(d[4]) & 1 }) }
    for (const [id, t] of this.ds) { if (co.has(id)) continue; if (!t.xoaLuc) t.xoaLuc = nay + 3000; else if (nay > t.xoaLuc) this.ds.delete(id) }
  }
  private datVp(vp: unknown, nay: number): void {
    this.vp.clear()
    for (const d of (vp as unknown[][]) ?? []) this.vp.set(Number(d[0]), { id: Number(d[0]), k: String(d[1]) as LoaiVp, x: Number(d[2]), y: Number(d[3]), t0: nay / 1000 - 1 })
  }
  ntCua(id: number): number { return this.ds.get(id)?.nt ?? 0 }
  pheCua(id: number): number { return this.ds.get(id)?.phe ?? 0 }
  laAI(id: number): boolean { return !!this.ds.get(id)?.ai }
  /** A.I ghi rõ «A.I» trước tên để em biết. */
  ten(id: number): string { const d = this.ds.get(id); return !d ? 'Bạn' : d.ai ? `A.I ${d.ten}` : d.ten }

  /** Gói JSON của sân (`ghe`, `thay`, `ket`, `van`). */
  nhanJson(j: Record<string, unknown>, nay: number): void {
    if (j.t === 'ghe') this.datGhe(j.ghe, nay)
    else if (j.t === 'thay') {
      // Đổi người ở một ghế: ghế cũ tan thành bong bóng (vẽ theo dòng thời gian, lúc ghế cũ còn trên hình), ghế mới vào bảng tên ngay.
      const cu = Number(j.cu), moi = Number(j.moi), laAI = !!j.ai, tenCu = this.ten(cu)
      this.ds.set(moi, { ten: String(j.ten ?? ''), nt: Number(j.nt) || 0, ai: laAI, phe: Number(j.phe) & 1 })
      const c = this.ds.get(cu); if (c && cu !== moi) c.xoaLuc = nay + 3000
      this.su.push({ t: 'thay', ai: cu, moi, laAI, tenCu })
    } else if (j.t === 'ket') {
      // Dòng: [id, hạ, bị hạ, cấp cao nhất, chuỗi hạ, electron đã nhặt, góp sức, trúng, giây trụ liền].
      this.bang = ((j.bang as number[][]) ?? []).map((d) => {
        const t = this.ds.get(d[0])
        return { id: d[0], phe: t?.phe ?? 0, ai: !!t?.ai, nt: t?.nt ?? 0, ha: d[1], biHa: d[2], capMax: d[3], chuoiMax: d[4], cap: d[3], nhatE: d[5] ?? 0, hoTro: d[6] ?? 0, trung: d[7] ?? 0, songMax: d[8] ?? 0 }
      })
      const ti = j.ti as number[] | undefined
      this.tiKet = ti ? [Number(ti[0]) || 0, Number(ti[1]) || 0] : [0, 1].map((p) => this.bang!.filter((d) => d.phe === p).reduce((s, d) => s + d.ha, 0)) as [number, number]
      this.nghiDen = nay + (Number(j.nghi) || GIAY_NGHI) * 1000; this.dan = []
    } else if (j.t === 'van') {
      this.bang = null; this.conGiay = Number(j.con) || GIAY_VAN; if (j.ghe) this.datGhe(j.ghe, nay); this.datVp(j.vp, nay)
      this.anh = []; this.viTri.co = false; this.sai = { x: 0, y: 0 }; this.dan = []; this.suTre = []; this.napEm = 0.6; this.canhNho = null
    }
  }

  /** Giờ phòng (ms) của ảnh: mở vòng bước trận uint16. */
  private gioPhong(k: number): number {
    if (this.kMo < 0) { this.kMo = k; this.kTho = k }
    else { const d = (k - this.kTho) & 0xffff; if (d < 0x8000) { this.kMo += d; this.kTho = k } }
    return this.kMo * MS_BUOC
  }
  /** Lệch đồng hồ (đáy cửa sổ) + đệm trễ (p90 độ rung + 35 ms, kẹp 100–200), làm mềm để dòng thời gian không nhảy. */
  private datDongHo(o: number): void {
    this.mau.push(o); if (this.mau.length > CUA_SO) this.mau.shift()
    const day = Math.min(...this.mau), rung = this.mau.map((x) => x - day).sort((a, b) => a - b)
    const dem = Math.max(DEM_MIN, Math.min(DEM_MAX, rung[Math.floor(rung.length * 0.9)] + 35))
    if (Number.isNaN(this.lechVe)) { this.lechVe = day; this.demVe = dem; return }
    this.lechVe += (day - this.lechVe) * 0.1
    this.demVe += (dem - this.demVe) * 0.08
  }
  /** Giờ phòng đang vẽ (ms). */
  private gioVe(nay: number): number { return nay - this.lechVe - this.demVe }
  /** Đệm trễ đang dùng (đo / test). */
  get demTre(): number { return this.demVe }

  /** Ảnh trận mới từ phòng đấu. */
  nhanAnh(a: Anh, nay: number): void {
    const T = this.gioPhong(a.buoc)
    if (this.anh.length && T <= this.anh[this.anh.length - 1].T) return
    this.datDongHo(nay - T)
    this.anh.push({ T, a }); if (this.anh.length > 12) this.anh.shift()
    this.conGiay = a.con
    for (const s of a.su) {
      // Loạt của CHÍNH em: máy em đã bắn tại máy ⇒ bỏ (không vẽ đôi); máy em chưa bắn (khác tầm nhìn) ⇒ vẽ ngay.
      if (s.t === 'ban' && s.chu === this.emId) { const nhip = (CAP[s.cap]?.nhip ?? 0.4) * 1000; if (nay - this.banEmLuc > nhip * 1.5) { this.apSu(s, nay); this.napEm = nhip / 1000 } continue }
      // Việc của chính em (bị trúng, nhặt, lên cấp…) báo ngay; còn lại theo dòng thời gian của phòng (khớp với hình bạn khác).
      const cuaEm = (s.t === 'nhat' || s.t === 'len' || s.t === 'hoi') && s.ai === this.emId
      if (cuaEm) this.apSu(s, nay); else this.suTre.push({ T, s })
    }
    // Khớp vị trí của em: vị trí phòng đã áp tới ý định `ack` + áp lại các ý định chưa được nhận ⇒ sai lệch, kéo dần ở `buoc`.
    const g = a.ghe.find((x) => x.id === this.emId)
    if (!g) return
    while (this.choGui.length && ((a.ack - this.choGui[0].seq) & 0xff) < 128) this.choGui.shift()
    const v = this.viTri
    if (g.cho || !v.co) { v.x = g.x; v.y = g.y; v.vx = v.vy = 0; v.co = !g.cho; this.sai = { x: 0, y: 0 }; return }
    const p = { x: g.x, y: g.y, vx: v.vx, vy: v.vy }
    for (const c of this.choGui) buocDi(p, c.dx, c.dy, c.dt)
    const ex = p.x - v.x, ey = p.y - v.y
    if (ex * ex + ey * ey > 80 * 80) { v.x = p.x; v.y = p.y; this.sai = { x: 0, y: 0 } } else this.sai = { x: ex, y: ey }
  }

  private apSu(s: SuKien, nay: number): void {
    const t = nay / 1000
    if (s.t === 'ban') this.sinhDan(s.chu, s.cap, s.x, s.y, s.ngam)
    else if (s.t === 'trung' || s.t === 'chan') {
      // Viên đã trúng: bỏ viên gần nhất của người bắn quanh mục tiêu.
      const { ai, boi } = s, g = this.canh(nay).ghe.find((k) => k.id === ai)
      let tot = -1, gan = 60
      if (g) this.dan.forEach((d, i) => { const l = Math.hypot(d.x - g.x, d.y - g.y); if (d.chu === boi && l < gan) { gan = l; tot = i } })
      if (tot >= 0) this.dan.splice(tot, 1)
    } else if (s.t === 'vp') this.vp.set(s.id, { id: s.id, k: s.k, x: s.x, y: s.y, t0: t })
    else if (s.t === 'nhat') { const v = this.vp.get(s.id); if (v) { s = { ...s, k: v.k, x: v.x, y: v.y }; this.vp.delete(s.id) } }
    this.su.push(s)
  }
  private sinhDan(chu: number, cap: number, x: number, y: number, ngam: number): void {
    const cs = Math.cos(ngam), sn = Math.sin(ngam), nt = this.ntCua(chu), phe = this.pheCua(chu)
    for (const b of CAP[cap]?.vien ?? []) {
      const a = ngam + b.g
      this.dan.push({ chu, nt, phe, cap, x: x - cs * 6 - sn * b.l, y: y - sn * 6 + cs * b.l, vx: Math.cos(a) * TOC_DAN, vy: Math.sin(a) * TOC_DAN, con: TAM_DAN })
    }
  }

  buoc(dt: number, dx: number, dy: number, nay: number): void {
    const Tv = this.gioVe(nay)
    for (let i = 0; i < this.suTre.length;) { if (this.suTre[i].T <= Tv) { this.apSu(this.suTre[i].s, nay); this.suTre.splice(i, 1) } else i++ }
    if (this.suTre.length > 200) this.suTre.splice(0, this.suTre.length - 200)
    const c = this.canh(nay), em = c.ghe.find((g) => g.id === this.emId)
    // Súng CỦA EM: bắn tại máy theo nhịp cấp súng khi có đối thủ lộ (chỉ là hình — phòng quyết trúng / hạ).
    this.napEm -= dt
    if (em && !em.cho && !em.che && !em.vang && !this.bang && em.muc) {
      if (this.napEm <= 0) {
        const m = c.ghe.find((g) => g.id === em.muc)
        if (m) {
          const ngam = Math.atan2(m.y - em.y, m.x - em.x), cap = Math.max(1, Math.min(5, em.cap))
          const x = em.x + Math.cos(ngam) * (R + 12), y = em.y + Math.sin(ngam) * (R + 12)
          this.sinhDan(this.emId, cap, x, y, ngam)
          this.su.push({ t: 'ban', chu: this.emId, cap, x, y, ngam })
          this.napEm = CAP[cap].nhip; this.banEmLuc = nay
        }
      }
    } else if (this.napEm < 0) this.napEm = 0
    // Đạn tại máy: bay thẳng; tắt ở vật che / mép sân / hết tầm, hoặc chạm nguyên tử ĐỐI THỦ đang vẽ; xuyên đồng đội.
    // Đạn của em chạm ⇒ nháy ngay tại máy (`cham`), «−1» chờ phòng.
    if (this.dan.length) {
      for (let i = this.dan.length - 1; i >= 0; i--) {
        const d = this.dan[i]
        d.x += d.vx * dt; d.y += d.vy * dt; d.con -= TOC_DAN * dt
        let mat = d.con <= 0
        if (!mat && (d.x < 0 || d.y < 0 || d.x > SAN_W || d.y > SAN_H || dungVatCan(d.x, d.y, R_DAN - 1))) { mat = true; this.su.push({ t: 'tat', x: d.x, y: d.y, nt: d.nt, phe: d.phe }) }
        if (!mat) for (const g of c.ghe) if (g.id !== d.chu && g.phe !== d.phe && g.cho <= 0 && (g.x - d.x) ** 2 + (g.y - d.y) ** 2 < (R + R_DAN) ** 2) { mat = true; if (d.chu === this.emId && !g.che) this.su.push({ t: 'cham', ai: g.id, boi: this.emId, x: d.x, y: d.y }); break }
        if (mat) this.dan.splice(i, 1)
      }
    }
    // Đang nghỉ giữa hai ván: đứng yên nhưng vẫn gửi (phòng biết em còn ở sân).
    if (this.bang) dx = dy = 0
    const v = this.viTri, cuoi = this.anh[this.anh.length - 1]?.a.ghe.find((x) => x.id === this.emId)
    if (v.co && cuoi && !cuoi.cho && !this.bang) {
      buocDi(v, dx, dy, dt)
      // Khớp êm: kéo dần sai lệch (hàm mũ ~100 ms), bỏ qua lệch < 1 đơn vị.
      const k = 1 - Math.exp(-dt * 10)
      if (Math.abs(this.sai.x) + Math.abs(this.sai.y) > 1) { v.x += this.sai.x * k; v.y += this.sai.y * k; this.sai.x -= this.sai.x * k; this.sai.y -= this.sai.y * k }
    }
    if (this.choGui.length) this.choGui[this.choGui.length - 1].dt += dt
    // Gửi hướng đi ~12 lần/giây (cả khi đứng yên: phòng biết em còn ở sân, không thành «vắng»).
    this.tichGui += dt
    if (this.tichGui >= NHIP_GUI) {
      this.tichGui = Math.min(NHIP_GUI, this.tichGui - NHIP_GUI)
      this.seq = (this.seq + 1) & 0xff
      this.choGui.push({ seq: this.seq, dx, dy, dt: 0 })
      if (this.choGui.length > 30) this.choGui.shift()
      this.gui(maYDinh(this.seq, dx, dy))
    }
    this.canhNho = null
  }

  /** Cảnh ở đồng hồ `nay`: bạn khác ở giờ phòng (nay − lệch − đệm), nội suy giữa hai ảnh kẹp hai bên; vượt ảnh cuối ⇒ ngoại suy ≤ 120 ms. */
  canh(nay: number): Canh {
    if (this.canhNho && this.canhNho.nay === nay) return this.canhNho.c
    const Tv = this.gioVe(nay), n = this.anh.length
    let a0 = this.anh[Math.max(0, n - 2)], a1 = this.anh[n - 1]
    for (let i = 0; i < n - 1; i++) if (this.anh[i].T <= Tv && this.anh[i + 1].T >= Tv) { a0 = this.anh[i]; a1 = this.anh[i + 1]; break }
    if (n && Tv < this.anh[0].T) a0 = a1 = this.anh[0]
    const kMax = a0 && a1 && a1.T > a0.T ? 1 + NGOAI_SUY / (a1.T - a0.T) : 1
    const k = a0 && a1 && a1.T > a0.T ? Math.max(0, Math.min(kMax, (Tv - a0.T) / (a1.T - a0.T))) : 1
    const moi = a1?.a
    const ghe: GheVe[] = []
    const p0Cua = new Map<number, GheAnh>()
    for (const q of a0?.a.ghe ?? []) p0Cua.set(q.id, q)
    for (const g of moi?.ghe ?? []) {
      let x = g.x, y = g.y, vx = 0, vy = 0
      const laEm = g.id === this.emId
      if (laEm && this.viTri.co) { x = this.viTri.x; y = this.viTri.y; vx = this.viTri.vx; vy = this.viTri.vy }
      else if (!laEm) {
        const p0 = p0Cua.get(g.id), dtA = a1 && a0 ? (a1.T - a0.T) / 1000 : 0
        // Bỏ nội suy khi vừa hồi sinh / nhảy xa (> 60 đơn vị giữa hai ảnh).
        if (p0 && !p0.cho && !g.cho && dtA > 0 && Math.hypot(g.x - p0.x, g.y - p0.y) < 60) { x = p0.x + (g.x - p0.x) * k; y = p0.y + (g.y - p0.y) * k; vx = (g.x - p0.x) / dtA; vy = (g.y - p0.y) / dtA }
      }
      const cu = Math.hypot(vx, vy) > 40 ? Math.atan2(vy, vx) : this.gocCu.get(g.id) ?? Math.atan2(TAM_Y - y, TAM_X - x)
      ghe.push({ id: g.id, nt: this.ntCua(g.id), phe: this.pheCua(g.id), ai: this.laAI(g.id), x, y, ngam: cu, mau: g.mau, cap: g.cap, cho: g.cho ? 1 : 0, che: g.che ? 1 : 0, khien: g.khien, muc: g.muc, ha: g.ha, vang: g.vang })
    }
    // Nòng quay về mục tiêu; không có ai lộ ⇒ dõi đối thủ gần nhất (không bắn). Em tự ngắm ngay tại máy (cùng hàm của lõi), không chờ mạng.
    for (const g of ghe) {
      if (g.id === this.emId && !g.cho) { const m = g.vang ? null : chonMuc(ghe, g); g.muc = m ? m.id : 0 }
      const m = g.muc ? ghe.find((q) => q.id === g.muc) : doiTheo(ghe, g)
      if (m) g.ngam = Math.atan2(m.y - g.y, m.x - g.x)
      this.gocCu.set(g.id, g.ngam)
    }
    const c = { t: nay / 1000, ghe, dan: this.dan, vp: [...this.vp.values()] }
    this.canhNho = { nay, c }
    return c
  }
  laySu(): SuKien[] { const s = this.su; this.su = []; return s }
  em(): TrangEm | null {
    const g = this.anh[this.anh.length - 1]?.a.ghe.find((x) => x.id === this.emId)
    return g ? { mau: g.mau, cap: g.cap, e: g.e, ha: g.ha, nt: this.ntCua(g.id), phe: this.pheCua(g.id), cho: g.cho } : { mau: MAU_MAX, cap: 1, e: 0, ha: 0, nt: this.ntCua(this.emId), phe: this.pheCua(this.emId), cho: false }
  }
  con(): number { return this.conGiay }
  tiSo(): [number, number] { if (this.bang) return this.tiKet; const a = this.anh[this.anh.length - 1]?.a; return a ? [a.ti[0], a.ti[1]] : [0, 0] }
  xep() { return (this.anh[this.anh.length - 1]?.a.ghe ?? []).map((g) => ({ id: g.id, phe: this.pheCua(g.id), ha: g.ha, cap: g.cap })) }
  ket(): DongBang[] | null { return this.bang }
  conNghi(nay: number): number { return Math.max(0, (this.nghiDen - nay) / 1000) }
  /** Ván mới tự chạy sau 6 giây nghỉ (không cần bấm). */
  vanMoi(): void { /* phòng tự xoay ván */ }
  phu(): string { return `Sân ${this.so} · 3 đấu 3` }
  cho(): boolean { return false }
}
