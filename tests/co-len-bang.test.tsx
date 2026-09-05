// CỜ "ca này có ra màn Gọi lên bảng không" — suy THẲNG từ lựa chọn ở khối Bộ
// câu ra đề, không có nút gạt riêng (thầy chốt 05/09 chiều).
//
// LUẬT GỐC, thầy nhắc ba lần:
//   · chọn "Phân công lên bảng"  → ca đẩy dữ liệu sang màn Gọi lên bảng;
//   · ba lựa chọn còn lại        → không đẩy;
//   · MỌI lựa chọn               → vẫn lấy dữ liệu gửi phiếu phụ huynh và cộng
//                                  dồn mạnh/yếu, không có ngoại lệ.
// Phép kiểm cuối là cái quan trọng nhất: nó chặn mọi lần sửa sau vô tình gắn
// báo cáo phụ huynh vào cờ này.
import { describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const KHO: TeacherExamSource[] = [
  {
    maDe: '12-C1-B1',
    nhom: '12 · C1 - Ester lipid',
    nguon: 'Bài 1. Ester',
    phanI: Array.from({ length: 40 }, (_, i) => ({
      id: `q${i + 1}`,
      text: `TN ${i + 1}`,
      choices: ['a', 'b', 'c', 'd'],
      correct: 'A',
      chuyenDe: i % 2 ? 'Ester' : 'Lipid',
      mucDo: 'hieu',
    })),
    phanII: [],
    phanIII: [],
  } as unknown as TeacherExamSource,
]

const publishSession = vi.fn(async () => ({ batDau: '', hetHanVao: '' }))
const saveSessionTeacherBank = vi.fn(async () => {})

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
  saveSessionTeacherBank,
  // Khối "Mật khẩu mở app" trong màn Cài đặt đọc hai hàm này lúc dựng.
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/exam-sync', () => ({ dongBoNganHang: async () => ({ moi: [], capNhat: [], canXem: [] }) }))
vi.mock('../src/lib/ca-link', () => ({ randomSessionCode: () => '123456', taoLinkMoi: async () => 'https://link' }))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: vi.fn(), moChiTietCa: vi.fn(), classList: [] }),
}))

const { default: ExamSetupScreen } = await import('../src/screens/ExamSetupScreen')

type CachLay = 'rut' | 'tron' | 'lenbang'
const TEN_CHIP: Record<CachLay, RegExp> = { rut: /^Rút bộ câu$/, tron: /^Lấy trọn kho/, lenbang: /^Kiểm tra điểm yếu$/ }

/** Soạn đủ một ca hợp lệ theo cách lấy câu đã chọn rồi bấm Mở ca. */
async function moCa(cach: CachLay) {
  // Gỡ màn của lần trước: một `it` mở ca hai lần thì hai màn cùng nằm trong
  // DOM, và getByRole thấy hai chip trùng tên.
  cleanup()
  publishSession.mockClear()
  saveSessionTeacherBank.mockClear()
  const r = render(<ExamSetupScreen />)
  // CHỜ RỘNG, KHÔNG PHẢI NỚI ĐIỀU KIỆN KIỂM. Màn Mở ca dựng xong mới gọi
  // publishSession; chạy cả bộ 78 tệp song song thì bước dựng có lúc quá mốc
  // 1 giây mặc định và phép kiểm đỏ ngẫu nhiên. Điều kiện kiểm giữ nguyên,
  // chỉ cho nó đủ thời gian chạy.
  await waitFor(() => expect(r.container.textContent).toContain('Bộ câu ra đề'), { timeout: 8000 })
  fireEvent.click(r.getByRole('checkbox', { name: TEN_CHIP[cach] }))
  fireEvent.change(r.getByPlaceholderText('Lớp (vd 12A1)'), { target: { value: '12A1' } })
  // Tiêu đề màn cũng là chữ "Mở ca kiểm tra" — lấy đúng cái NÚT.
  fireEvent.click(r.getAllByText('Mở ca kiểm tra').find((e) => e.tagName === 'BUTTON')!)
  await waitFor(() => expect(publishSession).toHaveBeenCalled(), { timeout: 8000 })
  return { r, goi: publishSession.mock.calls.at(-1) as unknown as unknown[] }
}

const co = (goi: unknown[]) => (goi[7] as { lenBang?: boolean }).lenBang

describe('cờ lên bảng suy từ khối Bộ câu ra đề', () => {
  it('KHÔNG còn nút gạt LÊN BẢNG riêng trên màn Mở ca', async () => {
    // Cờ lên bảng suy từ khối Bộ câu ra đề, không có công tắc riêng nữa. Công
    // tắc DUY NHẤT còn lại trên màn này là "Giữ để đọc" (GIUDEDOC) — việc khác
    // hẳn, nên kiểm theo nhãn chứ không đếm tổng số công tắc.
    const r = render(<ExamSetupScreen />)
    await waitFor(() => expect(r.container.textContent).toContain('Bộ câu ra đề'))
    const congTac = r.queryAllByRole('switch')
    expect(congTac.map((n) => n.getAttribute('aria-label'))).toEqual(['Giữ để đọc'])
    expect(r.container.textContent).not.toContain('Ca này dùng làm gì')
  })

  it('chọn "Kiểm tra điểm yếu" → ca đẩy dữ liệu sang màn Gọi lên bảng', async () => {
    const { goi } = await moCa('lenbang')
    expect(co(goi)).toBe(true)
  })

  it('chọn "Rút bộ câu" → không đẩy', async () => {
    const { goi } = await moCa('rut')
    expect(co(goi)).toBe(false)
  })

  it('chọn "Lấy trọn kho" → không đẩy', async () => {
    const { goi } = await moCa('tron')
    expect(co(goi)).toBe(false)
  })
})

describe('mọi lựa chọn đều lấy dữ liệu phiếu phụ huynh và mạnh/yếu', () => {
  it('bản đề CÓ đáp án vẫn lưu trên máy thầy ở CẢ BA cách lấy câu', async () => {
    for (const cach of ['rut', 'tron', 'lenbang'] as CachLay[]) {
      await moCa(cach)
      expect(saveSessionTeacherBank, `cách lấy: ${cach}`).toHaveBeenCalledTimes(1)
    }
  })

  it('cách công bố điểm và mọi tuỳ chọn khác KHÔNG đổi theo cờ lên bảng', async () => {
    const a = (await moCa('lenbang')).goi
    const b = (await moCa('rut')).goi
    // 5 = cách công bố · 6 = keyBank. Hai thứ quyết định em xem được điểm và
    // thầy chấm lại được — không được dính gì tới cờ lên bảng.
    expect(a[5]).toBe(b[5])
    expect(JSON.stringify(a[6])).toBe(JSON.stringify(b[6]))
    const { lenBang: _a, ...conLaiA } = a[7] as Record<string, unknown>
    const { lenBang: _b, ...conLaiB } = b[7] as Record<string, unknown>
    expect(conLaiA).toEqual(conLaiB)
  })
})

describe('phía đọc: màn Gọi lên bảng và máy chủ', () => {
  it('màn Gọi lên bảng ẩn ca không có cờ, nhưng vẫn với tới được', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('hienCaTat || c.lenBang')
    expect(ma).toContain('ca đã tắt nút gạt')
  })

  it('Apps Script: ô TRỐNG là BẬT — thêm cột không được làm ca cũ biến mất', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("'MoKhoaLuc', 'LenBang'")
    expect(gs).toContain("return String(v || '') !== 'khong'")
    expect((gs.match(/lenBangCua_\(v\[22\]\)/g) || []).length).toBe(2)
  })

  it('Apps Script: ghi cờ vào ô riêng, KHÔNG nối vào rowData (giữ dấu vết khoá ca)', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    // Ghi cột 23 trở đi bằng một dải riêng. rowData dừng ở cột 19; nối thêm là
    // ghi đè KhoaLuc / KhoaBoi / MoKhoaLuc (cột 20-22) của ca mở lại cùng mã.
    expect(gs).toContain('sh.getRange(dong, 23, 1, 3).setValues([[lenBang, giuDeDoc, anHanGiay]])')
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
