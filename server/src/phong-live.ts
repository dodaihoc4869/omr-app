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
import * as LU from '../../src/lib/bpu/phong-luat'
import { sachTieng, type SoTieng } from '../../src/lib/live/so-tieng'

type Row = Record<string, unknown>
/** Dữ liệu gắn vào kết nối: vai + sbd (đã có) · `x` = phiên live em đã báo `live-ok` · `d` = 1 khi em cần điểm đang viết qua WebSocket ·
 *  `n` = 1 khi máy em báo loa ĐANG PHÁT tiếng thầy (thầy thấy «mấy em đang nghe») ·
 *  `xa` = 1 khi em vào bằng vé «em ở xa» (đợt 2, điểm quyết 4: chỉ xem live — không điểm danh, không đội, không kJ, không gửi đáp án). */
export interface KemBpu { v: 'gv' | 'hs'; s: string; x?: number; d?: 0 | 1; n?: 0 | 1; xa?: 1 }
export interface ChuPhong {
  ctx: DurableObjectState
  doc(): Promise<TrangThaiPhong | null>
  /** Trạng thái đang có trong bộ nhớ (undefined = phòng vừa thức, chưa đọc). */
  nho(): TrangThaiPhong | null | undefined
  luu(henNghi?: boolean): Promise<void>
  phat(): void
  /** Báo máy các em qua kênh đẩy (mở màn Bình Phản Ứng) — đợt 2: gọi em ở xa vào xem khi thầy bật «Cho em ở xa vào xem». Không có ⇒ bỏ qua. */
  bao?(sbd: string[]): void
  /** XEM LẠI LIVE (11/11, live-xem-lai.ts — chỉ thêm): nhật ký nét kèm giờ + tin `live-ghi` của máy ghi. Vắng ⇒ không ghi gì. */
  xl?: { khung(k: Uint8Array, nay: number): void; bat(so: readonly Uint8Array[], nay: number): void; tinGhi(st: TrangThaiPhong, j: Row, nay: number): boolean }
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
/** Gọi lại em ở xa CHƯA nối phòng (em mở app sau lúc thầy bật) thưa nhất ngần này một lần, theo nhịp của máy thầy. */
const NHIP_GOI_XA_MS = 120_000
/** Nhật ký đàm thoại trong kho của phòng: mỗi lần ghi một khoá `nk:<giờ>:<số>` (không đọc–sửa–ghi cả sổ); đọc lại tối đa ngần này khoá. */
const NK_DOC_TOI_DA = 1000

interface DoEm { luc: number; d: number; j: number; m: number; rtt: number; tt: number; dc: boolean; gl: boolean; ti: SoTieng | null }
/** ĐO TIẾNG TỪ XA (11/11 tối): một dòng nhật ký máy chủ mỗi 10 giây khi đang live — đọc bằng Workers Logs / `wrangler tail` (không ghi D1). */
const NHAT_KY_TIENG_MS = 10_000
/** Một máy ⇒ mảng gọn: [máy, connectionState, ICE, đường, kb/s nhận, năng lượng nhận, thẻ dừng, currentTime tăng, tắt tiếng, âm lượng, kb/s mic gửi, mức mic, tiếng, mic]. */
const ngan = (s: string, t: SoTieng | null): unknown[] => [s, t?.cs ?? '-', t?.ice ?? '-', t?.uv ?? '', t?.n?.kb ?? null, t?.n?.nl ?? null, t?.n?.pt?.d ?? null, t?.n?.pt?.ct ?? null, t?.n?.pt?.m ?? null, t?.n?.pt?.v ?? null, t?.g?.kb ?? null, t?.g?.muc ?? null, t?.tg ?? '', t?.mc ?? '']
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
  /** Bản đo tiếng gần nhất của máy thầy + lúc ghi nhật ký gần nhất. */
  private tiThay: SoTieng | null = null
  private lucNhatKy = 0
  private lucLuuNhip = 0
  private giayLo = 0
  private soLo = 0
  private lucGoiXa = 0
  private soNk = 0
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
  demXem(st: TrangThaiPhong, kem?: (KemBpu | null)[]): { xem: number; ws: number; nghe: number } {
    const l = st.live
    if (!l?.bat) return { xem: 0, ws: 0, nghe: 0 }
    const ds = kem ?? this.chu.ctx.getWebSockets('hs').map((ws) => this.kem(ws))
    const xem = new Set<string>(), canWs = new Set<string>(), nghe = new Set<string>()
    for (const a of ds) if (a && a.s && a.x === l.phien && !st.roiNay?.includes(a.s)) { xem.add(a.s); if (a.d === 1) canWs.add(a.s); if (a.n === 1) nghe.add(a.s) }
    return { xem: xem.size, ws: canWs.size, nghe: nghe.size }
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
    if (l.bat) this.chu.xl?.khung(k, nay) // Xem lại Live: nhật ký nét chỉ-nối
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
        if (doi) { this.doEm.clear(); this.boDs(); this.lucLuuNhip = nay; if (this.chu.xl) this.chu.xl.bat(await this.docSo(st), nay) } else this.gui(ws, JSON.stringify({ t: 'live-kq', lenh: 'bat', ok: false, lyDo: l.bat ? 'dang-live' : 'tat' }))
      } else if (t === 'live-tat') { doi = this.tat(st, nay) }
      else if (t === 'live-dat') {
        const xaTruoc = l.xa
        doi = LL.liveDat(st, { xa: j.xa, tiengLop: j.tiengLop, bang: j.bang, giay: j.giay, nghi: j.nghi, khoi: j.khoi }, nay)
        if (j.luat !== undefined && LU.datLuat(st, j.luat, nay)) doi = true // luật «rời màn N lần ⇒ mời ra» (13/11)
        if (l.xa && !xaTruoc) this.goiXa(st, nay) // vừa bật «Cho em ở xa vào xem» ⇒ gọi máy các em ở xa
      }
      else if (t === 'live-ghi') doi = !!this.chu.xl?.tinGhi(st, j, nay)
      else if (t === 'live-do') { this.tiThay = sachTieng(j.ti); this.nhatKyTieng(st, nay) } // Xem lại Live: máy ghi báo trạng thái + mẫu đồng hồ
      // ĐỢT 2 (đặc tả 4.8): thầy «Thu mic» (một em) / «Tắt mic tất cả» · «Mời nói» · «Hạ hết tay» / hạ tay một em. Phòng gỡ + đóng track ở SFU khi phát view.
      else if (t === 'live-thu-mic') doi = LL.liveThu(st, nay, typeof j.sbd === 'string' && j.sbd ? j.sbd : undefined)
      else if (t === 'live-moi') doi = LL.liveMoi(st, String(j.sbd ?? ''), nay)
      else if (t === 'live-ha-tay') doi = LL.liveHaTay(st, nay, typeof j.sbd === 'string' && j.sbd ? j.sbd : undefined)
      else if (t === 'live-luat-duyet') doi = LU.luatDuyet(st, String(j.sbd ?? ''), j.ok === true, nay) // thầy «Duyệt» / «Từ chối» em xin vào lại
      else if (t === 'live-nhip') {
        LL.liveNhip(st, nay)
        if (l.bat && l.xa && nay - this.lucGoiXa > NHIP_GOI_XA_MS) this.goiXa(st, nay)
        // Nhịp chỉ ghi storage thưa (1 phút / lần) ⇒ phòng ngủ rồi thức lại không tự tắt nhầm live đang chạy.
        if (l.bat && nay - this.lucLuuNhip > NHIP_LUU_MS) { this.lucLuuNhip = nay; await this.chu.luu(false) }
      }
      if (doi) { if (t === 'live-san') this.boDs(); if (t === 'live-bat' && l.xa) this.goiXa(st, nay); await this.chu.luu(true); this.chu.phat() }
      return true
    }
    if (!a.s) return true
    if (t === 'live-luat-xin') { if (LU.luatXin(st, a.s, nay)) { await this.chu.luu(false); this.chu.phat() } return true } // em bị mời ra bấm «Xin vào lại»
    if (t === 'live-bu') { await this.guiBu(st, ws, j.net); return true }
    // Em tự tắt mic (bấm «Xong, tắt mic», mất quyền mic): chỉ gỡ được mic / lời mời của CHÍNH mình.
    if (t === 'live-mic-tat') { if (LL.liveEmTatMic(st, a.s, nay)) { await this.chu.luu(false); this.chu.phat() } return true }
    // ĐỢT 2: em giơ / hạ tay · «Để sau» · máy em không bật được mic. Mọi lệnh chỉ đụng tới CHÍNH em (sbd lấy từ vé, không từ tin).
    if (t === 'live-tay' || t === 'live-de-sau' || t === 'live-mic-loi') {
      const doi = t === 'live-tay' ? LL.liveTay(st, a.s, j.v !== false, nay) : t === 'live-de-sau' ? LL.liveDeSau(st, a.s, nay) : LL.liveMicLoi(st, a.s, j.ly, nay)
      if (doi) { await this.chu.luu(false); this.chu.phat() }
      return true
    }
    if (await this.tuTat(st, nay)) return true
    if (t === 'live-ok') {
      if (!l.bat || !LL.duocXemLive(st, a.s)) return true
      const d: 0 | 1 = j.dc === true ? 0 : 1, n: 0 | 1 = j.nghe === true ? 1 : 0
      if (a.x === l.phien && a.d === d && (a.n ?? 0) === n) return true
      a.x = l.phien; a.d = d; a.n = n
      ws.serializeAttachment(a)
      // Cập nhật danh sách nhận điểm tại chỗ (không dựng lại cả danh sách cho mỗi em báo).
      if (this.dsDiem) { const i = this.dsDiem.indexOf(ws); if (d === 1 && i < 0) this.dsDiem.push(ws); else if (d === 0 && i >= 0) this.dsDiem.splice(i, 1) }
      this.henBaoXem()
      return true
    }
    if (t === 'live-do') {
      if (!l.bat || a.x !== l.phien) return true
      this.doEm.set(a.s, { luc: nay, d: so(j.d, 2000), j: so(j.j, 5000), m: so(j.m, 60_000), rtt: so(j.rtt, 10_000), tt: so(j.tt, 10_000), dc: j.dc === true, gl: j.gl === true, ti: sachTieng(j.ti) })
      this.nhatKyTieng(st, nay)
      if (nay - this.lucGuiDo >= NHIP_DO_MS) { this.lucGuiDo = nay; this.guiThay(JSON.stringify({ t: 'live-do', ...this.gomDo(nay) })) }
      return true
    }
    return true
  }
  /** Nhật ký máy chủ ≤ 1 dòng / 10 giây khi đang live: máy thầy + mọi máy em báo trong 30 giây qua (dạng gọn `ngan`). Không ghi storage / D1. */
  private nhatKyTieng(st: TrangThaiPhong, nay: number): void {
    if (!st.live?.bat || nay - this.lucNhatKy < NHAT_KY_TIENG_MS) return
    this.lucNhatKy = nay
    const em = [...this.doEm].filter(([, x]) => nay - x.luc <= 30_000).slice(0, 300).map(([s, x]) => ngan(s, x.ti))
    console.log(JSON.stringify({ live_tieng: { b: st.buoiId, p: st.live.phien, thay: ngan('GV', this.tiThay), em } }))
  }
  /** Gộp số đo các máy em báo trong 30 giây gần nhất (trung vị + p95 giữa các em). Chỉ trong bộ nhớ. */
  gomDo(nay: number) {
    const ds = [...this.doEm.values()].filter((x) => nay - x.luc <= 30_000)
    // Đo tiếng từ xa: bản mới nhất của từng máy em (máy thầy hiện một dòng gọn cho mỗi em).
    const may = [...this.doEm].filter(([, x]) => nay - x.luc <= 30_000 && x.ti).slice(0, 300).map(([s, x]) => ({ s, ti: x.ti }))
    // `giayLech` = số máy em báo giấy đề xuống dòng KHÁC giấy của thầy (rủi ro R3) ⇒ máy đó đang ẩn nét trên giấy.
    return { so: ds.length, dc: ds.filter((x) => x.dc).length, giayLech: ds.filter((x) => x.gl).length, d: tomTat(ds.map((x) => x.d)), jitter: tomTat(ds.map((x) => x.j)), muon: tomTat(ds.map((x) => x.m)), rtt: tomTat(ds.map((x) => x.rtt)), tieng: tomTat(ds.map((x) => x.tt)), may }
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
  async dong(ws?: WsMayChu): Promise<void> {
    const a = ws ? this.kem(ws) : null
    if (ws) { this.vai.delete(ws); for (const ds of [this.dsHs, this.dsDiem]) { const i = ds ? ds.indexOf(ws) : -1; if (i >= 0) ds!.splice(i, 1) } }
    else this.boDs()
    const st = this.chu.nho() ?? (a?.v === 'hs' ? await this.chu.doc() : null)
    if (!st?.live?.bat) return
    // Em đang phát mic mất kết nối (không còn kết nối nào khác của em) ⇒ thu mic.
    if (a?.v === 'hs' && a.s && st.live.mic?.sbd === a.s && !this.chu.ctx.getWebSockets('hs').some((w) => w !== ws && this.kem(w).s === a.s) && LL.liveThuMic(st, Date.now(), a.s)) { await this.chu.luu(false); this.chu.phat(); return }
    this.henBaoXem()
  }
  // ── ĐỢT 2: EM Ở XA + NHẬT KÝ ĐÀM THOẠI ──
  /** Gọi máy các em Ở XA (thuộc lớp, chưa điểm danh, chưa nối phòng) qua kênh đẩy ⇒ máy em mở màn và xin vé «em ở xa». 0 lệnh D1. */
  private goiXa(st: TrangThaiPhong, nay: number): void {
    this.lucGoiXa = nay
    if (!this.chu.bao || !st.live?.xa) return
    const daNoi = new Set(this.chu.ctx.getWebSockets('hs').map((ws) => this.kem(ws).s))
    const ds = st.ds.filter((e) => !e.vao && !daNoi.has(e.sbd)).map((e) => e.sbd)
    if (ds.length) this.chu.bao(ds)
  }
  /** Phòng gọi mỗi lần phát view: rút nhật ký đàm thoại chờ ghi (ai giơ tay, được mời, nói từ giờ nào tới giờ nào, bị thu mic) vào KHO CỦA PHÒNG —
   *  mỗi lần một khoá riêng, không đọc lại sổ, không D1. Lỗi ghi ⇒ bỏ qua (không làm hỏng việc phát view). */
  ghiNhatKy(st: TrangThaiPhong): void {
    const ds = LL.rutNhatKy(st)
    if (!ds.length) return
    const khoa = `nk:${String(ds[0]!.luc).padStart(14, '0')}:${String(this.soNk++ % 1000).padStart(3, '0')}`
    this.chu.ctx.waitUntil(this.chu.ctx.storage.put(khoa, ds).catch(() => undefined))
  }
  /** Đọc nhật ký đàm thoại của buổi (theo thứ tự giờ). */
  async docNhatKy(): Promise<LL.MucNhatKy[]> {
    const m = await this.chu.ctx.storage.list<LL.MucNhatKy[]>({ prefix: 'nk:', limit: NK_DOC_TOI_DA })
    const ra: LL.MucNhatKy[] = []
    for (const ds of m.values()) if (Array.isArray(ds)) ra.push(...ds)
    return ra
  }
  /** Có kết nối mới vào phòng ⇒ bỏ danh sách giữ sẵn (lần gửi kế dựng lại, có máy mới). */
  noiMoi(): void { this.boDs() }
  /** Buổi kết thúc: ghi nốt sổ nét. */
  async ketThuc(): Promise<void> { this.boDs(); await this.luuSo() }
}
