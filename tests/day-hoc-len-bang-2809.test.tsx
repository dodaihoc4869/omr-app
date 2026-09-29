// BẢNG DẠY HỌC của mục Lên bảng (thầy lệnh 28/09) — app thầy + app học sinh.
// Khoá: cây chọn CHỈ nhánh DẠY HỌC; tự luận KHÔNG bị lọc và hiện đủ trên tờ; tờ dùng MÀN CHIẾU MỚI (lớp bản vẽ 28/09, mỗi câu một đợt, đủ câu);
// ba bước hiện rõ; danh sách có mặt tự làm mới 5 giây qua nhịp chung; nút "Chiếu lên bảng" chỉ bật khi có em + có câu và gọi em CÓ MẶT;
// "Em làm đúng" ghi bằng `ghiLenBang` (đường ghi sẵn có); app học sinh: thẻ điểm danh + quét QR tự điểm danh.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { TeacherExamSource } from '../src/data/examContent'

const { goi, ghiLenBang } = vi.hoisted(() => ({ goi: vi.fn(), ghiLenBang: vi.fn(async () => undefined) }))
vi.mock('../src/lib/goi-lenh-thay', () => ({ goiLenh: (duong: string, body: Record<string, unknown>) => goi(duong, body) }))
vi.mock('../src/lib/exam-db', async (goc) => ({
  ...(await goc<typeof import('../src/lib/exam-db')>()),
  loadExamSources: async () => KHO,
  loadScriptUrl: async () => 'https://may-chu',
  loadTeacherSecret: async () => 'mat',
}))
vi.mock('../src/lib/exam-api', async (goc) => ({ ...(await goc<typeof import('../src/lib/exam-api')>()), ghiLenBang }))
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))

import { cauTuDeChon, dungToChieuDayHoc, locDeDayHoc } from '../src/lib/day-hoc-len-bang'
import { linkDiemDanh, maTuDuongDan } from '../src/lib/buoi-hoc-api'
import { tachNhieuTheoPhan } from '../src/lib/tach-phan-de'
import DayHocLenBang from '../src/components/day-hoc/DayHocLenBang'
import TheDiemDanhHs from '../src/components/diem-danh/TheDiemDanhHs'
import GoiLenBangScreen from '../src/screens/GoiLenBangScreen'
import { useCoHoa2 } from '../src/components/chien-dich/co-hoa2'
import { readFileSync } from 'node:fs'

const TU_LUAN = 'Trình bày cơ chế phản ứng xà phòng hoá ethyl acetate và giải thích vì sao phản ứng một chiều.'
const KHO: TeacherExamSource[] = [
  {
    maDe: 'DH-12-C1-B1-TN',
    nguon: 'Bài 1. Ester — dạy học',
    nhom: '12 · DẠY HỌC/C1 - Ester lipid',
    phanI: [
      { id: 'DH-12-C1-B1-TN-I-1', text: 'Chất nào sau đây là ester?', choices: ['CH3COOH', 'CH3COOCH3', 'C2H5OH', 'HCHO'], correct: 'B', mucDo: 'biet', chuyenDe: 'Ester – lipid', dang: { ma: 'D-ESTER-NB', ten: 'Nhận biết ester' } },
      { id: 'DH-12-C1-B1-TN-I-2', text: 'Thuỷ phân ester X thu được…', choices: ['a', 'b', 'c', 'd'], correct: 'C', mucDo: 'van_dung', chuyenDe: 'Ester – lipid', dang: { ma: 'D-ESTER-TP', ten: 'Thuỷ phân ester' } },
    ] as TeacherExamSource['phanI'],
    phanII: [],
    phanIII: [{ id: 'DH-12-C1-B1-TN-III-1', text: TU_LUAN, correct: '', mucDo: 'hieu', chuyenDe: 'Ester – lipid' }] as TeacherExamSource['phanIII'],
  },
  {
    maDe: 'KT-12-C1',
    nguon: 'Đề kiểm tra chương 1',
    nhom: '12 · C1 - Ester lipid',
    phanI: [{ id: 'KT-12-C1-I-1', text: 'Câu đề kiểm tra — KHÔNG thuộc Dạy học', choices: ['a', 'b', 'c', 'd'], correct: 'A' }] as TeacherExamSource['phanI'],
    phanII: [],
    phanIII: [],
  },
]

const BUOI = { id: 'BH-1', ten: 'Buổi học 28/09 · 12A1', lop: '12A1', moLuc: '2026-09-28T11:00:00Z', hetHan: '2026-09-29T11:00:00Z', dongLuc: null, dangMo: true }
let coMat: { sbd: string; hoTen: string; luc: string; cach: string }[] = []
function chuanMock() {
  goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
    if (duong === '/gv/lop') return { ok: true, du: { ok: true, lop: [{ tenLop: '12A1', khoi: '12', soEm: 3, sbd: ['S1', 'S2', 'S3'] }] } }
    if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [] } }
    if (duong === '/gv/buoi-hoc')
      return {
        ok: true,
        du: { ok: true, buoi: BUOI, ma: '482915', doiMaLuc: 1, coMat, siSo: 3, lopEm: [{ sbd: 'S1', hoTen: 'Nguyễn An', tenLop: '12A1' }, { sbd: 'S2', hoTen: 'Trần Bảo', tenLop: '12A1' }, { sbd: 'S3', hoTen: 'Lê Chi', tenLop: '12A1' }] },
      }
    if (duong === '/gv/buoi-hoc/suc-hoc')
      return {
        ok: true,
        du: {
          ok: true,
          em: {
            S1: { tong: { n: 40, d: 36 }, qid: {}, dang: { 'D-ESTER-TP': { n: 8, d: 8 } }, chuyenDe: {}, bac: { 'D-ESTER-TP': 2, 'D-ESTER-NB': 2 }, lenBang: { n: 0, dat: 0, homNay: 0 } },
            S2: { tong: { n: 40, d: 20 }, qid: {}, dang: { 'D-ESTER-TP': { n: 8, d: 2 } }, chuyenDe: {}, bac: { 'D-ESTER-TP': 0 }, lenBang: { n: 0, dat: 0, homNay: 0 } },
          },
        },
      }
    return { ok: false, loai: 'chua_co_lenh', chu: 'lệnh lạ' }
  })
}

beforeEach(() => {
  goi.mockReset()
  ghiLenBang.mockClear()
  coMat = []
  chuanMock()
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  useCoHoa2.getState().dat(null)
  vi.useRealTimers()
})

describe('phần thuần', () => {
  it('cây DẠY HỌC chỉ giữ nhánh DẠY HỌC', () => {
    expect(locDeDayHoc(KHO).map((s) => s.maDe)).toEqual(['DH-12-C1-B1-TN'])
  })
  it('gom câu KHÔNG bỏ tự luận; đánh dấu câu tự luận', () => {
    const ds = cauTuDeChon(KHO, new Set(['DH-12-C1-B1-TN']))
    expect(ds.map((c) => c.phan)).toEqual(['I', 'I', 'III'])
    expect(ds.find((c) => c.phan === 'III')!.tuLuan).toBe(true)
    // nhãn theo NỘI DUNG, không theo mã: câu trắc nghiệm có đủ đáp án không bị gắn "Tự luận"
    expect(ds.filter((c) => c.phan === 'I').every((c) => !c.tuLuan)).toBe(true)
  })
  it('tờ chiếu MỚI: mỗi câu một đợt, đủ câu (kể cả tự luận), lớp bản vẽ 28/09, tên em + nút Đạt/Chưa đạt khi có phiên', async () => {
    const ds = cauTuDeChon(KHO, new Set(['DH-12-C1-B1-TN']))
    const giao = new Map([[ds[1]!.khoa, { sbd: 'S1', hoTen: 'Nguyễn An', lop: '12A1', lanLenBang: 1 }]])
    const { html, o } = await dungToChieuDayHoc(ds, giao, 'Dạy học · Buổi thử', 'abcdef0123456789abcdef01')
    expect(html).toContain('LÊN BẢNG — BẢN VẼ MỚI 28/09')
    expect((html.match(/class="mc-dot mc-dot-don"/g) ?? []).length).toBe(3)
    expect(html).toContain('xà phòng hoá ethyl acetate')
    expect(html).toContain('Phần III · Tự luận')
    expect(html).toContain('Tự luận — em trình bày lời giải đầy đủ lên bảng.')
    expect(html).toContain('Chất nào sau đây là ester?')
    expect(html).toContain('Nguyễn An')
    expect([...o.values()].map((x) => x.sbd)).toEqual(['S1'])
    expect(html).toContain('data-cau-noi=')
  })
  it('QR điểm danh mở app học sinh với mã; đọc lại mã từ đường dẫn', () => {
    expect(linkDiemDanh('https://omr-app-b3u.pages.dev/', '482915')).toBe('https://omr-app-b3u.pages.dev/hs?diem-danh=482915')
    expect(maTuDuongDan('?diem-danh=482915')).toBe('482915')
    expect(maTuDuongDan('?diem-danh=48x')).toBe('')
  })
})

describe('màn Lên bảng — thẻ Dạy học', () => {
  it('đầu mục có thẻ Dạy học; không còn nút "cách cũ"; bảng Dạy học có đủ 3 bước', async () => {
    useCoHoa2.getState().dat({ bat: true, lop: [], sbd: [] })
    goi.mockImplementation(async (duong: string) => (duong === '/gv/chien-dich' ? { ok: true, du: { ok: true, homNay: '2026-09-28', chienDich: [] } } : { ok: false, loai: 'chua_co_lenh', chu: 'x' }))
    render(<GoiLenBangScreen />)
    expect(await screen.findByRole('heading', { name: 'Chưa có chiến dịch nào' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: /cách cũ/ })).toBeNull()
    chuanMock()
    fireEvent.click(screen.getByRole('tab', { name: 'Dạy học' }))
    expect(await screen.findByRole('heading', { name: 'Điểm danh' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Chọn câu' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Chiếu lên bảng' })).toBeTruthy()
  })

  it('hộp chọn câu CHỈ hiện cây DẠY HỌC; xem trước số câu (có tự luận); dùng xong danh sách hiện câu tự luận', async () => {
    render(<DayHocLenBang />)
    fireEvent.click(await screen.findByRole('button', { name: 'Chọn bài trong kho Dạy học' }))
    const hop = await screen.findByRole('dialog', { name: 'Chọn bài · kho Dạy học' })
    const cay = await within(hop).findByRole('tree')
    expect(within(cay).getByText('DẠY HỌC')).toBeTruthy()
    expect(cay.textContent).not.toContain('Khối 12')
    fireEvent.click(within(hop).getByRole('button', { name: 'Chọn hết' }))
    expect(within(hop).getByText(/có 1 câu tự luận — chiếu đủ/)).toBeTruthy()
    fireEvent.click(within(hop).getByRole('button', { name: 'Dùng 3 câu' }))
    expect(await screen.findByText(/3/, { selector: '.dh-tong b' })).toBeTruthy()
    expect(screen.getByText('Tự luận')).toBeTruthy()
    expect(screen.getByText(/xà phòng hoá ethyl acetate/)).toBeTruthy()
    // "Chiếu lên bảng" cần danh sách có mặt
    expect((screen.getByRole('button', { name: 'Chiếu lên bảng' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('Điểm danh ⇒ mở buổi + chiếu mã & QR; danh sách có mặt tự làm mới mỗi 5 giây qua nhịp chung', async () => {
    // Bước Điểm danh tách thành thành phần chung (29/09, dùng lại ở thẻ Kiểm tra đầu giờ) — nhịp 5 giây nằm ở đó.
    const nguon = readFileSync('src/components/day-hoc/DiemDanhBuoi.tsx', 'utf8')
    expect(nguon).toMatch(/useNhipThay\(lamMoi, NHIP_PHONG_CHO_THAY/)
    render(<DayHocLenBang />)
    fireEvent.click(await screen.findByRole('button', { name: 'Điểm danh' }))
    const tam = await screen.findByRole('dialog', { name: 'Chiếu mã điểm danh' })
    expect(within(tam).getByText('ĐIỂM DANH BUỔI HỌC')).toBeTruthy()
    expect(within(tam).getByRole('img', { name: 'Mã QR điểm danh' })).toBeTruthy()
    expect(within(tam).getByLabelText('Mã điểm danh 482915')).toBeTruthy()
    expect(goi).toHaveBeenCalledWith('/gv/buoi-hoc', expect.objectContaining({ action: 'mo', lop: '' }))
    // em điểm danh ⇒ lượt hỏi kế tiếp (5 giây) thấy tên
    coMat = [{ sbd: 'S1', hoTen: 'Nguyễn An', luc: '2026-09-28T11:01:00Z', cach: 'ma' }]
    await waitFor(() => expect(within(tam).getByText('Nguyễn An')).toBeTruthy(), { timeout: 7000 })
  }, 10000)

  it('có em + có câu ⇒ Chiếu lên bảng gọi em CÓ MẶT (câu Vận dụng ⇒ em bậc Vận dụng), mở tờ; "Em làm đúng" ghi bằng ghiLenBang', async () => {
    coMat = [
      { sbd: 'S1', hoTen: 'Nguyễn An', luc: '2026-09-28T11:01:00Z', cach: 'ma' },
      { sbd: 'S2', hoTen: 'Trần Bảo', luc: '2026-09-28T11:02:00Z', cach: 'thay' },
    ]
    goi.mockImplementation(async (duong: string, b: Record<string, unknown>) => {
      if (duong === '/gv/buoi-hoc' && b.action === 'dang-mo') return { ok: true, du: { ok: true, buoi: [BUOI] } }
      return (chuanMockGoc as (d: string, b: Record<string, unknown>) => unknown)(duong, b)
    })
    localStorage.setItem('ddh.dayHoc.BH-1', JSON.stringify({ maChon: locDeDayHoc(tachNhieuTheoPhan(KHO)).map((s) => s.maDe), boCau: ['DH-12-C1-B1-TN-I-1'], giao: {} }))
    render(<DayHocLenBang />)
    expect(await screen.findByText('Nguyễn An')).toBeTruthy()
    const nut = await screen.findByRole('button', { name: 'Chiếu lên bảng' })
    await waitFor(() => expect((nut as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(nut)
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/buoi-hoc/suc-hoc', expect.objectContaining({ sbd: ['S1', 'S2'] })))
    // câu 1 (Vận dụng, dạng thuỷ phân) ⇒ An (bậc Vận dụng)
    const dong = (await screen.findAllByText(/khả năng đúng ≈/))[0]!.closest('li')!
    expect(within(dong).getByText('Nguyễn An')).toBeTruthy()
    await waitFor(() => expect(document.querySelector('.lop-xem-phieu iframe')).toBeTruthy())
    fireEvent.click(within(dong).getByRole('button', { name: /Em làm đúng/ }))
    await waitFor(() => expect(ghiLenBang).toHaveBeenCalledWith('https://may-chu', 'mat', expect.objectContaining({ sbd: 'S1', dat: true })))
    expect(await within(dong).findByText('Đã ghi: làm đúng')).toBeTruthy()
  })
})

// bản gốc của mock chuẩn để test trên gọi lại
let chuanMockGoc: unknown
beforeEach(() => {
  chuanMockGoc = goi.getMockImplementation()
})

describe('app học sinh — Điểm danh buổi học', () => {
  const traLoi = (j: unknown) => ({ ok: true, status: 200, json: async () => j }) as unknown as Response
  it('có buổi của lớp em ⇒ thẻ nổi; nhập mã ⇒ gửi /hs/diem-danh với token (không gửi sbd)', async () => {
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/hs/buoi-hoc')) return traLoi({ ok: true, buoi: { id: 'BH-1', ten: 'Buổi học 28/09 · 12A1', lop: '12A1', daDiemDanh: false } })
      if (url.endsWith('/hs/diem-danh')) {
        const b = JSON.parse(String(init?.body))
        expect(b).toEqual({ token: 'tk', ma: '482915' })
        return traLoi({ ok: true, buoi: { id: 'BH-1', ten: 'Buổi học 28/09 · 12A1', lop: '12A1', daDiemDanh: true } })
      }
      return traLoi({ ok: false })
    })
    vi.stubGlobal('fetch', f)
    render(<TheDiemDanhHs token="tk" />)
    fireEvent.click(await screen.findByRole('button', { name: /Điểm danh buổi học/ }))
    fireEvent.change(screen.getByLabelText(/Mã 6 số trên máy chiếu/), { target: { value: '482 915' } })
    fireEvent.click(screen.getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByText('Em đã điểm danh')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('mã sai ⇒ lời máy chủ ngay cạnh ô nhập', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.endsWith('/hs/buoi-hoc')
          ? traLoi({ ok: true, buoi: { id: 'BH-1', ten: 'Buổi', lop: '', daDiemDanh: false } })
          : traLoi({ ok: false, lyDo: 'ma_sai', error: 'Mã không đúng hoặc đã đổi. Em nhìn mã MỚI trên máy chiếu (mã đổi mỗi phút).' }),
      ),
    )
    render(<TheDiemDanhHs token="tk" />)
    fireEvent.click(await screen.findByRole('button', { name: /Điểm danh buổi học/ }))
    fireEvent.change(screen.getByLabelText(/Mã 6 số trên máy chiếu/), { target: { value: '111111' } })
    fireEvent.click(screen.getByRole('button', { name: 'Điểm danh' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/mã đổi mỗi phút/)
    vi.unstubAllGlobals()
  })

  it('QUÉT QR: đường dẫn có ?diem-danh=<mã> ⇒ tự điểm danh một lần rồi xoá mã khỏi đường dẫn; không có buổi ⇒ không hiện gì', async () => {
    window.history.replaceState(null, '', '/hs?diem-danh=482915')
    const f = vi.fn(async (url: string) =>
      url.endsWith('/hs/diem-danh') ? traLoi({ ok: true, buoi: { id: 'BH-1', ten: 'Buổi học', lop: '', daDiemDanh: true } }) : traLoi({ ok: true, buoi: null }),
    )
    vi.stubGlobal('fetch', f)
    render(<TheDiemDanhHs token="tk" />)
    expect(await screen.findByText('Em đã điểm danh')).toBeTruthy()
    expect(window.location.search).toBe('')
    expect(f.mock.calls.filter(([u]) => String(u).endsWith('/hs/diem-danh')).length).toBe(1)
    cleanup()
    const { container } = render(<TheDiemDanhHs token="tk" />)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 20))
    })
    expect(container.innerHTML).toBe('')
    vi.unstubAllGlobals()
    window.history.replaceState(null, '', '/')
  })
})

describe('viên điểm danh gọn (29/09)', () => {
  it('rút tên buổi mặc định về ngày ngắn, tên thầy tự đặt giữ nguyên', async () => {
    const { ngayGon } = await import('../src/components/diem-danh/TheDiemDanhHs')
    expect(ngayGon('Buổi học 29/09/2026')).toBe('29/09')
    expect(ngayGon('Buổi học 3/10/2026')).toBe('03/10')
    expect(ngayGon('Ôn tập Ester')).toBe('Ôn tập Ester')
  })
})
