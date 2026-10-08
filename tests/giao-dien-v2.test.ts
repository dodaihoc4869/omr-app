import { afterEach, describe, expect, it } from 'vitest'
import { apDungGiaoDien, docGiaoDien, KHOA_GIAO_DIEN } from '../src/lib/giao-dien-thay'

afterEach(() => {
  delete document.documentElement.dataset.phongCach
  localStorage.removeItem(KHOA_GIAO_DIEN)
  apDungGiaoDien('may')
  document.head.querySelectorAll('[data-test-v2]').forEach(e => e.remove())
})

describe('Bảng màu V2 trên cả ba vai', () => {
  it('V2 dùng bảng màu đã duyệt ngay cả khi máy lưu lựa chọn tối trước đây', () => {
    localStorage.setItem(KHOA_GIAO_DIEN, 'toi')
    document.documentElement.dataset.phongCach = 'v2'
    expect(docGiaoDien()).toBe('sang')
    apDungGiaoDien('toi')
    expect(document.documentElement.dataset.giaoDien).toBe('sang')
    expect(document.documentElement.style.colorScheme).toBe('light')
    expect(localStorage.getItem(KHOA_GIAO_DIEN)).toBe('toi')
  })
  it('luật CSS tối của màn con không ghi đè màu V2', () => {
    const style = document.createElement('style')
    style.dataset.testV2 = ''
    style.textContent = '@media (prefers-color-scheme: dark) { .m3 { color: white } }'
    document.head.append(style)
    document.documentElement.dataset.phongCach = 'v2'
    apDungGiaoDien('may')
    expect((style.sheet!.cssRules[0] as CSSMediaRule).media.mediaText).toBe('(min-width: 999999px)')
  })
  it('công cụ / bản xem trước ngoài V2 vẫn giữ lựa chọn giao diện cũ', () => {
    localStorage.setItem(KHOA_GIAO_DIEN, 'toi')
    expect(docGiaoDien()).toBe('toi')
  })
})
