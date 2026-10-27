// TIẾNG PHẢN HỒI «Bi» (thầy 26/10: «Cả âm thanh hay hơn dolingo nhé») — tổng hợp bằng Web Audio, KHÔNG tệp âm thanh. Bảng tiếng chép đúng bản WAV thầy đã nghe
// (scratchpad/ve-moi/am-thanh/am.js): mỗi tiếng = danh sách «giọng» { t: giây bắt đầu, f → f2: lướt tần số trong d, d: tắt dần, a: tấn công, g: âm lượng,
// p: [[bội, biên]] hoạ âm }. Mỗi hoạ âm = một OscillatorNode sine qua GainNode; hoạ âm cao tắt nhanh hơn (như bản WAV: exp(−t·(bội−1)·2,2)).
// Chỉ kêu khi <html data-trong="hs">, em chưa tắt («Âm thanh» trong menu ⇒ localStorage 'ddh.am' = 'tat') và tab đang hiện. AudioContext tạo lười ở lần
// chạm đầu (luật trình duyệt) rồi dùng lại; 'suspended' ⇒ resume(). Mọi lỗi im lặng. Không dùng ở màn thi thật.
import { duocPhanHoi, type KieuPhanHoi } from './rung'

type Giong = { t: number; f: number; f2?: number; d: number; a?: number; g: number; p?: [number, number][] }
const CHUONG: [number, number][] = [[1, 1], [2, 0.32], [3, 0.12], [4.2, 0.05]] // chuông thuỷ tinh
const MEM: [number, number][] = [[1, 1], [3, 0.08]] // tròn, ấm
const BO = { C5: 523.25, E5: 659.25, G5: 783.99, A4: 440, F4: 349.23, C6: 1046.5, E6: 1318.51, G6: 1567.98, A6: 1760, C7: 2093 }
export const TIENG: Record<KieuPhanHoi, Giong[]> = {
  chon: [{ t: 0, f: 520, f2: 1150, d: 0.07, a: 0.004, g: 0.22, p: [[1, 1]] }],
  dung: [
    { t: 0, f: 380, f2: 980, d: 0.06, a: 0.003, g: 0.16, p: [[1, 1]] },
    { t: 0.03, f: BO.E6, d: 0.42, a: 0.004, g: 0.26, p: CHUONG },
    { t: 0.12, f: BO.A6, d: 0.6, a: 0.004, g: 0.24, p: CHUONG },
  ],
  sai: [
    { t: 0, f: BO.A4, d: 0.22, a: 0.01, g: 0.3, p: MEM },
    { t: 0.13, f: BO.F4, f2: BO.F4 * 0.97, d: 0.34, a: 0.01, g: 0.3, p: MEM },
  ],
  xong: [
    { t: 0, f: BO.C6, d: 0.35, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.09, f: BO.E6, d: 0.35, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.18, f: BO.G6, d: 0.4, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.27, f: BO.C7, d: 1.1, a: 0.004, g: 0.24, p: CHUONG },
    { t: 0.27, f: BO.C5, d: 0.9, a: 0.02, g: 0.16, p: MEM },
    { t: 0.27, f: BO.E5, d: 0.9, a: 0.02, g: 0.12, p: MEM },
    { t: 0.27, f: BO.G5, d: 0.9, a: 0.02, g: 0.12, p: MEM },
    { t: 0.42, f: 3135.96, d: 0.18, a: 0.002, g: 0.06, p: [[1, 1]] },
    { t: 0.52, f: 3951.07, d: 0.16, a: 0.002, g: 0.05, p: [[1, 1]] },
    { t: 0.6, f: 3520, d: 0.2, a: 0.002, g: 0.05, p: [[1, 1]] },
  ],
  // Combo (HIEU-UNG.md «Âm thanh bổ sung»): hai tiếng chuông nối nhau; mỗi bậc combo cao thêm MỘT nốt của gam trưởng (phat('combo', bac)).
  combo: [
    { t: 0, f: BO.C6, d: 0.3, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.08, f: BO.G6, d: 0.5, a: 0.004, g: 0.22, p: CHUONG },
  ],
  // Mốc combo 27/10: cùng chuông combo (lên một nốt mỗi bậc), mốc cao thêm tiếng chuông thứ ba.
  combo3: [
    { t: 0, f: BO.C6, d: 0.3, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.08, f: BO.G6, d: 0.5, a: 0.004, g: 0.22, p: CHUONG },
  ],
  combo5: [
    { t: 0, f: BO.C6, d: 0.3, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.08, f: BO.E6, d: 0.3, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.16, f: BO.G6, d: 0.55, a: 0.004, g: 0.22, p: CHUONG },
  ],
  combo10: [
    { t: 0, f: BO.C6, d: 0.3, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.08, f: BO.E6, d: 0.3, a: 0.004, g: 0.2, p: CHUONG },
    { t: 0.16, f: BO.G6, d: 0.3, a: 0.004, g: 0.22, p: CHUONG },
    { t: 0.24, f: BO.C7, d: 0.8, a: 0.004, g: 0.24, p: CHUONG },
  ],
}
/** Gam trưởng (nửa cung) cho bậc combo: 0 → C, 1 → D, 2 → E … quá 7 bậc thì giữ nốt cao nhất. */
const GAM = [0, 2, 4, 5, 7, 9, 11, 12]

let ctx: AudioContext | null = null
let tong: GainNode | null = null
function layCtx(): AudioContext | null {
  if (!ctx) {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    const C = w.AudioContext ?? w.webkitAudioContext
    if (!C) return null
    const moi = new C()
    tong = moi.createGain()
    tong.gain.value = 0.8
    tong.connect(moi.destination)
    ctx = moi
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  return ctx
}

export function phat(ten: KieuPhanHoi, bac = 0): void {
  if (!duocPhanHoi('ddh.am') || typeof document === 'undefined' || document.hidden) return
  try {
    const c = layCtx()
    if (!c || !tong) return
    const goc = c.currentTime + 0.01
    const nang = ten.startsWith('combo') ? 2 ** (GAM[Math.max(0, Math.min(GAM.length - 1, Math.round(bac)))]! / 12) : 1
    for (const v of TIENG[ten]) {
      const p = v.p ?? [[1, 1]], a = v.a ?? 0.005, t0 = goc + v.t
      const tongBien = p.reduce((s, [, b]) => s + b, 0)
      for (const [boi, bien] of p) {
        const o = c.createOscillator(), g = c.createGain()
        o.type = 'sine'
        o.frequency.setValueAtTime(v.f * boi * nang, t0)
        if (v.f2) o.frequency.exponentialRampToValueAtTime(v.f2 * boi * nang, t0 + v.d)
        const dinh = (v.g * bien) / tongBien
        g.gain.setValueAtTime(0, t0)
        g.gain.linearRampToValueAtTime(dinh, t0 + a)
        // tắt dần: 1/d + (bội − 1)·2,2 (hoạ âm cao tắt nhanh hơn — đúng bản WAV)
        g.gain.setTargetAtTime(0.0001, t0 + a, 1 / (1 / v.d + (boi - 1) * 2.2))
        o.connect(g); g.connect(tong)
        o.start(t0); o.stop(t0 + v.d * 3.5)
      }
    }
  } catch { /* máy không phát được: bỏ qua */ }
}
