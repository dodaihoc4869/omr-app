// TIẾNG THƯỞNG PHẠT (HIEU-UNG.md «Âm thanh bổ sung», thầy 26/10) — cùng bộ tổng hợp với am-thanh.ts: Web Audio, KHÔNG tệp âm thanh. Mỗi tiếng = danh sách
// «giọng» (chuông / ấm như am-thanh.ts) + thêm «ồn lọc» (tiếng ồn trắng qua bộ lọc thông dải, tần số lướt) cho lửa «phừng», ống nghiệm vỡ, xì hơi thăng hoa.
// Chỉ kêu khi <html data-trong="hs">, em chưa tắt «Âm thanh» (localStorage 'ddh.am' ≠ 'tat') và tab đang hiện. AudioContext tạo lười, dùng lại. Lỗi im lặng.
// Nằm trong mảnh nạp lười của các màn thưởng (không vào nhóm mở app). Màn kiểm tra đang mở (cờ dangCheDoThi của am-thanh.ts, thầy 27/10) ⇒ im lặng hẳn.
import { duocPhanHoi } from './rung'
import { dangCheDoThi } from './am-thanh'

export type KieuTiengThuong = 'combo' | 'tinhThe' | 'ruong' | 'lenHang' | 'roiHang' | 'chuoi' | 'vo' | 'thangHoa' | 'set' | 'tick'
type Giong = { t: number; f: number; f2?: number; d: number; a?: number; g: number; p?: [number, number][] }
type On = { t: number; d: number; f: number; f2: number; q: number; g: number }
const CHUONG: [number, number][] = [[1, 1], [2, 0.32], [3, 0.12], [4.2, 0.05]]
const MEM: [number, number][] = [[1, 1], [3, 0.08]]
// thang C trưởng từ C6 — combo đi lên một nốt mỗi bậc
const THANG = [1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 1760, 1975.53, 2093]

export function tiengThuong(kieu: KieuTiengThuong, bac = 0): { giong: Giong[]; on: On[] } {
  switch (kieu) {
    case 'combo': { const f = THANG[Math.max(0, Math.min(THANG.length - 1, bac))]!; return { giong: [{ t: 0, f, d: 0.35, a: 0.004, g: 0.2, p: CHUONG }, { t: 0.06, f: f * 1.5, d: 0.3, a: 0.004, g: 0.12, p: CHUONG }], on: [] } }
    case 'tinhThe': return { giong: [{ t: 0, f: 2637, d: 0.09, a: 0.002, g: 0.12, p: [[1, 1], [2.7, 0.3]] }, { t: 0.05, f: 3520, d: 0.12, a: 0.002, g: 0.1, p: [[1, 1]] }], on: [] }
    case 'ruong': return {
      giong: [{ t: 0, f: 180, f2: 120, d: 0.12, a: 0.004, g: 0.22, p: MEM }, { t: 0.22, f: 1567.98, d: 0.4, a: 0.003, g: 0.16, p: CHUONG }, { t: 0.3, f: 2093, d: 0.45, a: 0.003, g: 0.14, p: CHUONG }, { t: 0.38, f: 2637, d: 0.5, a: 0.003, g: 0.12, p: CHUONG }, { t: 0.46, f: 3135.96, d: 0.4, a: 0.002, g: 0.08, p: [[1, 1]] }],
      on: [{ t: 0.18, d: 0.12, f: 2500, f2: 6000, q: 1.2, g: 0.08 }],
    }
    case 'lenHang': return { giong: [523.25, 659.25, 783.99, 1046.5].map((f, i) => ({ t: i * 0.13, f, d: i === 3 ? 0.9 : 0.32, a: 0.006, g: 0.2, p: CHUONG })).concat([{ t: 0.39, f: 261.63, d: 0.9, a: 0.02, g: 0.14, p: MEM }, { t: 0.39, f: 392, d: 0.9, a: 0.02, g: 0.1, p: MEM }]), on: [] }
    case 'roiHang': return { giong: [{ t: 0, f: 392, d: 0.3, a: 0.01, g: 0.22, p: MEM }, { t: 0.2, f: 311.13, f2: 300, d: 0.5, a: 0.01, g: 0.22, p: MEM }], on: [] }
    case 'chuoi': return { giong: [{ t: 0.16, f: 1318.51, d: 0.5, a: 0.004, g: 0.16, p: CHUONG }, { t: 0.24, f: 1975.53, d: 0.6, a: 0.004, g: 0.14, p: CHUONG }], on: [{ t: 0, d: 0.32, f: 300, f2: 2400, q: 0.8, g: 0.28 }] }
    case 'vo': return { giong: [{ t: 0.02, f: 3951.07, d: 0.12, a: 0.001, g: 0.08, p: [[1, 1]] }, { t: 0.07, f: 3135.96, d: 0.14, a: 0.001, g: 0.07, p: [[1, 1]] }, { t: 0.13, f: 4698.63, d: 0.1, a: 0.001, g: 0.05, p: [[1, 1]] }], on: [{ t: 0, d: 0.09, f: 4000, f2: 2500, q: 0.9, g: 0.3 }] }
    case 'thangHoa': return { giong: [], on: [{ t: 0, d: 0.7, f: 5000, f2: 600, q: 0.7, g: 0.22 }] }
    // 27/10 mốc combo: SÉT NỔ ngắn — ồn lọc quét từ cao xuống (tiếng «rắc») + ồn trầm + âm trầm nổ lướt xuống
    case 'set': return { giong: [{ t: 0.02, f: 92, f2: 38, d: 0.42, a: 0.004, g: 0.42, p: [[1, 1], [2, 0.25]] }], on: [{ t: 0, d: 0.16, f: 6500, f2: 900, q: 0.6, g: 0.34 }, { t: 0.04, d: 0.5, f: 900, f2: 110, q: 0.7, g: 0.3 }] }
    // 27/10 kết chặng: «tích» rất nhẹ khi số đếm tăng
    case 'tick': return { giong: [{ t: 0, f: 2300, d: 0.025, a: 0.001, g: 0.05, p: [[1, 1]] }], on: [] }
  }
}

let ctx: AudioContext | null = null
let tong: GainNode | null = null
let ondem: AudioBuffer | null = null
function layCtx(): AudioContext | null {
  if (!ctx) {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    const C = w.AudioContext ?? w.webkitAudioContext
    if (!C) return null
    const moi = new C()
    tong = moi.createGain(); tong.gain.value = 0.8; tong.connect(moi.destination)
    ctx = moi
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  return ctx
}
function bufOn(c: AudioContext): AudioBuffer {
  if (!ondem) {
    ondem = c.createBuffer(1, Math.floor(c.sampleRate * 0.8), c.sampleRate)
    const d = ondem.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return ondem
}

export function phatThuong(kieu: KieuTiengThuong, bac = 0): void {
  if (dangCheDoThi() || !duocPhanHoi('ddh.am') || typeof document === 'undefined' || document.hidden) return
  try {
    const c = layCtx()
    if (!c || !tong) return
    const goc = c.currentTime + 0.01
    const { giong, on } = tiengThuong(kieu, bac)
    for (const v of giong) {
      const p = v.p ?? [[1, 1]], a = v.a ?? 0.005, t0 = goc + v.t
      const tb = p.reduce((s, [, b]) => s + b, 0)
      for (const [boi, bien] of p) {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(v.f * boi, t0)
        if (v.f2) o.frequency.exponentialRampToValueAtTime(v.f2 * boi, t0 + v.d)
        g.gain.setValueAtTime(0, t0)
        g.gain.linearRampToValueAtTime((v.g * bien) / tb, t0 + a)
        g.gain.setTargetAtTime(0.0001, t0 + a, 1 / (1 / v.d + (boi - 1) * 2.2))
        o.connect(g); g.connect(tong)
        o.start(t0); o.stop(t0 + v.d * 3.5)
      }
    }
    for (const n of on) {
      const t0 = goc + n.t
      const s = c.createBufferSource(); s.buffer = bufOn(c)
      const loc = c.createBiquadFilter(); loc.type = 'bandpass'; loc.Q.value = n.q
      loc.frequency.setValueAtTime(n.f, t0); loc.frequency.exponentialRampToValueAtTime(n.f2, t0 + n.d)
      const g = c.createGain()
      g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(n.g, t0 + 0.01); g.gain.setTargetAtTime(0.0001, t0 + n.d * 0.6, n.d / 3)
      s.connect(loc); loc.connect(g); g.connect(tong)
      s.start(t0); s.stop(t0 + n.d * 1.6)
    }
  } catch { /* máy không phát được: bỏ qua */ }
}
