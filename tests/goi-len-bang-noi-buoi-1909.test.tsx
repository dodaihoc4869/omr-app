// M4 — TẮT APP GIỮA BUỔI → MỞ LẠI: "Tiếp tục buổi trước" đúng số câu còn lại; em vắng được thay; ô đã ghi không bị hỏi lại.
//
// Màn giáo viên thật (`GoiLenBangScreen`) với máy chủ và IndexedDB GIẢ trong bộ nhớ (một Map giữ bản lưu buổi qua các lần
// `cleanup()` + `render()` — chính là "tắt app rồi mở lại"). Logic thuần đã có test riêng ở `noi-buoi-chua-1909.test.ts`.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'
import { chuTheTiepTuc, type BuoiChuaLuu } from '../src/lib/noi-buoi-chua'

const m = vi.hoisted(() => ({
  ghi: vi.fn(),
  hoSo: vi.fn(),
  kho: new Map<string, unknown>(),
  moc: '2026-09-21',
  xoa: vi.fn(),
  lichSu: { soNgay: 30, theoEm: {} as Record<string, { soLan: number; lanCuoi: string; qids: string[] }> },
}))

const ca = (maCa: string): CaTomTat =>
  ({ maCa, tenCa: `Ca ${maCa}`, lop: '12A', daVao: 10, daNop: 10, lenBang: false, trangThai: 'dong', batDau: '2026-09-09T00:00:00.000Z', hetHanVao: '2026-09-09T01:00:00.000Z', loai: 'thi', hanNop: '' }) as unknown as CaTomTat

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
    ca: { maCa: '111111', tenCa: 'Ca 111111', lop: '12A' },
    keyBank: { phanI: DE.phanI, phanII: [], phanIII: [] },
    luot: LUOT,
  }),
  // hoSoEm(url, { secret, sbd }) — hai tham số; tên em ở đây là `Em <sbd>` để mỗi ô tích "có mặt" có nhãn riêng
  hoSoEm: async (_url: string, { sbd }: { sbd: string }) => ({ em: { sbd, hoTen: `Em ${sbd}` }, chuyenDe: [{ ten: 'Ester', soCau: 4, soSai: 2 }] }),
  lichSuLenBang: async () => m.lichSu,
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
  // "IndexedDB" giả — sống qua cleanup()/render() như bộ nhớ máy thầy sống qua lần tắt app
  docMocResetDaDon: async () => m.moc,
  docBuoiChua: async (k: string) => m.kho.get(k),
  luuBuoiChua: async (k: string, v: unknown) => void m.kho.set(k, JSON.parse(JSON.stringify(v))),
  xoaBuoiChua: async (k: string) => {
    m.xoa(k)
    m.kho.delete(k)
  },
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
const KHOA = '-|12A|111111' // khoá buổi KHÔNG gắn mốc reset (21/09: reset giữ toàn bộ ca thi)
const emRong = { chuyenDe: [], qidSai: [], qidDaLam: [], lenBang: { soLan: 0, lanCuoi: '', qids: [] } }

beforeEach(() => {
  cleanup()
  m.ghi.mockReset()
  m.ghi.mockResolvedValue(undefined)
  m.hoSo.mockReset()
  m.hoSo.mockImplementation(async () => ({ em: Object.fromEntries(LUOT.map((l) => [l.sbd, emRong])) }))
  m.kho.clear()
  m.xoa.mockReset()
  m.moc = '2026-09-21'
  m.lichSu = { soNgay: 30, theoEm: {} }
  toast.mockReset()
})

const nutXep = (r: ReturnType<typeof render>) => [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ')) as HTMLButtonElement
const nutChu = (r: ReturnType<typeof render>, chu: string) => [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes(chu)) as HTMLButtonElement | undefined
const dongBuoi = (r: ReturnType<typeof render>) => [...r.container.querySelectorAll('[data-dong-buoi]')] as HTMLElement[]
const nutDat = (d: HTMLElement) => [...d.querySelectorAll('button')].find((b) => (b.textContent ?? '').trim() === 'Đạt') as HTMLButtonElement
const luu = () => m.kho.get(KHOA) as BuoiChuaLuu | undefined
const theTiepTuc = (r: ReturnType<typeof render>) => r.container.querySelector('[data-khoi="tiep-tuc-buoi"]') as HTMLElement | null

/** Mở màn, chọn ca, chờ nút Xếp giờ hiện. */
async function moCaXong() {
  const r = render(<GoiLenBangScreen />)
  await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
  fireEvent.click(r.getByText('Ca 111111'))
  await waitFor(() => expect(nutXep(r)).toBeTruthy(), CHO)
  return r
}

/** Buổi ĐẦU: xếp giờ, chờ bảng buổi chữa và bản lưu. */
async function buoiDau() {
  const r = await moCaXong()
  fireEvent.click(nutXep(r))
  await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
  await waitFor(() => expect(luu()).toBeTruthy(), CHO)
  return r
}

/** Buổi đầu + chữa một em (Đạt) + tắt app (unmount). Trả về ô đã chữa. */
async function chuaMotEmRoiTat() {
  const r = await buoiDau()
  const d = dongBuoi(r)[0]
  const [sbd, qid] = (d.getAttribute('data-dong-buoi') ?? '').split('|')
  fireEvent.click(nutDat(d))
  await waitFor(() => expect(luu()!.daGhi[`${sbd}|${qid}`]).toBe('dat'), CHO)
  const truoc = luu()!
  cleanup() // TẮT APP
  return { sbd, qid, truoc }
}

describe('lưu buổi chữa', () => {
  it('LUẬT MỚI 25/09: khối buổi chữa hiện "N câu chữa · sàn 80 %" + số em lên bảng (bỏ "giá trị chữa" của Engine E)', async () => {
    const r = await buoiDau()
    const khoi = r.container.querySelector('[data-khoi="buoi-chua"]')
    expect(khoi?.textContent ?? '').toContain('câu chữa')
    expect(khoi?.textContent ?? '').toMatch(/sàn 80 %/)
    expect(khoi?.textContent ?? '').toContain('em lên bảng')
    expect(r.container.querySelector('[data-mot="gia-tri-buoi"]')).toBeNull()
    expect(r.container.textContent ?? '').not.toMatch(/nắm chắc/i)
  }, 90000)

  it('xếp giờ ⇒ LƯU NGAY (khoá `-` | lớp | mã ca — không gắn mốc reset) với kế hoạch, câu bắt buộc, nguồn câu; chưa có kết quả nào', async () => {
    await buoiDau()
    const b = luu()!
    expect(b.khoa).toBe(KHOA)
    expect(b.moc).toBe('')
    expect(b.lop).toBe('12A')
    expect(b.maCa).toBe('111111')
    expect(b.kehoach.length).toBeGreaterThan(0)
    expect(b.cauBuoi.length).toBeGreaterThanOrEqual(b.kehoach.length)
    expect(b.nguon.cachLayCau).toBe('san')
    expect(b.daGhi).toEqual({})
    expect(b.daChua).toEqual([])
    expect(Date.parse(b.hetHan) - Date.parse(b.luuLuc)).toBe(14 * 86_400_000)
  }, 60000)

  it('bấm Đạt ⇒ bản lưu có ô đó và câu đó là đã chữa; bản lưu dùng CHUNG một giờ bắt đầu qua các lần lưu', async () => {
    const r = await buoiDau()
    const batDau = luu()!.batDauLuc
    const d = dongBuoi(r)[0]
    const [sbd, qid] = (d.getAttribute('data-dong-buoi') ?? '').split('|')
    fireEvent.click(nutDat(d))
    await waitFor(() => expect(luu()!.daGhi[`${sbd}|${qid}`]).toBe('dat'), CHO)
    expect(luu()!.daChua).toEqual([qid])
    expect(luu()!.batDauLuc).toBe(batDau)
  }, 60000)

  it('KHÔNG lưu ở chế độ dạy học (kể cả khi bấm phân công) và không hiện thẻ tiếp tục', async () => {
    const r = await moCaXong()
    fireEvent.click(nutChu(r, 'Dạy học')!)
    const nutPc = await waitFor(() => {
      const n = nutChu(r, 'Phân công toàn bộ câu dạy học')
      expect(n).toBeTruthy()
      return n!
    }, CHO)
    fireEvent.click(nutPc)
    await new Promise((res) => setTimeout(res, 300))
    expect(m.kho.size).toBe(0)
    expect(theTiepTuc(r)).toBeNull()
  }, 60000)
})

describe('tắt app → mở lại: "Tiếp tục buổi trước"', () => {
  it('thẻ hiện ĐÚNG số câu còn lại và đã chữa; Xếp giờ bị chặn tới khi thầy chọn (không lặng lẽ ghi đè bản lưu)', async () => {
    const { truoc } = await chuaMotEmRoiTat()
    const r = await moCaXong()
    await waitFor(() => expect(theTiepTuc(r)).toBeTruthy(), CHO)
    const conLai = truoc.cauBuoi.length - 1
    expect(theTiepTuc(r)!.textContent).toContain(chuTheTiepTuc({ conLai: new Array(conLai).fill(''), daChua: ['x'], soTuMayChu: 0 }))
    expect(theTiepTuc(r)!.textContent).toContain(`còn ${conLai} câu (đã chữa 1)`)
    fireEvent.click(nutXep(r))
    expect(toast).toHaveBeenCalledWith(expect.stringContaining('Tiếp tục buổi trước'), 'warn')
    expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeNull()
    expect(luu()).toEqual(truoc) // bản lưu KHÔNG bị đụng
  }, 90000)

  it('TIẾP TỤC: chỉ xếp các câu CÒN LẠI (không câu đã chữa), giữ NGUYÊN em còn có mặt, ô đã ghi không hỏi lại, giờ bắt đầu giữ nguyên', async () => {
    const { sbd, qid, truoc } = await chuaMotEmRoiTat()
    const r = await moCaXong()
    await waitFor(() => expect(theTiepTuc(r)).toBeTruthy(), CHO)
    fireEvent.click(nutChu(r, 'Tiếp tục buổi trước')!)
    await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
    const dong = dongBuoi(r).map((d) => (d.getAttribute('data-dong-buoi') ?? '').split('|'))
    expect(dong.length).toBeGreaterThan(0)
    // câu đã chữa KHÔNG được xếp lại, em đã chữa không bị gọi lại cho câu ấy
    expect(dong.map(([, q]) => q)).not.toContain(qid)
    expect(dong.some(([s, q]) => s === sbd && q === qid)).toBe(false)
    // mọi câu xếp đều thuộc phần còn lại
    const conLai = new Set(truoc.cauBuoi.filter((q) => q !== qid))
    for (const [, q] of dong) expect(conLai.has(q)).toBe(true)
    // LUẬT MỚI 25/09: bỏ "giữ em" của lần xếp trước — em được gán lại theo lượt, không khoá theo `emDaDinh`.
    // thẻ tiếp tục biến mất; bản lưu vẫn nhớ ô đã ghi và giờ bắt đầu cũ
    expect(theTiepTuc(r)).toBeNull()
    await waitFor(() => expect(luu()!.kehoach.every((o) => o.qid !== qid)).toBe(true), CHO)
    expect(luu()!.daGhi[`${sbd}|${qid}`]).toBe('dat')
    expect(luu()!.batDauLuc).toBe(truoc.batDauLuc)
    expect(luu()!.daChua).toContain(qid)
    // và chưa hề gọi lại ghiLenBang cho ô đã ghi
    expect(m.ghi).toHaveBeenCalledTimes(1)
  }, 120000)

  it('EM VẮNG hôm nay: em đó KHÔNG có trong buổi nối, câu của em ấy được giao cho em có mặt khác', async () => {
    const { truoc } = await chuaMotEmRoiTat()
    const r = await moCaXong()
    await waitFor(() => expect(theTiepTuc(r)).toBeTruthy(), CHO)
    const conLaiKehoach = truoc.kehoach.filter((o) => !Object.keys(truoc.daGhi).includes(`${o.sbd}|${o.qid}`))
    const vang = conLaiKehoach[0]
    const oTich = r.getByLabelText(`Em ${vang.sbd} có mặt`)
    fireEvent.click(oTich)
    fireEvent.click(nutChu(r, 'Tiếp tục buổi trước')!)
    await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
    const dong = dongBuoi(r).map((d) => (d.getAttribute('data-dong-buoi') ?? '').split('|'))
    expect(dong.map(([s]) => s)).not.toContain(vang.sbd)
    // câu của em vắng vẫn được chữa (giao em khác có mặt)
    expect(dong.map(([, q]) => q)).toContain(vang.qid)
  }, 120000)

  it('BẮT ĐẦU BUỔI MỚI: xoá bản lưu, thẻ biến mất, Xếp giờ chạy được và lưu buổi mới (giờ bắt đầu mới)', async () => {
    const { truoc } = await chuaMotEmRoiTat()
    const r = await moCaXong()
    await waitFor(() => expect(theTiepTuc(r)).toBeTruthy(), CHO)
    fireEvent.click(nutChu(r, 'Bắt đầu buổi mới')!)
    await waitFor(() => expect(m.xoa).toHaveBeenCalledWith(KHOA), CHO)
    expect(theTiepTuc(r)).toBeNull()
    fireEvent.click(nutXep(r))
    await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
    await waitFor(() => expect(luu()).toBeTruthy(), CHO)
    expect(luu()!.daGhi).toEqual({})
    expect(luu()!.daChua).toEqual([])
    expect(Date.parse(luu()!.batDauLuc)).toBeGreaterThanOrEqual(Date.parse(truoc.batDauLuc))
    // buổi mới xếp cho MỌI câu (không bị cắt theo phần còn lại của buổi cũ)
    expect(luu()!.cauBuoi.length).toBe(truoc.cauBuoi.length)
  }, 120000)
})

describe('buổi cũ KHÔNG được nối khi không nên', () => {
  it('quá 14 ngày ⇒ không có thẻ, bản lưu bị dọn', async () => {
    await chuaMotEmRoiTat()
    const b = luu()!
    m.kho.set(KHOA, { ...b, hetHan: new Date(Date.now() - 60_000).toISOString() })
    const r = await moCaXong()
    await waitFor(() => expect(m.xoa).toHaveBeenCalledWith(KHOA), CHO)
    expect(theTiepTuc(r)).toBeNull()
  }, 90000)

  it('SAU RESET (mốc khác) ⇒ buổi VẪN nối được: reset giữ toàn bộ ca thi nên khoá buổi không gắn mốc (21/09)', async () => {
    await chuaMotEmRoiTat()
    m.moc = '2026-10-05'
    const r = await moCaXong()
    await waitFor(() => expect(theTiepTuc(r)).toBeTruthy(), CHO)
    expect(m.kho.get('2026-10-05|12A|111111')).toBeUndefined()
  }, 90000)

  it('bản lưu HỎNG (hình dạng lạ) hoặc khoá bên trong không khớp ⇒ bỏ, không nối', async () => {
    await chuaMotEmRoiTat()
    for (const hong of [{ phienBan: 1, khoa: KHOA }, 'rác', { ...luu()!, khoa: 'khoa|khac|1' }]) {
      cleanup()
      m.xoa.mockReset()
      m.kho.set(KHOA, hong)
      const r = await moCaXong()
      await waitFor(() => expect(m.xoa).toHaveBeenCalledWith(KHOA), CHO)
      expect(theTiepTuc(r)).toBeNull()
    }
  }, 150000)

  it('ca KHÁC hoặc lớp KHÁC ⇒ không thấy buổi của ca này', async () => {
    await chuaMotEmRoiTat()
    const b = luu()!
    m.kho.delete(KHOA)
    m.kho.set('2026-09-21|12B|111111', { ...b, khoa: '2026-09-21|12B|111111', lop: '12B' })
    const r = await moCaXong()
    await waitFor(() => expect(nutXep(r)).toBeTruthy(), CHO)
    expect(theTiepTuc(r)).toBeNull()
  }, 90000)
})

describe('đối chiếu lịch sử lên bảng của MÁY CHỦ (đổi máy vẫn không mất phần đã chữa)', () => {
  it('em trong kế hoạch có qid trong lịch sử máy chủ, lần cuối SAU lúc buổi bắt đầu ⇒ tính đã chữa và nói rõ "máy chủ ghi nhận"', async () => {
    const { truoc } = await chuaMotEmRoiTat()
    const o = truoc.kehoach.find((x) => !truoc.daGhi[`${x.sbd}|${x.qid}`])!
    m.lichSu = { soNgay: 30, theoEm: { [o.sbd]: { soLan: 1, lanCuoi: new Date(Date.parse(truoc.batDauLuc) + 3_600_000).toISOString(), qids: [o.qid] } } }
    const r = await moCaXong()
    await waitFor(() => expect(theTiepTuc(r)).toBeTruthy(), CHO)
    await waitFor(() => expect(theTiepTuc(r)!.textContent).toContain(`đã chữa 2`), CHO)
    expect(theTiepTuc(r)!.textContent).toContain(`còn ${truoc.cauBuoi.length - 2} câu`)
    expect(theTiepTuc(r)!.textContent).toContain('1 câu máy chủ ghi nhận đã chữa ở máy khác')
    // nối: câu máy chủ xác nhận được GHI vào bản lưu (mất mạng lần sau vẫn không hiện lại như câu còn lại)
    fireEvent.click(nutChu(r, 'Tiếp tục buổi trước')!)
    await waitFor(() => expect(r.container.querySelector('[data-khoi="buoi-chua"]')).toBeTruthy(), CHO)
    await waitFor(() => expect(luu()!.daChua).toContain(o.qid), CHO)
    expect(dongBuoi(r).map((d) => d.getAttribute('data-dong-buoi'))).not.toContain(`${o.sbd}|${o.qid}`)
  }, 90000)
})
