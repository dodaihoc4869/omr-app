// "EM ĐÃ LÀM CÂU NÀY CHƯA" — ĐẦU-CUỐI QUA MÀN GIÁO VIÊN THẬT (thầy lệnh 21/09 16:4x; Code 1). Máy chủ giả trả lịch sử; màn (React thật) gọi lệnh MỘT lần cho mọi cặp (em, câu) của bảng,
// hiện nhãn ở bảng buổi chữa TRƯỚC khi chiếu và nhúng cùng nhãn vào thẻ tên của tờ chiếu. Không gọi được lệnh (null) ⇒ không nhãn ở cả hai nơi.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'
import { khoaEmCau, type LichSuCauEm } from '../src/lib/lich-su-cau-len-bang'

const m = vi.hoisted(() => ({ ghi: vi.fn(), hoSo: vi.fn(), mau: [] as unknown[], lichSu: vi.fn() }))

const ca = (maCa: string): CaTomTat =>
  ({ maCa, tenCa: `Ca ${maCa}`, lop: '12', daVao: 10, daNop: 10, lenBang: false, trangThai: 'dong', batDau: '2026-09-09T00:00:00.000Z', hetHanVao: '2026-09-09T01:00:00.000Z' }) as unknown as CaTomTat

const DE: TeacherExamSource = {
  maDe: 'CA',
  phanI: Array.from({ length: 6 }, (_, i) => ({
    id: `CA-I-${i + 1}`,
    text: `TN ${i + 1}`,
    choices: ['a', 'b', 'c', 'd'],
    correct: 'A',
    chuyenDe: i % 2 ? 'Ester' : 'Lipid',
    mucDo: 'hieu',
    canChua: { sao: 2, dk: [], ly_do: '', bay: null },
  })),
  phanII: [],
  phanIII: [],
} as unknown as TeacherExamSource

const LUOT = Array.from({ length: 10 }, (_, i) => ({
  sbd: `120${String(i).padStart(2, '0')}`,
  hoTen: `Em ${i + 1}`,
  lanThu: 1,
  trangThai: 'da_nop',
  dapAn: { phanI: Object.fromEntries(DE.phanI.map((q, j) => [q.id, j <= i % 4 ? 'B' : 'A'])), phanII: {}, phanIII: {} },
  giayCau: Object.fromEntries(DE.phanI.map((q, j) => [q.id, 20 + j * 5 + i])),
}))

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachCa: async () => [ca('111111')],
  chiTietCa: async () => ({ ca: { maCa: '111111', tenCa: 'Ca 111111', lop: '12' }, keyBank: { phanI: DE.phanI, phanII: [], phanIII: [] }, luot: LUOT }),
  hoSoEm: async ({ sbd }: { sbd: string }) => ({ em: { sbd, hoTen: `Em ${sbd}` }, chuyenDe: [{ ten: 'Ester', soCau: 4, soSai: 2 }] }),
  lichSuLenBang: async () => ({ soNgay: 30, theoEm: {} }),
  thanThuLopDocApi: async () => null,
  ghiLenBang: (...a: unknown[]) => m.ghi(...a),
  goiHoSoLopLenBang: (...a: unknown[]) => m.hoSo(...a),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => [DE],
  loadSessionTeacherBank: async () => undefined,
  docKhoChuaCa: async () => [DE],
  docKhoDoKho: async () => undefined,
  luuKhoDoKho: async () => {},
  docMauGiayThuc: async () => m.mau,
  themMauGiayThuc: async (x: unknown) => (m.mau.push(x), m.mau),
}))
vi.mock('../src/lib/may-chu-moi', async (goc) => ({ ...(await goc<Record<string, unknown>>()), layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://x' }) }))
vi.mock('../src/lib/lich-su-cau-len-bang-lenh', () => ({ layLichSuCau: (...a: unknown[]) => m.lichSu(...a) }))
const toast = vi.fn()
vi.mock('../src/store/appStore', () => ({ useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: toast }) }))

const { default: GoiLenBangScreen } = await import('../src/screens/GoiLenBangScreen')

const CHO = { timeout: 20000 }
const emRong = { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } }

/** Máy chủ giả: xoay vòng bốn trạng thái theo vị trí cặp — 0 chưa làm · 1 đúng · 2 sai (3 lần, có lên bảng) · 3 chưa có kết quả. */
function traLichSu(cap: { sbd: string; qid: string }[]): Map<string, LichSuCauEm> {
  const kq = new Map<string, LichSuCauEm>()
  cap.forEach((c, i) => {
    const k = i % 4
    const goc = { sbd: c.sbd, qid: c.qid }
    const x: LichSuCauEm =
      k === 0 ? { ...goc, daLam: false, soLan: 0, soDung: 0, soSai: 0, lanCuoi: null, lenBang: null }
      : k === 1 ? { ...goc, daLam: true, soLan: 1, soDung: 1, soSai: 0, lanCuoi: { dung: true, ngay: '2026-09-19', nguon: 'on_lai' }, lenBang: null }
      : k === 2 ? { ...goc, daLam: true, soLan: 3, soDung: 1, soSai: 2, lanCuoi: { dung: false, ngay: '2026-09-19', nguon: 'thi' }, lenBang: { soLan: 1, datLanCuoi: true } }
      : { ...goc, daLam: true, soLan: 1, soDung: 0, soSai: 0, lanCuoi: { dung: null, ngay: '2026-09-21', nguon: 'btvn' }, lenBang: null }
    kq.set(khoaEmCau(c.sbd, c.qid), x)
  })
  return kq
}

beforeEach(() => {
  cleanup()
  m.ghi.mockReset()
  m.hoSo.mockReset()
  m.hoSo.mockImplementation(async () => ({ em: Object.fromEntries(LUOT.map((l) => [l.sbd, emRong])) }))
  m.mau.length = 0
  m.lichSu.mockReset()
  m.lichSu.mockImplementation(async (cap: { sbd: string; qid: string }[]) => traLichSu(cap))
  toast.mockReset()
})

async function moBuoiChua() {
  const r = render(<GoiLenBangScreen />)
  await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
  fireEvent.click(r.getByText('Ca 111111'))
  await waitFor(() => expect([...r.container.querySelectorAll('button')].some((b) => (b.textContent ?? '').includes('Xếp giờ'))).toBe(true), CHO)
  fireEvent.click([...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ')) as HTMLButtonElement)
  await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
  return r
}
const nhanTrenBang = (r: ReturnType<typeof render>) => [...r.container.querySelectorAll('[data-dong-buoi] [data-lich-su-cau]')].map((e) => e.getAttribute('data-lich-su-cau'))

describe('bảng buổi chữa + tờ chiếu: "em đã làm câu này chưa"', () => {
  it('gọi lệnh cho mọi cặp (em, câu) của bảng, mã câu theo quy ước máy chủ, mỗi lần ≤ 200 cặp; nhãn hiện ở bảng buổi chữa TRƯỚC khi chiếu', async () => {
    const r = await moBuoiChua()
    await waitFor(() => expect(nhanTrenBang(r).length).toBeGreaterThan(0), CHO)
    const cap = m.lichSu.mock.calls.flatMap((c) => c[0] as { sbd: string; qid: string }[])
    expect(cap.length).toBeGreaterThan(0)
    expect(cap.every((c) => /^CA-I-\d$/.test(c.qid) && /^120\d\d$/.test(c.sbd))).toBe(true)
    expect(m.lichSu.mock.calls.every((c) => (c[0] as unknown[]).length <= 200)).toBe(true)
    const kieu = nhanTrenBang(r)
    expect(kieu.every((k) => ['chua_lam', 'dung', 'sai', 'chua_ket_qua'].includes(k!))).toBe(true)
    const chu = [...r.container.querySelectorAll('[data-dong-buoi] [data-lich-su-cau]')].map((e) => e.textContent ?? '')
    expect(chu.some((c) => c.includes('Đã làm · lần gần nhất sai') && c.includes('3 lần: 1 đúng, 2 sai · gần nhất 19/09') && c.includes('Đã lên bảng câu này 1 lần · đạt'))).toBe(true)
  }, 60000)

  it('bấm "Chiếu lên bảng ngay": tờ có nhãn TRONG thẻ tên (`.mc-em .mc-ls`), cùng nội dung với bảng; lệnh được gọi lại một lần cho mọi cặp trên tờ', async () => {
    const r = await moBuoiChua()
    await waitFor(() => expect(nhanTrenBang(r).length).toBeGreaterThan(0), CHO)
    const truoc = m.lichSu.mock.calls.length
    fireEvent.click([...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Chiếu lên bảng ngay')) as HTMLButtonElement)
    await waitFor(() => expect(document.querySelector('.lop-xem-phieu iframe')).toBeTruthy(), CHO)
    const html = (document.querySelector('.lop-xem-phieu iframe') as HTMLIFrameElement).getAttribute('srcdoc') ?? ''
    expect(m.lichSu.mock.calls.length).toBe(truoc + 1)
    const doc = new DOMParser().parseFromString(html, 'text/html')
    const ls = [...doc.querySelectorAll('.mc-em .mc-ls')]
    expect(ls.length).toBeGreaterThan(0)
    expect(ls.some((e) => (e.textContent ?? '').includes('Chưa làm câu này'))).toBe(true)
    expect(ls.some((e) => (e.textContent ?? '').includes('Đã làm · lần gần nhất sai'))).toBe(true)
    expect(doc.querySelectorAll('.mc-ls').length).toBe(ls.length) // không nhãn nào nằm ngoài thẻ tên
  }, 60000)

  it('lệnh không gọi được (null: máy chủ cũ / mất mạng / chậm) ⇒ KHÔNG nhãn ở bảng lẫn ở tờ, tờ vẫn mở bình thường', async () => {
    m.lichSu.mockImplementation(async () => null)
    const r = await moBuoiChua()
    await waitFor(() => expect(m.lichSu).toHaveBeenCalled(), CHO)
    expect(nhanTrenBang(r)).toEqual([])
    fireEvent.click([...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Chiếu lên bảng ngay')) as HTMLButtonElement)
    await waitFor(() => expect(document.querySelector('.lop-xem-phieu iframe')).toBeTruthy(), CHO)
    const html = (document.querySelector('.lop-xem-phieu iframe') as HTMLIFrameElement).getAttribute('srcdoc') ?? ''
    expect(new DOMParser().parseFromString(html, 'text/html').querySelectorAll('.mc-ls').length).toBe(0)
    expect(html).toContain('mc-em')
  }, 60000)
})
