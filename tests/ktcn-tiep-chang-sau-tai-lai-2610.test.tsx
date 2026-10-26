import { afterEach, expect, it, vi } from 'vitest'
import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react'
import ManKiemTra from '../src/components/hoc-tap/ManKiemTraCaNhan'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'
import { readFileSync } from 'node:fs'
import { docKtcnDangLam, ghiKtcnDangLam, khoaKtcnDangLam } from '../src/lib/ktcn-dang-lam'
// 26/10 em 12095 («app lỗi, e load lại thế là mất chặng 1») + em 12092: bấm Làm chặng 1 rồi tải lại ⇒ lớp phủ Kiểm tra (do `tab` giữ trong bộ nhớ) biến mất,
// em về trang chủ, đồng hồ chặng vẫn chạy ở máy chủ, em đi làm bài khác tới hết giờ ⇒ chặng 1 chốt với 0 câu. Nay máy nhớ chặng em mở dở và tự mở lại đúng chặng đó.
vi.mock('../src/lib/tu-sua-loi', () => ({ useSoCauCanSua: () => 5 }))
const api = vi.hoisted(() => vi.fn())
vi.mock('../src/components/hoa2/api', async (importOriginal) => ({ ...await importOriginal(), goiHoa2: api }))
const now = Date.parse('2026-10-26T12:30:00Z')
const kt: TomTatKiemTra = { id: 'kt-S1', ngay: '2026-10-26', moLuc: Date.parse('2026-10-25T17:00:00Z'), hanLuc: Date.parse('2026-10-26T17:00:00Z'), serverNow: now, trangThai: 'can_lam', homNay: true, tong: 2, daTra: 0, con: 2, soChang: 2, phut: 5, soBai: 1, tongKienThuc: 2, phuDe: 2, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
const noop = () => {}
const cauBase = { maDe: 'd', version: 'v1', group: 'g1', hinhAnh: [], dang: null, tenDang: '', mucDo: 'NB', sao: 0, kienThuc: [] }
const cau = [{ ...cauBase, qid: 'q1', phan: 'I', text: 'Câu một', choices: ['Một', 'Hai', 'Ba', 'Bốn'], ideas: [] }]
afterEach(() => { cleanup(); api.mockReset(); localStorage.clear() })

function maychu(daChot0 = false, dangChay = false) {
  api.mockImplementation(async (action: string) => {
    if (action === 'hoc-tap-ktcn-trang-thai') return { ok: true, kiemTra: kt, chang: [{ stt: 0, soCau: 1, giay: 300, han: dangChay || daChot0 ? now + 200000 : null, daChot: daChot0 }, { stt: 1, soCau: 1, giay: 300, han: null, daChot: false }] }
    if (action === 'hoc-tap-ktcn-start') return { ok: true, kiemTra: kt, revision: 0, hanChang: now + 200000, daChot: false, questions: cau, tra: { q1: '' } }
    return { ok: true, kiemTra: kt, revision: 1, daLuu: true, daChot: true, chang: [] }
  })
}
const dung = () => render(<div className="m3"><ManKiemTra token="token" sbd="S1" id="kt-S1" onVe={noop} onCapNhat={noop} /></div>)

it('mở chặng ghi nhớ; tải lại (mount mới) thì tự vào lại đúng chặng, không phải bấm', async () => {
  maychu()
  const a = dung()
  fireEvent.click(await screen.findByRole('button', { name: /Làm chặng 1/ }))
  await screen.findByText('Câu một')
  expect(docKtcnDangLam('S1', 'kt-S1', now)).toMatchObject({ stt: 0 })
  a.unmount(); api.mockClear(); maychu(false, true)
  dung()
  await screen.findByText('Câu một')
  expect(api.mock.calls.filter((c) => c[0] === 'hoc-tap-ktcn-start').map((c) => (c[2] as { chang: number }).chang)).toEqual([0])
})

it('em bấm Về thì tải lại không tự mở chặng nữa', async () => {
  maychu()
  const a = dung()
  fireEvent.click(await screen.findByRole('button', { name: /Làm chặng 1/ }))
  await screen.findByText('Câu một')
  fireEvent.click(screen.getAllByRole('button', { name: /Lưu và về/ })[0]!)
  await waitFor(() => expect(docKtcnDangLam('S1', 'kt-S1', now)).toBeNull())
  a.unmount(); api.mockClear(); maychu(false, true)
  dung()
  await screen.findByRole('button', { name: /Làm tiếp chặng 1/ })
  expect(api.mock.calls.some((c) => c[0] === 'hoc-tap-ktcn-start')).toBe(false)
})

it('chặng đã chốt hoặc ghi nhớ hết hạn / của bài khác thì không tự mở', async () => {
  maychu(true)
  ghiKtcnDangLam('S1', 'kt-S1', 0, now + 200000)
  dung()
  await screen.findByRole('button', { name: /Làm chặng 2/ })
  expect(api.mock.calls.some((c) => c[0] === 'hoc-tap-ktcn-start')).toBe(false)
  ghiKtcnDangLam('S1', 'kt-S1', 0, now - 1)
  expect(docKtcnDangLam('S1', 'kt-S1', now)).toBeNull()
  ghiKtcnDangLam('S1', 'kt-khac', 0, now + 200000)
  expect(docKtcnDangLam('S1', 'kt-S1', now)).toBeNull()
})

it('cổng học sinh đọc đúng khoá ghi nhớ và chỉ tự mở khi em đang rảnh (nộp bài thì máy đã xoá ghi nhớ khi chốt chặng cuối)', () => {
  const nguon = readFileSync('src/screens/StudentPortalScreen.tsx', 'utf8')
  const dong = nguon.split('\n').find((d) => d.includes("localStorage.getItem('ktcn:lam:'"))!
  expect(dong).toBeTruthy()
  expect(khoaKtcnDangLam('S1')).toBe('ktcn:lam:S1')
  for (const dk of ['tab === null', ".includes(ktSanh.id)", "setTab('kiemtra')"]) expect(dong).toContain(dk)
})
