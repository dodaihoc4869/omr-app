// HÔM NAY BẢN 2 · bước 3 — ô "EM CẦN THẦY GIÚP" có CHI TIẾT DẠNG (thầy lệnh 21/09; bản vẽ docs/ban-ve-hom-nay-v2-2109/; chuẩn chữ docs/CHUAN-TU-NGU-VA-GIAO-DIEN.md).
// Nói thật: máy chủ chưa có `/gv/can-giup` ⇒ lời thật + rơi về danh sách rút gọn cũ; trường tuỳ chọn thiếu ⇒ ẩn phần đó; xu hướng viết "đang giảm/đang lên", không "xấu đi/khá lên".
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import EmCanGiup from '../src/components/hom-nay/EmCanGiup'
import { useAppStore } from '../src/store/appStore'
import { docCanGiup, layCanGiup, lyDoCanGiup } from '../src/lib/hom-nay-v2'

vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
vi.mock('../src/lib/exam-db', () => ({ loadTeacherSecret: async () => 'mat-thu' }))

const goi = vi.fn()
type Tra = { status?: number; json?: unknown; cham?: boolean }
function dungMayChu(bang: Record<string, (body: Record<string, unknown>) => Tra>) {
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const duong = url.replace('https://may.test', '')
    const body = JSON.parse(String(init.body ?? '{}')) as Record<string, unknown>
    goi(duong, body)
    const h = bang[duong]
    if (!h) return { status: 404, ok: false, json: async () => ({}) }
    const r = h(body)
    if (r.cham) {
      const e = new Error('abort')
      e.name = 'AbortError'
      throw e
    }
    const status = r.status ?? 200
    return { status, ok: status < 400, json: async () => r.json }
  })
}

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

const dang = (o: Record<string, unknown>) => ({ ma: 'D1', ten: 'Thuỷ phân ester', sai: 5, gap: 8, bac: 'hieu', xuHuong: 'giam', ...o })
const NGUOI = [
  { sbd: '1', hoTen: 'Trần Thu Hà', lop: '12A1', lyDo: 'dang_yeu', ngayTre: null, dang: [dang({}), dang({ ma: 'D2', ten: 'Oxi hoá ancol', sai: 4, gap: 5, bac: 'biet', xuHuong: 'giam' })] },
  { sbd: '2', hoTen: 'Lê Hoàng Nam', lop: '12A2', lyDo: 'tut_bac', ngayTre: 2, dang: [dang({ ma: 'D3', ten: 'Xà phòng hoá', sai: 4, gap: 5, bac: 'biet', xuHuong: 'giu' })] },
  { sbd: '3', hoTen: 'Nguyễn Minh Khôi', lop: '12A1', lyDo: 'tre_nhip', ngayTre: 4, dang: [] },
  { sbd: '4', hoTen: 'Phạm Gia Bảo', lop: '12A1', lyDo: 'tut_bac', ngayTre: null, dang: [dang({ ma: 'D4', ten: 'Este – khái niệm', sai: 5, gap: 9, bac: 'van_dung', xuHuong: 'tang' })] },
  { sbd: '5', hoTen: 'Vũ Đức An', lop: '11B1', lyDo: 'dang_yeu', ngayTre: null, dang: [] },
]
const RUT_GON = { tong: 2, ds: [{ sbd: '9', hoTen: 'Đỗ Khánh Linh', lop: '11B1', lyDo: 'tre_nhip', ngayTre: 3, dangYeu: [], hanhDong: 'xem_ho_so' }] } as never

const dung = (o: { canGiup?: (b: Record<string, unknown>) => Tra; rutGon?: unknown }) => {
  dungMayChu({ ...(o.canGiup ? { '/gv/can-giup': o.canGiup } : {}) })
  const moEm = vi.fn()
  const moHoSo = vi.fn()
  const r = render(<EmCanGiup rutGon={(o.rutGon ?? null) as never} dangTaiRutGon={false} lyDoRutGon="đang chờ máy chủ" onMoEm={moEm} onMoHoSo={moHoSo} />)
  return { moEm, moHoSo, ...r }
}
const luoc = (b: Record<string, unknown>) => {
  const lop = b.lop as string | undefined
  const ds = lop ? NGUOI.filter((e) => e.lop === lop) : NGUOI
  return { json: { ok: true, tong: ds.length, lop: ['12A1', '12A2', '11B1'], ds, soTruyVan: 1 } }
}

describe('lớp nối /gv/can-giup', () => {
  it('docCanGiup: trường thiếu/sai kiểu bị bỏ, không vỡ; em không SBD bị bỏ; dạng không tên bị bỏ; bậc/xu hướng lạ ⇒ rỗng', () => {
    const r = docCanGiup({ tong: 3, lop: ['12A1', 5], ds: [{ sbd: '1', hoTen: 'A', lyDo: 'la', dang: [{ ten: 'X', sai: 'nhieu', bac: 'sieu', xuHuong: 'len' }, { sai: 1 }] }, { hoTen: 'khong sbd' }, null] })
    expect(r.tong).toBe(3)
    expect(r.lop).toEqual(['12A1', '5'])
    expect(r.ds).toHaveLength(1)
    expect(r.ds[0]).toMatchObject({ sbd: '1', lyDo: '', ngayTre: null })
    expect(r.ds[0].dang).toEqual([{ ma: '', ten: 'X', sai: null, gap: null, bac: '', xuHuong: '' }])
  })

  it('layCanGiup: POST /gv/can-giup kèm lớp (chỉ khi lọc); 404 ⇒ lời thật, không trả danh sách rỗng giả', async () => {
    dungMayChu({ '/gv/can-giup': luoc })
    const a = await layCanGiup()
    expect(a.ok && a.du.ds).toHaveLength(5)
    expect(goi.mock.calls[0][1]).toEqual({})
    await layCanGiup('12A2')
    expect(goi.mock.calls[1][1]).toEqual({ lop: '12A2' })
    dungMayChu({})
    const l = await layCanGiup()
    expect(l).toMatchObject({ ok: false, loai: 'chua_co_lenh' })
    expect(!l.ok && l.chu).toContain('chưa có lệnh')
  })

  it('lyDoCanGiup: nói bằng SỐ, không kết luận năng lực', () => {
    expect(lyDoCanGiup({ lyDo: 'tre_nhip', ngayTre: 4 })).toBe('Trễ nhịp 4 ngày (chưa làm câu nào trong thời gian ấy)')
    expect(lyDoCanGiup({ lyDo: 'tre_nhip', ngayTre: null })).toBe('Trễ nhịp')
    expect(lyDoCanGiup({ lyDo: 'tut_bac', ngayTre: null })).toBe('Tụt bậc ở một dạng trong 3 ngày')
    expect(lyDoCanGiup({ lyDo: 'dang_yeu', ngayTre: null })).toBe('Sai nhiều ở một dạng trong 7 ngày')
    expect(lyDoCanGiup({ lyDo: '', ngayTre: null })).toBe('Cần thầy để ý')
  })
})

describe('EmCanGiup — ô EM CẦN THẦY GIÚP', () => {
  beforeEach(() => {
    useAppStore.setState({ screen: 'classlist', sbdGiaoRieng: '' } as never)
  })

  it('CÓ DỮ LIỆU: tổng em · từng em một lý do bằng số · từng dạng "sai x/y câu" + "bậc …" + "đang giảm/đang lên/giữ nguyên 7 ngày" · MỌI em nằm trong khung cuộn (không cắt 4 em nữa)', async () => {
    const { container } = dung({ canGiup: luoc })
    await screen.findByText('Trần Thu Hà')
    expect(container.querySelector('.hn2-em-tong')!.textContent).toBe('5 em')
    const ha = container.querySelector('[data-sbd="1"]') as HTMLElement
    expect(within(ha).getByText('Sai nhiều ở một dạng trong 7 ngày')).toBeTruthy()
    expect(within(ha).getByText('Thuỷ phân ester')).toBeTruthy()
    expect(within(ha).getByText('sai 5/8 câu')).toBeTruthy()
    expect(within(ha).getByText('bậc Hiểu')).toBeTruthy()
    expect(within(ha).getAllByText('đang giảm 7 ngày')).toHaveLength(2)
    const nam = container.querySelector('[data-sbd="2"]') as HTMLElement
    expect(within(nam).getByText('giữ nguyên 7 ngày')).toBeTruthy()
    expect(within(nam).getByText('trễ nhịp 2 ngày')).toBeTruthy() // trễ nhịp kèm vì lý do chính là tụt bậc
    const bao = container.querySelector('[data-sbd="4"]') as HTMLElement
    expect(within(bao).getByText('bậc Vận dụng')).toBeTruthy()
    expect(within(bao).getByText('đang lên 7 ngày')).toBeTruthy()
    // em không có dạng nào ⇒ không dựng khối dạng rỗng
    expect(container.querySelector('[data-sbd="3"] .hn2-dang-ds')).toBeNull()
    // 21/09 (thầy lệnh khung cuộn): không còn cắt 4 em + nút mở rộng — cả 5 em nằm trong khung cuộn có tên, chân ô có "Xem tất cả" ⇒ màn Học sinh
    expect(container.querySelector('[data-sbd="5"]')).not.toBeNull()
    const khung = container.querySelector('.hn2-khung-than') as HTMLElement
    expect(khung.getAttribute('role')).toBe('region')
    expect(khung.getAttribute('aria-label')).toBe('Danh sách em cần thầy giúp')
    expect(khung.getAttribute('tabindex')).toBe('0') // cuộn được bằng bàn phím
    expect(container.querySelector('.hn2-khung-dau')!.contains(khung)).toBe(false) // đầu ô NGOÀI khung cuộn ⇒ dính
    fireEvent.click(screen.getByRole('button', { name: 'Xem tất cả' }))
    expect(useAppStore.getState().screen).toBe('hocsinh')
  })

  it('CHỮ theo chuẩn: không "xấu đi", "khá lên", "yếu kém", "tệ", "lười"', async () => {
    const { container } = dung({ canGiup: luoc })
    await screen.findByText('Trần Thu Hà')
    const chu = container.textContent ?? ''
    for (const cam of ['xấu đi', 'khá lên', 'kém', 'tệ', 'lười', 'dở tệ']) expect(chu).not.toContain(cam)
  })

  it('HAI HÀNH ĐỘNG: Đưa vào buổi chữa ⇒ màn Gọi lên bảng · Giao bài riêng ⇒ tick sẵn em này rồi mở Giao bài; KHÔNG còn nút Nhắn phụ huynh (gỡ 21/09, thầy lệnh Bỏ phiếu Zalo)', async () => {
    const { container, moEm } = dung({ canGiup: luoc })
    await screen.findByText('Trần Thu Hà')
    const ha = () => container.querySelector('[data-sbd="1"]') as HTMLElement
    expect(within(ha()).getAllByRole('button').map((b) => b.textContent)).toEqual(['Trần Thu Hà · 12A1', 'Đưa vào buổi chữa', 'Giao bài riêng'])
    expect(screen.queryByRole('button', { name: 'Nhắn phụ huynh' })).toBeNull()
    fireEvent.click(within(ha()).getByRole('button', { name: 'Đưa vào buổi chữa' }))
    expect(useAppStore.getState().screen).toBe('goilenbang')
    fireEvent.click(within(ha()).getByRole('button', { name: 'Giao bài riêng' }))
    expect(useAppStore.getState().sbdGiaoRieng).toBe('1')
    expect(useAppStore.getState().screen).toBe('giaobtvn')
    fireEvent.click(within(ha()).getByRole('button', { name: /Trần Thu Hà · 12A1 — mở toàn cảnh/ }))
    expect(moEm).toHaveBeenLastCalledWith('1')
    expect(moEm).toHaveBeenCalledTimes(1)
  })

  it('LỌC THEO LỚP: nút Tất cả + từng lớp kèm số em; bấm lớp ⇒ hỏi máy chủ với {lop}; giữ đủ nút lớp; lớp trống ⇒ nói rõ', async () => {
    dungMayChu({ '/gv/can-giup': (b) => (b.lop === '11B1' ? { json: { ok: true, tong: 0, lop: ['12A1', '12A2', '11B1'], ds: [] } } : luoc(b)) })
    const { container } = render(<EmCanGiup rutGon={null} dangTaiRutGon={false} lyDoRutGon="" onMoEm={() => {}} onMoHoSo={() => {}} />)
    await screen.findByText('Trần Thu Hà')
    const nhom = screen.getByRole('group', { name: 'Lọc theo lớp' })
    expect(within(nhom).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tất cả', '12A1 · 3', '12A2 · 1', '11B1 · 1'])
    expect(within(nhom).getByRole('button', { name: 'Tất cả' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(within(nhom).getByRole('button', { name: '12A2 · 1' }))
    await waitFor(() => expect(container.querySelector('[data-sbd="1"]')).toBeNull())
    expect(container.querySelector('[data-sbd="2"]')).not.toBeNull()
    expect(goi.mock.calls.at(-1)).toEqual(['/gv/can-giup', { lop: '12A2' }])
    expect(within(screen.getByRole('group', { name: 'Lọc theo lớp' })).getAllByRole('button')).toHaveLength(4) // vẫn đủ nút lớp
    expect(screen.getByRole('button', { name: '12A2 · 1' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: '11B1 · 1' }))
    await screen.findByText('Lớp 11B1 hôm nay không có em nào cần thầy giúp.')
  })

  it('MÁY CHỦ CẮT BỚT (tổng > số em trả về): không đếm số em từng lớp (sẽ sai) · chân ô nói "Đang hiện 5 em đầu" + "Xem cả 17 em" ⇒ màn Học sinh', async () => {
    dungMayChu({ '/gv/can-giup': () => ({ json: { ok: true, tong: 17, lop: ['12A1', '12A2'], ds: NGUOI } }) })
    const { container } = render(<EmCanGiup rutGon={null} dangTaiRutGon={false} lyDoRutGon="" onMoEm={() => {}} onMoHoSo={() => {}} />)
    await screen.findByText('Trần Thu Hà')
    expect(container.querySelector('.hn2-em-tong')!.textContent).toBe('17 em')
    expect(within(screen.getByRole('group', { name: 'Lọc theo lớp' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tất cả', '12A1', '12A2'])
    expect(container.querySelector('.hn2-khung-chan .hn2-phu')!.textContent).toBe('Đang hiện 5 em đầu')
    fireEvent.click(screen.getByRole('button', { name: 'Xem cả 17 em' }))
    expect(useAppStore.getState().screen).toBe('hocsinh')
  })

  it('CHƯA CÓ LỆNH: lời thật (trung tính, không đỏ) + rơi về danh sách rút gọn cũ với nút theo lý do — không mất tính năng', async () => {
    const { container, moHoSo } = dung({ rutGon: RUT_GON })
    const ghi = await screen.findByText(/chưa có lệnh chi tiết/)
    expect(ghi.closest('.hn2-ghi-chu')!.className).not.toMatch(/--(canh|loi)/)
    expect(ghi.closest('.hn2-ghi-chu')!.getAttribute('role')).toBe('status')
    expect(screen.getByText('Đỗ Khánh Linh')).toBeTruthy()
    expect(container.querySelector('.hn2-em-tong')!.textContent).toBe('2 em')
    fireEvent.click(screen.getByRole('button', { name: 'Xem hồ sơ' }))
    expect(moHoSo).toHaveBeenCalledWith('9') // danh sách rút gọn cũ: "Xem hồ sơ" ⇒ hồ sơ ở màn Học sinh (KHÔNG phải Toàn cảnh)
    fireEvent.click(screen.getByRole('button', { name: 'Xem cả 2 em' })) // rút gọn cũ: máy chủ cắt bớt (tổng 2 > 1 em hiện) ⇒ chân ô nói "Xem cả 2 em"
    expect(useAppStore.getState().screen).toBe('hocsinh')
  })

  it('LỖI THẬT (chậm/mạng): báo lỗi có role=alert, KHÔNG nói "chưa có lệnh"; TRỐNG: "Hôm nay không có em nào cần thầy giúp."', async () => {
    dung({ canGiup: () => ({ cham: true }), rutGon: null })
    const canh = await screen.findByRole('alert')
    expect(canh.textContent).not.toMatch(/chưa có lệnh/)
    cleanup()
    dung({ canGiup: () => ({ json: { ok: true, tong: 0, lop: [], ds: [] } }) })
    await screen.findByText('Hôm nay không có em nào cần thầy giúp.')
    expect(screen.queryByRole('group', { name: 'Lọc theo lớp' })).toBeNull() // không có lớp nào ⇒ không dựng thanh lọc
  })

  it('MỘT LỚP DUY NHẤT: không dựng thanh lọc (lọc một lựa chọn là thừa)', async () => {
    dungMayChu({ '/gv/can-giup': () => ({ json: { ok: true, tong: 1, lop: ['12A1'], ds: [NGUOI[0]] } }) })
    render(<EmCanGiup rutGon={null} dangTaiRutGon={false} lyDoRutGon="" onMoEm={() => {}} onMoHoSo={() => {}} />)
    await screen.findByText('Trần Thu Hà')
    expect(screen.queryByRole('group', { name: 'Lọc theo lớp' })).toBeNull()
  })
})

describe('trả lời sai dạng', () => {
  it('máy chủ trả {ok:true} không có `ds` ⇒ KHÔNG nói "không có em nào cần giúp": báo không đọc được + rơi về danh sách rút gọn', async () => {
    const { container } = dung({ canGiup: () => ({ json: { ok: true } }), rutGon: RUT_GON })
    const canh = await screen.findByRole('alert')
    expect(canh.textContent).toContain('không đúng dạng')
    expect(container.textContent).not.toContain('Hôm nay không có em nào cần thầy giúp.')
    expect(screen.getByText('Đỗ Khánh Linh')).toBeTruthy()
  })
})
