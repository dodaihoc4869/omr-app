// Bảng màu «tươi» app học sinh kiểu Duolingo — thầy cho phép 27/10: «Màu sắc của app làm siêu tươi như dolingo nhé, màu sắc của linh vật cũng vậy
// siêu tươi mịn mắt». Khoá: (1) đúng màu gốc Duolingo; (2) mọi cặp chữ/nền đạt ngưỡng (4,5 chữ thường · 3 chữ đậm); (3) CHỈ đè dưới
// :root[data-trong='hs'] — bảng :root (app thầy) giữ nguyên; (4) gờ đáy 3D cùng tông, linh vật viền cùng tông, dung dịch phẳng.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
// @ts-expect-error — script .mjs không có khai báo kiểu
import { docBang, doBang } from '../scripts/do-tuong-phan-hs.mjs'

type Dong = { c: string; n: string; tp: number; nguong: number; dat: boolean }
const doc = (p: string) => readFileSync(resolve(__dirname, '../src/styles', p), 'utf8')
const trong = doc('trong.css')
const mau = doc('trong-hs-mau.css')

describe('màu tươi app học sinh 27/10', () => {
  const bang = docBang(mau) as { sang: Record<string, string>; toi: Record<string, string> }

  // 27/10 thầy duyệt bộ màu riêng B «Chất chỉ thị» (sáng bằng Duolingo) — khoá đầy đủ ở tests/mau-chat-chi-thi-hs-2710.test.ts
  it('bảng học sinh là bộ B «Chất chỉ thị» (chàm + lục ngọc), nền tối đêm chàm', () => {
    expect(bang.sang).toMatchObject({ '--tr-hs-nut': '#767eff', '--tr-dung': '#00d396', '--tr-nen': '#f6f6fc', '--tr-mat': '#ffffff' })
    expect(bang.toi).toMatchObject({ '--tr-nen': '#121129', '--tr-mat': '#1c1b3a', '--tr-chu': '#f1f0ff' })
  })

  it.each(['sang', 'toi'] as const)('mọi cặp chữ/nền đạt ngưỡng tương phản (%s)', (che) => {
    const truot = (doBang(bang[che]) as Dong[]).filter((d) => !d.dat).map((d) => `${d.c}/${d.n} ${d.tp.toFixed(2)} < ${d.nguong}`)
    expect(truot).toEqual([])
  })

  it('bảng :root chung (app thầy) giữ nguyên, bảng tươi chỉ nằm dưới :root[data-trong=hs]', () => {
    const goc = trong.match(/^:root \{([^}]*)\}/m)?.[1] ?? ''
    expect(goc).toContain('--tr-gv: #2563eb')
    expect(goc).toContain('--tr-hs-nut: #15803d')
    expect(goc).not.toContain('#58cc02')
    expect(trong).not.toContain('#58cc02')
    expect(mau.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/(^|\})\s*:root\s*\{|data-trong='gv'/)
    // nạp lười: đi cùng mảnh học sinh, không vào trong.css (gói mở cả ba app)
    expect(doc('trong-hs.css').startsWith("@import './trong-hs-mau.css';")).toBe(true)
    expect(doc('trong-lam-bai.css').startsWith("@import './trong-hs-mau.css';")).toBe(true)
  })

  it('nút 3D và khối màu dùng gờ đáy cùng tông, không gờ xám pha --tr-phu', () => {
    const lam = doc('trong-lam-bai.css'), hs = doc('trong-hs.css')
    expect(lam).toContain(":root[data-trong='hs'] .duo-nut { box-shadow: inset 0 -4px 0 var(--tr-chinh-day); }")
    expect(lam).toContain(":root[data-trong='hs'] .duo-nut[data-sac=do] { box-shadow: inset 0 -4px 0 var(--tr-sai-day); }")
    expect(hs).toMatch(/:root\[data-trong='hs'\] \.da-nut::before \{ background: var\(--n-d/)
    expect(mau).toContain("[data-trong='hs'] { --tr-chinh-day: var(--tr-hs-day); }")
  })

  it('linh vật Bi: viền cùng tông (không đen), dung dịch phẳng, Bi chuyển động khai lại tông ở svg', () => {
    const bi = doc('bi.css'), bd = doc('bi-dong.css')
    expect(bi).toContain("[data-trong='hs'] .bi .bi-net { stroke: var(--bi-net-mau); }")
    expect(bi).toContain("[data-trong='hs'] .bi :is(.bi-g-sang, .bi-g-chinh, .bi-g-dam) { stop-color: var(--bi-c); }")
    expect(bd).toMatch(/\.bi-dong svg \{\s*--bi-net-mau: color-mix\(in oklab, var\(--bi-c\)/)
  })
})
