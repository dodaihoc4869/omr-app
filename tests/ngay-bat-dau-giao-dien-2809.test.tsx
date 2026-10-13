// Giữ kiểm bộ đọc Sảnh HS; hộp chiến dịch cũ đã được thay bằng danh sách Gói7.
import { describe, expect, it } from 'vitest'
import { docSanh } from '../src/components/hoa2/api'

describe('Sảnh HS: chiến dịch sắp bắt đầu', () => {
  it('đọc `sapBatDau` (tên + ngày); máy chủ cũ không gửi ⇒ null', () => {
    const goc = { cheDo2: true, ngay: '2026-09-30', chienDich: null, theLuc: { con: 0, tong: 0 }, ruong: {} }
    const r = docSanh({ ...goc, sapBatDau: { id: 'x', ten: 'Ester', batDau: '2026-10-01', hanNop: '2026-10-05' } })
    expect(r && 'sanh' in r ? r.sanh.sapBatDau : undefined).toEqual({ ten: 'Ester', batDau: '2026-10-01' })
    const cu = docSanh(goc)
    expect(cu && 'sanh' in cu ? cu.sanh.sapBatDau : undefined).toBeNull()
  })
})
