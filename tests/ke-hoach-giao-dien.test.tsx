import { afterEach, expect, it, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import NhanHanBaiTap from '../src/components/NhanHanBaiTap'
afterEach(() => { cleanup(); vi.useRealTimers() })
it('nhãn bài đã nộp không cảnh báo quá hạn và luôn ghi giờ Việt Nam', () => {
  render(<NhanHanBaiTap han="2026-09-17T13:00:00Z" now={Date.parse('2026-09-18T00:00:00Z')} daNop />)
  expect(screen.getByText(/Đã nộp:/).textContent).toContain('20:00')
  expect(screen.queryByText(/Quá hạn/)).toBeNull()
})
