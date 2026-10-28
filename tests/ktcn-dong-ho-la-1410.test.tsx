// Đồng hồ chạy thật trong React; đo cây câu hỏi, giữ hạn máy chủ và hàng lưu khi tự chốt.
import { Profiler } from 'react'
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
const doLuong = vi.hoisted(() => ({ goi: vi.fn(), cau: vi.fn() }))
vi.mock('../src/components/hoa2/api', async goc => ({ ...await goc<typeof import('../src/components/hoa2/api')>(), goiHoa2: doLuong.goi }))
vi.mock('../src/components/TheCau', async goc => {
  const { default: TheCau } = await goc<typeof import('../src/components/TheCau')>()
  return { default: (p: Parameters<typeof TheCau>[0]) => <Profiler id="cau-kiem-tra" onRender={doLuong.cau}><TheCau {...p} /></Profiler> }
})
const now = Date.parse('2026-10-17T02:00:00Z')
const offset = 120_000
const kt = { id: 'kt1', ngay: '2026-10-17', moLuc: Date.parse('2026-10-16T17:00:00Z'), hanLuc: Date.parse('2026-10-17T17:00:00Z'), serverNow: now + offset, trangThai: 'can_lam', homNay: true, tong: 1, daTra: 0, con: 1, soChang: 1, phut: 10, soBai: 1, tongKienThuc: 1, phuDe: 1, nguonDayDu: true, lyDo: 'Kiểm tra kiến thức', thieuNguon: 0, diem: null, nopLuc: null }
const cau = { qid: 'q1', maDe: 'd', version: 'v1', group: 'g1', phan: 'I', text: 'Điện tích của ion $SO_4^{2-}$?', choices: ['$-2$', '$+2$', '$-1$', '$+1$'], ideas: [], hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] }
const tomTat = () => ({ ...kt, serverNow: Date.now() + offset })
const noop = () => {}
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); localStorage.clear() })
afterEach(() => { cleanup(); vi.useRealTimers(); doLuong.goi.mockReset(); doLuong.cau.mockClear(); localStorage.clear() })
async function mo(giay: number) {
  const han = now + offset + giay * 1000
  doLuong.goi.mockImplementation(async action => action === 'hoc-tap-ktcn-trang-thai'
    ? { ok: true, kiemTra: tomTat(), chang: [{ stt: 0, soCau: 1, giay, han: null, daChot: false }] }
    : { ok: true, kiemTra: tomTat(), revision: 0, hanChang: han, daChot: false, questions: [cau], tra: { q1: '' } })
  await act(async () => { render(<ManKiemTra token="token" sbd="S1" id="kt1" onVe={noop} onCapNhat={noop} />) })
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Làm chặng 1' })) })
}
it('5 nhịp giờ đổi chữ và vòng đồng hồ nhưng không dựng lại cây câu hoặc gọi máy chủ', async () => {
  await mo(600)
  const banDau = doLuong.cau.mock.calls.length
  expect(screen.getByLabelText('Thời gian chặng còn lại').textContent).toBe('10:00')
  for (let i = 0; i < 5; i++) await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(screen.getByLabelText('Thời gian chặng còn lại').textContent).toBe('9:55')
  expect(doLuong.goi).toHaveBeenCalledTimes(2)
  expect(doLuong.cau.mock.calls.length - banDau).toBe(0)
})
it('hết giờ đã hiệu chỉnh máy chủ chốt một lần, sau lượt lưu đang chờ và với đáp án mới nhất', async () => {
  await mo(3)
  let traLuu!: (v: unknown) => void
  doLuong.goi.mockImplementation((action, _token, payload) => {
    if (action === 'hoc-tap-ktcn-luu') return new Promise(resolve => { traLuu = resolve })
    if (action === 'hoc-tap-ktcn-chot-chang') return Promise.resolve({ ok: true, kiemTra: tomTat(), revision: payload.revision + 1, daLuu: true })
    return Promise.resolve({ ok: true, kiemTra: tomTat(), chang: [{ stt: 0, soCau: 1, giay: 3, han: now + offset + 3000, daChot: true }] })
  })
  fireEvent.click(screen.getByText('A.').closest('.pa-hang')!)
  await act(async () => { await vi.advanceTimersByTimeAsync(400) })
  expect(doLuong.goi.mock.calls.at(-1)?.[0]).toBe('hoc-tap-ktcn-luu')
  await act(async () => { await vi.advanceTimersByTimeAsync(2600) })
  expect(screen.getByLabelText('Thời gian chặng còn lại').textContent).toBe('0:00')
  expect(doLuong.goi.mock.calls.filter(c => c[0] === 'hoc-tap-ktcn-chot-chang')).toHaveLength(0)
  await act(async () => { traLuu({ ok: true, kiemTra: tomTat(), revision: 1, daLuu: true }) })
  expect(doLuong.goi.mock.calls.filter(c => c[0] === 'hoc-tap-ktcn-chot-chang')).toEqual([['hoc-tap-ktcn-chot-chang', 'token', { id: 'kt1', chang: 0, tra: { q1: 'A' }, revision: 1, lucTra: { q1: expect.any(Number) } }]]) // 28/10: kèm mốc em trả lời
  await act(async () => { await vi.advanceTimersByTimeAsync(5000) })
  expect(doLuong.goi.mock.calls.filter(c => c[0] === 'hoc-tap-ktcn-chot-chang')).toHaveLength(1)
})
it('qua mốc còn một phút chỉ đổi màu đồng hồ, không dựng lại câu hỏi', async () => {
  await mo(61)
  const banDau = doLuong.cau.mock.calls.length
  const dongHo = screen.getByLabelText('Thời gian chặng còn lại')
  expect(dongHo.closest('.ktcn-dh')?.hasAttribute('data-gap')).toBe(false)
  for (let i = 0; i < 2; i++) await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
  expect(dongHo.textContent).toBe('0:59')
  expect(dongHo.closest('.ktcn-dh')?.hasAttribute('data-gap')).toBe(true)
  expect(doLuong.cau.mock.calls.length - banDau).toBe(0)
})
