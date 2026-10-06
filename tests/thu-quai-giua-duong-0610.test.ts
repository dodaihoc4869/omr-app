// THÚ + QUÁI GIỮA ĐƯỜNG (thầy lệnh 06/10): một bộ biến dùng chung (src/game/than-thu-v2/thu-quai.css) cho Đảo thần thú và Đoàn Hộ Tống.
// Hợp đồng: biến tồn tại; chân sprite nằm trong dải đường lát đá của ảnh nền (đo 62–90 % chiều cao cảnh); phóng to hơn một chút (1,1–1,3);
// MỌI màn có sprite thú/quái đọc biến thay vì gõ số riêng; tệp CSS không hex thô.
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

const doc = (p: string) => readFileSync(p, 'utf8')
const D = 'src/game/than-thu-v2/'
const chung = doc(D + 'thu-quai.css')
const so = (ten: string) => { const m = chung.match(new RegExp(`--${ten}:([0-9.]+)`)); expect(m, ten).toBeTruthy(); return Number(m![1]) }

describe('thu-quai.css · bộ biến dùng chung', () => {
  it('có đủ biến; chân sprite nằm trong dải đường [min, max] % chiều cao cảnh (tính từ đáy)', () => {
    const day = so('thu-quai-day'), min = so('thu-quai-day-min'), max = so('thu-quai-day-max')
    // dải đường đo trên canh-ho-tong*.webp: 62 % → 90 % chiều cao tính từ đỉnh ⇒ cách đáy 10 % → 38 %
    expect(min).toBe(10); expect(max).toBe(38)
    expect(day).toBeGreaterThanOrEqual(min); expect(day).toBeLessThanOrEqual(max)
    expect(day).toBeGreaterThan(0) // không dính đáy
  })
  it('phóng to hơn một chút: hệ số trong khoảng +10 % … +30 %', () => {
    const co = so('thu-quai-co')
    expect(co).toBeGreaterThanOrEqual(1.1); expect(co).toBeLessThanOrEqual(1.3)
  })
  it('không hex thô', () => { expect(chung).not.toMatch(/#[0-9a-fA-F]{3,8}\b/) })
})

describe('mọi màn có sprite thú/quái đều dùng biến chung', () => {
  const css = (p: string) => doc(D + p).replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, '')
  it('Đoàn 2.0 · chiến trường: khung tranh nâng theo --thu-quai-day (dọc + ngang); em chặn theo chiều cao cảnh', () => {
    expect(css('doan2/doan2.css')).toMatch(/\.dh2-ve\{[^}]*bottom:max\(0px,calc\(var\(--thu-quai-day\)\*1cqh/)
    expect(css('doan2/doan2.css')).toMatch(/\.dh-thu-em\{[^}]*width:min\(calc\(33%\*var\(--thu-quai-co\)\),50cqh\)/)
    expect(css('doan2/doan2-ngang.css')).toMatch(/\.dh2-ve\{[^}]*bottom:max\(0px,calc\(var\(--thu-quai-day\)\*1cqh/)
    expect(doc(D + 'doan2/Canh2.tsx')).toMatch(/const CO = 1\.2/)
  })
  it('Đoàn cũ: đội thú + bầy quái + Linh Tâm + thú ở sảnh + thú tung chưởng', () => {
    const c = css('doan.css')
    expect(c).toMatch(/\.dh-doi\{[^}]*bottom:calc\(var\(--thu-quai-day\)\*1%\)/)
    expect(c).toMatch(/\.dh-dich\{[^}]*bottom:calc\(var\(--thu-quai-day\)\*1%\)/)
    expect(c).toMatch(/\.dh-linh-tam-o\{[^}]*var\(--thu-quai-day\)/)
    expect(c).toMatch(/\.dh-ban-do\.dh-thu-chinh\{[^}]*var\(--thu-quai-day\)[^}]*scale:var\(--thu-quai-co\)/)
    expect(c).toMatch(/\.dh-chuong-thu\{[^}]*scale:var\(--thu-quai-co\)/)
    expect(css('doan2/doan2-ngang.css')).toMatch(/\.dh-thu-chinh\{[^}]*var\(--thu-quai-day\)/)
  })
  it('Đảo 2.0: thú + quái ở mọi cỡ màn (dọc, ngang, ngang thấp) đặt chân theo --thu-quai-day, cỡ nhân --thu-quai-co', () => {
    const c = css('dao2/dao2.css')
    const thu = c.match(/\.dao2\.dao2-canh-thu\{[^}]*\}/g) ?? [], quai = c.match(/\.dao2\.dao2-quai\{[^}]*bottom:[^}]*\}/g) ?? []
    // 4 luật cho mỗi bên: cơ sở, ngang, ngang thấp (+ luật hiệu ứng không có bottom nên bị lọc)
    const thuCoBottom = thu.filter(l => l.includes('bottom:'))
    expect(thuCoBottom.length).toBeGreaterThanOrEqual(3); expect(quai.length).toBeGreaterThanOrEqual(3)
    for (const l of [...thuCoBottom, ...quai]) {
      expect(l, l).toContain('bottom:calc(var(--thu-quai-day)*1%)')
      expect(l, l).toContain('var(--thu-quai-co)')
    }
  })
  it('mọi màn nạp thu-quai.css (biến phải có mặt dù vào màn nào trước)', () => {
    for (const t of ['DoanHoTong.tsx', 'dao2/Dao2.tsx', 'dao2/TrongAi.tsx']) expect(doc(D + t), t).toContain("thu-quai.css'")
  })
  it('không hex thô trong các tệp vừa sửa', () => {
    for (const t of ['doan.css', 'doan2/doan2.css', 'doan2/doan2-ngang.css', 'dao2/dao2.css']) expect(doc(D + t), t).not.toMatch(/#[0-9a-fA-F]{3,8}\b(?![\w-])/)
  })
})
