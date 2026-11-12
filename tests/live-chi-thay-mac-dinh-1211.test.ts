// «CHỈ GIỌNG THẦY» — ĐƯỜNG MẶC ĐỊNH KHÔNG ĐỔI (12/11, đường thử chỉ-thầy, mặc định tắt) + công tắc ẩn của app thầy + tải mô hình có mã thầy.
//  · Worker khung (MA_KHUNG của src/lib/live/chuoi-tieng.ts) chạy SONG SONG với bản TRƯỚC khi có mức này (tests/fixtures/live-ma-khung-truoc-chi-thay-1211.txt,
//    chép nguyên từ main e34de387d): cùng khung vào, cùng tin (mức Vừa / Mạnh / Tắt, đổi mức giữa chừng, RNNoise thật) ⇒ tiếng ra và tin báo GIỐNG TỪNG BIT.
//  · Lõi tách (MA_TACH) không nằm trong mã Worker mặc định (chỉ nạp lười khi chọn mức 'thay').
//  · Phần thay.ts (track gửi, coChuoi, tin gửi Worker, chưa nạp lõi) ở tests/live-mic-thay-1111.test.ts mục «Chỉ giọng thầy — mặc định không đổi».
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LAM_RO, THAM_LOC_ON, type MucLocOn } from '../src/lib/live/chuoi-tieng'

const MA_MOI = /const MA_KHUNG = `([\s\S]*?)`/.exec(readFileSync(resolve(__dirname, '../src/lib/live/chuoi-tieng.ts'), 'utf8'))![1]!
const MA_CU = readFileSync(resolve(__dirname, 'fixtures/live-ma-khung-truoc-chi-thay-1211.txt'), 'utf8')
const WASM = readFileSync(resolve(__dirname, '../src/lib/live/loc-on/rnnoise.wasm'))

type Tin = Record<string, unknown>
/** Dựng một Worker khung từ mã `ma` (chạy thẳng, không luồng): Math.random có hạt cố định ⇒ hai bản nhận cùng chuỗi số ngẫu nhiên (nhiễu dither của RNNoise);
 *  `onmessage` khai báo riêng từng bản (mã Worker gán `onmessage = …` không `var` ⇒ không khai báo thì hai bản cùng ghi đè MỘT biến toàn cục). */
function taoWorker(ma: string) {
  const tin: Tin[] = []
  class AD { d: Float32Array; constructor(o: { data: Float32Array }) { this.d = o.data } }
  let hat = 12345
  const M = Object.create(Math) as Math
  M.random = () => { hat = (hat * 1103515245 + 12345) >>> 0; return hat / 4294967296 }
  const W = new Function('postMessage', 'AudioData', 'Math', 'performance', 'importScripts', 'var onmessage;\n' + ma + '\nreturn { xuLy: xuLy, dat: function (v) { c = v; }, nhan: function (d) { onmessage({ data: d }); } };')(
    (d: Tin) => tin.push(d), AD, M, { now: () => 0 }, () => { throw new Error('không được gọi importScripts ở đường mặc định') }) as { xuLy(f: unknown): AD; dat(c: Tin): void; nhan(d: Tin): void }
  W.dat({ ...LAM_RO, g0: 0 })
  const khung = (x: Float32Array, kenh = 1): Float32Array => W.xuLy({ numberOfFrames: x.length, numberOfChannels: kenh, sampleRate: 48000, timestamp: 0, copyTo: (d: Float32Array) => d.set(x), close: () => undefined }).d
  return { W, tin, khung }
}
/** Tín hiệu thử: giọng (hai hoạ âm có bao), ồn nền, quãng im — đủ để bộ nâng mức, cổng RNNoise, chặn đỉnh đều chạy. */
function tieng(k: number, n = 480): Float32Array {
  const x = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = k * n + i, bao = k % 90 < 55 ? 0.5 + 0.5 * Math.sin(t * 0.0004) : 0.02
    x[i] = bao * (0.12 * Math.sin(t * 0.031) + 0.05 * Math.sin(t * 0.217)) + 0.004 * Math.sin(t * 1.913) + (k % 200 === 7 ? 0.9 : 0)
  }
  return x
}

describe('Worker khung: mức khác «Chỉ giọng thầy» ⇒ GIỐNG TỪNG BIT bản trước', () => {
  it('mã Worker mặc định KHÔNG chứa lõi tách (docMoHinh / taoTach chỉ nạp lười khi chọn mức thầy)', () => {
    expect(MA_MOI).not.toMatch(/function (docMoHinh|taoTach|taoFft)\b/)
    expect(MA_CU).toContain('function xuLy(f)')
  })

  const kichBan: [string, (MucLocOn | 'loc')[]][] = [
    ['Vừa (mặc định) có RNNoise', ['vua', 'loc']],
    ['Mạnh có RNNoise', ['manh', 'loc']],
    ['Tắt lọc', ['tat']],
    ['đổi mức giữa chừng Vừa → Mạnh → Tắt → Vừa', ['vua', 'loc']],
    ['chưa nạp được RNNoise (Vừa, không có tệp lọc)', ['vua']],
  ]
  for (const [ten, dau] of kichBan) {
    it(ten, () => {
      const cu = taoWorker(MA_CU), moi = taoWorker(MA_MOI)
      for (const w of [cu, moi]) for (const b of dau) w.W.nhan(b === 'loc' ? { loc: WASM.buffer.slice(WASM.byteOffset, WASM.byteOffset + WASM.byteLength), muc: THAM_LOC_ON[dau[0] as MucLocOn] } : { muc: THAM_LOC_ON[b] })
      const doiMuc: Record<number, MucLocOn> = ten.startsWith('đổi') ? { 150: 'manh', 300: 'tat', 420: 'vua' } : {}
      let soKhung = 0
      for (let k = 0; k < 560; k++) {
        const m = doiMuc[k]
        if (m) { cu.W.nhan({ muc: THAM_LOC_ON[m] }); moi.W.nhan({ muc: THAM_LOC_ON[m] }) }
        const x = tieng(k), kenh = k % 97 === 3 ? 2 : 1 // thỉnh thoảng bộ thu hai kênh (cộng về mono)
        const a = cu.khung(x.slice(), kenh), b = moi.khung(x.slice(), kenh)
        expect(Array.from(b)).toEqual(Array.from(a)); soKhung++
      }
      // khung lạ (không phải 480 mẫu 48 kHz — RNNoise bỏ qua) cũng y hệt
      const le = tieng(999, 441)
      expect(Array.from(moi.khung(le.slice()))).toEqual(Array.from(cu.khung(le.slice())))
      expect(moi.tin).toEqual(cu.tin)
      expect(soKhung).toBe(560)
      if (dau.includes('loc')) expect(cu.tin).toContainEqual({ loc: 'chay' })
    })
  }
})

describe('công tắc ẩn của app thầy + tải mô hình có mã thầy (src/lib/live/chi-thay.ts)', () => {
  const kho = new Map<string, string>()
  afterEach(() => { kho.clear(); vi.unstubAllGlobals(); vi.doUnmock('../src/lib/dia-chi-may-chu'); vi.doUnmock('../src/lib/exam-db'); vi.resetModules() })
  const ls = { getItem: (k: string) => kho.get(k) ?? null, setItem: (k: string, v: string) => void kho.set(k, v), removeItem: (k: string) => void kho.delete(k) }

  it('?chi-thay=bat ⇒ hiện mức + địa chỉ = lệnh mô hình của máy chủ; ?chi-thay=tat ⇒ lùi khẩn; tham số khác ⇒ không đổi gì', async () => {
    vi.stubGlobal('localStorage', ls)
    const m = await import('../src/lib/live/chi-thay')
    await m.apChiThayUrl('?vai=gv', async () => 'https://may-chu.example')
    expect(kho.size).toBe(0); expect(m.chiThayCo()).toBe(false)
    await m.apChiThayUrl('?vai=gv&chi-thay=bat', async () => 'https://may-chu.example/')
    expect(kho.get('ddh.live.chi-thay')).toBe('hien')
    expect(kho.get('ddh.live.chi-thay-url')).toBe('https://may-chu.example/gv/mo-hinh-thay')
    expect(m.chiThayCo()).toBe(true)
    await m.apChiThayUrl('?chi-thay=tat', async () => 'https://may-chu.example')
    expect(m.chiThayTatKhan()).toBe(true); expect(m.chiThayCo()).toBe(false)
    expect(m.URL_MO_HINH_THAY).toBeNull() // chưa phát hành chung: chỉ chạy khi thầy bật bằng link
  })

  it('mã thầy CHỈ gửi kèm khi địa chỉ mô hình đúng nguồn máy chủ của app; nguồn khác ⇒ không gửi mã', async () => {
    vi.stubGlobal('localStorage', ls)
    vi.doMock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.example' }))
    vi.doMock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => ' ma-thu ' }))
    const goi: { u: string; h: Record<string, string> }[] = []
    const laySo = (async (u: string, o: RequestInit) => { goi.push({ u, h: (o.headers ?? {}) as Record<string, string> }); return new Response(new Uint8Array(64)) }) as unknown as typeof fetch
    kho.set('ddh.live.chi-thay', 'hien'); kho.set('ddh.live.chi-thay-url', 'https://may-chu.example/gv/mo-hinh-thay')
    let m = await import('../src/lib/live/chi-thay')
    expect((await m.taiMoHinhThay(laySo))?.byteLength).toBe(64)
    expect(goi[0]).toEqual({ u: 'https://may-chu.example/gv/mo-hinh-thay', h: { 'x-ma-bi-mat': 'ma-thu' } })
    vi.resetModules()
    kho.set('ddh.live.chi-thay-url', 'https://noi-khac.example/m.tgt')
    m = await import('../src/lib/live/chi-thay')
    expect((await m.taiMoHinhThay(laySo))?.byteLength).toBe(64)
    expect(goi[1]).toEqual({ u: 'https://noi-khac.example/m.tgt', h: {} })
  })
})
