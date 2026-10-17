import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
vi.mock('../src/components/chua-cau-sai/NutChuaTungBuoc', () => ({ default: ({ qid }: { qid: string }) => <output aria-label="Mã câu chữa">{qid}</output> }))
import NutHoiThay from '../src/components/loi-giai/NutHoiThay'
afterEach(() => { cleanup(); localStorage.clear() })

it('bản Tu luyện ~2: nút chữa vẫn nhận mã câu gốc, nút hỏi giữ mã lượt đầy đủ', async () => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'thu' }))
  render(<NutHoiThay qid="12-HOI-III-3~2" nguon="tu_luyen" luotId="tl_abcdef18" />)
  expect((await screen.findByLabelText('Mã câu chữa')).textContent).toBe('12-HOI-III-3')
})
