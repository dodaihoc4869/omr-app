// KÊNH LỚP của Live theo khối (12/11; hợp đồng src/lib/live-khoi/kieu.ts): CHAT cả lớp + trò SINH TỒN ở phòng chờ (có máy bù chỗ) + danh sách bốn đội.
// Phòng chỉ CHUYỂN TIẾP trong bộ nhớ: 0 D1, 0 storage. Phòng ngủ rồi thức lại ⇒ mất chat cũ / ảnh trò (chấp nhận — đặc tả mục 4).
import type { DurableObjectState, WsMayChu } from './kieu'
import type { KemBpu } from './phong-live'
import { diemDoi, type TrangThaiPhong } from '../../src/lib/bpu/phong'
import { CHAT_DAI, CHAT_NHIP_MS, type SinhTonDong, type TinLop } from '../../src/lib/live-khoi/kieu'
import { CAP_TOI_DA, MAU_DAY, capBanDo, dangNghi, hopSo, laMay, taoBanDo, vanSo, type BanDo, type NhanVat } from '../../src/lib/live-khoi/sinh-ton-loi'
import { buocMay, khopMay, mayLenCap, mayThanh, type May } from '../../src/lib/live-khoi/sinh-ton-may'

type Row = Record<string, unknown>
const CHAT_GIU = 200
const TRO_NHIP_MS = 250
const TRO_GUI_MS = 180
const TRO_IM_MS = 5000
/** Một em chỉ được báo «bị hạ» mỗi 2,5 giây (hồi sinh mất 3 giây) — chặn báo lặp. */
const TRO_HA_MS = 2500
const kep = (v: unknown, tu: number, den: number): number | null => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(den, Math.max(tu, n)) : null }

export class KenhLopMay {
  private chat: TinLop[] = []
  private khoa = false
  private lucChat = new Map<string, number>()
  private lucHieu = new Map<string, number>()
  private tro = new Map<string, { p: SinhTonDong; luc: number; gui: number; ha: number }>()
  private an: [string, string][] = []
  private may: May[] = []
  private diem: [number, number, number, number] = [0, 0, 0, 0]
  private van = -1
  /** Số thứ tự ván kể từ lúc trò bắt đầu ở phòng này (hiện trên màn: «Ván 2»). */
  private soVan = 0
  private bd: BanDo = taoBanDo(0)
  private hop: [number, string] = [-1, '']
  private lucNhip = 0
  private hen: ReturnType<typeof setTimeout> | null = null
  private dauDs = ''
  constructor(private ctx: DurableObjectState, private nho: () => TrangThaiPhong | null | undefined) {}

  private gui(ws: WsMayChu, d: string): void { try { ws.send(d) } catch { /* kết nối vừa đóng */ } }
  private moiMay(d: string, caThay = true): void {
    for (const ws of this.ctx.getWebSockets('hs')) this.gui(ws, d)
    if (caThay) for (const ws of this.ctx.getWebSockets('gv')) this.gui(ws, d)
  }
  /** Danh sách em ĐÃ VÀO + kJ bốn đội — máy em dựng màn «Bốn đội», gắn tên / đội cho đốm trong trò. */
  dsLop(st: TrangThaiPhong): string {
    return JSON.stringify({ t: 'lop-ds', ds: st.ds.filter((e) => e.vao).map((e) => [e.sbd, e.ten, e.doi, e.kj]), kj: [0, 1, 2, 3].map((d) => diemDoi(st, d)) })
  }
  /** Gọi mỗi lần phòng phát view: sĩ số / đội đổi ⇒ phát lại danh sách (chỉ khi là buổi live theo khối). */
  soatDs(st: TrangThaiPhong): void {
    if (!st.live?.khoi) return
    // Kết thúc buổi ⇒ phát MỘT lần danh sách + kJ chốt để máy em dựng màn vinh danh.
    const dau = st.ketThuc ? 'xong' : st.ds.map((e) => (e.vao ? `${e.sbd}:${e.doi}` : '')).join(',')
    if (dau === this.dauDs) return
    this.dauDs = dau
    this.moiMay(this.dsLop(st), false)
  }
  /** Tin `lop` / `lop-xin`. Trả true nếu là tin của kênh lớp (đã xử lý hoặc đã bỏ). */
  tin(ws: WsMayChu, a: KemBpu, j: Row, st: TrangThaiPhong, nay: number): boolean {
    if (j.t === 'lop-xin') { this.gui(ws, this.dsLop(st)); return true }
    if (j.t !== 'lop') return false
    if (!st.live?.khoi || st.ketThuc) return true
    const x = (j.x ?? null) as Row | null
    if (!x || typeof x !== 'object') return true
    const thay = a.v === 'gv', e = thay ? null : st.ds.find((h) => h.sbd === a.s)
    // MÁY TÍNH của thầy (12/11): chỉ thầy gửi; phòng chuyển tiếp nguyên gói cho mọi máy em, không nhớ gì (máy thầy tự nhắc lại mỗi 4 giây cho em vào muộn).
    // HỎI NHANH «Hiểu chưa?» (thầy 12/11, phím /): thầy mở / đóng ⇒ chuyển tiếp cho mọi máy em; em trả lời 1 (hiểu) / 2 (chưa hiểu) ⇒ phòng đóng dấu tên rồi
    // chỉ gửi cho MÁY THẦY (bạn khác không thấy ai chưa hiểu). Không nhớ gì, 0 D1; mỗi em tối đa một tin mỗi 400 ms.
    if (j.k === 'hieu') {
      if (thay) { const d = JSON.stringify({ t: 'lop', k: 'hieu', s: 'gv', n: '', d: -1, l: nay, x: { mo: x.mo === true, n: kep(x.n, 0, 2e9) ?? 0 } }); this.moiMay(d, false) }
      else if (e && (x.v === 1 || x.v === 2) && nay - (this.lucHieu.get(a.s) ?? 0) >= 400) {
        this.lucHieu.set(a.s, nay)
        const d = JSON.stringify({ t: 'lop', k: 'hieu', s: a.s, n: e.ten, d: e.doi, l: nay, x: { v: x.v, n: kep(x.n, 0, 2e9) ?? 0 } })
        for (const ws of this.ctx.getWebSockets('gv')) this.gui(ws, d)
      }
      return true
    }
    if (j.k === 'mt') { if (thay) { const d = JSON.stringify({ t: 'lop', k: 'mt', s: 'gv', n: '', d: -1, l: nay, x }); if (d.length <= 8000) this.moiMay(d, false) } return true }
    if (!thay && (!e || !e.vao || a.xa)) return true
    if (j.k === 'chat') {
      if (x.xin === 1) { for (const t of this.chat) this.gui(ws, JSON.stringify({ t: 'lop', ...t })); if (this.khoa) this.gui(ws, JSON.stringify({ t: 'lop', k: 'chat', s: 'gv', n: '', d: -1, l: nay, x: { tat: true } })); return true }
      if (thay && typeof x.tat === 'boolean') { this.khoa = x.tat; this.moiMay(JSON.stringify({ t: 'lop', k: 'chat', s: 'gv', n: '', d: -1, l: nay, x: { tat: x.tat } })); return true }
      const c = typeof x.c === 'string' ? x.c.replace(/\s+/g, ' ').trim().slice(0, CHAT_DAI) : ''
      if (!c) return true
      if (!thay) {
        if (this.khoa || nay - (this.lucChat.get(a.s) ?? 0) < CHAT_NHIP_MS) return true
        this.lucChat.set(a.s, nay)
      }
      // Giờ phòng tăng nghiêm ngặt ⇒ `l` + `s` là khoá khử trùng ở máy nhận.
      const l = Math.max(nay, (this.chat[this.chat.length - 1]?.l ?? 0) + 1)
      const tin: TinLop = { k: 'chat', s: thay ? 'gv' : a.s, n: thay ? 'Thầy' : e!.ten, d: thay ? -1 : e!.doi, l, x: { c } }
      this.chat.push(tin)
      if (this.chat.length > CHAT_GIU) this.chat.splice(0, this.chat.length - CHAT_GIU)
      this.moiMay(JSON.stringify({ t: 'lop', ...tin }))
      return true
    }
    if (j.k === 'tro') {
      if (thay || st.live.khoi.gd !== 'cho') return true
      const cu = this.tro.get(a.s)
      if (cu && nay - cu.gui < TRO_GUI_MS) return true
      const p = Array.isArray(x.p) ? x.p : [], px = kep(p[0], 0, this.bd.rong), py = kep(p[1], 0, this.bd.cao), mau = kep(p[2], 0, MAU_DAY), cap = kep(p[3], 1, CAP_TOI_DA)
      if (px == null || py == null || mau == null || cap == null) return true
      const doi = e!.doi
      // Mục tiêu khai phải có thật và khác đội; kẻ hạ cũng vậy.
      const doiCua = (id: unknown): number => (typeof id !== 'string' || id === a.s ? -1 : this.tro.get(id)?.p[3] ?? this.may.find((m) => m.id === id)?.doi ?? -1)
      const dt = doiCua(x.t)
      const moi = { p: [px, py, mau, doi, cap, dt >= 0 && dt !== doi ? (x.t as string) : ''] as SinhTonDong, luc: nay, gui: nay, ha: cu?.ha ?? 0 }
      this.tro.set(a.s, moi)
      const da = doiCua(x.a)
      if (da >= 0 && da !== doi && nay - moi.ha >= TRO_HA_MS && !dangNghi(nay) && this.an.length < 60) {
        moi.ha = nay
        this.ghiHa(x.a as string, a.s, da)
      }
      // Hộp tiếp tế: em chạm đầu tiên của mỗi hộp được nhận.
      if (typeof x.h === 'number' && x.h === hopSo(nay) && this.hop[0] !== x.h && mau > 0 && !dangNghi(nay)) this.hop = [x.h, a.s]
      if (!this.hen) { this.lucNhip = nay; this.hen = setTimeout(() => this.nhipTro(), TRO_NHIP_MS) }
      return true
    }
    return true
  }
  private ghiHa(ai: string, bi: string, doiAi: number): void {
    this.an.push([ai, bi])
    this.diem[doiAi]++
    if (laMay(ai)) { const m = this.may.find((v) => v.id === ai); if (m) mayLenCap(m) }
  }
  private dungTro(): void { this.tro.clear(); this.an = []; this.may = []; this.van = -1; this.soVan = 0; this.diem = [0, 0, 0, 0]; this.hop = [-1, ''] }
  private nhipTro(): void {
    this.hen = null
    const st = this.nho(), nay = Date.now()
    for (const [s, v] of this.tro) if (nay - v.luc > TRO_IM_MS) this.tro.delete(s)
    if (!st || st.ketThuc || st.live?.khoi?.gd !== 'cho' || !this.tro.size) { this.dungTro(); return }
    // Ván mới: xoá điểm, chọn cỡ bản đồ theo sĩ số, máy về trại.
    const van = vanSo(nay)
    const soEm = [0, 0, 0, 0]
    for (const v of this.tro.values()) soEm[v.p[3]]++
    if (van !== this.van) {
      // Ván ĐẦU (trò vừa bắt đầu) giữ lượt hạ đã ghi trước nhịp đầu; các ván sau xoá điểm.
      if (this.van !== -1) { this.diem = [0, 0, 0, 0]; this.an = [] }
      this.van = van; this.soVan++; this.may = []
      this.bd = taoBanDo(capBanDo(soEm.reduce((t, n) => t + Math.max(4, n), 0)))
    }
    this.may = khopMay(this.bd, this.may, soEm, nay, Math.random)
    const that: NhanVat[] = []
    for (const [s, v] of this.tro) that.push({ id: s, x: v.p[0], y: v.p[1], mau: v.p[2], doi: v.p[3], cap: v.p[4], t: v.p[5] })
    const dt = Math.min(1000, Math.max(0, nay - this.lucNhip))
    this.lucNhip = nay
    const anhMay = this.may.map(mayThanh)
    for (let i = 0; i < this.may.length; i++) {
      const m = this.may[i], khac = that.concat(anhMay.filter((_, k) => k !== i))
      const ai = buocMay(this.bd, m, khac, nay, dt, Math.random)
      if (ai) { const k = khac.find((n) => n.id === ai); if (k) this.ghiHa(ai, m.id, k.doi) }
    }
    const ds: Record<string, SinhTonDong> = {}
    for (const [s, v] of this.tro) ds[s] = v.p
    for (const m of this.may) ds[m.id] = [Math.round(m.x), Math.round(m.y), Math.round(m.mau), m.doi, m.cap, m.t]
    this.moiMay(JSON.stringify({ t: 'lop', k: 'tro', s: '', n: '', d: -1, l: nay, x: { ds, an: this.an, d: this.diem, v: this.soVan, c: this.bd.cap, h: this.hop } }))
    this.an = []
    this.hen = setTimeout(() => this.nhipTro(), TRO_NHIP_MS)
  }
}
