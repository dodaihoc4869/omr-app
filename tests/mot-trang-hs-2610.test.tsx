// HÔM NAY «MỘT TRANG» + MENU DỌC (Điểm danh, A.I Đỗ Đại Học) của app học sinh — bản vẽ ve-moi/hs-mot-trang*.html, thầy chốt 26/10.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { NHIP_EM_LUOI } from '../scripts/chup-v2/gia/nhip-hoc-em'
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { createRef } from 'react'
vi.mock('../src/lib/dia-chi-may-chu', () => ({ layDiaChiMayChu: async () => 'https://may-chu' }))
const phanHoi = vi.hoisted(() => vi.fn())
vi.mock('../src/lib/phan-hoi', () => ({ phanHoi }))
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
  it('lời Bi trọn câu (soát 27/10: ảnh chụp lúc đang gõ trông «cụt» ở chữ «là»): câu đủ ý và gõ xong trong ≤ 0,7 s', () => {
    vi.useFakeTimers()
    try {
      const { container } = render(<MotTrangHs {...goc()} />)
      const bong = container.querySelector('.bi-loi-bong')!
      expect(bong.querySelector('.ht2-an')!.textContent).toBe('Học tiếp nhé! Còn 18 câu nữa là đủ mức hôm nay.')
      act(() => { vi.advanceTimersByTime(750) })
      expect(bong.querySelector('.bi-loi-con')!.textContent).toBe('')
      expect(bong.querySelector('[aria-hidden="true"]')!.textContent).toBe('Học tiếp nhé! Còn 18 câu nữa là đủ mức hôm nay.')
    } finally { vi.useRealTimers() }
  })
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

describe('Hệ lười chỉ thầy / phụ huynh xem (thầy 26/10)', () => {
  it('Lộ trình + Thành tích: máy chủ CŨ còn gửi nhóm Lười / bậc 1 ⇒ em chỉ thấy «Chuỗi N ngày» + việc tiếp trung tính, không chữ / màu nhóm, bậc', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ...NHIP_EM_LUOI, bacCham: { bac: 1, diem: 0, diemLenBac: 3 }, doTinCay: 80 })))
    for (const muc of ['hom-nay', 'ket-qua']) {
      const { container, unmount } = render(<MotTrangHs {...goc({ muc, token: 'tk', hs: HS })} />)
      // Gộp thưởng phạt 26/10: ở Lộ trình thẻ «việc tiếp» nhường chỗ thẻ bên Giải tuần + Nhiệm vụ (bản vẽ tp-4) — Thành tích vẫn giữ.
      if (muc === 'ket-qua') {
        const the = await screen.findByText(/^Việc tiếp:/)
        expect(the.closest('.dm-the')!.querySelector('h3')!.textContent).toMatch(/^Chuỗi \d+ ngày$/)
      } else await screen.findByLabelText('Bài học hôm nay')
      expect(container.textContent).not.toMatch(/lười|chăm|chưa đều|bậc|đối phó|học thật|bấm vội|treo|quá nhanh/i)
      expect(container.innerHTML).not.toMatch(/data-nhom|da-12|da-bac/)
      unmount()
    }
  })
})

describe('Menu dọc «Một trang» — MENU 6 MỤC (thầy 27/10): Điểm danh chỉ khi có buổi mở, chuông ở đầu menu, Cài đặt là tấm con', () => {
  const chuong = <div className="m3-tb"><button type="button" className="m3-tb-chuong" aria-label="Thông báo, 2 chưa đọc"><span className="m3-tb-dem">2</span></button></div>
  const menu = (them: { moDiemDanh?: boolean; coCa?: boolean; onThi?: () => void; onMuc?: (id: string) => void; onTaiLai?: () => void; onCuaEm?: () => void } = {}) => render(<MenuDocTrong muc="hom-nay" ds={[]}
    onMuc={them.onMuc ?? noop} coCa={them.coCa ?? false} onThi={them.onThi ?? noop} dangTai={false} onTaiLai={them.onTaiLai ?? noop} thongBao={chuong}
    chuDau="MA" moCuaEm={false} onCuaEm={them.onCuaEm ?? noop} nutCuaEm={createRef()} token="tk" moDiemDanh={them.moDiemDanh ?? true} />)
  const nav = () => screen.getByRole('navigation', { name: 'Điều hướng học sinh' })

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

  it('không có buổi ⇒ KHÔNG có khối Điểm danh; QR ?diem-danh= vẫn tự gửi một lần và mở menu', async () => {
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
    await waitFor(() => expect(f.mock.calls.filter(([u]) => String(u).endsWith('/hs/buoi-hoc')).length).toBeGreaterThan(1))
    await new Promise((r) => setTimeout(r, 0))
    expect(screen.queryByLabelText('Điểm danh buổi học')).toBeNull()
    expect(screen.queryByText(/Chưa có buổi học/)).toBeNull()
    expect(nav().hasAttribute('data-dd')).toBe(false)
    expect(screen.getByRole('button', { name: 'Mở menu' })).toBeTruthy()
  })

  it('đúng 6 mục theo thứ tự, mỗi mục một ô biểu tượng; chuông ở đầu menu; Ca kiểm tra gọi onThi (ẩn khi ca đang mở); chạm mục ⇒ phanHoi(chon)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    phanHoi.mockClear()
    const onThi = vi.fn(), onMuc = vi.fn()
    const { unmount } = menu({ moDiemDanh: false, onThi, onMuc })
    const muc = () => within(nav()).getAllByRole('button').filter((b) => b.classList.contains('tr-menu-muc'))
    expect(muc().map((b) => b.textContent)).toEqual(['Lộ trình', 'Luyện tập', 'Thành tích', 'Ca kiểm tra', 'Hỏi A.I Đỗ Đại Học', 'Cài đặt'])
    expect(muc().every((b) => b.querySelector('.tr-menu-o'))).toBe(true)
    expect(within(nav()).getByRole('button', { name: 'Lộ trình' }).getAttribute('aria-current')).toBe('page')
    expect(nav().querySelector('.tr-menu-ds hr')).toBeNull() // không vạch ngăn giữa 6 mục
    // chuông THẬT nằm ở hàng đầu menu, cạnh «Đỗ Đại Học»
    expect(nav().querySelector('.tr-menu-dau .tr-menu-tb .m3-tb-chuong')).not.toBeNull()
    expect(nav().querySelector('.tr-menu-dau')!.textContent).toContain('Đỗ Đại Học')
    fireEvent.click(within(nav()).getByRole('button', { name: 'Ca kiểm tra' }))
    expect(onThi).toHaveBeenCalledOnce()
    fireEvent.click(within(nav()).getByRole('button', { name: 'Thành tích' }))
    expect(onMuc).toHaveBeenCalledWith('ket-qua')
    await waitFor(() => expect(phanHoi).toHaveBeenCalled())
    expect(phanHoi).toHaveBeenCalledWith('chon')
    unmount()
    menu({ moDiemDanh: false, coCa: true })
    expect(within(nav()).queryByRole('button', { name: 'Ca kiểm tra' })).toBeNull()
  })

  it('Cài đặt mở tấm con (Âm thanh · Rung · Cập nhật bài học · Của em), Quay lại / Esc về 6 mục; công tắc ghi localStorage ddh.am / ddh.rung (mặc định Bật)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const onTaiLai = vi.fn(), onCuaEm = vi.fn()
    menu({ moDiemDanh: false, onTaiLai, onCuaEm })
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    expect(screen.queryByRole('switch', { name: /Âm thanh/ })).toBeNull() // tấm con chưa mở ⇒ công tắc ẩn
    const cai = within(nav()).getByRole('button', { name: 'Cài đặt' })
    expect(cai.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(cai)
    const tam = screen.getByRole('group', { name: 'Cài đặt' })
    expect(within(nav()).queryByRole('button', { name: 'Lộ trình' })).toBeNull()
    await waitFor(() => expect(document.activeElement).toBe(within(tam).getByRole('button', { name: 'Quay lại menu' })))
    expect(within(tam).getByRole('button', { name: 'Cập nhật bài học' })).toBeTruthy()
    expect(within(tam).getByRole('button', { name: 'Của em' }).getAttribute('aria-haspopup')).toBe('dialog')
    const am = within(tam).getByRole('switch', { name: /Âm thanh/ }), ru = within(tam).getByRole('switch', { name: /Rung/ })
    expect(am.getAttribute('aria-checked')).toBe('true')
    fireEvent.click(am); fireEvent.click(ru)
    expect(localStorage.getItem('ddh.am')).toBe('tat'); expect(localStorage.getItem('ddh.rung')).toBe('tat')
    fireEvent.click(am)
    expect(localStorage.getItem('ddh.am')).toBeNull()
    localStorage.clear()
    // Esc ở tấm con ⇒ về 6 mục (menu vẫn mở), tiêu điểm về «Cài đặt»; Esc lần nữa ⇒ menu thu
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('group', { name: 'Cài đặt' })).toBeNull()
    expect(nav().hasAttribute('data-mo')).toBe(true)
    await waitFor(() => expect(document.activeElement).toBe(within(nav()).getByRole('button', { name: 'Cài đặt' })))
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quay lại menu' }))
    expect(within(nav()).getByRole('button', { name: 'Lộ trình' })).toBeTruthy()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(nav().hasAttribute('data-mo')).toBe(false)
    // Cập nhật bài học / Của em giữ nguyên hành vi
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    expect(within(nav()).getByRole('button', { name: 'Lộ trình' })).toBeTruthy() // mở lại ⇒ luôn về 6 mục
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cập nhật bài học' }))
    expect(onTaiLai).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Mở menu' }))
    fireEvent.click(within(nav()).getByRole('button', { name: 'Cài đặt' }))
    fireEvent.click(screen.getByRole('button', { name: 'Của em' }))
    expect(onCuaEm).toHaveBeenCalledOnce()
  })

  it('mục Hỏi A.I Đỗ Đại Học bắn sự kiện mở ĐÚNG tấm chat của BongBongAiDdh', () => {
    vi.stubGlobal('fetch', vi.fn(async () => traLoi({ ok: true, buoi: null })))
    const nghe = vi.fn()
    window.addEventListener('ddh:mo-ai', nghe)
    menu({ moDiemDanh: false })
    fireEvent.click(within(document.getElementById('tr-menu')!).getByRole('button', { name: 'Hỏi A.I Đỗ Đại Học' }))
    expect(nghe).toHaveBeenCalledOnce()
    // khung thấp xoay ngang: dải biểu tượng có cùng lối A.I + 3 mục chính (dọc: dải bị CSS ẩn)
    fireEvent.click(document.querySelector('.tr-menu-ray .tr-ray-ai')!)
    window.removeEventListener('ddh:mo-ai', nghe)
    expect(nghe).toHaveBeenCalledTimes(2)
    expect([...document.querySelectorAll('.tr-menu-ray .tr-ray-muc')].map((b) => b.getAttribute('aria-label'))).toEqual(['Lộ trình', 'Luyện tập', 'Thành tích', 'A.I Đỗ Đại Học'])
    expect(document.querySelector('.tr-menu-ray .tr-menu-cham')).not.toBeNull()
  })
})
