// PHIẾU KẾT QUẢ GỬI PHỤ HUYNH — phải tuân đúng bộ quy tắc viết của thầy:
// không lời chào, không lời chúc, không khen suông, không thổi phồng, không
// emoji, không gạch ngang dài; số liệu lấy nguyên từ bài đã chấm.
import { describe, expect, it } from 'vitest'
import { demChu, soanPhieuZalo, soanTinRoiMan, tinBaoBaiTap, type DuLieuPhieu } from '../src/lib/phieu-zalo'

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

describe('soanTinRoiMan — báo phụ huynh việc rời màn', () => {
  const d = { hoTen: 'Lê Minh Đức', maCa: '984033', tenCa: 'Ca 12A1', ngay: '2026-09-03T07:00:00Z', soLan: 3, tongGiay: 47, daKhoa: true }

  it('nêu đúng số lần và số giây máy đo được', () => {
    const s = soanTinRoiMan(d)
    expect(s).toContain('3 lần')
    expect(s).toContain('47 giây')
  })

  it('KHÔNG kết luận gian lận — máy chỉ đo được tín hiệu, cuộc gọi cũng cho tín hiệu đó', () => {
    for (const bienThe of [d, { ...d, daKhoa: false }]) {
      const s = soanTinRoiMan(bienThe).toLowerCase()
      expect(s).not.toContain('gian lận')
      expect(s).not.toContain('quay cóp')
      expect(s).not.toContain('vi phạm')
      expect(s).not.toContain('cháu nhà')
    }
  })

  it('nói rõ bài bị khoá hay vẫn tính, và nêu bước tiếp theo của Thầy', () => {
    expect(soanTinRoiMan(d)).toContain('khoá bài')
    expect(soanTinRoiMan({ ...d, daKhoa: false })).toContain('vẫn tính bình thường')
    expect(soanTinRoiMan(d)).toContain('hỏi em')
    expect(soanTinRoiMan(d)).toContain('Không làm phiền')
  })

  it('không lời chào, không lời chúc, độ dài vừa tin nhắn', () => {
    const s = soanTinRoiMan(d)
    for (const tu of TU_CAM) expect(s.toLowerCase()).not.toContain(tu.toLowerCase())
    expect(demChu(s)).toBeGreaterThanOrEqual(40)
    expect(demChu(s)).toBeLessThanOrEqual(120)
  })
})

// TIN BÁO BÀI TẬP — mắt xích thầy đã hụt: giao bài xong nhưng không gửi link
// thì em không biết có bài. Bài tập là MỘT CA, em vào bằng link ca đó rồi nhập
// số báo danh; ca đã đặt riêng cho một em nên số khác không vào được.
describe('tinBaoBaiTap', () => {
  const LINK = 'https://dodaihoc4869.github.io/omr-app/t/261509'

  it('luôn kèm LINK VÀO LÀM BÀI — không có link thì em không thấy bài', () => {
    expect(tinBaoBaiTap('Trần Minh Anh', 10, '2026-09-10T16:59:00Z', LINK)).toContain(LINK)
  })

  it('nêu đúng số câu và hạn nộp, không bịa', () => {
    const t = tinBaoBaiTap('Trần Minh Anh', 10, '2026-09-10T16:59:00Z', LINK)
    expect(t).toContain('10 câu')
    expect(t).toContain('10/09')
  })

  it('không có hạn nộp thì không hứa hạn', () => {
    const t = tinBaoBaiTap('Trần Minh Anh', 8, '', LINK)
    expect(t).not.toContain('hạn nộp')
    expect(t).toContain('8 câu')
  })

  it('nhắc nhập số báo danh và nói rõ bạn khác không vào được', () => {
    expect(tinBaoBaiTap('An', 5, '', LINK, '123')).toContain('nhập số báo danh 123')
    expect(tinBaoBaiTap('An', 5, '', LINK, '123')).toContain('bạn khác không vào được')
    // Không có SBD thì vẫn phải nhắc nhập số báo danh, chỉ là không nêu số.
    expect(tinBaoBaiTap('An', 5, '', LINK)).toContain('nhập số báo danh của em')
  })

  it('không lời chào, không lời chúc', () => {
    const t = tinBaoBaiTap('An', 5, '2026-09-10T16:59:00Z', LINK)
    for (const tu of TU_CAM) expect(t.toLowerCase()).not.toContain(tu.toLowerCase())
  })
})
