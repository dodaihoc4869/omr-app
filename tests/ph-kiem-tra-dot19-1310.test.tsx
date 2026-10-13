// @vitest-environment jsdom
// Đợt 19 × PR258 (Codex): trang phụ huynh mới (TrangVeCon, thay ManHomNay) phải giữ đúng luồng kiểm tra cá nhân trong
// docs/hop-dong-kiem-tra-ca-nhan-1310.md — "Phụ huynh: ManHomNay -> TheKiemTraCon hiển thị lịch sắp tới và bài kiểm tra đúng N khi đến lịch".
// Khoá: ngày kiểm tra ⇒ thẻ kiểm tra thay khối Hôm nay; ngày khác ⇒ thẻ lịch sắp tới cạnh khối Hôm nay; chờ nguồn ⇒ không thẻ.
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cleanup, render, waitFor } from '@testing-library/react'
import AppPhuHuynh from '../src/components/ph-v3/AppPhuHuynh'
import { hoc2Gia, lichSuGia, loiThayGia, nhipGia, thaiDoGia, tatCaGia, tongQuanGia } from '../scripts/chup-ph-dot19/gia'

vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may.test' }))
vi.mock('../src/lib/tai-thong-tin-ph', () => ({ taiThongTinPhuHuynh: async () => ({ canhBao: [] }) }))

const GIO = Date.parse('2026-10-14T05:00:00Z')
/** Đúng hợp đồng (bộ đọc chặt `docKiemTra`): cửa sổ đúng 24 giờ, con = tong − daTra. */
const kt = (o: Record<string, unknown>) => {
  const x: Record<string, unknown> = {
    id: 'kt1', ngay: '2026-10-14', moLuc: GIO - 3_600_000, serverNow: GIO, trangThai: 'can_lam', homNay: true,
    tong: 18, daTra: 5, soChang: 3, phut: 40, soBai: 3, tongKienThuc: 12, phuDe: 100, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null, ...o,
  }
  return { ...x, hanLuc: Number(x.moLuc) + 86_400_000, con: Number(x.tong) - Number(x.daTra) }
}
let hoc2: Record<string, unknown> = {}

beforeEach(() => {
  hoc2 = hoc2Gia() as Record<string, unknown>
  window.history.replaceState(null, '', '/?vai=phuhuynh')
  vi.stubGlobal('scrollTo', vi.fn())
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  Element.prototype.scrollIntoView = vi.fn()
  const may: Record<string, () => unknown> = {
    '/ph/tat-ca-ve-con': tatCaGia, '/ph/con-tong-quan': tongQuanGia, '/ph/nhip-hoc': nhipGia, '/ph/loi-thay': loiThayGia,
    '/ph/hoc-2': () => hoc2, '/ph/ho-so-thai-do': thaiDoGia, '/ph/lich-su-lam-cau': lichSuGia,
  }
  vi.stubGlobal('fetch', vi.fn((url: string) => {
    const body = may[String(url).replace('https://may.test', '')]?.() ?? { ok: true }
    return Promise.resolve({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) })
  }))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals(); localStorage.clear(); window.history.replaceState(null, '', '/') })

const mo = () => render(<div className="m3"><AppPhuHuynh sbd="12121212" hoTen="Nguyễn Minh Khôi" lop="12A1" onDoiSbd={() => {}} /></div>).container

it('ngày kiểm tra: thẻ kiểm tra thay khối Hôm nay (đúng số câu đã trả lời / tổng)', async () => {
  hoc2 = { ...hoc2, kiemTraCaNhan: kt({}) }
  const c = mo()
  const the = await waitFor(() => { const x = c.querySelector('#ph3-kiemtra'); expect(x).toBeTruthy(); return x!.closest('section')! })
  expect(the.classList.contains('tvc-the')).toBe(true)
  expect(the.classList.contains('ph3-ah')).toBe(false)
  expect(the.textContent).toContain('Hôm nay con làm bài kiểm tra')
  expect(the.textContent).toContain('5/18 câu đã trả lời')
  expect(c.querySelector('[data-vung="anh-hung"]')).toBeNull()
})

it('ngày khác: lịch kiểm tra sắp tới hiện cạnh khối Hôm nay', async () => {
  hoc2 = { ...hoc2, kiemTraCaNhan: kt({ homNay: false, trangThai: 'sap_den', ngay: '2026-10-16', moLuc: GIO + 2 * 86_400_000, daTra: 0 }) }
  const c = mo()
  await waitFor(() => expect(c.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
  const the = await waitFor(() => { const x = c.querySelector('#ph3-kiemtra'); expect(x).toBeTruthy(); return x!.closest('section')! })
  expect(the.textContent).toContain('Lịch kiểm tra sắp tới của con')
})

it('chờ nguồn: không hiện thẻ kiểm tra', async () => {
  hoc2 = { ...hoc2, kiemTraCaNhan: kt({ homNay: false, trangThai: 'cho_nguon' }) }
  const c = mo()
  await waitFor(() => expect(c.querySelector('[data-vung="anh-hung"]')).toBeTruthy())
  expect(c.querySelector('#ph3-kiemtra')).toBeNull()
})
