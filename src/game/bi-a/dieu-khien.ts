// BI-A PHẢN ỨNG · BỘ ĐIỀU KHIỂN VÁN (chép luồng đã chạy thử ở bản vẽ docs/ban-ve-bi-a-2809, đặc tả mục 3). Không phụ thuộc React:
// giữ trạng thái ván, chạy vật lý theo khung, A.I, đồng hồ; hỏi màn chơi mở tấm câu qua `moCau`; màn chơi báo kết quả chấm bằng `xongCau`.
// Câu của em chấm ở MÁY CHỦ (lệnh `answer` chung) — tệp này không có đáp án. Câu của A.I chấm theo tỉ lệ G5 (bi A.I không mang câu thật).
// Sai là SANG LƯỢT NGAY (Q11): màn chơi gọi `xongCau(..., false)` lúc chấm xong, tấm lời giải vẫn mở trên máy em tới khi em bấm "Đã đọc".
import type { CauDao2 } from '../than-thu-v2/dao2/dao2-core'
import { aiDatBi, aiTinh, dichCua } from './ai'
import { nhamInfo } from './du-doan'
import {
  AI_DUNG, AI_DUNG_CHOT, DIEM_CHOT, DIEM_TRONG, EM, GIAY_CU, biCuaGhe, chiaBi, congMatThan, conLaiDoi, diemMuc, duocDanhTiep, hangMuc, hopLeDich, taoGhe, tiepTheo, xetCu,
  type BangBi, type CheDo, type Doi, type Ghe, type KetQuaXet, type MucHang,
} from './luat'
import { CHOT, KL, NHOM, PK, TEN_PHE, doiCuaBi, mauCss, type KiHieu } from './nguyen-to'
import { DIEM_DAU, H, HS, R, W, choHopLe, danhBi, dangChay, datCho, datLaiChan, quay, step, suKienMoi, tocDo, xepBan, type Ban, type Bi, type Lo, type SuKienCu } from './vat-ly'

export type CauBia = CauDao2
export type LoaiVan = 'ai' | 'giao_huu'
export type Pha = 'aim' | 'moving' | 'xet' | 'cau' | 'cho' | 'ai' | 'ai-nham' | 'over'
export type CheDoCau = 'sau-lo' | 'chot' | 'giai-truoc'
export interface YeuCauCau { ma: number; mode: CheDoCau; id: KiHieu; nguoiDanh: number; cau: CauBia }
export interface ThongBao { ma: number; chu: string; phu: string; loai: '' | 'tot' | 'loi'; ms: number }
export interface DongNhatKy { ma: number; giay: number; chu: string; loai: '' | 'tot' | 'loi' }
export interface TkGhe { dung: number; sai: number; an: number; vang: number; caiSai: string[] }
export interface HieuUng { k: 'vong' | 'hat' | 'giay'; x: number; y: number; vx: number; vy: number; s: number; c: string; t: number; life: number; r: number }
export interface KetThucVan { doiThang: Doi; nguoiHa: number; diem: [number, number]; giay: number }
export interface SuKienVan {
  moCau(y: YeuCauCau): void
  /** Phát một tiếng; (x, y) là toạ độ bàn để lệch trái/phải theo màn (vắng ⇒ giữa). */
  am(k: 'co' | 'lo' | 'dat' | 'an' | 'loi' | 'luot' | 'tich' | 'thang' | 'vang' | 'dung' | 'sai', v?: number, x?: number, y?: number): void
  /** `kho`: tiếng khô, không vang phòng (cú phá bàn — hàng chục đuôi vang chồng nhau nghe như bi lăn trên nỉ). */
  gomVa(k: 'bi' | 'bang', v: number, x: number, y: number, kho?: boolean): void
  ketThuc(k: KetThucVan): void
}
export interface TuyChonVan {
  cheDo: CheDo
  loai: LoaiVan
  tenEm: string
  /** Câu của các bi em giữ, theo thứ tự `biCuaGhe(bi, EM)`; thiếu ⇒ bi trống. */
  cauEm: readonly CauBia[]
  chot: CauBia | null
  rand?: () => number
  now?: () => number
}

const MUC_AI = ['TH', 'NB', 'VD', 'TH', 'NB', 'TH', 'VD'] as const
const HEN_MAC_DINH = (fn: () => void, ms: number) => { const t = setTimeout(fn, ms); return () => clearTimeout(t) }

export class VanBia {
  readonly cheDo: CheDo
  readonly loai: LoaiVan
  st: Ban
  ev: SuKienCu | null = null
  pha: Pha = 'aim'
  /** Ghế của em (ván A.I: luôn ghế 0; ván online: ghế phòng đấu xếp). */
  em: number = EM
  cur = EM
  aim = { x: 0, y: -1 }
  power = 0
  spin = { x: 0, y: 0 }
  ballInHand = false
  isBreak = true
  ghe: Ghe[]
  diem: [number, number] = [0, 0]
  time = GIAY_CU
  bi: BangBi
  cauCua: Partial<Record<KiHieu, CauBia>> = {}
  /** Mức độ giả định của bi do A.I giữ (đổi ngẫu nhiên khi A.I trả lời sai = đổi câu). */
  mucAi: Partial<Record<KiHieu, string>> = {}
  chotCau: CauBia | null
  chotTrong: boolean
  matThan = 0
  dungMT = false
  sheet: YeuCauCau | null = null
  xemMo = false
  tk: TkGhe[]
  fx: HieuUng[] = []
  roi: { id: KiHieu | 'cue'; x: number; y: number; px: number; py: number; t: number }[] = []
  noi: { x: number; y: number; chu: string; t: number }[] = []
  viTriLo: Partial<Record<KiHieu, { x: number; y: number }>> = {}
  thongBao: ThongBao | null = null
  nhatKy: DongNhatKy[] = []
  /** Vừa xảy ra ở lượt người khác (A.I giải trước…) — hiện nhanh trên bàn. */
  ptHop: { ma: number; chu: string }[] = []
  ai: { a0: number; a1: number; p: number; t: number } | null = null
  /** Mỗi lần đổi trạng thái đáng vẽ lại HUD ⇒ tăng. */
  phienBan = 0
  soCu = 0
  protected shotCon = 7
  protected acc = 0
  protected aiGiaiT = 0
  protected tich = 0
  protected ma = 0
  protected van = 0
  protected batDau: number
  protected rand: () => number
  protected now: () => number
  protected nghe = new Set<() => void>()
  protected hen: (fn: () => void, ms: number) => () => void = HEN_MAC_DINH
  protected huyHen: (() => void)[] = []
  nhan = 1

  protected sk: SuKienVan
  constructor(tc: TuyChonVan, sk: SuKienVan) {
    this.sk = sk
    this.cheDo = tc.cheDo
    this.loai = tc.loai
    this.rand = tc.rand ?? Math.random
    this.now = tc.now ?? (() => Date.now())
    this.st = xepBan(this.rand)
    this.ghe = taoGhe(tc.cheDo, tc.tenEm)
    this.bi = chiaBi(tc.cheDo)
    this.tk = this.ghe.map(() => ({ dung: 0, sai: 0, an: 0, vang: 0, caiSai: [] }))
    const cuaEm = biCuaGhe(this.bi, this.em)
    cuaEm.forEach((id, i) => { const c = tc.cauEm[i]; if (c) this.cauCua[id] = c; else this.bi[id].trong = true })
    if (tc.loai === 'giao_huu') for (const id of [...KL, ...PK]) this.bi[id].trong = true
    let m = 0
    for (const id of [...KL, ...PK]) if (this.bi[id].chu !== this.em) this.mucAi[id] = MUC_AI[m++ % MUC_AI.length]
    this.chotCau = tc.chot
    this.chotTrong = tc.loai === 'giao_huu' || !tc.chot
    this.batDau = this.now()
    this.goiYNham()
    const doi = this.cheDo === 'doi'
    this.bao(`${this.ghe[this.em]!.ten} phá bàn`, doi ? `Em giữ bi ${cuaEm.join(', ')} · đồng đội ${this.ghe[2]!.ngan} giữ bi ${biCuaGhe(this.bi, 2).join(', ')}` : `${TEN_PHE[0]}: 7 bi trơn ánh kim${this.loai === 'giao_huu' ? ' · Bàn giao hữu, không câu' : ' là câu của em'}`, '', 1900)
  }

  // ───────────── đăng ký vẽ lại ─────────────
  dangKy(fn: () => void): () => void { this.nghe.add(fn); return () => { this.nghe.delete(fn) } }
  protected doi(): void { this.phienBan++; for (const f of this.nghe) f() }
  /** Hẹn giờ gắn với ván: huỷ ván là mọi hẹn tự bỏ. */
  protected sau(fn: () => void, ms: number): void {
    const v = this.van
    const huy = this.hen(() => { if (this.van === v) fn() }, ms)
    this.huyHen.push(huy)
  }
  /** Dùng hẹn giờ giả (test). */
  datHen(h: (fn: () => void, ms: number) => () => void): void { this.hen = h }
  huy(): void { this.van++; for (const h of this.huyHen) h(); this.huyHen = []; this.nghe.clear() }

  // ───────────── tiện ích ─────────────
  bi_(id: KiHieu | 'cue'): Bi { return this.st.balls.find((b) => b.id === id)! }
  giayChoi(): number { return Math.max(0, Math.round((this.now() - this.batDau) / 1000)) }
  laLuotEm(): boolean { return this.cur === this.em }
  nguoiDuocDanh(): boolean { return this.pha === 'aim' && !this.ghe[this.cur]!.ai && !this.sheet && !this.xemMo }
  coTheGiaiTruoc(): boolean { return this.loai !== 'giao_huu' && this.cur !== this.em && this.pha !== 'over' && !this.sheet && !this.xemMo }
  /** Mức độ câu của bi: câu thật (bi của em) hoặc mức giả định của bi A.I (không có câu thật, G5). */
  mucBi(id: KiHieu): string | null { return this.cauCua[id]?.mucDo ?? this.mucAi[id] ?? null }
  diemBi(id: KiHieu): number { return this.bi[id].trong ? DIEM_TRONG : diemMuc(this.mucBi(id)) }
  protected bao(chu: string, phu: string, loai: ThongBao['loai'], ms: number): void {
    this.thongBao = { ma: ++this.ma, chu, phu, loai, ms }
    this.nhatKy.unshift({ ma: this.ma, giay: this.giayChoi(), chu: chu + (phu ? ` · ${phu}` : ''), loai })
    if (this.nhatKy.length > 40) this.nhatKy.length = 40
    this.doi()
  }
  protected ptNhanh(chu: string): void {
    this.ptHop.push({ ma: ++this.ma, chu })
    if (this.ptHop.length > 2) this.ptHop.shift()
    this.nhatKy.unshift({ ma: this.ma, giay: this.giayChoi(), chu, loai: '' })
    const m = this.ma
    this.sau(() => { this.ptHop = this.ptHop.filter((x) => x.ma !== m); this.doi() }, 2600)
    this.doi()
  }
  goiYNham(): void {
    const c = this.bi_('cue')
    if (!c.on) return
    let best: Bi | null = null, bd = 1e9
    for (const b of dichCua(this.st, this.bi, this.ghe[this.cur]!.doi)) { const d = Math.hypot(b.x - c.x, b.y - c.y); if (d < bd) { bd = d; best = b } }
    if (best && bd > 1) this.aim = { x: (best.x - c.x) / bd, y: (best.y - c.y) / bd }
  }

  // ───────────── thao tác của em ─────────────
  datLuc(p: number): void { this.power = Math.max(0, Math.min(1, p)) }
  datXoay(x: number, y: number): void { const d = Math.hypot(x, y); if (d > 0.8) { x *= 0.8 / d; y *= 0.8 / d } this.spin = { x, y }; this.doi() }
  nhamToi(p: { x: number; y: number }): void {
    const c = this.bi_('cue'), dx = p.x - c.x, dy = p.y - c.y, d = Math.hypot(dx, dy)
    if (d > 4) this.aim = { x: dx / d, y: dy / d }
  }
  xoayNham(doDo: number): void {
    const a = doDo * Math.PI / 180, cs = Math.cos(a), sn = Math.sin(a), x = this.aim.x
    this.aim = { x: x * cs - this.aim.y * sn, y: x * sn + this.aim.y * cs }
  }
  /** Kéo bi cái (được đặt bi cái). Trả true nếu đặt được. */
  keoBiCai(x: number, y: number): boolean {
    if (!this.ballInHand || !this.nguoiDuocDanh()) return false
    const c = this.bi_('cue'), px = Math.max(R, Math.min(W - R, x)), py = Math.max(R, Math.min(H - R, y))
    if (!choHopLe(this.st, px, py, 'cue')) return false
    c.x = px; c.y = py
    return true
  }
  ban(): boolean {
    if (this.pha !== 'aim' || (this.sheet && !this.ghe[this.cur]!.ai)) return false // tấm câu của em chỉ chặn cú đánh của em, không chặn A.I
    const c = this.bi_('cue'), p = this.power
    if (p < 0.02) return false
    danhBi(c, this.aim.x, this.aim.y, p, this.spin.x, this.spin.y)
    this.ev = suKienMoi()
    this.shotCon = conLaiDoi(this.bi, this.ghe[this.cur]!.doi)
    const nguoi = !this.ghe[this.cur]!.ai
    if (nguoi && this.matThan > 0 && this.loai !== 'giao_huu') { this.matThan--; this.dungMT = true } else this.dungMT = false
    this.pha = 'moving'; this.ballInHand = false; this.acc = 0; this.soCu++
    if (!this.isBreak) this.sk.am('co', tocDo(p), c.x, c.y) // phá bàn: chỉ tiếng bi chạm bi (thầy 28/09)
    this.power = 0
    this.doi()
    return true
  }
  /** Em chạm ô ở hàng "Bi của em" để giải trước. */
  giaiTruoc(id: KiHieu): 'mo' | 'da_an' | 'vang' | 'trong' | 'chua_duoc' {
    const s = this.bi[id]
    if (s.chu !== this.em) return 'chua_duoc'
    if (s.an) return 'da_an'
    if (s.vang) return 'vang'
    if (s.trong || !this.cauCua[id]) return 'trong'
    if (!this.coTheGiaiTruoc()) return 'chua_duoc'
    this.moCau('giai-truoc', id, this.cur)
    return 'mo'
  }
  datXemMo(mo: boolean): void { this.xemMo = mo; this.doi() }
  /** Nhắc nhanh trên bàn (chạm ô bi chưa giải trước được…). */
  nhac(chu: string, phu = '', ms = 1400): void { this.bao(chu, phu, '', ms) }

  // ───────────── khung hình ─────────────
  /** Gọi mỗi khung hình với số giây trôi qua. */
  buoc(dt: number): void {
    this.buocVatLy(dt)
    if (this.pha === 'ai-nham' && this.ai) {
      const a = this.ai
      a.t += dt
      const k = Math.min(1, a.t / 0.7), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2, an = a.a0 + (a.a1 - a.a0) * e
      this.aim = { x: Math.cos(an), y: Math.sin(an) }
      if (a.t > 0.7) this.power = Math.min(a.p, (a.t - 0.7) / 0.45 * a.p)
      if (a.t > 1.25) { this.aim = { x: Math.cos(a.a1), y: Math.sin(a.a1) }; this.power = a.p; this.pha = 'aim'; this.ai = null; this.ban() }
    }
    this.buocDongHo(dt)
    this.buocHieuUng(dt)
  }
  /** Móc va chạm của vật lý ⇒ tiếng + bi rơi (dùng chung cho ván A.I và ván online). */
  protected hookVa(): (k: 'bi' | 'bang' | 'lo', a: Bi, b: Bi | Lo | null, v?: number) => void {
    return (k, a, b, v) => {
        // Cú phá bàn (thầy 28/09): CHỈ tiếng bi chạm bi, khô (không vang) — không tiếng băng, không tiếng rơi lỗ.
        const phaBan = this.isBreak
        if (k === 'bi') this.sk.gomVa('bi', v ?? 0, a.x, a.y, phaBan)
        else if (k === 'bang') { if (!phaBan) this.sk.gomVa('bang', Math.hypot(a.vx, a.vy), a.x, a.y) }
        else if (k === 'lo' && b && a.id !== 'cue') { this.roi.push({ id: a.id, x: a.x, y: a.y, px: b.x, py: b.y, t: 0 }); this.viTriLo[a.id] = { x: b.x, y: b.y }; if (!phaBan) this.sk.am('lo', 0, b.x, b.y) }
        else if (k === 'lo' && b) { this.roi.push({ id: 'cue', x: a.x, y: a.y, px: b.x, py: b.y, t: 0 }); if (!phaBan) this.sk.am('lo', 0, b.x, b.y) }
    }
  }
  protected buocVatLy(dt: number): void {
    if (this.pha === 'moving' && this.ev) {
      this.acc += dt * this.nhan
      let n = 0
      const hook = this.hookVa()
      while (this.acc >= HS && n < 24 * this.nhan) { step(this.st, this.ev, hook); for (const b of this.st.balls) if (b.on) quay(b, HS); this.acc -= HS; n++ }
      if (!dangChay(this.st)) { this.acc = 0; this.pha = 'xet'; this.sau(() => this.ketThucCu(), this.roi.length ? 260 : 120); this.doi() }
    }
  }
  protected buocDongHo(dt: number): void {
    if (this.nguoiDuocDanh()) {
      this.time -= dt * this.nhan
      if (this.time <= 5 && this.time > 0) { const s = Math.ceil(this.time); if (s !== this.tich) { this.tich = s; this.sk.am('tich') } }
      if (this.time <= 0) { this.time = 0; this.bao(`Hết ${GIAY_CU} giây`, `Sang lượt ${this.ghe[tiepTheo(this.cur, this.ghe.length)]!.ten}`, '', 1400); this.doiLuot(false, 300) }
    }
  }
  protected buocHieuUng(dt: number): void {
    if (this.pha !== 'over' && this.pha !== 'cho' && this.loai !== 'giao_huu') {
      this.aiGiaiT += dt * this.nhan
      if (this.aiGiaiT >= 12) { this.aiGiaiT = 0; this.aiGiaiTruoc() }
    }
    for (const f of this.fx) { f.t += dt; if (f.t < 0) continue; if (f.k === 'hat') { f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= 0.94; f.vy *= 0.94 } else if (f.k === 'giay') { f.x += f.vx * dt; f.y += f.vy * dt } }
    this.fx = this.fx.filter((f) => f.t < f.life)
    for (const r of this.roi) r.t += dt
    this.roi = this.roi.filter((r) => r.t < 0.3)
    for (const n2 of this.noi) n2.t += dt
    this.noi = this.noi.filter((n2) => n2.t < 1.2)
  }

  // ───────────── cuối cú đánh ─────────────
  ketThucCu(): void {
    const ev = this.ev ?? suKienMoi(), p = this.cur, me = this.ghe[p]!, ke = this.ghe[tiepTheo(p, this.ghe.length)]!
    const laPhaBan = this.isBreak
    const kq = xetCu(ev, p, this.ghe, this.bi, laPhaBan, this.shotCon, this.chotTrong)
    this.isBreak = false
    if (kq.maLoi) {
      kq.datLai.forEach((id) => datLaiChan(this.st, this.bi_(id)))
      if (kq.datBiCai) { const c = this.bi_('cue'); c.on = true; datCho(this.st, c, DIEM_DAU.x, DIEM_DAU.y) }
      this.sk.am('loi')
      this.bao(`Phạm luật: ${kq.loi}`, (kq.datLai.length ? `${kq.datLai.length} bi rơi trong cú này quay lại bàn · ` : '') + `${ke.ten} được đặt bi cái`, 'loi', 2100)
      this.doiLuot(true, 2100)
      return
    }
    kq.cuaBan.forEach((id) => datLaiChan(this.st, this.bi_(id)))
    let dVang = 0
    for (const id of kq.anNgay) { dVang += this.diemBi(id); this.anBi(id, this.bi[id].chu) }
    if (kq.thangNgay) { this.thang(me.doi, p); return }
    if (kq.anNgay.length) this.bao(kq.anNgay.some((id) => this.bi[id].trong) ? 'Bi trống vào lỗ · ăn ngay' : 'Bi vàng vào lỗ · ăn ngay', `${TEN_PHE[me.doi]} +${dVang} điểm`, 'tot', 1200)
    this.doi()
    this.xuLyHang([...kq.hang], p, kq, [])
  }
  /** Trả lời lần lượt; một câu sai ⇒ các bi còn chờ về chân bàn (không mở câu), lượt sang ngay (G13). */
  protected xuLyHang(hang: MucHang[], p: number, kq: KetQuaXet, ketQua: { dung: boolean; nguoiTL: number; chot: boolean }[]): void {
    if (!hang.length) return this.sauHang(p, kq, ketQua)
    const it = hang.shift()!
    const s = it.nguoiTL
    const tiep = (dung: boolean) => {
      ketQua.push({ dung, nguoiTL: s, chot: it.loai === 'chot' })
      if (it.loai === 'chot' && dung) return this.thang(this.ghe[p]!.doi, p)
      if (!dung) { for (const r of hang) if (r.loai === 'bi') datLaiChan(this.st, this.bi_(r.id)); hang.length = 0; return this.sauHang(p, kq, ketQua) }
      this.sau(() => this.xuLyHang(hang, p, kq, ketQua), 300)
    }
    const id = it.loai === 'chot' ? CHOT : it.id
    if (this.ghe[s]!.ai) return this.aiTraLoi(it.loai === 'chot', id, s, tiep)
    // Câu của em: bi chưa có câu (hết trần) ⇒ bi trống — đã xử lý ở `xetCu`. Tấm giải trước đang mở ⇒ chốt xong câu đó mới mở câu này.
    const mo = () => { if (this.sheet) { this.sau(mo, 250); return } this.moCau(it.loai === 'chot' ? 'chot' : 'sau-lo', id, p, tiep) }
    if (this.sheet) { this.pha = 'cau'; this.bao(`${this.ghe[p]!.ngan} đánh bi ${id} của em vào lỗ`, 'Chốt xong câu đang giải thì trả lời bi này', '', 2200) }
    mo()
  }
  protected sauHang(p: number, kq: KetQuaXet, ketQua: { dung: boolean; nguoiTL: number }[]): void {
    const me = this.ghe[p]!, ke = this.ghe[tiepTheo(p, this.ghe.length)]!
    if (duocDanhTiep(kq, ketQua.map((r) => r.dung))) {
      if (ketQua.length) this.bao(`${me.ten} đánh tiếp`, '', 'tot', 1000)
      this.sau(() => this.batDauLuot(false), ketQua.length ? 300 : 700)
      return
    }
    const sai = ketQua.some((r) => !r.dung), emSai = ketQua.some((r) => !r.dung && r.nguoiTL === this.em)
    const ly = sai ? 'Trả lời chưa đúng' : kq.cuaBan.length ? `Bi ${kq.cuaBan.join(', ')} của phe đối thủ rơi, quay lại chân bàn` : 'Không ăn được bi nào'
    this.bao(ly, `Sang lượt ${ke.ten}`, '', 1400)
    this.doiLuot(false, emSai ? 250 : 1400)
  }
  protected anBi(id: KiHieu, s: number): void {
    this.bi[id].an = true
    const d = this.diemBi(id)
    this.diem[this.ghe[s]!.doi] += d
    this.tk[s]!.an++
    const v = this.viTriLo[id] ?? { x: W / 2, y: H / 2 }, x = Math.max(30, Math.min(W - 30, v.x)), y = Math.max(40, Math.min(H - 20, v.y))
    this.noi.push({ x, y, chu: `+${d}`, t: 0 })
    for (let i = 0; i < 22; i++) { const a = this.rand() * 6.283, sp = 40 + this.rand() * 90; this.fx.push({ k: 'hat', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: 2 + this.rand() * 2.5, c: 'rgb(255,214,107)', t: 0, life: 0.9 + this.rand() * 0.6, r: 0 }) }
    this.fx.push({ k: 'vong', x, y, vx: 0, vy: 0, s: 0, c: '', t: 0, life: 0.6, r: 0 })
    this.sk.am('an')
  }
  protected doiLuot(datBiCai: boolean, tre: number): void {
    this.pha = 'cho'
    this.doi()
    this.sau(() => {
      if (this.pha === 'over') return
      this.cur = tiepTheo(this.cur, this.ghe.length); this.ballInHand = datBiCai; this.spin = { x: 0, y: 0 }
      const me = this.ghe[this.cur]!
      if (!me.ai) this.bao('Lượt của em', datBiCai ? 'Kéo bi cái tới chỗ muốn đặt rồi đánh' : this.matThan ? `Có ${this.matThan} Mắt thần` : 'Chạm bàn để nhắm', '', 1300)
      else this.bao(`Lượt của ${me.ten}`, me.doi === this.ghe[this.em]!.doi ? 'Đồng đội đang đánh · em giải trước được' : this.loai === 'giao_huu' ? '' : 'Chạm ô ở hàng “Bi của em” để giải trước', '', 1500)
      this.sk.am('luot')
      this.batDauLuot(true)
    }, tre)
  }
  /** Tới lượt ghế hiện tại (lượt em ⇒ màn chơi tự đóng tấm Xem lại câu sai). */
  batDauLuot(moi: boolean): void {
    this.time = GIAY_CU; this.tich = 0; this.power = 0
    const me = this.ghe[this.cur]!
    this.goiYNham()
    if (me.ai) { this.pha = 'ai'; this.doi(); this.sau(() => this.aiDanh(), moi ? 1300 : 700); return }
    this.pha = 'aim'
    this.doi()
  }
  protected thang(doi: Doi, p: number): void {
    this.pha = 'over'
    this.sk.am('thang')
    for (let i = 0; i < 140; i++) {
      const c = mauCss([...KL, ...PK][i % 14]!), a = this.rand(), b = this.rand()
      this.fx.push({ k: 'giay', x: b * W, y: -20 - a * 300, vx: (this.rand() - 0.5) * 60, vy: 120 + this.rand() * 160, s: 3 + this.rand() * 4, c, t: 0, life: 3 + this.rand() * 1.5, r: this.rand() * 6 })
    }
    this.diem[doi] += this.chotTrong ? 0 : DIEM_CHOT
    this.bao(`${this.ghe[p]!.ten} hạ Bi chốt`, this.cheDo === 'doi' ? `${TEN_PHE[doi]} thắng ván` : 'Thắng ván', 'tot', 1600)
    this.sau(() => this.sk.ketThuc({ doiThang: doi, nguoiHa: p, diem: [...this.diem] as [number, number], giay: this.giayChoi() }), 1500)
  }

  // ───────────── tấm câu (em) ─────────────
  protected choCau = new Map<number, (dung: boolean) => void>()
  protected moCau(mode: CheDoCau, id: KiHieu, nguoiDanh: number, xong?: (dung: boolean) => void): void {
    const cau = mode === 'chot' ? this.chotCau : this.cauCua[id]
    if (!cau) { xong?.(true); return } // không có câu (không xảy ra: bi trống đã ăn ngay ở xetCu)
    const y: YeuCauCau = { ma: ++this.ma, mode, id, nguoiDanh, cau }
    this.sheet = y
    if (xong) this.choCau.set(y.ma, xong)
    if (mode !== 'giai-truoc') this.pha = 'cau'
    this.doi()
    this.sk.moCau(y)
  }
  /**
   * Màn chơi báo kết quả chấm của tấm câu `ma`. `dung` do MÁY CHỦ chấm. `dong`: true khi em bấm nút đóng tấm (đúng: "Đánh tiếp"/"Về bàn";
   * sai: "Đã đọc lời giải"). Câu SAI gọi ngay lúc chấm (dong=false) để lượt sang ngay; câu ĐÚNG gọi khi em đóng tấm.
   */
  xongCau(ma: number, dung: boolean, dong: boolean, tinh = true): void {
    const y = this.sheet
    if (!y || y.ma !== ma) { if (dong && this.sheet?.ma === ma) this.sheet = null; return }
    const id = y.id, me = this.tk[this.em]!
    if (!this.dachamSet.has(ma)) {
      this.dachamSet.add(ma)
      // `tinh = false`: hết giờ khi chưa chọn đủ (không gửi máy chủ) ⇒ trong ván vẫn như sai, nhưng KHÔNG đếm câu sai, không báo "vào lịch ôn".
      if (dung) { me.dung++; this.sk.am(y.mode === 'giai-truoc' ? 'vang' : 'dung') } else { if (tinh) { me.sai++; me.caiSai.push(y.cau.tenDang || '') } this.sk.am('sai') }
      if (y.mode === 'sau-lo') {
        if (dung) { this.anBi(id, this.em); this.matThan = congMatThan(this.matThan) }
        else datLaiChan(this.st, this.bi_(id))
      } else if (y.mode === 'chot') {
        if (dung) this.matThan = congMatThan(this.matThan)
        else datLaiChan(this.st, this.bi_(CHOT))
      } else {
        if (dung) { this.bi[id].vang = true; me.vang++; this.matThan = congMatThan(this.matThan) }
      }
    }
    const cho = this.choCau.get(ma)
    if (!dung && cho) { this.choCau.delete(ma); this.pha = 'cho'; this.sau(() => cho(false), 0) } // sai: sang lượt NGAY
    if (dong) {
      this.sheet = null
      if (dung && cho) { this.choCau.delete(ma); cho(true) }
    }
    this.doi()
  }
  protected dachamSet = new Set<number>()
  /** Máy chủ đổi câu cho bi sau câu sai (`null` ⇒ bi trống). Câu chốt: `id = 'C'`. */
  doiCau(id: KiHieu, cau: CauBia | null): void {
    if (id === CHOT) { this.chotCau = cau; if (!cau) this.chotTrong = true }
    else { if (cau) { this.cauCua[id] = cau; this.bi[id].doiCau++ } else { delete this.cauCua[id]; this.bi[id].trong = true } }
    this.doi()
  }

  // ───────────── đối thủ máy A.I ─────────────
  protected aiTraLoi(laChot: boolean, id: KiHieu, s: number, tiep: (d: boolean) => void): void {
    this.pha = 'cau'
    const hang = laChot ? 2 : hangMuc(this.mucBi(id))
    const dung = this.rand() < (laChot ? AI_DUNG_CHOT : AI_DUNG[hang]), ai = this.ghe[s]!
    this.bao(laChot ? `${ai.ten} đang giải Câu chốt` : `${ai.ten} đang giải câu bi ${id}`, ['Nhận biết', 'Thông hiểu', 'Vận dụng'][hang]!, '', 1300)
    this.sau(() => {
      if (dung) { this.tk[s]!.dung++; if (!laChot) { this.anBi(id, s); this.bao(`${ai.ngan} trả lời đúng · ăn bi ${id}`, `+${this.diemBi(id)} điểm`, 'tot', 1200) } }
      else { this.tk[s]!.sai++; datLaiChan(this.st, this.bi_(id)); if (!laChot && this.bi[id].chu !== this.em) this.mucAi[id] = ['NB', 'TH', 'VD'][Math.floor(this.rand() * 3)]!; this.bao(`${ai.ngan} trả lời chưa đúng · bi ${laChot ? 'chốt' : id} quay lại bàn`, '', 'loi', 1200) }
      this.doi()
      this.sau(() => tiep(dung), dung ? 1100 : 700)
    }, 1400)
  }
  protected aiGiaiTruoc(): void {
    const ds = this.ghe.map((_, i) => i).filter((i) => this.ghe[i]!.ai && i !== this.cur)
    if (!ds.length) return
    const s = ds[Math.floor(this.rand() * ds.length)]!
    const bi = [...KL, ...PK].filter((id) => this.bi[id].chu === s && !this.bi[id].an && !this.bi[id].vang && this.bi_(id).on)
    if (!bi.length) return
    const id = bi[Math.floor(this.rand() * bi.length)]!
    const dung = this.rand() < AI_DUNG[hangMuc(this.mucBi(id))], ai = this.ghe[s]!
    if (dung) { this.bi[id].vang = true; this.tk[s]!.dung++; this.tk[s]!.vang++ } else { this.tk[s]!.sai++; this.mucAi[id] = ['NB', 'TH', 'VD'][Math.floor(this.rand() * 3)]! }
    this.ptNhanh(dung ? `${ai.ngan} giải trước bi ${id}: đúng, bi hoá vàng` : `${ai.ngan} giải trước bi ${id}: chưa đúng`)
  }
  protected aiDanh(): void {
    if (this.pha !== 'ai') return
    this.sau(() => {
      if (this.pha !== 'ai') return // trong 80 ms chờ, pha đã đổi (ván online: cú của máy khác tới) ⇒ thôi ngắm, kẻo đè pha đang vẽ
      const doi = this.ghe[this.cur]!.doi
      if (this.ballInHand) { aiDatBi(this.st, doi, this.bi, this.isBreak, this.rand); this.ballInHand = false; this.goiYNham(); const c = this.bi_('cue'); this.sk.am('dat', 0, c.x, c.y) }
      const plan = aiTinh(this.st, doi, this.bi, this.isBreak, this.aim, this.rand)
      const a0 = Math.atan2(this.aim.y, this.aim.x)
      let a1 = Math.atan2(plan.aim.y, plan.aim.x)
      if (a1 - a0 > Math.PI) a1 -= 2 * Math.PI
      if (a0 - a1 > Math.PI) a1 += 2 * Math.PI
      this.ai = { a0, a1, p: plan.p, t: 0 }
      this.pha = 'ai-nham'
      this.doi()
    }, 80)
  }

  // ───────────── đọc cho màn chơi ─────────────
  hopLe(id: KiHieu): boolean { return hopLeDich(id, this.ghe[this.cur]!.doi, this.bi, this.isBreak) }
  nham() { return nhamInfo(this.st, this.aim) }
  conLai(doi: Doi): number { return conLaiDoi(this.bi, doi) }
  biEm(): KiHieu[] { return biCuaGhe(this.bi, this.em) }
  doiCuaBi(id: KiHieu) { return doiCuaBi(id) }
  bangPhe(doi: Doi): readonly KiHieu[] { return NHOM[doi]! }
  /** Tóm tắt ghế cho màn Kết thúc và `bia-ket-van`. */
  tomTatGhe() { return this.ghe.map((g, i) => ({ ghe: i + 1, doi: g.doi, ai: g.ai, ten: g.ten, ...this.tk[i]! })) }
}
