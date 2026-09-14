/**
 * Âm tổng hợp bằng Web Audio. KHÔNG một tệp âm thanh nào trong repo.
 * Khởi tạo ở cú chạm đầu tiên — trình duyệt di động không cho tạo trước đó.
 */
export class AmThanh {
  private ctx: AudioContext | null = null
  private bat = true

  moKhoa(): void {
    if (this.ctx) return
    type Cua = typeof AudioContext
    const W = window as unknown as { AudioContext?: Cua; webkitAudioContext?: Cua }
    const C = W.AudioContext ?? W.webkitAudioContext
    if (C) this.ctx = new C()
  }

  datBat(b: boolean): void { this.bat = b }
  dangBat(): boolean { return this.bat }

  private ke(tanSo: number, dai: number, dang: OscillatorType, to: number, truot = 0): void {
    if (!this.bat || !this.ctx) return
    const t = this.ctx.currentTime
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = dang
    o.frequency.setValueAtTime(tanSo, t)
    if (truot !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(40, tanSo + truot), t + dai)
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(to, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + dai)
    o.connect(g); g.connect(this.ctx.destination)
    o.start(t); o.stop(t + dai + 0.02)
  }

  nhay(): void { this.ke(420, 0.13, 'square', 0.05, 260) }
  khacChe(): void { this.ke(300, 0.1, 'square', 0.08, 420); setTimeout(() => this.ke(720, 0.16, 'triangle', 0.07, 260), 70) }
  biKhacChe(): void { this.ke(300, 0.28, 'sawtooth', 0.07, -190) }
  trungHoa(): void { this.ke(480, 0.18, 'triangle', 0.06, -120) }
  tro(): void { this.ke(190, 0.09, 'sine', 0.04) }
  matMang(): void { this.ke(240, 0.42, 'sawtooth', 0.08, -170) }
  thang(): void {
    const n = [523, 659, 784, 1047]
    n.forEach((f, i) => setTimeout(() => this.ke(f, 0.24, 'triangle', 0.07), i * 110))
  }
  rongGam(): void { this.ke(70, 0.65, 'sawtooth', 0.11, 36) }
  lua(): void { this.ke(140, 0.5, 'sawtooth', 0.05, -70) }
}
