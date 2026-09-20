// G3 · HỌC SINH (app giáo viên M3, 21/09): danh sách + hồ sơ một em theo bản vẽ 3-ho-so-hoc-sinh.jpg.
// Số liệu mới (lịch ôn 1·3·7, kế hoạch hôm nay, thần thú/EXP) ĐỌC từ hai lệnh sẵn có; không lệnh → "đang chờ máy chủ", không bịa số.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import fs from 'node:fs'
import path from 'node:path'
import type { EmTomTat, HoSoEm } from '../src/lib/exam-api'
import { lichOn, ngayVn, nhanViec, tomTatKeHoach } from '../src/lib/ho-so-em-thay'
import KhoiHoSoHocTap from '../src/components/KhoiHoSoHocTap'

const m = vi.hoisted(() => ({
  fetch: vi.fn(),
  namKt: vi.fn(),
  keHoach: vi.fn(),
  moHoSoEm: vi.fn(),
  setScreen: vi.fn(),
  moChiTietCa: vi.fn(),
  sbd: { v: '' },
}))

// ---------------------------------------------------------------- lớp dữ liệu
describe('ho-so-em-thay: hàm thuần', () => {
  it('ngayVn: ngày Việt Nam (UTC+7) — 17:30 UTC đã sang ngày hôm sau', () => {
    expect(ngayVn(Date.parse('2026-09-21T16:59:00Z'))).toBe('2026-09-21')
    expect(ngayVn(Date.parse('2026-09-21T17:30:00Z'))).toBe('2026-09-22')
  })

  it('lichOn: bốn ô đếm thẳng từ trạng thái + mốc ôn kế (tới hạn = chưa khắc phục và mốc ≤ hôm nay)', () => {
    const cau = [
      { qid: '1', trangThai: 'moi_sai', mocOnKe: '2026-09-21' },
      { qid: '2', trangThai: 'moi_sai', mocOnKe: '2026-09-25' },
      { qid: '3', trangThai: 'dang_on', mocOnKe: '2026-09-20' },
      { qid: '4', trangThai: 'dang_on', mocOnKe: null },
      { qid: '5', trangThai: 'da_khac_phuc', mocOnKe: '2026-09-01' },
      { qid: '6', trangThai: 'chua_thay_sai', mocOnKe: '2026-09-01' },
    ]
    expect(lichOn(cau, '2026-09-21')).toEqual({ moiSai: 2, dangOn: 2, toiHan: 2, daKhacPhuc: 1 })
    expect(lichOn([], '2026-09-21')).toEqual({ moiSai: 0, dangOn: 0, toiHan: 0, daKhacPhuc: 0 })
  })

  it('nhanViec: một dòng chữ mỗi việc, có số câu; không mã qid/dạng, không "nắm chắc"', () => {
    expect(nhanViec({ id: 'a', loai: 'btvn_lo', soCau: 6, chiTiet: { chiSo: 3, tongLo: 5 } })).toBe('BTVN · lô 3/5 · 6 câu')
    expect(nhanViec({ id: 'b', loai: 'on_lai', soCau: 4 })).toBe('Ôn 4 câu tới hạn')
    expect(nhanViec({ id: 'c', loai: 'on_thi', soCau: 3, chiTiet: { tenCa: 'Giữa kỳ' } })).toBe('Ôn 3 câu cho ca Giữa kỳ')
    expect(nhanViec({ id: 'd', loai: 'than_thu', soCau: 6 })).toBe('Thần thú: luyện 6 câu (tuỳ chọn)')
    for (const loai of ['btvn_lo', 'btvn_nop', 'mom', 'on_lai', 'on_thi', 'than_thu', 'la']) expect(nhanViec({ id: 'x', loai, soCau: 2 })).not.toMatch(/nắm chắc|năng lực|giỏi|kém/i)
  })

  it('tomTatKeHoach: giữ NGUYÊN thứ tự máy chủ đã sắp, tối đa 4 việc; đánh dấu xong / chưa hiện; chip ngân sách; thần thú + EXP', () => {
    const t = tomTatKeHoach({
      nganSach: { mucTieuCau: 8, phutNgay: 20 },
      viec: [
        { id: 'a', loai: 'on_lai', thuTu: 1, soCau: 4, trangThai: 'xong' },
        { id: 'b', loai: 'mom', thuTu: 2, soCau: 5, hien: false },
        { id: 'c', loai: 'btvn_nop', thuTu: 3 },
        { id: 'd', loai: 'on_lai', thuTu: 4, soCau: 1 },
        { id: 'e', loai: 'on_lai', thuTu: 5, soCau: 1 },
      ],
      tienBo: { daLamCau: 6, lenBac: 2 },
      thanThu: { pet: 'Thuỷ Long', cap: 12, nickname: null },
      exp: { homNay: 85 },
    })
    expect(t.chip).toBe('8 câu · 20 phút/ngày')
    expect(t.dong.map((d) => d.thuTu)).toEqual([1, 2, 3, 4])
    expect(t.dong[0]).toMatchObject({ xong: true, mo: false })
    expect(t.dong[1]).toMatchObject({ xong: false, mo: true })
    expect(t.tienDo).toBe('Đã làm 6 câu hôm nay · 2 câu lên bậc')
    expect(t.thanThu).toEqual({ ten: 'Thuỷ Long', cap: 12, expHomNay: 85 })
    expect(tomTatKeHoach({ lanNghi: true, viec: [] }).nghi).toBe(true)
    expect(tomTatKeHoach({ thanThu: null }).thanThu).toBeNull()
  })
})

describe('ho-so-em-thay: gọi máy chủ (chỉ đọc)', () => {
  beforeEach(() => {
    vi.doMock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })
  const nap = async () => {
    vi.resetModules() // bỏ bản đã nạp với máy chủ THẬT ở đầu tệp
    vi.doMock('../src/lib/may-chu-moi', () => ({ layCauHinhMayChu: async () => ({ URL: 'https://may.test' }) }))
    return await vi.importActual<typeof import('../src/lib/ho-so-em-thay')>('../src/lib/ho-so-em-thay') // bản THẬT (cả file đã mock hai hàm cho khối bên dưới)
  }

  it('/ho-so/xem: POST {sbd} kèm x-ma-bi-mat; trả danh sách câu; null khi không ok', async () => {
    const goi: { url: string; init: RequestInit }[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      goi.push({ url, init })
      return { ok: true, json: async () => ({ ok: true, cau: [{ qid: 'q1', trangThai: 'moi_sai', mocOnKe: '2026-09-21' }, { qid: 'q2' }] }) }
    })
    const lib = await nap()
    const r = await lib.layHoSoNamKt('12001')
    expect(goi[0].url).toBe('https://may.test/ho-so/xem')
    expect(JSON.parse(String(goi[0].init.body))).toEqual({ sbd: '12001' })
    expect((goi[0].init.headers as Record<string, string>)['x-ma-bi-mat']).toBe('mat')
    expect(r?.cau).toEqual([{ qid: 'q1', trangThai: 'moi_sai', mocOnKe: '2026-09-21' }, { qid: 'q2', trangThai: '', mocOnKe: null }])
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ ok: false }) }))
    expect(await lib.layHoSoNamKt('12001')).toBeNull()
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('Failed to fetch')
    })
    expect(await lib.layHoSoNamKt('12001')).toBeNull()
  })

  it('layKeHoachEm: POST /gv/ke-hoach-em {sbd} kèm x-ma-bi-mat (lệnh thầy CHỈ ĐỌC); null khi không ok', async () => {
    const goi: { url: string; init: RequestInit }[] = []
    vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
      goi.push({ url, init })
      return { ok: true, json: async () => ({ ok: true, ngay: '2026-09-21', viec: [], chuaCo: true }) }
    })
    const lib = await nap()
    expect(await lib.layKeHoachEm('12001')).toMatchObject({ ngay: '2026-09-21', chuaCo: true })
    expect(goi).toHaveLength(1)
    expect(goi[0].url).toBe('https://may.test/gv/ke-hoach-em')
    expect(JSON.parse(String(goi[0].init.body))).toEqual({ sbd: '12001' })
    expect((goi[0].init.headers as Record<string, string>)['x-ma-bi-mat']).toBe('mat')
    vi.stubGlobal('fetch', async () => ({ ok: true, json: async () => ({ ok: false, error: 'Không tìm thấy học sinh' }) }))
    expect(await lib.layKeHoachEm('12001')).toBeNull()
  })

  it('nguồn: không còn đường nào từ hồ sơ thầy tới lệnh `/hs/*` (lệnh của em, có ghi)', () => {
    for (const f of ['src/lib/ho-so-em-thay.ts', 'src/components/KhoiHoSoHocTap.tsx', 'src/screens/HocSinhScreen.tsx']) {
      const goc = fs.readFileSync(path.join(process.cwd(), f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      expect(goc, f).not.toMatch(/['"`]\/hs\//)
    }
  })
})

// ---------------------------------------------------------------- khối hồ sơ học tập
vi.mock('../src/lib/ho-so-em-thay', async (goc) => ({ ...(await goc<typeof import('../src/lib/ho-so-em-thay')>()), layHoSoNamKt: (...a: unknown[]) => m.namKt(...a), layKeHoachEm: (...a: unknown[]) => m.keHoach(...a) }))

const HN = ngayVn()
const NAMKT = { cau: [...Array(3).fill(0).map((_, i) => ({ qid: `m${i}`, trangThai: 'moi_sai', mocOnKe: HN })), { qid: 'o1', trangThai: 'dang_on', mocOnKe: '2099-01-01' }, { qid: 'k1', trangThai: 'da_khac_phuc', mocOnKe: null }] }
const KEHOACH = { ngay: HN, nganSach: { mucTieuCau: 8, phutNgay: 20 }, viec: [{ id: 'a', loai: 'btvn_lo', thuTu: 1, soCau: 6, chiTiet: { chiSo: 3, tongLo: 5 } }], tienBo: { daLamCau: 2 }, thanThu: { pet: 'Thuỷ Long', cap: 12 }, exp: { homNay: 85 } }

describe('KhoiHoSoHocTap', () => {
  afterEach(() => cleanup())
  it('có dữ liệu: bốn ô đếm, kế hoạch hôm nay, thần thú + EXP; khối "mạnh–yếu" truyền vào nằm ở cột trái', async () => {
    m.namKt.mockResolvedValue(NAMKT)
    m.keHoach.mockResolvedValue(KEHOACH)
    const { container } = render(<KhoiHoSoHocTap sbd="12001" chuyenDe={<div>KHOI MANH YEU</div>} />)
    await waitFor(() => expect([...container.querySelectorAll('.hs-o-so')].map((e) => e.textContent)).toEqual(['3', '1', '3', '1']))
    expect([...container.querySelectorAll('.hs-o-nhan')].map((e) => e.textContent)).toEqual(['mới sai', 'đang ôn', 'tới hạn hôm nay', 'đã khắc phục'])
    expect(await screen.findByText('8 câu · 20 phút/ngày')).toBeTruthy()
    expect(container.querySelector('.hs-viec')?.textContent).toContain('BTVN · lô 3/5 · 6 câu')
    expect(screen.getByText('Thuỷ Long · cấp 12')).toBeTruthy()
    expect(screen.getByText('hôm nay +85 EXP')).toBeTruthy()
    expect(container.querySelectorAll('.hs-cot')[0].textContent).toContain('KHOI MANH YEU')
  })

  it('máy chủ chưa trả lời: "đang chờ máy chủ", KHÔNG số nào bịa; đang tải thì "Đang tải…"', async () => {
    m.namKt.mockResolvedValue(null)
    m.keHoach.mockResolvedValue(null)
    const { container } = render(<KhoiHoSoHocTap sbd="12001" chuyenDe={null} />)
    expect(screen.getAllByText('Đang tải…').length).toBeGreaterThan(0)
    expect(await screen.findByText('Lịch ôn: đang chờ máy chủ.')).toBeTruthy()
    expect(screen.getByText('Kế hoạch hôm nay: đang chờ máy chủ.')).toBeTruthy()
    expect(screen.getByText('Thần thú: đang chờ máy chủ.')).toBeTruthy()
    expect(container.querySelectorAll('.hs-o-so')).toHaveLength(0)
  })

  it('các trạng thái rỗng nói đúng: chưa có câu trong hồ sơ · ngày nghỉ · chưa có việc · chưa chọn thần thú', async () => {
    m.namKt.mockResolvedValue({ cau: [] })
    m.keHoach.mockResolvedValue({ lanNghi: true, viec: [], thanThu: null })
    render(<KhoiHoSoHocTap sbd="12001" chuyenDe={null} />)
    expect(await screen.findByText('Em chưa có câu nào trong hồ sơ ôn.')).toBeTruthy()
    expect(screen.getByText('Hôm nay là ngày nghỉ của em.')).toBeTruthy()
    expect(screen.getByText('Em chưa chọn thần thú.')).toBeTruthy()
    cleanup()
    m.keHoach.mockResolvedValue({ viec: [], thanThu: null })
    render(<KhoiHoSoHocTap sbd="12001" chuyenDe={null} />)
    expect(await screen.findByText('Hôm nay chưa có việc nào cho em.')).toBeTruthy()
    cleanup()
    m.keHoach.mockResolvedValue({ chuaCo: true, ngay: '2026-09-21' }) // máy chủ chưa lập kế hoạch hôm nay
    render(<KhoiHoSoHocTap sbd="12001" chuyenDe={null} />)
    expect(await screen.findByText('Chưa có kế hoạch hôm nay của em (lập lúc 00:01 hoặc khi em mở app).')).toBeTruthy()
    expect(screen.getByText('Chưa có số liệu hôm nay.')).toBeTruthy()
  })

  it('đổi em thì tải lại đúng em đó', async () => {
    m.namKt.mockResolvedValue(NAMKT)
    m.keHoach.mockResolvedValue(KEHOACH)
    const { rerender } = render(<KhoiHoSoHocTap sbd="12001" chuyenDe={null} />)
    await waitFor(() => expect(m.namKt).toHaveBeenCalledWith('12001'))
    rerender(<KhoiHoSoHocTap sbd="12002" chuyenDe={null} />)
    await waitFor(() => expect(m.namKt).toHaveBeenCalledWith('12002'))
    expect(m.keHoach).toHaveBeenCalledWith('12002')
  })
})

// ---------------------------------------------------------------- màn Học sinh
const DS: EmTomTat[] = [{ sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1', namSinh: '2008', soCa: 2, diemGanNhat: 7.5, trangThai: 'trong_danh_sach' } as EmTomTat]
const HO_SO = {
  em: { sbd: '001', hoTen: 'Lê Minh Đức', lop: '12A1', namSinh: '2008' },
  ca: [
    { maCa: '111111', tenCa: 'Ca Ester', lanThu: 1, nopLuc: '2026-09-01T02:00:00Z', tong: 7.5, hang: 4, siSo: 30 },
    { maCa: '222222', tenCa: 'Ca Amine', lanThu: 1, nopLuc: '2026-09-03T02:00:00Z', tong: 8, hang: 2, siSo: 30 },
  ],
  chuyenDe: [{ ten: 'Ester – lipid', soCau: 12, soSai: 6, tiLeSai: 0.5, xuHuong: 'giu' }],
} as unknown as HoSoEm

vi.mock('../src/store/appStore', () => ({
  useAppStore: (sel: (s: Record<string, unknown>) => unknown) => sel({ sbdDangXem: m.sbd.v, moHoSoEm: m.moHoSoEm, showToast: vi.fn(), setScreen: m.setScreen, moChiTietCa: m.moChiTietCa }),
}))
vi.mock('../src/lib/exam-db', () => ({ loadScriptUrl: async () => 'https://x', loadTeacherSecret: async () => 'mat' }))
vi.mock('../src/lib/exam-api', async (goc) => ({
  ...(await goc<Record<string, unknown>>()),
  danhSachEm: async () => DS,
  hoSoEm: async () => HO_SO,
  deleteStudentRegistration: vi.fn(),
  loadKhoaApp: async () => null,
  saveKhoaApp: vi.fn(),
  goKhoaApp: vi.fn(),
  batKhoaApp: vi.fn(),
}))
vi.mock('../src/components/NutDongBoDanhSach', () => ({ default: () => null }))
vi.mock('../src/components/NutThemHocSinh', () => ({ default: () => null }))
vi.mock('../src/components/NutBaiTapPdf', () => ({ default: () => null }))
vi.mock('../src/components/PhieuZaloEm', () => ({ default: () => <div>KHOI PHIEU ZALO</div> }))
vi.mock('../src/components/KhoiTienBo', () => ({ default: () => <div>KHOI TIEN BO</div> }))
vi.mock('../src/components/BaoCaoCaThiHocSinhModal', () => ({
  default: (p: { onClose: () => void }) => (
    <div role="dialog" aria-label="Báo cáo thử">
      <button onClick={p.onClose}>Đóng báo cáo</button>
    </div>
  ),
}))
const { default: HocSinhScreen } = await import('../src/screens/HocSinhScreen')

describe('HocSinhScreen · hồ sơ tổng quan', () => {
  beforeEach(() => {
    m.sbd.v = ''
    m.namKt.mockResolvedValue(NAMKT)
    m.keHoach.mockResolvedValue(KEHOACH)
  })
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })
  const moHoSo = async (muc: 'ten' | 'bao-cao' = 'ten') => {
    const r = render(<HocSinhScreen />)
    await waitFor(() => expect(r.container.textContent).toContain('Lê Minh Đức'))
    fireEvent.click(muc === 'ten' ? screen.getByText('Lê Minh Đức') : screen.getByLabelText('Báo cáo của Lê Minh Đức'))
    m.sbd.v = '001'
    r.rerender(<HocSinhScreen />)
    return r
  }

  it('chạm TÊN → hồ sơ TỔNG QUAN: các khối mới hiện ngay, KHÔNG tự bật báo cáo', async () => {
    const { container } = await moHoSo('ten')
    await waitFor(() => expect(container.querySelector('.hs-viec')).toBeTruthy())
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(container.querySelectorAll('.hs-o')).toHaveLength(4)
    expect(container.querySelector('.hs-ho-so-ten')?.textContent).toBe('Lê Minh Đức')
    expect(screen.getByRole('button', { name: 'Xem báo cáo chi tiết' })).toBeTruthy()
  })

  it('nút Báo cáo (trong danh sách) vẫn MỞ BÁO CÁO như cũ; đóng báo cáo thì về hồ sơ tổng quan, không văng ra danh sách', async () => {
    await moHoSo('bao-cao')
    fireEvent.click(await screen.findByRole('button', { name: 'Đóng báo cáo' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    expect(m.moHoSoEm).not.toHaveBeenCalledWith('')
    expect(document.querySelector('.hs-ho-so-ten')).toBeTruthy()
    expect(document.querySelector('.hs-luoi')).toBeTruthy()
  })

  it('ba nút hành động: Giao bài riêng → màn Giao BTVN · Cho thi lại → mở CA GẦN NHẤT của em · Nhắn phụ huynh → hiện phiếu Zalo', async () => {
    const { container } = await moHoSo('ten')
    await waitFor(() => expect(container.querySelector('.hs-viec')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Giao bài riêng' }))
    expect(m.setScreen).toHaveBeenCalledWith('giaobtvn')
    fireEvent.click(screen.getByRole('button', { name: 'Cho thi lại' }))
    expect(m.moChiTietCa).toHaveBeenCalledWith('222222') // nộp 03/09 — muộn hơn ca 01/09
    const zalo = screen.getByText('KHOI PHIEU ZALO').parentElement as HTMLElement
    expect(zalo.style.display).toBe('none')
    fireEvent.click(screen.getByRole('button', { name: 'Nhắn phụ huynh' }))
    expect(zalo.style.display).toBe('block')
    expect(screen.getByRole('button', { name: 'Nhắn phụ huynh' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('em chưa có ca nào: nút Cho thi lại tắt (không mở ca không có)', async () => {
    const goc = HO_SO.ca
    ;(HO_SO as { ca: unknown[] }).ca = []
    const { container } = await moHoSo('ten')
    await waitFor(() => expect(container.querySelector('.hs-hanh-dong')).toBeTruthy())
    expect((screen.getByRole('button', { name: 'Cho thi lại' }) as HTMLButtonElement).disabled).toBe(true)
    ;(HO_SO as { ca: unknown }).ca = goc
  })

  it('mục Lịch sử ca thi vẫn tách riêng (không đổ khối tổng quan vào)', async () => {
    const { container } = await moHoSo('ten')
    await waitFor(() => expect(container.querySelector('.hs-viec')).toBeTruthy())
    fireEvent.click(screen.getByRole('tab', { name: /Lịch sử ca thi/ }))
    expect(container.textContent).toContain('Ca Ester')
    expect(container.querySelector('.hs-luoi')).toBeNull()
  })

  it('mọi nút cũ trong hồ sơ còn: Reset mật khẩu · Xoá em khỏi danh sách · Danh sách học sinh (quay lại)', async () => {
    const { container } = await moHoSo('ten')
    await waitFor(() => expect(container.querySelector('.hs-viec')).toBeTruthy())
    expect(screen.getByRole('button', { name: /Reset mật khẩu \(12121212\)/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Xoá em khỏi danh sách/ })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Danh sách học sinh/ }))
    expect(m.moHoSoEm).toHaveBeenCalledWith('')
  })
})

describe('nguồn: màn Học sinh hết hex + lớp Tailwind màu rời', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'src/screens/HocSinhScreen.tsx'), 'utf8')
  const css = fs.readFileSync(path.join(process.cwd(), 'src/screens/hoc-sinh-m3.css'), 'utf8')
  it('HocSinhScreen.tsx: không hex, không bg-/text-/border- theo dải màu Tailwind', () => {
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(src).not.toMatch(/\b(?:bg|text|border|from|via|to|ring)-(?:slate|blue|indigo|emerald|rose|amber)-\d{2,3}/)
    expect(src).toContain("import './hoc-sinh-m3.css'")
  })
  it('hoc-sinh-m3.css: chỉ token, không hex, không !important', () => {
    expect(css).not.toMatch(/#[0-9a-fA-F]{3,8}\b/)
    expect(css).not.toContain('!important')
  })
})
