// TÌM THẤY ĐƯỜNG GIAO BÀI TẬP.
//
// Thầy chụp màn chính và nói "tôi không thấy mục giao bài tập về nhà". Tính năng
// có thật, nhưng nút nằm trong hồ sơ TỪNG EM — phải vào tab Học sinh, chạm một
// em mới thấy. Làm ra rồi mà không ai tìm được thì coi như chưa có.
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import ExamHubScreen from '../src/screens/ExamHubScreen'
import { useAppStore } from '../src/store/appStore'
import maHocSinh from '../src/screens/HocSinhScreen.tsx?raw'

beforeEach(() => useAppStore.getState().setScreen('examhub'))

describe('Màn chính của thầy', () => {
  it('có thẻ "Giao bài tập về nhà"', () => {
    render(<ExamHubScreen />)
    expect(screen.getByText('Giao bài tập về nhà')).toBeTruthy()
  })

  it('bấm vào là sang danh sách học sinh — nơi có nút giao bài', () => {
    render(<ExamHubScreen />)
    screen.getByText('Giao bài tập về nhà').click()
    expect(useAppStore.getState().screen).toBe('hocsinh')
  })

  it('phụ đề nói rõ phải chọn em trước, không để thầy đoán', () => {
    render(<ExamHubScreen />)
    expect(screen.getByText(/Chọn em/)).toBeTruthy()
  })
})

describe('Danh sách học sinh', () => {
  it('có dòng chỉ đường: chạm một em để giao bài tập', () => {
    expect(maHocSinh).toContain('Chạm một em để xem hồ sơ, giao bài tập về nhà')
  })

  it('nút Giao bài tập vẫn nằm trong hồ sơ em — chỗ duy nhất biết em yếu gì', () => {
    expect(maHocSinh).toContain('Giao bài tập')
    expect(maHocSinh).toContain('GiaoBaiTap')
  })
})
