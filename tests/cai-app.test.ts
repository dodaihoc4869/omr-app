// NÚT CÀI APP (PWA) — hai vai cài ra hai app khác nhau, "Để sau" im 7 ngày.
import { describe, expect, it, beforeEach } from 'vitest'
import { daBoQuaNhacCai, ghiNhoBoQuaNhacCai, NGAY_IM_LANG } from '../src/lib/pwa-install'
import { tinGuiLinkCaiApp } from '../src/lib/ca-link'
import manifestHS from '../public/manifest-hs.json'
import manifestPH from '../public/manifest-ph.json'

const NGAY = 86400000

beforeEach(() => localStorage.clear())

describe('Manifest hai vai', () => {
  it('tên, biểu tượng và id khác nhau — không cài nhầm app của nhau', () => {
    expect(manifestHS.name).not.toBe(manifestPH.name)
    expect(manifestHS.short_name).toBe('ĐĐH Học sinh')
    expect(manifestPH.short_name).toBe('ĐĐH Phụ huynh')
    expect(manifestHS.id).not.toBe(manifestPH.id)
    expect(manifestHS.icons.map((i) => i.src)).toEqual(['icon-hs-192.png', 'icon-hs-512.png'])
    expect(manifestPH.icons.map((i) => i.src)).toEqual(['icon-ph-192.png', 'icon-ph-512.png'])
  })

  it('đường dẫn TƯƠNG ĐỐI để chạy đúng dưới /omr-app/ của GitHub Pages', () => {
    for (const m of [manifestHS, manifestPH]) {
      expect(m.scope).toBe('./')
      expect(m.start_url.startsWith('./')).toBe(true)
      expect(m.icons.every((i) => !i.src.startsWith('/'))).toBe(true)
    }
  })

  it('standalone + dọc: mở từ biểu tượng là ẩn thanh địa chỉ', () => {
    for (const m of [manifestHS, manifestPH]) {
      expect(m.display).toBe('standalone')
      expect(m.orientation).toBe('portrait')
    }
  })

  it('biểu tượng khai maskable để Android bo góc không cắt mất chữ', () => {
    for (const m of [manifestHS, manifestPH]) {
      expect(m.icons.every((i) => i.purpose === 'any maskable')).toBe(true)
    }
  })

  it('start_url mang sẵn vai để mở từ biểu tượng vào đúng app', () => {
    expect(manifestHS.start_url).toContain('vai=hs')
    expect(manifestPH.start_url).toContain('vai=ph')
  })
})

describe('"Để sau" im 7 ngày rồi nhắc lại', () => {
  it('vừa bấm để sau thì không hỏi lại', () => {
    const now = Date.parse('2026-09-03T10:00:00Z')
    ghiNhoBoQuaNhacCai(now)
    expect(daBoQuaNhacCai(now)).toBe(true)
    expect(daBoQuaNhacCai(now + 6 * NGAY)).toBe(true)
  })

  it('quá 7 ngày thì nhắc lại', () => {
    const now = Date.parse('2026-09-03T10:00:00Z')
    ghiNhoBoQuaNhacCai(now)
    expect(daBoQuaNhacCai(now + NGAY_IM_LANG * NGAY + 1000)).toBe(false)
  })

  it('dữ liệu cũ (đánh dấu "1") vẫn hiểu là đã bỏ qua', () => {
    localStorage.setItem('ddh.boQuaCaiApp', '1')
    expect(daBoQuaNhacCai()).toBe(true)
  })

  it('chưa bấm gì thì có nhắc', () => {
    expect(daBoQuaNhacCai()).toBe(false)
  })
})

describe('Tin nhắn gửi link cài app', () => {
  it('có link, có hướng dẫn cài, có nhắc không chuyển tiếp — không lời chào', () => {
    const tin = tinGuiLinkCaiApp('ph/' + 'a'.repeat(32), 'Lê Minh Đức', 'ph')
    expect(tin).toContain('a'.repeat(32))
    expect(tin).toContain('Cài đặt')
    expect(tin).toContain('đừng chuyển tiếp')
    expect(tin).not.toContain('Kính gửi')
    expect(tin).not.toContain('Trân trọng')
  })

  it('tin cho học sinh nhắc không đưa link cho bạn khác', () => {
    const tin = tinGuiLinkCaiApp('hs/' + 'b'.repeat(32), 'Trần Bảo An', 'hs')
    expect(tin).toContain('Không đưa link này cho bạn khác')
  })
})
