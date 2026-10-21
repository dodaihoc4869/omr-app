// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async goc => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.resetAllMocks(); localStorage.clear() })

it('Học tiếp lỗi tải không phát lại câu của chặng đã nộp, cho thử lại chặng mới', async () => {
  const q = { qid: 'cau-gia', maDe: 'de-gia', version: '1', group: 'g', phan: 'I', text: 'Câu của chặng đã hoàn thành', choices: ['A', 'B', 'C', 'D'], ideas: [], hinhAnh: [] }
  vi.mocked(goiHoa2).mockImplementation(async lenh => {
    if (lenh === 'answer') return { ok: true, correct: true, answer: 'A', solution: '' }
    return { ok: true, id: 'phien-gia', questions: [q] }
  })
  render(<ManLamBaiTap token="token-gia" sbd="gia" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
  await screen.findByText(q.text)
  fireEvent.click(screen.getAllByRole('radio')[0]!)
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn A' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Kết thúc chặng' }))
  vi.mocked(goiHoa2).mockRejectedValueOnce(new Error('Máy chủ phản hồi chậm'))
  fireEvent.click(screen.getByRole('button', { name: /Học tiếp chặng sau/ }))
  await screen.findByRole('alert')
  expect(screen.queryByText(q.text)).toBeNull()
  expect(screen.getByRole('button', { name: 'Thử lại' })).toBeTruthy()
})
