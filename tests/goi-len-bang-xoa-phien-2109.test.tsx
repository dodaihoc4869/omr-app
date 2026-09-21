// NÚT "XOÁ PHIÊN PHÂN CÔNG LÊN BẢNG" — ĐẦU-CUỐI QUA MÀN GIÁO VIÊN THẬT (thầy lệnh 21/09 16:4x; Code 1). Hộp xác nhận nói thật; xoá = dọn buổi dở đã lưu trên máy + bảng phân công trên màn;
// KHÔNG lệnh ghi nào lên máy chủ; phân công lại được ngay; mở lại màn không còn thẻ "Tiếp tục buổi trước". "IndexedDB" giả trong bộ nhớ để kiểm buổi dở thật sự bị xoá.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const m = vi.hoisted(() => ({ ghi: vi.fn(), hoSo: vi.fn(), mau: [] as unknown[], kho: new Map<string, unknown>(), xoa: vi.fn(), luu: vi.fn() }))

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
  docBuoiChua: async (k: string) => m.kho.get(k) ?? null,
  luuBuoiChua: async (k: string, v: unknown) => { m.luu(k); m.kho.set(k, JSON.parse(JSON.stringify(v))) },
  xoaBuoiChua: async (k: string) => { m.xoa(k); m.kho.delete(k) },
  docMauGiayThuc: async () => m.mau,
  themMauGiayThuc: async (x: unknown) => (m.mau.push(x), m.mau),
}))
vi.mock('../src/lib/may-chu-moi', async (goc) => ({ ...(await goc<Record<string, unknown>>()), layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://x' }) }))
vi.mock('../src/lib/lich-su-cau-len-bang-lenh', () => ({ layLichSuCau: async () => null }))
const toast = vi.fn()
vi.mock('../src/store/appStore', () => ({ useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: toast }) }))

const { default: GoiLenBangScreen } = await import('../src/screens/GoiLenBangScreen')

const CHO = { timeout: 20000 }
const emRong = { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } }

beforeEach(() => {
  cleanup()
  m.ghi.mockReset()
  m.hoSo.mockReset()
  m.hoSo.mockImplementation(async () => ({ em: Object.fromEntries(LUOT.map((l) => [l.sbd, emRong])) }))
  m.mau.length = 0
  m.kho.clear()
  m.xoa.mockReset()
  m.luu.mockReset()
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
const nutXoa = (r: ReturnType<typeof render>) => r.container.querySelector<HTMLButtonElement>('[data-nut="xoa-phien-phan-cong"]')
const hop = () => document.querySelector('[role="dialog"], [role="alertdialog"]')
const bam = (chu: string) => fireEvent.click([...document.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === chu) as HTMLButtonElement)

describe('nút "Xoá phiên phân công lên bảng"', () => {
  it('chỉ hiện khi đã có phiên (bảng phân công); bấm ⇒ hộp xác nhận nói thật, có hai nút "Xoá phiên" / "Giữ lại"; "Giữ lại" ⇒ mọi thứ còn nguyên', async () => {
    const r0 = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r0.getByText('Ca 111111')).toBeTruthy(), CHO)
    expect(nutXoa(r0)).toBeNull() // chưa phân công
    cleanup()
    const r = await moBuoiChua()
    expect(nutXoa(r)).toBeTruthy()
    fireEvent.click(nutXoa(r)!)
    await waitFor(() => expect(hop()).toBeTruthy(), CHO)
    const chu = hop()!.textContent ?? ''
    expect(chu).toContain('Xoá phiên phân công lên bảng của ca Ca 111111?')
    expect(chu).toContain('Bảng phân công và tiến độ các đợt trên máy này sẽ mất.')
    expect(chu).toContain('Kết quả Đạt / Chưa đạt đã ghi vào hồ sơ học sinh KHÔNG bị xoá.')
    bam('Giữ lại')
    await waitFor(() => expect(hop()).toBeNull(), CHO)
    expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy()
    expect(m.xoa).not.toHaveBeenCalled()
  }, 60000)

  it('"Xoá phiên" ⇒ bảng phân công + nút biến mất, buổi dở đã lưu bị xoá KHỎI MÁY; KHÔNG lệnh ghi nào lên máy chủ; phân công lại được ngay', async () => {
    const r = await moBuoiChua()
    await waitFor(() => expect(m.kho.size).toBe(1), CHO) // buổi dở đã được lưu trên máy
    const truocGhi = m.ghi.mock.calls.length
    fireEvent.click(nutXoa(r)!)
    await waitFor(() => expect(hop()).toBeTruthy(), CHO)
    bam('Xoá phiên')
    await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeNull(), CHO)
    expect(nutXoa(r)).toBeNull()
    expect(hop()).toBeNull()
    expect(m.xoa).toHaveBeenCalled()
    expect(m.kho.size).toBe(0)
    expect(m.ghi.mock.calls.length).toBe(truocGhi) // không ghi kết quả / không đụng dữ liệu máy chủ
    // phân công lại từ đầu ⇒ bảng mới
    fireEvent.click([...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ')) as HTMLButtonElement)
    await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
    expect(nutXoa(r)).toBeTruthy()
  }, 90000)

  it('mở lại màn: buổi dở còn ⇒ có thẻ "Tiếp tục buổi trước" (đối chứng); xoá phiên rồi mở lại ⇒ KHÔNG còn thẻ', async () => {
    await moBuoiChua()
    await waitFor(() => expect(m.kho.size).toBe(1), CHO)
    cleanup()
    const r2 = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r2.getByText('Ca 111111')).toBeTruthy(), CHO)
    fireEvent.click(r2.getByText('Ca 111111'))
    await waitFor(() => expect(r2.container.querySelector('[data-khoi="tiep-tuc-buoi"]')).toBeTruthy(), CHO) // đối chứng
    // ở màn đang có thẻ Tiếp tục: bảng phân công chưa dựng lại, nhưng buổi dở đã lưu ⇒ nút xoá vẫn có mặt
    await waitFor(() => expect(nutXoa(r2)).toBeTruthy(), CHO)
    fireEvent.click(nutXoa(r2)!)
    await waitFor(() => expect(hop()).toBeTruthy(), CHO)
    bam('Xoá phiên')
    await waitFor(() => expect(m.kho.size).toBe(0), CHO)
    await waitFor(() => expect(r2.container.querySelector('[data-khoi="tiep-tuc-buoi"]')).toBeNull(), CHO)
    cleanup()
    const r3 = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r3.getByText('Ca 111111')).toBeTruthy(), CHO)
    fireEvent.click(r3.getByText('Ca 111111'))
    await waitFor(() => expect([...r3.container.querySelectorAll('button')].some((b) => (b.textContent ?? '').includes('Xếp giờ'))).toBe(true), CHO)
    await act(async () => { await new Promise((x) => setTimeout(x, 200)) })
    expect(r3.container.querySelector('[data-khoi="tiep-tuc-buoi"]')).toBeNull()
  }, 120000)
})
