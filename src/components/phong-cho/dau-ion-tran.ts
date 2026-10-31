// BỘ CHẠY TRẬN «Đấu Nguyên Tử 2» ở máy em — hai kiểu cùng một giao diện để lớp React / vẽ không cần biết đang chơi mạng hay tại máy:
//  · TranAI: em + 5 A.I chạy NGAY trên máy bằng lõi chung, 0 mạng (khi sảnh tắt, vé hết hạn, mất mạng hẳn).
//  · TranMang: phòng đấu quyết mọi thứ; máy em CHỈ gửi hướng đi (~12 lần/giây), đoán trước bước đi của CHÍNH em rồi khớp theo ảnh trận;
//    bạn khác vẽ trễ 100 ms, nội suy giữa hai ảnh. Đạn: phòng gửi một sự kiện mỗi loạt, máy em tự sinh 1–5 viên theo cấp và cho bay.
//    Tự ngắm của em chạy cả ở máy (cùng hàm của lõi) để vẽ đường ngắm ngay, không chờ mạng.
import { CAP, GIAY_NGHI, GIAY_VAN, MAU_MAX, R, R_DAN, SAN, TAM_DAN, TEN_NGUYEN_TO, TOC_DAN, aiDi, buocDi, buocTran, chonMuc, dungVatCan, laySuKien, taoTran, vanMoi, xepBang, type LoaiVp, type SuKien, type Tran } from '../../lib/dau-ion/loi'
import { maYDinh, type Anh } from '../../lib/dau-ion/goi'
import type { Canh, DanVe, GheVe, VpVe } from './dau-ion-ve'

export interface DongBang { id: number; ha: number; biHa: number; capMax: number; chuoiMax: number }
export interface TrangEm { mau: number; cap: number; e: number; ha: number; nt: number; cho: boolean }
export interface BoChay {
  readonly emId: number
  readonly mang: boolean
  /** Một khung: dt (giây), hướng đi của em, đồng hồ (ms). */
  buoc(dt: number, dx: number, dy: number, nay: number): void
  canh(nay: number): Canh
  laySu(): SuKien[]
  ten(id: number): string
  ntCua(id: number): number
  em(): TrangEm | null
  con(): number
  /** Bảng xếp hạng đang chạy (id, hạ, cấp). */
  xep(): { id: number; ha: number; cap: number }[]
  /** Kết quả ván vừa hết (đang nghỉ 6 giây), null khi đang chơi. */
  ket(): DongBang[] | null
  conNghi(nay: number): number
  vanMoi(): void
  phu(): string
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
  constructor(nt: number, hat = Date.now()) {
    // Mỗi sân 6 màu khác nhau: A.I lấy 5 nguyên tố còn lại.
    const con = [1, 2, 4, 5, 6, 0, 3].filter((i) => i !== nt).slice(0, 5)
    this.tr = taoTran([{ id: 1, nt }, ...con.map((k, i) => ({ id: i + 2, nt: k, ai: true }))], hat & 0xffff)
    this.tr.su = []
  }
  ntCua(id: number): number { return this.tr.ghe.find((g) => g.id === id)?.nt ?? 0 }
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
  em(): TrangEm | null { const g = this.tr.ghe[0]; return { mau: g.mau, cap: g.cap, e: g.e, ha: g.ha, nt: g.nt, cho: g.cho > 0 } }
  con(): number { return this.tr.con }
  xep() { return xepBang(this.tr) }
  ket(): DongBang[] | null { return this.bang }
  conNghi(nay: number): number { return Math.max(0, (this.nghiDen - nay) / 1000) }
  vanMoi(): void { vanMoi(this.tr); this.tr.su = []; this.bang = null; this.du = 0 }
  phu(): string { return 'Chơi với A.I tại máy · em + 5 A.I' }
}

interface AnhCo { t: number; a: Anh }
interface DanMang extends DanVe { chu: number; con: number }
interface ThongTin { ten: string; nt: number; ai: boolean }

/** Trễ vẽ bạn khác (ms) — đủ để luôn có hai ảnh trận kẹp hai bên ở nhịp 20 lần/giây. */
const TRE_VE = 100
const NHIP_GUI = 1 / 12

export class TranMang implements BoChay {
  readonly mang = true
  readonly emId: number
  private anh: AnhCo[] = []
  private viTri = { x: 0, y: 0, vx: 0, vy: 0, co: false }
  private choGui: { seq: number; dx: number; dy: number; dt: number }[] = []
  private seq = 0
  private tichGui = 0
  private dan: DanMang[] = []
  private vp = new Map<number, VpVe>()
  private suTre: { t: number; s: SuKien }[] = []
  private su: SuKien[] = []
  private ds = new Map<number, ThongTin>()
  private bang: DongBang[] | null = null
  private nghiDen = 0
  private conGiay = GIAY_VAN
  private gocCu = new Map<number, number>()
  so = 0
  private gui: (b: Uint8Array) => void
  constructor(j: Record<string, unknown>, gui: (b: Uint8Array) => void, nay: number) {
    this.gui = gui
    this.emId = Number(j.toi)
    this.so = Number(j.so) || 1
    this.conGiay = Number(j.con) || GIAY_VAN
    this.datGhe(j.ghe)
    this.datVp(j.vp, nay)
  }
  private datGhe(ghe: unknown): void {
    this.ds.clear()
    for (const d of (ghe as unknown[][]) ?? []) this.ds.set(Number(d[0]), { ten: String(d[1] ?? ''), nt: Number(d[2]) || 0, ai: !!d[3] })
  }
  private datVp(vp: unknown, nay: number): void {
    this.vp.clear()
    for (const d of (vp as unknown[][]) ?? []) this.vp.set(Number(d[0]), { id: Number(d[0]), k: String(d[1]) as LoaiVp, x: Number(d[2]), y: Number(d[3]), t0: nay / 1000 - 1 })
  }
  ntCua(id: number): number { return this.ds.get(id)?.nt ?? 0 }
  ten(id: number): string { return this.ds.get(id)?.ten ?? 'Bạn' }

  /** Gói JSON của sân (`ghe`, `ket`, `van`). */
  nhanJson(j: Record<string, unknown>, nay: number): void {
    if (j.t === 'ghe') this.datGhe(j.ghe)
    else if (j.t === 'ket') { this.bang = ((j.bang as number[][]) ?? []).map((d) => ({ id: d[0], ha: d[1], biHa: d[2], capMax: d[3], chuoiMax: d[4] })); this.nghiDen = nay + (Number(j.nghi) || GIAY_NGHI) * 1000; this.dan = [] }
    else if (j.t === 'van') { this.bang = null; this.conGiay = Number(j.con) || GIAY_VAN; this.datVp(j.vp, nay); this.anh = []; this.viTri.co = false; this.dan = []; this.suTre = [] }
  }

  /** Ảnh trận mới từ phòng đấu. */
  nhanAnh(a: Anh, nay: number): void {
    this.anh.push({ t: nay, a }); if (this.anh.length > 8) this.anh.shift()
    this.conGiay = a.con
    // Loạt bắn của CHÍNH em: bay ngay từ chỗ em đang thấy mình; còn lại trễ cùng nhịp vẽ bạn khác.
    for (const s of a.su) { if (s.t === 'ban' && s.chu === this.emId) this.apSu(s, nay); else this.suTre.push({ t: nay + TRE_VE, s }) }
    // Khớp vị trí của em: vị trí phòng đã áp tới ý định `ack`, áp lại các ý định chưa được nhận.
    const g = a.ghe.find((x) => x.id === this.emId)
    if (!g) return
    while (this.choGui.length && ((a.ack - this.choGui[0].seq) & 0xff) < 128) this.choGui.shift()
    const v = this.viTri
    if (g.cho || !v.co) { v.x = g.x; v.y = g.y; v.vx = v.vy = 0; v.co = !g.cho; return }
    const p = { x: g.x, y: g.y, vx: v.vx, vy: v.vy }
    for (const c of this.choGui) buocDi(p, c.dx, c.dy, c.dt)
    const ex = p.x - v.x, ey = p.y - v.y
    if (ex * ex + ey * ey > 80 * 80) { v.x = p.x; v.y = p.y } else { v.x += ex * 0.25; v.y += ey * 0.25 }
  }

  private apSu(s: SuKien, nay: number): void {
    const t = nay / 1000
    if (s.t === 'ban') {
      // Em: loạt bay từ chỗ em đang thấy mình, về mục tiêu em đang thấy.
      let { x, y, ngam } = s
      if (s.chu === this.emId && this.viTri.co) {
        const c = this.canh(nay), em = c.ghe.find((g) => g.id === this.emId), m = em && c.ghe.find((g) => g.id === em.muc)
        if (em) { if (m) ngam = Math.atan2(m.y - em.y, m.x - em.x); x = em.x + Math.cos(ngam) * (R + 12); y = em.y + Math.sin(ngam) * (R + 12) }
        s = { ...s, x, y, ngam }
      }
      const cs = Math.cos(ngam), sn = Math.sin(ngam), nt = this.ntCua(s.chu)
      for (const b of CAP[s.cap]?.vien ?? []) {
        const a = ngam + b.g
        this.dan.push({ chu: s.chu, nt, cap: s.cap, x: x - cs * 6 - sn * b.l, y: y - sn * 6 + cs * b.l, vx: Math.cos(a) * TOC_DAN, vy: Math.sin(a) * TOC_DAN, con: TAM_DAN })
      }
    } else if (s.t === 'trung' || s.t === 'chan') {
      // Viên đã trúng: bỏ viên gần nhất của người bắn quanh mục tiêu.
      const { ai, boi } = s, g = this.canh(nay).ghe.find((k) => k.id === ai)
      let tot = -1, gan = 60
      if (g) this.dan.forEach((d, i) => { const l = Math.hypot(d.x - g.x, d.y - g.y); if (d.chu === boi && l < gan) { gan = l; tot = i } })
      if (tot >= 0) this.dan.splice(tot, 1)
    } else if (s.t === 'vp') this.vp.set(s.id, { id: s.id, k: s.k, x: s.x, y: s.y, t0: t })
    else if (s.t === 'nhat') { const v = this.vp.get(s.id); if (v) { s = { ...s, k: v.k, x: v.x, y: v.y }; this.vp.delete(s.id) } }
    this.su.push(s)
  }

  buoc(dt: number, dx: number, dy: number, nay: number): void {
    for (let i = 0; i < this.suTre.length;) { if (this.suTre[i].t <= nay) { this.apSu(this.suTre[i].s, nay); this.suTre.splice(i, 1) } else i++ }
    // Đạn tại máy: bay thẳng; tắt ở vật che / mép sân / hết tầm, hoặc chạm nguyên tử đang vẽ (phòng sẽ báo trúng).
    if (this.dan.length) {
      const ghe = this.canh(nay).ghe
      for (let i = this.dan.length - 1; i >= 0; i--) {
        const d = this.dan[i]
        d.x += d.vx * dt; d.y += d.vy * dt; d.con -= TOC_DAN * dt
        let mat = d.con <= 0
        if (!mat && (d.x < 0 || d.y < 0 || d.x > SAN || d.y > SAN || dungVatCan(d.x, d.y, R_DAN - 1))) { mat = true; this.su.push({ t: 'tat', x: d.x, y: d.y, nt: d.nt }) }
        if (!mat) for (const g of ghe) if (g.id !== d.chu && g.cho <= 0 && (g.x - d.x) ** 2 + (g.y - d.y) ** 2 < (R + R_DAN) ** 2) { mat = true; break }
        if (mat) this.dan.splice(i, 1)
      }
    }
    // Đang nghỉ giữa hai ván: đứng yên nhưng vẫn gửi (phòng biết em còn ở sân).
    if (this.bang) dx = dy = 0
    const v = this.viTri, cuoi = this.anh[this.anh.length - 1]?.a.ghe.find((x) => x.id === this.emId)
    if (v.co && cuoi && !cuoi.cho && !this.bang) buocDi(v, dx, dy, dt)
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
  }

  canh(nay: number): Canh {
    const t = nay - TRE_VE
    let a0 = this.anh[0], a1 = this.anh[this.anh.length - 1]
    for (let i = 0; i < this.anh.length - 1; i++) if (this.anh[i].t <= t && this.anh[i + 1].t >= t) { a0 = this.anh[i]; a1 = this.anh[i + 1]; break }
    const k = a0 && a1 && a1.t > a0.t ? Math.max(0, Math.min(1, (t - a0.t) / (a1.t - a0.t))) : 1
    const moi = a1?.a
    const ghe: GheVe[] = []
    for (const g of moi?.ghe ?? []) {
      let x = g.x, y = g.y, vx = 0, vy = 0
      const laEm = g.id === this.emId
      if (laEm && this.viTri.co) { x = this.viTri.x; y = this.viTri.y; vx = this.viTri.vx; vy = this.viTri.vy }
      else if (!laEm) {
        const p0 = a0?.a.ghe.find((q) => q.id === g.id)
        if (p0 && !p0.cho && !g.cho) { x = p0.x + (g.x - p0.x) * k; y = p0.y + (g.y - p0.y) * k; vx = (g.x - p0.x) * 20; vy = (g.y - p0.y) * 20 }
      }
      // Không có mục tiêu ⇒ nòng quay theo hướng đi.
      const cu = Math.hypot(vx, vy) > 40 ? Math.atan2(vy, vx) : this.gocCu.get(g.id) ?? Math.atan2(300 - y, 300 - x)
      ghe.push({ id: g.id, nt: this.ntCua(g.id), x, y, ngam: cu, mau: g.mau, cap: g.cap, cho: g.cho ? 1 : 0, che: g.che ? 1 : 0, khien: g.khien, muc: g.muc, ha: g.ha, vang: g.vang })
    }
    // Nòng quay về mục tiêu đang vẽ; em tự ngắm ngay tại máy (cùng hàm của lõi), không chờ mạng.
    for (const g of ghe) {
      if (g.id === this.emId && !g.cho) { const m = g.vang ? null : chonMuc(ghe, g); g.muc = m ? m.id : 0 }
      const m = g.muc ? ghe.find((q) => q.id === g.muc) : undefined
      if (m) g.ngam = Math.atan2(m.y - g.y, m.x - g.x)
      this.gocCu.set(g.id, g.ngam)
    }
    return { t: nay / 1000, ghe, dan: this.dan, vp: [...this.vp.values()] }
  }
  laySu(): SuKien[] { const s = this.su; this.su = []; return s }
  em(): TrangEm | null {
    const g = this.anh[this.anh.length - 1]?.a.ghe.find((x) => x.id === this.emId)
    return g ? { mau: g.mau, cap: g.cap, e: g.e, ha: g.ha, nt: this.ntCua(g.id), cho: g.cho } : { mau: MAU_MAX, cap: 1, e: 0, ha: 0, nt: this.ntCua(this.emId), cho: false }
  }
  con(): number { return this.conGiay }
  xep() {
    const ghe = this.anh[this.anh.length - 1]?.a.ghe ?? []
    const ds = ghe.map((g) => ({ id: g.id, ha: g.ha, cap: g.cap })).sort((a, b) => b.ha - a.ha || b.cap - a.cap)
    // Hết ván: đúng thứ tự bảng kết quả của phòng (đã xét cả bị hạ, cấp cao nhất).
    if (this.bang) { const t = this.bang.map((d) => d.id); ds.sort((a, b) => t.indexOf(a.id) - t.indexOf(b.id)) }
    return ds
  }
  ket(): DongBang[] | null { return this.bang }
  conNghi(nay: number): number { return Math.max(0, (this.nghiDen - nay) / 1000) }
  /** «Chơi ván mới»: phòng bắt ván mới khi mọi bạn thật trong sân cùng bấm (hoặc hết 6 giây). */
  vanMoi(): void { /* gửi ở lớp mạng */ }
  phu(): string {
    let that = 0, ai = 0
    for (const d of this.ds.values()) if (d.ai) ai++; else that++
    return `Sân ${this.so} · ${that} bạn${ai ? ` + ${ai} A.I` : ''}`
  }
}
