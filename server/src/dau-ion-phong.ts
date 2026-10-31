// PHÒNG ĐẤU «Đấu Nguyên Tử 2» — luật của MỘT phòng chờ thi (một ca), KHÔNG phụ thuộc cách truyền: Durable Object `PhongDauIon` (phong-dau-ion.ts)
// chỉ nối WebSocket vào đây; test gọi thẳng với kết nối giả. Phòng QUYẾT mọi thứ (vị trí, TỰ NGẮM, bắn, trúng, hạ, vật phẩm, cấp súng) bằng lõi chung
// src/lib/dau-ion/loi.ts; máy em chỉ gửi HƯỚNG ĐI. 0 lệnh D1: người vào được nhận diện bằng vé ký (dau-ion-ve.ts) do lệnh vào thi phát.
// GHÉP SÂN TỰ ĐỘNG (thầy duyệt 31/10): «Vào sân đấu» ⇒ vào sân đông người nhất còn chỗ (≤ 6); đủ 6 ⇒ mở sân mới. Ván 60 giây xoay vòng (nghỉ 6 giây
// xem bảng). CHỈ NGƯỜI THẬT (thầy 01/11: «Game đừng tự thêm máy ảo, hs thách bao nhiêu thì chơi bấy nhiêu, tối đa 6 người chơi cùng lúc»):
// sân có 1 em ⇒ CHỜ BẠN (đồng hồ đứng ở 60 giây, em đi thử sân); bạn thứ 2 vào ⇒ ván mới chạy ngay cho cả sân; còn 1 em ⇒ về chờ, và có sân khác
// còn chỗ thì em được chuyển sang đó luôn (không ai ngồi chờ một mình khi sân bên cạnh đang đấu). Sân hết người ⇒ đóng.
// Ai thấy ai: chỉ các em cùng sân; mỗi em là số thứ tự ngắn + tên gọi (hai chữ cuối) hoặc «Bạn <nguyên tố>» khi bật Ẩn tên. Số báo danh KHÔNG gửi đi.
import { BUOC, GIAY_NGHI, GIAY_VAN, NGUYEN_TO, TOI_DA, TOI_THIEU, boGhe, buocTran, laySuKien, taoTran, themGhe, vanMoi, xepBang, type Tran } from '../../src/lib/dau-ion/loi'
import { PHIEN_BAN, datAck, docYDinh, maAnh } from '../../src/lib/dau-ion/goi'

export interface KetNoi {
  gui(d: string | Uint8Array): void
  dong(ma: number, lyDo: string): void
  /** Ghi dữ liệu nhỏ lên kết nối (sống qua lúc phòng ngủ). */
  ghiKem(v: unknown): void
}
/** Nội dung vé đã kiểm: mã ca, số báo danh, tên gọi, hạn (ms). */
export interface VeDau { c: string; s: string; t: string; h: number }
/** Dữ liệu gắn trên kết nối; `v` = phiên bản giao thức (kết nối của bản cũ không có ⇒ phòng đóng sạch). */
export interface KemNguoi { v: number; id: number; s: string; t: string; nt: number; an: boolean }

export const TRAN_KET_NOI = 80
/** 80 kết nối ÷ 6 ⇒ tối đa 14 sân mỗi ca. */
export const TRAN_SAN = 14
export const GIAY_CHO_NOI_LAI = 8
/** Không gửi ý định quá 3 giây ⇒ ghế «vắng»: không tự bắn, không bị ngắm. */
export const GIAY_VANG = 3
export const MA_DONG = { veSai: 4003, thayMay: 4002, quaNhieu: 4008, day: 4009, batDau: 4000, tat: 4010 } as const
/** Bốn câu phản ứng có sẵn (chỉ ở bảng hết ván) — không có ô chat. */
export const PHAN_UNG = ['Hay đấy!', 'Suýt nữa!', 'Đấu lại nhé', 'Chơi đẹp'] as const
export const CHU_BAN_CU = 'Đấu Nguyên Tử đã có bản mới. Em tải lại trang để vào sân nhé.'
export { PHIEN_BAN }

interface Nguoi {
  id: number; sbd: string; ten: string; nt: number; an: boolean
  kn: KetNoi | null; san: number
  /** Đếm gói trong giây hiện tại (chống dội gói). */
  giay: number; nGoi: number
  puLuc: number; seq: number; ydLuc: number; vangLuc: number
}
interface San { so: number; tr: Tran; ds: number[]; tick: number; nghi: number; muonMoi: Set<number>; bang: unknown[] }

const json = (o: unknown) => JSON.stringify(o)
/** Số thứ tự ngắn của em (1…255, một byte trong ảnh trận). */
const ID_TRAN = 256

export class PhongDau {
  private nguoi = new Map<number, Nguoi>()
  private theoKn = new Map<KetNoi, Nguoi>()
  private san = new Map<number, San>()
  constructor(private bayGio: () => number = Date.now, private rng: () => number = Math.random) {}

  get soNguoi(): number { return this.nguoi.size }
  get soSan(): number { return this.san.size }
  /** Còn sân đang chạy, hoặc ghế đang giữ cho em rớt mạng ⇒ phòng giữ vòng 20 lần/giây; hết ⇒ được ngủ. */
  canThuc(): boolean {
    if (this.san.size) return true
    for (const n of this.nguoi.values()) if (n.vangLuc) return true
    return false
  }
  /** Ảnh chụp để test / đo: ghế từng sân. */
  sanCua(id: number): Tran | null { const n = this.nguoi.get(id); return (n && this.san.get(n.san)?.tr) || null }
  dsSan(): { so: number; that: number; ghe: number }[] { return [...this.san.values()].map((s) => ({ so: s.so, that: s.ds.length, ghe: s.tr.ghe.length })) }

  private tenHien(n: Nguoi): string { return n.an || !n.ten ? `Bạn ${NGUYEN_TO[n.nt] ?? 'Na'}` : n.ten }
  private gui(n: Nguoi | undefined, o: unknown): void { if (n?.kn) n.kn.gui(json(o)) }
  private kem(n: Nguoi): KemNguoi { return { v: PHIEN_BAN, id: n.id, s: n.sbd, t: n.ten, nt: n.nt, an: n.an } }
  private idTrong(): number { for (let i = 1; i < ID_TRAN; i++) if (!this.nguoi.has(i)) return i; return 0 }

  /** Sân sẽ vào: sân đang chơi đông người thật nhất mà còn chỗ. */
  private sanSeVao(): San | null {
    let tot: San | null = null
    for (const s of this.san.values()) if (s.ds.length < TOI_DA && (!tot || s.ds.length > tot.ds.length)) tot = s
    return tot
  }
  private chuSanh(): unknown { const s = this.sanSeVao(); return { t: 'sanh', so: s?.so ?? this.soMoi(), that: s?.ds.length ?? 0 } }
  private baoSanh(): void { const o = json(this.chuSanh()); for (const n of this.nguoi.values()) if (n.kn && !n.san) n.kn.gui(o) }
  private soMoi(): number { for (let i = 1; ; i++) if (!this.san.has(i)) return i }

  /** Em vào bằng vé đã kiểm (sảnh, CHƯA vào sân). Cùng số báo danh mở ở máy/tab khác ⇒ kết nối cũ bị thay. */
  vao(kn: KetNoi, ve: VeDau, nt: number, an: boolean): Nguoi | null {
    let n = [...this.nguoi.values()].find((k) => k.sbd === ve.s)
    if (n) {
      if (n.kn && n.kn !== kn) { this.theoKn.delete(n.kn); n.kn.dong(MA_DONG.thayMay, 'Em vừa mở Đấu Nguyên Tử ở máy hoặc tab khác.') }
      n.kn = kn; n.vangLuc = 0; n.ydLuc = this.bayGio()
    } else {
      const id = this.nguoi.size < TRAN_KET_NOI ? this.idTrong() : 0
      if (!id) { kn.dong(MA_DONG.day, 'Sảnh đấu đã đủ người.'); return null }
      n = { id, sbd: ve.s, ten: String(ve.t || '').slice(0, 16), nt: 0, an: false, kn, san: 0, giay: 0, nGoi: 0, puLuc: 0, seq: 0, ydLuc: 0, vangLuc: 0 }
      this.nguoi.set(id, n)
    }
    if (!n.san) { n.nt = Math.max(0, Math.min(NGUYEN_TO.length - 1, nt | 0)); n.an = !!an }
    this.theoKn.set(kn, n)
    kn.ghiKem(this.kem(n))
    kn.gui(json({ t: 'chao', v: PHIEN_BAN, toi: n.id, ten: this.tenHien(n) }))
    const s = this.san.get(n.san)
    // Nối lại giữa ván: về đúng sân, đúng cấp.
    if (s) { kn.gui(json(this.goiSan(s, n))); if (s.nghi > 0) kn.gui(json({ t: 'ket', bang: s.bang, nghi: s.nghi })) }
    else kn.gui(json(this.chuSanh()))
    return n
  }

  /** Dựng lại người từ dữ liệu gắn trên kết nối (phòng vừa thức dậy). Kết nối của bản cũ ⇒ đóng sạch. */
  khoiPhuc(kn: KetNoi, k: KemNguoi): void {
    if (!k || k.v !== PHIEN_BAN) { kn.dong(MA_DONG.tat, CHU_BAN_CU); return }
    if (!k.id || this.nguoi.has(k.id)) return
    const n: Nguoi = { id: k.id, sbd: k.s, ten: k.t, nt: k.nt, an: k.an, kn, san: 0, giay: 0, nGoi: 0, puLuc: 0, seq: 0, ydLuc: 0, vangLuc: 0 }
    this.nguoi.set(n.id, n); this.theoKn.set(kn, n)
  }

  roi(kn: KetNoi): void {
    const n = this.theoKn.get(kn)
    this.theoKn.delete(kn)
    if (!n || n.kn !== kn) return
    n.kn = null
    // Đang trong sân: giữ ghế 8 giây cho em nối lại (đổi mạng, khoá màn); ghế thành «vắng».
    if (this.san.has(n.san)) { n.vangLuc = this.bayGio(); return }
    this.nguoi.delete(n.id)
  }

  /** Gói từ máy em. Chuỗi = lệnh sảnh (JSON), nhị phân = hướng đi trong sân. */
  nhan(kn: KetNoi, goi: string | ArrayBuffer | Uint8Array): void {
    const n = this.theoKn.get(kn)
    if (!n) return
    const nay = this.bayGio(), giay = Math.floor(nay / 1000)
    if (giay !== n.giay) { n.giay = giay; n.nGoi = 0 }
    if (++n.nGoi > 80) { kn.dong(MA_DONG.quaNhieu, 'Gửi quá nhiều gói.'); return }
    if (n.nGoi > 40) return
    if (typeof goi !== 'string') {
      const y = docYDinh(goi instanceof Uint8Array ? goi : new Uint8Array(goi))
      const s = y && this.san.get(n.san)
      const g = s && s.tr.ghe.find((x) => x.id === n.id)
      if (!y || !g) return
      const l = Math.hypot(y.dx, y.dy)
      g.yd = { dx: l > 1 ? y.dx / l : y.dx, dy: l > 1 ? y.dy / l : y.dy }
      g.vang = false; n.seq = y.seq; n.ydLuc = nay
      return
    }
    if (goi.length > 512) return
    let j: Record<string, unknown>
    try { j = JSON.parse(goi) } catch { return }
    if (!j || typeof j !== 'object') return
    const s = this.san.get(n.san)
    switch (j.t) {
      case 'doi': {
        if (typeof j.nt === 'number') n.nt = Math.max(0, Math.min(NGUYEN_TO.length - 1, j.nt | 0))
        if (typeof j.an === 'boolean') n.an = j.an
        kn.ghiKem(this.kem(n)); return
      }
      case 'vao-san': return this.vaoSan(n)
      case 'roi-san': if (s) this.roiSan(s, n); return
      case 'van-moi': {
        if (!s || !(s.nghi > 0)) return
        s.muonMoi.add(n.id)
        if (s.ds.every((id) => s.muonMoi.has(id))) this.batVan(s)
        return
      }
      case 'pu': {
        const i = Number(j.i)
        if (!s || !(i >= 0 && i < PHAN_UNG.length) || nay - n.puLuc < 2000) return
        n.puLuc = nay
        for (const id of s.ds) this.gui(this.nguoi.get(id), { t: 'pu', tu: n.id, i })
        return
      }
    }
  }

  private dongGhe(s: San): unknown[] {
    return s.tr.ghe.map((g) => { const k = this.nguoi.get(g.id); return [g.id, k ? this.tenHien(k) : `Bạn ${NGUYEN_TO[g.nt] ?? 'Na'}`, g.nt, 0] })
  }
  private goiSan(s: San, n: Nguoi): unknown {
    return { t: 'san', v: PHIEN_BAN, so: s.so, toi: n.id, con: Math.ceil(s.tr.con), ghe: this.dongGhe(s), vp: s.tr.vp.map((v) => [v.id, v.k, Math.round(v.x), Math.round(v.y)]) }
  }
  private baoGhe(s: San, tru?: Nguoi): void { const o = json({ t: 'ghe', ghe: this.dongGhe(s) }); for (const id of s.ds) { const k = this.nguoi.get(id); if (k !== tru && k?.kn) k.kn.gui(o) } }

  /** Nguyên tố còn trống trong sân (mỗi sân 6 màu khác nhau; chỉ đổi trong ván đó). */
  private ntTrong(s: San, muon: number): number {
    const dung = new Set(s.tr.ghe.map((g) => g.nt))
    for (let i = 0; i < NGUYEN_TO.length; i++) { const nt = (muon + i) % NGUYEN_TO.length; if (!dung.has(nt)) return nt }
    return muon
  }
  /** Sân đang chờ bạn (dưới TOI_THIEU người thật): đồng hồ đứng, không ai tự bắn được ai. */
  private choBan(s: San): boolean { return s.ds.length < TOI_THIEU }

  private vaoSan(n: Nguoi): void {
    const cu = this.san.get(n.san)
    if (cu) { this.gui(n, this.goiSan(cu, n)); return }
    let s = this.sanSeVao()
    if (!s) {
      if (this.san.size >= TRAN_SAN) { this.gui(n, { t: 'tin', chu: 'Sân đấu đang kín, em chờ một chút nhé.' }); return }
      s = { so: this.soMoi(), tr: taoTran([], Math.floor(this.rng() * 2 ** 31)), ds: [], tick: 0, nghi: 0, muonMoi: new Set(), bang: [] }
      s.tr.su = []
      this.san.set(s.so, s)
    }
    this.ngoiVao(s, n)
    this.baoSanh()
  }

  /** Em ngồi vào sân `s`. Sân đang chờ mà đủ người ⇒ ván mới chạy ngay cho cả sân (mọi người về Cấp 1, đồng hồ 60 giây). */
  private ngoiVao(s: San, n: Nguoi): void {
    const dangCho = this.choBan(s)
    s.ds.push(n.id); n.san = s.so; n.seq = 0; n.ydLuc = this.bayGio()
    themGhe(s.tr, { id: n.id, nt: this.ntTrong(s, n.nt) })
    this.gui(n, this.goiSan(s, n))
    if (s.nghi > 0) this.gui(n, { t: 'ket', bang: s.bang, nghi: s.nghi })
    this.baoGhe(s, n)
    if (dangCho && !this.choBan(s) && !(s.nghi > 0)) this.batVan(s)
  }

  /** Em ra khỏi sân `s` (không báo gì cho em). Sân hết người ⇒ đóng, không tốn nhịp. */
  private boKhoiSan(s: San, n: Nguoi): void {
    s.ds = s.ds.filter((id) => id !== n.id); s.muonMoi.delete(n.id)
    boGhe(s.tr, n.id)
    n.san = 0
    if (!s.ds.length) this.san.delete(s.so)
    else this.baoGhe(s)
  }

  private roiSan(s: San, n: Nguoi): void {
    this.boKhoiSan(s, n)
    n.vangLuc = 0
    if (n.kn) this.gui(n, this.chuSanh()); else this.nguoi.delete(n.id)
    this.baoSanh()
  }

  /** Em đang ngồi chờ MỘT MÌNH mà sân khác còn chỗ và đang có bạn ⇒ chuyển em sang đó (sân đông nhất trước). */
  private gomSanLe(): void {
    for (const s of [...this.san.values()]) {
      if (s.ds.length !== 1) continue
      const n = this.nguoi.get(s.ds[0])
      if (!n?.kn) continue
      let toi: San | null = null
      for (const o of this.san.values()) if (o !== s && o.ds.length >= 1 && o.ds.length < TOI_DA && (!toi || o.ds.length > toi.ds.length)) toi = o
      if (!toi) continue
      this.boKhoiSan(s, n)
      this.ngoiVao(toi, n)
      this.baoSanh()
    }
  }

  private batVan(s: San): void {
    s.nghi = 0; s.muonMoi.clear(); s.tick = 0
    vanMoi(s.tr); s.tr.su = []
    const vp = s.tr.vp.map((v) => [v.id, v.k, Math.round(v.x), Math.round(v.y)])
    for (const id of s.ds) this.gui(this.nguoi.get(id), { t: 'van', con: Math.ceil(s.tr.con), vp })
  }

  /** Một nhịp phòng (BUOC giây): bước mọi sân, gửi ảnh trận, xử ghế vắng / rớt quá lâu, xoay ván, gom em ngồi chờ một mình. */
  buoc(dt = BUOC): void {
    const nay = this.bayGio()
    this.gomSanLe()
    for (const s of [...this.san.values()]) {
      for (const id of [...s.ds]) {
        const k = this.nguoi.get(id)
        if (!k) continue
        const g = s.tr.ghe.find((x) => x.id === id)
        if (g && nay - k.ydLuc > GIAY_VANG * 1000) { g.vang = true; g.yd = { dx: 0, dy: 0 } }
        // Rớt mạng quá 8 giây, hoặc mở mà vắng quá 8 giây ⇒ rời sân (còn 1 em ⇒ sân về chờ bạn).
        if ((!k.kn && k.vangLuc && nay - k.vangLuc > GIAY_CHO_NOI_LAI * 1000) || nay - k.ydLuc > GIAY_CHO_NOI_LAI * 1000) this.roiSan(s, k)
      }
      if (!this.san.has(s.so)) continue
      if (s.nghi > 0) { s.nghi -= dt; if (s.nghi <= 0) this.batVan(s); continue }
      buocTran(s.tr, dt)
      // Chờ bạn: em vẫn đi thử sân, nhưng đồng hồ đứng ở 60 giây (ván chỉ chạy khi có bạn thứ 2).
      if (this.choBan(s)) s.tr.con = GIAY_VAN
      s.tick = (s.tick + 1) & 0xff
      const than = maAnh(s.tick, s.tr.con, s.tr.ghe, laySuKien(s.tr))
      for (const id of s.ds) { const k = this.nguoi.get(id); if (k?.kn) k.kn.gui(datAck(than.slice(), k.seq)) }
      if (s.tr.xong) {
        s.nghi = GIAY_NGHI; s.muonMoi.clear()
        s.bang = xepBang(s.tr).map((d) => [d.id, d.ha, d.biHa, d.capMax, d.chuoiMax])
        for (const id of s.ds) this.gui(this.nguoi.get(id), { t: 'ket', bang: s.bang, nghi: GIAY_NGHI })
      }
    }
  }

  /** Thầy bấm Bắt đầu thi (hoặc công tắc tắt): báo mọi máy rồi đóng hết. */
  dongTatCa(ly: 'bat-dau' | 'tat'): void {
    const s = json({ t: 'dong', ly })
    for (const n of this.nguoi.values()) if (n.kn) { n.kn.gui(s); n.kn.dong(ly === 'tat' ? MA_DONG.tat : MA_DONG.batDau, ly) }
    this.nguoi.clear(); this.theoKn.clear(); this.san.clear()
  }
}
