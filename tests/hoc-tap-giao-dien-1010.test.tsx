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
it('màn chính dùng dữ liệu kế hoạch, không có cửa game hoặc đòi chọn thú', async () => {
  const hoc = vi.fn()
  const sanh = docSanh({ cheDo2: true, theLuc: { con: 18, tong: 24 }, hanhTrinh: { tang: 1, toiThieu: 24, daLam: 6, daXep: 24, conThieu: 0, soChang: 4, changHienTai: 2, cauTrongChang: 6 } })
  render(<HocTapHomNay ten="An" lop="12A1" ketQua={sanh} dangTai={false} loi="" coCa={false} onHoc={hoc} onXemLai={vi.fn()} onChua={vi.fn()} onThi={vi.fn()} onTuLuyen={vi.fn()} onLichSu={vi.fn()} onBaiTap={vi.fn()} onGiaDinh={vi.fn()} onTaiLai={vi.fn()} onDangXuat={vi.fn()} />)
  // Trùng tu 11/10: tên tầng ngắn + "Chặng" (bảng từ chuẩn A2 cấm "đợt").
  expect(screen.getByText('Nền · Chặng 2/4')).toBeTruthy()
  expect(screen.queryByText(/Bát Linh|Bi-a|Thần thú|Cửa hàng|Hộ Tống/i)).toBeNull()
  // SỬA CÓ CHỦ ĐÍCH 12/10 (thầy 12/10: "gộp hai phần làm một"): nút học duy nhất của thẻ "Hôm nay của em" ghi số câu còn lại ("Học tiếp · 18 câu").
  fireEvent.click(screen.getByRole('button', { name: 'Học tiếp · 18 câu' })); expect(hoc).toHaveBeenCalledOnce()
  // SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 18): tên mục theo chữ thầy. SỬA CÓ CHỦ ĐÍCH 13/10 (đợt 19, luật tốc độ): tab Ôn & sửa nạp khi mở ⇒ chờ thẻ hiện (findBy).
  fireEvent.click(screen.getByRole('button', { name: 'Ôn & sửa' })); expect(await screen.findByRole('button', { name: /Tự sửa lỗi/ })).toBeTruthy()
})
it('trước nộp không có đáp án, sau nộp dùng phản hồi máy chủ; nháp không mất khi lỗi', async () => {
  vi.mocked(goiHoa2).mockResolvedValueOnce({ ok: true, id: 'p1', questions: [q] }).mockRejectedValueOnce(new Error('Mạng gián đoạn')).mockResolvedValueOnce({ ok: true, correct: true, answer: 'A', solution: 'NaCl là muối.' })
  render(<ManLamBaiTap token="gia" sbd="gia" onVe={vi.fn()} onCapNhat={vi.fn()} onChua={vi.fn()} />)
  await screen.findByText('Chất nào là muối?')
  expect(screen.queryByText('NaCl là muối.')).toBeNull()
  fireEvent.click(screen.getByText('NaCl'))
  // SỬA CÓ CHỦ ĐÍCH 12/10 (thầy 12/10 duyệt bản vẽ màn làm bài): nút chính "Nộp câu · đã chọn A"; dải kết quả "Đúng · tự làm".
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn A' }))
  await screen.findByText('Mạng gián đoạn')
  expect(localStorage.getItem('hoc-tap:nhap:gia:gia-1:v1')).toBe('A')
  fireEvent.click(screen.getByRole('button', { name: 'Nộp câu · đã chọn A' }))
  await screen.findByText('Đúng · tự làm')
  expect(localStorage.getItem('hoc-tap:nhap:gia:gia-1:v1')).toBeNull()
  await waitFor(() => expect(goiHoa2).toHaveBeenLastCalledWith('answer', 'gia', expect.objectContaining({ session: 'p1', qid: 'gia-1', answer: 'A' }), 40))
})
it('đúng-sai phải đủ bốn ý; props làm bài không mang đáp án/lời giải trước nộp', () => {
  expect(duTraLoi('II', 'DS-D')).toBe(false); expect(duTraLoi('II', 'DSDS')).toBe(true)
  expect(duTraLoi('III', '  ')).toBe(false); expect(duTraLoi('III', '-0,25')).toBe(true)
  const p = propsCauHoc(q, 1, '', vi.fn())
  expect(p).not.toHaveProperty('correct'); expect(p).not.toHaveProperty('loiGiai'); expect(p.cheDo).toBe('thi')
})
