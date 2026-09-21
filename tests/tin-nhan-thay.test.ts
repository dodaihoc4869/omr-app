// TIN NHẮN THẦY SOẠN SẴN — báo phụ huynh việc em rời màn hình (gửi vào hộp thư TRONG APP). (Tin báo bài tập `tinBaoBaiTap` đã xoá 21/09: chỉ GiaoBaiTap — mã chết — dùng.)
// Chuyển từ tests/phieu-zalo.test.ts khi thầy lệnh "Bỏ phiếu Zalo" (21/09): phần phiếu Zalo gửi phụ huynh đã gỡ cùng hàm `soanPhieuZalo`; hai khối dưới GIỮ NGUYÊN (chữ không đổi).
import { describe, expect, it } from 'vitest'
import { soanTinRoiMan } from '../src/lib/tin-nhan-thay'

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
