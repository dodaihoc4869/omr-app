/**
 * ÂM THANH BẰNG WEB AUDIO API CHO GAME THẦN THÚ
 * Không cần bất kỳ tệp mp3 hay CDN bên ngoài nào.
 */

export class AmThanhPet {
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

  private phatAm(tanSo: number, dai: number, dang: OscillatorType, to: number, truot = 0): void {
    if (!this.bat || !this.ctx) return
    try {
      const t = this.ctx.currentTime
      const o = this.ctx.createOscillator()
      const g = this.ctx.createGain()
      o.type = dang
      o.frequency.setValueAtTime(tanSo, t)
      if (truot !== 0) o.frequency.exponentialRampToValueAtTime(Math.max(40, tanSo + truot), t + dai)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(to, t + 0.012)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dai)
      o.connect(g)
      g.connect(this.ctx.destination)
      o.start(t)
      o.stop(t + dai + 0.02)
    } catch {}
  }

  tanCong(): void {
    this.phatAm(320, 0.12, 'sawtooth', 0.08, 150)
  }

  trungDon(): void {
    this.phatAm(180, 0.18, 'triangle', 0.09, -80)
  }

  kichNo(): void {
    this.phatAm(450, 0.35, 'square', 0.12, 380)
    setTimeout(() => this.phatAm(720, 0.25, 'triangle', 0.1, -200), 100)
  }

  dungCauHoi(): void {
    const nots = [440, 554, 659, 880]
    nots.forEach((f, i) => setTimeout(() => this.phatAm(f, 0.16, 'triangle', 0.06), i * 65))
  }

  saiCauHoi(): void {
    this.phatAm(220, 0.25, 'sawtooth', 0.08, -80)
  }

  thangTran(): void {
    const n = [523, 659, 784, 1047]
    n.forEach((f, i) => setTimeout(() => this.phatAm(f, 0.22, 'triangle', 0.08), i * 90))
  }

  tienHoa(): void {
    const seq = [392, 440, 493, 523, 587, 659, 698, 784]
    seq.forEach((f, i) => setTimeout(() => this.phatAm(f, 0.15, 'sine', 0.07), i * 50))
  }
}
