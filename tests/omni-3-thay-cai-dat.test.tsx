// OMNI 3 · C1 — CÀI ĐẶT: cạnh công tắc Game Hóa 2.0 có thẻ "OMNI (theo lớp)" cùng kiểu (`/gv/omni co-doc` / `co-luu`) + thẻ số lượt mỗi ngày theo lớp
// và ma trận đề thi 2026 (`cau-hinh-doc` / `cau-hinh-luu`). Khoá: gửi ĐÚNG lệnh + thân; máy chủ lỗi ⇒ hiện đúng lời máy chủ, nút lưu tắt.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'

const { goi } = vi.hoisted(() => ({ goi: vi.fn() }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))

import CongTacOmni, { chuTrangThaiOmni } from '../src/components/chien-dich/CongTacOmni'

let co: Record<string, unknown> = { bat: false, lop: [], sbd: [] }
let cauHinh: Record<string, unknown> = { theLucLop: { '12A1': 45 }, maTran: null }
function chuanMock() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 44, sbd: [] }, { tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 20, sbd: [] }] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return { ok: true, du: { ok: true, co } }
    if (duong === '/gv/omni' && b.action === 'co-luu') return { ok: true, du: { ok: true, co: b.co } }
    if (duong === '/gv/omni' && b.action === 'cau-hinh-doc') return { ok: true, du: { ok: true, ...cauHinh } }
    if (duong === '/gv/omni' && b.action === 'cau-hinh-luu') return { ok: true, du: { ok: true } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}
const lenh = (action: string) => goi.mock.calls.filter(([d, b]) => d === '/gv/omni' && b.action === action).map(([, b]) => b as Record<string, unknown>)

beforeEach(() => {
  goi.mockReset()
  co = { bat: false, lop: [], sbd: [] }
  cauHinh = { theLucLop: { '12A1': 45 }, maTran: null }
  chuanMock()
})
afterEach(cleanup)

describe('chữ trạng thái', () => {
  it('tắt · bật cho lớp · chạy thử theo em · cả trung tâm', () => {
    expect(chuTrangThaiOmni({ bat: false, lop: [], sbd: [] })).toBe('tắt')
    expect(chuTrangThaiOmni({ bat: true, lop: ['12A1'], sbd: [] })).toBe('bật cho lớp 12A1')
    expect(chuTrangThaiOmni({ bat: true, lop: ['12A1'], sbd: ['1', '2'] })).toBe('bật cho lớp 12A1 · chạy thử 2 em')
    expect(chuTrangThaiOmni({ bat: true, lop: [], sbd: ['1'] })).toBe('chạy thử 1 em')
    expect(chuTrangThaiOmni({ bat: true, lop: [], sbd: [] })).toBe('bật cả trung tâm')
  })
})

describe('thẻ OMNI (theo lớp)', () => {
  it('đọc `co-doc`; "Bật theo lớp" + chọn lớp (tên có dấu cách vẫn đúng) ⇒ `co-luu {co:{bat, lop, sbd}}`', async () => {
    render(<CongTacOmni />)
    expect(await screen.findByRole('heading', { name: 'OMNI (theo lớp)' })).toBeTruthy()
    await waitFor(() => expect(document.querySelector('[data-trang-thai-omni]')?.textContent).toBe('tắt'))
    const nhom = screen.getByRole('radiogroup', { name: 'OMNI (theo lớp)' })
    expect(within(nhom).getByRole('radio', { name: 'Tắt' }).getAttribute('aria-checked')).toBe('true')
    const nut = screen.getByRole('button', { name: 'Lưu và tắt OMNI' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true) // chưa đổi gì
    fireEvent.click(within(nhom).getByRole('radio', { name: 'Bật theo lớp' }))
    expect((screen.getByRole('button', { name: 'Lưu và bật OMNI' }) as HTMLButtonElement).disabled).toBe(true) // chưa chọn lớp
    expect(screen.getByText('Chọn ít nhất một lớp.')).toBeTruthy()
    fireEvent.click(await screen.findByRole('button', { name: '12 - Tinh Hoa · 20 em' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu và bật OMNI' }))
    await waitFor(() => expect(lenh('co-luu')).toEqual([{ action: 'co-luu', co: { bat: true, lop: ['12 - Tinh Hoa'], sbd: [] } }]))
    await waitFor(() => expect(document.querySelector('[data-trang-thai-omni]')?.textContent).toBe('bật cho lớp 12 - Tinh Hoa'))
  })

  it('đang bật theo lớp + chạy thử ⇒ tắt gửi {bat:false}; bật lại GIỮ danh sách SBD chạy thử', async () => {
    co = { bat: true, lop: ['12A1'], sbd: ['12001'] }
    render(<CongTacOmni />)
    await waitFor(() => expect(document.querySelector('[data-trang-thai-omni]')?.textContent).toBe('bật cho lớp 12A1 · chạy thử 1 em'))
    expect((await screen.findByRole('button', { name: '12A1 · 44 em' })).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '12 - Tinh Hoa · 20 em' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu và bật OMNI' }))
    await waitFor(() => expect(lenh('co-luu').at(-1)).toEqual({ action: 'co-luu', co: { bat: true, lop: ['12A1', '12 - Tinh Hoa'], sbd: ['12001'] } }))
    fireEvent.click(screen.getByRole('radio', { name: 'Tắt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Lưu và tắt OMNI' }))
    await waitFor(() => expect(lenh('co-luu').at(-1)).toEqual({ action: 'co-luu', co: { bat: false, lop: [], sbd: [] } }))
  })

  it('máy chủ chưa có lệnh ⇒ hiện đúng lời máy chủ, nút lưu tắt, KHÔNG hiện thẻ cấu hình', async () => {
    goi.mockImplementation(async (duong: string) =>
      duong === '/gv/omni' ? { ok: false, loai: 'chua_co_lenh', chu: 'Máy chủ chưa có lệnh OMNI — cần đẩy bản máy chủ mới.' } : { ok: false, loai: 'chua_co_lenh', chu: 'x' },
    )
    render(<CongTacOmni />)
    expect((await screen.findByRole('alert')).textContent).toBe('Máy chủ chưa có lệnh OMNI — cần đẩy bản máy chủ mới.')
    expect((screen.getByRole('button', { name: 'Lưu và tắt OMNI' }) as HTMLButtonElement).disabled).toBe(true)
    expect(screen.queryByRole('heading', { name: /Số lượt mỗi ngày và ma trận đề thi/ })).toBeNull()
  })
})

describe('thẻ số lượt mỗi ngày theo lớp + ma trận đề thi 2026', () => {
  it('đọc `cau-hinh-doc` vào ô; sửa ⇒ `cau-hinh-luu {theLucLop, maTran}` đúng số; chữ chuẩn "lượt/ngày" (không "thể lực")', async () => {
    const { container } = render(<CongTacOmni />)
    const the = (await screen.findByRole('heading', { name: 'Số lượt mỗi ngày và ma trận đề thi (OMNI)' })).parentElement as HTMLElement
    const o12A1 = (await within(the).findByLabelText(/^12A1/)) as HTMLInputElement
    expect(o12A1.value).toBe('45')
    const oTinhHoa = within(the).getByLabelText(/^12 - Tinh Hoa/) as HTMLInputElement
    expect(oTinhHoa.value).toBe('')
    expect(oTinhHoa.placeholder).toBe('40')
    expect(within(the).getByLabelText(/Phần I · Trắc nghiệm/).getAttribute('placeholder')).toBe('18')
    const nut = within(the).getByRole('button', { name: 'Lưu số lượt và ma trận' }) as HTMLButtonElement
    expect(nut.disabled).toBe(true)
    fireEvent.change(oTinhHoa, { target: { value: '30' } })
    fireEvent.change(within(the).getByLabelText(/Phần I · Trắc nghiệm/), { target: { value: '18' } })
    fireEvent.change(within(the).getByLabelText(/Phần II · Đúng–sai/), { target: { value: '4' } })
    // Thiếu một phần ⇒ báo ngay dưới ô, chưa cho lưu.
    expect(the.textContent).toContain('Nhập đủ ba phần')
    expect(nut.disabled).toBe(true)
    fireEvent.change(within(the).getByLabelText(/Phần III · Trả lời ngắn/), { target: { value: '6' } })
    expect(nut.disabled).toBe(false)
    fireEvent.click(nut)
    await waitFor(() => expect(lenh('cau-hinh-luu')).toEqual([{ action: 'cau-hinh-luu', theLucLop: { '12A1': 45, '12 - Tinh Hoa': 30 }, maTran: { I: 18, II: 4, III: 6 } }]))
    expect(container.textContent).not.toMatch(/thể lực/i)
  })

  it('số lượt sai (0, chữ) ⇒ báo cạnh ô, không cho lưu', async () => {
    render(<CongTacOmni />)
    const the = (await screen.findByRole('heading', { name: 'Số lượt mỗi ngày và ma trận đề thi (OMNI)' })).parentElement as HTMLElement
    fireEvent.change(await within(the).findByLabelText(/^12A1/), { target: { value: '0' } })
    expect(the.textContent).toContain('Số nguyên từ 1 đến 500')
    expect((within(the).getByRole('button', { name: 'Lưu số lượt và ma trận' }) as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('màn Cài đặt đặt thẻ OMNI ngay sau Game Hóa 2.0', () => {
  it('nguồn CaiDatScreen: <CongTacOmni /> đứng sau <CongTacHoa2 /> và trước <CongTacBia />', async () => {
    const { readFileSync } = await import('node:fs')
    const nguon = readFileSync('src/screens/CaiDatScreen.tsx', 'utf8')
    const a = nguon.indexOf('<CongTacHoa2 />')
    const b = nguon.indexOf('<CongTacOmni />')
    const c = nguon.indexOf('<CongTacBia />')
    expect(a).toBeGreaterThan(0)
    expect(b).toBeGreaterThan(a)
    expect(c).toBeGreaterThan(b)
  })
})
