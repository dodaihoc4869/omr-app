// TÊN LỚP (thầy lệnh 21/09: "12 - Tinh Hoa" / "12 - Lớp Thường"; `lop` vẫn là khối): CHỌN THEO LỚP ở màn Giao bài tập về nhà + tên lớp / lọc / ĐỔI LỚP ở màn Học sinh.
// Lệnh máy chủ (Code 3, dạng đề nghị): `/gv/lop` (đọc) + `/gv/doi-lop-em` (ghi). Chưa có lệnh ⇒ mục ẨN, không lỗi đỏ. Không đổi luật giao; Xem trước phân bổ chạy như cũ.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import type { EmTomTat, HoSoEm } from '../src/lib/exam-api'
import { banDoTenLop, chuChipLop, docLop, doiLopMotEm, layLopThay, xoaNhoLop } from '../src/lib/ten-lop-thay'

const m = vi.hoisted(() => ({ giao: vi.fn(), theoDoi: vi.fn(), showToast: vi.fn(), sbd: { v: '' }, moHoSoEm: vi.fn(), setScreen: vi.fn() }))
const goi = vi.fn()
type Tra = { status?: number; json?: unknown; cham?: boolean }
let lenh: Record<string, (b: Record<string, unknown>) => Tra | Promise<Tra>> = {}
function dungMayChu(bang: Record<string, (b: Record<string, unknown>) => Tra | Promise<Tra>>) {
  lenh = bang
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const duong = String(url).replace('https://may.test', '')
    const body = (() => {
      try {
        return JSON.parse(String(init?.body ?? '{}')) as Record<string, unknown>
      } catch {
        return {}
      }
    })()
    goi(duong, body)
    const h = lenh[duong]
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

vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => '/test', loadTeacherSecret: async () => 'mat-thu', loadExamSources: async () => [] }))
vi.mock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
const EM_TOM_TAT = [
  { sbd: '001', hoTen: 'Lê Minh Đức', lop: '12', namSinh: '2008', soCa: 2, diemGanNhat: 7.5, trangThai: 'trong_danh_sach' },
  { sbd: '002', hoTen: 'Trần Thu Hà', lop: '12', namSinh: '2008', soCa: 1, diemGanNhat: 8, trangThai: 'trong_danh_sach' },
  { sbd: '003', hoTen: 'Vũ Đức An', lop: '12', namSinh: '2008', soCa: 1, diemGanNhat: 6, trangThai: 'trong_danh_sach' },
  { sbd: '004', hoTen: 'Phạm Gia Bảo', lop: '12', namSinh: '2008', soCa: 1, diemGanNhat: 5, trangThai: 'trong_danh_sach' },
  { sbd: '005', hoTen: 'Đỗ Khánh Linh', lop: '11B1', namSinh: '2009', soCa: 0, diemGanNhat: null, trangThai: 'trong_danh_sach' },
] as unknown as EmTomTat[]
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachCa: async () => [],
  danhSachEm: async () => EM_TOM_TAT,
  hoSoEm: async () => ({ em: { sbd: '001', hoTen: 'Lê Minh Đức', lop: '12', namSinh: '2008' }, ca: [], chuyenDe: [] }) as unknown as HoSoEm,
  deleteStudentRegistration: vi.fn(),
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/lib/day-ca-may-chu-moi', () => ({ luotCuaCaMoi: async () => [] }))
vi.mock('../src/lib/btvn-may-chu-moi', () => ({ giaoBtvn: (...a: unknown[]) => m.giao(...a), theoDoiBtvn: (...a: unknown[]) => m.theoDoi(...a), suaGiaoBtvn: vi.fn() }))
vi.mock('../src/lib/hom-nay-api', () => ({ layHomNay: async () => null }))
vi.mock('../src/components/HopChonDe', () => ({ default: ({ onChon }: { onChon: (x: string) => void }) => <button onClick={() => onChon('D-TN')}>Chọn đề mẫu</button> }))
vi.mock('../src/components/NhomCaThuGon', () => ({ default: ({ ds, render }: { ds: unknown[]; render: (x: unknown) => unknown }) => <div>{ds.map(render as never)}</div> }))
vi.mock('../src/components/HocSinhNhanBai', () => ({ default: () => null }))
vi.mock('../src/components/NutDongBoDanhSach', () => ({ default: () => null }))
vi.mock('../src/components/NutThemHocSinh', () => ({ default: () => null }))
vi.mock('../src/components/NutBaiTapPdf', () => ({ default: () => null }))
vi.mock('../src/components/KhoiTienBo', () => ({ default: () => null }))
vi.mock('../src/components/BaoCaoCaThiHocSinhModal', () => ({ default: () => null }))
vi.mock('../src/store/appStore', async (goc) => {
  const that = await goc<typeof import('../src/store/appStore')>()
  const dung = (sel: (s: Record<string, unknown>) => unknown) => sel({ sbdDangXem: m.sbd.v, moHoSoEm: m.moHoSoEm, showToast: m.showToast, setScreen: m.setScreen, moChiTietCa: vi.fn(), datSbdGiaoRieng: vi.fn(), sbdGiaoRieng: '', classList: [] })
  dung.getState = () => ({ datSbdGiaoRieng: vi.fn() })
  return { ...that, useAppStore: dung }
})
const { default: PhanCongScreen } = await import('../src/screens/PhanCongScreen')
const { default: HocSinhScreen } = await import('../src/screens/HocSinhScreen')

const LOP = {
  ok: true,
  lop: [
    { tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 2, sbd: ['001', '002'] },
    { tenLop: '12 - Lớp Thường', khoi: '12', soEm: 2, sbd: ['003', '004'] },
    { tenLop: '11B1', khoi: '11', soEm: 1, sbd: ['005'] },
  ],
  soTruyVan: 1,
}

beforeEach(() => {
  xoaNhoLop()
  m.theoDoi.mockResolvedValue([])
  m.giao.mockResolvedValue({ maBtvn: 'B1', soEm: 2, soCau: 3, hanNop: '2026-09-25T15:00:00Z' })
  m.sbd.v = ''
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

describe('lớp nối /gv/lop và /gv/doi-lop-em', () => {
  it('docLop: lớp không tên bỏ; soEm thiếu ⇒ số SBD; SBD trùng gộp; khoá lạ bị bỏ', () => {
    const r = docLop({ lop: [{ tenLop: 'A', khoi: 12, sbd: ['1', '1', '2', 7] }, { tenLop: '  ', sbd: ['9'] }, null, { tenLop: 'B', soEm: 5, sbd: [] }, { khoi: '12' }] })
    expect(r).toEqual([{ tenLop: 'A', khoi: '12', soEm: 3, sbd: ['1', '2', '7'] }, { tenLop: 'B', khoi: '', soEm: 5, sbd: [] }])
    expect(docLop({})).toEqual([])
    expect(chuChipLop({ tenLop: '12 - Tinh Hoa', soEm: 42 })).toBe('12 - Tinh Hoa · 42 em')
    expect(banDoTenLop(docLop(LOP))).toEqual({ '001': '12 - Tinh Hoa', '002': '12 - Tinh Hoa', '003': '12 - Lớp Thường', '004': '12 - Lớp Thường', '005': '11B1' })
  })

  it('layLopThay: POST /gv/lop kèm mã bí mật; 404 ⇒ lời thật; trả không có `lop` ⇒ không đọc được (KHÔNG danh sách rỗng giả)', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: LOP }) })
    const a = await layLopThay()
    expect(a.ok && a.du.lop).toHaveLength(3)
    expect(a.ok && a.du.lyDoThieu).toBe('')
    expect(goi).toHaveBeenLastCalledWith('/gv/lop', {})
    dungMayChu({ '/gv/lop': () => ({ json: { ok: true, lop: [{ tenLop: '12 - Lớp Thường', khoi: '12', soEm: 1, sbd: ['1'] }], lyDoThieu: 'Chưa có cột tên lớp trên máy chủ.' } }) })
    const thieu = await layLopThay()
    expect(thieu.ok && thieu.du.lyDoThieu).toBe('Chưa có cột tên lớp trên máy chủ.') // Worker lên trước migration: vẫn ok, kèm lý do nói thật
    dungMayChu({})
    expect(await layLopThay()).toMatchObject({ ok: false, loai: 'chua_co_lenh' })
    dungMayChu({ '/gv/lop': () => ({ json: { ok: true } }) })
    expect(await layLopThay()).toMatchObject({ ok: false, loai: 'khong_doc_duoc' })
  })

  it('doiLopMotEm: gửi {sbd, tenLop đã cắt khoảng trắng}; tên rỗng ⇒ không gọi máy chủ; máy chủ từ chối ⇒ nguyên lời; 404 ⇒ "chưa đổi gì"; chậm ⇒ CHƯA CHẮC', async () => {
    dungMayChu({ '/gv/doi-lop-em': () => ({ json: { ok: true, sbd: '001', tenLop: '12 - Tinh Hoa' } }) })
    expect(await doiLopMotEm('001', '  12 - Tinh Hoa ')).toEqual({ ok: true, du: { sbd: '001', tenLop: '12 - Tinh Hoa' } })
    expect(goi).toHaveBeenLastCalledWith('/gv/doi-lop-em', { sbd: '001', tenLop: '12 - Tinh Hoa' })
    goi.mockClear()
    expect(await doiLopMotEm('001', '   ')).toMatchObject({ ok: false })
    expect(goi).not.toHaveBeenCalled()
    dungMayChu({ '/gv/doi-lop-em': () => ({ status: 400, json: { ok: false, error: 'Không có học sinh này.' } }) })
    expect(await doiLopMotEm('999', 'X')).toMatchObject({ ok: false, chu: 'Không có học sinh này.' })
    dungMayChu({})
    expect(await doiLopMotEm('001', 'X')).toMatchObject({ ok: false, chu: 'Máy chủ chưa có lệnh đổi lớp — chưa đổi gì.' })
    dungMayChu({ '/gv/doi-lop-em': () => ({ cham: true }) })
    const c = await doiLopMotEm('001', 'X')
    expect(!c.ok && c.chu).toContain('CHƯA CHẮC đã đổi lớp')
  })
})

describe('PhanCongScreen — Chọn theo lớp', () => {
  const moGiao = async () => {
    render(<PhanCongScreen />)
    await waitFor(() => expect(m.theoDoi).toHaveBeenCalled())
    fireEvent.click(screen.getAllByRole('button', { name: /Giao bài mới/ })[0])
    return await screen.findByRole('group', { name: 'Chọn theo lớp' })
  }
  const daChon = () => (document.body.textContent ?? '').match(/Đã chọn:\s*(\d+)\s*\/\s*(\d+) em/)?.slice(1).map(Number)

  it('chip lớp kèm số em ("12 - Tinh Hoa · 2 em"); bấm ⇒ chuyển sang "Theo em" và chọn sẵn MỌI em của lớp; bấm lại ⇒ bỏ hết em của lớp', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: LOP }) })
    const nhom = await moGiao()
    expect(within(nhom).getAllByRole('button').map((b) => b.textContent)).toEqual(['12 - Tinh Hoa · 2 em', '12 - Lớp Thường · 2 em', '11B1 · 1 em'])
    expect(within(nhom).getAllByRole('button').every((b) => b.getAttribute('aria-pressed') === 'false')).toBe(true)
    fireEvent.click(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }))
    await waitFor(() => expect(daChon()).toEqual([2, 5]))
    expect(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }).getAttribute('aria-pressed')).toBe('true')
    expect(within(nhom).getByRole('button', { name: '12 - Lớp Thường · 2 em' }).getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }))
    expect(daChon()).toEqual([0, 5])
  })

  it('chọn hai lớp cộng dồn; BỎ TỪNG EM được (chip lớp ấy thôi sáng); chọn lớp không xoá em đã tick ở lớp khác', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: LOP }) })
    const nhom = await moGiao()
    fireEvent.click(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }))
    fireEvent.click(within(nhom).getByRole('button', { name: '12 - Lớp Thường · 2 em' }))
    await waitFor(() => expect(daChon()).toEqual([4, 5]))
    // bỏ tick MỘT em của lớp Tinh Hoa ở danh sách "Theo em"
    const tich = screen.getByText('Lê Minh Đức').closest('button')!
    fireEvent.click(tich)
    expect(daChon()).toEqual([3, 5])
    expect(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }).getAttribute('aria-pressed')).toBe('false')
    expect(within(nhom).getByRole('button', { name: '12 - Lớp Thường · 2 em' }).getAttribute('aria-pressed')).toBe('true')
    // bấm lại lớp Tinh Hoa ⇒ chọn nốt em vừa bỏ
    fireEvent.click(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }))
    expect(daChon()).toEqual([4, 5])
  })

  it('KHÔNG đổi luật giao: chọn lớp rồi giao ⇒ giaoBtvn nhận đúng dsSbd của lớp (đường "Theo em" sẵn có)', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: LOP }) })
    const nhom = await moGiao()
    fireEvent.click(await screen.findByText('Chọn đề mẫu'))
    fireEvent.click(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }))
    await waitFor(() => expect(daChon()).toEqual([2, 5]))
    fireEvent.click(screen.getByRole('button', { name: /Giao bài tập/ }))
    await waitFor(() => expect(m.giao).toHaveBeenCalledTimes(1))
    expect(m.giao.mock.calls[0][4]).toEqual(['001', '002']) // dsSbdGui
    expect(m.giao.mock.calls[0][2]).toEqual([]) // không kèm ca nào
  })

  it('SBD lạ (lớp có em mà danh sách học sinh KHÔNG có): không đếm, không tick ma — chip nói số em THẬT có trong danh sách', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: { ok: true, lop: [{ tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 3, sbd: ['001', '002', '999'] }] } }) })
    const nhom = await moGiao()
    expect(within(nhom).getAllByRole('button').map((b) => b.textContent)).toEqual(['12 - Tinh Hoa · 2 em'])
    fireEvent.click(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }))
    await waitFor(() => expect(daChon()).toEqual([2, 5]))
    expect(within(nhom).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('WORKER LÊN TRƯỚC MIGRATION (`lyDoThieu`): chip vẫn dùng được (lớp mặc định theo khối) và màn nói thật "Máy chủ báo: …" nguyên văn', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: { ok: true, lop: [{ tenLop: '12 - Lớp Thường', khoi: '12', soEm: 4, sbd: ['001', '002', '003', '004'] }], lyDoThieu: 'Chưa có cột tên lớp trên máy chủ.' } }) })
    const nhom = await moGiao()
    expect(within(nhom).getAllByRole('button').map((b) => b.textContent)).toEqual(['12 - Lớp Thường · 4 em'])
    expect(document.body.querySelector('[data-khoi="ly-do-thieu-lop"]')!.textContent).toBe('Máy chủ báo: Chưa có cột tên lớp trên máy chủ.')
    cleanup()
    xoaNhoLop()
    dungMayChu({ '/gv/lop': () => ({ json: LOP }) })
    await moGiao()
    expect(document.body.querySelector('[data-khoi="ly-do-thieu-lop"]')).toBeNull() // bình thường: không dòng "Máy chủ báo"
  })

  it('máy chủ trả DANH SÁCH LỚP RỖNG: mục ẨN (không dựng nhóm chip trống)', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: { ok: true, lop: [] } }) })
    render(<PhanCongScreen />)
    await waitFor(() => expect(m.theoDoi).toHaveBeenCalled())
    fireEvent.click(screen.getAllByRole('button', { name: /Giao bài mới/ })[0])
    await screen.findByText('Người nhận bài tập')
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/lop', {}))
    expect(screen.queryByRole('group', { name: 'Chọn theo lớp' })).toBeNull()
  })

  it('CHƯA CÓ LỆNH (404): mục "Chọn theo lớp" ẨN, màn Giao bài chạy như cũ, không lỗi đỏ', async () => {
    dungMayChu({})
    render(<PhanCongScreen />)
    await waitFor(() => expect(m.theoDoi).toHaveBeenCalled())
    fireEvent.click(screen.getAllByRole('button', { name: /Giao bài mới/ })[0])
    await screen.findByText('Người nhận bài tập')
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/lop', {}))
    expect(screen.queryByRole('group', { name: 'Chọn theo lớp' })).toBeNull()
    expect(document.body.textContent).not.toContain('Chọn theo lớp')
    expect(screen.queryByRole('alert')).toBeNull()
  })
})

describe('HocSinhScreen — tên lớp, lọc theo lớp, Đổi lớp', () => {
  const moDanhSach = async () => {
    const r = render(<HocSinhScreen />)
    await waitFor(() => expect(r.container.textContent).toContain('Lê Minh Đức'))
    return r
  }
  const moHoSo = async () => {
    const r = await moDanhSach()
    fireEvent.click(screen.getByText('Lê Minh Đức'))
    m.sbd.v = '001'
    r.rerender(<HocSinhScreen />)
    await waitFor(() => expect(r.container.querySelector('.hs-ho-so-ten')).toBeTruthy())
    return r
  }

  it('danh sách: mỗi em hiện TÊN LỚP thật ("Lớp 12 - Tinh Hoa"); chip lọc kèm số em; lọc theo lớp chỉ giữ em của lớp', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: LOP }) })
    const { container } = await moDanhSach()
    await waitFor(() => expect(container.textContent).toContain('Lớp 12 - Tinh Hoa'))
    expect(container.textContent).toContain('Lớp 12 - Lớp Thường')
    const loc = screen.getByRole('group', { name: 'Lọc theo lớp' })
    expect(within(loc).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tất cả các lớp', '12 - Tinh Hoa · 2 em', '12 - Lớp Thường · 2 em', '11B1 · 1 em'])
    fireEvent.click(within(loc).getByRole('button', { name: '12 - Tinh Hoa · 2 em' }))
    expect(container.textContent).toContain('Lê Minh Đức')
    expect(container.textContent).toContain('Trần Thu Hà')
    expect(container.textContent).not.toContain('Vũ Đức An')
    expect(container.textContent).not.toContain('Đỗ Khánh Linh')
  })

  it('CHƯA CÓ LỆNH: y như cũ — hiện `lop` cũ ("Lớp 12"), chip lọc theo `lop` cũ, KHÔNG nút Đổi lớp, không lỗi đỏ', async () => {
    dungMayChu({})
    const { container } = await moDanhSach()
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/lop', {}))
    expect(container.textContent).toContain('Lớp 12')
    expect(container.textContent).not.toContain('Tinh Hoa')
    expect(within(screen.getByRole('group', { name: 'Lọc theo lớp' })).getAllByRole('button').map((b) => b.textContent)).toEqual(['Tất cả các lớp', 'Lớp 11B1', 'Lớp 12'])
    expect(screen.queryByRole('button', { name: 'Đổi lớp' })).toBeNull()
  })

  it('hồ sơ: hiện tên lớp + nút "Đổi lớp"; hộp: chọn lớp có sẵn ⇒ "Chuyển lớp" gọi /gv/doi-lop-em {sbd, tenLop}, báo thành công và tải lại danh sách lớp; "Giữ nguyên" không gọi máy chủ', async () => {
    let da = false
    dungMayChu({
      '/gv/lop': () => ({ json: da ? { ok: true, lop: [{ tenLop: '12 - Tinh Hoa', khoi: '12', soEm: 1, sbd: ['002'] }, { tenLop: '12 - Lớp Thường', khoi: '12', soEm: 3, sbd: ['001', '003', '004'] }, LOP.lop[2]] } : LOP }),
      '/gv/doi-lop-em': () => ((da = true), { json: { ok: true, sbd: '001', tenLop: '12 - Lớp Thường' } }),
    })
    const { container } = await moHoSo()
    await waitFor(() => expect(container.querySelector('.hs-meta')!.textContent).toContain('Lớp 12 - Tinh Hoa'))
    fireEvent.click(screen.getByRole('button', { name: 'Đổi lớp' }))
    const hop = screen.getByRole('dialog', { name: 'Đổi lớp của Lê Minh Đức' })
    expect(within(hop).getByText('12 - Tinh Hoa', { selector: 'b' })).toBeTruthy() // "Em đang ở lớp 12 - Tinh Hoa"
    expect((within(hop).getByRole('button', { name: 'Chuyển lớp' }) as HTMLButtonElement).disabled).toBe(true) // chưa chọn lớp khác
    fireEvent.click(within(hop).getByRole('button', { name: 'Giữ nguyên' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(goi.mock.calls.some((x) => x[0] === '/gv/doi-lop-em')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Đổi lớp' }))
    fireEvent.change(within(screen.getByRole('dialog')).getByLabelText('Chuyển sang lớp'), { target: { value: '12 - Lớp Thường' } })
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Chuyển lớp' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/doi-lop-em', { sbd: '001', tenLop: '12 - Lớp Thường' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(m.showToast).toHaveBeenCalledWith('Đã chuyển Lê Minh Đức sang lớp 12 - Lớp Thường.', 'success')
    await waitFor(() => expect(container.querySelector('.hs-meta')!.textContent).toContain('Lớp 12 - Lớp Thường')) // tải lại /gv/lop
  })

  it('CHƯA CÓ LỆNH: hồ sơ em KHÔNG có nút Đổi lớp (không đổi được thứ máy chủ chưa hỗ trợ)', async () => {
    dungMayChu({})
    await moHoSo()
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/lop', {}))
    expect(screen.queryByRole('button', { name: 'Đổi lớp' })).toBeNull()
  })

  it('đang chuyển lớp: nút đổi chữ "Đang chuyển…" và tắt (không bấm hai lần); xong thì đóng hộp', async () => {
    let xong: (t: Tra) => void = () => {}
    dungMayChu({ '/gv/lop': () => ({ json: LOP }), '/gv/doi-lop-em': () => new Promise<Tra>((r) => (xong = r)) })
    await moHoSo()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đổi lớp' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Đổi lớp' }))
    const hop = screen.getByRole('dialog')
    fireEvent.change(within(hop).getByLabelText('Chuyển sang lớp'), { target: { value: '11B1' } })
    fireEvent.click(within(hop).getByRole('button', { name: 'Chuyển lớp' }))
    const dang = await within(hop).findByRole('button', { name: 'Đang chuyển…' })
    expect((dang as HTMLButtonElement).disabled).toBe(true)
    xong({ json: { ok: true, sbd: '001', tenLop: '11B1' } })
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('gõ TÊN LỚP MỚI: chọn "Lớp mới…" ⇒ hiện ô gõ; tên rỗng ⇒ nút tắt; máy chủ từ chối ⇒ hiện ĐÚNG lời (role=alert), hộp giữ nguyên, không báo thành công', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: LOP }), '/gv/doi-lop-em': () => ({ status: 400, json: { ok: false, error: 'Tên lớp trùng với khối khác.' } }) })
    await moHoSo()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đổi lớp' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Đổi lớp' }))
    const hop = screen.getByRole('dialog')
    fireEvent.change(within(hop).getByLabelText('Chuyển sang lớp'), { target: { value: '__lop_moi' } })
    expect((within(hop).getByRole('button', { name: 'Chuyển lớp' }) as HTMLButtonElement).disabled).toBe(true)
    fireEvent.change(within(hop).getByLabelText('Tên lớp mới'), { target: { value: '  12 - Chuyên Hoá ' } })
    fireEvent.click(within(hop).getByRole('button', { name: 'Chuyển lớp' }))
    await waitFor(() => expect(goi).toHaveBeenCalledWith('/gv/doi-lop-em', { sbd: '001', tenLop: '12 - Chuyên Hoá' }))
    expect((await within(hop).findByRole('alert')).textContent).toBe('Tên lớp trùng với khối khác.')
    expect(screen.getByRole('dialog')).toBeTruthy()
    expect(m.showToast).not.toHaveBeenCalled()
  })

  it('Esc đóng hộp Đổi lớp', async () => {
    dungMayChu({ '/gv/lop': () => ({ json: LOP }) })
    await moHoSo()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Đổi lớp' })).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Đổi lớp' }))
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })
})
