// PHÒNG ĐẤU MẪU cho bản vẽ / ảnh chụp «Đấu Nguyên Tử»: chạy ĐÚNG luật phòng đấu thật (server/src/dau-ion-phong.ts) ngay trong trang (mau.html)
// hoặc trong Node (chup.mjs, nối với bản build thật qua page.routeWebSocket), kèm vài «bạn mẫu» do máy điều khiển. Dữ liệu GIẢ — không phải học sinh thật.
import { PhongDau, type KetNoi } from '../../server/src/dau-ion-phong'
import { docAnh, maYDinh } from '../../src/lib/dau-ion/goi'
import { BUOC } from '../../src/lib/dau-ion/loi'

export const BAN_MAU: [string, number][] = [['Quốc Bảo', 1], ['Thu Hà', 3], ['Gia Huy', 2], ['Ngọc Trâm', 4], ['Đức Anh', 5], ['Bảo Ngọc', 6], ['Hoàng Long', 1]]

interface Bot { kn: KetNoi; id: number; tran: boolean; seq: number; nhip: number; ban: boolean; ngamLech: number; t: number }

export class PhongMau {
  p: PhongDau
  bots: Bot[] = []
  /** Bạn mẫu có bắn trả không (tắt để em thắng nhanh khi chụp ảnh kết quả). */
  botBan = true
  private vong: ReturnType<typeof setInterval> | null = null
  constructor() { this.p = new PhongDau(Date.now, Math.random) }

  chay(): void { if (!this.vong) this.vong = setInterval(() => this.p.buoc(BUOC), BUOC * 1000) }
  dung(): void { if (this.vong) clearInterval(this.vong); this.vong = null }

  /** Thêm n bạn mẫu vào sảnh; bạn thứ i (≥ 2) đang đấu với nhau cho danh sách sinh động. */
  themBan(n = BAN_MAU.length): void {
    for (let i = 0; i < n; i++) {
      const [ten, nt] = BAN_MAU[i]
      const bot: Bot = { kn: null as unknown as KetNoi, id: 0, tran: false, seq: 0, nhip: 0, ban: false, ngamLech: 0, t: 0 }
      bot.kn = {
        gui: (d) => this.botNhan(bot, d),
        dong: () => {},
        ghiKem: () => {},
      }
      const nguoi = this.p.vao(bot.kn, { c: '123456', s: `MAU${i}`, t: ten, h: Date.now() + 3600_000 }, nt, false, false)
      bot.id = nguoi?.id ?? 0
      this.bots.push(bot)
    }
    // Hai cặp bạn mẫu đang đấu nhau (trạng thái «Đang đấu» trên danh sách).
    for (const [a, b] of [[1, 2], [4, 5]]) {
      if (!this.bots[a] || !this.bots[b]) continue
      this.p.nhan(this.bots[a].kn, JSON.stringify({ t: 'thach', den: this.bots[b].id }))
    }
  }

  /** Bạn mẫu thứ i thách em (id) — hiện hộp «… thách em đấu 1–1». */
  thachEm(i: number, emId: number): void { this.p.nhan(this.bots[i].kn, JSON.stringify({ t: 'thach', den: emId })) }

  private botNhan(bot: Bot, d: string | Uint8Array): void {
    if (typeof d === 'string') {
      const j = JSON.parse(d)
      if (j.t === 'moi') setTimeout(() => this.p.nhan(bot.kn, JSON.stringify({ t: 'nhan', tu: j.tu })), 400)
      else if (j.t === 'tran') { bot.tran = true; bot.ngamLech = 0 }
      else if (j.t === 'ket') bot.tran = false
      return
    }
    const a = docAnh(d)
    if (!a || !bot.tran) return
    bot.nhip++
    if (bot.nhip % 2) return // ~10 ý định/giây
    const toi = a.ghe.find((g) => g.id === bot.id), dich = a.ghe.filter((g) => g.id !== bot.id && !g.cho)[0]
    if (!toi || !dich) return
    const huong = Math.atan2(dich.y - toi.y, dich.x - toi.x), xa = Math.hypot(dich.x - toi.x, dich.y - toi.y)
    bot.t += 0.1
    const ne = Math.sin(bot.t * 0.9 + bot.id) > 0 ? 1 : -1
    const tien = xa > 260 ? 0.8 : xa < 170 ? -0.6 : 0
    const dx = Math.cos(huong) * tien + Math.cos(huong + Math.PI / 2) * 0.7 * ne
    const dy = Math.sin(huong) * tien + Math.sin(huong + Math.PI / 2) * 0.7 * ne
    bot.ngamLech = (Math.random() - 0.5) * 0.5
    const ban = this.botBan && xa < 430 && Math.random() < 0.55
    bot.seq = (bot.seq + 1) & 0xff
    this.p.nhan(bot.kn, maYDinh(bot.seq, { dx, dy, ngam: huong + bot.ngamLech, ban }))
  }
}

/** Nối một máy em (gửi/nhận như WebSocket) vào phòng mẫu. */
export function noiMayEm(phong: PhongMau, guiVeMay: (d: string | Uint8Array) => void, dongMay: (ma: number, ly: string) => void) {
  let kn: KetNoi | null = null
  return {
    nhan(d: string | Uint8Array): void {
      if (typeof d === 'string') {
        if (d === '{"t":"ping"}') { guiVeMay('{"t":"pong"}'); return }
        const j = JSON.parse(d)
        if (j.t === 'vao') {
          kn = { gui: guiVeMay, dong: dongMay, ghiKem: () => {} }
          phong.p.vao(kn, { c: '123456', s: '12121', t: 'Khánh Ngọc', h: Date.now() + 3600_000 }, Number(j.nt) || 0, !!j.an, !!j.km)
          return
        }
      }
      if (kn) phong.p.nhan(kn, d)
    },
    dong(): void { if (kn) phong.p.roi(kn) },
  }
}
