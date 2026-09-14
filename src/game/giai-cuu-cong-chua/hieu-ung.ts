/**
 * TỆP DUY NHẤT TRONG src/game/giai-cuu-cong-chua ĐƯỢC DÙNG `Math.random`.
 *
 * Lý do: ngẫu nhiên chỉ được phép nằm ở chỗ KHÔNG gây thua. Hạt bắn ra lệch
 * vài độ thì không ai thua vì thế. Địa hình, bot, luật dẫm đều phải suy ra
 * được — thua phải truy về một quyết định của chính em.
 */
export interface Hat {
  x: number; y: number; vx: number; vy: number
  song: number; toiDa: number; r: number; mau: string
}

export interface ChuBay {
  x: number; y: number; chu: string; mau: string; song: number; toiDa: number
}

export class KhoHieuUng {
  hat: Hat[] = []
  chu: ChuBay[] = []

  no(x: number, y: number, mauA: string, mauB: string, soHat = 18): void {
    for (let i = 0; i < soHat; i++) {
      const g = (i / soHat) * Math.PI * 2 + Math.random() * 0.3
      const v = 120 + Math.random() * 220
      this.hat.push({
        x, y,
        vx: Math.cos(g) * v, vy: Math.sin(g) * v * 0.7 + 80,
        song: 0, toiDa: 0.5 + Math.random() * 0.3,
        r: 3 + Math.random() * 5,
        mau: i % 2 ? mauA : mauB,
      })
    }
  }

  buiChan(x: number, y: number): void {
    for (let i = 0; i < 5; i++) {
      this.hat.push({
        x: x + (Math.random() - 0.5) * 24, y,
        vx: (Math.random() - 0.5) * 70, vy: 40 + Math.random() * 60,
        song: 0, toiDa: 0.28, r: 2 + Math.random() * 3, mau: 'rgba(255,255,255,.8)',
      })
    }
  }

  chuNoi(x: number, y: number, chu: string, mau: string): void {
    this.chu.push({ x, y, chu, mau, song: 0, toiDa: 1.1 })
  }

  buoc(dt: number): void {
    for (const h of this.hat) {
      h.song += dt
      h.x += h.vx * dt
      h.y += h.vy * dt
      h.vy -= 900 * dt
    }
    this.hat = this.hat.filter((h) => h.song < h.toiDa)
    for (const c of this.chu) { c.song += dt; c.y += 46 * dt }
    this.chu = this.chu.filter((c) => c.song < c.toiDa)
  }

  xoa(): void { this.hat.length = 0; this.chu.length = 0 }
}
