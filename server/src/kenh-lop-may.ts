// KÊNH LỚP của Live theo khối (12/11; hợp đồng src/lib/live-khoi/kieu.ts): CHAT cả lớp + trò GIỮ LỬA ở phòng chờ + danh sách bốn đội.
// Phòng chỉ CHUYỂN TIẾP trong bộ nhớ: 0 D1, 0 storage. Phòng ngủ rồi thức lại ⇒ mất chat cũ / ảnh trò (chấp nhận — đặc tả mục 4).
import type { DurableObjectState, WsMayChu } from './kieu'
import type { KemBpu } from './phong-live'
import { diemDoi, type TrangThaiPhong } from '../../src/lib/bpu/phong'
import { CHAT_DAI, CHAT_NHIP_MS, SAN_CAO, SAN_RONG, type TinLop } from '../../src/lib/live-khoi/kieu'

type Row = Record<string, unknown>
const CHAT_GIU = 200
const TRO_NHIP_MS = 250
const TRO_GUI_MS = 180
const TRO_IM_MS = 5000
const kep = (v: unknown, tu: number, den: number): number | null => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(den, Math.max(tu, n)) : null }

export class KenhLopMay {
  private chat: TinLop[] = []
  private khoa = false
  private lucChat = new Map<string, number>()
  private tro = new Map<string, { p: [number, number, number, number]; luc: number; gui: number }>()
  private an: [string, string, number][] = []
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
      const p = Array.isArray(x.p) ? x.p : [], px = kep(p[0], 0, SAN_RONG), py = kep(p[1], 0, SAN_CAO), m = kep(p[2], 10, 400)
      if (px == null || py == null || m == null) return true
      this.tro.set(a.s, { p: [px, py, m, e!.doi], luc: nay, gui: nay })
      // Máy BỊ thu phục tự báo; chỉ nhận khi đốm kia có thật, khác đội.
      const an = typeof x.a === 'string' ? this.tro.get(x.a) : null
      if (an && an.p[3] !== e!.doi && this.an.length < 40) this.an.push([x.a as string, a.s, cu?.p[2] ?? m])
      if (!this.hen) this.hen = setTimeout(() => this.nhipTro(), TRO_NHIP_MS)
      return true
    }
    return true
  }
  private nhipTro(): void {
    this.hen = null
    const st = this.nho(), nay = Date.now()
    for (const [s, v] of this.tro) if (nay - v.luc > TRO_IM_MS) this.tro.delete(s)
    if (!st || st.ketThuc || st.live?.khoi?.gd !== 'cho' || !this.tro.size) { this.tro.clear(); this.an = []; return }
    const ds: Record<string, [number, number, number, number]> = {}
    for (const [s, v] of this.tro) ds[s] = v.p
    this.moiMay(JSON.stringify({ t: 'lop', k: 'tro', s: '', n: '', d: -1, l: nay, x: { ds, an: this.an } }))
    this.an = []
    this.hen = setTimeout(() => this.nhipTro(), TRO_NHIP_MS)
  }
}
