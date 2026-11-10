// LIVE BẢNG — PHẦN LIVE CỦA PHÒNG BÌNH PHẢN ỨNG (10/11, đặc tả docs/dac-ta-live-bang-1011.md mục 4.3, 5, 6). Luật thuần: src/lib/bpu/phong-live.ts.
// Durable Object của phòng (phong-binh-phan-ung.ts) giữ MỘT đối tượng `LiveMay` và chuyển cho nó: mọi tin chữ `live-*`, mọi tin NHỊ PHÂN, lúc kết nối đóng.
// TẢI (300 máy em, MỘT luồng):
//   · view đầy đủ (`viewEm` / `viewBang`) chỉ phát khi TRẠNG THÁI đổi (bật / tắt / sẵn sàng / công tắc) — KHÔNG phát theo nét, theo `live-ok`, theo số đo;
//   · mục sổ nét: phòng ghi số thứ tự ngay trên khung rồi chuyển NGUYÊN khung cho máy em (không giải mã thân);
//   · lô điểm đang viết (đường dự phòng khi máy em chưa có DataChannel): chuyển nguyên văn, CHỈ tới máy em đã báo cần, không lưu, không đụng storage,
//     không JSON; danh sách người nhận giữ sẵn trong bộ nhớ;
//   · sổ nét ghi storage GOM 1 giây một lần theo mảnh (không ghi theo từng khung) ⇒ khung chuyển đi không phải chờ cổng ghi;
//   · số em đang xem báo riêng cho máy thầy bằng tin nhỏ `live-xem`, gom 300 ms.
// AN TOÀN: không trường nào ở đây đụng tới đáp án / lời giải của lượt; chỉ máy THẦY gửi được khung nhị phân.
import type { DurableObjectState, WsMayChu } from './kieu'
import type { TrangThaiPhong } from '../../src/lib/bpu/phong'
import * as LL from '../../src/lib/bpu/phong-live'

type Row = Record<string, unknown>
/** Dữ liệu gắn vào kết nối: vai + sbd (đã có) · `x` = phiên live em đã báo `live-ok` · `d` = 1 khi em cần điểm đang viết qua WebSocket. */
export interface KemBpu { v: 'gv' | 'hs'; s: string; x?: number; d?: 0 | 1 }
export interface ChuPhong {
  ctx: DurableObjectState
  doc(): Promise<TrangThaiPhong | null>
  /** Trạng thái đang có trong bộ nhớ (undefined = phòng vừa thức, chưa đọc). */
  nho(): TrangThaiPhong | null | undefined
  luu(henNghi?: boolean): Promise<void>
  phat(): void
}

/** Sổ nét lưu theo MẢNH: mỗi mảnh tối đa ngần này khung (khung ≤ 16 KB ⇒ mảnh ≤ 512 KB, dưới trần 2 MB một giá trị của Durable Object lớp SQLite). */
export const KHUNG_MOI_MANH = 32
/** Sổ quá dài ⇒ xin máy thầy gửi ẢNH TRẠNG THÁI (xoá hết + các nét đang có) để sổ gọn lại; quá trần cứng ⇒ vẫn chuyển cho máy em nhưng không lưu thêm. */
export const SO_MEM = { muc: 3000, byte: 4_000_000 }
export const SO_CUNG = { muc: 6000, byte: 8_000_000 }
const GOM_LUU_SO_MS = 1000
const GOM_XEM_MS = 300
const LAM_MOI_DS_MS = 5000
const NHIP_LUU_MS = 60_000
const NHIP_DO_MS = 10_000

interface DoEm { luc: number; d: number; j: number; m: number; rtt: number; tt: number; dc: boolean }
const so = (v: unknown, tran: number): number => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.min(tran, Math.round(n)) : -1 }
function tomTat(ds: number[]): { tv: number; p95: number } | null {
  const s = ds.filter((x) => x >= 0).sort((a, b) => a - b)
  return s.length ? { tv: s[Math.floor((s.length - 1) / 2)]!, p95: s[Math.min(s.length - 1, Math.floor(s.length * 0.95))]! } : null
}

export class LiveMay {
  /** Sổ nét trong bộ nhớ (khung nguyên văn đã có số thứ tự); null = chưa đọc từ storage. */
  private so: Uint8Array[] | null = null
  private soByte = 0
  private manhBan = Infinity
  private manhDaLuu = 0
  private henLuu: ReturnType<typeof setTimeout> | null = null
  private daXinAnh = false
  private dsHs: WsMayChu[] | null = null
  private dsDiem: WsMayChu[] | null = null
  private lucDs = 0
  private vai = new WeakMap<object, KemBpu>()
  private henXem: ReturnType<typeof setTimeout> | null = null
  private doEm = new Map<string, DoEm>()
  private lucGuiDo = 0
  private lucLuuNhip = 0
  private giayLo = 0
  private soLo = 0
  /** Bộ đếm cho bài đo tải: số lô điểm đã chuyển + số lệnh gửi. */
  dem = { lo: 0, gui: 0, boVuot: 0 }

  constructor(private chu: ChuPhong) {}

  private kem(ws: WsMayChu): KemBpu {
    let a = this.vai.get(ws)
    if (!a) { a = (ws.deserializeAttachment() ?? { v: 'hs', s: '' }) as KemBpu; this.vai.set(ws, a) }
    return a
  }
  private gui(ws: WsMayChu, d: string | ArrayBuffer | Uint8Array): void { try { ws.send(d) } catch { /* kết nối vừa đóng */ } }
  private guiThay(d: string): void { for (const ws of this.chu.ctx.getWebSockets('gv')) this.gui(ws, d) }
  /** Danh sách máy em (và máy em cần điểm qua WebSocket) giữ sẵn trong bộ nhớ; làm mới 5 giây một lần + khi có kết nối đóng / phiên đổi. */
  private lamMoiDs(nay: number, phien: number): void {
    if (this.dsHs && nay - this.lucDs < LAM_MOI_DS_MS) return
    this.lucDs = nay
    this.dsHs = this.chu.ctx.getWebSockets('hs')
    this.dsDiem = this.dsHs.filter((ws) => { const a = this.kem(ws); return a.x === phien && a.d === 1 })
  }
  private boDs(): void { this.dsHs = null; this.dsDiem = null }

  /** Số em đang xem (đã báo `live-ok` phiên này, còn nối, không đang rời màn) + số em trong đó cần điểm qua WebSocket. Đếm theo em, không theo kết nối. */
  demXem(st: TrangThaiPhong, kem?: (KemBpu | null)[]): { xem: number; ws: number } {
    const l = st.live
    if (!l?.bat) return { xem: 0, ws: 0 }
    const ds = kem ?? this.chu.ctx.getWebSockets('hs').map((ws) => this.kem(ws))
    const xem = new Set<string>(), canWs = new Set<string>()
    for (const a of ds) if (a && a.s && a.x === l.phien && !st.roiNay?.includes(a.s)) { xem.add(a.s); if (a.d === 1) canWs.add(a.s) }
    return { xem: xem.size, ws: canWs.size }
  }
  private henBaoXem(): void {
    if (this.henXem) return
    this.henXem = setTimeout(() => { this.henXem = null; const st = this.chu.nho(); if (st?.live?.bat) this.guiThay(JSON.stringify({ t: 'live-xem', ...this.demXem(st) })) }, GOM_XEM_MS)
  }

  // ── SỔ NÉT ──
  private async docSo(st: TrangThaiPhong): Promise<Uint8Array[]> {
    if (this.so) return this.so
    const meta = await this.chu.ctx.storage.get<{ khung: number; soNet: number }>('sn:n')
    const ra: Uint8Array[] = []
    const soManh = meta ? Math.ceil(meta.khung / KHUNG_MOI_MANH) : 0
    const manh = await Promise.all(Array.from({ length: soManh }, (_, i) => this.chu.ctx.storage.get<Uint8Array>(`sn:${i}`)))
    for (const m of manh) {
      if (!(m instanceof Uint8Array)) break
      const v = new DataView(m.buffer, m.byteOffset, m.byteLength)
      for (let n = 0; n + 4 <= m.length;) { const dai = v.getUint32(n, true); n += 4; if (!dai || n + dai > m.length) break; ra.push(m.slice(n, n + dai)); n += dai }
    }
    this.so = ra; this.soByte = ra.reduce((s, k) => s + k.length, 0); this.manhDaLuu = soManh; this.manhBan = Infinity
    if (st.live) st.live.soNet = Math.max(st.live.soNet, meta?.soNet ?? 0, ra.length ? LL.docStt(ra[ra.length - 1]!) : 0)
    return ra
  }
  private henLuuSo(): void {
    if (this.henLuu) return
    this.henLuu = setTimeout(() => { this.henLuu = null; void this.luuSo() }, GOM_LUU_SO_MS)
  }
  /** Ghi các mảnh bẩn của sổ nét xuống storage (gom — không gọi theo từng khung). */
  async luuSo(): Promise<void> {
    if (this.henLuu) { clearTimeout(this.henLuu); this.henLuu = null }
    const ds = this.so, st = this.chu.nho()
    if (!ds || this.manhBan === Infinity) return
    const kho = this.chu.ctx.storage, soManh = Math.ceil(ds.length / KHUNG_MOI_MANH), tu = this.manhBan
    this.manhBan = Infinity
    try {
      for (let i = tu; i < soManh; i++) {
        const phan = ds.slice(i * KHUNG_MOI_MANH, (i + 1) * KHUNG_MOI_MANH)
        const m = new Uint8Array(phan.reduce((s, k) => s + 4 + k.length, 0)), v = new DataView(m.buffer)
        let n = 0
        for (const k of phan) { v.setUint32(n, k.length, true); m.set(k, n + 4); n += 4 + k.length }
        await kho.put(`sn:${i}`, m)
      }
      for (let i = soManh; i < this.manhDaLuu; i++) await kho.delete(`sn:${i}`)
      this.manhDaLuu = soManh
      await kho.put('sn:n', { khung: ds.length, soNet: st?.live?.soNet ?? 0 })
    } catch (e) { this.manhBan = Math.min(this.manhBan, tu); console.error('[live] lưu sổ nét lỗi:', e instanceof Error ? e.message : e) }
  }
  /** Một mục sổ nét từ máy thầy: đánh số, nối sổ (xoá hết / bảng mới ⇒ dọn phần cũ), chuyển nguyên khung cho mọi máy em. */
  private async mucSo(st: TrangThaiPhong, ws: WsMayChu, k: Uint8Array, goc: ArrayBuffer, nay: number): Promise<void> {
    const l = st.live!
    const ds = await this.docSo(st)
    l.soNet += 1
    LL.ghiStt(k, l.soNet)
    if (LL.laMucDonSo(k[0]!)) { ds.length = 0; this.soByte = 0; this.manhBan = 0; this.daXinAnh = false }
    if (ds.length < SO_CUNG.muc && this.soByte + k.length <= SO_CUNG.byte) {
      this.manhBan = Math.min(this.manhBan, Math.floor(ds.length / KHUNG_MOI_MANH))
      ds.push(k); this.soByte += k.length
      this.henLuuSo()
    }
    if (!this.daXinAnh && (ds.length > SO_MEM.muc || this.soByte > SO_MEM.byte)) { this.daXinAnh = true; this.gui(ws, '{"t":"live-can-anh"}') }
    LL.liveNhip(st, nay)
    this.lamMoiDs(nay, l.phien)
    for (const w of this.dsHs!) this.gui(w, goc)
  }
  /** Gửi bù sổ nét cho MỘT máy em: `net` = số thứ tự cuối em đã có. Khớp một mục trong sổ (hoặc ngay trước mục đầu) ⇒ chỉ gửi phần sau;
   *  không khớp (em vào muộn sau khi sổ dọn, phòng khởi động lại, sổ của buổi khác) ⇒ `lamLai` + cả sổ. */
  async guiBu(st: TrangThaiPhong, ws: WsMayChu, net: unknown): Promise<void> {
    if (!st.live?.cho) return
    const ds = await this.docSo(st), co = Math.max(0, Math.floor(Number(net) || 0))
    const dau = ds.length ? LL.docStt(ds[0]!) : st.live.soNet + 1
    let tu = co === dau - 1 ? 0 : -1
    if (tu < 0) { const i = ds.findIndex((k) => LL.docStt(k) === co); if (i >= 0) tu = i + 1 }
    const lamLai = tu < 0
    this.gui(ws, JSON.stringify({ t: 'live-so', lamLai, soNet: st.live.soNet, muc: lamLai ? ds.length : ds.length - tu }))
    for (let i = lamLai ? 0 : tu; i < ds.length; i++) this.gui(ws, ds[i]!)
  }

  // ── TIN NHỊ PHÂN (chỉ máy thầy) ──
  async nhiPhan(ws: WsMayChu, goi: ArrayBuffer): Promise<void> {
    const dai = goi.byteLength
    if (dai < 5 || dai > LL.KHUNG_TOI_DA) return
    if (this.kem(ws).v !== 'gv') return
    const st = this.chu.nho() ?? (await this.chu.doc())
    const l = st?.live
    if (!st || !l || !l.cho || st.ketThuc) return
    const k = new Uint8Array(goi), nhom = LL.nhomKhung(k[0]!)
    const nay = Date.now()
    if (nhom === 'diem') {
      // ĐƯỜNG NÓNG: không await, không storage, không JSON. Chỉ khi đang live; quá trần lô / giây ⇒ bỏ (lô sau mang điểm mới hơn).
      if (!l.bat) return
      const giay = Math.floor(nay / 1000)
      if (giay !== this.giayLo) { this.giayLo = giay; this.soLo = 0 }
      if (++this.soLo > LL.LO_MOI_GIAY_TRAN) { this.dem.boVuot += 1; return }
      l.nhip = nay
      this.lamMoiDs(nay, l.phien)
      const ds = this.dsDiem!
      for (let i = 0; i < ds.length; i++) { try { ds[i]!.send(goi) } catch { /* kết nối vừa đóng */ } }
      this.dem.lo += 1; this.dem.gui += ds.length
      return
    }
    if (nhom === 'so') await this.mucSo(st, ws, k, goi, nay)
  }

  // ── TIN CHỮ `live-*` ──
  /** Trả true nếu đã xử lý (kể cả bị từ chối). */
  async tinChu(ws: WsMayChu, a: KemBpu, j: Row, st: TrangThaiPhong, nay: number): Promise<boolean> {
    const t = String(j.t ?? '')
    if (!t.startsWith('live-')) return false
    const l = st.live
    if (!l || !l.cho || st.ketThuc) return true
    this.vai.set(ws, a)
    if (a.v === 'gv') {
      let doi = false
      if (t === 'live-san') doi = LL.liveSan(st, { san: j.san !== false, ss: j.ss }, nay)
      else if (t === 'live-bat') {
        doi = LL.liveBat(st, nay)
        if (doi) { this.doEm.clear(); this.boDs(); this.lucLuuNhip = nay } else this.gui(ws, JSON.stringify({ t: 'live-kq', lenh: 'bat', ok: false, lyDo: l.bat ? 'dang-live' : 'tat' }))
      } else if (t === 'live-tat') { doi = this.tat(st, nay) }
      else if (t === 'live-dat') doi = LL.liveDat(st, { xa: j.xa, tiengLop: j.tiengLop }, nay)
      else if (t === 'live-nhip') {
        LL.liveNhip(st, nay)
        // Nhịp chỉ ghi storage thưa (1 phút / lần) ⇒ phòng ngủ rồi thức lại không tự tắt nhầm live đang chạy.
        if (l.bat && nay - this.lucLuuNhip > NHIP_LUU_MS) { this.lucLuuNhip = nay; await this.chu.luu(false) }
      }
      if (doi) { if (t === 'live-san') this.boDs(); await this.chu.luu(true); this.chu.phat() }
      return true
    }
    if (!a.s) return true
    if (t === 'live-bu') { await this.guiBu(st, ws, j.net); return true }
    if (await this.tuTat(st, nay)) return true
    if (t === 'live-ok') {
      if (!l.bat || !LL.duocXemLive(st, a.s)) return true
      const d: 0 | 1 = j.dc === true ? 0 : 1
      if (a.x === l.phien && a.d === d) return true
      a.x = l.phien; a.d = d
      ws.serializeAttachment(a)
      // Cập nhật danh sách nhận điểm tại chỗ (không dựng lại cả danh sách cho mỗi em báo).
      if (this.dsDiem) { const i = this.dsDiem.indexOf(ws); if (d === 1 && i < 0) this.dsDiem.push(ws); else if (d === 0 && i >= 0) this.dsDiem.splice(i, 1) }
      this.henBaoXem()
      return true
    }
    if (t === 'live-do') {
      if (!l.bat || a.x !== l.phien) return true
      this.doEm.set(a.s, { luc: nay, d: so(j.d, 2000), j: so(j.j, 5000), m: so(j.m, 60_000), rtt: so(j.rtt, 10_000), tt: so(j.tt, 10_000), dc: j.dc === true })
      if (nay - this.lucGuiDo >= NHIP_DO_MS) { this.lucGuiDo = nay; this.guiThay(JSON.stringify({ t: 'live-do', ...this.gomDo(nay) })) }
      return true
    }
    return true
  }
  /** Gộp số đo các máy em báo trong 30 giây gần nhất (trung vị + p95 giữa các em). Chỉ trong bộ nhớ. */
  gomDo(nay: number) {
    const ds = [...this.doEm.values()].filter((x) => nay - x.luc <= 30_000)
    return { so: ds.length, dc: ds.filter((x) => x.dc).length, d: tomTat(ds.map((x) => x.d)), jitter: tomTat(ds.map((x) => x.j)), muon: tomTat(ds.map((x) => x.m)), rtt: tomTat(ds.map((x) => x.rtt)), tieng: tomTat(ds.map((x) => x.tt)) }
  }
  private tat(st: TrangThaiPhong, nay: number): boolean {
    const tomTatDo = this.gomDo(nay)
    if (!LL.liveTat(st, nay)) return false
    this.boDs()
    // Số đo của lần live vừa xong (thầy xem sau buổi) + sổ nét: ghi một lần lúc tắt.
    void this.chu.ctx.storage.put('live-do', { luc: nay, ...tomTatDo }).catch(() => undefined)
    void this.luuSo()
    return true
  }
  /** Thầy quên tắt / máy thầy mất hẳn: quá 15 phút không dấu hiệu ⇒ tự tắt (xét lười khi có máy em nhắn / chào — không thêm hẹn giờ cho phòng). */
  async tuTat(st: TrangThaiPhong, nay: number): Promise<boolean> {
    if (!LL.liveHetHan(st, nay) || !this.tat(st, nay)) return false
    await this.chu.luu(false); this.chu.phat()
    return true
  }
  /** Em đã về lại app / rời màn ⇒ số em xem đổi (view đầy đủ đã do phòng phát). Kết nối đóng ⇒ bỏ khỏi danh sách giữ sẵn + báo lại số em xem. */
  dong(ws?: WsMayChu): void {
    if (ws) { this.vai.delete(ws); for (const ds of [this.dsHs, this.dsDiem]) { const i = ds ? ds.indexOf(ws) : -1; if (i >= 0) ds!.splice(i, 1) } }
    else this.boDs()
    if (this.chu.nho()?.live?.bat) this.henBaoXem()
  }
  /** Buổi kết thúc: ghi nốt sổ nét. */
  async ketThuc(): Promise<void> { this.boDs(); await this.luuSo() }
}
