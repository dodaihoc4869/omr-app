// @vitest-environment jsdom
// KHẨN 12/10 23h — thầy (ảnh "Đúng 4/4 ý · sai ý", cả 4 ý "Em chọn … · đáp án …" trùng): "hs làm đúng cả 4 ý nhưng app lại báo sai".
// Nguyên nhân gốc: mỗi câu của một đợt chỉ chấm MỘT lần (khoá lượt|câu). Giờ cao điểm lần nộp đầu chậm / quá 40 giây ⇒ em đổi đáp án rồi nộp lại ⇒ máy
// chủ trả kết quả LẦN ĐẦU (`replayed: true`, `traLoi` = đáp án đã chấm) nhưng màn so từng ý bằng đáp án ĐANG chọn. Khoá:
//  · màn hiện đúng đáp án máy chủ đã chấm (`traLoi`), số ý đúng khớp kết quả, ghi "chấm theo đáp án em nộp lần trước";
//  · lượt thường (traLoi = đáp án đang chọn) y như cũ, không có dòng ghi chú;
//  · mở chặng rỗng ⇒ hiện lời máy chủ (vì sao rỗng) thay vì câu chung.
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.mocked(goiHoa2).mockReset(); localStorage.clear() })

const DS = { maDe: 'de-10', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Cấu hình electron', mucDo: 'hieu', sao: 0, kienThuc: [], qid: 'ds5', phan: 'II' as const, text: 'Xét nguyên tố X dùng làm vỏ lon.', choices: [], ideas: ['Có 3 phân lớp.', 'Lớp vỏ có 13 electron.', 'Hạt nhân có 13 neutron.', 'X là kim loại.'] }
const mo = (start: Record<string, unknown> = { ok: true, id: 'p1', questions: [DS] }) => {
  vi.mocked(goiHoa2).mockResolvedValueOnce(start)
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
}
const y = (chu: string) => within(screen.getByRole('group', { name: `Chọn cho ý ${chu}` }))
const chon = (ds: string) => { ['a', 'b', 'c', 'd'].forEach((c, i) => fireEvent.click(y(c).getByRole('button', { name: ds[i] === 'D' ? 'Đúng' : 'Sai' }))) }

it('nộp lại câu đã chấm (replayed): hiện ĐÚNG đáp án đã chấm, số ý đúng khớp kết quả, ghi rõ lần nộp trước', async () => {
  mo()
  await screen.findByText(DS.text)
  chon('SDSD') // em đang chọn đúng hết…
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: false, answer: 'SDSD', traLoi: 'DDSS', replayed: true, solution: '' }) // …nhưng lần nộp đầu là DDSS
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu' }))
  const ket = await screen.findByRole('status')
  expect(ket.textContent).toContain('Đúng 2/4 ý · sai ý a, d')
  expect(ket.textContent).toContain('chấm theo đáp án em nộp lần trước')
  expect(ket.textContent).not.toContain('Đúng 4/4 ý')
})

it('lượt thường: kết quả theo đáp án vừa nộp, không có ghi chú lần trước', async () => {
  mo()
  await screen.findByText(DS.text)
  chon('SDSS')
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, correct: false, answer: 'SDSD', traLoi: 'SDSS', solution: '' })
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu' }))
  const ket = await screen.findByRole('status')
  expect(ket.textContent).toContain('Đúng 3/4 ý · sai ý d')
  expect(ket.textContent).not.toContain('lần trước')
})

it('mở chặng rỗng ⇒ hiện lời máy chủ', async () => {
  mo({ ok: true, questions: [], message: 'Em đã hoàn thành phần được xếp hôm nay. Lỗi chưa kiểm chứng vẫn được giữ để học tiếp.' })
  expect(await screen.findByText(/Em đã hoàn thành phần được xếp hôm nay/)).toBeTruthy()
  expect(screen.queryByText(/Hiện chưa có câu phù hợp/)).toBeNull()
})
