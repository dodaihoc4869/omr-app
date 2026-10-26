// @vitest-environment jsdom
// RUNG PHẢN HỒI kiểu Duolingo (thầy 26/10): đúng mẫu cho chon/dung/sai/xong; chỉ khi <html data-trong="hs"> và em chưa tắt ('ddh.rung' = 'tat');
// không có navigator.vibrate (iPhone) ⇒ bấm nhãn công tắc ẩn (iOS 18+); không gắn ở màn thi thật.
import { readFileSync } from 'node:fs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAU_RUNG, rung } from '../src/lib/rung'
import { phanHoi } from '../src/lib/phan-hoi'

const vibrate = vi.fn(() => true)
beforeEach(() => { document.documentElement.dataset.trong = 'hs'; Object.defineProperty(navigator, 'vibrate', { value: vibrate, configurable: true, writable: true }) })
afterEach(() => { vibrate.mockClear(); localStorage.clear(); delete document.documentElement.dataset.trong })

describe('rung.ts', () => {
  it('gọi vibrate đúng mẫu cho từng kiểu', () => {
    for (const k of ['chon', 'dung', 'sai', 'xong', 'combo'] as const) { rung(k); expect(vibrate).toHaveBeenLastCalledWith(MAU_RUNG[k]) }
    expect(MAU_RUNG).toEqual({ chon: [10], dung: [18], sai: [35, 60, 35], xong: [20, 40, 20, 40, 60], combo: [14, 40, 14] })
    phanHoi('sai')
    expect(vibrate).toHaveBeenLastCalledWith([35, 60, 35])
  })
  it("tắt khi 'ddh.rung' = 'tat', khi không có data-trong, khi data-trong không phải học sinh", () => {
    localStorage.setItem('ddh.rung', 'tat'); rung('dung')
    localStorage.removeItem('ddh.rung'); delete document.documentElement.dataset.trong; rung('dung')
    document.documentElement.dataset.trong = 'gv'; rung('dung')
    expect(vibrate).not.toHaveBeenCalled()
  })
  it('không có navigator.vibrate ⇒ bấm nhãn công tắc ẩn (dựng một lần), lỗi im lặng', () => {
    Object.defineProperty(navigator, 'vibrate', { value: undefined, configurable: true, writable: true })
    const bam = vi.spyOn(HTMLLabelElement.prototype, 'click')
    rung('chon'); rung('dung')
    expect(bam).toHaveBeenCalledTimes(2)
    expect(document.querySelectorAll('input[switch]')).toHaveLength(1)
    bam.mockRestore()
  })
  it('không gắn ở màn thi thật', () => {
    for (const t of ['src/screens/ExamTakeScreen.tsx', 'src/AppThi.tsx']) {
      let s = ''
      try { s = readFileSync(t, 'utf8') } catch { continue }
      expect(s).not.toMatch(/phan-hoi|lib\/rung|am-thanh/)
    }
  })
})
