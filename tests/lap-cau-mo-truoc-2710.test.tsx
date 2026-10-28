// @vitest-environment jsdom
// LẶP CÂU (27/10): lượt mở chặng trước (Hôm nay gọi sẵn khi em còn đang làm chặng) được lập TRƯỚC các câu em vừa nộp ⇒ có thể chứa đúng câu ấy. Nộp một câu
// ⇒ bỏ lượt mở trước cũ; hết chặng ⇒ mở trước lượt MỚI (lập sau câu cuối), không dùng lại lượt cũ.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { batMoChangTruoc, layChangMoTruoc, moChangTruoc } from '../src/components/hoc-tap/mo-chang-truoc'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
// «Kiểm tra» của màn Duo đi theo luồng (doc-luong-nop.ts) — ở test đi qua cùng `goiHoa2` giả như trước (không dòng tạm).
vi.mock('../src/components/hoa2/doc-luong-nop', async () => { const api = await import('../src/components/hoa2/api'); return { nopCauLuong: (token: string, du: Record<string, unknown>, giay: number) => api.goiHoa2('answer', token, du, giay) } })
beforeEach(() => { document.documentElement.dataset.trong = 'hs'; batMoChangTruoc(true) })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); batMoChangTruoc(false); localStorage.clear(); delete document.documentElement.dataset.trong })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const C1 = { ...nen, qid: 'q1', phan: 'I' as const, text: 'Câu một về amine', choices: ['2', '8', '3', '4'] }

it('nộp câu ⇒ bỏ lượt mở trước cũ; hết chặng ⇒ mở trước lượt mới', async () => {
  vi.mocked(goiHoa2).mockImplementation(async (lenh) => lenh === 'hoc-tap-start' ? { ok: true, id: 'p1', questions: [C1] } : lenh === 'answer' ? { correct: true, answer: 'D', solution: {} } : { ok: true })
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
  await screen.findByText(C1.text)
  const cu = vi.fn(async () => ({ ok: true, id: 'cu', questions: [C1] }))
  moChangTruoc('tk', cu) // Hôm nay (dưới màn làm bài) gọi sẵn giữa chặng — lập trước khi em nộp q1
  fireEvent.click(screen.getByRole('radio', { name: /^D/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  await screen.findByRole('button', { name: 'Tiếp tục' })
  expect(layChangMoTruoc('tk', cu)).toBeNull()
  const truoc = vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-start').length
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
  await screen.findByRole('heading', { name: /Xong chặng/ })
  expect(vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'hoc-tap-start').length).toBe(truoc + 1)
})
