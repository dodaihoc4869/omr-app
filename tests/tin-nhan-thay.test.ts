// TIN NHẮN THẦY SOẠN SẴN — báo phụ huynh việc em rời màn hình (gửi vào hộp thư TRONG APP) và tin báo bài tập mới cho em.
// Chuyển từ tests/phieu-zalo.test.ts khi thầy lệnh "Bỏ phiếu Zalo" (21/09): phần phiếu Zalo gửi phụ huynh đã gỡ cùng hàm `soanPhieuZalo`; hai khối dưới GIỮ NGUYÊN (chữ không đổi).
import { describe, expect, it } from 'vitest'
import { soanTinRoiMan, tinBaoBaiTap } from '../src/lib/tin-nhan-thay'

const demChu = (s: string) => s.trim().split(/\s+/).filter(Boolean).length // đếm chữ (trước ở lib/phieu-zalo, đã gỡ cùng phiếu Zalo)

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
