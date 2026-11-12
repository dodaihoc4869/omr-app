// ÂM THANH của trò «Sinh Tồn» (thầy 12/11 tối: «thêm âm thanh bắn súng cho phấn khích») — tổng hợp bằng Web Audio, KHÔNG tệp âm thanh (không thêm byte tải).
// Mỗi cấp súng một tiếng riêng: Súng Hạt «piu» · Súng Đôi «piu-piu» · Súng Sấm «xẹt» · Pháo Sao «bùm»; thêm tiếng trúng đạn, hạ đối thủ, lên cấp, bị hạ,
// nhặt hộp, hết ván. AudioContext tạo lười ở lần chạm đầu (luật trình duyệt). Im lặng khi: em tắt tiếng trò, em đã tắt «Âm thanh» của app
// (localStorage 'ddh.am' = 'tat'), tab đang ẩn. Tiếng súng của người khác nhỏ dần theo khoảng cách và có trần số tiếng cùng lúc. Mọi lỗi im lặng.
let ctx: AudioContext | null = null
let tong: GainNode | null = null
let on: AudioBuffer | null = null
let tat = false
/** Mốc giờ (giây của AudioContext) các tiếng súng gần đây — để giữ trần 7 tiếng / 0,25 giây. */
const ganDay: number[] = []
const KHOA_TAT = 'ddh.sinhton.am'

export function docTat(): boolean {
  try { tat = localStorage.getItem(KHOA_TAT) === 'tat' } catch { /* không có kho */ }
  return tat
}
export function datTat(v: boolean): void {
  tat = v
  try { if (v) localStorage.setItem(KHOA_TAT, 'tat'); else localStorage.removeItem(KHOA_TAT) } catch { /* không có kho */ }
}
/** Gọi trong một lần CHẠM của em: tạo / đánh thức AudioContext. */
export function moAm(): void {
  try {
    if (!ctx) {
      const Lop = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Lop) return
      ctx = new Lop()
      const nen = ctx.createDynamicsCompressor()
      tong = ctx.createGain(); tong.gain.value = 0.5
      tong.connect(nen); nen.connect(ctx.destination)
      // Một giây tiếng ồn trắng dùng chung cho tiếng nổ / tiếng xẹt.
      on = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
      const d = on.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    }
    if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  } catch { ctx = null }
}
function duocKeu(): boolean {
  if (tat || !ctx || !tong || ctx.state !== 'running' || document.hidden) return false
  try { return localStorage.getItem('ddh.am') !== 'tat' } catch { return true }
}
/** Một nốt: lướt tần số f → f2 trong `dai` giây, tắt dần. */
function not(kieu: OscillatorType, f: number, f2: number, dai: number, am: number, tre = 0): void {
  if (!ctx || !tong) return
  const t = ctx.currentTime + tre, o = ctx.createOscillator(), g = ctx.createGain()
  o.type = kieu
  o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dai)
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(am, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dai)
  o.connect(g); g.connect(tong)
  o.start(t); o.stop(t + dai + 0.02)
}
/** Một cụm tiếng ồn qua bộ lọc (nổ, xẹt, trúng đạn). */
function tiengOn(loc: BiquadFilterType, tan: number, dai: number, am: number, tre = 0): void {
  if (!ctx || !tong || !on) return
  const t = ctx.currentTime + tre, s = ctx.createBufferSource(), l = ctx.createBiquadFilter(), g = ctx.createGain()
  s.buffer = on
  l.type = loc; l.frequency.value = tan
  g.gain.setValueAtTime(am, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dai)
  s.connect(l); l.connect(g); g.connect(tong)
  s.start(t, Math.random() * 0.5, dai + 0.02)
}
/** Tiếng súng theo cấp 1..4. `cuaToi` = súng của chính em (to, luôn kêu); của người khác thì `gan` 0..1 (1 = sát bên) quyết định độ to. */
export function tiengBan(cap: number, cuaToi: boolean, gan = 1): void {
  if (!duocKeu() || !ctx) return
  const t = ctx.currentTime
  while (ganDay.length && t - ganDay[0] > 0.25) ganDay.shift()
  if (!cuaToi && (ganDay.length >= 7 || gan < 0.12)) return
  ganDay.push(t)
  const am = cuaToi ? 1 : 0.4 * gan, lech = 0.94 + Math.random() * 0.12
  try {
    if (cap >= 4) { not('sine', 170 * lech, 42, 0.36, 0.55 * am); tiengOn('lowpass', 700, 0.3, 0.4 * am); not('triangle', 520, 180, 0.12, 0.12 * am) }
    else if (cap === 3) { not('sawtooth', 1900 * lech, 420, 0.13, 0.11 * am); not('square', 2600 * lech, 900, 0.07, 0.05 * am); tiengOn('highpass', 3200, 0.1, 0.1 * am) }
    else if (cap === 2) { not('triangle', 1050 * lech, 360, 0.085, 0.2 * am); not('triangle', 1250 * lech, 420, 0.085, 0.18 * am, 0.055) }
    else not('triangle', 900 * lech, 300, 0.1, 0.22 * am)
  } catch { /* nút âm thanh hỏng: bỏ qua */ }
}
export type TiengTro = 'trung' | 'ha' | 'lenCap' | 'biHa' | 'hop' | 'hetVan'
export function tieng(kieu: TiengTro): void {
  if (!duocKeu()) return
  try {
    if (kieu === 'trung') tiengOn('lowpass', 900, 0.07, 0.22)
    else if (kieu === 'ha') { not('sine', 1318.5, 1318.5, 0.14, 0.2); not('sine', 1760, 1760, 0.28, 0.22, 0.08) }
    else if (kieu === 'lenCap') { not('triangle', 1046.5, 1046.5, 0.12, 0.2); not('triangle', 1318.5, 1318.5, 0.12, 0.2, 0.08); not('triangle', 1568, 1568, 0.12, 0.2, 0.16); not('triangle', 2093, 2093, 0.4, 0.22, 0.24) }
    else if (kieu === 'biHa') { not('triangle', 520, 110, 0.45, 0.28); tiengOn('lowpass', 500, 0.3, 0.2) }
    else if (kieu === 'hop') { not('sine', 1568, 1568, 0.1, 0.16); not('sine', 2093, 2093, 0.1, 0.16, 0.07); not('sine', 2637, 2637, 0.3, 0.18, 0.14) }
    else { not('triangle', 523.25, 523.25, 0.7, 0.16); not('triangle', 659.25, 659.25, 0.7, 0.14, 0.02); not('triangle', 784, 784, 0.9, 0.14, 0.04); not('sine', 1046.5, 1046.5, 1.1, 0.14, 0.16) }
  } catch { /* bỏ qua */ }
}
