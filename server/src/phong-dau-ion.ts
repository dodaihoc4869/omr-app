// DURABLE OBJECT `PhongDauIon` — một phòng đấu «Đấu Nguyên Tử» cho MỘT ca (idFromName(`dau-ion:<mã ca>`), gợi ý vị trí châu Á – Thái Bình Dương).
// WebSocket Hibernation: phòng chỉ thức khi có việc (trận đang chạy, hàng đấu nhanh, lời thách, nhóm); sảnh yên thì ngủ, kết nối vẫn giữ
// (dữ liệu nhỏ của từng em gắn trên kết nối). Ping `{"t":"ping"}` được trả `{"t":"pong"}` tự động, không đánh thức phòng.
// Luật nằm ở dau-ion-phong.ts (test được không cần Cloudflare). 0 lệnh D1. Lớp SQLite (migration `dau-ion-v1`) nhưng không lưu gì.
import type { DurableObjectState, Env, WsMayChu } from './kieu'
import { BUOC } from '../../src/lib/dau-ion/loi'
import { MA_DONG, PhongDau, type KemNguoi, type KetNoi } from './dau-ion-phong'
import { kiemVeDau } from './dau-ion-ve'

declare const WebSocketPair: { new (): { 0: WsMayChu; 1: WsMayChu } }
declare const WebSocketRequestResponsePair: { new (yeuCau: string, traLoi: string): unknown }

interface KemKetNoi extends Partial<KemNguoi> { ca?: string; mo?: number }

export class PhongDauIon {
  private phong: PhongDau | null = null
  private kn = new WeakMap<WsMayChu, KetNoi>()
  private vong: ReturnType<typeof setInterval> | null = null

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
      this.phong = new PhongDau()
      for (const ws of this.ctx.getWebSockets()) {
        const a = ws.deserializeAttachment() as KemKetNoi | null
        if (a?.id && a.s) this.phong.khoiPhuc(this.ketNoi(ws), a as KemNguoi)
      }
    }
    return this.phong
  }

  private damBaoVong(): void {
    const can = !!this.phong?.canThuc()
    if (can && !this.vong) this.vong = setInterval(() => this.nhip(), BUOC * 1000)
    else if (!can && this.vong) { clearInterval(this.vong); this.vong = null }
  }
  private nhip(): void {
    try { this.p().buoc(BUOC) } finally { this.damBaoVong() }
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
    mayChu.serializeAttachment({ ca: req.headers.get('x-ma-ca') ?? '', mo: Date.now() } satisfies KemKetNoi)
    return new Response(null, { status: 101, webSocket: cap[0] } as ResponseInit)
  }

  async webSocketMessage(ws: WsMayChu, goi: string | ArrayBuffer): Promise<void> {
    const a = (ws.deserializeAttachment() ?? {}) as KemKetNoi
    const kn = this.ketNoi(ws)
    if (!a.id) {
      // Chưa vào: chỉ nhận gói `vao` có vé hợp lệ của ĐÚNG ca này.
      if (typeof goi !== 'string' || goi.length > 900) return kn.dong(MA_DONG.veSai, 'Thiếu vé vào sảnh đấu.')
      let j: { t?: string; ve?: string; nt?: number; an?: boolean; km?: boolean }
      try { j = JSON.parse(goi) } catch { return kn.dong(MA_DONG.veSai, 'Gói không đọc được.') }
      if (j.t !== 'vao') return
      if (this.env.TAT_DAU_ION) return kn.dong(MA_DONG.tat, 'tat')
      const ve = await kiemVeDau(this.env.MA_BI_MAT, j.ve)
      if (!ve || ve.c !== a.ca) return kn.dong(MA_DONG.veSai, 'Vé vào sảnh đấu không hợp lệ hoặc đã hết hạn.')
      this.p().vao(kn, ve, Number(j.nt) || 0, !!j.an, !!j.km)
    } else this.p().nhan(kn, goi)
    this.damBaoVong()
  }

  async webSocketClose(ws: WsMayChu): Promise<void> { this.p().roi(this.ketNoi(ws)); this.damBaoVong() }
  async webSocketError(ws: WsMayChu): Promise<void> { this.p().roi(this.ketNoi(ws)); this.damBaoVong() }
}
