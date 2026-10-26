// @vitest-environment jsdom
// KHE chạm-giải-thích (chia làn với Code app 3): ruột gọi onHoTro ⇒ lượt nộp câu đó gửi assisted: true (như Gợi ý / Hỏi thầy);
// nút bật (NutBatDauCham) nằm ở hàng nút đáy màn Duo, cạnh «Gợi ý».
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/goi-y-cham/VungChamDe', async (goc) => {
  const that = await goc<typeof import('../src/components/goi-y-cham/VungChamDe')>()
  return {
    ...that,
    VungChamDe: ({ children, onHoTro }: { children: React.ReactNode; onHoTro?: () => void }) => <>{children}<button type="button" onClick={onHoTro}>Xem giải thích chạm</button></>,
    NutBatDauCham: () => <button type="button" className="nut-cham">Chạm để hiểu</button>,
  }
})
beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); localStorage.clear(); delete document.documentElement.dataset.trong })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const C1 = { ...nen, qid: 'q1', phan: 'I' as const, text: 'Số đồng phân amine bậc một là', choices: ['2', '8', '3', '4'] }
const C2 = { ...nen, qid: 'q2', phan: 'I' as const, text: 'Chất nào là amine bậc hai?', choices: ['A1', 'B2', 'C3', 'D4'] }
const mo = () => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [C1, C2] })
  return render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
}
const nop = async (chon: RegExp) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ correct: true, answer: 'D', solution: {} })
  fireEvent.click(screen.getByRole('radio', { name: chon }))
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  await screen.findByRole('heading', { name: 'Chính xác!' })
  return vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'answer').at(-1)![2] as { assisted: boolean }
}

describe('khe chạm-giải-thích: onHoTro + nút bật', () => {
  it('gọi onHoTro ⇒ lượt nộp assisted: true; câu sau không dùng ⇒ assisted: false', async () => {
    const { container } = mo()
    await screen.findByText(C1.text)
    expect(container.querySelector('.duo-day .duo-bo .nut-cham')).not.toBeNull() // hàng nút đáy, cạnh Gợi ý
    fireEvent.click(screen.getByRole('button', { name: 'Xem giải thích chạm' }))
    expect((await nop(/^D/)).assisted).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
    await screen.findByText(C2.text)
    expect((await nop(/^D/)).assisted).toBe(false)
  })
})
