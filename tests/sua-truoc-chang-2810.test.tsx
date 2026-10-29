// SỬA XONG MỚI MỞ CHẶNG SAU (thầy 28/10 «Tôi muốn sửa phải xong mới hiện chặng sau»): Lộ trình khoá các chặng nằm sau nút Tự sửa lỗi tới khi phần ngày
// (12 câu đầu của việc hôm nay) xong; «Sửa thêm 1 chặng» không khoá lại; thiếu số ⇒ không khoá; Kiểm tra ôn tập đang khoá thì khoá kiểm tra đứng trên.
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi: vi.fn() }))
const SO = vi.hoisted(() => ({ con: 8 as number | null, phan: 8 as number | null, bao: vi.fn() }))
vi.mock('../src/components/hoc-tap/ManTuChua', () => ({
  dungViecHomNay: () => ({ viec: {}, luu: null }), luuViecHomNay: () => {}, docSbdHs: () => 'S1',
  conSuaHomNay: () => SO.con, conSuaPhanNgay: () => SO.phan, baoKhoaSua: SO.bao, ngheXongSua: () => () => {},
}))
import { MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'

const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 20, onChua: noop, ngayKiem: false, soBaiTap: 0, coBaiTap: false, onBaiTap: noop, ghi: [], ...them,
})
const ngay = new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10)
const nhan = () => within(screen.getByRole('list', { name: 'Lộ trình hôm nay' })).getAllByRole('listitem').map((li) => li.firstElementChild!.getAttribute('aria-label'))
const KHOA = 'Chặng 5: khoá đến khi sửa xong lỗi hôm nay'
afterEach(() => { cleanup(); vi.unstubAllGlobals(); SO.con = 8; SO.phan = 8; SO.bao.mockReset(); try { localStorage.clear() } catch { /* bỏ qua */ } })

describe('Lộ trình: khoá chặng sau nút Tự sửa lỗi', () => {
  it('phần ngày còn 8 câu ⇒ chặng NẰM SAU nút Sửa lỗi khoá xám (thẻ «Sửa xong 8 lỗi hôm nay…»); chặng trước nút vẫn học được; chưa tới nút ⇒ chưa báo máy chủ', async () => {
    render(<MotTrangHs {...goc()} />)
    await waitFor(() => expect(nhan()).toContain(KHOA))
    expect(nhan()).toEqual(['Chặng 1: đã xong', 'Chặng 2: đã xong', 'Học tiếp · 18 câu', 'Rương hôm nay', 'Chặng 4: chưa mở', 'Tự sửa lỗi: hôm nay còn 8 câu', KHOA])
    fireEvent.click(screen.getByRole('button', { name: KHOA }))
    const the = screen.getByRole('dialog')
    expect(the.getAttribute('data-sac')).toBe('khoa')
    expect(the.textContent).toContain('Sửa xong 8 lỗi hôm nay để mở chặng tiếp')
    expect(within(the).queryByRole('button')).toBeNull()
    expect(SO.bao).not.toHaveBeenCalled()
  })

  it('tới nút Sửa lỗi (đã qua mốc) ⇒ mọi chặng chưa xong phía sau khoá, bong bóng chỉ ở nút Sửa lỗi, báo máy chủ; về 0 ⇒ mở + vỡ khoá MỘT lần', async () => {
    localStorage.setItem('ddh.moc-sua', JSON.stringify({ ngay, tong: 5, sau: 2 }))
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {} }))
    const animCu = Element.prototype.animate
    Element.prototype.animate = vi.fn(() => ({ cancel() {}, finished: Promise.resolve() })) as unknown as typeof Element.prototype.animate
    onTestFinished(() => { Element.prototype.animate = animCu })
    const { rerender, container } = render(<MotTrangHs {...goc()} />)
    await waitFor(() => expect(SO.bao).toHaveBeenCalled())
    expect(nhan()).toEqual(['Chặng 1: đã xong', 'Chặng 2: đã xong', 'Tự sửa lỗi: hôm nay còn 8 câu', 'Chặng 3: khoá đến khi sửa xong lỗi hôm nay', 'Rương hôm nay',
      'Chặng 4: khoá đến khi sửa xong lỗi hôm nay', KHOA])
    const sua = screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay còn 8 câu' })
    expect(sua.getAttribute('data-tt')).toBe('dang')
    expect(sua.querySelector('.da-bong')!.textContent).toBe('Sửa lỗi')
    expect(container.querySelectorAll('.da-bong')).toHaveLength(1)
    expect(localStorage.getItem('ddh.sua-khoa')).toBe(ngay)
    // sửa xong phần ngày ⇒ mở, nút ✓, chặng 3 (vừa mở) vỡ khoá
    SO.con = 0; SO.phan = 0
    rerender(<MotTrangHs {...goc({ ghi: ['x'] })} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' }).getAttribute('data-tt')).toBe('dang'))
    expect(screen.getByRole('button', { name: 'Tự sửa lỗi: hôm nay đã sửa xong' }).getAttribute('data-tt')).toBe('xong')
    await waitFor(() => expect(container.querySelectorAll('.da-vo-khoa')).toHaveLength(1))
    expect(localStorage.getItem('ddh.sua-khoa')).toBeNull()
  })

  it('«Sửa thêm 1 chặng» (còn 4 câu thêm, phần ngày 0) ⇒ KHÔNG khoá lại; thiếu số việc hôm nay ⇒ không khoá', async () => {
    SO.con = 4; SO.phan = 0
    const { unmount } = render(<MotTrangHs {...goc()} />)
    await waitFor(() => expect(nhan()).toContain('Chặng 5: chưa mở'))
    expect(nhan().some((x) => /sửa xong lỗi/.test(x!))).toBe(false)
    unmount()
    SO.con = null; SO.phan = null
    render(<MotTrangHs {...goc()} />)
    await waitFor(() => expect(nhan()).toContain('Chặng 5: chưa mở'))
  })

  it('có cả Kiểm tra ôn tập đang mở ⇒ khoá kiểm tra đứng trên (chặng + Sửa lỗi khoá theo kiểm tra)', async () => {
    const mo = Date.parse(`${ngay}T00:00:00+07:00`)
    const KIEM: TomTatKiemTra = { id: 'k', ngay, moLuc: mo, hanLuc: mo + 86400_000, serverNow: Date.now(), trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12,
      tong: 28, daTra: 0, con: 28, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }
    render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra: noop })} />)
    await waitFor(() => expect(nhan()).toContain('Tự sửa lỗi: khoá đến khi làm xong Kiểm tra ôn tập'))
    expect(nhan()[0]).toMatch(/^Kiểm tra ôn tập/)
    expect(nhan().filter((x) => /khoá đến khi làm xong Kiểm tra ôn tập/.test(x!))).toHaveLength(4)
    expect(SO.bao).not.toHaveBeenCalled()
  })
})

describe('Sảnh chưa về (ảnh thầy 28/10 giờ cao điểm: Lộ trình chỉ có nút Sửa lỗi)', () => {
  it('đang tải, chưa có số ⇒ báo «Đang tải bài học hôm nay…», CHƯA vẽ đường (không chỉ còn nút Sửa lỗi); có số ⇒ đường như cũ', async () => {
    const { rerender } = render(<MotTrangHs {...goc({ so: null, dangTai: true })} />)
    expect(screen.getByRole('status').textContent).toBe('Đang tải bài học hôm nay…')
    expect(screen.queryByRole('list', { name: 'Lộ trình hôm nay' })).toBeNull()
    rerender(<MotTrangHs {...goc()} />)
    await waitFor(() => expect(nhan()).toContain('Tự sửa lỗi: hôm nay còn 8 câu'))
    expect(screen.queryByText('Đang tải bài học hôm nay…')).toBeNull()
  })
})
