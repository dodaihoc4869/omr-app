// KÊNH LỚP của Live theo khối (12/11; hợp đồng src/lib/live-khoi/kieu.ts): CHAT cả lớp + trò SINH TỒN ở phòng chờ (có máy bù chỗ) + danh sách bốn đội.
// Phòng chỉ CHUYỂN TIẾP trong bộ nhớ: 0 D1, 0 storage. Phòng ngủ rồi thức lại ⇒ mất chat cũ / ảnh trò (chấp nhận — đặc tả mục 4).
// Bước ghép đợt 4 (Sinh Tồn bản 2): NGOÀI vòng nhịp, qua `du` tiêm từ Durable Object — (1) đồ + danh hiệu tuần của em đọc MỘT lô lúc em vào phòng, gắn vào
// `lop-ds` ([sbd, tên, đội, kJ, mã đồ gọn?, danh hiệu?]); (2) thống kê trò ghi D1 theo LÔ (mỗi GHI_MOI_VAN ván + lúc trò dừng), không chờ. Đội trong trận vẫn đội BPU.
import type { DurableObjectState, WsMayChu } from './kieu'
import type { KemBpu } from './phong-live'
import { diemDoi, type TrangThaiPhong } from '../../src/lib/bpu/phong'
import { CHAT_DAI, CHAT_NHIP_MS, type TinLop } from '../../src/lib/live-khoi/kieu'
import { GHI_MOI_VAN, MaySinhTon, TRO_NHIP_MS } from './sinh-ton-may-chu'
import type { NoiDuLieuSt } from './sinh-ton-du-lieu'
import type { DoEm } from '../../src/lib/live-khoi/tu-do'

type Row = Record<string, unknown>
const CHAT_GIU = 200
const kep = (v: unknown, tu: number, den: number): number | null => { const n = Math.round(Number(v)); return Number.isFinite(n) ? Math.min(den, Math.max(tu, n)) : null }

export class KenhLopMay {
  private chat: TinLop[] = []
  private khoa = false
  private lucChat = new Map<string, number>()
  private lucHieu = new Map<string, number>()
  /** Trò Sinh Tồn ở phòng chờ: máy trò dùng chung với phòng chờ ca kiểm tra (sinh-ton-may-chu.ts); lớp này chỉ lo hẹn giờ + phát tin. */
  private tro: MaySinhTon
  private hen: ReturnType<typeof setTimeout> | null = null
  /** Kết nối máy em ⇒ số báo danh (ghi lúc em gửi gói trò) — «chỉ gửi gần» cần biết mỗi kết nối là em nào; chưa biết ⇒ đọc dữ liệu gắn kết nối. */
  private sbdWs = new WeakMap<WsMayChu, string>()
  private dauDs = ''
  /** Đồ + danh hiệu của em đã đọc (xoá khi em rời phòng ⇒ lần vào sau đọc lại, có đồ mới mặc); `dangDoc` = đang chờ lô đọc. */
  private doEm = new Map<string, DoEm>()
  private dangDoc = new Set<string>()
  private henDs: ReturnType<typeof setTimeout> | null = null
  /** Mã buổi của trò đang chạy (mã phòng khi ghi thống kê — trò có thể dừng lúc trạng thái phòng đã rời bộ nhớ). */
  private maBuoi = ''
  constructor(private ctx: DurableObjectState, private nho: () => TrangThaiPhong | null | undefined, private du?: NoiDuLieuSt) {
    // Máy bù mang tên như học sinh: tránh tên MỌI em trong danh sách lớp (cả em chưa vào — em vắng không thấy «mình» đang chơi).
    this.tro = new MaySinhTon(Math.random, () => (this.nho()?.ds ?? []).map((e) => e.ten))
  }

  private gui(ws: WsMayChu, d: string): void { try { ws.send(d) } catch { /* kết nối vừa đóng */ } }
  private sbdCua(ws: WsMayChu): string {
    let s = this.sbdWs.get(ws)
    if (s === undefined) {
      try { const a = ws.deserializeAttachment?.() as KemBpu | null | undefined; s = a?.v === 'hs' && typeof a.s === 'string' ? a.s : '' } catch { s = '' }
      this.sbdWs.set(ws, s)
    }
    return s
  }
  private moiMay(d: string, caThay = true): void {
    for (const ws of this.ctx.getWebSockets('hs')) this.gui(ws, d)
    if (caThay) for (const ws of this.ctx.getWebSockets('gv')) this.gui(ws, d)
  }
  /** Danh sách em ĐÃ VÀO + kJ bốn đội — máy em dựng màn «Bốn đội», gắn tên / đội cho đốm trong trò. */
  dsLop(st: TrangThaiPhong): string {
    const dong = (e: TrangThaiPhong['ds'][number]) => {
      const d = this.doEm.get(e.sbd)
      return !d || (!d.c && d.dh < 0) ? [e.sbd, e.ten, e.doi, e.kj] : d.dh < 0 ? [e.sbd, e.ten, e.doi, e.kj, d.c] : [e.sbd, e.ten, e.doi, e.kj, d.c, d.dh]
    }
    return JSON.stringify({ t: 'lop-ds', ds: st.ds.filter((e) => e.vao).map(dong), kj: [0, 1, 2, 3].map((d) => diemDoi(st, d)) })
  }
  /** Em mới vào ⇒ xin đồ + danh hiệu (gom lô ở `du`); em rời ⇒ quên (vào lại thì đọc lại). Đọc xong ⇒ phát lại danh sách một lần (cả máy thầy: máy chiếu thấy đồ). */
  private soatDo(st: TrangThaiPhong): void {
    if (!this.du) return
    const co = new Set<string>()
    for (const e of st.ds) {
      if (!e.vao) continue
      co.add(e.sbd)
      if (this.doEm.has(e.sbd) || this.dangDoc.has(e.sbd)) continue
      this.dangDoc.add(e.sbd)
      void this.du.doc(e.sbd).catch(() => null).then((d) => {
        this.dangDoc.delete(e.sbd)
        this.doEm.set(e.sbd, d ?? { c: '', dh: -1 })
        if (d && (d.c || d.dh >= 0)) this.henDs ??= setTimeout(() => { this.henDs = null; const s = this.nho(); if (s?.live?.khoi && !s.ketThuc) this.moiMay(this.dsLop(s)) }, 30)
      })
    }
    for (const s of this.doEm.keys()) if (!co.has(s)) this.doEm.delete(s)
  }
  /** Ghi thống kê trò theo LÔ (không chờ — `du.ghi` dùng waitUntil; lỗi D1 không chạm phòng). */
  private ghiTk(): void {
    const ds = this.tro.layThongKe()
    if (ds.length && this.du && this.maBuoi) this.du.ghi(this.maBuoi, ds)
  }
  /** Gọi mỗi lần phòng phát view: sĩ số / đội đổi ⇒ phát lại danh sách (chỉ khi là buổi live theo khối). */
  soatDs(st: TrangThaiPhong): void {
    if (!st.live?.khoi) return
    // Kết thúc buổi ⇒ phát MỘT lần danh sách + kJ chốt để máy em dựng màn vinh danh.
    const dau = st.ketThuc ? 'xong' : st.ds.map((e) => (e.vao ? `${e.sbd}:${e.doi}` : '')).join(',')
    if (dau === this.dauDs) return
    this.dauDs = dau
    if (!st.ketThuc) this.soatDo(st)
    this.moiMay(this.dsLop(st), this.doEm.size > 0)
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
      if (!(st.live.khoi.gd === 'cho' || st.live.khoi.giaiLao)) return true
      // THẦY VÀO TRẬN (đợt 3): vai Thầy theo VAI KẾT NỐI (`gv`), không theo cờ trong gói ⇒ máy em không giả làm Thầy được. Chỉ có ở phòng live.
      if (thay) { this.tro.nhanThay(x, nay); if (!this.hen && this.tro.soEm) this.hen = setTimeout(() => this.nhipTro(), TRO_NHIP_MS); return true }
      this.sbdWs.set(ws, a.s)
      this.maBuoi = st.buoiId
      this.tro.nhan(a.s, e!.doi, x, nay)
      if (!this.hen && this.tro.soEm) this.hen = setTimeout(() => this.nhipTro(), TRO_NHIP_MS)
      return true
    }
    return true
  }
  private nhipTro(): void {
    this.hen = null
    const st = this.nho(), nay = Date.now()
    if (!st || st.ketThuc || !(st.live?.khoi?.gd === 'cho' || st.live?.khoi?.giaiLao)) { this.tro.dung(); this.ghiTk(); return } // trò chạy ở phòng chờ và lúc nghỉ giải lao
    const anh = this.tro.nhip(nay)
    if (!anh) { this.ghiTk(); return } // hết em thật trên sân ⇒ trò dừng ⇒ ghi
    if (this.tro.vanChoGhi >= GHI_MOI_VAN) this.ghiTk()
    // «Chỉ gửi gần»: máy thầy nhận ảnh đủ; mỗi máy em chỉ nhận phần quanh mình (em chưa lên sân / không rõ là ai ⇒ ảnh đủ).
    const goi = this.tro.goi(anh, nay)
    for (const ws of this.ctx.getWebSockets('hs')) {
      const s = this.sbdCua(ws)
      this.gui(ws, s ? goi.cho(s) : goi.du())
    }
    const gvWs = this.ctx.getWebSockets('gv')
    if (gvWs.length) { const du = goi.du(); for (const ws of gvWs) this.gui(ws, du) }
    this.hen = setTimeout(() => this.nhipTro(), TRO_NHIP_MS)
  }
}
