// LƯU APP RA MÀN HÌNH CHÍNH IPHONE KHÔNG ĐƯỢC NHẢY VÀO APP GIÁO VIÊN.
//
// Thầy quay video 14/09: em lưu app ra màn hình chính iPhone, mở lên thì vào
// thẳng app GIÁO VIÊN.
//
// Hai nguyên nhân chồng nhau:
//   1. Thẻ `<link rel="manifest">` trong HTML luôn trỏ `manifest.json` (bản của
//      thầy). Mã JS đổi thẻ sau đó ĐÃ MUỘN — Safari đọc manifest ngay lúc phân
//      tích HTML, và "Thêm vào Màn hình chính" dùng bản đã đọc.
//   2. `start_url` của cả ba bản đều trần, nên biểu tượng mở `/` và app phải
//      TRA localStorage mới biết vai. App đã cài trên iOS có kho lưu RIÊNG,
//      trống trơn ⇒ không biết vai ⇒ rơi về màn quản lý của thầy.
import { describe, expect, it, beforeEach } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { laManThayQuanLy, nhoVaiDaDung } from '../src/lib/vai-tro'

const doc = (p: string) => readFileSync(resolve(__dirname, '..', p), 'utf8')
const json = (p: string) => JSON.parse(doc(p)) as Record<string, string>

describe('manifest mang sẵn vai trong start_url', () => {
  // ĐỔI 14/09 lượt 12: vai chuyển từ THAM SỐ (`./?vai=hocsinh`) sang ĐƯỜNG DẪN
  // (`./hs`). Ý ĐỊNH của phép kiểm giữ nguyên — không bản nào được để đường
  // trần — nhưng đường dẫn chắc hơn: phần sau dấu `?` bị Zalo và trình rút gọn
  // cắt mất là rơi về `/` trần, còn đường dẫn thì không. Xem `src/lib/khoa-vai.ts`.
  //
  // `id` GIỮ NGUYÊN dạng cũ: đổi `id` là trình duyệt coi đây là app khác, người
  // đã cài sẽ thấy biểu tượng thứ hai thay vì được cập nhật.
  const bo = [
    ['public/manifest.json', 'gv', './gv', 'ĐỖ ĐẠI HỌC'],
    ['public/manifest-hs.json', 'hocsinh', './hs', 'ĐĐH Học Sinh'],
    ['public/manifest-ph.json', 'phuhuynh', './ph', 'ĐĐH Phụ Huynh'],
  ] as const

  it('cả ba bản đều ghi rõ vai, không bản nào để đường trần', () => {
    for (const [f, vai, duong, ten] of bo) {
      const m = json(f)
      expect(m.start_url, f).toBe(duong)
      expect(m.start_url, f).not.toBe('./')
      expect(m.id, f).toBe(`/?vai=${vai}`)
      expect(m.short_name, f).toBe(ten)
      expect(m.scope, f).toBe('./')
    }
  })

  it('không bản nào còn dấu vết đường dẫn GitHub Pages cũ', () => {
    for (const [f] of bo) {
      expect(json(f).id, f).not.toContain('/omr-app/')
      expect(json(f).start_url, f).not.toContain('/omr-app/')
    }
  })
})

describe('HTML chọn manifest ngay lúc phân tích, không đợi React', () => {
  const html = doc('index.html')

  it('không còn thẻ manifest cứng trỏ bản của thầy trong luồng chính', () => {
    // Chỉ được phép còn MỘT chỗ: trong <noscript> làm đường lui.
    const soThe = (html.match(/<link rel="manifest" href="\/manifest\.json" \/>/g) || []).length
    expect(soThe).toBe(1)
    expect(html).toContain('<noscript><link rel="manifest" href="/manifest.json" /></noscript>')
  })

  it('có đoạn mã đồng bộ đọc vai từ đường dẫn rồi mới viết thẻ', () => {
    expect(html).toContain("document.write('<link rel=\"manifest\" href=\"/' + ten + '\">')")
    expect(html).toContain('manifest-hs.json')
    expect(html).toContain('manifest-ph.json')
    // Tên app trên màn hình chính iPhone cũng phải theo vai.
    expect(html).toContain('apple-mobile-web-app-title')
    expect(html).toContain('ĐĐH Học Sinh')
  })

  it('hỏng mã vẫn còn đường lui, không mất hẳn manifest', () => {
    expect(html).toContain("document.write('<link rel=\"manifest\" href=\"/manifest.json\">')")
    expect(html).toContain('<noscript><link rel="manifest" href="/manifest.json" /></noscript>')
  })
})

describe('app đã cài mở `/` trần thì KHÔNG đổ vào màn thầy', () => {
  beforeEach(() => {
    try { localStorage.clear() } catch { /* trống */ }
  })

  it('máy chưa nhớ vai + đang chạy từ biểu tượng ⇒ vào cổng học sinh', () => {
    expect(laManThayQuanLy('', '/', () => true)).toBe(false)
  })

  it('mở trong TAB trình duyệt cũng KHÔNG ra màn thầy nữa', () => {
    // ĐỔI 15/09: `/` trần không còn là màn thầy trong bất cứ hoàn cảnh nào —
    // không phân biệt biểu tượng hay tab, không hỏi cờ nào. Thầy chốt "app
    // giáo viên khoá cứng lại không thể chạm vào được bằng cách nào", mà `/`
    // trần là địa chỉ ai gõ tay cũng ra.
    expect(laManThayQuanLy('', '/', () => false)).toBe(false)
  })

  it('`?vai=gv` luôn thắng, kể cả khi đang chạy từ biểu tượng', () => {
    expect(laManThayQuanLy('?vai=gv', '/', () => true)).toBe(true)
  })

  it('máy đã dùng vai thầy thì biểu tượng CŨNG KHÔNG mở màn thầy', () => {
    // ĐỔI 15/09: cờ trong localStorage không còn quyền quyết định gì — nó là
    // khoá CHUNG GỐC của cả ba app. Thầy vào app của mình bằng link `/gv`, và
    // biểu tượng của thầy có `start_url` là `./gv`.
    nhoVaiDaDung('gv')
    expect(laManThayQuanLy('', '/', () => true)).toBe(false)
  })

  it('đường có vai rõ ràng thì không phụ thuộc cờ đã cài', () => {
    expect(laManThayQuanLy('?vai=hocsinh', '/', () => true)).toBe(false)
    expect(laManThayQuanLy('', '/hoc-sinh', () => false)).toBe(false)
    expect(laManThayQuanLy('?vai=phuhuynh', '/', () => false)).toBe(false)
  })
})
