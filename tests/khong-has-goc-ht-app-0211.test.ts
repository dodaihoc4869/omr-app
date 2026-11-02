// TỨC THÌ sau PR 761 (02/11): `.ht-app:has(.tp-goc.tp-ket)` đặt :has() lên GỐC màn làm câu ⇒ vết Chrome CPU ×6 khi bấm «Kiểm tra»: 60 lượt
// «StyleRecalc | Affected by :has() | DIV.ht-app.ht2-lam.duo» (mỗi lần thêm / gỡ nút trong câu, Chrome soát lại cả cây con). Gốc .ht-app là khung của
// MỌI màn học sinh (Hôm nay, làm câu, sửa câu, kiểm tra) ⇒ không đặt :has() ngay trên nó; cần điều kiện thì gắn thuộc tính bằng JS (xem KetBaiThuong
// `data-ket-bai`). Bổ sung cho tests/muot-has-2710 (luật ấy chỉ chặn `:root:has` và đuôi `> *`).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const GOC = join(__dirname, '..')
const tepCss = (d: string): string[] => readdirSync(d).flatMap((t) => {
  const p = join(d, t)
  return statSync(p).isDirectory() ? tepCss(p) : t.endsWith('.css') ? [p] : []
})

/** Có từ trước (01/11, màn Kiểm tra ôn tập chặng ngang): :has() chỉ soát CON / CHÁU trực tiếp (`> .duo-than > …`), chỉ trên gốc màn kiểm tra — giữ, không
 *  thêm mới. Gỡ được thì xoá khỏi danh sách này. */
const CHO_PHEP = ["src/styles/trong-chang-ngang.css :root[data-trong='hs'] .ht-app.ht2-lam.duo.duo-kt[data-chang][data-duo]:not([data-xong]):has(> .duo-than > "]

describe('không :has() trên gốc .ht-app (02/11)', () => {
  it('mọi tờ CSS trong src/', () => {
    const vi: string[] = []
    for (const f of tepCss(join(GOC, 'src'))) {
      const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
      for (const m of css.matchAll(/([^{};]+)\{/g)) {
        const dau = m[1]!
        // một vế ghép (không khoảng trắng / dấu nối) chứa .ht-app rồi :has( ⇒ :has() neo trên chính .ht-app
        for (const chon of dau.split(',').map((x) => x.trim().replace(/\s+/g, ' '))) {
          if (!/\.ht-app(?![\w-])(?:[.#[:\w-][^\s,>+~]*)?:has\(/.test(chon) || CHO_PHEP.some((c) => `${relative(GOC, f)} ${chon}`.startsWith(c))) continue
          vi.push(`${relative(GOC, f)}:${css.slice(0, m.index).split('\n').length} ${chon.slice(0, 120)}`)
        }
      }
    }
    expect(vi).toEqual([])
  })
})
