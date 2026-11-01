// DURABLE OBJECT `PhongDauIon` — một phòng đấu «Đấu Nguyên Tử» cho MỘT ca (idFromName(`dau-ion:<mã ca>`), gợi ý vị trí châu Á – Thái Bình Dương).
// WebSocket Hibernation: phòng chỉ thức khi có việc (sân đang chạy, ghế đang giữ cho em rớt mạng); sảnh yên thì ngủ, kết nối vẫn giữ
// (dữ liệu nhỏ của từng em gắn trên kết nối). Ping `{"t":"ping"}` được trả `{"t":"pong"}` tự động, không đánh thức phòng.
// Luật nằm ở dau-ion-phong.ts (test được không cần Cloudflare). 0 lệnh D1. Lớp SQLite (migration `dau-ion-v1`) nhưng không lưu gì.
// GIAO THỨC CÓ PHIÊN BẢN (31/10, Đấu Nguyên Tử 2): gói `vao` phải mang `v: PHIEN_BAN`; máy còn mảnh game cũ trong bộ nhớ đệm ⇒ đóng sạch mã 4010
// (máy cũ hiểu là «sảnh chưa mở», không nối lại) thay vì nhận ảnh trận nó không đọc được. Kết nối gắn dữ liệu bản cũ khi phòng thức dậy ⇒ cũng đóng 4010.
// 3 ĐẤU 3 (01/11): ca đông chia nhiều phòng — phòng số k (header `x-phong-so`, 0…7) đầy ⇒ đóng 4009 «sang:k+1», máy em tự nối phòng kế.
// Vòng 20 lần/giây gọi `nhip()` (bước theo ĐỒNG HỒ THẬT, bộ tích luỹ) thay cho `buoc()` cố định.
import type { DurableObjectState, Env, WsMayChu } from './kieu'
import { BUOC } from '../../src/lib/dau-ion/loi'
import { CHU_BAN_CU, MA_DONG, PHIEN_BAN, PhongDau, type KemNguoi, type KetNoi } from './dau-ion-phong'
import { kiemVeDau } from './dau-ion-ve'

declare const WebSocketPair: { new (): { 0: WsMayChu; 1: WsMayChu } }
declare const WebSocketRequestResponsePair: { new (yeuCau: string, traLoi: string): unknown }

interface KemKetNoi extends Partial<KemNguoi> { ca?: string; mo?: number; so?: number }

export class PhongDauIon {
  private phong: PhongDau | null = null
  private kn = new WeakMap<WsMayChu, KetNoi>()
  private vong: ReturnType<typeof setInterval> | null = null
  /** Số phòng trong ca (0 = phòng đầu). */
  private soPhong = 0

  constructor(private ctx: DurableObjectState, private env: Env) {
    try { ctx.setWebSocketAutoResponse?.(new WebSocketRequestResponsePair('{"t":"ping"}', '{"t":"pong"}')) } catch { /* môi trường test */ }
  }

  private ketNoi(ws: WsMayChu): KetNoi {
    let k = this.kn.get(ws)
    if (!k) {
      k = {
        gui: (d) => { try { ws.send(d) } catch { /* kết nối vừa đóng */ } },
        dong: (ma, ly) => { try { ws.close(ma, ly.slice(0, 120)) } catch { /* đã đóng */ } },
        ghiKem: (v) => { try { const cu = (ws.deserializeAttachment() ?? {}) as KemKetNoi; ws.serializeAttachment({ ...cu, ...(v as object) }) } catch { /* bỏ qua */ } },
      }
      this.kn.set(ws, k)
    }
    return k
  }

  /** Phòng trong bộ nhớ; vừa thức dậy ⇒ dựng lại sảnh từ dữ liệu gắn trên các kết nối còn mở. */
  private p(): PhongDau {
    if (!this.phong) {
      const dsWs = this.ctx.getWebSockets()
      for (const ws of dsWs) { const a = ws.deserializeAttachment() as KemKetNoi | null; if (a?.so) { this.soPhong = a.so; break } }
      this.phong = new PhongDau(Date.now, Math.random, this.soPhong)
      for (const ws of dsWs) {
        const a = ws.deserializeAttachment() as KemKetNoi | null
        if (a?.id) this.phong.khoiPhuc(this.ketNoi(ws), a as KemNguoi)
      }
    }
    return this.phong
  }

  private damBaoVong(): void {
    const can = !!this.phong?.canThuc()
    if (can && !this.vong) this.vong = setInterval(() => this.nhip(), BUOC * 1000)
    else if (!can && this.vong) { clearInterval(this.vong); this.vong = null; this.phong?.nghiNhip() }
  }
  private nhip(): void {
    try { this.p().nhip() } finally { this.damBaoVong() }
  }

  async fetch(req: Request): Promise<Response> {
    const u = new URL(req.url)
    if (req.method === 'POST' && u.pathname === '/dong') {
      if (this.phong || this.ctx.getWebSockets().length) this.p().dongTatCa('bat-dau')
      this.damBaoVong()
      return new Response('ok')
    }
    if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('Cần WebSocket', { status: 426 })
    const cap = new WebSocketPair()
    const mayChu = cap[1]
    this.ctx.acceptWebSocket(mayChu)
    const so = Math.max(0, Math.min(7, Number(req.headers.get('x-phong-so')) | 0))
    if (!this.phong) this.soPhong = so
    mayChu.serializeAttachment({ ca: req.headers.get('x-ma-ca') ?? '', mo: Date.now(), so } satisfies KemKetNoi)
    return new Response(null, { status: 101, webSocket: cap[0] } as ResponseInit)
  }

  async webSocketMessage(ws: WsMayChu, goi: string | ArrayBuffer): Promise<void> {
    const a = (ws.deserializeAttachment() ?? {}) as KemKetNoi
    const kn = this.ketNoi(ws)
    if (!a.id) {
      // Chưa vào: chỉ nhận gói `vao` có vé hợp lệ của ĐÚNG ca này.
      if (typeof goi !== 'string' || goi.length > 900) return kn.dong(MA_DONG.veSai, 'Thiếu vé vào sảnh đấu.')
      let j: { t?: string; v?: number; ve?: string; nt?: number; an?: boolean }
      try { j = JSON.parse(goi) } catch { return kn.dong(MA_DONG.veSai, 'Gói không đọc được.') }
      if (j.t !== 'vao') return
      if (j.v !== PHIEN_BAN) return kn.dong(MA_DONG.tat, CHU_BAN_CU)
      if (this.env.TAT_DAU_ION) return kn.dong(MA_DONG.tat, 'tat')
      const ve = await kiemVeDau(this.env.MA_BI_MAT, j.ve)
      if (!ve || ve.c !== a.ca) return kn.dong(MA_DONG.veSai, 'Vé vào sảnh đấu không hợp lệ hoặc đã hết hạn.')
      this.p().vao(kn, ve, Number(j.nt) || 0, !!j.an)
    } else if (a.v !== PHIEN_BAN) return kn.dong(MA_DONG.tat, CHU_BAN_CU)
    else this.p().nhan(kn, goi)
    this.damBaoVong()
  }

  async webSocketClose(ws: WsMayChu): Promise<void> { this.p().roi(this.ketNoi(ws)); this.damBaoVong() }
  async webSocketError(ws: WsMayChu): Promise<void> { this.p().roi(this.ketNoi(ws)); this.damBaoVong() }
}
