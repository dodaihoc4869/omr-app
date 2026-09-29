// @vitest-environment node
// SAFARI iOS < 16.4 KHÔNG hiểu lookbehind trong biểu thức chính quy: lỗi "Invalid regular expression: invalid group specifier name"
// xảy ra lúc NẠP tệp ⇒ cả Cổng học sinh sập trên iPhone đời cũ (29/09, src/lib/chem-format-so-do.ts). Chặn mọi lookbehind trong src/.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { nhanTruocMuiTenVeSau } from '../src/lib/chem-format-so-do'

const GOC = path.resolve(__dirname, '../src')
function tep(d: string): string[] {
  return fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(d, e.name)
    if (e.isDirectory()) return e.name === 'graphify-out' ? [] : tep(p)
    return /\.(ts|tsx|js|mjs)$/.test(e.name) ? [p] : []
  })
}

describe('không lookbehind cho máy cũ', () => {
  it('không tệp nào trong src/ dùng (?<= hoặc (?<!', () => {
    const vi = tep(GOC).filter((f) => /\(\?<[=!]/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(GOC, f))
    expect(vi).toEqual([])
  })
  it('sơ đồ vẫn đổi đúng "to→" thành t° và "xt→" thành điều kiện, bỏ qua "xt" dính sau chữ thường', () => {
    expect(nhanTruocMuiTenVeSau('NH₄Clto→ NH₃ + HCl')).toBe('NH₄Cl →(t°) NH₃ + HCl')
    expect(nhanTruocMuiTenVeSau('2SO₂ + O₂ xt→ 2SO₃')).toBe('2SO₂ + O₂ →(xt) 2SO₃')
    expect(nhanTruocMuiTenVeSau('next→ b')).toBe('next→ b')
  })
})
