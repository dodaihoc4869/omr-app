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
  /**
   * Âm rùng rợn cho cảnh mở đầu: một nốt trầm rất thấp kéo dài, chồng lên một
   * quãng nghịch (tritone) — quãng mà tai người nghe là "có gì đó không ổn".
   * Rồi ba tiếng gõ chậm dần như tim đập.
   */
  rungRon(): void {
    if (!this.bat || !this.ctx) return
    this.ke(55, 5.2, 'sine', 0.10, 8)
    this.ke(58, 5.0, 'sine', 0.07, 6)          // lệch 3 Hz: rung beat, nghe gờn gợn
    setTimeout(() => this.ke(220, 3.4, 'triangle', 0.035, -40), 400)
    setTimeout(() => this.ke(311, 3.0, 'triangle', 0.03, -50), 700)   // tritone với 220
    const nhip = [1500, 2700, 3700, 4500]
    nhip.forEach((ms, i) => setTimeout(() => this.ke(72 - i * 4, 0.34, 'sine', 0.12, -18), ms))
  }

  /** Tiếng vang lúc chữ "DŨNG CẢM LÊN" hiện ra. */
  dungCamLen(): void {
    this.ke(147, 1.5, 'sawtooth', 0.05, 40)
    setTimeout(() => this.ke(294, 1.2, 'triangle', 0.06, 30), 90)
    setTimeout(() => this.ke(440, 1.0, 'triangle', 0.05, 20), 180)
  }

  rongGam(): void { this.ke(70, 0.65, 'sawtooth', 0.11, 36) }
  lua(): void { this.ke(140, 0.5, 'sawtooth', 0.05, -70) }
}
