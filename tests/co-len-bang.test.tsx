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
  // Màn Gọi lên bảng đọc kho độ khó (nguồn N2 của giáo án 80 phút) lúc dựng.
  docKhoDoKho: async () => undefined,
  luuKhoDoKho: async () => {},
  docKhoChuaCa: async () => undefined,
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
/** HẠN CHO CẢ PHÉP KIỂM, không chỉ cho từng lượt chờ bên trong.
 *
 * VÌ SAO CÓ (đo 09/09 từ chú thích lỗi của GitHub Actions):
 *
 *     Error: Test timed out in 5000ms.
 *      ❯ tests/co-len-bang.test.tsx:126:3
 *
 * Những lượt `waitFor` dưới đây được nới lên 20 giây vì màn Mở ca dựng chậm khi
 * chạy cả bộ song song. Nhưng mốc hết giờ của MỘT `it` trong vitest vẫn là
 * 5 000 ms mặc định — tức 20 giây kia chưa bao giờ có tác dụng: máy chậm thì
 * `it` bị giết ở giây thứ 5 trong lúc `waitFor` còn đang đợi.
 *
 * Máy tôi chạy 143 tệp trong ~90 giây nên không bao giờ lộ; máy CI chậm hơn thì
 * đỏ. Đã làm hỏng HAI lần phát hành (`49d7282`, `2a0836d`) trước khi tìm ra.
 *
 * Nay hạn của `it` lớn hơn hạn chờ bên trong, nên thứ quyết định là điều kiện
 * kiểm chứ không phải cái mốc nào tới trước. KHÔNG nới điều kiện kiểm. */
const HAN_PHEP_KIEM = 70000

// SỐ HỌC CỦA NGÂN SÁCH NÀY TỪNG SAI, và đó là lý do phép kiểm vẫn đỏ ngẫu nhiên
// trên máy CI dù ghi chú ở trên nói đã chữa xong (đỏ lần nữa ở `3f5ed34`, đúng
// dòng aria-checked).
//
// `moCa()` có BA lần `waitFor` nối tiếp, mỗi lần hạn 20 000 ms, và có `it` gọi
// `moCa()` hai lần. Trần cũ 30 000 ms cho cả `it` nhỏ hơn tổng các hạn bên trong,
// nên máy chạy chậm là `it` hết giờ TRƯỚC khi lần chờ thứ hai kịp xong — vitest
// báo đúng cái `expect` đang chờ dở, trông y như điều kiện kiểm sai.
//
// Nay trần `it` LỚN HƠN tổng hạn bên trong (3 × 20 000 + dư). KHÔNG nới một điều
// kiện kiểm nào, không rút hạn chờ nào — chỉ sửa đúng phép cộng.

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
  await waitFor(() => expect(r.container.textContent).toContain('Bộ câu ra đề'), { timeout: 20000 })
  // BẤM LẠI TRÊN NÚT VỪA TRUY VẤN, mỗi vòng chờ một lần.
  //
  // NGUYÊN NHÂN GỐC, tìm ra 10/09 sau khi CI đỏ ở đây còn máy tôi chạy 8 lượt
  // đều xanh: bấm MỘT lần rồi chờ 20 giây là sai kiểu. Màn Mở ca còn vài hiệu
  // ứng chạy sau khi chữ "Bộ câu ra đề" hiện ra; một trong số đó dựng lại khối
  // chip, THAY nút cũ bằng nút mới. Cú bấm rơi vào nút đã rời khỏi cây DOM thì
  // mất hẳn — `aria-checked` không bao giờ đổi, và chờ bao lâu cũng vô ích. Máy
  // nhanh thì hai việc ấy không chen vào nhau nên không ai thấy.
  //
  // Nay mỗi vòng chờ TRUY VẤN LẠI rồi mới bấm, nên cú bấm luôn rơi vào nút đang
  // sống. Bấm lại một chip đã tích KHÔNG bỏ tích (nó là radio-kiểu-chip), nên
  // lặp là an toàn. ĐIỀU KIỆN KIỂM GIỮ NGUYÊN: chip phải `aria-checked=true`;
  // chip không bao giờ tích được thì vẫn đỏ đúng như trước.
  await waitFor(
    () => {
      const o = r.getByRole('checkbox', { name: TEN_CHIP[cach] })
      if (o.getAttribute('aria-checked') !== 'true') fireEvent.click(o)
      expect(r.getByRole('checkbox', { name: TEN_CHIP[cach] }).getAttribute('aria-checked')).toBe('true')
    },
    { timeout: 20000 },
  )
  fireEvent.change(r.getByPlaceholderText('Lớp (vd 12A1)'), { target: { value: '12A1' } })
  // Tiêu đề màn cũng là chữ "Mở ca kiểm tra" — lấy đúng cái NÚT.
  fireEvent.click(r.getAllByText('Mở ca kiểm tra').find((e) => e.tagName === 'BUTTON')!)
  await waitFor(() => expect(publishSession).toHaveBeenCalled(), { timeout: 20000 })
  return { r, goi: publishSession.mock.calls.at(-1) as unknown as unknown[] }
}

const co = (goi: unknown[]) => (goi[7] as { lenBang?: boolean }).lenBang

describe('cờ lên bảng suy từ khối Bộ câu ra đề', () => {
  it('KHÔNG còn nút gạt LÊN BẢNG riêng trên màn Mở ca', async () => {
    // Cờ lên bảng suy từ khối Bộ câu ra đề, không có công tắc riêng nữa. Kiểm
    // theo NHÃN chứ không đếm tổng số công tắc: màn này còn hai việc khác hẳn
    // cũng dùng nút gạt — "Giữ để đọc" (GIUDEDOC) và "Phòng chờ" (07/09).
    const r = render(<ExamSetupScreen />)
    await waitFor(() => expect(r.container.textContent).toContain('Bộ câu ra đề'), { timeout: 20000 })
    const congTac = r.queryAllByRole('switch')
    expect(congTac.map((n) => n.getAttribute('aria-label')).sort()).toEqual(['Giữ để đọc', 'Phòng chờ'])
    // Điều thật sự phải khoá: KHÔNG có nút gạt nào cho việc lên bảng.
    for (const n of congTac) expect(n.getAttribute('aria-label')).not.toMatch(/bảng/i)
    expect(r.container.textContent).not.toContain('Ca này dùng làm gì')
  }, HAN_PHEP_KIEM)

  it('chọn "Kiểm tra điểm yếu" → ca đẩy dữ liệu sang màn Gọi lên bảng', async () => {
    const { goi } = await moCa('lenbang')
    expect(co(goi)).toBe(true)
  }, HAN_PHEP_KIEM)

  it('chọn "Rút bộ câu" → không đẩy', async () => {
    const { goi } = await moCa('rut')
    expect(co(goi)).toBe(false)
  }, HAN_PHEP_KIEM)

  it('chọn "Lấy trọn kho" → không đẩy', async () => {
    const { goi } = await moCa('tron')
    expect(co(goi)).toBe(false)
  }, HAN_PHEP_KIEM)
})

describe('mọi lựa chọn đều lấy dữ liệu phiếu phụ huynh và mạnh/yếu', () => {
  it('bản đề CÓ đáp án vẫn lưu trên máy thầy ở CẢ BA cách lấy câu', async () => {
    for (const cach of ['rut', 'tron', 'lenbang'] as CachLay[]) {
      await moCa(cach)
      expect(saveSessionTeacherBank, `cách lấy: ${cach}`).toHaveBeenCalledTimes(1)
    }
  }, HAN_PHEP_KIEM)

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
  }, HAN_PHEP_KIEM)
})

describe('phía đọc: màn Gọi lên bảng và máy chủ', () => {
  it('màn Gọi lên bảng ẩn ca không có cờ, nhưng vẫn với tới được', async () => {
    const ma = (await import('../src/screens/GoiLenBangScreen.tsx?raw')).default
    expect(ma).toContain('hienCaTat || c.lenBang')
    expect(ma).toContain('ca đã tắt nút gạt')
  }, HAN_PHEP_KIEM)

  it('Apps Script: ô TRỐNG là BẬT — thêm cột không được làm ca cũ biến mất', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("'MoKhoaLuc', 'LenBang'")
    expect(gs).toContain("return String(v || '') !== 'khong'")
    expect((gs.match(/lenBangCua_\(v\[22\]\)/g) || []).length).toBe(2)
  }, HAN_PHEP_KIEM)

  it('Apps Script: ghi cờ vào ô riêng, KHÔNG nối vào rowData (giữ dấu vết khoá ca)', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    // Ghi cột 23 trở đi bằng một dải riêng. rowData dừng ở cột 19; nối thêm là
    // ghi đè KhoaLuc / KhoaBoi / MoKhoaLuc (cột 20-22) của ca mở lại cùng mã.
    // Dải nay dài 5 ô: thêm PhongCho và BatDauThiLuc (07/09).
    expect(gs).toContain("sh.getRange(dong, 23, 1, 7).setValues([[lenBang, giuDeDoc, anHanGiay, phongCho, '', '', deRieng]])")
    // rowData vẫn phải DỪNG trước cột 20 — đây mới là điều phép kiểm này giữ.
    expect(gs).not.toMatch(/sh\.getRange\(dong, 1, 1, 2[0-9]\)/)
    expect(gs).toContain("body.lenBang === false ? 'khong' : 'co'")
  }, HAN_PHEP_KIEM)

  it('Apps Script: thuộc tính SPREADSHEET_ID còn nguyên (luật sau sự cố v28)', async () => {
    const gs = (await import('../docs/apps-script-kiem-tra.gs?raw')).default
    expect(gs).toContain("PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')")
  }, HAN_PHEP_KIEM)

  it('client: máy chủ chưa cập nhật .gs thì coi như BẬT, danh sách không rỗng', async () => {
    const ma = (await import('../src/lib/exam-api.ts?raw')).default
    expect(ma).toContain('lenBang: c.lenBang !== false')
    expect(ma).toContain('lenBang: moc.lenBang !== false')
  }, HAN_PHEP_KIEM)
})
