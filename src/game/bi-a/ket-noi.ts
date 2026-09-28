// BI-A PHẢN ỨNG GĐ2 · KẾT NỐI PHÒNG ĐẤU (WebSocket tới Durable Object `BanBiA`, đặc tả 6.2).
// Mở ⇒ gửi ngay vé vào bàn; rớt ⇒ tự nối lại (chờ 1 → 2 → 4 → 5 giây) bằng CHÍNH vé cũ, phòng gửi lại trạng thái đầy đủ; quá 60 giây
// không nối được ⇒ báo 'mat' (phòng cũng coi ghế đã rời). Giữ kết nối bằng 'ping' mỗi 25 giây — hẹn giờ NỐI TIẾP, không `setInterval`,
// và không gọi máy chủ qua HTTP (không thuộc bảng nhịp tự gọi `nhip-bang-2109`). Phòng trả 'pong' cho mỗi ping (tự trả lời, không thức dậy);
// quá 60 giây không nhận được gói nào ⇒ kết nối chết CÂM (đổi mạng, mạng treo — trình duyệt chưa báo đóng) ⇒ tự đóng và nối lại.
export type TrangThaiNoi = 'dang_noi' | 'noi' | 'noi_lai' | 'mat' | 'dong'
export type GoiPhong = Record<string, unknown> & { t: string }
export interface TuyChonKetNoi {
  url: string
  ve: string
  nhan: (m: GoiPhong) => void
  doi: (tt: TrangThaiNoi) => void
  /** Thay WebSocket (test). */
  taoWs?: (url: string) => WebSocket
  datGio?: (f: () => void, ms: number) => ReturnType<typeof setTimeout>
  xoaGio?: (t: ReturnType<typeof setTimeout> | undefined) => void
  bayGio?: () => number
}
export const GIAY_BO_NOI = 60
/** Quá chừng này giây không nhận được gói nào (kể cả 'pong') ⇒ coi kết nối đã chết. */
export const GIAY_CAM_MAY = 60
/** Đúng chuỗi phòng tự trả lời (`GOI_PING` ở server/src/bi-a-phong.ts). */
const GOI_PING = '{"t":"ping"}'
const CHO_NOI_LAI = [1000, 2000, 4000, 5000]

export class KetNoiBan {
  private o: TuyChonKetNoi
  private ws: WebSocket | null = null
  private dongHan = false
  private lan = 0
  private rotLuc = 0
  private nhanLuc = 0
  private gioNoi: ReturnType<typeof setTimeout> | undefined
  private gioPing: ReturnType<typeof setTimeout> | undefined
  trangThai: TrangThaiNoi = 'dang_noi'
  constructor(o: TuyChonKetNoi) { this.o = o }
  private get now() { return (this.o.bayGio ?? Date.now)() }
  private dat(f: () => void, ms: number) { return (this.o.datGio ?? ((g, m) => setTimeout(g, m)))(f, ms) }
  private xoa(t: ReturnType<typeof setTimeout> | undefined) { (this.o.xoaGio ?? ((x) => clearTimeout(x)))(t) }
  private dongTT(tt: TrangThaiNoi) { if (this.trangThai !== tt) { this.trangThai = tt; this.o.doi(tt) } }
  mo(): void {
    if (this.dongHan) return
    let ws: WebSocket
    try { ws = (this.o.taoWs ?? ((u) => new WebSocket(u)))(this.o.url) } catch { this.rot(); return }
    this.ws = ws
    ws.onopen = () => {
      this.lan = 0; this.rotLuc = 0; this.nhanLuc = this.now
      ws.send(JSON.stringify({ t: 'vao', ve: this.o.ve }))
      this.dongTT('noi')
      this.henPing()
    }
    ws.onmessage = (e) => {
      this.nhanLuc = this.now
      let m: unknown
      try { m = JSON.parse(typeof e.data === 'string' ? e.data : '') } catch { return }
      if (m && typeof m === 'object' && typeof (m as GoiPhong).t === 'string' && (m as GoiPhong).t !== 'pong') this.o.nhan(m as GoiPhong)
    }
    ws.onclose = () => { if (this.ws === ws) { this.ws = null; this.rot() } }
    ws.onerror = () => { /* onclose theo sau */ }
  }
  private henPing(): void {
    this.xoa(this.gioPing)
    this.gioPing = this.dat(() => {
      const ws = this.ws
      if (ws?.readyState !== 1) return
      if (this.now - this.nhanLuc > GIAY_CAM_MAY * 1000) { this.ws = null; try { ws.close(4001, 'Mất tín hiệu') } catch { /* đã đóng */ } this.rot(); return }
      try { ws.send(GOI_PING) } catch { /* rớt */ }
      this.henPing()
    }, 25_000)
  }
  private rot(): void {
    this.xoa(this.gioPing)
    if (this.dongHan) return
    if (!this.rotLuc) this.rotLuc = this.now
    if (this.now - this.rotLuc >= GIAY_BO_NOI * 1000) { this.dongTT('mat'); return }
    this.dongTT('noi_lai')
    const cho = CHO_NOI_LAI[Math.min(this.lan, CHO_NOI_LAI.length - 1)]!
    this.lan++
    this.xoa(this.gioNoi)
    this.gioNoi = this.dat(() => this.mo(), cho)
  }
  /** Gửi một gói; chưa nối thì bỏ (cú đánh cũ gửi muộn là sai lượt — phòng sẽ gửi lại trạng thái khi nối). */
  gui(o: GoiPhong): boolean {
    if (this.ws?.readyState !== 1) return false
    try { this.ws.send(JSON.stringify(o)); return true } catch { return false }
  }
  /** Nối lại ngay (em bấm "Nối lại" sau khi mất hẳn). */
  noiLai(): void { if (this.dongHan) return; this.rotLuc = 0; this.lan = 0; this.xoa(this.gioNoi); this.dongTT('noi_lai'); this.mo() }
  dong(): void {
    this.dongHan = true
    this.xoa(this.gioNoi); this.xoa(this.gioPing)
    const ws = this.ws
    this.ws = null
    try { ws?.close(1000, 'Rời bàn') } catch { /* đã đóng */ }
    this.dongTT('dong')
  }
}
