// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import HocTapHomNay from '../src/components/hoc-tap/HocTapHomNay'
import ManLamBaiTap, { duTraLoi, propsCauHoc } from '../src/components/hoc-tap/ManLamBaiTap'
import { goiHoa2 } from '../src/components/hoa2/api'
import { docSanh } from '../src/components/hoa2/api'
vi.mock('../src/components/hoa2/api', async importOriginal => ({ ...await importOriginal<typeof import('../src/components/hoa2/api')>(), goiHoa2: vi.fn() }))
afterEach(() => { cleanup(); vi.clearAllMocks(); localStorage.clear() })
const q = { qid: 'gia-1', maDe: 'gia', version: 'v1', group: 'g1', phan: 'I' as const, text: 'Chất nào là muối?', choices: ['NaCl', 'HCl', 'NaOH', 'H2O'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] }
it('màn chính dùng dữ liệu kế hoạch, không có cửa game hoặc đòi chọn thú', () => {
  const hoc = vi.fn()
  const sanh = docSanh({ cheDo2: true, theLuc: { con: 18, tong: 24 }, hanhTrinh: { tang: 1, toiThieu: 24, daLam: 6, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 2, cauTrongChang: 6 } })
  render(<HocTapHomNay ten="An" lop="12A1" ketQua={sanh} dangTai={false} loi="" coCa={false} onHoc={hoc} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()} />)
  expect(screen.getByText('Nền tảng · Đợt 2/4')).toBeTruthy()
  expect(screen.queryByText(/Bát Linh|Bi-a|Thần thú|Cửa hàng|Hộ Tống/i)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục học' })); expect(hoc).toHaveBeenCalledOnce()
  fireEvent.click(screen.getByRole('button', { name: 'Ôn & sửa' })); expect(screen.getByRole('button', { name: /Tự chữa lỗi/ })).toBeTruthy()
})
it('trước nộp không có đáp án, sau nộp dùng phản hồi máy chủ; nháp không mất khi lỗi', async () => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [q] }).mockRejectedValueOnce(new Error('Mạng gián đoạn')).mockResolvedValueOnce({ ok: true, correct: true, answer: 'A', solution: 'NaCl là muối.' })
  render(<ManLamBaiTap token="gia" sbd="gia" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
  await screen.findByText('Chất nào là muối?')
  expect(screen.queryByText('NaCl là muối.')).toBeNull()
  fireEvent.click(screen.getByText('NaCl'))
  fireEvent.click(screen.getByRole('button', { name: /Nộp câu trả lời/ }))
  await screen.findByText('Mạng gián đoạn')
  expect(localStorage.getItem('hoc-tap:nhap:gia:gia-1:v1')).toBe('A')
  fireEvent.click(screen.getByRole('button', { name: /Nộp câu trả lời/ }))
  await screen.findByText('Em đã trả lời đúng.')
  expect(localStorage.getItem('hoc-tap:nhap:gia:gia-1:v1')).toBeNull()
  await waitFor(() => expect(goiHoa2).toHaveBeenLastCalledWith('answer', 'gia', expect.objectContaining({ session: 'p1', qid: 'gia-1', answer: 'A' }), 40))
})
it('đúng-sai phải đủ bốn ý; props làm bài không mang đáp án/lời giải trước nộp', () => {
  expect(duTraLoi('II', 'DS-D')).toBe(false); expect(duTraLoi('II', 'DSDS')).toBe(true)
  expect(duTraLoi('III', '  ')).toBe(false); expect(duTraLoi('III', '-0,25')).toBe(true)
  const p = propsCauHoc(q, 1, '', vi.fn())
  expect(p).not.toHaveProperty('correct'); expect(p).not.toHaveProperty('loiGiai'); expect(p.cheDo).toBe('thi')
})
