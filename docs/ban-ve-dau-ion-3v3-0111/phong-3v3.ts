// PHÒNG MẪU 3 ĐẤU 3 cho BẢN VẼ (chup.mjs) — chạy LÕI THẬT (src/lib/dau-ion/loi.ts: tự ngắm xa, che đường bắn, bắn, trúng, vật phẩm) trong Node,
// gửi gói THẬT (src/lib/dau-ion/goi.ts) tới bản build thật qua page.routeWebSocket. Để ảnh đúng cảnh thầy cần, mỗi nhịp đặt lại vị trí / Máu / số hạ
// của 6 ghế (đứng yên, không ai bị hạ), đồng hồ đứng ở 0:42 — còn ngắm ai, bắn ai, đạn bay, vật phẩm hiện là do lõi quyết. Dữ liệu và tên đều GIẢ.
import { BE_PHE, BUOC, buocTran, laySuKien, taoTran, type Ghe, type Tran } from '../../src/lib/dau-ion/loi'
import { PHIEN_BAN, datAck, docYDinh, maAnh } from '../../src/lib/dau-ion/goi'
// Cho sơ đồ sân (chup.mjs vẽ SVG từ ĐÚNG số liệu của lõi).
export { BE_PHE, CHO_KH, CHO_XT, R, SAN_H, SAN_W, VAT_CAN, dungVatCan, thayNhau } from '../../src/lib/dau-ion/loi'

interface Cho { id: number; ten: string; nt: number; ai: boolean; phe: number; x: number; y: number; mau: number; cap: number; ha: number; khien?: number }
/** Cảnh B (toạ độ SÂN, Bazơ trái): em giữa-trái; Ngọc Trâm GẦN em hơn (291) nhưng nấp sau bình cầu ⇒ em KHÔNG bắn
 *  (không ai thấy Ngọc Trâm); Quốc Bảo ở XA (490) nhưng lộ ⇒ em ngắm, bắn; hành lang cánh trên: Thu Hà ↔ A.I Neon đấu nhau. */
export const CANH: Cho[] = [
  { id: 1, ten: 'Khánh Ngọc', nt: 3, ai: false, phe: 0, x: 330, y: 330, mau: 8, cap: 3, ha: 3 },
  { id: 2, ten: 'Thu Hà', nt: 2, ai: false, phe: 0, x: 430, y: 90, mau: 10, cap: 2, ha: 2 },
  { id: 3, ten: 'Sulfur', nt: 4, ai: true, phe: 0, x: 205, y: 420, mau: 6, cap: 2, ha: 2 },
  { id: 4, ten: 'Quốc Bảo', nt: 1, ai: false, phe: 1, x: 820, y: 330, mau: 7, cap: 2, ha: 2 },
  { id: 5, ten: 'Ngọc Trâm', nt: 5, ai: false, phe: 1, x: 600, y: 220, mau: 9, cap: 4, ha: 2 },
  { id: 6, ten: 'Neon', nt: 6, ai: true, phe: 1, x: 740, y: 150, mau: 5, cap: 1, ha: 1 },
]
/** Bảng hết ván «Phe Bazơ thắng 12 – 9»: [id, hạ, bị hạ, cấp cao nhất, chuỗi hạ, electron, góp sức, trúng, giây trụ liền]. */
export const BANG_KET = [
  [1, 4, 2, 4, 2, 9, 2, 21, 24], [2, 5, 3, 3, 3, 6, 1, 25, 18], [3, 3, 1, 3, 1, 14, 3, 15, 31],
  [4, 4, 4, 5, 2, 10, 1, 26, 15], [5, 3, 3, 3, 1, 7, 4, 17, 20], [6, 2, 5, 2, 1, 5, 0, 12, 9],
]

export class Phong3v3 {
  tr: Tran
  canh = CANH.map((c) => ({ ...c }))
  private vong: ReturnType<typeof setInterval> | null = null
  private gui: ((d: string | Uint8Array) => void) | null = null
  private seq = 0
  private tick = 0
  private trongSan = false
  /** Ghế vừa vào thay còn khiên (giây trận). */
  private cheDen = new Map<number, number>()
  constructor(ntEm = 3) {
    this.canh[0].nt = ntEm
    // Nguyên tố khác nhau trong sân: ai trùng với em thì đổi sang nguyên tố còn trống.
    const dung = new Set([ntEm])
    for (const c of this.canh.slice(1)) { if (dung.has(c.nt)) c.nt = [0, 1, 2, 3, 4, 5, 6].find((k) => !dung.has(k) && !this.canh.some((q) => q.nt === k))!; dung.add(c.nt) }
    this.tr = taoTran(this.canh.map((c) => ({ id: c.id, nt: c.nt, ai: c.ai, phe: c.phe })), 7)
    this.tr.su = []
  }
  private dongGhe(): unknown[] { return this.canh.map((c) => [c.id, c.ten, c.nt, c.ai ? 1 : 0, c.phe]) }
  private datCanh(): void {
    for (const c of this.canh) {
      const g = this.tr.ghe.find((k) => k.id === c.id) as Ghe
      Object.assign(g, { x: c.x, y: c.y, vx: 0, vy: 0, mau: c.mau, cap: c.cap, capMax: Math.max(g.capMax, c.cap), ha: c.ha, cho: 0, che: (this.cheDen.get(c.id) ?? 0) > this.tr.t ? 1 : 0, yd: { dx: 0, dy: 0 }, ai: c.ai, khien: c.khien ?? 0 })
    }
    this.tr.con = 42
  }
  /** Nối một máy em (gói từ trang → `nhan`; gói tới trang qua `gui`). */
  noi(gui: (d: string | Uint8Array) => void): { nhan: (d: string | Uint8Array) => void; dong: () => void } {
    this.gui = gui
    return {
      nhan: (d) => {
        if (typeof d !== 'string') { const y = docYDinh(d); if (y) this.seq = y.seq; return }
        if (d === '{"t":"ping"}') { gui('{"t":"pong"}'); return }
        const j = JSON.parse(d)
        if (j.t === 'vao') { gui(JSON.stringify({ t: 'chao', v: PHIEN_BAN, toi: 1, ten: this.canh[0].ten })); gui(JSON.stringify({ t: 'sanh', so: 1, that: 4 })) }
        else if (j.t === 'vao-san') this.vaoSan()
        else if (j.t === 'roi-san') this.trongSan = false
      },
      dong: () => this.dung(),
    }
  }
  private vaoSan(): void {
    this.datCanh()
    this.gui?.(JSON.stringify({ t: 'san', v: PHIEN_BAN, so: 1, toi: 1, con: 42, ghe: this.dongGhe(), vp: this.tr.vp.map((v) => [v.id, v.k, Math.round(v.x), Math.round(v.y)]) }))
    this.trongSan = true
    if (!this.vong) this.vong = setInterval(() => this.nhip(), BUOC * 1000)
  }
  private nhip(): void {
    if (!this.trongSan || !this.gui) return
    this.datCanh()
    buocTran(this.tr, BUOC)
    this.tr.con = 42
    this.tick = (this.tick + 1) & 0xff
    this.gui(datAck(maAnh(this.tick, this.tr.con, this.tr.ghe, laySuKien(this.tr)), this.seq))
  }
  /** Cảnh C: Gia Huy vào thay ghế A.I của phe Bazơ — A.I tan tại chỗ, Gia Huy hiện ở bệ cánh của phe (khiên 3 giây). */
  thay(id = 3, ten = 'Gia Huy'): void {
    const c = this.canh.find((k) => k.id === id)!
    this.gui?.(JSON.stringify({ t: 'thay', id, ten, phe: c.phe }))
    c.ai = false; c.ten = ten; [c.x, c.y] = BE_PHE[c.phe][2]
    this.cheDen.set(id, this.tr.t + 3)
    this.gui?.(JSON.stringify({ t: 'ghe', ghe: this.dongGhe() }))
  }
  /** Cảnh D: hết ván. */
  ket(): void { this.trongSan = false; this.gui?.(JSON.stringify({ t: 'ket', bang: BANG_KET, nghi: 6 })) }
  dung(): void { if (this.vong) clearInterval(this.vong); this.vong = null; this.gui = null }
}
