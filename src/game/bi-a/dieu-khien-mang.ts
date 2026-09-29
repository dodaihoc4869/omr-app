// BI-A PHẢN ỨNG GĐ2 · BỘ ĐIỀU KHIỂN VÁN ONLINE. Kế thừa `VanBia` để màn chơi, tấm câu, nhãn bi, âm thanh dùng lại nguyên vẹn,
// nhưng KHÔNG tự áp luật: phòng đấu (Durable Object) là quyền quyết. Máy em chỉ:
//   · gửi cú đánh (của em, hoặc của ghế A.I nếu em là máy chủ bàn) rồi vẽ trước ngay bằng đúng bước chuẩn của phòng (`buocChuan`);
//   · vẽ cú của người khác từ gói `cu` phòng gửi; bi dừng ⇒ KHỚP trạng thái phòng (vị trí, bi, lượt, điểm) — lệch băm thì đếm `lech`;
//   · mở tấm câu khi phòng hỏi đúng ghế em, trả lời qua `answer` rồi báo `cau_xong` (phòng tự đối chiếu `game_v2_attempt`);
//   · máy chủ bàn chạy A.I: đánh, trả lời (G5), giải trước.
import { VanBia, type CauBia, type SuKienVan, type TuyChonVan } from './dieu-khien'
import { AI_DUNG, AI_DUNG_CHOT, GIAY_CU, hangMuc, type BangBi, type Doi } from './luat'
import { CHOT, KL, PK, TEN_PHE, mauCss, type KiHieu } from './nguyen-to'
import { bamVi, ballsTu, buocChuan, type ChoCau, type GoiCu, type SuKienTran, type TranCongKhai } from './tran'
import { H, HS, W, danhBiV, quay, suKienMoi, tocDo } from './vat-ly'

export interface KenhVan { gui(o: Record<string, unknown> & { t: string }): boolean }
/** Gói trạng thái phòng gửi (`t: 'tt'`). */
export interface GoiTT { su: SuKienTran | null; S: TranCongKhai; chuMay: number; toi?: number }
export type LoaiMang = 'ban' | 'giao_huu'
export interface TuyChonVanMang extends Omit<TuyChonVan, 'loai' | 'cauEm'> {
  loaiMang: LoaiMang
  em: number
  cauTheoBi: Partial<Record<KiHieu, CauBia>>
}
export const CAU_NHAN = ['Cú đẹp!', 'Suýt nữa!', 'Tới lượt tớ nhé', 'Hay đấy', 'Chờ tớ giải câu', 'Đấu lại không?'] as const
export type TrangThaiNoiVan = 'noi' | 'noi_lai' | 'mat' | 'dang_noi' | 'dong'

const sao = <T>(x: T): T => JSON.parse(JSON.stringify(x)) as T

export class VanMang extends VanBia {
  readonly mang = true
  readonly loaiMang: LoaiMang
  laChuMay = false
  /** Ghế đang mất kết nối (hiện "đang nối lại" cạnh tên). */
  roiGhe: boolean[] = []
  /** Câu nhắn vừa nhận (hiện bong bóng cạnh ghế 3 giây). */
  nhanDen: { ma: number; tu: number; id: number; t: number }[] = []
  trangThaiNoi: TrangThaiNoiVan = 'noi'
  /** Số cú vẽ trước lệch băm phòng (đo — mong 0). */
  lech = 0
  S: TranCongKhai
  ketMang: { lyDo: string; doiThang: Doi | null } | null = null
  private kenh: KenhVan
  private hangCho: GoiTT[] = []
  private ketQuaCu: GoiTT | null = null
  private dangVe = false
  private cuMinh = false
  private choKetQua = false
  private daMo = new Set<string>()
  private aiDaGui = new Set<string>()
  private daKet = false
  private maNhan = 0

  constructor(tc: TuyChonVanMang, sk: SuKienVan, kenh: KenhVan, dau: GoiTT) {
    super({ ...tc, loai: tc.loaiMang === 'giao_huu' ? 'giao_huu' : 'ai', cauEm: [] }, sk)
    this.kenh = kenh
    this.loaiMang = tc.loaiMang
    this.em = tc.em
    this.cauCua = { ...tc.cauTheoBi }
    this.chotCau = tc.chot
    this.S = dau.S
    this.nhatKy = []
    this.thongBao = null
    this.dongBo(dau, true)
  }

  // ───────────── nhận từ phòng ─────────────
  /** Gói `tt` của phòng. Đang vẽ một cú ⇒ gói đến sau xếp hàng, áp khi vẽ xong (thứ tự phòng giữ nguyên). */
  apTT(g: GoiTT): void {
    if (this.daKet && this.S.over) return
    if (g.su?.k === 'cu') {
      if (this.dangVe && this.cuMinh && !this.ketQuaCu && g.su.ghe === this.cur) { this.ketQuaCu = g; if (this.choKetQua) this.xongVe(); return }
      if (this.dangVe) { this.hangCho.push(g); return }
      this.ketQuaCu = g
      this.batDauVe(g.su.ghe, g.su.cu, false)
      return
    }
    // Vào lại bàn (gói đầy đủ, su = null) khi đang chờ kết quả cú CỦA EM: cú có thể đã mất cùng kết nối cũ ⇒ lấy luôn trạng thái phòng làm kết quả
    // (phòng đã nhận cú thì trạng thái có cú đó; chưa nhận thì bi về chỗ cũ, vẫn lượt em). Không có nhánh này máy em đứng "Đang chờ phòng đấu…" mãi.
    if (!g.su && this.dangVe && this.cuMinh && !this.ketQuaCu) { this.ketQuaCu = g; if (this.choKetQua) this.xongVe(); return }
    if (this.dangVe) { this.hangCho.push(g); return }
    this.dongBo(g)
  }
  /** Phòng từ chối gói của em (vd. cú đánh lệch lượt): dừng vẽ trước, về trạng thái phòng. */
  apLoi(ma: unknown, chu: string): void {
    if (ma === 'cu' && this.dangVe && this.cuMinh) {
      this.dangVe = false; this.cuMinh = false; this.ketQuaCu = null; this.choKetQua = false; this.ev = null
      this.dongBo({ su: null, S: this.S, chuMay: this.laChuMay ? this.em : -1 })
    }
    // gói tự động của máy chủ bàn (A.I trả lời / giải trước) bị từ chối lúc đổi máy chủ bàn = máy kia đã làm rồi ⇒ im, không báo em
    if (chu && ma !== 'cau_ai' && ma !== 'giai_truoc_ai') this.nhac(chu, '', 1800)
  }
  apNhan(tu: number, id: number): void {
    this.nhanDen.push({ ma: ++this.maNhan, tu, id, t: 0 })
    if (this.nhanDen.length > 6) this.nhanDen.shift()
    this.doi()
  }
  datTrangThaiNoi(tt: TrangThaiNoiVan): void { this.trangThaiNoi = tt; this.doi() }
  guiNhan(id: number): void { this.kenh.gui({ t: 'nhan', id }) }
  boVan(): void { this.kenh.gui({ t: 'bo_van' }) }

  private dongBo(g: GoiTT, dau = false): void {
    const S = g.S, curCu = this.cur
    this.S = S
    this.laChuMay = g.chuMay === this.em
    for (const [id, x, y, on] of S.balls) { const b = this.bi_(id as KiHieu | 'cue'); b.x = x; b.y = y; b.on = on === 1; b.vx = 0; b.vy = 0; b.wx = 0; b.wy = 0; b.wz = 0 }
    this.bi = sao(S.bi) as BangBi
    this.diem = [...S.diem] as [number, number]
    this.cur = S.cur
    this.isBreak = S.isBreak
    this.ballInHand = S.ballInHand
    this.matThan = S.matThan[this.em] ?? 0
    this.soCu = S.soCu
    this.ghe = S.ghe.map((x) => ({ ten: x.ten, ngan: x.ngan, tat: x.tat, ai: x.ai, doi: x.doi }))
    this.roiGhe = S.ghe.map((x) => x.roi)
    this.tk = S.tk.map((t, i) => ({ ...t, caiSai: this.tk[i]?.caiSai ?? [] }))
    this.mucAi = {}
    for (const id of [...KL, ...PK]) if (S.bi[id].chu !== this.em && S.muc[id]) this.mucAi[id] = S.muc[id]
    this.chotTrong = !S.chotCo[this.em]
    for (const id of Object.keys(this.cauCua) as KiHieu[]) if (S.bi[id]?.trong) delete this.cauCua[id]
    this.time = Math.max(0, S.conCuMs / 1000)
    if (!dau) this.xuLySuKien(g.su, curCu)
    else this.bao(S.soCu ? 'Đã vào lại bàn' : `${this.ghe[0]!.ten} phá bàn`, this.em === 0 && !S.soCu ? 'Em phá bàn · chạm bi nào trước cũng được' : `Em ở ${TEN_PHE[this.ghe[this.em]!.doi]}`, '', 1800)
    this.datPha(curCu)
    this.doi()
  }
  private ten(g: number): string { return g === this.em ? 'Em' : this.ghe[g]?.ngan ?? `Ghế ${g + 1}` }
  private xuLySuKien(su: SuKienTran | null, curCu: number): void {
    if (!su) return
    const S = this.S
    if (su.k === 'cu') {
      const kq = su.kq, ke = this.ghe[S.cur]!
      if (kq.maLoi) { this.sk.am('loi'); this.bao(`Phạm luật: ${kq.loi}`, (kq.datLai.length ? `${kq.datLai.length} bi rơi trong cú này quay lại bàn · ` : '') + `${ke.ten} được đặt bi cái`, 'loi', 2100); return }
      for (const id of kq.anNgay) this.hieuUngAn(id)
      if (kq.anNgay.length) this.bao(kq.anNgay.some((id) => this.bi[id].trong) ? 'Bi trống vào lỗ · ăn ngay' : 'Bi vàng vào lỗ · ăn ngay', '', 'tot', 1200)
      else if (!S.cho.length && !S.over) this.bao(kq.cuaBan.length ? `Bi ${kq.cuaBan.join(', ')} của phe đối thủ rơi, quay lại chân bàn` : 'Không ăn được bi nào', S.cur === su.ghe ? `${this.ten(su.ghe)} đánh tiếp` : `Sang lượt ${ke.ten}`, '', 1400)
    } else if (su.k === 'cau') {
      if (su.dung) {
        if (su.loai === 'bi') { this.hieuUngAn(su.ki); this.bao(`${this.ten(su.ghe)} trả lời đúng · ăn bi ${su.ki}`, S.cur === curCu && !S.cho.length ? `${this.ten(S.cur)} đánh tiếp` : '', 'tot', 1200) }
      } else this.bao(`${this.ten(su.ghe)} ${su.hetGio ? 'hết giờ' : 'trả lời chưa đúng'} · bi ${su.loai === 'chot' ? 'chốt' : su.ki} quay lại bàn`, `Sang lượt ${this.ghe[S.cur]!.ten}`, 'loi', 1400)
    } else if (su.k === 'giai_truoc') {
      if (su.ghe !== this.em) this.ptNhanh(su.dung ? `${this.ten(su.ghe)} giải trước bi ${su.ki}: đúng, bi hoá vàng` : `${this.ten(su.ghe)} giải trước bi ${su.ki}: chưa đúng`)
    } else if (su.k === 'het_gio') this.bao(`Hết ${GIAY_CU} giây`, `Sang lượt ${this.ghe[S.cur]!.ten}`, '', 1400)
    else if (su.k === 'ghe_ai') this.bao(`${this.ghe[su.ghe]!.ten} ${su.lyDo === 'bo' ? 'đã rời ván' : 'mất kết nối quá 60 giây'}`, 'A.I đánh thay ghế này · ván không tính Điểm bàn', '', 2200)
    if (S.cur === this.em && curCu !== this.em && !S.over && !S.cho.length) { this.sk.am('luot'); this.bao('Lượt của em', this.ballInHand ? 'Kéo bi cái tới chỗ muốn đặt rồi đánh' : this.matThan ? `Có ${this.matThan} Mắt thần` : 'Chạm bàn để nhắm', '', 1300) }
  }
  private hieuUngAn(id: KiHieu): void {
    const v = this.viTriLo[id] ?? { x: W / 2, y: H / 2 }, x = Math.max(30, Math.min(W - 30, v.x)), y = Math.max(40, Math.min(H - 20, v.y))
    this.noi.push({ x, y, chu: `+${this.diemBi(id)}`, t: 0 })
    for (let i = 0; i < 22; i++) { const a = this.rand() * 6.283, sp = 40 + this.rand() * 90; this.fx.push({ k: 'hat', x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, s: 2 + this.rand() * 2.5, c: 'rgb(255,214,107)', t: 0, life: 0.9 + this.rand() * 0.6, r: 0 }) }
    this.fx.push({ k: 'vong', x, y, vx: 0, vy: 0, s: 0, c: '', t: 0, life: 0.6, r: 0 })
    this.sk.am('an')
  }
  /** Đặt pha hiển thị theo trạng thái phòng; mở tấm câu cho em; máy chủ bàn cho A.I đánh/trả lời. */
  private datPha(curCu: number): void {
    const S = this.S
    if (S.over) { this.ketThucMang(); return }
    const c = S.cho[0]
    if (c) {
      this.pha = 'cau'
      if (c.ghe === this.em) this.moCauMang(c)
      else if (S.ghe[c.ghe]!.ai && this.laChuMay) this.aiTraLoiMang(c)
      else if (!this.sheet) this.bao(`${this.ghe[c.ghe]!.ten} đang giải ${c.loai === 'chot' ? 'Câu chốt' : `bi ${c.ki}`}`, c.loai === 'chot' ? '' : ['Nhận biết', 'Thông hiểu', 'Vận dụng'][hangMuc(S.muc[c.ki] ?? null)]!, '', 1400)
      return
    }
    if (S.cur === this.em) { if (this.pha !== 'aim' || curCu !== this.em) { this.pha = 'aim'; this.power = 0; this.goiYNham() } return }
    if (S.ghe[S.cur]!.ai && this.laChuMay) { if (this.pha !== 'ai' && this.pha !== 'ai-nham') { this.pha = 'ai'; this.goiYNham(); this.aiDanh() } return }
    this.pha = 'cho'
  }
  private moCauMang(c: Omit<ChoCau, 'han'>): void {
    const khoa = `${this.S.soCu}|${c.ghe}|${c.ki}|${c.loai}`
    if (this.daMo.has(khoa) || (this.sheet && this.sheet.mode !== 'giai-truoc')) return
    const cau = c.loai === 'chot' ? this.chotCau : this.cauCua[c.ki]
    if (!cau) return // không có câu ở máy (mất sau khi tải lại trang): phòng hết giờ câu sẽ tính sai
    if (this.sheet) return // đang giải trước dở: chốt xong câu đó mới mở câu này (xongCau gọi lại datPha)
    this.daMo.add(khoa)
    this.moCau(c.loai === 'chot' ? 'chot' : 'sau-lo', c.loai === 'chot' ? CHOT : c.ki, this.S.cur)
  }
  private aiTraLoiMang(c: Omit<ChoCau, 'han'>): void {
    const khoa = `${this.S.soCu}|${c.ghe}|${c.ki}|${c.loai}`
    if (this.aiDaGui.has(khoa)) return
    this.aiDaGui.add(khoa)
    const ten = this.ghe[c.ghe]!.ten
    this.bao(c.loai === 'chot' ? `${ten} đang giải Câu chốt` : `${ten} đang giải câu bi ${c.ki}`, c.loai === 'chot' ? '' : ['Nhận biết', 'Thông hiểu', 'Vận dụng'][hangMuc(this.S.muc[c.ki] ?? null)]!, '', 1300)
    const dung = this.rand() < (c.loai === 'chot' ? AI_DUNG_CHOT : AI_DUNG[hangMuc(this.S.muc[c.ki] ?? null)])
    this.sau(() => { this.kenh.gui({ t: 'cau_ai', ghe: c.ghe, ki: c.ki, loai: c.loai, dung }) }, 1400)
  }
  private ketThucMang(): void {
    this.pha = 'over'
    if (this.daKet) return
    this.daKet = true
    const o = this.S.over!
    this.ketMang = { lyDo: o.lyDo, doiThang: o.doiThang }
    if (o.doiThang !== null) {
      this.sk.am('thang')
      for (let i = 0; i < 140; i++) {
        const c = mauCss([...KL, ...PK][i % 14]!), a = this.rand(), b = this.rand()
        this.fx.push({ k: 'giay', x: b * W, y: -20 - a * 300, vx: (this.rand() - 0.5) * 60, vy: 120 + this.rand() * 160, s: 3 + this.rand() * 4, c, t: 0, life: 3 + this.rand() * 1.5, r: this.rand() * 6 })
      }
      const ha = o.nguoiHa !== null ? `${this.ghe[o.nguoiHa]!.ten} hạ Bi chốt` : o.lyDo === 'bo' ? 'Bạn đã rời ván' : 'Bạn mất kết nối quá 60 giây'
      this.bao(ha, this.cheDo === 'doi' ? `${TEN_PHE[o.doiThang]} thắng ván` : `${this.ghe.find((g) => g.doi === o.doiThang)!.ten} thắng ván`, 'tot', 1600)
    } else this.bao('Ván quá 2 giờ', 'Không ai thắng', '', 1600)
    this.sau(() => this.sk.ketThuc({ doiThang: (o.doiThang ?? 0) as Doi, nguoiHa: o.nguoiHa ?? -1, diem: [...this.S.diem] as [number, number], giay: this.giayChoi() }), 1500)
  }

  // ───────────── thao tác của em / máy chủ bàn ─────────────
  override ban(): boolean {
    if (this.pha !== 'aim' || this.dangVe || this.S.over || this.S.cho.length) return false
    const laMinh = this.cur === this.em
    if (!laMinh && !(this.ghe[this.cur]!.ai && this.laChuMay)) return false
    if (laMinh && this.sheet) return false
    const p = this.power
    if (p < 0.02) return false
    const c = this.bi_('cue')
    const cu: GoiCu = { dx: this.aim.x, dy: this.aim.y, v: tocDo(p), sx: this.spin.x, sy: this.spin.y, ...(this.S.ballInHand ? { datBi: { x: c.x, y: c.y } } : {}) }
    if (!this.kenh.gui({ t: 'cu', ...cu })) { this.nhac('Mất kết nối', 'Đang nối lại · cú chưa gửi', 1600); this.power = 0; return false }
    this.batDauVe(this.cur, cu, true)
    return true
  }
  private batDauVe(ghe: number, cu: GoiCu, minh: boolean): void {
    const c = this.bi_('cue')
    if (cu.datBi) { c.x = cu.datBi.x; c.y = cu.datBi.y; c.on = true }
    const d = Math.hypot(cu.dx, cu.dy) || 1
    danhBiV(c, cu.dx / d, cu.dy / d, cu.v, cu.sx, cu.sy)
    this.aim = { x: cu.dx / d, y: cu.dy / d }
    this.ev = suKienMoi(); this.cur = ghe; this.pha = 'moving'; this.acc = 0; this.ballInHand = false
    this.ai = null // A.I đang ngắm dở (máy này vừa thôi làm máy chủ bàn) ⇒ bỏ, kẻo hết 1,25 giây ngắm lại đè pha 'moving'
    this.dungMT = minh && ghe === this.em && this.matThan > 0 && this.loaiMang === 'ban'
    this.dangVe = true; this.cuMinh = minh; this.choKetQua = false
    this.soCu++
    if (!this.isBreak) this.sk.am('co', cu.v, c.x, c.y)
    this.power = 0
    this.doi()
  }
  protected override buocVatLy(dt: number): void {
    if (this.pha !== 'moving' || !this.ev) return
    this.acc += dt * this.nhan
    const hook = this.hookVa()
    let n = 0, xong = false
    while (this.acc >= HS && n < 24 * this.nhan && !xong) { this.ghiTruoc(); xong = buocChuan(this.st, this.ev, hook); for (const b of this.st.balls) if (b.on) quay(b, HS); this.acc -= HS; n++ }
    if (n) this.noiSuy = true
    if (xong) { this.acc = 0; this.noiSuy = false; this.pha = 'xet'; this.sau(() => this.xongVe(), this.roi.length ? 260 : 120); this.doi() }
  }
  private xongVe(): void {
    const g = this.ketQuaCu
    if (!g) { this.choKetQua = true; this.nhac('Đang chờ phòng đấu…', '', 1200); return }
    this.ketQuaCu = null; this.choKetQua = false; this.dangVe = false; this.cuMinh = false
    if (g.su?.k === 'cu' && g.su.bamVa !== bamVi(ballsTu(this.st))) this.lech++
    this.dongBo(g)
    while (this.hangCho.length && !this.dangVe) this.apTT(this.hangCho.shift()!)
  }
  /** Đồng hồ chỉ để HIỆN (phòng giữ giờ thật, hết giờ phòng tự sang lượt). */
  protected override buocDongHo(dt: number): void {
    if (this.pha === 'over' || this.pha === 'moving' || this.pha === 'xet' || this.pha === 'cau') return
    this.time = Math.max(0, this.time - dt)
    if (this.cur === this.em && this.pha === 'aim' && this.time <= 5 && this.time > 0) { const s = Math.ceil(this.time); if (s !== this.tich) { this.tich = s; this.sk.am('tich') } }
  }
  protected override buocHieuUng(dt: number): void {
    super.buocHieuUng(dt)
    // pha 'cho' (người khác đang nhắm) — lớp gốc bỏ qua, nhưng máy chủ bàn vẫn phải cho A.I giải trước (G5)
    if (this.pha === 'cho' && this.laChuMay) { this.aiGiaiT += dt; if (this.aiGiaiT >= 12) { this.aiGiaiT = 0; this.aiGiaiTruoc() } }
    for (const n of this.nhanDen) n.t += dt
    const truoc = this.nhanDen.length
    this.nhanDen = this.nhanDen.filter((n) => n.t < 3)
    if (this.nhanDen.length !== truoc) this.doi()
  }
  /** Máy chủ bàn: A.I giải trước bi của mình mỗi 12 giây khi người khác đang nhắm (G5). */
  protected override aiGiaiTruoc(): void {
    const S = this.S
    if (!this.laChuMay || S.cho.length || S.over || this.dangVe || this.loaiMang !== 'ban') return
    const ds = S.ghe.map((g, i) => ({ g, i })).filter((x) => x.g.ai && x.i !== S.cur)
    if (!ds.length) return
    const s = ds[Math.floor(this.rand() * ds.length)]!.i
    const bi = [...KL, ...PK].filter((id) => S.bi[id].chu === s && !S.bi[id].an && !S.bi[id].vang && !S.bi[id].trong && this.bi_(id).on)
    if (!bi.length) return
    const id = bi[Math.floor(this.rand() * bi.length)]!
    this.kenh.gui({ t: 'giai_truoc_ai', ghe: s, ki: id, dung: this.rand() < AI_DUNG[hangMuc(S.muc[id] ?? null)] })
  }
  override coTheGiaiTruoc(): boolean { return super.coTheGiaiTruoc() && !this.S.cho.length && !this.dangVe && this.loaiMang === 'ban' }
  override nguoiDuocDanh(): boolean { return this.pha === 'aim' && this.cur === this.em && !this.sheet && !this.xemMo && !this.dangVe }
  /** Tấm câu báo kết quả: câu đã gửi `answer` ⇒ báo phòng `cau_xong` (phòng đối chiếu đúng/sai thật); đóng tấm ⇒ đặt lại pha. */
  override xongCau(ma: number, dung: boolean, dong: boolean, tinh = true): void {
    const y = this.sheet
    if (!y || y.ma !== ma) return
    if (!this.dachamSet.has(ma)) {
      this.dachamSet.add(ma)
      if (dung) this.sk.am(y.mode === 'giai-truoc' ? 'vang' : 'dung')
      else { this.sk.am('sai'); if (tinh) this.tk[this.em]!.caiSai.push(y.cau.tenDang || '') }
      if (tinh) this.kenh.gui({ t: 'cau_xong', ki: y.id, qid: y.cau.qid, loai: y.mode === 'chot' ? 'chot' : y.mode === 'giai-truoc' ? 'giai_truoc' : 'bi' })
    }
    if (dong) { this.sheet = null; this.datPha(this.cur) }
    this.doi()
  }
  /** Câu thay sau câu sai: cập nhật ở máy + đưa vé câu cho phòng. */
  doiCauMang(id: KiHieu, cau: CauBia | null, ve: string | null): void {
    this.doiCau(id, cau)
    if (ve) this.kenh.gui({ t: 'doi_cau', ve })
  }
}
