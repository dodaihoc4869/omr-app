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
    for (const k of ['chon', 'dung', 'sai', 'xong', 'combo', 'combo3', 'combo5', 'combo10'] as const) { rung(k); expect(vibrate).toHaveBeenLastCalledWith(MAU_RUNG[k]) }
    expect(MAU_RUNG).toEqual({ chon: [35], dung: [60], sai: [80, 70, 80], xong: [60, 50, 60, 50, 140], combo: [40, 40, 40],
      combo3: [40, 40, 40, 40, 90], combo5: [50, 40, 50, 40, 50, 40, 160], combo10: [60, 40, 60, 40, 60, 40, 60, 60, 240] })
    // thầy 27/10: mốc combo mạnh dần, mọi nhịp ≥ 35 ms (Android)
    for (const m of Object.values(MAU_RUNG)) for (const n of m) expect(n).toBeGreaterThanOrEqual(35)
    expect(MAU_RUNG.combo10.reduce((a, b) => a + b)).toBeGreaterThan(MAU_RUNG.combo5.reduce((a, b) => a + b))
    expect(MAU_RUNG.combo5.reduce((a, b) => a + b)).toBeGreaterThan(MAU_RUNG.combo3.reduce((a, b) => a + b))
    phanHoi('sai')
    expect(vibrate).toHaveBeenLastCalledWith([80, 70, 80])
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
