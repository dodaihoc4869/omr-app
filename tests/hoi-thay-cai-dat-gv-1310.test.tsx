// CÀI ĐẶT · HỎI THẦY (AI) (thầy 13/10 "nút reset lượt hỏi thầy" ⇒ "chốt build"): trần lượt đọc từ máy chủ; gõ SBD ⇒ xem số câu đã hỏi hôm nay
// ⇒ đặt lại; SBD thử thêm/bớt; lỗi máy chủ hiện cạnh ô; mọi lệnh đi kèm mã bí mật của thầy (header x-ma-bi-mat).
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may-thu' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'ma-thu' }))
import CongTacHoiThay from '../src/components/chien-dich/CongTacHoiThay'

type J = Record<string, unknown>
const goi: { url: string; body: J; ma: string }[] = []
let traLoi: (url: string, body: J) => J
beforeEach(() => {
  goi.length = 0
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input), body = JSON.parse(String(init?.body ?? '{}')) as J
    goi.push({ url, body, ma: String((init?.headers as Record<string, string>)['x-ma-bi-mat']) })
    return new Response(JSON.stringify(traLoi(url, body)), { headers: { 'content-type': 'application/json' } })
  })
})
afterEach(() => { cleanup(); vi.restoreAllMocks() })

describe('khối Hỏi Thầy (AI) ở Cài đặt', () => {
  it('hiện trần lượt; xem lượt một em ⇒ đặt lại; SBD thử thêm/bớt; mọi lệnh có mã bí mật', async () => {
    let homNay = 7
    let thu: string[] = []
    traLoi = (url, b) => {
      if (url.endsWith('/gv/hoi-tro-ly/luot')) return { ok: true, tranNgay: 12, tranCau: 6, sbdThu: thu, ...(b.sbd ? { sbd: b.sbd, homNay, laSbdThu: thu.includes(String(b.sbd)) } : {}) }
      if (url.endsWith('/gv/hoi-tro-ly/dat-lai')) { homNay = 0; return { ok: true, daDatLai: 7, homNay: 0 } }
      if (url.endsWith('/gv/hoi-tro-ly/sbd-thu')) { thu = b.them ? [...thu, String(b.sbd)] : thu.filter((x) => x !== b.sbd); return { ok: true, sbdThu: thu } }
      return { ok: false }
    }
    const { container } = render(<CongTacHoiThay />)
    await waitFor(() => expect(container.querySelector('[data-tran-hoi-thay]')!.textContent).toContain('tối đa 12 câu/ngày, mỗi câu bài tập tối đa 6 lần/ngày'))
    fireEvent.change(screen.getByLabelText('Số báo danh'), { target: { value: ' 12121212 ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xem lượt' }))
    await waitFor(() => expect(container.querySelector('[data-luot-em]')!.textContent).toBe('SBD 12121212: đã hỏi 7/12 câu hôm nay.'))
    fireEvent.click(screen.getByRole('button', { name: 'Đặt lại lượt hỏi hôm nay' }))
    await waitFor(() => expect(container.querySelector('[data-luot-em]')!.textContent).toBe('SBD 12121212: đã hỏi 0/12 câu hôm nay.'))
    expect(goi.find((g) => g.url.endsWith('/dat-lai'))!.body).toEqual({ sbd: '12121212' })
    expect((screen.getByRole('button', { name: 'Đặt lại lượt hỏi hôm nay' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(screen.getByLabelText('Thêm SBD thử'), { target: { value: '12121212' } })
    fireEvent.click(screen.getByRole('button', { name: 'Thêm' }))
    const chip = await screen.findByRole('button', { name: 'Bỏ SBD thử 12121212' })
    expect(goi.find((g) => g.url.endsWith('/sbd-thu'))!.body).toEqual({ sbd: '12121212', them: true })
    fireEvent.click(chip)
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Bỏ SBD thử 12121212' })).toBeNull())
    expect(goi.every((g) => g.ma === 'ma-thu' && g.url.startsWith('https://may-thu/gv/hoi-tro-ly/'))).toBe(true)
  })

  it('SBD sai ⇒ báo ngay cạnh ô, không gọi máy chủ; máy chủ từ chối ⇒ hiện đúng lời máy chủ', async () => {
    traLoi = (url, b) => (url.endsWith('/luot') && !b.sbd ? { ok: true, tranNgay: 12, tranCau: 6, sbdThu: [] } : { ok: false, error: 'Sai mã bí mật' })
    render(<CongTacHoiThay />)
    await waitFor(() => expect(goi).toHaveLength(1))
    fireEvent.change(screen.getByLabelText('Số báo danh'), { target: { value: "x' or 1" } })
    fireEvent.click(screen.getByRole('button', { name: 'Xem lượt' }))
    expect((await screen.findByRole('alert')).textContent).toBe('Số báo danh không hợp lệ.')
    expect(goi).toHaveLength(1)
    fireEvent.change(screen.getByLabelText('Số báo danh'), { target: { value: '12121212' } })
    fireEvent.click(screen.getByRole('button', { name: 'Xem lượt' }))
    await waitFor(() => expect(screen.getByRole('alert').textContent).toBe('Sai mã bí mật'))
  })
})
