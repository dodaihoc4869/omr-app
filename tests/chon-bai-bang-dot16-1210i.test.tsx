// ĐỢT 16 · LÀN E (12/10) — thầy báo: "Phần chọn bài bảng khi chọn xong bấm lại nút chọn thì sẽ trở lại ban đầu, tick chọn bài cũng vậy."
// Khoá từng đường làm mất lựa chọn của thầy:
//  · Dạy học (DayHocLenBang): mở lại hộp chọn ⇒ cây tự mở tới bài đang chọn, giữ chữ tìm + chip lớp; "Dùng" lại y bộ cũ không xoá câu thầy đã bỏ;
//    lựa chọn làm TRƯỚC khi có buổi (bấm Điểm danh / buổi về muộn) không bị xoá; đổi sang buổi khác thật ⇒ nạp phần nhớ của buổi ấy VÀ báo thầy.
//  · Bài hôm nay (tick bài vừa dạy): bài + lớp thầy chọn còn nguyên khi mở lại màn (dựng lại thành phần); đổi sang lớp khác khối ⇒ bỏ bài VÀ báo.
//  · Gọi lên bảng theo ca (GoiLenBangCu): danh sách BTVN về muộn không ghi đè bài thầy đã tích; đổi qua lại "Chữa BTVN" ↔ "Tôi tự chọn bài" giữ tích + chữ tìm.
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'
import type { CaTomTat } from '../src/lib/exam-api'

const m = vi.hoisted(() => ({
  goi: vi.fn(),
  btvn: vi.fn(),
  khoGia: { ds: [] as unknown[] },
  toast: vi.fn(),
}))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => m.goi(duong, body) }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  loadExamSources: async () => m.khoGia.ds,
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
  loadSessionTeacherBank: async () => undefined,
  docKhoChuaCa: async () => undefined,
  docKhoDoKho: async () => undefined,
  luuKhoDoKho: async () => {},
  docMocResetDaDon: async () => '2026-09-21',
  docBuoiChua: async () => undefined,
  luuBuoiChua: async () => {},
  xoaBuoiChua: async () => {},
  docMauGiayThuc: async () => [],
  themMauGiayThuc: async () => {},
}))
const LUOT = Array.from({ length: 4 }, (_, i) => ({ sbd: `1200${i}`, hoTen: `Em ${i + 1}`, lanThu: 1, trangThai: 'da_nop', dapAn: { phanI: {}, phanII: {}, phanIII: {} }, giayCau: {} }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachCa: async () => [{ maCa: '111111', tenCa: 'Ca 111111', lop: '12A', daVao: 4, daNop: 4, lenBang: true, trangThai: 'dong', loai: 'thi', hanNop: '' } as unknown as CaTomTat],
  chiTietCa: async () => ({ ca: { maCa: '111111', tenCa: 'Ca 111111', lop: '12A' }, keyBank: { phanI: [], phanII: [], phanIII: [] }, luot: LUOT }),
  hoSoEm: async (_u: string, { sbd }: { sbd: string }) => ({ em: { sbd, hoTen: `Em ${sbd}` }, chuyenDe: [] }),
  lichSuLenBang: async () => ({ soNgay: 30, theoEm: {} }),
  ghiLenBang: async () => undefined,
  goiHoSoLopLenBang: async () => ({ em: {} }),
}))
vi.mock('../src/lib/may-chu-moi', async (goc) => ({ ...(await goc<Record<string, unknown>>()), layCauHinhMayChu: async () => ({ BAT: true, URL: 'https://may-chu' }) }))
vi.mock('../src/lib/btvn-may-chu-moi', async (goc) => ({ ...(await goc<Record<string, unknown>>()), theoDoiBtvn: (...a: unknown[]) => m.btvn(...a) }))

import DayHocLenBang from '../src/components/day-hoc/DayHocLenBang'
import type { DiemDanhBuoi } from '../src/components/day-hoc/DiemDanhBuoi'
import GoiLenBangScreen from '../src/screens/GoiLenBangScreen'
import { useAppStore } from '../src/store/appStore'
import { khoDayHoc } from '../src/lib/day-hoc-len-bang'
import { khuTrungNguon } from '../src/lib/khu-trung-cau'
import { tachNhieuTheoPhan } from '../src/lib/tach-phan-de'

let so = 0
const cauI = (ma: string, n: number) => Array.from({ length: n }, () => ({ id: `${ma}-I-${++so}`, text: `Câu ${so} của ${ma}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester – lipid' }))
const cauII = (ma: string, n: number) => Array.from({ length: n }, () => ({ id: `${ma}-II-${++so}`, text: `Ý ${so} của ${ma}`, ideas: ['a', 'b', 'c', 'd'], correct: 'DDSS', chuyenDe: 'Ester – lipid' }))
const to = (maDe: string, nguon: string, nI: number, nII = 0, nhom = '12 · DẠY HỌC/C1 - Ester lipid'): TeacherExamSource =>
  ({ maDe, nhom, nguon, phanI: cauI(maDe, nI), phanII: cauII(maDe, nII), phanIII: [] }) as unknown as TeacherExamSource
const KHO: TeacherExamSource[] = [
  to('DH-12-C1-B1', 'Bài 1. Ester', 2, 1),
  to('DH-12-C1-B2', 'Bài 2. Lipid', 2),
  to('DH-12-C2-B4', 'Bài 4. Glucose', 2, 0, '12 · DẠY HỌC/C2 - Carbohydrate'),
  to('DH-11-C2-B3', 'Bài 3. Ammonia', 2, 0, '11 · DẠY HỌC/C2 - Nitrogen'),
  to('KT-12-C1', 'Đề kiểm tra chương 1', 3, 0, '12 · C1 - Ester lipid'),
  to('KT-12-C2', 'Đề kiểm tra chương 2', 3, 0, '12 · C2 - Carbohydrate'),
]
m.khoGia.ds = KHO
// Màn nạp lười nhiều lớp (kho, buổi, cờ OMNI, danh sách bài) — cho mỗi test đủ thời gian chờ.
vi.setConfig({ testTimeout: 20000 })
/** Mã tờ (đã tách phần) của một bài trong kho Dạy học — đúng như bảng Dạy học tự dựng. */
const maCuaBai = (goc: string) =>
  khoDayHoc(KHO, khuTrungNguon, tachNhieuTheoPhan)
    .map((s) => s.maDe)
    .filter((ma) => ma.startsWith(goc))

const BUOI = (id: string, lop = '12A1') => ({ id, ten: `Buổi học 12/10 · ${lop}`, lop, moLuc: '2026-10-12T11:00:00Z', hetHan: '2026-10-13T11:00:00Z', dongLuc: null, dangMo: true })
let buoiMo: unknown[] = []
let co: Record<string, unknown> | null = null
function chuanMock() {
  m.goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 3, sbd: [] }, { tenLop: '11B', khoi: '11', soEm: 3, sbd: [] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: buoiMo } }
    if (duong === '/gv/buoi-hoc' && b.action === 'gan-day') return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    if (duong === '/gv/buoi-hoc') return { ok: true, du: { ok: true, buoi: BUOI('BH-1'), ma: '482915', doiMaLuc: 1, coMat: [], siSo: 3, lopEm: [] } }
    if (duong === '/gv/omni' && b.action === 'co-doc') return co ? { ok: true, du: { ok: true, co } } : { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
    if (duong === '/gv/bai-da-day' && b.action === 'danh-sach') return { ok: true, du: { ok: true, bai: [], choBaiMoi: null } }
    if (duong === '/gv/bai-da-day' && b.action === 'xem-truoc')
      return { ok: true, du: { ok: true, soCau: 12, soTuLuan: 0, hanNop: '2026-10-19', D: 7, luotCan: 24, sucChua: 40, duLuot: 3, tongEm: 3, duDiem8: 1, quaTai: [], theLucNgay: 40 } }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}

beforeAll(() => {
  useAppStore.setState({ showToast: m.toast } as never)
})
beforeEach(() => {
  m.goi.mockReset()
  m.btvn.mockReset()
  m.toast.mockReset()
  buoiMo = []
  co = null
  chuanMock()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
})

const CHO = { timeout: 8000 }
const tongCau = () => document.querySelector('.dh-tong b')?.textContent ?? ''
const hopChon = () => screen.findByRole('dialog', { name: 'Chọn bài · kho Dạy học' })
/** Ô tích một dòng của cây (đang hiện) theo tên; không có ⇒ null. */
const oTich = (goc: HTMLElement, ten: RegExp) => within(goc).queryAllByRole('checkbox').find((o) => ten.test(o.textContent ?? '')) ?? null

describe('Dạy học — hộp chọn bài mở lại vẫn thấy bài đang chọn', () => {
  it('chọn xong bấm "Đổi bài" ⇒ cây tự mở tới bài đã tích (ô tích đầy), không gập về ban đầu', async () => {
    render(<DayHocLenBang />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn bài trong kho Dạy học' }))
    let hop = await hopChon()
    await within(hop).findByRole('tree')
    // Tìm để thấy bài, tích cả bài, rồi xoá chữ tìm (cây gập lại như mặc định) và dùng.
    fireEvent.change(within(hop).getByLabelText('Tìm đề'), { target: { value: 'Lipid' } })
    fireEvent.click(oTich(hop, /Bài 2\. Lipid/)!)
    fireEvent.change(within(hop).getByLabelText('Tìm đề'), { target: { value: '' } })
    fireEvent.click(within(hop).getByRole('button', { name: /^Dùng \d+ câu$/ }))
    await waitFor(() => expect(tongCau()).toBe('2'), CHO)

    fireEvent.click(screen.getByRole('button', { name: 'Đổi bài' }))
    hop = await hopChon()
    await within(hop).findByRole('tree')
    const bai = oTich(hop, /Bài 2\. Lipid/)
    expect(bai, 'dòng bài đã chọn phải hiện sẵn khi mở lại').toBeTruthy()
    expect(bai!.getAttribute('aria-checked')).toBe('true')
    expect(within(hop).getByText(/Xem trước:/).textContent).toContain('2')
  })

  it('mở lại giữ chữ tìm và chip lớp thầy đã chọn', async () => {
    render(<DayHocLenBang />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn bài trong kho Dạy học' }))
    let hop = await hopChon()
    await within(hop).findByRole('tree')
    fireEvent.click(within(hop).getByRole('button', { name: 'Lớp 12' }))
    fireEvent.change(within(hop).getByLabelText('Tìm đề'), { target: { value: 'Lipid' } })
    fireEvent.click(oTich(hop, /Bài 2\. Lipid/)!)
    fireEvent.click(within(hop).getByRole('button', { name: /^Dùng \d+ câu$/ }))
    await waitFor(() => expect(tongCau()).toBe('2'), CHO)

    fireEvent.click(screen.getByRole('button', { name: 'Đổi bài' }))
    hop = await hopChon()
    expect((within(hop).getByLabelText('Tìm đề') as HTMLInputElement).value).toBe('Lipid')
    expect(within(hop).getByRole('button', { name: 'Lớp 12' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('"Dùng" lại đúng bộ cũ ⇒ câu thầy đã bỏ vẫn bỏ (không quay về ban đầu)', async () => {
    render(<DayHocLenBang />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn bài trong kho Dạy học' }))
    let hop = await hopChon()
    await within(hop).findByRole('tree')
    fireEvent.change(within(hop).getByLabelText('Tìm đề'), { target: { value: 'Lipid' } })
    fireEvent.click(oTich(hop, /Bài 2\. Lipid/)!)
    fireEvent.click(within(hop).getByRole('button', { name: /^Dùng \d+ câu$/ }))
    await waitFor(() => expect(tongCau()).toBe('2'), CHO)
    // Bỏ câu 1 ở danh sách hiện ra.
    fireEvent.click(screen.getAllByRole('checkbox', { name: /^Chiếu câu 1/ })[0]!)
    await waitFor(() => expect(tongCau()).toBe('1'))

    fireEvent.click(screen.getByRole('button', { name: 'Đổi bài' }))
    hop = await hopChon()
    fireEvent.click(within(hop).getByRole('button', { name: /^Dùng \d+ câu$/ }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Chọn bài · kho Dạy học' })).toBeNull())
    expect(tongCau()).toBe('1')
    expect(document.querySelector('.dh-tong')?.textContent).toContain('đã bỏ 1 câu')
  })

  it('chọn bài TRƯỚC khi có buổi rồi bấm Điểm danh ⇒ bài đã chọn còn nguyên (và nhớ theo buổi mới)', async () => {
    render(<DayHocLenBang />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn bài trong kho Dạy học' }))
    const hop = await hopChon()
    await within(hop).findByRole('tree')
    fireEvent.change(within(hop).getByLabelText('Tìm đề'), { target: { value: 'Lipid' } })
    fireEvent.click(oTich(hop, /Bài 2\. Lipid/)!)
    fireEvent.click(within(hop).getByRole('button', { name: /^Dùng \d+ câu$/ }))
    await waitFor(() => expect(tongCau()).toBe('2'), CHO)

    fireEvent.click(screen.getByRole('button', { name: 'Điểm danh' }))
    await screen.findByRole('dialog', { name: 'Chiếu mã điểm danh' })
    await waitFor(() => expect(localStorage.getItem('ddh.dayHoc.BH-1')).toBeTruthy(), CHO)
    expect(tongCau()).toBe('2')
    expect(screen.queryByText(/Chưa chọn bài nào/)).toBeNull()
    expect(JSON.parse(localStorage.getItem('ddh.dayHoc.BH-1')!).maChon.sort()).toEqual(maCuaBai('DH-12-C1-B2').sort())
  })

  it('đổi sang buổi khác THẬT ⇒ hiện bài của buổi ấy và BÁO thầy (bài buổi trước vẫn nhớ)', async () => {
    localStorage.setItem('ddh.dayHoc.BH-1', JSON.stringify({ maChon: maCuaBai('DH-12-C1-B1'), boCau: [], giao: {} }))
    localStorage.setItem('ddh.dayHoc.BH-2', JSON.stringify({ maChon: maCuaBai('DH-12-C1-B2'), boCau: [], giao: {} }))
    const dd = (id: string) => ({ tt: { buoi: BUOI(id), coMat: [], lopEm: [] }, idBuoi: id, coMat: [], lopCuaEm: new Map(), dsLop: [] }) as unknown as DiemDanhBuoi
    const r = render(<DayHocLenBang dd={dd('BH-1')} />)
    await waitFor(() => expect(tongCau()).toBe('3'), CHO)
    r.rerender(<DayHocLenBang dd={dd('BH-2')} />)
    await waitFor(() => expect(tongCau()).toBe('2'), CHO)
    expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/buổi/i), expect.anything())
    expect(JSON.parse(localStorage.getItem('ddh.dayHoc.BH-1')!).maChon.sort()).toEqual(maCuaBai('DH-12-C1-B1').sort())
  })
})

describe('Bài hôm nay — bài đã chọn để tick còn nguyên khi mở lại', () => {
  const buocBai = () => screen.findByRole('region', { name: /Bài hôm nay/ }).catch(() => document.querySelector('[data-khoi="bai-hom-nay"]') as HTMLElement)
  const dongBai = (khoa: string) => document.querySelector(`[data-bai="${khoa}"]`) as HTMLElement | null

  it('chọn bài rồi rời màn, mở lại ⇒ bài vẫn đang chọn, thẻ xác nhận hiện lại', async () => {
    co = { bat: true, lop: [], sbd: [] }
    buoiMo = [BUOI('BH-1')]
    render(<DayHocLenBang />)
    await buocBai()
    await waitFor(() => expect(dongBai('DH-12-C1-B2')).toBeTruthy(), CHO)
    fireEvent.click(within(dongBai('DH-12-C1-B2')!).getByRole('radio'))
    await waitFor(() => expect(document.querySelector('[data-khoi="cho-chon-bai"]')).toBeNull())

    cleanup()
    render(<DayHocLenBang />)
    await waitFor(() => expect(dongBai('DH-12-C1-B2')).toBeTruthy(), CHO)
    await waitFor(() => expect((within(dongBai('DH-12-C1-B2')!).getByRole('radio') as HTMLInputElement).checked).toBe(true), CHO)
    expect(document.querySelector('[data-khoi="cho-chon-bai"]')).toBeNull()
  })

  it('đổi sang lớp khác khối ⇒ bỏ bài đang chọn VÀ báo thầy', async () => {
    co = { bat: true, lop: [], sbd: [] }
    buoiMo = [BUOI('BH-1')]
    render(<DayHocLenBang />)
    await waitFor(() => expect(dongBai('DH-12-C1-B2')).toBeTruthy(), CHO)
    fireEvent.click(within(dongBai('DH-12-C1-B2')!).getByRole('radio'))
    await waitFor(() => expect(document.querySelector('[data-khoi="cho-chon-bai"]')).toBeNull())
    const chonLop = document.querySelector('[data-khoi="chon-lop-giao"]') as HTMLElement
    fireEvent.click(within(chonLop).getByRole('button', { name: /Chọn lớp/ }))
    fireEvent.click(await screen.findByRole('checkbox', { name: /^11B/ }))
    await waitFor(() => expect(document.querySelector('[data-khoi="cho-chon-bai"]')).toBeTruthy(), CHO)
    expect(m.toast).toHaveBeenCalledWith(expect.stringMatching(/Bài 2/), expect.anything())
  })
})

describe('Gọi lên bảng theo ca — bài thầy tích không bị ghi đè', () => {
  const hopDe = () => document.querySelector('[role="tree"][aria-label="Cây chọn đề"]')?.parentElement as HTMLElement
  async function moManTichBai() {
    let traBtvn: (v: unknown) => void = () => {}
    m.btvn.mockImplementation(() => new Promise((r) => (traBtvn = r)))
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(hopDe()).toBeTruthy(), CHO)
    fireEvent.change(within(hopDe()).getByLabelText('Tìm đề'), { target: { value: 'Lipid' } })
    fireEvent.click(oTich(hopDe(), /Bài 2\. Lipid/)!)
    await waitFor(() => expect(oTich(hopDe(), /Bài 2\. Lipid/)!.getAttribute('aria-checked')).toBe('true'))
    await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
    fireEvent.click(r.getByText('Ca 111111'))
    await waitFor(() => expect(m.btvn).toHaveBeenCalled(), CHO)
    traBtvn([{ maBtvn: 'B1', maCa: '111111', maDe: 'KT-12-C2', soCau: 3, giaoLuc: '2026-10-10T00:00:00Z', hanNop: '2026-10-12T00:00:00Z', quaHan: false, tong: 4, daNop: 2 }])
    await waitFor(() => expect(screen.getByRole('radio', { name: 'Chữa BTVN đã phân gần nhất' }).hasAttribute('disabled')).toBe(false), CHO)
    return r
  }

  it('danh sách BTVN về muộn KHÔNG thay bài thầy đã tích', async () => {
    await moManTichBai()
    await new Promise((r) => setTimeout(r, 50))
    expect(hopDe()).toBeTruthy()
    expect(oTich(hopDe(), /Bài 2\. Lipid/)?.getAttribute('aria-checked')).toBe('true')
  })

  it('đổi sang "Chữa BTVN" rồi về "Tôi tự chọn bài" ⇒ còn tích, còn chữ tìm, bài hiện sẵn', async () => {
    await moManTichBai()
    fireEvent.click(screen.getByRole('radio', { name: 'Chữa BTVN đã phân gần nhất' }))
    await waitFor(() => expect(hopDe()).toBeFalsy())
    fireEvent.click(screen.getByRole('radio', { name: 'Tôi tự chọn bài để chữa' }))
    await waitFor(() => expect(hopDe()).toBeTruthy())
    expect((within(hopDe()).getByLabelText('Tìm đề') as HTMLInputElement).value).toBe('Lipid')
    expect(oTich(hopDe(), /Bài 2\. Lipid/)?.getAttribute('aria-checked')).toBe('true')
  })
})
