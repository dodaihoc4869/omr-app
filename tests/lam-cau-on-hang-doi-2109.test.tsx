// LamCauOn × HÀNG ĐỢI NỘP LẠI TỰ ĐỘNG (Boss 21/09): máy chủ bận lúc nộp ôn câu ⇒ bài xếp hàng ở cổng, màn hiện "Đã lưu ở máy, đang chờ máy chủ" (không lỗi đỏ, không
// bắt bấm lại); hàng đợi nộp xong ⇒ màn vẽ kết quả qua sự kiện; máy chủ từ chối hẳn ⇒ hiện lỗi và mở khoá. Không có `xepHang` (host khác) ⇒ như cũ.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LamCauOn from '../src/components/bang-nhiem-vu/LamCauOn'
import { nopOnLai } from '../src/components/bang-nhiem-vu/cau-on-api'
import { CHU_DA_LUU_MAY, SU_KIEN_HANG_DOI_XONG, khoaOnCau } from '../src/lib/hang-doi-nop'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))

const CAU = [
  { qid: 'on1', phan: 'I', text: 'Este X có tên gọi là gì?', choices: ['etyl axetat', 'metyl propionat', 'propyl fomat', 'isopropyl fomat'], ideas: [], hinhAnh: [] },
  { qid: 'on4', phan: 'I', text: 'Chất nào là chất béo?', choices: ['Glixerol', 'Etyl axetat', 'Tristearin', 'Axit oleic'], ideas: [], hinhAnh: [] },
]
const KQ1 = { qid: 'on1', dung: true, dapAnDung: 'A', loiGiai: { chot: 'Gốc ancol là etyl nên este là etyl axetat.' }, anhLoiGiai: [] }

let cheDo: 'nem' | '503' | '500json' | 'tu_choi' | 'ok'
let soLanNop: number
beforeEach(() => {
  cheDo = 'nem'
  soLanNop = 0
  localStorage.clear()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string) => {
      const u = new URL(String(url)).pathname
      if (u === '/hs/cau-theo-qid') return { ok: true, status: 200, json: async () => ({ ok: true, cau: CAU, khongCo: [] }) }
      if (u === '/hs/on-lai/nop') {
        soLanNop++
        if (cheDo === 'nem') throw new Error('mạng rớt')
        if (cheDo === '503') return { ok: false, status: 503, json: async () => { throw new Error('không phải json') } }
        if (cheDo === '500json') return { ok: false, status: 500, json: async () => ({ ok: false, error: 'D1_ERROR: overloaded' }) }
        if (cheDo === 'tu_choi') return { ok: true, status: 200, json: async () => ({ ok: false, error: 'Chưa đăng nhập.' }) }
        return { ok: true, status: 200, json: async () => ({ ok: true, ketQua: [KQ1], khongCo: [], chuaLam: [], tienBo: null, exp: 0 }) }
      }
      return { ok: true, status: 200, json: async () => ({}) }
    }),
  )
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const dung = (extra: Partial<React.ComponentProps<typeof LamCauOn>> = {}) => {
  const xepHang = vi.fn()
  const r = render(<LamCauOn token="tok-hs" sbd="12121212" viecId="on_lai:2026-09-21" qid={['on1', 'on4']} tieuDe="Ôn 2 câu" onXong={() => {}} xepHang={xepHang} {...extra} />)
  return { xepHang, ...r }
}
const the = (i: number) => document.querySelectorAll<HTMLElement>('.lco-the')[i]!
const nutNop = () => screen.getByRole('button', { name: /^(Nộp|Đã lưu ở máy)/ }) as HTMLButtonElement
const lamVaNop = async () => {
  await screen.findByText('Este X có tên gọi là gì?')
  fireEvent.click(within(the(0)).getAllByRole('radio')[0]!)
  await act(async () => { fireEvent.click(nutNop()) })
}

describe('nopOnLai: cờ ban', () => {
  it('rớt mạng / hết giờ / 5xx (không đọc được hoặc lỗi chung) ⇒ ban:true; bị từ chối nghiệp vụ (HTTP 200, ok:false) ⇒ KHÔNG ban', async () => {
    cheDo = 'nem'
    expect(await nopOnLai('t', [{ qid: 'a', dapAn: 'A' }])).toMatchObject({ ok: false, ban: true })
    cheDo = '503'
    expect(await nopOnLai('t', [{ qid: 'a', dapAn: 'A' }])).toMatchObject({ ok: false, ban: true })
    cheDo = '500json'
    expect(await nopOnLai('t', [{ qid: 'a', dapAn: 'A' }])).toMatchObject({ ok: false, ban: true })
    cheDo = 'tu_choi'
    const r = await nopOnLai('t', [{ qid: 'a', dapAn: 'A' }])
    expect(r.ok).toBe(false)
    expect(r.ban).toBeUndefined()
  })
})

describe('màn ôn câu', () => {
  it('máy chủ bận ⇒ xếp hàng đúng khoá + gói (không có token), hiện lời trung tính, nút khoá "Đã lưu ở máy · đang chờ máy chủ", KHÔNG lỗi đỏ', async () => {
    const { xepHang } = dung()
    await lamVaNop()
    expect(soLanNop).toBe(1)
    expect(xepHang).toHaveBeenCalledTimes(1)
    const m = xepHang.mock.calls[0]![0] as { id: string; goi: { traLoi: unknown[]; duong: string } }
    expect(m.id).toBe(khoaOnCau('12121212', '/hs/on-lai/nop', ['on1']))
    expect(m.goi).toEqual({ traLoi: [{ qid: 'on1', dapAn: 'A' }], duong: '/hs/on-lai/nop' })
    expect(JSON.stringify(m)).not.toContain('tok-hs')
    expect(screen.getByRole('status').textContent).toBe(CHU_DA_LUU_MAY)
    expect(document.querySelector('.lco-loi-nop')).toBeNull()
    expect(nutNop().disabled).toBe(true)
    expect(nutNop().textContent).toBe('Đã lưu ở máy · đang chờ máy chủ')
    await act(async () => { fireEvent.click(nutNop()) })
    expect(soLanNop).toBe(1) // bấm thêm KHÔNG gửi lần hai
  })

  it('hàng đợi nộp xong (sự kiện) ⇒ vẽ kết quả, gỡ lời chờ, mở lại nút; sự kiện của việc KHÁC bị bỏ qua', async () => {
    const { xepHang } = dung()
    await lamVaNop()
    const id = (xepHang.mock.calls[0]![0] as { id: string }).id
    act(() => { window.dispatchEvent(new CustomEvent(SU_KIEN_HANG_DOI_XONG, { detail: { id: 'viec-khac', phanHoi: { ok: true, ketQua: [KQ1], khongCo: [], chuaLam: [], tienBo: null, exp: 0 } } })) })
    expect(screen.queryByRole('status')).not.toBeNull() // vẫn chờ
    act(() => { window.dispatchEvent(new CustomEvent(SU_KIEN_HANG_DOI_XONG, { detail: { id, phanHoi: { ok: true, ketQua: [KQ1], khongCo: [], chuaLam: [], tienBo: null, exp: 0 } } })) })
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(document.body.textContent).toMatch(/Đã chấm 1 câu/)
  })

  it('hàng đợi báo máy chủ TỪ CHỐI hẳn ⇒ hiện lỗi đỏ, mở khoá để em nộp lại bằng tay', async () => {
    const { xepHang } = dung()
    await lamVaNop()
    const id = (xepHang.mock.calls[0]![0] as { id: string }).id
    act(() => { window.dispatchEvent(new CustomEvent(SU_KIEN_HANG_DOI_XONG, { detail: { id, phanHoi: { ok: false, error: 'Bài đã quá hạn.' } } })) })
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
    expect(screen.getByRole('alert').textContent).toBe('Bài đã quá hạn.')
    expect(nutNop().disabled).toBe(false)
  })

  it('bị từ chối nghiệp vụ (không ban) ⇒ KHÔNG xếp hàng, hiện lỗi như cũ; không có xepHang (host khác) ⇒ như cũ dù máy chủ bận', async () => {
    cheDo = 'tu_choi'
    const a = dung()
    await lamVaNop()
    expect(a.xepHang).not.toHaveBeenCalled()
    expect(screen.getByRole('alert').textContent).toBe('Chưa đăng nhập.')
    cleanup()
    cheDo = 'nem'
    dung({ xepHang: undefined })
    await lamVaNop()
    expect(screen.getByRole('alert').textContent).toMatch(/Chưa gửi được lên máy chủ/)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
