// BTVN NÂNG ĐỠ — nối vào màn GIAO BÀI thật (PhanCongScreen): công tắc mặc định BẬT, ghim tuỳ chọn (ghim=[] vẫn giao được), tắt = như cũ,
// máy chủ chưa hỗ trợ ⇒ cảnh báo "giao NHƯ CŨ", Xem trước dùng đúng hạt giống + người nhận.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import PhanCongScreen from '../src/screens/PhanCongScreen'

const m = vi.hoisted(() => ({ giao: vi.fn(), theoDoi: vi.fn(), xemTruoc: vi.fn(), nguon: [] as unknown[] }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => '/test', loadTeacherSecret: async () => 'test', loadExamSources: async () => m.nguon }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: '/test' }) }))
vi.mock('../src/lib/exam-api', () => ({ danhSachCa: async () => [{ maCa: 'CA', tenCa: 'Ca thử', daVao: 2, daNop: 2, lop: '12A1' }], danhSachEm: async () => [], khoiTuNamSinh: () => 12 }))
vi.mock('../src/lib/day-ca-may-chu-moi', () => ({ luotCuaCaMoi: async () => [{ sbd: '001', ho_ten: 'Lê Minh Đức' }, { sbd: '002', ho_ten: 'Trần Thu Hà' }] }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ giaoBtvn: (...a: unknown[]) => m.giao(...a), theoDoiBtvn: (...a: unknown[]) => m.theoDoi(...a), suaGiaoBtvn: vi.fn() }))
vi.mock('../src/lib/btvn-nang-do-thay', async (goc) => ({ ...(await goc<typeof import('../src/lib/btvn-nang-do-thay')>()), xemTruocPhanBo: (...a: unknown[]) => m.xemTruoc(...a) }))
vi.mock('../src/lib/hom-nay-api', () => ({ layHomNay: async () => null }))
vi.mock('../src/components/HopChonDe', () => ({ default: ({ onChon }: { onChon: (m: string) => void }) => <button onClick={() => onChon('D-TN')}>Chọn đề mẫu</button> }))
vi.mock('../src/components/NhomCaThuGon', () => ({ default: ({ ds, render }: { ds: unknown[]; render: (x: unknown) => unknown }) => <div>{ds.map(render as never)}</div> }))
vi.mock('../src/components/HocSinhNhanBai', () => ({ default: () => null }))

const cau = (i: number) => ({ id: `D-TN-I-${i}`, text: `Câu ${i}`, options: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester', mucDo: i % 2 ? 'hieu' : 'biet', dang: i === 1 ? { ma: 'ESTE_KN', ten: 'Este' } : null, canChua: { sao: 2 } })
const kho = [{ maDe: 'D-TN', nhom: '12 · C1', nguon: 'Bài 1', phanI: [cau(1), cau(2), cau(3)], phanII: [], phanIII: [] }]

beforeEach(() => {
  m.nguon = kho
  m.theoDoi.mockResolvedValue([])
  m.giao.mockResolvedValue({ maBtvn: 'B1', soEm: 2, soCau: 3, hanNop: '2026-09-25T15:00:00Z', caNhan: true, soLoi: 3 })
  m.xemTruoc.mockResolvedValue({ hatGiong: 'g', soCauBai: 3, soLoi: 3, loi: [], ds: [], chiTiet: null })
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: [{ maDe: 'D-TN', tenDe: 'Đề thử', soCau: 3 }] }) }))
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

async function moManGiao() {
  render(<PhanCongScreen />)
  await waitFor(() => expect(m.theoDoi).toHaveBeenCalled())
  fireEvent.click(screen.getAllByRole('button', { name: /Giao bài mới/ })[0])
  await screen.findByText('Chọn đề mẫu')
  fireEvent.click(screen.getByText('Ca thử').closest('button')!)
  fireEvent.click(screen.getByText('Chọn đề mẫu'))
  await screen.findByRole('switch', { name: 'Cá nhân hoá (khuyên dùng)' })
}

describe('màn Giao bài · Cá nhân hoá', () => {
  it('công tắc mặc định BẬT; KHÔNG ghim câu nào vẫn giao được: payload có caNhan (cau đủ 3 câu, ghim=[], hạt giống)', async () => {
    await moManGiao()
    expect(screen.getByRole('switch').getAttribute('aria-checked')).toBe('true')
    expect(screen.getByText('0', { selector: '.bn-o--phu .bn-o-so' })).toBeTruthy() // 0 câu ghim, không cảnh báo
    fireEvent.click(screen.getByRole('button', { name: /Giao bài tập/ }))
    await waitFor(() => expect(m.giao).toHaveBeenCalledTimes(1))
    const nangDo = m.giao.mock.calls[0][7] as { cau: { qid: string; dang: string | null; mucDo: number; sao: number; phan: string }[]; ghim: string[]; hatGiong: string }
    expect(nangDo.ghim).toEqual([])
    expect(nangDo.cau.map((c) => c.qid)).toEqual(['D-I-1', 'D-I-2', 'D-I-3'])
    expect(nangDo.cau[0]).toMatchObject({ dang: 'ESTE_KN', mucDo: 1, sao: 2, phan: 'I' })
    expect(nangDo.cau[1]).toMatchObject({ dang: null, mucDo: 0 })
    expect(nangDo.hatGiong.length).toBeGreaterThan(5)
    expect(await screen.findByText(/Mỗi em một bộ riêng, lõi chung 3 câu\./)).toBeTruthy()
  })

  it('TẮT công tắc → giao NHƯ CŨ: không gửi nangDo (tham số cuối vắng)', async () => {
    await moManGiao()
    fireEvent.click(screen.getByRole('switch'))
    expect(screen.getByText(/Đang tắt — cả lớp nhận đủ 3 câu như cũ\./)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Giao bài tập/ }))
    await waitFor(() => expect(m.giao).toHaveBeenCalledTimes(1))
    expect(m.giao.mock.calls[0][7]).toBeUndefined()
  })

  it('ghim câu: tick → gửi đúng qid ghim; đổi tờ đề thì câu ghim không còn trong bài tự rơi ra', async () => {
    await moManGiao()
    fireEvent.click(screen.getByRole('button', { name: 'Chọn câu để ghim…' }))
    fireEvent.click(within(screen.getByRole('group', { name: 'Chọn câu để ghim' })).getAllByRole('checkbox')[1])
    fireEvent.click(screen.getByRole('button', { name: /Giao bài tập/ }))
    await waitFor(() => expect(m.giao).toHaveBeenCalledTimes(1))
    expect((m.giao.mock.calls[0][7] as { ghim: string[] }).ghim).toEqual(['D-I-2'])
  })

  it('máy chủ chưa hỗ trợ (không trả caNhan) → cảnh báo cam "đã giao NHƯ CŨ" + số câu thật', async () => {
    m.giao.mockResolvedValue({ maBtvn: 'B1', soEm: 2, soCau: 80, hanNop: '2026-09-25T15:00:00Z', caNhan: false })
    await moManGiao()
    fireEvent.click(screen.getByRole('button', { name: /Giao bài tập/ }))
    expect(await screen.findByText('Máy chủ chưa hỗ trợ cá nhân hoá — bài này đã giao NHƯ CŨ: cả lớp nhận đủ 80 câu, không phân bổ riêng từng em.')).toBeTruthy()
    expect(screen.queryByText(/Mỗi em một bộ riêng/)).toBeNull()
  })

  it('cảnh báo của máy chủ: lõi dưới 6 câu · qid lạ bị bỏ · câu thiếu dạng/mức — nói thật, bài vẫn giao', async () => {
    m.giao.mockResolvedValue({ maBtvn: 'B1', soEm: 2, soCau: 3, hanNop: '2026-09-25T15:00:00Z', caNhan: true, soLoi: 3, canhBao: 'loi_it_hon_6', boQuaQid: ['Z1', 'Z2'], thieuMeta: 1 })
    await moManGiao()
    fireEvent.click(screen.getByRole('button', { name: /Giao bài tập/ }))
    expect(await screen.findByText(/Lõi chung chỉ có 3 câu \(dưới 6\)/)).toBeTruthy()
    expect(screen.getByText(/Máy chủ không nhận 2 mã câu máy thầy gửi \(lệch mã với tờ đề trong kho\)/)).toBeTruthy()
    expect(screen.getByText(/1 câu máy thầy không gửi được nhãn dạng\/mức — máy chủ lấy từ tờ kho/)).toBeTruthy()
  })

  it('Xem trước phân bổ: mở tấm phủ; gọi máy chủ với người nhận = em có lượt trong ca đã tick + CÙNG hạt giống với lúc giao; ghim rỗng hợp lệ', async () => {
    await moManGiao()
    fireEvent.click(screen.getByRole('button', { name: /Xem trước phân bổ/ }))
    await waitFor(() => expect(m.xemTruoc).toHaveBeenCalledTimes(1))
    const v = m.xemTruoc.mock.calls[0][0] as { dsSbd: string[]; dsMaDe: string[]; ghim: string[]; hatGiong: string; cau: unknown[]; hanNop: string; sbdChiTiet: string }
    expect(v.dsSbd).toEqual(['001', '002'])
    expect(v.dsMaDe).toEqual(['D-TN'])
    expect(v.ghim).toEqual([])
    expect(v.cau).toHaveLength(3)
    expect(v.sbdChiTiet).toBe('001')
    expect(Date.parse(v.hanNop)).toBeGreaterThan(0)
    expect(screen.getByRole('dialog', { name: 'Xem trước phân bổ' })).toBeTruthy()
    // giao ngay trong tấm phủ → dùng ĐÚNG hạt giống đã xem trước, rồi tấm phủ đóng
    fireEvent.click(screen.getByRole('button', { name: 'Giao bài cho 2 em' }))
    await waitFor(() => expect(m.giao).toHaveBeenCalledTimes(1))
    expect((m.giao.mock.calls[0][7] as { hatGiong: string }).hatGiong).toBe(v.hatGiong)
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Xem trước phân bổ' })).toBeNull())
  })

  it('lệnh giao bị từ chối khi đang ở Xem trước: lỗi hiện NGAY trong tấm phủ (màn dưới bị che), tấm phủ giữ nguyên', async () => {
    m.giao.mockRejectedValueOnce(new Error('Không giao được bài thử'))
    await moManGiao()
    fireEvent.click(screen.getByRole('button', { name: /Xem trước phân bổ/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Giao bài cho 2 em' }))
    const hop = screen.getByRole('dialog', { name: 'Xem trước phân bổ' })
    await waitFor(() => expect(hop.textContent).toContain('Không giao được bài thử'))
  })

  it('chưa tick đề: Xem trước và Chọn câu để ghim tắt (không có câu nào để phân bổ)', async () => {
    render(<PhanCongScreen />)
    await waitFor(() => expect(m.theoDoi).toHaveBeenCalled())
    fireEvent.click(screen.getAllByRole('button', { name: /Giao bài mới/ })[0])
    await screen.findByRole('switch', { name: 'Cá nhân hoá (khuyên dùng)' })
    expect((screen.getByRole('button', { name: /Xem trước phân bổ/ }) as HTMLButtonElement).disabled).toBe(true)
  })
})
