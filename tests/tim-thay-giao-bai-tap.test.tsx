// TÌM THẤY ĐƯỜNG GIAO BÀI TẬP.
//
// Thầy chụp màn chính và nói "tôi không thấy mục giao bài tập về nhà". Tính năng
// có thật, nhưng nút nằm trong hồ sơ TỪNG EM — phải vào tab Học sinh, chạm một
// em mới thấy. Làm ra rồi mà không ai tìm được thì coi như chưa có.
//
// Sau đó thầy cho bỏ thẻ lối tắt ở màn Kiểm tra. Đường vào nay chỉ còn MỘT:
// tab HỌC SINH ở thanh dưới → chạm một em → nút Giao bài tập. Test này khoá
// đúng đường đó, và khoá luôn việc hai mục đã bỏ không lặng lẽ quay lại.
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ExamHubScreen from '../src/screens/ExamHubScreen'
import BottomNav from '../src/components/BottomNav'
import { useAppStore } from '../src/store/appStore'
import maHocSinh from '../src/screens/HocSinhScreen.tsx?raw'

beforeEach(() => useAppStore.getState().setScreen('examhub'))

describe('Màn chính của thầy', () => {
  it('KHÔNG còn thẻ "Giao bài tập về nhà" và "Quản lý đăng ký"', () => {
    render(<ExamHubScreen />)
    expect(screen.queryByText('Giao bài tập về nhà')).toBeNull()
    expect(screen.queryByText('Quản lý đăng ký')).toBeNull()
  })

  it('ba thẻ còn lại vẫn nguyên', () => {
    render(<ExamHubScreen />)
    expect(screen.getByText('Chọn đề & mở ca kiểm tra')).toBeTruthy()
    expect(screen.getByText('Ngân hàng câu hỏi')).toBeTruthy()
    expect(screen.getByText('Lịch sử ca thi & chấm bài')).toBeTruthy()
  })
})

describe('Đường vào giao bài tập sau khi bỏ thẻ lối tắt', () => {
  it('tab Học sinh ở thanh dưới vẫn còn — bỏ thẻ mà bỏ luôn tab là mất đường', () => {
    render(<BottomNav />)
    screen.getByText('Học sinh').click()
    expect(useAppStore.getState().screen).toBe('hocsinh')
  })

  it('có dòng chỉ đường: chạm một em để giao bài tập', () => {
    expect(maHocSinh).toContain('Chạm một em để xem hồ sơ, giao bài tập về nhà')
  })

  it('nút Giao bài tập vẫn nằm trong hồ sơ em — chỗ duy nhất biết em yếu gì', () => {
    expect(maHocSinh).toContain('Giao bài tập')
    expect(maHocSinh).toContain('GiaoBaiTap')
  })
})
