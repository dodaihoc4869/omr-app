// THÍ NGHIỆM GỌN (thầy 27/10): thanh thu gọn một hàng, bước có chấm số, «l» của HCl qua phông có đuôi, app HS bỏ khung.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { bocChuL, renderScene } from '../src/lib/experiments/scene'
import { SCENES } from '../src/lib/experiments/catalog'

describe('thí nghiệm gọn 27/10', () => {
  const html = renderScene(SCENES['amine-acid']!)
  it('thanh thu gọn: bình + «Xem thí nghiệm» + mũi tên, mặc định vẫn mở', () => {
    expect(html.startsWith('<details class="ex-demo" open><summary><svg class="ex-ic"')).toBe(true)
    expect(html).toContain('<span class="ex-nhan">Xem thí nghiệm</span><svg class="ex-chev"')
    expect(html).not.toContain('Quan sát thí nghiệm')
    expect(html).toMatch(/<\/summary><div class="ex-mo">/)
  })
  it('tên cảnh thành chú thích, số bước tách thành chấm, nội dung Hoá giữ nguyên', () => {
    expect(html).toContain('<p class="ex-ten">Methylamine, phenolphthalein và <span class="ct-l">HCl</span></p>')
    expect(html).toContain('<h4><span class="ex-so">1</span>Thêm phenolphthalein</h4>')
    expect(html).toContain('<h4><span class="ex-so">2</span>Thêm đủ <span class="ct-l">HCl</span></h4>')
    expect(html).toContain('Dung dịch methylamine có tính base, chuyển hồng.')
  })
  it('bọc «l» có đuôi đúng chất, không đụng chữ thường', () => {
    expect(bocChuL('NaCl và AlCl₃')).toBe('<span class="ct-l">NaCl</span> và <span class="ct-l">AlCl₃</span>')
    expect(bocChuL('Clo, Alanine, methylamine')).toBe('Clo, Alanine, methylamine')
  })
  it('app HS: khối thí nghiệm không viền, không nền; bước xếp ngang có nấc cuộn', () => {
    const css = readFileSync('src/styles/trong-lam-bai.css', 'utf8')
    expect(css).toContain("[data-trong='hs'] .ex-demo { margin: 2px 0 0; padding: 0; border: 0; border-radius: 0; background: none;")
    expect(css).toMatch(/\.ex-demo \.ex-phase \{[^}]*border: 0;[^}]*background: none;/)
    expect(css).toMatch(/\.ex-demo \.ex-grid \{[^}]*scroll-snap-type: x mandatory/)
  })
})
