// PHÒNG ĐẤU «Đấu Nguyên Tử» — luật của MỘT phòng chờ thi (một ca), KHÔNG phụ thuộc cách truyền: Durable Object `PhongDauIon` (phong-dau-ion.ts)
// chỉ nối WebSocket vào đây; test gọi thẳng với kết nối giả. Phòng QUYẾT mọi thứ của trận (vị trí, trúng, hạ) bằng lõi chung
// src/lib/dau-ion/loi.ts; máy em chỉ gửi ý định. 0 lệnh D1: người vào được nhận diện bằng vé ký (dau-ion-ve.ts) do lệnh vào thi phát.
// Ai thấy ai: chỉ các em đang mở Sảnh đấu của CÙNG ca; mỗi em là một số thứ tự ngắn + tên gọi (hai chữ cuối, như chip trên màn Chiếu mã của thầy)
// hoặc «Bạn <nguyên tố>» khi em bật Ẩn tên. Số báo danh KHÔNG bao giờ gửi cho máy em khác.
import { BUOC, LUAT, NGUYEN_TO, bangKet, buocTran, laySuKien, taoTran, type KieuTran, type Tran } from '../../src/lib/dau-ion/loi'
import { datAck, docYDinh, maAnh } from '../../src/lib/dau-ion/goi'

export interface KetNoi {
  gui(d: string | Uint8Array): void
  dong(ma: number, lyDo: string): void
  /** Ghi dữ liệu nhỏ lên kết nối (sống qua lúc phòng ngủ). */
  ghiKem(v: unknown): void
}
/** Nội dung vé đã kiểm: mã ca, số báo danh, tên gọi, hạn (ms). */
export interface VeDau { c: string; s: string; t: string; h: number }
export interface KemNguoi { id: number; s: string; t: string; nt: number; an: boolean; km: boolean }

export const TRAN_KET_NOI = 80
export const TRAN_SO_TRAN = 30
export const GIAY_MOI = 20
export const GIAY_CHO_NOI_LAI = 8
export const MA_DONG = { veSai: 4003, thayMay: 4002, quaNhieu: 4008, day: 4009, batDau: 4000, tat: 4010 } as const
/** Bốn câu phản ứng có sẵn — không có ô chat. */
export const PHAN_UNG = ['Hay đấy!', 'Suýt nữa!', 'Đấu lại nhé', 'Chơi đẹp'] as const
export const CHU_DA_MOI = 'Đã gửi lời thách. Bạn nhận lời thì trận bắt đầu.'

type TrangThai = 'ranh' | 'tim' | 'dau'
interface Nguoi {
  id: number; sbd: string; ten: string; nt: number; an: boolean; km: boolean
  kn: KetNoi | null; tt: TrangThai; tran: number; nhom: number
  /** Đếm gói trong giây hiện tại (chống dội gói). */
  giay: number; nGoi: number
  thach: number[]; puLuc: number; seq: number; vangLuc: number; vaoLuc: number
}
interface TranDau { id: number; tr: Tran; ds: number[]; tick: number }
interface Nhom { ma: number; chu: number; ds: number[] }

const json = (o: unknown) => JSON.stringify(o)

export class PhongDau {
  private nguoi = new Map<number, Nguoi>()
  private theoKn = new Map<KetNoi, Nguoi>()
  private tran = new Map<number, TranDau>()
  private nhom = new Map<number, Nhom>()
  /** Lời thách đang chờ: "tu>den" → hạn (ms). */
  private moi = new Map<string, number>()
  private idTran = 1
  constructor(private bayGio: () => number = Date.now, private rng: () => number = Math.random) {}

  get soNguoi(): number { return this.nguoi.size }
  get soTran(): number { return this.tran.size }
  /** Còn việc phải chạy theo nhịp (trận, hàng đấu nhanh, lời thách, nhóm) ⇒ phòng giữ vòng 20 lần/giây; hết ⇒ được ngủ. */
  canThuc(): boolean {
    if (this.tran.size || this.nhom.size || this.moi.size) return true
    for (const n of this.nguoi.values()) if (n.tt === 'tim' || n.vangLuc) return true
    return false
  }

  private tenHien(n: Nguoi): string { return n.an || !n.ten ? `Bạn ${NGUYEN_TO[n.nt] ?? 'Na'}` : n.ten }
  private dong1(n: Nguoi): [number, string, number, TrangThai] { return [n.id, this.tenHien(n), n.nt, n.tt] }
  private moiNguoi(o: unknown, tru?: Nguoi): void { const s = json(o); for (const n of this.nguoi.values()) if (n !== tru && n.kn) n.kn.gui(s) }
  private bao(n: Nguoi): void { this.moiNguoi({ t: 's', d: this.dong1(n) }) }
  private gui(n: Nguoi | undefined, o: unknown): void { if (n?.kn) n.kn.gui(json(o)) }
  private kem(n: Nguoi): KemNguoi { return { id: n.id, s: n.sbd, t: n.ten, nt: n.nt, an: n.an, km: n.km } }

  private idTrong(): number { for (let i = 1; i < 250; i++) if (!this.nguoi.has(i)) return i; return 0 }

  /** Em vào Sảnh đấu bằng vé đã kiểm. Cùng số báo danh mở ở máy/tab khác ⇒ kết nối cũ bị thay. */
  vao(kn: KetNoi, ve: VeDau, nt: number, an: boolean, km: boolean): Nguoi | null {
    const nay = this.bayGio()
    let n = [...this.nguoi.values()].find((k) => k.sbd === ve.s)
    if (n) {
      if (n.kn && n.kn !== kn) { this.theoKn.delete(n.kn); n.kn.dong(MA_DONG.thayMay, 'Em vừa mở Đấu Nguyên Tử ở máy hoặc tab khác.') }
      n.kn = kn; n.vangLuc = 0
    } else {
      if (this.nguoi.size >= TRAN_KET_NOI) { kn.dong(MA_DONG.day, 'Sảnh đấu đã đủ người.'); return null }
      const id = this.idTrong()
      if (!id) { kn.dong(MA_DONG.day, 'Sảnh đấu đã đủ người.'); return null }
      n = { id, sbd: ve.s, ten: String(ve.t || '').slice(0, 16), nt: 0, an: false, km: false, kn, tt: 'ranh', tran: 0, nhom: 0, giay: 0, nGoi: 0, thach: [], puLuc: 0, seq: 0, vangLuc: 0, vaoLuc: nay }
      this.nguoi.set(id, n)
    }
    n.nt = Math.max(0, Math.min(NGUYEN_TO.length - 1, nt | 0)); n.an = !!an; n.km = !!km
    this.theoKn.set(kn, n)
    kn.ghiKem(this.kem(n))
    const ds = [...this.nguoi.values()].filter((k) => k.kn || k.vangLuc).map((k) => this.dong1(k))
    kn.gui(json({ t: 'chao', toi: n.id, ten: this.tenHien(n), ds }))
    this.bao(n)
    // Nối lại giữa trận: gửi lại khung trận để máy em vẽ tiếp.
    const td = this.tran.get(n.tran)
    if (td) kn.gui(json(this.goiTran(td, n)))
    return n
  }

  /** Dựng lại người từ dữ liệu gắn trên kết nối (phòng vừa thức dậy sau khi ngủ). */
  khoiPhuc(kn: KetNoi, k: KemNguoi): void {
    if (!k || !k.id || this.nguoi.has(k.id)) return
    const n: Nguoi = { id: k.id, sbd: k.s, ten: k.t, nt: k.nt, an: k.an, km: k.km, kn, tt: 'ranh', tran: 0, nhom: 0, giay: 0, nGoi: 0, thach: [], puLuc: 0, seq: 0, vangLuc: 0, vaoLuc: this.bayGio() }
    this.nguoi.set(n.id, n); this.theoKn.set(kn, n)
  }

  roi(kn: KetNoi): void {
    const n = this.theoKn.get(kn)
    this.theoKn.delete(kn)
    if (!n || n.kn !== kn) return
    n.kn = null
    if (n.tran && this.tran.has(n.tran)) {
      // Giữ ghế một lúc cho em nối lại (đổi mạng, khoá màn); đứng yên, không bắn.
      n.vangLuc = this.bayGio()
      const g = this.tran.get(n.tran)!.tr.ghe.find((x) => x.id === n.id)
      if (g) g.yd = { dx: 0, dy: 0, ngam: g.ngam, ban: false }
      return
    }
    this.xoaNguoi(n)
  }

  private xoaNguoi(n: Nguoi): void {
    this.roiNhom(n)
    for (const k of [...this.moi.keys()]) { const [a, b] = k.split('>').map(Number); if (a === n.id || b === n.id) this.moi.delete(k) }
    this.nguoi.delete(n.id)
    this.moiNguoi({ t: 'x', id: n.id })
  }

  /** Gói từ máy em. Chuỗi = lệnh sảnh (JSON), nhị phân = ý định trong trận. */
  nhan(kn: KetNoi, goi: string | ArrayBuffer | Uint8Array): void {
    const n = this.theoKn.get(kn)
    if (!n) return
    const nay = this.bayGio(), giay = Math.floor(nay / 1000)
    if (giay !== n.giay) { n.giay = giay; n.nGoi = 0 }
    if (++n.nGoi > 80) { kn.dong(MA_DONG.quaNhieu, 'Gửi quá nhiều gói.'); return }
    if (n.nGoi > 40) return
    if (typeof goi !== 'string') {
      const y = docYDinh(goi instanceof Uint8Array ? goi : new Uint8Array(goi))
      const td = y && this.tran.get(n.tran)
      if (!y || !td) return
      const g = td.tr.ghe.find((x) => x.id === n.id)
      if (!g) return
      const l = Math.hypot(y.yd.dx, y.yd.dy)
      g.yd = { dx: l > 1 ? y.yd.dx / l : y.yd.dx, dy: l > 1 ? y.yd.dy / l : y.yd.dy, ngam: y.yd.ngam, ban: y.yd.ban }
      n.seq = y.seq
      return
    }
    if (goi.length > 512) return
    let j: Record<string, unknown>
    try { j = JSON.parse(goi) } catch { return }
    if (!j || typeof j !== 'object') return
    switch (j.t) {
      case 'doi': {
        if (typeof j.nt === 'number') n.nt = Math.max(0, Math.min(NGUYEN_TO.length - 1, j.nt | 0))
        if (typeof j.an === 'boolean') n.an = j.an
        if (typeof j.km === 'boolean') n.km = j.km
        kn.ghiKem(this.kem(n)); this.bao(n); return
      }
      case 'nhanh': return this.dauNhanh(n)
      case 'huy': {
        if (n.tt === 'tim') { n.tt = 'ranh'; this.bao(n) }
        for (const k of [...this.moi.keys()]) if (k.startsWith(`${n.id}>`)) this.moi.delete(k)
        return
      }
      case 'thach': return this.thach(n, j.den, j.sbd)
      case 'nhan': return this.nhanLoi(n, Number(j.tu))
      case 'tu-choi': {
        const tu = Number(j.tu)
        if (this.moi.delete(`${tu}>${n.id}`)) this.gui(this.nguoi.get(tu), { t: 'tin', chu: `${this.tenHien(n)} chưa nhận lời lúc này.` })
        return
      }
      case 'nhom-tao': return this.taoNhom(n)
      case 'nhom-vao': return this.vaoNhom(n, Number(j.ma))
      case 'nhom-roi': return this.roiNhom(n)
      case 'nhom-bat': return this.batNhom(n)
      case 'pu': {
        const i = Number(j.i), td = this.tran.get(n.tran)
        if (!td || !(i >= 0 && i < PHAN_UNG.length) || nay - n.puLuc < 2000) return
        n.puLuc = nay
        for (const id of td.ds) this.gui(this.nguoi.get(id), { t: 'pu', tu: n.id, i })
        return
      }
      case 'roi-tran': {
        const td = this.tran.get(n.tran)
        if (td) this.boTran(td, n)
        return
      }
    }
  }

  private ranh(n: Nguoi | undefined): n is Nguoi { return !!n && !!n.kn && n.tt !== 'dau' }

  private dauNhanh(n: Nguoi): void {
    if (n.tt === 'dau') return
    const ban = [...this.nguoi.values()].filter((k) => k !== n && k.tt === 'tim' && k.kn).sort((a, b) => a.vaoLuc - b.vaoLuc)[0]
    if (ban) { this.batDauTran([ban.id, n.id], 'doi'); return }
    n.tt = 'tim'; this.bao(n)
  }

  private thach(n: Nguoi, den: unknown, sbd: unknown): void {
    if (n.tt === 'dau') return
    const nay = this.bayGio()
    n.thach = n.thach.filter((t) => nay - t < 60_000)
    if (n.thach.length >= 5) { this.gui(n, { t: 'tin', chu: 'Em thách nhiều quá — chờ một phút rồi thách tiếp nhé.' }); return }
    n.thach.push(nay)
    const s = typeof sbd === 'string' ? sbd.trim().slice(0, 20) : ''
    const b = s ? [...this.nguoi.values()].find((k) => k.sbd === s) : this.nguoi.get(Number(den))
    // Trả lời giống nhau dù số báo danh có trong phòng hay không ⇒ không dò được ai đang ở đâu.
    this.gui(n, { t: 'tin', chu: CHU_DA_MOI })
    if (!this.ranh(b) || b === n || b.km) return
    if ((this.moi.get(`${b.id}>${n.id}`) ?? 0) > nay) { this.batDauTran([b.id, n.id], 'doi'); return }
    for (const k of [...this.moi.keys()]) if (k.startsWith(`${n.id}>`)) this.moi.delete(k)
    this.moi.set(`${n.id}>${b.id}`, nay + GIAY_MOI * 1000)
    this.gui(b, { t: 'moi', tu: n.id, ten: this.tenHien(n), nt: n.nt, con: GIAY_MOI })
  }

  private nhanLoi(n: Nguoi, tu: number): void {
    const het = this.moi.get(`${tu}>${n.id}`) ?? 0
    const b = this.nguoi.get(tu)
    if (het <= this.bayGio() || !this.ranh(b) || !this.ranh(n)) { this.moi.delete(`${tu}>${n.id}`); this.gui(n, { t: 'tin', chu: 'Lời thách đã hết hạn.' }); return }
    this.batDauTran([b.id, n.id], 'doi')
  }

  private taoNhom(n: Nguoi): void {
    if (n.tt === 'dau') return
    this.roiNhom(n)
    let ma = 0
    for (let k = 0; k < 200 && !ma; k++) { const m = 10 + Math.floor(this.rng() * 90); if (!this.nhom.has(m)) ma = m }
    if (!ma) { this.gui(n, { t: 'loi', chu: 'Chưa tạo được nhóm, em thử lại nhé.' }); return }
    const g: Nhom = { ma, chu: n.id, ds: [n.id] }
    this.nhom.set(ma, g); n.nhom = ma
    this.baoNhom(g)
  }
  private baoNhom(g: Nhom): void { for (const id of g.ds) this.gui(this.nguoi.get(id), { t: 'nhom', ma: g.ma, chu: g.chu, ds: g.ds }) }
  private vaoNhom(n: Nguoi, ma: number): void {
    if (n.tt === 'dau') return
    const g = this.nhom.get(ma)
    if (!g) { this.gui(n, { t: 'loi', chu: 'Không thấy nhóm có mã này trong phòng chờ.' }); return }
    if (g.ds.includes(n.id)) return this.baoNhom(g)
    if (g.ds.length >= 4) { this.gui(n, { t: 'loi', chu: 'Nhóm này đã đủ 4 bạn.' }); return }
    this.roiNhom(n)
    g.ds.push(n.id); n.nhom = ma
    this.baoNhom(g)
  }
  private roiNhom(n: Nguoi): void {
    const g = this.nhom.get(n.nhom)
    n.nhom = 0
    if (!g) return
    g.ds = g.ds.filter((id) => id !== n.id)
    this.gui(n, { t: 'nhom', ma: 0, chu: 0, ds: [] })
    if (g.chu === n.id || g.ds.length === 0) {
      this.nhom.delete(g.ma)
      for (const id of g.ds) { const k = this.nguoi.get(id); if (k) { k.nhom = 0; this.gui(k, { t: 'nhom', ma: 0, chu: 0, ds: [], tin: 'Chủ nhóm đã rời, nhóm đã giải tán.' }) } }
    } else this.baoNhom(g)
  }
  private batNhom(n: Nguoi): void {
    const g = this.nhom.get(n.nhom)
    if (!g || g.chu !== n.id) return
    const ds = g.ds.filter((id) => this.ranh(this.nguoi.get(id)))
    if (ds.length < 2) { this.gui(n, { t: 'loi', chu: 'Cần ít nhất 2 bạn trong nhóm để bắt đầu.' }); return }
    this.nhom.delete(g.ma)
    for (const id of g.ds) { const k = this.nguoi.get(id); if (k) k.nhom = 0 }
    this.batDauTran(ds, ds.length >= 3 ? 'nhom' : 'doi')
  }

  private goiTran(td: TranDau, n: Nguoi): unknown {
    return { t: 'tran', id: td.id, kieu: td.tr.kieu, toi: n.id, giay: LUAT[td.tr.kieu].giay, haThang: LUAT[td.tr.kieu].haThang, ghe: td.ds.map((id) => { const k = this.nguoi.get(id)!; return [id, this.tenHien(k), k.nt] }) }
  }

  private batDauTran(ids: number[], kieu: KieuTran): void {
    if (this.tran.size >= TRAN_SO_TRAN) { for (const id of ids) this.gui(this.nguoi.get(id), { t: 'tin', chu: 'Sảnh đấu đang kín trận, em chờ một chút nhé.' }); return }
    const ds = ids.map((id) => this.nguoi.get(id)!).filter(Boolean)
    for (const k of ds) {
      k.tt = 'dau'; k.seq = 0; this.roiNhom(k)
      for (const m of [...this.moi.keys()]) { const [a, b] = m.split('>').map(Number); if (a === k.id || b === k.id) this.moi.delete(m) }
    }
    const td: TranDau = { id: this.idTran++, tr: taoTran(kieu, ds.map((k) => ({ id: k.id, nt: k.nt })), Math.floor(this.rng() * 2 ** 31)), ds: ds.map((k) => k.id), tick: 0 }
    this.tran.set(td.id, td)
    for (const k of ds) { k.tran = td.id; this.gui(k, this.goiTran(td, k)); this.bao(k) }
  }

  /** Em bấm Rời trận / rớt quá lâu: trận đôi ⇒ bạn còn lại thắng; trận nhóm ⇒ chỉ em rời. */
  private boTran(td: TranDau, n: Nguoi): void {
    td.tr.ghe = td.tr.ghe.filter((g) => g.id !== n.id)
    td.ds = td.ds.filter((id) => id !== n.id)
    n.tran = 0; n.tt = 'ranh'; n.vangLuc = 0
    this.gui(n, { t: 'ket', thang: null, roi: true, bang: [] })
    if (n.kn) this.bao(n); else this.xoaNguoi(n)
    if (td.tr.ghe.length < 2) { td.tr.xong = true; td.tr.thang = td.tr.ghe[0]?.id ?? null; this.ketTran(td, true) }
  }

  private ketTran(td: TranDau, banRoi = false): void {
    this.tran.delete(td.id)
    const bang = bangKet(td.tr).map((d) => [d.id, d.ha, d.biHa, d.ban, d.trung, d.chuoiMax])
    for (const id of td.ds) {
      const k = this.nguoi.get(id)
      if (!k) continue
      k.tran = 0; k.tt = 'ranh'
      this.gui(k, { t: 'ket', thang: td.tr.thang, banRoi, bang })
      if (k.kn) this.bao(k); else this.xoaNguoi(k)
    }
  }

  /** Một nhịp phòng (BUOC giây): bước mọi trận, gửi ảnh trận, dọn lời thách hết hạn và ghế rớt quá lâu. */
  buoc(dt = BUOC): void {
    const nay = this.bayGio()
    for (const [k, het] of this.moi) if (het <= nay) this.moi.delete(k)
    for (const td of [...this.tran.values()]) {
      for (const id of [...td.ds]) {
        const k = this.nguoi.get(id)
        if (k && !k.kn && k.vangLuc && nay - k.vangLuc > GIAY_CHO_NOI_LAI * 1000) this.boTran(td, k)
      }
      if (!this.tran.has(td.id)) continue
      buocTran(td.tr, dt)
      td.tick = (td.tick + 1) & 0xff
      const than = maAnh(td.tick, td.tr.con, td.tr.ghe, laySuKien(td.tr))
      for (const id of td.ds) { const k = this.nguoi.get(id); if (k?.kn) k.kn.gui(datAck(than.slice(), k.seq)) }
      if (td.tr.xong) this.ketTran(td)
    }
  }

  /** Thầy bấm Bắt đầu thi (hoặc công tắc tắt): báo mọi máy rồi đóng hết. */
  dongTatCa(ly: 'bat-dau' | 'tat'): void {
    const s = json({ t: 'dong', ly })
    for (const n of this.nguoi.values()) if (n.kn) { n.kn.gui(s); n.kn.dong(ly === 'tat' ? MA_DONG.tat : MA_DONG.batDau, ly) }
    this.nguoi.clear(); this.theoKn.clear(); this.tran.clear(); this.nhom.clear(); this.moi.clear()
  }
}
