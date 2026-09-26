// @vitest-environment jsdom
// MÀN THẦY "GIAO ĐỀ THEO TUẦN" — dựng được (không ném lỗi khi chưa có máy chủ).
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import GiaoDeTheoTuanScreen from '../src/screens/GiaoDeTheoTuanScreen'

it('dựng màn: hiện tiêu đề + lời nhắc luật, không ném lỗi', async () => {
  render(<GiaoDeTheoTuanScreen />)
  expect(await screen.findByText('Giao đề theo tuần')).toBeTruthy()
  expect(screen.getByText(/CHỈ làm câu trong đề đã tick/)).toBeTruthy()
})
