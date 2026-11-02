// PHÒNG MẪU v4 (tháp · tường · tinh thể) cho ẢNH APP THẬT (chup.mjs) — chạy LÕI THẬT (src/lib/dau-ion/loi.ts) trong Node, gửi gói THẬT (goi.ts) tới
// bản build thật qua page.routeWebSocket. Mỗi nhịp đặt lại vị trí / Máu / số hạ của 6 ghế và máu khối theo cảnh (đứng yên, không ai bị hạ); ngắm ai, bắn ai,
// tháp bắn ai, đạn bay là do lõi quyết. Dữ liệu và tên đều GIẢ.
import { BE_PHE, BUOC, MAU_KHOI_DAU, buocTran, laySuKien, taoTran, type Ghe, type Tran } from '../../../src/lib/dau-ion/loi'
import { PHIEN_BAN, datAck, docYDinh, maAnh } from '../../../src/lib/dau-ion/goi'

interface Cho { id: number; ten: string; nt: number; ai: boolean; phe: number; x: number; y: number; mau: number; cap: number; ha: number; khien?: number }
/** Cảnh TRẬN (toạ độ SÂN, Bazơ trái): em bắn Quốc Bảo; Thu Hà lấn vùng tháp cánh Axit (tháp bắn Thu Hà); tháp cánh A Bazơ đã vỡ. */
export const CANH: Cho[] = [
  { id: 1, ten: 'Khánh Ngọc', nt: 3, ai: false, phe: 0, x: 400, y: 190, mau: 8, cap: 3, ha: 3 },
  { id: 2, ten: 'Thu Hà', nt: 2, ai: false, phe: 0, x: 590, y: 440, mau: 7, cap: 2, ha: 2 },
  { id: 3, ten: 'Sulfur', nt: 4, ai: true, phe: 0, x: 450, y: 330, mau: 9, cap: 2, ha: 1 },
  { id: 4, ten: 'Quốc Bảo', nt: 1, ai: false, phe: 1, x: 640, y: 190, mau: 4, cap: 1, ha: 2 },
  { id: 5, ten: 'Ngọc Trâm', nt: 5, ai: false, phe: 1, x: 770, y: 310, mau: 8, cap: 4, ha: 2 },
  { id: 6, ten: 'Neon', nt: 6, ai: true, phe: 1, x: 920, y: 150, mau: 6, cap: 1, ha: 1 },
]
/** Cảnh BỊ BẮN: phe Axit đã phá tháp cánh A + tháp lớn + tường giữa của Bazơ, đứng trước khe bắn tinh thể phe em. */
export const CANH_BAO: Cho[] = [
  { id: 1, ten: 'Khánh Ngọc', nt: 3, ai: false, phe: 0, x: 400, y: 190, mau: 8, cap: 3, ha: 3 },
  { id: 2, ten: 'Thu Hà', nt: 2, ai: false, phe: 0, x: 160, y: 400, mau: 5, cap: 2, ha: 2 },
  { id: 3, ten: 'Sulfur', nt: 4, ai: true, phe: 0, x: 450, y: 330, mau: 9, cap: 2, ha: 1 },
  { id: 4, ten: 'Quốc Bảo', nt: 1, ai: false, phe: 1, x: 640, y: 190, mau: 4, cap: 1, ha: 2 },
  { id: 5, ten: 'Ngọc Trâm', nt: 5, ai: false, phe: 1, x: 190, y: 300, mau: 8, cap: 4, ha: 2 },
  { id: 6, ten: 'Neon', nt: 6, ai: true, phe: 1, x: 200, y: 200, mau: 6, cap: 2, ha: 1 },
]
/** Máu khối theo cảnh: [trận] tháp cánh A Bazơ vỡ, tháp cánh Axit (710, 400) còn 8, tường cánh Axit nứt; [bị bắn] Bazơ mất tháp A + tháp lớn + tường giữa, tinh thể còn 9. */
const KM_TRAN = MAU_KHOI_DAU.map((m, i) => (i === 0 ? 0 : i === 7 ? 8 : i === 10 ? 4 : m))
const KM_BAO = MAU_KHOI_DAU.map((m, i) => (i === 0 || i === 2 || i === 4 ? 0 : i === 6 ? 9 : i === 7 ? 8 : m))
/** Bảng hết ván (v4, 11 cột): [id, hạ, bị hạ, cấp cao nhất, chuỗi hạ, bắn trúng khối, góp sức, trúng, giây trụ liền, tháp phá, hộ vệ]. */
export const BANG_KET = [
  [1, 4, 2, 4, 2, 21, 2, 21, 24, 1, 1], [2, 5, 3, 3, 3, 6, 1, 25, 18, 2, 0], [3, 3, 1, 3, 1, 14, 3, 15, 31, 0, 2],
  [4, 4, 4, 5, 2, 10, 1, 26, 15, 1, 0], [5, 3, 3, 3, 1, 7, 4, 17, 20, 0, 3], [6, 2, 5, 2, 1, 5, 0, 12, 9, 0, 0],
]

export class PhongV4 {
  tr: Tran
  canh = CANH.map((c) => ({ ...c }))
  km = [...KM_TRAN]
  private vong: ReturnType<typeof setInterval> | null = null
  private gui: ((d: string | Uint8Array) => void) | null = null
  private seq = 0
  private tick = 0
  private trongSan = false
  private buocSo = 0
  private cheDen = new Map<number, number>()
  constructor(ntEm = 3) {
    this.canh[0].nt = ntEm
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
    this.tr.km = [...this.km]; this.tr.xong = false; this.tr.con = 72
  }
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
    this.gui?.(JSON.stringify({ t: 'san', v: PHIEN_BAN, so: 1, toi: 1, con: 72, buoc: this.buocSo, ti: [7, 5], ghe: this.dongGhe(), vp: this.tr.vp.map((v) => [v.id, v.k, Math.round(v.x), Math.round(v.y)]), km: this.km }))
    this.trongSan = true
    if (!this.vong) this.vong = setInterval(() => this.nhip(), BUOC * 1000)
  }
  private nhip(): void {
    if (!this.trongSan || !this.gui) return
    this.datCanh()
    buocTran(this.tr, BUOC)
    const su = laySuKien(this.tr)
    this.tr.km = [...this.km]
    this.tick = (this.tick + 1) & 0xff
    this.buocSo = (this.buocSo + 1) & 0xffff
    this.gui(datAck(maAnh(this.tick, 72, this.tr.ghe, su, this.buocSo, [7, 5], this.km), this.seq))
  }
  /** Cảnh tinh thể phe em bị bắn. */
  bao(): void { this.canh = CANH_BAO.map((c, i) => ({ ...c, nt: this.canh[i].nt })); this.km = [...KM_BAO] }
  thay(id = 3, ten = 'Gia Huy'): void {
    const c = this.canh.find((k) => k.id === id)!
    this.gui?.(JSON.stringify({ t: 'thay', cu: id, moi: id, ten, nt: c.nt, phe: c.phe, ai: 0 }))
    c.ai = false; c.ten = ten; [c.x, c.y] = BE_PHE[c.phe][2]
    this.cheDen.set(id, this.tr.t + 3)
    this.gui?.(JSON.stringify({ t: 'ghe', ghe: this.dongGhe() }))
  }
  /** Hết ván: Bazơ phá vỡ tinh thể Axit, còn 0:30. */
  ket(): void {
    this.trongSan = false
    const km = MAU_KHOI_DAU.map((m, i) => (i === 0 ? 0 : i === 6 ? 15 : i >= 7 && i !== 8 && i !== 12 ? 0 : m))
    this.gui?.(JSON.stringify({ t: 'ket', bang: BANG_KET, nghi: 6, ti: [12, 9], thang: 0, ly: 'vo', km, con: 30 }))
  }
  dung(): void { if (this.vong) clearInterval(this.vong); this.vong = null; this.gui = null }
}
