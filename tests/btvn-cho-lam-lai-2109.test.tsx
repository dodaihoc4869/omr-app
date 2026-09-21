// BTVN NÂNG ĐỠ — NÚT "CHO LÀM LẠI" từng em (thầy chốt 21/09: bài cá nhân hoá KHÔNG tự cho làm lại). Lệnh thầy `POST /btvn/cho-lam-lai {maBtvn, sbd}` (Code 3);
// chỉ em ĐÃ NỘP của bài cá nhân hoá, chưa quá hạn. MỘT bước xác nhận nói thật; báo đúng kết quả máy chủ (chưa có lệnh · quá hạn · chưa chắc ⇒ lời thật). Bài cũ giữ y như trước.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import HocSinhNhanBai from '../src/components/HocSinhNhanBai'
import PhanCongScreen from '../src/screens/PhanCongScreen'
import type { DongTheoDoiBtvn } from '../src/lib/btvn-may-chu-moi'

const m = vi.hoisted(() => ({ theoDoi: vi.fn(), lamLai: vi.fn(), sua: vi.fn() }))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => '/test', loadTeacherSecret: async () => 'mat-thu', loadExamSources: async () => [] }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-api', () => ({ danhSachCa: async () => [], danhSachEm: async () => [], khoiTuNamSinh: () => 12 }))
vi.mock('../src/lib/day-ca-may-chu-moi', () => ({ luotCuaCaMoi: async () => [] }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ giaoBtvn: vi.fn(), theoDoiBtvn: (...a: unknown[]) => m.theoDoi(...a), suaGiaoBtvn: (...a: unknown[]) => m.sua(...a) }))
vi.mock('../src/lib/btvn-nang-do-thay', async (goc) => ({ ...(await goc<typeof import('../src/lib/btvn-nang-do-thay')>()), choLamLaiBtvn: (...a: unknown[]) => m.lamLai(...a) }))
vi.mock('../src/lib/hom-nay-api', () => ({ layHomNay: async () => null }))
vi.mock('../src/components/NhomCaThuGon', () => ({ default: ({ ds, render }: { ds: unknown[]; render: (x: unknown) => unknown }) => <div>{ds.map(render as never)}</div> }))
vi.mock('../src/components/BaiNopBtvn', () => ({ default: () => null }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const em = (o: Record<string, unknown>) => ({ sbd: '001', hoTen: 'Lê Minh Đức', nopLuc: null, soDung: null, soCau: null, thuHoi: false, ...o })
const NOP = '2026-09-23T03:00:00Z'
const bai = (o: Partial<DongTheoDoiBtvn>, hs: Record<string, unknown>[]): DongTheoDoiBtvn =>
  ({ maBtvn: 'B1', maCa: 'C1', maDe: 'D1', soCau: 80, giaoLuc: '2026-09-21T01:00:00Z', hanNop: '2026-09-28T15:00:00Z', quaHan: false, tong: hs.length, daNop: hs.filter((h) => h.nopLuc).length, chuaNop: [], hocSinh: hs, ...o }) as unknown as DongTheoDoiBtvn
const dung = (b: DongTheoDoiBtvn, onAction = vi.fn()) => {
  render(<HocSinhNhanBai maTheoSbd={{}} bai={b} busy={false} onAction={onAction} />)
  return onAction
}
const HS = [em({ sbd: '001', hoTen: 'Lê Minh Đức', nopLuc: NOP, soDung: 30, soCau: 46 }), em({ sbd: '002', hoTen: 'Trần Thu Hà', nopLuc: null }), em({ sbd: '003', hoTen: 'Vũ Đức An', nopLuc: NOP, thuHoi: true })]

describe('HocSinhNhanBai — nút "Cho làm lại" của bài cá nhân hoá', () => {
  it('CHỈ em ĐÃ NỘP (chưa thu hồi) có nút; bấm ⇒ hành động riêng "cho-lam-lai", KHÔNG phải "reset" cũ', () => {
    const onAction = dung(bai({ caNhan: true }, HS))
    const nut = screen.getAllByRole('button', { name: 'Cho làm lại' })
    expect(nut).toHaveLength(1) // 001 đã nộp; 002 chưa nộp; 003 đã thu hồi
    fireEvent.click(nut[0])
    expect(onAction).toHaveBeenCalledWith('001', 'cho-lam-lai')
    expect(onAction).not.toHaveBeenCalledWith('001', 'reset')
  })

  it('bài đã QUÁ HẠN: không có nút, nói rõ "gia hạn bài rồi mới cho làm lại" (máy chủ sẽ từ chối)', () => {
    const { container } = render(<HocSinhNhanBai maTheoSbd={{}} bai={bai({ caNhan: true, quaHan: true }, HS)} busy={false} onAction={() => {}} />)
    expect(screen.queryByRole('button', { name: 'Cho làm lại' })).toBeNull()
    expect(container.querySelectorAll('[data-khoi="cho-lam-lai-qua-han"]')).toHaveLength(1)
    expect(container.textContent).toContain('Quá hạn — gia hạn bài rồi mới cho làm lại')
  })

  it('bài CŨ (không caNhan): y như trước — nút cho MỌI em, hành động "reset"', () => {
    const onAction = dung(bai({}, HS))
    const nut = screen.getAllByRole('button', { name: 'Cho làm lại' })
    expect(nut).toHaveLength(3)
    fireEvent.click(nut[0])
    expect(onAction.mock.calls.at(-1)![1]).toBe('reset')
    expect(document.body.textContent).not.toContain('Quá hạn — gia hạn')
  })
})

describe('choLamLaiBtvn — lệnh /btvn/cho-lam-lai, nói thật', () => {
  const chay = async (res: () => unknown) => {
    const goi = vi.fn()
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      goi(url, JSON.parse(String(init.body)), init.headers)
      return res()
    })
    const { choLamLaiBtvn } = await vi.importActual<typeof import('../src/lib/btvn-nang-do-thay')>('../src/lib/btvn-nang-do-thay')
    return { goi, choLamLaiBtvn }
  }
  beforeEach(() => {
    vi.resetModules()
  })

  it('gửi {maBtvn, sbd} + mã bí mật tới đúng lệnh; trả soLanLam', async () => {
    const { goi, choLamLaiBtvn } = await chay(() => ({ status: 200, ok: true, json: async () => ({ ok: true, soLanLam: 2 }) }))
    expect(await choLamLaiBtvn('C1-abc', '001')).toEqual({ soLanLam: 2 })
    expect(goi).toHaveBeenCalledWith('https://may.test/btvn/cho-lam-lai', { maBtvn: 'C1-abc', sbd: '001' }, expect.objectContaining({ 'x-ma-bi-mat': 'mat-thu' }))
    const khong = await chay(() => ({ status: 200, ok: true, json: async () => ({ ok: true }) }))
    expect(await khong.choLamLaiBtvn('C1', '1')).toEqual({ soLanLam: null }) // không bịa số lần
  })

  it('máy chủ chưa có lệnh (404) ⇒ lời thật, kết quả của em giữ nguyên', async () => {
    const { choLamLaiBtvn } = await chay(() => ({ status: 404, ok: false, json: async () => ({}) }))
    await expect(choLamLaiBtvn('C1', '001')).rejects.toThrow(/chưa có lệnh Cho làm lại.*Kết quả của em vẫn giữ nguyên/)
  })

  it('máy chủ từ chối (vd quá hạn) ⇒ giữ NGUYÊN câu của máy chủ; không đọc được ⇒ CHƯA CHẮC', async () => {
    const { choLamLaiBtvn } = await chay(() => ({ status: 200, ok: true, json: async () => ({ ok: false, error: 'Bài đã quá hạn — gia hạn bài trước rồi mới cho làm lại.' }) }))
    await expect(choLamLaiBtvn('C1', '001')).rejects.toThrow('Bài đã quá hạn — gia hạn bài trước rồi mới cho làm lại.')
    const hong = await chay(() => ({ status: 200, ok: true, json: async () => { throw new Error('x') } }))
    await expect(hong.choLamLaiBtvn('C1', '001')).rejects.toThrow(/CHƯA CHẮC/)
  })

  it('quá hạn chờ ⇒ "CHƯA CHẮC đã cho em làm lại" (lệnh có thể đã tới); mất mạng ⇒ chưa làm được', async () => {
    vi.stubGlobal('fetch', async () => {
      const e = new Error('abort')
      e.name = 'AbortError'
      throw e
    })
    const { choLamLaiBtvn } = await vi.importActual<typeof import('../src/lib/btvn-nang-do-thay')>('../src/lib/btvn-nang-do-thay')
    await expect(choLamLaiBtvn('C1', '001')).rejects.toThrow(/CHƯA CHẮC đã cho em làm lại/)
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('offline')
    })
    await expect(choLamLaiBtvn('C1', '001')).rejects.toThrow(/Không nối được máy chủ — chưa cho em làm lại được/)
  })
})

describe('màn Giao bài · tab đã giao — Cho làm lại từng em (một bước xác nhận nói thật)', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: [] }) })) // kho đề trống — màn này chỉ cần tab đã giao
    m.theoDoi.mockResolvedValue([bai({ caNhan: true, soLoi: 26 }, HS)])
    m.lamLai.mockResolvedValue({ soLanLam: 2 })
  })
  const moXacNhan = async () => {
    render(<PhanCongScreen />)
    // Thiết kế lại 21/09: danh sách em + thao tác từng em nằm sau nút ⋯ → "Xem bài làm" (sửa CÓ CHỦ Ý; hộp xác nhận vẫn là hộp cũ).
    fireEvent.click(await screen.findByRole('button', { name: /Thêm thao tác cho/ }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Xem bài làm' }))
    await screen.findByText('Lê Minh Đức')
    fireEvent.click(screen.getByRole('button', { name: 'Cho làm lại' }))
    return await screen.findByRole('dialog', { name: 'Xác nhận thay đổi bài tập' })
  }

  it('hỏi lại bằng lời NÓI THẬT (làm lại từ chặng 1, cùng bộ câu, hạn không đổi, điểm cũ vào lịch sử); Giữ nguyên thì KHÔNG gọi máy chủ', async () => {
    const hop = await moXacNhan()
    expect(hop.textContent).toContain('Cho Lê Minh Đức làm lại?')
    expect(hop.textContent).toContain('Em làm lại từ chặng 1, cùng bộ câu, hạn nộp không đổi; điểm mới thay điểm cũ, điểm cũ vẫn lưu trong lịch sử.')
    fireEvent.click(within(hop).getByRole('button', { name: 'Giữ nguyên' }))
    expect(screen.queryByRole('dialog', { name: 'Xác nhận thay đổi bài tập' })).toBeNull() // hộp Bài làm (mục thiết kế lại) vẫn mở phía sau
    expect(m.lamLai).not.toHaveBeenCalled()
    expect(m.sua).not.toHaveBeenCalled()
  })

  it('Bấm "Cho làm lại" trong hộp ⇒ gọi /btvn/cho-lam-lai (KHÔNG phải /btvn/sua) với mã bài + SBD; báo kết quả thật + tải lại danh sách', async () => {
    const hop = await moXacNhan()
    fireEvent.click(within(hop).getByRole('button', { name: 'Cho làm lại' }))
    await waitFor(() => expect(m.lamLai).toHaveBeenCalledWith('B1', '001'))
    expect(m.sua).not.toHaveBeenCalled()
    expect(await screen.findByText(/Đã cho Lê Minh Đức làm lại \(lượt làm thứ 2\): em làm lại từ chặng 1, cùng bộ câu, hạn nộp không đổi\./)).toBeTruthy()
    await waitFor(() => expect(m.theoDoi.mock.calls.length).toBeGreaterThanOrEqual(2)) // đã tải lại
  })

  it('máy chủ từ chối / chưa có lệnh ⇒ hiện ĐÚNG lời ấy, KHÔNG nói "đã cho làm lại"', async () => {
    m.lamLai.mockRejectedValue(new Error('Máy chủ chưa có lệnh Cho làm lại — chưa mở lại được bài. Kết quả của em vẫn giữ nguyên.'))
    const hop = await moXacNhan()
    fireEvent.click(within(hop).getByRole('button', { name: 'Cho làm lại' }))
    expect(await screen.findByText(/Máy chủ chưa có lệnh Cho làm lại — chưa mở lại được bài/)).toBeTruthy()
    expect(screen.queryByText(/Đã cho Lê Minh Đức làm lại/)).toBeNull()
  })

  it('bài bị giao THEO CA (mã bài của em khác mã hiển thị) ⇒ dùng đúng maTheoSbd[sbd]', async () => {
    // hai dòng bài cùng một lần giao (cùng giaoLuc + đề) nhưng khác ca: em 001 thuộc dòng "CA2-xyz"
    m.theoDoi.mockResolvedValue([bai({ caNhan: true }, [HS[1]]), bai({ caNhan: true, maBtvn: 'CA2-xyz', maCa: 'C2' }, [HS[0]])])
    const hop = await moXacNhan()
    fireEvent.click(within(hop).getByRole('button', { name: 'Cho làm lại' }))
    await waitFor(() => expect(m.lamLai).toHaveBeenCalledWith('CA2-xyz', '001'))
  })
})
