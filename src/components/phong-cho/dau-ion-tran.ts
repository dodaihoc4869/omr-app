// BỘ CHẠY TRẬN «Đấu Nguyên Tử» ở máy em — hai kiểu cùng một giao diện để lớp React/vẽ không cần biết đang đấu mạng hay tập:
//  · TranAI: trận chạy NGAY trên máy (Tập với A.I) bằng lõi chung, 0 mạng — cũng là chế độ khi Sảnh đấu tắt / mất mạng.
//  · TranMang: phòng đấu quyết; máy em đoán trước bước đi của CHÍNH em (đi mượt, không chờ mạng) rồi khớp lại theo ảnh trận;
//    bạn đấu vẽ trễ 100 ms giữa hai ảnh trận (nội suy) ⇒ mượt dù gói đến không đều.
import { BUOC, LUAT, R_NGUOI, TOC_DAN, bangKet, buocTran, diChuyen, laySuKien, taoTran, yDinhAI, type DongKet, type KieuTran, type SuKien, type Tran, type YDinh } from '../../lib/dau-ion/loi'
import { maYDinh, type Anh } from '../../lib/dau-ion/goi'
import type { Canh, HienDan, HienGhe } from './dau-ion-ve'

export interface ThongTinGhe { id: number; ten: string; nt: number; mau: number; ha: number; biHa: number; cho: boolean }
export interface KetTran { thang: number | null; bang: DongKet[]; roi?: boolean; banRoi?: boolean }
export interface BoChay {
  readonly emId: number
  readonly kieu: KieuTran
  readonly haThang: number
  buoc(dt: number, yd: YDinh, nay: number): void
  canh(nay: number, ngamEm: boolean): Canh
  laySu(): SuKien[]
  bang(): { con: number; ghe: ThongTinGhe[] }
  ketQua(): KetTran | null
  ntCua(id: number): number
}

const BUOC_MAY = 1 / 60

export class TranAI implements BoChay {
  readonly emId = 1
  readonly kieu: KieuTran = 'ai'
  readonly haThang = LUAT.ai.haThang
  private tr: Tran
  private du = 0
  private su: SuKien[] = []
  private ten: [string, string]
  private muc: 0 | 1
  constructor(ten: [string, string], nt: number, ntAI: number, muc: 0 | 1, hat = Date.now()) {
    this.ten = ten; this.muc = muc
    this.tr = taoTran('ai', [{ id: 1, nt }, { id: 2, nt: ntAI }], hat)
  }
  ntCua(id: number): number { return this.tr.ghe.find((g) => g.id === id)?.nt ?? 0 }
  buoc(dt: number, yd: YDinh): void {
    this.du = Math.min(0.25, this.du + dt)
    while (this.du >= BUOC_MAY && !this.tr.xong) {
      this.tr.ghe[0].yd = yd
      this.tr.ghe[1].yd = yDinhAI(this.tr, this.tr.ghe[1], this.muc)
      buocTran(this.tr, BUOC_MAY)
      for (const s of laySuKien(this.tr)) this.su.push(s)
      this.du -= BUOC_MAY
    }
  }
  canh(_nay: number, ngamEm: boolean): Canh {
    return {
      ghe: this.tr.ghe.map((g, i) => ({ id: g.id, nt: g.nt, ten: this.ten[i], x: g.x, y: g.y, ngam: g.ngam, mau: g.mau, khien: g.khien > 0, xucTac: g.xucTac > 0, giap: g.giap, cho: g.cho > 0, laEm: g.id === 1 })),
      dan: this.tr.dan.map((d) => ({ x: d.x, y: d.y, vx: d.vx, vy: d.vy, nt: this.ntCua(d.chu) })),
      vp: this.tr.vp, ngamEm,
    }
  }
  laySu(): SuKien[] { const s = this.su; this.su = []; return s }
  bang() { return { con: this.tr.con, ghe: this.tr.ghe.map((g, i) => ({ id: g.id, ten: this.ten[i], nt: g.nt, mau: g.mau, ha: g.ha, biHa: g.biHa, cho: g.cho > 0 })) } }
  ketQua(): KetTran | null { return this.tr.xong ? { thang: this.tr.thang, bang: bangKet(this.tr) } : null }
}

interface AnhCo { t: number; a: Anh }
interface ChoGui { seq: number; yd: YDinh; dt: number }
interface DanMang extends HienDan { id: number; chu: number; con: number }

/** Trễ vẽ bạn đấu (ms) — đủ để luôn có hai ảnh trận kẹp hai bên ở nhịp 20 lần/giây. */
const TRE_VE = 100
const NHIP_GUI = 1 / 12

export class TranMang implements BoChay {
  readonly haThang: number
  private anh: AnhCo[] = []
  private em = { x: 0, y: 0, co: false }
  private choGui: ChoGui[] = []
  private seq = 0
  private tichGui = 0
  private ydCu: YDinh | null = null
  private dan = new Map<number, DanMang>()
  private suTre: { t: number; s: SuKien }[] = []
  private su: SuKien[] = []
  private vp: Canh['vp'] = null
  private ket: KetTran | null = null
  private con: number
  readonly emId: number
  readonly kieu: KieuTran
  private ghe: { id: number; ten: string; nt: number }[]
  private gui: (b: Uint8Array) => void
  constructor(emId: number, kieu: KieuTran, ghe: { id: number; ten: string; nt: number }[], gui: (b: Uint8Array) => void) {
    this.emId = emId; this.kieu = kieu; this.ghe = ghe; this.gui = gui
    this.haThang = LUAT[kieu].haThang
    this.con = LUAT[kieu].giay
  }
  ntCua(id: number): number { return this.ghe.find((g) => g.id === id)?.nt ?? 0 }
  datKet(k: KetTran): void { this.ket = k }

  /** Ảnh trận mới từ phòng đấu. */
  nhanAnh(a: Anh, nay: number): void {
    this.anh.push({ t: nay, a }); if (this.anh.length > 8) this.anh.shift()
    this.con = a.con
    // Sự kiện của đạn CHÍNH em xử lý ngay (đạn bay ra từ chỗ em đang thấy mình); còn lại trễ cùng nhịp vẽ bạn đấu.
    for (const s of a.su) {
      const cuaEm = (s.t === 'ban' && s.chu === this.emId) || ((s.t === 'trung' || s.t === 'chan') && this.dan.get(s.id)?.chu === this.emId)
      if (cuaEm) this.apSu(s); else this.suTre.push({ t: nay + TRE_VE, s })
    }
    // Khớp vị trí của em: lấy vị trí phòng đấu đã áp tới ý định `ack`, áp lại các ý định chưa được nhận.
    const g = a.ghe.find((x) => x.id === this.emId)
    if (!g) return
    while (this.choGui.length && ((a.ack - this.choGui[0].seq) & 0xff) < 128) this.choGui.shift()
    if (g.cho || !this.em.co) { this.em = { x: g.x, y: g.y, co: !g.cho }; return }
    let p = { x: g.x, y: g.y }
    for (const c of this.choGui) p = diChuyen(p.x, p.y, c.yd.dx, c.yd.dy, c.dt)
    const ex = p.x - this.em.x, ey = p.y - this.em.y
    if (ex * ex + ey * ey > 80 * 80) { this.em.x = p.x; this.em.y = p.y } else { this.em.x += ex * 0.25; this.em.y += ey * 0.25 }
  }

  private apSu(s: SuKien): void {
    if (s.t === 'ban') {
      const vx = Math.cos(s.ngam) * TOC_DAN, vy = Math.sin(s.ngam) * TOC_DAN
      this.dan.set(s.id, { id: s.id, chu: s.chu, x: s.x, y: s.y, vx, vy, nt: this.ntCua(s.chu), con: 1.3 })
    } else if (s.t === 'trung' || s.t === 'chan') this.dan.delete(s.id)
    else if (s.t === 'vp') this.vp = { loai: s.loai, x: s.x, y: s.y }
    else if (s.t === 'nhat') this.vp = null
    this.su.push(s)
  }

  buoc(dt: number, yd: YDinh, nay: number): void {
    for (let i = 0; i < this.suTre.length;) { if (this.suTre[i].t <= nay) { this.apSu(this.suTre[i].s); this.suTre.splice(i, 1) } else i++ }
    for (const d of this.dan.values()) { d.x += d.vx * dt; d.y += d.vy * dt; d.con -= dt; if (d.con <= 0) this.dan.delete(d.id) }
    if (this.ket) return
    const last = this.anh[this.anh.length - 1]?.a.ghe.find((x) => x.id === this.emId)
    if (this.em.co && last && !last.cho) { const p = diChuyen(this.em.x, this.em.y, yd.dx, yd.dy, dt); this.em.x = p.x; this.em.y = p.y }
    if (this.choGui.length) this.choGui[this.choGui.length - 1].dt += dt
    // Gửi ý định ~12 lần/giây, và gửi NGAY khi vừa bấm / thả bắn.
    this.tichGui += dt
    const doiBan = !!this.ydCu && this.ydCu.ban !== yd.ban
    if (this.tichGui >= NHIP_GUI || doiBan) {
      this.tichGui = 0
      this.seq = (this.seq + 1) & 0xff
      this.choGui.push({ seq: this.seq, yd: { ...yd }, dt: 0 })
      if (this.choGui.length > 30) this.choGui.shift()
      this.gui(maYDinh(this.seq, yd))
    }
    this.ydCu = { ...yd }
  }

  canh(nay: number, ngamEm: boolean): Canh {
    const t = nay - TRE_VE
    let a0 = this.anh[0], a1 = this.anh[this.anh.length - 1]
    for (let i = 0; i < this.anh.length - 1; i++) if (this.anh[i].t <= t && this.anh[i + 1].t >= t) { a0 = this.anh[i]; a1 = this.anh[i + 1]; break }
    const k = a0 && a1 && a1.t > a0.t ? Math.max(0, Math.min(1, (t - a0.t) / (a1.t - a0.t))) : 1
    const moi = this.anh[this.anh.length - 1]?.a
    const ghe: HienGhe[] = []
    for (const g of moi?.ghe ?? []) {
      const m = this.ghe.find((x) => x.id === g.id)
      const laEm = g.id === this.emId
      let x = g.x, y = g.y, ngam = g.ngam
      if (laEm && this.em.co) { x = this.em.x; y = this.em.y }
      else if (!laEm) {
        const p0 = a0?.a.ghe.find((q) => q.id === g.id), p1 = a1?.a.ghe.find((q) => q.id === g.id)
        if (p0 && p1 && !p0.cho && !p1.cho) {
          x = p0.x + (p1.x - p0.x) * k; y = p0.y + (p1.y - p0.y) * k
          let d = p1.ngam - p0.ngam; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2
          ngam = p0.ngam + d * k
        } else if (p1) { x = p1.x; y = p1.y; ngam = p1.ngam }
      }
      ghe.push({ id: g.id, nt: m?.nt ?? 0, ten: m?.ten ?? '', x, y, ngam, mau: g.mau, khien: g.khien, xucTac: g.xucTac, giap: g.giap, cho: g.cho, laEm })
    }
    return { ghe, dan: [...this.dan.values()], vp: this.vp, ngamEm }
  }
  /** Ngắm của em vẽ theo ý định đang giữ (không chờ ảnh trận). */
  datNgamEm(c: Canh, ngam: number): void { const e = c.ghe.find((g) => g.laEm); if (e) e.ngam = ngam }
  laySu(): SuKien[] { const s = this.su; this.su = []; return s }
  bang() {
    const moi = this.anh[this.anh.length - 1]?.a
    return { con: this.con, ghe: this.ghe.map((m) => { const g = moi?.ghe.find((x) => x.id === m.id); return { id: m.id, ten: m.ten, nt: m.nt, mau: g?.mau ?? 3, ha: g?.ha ?? 0, biHa: g?.biHa ?? 0, cho: !!g?.cho } }) }
  }
  ketQua(): KetTran | null { return this.ket }
  /** Vị trí em đang thấy (để tự ngắm / ngắm theo chạm). */
  viTriEm(): { x: number; y: number } | null { return this.em.co ? { x: this.em.x, y: this.em.y } : null }
}

/** Hướng ngắm về bạn gần nhất còn trên sân (tự ngắm khi chạm nhanh / phím cách không dùng chuột). */
export function ngamGanNhat(c: Canh): number | null {
  const em = c.ghe.find((g) => g.laEm && !g.cho)
  if (!em) return null
  let tot: HienGhe | null = null, gan = 1e9
  for (const g of c.ghe) if (!g.laEm && !g.cho) { const d = Math.hypot(g.x - em.x, g.y - em.y); if (d < gan) { gan = d; tot = g } }
  return tot ? Math.atan2(tot.y - em.y, tot.x - em.x) : null
}
export const BAN_KINH_CHAM = R_NGUOI
export { BUOC }
