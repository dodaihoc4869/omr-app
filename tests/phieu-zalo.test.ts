// PHIẾU KẾT QUẢ GỬI PHỤ HUYNH — phải tuân đúng bộ quy tắc viết của thầy:
// không lời chào, không lời chúc, không khen suông, không thổi phồng, không
// emoji, không gạch ngang dài; số liệu lấy nguyên từ bài đã chấm.
import { describe, expect, it } from 'vitest'
import { demChu, soanPhieuZalo, type DuLieuPhieu } from '../src/lib/phieu-zalo'

const mau: DuLieuPhieu = {
  hoTen: 'Lê Minh Đức',
  ngay: '2026-09-03T07:00:00Z',
  diem: 6.6,
  xepLoai: 'Khá',
  diemPhan: { I: 4, II: 1.6, III: 1 },
  soCauSai: 4,
  chuyenDeSai: { ten: 'pH và tính acid–base', soSai: 3 },
  baiTapDaGiao: { soCau: 10, hanNop: '2026-09-10T16:59:00Z' },
}

const TU_CAM = [
  'Kính gửi',
  'quý phụ huynh',
  'Trân trọng',
  'Chúc',
  'Hy vọng',
  'tiềm năng',
  'thông minh',
  'cố gắng hơn',
  'chăm chỉ hơn',
  'đồng hành',
  'quan trọng',
  'then chốt',
  'cốt lõi',
  'vô cùng',
  'cực kỳ',
  'hết sức',
  'chìa khóa',
  'hành trình',
  'nền tảng',
  'cho thấy',
  'thể hiện',
  'phản ánh',
  'đáng chú ý',
  'cần lưu ý',
  'trung tâm',
]

describe('soanPhieuZalo — nội dung', () => {
  it('nêu đúng điểm, xếp loại, số câu sai và chuyên đề — không làm tròn sai', () => {
    const s = soanPhieuZalo(mau)
    expect(s).toContain('6,60 điểm')
    expect(s).toContain('xếp loại Khá')
    expect(s).toContain('sai 4 câu')
    expect(s).toContain('3 câu thuộc pH và tính acid–base')
    expect(s).toContain('03/09')
  })

  it('có việc em phải làm kèm số lượng và hạn, có mốc thầy kiểm lại', () => {
    const s = soanPhieuZalo(mau)
    expect(s).toContain('10 câu bài tập')
    expect(s).toContain('hạn nộp 10/09')
    expect(s.toLowerCase()).toContain('thầy chấm')
  })

  it('xưng THẦY, gọi phụ huynh theo tên khi biết', () => {
    const s = soanPhieuZalo(mau, 'Chị Lan')
    expect(s.startsWith('Chị Lan,')).toBe(true)
    expect(s).toContain('Thầy')
    expect(s).not.toContain('tôi ')
    expect(s).not.toContain('mình ')
  })

  it('không lời chào, lời chúc, khen suông, thổi phồng, emoji, gạch ngang dài', () => {
    for (const bienThe of [mau, { ...mau, baiTapDaGiao: null }, { ...mau, soCauSai: 0, chuyenDeSai: null }]) {
      const s = soanPhieuZalo(bienThe as DuLieuPhieu)
      for (const tu of TU_CAM) expect(s.toLowerCase()).not.toContain(tu.toLowerCase())
      expect(s).not.toContain('—')
      expect(/\p{Extended_Pictographic}/u.test(s)).toBe(false)
    }
  })

  it('độ dài trong khoảng 40–120 chữ ở mọi biến thể', () => {
    for (const bienThe of [mau, { ...mau, baiTapDaGiao: null }, { ...mau, diemPhan: null }, { ...mau, soCauSai: 0, chuyenDeSai: null }]) {
      const n = demChu(soanPhieuZalo(bienThe as DuLieuPhieu))
      expect(n).toBeGreaterThanOrEqual(40)
      expect(n).toBeLessThanOrEqual(120)
    }
  })

  it('làm đúng hết thì KHÔNG bịa lỗi', () => {
    const s = soanPhieuZalo({ ...mau, soCauSai: 0, chuyenDeSai: null, baiTapDaGiao: null })
    expect(s).toContain('đúng toàn bộ')
    expect(s).not.toContain('sai')
  })

  it('chưa giao bài thì không hứa hạn nộp không có thật', () => {
    const s = soanPhieuZalo({ ...mau, baiTapDaGiao: null })
    expect(s).not.toContain('hạn nộp')
    expect(s).toContain('sẽ giao')
  })
})
