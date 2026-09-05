// NÚT GẠT "lấy dữ liệu phân công lên bảng" (thầy chốt 05/09 chiều).
//
// Luật một câu: nút gạt CHỈ quyết định ca có ra màn Gọi lên bảng hay không.
// Phiếu gửi phụ huynh và cộng dồn mạnh/yếu chạy ở mọi ca, không tắt được — nên
// gói đề, keyBank và mọi thứ gửi lên máy chủ phải giống hệt nhau ở hai trạng
// thái. Sai chỗ này là thầy tắt nút gạt rồi mất luôn báo cáo của cả buổi.
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const KHO: TeacherExamSource[] = [
  {
    maDe: '12-C1-B1',
    nhom: '12 · C1 - Ester lipid',
    nguon: 'Bài 1. Ester',
    phanI: Array.from({ length: 4 }, (_, i) => ({ id: `q${i + 1}`, text: `TN ${i + 1}`, choices: ['a', 'b', 'c', 'd'], correct: 'A', chuyenDe: 'Ester' })),
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

const publishSession = vi.fn(async () => ({ batDau: '', hetHanVao: '' }))

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  publishSession,
  danhSachEm: async () => [],
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => KHO,
  loadAllSessionTeacherBanks: async () => [],
  docSoCauCa: async () => undefined,
  luuSoCauCa: async () => {},
  saveSessionTeacherBank: async () => {},
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => ({ moi: [], capNhat: [], canXem: [] }) }))
vi.mock('../src/lib/ca-link', () => ({ randomSessionCode: () => '123456', taoLinkMoi: async () => 'https://link' }))
const showToast = vi.fn()
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast, moChiTietCa: vi.fn(), classList: [] }),
}))

const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')

const NHAN = 'Lấy dữ liệu phân công lên bảng'

/** Soạn đủ một ca hợp lệ rồi bấm Mở ca; trả về options gửi lên publishSession. */
async function moCa(r: ReturnType<typeof render>, tatNutGat: boolean) {
  // Kho chỉ có một đề nên màn tự tích sẵn — chờ tới lúc đó rồi mới soạn tiếp.
  await waitFor(() => expect(r.container.textContent).toContain('đề ra 4 câu'))
  fireEvent.change(r.getByPlaceholderText('Lớp (vd 12A1)'), { target: { value: '12A1' } })
  if (tatNutGat) fireEvent.click(r.getByRole('switch', { name: NHAN }))
  // Tiêu đề màn cũng là chữ "Mở ca kiểm tra" — lấy đúng cái NÚT.
  fireEvent.click(r.getAllByText('Mở ca kiểm tra').find((e) => e.tagName === 'BUTTON')!)
  await waitFor(() => expect(publishSession).toHaveBeenCalled())
  return publishSession.mock.calls.at(-1) as unknown as unknown[]
}

describe('nút gạt lấy dữ liệu lên bảng', () => {
  it('là NÚT GẠT thật (role switch), không phải ô tích', async () => {
    const r = render(<ExamSetupScreen />)
    await waitFor(() => expect(r.container.textContent).toContain(NHAN))
    const gat = r.getByRole('switch', { name: NHAN })
    expect(gat.getAttribute('aria-checked')).toBe('true')
  })

  it('mặc định BẬT — tắt nhầm thì giữa buổi không thấy ca đâu', async () => {
    publishSession.mockClear()
    const r = render(<ExamSetupScreen />)
    const goi = await moCa(r, false)
    expect((goi[7] as { lenBang?: boolean }).lenBang).toBe(true)
  })

  it('gạt tắt thì cờ gửi lên là false', async () => {
    publishSession.mockClear()
    const r = render(<ExamSetupScreen />)
    const goi = await moCa(r, true)
    expect((goi[7] as { lenBang?: boolean }).lenBang).toBe(false)
  })

  it('TẮT KHÔNG được đụng tới dữ liệu gửi phụ huynh: gói đề và mọi tuỳ chọn khác y hệt lúc bật', async () => {
    publishSession.mockClear()
    const bat = await moCa(render(<ExamSetupScreen />), false)
    publishSession.mockClear()
    const tat = await moCa(render(<ExamSetupScreen />), true)
    // 0..6 = url, mã ca, lớp, số phút, gói đề công khai, cách công bố, keyBank
    expect(JSON.stringify(tat.slice(0, 7))).toBe(JSON.stringify(bat.slice(0, 7)))
    const { lenBang: _b, ...conLaiBat } = bat[7] as Record<string, unknown>
    const { lenBang: _t, ...conLaiTat } = tat[7] as Record<string, unknown>
    expect(conLaiTat).toEqual(conLaiBat)
  })

  it('đổi trạng thái thì câu giải thích đổi theo, thầy đọc là biết mất gì', async () => {
    const r = render(<ExamSetupScreen />)
    await waitFor(() => expect(r.container.textContent).toContain(NHAN))
    expect(r.container.textContent).toContain('Ca hiện ở màn Gọi lên bảng')
    fireEvent.click(r.getByRole('switch', { name: NHAN }))
    expect(r.container.textContent).toContain('Vẫn gửi phiếu phụ huynh và vẫn cộng dồn mạnh/yếu')
  })
})

// PHÍA ĐỌC: màn Gọi lên bảng lọc theo cờ, và ca cũ (chưa có cột) phải hiện tiếp.
describe('cờ lên bảng ở màn Gọi lên bảng và trên máy chủ', () => {
  it('màn Gọi lên bảng ẩn ca đã tắt, nhưng vẫn với tới được', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('hienCaTat || c.lenBang')
    expect(ma).toContain('ca đã tắt nút gạt')
  })

  it('Apps Script: ô TRỐNG là BẬT — thêm cột không được làm ca cũ biến mất', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("'MoKhoaLuc', 'LenBang'")
    expect(gs).toContain("return String(v || '') !== 'khong'")
    // đọc ở CẢ hai đường: chi tiết một ca và danh sách ca
    expect(gs).toContain('lenBang: lenBangCua_(v[22])')
    expect((gs.match(/lenBangCua_\(v\[22\]\)/g) || []).length).toBe(2)
  })

  it('Apps Script: ghi cờ vào ô riêng, KHÔNG nối vào rowData (giữ dấu vết khoá ca)', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain('sh.getRange(dong, 23).setValue(lenBang)')
    expect(gs).toContain("body.lenBang === false ? 'khong' : 'co'")
  })

  it('Apps Script: thuộc tính SPREADSHEET_ID còn nguyên (luật sau sự cố v28)', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')")
  })

  it('client: máy chủ chưa cập nhật .gs thì coi như BẬT, danh sách không rỗng', async () => {
    const ma = (await import('../src/lib/exam-api.ts?raw')).default
    expect(ma).toContain('lenBang: c.lenBang !== false')
    expect(ma).toContain('lenBang: moc.lenBang !== false')
  })
})
