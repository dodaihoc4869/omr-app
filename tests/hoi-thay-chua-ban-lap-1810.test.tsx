import { afterEach, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import NutHoiThay from '../src/components/loi-giai/NutHoiThay'
afterEach(() => { cleanup(); localStorage.clear() })

// Thầy 26/10: «Bỏ câu sai từng bước» ⇒ dưới lời giải KHÔNG còn nút «Chữa câu sai từng bước» (kể cả bản Tu luyện ~2).
it('không còn nút Chữa câu sai từng bước dưới lời giải', async () => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'thu' }))
  render(<NutHoiThay qid="12-HOI-III-3~2" nguon="tu_luyen" luotId="tl_abcdef18" />)
  await new Promise((r) => setTimeout(r, 30))
  expect(screen.queryByLabelText('Mã câu chữa')).toBeNull()
  expect(screen.queryByText('Chữa câu sai từng bước')).toBeNull()
})
