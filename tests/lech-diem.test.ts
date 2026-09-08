// ĐIỂM SHEET LỆCH ĐIỂM CHẤM LẠI — số trong tệp này là SỐ THẬT đo trên máy chủ
// ngày 08/09/2026, không phải số bịa để phép kiểm xanh.
//
// Cách đo: lấy `chiTietCa` kèm keyBank của 11 ca, chấm lại từng lượt đã nộp
// bằng CHÍNH `gradeSubmissionFull` của app, rồi so với ô Tong trên LuotThi.
// 47 lượt: 42 khớp, 5 lệch. Cả 5 đều của SBD 12121212 (máy thầy tự thi thử);
// KHÔNG lượt nào của học sinh thật lệch.
import { describe, expect, it } from 'vitest'
import { dongLechDiem, emLechDiem, loiBaoLechDiem } from '../src/lib/lech-diem'

// Năm lượt lệch có thật, kèm điểm chấm lại bằng luật hiện tại.
const NAM_LUOT_THAT = [
  { sbd: '12121212', hoTen: 'Thi thử', maCa: '638242', tongSheet: 0.4, tongChamLai: 2.39 },
  { sbd: '12121212', hoTen: 'Thi thử', maCa: '789053', tongSheet: 1.1, tongChamLai: 2.39 },
  { sbd: '12121212', hoTen: 'Thi thử', maCa: '845853', tongSheet: 0.35, tongChamLai: 0.75 },
  { sbd: '12121212', hoTen: 'Thi thử', maCa: '845856', tongSheet: 0.76, tongChamLai: 0.56 },
  { sbd: '12121212', hoTen: 'Thi thử', maCa: '933467', tongSheet: 1.25, tongChamLai: 2.69 },
]

describe('emLechDiem', () => {
  it('bắt đúng năm lượt lệch đã đo được trên máy chủ', () => {
    expect(emLechDiem(NAM_LUOT_THAT)).toHaveLength(5)
  })

  it('điểm khớp thì im — 42 lượt còn lại không được kêu', () => {
    const khop = [
      { sbd: '12026', hoTen: 'A', tongSheet: 6.69, tongChamLai: 6.69 },
      { sbd: '12024', hoTen: 'B', tongSheet: 4.64, tongChamLai: 4.64 },
      { sbd: '12049', hoTen: 'C', tongSheet: 7.88, tongChamLai: 7.88 },
    ]
    expect(emLechDiem(khop)).toEqual([])
  })

  it('sai số dấu phẩy động KHÔNG phải lệch', () => {
    expect(emLechDiem([{ sbd: '1', hoTen: 'A', tongSheet: 6.69, tongChamLai: 6.69 + 1e-9 }])).toEqual([])
  })

  it('lượt CHƯA từng chấm (ô điểm rỗng) là ghi lần đầu, không phải sửa số cũ', () => {
    expect(emLechDiem([{ sbd: '1', hoTen: 'A', tongSheet: null, tongChamLai: 7.5 }])).toEqual([])
  })

  it('chưa chấm lại được thì không kết luận gì', () => {
    expect(emLechDiem([{ sbd: '1', hoTen: 'A', tongSheet: 6.69, tongChamLai: null }])).toEqual([])
  })

  it('giữ nguyên cả hai con số để thầy đối chiếu, không làm tròn thêm', () => {
    const r = emLechDiem([NAM_LUOT_THAT[0]])
    expect(r[0]).toEqual({ sbd: '12121212', hoTen: 'Thi thử', cu: 0.4, moi: 2.39 })
  })
})

describe('câu báo cho thầy', () => {
  it('in tên em kèm điểm cũ và điểm mới, dấu phẩy thập phân', () => {
    expect(dongLechDiem({ sbd: '12121212', hoTen: 'Thi thử', cu: 0.4, moi: 2.39 })).toBe('Thi thử: 0,40 → 2,39')
  })

  it('không có tên thì gọi bằng SBD, không để trống', () => {
    expect(dongLechDiem({ sbd: '12026', hoTen: '', cu: 1, moi: 2 })).toBe('12026: 1,00 → 2,00')
  })

  it('nhiều em thì kể ba em rồi đếm phần còn lại — không đổ cả danh sách vào toast', () => {
    const s = loiBaoLechDiem(emLechDiem(NAM_LUOT_THAT))
    expect(s).toContain('Đã đồng bộ điểm 5 em lên Sheet')
    expect(s).toContain('và 2 em nữa')
  })

  it('không lệch thì KHÔNG có câu báo — cấm toast rỗng', () => {
    expect(loiBaoLechDiem([])).toBe('')
  })
})
