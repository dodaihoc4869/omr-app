// BẢNG BUỔI CHỮA (Engine E) CÓ NÚT ĐẠT / KHÔNG ĐẠT — và màn xin hồ sơ nắm kiến thức đúng cho câu của buổi.
//
// GĐ 6 làn giáo viên, 19/09/2026. Trước đây CHỈ bảng "Phân công" cũ (Engine C) có hai nút ấy; bảng buổi chữa
// và tờ máy chiếu (Engine E) — bảng thầy thật sự cầm — không ghi ngược được, nên kết quả gọi lên bảng không
// bao giờ về máy chủ. Nay cả hai bảng gọi CÙNG một lệnh `ghiLenBang` (máy chủ ghi `len_bang` + sổ `nguon='len_bang'`).
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const m = vi.hoisted(() => ({
  ghi: vi.fn(),
  hoSo: vi.fn(),
}))

const ca = (maCa: string): CaTomTat =>
  ({ maCa, tenCa: `Ca ${maCa}`, lop: '12', daVao: 10, daNop: 10, lenBang: false, trangThai: 'dong', batDau: '2026-09-09T00:00:00.000Z', hetHanVao: '2026-09-09T01:00:00.000Z' }) as unknown as CaTomTat

const DE: TeacherExamSource = {
  maDe: 'CA',
  phanI: Array.from({ length: 6 }, (_, i) => ({
    id: `q${i + 1}`,
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
  chiTietCa: async () => ({
    ca: { maCa: '111111', tenCa: 'Ca 111111', lop: '12' },
    keyBank: { phanI: DE.phanI, phanII: [], phanIII: [] },
    luot: LUOT,
  }),
  hoSoEm: async ({ sbd }: { sbd: string }) => ({ em: { sbd, hoTen: `Em ${sbd}` }, chuyenDe: [{ ten: 'Ester', soCau: 4, soSai: 2 }] }),
  lichSuLenBang: async () => ({ soNgay: 30, theoEm: {} }),
  ghiLenBang: (...a: unknown[]) => m.ghi(...a),
  goiHoSoLopLenBang: (...a: unknown[]) => m.hoSo(...a),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => [DE],
  loadSessionTeacherBank: async () => undefined,
  // Ca có bộ chữa lưu sẵn ⇒ cách lấy câu = 'san' ⇒ danh sách câu = câu của ca (không cần thầy tích đề).
  docKhoChuaCa: async () => [DE],
  docKhoDoKho: async () => undefined,
  luuKhoDoKho: async () => {},
}))
vi.mock('../src/lib/may-chu-moi', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://x' }),
}))
const toast = vi.fn()
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: toast }),
}))

const { default: GoiLenBangScreen } = await import('../src/screens/GoiLenBangScreen')

const CHO = { timeout: 20000 }
const emRong = { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } }
const goiRong = () => ({ em: Object.fromEntries(LUOT.map((l) => [l.sbd, emRong])) })

beforeEach(() => {
  cleanup()
  m.ghi.mockReset()
  m.ghi.mockResolvedValue(undefined)
  m.hoSo.mockReset()
  m.hoSo.mockImplementation(async () => goiRong())
  toast.mockReset()
})

/** Mở ca, bấm Xếp giờ & phân công, chờ khối buổi chữa dựng ra. */
async function moBuoiChua() {
  const r = render(<GoiLenBangScreen />)
  await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
  fireEvent.click(r.getByText('Ca 111111'))
  await waitFor(() => expect([...r.container.querySelectorAll('button')].some((b) => (b.textContent ?? '').includes('Xếp giờ'))).toBe(true), CHO)
  const nut = [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ')) as HTMLButtonElement
  fireEvent.click(nut)
  await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
  return r
}

const dongBuoi = (r: ReturnType<typeof render>) => [...r.container.querySelectorAll('[data-dong-buoi]')] as HTMLElement[]
const nutTrong = (dong: HTMLElement, chu: 'Đạt' | 'Không đạt') =>
  [...dong.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === chu) as HTMLButtonElement | undefined

describe('Bảng buổi chữa (Engine E) có nút Đạt / Không đạt', () => {
  it('MỖI dòng em lên bảng có đủ hai nút', async () => {
    const r = await moBuoiChua()
    const dong = dongBuoi(r)
    expect(dong.length).toBeGreaterThan(0)
    for (const d of dong) {
      expect(nutTrong(d, 'Đạt')).toBeTruthy()
      expect(nutTrong(d, 'Không đạt')).toBeTruthy()
    }
  }, 40000)

  it('bấm ĐẠT ⇒ gọi ĐÚNG `ghiLenBang` (url, mật khẩu, sbd, chuyên đề, dat, qid), rồi chỉ còn nhãn "Đã ghi: Đạt"', async () => {
    const r = await moBuoiChua()
    const d = dongBuoi(r)[0]
    const [sbd, qid] = (d.getAttribute('data-dong-buoi') ?? '').split('|')
    fireEvent.click(nutTrong(d, 'Đạt')!)
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
    const [url, mat, goi] = m.ghi.mock.calls[0]
    expect(url).toBe('https://x')
    expect(mat).toBe('mat')
    expect(goi).toEqual({ sbd, chuyenDe: expect.stringMatching(/Ester|Lipid/), dat: true, qid })
    await waitFor(() => expect(d.textContent).toContain('Đã ghi: Đạt'), CHO)
    expect(nutTrong(d, 'Đạt')).toBeUndefined()
    expect(nutTrong(d, 'Không đạt')).toBeUndefined()
  }, 40000)

  it('bấm KHÔNG ĐẠT ⇒ dat:false, nhãn "Đã ghi: Không đạt"; các dòng khác KHÔNG bị đụng', async () => {
    const r = await moBuoiChua()
    const dong = dongBuoi(r)
    expect(dong.length).toBeGreaterThan(1)
    fireEvent.click(nutTrong(dong[0], 'Không đạt')!)
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
    expect(m.ghi.mock.calls[0][2]).toMatchObject({ dat: false })
    await waitFor(() => expect(dong[0].textContent).toContain('Đã ghi: Không đạt'), CHO)
    expect(nutTrong(dong[1], 'Đạt')).toBeTruthy()
    expect(nutTrong(dong[1], 'Không đạt')).toBeTruthy()
  }, 40000)

  it('máy chủ từ chối ⇒ GIỮ nguyên hai nút để bấm lại, báo lỗi, KHÔNG khoá dòng', async () => {
    m.ghi.mockRejectedValueOnce(new Error('Máy chủ lỗi'))
    const r = await moBuoiChua()
    const d = dongBuoi(r)[0]
    fireEvent.click(nutTrong(d, 'Đạt')!)
    await waitFor(() => expect(toast).toHaveBeenCalledWith('Máy chủ lỗi', 'error'), CHO)
    expect(d.textContent).not.toContain('Đã ghi')
    // bấm lại được và lần này thành công
    fireEvent.click(nutTrong(d, 'Đạt')!)
    await waitFor(() => expect(d.textContent).toContain('Đã ghi: Đạt'), CHO)
    expect(m.ghi).toHaveBeenCalledTimes(2)
  }, 40000)

  it('KHÔNG ghi đôi khi bấm dòng KHÁC trong lúc dòng trước còn chờ máy chủ (dangCham chỉ nhớ một dòng)', async () => {
    const treo: Array<() => void> = []
    m.ghi.mockImplementation(() => new Promise<void>((xong) => treo.push(xong)))
    const r = await moBuoiChua()
    const dong = dongBuoi(r)
    expect(dong.length).toBeGreaterThan(1)
    fireEvent.click(nutTrong(dong[0], 'Đạt')!)
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(1), CHO)
    fireEvent.click(nutTrong(dong[1], 'Đạt')!) // dòng khác, dòng 0 mở khoá lại
    await waitFor(() => expect(m.ghi).toHaveBeenCalledTimes(2), CHO)
    const lai = nutTrong(dong[0], 'Đạt')
    if (lai) fireEvent.click(lai)
    await new Promise((res) => setTimeout(res, 100))
    expect(m.ghi).toHaveBeenCalledTimes(2) // KHÔNG có lần thứ ba cho dòng 0
    treo.forEach((xong) => xong())
    await waitFor(() => expect(dong[0].textContent).toContain('Đã ghi: Đạt'), CHO)
    expect(m.ghi).toHaveBeenCalledTimes(2)
  }, 40000)

  it('KHÔNG ghi đôi: sau khi đã ghi, không còn nút nào để bấm lại', async () => {
    const r = await moBuoiChua()
    const d = dongBuoi(r)[0]
    fireEvent.click(nutTrong(d, 'Đạt')!)
    await waitFor(() => expect(d.textContent).toContain('Đã ghi: Đạt'), CHO)
    expect(d.querySelectorAll('button')).toHaveLength(0)
    expect(m.ghi).toHaveBeenCalledTimes(1)
  }, 40000)
})

describe('Màn xin hồ sơ nắm kiến thức đúng cho câu của buổi', () => {
  it('gọi hoSoLopLenBang kèm dsQid = các câu của buổi', async () => {
    await moBuoiChua()
    expect(m.hoSo).toHaveBeenCalled()
    const dsQid = m.hoSo.mock.calls[0][4] as string[]
    expect(dsQid).toEqual(expect.arrayContaining(['q1', 'q2', 'q3', 'q4', 'q5', 'q6']))
    expect(new Set(dsQid).size).toBe(dsQid.length)
  }, 40000)

  it('máy chủ trả bậc "biết" cho MỘT em ở mọi câu (đều 2 sao) ⇒ em ấy KHÔNG có dòng nào lên bảng', async () => {
    const bi = LUOT[0].sbd
    m.hoSo.mockImplementation(async (_u: string, _s: string, _ds: string[], _n: number, dsQid: string[]) => ({
      em: Object.fromEntries(
        LUOT.map((l) => [
          l.sbd,
          l.sbd === bi
            ? { ...emRong, namKt: Object.fromEntries(dsQid.map((q) => [q, { lanSai: 0, trangThai: null, canDayLai: false, maDang: 'ES-01', bac: 'biet', dang: null }])) }
            : emRong,
        ]),
      ),
    }))
    const r = await moBuoiChua()
    const cacEm = dongBuoi(r).map((d) => (d.getAttribute('data-dong-buoi') ?? '').split('|')[0])
    expect(cacEm.length).toBeGreaterThan(0)
    expect(cacEm).not.toContain(bi)
  }, 40000)

  it('lần xin hồ sơ trước LỖI ⇒ bấm xếp lại là xin lại (không giữ hồ sơ rỗng mãi)', async () => {
    m.hoSo.mockRejectedValueOnce(new Error('mất mạng'))
    const r = await moBuoiChua()
    expect(m.hoSo).toHaveBeenCalledTimes(1)
    const nut = [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ')) as HTMLButtonElement
    fireEvent.click(nut)
    await waitFor(() => expect(m.hoSo).toHaveBeenCalledTimes(2), CHO)
  }, 40000)

  it('xếp lại khi KHÔNG đổi em/câu và lần trước ổn ⇒ KHÔNG xin lại (không tốn lượt máy chủ)', async () => {
    const r = await moBuoiChua()
    expect(m.hoSo).toHaveBeenCalledTimes(1)
    const nut = [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ')) as HTMLButtonElement
    fireEvent.click(nut)
    await new Promise((res) => setTimeout(res, 300))
    expect(m.hoSo).toHaveBeenCalledTimes(1)
  }, 40000)
})
