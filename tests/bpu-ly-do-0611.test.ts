// Bình Phản Ứng — ba dòng «Vì sao chọn em» (src/lib/bpu/ly-do.ts): chỉ dữ liệu thật, không nhãn năng lực / tên tầng / xác suất trên màn chiếu.
import { describe, expect, it } from 'vitest'
import { lyDoLenBang } from '../src/lib/bpu/ly-do'

const NOW = Date.parse('2026-11-07T12:00:00Z')
describe('lý do gọi lên bảng', () => {
  it('đã đúng / đã sai / ước lượng / chưa có số đo', () => {
    expect(lyDoLenBang({ loai: 'da_dung', soLan14: 0 }, { nowMs: NOW })[0]).toMatch(/đã tự làm đúng câu này/)
    expect(lyDoLenBang({ loai: 'chua_co', soSai: 2 }, { nowMs: NOW })[0]).toMatch(/sai câu này 2 lần/)
    expect(lyDoLenBang({ loai: 'du_bao' }, { mucDo: 'Thông hiểu', nowMs: NOW })[0]).toBe('Theo lịch sử làm bài trên app, câu thông hiểu này vừa sức em.')
    expect(lyDoLenBang({ loai: 'chua_co' }, { nowMs: NOW })[0]).toMatch(/mới với em/)
  })
  it('số ngày chưa lên bảng; tối đa 3 dòng; không tên tầng, không phần trăm', () => {
    const l = lyDoLenBang({ loai: 'du_bao', soLan14: 1, lanCuoiLenBang: '2026-10-28T10:00:00Z' }, { mucDo: 'Vận dụng', giayGui: 8.4, nowMs: NOW })
    expect(l).toHaveLength(3)
    expect(l[1]).toBe('Lượt này em gửi đáp án sau 8 giây.')
    expect(l[2]).toBe('10 ngày chưa lên bảng.')
    for (const d of l) expect(d).not.toMatch(/Cần kèm|Trung bình|Khá|%|yếu|kém/)
    expect(lyDoLenBang({ loai: 'chua_co', soLan14: 0 }, { nowMs: NOW }).at(-1)).toBe('Chưa lên bảng trong 14 ngày qua.')
  })
})
