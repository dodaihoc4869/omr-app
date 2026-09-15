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

  /**
   * TIẾNG KÊU ĐẶC TRƯNG CỦA TỪNG HỆ — chạm vào thú là nó kêu.
   *
   * Sáu hệ sáu giọng, dựng từ chính tính chất hoá học của hệ:
   *   · Hoả      — gầm trầm trượt lên, như luồng lửa bén
   *   · Khí      — rít cao trượt xuống, như khí thoát qua khe hẹp
   *   · Base     — hai nốt trong, gọn, như tinh thể chạm nhau
   *   · Acid     — xèo xèo răng cưa trượt xuống, như ăn mòn
   *   · Điện hoá — tách nảy hai nhịp, như tia phóng điện
   *   · Hữu cơ   — ba nốt tròn nối nhau, như chuỗi carbon
   */
  keu(he: string): void {
    if (!this.bat) return
    switch (he) {
      case 'hoa':
        this.phatAm(150, 0.34, 'sawtooth', 0.09, 210)
        setTimeout(() => this.phatAm(260, 0.2, 'triangle', 0.05, 120), 90)
        break
      case 'khi':
        this.phatAm(1180, 0.26, 'sine', 0.06, -560)
        setTimeout(() => this.phatAm(880, 0.14, 'sine', 0.04, -300), 110)
        break
      case 'kiem':
        this.phatAm(880, 0.14, 'sine', 0.07)
        setTimeout(() => this.phatAm(1320, 0.22, 'sine', 0.06), 105)
        break
      case 'axit':
        this.phatAm(520, 0.3, 'sawtooth', 0.07, -260)
        setTimeout(() => this.phatAm(300, 0.22, 'square', 0.035, -120), 120)
        break
      case 'dien':
        this.phatAm(1500, 0.06, 'square', 0.055)
        setTimeout(() => this.phatAm(1900, 0.05, 'square', 0.05), 70)
        setTimeout(() => this.phatAm(700, 0.18, 'triangle', 0.05, -220), 140)
        break
      case 'huuco':
        [440, 554, 659].forEach((f, i) =>
          setTimeout(() => this.phatAm(f, 0.2, 'triangle', 0.06), i * 80))
        break
      default:
        this.phatAm(440, 0.2, 'triangle', 0.06)
    }
  }
}
