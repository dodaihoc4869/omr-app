// HÔM NAY «MỘT TRANG» + MENU DỌC (Điểm danh, A.I Đỗ Đại Học) của app học sinh — bản vẽ ve-moi/hs-mot-trang*.html, thầy chốt 26/10.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
import { MenuDocTrong, MotTrangHs, type PropsMotTrang } from '../src/components/hoc-tap/TrongHs'
import type { TomTatKiemTra } from '../src/lib/kiem-tra-ca-nhan'

const traLoi = (o: unknown) => new Response(JSON.stringify(o), { status: 200, headers: { 'content-type': 'application/json' } })
const noop = () => {}
const goc = (them: Partial<PropsMotTrang> = {}): PropsMotTrang => ({
  so: { daLam: 12, muc: 30, chang: 3, soChang: 5 } as PropsMotTrang['so'], dangTai: false, tenBai: 'Ester – Lipid', viec: 'Hiểu · Chặng 3/5',
  onHoc: noop, khoaHoc: false, hetCau: false, coCa: false, onThi: noop, soSua: 5, onChua: noop, ngayKiem: false, soBaiTap: 1, coBaiTap: true, onBaiTap: noop, ghi: [], ...them,
})
const mo = Date.parse('2026-10-26T00:00:00+07:00')
const KIEM: TomTatKiemTra = { id: 'k', ngay: '2026-10-26', moLuc: mo, hanLuc: mo + 86400_000, serverNow: mo + 3600_000, trangThai: 'can_lam', homNay: true, baiNgayToiThieu: 12,
  tong: 28, daTra: 0, con: 28, soChang: 4, phut: 50, soBai: 6, tongKienThuc: 10, phuDe: 10, nguonDayDu: true, lyDo: '', thieuNguon: 0, diem: null, nopLuc: null }

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.history.replaceState(null, '', '/') })

// 26/10 tối (thầy chốt bản vẽ ve-moi/dm-*.html — hướng Duolingo + chất Hoá): Hôm nay «Một trang» nay là LỘ TRÌNH — con đường chặng giữ ĐÚNG thứ tự việc
// (học → Kiểm tra ôn tập → Tự sửa lỗi → Bài tập về nhà; ca đang mở / ngày chỉ kiểm tra như cũ), cùng nút, cùng lệnh. Luyện tập / Thành tích là hai mục còn lại.
const duong = () => screen.getByRole('list', { name: 'Lộ trình hôm nay' })
const nut = () => within(duong()).getAllByRole('listitem').map((li) => (li.firstElementChild as HTMLElement))
const HS = { lop: '12A1', onXemLai: noop, onTuLuyen: noop, onLichSu: noop, onKetQua: noop }

describe('Lộ trình (Hôm nay kiểu Duolingo)', () => {
  it('đang học: chặng hiện tại là nút «Học tiếp · 18 câu» có bong bóng; sau các chặng là Kiểm tra ôn tập → Tự sửa lỗi → Bài tập về nhà; thanh số trên', () => {
    const onHoc = vi.fn()
    render(<MotTrangHs {...goc({ kiem: KIEM, onKiemTra: noop, onHoc, hs: HS })} />)
    const ds = nut()
    expect(ds.map((n) => n.getAttribute('aria-label'))).toEqual(['Chặng 1: đã xong', 'Chặng 2: đã xong', 'Học tiếp · 18 câu', 'Chặng 4: chưa mở', 'Chặng 5: chưa mở',
      'Kiểm tra ôn tập: 28 câu · khoảng 50 phút · hạn nộp 24:00', 'Tự sửa lỗi: 5 câu', 'Bài tập về nhà'])
    fireEvent.click(screen.getByRole('button', { name: 'Học tiếp · 18 câu' }))
    expect(onHoc).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Học tiếp · 18 câu' }).textContent).toContain('Bắt đầu') // chặng 3 chưa làm câu nào
    expect(screen.getByLabelText('12/30 câu hôm nay')).toBeTruthy()
    expect(screen.getByLabelText('Khối 12')).toBeTruthy()
    expect(screen.getByText('Ester – Lipid')).toBeTruthy()
    expect(screen.getByText('2/5 chặng')).toBeTruthy()
  })

  it('ca kiểm tra đang mở ⇒ băng ca + nút Vào ca kiểm tra ở đầu, đường chặng mờ đi', () => {
    const onThi = vi.fn()
    render(<MotTrangHs {...goc({ coCa: true, onThi })} />)
    fireEvent.click(within(screen.getByRole('region', { name: 'Ca kiểm tra đang mở' })).getByRole('button', { name: /Vào ca kiểm tra/ }))
    expect(onThi).toHaveBeenCalledOnce()
    expect(duong().closest('.da-duong')!.hasAttribute('data-mo-di')).toBe(true)
  })

  it('đủ mức ⇒ băng «Đủ 30/30 câu hôm nay!», Tự sửa lỗi là nút hiện tại, «Học thêm câu mới» thành liên kết', () => {
    const onChua = vi.fn(), onHoc = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], onChua, onHoc })} />)
    const bang = screen.getByRole('region', { name: 'Đủ mức hôm nay' })
    expect(bang.textContent).toContain('Đủ 30/30 câu hôm nay!')
    expect(bang.textContent).toContain('Tiếp theo: Tự sửa lỗi, rồi Bài tập về nhà')
    const sua = screen.getByRole('button', { name: 'Tự sửa lỗi: 5 câu' })
    expect(sua.getAttribute('data-tt')).toBe('dang')
    fireEvent.click(sua)
    fireEvent.click(screen.getByRole('button', { name: /Học thêm câu mới/ }))
    expect(onChua).toHaveBeenCalledOnce()
    expect(onHoc).toHaveBeenCalledOnce()
  })

  it('đủ mức + còn Kiểm tra ôn tập phải làm ⇒ kiểm tra là nút hiện tại, rồi mới tới Tự sửa lỗi (thầy 26/10)', () => {
    const onKiemTra = vi.fn()
    render(<MotTrangHs {...goc({ so: { daLam: 30, muc: 30, chang: 5, soChang: 5 } as PropsMotTrang['so'], kiem: { ...KIEM, homNay: true, trangThai: 'can_lam', nopLuc: null }, onKiemTra })} />)
    const kiem = within(duong()).getByRole('button', { name: /^Kiểm tra ôn tập/ })
    expect(kiem.getAttribute('data-tt')).toBe('dang')
    expect(screen.getByRole('region', { name: 'Đủ mức hôm nay' }).textContent).toContain('Tiếp theo: Kiểm tra ôn tập, rồi Tự sửa lỗi')
    fireEvent.click(kiem)
    expect(onKiemTra).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Tự sửa lỗi: 5 câu' }).getAttribute('data-tt')).toBe('mo')
  })

  it('ngày chỉ có Kiểm tra ôn tập ⇒ đường chỉ một nút kiểm tra, không băng bài', () => {
    render(<MotTrangHs {...goc({ kiem: { ...KIEM, baiNgayToiThieu: undefined }, ngayKiem: true, onKiemTra: noop })} />)
    expect(nut()).toHaveLength(1)
    expect(nut()[0]!.getAttribute('aria-label')).toMatch(/^Kiểm tra ôn tập/)
    expect(screen.queryByRole('region', { name: 'Bài học hôm nay' })).toBeNull()
  })

  it('Luyện tập: mỗi việc một ô to có số (Tự sửa lỗi nổi đỏ khi còn câu); Thành tích: chuỗi ngày + lối vào điểm đã công bố', () => {
    const onXemLai = vi.fn(), onLichSu = vi.fn()
    const { unmount } = render(<MotTrangHs {...goc({ muc: 'on-lai', kiem: KIEM, onKiemTra: noop, hs: { ...HS, onXemLai } })} />)
    expect(screen.getByRole('heading', { name: 'Luyện tập' })).toBeTruthy()
    expect(screen.getByRole('button', { name: /^Tự sửa lỗi/ }).hasAttribute('data-noi')).toBe(true)
    expect(screen.getAllByRole('button', { name: /^Kiểm tra ôn tập/ })[0]!.textContent).toContain('0/28')
    fireEvent.click(screen.getByRole('button', { name: /^Câu đã làm/ }))
    expect(onXemLai).toHaveBeenCalledOnce()
    unmount()
    render(<MotTrangHs {...goc({ muc: 'ket-qua', hs: { ...HS, onLichSu } })} />)
    expect(screen.getByRole('heading', { name: 'Thành tích' })).toBeTruthy()
    expect(screen.getByText('0 ngày')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /^Ca kiểm tra/ }))
    expect(onLichSu).toHaveBeenCalledOnce()
  })
})

describe('Menu dọc «Một trang»: Điểm danh đầu menu, A.I Đỗ Đại Học', () => {
  const menu = (them: { moDiemDanh?: boolean } = {}) => render(<MenuDocTrong muc="hom-nay" ds={[]} onMuc={noop} coCa={false} onThi={noop} dangTai={false} onTaiLai={noop}
    chuDau="MA" moCuaEm={false} onCuaEm={noop} nutCuaEm={createRef()} token="tk" moDiemDanh={them.moDiemDanh ?? true} />)

  it('buổi đang mở ⇒ vạch thò «Điểm danh», khối chàm gửi mã bằng ĐÚNG lệnh /hs/diem-danh ⇒ «Đã điểm danh» kèm giờ', async () => {
    const f = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith('/hs/buoi-hoc')) return traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: false } })
      if (url.endsWith('/hs/diem-danh')) { expect(JSON.parse(String(init?.body))).toEqual({ token: 'tk', ma: '482915' }); return traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: true } }) }
      return traLoi({ ok: false })
    })
    vi.stubGlobal('fetch', f)
    menu()
    fireEvent.click(await screen.findByRole('button', { name: 'Mở menu · Buổi học đang mở điểm danh' }))
    const khoi = screen.getByRole('form', { name: 'Điểm danh buổi học' })
    expect(within(khoi).getByText('Buổi 26/10')).toBeTruthy()
    fireEvent.change(within(khoi).getByLabelText('Mã 6 số trên máy chiếu'), { target: { value: '482 915' } })
    fireEvent.click(within(khoi).getByRole('button', { name: 'Điểm danh' }))
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
    expect(screen.getByText('Buổi 26/10 · 12A1')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeTruthy()
  })

  it('không có buổi ⇒ khối xám; QR ?diem-danh= vẫn tự gửi một lần và mở menu', async () => {
    window.history.replaceState(null, '', '/hs?diem-danh=482915')
    const f = vi.fn(async (url: string) => (url.endsWith('/hs/diem-danh') ? traLoi({ ok: true, buoi: { id: 'B1', ten: 'Buổi học 26/10/2026', lop: '12A1', daDiemDanh: true } }) : traLoi({ ok: true, buoi: null })))
    vi.stubGlobal('fetch', f)
    menu()
    expect(await screen.findByText('Đã điểm danh')).toBeTruthy()
    expect(window.location.search).toBe('')
    expect(f.mock.calls.filter(([u]) => String(u).endsWith('/hs/diem-danh')).length).toBe(1)
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Điều hướng học sinh' }).hasAttribute('data-mo')).toBe(true))
    cleanup()
    menu()
    expect(await screen.findByText('Chưa có buổi học nào đang mở')).toBeTruthy()
  })

  it('mục A.I Đỗ Đại Học bắn sự kiện mở ĐÚNG tấm chat của BongBongAiDdh', () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const nghe = vi.fn()
    window.addEventListener('ddh:mo-ai', nghe)
    menu({ moDiemDanh: false })
    fireEvent.click(screen.getByRole('button', { name: 'A.I Đỗ Đại Học' }))
    window.removeEventListener('ddh:mo-ai', nghe)
    expect(nghe).toHaveBeenCalledOnce()
  })
})
