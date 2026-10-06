// @vitest-environment node
// THANH LỰC + BÁNH XE GỌN (thầy 06/10: "thu gọn hai thanh kéo lực và thanh bánh răng cho gọn tinh tế dễ bấm"):
// phần NHÌN THẤY mảnh (thanh lực ≤ 26 px, bánh xe ≤ 32 px) nhưng VÙNG CHẠM vẫn ≥ 44 px (luật đích chạm của app).
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const css = readFileSync('src/game/bi-a/bi-a.css', 'utf8')
const luat = (dau: string) => css.split('\n').find((l) => l.startsWith(dau)) ?? ''

describe('thanh lực mảnh, vùng chạm ≥ 44 px', () => {
  it('thanh lực rộng 24 px; vùng chạm = 24 + 2 × 10 = 44 px (::before nở ra hai bên)', () => {
    const r = luat('.bia-luc{position:absolute')
    expect(r).toMatch(/width:24px;/)
    const w = Number(/width:(\d+)px/.exec(r)![1])
    const nở = Number(/inset:0 -(\d+)px/.exec(luat('.bia-luc::before'))![1])
    expect(w + 2 * nở).toBeGreaterThanOrEqual(44)
    expect(w).toBeLessThanOrEqual(26)
  })
  it('núm kéo và vạch không to hơn thanh quá 3 px mỗi bên', () => {
    expect(luat('.bia-luc .nut-keo{')).toMatch(/left:-3px;right:-3px;/)
  })
})

describe('bánh xe mảnh, vùng chạm ≥ 44 px', () => {
  it('phần hiển thị (.thanh) rộng 28 px (dọc) / cao 30 px (ngang); phần tử chạm giữ min 44 px', () => {
    expect(css).toMatch(/\.bia-banh-xe:not\(\[data-doc\]\) \.thanh\{[^}]*width:28px/)
    expect(css).toMatch(/\.bia-banh-xe\[data-doc\] \.thanh\{[^}]*height:30px/)
    expect(luat('.bia-banh-xe{position:relative')).toMatch(/min-width:44px;min-height:44px/)
    expect(luat('.bia-banh-xe[data-doc]{')).toMatch(/height:46px/)
    expect(luat('.bia-banh-xe:not([data-doc]){')).toMatch(/width:44px/)
  })
  it('bánh xe vẫn là một phần tử nhận chạm: bề ngoài (nền, viền, bóng) nằm ở .thanh, không ở phần tử ngoài', () => {
    const ngoai = luat('.bia-banh-xe{position:relative')
    expect(ngoai).not.toMatch(/background|border|box-shadow|overflow:hidden/)
    expect(luat('.bia-banh-xe .thanh{')).toMatch(/overflow:hidden/)
  })
})

describe('thanh lực và bánh xe NGẮN, ba bố cục (thầy 06/10: "cho ngắn lại, dễ chơi cả màn ngang máy tính và màn dọc")', () => {
  it('dọc: thanh lực không dài quá 280 px', () => {
    expect(luat(".bia[data-bo-cuc='doc'] .bia-luc{")).toMatch(/clamp\(170px,36vh,280px\)/)
  })
  it('ngang: thanh lực giữa màn, ≤ 230 px (không chạy suốt chiều cao); bánh xe ≤ 190 px', () => {
    expect(luat(".bia[data-bo-cuc='ngang'] .bia-luc{")).toMatch(/top:50%;bottom:auto;height:clamp\(150px,56%,230px\)/)
    expect(luat(".bia[data-bo-cuc='ngang'] .bia-banh-xe{")).toMatch(/height:min\(190px,/)
  })
  it('máy tính: thanh lực ≤ 260 px (không giãn hết cột)', () => {
    expect(luat(".bia[data-bo-cuc='pc'] .bia-dk .bia-luc{")).toMatch(/flex:0 1 260px/)
  })
  it('dọc: bánh xe ngang ≤ 240 px, nằm giữa hàng dưới', () => {
    expect(luat('.bia-dk .bia-banh-xe[data-doc]{')).toMatch(/max-width:240px;margin-inline:auto/)
  })
})
