import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const doc = (ten: string) => readFileSync(resolve(process.cwd(), ten), 'utf8')

describe('app giáo viên · hộp cuộn thống nhất', () => {
  for (const [tep, moc] of [
    ['src/screens/HocSinhScreen.tsx', 'Danh sách học sinh'],
    ['src/screens/LichSuCaScreen.tsx', 'Danh sách ca kiểm tra'],
    ['src/screens/CauHoiScreen.tsx', 'Danh sách ca có câu hỏi'],
    ['src/screens/DuyetLoiGiaiScreen.tsx', 'Danh sách câu chờ duyệt'],
    ['src/screens/BanGoNutThatScreen.tsx', 'Thẻ nút thắt theo thứ tự ưu tiên'],
    ['src/screens/GiaoDeTheoTuanScreen.tsx', 'gv-scroll-box gv-scroll-box--compact'],
    ['src/screens/PhanCongScreen.tsx', 'gv-scroll-box gv-scroll-box--compact'],
    ['src/screens/GoiLenBangScreen.tsx', 'gv-scroll-box gv-scroll-box--compact'],
  ] as const) {
    it(`${tep} có vùng cuộn gọn và nhận diện được`, () => {
      const nguon = doc(tep)
      expect(nguon).toContain('gv-scroll-box')
      expect(nguon).toContain(moc)
    })
  }

  for (const tep of [
    'src/components/chien-dich/BangChienDich.tsx',
    'src/components/chien-dich/BuoiChua.tsx',
    'src/components/chien-dich/DsChienDichDaGiao.tsx',
  ]) {
    it(`${tep} giới hạn bảng dài trong box cuộn`, () => {
      expect(doc(tep)).toContain('cd-cuon-doc')
    })
  }

  it('không đưa lại các câu hướng dẫn dài đã lược bỏ', () => {
    const nguon = [
      'src/screens/ExamSetupScreen.tsx',
      'src/screens/GoiLenBangScreen.tsx',
      'src/screens/HocSinhScreen.tsx',
      'src/screens/NganHangDeScreen.tsx',
    ].map(doc).join('\n')
    for (const chu of [
      'Bốn việc, đi từ trên xuống',
      'Thuật toán Rút câu BTVN lên bảng',
      'Quản lý học sinh theo lớp, xem báo cáo',
      'Kho đề kiểm tra, thẩm định đáp án',
    ]) expect(nguon).not.toContain(chu)
  })
})
