// TƯƠNG PHẢN MÀU CHỮ — đo bằng số, không bằng mắt.
//
// Vì sao có tệp này: Lighthouse 10/09 chấm Accessibility 93 và chỉ đúng chỗ —
// `--mo` cũ (#9ca3af) chỉ đạt tương phản 2,54 trên nền trắng, 2,39 trên nền thẻ.
// WCAG AA đòi 4,5 cho chữ thường dưới 18,66px, mà `--mo` đang dùng ở 13px.
// Thầy cầm điện thoại đứng lớp, học sinh đọc trên máy cũ: chữ 2,4 là chữ để
// trang trí chứ không phải để đọc.
//
// Luật chụp màn hình đang cấm, nên chỗ này phải kiểm được bằng LỆNH. Tệp này
// đọc thẳng `tokens.css` và tính công thức WCAG — đổi token mà tụt xuống dưới
// ngưỡng là ĐỎ ngay, không đợi ai để ý.
import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const CSS = fs.readFileSync(path.join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

/** Độ chói tương đối theo WCAG 2.1. */
function doChoi(hex: string): number {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const t = c.map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * t[0] + 0.7152 * t[1] + 0.0722 * t[2]
}

/** Tỉ số tương phản WCAG giữa hai màu. */
export function tuongPhan(a: string, b: string): number {
  const [l1, l2] = [doChoi(a), doChoi(b)].sort((x, y) => y - x)
  return (l1 + 0.05) / (l2 + 0.05)
}

/** Đọc token trong MỘT khối `:root` hoặc khối nền tối. */
function docToken(khoi: string): Record<string, string> {
  const ra: Record<string, string> = {}
  for (const m of khoi.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) ra[m[1]] = m[2].toLowerCase()
  return ra
}

const iToi = CSS.indexOf('prefers-color-scheme: dark')
const SANG = docToken(CSS.slice(0, iToi))
const TOI = docToken(CSS.slice(iToi))

/** Ba bề mặt mà chữ thân bài thật sự nằm lên. */
const BE_MAT = ['nen', 'the', 'the-2']
/** Hai bậc chữ mờ — dùng ở cỡ 13px nên phải đạt AA chữ thường. */
const CHU_THAN = ['muc', 'nhat', 'mo']
const AA = 4.5

describe('CÔNG THỨC ĐÚNG TRƯỚC ĐÃ', () => {
  it('trắng trên đen là 21, cùng màu là 1', () => {
    expect(tuongPhan('#ffffff', '#000000')).toBeCloseTo(21, 1)
    expect(tuongPhan('#123456', '#123456')).toBeCloseTo(1, 6)
  })

  it('bắt đúng con số Lighthouse đã chấm cho token cũ', () => {
    // #9ca3af trên #ffffff — Lighthouse báo 2,53; công thức phải ra cùng số.
    expect(tuongPhan('#9ca3af', '#ffffff')).toBeCloseTo(2.54, 1)
  })

  it('đọc được token từ tokens.css, cả hai nền', () => {
    for (const k of [...BE_MAT, ...CHU_THAN]) {
      expect(SANG[k], `nền sáng thiếu --${k}`).toMatch(/^#[0-9a-f]{6}$/)
      expect(TOI[k], `nền tối thiếu --${k}`).toMatch(/^#[0-9a-f]{6}$/)
    }
  })
})

describe('MỌI BẬC CHỮ ĐỀU ĐẠT WCAG AA TRÊN MỌI BỀ MẶT', () => {
  for (const [ten, bang] of [
    ['nền sáng', SANG],
    ['nền tối', TOI],
  ] as [string, Record<string, string>][]) {
    for (const chu of CHU_THAN) {
      for (const nen of BE_MAT) {
        it(`${ten}: --${chu} trên --${nen}`, () => {
          const t = tuongPhan(bang[chu], bang[nen])
          expect(t, `--${chu} (${bang[chu]}) trên --${nen} (${bang[nen]}) chỉ đạt ${t.toFixed(2)}`).toBeGreaterThanOrEqual(AA)
        })
      }
    }
  }
})

describe('HAI BẬC MỜ VẪN PHÂN BIỆT ĐƯỢC — sửa tương phản không được làm phẳng hệ', () => {
  it('nền sáng: --nhat đậm hơn --mo, --mo đậm hơn nền', () => {
    expect(doChoi(SANG.nhat)).toBeLessThan(doChoi(SANG.mo))
    expect(doChoi(SANG.mo)).toBeLessThan(doChoi(SANG['the-2']))
  })

  it('nền tối: --nhat sáng hơn --mo, --mo sáng hơn nền', () => {
    expect(doChoi(TOI.nhat)).toBeGreaterThan(doChoi(TOI.mo))
    expect(doChoi(TOI.mo)).toBeGreaterThan(doChoi(TOI['the-2']))
  })

  it('hai bậc cách nhau đủ để mắt thấy khác nhau', () => {
    // Dưới 1,15 lần thì hai bậc nhìn như một — hết tác dụng phân cấp.
    expect(tuongPhan(SANG.nhat, SANG.the) / tuongPhan(SANG.mo, SANG.the)).toBeGreaterThan(1.15)
    expect(tuongPhan(TOI.nhat, TOI.the) / tuongPhan(TOI.mo, TOI.the)).toBeGreaterThan(1.15)
  })
})

describe('BA CHỖ LIGHTHOUSE CHẤM TRƯỢT — vá luôn, mỗi chỗ một dòng kiểm', () => {
  const HTML = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8')

  it('có mô tả trang', () => {
    expect(HTML).toMatch(/<meta name="description" content="[^"]{40,}"/)
  })

  it('có mốc `main` cho trình đọc màn hình', () => {
    expect(HTML).toContain('<main id="root"></main>')
    expect(HTML).not.toContain('<div id="root"></div>')
  })

  it('robots.txt CHẶN HẾT — app của lớp không có việc gì trên máy tìm kiếm', () => {
    const r = fs.readFileSync(path.join(process.cwd(), 'public/robots.txt'), 'utf8')
    expect(r).toContain('User-agent: *')
    expect(r).toContain('Disallow: /')
    expect(r).not.toMatch(/^Allow:/m)
  })
})
