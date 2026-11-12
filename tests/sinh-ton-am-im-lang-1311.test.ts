// TRÒ «SINH TỒN» · TIẾNG Ở PHÒNG CHỜ CA KIỂM TRA (13/11): vào trò ở sảnh ca thì mặc định IM LẶNG, em bấm loa mới bật,
// và lựa chọn ở sảnh ca KHÔNG được ghi đè lựa chọn loa em đã lưu cho phòng chờ live (khoá 'ddh.sinhton.am').
import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it } from 'vitest'
import { datTat, docTat } from '../src/components/live-khoi/sinh-ton-am'

const KHOA = 'ddh.sinhton.am'

describe('Sinh Tồn — tiếng mặc định tắt ở phòng chờ ca kiểm tra', () => {
  beforeEach(() => { localStorage.clear(); datTat(false, false) })

  it('datTat(…, false) không đụng lựa chọn đã lưu: em đang BẬT tiếng ở phòng live vẫn bật sau khi qua sảnh ca', () => {
    expect(docTat()).toBe(false)
    datTat(true, false)
    expect(localStorage.getItem(KHOA)).toBeNull()
    // Lần sau mở trò ở phòng live: đọc lại kho ⇒ vẫn bật tiếng.
    expect(docTat()).toBe(false)
  })

  it('datTat(…, false) cũng không xoá lựa chọn TẮT em đã lưu', () => {
    datTat(true)
    expect(localStorage.getItem(KHOA)).toBe('tat')
    datTat(false, false)
    expect(localStorage.getItem(KHOA)).toBe('tat')
    expect(docTat()).toBe(true)
  })

  it('mặc định (phòng live) vẫn ghi lựa chọn như trước', () => {
    datTat(true)
    expect(localStorage.getItem(KHOA)).toBe('tat')
    datTat(false)
    expect(localStorage.getItem(KHOA)).toBeNull()
  })

  it('thẻ sảnh ca truyền imLang; phòng chờ live thì không', () => {
    const sanh = readFileSync('src/components/phong-cho/SanhSinhTon.tsx', 'utf8')
    expect(sanh).toMatch(/<TroSinhTon[^>]*\bimLang\b/)
    const live = readFileSync('src/components/live-khoi/LopNoiEm.tsx', 'utf8')
    expect(live).not.toMatch(/imLang/)
    const tro = readFileSync('src/components/live-khoi/TroSinhTon.tsx', 'utf8')
    expect(tro).toMatch(/datTat\(true, false\)/)
    expect(tro).toMatch(/datTat\(v, !imLang\)/)
  })
})
