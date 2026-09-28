// "MỞ CA CHỐT" CỦA CHIẾN DỊCH (Game Hóa 2.0): Buổi chữa ghi gói câu vào sessionStorage['ddh.caChotChienDich'];
// màn Mở ca kiểm tra đọc MỘT LẦN khi mở, tích sẵn đúng tờ (đã tách theo phần) + bộ rút = đúng các câu ấy, hiện
// "Đang mở ca chốt cho chiến dịch <tên>", rồi xoá khoá. Câu tự luận KHÔNG được rút (luật 21/09).
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'
import { KHOA_CA_CHOT, chonSanCaChot, chuBaoCaChot, docGoiCaChot } from '../src/lib/ca-chot-chien-dich'
import { tachNhieuTheoPhan } from '../src/lib/tach-phan-de'

const de = (maDe: string, nI: number, nII: number, nIII: number, tuLuanIII = false): TeacherExamSource => ({
  maDe,
  nhom: '12 · CI - Ester lipid',
  nguon: `Nguồn ${maDe}`,
  phanI: Array.from({ length: nI }, (_, i) => ({ id: `${maDe}-I-${i + 1}`, text: `Câu ${maDe} phần I số ${i + 1}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester' })) as never,
  phanII: Array.from({ length: nII }, (_, i) => ({ id: `${maDe}-II-${i + 1}`, text: `Câu ${maDe} phần II số ${i + 1}`, ideas: ['a', 'b', 'c', 'd'], correct: 'DDDD' })) as never,
  phanIII: Array.from({ length: nIII }, (_, i) => ({
    id: `${maDe}-III-${i + 1}`,
    text: tuLuanIII ? `Giải thích vì sao ester số ${i + 1} có mùi thơm` : `Tính số mol ${maDe} ${i + 1}`,
    correct: tuLuanIII ? 'Vì ester có phân tử khối nhỏ nên dễ bay hơi và mùi thơm đặc trưng' : '1',
  })) as never,
})

const KHO = [de('12-C1-B2', 10, 4, 3, true), de('11-C1-B1', 8, 2, 0)]

const { toast } = vi.hoisted(() => ({ toast: vi.fn() }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => [],
  publishSession: vi.fn(),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => '',
  loadTeacherSecret: async () => '',
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
  docSoCauCa: async () => undefined,
  luuSoCauCa: vi.fn(),
  saveSessionTeacherBank: vi.fn(),
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => null }))
vi.mock('../src/components/NutDongBo', () => ({ default: () => null }))
vi.mock('../src/components/KhoiRutDe', () => ({ default: () => null }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: toast, classList: [], moChiTietCa: vi.fn() }),
}))

const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')

afterEach(() => {
  cleanup()
  sessionStorage.clear()
})

const GOI = { chienDichId: 'cd1', ten: 'Ester tuần 39', lop: '12A1', qids: ['12-C1-B2-I-3', '12-C1-B2-I-7', '11-C1-B1-II-2', '12-C1-B2-III-1', 'KHONG-CO-I-1'] }

describe('lõi chọn sẵn ca chốt', () => {
  it('tìm đúng câu theo mã câu máy chủ, tích đúng tờ đã tách, bỏ câu tự luận, đếm câu thiếu', () => {
    const kq = chonSanCaChot(tachNhieuTheoPhan(KHO), GOI.qids)
    expect([...kq.ids].sort()).toEqual(['11-C1-B1-II-2', '12-C1-B2-I-3', '12-C1-B2-I-7'].sort())
    expect(kq.soCau).toEqual({ I: 2, II: 1, III: 0 })
    expect(kq.soKhop).toBe(3)
    expect(kq.soTuLuan).toBe(1)
    expect(kq.soThieu).toBe(1)
    expect(kq.maDe.length).toBe(2)
    expect(chuBaoCaChot(GOI as never, kq)).toBe('Đang mở ca chốt cho chiến dịch Ester tuần 39 · đã chọn sẵn 3/5 câu · 1 câu không có trong Ngân hàng đề trên máy này · bỏ 1 câu tự luận')
  })

  it('gói sai dạng / rỗng ⇒ null', () => {
    sessionStorage.setItem(KHOA_CA_CHOT, '{hỏng')
    expect(docGoiCaChot()).toBeNull()
    sessionStorage.setItem(KHOA_CA_CHOT, JSON.stringify({ ten: 'x', qids: [] }))
    expect(docGoiCaChot()).toBeNull()
  })
})

describe('màn Mở ca kiểm tra đọc gói ca chốt', () => {
  it('tích sẵn tờ + câu, hiện dòng "Đang mở ca chốt…", điền lớp + tên ca, rồi xoá khoá', async () => {
    sessionStorage.setItem(KHOA_CA_CHOT, JSON.stringify(GOI))
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('2 đề đã chọn · 3 câu'))
    expect(screen.getByText(/^Đang mở ca chốt cho chiến dịch Ester tuần 39 · đã chọn sẵn 3\/5 câu/)).toBeTruthy()
    expect(container.textContent).toContain('Chế độ rút: 2 câu I · 1 câu II · 0 câu III')
    expect(sessionStorage.getItem(KHOA_CA_CHOT)).toBeNull()
    expect((screen.getByDisplayValue('Ca chốt · Ester tuần 39') as HTMLInputElement).value).toBe('Ca chốt · Ester tuần 39')
  })

  it('không có gói ⇒ màn như cũ (không dòng ca chốt, không tích sẵn)', async () => {
    const { container } = render(<ExamSetupScreen />)
    await waitFor(() => expect(container.textContent).toContain('Chưa chọn đề kiểm tra'))
    expect(container.querySelector('[data-khoi="ca-chot"]')).toBeNull()
    expect(container.textContent).not.toContain('Đang mở ca chốt')
  })
})
