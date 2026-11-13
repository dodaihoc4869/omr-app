// «TĂNG TIẾNG» CỦA MÁY THẦY (thầy 13/11: «chỉ thêm tăng tiếng thôi»; «tăng tiếng nhưng phải giữ được độ trong tiếng nhất có thể»).
// Worker khung (MA_KHUNG của src/lib/live/chuoi-tieng.ts) chạy THẬT, không luồng: hệ số khuếch đại cố định 10^(N/20) nhân TRƯỚC khâu chặn đỉnh (trần LAM_RO.tran).
//  · Gốc = y như trước: hệ số 1 nhân đúng từng bit (về Gốc sau khi đã tăng ⇒ Worker nhận { kd: 1 } mà tiếng ra không lệch bit nào so với Worker chưa từng tăng).
//  · «Làm rõ» + N: chuỗi cũ (lọc 80 Hz, nâng mức, chặn đỉnh) nhân thêm hệ số ⇒ tiếng ra to đúng N dB (chừng nào chưa chạm trần), đỉnh ≤ trần.
//  · «Chuẩn trình duyệt» + N (`chiKd`): CHỈ khuếch đại + chặn đỉnh — trung bình các kênh, không lọc 80 Hz, không nâng mức, không lọc ồn.
// Đỉnh: ≤ trần × 1,001 (khâu chặn đỉnh CŨ nhả trước khi nhân mẫu kế ⇒ có thể nhích quá trần ≈ 0,03 % ≈ 0,003 dB — y như đường «Làm rõ» trước nay).
// Phần thay.ts (track gửi, tin gửi Worker, đổi bậc không mở lại mic, chuỗi hỏng ⇒ track mic): tests/live-mic-thay-1111.test.ts mục «Tăng tiếng».
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LAM_RO, heSoTang } from '../src/lib/live/chuoi-tieng'

const MA = /const MA_KHUNG = `([\s\S]*?)`/.exec(readFileSync(resolve(__dirname, '../src/lib/live/chuoi-tieng.ts'), 'utf8'))![1]!

function taoWorker() {
  const tin: Record<string, unknown>[] = []
  class AD { d: Float32Array; constructor(o: { data: Float32Array }) { this.d = o.data } }
  let hat = 12345
  const M = Object.create(Math) as Math
  M.random = () => { hat = (hat * 1103515245 + 12345) >>> 0; return hat / 4294967296 }
  const W = new Function('postMessage', 'AudioData', 'Math', 'performance', 'importScripts', 'var onmessage;\n' + MA + '\nreturn { xuLy: xuLy, dat: function (v) { c = v; }, nhan: function (d) { onmessage({ data: d }); } };')(
    (d: Record<string, unknown>) => tin.push(d), AD, M, { now: () => 0 }, () => { throw new Error('không nạp lõi') }) as { xuLy(f: unknown): AD; dat(c: object): void; nhan(d: object): void }
  W.dat({ ...LAM_RO, g0: 0 })
  const khung = (x: Float32Array, kenh = 1): Float32Array => W.xuLy({ numberOfFrames: x.length, numberOfChannels: kenh, sampleRate: 48000, timestamp: 0, copyTo: (d: Float32Array) => d.set(x), close: () => undefined }).d
  return { W, tin, khung }
}
/** Giọng tổng hợp có quãng nghỉ (bộ nâng mức của «Làm rõ» chạy), biên độ `bien`. */
function tieng(k: number, bien = 1, n = 480): Float32Array {
  const x = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = k * n + i, bao = k % 90 < 55 ? 0.5 + 0.5 * Math.sin(t * 0.0004) : 0.02
    x[i] = bien * (bao * (0.12 * Math.sin(t * 0.031) + 0.05 * Math.sin(t * 0.217)) + 0.004 * Math.sin(t * 1.913))
  }
  return x
}
const dinh = (x: Float32Array): number => x.reduce((m, v) => Math.max(m, Math.abs(v)), 0)
const rms = (x: Float32Array): number => Math.sqrt(x.reduce((s, v) => s + v * v, 0) / x.length)

describe('Tăng tiếng trong Worker khung', () => {
  it('GỐC giống từng bit: Worker từng tăng rồi về Gốc ({ kd: 1 }) ra y hệt Worker chưa từng nhận tin tăng tiếng', () => {
    const a = taoWorker(), b = taoWorker()
    for (let k = 0; k < 400; k++) {
      if (k === 0) b.W.nhan({ kd: 1, chiKd: false })
      const x = tieng(k), kenh = k % 97 === 3 ? 2 : 1
      expect(Array.from(b.khung(x.slice(), kenh))).toEqual(Array.from(a.khung(x.slice(), kenh)))
    }
    expect(b.tin).toEqual(a.tin)
  })
  it('«Làm rõ» + 6 dB: cùng chuỗi cũ, tiếng ra to hơn đúng ≈ 6 dB (chưa chạm trần); đỉnh không vượt trần', () => {
    const a = taoWorker(), b = taoWorker()
    b.W.nhan({ kd: heSoTang(6), chiKd: false })
    let ea = 0, eb = 0, dinhB = 0
    for (let k = 0; k < 600; k++) {
      const x = tieng(k, 0.5)
      const ya = a.khung(x.slice()), yb = b.khung(x.slice())
      dinhB = Math.max(dinhB, dinh(yb))
      if (k > 10 && dinh(ya) * heSoTang(6) < LAM_RO.tran * 0.95) { ea += rms(ya) ** 2; eb += rms(yb) ** 2 }
    }
    expect(10 * Math.log10(eb / ea)).toBeCloseTo(6, 1)
    expect(dinhB).toBeLessThanOrEqual(LAM_RO.tran * 1.001)
  })
  it('«Chuẩn trình duyệt» + N (chiKd): CHỈ nhân hệ số — ra = vào × 10^(N/20) (trung bình các kênh), không lọc / không nâng mức; to quá ⇒ chặn ở trần', () => {
    for (const db of [3, 6, 9]) {
      const w = taoWorker()
      w.W.nhan({ kd: heSoTang(db), chiKd: true })
      w.khung(tieng(0, 0.3)) // khung đầu: hệ số trượt từ 1 lên
      for (let k = 1; k < 60; k++) {
        const x = tieng(k, 0.3), kenh = k % 2 ? 2 : 1 // hai kênh giống nhau ⇒ trung bình = một kênh (không gấp đôi)
        const y = w.khung(x.slice(), kenh)
        for (let i = 0; i < x.length; i += 37) expect(y[i]!).toBeCloseTo(x[i]! * heSoTang(db), 5)
      }
      // tiếng rất to ⇒ đỉnh ≤ trần, không vỡ thành số lạ
      for (let k = 60; k < 120; k++) { const y = w.khung(tieng(k, 4)); expect(dinh(y)).toBeLessThanOrEqual(LAM_RO.tran * 1.001); expect(y.every(Number.isFinite)).toBe(true) }
    }
  })
  it('đổi bậc giữa chừng: hệ số trượt trong MỘT khung (không bậc nhảy), về Gốc trên đường «Chuẩn» (chiKd tắt) ⇒ lại đúng đường cũ', () => {
    const w = taoWorker()
    w.W.nhan({ kd: heSoTang(6), chiKd: true })
    for (let k = 0; k < 5; k++) w.khung(tieng(k, 0.3))
    w.W.nhan({ kd: heSoTang(9), chiKd: true })
    const x = tieng(5, 0.3), y = w.khung(x.slice())
    expect(y[0]! / x[0]!).toBeGreaterThan(heSoTang(6) - 0.01)
    expect(y[479]! / x[479]!).toBeCloseTo(heSoTang(9), 4)
    const tiLe = Array.from(y).map((v, i) => (Math.abs(x[i]!) > 1e-3 ? v / x[i]! : null)).filter((v): v is number => v != null)
    for (let i = 1; i < tiLe.length; i++) expect(tiLe[i]! - tiLe[i - 1]!).toBeGreaterThan(-1e-3) // tăng dần, không giật
  })
  it('hệ số lạ (0, âm, không phải số) bị bỏ qua', () => {
    const a = taoWorker(), b = taoWorker()
    b.W.nhan({ kd: 0, chiKd: true }); b.W.nhan({ kd: -2, chiKd: true }); b.W.nhan({ kd: 'x', chiKd: true })
    for (let k = 0; k < 50; k++) { const x = tieng(k); expect(Array.from(b.khung(x.slice()))).toEqual(Array.from(a.khung(x.slice()))) }
  })
})
