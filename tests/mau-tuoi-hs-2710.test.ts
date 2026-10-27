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

describe('màu tươi app học sinh 27/10', () => {
  const bang = docBang(trong) as { sang: Record<string, string>; toi: Record<string, string> }

  it('màu nhấn đúng bảng Duolingo ở nền sáng, nền trắng tinh', () => {
    expect(bang.sang).toMatchObject({
      '--tr-dung': '#58cc02', '--tr-dung-nut': '#58a700', '--tr-tin': '#1cb0f6', '--tr-tin-day': '#1899d6', '--tr-sai': '#ff4b4b', '--tr-sai-day': '#ea2b2b',
      '--tr-sao': '#ffc800', '--tr-chu-y': '#ff9600', '--tr-chu': '#4b4b4b', '--tr-vien': '#e5e5e5', '--tr-nen': '#ffffff', '--tr-mat': '#ffffff',
      '--tr-dung-nhat': '#d7ffb8', '--tr-sai-nhat': '#ffdfe0', '--tr-tin-nhat': '#ddf4ff',
    })
  })

  it('nền tối kiểu Duolingo, chữ trắng ngà (không trắng tinh)', () => {
    expect(bang.toi).toMatchObject({ '--tr-nen': '#131f24', '--tr-mat': '#202f36', '--tr-vien': '#37464f', '--tr-chu': '#f1f7fb' })
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
    expect(trong).not.toMatch(/\[data-trong='gv'\][^{]*\{[^}]*#58cc02/)
  })

  it('nút 3D và khối màu dùng gờ đáy cùng tông, không gờ xám pha --tr-phu', () => {
    const lam = doc('trong-lam-bai.css'), hs = doc('trong-hs.css')
    expect(lam).toContain(":root[data-trong='hs'] .duo-nut { box-shadow: inset 0 -4px 0 var(--tr-chinh-day); }")
    expect(lam).toContain(":root[data-trong='hs'] .duo-nut[data-sac=do] { box-shadow: inset 0 -4px 0 var(--tr-sai-day); }")
    expect(hs).toMatch(/:root\[data-trong='hs'\] \.da-nut::before \{ background: var\(--n-d/)
    expect(trong).toContain("[data-trong='hs'] { --tr-chinh-day: var(--tr-hs-day); }")
  })

  it('linh vật Bi: viền cùng tông (không đen), dung dịch phẳng, Bi chuyển động khai lại tông ở svg', () => {
    const bi = doc('bi.css'), bd = doc('bi-dong.css')
    expect(bi).toContain("[data-trong='hs'] .bi .bi-net { stroke: var(--bi-net-mau); }")
    expect(bi).toContain("[data-trong='hs'] .bi :is(.bi-g-sang, .bi-g-chinh, .bi-g-dam) { stop-color: var(--bi-c); }")
    expect(bd).toMatch(/\.bi-dong svg \{\s*--bi-net-mau: color-mix\(in oklab, var\(--bi-c\)/)
  })
})
