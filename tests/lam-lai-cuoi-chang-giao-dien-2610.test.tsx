// @vitest-environment jsdom
// LÀM LẠI CUỐI CHẶNG + KẾT CHẶNG KIỂU DUOLINGO (thầy 26/10; docs/de-xuat-phan-cau-kieu-duolingo-2610.md A3 + B1) — màn làm bài của em:
// sai câu trong chặng ⇒ nút cuối "Làm lại câu sai" ⇒ câu cùng dạng (chip "Làm lại · cùng dạng câu N", tiêu đề "Làm lại · Câu 1/1")
// ⇒ dải kết quả "Làm lại đúng" ⇒ kết chặng: số "x/2" chỉ tính câu của chặng, ô "Làm lại đúng 1/1", "Đúng liên tiếp dài nhất", "Câu mới đã gặp". Không sai câu nào ⇒ không xin làm lại.
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import type { TomTatGoi7 } from '../src/lib/goi-bai-7'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...(await goc<typeof import('../src/components/hoa2/api')>()), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const nen = { maDe: 'DH-12-B1', version: 'v1', hinhAnh: [], dang: 'D0', tenDang: 'Amine', mucDo: 'NB', sao: 0, kienThuc: [], ideas: [] }
const c1 = { ...nen, qid: 'q1', group: 'g1', phan: 'I' as const, text: 'Câu một: chất nào là amine bậc hai?', choices: ['CH3NH2', '(CH3)2NH', '(CH3)3N', 'C6H5NH2'], vaiGoi7: 'moi' }
const c2 = { ...nen, qid: 'q2', group: 'g2', phan: 'I' as const, text: 'Câu hai: chất nào là muối?', choices: ['NaCl', 'HCl', 'NaOH', 'H2O'], vaiGoi7: 'on' }
const ll = { ...nen, qid: 'q9', group: 'g9', phan: 'I' as const, text: 'Câu làm lại: amine nào bậc hai?', choices: ['C2H5NH2', '(C2H5)2NH', '(C2H5)3N', 'CH3NH2'], vaiGoi7: 'lam_lai', lamLaiCua: 'q1' }
const goi: TomTatGoi7 = { bat: true, ngay: '2026-10-26', toiThieu: 24, daLamHomNay: 0, tuLamCon: 18, tiepCanCon: 6, thieuPhu: 0, thieuNgay: 0, canHoTro: false, kienThucCu: { tong: 10, dat: 7, tyLe: 70 }, goi: [{ id: 'g1', ten: 'Bài Amine', batDau: '2026-10-26', han: '2026-11-01', tong: 50, daGap: 0, con: 50, quota: 8, gapHomNay: 0, quaHan: false, canBoSung: 0, to: ['DH-12-B1'] }], diemDaDo: [] }

function giaLap(dungQ1: boolean, coLamLai = true) {
  vi.mocked(goiHoa2).mockImplementation(async (hanh: string, _t: string, b: Record<string, unknown> = {}) => {
    if (hanh === 'hoc-tap-start') return { ok: true, id: 'p1', questions: [c1, c2], goi7: goi } as never
    if (hanh === 'hoc-tap-dem') return { ok: true, daLamHomNay: 1, toiThieu: 24 } as never
    if (hanh === 'hoc-tap-lam-lai') return { ok: true, questions: coLamLai ? [ll] : [] } as never
    if (hanh === 'answer') {
      const qid = String(b.qid)
      const correct = qid === 'q1' ? dungQ1 : true
      return { ok: true, correct, answer: 'B', attempt: { assisted: qid === 'q9' } } as never
    }
    return { ok: true } as never
  })
}
async function tra(text: string, chon: number) {
  await screen.findByText(text)
  const tu = screen.queryByRole('button', { name: 'Tự làm câu này' })
  if (tu) fireEvent.click(tu)
  fireEvent.click(screen.getAllByRole('radio')[chon]!)
  fireEvent.click(screen.getByRole('button', { name: /^Nộp câu/ }))
}
const homNay = { daLam: 0, muc: 24, chang: 1, soChang: 4 }

it('sai câu 1 ⇒ "Làm lại câu sai" ⇒ câu cùng dạng ⇒ đúng ⇒ kết chặng có ô Làm lại đúng 1/1, số chặng vẫn x/2', async () => {
  giaLap(false)
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={homNay} />)
  await tra(c1.text, 0)
  fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
  await tra(c2.text, 0)
  fireEvent.click(await screen.findByRole('button', { name: /Làm lại câu sai/ }))
  await screen.findByText(ll.text)
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Làm lại · Câu 1/1')
  expect(screen.getByText('Làm lại · cùng dạng câu 1')).toBeTruthy()
  expect(screen.getByText(/Lượt này tính là có hỗ trợ/)).toBeTruthy()
  expect(vi.mocked(goiHoa2).mock.calls.find(c => c[0] === 'hoc-tap-lam-lai')![2]).toEqual({ session: 'p1' })
  await tra(ll.text, 1)
  await screen.findByText('Làm lại đúng', { selector: 'b' })
  expect(screen.queryByRole('button', { name: 'Sửa câu này' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: /Kết thúc chặng/ }))
  await screen.findByText('Làm lại đúng', { selector: 'dt' })
  expect(screen.getByText('1/1 câu')).toBeTruthy()
  expect(document.querySelector('.ht2-lam-xong-so')!.textContent).toBe('1/2 câu tự làm đúng')
  expect(screen.getByText('Đúng liên tiếp dài nhất').nextElementSibling!.textContent).toBe('1 câu')
  expect(screen.getByText('Câu mới đã gặp').nextElementSibling!.textContent).toBe('1 câu')
})

it('không sai câu nào ⇒ không xin làm lại, nút cuối "Kết thúc chặng", không có ô Làm lại', async () => {
  giaLap(true)
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={homNay} />)
  await tra(c1.text, 1)
  fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
  await tra(c2.text, 0)
  fireEvent.click(await screen.findByRole('button', { name: /Kết thúc chặng/ }))
  await screen.findByText('Đúng liên tiếp dài nhất')
  expect(screen.queryByText('Làm lại đúng')).toBeNull()
  expect(vi.mocked(goiHoa2).mock.calls.some(c => c[0] === 'hoc-tap-lam-lai')).toBe(false)
})

it('máy chủ không có câu cùng dạng ⇒ vào thẳng kết chặng (không kẹt)', async () => {
  giaLap(false, false)
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={homNay} />)
  await tra(c1.text, 0)
  fireEvent.click(await screen.findByRole('button', { name: /Câu tiếp theo/ }))
  await tra(c2.text, 0)
  fireEvent.click(await screen.findByRole('button', { name: /Làm lại câu sai/ }))
  await waitFor(() => expect(screen.getByText('Đúng liên tiếp dài nhất')).toBeTruthy())
  expect(screen.queryByText('Làm lại đúng')).toBeNull()
})
