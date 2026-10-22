import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
// Em SBD 12086 (22/10, "27/28 câu… làm xong nộp nó ghi chưa nộp"): Phần II chọn thiếu ý lưu thành "D-SD". Màn làm bài cũ coi mọi chuỗi KHÁC RỖNG là
// "đã trả lời" (dấu trên thanh câu, "Đã trả lời x/y", danh sách câu trống khi nộp chặng) còn máy chủ chỉ đếm Phần II đủ 4 ý ⇒ em thấy đủ 28/28
// mà thẻ bài hiện 27/28 và chặng đã chốt không sửa lại được. Nay màn dùng đúng luật đếm của máy chủ.
vi.mock('../src/lib/tu-sua-loi', () => ({ useSoCauCanSua: () => 5 }))
const api = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', async (importOriginal) => ({ ...await importOriginal(), goiHoa2: api }))
const now = Date.parse('2026-10-22T03:00:00Z')
const kt: TomTatKiemTra = { id: 'kt-S1', ngay: '2026-10-22', moLuc: Date.parse('2026-10-21T17:00:00Z'), hanLuc: Date.parse('2026-10-22T17:00:00Z'), serverNow: now, trangThai: 'can_lam', homNay: true, tong: 2, daTra: 1, con: 1, soChang: 1, phut: 5, soBai: 1, tongKienThuc: 2, phuDe: 2, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
const noop = () => {}
const cauBase = { maDe: 'd', version: 'v1', group: 'g1', hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] }
const cau = [
  { ...cauBase, qid: 'q1', phan: 'I', text: 'Câu một', choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [] },
  { ...cauBase, qid: 'q2', phan: 'II', text: 'Câu hai', choices: [], ideas: ['ý a', 'ý b', 'ý c', 'ý d'] },
]
afterEach(() => { cleanup(); api.mockReset(); localStorage.clear() })

async function moChang(traCau2: string) {
  api.mockImplementation(async (action: string) => {
    if (action === 'hoc-tap-ktcn-trang-thai') return { ok: true, kiemTra: kt, chang: [{ stt: 0, soCau: 2, giay: 300, han: null, daChot: false }] }
    if (action === 'hoc-tap-ktcn-start') return { ok: true, kiemTra: kt, revision: 0, hanChang: now + 300000, daChot: false, questions: cau, tra: { q1: 'B', q2: traCau2 } }
    return { ok: true, kiemTra: kt, revision: 1, daLuu: true, daChot: true, chang: [] }
  })
  render(<div className="m3"><ManKiemTra token="token" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop} /></div>)
  fireEvent.click(await screen.findByRole('button', { name: /Làm chặng 1/ }))
  await screen.findByText('Câu một')
}

it('Phần II thiếu ý không được đánh dấu "đã trả lời" và nộp chặng báo đúng câu đó', async () => {
  await moChang('D-SD')
  expect(screen.getAllByRole('button', { name: 'Câu 1 · đã trả lời' }).length).toBeGreaterThan(0)
  expect(screen.queryAllByRole('button', { name: 'Câu 2 · đã trả lời' })).toHaveLength(0)
  expect(screen.getAllByText('Đã trả lời 1/2').length).toBeGreaterThan(0)
  fireEvent.click(screen.getAllByRole('button', { name: 'Câu 2' })[0]!)
  fireEvent.click(await screen.findByRole('button', { name: 'Nộp chặng 1' }))
  const hop = await screen.findByRole('alertdialog', { name: 'Nộp chặng 1?' })
  expect(hop.textContent).toContain('còn 1 câu chưa trả lời (câu 2)')
  fireEvent.click(screen.getByRole('button', { name: 'Làm tiếp' }))
  await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  expect(api.mock.calls.some((c) => c[0] === 'hoc-tap-ktcn-chot-chang')).toBe(false)
})

it('Phần II đủ 4 ý thì đếm đủ và nộp chặng không hỏi lại', async () => {
  await moChang('DSSD')
  expect(screen.getAllByRole('button', { name: 'Câu 2 · đã trả lời' }).length).toBeGreaterThan(0)
  expect(screen.getAllByText('Đã trả lời 2/2').length).toBeGreaterThan(0)
  fireEvent.click(screen.getAllByRole('button', { name: 'Câu 2 · đã trả lời' })[0]!)
  fireEvent.click(await screen.findByRole('button', { name: 'Nộp chặng 1' }))
  await waitFor(() => expect(api.mock.calls.some((c) => c[0] === 'hoc-tap-ktcn-chot-chang')).toBe(true))
  expect(screen.queryByRole('alertdialog')).toBeNull()
})
