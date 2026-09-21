// TOÀN CẢNH MỘT EM (Hôm nay v2, bước 5; thầy lệnh 21/09; bản vẽ docs/ban-ve-hom-nay-v2-2109/3-toan-canh-mot-em-1440.jpg; chuẩn chữ docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md).
// Nói thật: trường tuỳ chọn thiếu ⇒ ẩn; chưa có lệnh `/gv/em-toan-canh` ⇒ lời thật + vẫn hiện tên em từ danh sách lớp; KHÔNG chip đếm theo loại (máy chủ không trả); "Mở app" chỉ hiện khi thấy thật.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import ToanCanhEmScreen from '../src/screens/ToanCanhEmScreen'
import { useAppStore } from '../src/store/appStore'
import { docToanCanh, gioPhutVN, layToanCanh, luoiNhip, moiXemChu, nhanNgay, nhomTheoNgay, ngayThuChu, ngayVN, tomTatNhip, type NhipNgay, type SuKienEm } from '../src/lib/em-toan-canh'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

const goi = vi.fn()
type Tra = { status?: number; json?: unknown; cham?: boolean }
function dungMayChu(bang: Record<string, (body: Record<string, unknown>) => Tra | Promise<Tra>>) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const duong = url.replace('https://may.test', '')
    const body = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>
    goi(duong, body)
    const h = bang[duong]
    if (!h) return { status: 404, ok: false, json: async () => ({}) }
    const r = await h(body)
    if (r.cham) {
      const e = new Error('abort')
      e.name = 'AbortError'
      throw e
    }
    const status = r.status ?? 200
    return { status, ok: status < 400, json: async () => r.json }
  })
}

const NAY = Date.parse('2026-09-21T13:31:00Z') // 20:31 Thứ Hai 21/09/2026 giờ VN
const sk = (luc: string, loai: string, tieuDe: string, o: Record<string, unknown> = {}) => ({ luc, loai, tieuDe, chiTiet: { mota: '' }, chips: [], ...o })
const DONG_1: unknown[] = [
  sk('2026-09-21T13:14:00Z', 'btvn', 'Chương 1 · Ester – Lipid · chặng 3 trong 7 chặng', { chiTiet: { mota: 'Làm 6 câu trong 14 phút: đúng 5, sai 1.', maBtvn: 'B1' }, chips: [{ chu: '5 đúng', muc: 'tot' }, { chu: '1 sai', muc: 'sai' }, { chu: 'câu cốt lõi 4/6', muc: 'trung' }] }),
  sk('2026-09-21T13:02:00Z', 'bo_nao', 'Lời Bộ não A.I đã gửi cho em', { chiTiet: { mota: '“Hôm qua em làm xong 4 câu đầu chặng 3.”' }, chips: [{ chu: 'đã gửi 20:02', muc: 'tot' }] }),
  sk('2026-09-20T14:10:00Z', 'ca', 'Ca kiểm tra Chương 1 · 8,25 điểm', { chiTiet: { mota: 'Làm 44/50 phút · rời màn 1 lần (12 giây).', maCa: '784817' }, chips: [{ chu: '8,25 điểm', muc: 'tot' }] }),
]
const DONG_2: unknown[] = [sk('2026-09-15T02:00:00Z', 'on_lai', 'Ôn lại 1·3·7 ngày', { chiTiet: { mota: '4 câu tới hạn: đúng lại 3/4.' } })]
const nhip = (): NhipNgay[] => Array.from({ length: 30 }, (_, i) => ({ ngay: new Date(Date.parse('2026-08-23T00:00:00Z') + i * 86400000).toISOString().slice(0, 10), muc: (i % 4 === 0 ? 0 : (i % 3) + 1) as 0 | 1 | 2 | 3 }))
const EM = {
  sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12A1', namSinh: '2008',
  thanThu: { ten: 'Thuỷ Long', cap: 12 }, chuoiNgay: 12,
  hoatDongCuoi: { luc: '2026-09-21T13:14:00Z', viec: 'làm Bài tập về nhà' },
  phuHuynhXemCuoi: '2026-09-20T14:32:00Z',
  diemCaGanNhat: { diem: 8.25, tenCa: 'Kiểm tra Chương 1', maCa: '784817' },
  expHomNay: 85, expTong: 4210,
}
const DANG = [
  { ma: 'a', ten: 'Oxi hoá ancol', bac: 'biet', gap: 9, sai: 6, khacPhuc: 1, xuHuong: 'giam', cauSaiGanNhat: { stt: 14, emChon: 'A', dapAn: 'C' } },
  { ma: 'b', ten: 'Xà phòng hoá', bac: 'hieu', gap: 7, sai: 1, khacPhuc: 3, xuHuong: 'tang' },
]
const day = (o: Record<string, unknown> = {}) => ({ ok: true, em: EM, dong: DONG_1, conNua: '2026-09-20T14:10:00Z', dang: DANG, nhip30: nhip(), soTruyVan: 5, ...o })

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
  vi.useRealTimers()
})

describe('em-toan-canh — phần THUẦN', () => {
  it('ngày giờ VN 24 giờ: mốc 17:30Z hôm trước = 00:30 hôm sau (giờ VN); thứ tính theo lịch', () => {
    expect(ngayVN('2026-09-20T17:30:00Z')).toBe('2026-09-21')
    expect(gioPhutVN('2026-09-20T17:30:00Z')).toBe('00:30')
    expect(gioPhutVN('2026-09-21T16:59:00Z')).toBe('23:59')
    expect(gioPhutVN('hỏng')).toBe('')
    expect(ngayThuChu('2026-09-21')).toBe('Thứ Hai 21/09/2026')
    expect(ngayThuChu('2026-09-20')).toBe('Chủ nhật 20/09/2026')
    expect(ngayThuChu('xx')).toBe('')
  })

  it('nhanNgay / moiXemChu: "Hôm nay · …" · "Hôm qua · …" · ngày cũ; "hôm nay 20:14" · "hôm qua 21:32" · "15/09/2026 08:05"', () => {
    expect(nhanNgay('2026-09-21', NAY)).toBe('Hôm nay · Thứ Hai 21/09/2026')
    expect(nhanNgay('2026-09-20', NAY)).toBe('Hôm qua · Chủ nhật 20/09/2026')
    expect(nhanNgay('2026-09-15', NAY)).toBe('Thứ Ba 15/09/2026')
    expect(moiXemChu('2026-09-21T13:14:00Z', NAY)).toBe('hôm nay 20:14')
    expect(moiXemChu('2026-09-20T14:32:00Z', NAY)).toBe('hôm qua 21:32')
    expect(moiXemChu('2026-09-15T01:05:00Z', NAY)).toBe('15/09/2026 08:05')
    expect(moiXemChu('', NAY)).toBe('')
  })

  it('nhomTheoNgay: gộp theo NGÀY VN giữ thứ tự máy chủ (mới nhất trước)', () => {
    const d = [sk('2026-09-20T17:30:00Z', 'game', 'A'), sk('2026-09-21T13:00:00Z', 'exp', 'B'), sk('2026-09-20T05:00:00Z', 'ca', 'C')] as unknown as SuKienEm[]
    const n = nhomTheoNgay(d, NAY)
    expect(n.map((x) => [x.nhan, x.viec.length])).toEqual([['Hôm nay · Thứ Hai 21/09/2026', 2], ['Hôm qua · Chủ nhật 20/09/2026', 1]]) // 17:30Z ngày 20 đã sang ngày 21 giờ VN
  })

  it('luoiNhip: mỗi hàng một tuần thứ Hai → Chủ nhật; ô đầu lệch đúng thứ; tomTatNhip đếm ngày học + chuỗi liền dài nhất', () => {
    const l = luoiNhip(nhip()) // 23/08/2026 là Chủ nhật ⇒ 6 ô trống rồi ngày đầu ở cột CN
    expect(l[0].slice(0, 6).every((o) => o === null)).toBe(true)
    expect(l[0][6]?.ngay).toBe('2026-08-23')
    expect(l.every((h) => h.length === 7)).toBe(true)
    expect(l.flat().filter(Boolean)).toHaveLength(30)
    expect(luoiNhip([])).toEqual([])
    const t = tomTatNhip([1, 1, 0, 2, 3, 1, 0].map((m, i) => ({ ngay: `2026-09-0${i + 1}`, muc: m as 0 | 1 | 2 | 3 })))
    expect(t).toEqual({ ngayHoc: 5, tong: 7, chuoiDaiNhat: 3 })
  })

  it('docToanCanh: thiếu em.sbd ⇒ null; việc loại lạ/không giờ/không tiêu đề bị bỏ; chiTiet chuỗi trần được nhận; điểm ca gần nhất nhận cả số trần lẫn đối tượng; chip lạ ⇒ trung', () => {
    expect(docToanCanh({ ok: true, em: { hoTen: 'A' } })).toBeNull()
    expect(docToanCanh({ ok: true })).toBeNull()
    const r = docToanCanh({
      em: { sbd: '1', hoTen: 'A', diemCaGanNhat: 7.5 },
      dong: [sk('2026-09-21T01:00:00Z', 'ca', 'Ca'), { luc: '2026-09-21T01:00:00Z', loai: 'la', tieuDe: 'x' }, { loai: 'ca', tieuDe: 'thiếu giờ' }, { luc: '2026-09-21T02:00:00Z', loai: 'game', tieuDe: 'Game', chiTiet: 'Góp sức 2 lượt', chips: [{ chu: 'x', muc: 'la' }, { muc: 'tot' }] }],
      dang: [{ ten: 'D', sai: 'nhiều' }, { sai: 1 }],
      nhip30: [{ ngay: '2026-09-01', muc: 9 }, { ngay: 'hỏng', muc: 1 }],
    })!
    expect(r.em.diemCaGanNhat).toEqual({ diem: 7.5, tenCa: '', maCa: '', luc: '' })
    expect(r.dong.map((v) => v.tieuDe)).toEqual(['Ca', 'Game'])
    expect(r.dong[1].mota).toBe('Góp sức 2 lượt')
    expect(r.dong[1].chips).toEqual([{ chu: 'x', muc: 'trung' }])
    expect(r.dang).toEqual([{ ma: '', ten: 'D', bac: '', gap: null, sai: null, khacPhuc: null, xuHuong: '', cauSaiGanNhat: null }])
    expect(r.nhip30).toEqual([{ ngay: '2026-09-01', muc: 0 }])
    expect(docToanCanh({ em: { sbd: '1', diemCaGanNhat: { diem: 9, tenCa: 'K', maCa: '5' } } })!.em.diemCaGanNhat).toMatchObject({ diem: 9, tenCa: 'K', maCa: '5' })
    expect(docToanCanh({ em: { sbd: '1' } })!.em.diemCaGanNhat).toBeNull()
  })

  it('layToanCanh: POST /gv/em-toan-canh {sbd} (+truoc, +loai khi có); 404 ⇒ lời thật; trả không đúng dạng ⇒ khong_doc_duoc', async () => {
    dungMayChu({ '/gv/em-toan-canh': () => ({ json: day() }) })
    const a = await layToanCanh('12121007')
    expect(a.ok && a.du.dong).toHaveLength(3)
    expect(goi.mock.calls[0]).toEqual(['/gv/em-toan-canh', { sbd: '12121007' }])
    await layToanCanh('12121007', { truoc: '2026-09-20T14:10:00Z', loai: ['on_lai'] })
    expect(goi.mock.calls[1][1]).toEqual({ sbd: '12121007', truoc: '2026-09-20T14:10:00Z', loai: ['on_lai'] })
    await layToanCanh('1', { loai: [] })
    expect(goi.mock.calls[2][1]).toEqual({ sbd: '1' }) // loai rỗng ⇒ không gửi
    dungMayChu({})
    const l = await layToanCanh('1')
    expect(l).toMatchObject({ ok: false, loai: 'chua_co_lenh' })
    dungMayChu({ '/gv/em-toan-canh': () => ({ json: { ok: true } }) })
    expect(await layToanCanh('1')).toMatchObject({ ok: false, loai: 'khong_doc_duoc' })
  })
})

describe('ToanCanhEmScreen — trang Toàn cảnh một em', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(NAY)
    useAppStore.setState({ screen: 'toancanh', sbdToanCanh: '12121007', sbdGiaoRieng: '', sbdDangXem: '', maCaTheoDoi: '', classList: [{ sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12A1', sdt: '', namSinh: '2008', raw: {} }] as never } as never)
  })
  const chay = async (h: (b: Record<string, unknown>) => Tra | Promise<Tra> = () => ({ json: day() })) => {
    dungMayChu({ '/gv/em-toan-canh': h })
    const r = render(<ToanCanhEmScreen />)
    await screen.findByText('Dòng thời gian · mọi việc em đã làm')
    return r
  }

  it('CÓ ĐỦ DỮ LIỆU: đầu trang (tên · SBD · lớp · thần thú · chuỗi · hoạt động cuối · phụ huynh xem) + hai số + nhóm ngày + việc + bản đồ dạng + nhịp 30 ngày + thẻ phụ huynh', async () => {
    const { container } = await chay()
    expect(container.querySelector('h1')!.textContent).toBe('Trần Thu Hà')
    const dau = container.querySelector('[data-khoi="ho-so"]') as HTMLElement
    expect(within(dau).getByText('#12121007')).toBeTruthy()
    expect(within(dau).getByText('Lớp 12A1')).toBeTruthy()
    expect(within(dau).getByText('sinh 2008')).toBeTruthy()
    expect(within(dau).getByText('Thần thú: Thuỷ Long · cấp 12')).toBeTruthy()
    expect(within(dau).getByText('Chuỗi 12 ngày')).toBeTruthy()
    expect(within(dau).getByText('Hoạt động cuối: hôm nay 20:14 · làm Bài tập về nhà')).toBeTruthy()
    expect(within(dau).getByText('Phụ huynh xem app: hôm qua 21:32')).toBeTruthy()
    const so = container.querySelector('.tc-so') as HTMLElement
    expect(within(so).getByText('8,25')).toBeTruthy()
    expect(within(so).getByText('Kiểm tra Chương 1')).toBeTruthy()
    expect(within(so).getByText('+85')).toBeTruthy()
    expect(within(so).getByText('tổng 4.210')).toBeTruthy()
    // dòng thời gian: hai nhóm ngày, giờ 24 giờ, mô tả + chip
    expect(screen.getByText('Hôm nay · Thứ Hai 21/09/2026')).toBeTruthy()
    expect(screen.getByText('Hôm qua · Chủ nhật 20/09/2026')).toBeTruthy()
    const btvn = container.querySelector('[data-loai="btvn"]') as HTMLElement
    expect(within(btvn).getByText('20:14')).toBeTruthy()
    expect(within(btvn).getByText('Làm 6 câu trong 14 phút: đúng 5, sai 1.')).toBeTruthy()
    expect(within(btvn).getByText('1 sai').className).toContain('hn2-chip--loi')
    expect(within(btvn).getByText('5 đúng').className).toContain('hn2-chip--tot')
    // bản đồ dạng
    const dang = container.querySelector('[data-khoi="ban-do-dang"]') as HTMLElement
    expect(within(dang).getByText('2 dạng đã gặp')).toBeTruthy()
    expect(within(dang).getByText('đang giảm')).toBeTruthy()
    expect(within(dang).getByText('đang lên')).toBeTruthy()
    expect(within(dang).getByText('bậc Biết')).toBeTruthy()
    expect(within(dang).getByText('đã khắc phục 1')).toBeTruthy()
    expect(within(dang).getByText('Câu sai gần nhất: Câu 14 · em chọn A (đáp án C)')).toBeTruthy()
    expect(within(dang).getByRole('img', { name: 'sai 6 trên 9 câu đã gặp' }).querySelector('i')!.style.width).toBe('67%') // sai/gặp = 6/9
    expect(within(dang).getByRole('img', { name: 'sai 1 trên 7 câu đã gặp' }).querySelector('i')!.style.width).toBe('14%')
    // nhịp 30 ngày + phụ huynh
    const nh = container.querySelector('[data-khoi="nhip-hoc"]') as HTMLElement
    expect(within(nh).getByText(/^học \d+\/30 ngày$/)).toBeTruthy()
    expect(nh.querySelectorAll('.tc-o[title]')).toHaveLength(30)
    expect(within(container.querySelector('[data-khoi="phu-huynh"]') as HTMLElement).getByText('hôm qua 21:32')).toBeTruthy()
    // gỡ 21/09: KHÔNG có nút Nhắn phụ huynh (thầy lệnh Bỏ phiếu Zalo)
    expect(screen.queryByRole('button', { name: 'Nhắn phụ huynh' })).toBeNull()
    // chuẩn chữ
    for (const cam of ['xấu đi', 'khá lên', 'kém', 'nắm chắc', 'lười']) expect(container.textContent).not.toContain(cam)
  })

  it('HÀNH ĐỘNG: Giao bài riêng ⇒ tick sẵn em + màn Giao bài · Cho thi lại ⇒ mở ca gần nhất · Xem hồ sơ học sinh ⇒ hồ sơ · "Mở ca" trong dòng thời gian · Về Hôm nay', async () => {
    await chay()
    fireEvent.click(screen.getByRole('button', { name: 'Giao bài riêng' }))
    expect([useAppStore.getState().sbdGiaoRieng, useAppStore.getState().screen]).toEqual(['12121007', 'giaobtvn'])
    useAppStore.setState({ screen: 'toancanh' } as never)
    fireEvent.click(screen.getByRole('button', { name: 'Cho thi lại' }))
    expect([useAppStore.getState().maCaTheoDoi, useAppStore.getState().screen]).toEqual(['784817', 'exammonitor'])
    useAppStore.setState({ screen: 'toancanh' } as never)
    fireEvent.click(screen.getByRole('button', { name: 'Xem hồ sơ học sinh' }))
    expect([useAppStore.getState().sbdDangXem, useAppStore.getState().screen]).toEqual(['12121007', 'hocsinh'])
    useAppStore.setState({ screen: 'toancanh', maCaTheoDoi: '' } as never)
    fireEvent.click(screen.getByRole('button', { name: 'Mở ca 784817' }))
    expect(useAppStore.getState().maCaTheoDoi).toBe('784817')
    useAppStore.setState({ screen: 'toancanh' } as never)
    fireEvent.click(screen.getByRole('button', { name: /Về Hôm nay/ }))
    expect(useAppStore.getState().screen).toBe('examhub')
  })

  it('"Cho thi lại" CHỈ hiện khi biết ca (không đoán mã ca)', async () => {
    await chay(() => ({ json: day({ em: { ...EM, diemCaGanNhat: undefined }, dong: [DONG_1[0], DONG_1[1]] }) }))
    expect(screen.queryByRole('button', { name: 'Cho thi lại' })).toBeNull()
  })

  it('BỘ LỌC: không chip đếm số; có 9 loại (không "Mở app" khi chưa thấy); bấm loại ⇒ hỏi {sbd, loai:[…]} và thay dòng thời gian; "Tất cả" trả lại', async () => {
    await chay((b) => ((b.loai as string[] | undefined)?.[0] === 'on_lai' ? { json: day({ dong: DONG_2, conNua: '' }) } : { json: day() }))
    const nhom = screen.getByRole('group', { name: 'Lọc theo loại việc' })
    expect(within(nhom).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tất cả', 'Ca kiểm tra', 'Bài tập về nhà', 'Ôn lại', 'Bài riêng', 'Lên bảng', 'Game', 'EXP', 'Bộ não A.I', 'Cảnh báo của thầy'])
    fireEvent.click(within(nhom).getByRole('button', { name: 'Ôn lại' }))
    await screen.findByText('Ôn lại 1·3·7 ngày')
    expect(goi.mock.calls.at(-1)).toEqual(['/gv/em-toan-canh', { sbd: '12121007', loai: ['on_lai'] }])
    expect(screen.queryByText('Lời Bộ não A.I đã gửi cho em')).toBeNull()
    expect(within(nhom).getByRole('button', { name: 'Ôn lại' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.queryByRole('button', { name: 'Xem thêm việc cũ hơn' })).toBeNull() // hết trang
    fireEvent.click(within(nhom).getByRole('button', { name: 'Tất cả' }))
    await screen.findByText('Lời Bộ não A.I đã gửi cho em')
    expect(goi.mock.calls.at(-1)).toEqual(['/gv/em-toan-canh', { sbd: '12121007' }])
  })

  it('ĐỔI EM: bộ lọc loại về "Tất cả" và hỏi lại KHÔNG kèm loại (không mang bộ lọc của em trước sang em sau)', async () => {
    await chay()
    fireEvent.click(screen.getByRole('button', { name: 'Ôn lại' }))
    await waitFor(() => expect(goi.mock.calls.at(-1)[1]).toEqual({ sbd: '12121007', loai: ['on_lai'] }))
    act(() => useAppStore.getState().moToanCanh('12121034'))
    await waitFor(() => expect(goi.mock.calls.at(-1)[1]).toEqual({ sbd: '12121034' }))
    await screen.findByText('Dòng thời gian · mọi việc em đã làm')
    expect(screen.getByRole('button', { name: 'Tất cả' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('"MỞ APP": chỉ có bộ lọc này khi máy chủ THẬT SỰ trả loại ấy', async () => {
    await chay(() => ({ json: day({ dong: [...(DONG_1 as object[]), sk('2026-09-21T12:00:00Z', 'mo_app', 'Mở app')] }) }))
    expect(within(screen.getByRole('group', { name: 'Lọc theo loại việc' })).getByRole('button', { name: 'Mở app' })).toBeTruthy()
  })

  it('XEM THÊM: bấm ⇒ hỏi {sbd, truoc: conNua} rồi NỐI vào cuối; hết trang ⇒ nút biến mất; giữ bộ lọc đang chọn', async () => {
    await chay((b) => (b.truoc ? { json: day({ dong: DONG_2, conNua: '' }) } : { json: day() }))
    fireEvent.click(screen.getByRole('button', { name: 'Xem thêm việc cũ hơn' }))
    await screen.findByText('Ôn lại 1·3·7 ngày')
    expect(goi.mock.calls.at(-1)).toEqual(['/gv/em-toan-canh', { sbd: '12121007', truoc: '2026-09-20T14:10:00Z' }])
    expect(screen.getByText('Lời Bộ não A.I đã gửi cho em')).toBeTruthy() // việc cũ vẫn còn
    expect(screen.getByText('Thứ Ba 15/09/2026')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Xem thêm việc cũ hơn' })).toBeNull()
  })

  it('TRỐNG / THIẾU: em chưa có việc ⇒ nói rõ; thiếu thần thú/chuỗi/hoạt động/phụ huynh ⇒ ẨN (không bịa); thẻ phụ huynh nói "máy chủ chưa trả"; dạng và nhịp rỗng ⇒ lời thật', async () => {
    const { container } = await chay(() => ({ json: { ok: true, em: { sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12A1' }, dong: [], dang: [], nhip30: [] } }))
    expect(screen.getByText('Em chưa có việc nào được ghi.')).toBeTruthy()
    const dau = container.querySelector('[data-khoi="ho-so"]') as HTMLElement
    for (const c of ['Thần thú', 'Chuỗi', 'Hoạt động cuối', 'Phụ huynh xem app']) expect(dau.textContent).not.toContain(c)
    expect(container.querySelector('.tc-so')).toBeNull()
    expect(screen.getByText('Chưa có dạng nào đủ dữ liệu để hiện.')).toBeTruthy()
    expect(screen.getByText('Chưa có số liệu nhịp học 30 ngày.')).toBeTruthy()
    expect(screen.getByText('Máy chủ chưa trả lần xem app của phụ huynh.')).toBeTruthy()
  })

  it('CHƯA CÓ LỆNH (404): lời thật trung tính (không đỏ) + vẫn có tên em từ danh sách lớp + nút Giao bài riêng dùng được; KHÔNG dựng khối nào bằng số bịa', async () => {
    dungMayChu({})
    const { container } = render(<ToanCanhEmScreen />)
    const ghi = await screen.findByText(/chưa có lệnh Toàn cảnh một em/)
    expect(ghi.closest('.hn2-ghi-chu')!.className).not.toMatch(/--(canh|loi)/)
    expect(container.querySelector('h1')!.textContent).toBe('Trần Thu Hà')
    expect(screen.getByText('Lớp 12A1')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Giao bài riêng' }))
    expect(useAppStore.getState().screen).toBe('giaobtvn')
    expect(container.querySelector('.tc-luoi')).toBeNull()
  })

  it('LỖI THẬT (chậm): role=alert, không nói "chưa có lệnh"', async () => {
    dungMayChu({ '/gv/em-toan-canh': () => ({ cham: true }) })
    render(<ToanCanhEmScreen />)
    const canh = await screen.findByRole('alert')
    expect(canh.textContent).not.toMatch(/chưa có lệnh/)
  })

  it('ĐỔI EM khi kết quả em cũ về MUỘN: bỏ kết quả cũ, không để dòng thời gian của em khác chen vào', async () => {
    let xong: (t: Tra) => void = () => {}
    const cho = new Promise<Tra>((r) => (xong = r))
    dungMayChu({ '/gv/em-toan-canh': (b) => (b.sbd === '12121007' ? cho : { json: day({ em: { ...EM, sbd: '12121034', hoTen: 'Nguyễn Minh Khôi' }, dong: [DONG_1[1]] }) }) })
    const { container } = render(<ToanCanhEmScreen />)
    act(() => useAppStore.getState().moToanCanh('12121034'))
    await screen.findByText('Nguyễn Minh Khôi')
    await act(async () => {
      xong({ json: day() }) // em cũ trả lời sau
      await Promise.resolve()
    })
    expect(container.querySelector('h1')!.textContent).toBe('Nguyễn Minh Khôi')
    expect(screen.queryByText('Chương 1 · Ester – Lipid · chặng 3 trong 7 chặng')).toBeNull()
  })

  it('Ô TRA CỨU ở đầu trang: gõ tên KHÔNG DẤU + Enter ⇒ sang toàn cảnh em đó', async () => {
    useAppStore.setState({ classList: [{ sbd: '12121007', hoTen: 'Trần Thu Hà', lop: '12A1', sdt: '', namSinh: '', raw: {} }, { sbd: '12121034', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', sdt: '', namSinh: '', raw: {} }] as never } as never)
    await chay()
    const o = screen.getByRole('combobox', { name: 'Tìm học sinh theo tên hoặc số báo danh' })
    fireEvent.change(o, { target: { value: 'minh khoi' } })
    fireEvent.keyDown(o, { key: 'Enter' })
    expect(useAppStore.getState().sbdToanCanh).toBe('12121034')
  })

  it('CÁC LỐI VÀO: thanh bên sáng "Hôm nay" khi đứng ở Toàn cảnh; App có màn này', async () => {
    const { mucDangSang } = await import('../src/components/ThanhBenTrai')
    expect(mucDangSang('toancanh')).toBe('examhub')
    const app = (await import('../src/App.tsx?raw')).default
    expect(app).toContain("screen === 'toancanh' && <ToanCanhEmScreen />")
  })
})
