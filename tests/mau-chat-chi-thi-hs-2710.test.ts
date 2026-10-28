// Bộ màu riêng app học sinh «B · Chất chỉ thị» — thầy 27/10: «Chốt bảng màu chất chỉ thị, làm cho sáng bằng độ sáng của doligo nhé».
// Khoá: (1) mỗi màu tô GIỮ SẮC bộ B, L lệch Duolingo cùng vai ≤ 0,03, C ≥ 90 % Duolingo hoặc chạm trần gam sRGB ở đúng L và sắc ấy;
// (2) ΔE00 ≥ 15 so Duolingo ở màu chính, đúng, sai; (3) chữ trắng trên nút không kém cặp Duolingo cũ; chữ màu ≥ 4,5;
// (4) nền tối không dùng #131f24; (5) Lộ trình / menu / Bi đọc màu chính, không đọc màu đúng; (6) 4 giám thị theo cùng luật, cách nhau rõ.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — script .mjs không có khai báo kiểu
import { docBang, tuongPhan } from '../scripts/do-tuong-phan-hs.mjs'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
const mau = doc('src/styles/trong-hs-mau.css')
const bang = docBang(mau) as { sang: Record<string, string>; toi: Record<string, string> }

// ── toán màu ──
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
function oklab([r, g, b]: number[]) {
  const l = Math.cbrt(0.4122214708 * r! + 0.5363325363 * g! + 0.0514459929 * b!)
  const m = Math.cbrt(0.2119034982 * r! + 0.6806995451 * g! + 0.1073969566 * b!)
  const s = Math.cbrt(0.0883024619 * r! + 0.2817188376 * g! + 0.6299787005 * b!)
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]
}
const oklch = (h: string) => { const [L, a, b] = oklab(rgb(h).map(lin)); return { L: L!, C: Math.hypot(a!, b!), h: ((Math.atan2(b!, a!) * 180) / Math.PI + 360) % 360 } }
function trongGam(L: number, C: number, h: number) {
  const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180)
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].every((x) => x >= -1e-4 && x <= 1 + 1e-4)
}
const tranGam = (L: number, h: number) => { let lo = 0, hi = 0.4; for (let i = 0; i < 40; i++) { const g = (lo + hi) / 2; if (trongGam(L, g, h)) lo = g; else hi = g } return lo }
function lab(h: string) {
  const [r, g, b] = rgb(h).map(lin) as [number, number, number]
  const f = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : (24389 / 27 * t + 16) / 116)
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047), y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b), z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)] as const
}
function de2000(p: string, q: string) {
  const [L1, a1, b1] = lab(p), [L2, a2, b2] = lab(q), rad = Math.PI / 180
  const Cb = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2, G = 0.5 * (1 - Math.sqrt(Cb ** 7 / (Cb ** 7 + 25 ** 7)))
  const A1 = (1 + G) * a1, A2 = (1 + G) * a2, C1 = Math.hypot(A1, b1), C2 = Math.hypot(A2, b2)
  const h1 = (Math.atan2(b1, A1) / rad + 360) % 360, h2 = (Math.atan2(b2, A2) / rad + 360) % 360
  let dh = h2 - h1; if (dh > 180) dh -= 360; else if (dh < -180) dh += 360
  const dH = 2 * Math.sqrt(C1 * C2) * Math.sin((dh / 2) * rad), Lb = (L1 + L2) / 2, Cp = (C1 + C2) / 2
  const hb = Math.abs(h1 - h2) <= 180 ? (h1 + h2) / 2 : h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2
  const T = 1 - 0.17 * Math.cos((hb - 30) * rad) + 0.24 * Math.cos(2 * hb * rad) + 0.32 * Math.cos((3 * hb + 6) * rad) - 0.2 * Math.cos((4 * hb - 63) * rad)
  const Rc = 2 * Math.sqrt(Cp ** 7 / (Cp ** 7 + 25 ** 7)), Rt = -Math.sin(2 * 30 * Math.exp(-(((hb - 275) / 25) ** 2)) * rad) * Rc
  const Sl = 1 + (0.015 * (Lb - 50) ** 2) / Math.sqrt(20 + (Lb - 50) ** 2), Sc = 1 + 0.045 * Cp, Sh = 1 + 0.015 * Cp * T
  return Math.sqrt(((L2 - L1) / Sl) ** 2 + ((C2 - C1) / Sc) ** 2 + (dH / Sh) ** 2 + Rt * ((C2 - C1) / Sc) * (dH / Sh))
}

// ── tham chiếu: token Duolingo của bảng cũ (cùng vai) và sắc của bộ B đã duyệt (ve-moi/mau-rieng/css/b.css) ──
type Che = 'sang' | 'toi'
const DUO: Record<Che, Record<string, string>> = {
  sang: { hs: '#58cc02', 'hs-nut': '#58a700', 'hs-day': '#478500', dung: '#58cc02', 'dung-nut': '#58a700', 'dung-day': '#478500', sai: '#ff4b4b', 'sai-day': '#ea2b2b',
    'chu-y': '#ff9600', 'chu-y-nut': '#ed6f00', 'chu-y-day': '#c47200', tin: '#1cb0f6', 'tin-day': '#1899d6', sao: '#ffc800', 'sao-day': '#e0a800', tim: '#ce82ff', 'tim-day': '#a560d6', 'nguyen-tu': '#1cb0f6' },
  // TỐI 28/10: số đo Duolingo tối trên ảnh máy thầy (ve-moi/mau-rieng/do-duo-toi.md): mặt xanh lá #78c93e (L 0,757); đỏ / cam / lam / vàng / tím giữ mã sáng.
  // Đáy 3D tối không so mã: kiểm quan hệ L(đáy) = L(mặt) − 0,116 (Duo tối #78c93e → #5ea12e) ở test riêng.
  toi: { hs: '#78c93e', 'hs-nut': '#78c93e', dung: '#78c93e', 'dung-nut': '#78c93e', sai: '#ff4b4b', 'chu-y': '#ff9600', 'chu-y-nut': '#ff9600', tin: '#1cb0f6',
    sao: '#ffc800', tim: '#ce82ff', 'nguyen-tu': '#1cb0f6' },
}
const SAC_B: Record<Che, Record<string, string>> = {
  sang: { hs: '#6366f1', 'hs-nut': '#4f46e5', 'hs-day': '#3730a3', dung: '#0fa877', 'dung-nut': '#0b7d5b', 'dung-day': '#086146', sai: '#c9304f', 'sai-day': '#9c213b',
    'chu-y': '#e8650a', 'chu-y-nut': '#c24e08', 'chu-y-day': '#a14207', tin: '#0e9fb5', 'tin-day': '#0a7d8f', sao: '#f5b301', 'sao-day': '#c38e00', tim: '#d63fb0', 'tim-day': '#a82a8a', 'nguyen-tu': '#0e9fb5' },
  toi: { hs: '#8b8dff', 'hs-nut': '#8b8dff', 'hs-day': '#5a55d6', dung: '#3dd9a0', 'dung-nut': '#3dd9a0', 'dung-day': '#22a273', sai: '#ff6ba0', 'sai-day': '#c94078',
    'chu-y': '#ff9447', 'chu-y-nut': '#ff9447', 'chu-y-day': '#c9661f', tin: '#3cc7db', 'tin-day': '#1e93a5', sao: '#ffc940', 'sao-day': '#c79400', tim: '#ea80f5', 'tim-day': '#b052c0', 'nguyen-tu': '#3cc7db' },
}
// họ «sai» nền sáng xoay −8,7° (giữ sắc B 14,8° thì ΔE00 với #ff4b4b chỉ 8,7); mọi màu khác lệch sắc ≤ 1°
const LECH_SAC: Record<string, number> = { 'sang:sai': -8.7, 'sang:sai-day': -8.7 }
const lechSac = (a: number, b: number) => ((a - b + 540) % 360) - 180

describe('bộ màu B «Chất chỉ thị» sáng bằng Duolingo (thầy 27/10)', () => {
  it.each(['sang', 'toi'] as const)('màu tô giữ sắc B, L ±0,03 và C ≥ 90 %% Duolingo (hoặc chạm trần gam) — %s', (che) => {
    const sai: string[] = []
    for (const [k, duo] of Object.entries(DUO[che])) {
      const moi = bang[che][`--tr-${k}`]!, d = oklch(duo), m = oklch(moi), b = oklch(SAC_B[che][k]!)
      if (Math.abs(m.L - d.L) > 0.03 + 1e-3) sai.push(`${k} L ${m.L.toFixed(3)} vs ${d.L.toFixed(3)}`)
      if (Math.abs(lechSac(m.h, b.h) - (LECH_SAC[`${che}:${k}`] ?? 0)) > 1.2) sai.push(`${k} sắc ${m.h.toFixed(1)} vs B ${b.h.toFixed(1)}`)
      if (m.C < Math.min(0.9 * d.C, 0.97 * tranGam(m.L, m.h))) sai.push(`${k} C ${m.C.toFixed(3)} < ${(0.9 * d.C).toFixed(3)} (trần gam ${tranGam(m.L, m.h).toFixed(3)})`)
    }
    expect(sai).toEqual([])
  })

  it.each(['sang', 'toi'] as const)('khác Duolingo: ΔE00 ≥ 15 ở màu chính, nút chính, đúng, nút đúng, sai — %s', (che) => {
    for (const k of ['hs', 'hs-nut', 'dung', 'dung-nut', 'sai']) expect(de2000(bang[che][`--tr-${k}`]!, DUO[che][k]!), k).toBeGreaterThanOrEqual(15)
  })

  it('tối đo theo Duolingo: nền / thẻ / viền đúng bậc L; đáy 3D = mặt − 0,116 cùng sắc; mặt tô sáng như bản sáng', () => {
    const t = bang.toi, L = (k: string) => oklch(t[`--tr-${k}`]!).L
    expect(Math.abs(L('nen') - 0.225)).toBeLessThanOrEqual(0.01)
    expect(Math.abs(L('mat') - 0.28)).toBeLessThanOrEqual(0.01)
    expect(Math.abs(L('vien') - 0.385)).toBeLessThanOrEqual(0.01)
    for (const [mat, day] of [['hs', 'hs-day'], ['dung', 'dung-day'], ['sai', 'sai-day'], ['chu-y', 'chu-y-day'], ['tin', 'tin-day'], ['sao', 'sao-day'], ['tim', 'tim-day']]) {
      expect(Math.abs(L(mat!) - L(day!) - 0.116), `${mat}/${day}`).toBeLessThanOrEqual(0.012)
      expect(Math.abs(lechSac(oklch(t[`--tr-${mat}`]!).h, oklch(t[`--tr-${day}`]!).h)), `${mat}/${day} cùng họ`).toBeLessThanOrEqual(6)
      expect(L(mat!), `${mat} sáng như bản sáng`).toBeGreaterThanOrEqual(0.64)
    }
    for (const k of ['dung', 'sai', 'chu-y', 'tin', 'sao', 'hs']) expect(Math.abs(L(`${k}-nhat`) - 0.311), `${k}-nhat`).toBeLessThanOrEqual(0.01)
    expect(t['--tr-hs-nut']).toBe(t['--tr-hs'])
  })

  it.each(['sang', 'toi'] as const)('chữ trên nút không kém cặp Duolingo cũ; chữ màu ≥ 4,5 trên thẻ và nền nhạt — %s', (che) => {
    const t = bang[che], tren = t['--tr-hs-tren']!, trenDuo = che === 'sang' ? '#ffffff' : '#131f24'
    const ks = che === 'sang' ? ['hs-nut', 'dung-nut', 'sai', 'sai-day', 'chu-y-nut', 'tin-day', 'tim'] : ['hs-nut', 'dung-nut', 'sai', 'chu-y-nut', 'tin', 'sao', 'tim']
    for (const k of ks) expect(tuongPhan(tren, t[`--tr-${k}`]!), k).toBeGreaterThanOrEqual(tuongPhan(trenDuo, DUO[che][k]!) - 1e-9)
    for (const k of ['hs', 'dung', 'sai', 'chu-y', 'tin', 'sao']) {
      expect(tuongPhan(t[`--tr-${k}-chu`]!, t['--tr-mat']!), `${k}-chu/mat`).toBeGreaterThanOrEqual(4.5)
      expect(tuongPhan(t[`--tr-${k}-chu`]!, t[`--tr-${k}-nhat`]!), `${k}-chu/nhat`).toBeGreaterThanOrEqual(4.5)
    }
    expect(tuongPhan(t['--tr-tim-chu']!, t['--tr-mat']!)).toBeGreaterThanOrEqual(4.5)
    expect(tuongPhan(t['--tr-nguyen-tu-so']!, t['--tr-mat']!), 'số nguyên tử đậm').toBeGreaterThanOrEqual(3)
  })

  it('nền tối không dùng #131f24 (cả bảng lười lẫn dòng tối học sinh trong trong.css)', () => {
    expect(mau.toLowerCase()).not.toMatch(/--tr-[\w-]+:\s*#131f24/)
    const tr = doc('src/styles/trong.css'), dong = tr.match(/^\s*:root\[data-trong='hs'\] \{ --tr-nen: (#[0-9a-f]{6})/m)
    expect(dong?.[1]).toBe('#1a1a29')
    expect(bang.toi['--tr-nen']).toBe('#1a1a29')
  })

  it('màu chính TÁCH khỏi màu đúng: Lộ trình, menu, rương, Bi đọc --tr-hs; «Tiếp tục» ở dải đúng đọc --tr-dung-nut', () => {
    for (const dong of [
      "html:root[data-trong='hs'] .da-bai { background: var(--tr-hs-nut); box-shadow: inset 0 -5px 0 var(--tr-hs-day); }",
      // 28/10 (thầy): CHỈ nút chặng học mặc chàm; Kiểm tra ôn tập / Tự sửa lỗi đã xong giữ màu riêng của loại
      "html:root[data-trong='hs'] .da-nut[data-loai='hoc']:is([data-tt='xong'], [data-tt='dang']) { --n: var(--tr-hs); --n-d: var(--tr-hs-day); }",
      "html:root[data-trong='hs'] :is(.da-vong .chay, .da-vong .mo) { stroke: var(--tr-hs); }",
      "html:root[data-trong='hs'] .tr-vong[data-du] { background: conic-gradient(var(--tr-hs) calc(var(--p, 0) * 1%), var(--tr-mat-3) 0); }",
      "html:root[data-trong='hs'] .tr-menu-o { --d: var(--tr-hs-day); background: var(--tr-hs-nut); }",
      "html:root[data-trong='hs'] .da-ruong .rg-ngoc { fill: var(--tr-hs); }",
      "html[data-trong='hs'] .bi { --bi-c: var(--tr-hs); }",
      "html:root[data-trong='hs'] .duo-ket[data-tt=dung] .duo-nut:not([data-sac]) { background: var(--tr-dung-nut); color: var(--tr-trang); box-shadow: inset 0 -4px 0 var(--tr-dung-day); }",
    ]) expect(mau).toContain(dong)
    // Kiểm tra ôn tập / Tự sửa lỗi đã xong không bị luật nào ép sang chàm hay màu đúng (thầy 28/10: «hiển thị đúng màu riêng … để học sinh phân biệt»)
    const hsCss = doc('src/styles/trong-hs.css').replace(/\/\*[\s\S]*?\*\//g, '')
    expect(hsCss).not.toMatch(/\.da-nut\[data-loai\]\[data-tt='xong'\]/)
    expect(mau.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/\.da-nut(\[data-loai\])?\[data-tt='xong'\]/)
    expect(de2000(bang.sang['--tr-hs']!, bang.sang['--tr-dung']!)).toBeGreaterThanOrEqual(30)
    expect(de2000(bang.toi['--tr-hs']!, bang.toi['--tr-dung']!)).toBeGreaterThanOrEqual(30)
  })

  // 28/10 ảnh thầy: nút chặng chàm mà đáy 3D LỤC — #485 thêm luật nút chặng ưu tiên cao hơn luật tách màu ⇒ khoá: mọi luật nút chặng xong / đang học
  // trong trong-hs.css đọc màu ĐÚNG phải thua (độ ưu tiên) luật màu chính trong trong-hs-mau.css.
  it('nút chặng đã xong / đang học: mặt và đáy 3D cùng họ màu chính — luật tách màu thắng mọi luật nút chặng của trong-hs.css', () => {
    const uuTien = (sel: string): [number, number, number] => {
      let a = 0, b = 0, c = 0
      sel = sel.replace(/::?(before|after)\b/g, '')
      sel = sel.replace(/:(is|where|not)\(((?:[^()]|\([^()]*\))*)\)/g, (_m, ten: string, ds: string) => {
        if (ten === 'where') return ''
        const best = ds.split(',').map((x) => uuTien(x.trim())).sort((x, y) => y[0] - x[0] || y[1] - x[1] || y[2] - x[2])[0]!
        a += best[0]; b += best[1]; c += best[2]; return ''
      })
      sel = sel.replace(/\[[^\]]*\]/g, () => { b++; return '' })
      sel = sel.replace(/#[\w-]+/g, () => { a++; return '' }).replace(/\.[\w-]+/g, () => { b++; return '' }).replace(/:[\w-]+/g, () => { b++; return '' })
      c += (sel.match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length
      return [a, b, c]
    }
    const so = (x: [number, number, number], y: [number, number, number]) => x[0] - y[0] || x[1] - y[1] || x[2] - y[2]
    const luatMau = mau.match(/^(html:root\[data-trong='hs'\] \.da-nut[^{]*)\{ --n: var\(--tr-hs\); --n-d: var\(--tr-hs-day\); \}/m)
    expect(luatMau).not.toBeNull()
    const ta = uuTien(luatMau![1]!.trim())
    const hs = doc('src/styles/trong-hs.css').replace(/\/\*[\s\S]*?\*\//g, '')
    let dem = 0
    for (const m of hs.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/--n(-d)?:\s*var\(--tr-dung/.test(m[2]!) || !/\.da-nut/.test(m[1]!)) continue
      for (const sel of m[1]!.split(',').map((x) => x.trim()).filter((x) => /data-tt='(xong|dang)'/.test(x))) {
        dem++
        expect(so(uuTien(sel), ta), `${sel} phải thua ${luatMau![1]}`).toBeLessThan(0)
      }
    }
    expect(dem).toBeGreaterThanOrEqual(3)
  })

  it('4 giám thị: sắc B, L ±0,03 Duolingo cùng vai, cách nhau ΔE00 ≥ 25', () => {
    const css = doc('src/components/giam-thi/giam-thi.css')
    const gt = (m: string) => css.match(new RegExp(`--gt-mau-${m}: (#[0-9a-f]{6})`))![1]!
    const duo = { nb: '#58cc02', th: '#ce82ff', vd: '#ff9600', vdc: '#ff4b4b' }, b = { nb: '#22c3d6', th: '#8b7cff', vd: '#ff8a3d', vdc: '#f0479a' }
    const ks = Object.keys(duo) as (keyof typeof duo)[]
    for (const k of ks) {
      const m = oklch(gt(k))
      expect(Math.abs(m.L - oklch(duo[k]).L), k).toBeLessThanOrEqual(0.031)
      expect(Math.abs(lechSac(m.h, oklch(b[k]).h)), k).toBeLessThanOrEqual(1.2)
    }
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) expect(de2000(gt(ks[i]!), gt(ks[j]!)), `${ks[i]}/${ks[j]}`).toBeGreaterThanOrEqual(25)
  })
})
