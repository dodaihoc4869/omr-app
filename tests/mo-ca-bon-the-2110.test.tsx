// MÀN MỞ CA GỌN — BỐN THẺ CÁCH RA ĐỀ (thầy chốt 21/10: "chốt mọi thứ bạn làm luôn đi").
//
//   1. Một tầng, bốn thẻ: Cả lớp cùng một đề · Đề riêng từng em · Kiểm tra điểm yếu · Kiểm chứng câu đã đúng.
//   2. Kho lớn ⇒ KHÔNG có "Trọn đề" (bỏ bẫy mỗi em bốc ngẫu nhiên 18/4/6 khác nhau).
//   3. Chế độ giữ ở màn — đi bước khác rồi quay lại không mất (lỗi cũ: mở lại hộp Rút đề kéo về Rút đề thông minh).
//   4. Đề riêng: MỘT công tắc "Có câu chữa lỗi"; tắt ⇒ phamViHoiLai 'khong' lên máy chủ.
//   5. Chuẩn Bộ 2026 tích lẫn đề khác ⇒ KHÔNG tự bật, có chip; bật ⇒ báo + nút "Chỉ dùng bộ đề 12".
//   6. Dòng "Cách ra đề" nói đúng thứ gửi lên máy chủ.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'
import { chuCachRaDe } from '../src/lib/chu-cach-ra-de'

const tn = (p: string, i: number, muc = 'hieu') => ({ id: `${p}${i}`, text: `TN ${p}${i}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: i % 2 ? 'Ester' : 'Lipid', mucDo: muc })
const KHO_DAY = [{ maDe: '12-C1-B1', nhom: '12 · C1 - Ester lipid', nguon: 'Bài 1', phanI: Array.from({ length: 40 }, (_, i) => tn('q', i)), phanII: [], phanIII: [] }] as unknown as TeacherExamSource[]
const BO_DE_12 = { maDe: 'BD-01', nhom: '12 · bộ đề', nguon: 'Đề 1', phanI: Array.from({ length: 18 }, (_, i) => tn('bd', i, i < 11 ? 'biet' : i < 15 ? 'hieu' : 'van_dung')), phanII: [], phanIII: [] }
const KHO_LAN = [BO_DE_12, KHO_DAY[0]] as unknown as TeacherExamSource[]

const khoHienTai = vi.hoisted(() => ({ ds: [] as unknown[] }))
const publishSession = vi.fn(async () => ({ batDau: '', hetHanVao: '' }))

vi.mock('../src/lib/exam-api', async (goc) => ({ ...(await goc<Record<string, unknown>>()), publishSession, danhSachEm: async () => [] }))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => khoHienTai.ds,
  loadAllSessionTeacherBanks: async () => [],
  docSoCauCa: async () => undefined,
  luuSoCauCa: async () => {},
  saveSessionTeacherBank: async () => {},
  luuCheDoDeRieng: async () => {},
  luuKhoChuaCa: async () => {},
}))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu.test' }))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => ({ moi: [], capNhat: [], canXem: [] }) }))
vi.mock('../src/lib/ca-link', () => ({ randomSessionCode: () => '123456', taoLinkMoiTrucTiep: () => 'https://link' }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: vi.fn(), moChiTietCa: vi.fn(), classList: [] }),
}))

const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')

afterEach(() => {
  cleanup()
  publishSession.mockClear()
})

const HAN = 60000
const tomTat = (r: ReturnType<typeof render>) => r.container.querySelector('[data-khoi="tom-tat-cach-ra-de"]')?.textContent ?? ''
const the = (r: ReturnType<typeof render>, ten: RegExp) => r.getByRole('radio', { name: ten })

async function dung(ds: unknown[]) {
  khoHienTai.ds = ds
  const r = render(<ExamSetupScreen />)
  await waitFor(() => expect(r.container.textContent).toContain('Bộ câu ra đề'), { timeout: 20000 })
  return r
}
async function moCa(r: ReturnType<typeof render>) {
  fireEvent.change(r.getByLabelText('Lớp của ca kiểm tra'), { target: { value: '12A1' } })
  fireEvent.click(r.getAllByRole('button').find((e) => /Mở ca kiểm tra ngay/.test(e.textContent ?? ''))!)
  await waitFor(() => expect(publishSession).toHaveBeenCalled(), { timeout: 20000 })
  return publishSession.mock.calls.at(-1) as unknown as unknown[]
}

describe('bốn thẻ, một tầng', () => {
  it('đủ bốn thẻ; mặc định Cả lớp cùng một đề; kho lớn ⇒ KHÔNG có "Trọn đề"; không còn chip/hộp Rút đề cũ', async () => {
    const r = await dung(KHO_DAY)
    const ten = r.getAllByRole('radio').map((e) => e.querySelector('b')?.textContent)
    expect(ten).toEqual(['Cả lớp cùng một đề', 'Đề riêng từng em', 'Kiểm tra điểm yếu', 'Kiểm chứng câu đã đúng'])
    expect(the(r, /^Cả lớp cùng một đề/).getAttribute('aria-checked')).toBe('true')
    expect(r.queryByRole('checkbox', { name: /^Trọn đề/ })).toBeNull()
    expect(r.container.textContent).not.toContain('Lấy nguyên đề')
    expect(r.container.textContent).not.toContain('Mỗi em một bộ câu riêng')
    expect(r.container.textContent).not.toContain('Rút đề theo số câu & dạng bài')
    await waitFor(() => expect(tomTat(r)).toBe('Cả lớp cùng một đề · rút 9 · 0 · 0 câu'), { timeout: 20000 })
  }, HAN)

  it('chọn Kiểm chứng câu đã đúng, đi bước Giờ rồi quay lại ⇒ VẪN Kiểm chứng; mở ca gửi da_dung + đề riêng', async () => {
    const r = await dung(KHO_DAY)
    fireEvent.click(the(r, /^Kiểm chứng câu đã đúng/))
    fireEvent.click(r.getByRole('button', { name: /Bước tiếp/ }))
    fireEvent.click(r.getByRole('button', { name: /Bước trước/ }))
    expect(the(r, /^Kiểm chứng câu đã đúng/).getAttribute('aria-checked')).toBe('true')
    expect(tomTat(r)).toMatch(/^Kiểm chứng câu đã đúng · mỗi em một bộ riêng/)
    const goi = await moCa(r)
    expect(goi[7]).toMatchObject({ deRieng: true, phamViHoiLai: 'da_dung', phongCho: true, lenBang: false })
  }, HAN)

  it('Đề riêng từng em: tắt "Có câu chữa lỗi" ⇒ máy chủ nhận khong (100% câu mới), dòng tóm tắt nói đúng', async () => {
    const r = await dung(KHO_DAY)
    fireEvent.click(the(r, /^Đề riêng từng em/))
    const ct = r.getByRole('switch', { name: 'Có câu chữa lỗi' }) as HTMLInputElement
    expect(ct.checked).toBe(true)
    fireEvent.click(ct)
    expect(tomTat(r)).toMatch(/^Đề riêng từng em · 100% câu mới/)
    const goi = await moCa(r)
    expect(goi[7]).toMatchObject({ deRieng: true, phamViHoiLai: 'khong', phongCho: true })
  }, HAN)

  it('Kiểm tra điểm yếu đặt ca 15 phút, gửi lên bảng + gan_nhat', async () => {
    const r = await dung(KHO_DAY)
    fireEvent.click(the(r, /^Kiểm tra điểm yếu/))
    const goi = await moCa(r)
    expect(goi[3]).toBe(15)
    expect(goi[7]).toMatchObject({ lenBang: true, deRieng: true, phamViHoiLai: 'gan_nhat' })
  }, HAN)
})

describe('Chuẩn Bộ 2026 không còn bỏ đề âm thầm', () => {
  it('tích lẫn đề khác ⇒ không tự bật; bấm chip ⇒ báo + "Chỉ dùng bộ đề 12" bỏ đúng đề ngoài', async () => {
    khoHienTai.ds = KHO_LAN
    const r = render(<ExamSetupScreen />)
    await waitFor(() => expect(r.getAllByRole('button', { name: /Chọn đề kiểm tra/ }).length).toBeGreaterThan(0), { timeout: 20000 })
    fireEvent.click(r.getAllByRole('button', { name: /Chọn đề kiểm tra/ })[0]!)
    await waitFor(() => expect(r.getByRole('button', { name: /^Chọn hết/ })).toBeTruthy(), { timeout: 20000 })
    fireEvent.click(r.getByRole('button', { name: /^Chọn hết/ }))
    fireEvent.click(r.getByRole('button', { name: 'Xong' }))
    await waitFor(() => expect(r.container.textContent).toContain('Bộ câu ra đề'), { timeout: 20000 })
    expect(tomTat(r)).not.toContain('Chuẩn Bộ 2026')
    expect(r.container.querySelector('[data-khoi="lan-de-ngoai-12"]')).toBeNull()
    fireEvent.click(r.getByRole('checkbox', { name: 'Chuẩn Bộ 2026 · 50 phút' }))
    expect(tomTat(r)).toBe('Cả lớp cùng một đề · Chuẩn Bộ 2026 (18 · 4 · 6 theo ma trận)')
    const bao = r.container.querySelector('[data-khoi="lan-de-ngoai-12"]')
    expect(bao?.textContent).toMatch(/1 đề đã tích không thuộc nhóm 12 · bộ đề/)
    fireEvent.click(r.getByRole('button', { name: 'Chỉ dùng bộ đề 12' }))
    expect(r.container.querySelector('[data-khoi="lan-de-ngoai-12"]')).toBeNull()
    expect(tomTat(r)).toBe('Cả lớp cùng một đề · Chuẩn Bộ 2026 (18 · 4 · 6 theo ma trận)')
  }, HAN)
})

describe('chuCachRaDe — dòng tóm tắt theo đúng cờ gửi máy chủ', () => {
  it('mỗi tổ hợp một câu, ưu tiên đúng thứ tự cờ', () => {
    const s = { I: 9, II: 2, III: 3 }
    expect(chuCachRaDe({ chuan2026: true, deRieng: false, lenBang: false, soCau: { I: 18, II: 4, III: 6 } })).toBe('Cả lớp cùng một đề · Chuẩn Bộ 2026 (18 · 4 · 6 theo ma trận)')
    expect(chuCachRaDe({ chuan2026: false, deRieng: true, lenBang: false, phamViHoiLai: 'da_dung', soCau: s })).toBe('Kiểm chứng câu đã đúng · mỗi em một bộ riêng (9 · 2 · 3)')
    expect(chuCachRaDe({ chuan2026: false, deRieng: true, lenBang: true, phamViHoiLai: 'gan_nhat', soCau: { I: 4, II: 3, III: 1 } })).toBe('Kiểm tra điểm yếu · mỗi em một bộ riêng (4 · 3 · 1)')
    expect(chuCachRaDe({ chuan2026: false, deRieng: true, lenBang: false, phamViHoiLai: 'gan_nhat', soCau: s })).toBe('Đề riêng từng em · có câu chữa lỗi (tối đa 30% mỗi phần) · 9 · 2 · 3')
    expect(chuCachRaDe({ chuan2026: false, deRieng: true, lenBang: false, phamViHoiLai: 'khong', soCau: s })).toBe('Đề riêng từng em · 100% câu mới · 9 · 2 · 3')
    expect(chuCachRaDe({ chuan2026: false, deRieng: false, lenBang: false, soCau: s })).toBe('Cả lớp cùng một đề · rút 9 · 2 · 3 câu')
    expect(chuCachRaDe({ chuan2026: false, deRieng: false, lenBang: false })).toBe('Cả lớp cùng một đề · trọn đề')
    expect(chuCachRaDe({ chuan2026: false, deRieng: false, lenBang: false, caChot: true, soCau: { I: 2, II: 1, III: 0 } })).toBe('Cả lớp cùng một đề · bộ câu ca chốt · 2 · 1 · 0 câu')
  })
})
