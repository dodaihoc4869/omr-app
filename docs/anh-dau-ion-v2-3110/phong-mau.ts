// PHÒNG ĐẤU MẪU cho ảnh chụp «Đấu Nguyên Tử 2» trên BẢN BUILD THẬT: chạy ĐÚNG luật phòng đấu thật (server/src/dau-ion-phong.ts) trong Node,
// nối với trang qua page.routeWebSocket (chup.mjs). Kèm vài «bạn mẫu» do máy điều khiển (gửi hướng đi như máy em thật). Dữ liệu GIẢ.
import { PhongDau, type KetNoi } from '../../server/src/dau-ion-phong'
import { docAnh, maYDinh } from '../../src/lib/dau-ion/goi'
import { BUOC } from '../../src/lib/dau-ion/loi'

export const BAN_MAU: [string, number][] = [['Quốc Bảo', 1], ['Thu Hà', 2], ['Gia Huy', 5], ['Ngọc Trâm', 4], ['Đức Anh', 6]]

interface Bot { kn: KetNoi; id: number; seq: number; nhip: number; tx: number; ty: number; doi: number }

export class PhongMau {
  p = new PhongDau(Date.now, Math.random)
  private vong: ReturnType<typeof setInterval> | null = null
  chay(): void { if (!this.vong) this.vong = setInterval(() => this.p.buoc(BUOC), BUOC * 1000) }
  dung(): void { if (this.vong) clearInterval(this.vong); this.vong = null }

  /** n bạn mẫu vào sân (máy chủ coi như người thật). */
  themBan(n = BAN_MAU.length): void {
    for (let i = 0; i < n; i++) {
      const [ten, nt] = BAN_MAU[i]
      const bot: Bot = { kn: null as unknown as KetNoi, id: 0, seq: 0, nhip: 0, tx: 300, ty: 300, doi: 0 }
      bot.kn = { gui: (d) => this.botNhan(bot, d), dong: () => {}, ghiKem: () => {} }
      const ng = this.p.vao(bot.kn, { c: '123456', s: `MAU${i}`, t: ten, h: Date.now() + 3600_000 }, nt, false)
      bot.id = ng?.id ?? 0
      this.p.nhan(bot.kn, JSON.stringify({ t: 'vao-san' }))
    }
  }

  private botNhan(bot: Bot, d: string | Uint8Array): void {
    if (typeof d === 'string') return
    const a = docAnh(d)
    if (!a || ++bot.nhip % 2) return // ~10 hướng đi/giây
    const toi = a.ghe.find((g) => g.id === bot.id)
    if (!toi) return
    // Đi lang thang tới điểm ngẫu nhiên, đổi điểm mỗi ~1,5 giây.
    if (--bot.doi <= 0 || Math.hypot(bot.tx - toi.x, bot.ty - toi.y) < 20) { bot.tx = 60 + Math.random() * 480; bot.ty = 60 + Math.random() * 480; bot.doi = 15 }
    const dx = bot.tx - toi.x, dy = bot.ty - toi.y, l = Math.hypot(dx, dy) || 1
    bot.seq = (bot.seq + 1) & 0xff
    this.p.nhan(bot.kn, maYDinh(bot.seq, (dx / l) * 0.85, (dy / l) * 0.85))
  }
}

/** Nối một máy em (gửi/nhận như WebSocket) vào phòng mẫu; vé không kiểm (phòng thật kiểm ở Durable Object). */
export function noiMayEm(phong: PhongMau, guiVeMay: (d: string | Uint8Array) => void, dongMay: (ma: number, ly: string) => void) {
  let kn: KetNoi | null = null
  return {
    nhan(d: string | Uint8Array): void {
      if (typeof d === 'string') {
        if (d === '{"t":"ping"}') { guiVeMay('{"t":"pong"}'); return }
        const j = JSON.parse(d)
        if (!kn) {
          if (j.t !== 'vao') return
          kn = { gui: guiVeMay, dong: dongMay, ghiKem: () => {} }
          phong.p.vao(kn, { c: '123456', s: '12121', t: 'Khánh Ngọc', h: Date.now() + 3600_000 }, Number(j.nt) || 0, !!j.an)
          return
        }
        phong.p.nhan(kn, d)
      } else if (kn) phong.p.nhan(kn, d)
    },
    dong(): void { if (kn) phong.p.roi(kn); kn = null },
  }
}
