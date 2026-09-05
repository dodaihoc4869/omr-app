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
    expect(screen.getByText('Mở ca kiểm tra')).toBeTruthy()
    expect(screen.getByText('Ngân hàng câu hỏi')).toBeTruthy()
    expect(screen.getByText('Ca thi')).toBeTruthy()
  })
})

describe('Tab Học sinh', () => {
  it('tab Học sinh ở thanh dưới vẫn còn — đường duy nhất vào hồ sơ từng em', () => {
    render(<BottomNav />)
    screen.getByText('Học sinh').click()
    expect(useAppStore.getState().screen).toBe('hocsinh')
  })

  // Dòng chỉ đường đổi khi thầy chốt hai nút mỗi em (05/09): không còn "chạm
  // một em" chung chung, mà nói thẳng hai nút đó mở ra cái gì.
  it('có dòng chỉ đường nói rõ hai nút của mỗi em mở ra cái gì', () => {
    expect(maHocSinh).toContain('Mỗi em có hai nút')
    expect(maHocSinh).toContain('chuyên đề mạnh–yếu')
    expect(maHocSinh).toContain('điểm và hạng lớp')
  })

  // Thầy cho gỡ mục giao bài tập. Code GIỮ NGUYÊN để gắn lại được, nhưng màn
  // Học sinh không được còn đường nào dẫn tới nó.
  it('KHÔNG còn nút Giao bài tập trong hồ sơ em', () => {
    expect(maHocSinh).not.toContain('GiaoBaiTap')
    expect(maHocSinh).not.toContain('KhoiBaiTap')
  })
})
