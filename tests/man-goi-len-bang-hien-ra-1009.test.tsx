// MÀN GỌI LÊN BẢNG PHẢI HIỆN RA ĐƯỢC — phép kiểm cho cái VỎ, không phải cái RUỘT.
//
// VÌ SAO CÓ TỆP NÀY. Đợt 31–35 tôi kiểm thuật toán xếp giờ rất kỹ: 200/200 ca so
// vét cạn, khoảng cách 0,00%, ca dáng thật dùng 4289/4320 giây. Không phép kiểm
// nào dựng cái màn ấy ra xem thầy có THẤY nó không. Ngày 10/09 thầy báo "trong
// mục gọi học sinh lên bảng tôi chưa thấy thay đổi gì".
//
// Đo trên máy chủ: 7/7 ca chưa xoá đều `LenBang='khong'`, KHÔNG ca nào 'co'. Bộ
// lọc `hienCaTat || c.lenBang` cắt sạch danh sách ⇒ màn dừng ở "Chưa có ca nào
// khớp" ⇒ `du` mãi là null ⇒ mục 2, mục 3 và cả khối Giáo án không bao giờ dựng.
// Thuật toán đúng tuyệt đối mà thầy không tới được nó thì bằng không.
//
// Đây đúng bài học của đợt 19b lật ngược: hôm đó phép kiểm soi VỎ mà quên RUỘT;
// lần này tôi soi RUỘT mà quên VỎ.
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, waitFor } from '@testing-library/react'
import type { CaTomTat } from '../src/lib/exam-api'
import type { TeacherExamSource } from '../src/data/examContent'

const ca = (maCa: string, lenBang: boolean): CaTomTat =>
  ({
    maCa,
    tenCa: `Ca ${maCa}`,
    lop: '12',
    daVao: 10,
    daNop: 10,
    lenBang,
    trangThai: 'dong',
    batDau: '2026-09-09T00:00:00.000Z',
    hetHanVao: '2026-09-09T01:00:00.000Z',
  }) as unknown as CaTomTat

/** Đề 6 câu, đủ để có câu đáng chữa mà không làm phép kiểm chậm. */
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

/** 10 em, ai cũng sai vài câu — có sai thì mới có câu để chữa. */
const LUOT = Array.from({ length: 10 }, (_, i) => ({
  sbd: `120${String(i).padStart(2, '0')}`,
  hoTen: `Em ${i + 1}`,
  lanThu: 1,
  trangThai: 'da_nop',
  dapAn: { phanI: Object.fromEntries(DE.phanI.map((q, j) => [q.id, j <= i % 4 ? 'B' : 'A'])), phanII: {}, phanIII: {} },
  giayCau: Object.fromEntries(DE.phanI.map((q, j) => [q.id, 20 + j * 5 + i])),
}))

let dsCaTra: CaTomTat[] = []

vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachCa: async () => dsCaTra,
  chiTietCa: async () => ({
    ca: { maCa: '111111', tenCa: 'Ca 111111', lop: '12' },
    keyBank: { phanI: DE.phanI, phanII: [], phanIII: [] },
    luot: LUOT,
  }),
  hoSoEm: async ({ sbd }: { sbd: string }) => ({ em: { sbd, hoTen: `Em ${sbd}` }, chuyenDe: [{ ten: 'Ester', soCau: 4, soSai: 2 }] }),
  lichSuLenBang: async () => ({ soNgay: 30, theoEm: {} }),
  ghiLenBang: async () => ({ ok: true }),
}))
vi.mock('../src/lib/exam-db', () => ({
  loadScriptUrl: async () => 'https://x',
  loadTeacherSecret: async () => 'mat',
  loadExamSources: async () => [DE],
  loadSessionTeacherBank: async () => undefined,
  docKhoChuaCa: async () => undefined,
  docKhoDoKho: async () => undefined,
  luuKhoDoKho: async () => {},
}))
vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ setScreen: vi.fn(), showToast: vi.fn() }),
}))

const { default: GoiLenBangScreen } = await import('../src/screens/GoiLenBangScreen')

const CHO = { timeout: 20000 }

beforeEach(() => {
  cleanup()
})

describe('KHÔNG CA NÀO BẬT NÚT GẠT — màn vẫn phải dùng được', () => {
  it('7 ca đều `LenBang=khong` ⇒ VẪN hiện đủ 7 ca, không còn "Chưa có ca nào khớp"', async () => {
    // Đúng dáng dữ liệu thật của thầy sáng 10/09.
    dsCaTra = Array.from({ length: 7 }, (_, i) => ca(`10000${i}`, false))
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r.getByText('Ca 100000')).toBeTruthy(), CHO)
    for (let i = 0; i < 7; i++) expect(r.getByText(`Ca 10000${i}`)).toBeTruthy()
    expect(r.container.textContent).not.toContain('Chưa có ca nào khớp')
  }, 30000)

  it('nói RÕ vì sao đang hiện tất, thay vì để thầy đoán ra cái nút ẩn', async () => {
    dsCaTra = Array.from({ length: 7 }, (_, i) => ca(`10000${i}`, false))
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r.getByText('Ca 100000')).toBeTruthy(), CHO)
    const t = r.container.textContent ?? ''
    expect(t).toContain('Không ca nào mở ở chế độ')
    expect(t).toContain('đang hiện cả')
  }, 30000)

  it('CÓ ca bật nút gạt thì bộ lọc vẫn chạy như cũ — không phá hành vi đang có', async () => {
    dsCaTra = [ca('111111', true), ca('222222', false), ca('333333', false)]
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
    expect(r.queryByText('Ca 222222')).toBeNull()
    // …và nút mở rộng vẫn còn để thầy xem hai ca kia.
    fireEvent.click(r.getByText(/Hiện cả 2 ca/))
    await waitFor(() => expect(r.getByText('Ca 222222')).toBeTruthy(), CHO)
  }, 30000)
})

describe('KHỐI GIÁO ÁN 80 PHÚT PHẢI DỰNG RA ĐƯỢC', () => {
  it('mở một ca ⇒ hiện đủ mục 2, mục 3 và khối Giáo án kèm nút Xếp giờ', async () => {
    dsCaTra = [ca('111111', false)]
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
    fireEvent.click(r.getByText('Ca 111111'))
    // Mở ca là đường bất đồng bộ (chiTietCa → hoSoEm từng em) nên phải chờ.
    await waitFor(() => expect(r.container.textContent).toContain('Giáo án 80 phút'), CHO)
    const t = r.container.textContent ?? ''
    expect(t).toContain('2. Câu để chữa lấy ở đâu')
    expect(t).toContain('3. Em có mặt hôm nay')
    expect(t).toContain('Xếp giờ')
    expect(t).toContain('Dựng kho độ khó')
    expect(t).toContain('ngân sách chữa')
  }, 30000)

  it('khối Giáo án đứng TRƯỚC nút Phân công cũ — thầy đọc từ trên xuống là gặp', async () => {
    dsCaTra = [ca('111111', false)]
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
    fireEvent.click(r.getByText('Ca 111111'))
    await waitFor(() => expect(r.container.textContent).toContain('Giáo án 80 phút'), CHO)
    const t = r.container.textContent ?? ''
    const viTriGiaoAn = t.indexOf('Giáo án 80 phút')
    // Dò NÚT chứ không dò cụm chữ: dòng giải thích ở mục 1 cũng nhắc tên chế độ
    // "Phân công lên bảng", nên `indexOf` trần bắt nhầm nó ở vị trí 180.
    const viTriPhanCong = t.indexOf('Phân công lên bảng (')
    expect(viTriGiaoAn).toBeGreaterThan(-1)
    expect(viTriPhanCong).toBeGreaterThan(-1)
    expect(viTriGiaoAn).toBeLessThan(viTriPhanCong)
  }, 30000)


  it('mở ca xong là nút Xếp giờ BẤM ĐƯỢC NGAY — không bắt thầy đi tích đề trước', async () => {
    // Ca thường (không có bộ rút sẵn) rơi vào nhánh `tu_chon`. Nếu nhánh ấy để
    // `dsCau` rỗng thì nút Xếp giờ mờ, và thầy lại "chưa thấy thay đổi gì" một
    // lần nữa — chỉ khác là lần này vì nút bấm không ăn.
    dsCaTra = [ca('111111', false)]
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
    fireEvent.click(r.getByText('Ca 111111'))
    await waitFor(() => expect(r.container.textContent).toContain('Giáo án 80 phút'), CHO)
    const nut = [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Xếp giờ'))
    expect(nut).toBeTruthy()
    // eslint-disable-next-line no-console
    console.log(`[màn lên bảng] nhãn nút: "${nut?.textContent?.trim()}" · disabled=${(nut as HTMLButtonElement).disabled}`)
    // Cùng điều kiện mờ với nút Phân công cũ: mở ca + có em có mặt là bấm được.
    // Chưa tích đề thì bấm ra LỜI NHẮC, chứ không phải một nút chết lặng.
    expect((nut as HTMLButtonElement).disabled).toBe(false)
    const nutCu = [...r.container.querySelectorAll('button')].find((b) => (b.textContent ?? '').includes('Phân công lên bảng ('))
    expect((nutCu as HTMLButtonElement).disabled).toBe(false)
  }, 30000)

  it('CHƯA mở ca thì KHÔNG dựng khối Giáo án — không hiện khối rỗng', async () => {
    dsCaTra = [ca('111111', false)]
    const r = render(<GoiLenBangScreen />)
    await waitFor(() => expect(r.getByText('Ca 111111')).toBeTruthy(), CHO)
    expect(r.container.textContent).not.toContain('Giáo án 80 phút')
  }, 30000)
})
