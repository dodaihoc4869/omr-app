// @vitest-environment jsdom
// NỘP TỨC THÌ (thầy 27/10: «Học sinh kêu bấm nút nộp load chậm lag. Tối ưu tức thì luôn đi»). Màn làm chặng kiểu Duolingo: bấm «Kiểm tra» ⇒ nút đổi NGAY sang
// trạng thái chờ (data-cho + aria-busy, chữ «Đang kiểm tra…», khoá bấm đúp — chỉ MỘT lệnh `answer`), CHƯA hiện đúng/sai tới khi máy chủ chấm; có kết quả ⇒ tải
// sẵn ảnh đề / phương án của câu kế (không gồm ảnh lời giải).
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import ManLamBaiTap from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'

vi.mock('../src/components/hoa2/api', async (goc) => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
// «Kiểm tra» theo luồng (doc-luong-nop.ts) đi qua cùng `goiHoa2` giả: đối số thứ 5 = hàm nhận dòng tạm (đúng / sai chấm từ bộ nhớ máy chủ).
vi.mock('../src/components/hoa2/doc-luong-nop', () => ({ nopCauLuong: (token: string, du: Record<string, unknown>, giay: number, tam: (o: Record<string, unknown>) => void) => goiHoa2('answer', token, du, giay, tam as never) }))
beforeEach(() => { document.documentElement.dataset.trong = 'hs' })
afterEach(() => { cleanup(); vi.mocked(goiHoa2).mockReset(); vi.unstubAllGlobals(); localStorage.clear(); delete document.documentElement.dataset.trong })

const nen = { maDe: 'de-8', version: 'v1', group: 'g', hinhAnh: [], dang: null, tenDang: 'Amine', mucDo: 'hieu', sao: 0, kienThuc: [], ideas: [] }
const C1 = { ...nen, qid: 'q1', phan: 'I' as const, text: 'Câu một về amine', choices: ['2', '8', '3', '4'] }
const C2 = { ...nen, qid: 'q2', phan: 'I' as const, text: 'Câu hai về amine', choices: ['A1', 'B2', 'C3', 'D4'],
  hinhAnh: [{ src: 'https://anh.test/de-q2.png', viTri: 'sau_de' }, { src: 'https://anh.test/lg-q2.png', viTri: 'sau_loi_giai' }], choiceImgs: ['https://anh.test/pa-q2.png'] }

it('bấm «Kiểm tra» ⇒ nút chờ ngay (data-cho, aria-busy, khoá bấm đúp), chưa đúng/sai; có kết quả ⇒ nạp sẵn ảnh câu kế, không nạp ảnh lời giải', async () => {
  const nap: string[] = []
  class AnhGia { decoding = ''; set src(v: string) { nap.push(v) } }
  vi.stubGlobal('Image', AnhGia)
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [C1, C2] })
  render(<ManLamBaiTap token="tk" sbd="s1" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} homNay={null} />)
  await screen.findByText(C1.text)
  let tra: (v: Record<string, unknown>) => void = () => {}
  vi.mocked(goiHoa2).mockImplementation((lenh) => lenh === 'answer' ? new Promise((ok) => { tra = ok }) : Promise.resolve({ ok: true }))
  fireEvent.click(screen.getByRole('radio', { name: /^D/ }))
  fireEvent.click(screen.getByRole('button', { name: 'Kiểm tra' }))
  const nut = await screen.findByRole('button', { name: 'Đang kiểm tra…' }) as HTMLButtonElement
  expect(nut.disabled).toBe(true)
  // CHẤM NHANH 28/10: chạm ⇒ dải kết quả trượt lên NGAY ở trạng thái trung tính «Đang chấm…» (chưa đúng/sai)
  const dai = document.querySelector('.duo-ket')!
  expect(dai.getAttribute('data-tt')).toBe('cho')
  expect(dai.getAttribute('aria-busy')).toBe('true')
  expect(dai.textContent).toContain('Đang chấm…')
  fireEvent.click(nut); fireEvent.keyDown(window, { key: 'Enter' })
  const goiNop = vi.mocked(goiHoa2).mock.calls.filter((c) => c[0] === 'answer')
  expect(goiNop).toHaveLength(1)
  expect(typeof goiNop[0]![4]).toBe('function') // xin máy chủ trả theo luồng (dòng tạm đúng / sai)
  expect(nap).toEqual([])
  // dòng TẠM (chấm từ bộ nhớ máy chủ) ⇒ CÙNG dải đổi màu đúng tại chỗ (không dựng lại phần tử), trước phản hồi đầy đủ
  await act(async () => { (goiNop[0]![4] as (o: Record<string, unknown>) => void)({ ok: true, tam: true, correct: true, answer: 'D', solution: {} }) }) // dòng tạm (chưa có dòng đầy đủ)
  expect(document.querySelector('.duo-ket')).toBe(dai)
  expect(dai.getAttribute('data-tt')).toBe('dung')
  await act(async () => { tra({ correct: true, answer: 'D', solution: {} }) })
  expect(document.querySelector('.duo-ket')!.getAttribute('data-tt')).toBe('dung')
  expect(nap.sort()).toEqual(['https://anh.test/de-q2.png', 'https://anh.test/pa-q2.png'])
})
