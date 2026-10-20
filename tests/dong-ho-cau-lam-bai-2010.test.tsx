// @vitest-environment jsdom
// 20/10 ĐO GIÂY — màn Làm bài tập (game): máy em gửi `doGiay: {g}` (giây câu đang hiện, chỉ cộng khi tab hiện + em còn chạm) cùng lượt nộp;
// chưa đủ 1 giây thì KHÔNG gửi (không gửi số 0). Số từ/hình/phần do máy chủ tự đo, máy em không gửi.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...(await goc<typeof import('../src/components/hoa2/api')>()), goiHoa2: vi.fn() }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [] }
const TN = { ...nen, qid: 'tn1', phan: 'I' as const, text: 'Chất nào sau đây là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], ideas: [] }

async function lamVaNop(doiMs: number) {
  vi.mocked(goiHoa2).mockImplementation(async (hanh: string) => (hanh === 'answer' ? { ok: true, correct: true, answer: 'B' } : { ok: true, id: 'p1', questions: [TN] }) as never)
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={{ daLam: 0, muc: 12, chang: 1, soChang: 3 }} />)
  await screen.findByText(TN.text)
  fireEvent.pointerDown(window)
  if (doiMs) await new Promise((r) => setTimeout(r, doiMs))
  fireEvent.pointerDown(window)
  fireEvent.click(screen.getAllByRole('radio')[1]!)
  fireEvent.click(screen.getByRole('button', { name: /^Nộp|^Kiểm tra|Nộp/ }))
  await waitFor(() => expect(vi.mocked(goiHoa2).mock.calls.some((c) => c[0] === 'answer')).toBe(true))
  return vi.mocked(goiHoa2).mock.calls.find((c) => c[0] === 'answer')![2] as Record<string, unknown>
}

describe('Làm bài tập: đồng hồ đo giây', () => {
  it('đợi ~2 giây có chạm ⇒ doGiay.g từ 1 tới 3, chỉ có khoá g', async () => {
    const body = await lamVaNop(2300)
    const dg = body.doGiay as { g: number }
    expect(dg.g).toBeGreaterThanOrEqual(1)
    expect(dg.g).toBeLessThanOrEqual(3)
    expect(Object.keys(dg)).toEqual(['g'])
    expect(typeof body.msLam).toBe('number') // `msLam` cũ vẫn gửi cho OMNI
  }, 15000)
  it('nộp ngay (chưa đủ 1 giây) ⇒ KHÔNG gửi doGiay (không bịa số 0)', async () => {
    const body = await lamVaNop(0)
    expect(body.doGiay).toBeUndefined()
  })
})
