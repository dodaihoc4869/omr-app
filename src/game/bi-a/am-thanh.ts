// BI-A PHẢN ỨNG · ÂM THANH MÔ PHỎNG (đặc tả 8.7). Tổng hợp bằng Web Audio, KHÔNG tệp âm thanh.
// Chuỗi: từng tiếng → lệch trái/phải (theo vị trí bi TRÊN MÀN) → tổng → bộ nén → loa; nhánh vang phòng (xung tổng hợp 0,9 giây, 16%).
// Độ to theo vận tốc va chạm thật từ lõi vật lý; va chạm trong một khung hình được gom (tối đa 5 tiếng bi + 3 tiếng băng to nhất).
// Tắt/bật dùng chung khoá 'game-battle-muted' với các game khác (battle-audio.ts). Mở khoá ở thao tác chạm/phím đầu tiên (luật trình duyệt).
import { battleMuted, setBattleMuted } from '../than-thu-v2/battle-audio'

export type TenTieng = 'bi' | 'bang' | 'co' | 'lo' | 'dat' | 'phan' | 'an' | 'dung' | 'sai' | 'vang' | 'loi' | 'luot' | 'tich' | 'mo' | 'thang'
export const DS_TIENG: readonly TenTieng[] = ['co', 'bi', 'bang', 'lo', 'dat', 'phan', 'an', 'dung', 'sai', 'vang', 'loi', 'luot', 'tich', 'mo', 'thang']
type Ctx = AudioContext

export class AmThanhBia {
  ctx: Ctx | null = null
  private noise: AudioBuffer | null = null
  private master: GainNode | null = null
  private rv: ConvolverNode | null = null
  private hang: { k: 'bi' | 'bang'; v: number; pan: number; kho: boolean }[] = []
  tat: boolean
  private taoCtx: () => Ctx | null
  constructor(taoCtx: () => Ctx | null = () => { const C = (globalThis as { AudioContext?: new () => Ctx; webkitAudioContext?: new () => Ctx }).AudioContext ?? (globalThis as { webkitAudioContext?: new () => Ctx }).webkitAudioContext; return C ? new C() : null }) {
    this.taoCtx = taoCtx
    this.tat = battleMuted()
  }
  /** Tạo/mở khoá ngữ cảnh — gọi trong thao tác chạm/phím. Đã `chuanBi` từ trước ⇒ chỉ còn `resume` (nhẹ). */
  mo(): void {
    try {
      if (!this.ctx && !this.taoNen()) return
      if (!this.rv) this.taoVang()
      if (this.ctx!.state === 'suspended') void this.ctx!.resume().catch(() => {})
    } catch { /* âm thanh không bao giờ chặn ván */ }
  }
  /**
   * Dựng sẵn ngữ cảnh + tiếng ồn + vang phòng NGOÀI thao tác chạm (máy yếu 30/09): đo CPU chậm 6× thấy lần chạm bàn ĐẦU TIÊN có long task
   * 150–350 ms do dựng phần này trong `mo()` (có sẵn từ trước). Ngữ cảnh tạo lúc chưa chạm thì ở trạng thái "suspended" — chạm đầu chỉ `resume`.
   * Chia hai lượt (nền, rồi vang) để mỗi lượt ngắn hơn.
   */
  chuanBi(): void {
    try {
      if (this.ctx || !this.taoNen()) return
      const c = this.ctx
      setTimeout(() => { try { if (this.ctx === c && !this.rv) this.taoVang() } catch { /* bỏ qua */ } }, 250)
    } catch { /* âm thanh không bao giờ chặn ván */ }
  }
  private taoNen(): boolean {
    const c = this.taoCtx()
    if (!c) return false
    this.ctx = c
    const len = c.sampleRate, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
    this.noise = buf
    const nen = c.createDynamicsCompressor()
    nen.threshold.value = -14; nen.knee.value = 12; nen.ratio.value = 4; nen.attack.value = 0.003; nen.release.value = 0.15
    nen.connect(c.destination)
    this.master = c.createGain(); this.master.gain.value = this.tat ? 0 : 0.9; this.master.connect(nen)
    return true
  }
  private taoVang(): void {
    const c = this.ctx
    if (!c || !this.master || this.rv) return
    const rl = Math.floor(c.sampleRate * 0.9), ir = c.createBuffer(2, rl, c.sampleRate)
    for (let ch = 0; ch < 2; ch++) { const x = ir.getChannelData(ch); for (let i = 0; i < rl; i++) { const t = i / c.sampleRate; x[i] = (Math.random() * 2 - 1) * Math.exp(-t * 6.5) * (t < 0.012 ? t / 0.012 : 1) } }
    this.rv = c.createConvolver(); this.rv.buffer = ir
    const rg = c.createGain(); rg.gain.value = 0.16; this.rv.connect(rg); rg.connect(this.master)
    // Không có tiếng lăn trên nỉ (thầy bỏ hẳn 28/09): bi đang lăn thì im, chỉ phát tiếng va chạm / rơi lỗ / tín hiệu.
  }
  datTat(tat: boolean): void {
    this.tat = tat
    setBattleMuted(tat)
    if (!tat) this.mo()
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(tat ? 0 : 0.9, this.ctx.currentTime, 0.02)
  }
  private chay(): boolean { return !this.tat && !!this.ctx && this.ctx.state === 'running' && !!this.master }
  private daPhat(vang: number, pan: number): GainNode {
    const c = this.ctx!, g = c.createGain()
    let o: AudioNode = g
    if (pan && typeof c.createStereoPanner === 'function') { const p = c.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); o = p }
    o.connect(this.master!)
    if (vang > 0 && this.rv) { const s = c.createGain(); s.gain.value = vang; o.connect(s); s.connect(this.rv) }
    return g
  }
  private tone(out: AudioNode, t: number, f: number, dur: number, vol: number, type: OscillatorType = 'sine', f1?: number): void {
    const c = this.ctx!, o = c.createOscillator(), g = c.createGain()
    o.type = type; o.frequency.setValueAtTime(f, t)
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    o.connect(g); g.connect(out); o.start(t); o.stop(t + dur + 0.03)
  }
  private nhieu(out: AudioNode, t: number, dur: number, vol: number, type: BiquadFilterType, f: number, q = 1, f1?: number): void {
    const c = this.ctx!, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain()
    s.buffer = this.noise; fl.type = type; fl.frequency.setValueAtTime(f, t)
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur)
    fl.Q.value = q
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t + 0.0015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
    s.connect(fl); fl.connect(g); g.connect(out); s.start(t, Math.random() * Math.max(0, 0.95 - dur)); s.stop(t + dur + 0.03)
  }
  /** Tạo một tiếng tại thời điểm t. v: vận tốc va chạm (đv/s) hoặc tốc độ cú đánh. */
  private tao(k: TenTieng, t: number, v: number, pan: number, kho = false): void {
    switch (k) {
      case 'bi': { // bi nhựa phenolic chạm nhau: "cạch" sáng, 3 tần số không hoà âm, tắt rất nhanh
        const kk = Math.min(1, Math.pow(v / 1800, 0.8)); if (kk < 0.03) return
        const o = this.daPhat(kho ? 0 : 0.25, pan), f = 2700 + Math.random() * 900
        this.tone(o, t, f, 0.028, 0.34 * kk); this.tone(o, t, f * 1.53, 0.018, 0.2 * kk); this.tone(o, t, f * 2.31, 0.012, 0.12 * kk); this.nhieu(o, t, 0.012, 0.28 * kk, 'highpass', 3500); this.tone(o, t, 480, 0.02, 0.06 * kk); return
      }
      case 'bang': { const kk = Math.min(1, v / 2200); if (kk < 0.04) return; const o = this.daPhat(0.2, pan); this.nhieu(o, t, 0.06, 0.55 * kk, 'lowpass', 320, 0.8); this.tone(o, t, 120, 0.07, 0.35 * kk, 'sine', 70); this.nhieu(o, t, 0.018, 0.1 * kk, 'bandpass', 1100, 2); return }
      case 'co': { const kk = 0.25 + 0.75 * Math.min(1, v / 2600), o = this.daPhat(0.2, pan); this.nhieu(o, t, 0.014, 0.5 * kk, 'bandpass', 1700, 1.2); this.tone(o, t, 820, 0.03, 0.22 * kk, 'triangle', 600); this.tone(o, t, 190, 0.05, 0.18 * kk, 'sine', 120); if (kk > 0.8) this.nhieu(o, t, 0.008, 0.25 * kk, 'highpass', 4500); return }
      case 'lo': { // chạm túi da rồi lọc cọc trong máng hứng (không tiếng ầm kéo dài — thầy bỏ mọi tiếng lăn 28/09)
        const o = this.daPhat(0.3, pan); this.nhieu(o, t, 0.09, 0.45, 'lowpass', 420, 0.7); this.tone(o, t, 150, 0.16, 0.4, 'sine', 60)
        let tt = t + 0.16 + Math.random() * 0.06, g = 0.2
        for (let i = 0; i < 6; i++) { this.tone(o, tt, 230 + Math.random() * 90, 0.045, g, 'triangle', 160); this.nhieu(o, tt, 0.02, g * 0.6, 'bandpass', 900, 1.5); tt += 0.07 + i * 0.035; g *= 0.72 }
        return
      }
      case 'dat': { const o = this.daPhat(0.1, pan); this.nhieu(o, t, 0.03, 0.22, 'lowpass', 600); this.tone(o, t, 320, 0.025, 0.12); return }
      case 'phan': { const o = this.daPhat(0.05, 0); for (let i = 0; i < 5; i++) this.nhieu(o, t + i * 0.05 + Math.random() * 0.015, 0.045, 0.12, 'bandpass', 3200 + Math.random() * 1200, 2.5); return }
      case 'an': { const o = this.daPhat(0.3, pan); this.tone(o, t, 1318, 0.28, 0.1); this.tone(o, t + 0.06, 1976, 0.32, 0.07); return }
      case 'dung': { const o = this.daPhat(0.35, 0); [784, 988, 1175, 1568].forEach((f, i) => { this.tone(o, t + i * 0.075, f, 0.35, 0.12, 'triangle'); this.tone(o, t + i * 0.075, f * 2, 0.2, 0.03) }); return }
      case 'sai': { const o = this.daPhat(0.25, 0); this.tone(o, t, 330, 0.22, 0.13, 'triangle', 300); this.tone(o, t + 0.16, 247, 0.34, 0.13, 'triangle', 220); this.nhieu(o, t, 0.2, 0.03, 'lowpass', 500); return }
      case 'vang': { const o = this.daPhat(0.45, 0); [1047, 1319, 1568, 2093, 2637].forEach((f, i) => { this.tone(o, t + i * 0.05, f, 0.5, 0.06); this.tone(o, t + i * 0.05, f * 1.003, 0.5, 0.04) }); return }
      case 'loi': { const o = this.daPhat(0.2, 0); this.tone(o, t, 392, 0.12, 0.09, 'sawtooth', 370); this.tone(o, t + 0.16, 330, 0.2, 0.09, 'sawtooth', 300); return }
      case 'luot': { const o = this.daPhat(0.2, 0); this.tone(o, t, 660, 0.09, 0.07, 'sine', 880); return }
      case 'tich': { const o = this.daPhat(0.05, 0); this.nhieu(o, t, 0.02, 0.16, 'bandpass', 2400, 4); this.tone(o, t, 1800, 0.015, 0.05); return }
      case 'mo': { const o = this.daPhat(0.1, 0); this.nhieu(o, t, 0.22, 0.1, 'bandpass', 900, 0.8, 2600); return }
      case 'thang': {
        const o = this.daPhat(0.4, 0)
        ;[523, 659, 784, 1047].forEach((f, i) => this.tone(o, t + i * 0.13, f, 0.4, 0.11, 'triangle'))
        this.tone(o, t + 0.52, 1047, 0.9, 0.1, 'triangle'); this.tone(o, t + 0.52, 1319, 0.9, 0.07, 'triangle'); this.tone(o, t + 0.52, 1568, 0.9, 0.06, 'triangle')
        for (let i = 0; i < 70; i++) { const tt = t + 0.3 + Math.random() * 1.8, a = 0.05 + Math.random() * 0.07 * (1 - (tt - t - 0.3) / 2.2); this.nhieu(o, tt, 0.018, Math.max(0.005, a), 'bandpass', 1500 + Math.random() * 1500, 1.2) }
      }
    }
  }
  phat(k: TenTieng, v = 0, pan = 0): void { if (!this.chay()) return; try { this.tao(k, this.ctx!.currentTime + 0.005, v, pan) } catch { /* bỏ qua */ } }
  /** Va chạm trong khung hình: gom lại, phát ở `xa()`. `kho`: không vang phòng (cú phá bàn). */
  gom(k: 'bi' | 'bang', v: number, pan: number, kho = false): void { this.hang.push({ k, v, pan, kho }) }
  /** Phát tối đa 5 tiếng bi + 3 tiếng băng to nhất của khung, lệch nhau vài mili giây. Trả số tiếng đã phát. */
  xa(): number {
    if (!this.hang.length) return 0
    const h = this.hang.sort((a, b) => b.v - a.v)
    this.hang = []
    if (!this.chay()) return 0
    let nb = 0, nc = 0
    const t0 = this.ctx!.currentTime + 0.005
    for (const e of h) {
      if (e.k === 'bi') { if (nb >= 5) continue; nb++ } else { if (nc >= 3) continue; nc++ }
      try { this.tao(e.k, t0 + (nb + nc - 1) * 0.004 + Math.random() * 0.003, e.v, e.pan, e.kho) } catch { /* bỏ qua */ }
    }
    return nb + nc
  }
  dong(): void { try { void this.ctx?.close() } catch { /* bỏ qua */ } this.ctx = null; this.master = null; this.rv = null }
}
