// Kiểm phiên tự làm: chỉ kho máy chủ tạo bằng chứng; không suy ra từ câu luyện AI.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
const { taiTuSuaLoi } = vi.hoisted(() => ({ taiTuSuaLoi: vi.fn(async () => ({ trangThai: 'tat' })) }))
vi.mock('../src/lib/tu-sua-loi', () => ({ taiTuSuaLoi }))
import HoiThemThay from '../src/components/loi-giai/HoiThemThay'
import HopHoiThay from '../src/components/loi-giai/HopHoiThay'
import HoiThayKiemChung from '../src/components/loi-giai/HoiThayKiemChung'
import { moKiemChung } from '../src/lib/hoi-thay-kiem-chung-api'

type Json = Record<string, unknown>
const cau = { qid: 'KHO-I-8', phan: 'I', text: 'Chất nào là ester?', choices: ['Ethyl acetate', 'Ethanol', 'Acetic acid', 'Glucose'] }
const ketMo = (doi: Json = {}) => ({ ok: true, trangThai: 'co_cau', phienId: 'phien-1', cau, ...doi })
const ketNop = { ok: true, dung: true, trangThai: 'cho_kiem_lai', denHan: '2026-10-18T01:00:00Z', thongBao: 'Em tự làm đúng. App sẽ kiểm lại sau.' }
const goi: { url: string; body: Json }[] = []
let xuLy: (url: string, body: Json) => Promise<Response>
const tra = (j: Json, status = 200) => Promise.resolve(new Response(JSON.stringify(j), { status, headers: { 'content-type': 'application/json' } }))
beforeEach(() => {
  goi.length = 0; taiTuSuaLoi.mockClear()
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'token-em' }))
  xuLy = (u) => u.endsWith('/mo') ? tra(ketMo()) : u.endsWith('/nop') ? tra(ketNop) : u.endsWith('/gui-thay') ? tra({ ok: true, thongBao: 'Đã gửi thầy chỗ em đang vướng.' }) : tra({ ok: true, traLoi: 'Em phân biệt nhóm chức trong ester nhé.', conLai: 8 })
  vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
    const url = String(input), body = JSON.parse(String(init?.body ?? '{}')) as Json
    goi.push({ url, body }); return xuLy(url, body)
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear() })
const bamMo = () => fireEvent.click(screen.getByRole('button', { name: 'Tự làm một câu tương đương' }))
const hoi = () => { fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Em chưa hiểu vì sao ạ?' } }); fireEvent.click(screen.getByRole('button', { name: 'Gửi' })) }

// Thầy 21/10 "bỏ phần làm câu tương đương đi": sau hướng dẫn KHÔNG còn lời mời tự làm câu tương đương, không gọi kho kiểm, lối lời giải giữ nguyên.
describe('Hỏi thầy sau hướng dẫn', () => {
  it('trong hộp: sau câu trả lời vẫn còn lối mở lời giải, không có lời mời câu tương đương', async () => {
    render(<HopHoiThay cau={{ qid: 'GOC-1', so: 'Câu 1', nguon: 'on_lai', chuong: 'Ester', de: '<p>Câu gốc.</p>', y: {} }} nguon="on_lai" onDong={() => {}} onMoLoiGiai={() => {}} />)
    hoi(); await screen.findByText('Em phân biệt nhóm chức trong ester nhé.')
    expect(screen.getByRole('button', { name: 'Xem lời giải từng bước' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Tự làm một câu tương đương' })).toBeNull()
  })
  it('chỉ gọi đúng một lệnh hỏi; không gọi kho kiểm; ô nhắn vẫn mở để hỏi tiếp', async () => {
    render(<HoiThemThay qid="GOC-1" nguon="on_lai" hop />)
    expect(goi).toHaveLength(0)
    hoi(); await screen.findByText('Em phân biệt nhóm chức trong ester nhé.')
    expect(goi).toHaveLength(1)
    expect(goi.some((g) => g.url.includes('/kiem/'))).toBe(false)
    expect(screen.queryByRole('button', { name: 'Tự làm một câu tương đương' })).toBeNull()
    expect((screen.getByLabelText('Chỗ em thắc mắc về câu này') as HTMLTextAreaElement).disabled).toBe(false)
  })

  it('đổi qid khi reply cũ đang chờ: không gắn câu trả lời/biên nhận vào câu mới', async () => {
    let traCu!: (r: Response) => void
    xuLy = () => new Promise((r) => { traCu = r })
    const onTraLoi = vi.fn()
    const { rerender } = render(<HoiThemThay qid="CU" nguon="on_lai" hop onTraLoi={onTraLoi} />)
    hoi()
    await waitFor(() => expect(goi).toHaveLength(1))
    rerender(<HoiThemThay qid="MOI" nguon="on_lai" hop onTraLoi={onTraLoi} />)
    await act(async () => { traCu(await tra({ ok: true, traLoi: 'Lời giải câu cũ.', conLai: 3 })) })
    expect(screen.queryByText('Lời giải câu cũ.')).toBeNull()
    expect(onTraLoi).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Tự làm một câu tương đương' })).toBeNull()
  })

  it('reply ngoài phạm vi không báo trợ giúp; reply đúng phạm vi sau đó báo trợ giúp đúng một lần', async () => {
    let n = 0
    xuLy = () => tra(n++ === 0 ? { ok: true, traLoi: 'Em hỏi về câu này nhé.', conLai: 5, ngoaiPhamVi: true } : { ok: true, traLoi: 'Em xem nhóm chức.', conLai: 4 })
    const onTraLoi = vi.fn()
    render(<HoiThemThay qid="Q" nguon="on_lai" hop onTraLoi={onTraLoi} />)
    hoi(); await screen.findByText('Em hỏi về câu này nhé.')
    expect(screen.queryByRole('button', { name: 'Tự làm một câu tương đương' })).toBeNull()
    hoi(); await screen.findByText('Em xem nhóm chức.')
    expect(onTraLoi).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Tự làm một câu tương đương' })).toBeNull()
  })
})

describe('phiên tự làm từ kho', () => {
  it('nộp lần đầu ghi máy chủ, hiện biên nhận và cập nhật số Tự sửa lỗi; không ghi đề/đáp án vào storage', async () => {
    render(<HoiThayKiemChung qid="GOC-1" />)
    const truoc = localStorage.getItem('omr_student_portal_auth')
    bamMo(); await screen.findByText('Chất nào là ester?')
    expect(document.querySelector('[data-trang-thai="dung"]')).toBeNull()
    expect((screen.getByRole('button', { name: 'Nộp câu tự làm' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(screen.getByRole('button', { name: /Ethyl acetate/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    await screen.findByText('Em tự làm đúng. App sẽ kiểm lại sau.')
    expect(screen.getByText('Đang chờ kiểm lại')).toBeTruthy()
    expect(screen.queryByText('Đã xác nhận khắc phục')).toBeNull()
    expect(goi.find((g) => g.url.endsWith('/nop'))!.body).toMatchObject({ token: 'token-em', phienId: 'phien-1', traLoi: 'A', attemptId: expect.any(String) })
    await waitFor(() => expect(taiTuSuaLoi).toHaveBeenCalledWith('token-em', { moi: true }))
    expect(localStorage.length).toBe(1); expect(localStorage.getItem('omr_student_portal_auth')).toBe(truoc)
    expect(sessionStorage.length).toBe(0)
  })

  it('mạng lỗi sau gửi: retry cùng mã và bài, không nhấp kép hay sửa câu trả lời trước khi nhận kết quả', async () => {
    let traNop!: (r: Response) => void
    let n = 0
    xuLy = (u) => u.endsWith('/mo') ? tra(ketMo()) : ++n === 1 ? Promise.reject(new TypeError('offline')) : new Promise((r) => { traNop = r })
    render(<HoiThayKiemChung qid="GOC-1" />)
    bamMo(); await screen.findByText('Chất nào là ester?')
    fireEvent.click(screen.getByRole('button', { name: /Ethyl acetate/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    await screen.findByRole('alert')
    expect(screen.queryByRole('button', { name: /Ethanol/ })).toBeNull()
    const retry = screen.getByRole('button', { name: 'Gửi lại lần trả lời này' })
    fireEvent.click(retry); fireEvent.click(retry)
    await waitFor(() => expect(goi.filter((g) => g.url.endsWith('/nop'))).toHaveLength(2))
    const [mot, hai] = goi.filter((g) => g.url.endsWith('/nop'))
    expect(hai!.body).toEqual(mot!.body)
    await act(async () => { traNop(await tra({ ...ketNop, idempotent: true })) })
    await screen.findByText('Em tự làm đúng. App sẽ kiểm lại sau.')
  })

  it.each([
    ['cho_kiem_lai', 'Đang chờ kiểm lại'], ['da_xac_nhan', 'Đã xác nhận khắc phục'], ['cho_nguon', 'Đang chuẩn bị câu phù hợp'],
  ])('mở lại khôi phục %s từ máy chủ, không phát lại câu đã nộp', async (trangThai, nhan) => {
    xuLy = () => tra({ ok: true, trangThai, thongBao: 'Trạng thái đã lưu.' })
    render(<HoiThayKiemChung qid="GOC-1" />)
    bamMo(); await screen.findByText(nhan)
    expect(screen.queryByText('Chất nào là ester?')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Nộp câu tự làm' })).toBeNull()
  })

  it.each(['PHIEN_HET_HAN', 'CAU_THAY_DOI', 'DA_NOP', 'XUNG_DOT_ATTEMPT'])('%s: khôi phục từ máy chủ theo nút, không lặp nộp phiên cũ hay xoá lần trả lời', async (ma) => {
    let n = 0
    xuLy = (u) => u.endsWith('/mo') ? tra(++n === 1 ? ketMo() : { ...ketNop }) : tra({ ok: false, ma, error: 'Phiên này cần lấy lại trạng thái từ máy chủ.' })
    const onDangKiem = vi.fn()
    render(<HoiThayKiemChung qid="GOC-1" onDangKiem={onDangKiem} />)
    bamMo(); await screen.findByText('Chất nào là ester?')
    fireEvent.click(screen.getByRole('button', { name: /Ethyl acetate/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Khôi phục trạng thái đã lưu' }))
    await screen.findByText('Đang chờ kiểm lại')
    expect(goi.filter((g) => g.url.endsWith('/nop'))).toHaveLength(1)
    expect(goi.filter((g) => g.url.endsWith('/mo'))).toHaveLength(2)
    expect(onDangKiem).toHaveBeenLastCalledWith(false)
  })

  it('thiếu nguồn hoặc lỗi mở vẫn có thể gửi thầy tại chỗ, ghi Đã gửi thầy, không gửi hai lần', async () => {
    let traGui!: (r: Response) => void
    xuLy = (u) => u.endsWith('/mo') ? tra({ ok: false, ma: 'tam_loi', error: 'Chưa lấy được câu.' }) : new Promise((r) => { traGui = r })
    render(<HoiThayKiemChung qid="GOC-1" />)
    bamMo(); await screen.findByText('Chưa lấy được câu.')
    const nut = screen.getByRole('button', { name: 'Cần thầy hỗ trợ' })
    fireEvent.click(nut); fireEvent.click(nut)
    await waitFor(() => expect(goi.filter((g) => g.url.endsWith('/gui-thay'))).toHaveLength(1))
    await act(async () => { traGui(await tra({ ok: true, thongBao: 'Thầy đã nhận chỗ em đang vướng.' })) })
    expect((screen.getByRole('button', { name: 'Đã gửi thầy' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByText('Chất nào là ester?')).toBeNull()
  })

  it('nguồn trả thiếu phương án: báo tải lại thay vì vỡ cả hộp hỏi', async () => {
    xuLy = () => tra(ketMo({ cau: { ...cau, choices: ['Chỉ một phương án'] } }))
    render(<HoiThayKiemChung qid="GOC-1" />)
    bamMo(); await screen.findByText('Câu này chưa hiển thị đầy đủ. Em tải lại nhé.')
    expect(screen.getByRole('button', { name: 'Tải lại câu tương đương' })).toBeTruthy()
  })

  it('lời thầy thật vẫn đọc được khi chưa có nguồn kiểm chứng; không thực thi HTML', async () => {
    xuLy = () => tra({ ok: true, trangThai: 'cho_nguon', loiThay: 'Em phân biệt CH3COOH và CH3COOCH3. <img src=x onerror=alert(1)>', capNhatLuc: 1792112400000 })
    render(<HoiThayKiemChung qid="GOC-1" />)
    bamMo(); await screen.findByLabelText('Thầy Đỗ Đại Học gửi em')
    expect(screen.getByText('Đang chuẩn bị câu phù hợp')).toBeTruthy()
    expect(document.querySelector('.lg-kc img')).toBeNull()
    expect(screen.getByRole('button', { name: 'Cần thầy hỗ trợ' })).toBeTruthy()
  })

  it('đóng hộp khi đang chọn câu: phản hồi muộn không mở lại hay báo đang kiểm', async () => {
    let traMo!: (r: Response) => void
    xuLy = () => new Promise((r) => { traMo = r })
    const onDangKiem = vi.fn()
    const { unmount } = render(<HoiThayKiemChung qid="GOC-1" onDangKiem={onDangKiem} />)
    bamMo(); await waitFor(() => expect(goi).toHaveLength(1))
    unmount()
    await act(async () => { traMo(await tra(ketMo())) })
    expect(onDangKiem).not.toHaveBeenCalled()
    expect(taiTuSuaLoi).not.toHaveBeenCalled()
  })

  it('câu đúng–sai phải đủ bốn ý; gửi theo thứ tự gốc', async () => {
    xuLy = (u) => u.endsWith('/mo') ? tra(ketMo({ cau: { qid: 'KHO-II-1', phan: 'II', text: 'Xét các nhận định:', ideas: ['Ý một', 'Ý hai', 'Ý ba', 'Ý bốn'] } })) : tra(ketNop)
    render(<HoiThayKiemChung qid="GOC-1" />)
    bamMo(); await screen.findByText('Xét các nhận định:')
    const dung = screen.getAllByRole('button', { name: 'Đúng' }), sai = screen.getAllByRole('button', { name: 'Sai' })
    fireEvent.click(dung[0]!); fireEvent.click(sai[1]!); fireEvent.click(dung[2]!)
    expect((screen.getByRole('button', { name: 'Nộp câu tự làm' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.click(sai[3]!); fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    await screen.findByText(ketNop.thongBao)
    expect(goi.find((g) => g.url.endsWith('/nop'))!.body.traLoi).toBe('DSDS')
  })

  it('câu trả lời ngắn dùng ô số chung, gửi dấu âm và dấu phẩy nguyên nghĩa', async () => {
    xuLy = (u) => u.endsWith('/mo') ? tra(ketMo({ cau: { qid: 'KHO-III-1', phan: 'III', text: 'Tính giá trị.' } })) : tra(ketNop)
    render(<HoiThayKiemChung qid="GOC-1" />)
    bamMo(); await screen.findByText('Tính giá trị.')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '0,5' } })
    fireEvent.click(screen.getByRole('button', { name: 'Đổi dấu âm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Nộp câu tự làm' }))
    await screen.findByText(ketNop.thongBao)
    expect(goi.find((g) => g.url.endsWith('/nop'))!.body.traLoi).toBe('-0,5')
  })

  it('chưa đăng nhập hoặc máy chủ trả lỗi HTTP: không giả thành công', async () => {
    localStorage.clear()
    expect(await moKiemChung('Q')).toMatchObject({ ok: false, ma: 'dang_nhap' })
    expect(goi).toHaveLength(0)
    localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'token-em' }))
    xuLy = () => tra({ ok: false, ma: 'dang_kiem_tra', error: 'Em hoàn thành ca kiểm tra trước nhé.' }, 403)
    expect(await moKiemChung('Q')).toMatchObject({ ok: false, ma: 'dang_kiem_tra' })
  })
})
