// Thầy 28/10: «Tự động khôi phục bản nháp trên máy đi nhé». Máy chủ bận (503) / mất mạng ⇒ không hộp lỗi tiếng Anh, bài giữ trên máy, tự gửi lại lùi dần,
// gửi ngay khi có mạng lại; mở lại chặng tự nạp nháp vào đúng câu rồi tự gửi; gửi lại không ghi đôi (cùng bản vá).
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
import { LoiHoa2 } from '../src/components/hoa2/api'
import { CHU_MAY_CHU_BAN_EM } from '../src/lib/loi-may-chu'
const api = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', async goc => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: api }))
const now = Date.parse('2026-10-28T02:00:00Z')
const kt = { id: 'kt1', ngay: '2026-10-28', moLuc: Date.parse('2026-10-27T17:00:00Z'), hanLuc: Date.parse('2026-10-28T17:00:00Z'), trangThai: 'can_lam', homNay: true, tong: 2, daTra: 0, con: 2, soChang: 1, phut: 10, soBai: 1, tongKienThuc: 2, phuDe: 2, nguonDayDu: true, lyDo: 'Kiểm tra kiến thức', thieuNguon: 0, diem: null, nopLuc: null }
const cau = (qid: string, text: string) => ({ qid, maDe: 'd', version: 'v1', group: 'g1', phan: 'I', text, choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] })
const noop = () => {}
const han = now + 600_000
const soLuu = () => api.mock.calls.filter(c => c[0] === 'hoc-tap-ktcn-luu')
const tomTat = () => ({ ...kt, serverNow: Date.now() })
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); localStorage.clear() })
afterEach(() => { cleanup(); vi.useRealTimers(); api.mockReset(); localStorage.clear() })
async function mo(luu: (p: Record<string, unknown>) => Promise<unknown>, traMayChu: Record<string, string> = { q1: '', q2: '' }) {
  api.mockImplementation((action, _t, p) => {
    if (action === 'hoc-tap-ktcn-luu') return luu(p)
    if (action === 'hoc-tap-ktcn-trang-thai') return Promise.resolve({ ok: true, kiemTra: tomTat(), chang: [{ stt: 0, soCau: 2, giay: 600, han, daChot: false }] })
    return Promise.resolve({ ok: true, kiemTra: tomTat(), revision: 3, hanChang: han, daChot: false, questions: [cau('q1', 'Câu một'), cau('q2', 'Câu hai')], tra: traMayChu })
  })
  render(<ManKiemTra token="t" sbd="S1" id="kt1" onVe={noop} onCapNhat={noop} />)
  await act(async () => {})
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: /Làm tiếp chặng 1/ })) })
}
const tick = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }
const ok = () => Promise.resolve({ ok: true, kiemTra: tomTat(), revision: 4, daLuu: true, daChot: false })

it('máy chủ bận 2 lần: câu nhẹ, không hộp lỗi, tự gửi lại sau 1 rồi 2 giây; xong ⇒ «Đã lưu», nháp trên máy được dọn', async () => {
  let n = 0
  await mo(() => (n++ < 2 ? Promise.reject(new LoiHoa2(CHU_MAY_CHU_BAN_EM, 'MAY_CHU_BAN')) : ok()))
  fireEvent.click(screen.getByText('B.').closest('.pa-hang')!)
  await tick(400)
  expect(soLuu()).toHaveLength(1)
  expect(screen.queryByRole('alert')).toBeNull()
  expect(screen.getByText(CHU_MAY_CHU_BAN_EM)).toBeTruthy()
  expect(screen.getByText('Đang lưu…')).toBeTruthy()
  expect(JSON.parse(localStorage.getItem('ktcn:nhap:S1:kt1:0')!).tra).toMatchObject({ q1: 'B' })
  await tick(999); expect(soLuu()).toHaveLength(1)
  await tick(1); expect(soLuu()).toHaveLength(2)
  await tick(2000); expect(soLuu()).toHaveLength(3)
  // Cùng một bản vá mỗi lượt (máy chủ vá json_patch, gửi lại không ghi đôi) + mốc em trả lời.
  for (const c of soLuu()) expect(c[2]).toMatchObject({ id: 'kt1', chang: 0, tra: { q1: 'B', q2: '' }, lucTra: { q1: now } })
  expect(screen.queryByText(CHU_MAY_CHU_BAN_EM)).toBeNull()
  expect(screen.getByText('Đã lưu')).toBeTruthy()
  expect(localStorage.getItem('ktcn:nhap:S1:kt1:0')).toBeNull()
  await tick(60_000); expect(soLuu()).toHaveLength(3)
  expect(document.body.textContent).not.toMatch(/D1_|ERROR|export/)
})

it('mất mạng: có mạng lại (online) ⇒ gửi ngay, không đợi hẹn lùi', async () => {
  let n = 0
  await mo(() => (n++ < 1 ? Promise.reject(new LoiHoa2('Chưa kết nối được máy chủ.', 'mat_mang')) : ok()))
  fireEvent.click(screen.getByText('C.').closest('.pa-hang')!)
  await tick(400)
  expect(soLuu()).toHaveLength(1)
  await act(async () => { window.dispatchEvent(new Event('online')) })
  await tick(0)
  expect(soLuu()).toHaveLength(2)
  expect(screen.getByText('Đã lưu')).toBeTruthy()
  await tick(5_000); expect(soLuu()).toHaveLength(2)
})

it('mở lại chặng: tự nạp nháp trên máy vào đúng câu đang làm rồi tự gửi, không nút Khôi phục', async () => {
  localStorage.setItem('ktcn:nhap:S1:kt1:0', JSON.stringify({ han, tra: { q1: 'B', q2: 'D' }, luc: { q1: now - 5000, q2: now - 1000 }, viTri: 1 }))
  await mo(ok)
  await tick(0)
  expect(screen.queryByRole('button', { name: 'Khôi phục bản nháp trên máy' })).toBeNull()
  expect(screen.getByText('Câu hai')).toBeTruthy()
  expect(soLuu()).toHaveLength(1)
  expect(soLuu()[0][2]).toMatchObject({ tra: { q1: 'B', q2: 'D' }, revision: 3, lucTra: { q1: now - 5000, q2: now - 1000 } })
})

it('chặng đã chốt khi máy chủ bận: mở lại gửi phần trả lời TRƯỚC hạn (mốc ≤ hạn), bỏ phần sau hạn', async () => {
  const hanCu = now - 60_000
  localStorage.setItem('ktcn:nhap:S1:kt1:0', JSON.stringify({ han: hanCu, tra: { q1: 'B', q2: 'D' }, luc: { q1: hanCu - 1000, q2: hanCu + 1000 } }))
  api.mockImplementation((action, _t, p) => {
    if (action === 'hoc-tap-ktcn-luu') return ok()
    return Promise.resolve({ ok: true, kiemTra: tomTat(), chang: [{ stt: 0, soCau: 2, giay: 600, han: hanCu, daChot: true }], ...(p ? {} : {}) })
  })
  render(<ManKiemTra token="t" sbd="S1" id="kt1" onVe={noop} onCapNhat={noop} />)
  await tick(0); await tick(0)
  expect(soLuu()).toHaveLength(1)
  expect(soLuu()[0][2]).toMatchObject({ chang: 0, tra: { q1: 'B' }, lucTra: { q1: hanCu - 1000 } })
  expect(soLuu()[0][2].tra).not.toHaveProperty('q2')
  expect(localStorage.getItem('ktcn:nhap:S1:kt1:0')).toBeNull()
})
