// Đường kiểm lại ngày khác phải đi thẳng vào câu kho, không phải hỏi/xem AI lại.
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
vi.mock('../src/components/hoa2/api', () => ({ taiCauDaLam: async () => ({ cheDo2: false }), NHAN_NGUON_LAN: {} }))
vi.mock('../src/components/chua-cau-sai/ManChuaCauSai', () => ({ default: ({ onVe }: { onVe: () => void }) => <div>Luồng sửa từng bước cũ<button type="button" onClick={onVe}>Về danh sách cũ</button></div> }))
import ManTuChua from '../src/components/hoc-tap/ManTuChua'
import { docNhoTuSua, soCauCanSua, xoaNhoTuSua } from '../src/lib/tu-sua-loi'

type Json = Record<string, unknown>
const goi: { url: string; body: Json }[] = []
let xuLy: (u: string, body: Json) => Promise<Response>
let daXong = false
const tra = (j: Json) => Promise.resolve(new Response(JSON.stringify(j), { status: 200 }))
const danhSach = () => ({ ok: true, ds: [
  { qid: 'Q-CU', dotId: 'D0', trangThai: 'can_chan_doan' },
  { qid: 'Q-KIEM', dotId: 'D1', trangThai: daXong ? 'da_tu_sua' : 'cho_gap_lai_2', denHan: '2026-01-01T00:00:00Z', kiemHoiThay: true },
], dem: { tong: 2, can: daXong ? 1 : 2, cho: 0, xong: daXong ? 1 : 0 } })
const cauI = { qid: 'KHO-I-8', phan: 'I', text: 'Chất nào là ester?', choices: ['Ethyl acetate', 'Ethanol', 'Acetic acid', 'Glucose'] }
const ketMo = (cau = cauI) => ({ ok: true, trangThai: 'co_cau', phienId: 'PHIEN-KIEM', cau })
beforeEach(() => {
  goi.length = 0; daXong = false; xoaNhoTuSua()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'token-em' }))
  xuLy = (u) => u.endsWith('/co') ? tra({ ok: true }) : u.endsWith('/danh-sach') ? tra(danhSach()) : u.endsWith('/kiem/mo') ? tra(ketMo()) : u.endsWith('/kiem/nop') ? (daXong = true, tra({ ok: true, dung: true, trangThai: 'da_xac_nhan', thongBao: 'Em tự làm được ở lần kiểm lại.' })) : tra({ ok: false })
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => { const url = String(input), body = JSON.parse(String(init?.body ?? '{}')) as Json; goi.push({ url, body }); return xuLy(url, body) })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); xoaNhoTuSua() })
const moDongKiem = async () => { await screen.findByText('Câu sai số 2'); fireEvent.click(document.querySelector('[data-khoa="D1"]')!) }
const khongHoiAi = () => expect(goi.filter((g) => g.url.endsWith('/hs/hoi-thay') || g.url.endsWith('/hs/hoi-tro-ly'))).toHaveLength(0)

describe('kiểm lại trực tiếp từ Tự sửa lỗi', () => {
  it('câu chưa có đợt sai nằm trong khu riêng, không tăng tổng lỗi và vẫn mở kiểm trực tiếp', async () => {
    const macDinh = xuLy
    xuLy = (u, b) => u.endsWith('/danh-sach') ? tra({ ok: true, ds: [], dem: { tong: 0, can: 0, cho: 0, xong: 0 }, kiemLaiHoiThay: [{ qid: 'Q-RIENG', ten: 'Nhận diện nhóm chức ester', phan: 'I', trangThai: 'den_han' }] }) : macDinh(u, b)
    render(<ManTuChua token="token-em" onVe={() => {}} />)
    await screen.findByRole('region', { name: 'Kiểm lại sau Hỏi thầy' })
    expect(screen.getByText('Em không còn câu nào cần sửa')).toBeTruthy()
    expect(soCauCanSua(docNhoTuSua('token-em'), Date.now())).toBe(0)
    fireEvent.click(screen.getByRole('button', { name: /Nhận diện nhóm chức ester/ }))
    await screen.findByText('Chất nào là ester?')
    expect(goi.find((g) => g.url.endsWith('/kiem/mo'))!.body.qid).toBe('Q-RIENG')
    khongHoiAi()
  })

  it('khu riêng không lặp câu đã hiện trong danh sách lỗi, không thay tổng cần sửa', async () => {
    const macDinh = xuLy
    xuLy = (u, b) => u.endsWith('/danh-sach') ? tra({ ...danhSach(), kiemLaiHoiThay: [{ qid: 'Q-KIEM', ten: 'Câu trùng không hiện thêm', phan: 'I', trangThai: 'den_han' }, { qid: 'Q-RIENG', ten: 'Câu kiểm lại riêng', phan: 'II', trangThai: 'cho_kiem_lai', denHan: '2100-01-01T00:00:00Z' }] }) : macDinh(u, b)
    render(<ManTuChua token="token-em" onVe={() => {}} />)
    await screen.findByText('Câu kiểm lại riêng')
    expect(screen.queryByText('Câu trùng không hiện thêm')).toBeNull()
    expect(document.querySelector('.tcl-so b')?.textContent).toBe('2')
    expect(screen.getByRole('button', { name: /Câu kiểm lại riêng/ }).textContent).toContain('Xem lịch')
  })

  it('mở thẳng mã câu chỉ có trong lịch Hỏi thầy vẫn không đi qua lời giải hay AI', async () => {
    const macDinh = xuLy
    xuLy = (u, b) => u.endsWith('/danh-sach') ? tra({ ok: true, ds: [], dem: { tong: 0, can: 0, cho: 0, xong: 0 }, kiemLaiHoiThay: [{ qid: 'Q-RIENG', ten: 'Câu riêng của em', phan: 'III', trangThai: 'dang_lam' }] }) : macDinh(u, b)
    render(<ManTuChua token="token-em" qid="Q-RIENG" onVe={() => {}} />)
    await screen.findByText('Chất nào là ester?')
    expect(screen.getByRole('heading', { name: 'Câu riêng của em' })).toBeTruthy()
    expect(screen.queryByText('Luồng sửa từng bước cũ')).toBeNull()
    khongHoiAi()
  })
  it('một lần bấm mở ngay câu kho, không gọi/xem hướng dẫn AI; quay lại cập nhật số và giữ chỗ cuộn', async () => {
    const { getByTestId } = render(<div data-testid="cuon" style={{ height: 400, overflowY: 'auto' }}><ManTuChua token="token-em" onVe={() => {}} /></div>)
    await screen.findByText('Câu sai số 2')
    const cuon = getByTestId('cuon'); cuon.scrollTop = 145
    await moDongKiem(); await screen.findByText('Chất nào là ester?')
    expect(cuon.scrollTop).toBe(0)
    expect(goi.filter((g) => g.url.endsWith('/kiem/mo'))).toHaveLength(1)
    expect(goi.find((g) => g.url.endsWith('/kiem/mo'))!.body.qid).toBe('Q-KIEM')
    khongHoiAi()
    fireEvent.click(screen.getByRole('button', { name: /Ethyl acetate/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    await screen.findByText('Đã xác nhận khắc phục')
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách' }))
    await screen.findByText('Câu sai số 2')
    await waitFor(() => expect(document.querySelector('.tcl-so b')?.textContent).toBe('1'))
    expect(cuon.scrollTop).toBe(145)
    expect((document.activeElement as HTMLElement).dataset.khoa).toBe('D1')
    expect(goi.filter((g) => g.url.endsWith('/danh-sach')).length).toBeGreaterThan(1)
    khongHoiAi()
  })

  it('metadata vắng vẫn mở đúng luồng sửa từng bước cũ', async () => {
    render(<ManTuChua token="token-em" onVe={() => {}} />)
    await screen.findAllByText('Câu sai số 1')
    fireEvent.click(document.querySelector('[data-khoa="D0"]')!)
    await screen.findByText('Luồng sửa từng bước cũ')
    expect(goi.filter((g) => g.url.includes('/hoi-tro-ly/kiem/'))).toHaveLength(0)
  })

  it('mở thẳng bằng qid vẫn dùng metadata để đi vào kiểm lại; StrictMode không tạo hai lần mở', async () => {
    render(<StrictMode><ManTuChua token="token-em" qid="Q-KIEM" onVe={() => {}} /></StrictMode>)
    await screen.findByText('Chất nào là ester?')
    expect(goi.filter((g) => g.url.endsWith('/kiem/mo'))).toHaveLength(1)
    khongHoiAi()
  })

  it('đường trực tiếp dùng đúng token của màn dù máy không lưu được phiên vào localStorage', async () => {
    localStorage.clear()
    render(<ManTuChua token="token-trong-phien" onVe={() => {}} />)
    await moDongKiem(); await screen.findByText('Chất nào là ester?')
    expect(goi.find((g) => g.url.endsWith('/kiem/mo'))!.body.token).toBe('token-trong-phien')
    khongHoiAi()
  })

  it('quay lại khi đang lấy câu: phản hồi cũ không mở lại màn kiểm', async () => {
    const macDinh = xuLy
    let xong!: (r: Response) => void
    xuLy = (u, b) => u.endsWith('/kiem/mo') ? new Promise((r) => { xong = r }) : macDinh(u, b)
    render(<ManTuChua token="token-em" onVe={() => {}} />)
    await moDongKiem()
    await waitFor(() => expect(goi.some((g) => g.url.endsWith('/kiem/mo'))).toBe(true))
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại danh sách' }))
    await screen.findByText('Câu sai số 2')
    await act(async () => { xong(await tra(ketMo())) })
    expect(screen.queryByText('Chất nào là ester?')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Nộp câu tự làm' })).toBeNull()
    khongHoiAi()
  })

  it('kiểm trực tiếp câu đúng–sai gửi đủ bốn ý, không yêu cầu nhận lại hướng dẫn', async () => {
    const macDinh = xuLy
    xuLy = (u, b) => u.endsWith('/kiem/mo') ? tra({ ...ketMo(), cau: { qid: 'KHO-II-1', phan: 'II', text: 'Xét các phát biểu.', ideas: ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'] } }) : macDinh(u, b)
    render(<ManTuChua token="token-em" onVe={() => {}} />)
    await moDongKiem(); await screen.findByText('Xét các phát biểu.')
    const dung = screen.getAllByRole('button', { name: 'Đúng' }), sai = screen.getAllByRole('button', { name: 'Sai' })
    fireEvent.click(dung[0]!); fireEvent.click(sai[1]!); fireEvent.click(dung[2]!); fireEvent.click(sai[3]!)
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    await screen.findByText('Đã xác nhận khắc phục')
    expect(goi.find((g) => g.url.endsWith('/kiem/nop'))!.body.traLoi).toBe('DSDS')
    khongHoiAi()
  })

  it('kiểm trực tiếp câu trả lời ngắn dùng ô số chung', async () => {
    const macDinh = xuLy
    xuLy = (u, b) => u.endsWith('/kiem/mo') ? tra({ ...ketMo(), cau: { qid: 'KHO-III-1', phan: 'III', text: 'Tính số mol.' } }) : macDinh(u, b)
    render(<ManTuChua token="token-em" onVe={() => {}} />)
    await moDongKiem(); await screen.findByText('Tính số mol.')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0,5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    await screen.findByText('Đã xác nhận khắc phục')
    expect(goi.find((g) => g.url.endsWith('/kiem/nop'))!.body.traLoi).toBe('0,5')
    khongHoiAi()
  })
})
