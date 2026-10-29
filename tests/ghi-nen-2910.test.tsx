// @vitest-environment jsdom
// GHI NỀN (thầy 29/10 «tải sẵn gì tải luôn, tức thì cả giờ cao điểm»; src/components/hoc-tap/ManLamBaiTap.tsx): kết quả đã hiện từ dòng TẠM mà bản đầy đủ (đã ghi) chưa về ⇒
// «Tiếp tục» sang câu kế NGAY (không phải câu cuối); lượt ghi chạy nền; câu kế chỉ GỬI sau khi lượt ghi trước xong (hồ sơ game ghi bằng CAS — không chồng lượt ghi);
// câu cuối vẫn chờ bản đầy đủ; bản đầy đủ lỗi sau khi đã sang câu khác ⇒ báo ở câu đang làm và bỏ kết quả tạm của câu cũ.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
vi.mock('../src/components/hoa2/doc-luong-nop', () => ({ nopCauLuong: (token: string, du: Record<string, unknown>, giay: number, tam: (o: Record<string, unknown>) => void) => goiHoa2('answer', token, du, giay, tam as never) }))
beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); vi.unstubAllGlobals(); localStorage.clear(); delete document.documentElement.dataset.trong })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const cau = (n: number) => ({ ...nen, qid: `q${n}`, phan: 'I' as const, text: `Câu ${n} về amine`, choices: ['2', '8', '3', '4'] })
type Giai = (v: Record<string, unknown>) => void
const nopTam = (k: Record<string, unknown>, dung = true) => k && ({ ok: true, tam: true, correct: dung, answer: 'D', solution: {} })

async function moChang(soCau: number) {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: Array.from({ length: soCau }, (_, i) => cau(i + 1)) })
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
  await screen.findByText('Câu 1 về amine')
}
/** Mỗi lệnh `answer` mới ⇒ một ô chờ; trả [{qid, tam, xong, loi}] theo thứ tự gọi. */
function chanAnswer() {
  const goi: { qid: string; tam: (o: Record<string, unknown>) => void; xong: Giai; loi: (e: Error) => void }[] = []
  vi.mocked(goiHoa2).mockImplementation((lenh, _t, du, _g, tam) => lenh === 'answer'
    ? new Promise((ok, loi) => { goi.push({ qid: String((du as Record<string, unknown>).qid), tam: tam as never, xong: ok as Giai, loi }) })
    : Promise.resolve({ ok: true }))
  return goi
}
const chonDapAnRoiKiem = () => { fireEvent.click(screen.getByRole('radio', { name: /^D/ })); fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' })) }

it('bấm «Tiếp tục» khi còn kết quả TẠM ⇒ sang câu kế ngay; câu kế chỉ gửi SAU khi lượt ghi câu trước xong', async () => {
  await moChang(3)
  const goi = chanAnswer()
  chonDapAnRoiKiem()
  await waitFor(() => expect(goi).toHaveLength(1))
  await act(async () => { goi[0]!.tam(nopTam({})) }) // dòng tạm câu 1
  await waitFor(() => expect(document.querySelector('.duo-ket')!.getAttribute('data-tt')).toBe('dung'))
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' })) // bản đầy đủ chưa về
  expect(await screen.findByText('Câu 2 về amine')).toBeTruthy() // sang câu kế NGAY
  // Câu 2: em nộp khi lượt ghi câu 1 còn chạy ⇒ CHƯA gửi (không chồng lượt ghi)
  chonDapAnRoiKiem()
  await new Promise((r) => setTimeout(r, 30))
  expect(goi).toHaveLength(1)
  // Lượt ghi câu 1 xong ⇒ câu 2 mới được gửi
  await act(async () => { goi[0]!.xong({ ok: true, correct: true, answer: 'D', solution: {}, attempt: { assisted: false } }) })
  await waitFor(() => expect(goi).toHaveLength(2))
  expect(goi[1]!.qid).toBe('q2')
})

it('câu CUỐI: «Tiếp tục» vẫn chờ bản đầy đủ (kết chặng đọc sổ đã ghi)', async () => {
  await moChang(2)
  const goi = chanAnswer()
  chonDapAnRoiKiem()
  await waitFor(() => expect(goi).toHaveLength(1))
  await act(async () => { goi[0]!.xong({ ok: true, correct: true, answer: 'D', solution: {}, attempt: { assisted: false } }) })
  fireEvent.click(await screen.findByRole('button', { name: 'Tiếp tục' }))
  await screen.findByText('Câu 2 về amine')
  chonDapAnRoiKiem()
  await waitFor(() => expect(goi).toHaveLength(2))
  await act(async () => { goi[1]!.tam(nopTam({})) })
  await waitFor(() => expect(document.querySelector('.duo-ket')!.getAttribute('data-tt')).toBe('dung'))
  const tiep = screen.getByRole('button', { name: 'Tiếp tục' })
  fireEvent.click(tiep)
  expect(tiep.hasAttribute('data-lun')).toBe(true) // đang chờ bản đầy đủ — chưa sang màn kết chặng
  expect(screen.queryByText(/Xong chặng|Hoàn thành/i)).toBeNull()
  await act(async () => { goi[1]!.xong({ ok: true, correct: true, answer: 'D', solution: {}, attempt: { assisted: false } }) })
  await waitFor(() => expect(tiep.isConnected && tiep.hasAttribute('data-lun') ? false : true).toBe(true))
})

it('bản đầy đủ LỖI sau khi đã sang câu khác ⇒ báo ở câu đang làm, bỏ kết quả tạm câu cũ, không khoá nút câu đang làm', async () => {
  await moChang(3)
  const goi = chanAnswer()
  chonDapAnRoiKiem()
  await waitFor(() => expect(goi).toHaveLength(1))
  await act(async () => { goi[0]!.tam(nopTam({})) })
  await waitFor(() => expect(document.querySelector('.duo-ket')!.getAttribute('data-tt')).toBe('dung'))
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))
  await screen.findByText('Câu 2 về amine')
  await act(async () => { goi[0]!.loi(new Error('Máy chủ từ chối')) })
  expect(await screen.findByText(/Câu 1 chưa được lưu/)).toBeTruthy()
  // câu đang làm (câu 2) vẫn nộp được bình thường
  chonDapAnRoiKiem()
  await waitFor(() => expect(goi).toHaveLength(2))
  expect(goi[1]!.qid).toBe('q2')
})
