// KẾT NỐI SẢNH ĐẤU «Đấu Nguyên Tử» — một WebSocket tới phòng đấu của ca (Durable Object, máy chủ Worker). Chỉ mở khi em bấm vào Sảnh đấu.
// Không dùng setInterval: ping 25 giây và nối lại lùi dần (1 → 2 → 4 → 8 giây, tối đa 5 lần) đều bằng setTimeout. Đóng sạch khi game tháo khỏi màn.
// Mã đóng của phòng: 4000 thầy bắt đầu thi · 4010 công tắc tắt · 4003 vé sai/hết hạn · 4002 mở ở máy khác · 4009 sảnh đầy ⇒ KHÔNG nối lại.
// 3 ĐẤU 3 (01/11): 4009 kèm lý do «sang:k» = phòng này đã đủ 78 em ⇒ TỰ nối ngay phòng k của ca (…/dau-ion/<ca>/<k>), em không phải làm gì.
import { docAnh, type Anh } from '../../lib/dau-ion/goi'

export type TinMang =
  | { k: 'mo' }
  | { k: 'json'; j: Record<string, unknown> }
  | { k: 'anh'; a: Anh }
  | { k: 'mat'; lan: number }
  | { k: 'dong'; ma: number; ly: string }

const KHONG_NOI_LAI = new Set([4000, 4002, 4003, 4009, 4010])
const LUI_MS = [1000, 2000, 4000, 8000, 8000]

export function duongPhong(mayChu: string, maCa: string): string {
  return `${mayChu.replace(/^http/, 'ws').replace(/\/+$/, '')}/dau-ion/${encodeURIComponent(maCa)}`
}

export class MangDau {
  private ws: WebSocket | null = null
  private henPing = 0
  private henNoi = 0
  private lan = 0
  private daDong = false
  private url: string
  private goc: string
  private goiVao: () => Record<string, unknown>
  private bao: (t: TinMang) => void
  constructor(url: string, goiVao: () => Record<string, unknown>, bao: (t: TinMang) => void) { this.url = this.goc = url; this.goiVao = goiVao; this.bao = bao }
  /** Phòng đang nối (0 = phòng đầu của ca). */
  soPhong = 0

  mo(): void {
    if (this.daDong) return
    let ws: WebSocket
    try { ws = new WebSocket(this.url) } catch { this.matKetNoi(); return }
    ws.binaryType = 'arraybuffer'
    this.ws = ws
    ws.onopen = () => { this.lan = 0; this.gui(this.goiVao()); this.bao({ k: 'mo' }); this.hen() }
    ws.onmessage = (e) => {
      this.hen()
      if (typeof e.data === 'string') {
        if (e.data === '{"t":"pong"}') return
        try { const j = JSON.parse(e.data); if (j && typeof j === 'object') this.bao({ k: 'json', j }) } catch { /* gói hỏng: bỏ */ }
      } else { const a = docAnh(e.data as ArrayBuffer); if (a) this.bao({ k: 'anh', a }) }
    }
    ws.onclose = (e) => {
      if (this.ws !== ws) return
      this.ws = null; clearTimeout(this.henPing)
      if (this.daDong) return
      const sang = e.code === 4009 ? /^sang:(\d)$/.exec(e.reason || '') : null
      if (sang && Number(sang[1]) > this.soPhong) { this.soPhong = Number(sang[1]); this.url = `${this.goc}/${this.soPhong}`; this.lan = 0; this.mo(); return }
      if (KHONG_NOI_LAI.has(e.code)) { this.daDong = true; this.bao({ k: 'dong', ma: e.code, ly: e.reason }); return }
      this.matKetNoi()
    }
    ws.onerror = () => { /* onclose theo sau */ }
  }

  private matKetNoi(): void {
    if (this.daDong) return
    if (this.lan >= LUI_MS.length) { this.bao({ k: 'mat', lan: this.lan }); return }
    this.bao({ k: 'mat', lan: this.lan })
    this.henNoi = window.setTimeout(() => this.mo(), LUI_MS[this.lan++])
  }

  /** Ping mỗi 25 giây khi không có gói nào; phòng tự trả pong mà không thức dậy. */
  private hen(): void {
    clearTimeout(this.henPing)
    this.henPing = window.setTimeout(() => { this.gui({ t: 'ping' }); this.hen() }, 25_000)
  }

  gui(o: Record<string, unknown> | Uint8Array): void {
    const ws = this.ws
    if (!ws || ws.readyState !== 1) return
    try { ws.send(o instanceof Uint8Array ? (o as Uint8Array<ArrayBuffer>) : JSON.stringify(o)) } catch { /* đang đóng */ }
  }
  get mo_(): boolean { return this.ws?.readyState === 1 }

  /** Đóng hẳn (rời màn, thầy bắt đầu thi): không nối lại, huỷ mọi hẹn giờ. */
  dong(): void {
    this.daDong = true
    clearTimeout(this.henPing); clearTimeout(this.henNoi)
    const ws = this.ws
    this.ws = null
    if (ws) { ws.onclose = null; ws.onmessage = null; try { ws.close(1000, 'roi') } catch { /* đã đóng */ } }
  }
}
