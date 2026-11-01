// PHÒNG ĐẤU «Đấu Nguyên Tử» 3 ĐẤU 3 — luật của MỘT phòng chờ thi (một ca, hoặc một phần ca khi ca đông), KHÔNG phụ thuộc cách truyền: Durable Object
// `PhongDauIon` (phong-dau-ion.ts) chỉ nối WebSocket vào đây; test gọi thẳng với kết nối giả. Phòng QUYẾT mọi thứ (vị trí, tự ngắm, bắn, trúng, hạ,
// vật phẩm, cấp súng, A.I) bằng lõi chung src/lib/dau-ion/loi.ts; máy em chỉ gửi HƯỚNG ĐI. 0 lệnh D1: người vào nhận diện bằng vé ký (dau-ion-ve.ts).
// THẦY 01/11 tối (duyệt bản vẽ docs/ban-ve-dau-ion-3v3-0111): «tự phân chia làm 2 phe, ba đấu ba … nếu ko đủ thì bot tự tạo đủ, hs xin vào bot tự ẩn đi.
// Tất cả hs đều phải chơi đc» (THAY lệnh sáng 01/11 «đừng tự thêm máy ảo»):
//  · Mỗi sân LUÔN 6 ghế, 3 đấu 3 (Bazơ / Axit); ghế trống là A.I (id 200…255, tên = nguyên tố, máy em ghi «A.I …»).
//  · «Đấu» ⇒ thế chỗ một A.I ở sân đang chạy còn ghế A.I (sân đông người thật trước), vào PHE ÍT NGƯỜI THẬT hơn; không có ⇒ mở sân 1 em + 5 A.I, chạy ngay.
//    Gói `thay {cu, moi, ten, phe, ai}` cho cả sân. Em rời / rớt quá 8 giây ⇒ A.I vào lại đúng ghế đó (cùng phe). Tỉ số phe giữ nguyên khi đổi người.
//  · Ván 60 giây nối ván (nghỉ 6 giây xem bảng); ván mới CHIA LẠI PHE cho đều số người thật; em ngồi một mình được gom sang sân đông hơn lúc sang ván.
//  · Phòng đầy (78 em) ⇒ đóng 4009 «sang:k+1» ⇒ máy em tự nối phòng kế (tối đa 8 phòng một ca).
//  · MƯỢT: `nhip()` bước theo ĐỒNG HỒ THẬT (bộ tích luỹ, bước cố định 1/20 giây, bù tối đa 4 bước) và gửi BƯỚC TRẬN trong ảnh để máy em nội suy.
// Ai thấy ai: chỉ các em cùng sân; mỗi em là số thứ tự ngắn + tên gọi (hai chữ cuối) hoặc «Bạn <nguyên tố>» khi bật Ẩn tên. Số báo danh KHÔNG gửi đi.
import { BUOC, GIAY_NGHI, MOI_PHE, NGUYEN_TO, TEN_NGUYEN_TO, TOI_DA, aiDi, boGhe, buocTran, laySuKien, taoTran, themGhe, xepBang, type Tran } from '../../src/lib/dau-ion/loi'
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

/** Tối đa em mỗi phòng (14 sân × 6 ghế = 84 ghế ≥ 78). Quá ⇒ sang phòng kế. */
export const TRAN_KET_NOI = 78
export const TRAN_SAN = 14
/** Tối đa phòng mỗi ca (8 × 78 = 624 em). */
export const SO_PHONG_TOI_DA = 8
export const GIAY_CHO_NOI_LAI = 8
/** Không gửi ý định quá 3 giây ⇒ ghế «vắng»: không tự bắn, không bị ngắm. */
export const GIAY_VANG = 3
export const MA_DONG = { veSai: 4003, thayMay: 4002, quaNhieu: 4008, day: 4009, batDau: 4000, tat: 4010 } as const
/** Bốn câu phản ứng có sẵn (chỉ ở bảng hết ván) — không có ô chat. */
export const PHAN_UNG = ['Hay đấy!', 'Suýt nữa!', 'Đấu lại nhé', 'Chơi đẹp'] as const
export const CHU_BAN_CU = 'Đấu Nguyên Tử đã có bản mới. Em tải lại trang để vào sân nhé.'
/** id ghế A.I (người thật 1…199). */
export const ID_AI_TU = 200
export { PHIEN_BAN }

interface Nguoi {
  id: number; sbd: string; ten: string; nt: number; an: boolean
  kn: KetNoi | null; san: number
  /** Đếm gói trong giây hiện tại (chống dội gói). */
  giay: number; nGoi: number
  puLuc: number; seq: number; ydLuc: number; vangLuc: number
}
/** `ds`: id NGƯỜI THẬT trong sân (ghế còn lại là A.I); `buoc`: bước trận (mốc thời gian gửi trong ảnh). */
interface San { so: number; tr: Tran; ds: number[]; tick: number; buoc: number; nghi: number; bang: unknown[] }

const json = (o: unknown) => JSON.stringify(o)
const ID_NGUOI_TOI_DA = ID_AI_TU - 1

export class PhongDau {
  private nguoi = new Map<number, Nguoi>()
  private theoKn = new Map<KetNoi, Nguoi>()
  private san = new Map<number, San>()
  private tich = 0
  private lucNhip = 0
  constructor(private bayGio: () => number = Date.now, private rng: () => number = Math.random, readonly soPhong = 0) {}

  get soNguoi(): number { return this.nguoi.size }
  get soSan(): number { return this.san.size }
  /** Còn sân đang chạy, hoặc ghế đang giữ cho em rớt mạng ⇒ phòng giữ vòng 20 lần/giây; hết ⇒ được ngủ. */
  canThuc(): boolean {
    if (this.san.size) return true
    for (const n of this.nguoi.values()) if (n.vangLuc) return true
    return false
  }
  /** Ảnh chụp để test / đo: trận của sân em đang ngồi. */
  sanCua(id: number): Tran | null { const n = this.nguoi.get(id); return (n && this.san.get(n.san)?.tr) || null }
  dsSan(): { so: number; that: number; ghe: number; ai: number }[] { return [...this.san.values()].map((s) => ({ so: s.so, that: s.ds.length, ghe: s.tr.ghe.length, ai: s.tr.ghe.filter((g) => g.ai).length })) }

  private tenHien(n: Nguoi): string { return n.an || !n.ten ? `Bạn ${NGUYEN_TO[n.nt] ?? 'Na'}` : n.ten }
  private gui(n: Nguoi | undefined, o: unknown): void { if (n?.kn) n.kn.gui(json(o)) }
  private kem(n: Nguoi): KemNguoi { return { v: PHIEN_BAN, id: n.id, s: n.sbd, t: n.ten, nt: n.nt, an: n.an } }
  private idTrong(): number { for (let i = 1; i <= ID_NGUOI_TOI_DA; i++) if (!this.nguoi.has(i)) return i; return 0 }
  private soMoi(): number { for (let i = 1; ; i++) if (!this.san.has(i)) return i }

  /** Sân sẽ vào: sân đang chạy còn ghế A.I, đông người thật nhất (bằng nhau ⇒ sân số nhỏ). */
  private sanSeVao(tru?: San): San | null {
    let tot: San | null = null
    for (const s of this.san.values()) {
      if (s === tru || !s.tr.ghe.some((g) => g.ai)) continue
      if (!tot || s.ds.length > tot.ds.length) tot = s
    }
    return tot
  }
  private chuSanh(): unknown { const s = this.sanSeVao(); return { t: 'sanh', so: s?.so ?? this.soMoi(), that: s?.ds.length ?? 0 } }
  private baoSanh(): void { const o = json(this.chuSanh()); for (const n of this.nguoi.values()) if (n.kn && !n.san) n.kn.gui(o) }

  /** Em vào bằng vé đã kiểm (sảnh, CHƯA vào sân). Cùng số báo danh mở ở máy/tab khác ⇒ kết nối cũ bị thay. Phòng đầy ⇒ chỉ sang phòng kế. */
  vao(kn: KetNoi, ve: VeDau, nt: number, an: boolean): Nguoi | null {
    let n = [...this.nguoi.values()].find((k) => k.sbd === ve.s)
    if (n) {
      if (n.kn && n.kn !== kn) { this.theoKn.delete(n.kn); n.kn.dong(MA_DONG.thayMay, 'Em vừa mở Đấu Nguyên Tử ở máy hoặc tab khác.') }
      n.kn = kn; n.vangLuc = 0; n.ydLuc = this.bayGio()
    } else {
      const id = this.nguoi.size < TRAN_KET_NOI ? this.idTrong() : 0
      if (!id) { kn.dong(MA_DONG.day, this.soPhong + 1 < SO_PHONG_TOI_DA ? `sang:${this.soPhong + 1}` : 'Sảnh đấu đã đủ người.'); return null }
      n = { id, sbd: ve.s, ten: String(ve.t || '').slice(0, 16), nt: 0, an: false, kn, san: 0, giay: 0, nGoi: 0, puLuc: 0, seq: 0, ydLuc: 0, vangLuc: 0 }
      this.nguoi.set(id, n)
    }
    if (!n.san) { n.nt = Math.max(0, Math.min(NGUYEN_TO.length - 1, nt | 0)); n.an = !!an }
    this.theoKn.set(kn, n)
    kn.ghiKem(this.kem(n))
    kn.gui(json({ t: 'chao', v: PHIEN_BAN, toi: n.id, ten: this.tenHien(n) }))
    const s = this.san.get(n.san)
    // Nối lại giữa ván: về đúng sân, đúng ghế.
    if (s) { kn.gui(json(this.goiSan(s, n))); if (s.nghi > 0) kn.gui(json({ t: 'ket', bang: s.bang, nghi: s.nghi, ti: s.tr.ti })) }
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
      case 'pu': {
        const i = Number(j.i)
        if (!s || !(i >= 0 && i < PHAN_UNG.length) || nay - n.puLuc < 2000) return
        n.puLuc = nay
        for (const id of s.ds) this.gui(this.nguoi.get(id), { t: 'pu', tu: n.id, i })
        return
      }
    }
  }

  /** Dòng ghế: [id, tên, nguyên tố, là A.I (0/1), phe]. A.I mang tên nguyên tố (máy em ghi «A.I …»). */
  private dongGhe(s: San): unknown[] {
    return s.tr.ghe.map((g) => { const k = g.ai ? undefined : this.nguoi.get(g.id); return [g.id, k ? this.tenHien(k) : g.ai ? TEN_NGUYEN_TO[g.nt] : `Bạn ${NGUYEN_TO[g.nt] ?? 'Na'}`, g.nt, g.ai ? 1 : 0, g.phe] })
  }
  private goiSan(s: San, n: Nguoi): unknown {
    return { t: 'san', v: PHIEN_BAN, so: s.so, toi: n.id, con: Math.ceil(s.tr.con), buoc: s.buoc, ti: s.tr.ti, ghe: this.dongGhe(s), vp: s.tr.vp.map((v) => [v.id, v.k, Math.round(v.x), Math.round(v.y)]) }
  }
  private baoCaSan(s: San, o: unknown, tru?: Nguoi): void { const c = json(o); for (const id of s.ds) { const k = this.nguoi.get(id); if (k !== tru && k?.kn) k.kn.gui(c) } }

  /** Nguyên tố còn trống trong sân (mỗi sân 6 nguyên tố khác nhau nếu được). */
  private ntTrong(s: San, muon: number): number {
    const dung = new Set(s.tr.ghe.map((g) => g.nt))
    for (let i = 0; i < NGUYEN_TO.length; i++) { const nt = (muon + i) % NGUYEN_TO.length; if (!dung.has(nt)) return nt }
    return muon
  }
  private idAi(s: San): number { for (let i = ID_AI_TU; i < 256; i++) if (!s.tr.ghe.some((g) => g.id === i)) return i; return 255 }
  /** Số người thật mỗi phe. */
  private demPhe(s: San): [number, number] { const d: [number, number] = [0, 0]; for (const g of s.tr.ghe) if (!g.ai) d[g.phe & 1]++; return d }

  /** Sân mới đủ 6 ghế A.I (3 đấu 3), chạy ngay. */
  private taoSan(): San {
    const nt = [0, 1, 2, 3, 4, 5, 6].sort(() => this.rng() - 0.5)
    const tr = taoTran(Array.from({ length: TOI_DA }, (_, i) => ({ id: ID_AI_TU + i, nt: nt[i], ai: true, phe: i < MOI_PHE ? 0 : 1 })), Math.floor(this.rng() * 2 ** 31))
    tr.su = []
    const s: San = { so: this.soMoi(), tr, ds: [], tick: 0, buoc: 0, nghi: 0, bang: [] }
    this.san.set(s.so, s)
    return s
  }

  private vaoSan(n: Nguoi): void {
    const cu = this.san.get(n.san)
    if (cu) { this.gui(n, this.goiSan(cu, n)); return }
    let s = this.sanSeVao()
    if (!s) {
      if (this.san.size >= TRAN_SAN) { this.gui(n, { t: 'tin', chu: 'Sân đấu đang kín, em chờ một chút nhé.' }); return }
      s = this.taoSan()
    }
    this.ngoiVao(s, n)
    this.baoSanh()
  }

  /** Em thế chỗ một A.I: vào PHE ÍT NGƯỜI THẬT hơn (bằng nhau ⇒ phe đang kém điểm ⇒ Bazơ); A.I tan đi, em hiện ở bệ phe đó, khiên 3 giây. */
  private ngoiVao(s: San, n: Nguoi): boolean {
    const d = this.demPhe(s), ti = s.tr.ti
    const muon = d[0] !== d[1] ? (d[0] < d[1] ? 0 : 1) : ti[0] !== ti[1] ? (ti[0] < ti[1] ? 0 : 1) : 0
    const ai = s.tr.ghe.find((g) => g.ai && g.phe === muon) ?? s.tr.ghe.find((g) => g.ai)
    if (!ai) return false
    boGhe(s.tr, ai.id)
    // Em giữ nguyên tố em chọn: A.I nào đang mang nguyên tố đó thì đổi sang nguyên tố của ghế A.I vừa nhường.
    const trung = s.tr.ghe.find((k) => k.ai && k.nt === n.nt)
    if (trung) trung.nt = ai.nt
    const g = themGhe(s.tr, { id: n.id, nt: this.ntTrong(s, n.nt), phe: ai.phe })
    s.ds.push(n.id); n.san = s.so; n.seq = 0; n.ydLuc = this.bayGio(); n.vangLuc = 0
    this.gui(n, this.goiSan(s, n))
    if (s.nghi > 0) this.gui(n, { t: 'ket', bang: s.bang, nghi: s.nghi, ti: s.tr.ti })
    this.baoCaSan(s, { t: 'thay', cu: ai.id, moi: n.id, ten: this.tenHien(n), nt: g.nt, phe: g.phe, ai: 0 }, n)
    this.baoCaSan(s, { t: 'ghe', ghe: this.dongGhe(s) }, n)
    return true
  }

  /** Em ra khỏi sân (không báo gì cho em): A.I vào lại đúng ghế đó (cùng phe). Sân hết người thật ⇒ đóng (không chạy A.I đấu A.I). */
  private boKhoiSan(s: San, n: Nguoi): void {
    const g = s.tr.ghe.find((x) => x.id === n.id)
    s.ds = s.ds.filter((id) => id !== n.id)
    boGhe(s.tr, n.id)
    n.san = 0
    if (!s.ds.length) { this.san.delete(s.so); return }
    if (g) {
      const id = this.idAi(s), nt = this.ntTrong(s, g.nt)
      themGhe(s.tr, { id, nt, ai: true, phe: g.phe })
      this.baoCaSan(s, { t: 'thay', cu: n.id, moi: id, ten: TEN_NGUYEN_TO[nt], nt, phe: g.phe, ai: 1 })
    }
    this.baoCaSan(s, { t: 'ghe', ghe: this.dongGhe(s) })
  }

  private roiSan(s: San, n: Nguoi): void {
    this.boKhoiSan(s, n)
    n.vangLuc = 0
    if (n.kn) this.gui(n, this.chuSanh()); else this.nguoi.delete(n.id)
    this.baoSanh()
  }

  /** Ván mới: em ngồi MỘT MÌNH mà sân khác có người còn ghế A.I ⇒ gom sang đó; còn lại CHIA LẠI PHE (người thật xen kẽ, lệch ≤ 1), A.I lấp đủ 3 đấu 3. */
  private batVan(s: San): void {
    if (s.ds.length === 1) {
      const toi = this.sanSeVao(s), n = this.nguoi.get(s.ds[0])
      if (toi && n && toi.ds.length >= 1) { this.boKhoiSan(s, n); this.ngoiVao(toi, n); this.baoSanh(); return }
    }
    const nguoi = s.ds.map((id) => this.nguoi.get(id)).filter((n): n is Nguoi => !!n).sort(() => this.rng() - 0.5)
    const dau = this.rng() < 0.5 ? 0 : 1, ds: { id: number; nt: number; ai?: boolean; phe: number }[] = [], dung = new Set<number>()
    nguoi.forEach((n, i) => { const nt = [0, 1, 2, 3, 4, 5, 6].map((k) => (n.nt + k) % 7).find((k) => !dung.has(k)) ?? n.nt; dung.add(nt); ds.push({ id: n.id, nt, phe: (dau + i) % 2 }) })
    for (const phe of [0, 1]) {
      let id = ID_AI_TU
      while (ds.filter((d) => d.phe === phe).length < MOI_PHE) {
        while (ds.some((d) => d.id === id)) id++
        const nt = [0, 1, 2, 3, 4, 5, 6].find((k) => !dung.has(k)) ?? 0; dung.add(nt)
        ds.push({ id, nt, ai: true, phe })
      }
    }
    s.tr = taoTran(ds, Math.floor(this.rng() * 2 ** 31)); s.tr.su = []
    s.nghi = 0; s.tick = 0; s.bang = []
    const vp = s.tr.vp.map((v) => [v.id, v.k, Math.round(v.x), Math.round(v.y)])
    for (const id of s.ds) this.gui(this.nguoi.get(id), { t: 'van', con: Math.ceil(s.tr.con), buoc: s.buoc, ghe: this.dongGhe(s), vp })
  }

  /** NHỊP THEO ĐỒNG HỒ THẬT (Durable Object gọi ~20 lần/giây, có thể trễ / dồn): dồn thời gian thật vào bộ tích luỹ, chạy đủ số bước
   *  cố định 1/20 giây (bù tối đa 4 bước), chỉ gửi ảnh ở bước cuối (sự kiện các bước trước gộp vào). */
  nhip(): void {
    const nay = this.bayGio()
    if (!this.lucNhip) this.lucNhip = nay - BUOC * 1000
    this.tich = Math.min(this.tich + (nay - this.lucNhip) / 1000, BUOC * 4)
    this.lucNhip = nay
    const n = Math.floor(this.tich / BUOC + 1e-6)
    if (!n) return
    this.tich -= n * BUOC
    for (let i = 0; i < n; i++) this.buoc(BUOC, i === n - 1)
  }
  /** Phòng sắp ngủ (hết sân): quên đồng hồ nhịp. */
  nghiNhip(): void { this.lucNhip = 0; this.tich = 0 }

  /** Một bước phòng (BUOC giây): xử ghế vắng / rớt quá lâu, A.I quyết hướng, bước mọi sân, (gửi ảnh trận), xoay ván. */
  buoc(dt = BUOC, guiAnh = true): void {
    const nay = this.bayGio()
    for (const s of [...this.san.values()]) {
      for (const id of [...s.ds]) {
        const k = this.nguoi.get(id)
        if (!k) continue
        const g = s.tr.ghe.find((x) => x.id === id)
        if (g && nay - k.ydLuc > GIAY_VANG * 1000) { g.vang = true; g.yd = { dx: 0, dy: 0 } }
        // Rớt mạng quá 8 giây, hoặc mở mà vắng quá 8 giây ⇒ rời sân, A.I vào lại ghế.
        if ((!k.kn && k.vangLuc && nay - k.vangLuc > GIAY_CHO_NOI_LAI * 1000) || nay - k.ydLuc > GIAY_CHO_NOI_LAI * 1000) this.roiSan(s, k)
      }
      if (!this.san.has(s.so)) continue
      if (s.nghi > 0) { s.nghi -= dt; if (s.nghi <= 0) this.batVan(s); continue }
      for (const g of s.tr.ghe) if (g.ai) g.yd = aiDi(s.tr, g, dt)
      buocTran(s.tr, dt)
      s.buoc = (s.buoc + 1) & 0xffff
      if (guiAnh || s.tr.xong) {
        s.tick = (s.tick + 1) & 0xff
        const than = maAnh(s.tick, s.tr.con, s.tr.ghe, laySuKien(s.tr), s.buoc, s.tr.ti)
        for (const id of s.ds) { const k = this.nguoi.get(id); if (k?.kn) k.kn.gui(datAck(than.slice(), k.seq)) }
      }
      if (s.tr.xong) {
        s.nghi = GIAY_NGHI
        // Dòng: [id, hạ, bị hạ, cấp cao nhất, chuỗi hạ, electron đã nhặt, góp sức, trúng, giây trụ liền] — máy em tự tính huy hiệu.
        s.bang = xepBang(s.tr).map((d) => [d.id, d.ha, d.biHa, d.capMax, d.chuoiMax, d.nhatE, d.hoTro, d.trung, d.songMax])
        this.baoCaSan(s, { t: 'ket', bang: s.bang, nghi: GIAY_NGHI, ti: s.tr.ti })
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
