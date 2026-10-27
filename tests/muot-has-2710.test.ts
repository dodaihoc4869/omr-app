// CHỐT ĐỘ MƯỢT 27/10 (thầy: «TỐI ƯU CHUYÊN SÂU TỐC ĐỘ, ĐỘ MƯỢT TỨC THÌ NHƯ APP CŨ»): đo scripts/do-muot-hs.mjs cho thấy vài luật `:has()` làm Chrome tính
// lại kiểu CẢ TRANG sau mỗi lần thêm / gỡ nút (bấm «Tiếp tục» ở CPU ×4: 4–5 lượt × ~1 100 phần tử, 100–300 ms mỗi lượt):
//   1. `:has()` ở GỐC (`:root:has(.ht2) …`) — <html> phải soát lại sau mọi thay đổi, luật con cháu kéo cả trang tính lại;
//   2. `:has()` ở vế giữa mà vế cuối là `*` (`.x:has(.y) > *`, `body:has(.z) *`) — Chrome gom MỌI luật :has() (kể cả trong @media không khớp, @media print)
//      thành một tập «mất hiệu lực»; chỉ một luật «… > *» là tập ấy thành «mọi con cháu» ⇒ cả trang.
// Test này giữ hai lỗi ấy không quay lại (mọi tờ CSS trong src/). Cần điều kiện kiểu đó ⇒ gắn thuộc tính lên phần tử bằng JS (xem useDanhDauHt2,
// DanhDauDe, `data-hai-cot`, `data-co-phim`).
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

const GOC = join(__dirname, '..')
const tepCss = (d: string): string[] => readdirSync(d).flatMap((t) => {
  const p = join(d, t)
  return statSync(p).isDirectory() ? tepCss(p) : t.endsWith('.css') ? [p] : []
})
/** Tách theo dấu phân cách ở mức ngoài cùng (bỏ qua trong ngoặc tròn / vuông). */
function tach(s: string, sep: string): string[] {
  const ra: string[] = []
  let cur = '', sau = 0
  for (const c of s) {
    if (c === '(' || c === '[') sau++
    if (c === ')' || c === ']') sau--
    if (sau === 0 && sep.includes(c)) { ra.push(cur); cur = ''; continue }
    cur += c
  }
  ra.push(cur)
  return ra
}
const khongChuThich = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')
/** Mọi bộ chọn có `:has(` trong một tệp, kèm số dòng. */
function boChonHas(f: string): { dong: number; chon: string }[] {
  const css = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  const ra: { dong: number; chon: string }[] = []
  for (const m of css.matchAll(/([^{};]+)\{/g)) {
    const dau = m[1]!.trim()
    if (!dau || dau.startsWith('@') || !dau.includes(':has(')) continue
    const dong = css.slice(0, m.index).split('\n').length
    for (const chon of tach(dau, ',')) if (chon.includes(':has(')) ra.push({ dong, chon: chon.trim().replace(/\s+/g, ' ') })
  }
  return ra
}
const TAT_CA = tepCss(join(GOC, 'src')).flatMap((f) => boChonHas(f).map((x) => ({ ...x, tep: relative(GOC, f) })))

// Ngoại lệ đã biết, CÓ LÝ DO (không thêm mới):
//  · trong-hs.css: `:root[data-trong='hs']:has(.tr-menu-dem:not(:empty))` chỉ trong @media ≥ 1024 px (máy tính) — luật trong @media không khớp không
//    được so khớp nên điện thoại không bị gắn cờ; máy tính dư sức.
//  · luyen-khac-phuc.css `… :is(div:has(…)) ~ *` — tổ hợp ANH EM (không lan xuống con cháu), màn Luyện đề chuẩn xoay ngang.
const NGOAI_LE = [/:root\[data-trong='hs'\]:has\(\.tr-menu-dem:not\(:empty\)\)/, /^\.ldc-lam \.the-cau > div:last-child > :is\(div:has/]

describe('độ mượt 27/10: luật :has() không bắt tính lại kiểu cả trang', () => {
  it('quét được các tờ CSS (bảo đảm test thật sự đọc)', () => {
    expect(TAT_CA.length).toBeGreaterThan(20)
  })
  it('không có :has() đặt ở <html> / :root / <body> có luật con cháu kiểu «*»', () => {
    const sai = TAT_CA.filter(({ chon }) => !NGOAI_LE.some((r) => r.test(chon))).filter(({ chon }) => {
      const vt = tach(chon, ' >+~').filter(Boolean)
      const dau = vt[0] ?? ''
      return /^(html|:root|\[data-trong[^\]]*\]:root|:root\[[^\]]*\])[^ ]*:has\(/.test(dau) && /:has\(/.test(dau)
    })
    expect(sai.map((x) => `${x.tep}:${x.dong} ${x.chon}`)).toEqual([])
  })
  it('không có «X:has(…) … *» (vế cuối chỉ là * — tập mất hiệu lực thành «mọi con cháu»)', () => {
    const sai = TAT_CA.filter(({ chon }) => !NGOAI_LE.some((r) => r.test(chon))).filter(({ chon }) => {
      const vt = tach(chon, ' >+~').filter(Boolean)
      const iHas = vt.reduce((m, v, i) => (v.includes(':has(') ? i : m), -1)
      if (iHas < 0 || iHas === vt.length - 1) return false // :has() ở chính phần tử được tô ⇒ chỉ soát phần tử ấy
      // vế cuối bỏ giả lớp / giả phần tử (:hover, ::after, :not(…)…) mà còn trống hoặc chỉ «*» ⇒ không có lớp / thẻ / thuộc tính để khoanh vùng
      const cuoi = vt[vt.length - 1]!.replace(/::?(?:before|after|hover|focus|focus-visible|focus-within|active|first-child|last-child|only-child|empty|checked|disabled)\b|:(?:not|nth-child|nth-of-type)\([^()]*\)/g, '')
      return cuoi === '' || cuoi === '*'
    })
    expect(sai.map((x) => `${x.tep}:${x.dong} ${x.chon}`)).toEqual([])
  })
  it('in đề: luật @media print đọc html[data-co-de], không dùng body:has(.thi-noi-dung)', () => {
    const css = khongChuThich(readFileSync(join(GOC, 'src/index.css'), 'utf8'))
    expect(css).not.toContain('body:has(.thi-noi-dung)')
    expect(css).toMatch(/html\[data-co-de\] body \* \{\s*visibility: hidden !important;/)
    expect(css).toContain('Đề thi không được in')
    const man = readFileSync(join(GOC, 'src/screens/ExamTakeScreen.tsx'), 'utf8')
    expect(man).toContain('<div className="thi-hai-cot thi-noi-dung"><DanhDauDe />')
    expect(man).toMatch(/<DanhDauDe \/><KhungDuo /)
    expect(man).toMatch(/<DanhDauDe \/>\s*<LamBaiNgang/)
  })
  it('phông tròn cổng học sinh: :root[data-ht2] do HocTapHomNay / ManTuChua gắn (không :root:has(.ht2))', () => {
    const css = khongChuThich(readFileSync(join(GOC, 'src/styles/trong-hs.css'), 'utf8'))
    expect(css).not.toContain(':has(.ht2)')
    expect(css).toContain(":root[data-trong='hs'][data-ht2] {")
    expect(readFileSync(join(GOC, 'src/components/hoc-tap/HocTapHomNay.tsx'), 'utf8')).toMatch(/export default function HocTapHomNay\(p: Props\) \{\n {2}useDanhDauHt2\(\)/)
    expect(readFileSync(join(GOC, 'src/components/hoc-tap/ManTuChua.tsx'), 'utf8')).toContain('useDanhDauHt2()')
  })
})
