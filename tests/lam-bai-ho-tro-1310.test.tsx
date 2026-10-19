// @vitest-environment jsdom
// Hỏi Thầy khi đang làm là có hỗ trợ; kết quả nhận lại từ máy chủ quyết định lượt đã chấm.
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/loi-giai/NutHoiThay', () => ({ default: ({ dangLam, onHoi }: { dangLam?: boolean; onHoi?: () => void }) => dangLam ? <button type="button" onClick={onHoi}>Hỏi thầy</button> : null }))
const q = { qid: 'q1', maDe: 'd', version: 'v1', group: 'g1', phan: 'I' as const, text: 'Chất nào là muối?', choices: ['NaCl', 'HCl', 'NaOH', 'H2O'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] }
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })
async function mo() {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [q] })
  render(<ManLamBaiTap token="t" sbd="s" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
  await screen.findByText(q.text)
  fireEvent.click(screen.getByRole('radio', { name: /NaCl/ }))
}
it('câu đã Hỏi Thầy hiện đúng có hỗ trợ và không cộng vào câu tự làm đúng', async () => {
  await mo()
  fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: true, answer: 'A', attempt: { assisted: true } })
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn A' }))
  await screen.findByText('Đúng · có hỗ trợ')
  expect(screen.queryByText('Đúng · tự làm')).toBeNull()
  await waitFor(() => expect(goiHoa2).toHaveBeenLastCalledWith('answer', 't', expect.objectContaining({ assisted: true }), 15))
  fireEvent.click(screen.getByRole('button', { name: /Kết thúc chặng/ }))
  expect(screen.getByText(/câu tự làm đúng/).textContent).toBe('0/1 câu tự làm đúng')
  expect(screen.getByRole('img', { name: 'Câu 1 có hỗ trợ' })).toBeTruthy()
})
it('mở lại máy khác vẫn theo lượt có hỗ trợ đã chấm, dù lần này không bấm Hỏi Thầy', async () => {
  await mo()
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, replayed: true, correct: true, answer: 'A', traLoi: 'A', attempt: { assisted: true } })
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn A' }))
  await screen.findByText('Đúng · có hỗ trợ')
})
it('lượt đầu tự làm đúng được giữ nguyên khi lần nộp lại có Hỏi Thầy', async () => {
  await mo()
  fireEvent.click(screen.getByRole('button', { name: 'Hỏi thầy' }))
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, replayed: true, correct: true, answer: 'A', traLoi: 'A', attempt: { assisted: false } })
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn A' }))
  await screen.findByText('Đúng · tự làm')
  expect(screen.queryByText('Đúng · có hỗ trợ')).toBeNull()
})
