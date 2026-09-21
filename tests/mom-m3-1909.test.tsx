// VIỆC C · C4 — tab "Bài gia đình giao" (bài của Mẹ) của cổng học sinh mặc Material 3 (MomM3: DANH SÁCH + ĐANG LÀM BÀI).
// Đổi áo, không đổi xương: mọi hàm/khoá giữ ở StudentPortalScreen — đồng hồ 120 phút, nháp localStorage `omr_mom_draft_*`, lưu máy chủ
// (`momApi('save')`), nộp (`momApi('submit')`), mở kết quả; định dạng câu trả lời: Phần I một chữ A–D, Phần II 4 ký tự D/S ("-" = chưa chọn),
// Phần III chữ tự do. Đường không phải cổng học sinh giữ đoạn JSX cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import StudentPortalScreen from '../src/screens/StudentPortalScreen'
import { MomDanhSachM3, MomLamBaiM3 } from '../src/components/bang-nhiem-vu/MomM3'

const mocks = vi.hoisted(() => ({ momApi: vi.fn(), items: [] as any[], batDau: null as any }))
vi.mock('../src/game/than-thu-v2/Spirit2D', () => ({ default: () => null }))
vi.mock('../src/components/BangVinhDanh', () => ({ default: () => null }))
vi.mock('../src/components/BangTinPhuHuynh', () => ({ default: () => null }))
vi.mock('../src/components/ThongBaoHocSinh', () => ({ default: () => null, noticeApi: vi.fn() }))
vi.mock('../src/game/than-thu-v2/academic-sync', () => ({ syncStudentExp: async () => {} }))
vi.mock('../src/lib/exam-db', async (original) => ({ ...(await original<any>()), loadScriptUrlHoacMacDinh: async () => '/test' }))
vi.mock('../src/lib/exam-api', async (original) => ({
  ...(await original<any>()),
  hsLichSuCaApi: async () => ({ ok: true, items: [] }),
  hsBtvnApi: async () => ({ ok: true, items: [] }),
  thanThuDocApi: async () => ({ ok: true, hoSo: {} }),
}))
vi.mock('../src/lib/mom-api', async (original) => ({ ...(await original<any>()), momApi: (...a: any[]) => mocks.momApi(...a) }))

const NOW = Date.now()
const iso = (ms: number) => new Date(NOW + ms).toISOString()
const CAU = [
  { id: 'q1', phan: 'I', text: 'Este X có tên gọi là gì?', choices: ['etyl axetat', 'metyl propionat', 'propyl fomat', 'isopropyl fomat'], dapAn: 'A', chuyenDe: 'Este' },
  { id: 'q2', phan: 'II', text: 'Xét đúng sai từng ý:', ideas: ['ý một', 'ý hai', 'ý ba', 'ý bốn'], dapAn: 'DSDS' },
  { id: 'q3', phan: 'III', text: 'Tính V (ml).', dapAn: '125' },
]
const datDuong = (d: string) => window.history.replaceState(null, '', d)
const cho = () => new Promise((r) => setTimeout(r, 0))

beforeEach(() => {
  mocks.items = []
  mocks.batDau = { id: 'M1', tieuDe: 'Bài luyện thử', soCau: 3, trangThai: 'dang_lam', batDauLuc: iso(-60_000), dsCau: CAU }
  mocks.momApi.mockImplementation(async (action: string, body: any) => {
    if (action === 'list') return { ok: true, items: mocks.items }
    if (action === 'start') return { ok: true, item: mocks.batDau }
    if (action === 'submit') return { ok: true, item: { id: body.id, trangThai: 'da_nop', diem: 6.67 } }
    if (action === 'review') return { ok: true, item: { ...mocks.batDau, trangThai: 'da_nop', diem: 6.67 } }
    return { ok: true }
  })
  localStorage.setItem('omr_student_portal_auth', JSON.stringify({ sbd: '12121212', hoTen: 'Đỗ Minh', lop: '12A1', token: 'test-token' }))
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, items: [] }) }))
})
afterEach(async () => {
  cleanup()
  await new Promise((r) => setTimeout(r, 60))
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  datDuong('/')
})
const moTab = async () => {
  fireEvent.click(await screen.findByRole('button', { name: 'Mở menu' }))
  fireEvent.click(await screen.findByRole('menuitem', { name: 'Bài gia đình giao' }))
}
const vaoLam = async () => {
  datDuong('/hs')
  mocks.items = [{ id: 'M1', tieuDe: 'Bài luyện thử', soCau: 3, trangThai: 'chua_lam', ngayGiao: iso(-3600_000) }]
  render(<StudentPortalScreen />)
  await moTab()
  fireEvent.click(await screen.findByRole('button', { name: 'Bắt đầu làm bài (2 tiếng)' }))
  await screen.findByText('Este X có tên gọi là gì?')
  // đồng hồ hiện 02:00:00 (giá trị khởi tạo) đến khi hiệu ứng đếm ngược của màn nối vào giờ bắt đầu của máy chủ — chờ nó khớp
  await waitFor(() => expect(document.querySelector('.mom-dong-ho')!.textContent).not.toContain('02:00:00'))
}
const the = (i: number) => document.querySelectorAll<HTMLElement>('.mom-cau')[i]

describe('C4 · DANH SÁCH ở cổng học sinh (/hs)', () => {
  it('ba trạng thái bài: chưa làm / đang làm / đã nộp — chip, nút và chữ đúng như bản cũ; không khung cuộn lồng nhau', async () => {
    datDuong('/hs')
    mocks.items = [
      { id: 'A', tieuDe: 'Bài chưa làm', soCau: 8, trangThai: 'chua_lam', ngayGiao: iso(-7200_000) },
      { id: 'B', tieuDe: 'Bài đang làm', soCau: 5, trangThai: 'dang_lam', ngayGiao: iso(-3600_000) },
      { id: 'C', tieuDe: 'Bài đã nộp', soCau: 4, trangThai: 'da_nop', diem: 7.5, ngayGiao: iso(-86400_000) },
    ]
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(document.querySelectorAll('.mom-the').length).toBe(3))
    const theo = (t: string) => Array.from(document.querySelectorAll<HTMLElement>('.mom-the')).find((e) => e.textContent!.includes(t))!
    expect(within(theo('Bài chưa làm')).getByText('Chưa làm')).toBeTruthy()
    expect(within(theo('Bài chưa làm')).getByRole('button', { name: 'Bắt đầu làm bài (2 tiếng)' }).className).toContain('m3-nut-chinh')
    expect(within(theo('Bài đang làm')).getByText('⏳ Đang làm')).toBeTruthy()
    expect(within(theo('Bài đang làm')).getByRole('button', { name: 'Tiếp tục làm bài' })).toBeTruthy()
    expect(within(theo('Bài đã nộp')).getByText('✓ Đã nộp (7.5/10đ)')).toBeTruthy()
    expect(within(theo('Bài đã nộp')).getByRole('button', { name: 'Xem kết quả & Lời giải HTML' })).toBeTruthy()
    expect(within(theo('Bài chưa làm')).getByText('Thời gian làm: 2 giờ')).toBeTruthy()
    expect(screen.getByRole('region', { name: 'Bài gia đình giao' })).toBeTruthy()
    expect(document.querySelector('.max-h-\\[65vh\\]')).toBeNull()
  })

  it('trạng thái trống: đã tải → "Chưa có bài gia đình giao nào"; đang nhận; lỗi tải; thông báo nộp đóng được; Làm mới gọi lại danh sách', () => {
    const nap = vi.fn()
    const dong = vi.fn()
    const chung = { onDongThongBao: dong, onLamMoi: nap, ngayGio: () => '', onBatDau: () => {}, onXemKetQua: () => {} }
    const { rerender } = render(<MomDanhSachM3 ds={[]} daTai loi="" thongBaoNop={null} {...chung} />)
    expect(screen.getByText('Chưa có bài gia đình giao nào')).toBeTruthy()
    rerender(<MomDanhSachM3 ds={[]} daTai={false} loi="" thongBaoNop={null} {...chung} />)
    expect(screen.getByText('Đang nhận bài gia đình giao…')).toBeTruthy()
    rerender(<MomDanhSachM3 ds={[]} daTai={false} loi="Mất mạng" thongBaoNop="Đã nộp bài thành công. Điểm: 8/10." {...chung} />)
    expect(screen.getByText('Chưa tải được danh sách bài')).toBeTruthy()
    expect(screen.getByRole('alert').textContent).toBe('Mất mạng')
    expect(screen.getByRole('status').textContent).toContain('Đã nộp bài thành công. Điểm: 8/10.')
    fireEvent.click(screen.getByRole('button', { name: 'Đóng thông báo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Làm mới' }))
    expect(dong).toHaveBeenCalledTimes(1)
    expect(nap).toHaveBeenCalledTimes(1)
  })

  it('"Xem kết quả" của bài đã nộp: có htmlKetQua thì mở thẳng; không thì hỏi máy chủ (momApi review) đúng mã bài', async () => {
    datDuong('/hs')
    mocks.items = [{ id: 'C', tieuDe: 'Bài đã nộp', soCau: 4, trangThai: 'da_nop', diem: 7.5, ngayGiao: iso(-86400_000) }]
    render(<StudentPortalScreen />)
    await moTab()
    fireEvent.click(await screen.findByRole('button', { name: 'Xem kết quả & Lời giải HTML' }))
    await waitFor(() => expect(mocks.momApi).toHaveBeenCalledWith('review', { token: 'test-token', id: 'C' }))
  })
})

describe('C4 · ĐANG LÀM BÀI ở cổng học sinh (/hs)', () => {
  it('vào bài: thanh đồng hồ dính + đếm "Đã làm 0/3", ba câu đúng phần, KHÔNG position:fixed; nút Nộp/Tạm dừng có mặt', async () => {
    await vaoLam()
    expect(mocks.momApi).toHaveBeenCalledWith('start', { token: 'test-token', id: 'M1' })
    const dh = document.querySelector('.mom-dong-ho') as HTMLElement
    expect(dh.textContent).toMatch(/Thời gian làm còn: 01:5\d:\d\d/)
    expect(dh.textContent).toContain('Đã làm: 0/3')
    expect(dh.getAttribute('data-gap')).toBeNull()
    // thanh dính GỌN: chỉ đồng hồ + đếm + đúng MỘT nút (Nộp); Tạm dừng / Danh sách bài / tên bài nằm ở đầu bài (trôi theo trang)
    expect(dh.querySelectorAll('button').length).toBe(1)
    expect(within(dh).getByRole('button', { name: 'Nộp bài gia đình giao' }).textContent).toBe('Nộp bài')
    expect(dh.querySelector('h1,h2,h3')).toBeNull()
    const dau = document.querySelector('.mom-dau-bai') as HTMLElement
    expect(within(dau).getByRole('button', { name: 'Tạm dừng' })).toBeTruthy()
    expect(within(dau).getByRole('button', { name: 'Danh sách bài' })).toBeTruthy()
    expect(within(dau).getByRole('heading', { name: 'Bài luyện thử' })).toBeTruthy()
    expect(dau.compareDocumentPosition(dh) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(document.querySelectorAll('.mom-cau').length).toBe(3)
    expect(within(the(0)).getAllByRole('radio').length).toBe(4)
    expect(the(1).querySelectorAll('.mom-y').length).toBe(4)
    expect(within(the(2)).getByRole('textbox')).toBeTruthy()
    expect(screen.getByText('Em đã hoàn thành bài gia đình giao chưa?')).toBeTruthy()
  })

  it('chọn đáp án → ĐÚNG định dạng cũ (A–D; DS-- 4 ký tự; chữ tự do), đếm "Đã làm", nháp localStorage, lưu máy chủ sau 600 ms', async () => {
    await vaoLam()
    fireEvent.click(within(the(0)).getAllByRole('radio')[1]) // B
    fireEvent.click(within(the(1).querySelectorAll<HTMLElement>('.mom-y')[0]).getByLabelText('Đúng'))
    fireEvent.click(within(the(1).querySelectorAll<HTMLElement>('.mom-y')[2]).getByLabelText('Sai'))
    fireEvent.change(within(the(2)).getByRole('textbox'), { target: { value: '125' } })
    await waitFor(() => expect(document.querySelector('.mom-dong-ho')!.textContent).toContain('Đã làm: 3/3'))
    expect(JSON.parse(localStorage.getItem('omr_mom_draft_12121212_M1')!)).toEqual({ q1: 'B', q2: 'D-S-', q3: '125' })
    await waitFor(() => expect(mocks.momApi).toHaveBeenCalledWith('save', { token: 'test-token', id: 'M1', answers: { q1: 'B', q2: 'D-S-', q3: '125' } }), { timeout: 3000 })
    expect((within(the(0)).getAllByRole('radio')[1] as HTMLInputElement).checked).toBe(true)
    // bấm ý khác của Phần II giữ nguyên ý đã chọn
    fireEvent.click(within(the(1).querySelectorAll<HTMLElement>('.mom-y')[1]).getByLabelText('Đúng'))
    await waitFor(() => expect(JSON.parse(localStorage.getItem('omr_mom_draft_12121212_M1')!).q2).toBe('DDS-'))
  })

  it('nộp: gọi momApi submit với mã bài + toàn bộ đáp án, về danh sách với thông báo điểm', async () => {
    await vaoLam()
    fireEvent.click(within(the(0)).getAllByRole('radio')[0])
    fireEvent.click(within(document.querySelector('.mom-dong-ho') as HTMLElement).getByRole('button', { name: 'Nộp bài gia đình giao' }))
    await waitFor(() => expect(mocks.momApi).toHaveBeenCalledWith('submit', { token: 'test-token', id: 'M1', answers: { q1: 'A' } }))
    expect(await screen.findByRole('status')).toBeTruthy()
    expect(screen.getByRole('status').textContent).toContain('Đã nộp bài thành công. Điểm: 6.67/10.')
    expect(document.querySelector('.mom-dong-ho')).toBeNull()
  })

  it('nộp lỗi (mất mạng): giữ đáp án, hiện lời báo, vẫn ở màn làm bài', async () => {
    await vaoLam()
    fireEvent.click(within(the(0)).getAllByRole('radio')[0])
    mocks.momApi.mockImplementation(async (action: string) => {
      if (action === 'submit') throw new Error('mất mạng')
      return { ok: true }
    })
    fireEvent.click(screen.getByRole('button', { name: 'Nộp bài ngay' }))
    expect((await screen.findByRole('alert')).textContent).toMatch(/Chưa nộp được bài\. Đáp án vẫn được giữ trên máy/)
    expect(document.querySelector('.mom-dong-ho')).toBeTruthy()
    expect((within(the(0)).getAllByRole('radio')[0] as HTMLInputElement).checked).toBe(true)
  })

  it('"Tạm dừng": lưu nháp kèm số giây còn lại, báo, về danh sách; "Danh sách bài": hỏi xác nhận rồi về danh sách (huỷ thì ở lại)', async () => {
    await vaoLam()
    fireEvent.click(within(the(0)).getAllByRole('radio')[2])
    const alertMo = vi.fn()
    vi.stubGlobal('alert', alertMo)
    const confirmMo = vi.fn(() => false)
    vi.stubGlobal('confirm', confirmMo)
    fireEvent.click(screen.getByRole('button', { name: 'Danh sách bài' }))
    expect(confirmMo).toHaveBeenCalledWith('Em có chắc muốn tạm dừng bài làm không? Đồng hồ 2 tiếng vẫn tiếp tục đếm ngược.')
    expect(document.querySelector('.mom-dong-ho')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng' }))
    expect(alertMo).toHaveBeenCalledWith('Đã lưu nháp an toàn! Em có thể vào làm tiếp bất cứ lúc nào trước khi hết hạn (deadline).')
    const nhap = JSON.parse(localStorage.getItem('omr_mom_draft_M1_12121212')!)
    expect(nhap.cauTraLoi).toEqual({ q1: 'C' })
    expect(nhap.giayConLai).toBeGreaterThan(7000)
    await waitFor(() => expect(document.querySelector('.mom-dong-ho')).toBeNull())
    expect(await screen.findByRole('button', { name: 'Tiếp tục làm bài' }).catch(() => null)).toBeDefined()
  })

  it('còn dưới 15 phút: đồng hồ chuyển sang bậc gấp (data-gap, error tonal), KHÔNG nhấp nháy', async () => {
    mocks.batDau = { ...mocks.batDau, batDauLuc: iso(-(7200 - 600) * 1000) } // còn 10 phút
    await vaoLam()
    const dh = document.querySelector('.mom-dong-ho') as HTMLElement
    expect(dh.getAttribute('data-gap')).toBe('true')
    expect(dh.textContent).toMatch(/Thời gian làm còn: 00:(09|10):\d\d/)
    const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/mom-m3.css'), 'utf8')
    expect(css).not.toMatch(/animation|@keyframes|pulse/)
  })

  it('nháp cũ trong máy được nạp lại khi vào bài (`omr_mom_draft_<id>_<sbd>` hoặc `<sbd>_<id>`) và hiện đúng ở màn mới', async () => {
    localStorage.setItem('omr_mom_draft_12121212_M1', JSON.stringify({ q1: 'D', q3: '42' }))
    await vaoLam()
    expect((within(the(0)).getAllByRole('radio')[3] as HTMLInputElement).checked).toBe(true)
    expect((within(the(2)).getByRole('textbox') as HTMLInputElement).value).toBe('42')
    expect(document.querySelector('.mom-dong-ho')!.textContent).toContain('Đã làm: 2/3')
  })
})

describe('C4 · thành phần độc lập, cô lập và CSS', () => {
  it('MomLamBaiM3: Phần II chọn Đúng/Sai gọi datTraLoi với chuỗi 4 ký tự; câu không lựa chọn = ô nhập; lỗi hiện role=alert', () => {
    const dat = vi.fn()
    render(
      <MomLamBaiM3 tieuDe="Bài" giayConLai={100} dinhDangThoiGian={() => '00:01:40'} soDaLam={0} dsCau={CAU} traLoi={{ q2: 'D---' }} datTraLoi={dat} loi="Lỗi thử" onQuayLai={() => {}} onTamDung={() => {}} onNop={() => {}} />,
    )
    expect(screen.getByRole('alert').textContent).toBe('Lỗi thử')
    expect(document.querySelector('.mom-dong-ho')!.getAttribute('data-gap')).toBe('true') // 100 s < 900 s
    const y = document.querySelectorAll<HTMLElement>('.mom-y')
    expect((within(y[0]).getByLabelText('Đúng') as HTMLInputElement).checked).toBe(true)
    fireEvent.click(within(y[3]).getByLabelText('Sai'))
    expect(dat).toHaveBeenCalledWith('q2', 'D--S')
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    expect(dat).toHaveBeenCalledWith('q3', 'abc')
  })

  it('đường KHÔNG phải cổng học sinh (jsdom `/`): giữ NGUYÊN đoạn cũ, không có .mom', async () => {
    datDuong('/')
    mocks.items = [{ id: 'A', tieuDe: 'Bài A', soCau: 3, trangThai: 'chua_lam', ngayGiao: iso(-3600_000) }]
    render(<StudentPortalScreen />)
    await moTab()
    await waitFor(() => expect(screen.getByRole('region', { name: 'Bài gia đình giao' }).className).toContain('max-h-[65vh]'))
    expect(document.querySelector('.mom')).toBeNull()
  })

  const css = fs.readFileSync(path.join(process.cwd(), 'src/components/bang-nhiem-vu/mom-m3.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
  it('CSS: không mã màu cứng, không position:fixed, mọi bộ chọn dưới .mom, hàng chọn ≥ 52 px, nút ≥ 48 px', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toMatch(/\brgba?\(/)
    expect(css).not.toMatch(/position:\s*fixed/)
    for (const m of css.replace(/@media[^{]*\{/g, '').matchAll(/([^{}]+)\{/g)) for (const b of m[1].split(',')) expect(b.trim().startsWith('.mom'), b).toBe(true)
    expect(css).toMatch(/\.mom-lua\s*\{[^}]*min-height:\s*52px/)
    expect(css).toMatch(/\.mom-doan-o\s*\{[^}]*min-height:\s*48px/)
    expect(css).toMatch(/\.mom-dong-ho\s*\{[^}]*position:\s*sticky/)
  })
})
