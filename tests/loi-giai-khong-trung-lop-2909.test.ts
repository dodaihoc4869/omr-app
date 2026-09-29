// @vitest-environment node
// loi-giai.css nạp CHUNG với TheCau trong game (nút Hỏi thầy) ⇒ không được định nghĩa lại lớp nào mà index.css (TheCau, phiếu) đã dùng.
// Lỗi 29/09: `.lg-chu { margin: 0 auto; display: flex … }` đè lên chữ lý do ✓/✗ của TheCau ⇒ dòng lời giải trong game căn giữa, thò thụt.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const lop = (tep: string) => new Set([...fs.readFileSync(path.resolve(__dirname, '..', tep), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/\.(lg-[a-z0-9-]+)/g)].map((m) => m[1]))

describe('lớp CSS lời giải không trùng lớp của TheCau', () => {
  it('loi-giai.css và index.css không chung lớp .lg-*', () => {
    const lg = lop('src/components/loi-giai/loi-giai.css')
    const chung = [...lop('src/index.css')].filter((c) => lg.has(c))
    expect(chung).toEqual([])
  })
})
