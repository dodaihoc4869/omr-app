import { describe, expect, it, beforeEach } from 'vitest'
import { docDuongVao, laManThayQuanLy, nhoVaiDaDung, vaiDaDung } from '../src/lib/vai-tro'
import manifestHs from '../public/manifest-hs.json'
import manifestPh from '../public/manifest-ph.json'

beforeEach(() => {
  localStorage.clear()
})

describe('Sửa triệt để lỗi iOS thêm vào màn hình chính bị nhảy vào app giáo viên', () => {
  it('manifest học sinh có start_url trỏ tới cổng học sinh', () => {
    expect(manifestHs.start_url).toBe('./hoc-sinh')
    expect(manifestHs.name).toContain('Học Sinh')
    expect(manifestHs.display).toBe('standalone')
  })

  it('manifest phụ huynh có start_url trỏ tới cổng phụ huynh', () => {
    expect(manifestPh.start_url).toBe('./phu-huynh')
    expect(manifestPh.name).toContain('Phụ Huynh')
    expect(manifestPh.display).toBe('standalone')
  })

  it('đường /hoc-sinh và /phu-huynh nhận đúng vai', () => {
    expect(docDuongVao('', '/hoc-sinh').vai).toBe('hocsinh')
    expect(docDuongVao('', '/phu-huynh').vai).toBe('phuhuynh')
  })

  it('khi máy đã ghi nhận vai học sinh (hs), mở / trần không coi là màn thầy', () => {
    nhoVaiDaDung('hs')
    expect(vaiDaDung()).toBe('hs')
    expect(laManThayQuanLy('', '/omr-app/')).toBe(false)
    expect(laManThayQuanLy('', '/')).toBe(false)
  })

  it('khi máy đã ghi nhận vai phụ huynh (ph), mở / trần không coi là màn thầy', () => {
    nhoVaiDaDung('ph')
    expect(vaiDaDung()).toBe('ph')
    expect(laManThayQuanLy('', '/omr-app/')).toBe(false)
    expect(laManThayQuanLy('', '/')).toBe(false)
  })

  it('mở có tham số ?vai=gv vẫn luôn thắng cờ', () => {
    nhoVaiDaDung('hs')
    expect(laManThayQuanLy('?vai=gv', '/omr-app/')).toBe(true)
  })
})
