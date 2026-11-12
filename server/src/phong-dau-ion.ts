// DURABLE OBJECT `PhongDauIon` — phòng trò của phòng chờ cho MỘT ca kiểm tra (idFromName(`dau-ion:<mã ca>`), gợi ý vị trí châu Á – Thái Bình Dương).
// Tên lớp / tên tệp còn chữ «dau-ion» vì lớp đã khai trong wrangler.toml (migration `dau-ion-v1`); trò «Đấu Nguyên Tử» ĐÃ XOÁ 13/11 (thầy: «Xóa game đấu
// nguyên tử đi nhé») — phòng nay chỉ chạy «Sinh Tồn bốn đội» (luật ở sinh-ton-ca.ts, test được không cần Cloudflare). 0 lệnh D1, không lưu gì.
// WebSocket Hibernation: phòng chỉ thức khi còn em thật đang gửi gói (hẹn giờ 250 ms); yên thì ngủ, kết nối vẫn giữ (dữ liệu nhỏ của từng em gắn trên
// kết nối). Ping `{"t":"ping"}` được trả `{"t":"pong"}` tự động, không đánh thức phòng.
// GIAO THỨC: gói `vao` phải mang `tro: 'st'` + `v: PHIEN_BAN_ST` + vé của ĐÚNG ca. Máy còn mảnh trò cũ trong bộ nhớ đệm (gói `vao` không có `tro`) ⇒ đóng
// sạch mã 4010 (máy cũ hiểu là «sảnh chưa mở», không nối lại). Ca đông chia nhiều phòng — phòng số k (header `x-phong-so`, 0…7) đầy ⇒ đóng 4009
// «sang:k+1», máy em tự nối phòng kế. Thầy bấm Bắt đầu ⇒ POST `/dong` ⇒ mọi kết nối đóng mã 4000.
import type { DurableObjectState, Env, WsMayChu } from './kieu'
import { kiemVeDau } from './dau-ion-ve'
import { PHIEN_BAN_ST } from '../../src/lib/live-khoi/kieu'
import { CHU_BAN_CU_ST, CHU_TRO_CU, MA_DONG, PhongSinhTonCa, type KemSinhTon, type KetNoi } from './sinh-ton-ca'
import { TRO_NHIP_MS } from './sinh-ton-may-chu'

declare const WebSocketPair: { new (): { 0: WsMayChu; 1: WsMayChu } }
declare const WebSocketRequestResponsePair: { new (yeuCau: string, traLoi: string): unknown }

/** Dữ liệu gắn trên kết nối: mã ca, giờ mở, số phòng; sau khi vào trò có thêm `st: 1` + số báo danh `s`, tên `t`, đội `doi`. */
interface KemKetNoi extends Partial<KemSinhTon> { ca?: string; mo?: number; so?: number }

export class PhongDauIon {
  private kn = new WeakMap<WsMayChu, KetNoi>()
  /** Phòng Sinh Tồn của ca + hẹn giờ 250 ms (chỉ chạy khi còn em thật đang gửi gói). */
  private phongSt: PhongSinhTonCa | null = null
  private vongSt: ReturnType<typeof setInterval> | null = null
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

  /** Phòng Sinh Tồn trong bộ nhớ; vừa thức dậy ⇒ dựng lại em (đúng đội) từ dữ liệu gắn trên các kết nối `st: 1` còn mở. */
  private st(): PhongSinhTonCa {
    if (!this.phongSt) {
      const dsWs = this.ctx.getWebSockets()
      for (const ws of dsWs) { const a = ws.deserializeAttachment() as KemKetNoi | null; if (a?.so) { this.soPhong = a.so; break } }
      this.phongSt = new PhongSinhTonCa(Date.now, Math.random, this.soPhong)
      for (const ws of dsWs) {
        const a = ws.deserializeAttachment() as KemKetNoi | null
        if (a?.st === 1) this.phongSt.khoiPhuc(this.ketNoi(ws), a as KemSinhTon)
      }
    }
    return this.phongSt
  }

  private damBaoVong(): void {
    const can = !!this.phongSt?.canThuc()
    if (can && !this.vongSt) this.vongSt = setInterval(() => this.nhip(), TRO_NHIP_MS)
    else if (!can && this.vongSt) { clearInterval(this.vongSt); this.vongSt = null }
  }
  private nhip(): void {
    try { this.phongSt?.nhip() } finally { this.damBaoVong() }
  }

  async fetch(req: Request): Promise<Response> {
    const u = new URL(req.url)
    if (req.method === 'POST' && u.pathname === '/dong') {
      const dsWs = this.ctx.getWebSockets()
      if (this.phongSt || dsWs.length) {
        this.st().dongTatCa('bat-dau')
        // Kết nối chưa vào trò (chưa gửi vé) hoặc của mảnh trò cũ: cũng đóng mã 4000 để không máy nào còn treo khi ca đã bắt đầu.
        for (const ws of dsWs) { const a = ws.deserializeAttachment() as KemKetNoi | null; if (a?.st !== 1) this.ketNoi(ws).dong(MA_DONG.batDau, 'bat-dau') }
      }
      this.damBaoVong()
      return new Response('ok')
    }
    if (req.headers.get('Upgrade')?.toLowerCase() !== 'websocket') return new Response('Cần WebSocket', { status: 426 })
    const cap = new WebSocketPair()
    const mayChu = cap[1]
    this.ctx.acceptWebSocket(mayChu)
    const so = Math.max(0, Math.min(7, Number(req.headers.get('x-phong-so')) | 0))
    if (!this.phongSt) this.soPhong = so
    mayChu.serializeAttachment({ ca: req.headers.get('x-ma-ca') ?? '', mo: Date.now(), so } satisfies KemKetNoi)
    return new Response(null, { status: 101, webSocket: cap[0] } as ResponseInit)
  }

  async webSocketMessage(ws: WsMayChu, goi: string | ArrayBuffer): Promise<void> {
    const a = (ws.deserializeAttachment() ?? {}) as KemKetNoi
    const kn = this.ketNoi(ws)
    // Đã vào trò bằng vé: mọi gói sau đi thẳng phòng Sinh Tồn.
    if (a.st === 1) { this.st().nhan(kn, goi); this.damBaoVong(); return }
    // Chưa vào: chỉ nhận gói `vao` có vé hợp lệ của ĐÚNG ca này.
    if (typeof goi !== 'string' || goi.length > 900) return kn.dong(MA_DONG.veSai, 'Thiếu vé vào trò phòng chờ.')
    let j: { t?: string; v?: number; ve?: string; tro?: string }
    try { j = JSON.parse(goi) } catch { return kn.dong(MA_DONG.veSai, 'Gói không đọc được.') }
    if (j.t !== 'vao') return
    if (j.tro !== 'st') return kn.dong(MA_DONG.tat, CHU_TRO_CU)
    if (j.v !== PHIEN_BAN_ST) return kn.dong(MA_DONG.tat, CHU_BAN_CU_ST)
    if (this.env.TAT_DAU_ION) return kn.dong(MA_DONG.tat, 'tat')
    const ve = await kiemVeDau(this.env.MA_BI_MAT, j.ve)
    if (!ve || ve.c !== a.ca) return kn.dong(MA_DONG.veSai, 'Vé vào trò phòng chờ không hợp lệ hoặc đã hết hạn.')
    this.st().vao(kn, ve)
    this.damBaoVong()
  }

  private roi(ws: WsMayChu): void {
    // Chưa có phòng trong bộ nhớ và kết nối này chưa vào trò ⇒ không cần dựng phòng chỉ để bỏ qua.
    const a = ws.deserializeAttachment() as KemKetNoi | null
    if (this.phongSt || a?.st === 1) this.st().roi(this.ketNoi(ws))
    this.damBaoVong()
  }
  async webSocketClose(ws: WsMayChu): Promise<void> { this.roi(ws) }
  async webSocketError(ws: WsMayChu): Promise<void> { this.roi(ws) }
}
