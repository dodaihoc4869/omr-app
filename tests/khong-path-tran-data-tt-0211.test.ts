// TỨC THÌ 02/11 (vết Chrome «Tiếp tục» CPU ×6 máy yếu, sau #749 giám thị sống động): luật có `[data-tt…]` ở tổ tiên mà ĐUÔI là thẻ SVG trần (`path`, `g`,
// `ellipse`, `circle`, `rect`) ⇒ trình duyệt gom thẻ ấy vào bộ «mất hiệu lực» của thuộc tính `data-tt` ⇒ mỗi lần gốc màn làm câu `.duo` đổi / bỏ `data-tt`
// (mỗi lần sang câu) MỌI nét cùng thẻ trong màn — ≈ 60 nét giám thị — tính lại kiểu. Đuôi luật phải có lớp (vd. `svg.lucide`).
import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const tep = (d: string): string[] => readdirSync(d).flatMap((t) => { const p = join(d, t); return statSync(p).isDirectory() ? tep(p) : p.endsWith('.css') ? [p] : [] })

describe('không luật đuôi thẻ SVG trần dưới [data-tt]', () => {
  it('mọi tệp CSS trong src/', () => {
    const sai: string[] = []
    for (const f of tep('src')) {
      const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      for (const m of css.matchAll(/([^{}]+)\{/g)) for (const chon of m[1]!.split(',')) {
        const c = chon.trim()
        if (c.includes('[data-tt') && /[\s>](path|g|ellipse|circle|rect)$/.test(c)) sai.push(`${f}: ${c}`)
      }
    }
    expect(sai).toEqual([])
  })
})
