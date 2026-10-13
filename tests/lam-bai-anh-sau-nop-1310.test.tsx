// @vitest-environment jsdom
// Ảnh cấu tạo/đồ thị của phương án phải còn để em đối chiếu sau khi nộp.
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { ChonTracNghiem, PhanHoiTracNghiem } from '../src/components/hoc-tap/LamCau'
import type { Question } from '../src/game/than-thu-v2/core'
const q: Question = { qid: 'q1', maDe: 'd', version: 'v1', group: 'g', phan: 'I', text: 'Chọn công thức cấu tạo.', choices: ['(xem hình A)', 'Công thức B', 'Công thức C', 'Công thức D'], ideas: [], hinhAnh: [{ viTri: 'sau_pa_A', src: '/anh-A.png', alt: 'Cấu tạo A' }, { viTri: 'sau_pa_B', src: '/anh-B.png', alt: 'Cấu tạo B' }], dang: null, tenDang: '', mucDo: 'biet', sao: 0, kienThuc: [] }
afterEach(cleanup)
it('ảnh chỉ thay chữ giữ chỗ vẫn nằm trong phương án sau khi chấm, không lặp chữ xem hình', () => {
  const { rerender } = render(<ChonTracNghiem q={q} value="A" khoa={false} onChon={() => {}} />)
  expect(screen.getByRole('img', { name: 'Cấu tạo A' })).toBeTruthy()
  rerender(<PhanHoiTracNghiem q={q} tra="A" dapAn="B" />)
  expect(screen.getByRole('img', { name: 'Cấu tạo A' }).closest('.ht2-lam-pa')).toBeTruthy()
  expect(screen.queryByText('(xem hình A)')).toBeNull()
})
it('phương án có cả chữ và ảnh bổ sung không mất ảnh sau khi chấm', () => {
  render(<PhanHoiTracNghiem q={q} tra="A" dapAn="B" />)
  expect(screen.getByText('Công thức B')).toBeTruthy()
  expect(screen.getByRole('img', { name: /Cấu tạo B/ })).toBeTruthy()
})
