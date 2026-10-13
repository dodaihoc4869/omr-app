// HỎI THÊM THẦY · giao diện (thầy 13/10): ô nhắn dưới lời giải, nhãn "Thầy Đỗ Đại Học" (thầy dặn: KHÔNG dùng chữ "trợ lý"), trần lượt, ngoài phạm vi.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-thu' }))
import HoiThemThay from '../src/components/loi-giai/HoiThemThay'
import KhungLoiGiai from '../src/components/loi-giai/KhungLoiGiai'

type PhanHoi = Record<string, unknown>
let phanHoi: PhanHoi[] = []
const goi: { url: string; body: PhanHoi }[] = []
beforeEach(() => {
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ token: 'tok-em' }))
  goi.length = 0
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    goi.push({ url: String(input), body: JSON.parse(String(init?.body ?? '{}')) })
    return new Response(JSON.stringify(phanHoi.shift() ?? { ok: false, error: 'hết' }), { status: 200, headers: { 'content-type': 'application/json' } })
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear() })

const mo = () => fireEvent.click(screen.getByRole('button', { name: 'Em còn chỗ chưa hiểu? Nhắn hỏi Thầy' }))
const o = () => screen.getByLabelText('Chỗ em thắc mắc về câu này') as HTMLTextAreaElement

describe('ô hỏi thêm Thầy', () => {
  it('gửi câu hỏi ⇒ lời trả lời có nhãn "Thầy Đỗ Đại Học", đếm câu hỏi còn lại; không có chữ "trợ lý" ở đâu', async () => {
    phanHoi = [{ ok: true, traLoi: 'Ý b sai vì em nhầm chất.\nEm xem lại bước 2.', conLai: 19, ngoaiPhamVi: false }]
    const onTraLoi = vi.fn()
    const { container } = render(<HoiThemThay qid="DE-II-4" nguon="luyen_de" onTraLoi={onTraLoi} />)
    mo()
    expect(screen.getByRole('heading', { name: 'Hỏi thêm Thầy về câu này' })).toBeTruthy()
    fireEvent.change(o(), { target: { value: '  Vì sao ý b sai ạ?  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await screen.findByText('Thầy Đỗ Đại Học')
    expect(goi[0]!.url).toBe('https://may-thu/hs/hoi-tro-ly')
    expect(goi[0]!.body).toMatchObject({ token: 'tok-em', qid: 'DE-II-4', nguon: 'luyen_de', cauHoi: 'Vì sao ý b sai ạ?' })
    expect(screen.getByText('Vì sao ý b sai ạ?')).toBeTruthy()
    expect(container.textContent).toContain('Em xem lại bước 2.')
    expect(screen.getByText('Còn 19 câu hỏi hôm nay')).toBeTruthy()
    expect(onTraLoi).toHaveBeenCalledTimes(1)
    expect(o().value).toBe('')
    expect(container.textContent!.toLowerCase()).not.toContain('trợ lý')
  })

  it('Enter gửi, Shift+Enter xuống dòng', async () => {
    phanHoi = [{ ok: true, traLoi: 'Được.', conLai: 5, ngoaiPhamVi: false }]
    render(<HoiThemThay qid="Q" nguon="on_lai" gon />)
    fireEvent.change(o(), { target: { value: 'Câu hỏi' } })
    fireEvent.keyDown(o(), { key: 'Enter', shiftKey: true })
    expect(goi).toHaveLength(0)
    fireEvent.keyDown(o(), { key: 'Enter' })
    await screen.findByText('Được.')
    expect(goi).toHaveLength(1)
  })

  it('hết lượt ⇒ báo đúng lời máy chủ, khoá ô nhập, trả lại chữ em vừa gõ, bỏ tin chưa gửi được', async () => {
    phanHoi = [{ ok: false, ma: 'het_luot', conLai: 0, error: 'Hôm nay em đã hỏi đủ 20 câu. Mai em hỏi tiếp nhé.' }]
    render(<HoiThemThay qid="Q" nguon="luyen" gon />)
    fireEvent.change(o(), { target: { value: 'Còn hỏi được không ạ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Hôm nay em đã hỏi đủ 20 câu. Mai em hỏi tiếp nhé.')
    expect(o().disabled).toBe(true)
    expect(o().value).toBe('Còn hỏi được không ạ')
    expect(screen.queryAllByText('Còn hỏi được không ạ').filter((x) => x.tagName === 'P')).toHaveLength(0)
  })

  it('câu ngoài phạm vi ⇒ hiện câu của máy chủ, KHÔNG tính là có trợ giúp', async () => {
    phanHoi = [{ ok: true, traLoi: 'Ở đây Thầy chỉ trả lời về câu em đang xem.', conLai: 18, ngoaiPhamVi: true }]
    const onTraLoi = vi.fn()
    render(<HoiThemThay qid="Q" nguon="dao" gon onTraLoi={onTraLoi} />)
    fireEvent.change(o(), { target: { value: 'Giải giúp em bài Lý' } })
    fireEvent.click(screen.getByRole('button', { name: 'Gửi' }))
    await screen.findByText('Ở đây Thầy chỉ trả lời về câu em đang xem.')
    expect(onTraLoi).not.toHaveBeenCalled()
  })
})

describe('khung lời giải', () => {
  const cau = { qid: 'DE-I-1', so: 'Câu 1', nguon: 'DE', chuong: 'Ester', de: '<p>Đề</p>', y: { A: '8,2 gam' } }
  const lg = { dapAn: 'A', chot: 'n = 0,1 mol', tung: [], buoc: [], ketQua: '' }
  it('hoiThem ⇒ có ô hỏi Thầy; không bật hoặc màn thầy ⇒ không có', async () => {
    const { unmount } = render(<KhungLoiGiai cau={cau} loiGiaiChu={lg} hoiThem onDong={() => {}} />)
    // SỬA CÓ CHỦ ĐÍCH 13/10: phần hỏi thêm nạp khi mở lời giải, đợi xong mảnh rồi kiểm đúng luồng cũ.
    expect(await screen.findByRole('button', { name: 'Em còn chỗ chưa hiểu? Nhắn hỏi Thầy' })).toBeTruthy()
    unmount()
    const r2 = render(<KhungLoiGiai cau={cau} loiGiaiChu={lg} onDong={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Em còn chỗ chưa hiểu? Nhắn hỏi Thầy' })).toBeNull()
    r2.unmount()
    render(<KhungLoiGiai cau={cau} loiGiaiChu={lg} hoiThem thay onDong={() => {}} />)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Em còn chỗ chưa hiểu? Nhắn hỏi Thầy' })).toBeNull())
  })
})
