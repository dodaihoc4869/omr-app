// TIẾNG ĂN MỪNG tổng hợp bằng Web Audio (bản trình diễn 02/11, phần SND) — KHÔNG tệp âm thanh. MẶC ĐỊNH TẮT: chỉ kêu khi em bật «Tiếng ăn mừng» ở menu
// (localStorage 'ddh.am-an-mung' = 'bat'), «Âm thanh» chung chưa tắt, không ở màn kiểm tra, tab đang hiện. AudioContext tạo lười ở lần kêu đầu (sau khi em
// đã chạm — luật trình duyệt), dùng lại; qua bộ nén ⇒ nhiều tiếng chồng không vỡ. Mọi lỗi im lặng.
import { amAnMungBat, KHOA_AM_AN_MUNG } from './dieu-kien'
import { dangCheDoThi } from '../am-thanh'

function duocKeu(): boolean {
  if (typeof document === 'undefined' || document.hidden || document.documentElement.dataset.trong !== 'hs') return false
  try { return amAnMungBat({ am: localStorage.getItem('ddh.am'), anMung: localStorage.getItem(KHOA_AM_AN_MUNG), dangThi: dangCheDoThi() }) } catch { return false }
}

let ac: AudioContext | null = null, ra: GainNode | null = null, on: AudioBuffer | null = null
function san(): AudioContext | null {
  if (!duocKeu()) return null
  try {
    if (!ac) {
      const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
      const A = w.AudioContext ?? w.webkitAudioContext
      if (!A) return null
      const c = new A(), nen = c.createDynamicsCompressor()
      ra = c.createGain(); ra.gain.value = 0.6
      ra.connect(nen); nen.connect(c.destination)
      const len = c.sampleRate, b = c.createBuffer(1, len, len), d = b.getChannelData(0)
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
      on = b; ac = c
    }
    if (ac.state === 'suspended') void ac.resume().catch(() => {})
    return ac
  } catch { return null }
}

/** Một nốt: tần số f (lướt tới `toi`), bắt đầu sau t giây, dài d giây. */
export function not(f: number, t = 0, d = 0.15, o: { kieu?: OscillatorType; toi?: number; v?: number; a?: number } = {}): void {
  const c = san()
  if (!c || !ra) return
  try {
    const t0 = c.currentTime + t, os = c.createOscillator(), g = c.createGain()
    os.type = o.kieu ?? 'sine'; os.frequency.setValueAtTime(f, t0)
    if (o.toi) os.frequency.exponentialRampToValueAtTime(o.toi, t0 + d)
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.v ?? 0.2, t0 + (o.a ?? 0.006)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
    os.connect(g); g.connect(ra); os.start(t0); os.stop(t0 + d + 0.05)
  } catch { /* bỏ qua */ }
}

/** Tiếng ồn lọc (phụt lửa, sấm, lách cách). */
export function on_(t = 0, d = 0.2, o: { loc?: BiquadFilterType; hz?: number; toi?: number; q?: number; v?: number; a?: number } = {}): void {
  const c = san()
  if (!c || !ra || !on) return
  try {
    const t0 = c.currentTime + t, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain()
    s.buffer = on; f.type = o.loc ?? 'bandpass'; f.frequency.setValueAtTime(o.hz ?? 1200, t0); f.Q.value = o.q ?? 1
    if (o.toi) f.frequency.exponentialRampToValueAtTime(o.toi, t0 + d)
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(o.v ?? 0.3, t0 + (o.a ?? 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + d)
    s.connect(f); f.connect(g); g.connect(ra); s.start(t0, Math.random() * 0.5); s.stop(t0 + d + 0.05)
  } catch { /* bỏ qua */ }
}
