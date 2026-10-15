// SỬA LỖI T10 (Kiểm thử văn phòng soát bản sống 15/10 12:21): màn đăng nhập /hs ở khổ ≥ 960 px tràn phải: 1280×800 thẻ `.bl-login__card`
// left 829 / right 1309, trang cuộn ngang 166 px, ô SBD, mật khẩu, nút Đăng nhập bị cắt mép phải (1024: 120 px, 1440: 195 px; 340 px không lỗi).
// Gốc: `giao-dien-day-du.css` (≥ 900 px) đã chuyển `.bl-login` sang lưới 2 cột, thẻ nằm trong ô 480 px; nhưng `bat-linh.css` (≥ 960 px) còn
// `.bl-login__card { margin-left: min(36vw, 520px) }` của bố cục cũ (thẻ đẩy sang phải ảnh cảnh) ⇒ trong ô lưới thẻ bị đẩy thêm 36vw.
// Khoá: quy tắc lưới tự đặt lề trái 0 với độ đặc hiệu ≥ mọi quy tắc bat-linh đẩy lề trái thẻ; bat-linh không còn đẩy lề trái thẻ ở khổ rộng.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const doc = (p: string) => fs.readFileSync(path.join(process.cwd(), p), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
const DAY_DU = doc('src/styles/giao-dien-day-du.css')
const BAT_LINH = doc('src/components/bat-linh/bat-linh.css')

/** Nội dung khối `@media (<dieuKien>)` đầu tiên (đếm ngoặc, bỏ khoảng trắng khi so điều kiện). */
const khoiMedia = (css: string, dieuKien: string) => {
  const re = /@media\s*([^{]+)\{/g
  for (let m = re.exec(css); m; m = re.exec(css)) {
    if (m[1].replace(/\s+/g, '') !== `(${dieuKien})`.replace(/\s+/g, '')) continue
    let sau = 1, i = re.lastIndex
    for (; i < css.length && sau > 0; i++) sau += css[i] === '{' ? 1 : css[i] === '}' ? -1 : 0
    return css.slice(re.lastIndex, i - 1)
  }
  throw new Error(`không thấy @media (${dieuKien})`)
}
/** Các quy tắc phẳng trong một khối: [bộ chọn, khai báo]. */
const quyTac = (khoi: string) => [...khoi.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => [m[1].trim(), m[2]] as const)
/** Độ đặc hiệu đơn giản (đủ cho bộ chọn lớp/thẻ ở đây): [id, lớp + thuộc tính + giả lớp, thẻ]. */
const dacHieu = (chon: string): [number, number, number] => [
  (chon.match(/#[\w-]+/g) || []).length,
  (chon.match(/\.[\w-]+|\[[^\]]+\]|:(?!:)[\w-]+/g) || []).length,
  (chon.replace(/[.#:][\w-]+|\[[^\]]+\]/g, ' ').match(/(^|[\s>+~])[a-z][\w-]*/gi) || []).length,
]
const lonHonHoacBang = (a: number[], b: number[]) => {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i]
  return true
}
/** Lề trái thẻ theo khai báo cuối cùng trong quy tắc (margin-left, margin-inline hoặc margin rút gọn); không có ⇒ undefined. */
const leTrai = (khai: string) => {
  let le: string | undefined
  for (const [, ten, gt] of khai.matchAll(/(?:^|;)\s*(margin(?:-left|-inline)?)\s*:\s*([^;]+)/g)) {
    const v = gt.replace(/!important/, '').trim().split(/\s+/)
    le = ten === 'margin-left' ? v[0] : ten === 'margin-inline' ? v[0] : v[v.length === 4 ? 3 : v.length === 1 ? 0 : 1]
  }
  return le
}
const thuocThe = (chon: string) => chon.split(',').map((s) => s.trim()).filter((s) => /\.bl-login__card(?![\w-])/.test(s))

describe('Màn đăng nhập /hs khổ rộng: thẻ nằm trọn trong ô lưới, không tràn phải', () => {
  const luoi = quyTac(khoiMedia(DAY_DU, 'min-width:900px')).find(([chon]) => thuocThe(chon).length > 0)

  it('lưới ≥ 900 px có quy tắc riêng cho thẻ đăng nhập', () => {
    expect(luoi?.[0]).toBe('.bl-login .bl-login__card')
  })

  it('quy tắc lưới đặt lề trái thẻ = 0 (thẻ không bị đẩy ra khỏi ô 480 px)', () => {
    expect(['0', '0px']).toContain(leTrai(luoi![1]))
  })

  it('độ đặc hiệu quy tắc lưới ≥ mọi quy tắc bat-linh đẩy lề trái thẻ ở khổ rộng', () => {
    const dayLe = quyTac(khoiMedia(BAT_LINH, 'min-width: 960px'))
      .flatMap(([chon, khai]) => thuocThe(chon).map((c) => [c, leTrai(khai)] as const))
      .filter(([, le]) => le && !['0', '0px'].includes(le))
    for (const [chon] of dayLe) expect(lonHonHoacBang(dacHieu(luoi![0]), dacHieu(chon)), chon).toBe(true)
  })

  it('bat-linh không còn đẩy lề trái thẻ theo bố cục cũ (min(36vw, …))', () => {
    expect(khoiMedia(BAT_LINH, 'min-width: 960px')).not.toMatch(/margin-left\s*:\s*min\(\s*36vw/)
  })
})
